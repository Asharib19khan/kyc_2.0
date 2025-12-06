import db
import security
import sys

def change_password(email, new_password):
    print(f"Updating password for {email}...")
    conn = db.connect_db()
    if not conn: return
    try:
        cursor = conn.cursor()
        # Verify user exists first
        cursor.execute("SELECT user_id, user_type FROM USERS WHERE email = ?", (email,))
        row = cursor.fetchone()
        if not row:
            print("User not found.")
            return

        new_hash = security.hash_password(new_password)
        cursor.execute("UPDATE USERS SET password_hash = ? WHERE email = ?", (new_hash, email))
        conn.commit()
        print("Password updated successfully.")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        conn.close()

def delete_user(email):
    print(f"Deleting user {email}...")
    conn = db.connect_db()
    if not conn: return
    try:
        cursor = conn.cursor()
        # Get ID
        cursor.execute("SELECT user_id FROM USERS WHERE email = ?", (email,))
        row = cursor.fetchone()
        if not row:
            print("User not found.")
            return
        
        user_id = row[0]
        
        # Delete related data first (Foreign Keys)
        cursor.execute("DELETE FROM DOCUMENTS WHERE user_id = ?", (user_id,))
        cursor.execute("DELETE FROM LOAN_APPLICATIONS WHERE user_id = ?", (user_id,))
        cursor.execute("DELETE FROM AUDIT_LOG WHERE user_id = ?", (user_id,))
        
        # Delete User
        cursor.execute("DELETE FROM USERS WHERE user_id = ?", (user_id,))
        conn.commit()
        print(f"User {email} and all related data deleted.")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage:")
        print("  python manage.py passwd <email> <new_password>")
        print("  python manage.py delete <email>")
        print("  python manage.py update-admin <email> <new_first> <new_last>")
        sys.exit(1)
        
    action = sys.argv[1]
    
    if action == 'passwd' and len(sys.argv) == 4:
        change_password(sys.argv[2], sys.argv[3])
    elif action == 'delete' and len(sys.argv) == 3:
        delete_user(sys.argv[2])
    else:
        print("Invalid arguments.")
