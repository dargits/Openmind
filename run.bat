@echo off
@chcp 65001 >nul 2>&1
title OpenMind — Trợ lý Học tập AI Ngoại tuyến
cd /d "%~dp0"

echo ==============================================================================
echo       🧠 OPEN-MIND — TRỢ LÝ HỌC TẬP AI CỤC BỘ (100%% OFFLINE)
echo ==============================================================================
echo.

REM ------------------------------------------------------------------------------
REM 1. NẾU ĐÃ CÓ MÔI TRƯỜNG VENV HOÀN CHỈNH -> KHỞI CHẠY NGAY LẬP TỨC
REM ------------------------------------------------------------------------------
if exist "venv\Scripts\python.exe" (
    goto :LAUNCH
)

REM ------------------------------------------------------------------------------
REM 2. CHƯA CÓ VENV -> TÌM TRÌNH THÔNG DỊCH PYTHON ĐỂ KHỞI TẠO
REM ------------------------------------------------------------------------------
echo [OpenMind] Đang chuẩn bị môi trường chạy lần đầu tiên...
set "SYS_PYTHON="

REM 2.1 Thử Windows Python Launcher (py -3)
where py >nul 2>&1
if %errorlevel% equ 0 (
    py -3 -c "import sys" >nul 2>&1
    if %errorlevel% equ 0 set "SYS_PYTHON=py -3"
)

REM 2.2 Thử lệnh python thông thường
if not defined SYS_PYTHON (
    where python >nul 2>&1
    if %errorlevel% equ 0 (
        python -c "import sys" >nul 2>&1
        if %errorlevel% equ 0 set "SYS_PYTHON=python"
    )
)

REM 2.3 Thử các đường dẫn cài đặt mặc định trên Windows
if not defined SYS_PYTHON (
    if exist "%LOCALAPPDATA%\Programs\Python\Python311\python.exe" set "SYS_PYTHON=%LOCALAPPDATA%\Programs\Python\Python311\python.exe"
    if exist "%LOCALAPPDATA%\Programs\Python\Python312\python.exe" set "SYS_PYTHON=%LOCALAPPDATA%\Programs\Python\Python312\python.exe"
    if exist "%LOCALAPPDATA%\Programs\Python\Python310\python.exe" set "SYS_PYTHON=%LOCALAPPDATA%\Programs\Python\Python310\python.exe"
    if exist "C:\Program Files\Python311\python.exe" set "SYS_PYTHON=C:\Program Files\Python311\python.exe"
    if exist "C:\Program Files\Python312\python.exe" set "SYS_PYTHON=C:\Program Files\Python312\python.exe"
    if exist "C:\Program Files\Python310\python.exe" set "SYS_PYTHON=C:\Program Files\Python310\python.exe"
)

REM 2.4 Nếu máy tính hoàn toàn chưa có Python -> Hỗ trợ cài đặt tự động
if not defined SYS_PYTHON (
    echo [OpenMind] Không tìm thấy Python trên hệ thống của bạn.
    echo Đang kiểm tra công cụ cài đặt tự động...
    
    where winget >nul 2>&1
    if %errorlevel% equ 0 (
        echo -- Đang tự động tải và cài đặt Python 3.11 qua winget (vui lòng đợi 1-2 phút)...
        winget install Python.Python.3.11 --silent --accept-package-agreements --accept-source-agreements
        
        REM Kiểm tra lại sau khi winget cài đặt
        if exist "%LOCALAPPDATA%\Programs\Python\Python311\python.exe" set "SYS_PYTHON=%LOCALAPPDATA%\Programs\Python\Python311\python.exe"
        if exist "C:\Program Files\Python311\python.exe" set "SYS_PYTHON=C:\Program Files\Python311\python.exe"
    )
)

REM 2.5 Nếu vẫn chưa tìm thấy Python -> Hướng dẫn người dùng
if not defined SYS_PYTHON (
    echo.
    echo ==============================================================================
    echo [LỖI] Chưa phát hiện Python trên máy tính của bạn!
    echo Vui lòng cài đặt Python 3.10 hoặc 3.11 từ: https://www.python.org/downloads/
    echo QUAN TRỌNG: Hãy nhớ tick chọn "Add Python to PATH" trong khi cài đặt.
    echo ==============================================================================
    echo.
    pause
    exit /b 1
)

REM ------------------------------------------------------------------------------
REM 3. TẠO MÔI TRƯỜNG ẢO VENV VÀ CÀI ĐẶT THƯ VIỆN
REM ------------------------------------------------------------------------------
echo [1/2] Đang tạo môi trường ảo Python cô lập (venv)...
%SYS_PYTHON% -m venv venv
if not exist "venv\Scripts\python.exe" (
    echo [LỖI] Không thể khởi tạo thư mục venv.
    pause
    exit /b 1
)

echo [2/2] Đang cài đặt các thư viện phụ thuộc từ requirements.txt...
echo (Quá trình này chỉ diễn ra một lần duy nhất, vui lòng đợi...)
venv\Scripts\python.exe -m pip install --upgrade pip >nul 2>&1
venv\Scripts\python.exe -m pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo [CẢNH BÁO] Có một số gói chưa hoàn tất, ứng dụng sẽ thử khởi động...
)

REM ------------------------------------------------------------------------------
REM 4. TỰ ĐỘNG TẠO SHORTCUT DESKTOP CHO NGƯỜI DÙNG TIỆN SỬ DỤNG
REM ------------------------------------------------------------------------------
set "DESKTOP_SHORTCUT=%USERPROFILE%\Desktop\OpenMind.lnk"
if not exist "%DESKTOP_SHORTCUT%" (
    powershell -NoProfile -ExecutionPolicy Bypass -Command "$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut('%DESKTOP_SHORTCUT%'); $s.TargetPath = '%~dp0run.bat'; $s.WorkingDirectory = '%~dp0'; if (Test-Path '%~dp0ui\logo.jpg') { $s.IconLocation = '%~dp0ui\logo.jpg' }; $s.Description = 'OpenMind - Tro ly Hoc tap AI Ngoai tuyen'; $s.Save()" >nul 2>&1
)

REM ------------------------------------------------------------------------------
REM 5. KHỞI CHẠY ỨNG DỤNG OPEN-MIND
REM ------------------------------------------------------------------------------
:LAUNCH
echo [OpenMind] Đang khởi động ứng dụng...
echo.
venv\Scripts\python.exe main.py

if %errorlevel% neq 0 (
    echo.
    echo [OpenMind] Ứng dụng đã dừng với mã lỗi: %errorlevel%
    pause
)
