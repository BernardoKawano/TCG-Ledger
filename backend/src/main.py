"""TCG Ledger API - Main entry point."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from src.core.config import settings
from src.core.limiter import limiter
from src.core.database import engine, Base
from src.auth.routes import router as auth_router
from src.catalog.routes import router as catalog_router
from src.scanner.routes import router as scanner_router
from src.pricing.routes import router as pricing_router
from src.collection.routes import router as collection_router
from src.alerts.routes import router as alerts_router
from src.exports.routes import router as exports_router

app = FastAPI(title=settings.app_name, version="1.0.0", docs_url="/docs", redoc_url="/redoc")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix=settings.api_v1_prefix)
app.include_router(catalog_router, prefix=settings.api_v1_prefix)
app.include_router(scanner_router, prefix=settings.api_v1_prefix)
app.include_router(pricing_router, prefix=settings.api_v1_prefix)
app.include_router(collection_router, prefix=settings.api_v1_prefix)
app.include_router(alerts_router, prefix=settings.api_v1_prefix)
app.include_router(exports_router, prefix=settings.api_v1_prefix)


@app.on_event("startup")
def startup():
    """Create tables on startup (for dev; use Alembic in prod)."""
    settings.validate_secret_key()
    Base.metadata.create_all(bind=engine)


@app.get("/health")
def health():
    return {"status": "ok", "service": settings.app_name}


@app.get("/")
def root():
    return {"message": "TCG Ledger API", "docs": "/docs"}
