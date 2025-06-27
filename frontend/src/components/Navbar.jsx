import React, { useState, useRef, useEffect } from "react";
import { format, differenceInCalendarDays } from "date-fns";
import { X, Flame } from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import useAuthStore from '../../store/authStore';

const Navbar = ({ user: initialUser }) => {
    const [user, setUser] = useState(
        initialUser || {
            name: "User",
            avatar: "/images/user.png",
        }
    );
    const navigate = useNavigate();
    const { clearUser } = useAuthStore();

    const [date, setDate] = useState(format(new Date(), "MMMM, yyyy"));
    const [time, setTime] = useState(format(new Date(), "HH:mm"));
    const [streak, setStreak] = useState(1);
    const [isOpen, setIsOpen] = useState(false);
    const [isOpenProfile, setIsOpenProfile] = useState(false);
    const [notifications, setNotifications] = useState([]);

    useEffect(() => {
        const dateInterval = setInterval(() => {
            setDate(format(new Date(), "MMMM, yyyy"));
        }, 60000);

        const timeInterval = setInterval(() => {
            setTime(format(new Date(), "HH:mm"));
        }, 1000);

        return () => {
            clearInterval(dateInterval);
            clearInterval(timeInterval);
        };
    }, []);

    useEffect(() => {
        const lastLoginDate = localStorage.getItem('lastLoginDate');
        const currentDate = format(new Date(), 'yyyy-MM-dd');

        if (lastLoginDate) {
            const daysDifference = differenceInCalendarDays(new Date(currentDate), new Date(lastLoginDate));
            if (daysDifference === 1) {
                setStreak(prevStreak => prevStreak + 1);
            } else if (daysDifference > 1) {
                setStreak(0);
            }
        } else {
            setStreak(1);
        }

        localStorage.setItem('lastLoginDate', currentDate);
    }, []);

    useEffect(() => {
        const notified = localStorage.getItem('notified') === 'true';
        if (notified) {
            setNotifications([
                {
                    id: Date.now(),
                    message: "Elara wants to talk to you",
                    time: format(new Date(), 'HH:mm'),
                    date: format(new Date(), 'dd MMM yyyy'),
                    action: true
                }
            ]);
        }
    }, []);

    const notificationRef = useRef(null);
    const profileRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            if (
                notificationRef.current &&
                !notificationRef.current.contains(event.target)
            ) {
                setIsOpen(false);
            }
            if (profileRef.current && !profileRef.current.contains(event.target)) {
                setIsOpenProfile(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const removeNotification = (id) => {
        setNotifications(notifications.filter((notif) => notif.id !== id));
    };

    const handleLogout = () => {
        localStorage.removeItem("jwt");
        localStorage.removeItem('isFlagged');
        localStorage.removeItem('user');
        localStorage.removeItem('username');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('loggedInUser');
        localStorage.removeItem('role');
        clearUser();
        toast.success("Logged out successfully");
        navigate("/login");
    };

    return (
        <header className="z-10 bg-white shadow flex justify-between items-center p-4">
            <div className="text-xl font-semibold">
                <Link to='/dashboard'>
                    <img
                        src="/images/Logo/logo-transparent.png"
                        className="h-13 w-auto scale-200 ml-7"
                        alt="Logo"
                    />
                </Link>
            </div>
            <div className="flex items-center space-x-4">
                <div className="text-right hidden md:block">
                    <div className="text-[15px] font-bold">{date}</div>
                    <div className="text-[13px]">{time}</div>
                </div>

                <div className="flex items-center space-x-2 group relative">
                    <div className="flex items-center border border-transparent hover:border-green-600 rounded-md px-3 py-2 transition-all duration-300 hover:scale-101 hover:shadow-lg hover:shadow-green-200">
                        <Flame
                            size={20}
                            className={`${
                                streak <= 2
                                    ? "text-red-600"
                                    : streak <= 5
                                        ? "text-orange-500"
                                        : "text-green-600"
                            }`}
                        />
                        <span
                            className={`text-sm font-medium ml-2 ${
                                streak <= 2
                                    ? "text-red-600"
                                    : streak <= 5
                                        ? "text-orange-500"
                                        : "text-green-600"
                            }`}
                        >
                            {streak} Days
                        </span>
                    </div>
                    <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 bg-[#d1e2dcee] text-[#070808] text-sm rounded-md px-4 py-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        {streak} Days of Login Streak
                    </div>
                </div>
                <div className="flex items-center">
                    <div className="relative">
                        <button
                            onClick={() => {
                                setIsOpen(!isOpen);
                                if (isOpenProfile) setIsOpenProfile(false);
                            }}
                            className="cursor-pointer relative p-1 rounded-full text-gray-600 hover:text-gray-900 focus:outline-none"
                        >
                            <svg
                                className="h-7 w-7"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                                ></path>
                            </svg>
                            {notifications.length > 0 && (
                                <span className="absolute top-0 right-0 inline-flex items-center justify-center w-4 h-4 text-xs font-bold text-white bg-red-500 rounded-full">
                                    {notifications.length}
                                </span>
                            )}
                        </button>

                        {isOpen && (
                            <div
                                ref={notificationRef}
                                className="absolute top-12 right-0 mt-2 w-80 bg-white shadow-lg rounded-lg overflow-hidden z-20"
                            >
                                <div className="p-4 bg-gradient-to-r from-green-600 to-emerald-800 text-white font-semibold">
                                    Notifications
                                </div>
                                {notifications.length > 0 ? (
                                    <ul className="divide-y divide-gray-200">
                                        {notifications.map((notif) => (
                                            <li
                                                key={notif.id}
                                                className="p-4 flex justify-between items-center hover:bg-gray-100 cursor-pointer"
                                                onClick={() => {
                                                    navigate('/chatbot');
                                                    setIsOpen(false);
                                                }}
                                            >
                                                <div>
                                                    <p className="text-sm font-medium text-gray-800">{notif.message}</p>
                                                    <p className="text-xs text-gray-500">{notif.time} • {notif.date}</p>
                                                </div>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        removeNotification(notif.id);
                                                    }}
                                                    className="hover:cursor-pointer text-gray-400 hover:text-red-500"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="p-4 text-center text-gray-500">
                                        No notifications
                                    </p>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="relative">
                        <img
                            className="h-8 w-8 rounded-full ml-4 cursor-pointer"
                            src={"/images/user.png"}
                            alt={user.name}
                            onClick={() => {
                                setIsOpenProfile(!isOpenProfile);
                                if (isOpen) setIsOpen(false);
                            }}
                        />

                        {isOpenProfile && (
                            <div
                                ref={profileRef}
                                className="absolute top-12 right-0 mt-2 w-48 bg-white shadow-lg rounded-lg overflow-hidden z-20"
                            >
                                <ul className="divide-y divide-gray-200">
                                    <li
                                        className="p-4 hover:bg-gray-100 cursor-pointer"
                                        onClick={() => {
                                            navigate("/profile");
                                            setIsOpenProfile(false);
                                        }}
                                    >
                                        Profile
                                    </li>
                                    <li className="p-4 hover:bg-gray-100 cursor-pointer">
                                        Settings
                                    </li>
                                    <li
                                        className="p-4 hover:bg-gray-100 cursor-pointer text-red-500"
                                        onClick={handleLogout}
                                    >
                                        Logout
                                    </li>
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Navbar;