from flask import Flask
from flask_login import LoginManager

from src.default import SQLALCHEMY_DATABASE_URI
from src.modules.routes import blueprint
from src.services.user import UserService

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = SQLALCHEMY_DATABASE_URI
app.config['SECRET_KEY'] = 'your_secret_key'

login_manager = LoginManager(app)
login_manager.login_view = 'ChaCa.login'
app.register_blueprint(blueprint)

user_service = UserService()


@login_manager.user_loader
def load_user(user_id):
    user = user_service.get_user_by_id(int(user_id))
    return user
