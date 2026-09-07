/**
 * Student Dashboard Module
 * Manages student profile display, progress bars, attendance history, and Chart.js performance charts.
 */

import { state } from '../shared/state.js';
import { hideAllViews, showNavbar, showSection } from '../shared/navigation.js';
import { renderPublishedEventsGrid } from '../shared/alerts.js';

let stuBarChartInstance = null;
let stuPieChartInstance = null;

export function initStudentPortal(student) {
    hideAllViews();
    showNavbar('student', student.name);
    showSection('student-view');

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

    renderPublishedEventsGrid(state.events, 'stu-events-grid', 'stu-events-count');

    renderStudentCharts(student);
}

export function renderStudentSkillProgressBars(skillsObj, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

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
        tbody.innerHTML = `<tr><td colspan="3" class="text-center text-muted py-3">No attendance records found.</td></tr>`;
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
    if (stuBarChartInstance) stuBarChartInstance.destroy();
    if (stuPieChartInstance) stuPieChartInstance.destroy();

    const barCtx = document.getElementById('stuBarChart');
    if (barCtx) {
        const labels = student.scoresByEvaluation.map(s => s.date);
        const dataScores = student.scoresByEvaluation.map(s => s.score);

        stuBarChartInstance = new Chart(barCtx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Evaluation Score',
                    data: dataScores,
                    backgroundColor: 'rgba(15, 118, 110, 0.75)',
                    borderColor: '#0f766e',
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
        const pieLabels = Object.keys(student.skills);
        const pieData = Object.values(student.skills);

        stuPieChartInstance = new Chart(pieCtx, {
            type: 'pie',
            data: {
                labels: pieLabels,
                datasets: [{
                    data: pieData,
                    backgroundColor: ['#0f766e', '#14b8a6', '#f59e0b', '#0284c7', '#7c3aed']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }
}
