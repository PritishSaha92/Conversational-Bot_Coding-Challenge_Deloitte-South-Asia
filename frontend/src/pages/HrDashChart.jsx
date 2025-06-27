import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios'; // Import axios
import HR_Sidebar from '../components/HR_Sidebar';
import Navbar from '../components/Navbar';
import UsersChart from '../components/UsersChart';
import Calendar from '../components/Calendar';
import TasksList from '../components/TasksList';
import PerformanceBarChart from '../components/PerformanceBarChart';
import DepartmentDropdown from '../components/DepartmentDropdown';
import FlaggedEmployeeList from '../components/FlaggedEmployeeList';
import DepartmentAverageActivity from '../components/DepartmentAverageActivity';
import MoodHistoryChart from '../components/MoodHistoryChart';
import { taskData, moodHistoryData } from '../components/dummyData';

function HrDashChart() {
    const [events, setEvents] = useState({});
    const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [selectedDepartment, setSelectedDepartment] = useState('All Departments');
    const [tasks, setTasks] = useState(taskData);
    const [moodHistory, setMoodHistory] = useState(moodHistoryData);

    // Transform tasks → calendar events
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

    const handleDateSelect = useCallback(date => setSelectedDate(date), []);
    const handleDepartmentChange = useCallback(dep => setSelectedDepartment(dep), []);

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

    const handleDeleteTask = useCallback(taskId => {
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

    // Function to download the report
    const handleDownloadReport = async () => {
        const token = localStorage.getItem('jwt'); // Retrieve token from localStorage

        if (!token) {
            console.error('Authentication token not found');
            alert('You are not authenticated. Please log in again.');
            return;
        }

        try {
            const response = await axios.get('https://opensoftbackend-ytr6.onrender.com/employee/report/', {
                headers: {
                    Authorization: `Bearer ${token}`, // Add Bearer token in the headers
                },
                responseType: 'blob', // Important for downloading files
            });

            // Create a URL for the downloaded file
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'Employee_Report.pdf'); // File name
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            console.error('Error downloading report:', err.message);

            // Handle 401 Unauthorized error
            if (err.response && err.response.status === 401) {
                alert('Your session has expired. Please log in again.');
                // Optionally, redirect to the login page
                // window.location.href = '/login';
            }
        }
    };

    // Function to get mood data for selected department
    const getSelectedDepartmentMoodData = useCallback(() => {
        return moodHistoryData[selectedDepartment] || [];
    }, [selectedDepartment, moodHistoryData]);

    return (
        <div className="flex bg-gray-50 min-h-screen">
            <div className="flex-1 flex flex-col overflow-hidden">
                <main className="flex-1 overflow-y-auto px-2 py-4">
                    <div className="bg-white rounded-lg shadow p-4 mb-6">
                        <FlaggedEmployeeList />
                    </div>

                    {/* Add Report Summary Button */}
                    <div className="bg-white rounded-lg shadow p-4 mb-6 flex justify-end">
                        <button
                            onClick={handleDownloadReport}
                            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                        >
                            Download Report Summary
                        </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
                        <div className="lg:col-span-3 bg-white rounded-lg shadow p-4">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-green-800">Average Mood History</h2>
                                <DepartmentDropdown
                                    selectedDepartment={selectedDepartment}
                                    onDepartmentChange={handleDepartmentChange}
                                />
                            </div>
                            <MoodHistoryChart data={getSelectedDepartmentMoodData()} />
                        </div>

                        <div className="bg-white rounded-lg shadow p-4">
                            <Calendar
                                events={events}
                                onDateSelect={handleDateSelect}
                                selectedDate={selectedDate}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                        <div className="bg-white rounded-lg shadow p-4">
                            <h3 className="text-lg font-medium mb-2">Department Average Working Hours</h3>
                            <DepartmentAverageActivity />
                        </div>
                        <div className="bg-white rounded-lg shadow p-4">
                            <h3 className="text-lg font-medium mb-2">Performance vs Rewards (Dept.)</h3>
                            <PerformanceBarChart selectedDepartment={selectedDepartment} />
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
                </main>
            </div>
        </div>
    );
}

export default HrDashChart;
