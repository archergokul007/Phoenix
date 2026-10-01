/**
 * Student Dashboard — Phoenix Archery Academy
 * Fetches all data from Flask API (SQL-backed).
 * Student sees ONLY their own data. No search box, no edit controls.
 */

import { api } from '../shared/api.js';
import { state, clearCurrentUser } from '../shared/state.js';
import { hideAllViews } from '../shared/navigation.js';
import { showLoginView } from '../auth/login.js';

// ── Entry Point ───────────────────────────────────────────────────────────────
export async function initStudentPortal(user) {
    state.currentUser = user;
    state.currentRole = 'student';

    hideAllViews();
    const studentView = document.getElementById('student-view');
    if (studentView) studentView.classList.remove('d-none');

    // Load student HTML module if needed
    await ensureStudentDashboardLoaded();

    // Set header info
    setEl('stu-welcome-name', `Welcome, ${user.name || 'Student'}!`);
    setEl('stu-header-id',    user.profile_id || '—');
    setEl('stu-card-id',      user.profile_id || '—');

    // Update status badge to show DB mode
    setEl('stu-db-status', '<i class="bi bi-database-check me-1"></i>MySQL Connected', true);

    // Load all data concurrently
    await Promise.all([
        loadStudentProfile(),
        loadStudentPerformance(),
        loadStudentAttendance(),
        loadStudentBowMaintenance(),
        loadStudentFees(),
        loadStudentNotifications(),
    ]);
}

function setEl(id, val, html = false) {
    const el = document.getElementById(id);
    if (!el) return;
    if (html) el.innerHTML = val;
    else el.textContent = val;
}

function card(icon, title, value, color = 'primary') {
    return `<div class="col-md-3 col-sm-6"><div class="stat-card border-start border-4 border-${color}">
        <div class="stat-label">${title}</div>
        <div class="stat-value text-${color}">${value}</div>
        <i class="bi ${icon} stat-icon"></i>
    </div></div>`;
}

function emptyRow(colspan, msg = 'No records found.') {
    return `<tr><td colspan="${colspan}" class="text-center text-muted py-4"><i class="bi bi-inbox me-2"></i>${msg}</td></tr>`;
}

// ── Profile ───────────────────────────────────────────────────────────────────
async function loadStudentProfile() {
    const res = await api.getStudentProfile();
    if (!res.ok || !res.data?.success) return;
    const s   = res.data.student;
    const name = `${s.first_name || ''} ${s.last_name || ''}`.trim();

    setEl('stu-welcome-name',  `Welcome, ${name}!`);
    setEl('stu-header-dept',   s.bow_category || s.bow_type || '—');
    setEl('stu-profile-name',  name);
    setEl('stu-profile-email', s.email || '—');
    setEl('stu-profile-phone', s.phone || '—');
    setEl('stu-profile-gender', s.gender || '—');
    setEl('stu-profile-bow',   `${s.bow_category || ''} / ${s.bow_type || ''}`);
    setEl('stu-profile-exp',   s.experience || '—');
    setEl('stu-profile-cat',   s.age_category || '—');
    setEl('stu-profile-status', s.status || 'active');
    setEl('stu-profile-join',  s.joining_date || '—');
}

// ── Performance ───────────────────────────────────────────────────────────────
async function loadStudentPerformance() {
    const res = await api.getStudentPerformance();
    const tbody = document.getElementById('stu-performance-tbody');
    if (!tbody) return;

    if (!res.ok || !res.data?.success || !res.data.performance?.length) {
        tbody.innerHTML = emptyRow(7, 'No performance records yet. Your coach will add them after your sessions.');
        setEl('stu-card-overall', '—');
        return;
    }

    const rows = res.data.performance;
    // Compute latest accuracy for stat card
    const latest = rows[0];
    setEl('stu-card-overall', latest.accuracy ? `${latest.accuracy}%` : `${latest.score || '—'}`);

    tbody.innerHTML = rows.map(r => `
        <tr>
            <td>${r.performance_date || '—'}</td>
            <td><span class="badge bg-primary">${r.score ?? '—'}</span></td>
            <td>${r.total_arrows ?? '—'}</td>
            <td>${r.accuracy != null ? r.accuracy + '%' : '—'}</td>
            <td>${r.distance || '—'}</td>
            <td>${r.category || '—'}</td>
            <td><span class="text-muted small">${r.remarks || '—'}</span></td>
        </tr>
    `).join('');
}

