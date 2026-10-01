"""
Archery Academy Management System — MySQL Database Module
Database: archery_academy  (new full schema)

All credentials are loaded from .env — no hardcoded values.
Provides:
  - User registration (student/coach/admin) with werkzeug password hashing
  - Role-based authentication
  - Student CRUD (performance, attendance, bow maintenance, fees)
  - Coach update operations with notifications + activity logs
  - Admin queries (all students, coach reports, notifications)
  - Notification creation and retrieval
  - Activity log writes
"""

import mysql.connector
from mysql.connector import Error as MySQLError
from werkzeug.security import generate_password_hash, check_password_hash
import json
import os
import re
from datetime import datetime, date
from dotenv import load_dotenv

# ── Load .env ─────────────────────────────────────────────────────────────────
_ENV_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
load_dotenv(_ENV_PATH)

def _require_env(key: str) -> str:
    val = os.getenv(key)
    if not val:
        raise EnvironmentError(
            f"[DB] Missing required environment variable '{key}'. "
            f"Set it in your .env file."
        )
    return val


# DB_NAME read from .env — no hardcoded values
DB_NAME = _require_env("DB_NAME")


def _get_config_no_db() -> dict:
    """Config dict without database name (for CREATE DATABASE)."""
    return {
        "host":       _require_env("DB_HOST"),
        "port":       int(_require_env("DB_PORT")),
        "user":       _require_env("DB_USER"),
        "password":   _require_env("DB_PASSWORD"),
        "autocommit": True,
        "charset":    "utf8mb4",
        "collation":  "utf8mb4_unicode_ci",
    }


def _get_config() -> dict:
    cfg = _get_config_no_db()
    cfg["autocommit"] = False
    cfg["database"]   = DB_NAME
    return cfg


# ─────────────────────────────────────────────────────────────────────────────
# Connection
# ─────────────────────────────────────────────────────────────────────────────

def get_db_connection():
    return mysql.connector.connect(**_get_config())


def _fetchone_dict(cursor) -> dict | None:
    cols = [c[0] for c in cursor.description] if cursor.description else []
    row  = cursor.fetchone()
    return dict(zip(cols, row)) if row else None


def _fetchall_dict(cursor) -> list:
    cols = [c[0] for c in cursor.description] if cursor.description else []
    return [dict(zip(cols, r)) for r in cursor.fetchall()]


def _serialize_row(row: dict) -> dict:
    """Convert date/datetime objects to ISO strings for JSON serialization."""
    out = {}
    for k, v in row.items():
        if isinstance(v, (datetime, date)):
            out[k] = v.isoformat()
        elif isinstance(v, bytes):
            out[k] = v.decode("utf-8", errors="replace")
        else:
            out[k] = v
    return out


# ─────────────────────────────────────────────────────────────────────────────
# DB Initialisation — creates DB + all tables + seeds admin accounts from .env
# ─────────────────────────────────────────────────────────────────────────────

def init_db():
    # 1. Ensure the database itself exists
    conn0 = mysql.connector.connect(**_get_config_no_db())
    cur0  = conn0.cursor()
    cur0.execute(
        f"CREATE DATABASE IF NOT EXISTS `{DB_NAME}` "
        "CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
    )
    cur0.close()
    conn0.close()

    # 2. Read and execute schema.sql
    schema_path = os.path.join(os.path.dirname(__file__), "database", "schema.sql")
    with open(schema_path, "r", encoding="utf-8") as f:
        sql_text = f.read()

    conn = get_db_connection()
    cur  = conn.cursor()

    # Execute each statement (skip USE/CREATE DATABASE — already done)
    statements = [s.strip() for s in sql_text.split(";") if s.strip()]
    for stmt in statements:
        low = stmt.lower()
        if low.startswith("create database") or low.startswith("use "):
            continue
        try:
            cur.execute(stmt)
        except MySQLError as e:
            if e.errno == 1050:   # table already exists — fine
                pass
            else:
                raise
    conn.commit()

    # 3. Seed admin accounts from .env (INSERT IGNORE — safe to re-run)
    _seed_admins(conn, cur)

    cur.close()
    conn.close()
    host = os.getenv("DB_HOST")
    port = os.getenv("DB_PORT")
    print(f"[DB] archery_academy initialised on {host}:{port}. All tables ready.")


