from flask import Blueprint, request, g
from database.db_connection import get_db_connection
from middleware.auth import token_required, admin_required
from utils.helpers import json_response
from services.pdf_generator import generate_loan_decision_pdf
from datetime import datetime

admin_bp = Blueprint('admin', __name__)

@admin_bp.route('/pending-kyc', methods=['GET'])
@token_required
@admin_required
def get_pending_kyc():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT user_id, first_name, last_name, email, created_at 
        FROM USERS WHERE kyc_status = 'pending'
    """)
    users = []
    for row in cursor.fetchall():
        users.append({
            "user_id": row.user_id,
            "name": f"{row.first_name} {row.last_name}",
            "email": row.email,
            "joined": str(row.created_at)
        })
    conn.close()
    return json_response(data=users)

@admin_bp.route('/verify-kyc/<int:user_id>', methods=['POST'])
@token_required
@admin_required
def verify_kyc(user_id):
    data = request.get_json()
    action = data.get('action') # 'approve' or 'reject'
    
    if action not in ['approve', 'reject']:
        return json_response(message="Invalid action", status=400)
    
    status = 'verified' if action == 'approve' else 'rejected'
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("UPDATE USERS SET kyc_status = ?, verified_by = ? WHERE user_id = ?",
                       (status, g.user_id, user_id))
        
        # Verify docs as well? For simplicity, we just update user status.
        cursor.execute("UPDATE DOCUMENTS SET verification_status = ? WHERE user_id = ?",
                       (status, user_id))
                       
        conn.commit()
        
        # Log
        cursor.execute("INSERT INTO AUDIT_LOG (user_id, action, action_timestamp, ip_address) VALUES (?, ?, ?, ?)",
                       (g.user_id, f'kyc_{action}', datetime.now(), request.remote_addr))
        conn.commit()
        
    except Exception as e:
        conn.rollback()
        conn.close()
        return json_response(message=f"Error: {e}", status=500)
        
    conn.close()
    return json_response(message=f"KYC {status} successfully")

@admin_bp.route('/loan-requests', methods=['GET'])
@token_required
@admin_required
def get_loan_requests():
    conn = get_db_connection()
    cursor = conn.cursor()
    # Join with users to get name
    cursor.execute("""
        SELECT l.loan_id, l.loan_amount, l.loan_purpose, u.first_name, u.last_name, u.user_id 
        FROM LOAN_APPLICATIONS l
        JOIN USERS u ON l.user_id = u.user_id
        WHERE l.application_status = 'pending'
    """)
    loans = []
    for row in cursor.fetchall():
        loans.append({
            "loan_id": row.loan_id,
            "amount": float(row.loan_amount),
            "purpose": row.loan_purpose,
            "applicant": f"{row.first_name} {row.last_name}",
            "user_id": row.user_id
        })
    conn.close()
    return json_response(data=loans)

@admin_bp.route('/approve-loan/<int:loan_id>', methods=['POST'])
@token_required
@admin_required
def approve_loan(loan_id):
    return _process_loan(loan_id, 'approved')

@admin_bp.route('/reject-loan/<int:loan_id>', methods=['POST'])
@token_required
@admin_required
def reject_loan(loan_id):
    return _process_loan(loan_id, 'rejected')

def _process_loan(loan_id, status):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Get user details for PDF
    cursor.execute("""
        SELECT l.loan_amount, u.first_name, u.last_name 
        FROM LOAN_APPLICATIONS l
        JOIN USERS u ON l.user_id = u.user_id
        WHERE l.loan_id = ?
    """, (loan_id,))
    row = cursor.fetchone()
    
    if not row:
        conn.close()
        return json_response(message="Loan not found", status=404)
        
    pdf_path = generate_loan_decision_pdf(f"{row.first_name} {row.last_name}", loan_id, float(row.loan_amount), status)
    
    try:
        cursor.execute("""
            UPDATE LOAN_APPLICATIONS 
            SET application_status = ?, approved_by = ?, approval_date = ?, pdf_document_path = ?
            WHERE loan_id = ?
        """, (status, g.user_id, datetime.now(), pdf_path, loan_id))
        conn.commit()
        
        cursor.execute("INSERT INTO AUDIT_LOG (user_id, action, action_timestamp, ip_address) VALUES (?, ?, ?, ?)",
                       (g.user_id, f'loan_{status}', datetime.now(), request.remote_addr))
        conn.commit()
        
    except Exception as e:
        conn.rollback()
        conn.close()
        return json_response(message=f"Error: {e}", status=500)
        
    conn.close()
    return json_response(message=f"Loan {status} and PDF generated")

@admin_bp.route('/statistics', methods=['GET'])
@token_required
@admin_required
def get_stats():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    stats = {}
    
    cursor.execute("SELECT COUNT(*) FROM USERS WHERE user_type='customer'")
    stats['total_customers'] = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM LOAN_APPLICATIONS WHERE application_status='pending'")
    stats['pending_loans'] = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM USERS WHERE kyc_status='pending'")
    stats['pending_kyc'] = cursor.fetchone()[0]
    
    conn.close()
    return json_response(data=stats)
