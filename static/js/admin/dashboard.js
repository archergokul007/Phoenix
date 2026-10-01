/**
 * Admin Dashboard Module — Phoenix Archery Academy
 * All data fetched from MySQL via Flask API.
 * Coach reports, student search, stats, notifications, fees, activity logs.
 */

import { api } from '../shared/api.js';
import { state } from '../shared/state.js';
import { hideAllViews, showNavbar } from '../shared/navigation.js';

let _adminSearchedStudentId = null;

// ─────────────────────────────────────────────────────────────────────────────
// ENTRY POINT
// ─────────────────────────────────────────────────────────────────────────────

export async function initAdminPortal(adminUser) {
    state.currentUser = adminUser;
    state.currentRole = 'admin';

    hideAllViews();
    const adminView = document.getElementById('admin-view');
    if (adminView) adminView.classList.remove('d-none');

    await ensureAdminDashboardLoaded();

    // Set welcome header
    const adminName = adminUser.name || 'Administrator';
    setEl('admin-welcome-heading', `Welcome, ${adminName}!`);

    showNavbar('admin', adminName);

    _adminSearchedStudentId = null;
    hideAdminStudentPanel();

    // Load all data
    await Promise.all([
        loadAdminStats(),
        loadAdminCoachReports(),
        loadAdminNotifications(),
        loadAllStudentsTable(),
        loadAdminFees(),
    ]);
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function setEl(id, val, html = false) {
    const el = document.getElementById(id);
    if (!el) return;
    if (html) el.innerHTML = val;
    else el.textContent = val;
}

function emptyRow(colspan, msg = 'No records found.') {
    return `<tr><td colspan="${colspan}" class="text-center text-muted py-4"><i class="bi bi-inbox me-2"></i>${msg}</td></tr>`;
}

function showToast(msg, type = 'success') {
    const existing = document.getElementById('admin-toast-container');
    if (existing) existing.remove();
    const div = document.createElement('div');
    div.id = 'admin-toast-container';
    div.style.cssText = 'position:fixed;top:1.5rem;right:1.5rem;z-index:9999;';
    div.innerHTML = `
        <div class="toast show align-items-center text-bg-${type} border-0 rounded-3 shadow-lg" role="alert">
            <div class="d-flex p-3">
                <div class="toast-body fw-semibold">
                    <i class="bi bi-${type === 'success' ? 'check-circle' : 'exclamation-triangle'} me-2"></i>${msg}
                </div>
                <button type="button" class="btn-close btn-close-white ms-auto" onclick="this.closest('#admin-toast-container').remove()"></button>
            </div>
        </div>`;
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 4000);
}

// ─────────────────────────────────────────────────────────────────────────────
// STATS
// ─────────────────────────────────────────────────────────────────────────────

async function loadAdminStats() {
    const res = await api.getAdminDashboardStats();
    if (!res.ok || !res.data?.success) return;
    const s = res.data.stats;
    setEl('admin-stat-students-count', s.students ?? '0');
    setEl('admin-stat-coaches-count', s.coaches ?? '0');
    setEl('admin-reports-count', s.reports ?? '0');
    setEl('admin-unread-notifs-count', s.unread_notifications ?? '0');
    setEl('admin-pending-fees-count', s.pending_fees ?? '0');
}

// ─────────────────────────────────────────────────────────────────────────────
// STUDENT SEARCH
// ─────────────────────────────────────────────────────────────────────────────