def _seed_admins(conn, cur):
    """Seed admin users from .env into users + admins tables (idempotent)."""
    for i in range(1, 4):
        name     = os.getenv(f"ADMIN{i}_NAME")
        username = os.getenv(f"ADMIN{i}_USERNAME")
        email    = os.getenv(f"ADMIN{i}_EMAIL")
        password = os.getenv(f"ADMIN{i}_PASSWORD")
        title    = os.getenv(f"ADMIN{i}_TITLE", "Administrator")
        if not (name and username and email and password):
            continue

        # Check if user already exists
        cur.execute("SELECT id FROM users WHERE email = %s OR username = %s", (email, username))
        existing = cur.fetchone()
        if existing:
            user_id = existing[0]
        else:
            pw_hash = generate_password_hash(password)
            cur.execute("""
                INSERT INTO users (username, password_hash, role, name, email)
                VALUES (%s, %s, 'admin', %s, %s)
            """, (username, pw_hash, name, email))
            conn.commit()
            user_id = cur.lastrowid

        admin_id = f"ADM{str(i).zfill(3)}"
        cur.execute("SELECT admin_id FROM admins WHERE admin_id = %s", (admin_id,))
        if not cur.fetchone():
            cur.execute("""
                INSERT INTO admins (admin_id, user_id, admin_name, email, title)
                VALUES (%s, %s, %s, %s, %s)
            """, (admin_id, user_id, name, email, title))
            conn.commit()


# ─────────────────────────────────────────────────────────────────────────────
# ID Generators
# ─────────────────────────────────────────────────────────────────────────────

def _next_id(conn, cur, table: str, id_col: str, prefix: str) -> str:
    cur.execute(f"SELECT {id_col} FROM {table} WHERE {id_col} LIKE %s", (f"{prefix}%",))
    rows  = cur.fetchall()
    maxn  = 0
    for r in rows:
        m = re.search(r'(\d+)$', r[0])
        if m:
            maxn = max(maxn, int(m.group(1)))
    return f"{prefix}{str(maxn + 1).zfill(3)}"


# ─────────────────────────────────────────────────────────────────────────────
# AUTHENTICATION
# ─────────────────────────────────────────────────────────────────────────────

def authenticate_user(identifier: str, password: str) -> dict:
    """
    Single unified login for student / coach / admin.
    Returns: {success, user_id, role, name, email, profile_id, ...}
    """
    conn = get_db_connection()
    cur  = conn.cursor()
    val  = (identifier or "").strip().lower()

    cur.execute("""
        SELECT id, username, password_hash, role, name, email, status
        FROM users
        WHERE LOWER(email) = %s OR LOWER(username) = %s
    """, (val, val))
    row = _fetchone_dict(cur)

    if not row:
        cur.close(); conn.close()
        return {"success": False, "message": "No account found with these credentials."}

    if row["status"] != "active":
        cur.close(); conn.close()
        return {"success": False, "message": "This account is inactive. Contact the admin."}

    if not check_password_hash(row["password_hash"], password):
        cur.close(); conn.close()
        return {"success": False, "message": "Incorrect password."}

    user_id = row["id"]
    role    = row["role"]
    result  = {
        "success": True,
        "user_id": user_id,
        "role":    role,
        "name":    row["name"],
        "email":   row["email"],
    }

    # Fetch role-specific profile
    if role == "student":
        cur.execute("SELECT * FROM students WHERE user_id = %s", (user_id,))
        profile = _fetchone_dict(cur)
        if profile:
            result["student_id"]  = profile["student_id"]
            result["profile"]     = _serialize_row(profile)
    elif role == "coach":
        cur.execute("SELECT * FROM coaches WHERE user_id = %s", (user_id,))
        profile = _fetchone_dict(cur)
        if profile:
            result["coach_id"] = profile["coach_id"]
            result["profile"]  = _serialize_row(profile)
    elif role == "admin":
        cur.execute("SELECT * FROM admins WHERE user_id = %s", (user_id,))
        profile = _fetchone_dict(cur)
        if profile:
            result["admin_id"] = profile["admin_id"]
            result["profile"]  = _serialize_row(profile)

    cur.close(); conn.close()
    return result


# ─────────────────────────────────────────────────────────────────────────────
# STUDENT REGISTRATION
# ─────────────────────────────────────────────────────────────────────────────

