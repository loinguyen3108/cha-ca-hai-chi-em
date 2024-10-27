import types
from typing import Any, Generator, Sequence


def is_generator(value: Any) -> bool:
    """Return whether `value` is a generator or generator-like.

    :param value: Value to check
    :return: True if value is a generator
    """
    return (isinstance(value, types.GeneratorType) or
            (hasattr(value, '__iter__') and hasattr(value, '__next__') and
             not hasattr(value, '__getitem__')))


def is_sequence(value: Any) -> bool:
    """Return whether `value` is a sequence or sequence-like.

    :param value: Value to check
    :return: True if value is a sequence
    """
    return (is_generator(value) or (
            isinstance(value, Sequence) and not isinstance(value, str)))

def flatten(seq: Any) -> Generator:
    """Flatten `seq` a single level deep.

    :param seq: Sequence to flatten
    :return: Flattened sequence
    """
    for item in seq:
        if is_sequence(item):
            yield from item
        else:
            yield item


def check_not_empty(reference: Any, message: str = None) -> Any:
    """Check if the given reference is not empty.

    :param reference: The reference to check.
    :param message: The error message to raise if the reference is empty.
    :return: The reference if it is not empty.
    """
    if not reference:
        raise ValueError(message or 'Empty value.')
    return reference