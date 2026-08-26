


// =====================================================
// PLANS
// =====================================================

import razorpay from "../config/razorpay.js";
import Payment from "../models/payment.model.js";
import { addCreditsToUser } from "../utils/updateCredits.js";
import crypto from "crypto"
const PLANS = {
  pro: {
    name: "Pro",
    amount: 29900,
    credits: 500,
  },

  team: {
    name: "Team",
    amount: 79900,
    credits: 2000,
  },
};


// =====================================================
// CREATE ORDER
// =====================================================

export const createOrder =
  async (req, res) => {

    try {

      const userId =req.headers["x-user-id"];

      if (!userId) {
        return res.status(401).json({
          success: false,
          message:
            "User ID is required",
        });
      }

      const {
        plan,
      } = req.body;

      const selectedPlan =
        PLANS[plan];

      if (!selectedPlan) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid plan",
        });
      }


      // ===============================================
      // CREATE RAZORPAY ORDER
      // ===============================================

      const order =
        await razorpay.orders.create({
          amount:
            selectedPlan.amount,

          currency: "INR",

          receipt:
            `receipt_${Date.now()}`,

          notes: {
            userId,
            plan,
          },
        });


      // ===============================================
      // SAVE PAYMENT
      // ===============================================

      const payment =
        await Payment.create({
          userId,

          plan,

          amount:
            selectedPlan.amount,

          credits:
            selectedPlan.credits,

          currency: "INR",

          razorpayOrderId:
            order.id,

          status:
            "created",
        });


      return res.status(201).json({
        success: true,

        order: {
          id:
            order.id,

          amount:
            order.amount,

          currency:
            order.currency,
        },

        plan: {
          name:
            selectedPlan.name,

          credits:
            selectedPlan.credits,
        },

        keyId:
          process.env
            .RAZORPAY_KEY_ID,
      });

    } catch (error) {

      console.error(
        "CREATE ORDER ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          error.message,
      });
    }
  };


// =====================================================
// VERIFY PAYMENT
// =====================================================

export const verifyPayment =
  async (req, res) => {

    try {

      const userId =req.headers["x-user-id"];

      if (!userId) {
        return res.status(401).json({
          success: false,
          message:
            "User ID is required",
        });
      }


      const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
      } = req.body;


      if (
        !razorpay_order_id ||
        !razorpay_payment_id ||
        !razorpay_signature
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Payment details are required",
        });
      }


      // ===============================================
      // FIND OUR PAYMENT
      // ===============================================

      const payment =
        await Payment.findOne({
          razorpayOrderId:
            razorpay_order_id,

          userId,
        });


      if (!payment) {
        return res.status(404).json({
          success: false,
          message:
            "Payment order not found",
        });
      }


      // ===============================================
      // IDEMPOTENCY
      // ===============================================

      if (
        payment.status === "paid"
      ) {
        return res.json({
          success: true,

          message:
            "Payment already verified",

          credits:
            payment.credits,
        });
      }


      // ===============================================
      // SIGNATURE
      // ===============================================

      const generatedSignature =
        crypto
          .createHmac(
            "sha256",

            process.env
              .RAZORPAY_KEY_SECRET
          )
          .update(
            `${razorpay_order_id}|${razorpay_payment_id}`
          )
          .digest("hex");


      if (
        generatedSignature !==
        razorpay_signature
      ) {

        payment.status =
          "failed";

        await payment.save();

        return res.status(400).json({
          success: false,

          message:
            "Invalid payment signature",
        });
      }


      // ===============================================
      // UPDATE PAYMENT
      // ===============================================

      payment.status =
        "paid";

      payment.razorpayPaymentId =
        razorpay_payment_id;

      await payment.save();


      // ===============================================
      // UPDATE USER
      // ===============================================

      await addCreditsToUser({
        userId,

        plan:
          payment.plan,

        credits:
          payment.credits,
      });


      return res.json({
        success: true,

        message:
          "Payment verified successfully",

        plan:
          payment.plan,

        credits:
          payment.credits,
      });

    } catch (error) {

      console.error(
        "VERIFY PAYMENT ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          error.message,
      });
    }
  };