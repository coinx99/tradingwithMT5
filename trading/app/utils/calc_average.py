import logging
from typing import Optional, List
from dataclasses import dataclass

import numpy as np
import pandas as pd

from app.utils.types import PriceVolume

log = logging.getLogger(__name__)


@dataclass
class WeightAveragePriceVolume:
    """
    Weighted Average Đại diện cho dữ liệu trung bình tính từ các tick (giao dịch) trong một khoảng thời gian.

    Thuộc tính:
        - price_buy: Giá trung bình theo khối lượng của các lệnh mua.
        - volume_buy: Tổng khối lượng của các lệnh mua đã bù trừ.

        - price_sell: Giá trung bình theo khối lượng của các lệnh bán.
        - volume_sell: Tổng khối lượng của các lệnh bán đã bù trừ.

        - price (float): Giá trung bình theo khối lượng (VWAP).
        - volume (float): Tổng khối lượng giao dịch đã bù trừ.
        - quote_volume (float): Tổng khối lượng tính bằng quote currency có trừ nếu các lệnh bán.

        - order_price_buy: Giá trung bình theo số lượng của các lệnh mua.
        - order_count_buy: Tổng số lượng của các lệnh mua.

        - order_price_sell: Giá trung bình theo số lượng của các lệnh bán.
        - order_count_sell: Tổng số lượng của các lệnh bán.

        - order_price (float): Giá trung bình theo số lượng giao dịch (không cân theo khối lượng).
        - order_count (int): Số lượng giao dịch mua trừ số lượng giao dịch bán.

        - high_price (float): Giá cao nhất trong khoảng thời gian.
        - low_price (float): Giá thấp nhất trong khoảng thời gian.
    """
    price_buy: float
    volume_buy: float

    price_sell: float
    volume_sell: float

    price: float
    volume: float
    quote_volume: float

    order_price_buy: float
    order_count_buy: int

    order_price_sell: float
    order_count_sell: int

    order_price: float
    order_count: int

    high_price: float
    low_price: float


def trades_to_numpy(df: pd.DataFrame) -> np.ndarray:
    """
    Chuyển DataFrame trades từ Binance thành numpy array.
    Args:
        df (pd.DataFrame): DataFrame trades từ Binance. Các trường:
            - price (float)
            - quantity (float)
            - quote_quantity (float)
            - direction (bool: is_buyer_maker=False -> buy, True -> sell)
    Returns:
        np.ndarray: Mảng numpy gồm 3 cột: 
            - price (float)
            - quantity (float)
            - quote_quantity (float)
            - direction (float|int: 1 = buy, -1 = sell)
    """
    df = df.copy()  # tránh sửa trực tiếp df gốc

    # tạo cột direction kiểu int
    df["direction"] = np.where(df["is_buyer_maker"] == False, 1, -1).astype(int)

    # chọn và chuyển numpy array
    price = df["price"].to_numpy(dtype=float)
    quantity = df["quantity"].to_numpy(dtype=float)
    quote_quantity = df["quote_quantity"].to_numpy(dtype=float)
    direction = df["direction"].to_numpy(dtype=int)

    # ghép lại thành (N, 3)
    return np.column_stack((price, quantity, quote_quantity, direction))


