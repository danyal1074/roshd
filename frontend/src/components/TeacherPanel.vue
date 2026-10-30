<template>
  <div class="min-h-screen pb-28">
    <!-- Header (Identical to rosh-step3-teacher.html) -->
    <header class="brand-bg relative text-white">
      <div class="dots absolute inset-0 opacity-50"></div>
      <div class="relative max-w-3xl mx-auto px-4 pt-4 pb-24 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center shrink-0">
            <i data-lucide="graduation-cap" class="w-6 h-6 text-sun"></i>
          </div>
          <div class="leading-tight">
            <p class="font-extrabold truncate">کانون نخبه‌پروری شهید کاظم آشتیانی</p>
            <p class="text-white/70 text-xs">پلتفرم رشد، پنل معلم ({{ user.full_name }})</p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <div class="w-11 h-11 rounded-2xl bg-sun text-ink flex items-center justify-center font-extrabold text-sm shadow">
            {{ user.first_name[0] }}.{{ user.last_name[0] }}
          </div>
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
      <!-- ================= 1. کلاس‌ها (ATTENDANCE & PERFORMANCE) ================= -->
      <section v-if="activeTab === 'cls'" class="space-y-4">
        <div class="text-white px-1">
          <p class="text-white/80 text-sm">دوشنبه ۴ آبان ۱۴۰۵</p>
          <h2 class="text-[26px] font-extrabold leading-snug">سلام {{ user.first_name }}، خوش آمدید</h2>
        </div>

        <div class="seg-ctl">
          <button @click="clsSubTab = 'att'" :aria-pressed="clsSubTab === 'att'">
            حضور و غیاب
          </button>
          <button @click="clsSubTab = 'perf'" :aria-pressed="clsSubTab === 'perf'">
            عملکرد دانش‌آموزان
          </button>
        </div>

        <!-- Class Filter Chips -->
        <div class="flex gap-2 overflow-x-auto pb-1">
          <button 
            v-for="c in classOptions" 
            :key="c.id"
            @click="selectedClass = c; loadAttendance()"
            :class="[
              'min-h-[40px] px-4 rounded-full border text-xs font-bold whitespace-nowrap transition-all cursor-pointer',
              selectedClass.id === c.id 
                ? 'bg-royal border-royal text-white shadow-sm' 
                : 'bg-white border-line text-[#5A6E99]'
            ]"
          >
            {{ c.label }}
          </button>
        </div>

        <!-- Attendance View -->
        <div v-if="clsSubTab === 'att'" class="space-y-3">
          <div class="card p-3 sm:p-4 flex items-center justify-between gap-2 flex-wrap">
            <div class="flex items-center gap-1.5 sm:gap-3 flex-wrap">
              <span class="tag bg-[#E6F7EE] text-ok text-[11px] sm:text-xs">حاضر <b class="mr-1">{{ faNum(attStats.present) }}</b></span>
              <span class="tag bg-[#FDECEC] text-late text-[11px] sm:text-xs">غایب <b class="mr-1">{{ faNum(attStats.absent) }}</b></span>
              <span class="tag bg-sun/30 text-[#7A5600] text-[11px] sm:text-xs">با اطلاع <b class="mr-1">{{ faNum(attStats.excused) }}</b></span>
            </div>
            <button @click="markAllPresent" class="btn btn-soft btn-sm font-bold text-xs !min-h-[36px] !px-3">
              <i data-lucide="check-check" class="w-4 h-4"></i>
              <span>همه حاضر</span>
            </button>
          </div>

          <!-- Students Attendance List with Responsive Touch Row -->
          <div class="space-y-2">
            <div 
              v-for="st in attStudents" 
              :key="st.id"
              class="card p-2.5 sm:p-3 flex items-center justify-between gap-2"
            >
              <div class="min-w-0 flex-1">
                <p class="font-bold text-xs sm:text-sm text-ink truncate">{{ st.full_name }}</p>
                <p class="text-[10px] sm:text-xs text-[#5A6E99]">پرونده: {{ faNum(st.id) }}</p>
              </div>

              <div class="flex gap-1 shrink-0">
                <button 
                  @click="st.status = 'p'" 
                  :class="[
                    'px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition-all border-none cursor-pointer',
                    st.status === 'p' ? 'bg-ok text-white shadow-sm' : 'bg-mist text-[#7D90B8]'
                  ]"
                >
                  حاضر
                </button>
                <button 
                  @click="st.status = 'a'" 
                  :class="[
                    'px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition-all border-none cursor-pointer',
                    st.status === 'a' ? 'bg-late text-white shadow-sm' : 'bg-mist text-[#7D90B8]'
                  ]"
                >
                  غایب
                </button>
                <button 
                  @click="st.status = 'e'" 
                  :class="[
                    'px-2 sm:px-2.5 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition-all border-none cursor-pointer',
                    st.status === 'e' ? 'bg-sun text-ink shadow-sm' : 'bg-mist text-[#7D90B8]'
                  ]"
                >
                  بااطلاع
                </button>
              </div>
            </div>
          </div>

          <!-- SMS Notification Note -->
          <div class="rounded-[20px] p-4 flex items-start gap-3 bg-[#EEF4FF] text-royal text-sm font-semibold">
            <i data-lucide="message-square-text" class="w-6 h-6 shrink-0 text-royal"></i>
            <p>
              پیامک غیبت برای والدین <span class="font-black text-late">{{ faNum(attStats.absent) }}</span> دانش‌آموز غایب به صورت خودکار ارسال می‌شود.
            </p>
          </div>

          <button @click="saveAttendance" class="btn btn-royal w-full" style="min-height:56px">
            <i data-lucide="save" class="w-5 h-5"></i>
            <span>ثبت حضور و غیاب</span>
          </button>
        </div>

        <!-- Student Performance & AI Path View -->
        <div v-if="clsSubTab === 'perf'" class="space-y-4">
          <!-- Class Overview KPI Banner -->
          <div class="card p-4 sm:p-5 bg-gradient-to-br from-white via-mist/50 to-mist border border-line">
            <div class="flex items-center justify-between flex-wrap gap-2 mb-3">
              <div>
                <h3 class="font-black text-lg sm:text-xl text-ink flex items-center gap-2">
                  <span>عملکرد و تحلیل هوشمند یادگیری دانش‌آموزان</span>
                  <span class="text-xs font-bold text-royal bg-royal/10 px-2.5 py-1 rounded-full">کلاس {{ selectedClass.label }}</span>
                </h3>
                <p class="text-xs text-slate-500 mt-0.5">تحلیل جامع فعالیت در سامانه بر اساس ساعت مطالعه، تکالیف، آزمون‌ها و حضور و غیاب</p>
              </div>
              <button @click="loadStudentsPerformance" class="btn btn-mist btn-sm text-xs font-bold flex items-center gap-1.5" :disabled="perfLoading">
                <i data-lucide="refresh-cw" :class="['w-3.5 h-3.5', perfLoading ? 'animate-spin' : '']"></i>
                <span>به‌روزرسانی داده‌ها</span>
              </button>
            </div>

            <!-- 4 KPI Stat Boxes -->
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div 
                @click="perfFilter = 'needs_attention'" 
                class="cursor-pointer p-3 rounded-2xl border transition-all duration-200"
                :class="perfFilter === 'needs_attention' ? 'bg-rose-100 border-rose-400 shadow-sm ring-2 ring-rose-400' : 'bg-rose-50/80 border-rose-200 hover:bg-rose-100/70'"
              >
                <div class="flex items-center justify-between">
                  <span class="text-[11px] font-bold text-rose-700">⚠️ نیازمند توجه فوری</span>
                  <span class="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                </div>
                <p class="text-xl sm:text-2xl font-black text-rose-800 mt-1">
                  {{ faNum(perfSummary.needs_attention_count) }} <span class="text-xs font-normal">نفر</span>
                </p>
                <span class="text-[10px] text-rose-600 font-bold block mt-0.5">افت مطالعه، آزمون یا تکالیف</span>
              </div>

              <div 
                @click="perfFilter = 'excelling'" 
                class="cursor-pointer p-3 rounded-2xl border transition-all duration-200"
                :class="perfFilter === 'excelling' ? 'bg-emerald-100 border-emerald-400 shadow-sm ring-2 ring-emerald-400' : 'bg-emerald-50/80 border-emerald-200 hover:bg-emerald-100/70'"
              >
                <span class="text-[11px] font-bold text-emerald-700">🌟 دانش‌آموزان ممتاز</span>
                <p class="text-xl sm:text-2xl font-black text-emerald-800 mt-1">
                  {{ faNum(perfSummary.excelling_count) }} <span class="text-xs font-normal">نفر</span>
                </p>
                <span class="text-[10px] text-emerald-600 font-bold block mt-0.5">نمرات عالی و تکالیف کامل</span>
              </div>

              <div class="p-3 rounded-2xl bg-white border border-slate-200">
                <span class="text-[11px] font-bold text-slate-600">⏱️ میانگین مطالعه کلاسی</span>
                <p class="text-xl sm:text-2xl font-black text-ink mt-1">
                  {{ faNum(perfSummary.class_study_avg_hours) }} <span class="text-xs font-normal">ساعت</span>
                </p>
                <span class="text-[10px] text-slate-500 block mt-0.5">در هفته جاری</span>
              </div>

              <div class="p-3 rounded-2xl bg-white border border-slate-200">
                <span class="text-[11px] font-bold text-slate-600">📝 نرخ تحویل تکالیف</span>
                <p class="text-xl sm:text-2xl font-black text-royal mt-1">
                  {{ faNum(perfSummary.class_hw_rate) }}٪
                </p>
                <span class="text-[10px] text-slate-500 block mt-0.5">مشارکت فعال در ارسال</span>
              </div>
            </div>
          </div>

          <!-- Search, Filter Tabs & Sort Controls -->
          <div class="card p-3 sm:p-4 space-y-3">
            <!-- Filter Tabs -->
            <div class="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <button 
                @click="perfFilter = 'all'" 
                :class="['px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap', perfFilter === 'all' ? 'bg-royal text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200']"
              >
                همه دانش‌آموزان ({{ faNum(perfSummary.total_students) }})
              </button>
              <button 
                @click="perfFilter = 'needs_attention'" 
                :class="['px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap flex items-center gap-1', perfFilter === 'needs_attention' ? 'bg-rose-600 text-white shadow-sm' : 'bg-rose-50 text-rose-700 hover:bg-rose-100']"
              >
                <span>⚠️ نیازمند توجه فوری</span>
                <span class="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">{{ faNum(perfSummary.needs_attention_count) }}</span>
              </button>
              <button 
                @click="perfFilter = 'excelling'" 
                :class="['px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap flex items-center gap-1', perfFilter === 'excelling' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100']"
              >
                <span>🌟 ممتاز و پرتلاش</span>
                <span class="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">{{ faNum(perfSummary.excelling_count) }}</span>
              </button>
              <button 
                @click="perfFilter = 'good'" 
                :class="['px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap', perfFilter === 'good' ? 'bg-sky-600 text-white shadow-sm' : 'bg-sky-50 text-sky-700 hover:bg-sky-100']"
              >
                <span>در مسیر پیشرفت ({{ faNum(perfSummary.good_count) }})</span>
              </button>
            </div>

            <!-- Search & Sort Row -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div class="relative">
                <input 
                  v-model="perfSearch" 
                  placeholder="جستجوی نام یا کد ملی دانش‌آموز..." 
                  class="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:border-royal outline-none"
                />
                <i data-lucide="search" class="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5"></i>
              </div>

              <div class="flex items-center gap-2">
                <label class="text-[11px] font-bold text-slate-500 whitespace-nowrap">مرتب‌سازی:</label>
                <select v-model="perfSort" class="w-full px-2.5 py-2 rounded-xl border border-slate-200 text-xs focus:border-royal outline-none bg-white font-bold">
                  <option value="attention">⚠️ بالاترین نیاز به توجه و پیگیری</option>
                  <option value="exam_high">📊 بالاترین نمره آزمون</option>
                  <option value="study_high">⏱️ بیشترین ساعت مطالعه</option>
                  <option value="hw_low">📝 کمترین درصد تحویل تکالیف</option>
                  <option value="name">الفبایی (نام دانش‌آموز)</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Students List -->
          <div v-if="perfLoading" class="text-center py-12">
            <div class="w-8 h-8 border-3 border-royal border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p class="text-xs font-bold text-slate-500">در حال دریافت و تحلیل شاخص‌های عملکرد...</p>
          </div>

          <div v-else-if="filteredPerfStudents.length === 0" class="card p-8 text-center space-y-2">
            <i data-lucide="check-circle-2" class="w-10 h-10 text-emerald-500 mx-auto"></i>
            <p class="font-extrabold text-sm text-ink">دانش‌آموزی با این فیلتر یافت نشد</p>
            <p class="text-xs text-slate-500">تمامی دانش‌آموزان در وضعیت مطلوب قرار دارند یا عبارت جستجو نتیجه‌ای ندارد.</p>
          </div>

          <div v-else class="space-y-3">
            <div 
              v-for="st in filteredPerfStudents" 
              :key="st.id"
              class="rounded-3xl p-4 sm:p-5 transition-all duration-300"
              :class="[
                st.needs_attention 
                  ? 'bg-gradient-to-b from-rose-50/90 via-white to-rose-50/30 border-2 border-rose-400 shadow-lg ring-1 ring-rose-200/80' 
                  : st.status === 'excelling'
                    ? 'bg-gradient-to-b from-emerald-50/40 via-white to-white border border-emerald-300 shadow-sm'
                    : 'bg-white border border-slate-200 shadow-sm hover:border-slate-300'
              ]"
            >
              <!-- Top Row: Student Name & Badges -->
              <div class="flex items-center justify-between flex-wrap gap-2 mb-3">
                <div class="flex items-center gap-3">
                  <div 
                    class="w-11 h-11 rounded-2xl flex items-center justify-center font-black text-base shadow-sm"
                    :class="st.needs_attention ? 'bg-rose-500 text-white' : st.status === 'excelling' ? 'bg-emerald-500 text-white' : 'bg-royal text-white'"
                  >
                    {{ st.full_name ? st.full_name.charAt(0) : 'د' }}
                  </div>
                  <div>
                    <div class="flex items-center gap-2">
                      <h4 class="font-black text-base sm:text-lg text-ink">{{ st.full_name }}</h4>
                      <span class="text-[11px] text-slate-500 font-bold">({{ selectedClass.label }})</span>
                    </div>
                    <p class="text-[11px] text-slate-500">ولی: {{ st.parent_name }} <span v-if="st.parent_phone" dir="ltr" class="text-[10px] font-mono text-slate-600">({{ st.parent_phone }})</span></p>
                  </div>
                </div>

                <!-- Role / Status Pill -->
                <div>
                  <span 
                    v-if="st.needs_attention" 
                    class="px-3 py-1.5 rounded-full text-xs font-black bg-rose-500 text-white flex items-center gap-1.5 shadow-sm animate-pulse"
                  >
                    <i data-lucide="alert-triangle" class="w-3.5 h-3.5"></i>
                    <span>نیازمند توجه فوری</span>
                  </span>
                  <span 
                    v-else-if="st.status === 'excelling'" 
                    class="px-3 py-1.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1.5"
                  >
                    <i data-lucide="award" class="w-3.5 h-3.5 text-emerald-600"></i>
                    <span>دانش‌آموز ممتاز</span>
                  </span>
                  <span 
                    v-else 
                    class="px-3 py-1.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 flex items-center gap-1"
                  >
                    <i data-lucide="trending-up" class="w-3.5 h-3.5 text-royal"></i>
                    <span>در مسیر پیشرفت</span>
                  </span>
                </div>
              </div>

              <!-- Attention Reasons Banner (Only if needs_attention) -->
              <div 
                v-if="st.needs_attention && st.attention_reasons && st.attention_reasons.length > 0"
                class="mb-3.5 p-3 rounded-2xl bg-rose-100/80 border border-rose-300/80 text-rose-900"
              >
                <div class="flex items-center gap-1.5 text-xs font-black mb-1.5 text-rose-800">
                  <i data-lucide="alert-circle" class="w-4 h-4 text-rose-600"></i>
                  <span>دلایل نیاز به مداخله و توجه سیستم:</span>
                </div>
                <div class="flex flex-wrap gap-1.5">
                  <span 
                    v-for="(reason, rIdx) in st.attention_reasons" 
                    :key="rIdx"
                    class="px-2.5 py-1 rounded-xl bg-white/90 border border-rose-300 text-rose-800 text-[11px] font-bold shadow-2xs flex items-center gap-1"
                  >
                    <i data-lucide="x-circle" class="w-3 h-3 text-rose-500"></i>
                    <span>{{ reason }}</span>
                  </span>
                </div>
              </div>

              <!-- 4 Visual Activity Metric Bars / Cards -->
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3.5">
                <!-- 1. Study Time -->
                <div 
                  class="p-2.5 rounded-2xl border text-right"
                  :class="st.study_hours < 3 ? 'bg-rose-50/60 border-rose-200' : 'bg-mist/40 border-line'"
                >
                  <div class="flex items-center justify-between text-[11px] font-bold text-slate-500 mb-0.5">
                    <span>⏱️ مطالعه در پنل</span>
                    <span :class="st.study_hours < 3 ? 'text-rose-600 font-black' : 'text-emerald-600 font-bold'">
                      {{ faNum(st.study_hours) }} ساعت
                    </span>
                  </div>
                  <div class="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden mt-1">
                    <div 
                      class="h-full rounded-full transition-all duration-500"
                      :class="st.study_hours < 3 ? 'bg-rose-500' : 'bg-emerald-500'"
                      :style="{ width: `${Math.min(100, (st.study_hours / 12) * 100)}%` }"
                    ></div>
                  </div>
                  <span class="text-[10px] text-slate-400 block mt-1">{{ faNum(st.pomodoros_count) }} پومودورو</span>
                </div>

                <!-- 2. Exam Average -->
                <div 
                  class="p-2.5 rounded-2xl border text-right"
                  :class="st.exam_avg_pct < 60 ? 'bg-rose-50/60 border-rose-200' : 'bg-mist/40 border-line'"
                >
                  <div class="flex items-center justify-between text-[11px] font-bold text-slate-500 mb-0.5">
                    <span>📊 نمره آزمون‌ها</span>
                    <span :class="st.exam_avg_pct < 60 ? 'text-rose-600 font-black' : 'text-royal font-black'">
                      {{ faNum(st.exam_score_20) }} از ۲۰
                    </span>
                  </div>
                  <div class="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden mt-1">
                    <div 
                      class="h-full rounded-full transition-all duration-500"
                      :class="st.exam_avg_pct < 60 ? 'bg-rose-500' : 'bg-royal'"
                      :style="{ width: `${st.exam_avg_pct}%` }"
                    ></div>
                  </div>
                  <span class="text-[10px] text-slate-400 block mt-1">{{ faNum(st.exams_taken) }} آزمون داده شده</span>
                </div>

                <!-- 3. Homework Completion -->
                <div 
                  class="p-2.5 rounded-2xl border text-right"
                  :class="st.homework_missing_count >= 2 ? 'bg-rose-50/60 border-rose-200' : 'bg-mist/40 border-line'"
                >
                  <div class="flex items-center justify-between text-[11px] font-bold text-slate-500 mb-0.5">
                    <span>📝 ارسال تکالیف</span>
                    <span :class="st.homework_missing_count >= 2 ? 'text-rose-600 font-black' : 'text-emerald-600 font-bold'">
                      {{ faNum(st.homework_completion_rate) }}٪
                    </span>
                  </div>
                  <div class="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden mt-1">
                    <div 
                      class="h-full rounded-full transition-all duration-500"
                      :class="st.homework_missing_count >= 2 ? 'bg-rose-500' : 'bg-emerald-500'"
                      :style="{ width: `${st.homework_completion_rate}%` }"
                    ></div>
                  </div>
                  <span class="text-[10px] text-slate-400 block mt-1">{{ faNum(st.homeworks_submitted) }} از {{ faNum(st.homeworks_assigned) }} تکلیف</span>
                </div>

                <!-- 4. Attendance -->
                <div 
                  class="p-2.5 rounded-2xl border text-right"
                  :class="st.absent_count >= 2 ? 'bg-rose-50/60 border-rose-200' : 'bg-mist/40 border-line'"
                >
                  <div class="flex items-center justify-between text-[11px] font-bold text-slate-500 mb-0.5">
                    <span>📅 حضور در کلاس</span>
                    <span :class="st.absent_count >= 2 ? 'text-rose-600 font-black' : 'text-slate-700 font-bold'">
                      {{ faNum(st.attendance_rate) }}٪
                    </span>
                  </div>
                  <div class="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden mt-1">
                    <div 
                      class="h-full rounded-full transition-all duration-500"
                      :class="st.absent_count >= 2 ? 'bg-rose-500' : 'bg-slate-700'"
                      :style="{ width: `${st.attendance_rate}%` }"
                    ></div>
                  </div>
                  <span class="text-[10px] text-slate-400 block mt-1">{{ faNum(st.absent_count) }} جلسه غیبت</span>
                </div>
              </div>

              <!-- AI Path & Diagnosis Suggestion Box -->
              <div class="p-3 rounded-2xl bg-white border border-slate-200 text-xs flex items-center justify-between gap-3 flex-wrap">
                <div class="flex items-center gap-2">
                  <i data-lucide="sparkles" class="w-4 h-4 text-amber-500 shrink-0"></i>
                  <span class="text-slate-700 font-bold leading-relaxed">{{ st.ai_recommendation }}</span>
                </div>
              </div>

              <!-- Quick Action Buttons for Teacher -->
              <div class="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100 flex-wrap">
                <button 
                  v-if="st.needs_attention"
                  @click="openAlertModal(st)"
                  class="btn btn-sm !bg-rose-600 hover:!bg-rose-700 !text-white text-xs font-black shadow-md flex items-center gap-1.5"
                >
                  <i data-lucide="send" class="w-3.5 h-3.5"></i>
                  <span>ارسال هشدار تحصیلی به اولیا</span>
                </button>

                <button 
                  v-else-if="st.status === 'excelling'"
                  @click="sendPraise(st)"
                  class="btn btn-sm !bg-emerald-600 hover:!bg-emerald-700 !text-white text-xs font-black shadow-sm flex items-center gap-1.5"
                >
                  <i data-lucide="star" class="w-3.5 h-3.5"></i>
                  <span>ارسال تقدیرنامه به اولیا</span>
                </button>

                <button 
                  @click="openRemedialModal(st)"
                  class="btn btn-mist btn-sm text-xs font-bold flex items-center gap-1.5"
                >
                  <i data-lucide="clipboard-pen-line" class="w-3.5 h-3.5 text-royal"></i>
                  <span>تعیین تکلیف جبرانی / یادداشت آموزشی</span>
                </button>

                <button 
                  @click="toast(`مسیر یادگیری هوش مصنوعی برای ${st.full_name} تأیید شد`)"
                  class="btn btn-ok btn-sm text-xs font-bold mr-auto flex items-center gap-1.5"
                >
                  <i data-lucide="check" class="w-3.5 h-3.5"></i>
                  <span>تأیید مسیر هوش مصنوعی</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Parent Alert Modal -->
          <div v-if="alertModalOpen" class="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div class="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl text-right space-y-4">
              <div class="flex items-center justify-between pb-3 border-b border-slate-100">
                <div class="flex items-center gap-2 text-rose-600">
                  <i data-lucide="alert-triangle" class="w-5 h-5"></i>
                  <h4 class="font-black text-base text-ink">ارسال هشدار وضعیت تحصیلی به اولیا</h4>
                </div>
                <button @click="alertModalOpen = false" class="text-slate-400 hover:text-slate-600 p-1">
                  <i data-lucide="x" class="w-5 h-5"></i>
                </button>
              </div>

              <div v-if="selectedStudentForAlert" class="p-3 rounded-2xl bg-slate-50 text-xs space-y-1">
                <p><b class="text-ink">دانش‌آموز:</b> {{ selectedStudentForAlert.full_name }} ({{ selectedClass.label }})</p>
                <p><b class="text-ink">ولی گرامی:</b> {{ selectedStudentForAlert.parent_name }} <span dir="ltr" class="font-mono">({{ selectedStudentForAlert.parent_phone || 'شماره ثبت نشده' }})</span></p>
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1.5">متن پیام هشدار (قابل ویرایش):</label>
                <textarea 
                  v-model="alertMessageText" 
                  rows="4" 
                  class="w-full p-3 rounded-2xl border border-slate-200 text-xs focus:border-royal outline-none leading-relaxed"
                ></textarea>
              </div>

              <div class="flex items-center justify-end gap-2 pt-2">
                <button @click="alertModalOpen = false" class="btn btn-mist btn-sm text-xs font-bold">انصراف</button>
                <button 
                  @click="sendParentAlert" 
                  :disabled="sendingAlert"
                  class="btn btn-sm !bg-rose-600 hover:!bg-rose-700 !text-white text-xs font-black shadow-md flex items-center gap-1.5"
                >
                  <span v-if="sendingAlert">در حال ارسال...</span>
                  <span v-else>ارسال پیام به اولیا</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Remedial Modal -->
          <div v-if="remedialModalOpen" class="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div class="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl text-right space-y-4">
              <div class="flex items-center justify-between pb-3 border-b border-slate-100">
                <div class="flex items-center gap-2 text-royal">
                  <i data-lucide="clipboard-pen-line" class="w-5 h-5"></i>
                  <h4 class="font-black text-base text-ink">تخصیص برنامه جبرانی یا یادداشت آموزشی</h4>
                </div>
                <button @click="remedialModalOpen = false" class="text-slate-400 hover:text-slate-600 p-1">
                  <i data-lucide="x" class="w-5 h-5"></i>
                </button>
              </div>

              <div v-if="selectedStudentForPlan" class="p-3 rounded-2xl bg-slate-50 text-xs">
                <p><b class="text-ink">دانش‌آموز:</b> {{ selectedStudentForPlan.full_name }}</p>
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1.5">توضیحات تکلیف یا برنامه جبرانی:</label>
                <textarea 
                  v-model="planText" 
                  rows="4" 
                  placeholder="مثلاً: حل سوالات ۳ تا ۷ از کتاب کار و مطالعه مجدد فصل کسرها تا روز چهارشنبه..." 
                  class="w-full p-3 rounded-2xl border border-slate-200 text-xs focus:border-royal outline-none leading-relaxed"
                ></textarea>
              </div>

              <div class="flex items-center justify-end gap-2 pt-2">
                <button @click="remedialModalOpen = false" class="btn btn-mist btn-sm text-xs font-bold">انصراف</button>
                <button @click="assignRemedialPlan" class="btn btn-royal btn-sm text-xs font-black shadow-md">ثبت و ارسال به دانش‌آموز</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ================= 2. تکالیف (CREATE & REPORTS) ================= -->
      <section v-if="activeTab === 'hw'" class="space-y-4">
        <div class="text-white px-1">
          <h2 class="text-[26px] font-extrabold">تکالیف</h2>
          <p class="text-white/80 text-sm">بساز و پیگیری کن</p>
        </div>

        <div class="seg-ctl">
          <button @click="hwSubTab = 'new'" :aria-pressed="hwSubTab === 'new'">
            ساخت تکلیف
          </button>
          <button @click="hwSubTab = 'rep'" :aria-pressed="hwSubTab === 'rep'">
            گزارش تکلیف
          </button>
        </div>

        <!-- Create Homework -->
        <div v-if="hwSubTab === 'new'" class="card p-5 space-y-4">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="lbl">پایه</label>
              <select v-model="newHw.grade" class="input">
                <option>هفتم</option>
                <option>هشتم</option>
                <option>نهم</option>
              </select>
            </div>
            <div>
              <label class="lbl">کلاس</label>
              <select v-model="newHw.class_name" class="input">
                <option>الف</option>
                <option>ب</option>
                <option>همه کلاس‌ها</option>
              </select>
            </div>
          </div>

          <div>
            <label class="lbl">عنوان تکلیف</label>
            <input v-model="newHw.title" class="input" placeholder="مثلاً حل تمرین‌های فصل ۴" required />
          </div>

          <div>
            <label class="lbl">توضیحات و راهنمایی</label>
            <textarea v-model="newHw.description" class="input !h-24 py-2" placeholder="صفحه تمرین‌ها یا فایل ارسالی..."></textarea>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="lbl">مهلت ارسال</label>
              <input v-model="newHw.deadline_fa" class="input" placeholder="مثلاً ۷ آبان، ساعت ۲۰:۰۰" />
            </div>
            <div>
              <label class="lbl">امتیاز</label>
              <input type="number" v-model.number="newHw.points" class="input" />
            </div>
          </div>

          <button @click="createHomework" class="btn btn-royal w-full">
            <i data-lucide="plus" class="w-5 h-5"></i>
            <span>ساخت تکلیف</span>
          </button>
        </div>

        <!-- Homework Reports -->
        <div v-if="hwSubTab === 'rep'" class="space-y-3">
          <div 
            v-for="hw in hwReports" 
            :key="hw.id" 
            class="card p-5 space-y-3"
          >
            <div class="flex items-start justify-between">
              <div>
                <span class="tag bg-mist text-royal text-xs">{{ hw.grade }} کلاس {{ hw.class_name }}</span>
                <h3 class="font-extrabold text-lg mt-1.5">{{ hw.title }}</h3>
              </div>
              <span class="tag bg-[#E6F7EE] text-ok font-bold">
                {{ faNum(hw.submitted_count) }} از {{ faNum(hw.total_expected) }} ارسال‌شده
              </span>
            </div>

            <div class="bar">
              <span :style="{ width: Math.round((hw.submitted_count / (hw.total_expected || 1)) * 100) + '%' }"></span>
            </div>

            <div class="flex justify-between items-center text-xs text-[#5A6E99] pt-2 border-t border-line">
              <span class="flex items-center gap-1.5 font-bold">
                <i data-lucide="calendar-clock" class="w-4 h-4"></i>
                <span>مهلت: {{ hw.deadline_fa }}</span>
              </span>
              <button @click="toast('لیست کامل ارسال‌ها آماده نمایش است')" class="text-royal font-bold">
                مشاهده پاسخ‌ها ➔
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- ================= 3. آزمون و اسکنر دوربین (EXAMS & CAMERA) ================= -->
            <!-- ================= 3. آزمون (EXAMS) ================= -->
      <section v-if="activeTab === 'exam'" class="space-y-4">
        <div class="text-white px-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 class="text-2xl sm:text-[26px] font-extrabold">آزمون‌های کانون</h2>
            <p class="text-white/80 text-xs sm:text-sm">طراحی دفترچه آزمون چاپی از کتاب هوش یا ثبت کلید و اسکن پاسخ‌برگ</p>
          </div>

          <!-- Sub Tab Segment Control -->
          <div class="seg-ctl !bg-white/15 !border-white/20 p-1">
            <button 
              @click="examSubTab = 'hoosh'" 
              :aria-pressed="examSubTab === 'hoosh'"
              class="flex items-center gap-1.5 !text-xs sm:!text-sm"
            >
              <i data-lucide="sparkles" class="w-4 h-4 text-sun"></i>
              <span>طراح هوش کمپلکس (۲۰۱ مبحث)</span>
            </button>
            <button 
              @click="examSubTab = 'manual'" 
              :aria-pressed="examSubTab === 'manual'"
              class="flex items-center gap-1.5 !text-xs sm:!text-sm"
            >
              <i data-lucide="key-round" class="w-4 h-4"></i>
              <span>کلید و تصحیح آزمون</span>
            </button>
          </div>
        </div>

        <!-- ================= A. HOOSH COMPLEX EXAM STUDIO ================= -->
        <div v-if="examSubTab === 'hoosh'" class="space-y-5">
          
          <!-- Studio Header & Metrics Banner -->
          <div class="card p-5 sm:p-6 bg-gradient-to-br from-white via-mist to-royal/5 border border-line shadow-sm space-y-4">
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-royal/10 text-royal text-xs font-bold mb-2">
                  <i data-lucide="layers" class="w-3.5 h-3.5"></i>
                  <span>سامانه جامع طراحی آزمون چندکتابی کانون شهید کاظمی آشتیانی</span>
                </div>
                <h3 class="text-lg sm:text-2xl font-black text-ink leading-tight font-titr">
                  میز کار هوشمند طراحی آزمون چاپی و آنلاین
                </h3>
                <p class="text-xs sm:text-sm text-[#5A6E99] mt-1.5 leading-relaxed">
                  انتخاب کتاب بر اساس پایه تحصیلی، فیلتر لحظه‌ای مباحث، گزینش برگه‌های سؤال از منابع استاندارد، و صدور فوری دفترچه چاپی A4 و پاسخ‌برگ.
                </p>
              </div>

              <!-- Quick Basket & Upload Actions -->
              <div class="shrink-0 flex items-center gap-2 flex-wrap">
                <button 
                  @click="uploadModalOpen = true"
                  class="btn btn-sun text-xs sm:text-sm font-black flex items-center gap-1.5 !py-2.5 !px-4 shadow-sm cursor-pointer hover:scale-105 transition-transform"
                >
                  <i data-lucide="upload-cloud" class="w-4 h-4 text-ink"></i>
                  <span>+ بارگذاری کتاب جدید</span>
                </button>
                <button 
                  @click="openPrintModal('exam')"
                  :disabled="examBasket.length === 0"
                  class="btn btn-royal text-xs sm:text-sm font-bold flex items-center gap-2 !py-2.5 !px-4 shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  <i data-lucide="printer" class="w-4 h-4"></i>
                  <span>پیش‌نمایش و چاپ ({{ faNum(examBasket.length) }})</span>
                </button>
              </div>
            </div>

            <!-- Dynamic Metrics Badges for Active Book -->
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-line text-xs font-bold">
              <div class="p-2.5 rounded-xl bg-white border border-line flex items-center gap-2 text-ink shadow-xs">
                <span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span>{{ faNum(activeBook.topicsCount || currentBookTopics.length) }} مبحث تخصصی</span>
              </div>
              <div class="p-2.5 rounded-xl bg-white border border-line flex items-center gap-2 text-ink shadow-xs">
                <span class="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                <span>{{ faNum(hooshSections.length) }} بخش استاندارد</span>
              </div>
              <div class="p-2.5 rounded-xl bg-white border border-line flex items-center gap-2 text-ink shadow-xs">
                <span class="w-2.5 h-2.5 rounded-full bg-royal"></span>
                <span>{{ faNum(availableChapters.length) }} فصل طبقه‌بندی‌شده</span>
              </div>
              <div class="p-2.5 rounded-xl bg-white border border-line flex items-center gap-2 text-ink shadow-xs">
                <span class="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                <span>{{ faNum(activeBook.pagesCount || 539) }} برگه سؤال باکیفیت</span>
              </div>
            </div>
          </div>

          <!-- STEP 1: Grade Selection Pills & Books Shelf -->
          <div class="card p-4 sm:p-5 border border-line shadow-sm space-y-4">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-line">
              <div>
                <h4 class="font-black text-sm sm:text-base text-ink flex items-center gap-2">
                  <span class="w-6 h-6 rounded-lg bg-royal text-white text-xs font-black flex items-center justify-center">۱</span>
                  <span>انتخاب پایه و کتاب منبع آزمون:</span>
                </h4>
                <p class="text-xs text-[#5A6E99] mt-0.5">کتاب مورد نظر را بر اساس مقطع دانش‌آموزان انتخاب کنید تا مباحث و برگه‌های همان کتاب بارگذاری شوند.</p>
              </div>

              <!-- Grade Filter Pills -->
              <div class="flex items-center gap-1.5 flex-wrap">
                <button 
                  @click="selectedGradeFilter = 'all'"
                  :class="[
                    'px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border',
                    selectedGradeFilter === 'all' ? 'bg-royal text-white border-royal shadow-sm' : 'bg-mist text-ink border-line hover:border-royal/40'
                  ]"
                >
                  همه کتاب‌ها
                </button>
                <button 
                  @click="selectedGradeFilter = 'هشتم و نهم'"
                  :class="[
                    'px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border',
                    selectedGradeFilter === 'هشتم و نهم' ? 'bg-royal text-white border-royal shadow-sm' : 'bg-mist text-ink border-line hover:border-royal/40'
                  ]"
                >
                  پایه هشتم و نهم (تیزهوشان دهم)
                </button>
                <button 
                  @click="selectedGradeFilter = 'ششم'"
                  :class="[
                    'px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border',
                    selectedGradeFilter === 'ششم' ? 'bg-royal text-white border-royal shadow-sm' : 'bg-mist text-ink border-line hover:border-royal/40'
                  ]"
                >
                  پایه پنجم و ششم (تیزهوشان هفتم)
                </button>
                <button 
                  v-if="booksList.some(b => b.isCustom)"
                  @click="selectedGradeFilter = 'custom'"
                  :class="[
                    'px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border',
                    selectedGradeFilter === 'custom' ? 'bg-royal text-white border-royal shadow-sm' : 'bg-mist text-ink border-line hover:border-royal/40'
                  ]"
                >
                  کتاب‌های بارگذاری‌شده
                </button>
              </div>
            </div>

            <!-- Books Shelf Cards Grid -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              <div 
                v-for="b in filteredBooks" 
                :key="b.id"
                @click="selectBook(b.id)"
                :class="[
                  'relative p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between gap-3 text-right group hover:shadow-md',
                  selectedBookId === b.id 
                    ? 'border-royal bg-gradient-to-br from-white via-royal/5 to-indigo-50/50 shadow-md ring-2 ring-royal/20' 
                    : 'border-line bg-white hover:border-royal/40'
                ]"
              >
                <!-- Card Header -->
                <div class="space-y-2">
                  <div class="flex items-center justify-between gap-2">
                    <span 
                      :class="[
                        'px-2.5 py-0.5 rounded-full text-[11px] font-black',
                        selectedBookId === b.id ? 'bg-royal text-white shadow-xs' : 'bg-mist text-slate-700'
                      ]"
                    >
                      {{ b.gradeBadge || b.grade }}
                    </span>
                    <span v-if="selectedBookId === b.id" class="text-xs font-extrabold text-royal flex items-center gap-1">
                      <i data-lucide="check-circle-2" class="w-4 h-4"></i>
                      <span>کتاب فعال</span>
                    </span>
                  </div>

                  <h5 class="font-black text-sm sm:text-base text-ink leading-snug group-hover:text-royal transition-colors">
                    {{ b.title }}
                  </h5>
                  <p class="text-xs text-[#5A6E99] leading-relaxed line-clamp-2">
                    {{ b.description }}
                  </p>
                </div>

                <!-- Card Footer & Meta -->
                <div class="pt-2 border-t border-line/60 flex items-center justify-between text-xs font-bold text-slate-600">
                  <span class="flex items-center gap-1">
                    <i data-lucide="book-open" class="w-3.5 h-3.5 text-royal"></i>
                    <span>{{ faNum(b.topicsCount) }} مبحث</span>
                  </span>
                  <span class="flex items-center gap-1">
                    <i data-lucide="file-text" class="w-3.5 h-3.5 text-royal"></i>
                    <span>{{ faNum(b.pagesCount) }} برگه سؤال</span>
                  </span>
                  <a 
                    v-if="b.pdfUrl" 
                    :href="b.pdfUrl" 
                    target="_blank" 
                    @click.stop 
                    class="text-royal hover:underline flex items-center gap-1 text-[11px]"
                    title="دانلود PDF کتاب"
                  >
                    <i data-lucide="download" class="w-3 h-3"></i>
                    <span>PDF</span>
                  </a>
                </div>
              </div>

              <!-- Upload New Book Action Card -->
              <div 
                @click="uploadModalOpen = true"
                class="p-4 rounded-2xl border-2 border-dashed border-royal/40 bg-royal/5 hover:bg-royal/10 hover:border-royal transition-all cursor-pointer flex flex-col items-center justify-center text-center gap-2 group min-h-[140px]"
              >
                <div class="w-10 h-10 rounded-2xl bg-white text-royal flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                  <i data-lucide="plus" class="w-5 h-5"></i>
                </div>
                <div>
                  <h5 class="font-black text-xs sm:text-sm text-ink group-hover:text-royal transition-colors">
                    + بارگذاری کتاب جدید
                  </h5>
                  <p class="text-[11px] text-[#5A6E99] mt-0.5">افزودن کتاب‌های دیگر برای پایه‌های دلخواه</p>
                </div>
              </div>
            </div>
          </div>

          <!-- 3-Level Cascaded Selectors & Quick Search Filter -->
          <div class="card p-4 sm:p-5 border border-line shadow-sm space-y-3">
            <div class="flex items-center justify-between pb-2 border-b border-line">
              <h4 class="font-black text-sm sm:text-base text-ink flex items-center gap-2">
                <span class="w-6 h-6 rounded-lg bg-royal text-white text-xs font-black flex items-center justify-center">۲</span>
                <span>فیلتر مباحث کتاب «{{ activeBook.title }}»:</span>
              </h4>
              <span class="text-xs text-[#5A6E99] font-bold">
                یافت‌شده: {{ faNum(filteredTopics.length) }} مبحث
              </span>
            </div>

            <!-- Search input -->
            <div>
              <label class="lbl flex items-center justify-between">
                <span>جستجوی سریع بین تمام مباحث این کتاب (عنوان، شماره مبحث یا کلمات کلیدی):</span>
              </label>
              <div class="relative">
                <input 
                  v-model="searchQuery"
                  type="text"
                  placeholder="مثال: مکعب، تقارن، ضرب‌المثل، دنباله، مبحث ۱، کلامی، نسبت..." 
                  class="input !pr-10 !pl-20 text-xs sm:text-sm font-medium"
                />
                <span class="absolute right-3 top-1/2 -translate-y-1/2 text-[#5A6E99]">
                  <i data-lucide="search" class="w-4 h-4"></i>
                </span>
                <button 
                  v-if="searchQuery" 
                  @click="searchQuery = ''"
                  class="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#5A6E99] hover:text-ink cursor-pointer border-none bg-transparent"
                >
                  پاک‌کردن
                </button>
              </div>
            </div>

            <!-- 3 Cascaded Dropdowns -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
              <div>
                <label class="lbl">۱. بخش هوش:</label>
                <select v-model="selectedSectionId" class="input text-xs sm:text-sm font-bold">
                  <option value="all">همه بخش‌ها ({{ faNum(hooshSections.length) }} بخش)</option>
                  <option v-for="sec in hooshSections" :key="sec.id" :value="sec.id">
                    بخش {{ faNum(sec.id) }}: {{ sec.title }} ({{ faNum(sec.count) }} مبحث)
                  </option>
                </select>
              </div>

              <div>
                <label class="lbl">۲. فصل:</label>
                <select v-model="selectedChapterId" class="input text-xs sm:text-sm font-bold">
                  <option value="all">همه فصل‌های این بخش</option>
                  <option v-for="ch in availableChapters" :key="ch.id" :value="ch.id">
                    {{ ch.title }} ({{ faNum(ch.count) }} مبحث)
                  </option>
                </select>
              </div>

              <div>
                <label class="lbl">۳. مبحث موردنظر:</label>
                <select v-model="selectedTopicId" class="input text-xs sm:text-sm font-black text-royal">
                  <option v-for="tp in filteredTopics" :key="tp.id" :value="tp.id">
                    مبحث {{ faNum(tp.id) }}: {{ tp.title }}
                  </option>
                </select>
              </div>
            </div>
          </div>

          <!-- Studio 2-Column Responsive Workbench -->
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">

            <!-- Left Stage (8 cols): Question Viewer -->
            <div class="lg:col-span-8 space-y-4">
              
              <!-- Active Topic Meta Card -->
              <div v-if="currentTopic" class="card p-4 sm:p-5 border-2 border-royal/20 bg-royal/5 space-y-3">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-royal/15">
                  <div>
                    <div class="flex items-center gap-2 mb-1 flex-wrap">
                      <span class="tag bg-royal text-white font-extrabold text-xs">
                        مبحث {{ faNum(currentTopic.id) }}
                      </span>
                      <span class="text-xs text-[#5A6E99] font-medium">
                        {{ currentTopic.sectionTitle }} | {{ currentTopic.chapterTitle }}
                      </span>
                      <span class="tag bg-indigo-100 text-indigo-800 text-[11px] font-bold">
                        {{ activeBook.title }}
                      </span>
                    </div>
                    <h4 class="text-base sm:text-lg font-black text-ink">{{ currentTopic.title }}</h4>
                  </div>

                  <button 
                    @click="toggleAllPagesForCurrentTopic"
                    :class="[
                      'btn btn-sm text-xs font-bold shrink-0 flex items-center gap-1.5 !min-h-[36px]',
                      areAllCurrentPagesInBasket ? 'btn-soft text-late' : 'btn-royal'
                    ]"
                  >
                    <i :data-lucide="areAllCurrentPagesInBasket ? 'trash-2' : 'plus'" class="w-4 h-4"></i>
                    <span>{{ areAllCurrentPagesInBasket ? 'حذف تمام سؤالات این مبحث' : 'افزودن همه سؤالات این مبحث' }}</span>
                  </button>
                </div>

                <!-- Topic Stats Grid -->
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div>
                    <span class="text-[#5A6E99] block">صفحه شروع کتاب:</span>
                    <b class="text-ink">صفحه {{ faNum(currentTopic.bookStartPage) }}</b>
                  </div>
                  <div>
                    <span class="text-[#5A6E99] block">صفحه پایان کتاب:</span>
                    <b class="text-ink">صفحه {{ faNum(currentTopic.bookEndPage) }}</b>
                  </div>
                  <div>
                    <span class="text-[#5A6E99] block">تعداد برگه‌های تست:</span>
                    <b class="text-royal">{{ faNum(currentTopic.pageCount) }} برگه</b>
                  </div>
                  <div>
                    <span class="text-[#5A6E99] block">وضعیت در آزمون:</span>
                    <b :class="currentTopicSelectedPagesCount > 0 ? 'text-ok' : 'text-late'">
                      {{ currentTopicSelectedPagesCount > 0 ? `${faNum(currentTopicSelectedPagesCount)} برگه اضافه شده` : 'انتخاب نشده' }}
                    </b>
                  </div>
                </div>
              </div>

              <!-- Question Sheets Header -->
              <div class="flex items-center justify-between px-1">
                <div class="flex items-center gap-2">
                  <i data-lucide="image" class="w-4 h-4 text-royal"></i>
                  <h4 class="font-bold text-sm text-ink">برگه‌های سؤال استخراج‌شده از کتاب:</h4>
                </div>
                <span class="text-xs text-[#5A6E99]">برای بزرگ‌نمایی روی عکس کلیک کنید</span>
              </div>

              <!-- Question Sheets Grid -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div 
                  v-for="page in currentTopicPages" 
                  :key="`${page.bookId}_${page.pdfPage}`"
                  :class="[
                    'card p-3 sm:p-4 space-y-3 transition-all relative overflow-hidden',
                    isPageInBasket(page.pdfPage, page.bookId) ? 'border-2 border-ok bg-emerald-50/30' : 'border border-line hover:border-royal/50'
                  ]"
                >
                  <!-- Sheet Header -->
                  <div class="flex items-center justify-between text-xs">
                    <span class="tag bg-mist text-ink font-bold">
                      صفحه {{ faNum(page.bookPage) }} کتاب
                    </span>
                    <span 
                      v-if="isPageInBasket(page.pdfPage, page.bookId)"
                      class="tag bg-ok text-white font-bold flex items-center gap-1"
                    >
                      <i data-lucide="check" class="w-3 h-3"></i>
                      <span>در آزمون</span>
                    </span>
                  </div>

                  <!-- Image Preview (click to zoom) -->
                  <div 
                    @click="openLightbox(page)" 
                    class="relative aspect-[3/4] bg-mist rounded-xl overflow-hidden cursor-pointer group border border-line flex items-center justify-center"
                  >
                    <img 
                      :src="page.imgSrc" 
                      :alt="`برگه صفحه ${page.bookPage}`"
                      class="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                    <div class="absolute inset-0 bg-ink/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white gap-1.5 text-xs font-bold backdrop-blur-xs">
                      <i data-lucide="zoom-in" class="w-5 h-5"></i>
                      <span>بزرگ‌نمایی برگه</span>
                    </div>
                  </div>

                  <!-- Sheet Actions -->
                  <div class="flex items-center gap-2 pt-1">
                    <button 
                      @click="togglePageInBasket(page)"
                      :class="[
                        'btn btn-sm w-full font-bold text-xs !min-h-[36px] flex items-center justify-center gap-1.5',
                        isPageInBasket(page.pdfPage, page.bookId) ? 'btn-soft text-late' : 'btn-royal'
                      ]"
                    >
                      <i :data-lucide="isPageInBasket(page.pdfPage, page.bookId) ? 'minus-circle' : 'plus-circle'" class="w-4 h-4"></i>
                      <span>{{ isPageInBasket(page.pdfPage, page.bookId) ? 'حذف از آزمون' : 'افزودن به آزمون' }}</span>
                    </button>
                    <button 
                      @click="openLightbox(page)"
                      class="btn btn-soft btn-sm !px-2.5 !min-h-[36px] shrink-0"
                      title="مشاهده بزرگ‌نما"
                    >
                      <i data-lucide="maximize-2" class="w-4 h-4 text-[#5A6E99]"></i>
                    </button>
                  </div>
                </div>
              </div>

            </div>

            <!-- Right Column (4 cols): Exam Basket Studio -->
            <div class="lg:col-span-4 space-y-4 lg:sticky lg:top-4">
              <div class="card p-5 border-2 border-royal/30 shadow-md space-y-4 bg-white">
                
                <!-- Basket Header -->
                <div class="flex items-center justify-between pb-3 border-b border-line">
                  <div class="flex items-center gap-2">
                    <div class="w-8 h-8 rounded-xl bg-royal text-white flex items-center justify-center">
                      <i data-lucide="clipboard-list" class="w-4 h-4"></i>
                    </div>
                    <div>
                      <h4 class="font-extrabold text-sm text-ink">میز کار آزمون‌ساز</h4>
                      <span class="text-[11px] text-[#5A6E99] block">تنظیمات و صدور دفترچه</span>
                    </div>
                  </div>
                  <span class="tag bg-sun text-ink font-extrabold text-xs">
                    {{ faNum(examBasket.length) }} برگه
                  </span>
                </div>

                <!-- Selected Pages List -->
                <div class="space-y-2">
                  <div class="flex items-center justify-between text-xs text-[#5A6E99]">
                    <span>برگه‌های اضافه‌شده به این آزمون:</span>
                    <button 
                      v-if="examBasket.length > 0"
                      @click="clearBasket" 
                      class="text-late hover:underline text-[11px] font-bold cursor-pointer border-none bg-transparent"
                    >
                      تخلیه کامل
                    </button>
                  </div>

                  <div v-if="examBasket.length === 0" class="p-6 text-center text-xs text-[#5A6E99] bg-mist rounded-xl border border-line border-dashed">
                    <i data-lucide="layers" class="w-8 h-8 mx-auto text-[#8AA0CC] mb-2 opacity-50"></i>
                    <p class="font-bold">هنوز برگه‌ای انتخاب نشده است.</p>
                    <p class="text-[11px] mt-1 text-[#8AA0CC]">از ستون مباحث، سؤالات دلخواه را اضافه کنید.</p>
                  </div>

                  <div v-else class="max-h-48 overflow-y-auto space-y-1.5 p-1">
                    <div 
                      v-for="item in sortedExamBasket" 
                      :key="`${item.bookId}_${item.pdfPage}`"
                      class="flex items-center justify-between p-2 rounded-xl bg-mist border border-line text-xs"
                    >
                      <div class="min-w-0 flex-1 pl-2">
                        <p class="font-bold text-ink truncate">صفحه {{ faNum(item.bookPage) }}: {{ item.topicTitle }}</p>
                        <span class="text-[10px] text-[#5A6E99]">{{ item.bookTitle || 'هوش کمپلکس' }} • مبحث {{ faNum(item.topicId) }}</span>
                      </div>
                      <button 
                        @click="removeFromBasket(item.pdfPage, item.bookId)" 
                        class="text-late hover:bg-late/10 p-1 rounded-lg cursor-pointer border-none bg-transparent shrink-0"
                        title="حذف این برگه"
                      >
                        <i data-lucide="x" class="w-3.5 h-3.5"></i>
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Exam Setup Form -->
                <div class="space-y-3 pt-3 border-t border-line text-xs">
                  <div>
                    <label class="lbl">عنوان آزمون:</label>
                    <input v-model="examConfig.title" class="input text-xs font-bold" />
                  </div>

                  <div class="grid grid-cols-2 gap-2">
                    <div>
                      <label class="lbl">مخاطب / مقطع:</label>
                      <select v-model="examConfig.grade" class="input text-xs">
                        <option value="پایه ششم (ورودی تیزهوشان)">ششم تیزهوشان</option>
                        <option value="پایه نهم (ورودی تیزهوشان)">نهم تیزهوشان</option>
                        <option value="دوره اول متوسطه">دوره اول</option>
                        <option value="طرح نخبه‌پروری شهید آشتیانی">طرح شهید آشتیانی</option>
                      </select>
                    </div>
                    <div>
                      <label class="lbl">مدت زمان:</label>
                      <input v-model="examConfig.duration" class="input text-xs" />
                    </div>
                  </div>

                  <div class="grid grid-cols-2 gap-2">
                    <div>
                      <label class="lbl">نام طراح / استاد:</label>
                      <input v-model="examConfig.teacher" class="input text-xs" />
                    </div>
                    <div>
                      <label class="lbl">تاریخ آزمون:</label>
                      <input v-model="examConfig.date" class="input text-xs" />
                    </div>
                  </div>

                  <div class="flex items-center gap-2 pt-1">
                    <input type="checkbox" id="hoosh-neg-score" v-model="examConfig.hasNegativeScore" class="w-4 h-4 rounded text-royal focus:ring-royal cursor-pointer" />
                    <label for="hoosh-neg-score" class="text-xs font-bold text-ink cursor-pointer">
                      نمره منفی (هر ۳ پاسخ نادرست یک پاسخ درست را حذف می‌کند)
                    </label>
                  </div>
                </div>

                <!-- Action Buttons -->
                <div class="space-y-2 pt-3 border-t border-line">
                  <button 
                    @click="openPrintModal('exam')" 
                    :disabled="examBasket.length === 0"
                    class="btn btn-royal w-full text-xs font-bold !py-2.5 flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                  >
                    <i data-lucide="printer" class="w-4 h-4"></i>
                    <span>پیش‌نمایش و چاپ دفترچه آزمون (A4)</span>
                  </button>

                  <button 
                    @click="openPrintModal('answersheet')" 
                    :disabled="examBasket.length === 0"
                    class="btn btn-soft w-full text-xs font-bold !py-2 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <i data-lucide="file-check-2" class="w-4 h-4 text-royal"></i>
                    <span>چاپ پاسخ‌برگ ۴ گزینه‌ای دانش‌آموز</span>
                  </button>

                  <button 
                    @click="saveOnlineExamFromHoosh" 
                    :disabled="examBasket.length === 0"
                    class="btn btn-ok w-full text-xs font-bold !py-2 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <i data-lucide="cloud-upload" class="w-4 h-4"></i>
                    <span>ثبت در آزمون‌های آنلاین سامانه رشد</span>
                  </button>
                </div>

              </div>
            </div>

          </div>

        </div>

        <!-- ================= B. EXISTING MANUAL EXAM KEY & SCANNER ================= -->
        <div v-else-if="examSubTab === 'manual'" class="card p-5 space-y-4">
          <div>
            <label class="lbl">عنوان آزمون</label>
            <input v-model="newExam.title" class="input" placeholder="آزمون علوم فصل ۳" />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="lbl">کلاس</label>
              <select v-model="newExam.class_name" class="input">
                <option>هفتم الف</option>
                <option>هفتم ب</option>
                <option>هشتم الف</option>
              </select>
            </div>
            <div>
              <label class="lbl">تعداد سؤال</label>
              <select v-model.number="newExam.question_count" class="input">
                <option :value="10">۱۰ سؤال</option>
                <option :value="20">۲۰ سؤال</option>
              </select>
            </div>
          </div>

          <!-- Answer Key Grid -->
          <div>
            <div class="flex items-center justify-between mb-2">
              <p class="lbl !mb-0">کلید پاسخ‌ها</p>
              <span class="tag bg-[#E3ECFF] text-royal text-xs font-bold">
                {{ faNum(Object.keys(answerKey).length) }} سؤال ثبت‌شده
              </span>
            </div>

            <div class="grid grid-cols-2 sm:grid-cols-5 gap-2.5 max-h-56 overflow-y-auto p-1">
              <div 
                v-for="qNum in newExam.question_count" 
                :key="qNum" 
                class="p-2.5 rounded-xl border border-line bg-mist flex flex-col items-center gap-1.5"
              >
                <span class="text-xs font-black text-ink">سؤال {{ faNum(qNum) }}</span>
                <div class="flex gap-1 text-xs">
                  <button 
                    v-for="opt in [1, 2, 3, 4]" 
                    :key="opt"
                    @click="answerKey[qNum] = opt"
                    :class="[
                      'w-6 h-6 rounded-lg font-bold flex items-center justify-center transition-all cursor-pointer border-none',
                      answerKey[qNum] === opt ? 'bg-royal text-white shadow-sm' : 'bg-white text-[#5A6E99]'
                    ]"
                  >
                    {{ faNum(opt) }}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3 pt-2">
            <button @click="saveExamKey" class="btn btn-soft font-bold">
              <i data-lucide="save" class="w-5 h-5"></i>
              <span>ذخیره آزمون</span>
            </button>
            <button @click="openScanner" class="btn btn-sun font-black">
              <i data-lucide="scan-line" class="w-5 h-5"></i>
              <span>اسکن پاسخ‌برگ با دوربین</span>
            </button>
          </div>
        </div>
      </section>

