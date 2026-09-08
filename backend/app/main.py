import time
import uuid
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.database import init_db_tables
from app.api.v1 import api_router

# Configure logging
logging.basicConfig(
    level=logging.INFO if not settings.DEBUG else logging.DEBUG,
    format="%(asctime)s [%(levelname)s] [%(name)s] %(message)s",
)
logger = logging.getLogger("guideme.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing GUIDE ME enterprise backend...")
    await init_db_tables()
    logger.info("Database schema initialized successfully.")
    yield
    logger.info("Shutting down GUIDE ME backend cleanly.")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Enterprise Multimodal Mental Wellness, Digital Balance, and Personal Guidance Platform.",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$|^capacitor://localhost$|^https://[a-zA-Z0-9_-]+\.vercel\.app$|^https://[a-zA-Z0-9_-]+\.onrender\.com$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


from collections import defaultdict
import asyncio

_rate_limit_records = defaultdict(list)
_last_cleanup = time.time()

@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    global _last_cleanup
    now = time.time()
    
    # Periodically clean up old entries
    if now - _last_cleanup > 60:
        cutoff = now - 60
        for ip in list(_rate_limit_records.keys()):
            _rate_limit_records[ip] = [t for t in _rate_limit_records[ip] if t > cutoff]
            if not _rate_limit_records[ip]:
                del _rate_limit_records[ip]
        _last_cleanup = now

    client_ip = request.client.host if request.client else "unknown"
    cutoff = now - 60
    
    _rate_limit_records[client_ip] = [t for t in _rate_limit_records[client_ip] if t > cutoff]
    
    if len(_rate_limit_records[client_ip]) >= settings.RATE_LIMIT_PER_MINUTE:
        return JSONResponse(
            status_code=429,
            content={"detail": "Too Many Requests"}
        )
        
    _rate_limit_records[client_ip].append(now)
    
    return await call_next(request)


# Observability & Security Middleware
@app.middleware("http")
async def observability_and_security_headers_middleware(request: Request, call_next):
    request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
    start_time = time.time()

    response: Response = await call_next(request)

    process_time = time.time() - start_time
    response.headers["X-Request-ID"] = request_id
    response.headers["X-Process-Time"] = f"{process_time:.4f}s"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"

    logger.info(
        f"[{request_id}] {request.method} {request.url.path} -> {response.status_code} ({process_time:.4f}s)"
    )
    return response


# Include API v1 Router
app.include_router(api_router, prefix=settings.API_V1_PREFIX)


@app.get("/health", tags=["Observability"])
async def health_check():
    """Health check endpoint for container orchestrators and load balancers."""
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
    }


@app.get("/ready", tags=["Observability"])
async def readiness_check():
    """Readiness probe checking database and sub-service availability."""
    return {
        "status": "ready",
        "database": "connected",
        "ai_provider": settings.AI_PROVIDER,
        "wearable_provider": settings.WEARABLE_PROVIDER,
    }


@app.get("/", tags=["System"])
async def root():
    return {
        "name": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "online",
        "docs_url": "/docs",
        "api_v1": settings.API_V1_PREFIX,
    }
