import React, { useState } from 'react';
import { format, addDays, subDays } from 'date-fns';

const TasksList = ({ tasks, onStatusChange, onDeleteTask, selectedDate, onDateChange }) => {
    const [filterStatus, setFilterStatus] = useState('all');

    const updateTaskStatus = (taskId, newStatus) => {
        onStatusChange(taskId, newStatus);
    };

    const deleteTask = (taskId) => {
        onDeleteTask(taskId);
    };

    const handleDateChange = (direction) => {
        const newDate = direction === 'prev' 
            ? subDays(new Date(selectedDate), 1)
            : addDays(new Date(selectedDate), 1);
        onDateChange(format(newDate, 'yyyy-MM-dd'));
    };

    const filteredTasks = tasks.filter(task => {
        if (filterStatus === 'all') return true;
        return task.status.toLowerCase() === filterStatus.toLowerCase();
    });

    return (
        <div className='p-8 pt-0'>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-3xl font-bold p-8 pl-0 pt-5 text-start">Today's Tasks</h2>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => handleDateChange('prev')}
                            className="p-1 rounded-full hover:bg-gray-100"
                        >
                            <svg className="w-5 h-5 text-[#86BC25]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <div className="text-sm text-gray-500">
                            {format(new Date(selectedDate), 'EEEE, MMMM d, yyyy')}
                        </div>
                        <button
                            onClick={() => handleDateChange('next')}
                            className="p-1 rounded-full hover:bg-gray-100"
                        >
                            <svg className="w-5 h-5 text-[#86BC25]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex space-x-2 mb-6">
                {['all', 'to do', 'in progress', 'done'].map((status) => (
                    <button
                        key={status}
                        onClick={() => setFilterStatus(status)}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors
                            ${filterStatus === status 
                                ? 'bg-[#86BC25] text-white' 
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                    </button>
                ))}
            </div>

            <div className="space-y-4">
                <div className='grid-cols-4 hidden sm:grid items-center justify-between p-4 bg-green-600 rounded-lg text-white'>
                    <p className="text-sm sm:text-base">Name</p>
                    <p className="text-sm sm:text-base">Description</p>
                    <p className="text-sm sm:text-base">Time</p>
                    <p className="text-sm sm:text-base">Status</p>
                </div>
                {filteredTasks.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        No tasks available
                    </div>
                ) : (
                    filteredTasks.map((task, index) => (
                        <div key={`${task.title}-${index}`} className="cursor-pointer grid gap-4 grid-cols-1 sm:grid-cols-4 p-4 bg-white rounded-lg border border-gray-100 shadow-md hover:shadow-lg transition">
                            <div className="flex items-start">
                                <div>
                                    <span className="text-3xl sm:text-2xl font-medium text-green-600 mr-3">{index + 1}.</span>
                                </div>
                                <div>
                                    <h3 className="text-start font-medium text-2xl sm:text-base">{task.title}</h3>
                                    <div className="text-start sm:text-sm text-gray-500 mb-1">{task.category}</div>
                                </div>
                            </div>
                            <div className='flex flex-col items-start sm:items-center justify-center'>
                                <p className='sm:text-sm text-start'>{task.description}</p>
                            </div>
                            <div className='flex flex-col items-start sm:items-center justify-center'>
                                <span className="text-xs text-gray-500 mb-1 sm:mb-3">Time: {task.time}</span>
                            </div>
                            <div className="flex flex-row justify-between sm:justify-center sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                                <div className="relative">
                                    <select
                                        value={task.status}
                                        onChange={(e) => updateTaskStatus(task.id, e.target.value)}
                                        className={`w-30 appearance-none px-4 py-2 rounded-md text-sm sm:text-sm font-medium ${task.status === 'Done' ? 'bg-green-100 text-green-800' : task.status === 'In Progress' ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'} `}
                                    >
                                        <option value="To do">To do</option>
                                        <option value="In Progress">In Progress</option>
                                        <option value="Done">Done</option>
                                    </select>
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"></path>
                                        </svg>
                                    </div>
                                </div>

                                <button
                                    onClick={() => deleteTask(task.id)}
                                    className="cursor-pointer p-1 rounded-full text-red-500 hover:bg-red-50 transition"
                                    title="Delete task"
                                >
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd"></path>
                                    </svg>
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default TasksList;