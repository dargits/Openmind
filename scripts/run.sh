#!/usr/bin/env bash
# ================================================================
#           OPEN-MIND — TRỢ LÝ HỌC TẬP AI TOÀN DIỆN
# ================================================================

cd "$(dirname "$0")" || exit 1

echo "================================================================"
echo "          OPEN-MIND — TRỢ LÝ HỌC TẬP AI TOÀN DIỆN"
echo "================================================================"
echo ""

# 1. Kiểm tra Python
if ! command -v python3 &> /dev/null; then
    echo "[LỖI] Không tìm thấy python3 trên hệ thống!"
    echo "Vui lòng cài đặt Python 3.10+."
    exit 1
fi

# 2. Tạo và kích hoạt venv nếu chưa có
if [ ! -f "venv/bin/python" ]; then
    echo "[Open-mind] Đang tạo môi trường ảo Python (venv)..."
    python3 -m venv venv
    echo "[Open-mind] Đang cài đặt thư viện từ requirements.txt..."
    venv/bin/pip install --upgrade pip
    venv/bin/pip install -r requirements.txt
    echo "[Open-mind] ✓ Cài đặt hoàn tất!"
    echo ""
fi

# 3. Chạy ứng dụng
echo "[Open-mind] Đang khởi động ứng dụng..."
venv/bin/python main.py
