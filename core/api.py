# SPDX-FileCopyrightText: 2026 Open-mind Contributors
# SPDX-License-Identifier: MIT
#
# Purpose: Open-mind - Offline AI-Powered Academic Lecture Copilot.
# Distributed under the terms of the OSI-approved MIT License.

"""
Open-mind Pro — Python ↔ JavaScript API Bridge
────────────────────────────────────────────────
All public methods in this class are automatically exposed to the
JavaScript frontend via pywebview's `js_api` mechanism.

Usage from JS:
    const decks = await pywebview.api.get_decks();
    await pywebview.api.rate_card(cardId, 2);

Push events TO JavaScript:
    self._push('transcribe:segment', {segment, progress})
    // JS: window.addEventListener('omEvent', e => ...)
"""

import json
import shutil
import threading
from pathlib import Path
from typing import Optional
import webview

from core.stt_engine import stt_engine
from core.llm_engine import llm_engine
from core.rag_engine import rag_engine
from core.flashcard_srs import srs_manager
from core.export_engine import export_engine
from core.model_manager import model_manager
from core.config import DEFAULT_WHISPER_SIZE, WHISPER_DEVICE, WHISPER_COMPUTE_TYPE, DOWNLOADS_DIR
from core.database import db


class API:
    """Exposed JS API — all public methods callable from JavaScript."""

    def __init__(self):
        self._window: Optional[webview.Window] = None
        self._event_queue: list = []   # buffer events before window is ready
        self._llm_downloading: bool = False
        self._llm_cancel_requested: bool = False

    def set_window(self, window: webview.Window):
        self._window = window
        # Flush any queued events
        for event, data in self._event_queue:
            self._push(event, data)
        self._event_queue.clear()

    # ──────────────────────────────────────────────────────────────
    # Event push helper
    # ──────────────────────────────────────────────────────────────
    def _push(self, event: str, data):
        """Dispatch a CustomEvent to the JS frontend."""
        payload = json.dumps(data, ensure_ascii=False, default=str)
        js = (
            f"window.dispatchEvent(new CustomEvent('omEvent', "
            f"{{detail: {{type: {json.dumps(event)}, data: {payload}}}}}));"
        )
        if self._window:
            try:
                self._window.evaluate_js(js)
            except Exception as e:
                print(f"[API] push error ({event}): {e}")
        else:
            self._event_queue.append((event, data))

    # ──────────────────────────────────────────────────────────────
    # App startup info
    # ──────────────────────────────────────────────────────────────
    def get_app_info(self) -> dict:
        """Returns stats for the top bar."""
        stats = db.get_stats_overview()
        streak = db.get_current_streak()
        return {
            "due_today": stats.get("due_today", 0),
            "streak": streak,
            "total_cards": stats.get("total_cards", 0),
        }

    # ──────────────────────────────────────────────────────────────
    # Models
    # ──────────────────────────────────────────────────────────────
    # ──────────────────────────────────────────────────────────────
    # Models & Onboarding
    # ──────────────────────────────────────────────────────────────
    def load_models(self):
        """Non-blocking — checks and downloads Whisper STT if missing, initializes core DB & system.
        NOTE: Qwen LLM (~2.1GB) is NOT downloaded automatically at startup to keep startup fast and light.
        It is downloaded on-demand when the user chooses local mode.
        """
        def run():
            # Phase 1: STT Whisper (Essential for lecture transcription)
            try:
                if not model_manager.is_whisper_available():
                    self._push("splash:status", {"text": "Đang tải mô hình nhận diện giọng nói Whisper (~460MB)…", "phase": 1, "progress": 0.1})
                    model_manager.download_whisper_model(
                        progress_callback=lambda t, p: self._push("splash:status", {"text": t, "phase": 1, "progress": 0.1 + 0.4 * p})
                    )
                self._push("splash:status", {"text": "Đang nạp mô hình nhận diện giọng nói…", "phase": 1, "progress": 0.52})
                stt_engine.load_model(progress_callback=lambda t: self._push("splash:status", {"text": t, "phase": 1, "progress": 0.56}))
                self._push("splash:status", {"text": "Mô hình nhận diện giọng nói sẵn sàng ✓", "phase": 1, "progress": 0.6})
            except Exception as e:
                print(f"[API Error] Whisper init error: {e}")
                self._push("splash:status", {"text": f"Cảnh báo STT: {e}", "phase": 1, "progress": 0.6})

            # Phase 2: Khởi tạo hệ thống & AI
            try:
                self._push("splash:status", {"text": "Đang kiểm tra dữ liệu và hệ sinh thái học tập…", "phase": 2, "progress": 0.75})
                # Warm-up database & stats overview
                db.get_stats_overview()

                # If local model is ALREADY present and mode is local, warm it up
                import core.config as cfg
                if getattr(cfg, "AI_ENGINE_MODE", "cloud") == "local" and model_manager.is_llm_available():
                    self._push("splash:status", {"text": "Đang nạp mô hình AI cục bộ…", "phase": 2, "progress": 0.88})
                    llm_engine.load_model()
                else:
                    self._push("splash:status", {"text": "Hệ thống AI đã sẵn sàng ✓", "phase": 2, "progress": 0.95})
            except Exception as e:
                print(f"[API Error] System init error: {e}")
                self._push("splash:status", {"text": f"Khởi tạo: {e}", "phase": 2, "progress": 0.95})

            self._push("splash:status", {"text": "Khởi động hoàn tất ✓", "phase": 2, "progress": 1.0})
            self._push("splash:done", {})

        threading.Thread(target=run, daemon=True).start()
        return {"status": "started"}

    def download_local_llm(self) -> dict:
        """Starts on-demand download of Qwen 2.5 3B GGUF with progress events."""
        if model_manager.is_llm_available():
            if llm_engine.model is None:
                llm_engine.load_model()
            return {"status": "already_available", "message": "Mô hình Qwen 2.5 3B đã có sẵn trên máy."}

        if self._llm_downloading:
            return {"status": "already_downloading", "message": "Tiến trình tải mô hình đang diễn ra."}

        self._llm_downloading = True
        self._llm_cancel_requested = False

        def run():
            try:
                self._push("llm_download:start", {"status": "started"})

                def on_progress(text, pct, stats=None):
                    payload = {
                        "text": text,
                        "progress": pct,
                        "percent": round(pct * 100, 1),
                        "speed": stats.get("speed", "") if stats else "",
                        "downloaded_mb": stats.get("downloaded_mb", 0) if stats else 0,
                        "total_mb": stats.get("total_mb", 2100) if stats else 2100,
                    }
                    self._push("llm_download:progress", payload)

                ok = model_manager.download_llm_model(
                    progress_callback=on_progress,
                    cancel_check=lambda: self._llm_cancel_requested
                )

                if self._llm_cancel_requested:
                    self._push("llm_download:cancelled", {"message": "Đã hủy tải mô hình theo yêu cầu."})
                elif ok:
                    self._push("llm_download:progress", {
                        "text": "Đang nạp mô hình vào bộ nhớ…",
                        "progress": 0.98,
                        "percent": 98,
                        "speed": "",
                        "downloaded_mb": 2100,
                        "total_mb": 2100,
                    })
                    llm_engine.load_model()
                    
                    # Update active engine mode to local automatically
                    self.save_settings({"ai_engine_mode": "local"})

                    self._push("llm_download:done", {
                        "message": "✓ Đã tải và kích hoạt mô hình Qwen 2.5 3B Offline thành công!",
                        "llm_available": True,
                        "llm_loaded": llm_engine.model is not None,
                    })
                else:
                    self._push("llm_download:error", {
                        "message": "Không thể tải mô hình. Vui lòng kiểm tra kết nối mạng và thử lại."
                    })
            except Exception as e:
                print(f"[API Error] Local LLM download error: {e}")
                self._push("llm_download:error", {"message": f"Lỗi tải mô hình: {e}"})
            finally:
                self._llm_downloading = False
                self._llm_cancel_requested = False

        threading.Thread(target=run, daemon=True).start()
        return {"status": "started"}

    def cancel_local_llm_download(self) -> dict:
        """Signals cancellation of ongoing Qwen 2.5 GGUF download."""
        if self._llm_downloading:
            self._llm_cancel_requested = True
            return {"status": "cancelling", "ok": True}
        return {"status": "not_downloading", "ok": False}

    def get_model_status(self) -> dict:
        import core.config as cfg
        return {
            "whisper_ready": model_manager.is_whisper_available(),
            "whisper_loaded": stt_engine.model is not None,
            "llm_ready": model_manager.is_llm_available(),
            "llm_loaded": llm_engine.model is not None,
            "llm_downloading": self._llm_downloading,
            "ai_engine_mode": getattr(cfg, "AI_ENGINE_MODE", "cloud"),
        }

    def get_model_info(self) -> dict:
        return {
            "whisper_size": stt_engine.model_size,
            "whisper_loaded": stt_engine.model is not None,
            "llm_loaded": llm_engine.model is not None,
            "llm_available": model_manager.is_llm_available(),
            "stt_available": model_manager.is_whisper_available(),
            "llm_downloading": self._llm_downloading,
        }

    def download_youtube_audio(self, url: str) -> dict:
        """Downloads audio from a YouTube video URL using yt-dlp."""
        clean_url = (url or "").strip()
        if not clean_url:
            return {"error": "Vui lòng nhập đường dẫn URL YouTube."}
        if not ("youtube.com" in clean_url or "youtu.be" in clean_url):
            return {"error": "Đường dẫn không hợp lệ. Vui lòng nhập link YouTube (youtube.com hoặc youtu.be)."}

        def run():
            try:
                import yt_dlp
                self._push("youtube:start", {"url": clean_url})

                downloaded_file = None

                def progress_hook(d):
                    nonlocal downloaded_file
                    status = d.get("status")
                    if status == "downloading":
                        total = d.get("total_bytes") or d.get("total_bytes_estimate") or 0
                        downloaded = d.get("downloaded_bytes", 0)
                        pct = round((downloaded / total * 100), 1) if total > 0 else 0
                        speed = d.get("speed") or 0
                        speed_str = f"{speed / 1024 / 1024:.1f} MB/s" if speed > 1024 * 1024 else f"{speed / 1024:.0f} KB/s"
                        eta = d.get("eta") or 0
                        eta_str = f"{int(eta)}s" if eta else ""
                        self._push("youtube:progress", {
                            "percent": pct,
                            "speed": speed_str,
                            "eta": eta_str,
                            "text": f"Đang tải âm thanh... {pct}% ({speed_str})"
                        })
                    elif status == "finished":
                        downloaded_file = d.get("filename")
                        self._push("youtube:progress", {"percent": 100, "text": "Hoàn tất tải về, đang kiểm tra tệp..."})

                out_tmpl = str(DOWNLOADS_DIR / "%(id)s.%(ext)s")
                ydl_opts = {
                    "format": "bestaudio/best",
                    "outtmpl": out_tmpl,
                    "noplaylist": True,
                    "quiet": True,
                    "no_warnings": True,
                    "progress_hooks": [progress_hook],
                }
                if shutil.which("ffmpeg"):
                    ydl_opts["postprocessors"] = [{
                        "key": "FFmpegExtractAudio",
                        "preferredcodec": "mp3",
                        "preferredquality": "192",
                    }]

                with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                    info = ydl.extract_info(clean_url, download=True)
                    title = info.get("title", "Bài giảng YouTube")
                    duration = info.get("duration", 0)
                    video_id = info.get("id", "audio")

                    final_path = None
                    if downloaded_file and Path(downloaded_file).exists():
                        final_path = str(downloaded_file)
                    else:
                        matches = list(DOWNLOADS_DIR.glob(f"{video_id}.*"))
                        if matches:
                            for ext in [".mp3", ".m4a", ".webm", ".opus", ".wav"]:
                                f = DOWNLOADS_DIR / f"{video_id}{ext}"
                                if f.exists():
                                    final_path = str(f)
                                    break
                            if not final_path:
                                final_path = str(matches[0])

                    if not final_path:
                        self._push("youtube:error", {"message": "Không tìm thấy tệp âm thanh đã tải về."})
                        return

                    self._push("youtube:done", {
                        "audio_path": final_path,
                        "title": title,
                        "duration_sec": duration,
                    })
            except Exception as e:
                err_text = str(e)
                if "unavailable" in err_text.lower():
                    err_text = "Video không khả dụng hoặc đã bị người đăng ẩn."
                elif "private" in err_text.lower():
                    err_text = "Video ở chế độ riêng tư, không thể tải."
                self._push("youtube:error", {"message": f"Lỗi tải YouTube: {err_text}"})

        threading.Thread(target=run, daemon=True).start()
        return {"status": "started"}

    # ──────────────────────────────────────────────────────────────
    # Deck & Flashcard API
    # ──────────────────────────────────────────────────────────────
    def get_decks(self) -> list:
        return db.list_decks()

    def create_deck(self, name: str, description: str = "") -> dict:
        deck_id = db.create_deck(name.strip(), description)
        return {"id": deck_id, "name": name}

    def update_deck(self, deck_id: str, name: str, description: str = "") -> dict:
        success = db.update_deck(deck_id, name.strip(), description.strip() if description else None)
        return {"ok": success, "name": name.strip()}

    def delete_deck(self, deck_id: str) -> dict:
        db.delete_deck(deck_id)
        return {"ok": True}

    def get_lecture_flashcards(self, lecture_id: str) -> list:
        return db.get_lecture_flashcards(lecture_id)

    def get_lecture_decks(self, lecture_id: str) -> list:
        return db.get_lecture_decks(lecture_id)

    def get_due_cards(self, deck_id: str) -> list:
        return db.get_due_cards(deck_id)

    def get_all_cards(self, deck_id: str) -> list:
        return db.get_all_deck_cards_shuffled(deck_id)

    def add_card(self, deck_id: str, front: str, back: str, hint: str = "") -> dict:
        cid = db.add_flashcard(deck_id, front.strip(), back.strip(), hint.strip())
        return {"id": cid}

    def delete_card(self, card_id: str) -> dict:
        db.delete_flashcard(card_id)
        return {"ok": True}

    def rate_card(self, card_id: str, rating: int, ease_factor: float,
                  interval_days: int, repetitions: int) -> dict:
        """Apply SM-2 rating and return updated SRS values."""
        new_ef, new_interval, new_reps, next_due, state = srs_manager.calculate_next_review(
            int(rating), float(ease_factor), int(interval_days), int(repetitions)
        )
        db.update_card_srs(card_id, new_ef, new_interval, new_reps, next_due, state)
        db.log_study_session("flashcard_review", 1, 5)
        return {
            "ease_factor": new_ef,
            "interval_days": new_interval,
            "repetitions": new_reps,
            "due_date": next_due,
            "state": state,
        }

    def preview_srs(self, rating: int, ease_factor: float,
                    interval_days: int, repetitions: int) -> dict:
        """Returns predicted interval without saving."""
        _, interval, _, _, _ = srs_manager.calculate_next_review(
            int(rating), float(ease_factor), int(interval_days), int(repetitions)
        )
        return {"interval_days": interval}

    def get_deck_progress(self, deck_id: str) -> dict:
        return db.get_deck_progress(deck_id)

    # ──────────────────────────────────────────────────────────────
    # Lecture API
    # ──────────────────────────────────────────────────────────────
    def list_lectures(self, folder_tag: str = "", search: str = "") -> list:
        return db.list_lectures(folder_tag or None, search)

    def get_lecture(self, lecture_id: str) -> dict:
        return db.get_lecture(lecture_id) or {}

    def delete_lecture(self, lecture_id: str) -> dict:
        db.delete_lecture(lecture_id)
        return {"ok": True}

    def rename_lecture(self, lecture_id: str, new_title: str) -> dict:
        success = db.rename_lecture(lecture_id, new_title)
        return {"ok": success, "title": new_title.strip()}

    def pick_audio_file(self) -> str:
        """Opens native file picker dialog, returns selected path."""
        result = self._window.create_file_dialog(
            webview.FileDialog.OPEN,
            allow_multiple=False,
            file_types=("Audio Files (*.mp3;*.wav;*.m4a;*.aac;*.flac;*.ogg)",)
        )
        return result[0] if result else ""

    def pick_pdf_file(self) -> str:
        """Opens native file picker dialog for PDF/slides, returns selected path."""
        result = self._window.create_file_dialog(
            webview.FileDialog.OPEN,
            allow_multiple=False,
            file_types=("PDF Documents (*.pdf)",)
        )
        return result[0] if result else ""

    def pick_save_file(self, extension: str, description: str) -> str:
        result = self._window.create_file_dialog(
            webview.FileDialog.SAVE,
            save_filename=f"export.{extension}",
            file_types=(f"{description} (*.{extension})",)
        )
        return result if isinstance(result, str) else (result[0] if result else "")

    def get_audio_url(self, audio_path: str) -> str:
        """Returns file:// URL for HTML audio element."""
        p = Path(audio_path)
        return p.as_uri() if p.exists() else ""

    # ──────────────────────────────────────────────────────────────
    # STT — Non-blocking transcription
    # ──────────────────────────────────────────────────────────────
    def start_transcribe(self, audio_path: str, prompt: str = "", lecture_id: str = "",
                          title: str = "", folder_tag: str = "General") -> dict:
        """Non-blocking: starts transcription thread, pushes segment events, then auto-pipelines AI generation."""
        def run():
            try:
                self._push("transcribe:start", {})

                def on_segment(seg, prog):
                    self._push("transcribe:segment", {"segment": seg, "progress": prog})

                result = stt_engine.transcribe_audio(
                    audio_path,
                    initial_prompt=prompt or None,
                    on_segment_callback=on_segment
                )

                lid = db.save_lecture(
                    title=title or Path(audio_path).stem,
                    audio_path=audio_path,
                    duration_sec=result["duration"],
                    transcript=result["segments"],
                    full_text=result["full_text"],
                    folder_tag=folder_tag,
                    lecture_id=lecture_id or None
                )
                db.log_study_session("lecture_study", len(result["segments"]), int(result["duration"]))

                self._push("transcribe:done", {
                    "lecture_id": lid,
                    "segments": result["segments"],
                    "full_text": result["full_text"],
                    "duration": result["duration"],
                })

                # ─── Auto-Pipeline ───────────────────────────────────────
                self._run_auto_pipeline(lid)

            except Exception as e:
                self._push("transcribe:error", {"message": str(e)})

        threading.Thread(target=run, daemon=True).start()
        return {"status": "started"}

    def _run_auto_pipeline(self, lid: str):
        """Executes Summary, Mindmap, Quiz, and Flashcard generation sequentially."""
        import core.config as cfg
        lec_data = db.get_lecture(lid)
        if not lec_data or not cfg.AUTO_PROCESS or not lec_data.get("full_text", "").strip():
            return

        quiz_count = cfg.AUTO_PROCESS_QUIZ_COUNT
        card_count = cfg.AUTO_PROCESS_CARD_COUNT

        self._push("autopipeline:start", {
            "lecture_id": lid,
            "steps": ["Tóm tắt & Mindmap", f"Quiz ({quiz_count} câu)", f"Flashcards ({card_count} thẻ)"]
        })

        # Bước 1/3: Summary + Mindmap
        try:
            self._push("autopipeline:step", {"step": 0, "status": "running", "text": "Đang tạo Tóm tắt & Sơ đồ tư duy…"})
            summary = llm_engine.generate_hierarchical_summary(lec_data["full_text"], lec_data.get("transcript", []))
            mindmap = llm_engine.generate_mindmap(summary.get("overview", lec_data["full_text"][:3000]))
            db.save_lecture(
                title=lec_data["title"], audio_path=lec_data.get("audio_path", ""),
                transcript=lec_data.get("transcript", []), full_text=lec_data["full_text"],
                summary_data=summary, mindmap_data=mindmap,
                folder_tag=lec_data.get("folder_tag", "General"), lecture_id=lid
            )
            self._push("summary:done", {"summary": summary, "mindmap": mindmap})
            self._push("autopipeline:step", {"step": 0, "status": "done", "text": "Tóm tắt & Mindmap xong ✓"})
        except Exception as e:
            self._push("autopipeline:step", {"step": 0, "status": "error", "text": f"Lỗi tóm tắt: {e}"})

        # Bước 2/3: Quiz
        try:
            self._push("autopipeline:step", {"step": 1, "status": "running", "text": f"Đang sinh {quiz_count} câu hỏi trắc nghiệm…"})
            quiz = llm_engine.generate_quiz(lec_data["full_text"], quiz_count, "trung bình")
            if quiz:
                db.save_quiz(lid, quiz)
                self._push("quiz:done", {"quiz": quiz})
            self._push("autopipeline:step", {"step": 1, "status": "done", "text": f"{len(quiz) if quiz else 0} câu hỏi trắc nghiệm xong ✓"})
        except Exception as e:
            self._push("autopipeline:step", {"step": 1, "status": "error", "text": f"Lỗi quiz: {e}"})

        # Bước 3/3: Flashcards
        try:
            self._push("autopipeline:step", {"step": 2, "status": "running", "text": f"Đang rút trích {card_count} thẻ ghi nhớ…"})
            cards = llm_engine.generate_flashcards(lec_data["full_text"], card_count)
            if cards:
                existing_decks = db.get_lecture_decks(lid)
                if existing_decks:
                    deck_id = existing_decks[0]["id"]
                    deck_name = existing_decks[0]["name"]
                else:
                    deck_name = f"Thẻ: {lec_data['title']}"
                    deck_id = db.create_deck(deck_name, "Tự động trích xuất từ bài giảng", lid)
                db.add_flashcards_batch(deck_id, cards, lid)
                all_cards = db.get_lecture_flashcards(lid)
                self._push("flashcards:done", {
                    "count": len(cards), "deck_id": deck_id,
                    "deck_name": deck_name, "lecture_id": lid,
                    "all_cards": all_cards
                })
            self._push("autopipeline:step", {"step": 2, "status": "done", "text": f"{len(cards) if cards else 0} thẻ ghi nhớ xong ✓"})
        except Exception as e:
            self._push("autopipeline:step", {"step": 2, "status": "error", "text": f"Lỗi flashcards: {e}"})

        self._push("autopipeline:done", {"lecture_id": lid})

    def import_pdf_lecture(self, pdf_path: str, title: str = "", folder_tag: str = "General") -> dict:
        """Extracts text from PDF/slide pages, creates lecture, and runs AI Auto-Pipeline."""
        clean_path = (pdf_path or "").strip()
        if not clean_path or not Path(clean_path).exists():
            return {"error": "Tệp PDF không tồn tại hoặc đường dẫn không hợp lệ."}

        def run():
            try:
                self._push("pdf:start", {"path": clean_path})
                from pypdf import PdfReader
                reader = PdfReader(clean_path)
                total_pages = len(reader.pages)
                if total_pages == 0:
                    self._push("pdf:error", {"message": "Tệp PDF không có trang nào."})
                    return

                segments = []
                full_text_parts = []

                for idx, page in enumerate(reader.pages):
                    page_text = page.extract_text() or ""
                    cleaned_text = page_text.strip()
                    if cleaned_text:
                        segments.append({
                            "start": idx + 1,
                            "end": idx + 1,
                            "page": idx + 1,
                            "text": cleaned_text
                        })
                        full_text_parts.append(f"[Trang {idx + 1}]\n{cleaned_text}")

                    prog = round((idx + 1) / total_pages * 100, 1)
                    self._push("pdf:progress", {
                        "current": idx + 1,
                        "total": total_pages,
                        "progress": prog,
                        "text": f"Đang trích xuất trang {idx + 1}/{total_pages}…"
                    })

                full_text = "\n\n".join(full_text_parts).strip()
                if not full_text:
                    self._push("pdf:error", {"message": "Không tìm thấy nội dung văn bản trong PDF (có thể là tệp scan ảnh thuần túy)."})
                    return

                lec_title = title.strip() or Path(clean_path).stem
                duration_sec = total_pages * 60

                lid = db.save_lecture(
                    title=lec_title,
                    audio_path="",
                    duration_sec=duration_sec,
                    transcript=segments,
                    full_text=full_text,
                    folder_tag=folder_tag or "General"
                )
                db.log_study_session("pdf_study", len(segments), duration_sec)

                self._push("pdf:done", {
                    "lecture_id": lid,
                    "title": lec_title,
                    "total_pages": total_pages,
                    "segments": segments,
                    "full_text": full_text
                })

                # Tự động chạy chuỗi tóm tắt, mindmap, quiz, flashcards
                self._run_auto_pipeline(lid)

            except Exception as e:
                self._push("pdf:error", {"message": f"Lỗi xử lý PDF: {e}"})

        threading.Thread(target=run, daemon=True).start()
        return {"status": "started"}

    # ──────────────────────────────────────────────────────────────
    # LLM — Non-blocking generation
    # ──────────────────────────────────────────────────────────────
    def generate_summary(self, lecture_id: str) -> dict:
        def run():
            try:
                lec = db.get_lecture(lecture_id)
                if not lec:
                    self._push("summary:error", {"message": "Không tìm thấy dữ liệu bài giảng trong thư viện."})
                    return

                if not lec.get("full_text", "").strip():
                    self._push("summary:error", {"message": "Nội dung bài giảng đang rỗng. Hãy thực hiện chuyển đổi giọng nói trước."})
                    return

                self._push("llm:status", {"text": "Đang tạo tóm tắt phân cấp bằng AI…"})
                summary = llm_engine.generate_hierarchical_summary(lec["full_text"], lec.get("transcript", []))
                
                self._push("llm:status", {"text": "Đang xây dựng sơ đồ tư duy (Mindmap)…"})
                mindmap = llm_engine.generate_mindmap(summary.get("overview", lec["full_text"][:3000]))

                db.save_lecture(
                    title=lec["title"], audio_path=lec.get("audio_path", ""),
                    transcript=lec.get("transcript", []), full_text=lec["full_text"],
                    summary_data=summary, mindmap_data=mindmap,
                    folder_tag=lec.get("folder_tag", "General"), lecture_id=lecture_id
                )
                self._push("summary:done", {"summary": summary, "mindmap": mindmap})
            except Exception as e:
                self._push("summary:error", {"message": f"Không thể tóm tắt: {e}"})

        threading.Thread(target=run, daemon=True).start()
        return {"status": "started"}

    def generate_quiz(self, lecture_id: str, num_questions: int = 5, difficulty: str = "trung bình") -> dict:
        def run():
            try:
                lec = db.get_lecture(lecture_id)
                if not lec:
                    self._push("quiz:error", {"message": "Không tìm thấy dữ liệu bài giảng."})
                    return

                if not lec.get("full_text", "").strip():
                    self._push("quiz:error", {"message": "Bài giảng chưa có nội dung văn bản để tạo câu hỏi."})
                    return

                def handle_progress(msg: str):
                    self._push("llm:status", {"text": msg})

                self._push("llm:status", {"text": f"Đang sinh {num_questions} câu hỏi trắc nghiệm ({difficulty})…"})
                quiz = llm_engine.generate_quiz(lec["full_text"], int(num_questions), difficulty, on_progress=handle_progress)
                if quiz:
                    db.save_quiz(lecture_id, quiz)
                    self._push("quiz:done", {"quiz": quiz})
                else:
                    self._push("quiz:error", {"message": "AI không trích xuất được câu hỏi phù hợp. Hãy thử lại hoặc kiểm tra độ dài bài giảng."})
            except Exception as e:
                self._push("quiz:error", {"message": f"Lỗi sinh trắc nghiệm: {e}"})

        threading.Thread(target=run, daemon=True).start()
        return {"status": "started"}

    def save_quiz(self, lecture_id: str, quiz: list) -> dict:
        db.save_quiz(lecture_id, quiz)
        return {"ok": True}

    def generate_flashcards(self, lecture_id: str, num_cards: int = 8) -> dict:
        def run():
            try:
                lec = db.get_lecture(lecture_id)
                if not lec:
                    self._push("flashcards:error", {"message": "Không tìm thấy bài giảng."})
                    return

                if not lec.get("full_text", "").strip():
                    self._push("flashcards:error", {"message": "Bài giảng chưa có nội dung văn bản để rút trích thẻ."})
                    return

                def handle_progress(msg: str):
                    self._push("llm:status", {"text": msg})

                self._push("llm:status", {"text": f"Đang rút trích {num_cards} thẻ ghi nhớ flashcards…"})
                cards = llm_engine.generate_flashcards(lec["full_text"], int(num_cards), on_progress=handle_progress)
                if cards:
                    existing_decks = db.get_lecture_decks(lecture_id)
                    if existing_decks:
                        deck_id = existing_decks[0]["id"]
                        deck_name = existing_decks[0]["name"]
                    else:
                        deck_name = f"Thẻ: {lec['title']}"
                        deck_id = db.create_deck(deck_name, "Tự động trích xuất từ bài giảng", lecture_id)
                    db.add_flashcards_batch(deck_id, cards, lecture_id)
                    all_cards = db.get_lecture_flashcards(lecture_id)
                    self._push("flashcards:done", {
                        "count": len(cards),
                        "deck_id": deck_id,
                        "deck_name": deck_name,
                        "lecture_id": lecture_id,
                        "all_cards": all_cards
                    })
                else:
                    self._push("flashcards:error", {"message": "Không trích xuất được thẻ hợp lệ từ bài giảng này."})
            except Exception as e:
                self._push("flashcards:error", {"message": f"Lỗi tạo thẻ: {e}"})

        threading.Thread(target=run, daemon=True).start()
        return {"status": "started"}

    def ask_rag(self, question: str, lecture_id: str) -> dict:
        def run():
            try:
                lec = db.get_lecture(lecture_id)
                if not lec:
                    self._push("rag:error", {"message": "Không tìm thấy bài giảng để tra cứu."})
                    return

                history = lec.get("chat_history", [])
                self._push("llm:status", {"text": "Đang tra cứu và đối chiếu ngữ cảnh bài giảng…"})
                result = rag_engine.ask_question(
                    question,
                    lec.get("transcript", []),
                    lec.get("full_text", ""),
                    history=history
                )

                # Tự động lưu lịch sử hội thoại vào database
                db.save_chat_message(lecture_id, "user", question)
                updated_history = db.save_chat_message(lecture_id, "ai", result["answer"], result.get("citations", []))

                self._push("rag:done", {
                    "answer": result["answer"],
                    "citations": result.get("citations", []),
                    "chat_history": updated_history
                })
            except Exception as e:
                self._push("rag:error", {"message": f"Lỗi tra cứu AI: {e}"})

        threading.Thread(target=run, daemon=True).start()
        return {"status": "started"}

    def clear_chat_history(self, lecture_id: str) -> dict:
        """Xóa toàn bộ lịch sử hội thoại của bài giảng."""
        if not lecture_id:
            return {"error": "Thiếu lecture_id"}
        db.clear_chat_history(lecture_id)
        return {"ok": True}

    def save_lecture_note(self, lecture_id: str, note_id: Optional[str],
                          timestamp_sec: float, text: str) -> dict:
        """Lưu hoặc cập nhật ghi chú gắn mốc thời gian của bài giảng."""
        if not lecture_id or not text or not text.strip():
            return {"error": "Nội dung ghi chú không được để trống."}
        notes = db.save_lecture_note(lecture_id, note_id, float(timestamp_sec), text.strip())
        return {"ok": True, "notes": notes}

    def delete_lecture_note(self, lecture_id: str, note_id: str) -> dict:
        """Xóa một ghi chú của bài giảng."""
        if not lecture_id or not note_id:
            return {"error": "Thiếu thông tin bài giảng hoặc ghi chú."}
        notes = db.delete_lecture_note(lecture_id, note_id)
        return {"ok": True, "notes": notes}

    def save_quiz_result(self, lecture_id: str, score: int, total: int,
                         difficulty: str, details: list) -> dict:
        db.save_quiz_attempt(lecture_id, score, total, difficulty, details)
        db.log_study_session("quiz", total, 120)
        return {"ok": True}

    # ──────────────────────────────────────────────────────────────
    # Stats
    # ──────────────────────────────────────────────────────────────
    def get_stats(self) -> dict:
        stats = db.get_stats_overview()
        streak = db.get_current_streak()
        stats["streak"] = streak
        return stats

    def search_all_lectures(self, query: str) -> list:
        """Full-text search across all lectures (title + transcript content)."""
        if not query or not query.strip():
            return []
        return db.search_lectures_fts(query.strip())

    # ──────────────────────────────────────────────────────────────
    # Export
    # ──────────────────────────────────────────────────────────────
    def export_txt(self, lecture_id: str) -> dict:
        lec = db.get_lecture(lecture_id)
        if not lec:
            return {"error": "Không tìm thấy"}
        path = self.pick_save_file("txt", "Text Files")
        if not path:
            return {"cancelled": True}
        export_engine.export_txt(path, lec.get("full_text", ""))
        return {"path": path}

    def export_html(self, lecture_id: str) -> dict:
        lec = db.get_lecture(lecture_id)
        if not lec:
            return {"error": "Không tìm thấy"}
        path = self.pick_save_file("html", "HTML Report")
        if not path:
            return {"cancelled": True}
        export_engine.export_html_report(path, {
            "title": lec["title"],
            "summary": lec.get("summary", {}),
            "transcript": lec.get("transcript", []),
            "notes": lec.get("notes", [])
        })
        return {"path": path}

    def export_json(self, lecture_id: str) -> dict:
        lec = db.get_lecture(lecture_id)
        if not lec:
            return {"error": "Không tìm thấy"}
        path = self.pick_save_file("json", "JSON Files")
        if not path:
            return {"cancelled": True}
        export_engine.export_json(path, {
            "title": lec["title"],
            "summary": lec.get("summary", {}),
            "mindmap": lec.get("mindmap", {}),
            "transcript": lec.get("transcript", []),
            "notes": lec.get("notes", [])
        })
        return {"path": path}

    def export_apkg(self, lecture_id: str) -> dict:
        """Exports all flashcards from a lecture into native Anki .apkg package."""
        lec = db.get_lecture(lecture_id)
        if not lec:
            return {"error": "Không tìm thấy bài giảng"}
        cards = db.get_lecture_flashcards(lecture_id)
        if not cards:
            return {"error": "Bài giảng chưa có thẻ ghi nhớ flashcard nào để xuất."}
        path = self.pick_save_file("apkg", "Anki Deck Package")
        if not path:
            return {"cancelled": True}
        deck_name = f"OpenMind - {lec['title']}"
        success = export_engine.export_anki_apkg(path, cards, deck_name)
        return {"path": path, "ok": success}

    def export_deck_apkg(self, deck_id: str) -> dict:
        """Exports a standalone deck into native Anki .apkg package."""
        deck = db.get_deck(deck_id)
        if not deck:
            return {"error": "Không tìm thấy bộ thẻ"}
        cards = db.get_all_deck_cards_shuffled(deck_id)
        if not cards:
            return {"error": "Bộ thẻ chưa có thẻ nào để xuất."}
        path = self.pick_save_file("apkg", "Anki Deck Package")
        if not path:
            return {"cancelled": True}
        deck_name = f"OpenMind - {deck['name']}"
        success = export_engine.export_anki_apkg(path, cards, deck_name)
        return {"path": path, "ok": success}

    # ──────────────────────────────────────────────────────────────
    # Settings & Hybrid Engine
    # ──────────────────────────────────────────────────────────────
    def get_settings(self) -> dict:
        import core.config as cfg
        return {
            "whisper_size": cfg.DEFAULT_WHISPER_SIZE,
            "whisper_device": cfg.WHISPER_DEVICE,
            "whisper_compute_type": cfg.WHISPER_COMPUTE_TYPE,
            "whisper_models": cfg.WHISPER_MODELS_METADATA,
            "llm_threads": cfg.LLM_THREADS,
            "llm_context": cfg.LLM_CONTEXT_SIZE,
            "whisper_model_loaded": stt_engine.model is not None,
            "llm_model_loaded": llm_engine.model is not None,
            "llm_available": model_manager.is_llm_available(),
            "whisper_available": model_manager.is_whisper_available(),
            "llm_downloading": self._llm_downloading,
            # Hybrid Engine fields
            "ai_engine_mode": getattr(cfg, "AI_ENGINE_MODE", "cloud"),
            "cloud_provider": getattr(cfg, "CLOUD_PROVIDER", "gemini"),
            "gemini_api_key": getattr(cfg, "GEMINI_API_KEY", "") or getattr(cfg, "DEFAULT_GEMINI_API_KEY", ""),
            "gemini_model": getattr(cfg, "GEMINI_MODEL", "gemini-1.5-flash"),
            "openai_api_key": getattr(cfg, "OPENAI_API_KEY", ""),
            "openai_base_url": getattr(cfg, "OPENAI_BASE_URL", "https://api.openai.com/v1"),
            "openai_model": getattr(cfg, "OPENAI_MODEL", "gpt-4o-mini"),
            # Auto-Pipeline
            "auto_process": getattr(cfg, "AUTO_PROCESS", True),
            "auto_process_quiz_count": getattr(cfg, "AUTO_PROCESS_QUIZ_COUNT", 5),
            "auto_process_card_count": getattr(cfg, "AUTO_PROCESS_CARD_COUNT", 10),
        }

    def save_settings(self, new_settings: dict) -> dict:
        import json
        from core.config import SETTINGS_PATH, reload_hybrid_settings
        try:
            # Đọc cấu hình cũ nếu có để merge
            current_settings = {}
            if SETTINGS_PATH.exists():
                try:
                    with open(SETTINGS_PATH, "r", encoding="utf-8") as f:
                        current_settings = json.load(f)
                except Exception:
                    pass

            current_settings.update(new_settings)

            with open(SETTINGS_PATH, "w", encoding="utf-8") as f:
                json.dump(current_settings, f, indent=4, ensure_ascii=False)

            # Hot update hybrid settings in memory
            reload_hybrid_settings(current_settings)

            # Hot update STT engine model size if changed
            if "whisper_size" in new_settings:
                stt_engine.model_size = new_settings["whisper_size"]

            # Push event to JS frontend to notify engine change
            self._push("settings:updated", {
                "ai_engine_mode": current_settings.get("ai_engine_mode", "local"),
                "cloud_provider": current_settings.get("cloud_provider", "gemini")
            })

            return {"ok": True}
        except Exception as e:
            return {"error": str(e)}

    def test_cloud_connection(self, provider: str, api_key: str,
                              model: str = "", base_url: str = "") -> dict:
        """Tests third-party API connection (Gemini or OpenAI-compatible)."""
        from core.cloud_client import cloud_client
        return cloud_client.test_connection(
            provider=provider.strip().lower(),
            api_key=api_key.strip(),
            model=model.strip() if model else None,
            base_url=base_url.strip() if base_url else None,
        )

    def seed_demo_data(self, force: bool = False) -> dict:
        try:
            from core.demo_seeder import seed_demo_data
            return seed_demo_data(force=force)
        except Exception as e:
            return {"success": False, "message": f"Lỗi nạp dữ liệu: {e}"}


api = API()
