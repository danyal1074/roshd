import os
import math
import numpy as np
import imageio
from PIL import Image, ImageDraw, ImageFont
import arabic_reshaper
from bidi.algorithm import get_display

# 1920x1080 Full HD 60fps Motion Graphic
WIDTH, HEIGHT = 1920, 1080
FPS = 30
DURATION_SEC = 24  # 24 seconds comprehensive motion graphic
TOTAL_FRAMES = FPS * DURATION_SEC

# Colors (Claude Design System)
ROYAL = (10, 75, 214)
SKY = (30, 144, 255)
SUN = (255, 197, 49)
DARK_BG = (7, 18, 40)
DARK_CARD = (15, 30, 65)
WHITE = (255, 255, 255)
OK_GREEN = (18, 161, 80)
MIST = (245, 248, 255)

FONT_PATH = "Vazirmatn-Bold.ttf"
if not os.path.exists(FONT_PATH):
    FONT_PATH = "C:\\Windows\\Fonts\\arialbd.ttf"

def get_font(size):
    return ImageFont.truetype(FONT_PATH, size)

def fa_text(text):
    """Reshape and apply BiDi algorithm for RTL Persian text."""
    reshaped = arabic_reshaper.reshape(text)
    return get_display(reshaped)

def ease_out_cubic(x):
    return 1 - math.pow(1 - x, 3)

def ease_in_out(x):
    return 0.5 * (1 - math.cos(math.pi * x))

def draw_rounded_rect(draw, bbox, radius, fill=None, outline=None, width=1):
    draw.rounded_rectangle(bbox, radius=radius, fill=fill, outline=outline, width=width)

# SCENES TIMELINE (in seconds)
# Scene 1: 0 - 4s: Intro & Brand Title (کانون نخبه‌پروری شهید کاظم آشتیانی - پلتفرم رشد)
# Scene 2: 4 - 8s: 4 Roles in 1 Platform (دانش‌آموز، دبیر، والدین، مدیر کانون - ۴۵۰ دانش‌آموز)
# Scene 3: 8 - 13s: Features: Attendance, Online Exams, Pomodoro Timer, Leaderboard
# Scene 4: 13 - 17s: Grade 4 Math Interactive Adventure Game (سفر فضایی کسرها و زاویه‌ها)
# Scene 5: 17 - 21s: Dual Payment (شهریه دوره کانون و هزینه سامانه رشد با شاپرک)
# Scene 6: 21 - 24s: Outro & Call to Action (پلتفرم رشد - نسخه رسمی ۱۴۰۵)

