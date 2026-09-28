/**
 * State Management & Persistent Storage Module
 * Manages demo student data, demo events, credentials, and localStorage synchronization.
 */

export const INITIAL_STUDENTS = [];

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

export const INITIAL_COACHES = [];

export const COACH_CREDENTIALS = null;

// Three Hardcoded Administrator Logins
export const ADMIN_USERS = [
    {
        id: "ADM001",
        name: "Academy Director",
        username: "admin1",
        aliasUsername: "admin",
        email: "admin1@gmail.com",
        aliasEmail: "admin@gmail.com",
        password: "Admin@4321",
        role: "admin",
        title: "Academy Director & Master Admin"
    },
    {
        id: "ADM002",
        name: "Operations Admin",
        username: "admin2",
        aliasUsername: "admin2",
        email: "admin2@gmail.com",
        aliasEmail: "admin2@phoenix.com",
        password: "Admin@4321",
        role: "admin",
        title: "Range Operations & Equipment Manager"
    },
    {
        id: "ADM003",
        name: "Finance & Events Admin",
        username: "admin3",
        aliasUsername: "admin3",
        email: "admin3@gmail.com",
        aliasEmail: "admin3@phoenix.com",
        password: "Admin@4321",
        role: "admin",
        title: "Tournament Coordinator & Accounts Head"
    }
];

export const ADMIN_CREDENTIALS = ADMIN_USERS[0];

// Global Initial Datasets for Equipment, Fees, and Training Schedules

export const INITIAL_EQUIPMENT = [
    {
        id: "EQ-001",
        name: "Hoyt Grand Prix Recurve Bow (68\" 36#)",
        category: "Recurve Bow",
        serialNumber: "HYT-2024-883",
        totalQty: 6,
        availableQty: 6,
        condition: "Excellent",
        location: "Armory Locker A",
        assignedStudents: []
    },
    {
        id: "EQ-002",
        name: "Mathews TRX 36 3D Compound Bow (60#)",
        category: "Compound Bow",
        serialNumber: "MTH-9021-01",
        totalQty: 4,
        availableQty: 4,
        condition: "Good",
        location: "Armory Locker B",
        assignedStudents: []
    },
    {
        id: "EQ-003",
        name: "Bamboo & Rosewood Indian Traditional Bow (32#)",
        category: "Indian Bow",
        serialNumber: "IND-TRD-441",
        totalQty: 8,
        availableQty: 8,
        condition: "Good",
        location: "Armory Rack 1",
        assignedStudents: []
    },
    {
        id: "EQ-004",
        name: "Easton X10 High-Precision Carbon Arrows (Set of 12)",
        category: "Arrows",
        serialNumber: "EAS-X10-12",
        totalQty: 15,
        availableQty: 15,
        condition: "Excellent",
        location: "Quiver Bay 2",
        assignedStudents: []
    },
    {
        id: "EQ-005",
        name: "Easton Superdrive Micro Target Arrows (Set of 12)",
        category: "Arrows",
        serialNumber: "EAS-SDM-08",
        totalQty: 10,
        availableQty: 10,
        condition: "Good",
        location: "Quiver Bay 3",
        assignedStudents: []
    },
    {
        id: "EQ-006",
        name: "Danage High-Density Foam Target Butt 132cm",
        category: "Targets & Butts",
        serialNumber: "DNG-132-04",
        totalQty: 12,
        availableQty: 12,
        condition: "Needs Maintenance",
        location: "Outdoor Range Lane 3",
        assignedStudents: []
    },
    {
        id: "EQ-007",
        name: "Shibuya Ultima RC Pro Carbon Sight Set",
        category: "Accessories",
        serialNumber: "SHB-ULT-99",
        totalQty: 8,
        availableQty: 8,
        condition: "Excellent",
        location: "Precision Tool Cabinet",
        assignedStudents: []
    },
    {
        id: "EQ-008",
        name: "Bohning Leather Arm Guard & Finger Tab Bundle",
        category: "Protective Gear",
        serialNumber: "BHN-PRT-20",
        totalQty: 25,
        availableQty: 25,
        condition: "Good",
        location: "Safety Storage Bin",
        assignedStudents: []
    }
];

export const INITIAL_EQUIPMENT_REQUESTS = [];

export const INITIAL_FEES = [];

export const INITIAL_SCHEDULES = [
    {
        id: "SCH-001",
        title: "Morning Recurve Elite Drill & Form Calibration",
        category: "Recurve Bow",
        days: "Mon, Wed, Fri",
        time: "06:00 AM - 08:00 AM",
        distance: "70m Olympic Distance",
        rangeLocation: "Outdoor Main Range (Lanes 1-4)",
        coach: "Assigned Coach",
        capacity: 8,
        enrolled: [],
        focus: "Clicker timing, anchor expansion, and wind-drift scoring rounds"
    },
    {
        id: "SCH-002",
        title: "Evening Compound Bow Alignment & Sight Calibration",
        category: "Compound Bow",
        days: "Tue, Thu, Sat",
        time: "04:30 PM - 06:30 PM",
        distance: "50m Compound Target",
        rangeLocation: "Outdoor South Range (Lanes 5-8)",
        coach: "Assigned Coach",
        capacity: 6,
        enrolled: [],
        focus: "Release aid tension control, back-tension timing, bubble level steadiness"
    },
    {
        id: "SCH-003",
        title: "Indian Traditional Bow Stance & Draw Stamina",
        category: "Indian Bow",
        days: "Mon, Wed, Fri",
        time: "05:00 PM - 07:00 PM",
        distance: "30m & 50m Traditional Range",
        rangeLocation: "East Field Range",
        coach: "Assigned Coach",
        capacity: 10,
        enrolled: [],
        focus: "Instinctive aim point calibration, bow arm stability and breath synchronization"
    },
    {
        id: "SCH-004",
        title: "Indoor 18m Precision Tournament Simulation",
        category: "All Categories",
        days: "Saturday",
        time: "08:00 AM - 11:00 AM",
        distance: "18m WA Indoor Range",
        rangeLocation: "Indoor Range Hall (Lanes 1-12)",
        coach: "Assigned Coach",
        capacity: 15,
        enrolled: [],
        focus: "Mock ranking ends, buzzer timer pressure practice, scorecard audit"
    },
    {
        id: "SCH-005",
        title: "Sunday Bow Tuning & High-Speed Video Analysis",
        category: "All Categories",
        days: "Sunday",
        time: "09:00 AM - 11:30 AM",
        distance: "Tuning Range & Lab",
        rangeLocation: "Biomechanics & Tuning Lab",
        coach: "Assigned Coach",
        capacity: 8,
        enrolled: [],
        focus: "High-speed camera release review, tiller balancing, and paper tuning"
    }
];

