from sqlalchemy import Column, ForeignKey, Integer, Numeric
from sqlalchemy.orm import relationship

from src.models.base import Base, TimeTrackingMixin


class ImportLine(Base, TimeTrackingMixin):
    __table_args__ = {'schema': 'public'}
    __tablename__ = 'import_line'

    importer_id = Column(
        Integer, ForeignKey('public.importer.id', onupdate='CASCADE', ondelete='CASCADE'),
        primary_key=True
    )
    product_id = Column(Integer, primary_key=True)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Numeric(10, 2), nullable=False)
    total_price = Column(Numeric(10, 2), nullable=False)

    importer = relationship('Importer', back_populates='import_lines')

    product_join_str = 'foreign(ImportLine.product_id)==remote(Product.id)'
    product = relationship('Product', primaryjoin=product_join_str)

    def __repr__(self):
        return f'{self.__class__.__name__}:{self.id}'

    def calculate_total_price(self):
        self.total_price = self.unit_price * self.quantity
        return self.total_price
