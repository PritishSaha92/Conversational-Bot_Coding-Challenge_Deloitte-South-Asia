import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import { House, BotMessageSquare, MessageSquareText, List, Settings } from 'lucide-react';
import MoodTips from './MoodTips';

const Sidebar = () => {
    const [isExpanded, setIsExpanded] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const { role } = useAuthStore();

    // Navigation items with paths
    const navItems = [
        { id: 1, icon: 'dashboard', label: 'Dashboard', path: '/dashboard' },
        { id: 2, icon: 'chatbot', label: 'Chatbot', path: '/chatbot' },
        { id: 3, icon: role === 'hr' ? 'employee' : 'messaging', label: role === 'hr' ? 'Employee' : 'Message', path: role != 'hr' ? '/messaging' : '/employee' },
        { id: 4, icon: 'moodtips', label: ' '},
    ].filter(item => item.label); // Filter out items with empty labels

    const handleNavigation = (path) => {
        navigate(path);
    };

    return (
        <div
            className={`${isExpanded ? 'w-48' : 'w-16'} pt-20 bg-white shadow flex flex-col items-center py-6 transition-all duration-300 fixed top-0 left-0 z-50 h-full`}
            onMouseEnter={() => setIsExpanded(true)}
            onMouseLeave={() => setIsExpanded(false)}
        >

            {/* Navigation Icons */}
            <div className="flex-1 flex flex-col space-y-8 w-full px-3">
                {navItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => handleNavigation(item.path)}
                        className={`hover:cursor-pointer flex items-center ${isExpanded ? 'justify-start w-full px-2' : 'justify-center w-10'} h-10 rounded-lg
                            ${location.pathname === item.path ? 'bg-green-100 text-green-600' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        {item.icon === 'dashboard' && (
                            <House />
                        )}
                        {item.icon === 'chatbot' && (
                            <BotMessageSquare />
                        )}
                        {item.icon === 'messaging' && (
                            <MessageSquareText className='scale-90 mt-1' />
                        )}
                        {item.icon === 'employee' && (
                            <List className='scale-90 mt-0.5' />
                        )}
                        {item.icon === 'moodtips' && (
                            <MoodTips />
                        )}
                        {isExpanded && (
                            <span className="ml-2 font-medium text-sm whitespace-nowrap overflow-hidden transition-all duration-300 text-gray-400">
                                {item.label}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Settings icon at bottom */}
            <div className="mt-auto flex flex-col w-full px-3 mb-4">
                <button className={`hover:cursor-pointer flex items-center ${isExpanded ? 'justify-start w-full px-2' : 'justify-center w-10'} h-10 rounded-lg text-gray-400 hover:text-gray-600`}>
                    <Settings className='mt-1'/>
                    {isExpanded && <span className="ml-2 text-sm whitespace-nowrap">Settings</span>}
                </button>
            </div>
        </div>
    );
};

export default Sidebar;