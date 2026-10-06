const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json({ limit: "2mb" }));

const OLLAMA_URL = "http://localhost:11434/api/chat";
const MODEL = "llama3.2";

// Only the last N messages are sent to the model (keeps it fast and inside the context window)
const MAX_HISTORY = 20;

const SYSTEM_PROMPT = `You are MyAI, a helpful personal AI assistant.

Answer the user clearly and naturally.

IMPORTANT CODE FORMATTING RULE:
If your answer contains programming code, ALWAYS put the code inside a Markdown code block.

Use triple backticks and specify the language whenever possible.

Example:

\`\`\`javascript
const greeting = "Hello World!";
console.log(greeting);
\`\`\`

Never show programming code as plain text.

For normal explanations, use normal Markdown formatting.`;

app.get("/", (req, res) => {
  res.json({
    message: "MyAI Backend is running successfully! 🚀",
  });
});

app.post("/chat", async (req, res) => {
  try {
    const { messages, message } = req.body;

    // Accept the full history (messages) and still support the old { message } format
    let history = [];

    if (Array.isArray(messages)) {
      history = messages
        .filter(
          (m) =>
            m &&
            (m.role === "user" || m.role === "assistant") &&
            typeof m.content === "string" &&
            m.content.trim()
        )
        .map((m) => ({ role: m.role, content: m.content }));
    } else if (typeof message === "string" && message.trim()) {
      history = [{ role: "user", content: message }];
    }

    if (history.length === 0 || history[history.length - 1].role !== "user") {
      return res.status(400).json({
        error: "A user message is required",
      });
    }

    const recent = history.slice(-MAX_HISTORY);

    const response = await fetch(OLLAMA_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...recent],
        stream: false,
        options: { num_ctx: 4096 },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();

      return res.status(500).json({
        error: `Ollama error: ${errorText}`,
      });
    }

    const data = await response.json();

    res.json({
      reply: data.message?.content ?? "",
    });
  } catch (error) {
    console.error("Ollama Error:", error);

    res.status(500).json({
      error: error.message || "AI response failed",
    });
  }
});

const PORT = 5000;

app.listen(PORT, "127.0.0.1", () => {
  console.log(`MyAI Backend running at http://localhost:${PORT}`);
});