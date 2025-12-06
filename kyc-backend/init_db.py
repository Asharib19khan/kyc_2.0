import pyodbc
import os
import security

DB_FILE = os.path.join(os.path.dirname(__file__), 'db', 'kyc.accdb')
CONN_STR = r'DRIVER={Microsoft Access Driver (*.mdb, *.accdb)};DBQ=' + DB_FILE + ';'

def init_db():
    if not os.path.exists(os.path.dirname(DB_FILE)):
        os.makedirs(os.path.dirname(DB_FILE))
        
    # We remove the check for DB_FILE existence because we might want to reset/re-init if corrupted or updating schema.
    # But usually init_db handles creation if missing.
    if not os.path.exists(DB_FILE):
        print(f"Creating new database file at {DB_FILE}...")
        # PyODBC cannot CREATE the .accdb file itself easily without COM or template.
        # But user typically provides empty file. 
        # Actually user instructions said create empty file. 
        # Just warn if confirmed missing.
        print(f"WARNING: Database file {DB_FILE} not found (if not created by Access).")
    
    try:
        conn = pyodbc.connect(CONN_STR)
        cursor = conn.cursor()
        
        # CLEANUP OLD TABLES
        tables = ['AUDIT_LOG', 'LOAN_APPLICATIONS', 'LoanRequests', 'DOCUMENTS', 'USERS', 'Users', 'Admins']
        print("Cleaning up old tables...")
        for table in tables:
            try:
                cursor.execute(f"DROP TABLE {table}")
                conn.commit()
                print(f"Dropped {table}")
            except:
                pass

        # 1. USERS (Unified)
        try:
            cursor.execute("""
                CREATE TABLE USERS (
                    user_id COUNTER PRIMARY KEY,
                    first_name VARCHAR(50),
                    last_name VARCHAR(50),
                    email VARCHAR(100) UNIQUE,
                    phone VARCHAR(20),
                    date_of_birth DATETIME,
                    password_hash VARCHAR(255),
                    user_type VARCHAR(20),
                    kyc_status VARCHAR(20),
                    created_at DATETIME,
                    verified_by INT
                )
            """)
            print("USERS table created.")
            
            # Seed Super Admin
            hashed_super_pw = security.hash_password('mywordislaw')
            
            cursor.execute("""
                INSERT INTO USERS (first_name, last_name, email, password_hash, user_type, kyc_status, created_at) 
                VALUES ('Super', 'Admin', 'super', ?, 'super_admin', 'verified', NOW())
            """, (hashed_super_pw,))
            conn.commit()
            print("Seeded super admin user.")
            conn.commit()
            print("Seeded admin user.")
        except Exception as e: 
            print(f"USERS table creation error: {e}")

        # 2. DOCUMENTS
        try:
            cursor.execute("""
                CREATE TABLE DOCUMENTS (
                    document_id COUNTER PRIMARY KEY,
                    user_id INT,
                    document_type VARCHAR(50),
                    document_number VARCHAR(50),
                    expiry_date DATETIME,
                    document_image_path VARCHAR(255),
                    upload_date DATETIME,
                    verification_status VARCHAR(20)
                )
            """)
            print("DOCUMENTS table created.")
        except Exception as e: print(f"DOCUMENTS creation error: {e}")

        # 3. LOAN_APPLICATIONS
        try:
            cursor.execute("""
                CREATE TABLE LOAN_APPLICATIONS (
                    loan_id COUNTER PRIMARY KEY,
                    user_id INT,
                    loan_amount CURRENCY,
                    loan_purpose VARCHAR(255),
                    tenure_months INT,
                    application_status VARCHAR(20),
                    application_date DATETIME,
                    approved_by INT,
                    approval_date DATETIME,
                    pdf_document_path VARCHAR(255)
                )
            """)
            print("LOAN_APPLICATIONS table created.")
        except Exception as e: print(f"LOAN_APPLICATIONS creation error: {e}")

        # 4. AUDIT_LOG
        try:
            cursor.execute("""
                CREATE TABLE AUDIT_LOG (
                    log_id COUNTER PRIMARY KEY,
                    user_id INT,
                    action VARCHAR(50),
                    action_timestamp DATETIME,
                    ip_address VARCHAR(50)
                )
            """)
            print("AUDIT_LOG table created.")
        except Exception as e: print(f"AUDIT_LOG creation error: {e}")

        conn.close()
        print("Database initialized successfully.")
    except Exception as e:
        print(f"Error initializing DB: {e}")

if __name__ == '__main__':
    init_db()
