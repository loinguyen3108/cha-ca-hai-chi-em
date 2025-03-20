from urllib.parse import urlparse

from sqlalchemy import create_engine, delete, pool, select, text, tuple_
from sqlalchemy.orm import joinedload, scoped_session, sessionmaker

from src.default import SQLALCHEMY_DATABASE_URI
from src.helpers.collections_ import check_not_empty, flatten, is_sequence


class PostgresSession:

    @classmethod
    def create_scoped_session(cls, pg_uri, poolclass=pool.NullPool):
        engine = create_engine(
            pg_uri,
            echo=False,
            echo_pool=False,
            poolclass=poolclass,
            client_encoding='utf-8'
        )
        session_factory = sessionmaker(
            autoflush=False, bind=engine, expire_on_commit=False
        )
        return scoped_session(session_factory)


class PostgresRepository:
    def __init__(self, uri=None):
        uri = uri or SQLALCHEMY_DATABASE_URI
        self._parse_uri(uri)
        self.session = PostgresSession.create_scoped_session(uri)

    def get_all(self, model_class):
        return self.session.query(model_class).all()

    def bulk_insert(self, entities: list):
        try:
            self.session.bulk_save_objects(entities, return_defaults=True)
            self.commit()
        except Exception as e:
            self.rollback()
            raise e

    def close(self):
        self.session.close()

    def commit(self):
        self.session.commit()

    def delete(self, model_class, *criterion):
        try:
            result = self.session.execute(delete(model_class).where(*criterion))
            self.commit()
            return result
        except Exception as e:
            self.rollback()
            raise e

    def execute(self, query: str, params: dict = None):
        return self.session.execute(text(query), params).mappings().all()

    def find(self, model_class, *criterion, **kwargs):
        return self._query(model_class, *criterion, **kwargs).scalars().all()

    def find_one(self, model_class, *criterion, **kwargs):
        kwargs['limit'] = 1
        return self._query(model_class, *criterion, **kwargs).scalar_one_or_none()

    def insert(self, entity):
        try:
            self.session.add(entity)
            self.commit()
            return entity
        except Exception as e:
            self.rollback()
            raise e

    def find_by_composite_keys(self, model_class, keys, values, **kwargs):
        """Find model instances by composite keys

        :param model_class: The model class
        :param keys: The list of keys
        :param values: The list of values
        """
        if not (isinstance(keys, (list, tuple, set)) and isinstance(values, (list, tuple, set))):
            raise ValueError('keys and values must be list, tuple or set')

        criterion = self._make_criterion(keys, values)
        return self._query(model_class, criterion, **kwargs).scalars().all()

    def rollback(self):
        self.session.rollback()

    def upsert(self, entity):
        try:
            result = self.session.merge(entity)
            self.commit()
            return result
        except Exception as e:
            self.rollback()
            raise e

    @staticmethod
    def _apply_filter_criteria(query, filter_criteria):
        """Apply filter criteria to given query"""
        for criteria in flatten(filter_criteria):
            if is_sequence(criteria):
                query = query.filter(*criteria)
            else:
                query = query.filter(criteria)
        return query

    @staticmethod
    def _apply_query_options(query, **kwargs):
        """Apply query options to given query"""
        offset = kwargs.get('offset')
        limit = kwargs.get('limit')
        order_by = kwargs.get('order_by')

        if order_by is not None:
            if not is_sequence(order_by):
                query = query.order_by(order_by)
            else:
                query = query.order_by(*order_by)

        if offset is not None:
            query = query.offset(offset)

        if limit is not None:
            query = query.limit(limit)
        return query

    @staticmethod
    def _build_joined_relationships(model_class, relationship=None,
                                    relationship_includes=None, relationship_excludes=None):
        """Build joined relationships for given model class"""
        joined = []
        if relationship:
            joined = [joinedload(getattr(model_class, key))
                      for key in model_class.relationships().keys()]
        elif relationship_includes:
            joined = [joinedload(getattr(model_class, key)) for key in relationship_includes]
        elif relationship_excludes:
            joined = [joinedload(getattr(model_class, key))
                      for key in model_class.relationships().keys() if
                      key not in relationship_excludes]
        return joined

    @staticmethod
    def _is_mapped(clazz):
        return hasattr(clazz, '__mapper__')

    def _parse_uri(self, uri):
        result = urlparse(uri)
        self.username = result.username
        self.database = result.path[1:]
        self.hostname = result.hostname
        self.port = result.port

    @staticmethod
    def _make_criterion(keys, values):
        """Makes PKs criteria for given model class and IDs"""
        if not keys:
            raise ValueError('keys is required')

        if len(keys) == 1:  # single PK
            # handle string values and numeric values
            if isinstance(values[0], str):
                values_str = ', '.join(f"('{_}')" for _ in values)
            else:
                values_str = ', '.join(f"({_})" for _ in values)
            return text(f'{keys[0].key} = ANY(VALUES {values_str})')

        values_str = ', '.join(f'{str(tuple(_))}' for _ in values)
        values_str = values_str.replace('"', "'")
        return text(f'({tuple_(*keys)}) = ANY(VALUES {values_str})')

    def _query(self, model_class, *criterion, **kwargs):
        """ Create query statement for given model class

        :param model_class: Model class
        :param criterion: One or more SQL criterion
        :param kwargs:
            - offset: The offset
            - limit: The number of returned model instances
            - order_by: The SQL order_by criterion to sort results
            - relationship: Loading all model's relationships or not. Defaults `False`.
            Setting this option to `True` overwrites both `relationship_includes` and
            `relationship_excludes`
            - relationship_includes: Loading specific relationships list
            - relationship_excludes: Excludes loading specific relationships list
        :return: Result
        """
        check_not_empty(model_class)
        query = select(model_class)

        if not criterion and not kwargs:
            return query

        if kwargs and self._is_mapped(model_class):
            # Build joined load options
            relationship = bool(kwargs.get('relationship', False))
            relationship_includes = kwargs.get('relationship_includes')
            relationship_excludes = kwargs.get('relationship_excludes')
            joined = self._build_joined_relationships(
                model_class, relationship, relationship_includes, relationship_excludes)
            query = query.options(*joined) if joined else query

        if criterion:
            query = self._apply_filter_criteria(query, criterion)

        if kwargs:
            query = self._apply_query_options(query, **kwargs)
        return self.session.execute(query)
