import pyodbc
import datetime
import os
import security

# CONFIG
DB_FILE = os.path.join(os.path.dirname(__file__), 'db', 'kyc.accdb')
CONN_STR = r'DRIVER={Microsoft Access Driver (*.mdb, *.accdb)};DBQ=' + DB_FILE + ';'

def connect_db():
    try:
        return pyodbc.connect(CONN_STR)
    except Exception as e:
        print(f"Error connecting to database: {e}")
        return None

# --- AUDIT LOG ---
def log_audit(user_id, action, ip_address='0.0.0.0'):
    conn = connect_db()
    if not conn: return
    try:
        cursor = conn.cursor()
        sql = "INSERT INTO AUDIT_LOG (user_id, action, action_timestamp, ip_address) VALUES (?, ?, ?, ?)"
        cursor.execute(sql, (user_id, action, datetime.datetime.now(), ip_address))
        conn.commit()
    except Exception as e:
        print(f"Audit Error: {e}")
    finally:
        conn.close()

# --- USERS ---
def register_user(first_name, last_name, email, phone, dob, password):
    conn = connect_db()
    if not conn: return False
    cursor = conn.cursor()
    try:
        # Check if email exists
        cursor.execute("SELECT user_id FROM USERS WHERE email = ?", (email,))
        if cursor.fetchone():
            return False 
        
        # Hash Password
        hashed_pw = security.hash_password(password)

        sql = """INSERT INTO USERS (first_name, last_name, email, phone, date_of_birth, password_hash, user_type, kyc_status, created_at) 
                 VALUES (?, ?, ?, ?, ?, ?, 'customer', 'pending', ?)"""
        cursor.execute(sql, (first_name, last_name, email, phone, dob, hashed_pw, datetime.datetime.now()))
        conn.commit()
        
        # Get new ID for audit
        cursor.execute("SELECT @@IDENTITY")
        row = cursor.fetchone()
        if row: log_audit(row[0], 'signup')
        
        return True
    except Exception as e:
        print(f"Register Error: {e}")
        return False
    finally:
        conn.close()

def login_user(email, password):
    conn = connect_db()
    if not conn: return None
    cursor = conn.cursor()
    try:
        # Fetch user by email only
        cursor.execute("""SELECT user_id, first_name, last_name, user_type, kyc_status, password_hash 
                          FROM USERS WHERE email = ?""", (email,))
        row = cursor.fetchone()
        if row:
            stored_hash = row[5]
            if security.verify_password(stored_hash, password):
                user_data = {"id": row[0], "name": f"{row[1]} {row[2]}", "role": row[3], "status": row[4]}
                log_audit(row[0], 'login')
                return user_data
        return None
    except Exception as e:
        print(f"Login Error: {e}")
        return None
    except Exception as e:
        print(f"Login Error: {e}")
        return None
    finally:
        conn.close()

# --- SUPER ADMIN FUNCTIONS ---
def get_all_admins():
    conn = connect_db()
    if not conn: return []
    cursor = conn.cursor()
    admins = []
    try:
        cursor.execute("SELECT user_id, first_name, last_name, email FROM USERS WHERE user_type = 'admin'")
        for row in cursor.fetchall():
            admins.append({"id": row[0], "name": f"{row[1]} {row[2]}", "email": row[3]})
    finally:
        conn.close()
    return admins

def create_admin(first_name, last_name, email, password):
    conn = connect_db()
    if not conn: return False
    cursor = conn.cursor()
    try:
        # Check if email exists
        cursor.execute("SELECT user_id FROM USERS WHERE email = ?", (email,))
        if cursor.fetchone(): return False

        hashed_pw = security.hash_password(password)
        sql = """INSERT INTO USERS (first_name, last_name, email, password_hash, user_type, kyc_status, created_at) 
                 VALUES (?, ?, ?, ?, 'admin', 'verified', ?)"""
        cursor.execute(sql, (first_name, last_name, email, hashed_pw, datetime.datetime.now()))
        conn.commit()
        return True
    except:
        return False
    finally:
        conn.close()

def delete_admin(admin_id):
    conn = connect_db()
    if not conn: return False
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM USERS WHERE user_id = ? AND user_type = 'admin'", (admin_id,))
        conn.commit()
        return True
    except:
        return False
    finally:
        conn.close()

