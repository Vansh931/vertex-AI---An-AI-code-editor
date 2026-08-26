import express from "express";

import {
  createOrder,
  verifyPayment,
} from "../controllers/payment.controller.js";

const router =
  express.Router();


// CREATE ORDER

router.post(
  "/create-order",
  createOrder
);


// VERIFY PAYMENT

router.post(
  "/verify",
  verifyPayment
);


export default router;