<!-- ================= 4. پیام داخلی (INTERNAL CHAT) ================= -->
      <section v-if="activeTab === 'msg'" class="space-y-4">
        <div class="text-white px-1">
          <h2 class="text-[26px] font-extrabold">پیام‌ها</h2>
          <p class="text-white/80 text-sm">گفتگو بدون نمایش شماره تلفن</p>
        </div>

        <div class="card p-4 space-y-3">
          <div class="h-80 overflow-y-auto space-y-3 p-3 bg-mist rounded-2xl">
            <div 
              v-for="m in chatMessages" 
              :key="m.id"
              :class="[
                'max-w-[80%] p-3.5 rounded-2xl text-sm leading-relaxed shadow-sm',
                m.sender_name.includes('احمدی') 
                  ? 'mr-auto bg-royal text-white rounded-br-none' 
                  : 'ml-auto bg-white text-ink border border-line rounded-bl-none'
              ]"
            >
              <div class="flex justify-between items-center text-xs opacity-75 mb-1 gap-2">
                <span class="font-bold">{{ m.sender_name }}</span>
                <span>{{ m.time_fa }}</span>
              </div>
              <p>{{ m.text }}</p>
            </div>
          </div>

          <form @submit.prevent="sendMessage" class="flex gap-2">
            <input 
              v-model="newMsgText" 
              class="input flex-1" 
              placeholder="پیامت را بنویس..." 
              required
            />
            <button type="submit" class="btn btn-royal !px-5 font-bold" aria-label="ارسال">
              <i data-lucide="send" class="w-5 h-5"></i>
            </button>
          </form>

          <div class="rounded-[20px] p-3 flex items-start gap-2.5 bg-white border border-line text-xs text-[#5A6E99]">
            <i data-lucide="shield-check" class="w-5 h-5 text-ok shrink-0"></i>
            <p>همه پیام‌ها داخل پلتفرم می‌ماند و شماره تلفن والدین یا دانش‌آموزان نمایش داده نمی‌شود.</p>
          </div>
        </div>
      </section>
    </main>

    <!-- Bottom Dock Navigation -->
    <nav class="dock fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur border-t border-line pb-[env(safe-area-inset-bottom)]" aria-label="منوی اصلی">
      <div class="max-w-3xl mx-auto grid grid-cols-4">
        <button 
          @click="activeTab = 'cls'" 
          :aria-current="activeTab === 'cls' ? 'page' : undefined"
          class="dock-item"
        >
          <i data-lucide="users-round"></i>
          <span>کلاس‌ها</span>
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
          <span>آزمون</span>
        </button>
        <button 
          @click="activeTab = 'msg'" 
          :aria-current="activeTab === 'msg' ? 'page' : undefined"
          class="dock-item"
        >
          <i data-lucide="messages-square"></i>
          <span>پیام</span>
        </button>
      </div>
    </nav>

    <!-- ================= CAMERA ANSWER SHEET SCANNER SIMULATOR ================= -->
    <div 
      v-if="cameraOpen" 
      class="fixed inset-0 z-50 text-white flex flex-col" 
      style="background:radial-gradient(600px 500px at 50% 40%,#233252,#05070D)"
    >
      <div class="flex items-center justify-between p-4 bg-black/40">
        <button @click="cameraOpen = false" class="w-11 h-11 rounded-2xl bg-white/15 flex items-center justify-center font-bold" aria-label="بستن">
          <i data-lucide="x" class="w-5 h-5"></i>
        </button>
        <p class="font-bold text-sm">اسکن پاسخ‌برگ</p>
        <button class="w-11 h-11 rounded-2xl bg-white/15 flex items-center justify-center" aria-label="چراغ">
          <i data-lucide="zap" class="w-5 h-5 text-sun"></i>
        </button>
      </div>

      <div class="flex-1 flex items-center justify-center px-4 sm:px-8 relative py-2">
        <div class="relative w-full max-w-[240px] sm:max-w-[280px] aspect-[3/4] border-2 border-white/20 rounded-3xl overflow-hidden p-4 sm:p-6 flex flex-col justify-between">
          <!-- Guide Corners -->
          <span class="absolute top-0 right-0 w-8 sm:w-10 h-8 sm:h-10 border-t-4 border-r-4 border-sun rounded-tr-2xl"></span>
          <span class="absolute top-0 left-0 w-8 sm:w-10 h-8 sm:h-10 border-t-4 border-l-4 border-sun rounded-tl-2xl"></span>
          <span class="absolute bottom-0 right-0 w-8 sm:w-10 h-8 sm:h-10 border-b-4 border-r-4 border-sun rounded-br-2xl"></span>
          <span class="absolute bottom-0 left-0 w-8 sm:w-10 h-8 sm:h-10 border-b-4 border-l-4 border-sun rounded-bl-2xl"></span>

          <!-- Animated Laser Scanline (Claude Prompt) -->
          <div v-if="scanning" class="scanline"></div>

          <!-- Ghost Sheet Pattern -->
          <div class="space-y-2.5 opacity-30">
            <div class="h-2.5 sm:h-3 bg-white/70 rounded w-2/3"></div>
            <div v-for="i in 8" :key="i" class="flex gap-2 justify-between">
              <span class="w-3.5 sm:w-4 h-2 bg-white/50 rounded-full"></span>
              <span class="w-3.5 sm:w-4 h-2 bg-white/50 rounded-full"></span>
              <span class="w-3.5 sm:w-4 h-2 bg-white/50 rounded-full"></span>
              <span class="w-3.5 sm:w-4 h-2 bg-white/50 rounded-full"></span>
            </div>
          </div>
        </div>
      </div>

      <p class="text-center text-white/80 text-xs px-4 py-1.5">
        پاسخ‌برگ را داخل کادر بگذار و گوشی را ثابت نگه دار.
      </p>

      <div class="flex justify-center py-4 sm:py-6 bg-black/40">
        <button 
          @click="captureScan" 
          :disabled="scanning" 
          class="w-16 h-16 sm:w-[76px] sm:h-[76px] rounded-full border-4 border-white flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95 transition-all"
          aria-label="اسکن"
        >
          <span class="w-12 h-12 sm:w-[58px] sm:h-[58px] rounded-full bg-white block"></span>
        </button>
      </div>

      <!-- Scan Result Bottom Sheet -->
      <div 
        v-if="scanResult" 
        class="absolute inset-x-0 bottom-0 bg-white text-ink rounded-t-[28px] p-6 rise shadow-2xl space-y-4"
      >
        <div class="flex items-center gap-4">
          <div class="w-16 h-16 rounded-full shrink-0 flex items-center justify-center" style="background:conic-gradient(#12A150 85%,#E3ECFF 0)">
            <div class="w-[50px] h-[50px] rounded-full bg-white flex items-center justify-center font-extrabold text-sm text-ok">
              {{ faNum(scanResult.percentage) }}٪
            </div>
          </div>
          <div class="flex-1">
            <p class="text-xs text-[#5A6E99]">نتیجه نمونه</p>
            <p class="font-extrabold text-[18px]">{{ scanResult.student_name }}، {{ faNum(scanResult.score) }} از ۲۰</p>
            <p class="text-xs text-[#5A6E99]">{{ faNum(scanResult.correct) }} درست، {{ faNum(scanResult.wrong) }} غلط، {{ faNum(scanResult.unanswered) }} نزده</p>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <button @click="scanResult = null; captureScan()" class="btn btn-soft">
            <i data-lucide="scan-line" class="w-5 h-5"></i>
            <span>اسکن بعدی</span>
          </button>
          <button @click="saveScanResult" class="btn btn-royal">
            <i data-lucide="check" class="w-5 h-5"></i>
            <span>ذخیره نتیجه</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Toast Notification -->
    <div 
      v-if="toastMsg" 
      class="fixed top-5 left-1/2 -translate-x-1/2 z-[80] bg-ink text-white rounded-2xl px-5 py-3 shadow-2xl font-bold flex items-center gap-2 rise"
    >
      <i data-lucide="circle-check" class="w-5 h-5 text-sun"></i>
      <span>{{ toastMsg }}</span>
    </div>

    <!-- ================= HOOSH EXAM LIGHTBOX MODAL ================= -->
    <div 
      v-if="lightboxOpen && lightboxPage" 
      class="fixed inset-0 z-[70] bg-ink/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 no-print"
      @click.self="closeLightbox"
    >
      <div class="card p-4 w-full max-w-4xl max-h-[92vh] overflow-hidden flex flex-col bg-white">
        <div class="flex items-center justify-between pb-3 border-b border-line">
          <div class="flex items-center gap-2">
            <span class="tag bg-royal text-white font-bold text-xs">صفحه {{ faNum(lightboxPage.bookPage) }} کتاب</span>
            <h4 class="font-bold text-sm text-ink truncate">{{ lightboxPage.topicTitle }}</h4>
          </div>
          <div class="flex items-center gap-2">
            <button 
              @click="togglePageInBasket(lightboxPage)"
              :class="[
                'btn btn-sm text-xs font-bold',
                isPageInBasket(lightboxPage.pdfPage, lightboxPage.bookId) ? 'btn-soft text-late' : 'btn-royal'
              ]"
            >
              {{ isPageInBasket(lightboxPage.pdfPage, lightboxPage.bookId) ? 'حذف از آزمون' : 'افزودن به آزمون' }}
            </button>
            <button @click="closeLightbox" class="text-[#5A6E99] hover:text-ink p-1 border-none bg-transparent cursor-pointer">
              <i data-lucide="x" class="w-5 h-5"></i>
            </button>
          </div>
        </div>
        <div class="flex-1 overflow-auto p-2 sm:p-4 flex items-center justify-center bg-mist rounded-xl my-2">
          <img 
            :src="lightboxPage.imgSrc || (lightboxPage.bookId === 'hoosh_8_9' ? `/extracted_pages/hoosh_8_9/page_${lightboxPage.pdfPage}.jpg` : `/extracted_pages/page_${lightboxPage.pdfPage}.jpg`)" 
            :alt="`برگه سوال صفحه ${lightboxPage.bookPage}`" 
            class="max-w-full max-h-[75vh] object-contain rounded-lg shadow-sm"
          />
        </div>
      </div>
    </div>

    <!-- ================= HOOSH EXAM PRINT PREVIEW MODAL ================= -->
    <div 
      v-if="printModalOpen" 
      class="fixed inset-0 z-[75] bg-ink/80 backdrop-blur-sm overflow-y-auto p-2 sm:p-6 no-print flex flex-col items-center"
      @click.self="closePrintModal"
    >
      <div class="w-full max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-line my-auto">
        <!-- Top Toolbar -->
        <div class="p-3 sm:px-6 bg-[#0B1F4D] text-white flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div class="flex items-center gap-2">
            <i data-lucide="printer" class="w-5 h-5 text-sun"></i>
            <span class="font-extrabold text-sm sm:text-base">
              {{ printMode === 'exam' ? 'پیش‌نمایش دفترچه استاندارد آزمون (A4)' : 'پیش‌نمایش پاسخ‌برگ ۴ گزینه‌ای دانش‌آموز' }}
            </span>
            <span class="tag bg-white/20 text-white text-xs">
              {{ faNum(sortedExamBasket.length) }} برگه
            </span>
          </div>
          <div class="flex items-center gap-2">
            <button 
              @click="doPrint" 
              class="btn btn-sun !text-ink font-black text-xs sm:text-sm !py-2 !px-4 shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <i data-lucide="printer" class="w-4 h-4"></i>
              <span>چاپ یا ذخیره PDF</span>
            </button>
            <button 
              @click="closePrintModal" 
              class="btn btn-soft !bg-white/10 !text-white hover:!bg-white/20 text-xs !py-2 !px-3 cursor-pointer"
            >
              بستن
            </button>
          </div>
        </div>

        <!-- Scrollable Sheet Content -->
        <div class="p-4 sm:p-8 bg-slate-100 overflow-y-auto max-h-[80vh] space-y-6">
          
          <!-- Mode 1: Exam Pages Preview -->
          <div v-if="printMode === 'exam'" class="space-y-6">
            <div 
              v-for="(item, index) in sortedExamBasket" 
              :key="`${item.bookId}_${item.pdfPage}`"
              class="hoosh-print-sheet bg-white text-slate-900 p-6 sm:p-10 mx-auto border border-slate-300 shadow-sm rounded-lg max-w-4xl"
              style="min-height: 280mm; display: flex; flex-direction: column; justify-content: space-between;"
            >
              <!-- Official Header -->
              <div class="pb-3 border-b-2 border-royal mb-4">
                <div class="text-center font-nastaliq text-base text-slate-800 mb-1">بسم الله الرحمن الرحیم</div>
                <div class="flex items-center justify-between gap-4">
                  <div class="flex items-center gap-3">
                    <div class="w-12 h-12 rounded-xl bg-royal text-white flex items-center justify-center font-bold text-lg font-titr">
                      <span>رشد</span>
                    </div>
                    <div>
                      <h2 class="text-base sm:text-lg font-black text-ink font-titr">کانون نخبه‌پروری دانشمند شهید دکتر سعید کاظمی آشتیانی</h2>
                      <p class="text-xs text-slate-600 font-medium font-nazanin">پایگاه علمی تربیتی مسجد ائمه بقیع (ع) تربت حیدریه | سامانه آزمون تیزهوشان</p>
                    </div>
                  </div>

                  <div class="text-left text-xs space-y-1 font-semibold text-slate-700 font-yekan">
                    <div>تاریخ آزمون: <span class="font-bold text-slate-950">{{ examConfig.date }}</span></div>
                    <div>مدت پاسخگویی: <span class="font-bold text-slate-950">{{ examConfig.duration }}</span></div>
                    <div>صفحه: <span class="font-bold text-royal">{{ faNum(index + 1) }} از {{ faNum(sortedExamBasket.length) }}</span></div>
                  </div>
                </div>

                <!-- Exam Title Bar -->
                <div class="mt-3 pt-2 border-t border-slate-200 flex flex-wrap items-center justify-between text-xs gap-2 bg-slate-50 p-2 rounded">
                  <div class="font-bold text-royal font-titr text-sm">
                    {{ examConfig.title }} | {{ examConfig.grade }}
                  </div>
                  <div class="text-slate-600 font-yekan">
                    مدرس/طراح: <span class="font-bold text-slate-900">{{ examConfig.teacher }}</span>
                    <span v-if="examConfig.hasNegativeScore" class="text-rose-700 font-bold mr-2">| دارای نمره منفی</span>
                  </div>
                </div>

                <!-- Student Blank Info Box (Page 1 Only) -->
                <div v-if="index === 0" class="mt-2 grid grid-cols-4 gap-2 text-[11px] font-yekan p-2 border border-slate-300 rounded bg-white">
                  <div>نام و نام خانوادگی: .............................</div>
                  <div>نام کلاس / مدرسه: .............................</div>
                  <div>شماره داوطلب: .............................</div>
                  <div>نمره خام / تراز: .............................</div>
                </div>
              </div>

              <!-- Question Sheet High-Res Image -->
              <div class="flex-1 flex items-center justify-center my-2">
                <img 
                  :src="item.imgSrc || (item.bookId === 'hoosh_8_9' ? `/extracted_pages/hoosh_8_9/page_${item.pdfPage}.jpg` : `/extracted_pages/page_${item.pdfPage}.jpg`)" 
                  :alt="`سؤالات صفحه ${item.bookPage}`" 
                  class="max-w-full h-auto object-contain mx-auto border border-slate-200 rounded"
                />
              </div>

              <!-- Page Footer -->
              <div class="pt-3 border-t border-slate-300 flex items-center justify-between text-[11px] text-slate-500 font-yekan">
                <span>{{ item.bookTitle || 'هوش کمپلکس' }} • مبحث {{ faNum(item.topicId) }}: {{ item.topicTitle }} (صفحه کتاب: {{ faNum(item.bookPage) }})</span>
                <span class="font-nastaliq text-xs text-slate-700">«شما آینده‌سازان تمدن نوین اسلامی و فرزندان امیدبخش این آب و خاکید»</span>
                <span>صفحه {{ faNum(index + 1) }}</span>
              </div>
            </div>
          </div>

          <!-- Mode 2: Bubble Answer Sheet -->
          <div v-else-if="printMode === 'answersheet'">
            <div class="hoosh-print-sheet bg-white text-slate-900 p-8 sm:p-12 max-w-4xl mx-auto border border-slate-300 shadow-sm rounded-lg" style="min-height: 280mm; display: flex; flex-direction: column; justify-content: space-between;">
              <div>
                <!-- Header -->
                <div class="text-center font-nastaliq text-base text-slate-800 mb-1">بسم الله الرحمن الرحیم</div>
                <div class="pb-4 border-b-2 border-royal mb-6 flex items-center justify-between">
                  <div>
                    <h2 class="text-xl font-black text-ink font-titr">پاسخ‌برگ اختصاصی ۴ گزینه‌ای</h2>
                    <p class="text-xs text-slate-600 mt-1 font-nazanin">کانون نخبه‌پروری دانشمند شهید دکتر سعید کاظمی آشتیانی تربت حیدریه</p>
                    <p class="text-xs text-royal font-bold mt-1 font-titr">{{ examConfig.title }} - {{ examConfig.grade }}</p>
                  </div>
                  <div class="text-left text-xs space-y-1 font-yekan">
                    <div>تاریخ برگزاری: <span class="font-bold">{{ examConfig.date }}</span></div>
                    <div>مدت پاسخگویی: <span class="font-bold">{{ examConfig.duration }}</span></div>
                    <div>طراح: <span class="font-bold">{{ examConfig.teacher }}</span></div>
                  </div>
                </div>

                <!-- Student Info Fields -->
                <div class="grid grid-cols-3 gap-4 text-xs font-yekan p-3 border-2 border-dashed border-slate-300 rounded-lg mb-6 bg-slate-50">
                  <div>نام و نام خانوادگی: ............................................</div>
                  <div>کلاس / شعبه: ............................................</div>
                  <div>شماره صندلی / کد: ............................................</div>
                </div>

                <!-- Bubble Grid (4 columns) -->
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 border border-slate-300 rounded-lg bg-white">
                  <div v-for="colIndex in 4" :key="colIndex" class="space-y-1">
                    <div 
                      v-for="q in getBubbleColumnQuestions(colIndex)" 
                      :key="q"
                      class="hoosh-bubble-row"
                    >
                      <span class="w-6 font-bold text-slate-800 text-left">{{ faNum(q) }}.</span>
                      <span class="hoosh-bubble-opt">۱</span>
                      <span class="hoosh-bubble-opt">۲</span>
                      <span class="hoosh-bubble-opt">۳</span>
                      <span class="hoosh-bubble-opt">۴</span>
                    </div>
                  </div>
                </div>

                <div class="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 leading-relaxed">
                  <b>تذکر مهم به دانش‌آموزان:</b> لطفاً پاسخ‌ها را فقط با مداد سیاه نرم و پررنگ تکمیل فرمایید. هر سؤال تنها یک پاسخ صحیح دارد.
                  <span v-if="examConfig.hasNegativeScore" class="font-bold text-rose-700">این آزمون دارای نمره منفی است.</span>
                </div>
              </div>

              <!-- Answer Sheet Footer -->
              <div class="pt-4 border-t border-slate-300 flex items-center justify-between text-xs text-slate-500">
                <span>سامانه جامع آموزشی و آزمون پلتفرم رشد — کانون شهید کاظمی آشتیانی</span>
                <span>تعداد کل سؤالات: {{ faNum(totalEstimatedQuestions) }} سؤال</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>

    <!-- ================= UPLOAD NEW BOOK MODAL ================= -->
    <div 
      v-if="uploadModalOpen" 
      class="fixed inset-0 z-[80] bg-ink/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 no-print"
      @click.self="uploadModalOpen = false"
    >
      <div class="card p-5 sm:p-6 w-full max-w-lg bg-white shadow-2xl rounded-2xl border border-line space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-line">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-xl bg-sun text-ink flex items-center justify-center font-black">
              <i data-lucide="upload-cloud" class="w-4 h-4"></i>
            </div>
            <div>
              <h4 class="font-black text-sm sm:text-base text-ink">بارگذاری و افزودن کتاب جدید</h4>
              <p class="text-[11px] text-[#5A6E99]">افزودن کتاب‌های بیشتر برای طراحی آزمون پایه‌های مختلف</p>
            </div>
          </div>
          <button @click="uploadModalOpen = false" class="text-[#5A6E99] hover:text-ink p-1 border-none bg-transparent cursor-pointer">
            <i data-lucide="x" class="w-5 h-5"></i>
          </button>
        </div>

        <form @submit.prevent="submitUploadBook" class="space-y-3.5 text-xs">
          <div>
            <label class="lbl">عنوان کامل کتاب:</label>
            <input 
              v-model="newBookForm.title" 
              type="text" 
              placeholder="مثال: هوش و خلاقیت ریاضی نهم (خیلی سبز)" 
              class="input text-xs font-bold" 
              required 
            />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="lbl">پایه / مقطع تحصیلی:</label>
              <select v-model="newBookForm.grade" class="input text-xs font-bold">
                <option value="هشتم و نهم">پایه هشتم و نهم (تیزهوشان دهم)</option>
                <option value="ششم">پایه پنجم و ششم (تیزهوشان هفتم)</option>
                <option value="هفتم">پایه هفتم</option>
                <option value="هشتم">پایه هشتم</option>
                <option value="نهم">پایه نهم</option>
                <option value="دوره اول متوسطه">دوره اول متوسطه</option>
              </select>
            </div>
            <div>
              <label class="lbl">تعداد تقریبی مباحث:</label>
              <input 
                v-model.number="newBookForm.topics_count" 
                type="number" 
                min="1" 
                max="500" 
                class="input text-xs font-bold" 
              />
            </div>
          </div>

          <div>
            <label class="lbl">توضیحات کوتاه کتاب:</label>
            <textarea 
              v-model="newBookForm.description" 
              rows="2" 
              placeholder="توضیحاتی در مورد سرفصل‌ها یا کاربرد کتاب برای آزمون..." 
              class="input text-xs"
            ></textarea>
          </div>

          <div>
            <label class="lbl">انتخاب فایل کتاب (PDF):</label>
            <div class="border-2 border-dashed border-line rounded-xl p-4 text-center bg-mist hover:bg-royal/5 transition-colors cursor-pointer relative">
              <input 
                type="file" 
                accept=".pdf" 
                @change="handleBookFileSelect" 
                class="absolute inset-0 opacity-0 cursor-pointer w-full h-full" 
                required 
              />
              <i data-lucide="file-up" class="w-8 h-8 mx-auto text-royal mb-1.5"></i>
              <p class="font-bold text-ink">
                {{ newBookFile ? newBookFile.name : 'کلیک کنید یا فایل PDF را اینجا رها کنید' }}
              </p>
              <span class="text-[10px] text-[#5A6E99] block mt-0.5">فرمت مجاز: PDF تا حجم ۵۰۰ مگابایت</span>
            </div>
          </div>

          <div class="pt-3 border-t border-line flex items-center justify-end gap-2">
            <button 
              type="button" 
              @click="uploadModalOpen = false" 
              class="btn btn-soft text-xs font-bold !py-2.5 !px-4"
              :disabled="uploadingBook"
            >
              انصراف
            </button>
            <button 
              type="submit" 
              class="btn btn-royal text-xs font-black !py-2.5 !px-5 flex items-center gap-2 shadow-sm"
              :disabled="uploadingBook"
            >
              <i data-lucide="check" :class="['w-4 h-4', uploadingBook ? 'animate-spin' : '']"></i>
              <span>{{ uploadingBook ? 'در حال بارگذاری و ثبت...' : 'بارگذاری و افزودن کتاب' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Hidden Stage for Browser window.print() -->
    <div id="hoosh-print-stage" class="hidden">
      <!-- Mode 1: Exam Print Sheets -->
      <template v-if="printMode === 'exam'">
        <div 
          v-for="(item, index) in sortedExamBasket" 
          :key="`${item.bookId}_${item.pdfPage}`"
          class="hoosh-print-sheet hoosh-print-break bg-white text-slate-900 p-8"
          style="min-height: 280mm; display: flex; flex-direction: column; justify-content: space-between;"
        >
          <!-- Header -->
          <div class="pb-3 border-b-2 border-royal mb-4">
            <div class="text-center font-nastaliq text-base text-slate-800 mb-1">بسم الله الرحمن الرحیم</div>
            <div class="flex items-center justify-between gap-4">
              <div class="flex items-center gap-3">
                <div class="w-12 h-12 rounded-xl bg-royal text-white flex items-center justify-center font-bold text-lg font-titr">
                  <span>رشد</span>
                </div>
                <div>
                  <h2 class="text-base font-black text-ink font-titr">کانون نخبه‌پروری دانشمند شهید دکتر سعید کاظمی آشتیانی</h2>
                  <p class="text-xs text-slate-600 font-medium font-nazanin">پایگاه علمی تربیتی مسجد ائمه بقیع (ع) تربت حیدریه | سامانه آزمون تیزهوشان</p>
                </div>
              </div>
              <div class="text-left text-xs space-y-1 font-semibold text-slate-700 font-yekan">
                <div>تاریخ آزمون: <span class="font-bold text-slate-950">{{ examConfig.date }}</span></div>
                <div>مدت پاسخگویی: <span class="font-bold text-slate-950">{{ examConfig.duration }}</span></div>
                <div>صفحه: <span class="font-bold text-royal">{{ faNum(index + 1) }} از {{ faNum(sortedExamBasket.length) }}</span></div>
              </div>
            </div>
            <div class="mt-3 pt-2 border-t border-slate-200 flex items-center justify-between text-xs bg-slate-50 p-2 rounded">
              <div class="font-bold text-royal font-titr text-sm">{{ examConfig.title }} | {{ examConfig.grade }}</div>
              <div class="text-slate-600 font-yekan">
                مدرس/طراح: <span class="font-bold text-slate-900">{{ examConfig.teacher }}</span>
                <span v-if="examConfig.hasNegativeScore" class="text-rose-700 font-bold mr-2">| دارای نمره منفی</span>
              </div>
            </div>
            <div v-if="index === 0" class="mt-2 grid grid-cols-4 gap-2 text-[11px] font-yekan p-2 border border-slate-300 rounded bg-white">
              <div>نام و نام خانوادگی: .............................</div>
              <div>نام کلاس / مدرسه: .............................</div>
              <div>شماره داوطلب: .............................</div>
              <div>نمره خام / تراز: .............................</div>
            </div>
          </div>

          <!-- Image -->
          <div class="flex-1 flex items-center justify-center my-2">
            <img 
              :src="item.imgSrc || (item.bookId === 'hoosh_8_9' ? `/extracted_pages/hoosh_8_9/page_${item.pdfPage}.jpg` : `/extracted_pages/page_${item.pdfPage}.jpg`)" 
              :alt="`سؤالات صفحه ${item.bookPage}`" 
              class="max-w-full h-auto object-contain mx-auto"
            />
          </div>

          <!-- Footer -->
          <div class="pt-3 border-t border-slate-300 flex items-center justify-between text-[11px] text-slate-500 font-yekan">
            <span>{{ item.bookTitle || 'هوش کمپلکس' }} • مبحث {{ faNum(item.topicId) }}: {{ item.topicTitle }} (صفحه کتاب: {{ faNum(item.bookPage) }})</span>
            <span class="font-nastaliq text-xs text-slate-700">«شما آینده‌سازان تمدن نوین اسلامی و فرزندان امیدبخش این آب و خاکید»</span>
            <span>صفحه {{ faNum(index + 1) }}</span>
          </div>
        </div>
      </template>

      <!-- Mode 2: Answersheet Print -->
      <template v-else-if="printMode === 'answersheet'">
        <div class="hoosh-print-sheet bg-white text-slate-900 p-8" style="min-height: 280mm; display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            <div class="text-center font-nastaliq text-base text-slate-800 mb-1">بسم الله الرحمن الرحیم</div>
            <div class="pb-4 border-b-2 border-royal mb-6 flex items-center justify-between">
              <div>
                <h2 class="text-xl font-black text-ink font-titr">پاسخ‌برگ اختصاصی ۴ گزینه‌ای</h2>
                <p class="text-xs text-slate-600 mt-1 font-nazanin">کانون نخبه‌پروری دانشمند شهید دکتر سعید کاظمی آشتیانی تربت حیدریه</p>
                <p class="text-xs text-royal font-bold mt-1 font-titr">{{ examConfig.title }} - {{ examConfig.grade }}</p>
              </div>
              <div class="text-left text-xs space-y-1 font-yekan">
                <div>تاریخ: <span class="font-bold">{{ examConfig.date }}</span></div>
                <div>مدت: <span class="font-bold">{{ examConfig.duration }}</span></div>
                <div>طراح: <span class="font-bold">{{ examConfig.teacher }}</span></div>
              </div>
            </div>
            <div class="grid grid-cols-3 gap-4 text-xs font-yekan p-3 border-2 border-dashed border-slate-300 rounded-lg mb-6 bg-slate-50">
              <div>نام و نام خانوادگی: ............................................</div>
              <div>کلاس / شعبه: ............................................</div>
              <div>شماره صندلی / کد: ............................................</div>
            </div>
            <div class="grid grid-cols-4 gap-4 p-4 border border-slate-300 rounded-lg bg-white">
              <div v-for="colIndex in 4" :key="colIndex" class="space-y-1">
                <div 
                  v-for="q in getBubbleColumnQuestions(colIndex)" 
                  :key="q"
                  class="hoosh-bubble-row font-yekan"
                >
                  <span class="w-6 font-bold text-slate-800 text-left">{{ faNum(q) }}.</span>
                  <span class="hoosh-bubble-opt">۱</span>
                  <span class="hoosh-bubble-opt">۲</span>
                  <span class="hoosh-bubble-opt">۳</span>
                  <span class="hoosh-bubble-opt">۴</span>
                </div>
              </div>
            </div>
          </div>
          <div class="pt-4 border-t border-slate-300 flex items-center justify-between text-xs text-slate-500">
            <span>سامانه پلتفرم رشد — کانون شهید کاظمی آشتیانی</span>
            <span>تعداد کل سؤالات: {{ faNum(totalEstimatedQuestions) }} سؤال</span>
          </div>
        </div>
      </template>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue';
import { faNum, playBeep, refreshIcons } from '../utils';
import hooshTopicsData6 from '../data/hoosh_topics.json';
import hooshTopicsData89 from '../data/hoosh_topics_8_9.json';

const props = defineProps({
  user: { type: Object, required: true }
});

defineEmits(['logout']);

const activeTab = ref('cls');
const clsSubTab = ref('att');
const hwSubTab = ref('new');
const toastMsg = ref('');
const cameraOpen = ref(false);
const scanning = ref(false);
const scanResult = ref(null);

const classOptions = [
  { id: '7a', grade: 'هفتم', class_name: 'الف', label: 'هفتم الف' },
  { id: '7b', grade: 'هفتم', class_name: 'ب', label: 'هفتم ب' },
  { id: '8a', grade: 'هشتم', class_name: 'الف', label: 'هشتم الف' }
];
const selectedClass = ref(classOptions[0]);

const attStudents = ref([]);

const attStats = computed(() => {
  const p = attStudents.value.filter(s => s.status === 'p').length;
  const a = attStudents.value.filter(s => s.status === 'a').length;
  const e = attStudents.value.filter(s => s.status === 'e').length;
  return { present: p, absent: a, excused: e };
});

watch([activeTab, clsSubTab, hwSubTab, cameraOpen], () => {
  nextTick(() => refreshIcons());
});

watch(selectedClass, () => {
  loadAttendance();
});

function toast(msg) {
  toastMsg.value = msg;
  nextTick(() => refreshIcons());
  setTimeout(() => toastMsg.value = '', 3000);
}

// Attendance
async function loadAttendance() {
  try {
    const res = await fetch(`/api/attendance?grade=${selectedClass.value.grade}&class_name=${selectedClass.value.class_name}&date_fa=۱۴۰۵/۰۸/۰۴`);
    const data = await res.json();
    const list = Array.isArray(data) ? data : (data.students || []);
    attStudents.value = list.map(s => ({
      id: s.student_id || s.id,
      full_name: s.full_name || s.name || 'دانش‌آموز',
      status: s.status || 'p',
      phone: s.phone,
      parent_phone: s.parent_phone
    }));
  } catch (e) {
    console.error(e);
  } finally {
    nextTick(() => refreshIcons());
  }
}

function markAllPresent() {
  attStudents.value.forEach(s => s.status = 'p');
  toast('وضعیت تمام دانش‌آموزان روی حاضر تنظیم شد');
}

async function saveAttendance() {
  if (attStudents.value.length === 0) {
    toast('دانش‌آموزی در این کلاس برای ثبت حضور و غیاب یافت نشد.');
    return;
  }
  try {
    const res = await fetch('/api/attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grade: selectedClass.value.grade,
        class_name: selectedClass.value.class_name,
        date_fa: '۱۴۰۵/۰۸/۰۴',
        records: attStudents.value.map(s => ({ student_id: s.id, status: s.status }))
      })
    });
    const d = await res.json();
    const absentCount = attStudents.value.filter(s => s.status === 'a').length;
    toast(`حضور و غیاب ثبت شد و پیامک برای ${faNum(absentCount)} غایب ارسال گردید.`);
  } catch (e) {
    console.error(e);
  }
}

