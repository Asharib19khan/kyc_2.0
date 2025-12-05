import jwt
import datetime
from functools import wraps
from flask import request, g
from config import Config
from utils.helpers import json_response

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            if auth_header.startswith("Bearer "):
                token = auth_header.split(" ")[1]
        
        if not token:
            return json_response(message="Token is missing", status=401)
        
        try:
            data = jwt.decode(token, Config.SECRET_KEY, algorithms=["HS256"])
            g.user_id = data['user_id']
            g.user_type = data['user_type']
        except jwt.ExpiredSignatureError:
            return json_response(message="Token has expired", status=401)
        except jwt.InvalidTokenError:
            return json_response(message="Token is invalid", status=401)
            
        return f(*args, **kwargs)
    
    return decorated

def admin_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if not hasattr(g, 'user_type') or g.user_type != 'admin':
            return json_response(message="Admin privilege required", status=403)
        return f(*args, **kwargs)
    return decorated

def generate_token(user_id, user_type):
    payload = {
        'user_id': user_id,
        'user_type': user_type,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(minutes=Config.JWT_EXPIRATION_MINUTES)
    }
    return jwt.encode(payload, Config.SECRET_KEY, algorithm="HS256")
