const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "MyAI Backend is running successfully! 🚀",
  });
});

app.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        error: "Message is required",
      });
    }

    // MyAI instructions
    const prompt = `You are MyAI, a helpful personal AI assistant.

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

For normal explanations, use normal Markdown formatting.

User message:
${message}`;

    const response = await fetch(
      "http://localhost:11434/api/generate",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama3.2",
          prompt: prompt,
          stream: false,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();

      return res.status(500).json({
        error: `Ollama error: ${errorText}`,
      });
    }

    const data = await response.json();

    res.json({
      reply: data.response,
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
  console.log(
    `MyAI Backend running at http://localhost:${PORT}`
  );
});