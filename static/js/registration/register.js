/**
 * Student Registration Module
 * Handles student registration form submission, field validation, unique constraints, and state persistence.
 */

import { state, saveStudentsState, saveCoachesState, ADMIN_USERS } from '../shared/state.js';
import { hideAllViews } from '../shared/navigation.js';
import { selectRole, fillDemoCredentials, showLoginView } from '../auth/login.js';
import { showGlobalAlert } from '../shared/alerts.js';
import { api } from '../shared/api.js';

export function showRegisterView(e) {
    if (e) e.preventDefault();
    hideAllViews();
    const regView = document.getElementById('register-view');
    if (regView) regView.classList.remove('d-none');
    const alertBox = document.getElementById('register-alert');
    if (alertBox) alertBox.classList.add('d-none');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

export function showCoachRegisterView(e) {
    if (e) e.preventDefault();
    hideAllViews();
    const coachRegView = document.getElementById('coach-register-view');
    if (coachRegView) coachRegView.classList.remove('d-none');
    const alertBox = document.getElementById('coach-register-alert');
    if (alertBox) alertBox.classList.add('d-none');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Automatically suggests and selects the Age Category based on numeric age entered
 */
export function handleAgeCategoryAutoSelect(ageVal) {
    const ageSelect = document.getElementById('reg_age_category');
    if (!ageSelect || !ageVal) return;

    const age = parseInt(ageVal, 10);
    if (isNaN(age) || age < 1) return;

    if (age < 10) {
        ageSelect.value = "Under-10 (Mini Sub-Junior)";
    } else if (age <= 13) {
        ageSelect.value = "Under-14 (Sub-Junior)";
    } else if (age <= 16) {
        ageSelect.value = "Under-17 (Cadet / Youth)";
    } else if (age <= 20) {
        ageSelect.value = "Under-21 (Junior)";
    } else if (age <= 49) {
        ageSelect.value = "Senior (21+ Years)";
    } else {
        ageSelect.value = "Masters (50+ Years)";
    }
}

export async function handleRegisterSubmit(e) {
    e.preventDefault();
    const alertBox = document.getElementById('register-alert');
    const msgSpan = document.getElementById('register-alert-msg');
    if (alertBox) alertBox.classList.add('d-none');

    // Extract all 13 registration fields
    const name = document.getElementById('reg_name') ? document.getElementById('reg_name').value.trim() : '';
    const gender = document.getElementById('reg_gender') ? document.getElementById('reg_gender').value : '';
    const ageVal = document.getElementById('reg_age') ? document.getElementById('reg_age').value.trim() : '';
    const ageCategory = document.getElementById('reg_age_category') ? document.getElementById('reg_age_category').value : '';
    const phone = document.getElementById('reg_phone') ? document.getElementById('reg_phone').value.trim() : '';
    const currentStatus = document.getElementById('reg_current_status') ? document.getElementById('reg_current_status').value : '';
    const bowCategory = document.getElementById('reg_bow_category') ? document.getElementById('reg_bow_category').value : '';
    const bowType = document.getElementById('reg_bow_type') ? document.getElementById('reg_bow_type').value : '';
    const experience = document.getElementById('reg_experience') ? document.getElementById('reg_experience').value : '';
    const email = document.getElementById('reg_email') ? document.getElementById('reg_email').value.trim() : '';
    const username = document.getElementById('reg_username') ? document.getElementById('reg_username').value.trim() : '';
    const password = document.getElementById('reg_password') ? document.getElementById('reg_password').value : '';
    const confirmPassword = document.getElementById('reg_confirm_password') ? document.getElementById('reg_confirm_password').value : '';

    // Validation: All 13 fields required
    if (!name || !gender || !ageVal || !ageCategory || !phone || !currentStatus || !bowCategory || !bowType || !experience || !email || !username || !password || !confirmPassword) {
        msgSpan.textContent = "Please fill in all 13 required fields.";
        alertBox.classList.remove('d-none');
        return;
    }

    const age = parseInt(ageVal, 10);
    if (isNaN(age) || age < 5 || age > 99) {
        msgSpan.textContent = "Please enter a valid age between 5 and 99 years.";
        alertBox.classList.remove('d-none');
        return;
    }

    if (!/^[0-9]{10}$/.test(phone)) {
        msgSpan.textContent = "Please enter a valid 10-digit mobile number.";
        alertBox.classList.remove('d-none');
        return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        msgSpan.textContent = "Please enter a valid email address.";
        alertBox.classList.remove('d-none');
        return;
    }

    if (username.length < 3) {
        msgSpan.textContent = "User name must be at least 3 characters long.";
        alertBox.classList.remove('d-none');
        return;
    }

    if (password.length < 6) {
        msgSpan.textContent = "Password must be at least 6 characters long.";
        alertBox.classList.remove('d-none');
        return;
    }

    if (password !== confirmPassword) {
        msgSpan.textContent = "Password and Confirm Password do not match.";
        alertBox.classList.remove('d-none');
        return;
    }

    // Uniqueness validation against admin & coaches
    const coachExists = (state.coaches || []).some(c =>
        (c.email && c.email.toLowerCase() === email.toLowerCase()) ||
        (c.username && c.username.toLowerCase() === username.toLowerCase())
    );
    const adminExists = ADMIN_USERS.some(a =>
        (a.email && a.email.toLowerCase() === email.toLowerCase()) ||
        (a.aliasEmail && a.aliasEmail.toLowerCase() === email.toLowerCase()) ||
        (a.username && a.username.toLowerCase() === username.toLowerCase()) ||
        (a.aliasUsername && a.aliasUsername.toLowerCase() === username.toLowerCase())
    );

    if (coachExists || adminExists) {
        msgSpan.textContent = "An account with this Email or User Name already exists.";
        alertBox.classList.remove('d-none');
        return;
    }

    // Generate unique Student ID
    const nextNum = (state.students ? state.students.length : 0) + 1;
    const studentId = `STU${String(nextNum).padStart(3, '0')}`;

    // Split name for compatibility
    const nameParts = name.split(/\s+/);
    const firstName = nameParts[0] || name;
    const lastName = nameParts.slice(1).join(' ') || '';

    const newStudent = {
        id: studentId,
        username: username,
        name: name,
        firstName: firstName,
        lastName: lastName,
        age: age,
        ageCategory: ageCategory,
        gender: gender,
        bowCategory: bowCategory,
        bowType: bowType,
        experience: experience,
        phone: phone,
        currentStatus: currentStatus,
        email: email,
        password: password,
        course: "Academy Training",
        yearSem: ageCategory,
        place: "Academy Main",
        address: "Registered Campus Address",
        attendanceRate: 0,
        attendanceStats: { present: 0, absent: 0, late: 0 },
        overallScore: 0,
        grade: "N/A",
        practiceAvg: "0.0 / 10",
        examScore: "0 / 360",
        rank: "-",
        progressSummary: `Newly registered archer (${bowCategory}, ${ageCategory}). Status: ${currentStatus}. Training records will appear once sessions are logged.`,
        skills: {},
        scoresByEvaluation: [],
        attendanceRecords: []
    };

    // Submit to SQLite Database
    let registeredStudent = newStudent;
    const dbRes = await api.registerStudent(newStudent);

    if (dbRes.ok && dbRes.data && dbRes.data.success) {
        registeredStudent = dbRes.data.student;
        // Also add initial fee invoice if returned or provided
        const existsLocally = state.students.findIndex(s => s.id === registeredStudent.id);
        if (existsLocally >= 0) {
            state.students[existsLocally] = registeredStudent;
        } else {
            state.students.push(registeredStudent);
        }
        saveStudentsState();
        showGlobalAlert(`Student Registration Successful in SQLite Database for ${registeredStudent.name} (${registeredStudent.id})!`, "success");
    } else if (dbRes.status === 400 || (dbRes.data && !dbRes.data.success && dbRes.status !== 0)) {
        // Validation error from database (e.g., duplicate email/username)
        msgSpan.textContent = dbRes.data.message || "Registration failed in database.";
        alertBox.classList.remove('d-none');
        return;
    } else {
        // Fallback if backend server not yet started
        state.students.push(newStudent);
        saveStudentsState();
        showGlobalAlert(`Student registered locally. To persist directly in SQLite DB, run "python server.py".`, "warning");
    }

    selectRole('student');
    fillDemoCredentials('student');
    const emailField = document.getElementById('email');
    const passwordField = document.getElementById('password');
    if (emailField) emailField.value = email;
    if (passwordField) passwordField.value = password;
    showLoginView();
}

/**
 * Handles Coach Registration form submission, field validation, unique constraints, and state persistence.
 */
export function handleCoachRegisterSubmit(e) {
    e.preventDefault();
    const alertBox = document.getElementById('coach-register-alert');
    const msgSpan = document.getElementById('coach-register-alert-msg');
    if (alertBox) alertBox.classList.add('d-none');

    // Extract coach registration fields
    const name = document.getElementById('coach_reg_name') ? document.getElementById('coach_reg_name').value.trim() : '';
    const gender = document.getElementById('coach_reg_gender') ? document.getElementById('coach_reg_gender').value : '';
    const ageVal = document.getElementById('coach_reg_age') ? document.getElementById('coach_reg_age').value.trim() : '';
    const phone = document.getElementById('coach_reg_phone') ? document.getElementById('coach_reg_phone').value.trim() : '';
    const specialization = document.getElementById('coach_reg_specialization') ? document.getElementById('coach_reg_specialization').value : '';
    const certification = document.getElementById('coach_reg_certification') ? document.getElementById('coach_reg_certification').value : '';
    const experience = document.getElementById('coach_reg_experience') ? document.getElementById('coach_reg_experience').value : '';
    const campus = document.getElementById('coach_reg_campus') ? document.getElementById('coach_reg_campus').value : '';
    const bio = document.getElementById('coach_reg_bio') ? document.getElementById('coach_reg_bio').value.trim() : '';
    const email = document.getElementById('coach_reg_email') ? document.getElementById('coach_reg_email').value.trim() : '';
    const username = document.getElementById('coach_reg_username') ? document.getElementById('coach_reg_username').value.trim() : '';
    const password = document.getElementById('coach_reg_password') ? document.getElementById('coach_reg_password').value : '';
    const confirmPassword = document.getElementById('coach_reg_confirm_password') ? document.getElementById('coach_reg_confirm_password').value : '';

    const showError = (message) => {
        if (msgSpan) msgSpan.textContent = message;
        if (alertBox) {
            alertBox.classList.remove('d-none');
            alertBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    };

    // Validation: Required fields
    if (!name || !gender || !ageVal || !phone || !specialization || !certification || !experience || !campus || !email || !username || !password || !confirmPassword) {
        showError("Please fill in all required fields.");
        return;
    }

    const age = parseInt(ageVal, 10);
    if (isNaN(age) || age < 18 || age > 80) {
        showError("Please enter a valid age between 18 and 80 years for coach registration.");
        return;
    }

    if (!/^[0-9]{10}$/.test(phone)) {
        showError("Please enter a valid 10-digit mobile number.");
        return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showError("Please enter a valid email address.");
        return;
    }

    if (username.length < 3) {
        showError("User name must be at least 3 characters long.");
        return;
    }

    if (password.length < 6) {
        showError("Password must be at least 6 characters long.");
        return;
    }

    if (password !== confirmPassword) {
        showError("Password and Confirm Password do not match.");
        return;
    }

    // Uniqueness validation against coaches, students, and admin
    const emailLower = email.toLowerCase();
    const userLower = username.toLowerCase();

    const coachExists = (state.coaches || []).some(c =>
        (c.email && c.email.toLowerCase() === emailLower) ||
        (c.username && c.username.toLowerCase() === userLower) ||
        (c.id && c.id.toLowerCase() === userLower)
    );

    const studentExists = (state.students || []).some(s =>
        (s.email && s.email.toLowerCase() === emailLower) ||
        (s.username && s.username.toLowerCase() === userLower) ||
        (s.id && s.id.toLowerCase() === userLower)
    );

    const adminExists = ADMIN_USERS.some(a =>
        (a.email && a.email.toLowerCase() === emailLower) ||
        (a.aliasEmail && a.aliasEmail.toLowerCase() === emailLower) ||
        (a.username && a.username.toLowerCase() === userLower) ||
        (a.aliasUsername && a.aliasUsername.toLowerCase() === userLower)
    );

    if (coachExists || studentExists || adminExists) {
        showError("An account with this Email or User Name already exists.");
        return;
    }

    // Generate unique Coach ID (e.g., COA002)
    const nextNum = (state.coaches ? state.coaches.length : 0) + 1;
    const coachId = `COA${String(nextNum).padStart(3, '0')}`;

    const newCoach = {
        id: coachId,
        username: username,
        name: name,
        gender: gender,
        age: age,
        phone: phone,
        specialization: specialization,
        certification: certification,
        experience: experience,
        assignedCampus: campus,
        bio: bio || `Archery Coach specializing in ${specialization} with ${experience} experience.`,
        email: email,
        password: password,
        role: "coach",
        registeredAt: new Date().toISOString()
    };

    if (!state.coaches) state.coaches = [];
    state.coaches.push(newCoach);
    saveCoachesState();

    showGlobalAlert(`Coach Registration Successful for ${newCoach.name} (${coachId})! You can now log in with your credentials.`, "success");
    selectRole('coach');
    fillDemoCredentials('coach');
    const emailField = document.getElementById('email');
    const passwordField = document.getElementById('password');
    if (emailField) emailField.value = email;
    if (passwordField) passwordField.value = password;
    showLoginView();
}