// Global Reactive Application State
export const state = {
    students: [],
    coaches: [],
    events: [],
    equipment: [],
    equipmentRequests: [],
    fees: [],
    schedules: [],
    currentUser: null,
    currentRole: "student"
};

export function loadState() {
    // Load students - only retain registered users, filter out old demo data
    const storedStudents = localStorage.getItem("archery_students");
    if (storedStudents) {
        try {
            state.students = JSON.parse(storedStudents).filter(s =>
                !['STU001', 'STU002', 'STU003'].includes(s.id) &&
                !['arjun@gmail.com', 'joseph@gmail.com', 'siva@gmail.com'].includes((s.email || '').toLowerCase())
            );
        } catch (e) {
            state.students = [];
        }
    } else {
        state.students = [];
    }
    saveStudentsState();

    // Asynchronously synchronize students directly from SQLite database
    syncStudentsFromDB();

    // Load coaches - only retain registered coaches, filter out old demo data
    const storedCoaches = localStorage.getItem("archery_coaches");
    if (storedCoaches) {
        try {
            state.coaches = JSON.parse(storedCoaches).filter(c =>
                !['COA001'].includes(c.id) &&
                !['coach@gmail.com'].includes((c.email || '').toLowerCase()) &&
                !['headcoach'].includes((c.username || '').toLowerCase())
            );
        } catch (e) {
            state.coaches = [];
        }
    } else {
        state.coaches = [];
    }
    saveCoachesState();

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

    // Load equipment
    const storedEquipment = localStorage.getItem("archery_equipment");
    if (storedEquipment) {
        try {
            state.equipment = JSON.parse(storedEquipment);
        } catch (e) {
            state.equipment = [...INITIAL_EQUIPMENT];
        }
    } else {
        state.equipment = [...INITIAL_EQUIPMENT];
    }
    // Clean any legacy assignments
    state.equipment.forEach(eq => {
        eq.assignedStudents = (eq.assignedStudents || []).filter(st => !['STU001', 'STU002', 'STU003'].includes(st.id));
        eq.availableQty = Math.max(0, eq.totalQty - eq.assignedStudents.length);
    });
    saveEquipmentState();

    // Load equipment requests
    const storedRequests = localStorage.getItem("archery_equipment_requests");
    if (storedRequests) {
        try {
            state.equipmentRequests = JSON.parse(storedRequests).filter(r => !['STU001', 'STU002', 'STU003'].includes(r.studentId));
        } catch (e) {
            state.equipmentRequests = [];
        }
    } else {
        state.equipmentRequests = [];
    }
    saveEquipmentRequestsState();

    // Load fees
    const storedFees = localStorage.getItem("archery_fees");
    if (storedFees) {
        try {
            state.fees = JSON.parse(storedFees).filter(f => !['STU001', 'STU002', 'STU003'].includes(f.studentId));
        } catch (e) {
            state.fees = [];
        }
    } else {
        state.fees = [];
    }
    saveFeesState();

    // Load schedules
    const storedSchedules = localStorage.getItem("archery_schedules");
    if (storedSchedules) {
        try {
            state.schedules = JSON.parse(storedSchedules);
        } catch (e) {
            state.schedules = [...INITIAL_SCHEDULES];
        }
    } else {
        state.schedules = [...INITIAL_SCHEDULES];
    }
    state.schedules.forEach(sch => {
        sch.enrolled = (sch.enrolled || []).filter(id => !['STU001', 'STU002', 'STU003'].includes(id));
    });
    saveSchedulesState();
}

export function saveStudentsState() {
    localStorage.setItem("archery_students", JSON.stringify(state.students));
}

export function saveCoachesState() {
    localStorage.setItem("archery_coaches", JSON.stringify(state.coaches));
}

export function saveEventsState() {
    localStorage.setItem("archery_events", JSON.stringify(state.events));
}

export function saveEquipmentState() {
    localStorage.setItem("archery_equipment", JSON.stringify(state.equipment));
}

export function saveEquipmentRequestsState() {
    localStorage.setItem("archery_equipment_requests", JSON.stringify(state.equipmentRequests));
}

export function saveFeesState() {
    localStorage.setItem("archery_fees", JSON.stringify(state.fees));
}

export function saveSchedulesState() {
    localStorage.setItem("archery_schedules", JSON.stringify(state.schedules));
}

export async function syncStudentsFromDB() {
    try {
        const { api } = await import('./api.js');
        const res = await api.getAllStudents();
        if (res.ok && res.data && res.data.success && Array.isArray(res.data.students)) {
            state.students = res.data.students;
            saveStudentsState();
        }
    } catch (e) {
        console.warn("[State] SQLite DB sync deferred:", e.message);
    }
}

