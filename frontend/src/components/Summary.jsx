import React, { useState } from 'react';

const Summary = ({ userSummary, onSendMessage }) => {
    const [message, setMessage] = useState('');
    const [chatHistory, setChatHistory] = useState(userSummary.chatHistory || []);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!message.trim()) return;

        const newMessage = {
            id: Date.now(),
            sender: 'admin',
            text: message,
            timestamp: new Date().toISOString()
        };

        // Simulate AI response
        const aiResponse = {
            id: Date.now() + 1,
            sender: 'ai',
            text: `Thank you for your message. I'll analyze the situation and provide more insights about ${userSummary.userName}'s condition.`,
            timestamp: new Date().toISOString()
        };

        setChatHistory(prev => [...prev, newMessage, aiResponse]);
        onSendMessage([...chatHistory, newMessage, aiResponse]);
        setMessage('');
    };

    return (
        <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-[#86BC25]">User Summary</h2>
                <span className={`px-3 py-1 rounded-full text-sm ${
                    userSummary.status === 'critical' ? 'bg-red-100 text-red-800' :
                    userSummary.status === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                }`}>
                    {userSummary.status}
                </span>
            </div>

            <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-[#75787B] mb-2">Weekly Analysis</h3>
                    <p className="text-gray-700">{userSummary.weeklyAnalysis}</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-[#43B02A] mb-2">Recommended Solutions</h3>
                    <ul className="list-disc list-inside space-y-2">
                        {userSummary.recommendations.map((rec, index) => (
                            <li key={index} className="text-gray-700">{rec}</li>
                        ))}
                    </ul>
                </div>

                <div className="border rounded-lg p-4">
                    <h3 className="font-semibold text-[#75787B] mb-4 font-bold text-xl">VibeBot</h3>
                    <div className="h-48 overflow-y-auto mb-4 space-y-3">
                        {chatHistory.map((chat) => (
                            <div
                                key={chat.id}
                                className={`p-3 rounded-lg ${
                                    chat.sender === 'admin' 
                                        ? 'bg-[#86BC25] text-white ml-8' 
                                        : 'bg-gray-100 mr-8'
                                }`}
                            >
                                <p className="text-sm">{chat.text}</p>
                                <span className="text-xs opacity-75">
                                    {new Date(chat.timestamp).toLocaleTimeString()}
                                </span>
                            </div>
                        ))}
                    </div>
                    <form onSubmit={handleSubmit} className="flex gap-2">
                        <input
                            type="text"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Type your message..."
                            className="flex-1 p-2 border rounded-lg focus:outline-none focus:border-[#86BC25]"
                        />
                        <button
                            type="submit"
                            className="px-4 py-2 bg-[#86BC25] text-white rounded-lg hover:bg-[#43B02A] transition-colors"
                        >
                            Send
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Summary;