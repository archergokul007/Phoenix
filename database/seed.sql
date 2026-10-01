-- =============================================================================
-- Phoenix Archery Academy — Seed Data for archery_academy Database
-- Run this AFTER schema.sql to populate test users and accounts.
-- =============================================================================

USE archery_academy;

-- -----------------------------------------------------------------------------
-- 1. USERS & ADMIN ACCOUNTS
-- Credentials:
--   Admin:   admin@gmail.com / Admin@1234
--   Coach:   coach@gmail.com / Coach@1234
--   Student: student@gmail.com / Student@1234
-- -----------------------------------------------------------------------------
INSERT INTO users (id, username, password_hash, role, name, email, phone, status, created_at)
VALUES
(1, 'admin', 'scrypt:32768:8:1$u9dn0GJQL05nzit1$84836d1cacec528a484af4b9545f4105c86b1294d46087870c5ac6dc52a2a57af0a575957938f210254c8f7270b5f0e4be713d9d62a64d15bb65deb3a7cf44bb', 'admin', 'Academy Director', 'admin@gmail.com', '+91 98765 00001', 'active', NOW()),
(2, 'admin2', 'scrypt:32768:8:1$AXpyju5JpNzRda46$86c663e85b664995f7d5844b64e4f337e85dddf647ddfd0010eee310d25a36bdae0edb66c7359cfcb0905bb1df879d9dc8bd59e57dcd140b9f7310bc373874be', 'admin', 'Operations Admin', 'admin2@gmail.com', '+91 98765 00002', 'active', NOW()),
(3, 'admin3', 'scrypt:32768:8:1$AXpyju5JpNzRda46$86c663e85b664995f7d5844b64e4f337e85dddf647ddfd0010eee310d25a36bdae0edb66c7359cfcb0905bb1df879d9dc8bd59e57dcd140b9f7310bc373874be', 'admin', 'Finance Admin', 'admin3@gmail.com', '+91 98765 00003', 'active', NOW()),
(4, 'student1', 'scrypt:32768:8:1$Z28urdCJR8OKn9eq$a4d325d3f0c1f2858161de61cbbfdc5b97ba79494d9d787b82f9c20f7a761cfde586a2c4a2e9065fbbd38e1c2bc9e85ab5408af090d8dfa7a706de38ff5ce30f', 'student', 'Arjun Kumar', 'student@gmail.com', '9876543210', 'active', NOW()),
(5, 'coach1', 'scrypt:32768:8:1$9l31NMPSyK6rbxNy$1424e93626cbe45f85d9817a3c8133808cea0a9c3493173596f0bd946d9278320abe0151feb6c35aa725f19b0ab7e22c89ab26b6b260b74ff784b7da6daa1c6a', 'coach', 'Coach Ramesh', 'coach@gmail.com', '9123456789', 'active', NOW())
ON DUPLICATE KEY UPDATE
    password_hash = VALUES(password_hash),
    role = VALUES(role),
    name = VALUES(name),
    status = VALUES(status);

-- -----------------------------------------------------------------------------
-- 2. ADMINS TABLE
-- -----------------------------------------------------------------------------
INSERT INTO admins (admin_id, user_id, admin_name, email, phone, title, created_at)
VALUES
('ADM001', 1, 'Academy Director', 'admin@gmail.com', '+91 98765 00001', 'Director', NOW()),
('ADM002', 2, 'Operations Admin', 'admin2@gmail.com', '+91 98765 00002', 'Operations Manager', NOW()),
('ADM003', 3, 'Finance Admin', 'admin3@gmail.com', '+91 98765 00003', 'Finance Officer', NOW())
ON DUPLICATE KEY UPDATE
    admin_name = VALUES(admin_name),
    email = VALUES(email);

-- -----------------------------------------------------------------------------
-- 3. COACHES TABLE
-- -----------------------------------------------------------------------------
INSERT INTO coaches (coach_id, user_id, coach_name, email, phone, qualification, experience, specialization, joining_date, status, created_at)
VALUES
('COA001', 5, 'Coach Ramesh', 'coach@gmail.com', '9123456789', 'SAI Level 2', '10 Years', 'Recurve Archery', '2023-01-15', 'active', NOW())
ON DUPLICATE KEY UPDATE
    coach_name = VALUES(coach_name),
    email = VALUES(email);

