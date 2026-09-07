/**
 * State Management & Persistent Storage Module
 * Manages demo student data, demo events, credentials, and localStorage synchronization.
 */

export const INITIAL_STUDENTS = [
    {
        id: "STU001",
        firstName: "Arjun",
        lastName: "Singh",
        name: "Arjun Singh",
        email: "arjun@gmail.com",
        password: "Arjun@4321",
        phone: "9876543211",
        dob: "2002-05-15",
        gender: "Male",
        course: "Computer Science & Engineering",
        yearSem: "Year 3 / Sem 5",
        bowCategory: "Recurve Bow",
        bowType: "Own Bow",
        experience: "Intermediate (2 Years)",
        place: "North Campus",
        address: "12 Park Street, North Wing",
        attendanceRate: 94,
        attendanceStats: { present: 47, absent: 3, late: 2 },
        overallScore: 92,
        grade: "A+",
        practiceAvg: "9.2 / 10",
        examScore: "338 / 360",
        rank: 1,
        progressSummary: "Exceptional form stability and high release accuracy over recent ends.",
        skills: {
            "Form & Posture": 95,
            "Aim & Anchor": 90,
            "Release Technique": 92,
            "Mental Focus": 88,
            "Physical Stamina": 94
        },
        scoresByEvaluation: [
            { date: "Aug 10", score: 285, avg: 8.5 },
            { date: "Aug 18", score: 312, avg: 8.7 },
            { date: "Aug 25", score: 338, avg: 9.4 },
            { date: "Sep 02", score: 330, avg: 9.2 }
        ],
        attendanceRecords: [
            { date: "2026-09-05", status: "Present", remarks: "Full session - Recurve 50m practice" },
            { date: "2026-09-03", status: "Present", remarks: "Indoor 18m scoring round" },
            { date: "2026-09-01", status: "Late", remarks: "Arrived 10 mins late - Equipment setup" },
            { date: "2026-08-28", status: "Present", remarks: "Mock tournament round" },
            { date: "2026-08-25", status: "Absent", remarks: "Medical leave approved" }
        ]
    },
    {
        id: "STU002",
        firstName: "Joseph",
        lastName: "Thomas",
        name: "Joseph Thomas",
        email: "joseph@gmail.com",
        password: "Joseph@4321",
        phone: "9876543222",
        dob: "2003-08-12",
        gender: "Male",
        course: "Physical Education",
        yearSem: "Year 2 / Sem 3",
        bowCategory: "Compound Bow",
        bowType: "Academy Bow",
        experience: "Beginner (1 Year)",
        place: "South Wing",
        address: "88 Lake View Road",
        attendanceRate: 88,
        attendanceStats: { present: 44, absent: 6, late: 3 },
        overallScore: 85,
        grade: "B+",
        practiceAvg: "8.4 / 10",
        examScore: "310 / 360",
        rank: 3,
        progressSummary: "Steady draw posture; working on anchor point consistency under pressure.",
        skills: {
            "Form & Posture": 86,
            "Aim & Anchor": 84,
            "Release Technique": 88,
            "Mental Focus": 82,
            "Physical Stamina": 86
        },
        scoresByEvaluation: [
            { date: "Aug 12", score: 260, avg: 8.2 },
            { date: "Aug 20", score: 295, avg: 8.4 },
            { date: "Aug 28", score: 310, avg: 8.6 },
            { date: "Sep 01", score: 305, avg: 8.5 }
        ],
        attendanceRecords: [
            { date: "2026-09-05", status: "Present", remarks: "Compound bow alignment drill" },
            { date: "2026-09-03", status: "Present", remarks: "Stance & breathing practice" },
            { date: "2026-08-30", status: "Absent", remarks: "Unexcused absence" },
            { date: "2026-08-27", status: "Present", remarks: "30m range target practice" }
        ]
    },
    {
        id: "STU003",
        firstName: "Siva",
        lastName: "Kumar",
        name: "Siva Kumar",
        email: "siva@gmail.com",
        password: "Siva@4321",
        phone: "9876543233",
        dob: "2001-11-30",
        gender: "Male",
        course: "Mechanical Engineering",
        yearSem: "Year 4 / Sem 7",
        bowCategory: "Indian Bow",
        bowType: "Own Bow",
        experience: "Advanced (3 Years)",
        place: "East Campus",
        address: "54 High Street, East Zone",
        attendanceRate: 91,
        attendanceStats: { present: 45, absent: 4, late: 1 },
        overallScore: 89,
        grade: "A",
        practiceAvg: "8.8 / 10",
        examScore: "324 / 360",
        rank: 2,
        progressSummary: "High grouping accuracy in 50m outdoor rounds; strong bow grip control.",
        skills: {
            "Form & Posture": 90,
            "Aim & Anchor": 92,
            "Release Technique": 87,
            "Mental Focus": 91,
            "Physical Stamina": 85
        },
        scoresByEvaluation: [
            { date: "Aug 15", score: 280, avg: 8.6 },
            { date: "Aug 22", score: 315, avg: 8.8 },
            { date: "Aug 30", score: 324, avg: 9.0 },
            { date: "Sep 03", score: 320, avg: 8.9 }
        ],
        attendanceRecords: [
            { date: "2026-09-05", status: "Present", remarks: "50m distance round practice" },
            { date: "2026-09-02", status: "Present", remarks: "Wind compensation techniques" },
            { date: "2026-08-29", status: "Present", remarks: "Equipment tuning & maintenance" }
        ]
    }
];

