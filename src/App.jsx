import React, {
  useEffect,
  useRef,
  useState,
} from "react";

import ReactMarkdown from "react-markdown";

import "./App.css";

const API_URL = "http://localhost:5000";

const LANGUAGES = [
  { code: "en", name: "English", speech: "en-IN" },
  { code: "hi", name: "Hindi", speech: "hi-IN" },
  { code: "bn", name: "Bengali", speech: "bn-IN" },
  { code: "gu", name: "Gujarati", speech: "gu-IN" },
  { code: "mr", name: "Marathi", speech: "mr-IN" },
  { code: "pa", name: "Punjabi", speech: "pa-IN" },
  { code: "ta", name: "Tamil", speech: "ta-IN" },
  { code: "te", name: "Telugu", speech: "te-IN" },
  { code: "kn", name: "Kannada", speech: "kn-IN" },
  { code: "ml", name: "Malayalam", speech: "ml-IN" },
  { code: "ur", name: "Urdu", speech: "ur-IN" },
  { code: "es", name: "Spanish", speech: "es-ES" },
  { code: "fr", name: "French", speech: "fr-FR" },
  { code: "de", name: "German", speech: "de-DE" },
  { code: "it", name: "Italian", speech: "it-IT" },
  { code: "pt", name: "Portuguese", speech: "pt-PT" },
  { code: "ru", name: "Russian", speech: "ru-RU" },
  { code: "ja", name: "Japanese", speech: "ja-JP" },
  { code: "ko", name: "Korean", speech: "ko-KR" },
  { code: "zh-CN", name: "Chinese", speech: "zh-CN" },
  { code: "ar", name: "Arabic", speech: "ar-SA" },
  { code: "tr", name: "Turkish", speech: "tr-TR" },
  { code: "nl", name: "Dutch", speech: "nl-NL" },
  { code: "pl", name: "Polish", speech: "pl-PL" },
  { code: "sv", name: "Swedish", speech: "sv-SE" },
  { code: "id", name: "Indonesian", speech: "id-ID" },
];

