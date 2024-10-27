def remove_apostrophe_string(value):
    # Escape single quotes by doubling them
    return value.replace("'", "''") if isinstance(value, str) else value