def calc_average(trades: List[PriceVolume]) -> Optional[PriceVolume]:
    """
    Tính trung bình giá theo khối lượng.

    Args:
        priceVolumes (List[PriceVolume]): Danh sách các cặp giá và khối lượng.
            Khối lượng có thể âm/dương.
    Returns:
        PriceVolume: Một tuple gồm giá trung bình và khối lượng ròng.
            Nếu không có dữ liệu, trả về None.
    """
    if not trades:
        return None

    # Tạo dict để lưu trữ giá và khối lượng
    # Nếu giá giống nhau, bù trừ khối lượng
    price_volumes_dict:dict[float, float] = {}
    for price, volume in trades:
        if price in price_volumes_dict:
            price_volumes_dict[price] += volume
        else:
            price_volumes_dict[price] = volume
    
    vwap_price_volumes = list(price_volumes_dict.items())
    if not vwap_price_volumes:
        return None
    
    total_volume_buy = 0
    total_value_buy = 0

    total_volume_sell = 0
    total_value_sell = 0
    # Tính trung bình giá và tổng khối lượng dương 
    for price, volume in vwap_price_volumes:
        if volume > 0:
            total_volume_buy += volume
            total_value_buy += price * volume
        elif volume < 0:
            total_volume_sell += -volume
            total_value_sell += price * -volume
    
    if total_volume_buy == 0 and total_volume_sell == 0:
        return None

    # Tính giá trung bình theo khối lượng
    avg_price_buy = 0.0
    if total_volume_buy > 0 and total_value_buy > 0:
        avg_price_buy = total_value_buy / total_volume_buy

    avg_price_sell = 0.0
    if total_volume_sell > 0 and total_value_sell > 0:
        avg_price_sell = total_value_sell / total_volume_sell
    
    # Tính giá trung bình theo số lượng giao dịch

    if total_volume_buy == 0:
        return (avg_price_sell, -total_volume_sell)
    if total_volume_sell == 0:
        return (avg_price_buy, total_volume_buy)

    net_volume = total_volume_buy - total_volume_sell
    # nếu khối lượng ròng là 0, trả về giá trung bình
    if net_volume == 0:
        return (avg_price_buy + avg_price_sell) / 2, 0
    
    diff_price = abs(avg_price_sell - avg_price_buy)
    # nếu giá mua và giá bán bằng nhau, trả về giá trung bình
    if diff_price == 0:
        return (avg_price_buy, net_volume)

    volume_per_price = net_volume / ((total_volume_buy if net_volume < 0 else total_volume_sell) / diff_price)
    # Tính giá trung bình theo khối lượng
    avg_price = (avg_price_buy if net_volume < 0 else avg_price_sell) + volume_per_price
    
    # Trả về giá trung bình và khối lượng ròng
    return (avg_price, net_volume)


def net_volume(trades: np.ndarray) -> np.ndarray:
    """
    Tính khối lượng ròng (net volume và net_quote_volume) tại mỗi mức giá.

    Args:
        price_volumes (np.ndarray): Mảng numpy gồm 4 cột: [price, quantity, quote_quantity, direction]:
            - price (float): Giá giao dịch.
            - quantity (float): Khối lượng giao dịch.
            - quote_quantity (float): Khối lượng tính bằng quote currency.
            - direction (int): 1 nếu là buy, -1 nếu là sell.

    Returns:
        np.ndarray: Mảng 2D [price, net_volume, net_quote_volume],
        Trong đó:
        - price (float): Giá giao dịch.
        - net_volume (float): Khối lượng ròng sau khi bù trừ tại cùng mức giá.
        - net_quote_volume (float): Khối lượng tính ròng bằng quote currency sau khi bù trừ tại cùng mức giá.
    Ví dụ:
    ```python
    data = np.array([
        [0.1, 5, 0.5,  1],   # buy 5 @ 0.1
        [0.1, 3, 0.3, -1],   # sell 3 @ 0.1  => net +2
        [0.2, 2, 0.4,  1],   # buy 2 @ 0.2
        [0.2, 1, 0.2, -1],   # sell 1 @ 0.2
        [0.2, 1, 0.2, -1],   # sell 1 @ 0.2  => net 0
        [0.3, 4, 1.2,  1],   # buy 4 @ 0.3   => net +4
        [0.4, 6, 2.4, -1],   # sell 6 @ 0.4  => net -6
    ])

    log.info(net_volume(data))
    ```
    ```
    [[ 0.1  2.   0.2]
    [ 0.3  4.   1.2]
    [ 0.4 -6.  -2.4]]
    ```
    """
    if trades.size == 0:
        return np.empty((0, 3))

    prices = trades[:, 0]
    quantities = trades[:, 1]
    quotes = trades[:, 2]
    directions = trades[:, 3]

    # Khối lượng ròng = tổng(q * direction) tại mỗi price
    net_qty = {}
    net_quote = {}
    for p, q, qt, d in zip(prices, quantities, quotes, directions):
        net_qty[p] = net_qty.get(p, 0.0) + q * d
        net_quote[p] = net_quote.get(p, 0.0) + qt * d

    results = []
    for p in sorted(net_qty.keys()):
        q = net_qty[p]
        qt = net_quote[p]
        if abs(q) > 1e-12:  # loại bỏ giá đã bù trừ hết
            results.append([p, q, qt])

    return np.array(results, dtype=float)


