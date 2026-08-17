"""
Open-mind — Model Manager & Automatic Downloader
────────────────────────────────────────────────
Manages verification, integrity checks, and automatic downloads
for offline STT (Whisper) and LLM (Qwen 2.5 GGUF) models.
"""

import os
import sys
import time
import urllib.request
from pathlib import Path
from typing import Callable, Optional, Dict, Any

from core.config import (
    MODELS_DIR,
    LLM_MODEL_FILENAME,
    DEFAULT_WHISPER_SIZE,
)

# Hugging Face Repository Constants
WHISPER_REPOS = {
    "tiny": "Systran/faster-whisper-tiny",
    "base": "Systran/faster-whisper-base",
    "small": "Systran/faster-whisper-small",
    "medium": "Systran/faster-whisper-medium",
}

LLM_REPO_ID = "Qwen/Qwen2.5-3B-Instruct-GGUF"
LLM_FALLBACK_REPO_ID = "bartowski/Qwen2.5-3B-Instruct-GGUF"
LLM_DIRECT_URLS = [
    f"https://huggingface.co/{LLM_REPO_ID}/resolve/main/{LLM_MODEL_FILENAME}",
    f"https://hf-mirror.com/{LLM_REPO_ID}/resolve/main/{LLM_MODEL_FILENAME}",
]

REQUIRED_WHISPER_FILES = ["model.bin", "config.json", "tokenizer.json", "vocabulary.txt"]


