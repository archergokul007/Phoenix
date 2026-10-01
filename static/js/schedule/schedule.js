/**
 * Training Schedule Module — Phoenix Archery Academy
 * Schedules stored in module-level array (no localStorage).
 * Admin manages batches; students can view and book slots.
 */

import { state } from '../shared/state.js';
import { showGlobalAlert } from '../shared/alerts.js';
import { api } from '../shared/api.js';

// Module-level schedule store (no localStorage, no broken state imports)
let _schedules = [];

function getSchedules() { return _schedules; }
function setSchedules(list) { _schedules = list; }

// =============================================================================
// ADMIN SCHEDULE LOGIC
// =============================================================================

export function renderAdminSchedule() {
    renderAdminScheduleStats();
    renderAdminScheduleTable();
}

export function renderAdminScheduleStats() {
    const totalBatchesEl = document.getElementById('admin-sched-total-batches');
    const totalArchersEl = document.getElementById('admin-sched-total-archers');
    const totalLanesEl   = document.getElementById('admin-sched-total-lanes');

    const list = getSchedules();
    let enrolledSet = new Set();
    let laneSet = new Set();

    list.forEach(s => {
        (s.enrolled || []).forEach(id => enrolledSet.add(id));
        if (s.rangeLocation) laneSet.add(s.rangeLocation);
    });

    if (totalBatchesEl) totalBatchesEl.textContent = list.length;
    if (totalArchersEl) totalArchersEl.textContent = enrolledSet.size;
    if (totalLanesEl)   totalLanesEl.textContent   = laneSet.size;
}

