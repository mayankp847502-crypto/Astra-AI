const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

const PORT = 5000;
const OLLAMA_URL = "http://localhost:11434/api/generate";
const MODEL = "llama3.2";

// -----------------------------------------
// HOME / SERVER TEST
// -----------------------------------------

app.get("/", (req, res) => {
  res.json({
    message: "Astra AI Backend is running successfully! 🚀",
  });
});

// -----------------------------------------
// CHAT
// -----------------------------------------

app.post("/chat", async (req, res) => {
  try {
    const { message, messages = [] } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        error: "Message is required",
      });
    }

    // -----------------------------------------
    // KEEP ONLY RECENT HISTORY
    // This prevents very long chats from making
    // Ollama unnecessarily slow.
    // -----------------------------------------

    const recentHistory = messages
      .filter(
        (item) =>
          item &&
          (item.role === "user" ||
            item.role === "assistant") &&
          item.content
      )
      .slice(-10);

    const conversationHistory =
      recentHistory
        .map((item) => {
          return `${item.role === "user" ? "User" : "Astra AI"}: ${
            item.content
          }`;
        })
        .join("\n");

    // -----------------------------------------
    // ASTRA AI PROMPT
    // -----------------------------------------

    const prompt = `You are Astra AI, a helpful personal AI assistant.

Answer the user's question clearly and naturally.

IMPORTANT RULES:

1. Give direct and useful answers.
2. Do not unnecessarily repeat the question.
3. Keep simple questions concise.
4. If programming code is needed, ALWAYS use Markdown code blocks.
5. Never put programming code as plain text.
6. Do not pretend that you have live internet access.
7. If the user asks for current/latest information and no web-search results are provided, clearly say that live web access is not currently available.
8. Use the conversation history only when it helps answer the current question.

Recent conversation:
${conversationHistory || "No previous conversation."}

Current user message:
${message}

Astra AI answer:`;

    // -----------------------------------------
    // OLLAMA
    // -----------------------------------------

    const response = await fetch(OLLAMA_URL, {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        model: MODEL,
        prompt: prompt,
        stream: false,

        // Faster / more controlled responses
        options: {
          temperature: 0.5,
          num_predict: 512,
        },
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
      reply:
        data.response ||
        "Sorry, I could not generate a response.",
    });
  } catch (error) {
    console.error("Astra AI Error:", error);

    res.status(500).json({
      error:
        error.message ||
        "AI response failed",
    });
  }
});

// -----------------------------------------
// START SERVER
// -----------------------------------------

app.listen(PORT, "127.0.0.1", () => {
  console.log(
    `Astra AI Backend running at http://localhost:${PORT}`
  );
});