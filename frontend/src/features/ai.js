export const chatWithAI = async ({
  projectId,
  message,
  history = [],
  terminalSocketId = null,
  onEvent,
}) => {

  const response =
    await fetch(
      `${import.meta.env.VITE_SERVER_URL}/api/ai/chat/stream`,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",

          Accept:
            "text/event-stream",
        },

        credentials:
          "include",

        body:
          JSON.stringify({
            projectId,

            message,

            history,

            terminalSocketId,
          }),
      }
    );

  if (
    !response.ok
  ) {

    let message =
      "AI request failed.";

    try {

      const data =
        await response.json();

        console.log(data)

      message =
        data?.message ||
        message;

    } catch {}

    throw new Error(
      message
    );
  }

  if (
    !response.body
  ) {

    throw new Error(
      "AI streaming is not supported."
    );
  }

  const reader =
    response.body.getReader();

  const decoder =
    new TextDecoder();

  let buffer = "";

  try {

    while (true) {

      const {
        value,
        done,
      } =
        await reader.read();

      if (
        done
      ) {
        break;
      }

      const chunk =
        decoder.decode(
          value,
          {
            stream:
              true,
          }
        );

      console.log(
        "AI SSE CHUNK:",
        chunk
      );

      buffer += chunk;

      const events =
        buffer.split(
          "\n\n"
        );

      buffer =
        events.pop() ||
        "";

      for (
        const eventText of
          events
      ) {

        if (
          !eventText.trim()
        ) {
          continue;
        }

        let eventType =
          "message";

        let dataText =
          "";

        const lines =
          eventText.split(
            "\n"
          );

        for (
          const line of
            lines
        ) {

          if (
            line.startsWith(
              "event:"
            )
          ) {

            eventType =
              line
                .slice(6)
                .trim();
          }

          if (
            line.startsWith(
              "data:"
            )
          ) {

            dataText +=
              line
                .slice(5)
                .trim();
          }
        }

        if (
          !dataText
        ) {
          continue;
        }

        let data;

        try {

          data =
            JSON.parse(
              dataText
            );

        } catch {

          data = {
            content:
              dataText,
          };
        }

        console.log(
          "AI SSE EVENT:",
          eventType,
          data
        );

        await onEvent?.(
          eventType,
          data
        );
      }
    }

  } finally {

    reader.releaseLock();
  }
};