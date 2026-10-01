# 🏹 Intelligent Archery Academy Management and Performance Analysis System

A comprehensive, end-to-end web portal and analytics platform for archery academies, providing role-based portals for **Students**, **Coaches**, and **Administrators** backed by a **MySQL 8** relational database and a **Flask** REST backend.

---

## 1. Project Description

The **Intelligent Archery Academy Management System** digitizes academy operations:
- **Students (View-Only)**: Review individualized performance scores, archery metrics (grouping, accuracy, distance), attendance records, bow/equipment maintenance status, invoices & payment history, and tournament announcements.
- **Coaches**: Search any student by Student ID (e.g. `STU001`), record archery scoring rounds with dynamic accuracy computation, log daily attendance, log equipment condition and maintenance cycles, and generate comprehensive progress reports for academy management.
- **Administrators**: Central administrative control with real-time dashboard analytics, student & coach directories, fee management, coach report reviews, and audit trails.

---

## 2. Technologies

- **Frontend**: Semantic HTML5, Vanilla CSS3 (custom responsive styling, glassmorphism, responsive data cards), Vanilla JavaScript (ES6+ modular state, asynchronous fetch API, Chart.js for scoring analytics).
- **Backend**: Python 3.10+, Flask REST API, Werkzeug (PBKDF2/scrypt password hashing & session management).
- **Database**: **MySQL 8** with InnoDB engine, parameterized queries, dynamic transactions, and audit logging.
- **Driver**: `mysql-connector-python`.

---

## 3. MySQL Installation & Setup

1. Install **MySQL Server 8.0+** (or MySQL Community Server) and MySQL Workbench if desired.
2. Start the MySQL service:
   ```powershell
   # Windows service check/start
   net start MySQL80
   ```
3. Verify connection via MySQL CLI:
   ```powershell
   mysql -u root -p
   ```

---

## 4. Database Creation

Open your MySQL prompt and run:

```sql
CREATE DATABASE IF NOT EXISTS archery_academy
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE archery_academy;
```

---

## 5. Schema Execution

Execute the full database DDL schema located in `database/schema.sql`:

```powershell
mysql -u root -p archery_academy < database/schema.sql
```

The schema establishes 13 relational tables with foreign keys and cascade integrity:
1. `users`: Central authentication with password hashes and roles (`student`, `coach`, `admin`).
2. `students`: Archer profiles linked to `users.id`.
3. `coaches`: Coach profiles linked to `users.id`.
4. `admins`: Administrator profiles linked to `users.id`.
5. `tournaments`: Upcoming and completed archery events.
6. `performance`: End-by-end arrow scores, accuracy, distance, and categories.
7. `attendance`: Daily presence/absence/leave tracking.
8. `bow_maintenance`: Bow inspection, string condition, nock calibration, and service dates.
9. `fees`: Invoices, fee types, payment statuses, and transaction receipts.
10. `training_schedules`: Range lane bookings and practice drill sessions.
11. `coach_reports`: Progress reports submitted by coaches to administration.
12. `notifications`: Real-time user notifications.
13. `activity_logs`: Comprehensive audit logging for all mutations.

---

## 6. Seed / Admin Setup

Execute `database/seed.sql` to populate initial accounts and sample records:

```powershell
mysql -u root -p archery_academy < database/seed.sql
```

Alternatively, running `python server.py` will automatically invoke `init_db()` which verifies schema tables and seeds initial administrative accounts.

---

## 7. Python Package Installation

Install required dependencies from `requirements.txt`:

```powershell
pip install -r requirements.txt
```

Packages included:
- `flask`
- `mysql-connector-python`
- `werkzeug`
- `python-dotenv`

---

## 8. MySQL Configuration (`.env`)

Configure your database credentials in `.env` (copy from `.env.example` if needed):

```ini
# Database Connection
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=root12
DB_NAME=archery_academy

# Server Settings
SECRET_KEY=phoenix-archery-secure-secret-key-2026
PORT=5500
HOST=127.0.0.1
```

---

## 9. How to Run the Application

### Option A: Using the Launcher
Double-click `run_server.bat` or run:
```powershell
.\start.ps1
```

### Option B: Terminal Command
```powershell
python server.py --port 5500
```

