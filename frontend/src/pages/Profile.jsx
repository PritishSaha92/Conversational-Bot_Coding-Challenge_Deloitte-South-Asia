import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

function Profile() {
    const [user, setUser] = useState({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '+1 234 567 890',
        address: '123 Main Street, City, Country',
        bio: 'Frontend developer with 5 years of experience in React and modern JavaScript.',
        profilePicture: '/images/user.png'
    });

    const [isEditing, setIsEditing] = useState(false);
    const fileInputRef = useRef(null);

    useEffect(() => {
        const fetchProfile = async () => {
            const token = localStorage.getItem('jwt');
            if (!token) {
                console.error('JWT token not found');
                return;
            }

            try {
                const response = await axios.get('https://opensoft-backend.onrender.com/employee/profile/', {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                setUser(response.data.user);
            } catch (error) {
                console.error('Error fetching profile data:', error);
            }
        };

        fetchProfile();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setUser(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setUser(prev => ({
                    ...prev,
                    profile_pic: reader.result
                }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('jwt');
        if (!token) {
            console.error('JWT token not found');
            return;
        }

        try {
            await axios.put('https://opensoftbackend-ytr6.onrender.com/employee/profile/', user, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            console.log('Profile updated:', user);
            setIsEditing(false);
        } catch (error) {
            console.error('Error updating profile:', error);
        }
    };

    const triggerFileInput = () => {
        fileInputRef.current.click();
    };

    if (!user) {
        return <div>Loading...</div>;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto rounded-2xl shadow-xl overflow-hidden">
                <div className="bg-gradient-to-r from-emerald-500 to-teal-600 py-6 px-8">
                    <h1 className="text-3xl font-bold text-white text-center">Profile Management</h1>
                </div>

                <div className="p-8">
                    <div className="flex flex-col md:flex-row gap-10">
                        <div className="flex flex-col items-center space-y-6">
                            <div className="relative group">
                                <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full opacity-75 blur-sm group-hover:opacity-100 transition duration-300"></div>
                                <div className="relative">
                                    <img
                                        src={user.profile_pic}
                                        alt="Profile"
                                        className="w-48 h-48 rounded-full object-cover border-4 border-white shadow-lg"
                                    />
                                    {isEditing && (
                                        <button
                                            type="button"
                                            onClick={triggerFileInput}
                                            className="absolute bottom-2 right-2 bg-teal-600 text-white p-3 rounded-full shadow-lg hover:bg-teal-700 transition-colors duration-300"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                            </div>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                className="hidden"
                                accept="image/*"
                            />
                            <h2 className="text-2xl font-bold text-gray-800">{user.username}</h2>
                            {!isEditing && (
                                <button
                                    type="button"
                                    onClick={() => setIsEditing(true)}
                                    className="px-6 py-3 bg-teal-600 text-white rounded-lg shadow-md hover:bg-teal-700 transition-colors duration-300 hover:shadow-lg transform hover:-translate-y-0.5"
                                >
                                    Edit Profile
                                </button>
                            )}
                        </div>

                        <div className="flex-1">
                            <form onSubmit={handleSubmit} className="space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1 text-left">
                                            Username
                                        </label>
                                        <input
                                            type="text"
                                            id="username"
                                            name="username"
                                            value={user.username}
                                            onChange={handleChange}
                                            readOnly={!isEditing}
                                            className={`w-full rounded-lg shadow-sm border ${isEditing ? 'bg-white border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-teal-500' : 'bg-gray-50 border-transparent'} p-3 transition-all duration-200`}
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="email" className="text-left block text-sm font-medium text-gray-700 mb-1">
                                            Email
                                        </label>
                                        <input
                                            type="email"
                                            id="email"
                                            name="email"
                                            value={user.email}
                                            onChange={handleChange}
                                            readOnly={!isEditing}
                                            className={`w-full rounded-lg shadow-sm border ${isEditing ? 'bg-white border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-teal-500' : 'bg-gray-50 border-transparent'} p-3 transition-all duration-200`}
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="phone" className="text-left block text-sm font-medium text-gray-700 mb-1">
                                            Phone Number
                                        </label>
                                        <input
                                            type="tel"
                                            id="phone"
                                            name="phone"
                                            value={user.phone}
                                            onChange={handleChange}
                                            readOnly={!isEditing}
                                            className={`w-full rounded-lg shadow-sm border ${isEditing ? 'bg-white border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-teal-500' : 'bg-gray-50 border-transparent'} p-3 transition-all duration-200`}
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="post" className="text-left block text-sm font-medium text-gray-700 mb-1">
                                            Post
                                        </label>
                                        <input
                                            type="text"
                                            id="post"
                                            name="post"
                                            value={user.post}
                                            onChange={handleChange}
                                            readOnly={!isEditing}
                                            className={`w-full rounded-lg shadow-sm border ${isEditing ? 'bg-white border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-teal-500' : 'bg-gray-50 border-transparent'} p-3 transition-all duration-200`}
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="department" className="text-left block text-sm font-medium text-gray-700 mb-1">
                                            Department
                                        </label>
                                        <input
                                            type="text"
                                            id="department"
                                            name="department"
                                            value={user.department}
                                            onChange={handleChange}
                                            readOnly={!isEditing}
                                            className={`w-full rounded-lg shadow-sm border ${isEditing ? 'bg-white border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-teal-500' : 'bg-gray-50 border-transparent'} p-3 transition-all duration-200`}
                                        />
                                    </div>
                                </div>

                                {isEditing && (
                                    <div className="flex flex-col sm:flex-row gap-4 justify-end mt-6">
                                        <button
                                            type="button"
                                            onClick={() => setIsEditing(false)}
                                            className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg shadow-md hover:bg-gray-300 transition-colors duration-300"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="px-6 py-3 bg-teal-600 text-white rounded-lg shadow-md hover:bg-teal-700 transition-colors duration-300 hover:shadow-lg transform hover:-translate-y-0.5"
                                        >
                                            Save Changes
                                        </button>
                                    </div>
                                )}
                            </form>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto mt-8 text-center text-gray-500 text-sm">
                <p>Your profile information is secure and will only be used according to our privacy policy.</p>
            </div>
        </div>
    );
}

export default Profile;