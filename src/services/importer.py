from src.models import Importer
from src.services import BaseService


class ImporterService(BaseService):
    def __init__(self):
        super().__init__()

    def create_importer(self, importer_dict: dict) -> Importer:
        if not importer_dict:
            raise ValueError('importer_dict is required')

        importer = Importer(**importer_dict)
        return self.repo.upsert(importer)

    def update_importer(self, importer: Importer) -> Importer:
        return self.repo.upsert(importer)
