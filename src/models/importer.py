from sqlalchemy import Column, DATE, Integer, Sequence, SmallInteger
from sqlalchemy.orm import relationship

from src.models.base import Base, TimeTrackingMixin


class Importer(Base, TimeTrackingMixin):
    __table_args__ = {'schema': 'public'}
    __tablename__ = 'importer'

    STATUS_PENDING = 0
    STATUS_SUCCESS = 1

    id = Column(Integer, Sequence('importer_id_seq'), primary_key=True)
    imported_at = Column(DATE, nullable=False)
    imported_by = Column(Integer, nullable=False)
    status = Column(SmallInteger, nullable=False, default=STATUS_PENDING)

    import_lines = relationship('ImportLine', back_populates='importer')

    def __repr__(self):
        return f'{self.__class__.__name__}:{self.id}'
