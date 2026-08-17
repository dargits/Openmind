<div align="center">

# 🧠 Open-mind
### *Offline AI-Powered Academic Lecture Copilot & Active Recall Learning Workspace*

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Python Version](https://img.shields.io/badge/Python-3.10%2B-brightgreen.svg)](https://www.python.org/)
[![AI Runtime](https://img.shields.io/badge/AI%20Runtime-100%25%20Offline-orange.svg)](#)
[![STT](https://img.shields.io/badge/STT-faster--whisper--small-blueviolet.svg)](https://github.com/SYSTRAN/faster-whisper)
[![LLM](https://img.shields.io/badge/LLM-Qwen2.5--3B--Instruct-purple.svg)](https://github.com/ggerganov/llama.cpp)
[![UI](https://img.shields.io/badge/UI-Modern%20Webview-teal.svg)](#)
[![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20Linux%20%7C%20macOS-lightgrey.svg)](#)

<p align="center">
  <b>Biến mọi file ghi âm bài giảng thành hệ sinh thái học tập tương tác cá nhân hóa — 100% On-Device, Bảo mật tuyệt đối & Không cần kết nối Internet.</b>
</p>

</div>

---

## 📖 Giới thiệu (Overview)

**Open-mind** là trợ lý học tập AI cục bộ chuyên sâu dành cho sinh viên, giảng viên và người tự học. Ứng dụng tích hợp quy trình xử lý toàn diện từ âm thanh bài giảng thô đến hệ thống ghi nhớ chủ động (*Active Recall & Spaced Repetition*), kết hợp mô hình ngôn ngữ lớn để hỏi đáp ngữ cảnh trực tiếp trên bài giảng mà không phụ thuộc vào bất kỳ dịch vụ đám mây nào.

```
                  ┌─────────────────────────────────────────────────────────┐
                  │                 File Ghi âm Bài giảng                   │
                  └────────────────────────────┬────────────────────────────┘
                                               ▼
                         🎙️ Faster-Whisper Small (int8 / CPU)
                     (Phát hiện tiếng Việt + Thuật ngữ CNTT/Anh)
                                               │
                                               ▼
                              Bản ghi Transcript kèm Timestamps
                                               │
                 ┌─────────────────────────────┼─────────────────────────────┐
                 ▼                             ▼                             ▼
        📋 Tóm tắt phân cấp          🗂️ Thẻ Flashcard          ❓ Trắc nghiệm AI
        & Mindmap Tương tác          (Thuật toán SM-2)        (Chấm điểm tức thì)
                 │                             │                             │
                 └─────────────────────────────┼─────────────────────────────┘
                                               ▼
                              💬 Local RAG Chatbot (Qwen 2.5 3B)
                              📊 Dashboard Tiến độ & Chuỗi Streak
```

---

## ✨ Tính năng Nổi bật (Key Features)

### 🎙️ 1. Studio Bài giảng & Nhận diện Giọng nói (Speech-to-Text)
- **Chuẩn hóa mô hình `faster-whisper-small` (~460 MB):** Tối ưu hóa cân bằng giữa tốc độ xử lý nhanh (~3x thời gian thực trên CPU thông thường) và độ chính xác cao đối với bài giảng tiếng Việt.
- **Xử lý thuật ngữ chuyên ngành (Code-switching):** Bộ quy tắc tiền xử lý và chuẩn hóa ngữ âm tự động khôi phục các thuật ngữ công nghệ thông tin/khoa học máy tính bị phát âm sai (như `MD5`, `SHA-256`, `SQL`, `JWT`, `OOP`, `Interface`, `Complexity`,...).
- **Đồng bộ âm thanh & Timestamps:** Trình phát đa phương tiện tích hợp cho phép tua trực tiếp đến từng đoạn phát biểu theo mốc thời gian `[MM:SS]`.

### 📑 2. Tóm tắt Phân cấp & Sơ đồ Tư duy (Interactive Mindmap)
- **Cấu trúc 3 cấp độ:** 
  1. *Tóm tắt Tổng quan (Executive Summary)* — nắm bắt bức tranh toàn cảnh bài học.
  2. *Ý chính Cốt lõi (Key Takeaways)* — ghi nhớ các điểm trọng tâm.
  3. *Chi tiết theo Mốc thời gian* — đối chiếu nội dung theo mạch giảng của thầy cô.
- **Mindmap Canvas tương tác:** Tự động phát sinh sơ đồ cây kiến thức trực quan, hỗ trợ kéo rê (pan), cuộn thu phóng (zoom) và khám phá nhánh nội dung.

### 🗂️ 3. Thẻ Ghi nhớ Thông minh & Thuật toán SM-2 (Spaced Repetition)
- Tự động trích xuất các cặp khái niệm – định nghĩa trọng tâm từ nội dung bài học.
- **Thuật toán SuperMemo-2 (SM-2):** Tự động tính toán chu kỳ ôn tập tối ưu cho từng thẻ dựa trên 4 mức độ phản hồi:
  - 🔴 **Quên (Again)**: Lặp lại ngay trong ngày kế tiếp, thiết lập lại chu kỳ.
  - 🟠 **Khó (Hard)**: Tăng khoảng cách ôn tập vừa phải (+20%).
  - 🟢 **Tốt (Good)**: Tính toán chu kỳ chuẩn theo hệ số ghi nhớ `ease_factor`.
  - 🔵 **Dễ (Easy)**: Thưởng khoảng cách chu kỳ dài hơn và nâng hệ số nhớ.
- Hàng đợi thông minh tự động nhắc nhở các thẻ đến hạn (*Due Cards*).

### ❓ 4. Bộ Đề Trắc nghiệm Tự động (AI Quiz Generator)
- Tự động sinh ngân hàng câu hỏi trắc nghiệm theo 3 cấp độ (Dễ, Trung bình, Khó).
- Chấm điểm ngay lập tức sau khi nộp bài kèm đáp án đúng và phần giải thích chi tiết lý do.

### 💬 5. Trợ lý Hỏi-Đáp Bài giảng (Local RAG Chatbot)
- Sử dụng mô hình **Qwen 2.5 3B Instruct (Q4_K_M GGUF)** chạy hoàn toàn bằng CPU/GPU nội bộ qua `llama.cpp`.
- Cơ chế tìm kiếm ngữ cảnh cục bộ (*Hybrid Chunking & Retrieval*) trả lời chính xác câu hỏi và trích dẫn trực tiếp mốc thời gian nguồn `[MM:SS]`.

### 📊 6. Không gian Học tập & Thống kê Tiến độ (Study Space)
- Thư viện quản lý tập trung toàn bộ bài giảng với công cụ lọc theo thẻ/môn học.
- Bảng điều khiển trực quan hiển thị: Chuỗi ngày học liên tục (*Daily Streak*), Tổng thời gian nghiên cứu, Điểm trắc nghiệm trung bình và Biểu đồ hoạt động 7 ngày.

### 📤 7. Xuất Dữ liệu Đa Định dạng (Export Engine)
- Xuất bộ thẻ tương thích phần mềm **Anki** (`.csv`).
- Xuất báo cáo học thuật định dạng **HTML Report** sẵn sàng in ấn hoặc lưu file PDF.
- Xuất bản ghi thô (`.txt`) và gói dữ liệu tổng hợp (`.json`).

---

## 💻 Yêu cầu Hệ thống (System Requirements)

| Tiêu chí | Cấu hình Tối thiểu | Cấu hình Khuyến nghị |
|:---|:---|:---|
| **Hệ điều hành** | Windows 10/11 (64-bit), Ubuntu 20.04+, macOS 12+ | Windows 11 / macOS (Apple Silicon) / Linux |
| **Bộ xử lý (CPU)** | Intel Core i3 / AMD Ryzen 3 (4 nhân) | Intel Core i5/i7, AMD Ryzen 5/7 hoặc Apple M-series |
| **Bộ nhớ RAM** | 6 GB RAM | 8 GB – 16 GB RAM |
| **Dung lượng đĩa** | 5 GB khả dụng (chứa Model AI & Database) | 10 GB SSD khả dụng |
| **Kết nối mạng** | Chỉ cần tải model ở lần khởi chạy đầu | **0% Internet** trong quá trình sử dụng thường ngày |

---

## 🚀 Hướng dẫn Cài đặt & Khởi chạy (Quick Start)

Open-mind được tích hợp cơ chế tự động hóa: tự khởi tạo môi trường ảo Python `venv`, tự cài đặt thư viện cần thiết và tự động tải mô hình AI nếu chưa có.

### Cách 1: Chạy 1-Click (Khuyên dùng)
- **Windows:** Nhấp đúp chuột vào file [`run.bat`](run.bat) (hoặc chạy `.\run.bat` trong Terminal).
- **Linux / macOS:** Mở Terminal và chạy:
  ```bash
  chmod +x run.sh
  ./run.sh
  ```

### Cách 2: Chạy qua Lệnh Python
```bash
# 1. Clone repository
git clone https://github.com/dargits/Openmind.git
cd Openmind

# 2. Tạo môi trường ảo và cài đặt dependencies
python -m venv venv
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt

# 3. Khởi chạy ứng dụng
python main.py
```

---

## 🏗️ Cấu trúc Dự án (Repository Structure)

```text
Open-mind/
├── core/                       # Các module xử lý logic nền tảng
│   ├── config.py               # Cấu hình đường dẫn, tham số model & phần cứng
│   ├── stt_engine.py           # Engine Whisper Small & Bộ chuẩn hóa ngữ âm
│   ├── llm_engine.py           # Controller Qwen 2.5 LLM & Prompt engineering
│   ├── flashcard_srs.py        # Triển khai thuật toán SuperMemo-2 (SM-2)
│   ├── rag_engine.py           # Hybrid Chunking & Trích xuất ngữ cảnh RAG
│   ├── export_engine.py        # Xuất dữ liệu ra TXT, JSON, Anki CSV, HTML
│   └── model_manager.py        # Quản lý kiểm tra & tải model AI tự động
├── data/                       # Quản lý cơ sở dữ liệu & Cài đặt
│   ├── database.py             # Data Access Layer SQLite (CRUD bài giảng, thẻ, quiz)
│   └── .gitkeep                # Giữ cấu trúc thư mục (openmind.db được bảo vệ)
├── demo_data/                  # Dữ liệu bài giảng mẫu phục vụ thử nghiệm
│   ├── demo_lecture_dsa.json   # Dữ liệu mẫu hoàn chỉnh (transcript, flashcards, quiz)
│   └── demo_lecture_dsa.txt    # Bản ghi thô của bài giảng mẫu
├── models/                     # Thư mục chứa trọng số mô hình AI (offline)
│   └── README.md               # Hướng dẫn tải thủ công model nếu cần
├── outputs/                    # Thư mục mặc định cho các file xuất ra (.gitkeep)
├── samples/                    # Thư mục lưu file audio ghi âm thử nghiệm (.gitkeep)
├── tests/                      # Bộ kiểm thử tự động (Unit Tests)
│   └── test_core.py            # Kiểm thử Database, SRS SM-2, RAG & Export
├── tools/                      # Bộ công cụ bổ trợ
│   ├── benchmark_stt.py        # Công cụ đo đạc hiệu năng STT độc lập
│   └── seed_demo_data.py       # Script nạp dữ liệu mẫu vào database
├── ui/
│   └── web/                    # Giao diện người dùng hiện đại (HTML5/CSS3/Vanilla JS)
│       ├── css/style.css       # Design System giao diện hiện đại & responsive
│       ├── js/                 # Bộ điều khiển các trang (lecture, flashcard, stats,...)
│       └── index.html          # Cấu trúc giao diện Webview chính
├── app_api.py                  # Cầu nối API giao tiếp hai chiều Python <-> Javascript
├── main.py                     # Entrypoint khởi chạy ứng dụng Desktop
├── requirements.txt            # Danh sách thư viện Python phụ thuộc
├── run.bat                     # Script khởi chạy 1-Click trên Windows
├── run.sh                      # Script khởi chạy 1-Click trên Linux/macOS
├── CONTRIBUTING.md             # Quy chuẩn đóng góp mã nguồn
└── LICENSE                     # Giấy phép mã nguồn mở MIT
```

---

## 🧪 Kiểm thử (Testing & Quality Assurance)

Dự án đi kèm bộ unit test bao phủ toàn bộ các module lõi (Database CRUD, thuật toán SM-2, RAG Engine, Export HTML/Anki/JSON):

```bash
# Chạy bộ unit tests
python -m unittest tests/test_core.py
```

Để đánh giá hiệu năng nhận diện giọng nói STT trên bài giảng thực tế:
```bash
python tools/benchmark_stt.py --audio samples/lecture_sample.mp3 --reference samples/lecture_ground_truth.txt
```

---

## 🔒 Cam kết Quyền riêng tư (Privacy & Security)

- **100% Local Execution:** Toàn bộ file ghi âm giọng nói, bản ghi văn bản, câu hỏi trắc nghiệm và lịch sử học tập được lưu trữ và xử lý trực tiếp trên máy của bạn.
- **Không Telemetry:** Không gửi bất kỳ dữ liệu cá nhân hay dữ liệu học tập nào lên máy chủ bên thứ ba.
- **Độc lập Mạng:** Sau khi các file mô hình được tải về thư mục `models/`, bạn có thể ngắt hoàn toàn kết nối Wi-Fi/Internet mà ứng dụng vẫn hoạt động 100% công suất.

---

## 🤝 Đóng góp Phát triển (Contributing)

Chúng tôi luôn chào đón các đóng góp từ cộng đồng để phát triển Open-mind ngày một hoàn thiện hơn. Vui lòng xem tài liệu [CONTRIBUTING.md](CONTRIBUTING.md) để nắm rõ quy trình gửi Pull Request, Coding Conventions và báo cáo sự cố (Issues).

---

## 📄 Giấy phép (License)

Dự án được phân phối dưới giấy phép **[MIT License](LICENSE)**. Toàn bộ mã nguồn được mở và tự do sử dụng cho mục đích học tập, nghiên cứu cũng như thương mại.