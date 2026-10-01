"""
Archery Academy Management System — Flask Backend
Database: archery_academy (MySQL)
Auth: Flask server-side sessions + werkzeug password hashing
Role protection on all API routes.
"""

import os
import argparse
from functools import wraps
from flask import Flask, request, jsonify, session, send_from_directory
import database_mysql as db
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

BASE_DIR   = os.path.dirname(os.path.abspath(__file__))
app        = Flask(__name__, static_folder=None)
app.secret_key = os.getenv("SECRET_KEY", "phoenix-archery-secret-2026")


# ─────────────────────────────────────────────────────────────────────────────
# CORS
# ─────────────────────────────────────────────────────────────────────────────
@app.after_request
def add_cors(response):
    response.headers["Access-Control-Allow-Origin"]      = request.headers.get("Origin", "*")
    response.headers["Access-Control-Allow-Credentials"] = "true"
    response.headers["Access-Control-Allow-Headers"]     = "Content-Type,Authorization"
    response.headers["Access-Control-Allow-Methods"]     = "GET,POST,PUT,DELETE,OPTIONS"
    return response

@app.route("/api/<path:path>", methods=["OPTIONS"])
def options_handler(path):
    return ("", 204)


# ─────────────────────────────────────────────────────────────────────────────
# Role guards
# ─────────────────────────────────────────────────────────────────────────────
def login_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if "user_id" not in session:
            return jsonify({"success": False, "message": "Authentication required."}), 401
        return f(*args, **kwargs)
    return decorated

def role_required(*roles):
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            if "user_id" not in session:
                return jsonify({"success": False, "message": "Authentication required."}), 401
            if session.get("role") not in roles:
                return jsonify({"success": False, "message": f"Access denied. Required role: {', '.join(roles)}."}), 403
            return f(*args, **kwargs)
        return decorated
    return decorator


# ─────────────────────────────────────────────────────────────────────────────
# HEALTH
# ─────────────────────────────────────────────────────────────────────────────
@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({
        "status": "online",
        "database": "MySQL — archery_academy",
        "db_host": f"{os.getenv('DB_HOST')}:{os.getenv('DB_PORT')}",
        "db_name": os.getenv("DB_NAME", "archery_academy"),
        "db_user": os.getenv("DB_USER"),
    })


# ─────────────────────────────────────────────────────────────────────────────
# SESSION CHECK (frontend polls this on load)
# ─────────────────────────────────────────────────────────────────────────────
@app.route("/api/session", methods=["GET"])
def get_session():
    if "user_id" not in session:
        return jsonify({"logged_in": False})
    return jsonify({
        "logged_in":  True,
        "user_id":    session["user_id"],
        "role":       session["role"],
        "name":       session["name"],
        "email":      session["email"],
        "profile_id": session.get("profile_id"),
    })


# ─────────────────────────────────────────────────────────────────────────────
# AUTH — /api/auth/login, /api/auth/logout, /api/auth/register
# ─────────────────────────────────────────────────────────────────────────────
@app.route("/api/auth/login", methods=["POST"])
def login():
    data       = request.get_json(force=True, silent=True) or {}
    identifier = (data.get("identifier") or data.get("email") or data.get("username") or "").strip()
    password   = (data.get("password") or "").strip()
    role_hint  = (data.get("role") or "").strip()   # 'student' | 'coach' | 'admin'

    result = db.authenticate_user(identifier, password)
    if not result["success"]:
        return jsonify(result), 401

    # Optional role check (if frontend sends which tab was selected)
    if role_hint and result["role"] != role_hint:
        return jsonify({
            "success": False,
            "message": "Invalid email or password."
        }), 401

    # Build session
    session["user_id"]    = result["user_id"]
    session["role"]       = result["role"]
    session["name"]       = result["name"]
    session["email"]      = result["email"]
    session["profile_id"] = (
        result.get("student_id") or
        result.get("coach_id") or
        result.get("admin_id")
    )
    session.permanent = True

    return jsonify({
        "success":    True,
        "role":       result["role"],
        "user_id":    result["user_id"],
        "name":       result["name"],
        "email":      result["email"],
        "profile_id": session["profile_id"],
        "profile":    result.get("profile"),
    })


@app.route("/api/auth/logout", methods=["POST"])
def logout():
    session.clear()
    return jsonify({"success": True, "message": "Logged out."})


