import { useState } from "react";
import { useSelector } from "react-redux";
import { motion } from "framer-motion";
import { AlertTriangle, FileOutput, X } from "lucide-react";
import { VscTerminal } from "react-icons/vsc";

import Terminal from "./Terminal";

const TABS = [
  { id: "terminal", label: "Terminal", icon: VscTerminal },
  { id: "output", label: "Output", icon: FileOutput },
  { id: "problems", label: "Problems", icon: AlertTriangle },
];

export default function BottomPanel({ projectId, onTerminalSocket, onClose }) {
  const [activePanel, setActivePanel] = useState("terminal");

  const { currentProject } = useSelector((state) => state.project);

  const finalProjectId = projectId || currentProject?._id;
  const userId = currentProject?.owner;

  return (
    <motion.div
      key="bottom-panel"
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 256, opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="flex shrink-0 flex-col overflow-hidden border-t border-white/[0.06] bg-[#111113]"
    >
      {/* HEADER */}
      <div className="flex h-9 shrink-0 items-center justify-between border-b border-white/[0.06] px-3">
        <div className="flex items-center gap-1">
          {TABS.map(({ id, label, icon: Icon }) => {
            const active = activePanel === id;
            return (
              <button
                key={id}
                onClick={() => setActivePanel(id)}
                className={`relative flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] font-semibold tracking-wide transition-colors ${
                  active ? "text-white" : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {active && (
                  <motion.div
                    layoutId="bottom-panel-pill"
                    className="absolute inset-0 rounded-md bg-white/[0.06]"
                    transition={{ type: "spring", duration: 0.35, bounce: 0.15 }}
                  />
                )}
                <Icon size={13} className="relative" />
                <span className="relative uppercase">{label}</span>
              </button>
            );
          })}
        </div>

        <button
          onClick={onClose}
          title="Close panel"
          className="rounded-md p-1 text-zinc-500 hover:bg-white/10 hover:text-white"
        >
          <X size={14} />
        </button>
      </div>

      {/* BODY */}
      <div className="min-h-0 flex-1">
        {activePanel === "terminal" && (
          <Terminal projectId={finalProjectId} userId={userId} onSocketReady={onTerminalSocket} />
        )}

        {activePanel === "output" && (
          <div className="flex h-full items-center justify-center p-4 text-xs text-zinc-600">
            No output yet.
          </div>
        )}

        {activePanel === "problems" && (
          <div className="flex h-full items-center justify-center p-4 text-xs text-zinc-600">
            No problems detected.
          </div>
        )}
      </div>
    </motion.div>
  );
}