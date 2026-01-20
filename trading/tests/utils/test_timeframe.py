# tests/utils/test_timeframe.py

import pytest
from app.utils.timeframe import Timeframe, timeframe_to_second, count_subcandles


def test_timeframe_enum_values():
    """Tests that the Timeframe enum has correct string values."""
    assert Timeframe.M1.value == "1m"
    assert Timeframe.H4.value == "4h"

def test_invalid_timeframe_creation():
    """Tests that creating a Timeframe with an invalid string raises a ValueError."""
    with pytest.raises(ValueError):
        Timeframe("invalid_tf")

def test_timeframe_to_second():
    """Tests the timeframe_to_second function for different units."""
    assert timeframe_to_second(Timeframe.M1) == 60
    assert timeframe_to_second("5m") == 5 * 60
    assert timeframe_to_second("1h") == 1 * 60 * 60
    assert timeframe_to_second("1d") == 1 * 24 * 60 * 60
    assert timeframe_to_second("1w") == 7 * 24 * 60 * 60

def test_count_subcandles():
    """Tests the count_subcandles function."""
    assert count_subcandles("1m", "5m") == 5
    assert count_subcandles("5m", "1h") == 12
    assert count_subcandles(Timeframe.H4, Timeframe.D1) == 6

def test_count_subcandles_invalid_order():
    """Tests that a ValueError is raised if min_timeframe is larger than max_timeframe."""
    with pytest.raises(ValueError):
        count_subcandles("1h", "5m")
