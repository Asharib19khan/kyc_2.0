import pypyodbc as pyodbc
from config import Config

def get_db_connection():
    try:
        conn = pyodbc.connect(Config.DB_CONNECTION_STRING)
        return conn
    except pyodbc.Error as e:
        print(f"Error connecting to database: {e}")
        return None
