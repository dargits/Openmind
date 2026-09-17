# SPDX-FileCopyrightText: 2026 Open-mind Contributors
# SPDX-License-Identifier: MIT
#
# Purpose: Open-mind - Offline AI-Powered Academic Lecture Copilot.
# Distributed under the terms of the OSI-approved MIT License.

﻿import os
import sys
import shutil
import hashlib
import subprocess
from pathlib import Path

if sys.stdout and hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

REPO_ROOT = Path(__file__).resolve().parent.parent
DIST_DIR = REPO_ROOT / "dist"
SCRIPTS_DIR = REPO_ROOT / "scripts"
UI_DIR = REPO_ROOT / "ui"
SPEC_FILE = SCRIPTS_DIR / "OpenMind.spec"
ISS_FILE = SCRIPTS_DIR / "installer.iss"
SETUP_EXE = DIST_DIR / "OpenMind_Setup.exe"

INNO_SETUP_SEARCH_PATHS = [
    Path(os.environ.get("ProgramFiles", "C:\\Program Files")) / "Inno Setup 6" / "ISCC.exe",
    Path(os.environ.get("ProgramFiles(x86)", "C:\\Program Files (x86)")) / "Inno Setup 6" / "ISCC.exe",
    Path(os.environ.get("LOCALAPPDATA", "")) / "Programs" / "Inno Setup 6" / "ISCC.exe",
]


def log_header(title: str):
    print("\n" + "=" * 68)
    print(f"  {title}")
    print("=" * 68)


