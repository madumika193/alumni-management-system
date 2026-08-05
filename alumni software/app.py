from flask import Flask, request, jsonify, render_template
from werkzeug.security import generate_password_hash, check_password_hash
import sqlite3

app = Flask(__name__)

# Database Initialization
def init_db():
    conn = sqlite3.connect('database.db')
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            email TEXT UNIQUE,
            password TEXT,
            role TEXT,
            dept TEXT,
            batch TEXT
        )
    ''')
    conn.commit()
    conn.close()

init_db()

@app.route('/')
def home():
    return render_template('login.html')

# Signup API Route
@app.route('/api/signup', methods=['POST'])
def signup():
    data = request.json
    name = data.get('name')
    email = data.get('email').strip().lower()
    password = generate_password_hash(data.get('password'))
    role = data.get('role')
    dept = data.get('dept')
    batch = data.get('batch', 'N/A')

    try:
        conn = sqlite3.connect('database.db')
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO users (name, email, password, role, dept, batch)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (name, email, password, role, dept, batch))
        conn.commit()
        conn.close()
        return jsonify({"success": True, "message": "Registration successful!"})
    except sqlite3.IntegrityError:
        return jsonify({"success": False, "message": "Email already exists!"}), 400

# Login API Route
@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email').strip().lower()
    password = data.get('password')
    role = data.get('role')

    conn = sqlite3.connect('database.db')
    cursor = conn.cursor()
    cursor.execute('SELECT name, password, role, dept FROM users WHERE email = ? AND role = ?', (email, role))
    user = cursor.fetchone()
    conn.close()

    if user and check_password_hash(user[1], password):
        return jsonify({
            "success": True,
            "name": user[0],
            "role": user[2],
            "dept": user[3]
        })
    else:
        return jsonify({"success": False, "message": "Invalid email, password, or role."}), 401

if __name__ == '__main__':
    app.run(debug=True)