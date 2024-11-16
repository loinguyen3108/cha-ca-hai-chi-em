from sqlalchemy import Column, DATE, Integer, Sequence, SmallInteger
from sqlalchemy.orm import relationship

from src.models.base import Base, TimeTrackingMixin


class Order(Base, TimeTrackingMixin):
    __table_args__ = {'schema': 'public'}
    __tablename__ = 'order'

    STATUS_PENDING = 0
    STATUS_SUCCESS = 1

    id = Column(Integer, Sequence('order_id_seq'), primary_key=True)
    customer_id = Column(Integer, nullable=False)
    created_by = Column(Integer, nullable=False)
    order_at = Column(DATE, nullable=False)
    status = Column(SmallInteger, nullable=False, default=STATUS_PENDING)

    order_lines = relationship('OrderLine', back_populates='order')

    def __repr__(self):
        return f'{self.__class__.__name__}:{self.id}'
