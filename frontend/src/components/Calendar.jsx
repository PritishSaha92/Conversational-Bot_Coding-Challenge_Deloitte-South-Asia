import React, { useState } from 'react';
import {
    format,
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    addDays,
    subMonths,
    addMonths,
    isSameMonth,
    getDay,
    isSameDay,
} from 'date-fns';

const Calendar = ({ events, onDateSelect, selectedDate }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [showPopup, setShowPopup] = useState(false);
    const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
    const [hoveredDate, setHoveredDate] = useState(null);

    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const startDate = addDays(monthStart, -(getDay(monthStart) || 7) + 1);
    const endDate = addDays(monthEnd, (7 - getDay(monthEnd) || 7));
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    const weekDays = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

    const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
    const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));

    const getEventsForDate = (date) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        return events[dateStr] || [];
    };

    const handleDateClick = (dayItem, event) => {
        onDateSelect(format(dayItem, 'yyyy-MM-dd'));
        const eventsForDate = getEventsForDate(dayItem);
        if (eventsForDate.length > 0) {
            const rect = event.currentTarget.getBoundingClientRect();
            setPopupPosition({
                x: rect.left + window.scrollX,
                y: rect.bottom + window.scrollY
            });
            setShowPopup(true);
        } else {
            setShowPopup(false);
        }
    };

    const handleDateHover = (dayItem) => {
        setHoveredDate(dayItem);
    };

    const handleDateLeave = () => {
        setHoveredDate(null);
    };

    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-6 pt-3">
                <h2 className="text-3xl font-bold text-black relative group cursor-default pl-6 md:pl-0">
                    {format(currentDate, 'MMMM yyyy')}
                </h2>
                <div className="flex items-center justify-center gap-1">
                    <button
                        onClick={handlePrevMonth}
                        className="hover:cursor-pointer w-10 h-10 flex items-center justify-center rounded-lg bg-[#E8F5E9] text-[#2E7D32]
                                 transform transition-all duration-200 hover:bg-[#2E7D32] hover:text-white
                                 active:scale-95 focus:outline-none group"
                        aria-label="Previous month"
                    >
                        <svg
                            className="w-4 h-4 transition-transform duration-200 transform group-hover:-translate-x-0.5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <button
                        onClick={handleNextMonth}
                        className="hover:cursor-pointer w-10 h-10 flex items-center justify-center rounded-lg bg-[#E8F5E9] text-[#2E7D32]
                                 transform transition-all duration-200 hover:bg-[#2E7D32] hover:text-white
                                 active:scale-95 focus:outline-none group"
                        aria-label="Next month"
                    >
                        <svg
                            className="w-4 h-4 transition-transform duration-200 transform group-hover:translate-x-0.5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Calendar grid */}
            <div>
                {/* Weekday headers */}
                <div className="grid grid-cols-7 mb-4">
                    {weekDays.map((day) => (
                        <div key={day} className="text-lg font-medium text-green-700 text-center">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Calendar days */}
                <div className="grid grid-cols-7 gap-2">
                    {days.map((dayItem) => {
                        const dateStr = format(dayItem, 'yyyy-MM-dd');
                        const isCurrentMonth = isSameMonth(dayItem, currentDate);
                        const isSelectedDay = dateStr === selectedDate;
                        const eventsForDate = getEventsForDate(dayItem);
                        const hasEvents = eventsForDate.length > 0;
                        const isHovered = hoveredDate && isSameDay(hoveredDate, dayItem);

                        // Check if there are any incomplete tasks
                        const hasIncompleteTasks = eventsForDate.some(event => event.priority === 'high');
                        const hasCompletedTasks = eventsForDate.some(event => event.priority === 'low');

                        return (
                            <div
                                key={dateStr}
                                onClick={(e) => handleDateClick(dayItem, e)}
                                onMouseEnter={() => handleDateHover(dayItem)}
                                onMouseLeave={handleDateLeave}
                                className={`
                                    relative aspect-square flex flex-col items-center justify-center text-xl lg:text-sm cursor-pointer
                                    rounded-xl transition-colors
                                    ${!isCurrentMonth ? 'text-[#75787B]' : 'text-[#000000]'}
                                    ${isSelectedDay ? 'bg-[#43B02A] text-white' : 'hover:bg-[#86BC25]/20'}
                                `}
                            >
                                {format(dayItem, 'd')}
                                {hasEvents && (
                                    <div className="flex gap-1 mt-1">
                                        {hasIncompleteTasks && (
                                            <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                        )}
                                        {hasCompletedTasks && (
                                            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                        )}
                                    </div>
                                )}

                                {/* Hover popup */}
                                {isHovered && hasEvents && (
                                    <div className="absolute z-100 w-64 bg-white rounded-lg shadow-lg p-4 -translate-x-1/2 left-1/2 mt-2 top-full border border-gray-200">
                                        <div className="text-sm font-semibold mb-2 text-[#046A38]">
                                            {format(dayItem, 'MMMM d, yyyy')}
                                        </div>
                                        <div className="space-y-2">
                                            {eventsForDate.map((event, idx) => (
                                                <div key={idx} className="text-sm flex items-start space-x-2">
                                                    <div className={`w-3 h-3 mt-1 rounded-full ${
                                                        event.priority === 'high' ? 'bg-red-500' : 'bg-green-500'
                                                    }`} />
                                                    <div>
                                                        <div className="font-medium text-green-600">{event.title}</div>
                                                        <div className="text-xs text-gray-500 text-start">{event.time}</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default Calendar;