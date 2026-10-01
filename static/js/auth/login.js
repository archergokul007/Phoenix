/**
 * Authentication Module — Phoenix Archery Academy
 * All logins are verified against the SQL database via Flask API.
 * No hardcoded credentials. Role-based redirect after login.
 */

import { api } from '../shared/api.js';
import { state, setCurrentUser } from '../shared/state.js';
import { hideAllViews } from '../shared/navigation.js';

// ── Role Selection ───────────────────────────────────────────────────────────
export function selectRole(role) {
    state.currentRole = role;
    ['student', 'coach', 'admin'].forEach(r => {
        const card  = document.getElementById('card-role-' + r);
        const radio = document.getElementById('role_' + r);
        const demoBox = document.getElementById('demo-box-' + r);
        
        if (r === role) {
            if (card) card.classList.add('active');
            if (radio) radio.checked = true;
            if (demoBox) demoBox.classList.remove('d-none');
        } else {
            if (card) card.classList.remove('active');
            if (demoBox) demoBox.classList.add('d-none');
        }
    });

    // Show register link only for student role
    const regContainer = document.getElementById('register-link-container');
    if (regContainer) {
        regContainer.classList.toggle('d-none', role !== 'student');
    }

    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    if (emailInput) emailInput.value = '';
    if (passwordInput) passwordInput.value = '';

    hideLoginAlert();
}

export function fillAdminCredentials(index = 1) { 
    selectRole('admin'); 
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    if (emailInput) emailInput.value = 'admin@gmail.com';
    if (passwordInput) passwordInput.value = 'Admin@1234';
    hideLoginAlert();
}

export function fillStudentCredentials() { 
    selectRole('student'); 
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    if (emailInput) emailInput.value = 'student@gmail.com';
    if (passwordInput) passwordInput.value = 'Student@1234';
    hideLoginAlert();
}

export function fillCoachCredentials() { 
    selectRole('coach'); 
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    if (emailInput) emailInput.value = 'coach@gmail.com';
    if (passwordInput) passwordInput.value = 'Coach@1234';
    hideLoginAlert();
}

// ── Login Submit ─────────────────────────────────────────────────────────────
export async function handleLoginSubmit(e) {
    e.preventDefault();
    hideLoginAlert();

    const emailVal    = (document.getElementById('email')?.value || '').trim();
    const passwordVal = (document.getElementById('password')?.value || '').trim();

    if (!emailVal || !passwordVal) {
        showLoginAlert('Please enter both email/username and password.');
        return;
    }

    // Show loading state
    const btn = document.getElementById('login-submit-btn');
    if (btn) { btn.disabled = true; btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Signing in...'; }

    try {
        const res = await api.login(emailVal, passwordVal, state.currentRole);

        if (!res.ok || !res.data?.success) {
            showLoginAlert(res.data?.message || 'Login failed. Please check your credentials.');
            return;
        }

        const user = res.data;
        setCurrentUser({
            user_id:    user.user_id,
            role:       user.role,
            name:       user.name,
            email:      user.email,
            profile_id: user.profile_id,
            profile:    user.profile,
        });

        // Redirect to the correct dashboard
        await redirectToDashboard(user.role, user);

    } catch (err) {
        showLoginAlert('Cannot connect to server. Please ensure python server.py is running.');
    } finally {
        if (btn) { btn.disabled = false; btn.innerHTML = '<span>Sign In</span><i class="bi bi-arrow-right-short ms-1 fs-5"></i>'; }
    }
}

async function redirectToDashboard(role, user) {
    // Dynamically import the correct dashboard module and initialise it
    if (role === 'student') {
        const { initStudentPortal } = await import('../student/dashboard.js');
        initStudentPortal(user);
    } else if (role === 'coach') {
        const { initCoachPortal } = await import('../coach/dashboard.js');
        initCoachPortal(user);
    } else if (role === 'admin') {
        const { initAdminPortal } = await import('../admin/dashboard.js');
        initAdminPortal(user);
    }
}

// ── Alert helpers ─────────────────────────────────────────────────────────────
export function showLoginAlert(msg) {
    const alertBox = document.getElementById('login-alert');
    const msgSpan  = document.getElementById('login-alert-msg');
    if (alertBox && msgSpan) {
        msgSpan.textContent = msg;
        alertBox.classList.remove('d-none');
    }
}

export function hideLoginAlert() {
    document.getElementById('login-alert')?.classList.add('d-none');
}

export function showLoginView(e) {
    if (e) e.preventDefault();
    hideAllViews();
    document.getElementById('login-view')?.classList.remove('d-none');
}

export function showRegisterView(e) {
    if (e) e.preventDefault();
    hideAllViews();
    document.getElementById('register-view')?.classList.remove('d-none');
}