def trades_frequency(trades: np.ndarray) -> np.ndarray:
    """
    Đếm số lượng lệnh buy và sell tại mỗi mức giá.

    Args:
        trades (np.ndarray): Mảng numpy gồm 4 cột: [price, quantity, quote_quantity, direction]:
            - price (float): Giá giao dịch.
            - quantity (float): Khối lượng giao dịch.
            - quote_quantity (float): Khối lượng tính bằng quote currency.
            - direction (int): 1 = buy, -1 = sell.

    Returns:
        np.ndarray: Mảng 2D [price, buy_count, sell_count], trong đó:
            - price (float): Mức giá.
            - buy_count (int): Số lượng lệnh buy tại mức giá đó.
            - sell_count (int): Số lượng lệnh sell tại mức giá đó.
    
    Ví dụ:
    ```python
    data = np.array([
        [0.1, 5, 0.5,  1],   # buy
        [0.1, 3, 0.3, -1],   # sell
        [0.2, 2, 0.4,  1],   # buy
        [0.2, 1, 0.2, -1],   # sell
        [0.2, 1, 0.2, -1],   # sell
        [0.3, 4, 1.2,  1],   # buy
        [0.4, 6, 2.4, -1],   # sell
    ])

    log.info(order_count(data))
    ```
    ```
    [[0.1 1. 1.]
    [0.2 1. 2.]
    [0.3 1. 0.]
    [0.4 0. 1.]]
    ```
    """
    if trades.size == 0:
        return np.empty((0, 3))

    prices = trades[:, 0]
    directions = trades[:, 3].astype(int)

    # chỉ giữ direction = ±1
    mask = np.isin(directions, [1, -1])
    prices = prices[mask]
    directions = directions[mask]

    unique_prices = np.unique(prices)
    result = []

    for p in unique_prices:
        mask_price = prices == p
        buy_count = np.sum(directions[mask_price] == 1)
        sell_count = np.sum(directions[mask_price] == -1)
        result.append([p, buy_count, sell_count])

    return np.array(result)


def net_trades_frequency(trades: np.ndarray) -> np.ndarray:
    """
    Tính số lệnh ròng (net order count) tại mỗi mức giá.
    
    Args:
        trades (np.ndarray): Mảng numpy gồm 4 cột: [price, quantity, quote_quantity, direction]:
            - price (float) Giá của lệnh.
            - quantity (float) Khối lượng của lệnh.
            - quote_quantity (float) Khối lượng tính bằng quote currency.
            - direction (int|float) Hướng của lệnh: 1 = buy, -1 = sell.
    
    Returns:
        np.ndarray: Mảng 2D [price, frequency],
        Trong đó:
        - price (float): Giá giao dịch.
        - net_frequency (int): Số lệnh mua - số lệnh bán tại giá đó.
    """
    if trades.size == 0:
        return np.empty((0, 2))

    prices = trades[:, 0]
    directions = trades[:, 3].astype(int)

    # chỉ giữ direction = ±1
    mask = np.isin(directions, [1, -1])
    prices = prices[mask]
    directions = directions[mask]

    unique_prices = np.unique(prices)
    result = []

    for p in unique_prices:
        mask_price = prices == p
        # frequency = số lệnh buy - số lệnh sell
        net_frequency = np.sum(directions[mask_price] == 1) - np.sum(directions[mask_price] == -1)
        result.append([p, net_frequency])

    return np.array(result)


