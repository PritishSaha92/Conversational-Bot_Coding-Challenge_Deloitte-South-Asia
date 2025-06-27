import React from 'react';
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

const MoodHistoryChart = ({ data }) => {
    const moodLabels = {
        1: 'Exhausted',
        2: 'Tired',
        3: 'Neutral',
        4: 'Energetic',
        5: 'Excited'
    };

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-3 border border-gray-200 shadow-lg rounded">
                    <p className="font-medium text-gray-700 mb-1">{label}</p>
                    <p className="text-sm font-semibold" style={{ color: '#046A38' }}>
                        Mood: {moodLabels[Math.round(payload[0].value)]} ({payload[0].value.toFixed(1)})
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 5, right: 30, left: 5, bottom: 10 }}>
                    <CartesianGrid vertical={false} stroke="rgba(0, 0, 0, 0.06)" />
                    <XAxis
                        dataKey="date"
                        axisLine={{ stroke: '#e0e0e0' }}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: '#666' }}
                    />
                    <YAxis
                        axisLine={{ stroke: '#e0e0e0' }}
                        tickLine={false}
                        tick={{ fontSize: 11, fill: '#666' }}
                        tickFormatter={(value) => moodLabels[value]}
                        domain={[1, 5]}
                        ticks={[1, 2, 3, 4, 5]}
                        width={80}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <ReferenceLine y={3} stroke="#e0e0e0" strokeDasharray="3 3" />
                    <Line
                        type="monotone"
                        dataKey="averageMood"
                        stroke="#046A38"
                        strokeWidth={2}
                        dot
                        activeDot={{ r: 6, stroke: '#046A38', strokeWidth: 1, fill: '#fff' }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

export default MoodHistoryChart;