// Homeworks
const newHw = ref({
  grade: 'هفتم',
  class_name: 'الف',
  title: '',
  description: '',
  deadline_fa: '۷ آبان، ساعت ۲۱:۰۰',
  points: 20
});

const hwReports = ref([]);

async function loadHwReports() {
  try {
    const res = await fetch('/api/homeworks/report');
    hwReports.value = await res.json();
  } catch (e) {
    console.error(e);
  } finally {
    nextTick(() => refreshIcons());
  }
}

async function createHomework() {
  if (!newHw.value.title) return;
  try {
    const res = await fetch('/api/homeworks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...newHw.value,
        teacher_name: props.user.full_name
      })
    });
    await res.json();
    toast('تکلیف با موفقیت ساخته و منتشر شد!');
    newHw.value.title = '';
    newHw.value.description = '';
    hwSubTab.value = 'rep';
    loadHwReports();
  } catch (e) {
    console.error(e);
  }
}

// Exam & Scanner Simulator
const newExam = ref({
  title: 'آزمون علوم فصل ۳ (اتم‌ها و پیوندها)',
  class_name: 'هفتم الف',
  question_count: 10
});

const answerKey = ref({ 1: 2, 2: 1, 3: 3, 4: 4, 5: 1, 6: 2, 7: 3, 8: 4, 9: 1, 10: 2 });

