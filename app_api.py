"""
Open-mind — API Bridge Shim
─────────────────────────────────────────────
Shim tương thích ngược: chuyển hướng import sang core.api.
"""

from core.api import API, api

__all__ = ["API", "api"]
