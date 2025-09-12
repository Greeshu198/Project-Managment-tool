import { useState, useEffect } from "react";
import { createMilestone, updateMilestone } from "../../services/project_api"; // 1. Import updateMilestone
import "./CreateMilestoneModal.css";

const MilestoneFormModal = ({
  isOpen,
  onClose,
  projectId,
  onSave, // 2. Renamed from onMilestoneCreated for clarity
  showTemporaryMessage,
  existingMilestone = null, // 3. New prop to accept an existing milestone for editing
}) => {
  const defaultFormState = {
    name: "",
    description: "",
    due_date: "",
    status: "upcoming",
  };

  const [milestoneForm, setMilestoneForm] = useState(defaultFormState);
  const [isSaving, setIsSaving] = useState(false); // 4. Renamed from isCreating

  // 5. This effect pre-fills the form when in "edit" mode
  useEffect(() => {
    if (isOpen) {
      if (existingMilestone) {
        // If an existing milestone is passed, populate the form for editing
        setMilestoneForm({
          name: existingMilestone.name || "",
          description: existingMilestone.description || "",
          due_date: existingMilestone.due_date ? existingMilestone.due_date.split("T")[0] : "", // Format date for input
          status: existingMilestone.status || "upcoming",
        });
      } else {
        // Otherwise, reset the form for creation
        setMilestoneForm(defaultFormState);
      }
    }
  }, [existingMilestone, isOpen]); // Re-run effect if the milestone or modal visibility changes

  const handleClose = () => {
    setMilestoneForm(defaultFormState); // Reset form on close
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!milestoneForm.name.trim()) {
      showTemporaryMessage("Please enter a milestone name.", true);
      return;
    }
    if (!milestoneForm.due_date) {
      showTemporaryMessage("A due date is required for a milestone.", true);
      return;
    }

    setIsSaving(true);

    const milestoneData = {
      name: milestoneForm.name.trim(),
      description: milestoneForm.description.trim() || null,
      due_date: milestoneForm.due_date,
      status: milestoneForm.status,
    };

    try {
      let savedMilestone;
      // 6. Conditional Logic: Update if editing, create if not
      if (existingMilestone) {
        // --- UPDATE LOGIC ---
        savedMilestone = await updateMilestone(projectId, existingMilestone.id, milestoneData);
        showTemporaryMessage(`Milestone "${savedMilestone.name}" updated successfully!`);
      } else {
        // --- CREATE LOGIC ---
        savedMilestone = await createMilestone(projectId, milestoneData);
        showTemporaryMessage(`Milestone "${savedMilestone.name}" created successfully!`);
      }

      onSave(savedMilestone); // 7. Callback to update the parent component's state
      handleClose();

    } catch (err) {
      const action = existingMilestone ? "update" : "create";
      showTemporaryMessage(err.response?.data?.detail || `Failed to ${action} milestone.`, true);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  // 8. Dynamic UI text based on mode (Create vs. Edit)
  const isEditMode = !!existingMilestone;

  return (
    <div className="modal-backdrop" onClick={handleClose}>
      <div className="modal-content create-milestone-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEditMode ? "Edit Milestone" : "Create New Milestone"}</h2>
          <button className="modal-close" onClick={handleClose}>×</button>
        </div>
        <div className="modal-body">
          <form onSubmit={handleSubmit} className="milestone-form">
            <div className="form-group">
              <label htmlFor="milestone-name">Milestone Name *</label>
              <input
                id="milestone-name"
                type="text"
                placeholder="e.g., Complete UI/UX Design"
                value={milestoneForm.name}
                onChange={(e) => setMilestoneForm((prev) => ({ ...prev, name: e.target.value }))}
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="milestone-description">Description</label>
              <textarea
                id="milestone-description"
                placeholder="Add more details about this milestone..."
                value={milestoneForm.description}
                onChange={(e) => setMilestoneForm((prev) => ({ ...prev, description: e.target.value }))}
                className="form-textarea"
                rows="3"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="milestone-due-date">Due Date *</label>
                <input
                  id="milestone-due-date"
                  type="date"
                  value={milestoneForm.due_date}
                  onChange={(e) => setMilestoneForm((prev) => ({ ...prev, due_date: e.target.value }))}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="milestone-status">Status</label>
                <select
                  id="milestone-status"
                  value={milestoneForm.status}
                  onChange={(e) => setMilestoneForm((prev) => ({ ...prev, status: e.target.value }))}
                  className="form-select"
                >
                  <option value="upcoming">Upcoming</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>

            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={handleClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={isSaving}>
                {isSaving ? (isEditMode ? "Saving..." : "Creating...") : (isEditMode ? "Save Changes" : "Create Milestone")}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default MilestoneFormModal;