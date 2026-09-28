/**
 * Equipment Management Module
 * Handles academy gear inventory, student gear allocation, maintenance tracking, and archer requests.
 */

import { state, saveEquipmentState, saveEquipmentRequestsState } from '../shared/state.js';
import { showGlobalAlert } from '../shared/alerts.js';
import { api } from '../shared/api.js';

// =============================================================================
// ADMIN EQUIPMENT LOGIC
// =============================================================================

export function renderAdminEquipment() {
    renderAdminEquipmentStats();
    renderAdminEquipmentTable();
    renderAdminEquipmentRequestsTable();
    populateAllocateStudentOptions();
    populateAllocateEquipmentOptions();
}

export function renderAdminEquipmentStats() {
    const totalEl = document.getElementById('admin-equip-total');
    const availEl = document.getElementById('admin-equip-avail');
    const maintEl = document.getElementById('admin-equip-maint');
    const allocEl = document.getElementById('admin-equip-alloc');

    let totalCount = 0;
    let availCount = 0;
    let maintCount = 0;
    let allocCount = 0;

    state.equipment.forEach(item => {
        totalCount += Number(item.totalQty) || 0;
        availCount += Number(item.availableQty) || 0;
        if (item.condition === 'Needs Maintenance' || item.condition === 'Under Repair') {
            maintCount += 1;
        }
        if (item.assignedStudents && item.assignedStudents.length > 0) {
            allocCount += item.assignedStudents.length;
        }
    });

    if (totalEl) totalEl.textContent = totalCount;
    if (availEl) availEl.textContent = availCount;
    if (maintEl) maintEl.textContent = maintCount;
    if (allocEl) allocEl.textContent = allocCount;
}

