import React, { useEffect, useState } from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';
import axios from 'axios';
import useAuthStore from '../../store/authStore';

const getLastNDays = (n) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();
    return Array.from({ length: n }, (_, i) => {
        const d = new Date();
        d.setDate(today.getDate() - (n - 1 - i));
        return days[d.getDay()];
    });
};

const ActivityChart = () => {
    const [chartData, setChartData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchActivityData = async () => {
            const { user, username, role, isFlagged } = useAuthStore.getState();
            const token = localStorage.getItem('jwt');
            if (!user || !user.username || !token) {
                console.error('User or token not found in localStorage');
                return;
            }

            try {
                const response = await axios.get(`https://opensoft-backend.onrender.com/employee/activity/${user.username}/`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                const activityData = response.data;

                const days = getLastNDays(activityData.length);
                const formattedData = activityData.map((data, i) => ({
                    name: days[i],
                    value: data.work_hours,
                    color: '#046A38' // You can customize the color as needed
                }));

                setChartData(formattedData);
            } catch (error) {
                console.error('Error fetching activity data:', error);
                if (error.response && error.response.status === 401) {
                    console.error('Unauthorized: Invalid or expired token');
                    await refreshToken();
                    fetchActivityData();
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

        fetchActivityData();
    }, []);

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-3 border border-gray-200 shadow-md rounded">
                    <p className="font-medium text-gray-700">{payload[0].name}</p>
                    <p className="text-sm text-gray-600 font-semibold mt-1">
                        <span className="inline-block w-2 h-2 rounded-full mr-2" style={{ backgroundColor: payload[0].payload.color }}></span>
                        {`${payload[0].value} hours`}
                    </p>
                </div>
            );
        }
        return null;
    };

    const renderCustomBar = (props) => {
        const { x, y, width, height, index } = props;
        const color = chartData[index].color;

        return (
            <g>
                <rect
                    x={x}
                    y={y}
                    width={width}
                    height={height}
                    fill={color}
                    rx={4}
                    ry={4}
                />
            </g>
        );
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <div style={{ height: '300px', width: '100%' }}>
            <ResponsiveContainer>
                <BarChart
                    data={chartData}
                    margin={{ top: 20, right: 30, left: 0, bottom: 10 }}
                    barSize={36}
                >
                    <CartesianGrid vertical={false} stroke="rgba(0, 0, 0, 0.06)" />
                    <XAxis
                        dataKey="name"
                        axisLine={{ stroke: '#e0e0e0' }}
                        tickLine={false}
                        tick={{ fill: '#666', fontSize: 12 }}
                        padding={{ left: 10, right: 10 }}
                    />
                    <YAxis
                        axisLine={{ stroke: '#e0e0e0' }}
                        tickLine={false}
                        tick={{ fill: '#666', fontSize: 11 }}
                        tickFormatter={(value) => `${value}h`}
                        domain={[0, 10]}
                        ticks={[0, 2, 4, 6, 8, 10]}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0, 0, 0, 0.04)' }} />
                    <Bar
                        dataKey="value"
                        shape={renderCustomBar}
                    />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default ActivityChart;