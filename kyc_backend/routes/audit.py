from flask import Blueprint
from database.db_connection import get_db_connection
from middleware.auth import token_required, admin_required
from utils.helpers import json_response

audit_bp = Blueprint('audit', __name__)

@audit_bp.route('/logs', methods=['GET'])
@token_required
@admin_required
def get_audit_logs():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT TOP 50 log_id, user_id, action, action_timestamp, ip_address 
        FROM AUDIT_LOG 
        ORDER BY action_timestamp DESC
    """)
    # Note: TOP 50 is MS Access specific.
    
    logs = []
    for row in cursor.fetchall():
        logs.append({
            "log_id": row.log_id,
            "user_id": row.user_id,
            "action": row.action,
            "timestamp": str(row.action_timestamp),
            "ip": row.ip_address
        })
    conn.close()
    return json_response(data=logs)
