#!/usr/bin/env python3
# SPDX-FileCopyrightText: 2026 Open-mind Contributors
# SPDX-License-Identifier: MIT
#
# Purpose: Open-mind Professional Setup Builder
# Automates the complete production build pipeline:
# 1. Icon preparation (PNG/JPG -> Multi-size ICO)
# 2. PyInstaller standalone compilation (dist/OpenMind/)
# 3. Inno Setup compiler detection & installation (ISCC.exe)
# 4. Packaging into dist/OpenMind_Setup.exe
# 5. Integrity hashing & verification (SHA-256)

import os
import sys
import shutil
import hashlib
import subprocess
from pathlib import Path

# Ensure UTF-8 output on Windows console
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
    # 1. Check PATH
    iscc_path = shutil.which("iscc") or shutil.which("ISCC")
    if iscc_path and Path(iscc_path).exists():
        return Path(iscc_path)

    # 2. Check standard installation folders
    for path in INNO_SETUP_SEARCH_PATHS:
        if path.exists():
            return path

    # 3. Attempt automated installation via winget if missing
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
    """Làm sạch toàn bộ dữ liệu cá nhân của người build trong thư mục dist trước khi đóng gói."""
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

    # Đồng bộ mô hình Whisper Small sẵn có
    models_dist = app_dir / "models"
    models_dist.mkdir(parents=True, exist_ok=True)
    whisper_src = REPO_ROOT / "models" / "faster-whisper-small"
    whisper_dst = models_dist / "faster-whisper-small"
    if whisper_src.exists() and not whisper_dst.exists():
        print("  -> Đang nạp mô hình nhận diện giọng nói Whisper Small vào bộ phân phối...")
        shutil.copytree(whisper_src, whisper_dst)

    # Đảm bảo có settings.json sạch
    settings_src = REPO_ROOT / "data" / "settings.json"
    settings_dst = data_dir / "settings.json"
    if settings_src.exists():
        data_dir.mkdir(parents=True, exist_ok=True)
        shutil.copy2(settings_src, settings_dst)


def build_inno_setup(iscc_bin: Path):
    sanitize_dist()
    log_header("BƯỚC 2: ĐÓNG GÓI BỘ CÀI ĐẶT WINDOWS (INNO SETUP)")
    print(f"Trình biên dịch: {iscc_bin}")
    print(f"File kịch bản:  {ISS_FILE.name}")
    print("Đang nén dữ liệu chuẩn LZMA2 và tạo OpenMind_Setup.exe...\n")

    cmd = [str(iscc_bin), str(ISS_FILE)]
    result = subprocess.run(cmd, cwd=str(SCRIPTS_DIR))
    if result.returncode != 0:
        print("\n[LỖI] Inno Setup đóng gói thất bại!")
        sys.exit(1)

    if not SETUP_EXE.exists():
        # Look for any setup exe in dist
        candidates = list(DIST_DIR.glob("*Setup*.exe"))
        if candidates:
            final_exe = candidates[0]
        else:
            print(f"\n[LỖI] Không tìm thấy file cài đặt trong {DIST_DIR}")
            sys.exit(1)
    else:
        final_exe = SETUP_EXE

    size_mb = final_exe.stat().st_size / (1024 * 1024)
    sha256 = compute_sha256(final_exe)

    # Save checksum
    checksum_file = DIST_DIR / f"{final_exe.stem}-SHA256.txt"
    checksum_file.write_text(f"{sha256}  {final_exe.name}\n", encoding="utf-8")

    log_header("🎉 ĐÓNG GÓI THÀNH CÔNG: OPENMIND_SETUP.EXE")
    print(f"  • File cài đặt:  {final_exe}")
    print(f"  • Kích thước:    {size_mb:.2f} MB")
    print(f"  • SHA-256:       {sha256}")
    print(f"  • Checksum file: {checksum_file.name}")
    print("\nNgười dùng chỉ cần tải file OpenMind_Setup.exe và bấm Next để cài đặt!")
    print("Không cần cài đặt Python, không cần cài thư viện, mở lên dùng ngay.")
    print("=" * 68)


def main():
    log_header("OPEN-MIND - BỘ TẠO BẢN CÀI ĐẶT THƯƠNG MẠI (STANDALONE SETUP BUILDER)")
    print(f"Thư mục dự án: {REPO_ROOT}")

    # 1. Prepare icon
    ensure_icon()

    # 2. Check Inno Setup before building
    iscc_bin = find_or_install_iscc()

    # 3. Build standalone executable
    build_pyinstaller()

    # 4. Build Inno Setup
    if iscc_bin and iscc_bin.exists():
        build_inno_setup(iscc_bin)
    else:
        print("\n" + "!" * 68)
        print("[CHÚ Ý] Đã biên dịch xong thư mục chạy Portable tại: dist\\OpenMind\\")
        print("Để tạo file OpenMind_Setup.exe tự động:")
        print("  1. Cài đặt Inno Setup 6 từ: https://jrsoftware.org/isdl.php")
        print("     (hoặc chạy lệnh: winget install JRSoftware.InnoSetup)")
        print("  2. Chạy lại script này để xuất file OpenMind_Setup.exe hoàn chỉnh.")
        print("!" * 68)


if __name__ == "__main__":
    main()
