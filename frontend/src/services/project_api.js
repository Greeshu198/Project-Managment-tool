// src/services/project_api.js (No Changes)

import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:8000",
});

API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

// --- Project API Functions ---
export const createProjectForTeam = async (teamId, projectData) => {
  const res = await API.post(`/projects/teams/${teamId}/projects`, projectData);
  return res.data;
};
export const getProjectsForTeam = async (teamId) => {
  const res = await API.get(`/projects/teams/${teamId}/projects`);
  return res.data;
};
export const getProjectDetails = async (projectId) => {
  const res = await API.get(`/projects/${projectId}`);
  return res.data;
};
export const updateProject = async (projectId, projectData) => {
  const res = await API.put(`/projects/${projectId}`, projectData);
  return res.data;
};
export const deleteProject = async (projectId) => {
  const res = await API.delete(`/projects/${projectId}`);
  return res.status === 204;
};


// --- Milestone API Functions ---
export const createMilestone = async (projectId, milestoneData) => {
  const res = await API.post(`/projects/${projectId}/milestones`, milestoneData);
  return res.data;
};

export const getMilestonesForProject = async (projectId) => {
  const res = await API.get(`/projects/${projectId}/milestones`);
  return res.data;
};

export const updateMilestone = async (projectId, milestoneId, milestoneData) => {
  const res = await API.put(`/projects/${projectId}/milestones/${milestoneId}`, milestoneData);
  return res.data;
};

export const deleteMilestone = async (projectId, milestoneId) => {
  const res = await API.delete(`/projects/${projectId}/milestones/${milestoneId}`);
  return res.status === 204;
};