def calc_average_trades(trades: np.ndarray) -> Optional[WeightAveragePriceVolume]:
    """
    Tính trung bình giá theo khối lượng (VWAP).
    Tính trung bình giá theo số lượng lệnh.

    Args:
        price_volumes (np.ndarray): Mảng numpy gồm 4 cột: price, quantity, quote_quantity, direction:
            - price (float) Giá của lệnh.
            - quantity (float) Khối lượng của lệnh.
            - quote_quantity (float) Khối lượng tính bằng quote currency.
            - direction (int|float) Hướng của lệnh. 1 = lệnh mua, -1 = lệnh bán.
        
    Returns:
        `WeightAveragePriceVolume`: Đối tượng chứa các thông tin trung bình. Nếu không có dữ liệu, trả về `None`.
    """
    if trades is None or len(trades) == 0:
        return None

    # Lưu raw trades để tính trade frequency và VWAP tổng
    raw_prices = trades[:, 0]
    raw_quantities = trades[:, 1]
    raw_quote_quantities = trades[:, 2]
    raw_directions = trades[:, 3].astype(int)

    # Tính trade frequency từ raw trades
    raw_buy_mask:np.ndarray = raw_directions == 1
    raw_sell_mask:np.ndarray = raw_directions == -1
    order_count_buy:float = raw_buy_mask.sum()
    order_count_sell:float = raw_sell_mask.sum()
    order_count = order_count_buy - order_count_sell

    # Tính order price từ raw trades (giá trung bình theo số lượng lệnh)
    order_price_buy = raw_prices[raw_buy_mask].mean() if order_count_buy > 0 else 0.0
    order_price_sell = raw_prices[raw_sell_mask].mean() if order_count_sell > 0 else 0.0
    order_price = raw_prices.mean() if len(raw_prices) > 0 else 0.0

    # Tính VWAP tổng từ raw trades
    total_value:float = (raw_prices * raw_quantities).sum()
    total_volume:float = raw_quantities.sum()
    price = total_value / total_volume if total_volume > 0 else 0.0
    
    # Tính high/low từ raw trades
    high_price:float = raw_prices.max() if len(raw_prices) > 0 else 0.0
    low_price:float = raw_prices.min() if len(raw_prices) > 0 else 0.0

    # Sử dụng net_volume để tính giá trung bình mua/bán và volume
    net_price_volumes = net_volume(trades)

    # Tính quote volume với dấu (+ cho mua, - cho bán)
    quote_volume_net:float = (raw_quote_quantities * raw_directions).sum()

    if net_price_volumes is None or len(net_price_volumes) == 0:
        # Nếu tất cả bù trừ nhau, vẫn trả về thông tin từ raw trades
        return WeightAveragePriceVolume(
            price_buy=order_price_buy,
            volume_buy=0.0,
            price_sell=order_price_sell,
            volume_sell=0.0,
            price=price,
            volume=0.0,
            quote_volume=quote_volume_net,
            order_price_buy=order_price_buy,
            order_count_buy=order_count_buy,
            order_price_sell=order_price_sell,
            order_count_sell=order_count_sell,
            order_price=order_price,
            order_count=order_count,
            high_price=high_price,
            low_price=low_price,
        )

    # Tính giá trung bình mua/bán từ net volumes
    net_prices = net_price_volumes[:, 0]
    net_quantities = net_price_volumes[:, 1]  # Có thể âm/dương sau bù trừ
    # net_quote_volumes = net_price_volumes[:, 2]  # Cột thứ 3 là net quote volume

    # Chia thành mua / bán dựa trên dấu của net_quantities
    net_buy_mask = net_quantities > 0  # Net volume dương = mua ròng
    net_sell_mask = net_quantities < 0  # Net volume âm = bán ròng

    # Khối lượng từ net volumes (giữ nguyên dấu)
    vol_buy:float = net_quantities[net_buy_mask].sum()  # Tổng net volume dương
    vol_sell:float = abs(net_quantities[net_sell_mask].sum())  # Tổng net volume âm (chuyển thành dương)

    # Giá trung bình theo khối lượng từ net volumes
    price_buy = (net_prices[net_buy_mask] * net_quantities[net_buy_mask]).sum() / vol_buy if vol_buy > 0 else 0.0
    price_sell = (net_prices[net_sell_mask] * abs(net_quantities[net_sell_mask])).sum() / vol_sell if vol_sell > 0 else 0.0

    # Tổng khối lượng sau bù trừ từ net volumes (có thể âm)
    volume = net_quantities.sum()  # Tổng tất cả net volumes (có dấu)

    return WeightAveragePriceVolume(
        price_buy=price_buy,
        volume_buy=vol_buy,
        price_sell=price_sell,
        volume_sell=vol_sell,
        price=price,
        volume=volume,
        quote_volume=quote_volume_net,
        order_price_buy=order_price_buy,
        order_count_buy=order_count_buy,
        order_price_sell=order_price_sell,
        order_count_sell=order_count_sell,
        order_price=order_price,
        order_count=order_count,
        high_price=high_price,
        low_price=low_price,
    )



