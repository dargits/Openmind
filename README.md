<div align="center">

# 🧠 Open-mind
### *Smart AI Lecture Copilot & Active Recall Learning Workspace*

<p align="center">
  <b>Biến file ghi âm bài giảng, video YouTube và slide PDF thành không gian học tập tương tác thông minh.</b><br>
  <i>Tự động tóm tắt, vẽ sơ đồ tư duy, tạo trắc nghiệm, luyện thẻ nhớ Ebbinghaus và trợ lý AI hỏi đáp trực tiếp trên bài học.</i>
</p>

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)
[![Python Version](https://img.shields.io/badge/Python-3.10%2B-3776AB.svg?style=flat-square&logo=python&logoColor=white)](https://www.python.org/)
[![AI Architecture](https://img.shields.io/badge/AI-Hybrid_(Cloud_%2B_Offline)-6366f1.svg?style=flat-square)](#-cấu-hình-mô-hình-ai)
[![STT Engine](https://img.shields.io/badge/STT-faster--whisper-8A2BE2.svg?style=flat-square)](https://github.com/SYSTRAN/faster-whisper)
[![Anki Export](https://img.shields.io/badge/Export-Anki_.apkg-00BFFF.svg?style=flat-square)](#-tính-năng-nổi-bật)

[Cài đặt & Khởi chạy](#-khởi-động-nhanh-quick-start) •
[Tính năng chính](#-tính-năng-nổi-bật) •
[Cấu hình AI](#-cấu-hình-mô-hình-ai) •
[Phím tắt & Mẹo](#-phím-tắt--mẹo-sử-dụng) •
[Tài liệu chi tiết](docs/)

</div>

---

## ⚡ Ứng dụng này giải quyết vấn đề gì?

Khi học tập và nghiên cứu, sinh viên thường ghi âm hàng chục giờ bài giảng nhưng **rất hiếm khi nghe lại** vì tốn thời gian tua tìm đoạn cần học. 

**Open-mind** giải quyết trọn vẹn việc này bằng quy trình học tập khép kín:
1. **Không cần nghe lại từ đầu đến cuối:** AI chuyển toàn bộ bài giảng thành văn bản có mốc thời gian `[MM:SS]`.
2. **Không tốn công soạn tài liệu:** Tự động sinh tóm tắt phân cấp, sơ đồ tư duy (Mindmap) và ngân hàng câu hỏi trắc nghiệm kèm lời giải.
3. **Ghi nhớ kiến thức dài hạn:** Tự động trích xuất thẻ Flashcards và áp dụng thuật toán lặp lại ngắt quãng (Spaced Repetition SM-2 & Đường cong quên lãng Ebbinghaus).

---

## ✨ Tính năng Nổi bật

| Tính năng | Mô tả chi tiết |
|:---|:---|
| 🎙️ **Phiên âm giọng nói chuẩn xác** | Xử lý âm thanh ngay trên máy tính bằng `faster-whisper` (int8). Tự động nhận diện và sửa các từ phát âm tiếng Việt bồi sang thuật ngữ CNTT quốc tế (`MD5`, `SQL`, `JSON`, `OOP`, `TCP/IP`...). Bấm vào câu để tua âm thanh ngay lập tức. |
| ⚡ **Auto-Pipeline 4-trong-1** | Vừa nạp bài học xong, hệ thống tự động sinh 4 phần học tập: **Tóm tắt 3 cấp độ**, **Sơ đồ tư duy Canvas**, **Quiz trắc nghiệm 4 lựa chọn** và **Bộ thẻ nhớ Flashcard**. |
| 📥 **Nhập YouTube & Slide PDF** | Dán trực tiếp liên kết YouTube để tải bài giảng, hoặc kéo thả file Slide thuyết trình / Giáo trình PDF để AI bóc tách nội dung theo trang. |
| 💬 **Trợ lý RAG hỏi-đáp bài giảng** | Chat trực tiếp với bài học. Trợ lý trả lời chính xác dựa trên lời giảng của thầy cô kèm dẫn chứng `[MM:SS]` để đối chiếu. |
| 📝 **Ghi chú Inline theo mốc thời gian** | Vừa nghe vừa ghi chú gắn liền với giây hiện tại của bài giảng. Có chế độ lọc "Chỉ xem ghi chú" giúp ôn thi cấp tốc. |
| 🔍 **Tìm kiếm toàn văn tức thì** | Tìm kiếm từ khóa xuyên suốt toàn bộ kho bài giảng, phụ đề và ghi chú bằng công cụ SQLite FTS5 tốc độ cao. |
| 🧠 **Khoa học ôn tập Ebbinghaus** | Biểu đồ dự báo số thẻ cần ôn trong 7 ngày tới theo công thức $R = 100 \times e^{-t/S}$. Hỗ trợ xuất trực tiếp bộ thẻ sang định dạng **Anki (`.apkg`)** và **Báo cáo học tập HTML**. |

---

## 🚀 Khởi động Nhanh (Quick Start)

Ứng dụng có cơ chế **tự động hoàn toàn**: tự tạo môi trường ảo, tự cài thư viện và tải dữ liệu mẫu.

### Cách 1: Chạy 1-Click (Khuyên dùng)
- **Windows:** Nhấp đúp vào file [`run.bat`](run.bat) (hoặc gõ `.\run.bat` trong Terminal).
- **Linux / macOS:** Chạy `./run.sh`.

### Cách 2: Khởi chạy bằng Python
```bash
# 1. Clone mã nguồn
git clone https://github.com/dargits/Openmind.git
cd Openmind

# 2. Tạo & kích hoạt môi trường ảo
python -m venv venv
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# 3. Cài đặt thư viện
pip install -r requirements.txt

# 4. Khởi chạy ứng dụng
python main.py
```

---

## 🤖 Cấu hình Mô hình AI

Open-mind hỗ trợ cả 2 chế độ suy luận AI linh hoạt (chỉnh tại tab **Cài đặt** trong ứng dụng):

### 1. Chế độ Đám mây (Cloud AI - Khuyên dùng)
* **Tốc độ cực nhanh (1 - 3 giây)** cho các tác vụ tóm tắt và sinh Quiz.
* Hỗ trợ: **Google Gemini** (`gemini-2.0-flash`, `gemini-1.5-flash`), **Groq** (`llama-3.3-70b`), **OpenRouter**, **Ollama**.
* **Cơ chế Auto-Fallback:** Khi một model hết quota miễn phí trong ngày, hệ thống tự động nhảy sang model tiếp theo trong danh sách mà không làm gián đoạn tác vụ của bạn.

### 2. Chế độ Cục bộ (100% Offline)
* Hoạt động độc lập không cần Internet với mô hình `Qwen 2.5 3B Instruct` (GGUF).
* Dữ liệu và file ghi âm được bảo mật tuyệt đối trên máy tính cá nhân.

---

## 💡 Phím tắt & Mẹo sử dụng

* `Space`: Tạm dừng / Phát tiếp âm thanh bài giảng.
* `←` / `→`: Tua lùi / Tua tiến 5 giây.
* `Click vào mốc thời gian [MM:SS]`: Nhảy trực tiếp đến đoạn âm thanh tương ứng.
* `1` / `2` / `3` / `4` (khi ôn thẻ nhớ): Đánh giá mức độ nhớ thẻ (*Again*, *Hard*, *Good*, *Easy*).

---

## 📁 Cấu trúc Thư mục

```text
Open-mind/
├── 📁 core/          # Bộ máy xử lý: STT Whisper, Hybrid LLM, RAG, SQLite FTS5, SM-2 SRS
├── 📁 ui/            # Giao diện Desktop hiện đại (HTML/CSS Glassmorphism/Vanilla JS)
├── 📁 docs/          # Trung tâm tài liệu kỹ thuật, kiến trúc & đặc tả API
├── 📁 data/          # CSDL SQLite và tệp học tập cá nhân (100% riêng tư)
├── 📁 models/        # Thư mục lưu trữ trọng số mô hình AI offline
├── 📁 scripts/       # Kịch bản đóng gói bản phát hành mở & PyInstaller
├── main.py           # Điểm khởi chạy ứng dụng
├── run.bat           # File chạy 1-Click trên Windows
└── requirements.txt  # Danh sách thư viện phụ thuộc
```

---

## 📚 Tài liệu Tham khảo Thêm

* 🏗️ **[Kiến trúc hệ thống chi tiết](docs/architecture.md)** — Sơ đồ luồng dữ liệu và thiết kế phân tầng.
* 🔌 **[Đặc tả API giao tiếp](docs/api.md)** — Danh mục API giữa Python Backend và Giao diện JS.
* 🛠️ **[Biên dịch từ mã nguồn](docs/BUILDING.md)** — Hướng dẫn đóng gói exe độc lập và kiểm thử.
* 📦 **[Thư viện phụ thuộc & Bản quyền](docs/DEPENDENCIES.md)** — Kê khai 100% thư viện và ma trận giấy phép.
* 🏆 **[Báo cáo tiêu chí cuộc thi PMMN & AI](docs/COMPETITION_POF.md)** — Bảng đối chiếu tiêu chí đánh giá PoF.

---

## 📄 Giấy phép Bản quyền (License)

Dự án được phát hành mã nguồn mở theo giấy phép **[MIT License](LICENSE)**. Mọi cá nhân và tổ chức đều có quyền tự do sử dụng, nghiên cứu, sửa đổi và phân phối phục vụ mục đích học tập và phát triển cộng đồng.