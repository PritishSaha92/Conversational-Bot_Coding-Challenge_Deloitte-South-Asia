import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import axios from 'axios';

function PerformanceBarChart() {
    const [data, setData] = useState([]);

    useEffect(() => {
        // Fetch data from the backend
        axios.get('https://opensoft-backend.onrender.com/department-performance-rewards/')
            .then((response) => {
                const transformedData = response.data.map((item) => ({
                    department: item.department.split(' ')[0], // Use only the first word of the department name
                    Performance: parseFloat(item.avg_performance_activity.toFixed(2)), // Truncate to 2 decimal places
                    Rewards: parseFloat((item.total_reward_points / item.employee_count).toFixed(2)), // Truncate to 2 decimal places
                    Employees: item.employee_count, // Add employee count for tooltip
                }));
                setData(transformedData);
            })
            .catch((error) => {
                console.error('Error fetching data:', error);
            });
    }, []);

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="custom-tooltip" style={{ backgroundColor: '#fff', padding: '10px', border: '1px solid #ccc' }}>
                    <p><strong>{label}</strong></p>
                    <p>Performance: {payload[0].value}</p>
                    <p>Rewards: {payload[1].value}</p>
                    <p>Employees: {payload[0].payload.Employees}</p> {/* Show employee count */}
                </div>
            );
        }
        return null;
    };

    return (
        <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="department" tick={{ fontSize: 12 }} /> {/* Reduce font size of X-axis labels */}
                <YAxis domain={[0, 'dataMax + 50']} tickFormatter={(value) => value.toFixed(2)} /> {/* Truncate Y-axis values */}
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar
                    dataKey="Performance"
                    fill="#4bc0c0"
                    name="Average Performance"
                />
                <Bar
                    dataKey="Rewards"
                    fill="#9966ff"
                    name="Average Rewards"
                />
            </BarChart>
        </ResponsiveContainer>
    );
}

export default PerformanceBarChart;