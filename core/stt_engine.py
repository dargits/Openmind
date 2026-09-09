# SPDX-FileCopyrightText: 2026 Open-mind Contributors
# SPDX-License-Identifier: MIT
#
# Purpose: Open-mind - Offline AI-Powered Academic Lecture Copilot.
# Distributed under the terms of the OSI-approved MIT License.

import os
import re
from pathlib import Path
from typing import Callable, Optional, List, Dict, Any
from core.config import (
    get_whisper_model_path,
    DEFAULT_WHISPER_SIZE,
    WHISPER_DEVICE,
    WHISPER_COMPUTE_TYPE,
    WHISPER_BEAM_SIZE,
    WHISPER_VAD_MIN_SILENCE_MS,
    WHISPER_LANGUAGE,
    MODELS_DIR
)

# ──────────────────────────────────────────────────────────────────
# Default initial prompt: guides Whisper for Vietnamese + English
# code-switching in technical/academic lectures
# ──────────────────────────────────────────────────────────────────
DEFAULT_TECH_INITIAL_PROMPT = (
    "Bài giảng công nghệ thông tin, khoa học máy tính và toán học bằng tiếng Việt "
    "kèm các thuật ngữ tiếng Anh: MD5, SHA-256, Hash, Hash Function, Encryption, Decryption, "
    "Algorithm, Database, SQL, NoSQL, API, RESTful, JSON, JWT, Token, OAuth, Cookie, Session, Cache, Redis, "
    "Python, Java, C++, JavaScript, TypeScript, React, Docker, Kubernetes, CI/CD, Git, GitHub, "
    "TCP/IP, UDP, HTTP, HTTPS, DNS, SSL/TLS, Backend, Frontend, Fullstack, AI, Machine Learning, Deep Learning, "
    "Neural Network, Big Data, Cloud, AWS, Azure, Linux, Microservices, CPU, RAM, GPU, "
    "Array, Stack, Queue, Linked List, Tree, Graph, Recursion, Complexity, O(n), Binary Search, "
    "OOP, Class, Object, Inheritance, Polymorphism, Encapsulation, Interface, Abstract, "
    "Compiler, Interpreter, Runtime, Framework, Library, Module, Package, Dependency, "
    "Blockchain, Smart Contract, Cryptocurrency, NFT, DeFi, Web3."
)

