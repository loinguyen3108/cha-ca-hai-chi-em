from sqlalchemy import Column, Integer, Sequence, Text, UniqueConstraint

from src.models.base import Base, TimeTrackingMixin


class Customer(Base, TimeTrackingMixin):
    __table_args__ = (
        UniqueConstraint('name', name='idx_customer_lower_name'),
        {'schema': 'public'}
    )
    __tablename__ = 'customer'

    ANONYMOUS_CUSTOMER = -1

    id = Column(Integer, Sequence('customer_id_seq'), primary_key=True)
    name = Column(Text, unique=True, nullable=False)

    def __repr__(self):
        return f'{self.__class__.__name__}:{self.id}'