def register_student(data: dict) -> dict:
    conn = get_db_connection()
    cur  = conn.cursor()

    username  = (data.get("username") or "").strip().lower()
    email     = (data.get("email") or "").strip().lower()
    password  = (data.get("password") or "")
    name      = (data.get("name") or data.get("first_name") or "").strip()

    if not all([username, email, password, name]):
        cur.close(); conn.close()
        return {"success": False, "message": "Missing required fields."}

    cur.execute("SELECT id FROM users WHERE LOWER(email)=%s OR LOWER(username)=%s", (email, username))
    if cur.fetchone():
        cur.close(); conn.close()
        return {"success": False, "message": "Email or username already exists."}

    pw_hash    = generate_password_hash(password)
    first_name = data.get("firstName") or data.get("first_name") or name.split()[0]
    last_name  = data.get("lastName") or data.get("last_name") or (
        " ".join(name.split()[1:]) if len(name.split()) > 1 else ""
    )
    full_name = f"{first_name} {last_name}".strip()

    try:
        cur.execute("""
            INSERT INTO users (username, password_hash, role, name, email, phone)
            VALUES (%s, %s, 'student', %s, %s, %s)
        """, (username, pw_hash, full_name, email, data.get("phone", "")))
        conn.commit()
        user_id    = cur.lastrowid
        student_id = _next_id(conn, cur, "students", "student_id", "STU")

        cur.execute("""
            INSERT INTO students
                (student_id, user_id, first_name, last_name, gender, phone, email,
                 address, joining_date, bow_type, bow_category, experience, age_category, status)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 'active')
        """, (
            student_id, user_id, first_name, last_name,
            data.get("gender", ""),
            data.get("phone", ""),
            email,
            data.get("address", ""),
            datetime.now().date(),
            data.get("bowType", "Recurve"),
            data.get("bowCategory", "Recurve Bow"),
            data.get("experience", "Beginner"),
            data.get("ageCategory", ""),
        ))
        conn.commit()
        cur.close(); conn.close()
        return {"success": True, "student_id": student_id, "message": "Registration successful. Please login."}
    except MySQLError as e:
        conn.rollback()
        cur.close(); conn.close()
        return {"success": False, "message": str(e)}


# ─────────────────────────────────────────────────────────────────────────────
# COACH REGISTRATION
# ─────────────────────────────────────────────────────────────────────────────

