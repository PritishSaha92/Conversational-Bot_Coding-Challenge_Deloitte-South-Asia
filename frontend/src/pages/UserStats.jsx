import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import StatsCards from '../components/StatsCards';
import UsersChart from '../components/UsersChart';
import ActivityChart from '../components/ActivityChart';
import MoodPieChart from '../components/MoodPieChart';
import Calendar from '../components/Calendar';
import TasksList from '../components/TasksList';
import Summary from '../components/Summary';

function UserStats() {
    const [user] = useState({
        name: 'Matt',
        avatar: 'https://via.placeholder.com/40'
    });
    const [events, setEvents] = useState({});
    const [selectedDate, setSelectedDate] = useState(() => {
        // Initialize with today's date in YYYY-MM-DD format
        return new Date().toISOString().split('T')[0];
    });

    const [tasks, setTasks] = useState({
        "2025-03-23": [
            {
                id: 1,
                title: 'Complete Survey',
                category: 'Research',
                time: '18:00',
                status: 'completed',
                priority: 'high'
            },
            {
                id: 2,
                title: 'Project Meeting',
                category: 'Meetings',
                time: '10:00',
                status: 'in-progress',
                priority: 'medium'
            },
            {
                id: 3,
                title: 'Submit Report',
                category: 'Documentation',
                time: '17:00',
                status: 'in-progress',
                priority: 'high'
            }
        ],
        "2025-03-31": [
            {
                id: 4,
                title: 'Code Review',
                category: 'Development',
                time: '14:00',
                status: 'incomplete',
                priority: 'medium'
            },
            {
                id: 5,
                title: 'Team Lunch',
                category: 'Social',
                time: '12:30',
                status: 'incomplete',
                priority: 'low'
            },
            {
                id: 6,
                title: 'Send Weekly Update',
                category: 'Communication',
                time: '16:00',
                status: 'incomplete',
                priority: 'high'
            }
        ],
        "2025-03-24": [
            {
                id: 7,
                title: 'Client Call',
                category: 'Meetings',
                time: '11:00',
                status: 'completed',
                priority: 'high'
            },
            {
                id: 8,
                title: 'Sprint Planning',
                category: 'Meetings',
                time: '09:00',
                status: 'in-progress',
                priority: 'medium'
            }
        ]
    });

    const [userSummary, setUserSummary] = useState({
        userName: "Matt Johnson",
        status: "warning",
        weeklyAnalysis: "Matt has shown increased stress levels during the past week, particularly during project deadlines. Sleep patterns have been irregular, and task completion rate has dropped by 15%. Mood indicators suggest mild anxiety symptoms.",
        recommendations: [
            "Schedule a one-on-one check-in to discuss workload management",
            "Suggest breaking down large projects into smaller, manageable tasks",
            "Recommend using the Pomodoro technique for better focus and breaks",
            "Consider adjusting project deadlines if possible"
        ],
        chatHistory: [
            {
                id: 1,
                sender: 'ai',
                text: 'Initial analysis shows increased stress patterns in Matt\'s work routine.',
                timestamp: '2025-03-23T10:00:00Z'
            },
            {
                id: 2,
                sender: 'admin',
                text: 'Has there been any improvement after the team meeting adjustments?',
                timestamp: '2025-03-23T10:05:00Z'
            },
            {
                id: 3,
                sender: 'ai',
                text: 'Slight improvement noted in afternoon productivity, but morning stress levels remain high.',
                timestamp: '2025-03-23T10:06:00Z'
            }
        ]
    });

    // Update events whenever tasks change
    useEffect(() => {
        const transformedEvents = {};
        Object.entries(tasks).forEach(([date, dateTasks]) => {
            transformedEvents[date] = dateTasks.map(task => ({
                type: 'task',
                title: task.title,
                time: task.time,
                priority: task.status === 'completed' ? 'low' :
                    task.status === 'in-progress' ? 'medium' : 'high'
            }));
        });
        setEvents(transformedEvents);
    }, [tasks]);

    const handleDateSelect = useCallback((date) => {
        setSelectedDate(date);
    }, []);

    const handleStatusChange = useCallback((taskId, newStatus) => {
        setTasks(prevTasks => {
            const updatedTasks = { ...prevTasks };
            Object.keys(updatedTasks).forEach(date => {
                updatedTasks[date] = updatedTasks[date]?.map(task =>
                    task.id === taskId ? { ...task, status: newStatus } : task
                );
            });
            return updatedTasks;
        });
    }, []);

    const handleAddTask = useCallback((newTask) => {
        setTasks(prevTasks => ({
            ...prevTasks,
            [selectedDate]: [...(prevTasks[selectedDate] || []), {
                id: Date.now(),
                ...newTask,
                status: 'incomplete'
            }]
        }));
    }, [selectedDate]);

    const handleDeleteTask = useCallback((taskId) => {
        setTasks(prevTasks => {
            const updatedTasks = { ...prevTasks };
            Object.keys(updatedTasks).forEach(date => {
                updatedTasks[date] = updatedTasks[date]?.filter(task => task.id !== taskId);
            });
            return updatedTasks;
        });
    }, []);

    const handleChatMessage = (updatedHistory) => {
        setUserSummary(prev => ({
            ...prev,
            chatHistory: updatedHistory
        }));
        // Here you would typically save the chat history to your backend
    };

    // Get tasks for selected date with default empty array
    const selectedTasks = tasks[selectedDate] || [];

    return (
        <div className="dashboard-container flex h-screen bg-gray-50">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Navbar user={user} />
                <main className="flex-1 overflow-y-auto p-4">
                    <div className="bg-white rounded-lg shadow p-4">
                        <Summary
                            userSummary={userSummary}
                            onSendMessage={handleChatMessage}
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <StatsCards />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
                        <div className="lg:col-span-3 flex justify-center flex-col bg-white rounded-lg shadow px-10">
                            <div className="flex justify-between items-center mb-12">
                                <div>
                                    <h2 className="text-4xl font-bold text-lime-600">Mood History</h2>
                                    <div className="flex space-x-4 text-sm">
                                    </div>
                                </div>
                            </div>
                            <UsersChart />
                        </div>
                        <div className="bg-white rounded-lg shadow p-4">
                            <div className="flex items-center justify-between mb-2">
                                <h2 className="text-4xl font-bold text-lime-600 m-4 mt-0">Calendar</h2>
                            </div>
                            <Calendar
                                events={events}
                                onDateSelect={handleDateSelect}
                                selectedDate={selectedDate}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                        <div className="bg-white rounded-lg shadow p-4">
                            <h2 className="text-lg font-medium mb-4">Activity daywise</h2>
                            <ActivityChart />
                        </div>
                        <div className="bg-white rounded-lg shadow p-4">
                            <h2 className="text-lg font-medium mb-4">Mood piechart</h2>
                            <MoodPieChart />
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-4">
                        <div className="flex items-center justify-between mb-6">
                            <div className="inline-flex items-center px-4 py-2 bg-lime-500 text-white shadow-sm rounded-lg">
                                <span className="text-lg font-semibold bg-lime-400 mr-4 px-4 rounded-xl">
                                    {new Date(selectedDate).toLocaleDateString('en-US', {
                                        weekday: 'long'
                                    })}
                                </span>
                                <span className="text-lg font-semibold">
                                    {new Date(selectedDate).toLocaleDateString('en-US', {
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </span>
                            </div>
                        </div>
                        <TasksList
                            tasks={selectedTasks}
                            onStatusChange={handleStatusChange}
                            onDeleteTask={handleDeleteTask}
                            onAddTask={handleAddTask}
                        />
                    </div>
                </main>
            </div>
        </div>
    );
}

export default UserStats;