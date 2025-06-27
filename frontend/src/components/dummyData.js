// dummyData.js
const departments = ["Tech", "HR", "Finance", "Sales", "Operations"];
const vibemeterOptions = ["Frustrated", "Sad", "Okay", "Happy", "Excited"];
const activityOptions = ["Low", "Moderate", "High"];
const performanceOptions = ["Below Average", "Average", "Good", "Excellent"];
const images=["image1.jpg","image2.jpg","image3.jpg","image4.jpg","image5.jpg"]

const employees = [];

for (let i = 1; i <= 50; i++) {
  const id = "E" + String(i).padStart(3, "0");
  const employee = {
    id,
    name: "Employee " + i,
    department: departments[Math.floor(Math.random() * departments.length)],
    sleepHours: parseFloat((Math.random() * 4 + 5).toFixed(1)), // between 5 and 9 hrs
    workingHours: Math.floor(Math.random() * 4 + 8), // between 8 and 11 hrs
    leavesTaken: Math.floor(Math.random() * 7), // 0 to 6
    totalLeaves: 20,
    rewards: Math.floor(Math.random() * 5),
    lastReward: "2023-04-" + String(Math.floor(Math.random() * 30 + 1)).padStart(2, "0"),
    performance: performanceOptions[Math.floor(Math.random() * performanceOptions.length)],
    onboardingFeedback: "Feedback for employee " + i,
    activityTracker: activityOptions[Math.floor(Math.random() * activityOptions.length)],
    vibemeter: vibemeterOptions[Math.floor(Math.random() * vibemeterOptions.length)],
    flagged: Math.random() > 0.7, // ~30% flagged
    reviewed: Math.random() > 0.5, // ~50% reviewed
    photo: images[Math.floor(Math.random() * images.length)]
  };
  employees.push(employee);
}

const taskData = {
    '2025-04-05': [
        {
            id: 1,
            title: 'Design System Review',
            category: 'UI/UX Design',
            description: 'Review and update component library with new design tokens.',
            time: '09:00 AM',
            startDate: '2025-04-05',
            endDate: '2025-04-05',
            status: 'Done'
        },
        {
            id: 2,
            title: 'User Research Planning',
            category: 'Research',
            description: 'Plan upcoming user research sessions for new features.',
            time: '02:00 PM',
            startDate: '2025-04-05',
            endDate: '2025-04-06',
            status: 'In Progress'
        }
    ],
    '2025-04-06': [
        {
            id: 3,
            title: 'Stakeholder Meeting',
            category: 'Project Management',
            description: 'Present design solutions to key stakeholders.',
            time: '10:00 AM',
            startDate: '2025-04-06',
            endDate: '2025-04-06',
            status: 'Done'
        },
        {
            id: 4,
            title: 'Usability Testing',
            category: 'Research',
            description: 'Conduct usability tests with 5 participants.',
            time: '02:00 PM',
            startDate: '2025-04-06',
            endDate: '2025-04-07',
            status: 'To Do'
        }
    ],
    '2025-04-07': [
        {
            id: 5,
            title: 'Market Research',
            category: 'Grocery shopping app design',
            description: 'Conduct research to understand the market trends and user needs.',
            time: '10:00 AM',
            startDate: '2025-04-07',
            endDate: '2025-04-07',
            status: 'Done'
        },
        {
            id: 6,
            title: 'Competitive Analysis',
            category: 'Grocery shopping app design',
            description: 'Analyze competitors to identify strengths and weaknesses.',
            time: '12:00 PM',
            startDate: '2025-04-07',
            endDate: '2025-04-08',
            status: 'In Progress'
        }
    ],
    '2025-04-08': [
        {
            id: 7,
            title: 'Design Review',
            category: 'UI/UX Design',
            description: 'Review design implementations with development team.',
            time: '11:00 AM',
            startDate: '2025-04-08',
            endDate: '2025-04-08',
            status: 'To Do'
        },
        {
            id: 8,
            title: 'Sprint Planning',
            category: 'Project Management',
            description: 'Plan next sprint tasks and deliverables.',
            time: '03:00 PM',
            startDate: '2025-04-08',
            endDate: '2025-04-09',
            status: 'To Do'
        }
    ],
    '2025-04-15': [
        {
            id: 9,
            title: 'Design Workshop',
            category: 'Training',
            description: 'Conduct design thinking workshop for team.',
            time: '10:00 AM',
            startDate: '2025-04-15',
            endDate: '2025-04-15',
            status: 'Done'
        }
    ],
    '2025-04-20': [
        {
            id: 10,
            title: 'Product Demo',
            category: 'Presentation',
            description: 'Demo new features to client.',
            time: '02:00 PM',
            startDate: '2025-04-20',
            endDate: '2025-04-20',
            status: 'To Do'
        }
    ],
    '2025-04-25': [
        {
            id: 11,
            title: 'UX Audit',
            category: 'Analysis',
            description: 'Conduct UX audit of existing features.',
            time: '01:00 PM',
            startDate: '2025-04-25',
            endDate: '2025-04-26',
            status: 'In Progress'
        }
    ]
};

