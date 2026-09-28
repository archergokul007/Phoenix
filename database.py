"""
Database Management Module for Phoenix Elite Sports Academy
Uses SQLite3 for robust, zero-configuration local database persistence.
Manages all student operations: Registration, Authentication, Profile, Attendance,
Performance Scores, Equipment Requests, Fee Payments, and Training Slot Bookings.
"""

import sqlite3
import json
import os
import re
from datetime import datetime

DB_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'academy.db')

def get_db_connection():
    """Returns a SQLite connection with row factory enabled."""
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn

def init_db():
    """Initializes database tables if they do not already exist."""
    conn = get_db_connection()
    cursor = conn.cursor()

    # 1. Students Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS students (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        first_name TEXT,
        last_name TEXT,
        gender TEXT,
        age INTEGER,
        age_category TEXT,
        phone TEXT,
        current_status TEXT,
        bow_category TEXT,
        bow_type TEXT,
        experience TEXT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        course TEXT DEFAULT 'Academy Training',
        year_sem TEXT,
        place TEXT DEFAULT 'Academy Main',
        address TEXT DEFAULT 'Registered Campus Address',
        attendance_rate REAL DEFAULT 100,
        attendance_stats TEXT, -- JSON
        overall_score REAL DEFAULT 85,
        grade TEXT DEFAULT 'A',
        practice_avg TEXT DEFAULT '8.5 / 10',
        exam_score TEXT DEFAULT '300 / 360',
        rank INTEGER DEFAULT 1,
        progress_summary TEXT,
        skills TEXT, -- JSON
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # 2. Student Attendance Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS student_attendance (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id TEXT NOT NULL,
        date TEXT NOT NULL,
        status TEXT NOT NULL,
        remarks TEXT,
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
    );
    """)

    # 3. Student Scores & Evaluation Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS student_scores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id TEXT NOT NULL,
        date TEXT NOT NULL,
        score INTEGER NOT NULL,
        avg REAL NOT NULL,
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
    );
    """)

    # 4. Equipment Service Requests Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS equipment_requests (
        id TEXT PRIMARY KEY,
        student_id TEXT NOT NULL,
        student_name TEXT NOT NULL,
        request_type TEXT NOT NULL,
        equipment_name TEXT NOT NULL,
        description TEXT NOT NULL,
        date TEXT NOT NULL,
        status TEXT DEFAULT 'Pending',
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
    );
    """)

    # 5. Fees & Invoices Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS fees (
        id TEXT PRIMARY KEY,
        student_id TEXT NOT NULL,
        student_name TEXT NOT NULL,
        fee_type TEXT NOT NULL,
        amount REAL NOT NULL,
        due_date TEXT NOT NULL,
        paid_date TEXT,
        status TEXT DEFAULT 'Pending',
        payment_method TEXT,
        receipt_no TEXT,
        transaction_id TEXT,
        remarks TEXT,
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
    );
    """)

    # 6. Training Slot Bookings Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS training_slot_bookings (
        schedule_id TEXT NOT NULL,
        student_id TEXT NOT NULL,
        booked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (schedule_id, student_id),
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
    );
    """)

    conn.commit()
    conn.close()
    print("[DB] SQLite database initialized successfully at:", DB_FILE)

def student_row_to_dict(row, conn=None):
    """Converts a SQLite row into the complete student dictionary format expected by the frontend."""
    if not row:
        return None

    student_id = row['id']
    need_close = False
    if conn is None:
        conn = get_db_connection()
        need_close = True

    try:
        # Load attendance records
        cur = conn.cursor()
        cur.execute("SELECT date, status, remarks FROM student_attendance WHERE student_id = ? ORDER BY id DESC", (student_id,))
        attendance_records = [dict(r) for r in cur.fetchall()]

        # Load scores
        cur.execute("SELECT date, score, avg FROM student_scores WHERE student_id = ? ORDER BY id ASC", (student_id,))
        scores = [dict(r) for r in cur.fetchall()]

        # Parse JSON fields safely
        try:
            skills = json.loads(row['skills']) if row['skills'] else {}
        except Exception:
            skills = {}

        try:
            attendance_stats = json.loads(row['attendance_stats']) if row['attendance_stats'] else {"present": 5, "absent": 0, "late": 0}
        except Exception:
            attendance_stats = {"present": 5, "absent": 0, "late": 0}

        return {
            "id": row['id'],
            "username": row['username'],
            "name": row['name'],
            "firstName": row['first_name'] or "",
            "lastName": row['last_name'] or "",
            "gender": row['gender'] or "",
            "age": row['age'],
            "ageCategory": row['age_category'] or "",
            "phone": row['phone'] or "",
            "currentStatus": row['current_status'] or "Active",
            "bowCategory": row['bow_category'] or "Recurve Bow",
            "bowType": row['bow_type'] or "Recurve",
            "experience": row['experience'] or "Beginner",
            "email": row['email'],
            "password": row['password'],
            "course": row['course'] or "Academy Training",
            "yearSem": row['year_sem'] or row['age_category'] or "",
            "place": row['place'] or "Academy Main",
            "address": row['address'] or "Registered Campus Address",
            "attendanceRate": float(row['attendance_rate']) if row['attendance_rate'] is not None else 0.0,
            "attendanceStats": attendance_stats,
            "overallScore": float(row['overall_score']) if row['overall_score'] is not None else 0.0,
            "grade": row['grade'] or "-",
            "practiceAvg": row['practice_avg'] or "-",
            "examScore": row['exam_score'] or "-",
            "rank": row['rank'] if row['rank'] is not None else "-",
            "progressSummary": row['progress_summary'] or "Newly enrolled trainee. No sessions logged yet.",
            "skills": skills,
            "scoresByEvaluation": scores if scores else [],
            "attendanceRecords": attendance_records if attendance_records else []
        }
    finally:
        if need_close:
            conn.close()

def get_next_student_id(conn):
    """Calculates the next available Student ID (e.g. STU001, STU002)."""
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM students WHERE id LIKE 'STU%'")
    rows = cursor.fetchall()
    max_num = 0
    for r in rows:
        match = re.search(r'STU(\d+)', r['id'], re.IGNORECASE)
        if match:
            max_num = max(max_num, int(match.group(1)))
    return f"STU{str(max_num + 1).zfill(3)}"

def register_student(data):
    """
    Registers a new student into the SQLite database.
    Performs field validation and uniqueness checks.
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    email = (data.get('email') or '').strip().lower()
    username = (data.get('username') or '').strip().lower()
    name = (data.get('name') or '').strip()
    password = data.get('password') or ''

    if not email or not username or not name or not password:
        conn.close()
        return {"success": False, "message": "Missing required fields (email, username, name, password)."}

    # Uniqueness checks
    cursor.execute("SELECT id FROM students WHERE LOWER(email) = ? OR LOWER(username) = ?", (email, username))
    existing = cursor.fetchone()
    if existing:
        conn.close()
        return {"success": False, "message": "A student with this Email or User Name already exists."}

    # Generate Student ID
    student_id = data.get('id') or get_next_student_id(conn)
    cursor.execute("SELECT id FROM students WHERE id = ?", (student_id,))
    if cursor.fetchone():
        student_id = get_next_student_id(conn)

    # Name breakdown
    parts = name.split()
    first_name = data.get('firstName') or (parts[0] if parts else name)
    last_name = data.get('lastName') or (' '.join(parts[1:]) if len(parts) > 1 else '')

    age = int(data.get('age') or 18)
    age_category = data.get('ageCategory') or ''
    gender = data.get('gender') or ''
    phone = data.get('phone') or ''
    current_status = data.get('currentStatus') or 'Active'
    bow_category = data.get('bowCategory') or 'Recurve Bow'
    bow_type = data.get('bowType') or 'Recurve'
    experience = data.get('experience') or 'Beginner'
    course = data.get('course') or 'Academy Training'
    year_sem = data.get('yearSem') or age_category
    place = data.get('place') or 'Academy Main'
    address = data.get('address') or 'Registered Campus Address'

    default_skills = data.get('skills') or {}
    default_stats = data.get('attendanceStats') or {"present": 0, "absent": 0, "late": 0}
    progress_summary = data.get('progressSummary') or f"Newly registered archer ({bow_category}, {age_category}). Status: {current_status}. No training rounds logged yet."

    cursor.execute("""
    INSERT INTO students (
        id, username, name, first_name, last_name, gender, age, age_category,
        phone, current_status, bow_category, bow_type, experience, email, password,
        course, year_sem, place, address, attendance_rate, attendance_stats,
        overall_score, grade, practice_avg, exam_score, rank, progress_summary, skills
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        student_id, username, name, first_name, last_name, gender, age, age_category,
        phone, current_status, bow_category, bow_type, experience, email, password,
        course, year_sem, place, address,
        float(data.get('attendanceRate') or 0.0),
        json.dumps(default_stats),
        float(data.get('overallScore') or 0.0),
        data.get('grade') or "-",
        data.get('practiceAvg') or "-",
        data.get('examScore') or "-",
        data.get('rank') if data.get('rank') is not None else "-",
        progress_summary,
        json.dumps(default_skills)
    ))

    conn.commit()

    cursor.execute("SELECT * FROM students WHERE id = ?", (student_id,))
    new_row = cursor.fetchone()
    student_dict = student_row_to_dict(new_row, conn)
    conn.close()

    return {"success": True, "student": student_dict, "message": "Student registered successfully in database."}

def authenticate_student(identifier, password):
    """Authenticates a student by email, username, or student ID."""
    conn = get_db_connection()
    cursor = conn.cursor()

    val = (identifier or '').strip().lower()
    cursor.execute("""
    SELECT * FROM students 
    WHERE LOWER(email) = ? OR LOWER(username) = ? OR LOWER(id) = ?
    """, (val, val, val))
    row = cursor.fetchone()

    if not row:
        conn.close()
        return {"success": False, "message": "No student found with these credentials."}

    if row['password'] != password:
        conn.close()
        return {"success": False, "message": "Incorrect password. Please try again."}

    student_dict = student_row_to_dict(row, conn)
    conn.close()
    return {"success": True, "student": student_dict}

def get_all_students():
    """Returns all registered students from the SQLite database."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM students ORDER BY id ASC")
    rows = cursor.fetchall()
    result = [student_row_to_dict(r, conn) for r in rows]
    conn.close()
    return result

