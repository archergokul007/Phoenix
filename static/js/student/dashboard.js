/**
 * Student Dashboard Module
 * Manages student profile display, progress bars, attendance history, and Chart.js performance charts.
 */

import { state } from '../shared/state.js';
import { hideAllViews, showNavbar, showSection } from '../shared/navigation.js';
import { renderPublishedEventsGrid } from '../shared/alerts.js';
import { renderStudentSchedule } from '../schedule/schedule.js';
import { renderStudentEquipment } from '../equipment/equipment.js';
import { renderStudentFees } from '../fees/fees.js';
import { api } from '../shared/api.js';

let stuBarChartInstance = null;
let stuPieChartInstance = null;

export function renderStudentViewData(student) {
    document.getElementById('stu-welcome-name').textContent = `Welcome, ${student.name}!`;
    document.getElementById('stu-header-id').textContent = student.id;
    document.getElementById('stu-header-dept').textContent = student.course;

    document.getElementById('stu-card-id').textContent = student.id;
    document.getElementById('stu-card-attendance').textContent = `${student.attendanceRate}%`;
    document.getElementById('stu-card-overall').textContent = `${student.overallScore}% (${student.grade})`;
    document.getElementById('stu-card-exam').textContent = `${student.examScore} (Rank ${student.rank})`;

    document.getElementById('stu-prof-id').textContent = student.id;
    document.getElementById('stu-prof-name').textContent = student.name;
    document.getElementById('stu-prof-email').textContent = student.email;
    document.getElementById('stu-prof-phone').textContent = student.phone || '-';
    document.getElementById('stu-prof-course').textContent = student.course;
    document.getElementById('stu-prof-yearsem').textContent = student.yearSem;
    document.getElementById('stu-prof-bowcat').textContent = student.bowCategory;
    document.getElementById('stu-prof-exp').textContent = student.experience;

    renderStudentSkillProgressBars(student.skills, 'stu-skill-progress-bars');

    document.getElementById('stu-progress-notes').textContent = student.progressSummary;

    document.getElementById('stu-att-badge').textContent = `Rate: ${student.attendanceRate}%`;
    renderAttendanceTable(student.attendanceRecords, 'stu-att-tbody');

    renderStudentSchedule(student);
    renderStudentEquipment(student);
    renderStudentFees(student);

    renderPublishedEventsGrid(state.events, 'stu-events-grid', 'stu-events-count');

    renderStudentCharts(student);
}

export async function initStudentPortal(student) {
    hideAllViews();
    showNavbar('student', student.name);
    showSection('student-view');

    renderStudentViewData(student);

    // Asynchronously check DB connection and refresh with latest SQLite data
    try {
        const healthRes = await api.checkHealth();
        const dbBadge = document.getElementById('stu-db-status');
        if (dbBadge) {
            if (healthRes.ok && healthRes.data && healthRes.data.status === 'online') {
                dbBadge.className = 'badge bg-success-subtle text-success border border-success-subtle rounded-pill px-3 py-1';
                dbBadge.innerHTML = '<i class="bi bi-database-check me-1"></i> SQLite Database Connected';
            } else {
                dbBadge.className = 'badge bg-secondary-subtle text-secondary border rounded-pill px-3 py-1';
                dbBadge.innerHTML = '<i class="bi bi-database-slash me-1"></i> Database Offline (Local)';
            }
        }

        // Fetch fresh student profile and scores from SQLite DB
        const freshStuRes = await api.getStudent(student.id);
        if (freshStuRes.ok && freshStuRes.data && freshStuRes.data.student) {
            const updated = freshStuRes.data.student;
            state.currentUser = updated;
            renderStudentViewData(updated);
        }

        // Fetch fresh student equipment requests from SQLite DB
        const reqRes = await api.getStudentEquipmentRequests(student.id);
        if (reqRes.ok && reqRes.data && Array.isArray(reqRes.data.requests)) {
            const otherReqs = (state.equipmentRequests || []).filter(r => r.studentId !== student.id);
            state.equipmentRequests = [...reqRes.data.requests, ...otherReqs];
            renderStudentEquipment(state.currentUser || student);
        }

        // Fetch fresh fees from SQLite DB
        const feesRes = await api.getStudentFees(student.id);
        if (feesRes.ok && feesRes.data && Array.isArray(feesRes.data.fees)) {
            const otherFees = (state.fees || []).filter(f => f.studentId !== student.id);
            state.fees = [...feesRes.data.fees, ...otherFees];
            renderStudentFees(state.currentUser || student);
        }

        // Fetch fresh slot bookings from SQLite DB
        const bookingsRes = await api.getStudentSlotBookings(student.id);
        if (bookingsRes.ok && bookingsRes.data && Array.isArray(bookingsRes.data.bookings)) {
            const myBookings = bookingsRes.data.bookings;
            (state.schedules || []).forEach(sch => {
                if (!sch.enrolled) sch.enrolled = [];
                const hasMe = sch.enrolled.includes(student.id);
                const shouldHaveMe = myBookings.includes(sch.id);
                if (shouldHaveMe && !hasMe) sch.enrolled.push(student.id);
                if (!shouldHaveMe && hasMe) sch.enrolled = sch.enrolled.filter(id => id !== student.id);
            });
            renderStudentSchedule(state.currentUser || student);
        }
    } catch (e) {
        console.warn("[Student Dashboard] SQLite background sync deferred:", e);
    }
}

