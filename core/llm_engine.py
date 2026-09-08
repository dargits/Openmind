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
SYSTEM_STUDY_PROMPT = (
    "Bạn là chuyên gia sư phạm và trợ giảng AI cao cấp. "
    "Nhiệm vụ của bạn là tạo tóm tắt, câu hỏi trắc nghiệm và thẻ ghi nhớ chất lượng cao, chuẩn xác về mặt học thuật.\n"
    "CÁC NGUYÊN TẮC BẮT BUỘC:\n"
    "1. RÕ NGHĨA & ĐỘC LẬP (SELF-CONTAINED): Mỗi câu hỏi hoặc thẻ ghi nhớ phải đầy đủ ngữ cảnh. "
    "TUYỆT ĐỐI KHÔNG dùng các đại từ mơ hồ như 'nó', 'điều này', 'cái này', 'phương pháp này' mà KHÔNG nêu tên chủ thể. "
    "Ví dụ SAI: 'Nó thực hiện chức năng gì?'. Ví dụ ĐÚNG: 'Hàm băm MD5 thực hiện chức năng gì trong bảo mật?'.\n"
    "2. CHUẨN XÁC THUẬT NGỮ: Giữ nguyên các thuật ngữ kỹ thuật, tên chuẩn tiếng Anh/viết tắt "
    "(VD: MD5, SHA-256, Hash function, SQL, API, TCP/IP, Encryption, Token, Cache, v.v.). Không dịch thô làm mất nghĩa.\n"
    "3. ĐÁP ÁN CHẤT LƯỢNG: Các lựa chọn trắc nghiệm phải logic, mang tính phân loại kiến thức thực chất."
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
            # Tối ưu hóa số luồng CPU cho inference nhanh hơn 2-3x
            available_cpus = os.cpu_count() or 4
            threads = max(4, min(10, LLM_THREADS or available_cpus))

            self.model = Llama(
                model_path=str(model_path),
                n_ctx=ctx_size,
                n_batch=512,
                n_threads=threads,
                n_gpu_layers=0,
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
                    n_threads=4,
                    n_gpu_layers=0,
                    verbose=False,
                )
                return self.model
            except Exception as e2:
                print(f"[LLM Error] Lỗi khi nạp mô hình GGUF: {e2}")
                self.model = None
                return None

    def call_chat(self, prompt: str, system_prompt: str = SYSTEM_STUDY_PROMPT,
                  max_tokens: int = 1200, temperature: float = 0.25) -> str:
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

        raw = self.call_chat(prompt, max_tokens=1400)
        parsed = self._extract_json(raw)
        if isinstance(parsed, dict) and "overview" in parsed:
            return parsed
        
        return {
            "overview": raw.strip(),
            "key_takeaways": [],
            "sections": []
        }

    # ==================== 2. SINH QUIZ TRẮC NGHIỆM ĐA ĐỘ KHÓ ====================
    def generate_quiz(self, transcript_text: str, num_questions: int = 5, difficulty: str = "trung bình",
                      on_prompt: Optional[Callable[[str], None]] = None) -> List[Dict[str, Any]]:
        full_text = TranscriptPruner.prune_transcript(transcript_text)
        prompt = (
            f"Dựa CHỈ VÀO nội dung bài giảng dưới đây, hãy tạo {num_questions} câu hỏi trắc nghiệm 4 đáp án bằng tiếng Việt "
            f"ở mức độ '{difficulty}'.\n\n"
            "QUY TẮC QUAN TRỌNG CHO CÂU HỎI:\n"
            "- Mỗi câu hỏi PHẢI ĐẦY ĐỦ CHỦ NGỮ/VỊ NGỮ, nêu đích danh khái niệm, thuật ngữ (ví dụ: 'Mô hình TCP/IP', 'Giao thức TCP', 'Địa chỉ IP').\n"
            "- TUYỆT ĐỐI KHÔNG viết câu hỏi cộc lốc hoặc mơ hồ như: 'Nó là gì?', 'Nó thực hiện điều gì?'.\n"
            "- 4 đáp án A, B, C, D: Phải ngắn gọn, cô đọng (tối đa 15 từ mỗi đáp án), chỉ có 1 đáp án đúng duy nhất. Tránh viết lựa chọn dài dòng.\n"
            "- Phần GIẢI THÍCH (explanation): CỰC KỲ NGẮN GỌN, súc tích trong 1-2 câu ngắn (tối đa 25-35 từ), chỉ nêu trực tiếp lý do cốt lõi vì sao đáp án đó đúng theo bài giảng. TUYỆT ĐỐI KHÔNG giải thích dài dòng, không kể chuyện, không dùng ví dụ ví von lan man.\n\n"
            "CHỈ trả về mảng JSON hợp lệ, đúng cấu trúc:\n"
            '[\n'
            '  {\n'
            '    "question": "Câu hỏi cụ thể nêu rõ tên chủ thể/thuật ngữ?",\n'
            '    "options": ["A. Lựa chọn 1 ngắn gọn", "B. Lựa chọn 2 ngắn gọn", "C. Lựa chọn 3 ngắn gọn", "D. Lựa chọn 4 ngắn gọn"],\n'
            '    "correct_index": 0,\n'
            '    "explanation": "Giải thích ngắn gọn 1-2 câu lý do đáp án đúng."\n'
            '  }\n'
            ']\n\n'
            f"Transcript bài giảng:\n{full_text}"
        )

        print("\n" + "═" * 70)
        print(f"🤖 [DEBUG AI - GENERATE QUIZ] Số câu hỏi: {num_questions} | Độ khó: {difficulty}")
        print(f"📝 [PROMPT SENT TO LLM]:")
        print("─" * 70)
        print(prompt)
        print("─" * 70)
        print(f"📊 Thống kê prompt: {len(prompt)} ký tự | ~{len(prompt.split())} từ")
        print("═" * 70 + "\n")

        if on_prompt:
            try:
                on_prompt(prompt)
            except Exception:
                pass

        t0 = time.time()
        max_tokens = min(1200, max(350, num_questions * 140))
        raw = self.call_chat(prompt, max_tokens=max_tokens)
        duration = time.time() - t0
        print(f"✅ [DEBUG AI - QUIZ FINISHED] Thời gian suy luận: {duration:.2f}s | Output: {len(raw)} ký tự\n")

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
            valid_questions = []
            for q in parsed:
                if isinstance(q, dict) and "question" in q and "options" in q:
                    q_text = q.get("question", "")
                    if re.match(r"^(nó|điều này|cái này)\s+", q_text, re.IGNORECASE):
                        q["question"] = re.sub(r"^(nó|điều này|cái này)\s+", "Thuật ngữ / Khái niệm trong bài giảng ", q_text, flags=re.IGNORECASE)
                    valid_questions.append(q)
            if valid_questions:
                return valid_questions
        return []

    # ==================== 3. SINH FLASHCARDS ====================
    def generate_flashcards(self, transcript_text: str, num_cards: int = 8,
                            on_prompt: Optional[Callable[[str], None]] = None) -> List[Dict[str, str]]:
        full_text = TranscriptPruner.prune_transcript(transcript_text)
        prompt = (
            f"Dựa vào bài giảng sau, hãy rút trích {num_cards} thẻ ghi nhớ (Flashcards) chất lượng cao.\n\n"
            "YÊU CẦU CHO THẺ:\n"
            "- Mặt trước (front): Nêu rõ câu hỏi tự kiểm tra hoặc tên khái niệm/thuật ngữ cụ thể (ví dụ: 'Mô hình TCP/IP là gì?', 'Chức năng của giao thức IP?'). KHÔNG dùng 'Nó là gì?'.\n"
            "- Mặt sau (back): Định nghĩa hoặc câu trả lời súc tích, ngắn gọn (tối đa 25 từ), nêu bật từ khóa quan trọng.\n"
            "- Gợi ý (hint): Gợi ý ngắn 3-5 từ giúp liên tưởng nhanh.\n\n"
            "CHỈ trả về mảng JSON hợp lệ:\n"
            '[\n'
            '  {\n'
            '    "front": "Khái niệm hoặc câu hỏi cụ thể nêu rõ tên thuật ngữ?",\n'
            '    "back": "Định nghĩa / câu trả lời trọng tâm, súc tích (1-2 câu ngắn)",\n'
            '    "hint": "Gợi ý nhớ nhanh"\n'
            '  }\n'
            ']\n\n'
            f"Transcript bài giảng:\n{full_text}"
        )

        print("\n" + "═" * 70)
        print(f"🤖 [DEBUG AI - GENERATE FLASHCARDS] Số lượng thẻ: {num_cards}")
        print(f"📝 [PROMPT SENT TO LLM]:")
        print("─" * 70)
        print(prompt)
        print("─" * 70)
        print(f"📊 Thống kê prompt: {len(prompt)} ký tự | ~{len(prompt.split())} từ")
        print("═" * 70 + "\n")

        if on_prompt:
            try:
                on_prompt(prompt)
            except Exception:
                pass

        t0 = time.time()
        max_tokens = min(1200, max(300, num_cards * 80))
        raw = self.call_chat(prompt, max_tokens=max_tokens)
        duration = time.time() - t0
        print(f"✅ [DEBUG AI - FLASHCARDS FINISHED] Thời gian suy luận: {duration:.2f}s | Output: {len(raw)} ký tự\n")

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
            valid_cards = []
            for c in parsed:
                if isinstance(c, dict) and "front" in c and "back" in c:
                    f_text = c.get("front", "")
                    if re.match(r"^(nó|điều này|cái này)\s+", f_text, re.IGNORECASE):
                        c["front"] = re.sub(r"^(nó|điều này|cái này)\s+", "Khái niệm ", f_text, flags=re.IGNORECASE)
                    valid_cards.append(c)
            if valid_cards:
                return valid_cards
        return []

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

        raw = self.call_chat(prompt, max_tokens=1300)
        parsed = self._extract_json(raw)
        if isinstance(parsed, dict) and "topic" in parsed:
            return parsed
        return {
            "id": "root",
            "topic": "Bài giảng",
            "children": [{"id": "node_1", "topic": "Nội dung bài giảng"}]
        }

llm_engine = LLMEngine()
