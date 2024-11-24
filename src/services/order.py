from functools import cached_property

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

    def create_order_from_request_form(self, request_form, current_user):
        customer = request_form.form.get('customer')
        if not customer:
            raise ValueError('Customer is required!')

        customer = self.customer_service.create_customer(**{'name': request_form.form['customer']})

        order = self.create_order({
            'order_at': request_form.form['ordered_date'], 'created_by': current_user.id,
            'customer_id': customer.id
        })

        order_lines_mapped = {}
        for k, v in request_form.form.items():
            if k.startswith('product_'):
                product_id = int(k.split('_')[-1])
                order_lines_mapped[product_id] = order_lines_mapped.get(product_id, {})
                if 'quantity' in k:
                    order_lines_mapped[product_id]['quantity'] = int(v)
                if 'sale_price' in k:
                    order_lines_mapped[product_id]['sale_price'] = float(v)
                if 'discount' in k:
                    order_lines_mapped[product_id]['discount'] = float(v)

        order_lines = self._process_order_lines(order_lines_mapped, order)
        order.status = Order.STATUS_SUCCESS
        self.update_order(order)
        return order, order_lines

    def update_order(self, order: Order) -> Order:
        return self.repo.upsert(order)

    def _process_order_lines(self, order_lines_mapped: dict, order: Order):
        order_lines_dict = []
        for product_id, order_line in order_lines_mapped.items():
            if order_line['quantity'] is None or order_line['sale_price'] is None:
                raise ValueError('Quantity and sale price are required')
            if order_line['sale_price'] <= 0:
                raise ValueError('Sale price must be greater than 0')
            if order_line['quantity'] < 0:
                raise ValueError('Quantity must be greater than or equal to 0')

            if order_line['quantity'] == 0:
                continue

            order_lines_dict.append({
                'order_id': order.id, 'product_id': product_id, 'quantity': order_line['quantity'],
                'sale_price': order_line['sale_price'], 'discount': order_line.get('discount', 0)
            })
        if not order_lines_dict:
            raise ValueError('No any records to import! Please check your input data.')

        order_lines = self.order_line_service.create_order_lines(order_lines_dict) or []
        self.product_service.update_stock_quantity_from_order_lines(order_lines)
        return order_lines