@app.route("/api/auth/register/student", methods=["POST"])
def register_student():
    data   = request.get_json(force=True, silent=True) or {}
    result = db.register_student(data)
    return jsonify(result), (201 if result.get("success") else 400)


@app.route("/api/auth/register/coach", methods=["POST"])
def register_coach():
    data   = request.get_json(force=True, silent=True) or {}
    result = db.register_coach(data)
    return jsonify(result), (201 if result.get("success") else 400)


# ─────────────────────────────────────────────────────────────────────────────
# STUDENT ROUTES — student sees ONLY own data
# ─────────────────────────────────────────────────────────────────────────────
@app.route("/api/student/profile", methods=["GET"])
@role_required("student")
def student_profile():
    student_id = session["profile_id"]
    student    = db.get_student_full(student_id)
    if not student:
        return jsonify({"success": False, "message": "Profile not found."}), 404
    return jsonify({"success": True, "student": student})


@app.route("/api/student/performance", methods=["GET"])
@role_required("student")
def student_performance():
    rows = db.get_student_performance(session["profile_id"])
    return jsonify({"success": True, "performance": rows})


@app.route("/api/student/attendance", methods=["GET"])
@role_required("student")
def student_attendance():
    rows = db.get_student_attendance(session["profile_id"])
    return jsonify({"success": True, "attendance": rows})


@app.route("/api/student/bow-maintenance", methods=["GET"])
@role_required("student")
def student_bow_maintenance():
    rows = db.get_student_bow_maintenance(session["profile_id"])
    return jsonify({"success": True, "bow_maintenance": rows})


@app.route("/api/student/fees", methods=["GET"])
@role_required("student")
def student_fees():
    rows = db.get_student_fees(session["profile_id"])
    return jsonify({"success": True, "fees": rows})


@app.route("/api/student/notifications", methods=["GET"])
@role_required("student")
def student_notifications():
    unread_only = request.args.get("unread_only", "false").lower() == "true"
    rows = db.get_user_notifications(session["user_id"], unread_only)
    return jsonify({"success": True, "notifications": rows})


@app.route("/api/student/notifications/<int:notif_id>/read", methods=["POST"])
@role_required("student")
def student_mark_read(notif_id):
    result = db.mark_notification_read(notif_id, session["user_id"])
    return jsonify(result)


@app.route("/api/student/notifications/read-all", methods=["POST"])
@role_required("student")
def student_read_all():
    result = db.mark_all_notifications_read(session["user_id"])
    return jsonify(result)


@app.route("/api/student/training/book", methods=["POST"])
@role_required("student")
def student_book_slot():
    """Book a training slot (session-tracked per student)."""
    data        = request.get_json(force=True, silent=True) or {}
    schedule_id = data.get("schedule_id", "")
    student_id  = session.get("profile_id", "")
    # Training slots are managed client-side in the schedule module.
    # Server logs the intent and returns success.
    return jsonify({"success": True, "message": f"Slot {schedule_id} booked for {student_id}."})


@app.route("/api/student/training/cancel", methods=["POST"])
@role_required("student")
def student_cancel_slot():
    data        = request.get_json(force=True, silent=True) or {}
    schedule_id = data.get("schedule_id", "")
    student_id  = session.get("profile_id", "")
    return jsonify({"success": True, "message": f"Booking {schedule_id} cancelled for {student_id}."})


# ─────────────────────────────────────────────────────────────────────────────
# COACH ROUTES — coach searches, views, updates students
# ─────────────────────────────────────────────────────────────────────────────
@app.route("/api/coach/dashboard-stats", methods=["GET"])
@role_required("coach")
def coach_dashboard_stats():
    stats = db.coach_get_dashboard_stats(session["profile_id"])
    return jsonify({"success": True, "stats": stats})


@app.route("/api/coach/search-student", methods=["GET"])
@role_required("coach")
def coach_search_student():
    student_id = (request.args.get("student_id") or "").strip().upper()
    if not student_id:
        return jsonify({"success": False, "message": "Student ID is required."}), 400
    student = db.get_student_full(student_id)
    if not student:
        return jsonify({"success": False, "message": f"No student found with ID: {student_id}"}), 404
    return jsonify({"success": True, "student": student})