# ──────────────────────────────────────────────────────────────────
# Post-processing: Vietnamese phonetic → correct technical terms
# Covers common Whisper misrecognitions for Vietnamese speakers
# ──────────────────────────────────────────────────────────────────
TECH_TERM_PATTERNS = [
    # MD5 & Hashes
    (r"\b(mờ\s*đê\s*(năm|5)|mờ\s*dê\s*năm|em\s*đi\s*fai|m\s*d\s*5)\b", "MD5"),
    (r"\b(ét\s*hát\s*a|s\s*h\s*a)\s*(-|\s*)?(256|hai\s*năm\s*sáu)\b", "SHA-256"),
    (r"\b(hát\s*x|hát\s*s|hát\s*xơ|hác\s*xơ|hét\s*s|hass|hashs|hát\s*sh)\b", "hash"),
    (r"\b(hàm\s+)(hát|hét|hác|hass|has)\b", r"\1hash"),
    (r"\b(hát\s*s|hass|hash)\s+phăng\s*xừn\b", "hash function"),
    (r"\b(hàm\s+băm\s+)(mờ\s*đê\s*5|mờ\s*đê\s*năm)\b", r"\1MD5"),

    # Common Protocols & Web
    (r"\b(tê\s*xê\s*pê|ti\s*xi\s*pi)\s*/\s*(ai\s*pi|a\s*i\s*pê)\b", "TCP/IP"),
    (r"\b(u\s*đê\s*pê|du\s*đi\s*pi)\b", "UDP"),
    (r"\b(hát\s*tê\s*tê\s*pê|hát\s*ti\s*ti\s*pi)\s*(ét|s)?\b", "HTTPS"),
    (r"\b(đê\s*en\s*ét|đi\s*en\s*et)\b", "DNS"),
    (r"\b(ét\s*ét\s*eo|ét\s*ét\s*l)\b", "SSL"),
    (r"\b(ti\s*en\s*ét|tê\s*en\s*ét)\b", "TLS"),

    # Databases & Formats
    (r"\b(ét\s*quy\s*eo|ét\s*cu\s*eo|s\s*q\s*l|xi\s*quần)\b", "SQL"),
    (r"\b(nô\s*ét\s*quy\s*eo|nô\s*s\s*q\s*l)\b", "NoSQL"),
    (r"\b(chây\s*sơn|giê\s*sơn|j\s*s\s*o\s*n)\b", "JSON"),
    (r"\b(chây\s*đắp\s*liu\s*ti|j\s*w\s*t)\b", "JWT"),
    (r"\b(a\s*pê\s*i|ây\s*pi\s*ai|a\s*p\s*i)\b", "API"),
    (r"\b(gít\s*hắp|gít\s*húp|git\s*háp)\b", "GitHub"),
    (r"\b(đóc\s*cơ|đốc\s*kơ|đốc\s*cơ)\b", "Docker"),
    (r"\b(cơ\s*sở\s+dữ\s+liệu\s+)(ét\s*quy\s*eo)\b", r"\1SQL"),
    (r"\b(ri\s*đít|rê\s*đit|re\s*dit)\b", "Redis"),

    # Programming & OOP
    (r"\b(pai\s*thơn|pai\s*thần|py\s*thon)\b", "Python"),
    (r"\b(chây\s*va\s*xcríp|gia\s*và\s*xcríp)\b", "JavaScript"),
    (r"\b(ô\s*ô\s*pi|ô\s*ô\s*pê)\b", "OOP"),
    (r"\b(in\s*tơ\s*phết|in\s*tơ\s*phây)\b", "Interface"),
    (r"\b(kom\s*plếch\s*xi\s*ti|com\s*plếch\s*xi\s*ti)\b", "Complexity"),

    # AI & Systems
    (r"\b(mê\s*sin\s*lơn\s*ninh|mơ\s*sin\s*lơn\s*ninh)\b", "Machine Learning"),
    (r"\b(đíp\s*lơn\s*ninh)\b", "Deep Learning"),
    (r"\b(niu\s*rồ\s*nét\s*wặk|niu\s*rồ\s*mạng)\b", "Neural Network"),
    (r"\b(mác\s*két\s*tinh)\b", "Marketing"),
    (r"\b(bách\s*en|bách\s*kên)\b", "Backend"),
    (r"\b(phờ\s*ron\s*en|phơ\s*ron\s*ten)\b", "Frontend"),
    (r"\b(phừ\s*stắc|phu\s*stắc|phờ\s*stắc)\b", "Fullstack"),
    (r"\b(cờ\s*lao\s*đờ|cờ\s*la\s*ude)\b", "Cloud"),
    (r"\b(bờ\s*lốc\s*chen|bờ\s*lóc\s*chên)\b", "Blockchain"),
]


def normalize_technical_terms(text: str) -> str:
    """Post-processes Vietnamese transcript to restore technical English terms."""
    if not text:
        return ""
    processed = text
    for pattern, replacement in TECH_TERM_PATTERNS:
        processed = re.sub(pattern, replacement, processed, flags=re.IGNORECASE)
    return processed