const moodHistoryData = {
    'All Departments': [
        { date: '2024-04-01', averageMood: 4.1 },
        { date: '2024-04-02', averageMood: 4.0 },
        { date: '2024-04-03', averageMood: 4.1 },
        { date: '2024-04-04', averageMood: 4.1 },
        { date: '2024-04-05', averageMood: 4.2 },
        { date: '2024-04-06', averageMood: 4.2 },
        { date: '2024-04-07', averageMood: 4.3 }
    ],
    'Development': [
        { date: '2024-04-01', averageMood: 4.2 },
        { date: '2024-04-02', averageMood: 3.8 },
        { date: '2024-04-03', averageMood: 4.5 },
        { date: '2024-04-04', averageMood: 4.0 },
        { date: '2024-04-05', averageMood: 3.9 },
        { date: '2024-04-06', averageMood: 4.3 },
        { date: '2024-04-07', averageMood: 4.1 }
    ],
    'Finance': [
        { date: '2024-04-01', averageMood: 3.9 },
        { date: '2024-04-02', averageMood: 4.1 },
        { date: '2024-04-03', averageMood: 3.7 },
        { date: '2024-04-04', averageMood: 4.2 },
        { date: '2024-04-05', averageMood: 4.4 },
        { date: '2024-04-06', averageMood: 4.0 },
        { date: '2024-04-07', averageMood: 4.3 }
    ],
    'Sales': [
        { date: '2024-04-01', averageMood: 4.0 },
        { date: '2024-04-02', averageMood: 4.2 },
        { date: '2024-04-03', averageMood: 3.9 },
        { date: '2024-04-04', averageMood: 3.8 },
        { date: '2024-04-05', averageMood: 4.1 },
        { date: '2024-04-06', averageMood: 4.4 },
        { date: '2024-04-07', averageMood: 4.2 }
    ],
    'HR': [
        { date: '2024-04-01', averageMood: 4.3 },
        { date: '2024-04-02', averageMood: 4.5 },
        { date: '2024-04-03', averageMood: 4.2 },
        { date: '2024-04-04', averageMood: 4.4 },
        { date: '2024-04-05', averageMood: 4.6 },
        { date: '2024-04-06', averageMood: 4.3 },
        { date: '2024-04-07', averageMood: 4.5 }
    ],
    'Management': [
        { date: '2024-04-01', averageMood: 4.1 },
        { date: '2024-04-02', averageMood: 3.5 },
        { date: '2024-04-03', averageMood: 4.2 },
        { date: '2024-04-04', averageMood: 4.1 },
        { date: '2024-04-05', averageMood: 4.9 },
        { date: '2024-04-06', averageMood: 4.3 },
        { date: '2024-04-07', averageMood: 4.5 }
    ]
};

export { employees, taskData, moodHistoryData };
