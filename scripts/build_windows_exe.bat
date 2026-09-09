@echo off
title OpenMind - Standalone EXE Builder
cd /d "%~dp0\.."

echo ================================================================
echo        OPEN-MIND - STANDALONE EXE BUILDER (PORTABLE)
echo ================================================================
echo.

if not exist "venv\Scripts\python.exe" (
    echo [LOI] Khong tim thay moi truong ao venv!
    echo Vui long chay run.bat truoc de tao moi truong.
    pause
    exit /b 1
)

echo [1/2] Dang kiem tra thu vien PyInstaller...
venv\Scripts\python.exe -m pip install pyinstaller >nul 2>&1

echo.
echo [2/2] Dang dong goi ung dung thanh file chay OpenMind.exe...
echo Qua trinh nay co the mat 1-3 phut, vui long cho...
echo.

venv\Scripts\python.exe -m PyInstaller --noconfirm scripts\OpenMind.spec

if %errorlevel% neq 0 (
    echo.
    echo ================================================================
    echo [LOI] Dong goi that bai! Vui long kiem tra thong bao loi ben tren.
    echo ================================================================
    pause
    exit /b 1
)

echo.
echo ================================================================
echo [THANH CONG] Dong goi ung dung hoan tat!
echo Thu muc chua ban chay: dist\OpenMind\
echo File khoi chay chinh:   dist\OpenMind\OpenMind.exe
echo.
echo Ban co the nen thu muc dist\OpenMind thanh file .zip de gui cho
echo nguoi khac su dung (hoan toan khong can cai Python tren may)!
echo ================================================================
pause