class STTEngine:
    def __init__(self, model_size: Optional[str] = None):
        self._model_size = model_size
        self.model = None

    @property
    def model_size(self) -> str:
        if self._model_size:
            return self._model_size
        import core.config as cfg
        return cfg.DEFAULT_WHISPER_SIZE

    @model_size.setter
    def model_size(self, value: str):
        self._model_size = value

    def is_model_available(self, model_size: Optional[str] = None) -> bool:
        size = model_size or self.model_size
        local_path = MODELS_DIR / f"faster-whisper-{size}"
        required = ["model.bin", "config.json", "tokenizer.json", "vocabulary.txt"]
        if local_path.exists() and all((local_path / f).exists() for f in required):
            return True
        cache_dir = Path.home() / ".cache" / "huggingface" / "hub"
        if cache_dir.exists() and len(list(cache_dir.glob(f"*faster-whisper-{size}*"))) > 0:
            return True
        return False

    def load_model(
        self,
        model_size: Optional[str] = None,
        progress_callback: Optional[Callable[[str], None]] = None
    ):
        from faster_whisper import WhisperModel
        import core.config as cfg

        size = model_size or self.model_size
        self._model_size = size
        whisper_path = get_whisper_model_path(size)

        if progress_callback:
            progress_callback(f"Đang nạp mô hình Whisper ({size})…")

        # Unload existing model if reloading
        if self.model is not None:
            del self.model
            self.model = None

        cpu_threads = getattr(cfg, "WHISPER_CPU_THREADS", min(16, max(4, os.cpu_count() or 8)))
        try:
            self.model = WhisperModel(
                whisper_path,
                device=cfg.WHISPER_DEVICE,
                compute_type=cfg.WHISPER_COMPUTE_TYPE,
                cpu_threads=cpu_threads,
                num_workers=2,
            )
            return self.model
        except Exception as e:
            err_msg = str(e).lower()
            # If failed on CUDA/GPU or float16, try fallback to CPU int8
            if "cuda" in err_msg or "gpu" in err_msg or "out of memory" in err_msg:
                print(f"[STT] Lỗi khi nạp trên {cfg.WHISPER_DEVICE}, đang tự động chuyển về CPU int8: {e}")
                self.model = WhisperModel(
                    whisper_path,
                    device="cpu",
                    compute_type="int8",
                    cpu_threads=cpu_threads,
                    num_workers=2,
                )
                return self.model
            raise RuntimeError(f"Không thể tải mô hình giọng nói '{size}'. Lỗi: {e}")

    def transcribe_audio(
        self,
        audio_path: str,
        initial_prompt: Optional[str] = None,
        on_segment_callback: Optional[Callable[[Dict[str, Any], float], None]] = None,
        language: Optional[str] = None,
        beam_size: Optional[int] = None,
        vad_min_silence_ms: Optional[int] = None,
    ) -> Dict[str, Any]:
        """
        Transcribes audio with code-switching support, error handling, and silence detection.
        """
        path_obj = Path(audio_path)
        if not path_obj.exists():
            raise FileNotFoundError(f"Không tìm thấy file âm thanh: {audio_path}")

        if path_obj.stat().st_size == 0:
            raise ValueError(f"File âm thanh rỗng (0 bytes): {path_obj.name}")

        if self.model is None:
            self.load_model()
        if self.model is None:
            raise RuntimeError("Mô hình nhận dạng giọng nói chưa sẵn sàng. Vui lòng kiểm tra lại trong Cài đặt.")

        # Merge user prompt with tech vocabulary prompt
        combined_prompt = DEFAULT_TECH_INITIAL_PROMPT
        if initial_prompt and initial_prompt.strip():
            combined_prompt = f"{initial_prompt.strip()}. {DEFAULT_TECH_INITIAL_PROMPT}"

        _beam = beam_size if beam_size is not None else WHISPER_BEAM_SIZE
        _silence = vad_min_silence_ms if vad_min_silence_ms is not None else WHISPER_VAD_MIN_SILENCE_MS
        _lang = language or WHISPER_LANGUAGE

        try:
            segments_gen, info = self.model.transcribe(
                audio_path,
                language=_lang,
                beam_size=_beam,
                vad_filter=True,
                vad_parameters=dict(min_silence_duration_ms=_silence),
                initial_prompt=combined_prompt,
                condition_on_previous_text=False,
                temperature=0.0,
                no_speech_threshold=0.55,
                compression_ratio_threshold=2.4,
                log_prob_threshold=-0.9,
            )
        except Exception as e:
            raise RuntimeError(f"Lỗi khi đọc file âm thanh ({path_obj.name}): {e}. Vui lòng kiểm tra định dạng file (.mp3, .wav, .m4a).")

        segments: List[Dict[str, Any]] = []
        full_text_parts: List[str] = []
        total_duration = info.duration or 1.0

        if total_duration > 7200:
            print(f"[STT Cảnh báo] File audio dài {round(total_duration/3600, 1)} giờ. Có thể mất nhiều thời gian xử lý.")

        try:
            for seg in segments_gen:
                raw_text = seg.text.strip()
                if not raw_text:
                    continue

                cleaned_text = normalize_technical_terms(raw_text)

                item = {
                    "start": round(seg.start, 2),
                    "end": round(seg.end, 2),
                    "text": cleaned_text,
                    "confidence": round(getattr(seg, "avg_logprob", 0.0), 3),
                }
                segments.append(item)
                full_text_parts.append(cleaned_text)

                if on_segment_callback:
                    progress = min(seg.end / total_duration, 1.0)
                    on_segment_callback(item, progress)
        except Exception as e:
            if not segments:
                raise RuntimeError(f"Quá trình nhận dạng bị gián đoạn: {e}")
            print(f"[STT Cảnh báo] Gặp lỗi ở cuối file audio: {e}. Vẫn giữ các đoạn đã nhận dạng.")

        full_text = " ".join(full_text_parts)

        # Silence / no speech detection
        if not full_text.strip():
            fallback_text = "(Không phát hiện thấy nội dung giọng nói rõ ràng trong đoạn ghi âm này)"
            segments = [{
                "start": 0.0,
                "end": round(total_duration, 2),
                "text": fallback_text,
                "confidence": 0.0
            }]
            full_text = fallback_text

        return {
            "duration": total_duration,
            "segments": segments,
            "full_text": full_text,
            "model_size": self.model_size,
        }


stt_engine = STTEngine()
