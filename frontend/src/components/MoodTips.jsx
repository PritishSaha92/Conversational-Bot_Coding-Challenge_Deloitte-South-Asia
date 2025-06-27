import React, { useState } from 'react';
import { SmilePlus } from 'lucide-react';
import axios from 'axios';

const MoodTips = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [currentTip, setCurrentTip] = useState('');

    const moods = [
        { score: 1, emoji: '😢', label: 'Very Low' },
        { score: 2, emoji: '😔', label: 'Low' },
        { score: 3, emoji: '😐', label: 'Neutral' },
        { score: 4, emoji: '🙂', label: 'High' },
        { score: 5, emoji: '😊', label: 'Very High' }
    ];

    const handleMoodSelect = async (score) => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('accessToken');
            const response = await axios.post(
                'https://opensoft-backend.onrender.com/employee/ai-mood-tips/',
                { mood_score: score.toString() },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            const tips = response.data.tips;
            const randomTip = tips[Math.floor(Math.random() * tips.length)];
            setCurrentTip(randomTip);
        } catch (error) {
            console.error('Error fetching mood tip:', error);
            setCurrentTip('Failed to get mood tip. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <button
                onClick={() => {
                    setIsOpen(!isOpen);
                    setCurrentTip(''); // Reset tip when opening modal
                }}
                className="group flex items-center justify-center w-full h-10 rounded-lg text-gray-400 mx-0.5 bg-green-200 cursor-pointer"
            >
                <SmilePlus className="w-5 h-5 cursor-pointer text-green-600" />
            </button>

            {isOpen && (
                <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50 cursor-default">
                    <div className="bg-white rounded-lg p-6 w-96 shadow-xl">
                        <h3 className="text-lg font-semibold text-center mb-4 text-gray-800">
                            How are you feeling now?
                        </h3>
                        <div className="flex justify-around mb-6">
                            {moods.map((mood) => (
                                <button
                                    key={mood.score}
                                    onClick={() => handleMoodSelect(mood.score)}
                                    disabled={isLoading}
                                    className="text-3xl hover:scale-125 transition-transform cursor-pointer"
                                    title={mood.label}
                                >
                                    {mood.emoji}
                                </button>
                            ))}
                        </div>

                        {isLoading ? (
                            <div className="text-center text-gray-600 mb-4">
                                Getting a tip for you...
                            </div>
                        ) : currentTip && (
                            <div className="bg-green-50 p-4 rounded-lg mb-4 text-green-700">
                                {currentTip}
                            </div>
                        )}

                        <button
                            onClick={() => setIsOpen(false)}
                            className="w-full py-2 text-gray-600 bg-gray-50 hover:text-gray-800 hover:bg-gray-100 cursor-pointer rounded-lg"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

export default MoodTips;