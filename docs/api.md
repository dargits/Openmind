# 🔌 Đặc Tả Giao Diện Lập Trình API Open-mind (API Specification)

Open-mind sử dụng kiến trúc Desktop Hiện đại với cầu nối hai chiều không đồng bộ (Asynchronous Bidirectional Native IPC Bridge) thông qua **`pywebview`**. Tất cả các hàm bên dưới được định nghĩa tại `core/api.py` (`class API`) và có thể gọi trực tiếp từ phía JavaScript Frontend qua đối tượng toàn cục `window.pywebview.api.<method_name>(...args)`.

---

## 📑 Mục Lục API

1. [Khởi Động & Trạng Thái Hệ Thống (App Lifecycle & Status)](#1-khởi-động--trạng-thái-hệ-thống)
2. [Quản Lý Bài Giảng & Nhập Liệu Đa Phương Tiện (Lectures & Multimodal)](#2-quản-lý-bài-giảng--nhập-liệu-đa-phương-tiện)
3. [Tác Vụ AI & Auto-Pipeline (AI Engines & Generation)](#3-tác-vụ-ai--auto-pipeline)
4. [Hỏi-Đáp RAG Đa Lượt (Multi-turn RAG Chat)](#4-hỏi-đáp-rag-đa-lượt)
5. [Ghi Chú Trực Tiếp (Inline Note-Taking)](#5-ghi-chú-trực-tiếp)
6. [Thẻ Nhớ & Lặp Lại Ngắt Quãng (Flashcards & SRS)](#6-thẻ-nhớ--lặp-lại-ngắt-quãng)
7. [Tìm Kiếm Toàn Văn FTS5 & Thống Kê (Search & Analytics)](#7-tìm-kiếm-toàn-văn-fts5--thống-kê)
8. [Xuất Dữ Liệu Chuyên Nghiệp (Export Engine)](#8-xuất-dữ-liệu-chuyên-nghiệp)
9. [Cấu Hình & Kiểm Tra Kết Nối Cloud (Settings & Cloud Test)](#9-cấu-hình--kiểm-tra-kết-nối-cloud)

---

## 1. Khởi Động & Trạng Thái Hệ Thống

### `get_app_info() -> dict`
Lấy số liệu tóm tắt hiển thị trên Topbar khi khởi động.
- **Trả về:**
```json
{
  "due_today": 12,
  "streak": 5,
  "total_cards": 85
}
```

### `load_models()`
Kiểm tra và tự động tải mô hình (Whisper, LLM) nếu chưa có, sau đó nạp vào bộ nhớ. Phát sự kiện `splash:status` qua CustomEvent `omEvent`.

### `get_model_info() -> dict`
Lấy thông tin phiên bản mô hình STT và LLM đang sử dụng.

---

## 2. Quản Lý Bài Giảng & Nhập Liệu Đa Phương Tiện

### `list_lectures(folder_tag: str = "", search: str = "") -> list`
Lấy danh sách bài giảng theo thư mục hoặc từ khóa tìm kiếm.

### `get_lecture(lecture_id: str) -> dict`
Lấy chi tiết bài giảng, bao gồm danh sách phân đoạn câu (transcript segments kèm timestamp), tóm tắt, sơ đồ tư duy, flashcards, quiz và ghi chú cá nhân.

### `delete_lecture(lecture_id: str) -> dict`
Xóa bài giảng và toàn bộ dữ liệu liên quan (chỉ mục FTS, flashcards, quiz, chat history).

### `rename_lecture(lecture_id: str, new_title: str) -> dict`
Đổi tên bài giảng và cập nhật cơ sở dữ liệu.

### `download_youtube_audio(url: str) -> dict`
Sử dụng `yt-dlp` tải và trích xuất âm thanh từ liên kết YouTube.
- **Tham số:** `url`: Chuỗi liên kết video YouTube.
- **Trả về:**
```json
{
  "success": true,
  "file_path": "E:\\openmind\\data\\downloads\\75ww4DjSvrU.mp3",
  "title": "Học máy cơ bản - Bài 1",
  "duration": 600
}
```

### `import_pdf_lecture(pdf_path: str, title: str = "", folder_tag: str = "General") -> dict`
Trích xuất nội dung văn bản từ Slide/Tài liệu PDF bằng `pypdf`, phân tách theo trang `[Trang X]` và nạp vào thư viện.

### `pick_audio_file() -> str` / `pick_pdf_file() -> str`
Mở hộp thoại Native File Picker chọn tệp âm thanh hoặc tài liệu PDF từ hệ thống.

---

## 3. Tác Vụ AI & Auto-Pipeline

### `start_transcribe(audio_path: str, prompt: str = "", lecture_id: str = "") -> dict`
Bắt đầu phiên âm âm thanh bằng `faster-whisper` kết hợp phục hồi từ vựng CNTT.
- Tự động kích hoạt quy trình ngầm **Auto-Pipeline** 4 bước:
  1. `generate_summary(lecture_id)`
  2. `llm_engine.generate_mindmap(...)`
  3. `generate_quiz(lecture_id)`
  4. `generate_flashcards(lecture_id)`

### `generate_summary(lecture_id: str) -> dict`
Yêu cầu LLM tạo bản tóm tắt 3 cấp độ (Tổng quan, Ý chính, Theo dòng thời gian).

### `generate_quiz(lecture_id: str, num_questions: int = 5, difficulty: str = "trung bình") -> dict`
Tạo bộ câu hỏi trắc nghiệm 4 đáp án A/B/C/D ngẫu nhiên kèm lời giải thích chi tiết.

### `generate_flashcards(lecture_id: str, num_cards: int = 8) -> dict`
Trích xuất danh sách cặp khái niệm (Front/Back/Hint) độc lập ngữ cảnh.

---

## 4. Hỏi-Đáp RAG Đa Lượt (Multi-turn RAG Chat)

### `ask_rag(question: str, lecture_id: str) -> dict`
Gửi câu hỏi tới trợ lý AI RAG có duy trì ngữ cảnh đa lượt.
- **Tham số:**
  - `question`: Câu hỏi của người dùng.
  - `lecture_id`: Mã bài giảng làm ngữ cảnh tham chiếu.
- **Trả về:**
```json
{
  "answer": "Mô hình OSI gồm 7 tầng...",
  "sources": [
    {"start": 120.5, "end": 145.0, "text": "...", "timestamp": "02:00"}
  ]
}
```

### `clear_chat_history(lecture_id: str) -> dict`
Xóa sạch lịch sử hội thoại của bài giảng chỉ định.

---

## 5. Ghi Chú Trực Tiếp (Inline Note-Taking)

### `save_lecture_note(lecture_id: str, note_id: Optional[str], timestamp: float, text: str) -> dict`
Lưu hoặc cập nhật một ghi chú cá nhân gắn kèm mốc thời gian bài giảng `[MM:SS]`.

### `delete_lecture_note(lecture_id: str, note_id: str) -> dict`
Xóa ghi chú cá nhân chỉ định.

---

## 6. Thẻ Nhớ & Lặp Lại Ngắt Quãng (Flashcards & SRS)

### `rate_card(card_id: str, rating: int, ease_factor: float, repetitions: int, interval_days: int) -> dict`
Đánh giá độ nhớ thẻ ($1$: Again, $2$: Hard, $3$: Good, $4$: Easy) theo thuật toán SuperMemo-2 (SM-2), tự động cập nhật hệ số ghi nhớ mới, khoảng ngày ôn tiếp theo và thời điểm đến hạn (*due date*).

### `preview_srs(rating: int, ease_factor: float, repetitions: int, interval_days: int) -> dict`
Xem trước số ngày kế tiếp của từng nút đánh giá trên giao diện luyện tập.

### `get_due_cards(deck_id: str) -> list`
Lấy danh sách các thẻ cần ôn trong ngày hôm nay (*due_date <= now*).

---

## 7. Tìm Kiếm Toàn Văn FTS5 & Thống Kê

### `search_all_lectures(query: str) -> list`
Tìm kiếm từ khóa tức thì xuyên suốt toàn bộ kho bài giảng, văn bản phiên âm và ghi chú cá nhân sử dụng chỉ mục **SQLite FTS5**.

### `get_stats() -> dict`
Lấy toàn bộ số liệu thống kê: Tổng số bài giảng, tổng thời gian học, chuỗi ngày liên tiếp (*Daily Streak*), ma trận dự báo ôn tập 7 ngày tới theo thuật toán Ebbinghaus ($R = 100 \times e^{-t/S}$).

---

## 8. Xuất Dữ Liệu Chuyên Nghiệp

### `export_apkg(lecture_id: str) -> dict` / `export_deck_apkg(deck_id: str) -> dict`
Xuất trực tiếp bộ thẻ nhớ thành tệp nhị phân Anki `.apkg` chuẩn qua thư viện `genanki`.

### `export_html(lecture_id: str) -> dict`
Xuất báo cáo học tập định dạng HTML toàn diện, tích hợp bản tóm tắt, liên kết sơ đồ tư duy và toàn bộ ghi chú cá nhân.

### `export_json(lecture_id: str) -> dict` / `export_txt(lecture_id: str) -> dict`
Xuất dữ liệu bản ghi thô dạng JSON hoặc Plain Text.

---

## 9. Cấu Hình & Kiểm Tra Kết Nối Cloud

### `get_settings() -> dict` / `save_settings(new_settings: dict) -> dict`
Đọc và lưu thiết lập người dùng (Chế độ AI Engine, API Key, Danh sách mô hình ưu tiên, Tham số Whisper/Llama).

### `test_cloud_connection(provider: str, api_key: str, base_url: str = "", model: str = "") -> dict`
Kiểm tra kết nối thực tế tới Cloud AI Provider (Gemini, Groq, OpenRouter, Ollama) và thông báo kết quả tức thì về giao diện.
