import json
from datetime import date, datetime
from sqlalchemy import select
from .session import Base, engine, SessionLocal
from ..core.config import CONTRACTS
from ..core.security import hash_password
from ..models.user import User
from ..models.project import Project
from ..models.flag import Flag
def seed():
    Base.metadata.create_all(engine); db = SessionLocal()
    if not db.scalar(select(User.id).limit(1)):
        users = [("USR-001","mp_demo@aqua.test","Synthetic MP User","mp","Aster","Northfield","AST-01"),("USR-002","state_demo@aqua.test","Synthetic State Officer","state_nodal","Aster",None,None),("USR-003","district_demo@aqua.test","Synthetic District Officer","district","Beryl","Eastvale",None),("USR-004","ministry_demo@aqua.test","Synthetic Ministry Officer","ministry",None,None,None)]
        db.add_all([User(id=i,email=e,name=n,password_hash=hash_password("demo1234"),role=r,state=s,district=d,constituency_code=c) for i,e,n,r,s,d,c in users])
        for item in json.loads((CONTRACTS/"sample-data/sample_projects.json").read_text()):
            db.add(Project(**{**item,"sanction_date":date.fromisoformat(item["sanction_date"]),"expected_completion_date":date.fromisoformat(item["expected_completion_date"]),"actual_completion_date":date.fromisoformat(item["actual_completion_date"]) if item["actual_completion_date"] else None}))
        for item in json.loads((CONTRACTS/"sample-data/sample_flags.json").read_text()): db.add(Flag(**{**item,"created_at":datetime.fromisoformat(item["created_at"].replace("Z","+00:00")).replace(tzinfo=None)}))
        db.commit()
    db.close()
if __name__ == "__main__": seed()
