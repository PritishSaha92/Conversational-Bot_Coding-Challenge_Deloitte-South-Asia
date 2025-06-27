import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authStore';
import { Eye, EyeOff, LoaderCircle } from 'lucide-react';

const Login = () => {
    const navigate = useNavigate();
    const setUser = useAuthStore((state) => state.setUser);
    const [showPassword, setShowPassword] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        username: '',  // Changed from email to username to match API
        password: '',
        rememberMe: false,
    });

    // Error state for validation
    const [errors, setErrors] = useState({});

    // Loading state for submission
    const [isLoading, setIsLoading] = useState(false);

    // Active index for emoji animation
    const [activeIndex, setActiveIndex] = useState(0);

    // Handle input changes
    const handleChange = (e) => {
        const { id, value, type, checked } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [id]: type === 'checkbox' ? checked : value,
        }));

        // Clear error when field is edited
        if (errors[id]) {
            setErrors((prev) => ({ ...prev, [id]: '' }));
        }
    };

    // Validate form data
    const validateForm = () => {
        const newErrors = {};

        // Username validation
        if (!formData.username) {
            newErrors.username = 'Username is required';
        }

        // Password validation
        if (!formData.password) {
            newErrors.password = 'Password is required';
        }

        return newErrors;
    };

    // Handle login
    const handleLogin = async (e) => {
        e.preventDefault();

        // Validate form
        const formErrors = validateForm();
        if (Object.keys(formErrors).length > 0) {
            setErrors(formErrors);
            return;
        }

        // Set loading state
        setIsLoading(true);

        try {
            // Call the API
            const response = await axios.post('https://opensoft-backend.onrender.com/login/', {
                username: formData.username,
                password: formData.password,
            });

            toast.success('Login successful!');

            setUser(response.data.user, response.data.is_flagged, response.data.role);

            // Store tokens in localStorage (not recommended, but for now keeping as per your code)
            localStorage.setItem('jwt', response.data.access);
            localStorage.setItem('username', response.data.user.username);
            localStorage.setItem('user', JSON.stringify(response.data.user));
            localStorage.setItem('isFlagged', response.data.is_flagged);
            localStorage.setItem('role', response.data.role);
            localStorage.setItem('notified', response.data.notified);
            const currentDate = new Date().toISOString().split('T')[0];
            localStorage.setItem('lastLoginDate', currentDate);

            setTimeout(() => {
                navigate('/dashboard', { replace: true });
            }, 500);  // Small delay to prevent race conditions

        } catch (error) {
            console.error('Login failed:', error);
            setErrors({
                general: error.response?.data?.detail || 'Authentication failed. Please check your credentials.'
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Emoji rotation effect
    useEffect(() => {
        const interval = setInterval(() => {
            setActiveIndex((prev) => {
                let nextIndex;
                do {
                    nextIndex = Math.floor(Math.random() * 9);
                } while (nextIndex === prev);
                return nextIndex;
            });
        }, 2000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="min-h-screen flex">
            {/* Left side - Login Form */}
            <div className="flex-1 flex flex-col justify-start items-center bg-white p-8">
                <div>
                    <img src="/images/Logo/logo-transparent.png" className="h-50 w-auto" alt="Elara Logo" />
                </div>
                <h1 className="text-4xl font-bold text-green-600 mb-4 text-center">Login</h1>
                <h2 className="text-xl text-gray-700 mb-6 text-center">
                    Your AI-Powered Employee Companion
                </h2>

                {/* Show general errors */}
                {errors.general && (
                    <div className="mb-4 w-full max-w-sm bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                        {errors.general}
                    </div>
                )}

                <form className="w-full max-w-sm" onSubmit={handleLogin}>
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="username">
                            Username
                        </label>
                        <input
                            className={`shadow appearance-none border ${errors.username ? 'border-red-500' : ''} 
                            rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
                            id="username"
                            type="text"
                            placeholder="Username"
                            value={formData.username}
                            onChange={handleChange}
                        />
                        {errors.username && <p className="text-red-500 text-xs italic mt-1">{errors.username}</p>}
                    </div>
                    <div className="mb-6 relative">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
                            Password
                        </label>
                        <input
                            className={`shadow appearance-none border ${errors.password ? 'border-red-500' : ''} 
                            rounded w-full py-2 px-3 text-gray-700 mb-1 leading-tight focus:outline-none focus:shadow-outline`}
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Your Password"
                            value={formData.password}
                            onChange={handleChange}
                        />
                        <div
                            className="absolute inset-y-0 right-3 top-6 flex items-center cursor-pointer"
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? <Eye className='opacity-70 scale-80' /> : <EyeOff className='opacity-70 scale-80' />}
                        </div>
                        {errors.password && <p className="text-red-500 text-xs italic">{errors.password}</p>}
                    </div>
                    <div className="mb-4 flex justify-between items-center">
                        <label className="hidden text-gray-700 text-sm font-bold">
                            <input
                                className="mr-2 leading-tight"
                                id="rememberMe"
                                type="checkbox"
                                checked={formData.rememberMe}
                                onChange={handleChange}
                            />
                            <span className="text-sm">Remember Me</span>
                        </label>
                        <a href="#" className="text-green-600 hover:text-green-800 text-sm font-bold" onClick={() => toast('Please check your email for password reset instructions!')}>
                            Forgot Password?
                        </a>
                    </div>
                    <div className="flex items-center justify-center">
                        <button
                            className={`hover:cursor-pointer bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                            type="submit"
                            disabled={isLoading}
                        >
                            {isLoading ? <LoaderCircle className='m-auto animate-spin'/> : 'Login'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Right side - Hero Section */}
            <div className="hidden sm:flex flex-1 flex-col justify-center items-center bg-green-600 text-white p-10">
                <h1 className="text-4xl font-bold mb-4">Welcome to Elara</h1>
                <p className="mb-6 text-center max-w-[500px]">
                    Your well-being matters. Elara helps create a happier, more engaged workplace by
                    understanding what truly drives employee experience.
                </p>
                <div className="grid grid-cols-3 gap-4">
                    {Array.from({ length: 9 }).map((_, index) => (
                        <div
                            key={index}
                            className="lg:w-25 lg:h-25 w-20 h-20 bg-white rounded-lg flex items-center justify-center transition-transform duration-700"
                            style={{
                                transform: index === activeIndex ? `rotateY(180deg)` : `rotateY(0deg)`,
                                transformStyle: "preserve-3d",
                            }}
                        >
                            <div className="absolute w-full h-full flex items-center justify-center backface-hidden">
                                {index !== activeIndex && <span className="text-white"></span>}
                            </div>

                            <div
                                className="absolute w-full h-full flex items-center justify-center backface-hidden"
                                style={{ transform: "rotateY(180deg)" }}
                            >
                                {index === activeIndex && (
                                    <span className="lg:text-5xl text-4xl">
                                        <img className='h-12 lg:h-15' src=
                                            {['/images/Moods/self-confidence.png', '/images/Moods/sad.png', '/images/Moods/anger.png', '/images/Moods/laugh.png', '/images/Moods/overwhelmed.png', '/images/Moods/inspired.png', '/images/Moods/fatigue.png', '/images/Moods/confused.png', '/images/Moods/confident.png'][index]} alt="Mood"/>
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
                <div className='flex mt-8 min-h-22'>
                    <h1 className="text-xl text-center max-w-[500px]">
                        {["Feeling good? Let's make today even better!",
                            "Feeling down? I'm here to help. Let's talk.",
                            "Frustrated? Let's figure out why and find a solution.",
                            "Having fun? Keep spreading the good vibes!",
                            "Overwhelmed? Take a deep breath. We've got this!",
                            "Feeling inspired? Let's turn that passion into action!",
                            "Tired? Maybe it's time for a break. Recharge and come back stronger!",
                            "Confused? Let's clear things up together. Ask me anything!",
                            "Feeling confident? That's the spirit! Go own the day!"
                        ][activeIndex]}
                    </h1>
                </div>
            </div>
        </div>
    );
};

export default Login;