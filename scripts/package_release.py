import os
import sys
import tarfile
import hashlib
from pathlib import Path

if sys.stdout and hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

REPO_ROOT = Path(__file__).resolve().parent.parent
DIST_DIR = REPO_ROOT / "dist"
VERSION = "2.1.0"

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
    "downloads",
    "openmind.db",
    "openmind.db-shm",
    "openmind.db-wal",
    "settings.json",
    ".env",
    ".env.local",
}

def is_excluded(tarinfo):
    name = Path(tarinfo.name).name
    if name in EXCLUDE_NAMES:
        return None
    if name.endswith((".pyc", ".pyo", ".gguf", ".bin", ".safetensors", ".pt", ".pth", ".mp3", ".wav", ".m4a", ".mp4")):
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
    
    # 1. Package .tar.gz (Open Standard POSIX)
    gz_name = f"openmind-v{VERSION}.tar.gz"
    gz_path = DIST_DIR / gz_name
    print(f"📦 Đang đóng gói bản phát hành mở: {gz_name}...")
    with tarfile.open(gz_path, "w:gz") as tar:
        tar.add(REPO_ROOT, arcname=f"openmind-v{VERSION}", filter=is_excluded)
    
    # 2. Package .tar.xz (High-efficiency Open Standard)
    xz_name = f"openmind-v{VERSION}.tar.xz"
    xz_path = DIST_DIR / xz_name
    print(f"📦 Đang đóng gói bản phát hành mở: {xz_name}...")
    with tarfile.open(xz_path, "w:xz") as tar:
        tar.add(REPO_ROOT, arcname=f"openmind-v{VERSION}", filter=is_excluded)

    sha_gz = compute_sha256(gz_path)
    sha_xz = compute_sha256(xz_path)

    checksum_file = DIST_DIR / f"openmind-v{VERSION}-SHA256SUMS.txt"
    checksum_content = f"{sha_gz}  {gz_name}\n{sha_xz}  {xz_name}\n"
    checksum_file.write_text(checksum_content, encoding="utf-8")

    print("\n✓ Đóng gói phát hành định dạng mở hoàn tất:")
    print(f"  • {gz_path.name} ({gz_path.stat().st_size / (1024*1024):.2f} MB) - SHA256: {sha_gz}")
    print(f"  • {xz_path.name} ({xz_path.stat().st_size / (1024*1024):.2f} MB) - SHA256: {sha_xz}")
    print(f"  • Checksum: {checksum_file.name}")

if __name__ == "__main__":
    package()
