@echo off
title OpenMind - AI Study Assistant (Offline)
cd /d "%~dp0"

echo ================================================================
echo           OPEN-MIND - AI Study Assistant (Offline)
echo ================================================================
echo.

REM 1. Neu da co san moi truong venv -> Khoi chay ngay lap tuc
if exist "venv\Scripts\python.exe" (
    goto :LAUNCH
)

REM 2. Neu chua co venv -> Tim Python he thong de khoi tao
echo [OpenMind] Dang chuan bi moi truong chay lan dau tien...
set "SYS_PYTHON="

where py >nul 2>nul
if %errorlevel% equ 0 (
    set "SYS_PYTHON=py -3"
    goto :CREATE_VENV
)

where python >nul 2>nul
if %errorlevel% equ 0 (
    set "SYS_PYTHON=python"
    goto :CREATE_VENV
)

if exist "%LOCALAPPDATA%\Programs\Python\Python311\python.exe" (
    set "SYS_PYTHON=%LOCALAPPDATA%\Programs\Python\Python311\python.exe"
    goto :CREATE_VENV
)
if exist "%LOCALAPPDATA%\Programs\Python\Python312\python.exe" (
    set "SYS_PYTHON=%LOCALAPPDATA%\Programs\Python\Python312\python.exe"
    goto :CREATE_VENV
)
if exist "%LOCALAPPDATA%\Programs\Python\Python310\python.exe" (
    set "SYS_PYTHON=%LOCALAPPDATA%\Programs\Python\Python310\python.exe"
    goto :CREATE_VENV
)
if exist "C:\Program Files\Python311\python.exe" (
    set "SYS_PYTHON=C:\Program Files\Python311\python.exe"
    goto :CREATE_VENV
)
if exist "C:\Program Files\Python312\python.exe" (
    set "SYS_PYTHON=C:\Program Files\Python312\python.exe"
    goto :CREATE_VENV
)
if exist "C:\Program Files\Python310\python.exe" (
    set "SYS_PYTHON=C:\Program Files\Python310\python.exe"
    goto :CREATE_VENV
)

REM 3. Neu chua co Python -> Thu cai dat qua winget
echo [OpenMind] Khong tim thay Python tren he thong.
where winget >nul 2>nul
if %errorlevel% equ 0 (
    echo [OpenMind] Dang tu dong cai dat Python 3.11 qua winget, vui long cho...
    winget install Python.Python.3.11 --silent --accept-package-agreements --accept-source-agreements
    if exist "%LOCALAPPDATA%\Programs\Python\Python311\python.exe" (
        set "SYS_PYTHON=%LOCALAPPDATA%\Programs\Python\Python311\python.exe"
        goto :CREATE_VENV
    )
    if exist "C:\Program Files\Python311\python.exe" (
        set "SYS_PYTHON=C:\Program Files\Python311\python.exe"
        goto :CREATE_VENV
    )
)

echo [LOI] Khong the tu dong tim hoac cai dat Python.
echo Vui long cai dat Python 3.10+ tu https://www.python.org/downloads/
echo Nho tick chon "Add Python to PATH" khi cai dat.
echo.
pause
exit /b 1

:CREATE_VENV
echo [1/2] Dang tao moi truong ao venv...
"%SYS_PYTHON%" -m venv venv
if not exist "venv\Scripts\python.exe" (
    echo [LOI] Khong the tao thu muc venv.
    pause
    exit /b 1
)

echo [2/2] Dang cai dat cac thu vien phu thuoc tu requirements.txt...
echo (Qua trinh nay chi dien ra 1 lan duy nhat, vui long doi...)
venv\Scripts\python.exe -m pip install --upgrade pip
venv\Scripts\python.exe -m pip install -r requirements.txt

:LAUNCH
echo [OpenMind] Dang khoi dong ung dung...
echo.
venv\Scripts\python.exe main.py

if %errorlevel% neq 0 (
    echo.
    echo [OpenMind] Ung dung da dung voi ma loi: %errorlevel%
    pause
)