export function renderAdminEquipmentTable(filterCategory = '', filterCondition = '', searchQuery = '') {
    const tbody = document.getElementById('admin-equipment-tbody');
    const badge = document.getElementById('admin-equipment-badge');
    if (!tbody) return;

    let list = [...state.equipment];

    if (filterCategory) {
        list = list.filter(item => item.category === filterCategory);
    }
    if (filterCondition) {
        list = list.filter(item => item.condition === filterCondition);
    }
    if (searchQuery) {
        const q = searchQuery.toLowerCase();
        list = list.filter(item => 
            item.name.toLowerCase().includes(q) || 
            item.id.toLowerCase().includes(q) || 
            item.serialNumber.toLowerCase().includes(q) ||
            item.category.toLowerCase().includes(q)
        );
    }

    if (badge) badge.textContent = `${list.length} Items`;

    if (list.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="text-center py-4 text-muted"><i class="bi bi-inbox fs-4 d-block mb-1"></i>No equipment found matching criteria.</td></tr>`;
        return;
    }

    let html = '';
    list.forEach(item => {
        let condBadgeClass = 'bg-success';
        if (item.condition === 'Needs Maintenance') condBadgeClass = 'bg-warning text-dark';
        else if (item.condition === 'Under Repair') condBadgeClass = 'bg-danger';

        const assignedInfo = (item.assignedStudents && item.assignedStudents.length > 0)
            ? item.assignedStudents.map(s => `<span class="badge bg-primary-subtle text-primary border me-1 mb-1">${s.name} (${s.id})</span>`).join('')
            : '<span class="text-muted small">None</span>';

        html += `
            <tr>
                <td class="ps-3"><span class="badge bg-dark">${item.id}</span></td>
                <td>
                    <div class="fw-bold text-dark">${item.name}</div>
                    <small class="text-muted"><i class="bi bi-upc-scan me-1"></i>SN: ${item.serialNumber}</small>
                </td>
                <td><span class="badge bg-secondary-subtle text-dark border">${item.category}</span></td>
                <td><span class="fw-semibold ${item.availableQty > 0 ? 'text-success' : 'text-danger'}">${item.availableQty}</span> / ${item.totalQty}</td>
                <td><span class="badge ${condBadgeClass} rounded-pill px-2 py-1">${item.condition}</span></td>
                <td class="small text-muted"><i class="bi bi-geo-alt me-1"></i>${item.location || 'Armory'}</td>
                <td class="small">${assignedInfo}</td>
                <td class="text-end pe-3">
                    <div class="dropdown d-inline-block">
                        <button class="btn btn-sm btn-outline-secondary rounded-pill px-2 py-1 dropdown-toggle" type="button" data-bs-toggle="dropdown">
                            Actions
                        </button>
                        <ul class="dropdown-menu dropdown-menu-end shadow-sm">
                            <li><a class="dropdown-item" href="#" onclick="openAllocateEquipmentModal('${item.id}'); return false;"><i class="bi bi-person-check text-primary me-2"></i>Allocate to Student</a></li>
                            <li><hr class="dropdown-divider"></li>
                            <li><h6 class="dropdown-header">Update Condition</h6></li>
                            <li><a class="dropdown-item" href="#" onclick="handleUpdateEquipmentCondition('${item.id}', 'Excellent'); return false;"><i class="bi bi-check2-circle text-success me-2"></i>Excellent</a></li>
                            <li><a class="dropdown-item" href="#" onclick="handleUpdateEquipmentCondition('${item.id}', 'Good'); return false;"><i class="bi bi-hand-thumbs-up text-info me-2"></i>Good</a></li>
                            <li><a class="dropdown-item" href="#" onclick="handleUpdateEquipmentCondition('${item.id}', 'Needs Maintenance'); return false;"><i class="bi bi-tools text-warning me-2"></i>Needs Maintenance</a></li>
                            <li><a class="dropdown-item" href="#" onclick="handleUpdateEquipmentCondition('${item.id}', 'Under Repair'); return false;"><i class="bi bi-exclamation-octagon text-danger me-2"></i>Under Repair</a></li>
                            <li><hr class="dropdown-divider"></li>
                            <li><a class="dropdown-item text-danger" href="#" onclick="handleDeleteEquipment('${item.id}'); return false;"><i class="bi bi-trash3 me-2"></i>Remove Item</a></li>
                        </ul>
                    </div>
                </td>
            </tr>
        `;
    });
    tbody.innerHTML = html;
}

export function renderAdminEquipmentRequestsTable() {
    const tbody = document.getElementById('admin-equip-requests-tbody');
    const badge = document.getElementById('admin-equip-requests-badge');
    if (!tbody) return;

    const reqs = state.equipmentRequests || [];
    if (badge) badge.textContent = `${reqs.length} Requests`;

    if (reqs.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center py-3 text-muted">No maintenance or checkout requests logged.</td></tr>`;
        return;
    }

    let html = '';
    reqs.forEach(req => {
        let statusClass = 'bg-warning text-dark';
        if (req.status === 'Approved' || req.status === 'Completed') statusClass = 'bg-success';
        else if (req.status === 'Rejected') statusClass = 'bg-danger';

        html += `
            <tr>
                <td class="ps-3"><span class="badge bg-dark">${req.id}</span></td>
                <td>
                    <div class="fw-bold text-dark">${req.studentName}</div>
                    <small class="text-muted">${req.studentId}</small>
                </td>
                <td>
                    <div class="fw-semibold text-primary">${req.equipmentName}</div>
                    <small class="text-secondary">${req.description}</small>
                </td>
                <td class="small text-muted">${req.date}</td>
                <td><span class="badge ${statusClass} rounded-pill px-2 py-1">${req.status}</span></td>
                <td class="text-end pe-3">
                    ${req.status === 'Pending' ? `
                        <button type="button" class="btn btn-sm btn-success rounded-pill px-2 py-0 me-1" onclick="handleResolveEquipmentRequest('${req.id}', 'Approved')">
                            <i class="bi bi-check-lg"></i> Approve
                        </button>
                        <button type="button" class="btn btn-sm btn-outline-danger rounded-pill px-2 py-0" onclick="handleResolveEquipmentRequest('${req.id}', 'Rejected')">
                            <i class="bi bi-x-lg"></i> Reject
                        </button>
                    ` : `
                        <span class="text-muted small"><i class="bi bi-check2-all text-success me-1"></i>Resolved</span>
                    `}
                </td>
            </tr>
        `;
    });
    tbody.innerHTML = html;
}

export function handleAdminEquipmentSearchFilter() {
    const cat = document.getElementById('admin-equip-filter-cat')?.value || '';
    const cond = document.getElementById('admin-equip-filter-cond')?.value || '';
    const query = document.getElementById('admin-equip-search')?.value.trim() || '';
    renderAdminEquipmentTable(cat, cond, query);
}

