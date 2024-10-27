from urllib.parse import urlparse

from sqlalchemy import create_engine, delete, pool, select, text, tuple_
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import joinedload, scoped_session, sessionmaker

from src.helpers.collections_ import check_not_empty, flatten, is_sequence
from src.helpers.string import remove_apostrophe_string


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
    def __init__(self, uri):
        self._parse_uri(uri)
        self.session = PostgresSession.create_scoped_session(uri)

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
        """Finds results based on the given criterion.
         If results are very large ( > 10K), consider using `scan` method
        :param model_class: The model class
        :param criterion: One or more SQL criterion
        :param kwargs:
            - offset: The offset
            - limit: The number of returned model instances
            - order_by: The SQL order_by criterion to sort results
            - relationship: Loading all model's relationships or not. Defaults `False`
            - relationship_includes: Loading specific relationships list
            - relationship_excludes: Excludes loading specific relationships list
        :return: All found model instances
        """
        return self._query(model_class, *criterion, **kwargs).scalars().all()

    def find_one(self, model_class, *criterion, **kwargs):
        """ Find one model instance by given criteria
        :param model_class: The model class
        :param criterion: One or more SQL criterion
        :param kwargs:
            - offset: The offset
            - limit: The number of returned model instances
            - order_by: The SQL order_by criterion to sort results
            - relationship: Loading all model's relationships or not. Defaults `False`
            - relationship_includes: Loading specific relationships list
            - relationship_excludes: Excludes loading specific relationships list
        :return: First found model instance
        """
        kwargs['limit'] = 1
        return self._query(model_class, *criterion, **kwargs).scalar_one_or_none()

    def find_n_bulk_insert_on_conflict_do_nothing(self, model_instances, composite_keys):
        """Find existing model instances first, then bulk insert only not existing model instances

        This method will find existing model instances first, then bulk insert only not existing
        model instances

        :param model_instances: The list of model instances
        :param composite_keys: The list of composite keys
        """
        try:
            model = model_instances[0].__class__
            model_values = self._make_values_by_composite_keys(model_instances, composite_keys)
            instances_existing = self.find_by_composite_keys(model, composite_keys, model_values)
            # Filter out not existing model instances by __eq__ method of model
            instances_not_existing = [m for m in model_instances if m not in instances_existing]
            if instances_not_existing:
                self.bulk_insert(instances_not_existing)
                self.commit()
                return instances_existing + instances_not_existing
            return instances_existing
        except Exception:
            self.rollback()
            raise

    @staticmethod
    def _make_values_by_composite_keys(model_instances, composite_keys):
        if len(composite_keys) == 0:
            raise ValueError('composite_keys must be non-empty list')

        if len(composite_keys) == 1:
            return [remove_apostrophe_string(getattr(_, composite_keys[0].key))
                    for _ in model_instances]

        return [
            tuple(remove_apostrophe_string(getattr(_, model_key.key))
                  for model_key in composite_keys)
            for _ in model_instances
        ]

    def insert(self, entity):
        try:
            result = self.session.add(entity)
            self.commit()
            return result
        except Exception as e:
            self.rollback()
            raise e

    def insert_many_on_conflict_do_nothing(self, model_instances, on_conflict_cols,
                                           selected_fields=None, **kwargs):
        try:
            model_class = model_instances[0].__class__
            for model_instance in model_instances:
                if type(model_instance) is not model_class:
                    raise ValueError(f'The {type(model_instance)} mismatch with {model_class}')

            table = model_instances[0].__table__
            insert_stmt = insert(table).values(
                [_.to_dict(fields=selected_fields) for _ in model_instances]
            )
            do_insert_stmt = insert_stmt.on_conflict_do_nothing(
                index_where=on_conflict_cols).returning(*table.columns)
            ret = self.session.execute(do_insert_stmt, **kwargs).fetchall()
            self.commit()
            return [r._mapping for r in ret]
        except Exception:
            self.rollback()
            raise

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

    def _scan_by_id(self, model_class, *criterion, **kwargs):
        """Scan by entity's ID."""
        pks = model_class.primary_key_columns()
        pks = tuple_(*pks) if len(pks) > 1 else pks[0]
        kwargs['limit'] = kwargs.pop('batch_size')
        kwargs['order_by'] = pks
        last_id = kwargs.pop('last_id', None)
        while True:
            if last_id is None:
                models = self.find(model_class, *criterion, **kwargs)
            else:
                models = self.find(model_class, pks > last_id, *criterion, **kwargs)
            if models:
                for each in models:
                    last_id = each.identity()
                    yield each
            else:
                break
