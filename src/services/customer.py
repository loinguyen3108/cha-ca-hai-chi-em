from sqlalchemy import func

from src.models.customer import Customer
from src.services import BaseService


class CustomerService(BaseService):
    def __init__(self):
        super().__init__()

    def create_customer(self, name: str) -> Customer:
        self.logger.info(f'Creating customer {name}')
        if customer := self.get_customer_by_name(name=name):
            return customer

        customer = Customer(name=name.lower())
        return self.repo.upsert(customer)

    def get_all_customers(self) -> list[Customer]:
        self.logger.info('Getting all customers')
        return self.repo.get_all(Customer)

    def get_customer_by_name(self, name: str) -> Customer:
        self.logger.info(f'Getting user {name}')
        return self.repo.find_one(Customer, func.lower(Customer.name) == name.lower())

    def get_customer_by_id(self, id_: int) -> Customer:
        self.logger.info(f'Getting customer {id_}')
        return self.repo.find_one(Customer, Customer.id == id_)
