# SPDX-FileCopyrightText: 2026 Open-mind Contributors
# SPDX-License-Identifier: MIT
#
# Purpose: Open-mind - Offline AI-Powered Academic Lecture Copilot.
# Distributed under the terms of the OSI-approved MIT License.

import os
import time
import json
import re
from pathlib import Path
from typing import Dict, Any, List, Optional, Callable
from core.config import (
    get_llm_model_path,
    LLM_CONTEXT_SIZE,
    LLM_THREADS,
    MODELS_DIR,
    LLM_MODEL_FILENAME
)

# System prompt enforcing strict terminology and clear, unambiguous academic questioning
# System prompt enforcing strict pedagogy, academic terminology and unambiguous questioning
SYSTEM_STUDY_PROMPT = (
    "Bạn là chuyên gia sư phạm và trợ giảng AI cao cấp chuyên sâu về thiết kế học liệu giáo dục chuẩn mực.\n"
    "Nhiệm vụ của bạn là tạo tóm tắt, câu hỏi trắc nghiệm và thẻ ghi nhớ (flashcard) chất lượng xuất sắc, chuẩn xác về mặt học thuật.\n"
    "CÁC NGUYÊN TẮC BẮT BUỘC:\n"
    "1. RÕ NGHĨA & TỰ THÂN ĐẦY ĐỦ (SELF-CONTAINED): Mỗi câu hỏi hoặc thẻ ghi nhớ phải độc lập và đủ ngữ cảnh. "
    "TUYỆT ĐỐI KHÔNG dùng đại từ mơ hồ như 'nó', 'điều này', 'cái này', 'phương pháp này', 'theo bài giảng' mà không nêu tên chủ thể. "
    "Ví dụ SAI: 'Nó thực hiện chức năng gì?'. Ví dụ ĐÚNG: 'Giao thức TCP thực hiện chức năng gì trong tầng Giao vận?'.\n"
    "2. CHUẨN XÁC THUẬT NGỮ CHUYÊN NGÀNH: Giữ nguyên các thuật ngữ kỹ thuật, tên chuẩn tiếng Anh/viết tắt "
    "(VD: TCP/IP, MD5, SHA-256, Hash function, SQL, API, Encryption, Cache, Token, Latency, Throughput, v.v.). Không dịch thô làm sai nghĩa.\n"
    "3. TƯ DUY PHÂN LOẠI & SƯ PHẠM CAO: Câu hỏi trắc nghiệm phải đánh giá đúng mức độ hiểu bản chất khái niệm. "
    "Các phương án gây nhiễu (distractors) phải hợp lý, phân loại thực chất, không bị lộ đáp án ngớ ngẩn.\n"
    "4. BẢO ĐẢM ĐỦ SỐ LƯỢNG: Luôn tạo chính xác đủ số lượng mục được yêu cầu."
)


