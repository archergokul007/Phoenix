/**
 * Fee Management Module — Phoenix Archery Academy
 * Admin fee operations are now in admin/dashboard.js.
 * This file handles student fee view and payment UI helpers.
 */

import { api } from '../shared/api.js';

// ─────────────────────────────────────────────────────────────────────────────
// STUDENT FEE VIEW (called from student/dashboard.js)
// ─────────────────────────────────────────────────────────────────────────────

export async function renderStudentFees(fees) {
    const tbody  = document.getElementById('stu-fees-tbody');
    const badge  = document.getElementById('stu-pending-fees-count');
    if (!tbody) return;

    if (!fees || fees.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted py-4"><i class="bi bi-inbox me-2"></i>No fee records found.</td></tr>`;
        return;
    }

    let pendingCount = 0;
    tbody.innerHTML = fees.map(f => {
        const badge = f.payment_status === 'paid' ? 'success' : f.payment_status === 'overdue' ? 'danger' : 'warning text-dark';
        if (f.payment_status !== 'paid') pendingCount++;
        return `<tr>
            <td class="ps-3"><span class="badge bg-dark">FEE-${f.fee_id}</span></td>
            <td>${f.fee_type || '—'}</td>
            <td class="fw-bold text-primary">₹${Number(f.amount || 0).toLocaleString('en-IN')}</td>
            <td class="small text-muted">${f.due_date || '—'}</td>
            <td class="small text-muted">${f.payment_date || '—'}</td>
            <td><span class="badge bg-${badge} rounded-pill px-3 py-1">${f.payment_status}</span></td>
        </tr>`;
    }).join('');

    if (badge) badge.textContent = pendingCount;
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN FEE FILTER — wired from admin dashboard HTML onchange handlers
// ─────────────────────────────────────────────────────────────────────────────

export async function handleAdminFeesFilter() {
    // Delegated to admin/dashboard.js via window.handleAdminFeesFilter
}

// ─────────────────────────────────────────────────────────────────────────────
// Stubs for backward compat (admin dashboard handles its own invoice forms)
// ─────────────────────────────────────────────────────────────────────────────

export function handleCreateInvoice(e) {
    if (e) e.preventDefault();
    // Handled in admin/dashboard.js window.handleCreateInvoice
}

export function openRecordPaymentModal(feeId) {
    // Admin fee payment via adminMarkFeePaid() in admin/dashboard.js
    if (typeof window.adminMarkFeePaid === 'function') window.adminMarkFeePaid(feeId);
}

export function handleRecordPaymentSubmit(e) {
    if (e) e.preventDefault();
}

export function openStudentPayModal() {}
export function handleStudentPaymentSubmit(e) { if (e) e.preventDefault(); }

export function openFeeReceiptModal(feeId) {
    console.log('[Fees] Receipt modal for fee', feeId);
}

export function printFeeReceipt() {
    window.print();
}
