"""
Open-mind — Core Package
─────────────────────────────────────────────
Cung cấp các engine và dịch vụ nghiệp vụ cốt lõi của trợ lý học tập AI Open-mind.
"""

from core.database import Database, db
from core.api import API, api
from core.stt_engine import stt_engine
from core.llm_engine import llm_engine, TranscriptPruner
from core.rag_engine import rag_engine
from core.flashcard_srs import srs_manager
from core.export_engine import export_engine
from core.model_manager import model_manager
from core.demo_seeder import seed_demo_data

__all__ = [
    "Database",
    "db",
    "API",
    "api",
    "stt_engine",
    "llm_engine",
    "TranscriptPruner",
    "rag_engine",
    "srs_manager",
    "export_engine",
    "model_manager",
    "seed_demo_data",
]
