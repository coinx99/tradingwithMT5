# tests/utils/test_timeframe_timer.py

import pytest
import asyncio
from unittest.mock import Mock, AsyncMock, patch

from app.utils.timeframe import Timeframe
from app.utils.timeframe_timer import TimeframeTimer



def test_timer_initialization_sync_callback():
    """Tests that the timer correctly identifies a synchronous callback."""
    sync_callback = Mock()
    timer = TimeframeTimer(Timeframe.M1, sync_callback)
    assert not timer.is_async_callback
    assert timer.timeframe == Timeframe.M1
    assert timer.interval_seconds == 60


async def test_timer_initialization_async_callback():
    """Tests that the timer correctly identifies an asynchronous callback."""
    async_callback = AsyncMock()
    timer = TimeframeTimer(Timeframe.M1, async_callback)
    assert timer.is_async_callback


def test_calculate_next_candle_time():
    """Tests the calculation of the next candle time."""
    # We don't need a real callback here
    timer = TimeframeTimer("1m", Mock())

    remaining, open_time, close_time = timer._calculate_next_candle_time()

    assert 0 < remaining <= 60
    assert close_time - open_time == 60
    assert open_time % 60 == 0  # Start time should be a multiple of 60


@pytest.mark.anyio
async def test_timer_runs_and_calls_callback():
    """Tests that the timer runs and calls the callback after a short period."""
    async_callback = AsyncMock()
    timer = TimeframeTimer("1m", async_callback)

    with patch("app.utils.timeframe_timer.asyncio.sleep", new=AsyncMock()) as mock_sleep:
        # Manually set is_running to True for one loop iteration
        timer.is_running = True
        await timer._run_async_timer()

    # After the loop runs once, the callback should have been called.
    async_callback.assert_called_once()
