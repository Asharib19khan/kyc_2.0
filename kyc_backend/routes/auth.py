from flask import Blueprint, request, jsonify, g
from database.db_connection import get_db_connection
from services.password import hash_password, verify_password
from middleware.auth import generate_token, token_required
from utils.validators import validate_registration_data
from utils.helpers import json_response
from datetime import datetime

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    errors = validate_registration_data(data)
    if errors:
        return json_response(message="Validation failed", data=errors, status=400)

    conn = get_db_connection()
    cursor = conn.cursor()

    # Check if email exists
    cursor.execute("SELECT user_id FROM USERS WHERE email = ?", (data['email'],))
    if cursor.fetchone():
        conn.close()
        return json_response(message="Email already registered", status=409)

    hashed_pw = hash_password(data['password'])
    
    # Insert User
    try:
        cursor.execute("""
            INSERT INTO USERS (first_name, last_name, email, phone, date_of_birth, password_hash, user_type, kyc_status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            data['first_name'], 
            data['last_name'], 
            data['email'], 
            data.get('phone', ''),
            data.get('date_of_birth'), # Should be YYYY-MM-DD
            hashed_pw,
            'customer', # Default to customer
            'pending',
            datetime.now()
        ))
        conn.commit()
        
        # Log Action
        new_user_id = cursor.execute("SELECT @@IDENTITY").fetchone()[0]
        cursor.execute("INSERT INTO AUDIT_LOG (user_id, action, action_timestamp, ip_address) VALUES (?, ?, ?, ?)",
                       (new_user_id, 'signup', datetime.now(), request.remote_addr))
        conn.commit()
        
    except Exception as e:
        conn.rollback()
        conn.close()
        return json_response(message=f"Database error: {str(e)}", status=500)

    conn.close()
    return json_response(message="User registered successfully", status=201)

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    if not data or not data.get('email') or not data.get('password'):
        return json_response(message="Email and password required", status=400)

    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT user_id, password_hash, user_type, first_name, last_name FROM USERS WHERE email = ?", (data['email'],))
    user = cursor.fetchone()
    
    if user and verify_password(user.password_hash, data['password']):
        token = generate_token(user.user_id, user.user_type)
        
        # Log Login
        cursor.execute("INSERT INTO AUDIT_LOG (user_id, action, action_timestamp, ip_address) VALUES (?, ?, ?, ?)",
                       (user.user_id, 'login', datetime.now(), request.remote_addr))
        conn.commit()
        conn.close()
        
        return json_response(message="Login successful", data={
            "token": token,
            "user_type": user.user_type,
            "name": f"{user.first_name} {user.last_name}"
        })
    
    conn.close()
    return json_response(message="Invalid credentials", status=401)

@auth_bp.route('/logout', methods=['POST'])
def logout():
    # Client-side token removal. Server doesn't track blacklisting in this simple version.
    return json_response(message="Logged out successfully")

@auth_bp.route('/verify', methods=['GET'])
@token_required
def verify_token():
    return json_response(message="Token is valid", data={"user_id": g.user_id, "user_type": g.user_type})
