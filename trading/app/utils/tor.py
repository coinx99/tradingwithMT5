from aiohttp_socks import ProxyConnector
import aiohttp
import asyncio

async def check_tor_ip(connector: ProxyConnector = None):
    if not connector:
        connector = ProxyConnector.from_url("socks5://tor:9050")  # hoặc host.docker.internal nếu gọi từ host
    async with aiohttp.ClientSession(connector=connector) as session:
        try:
            async with session.get("https://api.ipify.org", timeout=10) as resp:
                ip = await resp.text()
                print("Tor IP:", ip.strip())
                return ip.strip()
        except Exception as e:
            print("Error:", e)
            return None
        finally:
            await connector.close()
