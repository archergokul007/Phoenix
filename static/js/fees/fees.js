/**
 * Fee Management Module
 * Handles academy financial tracking, student invoicing, payment processing, and branded receipt generation.
 */

import { state, saveFeesState } from '../shared/state.js';
import { showGlobalAlert } from '../shared/alerts.js';
import { api } from '../shared/api.js';

// =============================================================================
// ADMIN FEES LOGIC
// =============================================================================

export function renderAdminFees() {
    renderAdminFeesSummary();
    renderAdminFeesTable();
    populateCreateInvoiceStudentOptions();
}

export function renderAdminFeesSummary() {
    const collectedEl = document.getElementById('admin-fee-collected');
    const pendingEl = document.getElementById('admin-fee-pending');
    const overdueEl = document.getElementById('admin-fee-overdue');
    const totalInvEl = document.getElementById('admin-fee-total-inv');

    let totalCollected = 0;
    let totalPending = 0;
    let totalOverdue = 0;

    (state.fees || []).forEach(inv => {
        const amt = Number(inv.amount) || 0;
        if (inv.status === 'Paid') {
            totalCollected += amt;
        } else if (inv.status === 'Pending') {
            totalPending += amt;
        } else if (inv.status === 'Overdue') {
            totalOverdue += amt;
        }
    });

    if (collectedEl) collectedEl.textContent = `₹${totalCollected.toLocaleString('en-IN')}`;
    if (pendingEl) pendingEl.textContent = `₹${totalPending.toLocaleString('en-IN')}`;
    if (overdueEl) overdueEl.textContent = `₹${totalOverdue.toLocaleString('en-IN')}`;
    if (totalInvEl) totalInvEl.textContent = (state.fees || []).length;
}

export function renderAdminFeesTable(statusFilter = '', searchQuery = '') {
    const tbody = document.getElementById('admin-fees-tbody');
    const badge = document.getElementById('admin-fees-badge');
    if (!tbody) return;

    let list = [...(state.fees || [])];

    if (statusFilter) {
        list = list.filter(inv => inv.status === statusFilter);
    }
    if (searchQuery) {
        const q = searchQuery.toLowerCase();
        list = list.filter(inv =>
            inv.id.toLowerCase().includes(q) ||
            inv.studentName.toLowerCase().includes(q) ||
            inv.studentId.toLowerCase().includes(q) ||
            inv.feeType.toLowerCase().includes(q)
        );
    }

    if (badge) badge.textContent = `${list.length} Invoices`;

    if (list.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-muted"><i class="bi bi-receipt fs-4 d-block mb-1"></i>No fee invoices found.</td></tr>`;
        return;
    }

    let html = '';
    list.forEach(inv => {
        let statusBadge = 'bg-success';
        if (inv.status === 'Pending') statusBadge = 'bg-warning text-dark';
        else if (inv.status === 'Overdue') statusBadge = 'bg-danger';

        html += `
            <tr>
                <td class="ps-3"><span class="badge bg-dark">${inv.id}</span></td>
                <td>
                    <div class="fw-bold text-dark">${inv.studentName}</div>
                    <small class="text-muted">${inv.studentId}</small>
                </td>
                <td>
                    <div class="fw-semibold text-dark">${inv.feeType}</div>
                    <small class="text-secondary">${inv.remarks || '-'}</small>
                </td>
                <td class="fw-bold text-primary">₹${Number(inv.amount).toLocaleString('en-IN')}</td>
                <td class="small text-muted">${inv.dueDate}</td>
                <td><span class="badge ${statusBadge} rounded-pill px-3 py-1">${inv.status}</span></td>
                <td class="text-end pe-3">
                    ${inv.status === 'Paid' ? `
                        <button type="button" class="btn btn-sm btn-outline-success rounded-pill px-3" onclick="openFeeReceiptModal('${inv.id}')">
                            <i class="bi bi-receipt-cutoff me-1"></i> View Receipt
                        </button>
                    ` : `
                        <button type="button" class="btn btn-sm btn-primary rounded-pill px-3 me-1" onclick="openRecordPaymentModal('${inv.id}')">
                            <i class="bi bi-check-circle me-1"></i> Record Pay
                        </button>
                    `}
                </td>
            </tr>
        `;
    });
    tbody.innerHTML = html;
}

