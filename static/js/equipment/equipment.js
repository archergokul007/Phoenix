/**
 * Equipment Management Module — Phoenix Archery Academy
 * Equipment inventory is tracked in MySQL via the bow_maintenance table.
 * Admin/coach views query the API; no localStorage state.
 */

import { state } from '../shared/state.js';
import { api } from '../shared/api.js';

// Local in-memory store for equipment (admin-managed within session)
let _equipment = [];
let _equipmentRequests = [];

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN EQUIPMENT
// ─────────────────────────────────────────────────────────────────────────────

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

    let totalCount = 0, availCount = 0, maintCount = 0, allocCount = 0;
    _equipment.forEach(eq => {
        totalCount += (eq.totalQty || 1);
        const alloc = (eq.assignedStudents || []).length;
        allocCount += alloc;
        const avail = Math.max(0, (eq.totalQty || 1) - alloc);
        availCount += avail;
        if (eq.condition === 'Needs Maintenance' || eq.condition === 'Under Repair') maintCount++;
    });

    if (totalEl) totalEl.textContent = totalCount;
    if (availEl) availEl.textContent = availCount;
    if (maintEl) maintEl.textContent = maintCount;
    if (allocEl) allocEl.textContent = allocCount;

    const totalBadge = document.getElementById('admin-equipment-badge');
    if (totalBadge) totalBadge.textContent = `${_equipment.length} Items`;
}

export function renderAdminEquipmentTable(filter = {}) {
    const tbody = document.getElementById('admin-equipment-tbody');
    if (!tbody) return;

    let list = [..._equipment];
    if (filter.category) list = list.filter(e => e.category === filter.category);
    if (filter.condition) list = list.filter(e => e.condition === filter.condition);
    if (filter.search) {
        const q = filter.search.toLowerCase();
        list = list.filter(e =>
            (e.name || '').toLowerCase().includes(q) ||
            (e.serialNumber || '').toLowerCase().includes(q)
        );
    }

    if (list.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="text-center text-muted py-4"><i class="bi bi-tools me-2"></i>No equipment registered.</td></tr>`;
        return;
    }

    tbody.innerHTML = list.map(eq => {
        const alloc = (eq.assignedStudents || []).length;
        const avail = Math.max(0, (eq.totalQty || 1) - alloc);
        const condColor = { 'Excellent': 'success', 'Good': 'primary', 'Needs Maintenance': 'warning', 'Under Repair': 'danger' }[eq.condition] || 'secondary';
        const assignedNames = (eq.assignedStudents || []).map(s => `<span class="badge bg-dark">${s.id}</span>`).join(' ');
        return `<tr>
            <td class="ps-3 text-muted small">${eq.id || '—'}</td>
            <td>
                <div class="fw-bold">${eq.name}</div>
                <small class="text-muted">${eq.serialNumber || ''}</small>
            </td>
            <td class="small">${eq.category || '—'}</td>
            <td class="text-center">${avail}/${eq.totalQty || 1}</td>
            <td><span class="badge bg-${condColor}">${eq.condition || 'Good'}</span></td>
            <td class="small">${eq.storageLocation || '—'}</td>
            <td class="small">${assignedNames || '<span class="text-muted">None</span>'}</td>
            <td class="text-end pe-3">
                <button class="btn btn-sm btn-outline-warning me-1" onclick="handleUpdateEquipmentCondition('${eq.id}')"><i class="bi bi-pencil"></i></button>
                <button class="btn btn-sm btn-outline-danger" onclick="handleDeleteEquipment('${eq.id}')"><i class="bi bi-trash"></i></button>
            </td>
        </tr>`;
    }).join('');
}

export function renderAdminEquipmentRequestsTable() {
    const tbody = document.getElementById('admin-equip-requests-tbody');
    const badge = document.getElementById('admin-equip-requests-badge');
    if (!tbody) return;
    const pending = _equipmentRequests.filter(r => r.status === 'Pending');
    if (badge) badge.textContent = `${pending.length} Requests`;
    if (_equipmentRequests.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted py-3"><i class="bi bi-inbox me-2"></i>No equipment requests.</td></tr>`;
        return;
    }
    tbody.innerHTML = _equipmentRequests.map(r => `
        <tr>
            <td class="small ps-3">${r.id}</td>
            <td class="fw-semibold">${r.studentName}</td>
            <td class="small">${r.equipment} — ${r.details || ''}</td>
            <td class="small text-muted">${r.date}</td>
            <td><span class="badge bg-${r.status === 'Pending' ? 'warning text-dark' : r.status === 'Resolved' ? 'success' : 'secondary'}">${r.status}</span></td>
            <td class="text-end pe-3">
                ${r.status === 'Pending' ? `<button class="btn btn-sm btn-success rounded-pill px-3" onclick="handleResolveEquipmentRequest('${r.id}')"><i class="bi bi-check-lg me-1"></i>Resolve</button>` : '<span class="text-muted small">Done</span>'}
            </td>
        </tr>`).join('');
}

