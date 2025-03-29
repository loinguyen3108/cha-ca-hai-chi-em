from functools import cached_property
from datetime import datetime
from sqlalchemy import and_, func

from src.models.order import Order
from src.services import BaseService


class OrderService(BaseService):
    def __init__(self):
        super().__init__()

    @cached_property
    def customer_service(self):
        from src.services.customer import CustomerService
        return CustomerService()

    @cached_property
    def order_line_service(self):
        from src.services.order_line import OrderLineService
        return OrderLineService()

    @cached_property
    def product_service(self):
        from src.services.product import ProductService
        return ProductService()

    def create_order(self, order_dict: dict) -> Order:
        if not order_dict:
            raise ValueError('order_dict is required')

        order = Order(**order_dict)
        return self.repo.upsert(order)

    def create_order_from_request(self, data, current_user):
        # Extract customer information
        customer_data = data['customer']
        if not customer_data:
            raise ValueError('Customer data is required.')

        # Check if customer is new or existing
        if 'id' in customer_data:
            customer_id = customer_data['id']
        else:
            # Create a new customer if name is provided
            customer_name = customer_data.get('name')
            if not customer_name:
                raise ValueError('Customer name is required for new customers.')
            customer = self.customer_service.create_customer(name=customer_name)
            customer_id = customer.id

        # Create the order
        order = self.create_order({
            'order_at': datetime.strptime(data['ordered_date'], '%Y-%m-%d'),
            'created_by': current_user.id,
            'customer_id': customer_id,
            'status': Order.STATUS_PENDING
        })

        # Process order lines
        order_lines_dict = []
        for line in data['order_lines']:
            if 'product_id' not in line or 'quantity' not in line or 'sale_price' not in line:
                raise ValueError('Product ID, quantity, and sale price are required for each order line.')

            product_id = line['product_id']
            quantity = line['quantity']
            sale_price = line['sale_price']
            discount = line.get('discount', 0)

            if quantity <= 0:
                continue  # Skip lines with quantity <= 0

            order_lines_dict.append({
                'order_id': order.id,
                'product_id': product_id,
                'quantity': quantity,
                'sale_price': sale_price,
                'discount': discount
            })

        if not order_lines_dict:
            raise ValueError('No valid order lines to process.')

        # Create order lines
        order_lines = self._process_order_lines(order_lines_dict, order)
        order.status = Order.STATUS_SUCCESS
        self.update_order(order)

        return order, order_lines

    def update_order(self, order: Order) -> Order:
        return self.repo.upsert(order)

    def _process_order_lines(self, order_lines: dict, order: Order):
        if not order_lines:
            raise ValueError('No any records to import! Please check your input data.')

        for order_line in order_lines:
            if order_line['quantity'] is None or order_line['sale_price'] is None:
                raise ValueError('Quantity and sale price are required')
            if order_line['sale_price'] <= 0:
                raise ValueError('Sale price must be greater than 0')
            if order_line['quantity'] < 0:
                raise ValueError('Quantity must be greater than or equal to 0')

            if order_line['quantity'] == 0:
                continue

        order_lines = self.order_line_service.create_order_lines(order_lines)
        self.product_service.update_stock_quantity_from_order_lines(order_lines)
        return order_lines

    def get_all_orders(self):
        return self.repo.get_all(Order)

    def get_orders_by_date_range(self, start_date, end_date):
        """
        Get orders between two dates
        """
        try:
            # Convert string dates to datetime objects if they're strings
            if isinstance(start_date, str):
                start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
            if isinstance(end_date, str):
                end_date = datetime.strptime(end_date, '%Y-%m-%d').date()

            # Create filter criteria for date range
            date_filter = and_(
                Order.order_at >= start_date,
                Order.order_at <= end_date
            )

            # Query orders with the date filter
            orders = self.repo.find(Order, date_filter, order_by=Order.order_at.desc())
            return orders
        except Exception as e:
            self.logger.error(f"Error fetching orders by date range: {e}")
            return []

    def get_order_by_id(self, order_id):
        """
        Get a single order by ID
        """
        return self.repo.find_one(Order, Order.id == order_id)

    def get_sales_metrics(self, start_date, end_date):
        """
        Get sales metrics for a given date range
        """
        # Get total quantity and total revenue and calculate total cost
        query = """
            SELECT 
                o.order_at,
                SUM(ol.quantity) as total_quantity,
                SUM(ol.quantity * ol.sale_price) as total_revenue,
                SUM(ol.quantity * ol.sale_price) - SUM(ol.quantity * p.unit_price) - SUM(ol.discount) as total_profit
            FROM order_line ol
            JOIN "order" o ON ol.order_id = o.id
            JOIN product p ON ol.product_id = p.id
            WHERE o.order_at >= :start_date AND o.order_at <= :end_date
            GROUP BY o.order_at
        """
        results = self.repo.execute(query, {'start_date': start_date, 'end_date': end_date})
        # results is total quantity and total revenue for all and grouped by order_at
        transformed_results = {
            'total_quantity': 0,
            'total_revenue': 0,
            'total_profit': 0,
            'order_at_list': []
        }
        for result in results:
            result = dict(result)
            result['order_at'] = result['order_at'].strftime('%Y-%m-%d')
            result['total_revenue'] = float(result['total_revenue'])
            result['total_profit'] = float(result['total_profit'])
            transformed_results['total_quantity'] += result['total_quantity']
            transformed_results['total_revenue'] += result['total_revenue']
            transformed_results['total_profit'] += result['total_profit']
            transformed_results['order_at_list'].append(result)
        
        return transformed_results