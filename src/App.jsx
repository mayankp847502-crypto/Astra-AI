import React, { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import "./App.css";

const buildHistory = (msgs) =>
  msgs
    .filter((m) => !m.isError && m.content)
    .map((m) => ({
      role: m.role,
      content: m.content,
    }));

function App() {
  // =========================================
  // CHATS
  // =========================================

  const [chats, setChats] = useState(() => {
    const saved = localStorage.getItem("astra-chats");

    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }

    return [
      {
        id: Date.now(),
        title: "New Chat",
        messages: [],
        pinned: false,
      },
    ];
  });

  const [activeChatId, setActiveChatId] = useState(() => {
    const saved = localStorage.getItem(
      "astra-active-chat"
    );

    return saved ? Number(saved) : null;
  });

  // =========================================
  // SETTINGS
  // =========================================

  const [darkMode, setDarkMode] = useState(() => {
    return (
      localStorage.getItem("astra-theme") ===
      "dark"
    );
  });

  const [enterToSend, setEnterToSend] =
    useState(() => {
      const saved = localStorage.getItem(
        "astra-enter-to-send"
      );

      return saved === null
        ? true
        : saved === "true";
    });

  const [showTimestamps, setShowTimestamps] =
    useState(() => {
      const saved = localStorage.getItem(
        "astra-show-timestamps"
      );

      return saved === null
        ? true
        : saved === "true";
    });

  // =========================================
  // UI STATES
  // =========================================

  const [searchText, setSearchText] = useState("");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [settingsOpen, setSettingsOpen] =
    useState(false);

  const [renamingChatId, setRenamingChatId] =
    useState(null);

  const [renameValue, setRenameValue] =
    useState("");

  const [copiedMessageId, setCopiedMessageId] =
    useState(null);

  const [copiedCodeId, setCopiedCodeId] =
    useState(null);

  const [backendStatus, setBackendStatus] =
    useState("checking");

  // =========================================
  // REFS
  // =========================================

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const abortControllerRef = useRef(null);

  // =========================================
  // ACTIVE CHAT
  // =========================================

  useEffect(() => {
    if (chats.length === 0) {
      const newChatItem = {
        id: Date.now(),
        title: "New Chat",
        messages: [],
        pinned: false,
      };

      setChats([newChatItem]);
      setActiveChatId(newChatItem.id);

      return;
    }

    const exists = chats.some(
      (chat) => chat.id === activeChatId
    );

    if (!exists) {
      setActiveChatId(chats[0].id);
    }
  }, [chats, activeChatId]);

  // =========================================
  // LOCAL STORAGE
  // =========================================

  useEffect(() => {
    localStorage.setItem(
      "astra-chats",
      JSON.stringify(chats)
    );
  }, [chats]);

  useEffect(() => {
    if (activeChatId !== null) {
      localStorage.setItem(
        "astra-active-chat",
        String(activeChatId)
      );
    }
  }, [activeChatId]);

  useEffect(() => {
    localStorage.setItem(
      "astra-theme",
      darkMode ? "dark" : "light"
    );
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem(
      "astra-enter-to-send",
      String(enterToSend)
    );
  }, [enterToSend]);

  useEffect(() => {
    localStorage.setItem(
      "astra-show-timestamps",
      String(showTimestamps)
    );
  }, [showTimestamps]);

  // =========================================
  // AUTO SCROLL
  // =========================================

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [chats, activeChatId, loading]);

  // =========================================
  // BACKEND STATUS
  // =========================================

  useEffect(() => {
    let mounted = true;

    const checkBackend = async () => {
      try {
        const response = await fetch(
          "http://localhost:5000"
        );

        if (mounted && response.ok) {
          setBackendStatus("online");
        } else if (mounted) {
          setBackendStatus("offline");
        }
      } catch {
        if (mounted) {
          setBackendStatus("offline");
        }
      }
    };

    checkBackend();

    const interval = setInterval(
      checkBackend,
      15000
    );

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  // =========================================
  // ACTIVE CHAT DATA
  // =========================================

  const activeChat =
    chats.find(
      (chat) => chat.id === activeChatId
    ) || null;

  const messages = activeChat?.messages || [];

  // =========================================
  // FILTER CHATS
  // =========================================

  const filteredChats = [...chats]
    .filter((chat) => {
      if (!searchText.trim()) {
        return true;
      }

      const search =
        searchText.toLowerCase();

      return (
        chat.title
          ?.toLowerCase()
          .includes(search) ||
        chat.messages?.some((message) =>
          message.content
            ?.toLowerCase()
            .includes(search)
        )
      );
    })
    .sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;

      return b.id - a.id;
    });

  // =========================================
  // NEW CHAT
  // =========================================

  const newChat = () => {
    const chat = {
      id: Date.now(),
      title: "New Chat",
      messages: [],
      pinned: false,
    };

    setChats((prev) => [chat, ...prev]);
    setActiveChatId(chat.id);
    setInput("");
  };

  // =========================================
  // SELECT CHAT
  // =========================================

  const selectChat = (id) => {
    setActiveChatId(id);
    setInput("");
  };

  // =========================================
  // DELETE CHAT
  // =========================================

  const deleteChat = (id) => {
    const remaining = chats.filter(
      (chat) => chat.id !== id
    );

    if (remaining.length === 0) {
      const newChatItem = {
        id: Date.now(),
        title: "New Chat",
        messages: [],
        pinned: false,
      };

      setChats([newChatItem]);
      setActiveChatId(newChatItem.id);

      return;
    }

    setChats(remaining);

    if (id === activeChatId) {
      setActiveChatId(
        remaining[0].id
      );
    }
  };

  // =========================================
  // PIN CHAT
  // =========================================

  const togglePinChat = (id) => {
    setChats((prev) =>
      prev.map((chat) =>
        chat.id === id
          ? {
              ...chat,
              pinned: !chat.pinned,
            }
          : chat
      )
    );
  };

  // =========================================
  // CLEAR ALL
  // =========================================

  const clearAllChats = () => {
    const confirmed = window.confirm(
      "Are you sure you want to delete all chats?"
    );

    if (!confirmed) return;

    const newChatItem = {
      id: Date.now(),
      title: "New Chat",
      messages: [],
      pinned: false,
    };

    setChats([newChatItem]);
    setActiveChatId(newChatItem.id);
    setInput("");
  };

  // =========================================
  // RENAME
  // =========================================

  const startRename = (chat) => {
    setRenamingChatId(chat.id);
    setRenameValue(chat.title);
  };

  const saveRename = (id) => {
    const newTitle =
      renameValue.trim();

    if (!newTitle) {
      setRenamingChatId(null);
      return;
    }

    setChats((prev) =>
      prev.map((chat) =>
        chat.id === id
          ? {
              ...chat,
              title: newTitle,
            }
          : chat
      )
    );

    setRenamingChatId(null);
    setRenameValue("");
  };

  // =========================================
  // SEND MESSAGE
  // =========================================

  const sendMessage = async () => {
    const message = input.trim();

    if (
      !message ||
      loading ||
      !activeChatId
    ) {
      return;
    }

    const userMessage = {
      id: Date.now(),
      role: "user",
      content: message,
      timestamp:
        new Date().toISOString(),
    };

    const historyForBackend =
      buildHistory([
        ...(activeChat?.messages || []),
        userMessage,
      ]);

    setChats((prev) =>
      prev.map((chat) =>
        chat.id === activeChatId
          ? {
              ...chat,

              title:
                chat.messages.length === 0
                  ? message.slice(0, 35)
                  : chat.title,

              messages: [
                ...chat.messages,
                userMessage,
              ],
            }
          : chat
      )
    );

    setInput("");
    setLoading(true);

    const controller =
      new AbortController();

    abortControllerRef.current =
      controller;

    try {
      const response = await fetch(
        "http://localhost:5000/chat",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            message,
            messages:
              historyForBackend,
          }),

          signal:
            controller.signal,
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Something went wrong"
        );
      }

      const aiMessage = {
        id: Date.now() + 1,
        role: "assistant",
        content: data.reply,
        timestamp:
          new Date().toISOString(),
      };

      setChats((prev) =>
        prev.map((chat) =>
          chat.id === activeChatId
            ? {
                ...chat,

                messages: [
                  ...chat.messages,
                  aiMessage,
                ],
              }
            : chat
        )
      );
    } catch (error) {
      if (
        error.name ===
        "AbortError"
      ) {
        return;
      }

      const errorMessage = {
        id: Date.now() + 1,
        role: "assistant",
        isError: true,

        content:
          "Sorry, I could not connect to the AI server. Please make sure the Astra AI backend and Ollama are running.",

        timestamp:
          new Date().toISOString(),
      };

      setChats((prev) =>
        prev.map((chat) =>
          chat.id === activeChatId
            ? {
                ...chat,

                messages: [
                  ...chat.messages,
                  errorMessage,
                ],
              }
            : chat
        )
      );
    } finally {
      setLoading(false);
      abortControllerRef.current =
        null;
    }
  };

  // =========================================
  // ENTER TO SEND
  // =========================================

  const handleInputKeyDown = (
    event
  ) => {
    if (event.key !== "Enter") {
      return;
    }

    if (event.shiftKey) {
      return;
    }

    if (!enterToSend) {
      return;
    }

    event.preventDefault();

    sendMessage();
  };

  // =========================================
  // STOP
  // =========================================

  const stopGenerating = () => {
    if (
      abortControllerRef.current
    ) {
      abortControllerRef.current.abort();
    }

    setLoading(false);
  };

  // =========================================
  // REGENERATE
  // =========================================

  const regenerateResponse = async (
    messageIndex
  ) => {
    if (loading || !activeChat) {
      return;
    }

    const previousUserMessage =
      activeChat.messages[
        messageIndex - 1
      ];

    if (
      !previousUserMessage ||
      previousUserMessage.role !==
        "user"
    ) {
      return;
    }

    const history =
      activeChat.messages.slice(
        0,
        messageIndex
      );

    setChats((prev) =>
      prev.map((chat) =>
        chat.id === activeChatId
          ? {
              ...chat,

              messages:
                chat.messages.slice(
                  0,
                  messageIndex
                ),
            }
          : chat
      )
    );

    setLoading(true);

    const controller =
      new AbortController();

    abortControllerRef.current =
      controller;

    try {
      const response = await fetch(
        "http://localhost:5000/chat",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            message:
              previousUserMessage.content,

            messages:
              buildHistory(history),
          }),

          signal:
            controller.signal,
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Regeneration failed"
        );
      }

      const aiMessage = {
        id: Date.now(),
        role: "assistant",
        content: data.reply,
        timestamp:
          new Date().toISOString(),
      };

      setChats((prev) =>
        prev.map((chat) =>
          chat.id === activeChatId
            ? {
                ...chat,

                messages: [
                  ...chat.messages,
                  aiMessage,
                ],
              }
            : chat
        )
      );
    } catch (error) {
      if (
        error.name ===
        "AbortError"
      ) {
        return;
      }

      const errorMessage = {
        id: Date.now(),
        role: "assistant",
        isError: true,
        content:
          "Regeneration failed.",
        timestamp:
          new Date().toISOString(),
      };

      setChats((prev) =>
        prev.map((chat) =>
          chat.id === activeChatId
            ? {
                ...chat,

                messages: [
                  ...chat.messages,
                  errorMessage,
                ],
              }
            : chat
        )
      );
    } finally {
      setLoading(false);
      abortControllerRef.current =
        null;
    }
  };

  // =========================================
  // COPY MESSAGE
  // =========================================

  const copyMessage = async (
    content,
    id
  ) => {
    try {
      await navigator.clipboard.writeText(
        content
      );

      setCopiedMessageId(id);

      setTimeout(() => {
        setCopiedMessageId(null);
      }, 1500);
    } catch {
      alert("Copy failed");
    }
  };

  // =========================================
  // COPY CODE
  // =========================================

  const copyCode = async (
    code,
    id
  ) => {
    try {
      await navigator.clipboard.writeText(
        code
      );

      setCopiedCodeId(id);

      setTimeout(() => {
        setCopiedCodeId(null);
      }, 1500);
    } catch {
      alert("Code copy failed");
    }
  };

  // =========================================
  // EXPORT CHAT
  // =========================================

  const exportChat = () => {
    if (!activeChat) return;

    let text = "Astra AI Chat\n";

    text += `Title: ${activeChat.title}\n`;

    text +=
      "================================\n\n";

    activeChat.messages.forEach(
      (message) => {
        text += `${
          message.role ===
          "user"
            ? "You"
            : "Astra AI"
        }:\n`;

        text += `${message.content}\n\n`;

        text +=
          "--------------------------------\n\n";
      }
    );

    const blob = new Blob(
      [text],
      {
        type: "text/plain",
      }
    );

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    link.href = url;

    link.download =
      `${
        activeChat.title ||
        "astra-ai-chat"
      }.txt`;

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  // =========================================
  // IMPORT CHAT
  // =========================================

  const importChat = (
    event
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) return;

    const reader =
      new FileReader();

    reader.onload = () => {
      const content = String(
        reader.result || ""
      );

      const importedChat = {
        id: Date.now(),

        title:
          file.name.replace(
            ".txt",
            ""
          ) ||
          "Imported Chat",

        messages: [
          {
            id: Date.now() + 1,
            role: "assistant",
            content,
            timestamp:
              new Date().toISOString(),
          },
        ],

        pinned: false,
      };

      setChats((prev) => [
        importedChat,
        ...prev,
      ]);

      setActiveChatId(
        importedChat.id
      );
    };

    reader.readAsText(file);

    event.target.value = "";
  };

  // =========================================
  // TIME
  // =========================================

  const formatTime = (
    timestamp
  ) => {
    if (!timestamp) return "";

    return new Date(
      timestamp
    ).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // =========================================
  // MARKDOWN CODE
  // =========================================

  const MarkdownCode = ({
    inline,
    children,
  }) => {
    const code = String(
      children
    ).replace(/\n$/, "");

    const codeId =
      `${Date.now()}-${Math.random()}`;

    if (inline) {
      return (
        <code>
          {children}
        </code>
      );
    }

    return (
      <div className="code-block-wrapper">

        <div className="code-block-header">

          <span>
            Code
          </span>

          <button
            type="button"
            className="code-copy-button"
            onClick={() =>
              copyCode(
                code,
                codeId
              )
            }
          >
            {copiedCodeId ===
            codeId
              ? "✓ Copied"
              : "Copy"}
          </button>

        </div>

        <pre>
          <code>
            {code}
          </code>
        </pre>

      </div>
    );
  };

  // =========================================
  // STATISTICS
  // =========================================

  const totalMessages =
    chats.reduce(
      (total, chat) =>
        total +
        (chat.messages
          ?.length || 0),
      0
    );

  const userMessages =
    chats.reduce(
      (total, chat) =>
        total +
        (chat.messages || [])
          .filter(
            (message) =>
              message.role ===
              "user"
          ).length,
      0
    );

  const aiMessages =
    chats.reduce(
      (total, chat) =>
        total +
        (chat.messages || [])
          .filter(
            (message) =>
              message.role ===
                "assistant" &&
              !message.isError
          ).length,
      0
    );

  const useQuickPrompt = (
    prompt
  ) => {
    setInput(prompt);
  };

  // =========================================
  // UI
  // =========================================

  return (
    <div
      className={`app ${
        darkMode
          ? "dark-mode"
          : ""
      }`}
    >

      {/* =====================================
          SIDEBAR
      ====================================== */}

      <aside className="sidebar">

        <div className="sidebar-top">

          <div className="logo-area">

            <div className="logo-icon">
              ✦
            </div>

            <div>
              <h1>
                Astra AI
              </h1>

              <span>
                Personal AI Assistant
              </span>
            </div>

          </div>

          <button
            type="button"
            className="new-chat-button"
            onClick={newChat}
          >
            <span>
              ＋
            </span>

            New Chat
          </button>

          <div className="search-box">

            <span>
              🔍
            </span>

            <input
              type="text"
              placeholder="Search chats..."
              value={
                searchText
              }
              onChange={(
                event
              ) =>
                setSearchText(
                  event.target
                    .value
                )
              }
            />

          </div>

        </div>

        <div className="chat-history">

          {filteredChats.map(
            (chat) => (

              <div
                key={chat.id}
                className={`chat-history-item ${
                  chat.id ===
                  activeChatId
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  selectChat(
                    chat.id
                  )
                }
              >

                <div className="chat-history-main">

                  <span className="chat-icon">
                    {chat.pinned
                      ? "📌"
                      : "💬"}
                  </span>

                  {renamingChatId ===
                  chat.id ? (

                    <input
                      className="rename-input"
                      value={
                        renameValue
                      }
                      autoFocus
                      onChange={(
                        event
                      ) =>
                        setRenameValue(
                          event.target
                            .value
                        )
                      }
                      onKeyDown={(
                        event
                      ) => {

                        if (
                          event.key ===
                          "Enter"
                        ) {
                          saveRename(
                            chat.id
                          );
                        }

                        if (
                          event.key ===
                          "Escape"
                        ) {
                          setRenamingChatId(
                            null
                          );
                        }

                      }}
                      onClick={(
                        event
                      ) =>
                        event.stopPropagation()
                      }
                    />

                  ) : (

                    <span className="chat-title">
                      {
                        chat.title
                      }
                    </span>

                  )}

                </div>

                <div className="chat-actions">

                  <button
                    type="button"
                    title={
                      chat.pinned
                        ? "Unpin Chat"
                        : "Pin Chat"
                    }
                    onClick={(
                      event
                    ) => {

                      event.stopPropagation();

                      togglePinChat(
                        chat.id
                      );

                    }}
                  >
                    {chat.pinned
                      ? "📌"
                      : "☆"}
                  </button>

                  <button
                    type="button"
                    title="Rename Chat"
                    onClick={(
                      event
                    ) => {

                      event.stopPropagation();

                      startRename(
                        chat
                      );

                    }}
                  >
                    ✏️
                  </button>

                  <button
                    type="button"
                    className="delete-chat-button"
                    title="Delete Chat"
                    onClick={(
                      event
                    ) => {

                      event.stopPropagation();

                      deleteChat(
                        chat.id
                      );

                    }}
                  >
                    🗑
                  </button>

                </div>

              </div>

            )
          )}

          {filteredChats.length ===
            0 && (

            <div className="no-chats">
              No chats found
            </div>

          )}

        </div>

        <div className="sidebar-bottom">

          <button
            type="button"
            onClick={() =>
              setSettingsOpen(
                true
              )
            }
          >
            ⚙️ Settings
          </button>

          <button
            type="button"
            onClick={
              clearAllChats
            }
          >
            🗑️ Clear All Chats
          </button>

        </div>

      </aside>

      {/* =====================================
          MAIN CONTENT
      ====================================== */}

      <main className="main-content">

        <header className="top-header">

          <div>
            <h2>
              {activeChat?.title ||
                "Astra AI"}
            </h2>

            <span>
              Your personal AI assistant
            </span>
          </div>

          <div className="header-actions">

            {/* =================================
                UIVERSE THEME SWITCH
            ================================== */}

            <label className="bloom-switch">

              <input
                type="checkbox"
                checked={darkMode}
                onChange={() =>
                  setDarkMode(
                    (prev) =>
                      !prev
                  )
                }
              />

              <span className="bloom-slider">

                <span className="bloom-icon">
                  {darkMode
                    ? "☀"
                    : "☾"}
                </span>

              </span>

            </label>

            <button
              type="button"
              className="export-button"
              onClick={
                exportChat
              }
            >
              📤
            </button>

            <button
              type="button"
              className="import-button"
              onClick={() =>
                fileInputRef.current?.click()
              }
            >
              📥
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept=".txt"
              style={{
                display: "none",
              }}
              onChange={
                importChat
              }
            />

          </div>

        </header>

        {/* =====================================
            MESSAGES
        ====================================== */}

        <div className="messages-container">

          {messages.length ===
          0 ? (

            <div className="welcome-screen">

              <div className="welcome-icon">
                ✦
              </div>

              <h2>
                Welcome to Astra AI
              </h2>

              <p>
                Your personal AI
                assistant powered
                by local AI.
              </p>

              <div className="welcome-suggestions">

                <button
                  type="button"
                  onClick={() =>
                    useQuickPrompt(
                      "Explain artificial intelligence in simple words"
                    )
                  }
                >
                  💡 Explain AI
                </button>

                <button
                  type="button"
                  onClick={() =>
                    useQuickPrompt(
                      "Help me write a JavaScript program"
                    )
                  }
                >
                  💻 Write Code
                </button>

                <button
                  type="button"
                  onClick={() =>
                    useQuickPrompt(
                      "Give me some study tips"
                    )
                  }
                >
                  📚 Study Tips
                </button>

              </div>

            </div>

          ) : (

            messages.map(
              (
                message,
                index
              ) => (

                <div
                  key={message.id}
                  className={`message-row ${
                    message.role
                  }`}
                >

                  <div className="message-avatar">

                    {message.role ===
                    "user"
                      ? "👤"
                      : "✦"}

                  </div>

                  <div className="message-content-wrapper">

                    <div className="message-name">

                      {message.role ===
                      "user"
                        ? "You"
                        : "Astra AI"}

                    </div>

                    <div className="message-bubble">

                      {message.role ===
                      "assistant" ? (

                        <ReactMarkdown
                          components={{
                            code: MarkdownCode,
                          }}
                        >
                          {
                            message.content
                          }
                        </ReactMarkdown>

                      ) : (

                        <div className="user-message-text">
                          {
                            message.content
                          }
                        </div>

                      )}

                    </div>

                    <div className="message-footer">

                      {showTimestamps &&
                        message.timestamp && (

                          <span className="message-time">

                            {formatTime(
                              message.timestamp
                            )}

                          </span>

                        )}

                      {message.role ===
                        "assistant" && (

                        <div className="message-actions">

                          <button
                            type="button"
                            onClick={() =>
                              copyMessage(
                                message.content,
                                message.id
                              )
                            }
                          >
                            {copiedMessageId ===
                            message.id
                              ? "✓ Copied"
                              : "📋 Copy"}
                          </button>

                          {index ===
                            messages.length -
                              1 && (

                            <button
                              type="button"
                              onClick={() =>
                                regenerateResponse(
                                  index
                                )
                              }
                              disabled={
                                loading
                              }
                            >
                              🔄 Regenerate
                            </button>

                          )}

                        </div>

                      )}

                    </div>

                  </div>

                </div>

              )
            )

          )}

          {/* =================================
              ASTRA AI LOADING
          ================================== */}

          {loading && (

            <div className="message-row assistant">

              <div className="message-avatar">
                ✦
              </div>

              <div className="message-content-wrapper">

                <div className="message-name">
                  Astra AI
                </div>

                <div className="message-bubble astra-loader-bubble">

                  <div className="astra-loader">

                    <span>
                      loading
                    </span>

                    {" "}

                    <span className="loader-highlight">
                      Astra AI
                    </span>

                  </div>

                </div>

              </div>

            </div>

          )}

          <div
            ref={
              messagesEndRef
            }
          />

        </div>

        {/* =====================================
            INPUT
        ====================================== */}

        <div className="input-area">

          <div className="input-wrapper">

            <textarea
              value={input}
              onChange={(
                event
              ) =>
                setInput(
                  event.target
                    .value
                )
              }
              onKeyDown={
                handleInputKeyDown
              }
              placeholder={
                enterToSend
                  ? "Message Astra AI... (Enter to send)"
                  : "Message Astra AI... (Enter for new line)"
              }
              rows={1}
            />

            {loading ? (

              <button
                type="button"
                className="stop-button"
                onClick={
                  stopGenerating
                }
              >
                ⏹ Stop
              </button>

            ) : (

              <button
                type="button"
                className="send-button"
                onClick={
                  sendMessage
                }
                disabled={
                  !input.trim()
                }
              >
                <span>
                  Send
                </span>
              </button>

            )}

          </div>

          <div className="input-hint">

            {enterToSend
              ? "Press Enter to send • Shift + Enter for new line"
              : "Enter creates a new line • Click send to send"}

          </div>

        </div>

      </main>

      {/* =====================================
          RIGHT DASHBOARD
      ====================================== */}

      <aside className="dashboard-panel">

        {/* STATUS */}

        <div className="dashboard-card status-card">

          <div className="dashboard-card-header">

            <div>

              <span className="dashboard-label">
                SYSTEM STATUS
              </span>

              <h3>
                Astra AI System
              </h3>

            </div>

            <div
              className={`status-dot ${
                backendStatus
              }`}
            />

          </div>

          <div className="status-row">

            <span>
              Backend
            </span>

            <strong
              className={
                backendStatus ===
                "online"
                  ? "status-online"
                  : backendStatus ===
                    "checking"
                  ? "status-checking"
                  : "status-offline"
              }
            >
              {backendStatus ===
              "online"
                ? "Online"
                : backendStatus ===
                  "checking"
                ? "Checking..."
                : "Offline"}
            </strong>

          </div>

          <div className="status-row">

            <span>
              AI Model
            </span>

            <strong>
              Llama 3.2
            </strong>

          </div>

          <div className="status-row">

            <span>
              Mode
            </span>

            <strong>
              Local AI
            </strong>

          </div>

        </div>

        {/* QUICK ACTIONS */}

        <div className="dashboard-card">

          <div className="dashboard-card-header">

            <div>

              <span className="dashboard-label">
                QUICK ACTIONS
              </span>

              <h3>
                What can I do?
              </h3>

            </div>

            <span className="dashboard-card-icon">
              ⚡
            </span>

          </div>

          <div className="quick-actions-grid">

            <button
              type="button"
              onClick={() =>
                useQuickPrompt(
                  "Explain artificial intelligence in simple words"
                )
              }
            >
              <span>
                🧠
              </span>

              <strong>
                Explain AI
              </strong>

              <small>
                Learn something
              </small>

            </button>

            <button
              type="button"
              onClick={() =>
                useQuickPrompt(
                  "Help me write clean JavaScript code"
                )
              }
            >
              <span>
                💻
              </span>

              <strong>
                Write Code
              </strong>

              <small>
                Coding assistant
              </small>

            </button>

            <button
              type="button"
              onClick={() =>
                useQuickPrompt(
                  "Give me useful study tips for students"
                )
              }
            >
              <span>
                📚
              </span>

              <strong>
                Study
              </strong>

              <small>
                Study smarter
              </small>

            </button>

            <button
              type="button"
              onClick={() =>
                useQuickPrompt(
                  "Give me 5 creative ideas for a project"
                )
              }
            >
              <span>
                💡
              </span>

              <strong>
                Ideas
              </strong>

              <small>
                Get inspiration
              </small>

            </button>

          </div>

        </div>

        {/* STATISTICS */}

        <div className="dashboard-card">

          <div className="dashboard-card-header">

            <div>

              <span className="dashboard-label">
                YOUR ACTIVITY
              </span>

              <h3>
                Chat Statistics
              </h3>

            </div>

            <span className="dashboard-card-icon">
              📊
            </span>

          </div>

          <div className="stats-grid">

            <div className="stat-box">

              <span>
                💬
              </span>

              <strong>
                {chats.length}
              </strong>

              <small>
                Chats
              </small>

            </div>

            <div className="stat-box">

              <span>
                📨
              </span>

              <strong>
                {totalMessages}
              </strong>

              <small>
                Messages
              </small>

            </div>

            <div className="stat-box">

              <span>
                👤
              </span>

              <strong>
                {userMessages}
              </strong>

              <small>
                You
              </small>

            </div>

            <div className="stat-box">

              <span>
                ✦
              </span>

              <strong>
                {aiMessages}
              </strong>

              <small>
                Astra AI
              </small>

            </div>

          </div>

        </div>

        {/* RECENT CHATS */}

        <div className="dashboard-card recent-card">

          <div className="dashboard-card-header">

            <div>

              <span className="dashboard-label">
                RECENT
              </span>

              <h3>
                Recent Chats
              </h3>

            </div>

            <span className="dashboard-card-icon">
              🕘
            </span>

          </div>

          <div className="recent-chats">

            {chats
              .slice(0, 5)
              .map(
                (chat) => (

                  <button
                    type="button"
                    key={chat.id}
                    className={`recent-chat ${
                      chat.id ===
                      activeChatId
                        ? "selected"
                        : ""
                    }`}
                    onClick={() =>
                      selectChat(
                        chat.id
                      )
                    }
                  >

                    <span className="recent-chat-icon">
                      {chat.pinned
                        ? "📌"
                        : "💬"}
                    </span>

                    <span className="recent-chat-info">

                      <strong>
                        {
                          chat.title
                        }
                      </strong>

                      <small>
                        {
                          chat.messages
                            ?.length
                        }{" "}
                        messages
                      </small>

                    </span>

                  </button>

                )
              )}

          </div>

        </div>

        {/* FOOTER */}

        <div className="dashboard-footer">

          <div className="footer-ai-icon">
            ✦
          </div>

          <div>

            <strong>
              Astra AI
            </strong>

            <span>
              Powered by local Llama 3.2
            </span>

          </div>

        </div>

      </aside>

      {/* =====================================
          SETTINGS MODAL
      ====================================== */}

      {settingsOpen && (

        <div
          className="settings-overlay"
          onClick={() =>
            setSettingsOpen(
              false
            )
          }
        >

          <div
            className="settings-panel"
            onClick={(
              event
            ) =>
              event.stopPropagation()
            }
          >

            <div className="settings-header">

              <div>

                <h2>
                  Settings
                </h2>

                <p>
                  Customize your Astra AI experience
                </p>

              </div>

              <button
                type="button"
                className="settings-close"
                onClick={() =>
                  setSettingsOpen(
                    false
                  )
                }
              >
                ✕
              </button>

            </div>

            {/* APPEARANCE */}

            <div className="settings-section">

              <h3>
                Appearance
              </h3>

              <div className="settings-item">

                <div>

                  <strong>
                    Theme
                  </strong>

                  <span>
                    {darkMode
                      ? "Dark Mode"
                      : "Light Mode"}
                  </span>

                </div>

                {/* SAME UIVERSE SWITCH */}

                <label className="bloom-switch">

                  <input
                    type="checkbox"
                    checked={
                      darkMode
                    }
                    onChange={() =>
                      setDarkMode(
                        (prev) =>
                          !prev
                      )
                    }
                  />

                  <span className="bloom-slider">

                    <span className="bloom-icon">
                      {darkMode
                        ? "☀"
                        : "☾"}
                    </span>

                  </span>

                </label>

              </div>

            </div>

            {/* CHAT SETTINGS */}

            <div className="settings-section">

              <h3>
                Chat
              </h3>

              <div className="settings-item">

                <div>

                  <strong>
                    Enter to Send
                  </strong>

                  <span>
                    Press Enter to send your message
                  </span>

                </div>

                <button
                  type="button"
                  className="settings-action"
                  onClick={() =>
                    setEnterToSend(
                      (prev) =>
                        !prev
                    )
                  }
                >
                  {enterToSend
                    ? "ON"
                    : "OFF"}
                </button>

              </div>

              <div className="settings-item">

                <div>

                  <strong>
                    Show Timestamps
                  </strong>

                  <span>
                    Show message time
                  </span>

                </div>

                <button
                  type="button"
                  className="settings-action"
                  onClick={() =>
                    setShowTimestamps(
                      (prev) =>
                        !prev
                    )
                  }
                >
                  {showTimestamps
                    ? "ON"
                    : "OFF"}
                </button>

              </div>

              <div className="settings-item">

                <div>

                  <strong>
                    Clear All Chats
                  </strong>

                  <span>
                    Delete all saved conversations
                  </span>

                </div>

                <button
                  type="button"
                  className="settings-action settings-danger"
                  onClick={
                    clearAllChats
                  }
                >
                  🗑️ Clear
                </button>

              </div>

            </div>

            {/* ABOUT */}

            <div className="settings-section">

              <h3>
                About
              </h3>

              <div className="about-myai">

                <div className="about-icon">
                  ✦
                </div>

                <div>

                  <strong>
                    Astra AI
                  </strong>

                  <span>
                    Personal AI Assistant
                  </span>

                  <small>
                    Powered by local Llama 3.2
                  </small>

                </div>

              </div>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}

export default App;