import React, { useState, useEffect, useCallback } from 'react';
import StatsCards from '../components/StatsCards';
import UsersChart from '../components/UsersChart';
import ActivityChart from '../components/ActivityChart';
import MoodPieChart from '../components/MoodPieChart';
import Calendar from '../components/Calendar';
import TasksList from '../components/TasksList';
import { taskData } from '../components/dummyData';

const UserDashboard = () => {
    const [events, setEvents] = useState({});
    const [selectedDate, setSelectedDate] = useState(() => {
        return new Date().toISOString().split('T')[0];
    });

    const statsData = {
        leaveData: 8,
        Performance: 85,
        Reward: 156
    };

    const [tasks, setTasks] = useState(taskData);

    useEffect(() => {
        const transformedEvents = {};
        Object.entries(tasks).forEach(([date, dateTasks]) => {
            const relevantTasks = Object.values(tasks).flatMap(tasks => 
                tasks.filter(task => 
                    new Date(task.startDate) <= new Date(date) && 
                    new Date(task.endDate) >= new Date(date)
                )
            );

            transformedEvents[date] = relevantTasks.map(task => ({
                type: 'task',
                title: task.title,
                time: task.time,
                priority: task.status === 'Done' ? 'low' : 'high'
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

    const handleDeleteTask = useCallback((taskId) => {
        setTasks(prevTasks => {
            const updatedTasks = { ...prevTasks };
            Object.keys(updatedTasks).forEach(date => {
                updatedTasks[date] = updatedTasks[date]?.filter(task => task.id !== taskId);
            });
            return updatedTasks;
        });
    }, []);

    const handleDateChange = (newDate) => {
        setSelectedDate(newDate);
    };

    const selectedTasks = tasks[selectedDate] || [];

    return (
        <div className='p-5'>
            <div className="w-full mb-6">
                <StatsCards
                    leaveData={statsData.leaveData}
                    Performance={statsData.Performance}
                    Reward={statsData.Reward}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
                <div className="lg:col-span-3 flex justify-center flex-col bg-white rounded-lg shadow py-">
                    <div className="flex justify-between items-center mb-12">
                        <h2 className="text-3xl font-bold pt-8 pl-8 md:pl-6">Mood History</h2>
                    </div>
                    <UsersChart />
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                    <Calendar events={events} onDateSelect={handleDateSelect} selectedDate={selectedDate} />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                <div className="bg-white rounded-lg shadow">
                    <h2 className="text-3xl font-bold p-8 text-start">Activity daywise</h2>
                    <ActivityChart />
                </div>
                <div className="bg-white rounded-lg shadow">
                    <h2 className="text-3xl font-bold p-8 text-start">Mood piechart</h2>
                    <MoodPieChart />
                </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
                <TasksList
                    tasks={selectedTasks}
                    onStatusChange={handleStatusChange}
                    onDeleteTask={handleDeleteTask}
                    selectedDate={selectedDate}
                    onDateChange={handleDateChange}
                />
            </div>
        </div>
    );
};

export default UserDashboard;