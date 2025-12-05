import os
import uuid
from flask import Blueprint, request, g, current_app
from werkzeug.utils import secure_filename
from database.db_connection import get_db_connection
from middleware.auth import token_required
from utils.helpers import json_response
from config import Config
from datetime import datetime

kyc_bp = Blueprint('kyc', __name__)

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'pdf'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@kyc_bp.route('/status', methods=['GET'])
@token_required
def get_kyc_status():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT kyc_status, first_name, last_name FROM USERS WHERE user_id = ?", (g.user_id,))
    row = cursor.fetchone()
    conn.close()
    
    if row:
        return json_response(data={"kyc_status": row.kyc_status, "name": f"{row.first_name} {row.last_name}"})
    return json_response(message="User not found", status=404)

@kyc_bp.route('/upload-document', methods=['POST'])
@token_required
def upload_document():
    if 'document' not in request.files:
        return json_response(message="No file part", status=400)
    
    file = request.files['document']
    doc_type = request.form.get('document_type')
    doc_number = request.form.get('document_number') # Optional/Required depending on logic
    expiry = request.form.get('expiry_date') # YYYY-MM-DD
    
    if file.filename == '':
        return json_response(message="No selected file", status=400)
    
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        # Unique filename
        ext = filename.rsplit('.', 1)[1].lower()
        unique_filename = f"{g.user_id}_{uuid.uuid4().hex}.{ext}"
        
        save_path = os.path.join(Config.UPLOAD_FOLDER, unique_filename)
        # Ensure dir exists (sanity check)
        os.makedirs(Config.UPLOAD_FOLDER, exist_ok=True)
        file.save(save_path)
        
        conn = get_db_connection()
        cursor = conn.cursor()
        try:
            cursor.execute("""
                INSERT INTO DOCUMENTS (user_id, document_type, document_number, expiry_date, document_image_path, upload_date, verification_status)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (g.user_id, doc_type, doc_number, expiry, save_path, datetime.now(), 'pending'))
            conn.commit()
            
            # Log
            cursor.execute("INSERT INTO AUDIT_LOG (user_id, action, action_timestamp, ip_address) VALUES (?, ?, ?, ?)",
                           (g.user_id, 'document_upload', datetime.now(), request.remote_addr))
            conn.commit()
            
        except Exception as e:
            conn.rollback() 
            conn.close()
            # Clean up file
            if os.path.exists(save_path):
                os.remove(save_path)
            return json_response(message=f"Database error: {e}", status=500)
            
        conn.close()
        return json_response(message="Document uploaded successfully", status=201)
    
    return json_response(message="Invalid file type", status=400)

@kyc_bp.route('/documents', methods=['GET'])
@token_required
def get_documents():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT document_id, document_type, verification_status, upload_date FROM DOCUMENTS WHERE user_id = ?", (g.user_id,))
    
    documents = []
    for row in cursor.fetchall():
        documents.append({
            "document_id": row.document_id,
            "document_type": row.document_type,
            # "upload_date": row.upload_date.isoformat(), # Access dates can be tricky, let's keep it simple or convert string
            "upload_date": str(row.upload_date),
            "status": row.verification_status
        })
    conn.close()
    return json_response(data=documents)

@kyc_bp.route('/document/<int:doc_id>', methods=['DELETE'])
@token_required
def delete_document(doc_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Check ownership
    cursor.execute("SELECT document_image_path FROM DOCUMENTS WHERE document_id = ? AND user_id = ?", (doc_id, g.user_id))
    row = cursor.fetchone()
    
    if not row:
        conn.close()
        return json_response(message="Document not found or access denied", status=404)
    
    file_path = row.document_image_path
    
    try:
        cursor.execute("DELETE FROM DOCUMENTS WHERE document_id = ?", (doc_id,))
        conn.commit()
        # Delete file
        if os.path.exists(file_path):
            os.remove(file_path)
    except Exception as e:
        conn.rollback()
        conn.close()
        return json_response(message=f"Error deleting document: {e}", status=500)
        
    conn.close()
    return json_response(message="Document deleted")
