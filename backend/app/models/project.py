"""Deprecated scaffold stub — use app.models.schema_models.Project instead.

Kept as a compatibility re-export so legacy imports do not break.
Do NOT redefine the 'projects' table here (production schema lives in
schema_models.py and maps the 29-table Supabase database).
"""

from .schema_models import Project  # noqa: F401

__all__ = ["Project"]
