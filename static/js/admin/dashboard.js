/**
 * Admin Dashboard Module
 * Handles administrator portal display, event publishing form submission, and published events list.
 */

import { state, saveEventsState } from '../shared/state.js';
import { hideAllViews, showNavbar, showSection } from '../shared/navigation.js';
import { showGlobalAlert } from '../shared/alerts.js';
import { renderAdminEquipment } from '../equipment/equipment.js';
import { renderAdminFees } from '../fees/fees.js';
import { renderAdminSchedule } from '../schedule/schedule.js';

export function initAdminPortal(adminUser) {
    hideAllViews();
    const admin = adminUser || state.currentUser || { name: 'Administrator' };
    showNavbar('admin', admin.name || 'Administrator');
    showSection('admin-view');

    document.getElementById('admin-stat-events-count').textContent = state.events.length;
    document.getElementById('admin-stat-students-count').textContent = state.students.length;

    renderAdminEquipment();
    renderAdminFees();
    renderAdminSchedule();
    renderAdminEventsTable();
}

export function handleAdminPublishEvent(e) {
    e.preventDefault();

    const title = document.getElementById('adm_event_name').value.trim();
    const type = document.getElementById('adm_event_type').value;
    const startDate = document.getElementById('adm_start_date').value;
    const time = document.getElementById('adm_event_time').value;
    const venue = document.getElementById('adm_venue').value.trim();
    const description = document.getElementById('adm_description').value.trim();

    if (!title || !type || !startDate || !time || !venue || !description) {
        showGlobalAlert("Please fill in all event fields before publishing.", "warning");
        return;
    }

    const newEvent = {
        id: Date.now(),
        title: title,
        type: type,
        startDate: startDate,
        time: time,
        venue: venue,
        description: description,
        status: "Upcoming"
    };

    state.events.unshift(newEvent);
    saveEventsState();

    document.getElementById('adminCreateEventForm').reset();

    showGlobalAlert(`Event "${newEvent.title}" published successfully!`, "success");

    document.getElementById('admin-stat-events-count').textContent = state.events.length;
    renderAdminEventsTable();
}

export function renderAdminEventsTable() {
    const tbody = document.getElementById('admin-events-tbody');
    const badge = document.getElementById('admin-events-badge');
    if (!tbody) return;

    if (badge) badge.textContent = `${state.events.length} Events`;

    if (state.events.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center py-3 text-muted">No published events found.</td></tr>`;
        return;
    }

    let html = '';
    state.events.forEach(ev => {
        html += `
            <tr>
                <td class="ps-4 fw-bold text-dark">${ev.title}</td>
                <td><span class="badge badge-event-type">${ev.type}</span></td>
                <td class="small">${ev.startDate} @ ${ev.time}</td>
                <td class="small text-secondary"><i class="bi bi-geo-alt-fill text-danger me-1"></i>${ev.venue}</td>
                <td><span class="badge bg-success rounded-pill">${ev.status}</span></td>
            </tr>
        `;
    });
    tbody.innerHTML = html;
}
