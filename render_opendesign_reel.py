import os
import sys
import time
import json
import subprocess
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import arabic_reshaper
from bidi.algorithm import get_display

def reshape_fa(text):
    if not text:
        return ''
    return get_display(arabic_reshaper.reshape(text))

ffmpeg_exe = r'C:\Users\danyal\miniconda3\Lib\site-packages\imageio_ffmpeg\binaries\ffmpeg-win-x86_64-v7.1.exe'

# Dimensions (Instagram Reel 9:16)
W, H = 1080, 1920
FPS = 30

# Load Timing
with open('audio/timing.json', 'r', encoding='utf-8') as f:
    timing = json.load(f)

durations = timing['durations']
start_times = timing['start_times']
total_duration = 35.95
total_frames = int(total_duration * FPS)

# Fonts
font_brand = ImageFont.truetype(r'c:\Windows\Fonts\tahomabd.ttf', 24)
font_head = ImageFont.truetype(r'c:\Windows\Fonts\tahomabd.ttf', 40)
font_sub = ImageFont.truetype(r'c:\Windows\Fonts\tahoma.ttf', 24)
font_pill = ImageFont.truetype(r'c:\Windows\Fonts\tahomabd.ttf', 22)
font_counter = ImageFont.truetype(r'c:\Windows\Fonts\tahomabd.ttf', 20)
font_narration = ImageFont.truetype(r'c:\Windows\Fonts\tahomabd.ttf', 26)
font_narration_sub = ImageFont.truetype(r'c:\Windows\Fonts\tahoma.ttf', 23)

# Scenes definition
scenes = [
    {
        'id': 0,
        'shot': 'shots/01_login.png',
        'badge': reshape_fa('✨ پلتفرم جامع نخبگان ۱۴۰۳'),
        'badge_color': (37, 99, 235),
        'head': reshape_fa('سامانه هوشمند رشد و استعدادیابی'),
        'sub': reshape_fa('دسترسی مجزا برای دانش‌آموز، والد، معلم و مدیریت'),
        'card': reshape_fa('🔐 ورود یکپارچه با ۴ درگاه امن اختصاصی'),
        'glow': (79, 70, 229),
        'n1': reshape_fa('به سامانه جامع کانون شهید کاظم آشتیانی خوش آمدید.'),
        'n2': reshape_fa('پلتفرمی هوشمند برای رشد همه‌جانبه دانش‌آموزان'),
    },
    {
        'id': 1,
        'shot': 'shots/02_student_home.png',
        'badge': reshape_fa('🚀 داشبورد تعاملی دانش‌آموز'),
        'badge_color': (16, 185, 129),
        'head': reshape_fa('انگیزش روزانه و سطح‌بندی جذاب'),
        'sub': reshape_fa('نمایش تبریک ویژه تولد و پایش پیشرفت تحصیلی'),
        'card': reshape_fa('⭐ مأموریت‌های روزانه و امتیازدهی خودکار'),
        'glow': (16, 185, 129),
        'n1': reshape_fa('دانش‌آموزان با داشبورد تعاملی، سطح‌بندی جذاب'),
        'n2': reshape_fa('و تبریک ویژه تولد همراه می‌شوند'),
    },
    {
        'id': 2,
        'shot': 'shots/03_math_game.png',
        'badge': reshape_fa('🎮 بازی آموزشی و ماجراجویی فضایی'),
        'badge_color': (147, 51, 234),
        'head': reshape_fa('یادگیری مفهومی ریاضی پایه چهارم'),
        'sub': reshape_fa('تمرین و تثبیت مباحث در قالب چالش‌های کهکشانی'),
        'card': reshape_fa('🛸 مأموریت فضایی با بازخورد صوتی آنی'),
        'glow': (168, 85, 247),
        'n1': reshape_fa('آموزش مفاهیم درسی از طریق ماجراجویی فضایی'),
        'n2': reshape_fa('و بازی‌های تعاملی ریاضی'),
    },
    {
        'id': 3,
        'shot': 'shots/04_payment_dual.png',
        'badge': reshape_fa('💳 شفافیت مالی و درگاه شتاب'),
        'badge_color': (217, 119, 6),
        'head': reshape_fa('تفکیک دقیق شهریه و هزینه سامانه'),
        'sub': reshape_fa('مدیریت کامل اقساط با رسید دیجیتال و تأیید آنی'),
        'card': reshape_fa('🧾 دو بخش مجزا: شهریه کانون + هزینه سامانه'),
        'glow': (245, 158, 11),
        'n1': reshape_fa('مدیریت مالی شفاف، با تفکیک دقیق شهریه کانون'),
        'n2': reshape_fa('از هزینه خدمات سامانه'),
    },
    {
        'id': 4,
        'shot': 'shots/05_teacher_attendance.png',
        'badge': reshape_fa('📝 پنل اختصاصی اساتید'),
        'badge_color': (8, 145, 178),
        'head': reshape_fa('حضور و غیاب تک‌لمسی کلاسی'),
        'sub': reshape_fa('ثبت سریع حاضر، غایب و موجه با اطلاع‌رسانی دقیق'),
        'card': reshape_fa('⚡ ثبت سریع و آرشیو کامل سوابق کلاس'),
        'glow': (6, 182, 212),
        'n1': reshape_fa('ثبت حضور و غیاب آسان برای اساتید، با یک کلیک'),
        'n2': reshape_fa('و ثبت وضعیت دقیق هر کلاس'),
    },
    {
        'id': 5,
        'shot': 'shots/06_admin_dashboard.png',
        'badge': reshape_fa('📊 مدیریت کلان و نظارت یکپارچه'),
        'badge_color': (225, 29, 72),
        'head': reshape_fa('داشبورد مدیریتی ۴۵۰ دانش‌آموز'),
        'sub': reshape_fa('شاخص‌های کلیدی، وضعیت پرداخت‌ها و نظارت ترم'),
        'card': reshape_fa('📈 تحلیل آماری لحظه‌ای و گزارش جامع شعب'),
        'glow': (244, 63, 94),
        'n1': reshape_fa('داشبورد هوشمند مدیریت کانون با گزارش‌های آماری جامع'),
        'n2': reshape_fa('و نظارت لحظه‌ای بر کلیه امور'),
    },
    {
        'id': 6,
        'shot': 'shots/07_store.png',
        'badge': reshape_fa('🛍️ فروشگاه تخصصی سمپاد'),
        'badge_color': (202, 138, 4),
        'head': reshape_fa('تجهیزات و منابع آموزشی تیزهوشان'),
        'sub': reshape_fa('ثبت سفارش آنلاین با تخفیف ویژه اعضای کانون رشد'),
        'card': reshape_fa('🎯 همین حالا به نخبگان رشد بپیوندید'),
        'glow': (234, 179, 8),
        'n1': reshape_fa('و فروشگاه تخصصی کتاب و محتوای آموزشی تیزهوشان و سمپاد'),
        'n2': reshape_fa('همین حالا در سامانه رشد ثبت‌نام کنید'),
    }
]

