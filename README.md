# 🎯 Phoenix Elite Sports Academy

An intelligent, modern web portal for managing archery and sports training, performance tracking, events, and operations at **Phoenix Elite Sports Academy**.

---

## ⚡ Quick Start: How to Run Locally

The academy system includes a **Python Flask & SQLite Database Backend** (`academy.db`) providing real-time database persistence for student operations (Registration, Authentication, Profile, Practice Slot Booking, Equipment Requests, and Fee Payments).

### Option 1: Double-Click Launcher (Easiest)

1. Navigate to the project root: `d:\archeryacademymanagement`
2. Double-click `run_server.bat`
3. It launches `server.py`, connects to `academy.db`, and opens **`http://127.0.0.1:5500`** in your browser.

---

### Option 2: Using Terminal (Recommended)

1. Open PowerShell or Command Prompt inside the project directory:
   ```powershell
   cd d:\archeryacademymanagement
   ```

2. Start the database & application server:
   ```powershell
   python server.py
   ```

3. Open your browser and navigate to:
   ```
   http://127.0.0.1:5500
   ```

---

## 🗄️ Database Architecture (SQLite)

All **Student Operations** are connected directly to the local SQLite database (`academy.db`):

- **Database File**: `academy.db` (auto-created on start)
- **Database Driver**: Python standard library `sqlite3` + `Flask` REST API
- **Tables Connected**:
  - `students`: Enrolled archer records, credentials, profile, skills, attendance statistics.
  - `student_attendance`: Historical training presence/absence and session notes.
  - `student_scores`: Historical scoring rounds and Chart.js trend evaluations.
  - `training_slot_bookings`: Real-time range practice lane bookings and cancellations.
  - `equipment_requests`: Bow repair, tuning, and checkout service tickets.
  - `fees`: Invoices, online payment processing, and branded receipts.

---

## 🔑 Login Credentials

### 🛡️ Administrator Logins (3 Built-in Hardcoded Accounts)

Select the **Admin** login card or use the **Quick Admin Demo Logins** shortcuts on the login screen:

| Admin Account | Email / Username | Password | Access Level & Role |
| :--- | :--- | :--- | :--- |
| **Admin 1 (Director)** | `admin1@gmail.com` / `admin@gmail.com` (or `admin` / `admin1`) | `Admin@4321` | Academy Director & Master Admin |
| **Admin 2 (Operations)** | `admin2@gmail.com` (or `admin2`) | `Admin@4321` | Range Operations & Equipment Manager |
| **Admin 3 (Finance & Events)** | `admin3@gmail.com` (or `admin3`) | `Admin@4321` | Tournament Coordinator & Accounts Head |

---

### 🏹 Students & Coaches (Self-Registration)
- **No hardcoded student or coach accounts**: All students and coaches register dynamically.
- **Student Registration**: Click **"Register as Student"** on the login page to register a new archer account.
- **Coach Registration**: Click **"Register as Coach"** on the login page or within the registration portal to join the academy coaching staff.

---

## 🏹 Portals & Key Features

### 1. Student Portal
- **Score Analytics**: View historical practice rounds, 10-ring accuracy, and Chart.js trend curves.
- **Skills Evaluation**: Form & Posture, Aim & Anchor, Release Technique, Mental Focus, and Stamina.
- **Training Schedule**: View category-recommended weekly training batches (70m/50m/18m), shooting lanes, and reserve practice slots with real-time capacity tracking.
- **Equipment & Service Desk**: View academy-issued bows and gear; submit repair, tuning, and checkout service requests with live status updates.
- **Fee Management & Receipts**: Track tuition, bow rental, and tournament dues; pay online via instant simulated gateway; generate and print official branded Academy Fee Receipts.
- **Attendance Records**: Track present/absent/late counts and session notes.

### 2. Coach Portal
- **Trainee Directory**: Search and filter archers by name, category (Recurve, Compound, Indian Bow), or grade.
- **Performance Inspection**: Inspect individual archer Chart.js progress curves, skill breakdown, and coach notes.
- **Training Batches & Rosters**: View weekly sessions, lane assignments, and rosters of checked-in archers per training slot.
- **Equipment Roster**: Inspect academy bow conditions, armory storage locations, and quickly flag items for maintenance.

### 3. Admin Portal
- **Academy Financial Ledger & Fee Management**: Real-time revenue KPI summary, issue student invoices (monthly training, gear rental, tournament entry), record offline payments, and audit printable receipts.
- **Equipment & Armory Inventory**: Register new equipment, allocate gear to enrolled students, track condition lifecycles, and approve/reject archer service requests.
- **Training Schedule Master**: Create and manage weekly batches across multiple shooting ranges and lanes with assigned coaches, target distances, and capacity limits.
- **Event Management**: Publish tournaments, selection trials, and bow tuning workshops with instant broadcasting.

---

## 🛠️ Technology Stack

- **Frontend**: HTML5, Vanilla CSS3 (glassmorphism & responsive design), JavaScript ES6+ (Modular ES Modules)
- **Styling & UI**: [Bootstrap 5.3.3](https://getbootstrap.com/), [Bootstrap Icons](https://icons.getbootstrap.com/)
- **Charts & Visualizations**: [Chart.js](https://www.chartjs.org/)
- **Persistence**: Browser `localStorage` with reactive multi-module state synchronization

