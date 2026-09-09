# SPDX-FileCopyrightText: 2026 Open-mind Contributors
# SPDX-License-Identifier: MIT
#
# Purpose: Open-mind - Offline AI-Powered Academic Lecture Copilot.
# Distributed under the terms of the OSI-approved MIT License.

import os
from pathlib import Path

import json

BASE_DIR = Path(__file__).resolve().parent.parent

# Tự động nạp cấu hình từ tệp .env nếu tồn tại (Chuẩn 12-Factor App & POSIX)
_env_path = BASE_DIR / ".env"
if _env_path.exists():
    try:
        with open(_env_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1)
                    k, v = k.strip(), v.strip()
                    if k and k not in os.environ:
                        os.environ[k] = v
    except Exception:
        pass

# Cho phép cấu hình thư mục linh hoạt qua biến môi trường để chạy ngoài thư mục mã nguồn
DATA_DIR = Path(os.getenv("OPENMIND_DATA_DIR")) if os.getenv("OPENMIND_DATA_DIR") else BASE_DIR / "data"
MODELS_DIR = Path(os.getenv("OPENMIND_MODELS_DIR")) if os.getenv("OPENMIND_MODELS_DIR") else BASE_DIR / "models"
OUTPUTS_DIR = DATA_DIR / "outputs"
SAMPLES_DIR = DATA_DIR / "samples"

# Ensure directories exist
for directory in [DATA_DIR, MODELS_DIR, OUTPUTS_DIR, SAMPLES_DIR]:
    directory.mkdir(parents=True, exist_ok=True)

DB_PATH = DATA_DIR / "openmind.db"
SETTINGS_PATH = DATA_DIR / "settings.json"


# Load settings from JSON
_settings = {}
if SETTINGS_PATH.exists():
    try:
        with open(SETTINGS_PATH, "r", encoding="utf-8") as f:
            _settings = json.load(f)
    except Exception:
        pass

# ──────────────────────────────────────────────────────────────────
# Whisper STT Models Metadata & Configurations
# ──────────────────────────────────────────────────────────────────
WHISPER_MODELS_METADATA = {
    "tiny": {
        "id": "tiny",
        "name": "Tiny (~75 MB)",
        "size_mb": 75,
        "speed": "Siêu nhanh (~10x)",
        "min_ram": "2GB - 4GB RAM",
        "description": "⚡ Nhanh nhất, nhẹ nhất, phù hợp máy cấu hình yếu. Độ chính xác thấp hơn với tiếng Việt chuyên ngành.",
        "recommended": False
    },
    "base": {
        "id": "base",
        "name": "Base (~145 MB)",
        "size_mb": 145,
        "speed": "Nhanh (~6x)",
        "min_ram": "4GB RAM",
        "description": "🚀 Tốc độ nhanh, nhận diện tốt câu thông dụng. Có thể nhầm lẫn một số thuật ngữ tiếng Anh trong bài giảng.",
        "recommended": False
    },
    "small": {
        "id": "small",
        "name": "Small (~460 MB) [Khuyên dùng]",
        "size_mb": 460,
        "speed": "Cân bằng (~3x)",
        "min_ram": "6GB RAM",
        "description": "⭐ Cân bằng tối ưu giữa tốc độ và độ chính xác cho tiếng Việt học thuật & thuật ngữ tiếng Anh.",
        "recommended": True
    },
    "medium": {
        "id": "medium",
        "name": "Medium (~1.5 GB)",
        "size_mb": 1500,
        "speed": "Chậm (~1x)",
        "min_ram": "8GB - 16GB RAM",
        "description": "🎯 Độ chính xác cao nhất cho bài giảng học thuật phức tạp, code-switching. Cần máy mạnh (RAM ≥ 8GB).",
        "recommended": False
    }
}

DEFAULT_WHISPER_SIZE = os.getenv("OPENMIND_WHISPER_SIZE", _settings.get("whisper_size", "small"))
if DEFAULT_WHISPER_SIZE not in WHISPER_MODELS_METADATA:
    DEFAULT_WHISPER_SIZE = "small"

WHISPER_DEVICE = os.getenv("OPENMIND_WHISPER_DEVICE", _settings.get("whisper_device", "cpu"))
WHISPER_COMPUTE_TYPE = os.getenv("OPENMIND_WHISPER_COMPUTE_TYPE", _settings.get("whisper_compute_type", "int8"))
WHISPER_BEAM_SIZE = int(_settings.get("whisper_beam_size", 1))       # 1 = Greedy search (nhanh gấp đôi beam_size=2)
WHISPER_CPU_THREADS = int(os.getenv("OPENMIND_WHISPER_CPU_THREADS", _settings.get("whisper_cpu_threads", min(16, max(4, os.cpu_count() or 8)))))
WHISPER_VAD_MIN_SILENCE_MS = 500    # ms of silence to split segments
WHISPER_LANGUAGE = "vi"

# ──────────────────────────────────────────────────────────────────
# LLM Configuration (Qwen 2.5 3B)
# ──────────────────────────────────────────────────────────────────
LLM_MODEL_FILENAME = os.getenv("OPENMIND_LLM_MODEL", "qwen2.5-3b-instruct-q4_k_m.gguf")
LLM_CONTEXT_SIZE = int(os.getenv("OPENMIND_LLM_CONTEXT_SIZE", _settings.get("llm_context_size", 4096)))
# Tối ưu hóa số luồng sinh từ (n_threads) trên P-cores để đạt tokens/giây tối đa
LLM_THREADS = int(os.getenv("OPENMIND_LLM_THREADS", _settings.get("llm_threads", min(8, max(4, (os.cpu_count() or 4) // 2)))))

# Enable offline mode for Hugging Face Hub if local models exist
if (MODELS_DIR / f"faster-whisper-{DEFAULT_WHISPER_SIZE}").exists() and (MODELS_DIR / LLM_MODEL_FILENAME).exists():
    os.environ["HF_HUB_OFFLINE"] = "1"


def get_whisper_model_path(model_size: str = DEFAULT_WHISPER_SIZE) -> str:
    """
    Returns local model path if exists, otherwise returns model size name
    for HuggingFace auto-download (only if HF_HUB_OFFLINE=0).
    Falls back to available smaller models if requested model is not locally available.
    """
    required = ["model.bin", "config.json", "tokenizer.json", "vocabulary.txt"]
    local_path = MODELS_DIR / f"faster-whisper-{model_size}"
    if local_path.exists() and all((local_path / f).exists() for f in required):
        return str(local_path)

    # Check cache
    cache_dir = Path.home() / ".cache" / "huggingface" / "hub"
    if cache_dir.exists() and list(cache_dir.glob(f"*faster-whisper-{model_size}*")):
        return model_size

    # Fallback cascade: small -> base -> tiny
    for fb in ["small", "base", "tiny"]:
        fb_path = MODELS_DIR / f"faster-whisper-{fb}"
        if fb_path.exists() and all((fb_path / f).exists() for f in required):
            return str(fb_path)

    return model_size


def get_llm_model_path() -> Path:
    return MODELS_DIR / LLM_MODEL_FILENAME
