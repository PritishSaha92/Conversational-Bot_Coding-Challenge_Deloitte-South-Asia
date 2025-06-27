import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './FlaggedEmployeeList.css';

const FlaggedEmployeeList = () => {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [modalEmployee, setModalEmployee] = useState(null);

    // Default values for fields not provided by API
    const defaultEmployeeData = {
        department: 'Not specified',
        workingHours: 40,
        rewards: 100,
        performance: 75,
        mood: 'Neutral',
        reviewed: false,
        chatbot: false,
        problems: [
            { issue: 'Pending review', summary: 'Employee needs assessment.' }
        ]
    };

    useEffect(() => {
        const fetchFlaggedEmployees = async () => {
            try {
                const token = localStorage.getItem('jwt');
                if (!token) {
                    throw new Error('Authentication token not found');
                }

                const response = await axios.get(
                    'https://opensoftbackend-ytr6.onrender.com/flagged-employees/',
                    {
                        headers: {
                            Authorization: `Bearer ${token}` // Fixed template literal syntax
                        }
                    }
                );

                // Map API data to component format
                const mappedEmployees = response.data.flagged_employees.map(emp => ({
                    id: emp.id,
                    name: emp.username,
                    company_id: emp.company_id,
                    role: emp.role,
                    is_flagged: emp.is_flagged,
                    ...defaultEmployeeData,
                    // Randomize some values for visual variety
                    department: ['Sales', 'HR', 'IT', 'Finance', 'Marketing'][Math.floor(Math.random() * 5)],
                    workingHours: 35 + Math.floor(Math.random() * 10),
                    rewards: 90 + Math.floor(Math.random() * 50),
                    performance: 65 + Math.floor(Math.random() * 30),
                    mood: ['Happy', 'Neutral', 'Sad'][Math.floor(Math.random() * 3)]
                }));

                setEmployees(mappedEmployees);
            } catch (err) {
                console.error('Error fetching flagged employees:', err);
                setError('Failed to fetch employee data. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        fetchFlaggedEmployees();
    }, []);

    const toggleReviewed = (id) => {
        setEmployees((prev) =>
            prev.map((emp) =>
                emp.id === id ? { ...emp, reviewed: !emp.reviewed } : emp
            )
        );
    };

    const openModal = (employee) => {
        setModalEmployee(employee);
    };

    const closeModal = () => {
        setModalEmployee(null);
    };

  

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow p-6 flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-white rounded-lg shadow p-6">
                <div className="text-red-500 p-4 border border-red-300 rounded">
                    {error}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-green-800 mb-4">Employee Focus Panel</h2>
            <div className="overflow-x-auto" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0">
                    <tr>
                        <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                        <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                        <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Hours</th>
                        <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Performance</th>
                        <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Rewards</th>
                        <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Mood</th>
                        <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Chatbot</th>
                        <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                    </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                    {employees.map((employee) => (
                        <tr key={employee.id} className={`hover:bg-gray-50 ${employee.reviewed ? 'bg-green-50' : ''}`}>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0 h-10 w-10">
                                        <div className="h-10 w-10 rounded-full bg-green-600 flex items-center justify-center text-white">
                                            {employee.name.charAt(0)}
                                        </div>
                                    </div>
                                    <div className="ml-4">
                                        <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                                        <div className="text-sm text-gray-500">{employee.company_id}</div>
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{employee.department}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{employee.workingHours}h</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                                        <div className="bg-green-600 h-2.5 rounded-full" style={{ width: `${employee.performance}%` }}></div>
                                    </div>
                                    <span className="ml-2 text-xs">{employee.performance}%</span>
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{employee.rewards}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                        ${employee.mood === 'Happy' ? 'bg-green-100 text-green-800' :
                                        employee.mood === 'Sad' ? 'bg-red-100 text-red-800' :
                                            'bg-yellow-100 text-yellow-800'}`}>
                                        {employee.mood}
                                    </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {employee.chatbot ? 'Yes' : 'No'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                <label className="inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={employee.reviewed}
                                        onChange={() => toggleReviewed(employee.id)}
                                    />
                                    <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                                    <span className="ms-3 text-sm font-medium text-gray-900">{employee.reviewed ? 'Reviewed' : 'Pending'}</span>
                                </label>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <button
                                    onClick={() => openModal(employee)}
                                    className="text-green-600 hover:text-green-900 underline"
                                >
                                    Details
                                </button>
                            </td>
                        </tr>
                    ))}
                 
                    </tbody>
                </table>
            </div>

            {modalEmployee && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-2xl font-bold text-green-800">Employee Details</h3>
                            <button onClick={closeModal} className="text-gray-500 hover:text-gray-700">
                                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            <div>
                                <h4 className="text-sm text-gray-500">Name</h4>
                                <p className="text-lg font-medium">{modalEmployee.name}</p>
                            </div>
                            <div>
                                <h4 className="text-sm text-gray-500">Employee ID</h4>
                                <p className="text-lg font-medium">{modalEmployee.company_id}</p>
                            </div>
                            <div>
                                <h4 className="text-sm text-gray-500">Role</h4>
                                <p className="text-lg font-medium">{modalEmployee.role}</p>
                            </div>
                            <div>
                                <h4 className="text-sm text-gray-500">Department</h4>
                                <p className="text-lg font-medium">{modalEmployee.department}</p>
                            </div>
                            <div>
                                <h4 className="text-sm text-gray-500">Working Hours</h4>
                                <p className="text-lg font-medium">{modalEmployee.workingHours} hours/week</p>
                            </div>
                            <div>
                                <h4 className="text-sm text-gray-500">Performance</h4>
                                <p className="text-lg font-medium">{modalEmployee.performance}%</p>
                            </div>
                            <div>
                                <h4 className="text-sm text-gray-500">Rewards</h4>
                                <p className="text-lg font-medium">{modalEmployee.rewards}%</p>
                            </div>
                            <div>
                                <h4 className="text-sm text-gray-500">Mood</h4>
                                <p className="text-lg font-medium">{modalEmployee.mood}</p>
                            </div>
                            <div>
                                <h4 className="text-sm text-gray-500">Chatbot Interaction</h4>
                                <p className="text-lg font-medium">{modalEmployee.chatbot ? 'Yes' : 'No'}</p>
                            </div>
                            <div>
                                <h4 className="text-sm text-gray-500">Flagged Status</h4>
                                <p className="text-lg font-medium">{modalEmployee.is_flagged ? 'Yes' : 'No'}</p>
                            </div>
                            <div>
                                <h4 className="text-sm text-gray-500">Reviewed</h4>
                                <p className="text-lg font-medium">{modalEmployee.reviewed ? 'Yes' : 'No'}</p>
                            </div>
                        </div>

                        <div className="mb-6">
                            <h4 className="font-medium text-lg text-green-800 mb-2">Recent Issues</h4>
                            {modalEmployee.problems.length > 0 ? (
                                <ul className="divide-y divide-gray-200">
                                    {modalEmployee.problems.map((problem, index) => (
                                        <li key={index} className="py-3">
                                            <h5 className="font-medium">{problem.issue}</h5>
                                            <p className="text-gray-600 text-sm">{problem.summary}</p>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-gray-500">No issues reported</p>
                            )}
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                className={`px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${
                                    modalEmployee.reviewed
                                        ? 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                                        : 'bg-green-600 hover:bg-green-700 text-white'
                                }`}
                                onClick={() => {
                                    toggleReviewed(modalEmployee.id);
                                    closeModal();
                                }}
                            >
                                {modalEmployee.reviewed ? 'Mark as Unreviewed' : 'Mark as Reviewed'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FlaggedEmployeeList;