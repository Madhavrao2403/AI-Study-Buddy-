from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.routes import auth, users, courses, documents, assessment, quizzes, tutor, study_plan, progress, mistakes, adaptive
import os
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="AI Adaptive Study Buddy",
    description="Personalized AI-powered learning platform with adaptive learning loops",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(courses.router)
app.include_router(documents.router)
app.include_router(assessment.router)
app.include_router(quizzes.router)
app.include_router(tutor.router)
app.include_router(study_plan.router)
app.include_router(progress.router)
app.include_router(mistakes.router)
app.include_router(adaptive.router)

# Ensure upload directory exists
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)


@app.get("/")
def root():
    return {"message": "AI Adaptive Study Buddy API", "status": "running"}


@app.get("/health")
def health():
    return {"status": "healthy"}
