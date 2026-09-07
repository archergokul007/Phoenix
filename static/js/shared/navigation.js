/**
 * Navigation & Page Routing Helper Module
 * Manages role badges, dynamic navbar items, page switching, and sign-out handlers.
 */

import { state } from './state.js';
import { selectRole, showLoginView } from '../auth/login.js';
import { showGlobalAlert } from './alerts.js';

export function hideAllViews() {
    document.querySelectorAll('.view-section').forEach(sec => sec.classList.add('d-none'));
}

function updateNavActiveLink(sectionId) {
    const navLinks = document.querySelectorAll('#nav-links .nav-link');
    navLinks.forEach(link => {
        const targetSection = link.getAttribute('data-target');
        if (targetSection === sectionId) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

export function showSection(sectionId) {
    hideAllViews();
    const target = document.getElementById(sectionId);
    if (target) target.classList.remove('d-none');
    updateNavActiveLink(sectionId);
}

export function showNavbar(role, displayName) {
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

    if (navLinks) {
        if (role === 'student') {
            navLinks.innerHTML = `
                <li class="nav-item"><a class="nav-link active" data-target="student-view" href="#" onclick="showSection('student-view')"><i class="bi bi-grid-fill me-1"></i> Dashboard</a></li>
                <li class="nav-item"><a class="nav-link" data-target="student-profile-section" href="#student-profile-section"><i class="bi bi-person-badge me-1"></i> My Profile</a></li>
                <li class="nav-item"><a class="nav-link" data-target="student-performance-section" href="#student-performance-section"><i class="bi bi-graph-up-arrow me-1"></i> My Performance</a></li>
                <li class="nav-item"><a class="nav-link" data-target="student-events-section" href="#student-events-section"><i class="bi bi-calendar-event me-1"></i> Published Events</a></li>
            `;
        } else if (role === 'coach') {
            navLinks.innerHTML = `
                <li class="nav-item"><a class="nav-link active" data-target="coach-view" href="#" onclick="showSection('coach-view')"><i class="bi bi-speedometer2 me-1"></i> Coach Home</a></li>
                <li class="nav-item"><a class="nav-link" data-target="coach-search-section" href="#coach-search-section"><i class="bi bi-search me-1"></i> Student Search</a></li>
                <li class="nav-item"><a class="nav-link" data-target="coach-events-section" href="#coach-events-section"><i class="bi bi-calendar-event me-1"></i> Published Events</a></li>
            `;
        } else if (role === 'admin') {
            navLinks.innerHTML = `
                <li class="nav-item"><a class="nav-link active" data-target="admin-view" href="#" onclick="showSection('admin-view')"><i class="bi bi-shield-lock me-1"></i> Admin Home</a></li>
                <li class="nav-item"><a class="nav-link" data-target="admin-publish-section" href="#admin-publish-section"><i class="bi bi-megaphone me-1"></i> Publish Events</a></li>
                <li class="nav-item"><a class="nav-link" data-target="admin-events-list-section" href="#admin-events-list-section"><i class="bi bi-list-check me-1"></i> Published Events</a></li>
            `;
        }
    }
}

export function navigateToRoleHome(e) {
    if (e) e.preventDefault();
    if (!state.currentUser) {
        showLoginView();
    } else if (state.currentRole === 'student') {
        showSection('student-view');
    } else if (state.currentRole === 'coach') {
        showSection('coach-view');
    } else if (state.currentRole === 'admin') {
        showSection('admin-view');
    }
}

export function handleLogout() {
    state.currentUser = null;
    hideAllViews();
    const navbar = document.getElementById('main-navbar');
    if (navbar) navbar.classList.add('d-none');
    selectRole('student');
    showLoginView();
    showGlobalAlert("You have been signed out successfully.", "info");
}