export function populateAllocateStudentOptions() {
    const select = document.getElementById('alloc_student_id');
    if (!select) return;
    select.innerHTML = '<option value="" selected disabled>-- Select Student --</option>';
    state.students.forEach(stu => {
        select.innerHTML += `<option value="${stu.id}">${stu.name} (${stu.id} - ${stu.bowCategory})</option>`;
    });
}

export function populateAllocateEquipmentOptions() {
    const select = document.getElementById('alloc_equip_id');
    if (!select) return;
    select.innerHTML = '<option value="" selected disabled>-- Select Equipment Item --</option>';
    state.equipment.forEach(item => {
        const avail = item.availableQty > 0 ? `(${item.availableQty} available)` : '(Unavailable)';
        select.innerHTML += `<option value="${item.id}" ${item.availableQty <= 0 ? 'disabled' : ''}>${item.name} - ${item.category} ${avail}</option>`;
    });
}

export function handleAddEquipment(e) {
    e.preventDefault();
    const name = document.getElementById('new_equip_name').value.trim();
    const category = document.getElementById('new_equip_category').value;
    const serial = document.getElementById('new_equip_serial').value.trim() || `SN-${Date.now().toString().slice(-6)}`;
    const totalQty = parseInt(document.getElementById('new_equip_qty').value, 10) || 1;
    const condition = document.getElementById('new_equip_condition').value || 'Excellent';
    const location = document.getElementById('new_equip_location').value.trim() || 'Armory Locker';

    if (!name || !category) {
        showGlobalAlert('Please provide equipment name and category.', 'warning');
        return;
    }

    const newId = `EQ-${(state.equipment.length + 1).toString().padStart(3, '0')}`;
    const newItem = {
        id: newId,
        name: name,
        category: category,
        serialNumber: serial,
        totalQty: totalQty,
        availableQty: totalQty,
        condition: condition,
        location: location,
        assignedStudents: []
    };

    state.equipment.unshift(newItem);
    saveEquipmentState();

    document.getElementById('addEquipmentForm')?.reset();
    const modalEl = document.getElementById('addEquipmentModal');
    if (modalEl) {
        const modal = bootstrap.Modal.getInstance(modalEl);
        if (modal) modal.hide();
    }

    showGlobalAlert(`Equipment "${name}" registered successfully with ID ${newId}!`, 'success');
    renderAdminEquipment();
}

export function openAllocateEquipmentModal(equipId) {
    populateAllocateStudentOptions();
    populateAllocateEquipmentOptions();
    if (equipId) {
        const select = document.getElementById('alloc_equip_id');
        if (select) select.value = equipId;
    }
    const modal = new bootstrap.Modal(document.getElementById('allocateEquipmentModal'));
    modal.show();
}

export function handleAllocateEquipmentSubmit(e) {
    e.preventDefault();
    const equipId = document.getElementById('alloc_equip_id').value;
    const studentId = document.getElementById('alloc_student_id').value;
    const notes = document.getElementById('alloc_notes')?.value.trim() || '';

    const equip = state.equipment.find(i => i.id === equipId);
    const student = state.students.find(s => s.id === studentId);

    if (!equip || !student) {
        showGlobalAlert('Invalid equipment or student selected.', 'danger');
        return;
    }

    if (equip.availableQty <= 0) {
        showGlobalAlert('This equipment currently has no available units for checkout.', 'warning');
        return;
    }

    equip.availableQty -= 1;
    if (!equip.assignedStudents) equip.assignedStudents = [];
    equip.assignedStudents.push({
        id: student.id,
        name: student.name,
        issuedDate: new Date().toISOString().split('T')[0],
        notes: notes
    });

    saveEquipmentState();

    const modalEl = document.getElementById('allocateEquipmentModal');
    if (modalEl) {
        const modal = bootstrap.Modal.getInstance(modalEl);
        if (modal) modal.hide();
    }

    showGlobalAlert(`Allocated "${equip.name}" to ${student.name} successfully!`, 'success');
    renderAdminEquipment();
}

export function handleUpdateEquipmentCondition(equipId, newCondition) {
    const item = state.equipment.find(i => i.id === equipId);
    if (!item) return;

    item.condition = newCondition;
    saveEquipmentState();
    showGlobalAlert(`Updated status of "${item.name}" to "${newCondition}".`, 'info');
    renderAdminEquipment();
    renderCoachEquipment();
}

