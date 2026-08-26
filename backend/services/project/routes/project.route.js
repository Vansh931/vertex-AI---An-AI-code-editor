import express from "express";
import { createProject, deleteProject, getProjectById, getProjects, getStarredProjects, toggleProjectStar } from "../controllers/project.controller.js";


const router = express.Router();

router.post("/", createProject);

router.get("/",getProjects);

router.get("/starred",getStarredProjects);
router.get("/:id",getProjectById);

// Toggle starred
router.patch(
  "/:id/star",
  toggleProjectStar
);


// Delete project
router.delete(
  "/:id",
  deleteProject
);
export default router;