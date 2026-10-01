/**
 * Coach Dashboard — Phoenix Archery Academy
 * Student ID search → fetch from SQL → view + update.
 * All updates trigger: DB save + activity log + student notification + admin notification.
 */

import { api } from '../shared/api.js';
import { state, clearCurrentUser } from '../shared/state.js';
import { hideAllViews } from '../shared/navigation.js';
import { showLoginView } from '../auth/login.js';

// ── Entry Point ───────────────────────────────────────────────────────────────
export async function initCoachPortal(user) {
    state.currentUser = user;
    state.currentRole = 'coach';

    hideAllViews();
    const coachView = document.getElementById('coach-view');
    if (coachView) coachView.classList.remove('d-none');

    await ensureCoachDashboardLoaded();

    setEl('coach-welcome-heading', `Welcome, ${user.name || 'Coach'}!`);
    setEl('coach-welcome-sub',     user.profile?.specialization
        ? `Specialization: ${user.profile.specialization}`
        : 'Academy Training & Student Performance Portal');

    // Load stats
    await loadCoachStats();

    // Wire up search form
    const searchForm = document.getElementById('coach-student-search-form');
    if (searchForm) {
        searchForm.onsubmit = async (e) => {
            e.preventDefault();
            const input = document.getElementById('coach-student-id-input');
            if (input?.value.trim()) {
                await searchStudent(input.value.trim().toUpperCase());
            }
        };
    }

    // Wire up update forms
    wirePerformanceForm();
    wireAttendanceForm();
    wireBowMaintenanceForm();
    wireReportForm();
}

function setEl(id, val, html = false) {
    const el = document.getElementById(id);
    if (!el) return;
    if (html) el.innerHTML = val;
    else el.textContent = val;
}

function emptyRow(colspan, msg = 'No records found.') {
    return `<tr><td colspan="${colspan}" class="text-center text-muted py-4"><i class="bi bi-inbox me-2"></i>${msg}</td></tr>`;
}

// ── Stats ─────────────────────────────────────────────────────────────────────
async function loadCoachStats() {
    const res = await api.getCoachDashboardStats();
    if (!res.ok || !res.data?.success) return;
    const s = res.data.stats;
    setEl('coach-total-students-count', s.students_coached ?? '0');
    setEl('coach-attendance-count',     s.attendance_records ?? '0');
    setEl('coach-reports-sent-count',   s.reports_sent ?? '0');
}

// ── Student Search ────────────────────────────────────────────────────────────
async function searchStudent(studentId) {
    const resultsDiv = document.getElementById('coach-student-results');
    if (resultsDiv) {
        resultsDiv.innerHTML = '<div class="text-center py-4"><span class="spinner-border text-warning"></span><p class="mt-2 text-muted">Searching database...</p></div>';
        resultsDiv.classList.remove('d-none');
    }

    const res = await api.coachSearchStudent(studentId);

    if (!res.ok || !res.data?.success) {
        if (resultsDiv) resultsDiv.innerHTML = `
            <div class="alert alert-warning">
                <i class="bi bi-exclamation-triangle me-2"></i>
                ${res.data?.message || `No student found with ID: ${studentId}`}
            </div>`;
        return;
    }

    const student = res.data.student;
    state.searchedStudent = student;

    // Render student profile + update forms
    if (resultsDiv) resultsDiv.innerHTML = renderStudentCard(student);

    // Load detailed data
    await Promise.all([
        loadCoachStudentPerformance(studentId),
        loadCoachStudentAttendance(studentId),
        loadCoachStudentBowMaintenance(studentId),
    ]);

    // Pre-fill hidden student_id fields in update forms
    ['perf-student-id', 'att-student-id', 'maint-student-id', 'report-student-id'].forEach(id => {
        setEl(id, studentId);
        const el = document.getElementById(id);
        if (el) el.value = studentId;
    });

    // Show update sections
    ['coach-perf-section', 'coach-att-section', 'coach-maint-section', 'coach-report-section']
        .forEach(id => document.getElementById(id)?.classList.remove('d-none'));
}

