#!/usr/bin/env python3
# SPDX-FileCopyrightText: 2026 Open-mind Contributors
# SPDX-License-Identifier: MIT
#
# Purpose: Utility script to ensure all source code files contain standardized
# OSI-compliant SPDX license headers and copyright declarations.

import os
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent

PY_HEADER = """# SPDX-FileCopyrightText: 2026 Open-mind Contributors
# SPDX-License-Identifier: MIT
#
# Purpose: Open-mind - Offline AI-Powered Academic Lecture Copilot.
# Distributed under the terms of the OSI-approved MIT License.
"""

JS_HEADER = """/**
 * SPDX-FileCopyrightText: 2026 Open-mind Contributors
 * SPDX-License-Identifier: MIT
 *
 * Purpose: Open-mind - Offline AI-Powered Academic Lecture Copilot.
 * Distributed under the terms of the OSI-approved MIT License.
 */
"""

CSS_HEADER = """/**
 * SPDX-FileCopyrightText: 2026 Open-mind Contributors
 * SPDX-License-Identifier: MIT
 *
 * Purpose: Open-mind - Offline AI-Powered Academic Lecture Copilot.
 * Distributed under the terms of the OSI-approved MIT License.
 */
"""

HTML_HEADER = """<!--
  SPDX-FileCopyrightText: 2026 Open-mind Contributors
  SPDX-License-Identifier: MIT
  Purpose: Open-mind - Offline AI-Powered Academic Lecture Copilot.
-->
"""

IGNORE_DIRS = {".git", "venv", ".venv", "env", "__pycache__", "models", "data", "dist", "build"}
VENDOR_FILES = {"lucide.min.js"}

def process_file(file_path: Path):
    if file_path.name in VENDOR_FILES:
        return

    ext = file_path.suffix.lower()
    if ext not in {".py", ".js", ".css", ".html"}:
        return

    try:
        content = file_path.read_text(encoding="utf-8")
    except Exception as e:
        print(f"Skipping {file_path}: {e}")
        return

    if "SPDX-License-Identifier" in content:
        print(f"[OK] Already has header: {file_path.relative_to(REPO_ROOT)}")
        return

    if ext == ".py":
        # Check for shebang
        if content.startswith("#!"):
            lines = content.split("\n", 1)
            new_content = lines[0] + "\n" + PY_HEADER + "\n" + (lines[1] if len(lines) > 1 else "")
        else:
            new_content = PY_HEADER + "\n" + content
    elif ext == ".js":
        new_content = JS_HEADER + "\n" + content
    elif ext == ".css":
        new_content = CSS_HEADER + "\n" + content
    elif ext == ".html":
        # Insert right after <!DOCTYPE html> if present
        if "<!DOCTYPE" in content.upper():
            idx = content.find(">")
            new_content = content[:idx+1] + "\n" + HTML_HEADER + content[idx+1:]
        else:
            new_content = HTML_HEADER + "\n" + content
    else:
        return

    file_path.write_text(new_content, encoding="utf-8")
    print(f"[UPDATED] Added license header to: {file_path.relative_to(REPO_ROOT)}")

def main():
    print(f"Scanning repository at: {REPO_ROOT}")
    count = 0
    for root, dirs, files in os.walk(REPO_ROOT):
        dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]
        for f in files:
            file_path = Path(root) / f
            process_file(file_path)
            count += 1
    print(f"\nScan completed. Evaluated {count} files.")

if __name__ == "__main__":
    main()
