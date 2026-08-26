import React from "react";
import { motion } from "framer-motion";
import {
  Check,
  Zap,
  Sparkles,
  Crown,
  ArrowLeft,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPaymentOrder, verifyPayment } from "../features/payment";

const plans = [
  {
    key: "free",
    name: "Free",
    description: "For trying out the AI IDE.",
    price: "₹0",
    period: "/month",
    credits: "100 AI credits",
    icon: Zap,
    features: [
      "50 AI credits / month",
      "AI code generation",
      "Project editor",
      "HTML / CSS / JS preview",
      "React preview",
      "Basic project management",
    ],
    button: "Current Plan",
    current: true,
  },
  {
    key: "pro",
    name: "Pro",
    description: "For developers who build regularly.",
    price: "₹299",
    period: "/month",
    credits: "500 AI credits",
    icon: Sparkles,
    popular: true,
    features: [
      "500 AI credits / month",
      "Everything in Free",
      "Priority AI generation",
      "Larger projects",
      "Unlimited projects",
      "Advanced AI coding",
      "Priority support",
    ],
    button: "Upgrade to Pro",
  },
  {
    key: "team",
    name: "Team",
    description: "For teams building products together.",
    price: "₹799",
    period: "/month",
    credits: "2,000 AI credits",
    icon: Crown,
    features: [
      "2,000 AI credits / month",
      "Everything in Pro",
      "Team collaboration",
      "Shared projects",
      "Higher AI limits",
      "Priority processing",
      "Team support",
    ],
    button: "Upgrade to Team",
  },
];