class ModelManager:
    """Handles verification and downloading of local offline models."""

    @staticmethod
    def is_whisper_available(model_size: str = DEFAULT_WHISPER_SIZE) -> bool:
        target_dir = MODELS_DIR / f"faster-whisper-{model_size}"
        if target_dir.exists() and all((target_dir / f).exists() for f in REQUIRED_WHISPER_FILES):
            return True
        return False

    @staticmethod
    def is_llm_available() -> bool:
        target_file = MODELS_DIR / LLM_MODEL_FILENAME
        # Ensure file exists and is larger than 500MB (prevent partial corrupt file)
        return target_file.exists() and target_file.stat().st_size > 500 * 1024 * 1024

    @classmethod
    def get_status(cls) -> Dict[str, Any]:
        """Returns availability status for all models."""
        return {
            "whisper_ready": cls.is_whisper_available(),
            "llm_ready": cls.is_llm_available(),
            "all_ready": cls.is_whisper_available() and cls.is_llm_available(),
            "models_dir": str(MODELS_DIR),
        }

    @classmethod
    def download_whisper_model(
        cls,
        model_size: str = DEFAULT_WHISPER_SIZE,
        progress_callback: Optional[Callable[[str, float], None]] = None,
    ) -> bool:
        """
        Downloads Whisper model from Hugging Face Hub into models/faster-whisper-{size}.
        """
        if cls.is_whisper_available(model_size):
            if progress_callback:
                progress_callback(f"Mô hình Whisper ({model_size}) đã sẵn sàng.", 1.0)
            return True

        repo_id = WHISPER_REPOS.get(model_size, f"Systran/faster-whisper-{model_size}")
        target_dir = MODELS_DIR / f"faster-whisper-{model_size}"
        target_dir.mkdir(parents=True, exist_ok=True)

        msg = f"[Open-mind] Đang tải mô hình Whisper ({model_size}) từ {repo_id}..."
        print(msg)
        if progress_callback:
            progress_callback(f"Đang tải mô hình giọng nói Whisper ({model_size})...", 0.1)

        # Allow network access for download
        os.environ.pop("HF_HUB_OFFLINE", None)

        # Method 1: Using huggingface_hub snapshot_download
        try:
            from huggingface_hub import snapshot_download
            snapshot_download(
                repo_id=repo_id,
                local_dir=str(target_dir),
                local_dir_use_symlinks=False,
                resume_download=True,
            )
            print(f"[Open-mind] ✓ Đã tải xong Whisper ({model_size}) vào {target_dir}")
            if progress_callback:
                progress_callback(f"Mô hình giọng nói ({model_size}) đã sẵn sàng ✓", 1.0)
            return True
        except Exception as e:
            print(f"[Open-mind] huggingface_hub download failed: {e}. Trying direct file download...")

        # Method 2: Direct file download fallback
        try:
            base_url = f"https://huggingface.co/{repo_id}/resolve/main"
            total_files = len(REQUIRED_WHISPER_FILES)
            for idx, fname in enumerate(REQUIRED_WHISPER_FILES):
                dest = target_dir / fname
                if not dest.exists():
                    url = f"{base_url}/{fname}"
                    if progress_callback:
                        progress_callback(
                            f"Đang tải tệp Whisper ({fname}) [{idx+1}/{total_files}]...",
                            (idx / total_files),
                        )
                    cls._download_file_with_progress(url, dest)
            if progress_callback:
                progress_callback(f"Mô hình giọng nói ({model_size}) đã sẵn sàng ✓", 1.0)
            return True
        except Exception as e2:
            print(f"[Open-mind Error] Không thể tải mô hình Whisper: {e2}")
            return False

    @classmethod
    def download_llm_model(
        cls,
        progress_callback: Optional[Callable[[str, float], None]] = None,
    ) -> bool:
        """
        Downloads Qwen 2.5 3B GGUF model into models/qwen2.5-3b-instruct-q4_k_m.gguf.
        """
        if cls.is_llm_available():
            if progress_callback:
                progress_callback("Mô hình AI Qwen 2.5 đã sẵn sàng.", 1.0)
            return True

        target_file = MODELS_DIR / LLM_MODEL_FILENAME
        tmp_file = MODELS_DIR / f"{LLM_MODEL_FILENAME}.download"

        msg = f"[Open-mind] Đang tải mô hình AI Qwen 2.5 3B ({LLM_MODEL_FILENAME})..."
        print(msg)
        if progress_callback:
            progress_callback("Đang tải mô hình AI Qwen 2.5 (~2.0GB, cần vài phút)...", 0.05)

        # Allow network access for download
        os.environ.pop("HF_HUB_OFFLINE", None)

        # Method 1: Using huggingface_hub hf_hub_download
        try:
            from huggingface_hub import hf_hub_download
            downloaded_path = hf_hub_download(
                repo_id=LLM_REPO_ID,
                filename=LLM_MODEL_FILENAME,
                local_dir=str(MODELS_DIR),
                local_dir_use_symlinks=False,
                resume_download=True,
            )
            if Path(downloaded_path).exists():
                print(f"[Open-mind] ✓ Đã tải xong LLM model vào {target_file}")
                if progress_callback:
                    progress_callback("Mô hình AI Qwen 2.5 đã sẵn sàng ✓", 1.0)
                return True
        except Exception as e:
            print(f"[Open-mind] hf_hub_download failed: {e}. Trying direct stream download...")

        # Method 2: Stream download with resume and progress
        for url in LLM_DIRECT_URLS:
            try:
                print(f"[Open-mind] Đang kết nối tới: {url}")
                success = cls._download_file_with_progress(
                    url, tmp_file, progress_callback=progress_callback
                )
                if success and tmp_file.exists() and tmp_file.stat().st_size > 500 * 1024 * 1024:
                    if target_file.exists():
                        target_file.unlink()
                    tmp_file.rename(target_file)
                    print(f"[Open-mind] ✓ Đã tải và lưu LLM model thành công!")
                    if progress_callback:
                        progress_callback("Mô hình AI Qwen 2.5 đã sẵn sàng ✓", 1.0)
                    return True
            except Exception as e_url:
                print(f"[Open-mind] Thất bại khi tải từ {url}: {e_url}")
                continue

        print(f"[Open-mind Error] Không thể tải mô hình LLM từ tất cả các nguồn.")
        return False

    @classmethod
    def _download_file_with_progress(
        cls,
        url: str,
        dest_path: Path,
        progress_callback: Optional[Callable[[str, float], None]] = None,
    ) -> bool:
        """Stream download a file with progress bar in console & GUI callback."""
        import requests

        dest_path.parent.mkdir(parents=True, exist_ok=True)
        headers = {"User-Agent": "Open-mind-App/1.0"}

        # Check existing bytes for resume
        existing_bytes = dest_path.stat().st_size if dest_path.exists() else 0
        if existing_bytes > 0:
            headers["Range"] = f"bytes={existing_bytes}-"

        resp = requests.get(url, headers=headers, stream=True, timeout=30)
        
        # If range request not satisfiable or full download needed
        if resp.status_code == 416: # Range Not Satisfiable -> file might be full or corrupt
            headers.pop("Range", None)
            existing_bytes = 0
            resp = requests.get(url, headers=headers, stream=True, timeout=30)

        resp.raise_for_status()

        total_bytes = int(resp.headers.get("content-length", 0)) + existing_bytes
        mode = "ab" if (existing_bytes > 0 and resp.status_code == 206) else "wb"
        downloaded = existing_bytes if mode == "ab" else 0

        chunk_size = 1024 * 1024  # 1MB
        last_log = time.time()

        with open(dest_path, mode) as f:
            for chunk in resp.iter_content(chunk_size=chunk_size):
                if chunk:
                    f.write(chunk)
                    downloaded += len(chunk)
                    now = time.time()
                    if now - last_log >= 0.5:
                        pct = (downloaded / total_bytes) if total_bytes > 0 else 0
                        mb_done = downloaded / (1024 * 1024)
                        mb_total = total_bytes / (1024 * 1024)
                        text = f"Đang tải {dest_path.name}: {mb_done:.1f}/{mb_total:.1f} MB ({pct*100:.1f}%)"
                        sys.stdout.write(f"\r{text}")
                        sys.stdout.flush()
                        if progress_callback:
                            progress_callback(text, pct)
                        last_log = now

        sys.stdout.write("\n")
        return True

    @classmethod
    def ensure_all_models(
        cls,
        progress_callback: Optional[Callable[[str, float], None]] = None,
    ) -> bool:
        """
        Checks and downloads all missing models (STT + LLM).
        After all downloads complete, activates HF_HUB_OFFLINE=1 for 100% local operation.
        """
        print("[Open-mind] Đang kiểm tra tính sẵn sàng của các mô hình AI...")
        
        # 1. Check & Download Whisper
        if not cls.is_whisper_available():
            print("[Open-mind] Phát hiện thiếu mô hình Whisper. Đang tự động tải về...")
            ok = cls.download_whisper_model(progress_callback=progress_callback)
            if not ok:
                print("[Open-mind] Cảnh báo: Chưa tải được mô hình Whisper.")
        else:
            print("[Open-mind] ✓ Mô hình Whisper STT đã sẵn sàng.")

        # 2. Check & Download LLM
        if not cls.is_llm_available():
            print("[Open-mind] Phát hiện thiếu mô hình Qwen 2.5 3B GGUF. Đang tự động tải về...")
            ok = cls.download_llm_model(progress_callback=progress_callback)
            if not ok:
                print("[Open-mind] Cảnh báo: Chưa tải được mô hình LLM.")
        else:
            print("[Open-mind] ✓ Mô hình LLM Qwen 2.5 đã sẵn sàng.")

        # 3. Activate offline mode now that models are present
        os.environ["HF_HUB_OFFLINE"] = "1"
        return cls.is_whisper_available() and cls.is_llm_available()


model_manager = ModelManager()