def register_coach(data: dict) -> dict:
    conn = get_db_connection()
    cur  = conn.cursor()

    username = (data.get("username") or "").strip().lower()
    email    = (data.get("email") or "").strip().lower()
    password = (data.get("password") or "")
    name     = (data.get("name") or data.get("coach_name") or "").strip()

    if not all([username, email, password, name]):
        cur.close(); conn.close()
        return {"success": False, "message": "Missing required fields."}

    cur.execute("SELECT id FROM users WHERE LOWER(email)=%s OR LOWER(username)=%s", (email, username))
    if cur.fetchone():
        cur.close(); conn.close()
        return {"success": False, "message": "Email or username already exists."}

    pw_hash = generate_password_hash(password)
    try:
        cur.execute("""
            INSERT INTO users (username, password_hash, role, name, email, phone)
            VALUES (%s, %s, 'coach', %s, %s, %s)
        """, (username, pw_hash, name, email, data.get("phone", "")))
        conn.commit()
        user_id  = cur.lastrowid
        coach_id = _next_id(conn, cur, "coaches", "coach_id", "COA")

        cur.execute("""
            INSERT INTO coaches
                (coach_id, user_id, coach_name, email, phone,
                 qualification, experience, specialization, joining_date)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            coach_id, user_id, name, email,
            data.get("phone", ""),
            data.get("qualification", ""),
            data.get("experience", ""),
            data.get("specialization", "Recurve & Compound"),
            datetime.now().date(),
        ))
        conn.commit()
        cur.close(); conn.close()
        return {"success": True, "coach_id": coach_id, "message": "Coach registered successfully."}
    except MySQLError as e:
        conn.rollback()
        cur.close(); conn.close()
        return {"success": False, "message": str(e)}


# ─────────────────────────────────────────────────────────────────────────────
# STUDENT QUERIES
# ─────────────────────────────────────────────────────────────────────────────

def get_student_full(student_id: str) -> dict | None:
    """Returns full student profile including linked user info."""
    conn = get_db_connection()
    cur  = conn.cursor()
    cur.execute("""
        SELECT s.*, u.username, u.name, u.email AS user_email, u.status AS user_status
        FROM students s
        JOIN users u ON s.user_id = u.id
        WHERE s.student_id = %s
    """, (student_id,))
    row = _fetchone_dict(cur)
    cur.close(); conn.close()
    return _serialize_row(row) if row else None


def get_all_students() -> list:
    conn = get_db_connection()
    cur  = conn.cursor()
    cur.execute("""
        SELECT s.student_id, s.first_name, s.last_name, s.email, s.gender,
               s.bow_type, s.bow_category, s.experience, s.age_category,
               s.status, s.joining_date, u.username
        FROM students s
        JOIN users u ON s.user_id = u.id
        ORDER BY s.student_id ASC
    """)
    rows = _fetchall_dict(cur)
    cur.close(); conn.close()
    return [_serialize_row(r) for r in rows]


# ─────────────────────────────────────────────────────────────────────────────
# PERFORMANCE
# ─────────────────────────────────────────────────────────────────────────────

def get_student_performance(student_id: str) -> list:
    conn = get_db_connection()
    cur  = conn.cursor()
    cur.execute("""
        SELECT p.*, c.coach_name, t.tournament_name
        FROM performance p
        LEFT JOIN coaches c ON p.coach_id = c.coach_id
        LEFT JOIN tournaments t ON p.tournament_id = t.tournament_id
        WHERE p.student_id = %s
        ORDER BY p.performance_date DESC
    """, (student_id,))
    rows = _fetchall_dict(cur)
    cur.close(); conn.close()
    return [_serialize_row(r) for r in rows]


def coach_update_performance(data: dict, coach_user_id: int) -> dict:
    """Coach inserts or updates a performance record. Creates audit + notifications."""
    conn = get_db_connection()
    cur  = conn.cursor()

    student_id       = data.get("student_id", "").strip()
    coach_id         = data.get("coach_id", "").strip()
    score            = data.get("score")
    total_arrows     = data.get("total_arrows")
    accuracy         = data.get("accuracy")
    distance         = data.get("distance", "")
    category         = data.get("category", "")
    performance_date = data.get("performance_date") or datetime.now().date().isoformat()
    remarks          = data.get("remarks", "")
    tournament_id    = data.get("tournament_id") or None
    perf_id          = data.get("performance_id")

    try:
        if perf_id:
            cur.execute("""
                UPDATE performance
                SET score=%s, total_arrows=%s, accuracy=%s, distance=%s,
                    category=%s, performance_date=%s, remarks=%s, tournament_id=%s
                WHERE performance_id=%s AND student_id=%s
            """, (score, total_arrows, accuracy, distance, category,
                  performance_date, remarks, tournament_id, perf_id, student_id))
            action_label = "updated"
        else:
            cur.execute("""
                INSERT INTO performance
                    (student_id, coach_id, score, total_arrows, accuracy,
                     distance, category, performance_date, remarks, tournament_id)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (student_id, coach_id, score, total_arrows, accuracy,
                  distance, category, performance_date, remarks, tournament_id))
            perf_id      = cur.lastrowid
            action_label = "added"

        conn.commit()

        # Fetch student name + user_id for notifications
        cur.execute("SELECT first_name, last_name, user_id FROM students WHERE student_id=%s", (student_id,))
        stu = cur.fetchone()
        stu_name    = f"{stu[0]} {stu[1]}".strip() if stu else student_id
        stu_user_id = stu[2] if stu else None

        # Fetch coach name
        cur.execute("SELECT coach_name FROM coaches WHERE coach_id=%s", (coach_id,))
        coach_row  = cur.fetchone()
        coach_name = coach_row[0] if coach_row else coach_id

        # Activity log
        _write_log(cur, coach_user_id, "coach", f"performance_{action_label}",
                   "performance", str(perf_id),
                   f"Coach {coach_name} {action_label} performance for {stu_name} ({student_id})")
        conn.commit()

        # Student notification
        if stu_user_id:
            _create_notification(cur, stu_user_id, student_id, coach_id,
                                 "performance_updated",
                                 "Performance Record Updated",
                                 f"Your performance record has been {action_label} by Coach {coach_name}.",
                                 str(perf_id))
            conn.commit()

        # Admin notification(s)
        _notify_all_admins(cur, conn, student_id, stu_name, coach_id, coach_name,
                           "performance_updated",
                           f"Coach {coach_name} {action_label} performance record for {stu_name} ({student_id}).",
                           str(perf_id))
        conn.commit()

        cur.close(); conn.close()
        return {"success": True, "message": f"Performance record {action_label} successfully.", "performance_id": perf_id}

    except MySQLError as e:
        conn.rollback()
        cur.close(); conn.close()
        return {"success": False, "message": str(e)}


# ─────────────────────────────────────────────────────────────────────────────
# ATTENDANCE
# ─────────────────────────────────────────────────────────────────────────────

def get_student_attendance(student_id: str) -> list:
    conn = get_db_connection()
    cur  = conn.cursor()
    cur.execute("""
        SELECT a.*, c.coach_name
        FROM attendance a
        LEFT JOIN coaches c ON a.coach_id = c.coach_id
        WHERE a.student_id = %s
        ORDER BY a.attendance_date DESC
    """, (student_id,))
    rows = _fetchall_dict(cur)
    cur.close(); conn.close()
    return [_serialize_row(r) for r in rows]


