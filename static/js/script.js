/**
 * Intelligent Archery Management System - Pure Frontend Application Logic
 * Supports role-based login, student registration, student performance dashboard (Chart.js),
 * coach student search, and admin event publishing.
 */

// =============================================================================
// FIXED DEMO DATA & STORAGE INITIALIZATION
// =============================================================================

const INITIAL_STUDENTS = [
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

const INITIAL_EVENTS = [
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

const COACH_CREDENTIALS = {
    email: "coach@gmail.com",
    password: "Coach@4321",
    name: "Head Coach",
    id: "COA001",
    specialization: "Recurve & Compound Bow Master Coach"
};

const ADMIN_CREDENTIALS = {
    email: "admin@gmail.com",
    password: "Admin@4321",
    name: "Academy Administrator",
    id: "ADM001"
};

// Global State
let studentsState = [];
let eventsState = [];
let currentUser = null;
let currentRole = "student";

// Chart instances
let stuBarChartInstance = null;
let stuPieChartInstance = null;
let coachBarChartInstance = null;
let coachPieChartInstance = null;

// =============================================================================
// APP INITIALIZATION & LOCALSTORAGE MANAGEMENT
// =============================================================================

function initApp() {
    // Load students from localStorage or set defaults
    const storedStudents = localStorage.getItem("archery_students");
    if (storedStudents) {
        try {
            studentsState = JSON.parse(storedStudents);
        } catch (e) {
            studentsState = [...INITIAL_STUDENTS];
        }
    } else {
        studentsState = [...INITIAL_STUDENTS];
        saveStudentsState();
    }

    // Ensure initial demo students (Arjun, Joseph, Siva) exist with updated passwords
    INITIAL_STUDENTS.forEach(defStu => {
        const index = studentsState.findIndex(s => s.id === defStu.id || s.email.toLowerCase() === defStu.email.toLowerCase());
        if (index !== -1) {
            studentsState[index].password = defStu.password;
            studentsState[index].email = defStu.email;
        } else {
            studentsState.push(defStu);
        }
    });
    saveStudentsState();

    // Load events from localStorage or set defaults
    const storedEvents = localStorage.getItem("archery_events");
    if (storedEvents) {
        try {
            eventsState = JSON.parse(storedEvents);
        } catch (e) {
            eventsState = [...INITIAL_EVENTS];
        }
    } else {
        eventsState = [...INITIAL_EVENTS];
        saveEventsState();
    }

    // Set up password toggle listeners
    setupPasswordToggles();

    // Default view: Login
    selectRole('student');
    showLoginView();
}

function saveStudentsState() {
    localStorage.setItem("archery_students", JSON.stringify(studentsState));
}

function saveEventsState() {
    localStorage.setItem("archery_events", JSON.stringify(eventsState));
}

function setupPasswordToggles() {
    const toggleBtns = document.querySelectorAll('.password-toggle-btn');
    toggleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-target');
            const targetInput = document.getElementById(targetId);
            const icon = btn.querySelector('i');
            if (targetInput) {
                if (targetInput.type === 'password') {
                    targetInput.type = 'text';
                    if (icon) {
                        icon.classList.remove('bi-eye');
                        icon.classList.add('bi-eye-slash');
                    }
                } else {
                    targetInput.type = 'password';
                    if (icon) {
                        icon.classList.remove('bi-eye-slash');
                        icon.classList.add('bi-eye');
                    }
                }
            }
        });
    });
}

// =============================================================================
// ROLE SELECTION & LOGIN HANDLERS
// =============================================================================

function selectRole(role) {
    currentRole = role;
    const roles = ['student', 'coach', 'admin'];

    roles.forEach(r => {
        const card = document.getElementById('card-role-' + r);
        const radio = document.getElementById('role_' + r);
        if (r === role) {
            if (card) card.classList.add('active');
            if (radio) radio.checked = true;
        } else {
            if (card) card.classList.remove('active');
        }
    });

    // Hide or show Student Registration Link based on selected role
    const regContainer = document.getElementById('register-link-container');
    if (regContainer) {
        if (role === 'student') {
            regContainer.classList.remove('d-none');
        } else {
            regContainer.classList.add('d-none');
        }
    }

    hideLoginAlert();
}

