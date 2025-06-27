import React from 'react';
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer
} from 'recharts';

const MoodPieChart = () => {
    const chartData = [
        { name: 'Happy', value: 52.1, color: '#E49B0F' },
        { name: 'Sad', value: 22.8, color: '#2563EB' },
        { name: 'Other1', value: 13.9, color: '#046A38' },
        { name: 'Other2', value: 11.2, color: '#D97706' },
        { name: 'Other3', value: 0, color: '#B91C1C' },
    ];

    const legendItems = [
        { label: 'Happy', value: '52.1%', color: '#E49B0F' },
        { label: 'Sad', value: '22.8%', color: '#2563EB' },
        { label: 'other1', value: '13.9%', color: '#046A38' },
        { label: 'other 2', value: '11.2%', color: '#D97706' },
        { label: 'other 3 if exists', value: '0%', color: '#B91C1C' },
    ];

    return (
        <div className="flex flex-col md:flex-row items-center bg-white rounded-lg p-6 md:p-8 md:pt-0">
            <div className="w-full md:w-1/2" style={{ height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius="60%"
                            outerRadius="90%"
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {chartData.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={entry.color}
                                    stroke="#ffffff"
                                    strokeWidth={2}
                                />
                            ))}
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>
            </div>
            <div className="w-full md:w-1/2 mt-6 md:mt-0 flex flex-col justify-center">
                <ul className="space-y-4">
                    {legendItems.map((item, index) => (
                        <li key={index} className="flex items-center justify-between">
                            <div className="flex items-center">
                                <span
                                    className="h-5 w-5 rounded-full mr-4 border border-gray-300"
                                    style={{ backgroundColor: item.color }}
                                ></span>
                                <span className="text-sm font-semibold text-gray-700">{item.label}</span>
                            </div>
                            <span className="text-sm font-bold text-gray-800">{item.value}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default MoodPieChart;