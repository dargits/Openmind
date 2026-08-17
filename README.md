# 🧠 Open-mind Pro: Hệ sinh thái Học tập AI Toàn diện (100% Offline)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Python Version](https://img.shields.io/badge/Python-3.10%2B-brightgreen.svg)](https://www.python.org/)
[![AI Runtime](https://img.shields.io/badge/AI%20Runtime-100%25%20Offline-orange.svg)](#)
[![STT](https://img.shields.io/badge/STT-faster--whisper-blueviolet.svg)](https://github.com/SYSTRAN/faster-whisper)
[![LLM](https://img.shields.io/badge/LLM-Qwen2.5--3B--Instruct-purple.svg)](https://github.com/ggerganov/llama.cpp)

**Open-mind Pro** là ứng dụng desktop chạy **hoàn toàn Offline** trên máy tính cá nhân, biến mọi file ghi âm bài giảng thành một **hệ sinh thái học tập cá nhân hóa**: trích xuất văn bản (Speech-to-Text đa cỡ model), tóm tắt phân cấp, sinh câu hỏi trắc nghiệm tương tác, **bộ thẻ Flashcard thông minh với thuật toán lặp lại ngắt quãng (SM-2 Spaced Repetition)**, **sơ đồ tư duy (Mindmap) tương tác**, **trợ lý AI hỏi-đáp bài giảng (Local RAG Chat)**, cùng **dashboard thống kê tiến độ học tập**.

---

## 💻 Yêu cầu hệ thống (System Requirements)

Hệ thống được thiết kế linh hoạt, cho phép lựa chọn cấu hình mô hình phù hợp với cấu hình phần cứng:

| Cỡ Model STT | Dung lượng | Tốc độ | RAM Khuyến nghị | Khả năng đáp ứng bài giảng Tiếng Việt |
|:---|:---:|:---:|:---:|:---|
| **Tiny** | ~75 MB | Siêu nhanh (~10x) | ≥ 4 GB RAM | Phù hợp máy cấu hình yếu, nhận diện cơ bản. |
| **Base** | ~145 MB | Nhanh (~6x) | ≥ 4 GB RAM | Nhận diện câu thông dụng tốt, tốc độ phản hồi cao. |
| **Small (Mặc định)** | ~460 MB | Cân bằng (~3x) | ≥ 6 GB RAM | **Khuyên dùng:** Cân bằng tối ưu tiếng Việt & thuật ngữ tiếng Anh. |
| **Medium** | ~1.5 GB | Chậm (~1x) | ≥ 8 GB RAM | Độ chính xác cao nhất cho bài giảng học thuật chuyên sâu. |

- **Hệ điều hành:** Windows 10/11 (64-bit), Linux hoặc macOS.
- **CPU:** Intel/AMD Core i3 trở lên (Khuyến nghị 4 nhân thực trở lên).
- **Bộ nhớ trống:** Tối thiểu 5GB để lưu trữ mô hình và cơ sở dữ liệu học tập.
- **Mạng:** **0% Internet** (100% dữ liệu và mô hình AI vận hành an toàn trên máy cục bộ).

---

## 🌟 Các tính năng chính

### 1. 🎙️ Studio Bài giảng (Lecture Studio)
- **Nhận diện giọng nói thời gian thực (STT):** Sử dụng mô hình `faster-whisper` (`tiny`, `base`, `small`, `medium`) lượng tử hóa `int8` trên CPU, hiển thị mốc thời gian (timestamps) và thanh tiến trình streaming.
- **Ngữ cảnh chuyên ngành:** Ô nhập prompt gợi ý từ khóa/thuật ngữ tiếng Anh giúp tăng độ chuẩn xác.
- **Trình phát âm thanh đồng bộ (Audio Sync Player):** Tích hợp trình phát âm thanh, cho phép tua nhanh/lùi và cập nhật thời lượng.

### 2. 📋 Tóm tắt phân cấp & Sơ đồ tư duy (Mindmap)
- **Tóm tắt 3 cấp độ:** Tổng quan bài giảng (Executive Summary), Ý chính cốt lõi (Key Takeaways) và Tóm tắt chi tiết từng phần kèm mốc thời gian `[MM:SS]`.
- **Sơ đồ tư duy tương tác (Mindmap Canvas):** Tự động phân nhánh cây kiến thức, hỗ trợ rê chuột (pan), cuộn thu phóng (zoom) và vẽ đồ họa mượt mà.

### 3. ❓ Trắc nghiệm thông minh & Chấm điểm tức thì
- Tùy chọn độ khó (Dễ / Trung bình / Khó) và số lượng câu hỏi (3, 5, 8, 10 câu).
- Giao diện làm bài trắc nghiệm trực quan, bấm nộp bài để nhận điểm số ngay lập tức kèm đáp án và lời giải thích chi tiết, tự động lưu lịch sử vào cơ sở dữ liệu.

### 4. 🗂️ Flashcard Thông minh + Thuật toán SM-2 (Spaced Repetition)
- Tự động rút trích bộ thẻ khái niệm/định nghĩa từ bài giảng.
- Quản lý bộ thẻ (Decks) và cho phép thêm/sửa/xóa thẻ thủ công.
- **Chế độ ôn tập lật thẻ (Flip Card):** Hiệu ứng lật thẻ xem đáp án kèm 4 nút đánh giá chuẩn SM-2:
  - 🔴 **Quên (Again)**: Lặp lại ngay sau 1 ngày, reset chu kỳ.
  - 🟠 **Khó (Hard)**: Tăng giãn cách vừa phải (+20%).
  - 🟢 **Tốt (Good)**: Tính toán chu kỳ chuẩn theo hệ số `ease_factor`.
  - 🔵 **Rất Dễ (Easy)**: Thưởng thêm chu kỳ dài hơn và tăng hệ số ghi nhớ.
- Tự động lọc các thẻ đến hạn (`due_date <= hôm nay`) để nhắc người dùng ôn tập.

### 5. 💬 Trợ lý Hỏi-đáp Bài giảng (Local RAG Chat)
- Tìm kiếm đoạn trích xuất liên quan trong bài giảng và đưa vào ngữ cảnh cho mô hình `Qwen 2.5 3B` trả lời.
- Kèm theo trích dẫn mốc thời gian `[MM:SS]` cụ thể của bài giảng.

### 6. 📊 Dashboard Thống kê & Thư viện (Study Space)
- Quản lý toàn bộ bài giảng trong thư viện, tìm kiếm và lọc theo danh mục/môn học.
- Bảng thống kê trực quan: Tổng giờ học, Số thẻ cần ôn hôm nay, Điểm thi trắc nghiệm trung bình, Chuỗi ngày học liên tục (streak) và biểu đồ lịch sử học tập 7 ngày.

### 7. 💾 Xuất dữ liệu đa định dạng
- Xuất bản ghi `.txt`, gói dữ liệu tổng hợp `.json`.
- Xuất bộ thẻ tương thích phần mềm Anki (`.csv`).
- Xuất báo cáo học tập định dạng `.html` chuẩn để in ấn hoặc lưu PDF.

---

## 🏗️ Kiến trúc Module

```text
Open-mind/
├── main.py                        # Entrypoint khởi chạy ứng dụng
├── requirements.txt               # Dependencies
├── data/
│   ├── openmind.db                # Cơ sở dữ liệu SQLite trung tâm
│   ├── database.py                # Data Access Layer & CRUD
│   └── settings.json              # File lưu trữ cấu hình người dùng
├── core/
│   ├── config.py                  # Cấu hình đường dẫn, thread & model metadata
│   ├── stt_engine.py              # faster-whisper STT dynamic wrapper
│   ├── llm_engine.py              # Qwen2.5 LLM controller & Prompting
│   ├── flashcard_srs.py           # Thuật toán SuperMemo-2 (SM-2)
│   ├── rag_engine.py              # Hybrid Chunking & Local RAG Q&A
│   └── export_engine.py           # Xuất TXT, JSON, Anki CSV, HTML
├── ui/
│   └── web/                       # Giao diện người dùng Webview hiện đại
│       ├── index.html             # Shell giao diện & Splash screen
│       ├── css/style.css          # Cool Light Design System
│       └── js/                    # Controller các module (flashcard, lecture, settings...)
├── tools/
│   └── benchmark_stt.py           # Script đo lường hiệu năng STT độc lập
└── models/                        # Chứa faster-whisper & Qwen2.5 GGUF
```

---

## 🚀 Hướng dẫn Khởi chạy & Sử dụng (1-Click)

Ứng dụng được tích hợp cơ chế **tự động hóa 100%**: tự động khởi tạo môi trường, tự động tải các mô hình AI cần thiết (Whisper & Qwen 2.5) từ Hugging Face Hub nếu chưa có, và tự động nạp dữ liệu mẫu.

### Cách 1: Chạy 1-Click (Khuyên dùng)
- **Trên Windows**: Nhấp đúp chuột vào file [`run.bat`](run.bat) (hoặc gõ `.\run.bat` trong CMD/PowerShell).
- **Trên Linux / macOS**: Chạy `./run.sh` trong Terminal.

### Cách 2: Chạy thủ công bằng Python
```powershell
python main.py
```
*(Nếu chưa có môi trường ảo `venv`, `main.py` sẽ tự động tạo `venv`, cài `requirements.txt` và khởi động ứng dụng).*

### 📦 Đóng gói thành ứng dụng độc lập (.exe)
```powershell
python build_exe.py
```
*(Ứng dụng sau khi đóng gói sẽ nằm trong thư mục `dist/Open-mind/Open-mind.exe`, có thể phân phối trực tiếp cho người dùng).*

---

## 📈 Benchmark Hiệu Năng STT

Open-mind Pro tích hợp bộ công cụ đo định lượng hiệu năng trên các bài giảng tiếng Việt:

```bash
# Chạy benchmark trên file ghi âm mẫu
python tools/benchmark_stt.py --audio samples/lecture_sample.mp3 --reference samples/lecture_ground_truth.txt --models tiny,base,small
```

### Bảng kết quả thực nghiệm:

<!-- TODO: điền số liệu sau khi chạy benchmark_stt.py trên máy kiểm thử -->
| Cỡ Model | Thời gian STT (s) | RTF (Real-time Factor) | RAM Đỉnh (MB) | WER (%) | Đánh giá |
|:---|:---:|:---:|:---:|:---:|:---|
| **TINY** | *<!-- TODO -->* | *<!-- TODO -->* | *<!-- TODO -->* | *<!-- TODO -->* | Siêu nhanh ⚡ |
| **BASE** | *<!-- TODO -->* | *<!-- TODO -->* | *<!-- TODO -->* | *<!-- TODO -->* | Nhanh 🚀 |
| **SMALL** | *<!-- TODO -->* | *<!-- TODO -->* | *<!-- TODO -->* | *<!-- TODO -->* | Cân bằng ⭐ (Khuyên dùng) |
| **MEDIUM** | *<!-- TODO -->* | *<!-- TODO -->* | *<!-- TODO -->* | *<!-- TODO -->* | Chính xác cao 🎯 |

*(Báo cáo chi tiết dạng CSV và Markdown được tự động xuất tại thư mục [`benchmark_results/`](benchmark_results/)).*

---

## 🤝 Đóng góp phát triển (Contributing)

Dự án hoan nghênh mọi đóng góp từ cộng đồng học thuật và nhà phát triển mã nguồn mở! Vui lòng tham khảo tài liệu [CONTRIBUTING.md](CONTRIBUTING.md) để biết thêm chi tiết về quy trình gửi Pull Request, Coding Conventions và mẫu báo lỗi.

---

## 📄 Giấy phép (License)

Dự án được phân phối dưới giấy phép mã nguồn mở **MIT License**. Xem chi tiết tại tệp [LICENSE](LICENSE).


#   O p e n m i n d  
 #   O p e n m i n d  
 