import asyncio
import aiohttp
import aiofiles
import json
from pathlib import Path

DATA_FOLDER = Path(r"C:\Users\Aman\OneDrive\Desktop\MHA Chatbot\mha_chatbot\data2")
DATA_FOLDER.mkdir(exist_ok=True)
JSON_FILE = Path("mha_chatbot\mha_whats_new.json")  # file from your previous scraper
CONCURRENT_DOWNLOADS = 10  # number of PDFs to download at the same time

async def download_pdf(session, pdf_info):
    url = pdf_info["url"]
    filename = pdf_info["filename"]
    save_path = DATA_FOLDER / filename

    if save_path.exists():
        print(f"Already downloaded: {filename}")
        return

    try:
        async with session.get(url) as response:
            if response.status == 200:
                f = await aiofiles.open(save_path, mode='wb')
                await f.write(await response.read())
                await f.close()
                print(f"Downloaded: {filename}")
            else:
                print(f"Failed to download {filename}: HTTP {response.status}")
    except Exception as e:
        print(f"Error downloading {filename}: {e}")

async def main():
    with open(JSON_FILE, 'r', encoding='utf-8') as f:
        pdf_list = json.load(f)

    connector = aiohttp.TCPConnector(limit=CONCURRENT_DOWNLOADS)
    async with aiohttp.ClientSession(connector=connector) as session:
        tasks = [download_pdf(session, pdf_info) for pdf_info in pdf_list]
        await asyncio.gather(*tasks)

if __name__ == "__main__":
    asyncio.run(main())
