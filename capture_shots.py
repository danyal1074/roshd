import asyncio
import os
from playwright.async_api import async_playwright

os.makedirs("shots", exist_ok=True)

async def capture_all():
    print("Launching Chrome for mobile viewport snapshots...")
    async with async_playwright() as p:
        browser = await p.chromium.launch(channel='chrome')
        context = await browser.new_context(
            viewport={'width': 412, 'height': 870},
            device_scale_factor=2
        )
        page = await context.new_page()

        # 1. Login View
        await page.goto('http://127.0.0.1:5173')
        await page.wait_for_timeout(1500)
        await page.screenshot(path='shots/01_login.png')
        print("Captured 01_login.png")

        # 2. Student Panel - Home (with Birthday & Level Card)
        btn_student = page.locator("header button:has-text('دانش‌آموز')")
        if await btn_student.count() > 0:
            await btn_student.click()
            await page.wait_for_timeout(1500)
            await page.screenshot(path='shots/02_student_home.png')
            print("Captured 02_student_home.png")

        # 3. Student Panel - Math Game Section (Scroll down to Game Card)
        # Click on Math Game button if visible
        game_btn = page.locator("button:has-text('شروع بازی')")
        if await game_btn.count() > 0:
            await game_btn.first.click()
            await page.wait_for_timeout(1500)
            await page.screenshot(path='shots/03_math_game.png')
            print("Captured 03_math_game.png")
            # Close game modal
            close_btn = page.locator("header button[title='خروج از بازی']")
            if await close_btn.count() > 0:
                await close_btn.click()
                await page.wait_for_timeout(500)

        # 4. Student Panel - Dual Payment (Go to 'Me' -> 'Payment')
        me_nav = page.locator("nav.dock button:has-text('من')")
        if await me_nav.count() > 0:
            await me_nav.click()
            await page.wait_for_timeout(1000)
            pay_tab = page.locator(".seg-ctl button:has-text('پرداخت')")
            if await pay_tab.count() > 0:
                await pay_tab.click()
                await page.wait_for_timeout(1000)
                await page.screenshot(path='shots/04_payment_dual.png')
                print("Captured 04_payment_dual.png")

        # 5. Teacher Panel - Attendance & QR Scanner
        btn_teacher = page.locator("header button:has-text('معلم')")
        if await btn_teacher.count() > 0:
            await btn_teacher.click()
            await page.wait_for_timeout(1500)
            await page.screenshot(path='shots/05_teacher_attendance.png')
            print("Captured 05_teacher_attendance.png")

        # 6. Admin Panel - 450 Students & Dashboard
        btn_admin = page.locator("header button:has-text('مدیر')")
        if await btn_admin.count() > 0:
            await btn_admin.click()
            await page.wait_for_timeout(1500)
            await page.screenshot(path='shots/06_admin_dashboard.png')
            print("Captured 06_admin_dashboard.png")

        # 7. Store View
        btn_store = page.locator("header button:has-text('فروشگاه')")
        if await btn_store.count() > 0:
            await btn_store.click()
            await page.wait_for_timeout(1500)
            await page.screenshot(path='shots/07_store.png')
            print("Captured 07_store.png")

        await browser.close()
        print("All mobile screenshots successfully captured!")

if __name__ == '__main__':
    asyncio.run(capture_all())
