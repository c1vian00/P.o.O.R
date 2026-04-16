import asyncio
from playwright.async_api import async_playwright
from playwright_stealth import Stealth

async def test_k_store_selection(store_id="k-citymarket-oulu-raksila"):
    async with Stealth().use_async(async_playwright()) as p:
        browser = await p.chromium.launch(headless=False, slow_mo=150)
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36"
        )
        page = await context.new_page()

        print("Navigating directly to Shop page...")
        await page.goto("https://k-ruoka.fi/kauppa", wait_until="domcontentloaded")

        try:
            print("Handling cookie banner...")
            cookie_btn = page.locator("button:has-text('Hyväksy kaikki')")
            await cookie_btn.wait_for(state="visible", timeout=5000)
            await cookie_btn.click()
            print("Cookies accepted.")
        except:
            print("No cookie banner appeared.")

        print("Opening store selector...")
        await page.locator("button[aria-label='Avaa kauppavalitsin']").click()

        print(f"Searching for: {store_id}")
        search_input = page.locator("input[placeholder*='nimellä']")
        await search_input.fill("Oulu Raksila")
        await page.keyboard.press("Enter")
        await asyncio.sleep(2)
        
        print("Selecting store...")
        selection_btn = page.locator(f"button[data-select-store='{store_id}']")
        await selection_btn.wait_for(state="visible")
        await selection_btn.dispatch_event("click")

        print("Searching Raksila inventory for Milk...")
        inventory_search = page.locator("input[aria-label='Hae kaupan valikoimasta']")
        await inventory_search.wait_for(state="visible", timeout=15000)
        await inventory_search.click()
        await inventory_search.fill("Maito")
        await page.keyboard.press("Enter")
        
        print("Extracting top deals from Raksila...")
        await page.wait_for_selector("[data-testid='product-card']", timeout=15000)
        product_cards = page.locator("[data-testid='product-card']")
        count = await product_cards.count()
        
        found_items = []
        for i in range(min(count, 5)):
            card = product_cards.nth(i)
            
            name = await card.locator("[data-testid='product-name']").inner_text()
            price = await card.locator("[data-testid='product-price']").inner_text()
            
            entry = f"{name} -> {price}"
            found_items.append(entry)
            print(f"Option {i+1}: {entry}")

        print(f"\nTotal options found for AI comparison: {len(found_items)}")

        await asyncio.sleep(10)
        await browser.close()

if __name__ == "__main__":
    asyncio.run(test_k_store_selection())
