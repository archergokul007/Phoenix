/**
 * Authentication Module
 * Handles role selection, demo credential autofill, login form validation, and credential verification.
 */

import { state, COACH_CREDENTIALS, ADMIN_CREDENTIALS } from '../shared/state.js';
import { hideAllViews } from '../shared/navigation.js';
import { initStudentPortal } from '../student/dashboard.js';
import { initCoachPortal } from '../coach/dashboard.js';
import { initAdminPortal } from '../admin/dashboard.js';

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

export function fillDemoCredentials(role) {
    selectRole(role);
}

export function handleLoginSubmit(e) {
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

    if (state.currentRole === 'student') {
        const matchedStu = state.students.find(s =>
            s.email.toLowerCase() === emailLower ||
            s.id.toLowerCase() === emailLower ||
            s.firstName.toLowerCase() === emailLower
        );

        if (emailLower === COACH_CREDENTIALS.email.toLowerCase() || emailLower === ADMIN_CREDENTIALS.email.toLowerCase()) {
            showLoginAlert("Selected login type does not match these credentials.");
            return;
        }

        if (!matchedStu || matchedStu.password !== passwordVal) {
            showLoginAlert("Invalid student email/username or password.");
            return;
        }

        state.currentUser = matchedStu;
        initStudentPortal(matchedStu);

    } else if (state.currentRole === 'coach') {
        const isStudentCred = state.students.some(s => s.email.toLowerCase() === emailLower || s.id.toLowerCase() === emailLower);
        if (isStudentCred || emailLower === ADMIN_CREDENTIALS.email.toLowerCase()) {
            showLoginAlert("Selected login type does not match these credentials.");
            return;
        }

        if (emailLower !== COACH_CREDENTIALS.email.toLowerCase() || passwordVal !== COACH_CREDENTIALS.password) {
            showLoginAlert("Invalid coach email/username or password.");
            return;
        }

        state.currentUser = COACH_CREDENTIALS;
        initCoachPortal();

    } else if (state.currentRole === 'admin') {
        const isStudentCred = state.students.some(s => s.email.toLowerCase() === emailLower || s.id.toLowerCase() === emailLower);
        if (isStudentCred || emailLower === COACH_CREDENTIALS.email.toLowerCase()) {
            showLoginAlert("Selected login type does not match these credentials.");
            return;
        }

        if (emailLower !== ADMIN_CREDENTIALS.email.toLowerCase() || passwordVal !== ADMIN_CREDENTIALS.password) {
            showLoginAlert("Invalid admin email/username or password.");
            return;
        }

        state.currentUser = ADMIN_CREDENTIALS;
        initAdminPortal();
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
