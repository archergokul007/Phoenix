/**
 * Alerts & Global Modals Helper Module
 * Manages global alert banners, notification messages, and shared event detail modals.
 */

import { state } from './state.js';

export function showGlobalAlert(msg, type = "info") {
    const alertContainer = document.getElementById('global-alert-container');
    const alertBox = document.getElementById('global-alert');
    const alertMsg = document.getElementById('global-alert-msg');
    const alertIcon = document.getElementById('global-alert-icon');

    if (!alertContainer || !alertBox || !alertMsg) return;

    alertBox.className = `alert alert-${type} alert-dismissible fade show shadow-sm`;
    alertMsg.textContent = msg;

    if (type === 'success') alertIcon.className = 'bi bi-check-circle-fill fs-5 me-2';
    else if (type === 'danger') alertIcon.className = 'bi bi-exclamation-triangle-fill fs-5 me-2';
    else alertIcon.className = 'bi bi-info-circle-fill fs-5 me-2';

    alertContainer.classList.remove('d-none');

    setTimeout(() => {
        dismissGlobalAlert();
    }, 5000);
}

export function dismissGlobalAlert() {
    const alertContainer = document.getElementById('global-alert-container');
    if (alertContainer) alertContainer.classList.add('d-none');
}

export function renderPublishedEventsGrid(eventsList, gridId, countBadgeId) {
    const grid = document.getElementById(gridId);
    const countBadge = document.getElementById(countBadgeId);
    if (!grid) return;

    if (countBadge) countBadge.textContent = `${eventsList.length} Active Events`;

    if (eventsList.length === 0) {
        grid.innerHTML = `<div class="col-12 text-center py-4 text-muted"><i class="bi bi-calendar-x fs-2 mb-2 d-block"></i>No active events found.</div>`;
        return;
    }

    let html = '';
    eventsList.forEach(ev => {
        html += `
            <div class="col-lg-4 col-md-6">
                <div class="card h-100 border-0 shadow-sm rounded-3 event-card-student position-relative overflow-hidden">
                    <div class="event-status-strip status-upcoming"></div>
                    <div class="card-body p-3 d-flex flex-column justify-content-between">
                        <div>
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <span class="badge badge-event-type">${ev.type}</span>
                                <span class="badge bg-primary-subtle text-primary border rounded-pill small">${ev.status}</span>
                            </div>
                            <h6 class="fw-bold text-dark mb-2 event-title-clamp">${ev.title}</h6>
                            <div class="small text-muted mb-1">
                                <i class="bi bi-calendar3 text-primary me-1"></i>${ev.startDate} @ ${ev.time}
                            </div>
                            <div class="small text-muted mb-2">
                                <i class="bi bi-geo-alt-fill text-danger me-1"></i>${ev.venue}
                            </div>
                            <p class="text-secondary small mb-3 event-desc-clamp">${ev.description}</p>
                        </div>
                        <button type="button" class="btn btn-outline-primary btn-sm w-100 rounded-pill fw-semibold mt-auto" onclick="openEventDetailModal(${ev.id})">
                            <i class="bi bi-info-circle me-1"></i> View Details
                        </button>
                    </div>
                </div>
            </div>
        `;
    });
    grid.innerHTML = html;
}

export function openEventDetailModal(eventId) {
    const ev = state.events.find(e => e.id === eventId);
    if (!ev) return;

    document.getElementById('modal-event-name').textContent = ev.title;
    document.getElementById('modal-event-type').textContent = ev.type;
    document.getElementById('modal-event-status').textContent = ev.status;
    document.getElementById('modal-event-date').textContent = ev.startDate;
    document.getElementById('modal-event-time').textContent = ev.time;
    document.getElementById('modal-event-venue').innerHTML = `<i class="bi bi-geo-alt-fill text-danger me-1"></i>${ev.venue}`;
    document.getElementById('modal-event-desc').textContent = ev.description;

    const modal = new bootstrap.Modal(document.getElementById('eventDetailModal'));
    modal.show();
}