export function handleDeleteEquipment(equipId) {
    if (!confirm('Are you sure you want to remove this item from the academy equipment inventory?')) return;
    state.equipment = state.equipment.filter(i => i.id !== equipId);
    saveEquipmentState();
    showGlobalAlert('Equipment item removed from inventory.', 'info');
    renderAdminEquipment();
}

export function handleResolveEquipmentRequest(reqId, newStatus) {
    const req = state.equipmentRequests.find(r => r.id === reqId);
    if (!req) return;

    req.status = newStatus;
    saveEquipmentRequestsState();
    showGlobalAlert(`Request ${reqId} marked as ${newStatus}.`, 'success');
    renderAdminEquipmentRequestsTable();
}

// =============================================================================
// COACH EQUIPMENT LOGIC
// =============================================================================

export function renderCoachEquipment() {
    const tbody = document.getElementById('coach-equipment-tbody');
    const badge = document.getElementById('coach-equipment-badge');
    if (!tbody) return;

    if (badge) badge.textContent = `${state.equipment.length} Items`;

    let html = '';
    state.equipment.forEach(item => {
        let condBadgeClass = 'bg-success';
        if (item.condition === 'Needs Maintenance') condBadgeClass = 'bg-warning text-dark';
        else if (item.condition === 'Under Repair') condBadgeClass = 'bg-danger';

        const assignedInfo = (item.assignedStudents && item.assignedStudents.length > 0)
            ? item.assignedStudents.map(s => `${s.name}`).join(', ')
            : '<span class="text-muted small">None</span>';

        html += `
            <tr>
                <td class="ps-3"><span class="badge bg-dark">${item.id}</span></td>
                <td>
                    <div class="fw-bold text-dark">${item.name}</div>
                    <small class="text-muted">${item.category}</small>
                </td>
                <td><span class="fw-semibold">${item.availableQty}</span> / ${item.totalQty}</td>
                <td><span class="badge ${condBadgeClass} rounded-pill px-2 py-1">${item.condition}</span></td>
                <td class="small">${item.location}</td>
                <td class="small">${assignedInfo}</td>
                <td class="text-end pe-3">
                    <button type="button" class="btn btn-sm btn-outline-warning rounded-pill px-2 py-1" onclick="handleUpdateEquipmentCondition('${item.id}', 'Needs Maintenance')">
                        <i class="bi bi-tools me-1"></i> Flag Maintenance
                    </button>
                </td>
            </tr>
        `;
    });
    tbody.innerHTML = html;
}

// =============================================================================
// STUDENT EQUIPMENT LOGIC
// =============================================================================

