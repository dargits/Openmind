# -*- mode: python ; coding: utf-8 -*-
# SPDX-License-Identifier: MIT
# OpenMind Standalone PyInstaller Specification

import sys
from pathlib import Path
from PyInstaller.utils.hooks import collect_dynamic_libs, collect_submodules, collect_data_files

# Resolve absolute root directory of OpenMind
ROOT_DIR = Path(SPECPATH).resolve().parent

block_cipher = None

# Collect all dynamic C/C++ libraries and data files
ctranslate2_bins = collect_dynamic_libs('ctranslate2')
llama_cpp_bins = collect_dynamic_libs('llama_cpp')

hidden_imports = [
    'uvicorn',
    'fastapi',
    'webview',
    'ctranslate2',
    'llama_cpp',
    'sqlite3',
    'pydantic',
    'faster_whisper',
] + collect_submodules('webview')

datas = [
    (str(ROOT_DIR / 'ui'), 'ui'),
    (str(ROOT_DIR / 'data' / 'demo_lecture.json'), 'data'),
    (str(ROOT_DIR / '.env.example'), '.'),
]

try:
    datas += collect_data_files('faster_whisper')
except Exception:
    pass

a = Analysis(
    [str(ROOT_DIR / 'main.py')],
    pathex=[str(ROOT_DIR)],
    binaries=ctranslate2_bins + llama_cpp_bins,
    datas=datas,
    hiddenimports=hidden_imports,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=['tkinter', 'matplotlib', 'IPython'],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name='OpenMind',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    console=False,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon=str(ROOT_DIR / 'ui' / 'logo.jpg') if (ROOT_DIR / 'ui' / 'logo.jpg').exists() else None,
)

coll = COLLECT(
    exe,
    a.binaries,
    a.zipfiles,
    a.datas,
    strip=False,
    upx=True,
    upx_exclude=[],
    name='OpenMind',
)
