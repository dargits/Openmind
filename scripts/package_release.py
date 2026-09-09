#!/usr/bin/env python3
# SPDX-FileCopyrightText: 2026 Open-mind Contributors
# SPDX-License-Identifier: MIT
#
# Purpose: Script to package Open-mind source code into standard open archive
# formats (.tar.gz and .tar.xz), strictly complying with the competition PoF rules
# (preventing point deductions for proprietary archives like .zip or .rar).

import os
import sys
import tarfile
import hashlib
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
VERSION = "1.0.0"

# Directories and files to strictly exclude from the release tarball
EXCLUDE_NAMES = {
    ".git",
    ".github",
    "venv",
    ".venv",
    "env",
    "__pycache__",
    ".pytest_cache",
    ".coverage",
    "htmlcov",
    ".mypy_cache",
    "build",
    "dist",
    ".idea",
    ".vscode",
    "openmind.db",
    "openmind.db-shm",
    "openmind.db-wal",
    "settings.json",
}

def is_excluded(tarinfo):
    name = Path(tarinfo.name).name
    # Exclude files in exclude list
    if name in EXCLUDE_NAMES:
        return None
    # Exclude compiled bytecode or model binary weights
    if name.endswith((".pyc", ".pyo", ".gguf", ".bin", ".safetensors", ".pt", ".pth")):
        return None
    return tarinfo

def compute_sha256(file_path: Path) -> str:
    hasher = hashlib.sha256()
    with open(file_path, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            hasher.update(chunk)
    return hasher.hexdigest()

def package():
    DIST_DIR.mkdir(parents=True, exist_ok=True)
    archive_name = f"openmind-v{VERSION}.tar.gz"
    output_path = DIST_DIR / archive_name

    print("=" * 65)
    print(f"📦 Đang đóng gói Bản Phát Hành Mở: {archive_name}")
    print("=" * 65)
    print("Định dạng: GZIP Compressed Tarball (.tar.gz - Tiêu chuẩn Open Source POSIX)")
    print("Tuân thủ: Bộ tiêu chí PoF cuộc thi PMMN & AI 2026 (Tránh trừ 3đ vì dùng .zip)")

    with tarfile.open(output_path, "w:gz") as tar:
        tar.add(REPO_ROOT, arcname=f"openmind-v{VERSION}", filter=is_excluded)

    size_mb = output_path.stat().st_size / (1024 * 1024)
    sha256 = compute_sha256(output_path)

    # Save sha256 checksum
    checksum_file = DIST_DIR / f"openmind-v{VERSION}-SHA256SUMS.txt"
    checksum_file.write_text(f"{sha256}  {archive_name}\n", encoding="utf-8")

    print(f"\n✓ Đóng gói thành công!")
    print(f"  • Đường dẫn: {output_path}")
    print(f"  • Dung lượng: {size_mb:.2f} MB")
    print(f"  • SHA-256:   {sha256}")
    print(f"  • Checksum:  {checksum_file}")

    print("\n" + "=" * 65)
    print("📋 HƯỚNG DẪN TẠO GITHUB RELEASE CHUẨN THỂ LỆ:")
    print("=" * 65)
    print(f"1. Tạo Git Tag phiên bản:")
    print(f"   git tag -a v{VERSION} -m \"Release version {VERSION} for PMMN & AI 2026\"")
    print(f"   git push origin v{VERSION}")
    print(f"\n2. Truy cập GitHub tạo Release:")
    print(f"   URL: https://github.com/dargits/Openmind/releases/new")
    print(f"   - Tag version: v{VERSION}")
    print(f"   - Release title: Open-mind v{VERSION} — Official Competition Release")
    print(f"   - Attach binary/archive: Tải file '{archive_name}' và '{checksum_file.name}' lên!")
    print("=" * 65)

if __name__ == "__main__":
    package()
