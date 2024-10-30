from typing import List

from src.models import ImportLine
from src.services import BaseService


class ImportLineService(BaseService):
    def __init__(self):
        super().__init__()

    def create_import_lines(self, import_lines_dict: List[dict]) -> List[ImportLine]:
        import_lines = []
        for import_line_dict in import_lines_dict:
            import_line = ImportLine(**import_line_dict)
            import_line.calculate_total_price()
            import_lines.append(import_line)
        self.repo.bulk_insert(import_lines)
        return import_lines