export function renderStudentSkillProgressBars(skillsObj, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!skillsObj || Object.keys(skillsObj).length === 0) {
        container.innerHTML = `
            <div class="text-center text-muted py-4">
                <i class="bi bi-award fs-3 text-secondary opacity-50 d-block mb-2"></i>
                <p class="mb-1 fw-semibold small">No skills evaluated yet</p>
                <small class="text-secondary">Skills assessment will appear once evaluated by your coach.</small>
            </div>
        `;
        return;
    }

    let html = '';
    for (const [skillName, score] of Object.entries(skillsObj)) {
        let colorClass = 'bg-primary';
        if (score >= 90) colorClass = 'bg-success';
        else if (score >= 80) colorClass = 'bg-info';
        else if (score >= 70) colorClass = 'bg-warning';

        html += `
            <div class="mb-3">
                <div class="d-flex justify-content-between align-items-center mb-1">
                    <span class="fw-semibold text-dark small">${skillName}</span>
                    <span class="fw-bold small text-muted">${score}%</span>
                </div>
                <div class="progress" style="height: 10px; border-radius: 6px;">
                    <div class="progress-bar ${colorClass}" role="progressbar" style="width: ${score}%;" aria-valuenow="${score}" aria-valuemin="0" aria-valuemax="100"></div>
                </div>
            </div>
        `;
    }
    container.innerHTML = html;
}

export function renderAttendanceTable(records, tbodyId) {
    const tbody = document.getElementById(tbodyId);
    if (!tbody) return;

    if (!records || records.length === 0) {
        tbody.innerHTML = `<tr><td colspan="3" class="text-center text-muted py-4"><i class="bi bi-calendar-x fs-4 text-secondary opacity-50 d-block mb-1"></i>No attendance records found yet.</td></tr>`;
        return;
    }

    let html = '';
    records.forEach(rec => {
        let badgeClass = 'bg-success';
        if (rec.status === 'Absent') badgeClass = 'bg-danger';
        else if (rec.status === 'Late') badgeClass = 'bg-warning text-dark';

        html += `
            <tr>
                <td class="ps-4 fw-semibold text-dark">${rec.date}</td>
                <td><span class="badge ${badgeClass} px-3 py-1 rounded-pill">${rec.status}</span></td>
                <td class="text-secondary small">${rec.remarks || '-'}</td>
            </tr>
        `;
    });
    tbody.innerHTML = html;
}

export function renderStudentCharts(student) {
    if (stuBarChartInstance) {
        stuBarChartInstance.destroy();
        stuBarChartInstance = null;
    }
    if (stuPieChartInstance) {
        stuPieChartInstance.destroy();
        stuPieChartInstance = null;
    }

    const evals = (student && Array.isArray(student.scoresByEvaluation)) ? student.scoresByEvaluation : [];
    const skills = (student && student.skills && typeof student.skills === 'object') ? student.skills : {};

    const barCtx = document.getElementById('stuBarChart');
    if (barCtx) {
        const labels = evals.length > 0 ? evals.map(s => s.date) : ['No Sessions Yet'];
        const dataScores = evals.length > 0 ? evals.map(s => s.score) : [0];

        stuBarChartInstance = new Chart(barCtx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Evaluation Score',
                    data: dataScores,
                    backgroundColor: evals.length > 0 ? 'rgba(15, 118, 110, 0.75)' : 'rgba(203, 213, 225, 0.4)',
                    borderColor: evals.length > 0 ? '#0f766e' : '#cbd5e1',
                    borderWidth: 1.5,
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { beginAtZero: true, max: 360 }
                }
            }
        });
    }

    const pieCtx = document.getElementById('stuPieChart');
    if (pieCtx) {
        const pieKeys = Object.keys(skills);
        const pieLabels = pieKeys.length > 0 ? pieKeys : ['Pending Assessment'];
        const pieData = pieKeys.length > 0 ? Object.values(skills) : [100];
        const pieColors = pieKeys.length > 0 ? ['#0f766e', '#14b8a6', '#f59e0b', '#0284c7', '#7c3aed'] : ['#e2e8f0'];

        stuPieChartInstance = new Chart(pieCtx, {
            type: 'pie',
            data: {
                labels: pieLabels,
                datasets: [{
                    data: pieData,
                    backgroundColor: pieColors
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }
}
