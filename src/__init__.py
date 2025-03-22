from flask import Flask, jsonify
from flask_login import LoginManager
from flask_cors import CORS

from src.default import FRONTEND_URL
from src.models.user import User
from src.services.user import UserService

login_manager = LoginManager()
user_service = UserService()

@login_manager.user_loader
def load_user(user_id):
    return user_service.get_user_by_id(user_id)

def create_app(config_filename=None):
    app = Flask(__name__)
    
    # Configure CORS globally
    CORS(app, 
         origins=[FRONTEND_URL],
         supports_credentials=True,
         allow_headers=["Content-Type", "Authorization"],
         expose_headers=["Set-Cookie"],
         methods=["GET", "POST", "OPTIONS"])
    
    if config_filename:
        app.config.from_pyfile(config_filename)
    else:
        # Set a default secret key if no config file is provided
        app.config['SECRET_KEY'] = 'your-secret-key-here'  # Change this in production
        
    # Configure session handling
    app.config['SESSION_COOKIE_SECURE'] = False  # Set to True in production with HTTPS
    app.config['SESSION_COOKIE_HTTPONLY'] = True
    app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
    app.config['PERMANENT_SESSION_LIFETIME'] = 30 * 24 * 3600  # 30 days
    app.config['REMEMBER_COOKIE_SECURE'] = False  # Set to True in production
    app.config['REMEMBER_COOKIE_HTTPONLY'] = True
    app.config['REMEMBER_COOKIE_DURATION'] = 30 * 24 * 3600  # 30 days
    app.config['REMEMBER_COOKIE_SAMESITE'] = 'Lax'
    app.config['SESSION_PERMANENT'] = True  # Make sessions permanent by default
    
    login_manager.init_app(app)
    login_manager.login_view = None  # Disable default redirect
    
    # Handle unauthorized access
    @login_manager.unauthorized_handler
    def unauthorized():
        return jsonify({
            'success': False,
            'message': 'Unauthorized access',
            'user': None,
            'isAuthenticated': False
        }), 401
    
    # Register blueprints
    from src.modules.routes import blueprint as routes_blueprint
    app.register_blueprint(routes_blueprint, url_prefix='/api/v1')
    
    return app
