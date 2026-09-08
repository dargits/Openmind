import unittest
import os
import tempfile
from pathlib import Path
from core.database import Database
from core.flashcard_srs import srs_manager
from core.rag_engine import rag_engine
from core.export_engine import export_engine
from core.stt_engine import normalize_technical_terms

class TestCoreModules(unittest.TestCase):
    def setUp(self):
        self.temp_db = tempfile.NamedTemporaryFile(delete=False, suffix=".db")
        self.temp_db.close()
        self.db = Database(self.temp_db.name)

    def tearDown(self):
        try:
            if os.path.exists(self.temp_db.name):
                os.remove(self.temp_db.name)
        except Exception:
            pass

    def test_database_lecture_and_decks(self):
        lid = self.db.save_lecture(
            title="Bài giảng Mạng máy tính",
            audio_path="samples/test.mp3",
            duration_sec=120.5,
            transcript=[{"start": 0.0, "end": 5.0, "text": "Chào các bạn hôm nay học về TCP/IP."}],
            full_text="Chào các bạn hôm nay học về TCP/IP.",
            summary_data={"overview": "Bài học về giao thức mạng TCP/IP."},
            mindmap_data={"id": "root", "topic": "Mạng máy tính", "children": []},
            folder_tag="Network"
        )
        self.assertIsNotNone(lid)

        lectures = self.db.list_lectures()
        self.assertEqual(len(lectures), 1)
        self.assertEqual(lectures[0]["title"], "Bài giảng Mạng máy tính")

        deck_id = self.db.create_deck(name="Từ vựng Mạng", lecture_id=lid)
        self.assertIsNotNone(deck_id)

        card_id = self.db.add_flashcard(deck_id=deck_id, front="TCP là gì?", back="Transmission Control Protocol", lecture_id=lid)
        self.assertIsNotNone(card_id)

        cards = self.db.get_deck_cards(deck_id)
        self.assertEqual(len(cards), 1)
        self.assertEqual(cards[0]["front"], "TCP là gì?")

    def test_sm2_srs_calculation(self):
        # 1. Test Again (rating = 0)
        ef, interval, reps, due, state = srs_manager.calculate_next_review(0, 2.5, 5, 2)
        self.assertEqual(interval, 1)
        self.assertEqual(reps, 0)
        self.assertEqual(state, "learning")

        # 2. Test Good (rating = 2) first time
        ef, interval, reps, due, state = srs_manager.calculate_next_review(2, 2.5, 0, 0)
        self.assertEqual(interval, 1)
        self.assertEqual(reps, 1)
        self.assertEqual(state, "review")

        # 3. Test Good (rating = 2) second time
        ef, interval, reps, due, state = srs_manager.calculate_next_review(2, 2.5, 1, 1)
        self.assertEqual(interval, 6)
        self.assertEqual(reps, 2)

    def test_technical_term_normalizer(self):
        input_text = "Hôm nay chúng ta học về hàm hass và thuật toán mờ đê năm cùng cơ sở dữ liệu ét quy eo"
        normalized = normalize_technical_terms(input_text)
        self.assertIn("hash", normalized)
        self.assertIn("MD5", normalized)
        self.assertIn("SQL", normalized)

        input_net = "giao thức tê xê pê / ai pi và a pê i RESTful"
        normalized_net = normalize_technical_terms(input_net)
        self.assertIn("TCP/IP", normalized_net)
        self.assertIn("API", normalized_net)

    def test_rag_chunking_and_retrieval(self):
        segments = [
            {"start": 0.0, "end": 20.0, "text": "Hôm nay chúng ta tìm hiểu về thuật toán Sắp xếp nhanh QuickSort."},
            {"start": 21.0, "end": 50.0, "text": "QuickSort hoạt động dựa trên nguyên lý chia để trị Divide and Conquer."},
            {"start": 51.0, "end": 80.0, "text": "Độ phức tạp trung bình của QuickSort là O(n log n)."}
        ]
        chunks = rag_engine.chunk_transcript(segments, chunk_duration_sec=30.0)
        self.assertTrue(len(chunks) >= 2)

        results = rag_engine.retrieve_relevant_chunks("Độ phức tạp O(n log n)", chunks, top_k=1)
        self.assertEqual(len(results), 1)
        self.assertIn("QuickSort", results[0]["text"])

    def test_export_engine(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            txt_path = os.path.join(tmpdir, "test.txt")
            json_path = os.path.join(tmpdir, "test.json")
            csv_path = os.path.join(tmpdir, "anki.csv")
            html_path = os.path.join(tmpdir, "report.html")

            self.assertTrue(export_engine.export_txt(txt_path, "Hello world"))
            self.assertTrue(export_engine.export_json(json_path, {"test": 123}))
            self.assertTrue(export_engine.export_anki_csv(csv_path, [{"front": "Q", "back": "A"}]))
            self.assertTrue(export_engine.export_html_report(html_path, {"title": "Test Lecture"}))

    def test_streak_calculation(self):
        import datetime
        today = datetime.date.today()
        # Seed 3 consecutive days
        for i in range(3):
            d = (today - datetime.timedelta(days=i)).isoformat()
            self.db.log_study_session("flashcard_review", 5, 300)
            with self.db.get_connection() as conn:
                conn.execute("UPDATE study_sessions SET session_date = ? WHERE ROWID = (SELECT MAX(ROWID) FROM study_sessions)", (d,))
                conn.commit()

        streak = self.db.get_current_streak()
        self.assertEqual(streak, 3)

    def test_package_imports_and_shims(self):
        import core
        self.assertTrue(hasattr(core, "db"))
        self.assertTrue(hasattr(core, "api"))
        self.assertTrue(hasattr(core, "stt_engine"))
        self.assertTrue(hasattr(core, "llm_engine"))

        # Test compatibility shims
        import data.database as legacy_db
        self.assertEqual(legacy_db.db, core.db)
        import app_api as legacy_api
        self.assertEqual(legacy_api.api, core.api)


if __name__ == "__main__":
    unittest.main()
