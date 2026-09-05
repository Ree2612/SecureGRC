from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.database import Base, SQLALCHEMY_DATABASE_URL
from app.models.user import User
from app.models.organization import Organization
from app.api.v1.dashboard import get_controls_for_framework

engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

org = db.query(Organization).first()
controls = get_controls_for_framework(db, org.id, "NIST CSF 2.0")
print("NIST controls:")
for c in controls:
    print(f"{c.control_code} | {c.implementation_status}")

print("\nISO controls:")
iso_controls = get_controls_for_framework(db, org.id, "ISO/IEC 27001:2022")
for c in iso_controls:
    print(f"{c.control_code} | {c.implementation_status}")
