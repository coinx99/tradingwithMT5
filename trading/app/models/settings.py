from beanie import Document
from colorama import Fore

from app.utils.log import log

class Settings(Document):
    name: str

    @classmethod
    async def find_by_name(cls, *, name: str):
        return await cls.find_one({"name": name})



    class Settings:
        name = "settings"
        indexes = [
            [("name", 1)]
        ]
        use_state_management = True

    class Config:
        extra = 'allow'

setting_name = "tradingwithMT5"
async def create_settings():
    """ tạo cài đặt trong database """
    s = Settings(
        name = setting_name,
    )
    log.info(f"✔️ đã tạo settings của {setting_name}")
    await s.save()
    return s

async def load_settings():
    # lấy danh sách symbols từ database
    r = await Settings.find_by_name(name = setting_name)

    if r is None:
        err = f"🚨 {Fore.RED}không có settings trong cài đặt"
        log.warning(err)
        r = await create_settings()
    return r

