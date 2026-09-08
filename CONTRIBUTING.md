# Hướng Dẫn Đóng Góp — Open-mind (Contributing Guide)

Cảm ơn bạn đã quan tâm đến việc phát triển và đóng góp cho **Open-mind** — dự án mã nguồn mở trợ lý học tập AI cục bộ 100% Offline!

Tài liệu này cung cấp các nguyên tắc và quy trình chuẩn để bạn có thể gửi ý kiến, báo lỗi hoặc đóng góp mã nguồn (Pull Request) một cách thuận tiện nhất.

---

## 🧭 Mục lục

1. [Quy tắc ứng xử](#1-quy-tắc-ứng-xử)
2. [Cài đặt môi trường phát triển](#2-cài-đặt-môi-trường-phát-triển)
3. [Quy trình đóng góp (Git Workflow)](#3-quy-trình-đóng-góp-git-workflow)
4. [Cấu trúc mã nguồn & Phong cách lập trình](#4-cấu-trúc-mã-nguồn--phong-cách-lập-trình)
5. [Chạy Benchmark & Kiểm thử](#5-chạy-benchmark--kiểm-thử)
6. [Báo cáo lỗi & Đề xuất tính năng mới](#6-báo-cáo-lỗi--đề-xuất-tính-năng-mới)

---

## 1. Quy tắc ứng xử

- Tôn trọng các thành viên khác trong cộng đồng và ban giám khảo.
- Đặt tiêu chí trải nghiệm người dùng, tính ổn định và tôn trọng quyền riêng tư (chạy 100% Offline) lên hàng đầu.

---

## 2. Cài đặt môi trường phát triển

### 2.1. Yêu cầu hệ thống
- **Python:** Phiên bản `>= 3.10` (khuyến nghị Python 3.11).
- **Git:** Đã cài đặt trên máy.

### 2.2. Khởi tạo môi trường
```powershell
# 1. Clone kho lưu trữ
git clone https://github.com/[TÊN_TAI_KHOAN]/Open-mind.git
cd Open-mind

# 2. Tạo và kích hoạt môi trường ảo
python -m venv venv
.\venv\Scripts\Activate.ps1    # Trên Windows PowerShell
# source venv/bin/activate     # Trên Linux / macOS

# 3. Cài đặt các gói phụ thuộc
pip install --upgrade pip
pip install -r requirements.txt
```

### 2.3. Cài đặt mô hình AI
- Đặt mô hình ngôn ngữ `qwen2.5-3b-instruct-q4_k_m.gguf` vào thư mục `models/`.
- Đặt hoặc tải các mô hình `faster-whisper-small` (hoặc `tiny`, `base`, `medium`) vào thư mục `models/`.

---

## 3. Quy trình đóng góp (Git Workflow)

1. **Fork** kho lưu trữ về tài khoản GitHub của bạn.
2. Tạo một nhánh mới từ nhánh `main`:
   ```bash
   git checkout -b feature/ten-tinh-nang-moi
   # hoặc
   git checkout -b fix/ten-loi-can-sua
   ```
3. Thực hiện các chỉnh sửa, bổ sung code và commit có thông điệp rõ ràng:
   ```bash
   git commit -m "feat: bổ sung hỗ trợ xuất file Markdown"
   ```
4. Đẩy nhánh lên fork của bạn:
   ```bash
   git push origin feature/ten-tinh-nang-moi
   ```
5. Mở một **Pull Request (PR)** vào nhánh `main` của dự án gốc kèm theo mô tả chi tiết:
   - Thay đổi gồm những gì?
   - Đã kiểm tra (test) trên hệ điều hành / cấu hình nào?

---

## 4. Cấu trúc mã nguồn & Phong cách lập trình

Mã nguồn được phân tách theo mô hình kiến trúc module rõ ràng:

- **`core/`**: Chứa toàn bộ logic lõi về AI và thuật toán:
  - `database.py`: Data Access Layer SQLite (WAL Mode).
  - `api.py`: Cầu nối API hai chiều Python ↔ Webview.
  - `demo_seeder.py`: Logic nạp bài giảng mẫu ban đầu.
  - `stt_engine.py`: Tương tác với faster-whisper.
  - `llm_engine.py`: Tương tác với llama-cpp-python, prompt templates & TranscriptPruner.
  - `flashcard_srs.py`: Thuật toán lặp lại ngắt quãng SuperMemo-2 (SM-2).
  - `rag_engine.py`: Xử lý chunking và tra cứu ngữ cảnh bài giảng.
  - `export_engine.py`: Xuất dữ liệu HTML, JSON, TXT, Anki CSV.
  - `config.py`: Quản lý đường dẫn, cấu hình phần cứng và settings.
- **`ui/`**: Giao diện người dùng Webview hiện đại (HTML/CSS/Vanilla JS).
- **`data/`**: Cơ sở dữ liệu SQLite và tệp dữ liệu bài giảng mẫu (`demo_lecture.json`).
- **`models/`**: Thư mục lưu trữ trọng số mô hình AI cục bộ (100% Offline).
- **`tests/`**: Toàn bộ kiểm thử tự động và công cụ đo đạc (`benchmark_stt.py`).

### Quy chuẩn Code:
- Tuân thủ chuẩn **PEP 8** cho mã nguồn Python.
- Giữ logic tách bạch: Không gọi trực tiếp giao diện đồ họa bên trong `core/`.
- Tất cả hàm xử lý dữ liệu nặng/AI bắt buộc phải bọc xử lý lỗi `try/except` an toàn và hỗ trợ non-blocking thread để không làm treo giao diện.

---

## 5. Chạy Benchmark & Kiểm thử

Trước khi gửi Pull Request, hãy đảm bảo các chức năng hoạt động chính xác và chạy công cụ benchmark để đánh giá không làm suy giảm hiệu năng:

```bash
# Chạy Unit Tests
python -m unittest tests/test_core.py -v

# Kiểm tra Benchmark STT
python tests/benchmark_stt.py --audio data/samples/lecture_sample.mp3 --models tiny,small
```

---

## 6. Báo cáo lỗi & Đề xuất tính năng mới

Nếu bạn phát hiện lỗi hoặc muốn đề xuất cải tiến, vui lòng mở một **Issue** theo mẫu sau:

### Mẫu báo cáo lỗi (Bug Report):
```markdown
**Mô tả lỗi:**
Mô tả ngắn gọn và súc tích về lỗi gặp phải.

**Các bước tái hiện lỗi:**
1. Mở ứng dụng và vào mục '...'
2. Chọn file âm thanh '...'
3. Bấm vào '...'
4. Thấy thông báo lỗi xuất hiện.

**Cấu hình thiết bị:**
- Hệ điều hành: Windows 11 / 10 / Linux
- RAM: 8GB / 16GB
- Cỡ model STT: small / tiny / base

**Log lỗi / Ảnh chụp màn hình (nếu có):**
[Dán log hoặc ảnh tại đây]
```

---
*Cảm ơn sự đóng góp của bạn để Open-mind Pro ngày càng hoàn thiện hơn! 🚀*
