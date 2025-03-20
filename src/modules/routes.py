from logging import getLogger

from flask import Blueprint, flash, redirect, render_template, request, url_for, jsonify
from flask_login import current_user, login_required, login_user, logout_user

from src.services.user import UserService

blueprint = Blueprint('ChaCa', __name__, template_folder='templates')

user_service = UserService()
logger = getLogger(__name__)


@blueprint.route('/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    if not data:
        return jsonify({'message': 'No data provided'}), 400

    username = data.get('username')
    password = data.get('password')
    
    if not (username and password):
        return jsonify({'message': 'Username and password are required!'}), 400

    user = user_service.get_user_by_username(username)
    if not user or not user.check_password(password):
        return jsonify({
            'success': False,
            'message': 'Invalid username or password!',
            'isAuthenticated': False
        }), 401

    # Set permanent session
    login_user(user, remember=True)
    
    return jsonify({
        'success': True,
        'message': 'Login successful',
        'user': {
            'id': user.id,
            'username': user.username,
            'isAuthenticated': True
        },
        'redirect': '/dashboard'
    }), 200


@blueprint.route('/auth/register', methods=['POST'])
def register():
    data = request.get_json()
    if not data:
        return jsonify({'message': 'No data provided'}), 400

    username = data.get('username')
    password = data.get('password')
    
    if not (username and password):
        return jsonify({'message': 'Username and password are required!'}), 400

    if user_service.get_user_by_username(username):
        return jsonify({'message': 'User already exists!'}), 409

    user = user_service.create_user(username, password)
    return jsonify({
        'message': 'Registration successful',
        'user': {
            'id': user.id,
            'username': user.username
        }
    }), 201


@blueprint.route('/auth/logout', methods=['POST'])
@login_required
def logout():
    logout_user()
    return jsonify({
        'message': 'Logout successful'
    }), 200


@blueprint.route('/auth/user', methods=['GET'])
@login_required
def get_current_user():
    return jsonify({
        'success': True,
        'user': {
            'id': current_user.id,
            'username': current_user.username,
            'isAuthenticated': True
        }
    }), 200


@blueprint.route('/', methods=['GET'])
@login_required
def index():
    return render_template('index.html', username=current_user.username)


@blueprint.route('/products', methods=['GET'])
@login_required
def products():
    from src.services.product import ProductService
    service = ProductService()
    products = []
    for product in service.get_products():
        product.unit_price = int(product.unit_price)
        product.sale_price = int(product.sale_price)
        products.append(product.to_dict())

    # Sort by name
    products = sorted(products, key=lambda x: x['name'])
    return products, 200


@blueprint.route('/product/import', methods=['GET', 'POST'])
@login_required
def product_import():
    if request.method == 'POST':
        from src.services.importer import ImporterService

        importer_service = ImporterService()
        try:
            _, import_lines = importer_service.create_importer_from_request_form_form(
                request, current_user)
            alert_message = f'Imported {len(import_lines)} records'
            flash(alert_message, 'success')
            logger.info(alert_message)
            return render_template('confirmation.html'), 200
        except ValueError as e:
            alert_message = str(e)
            flash(alert_message, 'error')
            logger.error(alert_message)
            return render_template('confirmation.html'), 400

    return render_template('product_import.html')


@blueprint.route('/warehouse', methods=['GET'])
@login_required
def warehouse():
    return render_template('warehouse.html', username=current_user.username)


@blueprint.route('/customers', methods=['GET'])
def customers():
    from src.services.customer import CustomerService
    service = CustomerService()
    customers = [cus.to_dict() for cus in service.get_all_customers()]
    return customers, 200


@blueprint.route('/order/tracking', methods=['GET', 'POST'])
@login_required
def order_tracking():
    if request.method == 'POST':
        from src.services.order import OrderService

        order_service = OrderService()
        try:
            _, order_lines = order_service.create_order_from_request_form(request, current_user)
            alert_message = f'Imported {len(order_lines)} records'
            flash(alert_message, 'success')
            logger.info(alert_message)
            return render_template('confirmation.html'), 200
        except ValueError as e:
            alert_message = str(e)
            flash(alert_message, 'error')
            logger.error(alert_message)
            return render_template('confirmation.html'), 400

    return render_template('tracking.html')
