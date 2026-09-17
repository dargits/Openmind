# SPDX-FileCopyrightText: 2026 Open-mind Contributors
# SPDX-License-Identifier: MIT
#
# Purpose: Open-mind - Offline AI-Powered Academic Lecture Copilot.
# Distributed under the terms of the OSI-approved MIT License.

import csv
import json
from pathlib import Path
from typing import Dict, Any, List, Optional

class ExportEngine:
    @staticmethod
    def export_txt(filepath: str, content: str) -> bool:
        try:
            Path(filepath).write_text(content, encoding="utf-8")
            return True
        except Exception as e:
            print(f"Error exporting TXT: {e}")
            return False

    @staticmethod
    def export_json(filepath: str, data: Any) -> bool:
        try:
            Path(filepath).write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
            return True
        except Exception as e:
            print(f"Error exporting JSON: {e}")
            return False

    @staticmethod
    def export_anki_csv(filepath: str, flashcards: List[Dict[str, Any]], deck_name: str = "OpenMind") -> bool:
        """
        Exports flashcards in standard Anki import CSV/TSV format:
        Front, Back, Hint/Tags
        """
        try:
            with open(filepath, "w", newline="", encoding="utf-8") as f:
                writer = csv.writer(f, delimiter="\t")
                for card in flashcards:
                    front = card.get("front", "").replace("\n", "<br>")
                    back = card.get("back", "").replace("\n", "<br>")
                    tags = deck_name.replace(" ", "_")
                    writer.writerow([front, back, tags])
            return True
        except Exception as e:
            print(f"Error exporting Anki CSV: {e}")
            return False

    @staticmethod
    def export_anki_apkg(filepath: str, flashcards: List[Dict[str, Any]], deck_name: str = "OpenMind") -> bool:
        """
        Exports flashcards as a native Anki .apkg package using genanki.
        """
        try:
            import genanki

            model_id = abs(hash(f"OpenMind_Model_{deck_name}")) % (10 ** 9)
            deck_id = abs(hash(deck_name)) % (10 ** 9)

            my_model = genanki.Model(
                model_id,
                'OpenMind Flashcard Model',
                fields=[
                    {'name': 'Front'},
                    {'name': 'Back'},
                    {'name': 'Hint'},
                ],
                templates=[
                    {
                        'name': 'Card 1',
                        'qfmt': '''
                            <div style="font-family: -apple-system, Arial, sans-serif; text-align: center; padding: 25px; font-size: 20px; color: #1e293b;">
                                {{Front}}
                                {{#Hint}}
                                <div style="margin-top: 15px; font-size: 14px; color: #d97706; font-style: italic;">
                                    💡 Gợi ý: {{Hint}}
                                </div>
                                {{/Hint}}
                            </div>
                        ''',
                        'afmt': '''
                            {{FrontSide}}
                            <hr id="answer" style="border: 0; height: 1px; background: #e2e8f0; margin: 20px 0;">
                            <div style="font-family: -apple-system, Arial, sans-serif; text-align: center; padding: 10px 25px; font-size: 19px; color: #4f46e5; font-weight: bold;">
                                {{Back}}
                            </div>
                        ''',
                    },
                ],
                css='''
                    .card {
                        background-color: #ffffff;
                        border-radius: 12px;
                        box-shadow: 0 4px 12px rgba(0,0,0,0.08);
                    }
                '''
            )

            my_deck = genanki.Deck(deck_id, deck_name)

            for card in flashcards:
                front = (card.get("front") or "").replace("\n", "<br>")
                back = (card.get("back") or "").replace("\n", "<br>")
                hint = (card.get("hint") or "").replace("\n", "<br>")
                if front and back:
                    note = genanki.Note(
                        model=my_model,
                        fields=[front, back, hint]
                    )
                    my_deck.add_note(note)

            genanki.Package(my_deck).write_to_file(filepath)
            return True
        except Exception as e:
            print(f"Error exporting Anki .apkg: {e}")
            return ExportEngine.export_anki_csv(filepath.replace(".apkg", ".tsv"), flashcards, deck_name)

    @staticmethod
    def export_html_report(filepath: str, lecture_data: Dict[str, Any]) -> bool:
        """
        Exports an aesthetic HTML study report with clean styling, suitable for printing to PDF.
        Includes personal notes and summary.
        """
        try:
            title = lecture_data.get("title", "Bài giảng")
            summary = lecture_data.get("summary", {})
            overview = summary.get("overview", "")
            key_points = summary.get("key_takeaways", [])
            sections = summary.get("sections", [])
            transcript = lecture_data.get("transcript", [])
            notes = lecture_data.get("notes", [])

            notes_html = ""
            if notes:
                notes_items = "".join(
                    f"<div class='note-item'><span class='timestamp'>[{int(n.get('timestamp_sec', 0)//60):02d}:{int(n.get('timestamp_sec', 0)%60):02d}]</span> {n.get('text', '')}</div>"
                    for n in notes
                )
                notes_html = f"<h2>📝 Ghi chú cá nhân của bạn</h2><div class='notes-box'>{notes_items}</div>"

            html = f"""<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <title>{title} - Open-mind Study Report</title>
    <style>
        body {{
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background-color: #f8fafc;
            color: #1e293b;
            line-height: 1.6;
            margin: 0;
            padding: 40px;
        }}
        .container {{
            max-width: 840px;
            margin: 0 auto;
            background: #ffffff;
            padding: 40px;
            border-radius: 12px;
            box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
        }}
        h1 {{ color: #4f46e5; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; }}
        h2 {{ color: #334155; margin-top: 28px; }}
        .badge {{
            display: inline-block;
            background: #ede9fe;
            color: #6366f1;
            padding: 4px 12px;
            border-radius: 9999px;
            font-size: 0.85rem;
            font-weight: 600;
        }}
        .key-points {{ background: #f1f5f9; padding: 20px; border-radius: 8px; border-left: 4px solid #6366f1; }}
        .notes-box {{ background: #fffbeb; border: 1px solid #fef3c7; border-left: 4px solid #f59e0b; padding: 18px; border-radius: 8px; margin-top: 10px; }}
        .note-item {{ margin-bottom: 10px; font-size: 0.95rem; }}
        .section-item {{ margin-bottom: 16px; }}
        .timestamp {{ font-weight: bold; color: #6366f1; font-family: monospace; }}
        .transcript-box {{ max-height: 400px; overflow-y: auto; background: #fafafa; padding: 16px; border: 1px solid #e5e7eb; border-radius: 8px; font-size: 0.95rem; }}
    </style>
</head>
<body>
<div class="container">
    <span class="badge">Open-mind Academic Study Report</span>
    <h1>{title}</h1>
    
    <h2>📋 Tóm tắt tổng quan</h2>
    <p>{overview or "Chưa có nội dung tóm tắt."}</p>
    
    {"<div class='key-points'><h3>🎯 Ý chính cốt lõi:</h3><ul>" + "".join(f"<li>{pt}</li>" for pt in key_points) + "</ul></div>" if key_points else ""}
    
    {notes_html}

    {"<h2>📑 Chi tiết từng phần</h2>" + "".join(f"<div class='section-item'><span class='timestamp'>[{sec.get('timestamp', '')}]</span> <strong>{sec.get('title', '')}</strong><p>{sec.get('summary', '')}</p></div>" for sec in sections) if sections else ""}

    <h2>🎙️ Nội dung chi tiết (Nội dung / Phân đoạn)</h2>
    <div class="transcript-box">
        {"".join(f"<p><span class='timestamp'>[{seg.get('start', 0):.1f}s - {seg.get('end', 0):.1f}s]</span> {seg.get('text', '')}</p>" for seg in transcript) if transcript else "<p>Chưa có bản ghi.</p>"}
    </div>
</div>
</body>
</html>
"""
            Path(filepath).write_text(html, encoding="utf-8")
            return True
        except Exception as e:
            print(f"Error exporting HTML report: {e}")
            return False

export_engine = ExportEngine()