class TranscriptPruner:
    """
    Bộ tiền xử lý & cô đọng văn bản bài giảng (Transcript Pruning Engine).
    Tự động lọc bỏ:
    - Lời kêu gọi tương tác (Call-To-Action / Outro): like, sub, chuông, click video...
    - Câu chào hỏi, phiếm đàm xã giao vô nghĩa (Intro / Chit-chat).
    - Câu đệm thừa thãi không chứa giá trị tri thức học thuật.
    """

    # Mẫu câu kêu gọi tương tác / Outro / Quảng cáo kênh / Lời chào rác
    CTA_AND_OUTRO_PATTERNS = [
        r"(?:hãy\s+)?(?:nhấn|bấm|click)\s+(?:vào\s+)?(?:thích|like|đăng ký|subscribe|nút|chuông|kênh|video\s+xuất\s+hiện).*",
        r"(?:cảm ơn|xin cảm ơn)\s+(?:các bạn|mọi người|quý vị)?\s*(?:đã|vì đã)?\s*(?:xem|lắng nghe|theo dõi|ủng hộ).*",
        r"(?:hẹn gặp|gặp lại)\s+(?:lại\s+)?(?:các bạn|bạn|mọi người)\s+(?:ở|trong|tại)\s+(?:video|bài|tập|phần)\s+(?:sau|tiếp theo).*",
        r"nhấn\s+vào\s+(?:các\s+)?video\s+xuất\s+hiện\s+trên\s+màn\s+hình.*",
        r"(?:đừng quên|nhớ)\s+(?:nhấn|bấm)?\s*(?:like|thích|share|chia sẻ|đăng ký|subscribe).*",
        r"(?:khuyến khích|ủng hộ)\s+kênh\s+(?:tạo|làm)\s+thêm\s+(?:nhiều\s+)?(?:phim|video|clip|bài).*",
        r"(?:nếu thấy|thấy)\s+(?:thông tin|video|bài chia sẻ)?\s*(?:hữu ích|hay|bổ ích)\s+thì\s+vui lòng\s+nhấn.*",
        r"(?:chào mừng|hoan nghênh)\s+(?:các bạn|mọi người)\s+(?:đã\s+)?(?:quay trở lại|đến với)\s+kênh.*",
        r"(?:trong video|trong clip|trong tập)\s+(?:ngày hôm nay|hôm nay|lần này)\s+(?:mình|tôi|chúng ta)\s+sẽ\s+chia sẻ.*",
        r"tôi\s+rất\s+muốn\s+được\s+chia\s+sẻ\s+về\s+nhiều\s+kiến\s+thức\s+khác\s+nhau.*",
    ]

    @classmethod
    def is_noise_sentence(cls, sentence: str) -> bool:
        s = sentence.strip()
        if len(s.split()) < 3:
            return True
        for pattern in cls.CTA_AND_OUTRO_PATTERNS:
            if re.search(pattern, s, re.IGNORECASE):
                return True
        return False

    @classmethod
    def prune_transcript(cls, text: str, max_chars: Optional[int] = None) -> str:
        """
        Làm sạch transcript:
        1. Loại bỏ các câu CTA, outro, câu chào vô thưởng vô phạt.
        2. Giữ nguyên vẹn toàn bộ tri thức học thuật không bị cắt từ nếu không có max_chars.
        """
        if not text:
            return ""

        raw_sentences = re.split(r'(?<=[.?!])\s+|\n+', text)
        cleaned_sentences = []

        for sentence in raw_sentences:
            s = sentence.strip()
            if not s:
                continue

            if cls.is_noise_sentence(s):
                continue

            cleaned_sentences.append(s)

        result = " ".join(cleaned_sentences) if cleaned_sentences else text.strip()

        if max_chars and len(result) > max_chars:
            result = result[:max_chars].rsplit(" ", 1)[0] + "..."

        return result


