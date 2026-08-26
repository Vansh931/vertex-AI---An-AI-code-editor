import dotenv from "dotenv";
dotenv.config();

import express from "express";
import http from "http";
import { Server } from "socket.io";
import fs from "fs/promises";
import path from "path";
import os from "os";
import pty from "node-pty";

// =====================================================
// CONFIG
// =====================================================

const PORT = process.env.PORT || 8004;

const FILE_SERVICE_URL =
  process.env.FILE_SERVICE_URL || "http://localhost:8003";

const WORKSPACE_ROOT =
  process.env.WORKSPACE_ROOT ||
  path.join(os.tmpdir(), "virtual-code-projects");

// Real shell — bash/zsh on Linux/Mac, PowerShell on Windows.
const SHELL =
  process.env.SHELL ||
  (process.platform === "win32"
    ? "powershell.exe"
    : "bash");

// =====================================================
// APP
// =====================================================

const app = express();

app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: true,
    credentials: true,
  },
});

// =====================================================
// STATE
// One real PTY process per connected socket.
// =====================================================

const sessions = new Map();

// socket.id -> {
//   projectId,
//   userId,
//   cwd,
//   ptyProcess
// }

// =====================================================
// HELPERS
// =====================================================

const send = (socket, data) => {
  if (!socket?.connected) return;

  socket.emit(
    "terminal:data",
    String(data ?? "")
  );
};

// -----------------------------------------------------
// Safe file/folder name
// -----------------------------------------------------

const safeName = (name) => {
  if (
    !name ||
    name === "." ||
    name === ".." ||
    name.includes("/") ||
    name.includes("\\")
  ) {
    throw new Error(
      `Invalid file/folder name: ${name}`
    );
  }

  return name;
};

// -----------------------------------------------------
// Workspace
// -----------------------------------------------------

const workspace = (projectId) => {
  return path.join(
    WORKSPACE_ROOT,
    String(projectId)
  );
};

// -----------------------------------------------------
// Normalize terminal dimensions
// -----------------------------------------------------

const normalizeCols = (cols) => {
  const value = Number(cols);

  if (!Number.isFinite(value)) {
    return 80;
  }

  return Math.max(
    20,
    Math.min(Math.floor(value), 500)
  );
};

const normalizeRows = (rows) => {
  const value = Number(rows);

  if (!Number.isFinite(value)) {
    return 30;
  }

  return Math.max(
    5,
    Math.min(Math.floor(value), 200)
  );
};

// =====================================================
// FILE SERVICE
// =====================================================

const getTree = async (projectId, userId) => {
  const url =
    `${FILE_SERVICE_URL}/tree/${projectId}`;

  const response = await fetch(url, {
    headers: {
      "x-user-id": String(userId),
    },
  });

  const text = await response.text();

  let data = {};

  try {
    data = text
      ? JSON.parse(text)
      : {};
  } catch {
    data = {
      message: text,
    };
  }

  if (!response.ok) {
    throw new Error(
      data?.message ||
        `File service returned ${response.status}`
    );
  }

  return Array.isArray(data.tree)
    ? data.tree
    : [];
};

// =====================================================
// WRITE TREE TO DISK
// =====================================================

const writeNodes = async (
  nodes,
  directory
) => {
  if (!Array.isArray(nodes)) return;

  for (const node of nodes) {
    const name = safeName(node.name);

    const target = path.join(
      directory,
      name
    );

    // -----------------------------------------------
    // FOLDER
    // -----------------------------------------------

    if (node.type === "folder") {
      await fs.mkdir(target, {
        recursive: true,
      });

      await writeNodes(
        node.children || [],
        target
      );

      continue;
    }

    // -----------------------------------------------
    // FILE
    // -----------------------------------------------

    if (node.type === "file") {
      await fs.mkdir(
        path.dirname(target),
        {
          recursive: true,
        }
      );

      await fs.writeFile(
        target,
        node.content || "",
        "utf8"
      );
    }
  }
};

// =====================================================
// SYNC PROJECT
// Mongo -> Disk
// =====================================================