def render_frame(frame_idx):
    t = frame_idx / FPS
    img = Image.new("RGB", (WIDTH, HEIGHT), DARK_BG)
    draw = ImageDraw.Draw(img)

    # Ambient Background Animated Glowing Particles & Grid
    for i in range(16):
        px = int((i * 137 + t * 40) % WIDTH)
        py = int((i * 89 + math.sin(t + i) * 60 + 200) % HEIGHT)
        alpha_rad = int(25 + 15 * math.sin(t * 2 + i))
        draw.ellipse([px - alpha_rad, py - alpha_rad, px + alpha_rad, py + alpha_rad], fill=(18, 45, 95))

    # Dynamic Top Branding Watermark (All scenes except Scene 1)
    if t > 4:
        draw_rounded_rect(draw, [60, 40, 460, 105], radius=20, fill=DARK_CARD, outline=(30, 80, 160), width=2)
        draw.text((370, 52), fa_text("پلتفرم رشد"), fill=SUN, font=get_font(28))
        draw.text((80, 60), fa_text("کانون نخبه‌پروری آشتیانی"), fill=WHITE, font=get_font(18))

    # ================= SCENE 1: INTRO (0 - 4s) =================
    if 0 <= t < 4:
        local_t = t / 4.0
        anim = ease_out_cubic(min(1.0, local_t * 1.5))
        
        # Central glowing crest
        crest_size = int(120 * anim)
        cx, cy = WIDTH // 2, HEIGHT // 2 - 80
        draw.ellipse([cx - crest_size, cy - crest_size, cx + crest_size, cy + crest_size], fill=ROYAL, outline=SKY, width=4)
        
        # Golden Star inside
        draw.text((cx - 30, cy - 40), "🎓", fill=SUN, font=get_font(60))

        # Title Fade & Rise
        y_offset = int((1 - anim) * 50)
        t1 = fa_text("پـلـتـفـرم رشـــــد")
        w1 = draw.textlength(t1, font=get_font(64))
        draw.text(((WIDTH - w1) // 2, HEIGHT // 2 + 70 + y_offset), t1, fill=WHITE, font=get_font(64))

        t2 = fa_text("سامانه یکپارچه کانون نخبه‌پروری شهید کاظم آشتیانی")
        w2 = draw.textlength(t2, font=get_font(30))
        draw.text(((WIDTH - w2) // 2, HEIGHT // 2 + 165 + y_offset), t2, fill=SUN, font=get_font(30))

        t3 = fa_text("طراحی اختصاصی برای ۴۵۰ دانش‌آموز برتر، دبیران، مدیران و اولیا")
        w3 = draw.textlength(t3, font=get_font(22))
        draw.text(((WIDTH - w3) // 2, HEIGHT // 2 + 225 + y_offset), t3, fill=(180, 205, 245), font=get_font(22))

    # ================= SCENE 2: 4 ROLES & 450 STUDENTS (4 - 8s) =================
    elif 4 <= t < 8:
        local_t = (t - 4) / 4.0
        
        # Header
        th = fa_text("چهار پنل هوشمند و یکپارچه در یک سامانه")
        wh = draw.textlength(th, font=get_font(44))
        draw.text(((WIDTH - wh) // 2, 140), th, fill=WHITE, font=get_font(44))

        roles = [
            ("دانش‌آموز", "تکالیف، آزمون آنلاین، پومودورو و بازی", (10, 75, 214), "🎒"),
            ("دبیران", "حضور و غیاب تک‌لمسی و اسکن پاسخ‌برگ", (30, 144, 255), "👨‍🏫"),
            ("مدیر کانون", "داشبورد ۴۵۰ نفره، حسابداری و تایید فیش", (255, 197, 49), "🏛️"),
            ("والدین", "کارنامه تحصیلی، گزارش غیبت و پیامک آنی", (18, 161, 80), "👨‍👩‍👦")
        ]

        card_w, card_h = 380, 480
        gap = 40
        start_x = (WIDTH - (4 * card_w + 3 * gap)) // 2
        card_y = 260

        for idx, (title, desc, color, icon) in enumerate(roles):
            # Staggered animation
            card_anim = ease_out_cubic(max(0.0, min(1.0, (local_t * 4.0 - idx * 0.4))))
            cur_y = card_y + int((1 - card_anim) * 80)
            cur_x = start_x + idx * (card_w + gap)

            if card_anim > 0:
                draw_rounded_rect(draw, [cur_x, cur_y, cur_x + card_w, cur_y + card_h], radius=28, fill=DARK_CARD, outline=color, width=3)
                # Icon circle
                draw.ellipse([cur_x + 130, cur_y + 45, cur_x + 250, cur_y + 165], fill=color)
                draw.text((cur_x + 160, cur_y + 70), icon, font=get_font(52))

                # Role Title
                rt = fa_text(title)
                rw = draw.textlength(rt, font=get_font(34))
                draw.text((cur_x + (card_w - rw) // 2, cur_y + 200), rt, fill=WHITE, font=get_font(34))

                # Role Description
                rd = fa_text(desc)
                rw2 = draw.textlength(rd, font=get_font(18))
                draw.text((cur_x + (card_w - rw2) // 2, cur_y + 270), rd, fill=(200, 220, 255), font=get_font(18))

                # Tag badge
                draw_rounded_rect(draw, [cur_x + 60, cur_y + 360, cur_x + card_w - 60, cur_y + 420], radius=16, fill=(25, 45, 90))
                tag_t = fa_text("نسخه رسمی ۱۴۰۵")
                tag_w = draw.textlength(tag_t, font=get_font(16))
                draw.text((cur_x + (card_w - tag_w) // 2, cur_y + 378), tag_t, fill=SUN, font=get_font(16))

    # ================= SCENE 3: STUDENT & TEACHER CAPABILITIES (8 - 13s) =================
    elif 8 <= t < 13:
        local_t = (t - 8) / 5.0
        
        # Header
        th = fa_text("امکانات تخصصی: تایمر پومودورو، آزمون هوشمند و اسکنر پاسخ‌برگ")
        wh = draw.textlength(th, font=get_font(38))
        draw.text(((WIDTH - wh) // 2, 130), th, fill=SUN, font=get_font(38))

        # Left Card: Interactive Pomodoro & Leaderboard
        lx, ly, lw, lh = 140, 230, 780, 720
        draw_rounded_rect(draw, [lx, ly, lx + lw, ly + lh], radius=32, fill=DARK_CARD, outline=SKY, width=2)
        
        # Pomodoro Ring
        pomo_anim = ease_out_cubic(min(1.0, local_t * 1.8))
        pomo_cx, pomo_cy = lx + 390, ly + 250
        rad = 140
        draw.ellipse([pomo_cx - rad, pomo_cy - rad, pomo_cx + rad, pomo_cy + rad], outline=(40, 75, 140), width=16)
        
        # Ring arc
        end_angle = int(-90 + 360 * pomo_anim)
        draw.arc([pomo_cx - rad, pomo_cy - rad, pomo_cx + rad, pomo_cy + rad], start=-90, end=end_angle, fill=SUN, width=16)
        
        time_text = fa_text("۲۵:۰۰")
        tw = draw.textlength(time_text, font=get_font(48))
        draw.text((pomo_cx - tw // 2, pomo_cy - 40), time_text, fill=WHITE, font=get_font(48))
        draw.text((pomo_cx - 40, pomo_cy + 25), fa_text("حالت تمرکز"), fill=SKY, font=get_font(20))

        # Bottom study progress
        draw.text((lx + 60, ly + 460), fa_text("برترین‌های مطالعه کانون:"), fill=WHITE, font=get_font(24))
        draw_rounded_rect(draw, [lx + 60, ly + 510, lx + lw - 60, ly + 580], radius=16, fill=(20, 45, 95))
        draw.text((lx + 90, ly + 530), fa_text("🥇 رتبه ۱: علی رضایی (۱۵۰ دقیقه مطالعه)"), fill=SUN, font=get_font(20))
        draw_rounded_rect(draw, [lx + 60, ly + 600, lx + lw - 60, ly + 670], radius=16, fill=(20, 45, 95))
        draw.text((lx + 90, ly + 620), fa_text("🥈 رتبه ۲: پارسا نجفی (۱۳۵ دقیقه مطالعه)"), fill=WHITE, font=get_font(20))

        # Right Card: Teacher Scanner & Instant Attendance
        rx, ry, rw, rh = 1000, 230, 780, 720
        draw_rounded_rect(draw, [rx, ry, rx + rw, ry + rh], radius=32, fill=DARK_CARD, outline=ROYAL, width=2)
        
        draw.text((rx + 60, ry + 50), fa_text("شبیه‌ساز اسکنر پاسخ‌برگ با دوربین گوشی"), fill=WHITE, font=get_font(26))
        
        # Scanner viewfinder
        vx, vy, vw, vh = rx + 140, ry + 120, 500, 420
        draw_rounded_rect(draw, [vx, vy, vx + vw, vy + vh], radius=24, fill=(10, 20, 45), outline=SKY, width=2)
        
        # Scanner animated laser line
        scan_y = vy + int(vh * (0.5 + 0.45 * math.sin(t * 5)))
        draw.line([vx + 20, scan_y, vx + vw - 20, scan_y], fill=SUN, width=4)
        
        draw.text((vx + 160, vy + 170), fa_text("کارت آزمون دانش‌آموز"), fill=(150, 180, 220), font=get_font(22))
        
        # Result badge
        draw_rounded_rect(draw, [rx + 60, ry + 570, rx + rw - 60, ry + 670], radius=20, fill=OK_GREEN)
        res_t = fa_text("✓ تصحیح آنی: نمره ۱۹ از ۲۰ (۹۵٪ قبولی سمپاد)")
        res_w = draw.textlength(res_t, font=get_font(22))
        draw.text((rx + (rw - res_w) // 2, ry + 605), res_t, fill=WHITE, font=get_font(22))

    # ================= SCENE 4: 4TH GRADE MATH INTERACTIVE GAME (13 - 17s) =================
    elif 13 <= t < 17:
        local_t = (t - 13) / 4.0

        # Header
        th = fa_text("بازی درسی اختصاصی: سفر فضایی کسرها و زاویه‌ها (ریاضی ۴ دبستان)")
        wh = draw.textlength(th, font=get_font(38))
        draw.text(((WIDTH - wh) // 2, 130), th, fill=SUN, font=get_font(38))

        # Rocket / Space Mission Animation
        gx, gy, gw, gh = 240, 230, 1440, 720
        draw_rounded_rect(draw, [gx, gy, gx + gw, gy + gh], radius=36, fill=DARK_CARD, outline=(255, 197, 49), width=3)

        # Spaceship Icon animated flying
        ship_x = gx + int(gw * (0.2 + 0.6 * local_t))
        ship_y = gy + 220 + int(30 * math.sin(local_t * 12))
        draw.text((ship_x, ship_y), "🚀", font=get_font(84))

        # Mission Steps Pills
        missions = [
            ("۱. سوخت‌گیری مخزن کسرها", "جمع و هم‌ارزی کسرهای ۵/۸", (30, 144, 255)),
            ("۲. پدافند نقاله و زاویه‌سنج", "تشخیص زوایای تند، راست و باز", (255, 197, 49)),
            ("۳. پرش کوانتومی ضرب ذهنی", "محاسبات سرعتی ۴۰ × ۵۰", (18, 161, 80))
        ]

        m_w = 420
        m_gap = 40
        m_start_x = gx + (gw - (3 * m_w + 2 * m_gap)) // 2
        m_y = gy + 430

        for idx, (m_title, m_desc, m_color) in enumerate(missions):
            draw_rounded_rect(draw, [m_start_x + idx * (m_w + m_gap), m_y, m_start_x + idx * (m_w + m_gap) + m_w, m_y + 220], radius=24, fill=(18, 38, 80), outline=m_color, width=2)
            mt = fa_text(m_title)
            draw.text((m_start_x + idx * (m_w + m_gap) + 30, m_y + 35), mt, fill=WHITE, font=get_font(24))
            md = fa_text(m_desc)
            draw.text((m_start_x + idx * (m_w + m_gap) + 30, m_y + 95), md, fill=m_color, font=get_font(18))
            draw.text((m_start_x + idx * (m_w + m_gap) + 30, m_y + 155), fa_text("✓ ثبت امتیاز در رتبه رشد"), fill=(170, 195, 240), font=get_font(15))

    # ================= SCENE 5: DUAL PAYMENT (17 - 21s) =================
    elif 17 <= t < 21:
        local_t = (t - 17) / 4.0

        # Header
        th = fa_text("تفکیک کامل پرداخت‌ها و درگاه امن شاپرک")
        wh = draw.textlength(th, font=get_font(42))
        draw.text(((WIDTH - wh) // 2, 130), th, fill=WHITE, font=get_font(42))

        # Card 1: Tuition
        c1_x, c1_y, c_w, c_h = 240, 230, 680, 700
        draw_rounded_rect(draw, [c1_x, c1_y, c1_x + c_w, c1_y + c_h], radius=32, fill=DARK_CARD, outline=ROYAL, width=3)
        draw_rounded_rect(draw, [c1_x + 40, c1_y + 40, c1_x + 220, c1_y + 85], radius=14, fill=ROYAL)
        draw.text((c1_x + 55, c1_y + 50), fa_text("شهریه دوره کانون"), fill=WHITE, font=get_font(18))
        draw.text((c1_x + 40, c1_y + 120), fa_text("۱٬۵۰۰٬۰۰۰ تومان"), fill=WHITE, font=get_font(52))
        draw.text((c1_x + 40, c1_y + 220), fa_text("• کلاس‌های حضوری و اساتید سمپاد"), fill=(190, 215, 255), font=get_font(24))
        draw.text((c1_x + 40, c1_y + 280), fa_text("• بسته‌های جزوات تمام‌رنگی کانون"), fill=(190, 215, 255), font=get_font(24))
        draw.text((c1_x + 40, c1_y + 340), fa_text("• آزمون‌های جامع ۴۵۰ نفره"), fill=(190, 215, 255), font=get_font(24))
        
        # Payment options badges
        draw_rounded_rect(draw, [c1_x + 40, c1_y + 460, c1_x + c_w - 40, c1_y + 540], radius=20, fill=(25, 55, 115))
        draw.text((c1_x + 70, c1_y + 485), fa_text("💳 درگاه آنلاین شاپرک / کارت‌به‌کارت با ثبت فیش"), fill=SUN, font=get_font(20))

        # Card 2: Platform Service Fee
        c2_x = 1000
        draw_rounded_rect(draw, [c2_x, c1_y, c2_x + c_w, c1_y + c_h], radius=32, fill=DARK_CARD, outline=SUN, width=3)
        draw_rounded_rect(draw, [c2_x + 40, c1_y + 40, c2_x + 240, c1_y + 85], radius=14, fill=SUN)
        draw.text((c2_x + 55, c1_y + 50), fa_text("هزینه سامانه رشد"), fill=DARK_BG, font=get_font(18))
        draw.text((c2_x + 40, c1_y + 120), fa_text("۱۵۰٬۰۰۰ تومان / سالانه"), fill=SUN, font=get_font(46))
        draw.text((c2_x + 40, c1_y + 220), fa_text("• سرور ابری و دیتابیس ۴۵۰ دانش‌آموز"), fill=(190, 215, 255), font=get_font(24))
        draw.text((c2_x + 40, c1_y + 280), fa_text("• سامانه ارسال خودکار پیامک به والدین"), fill=(190, 215, 255), font=get_font(24))
        draw.text((c2_x + 40, c1_y + 340), fa_text("• پشتیبانی فنی و تصحیح هوشمند آزمون"), fill=(190, 215, 255), font=get_font(24))
        
        draw_rounded_rect(draw, [c2_x + 40, c1_y + 460, c2_x + c_w - 40, c1_y + 540], radius=20, fill=(25, 55, 115))
        draw.text((c2_x + 70, c1_y + 485), fa_text("⚡ فعال‌سازی فوری و صدور فاکتور اشتراک"), fill=OK_GREEN, font=get_font(20))

    # ================= SCENE 6: OUTRO (21 - 24s) =================
    else:
        local_t = (t - 21) / 3.0
        anim = ease_out_cubic(min(1.0, local_t * 2.0))

        # Big Gold Trophy
        draw.text((WIDTH // 2 - 60, HEIGHT // 2 - 220), "🏆", font=get_font(120))

        t1 = fa_text("پـلـتـفـرم رشـــــد")
        w1 = draw.textlength(t1, font=get_font(72))
        draw.text(((WIDTH - w1) // 2, HEIGHT // 2 - 40), t1, fill=WHITE, font=get_font(72))

        t2 = fa_text("آینده آموزش و پرورش نخبگان در دستان شما")
        w2 = draw.textlength(t2, font=get_font(34))
        draw.text(((WIDTH - w2) // 2, HEIGHT // 2 + 70), t2, fill=SUN, font=get_font(34))

        t3 = fa_text("نسخه رسمی ۱۴۰۵ | کانون نخبه‌پروری شهید کاظم آشتیانی")
        w3 = draw.textlength(t3, font=get_font(24))
        draw.text(((WIDTH - w3) // 2, HEIGHT // 2 + 140), t3, fill=(180, 210, 255), font=get_font(24))

        # Bottom Website Link badge
        draw_rounded_rect(draw, [WIDTH // 2 - 280, HEIGHT // 2 + 220, WIDTH // 2 + 280, HEIGHT // 2 + 290], radius=20, fill=ROYAL)
        url_t = "http://localhost:5173"
        url_w = draw.textlength(url_t, font=get_font(26))
        draw.text(((WIDTH - url_w) // 2, HEIGHT // 2 + 238), url_t, fill=WHITE, font=get_font(26))

    return np.array(img)

def generate_video(output_path="rosh_platform_motion_graphic.mp4"):
    print(f"Generating Full HD Motion Graphic ({WIDTH}x{HEIGHT} @ {FPS}fps, {DURATION_SEC}s)...")
    writer = imageio.get_writer(
        output_path,
        fps=FPS,
        codec="libx264",
        quality=8,
        pixelformat="yuv420p"
    )

    for i in range(TOTAL_FRAMES):
        frame = render_frame(i)
        writer.append_data(frame)
        if (i + 1) % (FPS * 2) == 0 or i == TOTAL_FRAMES - 1:
            progress = int(((i + 1) / TOTAL_FRAMES) * 100)
            print(f"Render progress: {progress}% (Frame {i+1}/{TOTAL_FRAMES})")

    writer.close()
    print(f"Motion Graphic Video successfully generated: {output_path}")

if __name__ == "__main__":
    generate_video()