function saveExamKey() {
  toast('کلید سوالات آزمون ذخیره شد');
}

function openScanner() {
  cameraOpen.value = true;
  scanResult.value = null;
  nextTick(() => refreshIcons());
}

function captureScan() {
  scanning.value = true;
  playBeep(900, 0.2);

  setTimeout(() => {
    scanning.value = false;
    playBeep(1200, 0.3);

    const names = ['سارا محمدی', 'پارسا نجفی', 'نیلوفر احمدی', 'حسین موسوی', 'هستی طاهری'];
    const chosenName = names[Math.floor(Math.random() * names.length)];
    const correct = Math.floor(Math.random() * 4) + 16;
    const wrong = 20 - correct;

    scanResult.value = {
      student_name: chosenName,
      score: correct,
      correct: correct,
      wrong: wrong,
      unanswered: 0,
      percentage: Math.round((correct / 20) * 100)
    };
    nextTick(() => refreshIcons());
  }, 1200);
}

function saveScanResult() {
  toast(`نمره ${scanResult.value.student_name} در کارنامه ذخیره شد`);
  cameraOpen.value = false;
  scanResult.value = null;
}

// Chat
const chatMessages = ref([]);
const newMsgText = ref('');

async function loadMessages() {
  try {
    const res = await fetch(`/api/messages?user_id=${props.user.id}`);
    chatMessages.value = await res.json();
  } catch (e) {
    console.error(e);
  } finally {
    nextTick(() => refreshIcons());
  }
}

