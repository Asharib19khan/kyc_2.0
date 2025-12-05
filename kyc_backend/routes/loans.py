from flask import Blueprint, request, g
from database.db_connection import get_db_connection
from middleware.auth import token_required
from utils.helpers import json_response
from datetime import datetime

loans_bp = Blueprint('loans', __name__)

@loans_bp.route('/apply', methods=['POST'])
@token_required
def apply_loan():
    data = request.get_json()
    if not data:
        return json_response(message="Invalid data", status=400)
    
    amount = data.get('amount')
    purpose = data.get('purpose')
    interest = data.get('interest_rate', 15.0) # Default 15%
    tenure = data.get('tenure_months', 12)
    
    if not amount or not purpose:
        return json_response(message="Amount and purpose required", status=400)
        
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Check if user kyc is verified (optional business rule, enforcing here)
    cursor.execute("SELECT kyc_status FROM USERS WHERE user_id = ?", (g.user_id,))
    user = cursor.fetchone()
    if not user or user.kyc_status != 'verified':
        conn.close()
        return json_response(message="KYC verification required before applying for loan", status=403)
    
    try:
        cursor.execute("""
            INSERT INTO LOAN_APPLICATIONS (user_id, loan_amount, loan_purpose, interest_rate, tenure_months, application_status, application_date)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (g.user_id, amount, purpose, interest, tenure, 'pending', datetime.now()))
        conn.commit()
        
        # Log
        cursor.execute("INSERT INTO AUDIT_LOG (user_id, action, action_timestamp, ip_address) VALUES (?, ?, ?, ?)",
                       (g.user_id, 'loan_request', datetime.now(), request.remote_addr))
        conn.commit()
        
    except Exception as e:
        conn.rollback()
        conn.close()
        return json_response(message=f"Database error: {e}", status=500)
        
    conn.close()
    return json_response(message="Loan application submitted", status=201)

@loans_bp.route('/my-applications', methods=['GET'])
@token_required
def get_my_loans():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT loan_id, loan_amount, loan_purpose, application_status, application_date, pdf_document_path 
        FROM LOAN_APPLICATIONS WHERE user_id = ?
    """, (g.user_id,))
    
    loans = []
    for row in cursor.fetchall():
        loans.append({
            "loan_id": row.loan_id,
            "amount": float(row.loan_amount),
            "purpose": row.loan_purpose,
            "status": row.application_status,
            "date": str(row.application_date),
            "document_available": bool(row.pdf_document_path)
        })
    conn.close()
    return json_response(data=loans)

@loans_bp.route('/<int:loan_id>', methods=['GET'])
@token_required
def get_loan_details(loan_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT * FROM LOAN_APPLICATIONS WHERE loan_id = ? AND user_id = ?
    """, (loan_id, g.user_id))
    
    row = cursor.fetchone()
    conn.close()
    
    if row:
        return json_response(data={
            "loan_id": row.loan_id,
            "amount": float(row.loan_amount),
            "status": row.application_status,
            "interest": float(row.interest_rate),
            "tenure": row.tenure_months,
            "pdf_path": row.pdf_document_path
        })
        
    return json_response(message="Loan not found", status=404)
