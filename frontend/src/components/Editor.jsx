import MonacoEditor from "@monaco-editor/react";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Save, X, Circle, Check } from "lucide-react";
import { updateFile } from "../features/file";
import { getFileIcon as getFileMeta } from "../utils/fileIcons";

export default function Editor({ activeTab, openTabs, setOpenTabs, setActiveTab }) {
  const [code, setCode] = useState("");
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    setCode(activeTab?.content || "");
  }, [activeTab]);

  const isDirty = useMemo(
    () => activeTab && code !== (activeTab.content || ""),
    [code, activeTab]
  );

  const save = async () => {
    if (!activeTab) return;

    try {
      setSaving(true);
      await updateFile(activeTab._id, code);

      setActiveTab({ ...activeTab, content: code });
      setOpenTabs((tabs) =>
        tabs.map((tab) => (tab._id === activeTab._id ? { ...tab, content: code } : tab))
      );

      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 1500);
    } catch (error) {
      console.log(error);
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        save();
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [code, activeTab]);

  const closeTab = (e, tab) => {
    e.stopPropagation();
    const tabs = openTabs.filter((t) => t._id !== tab._id);
    setOpenTabs(tabs);

    if (activeTab?._id === tab._id) {
      setActiveTab(tabs.length ? tabs[tabs.length - 1] : null);
    }
  };

  if (!activeTab) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 bg-[#0a0a0c] text-zinc-600">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.02]">
          <Circle size={22} className="text-zinc-700" />
        </div>
        <div className="flex flex-col items-center gap-1">
          <span className="text-sm font-medium text-zinc-400">No file open</span>
          <span className="text-xs text-zinc-600">Select a file from Explorer to start editing</span>
        </div>
      </div>
    );
  }

  const ActiveIcon = getFileMeta(activeTab.name).icon;

  return (
    <div className="flex flex-1 flex-col bg-[#0a0a0c]">
      {/* TAB BAR */}
      <div className="flex h-10 shrink-0 items-center overflow-x-auto border-b border-white/[0.06] bg-[#111113]/90">
        <AnimatePresence initial={false}>
          {openTabs.map((tab) => {
            const active = activeTab._id === tab._id;
            const { icon: Icon, color } = getFileMeta(tab.name);
            const dirty = active ? isDirty : tab.content !== (tab._savedContent ?? tab.content);

            return (
              <motion.div
                key={tab._id}
                layout
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.15 }}
                onClick={() => setActiveTab(tab)}
                className={`group relative flex h-full cursor-pointer items-center gap-2 whitespace-nowrap border-r border-white/[0.05] px-3.5 transition-colors ${
                  active ? "bg-[#0a0a0c] text-white" : "text-zinc-500 hover:bg-white/[0.02] hover:text-zinc-300"
                }`}
              >
                <Icon size={14} className={color} />
                <span className="text-[13px]">{tab.name}</span>

                {active && dirty ? (
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-sky-400" />
                ) : (
                  <button
                    onClick={(e) => closeTab(e, tab)}
                    className="rounded p-0.5 text-zinc-500 opacity-0 hover:bg-white/10 hover:text-white group-hover:opacity-100"
                  >
                    <X size={13} />
                  </button>
                )}

                {active && (
                  <motion.div
                    layoutId="active-tab-indicator"
                    className="absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-sky-400 to-violet-400"
                    transition={{ duration: 0.2, ease: "easeOut" }}
                  />
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* TOOLBAR */}
      <div className="flex h-10 shrink-0 items-center justify-between border-b border-white/[0.06] px-4">
        <div className="flex items-center gap-2 text-zinc-400">
          <ActiveIcon size={14} className={getFileMeta(activeTab.name).color} />
          <span className="text-[13px]">{activeTab.name}</span>
          {isDirty && <span className="text-[11px] text-zinc-600">&bull; unsaved</span>}
        </div>

        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={save}
          disabled={saving || !isDirty}
          className="flex items-center gap-2 rounded-lg bg-gradient-to-b from-sky-500 to-sky-600 px-3 py-1.5 text-xs font-medium text-white shadow-[0_1px_0_rgba(255,255,255,0.2)_inset] transition-colors hover:from-sky-400 hover:to-sky-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <AnimatePresence mode="wait" initial={false}>
            {saving ? (
              <motion.span
                key="saving"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2"
              >
                <Loader2 size={13} className="animate-spin" />
                Saving...
              </motion.span>
            ) : justSaved ? (
              <motion.span
                key="saved"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2"
              >
                <Check size={13} />
                Saved
              </motion.span>
            ) : (
              <motion.span
                key="save"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2"
              >
                <Save size={13} />
                Save
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      {/* MONACO */}
      <div className="min-h-0 flex-1">
        <MonacoEditor
          height="100%"
          theme="vs-dark"
          language={activeTab.language || "plaintext"}
          value={code}
          onChange={(value) => setCode(value || "")}
          options={{
            fontSize: 14,
            automaticLayout: true,
            minimap: { enabled: false },
            wordWrap: "on",
            scrollBeyondLastLine: false,
            padding: { top: 12 },
          }}
        />
      </div>
    </div>
  );
}