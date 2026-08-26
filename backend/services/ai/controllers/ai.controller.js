import {
  HumanMessage,
  AIMessage,
} from "@langchain/core/messages";

import {
  createCodingGraph,
} from "../graph/graph.js";

import {
  deductCredits,
} from "../config/deductCredits.js";


// =====================================================
// CREDIT COST
// =====================================================

const CREDIT_COST = {
  plan: 1,
  small_edit: 1,
  debug: 2,
  code: 5,
};


// =====================================================
// TASK CLASSIFIER
// =====================================================

const getTaskType = (message = "") => {

  const text =
    message
      .toLowerCase()
      .trim();


  // ---------------------------------------------------
  // DEBUG
  // ---------------------------------------------------

  if (
    text.includes("fix") ||
    text.includes("error") ||
    text.includes("bug") ||
    text.includes("debug") ||
    text.includes("not working") ||
    text.includes("doesn't work") ||
    text.includes("issue")
  ) {
    return "debug";
  }


  // ---------------------------------------------------
  // SMALL EDIT
  // ---------------------------------------------------

  if (
    text.includes("change") ||
    text.includes("update") ||
    text.includes("modify") ||
    text.includes("rename") ||
    text.includes("remove") ||
    text.includes("add button") ||
    text.includes("change color") ||
    text.includes("change text") ||
    text.includes("make it")
  ) {
    return "small_edit";
  }


  // ---------------------------------------------------
  // NEW PROJECT
  // ---------------------------------------------------

  if (
    text.includes("create") ||
    text.includes("build") ||
    text.includes("make") ||
    text.includes("develop") ||
    text.includes("generate") ||
    text.includes("website") ||
    text.includes("application") ||
    text.includes("app") ||
    text.includes("project")
  ) {
    return "plan";
  }


  // ---------------------------------------------------
  // DEFAULT
  // ---------------------------------------------------

  return "code";
};


// =====================================================
// SSE HELPER
// =====================================================

const sendEvent = (
  res,
  type,
  data
) => {

  if (
    res.writableEnded ||
    res.destroyed
  ) {
    return false;
  }

  try {

    const payload =
      JSON.stringify(
        data ?? {}
      );


    res.write(
      `event: ${type}\n`
    );

    res.write(
      `data: ${payload}\n\n`
    );


    if (
      typeof res.flush ===
      "function"
    ) {
      res.flush();
    }


    return true;

  } catch (error) {

    console.error(
      "SSE SEND ERROR:",
      error
    );

    return false;
  }
};


// =====================================================
// HEARTBEAT
// =====================================================

const startHeartbeat = (res) => {

  return setInterval(
    () => {

      if (
        res.writableEnded ||
        res.destroyed
      ) {
        return;
      }


      try {

        res.write(
          `: heartbeat ${Date.now()}\n\n`
        );


        if (
          typeof res.flush ===
          "function"
        ) {
          res.flush();
        }

      } catch {
        // Client disconnected
      }

    },
    15000
  );
};


// =====================================================
// HISTORY
// =====================================================

const buildHistory = (
  history
) => {

  if (
    !Array.isArray(history)
  ) {
    return [];
  }


  // Only keep recent messages.
  // This reduces LLM token usage.

  const recent =
    history.slice(-6);


  return recent
    .filter(
      (item) =>
        item?.content &&
        (
          item.role === "user" ||
          item.role === "assistant"
        )
    )
    .map(
      (item) => {

        if (
          item.role === "user"
        ) {

          return new HumanMessage(
            item.content
          );
        }


        return new AIMessage(
          item.content
        );
      }
    );
};


// =====================================================
// CHAT STREAM
// =====================================================

