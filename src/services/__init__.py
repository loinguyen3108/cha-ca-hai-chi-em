from logging import getLogger

from src.repository import PostgresRepository


class BaseService:
    def __init__(self):
        self.logger = getLogger(__name__)
        self.repo = PostgresRepository()
