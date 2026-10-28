"""
Digital Image Forensics & Authenticity Analysis Engine
Main FastAPI Application Entrypoint
"""

from contextlib import asynccontextmanager
import logging
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.services.model_registry import model_registry
from app.api.routes.health import router as health_router
from app.api.routes.models import router as models_router
from app.api.routes.analysis import router as analysis_router
from app.api.routes.report import router as report_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("forensics.app")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Load forensic neural models into memory once
    logger.info("Starting VeriSight Forensics Engine...")
    logger.info(f"Targeting device: {model_registry.device}")
    try:
        model_registry.load_all_models()
    except Exception as e:
        logger.error(f"Error during model loading on startup: {e}")
        
    yield
    
    # Shutdown
    logger.info("Shutting down VeriSight Forensics Engine...")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Enterprise-grade Digital Image Authenticity & Forgery Inspection API Engine",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global safe exception handler: prevent sensitive internal path leakage
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled server error on {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "detail": "An internal error occurred during forensic inspection.",
            "type": exc.__class__.__name__
        }
    )

# Root status
@app.get("/")
def root():
    return {
        "engine": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "operational",
        "docs_url": "/docs"
    }

# Include API Routers
app.include_router(health_router, prefix=settings.API_V1_STR)
app.include_router(models_router, prefix=settings.API_V1_STR)
app.include_router(analysis_router, prefix=settings.API_V1_STR)
app.include_router(report_router, prefix=settings.API_V1_STR)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=False)
