<template>
  <div class="min-h-screen pb-28">
    <!-- Header (Identical to Claude rosh-step2-student.html) -->
    <header class="brand-bg relative text-white">
      <div class="dots absolute inset-0 opacity-50"></div>
      <div class="relative max-w-3xl mx-auto px-4 pt-4 pb-24 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center shrink-0">
            <i data-lucide="graduation-cap" class="w-6 h-6 text-sun"></i>
          </div>
          <div class="leading-tight">
            <p class="font-extrabold truncate">کانون نخبه‌پروری شهید کاظم آشتیانی</p>
            <p class="text-white/70 text-xs">پلتفرم رشد | پنل دانش‌آموز</p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <button 
            @click="$emit('open-store')" 
            class="h-11 px-3.5 rounded-2xl bg-white/15 hover:bg-white/25 flex items-center gap-1.5 text-xs font-extrabold text-white transition-all shadow-sm"
            title="فروشگاه جوایز و دوره‌ها"
          >
            <i data-lucide="shopping-bag" class="w-4 h-4 text-sun"></i>
            <span>فروشگاه</span>
          </button>
          <button 
            @click="triggerConfetti" 
            class="w-11 h-11 rounded-2xl bg-white/15 flex items-center justify-center relative hover:bg-white/25 transition-all"
            title="جشن تولد"
          >
            <i data-lucide="cake" class="w-5 h-5 text-sun"></i>
          </button>
          <button 
            @click="$emit('logout')" 
            class="w-11 h-11 rounded-2xl bg-white/15 flex items-center justify-center hover:bg-white/25 transition-all"
            title="خروج"
          >
            <i data-lucide="log-out" class="w-5 h-5"></i>
          </button>
        </div>
      </div>
    </header>

    <main class="max-w-3xl mx-auto px-4 -mt-[84px] relative space-y-4">
      <!-- Birthday Banner with CSS Confetti Animation -->
      <div 
        v-if="user.is_birthday || showBirthday" 
        class="relative overflow-hidden rounded-[26px] p-5 flex items-center gap-4 text-ink rise shadow-lg border border-yellow-200"
        style="background:linear-gradient(120deg,#FFD25A,#FFC531 55%,#FFB020)"
      >
        <div class="confetti">
          <i v-for="i in 18" :key="i" :style="{ left: (i * 5.5) + '%', animationDelay: (i * 0.15) + 's', background: ['#1E90FF','#0A4BD6','#E5484D','#12A150','#fff'][i % 5] }"></i>
        </div>
        <div class="w-16 h-16 rounded-2xl bg-white/60 flex items-center justify-center shrink-0">
          <i data-lucide="cake" class="w-9 h-9 text-[#7A5600]"></i>
        </div>
        <div class="relative">
          <p class="text-[22px] font-extrabold">تولدت مبارک {{ user.first_name }} 🎉</p>
          <p class="text-[14px] text-[#5A4000]">امروز روز توئه. کانون برایت یک سال پر از پیشرفت، نمرات عالی و رشد آرزو می‌کند.</p>
        </div>
      </div>

      <!-- Lock Banner (If fee overdue) -->
      <div 
        v-if="user.is_locked" 
        class="rounded-[26px] bg-white border border-[#F6C9CB] p-5 shadow-lg rise"
      >
        <div class="flex items-start gap-3">
          <div class="w-12 h-12 rounded-2xl bg-[#FDECEC] text-late flex items-center justify-center shrink-0">
            <i data-lucide="lock" class="w-6 h-6"></i>
          </div>
          <div class="flex-1">
            <p class="font-extrabold text-[18px] text-late">پنل شما قفل است</p>
            <p class="text-[#5A6E99] text-sm">مهلت پرداخت حق عضویت گذشته است. با بارگذاری رسید پرداخت، پنل شما مجدداً فعال خواهد شد.</p>
          </div>
        </div>
        <button @click="openReceiptModal = true" class="btn btn-royal w-full mt-4">
          <i data-lucide="upload" class="w-5 h-5"></i>
          <span>بارگذاری رسید</span>
        </button>
      </div>

      <!-- ================= 1. خانه (HOME) ================= -->
      <section v-if="activeTab === 'home'" class="space-y-4">
        <div class="text-white px-1">
          <p class="text-white/80 text-sm">دوشنبه ۴ آبان ۱۴۰۵</p>
          <h2 class="text-[26px] font-extrabold leading-snug">سلام {{ user.first_name }}، آماده‌ای؟</h2>
        </div>

        <!-- Level & Score Card (Interactive Gamification Hub) -->
        <div 
          id="level-hub-card"
          @click="handleOpenLevels"
          class="card p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rise cursor-pointer hover:shadow-xl hover:border-royal/50 transition-all group relative overflow-hidden"
          title="کلیک برای مشاهده نقشه راه کامل سطوح و جوایز"
        >
          <!-- Subtle background decorative glow -->
          <div class="absolute -left-12 -top-12 w-36 h-36 rounded-full bg-royal/5 group-hover:bg-royal/10 transition-all pointer-events-none"></div>

          <div class="flex items-center gap-3.5 sm:gap-4 w-full sm:w-auto">
            <!-- Animated Radial XP Ring -->
            <div 
              class="w-[84px] h-[84px] sm:w-[94px] sm:h-[94px] rounded-full shrink-0 flex items-center justify-center p-1.5 shadow-sm group-hover:scale-105 transition-transform" 
              :style="{ background: `conic-gradient(#1E90FF ${levelProgressPercent}%, #E3ECFF 0)` }"
            >
              <div class="w-full h-full rounded-full bg-white flex flex-col items-center justify-center leading-tight shadow-inner">
                <span class="text-[19px] sm:text-[22px] font-black text-royal">{{ faNum(user.total_points) }}</span>
                <span class="text-[10px] sm:text-[11px] text-[#5A6E99] font-bold">امتیاز</span>
              </div>
            </div>

            <!-- Title, Level, and Next Target -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <p class="font-black text-[17px] sm:text-[20px] text-ink group-hover:text-royal transition-colors">
                  سطح {{ faNum(user.level) }}، {{ user.level_title }}
                </p>
                <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-royal/10 text-royal">
                  <i data-lucide="sparkles" class="w-3 h-3 text-sun"></i>
                  <span>فعال</span>
                </span>
              </div>
              <p class="text-xs sm:text-sm text-[#5A6E99] mt-0.5 font-medium">
                {{ nextLevelData.nextTitle ? `${faNum(nextLevelData.pointsNeeded)} امتیاز تا سطح بعد (${nextLevelData.nextTitle})` : 'بالاترین قله افتخار کانون 👑' }}
              </p>
              
              <!-- Clickable Badge Callout -->
              <div class="mt-2 inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-black text-royal group-hover:text-white bg-blue-50 px-2.5 py-1 rounded-xl border border-blue-100 group-hover:bg-royal transition-all shadow-sm">
                <i data-lucide="map" class="w-3.5 h-3.5 text-sun"></i>
                <span>مشاهده نقشه سطوح و جوایز</span>
                <i data-lucide="chevron-left" class="w-3.5 h-3.5"></i>
              </div>
            </div>
          </div>

          <!-- Trophy & Rank Card -->
          <div class="text-center rounded-2xl px-4 py-3 bg-sun/25 border border-sun/40 shrink-0 self-stretch sm:self-center flex sm:flex-col items-center justify-between sm:justify-center gap-2 group-hover:bg-sun/35 transition-all">
            <div class="flex items-center sm:block gap-2">
              <i data-lucide="trophy" class="w-6 h-6 mx-auto text-[#B07A00]"></i>
              <p class="font-black text-sm mt-0.5 text-ink">رتبه {{ faNum(user.rank) }}</p>
            </div>
            <p class="text-xs text-[#5A6E99] font-bold">از ۳۸ نفر</p>
          </div>
        </div>

        <!-- Quick Access: Counselor & Study Timer (Naghsh Yar Style) -->
        <div class="grid grid-cols-2 gap-3">
          <button 
            @click="activeTab = 'chat'"
            class="card p-3.5 sm:p-4 text-right flex items-center gap-3 border border-line hover:border-royal/50 hover:shadow-md transition-all group bg-white"
          >
            <div class="w-10 h-10 rounded-2xl bg-royal/10 text-royal flex items-center justify-center shrink-0 group-hover:bg-royal group-hover:text-white transition-all">
              <i data-lucide="messages-square" class="w-5 h-5"></i>
            </div>
            <div class="min-w-0">
              <p class="font-bold text-xs sm:text-sm text-ink truncate">گفتگو با مشاور</p>
              <p class="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 mt-0.5">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>استاد کریمی (آنلاین)</span>
              </p>
            </div>
          </button>

          <button 
            @click="activeTab = 'study'"
            class="card p-3.5 sm:p-4 text-right flex items-center gap-3 border border-line hover:border-amber-400/50 hover:shadow-md transition-all group bg-white"
          >
            <div class="w-10 h-10 rounded-2xl bg-amber-50 text-[#B07A00] flex items-center justify-center shrink-0 group-hover:bg-amber-400 group-hover:text-ink transition-all">
              <i data-lucide="timer" class="w-5 h-5"></i>
            </div>
            <div class="min-w-0">
              <p class="font-bold text-xs sm:text-sm text-ink truncate">تایمر مطالعه</p>
              <p class="text-[11px] text-[#5A6E99] font-medium mt-0.5">۲۵ دقیقه تمرکز</p>
            </div>
          </button>
        </div>

        <!-- Near Homeworks -->
        <div class="card p-5">
          <div class="flex items-center justify-between mb-3">
            <h3 class="font-extrabold text-[18px]">تکلیف‌های نزدیک به مهلت</h3>
            <button @click="activeTab = 'hw'" class="text-royal font-bold text-sm">همه ➔</button>
          </div>

          <div class="space-y-3">
            <div 
              v-for="hw in homeworks.slice(0, 2)" 
              :key="hw.id"
              class="p-4 rounded-2xl border border-line flex items-center justify-between bg-mist/50"
            >
              <div>
                <p class="font-bold text-base text-ink">{{ hw.title }}</p>
                <p class="text-xs text-late font-semibold mt-1 flex items-center gap-1.5">
                  <i data-lucide="calendar-clock" class="w-4 h-4"></i>
                  <span>مهلت: {{ hw.deadline_fa }}</span>
                </p>
              </div>
              <button @click="activeTab = 'hw'" class="btn btn-soft btn-sm !px-4 font-bold text-xs">
                ارسال
              </button>
            </div>
          </div>
        </div>

        <!-- Educational Math Game Card (New Grade 4 Interactive Challenge) -->
        <div class="card p-5 overflow-hidden relative" style="background:linear-gradient(135deg,#0A4BD6,#0B1F4D)">
          <div class="dots absolute inset-0 opacity-40"></div>
          <div class="relative flex items-center justify-between gap-4 text-white">
            <div class="space-y-1.5 flex-1 min-w-0">
              <span class="tag bg-sun text-ink font-black text-[11px] shadow">
                بازی درسی و مسابقه سرعتی
              </span>
              <h3 class="text-lg sm:text-xl font-black text-white leading-tight">
                قهرمان ریاضی چهارم دبستان 🎮
              </h3>
              <p class="text-xs text-white/80 leading-relaxed line-clamp-2">
                چالش هیجان‌انگیز کسرها، مساحت، زاویه‌ها و ضرب سریع ذهنی با ثبت امتیاز در کارنامه رشد!
              </p>
            </div>

            <button 
              @click="openMathGame = true"
              class="btn btn-sun !min-h-[46px] !px-4 text-xs sm:text-sm font-black shrink-0 shadow-lg hover:scale-105 active:scale-95 transition-all"
            >
              <i data-lucide="gamepad-2" class="w-4 h-4"></i>
              <span>شروع بازی</span>
            </button>
          </div>
        </div>

        <!-- Today Class -->
        <div class="card p-5 flex items-center gap-4">
          <div class="w-14 h-14 rounded-2xl bg-[#E8F0FF] text-royal flex items-center justify-center shrink-0">
            <i data-lucide="calendar-clock" class="w-7 h-7"></i>
          </div>
          <div class="flex-1">
            <p class="text-xs text-[#5A6E99]">کلاس امروز</p>
            <p class="font-extrabold text-[18px]">ریاضی، آقای کریمی</p>
            <p class="text-xs text-[#5A6E99]">۱۶:۰۰ تا ۱۷:۳۰، کلاس شماره ۳</p>
          </div>
          <span class="tag bg-[#E6F7EE] text-ok">امروز</span>
        </div>

        <!-- Study Leaderboard with Podium (Claude Style) -->
        <div class="card p-5">
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-extrabold text-[18px] flex items-center gap-2">
              <i data-lucide="crown" class="w-5 h-5 text-[#B07A00]"></i>
              <span>برترین‌های مطالعه</span>
            </h3>
            <div class="seg-ctl !p-1 w-36">
              <button 
                @click="studyTab = 'today'" 
                :aria-pressed="studyTab === 'today'" 
                class="!min-h-[34px] text-xs"
              >
                امروز
              </button>
              <button 
                @click="studyTab = 'week'" 
                :aria-pressed="studyTab === 'week'" 
                class="!min-h-[34px] text-xs"
              >
                هفته
              </button>
            </div>
          </div>

          <!-- Podium Visual Columns -->
          <div class="grid grid-cols-3 gap-2 items-end pt-4 pb-2 border-b border-line mb-3 text-center">
            <!-- 2nd Place -->
            <div class="flex flex-col items-center">
              <div class="w-10 h-10 rounded-full bg-slate-200 text-ink font-black flex items-center justify-center text-sm shadow">
                ۲
              </div>
              <p class="text-xs font-bold text-ink mt-1 truncate max-w-[90px]">{{ studyLeaders[1]?.full_name || 'پارسا نجفی' }}</p>
              <span class="text-[10px] text-royal font-black">{{ faNum(studyLeaders[1]?.minutes || 110) }} دقیقه</span>
              <div class="w-full bg-slate-200/80 rounded-t-xl h-16 mt-2 flex items-center justify-center text-xs font-bold text-slate-600">
                نقره
              </div>
            </div>

            <!-- 1st Place (Center & Tallest) -->
            <div class="flex flex-col items-center">
              <i data-lucide="crown" class="w-6 h-6 text-sun animate-bounce"></i>
              <div class="w-12 h-12 rounded-full bg-sun text-ink font-black flex items-center justify-center text-base shadow-lg border-2 border-amber-300">
                ۱
              </div>
              <p class="text-xs font-extrabold text-ink mt-1 truncate max-w-[100px]">{{ studyLeaders[0]?.full_name || 'سارا محمدی' }}</p>
              <span class="text-[11px] text-[#7A5600] font-black">{{ faNum(studyLeaders[0]?.minutes || 135) }} دقیقه</span>
              <div class="w-full bg-sun/40 rounded-t-xl h-24 mt-2 flex items-center justify-center text-xs font-extrabold text-[#7A5600]">
                طلایی 👑
              </div>
            </div>

            <!-- 3rd Place -->
            <div class="flex flex-col items-center">
              <div class="w-10 h-10 rounded-full bg-amber-100 text-[#7A5600] font-black flex items-center justify-center text-sm shadow">
                ۳
              </div>
              <p class="text-xs font-bold text-ink mt-1 truncate max-w-[90px]">{{ studyLeaders[2]?.full_name || 'نیلوفر احمدی' }}</p>
              <span class="text-[10px] text-royal font-black">{{ faNum(studyLeaders[2]?.minutes || 100) }} دقیقه</span>
              <div class="w-full bg-amber-200/60 rounded-t-xl h-12 mt-2 flex items-center justify-center text-xs font-bold text-[#7A5600]">
                برنز
              </div>
            </div>
          </div>
        </div>

        <!-- AI Learning Path Card (Claude Style) -->
        <div class="rounded-[26px] p-5 text-white relative overflow-hidden" style="background:linear-gradient(135deg,#0A4BD6,#0B1F4D)">
          <div class="dots absolute inset-0 opacity-40"></div>
          <div class="relative flex items-center gap-2 mb-3">
            <i data-lucide="sparkles" class="w-5 h-5 text-sun"></i>
            <h3 class="font-extrabold text-[18px]">مسیر یادگیری پیشنهادی هوش مصنوعی</h3>
          </div>
          <div class="relative space-y-2.5">
            <div class="flex items-center gap-3 bg-white/12 rounded-2xl p-3">
              <i data-lucide="book-open" class="w-5 h-5 text-sun shrink-0"></i>
              <div class="flex-1">
                <p class="font-semibold text-sm">مرور فصل ۳ ریاضی (کسرها)</p>
                <p class="text-xs text-white/70">۲۰ دقیقه</p>
              </div>
              <span class="tag bg-white/20 text-white !text-xs font-bold">تأیید معلم</span>
            </div>
            <div class="flex items-center gap-3 bg-white/12 rounded-2xl p-3">
              <i data-lucide="target" class="w-5 h-5 text-sun shrink-0"></i>
              <div class="flex-1">
                <p class="font-semibold text-sm">۱۰ تست کسرها و توان</p>
                <p class="text-xs text-white/70">۱۵ دقیقه</p>
              </div>
              <span class="tag bg-white/20 text-white !text-xs font-bold">تأیید معلم</span>
            </div>
            <div class="flex items-center gap-3 bg-white/12 rounded-2xl p-3">
              <i data-lucide="flask-conical" class="w-5 h-5 text-sun shrink-0"></i>
              <div class="flex-1">
                <p class="font-semibold text-sm">خواندن درس ۵ علوم تجربی</p>
                <p class="text-xs text-white/70">۳۰ دقیقه</p>
              </div>
              <span class="tag bg-sun text-ink !text-xs font-black">در انتظار معلم</span>
            </div>
          </div>
        </div>

        <!-- Game Cards (Claude Style) -->
        <div class="grid grid-cols-2 gap-3">
          <div 
            @click="toast('بازی آموزشی در ترم جدید فعال می‌شود')"
            class="card p-5 text-start cursor-pointer hover:shadow-md transition-all" 
            style="background:linear-gradient(135deg,#FFF3CC,#FFE08A)"
          >
            <div class="flex gap-1.5 mb-3">
              <span class="w-9 h-9 rounded-xl bg-white/70 flex items-center justify-center font-black text-sm">∑</span>
              <span class="w-9 h-9 rounded-xl bg-white/70 flex items-center justify-center font-bold text-sm">الف</span>
              <span class="w-9 h-9 rounded-xl bg-white/70 flex items-center justify-center font-bold text-sm">⚛</span>
            </div>
            <p class="font-extrabold flex items-center gap-1.5 text-ink text-sm">
              <i data-lucide="gamepad-2" class="w-5 h-5"></i>
              <span>بازی درسی</span>
            </p>
            <p class="text-xs text-[#6B5200]">ریاضی، فارسی، علوم</p>
          </div>

          <div 
            @click="toast('داستان‌های تعاملی رشد در دست آماده‌سازی است')"
            class="card p-5 text-start cursor-pointer hover:shadow-md transition-all" 
            style="background:linear-gradient(135deg,#E3F0FF,#BFDCFF)"
          >
            <div class="w-9 h-9 rounded-xl bg-white/70 flex items-center justify-center mb-3 text-royal">
              <i data-lucide="book-heart" class="w-5 h-5"></i>
            </div>
            <p class="font-extrabold flex items-center gap-1.5 text-royal text-sm">
              <i data-lucide="wand-sparkles" class="w-5 h-5"></i>
              <span>داستان تعاملی</span>
            </p>
            <p class="text-xs text-[#2B4F8C]">بخوان و انتخاب کن</p>
          </div>
        </div>
      </section>

      <!-- ================= 2. تکالیف (HOMEWORK) ================= -->
      <section v-if="activeTab === 'hw'" class="space-y-4">
        <div class="text-white px-1">
          <h2 class="text-[26px] font-extrabold">تکالیف</h2>
          <p class="text-white/80 text-sm">مهلت‌ها را از دست نده و امتیاز جمع کن</p>
        </div>

        <div class="space-y-3">
          <div 
            v-for="hw in homeworks" 
            :key="hw.id" 
            class="card p-5 space-y-3"
          >
            <div class="flex items-start justify-between gap-3">
              <div>
                <span class="text-xs font-bold text-royal bg-mist px-2.5 py-1 rounded-lg">
                  {{ hw.subject }} - دبیر: {{ hw.teacher_name }}
                </span>
                <h3 class="font-extrabold text-lg mt-2">{{ hw.title }}</h3>
              </div>
              <span 
                v-if="hw.submission_status === 'submitted'" 
                class="tag bg-[#E6F7EE] text-ok"
              >
                <i data-lucide="check" class="w-4 h-4"></i>
                <span>ارسال‌شده</span>
              </span>
              <span 
                v-else-if="hw.submission_status === 'late'" 
                class="tag bg-[#FDECEC] text-late"
              >
                <i data-lucide="alert-triangle" class="w-4 h-4"></i>
                <span>دیر شد، امتیاز منفی</span>
              </span>
              <span 
                v-else 
                class="tag bg-sun/30 text-[#7A5600]"
              >
                <i data-lucide="clock" class="w-4 h-4"></i>
                <span>در انتظار ارسال</span>
              </span>
            </div>

            <p class="text-sm text-[#5A6E99] leading-relaxed">{{ hw.description }}</p>

            <div class="flex items-center justify-between text-xs text-[#5A6E99] pt-2 border-t border-line">
              <span class="flex items-center gap-1.5 font-bold">
                <i data-lucide="calendar-clock" class="w-4 h-4"></i>
                <span>مهلت: {{ hw.deadline_fa }}</span>
              </span>
              <span class="font-extrabold text-royal">
                +{{ faNum(hw.points) }} امتیاز
              </span>
            </div>

            <div class="pt-2">
              <button 
                v-if="hw.submission_status" 
                class="btn btn-soft w-full text-sm font-bold"
                disabled
              >
                <i data-lucide="check-check" class="w-4 h-4"></i>
                <span>تکلیف با موفقیت ارسال شده است</span>
              </button>
              <button 
                v-else 
                @click="startSubmitHomework(hw)" 
                class="btn btn-royal w-full"
              >
                <i data-lucide="upload" class="w-5 h-5"></i>
                <span>ارسال تکلیف</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- ================= 3. آزمون‌ها (EXAMS - NAGHSH YAR FULL SYSTEM) ================= -->
      <section v-if="activeTab === 'exam'" class="space-y-4">
        <ExamModuleNaghshYar 
          :user="user" 
          :freshExams="exams" 
          @exam-finished="handleExamFinished" 
        />
      </section>

      <!-- ================= 4. گفتگو با مشاور (COUNSELOR CHAT - NAGHSH YAR CLONE) ================= -->
      <section v-if="activeTab === 'chat'" class="space-y-4">
        <CounselorChatSection :user="user" />
      </section>

      <!-- ================= 4. مطالعه و پومودورو (STUDY) ================= -->
      <section v-if="activeTab === 'study'" class="space-y-4">
        <div class="text-white px-1">
          <h2 class="text-[26px] font-extrabold">مطالعه</h2>
          <p class="text-white/80 text-sm">۲۵ دقیقه تمرکز، ۵ دقیقه استراحت</p>
        </div>

        <div class="card p-6 text-center space-y-4">
          <div class="seg-ctl w-64 mx-auto">
            <button 
              @click="setPomodoroMode('focus')" 
              :aria-pressed="pomoMode === 'focus'"
            >
              تمرکز
            </button>
            <button 
              @click="setPomodoroMode('break')" 
              :aria-pressed="pomoMode === 'break'"
            >
              استراحت
            </button>
          </div>

          <!-- Circular Clock -->
          <div class="relative w-[260px] h-[260px] mx-auto">
            <svg viewBox="0 0 260 260" class="w-full h-full -rotate-90">
              <circle cx="130" cy="130" r="110" fill="none" stroke="#E3ECFF" stroke-width="16"/>
              <circle 
                cx="130" cy="130" r="110" 
                fill="none" 
                stroke="url(#pg)" 
                stroke-width="16" 
                stroke-linecap="round" 
                :stroke-dasharray="691.15" 
                :stroke-dashoffset="ringOffset"
                style="transition:stroke-dashoffset 1s linear"
              />
              <defs>
                <linearGradient id="pg" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stop-color="#1E90FF"/>
                  <stop offset="1" stop-color="#0A4BD6"/>
                </linearGradient>
              </defs>
            </svg>
            <div class="absolute inset-0 flex flex-col items-center justify-center">
              <p class="text-[52px] font-extrabold leading-none tracking-wide text-ink">
                {{ formatTimerDisplay }}
              </p>
              <p class="text-[#5A6E99] mt-2 font-semibold text-sm">
                {{ pomoMode === 'focus' ? 'زمان تمرکز' : 'زمان استراحت' }}
              </p>
            </div>
          </div>

          <!-- Controls -->
          <div class="flex gap-3 justify-center">
            <button 
              @click="togglePomodoro" 
              class="btn btn-royal min-w-[160px] text-lg font-black"
            >
              <i :data-lucide="pomoRunning ? 'pause' : 'play'" class="w-5 h-5"></i>
              <span>{{ pomoRunning ? 'توقف' : 'شروع' }}</span>
            </button>
            <button 
              @click="resetPomodoro" 
              class="btn btn-soft" 
              aria-label="از اول"
            >
              <i data-lucide="rotate-ccw" class="w-5 h-5"></i>
            </button>
          </div>

          <!-- Demo 10s button for quick demo presentation -->
          <div>
            <button 
              @click="startQuickDemoPomodoro" 
              class="text-xs text-[#5A6E99] underline font-bold"
            >
              حالت نمونه: ۱۰ ثانیه‌ای
            </button>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div class="card p-5">
            <i data-lucide="flame" class="w-6 h-6 text-[#E8590C]"></i>
            <p class="text-[28px] font-extrabold leading-tight mt-1 text-ink">
              {{ faNum(studyStats.today_pomodoros) }}
            </p>
            <p class="text-sm text-[#5A6E99]">پومودوروی امروز</p>
          </div>
          <div class="card p-5">
            <i data-lucide="clock-3" class="w-6 h-6 text-royal"></i>
            <p class="text-[22px] font-extrabold leading-tight mt-2 text-royal">
              {{ faNum(studyStats.today_minutes) }} <span class="text-xs text-[#5A6E99]">دقیقه</span>
            </p>
            <p class="text-sm text-[#5A6E99]">مطالعه امروز</p>
          </div>
        </div>

        <div class="card p-5">
          <div class="flex items-center gap-2 mb-2 font-extrabold text-sm">
            <i data-lucide="alarm-clock" class="w-5 h-5 text-[#B07A00]"></i>
            <p>حداقل مطالعه روزانه: ۲ ساعت</p>
          </div>
          <div class="bar">
            <span :style="{ width: studyStats.progress_percentage + '%' }"></span>
          </div>
          <p class="text-xs text-[#5A6E99] mt-2">
            {{ Math.max(0, 120 - studyStats.today_minutes) > 0 ? `${faNum(120 - studyStats.today_minutes)} دقیقه تا تکمیل حداقل مطالعه روزانه مانده است.` : 'هدف ۲ ساعت مطالعه امروز با موفقیت تکمیل شد!' }}
          </p>
        </div>
      </section>

      <!-- ================= 5. من (ME / PROFILE) ================= -->
      <section v-if="activeTab === 'me'" class="space-y-4">
        <div class="text-white px-1 flex items-center gap-3">
          <div class="w-14 h-14 rounded-2xl bg-sun text-ink flex items-center justify-center font-extrabold text-xl shadow-md">
            {{ user.first_name[0] }}.{{ user.last_name[0] }}
          </div>
          <div>
            <h2 class="text-[22px] font-extrabold leading-tight">{{ user.full_name }}</h2>
            <p class="text-white/80 text-sm">پایه {{ user.grade }}، کلاس {{ user.class_name }}</p>
          </div>
        </div>

        <div class="seg-ctl">
          <button @click="meSubTab = 'pts'" :aria-pressed="meSubTab === 'pts'">امتیاز</button>
          <button @click="meSubTab = 'cal'" :aria-pressed="meSubTab === 'cal'">تقویم</button>
          <button @click="meSubTab = 'res'" :aria-pressed="meSubTab === 'res'">منابع</button>
          <button @click="meSubTab = 'pay'" :aria-pressed="meSubTab === 'pay'">پرداخت</button>
        </div>

        <!-- Points Breakdown (Identical to Claude mock) -->
        <div v-if="meSubTab === 'pts'" class="space-y-3">
          <!-- Roadmap Trigger Hero Banner -->
          <div 
            @click="handleOpenLevels"
            class="card p-4 sm:p-5 text-white flex items-center justify-between gap-3 cursor-pointer hover:shadow-xl hover:scale-[1.01] transition-all relative overflow-hidden"
            style="background:linear-gradient(135deg,#0A4BD6,#1E90FF 75%,#0B1F4D)"
          >
            <div class="dots absolute inset-0 opacity-30"></div>
            <div class="relative flex items-center gap-3.5">
              <div class="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur border border-white/30 flex items-center justify-center text-2xl shrink-0 shadow-md">
                🎯
              </div>
              <div>
                <p class="font-black text-base sm:text-lg">نقشه راه سطوح رشد و جوایز افتخار</p>
                <p class="text-xs text-white/80 mt-0.5">مشاهده ۱۰ سطح، آستانه امتیازات و جوایز هر مرحله</p>
              </div>
            </div>
            <button class="relative btn btn-sun !min-h-[40px] !px-4 text-xs font-black shadow-lg shrink-0">
              مشاهده نقشه ➔
            </button>
          </div>

          <div class="card overflow-hidden">
            <div class="px-5 py-3 bg-[#E6F7EE] text-ok font-extrabold flex items-center gap-2">
              <i data-lucide="trending-up" class="w-5 h-5"></i>
              <span>امتیازهای مثبت</span>
            </div>
            <div class="divide-y divide-line">
              <div 
                v-for="p in pointsData.pluses" 
                :key="p.id" 
                class="px-5 py-3 flex items-center justify-between"
              >
                <div>
                  <p class="font-bold text-sm text-ink">{{ p.title }}</p>
                  <p class="text-xs text-[#5A6E99]">{{ p.date_fa }}</p>
                </div>
                <span class="text-ok font-extrabold text-sm">+{{ faNum(p.points) }}</span>
              </div>
            </div>
          </div>

          <div class="card overflow-hidden">
            <div class="px-5 py-3 bg-[#FDECEC] text-late font-extrabold flex items-center gap-2">
              <i data-lucide="trending-down" class="w-5 h-5"></i>
              <span>امتیازهای منفی</span>
            </div>
            <div class="divide-y divide-line">
              <div 
                v-for="m in pointsData.minuses" 
                :key="m.id" 
                class="px-5 py-3 flex items-center justify-between"
              >
                <div>
                  <p class="font-bold text-sm text-ink">{{ m.title }}</p>
                  <p class="text-xs text-[#5A6E99]">{{ m.date_fa }}</p>
                </div>
                <span class="text-late font-extrabold text-sm">-{{ faNum(m.points) }}</span>
              </div>
            </div>
          </div>

          <div class="card p-5 flex items-center justify-between">
            <span class="font-extrabold">جمع امتیاز</span>
            <span class="text-[26px] font-extrabold text-royal">{{ faNum(user.total_points) }}</span>
          </div>
        </div>

        <!-- Calendar -->
        <div v-if="meSubTab === 'cal'" class="space-y-3">
          <div class="card p-5 space-y-3">
            <h3 class="font-extrabold text-base flex items-center gap-2">
              <i data-lucide="calendar" class="w-5 h-5 text-royal"></i>
              <span>برنامه کلاس‌های هفته</span>
            </h3>
            <div class="space-y-2 text-sm">
              <div class="p-3 rounded-xl bg-mist flex justify-between items-center">
                <div>
                  <p class="font-bold">شنبه: علوم تجربی</p>
                  <p class="text-xs text-[#5A6E99]">ساعت ۱۵:۳۰ تا ۱۷:۰۰ - استاد احمدی</p>
                </div>
                <span class="tag bg-white text-royal">حضوری</span>
              </div>
              <div class="p-3 rounded-xl bg-mist flex justify-between items-center">
                <div>
                  <p class="font-bold">دوشنبه: ریاضی</p>
                  <p class="text-xs text-[#5A6E99]">ساعت ۱۶:۰۰ تا ۱۷:۳۰ - استاد کریمی</p>
                </div>
                <span class="tag bg-white text-royal">حضوری</span>
              </div>
              <div class="p-3 rounded-xl bg-mist flex justify-between items-center">
                <div>
                  <p class="font-bold">چهارشنبه: ادبیات فارسی</p>
                  <p class="text-xs text-[#5A6E99]">ساعت ۱۷:۰۰ تا ۱۸:۳۰ - استاد حسینی</p>
                </div>
                <span class="tag bg-white text-royal">آنلاین</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Resources (Videos & Booklets) -->
        <div v-if="meSubTab === 'res'" class="space-y-3">
          <div class="card p-5 space-y-3">
            <h3 class="font-extrabold flex items-center gap-2">
              <i data-lucide="video" class="w-5 h-5 text-royal"></i>
              <span>ویدئوها</span>
            </h3>
            <div class="space-y-2">
              <div class="p-3.5 rounded-2xl bg-mist flex items-center justify-between">
                <div>
                  <p class="font-bold text-sm">جلسه ۳ ریاضی: روش حل کسرها</p>
                  <p class="text-xs text-[#5A6E99]">۴۵ دقیقه</p>
                </div>
                <button @click="toast('پخش ویدیو')" class="btn btn-royal btn-sm">مشاهده</button>
              </div>
              <div class="p-3.5 rounded-2xl bg-mist flex items-center justify-between">
                <div>
                  <p class="font-bold text-sm">جلسه ۲ علوم: اتم و مولکول</p>
                  <p class="text-xs text-[#5A6E99]">۵۰ دقیقه</p>
                </div>
                <button @click="toast('پخش ویدیو')" class="btn btn-royal btn-sm">مشاهده</button>
              </div>
            </div>

            <h3 class="font-extrabold flex items-center gap-2 pt-3 border-t border-line">
              <i data-lucide="file-text" class="w-5 h-5 text-royal"></i>
              <span>جزوه‌ها</span>
            </h3>
            <div class="space-y-2">
              <div class="p-3.5 rounded-2xl bg-mist flex items-center justify-between">
                <div>
                  <p class="font-bold text-sm">خلاصه نموداری فصل ۳ ریاضی</p>
                  <p class="text-xs text-[#5A6E99]">PDF - ۲.۴ مگابایت</p>
                </div>
                <button @click="toast('دانلود فایل شروع شد')" class="btn btn-soft btn-sm">دانلود جزوه</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Payment Section: Separated into 1. Tuition (شهریه دوره کانون) and 2. Platform Service Fee (هزینه اشتراک سامانه رشد) -->
        <div v-if="meSubTab === 'pay'" class="space-y-4">
          
          <!-- Tab Switcher between Tuition & Platform Fee -->
          <div class="seg-ctl">
            <button 
              @click="paySubTab = 'tuition'" 
              :aria-pressed="paySubTab === 'tuition'"
              class="flex items-center justify-center gap-1.5"
            >
              <i data-lucide="graduation-cap" class="w-4 h-4"></i>
              <span>۱. شهریه دوره کانون</span>
            </button>
            <button 
              @click="paySubTab = 'platform'" 
              :aria-pressed="paySubTab === 'platform'"
              class="flex items-center justify-center gap-1.5"
            >
              <i data-lucide="server" class="w-4 h-4"></i>
              <span>۲. هزینه سامانه رشد</span>
            </button>
          </div>

          <!-- ================= 1. شهریه دوره کانون (TUITION) ================= -->
          <div v-if="paySubTab === 'tuition'" class="space-y-3 rise">
            <div class="card p-5">
              <div class="flex items-start justify-between gap-3">
                <div>
                  <div class="flex items-center gap-2">
                    <span class="tag bg-royal/10 text-royal font-black text-xs">آموزشی و کلاسی</span>
                    <span class="text-xs text-[#5A6E99]">پایه {{ user.grade || 'هفتم' }}</span>
                  </div>
                  <h3 class="font-black text-lg text-ink mt-1">شهریه کلاس‌های حضوری و اساتید کانون</h3>
                  <p class="text-[30px] font-extrabold leading-tight text-ink mt-2">
                    ۱٬۵۰۰٬۰۰۰ <span class="text-base text-[#5A6E99] font-semibold">تومان</span>
                  </p>
                </div>
                <span 
                  v-if="user.fee_status === 'paid'" 
                  class="tag bg-[#E6F7EE] text-ok font-bold"
                >
                  تسویه شده
                </span>
                <span 
                  v-else-if="user.fee_status === 'pending'" 
                  class="tag bg-sun/30 text-[#7A5600] font-bold"
                >
                  در انتظار بررسی فیش
                </span>
                <span 
                  v-else 
                  class="tag bg-[#FDECEC] text-late font-bold"
                >
                  پرداخت نشده
                </span>
              </div>

              <div class="mt-3 pt-3 border-t border-line grid grid-cols-2 gap-2 text-xs text-[#5A6E99]">
                <div class="flex items-center gap-1.5">
                  <i data-lucide="check-circle" class="w-4 h-4 text-ok"></i>
                  <span>کلاس‌های تخصصی تیزهوشان و سمپاد</span>
                </div>
                <div class="flex items-center gap-1.5">
                  <i data-lucide="check-circle" class="w-4 h-4 text-ok"></i>
                  <span>حق‌التدریس دبیران و بسته‌های جزوات چاپی</span>
                </div>
              </div>

              <p class="text-xs text-[#5A6E99] mt-3 flex items-center gap-1.5">
                <i data-lucide="calendar-clock" class="w-4 h-4"></i>
                <span>مهلت تسویه شهریه: ۱۰ آبان ۱۴۰۵</span>
              </p>
            </div>

            <!-- Tuition Payment Methods -->
            <div class="grid sm:grid-cols-2 gap-3">
              <!-- Online Pay for Tuition -->
              <div class="card p-5 space-y-3 flex flex-col justify-between border-2 border-royal/20 bg-gradient-to-b from-blue-50/40 to-white">
                <div>
                  <span class="tag bg-royal text-white text-[10px] font-black">پرداخت سریع</span>
                  <h4 class="font-black text-sm text-ink mt-2">پرداخت آنلاین شهریه</h4>
                  <p class="text-xs text-[#5A6E99] mt-1 leading-relaxed">
                    اتصال به درگاه بانکی شاپرک با ثبت فاکتور رسمی شهریه و فعال‌سازی فوری.
                  </p>
                </div>
                <button 
                  @click="openOnlinePayment('tuition', 1500000, 'شهریه کلاس‌های کانون')" 
                  :disabled="user.fee_status === 'paid'"
                  class="btn btn-royal w-full !min-h-[44px] font-black text-xs shadow-md"
                >
                  <i data-lucide="credit-card" class="w-4 h-4 text-sun"></i>
                  <span>{{ user.fee_status === 'paid' ? 'شهریه پرداخت شده است' : 'پرداخت آنلاین شهریه (۱٬۵۰۰٬۰۰۰ تومان)' }}</span>
                </button>
              </div>

              <!-- Card to Card for Tuition -->
              <div class="card p-5 space-y-3 flex flex-col justify-between">
                <div>
                  <span class="tag bg-mist text-slate-700 text-[10px] font-bold">واریز فیش</span>
                  <div class="rounded-2xl p-2.5 text-white relative overflow-hidden mt-2" style="background:linear-gradient(135deg,#0A4BD6,#0B1F4D)">
                    <div class="dots absolute inset-0 opacity-40"></div>
                    <p class="relative text-[9px] text-white/80">حساب شهریه کانون شهید کاظم آشتیانی</p>
                    <p class="relative text-sm font-extrabold tracking-widest mt-0.5" dir="ltr">
                      ۶۰۳۷ ۹۹۷۰ ۰۰۰۰ ۰۰۰۰
                    </p>
                  </div>
                </div>
                <div class="grid grid-cols-2 gap-2">
                  <button @click="copyCard" class="btn btn-soft !min-h-[40px] text-xs font-bold">
                    <i data-lucide="copy" class="w-3.5 h-3.5"></i>
                    <span>کپی کارت</span>
                  </button>
                  <button @click="openReceiptModal = true" class="btn btn-soft !min-h-[40px] text-xs font-bold">
                    <i data-lucide="upload" class="w-3.5 h-3.5"></i>
                    <span>ثبت فیش شهریه</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- ================= 2. هزینه اشتراک سامانه رشد (PLATFORM FEE) ================= -->
          <div v-else-if="paySubTab === 'platform'" class="space-y-3 rise">
            <div class="card p-5 border-2 border-amber-300 bg-gradient-to-b from-amber-50/40 to-white">
              <div class="flex items-start justify-between gap-3">
                <div>
                  <div class="flex items-center gap-2">
                    <span class="tag bg-sun text-ink font-black text-xs">سخت‌افزار و نرم‌افزار</span>
                    <span class="text-xs text-[#5A6E99]">اشتراک سالانه پلتفرم رشد</span>
                  </div>
                  <h3 class="font-black text-lg text-ink mt-1">هزینه زیرساخت و خدمات آنلاین سامانه</h3>
                  <p class="text-[30px] font-extrabold leading-tight text-ink mt-2">
                    ۱۵۰٬۰۰۰ <span class="text-base text-[#5A6E99] font-semibold">تومان / سالانه</span>
                  </p>
                </div>
                <span 
                  v-if="user.platform_fee_status === 'paid'" 
                  class="tag bg-[#E6F7EE] text-ok font-bold"
                >
                  اشتراک فعال است
                </span>
                <span 
                  v-else 
                  class="tag bg-[#FDECEC] text-late font-bold"
                >
                  نیاز به تمدید
                </span>
              </div>

              <!-- Platform Features Checklist -->
              <div class="mt-3 pt-3 border-t border-line grid sm:grid-cols-3 gap-2 text-xs text-[#5A6E99]">
                <div class="flex items-center gap-1.5">
                  <i data-lucide="cpu" class="w-4 h-4 text-royal"></i>
                  <span>سرور ابری و نگهداری دیتابیس ۴۵۰ نفره</span>
                </div>
                <div class="flex items-center gap-1.5">
                  <i data-lucide="message-square" class="w-4 h-4 text-royal"></i>
                  <span>سامانه ارسال پیامک خودکار به والدین</span>
                </div>
                <div class="flex items-center gap-1.5">
                  <i data-lucide="scan" class="w-4 h-4 text-royal"></i>
                  <span>موتور تصحیح خودکار هوشمند پاسخ‌برگ‌ها</span>
                </div>
              </div>

              <p class="text-xs text-[#5A6E99] mt-3 flex items-center gap-1.5">
                <i data-lucide="shield-check" class="w-4 h-4 text-ok"></i>
                <span>پشتیبانی فنی ۲۴ ساعته و به‌روزرسانی سامانه</span>
              </p>
            </div>

            <!-- Online Payment Card for Platform Fee -->
            <div class="card p-5 space-y-3">
              <div class="flex items-center justify-between">
                <div>
                  <h4 class="font-black text-base text-ink">پرداخت آنلاین هزینه اشتراک سامانه</h4>
                  <p class="text-xs text-[#5A6E99] mt-0.5">
                    با پرداخت ۱۵۰٬۰۰۰ تومان، اشتراک پلتفرم رشد به مدت ۱ سال برای شما تمدید و فعال می‌شود.
                  </p>
                </div>
                <div class="flex items-center gap-1">
                  <span class="w-2.5 h-2.5 rounded-full bg-ok animate-pulse"></span>
                  <span class="text-xs text-ok font-bold">شاپرک آماده</span>
                </div>
              </div>

              <button 
                @click="openOnlinePayment('platform', 150000, 'هزینه اشتراک سالانه سامانه رشد')" 
                :disabled="user.platform_fee_status === 'paid'"
                class="btn btn-sun w-full !min-h-[48px] font-black text-sm shadow-lg text-ink"
              >
                <i data-lucide="credit-card" class="w-5 h-5"></i>
                <span>{{ user.platform_fee_status === 'paid' ? 'اشتراک سامانه فعال و تسویه است' : 'پرداخت آنلاین هزینه سامانه (۱۵۰٬۰۰۰ تومان)' }}</span>
              </button>
            </div>
          </div>

        </div>
      </section>

      <!-- ================= 6. بازی درسی (MATH ADVENTURE GAME) ================= -->
      <section v-if="activeTab === 'game'" class="space-y-4">
        <MathGameSection @add-points="handleGamePoints" />
      </section>
    </main>

    <!-- Bottom Navigation Dock (5 Items - Naghsh Yar Standard) -->
    <nav class="dock fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur border-t border-line pb-[env(safe-area-inset-bottom)]" aria-label="منوی اصلی">
      <div class="max-w-3xl mx-auto grid grid-cols-5">
        <button 
          @click="activeTab = 'home'" 
          :aria-current="activeTab === 'home' ? 'page' : undefined"
          class="dock-item"
        >
          <i data-lucide="house"></i>
          <span>امروز</span>
        </button>
        <button 
          @click="activeTab = 'hw'" 
          :aria-current="activeTab === 'hw' ? 'page' : undefined"
          class="dock-item"
        >
          <i data-lucide="notebook-pen"></i>
          <span>تکالیف</span>
        </button>
        <button 
          @click="activeTab = 'exam'" 
          :aria-current="activeTab === 'exam' ? 'page' : undefined"
          class="dock-item"
        >
          <i data-lucide="clipboard-check"></i>
          <span>آزمون‌ها</span>
        </button>
        <button 
          @click="activeTab = 'chat'" 
          :aria-current="activeTab === 'chat' ? 'page' : undefined"
          class="dock-item relative"
        >
          <i data-lucide="messages-square"></i>
          <span>مشاور</span>
          <!-- Counselor online subtle dot -->
          <span class="absolute top-2 right-1/2 translate-x-3 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white"></span>
        </button>
        <button 
          @click="activeTab = 'me'" 
          :aria-current="activeTab === 'me' ? 'page' : undefined"
          class="dock-item"
        >
          <i data-lucide="circle-user-round"></i>
          <span>من و کارنامه</span>
        </button>
      </div>
    </nav>

    <!-- ================= MODALS ================= -->
    <!-- Submit Homework Modal -->
    <div v-if="submittingHomework" class="fixed inset-0 z-50 bg-ink/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div class="card p-6 max-w-md w-full rise space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="font-extrabold text-lg">ارسال پاسخ: {{ submittingHomework.title }}</h3>
          <button @click="submittingHomework = null" class="w-9 h-9 rounded-xl bg-mist flex items-center justify-center">
            <i data-lucide="x" class="w-5 h-5"></i>
          </button>
        </div>

        <div>
          <label class="block text-sm font-bold mb-1">توضیحات یا پاسخ متنی:</label>
          <textarea 
            v-model="hwNote" 
            class="input !h-28 py-3" 
            placeholder="پاسخ را اینجا بنویسید..."
          ></textarea>
        </div>

        <div class="p-4 border-2 border-dashed border-line rounded-2xl text-center bg-mist">
          <i data-lucide="file-up" class="w-8 h-8 mx-auto text-royal"></i>
          <p class="text-xs font-bold text-[#5A6E99] mt-2">تصویر یا فایل PDF حل تمرین</p>
          <span class="tag bg-white text-royal mt-2 text-xs">فایل حل تمرین ضمیمه شد</span>
        </div>

        <button @click="confirmHomeworkSubmit" class="btn btn-royal w-full">
          <i data-lucide="send" class="w-5 h-5"></i>
          <span>ارسال قطعی تکلیف</span>
        </button>
      </div>
    </div>

    <!-- Upload Fee Receipt Modal -->
    <div v-if="openReceiptModal" class="fixed inset-0 z-50 bg-ink/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div class="card p-6 max-w-md w-full rise space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="font-extrabold text-lg">بارگذاری رسید حق عضویت</h3>
          <button @click="openReceiptModal = false" class="w-9 h-9 rounded-xl bg-mist flex items-center justify-center">
            <i data-lucide="x" class="w-5 h-5"></i>
          </button>
        </div>

        <p class="text-xs text-[#5A6E99]">
          مبلغ ۱٬۵۰۰٬۰۰۰ تومان به شماره کارت کانون واریز کرده و شماره پیگیری را وارد کنید.
        </p>

        <div>
          <label class="block text-sm font-bold mb-1">کد پیگیری واریز:</label>
          <input v-model="receiptTrackCode" class="input" placeholder="مثلاً ۹۴۸۲۷۱" />
        </div>

        <div class="p-4 border-2 border-dashed border-line rounded-2xl text-center bg-mist cursor-pointer">
          <i data-lucide="image" class="w-8 h-8 mx-auto text-royal"></i>
          <p class="text-xs font-bold text-[#5A6E99] mt-2">تصویر فیش بانکی کارت‌به‌کارت</p>
          <span class="tag bg-white text-royal mt-2 text-xs">رسید بانکی انتخاب شد</span>
        </div>

        <button @click="submitReceipt" class="btn btn-royal w-full">
          <i data-lucide="upload" class="w-5 h-5"></i>
          <span>ثبت فیش و ارسال به مدیریت</span>
        </button>
      </div>
    </div>

    <!-- Direct Online Payment Simulator Modal (Shaparak Gateway Experience) -->
    <div v-if="openOnlineGatewayModal" class="fixed inset-0 z-50 bg-ink/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div class="card p-5 sm:p-6 max-w-lg w-full bg-white rounded-[28px] rise space-y-4 shadow-2xl border border-line">
        
        <!-- Gateway Header with Shaparak Logo & Secure Padlock -->
        <div class="flex items-center justify-between border-b border-line pb-3">
          <div class="flex items-center gap-2.5">
            <div class="w-9 h-9 rounded-xl bg-emerald-50 text-ok flex items-center justify-center font-bold">
              <i data-lucide="shield-check" class="w-5 h-5"></i>
            </div>
            <div>
              <p class="font-extrabold text-sm text-ink leading-tight">درگاه پرداخت الکترونیک شاپرک</p>
              <p class="text-[10px] text-[#5A6E99]">اتصال امن بانکی - SSL ۲۵۶ بیتی</p>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <span class="tag bg-emerald-100 text-ok text-[11px] font-black">پرداخت امن</span>
            <button @click="openOnlineGatewayModal = false" class="w-8 h-8 rounded-xl bg-mist flex items-center justify-center border-none cursor-pointer">
              <i data-lucide="x" class="w-4 h-4"></i>
            </button>
          </div>
        </div>

        <!-- Payment Info Summary -->
        <div class="p-3.5 rounded-2xl bg-mist space-y-2 text-xs">
          <div class="flex justify-between items-center">
            <span class="text-[#5A6E99]">پذیرنده:</span>
            <span class="font-bold text-ink">کانون نخبه‌پروری شهید کاظم آشتیانی</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-[#5A6E99]">نوع و بابت پرداخت:</span>
            <span class="font-bold text-royal">{{ currentOnlineTitle }}</span>
          </div>
          <div class="flex justify-between items-center text-sm font-black pt-2 border-t border-line">
            <span class="text-ink">مبلغ قابل پرداخت:</span>
            <span class="text-royal text-base">{{ money(currentOnlineAmount) }} تومان</span>
          </div>
        </div>

        <!-- Simulated Card Form -->
        <div class="space-y-3 pt-1">
          <div>
            <label class="block text-xs font-bold text-ink mb-1">شماره کارت بانکی (۱۶ رقم):</label>
            <div class="field">
              <i data-lucide="credit-card" class="lead"></i>
              <input 
                v-model="onlineCardNumber" 
                class="input font-bold tracking-widest text-left" 
                placeholder="۶۰۳۷-۹۹۱۸-****-****" 
                dir="ltr"
              />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-2.5">
            <div>
              <label class="block text-xs font-bold text-ink mb-1">رمز اینترنتی (پویا):</label>
              <div class="flex gap-1.5">
                <input 
                  v-model="onlineCardCvv" 
                  type="password" 
                  class="input !text-center font-bold" 
                  placeholder="رمز پویا" 
                />
                <button 
                  type="button" 
                  @click="toast('رمز پویای پیامکی به شماره ثبت شده ارسال شد: ۹۸۴۲')" 
                  class="btn btn-soft !px-2.5 !min-h-[46px] text-[10px] font-bold shrink-0"
                >
                  درخواست رمز
                </button>
              </div>
            </div>

            <div>
              <label class="block text-xs font-bold text-ink mb-1">کد CVV2:</label>
              <input 
                v-model="onlineCardCvv2" 
                class="input !text-center font-bold tracking-widest" 
                placeholder="۳ یا ۴ رقم" 
                dir="ltr" 
              />
            </div>
          </div>
        </div>

        <!-- Pay Button -->
        <button 
          @click="executeOnlinePayment" 
          :disabled="gatewayProcessing"
          class="btn btn-royal w-full !min-h-[50px] font-black text-sm shadow-xl mt-2"
        >
          <span v-if="gatewayProcessing" class="flex items-center gap-2">
            <i data-lucide="loader-2" class="w-5 h-5 animate-spin"></i>
            <span>در حال اتصال به سوئیچ مرکزی شاپرک...</span>
          </span>
          <span v-else class="flex items-center gap-2">
            <i data-lucide="lock" class="w-4 h-4 text-sun"></i>
            <span>پرداخت ۱٬۵۰۰٬۰۰۰ تومان و فعال‌سازی فوری پنل</span>
          </span>
        </button>

        <p class="text-[10px] text-center text-[#5A6E99]">
          تراکنش شما در پروتکل پرداخت امن شاپرک و تحت نظارت بانک مرکزی ثبت می‌شود.
        </p>

      </div>
    </div>

    <!-- Math Game Modal (Grade 4 Challenge) -->
    <MathGameModal 
      v-if="openMathGame"
      @close="openMathGame = false"
      @add-points="handleGamePoints"
    />

    <!-- Levels & Badges Gamification Roadmap Modal -->
    <LevelsRoadmapModal 
      v-if="openLevelsRoadmap"
      :userPoints="Number(user.total_points || 0)"
      :currentLevel="Number(user.level || 1)"
      :currentLevelTitle="user.level_title || 'نوآموز'"
      @close="openLevelsRoadmap = false"
    />

    <!-- Toast Notification -->
    <div 
      v-if="toastMsg" 
      class="fixed top-5 left-1/2 -translate-x-1/2 z-[80] bg-ink text-white rounded-2xl px-5 py-3 shadow-2xl font-bold flex items-center gap-2 rise"
    >
      <i data-lucide="circle-check" class="w-5 h-5 text-sun"></i>
      <span>{{ toastMsg }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue';
import { faNum, playBeep, refreshIcons } from '../utils';
import MathGameModal from './MathGameModal.vue';
import MathGameSection from './MathGameSection.vue';
import LevelsRoadmapModal from './LevelsRoadmapModal.vue';
import ExamModuleNaghshYar from './ExamModuleNaghshYar.vue';
import CounselorChatSection from './CounselorChatSection.vue';

const props = defineProps({
  user: { type: Object, required: true }
});

const emit = defineEmits(['logout', 'update-user']);

const activeTab = ref('home');
const studyTab = ref('today');
const examSubTab = ref('list');
const meSubTab = ref('pts');
const toastMsg = ref('');
const showBirthday = ref(false);
const openMathGame = ref(false);
const openLevelsRoadmap = ref(false);

function handleExamFinished(result) {
  loadPoints();
  loadHomeworks();
  if (result?.pointsEarned) {
    const updated = (props.user.total_points || 0) + result.pointsEarned;
    emit('update-user', { total_points: updated });
    toast(`آفرین! +${faNum(result.pointsEarned)} امتیاز آزمون به حسابت افزوده شد`);
  }
}

function handleOpenLevels() {
  playBeep(880, 0.1);
  openLevelsRoadmap.value = true;
  nextTick(() => refreshIcons());
}

const nextLevelData = computed(() => {
  const p = Number(props.user.total_points || 0);
  if (p >= 2500) return { title: 'استاد', pointsNeeded: 0, nextTitle: null };
  if (p >= 2000) return { title: 'قهرمان', pointsNeeded: 2500 - p, nextTitle: 'استاد' };
  if (p >= 1600) return { title: 'طلایه‌دار', pointsNeeded: 2000 - p, nextTitle: 'قهرمان' };
  if (p >= 1250) return { title: 'نخبه', pointsNeeded: 1600 - p, nextTitle: 'طلایه‌دار' };
  if (p >= 950) return { title: 'فرزانه', pointsNeeded: 1250 - p, nextTitle: 'نخبه' };
  if (p >= 700) return { title: 'کاوشگر', pointsNeeded: 950 - p, nextTitle: 'فرزانه' };
  if (p >= 500) return { title: 'دانشور', pointsNeeded: 700 - p, nextTitle: 'کاوشگر' };
  if (p >= 300) return { title: 'پیشرو', pointsNeeded: 500 - p, nextTitle: 'دانشور' };
  if (p >= 150) return { title: 'پوینده', pointsNeeded: 300 - p, nextTitle: 'پیشرو' };
  return { title: 'نوآموز', pointsNeeded: 150 - p, nextTitle: 'پوینده' };
});

const levelProgressPercent = computed(() => {
  const p = Number(props.user.total_points || 0);
  let min = 0;
  let max = 150;
  if (p >= 2500) return 100;
  else if (p >= 2000) { min = 2000; max = 2500; }
  else if (p >= 1600) { min = 1600; max = 2000; }
  else if (p >= 1250) { min = 1250; max = 1600; }
  else if (p >= 950) { min = 950; max = 1250; }
  else if (p >= 700) { min = 700; max = 950; }
  else if (p >= 500) { min = 500; max = 700; }
  else if (p >= 300) { min = 300; max = 500; }
  else if (p >= 150) { min = 150; max = 300; }
  const pct = Math.round(((p - min) / (max - min)) * 100);
  return Math.min(100, Math.max(5, pct));
});

const homeworks = ref([]);
const exams = ref([]);
const studyLeaders = ref([]);
const studyStats = ref({ today_pomodoros: 0, today_minutes: 0, goal_minutes: 120, progress_percentage: 0 });
const pointsData = ref({ pluses: [], minuses: [] });

// Pomodoro Timer State
const pomoMode = ref('focus');
const pomoTime = ref(25 * 60);
const pomoRunning = ref(false);
let pomoInterval = null;

// Modals
const takingExam = ref(false);
const currentExamData = ref({});
const currentExamQuestions = ref([]);
const examQIndex = ref(0);
const selectedAnswers = ref({});
const examTimer = ref(15 * 60);
let examInterval = null;
const examResultModal = ref(null);

const submittingHomework = ref(null);
const hwNote = ref('');

const openReceiptModal = ref(false);
const receiptTrackCode = ref('۸۹۴۷۱۲');

// Direct Online Gateway State
const openOnlineGatewayModal = ref(false);
const paySubTab = ref('tuition'); // 'tuition' | 'platform'
const currentOnlinePayType = ref('tuition'); // 'tuition' | 'platform'
const currentOnlineAmount = ref(1500000);
const currentOnlineTitle = ref('شهریه کلاس‌های کانون');
const onlineCardNumber = ref('۶۰۳۷-۹۹۱۸-۴۵۱۲-۷۸۲۳');
const onlineCardCvv = ref('۹۸۴۲');
const onlineCardCvv2 = ref('۴۳۲');
const gatewayProcessing = ref(false);

function openOnlinePayment(type, amount, title) {
  currentOnlinePayType.value = type;
  currentOnlineAmount.value = amount;
  currentOnlineTitle.value = title;
  openOnlineGatewayModal.value = true;
}

watch([activeTab, studyTab, examSubTab, meSubTab, paySubTab, takingExam, examResultModal, submittingHomework, openReceiptModal, openMathGame, openOnlineGatewayModal, openLevelsRoadmap], () => {
  nextTick(() => refreshIcons());
});

function handleGamePoints(gainedPoints) {
  if (gainedPoints > 0) {
    const updated = (props.user.total_points || 0) + gainedPoints;
    emit('update-user', { total_points: updated });
    toast(`امتیاز شگفت‌انگیز! +${faNum(gainedPoints)} امتیاز بازی ریاضی به حسابت اضافه شد 🎯`);
    loadPoints();
  }
}

function toast(msg) {
  toastMsg.value = msg;
  nextTick(() => refreshIcons());
  setTimeout(() => toastMsg.value = '', 3000);
}

function triggerConfetti() {
  showBirthday.value = true;
  toast('روز تولدت مبارک! کانون رشد همراه همیشگی توست.');
}

function copyCard() {
  navigator.clipboard?.writeText('6037997000000000');
  toast('شماره کارت کانون با موفقیت کپی شد!');
}

// ----------------- POMODORO LOGIC -----------------
const formatTimerDisplay = computed(() => {
  const m = Math.floor(pomoTime.value / 60);
  const s = pomoTime.value % 60;
  return `${faNum(String(m).padStart(2, '0'))}:${faNum(String(s).padStart(2, '0'))}`;
});

const ringOffset = computed(() => {
  const total = pomoMode.value === 'focus' ? (25 * 60) : (5 * 60);
  const passed = total - pomoTime.value;
  return 691.15 * (1 - passed / total);
});

function setPomodoroMode(mode) {
  pomoMode.value = mode;
  resetPomodoro();
}

function togglePomodoro() {
  if (pomoRunning.value) {
    clearInterval(pomoInterval);
    pomoRunning.value = false;
  } else {
    pomoRunning.value = true;
    pomoInterval = setInterval(() => {
      if (pomoTime.value > 0) {
        pomoTime.value--;
      } else {
        clearInterval(pomoInterval);
        pomoRunning.value = false;
        playBeep(880, 0.4);
        finishPomodoro();
      }
    }, 1000);
  }
}

function resetPomodoro() {
  clearInterval(pomoInterval);
  pomoRunning.value = false;
  pomoTime.value = pomoMode.value === 'focus' ? (25 * 60) : (5 * 60);
}

function startQuickDemoPomodoro() {
  clearInterval(pomoInterval);
  pomoMode.value = 'focus';
  pomoTime.value = 5;
  pomoRunning.value = true;
  pomoInterval = setInterval(() => {
    if (pomoTime.value > 0) {
      pomoTime.value--;
    } else {
      clearInterval(pomoInterval);
      pomoRunning.value = false;
      playBeep(880, 0.4);
      finishPomodoro();
    }
  }, 1000);
}

async function finishPomodoro() {
  try {
    const res = await fetch('/api/study/pomodoro', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ student_id: props.user.id, minutes: 25 })
    });
    const d = await res.json();
    toast(d.message || 'پومودورو تکمیل شد! +۱۵ امتیاز');
    loadStudy();
    loadPoints();
  } catch (e) {
    console.error(e);
  }
}

