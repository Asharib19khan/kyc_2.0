import os
import pypyodbc as pyodbc
from database.db_connection import get_db_connection

def init_db():
    conn = get_db_connection()
    if not conn:
        print("Failed to connect to database. Ensure .accdb file exists.")
        return

    cursor = conn.cursor()
    
    # Read schema
    schema_path = os.path.join(os.path.dirname(__file__), 'schema.sql')
    with open(schema_path, 'r') as f:
        schema_sql = f.read()

    # Split by semicolon and execute
    commands = schema_sql.split(';')
    
    for command in commands:
        command = command.strip()
        if command:
            try:
                cursor.execute(command)
                conn.commit()
                print(f"Executed: {command[:50]}...")
            except pyodbc.Error as e:
                # Ignore if table already exists (simple check for now)
                # pypyodbc error messages might slightly differ, but string check usually works
                if "already exists" in str(e).lower() or "exists" in str(e).lower():
                    print(f"Table already exists, skipping.")
                else:
                    print(f"Error executing command: {e}")

    print("Database initialized.")
    conn.close()

if __name__ == '__main__':
    # Can be run directly to init db
    init_db()
