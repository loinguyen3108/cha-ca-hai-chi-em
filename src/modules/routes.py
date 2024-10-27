from flask import Blueprint, redirect, render_template, request, url_for
from flask_login import current_user, login_required, login_user, logout_user

from src.services.user import UserService

blueprint = Blueprint('ChaCa', __name__, template_folder='templates')

user_service = UserService()


@blueprint.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        if not (username and password):
            return 'Username and password are required!', 400

        user = user_service.get_user_by_username(username)
        if not user or not user.check_password(password):
            return 'Invalid username or password!', 400

        login_user(user)
        return redirect(url_for('ChaCa.index'))
    return render_template('login.html')


@blueprint.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        if not (username and password):
            return 'Username and password are required!', 400

        if user_service.get_user_by_username(username):
            return 'User already exists!', 400

        user_service.create_user(username, password)
        return redirect(url_for('ChaCa.login'))

    return render_template('register.html')


@blueprint.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('ChaCa.login'))


@blueprint.route('/', methods=['GET'])
@login_required
def index():
    return render_template('index.html', username=current_user.username)
