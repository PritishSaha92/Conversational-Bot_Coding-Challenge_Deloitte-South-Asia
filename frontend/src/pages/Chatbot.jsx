import React, { useState, useEffect, useRef } from 'react';
import * as speechSDK from 'microsoft-cognitiveservices-speech-sdk';

const Chatbot = ({ roomName = 'default' }) => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isMobile, setIsMobile] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [connected, setConnected] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [isSidebarVisible, setIsSidebarVisible] = useState(false);
    const [speakingMessageId, setSpeakingMessageId] = useState(null);
    const [autoSpeak, setAutoSpeak] = useState(true); // New state for toggle

    const chatSocket = useRef(null);
    const messagesEndRef = useRef(null);
    const recognitionRef = useRef(null);
    const speechSynthRef = useRef(null);
    const streamBufferRef = useRef(''); // For buffering chatbot_stream
    const [lastSpeechTimestamp, setLastSpeechTimestamp] = useState(null);
    const silenceTimerRef = useRef(null);
    const SILENCE_THRESHOLD = 2000; // 2 seconds of silence before sending

    const username = localStorage.getItem('username') || 'User';

    // Initialize speech synthesis - keep only config in persistent ref
    useEffect(() => {
        try {
            const speechConfig = speechSDK.SpeechConfig.fromSubscription(
                "FGUfDkcGdP7IKD6h8hvMryOUTmgdYyf5ggTM1lv4VTygYdrTVVziJQQJ99BDACGhslBXJ3w3AAAYACOGCOXo",
                "centralindia"
            );

            speechConfig.speechSynthesisVoiceName = "en-IN-AartiNeural";
            speechConfig.speechSynthesisVoiceRate = 1.75; // Adjust the rate to make the voice faster

            // Store only config, not synthesizer instance
            speechSynthRef.current = { speechConfig };

            return () => {
                stopSpeaking();
            };
        } catch (error) {
            console.error("Error initializing speech config:", error);
        }
    }, []);

    const autoSpeakRef = useRef(autoSpeak);
    useEffect(() => {
        autoSpeakRef.current = autoSpeak;
    }, [autoSpeak]);


    // Improved speakText function
    const speakText = (text, messageId) => {
        if (!speechSynthRef.current?.speechConfig) return;

        // Stop any ongoing speech first
        stopSpeaking();

        try {
            const synthesizer = new speechSDK.SpeechSynthesizer(speechSynthRef.current.speechConfig);

            // Set speaking state and store the synthesizer reference
            setSpeakingMessageId(messageId);
            speechSynthRef.current.activeSynthesizer = synthesizer;

            console.log("Starting synthesis for text:", text);

            synthesizer.speakTextAsync(
                text,
                result => {
                    console.log("Speech synthesis result:", result?.reason);
                    // Instead of immediately clearing the stop state, delay it so the stop button remains visible.
                    const delay = 5000; // 5 seconds delay; adjust as needed
                    const timeoutId = setTimeout(() => {
                        try {
                            if (speechSynthRef.current.activeSynthesizer === synthesizer) {
                                synthesizer.close();
                                speechSynthRef.current.activeSynthesizer = null;
                            }
                        } catch (err) {
                            console.log("Error closing synthesizer:", err);
                        }
                        setSpeakingMessageId(null);
                    }, delay);
                    // Optionally, store the timeout ID in case you want to cancel it if the user clicks Stop manually.
                    speechSynthRef.current.stopTimeoutId = timeoutId;
                },
                error => {
                    console.error("Speech synthesis error:", error);
                    try {
                        if (speechSynthRef.current.activeSynthesizer === synthesizer) {
                            synthesizer.close();
                            speechSynthRef.current.activeSynthesizer = null;
                        }
                    } catch (err) {
                        console.log("Error closing synthesizer on error:", err);
                    }
                    setSpeakingMessageId(null);
                }
            );
        } catch (error) {
            console.error("Error creating synthesizer:", error);
            setSpeakingMessageId(null);
        }
    };

    // Improved stopSpeaking function
    const stopSpeaking = () => {
        if (speechSynthRef.current?.stopTimeoutId) {
            clearTimeout(speechSynthRef.current.stopTimeoutId);
            speechSynthRef.current.stopTimeoutId = null;
        }
        if (speechSynthRef.current?.activeSynthesizer) {
            try {
                console.log("Stopping speech synthesis");
                speechSynthRef.current.activeSynthesizer.close();
            } catch (error) {
                console.error("Error closing active synthesizer:", error);
            } finally {
                speechSynthRef.current.activeSynthesizer = null;
                setSpeakingMessageId(null);
            }
        }
    };

    // Initialize Azure speech recognition
    useEffect(() => {
        const initializeSpeechRecognition = () => {
            if (!speechSynthRef.current?.speechConfig) return;

            try {
                // Use the same speechConfig for both TTS and STT
                const audioConfig = speechSDK.AudioConfig.fromDefaultMicrophoneInput();

                // Create recognizer with language setting
                const recognizer = new speechSDK.SpeechRecognizer(
                    speechSynthRef.current.speechConfig,
                    audioConfig
                );

                // Store in ref to access later
                recognitionRef.current = {
                    recognizer,
                    isListening: false
                };

                console.log("Speech recognition initialized");
            } catch (error) {
                console.error("Error initializing speech recognition:", error);
            }
        };

        // Initialize after speechConfig is ready
        if (speechSynthRef.current?.speechConfig) {
            initializeSpeechRecognition();
        } else {
            // Wait for speech config to be ready
            const checkInterval = setInterval(() => {
                if (speechSynthRef.current?.speechConfig) {
                    initializeSpeechRecognition();
                    clearInterval(checkInterval);
                }
            }, 500);

            return () => clearInterval(checkInterval);
        }
    }, []);

    // Cleanup for speech recognition resources
    useEffect(() => {
        return () => {
            if (recognitionRef.current?.recognizer) {
                try {
                    if (recognitionRef.current.isListening) {
                        recognitionRef.current.recognizer.stopContinuousRecognitionAsync(
                            () => {
                                recognitionRef.current.recognizer.close();
                            },
                            (error) => {
                                console.error("Error closing recognizer:", error);
                            }
                        );
                    } else {
                        recognitionRef.current.recognizer.close();
                    }
                } catch (error) {
                    console.error("Error during recognizer cleanup:", error);
                }
            }
        };
    }, []);

    // Handle window resize
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Auto-scroll to most recent message
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Initialize WebSocket connection
    useEffect(() => {
        connectWebSocket();
        return () => cleanupWebSocket();
    }, [roomName]);

    // Handle browser visibility changes for connection management
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (
                document.visibilityState === 'visible' &&
                (!chatSocket.current || chatSocket.current.readyState !== WebSocket.OPEN)
            ) {
                connectWebSocket();
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, []);

    const cleanupWebSocket = () => {
        if (chatSocket.current) {
            chatSocket.current.onclose = null;
            chatSocket.current.close();
        }
    };

    const cleanText = (text) => {
        return text
            .replace(/\s+([?.!,])/g, '$1')  // remove space before punctuation
            .replace(/\s{2,}/g, ' ')        // collapse multiple spaces
            .trim();
    };

    const connectWebSocket = () => {
        cleanupWebSocket();
        const wsUrl = `wss://opensoftbackend-ytr6.onrender.com/ws/chat/${roomName}/`;
        chatSocket.current = new WebSocket(wsUrl);

        chatSocket.current.onopen = () => {
            console.log('WebSocket connected');
            setConnected(true);
            chatSocket.current.send(JSON.stringify({ type: 'connection', username }));
        };

        chatSocket.current.onclose = (event) => {
            console.log('WebSocket closed', event);
            setConnected(false);
            setIsTyping(false);
            setTimeout(connectWebSocket, 3000);
        };

        chatSocket.current.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        chatSocket.current.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log('WebSocket message received:', data);
            switch (data.type) {
                case 'connection_confirmed':
                    console.log('Previous chat messages:', data.chat_messages);
                    setMessages((prev) => {
                        const existing = new Set(prev.map(msg => `${msg.sender}-${msg.text}`));
                        const newMsgs = data.chat_messages
                            .filter(msg => msg && msg.message && cleanText(msg.message).replace(/\u200B/g, '').trim() !== '')
                            .map(msg => ({
                                text: cleanText(msg.message),
                                sender: msg.direction === 'sent' ? 'user' : 'bot',
                                date: new Date(msg.timestamp).toLocaleDateString(),
                                id: new Date(msg.timestamp).getTime()
                            }))
                            .filter(msg => !existing.has(`${msg.sender}-${msg.text}`));
                        console.log('New messages to be added:', newMsgs);
                        return [...prev, ...newMsgs];
                    });
                    break;
                case 'chatbot_stream':
                    streamBufferRef.current += data.chunk;
                    break;
                case 'chatbot_response':
                    setIsTyping(false);
                    const finalMessage = cleanText(data.message || streamBufferRef.current || '');
                    if (finalMessage && finalMessage.replace(/\u200B/g, '').trim() !== '') {
                        addMessage(finalMessage, 'bot');
                    }
                    streamBufferRef.current = '';
                    break;
                case 'connect':
                case 'disconnect':
                    // Optional: handle user join/leave
                    break;
                default:
                    break;
            }
        };
    };

    const addMessage = (text, sender) => {
        const cleaned = cleanText(text);
        if (!cleaned.trim()) return;

        const date = new Date().toLocaleDateString();
        const messageId = Date.now();

        setMessages(prev => {
            // ← three dots, not the ellipsis character!
            const newMessages = [...prev, { text: cleaned, sender, date, id: messageId }];

            // use the ref here
            if (sender === 'bot' && autoSpeakRef.current) {
                setTimeout(() => speakText(cleaned, messageId), 100);
            }

            return newMessages;
        });
    };
    const handleInputChange = (e) => setInput(e.target.value);

    const handleSendMessage = () => {
        if (input.trim() === '' || !connected) return;
        addMessage(input, 'user');
        setIsTyping(true);
        if (chatSocket.current && chatSocket.current.readyState === WebSocket.OPEN) {
            chatSocket.current.send(JSON.stringify({ type: 'chatbot_query', message: input, username }));
            setInput('');
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') handleSendMessage();
    };

    const handleVoiceInput = (transcript) => {
        if (!transcript || !transcript.trim() || !connected) return;

        setInput(transcript);
        // Immediately send the message rather than waiting for button press
        addMessage(transcript, 'user');
        setIsTyping(true);

        if (chatSocket.current && chatSocket.current.readyState === WebSocket.OPEN) {
            chatSocket.current.send(JSON.stringify({
                type: 'chatbot_query',
                message: transcript,
                username
            }));
            setInput('');
        }
    };

    const toggleSidebar = () => setIsSidebarVisible((prev) => !prev);

    // Azure speech recognition start function
    const startRecognition = () => {
        if (!recognitionRef.current?.recognizer) return;
        setInput('');
        setIsListening(true);
        setLastSpeechTimestamp(Date.now());

        try {
            recognitionRef.current.isListening = true;
            const recognizer = recognitionRef.current.recognizer;

            // Setup recognition events
            recognizer.recognized = (s, e) => {
                if (e.result.reason === speechSDK.ResultReason.RecognizedSpeech) {
                    const transcript = e.result.text;
                    if (transcript && transcript.trim()) {
                        handleVoiceInput(transcript);
                        stopRecognition();
                    }
                }
            };

            recognizer.recognizing = (s, e) => {
                // Show interim results
                if (e.result.text) {
                    setInput(e.result.text);
                    setLastSpeechTimestamp(Date.now()); // Update timestamp when speech is detected

                    // Reset silence timer whenever we hear something
                    if (silenceTimerRef.current) {
                        clearTimeout(silenceTimerRef.current);
                    }

                    // Start a new silence timer
                    silenceTimerRef.current = setTimeout(() => {
                        // If we have text and silence exceeded threshold
                        if (e.result.text.trim()) {
                            console.log("Silence detected, automatically submitting...");
                            handleVoiceInput(e.result.text);
                            stopRecognition();
                        }
                    }, SILENCE_THRESHOLD);
                }
            };

            recognizer.canceled = (s, e) => {
                if (e.reason === speechSDK.CancellationReason.Error) {
                    console.error(`Speech recognition error: ${e.errorDetails}`);
                }
                setIsListening(false);
                recognitionRef.current.isListening = false;
                clearSilenceTimer();
            };

            // Start continuous recognition
            recognizer.startContinuousRecognitionAsync();
        } catch (error) {
            console.error("Error starting recognition:", error);
            setIsListening(false);
            clearSilenceTimer();
        }
    };

    // Add a cleanup function for the silence timer
    const clearSilenceTimer = () => {
        if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = null;
        }
    };

    // Modify stopRecognition to clear the silence timer
    const stopRecognition = () => {
        clearSilenceTimer();
        if (!recognitionRef.current?.recognizer) return;

        try {
            if (recognitionRef.current.isListening) {
                recognitionRef.current.recognizer.stopContinuousRecognitionAsync(
                    () => {
                        console.log("Recognition stopped");
                        setIsListening(false);
                        recognitionRef.current.isListening = false;
                    },
                    (error) => {
                        console.error("Error stopping recognition:", error);
                        setIsListening(false);
                        recognitionRef.current.isListening = false;
                    }
                );
            }
        } catch (error) {
            console.error("Error stopping recognition:", error);
            setIsListening(false);
            recognitionRef.current.isListening = false;
        }
    };

    // Make sure to clear the silence timer in component cleanup
    useEffect(() => {
        return () => {
            clearSilenceTimer();
            // Include your existing cleanup code here
        };
    }, []);

    // First, ensure this part of your component is correct:
    const handleSpeakerClick = (message, id) => {
        if (speakingMessageId === id) {
            stopSpeaking();
        } else {
            speakText(message, id);
        }
    };

    return (
        <div className="flex flex-col w-full h-full overflow-hidden">
            {/* Professional Header with Gradient */}
            <header className="bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-4 flex justify-between items-center shadow-md">
                <div className="flex items-center">
                    {isMobile && (
                        <button
                            onClick={toggleSidebar}
                            className="mr-3 text-white hover:text-gray-200 focus:outline-none transition-colors"
                            aria-label="Toggle sidebar"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/>
                            </svg>
                        </button>
                    )}
                    <h1 className="text-white font-bold text-xl tracking-tight">HR Assistant</h1>
                </div>

                <div className="flex items-center space-x-4">
                    {/* Connection badge */}
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${connected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
      <span className={`h-2 w-2 rounded-full mr-1.5 ${connected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></span>
                        {connected ? 'Connected' : 'Reconnecting...'}
    </span>

                    {/* Auto‑Speak Toggle */}
                    <label className="flex items-center cursor-pointer">
                        <span className="text-white text-sm mr-2 select-none">Auto Speak</span>
                        <div
                            onClick={() => setAutoSpeak(v => !v)}
                            className={`w-10 h-5 flex items-center rounded-full p-1 transition-colors
          ${autoSpeak ? 'bg-emerald-400' : 'bg-gray-400'}`}
                        >
                            <div
                                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform
            ${autoSpeak ? 'translate-x-5' : 'translate-x-0'}`}
                            />
                        </div>
                    </label>
                </div>
            </header>



            <div className="flex flex-1 overflow-hidden">
                <main className="w-full flex flex-col bg-white">
                    {/* Enhanced Message Display Area */}
                    <div className="flex-1 p-5 overflow-y-auto flex flex-col space-y-4 bg-gray-50">
                        {messages.map((message, index) => (
                            <React.Fragment key={index}>
                                {(index === 0 || messages[index - 1].date !== message.date) && (
                                    <div className="flex justify-center my-3">
                                    <span className="px-3 py-1 bg-gray-200 rounded-full text-xs text-gray-600 font-medium">
                                        {message.date}
                                    </span>
                                    </div>
                                )}
                                <div className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} message-animation`}>
                                    {message.sender !== 'user' && (
                                        <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center mr-2 flex-shrink-0">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                    )}
                                    <div className={`max-w-[75%] p-4 rounded-xl shadow-sm ${message.sender === 'user' ? 'bg-emerald-600 text-white rounded-tr-none' : 'bg-white text-gray-800 rounded-tl-none border border-gray-200'}`}>
                                        <p className="text-sm md:text-base leading-relaxed">{message.text}</p>
                                        {message.sender === 'bot' && (
                                            <button
                                                onClick={() => handleSpeakerClick(message.text, message.id)}
                                                className={`mt-2 text-xs flex items-center ${speakingMessageId === message.id ? 'text-green-600' : 'text-gray-500'}`}
                                            >
                                                {speakingMessageId === message.id ? (
                                                    <span className="flex items-center speaking-animation">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                                                    </svg>
                                                    Stop
                                                </span>
                                                ) : (
                                                    <span className="flex items-center">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                                    </svg>
                                                    Play
                                                </span>
                                                )}
                                            </button>
                                        )}
                                    </div>
                                    {message.sender === 'user' && (
                                        <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center ml-2 flex-shrink-0">
                                            <span className="text-sm font-medium text-gray-600">{username.charAt(0).toUpperCase()}</span>
                                        </div>
                                    )}
                                </div>
                            </React.Fragment>
                        ))}
                        {isTyping && (
                            <div className="flex justify-start">
                                <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center mr-2 flex-shrink-0">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="max-w-[75%] p-4 rounded-xl bg-white text-gray-800 border border-gray-200 shadow-sm rounded-tl-none">
                                    <div className="flex items-center space-x-2">
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75"></div>
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></div>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef}/>
                    </div>

                    {/* Enhanced Input Area */}
                    <div className="p-4 bg-white border-t border-gray-200">
                        <div className="flex items-center bg-gray-100 rounded-lg px-4 py-2 shadow-inner">
                            <input
                                type="text"
                                value={input}
                                onChange={handleInputChange}
                                onKeyPress={handleKeyPress}
                                placeholder={connected ? "Type your message..." : "Connecting..."}
                                className="flex-1 py-2 bg-transparent border-none text-gray-800 focus:outline-none placeholder-gray-500 text-sm md:text-base"
                                disabled={!connected || isTyping}
                            />
                            <button
                                onClick={handleSendMessage}
                                className={`ml-2 ${!connected || isTyping ? 'bg-gray-400' : 'bg-emerald-600 hover:bg-emerald-700'} text-white rounded-full p-2.5 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-opacity-50 disabled:opacity-50`}
                                aria-label="Send message"
                                disabled={!connected || isTyping}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
                                </svg>
                            </button>
                            <button
                                onMouseDown={startRecognition}
                                onMouseUp={stopRecognition}
                                onTouchStart={startRecognition}
                                onTouchEnd={stopRecognition}
                                className={`ml-2 ${isListening ? 'bg-red-600' : 'bg-emerald-600 hover:bg-emerald-700'} text-white rounded-full p-2.5 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-opacity-50`}
                                aria-label="Voice input"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/>
                                </svg>
                            </button>
                        </div>
                        {isListening && (
                            <div className="mt-2 text-center">
                                <span className="text-xs text-emerald-600 font-medium animate-pulse">Listening...</span>
                            </div>
                        )}
                    </div>
                </main>
            </div>

            {/* CSS for animations */}
            <style jsx>{`
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }
            .message-animation {
                animation: fadeIn 0.3s ease-out;
            }
            @keyframes pulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.1); }
            }
            .speaking-animation {
                animation: pulse 1.5s infinite;
            }
        `}</style>
        </div>
    );
};

export default Chatbot;