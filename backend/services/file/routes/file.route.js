import express from "express";


import {
  createRootFolder,
  getProjectTree,
  getFile,
  createFolder,
  createFile,
  updateFile,
  deleteFile,
} from "../controllers/file.controller.js";

const router = express.Router();

router.post("/root", createRootFolder);

router.get("/tree/:projectId", getProjectTree);

router.get("/:id",getFile);

router.post(
    "/folder",
    createFolder
);

router.post(
    "/file",
    createFile
);

router.put(
    "/:id",
    updateFile
);

router.delete(
    "/:id",
    deleteFile
);

export default router;