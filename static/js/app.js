/**
 * Master Application Entry Module — Phoenix Archery Academy
 * Imports all modular components, attaches event handlers to global window context, and boots the app.
 */

import { state } from './shared/state.js';
import { showSection, showNavbar, navigateToRoleHome, handleLogout } from './shared/navigation.js';
import { showGlobalAlert, dismissGlobalAlert, openEventDetailModal } from './shared/alerts.js';
import { selectRole, handleLoginSubmit, showLoginView, fillAdminCredentials, fillStudentCredentials, fillCoachCredentials } from './auth/login.js';
import {
    showRegisterView,
    showCoachRegisterView,
    handleRegisterSubmit,
    handleCoachRegisterSubmit,
    handleAgeCategoryAutoSelect
} from './registration/register.js';
import { initStudentPortal } from './student/dashboard.js';
import { initCoachPortal } from './coach/dashboard.js';
import {
    initAdminPortal,
    handleAdminPublishEvent,
    handleAdminStudentSearch,
    renderAdminCoachReports
} from './admin/dashboard.js';
import {
    handleAddEquipment,
    openAllocateEquipmentModal,
    handleAllocateEquipmentSubmit,
    handleUpdateEquipmentCondition,
    handleDeleteEquipment,
    handleResolveEquipmentRequest,
    handleAdminEquipmentSearchFilter,
    prefillStudentRepairRequest,
    handleStudentEquipmentRequestSubmit
} from './equipment/equipment.js';
import {
    handleAdminFeesFilter,
    handleCreateInvoice,
    openRecordPaymentModal,
    handleRecordPaymentSubmit,
    openStudentPayModal,
    handleStudentPaymentSubmit,
    openFeeReceiptModal,
    printFeeReceipt
} from './fees/fees.js';
import {
    handleAdminScheduleFilter,
    handleAddSchedule,
    handleDeleteSchedule,
    handleBookTrainingSlot,
    handleCancelTrainingSlot
} from './schedule/schedule.js';

// ── Global window bindings ────────────────────────────────────────────────────

// Auth
window.selectRole          = selectRole;
window.handleLoginSubmit   = handleLoginSubmit;
window.showLoginView       = showLoginView;
window.fillAdminCredentials = fillAdminCredentials;
window.fillStudentCredentials = fillStudentCredentials;
window.fillCoachCredentials = fillCoachCredentials;
window.showRegisterView    = showRegisterView;
window.showCoachRegisterView = showCoachRegisterView;
window.handleRegisterSubmit  = handleRegisterSubmit;
window.handleCoachRegisterSubmit = handleCoachRegisterSubmit;
window.handleAgeCategoryAutoSelect = handleAgeCategoryAutoSelect;

// Navigation
window.handleLogout        = handleLogout;
window.navigateToRoleHome  = navigateToRoleHome;
window.showSection         = showSection;
window.showNavbar          = showNavbar;

// Alerts
window.showGlobalAlert     = showGlobalAlert;
window.dismissGlobalAlert  = dismissGlobalAlert;
window.openEventDetailModal = openEventDetailModal;

// Admin
window.initAdminPortal          = initAdminPortal;
window.handleAdminPublishEvent  = handleAdminPublishEvent;
window.handleAdminStudentSearch = handleAdminStudentSearch;
window.renderAdminCoachReports  = renderAdminCoachReports;

// Equipment
window.handleAddEquipment               = handleAddEquipment;
window.openAllocateEquipmentModal       = openAllocateEquipmentModal;
window.handleAllocateEquipmentSubmit    = handleAllocateEquipmentSubmit;
window.handleUpdateEquipmentCondition   = handleUpdateEquipmentCondition;
window.handleDeleteEquipment            = handleDeleteEquipment;
window.handleResolveEquipmentRequest    = handleResolveEquipmentRequest;
window.handleAdminEquipmentSearchFilter = handleAdminEquipmentSearchFilter;
window.prefillStudentRepairRequest      = prefillStudentRepairRequest;
window.handleStudentEquipmentRequestSubmit = handleStudentEquipmentRequestSubmit;

// Fees
window.handleAdminFeesFilter   = handleAdminFeesFilter;
window.handleCreateInvoice     = handleCreateInvoice;
window.openRecordPaymentModal  = openRecordPaymentModal;
window.handleRecordPaymentSubmit = handleRecordPaymentSubmit;
window.openStudentPayModal     = openStudentPayModal;
window.handleStudentPaymentSubmit = handleStudentPaymentSubmit;
window.openFeeReceiptModal     = openFeeReceiptModal;
window.printFeeReceipt         = printFeeReceipt;

// Schedule
window.handleAdminScheduleFilter = handleAdminScheduleFilter;
window.handleAddSchedule         = handleAddSchedule;
window.handleDeleteSchedule      = handleDeleteSchedule;
window.handleBookTrainingSlot    = handleBookTrainingSlot;
window.handleCancelTrainingSlot  = handleCancelTrainingSlot;

// ── Application Init ──────────────────────────────────────────────────────────

function initApp() {
    setupPasswordToggles();
    selectRole('student');
    showLoginView();
}

function setupPasswordToggles() {
    document.querySelectorAll('.password-toggle-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId    = btn.getAttribute('data-target');
            const targetInput = document.getElementById(targetId);
            const icon        = btn.querySelector('i');
            if (!targetInput) return;
            if (targetInput.type === 'password') {
                targetInput.type = 'text';
                if (icon) { icon.classList.remove('bi-eye'); icon.classList.add('bi-eye-slash'); }
            } else {
                targetInput.type = 'password';
                if (icon) { icon.classList.remove('bi-eye-slash'); icon.classList.add('bi-eye'); }
            }
        });
    });
}

document.addEventListener('DOMContentLoaded', initApp);
