import { useState } from "react";
import { X } from "lucide-react";

export default function CreateProjectModal({ open, onClose, onCreate }) {
  const [form, setForm] = useState({
    name: "",
    description: "",
  });

  if (!open) return null;

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const submit = () => {
    if (!form.name.trim()) return;
    onCreate?.(form);
    setForm({ name: "", description: "" });
    onClose?.();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: translateY(10px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes overlayIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .modal-card { animation: modalIn 0.28s cubic-bezier(0.16, 1, 0.3, 1); }
        .modal-overlay { animation: overlayIn 0.2s ease-out; }
      `}</style>

      {/* Overlay */}
      <div
        onClick={onClose}
        className="modal-overlay fixed inset-0 bg-black/20 backdrop-blur-sm dark:bg-black/60"
      />

      {/* Ambient glow */}
      <div className="pointer-events-none absolute -z-10 h-[460px] w-[460px] rounded-full bg-sky-300/20 blur-[130px] dark:bg-sky-500/10" />

      {/* Card */}
      <div
        className="modal-card relative w-full max-w-md overflow-hidden rounded-[28px] border border-black/[0.08] bg-white/70 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.25)] backdrop-blur-2xl dark:border-white/[0.1] dark:bg-white/[0.05] dark:shadow-[0_20px_70px_-15px_rgba(0,0,0,0.7)]"
      >
        {/* top highlight line */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent dark:via-white/30" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-black/[0.06] px-7 py-6 dark:border-white/[0.08]">
          <div>
            <h2 className="text-[17px] font-semibold tracking-tight text-zinc-900 dark:text-white">
              Create project
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Set up a new workspace in seconds
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-2 text-zinc-500 transition-colors hover:bg-black/[0.05] hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-white/[0.07] dark:hover:text-white"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-6 px-7 py-6">
          <div>
            <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Project name
            </label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="My Awesome Project"
              autoFocus
              className="w-full rounded-xl border border-black/[0.08] bg-black/[0.02] px-4 py-3 text-[15px] text-zinc-900 placeholder-zinc-400 outline-none transition-all focus:border-sky-400/60 focus:bg-white focus:ring-4 focus:ring-sky-400/15 dark:border-white/[0.09] dark:bg-white/[0.04] dark:text-white dark:placeholder-zinc-500 dark:focus:bg-white/[0.06] dark:focus:ring-sky-400/10"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Description
            </label>
            <textarea
              rows={3}
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="What is this project about?"
              className="w-full resize-none rounded-xl border border-black/[0.08] bg-black/[0.02] px-4 py-3 text-[15px] text-zinc-900 placeholder-zinc-400 outline-none transition-all focus:border-sky-400/60 focus:bg-white focus:ring-4 focus:ring-sky-400/15 dark:border-white/[0.09] dark:bg-white/[0.04] dark:text-white dark:placeholder-zinc-500 dark:focus:bg-white/[0.06] dark:focus:ring-sky-400/10"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t border-black/[0.06] px-7 py-5 dark:border-white/[0.08]">
          <button
            onClick={onClose}
            className="rounded-xl border border-black/[0.08] bg-black/[0.02] px-5 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-black/[0.05] hover:text-zinc-900 dark:border-white/[0.1] dark:bg-white/[0.03] dark:text-zinc-300 dark:hover:bg-white/[0.07] dark:hover:text-white"
          >
            Cancel
          </button>

          <button
            onClick={submit}
            disabled={!form.name.trim()}
            className="rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white shadow-[0_1px_0_rgba(255,255,255,0.15)_inset,0_8px_24px_-8px_rgba(0,0,0,0.4)] transition-all hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
          >
            Create project
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---- Demo wrapper: standalone preview with a light/dark toggle ---- */
export function Demo() {
  const [open, setOpen] = useState(true);
  const [dark, setDark] = useState(false);

  return (
    <div className={dark ? "dark" : ""}>
      <div className="min-h-screen bg-neutral-50 p-10 transition-colors dark:bg-[#08080b]">
        <div className="pointer-events-none fixed left-1/4 top-0 h-[400px] w-[400px] rounded-full bg-sky-200/30 blur-[120px] dark:bg-sky-500/10" />

        <div className="flex items-center gap-3">
          <button
            onClick={() => setOpen(true)}
            className="rounded-xl border border-black/[0.08] bg-white px-5 py-2.5 text-sm font-medium text-zinc-900 shadow-sm hover:bg-black/[0.02] dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
          >
            New project
          </button>

          <button
            onClick={() => setDark((d) => !d)}
            className="flex items-center gap-2 rounded-xl border border-black/[0.08] bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 shadow-sm hover:bg-black/[0.02] dark:border-white/10 dark:bg-white/5 dark:text-zinc-300 dark:hover:bg-white/10"
          >
            {dark ? "Light mode" : "Dark mode"}
          </button>
        </div>

        <CreateProjectModal
          open={open}
          onClose={() => setOpen(false)}
          onCreate={(data) => console.log("created:", data)}
        />
      </div>
    </div>
  );
}