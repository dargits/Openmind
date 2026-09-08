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
from core.config import DEFAULT_WHISPER_SIZE, WHISPER_DEVICE, WHISPER_COMPUTE_TYPE
from core.database import db


class API:
    """Exposed JS API — all public methods callable from JavaScript."""

    def __init__(self):
        self._window: Optional[webview.Window] = None
        self._event_queue: list = []   # buffer events before window is ready

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
    def load_models(self):
        """Non-blocking — checks, downloads if missing, loads STT + LLM, pushes progress events."""
        def run():
            # 1. STT Whisper
            try:
                if not model_manager.is_whisper_available():
                    self._push("splash:status", {"text": "Đang tải mô hình giọng nói Whisper…", "phase": 1, "progress": 0.1})
                    model_manager.download_whisper_model(
                        progress_callback=lambda t, p: self._push("splash:status", {"text": t, "phase": 1, "progress": 0.1 + 0.35 * p})
                    )
                self._push("splash:status", {"text": "Đang nạp mô hình giọng nói…", "phase": 1, "progress": 0.45})
                stt_engine.load_model(progress_callback=lambda t: self._push("splash:status", {"text": t, "phase": 1, "progress": 0.48}))
                self._push("splash:status", {"text": "Mô hình giọng nói sẵn sàng ✓", "phase": 1, "progress": 0.5})
            except Exception as e:
                print(f"[API Error] Whisper init error: {e}")
                self._push("splash:status", {"text": f"Cảnh báo STT: {e}", "phase": 1, "progress": 0.5})

            # 2. LLM Qwen 2.5
            try:
                if not model_manager.is_llm_available():
                    self._push("splash:status", {"text": "Đang tải mô hình AI Qwen 2.5 (~2.0GB)…", "phase": 2, "progress": 0.55})
                    model_manager.download_llm_model(
                        progress_callback=lambda t, p: self._push("splash:status", {"text": t, "phase": 2, "progress": 0.55 + 0.35 * p})
                    )
                self._push("splash:status", {"text": "Đang nạp mô hình ngôn ngữ AI…", "phase": 2, "progress": 0.92})
                llm_engine.load_model(progress_callback=lambda t: self._push("splash:status", {"text": t, "phase": 2, "progress": 0.96}))
                self._push("splash:status", {"text": "Mô hình AI sẵn sàng ✓", "phase": 2, "progress": 1.0})
            except Exception as e:
                print(f"[API Error] LLM init error: {e}")
                self._push("splash:status", {"text": f"Cảnh báo LLM: {e}", "phase": 2, "progress": 1.0})

            self._push("splash:done", {})

        threading.Thread(target=run, daemon=True).start()
        return {"status": "started"}

    def get_model_info(self) -> dict:
        return {
            "whisper_size": stt_engine.model_size,
            "whisper_loaded": stt_engine.model is not None,
            "llm_loaded": llm_engine.model is not None,
            "llm_available": llm_engine.is_model_available(),
            "stt_available": stt_engine.is_model_available(),
        }

    # ──────────────────────────────────────────────────────────────
    # Deck & Flashcard API
    # ──────────────────────────────────────────────────────────────
    def get_decks(self) -> list:
        return db.list_decks()

    def create_deck(self, name: str, description: str = "") -> dict:
        deck_id = db.create_deck(name.strip(), description)
        return {"id": deck_id, "name": name}

    def delete_deck(self, deck_id: str) -> dict:
        db.delete_deck(deck_id)
        return {"ok": True}

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

    def pick_audio_file(self) -> str:
        """Opens native file picker dialog, returns selected path."""
        result = self._window.create_file_dialog(
            webview.FileDialog.OPEN,
            allow_multiple=False,
            file_types=("Audio Files (*.mp3;*.wav;*.m4a;*.aac;*.flac;*.ogg)",)
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
        """Non-blocking: starts transcription thread, pushes segment events."""
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
            except Exception as e:
                self._push("transcribe:error", {"message": str(e)})

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

                self._push("llm:status", {"text": f"Đang sinh {num_questions} câu hỏi trắc nghiệm ({difficulty})…"})
                quiz = llm_engine.generate_quiz(lec["full_text"], int(num_questions), difficulty)
                if quiz:
                    self._push("quiz:done", {"quiz": quiz})
                else:
                    self._push("quiz:error", {"message": "AI không trích xuất được câu hỏi phù hợp. Hãy thử lại hoặc kiểm tra độ dài bài giảng."})
            except Exception as e:
                self._push("quiz:error", {"message": f"Lỗi sinh trắc nghiệm: {e}"})

        threading.Thread(target=run, daemon=True).start()
        return {"status": "started"}

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

                self._push("llm:status", {"text": f"Đang rút trích {num_cards} thẻ ghi nhớ flashcards…"})
                cards = llm_engine.generate_flashcards(lec["full_text"], int(num_cards))
                if cards:
                    deck_name = f"Thẻ: {lec['title']}"
                    deck_id = db.create_deck(deck_name, "Tự động trích xuất từ bài giảng", lecture_id)
                    db.add_flashcards_batch(deck_id, cards, lecture_id)
                    self._push("flashcards:done", {"count": len(cards), "deck_name": deck_name})
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

                self._push("llm:status", {"text": "Đang tra cứu và đối chiếu ngữ cảnh bài giảng…"})
                result = rag_engine.ask_question(question, lec.get("transcript", []), lec.get("full_text", ""))
                self._push("rag:done", {"answer": result["answer"], "citations": result["citations"]})
            except Exception as e:
                self._push("rag:error", {"message": f"Lỗi tra cứu AI: {e}"})

        threading.Thread(target=run, daemon=True).start()
        return {"status": "started"}

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
            "transcript": lec.get("transcript", [])
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
            "transcript": lec.get("transcript", [])
        })
        return {"path": path}

    # ──────────────────────────────────────────────────────────────
    # Settings
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
        }

    def save_settings(self, new_settings: dict) -> dict:
        import json
        from core.config import SETTINGS_PATH
        try:
            with open(SETTINGS_PATH, "w", encoding="utf-8") as f:
                json.dump(new_settings, f, indent=4)
            # Hot update STT engine model size if changed
            if "whisper_size" in new_settings:
                stt_engine.model_size = new_settings["whisper_size"]
            return {"ok": True}
        except Exception as e:
            return {"error": str(e)}

    def seed_demo_data(self, force: bool = False) -> dict:
        try:
            from core.demo_seeder import seed_demo_data
            return seed_demo_data(force=force)
        except Exception as e:
            return {"success": False, "message": f"Lỗi nạp dữ liệu: {e}"}


api = API()