// ----------------- HOMEWORKS -----------------
async function loadHomeworks() {
  try {
    const res = await fetch(`/api/homeworks?student_id=${props.user.id}&grade=${props.user.grade || 'هفتم'}&class_name=${props.user.class_name || 'الف'}`);
    homeworks.value = await res.json();
  } catch (e) {
    console.error(e);
  } finally {
    nextTick(() => refreshIcons());
  }
}

function startSubmitHomework(hw) {
  submittingHomework.value = hw;
  hwNote.value = '';
}

async function confirmHomeworkSubmit() {
  if (!submittingHomework.value) return;

  try {
    const res = await fetch(`/api/homeworks/${submittingHomework.value.id}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        student_id: props.user.id,
        note: hwNote.value,
        file_url: 'answer.pdf'
      })
    });
    const d = await res.json();
    toast(d.is_late ? 'تکلیف با تاخیر ارسال شد' : 'تکلیف با موفقیت ارسال شد و ۲۰ امتیاز دریافت کردی!');
    submittingHomework.value = null;
    loadHomeworks();
    loadPoints();
  } catch (e) {
    console.error(e);
  }
}

// ----------------- EXAMS -----------------
async function loadExams() {
  try {
    const res = await fetch(`/api/exams?grade=${props.user.grade || 'هفتم'}&class_name=${props.user.class_name || 'الف'}`);
    exams.value = await res.json();
  } catch (e) {
    console.error(e);
  } finally {
    nextTick(() => refreshIcons());
  }
}

async function startExam(id) {
  try {
    const res = await fetch(`/api/exams/${id}`);
    const data = await res.json();
    currentExamData.value = data;
    currentExamQuestions.value = data.questions || [];
    examQIndex.value = 0;
    selectedAnswers.value = {};
    examTimer.value = (data.duration_minutes || 10) * 60;
    takingExam.value = true;

    clearInterval(examInterval);
    examInterval = setInterval(() => {
      if (examTimer.value > 0) {
        examTimer.value--;
      } else {
        clearInterval(examInterval);
        submitExamFinal();
      }
    }, 1000);
  } catch (e) {
    console.error(e);
  } finally {
    nextTick(() => refreshIcons());
  }
}

const formatExamTimer = computed(() => {
  const m = Math.floor(examTimer.value / 60);
  const s = examTimer.value % 60;
  return `${faNum(String(m).padStart(2, '0'))}:${faNum(String(s).padStart(2, '0'))}`;
});

async function submitExamFinal() {
  clearInterval(examInterval);
  try {
    const res = await fetch(`/api/exams/${currentExamData.value.id}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        student_id: props.user.id,
        answers: selectedAnswers.value
      })
    });
    const result = await res.json();
    examResultModal.value = result;
    loadPoints();
  } catch (e) {
    console.error(e);
  } finally {
    nextTick(() => refreshIcons());
  }
}

