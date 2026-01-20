import asyncio
import time
import inspect
from typing import Callable, Optional, Union
from datetime import datetime, timezone
from .timeframe import Timeframe, timeframe_to_second, TimeframeEventValue
from .log import log


class TimeframeTimer:
    """
    Universal Timer cho candlestick - tự động nhận diện sync/async callback
    """
    
    def __init__(self, timeframe: Union[Timeframe, str], callback: Callable):
        """
        Khởi tạo TimeframeTimer
        
        Parameters:
            timeframe: Khung thời gian (Timeframe enum hoặc string như '1m', '5m', '1h')
            callback: Hàm sẽ được gọi khi nến đóng (có thể sync hoặc async)
        """
        self.timeframe = Timeframe(timeframe)
        self.callback = callback
        self.interval_seconds = timeframe_to_second(self.timeframe)
        
        # Tự động nhận diện loại callback
        self.is_async_callback = self._detect_async_callback()
        
        # Control variables
        self.is_running = False
        # self._stop_event = threading.Event()
        # self._thread: Optional[threading.Thread] = None
        self._async_task: Optional[asyncio.Task] = None
        # self._loop: Optional[asyncio.AbstractEventLoop] = None
    

    def _detect_async_callback(self) -> bool:
        """
        Tự động nhận diện callback là async hay sync
        
        Returns:
            bool: True nếu callback là async function, False nếu sync
        """
        return (
            asyncio.iscoroutinefunction(self.callback) or
            inspect.iscoroutinefunction(self.callback) or
            (hasattr(self.callback, '__call__') and asyncio.iscoroutinefunction(self.callback.__call__))
        )
    

    def _calculate_next_candle_time(self) -> tuple[float, float, float]:
        """
        Tính toán thời gian đóng nến tiếp theo
        
        Returns:
            tuple: (remaining_seconds, open_time, close_time)
        """
        now = time.time()
        
        # Tính thời gian bắt đầu nến hiện tại (làm tròn xuống)
        current_candle_start = (now // self.interval_seconds) * self.interval_seconds
        
        # Thời gian đóng nến hiện tại
        current_candle_close = current_candle_start + self.interval_seconds
        
        # Thời gian còn lại đến khi đóng nến
        remaining = current_candle_close - now
        
        return remaining, current_candle_start, current_candle_close
    

    def _create_event_data(self, remaining: float, open_time: float, close_time: float) -> TimeframeEventValue:
        """Tạo event data cho callback"""
        return TimeframeEventValue(
            remaining=remaining,
            open_time=open_time,
            close_time=close_time,
            timeframe=self.timeframe.value
        )
    

    async def _run_async_timer(self):
        """Chạy timer cho async callback"""
        # log.info(f"🔄 Async timer running cho {self.timeframe.value}")
        
        while self.is_running:
            remaining, open_time, close_time = self._calculate_next_candle_time()
            
            # Đợi đến khi nến đóng
            await asyncio.sleep(remaining)
            
            if not self.is_running:
                break
            
            # Tạo event data
            event_data = self._create_event_data(0, open_time, close_time)
            
            try:
                # Gọi async callback
                await self.callback(event_data)
            except Exception as e:
                log.info(f"❌ Lỗi trong async callback: {e}")
    

    def start(self):
        """
        Bắt đầu timer bằng cách tạo một task bất đồng bộ
        """
        if self.is_running:
            log.info("⚠️ Timer đã đang chạy")
            return
        
        self.is_running = True
        
        remaining, _, _ = self._calculate_next_candle_time()
        callback_type = "async" if self.is_async_callback else "sync"
        
        log.info(f"🚀 TimeframeTimer started cho {self.timeframe.value} ({callback_type} callback) ⏰ -{remaining:.1f}s")
        
        # Tạo một Task mới và chạy trên event loop hiện tại
        self._async_task = asyncio.create_task(self._run_async_timer())
    

    def stop(self):
        """Dừng timer"""
        if not self.is_running:
            return
        
        log.info(f"🛑 Đang dừng TimeframeTimer cho {self.timeframe.value}...")
        self.is_running = False
        
        if self._async_task:
            self._async_task.cancel()
            
        log.info(f"✅ TimeframeTimer đã dừng cho {self.timeframe.value}")


    def get_next_candle_info(self) -> dict:
        """
        Lấy thông tin về nến tiếp theo
        
        Returns:
            dict: Thông tin về nến hiện tại và nến tiếp theo
        """
        remaining, open_time, close_time = self._calculate_next_candle_time()
        
        return {
            "timeframe": self.timeframe.value,
            "current_candle_open": datetime.fromtimestamp(open_time, timezone.utc).isoformat(),
            "current_candle_close": datetime.fromtimestamp(close_time, timezone.utc).isoformat(),
            "remaining_seconds": round(remaining, 2),
            "remaining_formatted": f"{int(remaining//60)}m {int(remaining%60)}s",
            "callback_type": "async" if self.is_async_callback else "sync"
        }