function renderStudentCard(s) {
    const name = `${s.first_name || ''} ${s.last_name || ''}`.trim();
    return `
    <div class="card border-0 shadow-sm rounded-4 mb-3">
        <div class="card-body p-4">
            <div class="d-flex align-items-center gap-3 mb-3">
                <div class="bg-warning bg-opacity-10 rounded-circle p-3">
                    <i class="bi bi-person-badge-fill fs-2 text-warning"></i>
                </div>
                <div>
                    <h5 class="fw-bold mb-0">${name}</h5>
                    <p class="text-muted mb-0">
                        <span class="badge bg-dark">${s.student_id}</span>
                        &nbsp;|&nbsp; ${s.bow_category || s.bow_type || 'N/A'}
                        &nbsp;|&nbsp; ${s.experience || 'N/A'}
                    </p>
                </div>
            </div>
            <div class="row g-2 text-sm">
                <div class="col-md-4"><strong>Email:</strong> ${s.email || '—'}</div>
                <div class="col-md-4"><strong>Phone:</strong> ${s.phone || '—'}</div>
                <div class="col-md-4"><strong>Gender:</strong> ${s.gender || '—'}</div>
                <div class="col-md-4"><strong>Age Category:</strong> ${s.age_category || '—'}</div>
                <div class="col-md-4"><strong>Joined:</strong> ${s.joining_date || '—'}</div>
                <div class="col-md-4"><strong>Status:</strong>
                    <span class="badge bg-${s.status === 'active' ? 'success' : 'secondary'}">${s.status}</span>
                </div>
            </div>
        </div>
    </div>`;
}

// ── Performance (coach view + update) ─────────────────────────────────────────
async function loadCoachStudentPerformance(studentId) {
    const tbody = document.getElementById('coach-perf-tbody');
    if (!tbody) return;
    const res = await api.getCoachStudentPerformance(studentId);

    if (!res.ok || !res.data?.success || !res.data.performance?.length) {
        tbody.innerHTML = emptyRow(7, 'No performance records. Use the form below to add one.');
        return;
    }

    tbody.innerHTML = res.data.performance.map(r => `
        <tr>
            <td>${r.performance_date || '—'}</td>
            <td><strong>${r.score ?? '—'}</strong></td>
            <td>${r.total_arrows ?? '—'}</td>
            <td>${r.accuracy != null ? r.accuracy + '%' : '—'}</td>
            <td>${r.distance || '—'}</td>
            <td>${r.category || '—'}</td>
            <td><small>${r.remarks || '—'}</small></td>
        </tr>
    `).join('');
}

function wirePerformanceForm() {
    const form = document.getElementById('coach-perf-update-form');
    if (!form) return;
    form.onsubmit = async (e) => {
        e.preventDefault();
        const data = {
            student_id:       document.getElementById('perf-student-id')?.value,
            score:            document.getElementById('perf-score')?.value,
            total_arrows:     document.getElementById('perf-total-arrows')?.value,
            accuracy:         document.getElementById('perf-accuracy')?.value,
            distance:         document.getElementById('perf-distance')?.value,
            category:         document.getElementById('perf-category')?.value,
            performance_date: document.getElementById('perf-date')?.value,
            remarks:          document.getElementById('perf-remarks')?.value,
        };
        await submitUpdate(api.updatePerformance(data), 'Performance updated successfully!',
            () => loadCoachStudentPerformance(data.student_id));
    };
}

// ── Attendance (coach view + update) ──────────────────────────────────────────
async function loadCoachStudentAttendance(studentId) {
    const tbody = document.getElementById('coach-att-tbody');
    if (!tbody) return;
    const res = await api.getCoachStudentAttendance(studentId);

    if (!res.ok || !res.data?.success || !res.data.attendance?.length) {
        tbody.innerHTML = emptyRow(4, 'No attendance records. Use the form below to add one.');
        return;
    }

    const badge = { present: 'success', absent: 'danger', leave: 'warning', late: 'info' };
    tbody.innerHTML = res.data.attendance.map(r => `
        <tr>
            <td>${r.attendance_date || '—'}</td>
            <td><span class="badge bg-${badge[r.status] || 'secondary'}">${r.status}</span></td>
            <td>${r.coach_name || '—'}</td>
            <td><small>${r.remarks || '—'}</small></td>
        </tr>
    `).join('');
}

function wireAttendanceForm() {
    const form = document.getElementById('coach-att-update-form');
    if (!form) return;
    form.onsubmit = async (e) => {
        e.preventDefault();
        const data = {
            student_id:      document.getElementById('att-student-id')?.value,
            attendance_date: document.getElementById('att-date')?.value,
            status:          document.getElementById('att-status')?.value,
            remarks:         document.getElementById('att-remarks')?.value,
        };
        await submitUpdate(api.updateAttendance(data), 'Attendance recorded successfully!',
            () => loadCoachStudentAttendance(data.student_id));
    };
}

