from typing import List

from src.models.order_line import OrderLine
from src.services import BaseService


class OrderLineService(BaseService):
    def __init__(self):
        super().__init__()

    def create_order_lines(self, order_lines_dict: List[dict]) -> List[OrderLine]:
        order_lines = []
        for order_line_dict in order_lines_dict:
            order_line = OrderLine(**order_line_dict)
            order_line.set_total_price()
            order_lines.append(order_line)
        self.repo.bulk_insert(order_lines)
        return order_lines
