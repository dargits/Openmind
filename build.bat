@echo off
@chcp 65001 > nul
setlocal enabledelayedexpansion

echo ================================================================
echo           OPEN-MIND — ĐÓNG GÓI ỨNG DỤNG THÀNH .EXE
echo ================================================================
echo.

cd /d "%~dp0"

:: 1. Kiểm tra Python
where python >nul 2>nul
if %errorlevel% neq 0 (
    echo [LỖI] Không tìm thấy Python trên máy tính!
    pause
    exit /b 1
)

:: 2. Đảm bảo môi trường venv và chạy script build
if exist "venv\Scripts\python.exe" (
    echo [Open-mind] Đang thực hiện đóng gói bằng môi trường venv...
    venv\Scripts\python.exe build_exe.py
) else (
    echo [Open-mind] Đang thực hiện đóng gói bằng Python hệ thống...
    python build_exe.py
)

if %errorlevel% neq 0 (
    echo.
    echo [LỖI] Quá trình đóng gói gặp sự cố!
) else (
    echo.
    echo ================================================================
    echo ✓ ĐÃ HOÀN TẤT ĐÓNG GÓI!
    echo File chạy được lưu tại: dist\Open-mind\Open-mind.exe
    echo ================================================================
)

pause
