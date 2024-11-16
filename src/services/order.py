from src.models.order import Order
from src.services import BaseService


class OrderService(BaseService):
    def __init__(self):
        super().__init__()

    def create_order(self, order_dict: dict) -> Order:
        if not order_dict:
            raise ValueError('order_dict is required')

        order = Order(**order_dict)
        return self.repo.upsert(order)

    def update_order(self, order: Order) -> Order:
        return self.repo.upsert(order)