def get_student_by_id(student_id):
    """Fetches a specific student by Student ID."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM students WHERE id = ?", (student_id,))
    row = cursor.fetchone()
    student_dict = student_row_to_dict(row, conn) if row else None
    conn.close()
    return student_dict

def book_training_slot(student_id, schedule_id):
    """Records a practice slot booking for a student."""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
        INSERT OR IGNORE INTO training_slot_bookings (schedule_id, student_id)
        VALUES (?, ?)
        """, (schedule_id, student_id))
        conn.commit()
        return {"success": True, "message": f"Slot {schedule_id} booked successfully for {student_id}."}
    except Exception as e:
        return {"success": False, "message": str(e)}
    finally:
        conn.close()

def cancel_training_slot(student_id, schedule_id):
    """Cancels a practice slot booking for a student."""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
        DELETE FROM training_slot_bookings WHERE schedule_id = ? AND student_id = ?
        """, (schedule_id, student_id))
        conn.commit()
        return {"success": True, "message": f"Booking for slot {schedule_id} cancelled."}
    except Exception as e:
        return {"success": False, "message": str(e)}
    finally:
        conn.close()

def get_student_slot_bookings(student_id):
    """Returns list of schedule IDs booked by this student."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT schedule_id FROM training_slot_bookings WHERE student_id = ?", (student_id,))
    rows = cursor.fetchall()
    bookings = [r['schedule_id'] for r in rows]
    conn.close()
    return bookings

