from logging import getLogger

from flask import Blueprint, flash, redirect, render_template, request, url_for
from flask_login import current_user, login_required, login_user, logout_user

from src.services.user import UserService

blueprint = Blueprint('ChaCa', __name__, template_folder='templates')

user_service = UserService()
logger = getLogger(__name__)


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
    return products, 200


@blueprint.route('/product/import', methods=['GET', 'POST'])
@login_required
def product_import():
    if request.method == 'POST':
        from src.models.importer import Importer
        from src.services.importer import ImporterService
        from src.services.import_line import ImportLineService
        from src.services.product import ProductService
        importer_service = ImporterService()
        import_line_service = ImportLineService()
        product_service = ProductService()

        importer = importer_service.create_importer({
            'imported_at': request.form['import_date'],
            'imported_by': current_user.id
        })

        import_lines_mapped = {}
        for k, v in request.form.items():
            if k.startswith('product_'):
                product_id = int(k.split('_')[-1])
                import_lines_mapped[product_id] = import_lines_mapped.get(product_id, {})
                if 'quantity' in k:
                    import_lines_mapped[product_id]['quantity'] = int(v)
                if 'unit_price' in k:
                    import_lines_mapped[product_id]['unit_price'] = float(v)

        try:
            import_lines_dict = []
            for product_id, import_line in import_lines_mapped.items():
                if import_line['quantity'] is None or import_line['unit_price'] is None:
                    raise ValueError('Quantity and unit price are required')
                if import_line['unit_price'] <= 0:
                    raise ValueError('Unit price must be greater than 0')
                if import_line['quantity'] < 0:
                    raise ValueError('Quantity must be greater than or equal to 0')

                if import_line['quantity'] == 0:
                    continue

                import_lines_dict.append({
                    'importer_id': importer.id, 'product_id': product_id,
                    'quantity': import_line['quantity'],
                    'unit_price': import_line['unit_price'],
                    'total_price': import_line['quantity'] * import_line['unit_price']
                })
            if not import_lines_dict:
                raise ValueError('No any records to import! Please check your input data.')

            import_lines = import_line_service.create_import_lines(import_lines_dict) or []
            importer.status = Importer.STATUS_SUCCESS
            importer_service.update_importer(importer)
            product_service.update_stock_quantity_from_import_lines(import_lines)
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