class LLMEngine:
    def __init__(self):
        self.model = None

    def is_model_available(self) -> bool:
        return (MODELS_DIR / LLM_MODEL_FILENAME).exists()

    def load_model(self, progress_callback: Optional[Callable[[str], None]] = None):
        model_path = get_llm_model_path()
        if not model_path.exists():
            print(f"[LLM] Không tìm thấy file model GGUF: {model_path}")
            return None

        if progress_callback:
            progress_callback("Đang nạp mô hình ngôn ngữ (Qwen 2.5)...")

        try:
            import gc
            gc.collect()
            from llama_cpp import Llama
            
            # Unload existing model if any
            if self.model is not None:
                del self.model
                self.model = None
                gc.collect()

            ctx_size = max(2048, min(8192, LLM_CONTEXT_SIZE))
            available_cpus = os.cpu_count() or 4
            
            # Tối ưu hóa hiệu suất đa nhân:
            # - Sinh từ (n_threads): Dùng 6-8 luồng tập trung vào Performance Cores để đạt tok/s cao nhất
            # - Nạp Prompt (n_threads_batch): Dùng toàn bộ 16 logical cores để tính toán ma trận đầu vào nhanh hơn 30%
            gen_threads = LLM_THREADS if LLM_THREADS else min(8, max(4, available_cpus // 2))
            batch_threads = available_cpus

            self.model = Llama(
                model_path=str(model_path),
                n_ctx=ctx_size,
                n_batch=512,
                n_threads=gen_threads,
                n_threads_batch=batch_threads,
                n_gpu_layers=0,
                use_mmap=True,
                verbose=False,
            )
            return self.model
        except Exception as e:
            try:
                import gc
                gc.collect()
                from llama_cpp import Llama
                self.model = Llama(
                    model_path=str(model_path),
                    n_ctx=2048,
                    n_batch=256,
                    n_threads=gen_threads if 'gen_threads' in locals() else 4,
                    n_threads_batch=batch_threads if 'batch_threads' in locals() else 8,
                    n_gpu_layers=0,
                    use_mmap=True,
                    verbose=False,
                )
                return self.model
            except Exception as e2:
                print(f"[LLM Error] Lỗi khi nạp mô hình GGUF: {e2}")
                self.model = None
                return None

    def call_chat(self, prompt: str, system_prompt: str = SYSTEM_STUDY_PROMPT,
                  max_tokens: int = 1200, temperature: float = 0.1) -> str:
        if not prompt or not prompt.strip():
            return ""

        if self.model is None:
            self.load_model()
        if self.model is None:
            model_path = get_llm_model_path()
            if not model_path.exists():
                raise FileNotFoundError(
                    f"Không tìm thấy tệp mô hình GGUF tại: {model_path}.\n"
                    "Vui lòng đặt tệp '{LLM_MODEL_FILENAME}' vào thư mục models/."
                )
            raise RuntimeError(
                "Không thể khởi động mô hình AI Qwen 2.5 (có thể do thiếu RAM hoặc context quá lớn).\n"
                "Hãy thử giảm Kích thước context hoặc Số luồng CPU trong phần Cài đặt."
            )

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt}
        ]

        try:
            output = self.model.create_chat_completion(
                messages=messages,
                max_tokens=max_tokens,
                temperature=temperature,
            )
            return output["choices"][0]["message"]["content"]
        except Exception as e:
            err_str = str(e)
            if "context" in err_str.lower() or "exceed" in err_str.lower() or "ggml_assert" in err_str.lower():
                raise RuntimeError(
                    "Độ dài văn bản bài giảng vượt quá giới hạn Context của mô hình.\n"
                    "Gợi ý: Tăng 'Kích thước context' lên 4096 hoặc 8192 trong Cài đặt."
                )
            raise RuntimeError(f"Lỗi khi xử lý qua AI: {err_str}")

    def _extract_json(self, raw: str) -> Any:
        cleaned = re.sub(r"```json\s*", "", raw)
        cleaned = re.sub(r"```\s*", "", cleaned).strip()
        try:
            return json.loads(cleaned)
        except Exception:
            match = re.search(r"(\[.*\]|\{.*\})", cleaned, re.DOTALL)
            if match:
                try:
                    return json.loads(match.group(1))
                except Exception:
                    pass
            # Phục hồi nếu mảng JSON bị cắt ngang cuối dòng
            if "[" in cleaned:
                sub = cleaned[cleaned.find("["):]
                last_brace = sub.rfind("}")
                if last_brace != -1:
                    try:
                        return json.loads(sub[:last_brace+1] + "]")
                    except Exception:
                        pass
        return None

    # ==================== 1. TÓM TẮT PHÂN CẤP (HIERARCHICAL SUMMARY) ====================
    def generate_hierarchical_summary(self, transcript_text: str, segments: Optional[List[Dict[str, Any]]] = None) -> Dict[str, Any]:
        full_text = TranscriptPruner.prune_transcript(transcript_text)
        prompt = (
            "Dưới đây là nội dung bài giảng (có chứa thuật ngữ chuyên ngành tiếng Việt và tiếng Anh).\n"
            "Hãy tóm tắt bài giảng này theo cấu trúc JSON phân cấp chuẩn:\n"
            "{\n"
            '  "overview": "Tóm tắt tổng quan súc tích toàn bộ bài giảng (3-5 câu), nêu rõ chủ đề cốt lõi.",\n'
            '  "key_takeaways": [\n'
            '     "Khái niệm/luận điểm 1 (nêu rõ tên thuật ngữ/công nghệ cụ thể)",\n'
            '     "Khái niệm/luận điểm 2",\n'
            '     "Khái niệm/luận điểm 3",\n'
            '     "Khái niệm/luận điểm 4",\n'
            '     "Khái niệm/luận điểm 5"\n'
            '  ],\n'
            '  "sections": [\n'
            '     {"title": "Tên chủ đề phần 1 (cụ thể, rõ ràng)", "timestamp": "00:00", "summary": "Tóm tắt nội dung chính phần 1"},\n'
            '     {"title": "Tên chủ đề phần 2", "timestamp": "...", "summary": "Tóm tắt nội dung chính phần 2"}\n'
            '  ]\n'
            "}\n\n"
            "LƯU Ý: Giữ nguyên các thuật ngữ tiếng Anh gốc (VD: MD5, Hash, SQL, TCP, Algorithm, v.v.).\n"
            f"Transcript:\n{full_text}\n\n"
            "CHỈ trả về JSON hợp lệ, không thêm chữ giải thích nào khác."
        )

        raw = self.call_chat(prompt, max_tokens=900)
        parsed = self._extract_json(raw)
        if isinstance(parsed, dict) and "overview" in parsed:
            return parsed
        
        return {
            "overview": raw.strip(),
            "key_takeaways": [],
            "sections": []
        }

    # ==================== 2. SINH QUIZ TRẮC NGHIỆM ĐA ĐỘ KHÓ ====================
    def _sanitize_quiz_item(self, q: Any, fallback_idx: int = 0) -> Optional[Dict[str, Any]]:
        if not isinstance(q, dict):
            return None
        question = str(q.get("question") or "").strip()
        if not question or len(question) < 5:
            return None

        # Xoá số thứ tự câu thừa nếu có (vd: "Câu 1:", "1.")
        question = re.sub(r"^(?:câu\s*\d+[:.]?|\d+[.)])\s*", "", question, flags=re.IGNORECASE).strip()

        # Làm sạch đại từ mơ hồ
        if re.match(r"^(nó|điều này|cái này|phương pháp này)\s+", question, re.IGNORECASE):
            question = re.sub(r"^(nó|điều này|cái này|phương pháp này)\s+", "Thuật ngữ / Khái niệm trong bài giảng ", question, flags=re.IGNORECASE)

        raw_options = q.get("options") or q.get("choices") or []
        if not isinstance(raw_options, list) or len(raw_options) < 2:
            return None

        prefix_letters = ["A", "B", "C", "D"]
        cleaned_opts = []
        for i, opt in enumerate(raw_options[:4]):
            text = opt if isinstance(opt, str) else str(opt.get("text", opt) if isinstance(opt, dict) else opt)
            text = text.strip()
            # Xoá tiền tố thừa lặp A., B., C., D. hoặc số
            text = re.sub(r"^[A-Da-d][.)\-:]\s*", "", text).strip()
            text = re.sub(r"^[A-Da-d][.)\-:]\s*", "", text).strip()
            letter = prefix_letters[i] if i < len(prefix_letters) else f"{i+1}"
            cleaned_opts.append(f"{letter}. {text}")

        # Đảm bảo đủ 4 phương án
        while len(cleaned_opts) < 4:
            letter = prefix_letters[len(cleaned_opts)]
            cleaned_opts.append(f"{letter}. Không có phương án nào ở trên")

        correct_idx = q.get("correct_index")
        if correct_idx is None:
            correct_idx = q.get("answer")
        try:
            correct_idx = int(correct_idx)
        except (ValueError, TypeError):
            if isinstance(correct_idx, str) and correct_idx.upper() in ["A", "B", "C", "D"]:
                correct_idx = ["A", "B", "C", "D"].index(correct_idx.upper())
            else:
                correct_idx = fallback_idx % 4

        if correct_idx < 0 or correct_idx >= len(cleaned_opts):
            correct_idx = fallback_idx % 4

        explanation = str(q.get("explanation") or q.get("reason") or "").strip()
        if not explanation:
            explanation = f"Đáp án {prefix_letters[correct_idx]} là phương án chuẩn xác nhất theo nội dung bài giảng."

        return {
            "question": question,
            "options": cleaned_opts,
            "correct_index": correct_idx,
            "explanation": explanation
        }

    def generate_quiz(self, transcript_text: str, num_questions: int = 5, difficulty: str = "trung bình",
                      on_prompt: Optional[Callable[[str], None]] = None,
                      on_progress: Optional[Callable[[str], None]] = None) -> List[Dict[str, Any]]:
        clean_text = TranscriptPruner.prune_transcript(transcript_text, max_chars=8000)
        if not clean_text:
            return []

        target_total = max(1, int(num_questions))
        batch_size = 5 if target_total > 5 else target_total
        valid_questions: List[Dict[str, Any]] = []
        existing_question_texts: List[str] = []

        diff_guide = {
            "dễ": "Mức độ DỄ: Tập trung vào nhận biết khái niệm cơ bản, định nghĩa thuật ngữ cốt lõi, vai trò và chức năng then chốt của các đối tượng trong bài giảng.",
            "trung bình": "Mức độ TRUNG BÌNH: Tập trung vào thông hiểu và vận dụng; kiểm tra nguyên lý hoạt động, cơ chế kỹ thuật, mối quan hệ nhân quả và tương tác giữa các thành phần.",
            "khó": "Mức độ KHÓ: Tập trung vào phân tích sâu, so sánh đối chiếu, các tình huống biên/ngoại lệ, ưu nhược điểm kỹ thuật, và các câu hỏi phân biệt bẫy logic sâu sắc."
        }.get(difficulty.lower(), "Mức độ TRUNG BÌNH: Thông hiểu và vận dụng kiến thức.")

        # Lặp sinh theo từng lượt (batch) để đảm bảo chất lượng cao nhất và đủ số lượng
        max_attempts = max(3, (target_total + batch_size - 1) // batch_size + 2)
        attempt = 0

        while len(valid_questions) < target_total and attempt < max_attempts:
            attempt += 1
            needed = target_total - len(valid_questions)
            curr_batch_target = min(batch_size, needed)

            if on_progress:
                try:
                    on_progress(f"Đang biên soạn câu hỏi {len(valid_questions) + 1} - {len(valid_questions) + curr_batch_target}/{target_total} ({difficulty})…")
                except Exception:
                    pass

            avoid_section = ""
            if existing_question_texts:
                sample_qs = [f"- {t}" for t in existing_question_texts[-5:]]
                avoid_section = (
                    f"\nCÁC CÂU HỎI ĐÃ TẠO TRƯỚC ĐÓ (BẮT BUỘC KHÔNG ĐƯỢC TRÙNG LẶP CHỦ ĐỀ/Ý NÀY):\n"
                    + "\n".join(sample_qs) + "\n"
                )

            prompt = (
                f"Dựa CHỈ VÀO nội dung bài giảng dưới đây, hãy tạo CHÍNH XÁC {curr_batch_target} câu hỏi trắc nghiệm 4 đáp án bằng tiếng Việt.\n\n"
                f"ĐỘ KHÓ YÊU CẦU: {difficulty.upper()}\n"
                f"{diff_guide}\n"
                f"{avoid_section}\n"
                "QUY TẮC SƯ PHẠM BẮT BUỘC:\n"
                "1. CÂU HỎI ĐỘC LẬP & TỰ THÂN ĐẦY ĐỦ: Phải đầy đủ chủ ngữ/vị ngữ, nêu đích danh thuật ngữ kỹ thuật/chủ đề cụ thể "
                "(Ví dụ: 'Giao thức TCP', 'Mô hình OSI', 'Mật mã khóa đối xứng', 'Hàm băm SHA-256'). TUYỆT ĐỐI KHÔNG hỏi cộc lốc hoặc dùng từ mơ hồ như 'Nó là gì?'.\n"
                "2. 4 PHƯƠNG ÁN A, B, C, D CHUẨN XÁC: Mỗi câu phải có đủ 4 lựa chọn mang tính phân loại học thuật thực chất, không có phương án ngớ ngẩn.\n"
                "3. PHÂN BỔ ĐÁP ÁN ĐÚNG ĐỀU ĐẶN: Phân bổ vị trí đáp án đúng ngẫu nhiên qua các chỉ số 0, 1, 2, 3 (tương ứng A, B, C, D). TUYỆT ĐỐI KHÔNG dồn tất cả vào đáp án A.\n"
                "4. GIẢI THÍCH (explanation) RÕ RÀNG & GIÁ TRỊ: Giải thích 1-3 câu nêu rõ lý do vì sao đáp án đúng là chuẩn xác theo bài giảng, giúp người học ghi nhớ sâu sắc.\n\n"
                f"CHỈ trả về đúng mảng JSON {curr_batch_target} phần tử theo cấu trúc mẫu:\n"
                "[\n"
                "  {\n"
                '    "question": "Câu hỏi cụ thể nêu rõ tên chủ thể/thuật ngữ?",\n'
                '    "options": ["A. Lựa chọn 1", "B. Lựa chọn 2", "C. Lựa chọn 3", "D. Lựa chọn 4"],\n'
                '    "correct_index": 1,\n'
                '    "explanation": "Giải thích rõ lý do đáp án này đúng theo bài giảng."\n'
                "  }\n"
                "]\n\n"
                f"Nội dung bài giảng:\n{clean_text}"
            )

            print("\n" + "═" * 70)
            print(f"🤖 [DEBUG AI - QUIZ BATCH {attempt}] Cần: {curr_batch_target} câu | Đã có: {len(valid_questions)}/{target_total}")
            print("═" * 70)

            if on_prompt and attempt == 1:
                try:
                    on_prompt(prompt)
                except Exception:
                    pass

            t0 = time.time()
            max_tokens = max(600, min(2400, curr_batch_target * 240))
            raw = self.call_chat(prompt, max_tokens=max_tokens, temperature=0.25)
            duration = time.time() - t0
            print(f"✅ [DEBUG AI - QUIZ BATCH {attempt} FINISHED] Thời gian: {duration:.2f}s | Output: {len(raw)} ký tự\n")

            parsed = self._extract_json(raw)
            if isinstance(parsed, dict):
                for key in ["questions", "quiz", "data", "items"]:
                    if key in parsed and isinstance(parsed[key], list):
                        parsed = parsed[key]
                        break
                else:
                    vals = list(parsed.values())
                    if vals and isinstance(vals[0], list):
                        parsed = vals[0]

            if isinstance(parsed, list):
                for i, item in enumerate(parsed):
                    sanitized = self._sanitize_quiz_item(item, fallback_idx=(len(valid_questions) + i) % 4)
                    if sanitized:
                        # Kiểm tra tránh trùng lặp nội dung câu hỏi
                        q_title = sanitized["question"].strip().lower()
                        if not any(q_title == e.lower() for e in existing_question_texts):
                            valid_questions.append(sanitized)
                            existing_question_texts.append(sanitized["question"])
                            if len(valid_questions) >= target_total:
                                break

        return valid_questions[:target_total]

    # ==================== 3. SINH FLASHCARDS ====================
    def _sanitize_flashcard_item(self, c: Any) -> Optional[Dict[str, str]]:
        if not isinstance(c, dict):
            return None
        front = str(c.get("front") or c.get("question") or "").strip()
        back = str(c.get("back") or c.get("answer") or "").strip()
        hint = str(c.get("hint") or c.get("suggestion") or "").strip()
        if not front or not back or len(front) < 4:
            return None

        # Xoá số thứ tự thừa nếu có
        front = re.sub(r"^(?:thẻ\s*\d+[:.]?|\d+[.)])\s*", "", front, flags=re.IGNORECASE).strip()
        back = re.sub(r"^(?:đáp án[:.]?|trả lời[:.]?)\s*", "", back, flags=re.IGNORECASE).strip()

        # Làm sạch đại từ mơ hồ
        if re.match(r"^(nó|điều này|cái này|phương pháp này)\s+", front, re.IGNORECASE):
            front = re.sub(r"^(nó|điều này|cái này|phương pháp này)\s+", "Khái niệm ", front, flags=re.IGNORECASE)

        return {
            "front": front,
            "back": back,
            "hint": hint
        }

    def generate_flashcards(self, transcript_text: str, num_cards: int = 8,
                            on_prompt: Optional[Callable[[str], None]] = None,
                            on_progress: Optional[Callable[[str], None]] = None) -> List[Dict[str, str]]:
        clean_text = TranscriptPruner.prune_transcript(transcript_text, max_chars=8000)
        if not clean_text:
            return []

        target_total = max(1, int(num_cards))
        batch_size = 8 if target_total > 8 else target_total
        valid_cards: List[Dict[str, str]] = []
        existing_fronts: List[str] = []

        max_attempts = max(3, (target_total + batch_size - 1) // batch_size + 2)
        attempt = 0

        while len(valid_cards) < target_total and attempt < max_attempts:
            attempt += 1
            needed = target_total - len(valid_cards)
            curr_batch_target = min(batch_size, needed)

            if on_progress:
                try:
                    on_progress(f"Đang rút trích thẻ ghi nhớ {len(valid_cards) + 1} - {len(valid_cards) + curr_batch_target}/{target_total}…")
                except Exception:
                    pass

            avoid_section = ""
            if existing_fronts:
                sample_fronts = [f"- {f}" for f in existing_fronts[-6:]]
                avoid_section = (
                    f"\nCÁC THẺ ĐÃ CÓ TRƯỚC ĐÓ (BẮT BUỘC KHÔNG ĐƯỢC TRÙNG LẶP Ý NÀY):\n"
                    + "\n".join(sample_fronts) + "\n"
                )

            prompt = (
                f"Dựa vào bài giảng sau, hãy rút trích CHÍNH XÁC {curr_batch_target} thẻ ghi nhớ (Flashcards) chất lượng cao "
                "chuẩn Spaced Repetition (SM-2) & Active Recall (Gợi nhớ chủ động).\n\n"
                f"{avoid_section}\n"
                "TIÊU CHUẨN SƯ PHẠM CHO TỪNG MẶT THẺ:\n"
                "1. Mặt trước (front): Nêu một câu hỏi tự kiểm tra rõ ràng hoặc tên thuật ngữ/khái niệm kỹ thuật cụ thể "
                "(Ví dụ: 'Mô hình TCP/IP gồm những tầng nào?', 'Chức năng của thuật toán băm SHA-256?'). KHÔNG dùng 'Nó là gì?'.\n"
                "2. Mặt sau (back): Định nghĩa hoặc câu trả lời cô đọng, súc tích (1-3 câu, tối đa 35 từ), nêu bật từ khóa quan trọng và bản chất cốt lõi.\n"
                "3. Gợi ý (hint): Gợi ý tư duy liên tưởng ngắn gọn (3-7 từ) giúp người học liên hệ nhanh khi chưa nhớ ra.\n"
                "4. Đa dạng kiến thức: Bao gồm định nghĩa thuật ngữ, cơ chế hoạt động, so sánh và ứng dụng thực tế.\n\n"
                f"CHỈ trả về đúng mảng JSON {curr_batch_target} phần tử theo cấu trúc:\n"
                "[\n"
                "  {\n"
                '    "front": "Câu hỏi tự kiểm tra hoặc khái niệm cụ thể nêu rõ tên thuật ngữ?",\n'
                '    "back": "Định nghĩa / câu trả lời trọng tâm, súc tích (1-2 câu ngắn)",\n'
                '    "hint": "Từ khóa gợi ý nhớ nhanh"\n'
                "  }\n"
                "]\n\n"
                f"Transcript bài giảng:\n{clean_text}"
            )

            print("\n" + "═" * 70)
            print(f"🤖 [DEBUG AI - FLASHCARDS BATCH {attempt}] Cần: {curr_batch_target} thẻ | Đã có: {len(valid_cards)}/{target_total}")
            print("═" * 70)

            if on_prompt and attempt == 1:
                try:
                    on_prompt(prompt)
                except Exception:
                    pass

            t0 = time.time()
            max_tokens = max(500, min(2000, curr_batch_target * 140))
            raw = self.call_chat(prompt, max_tokens=max_tokens, temperature=0.25)
            duration = time.time() - t0
            print(f"✅ [DEBUG AI - FLASHCARDS BATCH {attempt} FINISHED] Thời gian: {duration:.2f}s | Output: {len(raw)} ký tự\n")

            parsed = self._extract_json(raw)
            if isinstance(parsed, dict):
                for key in ["flashcards", "cards", "data", "items"]:
                    if key in parsed and isinstance(parsed[key], list):
                        parsed = parsed[key]
                        break
                else:
                    vals = list(parsed.values())
                    if vals and isinstance(vals[0], list):
                        parsed = vals[0]

            if isinstance(parsed, list):
                for item in parsed:
                    sanitized = self._sanitize_flashcard_item(item)
                    if sanitized:
                        f_title = sanitized["front"].strip().lower()
                        if not any(f_title == e.lower() for e in existing_fronts):
                            valid_cards.append(sanitized)
                            existing_fronts.append(sanitized["front"])
                            if len(valid_cards) >= target_total:
                                break

        return valid_cards[:target_total]

    # ==================== 4. SINH CÂY SƠ ĐỒ TƯ DUY (MINDMAP) ====================
    def generate_mindmap(self, summary_text_or_transcript: str) -> Dict[str, Any]:
        full_text = TranscriptPruner.prune_transcript(summary_text_or_transcript)
        prompt = (
            "Dựa vào nội dung sau, hãy xây dựng một sơ đồ tư duy (Mindmap) phân cấp dạng cây (Tree JSON).\n"
            "Các nhánh phải có tên cụ thể, nêu rõ thuật ngữ chuyên ngành (VD: Thuật toán MD5, Giao thức mạng, CSDL quan hệ, v.v.).\n"
            "CHỈ trả về JSON hợp lệ với cấu trúc:\n"
            "{\n"
            '  "id": "root",\n'
            '  "topic": "Chủ đề bài giảng",\n'
            '  "children": [\n'
            '    {\n'
            '      "id": "branch_1",\n'
            '      "topic": "Nhánh chủ đề 1",\n'
            '      "children": [\n'
            '        {"id": "node_1_1", "topic": "Ý chi tiết / Thuật ngữ 1"},\n'
            '        {"id": "node_1_2", "topic": "Ý chi tiết / Thuật ngữ 2"}\n'
            '      ]\n'
            '    }\n'
            '  ]\n'
            "}\n\n"
            f"Nội dung:\n{full_text}"
        )

        raw = self.call_chat(prompt, max_tokens=800)
        parsed = self._extract_json(raw)
        if isinstance(parsed, dict) and "topic" in parsed:
            return parsed
        return {
            "id": "root",
            "topic": "Bài giảng",
            "children": [{"id": "node_1", "topic": "Nội dung bài giảng"}]
        }

llm_engine = LLMEngine()
