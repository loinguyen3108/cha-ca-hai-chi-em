from sqlalchemy import Column, ForeignKey, Integer, Numeric
from sqlalchemy.orm import relationship

from src.models.base import Base, TimeTrackingMixin


class OrderLine(Base, TimeTrackingMixin):
    __table_args__ = {'schema': 'public'}
    __tablename__ = 'order_line'

    order_id = Column(
        Integer, ForeignKey('public.order.id', onupdate='CASCADE', ondelete='CASCADE'),
        primary_key=True
    )
    product_id = Column(Integer, primary_key=True)
    quantity = Column(Integer, nullable=False)
    sale_price = Column(Numeric(10, 2), nullable=False)
    discount = Column(Numeric(10, 2), nullable=False)
    net_total_price = Column(Numeric(10, 2), nullable=False)
    gross_total_price = Column(Numeric(10, 2), nullable=False)

    order = relationship('Order', back_populates='order_lines')

    product_join_str = 'foreign(OrderLine.product_id)==remote(Product.id)'
    product = relationship('Product', primaryjoin=product_join_str)

    def __repr__(self):
        return f'{self.__class__.__name__}:{self.id}'

    def set_total_price(self):
        self.net_total_price = (self.sale_price * self.quantity) - self.discount
        self.gross_total_price = self.sale_price * self.quantity
