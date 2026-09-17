@echo off
title OpenMind - Production Setup Builder (OpenMind_Setup.exe)
cd /d "%~dp0\.."

echo ================================================================
echo      OPEN-MIND - BỘ ĐÓNG GÓI BẢN CÀI ĐẶT WINDOWS SETUP (.EXE)
echo ================================================================
echo.

if not exist "venv\Scripts\python.exe" (
    echo [LỖI] Chưa tìm thấy môi trường ảo venv!
    echo Vui lòng chạy run.bat trước để thiết lập môi trường.
    pause
    exit /b 1
)

echo [OpenMind] Đang kiểm tra và khởi chạy quy trình đóng gói...
echo.
venv\Scripts\python.exe scripts\build_installer.py

if %errorlevel% neq 0 (
    echo.
    echo ================================================================
    echo [LỖI] Đóng gói thất bại! Vui lòng kiểm tra thông báo bên trên.
    echo ================================================================
    pause
    exit /b 1
)

echo.
pause