def compute_sha256(file_path: Path) -> str:
    hasher = hashlib.sha256()
    with open(file_path, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            hasher.update(chunk)
    return hasher.hexdigest()


def ensure_icon():
    ico_path = UI_DIR / "logo.ico"
    jpg_path = UI_DIR / "logo.jpg"
    if not ico_path.exists() and jpg_path.exists():
        print("[1/5] Đang tạo icon ứng dụng (logo.ico)...")
        try:
            from PIL import Image
            img = Image.open(jpg_path)
            img.save(ico_path, sizes=[(256, 256), (128, 128), (64, 64), (48, 48), (32, 32), (16, 16)])
            print("  ✓ Đã tạo file icon logo.ico thành công.")
        except Exception as e:
            print(f"  ⚠️ Không thể tạo logo.ico: {e}")
    else:
        print("[1/5] ✓ File icon logo.ico đã sẵn sàng.")


def find_or_install_iscc() -> Path:
    iscc_path = shutil.which("iscc") or shutil.which("ISCC")
    if iscc_path and Path(iscc_path).exists():
        return Path(iscc_path)

    for path in INNO_SETUP_SEARCH_PATHS:
        if path.exists():
            return path

    print("\n[Inno Setup] Chưa phát hiện Inno Setup Compiler (ISCC.exe) trên máy.")
    print("  -> Đang tự động cài đặt Inno Setup 6 thông qua winget...")
    try:
        cmd = ["winget", "install", "JRSoftware.InnoSetup", "--silent", "--accept-source-agreements", "--accept-package-agreements"]
        res = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
        if res.returncode == 0:
            print("  ✓ Đã cài đặt Inno Setup 6 thành công!")
            for path in INNO_SETUP_SEARCH_PATHS:
                if path.exists():
                    return path
    except Exception as e:
        print(f"  ⚠️ Cài đặt tự động thất bại: {e}")

    return None


def build_pyinstaller():
    log_header("BƯỚC 1: BIÊN DỊCH ỨNG DỤNG BẰNG PYINSTALLER")
    print(f"Đang biên dịch mã nguồn theo cấu hình {SPEC_FILE.name}...")
    print("Quá trình này có thể mất 1-3 phút tùy vào cấu hình máy, vui lòng chờ...\n")

    cmd = [sys.executable, "-m", "PyInstaller", "--noconfirm", str(SPEC_FILE)]
    result = subprocess.run(cmd, cwd=str(REPO_ROOT))
    if result.returncode != 0:
        print("\n[LỖI] PyInstaller biên dịch thất bại!")
        sys.exit(1)

    app_dir = DIST_DIR / "OpenMind"
    exe_file = app_dir / "OpenMind.exe"
    if not exe_file.exists():
        print(f"\n[LỖI] Không tìm thấy file chạy đích: {exe_file}")
        sys.exit(1)

    print(f"\n✓ Biên dịch PyInstaller hoàn tất: {app_dir}")


def sanitize_dist():
    """Làm sạch dữ liệu cá nhân & tạo thư mục rỗng cho models để file cài đặt siêu nhẹ."""
    app_dir = DIST_DIR / "OpenMind"
    data_dir = app_dir / "data"
    if data_dir.exists():
        for db_file in data_dir.glob("*.db*"):
            try:
                db_file.unlink()
                print(f"  -> Đã loại bỏ file dữ liệu cá nhân: {db_file.name}")
            except Exception:
                pass
        for sub in ["downloads", "outputs", "samples"]:
            sub_path = data_dir / sub
            if sub_path.exists():
                shutil.rmtree(sub_path, ignore_errors=True)
                print(f"  -> Đã dọn dẹp thư mục tạm: data/{sub}")

    # Không nhúng mô hình AI nặng (~460MB) vào file setup để file cài đặt siêu nhẹ (~50MB)
    # Ứng dụng sẽ tự động tải Whisper Small khi người dùng khởi chạy lần đầu
    models_dist = app_dir / "models"
    if models_dist.exists():
        shutil.rmtree(models_dist, ignore_errors=True)
    models_dist.mkdir(parents=True, exist_ok=True)
    print("  -> Đã cấu hình gói cài đặt siêu nhẹ: Mô hình STT sẽ tự động tải khi người dùng mở ứng dụng.")


def build_inno_setup(iscc_path: Path):
    log_header("BƯỚC 2: ĐÓNG GÓI BỘ CÀI ĐẶT WINDOWS (INNO SETUP)")
    print(f"Trình biên dịch: {iscc_path}")
    print(f"File kịch bản:  {ISS_FILE.name}")
    print("Đang nén dữ liệu chuẩn LZMA2 và tạo OpenMind_Setup.exe...\n")

    cmd = [str(iscc_path), str(ISS_FILE)]
    result = subprocess.run(cmd, cwd=str(SCRIPTS_DIR))
    if result.returncode != 0:
        print("\n[LỖI] Inno Setup đóng gói thất bại!")
        sys.exit(1)

    if not SETUP_EXE.exists():
        print(f"\n[LỖI] Không tìm thấy file setup đích: {SETUP_EXE}")
        sys.exit(1)


def verify_and_report():
    sha256 = compute_sha256(SETUP_EXE)
    size_mb = SETUP_EXE.stat().st_size / (1024 * 1024)

    sha_file = DIST_DIR / "OpenMind_Setup-SHA256.txt"
    sha_file.write_text(f"{sha256}  OpenMind_Setup.exe\n", encoding="utf-8")

    log_header("🎉 ĐÓNG GÓI THÀNH CÔNG: OPENMIND_SETUP.EXE (BẢN SIÊU NHẸ)")
    print(f"  • File cài đặt:  {SETUP_EXE}")
    print(f"  • Kích thước:    {size_mb:.2f} MB (Siêu nhẹ, tải siêu nhanh!)")
    print(f"  • SHA-256:       {sha256}")
    print(f"  • Checksum file: {sha_file.name}")
    print("\nNgười dùng chỉ cần tải file OpenMind_Setup.exe và bấm Next để cài đặt!")
    print("Khi mở app lần đầu, ứng dụng sẽ tự động tải mô hình Whisper Small qua Splash Screen.")
    print("=" * 68 + "\n")


def main():
    print("=" * 68)
    print("  OPEN-MIND - BỘ TẠO BẢN CÀI ĐẶT SIÊU NHẸ (LIGHTWEIGHT SETUP BUILDER)")
    print("=" * 68)
    print(f"Thư mục dự án: {REPO_ROOT}")

    ensure_icon()

    iscc_path = find_or_install_iscc()
    if not iscc_path:
        print("\n[CẢNH BÁO] Không tìm thấy Inno Setup compiler (ISCC.exe).")
        print("  -> Vui lòng cài đặt Inno Setup 6 từ: https://jrsoftware.org/isdl.php")
        print("  -> Tiếp tục biên dịch PyInstaller standalone (dist/OpenMind/)...")

    # 1. PyInstaller compile
    build_pyinstaller()

    # 2. Sanitize dist
    sanitize_dist()

    # 3. Inno Setup compile
    if iscc_path:
        build_inno_setup(iscc_path)
        verify_and_report()
    else:
        print("\n[Hoàn tất] Thư mục ứng dụng đã được tạo tại: dist/OpenMind/")


if __name__ == "__main__":
    main()
