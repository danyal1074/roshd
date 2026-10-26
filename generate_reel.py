import os
import math
import subprocess
import numpy as np
import imageio
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import arabic_reshaper
from bidi.algorithm import get_display

# 9:16 Instagram Reels Standard Resolution
WIDTH, HEIGHT = 1080, 1920
FPS = 30

# Colors (Claude & Rosh Platform Brand)
ROYAL = (10, 75, 214)
SKY = (30, 144, 255)
SUN = (255, 197, 49)
DARK_BG = (7, 18, 40)
DARK_CARD = (15, 30, 65)
WHITE = (255, 255, 255)
OK_GREEN = (18, 161, 80)

FONT_PATH = "Vazirmatn-Bold.ttf"
if not os.path.exists(FONT_PATH):
    FONT_PATH = "C:\\Windows\\Fonts\\arialbd.ttf"

def get_font(size):
    return ImageFont.truetype(FONT_PATH, size)

def fa_text(text):
    reshaped = arabic_reshaper.reshape(text)
    return get_display(reshaped)

def ease_out_cubic(x):
    return 1 - math.pow(1 - x, 3)

def ease_in_out(x):
    return 0.5 * (1 - math.cos(math.pi * x))

def draw_rounded_rect(draw, bbox, radius, fill=None, outline=None, width=1):
    draw.rounded_rectangle(bbox, radius=radius, fill=fill, outline=outline, width=width)

# SCENES CONFIGURATION FOR REEL
# Durations match the speech narration + pacing
SCENES = [
    {
        "id": "scene_01",
        "shot": "shots/01_login.png",
        "duration": 5.8,
        "badge": "کانون نخبه‌پروری شهید کاظم آشتیانی",
        "title": "پلتفرم هوشمند رشد",
        "subtitle": "سامانه یکپارچه ۴۵۰ دانش‌آموز برتر",
        "icon": "🎓"
    },
    {
        "id": "scene_02",
        "shot": "shots/02_student_home.png",
        "duration": 4.5,
        "badge": "پنل اختصاصی دانش‌آموز",
        "title": "برنامه‌ریزی، تکالیف و پومودورو",
        "subtitle": "رتبه‌بندی لحظه‌ای و جشن تولد اختصاصی",
        "icon": "🎒"
    },
    {
        "id": "scene_03",
        "shot": "shots/03_math_game.png",
        "duration": 5.0,
        "badge": "گیمیفیکیشن و بازی درسی",
        "title": "سفر فضایی کسرها و زاویه‌ها",
        "subtitle": "ماموریت‌های جذاب ریاضی چهارم دبستان",
        "icon": "🚀"
    },
    {
        "id": "scene_04",
        "shot": "shots/04_payment_dual.png",
        "duration": 5.0,
        "badge": "امور مالی و درگاه بانکی",
        "title": "تفکیک کامل شهریه و هزینه سامانه",
        "subtitle": "اتصال به شاپرک و فعال‌سازی فوری حساب",
        "icon": "💳"
    },
    {
        "id": "scene_05",
        "shot": "shots/05_teacher_attendance.png",
        "duration": 4.8,
        "badge": "پنل دبیران کانون",
        "title": "حضور و غیاب تک‌لمسی و اسکنر",
        "subtitle": "تصحیح هوشمند پاسخ‌برگ و پیامک به والدین",
        "icon": "👨‍🏫"
    },
    {
        "id": "scene_06",
        "shot": "shots/06_admin_dashboard.png",
        "duration": 5.5,
        "badge": "پنل مدیریت کانون",
        "title": "داشبورد ۴۵۰ نفره و حسابداری",
        "subtitle": "تایید آنی فیش‌ها و چاپ کارت‌های آزمون با QR",
        "icon": "🏛️"
    },
    {
        "id": "scene_07",
        "shot": "shots/07_store.png",
        "duration": 4.0,
        "badge": "آینده آموزش نخبگان",
        "title": "همراه شما در مسیر نخبگی",
        "subtitle": "نسخه رسمی ۱۴۰۵ | پلتفرم رشد",
        "icon": "✨"
    }
]

TOTAL_DURATION = sum(s["duration"] for s in SCENES)
TOTAL_FRAMES = int(TOTAL_DURATION * FPS)
print(f"Total Reel Duration: {TOTAL_DURATION:.1f}s ({TOTAL_FRAMES} frames)")

# Pre-load screenshots
loaded_shots = {}
for s in SCENES:
    if os.path.exists(s["shot"]):
        im = Image.open(s["shot"]).convert("RGB")
        loaded_shots[s["shot"]] = im