export async function handleAdminStudentSearch(e) {
    if (e) e.preventDefault();
    const input = document.getElementById('admin-student-search-input');
    const query = (input ? input.value : '').trim().toUpperCase();
    const msgEl = document.getElementById('admin-search-msg');

    if (!query) {
        if (msgEl) {
            msgEl.className = 'alert alert-warning mt-2';
            msgEl.textContent = 'Please enter a Student ID.';
            msgEl.classList.remove('d-none');
        }
        hideAdminStudentPanel();
        return;
    }

    if (msgEl) {
        msgEl.className = 'alert alert-info mt-2';
        msgEl.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Searching...';
        msgEl.classList.remove('d-none');
    }

    const res = await api.adminSearchStudent(query);

    if (!res.ok || !res.data?.success) {
        if (msgEl) {
            msgEl.className = 'alert alert-danger mt-2';
            msgEl.innerHTML = `<i class="bi bi-exclamation-circle me-2"></i>${res.data?.message || 'Student not found.'}`;
        }
        hideAdminStudentPanel();
        return;
    }

    const student = res.data.student;
    _adminSearchedStudentId = student.student_id;

    if (msgEl) {
        msgEl.className = 'alert alert-success mt-2';
        msgEl.innerHTML = `<i class="bi bi-check-circle me-2"></i>Student Found: <strong>${student.first_name} ${student.last_name || ''}</strong> (${student.student_id})`;
    }

    renderAdminStudentProfile(student);

    // Load related data
    await Promise.all([
        loadAdminStudentPerformanceData(student.student_id),
        loadAdminStudentAttendanceData(student.student_id),
        loadAdminStudentBowMaintenanceData(student.student_id),
        loadAdminStudentFeesData(student.student_id),
        loadAdminStudentReports(student.student_id),
    ]);

    const panel = document.getElementById('admin-student-panel');
    if (panel) {
        panel.classList.remove('d-none');
        panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function renderAdminStudentProfile(s) {
    setEl('asp-student-id',   s.student_id   || '—');
    setEl('asp-student-name', `${s.first_name || ''} ${s.last_name || ''}`.trim() || '—');
    setEl('asp-student-age',  s.age_category  || '—');
    setEl('asp-student-category', s.bow_category || '—');
    setEl('asp-student-bowtype',  s.bow_type     || '—');
    setEl('asp-student-email',    s.email        || '—');
    setEl('asp-student-phone',    s.phone        || '—');
    setEl('asp-student-course',   s.experience   || '—');
}

async function loadAdminStudentPerformanceData(studentId) {
    const res = await api.getAdminStudentPerformance(studentId);
    const tbody = document.getElementById('asp-eval-history-tbody');
    if (!tbody) return;
    if (!res.ok || !res.data?.success || !res.data.performance?.length) {
        tbody.innerHTML = emptyRow(5, 'No performance records.');
        return;
    }
    // Also update summary cards
    const latest = res.data.performance[0];
    setEl('asp-training-score',    latest.score     != null ? `${latest.score}/300`  : '—');
    setEl('asp-tournament-score',  latest.score     != null ? `${latest.score}`       : '—');
    setEl('asp-accuracy',          latest.accuracy  != null ? `${latest.accuracy}%`  : '—');
    setEl('asp-progress',          latest.category  || '—');
    setEl('asp-ranking',           '—');
    setEl('asp-coach-remarks',     latest.remarks   || '—');
    setEl('asp-eval-date',         latest.performance_date || '—');

    tbody.innerHTML = res.data.performance.map(r => `
        <tr>
            <td class="small">${r.performance_date || '—'}</td>
            <td class="fw-bold">${r.score ?? '—'}</td>
            <td>${r.accuracy != null ? r.accuracy + '%' : '—'}</td>
            <td class="small text-secondary">${r.remarks || '—'}</td>
            <td class="small">${r.coach_name || '—'}</td>
        </tr>`).join('');
}

async function loadAdminStudentAttendanceData(studentId) {
    const res = await api.getAdminStudentAttendance(studentId);
    if (!res.ok || !res.data?.success) return;
    const att = res.data.attendance || [];
    const total   = att.length;
    const present = att.filter(a => a.status === 'present').length;
    const absent  = att.filter(a => a.status === 'absent').length;
    const leave   = att.filter(a => a.status === 'leave').length;
    const pct     = total > 0 ? ((present / total) * 100).toFixed(1) : '0';
    setEl('asp-total-classes', total);
    setEl('asp-present',  present);
    setEl('asp-absent',   absent);
    setEl('asp-leave',    leave);
    setEl('asp-att-pct',  `${pct}%`);
}

async function loadAdminStudentBowMaintenanceData(studentId) {
    const res = await api.getAdminStudentBowMaintenance(studentId);
    if (!res.ok || !res.data?.success || !res.data.bow_maintenance?.length) {
        setEl('asp-bow-condition', '—');
        setEl('asp-maint-status',  '—');
        setEl('asp-maint-date',    '—');
        setEl('asp-equip-issues',  '—');
        setEl('asp-maint-remarks', '—');
        return;
    }
    const latest = res.data.bow_maintenance[0];
    setEl('asp-bow-condition', latest.condition         || '—');
    setEl('asp-maint-status',  latest.status            || '—');
    setEl('asp-maint-date',    latest.maintenance_date  || '—');
    setEl('asp-equip-issues',  latest.maintenance_details || '—');
    setEl('asp-maint-remarks', latest.remarks           || '—');
}

async function loadAdminStudentFeesData(studentId) {
    const res = await api.getAdminStudentFees(studentId);
    const tbody = document.getElementById('asp-fees-tbody');
    if (!tbody) return;
    if (!res.ok || !res.data?.success || !res.data.fees?.length) {
        tbody.innerHTML = emptyRow(5, 'No fee records for this student.');
        return;
    }
    tbody.innerHTML = res.data.fees.map(f => {
        const badge = f.payment_status === 'paid' ? 'success' : f.payment_status === 'overdue' ? 'danger' : 'warning text-dark';
        return `<tr>
            <td class="small">${f.due_date || '—'}</td>
            <td>${f.fee_type || '—'}</td>
            <td class="fw-bold">₹${Number(f.amount || 0).toLocaleString('en-IN')}</td>
            <td><span class="badge bg-${badge}">${f.payment_status}</span></td>
            <td class="small text-muted">${f.remarks || '—'}</td>
        </tr>`;
    }).join('');
}

async function loadAdminStudentReports(studentId) {
    const res = await api.getAllReports(studentId);
    const tbody = document.getElementById('asp-coach-reports-tbody');
    if (!tbody) return;
    if (!res.ok || !res.data?.success || !res.data.reports?.length) {
        tbody.innerHTML = emptyRow(4, 'No coach reports for this student.');
        return;
    }
    tbody.innerHTML = res.data.reports.map(r => `
        <tr>
            <td class="small fw-semibold">${r.created_at ? r.created_at.split('T')[0] : '—'}</td>
            <td><span class="badge bg-warning text-dark">${r.report_title || 'Report'}</span></td>
            <td class="small">${r.report_message || '—'}</td>
            <td class="small text-secondary">${r.coach_name || '—'}</td>
        </tr>`).join('');
}

function hideAdminStudentPanel() {
    const panel = document.getElementById('admin-student-panel');
    if (panel) panel.classList.add('d-none');
}

// ─────────────────────────────────────────────────────────────────────────────
// ALL STUDENTS TABLE
// ─────────────────────────────────────────────────────────────────────────────

async function loadAllStudentsTable() {
    const res = await api.getAllStudents();
    const tbody = document.getElementById('admin-all-students-tbody');
    const countEl = document.getElementById('admin-stat-students-count');
    if (!tbody) return;
    if (!res.ok || !res.data?.success || !res.data.students?.length) {
        tbody.innerHTML = emptyRow(6, 'No students registered yet.');
        return;
    }
    const students = res.data.students;
    if (countEl) countEl.textContent = students.length;
    tbody.innerHTML = students.map(s => `
        <tr>
            <td><span class="badge bg-dark">${s.student_id}</span></td>
            <td class="fw-semibold">${s.first_name || ''} ${s.last_name || ''}</td>
            <td class="small text-muted">${s.email || '—'}</td>
            <td>${s.bow_category || s.bow_type || '—'}</td>
            <td>${s.experience || '—'}</td>
            <td><span class="badge bg-${s.status === 'active' ? 'success' : 'secondary'}">${s.status || 'active'}</span></td>
        </tr>`).join('');
}

// ─────────────────────────────────────────────────────────────────────────────
// COACH REPORTS (Activity Log Table)
// ─────────────────────────────────────────────────────────────────────────────

export async function renderAdminCoachReports() {
    const tbody = document.getElementById('admin-all-coach-reports-tbody');
    const badge = document.getElementById('admin-reports-count-badge');
    if (!tbody) return;

    const res = await api.getAllReports();
    if (!res.ok || !res.data?.success) {
        tbody.innerHTML = emptyRow(5, 'Unable to load reports.');
        return;
    }
    const reports = res.data.reports || [];
    if (badge) badge.textContent = `${reports.length} Reports`;

    if (reports.length === 0) {
        tbody.innerHTML = emptyRow(5, 'No coach activity reports yet.');
        return;
    }

    tbody.innerHTML = reports.map(r => `
        <tr>
            <td class="small fw-semibold">${r.created_at ? r.created_at.split('T')[0] : '—'}</td>
            <td><span class="badge bg-dark">${r.student_id || '—'}</span></td>
            <td><span class="badge bg-warning text-dark">${r.report_title || 'Report'}</span></td>
            <td class="small text-secondary" style="max-width:300px;">${r.report_message || '—'}</td>
            <td class="small">${r.coach_name || '—'}</td>
        </tr>`).join('');
}

async function loadAdminCoachReports() {
    await renderAdminCoachReports();
}

// ─────────────────────────────────────────────────────────────────────────────
// NOTIFICATIONS
// ─────────────────────────────────────────────────────────────────────────────

async function loadAdminNotifications() {
    const tbody = document.getElementById('admin-notifications-tbody');
    const badge = document.getElementById('admin-unread-notifs-count');
    if (!tbody) return;

    const res = await api.getAdminNotifications();
    if (!res.ok || !res.data?.success) {
        tbody.innerHTML = emptyRow(4, 'Unable to load notifications.');
        return;
    }
    const notifs = res.data.notifications || [];
    const unread = notifs.filter(n => !n.is_read).length;
    if (badge) badge.textContent = unread;

    if (notifs.length === 0) {
        tbody.innerHTML = emptyRow(4, 'No notifications yet.');
        return;
    }

    tbody.innerHTML = notifs.map(n => `
        <tr class="${n.is_read ? '' : 'table-warning fw-semibold'}">
            <td class="small">${n.created_at ? n.created_at.split('T')[0] : '—'}</td>
            <td><span class="badge bg-info text-dark">${n.notification_type || '—'}</span></td>
            <td class="small">${n.message || '—'}</td>
            <td>${n.is_read
                ? '<span class="badge bg-success">Read</span>'
                : `<button class="btn btn-xs btn-sm btn-outline-primary" onclick="adminMarkNotifRead(${n.notification_id})">Mark Read</button>`
            }</td>
        </tr>`).join('');
}

export async function adminMarkNotifRead(notifId) {
    await api.markAdminNotificationRead(notifId);
    await loadAdminNotifications();
}
window.adminMarkNotifRead = adminMarkNotifRead;

export async function adminMarkAllRead() {
    await api.markAllAdminNotificationsRead();
    await loadAdminNotifications();
}
window.adminMarkAllRead = adminMarkAllRead;

// ─────────────────────────────────────────────────────────────────────────────
// FEES MANAGEMENT (Admin)
// ─────────────────────────────────────────────────────────────────────────────

async function loadAdminFees() {
    const res = await api.getAllAdminFees();
    renderAdminFeesTable(res.ok && res.data?.success ? res.data.fees || [] : []);
}

export function renderAdminFeesTable(fees) {
    const tbody = document.getElementById('admin-fees-tbody');
    if (!tbody) return;

    let pending = 0, overdue = 0, collected = 0, total = fees.length;
    fees.forEach(f => {
        const amt = Number(f.amount || 0);
        if (f.payment_status === 'paid')    collected += amt;
        else if (f.payment_status === 'pending') pending += amt;
        else if (f.payment_status === 'overdue') overdue += amt;
    });

    setEl('admin-fee-pending',   `₹${pending.toLocaleString('en-IN')}`);
    setEl('admin-fee-overdue',   `₹${overdue.toLocaleString('en-IN')}`);
    setEl('admin-fee-collected', `₹${collected.toLocaleString('en-IN')}`);
    setEl('admin-fee-total-inv', total);

    if (fees.length === 0) {
        tbody.innerHTML = emptyRow(7, 'No fee records found.');
        return;
    }

    tbody.innerHTML = fees.map(f => {
        const badge = f.payment_status === 'paid' ? 'success' : f.payment_status === 'overdue' ? 'danger' : 'warning text-dark';
        return `<tr>
            <td class="ps-3"><span class="badge bg-dark">FEE-${f.fee_id}</span></td>
            <td>
                <div class="fw-bold text-dark">${f.first_name || ''} ${f.last_name || ''}</div>
                <small class="text-muted">${f.student_id || '—'}</small>
            </td>
            <td><div class="fw-semibold">${f.fee_type || '—'}</div><small>${f.remarks || ''}</small></td>
            <td class="fw-bold text-primary">₹${Number(f.amount || 0).toLocaleString('en-IN')}</td>
            <td class="small text-muted">${f.due_date || '—'}</td>
            <td><span class="badge bg-${badge} rounded-pill px-3 py-1">${f.payment_status}</span></td>
            <td class="text-end pe-3">
                ${f.payment_status === 'paid'
                    ? '<span class="badge bg-success-subtle text-success border"><i class="bi bi-check-circle me-1"></i>Paid</span>'
                    : `<button type="button" class="btn btn-sm btn-primary rounded-pill px-3" onclick="adminMarkFeePaid(${f.fee_id})"><i class="bi bi-check-circle me-1"></i>Record Pay</button>`
                }
            </td>
        </tr>`;
    }).join('');
}

export async function adminMarkFeePaid(feeId) {
    const payDate = new Date().toISOString().split('T')[0];
    const res = await api.markFeePaid(feeId, { payment_date: payDate, payment_method: 'Cash' });
    if (res.ok && res.data?.success) {
        showToast('Payment recorded successfully!', 'success');
        await loadAdminFees();
    } else {
        showToast(res.data?.message || 'Failed to record payment.', 'danger');
    }
}
window.adminMarkFeePaid = adminMarkFeePaid;

export async function handleAdminFeesFilter() {
    const status = document.getElementById('admin-fee-filter-status')?.value || '';
    const query  = document.getElementById('admin-fee-search')?.value.trim().toLowerCase() || '';
    const res    = await api.getAllAdminFees();
    let fees     = res.ok && res.data?.success ? res.data.fees || [] : [];
    if (status) fees = fees.filter(f => f.payment_status === status);
    if (query)  fees = fees.filter(f =>
        (f.student_id || '').toLowerCase().includes(query) ||
        (`${f.first_name} ${f.last_name}`).toLowerCase().includes(query) ||
        (f.fee_type || '').toLowerCase().includes(query));
    renderAdminFeesTable(fees);
}
window.handleAdminFeesFilter = handleAdminFeesFilter;

export async function handleCreateInvoice(e) {
    e.preventDefault();
    const studentId  = document.getElementById('inv_student_id')?.value;
    const feeType    = document.getElementById('inv_fee_type')?.value;
    const amount     = document.getElementById('inv_amount')?.value;
    const dueDate    = document.getElementById('inv_due_date')?.value;
    const remarks    = document.getElementById('inv_remarks')?.value || '';
    if (!studentId || !feeType || !amount || !dueDate) {
        showToast('Please fill all invoice fields.', 'warning');
        return;
    }
    const res = await api.addFee(studentId, { fee_type: feeType, amount, due_date: dueDate, remarks });
    if (res.ok && res.data?.success) {
        showToast('Fee invoice created!', 'success');
        document.getElementById('createInvoiceForm')?.reset();
        await loadAdminFees();
        const modal = bootstrap.Modal.getInstance(document.getElementById('createInvoiceModal'));
        if (modal) modal.hide();
    } else {
        showToast(res.data?.message || 'Failed to create invoice.', 'danger');
    }
}
window.handleCreateInvoice = handleCreateInvoice;

async function populateInvoiceStudentOptions() {
    const select = document.getElementById('inv_student_id');
    if (!select) return;
    const res = await api.getAllStudents();
    if (!res.ok || !res.data?.success) return;
    select.innerHTML = '<option value="" selected disabled>-- Select Student --</option>';
    res.data.students.forEach(s => {
        select.innerHTML += `<option value="${s.student_id}">${s.first_name} ${s.last_name || ''} (${s.student_id})</option>`;
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// EVENT PUBLISHING (still localStorage-backed for quick events)
// ─────────────────────────────────────────────────────────────────────────────

export function handleAdminPublishEvent(e) {
    e.preventDefault();
    const title       = document.getElementById('adm_event_name')?.value.trim();
    const type        = document.getElementById('adm_event_type')?.value;
    const startDate   = document.getElementById('adm_start_date')?.value;
    const time        = document.getElementById('adm_event_time')?.value;
    const venue       = document.getElementById('adm_venue')?.value.trim();
    const description = document.getElementById('adm_description')?.value.trim();
    if (!title || !type || !startDate || !time || !venue || !description) {
        showToast('Please fill in all event fields.', 'warning');
        return;
    }
    const events = getEventsState();
    events.unshift({ id: Date.now(), title, type, startDate, time, venue, description, status: 'Upcoming' });
    saveEventsState(events);
    document.getElementById('adminCreateEventForm')?.reset();
    showToast(`Event "${title}" published!`, 'success');
    renderAdminEventsTable();
}

export function renderAdminEventsTable() {
    const tbody = document.getElementById('admin-events-tbody');
    const badge = document.getElementById('admin-events-badge');
    if (!tbody) return;
    const events = getEventsState();
    if (badge) badge.textContent = `${events.length} Events`;
    if (events.length === 0) {
        tbody.innerHTML = emptyRow(5, 'No published events.');
        return;
    }
    tbody.innerHTML = events.map(ev => `
        <tr>
            <td class="ps-4 fw-bold text-dark">${ev.title}</td>
            <td><span class="badge badge-event-type">${ev.type}</span></td>
            <td class="small">${ev.startDate} @ ${ev.time}</td>
            <td class="small text-secondary"><i class="bi bi-geo-alt-fill text-danger me-1"></i>${ev.venue}</td>
            <td><span class="badge bg-success rounded-pill">${ev.status}</span></td>
        </tr>`).join('');
}

function getEventsState() {
    try { return JSON.parse(localStorage.getItem('archery_events') || '[]'); } catch { return []; }
}
function saveEventsState(events) {
    localStorage.setItem('archery_events', JSON.stringify(events));
}

// ─────────────────────────────────────────────────────────────────────────────
// ACTIVITY LOGS
// ─────────────────────────────────────────────────────────────────────────────

export async function loadAdminActivityLogs() {
    const res = await api.getActivityLogs(50);
    const tbody = document.getElementById('admin-activity-logs-tbody');
    if (!tbody) return;
    if (!res.ok || !res.data?.success || !res.data.logs?.length) {
        tbody.innerHTML = emptyRow(5, 'No activity logs yet.');
        return;
    }
    tbody.innerHTML = res.data.logs.map(l => `
        <tr>
            <td class="small">${l.created_at ? l.created_at.split('T')[0] : '—'}</td>
            <td><span class="badge bg-${l.role === 'admin' ? 'danger' : l.role === 'coach' ? 'warning text-dark' : 'info'}">${l.role}</span></td>
            <td class="fw-semibold">${l.name || l.user_id}</td>
            <td class="small">${l.action || '—'}</td>
            <td class="small text-secondary">${l.description || '—'}</td>
        </tr>`).join('');
}
window.loadAdminActivityLogs = loadAdminActivityLogs;

// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD HTML LOADER
// ─────────────────────────────────────────────────────────────────────────────

async function ensureAdminDashboardLoaded() {
    const container = document.getElementById('admin-view');
    if (!container || container.querySelector('#admin-student-search-section')) return;
    try {
        const res = await fetch('/pages/admin/dashboard.html');
        if (res.ok) {
            container.innerHTML = await res.text();
            // After loading HTML, populate invoice student dropdown
            await populateInvoiceStudentOptions();
            renderAdminEventsTable();
        }
    } catch (e) { console.warn('[Admin] Dashboard HTML load failed:', e); }
}