# --- DOCUMENTS ---
def upload_document(user_id, doc_type, doc_number, expiry, filepath):
    conn = connect_db()
    if not conn: return False
    cursor = conn.cursor()
    try:
        # Encrypt Document Number
        encrypted_num = security.encrypt_value(doc_number)
        
        sql = """INSERT INTO DOCUMENTS (user_id, document_type, document_number, expiry_date, document_image_path, upload_date, verification_status)
                 VALUES (?, ?, ?, ?, ?, ?, 'pending')"""
        cursor.execute(sql, (user_id, doc_type, encrypted_num, expiry, filepath, datetime.datetime.now()))
        conn.commit()
        log_audit(user_id, 'document_upload')
        return True
    except Exception as e:
        print(f"Doc Upload Error: {e}")
        return False
    finally:
        conn.close()

def get_user_documents(user_id):
    conn = connect_db()
    if not conn: return []
    cursor = conn.cursor()
    docs = []
    try:
        cursor.execute("SELECT document_type, document_number, verification_status, upload_date, document_image_path FROM DOCUMENTS WHERE user_id = ?", (user_id,))
        for row in cursor.fetchall():
            decrypted_num = security.decrypt_value(row[1])
            docs.append({
                "type": row[0],
                "number": decrypted_num,
                "status": row[2],
                "date": str(row[3]),
                "path": row[4]
            })
    finally:
        conn.close()
    return docs

# --- VERIFICATIONS (Updated for Unified Users) ---
def get_verification_requests():
    conn = connect_db()
    if not conn: return []
    cursor = conn.cursor()
    requests = []
    try:
        # Get users with documents pending? Or just users who are pending?
        # Let's show users who are pending.
        cursor.execute("SELECT user_id, first_name, last_name, email, phone, kyc_status, created_at FROM USERS WHERE kyc_status = 'pending' AND user_type = 'customer'")
        for row in cursor.fetchall():
            # Get docs for this user
            user_id = row[0]
            docs = get_user_documents(user_id)
            requests.append({
                "user_id": user_id,
                "name": f"{row[1]} {row[2]}",
                "email": row[3],
                "phone": row[4],
                "status": row[5],
                "created_at": str(row[6]),
                "documents": docs
            })
    finally:
        conn.close()
    return requests

def verify_user_status(admin_id, target_user_id, action):
    conn = connect_db()
    if not conn: return False
    cursor = conn.cursor()
    new_status = 'verified' if action == 'approve' else 'rejected'
    try:
        # Update User Status
        cursor.execute("UPDATE USERS SET kyc_status = ?, verified_by = ? WHERE user_id = ?", (new_status, admin_id, target_user_id))
        
        # Also update Document statuses? Assuming all Approved if User Approved for simplicity
        doc_status = 'verified' if action == 'approve' else 'rejected'
        cursor.execute("UPDATE DOCUMENTS SET verification_status = ? WHERE user_id = ?", (doc_status, target_user_id))
        
        conn.commit()
        log_audit(admin_id, f'kyc_{action}_user_{target_user_id}')
        return True
    except Exception as e:
        print(f"Verify Error: {e}")
        return False
    finally:
        conn.close()

# --- LOANS (Updated for LOAN_APPLICATIONS) ---
def create_loan_request(user_id, amount, term, purpose):
    conn = connect_db()
    if not conn: return False
    cursor = conn.cursor()
    try:
        sql = """INSERT INTO LOAN_APPLICATIONS (user_id, loan_amount, tenure_months, loan_purpose, application_status, application_date)
                 VALUES (?, ?, ?, ?, 'pending', ?)"""
        cursor.execute(sql, (user_id, amount, term, purpose, datetime.datetime.now()))
        conn.commit()
        log_audit(user_id, 'loan_request')
        return True
    except Exception as e:
        print(f"Loan Error: {e}")
        return False
    finally:
        conn.close()

