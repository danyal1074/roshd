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
      <section v-if="activeTab === 'exam'" class="space-y-4">
        <div class="text-white px-1">
          <h2 class="text-[26px] font-extrabold">آزمون تستی</h2>
          <p class="text-white/80 text-sm">کلید را وارد کن یا پاسخ‌برگ را اسکن کن</p>
        </div>

        <div class="card p-5 space-y-4">
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
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue';
import { faNum, playBeep, refreshIcons } from '../utils';

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

onMounted(() => {
  loadAttendance();
  loadHwReports();
  loadMessages();
  refreshIcons();
});
</script>
