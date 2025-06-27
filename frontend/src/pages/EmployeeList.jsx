import React, { useState, useEffect } from 'react';
import axios from 'axios';
import EmployeeCard from '../components/EmployeeCard';
import HR_Sidebar from '../components/HR_Sidebar';
import Navbar from '../components/Navbar';
import '../components/Dashboard.css';

const EmployeeList = () => {
    const [employeeData, setEmployeeData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [search, setSearch] = useState('');
    const [departmentFilter, setDepartmentFilter] = useState('');
    const [minSleep, setMinSleep] = useState('');
    const [minRewards, setMinRewards] = useState('');
    const [minWorkingHours, setMinWorkingHours] = useState('');
    const [minLeaves, setMinLeaves] = useState('');
    const [activityFilter, setActivityFilter] = useState('');
    const [moodFilter, setMoodFilter] = useState('');
    const [performanceFilter, setPerformanceFilter] = useState('');
    const [reviewedFilter, setReviewedFilter] = useState('');

    const itemsPerPage = 8;
    const [currentPage, setCurrentPage] = useState(1);

    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'https://opensoft-backend.onrender.com';
    const dashboardEndpoint = '/admin-dashboard/66/dashboard/';

    useEffect(() => {
        const fetchEmployees = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem('jwt');
                if (!token) {
                    throw new Error('Authentication token not found');
                }
                const response = await axios.get(
                    `${apiBaseUrl}${dashboardEndpoint}`,
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json',
                            'Accept': 'application/json'
                        }
                    }
                );
                if (!response.data || !response.data.employees) {
                    throw new Error('Invalid API response structure');
                }
                const enhancedEmployees = response.data.employees.map(emp => {
                    const departments = ['Tech', 'HR', 'Finance', 'Sales', 'Operations'];
                    const randomDept = departments[Math.floor(Math.random() * departments.length)];
                    const activityLevel = emp.activity && typeof emp.activity === 'string' ? emp.activity.split(' ')[0] : 'Unknown';
                    return {
                        id: emp.company_id || emp.username,
                        name: emp.username,
                        email: emp.email || 'N/A',
                        department: randomDept,
                        sleepHours: parseFloat((Math.random() * 4 + 4).toFixed(1)),
                        rewards: emp.reward_points || 0,
                        workingHours: emp.average_working_hours || 0,
                        leavesTaken: emp.leaves_taken || 0,
                        leavesLeft: 20 - (emp.leaves_taken || 0),
                        activityTracker: activityLevel,
                        vibemeter: emp.mood || 'Neutral',
                        performance: emp.performance || 'Average',
                        reviewed: Math.random() > 0.5,
                        userId: emp.id,
                        role: emp.role
                    };
                });
                setEmployeeData(enhancedEmployees);
                setError(null);
            } catch (err) {
                console.error('Error fetching employees:', err);
                setError(err.message || 'Failed to fetch employee data');
            } finally {
                setLoading(false);
            }
        };

        fetchEmployees();
    }, [apiBaseUrl, dashboardEndpoint]);

    const handleReviewChange = (id, newStatus) => {
        setEmployeeData(prev =>
            prev.map(emp =>
                emp.id === id ? { ...emp, reviewed: newStatus } : emp
            )
        );
    };

    const handleResetFilters = () => {
        setSearch('');
        setDepartmentFilter('');
        setMinSleep('');
        setMinRewards('');
        setMinWorkingHours('');
        setMinLeaves('');
        setActivityFilter('');
        setMoodFilter('');
        setPerformanceFilter('');
        setReviewedFilter('');
        setCurrentPage(1);
    };

    const updateFilter = setter => e => {
        setter(e.target.value);
        setCurrentPage(1);
    };

    const filteredEmployees = employeeData.filter(emp => {
        const searchMatch = emp.name.toLowerCase().includes(search.toLowerCase()) ||
            emp.id.toLowerCase().includes(search.toLowerCase());
        const deptMatch = departmentFilter ? emp.department === departmentFilter : true;
        const sleepMatch = minSleep ? emp.sleepHours >= parseFloat(minSleep) : true;
        const rewardsMatch = minRewards ? emp.rewards >= parseInt(minRewards, 10) : true;
        const workingHoursMatch = minWorkingHours ? emp.workingHours >= parseInt(minWorkingHours, 10) : true;
        const leavesMatch = minLeaves ? emp.leavesTaken >= parseInt(minLeaves, 10) : true;
        const activityMatch = activityFilter ? emp.activityTracker === activityFilter : true;
        const moodMatch = moodFilter ? emp.vibemeter.toLowerCase() === moodFilter.toLowerCase() : true;
        const performanceMatch = performanceFilter ? emp.performance === performanceFilter : true;
        const reviewedMatch = reviewedFilter === 'Reviewed'
            ? emp.reviewed === true
            : reviewedFilter === 'Not Reviewed'
                ? emp.reviewed === false
                : true;

        return searchMatch && deptMatch && sleepMatch && rewardsMatch &&
            workingHoursMatch && leavesMatch && activityMatch &&
            moodMatch && performanceMatch && reviewedMatch;
    });

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentEmployees = filteredEmployees.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);

    return (
        <div className="flex min-h-screen">
            {/* Sidebar (you may adjust width if you prefer a wider sidebar for EmployeeList) */}
            <div className="w-16 flex-shrink-0 bg-white shadow-md">
                <HR_Sidebar />
            </div>

            {/* Main area */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <Navbar />

                <main className="flex-1 overflow-y-auto px-4 py-4">
                    {loading && <div className="mb-4">Loading employees data...</div>}
                    {error && <div className="mb-4 text-red-500">{error}</div>}

                    <div className="mb-6 flex flex-wrap gap-2">
                        <input
                            type="text"
                            placeholder="Search by name or ID..."
                            value={search}
                            onChange={updateFilter(setSearch)}
                            className="p-2 border rounded"
                        />
                        <select
                            value={departmentFilter}
                            onChange={updateFilter(setDepartmentFilter)}
                            className="p-2 border rounded"
                        >
                            <option value="">All Departments</option>
                            <option value="Tech">Tech</option>
                            <option value="HR">HR</option>
                            <option value="Finance">Finance</option>
                            <option value="Sales">Sales</option>
                            <option value="Operations">Operations</option>
                        </select>
                        <input
                            type="number"
                            placeholder="Min Sleep Hours"
                            value={minSleep}
                            onChange={updateFilter(setMinSleep)}
                            className="p-2 border rounded"
                        />
                        <input
                            type="number"
                            placeholder="Min Rewards"
                            value={minRewards}
                            onChange={updateFilter(setMinRewards)}
                            className="p-2 border rounded"
                        />
                        <input
                            type="number"
                            placeholder="Min Working Hours"
                            value={minWorkingHours}
                            onChange={updateFilter(setMinWorkingHours)}
                            className="p-2 border rounded"
                        />
                        <input
                            type="number"
                            placeholder="Min Leaves Taken"
                            value={minLeaves}
                            onChange={updateFilter(setMinLeaves)}
                            className="p-2 border rounded"
                        />
                        <select
                            value={activityFilter}
                            onChange={updateFilter(setActivityFilter)}
                            className="p-2 border rounded"
                        >
                            <option value="">All Activity Levels</option>
                            <option value="Low">Low</option>
                            <option value="Moderate">Moderate</option>
                            <option value="High">High</option>
                            <option value="Highly">Highly</option>
                        </select>
                        <select
                            value={moodFilter}
                            onChange={updateFilter(setMoodFilter)}
                            className="p-2 border rounded"
                        >
                            <option value="">All Moods</option>
                            <option value="Neutral">Neutral</option>
                            <option value="Happy">Happy</option>
                            <option value="Angry">Angry</option>
                            <option value="Sad">Sad</option>
                            <option value="Frustrated">Frustrated</option>
                            <option value="Depressed">Depressed</option>
                        </select>
                        <select
                            value={performanceFilter}
                            onChange={updateFilter(setPerformanceFilter)}
                            className="p-2 border rounded"
                        >
                            <option value="">All Performance Levels</option>
                            <option value="Poor">Poor</option>
                            <option value="Average">Average</option>
                            <option value="Good">Good</option>
                            <option value="Excellent">Excellent</option>
                            <option value="Needs Improvement">Needs Improvement</option>
                        </select>
                        <select
                            value={reviewedFilter}
                            onChange={updateFilter(setReviewedFilter)}
                            className="p-2 border rounded"
                        >
                            <option value="">All Reviewed Status</option>
                            <option value="Reviewed">Reviewed</option>
                            <option value="Not Reviewed">Not Reviewed</option>
                        </select>
                        <button className="p-2 bg-red-500 text-white rounded" onClick={handleResetFilters}>
                            Reset Filters
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {currentEmployees.map((employee) => (
                            <EmployeeCard
                                key={employee.id}
                                employee={employee}
                                onReviewChange={handleReviewChange}
                            />
                        ))}
                    </div>

                    {!loading && filteredEmployees.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                            {Array.from({ length: totalPages }, (_, i) => (
                                <button
                                    key={i}
                                    className={`p-2 border rounded ${currentPage === i + 1 ? 'bg-blue-500 text-white' : ''}`}
                                    onClick={() => setCurrentPage(i + 1)}
                                >
                                    {i + 1}
                                </button>
                            ))}
                        </div>
                    )}

                    {!loading && filteredEmployees.length === 0 && (
                        <div className="mt-4 text-center">
                            No employees match your search criteria.
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default EmployeeList;