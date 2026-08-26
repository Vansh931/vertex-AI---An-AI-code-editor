import dotenv from "dotenv";

dotenv.config();

export const addCreditsToUser =
  async ({
    userId,
    plan,
    credits,
  }) => {

    const response =
      await fetch(
        `${process.env.AUTH_SERVICE_URL}/credits/add`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body: JSON.stringify({
            userId,
            plan,
            credits,
          }),
        }
      );

    const data =
      await response.json();

    if (!response.ok) {
      throw new Error(
        data?.message ||
          "Failed to update user credits"
      );
    }

    return data;
  };