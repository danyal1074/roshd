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
        <div v-if="clsSubTab === 'perf'" class="space-y-3">
          <div class="card p-5 space-y-4">
            <h3 class="font-extrabold text-[18px]">عملکرد دانش‌آموزان و تأیید هوش مصنوعی</h3>
            <p class="text-xs text-[#5A6E99]">مسیرهای مطالعاتی پیشنهادی هوش مصنوعی برای هر دانش‌آموز را بررسی و در صورت تایید ثبت کنید.</p>

            <div class="space-y-3">
              <div 
                v-for="st in attStudents.slice(0, 6)" 
                :key="st.id"
                class="p-4 rounded-2xl border border-line bg-mist/40 space-y-2.5"
              >
                <div class="flex justify-between items-center">
                  <p class="font-bold text-base text-ink">{{ st.full_name }}</p>
                  <span class="tag bg-white font-bold text-royal text-xs">رتبه {{ faNum(Math.floor(Math.random() * 20) + 1) }}</span>
                </div>
                <div class="p-3 rounded-xl bg-white border border-line text-xs flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <i data-lucide="sparkles" class="w-4 h-4 text-sun"></i>
                    <span>مسیر هوش مصنوعی: ۲۰ دقیقه مرور کسرها و توان</span>
                  </div>
                  <button @click="toast(`مسیر یادگیری برای ${st.full_name} تأیید شد`)" class="btn btn-ok btn-sm !min-h-[30px] !text-xs font-bold">
                    <i data-lucide="check" class="w-3.5 h-3.5"></i>
                    <span>تأیید</span>
                  </button>
                </div>
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
                  <i data-lucide="book-open" class="w-3.5 h-3.5"></i>
                  <span>میز کار اختصاصی اساتید تیزهوشان کانون شهید کاظمی آشتیانی</span>
                </div>
                <h3 class="text-lg sm:text-2xl font-black text-ink leading-tight">
                  طراح هوشمند آزمون از کتاب جامع <span class="text-royal">هوش کمپلکس</span>
                </h3>
                <p class="text-xs sm:text-sm text-[#5A6E99] mt-1.5 leading-relaxed">
                  استخراج لحظه‌ای سؤالات از بین ۲۰۱ مبحث استاندارد، انتخاب برگه‌های تست، تنظیم سربرگ رسمی و صدور دفترچه چاپی A4 به همراه پاسخ‌برگ ۴ گزینه‌ای.
                </p>
              </div>

              <!-- Quick Basket Counter Button -->
              <div class="shrink-0 flex items-center gap-2">
                <button 
                  @click="openPrintModal('exam')"
                  :disabled="examBasket.length === 0"
                  class="btn btn-royal text-xs sm:text-sm font-bold flex items-center gap-2 !py-2.5 !px-4 shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  <i data-lucide="printer" class="w-4 h-4"></i>
                  <span>پیش‌نمایش و چاپ آزمون ({{ faNum(examBasket.length) }})</span>
                </button>
              </div>
            </div>

            <!-- 4 Metric Badges -->
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-line text-xs font-bold">
              <div class="p-2.5 rounded-xl bg-white border border-line flex items-center gap-2 text-ink">
                <span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span>۲۰۱ مبحث مستقل</span>
              </div>
              <div class="p-2.5 rounded-xl bg-white border border-line flex items-center gap-2 text-ink">
                <span class="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                <span>۷ بخش استاندارد هوش</span>
              </div>
              <div class="p-2.5 rounded-xl bg-white border border-line flex items-center gap-2 text-ink">
                <span class="w-2.5 h-2.5 rounded-full bg-royal"></span>
                <span>۲۱ فصل طبقه‌بندی‌شده</span>
              </div>
              <div class="p-2.5 rounded-xl bg-white border border-line flex items-center gap-2 text-ink">
                <span class="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                <span>۵۳۷ برگه سؤال باکیفیت</span>
              </div>
            </div>
          </div>

          <!-- 3-Level Cascaded Selectors & Quick Search Filter -->
          <div class="card p-4 sm:p-5 border border-line shadow-sm space-y-3">
            <!-- Search input -->
            <div>
              <label class="lbl flex items-center justify-between">
                <span>جستجوی سریع بین ۲۰۱ مبحث هوش کمپلکس (عنوان، شماره مبحث یا کلمات کلیدی):</span>
                <span v-if="searchQuery" class="text-xs text-[#5A6E99] font-normal">
                  یافت‌شده: {{ faNum(filteredTopics.length) }} مبحث
                </span>
              </label>
              <div class="relative">
                <input 
                  v-model="searchQuery"
                  type="text"
                  placeholder="مثال: مکعب، تقارن، ضرب‌المثل، دنباله، مبحث ۱، کلامی..." 
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
                <select v-model="selectedSectionId" class="input text-xs sm:text-sm">
                  <option value="all">همه بخش‌ها (۷ بخش)</option>
                  <option v-for="sec in hooshSections" :key="sec.id" :value="sec.id">
                    بخش {{ faNum(sec.id) }}: {{ sec.title }} ({{ faNum(sec.count) }} مبحث)
                  </option>
                </select>
              </div>

              <div>
                <label class="lbl">۲. فصل:</label>
                <select v-model="selectedChapterId" class="input text-xs sm:text-sm">
                  <option value="all">همه فصل‌های این بخش</option>
                  <option v-for="ch in availableChapters" :key="ch.id" :value="ch.id">
                    {{ ch.title }} ({{ faNum(ch.count) }} مبحث)
                  </option>
                </select>
              </div>

              <div>
                <label class="lbl">۳. مبحث موردنظر:</label>
                <select v-model="selectedTopicId" class="input text-xs sm:text-sm font-bold text-royal">
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
                    <div class="flex items-center gap-2 mb-1">
                      <span class="tag bg-royal text-white font-extrabold text-xs">
                        مبحث {{ faNum(currentTopic.id) }}
                      </span>
                      <span class="text-xs text-[#5A6E99] font-medium">
                        {{ currentTopic.sectionTitle }} | {{ currentTopic.chapterTitle }}
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
                  :key="page.pdfPage"
                  :class="[
                    'card p-3 sm:p-4 space-y-3 transition-all relative overflow-hidden',
                    isPageInBasket(page.pdfPage) ? 'border-2 border-ok bg-emerald-50/30' : 'border border-line hover:border-royal/50'
                  ]"
                >
                  <!-- Sheet Header -->
                  <div class="flex items-center justify-between text-xs">
                    <span class="tag bg-mist text-ink font-bold">
                      صفحه {{ faNum(page.bookPage) }} کتاب
                    </span>
                    <span 
                      v-if="isPageInBasket(page.pdfPage)"
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
                      :src="`/extracted_pages/page_${page.pdfPage}.jpg`" 
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
                        isPageInBasket(page.pdfPage) ? 'btn-soft text-late' : 'btn-royal'
                      ]"
                    >
                      <i :data-lucide="isPageInBasket(page.pdfPage) ? 'minus-circle' : 'plus-circle'" class="w-4 h-4"></i>
                      <span>{{ isPageInBasket(page.pdfPage) ? 'حذف از آزمون' : 'افزودن به آزمون' }}</span>
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
                      :key="item.pdfPage"
                      class="flex items-center justify-between p-2 rounded-xl bg-mist border border-line text-xs"
                    >
                      <div class="min-w-0 flex-1 pl-2">
                        <p class="font-bold text-ink truncate">صفحه {{ faNum(item.bookPage) }}: {{ item.topicTitle }}</p>
                        <span class="text-[10px] text-[#5A6E99]">مبحث {{ faNum(item.topicId) }}</span>
                      </div>
                      <button 
                        @click="removeFromBasket(item.pdfPage)" 
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
                isPageInBasket(lightboxPage.pdfPage) ? 'btn-soft text-late' : 'btn-royal'
              ]"
            >
              {{ isPageInBasket(lightboxPage.pdfPage) ? 'حذف از آزمون' : 'افزودن به آزمون' }}
            </button>
            <button @click="closeLightbox" class="text-[#5A6E99] hover:text-ink p-1 border-none bg-transparent cursor-pointer">
              <i data-lucide="x" class="w-5 h-5"></i>
            </button>
          </div>
        </div>
        <div class="flex-1 overflow-auto p-2 sm:p-4 flex items-center justify-center bg-mist rounded-xl my-2">
          <img 
            :src="`/extracted_pages/page_${lightboxPage.pdfPage}.jpg`" 
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
              :key="item.pdfPage"
              class="hoosh-print-sheet bg-white text-slate-900 p-6 sm:p-10 mx-auto border border-slate-300 shadow-sm rounded-lg max-w-4xl"
              style="min-height: 280mm; display: flex; flex-direction: column; justify-content: space-between;"
            >
              <!-- Official Header -->
              <div class="pb-3 border-b-2 border-royal mb-4">
                <div class="flex items-center justify-between gap-4">
                  <div class="flex items-center gap-3">
                    <div class="w-12 h-12 rounded-xl bg-royal text-white flex items-center justify-center font-bold text-lg">
                      <span>رشد</span>
                    </div>
                    <div>
                      <h2 class="text-base sm:text-lg font-black text-ink">کانون نخبه‌پروری دانشمند شهید دکتر سعید کاظمی آشتیانی</h2>
                      <p class="text-xs text-slate-600 font-medium">پایگاه علمی تربیتی مسجد ائمه بقیع (ع) تربت حیدریه | طراح آزمون هوش کمپلکس</p>
                    </div>
                  </div>

                  <div class="text-left text-xs space-y-1 font-semibold text-slate-700">
                    <div>تاریخ آزمون: <span class="font-bold text-slate-950">{{ examConfig.date }}</span></div>
                    <div>مدت پاسخگویی: <span class="font-bold text-slate-950">{{ examConfig.duration }}</span></div>
                    <div>صفحه: <span class="font-bold text-royal">{{ faNum(index + 1) }} از {{ faNum(sortedExamBasket.length) }}</span></div>
                  </div>
                </div>

                <!-- Exam Title Bar -->
                <div class="mt-3 pt-2 border-t border-slate-200 flex flex-wrap items-center justify-between text-xs gap-2 bg-slate-50 p-2 rounded">
                  <div class="font-bold text-royal">
                    {{ examConfig.title }} | {{ examConfig.grade }}
                  </div>
                  <div class="text-slate-600">
                    مدرس/طراح: <span class="font-bold text-slate-900">{{ examConfig.teacher }}</span>
                    <span v-if="examConfig.hasNegativeScore" class="text-rose-700 font-bold mr-2">| دارای نمره منفی</span>
                  </div>
                </div>

                <!-- Student Blank Info Box (Page 1 Only) -->
                <div v-if="index === 0" class="mt-2 grid grid-cols-4 gap-2 text-[11px] p-2 border border-slate-300 rounded bg-white">
                  <div>نام و نام خانوادگی: .............................</div>
                  <div>نام کلاس / مدرسه: .............................</div>
                  <div>شماره داوطلب: .............................</div>
                  <div>نمره خام / تراز: .............................</div>
                </div>
              </div>

              <!-- Question Sheet High-Res Image -->
              <div class="flex-1 flex items-center justify-center my-2">
                <img 
                  :src="`/extracted_pages/page_${item.pdfPage}.jpg`" 
                  :alt="`سؤالات صفحه ${item.bookPage}`" 
                  class="max-w-full h-auto object-contain mx-auto border border-slate-200 rounded"
                />
              </div>

              <!-- Page Footer -->
              <div class="pt-3 border-t border-slate-300 flex items-center justify-between text-[11px] text-slate-500">
                <span>مبحث {{ faNum(item.topicId) }}: {{ item.topicTitle }} (صفحه کتاب: {{ faNum(item.bookPage) }})</span>
                <span class="font-medium">«شما آینده‌سازان تمدن نوین اسلامی و فرزندان امیدبخش این آب و خاکید»</span>
                <span>صفحه {{ faNum(index + 1) }}</span>
              </div>
            </div>
          </div>

          <!-- Mode 2: Bubble Answer Sheet -->
          <div v-else-if="printMode === 'answersheet'">
            <div class="hoosh-print-sheet bg-white text-slate-900 p-8 sm:p-12 max-w-4xl mx-auto border border-slate-300 shadow-sm rounded-lg" style="min-height: 280mm; display: flex; flex-direction: column; justify-content: space-between;">
              <div>
                <!-- Header -->
                <div class="pb-4 border-b-2 border-royal mb-6 flex items-center justify-between">
                  <div>
                    <h2 class="text-xl font-black text-ink">پاسخ‌برگ اختصاصی ۴ گزینه‌ای</h2>
                    <p class="text-xs text-slate-600 mt-1">کانون نخبه‌پروری دانشمند شهید دکتر سعید کاظمی آشتیانی تربت حیدریه</p>
                    <p class="text-xs text-royal font-bold mt-1">{{ examConfig.title }} - {{ examConfig.grade }}</p>
                  </div>
                  <div class="text-left text-xs space-y-1">
                    <div>تاریخ برگزاری: <span class="font-bold">{{ examConfig.date }}</span></div>
                    <div>مدت پاسخگویی: <span class="font-bold">{{ examConfig.duration }}</span></div>
                    <div>طراح: <span class="font-bold">{{ examConfig.teacher }}</span></div>
                  </div>
                </div>

                <!-- Student Info Fields -->
                <div class="grid grid-cols-3 gap-4 text-xs p-3 border-2 border-dashed border-slate-300 rounded-lg mb-6 bg-slate-50">
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

    <!-- Hidden Stage for Browser window.print() -->
    <div id="hoosh-print-stage" class="hidden">
      <!-- Mode 1: Exam Print Sheets -->
      <template v-if="printMode === 'exam'">
        <div 
          v-for="(item, index) in sortedExamBasket" 
          :key="item.pdfPage"
          class="hoosh-print-sheet hoosh-print-break bg-white text-slate-900 p-8"
          style="min-height: 280mm; display: flex; flex-direction: column; justify-content: space-between;"
        >
          <!-- Header -->
          <div class="pb-3 border-b-2 border-royal mb-4">
            <div class="flex items-center justify-between gap-4">
              <div class="flex items-center gap-3">
                <div class="w-12 h-12 rounded-xl bg-royal text-white flex items-center justify-center font-bold text-lg">
                  <span>رشد</span>
                </div>
                <div>
                  <h2 class="text-base font-black text-ink">کانون نخبه‌پروری دانشمند شهید دکتر سعید کاظمی آشتیانی</h2>
                  <p class="text-xs text-slate-600 font-medium">پایگاه علمی تربیتی مسجد ائمه بقیع (ع) تربت حیدریه | طراح آزمون هوش کمپلکس</p>
                </div>
              </div>
              <div class="text-left text-xs space-y-1 font-semibold text-slate-700">
                <div>تاریخ آزمون: <span class="font-bold text-slate-950">{{ examConfig.date }}</span></div>
                <div>مدت پاسخگویی: <span class="font-bold text-slate-950">{{ examConfig.duration }}</span></div>
                <div>صفحه: <span class="font-bold text-royal">{{ faNum(index + 1) }} از {{ faNum(sortedExamBasket.length) }}</span></div>
              </div>
            </div>
            <div class="mt-3 pt-2 border-t border-slate-200 flex items-center justify-between text-xs bg-slate-50 p-2 rounded">
              <div class="font-bold text-royal">{{ examConfig.title }} | {{ examConfig.grade }}</div>
              <div class="text-slate-600">
                مدرس/طراح: <span class="font-bold text-slate-900">{{ examConfig.teacher }}</span>
                <span v-if="examConfig.hasNegativeScore" class="text-rose-700 font-bold mr-2">| دارای نمره منفی</span>
              </div>
            </div>
            <div v-if="index === 0" class="mt-2 grid grid-cols-4 gap-2 text-[11px] p-2 border border-slate-300 rounded bg-white">
              <div>نام و نام خانوادگی: .............................</div>
              <div>نام کلاس / مدرسه: .............................</div>
              <div>شماره داوطلب: .............................</div>
              <div>نمره خام / تراز: .............................</div>
            </div>
          </div>

          <!-- Image -->
          <div class="flex-1 flex items-center justify-center my-2">
            <img 
              :src="`/extracted_pages/page_${item.pdfPage}.jpg`" 
              :alt="`سؤالات صفحه ${item.bookPage}`" 
              class="max-w-full h-auto object-contain mx-auto"
            />
          </div>

          <!-- Footer -->
          <div class="pt-3 border-t border-slate-300 flex items-center justify-between text-[11px] text-slate-500">
            <span>مبحث {{ faNum(item.topicId) }}: {{ item.topicTitle }} (صفحه کتاب: {{ faNum(item.bookPage) }})</span>
            <span class="font-medium">«شما آینده‌سازان تمدن نوین اسلامی و فرزندان امیدبخش این آب و خاکید»</span>
            <span>صفحه {{ faNum(index + 1) }}</span>
          </div>
        </div>
      </template>

      <!-- Mode 2: Answersheet Print -->
      <template v-else-if="printMode === 'answersheet'">
        <div class="hoosh-print-sheet bg-white text-slate-900 p-8" style="min-height: 280mm; display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            <div class="pb-4 border-b-2 border-royal mb-6 flex items-center justify-between">
              <div>
                <h2 class="text-xl font-black text-ink">پاسخ‌برگ اختصاصی ۴ گزینه‌ای</h2>
                <p class="text-xs text-slate-600 mt-1">کانون نخبه‌پروری دانشمند شهید دکتر سعید کاظمی آشتیانی تربت حیدریه</p>
                <p class="text-xs text-royal font-bold mt-1">{{ examConfig.title }} - {{ examConfig.grade }}</p>
              </div>
              <div class="text-left text-xs space-y-1">
                <div>تاریخ: <span class="font-bold">{{ examConfig.date }}</span></div>
                <div>مدت: <span class="font-bold">{{ examConfig.duration }}</span></div>
                <div>طراح: <span class="font-bold">{{ examConfig.teacher }}</span></div>
              </div>
            </div>
            <div class="grid grid-cols-3 gap-4 text-xs p-3 border-2 border-dashed border-slate-300 rounded-lg mb-6 bg-slate-50">
              <div>نام و نام خانوادگی: ............................................</div>
              <div>کلاس / شعبه: ............................................</div>
              <div>شماره صندلی / کد: ............................................</div>
            </div>
            <div class="grid grid-cols-4 gap-4 p-4 border border-slate-300 rounded-lg bg-white">
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
import hooshTopicsData from '../data/hoosh_topics.json';

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