async function sendMessage() {
  if (!newMsgText.value.trim()) return;
  try {
    await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sender_id: props.user.id,
        receiver_id: 5,
        sender_name: props.user.full_name,
        receiver_name: 'علی رضایی',
        text: newMsgText.value.trim()
      })
    });
    newMsgText.value = '';
    loadMessages();
  } catch (e) {
    console.error(e);
  }
}


// ----------------- HOOSH COMPLEX & MULTI-BOOK EXAM STUDIO -----------------
const examSubTab = ref('hoosh'); // 'hoosh' | 'manual'
const searchQuery = ref('');
const selectedGradeFilter = ref('all'); // 'all' | 'ششم' | 'هشتم و نهم' | 'custom'
const selectedBookId = ref('hoosh_8_9'); // Default to newly added 8th & 9th book!
const selectedSectionId = ref('all');
const selectedChapterId = ref('all');
const selectedTopicId = ref(1);

// Books List with full metadata
const booksList = ref([
  {
    id: 'hoosh_8_9',
    title: 'هوش کمپلکس هشتم و نهم (تیزهوشان نهم)',
    grade: 'هشتم و نهم',
    gradeBadge: 'پایه ۸ و ۹',
    targetGrade: 'ورودی دهم مدارس تیزهوشان و نمونه دولتی',
    topicsCount: 201,
    sectionsCount: 5,
    chaptersCount: 19,
    pagesCount: 539,
    description: 'شامل ۵ بخش، ۱۹ فصل و ۲۰۱ مبحث تخصصی: کلامی، تصویری، ریاضی و محاسباتی، منطقی و فضایی فنی',
    imageFolder: '/extracted_pages/hoosh_8_9',
    pdfUrl: '/uploads/books/hoosh_complex_8_9.pdf',
    gradient: 'from-indigo-600 via-purple-600 to-pink-600',
    accentColor: 'indigo',
    isCustom: false
  },
  {
    id: 'hoosh_6',
    title: 'هوش کمپلکس پنجم و ششم (تیزهوشان ششم)',
    grade: 'ششم',
    gradeBadge: 'پایه ۵ و ۶',
    targetGrade: 'ورودی هفتم مدارس استعدادهای درخشان (سمپاد)',
    topicsCount: 201,
    sectionsCount: 7,
    chaptersCount: 21,
    pagesCount: 537,
    description: 'شامل ۷ بخش، ۲۱ فصل و ۲۰۱ مبحث استاندارد هوش و استعداد تحلیلی ششم',
    imageFolder: '/extracted_pages',
    pdfUrl: '/uploads/books/hoosh_complex_6.pdf',
    gradient: 'from-blue-600 via-cyan-600 to-teal-600',
    accentColor: 'blue',
    isCustom: false
  }
]);

