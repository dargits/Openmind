# 🛠️ Hướng Dẫn Biên Dịch & Cài Đặt Từ Mã Nguồn (Building & Installing From Source)

Tài liệu này cung cấp hướng dẫn chi tiết từng bước để cấu hình, cài đặt, kiểm thử và đóng gói ứng dụng **Open-mind** trực tiếp từ mã nguồn bằng **100% công cụ mã nguồn mở tiêu chuẩn** (Python, pip, setuptools, wheel, PyInstaller), tuân thủ nghiêm ngặt tiêu chí PoF của cuộc thi.

---

## 📋 1. Yêu Cầu Hệ Thống (Prerequisites)

- **Hệ điều hành:** Windows 10/11 (64-bit), Ubuntu 20.04+ / Debian, hoặc macOS 12+.
- **Python:** Phiên bản `>= 3.10` (Khuyên dùng Python 3.10 hoặc 3.11).
- **Trình quản lý gói:** `pip` và `setuptools` mới nhất.
- **Git:** Để nhân bản mã nguồn và quản lý phiên bản.
- **FFmpeg:** Cần thiết cho việc giải mã các định dạng audio (MP3, M4A, AAC).
  - *Windows:* Đã tích hợp sẵn hoặc tải qua `winget install Gyan.FFmpeg`.
  - *Linux (Ubuntu/Debian):* `sudo apt-get update && sudo apt-get install -y ffmpeg`.
  - *macOS:* `brew install ffmpeg`.

---

## ⚙️ 2. Cấu Hình Trước Khi Biên Dịch (Configuration Before Build)

> [!IMPORTANT]
> Dự án **tuyệt đối không yêu cầu sửa thủ công vào các tệp mã nguồn hay tệp header**. Toàn bộ cấu hình hệ thống được quản lý thông qua tệp môi trường `.env` hoặc các biến môi trường hệ điều hành (Chuẩn 12-Factor App).

1. Sao chép tệp cấu hình mẫu:
   ```bash
   # Trên Windows PowerShell hoặc Command Prompt:
   copy .env.example .env

   # Trên Linux hoặc macOS:
   cp .env.example .env
   ```

2. Tùy chỉnh các thông số trong `.env` theo nhu cầu (nếu muốn thay đổi mặc định):
   ```ini
   # Thư mục lưu trữ dữ liệu người dùng (có thể đặt ngoài thư mục mã nguồn)
   OPENMIND_DATA_DIR=

   # Thư mục lưu trữ mô hình AI
   OPENMIND_MODELS_DIR=

   # Kích cỡ mô hình Whisper STT (tiny, base, small, medium)
   OPENMIND_WHISPER_SIZE=small

   # Thiết bị tính toán (cpu hoặc cuda)
   OPENMIND_WHISPER_DEVICE=cpu

   # Số luồng CPU tính toán
   OPENMIND_WHISPER_CPU_THREADS=8
   OPENMIND_LLM_THREADS=6
   ```

---

## 🚀 3. Cài Đặt Từ Mã Nguồn (Installation From Source)

### Cách A: Cài đặt dạng Package chuẩn PEP 517/518 (Khuyên dùng)
Dự án cung cấp `pyproject.toml` và `setup.py` đầy đủ:

```bash
# 1. Khởi tạo môi trường ảo Python cô lập
python -m venv venv

# 2. Kích hoạt môi trường ảo
# Trên Windows:
.\venv\Scripts\activate
# Trên Linux / macOS:
source venv/bin/activate

# 3. Nâng cấp công cụ build chuẩn mở
python -m pip install --upgrade pip setuptools wheel

# 4. Cài đặt Open-mind ở chế độ phát triển (Editable Mode)
pip install -e .
```

### Cách B: Cài đặt truyền thống qua requirements.txt
```bash
python -m venv venv
# Kích hoạt venv, sau đó:
pip install -r requirements.txt
```

---

## 🧪 4. Kiểm Tra & Xác Minh Tính Toàn Vẹn (Verification & Testing)

Sau khi cài đặt từ mã nguồn, chạy bộ kiểm thử tự động để xác nhận toàn bộ các thành phần (Database, RAG, SRS, TranscriptPruner, Export Engine) hoạt động hoàn hảo:

```bash
python -m unittest tests/test_core.py -v
```
Kết quả kỳ vọng: **Tất cả 9/9 tests đều đạt `OK`**.

---

## ▶️ 5. Khởi Chạy Ứng Dụng (Running the Application)

### Khởi chạy thông qua lệnh dòng lệnh:
```bash
# Nếu đã cài đặt qua Cách A (pip install -e .):
open-mind

# Hoặc khởi chạy trực tiếp qua entrypoint:
python main.py
```

### Khởi chạy 1-Click:
- **Windows:** Nhấp đúp vào `run.bat`.
- **Linux / macOS:** Chạy `./run.sh`.

---

## 🌐 6. Khả Năng Hoạt Động Ngoài Thư Mục Mã Nguồn (Running Outside Source Tree)

Open-mind được thiết kế để giải quyết triệt để yêu cầu: **"Chương trình có thể hoạt động hoàn toàn độc lập ngay cả khi nằm ngoài thư mục mã nguồn"**.

Bạn có thể chạy ứng dụng từ bất kỳ thư mục nào trên máy tính bằng cách chỉ định đường dẫn lưu trữ qua biến môi trường:

```bash
# Ví dụ chạy từ ổ đĩa hoặc thư mục bất kỳ:
set OPENMIND_DATA_DIR=C:\Users\Username\Documents\OpenmindData
set OPENMIND_MODELS_DIR=D:\SharedAIModels
python E:\openmind\main.py
```
Ứng dụng sẽ tự động khởi tạo cơ sở dữ liệu SQLite và thư mục làm việc tại vị trí được chỉ định mà không phụ thuộc vào thư mục chứa code gốc.

---

## 📦 7. Đóng Gói Ứng Dụng Bằng Công Cụ Nguồn Mở (PyInstaller Packaging)

Dự án sử dụng **PyInstaller** (Giấy phép nguồn mở GPL v2 with exception) — công cụ tiêu chuẩn hàng đầu trong cộng đồng Python, tuyệt đối không sử dụng công cụ nguồn đóng hay công cụ tự tạo.

Để biên dịch ứng dụng thành tệp thực thi độc lập:

```bash
# 1. Cài đặt công cụ build
pip install -e ".[build]"

# 2. Chạy kịch bản PyInstaller
pyinstaller --noconfirm --onedir --windowed \
    --name "Openmind" \
    --add-data "ui;ui" \
    --add-data "data/demo_lecture.json;data" \
    --hidden-import "webview" \
    --hidden-import "engineio.async_drivers.threading" \
    main.py
```
Tệp thực thi độc lập sẽ được tạo ra tại thư mục `dist/Openmind/`.
