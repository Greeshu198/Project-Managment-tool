from fastapi import FastAPI
from app.api.v1 import users
from app.db import Base, engine

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Project Management Tool API")

# Include routes
app.include_router(users.router, prefix="/users", tags=["Users"])

@app.get("/")
def read_root():
    return {"Hello": "World"}
