import dotenv from "dotenv"
dotenv.config()

export const deductCredits = async (
  userId,
  amount
) => {
  const response = await fetch(
    `${process.env.AUTH_SERVICE_URL}/credits/deduct`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        amount,userId
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    const error = new Error(
      data?.message ||
      "Unable to deduct credits"
    );

    error.status = response.status;

    throw error;
  }

  return data;
};