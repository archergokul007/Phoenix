/**
 * API Service Client Module
 * Communicates with the SQLite Backend Server for all Student Operations.
 */

// Dynamically determine the backend API base URL
function getApiBaseUrl() {
    const origin = window.location.origin;
    // If running on standard Flask port or relative host
    if (window.location.port === '5500' || window.location.port === '5000') {
        return '';
    }
    // If user opened via http.server on port 8000, target the Flask server on 5500
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return 'http://127.0.0.1:5500';
    }
    return '';
}

export const API_BASE = getApiBaseUrl();

async function request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const defaultHeaders = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    };

    try {
        const response = await fetch(url, {
            ...options,
            headers: {
                ...defaultHeaders,
                ...(options.headers || {})
            }
        });

        const data = await response.json().catch(() => ({}));
        return {
            ok: response.ok,
            status: response.status,
            data: data
        };
    } catch (err) {
        console.warn(`[API] Network error connecting to database API (${url}):`, err.message);
        return {
            ok: false,
            status: 0,
            error: err.message,
            data: { success: false, message: `Database server unreachable (${err.message}). Ensure "python server.py" is running.` }
        };
    }
}

export const api = {
    // Health & DB status
    async checkHealth() {
        return await request('/api/health');
    },

    // Student Registration
    async registerStudent(studentData) {
        return await request('/api/students/register', {
            method: 'POST',
            body: JSON.stringify(studentData)
        });
    },

    // Student Login
    async loginStudent(identifier, password) {
        return await request('/api/students/login', {
            method: 'POST',
            body: JSON.stringify({ identifier, password })
        });
    },

    // Get all students (for sync, directory, rosters)
    async getAllStudents() {
        return await request('/api/students');
    },

    // Get single student profile
    async getStudent(studentId) {
        return await request(`/api/students/${encodeURIComponent(studentId)}`);
    },

    // Practice Slot Booking
    async bookTrainingSlot(studentId, scheduleId) {
        return await request(`/api/students/${encodeURIComponent(studentId)}/schedule/book`, {
            method: 'POST',
            body: JSON.stringify({ scheduleId })
        });
    },

    async cancelTrainingSlot(studentId, scheduleId) {
        return await request(`/api/students/${encodeURIComponent(studentId)}/schedule/cancel`, {
            method: 'POST',
            body: JSON.stringify({ scheduleId })
        });
    },

    async getStudentSlotBookings(studentId) {
        return await request(`/api/students/${encodeURIComponent(studentId)}/schedule/bookings`);
    },

    async getAllSlotBookings() {
        return await request('/api/schedules/bookings');
    },

    // Equipment Service Requests
    async submitEquipmentRequest(reqData) {
        return await request('/api/equipment-requests', {
            method: 'POST',
            body: JSON.stringify(reqData)
        });
    },

    async getStudentEquipmentRequests(studentId) {
        return await request(`/api/students/${encodeURIComponent(studentId)}/equipment-requests`);
    },

    // Fee Invoices and Payments
    async getStudentFees(studentId) {
        return await request(`/api/students/${encodeURIComponent(studentId)}/fees`);
    },

    async payFeeInvoice(invoiceId, paymentData) {
        return await request(`/api/fees/${encodeURIComponent(invoiceId)}/pay`, {
            method: 'POST',
            body: JSON.stringify(paymentData)
        });
    }
};
