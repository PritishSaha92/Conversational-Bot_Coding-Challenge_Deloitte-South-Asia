import React, { useEffect, useState } from 'react';
import useAuthStore from '../../store/authStore';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine
} from 'recharts';
import axios from 'axios';

const getLastNDays = (n) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();
    return Array.from({ length: n }, (_, i) => {
        const d = new Date();
        d.setDate(today.getDate() - (n - 1 - i));
        return days[d.getDay()];
    });
};

const UsersChart = () => {
    const [chartData, setChartData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMoodData = async () => {
            const {user, username, role, isFlagged} = useAuthStore.getState();
            const token = localStorage.getItem('jwt');
            if (!user || !user.username || !token) {
                console.error('User or token not found in localStorage');
                return;
            }

            try {
                const response = await axios.get(`https://opensoft-backend.onrender.com/employee/mood/${user.username}/`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                const moodData = response.data;

                const days = getLastNDays(moodData.length);
                const formattedData = moodData.map((data, i) => ({
                    name: days[i],
                    mood: data.vibe_score
                }));

                setChartData(formattedData);
            } catch (error) {
                console.error('Error fetching mood data:', error);
                if (error.response && error.response.status === 401) {
                    console.error('Unauthorized: Invalid or expired token');
                    await refreshToken();
                    fetchMoodData();
                }
            } finally {
                setLoading(false);
            }
        };

        const refreshToken = async () => {
            try {
                const response = await axios.post('https://opensoftbackend-ytr6.onrender.com/auth/refresh/', {
                    token: localStorage.getItem('refreshToken')
                });
                localStorage.setItem('jwt', response.data.token);
            } catch (error) {
                console.error('Error refreshing token:', error);
                // Handle re-authentication if necessary
            }
        };

        fetchMoodData();
    }, []);

    const moodLabels = {
        1: 'Very Low',
        2: 'Low',
        3: 'Neutral',
        4: 'High',
        5: 'Very High'
    };

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            const value = payload[0].value;
            return (
                <div className="bg-white p-3 border border-gray-200 shadow-lg rounded">
                    <p className="font-medium text-gray-700 mb-1">{label}</p>
                    <p className="text-sm font-semibold" style={{ color: '#046A38' }}>
                        Mood: {value ? moodLabels[value] : 'Pending'}
                    </p>
                </div>
            );
        }
        return null;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center">
            <div className="flex flex-col items-center m-5">
                <svg
                className="animate-spin h-8 w-8 text-green-500 mb-2"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                >
                <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                ></circle>
                <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                ></path>
                </svg>
                <p className="text-gray-600 text-sm">Loading data...</p>
            </div>
            </div>
        );
    }


    return (
        <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right:30, left: 5, bottom: 10 }}>
                    <CartesianGrid vertical={false} stroke="rgba(0, 0, 0, 0.06)" />
                    <XAxis
                        dataKey="name"
                        axisLine={{ stroke: '#e0e0e0' }}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: '#666' }}
                    />
                    <YAxis
                        axisLine={{ stroke: '#e0e0e0' }}
                        tickLine={false}
                        tick={{ fontSize: 11, fill: '#666' }}
                        tickFormatter={(value) => moodLabels[value] || ''}
                        domain={[1, 5]}
                        ticks={[1, 2, 3, 4, 5]}
                        width={80}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <ReferenceLine y={3} stroke="#e0e0e0" strokeDasharray="3 3" />
                    <Line
                        type="monotone"
                        dataKey="mood"
                        stroke="#046A38"
                        strokeWidth={2}
                        dot={(props) => {
                            const { cx, cy, payload } = props;
                            if (payload.mood === 0) return null;

                            return (
                                <svg x={cx - 4} y={cy - 4} width={8} height={8} fill="#046A38">
                                    <circle r={4} cx={4} cy={4} />
                                </svg>
                            );
                        }}
                        activeDot={{ r: 6, stroke: '#046A38', strokeWidth: 1, fill: '#fff' }}
                        connectNulls={true}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

export default UsersChart;