export function handleAdminFeesFilter() {
    const status = document.getElementById('admin-fee-filter-status')?.value || '';
    const query = document.getElementById('admin-fee-search')?.value.trim() || '';
    renderAdminFeesTable(status, query);
}

export function populateCreateInvoiceStudentOptions() {
    const select = document.getElementById('inv_student_id');
    if (!select) return;
    select.innerHTML = '<option value="" selected disabled>-- Select Student --</option>';
    state.students.forEach(stu => {
        select.innerHTML += `<option value="${stu.id}">${stu.name} (${stu.id} - ${stu.course})</option>`;
    });
}

export function handleCreateInvoice(e) {
    e.preventDefault();
    const studentId = document.getElementById('inv_student_id').value;
    const feeType = document.getElementById('inv_fee_type').value;
    const amount = parseFloat(document.getElementById('inv_amount').value);
    const dueDate = document.getElementById('inv_due_date').value;
    const remarks = document.getElementById('inv_remarks').value.trim();

    const student = state.students.find(s => s.id === studentId);
    if (!student || !feeType || !amount || !dueDate) {
        showGlobalAlert('Please fill in all invoice details.', 'warning');
        return;
    }

    const newInvoiceId = `INV-2026-${(state.fees.length + 1).toString().padStart(3, '0')}`;
    const newInvoice = {
        id: newInvoiceId,
        studentId: student.id,
        studentName: student.name,
        feeType: feeType,
        amount: amount,
        dueDate: dueDate,
        paidDate: null,
        status: 'Pending',
        paymentMethod: null,
        receiptNo: null,
        transactionId: null,
        remarks: remarks || `${feeType} for ${student.name}`
    };

    state.fees.unshift(newInvoice);
    saveFeesState();

    document.getElementById('createInvoiceForm')?.reset();
    const modalEl = document.getElementById('createInvoiceModal');
    if (modalEl) {
        const modal = bootstrap.Modal.getInstance(modalEl);
        if (modal) modal.hide();
    }

    showGlobalAlert(`Invoice ${newInvoiceId} created for ${student.name} (₹${amount.toLocaleString('en-IN')})!`, 'success');
    renderAdminFees();
}

export function openRecordPaymentModal(invoiceId) {
    const inv = state.fees.find(i => i.id === invoiceId);
    if (!inv) return;

    document.getElementById('rec_inv_id').value = inv.id;
    document.getElementById('rec_inv_display').textContent = `${inv.id} - ${inv.studentName} (₹${inv.amount.toLocaleString('en-IN')})`;
    document.getElementById('rec_amount').value = inv.amount;
    document.getElementById('rec_payment_method').value = 'UPI (GPay/PhonePe)';
    document.getElementById('rec_txn_id').value = `TXN-${Date.now().toString().slice(-6)}`;

    const modal = new bootstrap.Modal(document.getElementById('recordPaymentModal'));
    modal.show();
}

export function handleRecordPaymentSubmit(e) {
    e.preventDefault();
    const invId = document.getElementById('rec_inv_id').value;
    const method = document.getElementById('rec_payment_method').value;
    const txnId = document.getElementById('rec_txn_id').value.trim() || `TXN-${Date.now().toString().slice(-6)}`;

    const inv = state.fees.find(i => i.id === invId);
    if (!inv) {
        showGlobalAlert('Invoice not found.', 'danger');
        return;
    }

    inv.status = 'Paid';
    inv.paidDate = new Date().toISOString().split('T')[0];
    inv.paymentMethod = method;
    inv.transactionId = txnId;
    inv.receiptNo = `REC-${Math.floor(10000 + Math.random() * 90000)}`;

    saveFeesState();

    const modalEl = document.getElementById('recordPaymentModal');
    if (modalEl) {
        const modal = bootstrap.Modal.getInstance(modalEl);
        if (modal) modal.hide();
    }

    showGlobalAlert(`Payment recorded! Official Receipt ${inv.receiptNo} generated for ${inv.studentName}.`, 'success');
    renderAdminFees();
    openFeeReceiptModal(inv.id);
}

