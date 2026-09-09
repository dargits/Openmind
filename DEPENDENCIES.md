# 📦 Danh Sách Thư Viện & Báo Cáo Tương Thích Giấy Phép (Dependencies & License Compatibility)

Tài liệu này cung cấp thông tin minh bạch về toàn bộ các thư viện bên thứ ba (Third-Party Dependencies) được sử dụng trong dự án **Open-mind**, bao gồm mục đích sử dụng, phiên bản, giấy phép nguồn mở (OSI-approved), và chứng minh tính tương thích 100% với giấy phép chính của dự án (**MIT License**).

---

## 📑 1. Cam Kết Tuân Thủ Bản Quyền Nguồn Mở
1. **Không can thiệp hoặc chỉnh sửa gói đính kèm**: Toàn bộ các thư viện được cài đặt nguyên bản thông qua trình quản lý gói tiêu chuẩn **PyPI (`pip`)**, tuyệt đối không có hành vi can thiệp hoặc sửa đổi mã nguồn của các thư viện bên thứ ba.
2. **Không phân phối kèm thư mục phụ thuộc (`unbundled`)**: Dự án sử dụng tệp `requirements.txt` và `pyproject.toml` chuẩn mực, không commit các thư mục môi trường ảo (`venv/`), mã nguồn thư viện hoặc file nhị phân của bên thứ ba vào kho mã nguồn.
3. **100% Giấy phép mở chuẩn OSI**: Mọi thư viện phụ thuộc đều được cấp phép theo các giấy phép được Tổ chức Sáng kiến Mã nguồn Mở (OSI) công nhận (MIT, Apache 2.0, BSD, LGPL/MPL).

---

## 📊 2. Bảng Kê Khai Chi Tiết Thư Viện Phụ Thuộc (Direct Dependencies)

| Tên Thư Viện | Phiên Bản | Mục Đích Sử Dụng Trong Openmind | Kho Lưu Trữ / Nguồn | Giấy Phép Nguồn Mở | Chuẩn OSI? |
| :--- | :---: | :--- | :--- | :---: | :---: |
| **faster-whisper** | `1.0.3` | Nhận diện giọng nói STT đa kích cỡ kết hợp CTranslate2 int8 | [SYSTRAN/faster-whisper](https://github.com/SYSTRAN/faster-whisper) | **MIT License** | ✅ Có |
| **llama-cpp-python** | `0.3.34` | Ràng buộc Python cho `llama.cpp` chạy mô hình GGUF trên CPU/GPU | [abetlen/llama-cpp-python](https://github.com/abetlen/llama-cpp-python) | **MIT License** | ✅ Có |
| **pywebview** | `>=5.0` | Cung cấp cửa sổ Desktop GUI hiện đại dựa trên trình duyệt hệ thống | [r0x0r/pywebview](https://github.com/r0x0r/pywebview) | **BSD-3-Clause** | ✅ Có |
| **pydub** | `0.25.1` | Xử lý, cắt ghép và trích xuất đặc trưng các tệp âm thanh | [jiaaro/pydub](https://github.com/jiaaro/pydub) | **MIT License** | ✅ Có |
| **pygame** | `2.6.1` | Mixer điều khiển phát và tạm dừng âm thanh bài giảng | [pygame/pygame](https://github.com/pygame/pygame) | **GNU LGPL v2.1** | ✅ Có |
| **huggingface-hub** | `>=0.20.0` | Kiểm tra và tải tự động trọng số mô hình AI từ Hugging Face Hub | [huggingface/huggingface_hub](https://github.com/huggingface/huggingface_hub) | **Apache 2.0** | ✅ Có |
| **requests** | `>=2.28.0` | Thực hiện các yêu cầu HTTP kiểm tra tính sẵn sàng của tài nguyên | [psf/requests](https://github.com/psf/requests) | **Apache 2.0** | ✅ Có |
| **tqdm** | `>=4.65.0` | Thanh tiến trình hiển thị quá trình tải mô hình và xử lý dữ liệu | [tqdm/tqdm](https://github.com/tqdm/tqdm) | **MIT / MPL 2.0** | ✅ Có |
| **pyinstaller** | `>=6.10.0` | Công cụ mã nguồn mở hỗ trợ đóng gói ứng dụng độc lập | [pyinstaller/pyinstaller](https://github.com/pyinstaller/pyinstaller) | **GPL v2 with Exception** | ✅ Có |
| **psutil** | `>=5.9.0` | Giám sát tài nguyên hệ thống (RAM, CPU usage) khi benchmark | [giampaolo/psutil](https://github.com/giampaolo/psutil) | **BSD-3-Clause** | ✅ Có |
| **jiwer** | `>=3.0.0` | Tính toán tỷ lệ lỗi từ (Word Error Rate - WER) khi benchmark STT | [jitsi/jiwer](https://github.com/jitsi/jiwer) | **Apache 2.0** | ✅ Có |

---

## 🧩 3. Ma Trận Tương Thích Giấy Phép (License Compatibility Matrix)

Dự án **Open-mind** được phát hành dưới giấy phép **MIT License**. Dưới đây là phân tích tính tương thích với từng loại giấy phép của các thư viện phụ thuộc:

```
┌───────────────────────────────┐
│     Open-mind (MIT License)   │
└───────────────┬───────────────┘
                │
   ┌────────────┼────────────┬─────────────┐
   ▼            ▼            ▼             ▼
[MIT]      [Apache 2.0]  [BSD-3-Clause] [LGPL v2.1]
(Hoàn toàn   (Tương thích  (Tương thích  (Tương thích
tương thích)  một chiều)   tuyệt đối)    dạng liên kết)
```

1. **Thư viện cấp phép MIT (faster-whisper, llama-cpp-python, pydub, tqdm):**
   - Giấy phép MIT hoàn toàn tự do, cho phép nhúng, phân phối và tái cấp phép mà không có bất kỳ xung đột nào.
2. **Thư viện cấp phép BSD 3-Clause (pywebview, psutil):**
   - Giấy phép BSD thuộc dạng cấp phép tự do (permissive), hoàn toàn tương thích với MIT khi giữ nguyên thông báo bản quyền gốc.
3. **Thư viện cấp phép Apache 2.0 (huggingface-hub, requests, jiwer):**
   - Theo công bố của Quỹ Phần mềm Tự do (FSF) và OSI, mã nguồn cấp phép MIT hoàn toàn có thể tích hợp và phân phối cùng các thư viện Apache 2.0.
4. **Thư viện cấp phép LGPL v2.1 (pygame):**
   - Open-mind chỉ gọi API của `pygame` dưới dạng liên kết động (Dynamic linking thông qua `import pygame` của Python) mà không sửa đổi mã nguồn nội bộ của thư viện pygame, hoàn toàn tuân thủ Điều khoản 6 của GNU LGPL v2.1.

**Kết luận:** Mã nguồn dự án Open-mind **hoàn toàn tương thích** với tất cả các giấy phép của các thư viện phụ thuộc, không tồn tại bất kỳ sự xung đột bản quyền hay vi phạm pháp lý nào.
