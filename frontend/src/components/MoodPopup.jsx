import React, { useState } from 'react';
import './MoodPopup.css';

const MoodPopup = ({ onMoodSelect, onClose }) => {
  const [selectedMood, setSelectedMood] = useState(null);

  const moods = [
    { id: 1, emoji: '😢', label: 'Very Sad' },
    { id: 2, emoji: '😔', label: 'Sad' },
    { id: 3, emoji: '😐', label: 'Neutral' },
    { id: 4, emoji: '🙂', label: 'Okay' },
    { id: 5, emoji: '😊', label: 'Happy' },
    { id: 6, emoji: '😄', label: 'Very Happy' },
  ];

  const handleMoodSelect = (mood) => {
    setSelectedMood(mood);
  };

  const handleSubmit = () => {
    if (selectedMood) {
      onMoodSelect(selectedMood);
      onClose();
    }
  };

  return (
    <div className="mood-popup-overlay">
      <div className="mood-popup">
        <div className="mood-popup-header">
          <h3>How are you feeling today?</h3>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        <div className="mood-options">
          {moods.map((mood) => (
            <div 
              key={mood.id}
              className={`mood-option ${selectedMood?.id === mood.id ? 'selected' : ''}`}
              onClick={() => handleMoodSelect(mood)}
            >
              <div className="emoji">{mood.emoji}</div>
              <div className="label">{mood.label}</div>
            </div>
          ))}
        </div>
        <div className="mood-popup-footer">
          {selectedMood && (
            <button 
              className="submit-button"
              onClick={handleSubmit}
            >
              Submit
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MoodPopup;