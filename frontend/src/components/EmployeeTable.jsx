import React, { useState } from 'react';

const EmployeeTable = () => {
  const [data] = useState([
    {
      id: 1,
      name: 'John Doe',
      department: 'HR',
      problems: [
        { issue: 'Payroll issue', summary: 'Resolved payroll issue.' },
        { issue: 'Leave policy clarification', summary: 'Clarified leave policy.' }
      ],
      chatbot: true
    },
    {
      id: 2,
      name: 'Jane Smith',
      department: 'IT',
      problems: [
        { issue: 'System crash', summary: '' },
        { issue: 'Software installation', summary: '' }
      ],
      chatbot: false
    },
    {
      id: 3,
      name: 'Alice Johnson',
      department: 'Finance',
      problems: [
        { issue: 'Budget approval delay', summary: 'Explained approval process.' }
      ],
      chatbot: true
    },
    {
      id: 4,
      name: 'Bob Brown',
      department: 'Marketing',
      problems: [
        { issue: 'Campaign feedback', summary: '' },
        { issue: 'Ad performance', summary: '' }
      ],
      chatbot: false
    }
  ]);

  const [expandedRows, setExpandedRows] = useState([]);

  const toggleRow = (id) => {
    setExpandedRows((prev) =>
      prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]
    );
  };

  return (
    <div style={{ maxHeight: '500px', overflowY: 'auto', border: '1px solid #ccc' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ border: '1px solid #ccc', padding: '8px', width: '10%' }}>Employee ID</th>
            <th style={{ border: '1px solid #ccc', padding: '8px', width: '20%' }}>Employee Name</th>
            <th style={{ border: '1px solid #ccc', padding: '8px', width: '20%' }}>Department</th>
            <th style={{ border: '1px solid #ccc', padding: '8px', width: '10%' }}>Chatbot Interaction</th>
            <th style={{ border: '1px solid #ccc', padding: '8px', width: '10%' }}>Details</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <React.Fragment key={row.id}>
              <tr>
                <td style={{ border: '1px solid #ccc', padding: '8px' }}>{row.id}</td>
                <td style={{ border: '1px solid #ccc', padding: '8px' }}>{row.name}</td>
                <td style={{ border: '1px solid #ccc', padding: '8px' }}>{row.department}</td>
                <td style={{ border: '1px solid #ccc', padding: '8px' }}>
                  {row.chatbot ? 'Yes' : 'No'}
                </td>
                <td style={{ border: '1px solid #ccc', padding: '8px' }}>
                  <button onClick={() => toggleRow(row.id)}>
                    {expandedRows.includes(row.id) ? 'Hide' : 'Show'}
                  </button>
                </td>
              </tr>
              {expandedRows.includes(row.id) && (
                <tr>
                  <td colSpan="5" style={{ border: '1px solid #ccc', padding: '8px', backgroundColor: '#f9f9f9' }}>
                    <strong>Problems and Summaries:</strong>
                    <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                      {row.problems.map((problem, index) => (
                        <li key={index} style={{ marginBottom: '8px' }}>
                          <strong>Problem:</strong> {problem.issue}
                          <br />
                          <strong>Summary:</strong> {problem.summary || 'No summary available.'}
                        </li>
                      ))}
                    </ul>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default EmployeeTable;