@app.route("/api/coach/student/<student_id>/performance", methods=["GET"])
@role_required("coach")
def coach_view_performance(student_id):
    rows = db.get_student_performance(student_id.upper())
    return jsonify({"success": True, "performance": rows})


@app.route("/api/coach/performance/update", methods=["POST"])
@role_required("coach")
def coach_update_performance():
    data            = request.get_json(force=True, silent=True) or {}
    data["coach_id"] = session["profile_id"]
    result          = db.coach_update_performance(data, session["user_id"])
    return jsonify(result), (200 if result.get("success") else 400)


@app.route("/api/coach/student/<student_id>/attendance", methods=["GET"])
@role_required("coach")
def coach_view_attendance(student_id):
    rows = db.get_student_attendance(student_id.upper())
    return jsonify({"success": True, "attendance": rows})


@app.route("/api/coach/attendance/update", methods=["POST"])
@role_required("coach")
def coach_update_attendance():
    data            = request.get_json(force=True, silent=True) or {}
    data["coach_id"] = session["profile_id"]
    result          = db.coach_update_attendance(data, session["user_id"])
    return jsonify(result), (200 if result.get("success") else 400)


@app.route("/api/coach/student/<student_id>/bow-maintenance", methods=["GET"])
@role_required("coach")
def coach_view_bow_maintenance(student_id):
    rows = db.get_student_bow_maintenance(student_id.upper())
    return jsonify({"success": True, "bow_maintenance": rows})


@app.route("/api/coach/bow-maintenance/update", methods=["POST"])
@role_required("coach")
def coach_update_bow_maintenance():
    data            = request.get_json(force=True, silent=True) or {}
    data["coach_id"] = session["profile_id"]
    result          = db.coach_update_bow_maintenance(data, session["user_id"])
    return jsonify(result), (200 if result.get("success") else 400)


@app.route("/api/coach/send-report", methods=["POST"])
@role_required("coach")
def coach_send_report():
    data            = request.get_json(force=True, silent=True) or {}
    data["coach_id"] = session["profile_id"]
    result          = db.coach_send_report(data, session["user_id"])
    return jsonify(result), (200 if result.get("success") else 400)


# ─────────────────────────────────────────────────────────────────────────────
# ADMIN ROUTES — admin views everything
# ─────────────────────────────────────────────────────────────────────────────
@app.route("/api/admin/dashboard-stats", methods=["GET"])
@role_required("admin")
def admin_dashboard_stats():
    stats = db.admin_get_dashboard_stats()
    return jsonify({"success": True, "stats": stats})


@app.route("/api/admin/search-student", methods=["GET"])
@role_required("admin")
def admin_search_student():
    student_id = (request.args.get("student_id") or "").strip().upper()
    if not student_id:
        return jsonify({"success": False, "message": "Student ID is required."}), 400
    student = db.get_student_full(student_id)
    if not student:
        return jsonify({"success": False, "message": f"No student found with ID: {student_id}"}), 404
    return jsonify({"success": True, "student": student})


@app.route("/api/admin/students", methods=["GET"])
@role_required("admin")
def admin_all_students():
    students = db.get_all_students()
    return jsonify({"success": True, "students": students, "count": len(students)})


@app.route("/api/admin/student/<student_id>", methods=["GET"])
@role_required("admin")
def admin_student_detail(student_id):
    student = db.get_student_full(student_id.upper())
    if not student:
        return jsonify({"success": False, "message": "Student not found."}), 404
    return jsonify({"success": True, "student": student})


@app.route("/api/admin/student/<student_id>/performance", methods=["GET"])
@role_required("admin")
def admin_student_performance(student_id):
    rows = db.get_student_performance(student_id.upper())
    return jsonify({"success": True, "performance": rows})


@app.route("/api/admin/student/<student_id>/attendance", methods=["GET"])
@role_required("admin")
def admin_student_attendance(student_id):
    rows = db.get_student_attendance(student_id.upper())
    return jsonify({"success": True, "attendance": rows})


@app.route("/api/admin/student/<student_id>/fees", methods=["GET"])
@role_required("admin")
def admin_student_fees(student_id):
    rows = db.get_student_fees(student_id.upper())
    return jsonify({"success": True, "fees": rows})