-- -----------------------------------------------------------------------------
-- 4. STUDENTS TABLE
-- -----------------------------------------------------------------------------
INSERT INTO students (student_id, user_id, first_name, last_name, date_of_birth, gender, phone, email, address, joining_date, emergency_contact, bow_type, bow_category, experience, age_category, status, created_at)
VALUES
('STU001', 4, 'Arjun', 'Kumar', '2004-05-15', 'Male', '9876543210', 'student@gmail.com', '12 Lake View Road, Bangalore', '2024-01-10', 'Mr. Kumar (+91 98765 43211)', 'Olympic Recurve', 'Recurve Bow', 'Intermediate (2-4 years)', 'Senior (21+ Years)', 'active', NOW())
ON DUPLICATE KEY UPDATE
    first_name = VALUES(first_name),
    email = VALUES(email);

-- -----------------------------------------------------------------------------
-- 5. TOURNAMENTS
-- -----------------------------------------------------------------------------
INSERT IGNORE INTO tournaments (tournament_id, tournament_name, tournament_date, location, category, distance, organizer, registration_deadline, description, status)
VALUES
(1, 'National Archery Championship 2026', '2026-11-15', 'Bangalore Sports Complex', 'Recurve', '70m', 'Archery Association of India', '2026-10-31', 'National level selection tournament for senior category.', 'upcoming'),
(2, 'State Level Archery Meet', '2026-12-05', 'Kanteerava Stadium', 'Compound & Recurve', '50m', 'State Archery Club', '2026-11-20', 'Annual state ranking tournament for all age groups.', 'upcoming');

-- -----------------------------------------------------------------------------
-- 6. TRAINING SCHEDULES
-- -----------------------------------------------------------------------------
INSERT IGNORE INTO training_schedules (schedule_id, coach_id, student_id, training_date, start_time, end_time, training_type, location, description, status)
VALUES
(1, 'COA001', 'STU001', '2026-10-02', '06:30:00', '08:30:00', 'Form & Release Drills', 'Target Range A', 'High speed video analysis of release and follow-through.', 'scheduled'),
(2, 'COA001', 'STU001', '2026-10-04', '16:00:00', '18:00:00', 'Distance Scoring (70m)', 'Target Range B', '12 ends of 6 arrows scoring practice under simulated wind.', 'scheduled');

-- -----------------------------------------------------------------------------
-- 7. BOW MAINTENANCE
-- -----------------------------------------------------------------------------
INSERT IGNORE INTO bow_maintenance (maintenance_id, student_id, coach_id, equipment_name, equipment_number, maintenance_date, `condition`, maintenance_details, next_maintenance_date, status, remarks)
VALUES
(1, 'STU001', 'COA001', 'Hoyt Formula Xi Recurve', 'BOW-REC-001', '2026-09-15', 'good', 'String waxing and nock point height calibration done.', '2026-10-15', 'done', 'Limbs inspected, no micro-fractures detected.');

-- -----------------------------------------------------------------------------
-- 8. PERFORMANCE
-- -----------------------------------------------------------------------------
INSERT IGNORE INTO performance (performance_id, student_id, coach_id, tournament_id, score, total_arrows, accuracy, distance, category, performance_date, remarks)
VALUES
(1, 'STU001', 'COA001', NULL, 312.00, 36, 86.67, '70m', 'Recurve Bow', '2026-09-28', 'Solid grouping in outer gold and inner red. Consistent anchor.');

-- -----------------------------------------------------------------------------
-- 9. ATTENDANCE
-- -----------------------------------------------------------------------------
INSERT IGNORE INTO attendance (attendance_id, student_id, coach_id, attendance_date, status, remarks)
VALUES
(1, 'STU001', 'COA001', '2026-09-28', 'present', 'On time, completed full warm-up.');

-- -----------------------------------------------------------------------------
-- 10. FEES
-- -----------------------------------------------------------------------------
INSERT IGNORE INTO fees (fee_id, student_id, amount, fee_type, payment_date, payment_method, payment_status, due_date, transaction_reference, remarks)
VALUES
(1, 'STU001', 3500.00, 'Monthly Coaching Fee', '2026-09-05', 'UPI / Online', 'paid', '2026-09-10', 'UPI-20260905-99881', 'September 2026 coaching fee');
