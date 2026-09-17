# 🏆 Báo Cáo Đáp Ứng Tiêu Chí Cuộc Thi PMMN & AI 2026
### Dự án: Open-mind — Trợ lý Học tập AI & Không gian Ôn tập Trí nhớ Dài hạn
Khoa Công nghệ thông tin — Trường Đại học Công nghệ Thông tin & Truyền thông (ICTU)

---

## Phần I: Tiêu chí dựa trên PoF (50/50 Điểm tối đa)

| TT | Tiêu chí đánh giá | Điểm tối đa | Minh chứng cụ thể trong kho mã nguồn Open-mind |
| :---: | :--- | :---: | :--- |
| **1** | **Sử dụng hệ thống quản lý mã nguồn trên Internet** | **5 / 5** | • Kho mã nguồn công khai trên GitHub: [`https://github.com/dargits/Openmind`](https://github.com/dargits/Openmind).<br>• Có giao diện web viewer, lịch sử commit đầy đủ bằng tiếng Việt theo chuẩn Conventional Commits, có nhánh phát hành rõ ràng. |
| **2** | **Cấp phép PMMN theo giấy phép OSI-approved** | **10 / 10** | • Sử dụng **MIT License** (giấy phép mở được OSI phê chuẩn).<br>• Cung cấp toàn văn bản quyền kèm tuyên bố mục đích cấp phép tại tệp [`LICENSE`](../LICENSE).<br>• **100% 51 tệp mã nguồn** (.py, .js, .css, .html) đều chứa **SPDX License Header** (`SPDX-License-Identifier: MIT`).<br>• Không xung đột bản quyền: 100% thư viện phụ thuộc đều tương thích hoàn toàn với giấy phép MIT (Báo cáo tại [`docs/DEPENDENCIES.md`](DEPENDENCIES.md)). |
| **3** | **Bản phát hành mở (Release) cho sản phẩm dự thi** | **5 / 5** | • Bản phát hành được đóng gói theo định dạng mở POSIX: `dist/openmind-v2.0.0.tar.gz` kèm mã băm SHA-256 (`scripts/package_release.py`).<br>• Tuyệt đối không sử dụng định dạng đóng (.rar, .arj).<br>• Đã gắn Git Tag phiên bản **`v2.0.0`** trên GitHub. |
| **4** | **Cài đặt, dịch từ mã nguồn (Building From Source)** | **10 / 10** | • Tài liệu chi tiết tại [`docs/BUILDING.md`](BUILDING.md).<br>• Cấu hình động thông qua biến môi trường hoặc tệp mẫu `.env.example`, không yêu cầu sửa mã nguồn hay tệp header.<br>• Sử dụng 100% công cụ nguồn mở chuẩn PEP 517/518 (`pip install -e .`), PyInstaller mở.<br>• Ứng dụng hoạt động độc lập ngay cả khi chạy ngoài thư mục mã nguồn. |
| **5** | **Sử dụng thư viện và gói đính kèm (Bundling)** | **10 / 10** | • Báo cáo minh bạch toàn bộ thư viện bên thứ ba kèm phiên bản và kho upstream tại [`docs/DEPENDENCIES.md`](DEPENDENCIES.md).<br>• Sử dụng thư viện chuẩn qua `pip`, không sửa đổi mã nguồn bên trong của thư viện. Không đính kèm thư mục rác `venv/`. |
| **6** | **Tài liệu và giao tiếp** | **10 / 10** | • Quản lý lỗi phần mềm (Bug Tracker): Thiết lập sẵn biểu mẫu báo lỗi chuẩn tại [`.github/ISSUE_TEMPLATE/`](../.github/ISSUE_TEMPLATE/).<br>• Lịch sử thay đổi mã nguồn chuẩn Keep a Changelog: [`CHANGELOG.md`](../CHANGELOG.md).<br>• Hướng dẫn đóng góp [`CONTRIBUTING.md`](../CONTRIBUTING.md) và tài liệu tổng quan [`README.md`](../README.md) đầy đủ. |

---

## Phần II: Tiêu chí dựa trên Sản phẩm (50/50 Điểm tối đa)

| TT | Tiêu chí đánh giá | Điểm tối đa | Minh chứng kỹ thuật trong sản phẩm |
| :---: | :--- | :---: | :--- |
| **1** | **Tính nguyên gốc của giải pháp kĩ thuật** | **10 / 10** | Quy trình khép kín tự động 4 bước (Auto-Pipeline), thuật toán phục hồi ngữ âm tiếng Việt chuyên ngành CNTT (Code-switching), mô hình hóa suy giảm trí nhớ Ebbinghaus $R = 100 \times e^{-t/S}$, và tìm kiếm tức thì SQLite FTS5. |
| **2** | **Mức độ hoàn thiện của sản phẩm** | **10 / 10** | Ứng dụng Desktop SPA mượt mà, giao diện Glassmorphism hiện đại, tự động căn giữa màn hình khi khởi động, 15/15 unit tests pass 100%. |
| **3** | **Mức độ sử dụng thân thiện** | **10 / 10** | Khởi chạy 1-Click (`run.bat`), tự động tải mô hình AI, phát âm thanh đồng bộ karaoke theo timestamp câu `[MM:SS]`, phím tắt tiện lợi. |
| **4** | **Khả năng tích hợp AI** | **10 / 10** | Kiến trúc Hybrid AI (Whisper int8 + Gemini / Groq / Qwen 2.5 GGUF) kèm cơ chế Auto-Fallback tự chuyển vùng khi hết quota, trợ lý RAG hỏi đáp đa lượt bám sát nội dung bài giảng. |
| **5** | **Phong cách trình diễn & Thu hút cộng đồng** | **10 / 10** | Hệ thống mở, tài liệu kỹ thuật trực quan (Mermaid diagrams, API spec), hỗ trợ xuất thẻ Anki `.apkg` chuẩn và báo cáo HTML kết nối hệ sinh thái giáo dục mở. |