// ----------------- STUDY & POINTS -----------------
async function loadStudy() {
  try {
    const [statsRes, leadersRes] = await Promise.all([
      fetch(`/api/study/stats/${props.user.id}`),
      fetch(`/api/study/leaderboard?type=${studyTab.value}`)
    ]);
    studyStats.value = await statsRes.json();
    studyLeaders.value = await leadersRes.json();
  } catch (e) {
    console.error(e);
  } finally {
    nextTick(() => refreshIcons());
  }
}

async function loadPoints() {
  try {
    const res = await fetch(`/api/points/${props.user.id}`);
    pointsData.value = await res.json();
    if (pointsData.value.total_points !== props.user.total_points) {
      emit('update-user', { total_points: pointsData.value.total_points });
    }
  } catch (e) {
    console.error(e);
  } finally {
    nextTick(() => refreshIcons());
  }
}

// ----------------- FEE RECEIPT & ONLINE PAYMENT -----------------
async function executeOnlinePayment() {
  gatewayProcessing.value = true;
  playBeep(900, 0.15);

  try {
    const res = await fetch('/api/fees/pay-online', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        student_id: props.user.id,
        amount: currentOnlineAmount.value,
        fee_type: currentOnlinePayType.value,
        gateway: 'shaparak'
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'خطا در پرداخت درگاه بانکی');

    playBeep(1200, 0.3);
    openOnlineGatewayModal.value = false;

    if (currentOnlinePayType.value === 'platform') {
      emit('update-user', { platform_fee_status: 'paid' });
      toast(`پرداخت هزینه اشتراک سامانه با کد رهگیری ${data.tracking_code} با موفقیت ثبت شد! 🎉`);
    } else {
      emit('update-user', { fee_status: 'paid', is_locked: 0 });
      toast(`شهریه دوره کانون با کد رهگیری ${data.tracking_code} تسویه و پنل فعال شد! 🎉`);
    }
  } catch (err) {
    toast(err.message);
  } finally {
    gatewayProcessing.value = false;
    nextTick(() => refreshIcons());
  }
}

async function submitReceipt() {
  try {
    const res = await fetch('/api/fees/receipts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        student_id: props.user.id,
        amount: 1500000,
        tracking_code: receiptTrackCode.value
      })
    });
    const d = await res.json();
    toast(d.message || 'رسید با موفقیت ثبت شد');
    openReceiptModal.value = false;
    emit('update-user', { fee_status: 'pending', is_locked: 0 });
  } catch (e) {
    console.error(e);
  }
}

onMounted(() => {
  loadHomeworks();
  loadExams();
  loadStudy();
  loadPoints();
  refreshIcons();
});

onUnmounted(() => {
  clearInterval(pomoInterval);
  clearInterval(examInterval);
});
</script>