function fillDemoCredentials(role, email, password) {
    selectRole(role);
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    if (emailInput) emailInput.value = email;
    if (passwordInput) passwordInput.value = password;
    hideLoginAlert();
}

function handleLoginSubmit(e) {
    e.preventDefault();
    hideLoginAlert();

    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const emailVal = (emailInput ? emailInput.value : "").trim();
    const passwordVal = (passwordInput ? passwordInput.value : "").trim();

    // 1. Validation for empty fields
    if (!emailVal || !passwordVal) {
        showLoginAlert("Please enter both email/username and password.");
        return;
    }

    const emailLower = emailVal.toLowerCase();

    // 2. Validate Credentials against Selected Role
    if (currentRole === 'student') {
        // Check if student exists
        const matchedStu = studentsState.find(s => 
            s.email.toLowerCase() === emailLower || 
            s.id.toLowerCase() === emailLower || 
            s.firstName.toLowerCase() === emailLower
        );

        // Check if user entered coach or admin credentials under student role
        if (emailLower === COACH_CREDENTIALS.email.toLowerCase() || emailLower === ADMIN_CREDENTIALS.email.toLowerCase()) {
            showLoginAlert("Selected login type does not match these credentials.");
            return;
        }

        if (!matchedStu || matchedStu.password !== passwordVal) {
            showLoginAlert("Invalid student email/username or password.");
            return;
        }

        // Login Success
        currentUser = matchedStu;
        initStudentPortal(matchedStu);

    } else if (currentRole === 'coach') {
        // Check if user entered student or admin credentials under coach role
        const isStudentCred = studentsState.some(s => s.email.toLowerCase() === emailLower || s.id.toLowerCase() === emailLower);
        if (isStudentCred || emailLower === ADMIN_CREDENTIALS.email.toLowerCase()) {
            showLoginAlert("Selected login type does not match these credentials.");
            return;
        }

        if (emailLower !== COACH_CREDENTIALS.email.toLowerCase() || passwordVal !== COACH_CREDENTIALS.password) {
            showLoginAlert("Invalid coach email/username or password.");
            return;
        }

        // Login Success
        currentUser = COACH_CREDENTIALS;
        initCoachPortal();

    } else if (currentRole === 'admin') {
        // Check if user entered student or coach credentials under admin role
        const isStudentCred = studentsState.some(s => s.email.toLowerCase() === emailLower || s.id.toLowerCase() === emailLower);
        if (isStudentCred || emailLower === COACH_CREDENTIALS.email.toLowerCase()) {
            showLoginAlert("Selected login type does not match these credentials.");
            return;
        }

        if (emailLower !== ADMIN_CREDENTIALS.email.toLowerCase() || passwordVal !== ADMIN_CREDENTIALS.password) {
            showLoginAlert("Invalid admin email/username or password.");
            return;
        }

        // Login Success
        currentUser = ADMIN_CREDENTIALS;
        initAdminPortal();
    }
}

function showLoginAlert(msg) {
    const alertBox = document.getElementById('login-alert');
    const msgSpan = document.getElementById('login-alert-msg');
    if (alertBox && msgSpan) {
        msgSpan.textContent = msg;
        alertBox.classList.remove('d-none');
    }
}

function hideLoginAlert() {
    const alertBox = document.getElementById('login-alert');
    if (alertBox) alertBox.classList.add('d-none');
}

// =============================================================================
// STUDENT REGISTRATION HANDLERS
// =============================================================================

function showRegisterView(e) {
    if (e) e.preventDefault();
    hideAllViews();
    const regView = document.getElementById('register-view');
    if (regView) regView.classList.remove('d-none');
    document.getElementById('register-alert').classList.add('d-none');
}