def get_all_slot_bookings():
    """Returns all slot bookings grouped by schedule_id."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT schedule_id, student_id FROM training_slot_bookings")
    rows = cursor.fetchall()
    grouped = {}
    for r in rows:
        sch_id = r['schedule_id']
        if sch_id not in grouped:
            grouped[sch_id] = []
        grouped[sch_id].append(r['student_id'])
    conn.close()
    return grouped

def submit_equipment_request(req_data):
    """Records an equipment maintenance or checkout request from a student."""
    conn = get_db_connection()
    cursor = conn.cursor()

    req_id = req_data.get('id') or f"REQ-{datetime.now().strftime('%f')[:4]}"
    student_id = req_data.get('studentId')
    student_name = req_data.get('studentName')
    req_type = req_data.get('requestType')
    equip_name = req_data.get('equipmentName')
    desc = req_data.get('description')
    date_str = req_data.get('date') or datetime.now().strftime("%Y-%m-%d")
    status = req_data.get('status') or 'Pending'

    try:
        cursor.execute("""
        INSERT INTO equipment_requests (id, student_id, student_name, request_type, equipment_name, description, date, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (req_id, student_id, student_name, req_type, equip_name, desc, date_str, status))
        conn.commit()
        return {"success": True, "request": {
            "id": req_id,
            "studentId": student_id,
            "studentName": student_name,
            "requestType": req_type,
            "equipmentName": equip_name,
            "description": desc,
            "date": date_str,
            "status": status
        }}
    except Exception as e:
        return {"success": False, "message": str(e)}
    finally:
        conn.close()

