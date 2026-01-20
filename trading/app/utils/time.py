
from datetime import datetime, timedelta, timezone
import pytz


def get_timestamp_from_datetime_str(datetime_str: str, timezone_offset: float) -> float:
    """
    Chuyển đổi một chuỗi datetime thành timestamp UTC.

    Args:
        datetime_str (str): Chuỗi datetime theo định dạng "DD/MM/YYYY HH:MM:SS"
        timezone_offset (float): Độ lệch múi giờ so với UTC (ví dụ: 7 cho múi giờ +7)

    Returns:
        float: Timestamp UTC tính bằng giây

    Examples:
        >>> get_timestamp_from_datetime_str("21/12/2024 16:30:00", 7)
        1703148600.0
    """
    # Chuỗi datetime và offset múi giờ
    dt = datetime.strptime(datetime_str, "%d/%m/%Y %H:%M:%S")
    # Thêm thông tin múi giờ
    dt_with_tz = dt.replace(tzinfo=timezone(timedelta(hours=timezone_offset)))
    # Lấy timestamp UTC
    return dt_with_tz.timestamp()


def convert_to_utc_timestamp_with_offset(time_str: str, timezone_offset_hours: float) -> float:
    """
    Chuyển đổi thời gian đầu vào dạng 'YYYY-MM-DD HH:MM:SS' với múi giờ là một số (giờ)
    thành timestamp UTC.

    Args:
        time_str (str): Chuỗi thời gian dạng 'YYYY-MM-DD HH:MM:SS'.
        timezone_offset_hours (int): Số giờ offset của múi giờ địa phương (ví dụ: 7 cho UTC+7, -5 cho UTC-5).

    Returns:
        float: Timestamp UTC (tính bằng giây s). 

    
    ## Ví dụ sử dụng:
    ```python
        input_time = '2025-07-04 10:52:32' # Thời gian đầu vào
        timezone_offset = 7                  # Múi giờ là +7

        utc_timestamp = convert_to_utc_timestamp_with_offset(input_time, timezone_offset)

        log.info(f"Thời gian đầu vào: {input_time}")
        log.info(f"Múi giờ địa phương: UTC{'+' if timezone_offset >= 0 else ''}{timezone_offset}")
        log.info(f"Timestamp UTC: {utc_timestamp}")
    ```
        
    ### Để kiểm tra lại, bạn có thể chuyển timestamp UTC về lại datetime UTC:
    ```python
        log.info(f"Thời gian UTC từ timestamp: {datetime.fromtimestamp(utc_timestamp, tz=timezone.utc)}")

        log.info("Ví dụ khác với múi giờ âm")
        input_time_ny = '2025-07-04 08:00:00' # Ví dụ giờ ở New York (UTC-4 vào mùa hè)
        timezone_offset_ny = -4

        utc_timestamp_ny = convert_to_utc_timestamp_with_offset(input_time_ny, timezone_offset_ny)
        log.info(f"Thời gian đầu vào: {input_time_ny}")
        log.info(f"Múi giờ địa phương: UTC{'+' if timezone_offset_ny >= 0 else ''}{timezone_offset_ny}")
        log.info(f"Timestamp UTC: {utc_timestamp_ny}")
        log.info(f"Thời gian UTC từ timestamp: {datetime.fromtimestamp(utc_timestamp_ny, tz=timezone.utc)}")
    ```
    """
    # 1. Phân tích chuỗi thời gian thành đối tượng datetime "ngây thơ"
    dt_object_naive = datetime.strptime(time_str, '%Y-%m-%d %H:%M:%S')

    # 2. Tạo đối tượng múi giờ từ offset
    # pytz.FixedOffset nhận offset tính bằng phút
    local_tz = pytz.FixedOffset(timezone_offset_hours * 60)

    # 3. Gán múi giờ cho đối tượng datetime
    dt_object_localized = local_tz.localize(dt_object_naive)

    # 4. Chuyển đổi sang múi giờ UTC
    dt_object_utc = dt_object_localized.astimezone(pytz.utc)

    # 5. Chuyển đổi thành timestamp UTC
    utc_timestamp = dt_object_utc.timestamp()

    return utc_timestamp


def convert_utc_timestamp_to_timezone(timestamp: float, timezone_offset_hours: float) -> str:
    """
    Chuyển đổi timestamp UTC sang chuỗi thời gian ở múi giờ khác.

    Args:
        timestamp (float): Timestamp UTC (tính bằng giây).
        timezone_offset_hours (int): Số giờ offset của múi giờ đích (ví dụ: 7 cho UTC+7, -5 cho UTC-5).

    Returns:
        str: Chuỗi thời gian dạng 'YYYY-MM-DD HH:MM:SS' ở múi giờ đích.

    Ví dụ:
        >>> convert_utc_timestamp_to_timezone(1703148600.0, 7)
        '2024-12-21 23:30:00'
    """
    # Tạo đối tượng datetime UTC từ timestamp
    dt_utc = datetime.fromtimestamp(timestamp, tz=timezone.utc)
    # Tạo đối tượng timezone đích
    target_tz = timezone(timedelta(hours=timezone_offset_hours))
    # Chuyển đổi sang múi giờ đích
    dt_target = dt_utc.astimezone(target_tz)
    # Trả về chuỗi thời gian
    return dt_target.strftime('%Y-%m-%d %H:%M:%S')