// =============================================================================
// STUDENT FEES LOGIC
// =============================================================================

export function renderStudentFees(student) {
    renderStudentFeesSummary(student);
    renderStudentFeesTable(student);
}

export function renderStudentFeesSummary(student) {
    const paidEl = document.getElementById('stu-fee-paid');
    const dueEl = document.getElementById('stu-fee-due');
    const overdueEl = document.getElementById('stu-fee-overdue');

    let totalPaid = 0;
    let totalDue = 0;
    let totalOverdue = 0;

    (state.fees || []).filter(f => f.studentId === student.id).forEach(inv => {
        const amt = Number(inv.amount) || 0;
        if (inv.status === 'Paid') totalPaid += amt;
        else if (inv.status === 'Pending') totalDue += amt;
        else if (inv.status === 'Overdue') totalOverdue += amt;
    });

    if (paidEl) paidEl.textContent = `₹${totalPaid.toLocaleString('en-IN')}`;
    if (dueEl) dueEl.textContent = `₹${totalDue.toLocaleString('en-IN')}`;
    if (overdueEl) overdueEl.textContent = `₹${totalOverdue.toLocaleString('en-IN')}`;
}

export function renderStudentFeesTable(student) {
    const tbody = document.getElementById('student-fees-tbody');
    const badge = document.getElementById('student-fees-badge');
    if (!tbody) return;

    const myFees = (state.fees || []).filter(f => f.studentId === student.id);
    if (badge) badge.textContent = `${myFees.length} Records`;

    if (myFees.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-muted">No fee records found for your student profile.</td></tr>`;
        return;
    }

    let html = '';
    myFees.forEach(inv => {
        let statusBadge = 'bg-success';
        if (inv.status === 'Pending') statusBadge = 'bg-warning text-dark';
        else if (inv.status === 'Overdue') statusBadge = 'bg-danger';

        html += `
            <tr>
                <td class="ps-3"><span class="badge bg-dark">${inv.id}</span></td>
                <td>
                    <div class="fw-bold text-dark">${inv.feeType}</div>
                    <small class="text-muted">${inv.remarks || '-'}</small>
                </td>
                <td class="fw-bold text-primary">₹${Number(inv.amount).toLocaleString('en-IN')}</td>
                <td class="small text-muted">${inv.dueDate}</td>
                <td><span class="badge ${statusBadge} rounded-pill px-3 py-1">${inv.status}</span></td>
                <td class="text-end pe-3">
                    ${inv.status === 'Paid' ? `
                        <button type="button" class="btn btn-sm btn-outline-success rounded-pill px-3" onclick="openFeeReceiptModal('${inv.id}')">
                            <i class="bi bi-receipt-cutoff me-1"></i> Receipt
                        </button>
                    ` : `
                        <button type="button" class="btn btn-sm btn-primary rounded-pill px-3" onclick="openStudentPayModal('${inv.id}')">
                            <i class="bi bi-shield-lock-fill me-1"></i> Pay Now
                        </button>
                    `}
                </td>
            </tr>
        `;
    });
    tbody.innerHTML = html;
}

