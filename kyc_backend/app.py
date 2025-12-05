from flask import Flask
from flask_cors import CORS
from config import Config
from middleware.error_handler import register_error_handlers
from database.models import init_db

# Import routes
from routes.auth import auth_bp
from routes.kyc import kyc_bp
from routes.loans import loans_bp
from routes.admin import admin_bp
from routes.audit import audit_bp

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    
    # Enable CORS
    CORS(app, resources={r"/api/*": {"origins": "*"}})
    
    # Error Handlers
    register_error_handlers(app)
    
    # Register Blueprints
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(kyc_bp, url_prefix='/api/kyc')
    app.register_blueprint(loans_bp, url_prefix='/api/loans')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    app.register_blueprint(audit_bp, url_prefix='/api/audit')
    
    @app.route('/api/health')
    def health_check():
        return {"status": "ok", "app": "KYC Loan System Backend"}
        
    return app

if __name__ == '__main__':
    # Initialize DB (optional, better to run script manually but good for dev)
    try:
        init_db()
    except Exception as e:
        print(f"DB Init warning: {e}")
        
    app = create_app()
    app.run(debug=True, port=5000)