def get_student_equipment_requests(student_id=None):
    """Retrieves equipment requests for a student or all requests if student_id is None."""
    conn = get_db_connection()
    cursor = conn.cursor()
    if student_id:
        cursor.execute("SELECT * FROM equipment_requests WHERE student_id = ? ORDER BY id DESC", (student_id,))
    else:
        cursor.execute("SELECT * FROM equipment_requests ORDER BY id DESC")
    rows = cursor.fetchall()
    reqs = []
    for r in rows:
        reqs.append({
            "id": r['id'],
            "studentId": r['student_id'],
            "studentName": r['student_name'],
            "requestType": r['request_type'],
            "equipmentName": r['equipment_name'],
            "description": r['description'],
            "date": r['date'],
            "status": r['status']
        })
    conn.close()
    return reqs

def get_student_fees(student_id=None):
    """Retrieves fee invoices for a student or all fees if student_id is None."""
    conn = get_db_connection()
    cursor = conn.cursor()
    if student_id:
        cursor.execute("SELECT * FROM fees WHERE student_id = ? ORDER BY id DESC", (student_id,))
    else:
        cursor.execute("SELECT * FROM fees ORDER BY id DESC")
    rows = cursor.fetchall()
    fees_list = []
    for r in rows:
        fees_list.append({
            "id": r['id'],
            "studentId": r['student_id'],
            "studentName": r['student_name'],
            "feeType": r['fee_type'],
            "amount": r['amount'],
            "dueDate": r['due_date'],
            "paidDate": r['paid_date'],
            "status": r['status'],
            "paymentMethod": r['payment_method'],
            "receiptNo": r['receipt_no'],
            "transactionId": r['transaction_id'],
            "remarks": r['remarks']
        })
    conn.close()
    return fees_list

def pay_fee_invoice(invoice_id, payment_data):
    """Marks a fee invoice as Paid and records receipt and transaction details in SQLite."""
    conn = get_db_connection()
    cursor = conn.cursor()

    paid_date = payment_data.get('paidDate') or datetime.now().strftime("%Y-%m-%d")
    payment_method = payment_data.get('paymentMethod') or 'UPI'
    transaction_id = payment_data.get('transactionId') or f"TXN-{datetime.now().strftime('%f')[:8]}"
    receipt_no = payment_data.get('receiptNo') or f"REC-{datetime.now().strftime('%f')[:5]}"

    try:
        cursor.execute("""
        UPDATE fees 
        SET status = 'Paid', paid_date = ?, payment_method = ?, transaction_id = ?, receipt_no = ?
        WHERE id = ?
        """, (paid_date, payment_method, transaction_id, receipt_no, invoice_id))
        conn.commit()

        cursor.execute("SELECT * FROM fees WHERE id = ?", (invoice_id,))
        row = cursor.fetchone()
        if not row:
            return {"success": False, "message": "Invoice not found."}

        inv_dict = {
            "id": row['id'],
            "studentId": row['student_id'],
            "studentName": row['student_name'],
            "feeType": row['fee_type'],
            "amount": row['amount'],
            "dueDate": row['due_date'],
            "paidDate": row['paid_date'],
            "status": row['status'],
            "paymentMethod": row['payment_method'],
            "receiptNo": row['receipt_no'],
            "transactionId": row['transaction_id'],
            "remarks": row['remarks']
        }
        return {"success": True, "invoice": inv_dict, "message": f"Payment recorded. Receipt: {receipt_no}"}
    except Exception as e:
        return {"success": False, "message": str(e)}
    finally:
        conn.close()

def truncate_all_data():
    """
    Database Migration / Reset:
    Truncates all data across all tables to provide a completely clean slate.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("PRAGMA foreign_keys = OFF;")
        cursor.execute("DELETE FROM training_slot_bookings;")
        cursor.execute("DELETE FROM equipment_requests;")
        cursor.execute("DELETE FROM fees;")
        cursor.execute("DELETE FROM student_scores;")
        cursor.execute("DELETE FROM student_attendance;")
        cursor.execute("DELETE FROM students;")
        conn.commit()
        cursor.execute("PRAGMA foreign_keys = ON;")
        cursor.execute("VACUUM;")
        return {"success": True, "message": "All database tables truncated cleanly. Ready for clean user sign-in."}
    except Exception as e:
        conn.rollback()
        return {"success": False, "message": str(e)}
    finally:
        conn.close()