function showLoginView(e) {
    if (e) e.preventDefault();
    hideAllViews();
    const loginView = document.getElementById('login-view');
    if (loginView) loginView.classList.remove('d-none');
}

function handleRegisterSubmit(e) {
    e.preventDefault();
    const alertBox = document.getElementById('register-alert');
    const msgSpan = document.getElementById('register-alert-msg');
    alertBox.classList.add('d-none');

    const studentId = document.getElementById('reg_student_id').value.trim();
    const firstName = document.getElementById('reg_first_name').value.trim();
    const lastName = document.getElementById('reg_last_name').value.trim();
    const email = document.getElementById('reg_email').value.trim();
    const phone = document.getElementById('reg_phone').value.trim();
    const dob = document.getElementById('reg_dob').value;
    const gender = document.getElementById('reg_gender').value;
    const course = document.getElementById('reg_course').value.trim();
    const yearSem = document.getElementById('reg_year_sem').value.trim();
    const bowCategory = document.getElementById('reg_bow_category').value;
    const bowType = document.getElementById('reg_bow_type').value;
    const password = document.getElementById('reg_password').value;
    const confirmPassword = document.getElementById('reg_confirm_password').value;

    // Validation checks
    if (!studentId || !firstName || !lastName || !email || !phone || !dob || !gender || !course || !yearSem || !bowCategory || !bowType || !password || !confirmPassword) {
        msgSpan.textContent = "Please fill in all required fields.";
        alertBox.classList.remove('d-none');
        return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        msgSpan.textContent = "Please enter a valid email address.";
        alertBox.classList.remove('d-none');
        return;
    }

    // Check password match
    if (password !== confirmPassword) {
        msgSpan.textContent = "Password and Confirm Password do not match.";
        alertBox.classList.remove('d-none');
        return;
    }

    // Check duplicate student ID or email
    const exists = studentsState.some(s => s.id.toLowerCase() === studentId.toLowerCase() || s.email.toLowerCase() === email.toLowerCase());
    if (exists) {
        msgSpan.textContent = "A student with this Student ID or Email already exists.";
        alertBox.classList.remove('d-none');
        return;
    }

    // Create new student object
    const newStudent = {
        id: studentId,
        firstName: firstName,
        lastName: lastName,
        name: `${firstName} ${lastName}`,
        email: email,
        password: password,
        phone: phone,
        dob: dob,
        gender: gender,
        course: course,
        yearSem: yearSem,
        bowCategory: bowCategory,
        bowType: bowType,
        experience: "Beginner",
        place: "Academy Main",
        address: "Registered Campus Address",
        attendanceRate: 100,
        attendanceStats: { present: 5, absent: 0, late: 0 },
        overallScore: 85,
        grade: "A",
        practiceAvg: "8.5 / 10",
        examScore: "300 / 360",
        rank: studentsState.length + 1,
        progressSummary: "Newly registered student archer. Default evaluation metrics initialized.",
        skills: {
            "Form & Posture": 85,
            "Aim & Anchor": 82,
            "Release Technique": 84,
            "Mental Focus": 80,
            "Physical Stamina": 85
        },
        scoresByEvaluation: [
            { date: "Initial", score: 270, avg: 8.2 },
            { date: "Session 1", score: 300, avg: 8.5 }
        ],
        attendanceRecords: [
            { date: new Date().toISOString().split('T')[0], status: "Present", remarks: "Orientation & Equipment setup" }
        ]
    };

    studentsState.push(newStudent);
    saveStudentsState();

    // Show success message and redirect to login
    showGlobalAlert(`Student Registration Successful for ${newStudent.name}! You can now log in.`, "success");
    selectRole('student');
    fillDemoCredentials('student', email, password);
    showLoginView();
}

// =============================================================================
// NAVIGATION & VIEW SWITCHING
// =============================================================================