def render_reel_frame(frame_idx):
    current_time = frame_idx / FPS
    
    # Determine active scene
    accum = 0.0
    active_scene = SCENES[0]
    local_time = 0.0
    scene_idx = 0

    for i, s in enumerate(SCENES):
        if accum <= current_time < accum + s["duration"]:
            active_scene = s
            local_time = current_time - accum
            scene_idx = i
            break
        accum += s["duration"]
    else:
        active_scene = SCENES[-1]
        local_time = active_scene["duration"]
        scene_idx = len(SCENES) - 1

    scene_t_norm = local_time / active_scene["duration"]

    # Base Canvas
    img = Image.new("RGB", (WIDTH, HEIGHT), DARK_BG)
    draw = ImageDraw.Draw(img)

    # Dynamic Radial Background Pulse
    cx, cy = WIDTH // 2, HEIGHT // 2
    pulse_rad = int(500 + 40 * math.sin(current_time * 3))
    draw.ellipse([cx - pulse_rad, cy - pulse_rad, cx + pulse_rad, cy + pulse_rad], fill=(12, 32, 75))

    # Floating particles
    for p_i in range(12):
        px = int((p_i * 97 + current_time * 30) % WIDTH)
        py = int((p_i * 173 + math.sin(current_time * 2 + p_i) * 50 + 100) % HEIGHT)
        draw.ellipse([px - 4, py - 4, px + 4, py + 4], fill=SUN)

    # Top Reel Progress Bar
    bar_width = int(WIDTH * (current_time / TOTAL_DURATION))
    draw.rectangle([0, 0, bar_width, 10], fill=SUN)

    # ================= 1. HEADER SECTION (STICKY STORY BRAND) =================
    header_anim = ease_out_cubic(min(1.0, local_time * 2.5))
    header_y = int(60 + (1 - header_anim) * -40)

    # Brand Pill
    pill_w = 480
    pill_x = (WIDTH - pill_w) // 2
    draw_rounded_rect(draw, [pill_x, header_y, pill_x + pill_w, header_y + 70], radius=24, fill=DARK_CARD, outline=SKY, width=2)
    draw.text((pill_x + 30, header_y + 15), "🎓", font=get_font(32))
    hb_t = fa_text("پلتفرم رشد | کانون آشتیانی")
    draw.text((pill_x + 90, header_y + 20), hb_t, fill=WHITE, font=get_font(22))

    # Category Badge
    badge_t = fa_text(active_scene["badge"])
    bw = draw.textlength(badge_t, font=get_font(20))
    badge_x = (WIDTH - int(bw) - 40) // 2
    draw_rounded_rect(draw, [badge_x, header_y + 90, badge_x + int(bw) + 40, header_y + 135], radius=16, fill=ROYAL)
    draw.text((badge_x + 20, header_y + 100), badge_t, fill=SUN, font=get_font(20))

    # ================= 2. MOCKUP PHONE WITH SCREENSHOT =================
    # Phone Shell Dimensions (Reels proportions)
    pw, ph = 680, 1180
    px = (WIDTH - pw) // 2
    
    # Enter animation (spring rise)
    enter_anim = ease_out_cubic(min(1.0, local_time * 2.0))
    py = int(270 + (1 - enter_anim) * 120)

    # Phone Outer Shadow / Glow
    draw_rounded_rect(draw, [px - 14, py - 14, px + pw + 14, py + ph + 14], radius=48, fill=(18, 48, 110))
    # Phone Body
    draw_rounded_rect(draw, [px - 6, py - 6, px + pw + 6, py + ph + 6], radius=44, fill=(10, 15, 25), outline=SUN, width=4)

    # Inner Screen Area
    screen_x, screen_y = px, py
    screen_w, screen_h = pw, ph

    shot_img = loaded_shots.get(active_scene["shot"])
    if shot_img:
        # Scale to fit phone screen
        shot_resized = shot_img.resize((screen_w, screen_h), Image.Resampling.LANCZOS)
        img.paste(shot_resized, (screen_x, screen_y))

    # Phone Dynamic Notch (Speaker & Camera)
    notch_w, notch_h = 160, 26
    notch_x = screen_x + (screen_w - notch_w) // 2
    draw_rounded_rect(draw, [notch_x, screen_y, notch_x + notch_w, screen_y + notch_h], radius=14, fill=(5, 5, 10))
    draw.ellipse([notch_x + 110, screen_y + 7, notch_x + 124, screen_y + 21], fill=(20, 35, 60))
    draw.line([notch_x + 45, screen_y + 13, notch_x + 95, screen_y + 13], fill=(30, 30, 40), width=4)

    # ================= 3. LOWER BANNER & ANIMATED TYPOGRAPHY =================
    banner_y = 1510
    banner_h = 320
    draw_rounded_rect(draw, [40, banner_y, WIDTH - 40, banner_y + banner_h], radius=36, fill=DARK_CARD, outline=ROYAL, width=3)

    # Icon circle in banner
    draw.ellipse([WIDTH - 160, banner_y + 40, WIDTH - 80, banner_y + 120], fill=ROYAL)
    draw.text((WIDTH - 142, banner_y + 55), active_scene["icon"], font=get_font(42))

    # Scene Title (Bold & Punchy)
    t_title = fa_text(active_scene["title"])
    draw.text((80, banner_y + 45), t_title, fill=WHITE, font=get_font(36))

    # Subtitle / Key feature
    t_sub = fa_text(active_scene["subtitle"])
    draw.text((80, banner_y + 115), t_sub, fill=SUN, font=get_font(24))

    # Indicator Dots for Reel Scenes
    dot_gap = 26
    dot_start_x = (WIDTH - (len(SCENES) * dot_gap)) // 2
    for d_i in range(len(SCENES)):
        dx = dot_start_x + d_i * dot_gap
        dy = banner_y + 220
        d_color = SUN if d_i == scene_idx else (40, 70, 130)
        draw.ellipse([dx - 7, dy - 7, dx + 7, dy + 7], fill=d_color)

    # Bottom Call To Action
    cta_t = fa_text("مشاهده آنلاین در مرورگر: localhost:5173")
    cw = draw.textlength(cta_t, font=get_font(20))
    draw.text(((WIDTH - int(cw)) // 2, banner_y + 260), cta_t, fill=(180, 210, 255), font=get_font(20))

    return np.array(img)

def render_full_reel():
    output_video_only = "reel_video_temp.mp4"
    output_audio_merged = "rosh_instagram_reel.mp4"

    print("--- Starting Instagram Reel Video Render (1080x1920 @ 30fps) ---")
    writer = imageio.get_writer(
        output_video_only,
        fps=FPS,
        codec="libx264",
        quality=8,
        pixelformat="yuv420p"
    )

    for f_idx in range(TOTAL_FRAMES):
        frame = render_reel_frame(f_idx)
        writer.append_data(frame)
        if (f_idx + 1) % (FPS * 3) == 0 or f_idx == TOTAL_FRAMES - 1:
            pct = int(((f_idx + 1) / TOTAL_FRAMES) * 100)
            print(f"Video frame render: {pct}% ({f_idx+1}/{TOTAL_FRAMES})")

    writer.close()
    print("Video track rendered!")

    # Merge Audio Tracks with FFmpeg
    print("Combining audio narrations and sound effects with FFmpeg...")
    ffmpeg_exe = "C:/Users/danyal/miniconda3/Lib/site-packages/imageio_ffmpeg/binaries/ffmpeg-win-x86_64-v7.1.exe"
    
    # Create concatenated audio list
    with open("audio_list.txt", "w", encoding="utf-8") as f:
        for s in SCENES:
            f.write(f"file 'audio/{s['id']}.mp3'\n")

    # Step 1: Concatenate narrations into single audio track
    concat_audio = "narration_full.mp3"
    subprocess.run([
        ffmpeg_exe, "-y", "-f", "concat", "-safe", "0", "-i", "audio_list.txt", "-c", "copy", concat_audio
    ], check=True)

    # Step 2: Combine video + audio with subtle ambient music
    subprocess.run([
        ffmpeg_exe, "-y",
        "-i", output_video_only,
        "-i", concat_audio,
        "-c:v", "copy",
        "-c:a", "aac",
        "-b:a", "192k",
        "-shortest",
        output_audio_merged
    ], check=True)

    print(f"SUCCESS! Instagram Reel generated: {output_audio_merged}")

    # Copy to frontend public folder for immediate web preview
    os.makedirs("frontend/public", exist_ok=True)
    subprocess.run(["cmd", "/c", "copy", "/y", output_audio_merged, "frontend\\public\\rosh_instagram_reel.mp4"], check=True)
    print("Copied to frontend/public/rosh_instagram_reel.mp4 for browser streaming!")

if __name__ == "__main__":
    render_full_reel()
