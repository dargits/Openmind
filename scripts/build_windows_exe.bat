@echo off
@chcp 65001 >nul
cd /d "%~dp0\.."

echo ================================================================
echo     OPEN-MIND — ĐÓNG GÓI BẢN STANDALONE EXE (CHO NON-TECH)
echo ================================================================
echo.

if not exist "venv\Scripts\python.exe" (
    echo [LOI] Khong tim thay moi truong ao venv!
    echo Vui long chay run.bat truoc de tao moi truong.
    pause
    exit /b 1
)

echo [1/3] Kiem tra PyInstaller...
venv\Scripts\python.exe -m pip install pyinstaller >nul 2>&1

echo [2/3] Dang bien dich ma nguon thanh file chay OpenMind.exe...
echo Qua trinh nay co the mat 1-2 phut, vui long cho...
venv\Scripts\pyinstaller.exe --noconfirm OpenMind.spec

if %errorlevel% neq 0 (
    echo.
    echo [LOI] Bien dich that bai! Vui long kiem tra lai thong bao loi tren.
    pause
    exit /b 1
)

echo.
echo [3/3] Bien dich thanh cong!
echo Thu muc chua ban chay: dist\OpenMind\
echo File khoi chay chinh:   dist\OpenMind\OpenMind.exe
echo.
echo Ban co the nen thu muc 'dist\OpenMind\' thanh file .zip de gui cho
echo bat ky ai su dung (hoan toan khong can cai Python tren may)!
echo ================================================================
pause
