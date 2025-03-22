from functools import cached_property
from datetime import datetime

from sqlalchemy import and_

from src.models import Importer
from src.services import BaseService


class ImporterService(BaseService):
    def __init__(self):
        super().__init__()

    @cached_property
    def import_line_service(self):
        from src.services.import_line import ImportLineService
        return ImportLineService()

    @cached_property
    def product_service(self):
        from src.services.product import ProductService
        return ProductService()

    def create_importer(self, importer_dict: dict) -> Importer:
        if not importer_dict:
            raise ValueError('importer_dict is required')

        importer = Importer(**importer_dict)
        return self.repo.upsert(importer)

    def create_importer_from_request(self, data, current_user):
        import_lines = data['import_lines']
        if not import_lines:
            raise ValueError('No records to import! Please check your input data.')

        import_date = datetime.strptime(data['import_date'], '%Y-%m-%d')
        importer = self.create_importer({
            'imported_at': import_date,
            'imported_by': current_user.id,
            'other_expenses': data['other_expenses'],
            'status': Importer.STATUS_PENDING
        })

        import_lines_mapped = {}
        for line in import_lines:
            product_id = line['productId']
            quantity = line['quantity']
            unit_price = float(line['unit_price'])

            if quantity <= 0:
                continue  # Skip lines with quantity <= 0

            import_lines_mapped[product_id] = {
                'quantity': quantity,
                'unit_price': unit_price
            }

        import_lines = self._process_import_lines(import_lines_mapped, importer)
        importer.status = Importer.STATUS_SUCCESS
        self.update_importer(importer)
        return importer, import_lines

    def get_importers_by_date_range(self, start_date: datetime, end_date: datetime):
        if not start_date or not end_date:
            raise ValueError('Start date and end date are required!')

        importers = self.repo.find(
            Importer, and_(
                Importer.imported_at >= start_date,
                Importer.imported_at <= end_date
            ),
            order_by=Importer.imported_at.desc()
        )

        # sort by imported_at descending
        importers.sort(key=lambda x: x.imported_at, reverse=True)

        processed_importers = []
        for importer in importers:
            importer_dict = importer.to_dict()
            importer_dict['imported_at'] = importer_dict['imported_at'].strftime('%Y-%m-%d')
            importer_dict['total_lines'] = len(importer.import_lines)
            importer_dict['other_expenses'] = int(importer_dict['other_expenses'])
            importer_dict['status'] = 'Pending' if importer.status == 0 else 'Success'
            processed_importers.append(importer_dict)

        return processed_importers

    def update_importer(self, importer: Importer) -> Importer:
        return self.repo.upsert(importer)

    def _process_import_lines(self, import_lines_mapped: dict, importer: Importer):
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
                'quantity': import_line['quantity'], 'unit_price': import_line['unit_price']
            })
        if not import_lines_dict:
            raise ValueError('No any records to import! Please check your input data.')

        import_lines = self.import_line_service.create_import_lines(import_lines_dict) or []
        self.product_service.update_stock_quantity_from_import_lines(import_lines)
        return import_lines
