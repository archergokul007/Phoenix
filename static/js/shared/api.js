/**
 * API Service Client — Phoenix Archery Academy
 * All requests go to the Flask server (same origin).
 * Flask handles session cookies automatically via credentials: 'include'.
 */

const API_BASE = '';  // Same origin — Flask serves both frontend and backend

async function req(endpoint, options = {}) {
    const url = `${window.location.origin}${endpoint}`;
    try {
        const response = await fetch(url, {
            credentials: 'include',  // Send session cookies
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', ...( options.headers || {}) },
            ...options,
        });
        const data = await response.json().catch(() => ({}));
        return { ok: response.ok, status: response.status, data };
    } catch (err) {
        console.warn(`[API] Error on ${endpoint}:`, err.message);
        return { ok: false, status: 0, data: { success: false, message: `Server unreachable: ${err.message}` } };
    }
}

function post(endpoint, body) {
    return req(endpoint, { method: 'POST', body: JSON.stringify(body) });
}

export const api = {

    // ── Auth ────────────────────────────────────────────────────────────────
    getSession() {
        return req('/api/session');
    },
    login(identifier, password, role) {
        return post('/api/auth/login', { identifier, password, role });
    },
    logout() {
        return post('/api/auth/logout', {});
    },
    registerStudent(data) {
        return post('/api/auth/register/student', data);
    },
    registerCoach(data) {
        return post('/api/auth/register/coach', data);
    },

    // ── Student ─────────────────────────────────────────────────────────────
    getStudentProfile() {
        return req('/api/student/profile');
    },
    getStudentPerformance() {
        return req('/api/student/performance');
    },
    getStudentAttendance() {
        return req('/api/student/attendance');
    },
    getStudentBowMaintenance() {
        return req('/api/student/bow-maintenance');
    },
    getStudentFees() {
        return req('/api/student/fees');
    },
    getStudentNotifications(unreadOnly = false) {
        return req(`/api/student/notifications${unreadOnly ? '?unread_only=true' : ''}`);
    },
    markStudentNotificationRead(notifId) {
        return post(`/api/student/notifications/${notifId}/read`, {});
    },
    markAllStudentNotificationsRead() {
        return post('/api/student/notifications/read-all', {});
    },

    // ── Coach ────────────────────────────────────────────────────────────────
    getCoachDashboardStats() {
        return req('/api/coach/dashboard-stats');
    },
    coachSearchStudent(studentId) {
        return req(`/api/coach/search-student?student_id=${encodeURIComponent(studentId)}`);
    },
    getCoachStudentPerformance(studentId) {
        return req(`/api/coach/student/${encodeURIComponent(studentId)}/performance`);
    },
    updatePerformance(data) {
        return post('/api/coach/performance/update', data);
    },
    getCoachStudentAttendance(studentId) {
        return req(`/api/coach/student/${encodeURIComponent(studentId)}/attendance`);
    },
    updateAttendance(data) {
        return post('/api/coach/attendance/update', data);
    },
    getCoachStudentBowMaintenance(studentId) {
        return req(`/api/coach/student/${encodeURIComponent(studentId)}/bow-maintenance`);
    },
    updateBowMaintenance(data) {
        return post('/api/coach/bow-maintenance/update', data);
    },
    sendCoachReport(data) {
        return post('/api/coach/send-report', data);
    },

    // ── Admin ────────────────────────────────────────────────────────────────
    getAdminDashboardStats() {
        return req('/api/admin/dashboard-stats');
    },
    adminSearchStudent(studentId) {
        return req(`/api/admin/search-student?student_id=${encodeURIComponent(studentId)}`);
    },
    getAllStudents() {
        return req('/api/admin/students');
    },
    getAdminStudent(studentId) {
        return req(`/api/admin/student/${encodeURIComponent(studentId)}`);
    },
    getAdminStudentPerformance(studentId) {
        return req(`/api/admin/student/${encodeURIComponent(studentId)}/performance`);
    },
    getAdminStudentAttendance(studentId) {
        return req(`/api/admin/student/${encodeURIComponent(studentId)}/attendance`);
    },
    getAdminStudentFees(studentId) {
        return req(`/api/admin/student/${encodeURIComponent(studentId)}/fees`);
    },
    getAdminStudentBowMaintenance(studentId) {
        return req(`/api/admin/student/${encodeURIComponent(studentId)}/bow-maintenance`);
    },
    addFee(studentId, data) {
        return post(`/api/admin/student/${encodeURIComponent(studentId)}/fees`, data);
    },
    markFeePaid(feeId, data) {
        return post(`/api/admin/fees/${feeId}/pay`, data);
    },
    getAllCoaches() {
        return req('/api/admin/coaches');
    },
    getAllReports(studentId = null) {
        const qs = studentId ? `?student_id=${encodeURIComponent(studentId)}` : '';
        return req(`/api/admin/reports${qs}`);
    },
    getAdminNotifications(unreadOnly = false) {
        return req(`/api/admin/notifications${unreadOnly ? '?unread_only=true' : ''}`);
    },
    markAdminNotificationRead(notifId) {
        return post(`/api/admin/notifications/${notifId}/read`, {});
    },
    markAllAdminNotificationsRead() {
        return post('/api/admin/notifications/read-all', {});
    },
    getActivityLogs(limit = 50) {
        return req(`/api/admin/activity-logs?limit=${limit}`);
    },
    getAllAdminFees(status = '') {
        const qs = status ? `?status=${encodeURIComponent(status)}` : '';
        return req(`/api/admin/fees${qs}`);
    },
    getTournaments() {
        return req('/api/admin/tournaments');
    },

    // ── Schedule ─────────────────────────────────────────────────────────────
    bookTrainingSlot(studentId, scheduleId) {
        return post('/api/student/training/book', { student_id: studentId, schedule_id: scheduleId });
    },
    cancelTrainingSlot(studentId, scheduleId) {
        return post('/api/student/training/cancel', { student_id: studentId, schedule_id: scheduleId });
    },

    // ── Health ───────────────────────────────────────────────────────────────
    checkHealth() {
        return req('/api/health');
    },
};
