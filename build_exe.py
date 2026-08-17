#!/usr/bin/env python3
"""
Open-mind — PyInstaller Packaging Script
─────────────────────────────────────────
Đóng gói toàn bộ ứng dụng Open-mind thành file thực thi độc lập (.exe trên Windows).

Cách chạy:
    python build_exe.py
"""

import os
import sys
import shutil
import subprocess
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent

def build():
    print("=" * 60)
    print("  OPEN-MIND — ĐÓNG GÓI ỨNG DỤNG BẰNG PYINSTALLER")
    print("=" * 60)

    # Đảm bảo PyInstaller đã được cài đặt
    try:
        import PyInstaller
    except ImportError:
        print("[Build] Đang cài đặt pyinstaller...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "pyinstaller>=6.10.0"])

    sep = ";" if os.name == "nt" else ":"

    # Các thư mục/tệp dữ liệu cần kèm theo
    datas = [
        f"ui/web{sep}ui/web",
        f"demo_data{sep}demo_data",
    ]

    # Các module ẩn cần nạp
    hidden_imports = [
        "webview",
        "webview.platforms.winforms",
        "faster_whisper",
        "llama_cpp",
        "pydub",
        "pygame",
        "huggingface_hub",
        "requests",
        "psutil",
        "sqlite3",
    ]

    cmd = [
        sys.executable,
        "-m",
        "PyInstaller",
        "--name=Open-mind",
        "--noconfirm",
        "--onedir",             # Dạng thư mục phân phối tiện dụng, nạp model nhanh
        "--windowed",           # Không hiện cửa sổ console đen khi chạy
        f"--add-data=ui/web{sep}ui/web",
        f"--add-data=demo_data{sep}demo_data",
    ]

    for hi in hidden_imports:
        cmd.extend(["--hidden-import", hi])

    cmd.append("main.py")

    print(f"[Build] Đang thực thi: {' '.join(cmd)}")
    subprocess.check_call(cmd)

    dist_dir = BASE_DIR / "dist" / "Open-mind"
    if dist_dir.exists():
        # Tạo sẵn các thư mục data, models, outputs trong thư mục dist
        for f in ["data", "models", "outputs", "samples"]:
            (dist_dir / f).mkdir(parents=True, exist_ok=True)
            
        print("\n" + "=" * 60)
        print(f"✓ ĐÓNG GÓI THÀNH CÔNG!")
        print(f"Thư mục ứng dụng đã tạo tại: {dist_dir}")
        print("Người dùng có thể chạy trực tiếp: Open-mind.exe")
        print("=" * 60)

if __name__ == "__main__":
    build()