def coach_update_attendance(data: dict, coach_user_id: int) -> dict:
    conn = get_db_connection()
    cur  = conn.cursor()

    student_id      = data.get("student_id", "").strip()
    coach_id        = data.get("coach_id", "").strip()
    attendance_date = data.get("attendance_date") or datetime.now().date().isoformat()
    status          = data.get("status", "present")
    remarks         = data.get("remarks", "")
    att_id          = data.get("attendance_id")

    try:
        if att_id:
            cur.execute("""
                UPDATE attendance
                SET attendance_date=%s, status=%s, remarks=%s
                WHERE attendance_id=%s AND student_id=%s
            """, (attendance_date, status, remarks, att_id, student_id))
            action_label = "updated"
        else:
            cur.execute("""
                INSERT INTO attendance (student_id, coach_id, attendance_date, status, remarks)
                VALUES (%s, %s, %s, %s, %s)
            """, (student_id, coach_id, attendance_date, status, remarks))
            att_id       = cur.lastrowid
            action_label = "recorded"

        conn.commit()

        cur.execute("SELECT first_name, last_name, user_id FROM students WHERE student_id=%s", (student_id,))
        stu = cur.fetchone()
        stu_name    = f"{stu[0]} {stu[1]}".strip() if stu else student_id
        stu_user_id = stu[2] if stu else None

        cur.execute("SELECT coach_name FROM coaches WHERE coach_id=%s", (coach_id,))
        cname = cur.fetchone()
        coach_name = cname[0] if cname else coach_id

        _write_log(cur, coach_user_id, "coach", f"attendance_{action_label}",
                   "attendance", str(att_id),
                   f"Coach {coach_name} {action_label} attendance for {stu_name} ({student_id})")
        conn.commit()

        if stu_user_id:
            _create_notification(cur, stu_user_id, student_id, coach_id,
                                 "attendance_updated",
                                 "Attendance Record Updated",
                                 f"Your attendance has been {action_label} by Coach {coach_name}.",
                                 str(att_id))
            conn.commit()

        _notify_all_admins(cur, conn, student_id, stu_name, coach_id, coach_name,
                           "attendance_updated",
                           f"Coach {coach_name} {action_label} attendance for {stu_name} ({student_id}).",
                           str(att_id))
        conn.commit()

        cur.close(); conn.close()
        return {"success": True, "message": f"Attendance {action_label} successfully.", "attendance_id": att_id}

    except MySQLError as e:
        conn.rollback()
        cur.close(); conn.close()
        return {"success": False, "message": str(e)}


# ─────────────────────────────────────────────────────────────────────────────
# BOW MAINTENANCE
# ─────────────────────────────────────────────────────────────────────────────

def get_student_bow_maintenance(student_id: str) -> list:
    conn = get_db_connection()
    cur  = conn.cursor()
    cur.execute("""
        SELECT bm.*, c.coach_name
        FROM bow_maintenance bm
        LEFT JOIN coaches c ON bm.coach_id = c.coach_id
        WHERE bm.student_id = %s
        ORDER BY bm.maintenance_date DESC
    """, (student_id,))
    rows = _fetchall_dict(cur)
    cur.close(); conn.close()
    return [_serialize_row(r) for r in rows]


