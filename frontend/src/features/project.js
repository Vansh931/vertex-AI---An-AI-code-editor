import api from "../utils/axios";


// =====================================================
// CREATE PROJECT
// =====================================================

export const createProject = async (projectData) => {
  try {

    const { data } =
      await api.post(
        "/api/project",
        projectData
      );

    return data;

  } catch (error) {

    console.log(
      "Create project error:",
      error
    );

    return null;
  }
};


// =====================================================
// GET ALL PROJECTS
// =====================================================

export const getProjects = async () => {
  try {

    const { data } =
      await api.get(
        "/api/project"
      );

    return data;

  } catch (error) {

    console.log(
      "Get projects error:",
      error
    );

    return null;
  }
};


// =====================================================
// GET PROJECT BY ID
// =====================================================

export const getProjectById = async (id) => {
  try {

    const { data } =
      await api.get(
        `/api/project/${id}`
      );

    return data;

  } catch (error) {

    console.log(
      "Get project error:",
      error
    );

    return null;
  }
};


// =====================================================
// DELETE PROJECT
// =====================================================

export const deleteProject = async (id) => {
  try {

    const { data } =
      await api.delete(
        `/api/project/${id}`
      );

    return data;

  } catch (error) {

    console.log(
      "Delete project error:",
      error
    );

    return null;
  }
};


// =====================================================
// TOGGLE STARRED
// =====================================================

export const toggleProjectStar = async (id) => {
  try {

    const { data } =
      await api.patch(
        `/api/project/${id}/star`
      );

    return data;

  } catch (error) {

    console.log(
      "Toggle project star error:",
      error
    );

    return null;
  }
};


// =====================================================
// GET STARRED PROJECTS
// =====================================================

export const getStarredProjects = async () => {
  try {

    const { data } =
      await api.get(
        "/api/project/starred"
      );

    return data;

  } catch (error) {

    console.log(
      "Get starred projects error:",
      error
    );

    return null;
  }
};