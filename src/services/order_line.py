from typing import List
from sqlalchemy import and_

from src.models.order_line import OrderLine
from src.models.product import Product
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

    def get_order_lines_by_order_id(self, order_id):
        """
        Get all order lines for a specific order ID with product information
        """
        try:
            # Join with product to get product details
            order_lines = self.repo.find(
                OrderLine,
                OrderLine.order_id == order_id,
                eager_load=['product']
            )
            
            # Enhance order lines with product information
            for line in order_lines:
                if hasattr(line, 'product') and line.product:
                    line.product_name = line.product.name
                    line.product_sku = line.product.sku
                else:
                    line.product_name = "Unknown Product"
                    line.product_sku = "N/A"
            
            return order_lines
        except Exception as e:
            print(f"Error fetching order lines: {e}")
            return []
