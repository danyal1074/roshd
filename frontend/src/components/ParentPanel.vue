<template>
  <div class="min-h-screen pb-28 sm:pb-24">
    <!-- Header -->
    <header class="brand-bg relative text-white">
      <div class="dots absolute inset-0 opacity-50"></div>
      <div class="relative max-w-4xl mx-auto px-4 pt-4 pb-24 sm:pb-28 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center shrink-0 shadow-sm">
            <i data-lucide="graduation-cap" class="w-6 h-6 text-sun"></i>
          </div>
          <div class="leading-tight">
            <p class="font-extrabold text-sm sm:text-base truncate">کانون نخبه‌پروری شهید کاظم آشتیانی</p>
            <p class="text-white/75 text-xs">پلتفرم رشد | پنل اختصاصی اولیا</p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <div class="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-sun text-ink flex items-center justify-center font-black text-sm shadow-md" title="پروفایل والدین">
            پ
          </div>
          <button 
            @click="$emit('logout')" 
            class="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-white/15 flex items-center justify-center hover:bg-white/25 transition-all cursor-pointer border-none text-white"
            title="خروج از حساب"
          >
            <i data-lucide="log-out" class="w-5 h-5"></i>
          </button>
        </div>
      </div>
    </header>

    <main class="max-w-4xl mx-auto px-4 -mt-[84px] sm:-mt-[96px] relative space-y-4 sm:space-y-5">
      <!-- Welcome & Child Switcher Hero Banner -->
      <div class="px-1 text-white space-y-3">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <p class="text-white/80 text-xs sm:text-sm font-medium">دوشنبه ۴ آبان ۱۴۰۵</p>
            <h2 class="text-2xl sm:text-[28px] font-black leading-snug">سلام، خانواده محترم رضایی</h2>
          </div>
          <span class="inline-flex items-center gap-1.5 self-start sm:self-auto px-3 py-1 rounded-full bg-white/20 backdrop-blur text-xs font-bold text-white border border-white/30">
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>سال تحصیلی ۱۴۰۵-۱۴۰۴</span>
          </span>
        </div>
        
        <!-- Professional Child Switcher Card -->
        <div class="p-1.5 bg-white/15 backdrop-blur-md rounded-2xl border border-white/25 flex gap-2 shadow-lg">
          <button 
            @click="selectedChild = 'ali'" 
            :class="[
              'flex-1 flex items-center justify-center gap-2.5 py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer border-none',
              selectedChild === 'ali' 
                ? 'bg-white text-royal shadow-md font-black scale-[1.01]' 
                : 'text-white/90 hover:text-white hover:bg-white/10'
            ]"
          >
            <div class="w-7 h-7 rounded-full bg-royal text-white flex items-center justify-center text-xs font-black shadow-sm shrink-0">
              ع
            </div>
            <div class="text-right leading-tight">
              <p class="font-extrabold text-xs sm:text-sm">علی رضایی</p>
              <p class="text-[10px] opacity-75 hidden sm:block">پایه هفتم الف • معدل ۱۹.۲</p>
            </div>
          </button>

          <button 
            @click="selectedChild = 'sara'" 
            :class="[
              'flex-1 flex items-center justify-center gap-2.5 py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer border-none',
              selectedChild === 'sara' 
                ? 'bg-white text-royal shadow-md font-black scale-[1.01]' 
                : 'text-white/90 hover:text-white hover:bg-white/10'
            ]"
          >
            <div class="w-7 h-7 rounded-full bg-pink-600 text-white flex items-center justify-center text-xs font-black shadow-sm shrink-0">
              س
            </div>
            <div class="text-right leading-tight">
              <p class="font-extrabold text-xs sm:text-sm">سارا رضایی</p>
              <p class="text-[10px] opacity-75 hidden sm:block">پایه نهم ب • معدل ۱۹.۸</p>
            </div>
          </button>
        </div>
      </div>

      <!-- 4 High-Impact KPI Cards (Mobile: 2x2, Desktop: 4 cols) -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <!-- 1. غیبت‌ها -->
        <div class="card p-3.5 sm:p-4.5 flex flex-col justify-between hover:shadow-md transition-all border border-line">
          <div class="flex items-center justify-between">
            <span class="text-xs text-[#5A6E99] font-bold">غیبت‌ها</span>
            <div class="w-8 h-8 rounded-xl bg-emerald-50 text-ok flex items-center justify-center">
              <i data-lucide="calendar-check" class="w-4 h-4"></i>
            </div>
          </div>
          <div class="mt-2">
            <p class="text-2xl sm:text-3xl font-black text-ok">۰ <span class="text-xs font-bold text-[#5A6E99]">جلسه</span></p>
            <p class="text-[11px] text-ok font-bold mt-0.5">حضور کامل و منظم</p>
          </div>
        </div>

        <!-- 2. میانگین کل -->
        <div class="card p-3.5 sm:p-4.5 flex flex-col justify-between hover:shadow-md transition-all border border-line">
          <div class="flex items-center justify-between">
            <span class="text-xs text-[#5A6E99] font-bold">میانگین نمرات</span>
            <div class="w-8 h-8 rounded-xl bg-blue-50 text-royal flex items-center justify-center">
              <i data-lucide="award" class="w-4 h-4"></i>
            </div>
          </div>
          <div class="mt-2">
            <p class="text-2xl sm:text-3xl font-black text-royal">{{ faNum(parentData.report_card?.average || 19.2) }}</p>
            <p class="text-[11px] text-royal font-bold mt-0.5">رتبه ۴ در کل پایه</p>
          </div>
        </div>

        <!-- 3. تکمیل تکالیف -->
        <div class="card p-3.5 sm:p-4.5 flex flex-col justify-between hover:shadow-md transition-all border border-line">
          <div class="flex items-center justify-between">
            <span class="text-xs text-[#5A6E99] font-bold">تکمیل تکالیف</span>
            <div class="w-8 h-8 rounded-xl bg-amber-50 text-[#B07A00] flex items-center justify-center">
              <i data-lucide="notebook-pen" class="w-4 h-4"></i>
            </div>
          </div>
          <div class="mt-2">
            <p class="text-2xl sm:text-3xl font-black text-[#B07A00]">۸۸٪</p>
            <p class="text-[11px] text-[#7A5600] font-bold mt-0.5">۷ از ۸ تکلیف انجام شده</p>
          </div>
        </div>

        <!-- 4. وضعیت شهریه -->
        <div class="card p-3.5 sm:p-4.5 flex flex-col justify-between hover:shadow-md transition-all border border-line">
          <div class="flex items-center justify-between">
            <span class="text-xs text-[#5A6E99] font-bold">حق عضویت</span>
            <div class="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
              <i data-lucide="wallet" class="w-4 h-4"></i>
            </div>
          </div>
          <div class="mt-2">
            <span class="inline-flex items-center gap-1 text-xs font-black text-ok bg-[#E6F7EE] py-1 px-2.5 rounded-lg">
              <i data-lucide="check" class="w-3.5 h-3.5"></i>
              <span>تسویه و فعال</span>
            </span>
            <p class="text-[10px] text-[#5A6E99] font-bold mt-1.5">بدون بدهی معوق</p>
          </div>
        </div>
      </div>

      <!-- ================= PROFESSIONAL BUTTONS / TABS NAVIGATION ================= -->
      <!-- This is the exact button bar requested by the user, now styled to perfection -->
      <nav 
        class="sticky top-0 z-20 -mx-4 px-4 py-2 bg-mist/95 backdrop-blur-md flex items-center gap-2 overflow-x-auto no-scrollbar border-b border-line/60" 
        aria-label="بخش‌های پنل والدین"
      >
        <button 
          v-for="s in sections" 
          :key="s.key"
          @click="activeSection = s.key"
          :class="[
            'px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer border select-none',
            activeSection === s.key 
              ? 'bg-royal text-white border-royal shadow-lg font-black scale-[1.02]' 
              : 'bg-white text-[#5A6E99] border-line hover:border-royal/40 hover:bg-slate-50 hover:text-ink'
          ]"
        >
          <i :data-lucide="s.icon" class="w-4 h-4"></i>
          <span>{{ s.label }}</span>
        </button>
      </nav>

      <!-- ================= SECTION 1: کارنامه دیجیتال ================= -->
      <section v-if="activeSection === 'card'" class="card p-4 sm:p-6 space-y-4 border border-line shadow-sm rise">
        <div class="flex items-center justify-between gap-3 pb-3 border-b border-line/70">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-2xl bg-royal/10 text-royal flex items-center justify-center shrink-0">
              <i data-lucide="file-badge" class="w-6 h-6"></i>
            </div>
            <div>
              <h3 class="font-black text-base sm:text-lg text-ink">کارنامه تحصیلی ماهانه</h3>
              <p class="text-xs text-[#5A6E99] mt-0.5">آزمون جامع ماهانه آبان ۱۴۰۵ • کانون نخبه‌پروری</p>
            </div>
          </div>
          <button 
            @click="toast('فایل PDF کارنامه رسمی با موفقیت دانلود شد')" 
            class="btn btn-royal !min-h-[40px] text-xs font-bold !px-3.5 shadow-sm"
          >
            <i data-lucide="download" class="w-4 h-4"></i>
            <span class="hidden sm:inline">دانلود کارنامه PDF</span>
            <span class="sm:hidden">دانلود</span>
          </button>
        </div>

        <!-- Course Grades List -->
        <div class="space-y-2.5">
          <div 
            v-for="c in parentData.report_card?.courses || defaultCourses" 
            :key="c.name"
            class="p-3.5 sm:p-4 rounded-2xl bg-mist border border-line/80 flex items-center justify-between hover:bg-white hover:border-royal/30 transition-all"
          >
            <div class="flex items-center gap-3 min-w-0">
              <div class="w-10 h-10 rounded-xl bg-white text-royal border border-line flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                {{ c.name[0] }}
              </div>
              <div class="truncate">
                <p class="font-extrabold text-sm text-ink truncate">{{ c.name }}</p>
                <p class="text-xs text-[#5A6E99] mt-0.5">دبیر: {{ c.teacher }}</p>
              </div>
            </div>
            
            <div class="flex items-center gap-3 shrink-0">
              <span 
                :class="[
                  'px-3 py-1 rounded-xl font-mono text-sm sm:text-base font-black shadow-sm border',
                  c.score >= 18 ? 'bg-emerald-50 text-ok border-emerald-200' : 'bg-blue-50 text-royal border-blue-200'
                ]"
              >
                {{ faNum(c.score) }}
              </span>
            </div>
          </div>
        </div>

        <!-- Overall Score Card -->
        <div class="rounded-2xl p-4 sm:p-5 flex items-center justify-between text-white" style="background:linear-gradient(135deg,#0A4BD6,#0B1F4D)">
          <div class="space-y-1">
            <p class="text-xs text-white/80 font-bold">معدل کل کارنامه</p>
            <p class="text-2xl sm:text-3xl font-black text-sun">
              {{ faNum(parentData.report_card?.average || 19.2) }} <span class="text-xs text-white/70">از ۲۰</span>
            </p>
          </div>
          <div class="text-left border-r border-white/20 pr-4 sm:pr-6 space-y-1">
            <p class="text-xs text-white/80 font-bold">رتبه در کل پایه</p>
            <p class="text-xl sm:text-2xl font-black text-white">رتبه ۴ <span class="text-xs text-white/70">از ۳۸ نفر</span></p>
          </div>
        </div>
      </section>

      <!-- ================= SECTION 2: غیبت‌ها ================= -->
      <section v-if="activeSection === 'abs'" class="card p-4 sm:p-6 space-y-4 border border-line shadow-sm rise">
        <div class="flex items-center gap-3 pb-3 border-b border-line/70">
          <div class="w-12 h-12 rounded-2xl bg-emerald-50 text-ok flex items-center justify-center shrink-0">
            <i data-lucide="calendar-check" class="w-6 h-6"></i>
          </div>
          <div>
            <h3 class="font-black text-base sm:text-lg text-ink">سوابق حضور و غیاب</h3>
            <p class="text-xs text-[#5A6E99] mt-0.5">گزارش لحظه‌ای ثبت‌شده توسط دبیران کانون</p>
          </div>
        </div>

        <div class="p-4 rounded-2xl bg-[#E6F7EE] text-ok border border-emerald-200 flex items-start gap-3">
          <i data-lucide="check-circle-2" class="w-5 h-5 text-ok shrink-0 mt-0.5"></i>
          <div class="text-xs sm:text-sm font-bold leading-relaxed">
            <p class="font-extrabold text-sm">وضعیت انضباطی: عالی (بدون هیچ غیبت غیرموجه)</p>
            <p class="text-emerald-700 font-normal mt-0.5">تمام جلسات مهر و آبان ماه با حضور منظم و فعال دانش‌آموز سپری شده است.</p>
          </div>
        </div>

        <!-- Attendance Timeline -->
        <div class="space-y-2.5">
          <div class="p-3.5 rounded-2xl bg-mist border border-line flex items-center justify-between text-xs sm:text-sm">
            <div class="flex items-center gap-3">
              <span class="w-2.5 h-2.5 rounded-full bg-ok"></span>
              <div>
                <p class="font-bold text-ink">کلاس تقویتی ریاضی - استاد کریمی</p>
                <p class="text-xs text-[#5A6E99]">دوشنبه ۴ آبان • ساعت ۱۶:۰۰</p>
              </div>
            </div>
            <span class="tag bg-emerald-100 text-ok border border-emerald-200 font-bold">حاضر در کلاس</span>
          </div>

          <div class="p-3.5 rounded-2xl bg-mist border border-line flex items-center justify-between text-xs sm:text-sm">
            <div class="flex items-center gap-3">
              <span class="w-2.5 h-2.5 rounded-full bg-ok"></span>
              <div>
                <p class="font-bold text-ink">کارگاه آزمایشگاه علوم - استاد احمدی</p>
                <p class="text-xs text-[#5A6E99]">شنبه ۲ آبان • ساعت ۱۵:۳۰</p>
              </div>
            </div>
            <span class="tag bg-emerald-100 text-ok border border-emerald-200 font-bold">حاضر در کلاس</span>
          </div>
        </div>
      </section>

      <!-- ================= SECTION 3: تکالیف ================= -->
      <section v-if="activeSection === 'hw'" class="card p-4 sm:p-6 space-y-4 border border-line shadow-sm rise">
        <div class="flex items-center justify-between gap-3 pb-3 border-b border-line/70">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-2xl bg-amber-50 text-[#B07A00] flex items-center justify-center shrink-0">
              <i data-lucide="notebook-pen" class="w-6 h-6"></i>
            </div>
            <div>
              <h3 class="font-black text-base sm:text-lg text-ink">تکالیف درسی و تمرین‌ها</h3>
              <p class="text-xs text-[#5A6E99] mt-0.5">وضعیت ارسال، بررسی و بازخورد دبیران</p>
            </div>
          </div>
          <span class="tag bg-amber-100 text-[#7A5600] font-black text-xs">
            ۸۸٪ تکمیل
          </span>
        </div>

        <div class="space-y-3">
          <div class="p-4 rounded-2xl bg-mist border border-line space-y-2">
            <div class="flex items-center justify-between">
              <span class="font-extrabold text-sm sm:text-base text-ink">تمرین‌های فصل ۳ ریاضی (کسرها)</span>
              <span class="tag bg-emerald-100 text-ok font-black text-xs">نمره ۲۰ از ۲۰</span>
            </div>
            <p class="text-xs text-[#5A6E99]">مهلت: یکشنبه ۳ آبان • تحویل داده شده سر وقت</p>
            <div class="p-2.5 rounded-xl bg-white border border-line/60 text-xs text-ink">
              <span class="font-bold text-royal">بازخورد معلم:</span> بسیار عالی و تمیز حل شده است.
            </div>
          </div>

          <div class="p-4 rounded-2xl bg-mist border border-line space-y-2">
            <div class="flex items-center justify-between">
              <span class="font-extrabold text-sm sm:text-base text-ink">گزارش آزمایش علوم تجربی</span>
              <span class="tag bg-blue-100 text-royal font-bold text-xs">در انتظار بررسی معلم</span>
            </div>
            <p class="text-xs text-[#5A6E99]">مهلت: چهارشنبه ۶ آبان • فایل آزمایشگاه ارسال گردید</p>
          </div>
        </div>
      </section>

      <!-- ================= SECTION 4: اطلاعیه‌ها ================= -->
      <section v-if="activeSection === 'ann'" class="card p-4 sm:p-6 space-y-4 border border-line shadow-sm rise">
        <div class="flex items-center gap-3 pb-3 border-b border-line/70">
          <div class="w-12 h-12 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
            <i data-lucide="megaphone" class="w-6 h-6"></i>
          </div>
          <div>
            <h3 class="font-black text-base sm:text-lg text-ink">اطلاعیه‌های اولیا و کانون</h3>
            <p class="text-xs text-[#5A6E99] mt-0.5">اعلان‌های مهم آموزشی، جلسات و برنامه‌ها</p>
          </div>
        </div>

        <div class="space-y-3">
          <div class="p-4 rounded-2xl bg-mist border border-line flex items-start gap-3.5">
            <div class="w-10 h-10 rounded-xl bg-royal text-white flex items-center justify-center shrink-0 shadow-sm">
              <i data-lucide="clock" class="w-5 h-5"></i>
            </div>
            <div class="flex-1">
              <div class="flex items-center justify-between">
                <p class="font-bold text-sm sm:text-base text-ink">تغییر ساعت کلاس تقویتی ریاضی</p>
                <span class="text-[10px] text-[#5A6E99] font-bold">امروز ۰۹:۰۰</span>
              </div>
              <p class="text-xs text-[#5A6E99] mt-1 leading-relaxed">
                به اطلاع می‌رساند جلسه ریاضی پایه هفتم دوشنبه‌ها از ساعت ۱۶:۰۰ الی ۱۷:۳۰ در کلاس شماره ۳ برگزار می‌گردد.
              </p>
            </div>
          </div>

          <div class="p-4 rounded-2xl bg-mist border border-line flex items-start gap-3.5">
            <div class="w-10 h-10 rounded-xl bg-sun text-ink flex items-center justify-center shrink-0 shadow-sm">
              <i data-lucide="trophy" class="w-5 h-5"></i>
            </div>
            <div class="flex-1">
              <div class="flex items-center justify-between">
                <p class="font-bold text-sm sm:text-base text-ink">آزمون جامع دوره‌ای آبان‌ماه</p>
                <span class="text-[10px] text-[#5A6E99] font-bold">دیروز ۱۸:۳۰</span>
              </div>
              <p class="text-xs text-[#5A6E99] mt-1 leading-relaxed">
                آزمون حضوری کانون روز پنجشنبه ۷ آبان ساعت ۹ صبح برگزار خواهد شد. پاسخ‌برگ‌ها همان روز تصحیح و کارنامه صادر می‌شود.
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- ================= SECTION 5: نمودار پیشرفت ================= -->
      <section v-if="activeSection === 'prog'" class="card p-4 sm:p-6 space-y-4 border border-line shadow-sm rise">
        <div class="flex items-center gap-3 pb-3 border-b border-line/70">
          <div class="w-12 h-12 rounded-2xl bg-emerald-50 text-ok flex items-center justify-center shrink-0">
            <i data-lucide="trending-up" class="w-6 h-6"></i>
          </div>
          <div>
            <h3 class="font-black text-base sm:text-lg text-ink">نمودار پیشرفت تحصیلی دوره‌ای</h3>
            <p class="text-xs text-[#5A6E99] mt-0.5">روند رشد نمرات در سه ماه اخیر</p>
          </div>
        </div>

        <!-- Visual Bar Chart -->
        <div class="flex items-end justify-around gap-4 h-48 sm:h-52 mt-4 px-4 border-b border-line pb-4 bg-mist/60 rounded-2xl p-4">
          <div class="flex flex-col items-center gap-2">
            <span class="text-xs font-black text-slate-500">۱۷.۵</span>
            <div class="w-12 sm:w-16 bg-slate-300 rounded-t-2xl h-24 shadow-sm"></div>
            <span class="text-xs text-[#5A6E99] font-bold">شهریور</span>
          </div>

          <div class="flex flex-col items-center gap-2">
            <span class="text-xs font-black text-royal">۱۸.۸</span>
            <div class="w-12 sm:w-16 bg-royal/70 rounded-t-2xl h-32 shadow-sm"></div>
            <span class="text-xs text-[#5A6E99] font-bold">مهر</span>
          </div>

          <div class="flex flex-col items-center gap-2">
            <span class="text-xs font-black text-ok">۱۹.۲</span>
            <div class="w-12 sm:w-16 bg-ok rounded-t-2xl h-40 shadow-md"></div>
            <span class="text-xs text-ok font-black">آبان (جاری)</span>
          </div>
        </div>

        <!-- Counselor Feedback Box -->
        <div class="rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200/70 p-4 sm:p-5 flex gap-3.5 shadow-sm">
          <div class="w-10 h-10 rounded-xl bg-royal text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
            <i data-lucide="message-square-quote" class="w-5 h-5"></i>
          </div>
          <div class="space-y-1">
            <p class="font-black text-sm text-royal">یادداشت مشاور تحصیلی کانون (استاد کریمی)</p>
            <p class="text-xs sm:text-sm text-ink leading-relaxed">
              "روند درسی و تمرکز مطالعاتی علی در دو ماه اخیر جهش چشمگیری داشته است. تسلط او در مباحث ریاضی و مفاهیم علوم تجربی عالی است و با حفظ همین استمرار، رتبه تک‌رقمی در آزمون جامع تثبیت خواهد شد."
            </p>
          </div>
        </div>
      </section>
    </main>

    <!-- Bottom Navigation Dock for Parent Panel (Mobile Optimized) -->
    <nav class="dock fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur border-t border-line pb-[env(safe-area-inset-bottom)]" aria-label="منوی اصلی والدین">
      <div class="max-w-md mx-auto grid grid-cols-5">
        <button 
          @click="activeSection = 'card'" 
          :aria-current="activeSection === 'card' ? 'page' : undefined"
          class="dock-item"
        >
          <i data-lucide="file-badge"></i>
          <span>کارنامه</span>
        </button>
        <button 
          @click="activeSection = 'abs'" 
          :aria-current="activeSection === 'abs' ? 'page' : undefined"
          class="dock-item"
        >
          <i data-lucide="calendar-check"></i>
          <span>غیبت‌ها</span>
        </button>
        <button 
          @click="activeSection = 'hw'" 
          :aria-current="activeSection === 'hw' ? 'page' : undefined"
          class="dock-item"
        >
          <i data-lucide="notebook-pen"></i>
          <span>تکالیف</span>
        </button>
        <button 
          @click="activeSection = 'ann'" 
          :aria-current="activeSection === 'ann' ? 'page' : undefined"
          class="dock-item"
        >
          <i data-lucide="megaphone"></i>
          <span>اطلاعیه</span>
        </button>
        <button 
          @click="activeSection = 'prog'" 
          :aria-current="activeSection === 'prog' ? 'page' : undefined"
          class="dock-item"
        >
          <i data-lucide="trending-up"></i>
          <span>پیشرفت</span>
        </button>
      </div>
    </nav>

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
import { ref, onMounted, nextTick, watch } from 'vue';
import { faNum, refreshIcons } from '../utils';

const props = defineProps({
  user: { type: Object, required: true }
});

defineEmits(['logout']);

const selectedChild = ref('ali');
const activeSection = ref('card');
const toastMsg = ref('');

const sections = [
  { key: 'card', label: 'کارنامه دیجیتال', icon: 'file-badge' },
  { key: 'abs', label: 'غیبت‌ها و حضور', icon: 'calendar-check' },
  { key: 'hw', label: 'تکالیف فرزند', icon: 'notebook-pen' },
  { key: 'ann', label: 'اطلاعیه‌ها', icon: 'megaphone' },
  { key: 'prog', label: 'نمودار پیشرفت', icon: 'trending-up' }
];

const defaultCourses = [
  { name: 'ریاضیات', teacher: 'استاد رضا کریمی', score: 19.5 },
  { name: 'علوم تجربی', teacher: 'استاد فاطمه احمدی', score: 19 },
  { name: 'ادبیات فارسی', teacher: 'استاد مریم حسینی', score: 19 },
  { name: 'عربی و قرآن', teacher: 'استاد حسنی', score: 20 },
  { name: 'زبان انگلیسی', teacher: 'استاد مرادی', score: 18.5 }
];

const parentData = ref({
  report_card: {
    average: 19.2,
    courses: defaultCourses
  },
  teacher_note: 'روند درسی و تمرکز مطالعاتی علی در دو ماه اخیر جهش چشمگیری داشته است.'
});

watch([activeSection, selectedChild], () => {
  nextTick(() => refreshIcons());
});

function toast(msg) {
  toastMsg.value = msg;
  nextTick(() => refreshIcons());
  setTimeout(() => toastMsg.value = '', 3000);
}

async function loadParentOverview() {
  try {
    const res = await fetch('/api/parent/overview');
    if (res.ok) {
      const data = await res.json();
      if (data && data.report_card) {
        parentData.value = data;
      }
    }
  } catch (e) {
    console.error(e);
  } finally {
    nextTick(() => refreshIcons());
  }
}

onMounted(() => {
  loadParentOverview();
  refreshIcons();
});
</script>
