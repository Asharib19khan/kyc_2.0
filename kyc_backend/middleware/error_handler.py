from flask import jsonify
from werkzeug.exceptions import HTTPException
from utils.helpers import json_response

def register_error_handlers(app):
    @app.errorhandler(Exception)
    def handle_exception(e):
        if isinstance(e, HTTPException):
            return json_response(message=e.description, status=e.code)
        
        # Log error in production
        print(f"Internal Server Error: {e}")
        return json_response(message="Internal Server Error", status=500)
