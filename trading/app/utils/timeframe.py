from enum import Enum
from pandas import Series
import json


class Timeframe(str, Enum):
    """
    Enum biểu diễn các khung thời gian phổ biến.
    """
    M1 = "1m"
    M3 = "3m"
    M5 = "5m"
    M15 = "15m"
    M30 = "30m"
    H1 = "1h"
    H2 = "2h"
    H4 = "4h"
    H6 = "6h"
    H8 = "8h"
    H12 = "12h"
    D1 = "1d"
    D3 = "3d"
    W1 = "1w"
    Mo1 = "1M"  # 1 tháng dương lịch


def count_subcandles(min_timeframe: Timeframe | str, max_timeframe: Timeframe | str) -> int:
    """
    Tính số lượng nến nhỏ (min_timeframe) nằm trong một nến lớn (max_timeframe).

    Parameters:
        min_timeframe (Timeframe | str): Khung thời gian nhỏ (vd: '5m')
        max_timeframe (Timeframe | str): Khung thời gian lớn hơn (vd: '1h')

    Returns:
        int: Số cây nến nhỏ trong 1 cây nến lớn

    Raises:
        ValueError: Nếu min_timeframe lớn hơn max_timeframe
    """
    ms_small = timeframe_to_ms(min_timeframe)
    ms_large = timeframe_to_ms(max_timeframe)

    if ms_small > ms_large:
        raise ValueError("min_timeframe phải nhỏ hơn hoặc bằng max_timeframe")

    return ms_large // ms_small

# Bảng ánh xạ Timeframe sang milliseconds
TIMEFRAME_TO_MS = {
    Timeframe.M1: 60_000,
    Timeframe.M3: 3 * 60_000,
    Timeframe.M5: 5 * 60_000,
    Timeframe.M15: 15 * 60_000,
    Timeframe.M30: 30 * 60_000,
    Timeframe.H1: 60 * 60_000,
    Timeframe.H2: 2 * 60 * 60_000,
    Timeframe.H4: 4 * 60 * 60_000,
    Timeframe.H6: 6 * 60 * 60_000,
    Timeframe.H8: 8 * 60 * 60_000,
    Timeframe.H12: 12 * 60 * 60_000,
    Timeframe.D1: 24 * 60 * 60_000,
    Timeframe.D3: 3 * 24 * 60 * 60_000,
    Timeframe.W1: 7 * 24 * 60 * 60_000,
    Timeframe.Mo1: 30 * 24 * 60 * 60_000,  # Ước lượng
}


def timeframe_to_ms(tf: Timeframe | str) -> int:
    """
    Chuyển một Timeframe (vd: '5m') sang milliseconds.

    Parameters:
        tf (Timeframe | str): Chuỗi hoặc Enum của khung thời gian.

    Returns:
        int: Số milliseconds tương ứng.
    """
    tf = Timeframe(tf)
    return TIMEFRAME_TO_MS[tf]


def timeframe_to_second(tf: Timeframe | str) -> int:
    """
    Chuyển một Timeframe (vd: '5m') sang giây.

    Parameters:
        tf (Timeframe | str): Chuỗi hoặc Enum của khung thời gian.

    Returns:
        int: Số giây tương ứng.
    """
    tf = Timeframe(tf)
    return int(TIMEFRAME_TO_MS[tf] / 1000)


def ms_to_timeframe(ms: int) -> Timeframe:
    """
    Chuyển milliseconds sang Timeframe (nếu khớp).

    Parameters:
        ms (int): Milliseconds.

    Returns:
        Timeframe: Enum tương ứng với ms.

    Raises:
        ValueError: Nếu không khớp với timeframe nào.
    """
    for tf, tf_ms in TIMEFRAME_TO_MS.items():
        if tf_ms == ms:
            return tf
    raise ValueError(f"Không tìm thấy Timeframe tương ứng với {ms} ms")


def timeframe_to_pandas_rule(tf: Timeframe | str) -> str:
    """
    Chuyển Timeframe về chuỗi phù hợp với pandas.resample().

    Parameters:
        tf (Timeframe | str): Khung thời gian (vd: '5m', '6h')

    Returns:
        str: Chuỗi dùng được cho pandas resample (vd: '5min', '6H')
    """
    tf = Timeframe(tf)

    suffix_map = {
        "m": "min",  # phút → pandas dùng 'min'
        "h": "h",
        "d": "D",
        "w": "W",
        "M": "M"     # tháng dương lịch
    }

    # Tách số và hậu tố
    for suffix in suffix_map:
        if tf.value.endswith(suffix):
            num = tf.value[:-len(suffix)]
            return f"{num}{suffix_map[suffix]}"

    raise ValueError(f"Timeframe không hợp lệ: {tf}")