export function handleAdminEquipmentSearchFilter() {
    const category  = document.getElementById('admin-equip-filter-cat')?.value || '';
    const condition = document.getElementById('admin-equip-filter-cond')?.value || '';
    const search    = document.getElementById('admin-equip-search')?.value.trim() || '';
    renderAdminEquipmentTable({ category, condition, search });
}

export function handleAddEquipment(e) {
    if (e) e.preventDefault();
    const name     = document.getElementById('eq_name')?.value.trim();
    const category = document.getElementById('eq_category')?.value;
    const serial   = document.getElementById('eq_serial')?.value.trim() || '';
    const qty      = parseInt(document.getElementById('eq_qty')?.value) || 1;
    const location = document.getElementById('eq_location')?.value.trim() || '';
    const cond     = document.getElementById('eq_condition')?.value || 'Good';
    if (!name || !category) return;

    const newEq = {
        id: `EQ${Date.now()}`,
        name, category,
        serialNumber: serial,
        totalQty: qty,
        storageLocation: location,
        condition: cond,
        assignedStudents: [],
        availableQty: qty,
    };
    _equipment.push(newEq);
    renderAdminEquipment();
    document.getElementById('addEquipmentModal') &&
        bootstrap.Modal.getInstance(document.getElementById('addEquipmentModal'))?.hide();
    document.getElementById('addEquipmentForm')?.reset();
}

export function openAllocateEquipmentModal() {
    const modal = document.getElementById('allocateEquipmentModal');
    if (modal) new bootstrap.Modal(modal).show();
}

export function handleAllocateEquipmentSubmit(e) {
    if (e) e.preventDefault();
    const studentId  = document.getElementById('alloc_student_id')?.value;
    const equipId    = document.getElementById('alloc_equipment_id')?.value;
    if (!studentId || !equipId) return;
    const eq = _equipment.find(e => e.id === equipId);
    if (!eq) return;
    const alreadyAssigned = (eq.assignedStudents || []).find(s => s.id === studentId);
    if (alreadyAssigned) return;
    eq.assignedStudents = eq.assignedStudents || [];
    eq.assignedStudents.push({ id: studentId, name: studentId });
    eq.availableQty = Math.max(0, (eq.totalQty || 1) - eq.assignedStudents.length);
    renderAdminEquipment();
    bootstrap.Modal.getInstance(document.getElementById('allocateEquipmentModal'))?.hide();
}

export function handleUpdateEquipmentCondition(eqId) {
    const eq = _equipment.find(e => e.id === eqId);
    if (!eq) return;
    const conditions = ['Excellent', 'Good', 'Needs Maintenance', 'Under Repair'];
    const current = conditions.indexOf(eq.condition);
    eq.condition = conditions[(current + 1) % conditions.length];
    renderAdminEquipment();
}

export function handleDeleteEquipment(eqId) {
    _equipment = _equipment.filter(e => e.id !== eqId);
    renderAdminEquipment();
}

export function handleResolveEquipmentRequest(reqId) {
    const req = _equipmentRequests.find(r => r.id === reqId);
    if (req) req.status = 'Resolved';
    renderAdminEquipmentRequestsTable();
}

async function populateAllocateStudentOptions() {
    const select = document.getElementById('alloc_student_id');
    if (!select) return;
    const res = await api.getAllStudents().catch(() => null);
    if (!res?.ok || !res.data?.success) return;
    select.innerHTML = '<option value="" selected disabled>-- Select Student --</option>';
    res.data.students.forEach(s => {
        select.innerHTML += `<option value="${s.student_id}">${s.first_name} ${s.last_name || ''} (${s.student_id})</option>`;
    });
}

function populateAllocateEquipmentOptions() {
    const select = document.getElementById('alloc_equipment_id');
    if (!select) return;
    select.innerHTML = '<option value="" selected disabled>-- Select Equipment --</option>';
    _equipment.filter(e => (e.availableQty || 0) > 0).forEach(e => {
        select.innerHTML += `<option value="${e.id}">${e.name} (${e.availableQty} available)</option>`;
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// STUDENT EQUIPMENT REQUESTS
// ─────────────────────────────────────────────────────────────────────────────

export function prefillStudentRepairRequest() {}

export function handleStudentEquipmentRequestSubmit(e) {
    if (e) e.preventDefault();
    const studentId = state.currentUser?.profile_id || 'Unknown';
    const equipment = document.getElementById('req_equipment')?.value || '';
    const details   = document.getElementById('req_details')?.value || '';
    if (!equipment || !details) return;
    const newReq = {
        id: `REQ${Date.now()}`,
        studentId,
        studentName: state.currentUser?.name || studentId,
        equipment,
        details,
        date: new Date().toISOString().split('T')[0],
        status: 'Pending',
    };
    _equipmentRequests.push(newReq);
}
