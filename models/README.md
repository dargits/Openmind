# Thư mục Models / AI Weights

Thư mục này chứa các mô hình AI phục vụ chạy Offline 100%:
1. **STT Whisper (Mặc định: Small)**:
   - Thư mục: `models/faster-whisper-small/`
   - Gồm các tệp: `model.bin`, `config.json`, `tokenizer.json`, `vocabulary.txt`.
2. **LLM Qwen 2.5 3B (GGUF)**:
   - Tệp: `models/qwen2.5-3b-instruct-q4_k_m.gguf`

> 💡 **Tự động tải**: Khi khởi chạy ứng dụng lần đầu bằng `python main.py` hoặc `run.bat`, hệ thống sẽ tự động phát hiện và tải các mô hình cần thiết từ Hugging Face Hub nếu chưa có sẵn.
