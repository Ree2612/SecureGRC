import os
import sys
import unittest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Ensure app is in path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.database import Base
from app.models.system_log import SystemLog
from app.services.logger_service import log_to_db
from app.core.config import settings

class TestLogsAndMySQLIntegration(unittest.TestCase):
    def setUp(self):
        # Use an in-memory SQLite database for test isolation
        self.engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
        Base.metadata.create_all(bind=self.engine)
        TestSession = sessionmaker(autocommit=False, autoflush=False, bind=self.engine)
        self.db = TestSession()

    def tearDown(self):
        self.db.close()
        Base.metadata.drop_all(bind=self.engine)

    def test_system_log_creation_and_retrieval(self):
        # Save a log directly via log_to_db service
        log_entry = log_to_db(
            db=self.db,
            log_level="WARNING",
            category="SECURITY",
            action="UNAUTHORIZED_ACCESS_ATTEMPT",
            actor="attacker@external.org",
            target="/api/v1/admin/secrets",
            status_code=403,
            ip_address="203.0.113.5",
            details="IP blocked due to invalid token submission."
        )

        self.assertIsNotNone(log_entry)
        self.assertIsNotNone(log_entry.id)

        # Retrieve log from database
        fetched_log = self.db.query(SystemLog).filter(SystemLog.id == log_entry.id).first()
        self.assertIsNotNone(fetched_log)
        self.assertEqual(fetched_log.log_level, "WARNING")
        self.assertEqual(fetched_log.category, "SECURITY")
        self.assertEqual(fetched_log.action, "UNAUTHORIZED_ACCESS_ATTEMPT")
        self.assertEqual(fetched_log.status_code, 403)
        self.assertEqual(fetched_log.ip_address, "203.0.113.5")

    def test_log_filtering_by_level_and_category(self):
        log_to_db(db=self.db, log_level="INFO", category="SYSTEM", action="BOOT_SUCCESS")
        log_to_db(db=self.db, log_level="ERROR", category="DATABASE", action="CONNECTION_TIMEOUT")
        log_to_db(db=self.db, log_level="ERROR", category="API", action="HTTP_500")

        error_logs = self.db.query(SystemLog).filter(SystemLog.log_level == "ERROR").all()
        self.assertEqual(len(error_logs), 2)

        db_logs = self.db.query(SystemLog).filter(SystemLog.category == "DATABASE").all()
        self.assertEqual(len(db_logs), 1)
        self.assertEqual(db_logs[0].action, "CONNECTION_TIMEOUT")

    def test_mysql_uri_building(self):
        # Verify Settings dynamic URI builder
        test_settings = settings
        test_settings.DB_TYPE = "mysql"
        test_settings.MYSQL_HOST = "127.0.0.1"
        test_settings.MYSQL_PORT = 3306
        test_settings.MYSQL_USER = "root"
        test_settings.MYSQL_PASSWORD = "secretpassword"
        test_settings.MYSQL_DB = "securegrc_test"

        # Temporarily unset DATABASE_URL env var if present to test MySQL URI resolution
        old_env = os.environ.get("DATABASE_URL")
        if "DATABASE_URL" in os.environ:
            del os.environ["DATABASE_URL"]

        uri = test_settings.SQLALCHEMY_DATABASE_URI
        self.assertTrue(uri.startswith("mysql+pymysql://root:secretpassword@127.0.0.1:3306/securegrc_test"))

        # Restore env
        if old_env:
            os.environ["DATABASE_URL"] = old_env

if __name__ == "__main__":
    unittest.main()
