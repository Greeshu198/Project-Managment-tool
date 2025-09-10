from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1 import users
from app.db import Base, engine

# Create database tables
# In production, use Alembic migrations instead
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Project Management Tool API")

# --- CORS middleware setup ---
origins = [
    "http://localhost:5173",  # React dev server
    # You can add more origins if needed
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,      # or ["*"] for development only
    allow_credentials=True,
    allow_methods=["*"],        # allow GET, POST, PUT, DELETE, etc.
    allow_headers=["*"],        # allow Authorization, Content-Type, etc.
)

# --- Include the user routes ---
app.include_router(users.router, prefix="/users", tags=["Users"])

# Root endpoint for basic health check
@app.get("/")
def read_root():
    return {"message": "Welcome to the Project Management Tool API"}
