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

            ctx_size = min(2048, LLM_CONTEXT_SIZE) if LLM_CONTEXT_SIZE <= 2048 else 2048
            threads = min(4, LLM_THREADS)

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
                    n_threads=2,
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
        return None

    # ==================== 1. TÓM TẮT PHÂN CẤP (HIERARCHICAL SUMMARY) ====================
    def generate_hierarchical_summary(self, transcript_text: str, segments: Optional[List[Dict[str, Any]]] = None) -> Dict[str, Any]:
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
            f"Transcript:\n{transcript_text[:6500]}\n\n"
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
    def generate_quiz(self, transcript_text: str, num_questions: int = 5, difficulty: str = "trung bình") -> List[Dict[str, Any]]:
        prompt = (
            f"Dựa CHỈ VÀO nội dung bài giảng dưới đây, hãy tạo {num_questions} câu hỏi trắc nghiệm 4 đáp án bằng tiếng Việt "
            f"ở mức độ '{difficulty}'.\n\n"
            "QUY TẮC QUAN TRỌNG CHO CÂU HỎI:\n"
            "- Mỗi câu hỏi PHẢI ĐẦY ĐỦ CHỦ NGỮ/VỊ NGỮ, nêu đích danh khái niệm, thuật ngữ (ví dụ: 'Hàm băm MD5', 'Giao thức TCP/IP', 'Cơ sở dữ liệu SQL').\n"
            "- TUYỆT ĐỐI KHÔNG viết câu hỏi cộc lốc hoặc mơ hồ như: 'Nó là gì?', 'Nó thực hiện điều gì?', 'Phương pháp này có ưu điểm gì?'.\n"
            "- 4 đáp án A, B, C, D phải rõ ràng, phân biệt được đúng sai dựa trên bài giảng.\n\n"
            "CHỈ trả về mảng JSON hợp lệ, đúng cấu trúc:\n"
            '[\n'
            '  {\n'
            '    "question": "Câu hỏi cụ thể nêu rõ tên chủ thể/thuật ngữ?",\n'
            '    "options": ["A. Lựa chọn 1", "B. Lựa chọn 2", "C. Lựa chọn 3", "D. Lựa chọn 4"],\n'
            '    "correct_index": 0,\n'
            '    "explanation": "Giải thích chi tiết tại sao đáp án này đúng dựa trên nội dung bài giảng."\n'
            '  }\n'
            ']\n\n'
            f"Transcript bài giảng:\n{transcript_text[:3500]}"
        )

        raw = self.call_chat(prompt, max_tokens=1000)
        parsed = self._extract_json(raw)
        if isinstance(parsed, list):
            # Clean up questions if any vague pronoun slipped through
            for q in parsed:
                q_text = q.get("question", "")
                if re.match(r"^(nó|điều này|cái này)\s+", q_text, re.IGNORECASE):
                    q["question"] = re.sub(r"^(nó|điều này|cái này)\s+", "Thuật ngữ / Khái niệm trong bài giảng ", q_text, flags=re.IGNORECASE)
            return parsed
        return []

    # ==================== 3. SINH FLASHCARDS ====================
    def generate_flashcards(self, transcript_text: str, num_cards: int = 8) -> List[Dict[str, str]]:
        prompt = (
            f"Dựa vào bài giảng sau, hãy rút trích {num_cards} thẻ ghi nhớ (Flashcards) chất lượng cao.\n\n"
            "YÊU CẦU CHO THẺ:\n"
            "- Mặt trước (front): Nêu rõ câu hỏi tự kiểm tra hoặc tên khái niệm/thuật ngữ cụ thể (ví dụ: 'Hàm băm MD5 là gì?', 'Đặc điểm của SHA-256?'). KHÔNG dùng 'Nó là gì?'.\n"
            "- Mặt sau (back): Định nghĩa hoặc câu trả lời súc tích, chính xác, nêu bật từ khóa quan trọng.\n"
            "- Gợi ý (hint): Gợi ý ngắn 3-5 từ giúp liên tưởng nhanh.\n\n"
            "CHỈ trả về mảng JSON hợp lệ:\n"
            '[\n'
            '  {\n'
            '    "front": "Khái niệm hoặc câu hỏi cụ thể nêu rõ tên thuật ngữ?",\n'
            '    "back": "Định nghĩa / câu trả lời trọng tâm, súc tích",\n'
            '    "hint": "Gợi ý nhớ nhanh"\n'
            '  }\n'
            ']\n\n'
            f"Transcript bài giảng:\n{transcript_text[:3500]}"
        )

        raw = self.call_chat(prompt, max_tokens=1000)
        parsed = self._extract_json(raw)
        if isinstance(parsed, list):
            for c in parsed:
                f_text = c.get("front", "")
                if re.match(r"^(nó|điều này|cái này)\s+", f_text, re.IGNORECASE):
                    c["front"] = re.sub(r"^(nó|điều này|cái này)\s+", "Khái niệm ", f_text, flags=re.IGNORECASE)
            return parsed
        return []

    # ==================== 4. SINH CÂY SƠ ĐỒ TƯ DUY (MINDMAP) ====================
    def generate_mindmap(self, summary_text_or_transcript: str) -> Dict[str, Any]:
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
            f"Nội dung:\n{summary_text_or_transcript[:6000]}"
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
