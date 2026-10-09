
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { tavily } = require("@tavily/core");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));

const PORT = 5000;
const OLLAMA_URL = "http://localhost:11434/api/generate";
const MODEL = "llama3.2";

// Keep the model loaded between requests.
const OLLAMA_OPTIONS = {
  temperature: 0.3,
  num_predict: 96,
  num_ctx: 2048,
};

const tavilyClient = process.env.TAVILY_API_KEY
  ? tavily({ apiKey: process.env.TAVILY_API_KEY })
  : null;

// -----------------------------------------
// SERVER TEST
// -----------------------------------------

app.get("/", (req, res) => {
  res.json({
    message: "Astra AI Backend is running successfully! 🚀",
  });
});

// -----------------------------------------
// WEB SEARCH DETECTION
// -----------------------------------------

function needsWebSearch(message) {
  const text = message.toLowerCase();

  const keywords = [
    "latest",
    "today",
    "current",
    "news",
    "recent",
    "search",
    "google",
    "internet",
    "weather",
    "price",
    "stock",
    "score",
    "2026",
    "2025",
    "who is",
    "what happened",
    "happening",
  ];

  return keywords.some((word) => text.includes(word));
}

// -----------------------------------------
// WEB SEARCH
// -----------------------------------------

async function performWebSearch(query) {
  if (!tavilyClient) {
    console.log("Tavily API key missing; skipping web search.");
    return null;
  }

  try {
    console.log("🔎 Web search:", query);

    return await tavilyClient.search(query, {
      searchDepth: "basic",
      maxResults: 3,
      includeAnswer: true,
    });
  } catch (error) {
    console.error("Tavily Search Error:", error.message);
    return null;
  }
}

// -----------------------------------------
// CHAT
// -----------------------------------------

app.post("/chat", async (req, res) => {
  const startedAt = Date.now();

  try {
    const message =
      typeof req.body.message === "string"
        ? req.body.message.trim()
        : "";

    const messages = Array.isArray(req.body.messages)
      ? req.body.messages
      : [];

    if (!message) {
      return res.status(400).json({
        error: "Message is required",
      });
    }

    // Keep only a small amount of recent history.
    const recentHistory = messages
      .filter(
        (item) =>
          item &&
          ["user", "assistant"].includes(item.role) &&
          typeof item.content === "string" &&
          item.content.trim()
      )
      .slice(-4)
      .map((item) => ({
        role: item.role,
        content: item.content.slice(-500),
      }));

    const conversationHistory = recentHistory
      .map(
        (item) =>
          `${item.role === "user" ? "User" : "Astra AI"}: ${item.content}`
      )
      .join("\n");

    // Only search the web when the question appears time-sensitive.
    const useWebSearch = needsWebSearch(message);
    let webContext = "";

    if (useWebSearch) {
      const searchResult = await performWebSearch(message);

      if (searchResult) {
        const answer = searchResult.answer || "";
        const results = (searchResult.results || [])
          .slice(0, 3)
          .map(
            (item, index) =>
              `[${index + 1}] ${item.title || ""}\n` +
              `URL: ${item.url || ""}\n` +
              `Content: ${(item.content || "").slice(0, 700)}`
          )
          .join("\n\n");

        webContext =
          `Use these live search results when relevant.\n` +
          `${answer}\n${results}`;
      }
    }

    // Keep the prompt short to reduce processing.
    const prompt = [
      "You are Astra AI, a helpful personal assistant.",
      "Answer clearly and directly. Keep simple answers short.",
      "Use Markdown code blocks for programming code.",
      "Use supplied web results for current facts; do not invent sources.",
      conversationHistory
        ? `Recent conversation:\n${conversationHistory}`
        : "",
      webContext ? `Web results:\n${webContext}` : "",
      `User: ${message}`,
      "Astra AI:",
    ]
      .filter(Boolean)
      .join("\n\n");

    console.log(`💬 Request started: ${message.slice(0, 80)}`);

    const response = await fetch(OLLAMA_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        prompt,
        stream: false,
        keep_alive: "30m",
        options: OLLAMA_OPTIONS,
      }),
      signal: AbortSignal.timeout(120000),
    });

    if (!response.ok) {
      const errorText = await response.text();

      console.error("Ollama error:", errorText);

      return res.status(502).json({
        error: `Ollama error: ${errorText}`,
      });
    }

    const data = await response.json();
    const reply = (data.response || "").trim();

    console.log(
      `✅ Ollama completed in ${((Date.now() - startedAt) / 1000).toFixed(1)} seconds`
    );

    return res.json({
      reply: reply || "Sorry, I could not generate a response.",
      webSearchUsed: useWebSearch,
    });
  } catch (error) {
    console.error(
      `❌ Astra AI failed after ${((Date.now() - startedAt) / 1000).toFixed(1)} seconds:`,
      error.message
    );

    const status = error.name === "TimeoutError" ? 504 : 500;

    return res.status(status).json({
      error:
        error.name === "TimeoutError"
          ? "Astra AI took too long to respond. Please try again."
          : error.message || "AI response failed",
    });
  }
});

// -----------------------------------------
// START SERVER
// -----------------------------------------

app.listen(PORT, "127.0.0.1", () => {
  console.log(`Astra AI Backend running at http://localhost:${PORT}`);
  console.log(
    tavilyClient
      ? "🔎 Tavily Web Search: Connected"
      : "⚠️ Tavily API key missing; web search is disabled"
  );
});