export const chatWithAIStream =
  async (req, res) => {

    let disconnected = false;

    let heartbeat = null;

    let creditsDeducted = false;


    try {

      // =================================================
      // REQUEST
      // =================================================

      const {
        projectId,
        message,
        history = [],
        terminalSocketId = null,
      } = req.body;


      const userId =
        req.headers[
          "x-user-id"
        ];


      console.log(
        "\n================================="
      );

      console.log(
        "AI REQUEST"
      );

      console.log(
        "PROJECT:",
        projectId
      );

      console.log(
        "USER:",
        userId
      );

      console.log(
        "SOCKET:",
        terminalSocketId
      );

      console.log(
        "MESSAGE:",
        message
      );

      console.log(
        "================================="
      );


      // =================================================
      // VALIDATION
      // =================================================

      if (!projectId) {

        return res.status(400).json({
          success: false,
          message:
            "projectId is required",
        });
      }


      if (
        !message ||
        !message.trim()
      ) {

        return res.status(400).json({
          success: false,
          message:
            "message is required",
        });
      }


      if (!userId) {

        return res.status(401).json({
          success: false,
          message:
            "User ID is required",
        });
      }


      // =================================================
      // TASK TYPE
      // =================================================

      const taskType =
        getTaskType(
          message
        );


      const requiredCredits =10


      console.log(
        "TASK TYPE:",
        taskType
      );

      console.log(
        "CREDIT COST:",
        requiredCredits
      );


      // =================================================
      // DEDUCT CREDITS
      //
      // IMPORTANT:
      // Do this BEFORE SSE headers.
      // This allows us to return proper HTTP 402.
      // =================================================

      let creditResult;

      try {

        creditResult =
          await deductCredits(
            userId,
            requiredCredits
          );


        creditsDeducted = true;


        console.log(
          "CREDITS DEDUCTED:",
          requiredCredits
        );

        console.log(
          "REMAINING CREDITS:",
          creditResult?.credits
        );

      } catch (error) {

        console.error(
          "CREDIT ERROR:",
          error
        );


        // -----------------------------------------------
        // INSUFFICIENT CREDITS
        // -----------------------------------------------

        if (
          error?.status === 402 ||
          error?.response?.status === 402
        ) {

          return res.status(402).json({
            success: false,

            code:
              "INSUFFICIENT_CREDITS",

            message:
              "Insufficient AI credits.",

            credits:
              error?.credits ??
              0,
          });
        }


        // -----------------------------------------------
        // AUTH SERVICE ERROR
        // -----------------------------------------------

        return res.status(503).json({
          success: false,

          code:
            "CREDIT_SERVICE_UNAVAILABLE",

          message:
            "Unable to verify AI credits. Please try again.",
        });
      }


      // =================================================
      // SSE HEADERS
      // =================================================

      res.statusCode = 200;


      res.setHeader(
        "Content-Type",
        "text/event-stream; charset=utf-8"
      );


      res.setHeader(
        "Cache-Control",
        "no-cache, no-transform"
      );


      res.setHeader(
        "Connection",
        "keep-alive"
      );


      res.setHeader(
        "X-Accel-Buffering",
        "no"
      );


      res.setHeader(
        "Access-Control-Allow-Origin",
        req.headers.origin ||
        "*"
      );


      res.setHeader(
        "Access-Control-Allow-Credentials",
        "true"
      );


      res.flushHeaders?.();


      // =================================================
      // CLIENT DISCONNECT
      // =================================================

      const handleClose =
        () => {

          if (
            !res.writableEnded
          ) {

            disconnected =
              true;


            console.log(
              "AI CLIENT DISCONNECTED"
            );
          }
        };


      res.once(
        "close",
        handleClose
      );


      // =================================================
      // HEARTBEAT
      // =================================================

      heartbeat =
        startHeartbeat(
          res
        );


      // =================================================
      // START
      // =================================================

      sendEvent(
        res,

        "start",

        {
          success: true,

          message:
            "AI started",

          taskType,

          creditsUsed:
            requiredCredits,

          creditsRemaining:
            creditResult?.credits ??
            null,
        }
      );


      console.log(
        "SSE -> start"
      );


      // =================================================
      // GRAPH
      // =================================================

      console.log(
        "START GRAPH"
      );


      const graph =
        createCodingGraph({
          projectId,

          userId,

          terminalSocketId,

          taskType,
        });


      console.log(
        "CODING GRAPH READY"
      );


      // =================================================
      // HISTORY
      // =================================================

      const messages =
        buildHistory(
          history
        );


      // Current user message

      messages.push(
        new HumanMessage(
          message.trim()
        )
      );


      console.log(
        "GRAPH HISTORY:",
        messages.length
      );


      // =================================================
      // GRAPH STREAM
      // =================================================

      const stream =
        await graph.stream(
          {
            messages,
          },
          {
            streamMode:
              "updates",

            // Keep this reasonable.
            // Too high = unnecessary LLM calls.

            recursionLimit:
              40,
          }
        );


      let finalMessage =
        "";


      // =================================================
      // STREAM LOOP
      // =================================================

      for await (
        const chunk of stream
      ) {

        // ------------------------------------------------
        // CLIENT DISCONNECTED
        // ------------------------------------------------

        if (
          disconnected ||
          res.writableEnded
        ) {

          console.log(
            "GRAPH STOPPED - CLIENT DISCONNECTED"
          );

          break;
        }


        console.log(
          "GRAPH CHUNK:",
          Object.keys(
            chunk || {}
          )
        );


        // =================================================
        // AGENT
        // =================================================

        if (
          chunk?.agent
        ) {

          const agentMessages =
            chunk.agent
              ?.messages || [];


          const last =
            agentMessages[
              agentMessages.length - 1
            ];


          if (!last) {
            continue;
          }


          // ===============================================
          // TOOL CALLS
          // ===============================================

          if (
            Array.isArray(
              last.tool_calls
            ) &&
            last.tool_calls.length
          ) {

            for (
              const call of
                last.tool_calls
            ) {

              console.log(
                "SSE -> tool_start:",
                call.name
              );


              sendEvent(
                res,

                "tool_start",

                {
                  tool:
                    call.name,

                  args:
                    call.args ||
                    {},
                }
              );
            }


            continue;
          }


          // ===============================================
          // AI RESPONSE
          // ===============================================

          let content =
            "";


          if (
            typeof last.content ===
            "string"
          ) {

            content =
              last.content;

          } else if (
            Array.isArray(
              last.content
            )
          ) {

            content =
              last.content
                .filter(
                  (item) =>
                    item?.type ===
                    "text"
                )
                .map(
                  (item) =>
                    item.text
                )
                .join("");
          }


          if (
            content
          ) {

            finalMessage =
              content;


            sendEvent(
              res,

              "message",

              {
                content,
              }
            );
          }
        }


        // =================================================
        // TOOLS
        // =================================================

        if (
          chunk?.tools
        ) {

          const toolMessages =
            chunk.tools
              ?.messages || [];


          for (
            const toolMessage of
              toolMessages
          ) {

            let result =
              null;


            // =============================================
            // PARSE TOOL RESULT
            // =============================================

            try {

              if (
                typeof toolMessage.content ===
                "string"
              ) {

                result =
                  JSON.parse(
                    toolMessage.content
                  );

              } else {

                result =
                  toolMessage.content;
              }

            } catch {

              result =
                null;
            }


            // =============================================
            // FILE/FOLDER EVENT
            // =============================================

            if (
              result?.operation
            ) {

              console.log(
                "SSE ->",
                result.operation
              );


              sendEvent(
                res,

                result.operation,

                result
              );


              continue;
            }


            // =============================================
            // COMMAND RESULT
            // =============================================

            if (
              result?.command ||
              result?.output ||
              result?.stdout ||
              result?.stderr ||
              result?.exitCode !==
                undefined
            ) {

              console.log(
                "SSE -> command_result"
              );


              sendEvent(
                res,

                "command_result",

                result
              );


              continue;
            }


            // =============================================
            // TOOL RESULT
            // =============================================

            sendEvent(
              res,

              "tool_result",

              {
                content:
                  typeof toolMessage.content ===
                  "string"

                    ? toolMessage.content

                    : JSON.stringify(
                        toolMessage.content
                      ),
              }
            );
          }
        }
      }


      // =================================================
      // DONE
      // =================================================

      if (
        !disconnected &&
        !res.writableEnded
      ) {

        console.log(
          "SSE -> done"
        );


        sendEvent(
          res,

          "done",

          {
            success:
              true,

            taskType,

            creditsUsed:
              requiredCredits,

            creditsRemaining:
              creditResult?.credits ??
              null,

            message:
              finalMessage ||
              "Done.",
          }
        );


        res.end();
      }

    } catch (error) {

      console.error(
        "AI STREAM ERROR:",
        error
      );


      // =================================================
      // CLIENT DISCONNECTED
      // =================================================

      if (
        disconnected
      ) {
        return;
      }


      // =================================================
      // ERROR AFTER SSE STARTED
      // =================================================

      if (
        res.headersSent
      ) {

        sendEvent(
          res,

          "error",

          {
            success:
              false,

            message:
              error?.message ||
              "AI request failed.",

            creditsUsed:
              creditsDeducted
                ? "deducted"
                : "not_deducted",
          }
        );


        if (
          !res.writableEnded
        ) {
          res.end();
        }


        return;
      }


      // =================================================
      // NORMAL HTTP ERROR
      // =================================================

      return res.status(500).json({
        success: false,

        message:
          error?.message ||
          "AI request failed.",
      });

    } finally {

      // =================================================
      // CLEANUP
      // =================================================

      if (
        heartbeat
      ) {

        clearInterval(
          heartbeat
        );

        heartbeat =
          null;
      }
    }
  };