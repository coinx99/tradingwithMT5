
from colorama import Fore
import requests
from . import log

async def send_tele_message(bot_token:str, chat_id:str, message:str = "done"):
    url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
    # Dữ liệu yêu cầu
    data = {
        "chat_id": chat_id,
        "text": message
    }
    # Gửi yêu cầu tới Telegram API
    response = requests.post(url, data=data)

    # Kiểm tra xem yêu cầu có thành công không
    if response.status_code == 200:
        log.info("Tin nhắn đã được gửi tele thành công!")
        msg = {"status": f"Tin nhắn đã được gửi tele thành công!", "data": data}
    else:
        log.error(f"{Fore.RED}Lỗi khi gửi tin nhắn tele: {response.status_code}, {response.text}")
        msg = {"error": f"Lỗi khi gửi tin nhắn tele: {response.status_code}", "data": response.text}
