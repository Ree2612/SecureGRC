"""
SecureGRC Enterprise Platform - SQLite (securegrc.db) to MySQL Migration Script

This script reads all schema definitions, tables, and rows from the local SQLite database
(securegrc.db) and populates them into a target MySQL database instance.

Usage:
    python migrate_to_mysql.py --host localhost --port 3306 --user root --password secret --database securegrc
"""

import os
import sys
import argparse
import logging
from typing import Dict, Any, List
from sqlalchemy import create_engine, inspect, MetaData, Table, select
from sqlalchemy.exc import SQLAlchemyError

# Ensure app package is importable
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.database import Base, engine as sqlite_engine
import app.models  # Ensure all SQLAlchemy models are registered

logging.basicConfig(level=logging.INFO, format="[%(asctime)s] %(levelname)s: %(message)s")
logger = logging.getLogger("mysql_migration")

def migrate_sqlite_to_mysql(
    mysql_host: str = "localhost",
    mysql_port: int = 3306,
    mysql_user: str = "root",
    mysql_password: str = "",
    mysql_db: str = "securegrc",
    sqlite_db_path: str = "sqlite:///./securegrc.db"
) -> Dict[str, Any]:
    """
    Executes full data migration from SQLite to target MySQL database.
    """
    pwd = f":{mysql_password}" if mysql_password else ""
    server_uri = f"mysql+pymysql://{mysql_user}{pwd}@{mysql_host}:{mysql_port}/?charset=utf8mb4"
    mysql_uri = f"mysql+pymysql://{mysql_user}{pwd}@{mysql_host}:{mysql_port}/{mysql_db}?charset=utf8mb4"

    results = {
        "success": False,
        "message": "",
        "transferred_tables": {},
        "details": []
    }

    logger.info(f"Connecting to MySQL server: mysql://{mysql_user}@{mysql_host}:{mysql_port}")

    try:
        # First ensure target database exists on MySQL server
        server_engine = create_engine(server_uri, pool_pre_ping=True)
        with server_engine.connect() as s_conn:
            from sqlalchemy import text
            s_conn.execute(text(f"CREATE DATABASE IF NOT EXISTS `{mysql_db}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"))
            s_conn.commit()
        server_engine.dispose()
        logger.info(f"Verified target database '{mysql_db}' exists on MySQL server.")

        mysql_engine = create_engine(
            mysql_uri,
            pool_pre_ping=True,
            echo=False
        )

        # Test connection
        with mysql_engine.connect() as conn:
            logger.info("Successfully established connection to MySQL target database!")

        # Create all tables on MySQL schema
        logger.info("Creating ORM tables on MySQL target database...")
        Base.metadata.create_all(bind=mysql_engine)
        results["details"].append("Created tables on MySQL schema using Base.metadata")

        # Copy data table by table
        sqlite_inspector = inspect(sqlite_engine)
        table_names = sqlite_inspector.get_table_names()

        # Topological sorting priority (parent tables first)
        ordered_tables = [
            "organizations",
            "users",
            "assets",
            "risks",
            "controls",
            "gaps",
            "remediation_tasks",
            "evidence",
            "frameworks",
            "framework_mappings",
            "reports",
            "activities",
            "notifications",
            "system_logs"
        ]
        
        # Include any remaining tables not explicitly listed
        for t in table_names:
            if t not in ordered_tables:
                ordered_tables.append(t)

        sqlite_meta = MetaData()
        sqlite_meta.reflect(bind=sqlite_engine)

        mysql_meta = MetaData()
        mysql_meta.reflect(bind=mysql_engine)

        total_rows_migrated = 0

        for table_name in ordered_tables:
            if table_name not in sqlite_meta.tables:
                continue

            src_table = sqlite_meta.tables[table_name]
            dest_table = mysql_meta.tables.get(table_name)

            if dest_table is None:
                continue

            with sqlite_engine.connect() as src_conn:
                rows = src_conn.execute(select(src_table)).fetchall()
                dict_rows = [dict(r._mapping) for r in rows]

            if dict_rows:
                with mysql_engine.begin() as dest_conn:
                    # Clear existing records in target table to avoid unique constraint collisions during re-run
                    dest_conn.execute(dest_table.delete())
                    dest_conn.execute(dest_table.insert(), dict_rows)

                logger.info(f"Migrated {len(dict_rows)} rows into MySQL table '{table_name}'")
                results["transferred_tables"][table_name] = len(dict_rows)
                total_rows_migrated += len(dict_rows)
            else:
                results["transferred_tables"][table_name] = 0
                logger.info(f"Table '{table_name}' has 0 rows in SQLite, skipped row insertion.")

        results["success"] = True
        results["message"] = f"Successfully migrated {len(results['transferred_tables'])} tables ({total_rows_migrated} rows) from securegrc.db to MySQL!"
        logger.info(results["message"])

    except Exception as e:
        err_msg = f"Migration failed: {str(e)}"
        logger.error(err_msg)
        results["success"] = False
        results["message"] = err_msg
        results["details"].append(err_msg)

    return results

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Migrate SecureGRC SQLite database to MySQL.")
    parser.add_argument("--host", default="localhost", help="MySQL host")
    parser.add_argument("--port", type=int, default=3306, help="MySQL port")
    parser.add_argument("--user", default="root", help="MySQL user")
    parser.add_argument("--password", default="", help="MySQL password")
    parser.add_argument("--database", default="securegrc", help="MySQL database name")

    args = parser.parse_args()

    res = migrate_sqlite_to_mysql(
        mysql_host=args.host,
        mysql_port=args.port,
        mysql_user=args.user,
        mysql_password=args.password,
        mysql_db=args.database
    )

    print("\n--- MIGRATION SUMMARY ---")
    print(f"Status: {'SUCCESS' if res['success'] else 'FAILED'}")
    print(f"Message: {res['message']}")
    print("Tables Migrated:")
    for tbl, count in res["transferred_tables"].items():
        print(f"  - {tbl}: {count} rows")