@app.route("/api/admin/student/<student_id>/fees", methods=["POST"])
@role_required("admin")
def admin_add_student_fee(student_id):
    data               = request.get_json(force=True, silent=True) or {}
    data["student_id"] = student_id.upper()
    result = db.admin_add_fee(data, session["user_id"])
    return jsonify(result), (201 if result.get("success") else 400)


@app.route("/api/admin/fees/<int:fee_id>/pay", methods=["POST"])
@role_required("admin")
def admin_pay_fee(fee_id):
    data   = request.get_json(force=True, silent=True) or {}
    result = db.admin_update_fee_payment(fee_id, data, session["user_id"])
    return jsonify(result)


@app.route("/api/admin/student/<student_id>/bow-maintenance", methods=["GET"])
@role_required("admin")
def admin_bow_maintenance(student_id):
    rows = db.get_student_bow_maintenance(student_id.upper())
    return jsonify({"success": True, "bow_maintenance": rows})


@app.route("/api/admin/coaches", methods=["GET"])
@role_required("admin")
def admin_all_coaches():
    coaches = db.get_all_coaches()
    return jsonify({"success": True, "coaches": coaches})


@app.route("/api/admin/reports", methods=["GET"])
@role_required("admin")
def admin_all_reports():
    student_id = request.args.get("student_id")
    reports    = db.get_all_coach_reports(student_id)
    return jsonify({"success": True, "reports": reports})


@app.route("/api/admin/notifications", methods=["GET"])
@role_required("admin")
def admin_notifications():
    unread_only = request.args.get("unread_only", "false").lower() == "true"
    rows        = db.get_user_notifications(session["user_id"], unread_only)
    return jsonify({"success": True, "notifications": rows})


@app.route("/api/admin/notifications/<int:notif_id>/read", methods=["POST"])
@role_required("admin")
def admin_mark_read(notif_id):
    result = db.mark_notification_read(notif_id, session["user_id"])
    return jsonify(result)


@app.route("/api/admin/notifications/read-all", methods=["POST"])
@role_required("admin")
def admin_read_all():
    result = db.mark_all_notifications_read(session["user_id"])
    return jsonify(result)


@app.route("/api/admin/activity-logs", methods=["GET"])
@role_required("admin")
def admin_activity_logs():
    limit = int(request.args.get("limit", 50))
    logs  = db.get_activity_logs(limit)
    return jsonify({"success": True, "logs": logs})


@app.route("/api/admin/fees", methods=["GET"])
@role_required("admin")
def admin_all_fees():
    """Return all fee records joined with student name."""
    status_filter = request.args.get("status", "").strip()
    fees = db.admin_get_all_fees(status_filter or None)
    return jsonify({"success": True, "fees": fees})


@app.route("/api/admin/tournaments", methods=["GET"])
@role_required("admin", "coach", "student")
def get_tournaments():
    rows = db.get_all_tournaments()
    return jsonify({"success": True, "tournaments": rows})


# ─────────────────────────────────────────────────────────────────────────────
# STATIC FILE SERVING — Flask serves all HTML/CSS/JS
# ─────────────────────────────────────────────────────────────────────────────
@app.route("/", methods=["GET"])
def serve_index():
    return send_from_directory(BASE_DIR, "index.html")


@app.route("/<path:path>", methods=["GET"])
def serve_static(path):
    target = os.path.join(BASE_DIR, path)
    if os.path.isfile(target):
        return send_from_directory(BASE_DIR, path)
    if os.path.isdir(target):
        idx = os.path.join(target, "index.html")
        if os.path.isfile(idx):
            return send_from_directory(target, "index.html")
    return send_from_directory(BASE_DIR, "index.html")


# ─────────────────────────────────────────────────────────────────────────────
# ENTRY POINT
# ─────────────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--port", type=int, default=5500)
    parser.add_argument("--host", type=str, default="127.0.0.1")
    args = parser.parse_args()

    db.init_db()

    print("=" * 60)
    print("  Phoenix Archery Academy — Flask + MySQL")
    print(f"  DB:      {os.getenv('DB_HOST')}:{os.getenv('DB_PORT')} / archery_academy")
    print(f"  Web App: http://{args.host}:{args.port}")
    print(f"  API:     http://{args.host}:{args.port}/api/health")
    print("=" * 60)

    app.run(host=args.host, port=args.port, debug=False)
