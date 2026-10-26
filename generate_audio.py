import asyncio
import edge_tts
import os

os.makedirs("audio", exist_ok=True)

# Dialogue Script for Instagram Reel (Short, punchy, engaging)
scenes = [
    {
        "id": "scene_01",
        "text": "به پلتفرم هوشمند رشد خوش آمدید. کانون نخبه‌پروری شهید کاظم آشتیانی."
    },
    {
        "id": "scene_02",
        "text": "پنل اختصاصی دانش‌آموز، با برنامه‌ریزی، تکالیف و پومودورو."
    },
    {
        "id": "scene_03",
        "text": "بازی‌های درسی تعاملی و ماموریت‌های فضایی ریاضی برای یادگیری جذاب."
    },
    {
        "id": "scene_04",
        "text": "تفکیک کامل پرداخت شهریه کانون و هزینه سامانه با درگاه امن شاپرک."
    },
    {
        "id": "scene_05",
        "text": "حضور و غیاب تک‌لمسی معلمان و اسکن هوشمند پاسخ‌برگ با دوربین."
    },
    {
        "id": "scene_06",
        "text": "داشبورد جامع مدیریت برای ۴۵۰ دانش‌آموز و گزارش‌های مالی دقیق."
    },
    {
        "id": "scene_07",
        "text": "پلتفرم رشد، همراه هوشمند شما در مسیر نخبگی."
    }
]

async def generate_narration():
    voice = "fa-IR-FaridNeural"  # Professional energetic Iranian male voice
    for s in scenes:
        path = f"audio/{s['id']}.mp3"
        print(f"Generating audio for {s['id']}...")
        comm = edge_tts.Communicate(s['text'], voice, rate="+15%")
        await comm.save(path)
        print(f"Saved {path}")

if __name__ == "__main__":
    asyncio.run(generate_narration())
