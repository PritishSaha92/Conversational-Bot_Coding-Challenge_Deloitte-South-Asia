
import { useState, useEffect, useRef } from "react";
import { FaPaperclip, FaSmile, FaImage, FaVideo, FaFileAlt } from "react-icons/fa";
import EmojiPicker from "emoji-picker-react";

export default function Interaction() {
    const [socket, setSocket] = useState(null);
    const [messages, setMessages] = useState({});
    const [input, setInput] = useState("");
    const [showAttachmentOptions, setShowAttachmentOptions] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [selectedContact, setSelectedContact] = useState(null);
    const emojiPickerRef = useRef(null);
    const attachmentRef = useRef(null);

    // Dummy contacts list
    const contacts = [
        { id: 1, name: "Employee-1", lastMessage: "Hey, how are you?" },
        { id: 2, name: "Employee-2", lastMessage: "Let's catch up soon!" },
        { id: 3, name: "Employee-3", lastMessage: "Meeting at 3 PM." },
        { id: 4, name: "Employee-4", lastMessage: "Don't forget the report." },
        { id: 5, name: "Employee-5", lastMessage: "See you tomorrow!" },
        { id: 6, name: "Employee-6", lastMessage: "Thanks for the update." },
        { id: 7, name: "Employee-7", lastMessage: "Can you send me the file?" },
    ];

    useEffect(() => {
        const ws = new WebSocket("ws://localhost:8080");
        setSocket(ws);

        ws.onmessage = (event) => {
            const message = event.data;
            if (selectedContact) {
                setMessages((prev) => ({
                    ...prev,
                    [selectedContact.id]: [...(prev[selectedContact.id] || []), { text: message, timestamp: new Date().toISOString() }],
                }));
            }
        };

     
        ws.onclose = () => console.log("Disconnected");

        return () => ws.close();
    }, [selectedContact]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
                setShowEmojiPicker(false);
            }
            if (attachmentRef.current && !attachmentRef.current.contains(event.target)) {
                setShowAttachmentOptions(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const sendMessage = () => {
        if (socket && input.trim() && selectedContact) {
            const message = `You: ${input}`;
            socket.send(message);
            setMessages((prev) => ({
                ...prev,
                [selectedContact.id]: [...(prev[selectedContact.id] || []), { text: message, timestamp: new Date().toISOString() }],
            }));
            setInput("");
        }
    };

    const sendFile = (selectedFile) => {
        if (socket && selectedFile && selectedContact) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const message = `You sent a file: ${selectedFile.name}`;
                socket.send(e.target.result);
                setMessages((prev) => ({
                    ...prev,
                    [selectedContact.id]: [...(prev[selectedContact.id] || []), { text: message, timestamp: new Date().toISOString() }],
                }));
            };
            reader.readAsDataURL(selectedFile);
        }
    };

    const onEmojiClick = (emojiObject) => {
        setInput((prev) => prev + emojiObject.emoji);
    };

    return (
        <div className="flex h-screen bg-gray-100 text-gray-800">
            {/* Contacts List */}
            <div className="w-1/4 border-r border-gray-300 bg-white flex flex-col">
                <div className="p-4 flex items-center justify-between border-b border-gray-300 bg-green-500 text-white">
                    <h2 className="text-lg font-semibold">Contacts</h2>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {contacts
                        .sort((a, b) => {
                            const lastMessageA = messages[a.id]?.[messages[a.id].length - 1]?.timestamp || null;
                            const lastMessageB = messages[b.id]?.[messages[b.id].length - 1]?.timestamp || null;

                            if (lastMessageA && lastMessageB) {
                                return new Date(lastMessageB) - new Date(lastMessageA);
                            }

                            if (lastMessageA) return -1;
                            if (lastMessageB) return 1;

                            return 0;
                        })
                        .map((contact) => {
                            const lastMessage =
                                messages[contact.id] && messages[contact.id].length > 0
                                    ? messages[contact.id][messages[contact.id].length - 1].text
                                    : contact.lastMessage;

                            return (
                                <div
                                    key={contact.id}
                                    className={`p-4 cursor-pointer ${
                                        selectedContact?.id === contact.id
                                            ? "bg-green-100 text-green-600"
                                            : "hover:bg-gray-100"
                                    }`}
                                    onClick={() => setSelectedContact(contact)}
                                >
                                    <h3 className="font-semibold">{contact.name}</h3>
                                    <p className="text-sm text-gray-600 truncate">{lastMessage}</p>
                                </div>
                            );
                        })}
                </div>
            </div>

            {/* Messaging Area */}
            <div className="flex-1 flex flex-col bg-white">
                {/* Header */}
                <div className="w-full flex items-center p-4 border-b border-gray-300 bg-green-500 text-white">
                    {selectedContact ? (
                        <>
                            <div className="w-10 h-10 bg-gray-300 rounded-full flex-shrink-0"></div>
                            <div className="ml-4 flex-1">
                                <h2 className="text-lg font-semibold">{selectedContact.name}</h2>
                                <p className="text-sm">Online</p>
                            </div>
                        </>
                    ) : (
                        <h2 className="text-lg font-semibold">Select a contact to start messaging</h2>
                    )}
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                    {selectedContact ? (
                        (messages[selectedContact.id] || []).map((msg, index) => (
                            <div
                                key={index}
                                className={`flex ${
                                    msg.text.startsWith("You:") && !msg.text.startsWith("You sent a file:")
                                        ? "justify-end"
                                        : "justify-start"
                                }`}
                            >
                                <div
                                    className={`inline-block px-4 py-2 text-sm rounded-lg mb-2 ${
                                        msg.text.startsWith("You:") && !msg.text.startsWith("You sent a file:")
                                            ? "bg-green-200 bg-opacity-70 text-gray-800 ml-auto"
                                            : "bg-gray-200 text-gray-800 mr-auto"
                                    }`}
                                    style={{
                                        maxWidth: "70%",
                                        wordWrap: "break-word",
                                    }}
                                >
                                    {msg.text.startsWith("You sent a file:") ? (
                                        <span className="font-semibold">
                                            {msg.text.replace("You sent a file: ", "File: ")}
                                        </span>
                                    ) : msg.text.startsWith("You:") ? (
                                        msg.text.replace("You: ", "")
                                    ) : (
                                        msg.text
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-center text-gray-500">
                            No contact selected. Please select a contact to start messaging.
                        </p>
                    )}
                </div>

                {/* Input Section */}
                {selectedContact && (
                    <div className="w-full flex items-center p-4 border-t border-gray-300 bg-gray-50">
                        {/* Emoji Picker */}
                        <div className="relative" ref={emojiPickerRef}>
                            <FaSmile
                                className="text-yellow-500 text-3xl mr-4 cursor-pointer hover:scale-110 transition-transform"
                                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                            />
                            {showEmojiPicker && (
                                <div className="absolute bottom-12 left-0 bg-white text-gray-900 shadow-lg rounded-lg">
                                    <EmojiPicker onEmojiClick={onEmojiClick} />
                                </div>
                            )}
                        </div>

                        {/* Attachment Icon */}
                        <div className="relative" ref={attachmentRef}>
                            <FaPaperclip
                                className="text-blue-500 text-3xl mr-4 cursor-pointer hover:scale-110 transition-transform"
                                onClick={() =>
                                    setShowAttachmentOptions(!showAttachmentOptions)
                                }
                            />
                            {showAttachmentOptions && (
                                <div className="absolute bottom-12 left-0 shadow-lg rounded-lg p-2 bg-white border border-gray-300">
                                    <label className="flex items-center gap-2 cursor-pointer p-2 hover:bg-gray-100 rounded-lg">
                                        <FaImage />
                                        <span>Picture</span>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={(e) =>
                                                sendFile(e.target.files[0])
                                            }
                                        />
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer p-2 hover:bg-gray-100 rounded-lg">
                                        <FaVideo />
                                        <span>Video</span>
                                        <input
                                            type="file"
                                            accept="video/*"
                                            className="hidden"
                                            onChange={(e) =>
                                                sendFile(e.target.files[0])
                                            }
                                        />
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer p-2 hover:bg-gray-100 rounded-lg">
                                        <FaFileAlt />
                                        <span>Document</span>
                                        <input
                                            type="file"
                                            accept=".pdf,.doc,.docx,.txt"
                                            className="hidden"
                                            onChange={(e) =>
                                                sendFile(e.target.files[0])
                                            }
                                        />
                                    </label>
                                </div>
                            )}
                        </div>

                        <input
                            className="flex-1 border border-gray-300 bg-gray-100 text-gray-800 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Type a message"
                        />
                        {input.trim() && (
                            <button
                                className="ml-4 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
                                onClick={sendMessage}
                            >
                                Send
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}