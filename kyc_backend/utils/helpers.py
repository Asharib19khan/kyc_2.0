from flask import jsonify

def json_response(data=None, message="", status=200):
    """Standardized JSON response."""
    response = {
        "status": "success" if 200 <= status < 300 else "error",
        "message": message,
        "data": data
    }
    return jsonify(response), status
