import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import {
  Send,
  Sparkles,
  Loader2,
  Bot,
  User,
  Copy,
  Check,
  FolderPlus,
  FilePlus2,
  FilePen,
  TerminalSquare,
} from "lucide-react";

import { chatWithAI } from "../features/ai";

// =================================================
// CODE BLOCK (with copy button + syntax highlight)
// =================================================
function CodeBlock({ language, code }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="my-2 overflow-hidden rounded-lg border border-white/[0.08] bg-[#0a0a0c]">
      <div className="flex items-center justify-between border-b border-white/[0.06] bg-white/[0.03] px-3 py-1.5">
        <span className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
          {language || "text"}
        </span>

        <button
          onClick={handleCopy}
          className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] text-zinc-500 transition-colors hover:bg-white/10 hover:text-zinc-200"
        >
          {copied ? (
            <>
              <Check size={11} className="text-emerald-400" />
              Copied
            </>
          ) : (
            <>
              <Copy size={11} />
              Copy
            </>
          )}
        </button>
      </div>

      <SyntaxHighlighter
        language={language || "text"}
        style={oneDark}
        customStyle={{
          margin: 0,
          background: "transparent",
          padding: "10px 12px",
          fontSize: "12.5px",
        }}
        wrapLongLines
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}

// =================================================
// MARKDOWN RENDERER (message content)
// =================================================
function Markdown({ content }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ children }) => (
          <p className="mb-2 leading-relaxed last:mb-0">{children}</p>
        ),
        strong: ({ children }) => (
          <strong className="font-semibold text-white">{children}</strong>
        ),
        em: ({ children }) => <em className="italic text-zinc-300">{children}</em>,
        a: ({ children, href }) => (
          <a
            href={href}
            target="_blank"
            rel="noreferrer"
            className="text-sky-400 underline underline-offset-2 hover:text-sky-300"
          >
            {children}
          </a>
        ),
        ul: ({ children }) => (
          <ul className="mb-2 list-disc space-y-1 pl-5 last:mb-0">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="mb-2 list-decimal space-y-1 pl-5 last:mb-0">{children}</ol>
        ),
        li: ({ children }) => <li className="leading-relaxed">{children}</li>,
        h1: ({ children }) => (
          <h1 className="mb-2 mt-3 text-[16px] font-semibold text-white first:mt-0">{children}</h1>
        ),
        h2: ({ children }) => (
          <h2 className="mb-2 mt-3 text-[15px] font-semibold text-white first:mt-0">{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 className="mb-1.5 mt-2.5 text-[13.5px] font-semibold text-white first:mt-0">{children}</h3>
        ),
        blockquote: ({ children }) => (
          <blockquote className="mb-2 border-l-2 border-sky-400/40 pl-3 italic text-zinc-400 last:mb-0">
            {children}
          </blockquote>
        ),
        hr: () => <hr className="my-3 border-white/10" />,
        table: ({ children }) => (
          <div className="mb-2 overflow-x-auto rounded-lg border border-white/[0.08]">
            <table className="w-full border-collapse text-[12.5px]">{children}</table>
          </div>
        ),
        thead: ({ children }) => <thead className="bg-white/[0.04]">{children}</thead>,
        th: ({ children }) => (
          <th className="border-b border-white/[0.08] px-2.5 py-1.5 text-left font-semibold text-zinc-300">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="border-b border-white/[0.04] px-2.5 py-1.5 text-zinc-400">{children}</td>
        ),
        code({ inline, className, children }) {
          const match = /language-(\w+)/.exec(className || "");
          const code = String(children).replace(/\n$/, "");

          if (inline) {
            return (
              <code className="rounded bg-white/10 px-1.5 py-0.5 text-[12.5px] text-sky-300">
                {code}
              </code>
            );
          }

          return <CodeBlock language={match?.[1]} code={code} />;
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

// =================================================
// TOOL ACTION BADGE (folder/file/command events)
// =================================================
const TOOL_META = {
  folder_created: { icon: FolderPlus, color: "text-sky-400", label: "Created folder" },
  file_created: { icon: FilePlus2, color: "text-emerald-400", label: "Created file" },
  file_updated: { icon: FilePen, color: "text-amber-400", label: "Updated file" },
  command_result: { icon: TerminalSquare, color: "text-violet-400", label: "Ran command" },
};

function ToolBadge({ toolType, detail }) {
  const meta = TOOL_META[toolType];
  if (!meta) return null;

  const Icon = meta.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-center"
    >
      <div className="flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-[11.5px] text-zinc-400">
        <Icon size={12} className={meta.color} />
        <span>{meta.label}</span>
        {detail && <span className="text-zinc-600">&middot; {detail}</span>}
      </div>
    </motion.div>
  );
}

export default function AIChat({ projectId, terminalSocketId, onFilesChanged }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // =================================================
  // AUTO SCROLL
  // =================================================
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // =================================================
  // AUTO-GROW TEXTAREA
  // =================================================
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  }, [input]);

  const pushToolBadge = (toolType, detail) => {
    setMessages((prev) => [...prev, { role: "tool", toolType, detail }]);
  };

  // =================================================
  // SEND
  // =================================================
  const handleSend = async () => {
    const message = input.trim();
    if (!message || loading) return;

    setMessages((prev) => [...prev, { role: "user", content: message }]);
    setInput("");
    setLoading(true);

    try {
      const history = messages
        .filter((m) => m.role === "user" || m.role === "assistant")
        .map((msg) => ({ role: msg.role, content: msg.content }));

      await chatWithAI({
        projectId,
        message,
        history,
        terminalSocketId,

        onEvent: async (type, data) => {
          if (type === "start" || type === "tool_start") return;

          if (type === "folder_created") {
            pushToolBadge("folder_created", data?.folder?.name);
            await onFilesChanged?.();
            return;
          }

          if (type === "file_created") {
            pushToolBadge("file_created", data?.file?.name);
            await onFilesChanged?.();
            return;
          }

          if (type === "file_updated") {
            pushToolBadge("file_updated", data?.file?.name);
            await onFilesChanged?.();
            return;
          }

          if (type === "command_result") {
            pushToolBadge("command_result", data?.command);
            return;
          }

          if (type === "message") {
            const content = data?.content || "";
            if (!content) return;

            setMessages((prev) => {
              const copy = [...prev];
              const last = copy[copy.length - 1];

              if (last?.role === "assistant") {
                copy[copy.length - 1] = { ...last, content };
              } else {
                copy.push({ role: "assistant", content });
              }

              return copy;
            });

            return;
          }

          if (type === "error") {
            throw new Error(data?.message || "AI error");
          }
        },
      });
    } catch (error) {
      console.error("AI chat error:", error);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: error?.message || "Something went wrong.", error: true },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // =================================================
  // UI
  // =================================================
  return (
    <div className="flex w-80 shrink-0 flex-col border-l border-white/[0.06] bg-[#111113]/90 backdrop-blur-xl">
      {/* HEADER */}
      <div className="flex h-10 shrink-0 items-center gap-2 border-b border-white/[0.06] px-3">
        
        <span className="text-xs font-semibold tracking-wider text-zinc-300">Vertex AI Chat</span>

        {loading && (
          <span className="ml-auto flex items-center gap-1.5 text-[10.5px] text-zinc-500">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
            working
          </span>
        )}
      </div>

      {/* MESSAGES */}
      <div className="flex-1 space-y-3 overflow-y-auto p-3">
        {messages.length === 0 && (
          <div className="mt-10 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.02]">
              <Sparkles size={22} className="text-zinc-600" />
            </div>
            <p className="text-sm font-medium text-zinc-400">What do you want to build?</p>
            <p className="mt-1.5 text-xs text-zinc-600">Ask me to create or modify files.</p>
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((message, index) => {
            if (message.role === "tool") {
              return (
                <ToolBadge key={index} toolType={message.toolType} detail={message.detail} />
              );
            }

            const isUser = message.role === "user";

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15 }}
                className={`flex items-start gap-2 ${isUser ? "flex-row-reverse" : ""}`}
              >
                {/* AVATAR */}
                <div
                  className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                    isUser
                      ? "bg-white/10 text-zinc-300"
                      : "bg-gradient-to-br from-sky-400 to-violet-400 text-white"
                  }`}
                >
                  {isUser ? <User size={12} /> : <Bot size={12} />}
                </div>

                {/* BUBBLE */}
                <div
                  className={`max-w-[85%] rounded-xl px-3 py-2 text-[13px] ${
                    isUser
                      ? "bg-gradient-to-b from-sky-500 to-sky-600 text-white"
                      : message.error
                      ? "border border-red-500/20 bg-red-500/10 text-red-300"
                      : "border border-white/[0.06] bg-white/[0.03] text-zinc-300"
                  }`}
                >
                  {isUser ? (
                    <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                  ) : (
                    <Markdown content={message.content || ""} />
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {loading && (
          <div className="flex items-center gap-2 pl-8 text-xs text-zinc-500">
            <Loader2 size={13} className="animate-spin" />
            <span>AI is working...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* INPUT */}
      <div className="border-t border-white/[0.06] p-3">
        <div className="flex items-end gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] p-2 transition-colors focus-within:border-sky-400/40">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            placeholder="Ask AI to build something..."
            rows={2}
            className="flex-1 resize-none bg-transparent text-[13px] text-zinc-200 outline-none placeholder:text-zinc-600"
          />

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-gradient-to-b from-sky-500 to-sky-600 text-white shadow-[0_1px_0_rgba(255,255,255,0.2)_inset] transition-opacity hover:from-sky-400 hover:to-sky-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          </motion.button>
        </div>

        <p className="mt-2 text-[10px] text-zinc-600">Enter to send &middot; Shift + Enter for new line</p>
      </div>
    </div>
  );
}