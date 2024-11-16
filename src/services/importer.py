from functools import cached_property

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

    def create_importer_from_request_form_form(self, request_form, current_user):

        importer = self.create_importer({
            'imported_at': request_form.form['import_date'], 'imported_by': current_user.id,
            'other_expenses': request_form.form['other_expenses']
        })

        import_lines_mapped = {}
        for k, v in request_form.form.items():
            if k.startswith('product_'):
                product_id = int(k.split('_')[-1])
                import_lines_mapped[product_id] = import_lines_mapped.get(product_id, {})
                if 'quantity' in k:
                    import_lines_mapped[product_id]['quantity'] = int(v)
                if 'unit_price' in k:
                    import_lines_mapped[product_id]['unit_price'] = float(v)

        import_lines = self._process_import_lines(import_lines_mapped, importer)
        importer.status = Importer.STATUS_SUCCESS
        self.update_importer(importer)
        return importer, import_lines

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
