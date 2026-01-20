
from decimal import Decimal
from typing import Union



class Precision:
    precision: int
    min_move: float
    def __init__(self, precision: int, min_move: float):
        self.precision = precision
        self.min_move = min_move



def get_precision_and_minmove(number: Union[float, str]) -> Precision:
    """
    Tính precision và min_move của một số.
    
    :param number: Số đầu vào, dạng float hoặc string.
    :return: Dictionary chứa precision (số chữ số thập phân) và min_move (bước nhảy nhỏ nhất).
    """
    # Chuyển đổi số sang kiểu Decimal để tính chính xác
    dec_number = Decimal(str(number))
    
    # Tính precision (số chữ số thập phân)
    if dec_number == dec_number.to_integral():
        precision = 0  # Nếu là số nguyên
    else:
        precision = abs(dec_number.as_tuple().exponent)
    
    # Tính min_move dựa trên precision 
    min_move = 10 ** -precision
    
    return Precision(precision, min_move)


def is_zero(x: str) -> bool:
    """
    Kiểm tra xem một chuỗi số thập phân có đại diện cho giá trị bằng 0 hay không.
    
    Hàm này duyệt qua các ký tự trong chuỗi để đảm bảo tất cả các ký tự 
    đều là '0' hoặc '.', đảm bảo hiệu suất cao mà không cần chuyển đổi sang số thực.

    Args:
        x (str): Chuỗi cần kiểm tra. Chuỗi này được giả định chỉ chứa các ký tự số hợp lệ 
                 hoặc dấu thập phân (ví dụ: "0.0000", "000", "0").
    
    Returns:
        bool: True nếu chuỗi đại diện cho giá trị bằng 0, False nếu không.
    
    Examples:
        >>> is_zero("0.0000")
        True
        >>> is_zero("000")
        True
        >>> is_zero("0.1")
        False
        >>> is_zero("")
        False
    """
    # Kiểm tra nếu chuỗi rỗng, không thể đại diện cho 0
    if not x:
        return False

    # Duyệt qua các ký tự và kiểm tra nếu không phải '0' hoặc '.'
    return all(c == '0' or c == '.' for c in x)

