import Project from "../models/project.model.js";


// =====================================================
// CREATE PROJECT
// =====================================================

export const createProject = async (req, res) => {
  try {

    const userId =
      req.headers["x-user-id"];

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User ID is required",
      });
    }

    const project =
      await Project.create({
        owner: userId,
        name: req.body.name,
        description:
          req.body.description || "",
      });

    return res.status(201).json({
      success: true,
      project,
    });

  } catch (error) {

    return res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};


// =====================================================
// GET ALL PROJECTS
// =====================================================

export const getProjects = async (req, res) => {
  try {

    const userId =
      req.headers["x-user-id"];

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User ID is required",
      });
    }

    const projects =
      await Project.find({
        owner: userId,
      }).sort({
        updatedAt: -1,
      });

    return res.json({
      success: true,
      projects,
    });

  } catch (error) {

    return res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};


// =====================================================
// GET PROJECT BY ID
// =====================================================

export const getProjectById = async (req, res) => {
  try {

    const userId =
      req.headers["x-user-id"];

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User ID is required",
      });
    }

    const project =
      await Project.findOne({
        _id: req.params.id,
        owner: userId,
      });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    project.lastOpenedAt =
      new Date();

    await project.save();

    return res.json({
      success: true,
      project,
    });

  } catch (error) {

    return res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};


// =====================================================
// DELETE PROJECT
// =====================================================

export const deleteProject = async (req, res) => {
  try {

    const userId =
      req.headers["x-user-id"];

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User ID is required",
      });
    }

    const project =
      await Project.findOneAndDelete({
        _id: req.params.id,
        owner: userId,
      });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    return res.json({
      success: true,
      message: "Project deleted successfully",
      projectId: project._id,
    });

  } catch (error) {

    return res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};


// =====================================================
// TOGGLE STARRED
// =====================================================

export const toggleProjectStar = async (req, res) => {
  try {

    const userId =
      req.headers["x-user-id"];

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User ID is required",
      });
    }

    const project =
      await Project.findOne({
        _id: req.params.id,
        owner: userId,
      });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    project.starred =
      !project.starred;

    await project.save();

    return res.json({
      success: true,

      message:
        project.starred
          ? "Project starred successfully"
          : "Project unstarred successfully",

      project,
    });

  } catch (error) {

    return res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};


// =====================================================
// GET STARRED PROJECTS
// =====================================================

export const getStarredProjects = async (req, res) => {
  try {

    const userId =
      req.headers["x-user-id"];

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User ID is required",
      });
    }

    const projects =
      await Project.find({
        owner: userId,
        starred: true,
      }).sort({
        updatedAt: -1,
      });

    return res.json({
      success: true,
      projects,
    });

  } catch (error) {

    return res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};