export function renderAdminScheduleTable(catFilter = '', dayFilter = '') {
    const tbody = document.getElementById('admin-schedule-tbody');
    const badge = document.getElementById('admin-schedule-badge');
    if (!tbody) return;

    let list = [...getSchedules()];
    if (catFilter) list = list.filter(s => s.category === catFilter || s.category === 'All Categories');
    if (dayFilter) list = list.filter(s => (s.days || '').toLowerCase().includes(dayFilter.toLowerCase()));

    if (badge) badge.textContent = `${list.length} Sessions`;

    if (list.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="text-center py-4 text-muted"><i class="bi bi-calendar-x fs-4 d-block mb-1"></i>No training schedules found.</td></tr>`;
        return;
    }

    tbody.innerHTML = list.map(item => {
        const enrolledCount = (item.enrolled || []).length;
        const isFull = enrolledCount >= item.capacity;
        return `<tr>
            <td class="ps-3"><span class="badge bg-dark">${item.id}</span></td>
            <td>
                <div class="fw-bold text-dark">${item.title}</div>
                <small class="text-secondary"><i class="bi bi-bullseye text-danger me-1"></i>Focus: ${item.focus || 'Form training'}</small>
            </td>
            <td><span class="badge bg-secondary-subtle text-dark border">${item.category}</span></td>
            <td class="small fw-semibold text-dark">${item.days}</td>
            <td class="small text-muted"><i class="bi bi-clock me-1"></i>${item.time}</td>
            <td>
                <div class="small fw-semibold text-primary"><i class="bi bi-geo-alt-fill text-danger me-1"></i>${item.rangeLocation}</div>
                <small class="text-muted">${item.distance}</small>
            </td>
            <td>
                <span class="badge ${isFull ? 'bg-danger' : 'bg-success-subtle text-success border border-success-subtle'} rounded-pill px-2 py-1">
                    ${enrolledCount} / ${item.capacity} Archers
                </span>
            </td>
            <td class="text-end pe-3">
                <button type="button" class="btn btn-sm btn-outline-danger rounded-pill px-2 py-1" onclick="handleDeleteSchedule('${item.id}')">
                    <i class="bi bi-trash3"></i>
                </button>
            </td>
        </tr>`;
    }).join('');
}

export function handleAdminScheduleFilter() {
    const cat = document.getElementById('admin-sched-filter-cat')?.value || '';
    const day = document.getElementById('admin-sched-filter-day')?.value || '';
    renderAdminScheduleTable(cat, day);
}

export function handleAddSchedule(e) {
    if (e) e.preventDefault();
    const title    = document.getElementById('new_sched_title')?.value.trim();
    const category = document.getElementById('new_sched_category')?.value;
    const days     = document.getElementById('new_sched_days')?.value.trim();
    const time     = document.getElementById('new_sched_time')?.value.trim();
    const distance = document.getElementById('new_sched_distance')?.value.trim();
    const lane     = document.getElementById('new_sched_lane')?.value.trim();
    const coach    = document.getElementById('new_sched_coach')?.value.trim() || 'Head Coach';
    const capacity = parseInt(document.getElementById('new_sched_capacity')?.value, 10) || 8;
    const focus    = document.getElementById('new_sched_focus')?.value.trim() || '';

    if (!title || !category || !days || !time || !distance || !lane) {
        showGlobalAlert('Please fill in all session scheduling details.', 'warning');
        return;
    }

    const schedules = getSchedules();
    const newId = `SCH-${(schedules.length + 1).toString().padStart(3, '0')}`;
    const newSession = { id: newId, title, category, days, time, distance, rangeLocation: lane, coach, capacity, enrolled: [], focus };
    schedules.unshift(newSession);
    setSchedules(schedules);

    document.getElementById('addScheduleForm')?.reset();
    const modalEl = document.getElementById('addScheduleModal');
    if (modalEl) bootstrap.Modal.getInstance(modalEl)?.hide();

    showGlobalAlert(`Training session "${title}" created with ID ${newId}!`, 'success');
    renderAdminSchedule();
}

export function handleDeleteSchedule(scheduleId) {
    if (!confirm('Are you sure you want to cancel this training session?')) return;
    setSchedules(getSchedules().filter(s => s.id !== scheduleId));
    showGlobalAlert('Training session deleted.', 'info');
    renderAdminSchedule();
}

// =============================================================================
// COACH SCHEDULE LOGIC
// =============================================================================

export function renderCoachSchedule() {
    const grid  = document.getElementById('coach-schedule-grid');
    const badge = document.getElementById('coach-schedule-badge');
    if (!grid) return;

    const list = getSchedules();
    if (badge) badge.textContent = `${list.length} Batches`;

    if (list.length === 0) {
        grid.innerHTML = `<div class="col-12 text-center py-4 text-muted">No training schedules available.</div>`;
        return;
    }

    grid.innerHTML = list.map(s => {
        const enrolledArchers = (s.enrolled || []);
        return `<div class="col-lg-6 mb-3">
            <div class="card border-0 shadow-sm rounded-4 h-100 overflow-hidden">
                <div class="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center">
                    <span class="badge bg-primary-subtle text-primary border">${s.category}</span>
                    <span class="badge bg-dark">${s.days}</span>
                </div>
                <div class="card-body p-4">
                    <h5 class="fw-bold text-dark mb-2">${s.title}</h5>
                    <div class="row g-2 small mb-3">
                        <div class="col-6"><i class="bi bi-clock text-primary me-1"></i><strong>${s.time}</strong></div>
                        <div class="col-6"><i class="bi bi-bullseye text-danger me-1"></i><strong>${s.distance}</strong></div>
                        <div class="col-12"><i class="bi bi-geo-alt-fill text-warning me-1"></i>${s.rangeLocation}</div>
                        <div class="col-12"><i class="bi bi-person-badge text-secondary me-1"></i>Coach: <strong>${s.coach}</strong></div>
                    </div>
                    <div class="p-2 bg-light rounded-3 mb-3 small">
                        <strong>Session Objective:</strong> ${s.focus || 'Technique repetition'}
                    </div>
                    <h6 class="fw-bold text-dark small mb-2"><i class="bi bi-people-fill me-1 text-primary"></i>Enrolled Archers (${enrolledArchers.length} / ${s.capacity}):</h6>
                    <div class="d-flex flex-wrap gap-1">
                        ${enrolledArchers.length > 0
                            ? enrolledArchers.map(a => `<span class="badge bg-secondary-subtle text-dark border">${a}</span>`).join('')
                            : '<span class="text-muted small">No archers enrolled yet.</span>'
                        }
                    </div>
                </div>
            </div>
        </div>`;
    }).join('');
}

// =============================================================================
// STUDENT SCHEDULE LOGIC
// =============================================================================

export function renderStudentSchedule(student) {
    const grid  = document.getElementById('student-schedule-grid');
    const badge = document.getElementById('student-schedule-badge');
    if (!grid) return;

    const list = getSchedules();
    if (badge) badge.textContent = `${list.length} Sessions Available`;

    if (list.length === 0) {
        grid.innerHTML = `<div class="col-12 text-center py-4 text-muted">No training schedules published yet.</div>`;
        return;
    }

    grid.innerHTML = list.map(s => {
        const studentId     = student?.profile_id || student?.id || '';
        const isEnrolled    = (s.enrolled || []).includes(studentId);
        const enrolledCount = (s.enrolled || []).length;
        const isFull        = enrolledCount >= s.capacity;
        const catMatch      = s.category === (student?.profile?.bow_category) || s.category === 'All Categories';

        return `<div class="col-lg-6 mb-3">
            <div class="card h-100 border-0 shadow-sm rounded-4 overflow-hidden ${isEnrolled ? 'border-start border-4 border-success' : ''}">
                <div class="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center">
                    <div class="d-flex align-items-center gap-2">
                        <span class="badge ${catMatch ? 'bg-primary' : 'bg-secondary'}">${s.category}</span>
                        ${catMatch ? '<span class="badge bg-success-subtle text-success border small">Recommended</span>' : ''}
                    </div>
                    <span class="badge bg-dark">${s.days}</span>
                </div>
                <div class="card-body p-4 d-flex flex-column justify-content-between">
                    <div>
                        <h5 class="fw-bold text-dark mb-2">${s.title}</h5>
                        <div class="row g-2 small mb-3">
                            <div class="col-6"><i class="bi bi-clock text-primary me-1"></i><strong>${s.time}</strong></div>
                            <div class="col-6"><i class="bi bi-bullseye text-danger me-1"></i><strong>${s.distance}</strong></div>
                            <div class="col-12"><i class="bi bi-geo-alt-fill text-danger me-1"></i>${s.rangeLocation}</div>
                            <div class="col-12"><i class="bi bi-person-fill text-primary me-1"></i>Coach: <strong>${s.coach}</strong></div>
                        </div>
                        <div class="p-3 bg-light rounded-3 mb-3 small">
                            <strong class="text-dark d-block mb-1">Training Focus:</strong>
                            <span class="text-secondary">${s.focus || 'Target grouping and stance calibration'}</span>
                        </div>
                    </div>
                    <div class="d-flex justify-content-between align-items-center pt-2 border-top">
                        <span class="small text-muted"><i class="bi bi-people me-1"></i><strong>${enrolledCount} / ${s.capacity}</strong> slots filled</span>
                        ${isEnrolled
                            ? `<button type="button" class="btn btn-outline-danger btn-sm rounded-pill px-3" onclick="handleCancelTrainingSlot('${s.id}')"><i class="bi bi-x-circle me-1"></i>Cancel</button>`
                            : `<button type="button" class="btn btn-primary btn-sm rounded-pill px-3 ${isFull ? 'disabled' : ''}" onclick="handleBookTrainingSlot('${s.id}')"><i class="bi bi-calendar-check me-1"></i>${isFull ? 'Full' : 'Book Slot'}</button>`
                        }
                    </div>
                </div>
            </div>
        </div>`;
    }).join('');
}

export async function handleBookTrainingSlot(scheduleId) {
    if (!state.currentUser) return;
    const studentId = state.currentUser.profile_id || state.currentUser.id || '';
    const schedules = getSchedules();
    const session   = schedules.find(s => s.id === scheduleId);
    if (!session) return;

    if (!session.enrolled) session.enrolled = [];
    if (session.enrolled.includes(studentId)) {
        showGlobalAlert('You are already booked for this training slot.', 'info');
        return;
    }
    if (session.enrolled.length >= session.capacity) {
        showGlobalAlert('This session has reached full capacity.', 'warning');
        return;
    }

    session.enrolled.push(studentId);
    setSchedules(schedules);

    try { await api.bookTrainingSlot(studentId, scheduleId); } catch (err) { /* deferred */ }

    showGlobalAlert(`Booking confirmed for "${session.title}" on ${session.days} at ${session.time}!`, 'success');
    renderStudentSchedule(state.currentUser);
}

export async function handleCancelTrainingSlot(scheduleId) {
    if (!state.currentUser) return;
    const studentId = state.currentUser.profile_id || state.currentUser.id || '';
    const schedules = getSchedules();
    const session   = schedules.find(s => s.id === scheduleId);
    if (!session) return;

    session.enrolled = (session.enrolled || []).filter(id => id !== studentId);
    setSchedules(schedules);

    try { await api.cancelTrainingSlot(studentId, scheduleId); } catch (err) { /* deferred */ }

    showGlobalAlert(`Booking cancelled for "${session.title}".`, 'info');
    renderStudentSchedule(state.currentUser);
}
