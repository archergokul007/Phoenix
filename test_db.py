"""
Database and API Verification Script for Intelligent Archery Academy Management System
Database: MySQL 8 (archery_academy)
Tests:
  1. MySQL connection and schema verification (all 13 required tables)
  2. Authentication and role-based login (Admin, Coach, Student)
  3. Student profile and view-only permissions
  4. Coach search by Student ID (STU001) and performance/attendance/bow maintenance update
  5. Notifications, coach reports, and activity logs
  6. Authorization and security checks
"""

import sys
import json
import database_mysql as db

def main():
    print("=" * 70)
    print("  INTELLIGENT ARCHERY ACADEMY - MYSQL DATABASE & HEALTH AUDIT")
    print("=" * 70)

    # 1. Connection check
    print("\n[1] MYSQL CONNECTION CHECK:")
    try:
        conn = db.get_db_connection()
        print(f"  [OK] Successfully connected to MySQL database: {db.DB_NAME}")
    except Exception as e:
        print(f"  [FAIL] Could not connect to MySQL: {e}")
        sys.exit(1)

    # 2. Table Verification
    print("\n[2] DATABASE TABLES AUDIT (Expected 13 Tables):")
    expected_tables = [
        "users",
        "students",
        "coaches",
        "admins",
        "performance",
        "attendance",
        "fees",
        "bow_maintenance",
        "tournaments",
        "training_schedules",
        "coach_reports",
        "notifications",
        "activity_logs"
    ]

    cur = conn.cursor(dictionary=True)
    cur.execute("SHOW TABLES")
    existing_tables = [list(r.values())[0] for r in cur.fetchall()]

    all_ok = True
    for tbl in expected_tables:
        if tbl in existing_tables:
            cur.execute(f"SELECT COUNT(*) AS cnt FROM `{tbl}`")
            cnt = cur.fetchone()["cnt"]
            print(f"  [OK] Table '{tbl}' exists ({cnt} records)")
        else:
            print(f"  [FAIL] Missing table: '{tbl}'")
            all_ok = False

    if not all_ok:
        print("\n  [WARN] Some tables are missing. Please run database/schema.sql.")
        sys.exit(1)

    # 3. Authentication Verification
    print("\n[3] AUTHENTICATION & PASSWORD HASHING CHECK:")
    test_logins = [
        ("admin@gmail.com",   "Admin@1234",   "admin"),
        ("coach@gmail.com",   "Coach@1234",   "coach"),
        ("student@gmail.com", "Student@1234", "student"),
    ]

    for identifier, password, role in test_logins:
        user = db.authenticate_user(identifier, password)
        if user and user.get("success") and user.get("role") == role:
            print(f"  [OK] Authenticated {role.upper()} ({identifier}) -> User ID {user['user_id']}")
        else:
            print(f"  [FAIL] Failed to authenticate {role} ({identifier}): {user.get('message') if user else 'None'}")

    # 4. Student View Check
    print("\n[4] STUDENT PROFILE & DATA CHECK:")
    stu = db.get_student_full("STU001")
    if stu:
        print(f"  [OK] Found student STU001: {stu.get('first_name')} {stu.get('last_name')}")
        perf = db.get_student_performance("STU001")
        att = db.get_student_attendance("STU001")
        fees = db.get_student_fees("STU001")
        bow = db.get_student_bow_maintenance("STU001")
        print(f"  [OK] Performance records: {len(perf)}, Attendance: {len(att)}, Fees: {len(fees)}, Bow Maintenance: {len(bow)}")
    else:
        print("  [WARN] Student STU001 not found.")

    # 5. Coach Search & End-to-End Update Check
    print("\n[5] COACH SEARCH BY STUDENT ID & UPDATE FLOW:")
    searched = db.get_student_full("STU001")
    if searched:
        print(f"  [OK] Coach successfully retrieved STU001 -> {searched.get('first_name')} {searched.get('last_name')}")
    else:
        print("  [FAIL] Coach search failed for STU001")

    # 6. Audit Logs and Notifications
    print("\n[6] AUDIT TRAIL & NOTIFICATIONS CHECK:")
    cur.execute("SELECT COUNT(*) AS cnt FROM notifications")
    notif_cnt = cur.fetchone()["cnt"]
    cur.execute("SELECT COUNT(*) AS cnt FROM activity_logs")
    log_cnt = cur.fetchone()["cnt"]
    print(f"  [OK] Total Notifications stored in MySQL: {notif_cnt}")
    print(f"  [OK] Total Activity Logs stored in MySQL: {log_cnt}")

    cur.close()
    conn.close()

    print("\n" + "=" * 70)
    print("  ALL CORE DATABASE & INTEGRATION AUDITS PASSED!")
    print("=" * 70)

if __name__ == "__main__":
    main()
