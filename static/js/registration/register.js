/**
 * Student Registration Module
 * Handles student registration form submission, field validation, unique constraints, and state persistence.
 */

import { state, saveStudentsState } from '../shared/state.js';
import { hideAllViews } from '../shared/navigation.js';
import { selectRole, fillDemoCredentials, showLoginView } from '../auth/login.js';
import { showGlobalAlert } from '../shared/alerts.js';

export function showRegisterView(e) {
    if (e) e.preventDefault();
    hideAllViews();
    const regView = document.getElementById('register-view');
    if (regView) regView.classList.remove('d-none');
    const alertBox = document.getElementById('register-alert');
    if (alertBox) alertBox.classList.add('d-none');
}

export function handleRegisterSubmit(e) {
    e.preventDefault();
    const alertBox = document.getElementById('register-alert');
    const msgSpan = document.getElementById('register-alert-msg');
    if (alertBox) alertBox.classList.add('d-none');

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

    if (!studentId || !firstName || !lastName || !email || !phone || !dob || !gender || !course || !yearSem || !bowCategory || !bowType || !password || !confirmPassword) {
        msgSpan.textContent = "Please fill in all required fields.";
        alertBox.classList.remove('d-none');
        return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        msgSpan.textContent = "Please enter a valid email address.";
        alertBox.classList.remove('d-none');
        return;
    }

    if (password !== confirmPassword) {
        msgSpan.textContent = "Password and Confirm Password do not match.";
        alertBox.classList.remove('d-none');
        return;
    }

    const exists = state.students.some(s => s.id.toLowerCase() === studentId.toLowerCase() || s.email.toLowerCase() === email.toLowerCase());
    if (exists) {
        msgSpan.textContent = "A student with this Student ID or Email already exists.";
        alertBox.classList.remove('d-none');
        return;
    }

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
        rank: state.students.length + 1,
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

    state.students.push(newStudent);
    saveStudentsState();

    showGlobalAlert(`Student Registration Successful for ${newStudent.name}! You can now log in.`, "success");
    selectRole('student');
    fillDemoCredentials('student', email, password);
    showLoginView();
}
