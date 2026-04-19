import asyncio
import re
from playwright.async_api import async_playwright
from playwright_stealth import Stealth

async def fetch_ingredient_prices(store_id: str, ingredients: list):
    results = {}
    
    async with Stealth().use_async(async_playwright()) as p:
        browser = await p.chromium.launch(headless=True, slow_mo=50)
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36"
        )
        page = await context.new_page()

        try:
            print("Navigating to K-Ruoka...")
            await page.goto("https://k-ruoka.fi/kauppa", wait_until="domcontentloaded")

            try:
                cookie_btn = page.locator("button:has-text('Hyväksy kaikki')")
                await cookie_btn.wait_for(state="visible", timeout=3000)
                await cookie_btn.click()
            except:
                pass

            print(f"Selecting store: {store_id}")
            await page.locator("button[aria-label='Avaa kauppavalitsin']").click()
            
            search_input = page.locator("input[placeholder*='nimellä']")
            readable_store = " ".join(store_id.split("-")[-2:]).title() 
            await search_input.fill(readable_store)
            await page.keyboard.press("Enter")
            await asyncio.sleep(1.5)
            
            selection_btn = page.locator(f"button[data-select-store='{store_id}']")
            await selection_btn.wait_for(state="visible")
            await selection_btn.dispatch_event("click")

            await asyncio.sleep(2)

            inventory_search = page.locator("input[aria-label='Hae kaupan valikoimasta']")
            
            for item in ingredients:
                print(f"Searching for ingredient: {item}")
                await inventory_search.click()
                await inventory_search.fill(item)
                await page.keyboard.press("Enter")
                
                try:
                    await page.wait_for_selector("[data-testid='product-card']", timeout=5000)
                    product_cards = page.locator("[data-testid='product-card']")
                    
                    count = await product_cards.count()
                    item_options = []
                    
                    for i in range(min(count, 2)):
                        card = product_cards.nth(i)
                        name = await card.locator("[data-testid='product-name']").inner_text()
                        raw_price = await card.locator("[data-testid='product-price']").inner_text()
                        price_match = re.search(r'\d+(?:,\d+)?\s*€', raw_price)
                        clean_price = price_match.group(0) if price_match else raw_price

                        item_options.append({"name": name, "price": clean_price})
                        
                    results[item] = item_options
                except Exception as e:
                    print(f"Could not find {item} or timed out.")
                    results[item] = []
                
                await page.locator("button[aria-label='Tyhjennä haku']").click()
                await asyncio.sleep(1)

        finally:
            await browser.close()
            
    return results