# SPDX-FileCopyrightText: 2026 Open-mind Contributors
# SPDX-License-Identifier: MIT
#
# Purpose: Open-mind - Offline AI-Powered Academic Lecture Copilot.
# Distributed under the terms of the OSI-approved MIT License.

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

        # Kiểm tra lưu và tải quiz của bài giảng
        sample_quiz = [
            {
                "question": "Giao thức TCP hoạt động ở tầng nào?",
                "options": ["Tầng Mạng", "Tầng Giao vận (Transport)", "Tầng Ứng dụng", "Tầng Liên kết"],
                "correct_index": 1,
                "explanation": "TCP là giao thức hướng kết nối nằm ở tầng Giao vận trong mô hình TCP/IP."
            }
        ]
        self.db.save_quiz(lid, sample_quiz)
        lec_loaded = self.db.get_lecture(lid)
        self.assertIsNotNone(lec_loaded)
        self.assertEqual(len(lec_loaded.get("quiz", [])), 1)
        self.assertEqual(lec_loaded["quiz"][0]["correct_index"], 1)
        self.assertIn("tầng Giao vận", lec_loaded["quiz"][0]["explanation"])

        # Kiểm tra đổi tên bộ flashcard
        self.assertTrue(self.db.update_deck(deck_id, "Từ vựng Mạng Nâng Cao", "Mô tả mới"))
        decks = self.db.list_decks()
        self.assertEqual(decks[0]["name"], "Từ vựng Mạng Nâng Cao")
        self.assertEqual(decks[0]["lecture_title"], "Bài giảng Mạng máy tính")

        # Kiểm tra truy vấn decks và flashcards theo bài giảng
        lec_decks = self.db.get_lecture_decks(lid)
        self.assertEqual(len(lec_decks), 1)
        self.assertEqual(lec_decks[0]["id"], deck_id)

        lec_cards = self.db.get_lecture_flashcards(lid)
        self.assertEqual(len(lec_cards), 1)
        self.assertEqual(lec_cards[0]["deck_name"], "Từ vựng Mạng Nâng Cao")

        # Kiểm tra list_lectures trả về đầy đủ chỉ số học tập
        lectures_stats = self.db.list_lectures()
        self.assertEqual(lectures_stats[0]["quiz_count"], 1)
        self.assertEqual(lectures_stats[0]["flashcard_count"], 1)
        self.assertEqual(lectures_stats[0]["deck_count"], 1)
        self.assertEqual(lectures_stats[0]["has_summary"], 1)
        # Kiểm tra đổi tên bài giảng
        self.assertTrue(self.db.rename_lecture(lid, "Bài giảng Mạng máy tính & Internet"))
        lec_renamed = self.db.get_lecture(lid)
        self.assertEqual(lec_renamed["title"], "Bài giảng Mạng máy tính & Internet")

        # Kiểm tra xóa bài giảng dọn dẹp sạch sẽ dữ liệu liên đới
        self.db.delete_lecture(lid)
        self.assertEqual(len(self.db.list_lectures()), 0)
        self.assertEqual(len(self.db.get_lecture_decks(lid)), 0)
        self.assertEqual(len(self.db.get_lecture_flashcards(lid)), 0)

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

    def test_package_imports(self):
        import core
        self.assertTrue(hasattr(core, "db"))
        self.assertTrue(hasattr(core, "api"))
        self.assertTrue(hasattr(core, "stt_engine"))
        self.assertTrue(hasattr(core, "llm_engine"))
        self.assertTrue(hasattr(core, "seed_demo_data"))

    def test_transcript_pruner(self):
        from core.llm_engine import TranscriptPruner

        raw_lecture = (
            "DNS server, hệ thống tên miền, hoạt động như thế nào. "
            "Trong thế giới mạng internet, các máy tính sử dụng các con số như là địa chỉ IP. "
            "Máy chủ DNS cung cấp dịch vụ phân giải tên miền tương ứng với địa chỉ IP. "
            "Khi bạn nhập Yahoo.com, yêu cầu được gửi tới Resolver Server, rồi chuyển tiếp lên DNS Root Server và Authoritative Name Server. "
            "Tôi rất muốn được chia sẻ về nhiều kiến thức khác nhau. "
            "Hãy nhấn vào các video xuất hiện trên màn hình hiện tại và tôi sẽ gặp bạn ở đó. "
            "Xin cảm ơn vì đã xem đoạn phim này. "
            "Và nếu thấy thông tin hữu ích thì vui lòng nhấn thích và đăng ký ở bên dưới, nhằm khuyến khích kênh tạo thêm nhiều phim khác."
        )

        pruned = TranscriptPruner.prune_transcript(raw_lecture)

        # Đảm bảo toàn bộ kiến thức kỹ thuật được giữ lại
        self.assertIn("DNS server", pruned)
        self.assertIn("địa chỉ IP", pruned)
        self.assertIn("Resolver Server", pruned)
        self.assertIn("DNS Root Server", pruned)
        self.assertIn("Authoritative Name Server", pruned)

        # Đảm bảo các câu CTA/Outro bị loại bỏ hoàn toàn
        self.assertNotIn("nhấn thích và đăng ký", pruned)
        self.assertNotIn("khuyến khích kênh", pruned)
        self.assertNotIn("video xuất hiện trên màn hình", pruned)
        self.assertNotIn("Xin cảm ơn vì đã xem", pruned)

    def test_quiz_and_flashcard_quality_and_count(self):
        from core.llm_engine import LLMEngine
        engine = LLMEngine()

        # 1. Test _sanitize_quiz_item
        raw_item = {
            "question": "nó thực hiện chức năng gì trong tầng Giao vận?",
            "options": ["A. A. Định tuyến gói tin", "B. Truyền dữ liệu tin cậy", "C. Mã hóa dữ liệu"],
            "correct_index": "1",
            "explanation": "TCP là giao thức hướng kết nối đảm bảo độ tin cậy."
        }
        clean = engine._sanitize_quiz_item(raw_item, fallback_idx=0)
        self.assertIsNotNone(clean)
        self.assertFalse(clean["question"].lower().startswith("nó"))
        self.assertEqual(len(clean["options"]), 4)
        self.assertTrue(clean["options"][0].startswith("A. Định tuyến"))
        self.assertEqual(clean["correct_index"], 1)
        self.assertIn("tin cậy", clean["explanation"])

        # 2. Test _sanitize_flashcard_item
        raw_card = {
            "front": "1. nó là gì trong hệ thống mạng?",
            "back": "Đáp án: Giao thức truyền thông tin cậy",
            "hint": "3-way handshake"
        }
        clean_card = engine._sanitize_flashcard_item(raw_card)
        self.assertIsNotNone(clean_card)
        self.assertFalse(clean_card["front"].startswith("1."))
        self.assertFalse("nó" in clean_card["front"].lower().split()[:2])
        self.assertFalse(clean_card["back"].startswith("Đáp án:"))
        self.assertEqual(clean_card["hint"], "3-way handshake")

        import json

        # 3. Test exact question count guarantee with batching simulation
        fake_responses = [
            # Batch 1: 5 questions
            json.dumps([
                {"question": f"Câu hỏi kiểm tra số {i} về giao thức mạng?", "options": ["A. Opt 1", "B. Opt 2", "C. Opt 3", "D. Opt 4"], "correct_index": i % 4, "explanation": "Giải thích chuẩn."}
                for i in range(1, 6)
            ]),
            # Batch 2: 5 questions
            json.dumps([
                {"question": f"Câu hỏi kiểm tra số {i} về giao thức mạng?", "options": ["A. Opt 1", "B. Opt 2", "C. Opt 3", "D. Opt 4"], "correct_index": i % 4, "explanation": "Giải thích chuẩn."}
                for i in range(6, 11)
            ])
        ]
        call_count = 0
        def mock_call_chat(prompt, **kwargs):
            nonlocal call_count
            resp = fake_responses[call_count % len(fake_responses)]
            call_count += 1
            return resp

        engine.call_chat = mock_call_chat

        # Yêu cầu đúng 10 câu hỏi -> kết quả phải chính xác 10 câu
        quiz_10 = engine.generate_quiz("Bài giảng về mạng máy tính TCP/IP...", num_questions=10, difficulty="trung bình")
        self.assertEqual(len(quiz_10), 10)
        self.assertEqual(call_count, 2)  # 2 lượt batch 5 câu

        # Yêu cầu 5 câu hỏi -> kết quả chính xác 5 câu
        call_count = 0
        quiz_5 = engine.generate_quiz("Bài giảng về mạng máy tính TCP/IP...", num_questions=5, difficulty="dễ")
        self.assertEqual(len(quiz_5), 5)
        self.assertEqual(call_count, 1)

        # 4. Test Flashcards exact count guarantee (15 cards)
        fake_cards_resp = [
            json.dumps([{"front": f"Thuật ngữ số {i} là gì?", "back": f"Định nghĩa thuật ngữ {i}", "hint": f"Mẹo {i}"} for i in range(1, 9)]),
            json.dumps([{"front": f"Thuật ngữ số {i} là gì?", "back": f"Định nghĩa thuật ngữ {i}", "hint": f"Mẹo {i}"} for i in range(9, 16)])
        ]
        card_call_count = 0
        def mock_call_chat_cards(prompt, **kwargs):
            nonlocal card_call_count
            resp = fake_cards_resp[card_call_count % len(fake_cards_resp)]
            card_call_count += 1
            return resp
        engine.call_chat = mock_call_chat_cards

        cards_15 = engine.generate_flashcards("Bài giảng...", num_cards=15)
        self.assertEqual(len(cards_15), 15)
        self.assertEqual(card_call_count, 2)

    def test_cloud_client_and_hybrid_fallback(self):
        from unittest.mock import patch, MagicMock
        from core.cloud_client import cloud_client
        import core.config as cfg
        from core.llm_engine import llm_engine

        # 1. Test Gemini REST call formatting
        with patch("requests.post") as mock_post:
            mock_resp = MagicMock()
            mock_resp.status_code = 200
            mock_resp.json.return_value = {
                "candidates": [
                    {"content": {"parts": [{"text": "Phản hồi mẫu từ Gemini"}]}}
                ]
            }
            mock_post.return_value = mock_resp

            res = cloud_client.call_gemini("Câu hỏi kiểm tra", api_key="test_gemini_key", model="gemini-1.5-flash")
            self.assertEqual(res, "Phản hồi mẫu từ Gemini")
            self.assertIn("gemini-1.5-flash:generateContent", mock_post.call_args[0][0])
            self.assertIn("test_gemini_key", mock_post.call_args[0][0])

        # 2. Test OpenAI-compatible REST call formatting
        with patch("requests.post") as mock_post:
            mock_resp = MagicMock()
            mock_resp.status_code = 200
            mock_resp.json.return_value = {
                "choices": [
                    {"message": {"content": "Phản hồi từ OpenAI"}}
                ]
            }
            mock_post.return_value = mock_resp

            res = cloud_client.call_openai_compatible("Câu hỏi", api_key="test_openai_key", model="gpt-4o-mini")
            self.assertEqual(res, "Phản hồi từ OpenAI")
            self.assertEqual(mock_post.call_args[1]["headers"]["Authorization"], "Bearer test_openai_key")

        # 3. Test test_connection helper
        with patch("requests.post") as mock_post:
            mock_resp = MagicMock()
            mock_resp.status_code = 200
            mock_resp.json.return_value = {
                "candidates": [{"content": {"parts": [{"text": "OK"}]}}]
            }
            mock_post.return_value = mock_resp

            status = cloud_client.test_connection("gemini", "dummy_key")
            self.assertTrue(status["ok"])
            self.assertIn("thành công", status["message"].lower())

        # 3b. Test Gemini Auto-Quota Cascade (429 Rate Limit Fallback)
        with patch("requests.post") as mock_post:
            resp_429 = MagicMock()
            resp_429.status_code = 429
            resp_429.text = "RESOURCE_EXHAUSTED: Quota exceeded for gemini-3.8-flash"
            resp_429.json.return_value = {"error": {"message": "Quota exceeded", "code": 429}}

            resp_200 = MagicMock()
            resp_200.status_code = 200
            resp_200.json.return_value = {
                "choices": [{"message": {"content": "Phản hồi cứu hộ từ model tiếp theo"}}]
            }

            # Model đầu tiên gặp 429 ở cả OpenAI gateway và Native REST -> tự động nhảy sang model kế tiếp thành công 200
            mock_post.side_effect = [resp_429, resp_429, resp_429, resp_200]
            result = cloud_client.call_gemini("Test prompt", api_key="dummy_key", model="gemini-3.8-flash")
            self.assertEqual(result, "Phản hồi cứu hộ từ model tiếp theo")

        # 4. Test Hybrid Fallback: Khi bật cloud mode nhưng gặp lỗi mạng -> tự động fallback sang local
        original_mode = getattr(cfg, "AI_ENGINE_MODE", "local")
        try:
            cfg.AI_ENGINE_MODE = "cloud"
            cfg.CLOUD_PROVIDER = "gemini"
            cfg.GEMINI_API_KEY = "invalid_key"

            with patch("core.cloud_client.cloud_client.call_gemini", side_effect=RuntimeError("Mất kết nối mạng Internet")):
                # Mock hàm xử lý local của engine để kiểm tra nó có được gọi khi cloud lỗi không
                fake_local_response = "Kết quả dự phòng từ Local Model"
                original_create_chat = getattr(llm_engine, "model", None)
                mock_model = MagicMock()
                mock_model.create_chat_completion.return_value = {
                    "choices": [{"message": {"content": fake_local_response}}]
                }
                llm_engine.model = mock_model

                output = llm_engine.call_chat("Tóm tắt bài giảng này")
                self.assertEqual(output, fake_local_response)
        finally:
            cfg.AI_ENGINE_MODE = original_mode
            llm_engine.model = original_create_chat

    def test_truncated_and_markdown_json_parsing(self):
        from core.llm_engine import llm_engine

        # Case 1: Markdown code fence with inline json tag
        raw_markdown = '```json\n{"id": "root", "topic": "Mạng máy tính", "children": []}\n```'
        parsed = llm_engine._extract_json(raw_markdown)
        self.assertIsInstance(parsed, dict)
        self.assertEqual(parsed.get("topic"), "Mạng máy tính")

        # Case 2: JSON Object bị cắt ngắn giữa chừng (như trường hợp người dùng gặp phải)
        truncated_raw = (
            '```json { "overview": "Bài giảng cung cấp kiến thức toàn diện về DNS.", '
            '"key_takeaways": [ "Ý 1: Khái niệm DNS", "Ý 2: Bản ghi A và AAAA", "Ý 3: CNAME trong khi MX'
        )
        parsed_trunc = llm_engine._extract_json(truncated_raw)
        self.assertIsNotNone(parsed_trunc)
        self.assertIn("overview", parsed_trunc)
        self.assertEqual(parsed_trunc["overview"], "Bài giảng cung cấp kiến thức toàn diện về DNS.")
        self.assertIn("key_takeaways", parsed_trunc)
        self.assertTrue(len(parsed_trunc["key_takeaways"]) >= 2)

        # Case 3: Test generate_hierarchical_summary với chuỗi bị cắt ngắn
        llm_engine.call_chat = lambda prompt, **kw: truncated_raw
        summary = llm_engine.generate_hierarchical_summary("Văn bản bài giảng bất kỳ...")
        self.assertIsInstance(summary, dict)
        self.assertIn("DNS", summary["overview"])
        self.assertNotIn("```json", summary["overview"])
        self.assertNotIn('{"overview":', summary["overview"])
        self.assertTrue(len(summary["key_takeaways"]) >= 2)


    def test_p1_features(self):
        """Tests for P1 features: YouTube URL validation, Inline Notes and Multi-turn Chat."""
        from core.api import API
        import uuid

        # 1. YouTube URL validation
        api = API()
        self.assertIn("error", api.download_youtube_audio(""))
        self.assertIn("error", api.download_youtube_audio("https://facebook.com/video"))

        # 2. Database Inline Notes
        lid = "p1_test_" + uuid.uuid4().hex[:6]
        self.db.save_lecture(title="Test P1", lecture_id=lid, full_text="Nội dung bài giảng")
        notes = self.db.save_lecture_note(lid, None, 20.0, "Ghi chú mốc 20s")
        notes = self.db.save_lecture_note(lid, None, 5.0, "Ghi chú mốc 5s")
        self.assertEqual(len(notes), 2)
        self.assertEqual(notes[0]["timestamp_sec"], 5.0)
        self.assertEqual(notes[1]["timestamp_sec"], 20.0)

        # Delete note
        notes = self.db.delete_lecture_note(lid, notes[0]["id"])
        self.assertEqual(len(notes), 1)
        self.assertEqual(notes[0]["timestamp_sec"], 20.0)

        # 3. Multi-turn Chat History
        chat = self.db.save_chat_message(lid, "user", "Câu hỏi 1")
        chat = self.db.save_chat_message(lid, "ai", "Trả lời 1", citations=[{"start": 20.0}])
        self.assertEqual(len(chat), 2)
        self.assertEqual(chat[1]["role"], "ai")

        retrieved = self.db.get_chat_history(lid)
        self.assertEqual(len(retrieved), 2)

        self.db.clear_chat_history(lid)
        self.assertEqual(len(self.db.get_chat_history(lid)), 0)

        # 4. RAG ask_question with history
        from core.rag_engine import rag_engine
        history = [
            {"role": "user", "content": "Thuật ngữ TCP là gì?"},
            {"role": "ai", "content": "TCP là giao thức hướng kết nối."}
        ]
        # Test mock ask_question handles history without error
        original_call_chat = rag_engine.llm_engine.call_chat if hasattr(rag_engine, 'llm_engine') else None
        try:
            from core.llm_engine import llm_engine
            llm_engine.call_chat = lambda prompt, **kwargs: f"Mock response with {len(kwargs.get('history') or [])} turns"
            res = rag_engine.ask_question("Giải thích thêm", segments=[{"start": 0.0, "end": 10.0, "text": "TCP hoạt động ở tầng giao vận"}], history=history)
            self.assertIn("Mock response", res["answer"])
        finally:
            pass

        self.db.delete_lecture(lid)

    def test_ebbinghaus_retention_and_calendar_stats(self):
        # Tạo thẻ với các ngày ôn tập khác nhau
        deck_id = self.db.create_deck("Deck SRS Stats")
        from datetime import date, timedelta
        today = date.today()

        # Thẻ due hôm nay
        c1 = self.db.add_flashcard(deck_id, "F1", "B1")
        self.db.update_card_srs(c1, ease_factor=2.6, interval_days=3, repetitions=2, due_date=today.isoformat(), state="review")

        # Thẻ due ngày mai
        c2 = self.db.add_flashcard(deck_id, "F2", "B2")
        tomorrow = (today + timedelta(days=1)).isoformat()
        self.db.update_card_srs(c2, ease_factor=2.4, interval_days=5, repetitions=3, due_date=tomorrow, state="review")

        # Gọi get_retention_and_calendar_stats
        stats = self.db.get_retention_and_calendar_stats()
        self.assertIn("forecast_7days", stats)
        self.assertIn("forgetting_curve", stats)

        forecast = stats["forecast_7days"]
        self.assertEqual(len(forecast), 7)
        self.assertTrue(forecast[0]["is_today"])
        self.assertGreaterEqual(forecast[0]["count"], 1)

        curve = stats["forgetting_curve"]
        self.assertIn("strength_days", curve)
        self.assertIn("points", curve)
        self.assertEqual(len(curve["points"]), 10)
        # Điểm ngày 0 phải là 100%
        self.assertEqual(curve["points"][0]["retention"], 100.0)
        # Điểm ngày 30 phải nhỏ hơn ngày 0
        self.assertLess(curve["points"][-1]["retention"], curve["points"][0]["retention"])

        # Kiểm tra get_stats_overview bao gồm các trường này
        overview = self.db.get_stats_overview()
        self.assertIn("forecast_7days", overview)
        self.assertIn("forgetting_curve", overview)

    def test_anki_apkg_and_html_notes_export(self):
        from core.export_engine import export_engine
        flashcards = [
            {"front": "CPU là gì?", "back": "Central Processing Unit", "hint": "Bộ não máy tính"},
            {"front": "RAM là gì?", "back": "Random Access Memory", "hint": "Bộ nhớ tạm thời"}
        ]
        with tempfile.NamedTemporaryFile(delete=False, suffix=".apkg") as f:
            apkg_path = f.name

        try:
            ok = export_engine.export_anki_apkg(apkg_path, flashcards, "Kiến trúc máy tính")
            self.assertTrue(ok)
            self.assertTrue(os.path.exists(apkg_path))
            self.assertGreater(os.path.getsize(apkg_path), 0)
        finally:
            if os.path.exists(apkg_path):
                os.remove(apkg_path)

        # Test HTML report with personal notes
        with tempfile.NamedTemporaryFile(delete=False, suffix=".html") as f:
            html_path = f.name

        try:
            lecture_data = {
                "title": "Kiến trúc máy tính",
                "summary": {"overview": "Tổng quan về CPU và RAM"},
                "transcript": [{"start": 10.0, "end": 20.0, "text": "CPU thực thi các chỉ lệnh"}],
                "notes": [{"timestamp_sec": 15.0, "text": "Thầy nhấn mạnh phần ALU và thanh ghi"}]
            }
            export_engine.export_html_report(html_path, lecture_data)
            with open(html_path, "r", encoding="utf-8") as f:
                content = f.read()
            self.assertIn("Ghi chú cá nhân", content)
            self.assertIn("Thầy nhấn mạnh phần ALU", content)
        finally:
            if os.path.exists(html_path):
                os.remove(html_path)

    def test_pdf_segment_structure(self):
        # Giả lập import lecture từ PDF
        segments = [
            {"start": 1, "end": 1, "page": 1, "text": "Slide 1: Giới thiệu môn học"},
            {"start": 2, "end": 2, "page": 2, "text": "Slide 2: Chương trình và tài liệu"}
        ]
        full_text = "[Trang 1]\nSlide 1: Giới thiệu môn học\n\n[Trang 2]\nSlide 2: Chương trình và tài liệu"
        lid = self.db.save_lecture(
            title="Slide Mon Hoc",
            audio_path="",
            duration_sec=120,
            transcript=segments,
            full_text=full_text,
            folder_tag="CNTT"
        )
        self.assertIsNotNone(lid)

        lec = self.db.get_lecture(lid)
        self.assertEqual(len(lec["transcript"]), 2)
        self.assertEqual(lec["transcript"][0]["page"], 1)
        self.assertEqual(lec["audio_path"], "")
        self.db.delete_lecture(lid)


if __name__ == "__main__":
    unittest.main()


