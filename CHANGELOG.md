# 📋 Nhật Ký Thay Đổi Mã Nguồn (Changelog)

Tất cả các thay đổi quan trọng của dự án **Open-mind** sẽ được ghi chép chi tiết trong tệp này.

Định dạng dựa trên [Keep a Changelog](https://keepachangelog.com/vi/1.0.0/),
và dự án này tuân thủ chuẩn [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-09-09
### 🎉 Phiên bản Chính thức Dự thi (Official Competition Release)

#### Added
- **Đếm thời gian tác vụ AI trực tiếp (Real-time Task Timers)**:
  - Bổ sung tiện ích `TaskTimer` hiển thị số giây và huy hiệu trạng thái nhấp nháy cho tất cả tác vụ: nhận diện giọng nói (STT), sinh tóm tắt, trích xuất Flashcards, tạo bộ Quiz trắc nghiệm và RAG Q&A.
- **Cơ chế Batching & Đảm bảo chính xác số lượng Quiz / Flashcards**:
  - Triển khai thuật toán sinh theo từng lô (Batching 5 câu/lần) kèm cơ chế "Top-up retry" tự động bù đắp câu hỏi thiếu nếu LLM trả về không đủ số lượng người dùng yêu cầu.
  - Bộ lọc chuẩn hóa `_sanitize_quiz_item` và `_sanitize_flashcard_item` triệt tiêu đại từ mơ hồ ("câu này", "nó là gì"), định dạng đúng 4 đáp án A/B/C/D ngẫu nhiên và giải thích chi tiết đáp án đúng.
- **Tiêu chuẩn hóa Giấy phép & Bản quyền Nguồn mở (OSI-approved MIT License)**:
  - Tích hợp `SPDX-License-Identifier: MIT` và copyright header vào 100% các tệp mã nguồn Python, JavaScript, CSS và HTML.
  - Bổ sung thông báo mục đích giấy phép rõ ràng trong `LICENSE` và `README.md`.
- **Hồ sơ Phụ thuộc & Tính Tương thích Giấy phép**:
  - Tạo `DEPENDENCIES.md` kê khai minh bạch toàn bộ các thư viện bên thứ ba và ma trận tương thích 100% với giấy phép MIT.
- **Chuẩn hóa Đóng gói & Biên dịch từ Mã nguồn**:
  - Cung cấp `pyproject.toml` và `setup.py` theo tiêu chuẩn PEP 517/518/621, hỗ trợ cài đặt dạng gói phát triển `pip install -e .`.
  - Tài liệu chi tiết `BUILDING.md` hướng dẫn dịch và cài đặt từ mã nguồn trên Windows, Linux và macOS.
  - Tệp mẫu cấu hình môi trường `.env.example` và script đóng gói release định dạng mở `.tar.gz` (`scripts/package_release.py`).
- **Hệ thống Quản lý Lỗi (Bug Tracker)**:
  - Thiết lập biểu mẫu báo cáo lỗi `.github/ISSUE_TEMPLATE/bug_report.md` và đề xuất tính năng `.github/ISSUE_TEMPLATE/feature_request.md`.

#### Changed
- Tối ưu hóa cấu hình CPU đa luồng cho `llama.cpp` và `faster-whisper` (`compute_type="int8"`, `threads=min(8, os.cpu_count())`).
- Nâng cấp giao diện người dùng Desktop SPA với thiết kế Glassmorphism & bảng màu HSL hiện đại.

---

## [0.9.0] - 2026-09-08
### Added
- **Đổi tên bài giảng & bộ thẻ linh hoạt**: Cho phép người dùng chỉnh sửa tiêu đề bài giảng và tên bộ thẻ Flashcards trực tiếp trên giao diện và đồng bộ tức thì vào SQLite Database.
- **TranscriptPruner**: Bộ lọc heuristic tự động loại bỏ các đoạn giới thiệu thừa (chào hỏi, xin like/sub) và phần kết thúc video/bài giảng trước khi đưa vào LLM.
- **Bộ chuẩn hóa ngữ âm chuyên ngành CNTT (Vietnamese Phonetic Normalizer)**: Phục hồi chính xác các từ bồi tiếng Việt sang thuật ngữ quốc tế (`MD5`, `SHA-256`, `SQL`, `OOP`, `JSON`, `TCP/IP`...).

#### Fixed
- Khắc phục lỗi hiển thị tiêu đề file ghi âm quá dài gây tràn vỡ layout sidebar.
- Sửa lỗi trạng thái xoay vòng vô tận (infinite spinner) khi LLM phản hồi chậm.

---

## [0.5.0] - 2026-08-20
### Added
- **Hệ thống lặp lại ngắt quãng SuperMemo-2 (SM-2)**: Quản lý Ease Factor, khoảng thời gian ôn tập và phân loại trạng thái thẻ học tập.
- **Bộ hỏi đáp cục bộ (Local RAG Engine)**: Sliding-window Chunking kết hợp xếp hạng điểm BM25 trích xuất chính xác ngữ cảnh bài giảng và đối chiếu mốc thời gian `[MM:SS]`.
- **Interactive Mindmap Canvas**: Sơ đồ tư duy dạng cây với khả năng thu phóng, kéo rê mượt mà trên HTML5 Canvas.
- **Engine Xuất dữ liệu đa định dạng**: Hỗ trợ xuất bộ thẻ Anki (.csv/.tsv), Báo cáo học tập HTML sẵn sàng in ấn, và gói dữ liệu JSON.

---

## [0.1.0] - 2026-08-10
### Added
- Khởi tạo kiến trúc dự án Open-mind với cầu nối Desktop PyWebView Python ↔ JavaScript.
- Tích hợp mô hình nhận diện giọng nói `faster-whisper` (hỗ trợ các kích cỡ tiny, base, small).
- Tích hợp mô hình ngôn ngữ lớn chạy nội bộ `Qwen 2.5 3B Instruct` qua định dạng `GGUF`.
- Cơ sở dữ liệu SQLite cục bộ với cấu hình WAL Mode an toàn và nhanh chóng.
