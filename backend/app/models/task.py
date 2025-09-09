import enum
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Enum, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db import Base

class TaskStatusEnum(enum.Enum):
    todo = "To Do"
    in_progress = "In Progress"
    done = "Done"

class TaskPriorityEnum(enum.Enum):
    low = "Low"
    medium = "Medium"
    high = "High"

class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True, nullable=False)
    description = Column(Text, nullable=True)
    status = Column(Enum(TaskStatusEnum), nullable=False, default=TaskStatusEnum.todo)
    priority = Column(Enum(TaskPriorityEnum), nullable=False, default=TaskPriorityEnum.medium)
    due_date = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Foreign Keys
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    assignee_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    # Relationships
    project = relationship("Project", back_populates="tasks")
    assignee = relationship("User", back_populates="tasks_assigned", foreign_keys=[assignee_id])
    comments = relationship("Comment", back_populates="task", cascade="all, delete-orphan")
    attachments = relationship("Attachment", back_populates="task", cascade="all, delete-orphan")

class Comment(Base):
    __tablename__ = "comments"
    
    id = Column(Integer, primary_key=True, index=True)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Foreign Keys
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    task_id = Column(Integer, ForeignKey("tasks.id"), nullable=False)

    # Relationships
    user = relationship("User", back_populates="comments")
    task = relationship("Task", back_populates="comments")

class Attachment(Base):
    __tablename__ = "attachments"

    id = Column(Integer, primary_key=True, index=True)
    file_name = Column(String, nullable=False)
    file_path = Column(String, nullable=False) # This would store the URL from a service like AWS S3
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Foreign Keys
    uploader_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    task_id = Column(Integer, ForeignKey("tasks.id"), nullable=False)

    # Relationships
    uploader = relationship("User", back_populates="attachments")
    task = relationship("Task", back_populates="attachments")