# Pre-composite the phone screen mockups
phone_w, phone_h = 620, 1160
screen_w, screen_h = phone_w - 24, phone_h - 24

pre_screens = []
mask_screen = Image.new('L', (screen_w, screen_h), 0)
m_draw = ImageDraw.Draw(mask_screen)
m_draw.rounded_rectangle([0, 0, screen_w, screen_h], radius=38, fill=255)

for sc in scenes:
    img = Image.open(sc['shot']).convert('RGB')
    img_resized = img.resize((screen_w, screen_h), Image.Resampling.LANCZOS)
    
    # Create the complete phone mockup image RGBA
    phone_img = Image.new('RGBA', (phone_w, phone_h), (0, 0, 0, 0))
    p_draw = ImageDraw.Draw(phone_img)
    # Phone titanium outer border
    p_draw.rounded_rectangle([0, 0, phone_w, phone_h], radius=48, fill=(18, 24, 38, 255), outline=(71, 85, 105, 255), width=2)
    # Paste screenshot inside
    phone_img.paste(img_resized, (12, 12), mask_screen)
    # Inner border
    p_draw.rounded_rectangle([12, 12, 12 + screen_w, 12 + screen_h], radius=38, fill=None, outline=(255, 255, 255, 45), width=1)
    
    # Dynamic Island
    di_w, di_h = 144, 32
    di_x = 12 + (screen_w - di_w) // 2
    di_y = 12 + 14
    p_draw.rounded_rectangle([di_x, di_y, di_x + di_w, di_y + di_h], radius=16, fill=(0, 0, 0, 255))
    # Camera dot
    p_draw.ellipse([di_x + di_w - 24, di_y + 10, di_x + di_w - 12, di_y + 22], fill=(22, 28, 45, 255))
    
    pre_screens.append(phone_img)

# Phone shadow
shadow = Image.new('RGBA', (phone_w + 80, phone_h + 80), (0, 0, 0, 0))
sdraw = ImageDraw.Draw(shadow)
sdraw.rounded_rectangle([40, 40, phone_w + 40, phone_h + 40], radius=50, fill=(0, 0, 0, 160))
shadow = shadow.filter(ImageFilter.GaussianBlur(32))

