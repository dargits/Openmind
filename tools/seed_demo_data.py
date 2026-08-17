#!/usr/bin/env python3
"""
Open-mind Pro — Demo Data Seeder
────────────────────────────────────────────────────────────────────────
Script nạp dữ liệu bài giảng học thuật mẫu vào cơ sở dữ liệu SQLite:
- 1 Bài giảng hoàn chỉnh (Transcript timestamps + Tóm tắt phân cấp + Mindmap)
- 1 Bộ thẻ Flashcard (8 thẻ chuẩn thuật toán SM-2)
- 1 Kết quả thi trắc nghiệm mẫu (5 câu hỏi)
- Lịch sử học tập 7 ngày (giúp biểu đồ Streak & Study chart hiển thị đẹp mắt)

Cách chạy:
  python tools/seed_demo_data.py
  python tools/seed_demo_data.py --force
"""

import sys
import os
import json
import uuid
import datetime
from pathlib import Path

# Ensure UTF-8 output on Windows console
if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

# Ensure project root is in sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from data.database import db


def seed_demo_data(force: bool = False) -> dict:
    """
    Nạp dữ liệu demo từ demo_data/demo_lecture_dsa.json vào SQLite database.
    Không ghi đè dữ liệu nếu bài giảng demo đã tồn tại (trừ khi force=True).
    """
    demo_file = PROJECT_ROOT / "demo_data" / "demo_lecture_dsa.json"
    if not demo_file.exists():
        return {"success": False, "message": f"Không tìm thấy file: {demo_file}"}

    with open(demo_file, "r", encoding="utf-8") as f:
        demo = json.load(f)

    title = demo.get("title", "Cấu trúc Dữ liệu: Cây Nhị phân & Bảng Băm")
    
    # Kiểm tra xem bài giảng đã tồn tại chưa
    with db.get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM lectures WHERE title = ?", (title,))
        existing = cursor.fetchone()
        
        if existing and not force:
            return {
                "success": True,
                "already_exists": True,
                "message": f"Dữ liệu mẫu '{title}' đã tồn tại sẵn trong hệ thống.",
                "lecture_id": existing[0]
            }

        # Nếu force và đã tồn tại, xóa bài cũ đi nạp lại
        if existing and force:
            db.delete_lecture(existing[0])

    # 1. Nạp Lecture
    lecture_id = str(uuid.uuid4())
    db.save_lecture(
        title=title,
        audio_path="",
        duration_sec=demo.get("duration_sec", 360.0),
        transcript=demo.get("transcript", []),
        full_text=demo.get("full_text", ""),
        summary_data=demo.get("summary", {}),
        mindmap_data=demo.get("mindmap", {}),
        folder_tag=demo.get("folder_tag", "CNTT"),
        lecture_id=lecture_id
    )

    # 2. Nạp Deck & Flashcards
    deck_name = f"Thẻ: {title}"
    deck_id = db.create_deck(deck_name, "Dữ liệu mẫu demo học phần Cấu trúc Dữ liệu", lecture_id)
    cards = demo.get("flashcards", [])
    db.add_flashcards_batch(deck_id, cards, lecture_id)

    # 3. Nạp Quiz Attempt mẫu
    quiz_questions = demo.get("quiz", [])
    if quiz_questions:
        quiz_details = [
            {
                "question": q["question"],
                "userIdx": q["correct_index"],
                "correctIdx": q["correct_index"],
                "isCorrect": True
            }
            for q in quiz_questions
        ]
        db.save_quiz_attempt(
            lecture_id=lecture_id,
            score=len(quiz_questions),
            total=len(quiz_questions),
            difficulty="trung bình",
            details=quiz_details
        )

    # 4. Nạp lịch sử học tập 7 ngày mẫu (tạo biểu đồ Streak đẹp)
    today = datetime.date.today()
    with db.get_connection() as conn:
        cursor = conn.cursor()
        for i in range(7):
            past_date = today - datetime.timedelta(days=i)
            # Kiểm tra xem ngày đó đã có log chưa
            cursor.execute("SELECT COUNT(*) FROM study_sessions WHERE session_date = ?", (past_date.isoformat(),))
            if cursor.fetchone()[0] == 0:
                sid = str(uuid.uuid4())
                cursor.execute("""
                INSERT INTO study_sessions (id, session_type, items_count, duration_sec, session_date)
                VALUES (?, ?, ?, ?, ?)
                """, (sid, "flashcard_review" if i % 2 == 0 else "lecture_study", 8 + i * 2, 600 + i * 180, past_date.isoformat()))
        conn.commit()

    return {
        "success": True,
        "already_exists": False,
        "message": f"Đã nạp thành công bài giảng demo: '{title}' ({len(cards)} flashcards, {len(quiz_questions)} câu hỏi quiz).",
        "lecture_id": lecture_id
    }


def main():
    import argparse
    parser = argparse.ArgumentParser(description="Seed demo lecture data for Open-mind Pro")
    parser.add_argument("--force", "-f", action="store_true", help="Ghi đè nếu dữ liệu demo đã tồn tại")
    args = parser.parse_args()

    print("🌱 Đang nạp dữ liệu demo mẫu vào Open-mind Pro...")
    result = seed_demo_data(force=args.force)
    
    if result["success"]:
        print(f"✅ {result['message']}")
    else:
        print(f"❌ {result['message']}")


if __name__ == "__main__":
    main()
