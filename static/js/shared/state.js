/**
 * Application State Module — Phoenix Archery Academy
 * All data comes from the SQL database via Flask API.
 * No hardcoded student/coach/admin credentials or data.
 */

// Global application state
export const state = {
    currentUser:  null,   // { user_id, role, name, email, profile_id, profile }
    currentRole:  'student',
    searchedStudent: null, // For coach/admin search result
};

// ── Session helpers ──────────────────────────────────────────────────────────

export function setCurrentUser(userObj) {
    state.currentUser = userObj;
    state.currentRole = userObj?.role || 'student';
    // Store minimal info in sessionStorage so page refreshes work
    try {
        sessionStorage.setItem('aca_session', JSON.stringify({
            user_id:    userObj.user_id,
            role:       userObj.role,
            name:       userObj.name,
            email:      userObj.email,
            profile_id: userObj.profile_id,
        }));
    } catch (e) { /* storage disabled */ }
}

export function clearCurrentUser() {
    state.currentUser = null;
    state.currentRole = 'student';
    try { sessionStorage.removeItem('aca_session'); } catch (e) {}
}

export function getStoredSession() {
    try {
        const raw = sessionStorage.getItem('aca_session');
        return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
}
