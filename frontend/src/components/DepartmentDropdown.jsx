import React from 'react';

function DepartmentDropdown({ selectedDepartment, onDepartmentChange }) {
    const departments = ['All Departments', 'Sales', 'Finance', 'HR', 'Development', 'Management'];

    return (
        <select
            className="border rounded px-2 py-1 text-sm"
            value={selectedDepartment}
            onChange={(e) => onDepartmentChange(e.target.value)}
        >
            {departments.map((dept) => (
                <option key={dept} value={dept}>
                    {dept}
                </option>
            ))}
        </select>
    );
}

export default DepartmentDropdown;
