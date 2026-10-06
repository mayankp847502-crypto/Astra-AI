const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { tavily } = require("@tavily/core");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const PORT = 5000;
const OLLAMA_URL = "http://localhost:11434/api/generate";
const MODEL = "llama3.2";

// -----------------------------------------
// TAVILY
// -----------------------------------------

const tavilyClient = tavily({
  apiKey: process.env.TAVILY_API_KEY,
});

// -----------------------------------------
// HOME / SERVER TEST
// -----------------------------------------

app.get("/", (req, res) => {
  res.json({
    message: "Astra AI Backend is running successfully! 🚀",
  });
});

// -----------------------------------------
// CHECK IF USER WANTS WEB SEARCH
// -----------------------------------------

function needsWebSearch(message) {
  const text = message.toLowerCase();

  const searchWords = [
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
    "result",
    "2026",
    "2025",
    "who is",
    "what happened",
    "happening",
  ];

  return searchWords.some((word) =>
    text.includes(word)
  );
}

// -----------------------------------------
// WEB SEARCH
// -----------------------------------------

async function performWebSearch(query) {
  try {
    console.log("🔎 Web search:", query);

    const result = await tavilyClient.search(query, {
      searchDepth: "basic",
      maxResults: 5,
      includeAnswer: true,
    });

    return result;
  } catch (error) {
    console.error("Tavily Search Error:", error);
    return null;
  }
}

// -----------------------------------------
// CHAT
// -----------------------------------------

app.post("/chat", async (req, res) => {
  try {
    const {
      message,
      messages = [],
    } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        error: "Message is required",
      });
    }

    // -----------------------------------------
    // KEEP ONLY RECENT HISTORY
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
          return `${
            item.role === "user"
              ? "User"
              : "Astra AI"
          }: ${item.content}`;
        })
        .join("\n");

    // -----------------------------------------
    // CHECK WEB SEARCH
    // -----------------------------------------

    const useWebSearch =
      needsWebSearch(message);

    let webContext = "";

    if (useWebSearch) {
      const searchResult =
        await performWebSearch(message);

      if (searchResult) {
        const answer =
          searchResult.answer || "";

        const results =
          searchResult.results || [];

        webContext = `
LIVE WEB SEARCH RESULTS:

${answer}

${results
  .map(
    (item, index) =>
      `[${index + 1}] ${item.title}
URL: ${item.url}
Content: ${item.content}`
  )
  .join("\n\n")}
`;
      }
    }

    // -----------------------------------------
    // ASTRA AI PROMPT
    // -----------------------------------------

    const prompt = `You are Astra AI, a helpful personal AI assistant.

Answer the user's question clearly and naturally.

IMPORTANT RULES:

1. Give direct and useful answers.
2. Keep simple questions concise.
3. If programming code is needed, ALWAYS use Markdown code blocks.
4. Never put programming code as plain text.
5. If LIVE WEB SEARCH RESULTS are provided, use them to answer current/latest questions.
6. Do not invent information that is not supported by the search results.
7. If web search results are unavailable, honestly say that live information could not be retrieved.
8. Use conversation history only when it helps answer the current question.
9. When using web search information, mention useful sources naturally when appropriate.

Recent conversation:
${conversationHistory || "No previous conversation."}

${webContext}

Current user message:
${message}

Astra AI answer:`;

    // -----------------------------------------
    // OLLAMA
    // -----------------------------------------

    const response = await fetch(
      OLLAMA_URL,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify({
          model: MODEL,
          prompt: prompt,
          stream: false,

          options: {
            temperature: 0.5,
            num_predict: 512,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText =
        await response.text();

      return res.status(500).json({
        error: `Ollama error: ${errorText}`,
      });
    }

    const data =
      await response.json();

    res.json({
      reply:
        data.response ||
        "Sorry, I could not generate a response.",

      webSearchUsed: useWebSearch,
    });
  } catch (error) {
    console.error(
      "Astra AI Error:",
      error
    );

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

app.listen(
  PORT,
  "127.0.0.1",
  () => {
    console.log(
      `Astra AI Backend running at http://localhost:${PORT}`
    );

    console.log(
      process.env.TAVILY_API_KEY
        ? "🔎 Tavily Web Search: Connected"
        : "⚠️ Tavily Web Search: API key missing"
    );
  }
);