// ── Bow Maintenance (coach view + update) ─────────────────────────────────────
async function loadCoachStudentBowMaintenance(studentId) {
    const tbody = document.getElementById('coach-maint-tbody');
    if (!tbody) return;
    const res = await api.getCoachStudentBowMaintenance(studentId);

    if (!res.ok || !res.data?.success || !res.data.bow_maintenance?.length) {
        tbody.innerHTML = emptyRow(6, 'No maintenance records. Use the form below to add one.');
        return;
    }

    const badge = { excellent: 'success', good: 'primary', fair: 'warning', poor: 'danger', needs_repair: 'danger' };
    tbody.innerHTML = res.data.bow_maintenance.map(r => `
        <tr>
            <td>${r.equipment_name || '—'}</td>
            <td>${r.maintenance_date || '—'}</td>
            <td><span class="badge bg-${badge[r.condition] || 'secondary'}">${r.condition || '—'}</span></td>
            <td>${r.maintenance_details || '—'}</td>
            <td>${r.next_maintenance_date || '—'}</td>
            <td><small>${r.remarks || '—'}</small></td>
        </tr>
    `).join('');
}

function wireBowMaintenanceForm() {
    const form = document.getElementById('coach-maint-update-form');
    if (!form) return;
    form.onsubmit = async (e) => {
        e.preventDefault();
        const data = {
            student_id:            document.getElementById('maint-student-id')?.value,
            equipment_name:        document.getElementById('maint-equipment-name')?.value,
            equipment_number:      document.getElementById('maint-equipment-number')?.value,
            maintenance_date:      document.getElementById('maint-date')?.value,
            condition:             document.getElementById('maint-condition')?.value,
            maintenance_details:   document.getElementById('maint-details')?.value,
            next_maintenance_date: document.getElementById('maint-next-date')?.value,
            status:                document.getElementById('maint-status')?.value,
            remarks:               document.getElementById('maint-remarks')?.value,
        };
        await submitUpdate(api.updateBowMaintenance(data), 'Bow maintenance recorded successfully!',
            () => loadCoachStudentBowMaintenance(data.student_id));
    };
}

// ── Coach Report ──────────────────────────────────────────────────────────────
function wireReportForm() {
    const form = document.getElementById('coach-report-form');
    if (!form) return;
    form.onsubmit = async (e) => {
        e.preventDefault();
        const data = {
            student_id:              document.getElementById('report-student-id')?.value,
            report_title:            document.getElementById('report-title')?.value,
            report_message:          document.getElementById('report-message')?.value,
            performance_summary:     document.getElementById('report-perf-summary')?.value,
            attendance_summary:      document.getElementById('report-att-summary')?.value,
            bow_maintenance_summary: document.getElementById('report-maint-summary')?.value,
        };
        await submitUpdate(api.sendCoachReport(data), 'Report sent to Admin successfully!', null);
    };
}

// ── Generic submit helper ─────────────────────────────────────────────────────
async function submitUpdate(promiseFn, successMsg, reloadFn) {
    try {
        const res = await promiseFn;
        if (res.ok && res.data?.success) {
            showToast(successMsg, 'success');
            if (reloadFn) await reloadFn();
        } else {
            showToast(res.data?.message || 'Update failed.', 'danger');
        }
    } catch (err) {
        showToast('Server error: ' + err.message, 'danger');
    }
}

function showToast(msg, type = 'success') {
    const existing = document.getElementById('coach-toast-container');
    if (existing) existing.remove();
    const div = document.createElement('div');
    div.id = 'coach-toast-container';
    div.style.cssText = 'position:fixed;top:1.5rem;right:1.5rem;z-index:9999;';
    div.innerHTML = `
        <div class="toast show align-items-center text-bg-${type} border-0 rounded-3 shadow-lg" role="alert">
            <div class="d-flex p-3">
                <div class="toast-body fw-semibold">
                    <i class="bi bi-${type === 'success' ? 'check-circle' : 'exclamation-triangle'} me-2"></i>${msg}
                </div>
                <button type="button" class="btn-close btn-close-white ms-auto" onclick="this.closest('#coach-toast-container').remove()"></button>
            </div>
        </div>`;
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 4000);
}

// ── Dashboard HTML loader ─────────────────────────────────────────────────────
async function ensureCoachDashboardLoaded() {
    const container = document.getElementById('coach-view');
    if (!container || container.querySelector('#coach-student-search-form')) return;
    try {
        const res = await fetch('/pages/coach/dashboard.html');
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

window.handleLogout = handleLogout;
