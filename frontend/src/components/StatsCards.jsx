import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiUsers, FiTrendingUp } from 'react-icons/fi';
import { RiDoubleQuotesL, RiDoubleQuotesR } from 'react-icons/ri';
import { FaTrophy } from 'react-icons/fa';
import axios from 'axios';

const StatsCards = ({ leaveData = 0, leavesLeft = 18, Performance = 0 }) => {
    const [reward, setReward] = useState({ award_type: '', reward_points: 0 });

    useEffect(() => {
        const fetchRewardData = async () => {
            const username = localStorage.getItem('username');
            const jwt = localStorage.getItem('jwt');
            if (username && jwt) {
                try {
                    const response = await axios.get(`https://opensoftbackend-ytr6.onrender.com/employee/rewards/${username}/`, {
                        headers: {
                            Authorization: `Bearer ${jwt}`
                        }
                    });
                    if (response.data.length > 0) {
                        setReward(response.data[0]);
                    }
                } catch (error) {
                    console.error('Error fetching reward data:', error);
                }
            }
        };

        fetchRewardData();
    }, []);

    const cards = [
        {
            title: 'Leave data',
            value: leaveData || 0,
            secondValue: leavesLeft || 0,
            isLeaveCard: true,
            icon: <FiUsers className="text-xl" />,
            gradient: 'from-blue-500 to-blue-600',
            iconBg: 'bg-blue-100',
            iconColor: 'text-blue-600',
            glowColor: 'rgba(59, 130, 246, 0.5)',
        },
        {
            title: 'Performance',
            value: Performance || 0,
            icon: <FiTrendingUp className="text-xl" />,
            gradient: 'from-purple-500 to-purple-600',
            iconBg: 'bg-purple-100',
            iconColor: 'text-purple-600',
            glowColor: 'rgba(168, 85, 247, 0.5)',
        },
        {
            title: 'Reward',
            value: reward.reward_points || 0,
            icon: <FaTrophy className="text-xl" />,
            gradient: 'from-green-500 to-green-600',
            iconBg: 'bg-green-100',
            iconColor: 'text-green-600',
            glowColor: 'rgba(34, 197, 94, 0.5)',
            awardType: reward.award_type,
        },
    ];

    const motivationalQuotes = [
        "Success is not final, failure is not fatal: it's the courage to continue that counts.",
        "The only way to do great work is to love what you do.",
        "Believe you can and you're halfway there.",
    ];

    const randomQuote = motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];

    return (
        <div className="w-full flex flex-col lg:flex-row gap-6">
            <div className="flex-[3] grid grid-cols-1 md:grid-cols-3 gap-6">
                {cards.map((card, index) => (
                    <motion.div
                        key={card.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="relative group h-[120px]" // Fixed height for all cards
                    >
                        <div
                            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl blur-xl"
                            style={{
                                background: `linear-gradient(to right, ${card.glowColor}, ${card.glowColor})`,
                                filter: 'blur(20px)'
                            }}
                        />
                        <div className="relative bg-white rounded-xl shadow-lg p-4 hover:shadow-2xl transition-all duration-300 border border-gray-100 h-full">
                            <div className="flex items-center h-full">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-xl ${card.iconBg} transition-transform duration-300 group-hover:scale-110`}>
                                        {React.cloneElement(card.icon, { className: `text-xl ${card.iconColor}` })}
                                    </div>
                                    <div className="w-full">
                                        <h3 className="text-gray-600 text-xs font-semibold">{card.title}</h3>
                                        {card.isLeaveCard ? (
                                            <div className="flex items-center gap-1">
                                                <p className="text-base font-medium text-gray-600">
                                                    {card.value}
                                                </p>
                                                <span className="text-xs text-gray-500 ml-1">left</span>
                                            </div>
                                        ) : (
                                            <div>
                                                <p className="text-lg font-bold text-gray-800">
                                                    {card.value}
                                                </p>
                                                {card.title === 'Reward' && (
                                                    <p className="text-xs text-gray-500 break-words w-full">
                                                        {card.awardType}
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex-1 relative group min-w-[250px]"
            >
                <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl blur-xl"
                    style={{
                        background: 'linear-gradient(to right, rgba(34, 197, 94, 0.4), rgba(16, 124, 65, 0.4))',
                        filter: 'blur(20px)'
                    }}
                />
                <div className="relative bg-gradient-to-r from-green-600 to-emerald-800 rounded-xl shadow-lg p-6 hover:shadow-2xl transition-all duration-300 flex items-center justify-center h-full">
                    <div className="absolute top-3 left-3 text-white/20">
                        <RiDoubleQuotesL size={28} />
                    </div>
                    <div className="absolute bottom-3 right-3 text-white/20">
                        <RiDoubleQuotesR size={28} />
                    </div>
                    <p className="text-white text-lg font-medium text-center relative z-1 line-clamp-3">
                        {randomQuote}
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default StatsCards;
