from typing import List

from src.models import ImportLine
from src.services import BaseService


class ImportLineService(BaseService):
    def __init__(self):
        super().__init__()

    def create_import_lines(self, import_lines_dict: List[dict]) -> List[ImportLine]:
        import_lines = [ImportLine(**import_line_dict) for import_line_dict in import_lines_dict]
        self.repo.bulk_insert(import_lines)
        return import_lines