watch([activeTab, clsSubTab, hwSubTab, cameraOpen, examSubTab, selectedSectionId, selectedChapterId, selectedTopicId], () => {
  nextTick(() => refreshIcons());
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
    attStudents.value = data.students || [];
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
    toast(`حضور و غیاب ثبت شد و پیامک برای ${faNum(d.sms_count)} غایب ارسال گردید.`);
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


// ----------------- HOOSH COMPLEX EXAM STUDIO -----------------
const examSubTab = ref('hoosh'); // 'hoosh' | 'manual'
const searchQuery = ref('');
const selectedSectionId = ref('all');
const selectedChapterId = ref('all');
const selectedTopicId = ref(1);

const hooshSections = [
  { id: 1, title: 'هوش و استعداد تصویری', count: 43 },
  { id: 2, title: 'هوش و استعداد کلامی', count: 50 },
  { id: 3, title: 'هوش ریاضی', count: 34 },
  { id: 4, title: 'هوش منطقی', count: 31 },
  { id: 5, title: 'هوش فضایی و فنی', count: 13 },
  { id: 6, title: 'سرعت، دقت و تمرکز', count: 27 },
  { id: 7, title: 'خلاقیت', count: 3 }
];

const availableChapters = computed(() => {
  const chaptersMap = new Map();
  hooshTopicsData.forEach(t => {
    if (selectedSectionId.value === 'all' || t.sectionId === Number(selectedSectionId.value)) {
      if (!chaptersMap.has(t.chapterId)) {
        chaptersMap.set(t.chapterId, { id: t.chapterId, title: t.chapterTitle, count: 0 });
      }
      chaptersMap.get(t.chapterId).count++;
    }
  });
  return Array.from(chaptersMap.values());
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

const filteredTopics = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  return hooshTopicsData.filter(t => {
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

const currentTopic = computed(() => {
  return hooshTopicsData.find(t => t.id === Number(selectedTopicId.value)) || hooshTopicsData[0];
});

const currentTopicPages = computed(() => {
  if (!currentTopic.value) return [];
  const list = [];
  const s = currentTopic.value.pdfStartPage;
  const e = currentTopic.value.pdfEndPage;
  const bs = currentTopic.value.bookStartPage;
  for (let p = s; p <= e; p++) {
    list.push({
      pdfPage: p,
      bookPage: bs + (p - s),
      topicId: currentTopic.value.id,
      topicTitle: currentTopic.value.title,
      sectionTitle: currentTopic.value.sectionTitle,
      chapterTitle: currentTopic.value.chapterTitle
    });
  }
  return list;
});

const examBasket = ref([]);
try {
  const saved = localStorage.getItem('roshd_teacher_exam_basket');
  if (saved) examBasket.value = JSON.parse(saved);
} catch (e) {
  examBasket.value = [];
}

function saveBasket() {
  try {
    localStorage.setItem('roshd_teacher_exam_basket', JSON.stringify(examBasket.value));
  } catch (e) {}
}

const sortedExamBasket = computed(() => {
  return [...examBasket.value].sort((a, b) => a.pdfPage - b.pdfPage);
});

function isPageInBasket(pdfPage) {
  return examBasket.value.some(item => item.pdfPage === pdfPage);
}

function togglePageInBasket(pageObj) {
  const idx = examBasket.value.findIndex(item => item.pdfPage === pageObj.pdfPage);
  if (idx >= 0) {
    examBasket.value.splice(idx, 1);
    toast(`برگه صفحه ${faNum(pageObj.bookPage)} از آزمون حذف شد`);
  } else {
    examBasket.value.push({ ...pageObj });
    toast(`برگه صفحه ${faNum(pageObj.bookPage)} به آزمون افزوده شد`);
  }
  saveBasket();
  nextTick(refreshIcons);
}

const currentTopicSelectedPagesCount = computed(() => {
  if (!currentTopic.value) return 0;
  return examBasket.value.filter(item => item.topicId === currentTopic.value.id).length;
});

const areAllCurrentPagesInBasket = computed(() => {
  if (currentTopicPages.value.length === 0) return false;
  return currentTopicPages.value.every(p => isPageInBasket(p.pdfPage));
});

function toggleAllPagesForCurrentTopic() {
  if (areAllCurrentPagesInBasket.value) {
    const tid = currentTopic.value.id;
    examBasket.value = examBasket.value.filter(item => item.topicId !== tid);
    toast(`تمام سؤالات مبحث ${faNum(tid)} از آزمون حذف شدند`);
  } else {
    currentTopicPages.value.forEach(p => {
      if (!isPageInBasket(p.pdfPage)) {
        examBasket.value.push({ ...p });
      }
    });
    toast(`تمام سؤالات مبحث ${faNum(currentTopic.value.id)} به آزمون افزوده شدند`);
  }
  saveBasket();
  nextTick(refreshIcons);
}

function removeFromBasket(pdfPage) {
  examBasket.value = examBasket.value.filter(item => item.pdfPage !== pdfPage);
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

onMounted(() => {
  loadAttendance();
  loadHwReports();
  loadMessages();
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
