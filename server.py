"""
Phoenix Elite Sports Academy - Flask & SQLite Backend Server
Provides full REST API for Student Operations and serves frontend assets.
"""

import os
import sys
import argparse
from flask import Flask, request, jsonify, send_from_directory
import database

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
app = Flask(__name__, static_folder=None)

# Enable CORS for all routes
@app.after_request
def add_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type,Authorization'
    response.headers['Access-Control-Allow-Methods'] = 'GET,PUT,POST,DELETE,OPTIONS'
    return response

@app.route('/api/<path:path>', methods=['OPTIONS'])
def options_handler(path):
    return ('', 204)

# -----------------------------------------------------------------------------
# REST API: Health & DB Info
# -----------------------------------------------------------------------------
@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        "status": "online",
        "database": "SQLite",
        "db_file": database.DB_FILE,
        "message": "Connected to SQLite database successfully."
    })

@app.route('/api/database/truncate', methods=['POST'])
def api_truncate_database():
    """Database migration endpoint to truncate all tables."""
    result = database.truncate_all_data()
    status_code = 200 if result.get("success") else 500
    return jsonify(result), status_code

# -----------------------------------------------------------------------------
# REST API: Student Registration & Authentication
# -----------------------------------------------------------------------------
@app.route('/api/students/register', methods=['POST'])
def api_register_student():
    data = request.get_json(force=True, silent=True) or {}
    result = database.register_student(data)
    status_code = 201 if result.get("success") else 400
    return jsonify(result), status_code

@app.route('/api/students/login', methods=['POST'])
def api_login_student():
    data = request.get_json(force=True, silent=True) or {}
    identifier = data.get('identifier') or data.get('email') or data.get('username')
    password = data.get('password')
    result = database.authenticate_student(identifier, password)
    status_code = 200 if result.get("success") else 401
    return jsonify(result), status_code

# -----------------------------------------------------------------------------
# REST API: Students List & Profile
# -----------------------------------------------------------------------------
@app.route('/api/students', methods=['GET'])
def api_get_students():
    students = database.get_all_students()
    return jsonify({"success": True, "students": students, "count": len(students)})

@app.route('/api/students/<student_id>', methods=['GET'])
def api_get_student_by_id(student_id):
    student = database.get_student_by_id(student_id)
    if student:
        return jsonify({"success": True, "student": student})
    return jsonify({"success": False, "message": "Student not found."}), 404

# -----------------------------------------------------------------------------
# REST API: Student Practice Slot Bookings
# -----------------------------------------------------------------------------
@app.route('/api/students/<student_id>/schedule/book', methods=['POST'])
def api_book_slot(student_id):
    data = request.get_json(force=True, silent=True) or {}
    schedule_id = data.get('scheduleId') or data.get('schedule_id')
    if not schedule_id:
        return jsonify({"success": False, "message": "Schedule ID is required."}), 400
    result = database.book_training_slot(student_id, schedule_id)
    return jsonify(result)

@app.route('/api/students/<student_id>/schedule/cancel', methods=['POST'])
def api_cancel_slot(student_id):
    data = request.get_json(force=True, silent=True) or {}
    schedule_id = data.get('scheduleId') or data.get('schedule_id')
    if not schedule_id:
        return jsonify({"success": False, "message": "Schedule ID is required."}), 400
    result = database.cancel_training_slot(student_id, schedule_id)
    return jsonify(result)

@app.route('/api/students/<student_id>/schedule/bookings', methods=['GET'])
def api_get_student_bookings(student_id):
    bookings = database.get_student_slot_bookings(student_id)
    return jsonify({"success": True, "bookings": bookings})

@app.route('/api/schedules/bookings', methods=['GET'])
def api_get_all_bookings():
    bookings = database.get_all_slot_bookings()
    return jsonify({"success": True, "bookings": bookings})

# -----------------------------------------------------------------------------
# REST API: Student Equipment Requests
# -----------------------------------------------------------------------------
@app.route('/api/students/<student_id>/equipment-requests', methods=['GET', 'POST'])
def api_student_equipment_requests(student_id):
    if request.method == 'POST':
        data = request.get_json(force=True, silent=True) or {}
        data['studentId'] = student_id
        result = database.submit_equipment_request(data)
        return jsonify(result), (201 if result.get("success") else 400)
    else:
        reqs = database.get_student_equipment_requests(student_id)
        return jsonify({"success": True, "requests": reqs})

@app.route('/api/equipment-requests', methods=['GET', 'POST'])
def api_equipment_requests():
    if request.method == 'POST':
        data = request.get_json(force=True, silent=True) or {}
        result = database.submit_equipment_request(data)
        return jsonify(result), (201 if result.get("success") else 400)
    else:
        reqs = database.get_student_equipment_requests(None)
        return jsonify({"success": True, "requests": reqs})

# -----------------------------------------------------------------------------
# REST API: Student Fees & Payments
# -----------------------------------------------------------------------------
@app.route('/api/students/<student_id>/fees', methods=['GET'])
def api_student_fees(student_id):
    fees = database.get_student_fees(student_id)
    return jsonify({"success": True, "fees": fees})

@app.route('/api/fees', methods=['GET'])
def api_all_fees():
    fees = database.get_student_fees(None)
    return jsonify({"success": True, "fees": fees})

@app.route('/api/fees/<invoice_id>/pay', methods=['POST'])
def api_pay_fee(invoice_id):
    data = request.get_json(force=True, silent=True) or {}
    result = database.pay_fee_invoice(invoice_id, data)
    status_code = 200 if result.get("success") else 400
    return jsonify(result), status_code

# -----------------------------------------------------------------------------
# Static Asset Routing (Serves HTML, CSS, JS, Images, etc.)
# -----------------------------------------------------------------------------
@app.route('/', methods=['GET'])
def serve_index():
    return send_from_directory(BASE_DIR, 'index.html')

@app.route('/<path:path>', methods=['GET'])
def serve_static(path):
    target_path = os.path.join(BASE_DIR, path)
    if os.path.exists(target_path) and not os.path.isdir(target_path):
        return send_from_directory(BASE_DIR, path)
    if os.path.isdir(target_path):
        index_file = os.path.join(target_path, 'index.html')
        if os.path.exists(index_file):
            return send_from_directory(target_path, 'index.html')
    # Default fallback to index.html
    return send_from_directory(BASE_DIR, 'index.html')

# -----------------------------------------------------------------------------
# Entry Point
# -----------------------------------------------------------------------------
if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="Run Phoenix Academy Server with SQLite DB")
    parser.add_argument('--port', type=int, default=5500, help="Port to run server on (default: 5500)")
    parser.add_argument('--host', type=str, default='127.0.0.1', help="Host to bind (default: 127.0.0.1)")
    args = parser.parse_args()

    # Initialize SQLite Database
    database.init_db()

    print("=" * 60)
    print("  Phoenix Elite Sports Academy - Connected to SQLite DB")
    print(f"  Local Database: {database.DB_FILE}")
    print(f"  Web Application: http://{args.host}:{args.port}")
    print(f"  Student REST API: http://{args.host}:{args.port}/api/health")
    print("=" * 60)

    app.run(host=args.host, port=args.port, debug=False)
