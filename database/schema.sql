-- =============================================================================
-- Archery Academy Management System — Full Database Schema
-- Database: archery_academy
-- =============================================================================

CREATE DATABASE IF NOT EXISTS archery_academy
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE archery_academy;

-- =============================================================================
-- 1. USERS — Central auth table (student / coach / admin)
-- =============================================================================
CREATE TABLE IF NOT EXISTS users (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    username      VARCHAR(50)  UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role          ENUM('student','coach','admin') NOT NULL,
    name          VARCHAR(100) NOT NULL,
    email         VARCHAR(100) UNIQUE NOT NULL,
    phone         VARCHAR(20),
    status        ENUM('active','inactive') DEFAULT 'active',
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 2. STUDENTS
-- =============================================================================
CREATE TABLE IF NOT EXISTS students (
    student_id        VARCHAR(20) PRIMARY KEY,
    user_id           INT NOT NULL,
    first_name        VARCHAR(50) NOT NULL,
    last_name         VARCHAR(50),
    date_of_birth     DATE,
    gender            VARCHAR(10),
    phone             VARCHAR(20),
    email             VARCHAR(100) NOT NULL,
    address           TEXT,
    joining_date      DATE,
    emergency_contact VARCHAR(100),
    bow_type          VARCHAR(50) DEFAULT 'Recurve',
    bow_category      VARCHAR(50) DEFAULT 'Recurve Bow',
    experience        VARCHAR(30) DEFAULT 'Beginner',
    age_category      VARCHAR(30),
    status            ENUM('active','inactive','suspended') DEFAULT 'active',
    created_at        DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_student_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 3. COACHES
-- =============================================================================
CREATE TABLE IF NOT EXISTS coaches (
    coach_id       VARCHAR(20) PRIMARY KEY,
    user_id        INT NOT NULL,
    coach_name     VARCHAR(100) NOT NULL,
    email          VARCHAR(100) NOT NULL,
    phone          VARCHAR(20),
    qualification  VARCHAR(150),
    experience     VARCHAR(50),
    specialization VARCHAR(100),
    joining_date   DATE,
    status         ENUM('active','inactive') DEFAULT 'active',
    created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_coach_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 4. ADMINS
-- =============================================================================
CREATE TABLE IF NOT EXISTS admins (
    admin_id   VARCHAR(20) PRIMARY KEY,
    user_id    INT NOT NULL,
    admin_name VARCHAR(100) NOT NULL,
    email      VARCHAR(100) NOT NULL,
    phone      VARCHAR(20),
    title      VARCHAR(150),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_admin_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 5. TOURNAMENTS
-- =============================================================================
CREATE TABLE IF NOT EXISTS tournaments (
    tournament_id         INT AUTO_INCREMENT PRIMARY KEY,
    tournament_name       VARCHAR(200) NOT NULL,
    tournament_date       DATE,
    location              VARCHAR(200),
    category              VARCHAR(50),
    distance              VARCHAR(50),
    organizer             VARCHAR(100),
    registration_deadline DATE,
    description           TEXT,
    status                ENUM('upcoming','ongoing','completed','cancelled') DEFAULT 'upcoming',
    created_at            DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 6. PERFORMANCE
-- =============================================================================
CREATE TABLE IF NOT EXISTS performance (
    performance_id   INT AUTO_INCREMENT PRIMARY KEY,
    student_id       VARCHAR(20) NOT NULL,
    coach_id         VARCHAR(20) NOT NULL,
    tournament_id    INT,
    score            DECIMAL(6,2),
    total_arrows     INT,
    accuracy         DECIMAL(5,2),
    distance         VARCHAR(30),
    category         VARCHAR(50),
    performance_date DATE NOT NULL,
    remarks          TEXT,
    created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at       DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_perf_student    FOREIGN KEY (student_id)    REFERENCES students(student_id)       ON DELETE CASCADE,
    CONSTRAINT fk_perf_coach      FOREIGN KEY (coach_id)      REFERENCES coaches(coach_id)          ON DELETE CASCADE,
    CONSTRAINT fk_perf_tournament FOREIGN KEY (tournament_id) REFERENCES tournaments(tournament_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 7. ATTENDANCE
-- =============================================================================
CREATE TABLE IF NOT EXISTS attendance (
    attendance_id   INT AUTO_INCREMENT PRIMARY KEY,
    student_id      VARCHAR(20) NOT NULL,
    coach_id        VARCHAR(20) NOT NULL,
    attendance_date DATE NOT NULL,
    status          ENUM('present','absent','leave','late') NOT NULL,
    remarks         TEXT,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_att_student FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
    CONSTRAINT fk_att_coach   FOREIGN KEY (coach_id)   REFERENCES coaches(coach_id)   ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 8. BOW MAINTENANCE
-- =============================================================================
CREATE TABLE IF NOT EXISTS bow_maintenance (
    maintenance_id        INT AUTO_INCREMENT PRIMARY KEY,
    student_id            VARCHAR(20) NOT NULL,
    coach_id              VARCHAR(20) NOT NULL,
    equipment_name        VARCHAR(100),
    equipment_number      VARCHAR(50),
    maintenance_date      DATE NOT NULL,
    `condition`           ENUM('excellent','good','fair','poor','needs_repair') DEFAULT 'good',
    maintenance_details   TEXT,
    next_maintenance_date DATE,
    status                ENUM('done','pending','in_progress') DEFAULT 'pending',
    remarks               TEXT,
    created_at            DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at            DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_maint_student FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
    CONSTRAINT fk_maint_coach   FOREIGN KEY (coach_id)   REFERENCES coaches(coach_id)   ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 9. FEES
-- =============================================================================
CREATE TABLE IF NOT EXISTS fees (
    fee_id                INT AUTO_INCREMENT PRIMARY KEY,
    student_id            VARCHAR(20) NOT NULL,
    amount                DECIMAL(10,2) NOT NULL,
    fee_type              VARCHAR(50) NOT NULL,
    payment_date          DATE,
    payment_method        VARCHAR(30),
    payment_status        ENUM('pending','paid','overdue') DEFAULT 'pending',
    due_date              DATE,
    transaction_reference VARCHAR(80),
    remarks               TEXT,
    created_at            DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_fee_student FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 10. TRAINING SCHEDULES
-- =============================================================================
CREATE TABLE IF NOT EXISTS training_schedules (
    schedule_id   INT AUTO_INCREMENT PRIMARY KEY,
    coach_id      VARCHAR(20) NOT NULL,
    student_id    VARCHAR(20),
    training_date DATE,
    start_time    TIME,
    end_time      TIME,
    training_type VARCHAR(80),
    location      VARCHAR(200),
    description   TEXT,
    status        ENUM('scheduled','completed','cancelled') DEFAULT 'scheduled',
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_sched_coach   FOREIGN KEY (coach_id)   REFERENCES coaches(coach_id)   ON DELETE CASCADE,
    CONSTRAINT fk_sched_student FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 11. COACH REPORTS
-- =============================================================================
CREATE TABLE IF NOT EXISTS coach_reports (
    report_id              INT AUTO_INCREMENT PRIMARY KEY,
    coach_id               VARCHAR(20) NOT NULL,
    student_id             VARCHAR(20) NOT NULL,
    report_title           VARCHAR(200),
    report_message         TEXT,
    performance_summary    TEXT,
    attendance_summary     TEXT,
    bow_maintenance_summary TEXT,
    status                 ENUM('draft','sent','reviewed') DEFAULT 'sent',
    created_at             DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_report_coach   FOREIGN KEY (coach_id)   REFERENCES coaches(coach_id)   ON DELETE CASCADE,
    CONSTRAINT fk_report_student FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 12. NOTIFICATIONS
-- =============================================================================
CREATE TABLE IF NOT EXISTS notifications (
    notification_id   INT AUTO_INCREMENT PRIMARY KEY,
    user_id           INT NOT NULL,
    student_id        VARCHAR(20),
    coach_id          VARCHAR(20),
    notification_type VARCHAR(50),
    title             VARCHAR(200),
    message           TEXT,
    related_record_id VARCHAR(50),
    is_read           TINYINT(1) DEFAULT 0,
    created_at        DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_notif_user    FOREIGN KEY (user_id)    REFERENCES users(id)                    ON DELETE CASCADE,
    CONSTRAINT fk_notif_student FOREIGN KEY (student_id) REFERENCES students(student_id)         ON DELETE CASCADE,
    CONSTRAINT fk_notif_coach   FOREIGN KEY (coach_id)   REFERENCES coaches(coach_id)            ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 13. ACTIVITY LOGS (Audit Trail)
-- =============================================================================
CREATE TABLE IF NOT EXISTS activity_logs (
    log_id      INT AUTO_INCREMENT PRIMARY KEY,
    user_id     INT NOT NULL,
    role        VARCHAR(20),
    action      VARCHAR(80),
    table_name  VARCHAR(50),
    record_id   VARCHAR(50),
    description TEXT,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_log_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