export const INITIAL_EVENTS = [
    {
        id: 1,
        title: "Annual Sports Meet & Archery Championship",
        type: "Tournament",
        startDate: "2026-09-15",
        time: "10:00 AM",
        venue: "College Auditorium & Main Sports Ground",
        description: "Annual sports meet for all students. Qualification round starts at 10:00 AM sharp. All archers must report with complete academy uniform.",
        status: "Upcoming"
    },
    {
        id: 2,
        title: "National Level Archery Qualification Selection",
        type: "Archery Competition",
        startDate: "2026-09-22",
        time: "08:30 AM",
        venue: "Jawaharlal Nehru Outdoor Stadium, Chennai",
        description: "Selection trial for state team entry. Open for Recurve and Compound category archers with minimum average score of 8.5.",
        status: "Upcoming"
    },
    {
        id: 3,
        title: "Special Bow Tuning & Equipment Workshop",
        type: "Training Camp",
        startDate: "2026-09-05",
        time: "02:00 PM",
        venue: "Academy Indoor Range",
        description: "Hands-on session with head coach covering string wax, arrow fletching repair, and sight alignment.",
        status: "Ongoing"
    }
];

export const COACH_CREDENTIALS = {
    email: "coach@gmail.com",
    password: "Coach@4321",
    name: "Head Coach",
    id: "COA001",
    specialization: "Recurve & Compound Bow Master Coach"
};

export const ADMIN_CREDENTIALS = {
    email: "admin@gmail.com",
    password: "Admin@4321",
    name: "Academy Administrator",
    id: "ADM001"
};

// Global Reactive Application State
export const state = {
    students: [],
    events: [],
    currentUser: null,
    currentRole: "student"
};

export function loadState() {
    // Load students
    const storedStudents = localStorage.getItem("archery_students");
    if (storedStudents) {
        try {
            state.students = JSON.parse(storedStudents);
        } catch (e) {
            state.students = [...INITIAL_STUDENTS];
        }
    } else {
        state.students = [...INITIAL_STUDENTS];
        saveStudentsState();
    }

    // Ensure default demo students have matching passwords
    INITIAL_STUDENTS.forEach(defStu => {
        const index = state.students.findIndex(s => s.id === defStu.id || s.email.toLowerCase() === defStu.email.toLowerCase());
        if (index !== -1) {
            state.students[index].password = defStu.password;
            state.students[index].email = defStu.email;
        } else {
            state.students.push(defStu);
        }
    });
    saveStudentsState();

    // Load events
    const storedEvents = localStorage.getItem("archery_events");
    if (storedEvents) {
        try {
            state.events = JSON.parse(storedEvents);
        } catch (e) {
            state.events = [...INITIAL_EVENTS];
        }
    } else {
        state.events = [...INITIAL_EVENTS];
        saveEventsState();
    }
}

export function saveStudentsState() {
    localStorage.setItem("archery_students", JSON.stringify(state.students));
}

export function saveEventsState() {
    localStorage.setItem("archery_events", JSON.stringify(state.events));
}
