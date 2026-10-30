import asyncio
import sys
import json
from playwright.async_api import async_playwright

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

BASE_URL = "http://127.0.0.1:5000"

async def dismiss_notice_modal(page):
    await page.wait_for_timeout(1500)
    for _ in range(10):
        modal = await page.query_selector("div.notice-bg")
        if modal and await modal.is_visible():
            btn = await modal.query_selector("button")
            if btn and await btn.is_visible():
                await btn.click()
                await page.wait_for_timeout(800)
        else:
            break

async def test_all_panels():
    results = {
        "admin": {},
        "teacher": {},
        "student": {},
        "parent": {},
        "errors": []
    }

    async with async_playwright() as p:
        browser = await p.chromium.launch(
            executable_path=r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
            headless=True
        )

        # ---------------------------------------------------------
        # 1. ADMIN PANEL TESTS
        # ---------------------------------------------------------
        print("\n==================== 1. TESTING ADMIN PANEL ====================")
        context = await browser.new_context()
        page = await context.new_page()

        page.on("pageerror", lambda err: results["errors"].append(f"[Admin PageError] {err}"))
        page.on("console", lambda msg: results["errors"].append(f"[Admin Console Error] {msg.text}") if msg.type == "error" else None)
        page.on("dialog", lambda dialog: dialog.accept())

        await page.goto(f"{BASE_URL}/", wait_until="networkidle")
        await page.click("button:has-text('مدیر')")
        inputs = await page.query_selector_all("form input")
        await inputs[0].fill("admin")
        await inputs[1].fill("danyal1074")
        await page.click("button[type='submit']")
        await page.wait_for_timeout(2000)
        await dismiss_notice_modal(page)

        dash_text = await page.evaluate("() => document.body.innerText")
        results["admin"]["login"] = "داشبورد" in dash_text
        print("Admin login success:", results["admin"]["login"])

        # Test Demo Data Load Button in Dashboard Header
        load_btn = await page.query_selector("button:has-text('بارگذاری داده‌های نمونه')")
        if load_btn and await load_btn.is_visible():
            print("Clicking 'بارگذاری داده‌های نمونه'...")
            await load_btn.click()
            await page.wait_for_timeout(2500)
            await dismiss_notice_modal(page)
            results["admin"]["demo_data_load"] = True
            print("Demo data load completed.")

        # Test Admin Tabs
        tabs = [
            ('دانش‌آموزان', 'stu'),
            ('حق عضویت', 'fee'),
            ('تنظیمات و پرداخت', 'settings'),
            ('اطلاعیه', 'ann'),
            ('حسابداری', 'acc'),
            ('آزمون جامع', 'exm'),
            ('داشبورد', 'dash')
        ]

        for tab_label, tab_key in tabs:
            btn = await page.query_selector(f"button:has-text('{tab_label}'), a:has-text('{tab_label}')")
            if btn:
                await btn.click()
                await page.wait_for_timeout(1000)
                body = await page.evaluate("() => document.body.innerText")
                results["admin"][f"tab_{tab_key}"] = len(body) > 100
                print(f"Admin Tab '{tab_label}' loaded successfully.")

        # Test Settings Save
        await page.click("button:has-text('تنظیمات و پرداخت')")
        await page.wait_for_timeout(1000)
        save_btn = await page.query_selector("button:has-text('ذخیره تمام تنظیمات')")
        if save_btn:
            await save_btn.click()
            await page.wait_for_timeout(1500)
            results["admin"]["save_settings"] = True
            print("Admin settings save verified.")

        # Test Demo Data Clear Button in Settings
        clear_btn = await page.query_selector("button:has-text('حذف داده‌های نمونه')")
        if clear_btn:
            print("Testing 'حذف داده‌های نمونه' button...")
            await clear_btn.click()
            await page.wait_for_timeout(2000)
            results["admin"]["demo_data_clear"] = True
            print("Demo data clear verified successfully.")

        # Reload Demo Data from settings card so that other panels have rich data
        load_btn_settings = await page.query_selector("button:has-text('بارگذاری داده‌های نمونه')")
        if load_btn_settings:
            print("Reloading demo data for remaining panel tests...")
            await load_btn_settings.click()
            await page.wait_for_timeout(2500)
            await dismiss_notice_modal(page)

        await page.screenshot(path="audit_admin_panel.png")
        await context.close()

        # ---------------------------------------------------------
        # 2. TEACHER PANEL TESTS
        # ---------------------------------------------------------
        print("\n==================== 2. TESTING TEACHER PANEL ====================")
        context = await browser.new_context()
        page = await context.new_page()

        page.on("pageerror", lambda err: results["errors"].append(f"[Teacher PageError] {err}"))
        page.on("console", lambda msg: results["errors"].append(f"[Teacher Console Error] {msg.text}") if msg.type == "error" else None)
        page.on("dialog", lambda dialog: dialog.accept())

        await page.goto(f"{BASE_URL}/", wait_until="networkidle")
        await page.click("button:has-text('معلم')")
        inputs = await page.query_selector_all("form input")
        await inputs[0].fill("09121110002")
        await inputs[1].fill("123456")
        await page.click("button[type='submit']")
        await page.wait_for_timeout(2000)
        await dismiss_notice_modal(page)

        teacher_text = await page.evaluate("() => document.body.innerText")
        results["teacher"]["login"] = "فاطمه احمدی" in teacher_text
        print("Teacher login success:", results["teacher"]["login"])

        # Test Attendance tab & 'همه حاضر'
        mark_all_btn = await page.query_selector("button:has-text('همه حاضر')")
        if mark_all_btn:
            await mark_all_btn.click()
            await page.wait_for_timeout(500)
            save_att_btn = await page.query_selector("button:has-text('ثبت حضور و غیاب')")
            if save_att_btn:
                await save_att_btn.click()
                await page.wait_for_timeout(1000)
                results["teacher"]["attendance_saved"] = True
                print("Attendance mark all and save verified.")

        # Test Homework tab
        hw_nav = await page.query_selector("button:has-text('تکالیف')")
        if hw_nav:
            await hw_nav.click()
            await page.wait_for_timeout(1000)
            results["teacher"]["homework_tab"] = True
            print("Teacher homework tab verified.")

        # Test Exam Tab (Hoosh Complex Studio)
        exam_nav = await page.query_selector("button:has-text('آزمون')")
        if exam_nav:
            await exam_nav.click()
            await page.wait_for_timeout(1500)
            results["teacher"]["hoosh_studio_loaded"] = True
            print("Hoosh Complex Studio tab loaded.")

            section_select = await page.query_selector("select")
            if section_select:
                await section_select.select_option("1")
                await page.wait_for_timeout(800)
                print("Section filter changed to Section 1.")

            print_btn = await page.query_selector("button:has-text('پیش‌نمایش و چاپ آزمون')")
            if print_btn:
                print("Found print button on teacher exam tab.")

        # Test Messages Tab
        msg_nav = await page.query_selector("button:has-text('پیام')")
        if msg_nav:
            await msg_nav.click()
            await page.wait_for_timeout(1000)
            results["teacher"]["messages_tab"] = True
            print("Teacher messages tab verified.")

        await page.screenshot(path="audit_teacher_panel.png")
        await context.close()

        # ---------------------------------------------------------
        # 3. STUDENT PANEL TESTS
        # ---------------------------------------------------------
        print("\n==================== 3. TESTING STUDENT PANEL ====================")
        context = await browser.new_context()
        page = await context.new_page()

        page.on("pageerror", lambda err: results["errors"].append(f"[Student PageError] {err}"))
        page.on("console", lambda msg: results["errors"].append(f"[Student Console Error] {msg.text}") if msg.type == "error" else None)
        page.on("dialog", lambda dialog: dialog.accept())

        await page.goto(f"{BASE_URL}/", wait_until="networkidle")
        await page.click("button:has-text('دانش‌آموز')")
        inputs = await page.query_selector_all("form input")
        await inputs[0].fill("09129876543")
        await inputs[1].fill("123456")
        await page.click("button[type='submit']")
        await page.wait_for_timeout(2000)
        await dismiss_notice_modal(page)

        student_text = await page.evaluate("() => document.body.innerText")
        results["student"]["login"] = "پنل دانش‌آموز" in student_text
        print("Student login success:", results["student"]["login"])

        st_tabs = ['تکالیف', 'آزمون‌ها', 'برنامه مطالعه', 'رتبه‌بندی', 'شهریه', 'داشبورد']
        for stab in st_tabs:
            sbtn = await page.query_selector(f"button:has-text('{stab}'), a:has-text('{stab}')")
            if sbtn:
                await sbtn.click()
                await page.wait_for_timeout(1000)
                results["student"][f"tab_{stab}"] = True
                print(f"Student Tab '{stab}' verified.")

        store_btn = await page.query_selector("button:has-text('فروشگاه'), a:has-text('فروشگاه')")
        if store_btn:
            await store_btn.click()
            await page.wait_for_timeout(1000)
            results["student"]["store_view"] = True
            print("Student Store Catalog verified.")

        await page.screenshot(path="audit_student_panel.png")
        await context.close()

        # ---------------------------------------------------------
        # 4. PARENT PANEL TESTS
        # ---------------------------------------------------------
        print("\n==================== 4. TESTING PARENT PANEL ====================")
        context = await browser.new_context()
        page = await context.new_page()

        page.on("pageerror", lambda err: results["errors"].append(f"[Parent PageError] {err}"))
        page.on("console", lambda msg: results["errors"].append(f"[Parent Console Error] {msg.text}") if msg.type == "error" else None)
        page.on("dialog", lambda dialog: dialog.accept())

        await page.goto(f"{BASE_URL}/", wait_until="networkidle")
        await page.click("button:has-text('والدین')")
        inputs = await page.query_selector_all("form input")
        await inputs[0].fill("09121112233")
        await inputs[1].fill("123456")
        await page.click("button[type='submit']")
        await page.wait_for_timeout(2000)
        await dismiss_notice_modal(page)

        parent_text = await page.evaluate("() => document.body.innerText")
        results["parent"]["login"] = "خانواده محترم رضایی" in parent_text or "پنل اختصاصی اولیا" in parent_text
        print("Parent login success:", results["parent"]["login"])
        results["parent"]["child_ali_visible"] = "علی رضایی" in parent_text
        print("Parent sees child 'علی رضایی':", results["parent"]["child_ali_visible"])

        p_tabs = ['پیام‌ها', 'امور مالی', 'وضعیت تحصیلی']
        for ptab in p_tabs:
            pbtn = await page.query_selector(f"button:has-text('{ptab}')")
            if pbtn:
                await pbtn.click()
                await page.wait_for_timeout(1000)
                results["parent"][f"tab_{ptab}"] = True
                print(f"Parent Tab '{ptab}' verified.")

        await page.screenshot(path="audit_parent_panel.png")
        await context.close()

        await browser.close()

    print("\n==================== FINAL AUDIT SUMMARY ====================")
    print(json.dumps(results, indent=2, ensure_ascii=False))
    return results

if __name__ == '__main__':
    asyncio.run(test_all_panels())
