import React from 'react';
import './EmployeeCard.css';

const EmployeeCard = ({ employee, onReviewChange }) => {
  // Set flag color based on vibemeter (mood)
  const flagColor =
    employee.vibemeter === 'Happy'
      ? '#52c41a'
      : employee.vibemeter === 'Excited'
      ? '#389e0d'
      : employee.vibemeter === 'Okay'
      ? '#faad14'
      : employee.vibemeter === 'Sad'
      ? '#f5222d'
      : '#cf1322'; // Frustrated

  return (
    <div className="employee-card">
      {/* Profile Section */}
      <div className="profile-section">
        <div className="profile-pic">
          <img src={employee.photo} alt={employee.name} />
        </div>
        <div className="details">
          <div className="name">{employee.name}</div>
          <div className="emp-id">ID: {employee.id}</div>
          <div className="department">{employee.department}</div>
        </div>
      </div>
      
      {/* Info Cards Grid */}
      <div className="info-cards">
        <div className="card">Rewards: {employee.rewards}</div>
        <div className="card">Working: {employee.workingHours} hrs</div>
        <div className="card">Sleep: {employee.sleepHours} hrs</div>
        <div className="card">Leaves: {employee.leavesTaken}/{employee.totalLeaves}</div>
      </div>

      {/* Additional Info */}
      <div className="additional-info">
        <div>Activity: {employee.activityTracker}</div>
        <div>Performance: {employee.performance}</div>
        <div>Onboarding: {employee.onboardingFeedback}</div>
      </div>

      {/* Mood and Icons Section */}
      <div className="mood-section">
        <div className="mood-label">Mood: {employee.vibemeter}</div>
        <div className="icons-section">
          <div className="icon flagged" style={{ backgroundColor: flagColor }}>🚩</div>
          <div className="icon talk">💬</div>
          <div 
            className="reviewed-status" 
            onClick={() => onReviewChange(employee.id, !employee.reviewed)}
            style={{ cursor: 'pointer' }}
          >
            {employee.reviewed ? (
              <span className="tick reviewed">&#10003;</span>
            ) : (
              <span className="tick not-reviewed">&#10007;</span>
            )}
          </div>
        </div>
      </div>
      
      {/* View Details */}
      <div className="view-details">View Details</div>
    </div>
  );
};

export default EmployeeCard;
