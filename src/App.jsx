import React, { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import "./App.css";

function formatTime(timestamp) {
  if (!timestamp) return "";

  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function App() {
  const [chats, setChats] = useState(() => {
    try {
      const savedChats = localStorage.getItem("myai-chats");

      if (savedChats) {
        const parsedChats = JSON.parse(savedChats);

        if (
          Array.isArray(parsedChats) &&
          parsedChats.length > 0
        ) {
          return parsedChats;
        }
      }
    } catch (error) {
      console.error("Chat loading error:", error);
    }

    return [
      {
        id: Date.now(),
        title: "New Chat",
        messages: [],
      },
    ];
  });

  const [activeChatId, setActiveChatId] = useState(() => {
    const savedActiveChat =
      localStorage.getItem("myai-active-chat");

    return savedActiveChat
      ? Number(savedActiveChat)
      : null;
  });

  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("myai-theme") === "dark";
  });

  const [copiedId, setCopiedId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [renamingChatId, setRenamingChatId] = useState(null);
  const [renameText, setRenameText] = useState("");

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef(null);
  const abortControllerRef = useRef(null);
  const renameInputRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    localStorage.setItem(
      "myai-chats",
      JSON.stringify(chats)
    );
  }, [chats]);

  useEffect(() => {
    if (activeChatId) {
      localStorage.setItem(
        "myai-active-chat",
        String(activeChatId)
      );
    }
  }, [activeChatId]);

  useEffect(() => {
    localStorage.setItem(
      "myai-theme",
      darkMode ? "dark" : "light"
    );
  }, [darkMode]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [chats, activeChatId, loading]);

  useEffect(() => {
    if (renamingChatId && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [renamingChatId]);

  const activeChat =
    chats.find(
      (chat) => chat.id === activeChatId
    ) || chats[0];

  useEffect(() => {
    if (!activeChatId && chats.length > 0) {
      setActiveChatId(chats[0].id);
    }
  }, [activeChatId, chats]);

  // =========================
  // SEARCH
  // =========================

  const filteredChats = chats
    .filter((chat) => {
      const query = String(searchQuery || "")
        .toLowerCase()
        .trim();

      if (!query) {
        return true;
      }

      const title = String(chat?.title || "");

      const titleMatch = title
        .toLowerCase()
        .includes(query);

      const messages = Array.isArray(chat?.messages)
        ? chat.messages
        : [];

      const messageMatch = messages.some((message) => {
        const messageText = String(
          message?.text || ""
        );

        return messageText
          .toLowerCase()
          .includes(query);
      });

      return titleMatch || messageMatch;
    })
    .sort((a, b) => {
      if (Boolean(a.pinned) !== Boolean(b.pinned)) {
        return a.pinned ? -1 : 1;
      }

      return Number(b.id) - Number(a.id);
    });

  // =========================
  // UPDATE MESSAGES
  // =========================

  const updateChatMessages = (
    chatId,
    messages
  ) => {
    setChats((prevChats) =>
      prevChats.map((chat) =>
        chat.id === chatId
          ? {
              ...chat,
              messages,
            }
          : chat
      )
    );
  };

  // =========================
  // EXPORT CHAT
  // =========================

  const exportChat = () => {
    if (!activeChat) {
      return;
    }

    const messages = Array.isArray(
      activeChat.messages
    )
      ? activeChat.messages
      : [];

    if (messages.length === 0) {
      alert(
        "There is no conversation to export."
      );
      return;
    }

    let content = "";

    content += "====================================\n";
    content += "              MyAI CHAT\n";
    content += "====================================\n\n";

    content += `Chat Title: ${
      activeChat.title || "Untitled Chat"
    }\n`;

    content += `Exported: ${new Date().toLocaleString()}\n\n`;

    content += "====================================\n\n";

    messages.forEach((message) => {
      const sender =
        message.role === "user"
          ? "You"
          : "MyAI";

      const time = formatTime(
        message.timestamp
      );

      content += `${sender}`;

      if (time) {
        content += ` (${time})`;
      }

      content += ":\n";

      content += `${message.text || ""}\n\n`;

      content +=
        "------------------------------------\n\n";
    });

    content += "====================================\n";
    content += "          Generated by MyAI\n";
    content += "====================================\n";

    const blob = new Blob([content], {
      type: "text/plain;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;

    const safeTitle = String(
      activeChat.title || "myai-chat"
    )
      .replace(/[<>:"/\\|?*]/g, "")
      .trim();

    link.download = `${
      safeTitle || "myai-chat"
    }.txt`;

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  // =========================
  // IMPORT CHAT
  // =========================

  const importChat = () => {
    fileInputRef.current?.click();
  };

  const handleImportChat = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (
      !file.name
        .toLowerCase()
        .endsWith(".txt")
    ) {
      alert(
        "Please select a MyAI .txt chat file."
      );

      event.target.value = "";

      return;
    }

    const reader = new FileReader();

    reader.onload = (loadEvent) => {
      try {
        const content = String(
          loadEvent.target?.result || ""
        );

        if (!content.trim()) {
          alert(
            "The selected file is empty."
          );

          return;
        }

        const titleMatch = content.match(
          /Chat Title:\s*(.+)/
        );

        const importedTitle =
          titleMatch?.[1]?.trim() ||
          file.name.replace(
            /\.txt$/i,
            ""
          ) ||
          "Imported Chat";

        const blocks = content.split(
          "------------------------------------"
        );

        const importedMessages = [];

        blocks.forEach((block) => {
          const cleanedBlock =
            block.trim();

          if (!cleanedBlock) {
            return;
          }

          const messageMatch =
            cleanedBlock.match(
              /^(You|MyAI)(?:\s*\(([^)]+)\))?:\s*\n([\s\S]*)$/i
            );

          if (!messageMatch) {
            return;
          }

          const sender =
            messageMatch[1];

          const time =
            messageMatch[2];

          const text =
            messageMatch[3].trim();

          if (!text) {
            return;
          }

          const role =
            sender.toLowerCase() === "you"
              ? "user"
              : "assistant";

          let timestamp =
            new Date().toISOString();

          if (time) {
            const now = new Date();

            const parsedTime =
              new Date(
                `${now.toDateString()} ${time}`
              );

            if (
              !Number.isNaN(
                parsedTime.getTime()
              )
            ) {
              timestamp =
                parsedTime.toISOString();
            }
          }

          importedMessages.push({
            id:
              Date.now() +
              Math.random(),

            role,

            text,

            timestamp,
          });
        });

        if (
          importedMessages.length === 0
        ) {
          alert(
            "No valid MyAI messages were found in this file."
          );

          return;
        }

        const importedChat = {
          id: Date.now(),

          title: importedTitle,

          messages: importedMessages,
        };

        setChats((prevChats) => [
          ...prevChats,
          importedChat,
        ]);

        setActiveChatId(
          importedChat.id
        );

        setSearchQuery("");

        alert(
          "Chat imported successfully! ✅"
        );
      } catch (error) {
        console.error(
          "Import error:",
          error
        );

        alert(
          "Unable to import this chat file."
        );
      } finally {
        event.target.value = "";
      }
    };

    reader.onerror = () => {
      alert(
        "Could not read the selected file."
      );

      event.target.value = "";
    };

    reader.readAsText(file);
  };

  // =========================
  // SEND MESSAGE
  // =========================

  const sendMessage = async () => {
    const messageText = input.trim();

    if (!messageText || loading) {
      return;
    }

    let chatId = activeChatId;

    if (!chatId) {
      const newChat = {
        id: Date.now(),
        title: "New Chat",
        messages: [],
      };

      setChats((prevChats) => [
        ...prevChats,
        newChat,
      ]);

      chatId = newChat.id;

      setActiveChatId(chatId);
    }

    const userMessage = {
      id: Date.now(),
      role: "user",
      text: messageText,
      timestamp: new Date().toISOString(),
    };

    const currentChat =
      chats.find(
        (chat) => chat.id === chatId
      ) || activeChat;

    const currentMessages =
      currentChat?.messages || [];

    const updatedMessages = [
      ...currentMessages,
      userMessage,
    ];

    updateChatMessages(
      chatId,
      updatedMessages
    );

    setInput("");
    setLoading(true);

    if (
      currentMessages.length === 0 ||
      currentChat?.title === "New Chat"
    ) {
      setChats((prevChats) =>
        prevChats.map((chat) =>
          chat.id === chatId
            ? {
                ...chat,
                title:
                  messageText.length > 30
                    ? `${messageText.slice(
                        0,
                        30
                      )}...`
                    : messageText,
              }
            : chat
        )
      );
    }

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
            message: messageText,
          }),

          signal: controller.signal,
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "AI response failed"
        );
      }

      const assistantMessage = {
        id: Date.now() + 1,

        role: "assistant",

        text:
          data.reply ||
          "Sorry, I could not generate a response.",

        timestamp:
          new Date().toISOString(),
      };

      updateChatMessages(chatId, [
        ...updatedMessages,
        assistantMessage,
      ]);
    } catch (error) {
      if (
        error.name ===
        "AbortError"
      ) {
        return;
      }

      console.error(
        "Chat error:",
        error
      );

      const errorMessage = {
        id: Date.now() + 2,

        role: "assistant",

        text:
          "Sorry, something went wrong while connecting to MyAI.",

        timestamp:
          new Date().toISOString(),
      };

      updateChatMessages(chatId, [
        ...updatedMessages,
        errorMessage,
      ]);
    } finally {
      setLoading(false);

      abortControllerRef.current =
        null;
    }
  };

  // =========================
  // STOP GENERATING
  // =========================

  const stopGenerating = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();

      abortControllerRef.current =
        null;
    }

    setLoading(false);
  };

  // =========================
  // REGENERATE
  // =========================

  const regenerateResponse =
    async () => {
      if (!activeChat || loading) {
        return;
      }

      const messages =
        activeChat.messages || [];

      if (messages.length === 0) {
        return;
      }

      const lastUserMessage =
        [...messages]
          .reverse()
          .find(
            (message) =>
              message.role === "user"
          );

      if (!lastUserMessage) {
        return;
      }

      const lastAssistantIndex =
        [...messages]
          .map(
            (
              message,
              index
            ) => ({
              message,
              index,
            })
          )
          .reverse()
          .find(
            ({ message }) =>
              message.role ===
              "assistant"
          )?.index;

      let messagesWithoutLastAssistant =
        messages;

      if (
        lastAssistantIndex !==
          undefined &&
        lastAssistantIndex >
          messages.findIndex(
            (message) =>
              message.id ===
              lastUserMessage.id
          )
      ) {
        messagesWithoutLastAssistant =
          messages.filter(
            (_, index) =>
              index !==
              lastAssistantIndex
          );
      }

      updateChatMessages(
        activeChat.id,
        messagesWithoutLastAssistant
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
                lastUserMessage.text,
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
              "AI response failed"
          );
        }

        const assistantMessage = {
          id: Date.now(),

          role: "assistant",

          text:
            data.reply ||
            "Sorry, I could not generate a response.",

          timestamp:
            new Date().toISOString(),
        };

        updateChatMessages(
          activeChat.id,
          [
            ...messagesWithoutLastAssistant,
            assistantMessage,
          ]
        );
      } catch (error) {
        if (
          error.name ===
          "AbortError"
        ) {
          return;
        }

        console.error(
          "Regenerate error:",
          error
        );
      } finally {
        setLoading(false);

        abortControllerRef.current =
          null;
      }
    };

  // =========================
  // NEW CHAT
  // =========================

  const newChat = () => {
    stopGenerating();

    const chat = {
      id: Date.now(),

      title: "New Chat",

      messages: [],
    };

    setChats((prevChats) => [
      ...prevChats,
      chat,
    ]);

    setActiveChatId(chat.id);

    setSearchQuery("");
  };

  // =========================
  // SELECT CHAT
  // =========================

  const selectChat = (chatId) => {
    stopGenerating();

    setActiveChatId(chatId);
  };

  // =========================
  // DELETE CHAT
  // =========================

  const deleteChat = (chatId) => {
    stopGenerating();

    const remainingChats =
      chats.filter(
        (chat) =>
          chat.id !== chatId
      );

    if (
      remainingChats.length === 0
    ) {
      const freshChat = {
        id: Date.now(),

        title: "New Chat",

        messages: [],
      };

      setChats([freshChat]);

      setActiveChatId(
        freshChat.id
      );

      return;
    }

    setChats(remainingChats);

    if (
      activeChatId === chatId
    ) {
      setActiveChatId(
        remainingChats[0].id
      );
    }
  };

  // =========================
  // PIN / UNPIN CHAT
  // =========================

  const togglePin = (chatId, event) => {
    event.stopPropagation();

    setChats((prevChats) =>
      prevChats.map((chat) =>
        chat.id === chatId
          ? {
              ...chat,
              pinned: !chat.pinned,
            }
          : chat
      )
    );
  };

  // =========================
  // CLEAR ALL CHATS
  // =========================

  const clearAllChats = () => {
    stopGenerating();

    const confirmed = window.confirm(
      "Are you sure you want to delete all chats? This action cannot be undone."
    );

    if (!confirmed) {
      return;
    }

    const freshChat = {
      id: Date.now(),
      title: "New Chat",
      messages: [],
      pinned: false,
    };

    setChats([freshChat]);
    setActiveChatId(freshChat.id);
    setSearchQuery("");
    setRenamingChatId(null);
    setRenameText("");
  };

  // =========================
  // RENAME CHAT
  // =========================

  const startRename = (
    chat,
    event
  ) => {
    event.stopPropagation();

    setRenamingChatId(chat.id);

    setRenameText(
      String(chat.title || "")
    );
  };

  const saveRename = () => {
    const newTitle =
      renameText.trim();

    if (!renamingChatId) {
      return;
    }

    if (!newTitle) {
      cancelRename();

      return;
    }

    setChats((prevChats) =>
      prevChats.map((chat) =>
        chat.id === renamingChatId
          ? {
              ...chat,
              title: newTitle,
            }
          : chat
      )
    );

    setRenamingChatId(null);

    setRenameText("");
  };

  const cancelRename = () => {
    setRenamingChatId(null);

    setRenameText("");
  };

  const handleRenameKeyDown = (
    event
  ) => {
    if (event.key === "Enter") {
      event.preventDefault();

      saveRename();
    }

    if (event.key === "Escape") {
      event.preventDefault();

      cancelRename();
    }
  };

  // =========================
  // COPY MESSAGE
  // =========================

  const copyMessage = async (
    text,
    id
  ) => {
    try {
      await navigator.clipboard.writeText(
        text
      );

      setCopiedId(id);

      setTimeout(() => {
        setCopiedId(null);
      }, 1500);
    } catch (error) {
      console.error(
        "Copy failed:",
        error
      );
    }
  };

  // =========================
  // COPY CODE
  // =========================

  const copyCode = async (
    code,
    id
  ) => {
    try {
      await navigator.clipboard.writeText(
        code
      );

      setCopiedId(
        `code-${id}`
      );

      setTimeout(() => {
        setCopiedId(null);
      }, 1500);
    } catch (error) {
      console.error(
        "Code copy failed:",
        error
      );
    }
  };

  // =========================
  // THEME
  // =========================

  const toggleTheme = () => {
    setDarkMode(
      (prev) => !prev
    );
  };

  // =========================
  // INPUT
  // =========================

  const handleInputKeyDown = (
    event
  ) => {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();

      sendMessage();
    }
  };

  return (
    <div
      className={`app ${
        darkMode
          ? "dark-mode"
          : ""
      }`}
    >
      {/* =========================
          SIDEBAR
      ========================= */}

      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo">
            🤖
          </div>

          <div>
            <h2>MyAI</h2>

            <span>
              Personal AI
            </span>
          </div>
        </div>

        <button
          className="new-chat-button"
          onClick={newChat}
        >
          ＋ New Chat
        </button>

        <div className="chat-search">
          <input
            type="text"
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(event) =>
              setSearchQuery(
                event.target.value
              )
            }
          />

          {searchQuery && (
            <button
              className="clear-search"
              onClick={() =>
                setSearchQuery("")
              }
              type="button"
            >
              ✕
            </button>
          )}
        </div>

        <div className="recent-title">
          Recent Chats
        </div>

        <div className="chat-list">
          {filteredChats.length ===
          0 ? (
            <div className="no-search-results">
              No chats found
            </div>
          ) : (
            filteredChats.map(
              (chat) => (
                <div
                  key={chat.id}
                  className={`chat-item ${
                    activeChatId ===
                    chat.id
                      ? "active"
                      : ""
                  }`}
                  onClick={() =>
                    selectChat(
                      chat.id
                    )
                  }
                >
                  {renamingChatId ===
                  chat.id ? (
                    <div className="rename-container">
                      <input
                        ref={
                          renameInputRef
                        }
                        className="rename-input"
                        type="text"
                        value={
                          renameText
                        }
                        onChange={(
                          event
                        ) =>
                          setRenameText(
                            event
                              .target
                              .value
                          )
                        }
                        onKeyDown={
                          handleRenameKeyDown
                        }
                        onClick={(
                          event
                        ) =>
                          event.stopPropagation()
                        }
                      />

                      <button
                        type="button"
                        className="rename-save"
                        onClick={(
                          event
                        ) => {
                          event.stopPropagation();

                          saveRename();
                        }}
                        title="Save"
                      >
                        ✓
                      </button>

                      <button
                        type="button"
                        className="rename-cancel"
                        onClick={(
                          event
                        ) => {
                          event.stopPropagation();

                          cancelRename();
                        }}
                        title="Cancel"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="chat-title">
                        {chat.pinned ? "📌" : "💬"}{" "}
                        {String(
                          chat.title ||
                            "Untitled Chat"
                        )}
                      </span>

                      <button
                        type="button"
                        className="pin-chat"
                        onClick={(event) =>
                          togglePin(chat.id, event)
                        }
                        title={
                          chat.pinned
                            ? "Unpin chat"
                            : "Pin chat"
                        }
                      >
                        {chat.pinned ? "📌" : "☆"}
                      </button>

                      <button
                        type="button"
                        className="rename-chat"
                        onClick={(
                          event
                        ) =>
                          startRename(
                            chat,
                            event
                          )
                        }
                        title="Rename chat"
                      >
                        ✏️
                      </button>

                      <button
                        type="button"
                        className="delete-chat"
                        onClick={(
                          event
                        ) => {
                          event.stopPropagation();

                          deleteChat(
                            chat.id
                          );
                        }}
                        title="Delete chat"
                      >
                        🗑️
                      </button>
                    </>
                  )}
                </div>
              )
            )
          )}
        </div>

        <div className="sidebar-bottom">
          <button className="sidebar-option">
            ⚙️ Settings
          </button>

          <button
            type="button"
            className="sidebar-option clear-all-button"
            onClick={clearAllChats}
            title="Delete all chats"
          >
            🗑️ Clear All Chats
          </button>

          <button className="sidebar-option">
            👤 Profile
          </button>
        </div>
      </aside>

      {/* =========================
          MAIN
      ========================= */}

      <main className="main">
        <header className="header">
          <div>
            <h3>
              {activeChat?.title ||
                "New Chat"}
            </h3>

            <span>
              Local AI • Llama 3.2
            </span>
          </div>

          <div className="header-actions">
            <button
              type="button"
              className="export-button"
              onClick={
                exportChat
              }
              title="Export current chat"
            >
              📥 Export
            </button>

            <button
              type="button"
              className="import-button"
              onClick={
                importChat
              }
              title="Import chat"
            >
              📤 Import
            </button>

            <button
              className="theme-button"
              onClick={
                toggleTheme
              }
              title="Toggle theme"
            >
              {darkMode
                ? "☀️"
                : "🌙"}
            </button>
          </div>
        </header>

        {/* HIDDEN FILE INPUT */}

        <input
          ref={fileInputRef}
          type="file"
          accept=".txt"
          onChange={
            handleImportChat
          }
          style={{
            display: "none",
          }}
        />

        {/* =========================
            CHAT AREA
        ========================= */}

        <section className="chat-area">
          {!activeChat?.messages
            ?.length ? (
            <div className="welcome">
              <div className="welcome-icon">
                🤖
              </div>

              <h1>
                Welcome to MyAI
              </h1>

              <p>
                Your personal AI
                assistant powered by
                Llama 3.2.
              </p>
            </div>
          ) : (
            <div className="messages">
              {activeChat.messages.map(
                (message) => (
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
                        : "🤖"}
                    </div>

                    <div className="message-content">
                      <div className="message-name">
                        {message.role ===
                        "user"
                          ? "You"
                          : "MyAI"}
                      </div>

                      <div className="message-bubble">
                        <ReactMarkdown
                          components={{
                            pre({
                              children,
                            }) {
                              const codeElement =
                                React.Children.toArray(
                                  children
                                )[0];

                              const codeText =
                                codeElement
                                  ?.props
                                  ?.children ||
                                "";

                              const code =
                                String(
                                  codeText
                                ).replace(
                                  /\n$/,
                                  ""
                                );

                              const codeId =
                                Math.random();

                              return (
                                <div className="code-block">
                                  <div className="code-header">
                                    <span>
                                      Code
                                    </span>

                                    <button
                                      type="button"
                                      onClick={() =>
                                        copyCode(
                                          code,
                                          codeId
                                        )
                                      }
                                    >
                                      {copiedId ===
                                      `code-${codeId}`
                                        ? "Copied!"
                                        : "Copy"}
                                    </button>
                                  </div>

                                  <pre>
                                    {
                                      children
                                    }
                                  </pre>
                                </div>
                              );
                            },

                            code({
                              inline,
                              children,
                            }) {
                              if (
                                inline
                              ) {
                                return (
                                  <code className="inline-code">
                                    {
                                      children
                                    }
                                  </code>
                                );
                              }

                              return (
                                <code>
                                  {
                                    children
                                  }
                                </code>
                              );
                            },
                          }}
                        >
                          {
                            message.text
                          }
                        </ReactMarkdown>
                      </div>

                      {/* TIMESTAMP */}

                      {message.timestamp && (
                        <div className="message-timestamp">
                          {formatTime(
                            message.timestamp
                          )}
                        </div>
                      )}

                      {/* ACTIONS */}

                      {message.role ===
                        "assistant" && (
                        <div className="message-actions">
                          <button
                            type="button"
                            onClick={() =>
                              copyMessage(
                                message.text,
                                message.id
                              )
                            }
                          >
                            {copiedId ===
                            message.id
                              ? "✓ Copied"
                              : "📋 Copy"}
                          </button>

                          <button
                            type="button"
                            onClick={
                              regenerateResponse
                            }
                          >
                            🔄 Regenerate
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )
              )}

              {/* TYPING */}

              {loading && (
                <div className="message-row assistant">
                  <div className="message-avatar">
                    🤖
                  </div>

                  <div className="message-content">
                    <div className="message-name">
                      MyAI
                    </div>

                    <div className="typing">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </section>

        {/* =========================
            INPUT AREA
        ========================= */}

        <div className="input-area">
          <div className="input-wrapper">
            <textarea
              value={input}
              onChange={(event) =>
                setInput(
                  event.target.value
                )
              }
              onKeyDown={
                handleInputKeyDown
              }
              placeholder="Message MyAI..."
              rows="1"
              disabled={loading}
            />

            {loading ? (
              <button
                type="button"
                className="stop-button"
                onClick={
                  stopGenerating
                }
              >
                ■
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
                ➤
              </button>
            )}
          </div>

          <div className="input-hint">
            Press Enter to send •
            Shift + Enter for new line
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;