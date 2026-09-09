# SPDX-FileCopyrightText: 2026 Open-mind Contributors
# SPDX-License-Identifier: MIT
#
# Purpose: Open-mind - Offline AI-Powered Academic Lecture Copilot.
# Distributed under the terms of the OSI-approved MIT License.

import os
import sys
import subprocess
from pathlib import Path

# Ensure UTF-8 output on Windows console
if sys.stdout and hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

IS_FROZEN = getattr(sys, "frozen", False)
if IS_FROZEN:
    BASE_DIR = Path(sys.executable).resolve().parent
    BUNDLE_DIR = Path(getattr(sys, "_MEIPASS", BASE_DIR))
else:
    BASE_DIR = Path(__file__).resolve().parent
    BUNDLE_DIR = BASE_DIR


def ensure_environment():
    """Tự động kiểm tra, tạo venv và cài đặt thư viện cần thiết nếu chưa có."""
    if IS_FROZEN:
        return
    in_venv = (sys.prefix != getattr(sys, "base_prefix", sys.prefix)) or hasattr(sys, "real_prefix")
    
    if os.name == "nt":
        venv_python = BASE_DIR / "venv" / "Scripts" / "python.exe"
        venv_dir = BASE_DIR / "venv"
    else:
        venv_python = BASE_DIR / "venv" / "bin" / "python"
        venv_dir = BASE_DIR / "venv"

    # Nếu chưa ở trong venv nhưng đã có thư mục venv -> chuyển sang chạy bằng venv
    if not in_venv:
        if venv_python.exists() and Path(sys.executable).resolve() != venv_python.resolve():
            print(f"[Open-mind] Đang tự động chuyển sang môi trường ảo: {venv_python}")
            result = subprocess.call([str(venv_python)] + sys.argv)
            sys.exit(result)
        elif not venv_dir.exists():
            # Tự động tạo venv nếu chưa có
            print("[Open-mind] Chưa phát hiện môi trường ảo. Đang tự động khởi tạo venv...")
            try:
                subprocess.check_call([sys.executable, "-m", "venv", str(venv_dir)])
                print("[Open-mind] Đang cài đặt thư viện từ requirements.txt...")
                req_file = BASE_DIR / "requirements.txt"
                if req_file.exists() and venv_python.exists():
                    subprocess.check_call([str(venv_python), "-m", "pip", "install", "--upgrade", "pip"])
                    subprocess.check_call([str(venv_python), "-m", "pip", "install", "-r", str(req_file)])
                print("[Open-mind] ✓ Môi trường ảo đã sẵn sàng!")
                result = subprocess.call([str(venv_python)] + sys.argv)
                sys.exit(result)
            except Exception as e:
                print(f"[Open-mind] Không thể tự động tạo venv ({e}). Tiếp tục với Python hiện tại.")


ensure_environment()

if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

# Đảm bảo các thư mục dữ liệu tồn tại
for folder in ["data", "models"]:
    (BASE_DIR / folder).mkdir(parents=True, exist_ok=True)

# Tự động kiểm tra & nạp dữ liệu mẫu ban đầu nếu cơ sở dữ liệu trống
try:
    from core.database import db
    from core.demo_seeder import seed_demo_data
    if len(db.list_lectures()) == 0:
        print("[Open-mind] Đang nạp dữ liệu học tập mẫu ban đầu...")
        seed_demo_data(force=False)
except Exception as e:
    print(f"[Open-mind] Khởi tạo DB demo: {e}")

import webview
from core.api import api


def main():
    print("=" * 60)
    print("  OPEN-MIND — Trợ lý Học tập AI Toàn diện (100% Offline)")
    print("=" * 60)

    WEB_DIR = (BUNDLE_DIR / "ui") if (BUNDLE_DIR / "ui").exists() else (BASE_DIR / "ui")
    INDEX_HTML = WEB_DIR / "index.html"

    window = webview.create_window(
        title="Open-mind — Trợ lý Học tập AI Toàn diện",
        url=INDEX_HTML.as_uri(),
        js_api=api,
        width=1380,
        height=900,
        min_size=(1100, 720),
        background_color="#f8fafc",
    )

    api.set_window(window)

    webview.start(debug=False)


if __name__ == "__main__":
    main()
