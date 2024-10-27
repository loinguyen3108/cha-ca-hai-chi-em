from logging import getLogger


class BaseService:
    def __init__(self):
        self.logger = getLogger(__name__)
