import csv
from typing import List

from tqdm import tqdm

from src.models import ImportLine
from src.models.product import Product
from src.services import BaseService


class ProductService(BaseService):
    def __init__(self):
        super().__init__()

    def import_products_from_csv(self, file_path: str):
        if not file_path:
            raise ValueError('file_path is required')

        self.logger.info(f'Importing products from {file_path}')
        with open(file_path, encoding='utf-8') as file:
            rows = list(csv.DictReader(file))
            for row in tqdm(rows, desc='Importing products', total=len(rows)):
                row['sku'] = row['sku'].strip().upper()
                existed_product = self.repo.find_one(Product, Product.sku == row['sku'])
                product = Product(**row)
                if existed_product:
                    product = self._update_product(existed_product, product)
                self.repo.upsert(product)
        self.logger.info('Import completed!')

    def get_products(self) -> List[Product]:
        return self.repo.get_all(Product)

    def update_stock_quantity_from_import_lines(self, import_lines: List[ImportLine]):
        self.logger.info(f'Updating stock quantity from {len(import_lines)} import lines')
        for import_line in import_lines:
            product = self.repo.find_one(Product, Product.id == import_line.product_id)
            product.stock_quantity += import_line.quantity
            self.repo.upsert(product)
        self.logger.info('Stock quantity updated!')

    @staticmethod
    def _update_product(existed_product: Product, new_product: Product) -> Product:
        existed_product.name = new_product.name
        existed_product.unit_price = new_product.unit_price
        existed_product.sale_price = new_product.sale_price
        existed_product.description = new_product.description
        existed_product.image_url = new_product.image_url
        return existed_product
