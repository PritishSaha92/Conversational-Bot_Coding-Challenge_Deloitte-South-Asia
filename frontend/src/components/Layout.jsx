// frontend/src/components/Layout.jsx
import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
// import Employee from './Employee';

function Layout({ children }) {
    const [user] = useState({
        name: localStorage.getItem('user') || 'User',
        avatar: 'https://via.placeholder.com/40'
    });

    return (
        <div className="flex h-screen bg-gray-50 ml-[65px]">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Navbar user={user} />
                <main className="flex-1 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}

export default Layout;