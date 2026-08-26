import api from "../utils/axios";

export const createPaymentOrder = async (plan) => {
  try {
    const { data } = await api.post(
      "/api/payment/create-order",
      {
        plan: plan.key,
      }
    );

    return data;

  } catch (error) {
    console.error(
      "CREATE PAYMENT ORDER ERROR:",
      error
    );

    return {
      success: false,
      message:
        error?.response?.data?.message ||
        "Unable to create payment order",
    };
  }
};


export const verifyPayment = async (
  paymentData
) => {
  try {
    const { data } = await api.post(
      "/api/payment/verify",
      paymentData
    );

    return data;

  } catch (error) {
    console.error(
      "VERIFY PAYMENT ERROR:",
      error
    );

    return {
      success: false,
      message:
        error?.response?.data?.message ||
        "Payment verification failed",
    };
  }
};