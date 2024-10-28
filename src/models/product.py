from sqlalchemy import Column, Integer, Numeric, Sequence, String, Text, UniqueConstraint

from src.models.base import Base, TimeTrackingMixin


class Product(Base, TimeTrackingMixin):
    __table_args__ = (
        UniqueConstraint('sku', name='product_upper_sku'),
        {'schema': 'public'}
    )
    __tablename__ = 'product'

    id = Column(Integer, Sequence('product_id_seq'), primary_key=True)
    sku = Column(String(255), unique=True, nullable=False)
    name = Column(String(255), nullable=False)
    unit_price = Column(Numeric(10, 2), nullable=False)
    sale_price = Column(Numeric(10, 2), nullable=False)
    description = Column(Text)
    image_url = Column(Text, nullable=False)
    stock_quantity = Column(Integer, nullable=False, default=0)

    def __repr__(self):
        return f'{self.__class__.__name__}:{self.id}'
