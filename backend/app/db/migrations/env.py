from app.db.session import Base
# Import production models so Alembic sees the full 29-table schema.
# (Legacy stub modules app/models/project.py etc. were scaffold leftovers
# with incompatible duplicate table definitions and are no longer used.)
import app.models.schema_models  # noqa: F401
target_metadata = Base.metadata
