# SPDX-FileCopyrightText: 2026 Open-mind Contributors
# SPDX-License-Identifier: MIT
#
# Purpose: Open-mind - Offline AI-Powered Academic Lecture Copilot.
# Distributed under the terms of the OSI-approved MIT License.

from setuptools import setup, find_packages
from pathlib import Path

this_directory = Path(__file__).parent
long_description = (this_directory / "README.md").read_text(encoding="utf-8") if (this_directory / "README.md").exists() else ""

setup(
    name="open-mind",
    version="1.0.0",
    description="Offline AI-Powered Academic Lecture Copilot & Active Recall Learning Workspace",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/dargits/Openmind",
    author="Openmind Contributors",
    license="MIT",
    packages=find_packages(exclude=["tests*", "data*", "models*"]),
    include_package_data=True,
    python_requires=">=3.10",
    install_requires=[
        "faster-whisper==1.0.3",
        "llama-cpp-python==0.3.34",
        "pywebview>=5.0",
        "pydub==0.25.1",
        "pygame==2.6.1",
        "huggingface-hub>=0.20.0",
        "requests>=2.28.0",
        "tqdm>=4.65.0",
    ],
    extras_require={
        "build": ["pyinstaller>=6.10.0"],
        "benchmark": ["psutil>=5.9.0", "jiwer>=3.0.0"],
    },
    entry_points={
        "console_scripts": [
            "open-mind=main:main",
        ],
    },
    classifiers=[
        "License :: OSI Approved :: MIT License",
        "Programming Language :: Python :: 3",
        "Topic :: Scientific/Engineering :: Artificial Intelligence",
        "Topic :: Education",
    ],
)