// Filtered books based on selected grade
const filteredBooks = computed(() => {
  if (selectedGradeFilter.value === 'all') return booksList.value;
  if (selectedGradeFilter.value === 'ششم') {
    return booksList.value.filter(b => b.grade.includes('ششم') || b.grade.includes('۵'));
  }
  if (selectedGradeFilter.value === 'هشتم و نهم') {
    return booksList.value.filter(b => b.grade.includes('هشتم') || b.grade.includes('نهم'));
  }
  if (selectedGradeFilter.value === 'custom') {
    return booksList.value.filter(b => b.isCustom);
  }
  return booksList.value;
});

const activeBook = computed(() => {
  return booksList.value.find(b => b.id === selectedBookId.value) || booksList.value[0];
});

// Current Book Topics (Reactive per selected book)
const currentBookTopics = computed(() => {
  if (selectedBookId.value === 'hoosh_8_9') return hooshTopicsData89;
  if (selectedBookId.value === 'hoosh_6') return hooshTopicsData6;
  const b = booksList.value.find(item => item.id === selectedBookId.value);
  if (b && b.topicsData && Array.isArray(b.topicsData)) return b.topicsData;
  return hooshTopicsData89;
});

// Dynamic sections from current book topics
const hooshSections = computed(() => {
  const map = new Map();
  currentBookTopics.value.forEach(t => {
    if (!map.has(t.sectionId)) {
      map.set(t.sectionId, { id: t.sectionId, title: t.sectionTitle, count: 0 });
    }
    map.get(t.sectionId).count++;
  });
  return Array.from(map.values());
});