function hideAllViews() {
    document.querySelectorAll('.view-section').forEach(sec => sec.classList.add('d-none'));
}

function showNavbar(role, displayName) {
    const navbar = document.getElementById('main-navbar');
    const roleBadge = document.getElementById('nav-role-badge');
    const roleText = document.getElementById('nav-role-text');
    const userDisplay = document.getElementById('nav-user-display');
    const navLinks = document.getElementById('nav-links');

    if (navbar) navbar.classList.remove('d-none');
    if (roleText) roleText.textContent = role.toUpperCase();
    if (userDisplay) userDisplay.textContent = displayName;

    if (roleBadge) {
        roleBadge.className = `badge badge-role badge-${role}`;
    }

    // Role-specific navigation items
    if (navLinks) {
        if (role === 'student') {
            navLinks.innerHTML = `
                <li class="nav-item"><a class="nav-link active" href="#" onclick="showSection('student-view')"><i class="bi bi-grid-fill me-1"></i> Dashboard</a></li>
                <li class="nav-item"><a class="nav-link" href="#student-profile-section"><i class="bi bi-person-badge me-1"></i> My Profile</a></li>
                <li class="nav-item"><a class="nav-link" href="#student-performance-section"><i class="bi bi-graph-up-arrow me-1"></i> My Performance</a></li>
                <li class="nav-item"><a class="nav-link" href="#student-events-section"><i class="bi bi-calendar-event me-1"></i> Published Events</a></li>
            `;
        } else if (role === 'coach') {
            navLinks.innerHTML = `
                <li class="nav-item"><a class="nav-link active" href="#" onclick="showSection('coach-view')"><i class="bi bi-speedometer2 me-1"></i> Coach Home</a></li>
                <li class="nav-item"><a class="nav-link" href="#coach-search-section"><i class="bi bi-search me-1"></i> Student Search</a></li>
                <li class="nav-item"><a class="nav-link" href="#coach-events-section"><i class="bi bi-calendar-event me-1"></i> Published Events</a></li>
            `;
        } else if (role === 'admin') {
            navLinks.innerHTML = `
                <li class="nav-item"><a class="nav-link active" href="#" onclick="showSection('admin-view')"><i class="bi bi-shield-lock me-1"></i> Admin Home</a></li>
                <li class="nav-item"><a class="nav-link" href="#admin-publish-section"><i class="bi bi-megaphone me-1"></i> Publish Events</a></li>
                <li class="nav-item"><a class="nav-link" href="#admin-events-list-section"><i class="bi bi-list-check me-1"></i> Published Events</a></li>
            `;
        }
    }
}

function handleLogout() {
    currentUser = null;
    hideAllViews();
    document.getElementById('main-navbar').classList.add('d-none');
    selectRole('student');
    showLoginView();
    showGlobalAlert("You have been signed out successfully.", "info");
}

function showSection(sectionId) {
    hideAllViews();
    const target = document.getElementById(sectionId);
    if (target) target.classList.remove('d-none');
}

function navigateToRoleHome(e) {
    if (e) e.preventDefault();
    if (!currentUser) {
        showLoginView();
    } else if (currentRole === 'student') {
        showSection('student-view');
    } else if (currentRole === 'coach') {
        showSection('coach-view');
    } else if (currentRole === 'admin') {
        showSection('admin-view');
    }
}

// =============================================================================
// STUDENT PORTAL RENDERING & CHART.JS
// =============================================================================

