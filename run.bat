@echo off
title OpenMind - AI Study Assistant
cd /d "%~dp0"

echo ================================================================
echo           OPEN-MIND - AI Study Assistant (Offline)
echo ================================================================
echo.

if not exist "venv\Scripts\python.exe" (
    echo [OpenMind] Dang khoi tao moi truong ao venv lan dau...
    python -m venv venv
    venv\Scripts\python.exe -m pip install --upgrade pip
    venv\Scripts\python.exe -m pip install -r requirements.txt
)

echo [OpenMind] Dang khoi dong ung dung...
venv\Scripts\python.exe main.py

if %errorlevel% neq 0 (
    echo.
    echo [OpenMind] Ung dung da dung lai voi ma loi: %errorlevel%
    pause
)
