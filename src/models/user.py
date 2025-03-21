from flask_login import UserMixin
from sqlalchemy import Column, Integer, Sequence, String, Text, UniqueConstraint
from werkzeug.security import check_password_hash, generate_password_hash

from src.models.base import Base, TimeTrackingMixin


class User(Base, TimeTrackingMixin, UserMixin):
    __table_args__ = (
        UniqueConstraint('username', name='users_lower_username'),
        {'schema': 'public'}
    )
    __tablename__ = 'users'

    id = Column(Integer, Sequence('users_id_seq'), primary_key=True)
    username = Column(String(80), unique=True, nullable=False)
    password = Column(Text, nullable=False)

    def __repr__(self):
        return f'{self.__class__.__name__}:{self.id}'

    def set_password(self, password):
        self.password = generate_password_hash(password)

    def check_password(self, password):
        print(self.password, password)
        return check_password_hash(self.password, password)