function initStudentPortal(student) {
    hideAllViews();
    showNavbar('student', student.name);
    showSection('student-view');

    // Headers & Names
    document.getElementById('stu-welcome-name').textContent = `Welcome, ${student.name}!`;
    document.getElementById('stu-header-id').textContent = student.id;
    document.getElementById('stu-header-dept').textContent = student.course;

    // Stat Cards
    document.getElementById('stu-card-id').textContent = student.id;
    document.getElementById('stu-card-attendance').textContent = `${student.attendanceRate}%`;
    document.getElementById('stu-card-overall').textContent = `${student.overallScore}% (${student.grade})`;
    document.getElementById('stu-card-exam').textContent = `${student.examScore} (Rank ${student.rank})`;

    // Profile Card
    document.getElementById('stu-prof-id').textContent = student.id;
    document.getElementById('stu-prof-name').textContent = student.name;
    document.getElementById('stu-prof-email').textContent = student.email;
    document.getElementById('stu-prof-phone').textContent = student.phone || '-';
    document.getElementById('stu-prof-course').textContent = student.course;
    document.getElementById('stu-prof-yearsem').textContent = student.yearSem;
    document.getElementById('stu-prof-bowcat').textContent = student.bowCategory;
    document.getElementById('stu-prof-exp').textContent = student.experience;

    // Progress Bars
    renderStudentSkillProgressBars(student.skills, 'stu-skill-progress-bars');

    // Notes
    document.getElementById('stu-progress-notes').textContent = student.progressSummary;

    // Attendance Table
    document.getElementById('stu-att-badge').textContent = `Rate: ${student.attendanceRate}%`;
    renderAttendanceTable(student.attendanceRecords, 'stu-att-tbody');

    // Published Events
    renderPublishedEventsGrid(eventsState, 'stu-events-grid', 'stu-events-count');

    // Charts
    renderStudentCharts(student);
}

function renderStudentSkillProgressBars(skillsObj, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    let html = '';
    for (const [skillName, score] of Object.entries(skillsObj)) {
        let colorClass = 'bg-primary';
        if (score >= 90) colorClass = 'bg-success';
        else if (score >= 80) colorClass = 'bg-info';
        else if (score >= 70) colorClass = 'bg-warning';

        html += `
            <div class="mb-3">
                <div class="d-flex justify-content-between align-items-center mb-1">
                    <span class="fw-semibold text-dark small">${skillName}</span>
                    <span class="fw-bold small text-muted">${score}%</span>
                </div>
                <div class="progress" style="height: 10px; border-radius: 6px;">
                    <div class="progress-bar ${colorClass}" role="progressbar" style="width: ${score}%;" aria-valuenow="${score}" aria-valuemin="0" aria-valuemax="100"></div>
                </div>
            </div>
        `;
    }
    container.innerHTML = html;
}

function renderAttendanceTable(records, tbodyId) {
    const tbody = document.getElementById(tbodyId);
    if (!tbody) return;

    if (!records || records.length === 0) {
        tbody.innerHTML = `<tr><td colspan="3" class="text-center text-muted py-3">No attendance records found.</td></tr>`;
        return;
    }

    let html = '';
    records.forEach(rec => {
        let badgeClass = 'bg-success';
        if (rec.status === 'Absent') badgeClass = 'bg-danger';
        else if (rec.status === 'Late') badgeClass = 'bg-warning text-dark';

        html += `
            <tr>
                <td class="ps-4 fw-semibold text-dark">${rec.date}</td>
                <td><span class="badge ${badgeClass} px-3 py-1 rounded-pill">${rec.status}</span></td>
                <td class="text-secondary small">${rec.remarks || '-'}</td>
            </tr>
        `;
    });
    tbody.innerHTML = html;
}

