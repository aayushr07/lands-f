"use client";

import { useState, useEffect, useRef } from "react";
import { Mic, Send, Pause, Play, MessageSquare, X, Loader } from "lucide-react";

export default function VoiceChatbot() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [inputText, setInputText] = useState("");
  const [messages, setMessages] = useState([]);
  const [isPaused, setIsPaused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceSettings, setVoiceSettings] = useState({
    voice: null,
    rate: 1,
    pitch: 1,
    volume: 1
  });
  
  const chatBodyRef = useRef(null);
  const speechSynthesisRef = useRef(null);
  const recognitionRef = useRef(null);

  // Initialize speech synthesis
  useEffect(() => {
    speechSynthesisRef.current = window.speechSynthesis;
    
    // Load available voices
    const loadVoices = () => {
      const voices = speechSynthesisRef.current.getVoices();
      if (voices.length > 0) {
        // Default to first English voice, or first available
        const englishVoice = voices.find(voice => voice.lang.includes('en-')) || voices[0];
        setVoiceSettings(prev => ({ ...prev, voice: englishVoice }));
      }
    };

    loadVoices();
    
    // Chrome loads voices asynchronously
    if (speechSynthesisRef.current.onvoiceschanged !== undefined) {
      speechSynthesisRef.current.onvoiceschanged = loadVoices;
    }

    // Send welcome message when chat is opened for the first time
    if (isChatOpen && messages.length === 0) {
      const timer = setTimeout(() => {
        addMessage("Hello! How can I assist you today?", "bot");
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isChatOpen, messages.length]);

  // Auto-scroll to latest message
  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [messages]);

  // Clean up speech recognition and synthesis when component unmounts
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (speechSynthesisRef.current) {
        speechSynthesisRef.current.cancel();
      }
    };
  }, []);

  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
  };

  const addMessage = (text, sender) => {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages(prev => [...prev, { text, sender, timestamp }]);
    if (sender === "bot" && !isPaused) {
      speakText(text);
    }
  };

  const sendMessage = async () => {
    if (inputText.trim() === "") return;
    
    const userMessage = inputText.trim();
    addMessage(userMessage, "user");
    setInputText("");
    setLoading(true);
    
    try {
      const response = await fetch("http://127.0.0.1:5000/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: userMessage,
          conversation_history: messages.map(m => ({ role: m.sender === "user" ? "user" : "assistant", content: m.text }))
        })
      });
      
      if (!response.ok) {
        throw new Error(`Server responded with status ${response.status}`);
      }
      
      const data = await response.json();
      addMessage(data.reply || "Sorry, I couldn't process that request.", "bot");
    } catch (error) {
      console.error("Error:", error);
      addMessage("Error connecting to server. Please try again later.", "bot");
    } finally {
      setLoading(false);
    }
  };

  const speakText = (text) => {
    if (speechSynthesisRef.current && !isPaused) {
      speechSynthesisRef.current.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Apply voice settings
      if (voiceSettings.voice) {
        utterance.voice = voiceSettings.voice;
      }
      utterance.rate = voiceSettings.rate;
      utterance.pitch = voiceSettings.pitch;
      utterance.volume = voiceSettings.volume;
      
      speechSynthesisRef.current.speak(utterance);
    }
  };

  const togglePause = () => {
    const synthesis = speechSynthesisRef.current;
    if (synthesis) {
      if (isPaused) {
        synthesis.resume();
      } else {
        synthesis.pause();
      }
    }
    setIsPaused(!isPaused);
  };

  const startVoiceRecognition = () => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        // Stop existing recognition instance if it exists
        if (recognitionRef.current) {
          recognitionRef.current.stop();
        }
        
        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;
        
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-US'; // Set language
        
        recognition.onstart = () => {
          setIsListening(true);
        };
        
        recognition.onresult = (event) => {
          const transcript = event.results[0][0].transcript;
          setInputText(transcript);
        };
        
        recognition.onend = () => {
          setIsListening(false);
          // Automatically send message when speech recognition ends
          if (inputText.trim()) {
            sendMessage();
          }
        };
        
        recognition.onerror = (event) => {
          console.error("Speech recognition error", event.error);
          setIsListening(false);
          addMessage(`Speech recognition error: ${event.error}`, "bot");
        };
        
        recognition.start();
      } else {
        addMessage("Speech recognition is not supported in your browser.", "bot");
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  return (
    <div className="chat-container">
      <div className={`chat-box ${isChatOpen ? 'active' : 'hidden'}`}>
        <div className="chat-header">
          <span>Voice Assistant</span>
          <div className="header-buttons">
            <button 
              className="clear-button" 
              onClick={clearChat} 
              aria-label="Clear chat history"
              title="Clear chat history"
            >
              Clear
            </button>
            <button 
              className="close-button" 
              onClick={toggleChat}
              aria-label="Close chat"
            >
              <X size={18} />
            </button>
          </div>
        </div>
        
        <div className="chat-body" ref={chatBodyRef}>
          {messages.length === 0 ? (
            <div className="empty-chat">
              <p>Ask me anything to get started!</p>
            </div>
          ) : (
            messages.map((message, index) => (
              <div key={index} className={`message ${message.sender}`}>
                <div className="message-content">
                  {message.text}
                </div>
                <div className="message-timestamp">{message.timestamp}</div>
              </div>
            ))
          )}
          {loading && (
            <div className="message bot loading">
              <Loader className="animate-spin" size={18} />
              <span>Thinking...</span>
            </div>
          )}
        </div>
        
        <div className="chat-footer">
          <textarea
            className="chat-input"
            placeholder="Type a message..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyPress}
            disabled={loading || isListening}
            rows={1}
            aria-label="Message input"
          />
          <div className="button-group">
            <button 
              className={`voice-button ${isListening ? 'listening' : ''}`}
              onClick={startVoiceRecognition}
              disabled={loading}
              aria-label="Start voice recognition"
              title="Speak to type"
            >
              <Mic size={18} />
            </button>
            <button 
              className="pause-button"
              onClick={togglePause}
              aria-label={isPaused ? "Resume speech" : "Pause speech"}
              title={isPaused ? "Resume speech" : "Pause speech"}
            >
              {isPaused ? <Play size={18} /> : <Pause size={18} />}
            </button>
            <button 
              className="send-button"
              onClick={sendMessage}
              disabled={loading || inputText.trim() === ''}
              aria-label="Send message"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
      
      <button 
        className={`chat-toggle ${isChatOpen ? 'hidden' : ''}`} 
        onClick={toggleChat}
        aria-label="Open chat"
      >
        <MessageSquare size={24} />
      </button>
      
      <style jsx>{`
        .chat-container {
          position: fixed;
          bottom: 20px;
          right: 20px;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          z-index: 1000;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
        }
        
        .chat-box {
          width: 350px;
          height: 500px;
          background: #fff;
          color: #333;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 6px 24px rgba(0, 0, 0, 0.15);
          display: flex;
          flex-direction: column;
          transition: all 0.3s ease;
        }
        
        .chat-box.hidden {
          display: none;
        }
        
        .chat-header {
          background: #4a90e2;
          color: white;
          padding: 16px;
          font-size: 18px;
          font-weight: 600;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .header-buttons {
          display: flex;
          gap: 8px;
        }
        
        .clear-button {
          background: transparent;
          color: white;
          border: none;
          font-size: 14px;
          cursor: pointer;
          opacity: 0.8;
          padding: 4px 8px;
          border-radius: 4px;
        }
        
        .clear-button:hover {
          opacity: 1;
          background: rgba(255, 255, 255, 0.2);
        }
        
        .close-button {
          background: transparent;
          color: white;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 4px;
          border-radius: 4px;
        }
        
        .close-button:hover {
          background: rgba(255, 255, 255, 0.2);
        }
        
        .chat-body {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          scroll-behavior: smooth;
          background: #f5f7fb;
        }
        
        .empty-chat {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: #888;
          text-align: center;
        }
        
        .message {
          max-width: 80%;
          padding: 12px 16px;
          border-radius: 16px;
          word-wrap: break-word;
          position: relative;
          margin-bottom: 8px;
        }
        
        .message.user {
          align-self: flex-end;
          background-color: #4a90e2;
          color: #fff;
          border-bottom-right-radius: 4px;
        }
        
        .message.bot {
          align-self: flex-start;
          background-color: #e5e5ea;
          color: #333;
          border-bottom-left-radius: 4px;
        }
        
        .message.loading {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
        }
        
        .message-timestamp {
          font-size: 10px;
          opacity: 0.7;
          text-align: right;
          margin-top: 4px;
        }
        
        .chat-footer {
          background: #fff;
          padding: 12px;
          display: flex;
          gap: 8px;
          align-items: flex-end;
          border-top: 1px solid #e5e5ea;
        }
        
        .chat-input {
          flex: 1;
          border: 1px solid #ddd;
          border-radius: 18px;
          padding: 10px 16px;
          font-size: 14px;
          resize: none;
          max-height: 120px;
          min-height: 24px;
          outline: none;
          transition: border-color 0.2s;
        }
        
        .chat-input:focus {
          border-color: #4a90e2;
        }
        
        .button-group {
          display: flex;
          gap: 8px;
        }
        
        .voice-button, .pause-button, .send-button {
          background: #f5f5f7;
          border: none;
          border-radius: 50%;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #4a90e2;
          transition: all 0.2s;
        }
        
        .voice-button:hover, .pause-button:hover, .send-button:hover {
          background: #e5e5ea;
        }
        
        .voice-button.listening {
          background: #ff3b30;
          color: white;
          animation: pulse 1.5s infinite;
        }
        
        .send-button {
          background: #4a90e2;
          color: white;
        }
        
        .send-button:hover {
          background: #3a80d2;
        }
        
        .send-button:disabled {
          background: #e5e5ea;
          color: #a0a0a0;
          cursor: not-allowed;
        }
        
        .chat-toggle {
          background: #4a90e2;
          color: white;
          border: none;
          width: 56px;
          height: 56px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          transition: all 0.3s;
        }
        
        .chat-toggle:hover {
          background: #3a80d2;
          transform: scale(1.05);
        }
        
        .chat-toggle.hidden {
          display: none;
        }
        
        /* Animation for voice button */
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
        
        /* Make component responsive */
        @media (max-width: 480px) {
          .chat-box {
            width: calc(100vw - 40px);
            height: 60vh;
            bottom: 80px;
            right: 20px;
            position: fixed;
          }
        }
      `}</style>
    </div>
  );
}