def price_frequency(df: pd.DataFrame, mode: str = "count"):
    """
    Tính frequency của mỗi price trong DataFrame.

    Args:
        df (pd.DataFrame): DataFrame chứa các cột "price", "quantity", "quote_quantity".
        mode (str): kiểu tính frequency
            - "count"  : số lần xuất hiện (số trade)
            - "volume" : tổng quantity tại từng mức giá
            - "quote"  : tổng quote_quantity giá trị danh nghĩa tại từng mức giá

    Returns:
        pd.Series: index = price, value = frequency

    Ví dụ sử dụng:
    ```python
    data = {
        "price": [116249.33]*6,
        "quantity": [0.00005]*6,
        "quote_quantity": [5.8124665]*6
    }
    df = pd.DataFrame(data)

    log.info("Frequency theo count:\n", price_frequency(df, "count"))
    log.info("Frequency theo volume:\n", price_frequency(df, "volume"))
    log.info("Frequency theo quote:\n", price_frequency(df, "quote"))
    ```
    """
    if mode == "count":
        return df["price"].value_counts().sort_index()
    elif mode == "volume":
        return df.groupby("price")["quantity"].sum()
    elif mode == "quote":
        return df.groupby("price")["quote_quantity"].sum()
    else:
        raise ValueError("mode phải là 'count', 'volume' hoặc 'quote'")



def net_trades_frequency_df(df: pd.DataFrame, is_copy_df: bool = True) -> pd.DataFrame:
    """
    Thống kê số giao dịch ròng (quantity) và giá trị ròng (quote_quantity) tại mỗi mức giá.

    Quy tắc:
        - Nếu `is_buyer_maker` == True  → tính -1
        - Nếu `is_buyer_maker` == False → tính +1

    Các cột trả về:
        - price        : mức giá
        - quantity       : tổng số giao dịch ròng (số trade mua - số trade bán)
        - quote_quantity : price * quantity

    Args:
        df (pd.DataFrame): DataFrame chứa các cột bắt buộc:
            ["trade_id", "price", "quantity", "quote_quantity", "timestamp", "is_buyer_maker"]

    Returns:
        pd.DataFrame: DataFrame kết quả có cột ["price", "quantity", "quote_quantity"]
    
    Ví dụ sử dụng:
    ```python
        data = {
            "trade_id": [1,2,3,4,5,6],
            "price": [100,100,100,101,101,102],
            "quantity": [0.1,0.2,0.1,0.3,0.2,0.5],
            "quote_quantity": [10,20,10,30.3,20.2,51],
            "timestamp": ["t1","t2","t3","t4","t5","t6"],
            "is_buyer_maker": [True, True, False, True, False, False]
        }
        df = pd.DataFrame(data)

        stats = net_trades_frequency_df(df)
        log.info(stats)
    ```
    """
    # Gán giá trị ±1 cho từng trade
    if is_copy_df:
        df = df.copy()
    df["signed"] = df["is_buyer_maker"].apply(lambda x: -1 if x == True else 1)

    # Gom nhóm theo price
    result = (
        df.groupby("price")["signed"]
          .sum()
          .reset_index(name="quantity")
    )

    # Tính quote_quantity = price * quantity
    result["quote_quantity"] = result["price"] * result["quantity"]

    return result