export function openStudentPayModal(invoiceId) {
    const inv = state.fees.find(i => i.id === invoiceId);
    if (!inv) return;

    document.getElementById('pay_inv_id').value = inv.id;
    document.getElementById('pay_modal_title').textContent = `Pay: ${inv.feeType}`;
    document.getElementById('pay_modal_amount').textContent = `₹${Number(inv.amount).toLocaleString('en-IN')}`;
    document.getElementById('pay_modal_due').textContent = inv.dueDate;

    const modal = new bootstrap.Modal(document.getElementById('payFeeModal'));
    modal.show();
}

export async function handleStudentPaymentSubmit(e) {
    e.preventDefault();
    const invId = document.getElementById('pay_inv_id').value;
    const method = document.querySelector('input[name="payment_gateway_method"]:checked')?.value || 'UPI';

    const inv = state.fees.find(i => i.id === invId);
    if (!inv) {
        showGlobalAlert('Invoice not found.', 'danger');
        return;
    }

    inv.status = 'Paid';
    inv.paidDate = new Date().toISOString().split('T')[0];
    inv.paymentMethod = method;
    inv.transactionId = `TXN-${Date.now().toString().slice(-8)}`;
    inv.receiptNo = `REC-${Math.floor(10000 + Math.random() * 90000)}`;

    saveFeesState();

    // Persist payment to SQLite Database
    try {
        const dbRes = await api.payFeeInvoice(inv.id, {
            paidDate: inv.paidDate,
            paymentMethod: inv.paymentMethod,
            transactionId: inv.transactionId,
            receiptNo: inv.receiptNo
        });
        if (dbRes.ok && dbRes.data && dbRes.data.invoice) {
            Object.assign(inv, dbRes.data.invoice);
            saveFeesState();
        }
    } catch (err) {
        console.warn("[Fees] SQLite payment save deferred:", err);
    }

    const modalEl = document.getElementById('payFeeModal');
    if (modalEl) {
        const modal = bootstrap.Modal.getInstance(modalEl);
        if (modal) modal.hide();
    }

    showGlobalAlert(`Payment Successful & Recorded in Database! Receipt generated: ${inv.receiptNo}`, 'success');
    if (state.currentUser) renderStudentFees(state.currentUser);
    openFeeReceiptModal(inv.id);
}

// =============================================================================
// GLOBAL BRANDED FEE RECEIPT MODAL
// =============================================================================

export function openFeeReceiptModal(invoiceId) {
    const inv = state.fees.find(i => i.id === invoiceId);
    if (!inv) return;

    const student = state.students.find(s => s.id === inv.studentId) || {
        name: inv.studentName,
        id: inv.studentId,
        course: 'Archery Academy Trainee',
        bowCategory: 'Recurve Bow'
    };

    document.getElementById('receipt-no').textContent = inv.receiptNo || 'REC-00000';
    document.getElementById('receipt-date').textContent = inv.paidDate || inv.dueDate;
    document.getElementById('receipt-txn-id').textContent = inv.transactionId || 'TXN-ONLINE-SUCCESS';
    document.getElementById('receipt-payment-method').textContent = inv.paymentMethod || 'Online Gateway';

    document.getElementById('receipt-student-name').textContent = student.name;
    document.getElementById('receipt-student-id').textContent = student.id;
    document.getElementById('receipt-student-course').textContent = student.course || 'Archery Cadre';
    document.getElementById('receipt-student-bow').textContent = student.bowCategory || 'Olympic Bow';

    document.getElementById('receipt-item-desc').textContent = inv.feeType;
    document.getElementById('receipt-item-remarks').textContent = inv.remarks || 'Standard academy training & equipment session';
    document.getElementById('receipt-item-amt').textContent = `₹${Number(inv.amount).toLocaleString('en-IN')}`;

    document.getElementById('receipt-subtotal').textContent = `₹${Number(inv.amount).toLocaleString('en-IN')}`;
    document.getElementById('receipt-total').textContent = `₹${Number(inv.amount).toLocaleString('en-IN')}`;

    const modal = new bootstrap.Modal(document.getElementById('feeReceiptModal'));
    modal.show();
}

export function printFeeReceipt() {
    window.print();
}
