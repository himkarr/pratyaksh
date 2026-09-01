from pydantic import BaseModel
class User(BaseModel):
    id: str; name: str; role: str; state: str | None = None; district: str | None = None; constituency_code: str | None = None
