// src/pages/ProjectDetailPage/ProjectDetailPage.jsx

import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { 
  getProjectDetails, 
  updateProject, 
  deleteProject 
} from "../../services/project_api";
// MODIFIED: Import getMyRoleInTeam to check user permissions
import { getMyRoleInTeam } from "../../services/teams_api"; 
import CreateMilestoneModal from "../CreateMilestoneModal/CreateMilestoneModal";
import "./ProjectDetailPage.css";

const ProjectDetailPage = () => {
  const [project, setProject] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  // MODIFIED: Add state to hold the user's role
  const [userRole, setUserRole] = useState("member"); 
  const [showCreateMilestoneModal, setShowCreateMilestoneModal] = useState(false);
  const [showEditProjectModal, setShowEditProjectModal] = useState(false);
  const [isEditingProject, setIsEditingProject] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { projectId } = useParams();
  const navigate = useNavigate();
  
  const [editProjectForm, setEditProjectForm] = useState({
    name: "",
    description: "",
    due_date: "",
    status: "active"
  });

  // MODIFIED: This effect now fetches both project details and user role
  useEffect(() => {
    const fetchProjectAndUserData = async () => {
      if (!projectId) return;
      setIsLoading(true);
      try {
        const projectData = await getProjectDetails(projectId);
        setProject(projectData);
        // After getting project data, fetch the user's role for that team
        if (projectData.team_id) {
          const roleData = await getMyRoleInTeam(projectData.team_id);
          setUserRole(roleData.role); 
        }
      } catch (err) {
        setError("Failed to load project details. It may not exist or you may not have access.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchProjectAndUserData();
  }, [projectId]);

  const showTemporaryMessage = (msg, isError = false) => {
    setMessage(isError ? "" : msg);
    setError(isError ? msg : "");
    setTimeout(() => { setMessage(""); setError(""); }, 3000);
  };

  const handleMilestoneCreated = (newMilestone) => {
    setProject(prev => ({
      ...prev,
      milestones: [...(prev.milestones || []), newMilestone]
    }));
  };

  const handleEditProject = () => {
    setEditProjectForm({
      name: project.name,
      description: project.description || "",
      due_date: project.due_date ? project.due_date.split('T')[0] : "",
      status: project.status
    });
    setShowEditProjectModal(true);
  };

  const handleEditProjectSubmit = async (e) => {
    e.preventDefault();
    if (!editProjectForm.name.trim()) {
      showTemporaryMessage("Please enter a project name.", true);
      return;
    }
    setIsEditingProject(true);
    try {
      const projectData = {
        name: editProjectForm.name.trim(),
        description: editProjectForm.description.trim() || null,
        due_date: editProjectForm.due_date || null,
        status: editProjectForm.status
      };
      const updatedProject = await updateProject(projectId, projectData);
      setProject(updatedProject);
      showTemporaryMessage(`Project "${editProjectForm.name}" updated successfully!`);
      setShowEditProjectModal(false);
    } catch (err) {
      showTemporaryMessage(err.response?.data?.detail || "Failed to update project.", true);
    } finally {
      setIsEditingProject(false);
    }
  };

  const handleDeleteProject = async () => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete the project "${project.name}"? This action cannot be undone.`
    );
    if (!confirmDelete) return;
    setIsDeleting(true);
    try {
      await deleteProject(projectId);
      showTemporaryMessage("Project deleted successfully.");
      setTimeout(() => {
        navigate(`/teams/${project.team_id}`);
      }, 1500);
    } catch (err) {
      showTemporaryMessage(err.response?.data?.detail || "Failed to delete project.", true);
    } finally {
      setIsDeleting(false);
    }
  };

  const resetEditProjectModal = () => {
    setShowEditProjectModal(false);
  };

  // MODIFIED: This function now uses the fetched user role
  const canManageProject = () => {
    return userRole === 'admin';
  };

  const formatMilestoneStatus = (status) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getMilestoneStatusClass = (milestone) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = milestone.due_date ? new Date(milestone.due_date) : null;
    if(dueDate) dueDate.setHours(0,0,0,0);
    if (milestone.status === 'completed') return 'completed';
    if (dueDate && dueDate < today) return 'overdue';
    return milestone.status;
  };

  if (isLoading) {
    return <div className="project-detail-loading">Loading Project...</div>;
  }
  if (error) {
    return <div className="project-detail-error">{error}</div>;
  }
  if (!project) {
    return <div className="project-detail-loading">Initializing project...</div>;
  }

  return (
    <div className="project-detail-page">
      <header className="project-header">
        <div className="header-content">
          <div className="header-top-bar">
             <Link to={`/teams/${project.team_id}`} className="back-link">
              ← Back to Team
            </Link>
          </div>
          <div className="project-title-section">
            <h1>{project.name}</h1>
            <p>{project.description || "No description provided."}</p>
            <div className="project-meta">
              <span className={`project-status-badge ${project.status}`}>
                {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
              </span>
              {project.due_date && (
                <span className="project-due-date">
                  Due: {new Date(project.due_date).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="project-main-content">
        {message && <div className="feedback-message success">{message}</div>}
        {error && <div className="feedback-message error">{error}</div>}
        
        <div className="milestones-section">
          <div className="section-header">
            <h2>Project Milestones</h2>
            {/* MODIFIED: Conditionally render the button */}
            {canManageProject() && (
              <button 
                className="btn btn-primary"
                onClick={() => setShowCreateMilestoneModal(true)}
              >
                Add Milestone
              </button>
            )}
          </div>
          
          {project.milestones && project.milestones.length > 0 ? (
            <div className="milestones-list">
              {project.milestones.map(milestone => (
                <div key={milestone.id} className="milestone-card">
                  <span className={`milestone-status ${getMilestoneStatusClass(milestone)}`}>
                    {formatMilestoneStatus(getMilestoneStatusClass(milestone))}
                  </span>
                  <h3>{milestone.name}</h3>
                  {milestone.description && (
                    <p className="milestone-description">{milestone.description}</p>
                  )}
                  <div className="milestone-footer">
                    {milestone.due_date && (
                      <p className="milestone-due-date">
                        Due: {new Date(milestone.due_date).toLocaleDateString()}
                      </p>
                    )}
                    {/* Future milestone edit/delete buttons would go here, also wrapped in canManageProject() */}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">🎯</div>
              <h3>No milestones yet</h3>
              <p>Add milestones to track important project goals and deadlines</p>
              {/* MODIFIED: Conditionally render the button */}
              {canManageProject() && (
                <button 
                  className="btn btn-primary"
                  onClick={() => setShowCreateMilestoneModal(true)}
                >
                  Add First Milestone
                </button>
              )}
            </div>
          )}
        </div>

        <div className="tasks-section-placeholder">
          <h2>Tasks</h2>
          <div className="kanban-board-placeholder">
            <p>The Kanban board for tasks will be implemented in the next module.</p>
          </div>
        </div>

        {/* MODIFIED: Conditionally render the entire management section */}
        {canManageProject() && (
          <div className="project-management-section">
            <div className="section-header">
              <h2>Project Management</h2>
            </div>
            <div className="management-actions">
              <div className="management-card">
                <div className="management-info">
                  <h3>Edit Project</h3>
                  <p>Update project name, description, status, and due date</p>
                </div>
                <button 
                  className="btn btn-secondary"
                  onClick={handleEditProject}
                  disabled={isDeleting}
                >
                  Edit Project
                </button>
              </div>
              <div className="management-card danger">
                <div className="management-info">
                  <h3>Delete Project</h3>
                  <p>Permanently delete this project and all its data</p>
                </div>
                <button 
                  className="btn btn-danger"
                  onClick={handleDeleteProject}
                  disabled={isDeleting}
                >
                  {isDeleting ? "Deleting..." : "Delete Project"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* This modal will only be opened by a button that is now admin-only */}
      <CreateMilestoneModal
        isOpen={showCreateMilestoneModal}
        onClose={() => setShowCreateMilestoneModal(false)}
        projectId={projectId}
        onMilestoneCreated={handleMilestoneCreated}
        showTemporaryMessage={showTemporaryMessage}
      />

      {/* This modal will only be opened by a button that is now admin-only */}
      {showEditProjectModal && (
        <div className="modal-backdrop" onClick={() => setShowEditProjectModal(false)}>
          <div className="modal-content edit-project-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Project</h2>
              <button className="modal-close" onClick={resetEditProjectModal}>×</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleEditProjectSubmit} className="project-form">
                 {/* Form content remains the same */}
                 <div className="form-group">
                  <label htmlFor="edit-project-name">Project Name *</label>
                  <input
                    id="edit-project-name"
                    type="text"
                    value={editProjectForm.name}
                    onChange={(e) => setEditProjectForm(prev => ({ ...prev, name: e.target.value }))}
                    className="form-input"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="edit-project-description">Description</label>
                  <textarea
                    id="edit-project-description"
                    value={editProjectForm.description}
                    onChange={(e) => setEditProjectForm(prev => ({ ...prev, description: e.target.value }))}
                    className="form-textarea"
                    rows="4"
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="edit-project-due-date">Due Date</label>
                    <input
                      id="edit-project-due-date"
                      type="date"
                      value={editProjectForm.due_date}
                      onChange={(e) => setEditProjectForm(prev => ({ ...prev, due_date: e.target.value }))}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="edit-project-status">Status</label>
                    <select
                      id="edit-project-status"
                      value={editProjectForm.status}
                      onChange={(e) => setEditProjectForm(prev => ({ ...prev, status: e.target.value }))}
                      className="form-select"
                    >
                      <option value="active">Active</option>
                      <option value="on_hold">On Hold</option>
                      <option value="completed">Completed</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                </div>
                <div className="form-actions">
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={resetEditProjectModal}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={isEditingProject || !editProjectForm.name.trim()}
                  >
                    {isEditingProject ? "Updating..." : "Update Project"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetailPage;