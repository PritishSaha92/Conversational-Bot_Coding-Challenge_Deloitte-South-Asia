import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';

const DepartmentAverageActivity = () => {
    const [chartData, setChartData] = useState([]);

    useEffect(() => {
        const fetchDepartmentHours = async () => {
            const token = localStorage.getItem('jwt');
            if (!token) {
                console.error('JWT token not found');
                return;
            }

            try {
                const response = await axios.get('https://opensoft-backend.onrender.com/department-hours/', {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                const formattedData = response.data.department_averages.map((item, index) => ({
                    name: item.department,
                    value: item.average_hours,
                    color: getColor(index) // Assign colors dynamically
                }));
                setChartData(formattedData);
            } catch (error) {
                console.error('Error fetching department hours data:', error);
            }
        };

        fetchDepartmentHours();
    }, []);

    // Function to assign colors dynamically
    const getColor = (index) => {
        const colors = ['#046A38', '#0A8143', '#13924C', '#1A9E54', '#27AE60', '#34C471'];
        return colors[index % colors.length];
    };

    // Enhanced tooltip
    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-3 border border-gray-200 shadow-md rounded">
                    <p className="font-medium text-gray-700">{`Department: ${payload[0].payload.name}`}</p> {/* X-axis value */}
                    <p className="text-sm text-gray-600 font-semibold mt-1">
                        <span className="inline-block w-2 h-2 rounded-full mr-2" style={{ backgroundColor: payload[0].payload.color }}></span>
                        {`Average Hours: ${payload[0].value}h`} {/* Y-axis value */}
                    </p>
                </div>
            );
        }
        return null;
    };

    // Custom bar component with rounded corners
    const renderCustomBar = (props) => {
        const { x, y, width, height, index } = props;
        const color = chartData[index]?.color;

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
                        tickFormatter={(name) => name.split(' ')[0]} // Display only the first word
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

export default DepartmentAverageActivity;
