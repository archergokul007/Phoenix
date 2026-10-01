/**
 * Registration Module — Phoenix Archery Academy
 * Student and Coach self-registration via Flask/MySQL API.
 * No localStorage, no hardcoded admin credentials.
 */

import { state } from '../shared/state.js';
import { hideAllViews } from '../shared/navigation.js';
import { showLoginView } from '../auth/login.js';
import { showGlobalAlert } from '../shared/alerts.js';
import { api } from '../shared/api.js';

// ── View helpers ──────────────────────────────────────────────────────────────

export function showRegisterView(e) {
    if (e) e.preventDefault();
    hideAllViews();
    const regView = document.getElementById('register-view');
    if (regView) regView.classList.remove('d-none');
    document.getElementById('register-alert')?.classList.add('d-none');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

export function showCoachRegisterView(e) {
    if (e) e.preventDefault();
    hideAllViews();
    const coachRegView = document.getElementById('coach-register-view');
    if (coachRegView) coachRegView.classList.remove('d-none');
    document.getElementById('coach-register-alert')?.classList.add('d-none');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── Age Category Auto-Select ──────────────────────────────────────────────────

export function handleAgeCategoryAutoSelect(ageVal) {
    const ageSelect = document.getElementById('reg_age_category');
    if (!ageSelect || !ageVal) return;
    const age = parseInt(ageVal, 10);
    if (isNaN(age) || age < 1) return;
    if      (age < 10)  ageSelect.value = 'Under-10 (Mini Sub-Junior)';
    else if (age <= 13) ageSelect.value = 'Under-14 (Sub-Junior)';
    else if (age <= 16) ageSelect.value = 'Under-17 (Cadet / Youth)';
    else if (age <= 20) ageSelect.value = 'Under-21 (Junior)';
    else if (age <= 49) ageSelect.value = 'Senior (21+ Years)';
    else                ageSelect.value = 'Masters (50+ Years)';
}

// ── Student Registration ──────────────────────────────────────────────────────

export async function handleRegisterSubmit(e) {
    if (e) e.preventDefault();

    const alertBox = document.getElementById('register-alert');
    const msgSpan  = document.getElementById('register-alert-msg');
    if (alertBox) alertBox.classList.add('d-none');

    const get = id => document.getElementById(id)?.value.trim() || '';

    const name            = get('reg_name');
    const gender          = get('reg_gender');
    const ageVal          = get('reg_age');
    const ageCategory     = get('reg_age_category');
    const phone           = get('reg_phone');
    const currentStatus   = get('reg_current_status');
    const bowCategory     = get('reg_bow_category');
    const bowType         = get('reg_bow_type');
    const experience      = get('reg_experience');
    const email           = get('reg_email');
    const username        = get('reg_username');
    const password        = document.getElementById('reg_password')?.value || '';
    const confirmPassword = document.getElementById('reg_confirm_password')?.value || '';

    function showError(msg) {
        if (msgSpan) msgSpan.textContent = msg;
        if (alertBox) alertBox.classList.remove('d-none');
    }

    if (!name || !gender || !ageVal || !ageCategory || !phone || !currentStatus ||
        !bowCategory || !bowType || !experience || !email || !username || !password || !confirmPassword) {
        showError('Please fill in all required fields.');
        return;
    }

    const age = parseInt(ageVal, 10);
    if (isNaN(age) || age < 5 || age > 99) { showError('Please enter a valid age (5–99).'); return; }
    if (!/^[0-9]{10}$/.test(phone))        { showError('Please enter a valid 10-digit mobile number.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showError('Please enter a valid email address.'); return; }
    if (username.length < 3)               { showError('Username must be at least 3 characters.'); return; }
    if (password.length < 6)               { showError('Password must be at least 6 characters.'); return; }
    if (password !== confirmPassword)       { showError('Passwords do not match.'); return; }

    // Split full name
    const nameParts = name.split(/\s+/);
    const firstName = nameParts[0];
    const lastName  = nameParts.slice(1).join(' ') || '';

    // Submit to MySQL via Flask API
    const btn = document.getElementById('register-submit-btn');
    if (btn) { btn.disabled = true; btn.textContent = 'Registering...'; }

    try {
        const res = await api.registerStudent({
            first_name:     firstName,
            last_name:      lastName,
            gender,
            age,
            age_category:   ageCategory,
            phone,
            current_status: currentStatus,
            bow_category:   bowCategory,
            bow_type:       bowType,
            experience,
            email,
            username,
            password,
        });

        if (res.ok && res.data?.success) {
            showGlobalAlert(
                `Registration successful for ${name}! Your Student ID: ${res.data.student_id || ''}. You can now log in.`,
                'success'
            );
            document.getElementById('register-form')?.reset();
            // Pre-fill login form
            const emailField    = document.getElementById('email');
            const passwordField = document.getElementById('password');
            if (emailField)    emailField.value    = email;
            if (passwordField) passwordField.value = password;
            showLoginView();
        } else {
            showError(res.data?.message || 'Registration failed. Please try again.');
        }
    } catch (err) {
        showError('Cannot connect to server. Please ensure python server.py is running.');
    } finally {
        if (btn) { btn.disabled = false; btn.textContent = 'Register'; }
    }
}

// ── Coach Registration (Admin-approved) ───────────────────────────────────────

export async function handleCoachRegisterSubmit(e) {
    if (e) e.preventDefault();

    const alertBox = document.getElementById('coach-register-alert');
    const msgSpan  = document.getElementById('coach-register-alert-msg');
    if (alertBox) alertBox.classList.add('d-none');

    const get = id => document.getElementById(id)?.value.trim() || '';

    const name           = get('coach_reg_name');
    const gender         = get('coach_reg_gender');
    const ageVal         = get('coach_reg_age');
    const phone          = get('coach_reg_phone');
    const specialization = get('coach_reg_specialization');
    const certification  = get('coach_reg_certification');
    const experience     = get('coach_reg_experience');
    const campus         = get('coach_reg_campus');
    const bio            = get('coach_reg_bio');
    const email          = get('coach_reg_email');
    const username       = get('coach_reg_username');
    const password       = document.getElementById('coach_reg_password')?.value || '';
    const confirmPassword = document.getElementById('coach_reg_confirm_password')?.value || '';

    function showError(msg) {
        if (msgSpan) msgSpan.textContent = msg;
        if (alertBox) alertBox.classList.remove('d-none');
    }

    if (!name || !gender || !ageVal || !phone || !specialization || !certification ||
        !experience || !campus || !email || !username || !password || !confirmPassword) {
        showError('Please fill in all required fields.');
        return;
    }

    const age = parseInt(ageVal, 10);
    if (isNaN(age) || age < 18 || age > 80) { showError('Coach age must be between 18 and 80.'); return; }
    if (!/^[0-9]{10}$/.test(phone))         { showError('Please enter a valid 10-digit mobile number.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showError('Please enter a valid email address.'); return; }
    if (username.length < 3)                { showError('Username must be at least 3 characters.'); return; }
    if (password.length < 6)               { showError('Password must be at least 6 characters.'); return; }
    if (password !== confirmPassword)       { showError('Passwords do not match.'); return; }

    const btn = document.getElementById('coach-register-submit-btn');
    if (btn) { btn.disabled = true; btn.textContent = 'Registering...'; }

    try {
        const res = await api.registerCoach({
            coach_name:      name,
            gender,
            age,
            phone,
            specialization,
            certification,
            experience,
            assigned_campus: campus,
            bio:             bio || `Archery Coach specializing in ${specialization}.`,
            email,
            username,
            password,
        });

        if (res.ok && res.data?.success) {
            showGlobalAlert(
                `Coach registration submitted for ${name}! Coach ID: ${res.data.coach_id || ''}. Await admin approval before logging in.`,
                'success'
            );
            document.getElementById('coach-register-form')?.reset();
            const emailField    = document.getElementById('email');
            const passwordField = document.getElementById('password');
            if (emailField)    emailField.value    = email;
            if (passwordField) passwordField.value = password;
            showLoginView();
        } else {
            showError(res.data?.message || 'Coach registration failed. Please try again.');
        }
    } catch (err) {
        showError('Cannot connect to server. Please ensure python server.py is running.');
    } finally {
        if (btn) { btn.disabled = false; btn.textContent = 'Register'; }
    }
}
