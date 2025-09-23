import asyncio
import json
from pathlib import Path
from playwright.async_api import async_playwright

BASE_URL_TEMPLATE = "https://www.mha.gov.in/en/media/whats-new/whats-new-archive?page={}"  # page number placeholder
OUTPUT_FILE = Path("mha_whats_new.json")
TARGET_PDF_COUNT = 648  # stop after collecting this many PDFs

async def scrape_mha_whats_new():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False)
        page = await browser.new_page()
        
        all_data = []
        page_num = 0
        
        while len(all_data) < TARGET_PDF_COUNT:
            url = BASE_URL_TEMPLATE.format(page_num)
            print(f"Scraping page {page_num}: {url}")
            await page.goto(url)
            
            # Wait for table rows
            try:
                await page.wait_for_selector("table tbody tr", timeout=10000)
            except:
                print("No table found on this page, stopping pagination.")
                break
            
            rows = await page.query_selector_all("table tbody tr")
            if not rows:
                print("No rows found on this page, stopping pagination.")
                break
            
            for row in rows:
                tds = await row.query_selector_all("td")
                if len(tds) < 4:
                    continue  # skip malformed rows
                
                # Extract title
                title_el = await tds[1].query_selector("a")
                title = await title_el.inner_text() if title_el else (await tds[1].inner_text()).strip()
                
                # Extract URL
                url_el = await tds[2].query_selector("a")
                pdf_url = await url_el.get_attribute("href") if url_el else None
                if pdf_url and pdf_url.endswith(".pdf"):
                    pdf_url = pdf_url.strip()
                    if pdf_url.startswith("/"):
                        pdf_url = "https://www.mha.gov.in" + pdf_url
                    
                    # Extract filename
                    filename = pdf_url.split("/")[-1]
                    
                    # Extract date
                    date_el = await tds[3].query_selector("time")
                    date = await date_el.inner_text() if date_el else (await tds[3].inner_text()).strip()
                    
                    all_data.append({
                        "filename": filename,
                        "title": title,
                        "date": date,
                        "url": pdf_url
                    })
                
                # Stop if reached target
                if len(all_data) >= TARGET_PDF_COUNT:
                    break
            
            page_num += 1  # go to next page
        
        # Save JSON
        OUTPUT_FILE.write_text(json.dumps(all_data, indent=2))
        print(f"Saved {len(all_data)} PDF entries to {OUTPUT_FILE}")
        
        await browser.close()

if __name__ == "__main__":
    asyncio.run(scrape_mha_whats_new())
