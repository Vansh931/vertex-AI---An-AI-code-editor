import express from "express";

import {
  chatWithAIStream,
} from "../controllers/ai.controller.js";

const router =
  express.Router();

router.post(
  "/chat/stream",
  chatWithAIStream
);

export default router;