import inspect
import logging
from typing import Any

from colorama import Fore


log = logging.getLogger(__name__) # structlog.get_logger() # logger.logger # 

def log_with_location(message: Any, color = Fore.RESET):
    """
    In Nội dung kèm vị trí dòng và tên tệp hiện tại.

    Args:
        message (Any): Nội dung cần in.
    """
    # Lấy thông tin dòng gọi hàm
    frame = inspect.currentframe()
    if frame is not None:
        caller_frame = frame.f_back
        if caller_frame is not None:
            # Lấy tên file và số dòng
            file_name = caller_frame.f_code.co_filename
            line_number = caller_frame.f_lineno
            log.info(f"{color}[{file_name}:{line_number}] {message}", Fore.RESET)
