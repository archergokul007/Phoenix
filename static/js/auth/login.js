/**
 * Authentication Module
 * Handles role selection, demo credential autofill, login form validation, and credential verification.
 */

import { state, ADMIN_USERS, saveStudentsState } from '../shared/state.js';
import { hideAllViews } from '../shared/navigation.js';
import { initStudentPortal } from '../student/dashboard.js';
import { initCoachPortal } from '../coach/dashboard.js';
import { initAdminPortal } from '../admin/dashboard.js';
import { api } from '../shared/api.js';

export function selectRole(role) {
    state.currentRole = role;
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

    const regContainer = document.getElementById('register-link-container');
    if (regContainer) {
        if (role === 'student') {
            regContainer.classList.remove('d-none');
            regContainer.innerHTML = `
                <span class="text-muted small">Don't have an account?</span>
                <a href="#" class="register-link-btn" onclick="showRegisterView(event)">
                    Register as Student <i class="bi bi-arrow-right-short"></i>
                </a>
            `;
        } else if (role === 'coach') {
            regContainer.classList.remove('d-none');
            regContainer.innerHTML = `
                <span class="text-muted small">New coach at our academy?</span>
                <a href="#" class="register-link-btn" onclick="showCoachRegisterView(event)">
                    Register as Coach <i class="bi bi-arrow-right-short"></i>
                </a>
            `;
        } else {
            regContainer.classList.add('d-none');
        }
    }

    // Leave fields empty for manual user entry
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    if (emailInput) emailInput.value = '';
    if (passwordInput) passwordInput.value = '';

    hideLoginAlert();
}

/**
 * Autofills one of the three hardcoded Admin logins
 * @param {number} adminIndex (1, 2, or 3)
 */
export function fillAdminCredentials(adminIndex) {
    selectRole('admin');
    const idx = (adminIndex >= 1 && adminIndex <= ADMIN_USERS.length) ? adminIndex - 1 : 0;
    const admin = ADMIN_USERS[idx];
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    if (emailInput) emailInput.value = admin.email;
    if (passwordInput) passwordInput.value = admin.password;
    hideLoginAlert();
}

export function fillDemoCredentials(role) {
    if (role === 'admin') {
        fillAdminCredentials(1);
    } else {
        selectRole(role);
    }
}

export async function handleLoginSubmit(e) {
    e.preventDefault();
    hideLoginAlert();

    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const emailVal = (emailInput ? emailInput.value : "").trim();
    const passwordVal = (passwordInput ? passwordInput.value : "").trim();

    if (!emailVal || !passwordVal) {
        showLoginAlert("Please enter both email/username and password.");
        return;
    }

    const emailLower = emailVal.toLowerCase();

    // Cross-role verification
    const isAdminAccount = ADMIN_USERS.some(a =>
        (a.email && a.email.toLowerCase() === emailLower) ||
        (a.aliasEmail && a.aliasEmail.toLowerCase() === emailLower) ||
        (a.username && a.username.toLowerCase() === emailLower) ||
        (a.aliasUsername && a.aliasUsername.toLowerCase() === emailLower) ||
        (a.id && a.id.toLowerCase() === emailLower)
    );

    const isCoachAccount = (state.coaches || []).some(c =>
        (c.email && c.email.toLowerCase() === emailLower) ||
        (c.username && c.username.toLowerCase() === emailLower) ||
        (c.id && c.id.toLowerCase() === emailLower)
    );

    const isStudentAccount = (state.students || []).some(s =>
        (s.email && s.email.toLowerCase() === emailLower) ||
        (s.username && s.username.toLowerCase() === emailLower) ||
        (s.id && s.id.toLowerCase() === emailLower)
    );

    if (state.currentRole === 'student') {
        if (isAdminAccount || isCoachAccount) {
            showLoginAlert("Selected login type does not match these credentials.");
            return;
        }

        // 1. First authenticate with SQLite database
        const dbRes = await api.loginStudent(emailVal, passwordVal);

        if (dbRes.ok && dbRes.data && dbRes.data.success) {
            const dbStu = dbRes.data.student;
            state.currentUser = dbStu;

            // Sync with local memory
            const idx = (state.students || []).findIndex(s => s.id === dbStu.id);
            if (idx >= 0) {
                state.students[idx] = dbStu;
            } else {
                state.students.push(dbStu);
            }
            saveStudentsState();

            initStudentPortal(dbStu);
            return;
        } else if (dbRes.status === 401 || (dbRes.data && !dbRes.data.success && dbRes.status !== 0)) {
            showLoginAlert(dbRes.data.message || "Invalid student credentials. Please register first if you do not have an account.");
            return;
        }

        // 2. Fallback to local storage if database server is currently offline
        const matchedStu = (state.students || []).find(s =>
            (s.email && s.email.toLowerCase() === emailLower) ||
            (s.id && s.id.toLowerCase() === emailLower) ||
            (s.username && s.username.toLowerCase() === emailLower) ||
            (s.firstName && s.firstName.toLowerCase() === emailLower)
        );

        if (!matchedStu || matchedStu.password !== passwordVal) {
            showLoginAlert("Invalid student credentials. Please register first if you do not have an account.");
            return;
        }

        state.currentUser = matchedStu;
        initStudentPortal(matchedStu);

    } else if (state.currentRole === 'coach') {
        if (isAdminAccount || isStudentAccount) {
            showLoginAlert("Selected login type does not match these credentials.");
            return;
        }

        const matchedCoach = (state.coaches || []).find(c =>
            (c.email && c.email.toLowerCase() === emailLower) ||
            (c.id && c.id.toLowerCase() === emailLower) ||
            (c.username && c.username.toLowerCase() === emailLower)
        );

        if (!matchedCoach || matchedCoach.password !== passwordVal) {
            showLoginAlert("Invalid coach credentials. Please register first if you are a new coach.");
            return;
        }

        state.currentUser = matchedCoach;
        initCoachPortal(matchedCoach);

    } else if (state.currentRole === 'admin') {
        if (isStudentAccount || isCoachAccount) {
            showLoginAlert("Selected login type does not match these credentials.");
            return;
        }

        const matchedAdmin = ADMIN_USERS.find(a =>
            (a.email && a.email.toLowerCase() === emailLower) ||
            (a.aliasEmail && a.aliasEmail.toLowerCase() === emailLower) ||
            (a.username && a.username.toLowerCase() === emailLower) ||
            (a.aliasUsername && a.aliasUsername.toLowerCase() === emailLower) ||
            (a.id && a.id.toLowerCase() === emailLower)
        );

        if (!matchedAdmin || matchedAdmin.password !== passwordVal) {
            showLoginAlert("Invalid admin email/username or password.");
            return;
        }

        state.currentUser = matchedAdmin;
        initAdminPortal(matchedAdmin);
    }
}

export function showLoginAlert(msg) {
    const alertBox = document.getElementById('login-alert');
    const msgSpan = document.getElementById('login-alert-msg');
    if (alertBox && msgSpan) {
        msgSpan.textContent = msg;
        alertBox.classList.remove('d-none');
    }
}

export function hideLoginAlert() {
    const alertBox = document.getElementById('login-alert');
    if (alertBox) alertBox.classList.add('d-none');
}

export function showLoginView(e) {
    if (e) e.preventDefault();
    hideAllViews();
    const loginView = document.getElementById('login-view');
    if (loginView) loginView.classList.remove('d-none');
}