const availableChapters = computed(() => {
  const chaptersMap = new Map();
  currentBookTopics.value.forEach(t => {
    if (selectedSectionId.value === 'all' || t.sectionId === Number(selectedSectionId.value)) {
      if (!chaptersMap.has(t.chapterId)) {
        chaptersMap.set(t.chapterId, { id: t.chapterId, title: t.chapterTitle, count: 0 });
      }
      chaptersMap.get(t.chapterId).count++;
    }
  });
  return Array.from(chaptersMap.values());
});

const filteredTopics = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  return currentBookTopics.value.filter(t => {
    if (selectedSectionId.value !== 'all' && t.sectionId !== Number(selectedSectionId.value)) {
      return false;
    }
    if (selectedChapterId.value !== 'all' && t.chapterId !== Number(selectedChapterId.value)) {
      return false;
    }
    if (q) {
      const matchTitle = t.title.toLowerCase().includes(q);
      const matchSection = t.sectionTitle.toLowerCase().includes(q);
      const matchChapter = t.chapterTitle.toLowerCase().includes(q);
      const matchId = String(t.id).includes(q) || `مبحث ${t.id}`.includes(q);
      return matchTitle || matchSection || matchChapter || matchId;
    }
    return true;
  });
});

function selectBook(bookId) {
  selectedBookId.value = bookId;
  selectedSectionId.value = 'all';
  selectedChapterId.value = 'all';
  searchQuery.value = '';
  if (currentBookTopics.value.length > 0) {
    selectedTopicId.value = currentBookTopics.value[0].id;
  }
  // Auto-tune exam title & grade in config
  if (bookId === 'hoosh_8_9') {
    examConfig.value.title = 'آزمون هوش و استعداد تحلیلی (هوش کمپلکس ۸ و ۹)';
    examConfig.value.grade = 'پایه نهم (ورودی تیزهوشان دهم)';
  } else if (bookId === 'hoosh_6') {
    examConfig.value.title = 'آزمون هوش و استعداد تحلیلی (هوش کمپلکس ششم)';
    examConfig.value.grade = 'پایه ششم (ورودی تیزهوشان هفتم)';
  } else {
    examConfig.value.title = `آزمون از کتاب ${activeBook.value.title}`;
    examConfig.value.grade = activeBook.value.grade;
  }
  toast(`کتاب «${activeBook.value.title}» انتخاب شد`);
  nextTick(refreshIcons);
}

watch(selectedBookId, () => {
  selectedSectionId.value = 'all';
  selectedChapterId.value = 'all';
  if (filteredTopics.value.length > 0) {
    selectedTopicId.value = filteredTopics.value[0].id;
  }
});

watch(selectedSectionId, () => {
  selectedChapterId.value = 'all';
  if (filteredTopics.value.length > 0) {
    selectedTopicId.value = filteredTopics.value[0].id;
  }
});

watch(selectedChapterId, () => {
  if (filteredTopics.value.length > 0) {
    selectedTopicId.value = filteredTopics.value[0].id;
  }
});

watch([examSubTab, selectedGradeFilter, selectedBookId, selectedSectionId, selectedChapterId, selectedTopicId], () => {
  nextTick(() => refreshIcons());
});

const currentTopic = computed(() => {
  return currentBookTopics.value.find(t => t.id === Number(selectedTopicId.value)) || currentBookTopics.value[0];
});

const currentTopicPages = computed(() => {
  if (!currentTopic.value) return [];
  const list = [];
  const s = currentTopic.value.pdfStartPage;
  const e = currentTopic.value.pdfEndPage;
  const bs = currentTopic.value.bookStartPage;
  const folder = activeBook.value.imageFolder || '/extracted_pages';
  for (let p = s; p <= e; p++) {
    list.push({
      pdfPage: p,
      bookPage: bs + (p - s),
      topicId: currentTopic.value.id,
      topicTitle: currentTopic.value.title,
      sectionTitle: currentTopic.value.sectionTitle,
      chapterTitle: currentTopic.value.chapterTitle,
      bookId: activeBook.value.id,
      bookTitle: activeBook.value.title,
      imgSrc: `${folder}/page_${p}.jpg`
    });
  }
  return list;
});

// Book Upload State & Methods
const uploadModalOpen = ref(false);
const uploadingBook = ref(false);
const newBookForm = ref({
  title: '',
  grade: 'پایه هشتم و نهم',
  topics_count: 20,
  description: ''
});
const newBookFile = ref(null);

function handleBookFileSelect(event) {
  const file = event.target.files[0];
  if (file) {
    newBookFile.value = file;
    if (!newBookForm.value.title) {
      newBookForm.value.title = file.name.replace(/\.[^/.]+$/, '');
    }
  }
}