function App() {
  /* =====================================================
     BASIC STATE
  ===================================================== */

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("astra-theme") || "light";
  });

  const [settingsOpen, setSettingsOpen] =
    useState(false);

  const [searchChats, setSearchChats] =
    useState("");

  const [backendStatus, setBackendStatus] =
    useState("checking");

  const [enterToSend, setEnterToSend] =
    useState(() => {
      const saved =
        localStorage.getItem(
          "astra-enter-to-send"
        );

      return saved === null
        ? true
        : saved === "true";
    });

  /* =====================================================
     UNIVERSAL TRANSLATOR
  ===================================================== */

  const [translateAnswers, setTranslateAnswers] =
    useState(() =>
      localStorage.getItem("astra-translate-answers") === "true"
    );

  const [targetLanguage, setTargetLanguage] =
    useState(() =>
      localStorage.getItem("astra-target-language") || "hi"
    );

  const [translatorInput, setTranslatorInput] = useState("");
  const [translatorOutput, setTranslatorOutput] = useState("");
  const [translatorLoading, setTranslatorLoading] = useState(false);
  const [translatorError, setTranslatorError] = useState("");

  /* =====================================================
     VOICE INPUT
  ===================================================== */

  const [isListening, setIsListening] =
    useState(false);

  const recognitionRef = useRef(null);

  const voiceTranscriptRef =
    useRef("");

  const voiceShouldListenRef =
    useRef(false);

  const voiceSilenceTimerRef =
    useRef(null);

  const voiceSendTimerRef =
    useRef(null);

  const voiceHasSpeechRef =
    useRef(false);

  /* =====================================================
     AI SPEECH OUTPUT
  ===================================================== */

  const [speechEnabled, setSpeechEnabled] =
    useState(() => {
      const saved =
        localStorage.getItem(
          "astra-speech-enabled"
        );

      return saved === null
        ? true
        : saved === "true";
    });

  const [voiceGender, setVoiceGender] =
    useState(() => {
      return (
        localStorage.getItem(
          "astra-voice-gender"
        ) || "female"
      );
    });

  const [isSpeaking, setIsSpeaking] =
    useState(false);

  const [availableVoices, setAvailableVoices] =
    useState([]);

  const speechUtteranceRef =
    useRef(null);

  /* =====================================================
     CHAT STORAGE
  ===================================================== */

  const [chats, setChats] = useState(() => {
    try {
      const saved =
        localStorage.getItem(
          "astra-chats"
        );

      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error(
        "Chat loading error:",
        error
      );
    }

    return [
      {
        id: Date.now(),
        title: "New Chat",
        pinned: false,
        messages: [],
        updatedAt: Date.now(),
      },
    ];
  });

  const [activeChatId, setActiveChatId] =
    useState(() => {
      try {
        const saved =
          localStorage.getItem(
            "astra-active-chat"
          );

        return saved
          ? Number(saved)
          : null;
      } catch {
        return null;
      }
    });

  const messagesEndRef =
    useRef(null);

  const fileInputRef =
    useRef(null);

  /* =====================================================
     ACTIVE CHAT
  ===================================================== */

  useEffect(() => {
    if (!activeChatId && chats.length > 0) {
      setActiveChatId(chats[0].id);
    }
  }, [activeChatId, chats]);

  const activeChat =
    chats.find(
      (chat) =>
        chat.id === activeChatId
    ) || chats[0];

  const messages =
    activeChat?.messages || [];

  /* =====================================================
     SAVE CHAT
  ===================================================== */

  useEffect(() => {
    localStorage.setItem(
      "astra-chats",
      JSON.stringify(chats)
    );
  }, [chats]);

  useEffect(() => {
    if (activeChatId) {
      localStorage.setItem(
        "astra-active-chat",
        activeChatId
      );
    }
  }, [activeChatId]);

  useEffect(() => {
    localStorage.setItem(
      "astra-theme",
      theme
    );
  }, [theme]);

  useEffect(() => {
    localStorage.setItem(
      "astra-enter-to-send",
      enterToSend
    );
  }, [enterToSend]);

  useEffect(() => {
    localStorage.setItem("astra-translate-answers", translateAnswers);
  }, [translateAnswers]);

  useEffect(() => {
    localStorage.setItem("astra-target-language", targetLanguage);
  }, [targetLanguage]);

  useEffect(() => {
    localStorage.setItem(
      "astra-speech-enabled",
      speechEnabled
    );
  }, [speechEnabled]);

  useEffect(() => {
    localStorage.setItem(
      "astra-voice-gender",
      voiceGender
    );
  }, [voiceGender]);

  /* =====================================================
     LOAD BROWSER VOICES
  ===================================================== */

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !window.speechSynthesis
    ) {
      return;
    }

    const loadVoices = () => {
      const voices =
        window.speechSynthesis.getVoices();

      setAvailableVoices(voices);
    };

    loadVoices();

    window.speechSynthesis.onvoiceschanged =
      loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged =
        null;
    };
  }, []);

  /* =====================================================
     SELECT AI VOICE
  ===================================================== */

  const getPreferredVoice = (languageCode = "en") => {
    if (!availableVoices.length) return null;

    const language = LANGUAGES.find((item) => item.code === languageCode);
    const speechLang = language?.speech || "en-IN";
    const baseLang = speechLang.toLowerCase().split("-")[0];

    const languageVoices = availableVoices.filter((voice) => {
      const voiceLang = (voice.lang || "").toLowerCase();
      return voiceLang === speechLang.toLowerCase() || voiceLang.startsWith(baseLang);
    });

    const voicesToUse = languageVoices.length ? languageVoices : availableVoices;

    const keywords = voiceGender === "female"
      ? ["female", "woman", "girl", "samantha", "zira", "susan", "karen", "veena", "priya", "neerja"]
      : ["male", "man", "boy", "david", "mark", "alex", "daniel", "ravi", "rishi", "hemant"];

    return voicesToUse.find((voice) =>
      keywords.some((keyword) => voice.name.toLowerCase().includes(keyword))
    ) || voicesToUse[0] || null;
  };

  /* =====================================================
     STOP AI SPEECH
  ===================================================== */

  const stopSpeaking = () => {
    if (
      typeof window !== "undefined" &&
      window.speechSynthesis
    ) {
      window.speechSynthesis.cancel();
    }

    speechUtteranceRef.current =
      null;

    setIsSpeaking(false);
  };

  /* =====================================================
     CLEAN TEXT FOR SPEECH
  ===================================================== */

  const cleanTextForSpeech = (
    text
  ) => {
    return text
      .replace(
        /```[\s\S]*?```/g,
        " "
      )
      .replace(
        /`([^`]+)`/g,
        "$1"
      )
      .replace(
        /!\[.*?\]\(.*?\)/g,
        " "
      )
      .replace(
        /\[([^\]]+)\]\(.*?\)/g,
        "$1"
      )
      .replace(
        /[*_#>]/g,
        " "
      )
      .replace(
        /\n+/g,
        " "
      )
      .replace(
        /\s+/g,
        " "
      )
      .trim();
  };

  /* =====================================================
     SPEAK AI RESPONSE
  ===================================================== */

  const speakResponse = (
    text,
    languageCode = "en"
  ) => {
    if (
      !speechEnabled ||
      !text ||
      typeof window === "undefined" ||
      !window.speechSynthesis
    ) {
      return;
    }

    stopSpeaking();

    const cleanText =
      cleanTextForSpeech(text);

    if (!cleanText) {
      return;
    }

    const utterance =
      new SpeechSynthesisUtterance(
        cleanText
      );

    const selectedVoice =
      getPreferredVoice(languageCode);

    if (selectedVoice) {
      utterance.voice =
        selectedVoice;

      utterance.lang =
        selectedVoice.lang ||
        LANGUAGES.find((item) => item.code === languageCode)?.speech ||
        "en-IN";
    } else {
      utterance.lang =
        LANGUAGES.find((item) => item.code === languageCode)?.speech ||
        "en-IN";
    }

    /*
      Voice settings
    */

    if (
      voiceGender === "female"
    ) {
      utterance.pitch = 1.08;
      utterance.rate = 0.95;
    } else {
      utterance.pitch = 0.88;
      utterance.rate = 0.95;
    }

    utterance.volume = 1;

    utterance.onstart = () => {
      setIsSpeaking(true);
    };

    utterance.onend = () => {
      setIsSpeaking(false);

      speechUtteranceRef.current =
        null;
    };

    utterance.onerror = (
      error
    ) => {
      console.error(
        "Speech error:",
        error
      );

      setIsSpeaking(false);

      speechUtteranceRef.current =
        null;
    };

    speechUtteranceRef.current =
      utterance;

    window.speechSynthesis.speak(
      utterance
    );
  };

  /* =====================================================
     UNIVERSAL TRANSLATOR
  ===================================================== */

  const getLanguageName = (code) =>
    LANGUAGES.find((language) => language.code === code)?.name || code;

  const translateText = async (text, targetCode = targetLanguage) => {
    const cleanInput = text?.trim();
    if (!cleanInput || !targetCode) return cleanInput || "";

    const targetName = getLanguageName(targetCode);
    const translationPrompt = `Translate the following text into ${targetName}.

Return ONLY the translated text. Preserve meaning, formatting, markdown, bullet points and code blocks. Do not add explanations. Keep programming code unchanged.

