# ✨ Astra AI — Personal AI Assistant

Astra AI is a personal AI chatbot built with React, Vite, Node.js, Express.js, and Ollama. It provides AI-powered conversations through a modern chat interface and supports multilingual interaction, voice features, and web search integration.

## 🚀 Features

* 🤖 **AI Chat:** Ask questions and receive AI-generated responses using a locally running Ollama model.
* 🌐 **Multilingual Support:** Work with multiple languages, including English, Hindi, Bengali, Punjabi, Tamil, Telugu, and more.
* 🔎 **Web Search:** Search for recent information using Tavily integration when configured.
* 🎙️ **Voice Input:** Send messages using browser speech recognition where supported.
* 🔊 **AI Voice Output:** Listen to responses using browser text-to-speech.
* 🌍 **Translation:** Translate text into supported languages.
* 💬 **Chat History:** Create and manage conversations, search chats, and revisit previous messages.
* 🎨 **Modern Interface:** Responsive chat layout, dark/light themes, settings, and dashboard.
* 📋 **Chat Utilities:** Copy responses, regenerate answers, and manage conversations.

## 🛠️ Tech Stack

**Frontend**

* React
* Vite
* JavaScript
* CSS
* React Markdown

**Backend**

* Node.js
* Express.js
* CORS
* dotenv

**AI and Search**

* Ollama
* Llama 3.2 (or another configured local model)
* Tavily API (optional, for web search)

## 📁 Project Structure

```text
myai-chatbot/
├── public/
├── server/
│   ├── server.js
│   ├── package.json
│   └── .env             # Local secrets; not committed
├── src/
│   ├── App.jsx
│   ├── App.css
│   ├── index.css
│   └── main.jsx
├── .gitignore
├── index.html
├── package.json
└── README.md
```

## ⚙️ Prerequisites

Install the following before running Astra AI:

* Node.js and npm
* Ollama
* A local Ollama model, such as `llama3.2`
* Tavily API key only if you want to enable web search

## ▶️ Run Locally

### 1. Clone the repository

```bash
git clone https://github.com/mayankp847502-crypto/Astra-AI.git
cd Astra-AI
```

### 2. Install frontend dependencies

```bash
npm install
```

### 3. Install backend dependencies

```bash
cd server
npm install
```

### 4. Configure environment variables

Create a `.env` file inside the `server` folder. Add your Tavily API key if you want web search:

```env
TAVILY_API_KEY=your_tavily_api_key
```

Never upload real API keys, passwords, or other secrets to GitHub.

### 5. Start Ollama

Make sure Ollama is installed and running. Download a model if needed:

```bash
ollama pull llama3.2
```

### 6. Start the backend

From the `server` directory, run:

```bash
node server.js
```

The backend is configured to run at `http://localhost:5000`.

### 7. Start the frontend

Open a **second terminal** in the project root and run:

```bash
npm run dev
```

Open the local URL shown by Vite, usually `http://localhost:5173`.

## 🔐 Security Notes

* Keep `.env` files and API keys private.
* Do not commit real credentials to GitHub.
* Browser voice features depend on browser support and permissions.
* Web search requires valid Tavily configuration.

## 🎯 Project Goal

Astra AI is a personal project created to explore AI integration, frontend development, backend APIs, local language models, and interactive chatbot design.

## 👨‍💻 Author

**Mayank Pandey**

GitHub: [@mayankp847502-crypto](https://github.com/mayankp847502-crypto)

---

⭐ If you find this project interesting, feel free to explore the repository and share feedback.
