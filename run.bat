@echo off
@chcp 65001 > nul
setlocal enabledelayedexpansion

echo ================================================================
echo           OPEN-MIND — TRỢ LÝ HỌC TẬP AI TOÀN DIỆN
echo ================================================================
echo.

cd /d "%~dp0"

:: 1. Kiểm tra Python
where python >nul 2>nul
if %errorlevel% neq 0 (
    echo [LỖI] Không tìm thấy Python trên máy tính của bạn!
    echo Vui lòng cài đặt Python 3.10+ từ https://www.python.org/downloads/
    echo Lưu ý: Nhớ tick chọn "Add Python to PATH" khi cài đặt.
    echo.
    pause
    exit /b 1
)

:: 2. Kiểm tra & Tạo môi trường ảo venv
if not exist "venv\Scripts\python.exe" (
    echo [Open-mind] Đang tạo môi trường ảo Python (venv)...
    python -m venv venv
    if %errorlevel% neq 0 (
        echo [LỖI] Không thể tạo môi trường ảo venv.
        pause
        exit /b 1
    )
    echo [Open-mind] Đang nâng cấp pip và cài đặt thư viện cần thiết...
    venv\Scripts\python.exe -m pip install --upgrade pip
    venv\Scripts\python.exe -m pip install -r requirements.txt
    if %errorlevel% neq 0 (
        echo [CẢNH BÁO] Có thể một số thư viện chưa cài xong, đang thử tiếp tục...
    )
    echo [Open-mind] ✓ Cài đặt môi trường hoàn tất!
    echo.
)

:: 3. Chạy ứng dụng Open-mind
echo [Open-mind] Đang khởi động ứng dụng...
venv\Scripts\python.exe main.py

if %errorlevel% neq 0 (
    echo.
    echo [Open-mind] Ứng dụng đã thoát với mã lỗi: %errorlevel%
    pause
)
