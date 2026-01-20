
class KlineMap:
    openTime = 0
    open = 1,
    high = 2,
    low = 3,
    close = 4,
    volume = 5,
    closeTime = 6,
    quoteAssetVolume = 7,
    numberOfTrades = 8,
    takerBuyBaseAssetVolume = 9,
    takerBuyQuoteAssetVolume = 10,



AggTrade = {
    "e": str,  # Loại sự kiện
    "E": float,  # Thời gian sự kiện
    "s": str,  # Ký hiệu
    "a": int,  # ID giao dịch tổng hợp
    "p": str,  # Giá
    "q": str,  # Số lượng
    "f": int,  # ID giao dịch đầu tiên
    "l": int,  # ID giao dịch cuối cùng
    "T": float,  # Thời gian giao dịch
    "m": bool,  # Người mua có phải là người tạo thị trường không?
    # m = true: bán: Người mua là market maker (người tạo thị trường), nghĩa là giao dịch được khởi tạo bởi một lệnh bán từ phía người bán.
    # m = false: mua: Người mua là market taker (người chấp nhận thị trường), nghĩa là giao dịch được khởi tạo bởi một lệnh mua từ phía người mua.
    "M": bool,  # Bỏ qua
}
