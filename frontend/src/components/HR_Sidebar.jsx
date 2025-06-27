import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const HRSidebar = () => {
    const [isExpanded, setIsExpanded] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    // Navigation items for HR
    const navItems = [
        { id: 1, icon: 'dashboard', label: 'Dashboard', path: '/hr-dashboard' },
        { id: 2, icon: 'employee', label: 'Employee', path: '/employees' }, // New Employee Icon
    ];

    const handleNavigation = (path) => {
        navigate(path);
    };

    return (
        <div
            className={`${isExpanded ? 'w-48' : 'w-16'} bg-white shadow flex flex-col items-center py-6 transition-all duration-300 fixed top-0 left-0 z-50 h-full`}
            onMouseEnter={() => setIsExpanded(true)}
            onMouseLeave={() => setIsExpanded(false)}
        >
            {/* Logo at the top */}
            <div className="mb-10">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"></path>
                    </svg>
                </div>
            </div>

            {/* Navigation Icons */}
            <div className="flex-1 flex flex-col space-y-8 w-full px-3">
                {navItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => handleNavigation(item.path)}
                        className={`flex items-center ${isExpanded ? 'justify-start w-full px-2' : 'justify-center w-10'} h-10 rounded-lg
                            ${location.pathname === item.path ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        {/* Render icons dynamically */}
                        {item.icon === 'dashboard' && (
                            <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"></path>
                            </svg>
                        )}
                        {item.icon === 'employee' && (
                            <svg
                                className="w-5 h-5 flex-shrink-0"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path d="M12 2a5 5 0 100 10 5 5 0 000-10zm0 2a3 3 0 110 6 3 3 0 010-6zM4 20a1 1 0 011-1h14a1 1 0 011 1v1H4v-1zm2.5-3a5.5 5.5 0 0111 0H6.5z" />
                            </svg>
                        )}
                        {isExpanded && (
                            <span className="ml-2 font-medium text-sm whitespace-nowrap overflow-hidden transition-all duration-300">
                                {item.label}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Settings icon at bottom */}
            <div className="mt-auto flex flex-col w-full px-3 mb-4">
                <button className={`flex items-center ${isExpanded ? 'justify-start w-full px-2' : 'justify-center w-10'} h-10 rounded-lg text-gray-400 hover:text-gray-600`}>
                    <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd"></path>
                    </svg>
                    {isExpanded && <span className="ml-2 text-sm whitespace-nowrap">Settings</span>}
                </button>
            </div>
        </div>
    );
};

export default HRSidebar;