# Pre-render radial glows for each scene
pre_glows = []
for sc in scenes:
    glow = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    gdraw = ImageDraw.Draw(glow)
    gc = sc['glow']
    gdraw.ellipse([540 - 460, 950 - 460, 540 + 460, 950 + 460], fill=(gc[0], gc[1], gc[2], 60))
    glow = glow.filter(ImageFilter.GaussianBlur(130))
    pre_glows.append(glow)

print('Pre-rendering assets complete. Initializing FFmpeg pipe...')

# Prepare FFmpeg output
output_file = 'roshd_opendesign_reel.mp4'
if os.path.exists(output_file):
    try:
        os.remove(output_file)
    except:
        pass

audio_track = 'audio/master_audio.wav'

ffmpeg_cmd = [
    ffmpeg_exe, '-y',
    '-f', 'rawvideo',
    '-vcodec', 'rawvideo',
    '-s', f'{W}x{H}',
    '-pix_fmt', 'rgb24',
    '-r', str(FPS),
    '-i', 'pipe:0',
    '-i', audio_track,
    '-c:v', 'libx264',
    '-preset', 'fast',
    '-crf', '18',
    '-c:a', 'aac',
    '-b:a', '192k',
    '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart',
    output_file
]

pipe = subprocess.Popen(ffmpeg_cmd, stdin=subprocess.PIPE, stderr=subprocess.DEVNULL)

brand_name = reshape_fa('کانون نخبه‌پروری شهید کاظم آشتیانی')
footer_tag = reshape_fa('سامانه جامع رشد • roshd-kanoon.ir')

t_start_render = time.time()