const syncProject = async (
  projectId,
  userId
) => {
  const tree = await getTree(
    projectId,
    userId
  );

  const root = workspace(projectId);

  await fs.mkdir(root, {
    recursive: true,
  });

  // Mongo tree has an artificial root folder
  // wrapping the real project.
  //
  // Skip that wrapper so disk layout matches
  // the actual project root.

  if (
    tree.length === 1 &&
    tree[0]?.type === "folder"
  ) {
    await writeNodes(
      tree[0].children || [],
      root
    );
  } else {
    await writeNodes(
      tree,
      root
    );
  }

  console.log(
    "PROJECT SYNCED:",
    root
  );

  return {
    tree,
    root,
  };
};

// =====================================================
// SOCKET CONNECTION
// =====================================================

io.on("connection", (socket) => {
  console.log(
    "TERMINAL CONNECTED:",
    socket.id
  );

  // =================================================
  // INIT
  // Spawn a real PTY for this socket
  // =================================================

  socket.on(
    "terminal:init",
    async ({
      projectId,
      userId,
      cols = 80,
      rows = 30,
    }) => {
      try {
        projectId = String(projectId);
        userId = String(userId);

        // -------------------------------------------
        // VALIDATION
        // -------------------------------------------

        if (!projectId || !userId) {
          throw new Error(
            "Project ID and User ID are required"
          );
        }

        // -------------------------------------------
        // If a session already exists for this
        // socket, clean it before creating another.
        // -------------------------------------------

        const existingSession =
          sessions.get(socket.id);

        if (existingSession) {
          try {
            existingSession.ptyProcess.kill();
          } catch {}

          sessions.delete(socket.id);
        }

        // -------------------------------------------
        // TERMINAL SIZE
        // -------------------------------------------

        cols = normalizeCols(cols);
        rows = normalizeRows(rows);

        // -------------------------------------------
        // SYNC PROJECT
        // Mongo -> disk
        // -------------------------------------------

        const { root } =
          await syncProject(
            projectId,
            userId
          );

        // -------------------------------------------
        // SPAWN REAL SHELL
        // -------------------------------------------

        const ptyProcess = pty.spawn(
          SHELL,
          [],
          {
            name: "xterm-256color",

            // IMPORTANT:
            // Use the dimensions coming from xterm.
            // This prevents the initial 80-column
            // PowerShell prompt from being rendered
            // against a differently sized terminal.

            cols,
            rows,

            cwd: root,

            env: {
              ...process.env,
              FORCE_COLOR: "1",
            },
          }
        );

        // -------------------------------------------
        // PTY OUTPUT -> CLIENT
        // -------------------------------------------

        ptyProcess.onData((data) => {
          send(socket, data);
        });

        // -------------------------------------------
        // PTY EXIT
        // -------------------------------------------

        ptyProcess.onExit(
          ({ exitCode }) => {
            send(
              socket,
              `\r\n\x1b[90m[shell exited: ${exitCode}]\x1b[0m\r\n`
            );

            const session =
              sessions.get(socket.id);

            if (
              session?.ptyProcess ===
              ptyProcess
            ) {
              sessions.delete(
                socket.id
              );
            }
          }
        );

        // -------------------------------------------
        // SAVE SESSION
        // -------------------------------------------

        sessions.set(socket.id, {
          projectId,
          userId,
          cwd: root,
          ptyProcess,
        });

        console.log(
          "TERMINAL INIT:",
          {
            socketId: socket.id,
            projectId,
            userId,
            cwd: root,
            cols,
            rows,
          }
        );

        // -------------------------------------------
        // IMPORTANT:
        // Tell frontend that PTY is ready.
        // Frontend can now perform the final resize
        // and focus the terminal.
        // -------------------------------------------

        socket.emit(
          "terminal:ready",
          {
            cols,
            rows,
          }
        );
      } catch (error) {
        console.error(
          "TERMINAL INIT ERROR:",
          error
        );

        send(
          socket,
          `\r\n\x1b[31m${error.message}\x1b[0m\r\n`
        );
      }
    }
  );

  // =================================================
  // USER INPUT
  //
  // Raw keystrokes go straight to PTY.
  //
  // PowerShell/bash handles:
  // - typing
  // - backspace
  // - history
  // - ctrl+c
  // - tab completion
  // - arrows
  // - command editing
  //
  // No manual buffer required.
  // =================================================

  socket.on(
    "terminal:write",
    (data) => {
      const session =
        sessions.get(socket.id);

      if (!session) return;

      if (
        data === undefined ||
        data === null
      ) {
        return;
      }

      try {
        session.ptyProcess.write(
          String(data)
        );
      } catch (error) {
        console.error(
          "PTY WRITE ERROR:",
          error
        );
      }
    }
  );

  // =================================================
  // RESIZE
  // =================================================

  socket.on(
    "terminal:resize",
    ({ cols, rows }) => {
      const session =
        sessions.get(socket.id);

      if (!session) return;

      cols = Number(cols);
      rows = Number(rows);

      // -------------------------------------------
      // Validate
      // -------------------------------------------

      if (
        !Number.isFinite(cols) ||
        !Number.isFinite(rows)
      ) {
        return;
      }

      cols = normalizeCols(cols);
      rows = normalizeRows(rows);

      try {
        session.ptyProcess.resize(
          cols,
          rows
        );
      } catch (error) {
        console.error(
          "PTY RESIZE ERROR:",
          error
        );
      }
    }
  );

  // =================================================
  // AI-DRIVEN COMMAND
  //
  // Runs command on the same PTY.
  //
  // A unique marker is appended so we know when
  // the command has finished and what its exit code is.
  // =================================================

  socket.on(
    "terminal:run-command",
    async ({
      projectId:
        requestedProjectId,
      userId:
        requestedUserId,
      command,
      requestId,
    }) => {
      const session =
        sessions.get(socket.id);

      try {
        // -------------------------------------------
        // SESSION
        // -------------------------------------------

        if (!session) {
          throw new Error(
            "Terminal not initialized"
          );
        }

        // -------------------------------------------
        // PROJECT SECURITY
        // -------------------------------------------

        if (
          String(requestedProjectId) !==
          String(session.projectId)
        ) {
          throw new Error(
            "Project mismatch"
          );
        }

        // -------------------------------------------
        // USER SECURITY
        // -------------------------------------------

        if (
          String(requestedUserId) !==
          String(session.userId)
        ) {
          throw new Error(
            "User mismatch"
          );
        }

        // -------------------------------------------
        // REFRESH DISK FROM MONGO
        //
        // This makes newly created files,
        // package.json etc. available to the shell.
        // -------------------------------------------

        await syncProject(
          session.projectId,
          session.userId
        );

        // -------------------------------------------
        // COMMAND
        // -------------------------------------------

        const commandText =
          String(command || "").trim();

        if (!commandText) {
          socket.emit(
            "terminal:command-result",
            {
              success: true,
              requestId,
            }
          );

          return;
        }

        // -------------------------------------------
        // UNIQUE MARKER
        // -------------------------------------------

        const marker =
          `__CMD_DONE_${requestId}__`;

        let buffer = "";

        let exitCode = null;

        // -------------------------------------------
        // LISTEN FOR COMMAND COMPLETION
        // -------------------------------------------

        const onData = (chunk) => {
          buffer += chunk;

          const markerIndex =
            buffer.indexOf(marker);

          if (markerIndex === -1) {
            return;
          }

          const markerOutput =
            buffer.slice(markerIndex);

          const match =
            markerOutput.match(
              new RegExp(
                `${marker}:(\\d+)`
              )
            );

          if (!match) {
            return;
          }

          exitCode =
            Number(match[1]);

          cleanup();

          socket.emit(
            "terminal:command-result",
            {
              success:
                exitCode === 0,

              requestId,

              command:
                commandText,

              code:
                exitCode,
            }
          );
        };

        const disposable =
          session.ptyProcess.onData(
            onData
          );

        // -------------------------------------------
        // TIMEOUT
        // -------------------------------------------

        const timeout =
          setTimeout(() => {
            cleanup();

            socket.emit(
              "terminal:command-result",
              {
                success: false,
                requestId,
                error:
                  "Command timeout",
              }
            );
          }, 120000);

        // -------------------------------------------
        // CLEANUP
        // -------------------------------------------

        function cleanup() {
          clearTimeout(timeout);

          try {
            disposable.dispose();
          } catch {}
        }

        // -------------------------------------------
        // RUN COMMAND
        //
        // The marker contains the exit code.
        //
        // Example:
        //
        // npm install;
        // echo "__CMD_DONE_xxx__:$?"
        //
        // -------------------------------------------

        session.ptyProcess.write(
          `${commandText}; echo "${marker}:$?"\r`
        );
      } catch (error) {
        console.error(
          "AI COMMAND ERROR:",
          error
        );

        socket.emit(
          "terminal:command-result",
          {
            success: false,
            requestId,
            error: error.message,
          }
        );
      }
    }
  );

  // =================================================
  // DISCONNECT
  // =================================================

  socket.on(
    "disconnect",
    () => {
      console.log(
        "TERMINAL DISCONNECTED:",
        socket.id
      );

      const session =
        sessions.get(socket.id);

      if (session) {
        try {
          session.ptyProcess.kill();
        } catch {}

        sessions.delete(
          socket.id
        );
      }
    }
  );
});