Access the application in your browser:
```text
http://127.0.0.1:5500
```

Health check endpoint:
```text
http://127.0.0.1:5500/api/health
```

Run test suite & database audit:
```powershell
python test_db.py
```

---

## 10. Login Roles & Default Credentials

| Role | Email / Identifier | Password | Access / Scope |
| :--- | :--- | :--- | :--- |
| **Admin 1** (Director) | `admin1@gmail.com` | `Admin@4321` | Full academy oversight, reports, finances, audit logs |
| **Admin 2** (Operations) | `admin2@gmail.com` | `Admin@4321` | Operations & range management |
| **Admin 3** (Finance) | `admin3@gmail.com` | `Admin@4321` | Fee structures & accounting |
| **Coach** | `coach@gmail.com` | `Coach@1234` | Search students, update performance, attendance & equipment, submit reports |
| **Student** | `student@gmail.com` | `Student@1234` | View-only personal performance, attendance, gear, fees & notifications |

---

## 11. Student Workflow

1. **Sign-Up**: Navigate to `/pages/register.html`, submit archer information (Name, Username, Email, Phone, Age Category, Bow Type). Account is registered with `role='student'` and a unique `STUxxx` identifier is assigned.
2. **Login**: Authenticate at `/pages/login.html` with Student credentials.
3. **View-Only Access**:
   - **Personal Dashboard**: View bow specifications, joined date, emergency contact.
   - **Performance Log**: Review score progression, accuracy percentage, and coach feedback remarks.
   - **Attendance**: Check presence history and attendance rate.
   - **Equipment Status**: View maintenance history and scheduled tuning dates.
   - **Fees**: Review fee payment status and payment history.
   - **Notifications**: Receive instant alerts when coaches update performance or equipment records.
4. **Security**: Students cannot access coach or admin dashboards, search other students, or modify any database record.

---

## 12. Coach Workflow

1. **Login**: Authenticate with Coach credentials (`coach@gmail.com` / `Coach@1234`).
2. **Search Student**: Enter Student ID (e.g. `STU001` or `STU002`) in the search bar. Real-time query fetches the student's live profile, recent scoring, attendance history, and equipment status.
3. **Update Performance**:
   - Enter Score, Total Arrows, Distance (e.g. `70m`), Category (`Recurve Bow`), and Coach Remarks.
   - Submitting executes a MySQL transaction: updates the `performance` table, logs an `activity_log`, creates a notification for the student, and sends an alert to the administrator.
4. **Update Attendance**: Mark student as Present, Absent, or Leave with session notes.
5. **Update Bow Maintenance**: Log equipment condition (`excellent`, `good`, `fair`, `needs_repair`), service details, and next service date.
6. **Submit Coach Report**: Submit structured evaluations (performance summary, attendance summary, bow maintenance summary) directly to the Administration.

---

## 13. Admin Workflow

1. **Login**: Authenticate with Administrator credentials (`admin1@gmail.com` / `Admin@4321`).
2. **Dashboard Overview**: Review total student count, active coaches, monthly fee collection, and academy performance averages.
3. **Student Directory & Search**: Browse all enrolled students or search by Student ID.
4. **Coach Oversight**: Review coach profiles and incoming progress reports from coaches.
5. **Fee Management**: Review paid, pending, and overdue fees; log invoice payments.
6. **Live Notifications**: View automated alerts generated whenever a coach updates a student's score, attendance, or bow maintenance.
7. **Audit Trail**: Review system `activity_logs` tracking every mutation across the platform.

---

## 14. Architecture Flow

```text
               CLIENT BROWSER (HTML5 / Vanilla CSS / ES6 JS)
                                     │
                                     ▼
                      FLASK REST BACKEND (server.py)
                         ├── Role Guards & Auth
                         ├── Parameterized Validations
                         └── Dynamic Transactions
                                     │
                                     ▼
                      MYSQL 8 RELATIONAL DATABASE
                         ├── users
                         ├── students
                         ├── coaches
                         ├── admins
                         ├── performance
                         ├── attendance
                         ├── bow_maintenance
                         ├── fees
                         ├── tournaments
                         ├── training_schedules
                         ├── coach_reports
                         ├── notifications
                         └── activity_logs
```
