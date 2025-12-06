from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import db
import reports
import os
import base64
import time
import werkzeug.utils

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'uploads')
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

# Helper for simple token
def generate_token(role, username, user_id):
    token_str = f"{role}:{username}:{user_id}:{time.time()}"
    return base64.b64encode(token_str.encode()).decode()

def parse_token(token):
    try:
        decoded = base64.b64decode(token).decode()
        parts = decoded.split(":")
        # Format: role:username:userid:timestamp
        if len(parts) >= 3:
            return parts[0], parts[1], parts[2]
        return None, None, None
    except:
        return None, None, None

def require_auth(role_required=None):
    auth_header = request.headers.get('Authorization')
    if not auth_header: return False
    token = auth_header.split(" ")[1] if " " in auth_header else auth_header
    role, username, user_id = parse_token(token)
    if not role: return False
    if role_required and role != role_required: return False
    return {"role": role, "username": username, "user_id": int(user_id)}

@app.route('/register', methods=['POST'])
def register():
    data = request.json
    # Expected: first, last, email, phone, dob, password
    success = db.register_user(data['first_name'], data['last_name'], data['email'], data['phone'], data.get('dob'), data['password'])
    if success:
        return jsonify({"success": True, "message": "Registered successfully. Please wait for verification."})
    return jsonify({"success": False, "message": "Email already exists or error occured."}), 400

@app.route('/login', methods=['POST'])
def login():
    data = request.json
    user = db.login_user(data['email'], data['password']) 
    if user:
        token = generate_token(user['role'], user['name'], user['id'])
        return jsonify({"success": True, "token": token, "user": user})
    return jsonify({"success": False, "message": "Invalid credentials"}), 401

@app.route('/super/admins', methods=['GET'])
def get_admins():
    if not require_auth('super_admin'): return jsonify({"success": False}), 403
    admins = db.get_all_admins()
    return jsonify({"success": True, "data": admins})

@app.route('/super/add-admin', methods=['POST'])
def add_admin():
    if not require_auth('super_admin'): return jsonify({"success": False}), 403
    data = request.json
    success = db.create_admin(data['first_name'], data['last_name'], data['email'], data['password'])
    return jsonify({"success": success})

@app.route('/super/delete-admin', methods=['POST'])
def delete_admin():
    if not require_auth('super_admin'): return jsonify({"success": False}), 403
    data = request.json
    success = db.delete_admin(data['admin_id'])
    return jsonify({"success": success})

@app.route('/upload-document', methods=['POST'])
def upload_document():
    user_info = require_auth('customer')
    if not user_info: return jsonify({"success": False}), 403
    
    if 'file' not in request.files: return jsonify({"success": False, "message": "No file"}), 400
    file = request.files['file']
    doc_type = request.form.get('doc_type')
    doc_number = request.form.get('doc_number')
    expiry = request.form.get('expiry')
    
    if file:
        filename = werkzeug.utils.secure_filename(f"{user_info['user_id']}_{doc_type}_{file.filename}")
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        file.save(filepath)
        
        # Save to DB
        # Store relative path or just filename. Storing filename for simplicity.
        success = db.upload_document(user_info['user_id'], doc_type, doc_number, expiry, filename)
        if success:
            return jsonify({"success": True})
    return jsonify({"success": False, "message": "Upload failed"})

@app.route('/admin/verification-requests', methods=['GET'])
def verification_requests():
    if not require_auth('admin'): return jsonify({"success": False}), 403
    reqs = db.get_verification_requests()
    return jsonify({"success": True, "data": reqs})

@app.route('/admin/verify', methods=['POST'])
def verify_user():
    user_info = require_auth('admin')
    if not user_info: return jsonify({"success": False}), 403
    data = request.json
    success = db.verify_user_status(user_info['user_id'], data['user_id'], data['action']) 
    return jsonify({"success": success})

@app.route('/customer/apply-loan', methods=['POST'])
def apply_loan():
    user_info = require_auth('customer')
    if not user_info: return jsonify({"success": False}), 403
    data = request.json
    success = db.create_loan_request(user_info['user_id'], data['amount'], data['term'], data['purpose'])
    return jsonify({"success": success})

@app.route('/admin/loan-requests', methods=['GET'])
def loan_requests():
    if not require_auth('admin'): return jsonify({"success": False}), 403
    requests = db.get_all_loan_requests(status_filter='pending')
    return jsonify({"success": True, "data": requests})

@app.route('/admin/loan-decision', methods=['POST'])
def loan_decision():
    user_info = require_auth('admin')
    if not user_info: return jsonify({"success": False}), 403
    data = request.json
    
    # 1. Get Loan Details for PDF
    loan_details = db.get_loan_details(data['loan_id'])
    if not loan_details: return jsonify({"success": False}), 400
    
    # Add decision info to details (since it's not in DB yet)
    loan_details['status'] = 'approved' if data['decision'] == 'approve' else 'rejected'
    loan_details['admin'] = user_info['username']
    loan_details['decided_at'] = str(datetime.datetime.now())
    
    # 2. Generate PDF
    pdf_filename = reports.generate_loan_pdf(loan_details)
    
    # 3. Update DB with decision and PDF path
    result = db.update_loan_decision(data['loan_id'], data['decision'], user_info['user_id'], pdf_filename)
    
    if result:
        download_url = f"/download-pdf/{pdf_filename}"
        return jsonify({"success": True, "download_url": download_url})
    return jsonify({"success": False, "message": "Error updating loan"})

@app.route('/customer/loans', methods=['GET'])
def customer_loans():
    user_info = require_auth('customer')
    if not user_info: return jsonify({"success": False}), 403
    loans = db.get_customer_loans(user_info['user_id'])
    return jsonify({"success": True, "data": loans})

@app.route('/export/excel', methods=['GET'])
def export_excel():
    if not require_auth('admin'): return jsonify({"success": False}), 403
    verifications, loans = db.get_export_data()
    filename = reports.generate_excel_report(verifications, loans)
    return jsonify({"success": True, "download_url": f"/download-report/{filename}"})

@app.route('/download-pdf/<filename>')
def download_pdf(filename):
    return send_from_directory('admin_exports', filename)

@app.route('/download-report/<filename>')
def download_report(filename):
    return send_from_directory('reports', filename)

@app.route('/uploads/<filename>')
def serve_upload(filename):
    # Only admin should see uploads? Or verified user.
    # Authorization needed? For simplicity, public or check token.
    # Let's simple check token presence.
    if not request.headers.get('Authorization'): return "Unauthorized", 403
    return send_from_directory('uploads', filename)

if __name__ == '__main__':
    app.run(debug=True, port=5000)
