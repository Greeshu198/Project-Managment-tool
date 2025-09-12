from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Import your API routers
from app.api.v1 import users, teams, friends, projects # 1. Import the new projects router
from app.db import Base, engine

# This line is for initial development.
# In a real production environment, you should rely solely on Alembic migrations.
# Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="TaskMaster API",
    description="The backend API for the TaskMaster Project Management Tool.",
    version="1.0.0"
)

# --- CORS middleware setup ---
origins = [
    "http://localhost:5173",  # React default development server
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Include the API routers ---
app.include_router(users.router, prefix="/users", tags=["User Authentication & Management"])
app.include_router(teams.router, prefix="/teams", tags=["Teams & Collaboration"])
app.include_router(friends.router, prefix="/friends", tags=["Friends & Social"])
app.include_router(projects.router, prefix="/projects", tags=["Project Management"]) # 2. Include the new projects router


# Root endpoint for a basic API health check
@app.get("/", tags=["Health Check"])
def read_root():
    """
    A simple health check endpoint to confirm the API is running.
    """
    return {"status": "ok", "message": "Welcome to the TaskMaster API"}