function renderStudentCharts(student) {
    // 1. Destroy previous instances if exist
    if (stuBarChartInstance) stuBarChartInstance.destroy();
    if (stuPieChartInstance) stuPieChartInstance.destroy();

    // 2. Bar Chart Data
    const barCtx = document.getElementById('stuBarChart');
    if (barCtx) {
        const labels = student.scoresByEvaluation.map(s => s.date);
        const dataScores = student.scoresByEvaluation.map(s => s.score);

        stuBarChartInstance = new Chart(barCtx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Evaluation Score',
                    data: dataScores,
                    backgroundColor: 'rgba(15, 118, 110, 0.75)',
                    borderColor: '#0f766e',
                    borderWidth: 1.5,
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { beginAtZero: true, max: 360 }
                }
            }
        });
    }

    // 3. Pie Chart Data
    const pieCtx = document.getElementById('stuPieChart');
    if (pieCtx) {
        const pieLabels = Object.keys(student.skills);
        const pieData = Object.values(student.skills);

        stuPieChartInstance = new Chart(pieCtx, {
            type: 'pie',
            data: {
                labels: pieLabels,
                datasets: [{
                    data: pieData,
                    backgroundColor: ['#0f766e', '#14b8a6', '#f59e0b', '#0284c7', '#7c3aed']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }
}

// =============================================================================
// COACH PORTAL RENDERING & STUDENT SEARCH
// =============================================================================

function initCoachPortal() {
    hideAllViews();
    showNavbar('coach', 'Head Coach');
    showSection('coach-view');

    document.getElementById('coach-total-students-count').textContent = studentsState.length;
    document.getElementById('coach-events-count').textContent = eventsState.length;

    renderCoachStudentResults(studentsState);
    renderPublishedEventsGrid(eventsState, 'coach-events-grid', 'coach-events-count-badge');
}

function handleCoachSearchLive() {
    const query = document.getElementById('coach-search-input').value.trim().toLowerCase();
    if (!query) {
        renderCoachStudentResults(studentsState);
        return;
    }
    const filtered = studentsState.filter(s => 
        s.id.toLowerCase().includes(query) || 
        s.name.toLowerCase().includes(query) || 
        s.course.toLowerCase().includes(query)
    );
    renderCoachStudentResults(filtered);
}

function handleCoachSearchSubmit(e) {
    e.preventDefault();
    handleCoachSearchLive();
}

function renderCoachStudentResults(studentsList) {
    const tbody = document.getElementById('coach-student-results-tbody');
    if (!tbody) return;

    if (studentsList.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-muted"><i class="bi bi-search me-1"></i> No matching students found.</td></tr>`;
        return;
    }

    let html = '';
    studentsList.forEach(s => {
        html += `
            <tr>
                <td class="ps-3"><span class="badge bg-dark fs-6">${s.id}</span></td>
                <td class="fw-bold text-dark">${s.name}</td>
                <td class="small">${s.course}</td>
                <td><span class="badge bg-info text-dark">${s.bowCategory}</span></td>
                <td><span class="badge bg-success-subtle text-success border border-success-subtle">${s.attendanceRate}%</span></td>
                <td class="fw-semibold text-warning">${s.examScore}</td>
                <td class="text-end pe-3">
                    <button type="button" class="btn btn-sm btn-primary rounded-pill px-3" onclick="inspectStudentPerformance('${s.id}')">
                        <i class="bi bi-graph-up-arrow me-1"></i> View Performance
                    </button>
                </td>
            </tr>
        `;
    });
    tbody.innerHTML = html;
}

function inspectStudentPerformance(studentId) {
    const student = studentsState.find(s => s.id === studentId);
    if (!student) return;

    const displayContainer = document.getElementById('coach-performance-display');
    if (displayContainer) displayContainer.classList.remove('d-none');

    document.getElementById('coach-viewed-stu-title').textContent = `Performance Dashboard: ${student.name} (${student.id})`;
    document.getElementById('coach-viewed-stu-name').textContent = `${student.id} - ${student.name}`;
    document.getElementById('coach-viewed-stu-dept').textContent = student.course;
    document.getElementById('coach-viewed-stu-att').textContent = `${student.attendanceRate}%`;
    document.getElementById('coach-viewed-stu-exam').textContent = `${student.examScore} (Rank ${student.rank})`;

    // Progress Bars
    renderStudentSkillProgressBars(student.skills, 'coach-viewed-stu-skills');

    // Render Charts for Coach
    if (coachBarChartInstance) coachBarChartInstance.destroy();
    if (coachPieChartInstance) coachPieChartInstance.destroy();

    const barCtx = document.getElementById('coachBarChart');
    if (barCtx) {
        coachBarChartInstance = new Chart(barCtx, {
            type: 'bar',
            data: {
                labels: student.scoresByEvaluation.map(s => s.date),
                datasets: [{
                    label: 'Scores',
                    data: student.scoresByEvaluation.map(s => s.score),
                    backgroundColor: 'rgba(245, 158, 11, 0.75)',
                    borderColor: '#f59e0b',
                    borderWidth: 1.5
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, max: 360 } } }
        });
    }

    const pieCtx = document.getElementById('coachPieChart');
    if (pieCtx) {
        coachPieChartInstance = new Chart(pieCtx, {
            type: 'pie',
            data: {
                labels: Object.keys(student.skills),
                datasets: [{
                    data: Object.values(student.skills),
                    backgroundColor: ['#0f766e', '#14b8a6', '#f59e0b', '#0284c7', '#7c3aed']
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }

    // Scroll to dashboard display
    displayContainer.scrollIntoView({ behavior: 'smooth' });
}

function hideCoachPerformanceDisplay() {
    const displayContainer = document.getElementById('coach-performance-display');
    if (displayContainer) displayContainer.classList.add('d-none');
}

// =============================================================================
// ADMIN PORTAL RENDERING & EVENT PUBLISHING
// =============================================================================

function initAdminPortal() {
    hideAllViews();
    showNavbar('admin', 'Administrator');
    showSection('admin-view');

    document.getElementById('admin-stat-events-count').textContent = eventsState.length;
    document.getElementById('admin-stat-students-count').textContent = studentsState.length;

    renderAdminEventsTable();
}

function handleAdminPublishEvent(e) {
    e.preventDefault();

    const title = document.getElementById('adm_event_name').value.trim();
    const type = document.getElementById('adm_event_type').value;
    const startDate = document.getElementById('adm_start_date').value;
    const time = document.getElementById('adm_event_time').value;
    const venue = document.getElementById('adm_venue').value.trim();
    const description = document.getElementById('adm_description').value.trim();

    if (!title || !type || !startDate || !time || !venue || !description) {
        showGlobalAlert("Please fill in all event fields before publishing.", "warning");
        return;
    }

    // Create new event
    const newEvent = {
        id: Date.now(),
        title: title,
        type: type,
        startDate: startDate,
        time: time,
        venue: venue,
        description: description,
        status: "Upcoming"
    };

    eventsState.unshift(newEvent);
    saveEventsState();

    // Reset Form
    document.getElementById('adminCreateEventForm').reset();

    // Show Notification Alert
    showGlobalAlert(`Event "${newEvent.title}" published successfully!`, "success");

    // Update Admin Table & Stats
    document.getElementById('admin-stat-events-count').textContent = eventsState.length;
    renderAdminEventsTable();
}

function renderAdminEventsTable() {
    const tbody = document.getElementById('admin-events-tbody');
    const badge = document.getElementById('admin-events-badge');
    if (!tbody) return;

    if (badge) badge.textContent = `${eventsState.length} Events`;

    if (eventsState.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center py-3 text-muted">No published events found.</td></tr>`;
        return;
    }

    let html = '';
    eventsState.forEach(ev => {
        html += `
            <tr>
                <td class="ps-4 fw-bold text-dark">${ev.title}</td>
                <td><span class="badge badge-event-type">${ev.type}</span></td>
                <td class="small">${ev.startDate} @ ${ev.time}</td>
                <td class="small text-secondary"><i class="bi bi-geo-alt-fill text-danger me-1"></i>${ev.venue}</td>
                <td><span class="badge bg-success rounded-pill">${ev.status}</span></td>
            </tr>
        `;
    });
    tbody.innerHTML = html;
}

// =============================================================================
// SHARED EVENTS RENDERING & MODALS
// =============================================================================

function renderPublishedEventsGrid(eventsList, gridId, countBadgeId) {
    const grid = document.getElementById(gridId);
    const countBadge = document.getElementById(countBadgeId);
    if (!grid) return;

    if (countBadge) countBadge.textContent = `${eventsList.length} Active Events`;

    if (eventsList.length === 0) {
        grid.innerHTML = `<div class="col-12 text-center py-4 text-muted"><i class="bi bi-calendar-x fs-2 mb-2 d-block"></i>No active events found.</div>`;
        return;
    }

    let html = '';
    eventsList.forEach(ev => {
        html += `
            <div class="col-lg-4 col-md-6">
                <div class="card h-100 border-0 shadow-sm rounded-3 event-card-student position-relative overflow-hidden">
                    <div class="event-status-strip status-upcoming"></div>
                    <div class="card-body p-3 d-flex flex-column justify-content-between">
                        <div>
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <span class="badge badge-event-type">${ev.type}</span>
                                <span class="badge bg-primary-subtle text-primary border rounded-pill small">${ev.status}</span>
                            </div>
                            <h6 class="fw-bold text-dark mb-2 event-title-clamp">${ev.title}</h6>
                            <div class="small text-muted mb-1">
                                <i class="bi bi-calendar3 text-primary me-1"></i>${ev.startDate} @ ${ev.time}
                            </div>
                            <div class="small text-muted mb-2">
                                <i class="bi bi-geo-alt-fill text-danger me-1"></i>${ev.venue}
                            </div>
                            <p class="text-secondary small mb-3 event-desc-clamp">${ev.description}</p>
                        </div>
                        <button type="button" class="btn btn-outline-primary btn-sm w-100 rounded-pill fw-semibold mt-auto" onclick="openEventDetailModal(${ev.id})">
                            <i class="bi bi-info-circle me-1"></i> View Details
                        </button>
                    </div>
                </div>
            </div>
        `;
    });
    grid.innerHTML = html;
}

function openEventDetailModal(eventId) {
    const ev = eventsState.find(e => e.id === eventId);
    if (!ev) return;

    document.getElementById('modal-event-name').textContent = ev.title;
    document.getElementById('modal-event-type').textContent = ev.type;
    document.getElementById('modal-event-status').textContent = ev.status;
    document.getElementById('modal-event-date').textContent = ev.startDate;
    document.getElementById('modal-event-time').textContent = ev.time;
    document.getElementById('modal-event-venue').innerHTML = `<i class="bi bi-geo-alt-fill text-danger me-1"></i>${ev.venue}`;
    document.getElementById('modal-event-desc').textContent = ev.description;

    const modal = new bootstrap.Modal(document.getElementById('eventDetailModal'));
    modal.show();
}

// Global Alert Utility
function showGlobalAlert(msg, type = "info") {
    const alertContainer = document.getElementById('global-alert-container');
    const alertBox = document.getElementById('global-alert');
    const alertMsg = document.getElementById('global-alert-msg');
    const alertIcon = document.getElementById('global-alert-icon');

    if (!alertContainer || !alertBox || !alertMsg) return;

    alertBox.className = `alert alert-${type} alert-dismissible fade show shadow-sm`;
    alertMsg.textContent = msg;

    if (type === 'success') alertIcon.className = 'bi bi-check-circle-fill fs-5 me-2';
    else if (type === 'danger') alertIcon.className = 'bi bi-exclamation-triangle-fill fs-5 me-2';
    else alertIcon.className = 'bi bi-info-circle-fill fs-5 me-2';

    alertContainer.classList.remove('d-none');

    setTimeout(() => {
        dismissGlobalAlert();
    }, 5000);
}

function dismissGlobalAlert() {
    const alertContainer = document.getElementById('global-alert-container');
    if (alertContainer) alertContainer.classList.add('d-none');
}

// Start application when DOM is ready
document.addEventListener('DOMContentLoaded', initApp);
