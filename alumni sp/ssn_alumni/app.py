from flask import Flask, request, jsonify, render_template
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import date
import sqlite3

app = Flask(__name__)
DB_NAME = 'database.db'

VALID_ROLES = {'student', 'faculty', 'alumni', 'admin'}


def get_db_connection():
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    with get_db_connection() as conn:
        conn.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                role TEXT NOT NULL,
                dept TEXT NOT NULL,
                batch TEXT DEFAULT 'N/A',
                company TEXT DEFAULT '',
                designation TEXT DEFAULT '',
                about TEXT DEFAULT ''
            )
        ''')
        conn.execute('''
            CREATE TABLE IF NOT EXISTS events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                event_date TEXT NOT NULL,
                location TEXT NOT NULL,
                dept TEXT NOT NULL DEFAULT 'All',
                posted_by_role TEXT NOT NULL,
                posted_by_name TEXT NOT NULL
            )
        ''')
        conn.execute('''
            CREATE TABLE IF NOT EXISTS jobs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                company TEXT NOT NULL,
                location TEXT NOT NULL,
                link TEXT DEFAULT '',
                description TEXT NOT NULL,
                posted_by_email TEXT NOT NULL,
                posted_by_name TEXT NOT NULL
            )
        ''')
        conn.execute('''
            CREATE TABLE IF NOT EXISTS mentorships (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                student_email TEXT NOT NULL,
                student_name TEXT NOT NULL,
                alumni_email TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'pending',
                request_note TEXT DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        conn.execute('''
            CREATE TABLE IF NOT EXISTS messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                sender_email TEXT NOT NULL,
                receiver_email TEXT NOT NULL,
                message TEXT NOT NULL,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        conn.execute('''
            CREATE TABLE IF NOT EXISTS notifications (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_email TEXT NOT NULL,
                message TEXT NOT NULL,
                is_read INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        conn.commit()


init_db()


# ---------- Page Routes ----------

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


@app.route('/admin')
def admin_page():
    return render_template('admin.html')


# ---------- Auth ----------

@app.route('/api/signup', methods=['POST'])
def signup():
    data = request.get_json(silent=True) or {}

    name = data.get('name', '').strip()
    email = data.get('email', '').strip().lower()
    raw_password = data.get('password')
    role = data.get('role', '').strip().lower()
    dept = data.get('dept', '').strip()
    batch = (data.get('batch') or 'N/A').strip()

    if role not in VALID_ROLES:
        return jsonify({"success": False, "message": "Invalid role selected."}), 400

    if not all([name, email, raw_password, dept]):
        return jsonify({"success": False, "message": "Please fill in all required fields."}), 400

    password = generate_password_hash(raw_password)

    try:
        with get_db_connection() as conn:
            conn.execute('''
                INSERT INTO users (name, email, password, role, dept, batch)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (name, email, password, role, dept, batch))
            conn.commit()

        return jsonify({"success": True, "message": "Registered successfully! You can now log in."}), 201

    except sqlite3.IntegrityError:
        return jsonify({"success": False, "message": "An account with that email already exists."}), 400
    except Exception as e:
        print("Signup Error:", e)
        return jsonify({"success": False, "message": "A server error occurred."}), 500


@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json(silent=True) or {}

    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    role = data.get('role', '').strip().lower()

    if not email or not password or role not in VALID_ROLES:
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


@app.route('/api/reset-password', methods=['POST'])
def reset_password():
    data = request.get_json(silent=True) or {}
    email = data.get('email', '').strip().lower()
    role = data.get('role', '').strip().lower()
    new_password = data.get('new_password', '')

    if not email or role not in VALID_ROLES:
        return jsonify({"success": False, "message": "Email and role are required."}), 400

    if not new_password or len(new_password) < 4:
        return jsonify({"success": False, "message": "New password must be at least 4 characters."}), 400

    try:
        conn = get_db_connection()
        user = conn.execute(
            'SELECT id FROM users WHERE email = ? AND role = ?', (email, role)
        ).fetchone()

        if not user:
            conn.close()
            return jsonify({"success": False, "message": "No account found with that email and role."}), 404

        conn.execute(
            'UPDATE users SET password = ? WHERE email = ? AND role = ?',
            (generate_password_hash(new_password), email, role)
        )
        conn.commit()
        conn.close()

        return jsonify({"success": True, "message": "Password updated. You can log in now."}), 200

    except Exception as e:
        print("Reset Password Error:", e)
        return jsonify({"success": False, "message": "A server error occurred."}), 500


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
            return jsonify({"success": True, "message": "Account deleted. You can register again."}), 200
        else:
            return jsonify({"success": False, "message": "No matching account found."}), 404

    except Exception as e:
        print("Delete Error:", e)
        return jsonify({"success": False, "message": f"Server database error: {str(e)}"}), 500


# ---------- Directory ----------

@app.route('/api/directory', methods=['GET'])
def directory():
    dept = request.args.get('dept', '').strip()
    if not dept:
        return jsonify({"success": False, "message": "Department is required."}), 400

    try:
        conn = get_db_connection()
        students = conn.execute(
            "SELECT name, email, dept, batch FROM users WHERE role = 'student' AND dept = ?",
            (dept,)
        ).fetchall()
        alumni = conn.execute(
            "SELECT name, email, dept, batch, company, designation, about FROM users WHERE role = 'alumni' AND dept = ?",
            (dept,)
        ).fetchall()
        faculty = conn.execute(
            "SELECT name, email, dept FROM users WHERE role = 'faculty' AND dept = ?",
            (dept,)
        ).fetchall()
        conn.close()

        return jsonify({
            "success": True,
            "students": [dict(r) for r in students],
            "alumni": [dict(r) for r in alumni],
            "faculty": [dict(r) for r in faculty]
        }), 200
    except Exception as e:
        print("Directory Error:", e)
        return jsonify({"success": False, "message": "Failed to fetch directory."}), 500


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
        return jsonify({"success": True, "alumni": [dict(r) for r in rows]}), 200
    except Exception as e:
        print("Fetch Alumni Error:", e)
        return jsonify({"success": False, "message": "Failed to fetch alumni data."}), 500


# ---------- Profile ----------

@app.route('/api/profile', methods=['POST'])
def update_profile():
    data = request.get_json(silent=True) or {}
    email = data.get('email', '').strip().lower()
    name = data.get('name', '').strip()
    company = data.get('company', '').strip()
    designation = data.get('designation', '').strip()
    about = data.get('about', '').strip()

    if not email:
        return jsonify({"success": False, "message": "Missing account email."}), 400

    try:
        with get_db_connection() as conn:
            conn.execute('''
                UPDATE users SET name = ?, company = ?, designation = ?, about = ?
                WHERE email = ? AND role = 'alumni'
            ''', (name, company, designation, about, email))
            conn.commit()
        return jsonify({"success": True, "message": "Profile updated."}), 200
    except Exception as e:
        print("Profile Update Error:", e)
        return jsonify({"success": False, "message": "Failed to update profile."}), 500


# ---------- Jobs ----------

@app.route('/api/jobs', methods=['GET'])
def get_jobs():
    email = request.args.get('email', '').strip().lower()
    try:
        conn = get_db_connection()
        if email:
            rows = conn.execute(
                "SELECT * FROM jobs WHERE posted_by_email = ? ORDER BY id DESC", (email,)
            ).fetchall()
        else:
            rows = conn.execute("SELECT * FROM jobs ORDER BY id DESC").fetchall()
        conn.close()
        return jsonify({"success": True, "jobs": [dict(r) for r in rows]}), 200
    except Exception as e:
        print("Jobs Fetch Error:", e)
        return jsonify({"success": False, "message": "Failed to fetch jobs."}), 500


@app.route('/api/jobs', methods=['POST'])
def post_job():
    data = request.get_json(silent=True) or {}
    required = ['title', 'company', 'location', 'description', 'email', 'name']
    if not all(data.get(k, '').strip() for k in required):
        return jsonify({"success": False, "message": "Please fill in all required fields."}), 400

    try:
        with get_db_connection() as conn:
            conn.execute('''
                INSERT INTO jobs (title, company, location, link, description, posted_by_email, posted_by_name)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ''', (data['title'].strip(), data['company'].strip(), data['location'].strip(),
                  data.get('link', '').strip(), data['description'].strip(),
                  data['email'].strip().lower(), data['name'].strip()))
            conn.commit()
        return jsonify({"success": True, "message": "Job posted."}), 201
    except Exception as e:
        print("Job Post Error:", e)
        return jsonify({"success": False, "message": "Failed to post job."}), 500


# ---------- Events ----------

def _validate_event_date(event_date_str):
    try:
        event_d = date.fromisoformat(event_date_str)
    except (ValueError, TypeError):
        return None, "Invalid date format."
    if event_d < date.today():
        return None, "Event date cannot be in the past."
    return event_d, None


@app.route('/api/events', methods=['GET'])
def get_events():
    dept = request.args.get('dept', '').strip()
    try:
        conn = get_db_connection()
        if dept:
            rows = conn.execute(
                "SELECT * FROM events WHERE dept = 'All' OR dept = ? ORDER BY event_date ASC",
                (dept,)
            ).fetchall()
        else:
            rows = conn.execute("SELECT * FROM events ORDER BY event_date ASC").fetchall()
        conn.close()
        return jsonify({"success": True, "events": [dict(r) for r in rows]}), 200
    except Exception as e:
        print("Events Fetch Error:", e)
        return jsonify({"success": False, "message": "Failed to fetch events."}), 500


@app.route('/api/events', methods=['POST'])
def post_event():
    data = request.get_json(silent=True) or {}
    title = data.get('title', '').strip()
    event_date_str = data.get('event_date', '').strip()
    location = data.get('location', '').strip()
    dept = data.get('dept', 'All').strip() or 'All'
    posted_by_role = data.get('posted_by_role', '').strip().lower()
    posted_by_name = data.get('posted_by_name', '').strip()

    if not all([title, event_date_str, location, posted_by_role, posted_by_name]):
        return jsonify({"success": False, "message": "Please fill in all required fields."}), 400

    if posted_by_role not in ('admin', 'faculty'):
        return jsonify({"success": False, "message": "Only admin or faculty can post events."}), 403

    _, error = _validate_event_date(event_date_str)
    if error:
        return jsonify({"success": False, "message": error}), 400

    try:
        with get_db_connection() as conn:
            conn.execute('''
                INSERT INTO events (title, event_date, location, dept, posted_by_role, posted_by_name)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (title, event_date_str, location, dept, posted_by_role, posted_by_name))
            conn.commit()
        return jsonify({"success": True, "message": "Event published."}), 201
    except Exception as e:
        print("Event Post Error:", e)
        return jsonify({"success": False, "message": "Failed to post event."}), 500


# ---------- Notifications & Mentorship ----------

@app.route('/api/alumni/notifications', methods=['GET'])
def get_alumni_notifications():
    email = request.args.get('email', '').strip().lower()
    try:
        conn = get_db_connection()
        notifications = conn.execute(
            "SELECT * FROM notifications WHERE user_email = ? ORDER BY id DESC", (email,)
        ).fetchall()
        
        requests = conn.execute(
            "SELECT * FROM mentorships WHERE alumni_email = ? AND status = 'pending' ORDER BY id DESC", (email,)
        ).fetchall()
        conn.close()

        return jsonify({
            "success": True, 
            "notifications": [dict(n) for n in notifications],
            "requests": [dict(r) for r in requests]
        }), 200
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


@app.route('/api/alumni/mentorship/respond', methods=['POST'])
def respond_mentorship():
    data = request.get_json(silent=True) or {}
    req_id = data.get('request_id')
    status = data.get('status')

    if not req_id or status not in ['accepted', 'rejected']:
        return jsonify({"success": False, "message": "Invalid request payload."}), 400

    try:
        with get_db_connection() as conn:
            m_req = conn.execute("SELECT * FROM mentorships WHERE id = ?", (req_id,)).fetchone()
            if not m_req:
                return jsonify({"success": False, "message": "Request not found."}), 404

            conn.execute("UPDATE mentorships SET status = ? WHERE id = ?", (status, req_id))
            
            notif_msg = f"Your mentorship request to {m_req['alumni_email']} was {status}."
            conn.execute(
                "INSERT INTO notifications (user_email, message) VALUES (?, ?)", 
                (m_req['student_email'], notif_msg)
            )
            conn.commit()

        return jsonify({"success": True, "message": f"Request {status} successfully."}), 200
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


# ---------- Messages ----------

@app.route('/api/alumni/mentees', methods=['GET'])
def get_active_mentees():
    email = request.args.get('email', '').strip().lower()
    try:
        conn = get_db_connection()
        mentees = conn.execute(
            "SELECT student_email, student_name FROM mentorships WHERE alumni_email = ? AND status = 'accepted'",
            (email,)
        ).fetchall()
        conn.close()
        return jsonify({"success": True, "mentees": [dict(m) for m in mentees]}), 200
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


@app.route('/api/messages', methods=['GET', 'POST'])
def handle_messages():
    if request.method == 'POST':
        data = request.get_json(silent=True) or {}
        sender = data.get('sender', '').strip().lower()
        receiver = data.get('receiver', '').strip().lower()
        msg = data.get('message', '').strip()

        if not sender or not receiver or not msg:
            return jsonify({"success": False, "message": "All message fields required."}), 400

        with get_db_connection() as conn:
            conn.execute(
                "INSERT INTO messages (sender_email, receiver_email, message) VALUES (?, ?, ?)",
                (sender, receiver, msg)
            )
            conn.commit()
        return jsonify({"success": True}), 201

    else:
        u1 = request.args.get('user1', '').strip().lower()
        u2 = request.args.get('user2', '').strip().lower()

        conn = get_db_connection()
        chat = conn.execute('''
            SELECT * FROM messages 
            WHERE (sender_email = ? AND receiver_email = ?) 
               OR (sender_email = ? AND receiver_email = ?)
            ORDER BY timestamp ASC
        ''', (u1, u2, u2, u1)).fetchall()
        conn.close()
        return jsonify({"success": True, "messages": [dict(c) for c in chat]}), 200


# ---------- Admin ----------

@app.route('/api/admin/users', methods=['GET'])
def admin_users():
    try:
        conn = get_db_connection()
        students = conn.execute(
            "SELECT name, email, dept, batch FROM users WHERE role = 'student' ORDER BY dept, name"
        ).fetchall()
        faculty = conn.execute(
            "SELECT name, email, dept FROM users WHERE role = 'faculty' ORDER BY dept, name"
        ).fetchall()
        alumni = conn.execute(
            "SELECT name, email, dept, batch, company, designation FROM users WHERE role = 'alumni' ORDER BY dept, name"
        ).fetchall()
        conn.close()
        return jsonify({
            "success": True,
            "students": [dict(r) for r in students],
            "faculty": [dict(r) for r in faculty],
            "alumni": [dict(r) for r in alumni]
        }), 200
    except Exception as e:
        print("Admin Users Error:", e)
        return jsonify({"success": False, "message": "Failed to fetch users."}), 500


# ---------- Student Mentorship & Workspace Extensions ----------

@app.route('/api/student/mentorship/request', methods=['POST'])
def send_mentorship_request():
    data = request.get_json(silent=True) or {}
    student_email = data.get('student_email', '').strip().lower()
    student_name = data.get('student_name', '').strip()
    alumni_email = data.get('alumni_email', '').strip().lower()
    request_note = data.get('request_note', '').strip()

    if not student_email or not alumni_email:
        return jsonify({"success": False, "message": "Invalid request payload."}), 400

    try:
        with get_db_connection() as conn:
            # Prevent duplicate requests
            existing = conn.execute(
                "SELECT id FROM mentorships WHERE student_email = ? AND alumni_email = ? AND status = 'pending'",
                (student_email, alumni_email)
            ).fetchone()

            if existing:
                return jsonify({"success": False, "message": "Request already pending with this alumnus."}), 400

            conn.execute('''
                INSERT INTO mentorships (student_email, student_name, alumni_email, request_note)
                VALUES (?, ?, ?, ?)
            ''', (student_email, student_name, alumni_email, request_note))
            conn.commit()

        return jsonify({"success": True, "message": "Mentorship request sent successfully."}), 201
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


@app.route('/api/student/mentors', methods=['GET'])
def get_student_mentors():
    email = request.args.get('email', '').strip().lower()
    try:
        conn = get_db_connection()
        mentors = conn.execute('''
            SELECT m.alumni_email, u.name as alumni_name 
            FROM mentorships m
            JOIN users u ON m.alumni_email = u.email
            WHERE m.student_email = ? AND m.status = 'accepted'
        ''', (email,)).fetchall()
        conn.close()
        return jsonify({"success": True, "mentors": [dict(m) for m in mentors]}), 200
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


@app.route('/api/student/notifications', methods=['GET'])
def get_student_notifications():
    email = request.args.get('email', '').strip().lower()
    try:
        conn = get_db_connection()
        notifications = conn.execute(
            "SELECT * FROM notifications WHERE user_email = ? ORDER BY id DESC", (email,)
        ).fetchall()
        conn.close()
        return jsonify({"success": True, "notifications": [dict(n) for n in notifications]}), 200
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


@app.route('/api/student/profile', methods=['POST'])
def update_student_profile():
    data = request.get_json(silent=True) or {}
    email = data.get('email', '').strip().lower()
    batch = data.get('batch', '').strip()

    if not email:
        return jsonify({"success": False, "message": "Student email is required."}), 400

    try:
        with get_db_connection() as conn:
            conn.execute("UPDATE users SET batch = ? WHERE email = ? AND role = 'student'", (batch, email))
            conn.commit()
        return jsonify({"success": True, "message": "Student profile updated successfully."}), 200
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)