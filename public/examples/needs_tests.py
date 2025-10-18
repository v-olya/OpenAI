from typing import Optional, Tuple

def safe_divide(a, b) -> Optional[float]:
    try:
        x = float(a)
        y = float(b)
    except Exception:
        raise ValueError('Inputs must be numbers or numeric strings')

    if y == 0:
        return None
    return x / y


def parse_year_month(s: str) -> Tuple[int, int]:
    """Parse a year-month string and return (year, month).

    Supported formats (examples):
    - '2023.06'
    - '2023-06-01' (date-like; day ignored)
    - ' 2023.6 ' (whitespace tolerant)

    Raises ValueError on invalid input.
    """
    if not isinstance(s, str):
        raise ValueError('Input must be a string')

    s = s.strip()
    if not s:
        raise ValueError('Empty string')

    if '.' in s:
        parts = s.split('.')
    elif '-' in s:
        parts = s.split('-')
    else:
        raise ValueError('Unsupported date separator')

    if len(parts) < 2:
        raise ValueError('Missing month')

    try:
        year = int(parts[0])
        month = int(parts[1])
    except Exception:
        raise ValueError('Year and month must be integers')

    if month < 1 or month > 12:
        raise ValueError('Month out of range')

    return year, month

if __name__ == '__main__':
    # Simple ad-hoc run to demonstrate functions
    print(safe_divide('10', 2))
    print(safe_divide(1, 0))
    print(parse_year_month('2023.06'))
