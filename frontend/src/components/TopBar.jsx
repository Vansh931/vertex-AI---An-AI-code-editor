import { useState } from "react";
import { useSelector } from "react-redux";
import { AnimatePresence, motion } from "framer-motion";
import { SquareTerminal, Eye, Code2, Lock, Globe } from "lucide-react";

export default function TopBar({
  showBottomPanel,
  setShowBottomPanel,
  showPreview,
  setShowPreview,
}) {
  const [profileOpen, setProfileOpen] = useState(false);

  // Adjust these slice names/paths to match your store shape
  const { currentProject, loading } = useSelector((state) => state.project || {});
  const { userData } = useSelector((state) => state.user || {});

  const projectName = currentProject?.name || "Untitled Project";
  const projectIcon = currentProject?.icon || "📁";
  const projectColor = currentProject?.color || "#3B82F6";
  const isPrivate = currentProject?.visibility === "private";

  const userName = userData?.name || "Guest";
  const userEmail = userData?.email || "";
  const userAvatar = userData?.avatar;
  const initials = userName
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="relative flex h-12 items-center justify-between border-b border-white/[0.06] bg-[#111113]/90 px-4 backdrop-blur-xl">
      {/* LEFT: LOGO + PROJECT */}
      <div className="flex items-center gap-3">
        <div className="text-white bg-clip-text text-lg font-bold text-transparent">
          Vertex AI
        </div>

        <div className="h-4 w-px bg-white/10" />

        {loading ? (
          <div className="h-5 w-32 animate-pulse rounded-md bg-white/[0.06]" />
        ) : (
          <div className="flex items-center gap-2">
            <div
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[13px]"
              style={{
                backgroundColor: `${projectColor}22`,
                border: `1px solid ${projectColor}55`,
              }}
            >
              {projectIcon}
            </div>

            <span className="max-w-[220px] truncate text-sm font-medium text-zinc-300">
              {projectName}
            </span>

            <span title={isPrivate ? "Private" : "Public"} className="text-zinc-600">
              {isPrivate ? <Lock size={12} /> : <Globe size={12} />}
            </span>
          </div>
        )}
      </div>

      {/* RIGHT: TOGGLES + PROFILE */}
      <div className="flex items-center gap-1.5">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowPreview?.((v) => !v)}
          title={showPreview ? "Show Editor" : "Show Preview"}
          className={`relative flex items-center justify-center rounded-lg p-2 transition-colors ${
            showPreview ? "text-sky-400" : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          {showPreview && (
            <motion.div
              layoutId="topbar-toggle-pill"
              className="absolute inset-0 rounded-lg bg-white/[0.06]"
              transition={{ type: "spring", duration: 0.35, bounce: 0.15 }}
            />
          )}
          {showPreview ? <Eye size={16} className="relative" /> : <Code2 size={16} className="relative" />}
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowBottomPanel?.((v) => !v)}
          title={showBottomPanel ? "Hide Terminal" : "Show Terminal"}
          className={`relative flex items-center justify-center rounded-lg p-2 transition-colors ${
            showBottomPanel ? "text-emerald-400" : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          {showBottomPanel && (
            <motion.div
              layoutId="topbar-toggle-pill-2"
              className="absolute inset-0 rounded-lg bg-white/[0.06]"
              transition={{ type: "spring", duration: 0.35, bounce: 0.15 }}
            />
          )}
          <SquareTerminal size={16} className="relative" />
        </motion.button>

        <div className="mx-1 h-5 w-px bg-white/10" />

        {/* PROFILE */}
        <div className="relative">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setProfileOpen((v) => !v)}
            className="flex items-center gap-2 rounded-lg py-1 pl-1 pr-2 transition-colors hover:bg-white/[0.05]"
          >
            {userAvatar ? (
              <img
                src={userAvatar}
                alt={userName}
                referrerPolicy="no-referrer"
                className="h-7 w-7 rounded-full border border-white/10 object-cover"
              />
            ) : (
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 to-violet-400 text-[11px] font-semibold text-white">
                {initials}
              </div>
            )}
          </motion.button>

          <AnimatePresence>
            {profileOpen && (
              <>
                <div className="fixed inset-0 z-100" onClick={() => setProfileOpen(false)} />

                <motion.div
                  initial={{ opacity: 0, scale: 0.96, y: -6 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, y: -6 }}
                  transition={{ duration: 0.14, ease: "easeOut" }}
                  className="absolute right-0 top-11 z-100 w-64 rounded-xl border border-white/[0.08] bg-[#17171a]/95 p-3 shadow-2xl shadow-black/50 backdrop-blur-xl"
                >
                  <div className="flex items-center gap-3">
                    {userAvatar ? (
                      <img
                        src={userAvatar}
                        alt={userName}
                        referrerPolicy="no-referrer"
                        className="h-10 w-10 rounded-full border border-white/10 object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 to-violet-400 text-sm font-semibold text-white">
                        {initials}
                      </div>
                    )}

                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-medium text-white">{userName}</p>
                      <p className="truncate text-[11.5px] text-zinc-500">{userEmail}</p>
                    </div>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}