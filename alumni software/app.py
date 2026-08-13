from flask import Flask, request, jsonify, render_template
from werkzeug.security import generate_password_hash, check_password_hash
import sqlite3

app = Flask(__name__)
DB_NAME = 'database.db'

# Helper function to get database connection
def get_db_connection():
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    return conn

# Database Initialization
def init_db():
    with get_db_connection() as conn:
        # Create users table
        conn.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                role TEXT NOT NULL,
                dept TEXT NOT NULL,
                batch TEXT NOT NULL,
                company TEXT DEFAULT '',
                designation TEXT DEFAULT '',
                about TEXT DEFAULT ''
            )
        ''')
        
        # Create events table for faculty postings
        conn.execute('''
            CREATE TABLE IF NOT EXISTS events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                dept TEXT NOT NULL,
                event_date TEXT NOT NULL,
                location TEXT NOT NULL,
                created_by TEXT NOT NULL
            )
        ''')
        conn.commit()

init_db()

# Page Routes
@app.route('/')
def home():
    return render_template('login.html')

@app.route('/student')
def student_page():
    return render_template('student.html')

@app.route('/alumni')
def alumni_page():
    return render_template('alumni.html')

@app.route('/faculty')
def faculty_page():
    return render_template('faculty.html')

# Signup API Route
@app.route('/api/signup', methods=['POST'])
def signup():
    data = request.get_json(silent=True) or {}
    
    name = data.get('name', '').strip()
    email = data.get('email', '').strip().lower()
    raw_password = data.get('password')
    role = data.get('role', '').strip().lower()
    dept = data.get('dept', '').strip()
    batch = data.get('batch', 'N/A').strip()

    if not all([name, email, raw_password, role, dept]):
        return jsonify({"success": False, "message": "Please fill in all required fields."}), 400

    password = generate_password_hash(raw_password)

    try:
        with get_db_connection() as conn:
            conn.execute('''
                INSERT INTO users (name, email, password, role, dept, batch)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (name, email, password, role, dept, batch))
            conn.commit()
            
        return jsonify({"success": True, "message": "Registration successful!"}), 201

    except sqlite3.IntegrityError:
        return jsonify({"success": False, "message": "Email already exists!"}), 400
    except Exception as e:
        print("Signup Error:", e)
        return jsonify({"success": False, "message": "A server error occurred."}), 500

# Login API Route
@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json(silent=True) or {}
    
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    role = data.get('role', '').strip().lower()

    if not email or not password or not role:
        return jsonify({"success": False, "message": "Email, password, and role are required."}), 400

    try:
        conn = get_db_connection()
        user = conn.execute(
            'SELECT name, password, role, dept, email FROM users WHERE email = ? AND role = ?', 
            (email, role)
        ).fetchone()
        conn.close()

        if user and check_password_hash(user['password'], password):
            return jsonify({
                "success": True,
                "name": user['name'],
                "role": user['role'],
                "dept": user['dept'],
                "email": user['email']
            }), 200
        else:
            return jsonify({"success": False, "message": "Invalid email, password, or role."}), 401

    except Exception as e:
        print("Login Error:", e)
        return jsonify({"success": False, "message": "A server error occurred."}), 500

# GET API: Fetch registered Alumni
@app.route('/api/alumni', methods=['GET'])
def get_alumni():
    dept = request.args.get('dept', '').strip()
    try:
        conn = get_db_connection()
        if dept:
            rows = conn.execute(
                "SELECT name, email, dept, batch, company, designation, about FROM users WHERE role = 'alumni' AND dept = ?", 
                (dept,)
            ).fetchall()
        else:
            rows = conn.execute(
                "SELECT name, email, dept, batch, company, designation, about FROM users WHERE role = 'alumni'"
            ).fetchall()
        conn.close()

        alumni_list = [dict(row) for row in rows]
        return jsonify({"success": True, "alumni": alumni_list}), 200
    except Exception as e:
        print("Fetch Alumni Error:", e)
        return jsonify({"success": False, "message": "Failed to fetch alumni data."}), 500

# GET API: Fetch Department Events
@app.route('/api/events', methods=['GET'])
def get_events():
    dept = request.args.get('dept', '').strip()
    try:
        conn = get_db_connection()
        if dept:
            rows = conn.execute(
                "SELECT id, title, dept, event_date, location, created_by FROM events WHERE dept = ? ORDER BY id DESC", 
                (dept,)
            ).fetchall()
        else:
            rows = conn.execute(
                "SELECT id, title, dept, event_date, location, created_by FROM events ORDER BY id DESC"
            ).fetchall()
        conn.close()

        events_list = [dict(row) for row in rows]
        return jsonify({"success": True, "events": events_list}), 200
    except Exception as e:
        print("Fetch Events Error:", e)
        return jsonify({"success": False, "message": "Failed to fetch events."}), 500

# POST API: Publish a new Department Event
@app.route('/api/events', methods=['POST'])
def post_event():
    data = request.get_json(silent=True) or {}
    
    title = data.get('title', '').strip()
    dept = data.get('dept', '').strip()
    event_date = data.get('event_date', '').strip()
    location = data.get('location', '').strip()
    created_by = data.get('created_by', 'Faculty').strip()

    if not all([title, dept, event_date, location]):
        return jsonify({"success": False, "message": "Please fill in all event details."}), 400

    try:
        with get_db_connection() as conn:
            conn.execute('''
                INSERT INTO events (title, dept, event_date, location, created_by)
                VALUES (?, ?, ?, ?, ?)
            ''', (title, dept, event_date, location, created_by))
            conn.commit()

        return jsonify({"success": True, "message": "Event published successfully!"}), 201
    except Exception as e:
        print("Post Event Error:", e)
        return jsonify({"success": False, "message": "Failed to save event."}), 500

# Force Delete Account API Route
@app.route('/api/force-delete-account', methods=['DELETE'])
def force_delete_account():
    data = request.get_json(silent=True) or {}
    email = data.get('email', '').strip().lower()
    role = data.get('role', '').strip().lower()

    if not email or not role:
        return jsonify({"success": False, "message": "Email and role selection are required."}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('DELETE FROM users WHERE email = ? AND role = ?', (email, role))
        conn.commit()
        
        deleted_count = cursor.rowcount
        conn.close()

        if deleted_count > 0:
            return jsonify({"success": True, "message": "Account successfully deleted! You can now register again."}), 200
        else:
            return jsonify({"success": False, "message": "No matching account found with that email and role."}), 404

    except Exception as e:
        print("Delete Error:", e)
        return jsonify({"success": False, "message": f"Server database error: {str(e)}"}), 500

if __name__ == '__main__':
    app.run(debug=True)