class TimeUnit(str, Enum):
    """
    Enum biểu diễn đơn vị timestamp hỗ trợ cho pd.to_datetime
    """
    NANOSECONDS = 'ns'
    MICROSECONDS = 'us'
    MILLISECONDS = 'ms'
    SECONDS = 's'


def infer_timestamp_unit(ts_series: Series) -> TimeUnit:
    """
    Tự động suy đoán đơn vị thời gian (timestamp) từ dữ liệu gốc.

    Hàm này dựa trên giá trị lớn nhất trong chuỗi timestamp để đoán xem 
    đơn vị là nanosecond, microsecond, millisecond, hay second.

    Parameters:
        ts_series (pd.Series): Một chuỗi timestamp, kiểu số nguyên (int), có thể là ns/us/ms/s.

    Returns:
        TimeUnit: Enum biểu diễn đơn vị thời gian phù hợp để dùng với pd.to_datetime(..., unit=...)

    Raises:
        ValueError: Nếu không thể nhận diện đơn vị timestamp.
    """
    ts = ts_series.dropna()
    if ts.empty:
        raise ValueError("⚠️ Không nhận diện được đơn vị timestamp.")

    try:
        v = float(ts.median())
    except Exception:
        v = float(ts.iloc[0])

    v = abs(v)
    if v == 0:
        return TimeUnit.MILLISECONDS

    from datetime import datetime, timezone

    min_dt = datetime(1990, 1, 1, tzinfo=timezone.utc)
    max_dt = datetime(2100, 1, 1, tzinfo=timezone.utc)

    unit_to_div = {
        TimeUnit.SECONDS: 1.0,
        TimeUnit.MILLISECONDS: 1e3,
        TimeUnit.MICROSECONDS: 1e6,
        TimeUnit.NANOSECONDS: 1e9,
    }

    for unit, div in unit_to_div.items():
        try:
            dt = datetime.fromtimestamp(v / div, tz=timezone.utc)
        except Exception:
            continue
        if min_dt <= dt <= max_dt:
            return unit

    ts_max = ts.max()
    if ts_max > 1e18:
        return TimeUnit.NANOSECONDS
    elif ts_max > 1e15:
        return TimeUnit.MICROSECONDS
    elif ts_max > 1e12:
        return TimeUnit.MILLISECONDS
    elif ts_max > 1e9:
        return TimeUnit.SECONDS
    else:
        raise ValueError("⚠️ Không nhận diện được đơn vị timestamp.")


class TimeframeEventValue:
    """
    
    """
    remaining: float
    open_time: float
    close_time: float
    timeframe:str
    
    def __init__(self, remaining: float, open_time: float, close_time: float, timeframe:str):
        self.remaining = remaining
        self.open_time = open_time
        self.close_time = close_time
        self.timeframe = timeframe

    def to_json_object(self):
        return {
            "remaining": self.remaining * 1000,
            "openTime": self.open_time * 1000,
            "closeTime": self.close_time * 1000,
            "timeframe": self.timeframe,
        }

    def __repr__(self):
        return json.dumps(self.to_json_object())  # Để in đối tượng dễ đọc


def get_timeframe_start_end(timestamp: int, timeframe: Timeframe | str) -> tuple[int, int]:
    """
    Tính toán thời gian bắt đầu và kết thúc của một khung thời gian chứa timestamp đã cho.

    Parameters:
        timestamp (int): Timestamp (tính bằng giây) nằm trong khung thời gian.
        timeframe (Timeframe | str): Khung thời gian (ví dụ: '5m', '1h').

    Returns:
        times (tuple[int, int]): Một tuple chứa (start_time, end_time) tính bằng giây.
    """
    timeframe_seconds = timeframe_to_second(timeframe)

    # Tính thời gian bắt đầu của khung thời gian
    start_time = (timestamp // timeframe_seconds) * timeframe_seconds

    # Tính thời gian kết thúc
    end_time = start_time + timeframe_seconds

    return start_time, end_time