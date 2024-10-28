from sqlalchemy import func

from src.models.user import User
from src.services import BaseService


class UserService(BaseService):
    def __init__(self):
        super().__init__()

    def create_user(self, username: str, password: str) -> User:
        self.logger.info(f'Creating user {username}')
        user = User(username=username.lower())
        user.set_password(password)
        return self.repo.insert(user)

    def get_user_by_id(self, user_id: int) -> User:
        self.logger.info(f'Getting user {user_id}')
        return self.repo.find_one(User, User.id == user_id)

    def get_user_by_username(self, username: str) -> User:
        self.logger.info(f'Getting user {username}')
        return self.repo.find_one(User, func.lower(User.username) == username.lower())