def get_all_loan_requests(status_filter='pending'):
    conn = connect_db()
    if not conn: return []
    cursor = conn.cursor()
    loans = []
    try:
        sql = """SELECT L.loan_id, L.loan_amount, L.tenure_months, L.loan_purpose, L.application_status, L.application_date, 
                        U.first_name, U.last_name, U.email, U.phone
                 FROM LOAN_APPLICATIONS L INNER JOIN USERS U ON L.user_id = U.user_id"""
        if status_filter:
            sql += f" WHERE L.application_status = '{status_filter}'"
            
        cursor.execute(sql)
        for row in cursor.fetchall():
            loans.append({
                "loan_id": row[0],
                "amount": row[1],
                "term": row[2],
                "purpose": row[3],
                "status": row[4],
                "applied_at": str(row[5]),
                "customer_name": f"{row[6]} {row[7]}",
                "email": row[8],
                "phone": row[9]
            })
    finally:
        conn.close()
    return loans

def get_customer_loans(user_id):
    conn = connect_db()
    if not conn: return []
    cursor = conn.cursor()
    loans = []
    try:
        cursor.execute("""SELECT loan_id, loan_amount, tenure_months, loan_purpose, application_status, application_date 
                          FROM LOAN_APPLICATIONS WHERE user_id = ?""", (user_id,))
        for row in cursor.fetchall():
            loans.append({
                "loan_id": row[0],
                "amount": row[1],
                "term": row[2],
                "purpose": row[3],
                "status": row[4],
                "applied_at": str(row[5])
            })
    finally:
        conn.close()
    return loans

def update_loan_decision(loan_id, decision, admin_id, pdf_path):
    conn = connect_db()
    if not conn: return None
    cursor = conn.cursor()
    new_status = 'approved' if decision == 'approve' else 'rejected'
    try:
        sql = """UPDATE LOAN_APPLICATIONS 
                 SET application_status = ?, approved_by = ?, approval_date = ?, pdf_document_path = ? 
                 WHERE loan_id = ?"""
        cursor.execute(sql, (new_status, admin_id, datetime.datetime.now(), pdf_path, loan_id))
        conn.commit()
        log_audit(admin_id, f'loan_{decision}_{loan_id}')
        
        # Fetch details for PDF return (if needed immediately) or logic outside
        # Existing logic fetches details inside update? Let's just return details needed for PDF generation BEFORE update? 
        # Actually logic is: update DB then generate PDF?
        # Warning: Prompt said "updates Access + generates PDF... store pdf_document_path".
        # So I need to generate PDF *first* to get path, or update path *after*?
        # Let's fetch details -> return them -> App generates PDF -> App updates DB with path? 
        # Simpler: This function updates status. App generates PDF. App calls another DB update? 
        # Or I do it all here given I passed pdf_path?
        return True
    except Exception as e:
        print(f"Update Loan Error: {e}")
        return False
    finally:
        conn.close()

def get_loan_details(loan_id):
    conn = connect_db()
    if not conn: return None
    cursor = conn.cursor()
    try:
        sql = """SELECT L.loan_id, L.loan_amount, L.tenure_months, L.loan_purpose, L.application_status, 
                        U.first_name, U.last_name, U.email, U.phone
                 FROM LOAN_APPLICATIONS L INNER JOIN USERS U ON L.user_id = U.user_id
                 WHERE L.loan_id = ?"""
        cursor.execute(sql, (loan_id,))
        row = cursor.fetchone()
        if row:
            return {
                "loan_id": row[0],
                "amount": row[1],
                "term": row[2],
                "purpose": row[3],
                "status": row[4],
                "customer": f"{row[5]} {row[6]}",
                "email": row[7],
                "phone": row[8]
            }
        return None
    finally:
        conn.close()

def get_export_data():
    conn = connect_db()
    if not conn: return {}, {}
    cursor = conn.cursor()
    
    verifications = []
    cursor.execute("SELECT user_id, first_name, last_name, email, kyc_status, created_at FROM USERS")
    cols_v = [column[0] for column in cursor.description]
    for row in cursor.fetchall():
        verifications.append(dict(zip(cols_v, row)))
        
    loans = []
    cursor.execute("""SELECT L.loan_id, U.email, L.loan_amount, L.tenure_months, L.application_status, L.application_date 
                      FROM LOAN_APPLICATIONS L INNER JOIN USERS U ON L.user_id = U.user_id""")
    cols_l = [column[0] for column in cursor.description]
    for row in cursor.fetchall():
        loans.append(dict(zip(cols_l, row)))
        
    conn.close()
    return verifications, loans
