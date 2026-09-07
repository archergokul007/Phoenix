/**
 * Coach Dashboard Module
 * Manages coach profile, student roster, live student search, and student performance inspection.
 */

import { state } from '../shared/state.js';
import { hideAllViews, showNavbar, showSection } from '../shared/navigation.js';
import { renderPublishedEventsGrid } from '../shared/alerts.js';
import { renderStudentSkillProgressBars } from '../student/dashboard.js';

let coachBarChartInstance = null;
let coachPieChartInstance = null;

export function initCoachPortal() {
    hideAllViews();
    showNavbar('coach', 'Head Coach');
    showSection('coach-view');

    document.getElementById('coach-total-students-count').textContent = state.students.length;
    document.getElementById('coach-events-count').textContent = state.events.length;

    renderCoachStudentResults(state.students);
    renderPublishedEventsGrid(state.events, 'coach-events-grid', 'coach-events-count-badge');
}

export function handleCoachSearchLive() {
    const query = document.getElementById('coach-search-input').value.trim().toLowerCase();
    if (!query) {
        renderCoachStudentResults(state.students);
        return;
    }
    const filtered = state.students.filter(s => 
        s.id.toLowerCase().includes(query) || 
        s.name.toLowerCase().includes(query) || 
        s.course.toLowerCase().includes(query)
    );
    renderCoachStudentResults(filtered);
}

export function handleCoachSearchSubmit(e) {
    e.preventDefault();
    handleCoachSearchLive();
}

export function renderCoachStudentResults(studentsList) {
    const tbody = document.getElementById('coach-student-results-tbody');
    if (!tbody) return;

    if (studentsList.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-muted"><i class="bi bi-search me-1"></i> No matching students found.</td></tr>`;
        return;
    }

    let html = '';
    studentsList.forEach(s => {
        html += `
            <tr>
                <td class="ps-3"><span class="badge bg-dark fs-6">${s.id}</span></td>
                <td class="fw-bold text-dark">${s.name}</td>
                <td class="small">${s.course}</td>
                <td><span class="badge bg-info text-dark">${s.bowCategory}</span></td>
                <td><span class="badge bg-success-subtle text-success border border-success-subtle">${s.attendanceRate}%</span></td>
                <td class="fw-semibold text-warning">${s.examScore}</td>
                <td class="text-end pe-3">
                    <button type="button" class="btn btn-sm btn-primary rounded-pill px-3" onclick="inspectStudentPerformance('${s.id}')">
                        <i class="bi bi-graph-up-arrow me-1"></i> View Performance
                    </button>
                </td>
            </tr>
        `;
    });
    tbody.innerHTML = html;
}

export function inspectStudentPerformance(studentId) {
    const student = state.students.find(s => s.id === studentId);
    if (!student) return;

    const displayContainer = document.getElementById('coach-performance-display');
    if (displayContainer) displayContainer.classList.remove('d-none');

    document.getElementById('coach-viewed-stu-title').textContent = `Performance Dashboard: ${student.name} (${student.id})`;
    document.getElementById('coach-viewed-stu-name').textContent = `${student.id} - ${student.name}`;
    document.getElementById('coach-viewed-stu-dept').textContent = student.course;
    document.getElementById('coach-viewed-stu-att').textContent = `${student.attendanceRate}%`;
    document.getElementById('coach-viewed-stu-exam').textContent = `${student.examScore} (Rank ${student.rank})`;

    renderStudentSkillProgressBars(student.skills, 'coach-viewed-stu-skills');

    if (coachBarChartInstance) coachBarChartInstance.destroy();
    if (coachPieChartInstance) coachPieChartInstance.destroy();

    const barCtx = document.getElementById('coachBarChart');
    if (barCtx) {
        coachBarChartInstance = new Chart(barCtx, {
            type: 'bar',
            data: {
                labels: student.scoresByEvaluation.map(s => s.date),
                datasets: [{
                    label: 'Scores',
                    data: student.scoresByEvaluation.map(s => s.score),
                    backgroundColor: 'rgba(245, 158, 11, 0.75)',
                    borderColor: '#f59e0b',
                    borderWidth: 1.5
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, max: 360 } } }
        });
    }

    const pieCtx = document.getElementById('coachPieChart');
    if (pieCtx) {
        coachPieChartInstance = new Chart(pieCtx, {
            type: 'pie',
            data: {
                labels: Object.keys(student.skills),
                datasets: [{
                    data: Object.values(student.skills),
                    backgroundColor: ['#0f766e', '#14b8a6', '#f59e0b', '#0284c7', '#7c3aed']
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }

    displayContainer.scrollIntoView({ behavior: 'smooth' });
}

export function hideCoachPerformanceDisplay() {
    const displayContainer = document.getElementById('coach-performance-display');
    if (displayContainer) displayContainer.classList.add('d-none');
}
