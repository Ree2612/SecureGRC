import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import Base, engine, SessionLocal, safe_migrate_schema
from app.api.v1.router import api_router
from app.seed import seed_database

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB tables and seed data
    Base.metadata.create_all(bind=engine)
    safe_migrate_schema()
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
    lifespan=lifespan
)

# CORS Setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all for development and local testing
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def database_logging_middleware(request, call_next):
    from app.services.logger_service import log_to_db
    path = request.url.path
    if path.startswith("/api/v1") and not path.endswith("/logs"):
        method = request.method
        client_ip = request.client.host if request.client else "127.0.0.1"
        try:
            response = await call_next(request)
            status_code = response.status_code
            log_level = "ERROR" if status_code >= 400 else "INFO"
            log_to_db(
                log_level=log_level,
                category="API",
                action=f"HTTP_{method}",
                actor="api_client",
                target=path,
                status_code=status_code,
                ip_address=client_ip,
                details=f"{method} request to {path} returned status {status_code}"
            )
            return response
        except Exception as exc:
            log_to_db(
                log_level="CRITICAL",
                category="API",
                action=f"HTTP_{method}_EXCEPTION",
                actor="api_client",
                target=path,
                status_code=500,
                ip_address=client_ip,
                details=f"Unhandled exception during {method} {path}: {str(exc)}"
            )
            raise exc
    return await call_next(request)

# Register API v1 routes
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "status": "online",
        "app": "SecureGRC API",
        "version": settings.VERSION,
        "docs": f"{settings.API_V1_STR}/docs"
    }

@app.get("/health")
def health_check():
    return {"status": "healthy"}
