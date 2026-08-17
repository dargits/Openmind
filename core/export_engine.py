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
    def export_html_report(filepath: str, lecture_data: Dict[str, Any]) -> bool:
        """
        Exports an aesthetic HTML study report with clean styling, suitable for printing to PDF.
        """
        try:
            title = lecture_data.get("title", "Bài giảng")
            summary = lecture_data.get("summary", {})
            overview = summary.get("overview", "")
            key_points = summary.get("key_takeaways", [])
            sections = summary.get("sections", [])
            transcript = lecture_data.get("transcript", [])

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
            max-width: 800px;
            margin: 0 auto;
            background: #ffffff;
            padding: 40px;
            border-radius: 12px;
            box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
        }}
        h1 {{ color: #4f46e5; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; }}
        h2 {{ color: #334155; margin-top: 24px; }}
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
        .section-item {{ margin-bottom: 16px; }}
        .timestamp {{ font-weight: bold; color: #6366f1; font-family: monospace; }}
        .transcript-box {{ max-height: 400px; overflow-y: auto; background: #fafafa; padding: 16px; border: 1px solid #e5e7eb; border-radius: 8px; font-size: 0.95rem; }}
    </style>
</head>
<body>
<div class="container">
    <span class="badge">Open-mind Study Report</span>
    <h1>{title}</h1>
    
    <h2>📋 Tóm tắt tổng quan</h2>
    <p>{overview or "Chưa có nội dung tóm tắt."}</p>
    
    {"<div class='key-points'><h3>🎯 Ý chính cốt lõi:</h3><ul>" + "".join(f"<li>{pt}</li>" for pt in key_points) + "</ul></div>" if key_points else ""}
    
    {"<h2>📑 Chi tiết từng phần</h2>" + "".join(f"<div class='section-item'><span class='timestamp'>[{sec.get('timestamp', '')}]</span> <strong>{sec.get('title', '')}</strong><p>{sec.get('summary', '')}</p></div>" for sec in sections) if sections else ""}

    <h2>🎙️ Bản ghi âm (Transcript)</h2>
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