export function renderStudentEquipment(student) {
    const assignedGrid = document.getElementById('student-assigned-equip-grid');
    const badge = document.getElementById('student-assigned-equip-badge');
    if (!assignedGrid) return;

    const allocatedItems = state.equipment.filter(item => 
        item.assignedStudents && item.assignedStudents.some(s => s.id === student.id)
    );

    if (badge) badge.textContent = `${allocatedItems.length} Items Issued`;

    if (allocatedItems.length === 0) {
        assignedGrid.innerHTML = `
            <div class="col-12">
                <div class="p-4 bg-white rounded-3 shadow-sm text-center">
                    <i class="bi bi-tools text-muted fs-1 mb-2 d-block"></i>
                    <h6 class="fw-bold text-dark mb-1">No Academy Equipment Checked Out</h6>
                    <p class="text-muted small mb-0">You are currently using your personal equipment (${student.bowType || 'Own Bow'}). You can submit a request below if you need academy gear or maintenance assistance.</p>
                </div>
            </div>
        `;
    } else {
        let html = '';
        allocatedItems.forEach(item => {
            const myAlloc = item.assignedStudents.find(s => s.id === student.id);
            let condClass = 'bg-success';
            if (item.condition === 'Needs Maintenance') condClass = 'bg-warning text-dark';
            else if (item.condition === 'Under Repair') condClass = 'bg-danger';

            html += `
                <div class="col-md-6 col-lg-4">
                    <div class="card h-100 border-0 shadow-sm rounded-4 overflow-hidden position-relative">
                        <div class="card-header bg-gradient-teal text-white py-2 px-3 d-flex justify-content-between align-items-center">
                            <span class="badge bg-white text-dark small">${item.category}</span>
                            <span class="badge ${condClass} rounded-pill px-2">${item.condition}</span>
                        </div>
                        <div class="card-body p-3">
                            <h6 class="fw-bold text-dark mb-2">${item.name}</h6>
                            <div class="small text-muted mb-1"><i class="bi bi-upc-scan me-1"></i>SN: ${item.serialNumber}</div>
                            <div class="small text-muted mb-2"><i class="bi bi-calendar-check me-1"></i>Issued: ${myAlloc?.issuedDate || 'Active'}</div>
                            <div class="p-2 bg-light rounded-2 small text-secondary mb-3">
                                <strong>Armory Storage:</strong> ${item.location}
                            </div>
                            <button type="button" class="btn btn-outline-warning btn-sm w-100 rounded-pill" onclick="prefillStudentRepairRequest('${item.name}')">
                                <i class="bi bi-wrench-adjustable me-1"></i> Request Tuning / Repair
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });
        assignedGrid.innerHTML = html;
    }

    renderStudentRequestsHistory(student);
}

export function renderStudentRequestsHistory(student) {
    const tbody = document.getElementById('student-requests-tbody');
    if (!tbody) return;

    const myRequests = (state.equipmentRequests || []).filter(r => r.studentId === student.id);

    if (myRequests.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center py-3 text-muted">No gear service requests submitted yet.</td></tr>`;
        return;
    }

    let html = '';
    myRequests.forEach(req => {
        let statusBadge = 'bg-warning text-dark';
        if (req.status === 'Approved' || req.status === 'Completed') statusBadge = 'bg-success';
        else if (req.status === 'Rejected') statusBadge = 'bg-danger';

        html += `
            <tr>
                <td class="ps-3"><span class="badge bg-dark">${req.id}</span></td>
                <td class="fw-semibold text-dark">${req.equipmentName}</td>
                <td><span class="badge bg-secondary-subtle text-dark border">${req.requestType}</span></td>
                <td class="small text-secondary">${req.description}</td>
                <td class="text-end pe-3"><span class="badge ${statusBadge} rounded-pill px-3 py-1">${req.status}</span></td>
            </tr>
        `;
    });
    tbody.innerHTML = html;
}

export function prefillStudentRepairRequest(equipmentName) {
    const nameInput = document.getElementById('stu_req_equipment_name');
    if (nameInput) {
        nameInput.value = equipmentName;
        nameInput.focus();
    }
    const typeSelect = document.getElementById('stu_req_type');
    if (typeSelect) typeSelect.value = 'Maintenance & Tuning';
    document.getElementById('student-equipment-request-card')?.scrollIntoView({ behavior: 'smooth' });
}

export async function handleStudentEquipmentRequestSubmit(e) {
    e.preventDefault();
    if (!state.currentUser) return;

    const equipName = document.getElementById('stu_req_equipment_name').value.trim();
    const reqType = document.getElementById('stu_req_type').value;
    const desc = document.getElementById('stu_req_description').value.trim();

    if (!equipName || !reqType || !desc) {
        showGlobalAlert('Please fill in all request fields.', 'warning');
        return;
    }

    const newReq = {
        id: `REQ-${Date.now().toString().slice(-4)}`,
        studentId: state.currentUser.id,
        studentName: state.currentUser.name,
        requestType: reqType,
        equipmentName: equipName,
        description: desc,
        date: new Date().toISOString().split('T')[0],
        status: 'Pending'
    };

    if (!state.equipmentRequests) state.equipmentRequests = [];
    state.equipmentRequests.unshift(newReq);
    saveEquipmentRequestsState();

    // Persist to SQLite Database
    try {
        const dbRes = await api.submitEquipmentRequest(newReq);
        if (dbRes.ok && dbRes.data && dbRes.data.request) {
            // Update local ID if DB generated one
            newReq.id = dbRes.data.request.id;
            saveEquipmentRequestsState();
        }
    } catch (err) {
        console.warn("[Equipment] SQLite request save deferred:", err);
    }

    document.getElementById('studentEquipmentRequestForm')?.reset();
    showGlobalAlert('Equipment service request submitted and saved to database successfully!', 'success');
    renderStudentEquipment(state.currentUser);
}