async function submitUploadBook() {
  if (!newBookForm.value.title || !newBookFile.value) {
    return alert('لطفاً عنوان کتاب و فایل PDF را انتخاب نمایید.');
  }
  uploadingBook.value = true;
  try {
    const formData = new FormData();
    formData.append('title', newBookForm.value.title);
    formData.append('grade', newBookForm.value.grade);
    formData.append('topics_count', newBookForm.value.topics_count);
    formData.append('description', newBookForm.value.description);
    formData.append('category', 'book');
    formData.append('file', newBookFile.value);

    const res = await fetch('/api/exam-books/upload', {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    if (res.ok) {
      toast('کتاب جدید با موفقیت بارگذاری و افزوده شد!');
      booksList.value.push({
        id: data.id,
        title: newBookForm.value.title,
        grade: newBookForm.value.grade,
        gradeBadge: newBookForm.value.grade,
        targetGrade: newBookForm.value.grade,
        topicsCount: Number(newBookForm.value.topics_count) || 20,
        sectionsCount: 1,
        chaptersCount: 1,
        pagesCount: (Number(newBookForm.value.topics_count) || 20) * 2,
        description: newBookForm.value.description || 'کتاب بارگذاری‌شده توسط معلم',
        imageFolder: `/extracted_pages/${data.id}`,
        pdfUrl: `/uploads/books/${newBookFile.value.name}`,
        gradient: 'from-emerald-600 via-teal-600 to-cyan-700',
        accentColor: 'emerald',
        isCustom: true
      });
      selectBook(data.id);
      uploadModalOpen.value = false;
      newBookFile.value = null;
      newBookForm.value = { title: '', grade: 'پایه هشتم و نهم', topics_count: 20, description: '' };
    } else {
      alert(data.error || 'خطا در بارگذاری کتاب');
    }
  } catch (err) {
    alert('خطا در ارتباط با سرور: ' + err.message);
  } finally {
    uploadingBook.value = false;
    nextTick(refreshIcons);
  }
}

async function fetchExamBooks() {
  try {
    const res = await fetch('/api/exam-books');
    if (res.ok) {
      const serverBooks = await res.json();
      serverBooks.forEach(sb => {
        if (!booksList.value.some(b => b.id === sb.id)) {
          booksList.value.push({
            id: sb.id,
            title: sb.title,
            grade: sb.grade,
            gradeBadge: sb.grade,
            targetGrade: sb.grade,
            topicsCount: sb.topics_count,
            sectionsCount: 1,
            chaptersCount: 1,
            pagesCount: sb.pages_count,
            description: sb.description,
            imageFolder: sb.image_folder || `/extracted_pages/${sb.id}`,
            pdfUrl: sb.file_url,
            gradient: 'from-emerald-600 via-teal-600 to-cyan-700',
            accentColor: 'emerald',
            isCustom: Boolean(sb.is_custom)
          });
        }
      });
    }
  } catch (e) {}
}

const examBasket = ref([]);
try {
  const saved = localStorage.getItem('roshd_teacher_exam_basket_v2');
  if (saved) examBasket.value = JSON.parse(saved);
} catch (e) {
  examBasket.value = [];
}

function saveBasket() {
  try {
    localStorage.setItem('roshd_teacher_exam_basket_v2', JSON.stringify(examBasket.value));
  } catch (e) {}
}

const sortedExamBasket = computed(() => {
  return [...examBasket.value].sort((a, b) => {
    if (a.bookId !== b.bookId) return a.bookId.localeCompare(b.bookId);
    return a.pdfPage - b.pdfPage;
  });
});

function getPageKey(pageObj) {
  const bId = pageObj.bookId || activeBook.value.id;
  return `${bId}_${pageObj.pdfPage}`;
}

function isPageInBasket(pdfPage, bookId = null) {
  const bId = bookId || activeBook.value.id;
  return examBasket.value.some(item => (item.bookId || 'hoosh_6') === bId && item.pdfPage === pdfPage);
}

function togglePageInBasket(pageObj) {
  const bId = pageObj.bookId || activeBook.value.id;
  const idx = examBasket.value.findIndex(item => (item.bookId || 'hoosh_6') === bId && item.pdfPage === pageObj.pdfPage);
  if (idx >= 0) {
    examBasket.value.splice(idx, 1);
    toast(`برگه صفحه ${faNum(pageObj.bookPage)} از آزمون حذف شد`);
  } else {
    examBasket.value.push({ ...pageObj, bookId: bId, bookTitle: pageObj.bookTitle || activeBook.value.title });
    toast(`برگه صفحه ${faNum(pageObj.bookPage)} به آزمون افزوده شد`);
  }
  saveBasket();
  nextTick(refreshIcons);
}

const currentTopicSelectedPagesCount = computed(() => {
  if (!currentTopic.value) return 0;
  const bId = activeBook.value.id;
  return examBasket.value.filter(item => (item.bookId || 'hoosh_6') === bId && item.topicId === currentTopic.value.id).length;
});

const areAllCurrentPagesInBasket = computed(() => {
  if (currentTopicPages.value.length === 0) return false;
  return currentTopicPages.value.every(p => isPageInBasket(p.pdfPage, p.bookId));
});

function toggleAllPagesForCurrentTopic() {
  const bId = activeBook.value.id;
  const tid = currentTopic.value.id;
  if (areAllCurrentPagesInBasket.value) {
    examBasket.value = examBasket.value.filter(item => !((item.bookId || 'hoosh_6') === bId && item.topicId === tid));
    toast(`تمام سؤالات مبحث ${faNum(tid)} از آزمون حذف شدند`);
  } else {
    currentTopicPages.value.forEach(p => {
      if (!isPageInBasket(p.pdfPage, p.bookId)) {
        examBasket.value.push({ ...p, bookId: bId, bookTitle: activeBook.value.title });
      }
    });
    toast(`تمام سؤالات مبحث ${faNum(tid)} به آزمون افزوده شدند`);
  }
  saveBasket();
  nextTick(refreshIcons);
}

function removeFromBasket(pdfPage, bookId = null) {
  const bId = bookId || activeBook.value.id;
  examBasket.value = examBasket.value.filter(item => !((item.bookId || 'hoosh_6') === bId && item.pdfPage === pdfPage));
  saveBasket();
  nextTick(refreshIcons);
}

function clearBasket() {
  if (examBasket.value.length === 0) return;
  if (confirm('آیا از تخلیه کامل سبد و حذف تمام سؤالات انتخاب‌شده اطمینان دارید؟')) {
    examBasket.value = [];
    saveBasket();
    toast('سبد آزمون تخلیه شد');
    nextTick(refreshIcons);
  }
}

const examConfig = ref({
  title: 'آزمون هوش و استعداد تحلیلی (هوش کمپلکس)',
  grade: 'پایه نهم (ورودی تیزهوشان)',
  teacher: props.user.full_name || 'استاد کانون شهید کاظمی آشتیانی',
  duration: '۴۵ دقیقه',
  date: 'آبان ۱۴۰۵',
  hasNegativeScore: true
});

const lightboxOpen = ref(false);
const lightboxPage = ref(null);

function openLightbox(page) {
  lightboxPage.value = page;
  lightboxOpen.value = true;
  nextTick(refreshIcons);
}

function closeLightbox() {
  lightboxOpen.value = false;
  lightboxPage.value = null;
}

const printModalOpen = ref(false);
const printMode = ref('exam'); // 'exam' | 'answersheet'

function openPrintModal(mode = 'exam') {
  if (examBasket.value.length === 0) {
    return alert('لطفاً ابتدا حداقل یک برگه سؤال را به آزمون اضافه نمایید.');
  }
  printMode.value = mode;
  printModalOpen.value = true;
  nextTick(refreshIcons);
}

function closePrintModal() {
  printModalOpen.value = false;
}

function doPrint() {
  window.print();
}

const totalEstimatedQuestions = computed(() => {
  return Math.min(80, Math.max(10, sortedExamBasket.value.length * 6));
});

function getBubbleColumnQuestions(colIndex) {
  const total = totalEstimatedQuestions.value;
  const perCol = Math.ceil(total / 4);
  const start = (colIndex - 1) * perCol + 1;
  const end = Math.min(total, colIndex * perCol);
  const qs = [];
  for (let i = start; i <= end; i++) {
    qs.push(i);
  }
  return qs;
}

async function saveOnlineExamFromHoosh() {
  if (examBasket.value.length === 0) return;
  try {
    const qCount = totalEstimatedQuestions.value;
    const questions = [];
    for (let i = 1; i <= qCount; i++) {
      questions.push({
        id: i,
        text: `سؤال شماره ${faNum(i)} از دفترچه آزمون هوش کمپلکس`,
        options: ['گزینه ۱', 'گزینه ۲', 'گزینه ۳', 'گزینه ۴'],
        correct: 1
      });
    }
    const res = await fetch('/api/exams', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: examConfig.value.title,
        grade: 'نهم',
        class_name: 'الف',
        duration_minutes: 45,
        questions
      })
    });
    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || 'خطا در ثبت آزمون آنلاین');
    }
    toast('آزمون با موفقیت در سامانه آنلاین رشد نیز ذخیره شد!');
  } catch (err) {
    toast('خطا: ' + err.message);
  }
}

// ----------------- STUDENT PERFORMANCE & SMART ATTENTION DETECTION -----------------
const perfStudents = ref([]);
const perfSummary = ref({
  total_students: 0,
  needs_attention_count: 0,
  excelling_count: 0,
  good_count: 0,
  class_study_avg_hours: 0,
  class_exam_avg_pct: 0,
  class_exam_avg_20: 0,
  class_hw_rate: 0
});
const perfFilter = ref('all');
const perfSort = ref('attention');
const perfSearch = ref('');
const perfLoading = ref(false);

const alertModalOpen = ref(false);
const selectedStudentForAlert = ref(null);
const alertMessageText = ref('');
const sendingAlert = ref(false);

const remedialModalOpen = ref(false);
const selectedStudentForPlan = ref(null);
const planText = ref('');

const filteredPerfStudents = computed(() => {
  let list = [...perfStudents.value];

  if (perfFilter.value === 'needs_attention') {
    list = list.filter(s => s.needs_attention);
  } else if (perfFilter.value === 'excelling') {
    list = list.filter(s => s.status === 'excelling');
  } else if (perfFilter.value === 'good') {
    list = list.filter(s => s.status === 'good');
  }

  if (perfSearch.value.trim()) {
    const q = perfSearch.value.trim().toLowerCase();
    list = list.filter(s => 
      (s.full_name && s.full_name.toLowerCase().includes(q)) ||
      (s.phone && s.phone.includes(q))
    );
  }

  if (perfSort.value === 'attention') {
    list.sort((a, b) => {
      if (a.needs_attention && !b.needs_attention) return -1;
      if (!a.needs_attention && b.needs_attention) return 1;
      return (b.attention_reasons?.length || 0) - (a.attention_reasons?.length || 0);
    });
  } else if (perfSort.value === 'exam_high') {
    list.sort((a, b) => (b.exam_avg_pct || 0) - (a.exam_avg_pct || 0));
  } else if (perfSort.value === 'study_high') {
    list.sort((a, b) => (b.study_hours || 0) - (a.study_hours || 0));
  } else if (perfSort.value === 'hw_low') {
    list.sort((a, b) => (a.homework_completion_rate || 0) - (b.homework_completion_rate || 0));
  } else if (perfSort.value === 'name') {
    list.sort((a, b) => (a.full_name || '').localeCompare(b.full_name || '', 'fa'));
  }

  return list;
});

async function loadStudentsPerformance() {
  perfLoading.value = true;
  try {
    const grade = selectedClass.value?.grade || 'هفتم';
    const className = selectedClass.value?.class_name || 'الف';
    const res = await fetch(`/api/teacher/students-performance?grade=${encodeURIComponent(grade)}&class_name=${encodeURIComponent(className)}`);
    if (res.ok) {
      const data = await res.json();
      perfStudents.value = data.students || [];
      if (data.summary) {
        perfSummary.value = data.summary;
      }
    }
  } catch (err) {
    console.error('Error loading performance:', err);
  } finally {
    perfLoading.value = false;
    nextTick(() => refreshIcons());
  }
}

function openAlertModal(st) {
  selectedStudentForAlert.value = st;
  const reasonsText = st.attention_reasons && st.attention_reasons.length > 0 
    ? st.attention_reasons.join('، ') 
    : 'نیاز به افزایش ساعت مطالعه و پیگیری تکالیف';
  alertMessageText.value = `با سلام و احترام؛ اولیای گرامی دانش‌آموز ${st.full_name}، وضعیت تحصیلی نامبرده در پلتفرم رشد بررسی شد. موارد نیازمند توجه: ${reasonsText}. لطفاً پیگیری و نظارت لازم جهت بهبود روند در منزل را مبذول فرمایید.`;
  alertModalOpen.value = true;
  nextTick(() => refreshIcons());
}

async function sendParentAlert() {
  if (!selectedStudentForAlert.value || !alertMessageText.value.trim()) return;
  sendingAlert.value = true;
  try {
    const res = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        receiver_id: selectedStudentForAlert.value.id,
        text: alertMessageText.value.trim()
      })
    });
    if (res.ok) {
      toast(`پیام هشدار تحصیلی به صورت سیستمی به اولیای ${selectedStudentForAlert.value.full_name} ارسال گردید.`);
      alertModalOpen.value = false;
      alertMessageText.value = '';
    } else {
      const d = await res.json();
      toast(d.error || 'خطا در ارسال پیام هشدار');
    }
  } catch (e) {
    toast('خطا در برقراری ارتباط با سرور');
  } finally {
    sendingAlert.value = false;
    nextTick(() => refreshIcons());
  }
}

async function sendPraise(st) {
  try {
    const text = `با سلام و درود؛ اولیای گرامی دانش‌آموز ممتاز ${st.full_name}، بدین‌وسیله مراتب تقدیر از پشتکار عالی، نمرات درخشان و حل کامل تکالیف فرزندتان در پلتفرم رشد تقدیم می‌گردد. با آرزوی تداوم موفقیت‌ها.`;
    const res = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        receiver_id: st.id,
        text
      })
    });
    if (res.ok) {
      toast(`تقدیرنامه با موفقیت برای اولیای ${st.full_name} ارسال شد.`);
    }
  } catch (e) {
    toast('خطا در ارسال پیام');
  }
}

function openRemedialModal(st) {
  selectedStudentForPlan.value = st;
  planText.value = `برنامه مطالعاتی جبرانی برای ${st.full_name}: حل آزمون فصل گذشته و ارسال مجدد تکالیف تا پایان هفته.`;
  remedialModalOpen.value = true;
  nextTick(() => refreshIcons());
}

async function assignRemedialPlan() {
  if (!selectedStudentForPlan.value || !planText.value.trim()) return;
  try {
    const res = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        receiver_id: selectedStudentForPlan.value.id,
        text: `[برنامه آموزشی جبرانی]\n${planText.value.trim()}`
      })
    });
    if (res.ok) {
      toast(`برنامه جبرانی برای ${selectedStudentForPlan.value.full_name} ثبت و ابلاغ شد.`);
      remedialModalOpen.value = false;
      planText.value = '';
    }
  } catch (e) {
    toast('خطا در ثبت برنامه');
  }
}

watch(clsSubTab, (val) => {
  if (val === 'perf') {
    loadStudentsPerformance();
  }
  nextTick(() => refreshIcons());
});

watch(selectedClass, () => {
  loadAttendance();
  loadStudentsPerformance();
});

onMounted(() => {
  loadAttendance();
  loadStudentsPerformance();
  loadHwReports();
  loadMessages();
  fetchExamBooks();
  refreshIcons();
});
</script>

<style>
.hoosh-bubble-row {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.75rem;
  padding: 3px 6px;
  border-radius: 4px;
}
.hoosh-bubble-row:nth-child(even) {
  background-color: #F8FAFC;
}
.hoosh-bubble-opt {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 1px solid #94A3B8;
  font-size: 11px;
  font-weight: bold;
  color: #475569;
}

@media print {
  body {
    background: #FFFFFF !important;
    color: #000000 !important;
    padding: 0 !important;
    margin: 0 !important;
    font-size: 12pt;
  }
  header, nav.dock, .dock, .no-print, main, footer, #toast-container, button {
    display: none !important;
  }

  #hoosh-print-stage {
    display: block !important;
    position: static !important;
    width: 100% !important;
    background: #FFFFFF !important;
  }

  .hoosh-print-break {
    page-break-after: always;
    break-after: page;
  }

  .hoosh-print-sheet {
    box-shadow: none !important;
    border: none !important;
    padding: 0 !important;
    margin: 0 auto !important;
    max-width: 100% !important;
    min-height: 280mm;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  .hoosh-print-sheet img {
    max-width: 100% !important;
    height: auto !important;
    display: block;
    margin: 0 auto;
  }

  @page {
    size: A4 portrait;
    margin: 10mm 12mm 15mm 12mm;
  }
}
</style>
