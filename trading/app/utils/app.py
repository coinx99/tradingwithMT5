import asyncio
from datetime import datetime, timezone
import os
import logging
import sys
from zoneinfo import ZoneInfo
from colorama import Fore

from .types import TIME_FORMAT
from .telegram import send_tele_message




def reload():
    """Tạo hoặc cập nhật file reload.py với thời gian hiện tại để trigger reload."""
    from datetime import datetime
    
    # Ghi thời gian hiện tại vào file reload.txt
    with open("fastapp/app/reload.py", "a") as f:
        # Lấy đường dẫn tuyệt đối của file
        file_path = os.path.abspath("fastapp/app/reload.py")
        log.info(f"{Fore.GREEN}[RELOAD] Writing to {file_path}{Fore.RESET}")
        current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        f.write(f"\"{current_time}\"\n")
        return file_path


def get_computer_name():
    import socket
    return socket.gethostname()


def get_ip_address():
    ip = None
    try:
        import socket
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
            s.connect(("8.8.8.8", 80))
            ip = s.getsockname()[0]
    except Exception as e:
        log.error(f"Error getting IP: {e}")
    return ip


# Schedule daily reload at 7 AM Bangkok time
async def schedule_daily_reload(
    hour=7, minute=0, second=0, 
    _timezone="Asia/Ho_Chi_Minh", 
    bot_token=None, chat_id=None, 
    project_name=""
):
    while True:
        now = datetime.now(ZoneInfo(_timezone))
        next_run = now.replace(hour=hour, minute=minute, second=second)
        if now.hour >= hour:
            next_run = next_run.add(days=1)

        seconds_until_next_run = (next_run - now).total_seconds()
        log.info(f"{Fore.YELLOW}[RELOAD] seconds_until_next_run={seconds_until_next_run}{Fore.RESET}")
        # chờ tới thời điểm next_run
        await asyncio.sleep(seconds_until_next_run)
        
        # send message to telegram
        if bot_token and chat_id:
            try:
                computer_name = get_computer_name()
                now = datetime.now(tz=timezone.utc)
                now_tz = now.astimezone(tz=ZoneInfo(_timezone))
                await send_tele_message(
                    bot_token=bot_token,
                    chat_id=chat_id,
                    message=f"🔄 Daily reload {project_name}: \n"
                    f"{now.strftime(f"{TIME_FORMAT} UTC")} \n"
                    f"{now_tz.strftime(f"{TIME_FORMAT} +7")} \n"
                    f"computer_name={computer_name}"
                )
            except:
                pass
        
        reload()
        await asyncio.sleep(3)


def restart_program():
    """Restart the current program."""
    os.execv(sys.executable, [sys.executable] + sys.argv)
