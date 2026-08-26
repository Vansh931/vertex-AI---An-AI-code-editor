import { useState, useRef, useEffect } from "react";
import { Sun, Moon, ChevronDown, LogOut } from "lucide-react";

export default function Navbar({ user, onLogout }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const menuRef = useRef(null);

  const name = user?.name || "Guest";
  const email = user?.email || "";
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  // Init theme from saved preference (defaults to dark, matching the design)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem("theme");
    const dark = saved ? saved === "dark" : true;
    document.documentElement.classList.toggle("dark", dark);
    setIsDark(dark);
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    window.localStorage.setItem("theme", next ? "dark" : "light");
  };

  useEffect(() => {
    const onClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <nav className="w-full h-16 bg-white/70 dark:bg-white/[0.03] backdrop-blur-xl border-b border-slate-200/70 dark:border-white/[0.07] flex items-center px-6 gap-6 font-sans transition-colors z-100 duration-300">
      {/* Left: Logo */}
      <div className="flex items-center gap-2.5 shrink-0">
        <span className="text-slate-900 dark:text-white font-bold text-[17px] tracking-tight">
          Vertex AI
        </span>
      </div>

      <div className="flex-1" />

      {/* Right: actions */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors duration-150"
        >
          {isDark ? <Moon size={17} /> : <Sun size={18} />}
        </button>

        <div className="relative ml-1" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 pl-1.5 pr-2 h-10 rounded-lg hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors duration-150"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 dark:from-slate-200 dark:to-white flex items-center justify-center overflow-hidden ring-1 ring-black/5 dark:ring-white/20">
              <span className="text-[12px] font-semibold text-white dark:text-slate-900">
                {initials}
              </span>
            </div>
            <span className="text-[13.5px] font-medium text-slate-700 dark:text-slate-200 hidden sm:inline">
              {name}
            </span>
            <ChevronDown
              size={14}
              className={`text-slate-400 dark:text-slate-500 transition-transform duration-150 ${
                menuOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-52 bg-white/95 dark:bg-[#12121c]/95 backdrop-blur-xl border z-199 border-slate-200 dark:border-white/[0.08] rounded-xl shadow-xl py-1.5 animate-[fadeIn_0.15s_ease-out]">
              <div className="px-3.5 py-2.5 border-b border-slate-100 dark:border-white/[0.06] flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 dark:from-slate-200 dark:to-white flex items-center justify-center shrink-0 ring-1 ring-black/5 dark:ring-white/20">
                  <span className="text-[12px] font-semibold text-white dark:text-slate-900">
                    {initials}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-slate-800 dark:text-slate-200 truncate">
                    {name}
                  </p>
                  {email && (
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">
                      {email}
                    </p>
                  )}
                </div>
              </div>

              <button
                onClick={() => {
                  setMenuOpen(false);
                  onLogout?.();
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors duration-150"
              >
                <LogOut size={15} />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}