import express from "express"
import { addCredits, deductCredits, login, logOut } from "../controllers/auth.controller.js"


const router=express.Router()

router.post("/login",login)
router.get("/logout",logOut)
router.post(
  "/credits/deduct",
  deductCredits
);
router.post(
  "/credits/add",
  addCredits
);
export default router