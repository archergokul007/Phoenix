/**
 * Master Application Entry Module
 * Imports all modular components, attaches event handlers to global window context, and boots the app.
 */

import { loadState } from './shared/state.js';
import { showSection, showNavbar, navigateToRoleHome, handleLogout } from './shared/navigation.js';
import { showGlobalAlert, dismissGlobalAlert, openEventDetailModal } from './shared/alerts.js';
import { selectRole, fillDemoCredentials, fillAdminCredentials, handleLoginSubmit, showLoginView } from './auth/login.js';
import { showRegisterView, showCoachRegisterView, handleRegisterSubmit, handleCoachRegisterSubmit, handleAgeCategoryAutoSelect } from './registration/register.js';
import { initStudentPortal } from './student/dashboard.js';
import { initCoachPortal, handleCoachSearchLive, handleCoachSearchSubmit, inspectStudentPerformance, hideCoachPerformanceDisplay } from './coach/dashboard.js';
import { initAdminPortal, handleAdminPublishEvent } from './admin/dashboard.js';
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

// Expose handlers globally to support HTML inline attributes (onclick, onsubmit, etc.)
window.selectRole = selectRole;
window.fillDemoCredentials = fillDemoCredentials;
window.fillAdminCredentials = fillAdminCredentials;
window.handleLoginSubmit = handleLoginSubmit;
window.showRegisterView = showRegisterView;
window.showCoachRegisterView = showCoachRegisterView;
window.showLoginView = showLoginView;
window.handleRegisterSubmit = handleRegisterSubmit;
window.handleCoachRegisterSubmit = handleCoachRegisterSubmit;
window.handleAgeCategoryAutoSelect = handleAgeCategoryAutoSelect;
window.handleLogout = handleLogout;
window.navigateToRoleHome = navigateToRoleHome;
window.showSection = showSection;
window.handleCoachSearchLive = handleCoachSearchLive;
window.handleCoachSearchSubmit = handleCoachSearchSubmit;
window.inspectStudentPerformance = inspectStudentPerformance;
window.hideCoachPerformanceDisplay = hideCoachPerformanceDisplay;
window.handleAdminPublishEvent = handleAdminPublishEvent;
window.openEventDetailModal = openEventDetailModal;
window.dismissGlobalAlert = dismissGlobalAlert;

// Equipment handlers
window.handleAddEquipment = handleAddEquipment;
window.openAllocateEquipmentModal = openAllocateEquipmentModal;
window.handleAllocateEquipmentSubmit = handleAllocateEquipmentSubmit;
window.handleUpdateEquipmentCondition = handleUpdateEquipmentCondition;
window.handleDeleteEquipment = handleDeleteEquipment;
window.handleResolveEquipmentRequest = handleResolveEquipmentRequest;
window.handleAdminEquipmentSearchFilter = handleAdminEquipmentSearchFilter;
window.prefillStudentRepairRequest = prefillStudentRepairRequest;
window.handleStudentEquipmentRequestSubmit = handleStudentEquipmentRequestSubmit;

// Fees handlers
window.handleAdminFeesFilter = handleAdminFeesFilter;
window.handleCreateInvoice = handleCreateInvoice;
window.openRecordPaymentModal = openRecordPaymentModal;
window.handleRecordPaymentSubmit = handleRecordPaymentSubmit;
window.openStudentPayModal = openStudentPayModal;
window.handleStudentPaymentSubmit = handleStudentPaymentSubmit;
window.openFeeReceiptModal = openFeeReceiptModal;
window.printFeeReceipt = printFeeReceipt;

// Schedule handlers
window.handleAdminScheduleFilter = handleAdminScheduleFilter;
window.handleAddSchedule = handleAddSchedule;
window.handleDeleteSchedule = handleDeleteSchedule;
window.handleBookTrainingSlot = handleBookTrainingSlot;
window.handleCancelTrainingSlot = handleCancelTrainingSlot;

function initApp() {
    loadState();
    setupPasswordToggles();
    selectRole('student');
    showLoginView();
}

function setupPasswordToggles() {
    const toggleBtns = document.querySelectorAll('.password-toggle-btn');
    toggleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-target');
            const targetInput = document.getElementById(targetId);
            const icon = btn.querySelector('i');
            if (targetInput) {
                if (targetInput.type === 'password') {
                    targetInput.type = 'text';
                    if (icon) {
                        icon.classList.remove('bi-eye');
                        icon.classList.add('bi-eye-slash');
                    }
                } else {
                    targetInput.type = 'password';
                    if (icon) {
                        icon.classList.remove('bi-eye-slash');
                        icon.classList.add('bi-eye');
                    }
                }
            }
        });
    });
}

document.addEventListener('DOMContentLoaded', initApp);