// =====================================================
// HTTP EXECUTE
//
// Same external API as before.
// =====================================================

app.post(
  "/execute",
  async (req, res) => {
    try {
      const {
        socketId,
        projectId,
        userId,
        command,
      } = req.body;

      // -------------------------------------------
      // VALIDATION
      // -------------------------------------------

      if (
        !socketId ||
        !projectId ||
        !userId ||
        !command
      ) {
        return res.status(400).json({
          success: false,
          message:
            "socketId, projectId, userId and command are required",
        });
      }

      // -------------------------------------------
      // SOCKET
      // -------------------------------------------

      const socket =
        io.sockets.sockets.get(
          socketId
        );

      if (!socket) {
        return res.status(404).json({
          success: false,
          message:
            "Terminal socket not connected",
        });
      }

      // -------------------------------------------
      // SESSION
      // -------------------------------------------

      const session =
        sessions.get(socketId);

      if (!session) {
        return res.status(400).json({
          success: false,
          message:
            "Terminal session not initialized",
        });
      }

      // -------------------------------------------
      // PROJECT SECURITY
      // -------------------------------------------

      if (
        String(session.projectId) !==
        String(projectId)
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Project mismatch",
        });
      }

      // -------------------------------------------
      // USER SECURITY
      // -------------------------------------------

      if (
        String(session.userId) !==
        String(userId)
      ) {
        return res.status(403).json({
          success: false,
          message:
            "User mismatch",
        });
      }

      // -------------------------------------------
      // REQUEST ID
      // -------------------------------------------

      const requestId =
        `${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}`;

      // -------------------------------------------
      // WAIT FOR COMMAND RESULT
      // -------------------------------------------

      const result =
        await new Promise(
          (resolve) => {
            const timeout =
              setTimeout(() => {
                socket.off(
                  "terminal:command-result",
                  handler
                );

                resolve({
                  success: false,
                  requestId,
                  error:
                    "Command timeout",
                });
              }, 120000);

            const handler = (
              data
            ) => {
              if (
                data?.requestId !==
                requestId
              ) {
                return;
              }

              clearTimeout(
                timeout
              );

              socket.off(
                "terminal:command-result",
                handler
              );

              resolve(data);
            };

            socket.on(
              "terminal:command-result",
              handler
            );

            socket.emit(
              "terminal:run-command",
              {
                projectId,
                userId,
                command,
                requestId,
              }
            );
          }
        );

      return res.json(result);
    } catch (error) {
      console.error(
        "EXECUTE ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// =====================================================
// HEALTH
// =====================================================

app.get(
  "/",
  (req, res) => {
    res.json({
      success: true,
      message:
        "Terminal service running",
    });
  }
);

app.get(
  "/health",
  (req, res) => {
    res.json({
      success: true,
      service: "terminal",
      port: PORT,
    });
  }
);

// =====================================================
// START
// =====================================================

await fs.mkdir(
  WORKSPACE_ROOT,
  {
    recursive: true,
  }
);

server.listen(
  PORT,
  () => {
    console.log(
      "================================="
    );

    console.log(
      `TERMINAL SERVICE : ${PORT}`
    );

    console.log(
      `FILE SERVICE     : ${FILE_SERVICE_URL}`
    );

    console.log(
      `WORKSPACE ROOT   : ${WORKSPACE_ROOT}`
    );

    console.log(
      `SHELL            : ${SHELL}`
    );

    console.log(
      "================================="
    );
  }
);