@dataclass
class AvgPriceVolume:
    price: float
    volume: float
    quote_volume: float

    buy_price: float
    buy_volume: float

    sell_price: float
    sell_volume: float


def calc_avg_price_df(
    df: pd.DataFrame,
    price_col: str = "price",
    volume_col: str = "quantity",
    quote_col: str = "quote_quantity"
):
    """
    Tính các thống kê giá và khối lượng từ DataFrame giao dịch.

    Args:
        args: Tham số:
            df (pd.DataFrame): DataFrame chứa dữ liệu giao dịch.
            price_col (str): tên cột giá.
            volume_col (str): tên cột volume (có thể âm/dương).
            quote_col (str): tên cột quote_volume (nếu không có sẽ tự tính).

    Returns:
        AvgPriceVolume: Đối tượng chứa các thông tin trung bình:
            avg_price (float)          # giá trung bình toàn bộ
            net_volume (float)         # tổng volume sau bù trừ
            net_quote_volume (float)   # tổng quote sau bù trừ
            buy_avg_price (float)      # giá trung bình mua
            buy_volume (float)         # tổng khối lượng mua
            sell_avg_price (float)     # giá trung bình bán
            sell_volume (float)        # tổng khối lượng bán (số dương)
    """
    if df.empty:
        return None

    price = df[price_col]
    volume = df[volume_col]

    # nếu quote không tồn tại thì tính bằng price * volume
    if quote_col in df.columns:
        quote = df[quote_col]
    else:
        quote = price * volume

    # --- Toàn bộ ---
    net_volume = volume.sum()
    net_quote_volume = quote.sum()
    # nếu net_volume == 0 thì avg_price nằm giữa high và low
    if net_volume == 0:
        avg_price = (price.min() + price.max()) / 2
    else:
        avg_price = net_quote_volume / net_volume

    # --- Mua ---
    buy_mask = volume > 0
    buy_volume = volume[buy_mask].sum()
    buy_quote = quote[buy_mask].sum()

    # nếu buy_volume == 0 thì buy_avg_price = nằm giữa high và low của các lệnh mua
    if buy_volume > 0:
        buy_avg_price = float(buy_quote / buy_volume)
    elif buy_mask.any():
        buy_avg_price = float((price[buy_mask].min() + price[buy_mask].max()) / 2)
    else:
        buy_avg_price = 0

    # --- Bán ---
    sell_mask = volume < 0
    sell_volume = volume[sell_mask].sum()
    sell_quote = quote[sell_mask].sum()

    # nếu sell_volume == 0 thì sell_avg_price = nằm giữa high và low của các lệnh bán
    if sell_volume > 0:
        sell_avg_price = float(sell_quote / sell_volume)
    elif sell_mask.any():
        sell_avg_price = float((price[sell_mask].min() + price[sell_mask].max()) / 2)
    else:
        sell_avg_price = 0

    return AvgPriceVolume(
        price=avg_price,
        volume=net_volume,
        quote_volume=net_quote_volume,
        buy_price=buy_avg_price,
        buy_volume=buy_volume,
        sell_price=sell_avg_price,
        sell_volume=sell_volume,
    )
