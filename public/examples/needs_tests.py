"""
Example module intended for the "Add unit tests for edge cases" preset.
Do NOT add tests here — this file is the target that should be sent to the code
interpreter with the prompt asking to create unit tests.

Functions inside intentionally contain behaviors that need thorough tests:
- safe_divide(a, b): accepts numbers or numeric strings; returns None for
  division by zero. Raises ValueError for non-numeric inputs.
- parse_year_month(s): accepts strings like '2023.06' or '2023-06-01' and
  returns (year, month) as integers. May raise ValueError for invalid formats.

"""

from typing import Optional, Tuple


def safe_divide(a, b) -> Optional[float]:
    """Divide a by b safely.

    - Accepts ints, floats, or numeric strings (e.g. '3.5').
    - Returns None when dividing by zero.
    - Raises ValueError when inputs cannot be interpreted as numbers.
    """
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