def coach_update_bow_maintenance(data: dict, coach_user_id: int) -> dict:
    conn = get_db_connection()
    cur  = conn.cursor()

    student_id            = data.get("student_id", "").strip()
    coach_id              = data.get("coach_id", "").strip()
    equipment_name        = data.get("equipment_name", "")
    equipment_number      = data.get("equipment_number", "")
    maintenance_date      = data.get("maintenance_date") or datetime.now().date().isoformat()
    condition             = data.get("condition", "good")
    maintenance_details   = data.get("maintenance_details", "")
    next_maintenance_date = data.get("next_maintenance_date")
    status                = data.get("status", "pending")
    remarks               = data.get("remarks", "")
    maint_id              = data.get("maintenance_id")

    try:
        if maint_id:
            cur.execute("""
                UPDATE bow_maintenance
                SET equipment_name=%s, equipment_number=%s, maintenance_date=%s,
                    `condition`=%s, maintenance_details=%s, next_maintenance_date=%s,
                    status=%s, remarks=%s
                WHERE maintenance_id=%s AND student_id=%s
            """, (equipment_name, equipment_number, maintenance_date, condition,
                  maintenance_details, next_maintenance_date, status, remarks,
                  maint_id, student_id))
            action_label = "updated"
        else:
            cur.execute("""
                INSERT INTO bow_maintenance
                    (student_id, coach_id, equipment_name, equipment_number,
                     maintenance_date, `condition`, maintenance_details,
                     next_maintenance_date, status, remarks)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (student_id, coach_id, equipment_name, equipment_number,
                  maintenance_date, condition, maintenance_details,
                  next_maintenance_date, status, remarks))
            maint_id     = cur.lastrowid
            action_label = "recorded"

        conn.commit()

        cur.execute("SELECT first_name, last_name, user_id FROM students WHERE student_id=%s", (student_id,))
        stu = cur.fetchone()
        stu_name    = f"{stu[0]} {stu[1]}".strip() if stu else student_id
        stu_user_id = stu[2] if stu else None

        cur.execute("SELECT coach_name FROM coaches WHERE coach_id=%s", (coach_id,))
        cname = cur.fetchone()
        coach_name = cname[0] if cname else coach_id

        _write_log(cur, coach_user_id, "coach", f"bow_maintenance_{action_label}",
                   "bow_maintenance", str(maint_id),
                   f"Coach {coach_name} {action_label} bow maintenance for {stu_name} ({student_id})")
        conn.commit()

        if stu_user_id:
            _create_notification(cur, stu_user_id, student_id, coach_id,
                                 "maintenance_updated",
                                 "Bow Maintenance Updated",
                                 f"Your bow maintenance information has been {action_label} by Coach {coach_name}.",
                                 str(maint_id))
            conn.commit()

        _notify_all_admins(cur, conn, student_id, stu_name, coach_id, coach_name,
                           "maintenance_updated",
                           f"Coach {coach_name} {action_label} bow maintenance for {stu_name} ({student_id}).",
                           str(maint_id))
        conn.commit()

        cur.close(); conn.close()
        return {"success": True, "message": f"Bow maintenance {action_label} successfully.", "maintenance_id": maint_id}

    except MySQLError as e:
        conn.rollback()
        cur.close(); conn.close()
        return {"success": False, "message": str(e)}


# ─────────────────────────────────────────────────────────────────────────────
# FEES
# ─────────────────────────────────────────────────────────────────────────────

def get_student_fees(student_id: str) -> list:
    conn = get_db_connection()
    cur  = conn.cursor()
    cur.execute("""
        SELECT * FROM fees WHERE student_id = %s ORDER BY created_at DESC
    """, (student_id,))
    rows = _fetchall_dict(cur)
    cur.close(); conn.close()
    return [_serialize_row(r) for r in rows]


def admin_add_fee(data: dict, admin_user_id: int) -> dict:
    conn = get_db_connection()
    cur  = conn.cursor()
    try:
        cur.execute("""
            INSERT INTO fees
                (student_id, amount, fee_type, payment_status, due_date, remarks)
            VALUES (%s, %s, %s, 'pending', %s, %s)
        """, (data.get("student_id"), data.get("amount"),
              data.get("fee_type"), data.get("due_date"), data.get("remarks", "")))
        conn.commit()
        fee_id = cur.lastrowid
        _write_log(cur, admin_user_id, "admin", "fee_added", "fees", str(fee_id),
                   f"Admin added fee for student {data.get('student_id')}")
        conn.commit()
        cur.close(); conn.close()
        return {"success": True, "fee_id": fee_id, "message": "Fee added."}
    except MySQLError as e:
        conn.rollback(); cur.close(); conn.close()
        return {"success": False, "message": str(e)}


def admin_update_fee_payment(fee_id: int, data: dict, admin_user_id: int) -> dict:
    conn = get_db_connection()
    cur  = conn.cursor()
    try:
        cur.execute("""
            UPDATE fees
            SET payment_date=%s, payment_method=%s, payment_status='paid',
                transaction_reference=%s
            WHERE fee_id=%s
        """, (data.get("payment_date") or datetime.now().date().isoformat(),
              data.get("payment_method", "Cash"),
              data.get("transaction_reference", ""),
              fee_id))
        conn.commit()
        _write_log(cur, admin_user_id, "admin", "fee_paid", "fees", str(fee_id),
                   f"Admin recorded fee payment for fee_id {fee_id}")
        conn.commit()
        cur.close(); conn.close()
        return {"success": True, "message": "Payment recorded."}
    except MySQLError as e:
        conn.rollback(); cur.close(); conn.close()
        return {"success": False, "message": str(e)}


def admin_get_all_fees(status_filter: str = None) -> list:
    """All fee records with student names — for admin fee management dashboard."""
    conn = get_db_connection()
    cur  = conn.cursor()
    if status_filter:
        cur.execute("""
            SELECT f.*, s.first_name, s.last_name
            FROM fees f
            LEFT JOIN students s ON f.student_id = s.student_id
            WHERE f.payment_status = %s
            ORDER BY f.created_at DESC
        """, (status_filter,))
    else:
        cur.execute("""
            SELECT f.*, s.first_name, s.last_name
            FROM fees f
            LEFT JOIN students s ON f.student_id = s.student_id
            ORDER BY f.created_at DESC
        """)
    rows = _fetchall_dict(cur)
    cur.close(); conn.close()
    return [_serialize_row(r) for r in rows]


# ─────────────────────────────────────────────────────────────────────────────
# COACH REPORTS
# ─────────────────────────────────────────────────────────────────────────────

def coach_send_report(data: dict, coach_user_id: int) -> dict:
    conn = get_db_connection()
    cur  = conn.cursor()
    try:
        cur.execute("""
            INSERT INTO coach_reports
                (coach_id, student_id, report_title, report_message,
                 performance_summary, attendance_summary, bow_maintenance_summary, status)
            VALUES (%s, %s, %s, %s, %s, %s, %s, 'sent')
        """, (
            data.get("coach_id"), data.get("student_id"),
            data.get("report_title", "Coach Report"),
            data.get("report_message", ""),
            data.get("performance_summary", ""),
            data.get("attendance_summary", ""),
            data.get("bow_maintenance_summary", ""),
        ))
        conn.commit()
        report_id = cur.lastrowid

        _write_log(cur, coach_user_id, "coach", "report_sent", "coach_reports", str(report_id),
                   f"Coach sent report for student {data.get('student_id')}")
        conn.commit()

        # Notify all admins
        student_id = data.get("student_id", "")
        cur.execute("SELECT first_name, last_name FROM students WHERE student_id=%s", (student_id,))
        sr = cur.fetchone()
        stu_name = f"{sr[0]} {sr[1]}".strip() if sr else student_id

        cur.execute("SELECT coach_name FROM coaches WHERE coach_id=%s", (data.get("coach_id"),))
        cr = cur.fetchone()
        coach_name = cr[0] if cr else data.get("coach_id", "")

        _notify_all_admins(cur, conn, student_id, stu_name, data.get("coach_id", ""), coach_name,
                           "coach_report",
                           f"New coach report from {coach_name} about {stu_name} ({student_id}).",
                           str(report_id))
        conn.commit()

        cur.close(); conn.close()
        return {"success": True, "report_id": report_id, "message": "Report sent to admin."}
    except MySQLError as e:
        conn.rollback(); cur.close(); conn.close()
        return {"success": False, "message": str(e)}


def get_all_coach_reports(student_id: str = None) -> list:
    conn = get_db_connection()
    cur  = conn.cursor()
    if student_id:
        cur.execute("""
            SELECT r.*, c.coach_name
            FROM coach_reports r
            LEFT JOIN coaches c ON r.coach_id = c.coach_id
            WHERE r.student_id = %s
            ORDER BY r.created_at DESC
        """, (student_id,))
    else:
        cur.execute("""
            SELECT r.*, c.coach_name
            FROM coach_reports r
            LEFT JOIN coaches c ON r.coach_id = c.coach_id
            ORDER BY r.created_at DESC
        """)
    rows = _fetchall_dict(cur)
    cur.close(); conn.close()
    return [_serialize_row(r) for r in rows]


# ─────────────────────────────────────────────────────────────────────────────
# NOTIFICATIONS
# ─────────────────────────────────────────────────────────────────────────────

def _create_notification(cur, user_id: int, student_id, coach_id,
                         notif_type: str, title: str, message: str, related_id: str = None):
    cur.execute("""
        INSERT INTO notifications
            (user_id, student_id, coach_id, notification_type, title, message, related_record_id)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
    """, (user_id, student_id or None, coach_id or None,
          notif_type, title, message, related_id))


def _notify_all_admins(cur, conn, student_id, stu_name, coach_id, coach_name,
                       notif_type: str, message: str, related_id: str = None):
    """Send a notification to every admin user in the DB."""
    cur.execute("SELECT u.id FROM users u WHERE u.role='admin'")
    admin_users = cur.fetchall()
    for (admin_uid,) in admin_users:
        _create_notification(cur, admin_uid, student_id, coach_id,
                             notif_type,
                             "Coach Update Notification",
                             message,
                             related_id)
    if admin_users:
        conn.commit()


def get_user_notifications(user_id: int, unread_only: bool = False) -> list:
    conn = get_db_connection()
    cur  = conn.cursor()
    if unread_only:
        cur.execute("""
            SELECT * FROM notifications WHERE user_id=%s AND is_read=0
            ORDER BY created_at DESC
        """, (user_id,))
    else:
        cur.execute("""
            SELECT * FROM notifications WHERE user_id=%s
            ORDER BY created_at DESC LIMIT 50
        """, (user_id,))
    rows = _fetchall_dict(cur)
    cur.close(); conn.close()
    return [_serialize_row(r) for r in rows]


def mark_notification_read(notification_id: int, user_id: int) -> dict:
    conn = get_db_connection()
    cur  = conn.cursor()
    cur.execute("""
        UPDATE notifications SET is_read=1
        WHERE notification_id=%s AND user_id=%s
    """, (notification_id, user_id))
    conn.commit()
    cur.close(); conn.close()
    return {"success": True}


def mark_all_notifications_read(user_id: int) -> dict:
    conn = get_db_connection()
    cur  = conn.cursor()
    cur.execute("UPDATE notifications SET is_read=1 WHERE user_id=%s", (user_id,))
    conn.commit()
    cur.close(); conn.close()
    return {"success": True}


# ─────────────────────────────────────────────────────────────────────────────
# ACTIVITY LOGS
# ─────────────────────────────────────────────────────────────────────────────

def _write_log(cur, user_id: int, role: str, action: str,
               table_name: str, record_id: str, description: str):
    cur.execute("""
        INSERT INTO activity_logs (user_id, role, action, table_name, record_id, description)
        VALUES (%s, %s, %s, %s, %s, %s)
    """, (user_id, role, action, table_name, record_id, description))


def get_activity_logs(limit: int = 50) -> list:
    conn = get_db_connection()
    cur  = conn.cursor()
    cur.execute("""
        SELECT l.*, u.name, u.role
        FROM activity_logs l
        JOIN users u ON l.user_id = u.id
        ORDER BY l.created_at DESC LIMIT %s
    """, (limit,))
    rows = _fetchall_dict(cur)
    cur.close(); conn.close()
    return [_serialize_row(r) for r in rows]


# ─────────────────────────────────────────────────────────────────────────────
# ADMIN QUERIES
# ─────────────────────────────────────────────────────────────────────────────

def get_all_coaches() -> list:
    conn = get_db_connection()
    cur  = conn.cursor()
    cur.execute("""
        SELECT c.*, u.username, u.status AS user_status
        FROM coaches c JOIN users u ON c.user_id = u.id
        ORDER BY c.coach_id ASC
    """)
    rows = _fetchall_dict(cur)
    cur.close(); conn.close()
    return [_serialize_row(r) for r in rows]


def admin_get_dashboard_stats() -> dict:
    conn = get_db_connection()
    cur  = conn.cursor()
    cur.execute("SELECT COUNT(*) FROM students WHERE status='active'")
    students_count = cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM coaches WHERE status='active'")
    coaches_count = cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM coach_reports")
    reports_count = cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM notifications WHERE is_read=0")
    unread_notifs = cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM fees WHERE payment_status='pending'")
    pending_fees = cur.fetchone()[0]
    cur.close(); conn.close()
    return {
        "students": students_count,
        "coaches":  coaches_count,
        "reports":  reports_count,
        "unread_notifications": unread_notifs,
        "pending_fees": pending_fees,
    }


def coach_get_dashboard_stats(coach_id: str) -> dict:
    conn = get_db_connection()
    cur  = conn.cursor()
    cur.execute("SELECT COUNT(DISTINCT student_id) FROM performance WHERE coach_id=%s", (coach_id,))
    students_coached = cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM attendance WHERE coach_id=%s", (coach_id,))
    attendance_records = cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM coach_reports WHERE coach_id=%s", (coach_id,))
    reports_sent = cur.fetchone()[0]
    cur.close(); conn.close()
    return {
        "students_coached":  students_coached,
        "attendance_records": attendance_records,
        "reports_sent":       reports_sent,
    }


# ─────────────────────────────────────────────────────────────────────────────
# TOURNAMENTS
# ─────────────────────────────────────────────────────────────────────────────

def get_all_tournaments() -> list:
    conn = get_db_connection()
    cur  = conn.cursor()
    cur.execute("SELECT * FROM tournaments ORDER BY tournament_date DESC")
    rows = _fetchall_dict(cur)
    cur.close(); conn.close()
    return [_serialize_row(r) for r in rows]