Text:
${cleanInput}`;

    const response = await fetch(`${API_URL}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: translationPrompt, messages: [] }),
    });

    if (!response.ok) throw new Error("Translation request failed");
    const data = await response.json();
    return data.reply?.trim() || cleanInput;
  };

  const runManualTranslation = async () => {
    if (!translatorInput.trim() || translatorLoading) return;
    setTranslatorLoading(true);
    setTranslatorError("");
    setTranslatorOutput("");
    try {
      setTranslatorOutput(await translateText(translatorInput, targetLanguage));
    } catch (error) {
      console.error("Translation error:", error);
      setTranslatorError("Translation failed. Please make sure the backend is running.");
    } finally {
      setTranslatorLoading(false);
    }
  };

  const speakTranslation = () => {
    if (translatorOutput.trim()) speakResponse(translatorOutput, targetLanguage);
  };

  const clearTranslator = () => {
    setTranslatorInput("");
    setTranslatorOutput("");
    setTranslatorError("");
  };

  /* =====================================================
     BACKEND STATUS
  ===================================================== */

  const checkBackend = async () => {
    try {
      setBackendStatus(
        "checking"
      );

      const response =
        await fetch(API_URL, {
          method: "GET",
        });

      if (response.ok) {
        setBackendStatus(
          "online"
        );
      } else {
        setBackendStatus(
          "offline"
        );
      }
    } catch {
      setBackendStatus(
        "offline"
      );
    }
  };

  useEffect(() => {
    checkBackend();

    const interval =
      setInterval(
        checkBackend,
        10000
      );

    return () =>
      clearInterval(interval);
  }, []);

  /* =====================================================
     AUTO SCROLL
  ===================================================== */

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView(
      {
        behavior: "smooth",
      }
    );
  }, [
    messages,
    loading,
  ]);

  /* =====================================================
     UPDATE ACTIVE CHAT
  ===================================================== */

  const updateActiveChat = (
    updater
  ) => {
    setChats((prev) =>
      prev.map((chat) => {
        if (
          chat.id !==
          activeChatId
        ) {
          return chat;
        }

        return updater(chat);
      })
    );
  };

  /* =====================================================
     NEW CHAT
  ===================================================== */

  const createNewChat = () => {
    stopSpeaking();

    const newChat = {
      id:
        Date.now() +
        Math.floor(
          Math.random() * 1000
        ),

      title: "New Chat",

      pinned: false,

      messages: [],

      updatedAt: Date.now(),
    };

    setChats((prev) => [
      newChat,
      ...prev,
    ]);

    setActiveChatId(
      newChat.id
    );

    setInput("");
  };

  /* =====================================================
     SEND MESSAGE
  ===================================================== */

  const sendMessage = async (
    messageOverride = null
  ) => {
    const message = (
      messageOverride !== null
        ? messageOverride
        : input
    ).trim();

    if (
      !message ||
      loading ||
      !activeChat
    ) {
      return;
    }

    stopSpeaking();

    const userMessage = {
      id:
        Date.now() +
        Math.random(),

      role: "user",

      content: message,

      timestamp:
        Date.now(),
    };

    const updatedMessages = [
      ...activeChat.messages,
      userMessage,
    ];

    updateActiveChat(
      (chat) => ({
        ...chat,

        messages:
          updatedMessages,

        title:
          chat.messages
            .length === 0
            ? message.slice(
                0,
                42
              )
            : chat.title,

        updatedAt:
          Date.now(),
      })
    );

    setInput("");

    setLoading(true);

    try {
      const response =
        await fetch(
          `${API_URL}/chat`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              message,

              messages:
                updatedMessages.map(
                  (item) => ({
                    role:
                      item.role,
                    content:
                      item.content,
                  })
                ),
            }),
          }
        );

      if (!response.ok) {
        throw new Error(
          "Backend response failed"
        );
      }

      const data =
        await response.json();

      const originalAiReply =
        data.reply ||
        "Sorry, I could not generate a response.";

      let aiReply = originalAiReply;

      if (translateAnswers && targetLanguage !== "en") {
        try {
          aiReply = await translateText(originalAiReply, targetLanguage);
        } catch (translationError) {
          console.error("Automatic translation error:", translationError);
        }
      }

      const assistantMessage = {
        id:
          Date.now() +
          Math.random(),

        role: "assistant",

        content: aiReply,

        timestamp:
          Date.now(),

        webSearchUsed:
          Boolean(
            data.webSearchUsed
          ),

        language: translateAnswers ? targetLanguage : "en",
      };

      updateActiveChat(
        (chat) => ({
          ...chat,

          messages: [
            ...chat.messages,
            assistantMessage,
          ],

          updatedAt:
            Date.now(),
        })
      );

      /*
        Automatically speak AI answer
      */

      if (speechEnabled) {
        setTimeout(() => {
          speakResponse(
            aiReply,
            translateAnswers ? targetLanguage : "en"
          );
        }, 150);
      }
    } catch (error) {
      console.error(
        "Send message error:",
        error
      );

      const errorMessage = {
        id:
          Date.now() +
          Math.random(),

        role: "assistant",

        content:
          "⚠️ I could not connect to the Astra AI backend. Please make sure the backend and Ollama are running.",

        timestamp:
          Date.now(),
      };

      updateActiveChat(
        (chat) => ({
          ...chat,

          messages: [
            ...chat.messages,
            errorMessage,
          ],

          updatedAt:
            Date.now(),
        })
      );
    } finally {
      setLoading(false);
    }
  };

  /* =====================================================
     VOICE INPUT
     GOOGLE ASSISTANT STYLE
  ===================================================== */

  const startVoiceSearch = () => {
    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert(
        "Voice search is not supported. Please use Google Chrome or Microsoft Edge."
      );

      return;
    }

    if (loading) {
      return;
    }

    /*
      Clicking mic again manually stops listening.
    */

    if (isListening) {
      voiceShouldListenRef.current =
        false;

      clearTimeout(
        voiceSilenceTimerRef.current
      );

      try {
        recognitionRef.current?.stop();
      } catch {}

      return;
    }

    voiceShouldListenRef.current =
      true;

    voiceTranscriptRef.current =
      "";

    voiceHasSpeechRef.current =
      false;

    clearTimeout(
      voiceSilenceTimerRef.current
    );

    clearTimeout(
      voiceSendTimerRef.current
    );

    const createRecognition =
      () => {
        const recognition =
          new SpeechRecognition();

        recognitionRef.current =
          recognition;

        recognition.lang =
          "en-IN";

        recognition.continuous =
          true;

        recognition.interimResults =
          true;

        recognition.maxAlternatives =
          1;

        recognition.onstart =
          () => {
            setIsListening(
              true
            );
          };

        recognition.onresult =
          (event) => {
            let interimText =
              "";

            for (
              let i =
                event.resultIndex;
              i <
              event.results
                .length;
              i++
            ) {
              const transcript =
                event.results[
                  i
                ][0].transcript;

              /*
                We know the user has
                actually started speaking.
              */

              if (
                transcript.trim()
              ) {
                voiceHasSpeechRef.current =
                  true;
              }

              if (
                event.results[i]
                  .isFinal
              ) {
                voiceTranscriptRef.current +=
                  transcript +
                  " ";
              } else {
                interimText +=
                  transcript;
              }
            }

            const completeText =
              `${voiceTranscriptRef.current} ${interimText}`.trim();

            if (completeText) {
              setInput(
                completeText
              );
            }

            /*
              IMPORTANT:
              Do not start the silence
              timer until speech exists.
            */

            if (
              voiceHasSpeechRef.current
            ) {
              clearTimeout(
                voiceSilenceTimerRef.current
              );

              voiceSilenceTimerRef.current =
                setTimeout(() => {
                  if (
                    voiceShouldListenRef.current &&
                    voiceHasSpeechRef.current
                  ) {
                    voiceShouldListenRef.current =
                      false;

                    try {
                      recognition.stop();
                    } catch {}
                  }
                }, 1800);
            }
          };

        recognition.onerror =
          (event) => {
            console.log(
              "🎙️ Voice error:",
              event.error
            );

            /*
              Browser sometimes fires
              no-speech automatically.
              We restart instead of
              turning the microphone off.
            */

            if (
              event.error ===
                "no-speech" ||
              event.error ===
                "aborted"
            ) {
              return;
            }

            if (
              event.error ===
                "not-allowed" ||
              event.error ===
                "service-not-allowed"
            ) {
              voiceShouldListenRef.current =
                false;

              clearTimeout(
                voiceSilenceTimerRef.current
              );

              setIsListening(
                false
              );

              recognitionRef.current =
                null;

              alert(
                "Microphone permission denied. Please allow microphone access in Chrome."
              );

              return;
            }

            if (
              event.error ===
              "audio-capture"
            ) {
              voiceShouldListenRef.current =
                false;

              clearTimeout(
                voiceSilenceTimerRef.current
              );

              setIsListening(
                false
              );

              recognitionRef.current =
                null;

              alert(
                "Microphone is not available. Please check your Windows microphone settings."
              );
            }
          };

        recognition.onend =
          () => {
            clearTimeout(
              voiceSilenceTimerRef.current
            );

            const shouldContinue =
              voiceShouldListenRef.current;

            const spokenText =
              voiceTranscriptRef.current.trim();

            /*
              If browser stopped
              listening before speech,
              restart automatically.
            */

            if (
              shouldContinue &&
              !spokenText
            ) {
              setTimeout(() => {
                if (
                  !voiceShouldListenRef.current
                ) {
                  return;
                }

                try {
                  const nextRecognition =
                    createRecognition();

                  nextRecognition.start();
                } catch (
                  error
                ) {
                  console.log(
                    "Voice restart error:",
                    error
                  );
                }
              }, 250);

              return;
            }

            /*
              If speech exists and browser
              naturally ended recognition,
              send the message.
            */

            if (
              shouldContinue &&
              spokenText
            ) {
              voiceShouldListenRef.current =
                false;
            }

            setIsListening(
              false
            );

            recognitionRef.current =
              null;

            if (
              spokenText
            ) {
              setInput(
                spokenText
              );

              clearTimeout(
                voiceSendTimerRef.current
              );

              voiceSendTimerRef.current =
                setTimeout(() => {
                  sendMessage(
                    spokenText
                  );
                }, 250);
            }
          };

        return recognition;
      };

    try {
      const recognition =
        createRecognition();

      recognition.start();
    } catch (error) {
      console.error(
        "Mic start error:",
        error
      );

      setIsListening(
        false
      );

      voiceShouldListenRef.current =
        false;

      recognitionRef.current =
        null;
    }
  };

  /* =====================================================
     CLEANUP VOICE
  ===================================================== */

  useEffect(() => {
    return () => {
      voiceShouldListenRef.current =
        false;

      clearTimeout(
        voiceSilenceTimerRef.current
      );

      clearTimeout(
        voiceSendTimerRef.current
      );

      try {
        recognitionRef.current?.stop();
      } catch {}

      if (
        window.speechSynthesis
      ) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  /* =====================================================
     CHAT ACTIONS
  ===================================================== */

  const deleteChat = (
    chatId
  ) => {
    const remaining =
      chats.filter(
        (chat) =>
          chat.id !== chatId
      );

    if (
      remaining.length === 0
    ) {
      const newChat = {
        id: Date.now(),

        title: "New Chat",

        pinned: false,

        messages: [],

        updatedAt:
          Date.now(),
      };

      setChats([newChat]);

      setActiveChatId(
        newChat.id
      );

      return;
    }

    setChats(remaining);

    if (
      activeChatId === chatId
    ) {
      setActiveChatId(
        remaining[0].id
      );
    }
  };

  const togglePin = (
    chatId
  ) => {
    setChats((prev) =>
      prev.map((chat) =>
        chat.id === chatId
          ? {
              ...chat,
              pinned:
                !chat.pinned,
            }
          : chat
      )
    );
  };

  const renameChat = (
    chatId
  ) => {
    const chat =
      chats.find(
        (item) =>
          item.id === chatId
      );

    if (!chat) return;

    const newName =
      window.prompt(
        "Enter new chat name:",
        chat.title
      );

    if (
      !newName?.trim()
    ) {
      return;
    }

    setChats((prev) =>
      prev.map((item) =>
        item.id === chatId
          ? {
              ...item,
              title:
                newName.trim(),
            }
          : item
      )
    );
  };

  const clearCurrentChat =
    () => {
      updateActiveChat(
        (chat) => ({
          ...chat,
          messages: [],
          title: "New Chat",
          updatedAt:
            Date.now(),
        })
      );

      stopSpeaking();

      setInput("");
    };

  /* =====================================================
     COPY
  ===================================================== */

  const copyText = async (
    text
  ) => {
    try {
      await navigator.clipboard.writeText(
        text
      );
    } catch (error) {
      console.error(
        "Copy failed:",
        error
      );
    }
  };

  /* =====================================================
     REGENERATE
  ===================================================== */

  const regenerate = async (
    index
  ) => {
    if (loading) return;

    const previousUserMessage =
      messages
        .slice(0, index)
        .reverse()
        .find(
          (message) =>
            message.role ===
            "user"
        );

    if (
      !previousUserMessage
    ) {
      return;
    }

    const trimmedMessages =
      messages.slice(
        0,
        index
      );

    updateActiveChat(
      (chat) => ({
        ...chat,

        messages:
          trimmedMessages,

        updatedAt:
          Date.now(),
      })
    );

    setTimeout(() => {
      sendMessage(
        previousUserMessage.content
      );
    }, 100);
  };

  /* =====================================================
     EXPORT
  ===================================================== */

  const exportChats = () => {
    const data = JSON.stringify(
      chats,
      null,
      2
    );

    const blob =
      new Blob(
        [data],
        {
          type:
            "application/json",
        }
      );

    const url =
      URL.createObjectURL(
        blob
      );

    const link =
      document.createElement(
        "a"
      );

    link.href = url;

    link.download =
      "astra-ai-chats.json";

    link.click();

    URL.revokeObjectURL(
      url
    );
  };

  /* =====================================================
     IMPORT
  ===================================================== */

  const importChats = (
    event
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    const reader =
      new FileReader();

    reader.onload = (
      e
    ) => {
      try {
        const imported =
          JSON.parse(
            e.target.result
          );

        if (
          Array.isArray(
            imported
          )
        ) {
          setChats(
            imported
          );

          if (
            imported.length >
            0
          ) {
            setActiveChatId(
              imported[0].id
            );
          }
        }
      } catch {
        alert(
          "Invalid chat backup file."
        );
      }
    };

    reader.readAsText(
      file
    );

    event.target.value = "";
  };

  /* =====================================================
     ENTER KEY
  ===================================================== */

  const handleKeyDown = (
    event
  ) => {
    if (
      event.key ===
        "Enter" &&
      !event.shiftKey
    ) {
      if (enterToSend) {
        event.preventDefault();

        sendMessage();
      }
    }
  };

  /* =====================================================
     QUICK PROMPTS
  ===================================================== */

  const quickPrompt = (
    text
  ) => {
    setInput(text);

    setTimeout(() => {
      sendMessage(text);
    }, 100);
  };

  /* =====================================================
     FILTER CHATS
  ===================================================== */

  const filteredChats =
    chats
      .filter((chat) =>
        chat.title
          .toLowerCase()
          .includes(
            searchChats.toLowerCase()
          )
      )
      .sort(
        (a, b) =>
          Number(b.pinned) -
            Number(a.pinned) ||
          b.updatedAt -
            a.updatedAt
      );

  /* =====================================================
     FORMAT TIME
  ===================================================== */

  const formatTime = (
    timestamp
  ) => {
    if (!timestamp) {
      return "";
    }

    return new Date(
      timestamp
    ).toLocaleTimeString(
      [],
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };

  /* =====================================================
     CODE COMPONENT
  ===================================================== */

  const CodeBlock = ({
    inline,
    className,
    children,
  }) => {
    const code =
      String(children).replace(
        /\n$/,
        ""
      );

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
            {className
              ?.replace(
                "language-",
                ""
              ) ||
              "code"}
          </span>

          <button
            className="code-copy-button"
            onClick={() =>
              copyText(code)
            }
          >
            📋 Copy
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

  /* =====================================================
     UI
  ===================================================== */

  return (
    <div
      className={`app ${
        theme === "dark"
          ? "dark-mode"
          : ""
      }`}
    >
      {/* =================================================
          LEFT SIDEBAR
      ================================================= */}

      <aside className="sidebar">
        <div className="sidebar-top">
          <div className="logo-area">
            <div className="logo-icon">
              ✨
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
            className="new-chat-button"
            onClick={
              createNewChat
            }
          >
            <span>＋</span>
            New Chat
          </button>

          <div className="search-box sidebar-search-box">
            <span>
              🔍
            </span>

            <input
              value={
                searchChats
              }
              onChange={(event) =>
                setSearchChats(
                  event.target
                    .value
                )
              }
              placeholder="Search chats..."
            />
          </div>
        </div>

        <div className="chat-history">
          {filteredChats.length ===
          0 ? (
            <div className="no-chats">
              No chats found
            </div>
          ) : (
            filteredChats.map(
              (chat) => (
                <div
                  key={
                    chat.id
                  }
                  className={`chat-history-item ${
                    chat.id ===
                    activeChatId
                      ? "active"
                      : ""
                  }`}
                  onClick={() =>
                    setActiveChatId(
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

                    <span className="chat-title">
                      {chat.title}
                    </span>
                  </div>

                  <div className="chat-actions">
                    <button
                      title="Pin"
                      onClick={(
                        event
                      ) => {
                        event.stopPropagation();

                        togglePin(
                          chat.id
                        );
                      }}
                    >
                      {chat.pinned
                        ? "📌"
                        : "📍"}
                    </button>

                    <button
                      title="Rename"
                      onClick={(
                        event
                      ) => {
                        event.stopPropagation();

                        renameChat(
                          chat.id
                        );
                      }}
                    >
                      ✏️
                    </button>

                    <button
                      title="Delete"
                      onClick={(
                        event
                      ) => {
                        event.stopPropagation();

                        deleteChat(
                          chat.id
                        );
                      }}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              )
            )
          )}
        </div>

        <div className="sidebar-bottom">
          <button
            onClick={() =>
              setSettingsOpen(
                true
              )
            }
          >
            ⚙️
            <span>
              Settings
            </span>
          </button>

          <button
            onClick={
              clearCurrentChat
            }
          >
            🧹
            <span>
              Clear Current Chat
            </span>
          </button>
        </div>
      </aside>

      {/* =================================================
          MAIN CONTENT
      ================================================= */}

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
            <button
              className="export-button"
              title="Export chats"
              onClick={
                exportChats
              }
            >
              📤
            </button>

            <button
              className="import-button"
              title="Import chats"
              onClick={() =>
                fileInputRef.current?.click()
              }
            >
              📥
            </button>

            <input
              ref={
                fileInputRef
              }
              type="file"
              accept=".json"
              style={{
                display:
                  "none",
              }}
              onChange={
                importChats
              }
            />

            <label className="bloom-switch">
              <input
                type="checkbox"
                checked={
                  theme ===
                  "dark"
                }
                onChange={(
                  event
                ) =>
                  setTheme(
                    event.target
                      .checked
                      ? "dark"
                      : "light"
                  )
                }
              />

              <span className="bloom-slider">
                <span className="bloom-icon">
                  {theme ===
                  "dark"
                    ? "🌙"
                    : "☀️"}
                </span>
              </span>
            </label>
          </div>
        </header>

        {/* =================================================
            MESSAGES
        ================================================= */}

        <div className="messages-container">
          {messages.length ===
          0 ? (
            <div className="welcome-screen">
              <div className="welcome-icon">
                ✨
              </div>

              <h2>
                Welcome to Astra AI
              </h2>

              <p>
                Ask anything, search
                the web, write code,
                or use your voice.
              </p>

              <div className="welcome-suggestions">
                <button
                  onClick={() =>
                    quickPrompt(
                      "Explain artificial intelligence in simple words."
                    )
                  }
                >
                  Explain AI simply
                </button>

                <button
                  onClick={() =>
                    quickPrompt(
                      "Write a JavaScript program to reverse a string."
                    )
                  }
                >
                  Write code
                </button>

                <button
                  onClick={() =>
                    quickPrompt(
                      "Tell me the latest technology news."
                    )
                  }
                >
                  Latest news
                </button>

                <button
                  onClick={() =>
                    quickPrompt(
                      "Give me some useful productivity tips."
                    )
                  }
                >
                  Productivity tips
                </button>
              </div>
            </div>
          ) : (
            <>
              {messages.map(
                (
                  message,
                  index
                ) => (
                  <div
                    key={
                      message.id ||
                      index
                    }
                    className={`message-row ${
                      message.role ===
                      "user"
                        ? "user"
                        : "assistant"
                    }`}
                  >
                    <div className="message-avatar">
                      {message.role ===
                      "user"
                        ? "👤"
                        : "✨"}
                    </div>

                    <div className="message-content-wrapper">
                      <div className="message-name">
                        {message.role ===
                        "user"
                          ? "You"
                          : "Astra AI"}
                      </div>

                      <div className="message-bubble">
                        <ReactMarkdown
                          components={{
                            code:
                              CodeBlock,
                          }}
                        >
                          {
                            message.content
                          }
                        </ReactMarkdown>

                        {message.webSearchUsed && (
                          <div
                            style={{
                              marginTop:
                                "10px",
                              fontSize:
                                "11px",
                              color:
                                "#64748b",
                            }}
                          >
                            🔎 Answered using
                            web search
                          </div>
                        )}
                      </div>

                      <div className="message-footer">
                        <span className="message-time">
                          {formatTime(
                            message.timestamp
                          )}
                        </span>

                        <div className="message-actions">
                          <button
                            onClick={() =>
                              copyText(
                                message.content
                              )
                            }
                          >
                            📋 Copy
                          </button>

                          {message.role ===
                            "assistant" && (
                            <>
                              <button
                                onClick={() =>
                                  speakResponse(
                                    message.content,
                                    message.language || "en"
                                  )
                                }
                              >
                                🔊 Speak
                              </button>

                              <button
                                onClick={
                                  stopSpeaking
                                }
                                disabled={
                                  !isSpeaking
                                }
                              >
                                ⏹ Stop
                              </button>

                              <button
                                onClick={() =>
                                  regenerate(
                                    index
                                  )
                                }
                                disabled={
                                  loading
                                }
                              >
                                🔄 Regenerate
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              )}

              {loading && (
                <div className="message-row">
                  <div className="message-avatar">
                    ✨
                  </div>

                  <div className="message-content-wrapper">
                    <div className="message-name">
                      Astra AI
                    </div>

                    <div className="message-bubble astra-loader-bubble">
                      <div className="astra-loader">
                        Astra AI is{" "}
                        <span className="loader-highlight">
                          thinking...
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          <div
            ref={
              messagesEndRef
            }
          />
        </div>

        {/* =================================================
            INPUT AREA
        ================================================= */}

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
                handleKeyDown
              }
              placeholder={
                isListening
                  ? "🎙️ Listening... speak now"
                  : "Message Astra AI..."
              }
              rows={1}
              disabled={loading}
            />

            {/* VOICE BUTTON */}

            <button
              type="button"
              onClick={
                startVoiceSearch
              }
              disabled={loading}
              title={
                isListening
                  ? "Stop listening"
                  : "Voice search"
              }
              style={{
                width: "48px",
                height: "48px",
                flexShrink: 0,
                border: "none",
                borderRadius:
                  "15px",
                cursor: loading
                  ? "not-allowed"
                  : "pointer",
                background:
                  isListening
                    ? "linear-gradient(135deg,#ef4444,#dc2626)"
                    : "linear-gradient(135deg,#7c3aed,#2563eb)",
                color:
                  "#ffffff",
                fontSize:
                  "21px",
                display:
                  "flex",
                alignItems:
                  "center",
                justifyContent:
                  "center",
                boxShadow:
                  isListening
                    ? "0 0 22px rgba(239,68,68,.45)"
                    : "0 7px 18px rgba(79,70,229,.25)",
                transform:
                  isListening
                    ? "scale(1.05)"
                    : "scale(1)",
                transition:
                  "all .2s ease",
              }}
            >
              {isListening
                ? "⏹"
                : "🎙️"}
            </button>

            {loading ? (
              <button
                className="stop-button"
                onClick={() => {
                  setLoading(
                    false
                  );
                }}
              >
                Stop
              </button>
            ) : (
              <button
                className="send-button"
                disabled={
                  !input.trim()
                }
                onClick={() =>
                  sendMessage()
                }
              >
                <span>
                  Send ➤
                </span>
              </button>
            )}
          </div>

          <div className="input-hint">
            Press Enter to send •
            Shift + Enter for new line
            • 🎙️ Voice input • 🔊 AI
            voice output
          </div>
        </div>
      </main>

      {/* =================================================
          RIGHT DASHBOARD
      ================================================= */}

      <aside className="dashboard">
        <div className="dashboard-card status-card">
          <div className="dashboard-card-header">
            <div>
              <span className="dashboard-label">
                SYSTEM
              </span>

              <h3>
                Astra Status
              </h3>
            </div>

            <div
              className={`status-dot ${backendStatus}`}
            />
          </div>

          <div className="status-row">
            <span>
              Backend
            </span>

            <strong
              className={`status-${backendStatus}`}
            >
              {backendStatus ===
              "online"
                ? "Online"
                : backendStatus ===
                  "offline"
                ? "Offline"
                : "Checking..."}
            </strong>
          </div>

          <div className="status-row">
            <span>
              Voice Input
            </span>

            <strong className="status-online">
              {isListening
                ? "Listening"
                : "Ready"}
            </strong>
          </div>

          <div className="status-row">
            <span>
              AI Voice
            </span>

            <strong className="status-online">
              {speechEnabled
                ? voiceGender ===
                  "female"
                  ? "Female"
                  : "Male"
                : "Off"}
            </strong>
          </div>

          <div className="status-row">
            <span>Translator</span>
            <strong className="status-online">
              {translateAnswers ? getLanguageName(targetLanguage) : "Off"}
            </strong>
          </div>

          <div className="status-row">
            <span>
              AI Speech
            </span>

            <strong className="status-online">
              {isSpeaking
                ? "Speaking"
                : "Ready"}
            </strong>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <div>
              <span className="dashboard-label">
                TOOLS
              </span>

              <h3>
                Quick Actions
              </h3>
            </div>

            <div className="dashboard-card-icon">
              ⚡
            </div>
          </div>

          <div className="quick-actions-grid">
            <button
              onClick={() =>
                quickPrompt(
                  "Explain this topic in simple language."
                )
              }
            >
              <span>
                🧠
              </span>

              <strong>
                Explain
              </strong>

              <small>
                Simple explanation
              </small>
            </button>

            <button
              onClick={() =>
                quickPrompt(
                  "Give me the latest important technology news."
                )
              }
            >
              <span>
                🔎
              </span>

              <strong>
                Web Search
              </strong>

              <small>
                Latest information
              </small>
            </button>

            <button
              onClick={() =>
                quickPrompt(
                  "Write a useful JavaScript example."
                )
              }
            >
              <span>
                💻
              </span>

              <strong>
                Code
              </strong>

              <small>
                Programming help
              </small>
            </button>

            <button
              onClick={() => setSettingsOpen(true)}
            >
              <span>🌐</span>
              <strong>Translate</strong>
              <small>Any language</small>
            </button>

            <button
              onClick={
                startVoiceSearch
              }
            >
              <span>
                🎙️
              </span>

              <strong>
                Voice
              </strong>

              <small>
                Ask by voice
              </small>
            </button>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <div>
              <span className="dashboard-label">
                STATISTICS
              </span>

              <h3>
                Usage
              </h3>
            </div>

            <div className="dashboard-card-icon">
              📊
            </div>
          </div>

          <div className="stats-grid">
            <div className="stat-box">
              <span>
                💬
              </span>

              <strong>
                {messages.length}
              </strong>

              <small>
                Current messages
              </small>
            </div>

            <div className="stat-box">
              <span>
                🗂️
              </span>

              <strong>
                {chats.length}
              </strong>

              <small>
                Total chats
              </small>
            </div>

            <div className="stat-box">
              <span>
                🔊
              </span>

              <strong>
                {speechEnabled
                  ? "ON"
                  : "OFF"}
              </strong>

              <small>
                AI speech
              </small>
            </div>

            <div className="stat-box">
              <span>
                🎙️
              </span>

              <strong>
                {isListening
                  ? "ON"
                  : "OFF"}
              </strong>

              <small>
                Microphone
              </small>
            </div>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <div>
              <span className="dashboard-label">
                RECENT
              </span>

              <h3>
                Recent Chats
              </h3>
            </div>

            <div className="dashboard-card-icon">
              🕘
            </div>
          </div>

          <div className="recent-chats">
            {chats
              .slice(0, 5)
              .map(
                (chat) => (
                  <button
                    key={
                      chat.id
                    }
                    className={`recent-chat ${
                      chat.id ===
                      activeChatId
                        ? "selected"
                        : ""
                    }`}
                    onClick={() =>
                      setActiveChatId(
                        chat.id
                      )
                    }
                  >
                    <span className="recent-chat-icon">
                      💬
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
                            .length
                        }{" "}
                        messages
                      </small>
                    </span>
                  </button>
                )
              )}
          </div>
        </div>

        <div className="dashboard-footer">
          <div className="footer-ai-icon">
            ✨
          </div>

          <div>
            <strong>
              Astra AI
            </strong>

            <span>
              Local AI • Ollama •
              Tavily
            </span>
          </div>
        </div>
      </aside>

      {/* =================================================
          SETTINGS
      ================================================= */}

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
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="settings-header">
              <div>
                <h2>
                  Settings
                </h2>

                <p>
                  Customize your Astra AI
                  experience.
                </p>
              </div>

              <button
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

            {/* SPEECH SETTINGS */}

            <div className="settings-section">
              <h3>
                AI Voice
              </h3>

              <div className="settings-item">
                <div>
                  <strong>
                    Read AI answers aloud
                  </strong>

                  <span>
                    Astra AI will automatically
                    speak every answer.
                  </span>
                </div>

                <button
                  className="settings-action"
                  onClick={() =>
                    setSpeechEnabled(
                      (value) =>
                        !value
                    )
                  }
                >
                  {speechEnabled
                    ? "ON"
                    : "OFF"}
                </button>
              </div>

              <div className="settings-item">
                <div>
                  <strong>
                    Voice type
                  </strong>

                  <span>
                    Choose the preferred AI
                    speaking voice.
                  </span>
                </div>

                <div
                  style={{
                    display:
                      "flex",
                    gap: "7px",
                  }}
                >
                  <button
                    className="settings-action"
                    style={{
                      border:
                        voiceGender ===
                        "female"
                          ? "1px solid #8b5cf6"
                          : undefined,
                      background:
                        voiceGender ===
                        "female"
                          ? "#f5f3ff"
                          : undefined,
                    }}
                    onClick={() =>
                      setVoiceGender(
                        "female"
                      )
                    }
                  >
                    👩 Female
                  </button>

                  <button
                    className="settings-action"
                    style={{
                      border:
                        voiceGender ===
                        "male"
                          ? "1px solid #2563eb"
                          : undefined,
                      background:
                        voiceGender ===
                        "male"
                          ? "#eff6ff"
                          : undefined,
                    }}
                    onClick={() =>
                      setVoiceGender(
                        "male"
                      )
                    }
                  >
                    👨 Male
                  </button>
                </div>
              </div>

              <div className="settings-item">
                <div>
                  <strong>
                    Current voice
                  </strong>

                  <span>
                    {getPreferredVoice()
                      ?.name ||
                      "Browser default voice"}
                  </span>
                </div>

                <button
                  className="settings-action"
                  onClick={() =>
                    speakResponse(
                      "Hello! This is Astra AI. This is my selected voice."
                    )
                  }
                >
                  🔊 Test
                </button>
              </div>

              <div className="settings-item">
                <div>
                  <strong>
                    Stop speaking
                  </strong>

                  <span>
                    Immediately stop the current
                    AI voice.
                  </span>
                </div>

                <button
                  className="settings-action settings-danger"
                  onClick={
                    stopSpeaking
                  }
                >
                  ⏹ Stop
                </button>
              </div>
            </div>

            {/* UNIVERSAL TRANSLATOR */}

            <div className="settings-section">
              <h3>🌐 Universal Translator</h3>

              <div className="settings-item">
                <div>
                  <strong>Translate AI answers</strong>
                  <span>Automatically translate every Astra AI answer.</span>
                </div>
                <button className="settings-action" onClick={() => setTranslateAnswers((value) => !value)}>
                  {translateAnswers ? "ON" : "OFF"}
                </button>
              </div>

              <div className="settings-item">
                <div>
                  <strong>Answer language</strong>
                  <span>Text and AI voice will use this language.</span>
                </div>
                <select value={targetLanguage} onChange={(event) => setTargetLanguage(event.target.value)} style={{padding:"9px 12px",borderRadius:"10px",border:"1px solid #cbd5e1",background:"white"}}>
                  {LANGUAGES.map((language) => <option key={language.code} value={language.code}>{language.name}</option>)}
                </select>
              </div>

              <div className="settings-item">
                <div>
                  <strong>Translate any text</strong>
                  <span>Paste text and get a written + spoken translation.</span>
                </div>
                <button className="settings-action" onClick={() => setTranslatorInput((value) => value || " ")}>
                  🌐 Open below
                </button>
              </div>

              <div style={{display:"grid",gap:"9px",marginTop:"10px"}}>
                <textarea value={translatorInput} onChange={(event) => setTranslatorInput(event.target.value)} placeholder="Type or paste text..." rows={3} style={{width:"100%",boxSizing:"border-box",padding:"10px",borderRadius:"10px",border:"1px solid #cbd5e1"}} />
                <button className="settings-action" onClick={runManualTranslation} disabled={translatorLoading || !translatorInput.trim()}>
                  {translatorLoading ? "Translating..." : "🌐 Translate"}
                </button>
                {translatorError && <span style={{color:"#dc2626",fontSize:"13px"}}>{translatorError}</span>}
                {translatorOutput && (<>
                  <textarea value={translatorOutput} readOnly rows={3} style={{width:"100%",boxSizing:"border-box",padding:"10px",borderRadius:"10px",border:"1px solid #cbd5e1"}} />
                  <div style={{display:"flex",gap:"8px",flexWrap:"wrap"}}>
                    <button className="settings-action" onClick={() => copyText(translatorOutput)}>📋 Copy</button>
                    <button className="settings-action" onClick={speakTranslation}>🔊 Speak</button>
                    <button className="settings-action" onClick={clearTranslator}>🧹 Clear</button>
                  </div>
                </>)}
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
                    Enter to send
                  </strong>

                  <span>
                    Press Enter to send a
                    message.
                  </span>
                </div>

                <button
                  className="settings-action"
                  onClick={() =>
                    setEnterToSend(
                      (value) =>
                        !value
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
                    Theme
                  </strong>

                  <span>
                    Switch between light and
                    dark mode.
                  </span>
                </div>

                <button
                  className="settings-action"
                  onClick={() =>
                    setTheme(
                      (value) =>
                        value ===
                        "dark"
                          ? "light"
                          : "dark"
                    )
                  }
                >
                  {theme ===
                  "dark"
                    ? "Dark"
                    : "Light"}
                </button>
              </div>

              <div className="settings-item">
                <div>
                  <strong>
                    Clear current chat
                  </strong>

                  <span>
                    Delete messages from the
                    current chat.
                  </span>
                </div>

                <button
                  className="settings-action settings-danger"
                  onClick={() => {
                    clearCurrentChat();

                    setSettingsOpen(
                      false
                    );
                  }}
                >
                  Clear
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
                  ✨
                </div>

                <div>
                  <strong>
                    Astra AI
                  </strong>

                  <span>
                    Personal AI Assistant
                  </span>

                  <small>
                    React + Ollama + Tavily
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