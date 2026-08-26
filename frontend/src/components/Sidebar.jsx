import { motion } from "framer-motion";
import {
  Folder,
  Star,
  Zap,
  Coins,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Sidebar({
  activeSection,
  setActiveSection,
  credits = 0,
}) {
  const mainNav = [
    {
      label: "Projects",
      icon: Folder,
    },
    {
      label: "Starred",
      icon: Star,
    },
  ];
const navigate=useNavigate()
  const renderNav = (items) =>
    items.map(({ label, icon: Icon }) => {
      const isActive =
        activeSection === label;

      return (
        <motion.button
          key={label}
          onClick={() =>
            setActiveSection(label)
          }
          whileTap={{
            scale: 0.97,
          }}
          className={`
            relative
            flex
            items-center
            gap-3
            rounded-lg
            px-3
            py-2.5
            text-[13.5px]
            font-medium
            transition-colors
            duration-150

            ${
              isActive
                ? "text-slate-900 dark:text-white"
                : "text-slate-500 hover:bg-slate-100/80 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-white/[0.04] dark:hover:text-slate-200"
            }
          `}
        >
          {isActive && (
            <motion.div
              layoutId="sidebar-active-pill"
              className="
                absolute
                inset-0
                rounded-lg
                border
                border-slate-900/10
                bg-slate-900/5
                dark:border-white/10
                dark:bg-white/10
              "
              transition={{
                type: "spring",
                duration: 0.4,
                bounce: 0.15,
              }}
            />
          )}

          <Icon
            size={17}
            strokeWidth={2}
            className="relative"
          />

          <span className="relative">
            {label}
          </span>
        </motion.button>
      );
    });

  return (
    <aside
      className="
        flex
        h-full
        w-64
        shrink-0
        flex-col
        border-r
        border-slate-200/70
        bg-white/60
        px-3
        py-5
        font-sans
        backdrop-blur-xl
        transition-colors
        duration-300
        dark:border-white/[0.06]
        dark:bg-white/[0.02]
      "
    >
      {/* MAIN NAV */}

      <p
        className="
          mb-2
          px-3
          text-[10.5px]
          font-semibold
          tracking-wider
          text-slate-400
          dark:text-slate-600
        "
      >
        MAIN
      </p>

      <nav className="flex flex-col gap-1">
        {renderNav(mainNav)}
      </nav>

      <div
        className="
          my-4
          h-px
          bg-slate-200/70
          dark:bg-white/[0.06]
        "
      />

      {/* CREDITS */}

      <div
        className="
          mb-3
          rounded-xl
          border
          border-slate-200/70
          bg-white/70
          p-3.5
          shadow-sm
          backdrop-blur-xl
          dark:border-white/[0.07]
          dark:bg-white/[0.03]
          dark:shadow-none
        "
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="
                flex
                h-7
                w-7
                items-center
                justify-center
                rounded-lg
                bg-slate-900/5
                text-slate-700
                dark:bg-white/10
                dark:text-white
              "
            >
              <Coins size={14} />
            </div>

            <span
              className="
                text-[12px]
                font-medium
                text-slate-600
                dark:text-slate-400
              "
            >
              AI Credits
            </span>
          </div>

          <span
            className="
              text-[15px]
              font-bold
              text-slate-900
              dark:text-white
            "
          >
            {credits}
          </span>
        </div>

        <div
          className="
            mt-3
            h-1.5
            overflow-hidden
            rounded-full
            bg-slate-200
            dark:bg-white/10
          "
        >
          <motion.div
            initial={{
              width: 0,
            }}
            animate={{
              width: `${credits}%`,
            }}
            transition={{
              duration: 0.5,
            }}
            className="
              h-full
              rounded-full
              bg-slate-900
              dark:bg-white
            "
          />
        </div>

        <p
          className="
            mt-2
            text-[10.5px]
            text-slate-400
            dark:text-slate-500
          "
        >
          {credits > 0
            ? `${credits} credits remaining`
            : "No credits remaining"}
        </p>
      </div>

      {/* UPGRADE CARD */}

      <div
        className="
          rounded-xl
          border
          border-slate-200/70
          bg-white/70
          p-3.5
          shadow-sm
          backdrop-blur-xl
          dark:border-white/[0.07]
          dark:bg-white/[0.03]
          dark:shadow-none
        "
      >
        <p
          className="
            mb-1
            text-[12.5px]
            font-medium
            text-slate-700
            dark:text-slate-300
          "
        >
          Upgrade Plan
        </p>

        <p
          className="
            mb-3
            text-[11.5px]
            leading-snug
            text-slate-400
            dark:text-slate-500
          "
        >
          Upgrade to Pro for more credits.
        </p>

        <motion.button
        onClick={()=>navigate("/plans")}
          whileHover={{
            scale: 1.02,
          }}
          whileTap={{
            scale: 0.97,
          }}
          className="
            flex
            w-full
            items-center
            justify-center
            gap-1.5
            rounded-lg
            bg-slate-900
            py-2
            text-[12.5px]
            font-semibold
            text-white
            shadow-sm
            transition-opacity
            duration-150
            hover:opacity-90
            dark:bg-white
            dark:text-slate-900
          "
        >
          <Zap
            size={13}
            fill="currentColor"
          />

          Upgrade Now
        </motion.button>
      </div>
    </aside>
  );
}