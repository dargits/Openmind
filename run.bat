@echo off
@chcp 65001 >nul

cd /d "%~dp0"

echo ================================================================
echo           OPEN-MIND - AI Study Assistant (Offline)
echo ================================================================
echo.

REM 1. Kiem tra Python
where python >nul 2>nul
if %errorlevel% neq 0 (
    echo [LOI] Khong tim thay Python tren he thong!
    echo Vui long cai dat Python 3.10+ tu https://www.python.org/downloads/
    echo Luu y: Nho tick chon Add Python to PATH khi cai dat.
    echo.
    pause
    exit /b 1
)

REM 2. Kiem tra va tao moi truong ao venv neu chua co
if not exist "venv\Scripts\python.exe" (
    echo [Open-mind] Dang tao moi truong ao Python venv...
    python -m venv venv
    if %errorlevel% neq 0 (
        echo [LOI] Khong the tao moi truong ao venv.
        pause
        exit /b 1
    )
    echo [Open-mind] Dang cai dat cac thu vien can thiet tu requirements.txt...
    venv\Scripts\python.exe -m pip install --upgrade pip
    venv\Scripts\python.exe -m pip install -r requirements.txt
    if %errorlevel% neq 0 (
        echo [CANH BAO] Co the mot so thu vien chua cai dat thanh cong.
    )
    echo [Open-mind] Cai dat moi truong hoan tat!
    echo.
)

REM 3. Khoi chay ung dung
echo [Open-mind] Dang khoi dong ung dung...
echo.
venv\Scripts\python.exe main.py

if %errorlevel% neq 0 (
    echo.
    echo [Open-mind] Ung dung da dung lai voi ma loi: %errorlevel%
    pause
)
