# Vercel entrypoint for FastAPI
from backend.main import app

# Export the app instance for Vercel
__all__ = ["app"]
