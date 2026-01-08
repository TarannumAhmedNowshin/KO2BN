from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from database import init_db, get_db
from api import auth, translation, glossary, projects, admin, analytics, sessions, archive
from api.websocket import handle_websocket
from config import settings

# Initialize FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    description="Unified AI Communication Platform for Korean-Bangla Collaboration",
    version="1.0.0"
)

# CORS middleware for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # React dev servers
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Initialize database on startup
@app.on_event("startup")
def on_startup():
    """Create database tables on app startup"""
    init_db()
    print("✅ Database initialized")
    print(f"✅ {settings.APP_NAME} is running")


# Health check endpoint
@app.get("/")
def root():
    """Root endpoint - API health check"""
    return {
        "message": "KO2BN API is running",
        "status": "healthy",
        "version": "1.0.0"
    }


@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {"status": "ok"}


# Include routers
app.include_router(auth.router)
app.include_router(translation.router)
app.include_router(glossary.router)
app.include_router(projects.router)
app.include_router(admin.router)
app.include_router(analytics.router)
app.include_router(sessions.router)
app.include_router(archive.router)


# WebSocket endpoint for real-time translation
@app.websocket("/ws/session/{session_code}")
async def websocket_endpoint(websocket: WebSocket, session_code: str):
    """WebSocket endpoint for real-time meeting translation"""
    db = next(get_db())
    try:
        await handle_websocket(websocket, session_code, db)
    finally:
        db.close()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
