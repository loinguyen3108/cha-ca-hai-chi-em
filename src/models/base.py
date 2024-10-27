from sqlalchemy import Column, DateTime, func
from sqlalchemy.ext.declarative import declarative_base


class BaseModel:
    @classmethod
    def get_column_names(cls):
        """Get column names of the model.

        :return: a list of column names
        """
        return [column.name for column in cls.__table__.columns]

    def to_dict(self, fields=None):
        """Return the current entity as dictionary.

        :param fields: list of fields, properties to be included in the returned
        dictionary. Return all fields, without property if not specified.
        :return: a dict
        """
        data = {}
        columns = self.__table__.columns
        for column in columns:
            if fields and column.name not in fields:
                continue

            value = getattr(self, column.name)
            data[column.name] = value
        return data


Base = declarative_base(cls=BaseModel)


class TimeTrackingMixin(object):
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())