// ── Attendance ─────────────────────────────────────────────────────────────────
async function loadStudentAttendance() {
    const res = await api.getStudentAttendance();
    const tbody = document.getElementById('stu-attendance-tbody');
    if (!tbody) return;

    if (!res.ok || !res.data?.success || !res.data.attendance?.length) {
        tbody.innerHTML = emptyRow(4, 'No attendance records found.');
        setEl('stu-card-attendance', '—');
        return;
    }

    const rows    = res.data.attendance;
    const present = rows.filter(r => r.status === 'present').length;
    const total   = rows.length;
    const pct     = total > 0 ? Math.round((present / total) * 100) : 0;
    setEl('stu-card-attendance', `${pct}%`);

    const statusBadge = { present: 'success', absent: 'danger', leave: 'warning', late: 'info' };
    tbody.innerHTML = rows.map(r => `
        <tr>
            <td>${r.attendance_date || '—'}</td>
            <td><span class="badge bg-${statusBadge[r.status] || 'secondary'}">${r.status}</span></td>
            <td>${r.coach_name || '—'}</td>
            <td><span class="text-muted small">${r.remarks || '—'}</span></td>
        </tr>
    `).join('');
}

// ── Bow Maintenance ────────────────────────────────────────────────────────────
async function loadStudentBowMaintenance() {
    const res = await api.getStudentBowMaintenance();
    const tbody = document.getElementById('stu-bow-maintenance-tbody');
    if (!tbody) return;

    if (!res.ok || !res.data?.success || !res.data.bow_maintenance?.length) {
        tbody.innerHTML = emptyRow(7, 'No maintenance records found.');
        return;
    }

    const conditionBadge = { excellent: 'success', good: 'primary', fair: 'warning', poor: 'danger', needs_repair: 'danger' };
    tbody.innerHTML = res.data.bow_maintenance.map(r => `
        <tr>
            <td>${r.equipment_name || '—'}</td>
            <td>${r.equipment_number || '—'}</td>
            <td>${r.maintenance_date || '—'}</td>
            <td><span class="badge bg-${conditionBadge[r.condition] || 'secondary'}">${r.condition || '—'}</span></td>
            <td>${r.maintenance_details || '—'}</td>
            <td>${r.next_maintenance_date || '—'}</td>
            <td><span class="text-muted small">${r.remarks || '—'}</span></td>
        </tr>
    `).join('');
}

// ── Fees ───────────────────────────────────────────────────────────────────────
async function loadStudentFees() {
    const res = await api.getStudentFees();
    const tbody = document.getElementById('stu-fees-tbody');
    if (!tbody) return;

    if (!res.ok || !res.data?.success || !res.data.fees?.length) {
        tbody.innerHTML = emptyRow(6, 'No fee records found.');
        setEl('stu-card-fees', '—');
        return;
    }

    const rows    = res.data.fees;
    const pending = rows.filter(r => r.payment_status === 'pending' || r.payment_status === 'overdue');
    setEl('stu-card-fees', pending.length > 0 ? `${pending.length} Pending` : 'All Clear');

    const statusBadge = { paid: 'success', pending: 'warning', overdue: 'danger' };
    tbody.innerHTML = rows.map(r => `
        <tr>
            <td>${r.fee_type || '—'}</td>
            <td>₹${parseFloat(r.amount || 0).toFixed(2)}</td>
            <td>${r.due_date || '—'}</td>
            <td>${r.payment_date || '—'}</td>
            <td><span class="badge bg-${statusBadge[r.payment_status] || 'secondary'}">${r.payment_status}</span></td>
            <td><span class="text-muted small">${r.transaction_reference || '—'}</span></td>
        </tr>
    `).join('');
}

// ── Notifications ──────────────────────────────────────────────────────────────
async function loadStudentNotifications() {
    const res   = await api.getStudentNotifications();
    const tbody = document.getElementById('stu-notifications-tbody');
    if (!tbody) return;

    if (!res.ok || !res.data?.success || !res.data.notifications?.length) {
        tbody.innerHTML = emptyRow(3, 'No notifications.');
        return;
    }

    const rows = res.data.notifications;
    const unread = rows.filter(r => !r.is_read).length;
    if (unread > 0) {
        const badge = document.getElementById('stu-notif-badge');
        if (badge) { badge.textContent = unread; badge.classList.remove('d-none'); }
    }

    tbody.innerHTML = rows.map(r => `
        <tr class="${r.is_read ? '' : 'table-warning fw-semibold'}">
            <td>${r.title || '—'}</td>
            <td>${r.message || '—'}</td>
            <td>${(r.created_at || '').substring(0, 16) || '—'}</td>
        </tr>
    `).join('');
}

// ── Ensure dashboard HTML is loaded ────────────────────────────────────────────
async function ensureStudentDashboardLoaded() {
    const container = document.getElementById('student-view');
    if (!container) return;
    // If content already loaded (static HTML), skip fetch
    if (container.querySelector('#stu-performance-tbody')) return;
    try {
        const res = await fetch('/pages/student/dashboard.html');
        if (res.ok) container.innerHTML = await res.text();
    } catch (e) {}
}

// ── Logout ─────────────────────────────────────────────────────────────────────
export async function handleLogout() {
    await api.logout();
    clearCurrentUser();
    hideAllViews();
    showLoginView();
}

// Expose globally for onclick handlers in HTML
window.handleLogout = handleLogout;
