"""
Open-mind — Data Access Shim
─────────────────────────────────────────────
Shim tương thích ngược: chuyển hướng import sang core.database.
"""

from core.database import Database, db

__all__ = ["Database", "db"]
