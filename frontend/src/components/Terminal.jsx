import { useEffect, useRef, useState } from "react";
import { Terminal as XTerminal } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import { io } from "socket.io-client";
import { Eraser } from "lucide-react";
import "xterm/css/xterm.css";
import "./Terminal.css";

export default function Terminal({
  projectId,
  userId,
  onSocketReady,
}) {
  const containerRef = useRef(null);
  const socketRef = useRef(null);
  const terminalRef = useRef(null);
  const fitAddonRef = useRef(null);
  const callbackRef = useRef(onSocketReady);

  const [connected, setConnected] = useState(false);

  // --------------------------------------------------
  // KEEP CALLBACK UPDATED
  // --------------------------------------------------

  useEffect(() => {
    callbackRef.current = onSocketReady;
  }, [onSocketReady]);

  // --------------------------------------------------
  // TERMINAL SETUP
  // --------------------------------------------------

  useEffect(() => {
    if (
      !containerRef.current ||
      !projectId ||
      !userId
    ) {
      return;
    }

    // ------------------------------------------------
    // CREATE XTERM
    // ------------------------------------------------

    const terminal = new XTerminal({
      cursorBlink: true,
      cursorStyle: "block",

      fontSize: 13,

      fontFamily:
        "Menlo, Monaco, Consolas, monospace",

      scrollback: 5000,

      theme: {
        background: "#0d0d0f",
        foreground: "#d4d4d4",
        cursor: "#ffffff",
        selectionBackground: "#264f78",
      },
    });

    const fitAddon = new FitAddon();

    terminal.loadAddon(fitAddon);

    terminal.open(
      containerRef.current
    );

    terminalRef.current = terminal;
    fitAddonRef.current = fitAddon;

    // ------------------------------------------------
    // INITIAL FIT
    // ------------------------------------------------

    const fitTerminal = () => {
      try {
        if (!containerRef.current) {
          return;
        }

        fitAddon.fit();
      } catch (error) {
        console.error(
          "Terminal fit error:",
          error
        );
      }
    };

    // Wait for browser layout
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        fitTerminal();
      });
    });

    // ------------------------------------------------
    // TERMINAL SERVICE URL
    // ------------------------------------------------

    const terminalUrl =
      import.meta.env.VITE_TERMINAL_URL;

    if (!terminalUrl) {
      terminal.write(
        "\r\n\x1b[31mVITE_TERMINAL_URL missing\x1b[0m\r\n"
      );

      return () => {
        terminal.dispose();
      };
    }

    // ------------------------------------------------
    // SOCKET CONNECTION
    // ------------------------------------------------

    const socket = io(
      terminalUrl,
      {
        transports: ["websocket"],
        withCredentials: true,
      }
    );

    socketRef.current = socket;

    // ------------------------------------------------
    // RESIZE TERMINAL
    // ------------------------------------------------

    const resizeTerminal = () => {
      try {
        if (!containerRef.current) {
          return;
        }

        fitAddon.fit();

        const cols = terminal.cols;
        const rows = terminal.rows;

        if (
          !socket.connected ||
          cols <= 0 ||
          rows <= 0
        ) {
          return;
        }

        socket.emit(
          "terminal:resize",
          {
            cols,
            rows,
          }
        );
      } catch (error) {
        console.error(
          "Terminal resize error:",
          error
        );
      }
    };

    // ------------------------------------------------
    // SOCKET CONNECT
    // ------------------------------------------------

    socket.on("connect", () => {
      setConnected(true);

      callbackRef.current?.(
        socket.id
      );

      // Make sure xterm dimensions are ready
      fitTerminal();

      // ----------------------------------------------
      // INITIALIZE PTY
      // ----------------------------------------------

      socket.emit(
        "terminal:init",
        {
          projectId,
          userId,

          // Send actual xterm dimensions
          cols: terminal.cols,
          rows: terminal.rows,
        }
      );
    });

    // ------------------------------------------------
    // PTY READY
    // ------------------------------------------------

    socket.on(
      "terminal:ready",
      ({ cols, rows }) => {
        console.log(
          "TERMINAL READY:",
          {
            cols,
            rows,
          }
        );

        /*
         * Backend has now:
         *
         * 1. Synced project
         * 2. Spawned PowerShell
         * 3. Created PTY session
         *
         * Now sync the final browser dimensions.
         */

        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            resizeTerminal();

            terminal.focus();
          });
        });
      }
    );

    // ------------------------------------------------
    // TERMINAL OUTPUT
    // ------------------------------------------------

    socket.on(
      "terminal:data",
      (data) => {
        if (
          data === undefined ||
          data === null
        ) {
          return;
        }

        terminal.write(
          String(data)
        );
      }
    );

    // ------------------------------------------------
    // IMPORTANT
    //
    // NO terminal:prompt LISTENER
    //
    // PowerShell itself generates:
    //
    // PS C:\Users\...
    //
    // ------------------------------------------------

    // ------------------------------------------------
    // CLEAR TERMINAL EVENT
    // ------------------------------------------------

    socket.on(
      "terminal:clear",
      () => {
        terminal.clear();

        terminal.write(
          "\x1b[2J\x1b[H"
        );

        terminal.focus();
      }
    );

    // ------------------------------------------------
    // CONNECTION ERROR
    // ------------------------------------------------

    socket.on(
      "connect_error",
      (error) => {
        setConnected(false);

        terminal.write(
          `\r\n\x1b[31m${error.message}\x1b[0m\r\n`
        );
      }
    );

    // ------------------------------------------------
    // DISCONNECT
    // ------------------------------------------------

    socket.on(
      "disconnect",
      () => {
        setConnected(false);

        callbackRef.current?.(
          null
        );
      }
    );

    // ------------------------------------------------
    // USER INPUT
    // ------------------------------------------------

    const disposable =
      terminal.onData(
        (data) => {
          if (!socket.connected) {
            return;
          }

          socket.emit(
            "terminal:write",
            data
          );
        }
      );

    // ------------------------------------------------
    // WINDOW RESIZE
    // ------------------------------------------------

    const handleWindowResize =
      () => {
        resizeTerminal();
      };

    window.addEventListener(
      "resize",
      handleWindowResize
    );

    // ------------------------------------------------
    // CONTAINER RESIZE
    // ------------------------------------------------

    const resizeObserver =
      new ResizeObserver(() => {
        resizeTerminal();
      });

    resizeObserver.observe(
      containerRef.current
    );

    // ------------------------------------------------
    // FOCUS
    // ------------------------------------------------

    const focusTerminal = () => {
      terminal.focus();
    };

    containerRef.current.addEventListener(
      "click",
      focusTerminal
    );

    // ------------------------------------------------
    // CLEANUP
    // ------------------------------------------------

    return () => {
      window.removeEventListener(
        "resize",
        handleWindowResize
      );

      resizeObserver.disconnect();

      containerRef.current?.removeEventListener(
        "click",
        focusTerminal
      );

      disposable.dispose();

      callbackRef.current?.(
        null
      );

      socket.disconnect();

      terminal.dispose();

      socketRef.current = null;
      terminalRef.current = null;
      fitAddonRef.current = null;
    };
  }, [projectId, userId]);

  // --------------------------------------------------
  // CLEAR TERMINAL BUTTON
  // --------------------------------------------------

  const clearTerminal = () => {
    const terminal =
      terminalRef.current;

    if (!terminal) {
      return;
    }

    terminal.clear();

    terminal.write(
      "\x1b[2J\x1b[H"
    );

    terminal.focus();
  };

  // --------------------------------------------------
  // UI
  // --------------------------------------------------

  return (
    <div className="flex h-full flex-col bg-[#0d0d0f]">
      {/* -------------------------------------------- */}
      {/* STATUS BAR */}
      {/* -------------------------------------------- */}

      <div className="flex h-7 shrink-0 items-center justify-between border-b border-white/[0.05] px-3">
        <div className="flex items-center gap-2">
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              connected
                ? "bg-emerald-400"
                : "bg-zinc-600"
            }`}
          />

          <span className="text-[11px] text-zinc-500">
            {connected
              ? "powershell — connected"
              : "powershell — disconnected"}
          </span>
        </div>

        <button
          type="button"
          onClick={clearTerminal}
          title="Clear terminal"
          className="rounded p-1 text-zinc-500 transition-colors hover:bg-white/10 hover:text-white"
        >
          <Eraser size={12} />
        </button>
      </div>

      {/* -------------------------------------------- */}
      {/* XTERM CONTAINER */}
      {/* -------------------------------------------- */}

      <div
        ref={containerRef}
        className="min-h-0 flex-1 cursor-text overflow-hidden"
      />
    </div>
  );
}