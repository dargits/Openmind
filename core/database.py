import sqlite3
import json
import uuid
from datetime import datetime, date, timedelta
from typing import List, Dict, Any, Optional
from core.config import DB_PATH


class Database:
    def __init__(self, db_path=None):
        self.db_path = str(db_path or DB_PATH)
        self._init_db()

    def get_connection(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path, check_same_thread=False)
        conn.row_factory = sqlite3.Row
        # Performance tuning
        conn.execute("PRAGMA journal_mode = WAL;")      # Write-Ahead Logging: faster concurrent writes
        conn.execute("PRAGMA synchronous = NORMAL;")    # Balance durability vs speed
        conn.execute("PRAGMA cache_size = -8000;")      # 8MB page cache
        conn.execute("PRAGMA foreign_keys = ON;")
        return conn

    def _init_db(self):
        with self.get_connection() as conn:
            cursor = conn.cursor()

            # Lectures table
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS lectures (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                audio_path TEXT,
                duration_sec REAL DEFAULT 0,
                transcript_json TEXT,
                full_text TEXT,
                summary_json TEXT,
                mindmap_json TEXT,
                folder_tag TEXT DEFAULT 'General',
                quiz_json TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            """)

            # Tự động migration thêm cột quiz_json nếu database cũ chưa có
            try:
                cursor.execute("ALTER TABLE lectures ADD COLUMN quiz_json TEXT;")
            except Exception:
                pass

            # Decks table
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS decks (
                id TEXT PRIMARY KEY,
                lecture_id TEXT REFERENCES lectures(id) ON DELETE SET NULL,
                name TEXT NOT NULL,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            """)

            # Flashcards table (SM-2 attributes)
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS flashcards (
                id TEXT PRIMARY KEY,
                deck_id TEXT NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
                lecture_id TEXT REFERENCES lectures(id) ON DELETE SET NULL,
                front TEXT NOT NULL,
                back TEXT NOT NULL,
                hint TEXT,
                ease_factor REAL DEFAULT 2.5,
                interval_days INTEGER DEFAULT 0,
                repetitions INTEGER DEFAULT 0,
                due_date DATE NOT NULL,
                state TEXT DEFAULT 'new',
                last_reviewed TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            """)

            # Quiz Attempts table
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS quiz_attempts (
                id TEXT PRIMARY KEY,
                lecture_id TEXT REFERENCES lectures(id) ON DELETE CASCADE,
                score INTEGER NOT NULL,
                total_questions INTEGER NOT NULL,
                difficulty TEXT DEFAULT 'medium',
                details_json TEXT,
                completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            """)

            # Study Sessions table
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS study_sessions (
                id TEXT PRIMARY KEY,
                session_type TEXT NOT NULL,
                items_count INTEGER DEFAULT 0,
                duration_sec INTEGER DEFAULT 0,
                session_date DATE DEFAULT (DATE('now')),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            """)

            # Performance indexes
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_flashcards_due ON flashcards(due_date);")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_flashcards_deck ON flashcards(deck_id);")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_sessions_date ON study_sessions(session_date);")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_lectures_tag ON lectures(folder_tag);")
            conn.commit()

    # ==================== LECTURE CRUD ====================
    def save_lecture(self, title: str, audio_path: str = "", duration_sec: float = 0,
                     transcript: Optional[List[Dict[str, Any]]] = None, full_text: str = "",
                     summary_data: Optional[Dict[str, Any]] = None, mindmap_data: Optional[Dict[str, Any]] = None,
                     folder_tag: str = "General", lecture_id: Optional[str] = None,
                     quiz_data: Optional[List[Dict[str, Any]]] = None) -> str:
        lid = lecture_id or str(uuid.uuid4())
        transcript_str = json.dumps(transcript or [], ensure_ascii=False)
        summary_str = json.dumps(summary_data or {}, ensure_ascii=False)
        mindmap_str = json.dumps(mindmap_data or {}, ensure_ascii=False)

        with self.get_connection() as conn:
            cursor = conn.cursor()
            if quiz_data is not None:
                quiz_str = json.dumps(quiz_data, ensure_ascii=False)
                cursor.execute("""
                INSERT INTO lectures (id, title, audio_path, duration_sec, transcript_json, full_text, summary_json, mindmap_json, folder_tag, quiz_json)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET
                    title=excluded.title,
                    audio_path=excluded.audio_path,
                    duration_sec=excluded.duration_sec,
                    transcript_json=excluded.transcript_json,
                    full_text=excluded.full_text,
                    summary_json=excluded.summary_json,
                    mindmap_json=excluded.mindmap_json,
                    folder_tag=excluded.folder_tag,
                    quiz_json=excluded.quiz_json;
                """, (lid, title, audio_path, duration_sec, transcript_str, full_text, summary_str, mindmap_str, folder_tag, quiz_str))
            else:
                cursor.execute("""
                INSERT INTO lectures (id, title, audio_path, duration_sec, transcript_json, full_text, summary_json, mindmap_json, folder_tag)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET
                    title=excluded.title,
                    audio_path=excluded.audio_path,
                    duration_sec=excluded.duration_sec,
                    transcript_json=excluded.transcript_json,
                    full_text=excluded.full_text,
                    summary_json=excluded.summary_json,
                    mindmap_json=excluded.mindmap_json,
                    folder_tag=excluded.folder_tag;
                """, (lid, title, audio_path, duration_sec, transcript_str, full_text, summary_str, mindmap_str, folder_tag))
            conn.commit()
        return lid

    def save_quiz(self, lecture_id: str, quiz_data: List[Dict[str, Any]]):
        """Lưu danh sách câu hỏi trắc nghiệm vào bài giảng tương ứng."""
        quiz_str = json.dumps(quiz_data, ensure_ascii=False)
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("UPDATE lectures SET quiz_json = ? WHERE id = ?", (quiz_str, lecture_id))
            conn.commit()

    def get_lecture(self, lecture_id: str) -> Optional[Dict[str, Any]]:
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM lectures WHERE id = ?", (lecture_id,))
            row = cursor.fetchone()
            if not row:
                return None
            res = dict(row)
            res["transcript"] = json.loads(res.get("transcript_json") or "[]")
            res["summary"] = json.loads(res.get("summary_json") or "{}")
            res["mindmap"] = json.loads(res.get("mindmap_json") or "{}")
            res["quiz"] = json.loads(res.get("quiz_json") or "[]")
            return res

    def list_lectures(self, folder_tag: Optional[str] = None, search_query: str = "") -> List[Dict[str, Any]]:
        with self.get_connection() as conn:
            cursor = conn.cursor()
            query = """
            SELECT l.id, l.title, l.audio_path, l.duration_sec, l.folder_tag, l.created_at,
                   l.quiz_json,
                   CASE WHEN l.summary_json IS NOT NULL AND l.summary_json != '' AND l.summary_json != '{}' THEN 1 ELSE 0 END AS has_summary,
                   CASE WHEN l.quiz_json IS NOT NULL AND l.quiz_json != '' AND l.quiz_json != '[]' THEN 1 ELSE 0 END AS has_quiz,
                   (SELECT COUNT(*) FROM flashcards f WHERE f.lecture_id = l.id) AS flashcard_count,
                   (SELECT COUNT(*) FROM decks d WHERE d.lecture_id = l.id) AS deck_count,
                   (SELECT MAX(score * 100 / total_questions) FROM quiz_attempts qa WHERE qa.lecture_id = l.id) AS best_quiz_score
            FROM lectures l
            WHERE 1=1
            """
            params = []
            if folder_tag and folder_tag != "All":
                query += " AND l.folder_tag = ?"
                params.append(folder_tag)
            if search_query:
                query += " AND (l.title LIKE ? OR l.full_text LIKE ?)"
                params.extend([f"%{search_query}%", f"%{search_query}%"])
            query += " ORDER BY l.created_at DESC"
            cursor.execute(query, params)
            rows = []
            for r in cursor.fetchall():
                d = dict(r)
                quiz_list = json.loads(d.pop("quiz_json") or "[]")
                d["quiz_count"] = len(quiz_list) if isinstance(quiz_list, list) else 0
                rows.append(d)
            return rows

    def delete_lecture(self, lecture_id: str):
        with self.get_connection() as conn:
            cursor = conn.cursor()
            # Xóa dọn dẹp sạch sẽ các dữ liệu liên đới để tránh mồ côi
            cursor.execute("DELETE FROM flashcards WHERE lecture_id = ?", (lecture_id,))
            cursor.execute("DELETE FROM decks WHERE lecture_id = ?", (lecture_id,))
            cursor.execute("DELETE FROM quiz_attempts WHERE lecture_id = ?", (lecture_id,))
            cursor.execute("DELETE FROM lectures WHERE id = ?", (lecture_id,))
            conn.commit()

    # ==================== DECK & FLASHCARD CRUD ====================
    def create_deck(self, name: str, description: str = "", lecture_id: Optional[str] = None) -> str:
        deck_id = str(uuid.uuid4())
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("INSERT INTO decks (id, name, description, lecture_id) VALUES (?, ?, ?, ?)",
                           (deck_id, name, description, lecture_id))
            conn.commit()
        return deck_id

    def update_deck(self, deck_id: str, name: str, description: Optional[str] = None) -> bool:
        """Đổi tên và mô tả của bộ thẻ flashcard."""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            if description is not None:
                cursor.execute("UPDATE decks SET name = ?, description = ? WHERE id = ?", (name, description, deck_id))
            else:
                cursor.execute("UPDATE decks SET name = ? WHERE id = ?", (name, deck_id))
            conn.commit()
            return cursor.rowcount > 0

    def get_lecture_decks(self, lecture_id: str) -> List[Dict[str, Any]]:
        """Lấy tất cả các bộ thẻ Flashcard thuộc về một bài giảng."""
        today = date.today().isoformat()
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
            SELECT d.*,
                   COUNT(f.id) AS total_cards,
                   SUM(CASE WHEN f.due_date <= ? THEN 1 ELSE 0 END) AS due_cards,
                   SUM(CASE WHEN f.state = 'review' THEN 1 ELSE 0 END) AS mastered_cards
            FROM decks d
            LEFT JOIN flashcards f ON d.id = f.deck_id
            WHERE d.lecture_id = ?
            GROUP BY d.id
            ORDER BY d.created_at DESC
            """, (today, lecture_id))
            return [dict(r) for r in cursor.fetchall()]

    def get_lecture_flashcards(self, lecture_id: str) -> List[Dict[str, Any]]:
        """Lấy toàn bộ thẻ ghi nhớ thuộc về bài giảng (kèm tên bộ thẻ)."""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
            SELECT f.*, d.name AS deck_name
            FROM flashcards f
            LEFT JOIN decks d ON f.deck_id = d.id
            WHERE f.lecture_id = ?
            ORDER BY f.created_at ASC
            """, (lecture_id,))
            return [dict(r) for r in cursor.fetchall()]

    def list_decks(self) -> List[Dict[str, Any]]:
        today = date.today().isoformat()
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
            SELECT d.*,
                   l.title AS lecture_title,
                   COUNT(f.id) AS total_cards,
                   SUM(CASE WHEN f.due_date <= ? THEN 1 ELSE 0 END) AS due_cards,
                   SUM(CASE WHEN f.state = 'review' THEN 1 ELSE 0 END) AS mastered_cards
            FROM decks d
            LEFT JOIN lectures l ON d.lecture_id = l.id
            LEFT JOIN flashcards f ON d.id = f.deck_id
            GROUP BY d.id
            ORDER BY d.created_at DESC
            """, (today,))
            return [dict(r) for r in cursor.fetchall()]

    def delete_deck(self, deck_id: str):
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM flashcards WHERE deck_id = ?", (deck_id,))
            cursor.execute("DELETE FROM decks WHERE id = ?", (deck_id,))
            conn.commit()

    def add_flashcard(self, deck_id: str, front: str, back: str, hint: str = "",
                      lecture_id: Optional[str] = None) -> str:
        card_id = str(uuid.uuid4())
        today = date.today().isoformat()
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
            INSERT INTO flashcards (id, deck_id, lecture_id, front, back, hint, due_date)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (card_id, deck_id, lecture_id, front, back, hint, today))
            conn.commit()
        return card_id

    def add_flashcards_batch(self, deck_id: str, cards: List[Dict[str, str]], lecture_id: Optional[str] = None) -> int:
        today = date.today().isoformat()
        with self.get_connection() as conn:
            cursor = conn.cursor()
            for c in cards:
                cid = str(uuid.uuid4())
                cursor.execute("""
                INSERT INTO flashcards (id, deck_id, lecture_id, front, back, hint, due_date)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """, (cid, deck_id, lecture_id, c.get("front", ""), c.get("back", ""), c.get("hint", ""), today))
            conn.commit()
        return len(cards)

    def get_deck_cards(self, deck_id: str) -> List[Dict[str, Any]]:
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM flashcards WHERE deck_id = ? ORDER BY created_at ASC", (deck_id,))
            return [dict(r) for r in cursor.fetchall()]

    def get_due_cards(self, deck_id: Optional[str] = None) -> List[Dict[str, Any]]:
        today = date.today().isoformat()
        with self.get_connection() as conn:
            cursor = conn.cursor()
            if deck_id:
                cursor.execute("""
                SELECT * FROM flashcards
                WHERE deck_id = ? AND due_date <= ?
                ORDER BY due_date ASC, repetitions ASC
                """, (deck_id, today))
            else:
                cursor.execute("""
                SELECT * FROM flashcards
                WHERE due_date <= ?
                ORDER BY due_date ASC, repetitions ASC
                """, (today,))
            return [dict(r) for r in cursor.fetchall()]

    def get_all_deck_cards_shuffled(self, deck_id: str) -> List[Dict[str, Any]]:
        """Return ALL cards in deck in random order (for full review / shuffle mode)."""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
            SELECT * FROM flashcards
            WHERE deck_id = ?
            ORDER BY RANDOM()
            """, (deck_id,))
            return [dict(r) for r in cursor.fetchall()]

    def update_card_srs(self, card_id: str, ease_factor: float, interval_days: int,
                        repetitions: int, due_date: str, state: str):
        now = datetime.now().isoformat()
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
            UPDATE flashcards
            SET ease_factor = ?, interval_days = ?, repetitions = ?, due_date = ?, state = ?, last_reviewed = ?
            WHERE id = ?
            """, (ease_factor, interval_days, repetitions, due_date, state, now, card_id))
            conn.commit()

    def delete_flashcard(self, card_id: str):
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM flashcards WHERE id = ?", (card_id,))
            conn.commit()

    def get_deck_progress(self, deck_id: str) -> Dict[str, Any]:
        """Returns breakdown: new / learning / review / due_today."""
        today = date.today().isoformat()
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
            SELECT
                COUNT(*) AS total,
                SUM(CASE WHEN state = 'new' THEN 1 ELSE 0 END) AS new_cards,
                SUM(CASE WHEN state = 'learning' THEN 1 ELSE 0 END) AS learning,
                SUM(CASE WHEN state = 'review' THEN 1 ELSE 0 END) AS review,
                SUM(CASE WHEN due_date <= ? THEN 1 ELSE 0 END) AS due_today
            FROM flashcards WHERE deck_id = ?
            """, (today, deck_id))
            row = cursor.fetchone()
            return dict(row) if row else {}

    # ==================== QUIZ & STATS ====================
    def save_quiz_attempt(self, lecture_id: str, score: int, total: int, difficulty: str, details: List[Dict[str, Any]]):
        qid = str(uuid.uuid4())
        details_str = json.dumps(details, ensure_ascii=False)
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
            INSERT INTO quiz_attempts (id, lecture_id, score, total_questions, difficulty, details_json)
            VALUES (?, ?, ?, ?, ?, ?)
            """, (qid, lecture_id, score, total, difficulty, details_str))
            conn.commit()
        return qid

    def log_study_session(self, session_type: str, items_count: int, duration_sec: int):
        sid = str(uuid.uuid4())
        today = date.today().isoformat()
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
            INSERT INTO study_sessions (id, session_type, items_count, duration_sec, session_date)
            VALUES (?, ?, ?, ?, ?)
            """, (sid, session_type, items_count, duration_sec, today))
            conn.commit()

    def get_current_streak(self) -> int:
        """Returns consecutive study days ending today or yesterday."""
        today = date.today()
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
            SELECT DISTINCT session_date FROM study_sessions
            ORDER BY session_date DESC
            """)
            rows = [r[0] for r in cursor.fetchall()]

        if not rows:
            return 0

        date_set = set()
        for row_date_str in rows:
            try:
                date_set.add(date.fromisoformat(row_date_str))
            except (ValueError, TypeError):
                continue

        # Check if user studied today or yesterday
        if today in date_set:
            curr = today
        elif (today - timedelta(days=1)) in date_set:
            curr = today - timedelta(days=1)
        else:
            return 0

        streak = 0
        while curr in date_set:
            streak += 1
            curr -= timedelta(days=1)

        return streak

    def get_stats_overview(self) -> Dict[str, Any]:
        today = date.today().isoformat()
        with self.get_connection() as conn:
            cursor = conn.cursor()

            cursor.execute("SELECT COUNT(*) FROM lectures")
            total_lectures = cursor.fetchone()[0]

            cursor.execute("SELECT COUNT(*), SUM(CASE WHEN due_date <= ? THEN 1 ELSE 0 END) FROM flashcards", (today,))
            fc_row = cursor.fetchone()
            total_cards = fc_row[0] or 0
            due_today = fc_row[1] or 0

            cursor.execute("SELECT COUNT(*), AVG(CAST(score AS FLOAT)/total_questions * 100) FROM quiz_attempts")
            quiz_row = cursor.fetchone()
            total_quizzes = quiz_row[0] or 0
            avg_quiz_score = round(quiz_row[1] or 0, 1)

            cursor.execute("SELECT SUM(duration_sec), COUNT(DISTINCT session_date) FROM study_sessions")
            study_row = cursor.fetchone()
            total_study_sec = study_row[0] or 0
            active_days = study_row[1] or 0

            # Daily study history for last 14 days (for chart)
            cursor.execute("""
            SELECT session_date, SUM(items_count), SUM(duration_sec)
            FROM study_sessions
            GROUP BY session_date
            ORDER BY session_date DESC
            LIMIT 14
            """)
            daily_history = [dict(r) for r in cursor.fetchall()]

            # Flashcard state breakdown
            cursor.execute("""
            SELECT state, COUNT(*) FROM flashcards GROUP BY state
            """)
            state_rows = cursor.fetchall()
            card_states = {r[0]: r[1] for r in state_rows}

            return {
                "total_lectures": total_lectures,
                "total_cards": total_cards,
                "due_today": due_today,
                "total_quizzes": total_quizzes,
                "avg_quiz_score": avg_quiz_score,
                "total_study_minutes": round(total_study_sec / 60, 1),
                "active_days": active_days,
                "daily_history": daily_history,
                "card_states": card_states,
            }


db = Database()