# Main render loop
for frame_idx in range(total_frames):
    t_sec = frame_idx / FPS
    
    # Identify current scene
    scene_idx = 0
    for i in range(len(scenes) - 1, -1, -1):
        if t_sec >= start_times[i]:
            scene_idx = i
            break
            
    sc = scenes[scene_idx]
    scene_start = start_times[scene_idx]
    scene_dur = durations[scene_idx]
    scene_t = t_sec - scene_start
    scene_progress = min(1.0, max(0.0, scene_t / scene_dur))
    
    # 1. Base canvas
    frame = Image.new('RGB', (W, H), (9, 13, 22))
    
    # 2. Glowing ambient aura
    frame.paste(pre_glows[scene_idx], (0, 0), pre_glows[scene_idx])
    
    draw = ImageDraw.Draw(frame)
    
    # 3. Top Story Segmented Progress Bar (Instagram Reels / Stories)
    bar_y = 55
    bar_gap = 10
    total_gap = bar_gap * 6
    bar_w = (W - 100 - total_gap) // 7
    for idx in range(7):
        bx = 50 + idx * (bar_w + bar_gap)
        if idx < scene_idx:
            # Fully watched
            draw.rounded_rectangle([bx, bar_y, bx + bar_w, bar_y + 6], radius=3, fill=(255, 255, 255))
        elif idx == scene_idx:
            # Active segment filling
            draw.rounded_rectangle([bx, bar_y, bx + bar_w, bar_y + 6], radius=3, fill=(60, 75, 100))
            active_fill_w = int(bar_w * scene_progress)
            if active_fill_w > 0:
                draw.rounded_rectangle([bx, bar_y, bx + active_fill_w, bar_y + 6], radius=3, fill=(255, 255, 255))
        else:
            # Pending segment
            draw.rounded_rectangle([bx, bar_y, bx + bar_w, bar_y + 6], radius=3, fill=(45, 55, 75))
            
    # 4. Brand Chip & Step Counter
    # Brand Pill
    draw.rounded_rectangle([250, 85, 830, 135], radius=25, fill=(19, 27, 46), outline=(255, 255, 255, 35), width=1)
    # Glowing green status light
    draw.ellipse([790, 104, 804, 118], fill=(16, 185, 129))
    draw.text((515, 110), brand_name, font=font_brand, fill=(255, 255, 255), anchor='mm')
    
    # Step counter pill (e.g., [ ۰۱ / ۰۷ ])
    counter_fa = reshape_fa(f'[ ۰{scene_idx+1} / ۰۷ ]')
    draw.rounded_rectangle([60, 85, 175, 135], radius=25, fill=(19, 27, 46), outline=(255, 255, 255, 30), width=1)
    draw.text((117, 110), counter_fa, font=font_counter, fill=(148, 163, 184), anchor='mm')
    
    # 5. Header: Category badge, Title & Subtitle
    bc = sc['badge_color']
    draw.rounded_rectangle([390, 160, 690, 202], radius=20, fill=(bc[0]//2, bc[1]//2, bc[2]//2), outline=bc, width=1)
    draw.text((540, 181), sc['badge'], font=font_pill, fill=(255, 255, 255), anchor='mm')
    
    draw.text((540, 245), sc['head'], font=font_head, fill=(255, 255, 255), anchor='mm')
    draw.text((540, 300), sc['sub'], font=font_sub, fill=(148, 163, 184), anchor='mm')
    
    # 6. Phone Mockup with Spring Entrance Animation
    base_px = (W - phone_w) // 2
    base_py = 370
    
    # Spring physics in first 0.5s of each scene
    if scene_t < 0.55:
        p_spring = scene_t / 0.55
        spring_y = 1.0 - np.exp(-7.0 * p_spring) * np.cos(9.0 * p_spring)
        cur_py = base_py + int((1.0 - spring_y) * 65.0)
    else:
        # Subtle gentle float (0.5 pixel harmonic)
        cur_py = base_py + int(4.0 * np.sin(t_sec * 2.0))
        
    cur_px = base_px
    
    # Paste shadow and phone
    frame.paste(shadow, (cur_px - 40, cur_py - 30), shadow)
    frame.paste(pre_screens[scene_idx], (cur_px, cur_py), pre_screens[scene_idx])
    
    # 7. Floating 3D Highlight Card over Phone
    # Appears at scene_t > 0.3s
    if scene_t > 0.3:
        b_time = scene_t - 0.3
        b_spring = min(1.0, 1.0 - np.exp(-8.0 * (b_time / 0.35)) * np.cos(9.0 * (b_time / 0.35)))
        
        card_w, card_h = 440, 72
        cx = (W - card_w) // 2
        cy = cur_py + phone_h - 95
        
        # Draw floating card
        draw.rounded_rectangle([cx, cy, cx + card_w, cy + card_h], radius=22, fill=(15, 23, 42), outline=sc['badge_color'], width=2)
        draw.text((cx + card_w // 2, cy + card_h // 2), sc['card'], font=font_pill, fill=(248, 250, 252), anchor='mm')
        
    # 8. Bottom Dialogue & Audio Visualizer Container
    bot_w, bot_h = 980, 235
    bot_x = 50
    bot_y = 1600
    draw.rounded_rectangle([bot_x, bot_y, bot_x + bot_w, bot_y + bot_h], radius=32, fill=(15, 23, 42), outline=(51, 65, 85), width=1)
    
    # Live dancing audio visualizer waveform (16 bars)
    for b_idx in range(16):
        # Organic wave height based on audio speech rhythm
        b_h = max(8, int(32 * abs(np.sin(frame_idx * 0.28 + b_idx * 0.65)) * np.cos(frame_idx * 0.12 + b_idx * 0.35)))
        bx_bar = bot_x + 55 + b_idx * 16
        by_bar = bot_y + 44
        draw.rounded_rectangle([bx_bar, by_bar - b_h, bx_bar + 7, by_bar + b_h], radius=3, fill=(56, 189, 248))
        
    # Narration subtitles
    draw.text((bot_x + bot_w // 2, bot_y + 110), sc['n1'], font=font_narration, fill=(255, 255, 255), anchor='mm')
    draw.text((bot_x + bot_w // 2, bot_y + 158), sc['n2'], font=font_narration_sub, fill=(148, 163, 184), anchor='mm')
    
    # Footer tag
    draw.text((bot_x + bot_w // 2, bot_y + 204), footer_tag, font=font_counter, fill=(96, 165, 250), anchor='mm')
    
    # Push frame to FFmpeg pipe
    raw_bytes = frame.tobytes('raw', 'RGB')
    pipe.stdin.write(raw_bytes)
    
    if frame_idx % 150 == 0:
        elapsed = time.time() - t_start_render
        fps_speed = (frame_idx + 1) / max(0.01, elapsed)
        pct = (frame_idx + 1) / total_frames * 100
        print(f'Rendered {frame_idx}/{total_frames} frames ({pct:.1f}%) at {fps_speed:.1f} fps...', flush=True)

pipe.stdin.close()
pipe.wait()
total_time = time.time() - t_start_render
print(f'Done! Rendered {total_frames} frames in {total_time:.2f}s ({total_frames/total_time:.1f} fps)', flush=True)
print(f'Output video created: {output_file}', flush=True)
