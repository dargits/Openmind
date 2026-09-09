@echo off
@chcp 65001 >nul
title OpenMind — Trợ lý Học tập AI Cục bộ (Offline)
cd /d "%~dp0"

echo ==============================================================================
echo       🧠 OPEN-MIND — TRỢ LÝ HỌC TẬP AI CỤC BỘ (100%% OFFLINE)
echo ==============================================================================
echo.

REM ══════════════════════════════════════════════════════════════════════════════
REM BƯỚC 1: XÁC ĐỊNH TRÌNH THÔNG DỊCH PYTHON HOẶC TỰ ĐỘNG CÀI ĐẶT
REM ══════════════════════════════════════════════════════════════════════════════
set "PYTHON_EXE="

REM 1.1 Kiem tra Python trong he thong
where python >nul 2>nul
if %errorlevel% equ 0 (
    set "PYTHON_EXE=python"
)

REM 1.2 Kiem tra cac thu muc cai dat pho bien neu PATH chua cap nhat
if not defined PYTHON_EXE (
    if exist "%LOCALAPPDATA%\Programs\Python\Python311\python.exe" set "PYTHON_EXE=%LOCALAPPDATA%\Programs\Python\Python311\python.exe"
    if exist "%LOCALAPPDATA%\Programs\Python\Python312\python.exe" set "PYTHON_EXE=%LOCALAPPDATA%\Programs\Python\Python312\python.exe"
    if exist "%LOCALAPPDATA%\Programs\Python\Python310\python.exe" set "PYTHON_EXE=%LOCALAPPDATA%\Programs\Python\Python310\python.exe"
    if exist "C:\Program Files\Python311\python.exe" set "PYTHON_EXE=C:\Program Files\Python311\python.exe"
    if exist "C:\Program Files\Python312\python.exe" set "PYTHON_EXE=C:\Program Files\Python312\python.exe"
    if exist "C:\Program Files\Python310\python.exe" set "PYTHON_EXE=C:\Program Files\Python310\python.exe"
)

REM 1.3 Neu may hoan toan chua co Python -> Tu dong cai dat thong minh
if not defined PYTHON_EXE (
    echo [THÔNG BÁO] Chưa phát hiện Python trên máy tính của bạn.
    echo [OpenMind] Đang kích hoạt Trình Cài Đặt Tự Động (Zero-Touch Auto-Installer)...
    echo.

    where winget >nul 2>nul
    if %errorlevel% equ 0 (
        echo -- Đang tải và cài đặt Python 3.11 qua Windows Package Manager (winget)...
        winget install Python.Python.3.11 --silent --accept-package-agreements --accept-source-agreements
    ) else (
        echo -- Đang tải bộ cài Python 3.11 chính thức từ python.org...
        powershell -NoProfile -ExecutionPolicy Bypass -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri 'https://www.python.org/ftp/python/3.11.9/python-3.11.9-amd64.exe' -OutFile 'python_installer.exe'"
        echo -- Đang tiến hành cài đặt Python 3.11 tự động trong nền...
        start /wait python_installer.exe /quiet InstallAllUsers=0 PrependPath=1 Include_test=0
        del /f /q python_installer.exe >nul 2>&1
    )

    REM Kiem tra lai vi tri vua cai
    if exist "%LOCALAPPDATA%\Programs\Python\Python311\python.exe" (
        set "PYTHON_EXE=%LOCALAPPDATA%\Programs\Python\Python311\python.exe"
    ) else if exist "C:\Program Files\Python311\python.exe" (
        set "PYTHON_EXE=C:\Program Files\Python311\python.exe"
    ) else (
        where python >nul 2>nul
        if %errorlevel% equ 0 set "PYTHON_EXE=python"
    )

    if not defined PYTHON_EXE (
        echo.
        echo [LỖI] Không thể tự động cài đặt Python.
        echo Vui lòng cài đặt thủ công tại: https://www.python.org/downloads/
        echo (Lưu ý: Nhớ tick chọn "Add Python to PATH" khi cài đặt)
        echo.
        pause
        exit /b 1
    )

    echo ✓ Đã cài đặt Python 3.11 thành công! Tiếp tục chuẩn bị ứng dụng...
    echo.
)

REM ══════════════════════════════════════════════════════════════════════════════
REM BƯỚC 2: TỰ ĐỘNG TẠO SHORTCUT NGOÀI DESKTOP CHO NGƯỜI DÙNG
REM ══════════════════════════════════════════════════════════════════════════════
set "DESKTOP_SHORTCUT=%USERPROFILE%\Desktop\OpenMind.lnk"
if not exist "%DESKTOP_SHORTCUT%" (
    powershell -NoProfile -ExecutionPolicy Bypass -Command "$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut('%DESKTOP_SHORTCUT%'); $s.TargetPath = '%~dp0run.bat'; $s.WorkingDirectory = '%~dp0'; if (Test-Path '%~dp0ui\logo.jpg') { $s.IconLocation = '%~dp0ui\logo.jpg' }; $s.Description = 'OpenMind - Tro ly Hoc tap AI Ngoai tuyen'; $s.Save()" >nul 2>&1
)

REM ══════════════════════════════════════════════════════════════════════════════
REM BƯỚC 3: KIỂM TRA MÔI TRƯỜNG ẢO VENV VÀ CÀI ĐẶT THƯ VIỆN
REM ══════════════════════════════════════════════════════════════════════════════
if not exist "venv\Scripts\python.exe" (
    echo [1/3] Đang khởi tạo môi trường chạy cô lập (venv)...
    "%PYTHON_EXE%" -m venv venv
    if %errorlevel% neq 0 (
        echo [LỖI] Không thể tạo thư mục môi trường ảo venv.
        pause
        exit /b 1
    )

    echo [2/3] Đang cài đặt các thư viện AI từ requirements.txt...
    echo (Quá trình này chỉ diễn ra một lần duy nhất, vui lòng đợi...)
    venv\Scripts\python.exe -m pip install --upgrade pip >nul 2>&1
    venv\Scripts\python.exe -m pip install -r requirements.txt
    if %errorlevel% neq 0 (
        echo [CẢNH BÁO] Có một số gói thư viện chưa hoàn tất, ứng dụng sẽ thử khởi chạy...
    )
    echo ✓ Cài đặt môi trường hoàn tất!
    echo.
)

REM ══════════════════════════════════════════════════════════════════════════════
REM BƯỚC 4: KHỞI CHẠY ỨNG DỤNG OPEN-MIND
REM ══════════════════════════════════════════════════════════════════════════════
echo [3/3] Đang khởi động giao diện OpenMind...
echo.
venv\Scripts\python.exe main.py

if %errorlevel% neq 0 (
    echo.
    echo [OpenMind] Ứng dụng đã dừng lại với mã lỗi: %errorlevel%
    pause
)