export default function Plans() {
  const navigate = useNavigate();
const handlePayment = async (
  plan
) => {

  try {

    // Free/current plan does not need Razorpay.
    if (
      plan?.current ||
      plan?.key === "free"
    ) {
      return;
    }

    // Backend expects: "pro" or "team".
    if (!plan?.key) {
      console.error(
        "Invalid plan:",
        plan
      );
      return;
    }

    const data =
      await createPaymentOrder(
        plan
      );

    console.log(
      "CREATE ORDER RESPONSE:",
      data
    );

    // Stop here when backend returns an error.
    if (!data?.success) {
      console.error(
        data?.message ||
          "Unable to create payment order"
      );
      return;
    }

    if (
      !data?.order?.id ||
      !data?.keyId
    ) {
      console.error(
        "Invalid payment order response:",
        data
      );
      return;
    }

    if (!window.Razorpay) {
      console.error(
        "Razorpay SDK is not loaded."
      );
      return;
    }

    const options = {

      key:
        data.keyId,

      amount:
        data.order.amount,

      currency:
        data.order.currency ||
        "INR",

      name:
        "AI IDE",

      description:
        `${plan.name} Plan`,

      order_id:
        data.order.id,

      handler:
        async (response) => {

          try {

            const result =
              await verifyPayment(
                response
              );

            console.log(
              "VERIFY PAYMENT RESPONSE:",
              result
            );

            if (
              !result?.success
            ) {
              console.error(
                result?.message ||
                  "Payment verification failed"
              );
              return;
            }

            console.log(
              "Payment successful:",
              result
            );

            // Refresh user/credits here if required.

          } catch (error) {

            console.error(
              "PAYMENT VERIFICATION ERROR:",
              error
            );

          }
        },

      modal: {

        ondismiss:
          () => {
            console.log(
              "Razorpay checkout closed"
            );
          },

      },

      theme: {
        color:
          "#4f46e5",
      },

    };

    const razorpay =
      new window.Razorpay(
        options
      );

    razorpay.on(
      "payment.failed",
      (response) => {

        console.error(
          "RAZORPAY PAYMENT FAILED:",
          response?.error
        );

      }
    );

    razorpay.open();

  } catch (error) {

    console.error(
      "PAYMENT ERROR:",
      error
    );

  }

};

  return (
    <div className="min-h-screen bg-slate-50 px-5 py-8 text-slate-900 dark:bg-[#07070c] dark:text-white">
      {/* Ambient background */}

      <div className="pointer-events-none fixed left-1/2 top-0 h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-indigo-500/[0.08] blur-[140px]" />

      {/* Header */}

      <div className="relative mx-auto max-w-6xl">
        <div className="mb-12 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="
              flex
              items-center
              gap-2
              rounded-lg
              border
              border-slate-200
              bg-white
              px-3
              py-2
              text-sm
              font-medium
              text-slate-600
              transition
              hover:bg-slate-50
              dark:border-white/[0.08]
              dark:bg-white/[0.03]
              dark:text-slate-300
              dark:hover:bg-white/[0.06]
            "
          >
            <ArrowLeft size={16} />
            Back
          </button>

          <div className="text-sm font-semibold">
            AI IDE
          </div>
        </div>

        {/* Hero */}

        <div className="mx-auto mb-12 max-w-2xl text-center">
          <div
            className="
              mx-auto
              mb-4
              flex
              w-fit
              items-center
              gap-2
              rounded-full
              border
              border-indigo-500/20
              bg-indigo-500/10
              px-3
              py-1.5
              text-xs
              font-medium
              text-indigo-600
              dark:text-indigo-300
            "
          >
            <Sparkles size={13} />
            Simple pricing for developers
          </div>

          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Build more.
            <span className="text-indigo-500">
              {" "}Ship faster.
            </span>
          </h1>

          <p className="mt-4 text-sm leading-6 text-slate-500 dark:text-slate-400">
            Choose a plan that gives you the AI credits
            you need to build and iterate faster.
          </p>
        </div>

        {/* Plans */}

        <div className="grid gap-5 md:grid-cols-3">
          {plans.map((plan, index) => {
            const Icon = plan.icon;

            return (
              <motion.div
                key={plan.name}
                initial={{
                  opacity: 0,
                  y: 20,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                transition={{
                  delay: index * 0.08,
                }}
                whileHover={{
                  y: -4,
                }}
                className={`
                  relative
                  flex
                  flex-col
                  rounded-2xl
                  border
                  p-6
                  transition
                  ${
                    plan.popular
                      ? `
                        border-indigo-500/40
                        bg-white
                        shadow-xl
                        shadow-indigo-500/10
                        dark:bg-white/[0.05]
                      `
                      : `
                        border-slate-200
                        bg-white/70
                        dark:border-white/[0.08]
                        dark:bg-white/[0.025]
                      `
                  }
                `}
              >
                {/* Popular */}

                {plan.popular && (
                  <div
                    className="
                      absolute
                      -top-3
                      left-1/2
                      -translate-x-1/2
                      rounded-full
                      bg-indigo-600
                      px-3
                      py-1
                      text-[10px]
                      font-bold
                      uppercase
                      tracking-wider
                      text-white
                    "
                  >
                    Most Popular
                  </div>
                )}

                {/* Icon */}

                <div
                  className="
                    mb-5
                    flex
                    h-10
                    w-10
                    items-center
                    justify-center
                    rounded-xl
                    bg-slate-900/5
                    text-slate-700
                    dark:bg-white/10
                    dark:text-white
                  "
                >
                  <Icon size={19} />
                </div>

                {/* Name */}

                <h2 className="text-lg font-bold">
                  {plan.name}
                </h2>

                <p className="mt-1 min-h-[40px] text-xs leading-5 text-slate-500 dark:text-slate-400">
                  {plan.description}
                </p>

                {/* Price */}

                <div className="mt-5 flex items-end gap-1">
                  <span className="text-3xl font-bold tracking-tight">
                    {plan.price}
                  </span>

                  <span className="mb-1 text-xs text-slate-400">
                    {plan.period}
                  </span>
                </div>

                {/* Credits */}

                <div
                  className="
                    mt-4
                    flex
                    items-center
                    gap-2
                    rounded-lg
                    border
                    border-slate-200
                    bg-slate-50
                    px-3
                    py-2.5
                    text-xs
                    font-semibold
                    text-slate-700
                    dark:border-white/[0.07]
                    dark:bg-white/[0.04]
                    dark:text-slate-200
                  "
                >
                  <Zap
                    size={14}
                    className="text-indigo-500"
                    fill="currentColor"
                  />

                  {plan.credits}
                </div>

                {/* Button */}

                <button
                  disabled={plan.current}
                  onClick={() => handlePayment(plan)}
                  className={`
                    mt-5
                    w-full
                    rounded-lg
                    py-2.5
                    text-xs
                    font-semibold
                    transition
                    ${
                      plan.current
                        ? `
                          cursor-default
                          bg-slate-100
                          text-slate-400
                          dark:bg-white/[0.06]
                          dark:text-slate-500
                        `
                        : plan.popular
                        ? `
                          bg-indigo-600
                          text-white
                          shadow-lg
                          shadow-indigo-500/20
                          hover:bg-indigo-500
                        `
                        : `
                          bg-slate-900
                          text-white
                          hover:opacity-90
                          dark:bg-white
                          dark:text-slate-900
                        `
                    }
                  `}
                >
                  {plan.button}
                </button>

                {/* Features */}

                <div className="mt-6 border-t border-slate-200 pt-5 dark:border-white/[0.07]">
                  <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Includes
                  </p>

                  <ul className="space-y-3">
                    {plan.features.map(
                      (feature) => (
                        <li
                          key={feature}
                          className="
                            flex
                            items-start
                            gap-2.5
                            text-xs
                            text-slate-600
                            dark:text-slate-300
                          "
                        >
                          <Check
                            size={14}
                            className="
                              mt-0.5
                              shrink-0
                              text-emerald-500
                            "
                          />

                          <span>
                            {feature}
                          </span>
                        </li>
                      )
                    )}
                  </ul>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Bottom */}

        <div className="mt-10 text-center text-[11px] text-slate-400 dark:text-slate-600">
          Credits reset every month. Unused credits do not roll over.
        </div>
      </div>
    </div>
  );
}