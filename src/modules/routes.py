from logging import getLogger
from datetime import datetime

from flask import Blueprint, flash, redirect, render_template, request, url_for, jsonify
from flask_login import current_user, login_required, login_user, logout_user

from src.services.user import UserService
from src.services.importer import ImporterService
from src.services.dashboard import DashboardService

blueprint = Blueprint('ChaCa', __name__, template_folder='templates')

user_service = UserService()
logger = getLogger(__name__)
dashboard_service = DashboardService()


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
        logger.error(f'Invalid username or password for user {username}')
        return jsonify({
            'success': False,
            'message': 'Invalid username or password!',
            'isAuthenticated': False
        }), 401

    # Set permanent session
    login_user(user, remember=True)
    logger.info(f'User {username} logged in')
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
        logger.error(username)
        logger.error(password)
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
def get_products():
    from src.services.product import ProductService
    service = ProductService()
    products = []
    for product in service.get_products():
        product.unit_price = int(product.unit_price)
        product.sale_price = int(product.sale_price)
        products.append(product)
    return jsonify([product.to_dict() for product in products]), 200


@blueprint.route('/product/import', methods=['POST'])
@login_required
def product_import():
    from src.services.importer import ImporterService

    importer_service = ImporterService()
    try:
        # Extract data from the request
        data = request.get_json()
        if not data or 'import_lines' not in data:
            return jsonify({
                'success': False,
                'message': 'Invalid data provided'
            }), 400

        # Create importer and import lines
        _, import_lines = importer_service.create_importer_from_request(data, current_user)
        alert_message = f'Successfully imported {len(import_lines)} products'
        return jsonify({
            'success': True,
            'message': alert_message
        }), 200
    except ValueError as e:
        alert_message = str(e)
        return jsonify({
            'success': False,
            'message': alert_message
        }), 400


@blueprint.route('/warehouse', methods=['GET'])
@login_required
def warehouse():
    return render_template('warehouse.html', username=current_user.username)


@blueprint.route('/customers', methods=['GET'])
@login_required
def get_customers():
    from src.services.customer import CustomerService
    service = CustomerService()
    customers = service.get_all_customers()
    return jsonify([customer.to_dict() for customer in customers]), 200


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


@blueprint.route('/dashboard/stats', methods=['GET'])
@login_required
def get_dashboard_stats():
    total_products = user_service.get_total_products()  # Implement this method in UserService
    total_imports = user_service.get_total_imports()    # Implement this method in UserService
    total_orders = user_service.get_total_orders()      # Implement this method in UserService

    return jsonify({
        'totalProducts': total_products,
        'totalImports': total_imports,
        'totalOrders': total_orders
    }), 200


@blueprint.route('/order', methods=['POST'])
@login_required
def create_order():
    from src.services.order import OrderService

    order_service = OrderService()
    data = request.get_json()

    if not data or 'customer' not in data or 'order_lines' not in data:
        return jsonify({'success': False, 'message': 'Invalid data provided'}), 400

    try:
        order, order_lines = order_service.create_order_from_request(data, current_user)
        return jsonify({
            'success': True,
            'message': f'Imported {len(order_lines)} records',
            'order_id': order.id
        }), 201
    except ValueError as e:
        return jsonify({'success': False, 'message': str(e)}), 400


@blueprint.route('/importers', methods=['GET'])
@login_required
def get_importers():
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')

    if not start_date or not end_date:
        return jsonify({'success': False, 'message': 'Start date and end date are required!'}), 400

    try:
        # Convert string dates to datetime objects
        start_date = datetime.strptime(start_date, '%Y-%m-%d')
        end_date = datetime.strptime(end_date, '%Y-%m-%d')

        importer_service = ImporterService()
        importers = importer_service.get_importers_by_date_range(start_date, end_date)

        return jsonify({'success': True, 'importers': importers}), 200
    except ValueError as e:
        return jsonify({'success': False, 'message': str(e)}), 400


@blueprint.route('/importers/<int:importer_id>/lines', methods=['GET'])
@login_required
def get_import_lines(importer_id):
    from src.services.import_line import ImportLineService

    import_line_service = ImportLineService()
    import_lines = import_line_service.get_import_lines_by_importer_id(importer_id)
    import_lines_dict = []
    for line in import_lines:
        line_dict = line.to_dict()
        line_dict['product_sku'] = line.product.sku
        line_dict['product_name'] = line.product.name
        line_dict['unit_price'] = int(line.unit_price)
        line_dict['total_price'] = int(line.total_price)
        import_lines_dict.append(line_dict)

    return jsonify({
        'success': True,
        'import_lines': import_lines_dict
    }), 200


@blueprint.route('/orders', methods=['GET'])
@login_required
def get_orders():
    from src.services.order import OrderService
    from src.services.customer import CustomerService
    
    order_service = OrderService()
    customer_service = CustomerService()
    
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    
    if start_date and end_date:
        orders = order_service.get_orders_by_date_range(start_date, end_date)
    else:
        orders = order_service.get_all_orders()
    
    # Enhance orders with customer names and total amounts
    orders_dict = []
    for order in orders:
        order_dict = order.to_dict()
        
        # Add customer name
        customer = customer_service.get_customer_by_id(order.customer_id)
        order_dict['customer_name'] = customer.name if customer else 'Unknown Customer'
        order_dict['total_lines'] = len(order.order_lines)
        # Calculate total amount
        order_lines = order.order_lines
        total_amount = sum(float(line.gross_total_price) for line in order_lines) if order_lines else 0
        order_dict['total_amount'] = total_amount
        
        # Format date for API
        order_dict['order_date'] = order.order_at.isoformat() if order.order_at else None
        order_dict['status'] = 'Pending' if order.status == 0 else 'Success'
        
        orders_dict.append(order_dict)
    
    return jsonify({
        'success': True,
        'orders': orders_dict
    }), 200


@blueprint.route('/orders/<int:order_id>/lines', methods=['GET'])
@login_required
def get_order_lines(order_id):
    from src.services.order_line import OrderLineService
    from src.services.product import ProductService
    
    order_line_service = OrderLineService()
    product_service = ProductService()
    
    order_lines = order_line_service.get_order_lines_by_order_id(order_id)
    
    # Enhance order lines with product information
    order_lines_dict = []
    for line in order_lines:
        line_dict = line.to_dict()
        
        # Add product information
        if line.product:
            line_dict['product_name'] = line.product.name
            line_dict['product_sku'] = line.product.sku
        else:
            line_dict['product_name'] = 'Unknown Product'
            line_dict['product_sku'] = 'N/A'
        
        # Add calculated fields
        line_dict['unit_price'] = int(line.sale_price)
        line_dict['net_total_price'] = int(line.net_total_price)
        line_dict['gross_total_price'] = int(line.gross_total_price)
        line_dict['discount'] = int(line.discount)
        
        order_lines_dict.append(line_dict)
    
    return jsonify({
        'success': True,
        'order_lines': order_lines_dict
    }), 200


@blueprint.route('/dashboard/metrics', methods=['GET'])
@login_required
def get_dashboard_metrics():
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    
    if not start_date or not end_date:
        return jsonify({
            'success': False,
            'message': 'start_date and end_date are required'
        }), 400
    
    metrics = dashboard_service.get_metrics(start_date, end_date)
    print(metrics)
    return jsonify(metrics)
