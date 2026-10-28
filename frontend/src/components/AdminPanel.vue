<template>
  <div class="lg:grid lg:grid-cols-[280px_1fr] min-h-screen">
    <!-- Desktop Sidebar (Identical to rosh-step4-admin.html) -->
    <aside class="hidden lg:flex flex-col brand-bg relative text-white p-6 sticky top-0 h-screen overflow-hidden">
      <div class="dots absolute inset-0 opacity-50"></div>
      
      <div class="relative flex items-center gap-3 mb-8">
        <div class="w-14 h-14 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center">
          <i data-lucide="graduation-cap" class="w-7 h-7 text-sun"></i>
        </div>
        <div class="leading-tight">
          <p class="font-extrabold text-base">کانون نخبه‌پروری</p>
          <p class="text-xs text-white/75">شهید کاظم آشتیانی</p>
        </div>
      </div>

      <nav class="relative space-y-1.5 flex-1" aria-label="منوی مدیر">
        <button 
          v-for="item in navItems" 
          :key="item.key"
          @click="activeTab = item.key"
          :class="[
            'side-item',
            activeTab === item.key ? '!bg-white !text-royal shadow-lg font-black' : ''
          ]"
        >
          <i :data-lucide="item.icon" class="w-5 h-5"></i>
          <span>{{ item.label }}</span>
          <span v-if="item.badge && item.badge > 0" class="mr-auto tag bg-sun text-ink !py-0 !px-2 text-xs">
            {{ faNum(item.badge) }}
          </span>
        </button>
      </nav>

      <div class="relative flex items-center justify-between bg-white/10 rounded-2xl p-3">
        <div class="flex items-center gap-2.5">
          <div class="w-10 h-10 rounded-xl bg-sun text-ink font-extrabold flex items-center justify-center text-sm">
            م.ک
          </div>
          <div class="leading-tight">
            <p class="font-bold text-sm">مدیر کانون</p>
            <p class="text-xs text-white/70">پلتفرم رشد</p>
          </div>
        </div>
        <button @click="$emit('logout')" class="text-white/70 hover:text-white p-1" title="خروج">
          <i data-lucide="log-out" class="w-5 h-5"></i>
        </button>
      </div>
    </aside>

    <div class="min-w-0">
      <!-- Mobile Header -->
      <header class="lg:hidden brand-bg relative text-white">
        <div class="dots absolute inset-0 opacity-50"></div>
        <div class="relative px-4 pt-4 pb-20 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center shrink-0">
              <i data-lucide="graduation-cap" class="w-6 h-6 text-sun"></i>
            </div>
            <div class="leading-tight">
              <p class="font-extrabold text-base truncate">کانون نخبه‌پروری شهید کاظم آشتیانی</p>
              <p class="text-white/70 text-xs">پلتفرم رشد، پنل مدیر</p>
            </div>
          </div>
          <button @click="$emit('logout')" class="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center">
            <i data-lucide="log-out" class="w-5 h-5"></i>
          </button>
        </div>
      </header>

      <main class="px-4 lg:px-10 -mt-[64px] lg:mt-0 lg:pt-8 pb-28 lg:pb-12 relative max-w-5xl mx-auto space-y-6">
        <!-- ================= 1. داشبورد (DASHBOARD) ================= -->
        <section v-if="activeTab === 'dash'" class="space-y-6">
          <div class="min-h-[48px]">
            <h2 class="text-[26px] font-extrabold text-white lg:text-ink">داشبورد</h2>
            <p class="text-sm text-white/80 lg:text-[#5A6E99]">دوشنبه ۴ آبان ۱۴۰۵</p>
          </div>

          <!-- 4 KPI Cards (Identical to rosh-step4-admin.html) -->
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div class="card p-5 rise">
              <div class="w-11 h-11 rounded-2xl bg-[#E8F0FF] text-royal flex items-center justify-center">
                <i data-lucide="users" class="w-6 h-6"></i>
              </div>
              <p class="text-[30px] font-extrabold leading-tight mt-3 text-ink">{{ faNum(stats.total_students) }}</p>
              <p class="text-xs text-[#5A6E99]">دانش‌آموز فعال</p>
            </div>

            <div class="card p-5 rise">
              <div class="w-11 h-11 rounded-2xl bg-[#E6F7EE] text-ok flex items-center justify-center">
                <i data-lucide="circle-check" class="w-6 h-6"></i>
              </div>
              <p class="text-[30px] font-extrabold leading-tight mt-3 text-ok">{{ faNum(stats.paid_count) }}</p>
              <p class="text-xs text-[#5A6E99]">پرداخت‌شده</p>
            </div>

            <div class="card p-5 rise">
              <div class="w-11 h-11 rounded-2xl bg-sun/30 text-[#7A5600] flex items-center justify-center">
                <i data-lucide="hourglass" class="w-6 h-6"></i>
              </div>
              <p class="text-[30px] font-extrabold leading-tight mt-3 text-[#7A5600]">{{ faNum(stats.pending_count) }}</p>
              <p class="text-xs text-[#5A6E99]">در انتظار تأیید</p>
            </div>

            <div class="card p-5 rise">
              <div class="w-11 h-11 rounded-2xl bg-[#FDECEC] text-late flex items-center justify-center">
                <i data-lucide="user-x" class="w-6 h-6"></i>
              </div>
              <p class="text-[30px] font-extrabold leading-tight mt-3 text-late">{{ faNum(stats.absent_today) }}</p>
              <p class="text-xs text-[#5A6E99]">غایبان امروز</p>
            </div>
          </div>

          <!-- Stacks & Absentees -->
          <div class="grid lg:grid-cols-5 gap-4">
            <!-- Payment stacks per grade -->
            <div class="card p-5 lg:col-span-3 space-y-4">
              <h3 class="font-extrabold text-[18px]">وضعیت پرداخت هر پایه</h3>
              
              <div class="space-y-4">
                <div v-for="g in feeReports" :key="g.grade" class="space-y-1.5">
                  <div class="flex justify-between text-xs font-bold">
                    <span>پایه {{ g.grade }} ({{ faNum(g.total) }} دانش‌آموز)</span>
                    <span class="text-ok">{{ faNum(g.paid) }} پرداخت‌شده ({{ faNum(g.paid_pct) }}٪)</span>
                  </div>
                  <div class="stack">
                    <span class="bg-ok" :style="{ width: g.paid_pct + '%' }"></span>
                    <span class="bg-sun" :style="{ width: g.pending_pct + '%' }"></span>
                    <span class="bg-late" :style="{ width: g.unpaid_pct + '%' }"></span>
                  </div>
                </div>
              </div>

              <div class="flex gap-4 pt-2 text-xs text-[#5A6E99]">
                <span class="flex items-center gap-1.5"><i class="w-3 h-3 rounded-full bg-ok inline-block"></i> پرداخت‌شده</span>
                <span class="flex items-center gap-1.5"><i class="w-3 h-3 rounded-full bg-sun inline-block"></i> در انتظار</span>
                <span class="flex items-center gap-1.5"><i class="w-3 h-3 rounded-full bg-late inline-block"></i> پرداخت‌نشده</span>
              </div>
            </div>

            <!-- Absentees list -->
            <div class="card p-5 lg:col-span-2 space-y-3">
              <div class="flex items-center justify-between">
                <h3 class="font-extrabold text-[18px]">غایبان امروز</h3>
                <span class="tag bg-[#FDECEC] text-late text-xs">{{ faNum(stats.absent_today) }} نفر</span>
              </div>

              <div class="space-y-2.5 max-h-56 overflow-y-auto">
                <div 
                  v-for="ab in stats.absentees" 
                  :key="ab.id"
                  class="flex items-center justify-between p-2.5 rounded-xl bg-mist text-xs"
                >
                  <div>
                    <p class="font-bold text-ink">{{ ab.full_name }}</p>
                    <p class="text-[#5A6E99]">{{ ab.grade }} {{ ab.class_name }}</p>
                  </div>
                  <span class="tag bg-[#E6F7EE] text-ok text-[11px]">
                    پیامک شد
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Quick Actions -->
          <div class="grid sm:grid-cols-3 gap-3">
            <button @click="activeTab = 'fee'" class="card p-5 flex items-center gap-4 text-start hover:shadow-md transition-all">
              <div class="w-12 h-12 rounded-2xl bg-sun text-ink flex items-center justify-center shrink-0">
                <i data-lucide="receipt" class="w-6 h-6"></i>
              </div>
              <div>
                <p class="font-extrabold text-base">{{ faNum(stats.pending_count) }} رسید منتظر توست</p>
                <p class="text-xs text-[#5A6E99]">بررسی و تأیید</p>
              </div>
            </button>

            <button @click="activeTab = 'ann'" class="card p-5 flex items-center gap-4 text-start hover:shadow-md transition-all">
              <div class="w-12 h-12 rounded-2xl text-white flex items-center justify-center shrink-0" style="background:linear-gradient(135deg,#1E90FF,#0A4BD6)">
                <i data-lucide="megaphone" class="w-6 h-6"></i>
              </div>
              <div>
                <p class="font-extrabold text-base">اطلاعیه جدید</p>
                <p class="text-xs text-[#5A6E99]">برای همه یا چند کلاس</p>
              </div>
            </button>

            <button @click="activeTab = 'exm'" class="card p-5 flex items-center gap-4 text-start hover:shadow-md transition-all">
              <div class="w-12 h-12 rounded-2xl bg-[#E6F7EE] text-ok flex items-center justify-center shrink-0">
                <i data-lucide="trophy" class="w-6 h-6"></i>
              </div>
              <div>
                <p class="font-extrabold text-base">آزمون جامع</p>
                <p class="text-xs text-[#5A6E99]">رتبه‌بندی لحظه‌ای</p>
              </div>
            </button>
          </div>
        </section>

        <!-- ================= 2. دانش‌آموزان (STUDENTS - 450 USERS) ================= -->
        <section v-if="activeTab === 'stu'" class="space-y-4">
          <div class="min-h-[48px] flex items-center justify-between">
            <div>
              <h2 class="text-[26px] font-extrabold text-white lg:text-ink">دانش‌آموزان</h2>
              <p class="text-sm text-white/80 lg:text-[#5A6E99]">{{ faNum(totalStudentsCount) }} دانش‌آموز ثبت‌شده</p>
            </div>
            <div class="flex items-center gap-2">
              <button @click="openImportModal = true" class="btn btn-soft font-bold text-xs sm:text-sm !min-h-[42px]">
                <i data-lucide="file-spreadsheet" class="w-4 h-4"></i>
                <span>ورود اکسل/CSV</span>
              </button>
              <button @click="openRegModal = true" class="btn btn-sun font-black text-xs sm:text-sm !min-h-[42px]">
                <i data-lucide="user-plus" class="w-5 h-5"></i>
                <span>ثبت‌نام تکی</span>
              </button>
            </div>
          </div>

          <!-- Search & Filter Card -->
          <div class="card p-4 space-y-3">
            <div class="relative">
              <i data-lucide="search" class="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8AA0CC]"></i>
              <input 
                v-model="studentSearch" 
                @input="searchStudents"
                class="input !pr-12" 
                placeholder="جستجوی نام یا کد ملی" 
              />
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <select v-model="filterGrade" @change="searchStudents" class="input !px-3 !pl-8 text-xs font-bold" aria-label="پایه">
                <option value="">همه پایه‌ها</option>
                <option value="هفتم">هفتم</option>
                <option value="هشتم">هشتم</option>
                <option value="نهم">نهم</option>
              </select>
              <select v-model="filterClass" @change="searchStudents" class="input !px-3 !pl-8 text-xs font-bold" aria-label="کلاس">
                <option value="">همه کلاس‌ها</option>
                <option value="الف">الف</option>
                <option value="ب">ب</option>
              </select>
              <select v-model="filterSchool" @change="searchStudents" class="input !px-3 !pl-8 text-xs font-bold" aria-label="مدرسه">
                <option value="">همه مدرسه‌ها</option>
                <option value="شهید بهشتی">شهید بهشتی</option>
                <option value="فرزانگان">فرزانگان</option>
                <option value="امام خمینی">امام خمینی</option>
              </select>
            </div>
          </div>

          <!-- Students Directory List -->
          <div class="space-y-2.5">
            <div 
              v-for="st in studentsList" 
              :key="st.id" 
              class="card p-4 flex items-center justify-between gap-3 text-sm"
            >
              <div class="min-w-0">
                <p class="font-extrabold text-ink truncate">{{ st.full_name }}</p>
                <div class="flex flex-wrap gap-2 text-xs text-[#5A6E99] mt-0.5">
                  <span>کد ملی: <b dir="ltr">{{ st.national_id }}</b></span>
                  <span>|</span>
                  <span>{{ st.grade }} {{ st.class_name }}</span>
                  <span>|</span>
                  <span>{{ st.school_name }}</span>
                </div>
              </div>

              <div class="flex items-center gap-2 shrink-0">
                <span 
                  :class="[
                    'tag text-xs font-bold',
                    st.fee_status === 'paid' ? 'bg-[#E6F7EE] text-ok' : (st.fee_status === 'pending' ? 'bg-sun/30 text-[#7A5600]' : 'bg-[#FDECEC] text-late')
                  ]"
                >
                  {{ st.fee_status === 'paid' ? 'پرداخت‌شده' : (st.fee_status === 'pending' ? 'در انتظار' : 'پرداخت‌نشده') }}
                </span>
                <span class="tag bg-mist text-royal font-black text-xs">
                  {{ faNum(st.total_points) }} امتیاز
                </span>
                <button @click="resetStudentPassword(st)" class="text-royal hover:bg-blue-50 p-2 rounded-xl text-sm" title="بازنشانی رمز عبور">
                  <i data-lucide="key-round" class="w-4 h-4"></i>
                </button>
                <button @click="deleteStudent(st.id)" class="text-late hover:bg-red-50 p-2 rounded-xl text-sm" title="غیرفعال‌سازی پرونده">
                  <i data-lucide="trash-2" class="w-4 h-4"></i>
                </button>
              </div>
            </div>
          </div>

          <!-- Pagination -->
          <div class="flex items-center justify-between text-xs text-[#5A6E99] pt-2">
            <span>نمایش {{ faNum(studentsList.length) }} از {{ faNum(totalStudentsCount) }} دانش‌آموز</span>
            <div class="flex gap-2">
              <button 
                @click="currentPage--; searchStudents()" 
                :disabled="currentPage <= 1"
                class="btn btn-soft btn-sm !min-h-[36px]"
              >
                صفحه قبل
              </button>
              <span class="px-3 py-2 rounded-xl bg-white border border-line font-bold">
                صفحه {{ faNum(currentPage) }}
              </span>
              <button 
                @click="currentPage++; searchStudents()" 
                :disabled="studentsList.length < 50"
                class="btn btn-soft btn-sm !min-h-[36px]"
              >
                صفحه بعد
              </button>
            </div>
          </div>
        </section>

        <!-- ================= 3. حق عضویت (FEES & RECEIPTS) ================= -->
        <section v-if="activeTab === 'fee'" class="space-y-4">
          <div class="min-h-[48px]">
            <h2 class="text-[26px] font-extrabold text-white lg:text-ink">حق عضویت</h2>
            <p class="text-sm text-white/80 lg:text-[#5A6E99]">مبلغ، رسیدها و گزارش کلاس‌ها</p>
          </div>

          <div class="seg-ctl">
            <button @click="feeSubTab = 'def'" :aria-pressed="feeSubTab === 'def'">تعریف مبلغ</button>
            <button @click="feeSubTab = 'rec'" :aria-pressed="feeSubTab === 'rec'">
              رسیدها <span class="tag bg-sun text-ink !py-0 mr-1 text-xs">{{ faNum(pendingReceiptsCount) }}</span>
            </button>
            <button @click="feeSubTab = 'rep'" :aria-pressed="feeSubTab === 'rep'">گزارش کلاس</button>
          </div>

          <!-- Define Fees -->
          <div v-if="feeSubTab === 'def'" class="space-y-3">
            <div class="grid lg:grid-cols-3 gap-3">
              <div v-for="f in feeDefs" :key="f.grade" class="card p-5 space-y-3">
                <span class="tag bg-mist text-royal font-bold text-xs">پایه {{ f.grade }}</span>
                <div>
                  <label class="lbl">مبلغ شهریه (تومان)</label>
                  <input type="number" v-model.number="f.amount" class="input font-black" />
                </div>
                <div>
                  <label class="lbl">مهلت پرداخت</label>
                  <input v-model="f.deadline_fa" class="input text-xs" />
                </div>
                <div>
                  <label class="lbl">تاریخ قفل پنل</label>
                  <input v-model="f.lock_date_fa" class="input text-xs" />
                </div>
              </div>
            </div>

            <button @click="saveFeeDefs" class="btn btn-royal">
              <i data-lucide="save" class="w-5 h-5"></i>
              <span>ذخیره تنظیمات</span>
            </button>
          </div>

          <!-- Receipts Queue -->
          <div v-if="feeSubTab === 'rec'" class="space-y-3">
            <div 
              v-for="rec in receiptsList" 
              :key="rec.id" 
              class="card p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div>
                <div class="flex items-center gap-2">
                  <h4 class="font-extrabold text-base text-ink">{{ rec.student_name }}</h4>
                  <span class="tag bg-mist text-royal text-xs">{{ rec.grade }} {{ rec.class_name }}</span>
                </div>
                <div class="flex flex-wrap gap-2 text-xs text-[#5A6E99] mt-1.5">
                  <span>مبلغ: <b class="text-royal font-bold">{{ money(rec.amount) }} تومان</b></span>
                  <span>|</span>
                  <span>کد پیگیری: <b dir="ltr">{{ rec.tracking_code }}</b></span>
                  <span>|</span>
                  <span>تاریخ: {{ rec.date_fa }}</span>
                </div>
                <p v-if="rec.reject_reason" class="text-xs text-late font-bold mt-1.5">
                  علت رد: {{ rec.reject_reason }}
                </p>
              </div>

              <div class="flex gap-2 shrink-0">
                <span v-if="rec.status === 'approved'" class="tag bg-[#E6F7EE] text-ok font-bold">
                  تأیید شده
                </span>
                <span v-else-if="rec.status === 'rejected'" class="tag bg-[#FDECEC] text-late font-bold">
                  رد شده
                </span>
                <template v-else>
                  <button @click="approveReceipt(rec.id)" class="btn btn-ok btn-sm font-bold">
                    <i data-lucide="check" class="w-4 h-4"></i>
                    <span>تأیید</span>
                  </button>
                  <button @click="startReject(rec)" class="btn btn-bad btn-sm font-bold">
                    <i data-lucide="x" class="w-4 h-4"></i>
                    <span>رد فیش</span>
                  </button>
                </template>
              </div>
            </div>
          </div>

          <!-- Class Reports -->
          <div v-if="feeSubTab === 'rep'" class="grid lg:grid-cols-2 gap-3">
            <div v-for="g in feeReports" :key="g.grade" class="card p-5 space-y-3">
              <h4 class="font-extrabold text-[18px]">گزارش پایه {{ g.grade }}</h4>
              <div class="grid grid-cols-3 gap-2 text-center text-xs">
                <div class="p-3 bg-[#E6F7EE] rounded-2xl">
                  <p class="text-[#5A6E99]">پرداخت‌شده</p>
                  <p class="text-xl font-black text-ok">{{ faNum(g.paid) }}</p>
                </div>
                <div class="p-3 bg-sun/20 rounded-2xl">
                  <p class="text-[#5A6E99]">در انتظار</p>
                  <p class="text-xl font-black text-[#7A5600]">{{ faNum(g.pending) }}</p>
                </div>
                <div class="p-3 bg-[#FDECEC] rounded-2xl">
                  <p class="text-[#5A6E99]">پرداخت‌نشده</p>
                  <p class="text-xl font-black text-late">{{ faNum(g.unpaid) }}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- ================= 3.5. تنظیمات سامانه و مشخصات پرداخت شهریه (SYSTEM & TUITION SETTINGS) ================= -->
        <section v-if="activeTab === 'settings'" class="space-y-4">
          <div class="min-h-[48px] flex items-center justify-between">
            <div>
              <h2 class="text-[26px] font-extrabold text-white lg:text-ink">تنظیمات سامانه و پرداخت</h2>
              <p class="text-sm text-white/80 lg:text-[#5A6E99]">مدیریت شماره کارت، حساب بانکی، مبالغ شهریه و مشخصات آموزشگاه</p>
            </div>
            <button @click="saveAllSettings" :disabled="savingSettings" class="btn btn-sun font-black text-sm shadow-md">
              <i data-lucide="save" class="w-5 h-5"></i>
              <span>{{ savingSettings ? 'در حال ذخیره...' : 'ذخیره تمام تنظیمات' }}</span>
            </button>
          </div>

          <!-- Live Card Preview & Quick Stats -->
          <div class="grid lg:grid-cols-3 gap-4">
            <!-- Iranian Bank Card Live Preview Widget -->
            <div class="card p-5 relative overflow-hidden text-white flex flex-col justify-between min-h-[190px]" style="background: linear-gradient(135deg, #0A4BD6 0%, #082977 50%, #051846 100%);">
              <div class="dots absolute inset-0 opacity-40 pointer-events-none"></div>
              <div class="relative flex items-center justify-between">
                <div>
                  <span class="text-[10px] text-white/70 block">پیش‌نمایش کارت بانکی کانون</span>
                  <p class="font-black text-sm text-sun">{{ sysSettings.bank_name || 'بانک ملی ایران' }}</p>
                </div>
                <div class="w-9 h-7 rounded-md bg-amber-400/80 border border-amber-200/50 flex items-center justify-center text-[9px] font-black text-ink shadow">
                  CHIP
                </div>
              </div>

              <div class="relative text-center my-2">
                <p class="text-lg sm:text-xl font-extrabold tracking-[0.2em] font-mono select-all" dir="ltr">
                  {{ sysSettings.card_number || '۶۰۳۷-۹۹۷۰-۰۰۰۰-۰۰۰۰' }}
                </p>
              </div>

              <div class="relative flex items-end justify-between text-xs text-white/90">
                <div>
                  <span class="text-[9px] text-white/60 block">صاحب حساب</span>
                  <p class="font-bold">{{ sysSettings.card_holder || 'کانون نخبه‌پروری آشتیانی' }}</p>
                </div>
                <div class="text-left" dir="ltr">
                  <span class="text-[9px] text-white/60 block text-right" dir="rtl">شماره شبا</span>
                  <p class="text-[10px] font-mono tracking-wider">{{ sysSettings.shaba_number || 'IR000000000000000000000000' }}</p>
                </div>
              </div>
            </div>

            <!-- Tuition Policy Summary Card -->
            <div class="card p-5 lg:col-span-2 flex flex-col justify-between">
              <div>
                <div class="flex items-center gap-2 mb-2">
                  <i data-lucide="shield-check" class="w-5 h-5 text-royal"></i>
                  <h3 class="font-extrabold text-base text-ink">سیاست پرداخت شهریه و قفل هوشمند</h3>
                </div>
                <p class="text-xs text-[#5A6E99] leading-relaxed">
                  اطلاعات حساب بانکی واردشده در این بخش مستقیماً در درگاه واریز و صفحه ثبت فیش دانش‌آموزان و اولیا نمایش داده می‌شود. با تنظیم تاریخ قفل پنل برای هر پایه، دانش‌آموزانی که تا سررسید اقدام به تسویه نکنند با پیام اختصاصی هدایت به واریز مواجه خواهند شد.
                </p>
              </div>
              <div class="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-line text-center text-xs">
                <div class="p-2.5 bg-mist rounded-xl">
                  <span class="text-[#5A6E99] block text-[10px]">پایه هفتم</span>
                  <b class="text-royal">{{ money(feeDefs.find(f => f.grade === 'هفتم')?.amount || 1500000) }} تومان</b>
                </div>
                <div class="p-2.5 bg-mist rounded-xl">
                  <span class="text-[#5A6E99] block text-[10px]">پایه هشتم</span>
                  <b class="text-royal">{{ money(feeDefs.find(f => f.grade === 'هشتم')?.amount || 1650000) }} تومان</b>
                </div>
                <div class="p-2.5 bg-mist rounded-xl">
                  <span class="text-[#5A6E99] block text-[10px]">پایه نهم</span>
                  <b class="text-royal">{{ money(feeDefs.find(f => f.grade === 'نهم')?.amount || 1800000) }} تومان</b>
                </div>
              </div>
            </div>
          </div>

          <!-- Main Settings Form Tabs / Panels -->
          <div class="grid lg:grid-cols-2 gap-4">
            <!-- 1. Bank Account Details -->
            <div class="card p-5 space-y-3.5">
              <h3 class="font-extrabold text-base text-ink flex items-center gap-2 border-b border-line pb-2.5">
                <i data-lucide="credit-card" class="w-5 h-5 text-royal"></i>
                <span>مشخصات حساب و واریز شهریه</span>
              </h3>

              <div>
                <label class="lbl">شماره کارت بانکی (۱۶ رقمی)</label>
                <input v-model="sysSettings.card_number" class="input font-mono font-bold text-left" dir="ltr" placeholder="۶۰۳۷-۹۹۷۰-۰۰۰۰-۰۰۰۰" />
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="lbl">نام صاحب حساب</label>
                  <input v-model="sysSettings.card_holder" class="input text-xs font-bold" placeholder="کانون نخبه‌پروری آشتیانی" />
                </div>
                <div>
                  <label class="lbl">نام بانک</label>
                  <input v-model="sysSettings.bank_name" class="input text-xs font-bold" placeholder="بانک ملی ایران" />
                </div>
              </div>

              <div>
                <label class="lbl">شماره شبا (با IR)</label>
                <input v-model="sysSettings.shaba_number" class="input font-mono text-xs text-left" dir="ltr" placeholder="IR000000000000000000000000" />
              </div>

              <div>
                <label class="lbl">قوانین و راهنمای پرداخت شهریه برای دانش‌آموزان</label>
                <textarea v-model="sysSettings.tuition_rules" class="input !h-20 text-xs py-2 leading-relaxed" placeholder="متن توضیحات و ضوابط تسویه شهریه"></textarea>
              </div>
            </div>

            <!-- 2. Organization & School Branding -->
            <div class="card p-5 space-y-3.5">
              <h3 class="font-extrabold text-base text-ink flex items-center gap-2 border-b border-line pb-2.5">
                <i data-lucide="building" class="w-5 h-5 text-royal"></i>
                <span>مشخصات کانون و آموزشگاه</span>
              </h3>

              <div>
                <label class="lbl">نام کانون / مرکز آموزشی</label>
                <input v-model="sysSettings.brand_name" class="input text-xs font-bold" placeholder="کانون نخبه‌پروری شهید کاظم آشتیانی" />
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="lbl">نام پلتفرم</label>
                  <input v-model="sysSettings.platform_name" class="input text-xs font-bold" placeholder="پلتفرم رشد" />
                </div>
                <div>
                  <label class="lbl">تلفن تماس و پشتیبانی</label>
                  <input v-model="sysSettings.contact_phone" class="input text-xs font-mono text-left" dir="ltr" placeholder="۰۲۱-۸۸۸۸۴۴۲۲" />
                </div>
              </div>

              <div>
                <label class="lbl">شعار یا زیرعنوان سامانه</label>
                <input v-model="sysSettings.slogan" class="input text-xs" placeholder="سامانه جامع مدیریت آموزشی و نخبه‌پروری" />
              </div>

              <div>
                <label class="lbl">نشانی فیزیکی آموزشگاه</label>
                <input v-model="sysSettings.address" class="input text-xs" placeholder="تهران، خیابان آزادی، پلاک ۱۲" />
              </div>

              <div>
                <label class="lbl">مبلغ اشتراک سالانه سامانه رشد (تومان)</label>
                <input type="number" v-model.number="sysSettings.platform_fee_amount" class="input text-xs font-black" placeholder="150000" />
              </div>
            </div>
          </div>

          <!-- 3. Per-Grade Fee Definitions & Access Lock Control -->
          <div class="card p-5 space-y-4">
            <div class="flex items-center justify-between border-b border-line pb-2.5">
              <h3 class="font-extrabold text-base text-ink flex items-center gap-2">
                <i data-lucide="sliders-horizontal" class="w-5 h-5 text-royal"></i>
                <span>تعرفه‌های شهریه و وضعیت قفل پنل بر اساس پایه</span>
              </h3>
              <span class="text-xs text-[#5A6E99]">کنترل دسترسی خودکار</span>
            </div>

            <div class="grid lg:grid-cols-3 gap-3.5">
              <div v-for="f in feeDefs" :key="f.grade" class="p-4 rounded-2xl border border-line bg-mist/40 space-y-3">
                <div class="flex items-center justify-between">
                  <span class="tag bg-royal text-white font-extrabold text-xs">پایه {{ f.grade }}</span>
                  <label class="flex items-center gap-1.5 text-xs font-bold cursor-pointer select-none">
                    <input type="checkbox" :checked="f.is_locked === 1" @change="f.is_locked = $event.target.checked ? 1 : 0" class="rounded accent-royal w-4 h-4 cursor-pointer" />
                    <span>قفل دسترسی فعال</span>
                  </label>
                </div>

                <div>
                  <label class="lbl">مبلغ شهریه (تومان)</label>
                  <input type="number" v-model.number="f.amount" class="input font-black text-sm" />
                </div>

                <div class="grid grid-cols-2 gap-2">
                  <div>
                    <label class="lbl">مهلت پرداخت</label>
                    <input v-model="f.deadline_fa" class="input text-xs text-center" />
                  </div>
                  <div>
                    <label class="lbl">تاریخ قفل پنل</label>
                    <input v-model="f.lock_date_fa" class="input text-xs text-center" />
                  </div>
                </div>
              </div>
            </div>

            <div class="flex items-center justify-end pt-2">
              <button @click="saveAllSettings" :disabled="savingSettings" class="btn btn-royal font-black text-sm shadow-md">
                <i data-lucide="check-check" class="w-5 h-5"></i>
                <span>{{ savingSettings ? 'در حال ثبت...' : 'ذخیره تمام تغییرات و به‌روزرسانی پنل‌ها' }}</span>
              </button>
            </div>
          </div>
        </section>

        <!-- ================= 4. اطلاعیه‌ها (ANNOUNCEMENTS) ================= -->
        <section v-if="activeTab === 'ann'" class="space-y-4">
          <div class="min-h-[48px]">
            <h2 class="text-[26px] font-extrabold text-white lg:text-ink">اطلاعیه</h2>
            <p class="text-sm text-white/80 lg:text-[#5A6E99]">بنویس و ببین چه کسانی دیده‌اند</p>
          </div>

          <div class="seg-ctl lg:max-w-md">
            <button @click="annSubTab = 'new'" :aria-pressed="annSubTab === 'new'">اطلاعیه جدید</button>
            <button @click="annSubTab = 'rep'" :aria-pressed="annSubTab === 'rep'">گزارش دیده‌شده</button>
          </div>

          <!-- Create Notice -->
          <div v-if="annSubTab === 'new'" class="card p-5 space-y-4 lg:max-w-2xl">
            <div>
              <label class="lbl">عنوان</label>
              <input v-model="newAnn.title" class="input" placeholder="مثلاً تغییر ساعت کلاس" required />
            </div>

            <div>
              <label class="lbl">متن اطلاعیه</label>
              <textarea v-model="newAnn.body" class="input !h-32 py-3" placeholder="متن را کوتاه و روشن بنویس" required></textarea>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="lbl">مخاطبان</label>
                <select v-model="newAnn.target_audience" class="input text-xs font-bold">
                  <option value="all">همه دانش‌آموزان (۴۵۰ نفر)</option>
                  <option value="هفتم">پایه هفتم (۱۵۰ نفر)</option>
                  <option value="هشتم">پایه هشتم (۱۵۰ نفر)</option>
                  <option value="نهم">پایه نهم (۱۵۰ نفر)</option>
                </select>
              </div>
              <div>
                <label class="lbl">برچسب</label>
                <select v-model="newAnn.tag" class="input text-xs font-bold">
                  <option>مهم</option>
                  <option>فوری</option>
                  <option>اطلاع‌رسانی</option>
                </select>
              </div>
            </div>

            <button @click="createNotice" class="btn btn-royal w-full">
              <i data-lucide="send" class="w-5 h-5"></i>
              <span>ارسال اطلاعیه</span>
            </button>
          </div>

          <!-- Notice Reports -->
          <div v-if="annSubTab === 'rep'" class="space-y-3">
            <div 
              v-for="an in noticeReports" 
              :key="an.id" 
              class="card p-5 space-y-3"
            >
              <div class="flex items-start justify-between">
                <div>
                  <span class="tag bg-mist text-royal text-xs">{{ an.tag }} - {{ an.target_audience === 'all' ? 'کل کانون' : an.target_audience }}</span>
                  <h3 class="font-extrabold text-base mt-1.5">{{ an.title }}</h3>
                </div>
                <span class="tag bg-[#E6F7EE] text-ok font-black text-xs">
                  {{ faNum(an.seen_count) }} نفر دیده‌اند
                </span>
              </div>

              <div class="bar">
                <span :style="{ width: Math.round((an.seen_count / (an.total_audience || 1)) * 100) + '%' }"></span>
              </div>

              <div class="flex justify-between text-xs text-[#5A6E99] pt-1">
                <span>دیده‌نشده: {{ faNum(an.unseen_count) }} نفر</span>
                <span>تاریخ: {{ an.date_fa }}</span>
              </div>
            </div>
          </div>
        </section>

        <!-- ================= 5. حسابداری (ACCOUNTING & LEDGER) ================= -->
        <section v-if="activeTab === 'acc'" class="space-y-4">
          <div class="min-h-[48px]">
            <h2 class="text-[26px] font-extrabold text-white lg:text-ink">حسابداری</h2>
            <p class="text-sm text-white/80 lg:text-[#5A6E99]">دفتر واریزها، هزینه‌ها و نمودار مالی</p>
          </div>

          <!-- Summary Cards (rosh-step4-admin.html) -->
          <div class="grid grid-cols-3 gap-3">
            <div class="card p-4">
              <p class="text-xs text-[#5A6E99] flex items-center gap-1.5 font-bold">
                <i data-lucide="arrow-down-to-line" class="w-4 h-4 text-ok"></i>
                <span>درآمد</span>
              </p>
              <p class="text-lg lg:text-2xl font-black mt-1 text-ok">{{ money(accData.total_income) }} <span class="text-xs">تومان</span></p>
            </div>

            <div class="card p-4">
              <p class="text-xs text-[#5A6E99] flex items-center gap-1.5 font-bold">
                <i data-lucide="arrow-up-from-line" class="w-4 h-4 text-late"></i>
                <span>هزینه</span>
              </p>
              <p class="text-lg lg:text-2xl font-black mt-1 text-late">{{ money(accData.total_expense) }} <span class="text-xs">تومان</span></p>
            </div>

            <div class="card p-4">
              <p class="text-xs text-[#5A6E99] flex items-center gap-1.5 font-bold">
                <i data-lucide="scale" class="w-4 h-4 text-royal"></i>
                <span>مانده</span>
              </p>
              <p class="text-lg lg:text-2xl font-black mt-1 text-royal">{{ money(accData.net_balance) }} <span class="text-xs">تومان</span></p>
            </div>
          </div>

          <!-- Chart & Expense Recording -->
          <div class="grid lg:grid-cols-5 gap-4">
            <!-- Revenue vs Expense Chart -->
            <div class="card p-5 lg:col-span-3 space-y-4">
              <div class="flex items-center justify-between">
                <h3 class="font-extrabold text-[18px]">درآمد در برابر هزینه</h3>
                <div class="flex gap-3 text-xs text-[#5A6E99]">
                  <span class="flex items-center gap-1.5"><i class="w-3 h-3 rounded-full bg-royal inline-block"></i> درآمد</span>
                  <span class="flex items-center gap-1.5"><i class="w-3 h-3 rounded-full bg-sun inline-block"></i> هزینه</span>
                </div>
              </div>

              <!-- Bar Chart -->
              <div class="flex items-end justify-between gap-2 h-44 pt-6 border-b border-line px-2">
                <div 
                  v-for="c in accData.chart" 
                  :key="c.label"
                  class="flex-1 flex flex-col items-center gap-1 h-full justify-end"
                >
                  <div class="w-full flex justify-center gap-1 items-end h-full">
                    <div 
                      class="w-3 sm:w-4 bg-royal rounded-t-lg transition-all" 
                      :style="{ height: Math.min(100, Math.round((c.income / 6000000) * 100)) + '%' }"
                    ></div>
                    <div 
                      class="w-3 sm:w-4 bg-sun rounded-t-lg transition-all" 
                      :style="{ height: Math.min(100, Math.round((c.expense / 6000000) * 100)) + '%' }"
                    ></div>
                  </div>
                  <span class="text-[10px] text-[#5A6E99] whitespace-nowrap">{{ c.label }}</span>
                </div>
              </div>
            </div>

            <!-- Expense Form -->
            <div class="card p-5 lg:col-span-2 space-y-3">
              <h3 class="font-extrabold text-[18px] flex items-center gap-2">
                <i data-lucide="circle-plus" class="w-5 h-5 text-royal"></i>
                <span>ثبت هزینه</span>
              </h3>
              <div>
                <label class="lbl">مبلغ (تومان)</label>
                <input type="number" v-model.number="newExpense.amount" class="input font-bold" placeholder="مثلاً ۲٬۵۰۰٬۰۰۰" required />
              </div>
              <div>
                <label class="lbl">شرح</label>
                <input v-model="newExpense.title" class="input text-xs" placeholder="مثلاً چاپ جزوه" required />
              </div>
              <div>
                <label class="lbl">دسته‌بندی</label>
                <select v-model="newExpense.category" class="input text-xs font-bold">
                  <option>چاپ و تکثیر</option>
                  <option>پذیرایی و جوایز</option>
                  <option>سامانه پیامک و سرور</option>
                  <option>حق‌التدریس دبیران</option>
                </select>
              </div>
              <button @click="createExpense" class="btn btn-royal w-full">
                <i data-lucide="plus" class="w-5 h-5"></i>
                <span>ثبت هزینه</span>
              </button>
            </div>
          </div>

          <!-- Ledger Table -->
          <div class="card overflow-hidden">
            <div class="px-5 py-4 border-b border-line flex items-center justify-between">
              <h3 class="font-extrabold text-[18px]">دفتر واریزها و هزینه‌ها</h3>
              <span class="tag bg-[#E3ECFF] text-royal text-xs font-bold">{{ faNum(ledgerList.length) }} تراکنش</span>
            </div>
            <div class="divide-y divide-line max-h-72 overflow-y-auto">
              <div 
                v-for="l in ledgerList" 
                :key="l.id"
                class="px-5 py-3.5 flex items-center justify-between text-sm"
              >
                <div>
                  <p class="font-bold text-ink">{{ l.title }}</p>
                  <p class="text-xs text-[#5A6E99]">{{ l.date_fa }} - {{ l.category }}</p>
                </div>
                <span 
                  :class="[
                    'font-black text-sm',
                    l.type === 'income' ? 'text-ok' : 'text-late'
                  ]"
                >
                  {{ l.type === 'income' ? '+' : '-' }}{{ money(l.amount) }} تومان
                </span>
              </div>
            </div>
          </div>
        </section>

        <!-- ================= 6. آزمون جامع (COMPREHENSIVE EXAM & QR PRINT) ================= -->
        <section v-if="activeTab === 'exm'" class="space-y-4">
          <div class="min-h-[48px] flex items-center justify-between">
            <div>
              <h2 class="text-[26px] font-extrabold text-white lg:text-ink">آزمون جامع</h2>
              <p class="text-sm text-white/80 lg:text-[#5A6E99] flex items-center gap-2">
                <span class="live"></span> نتایج لحظه‌ای تمام ۴۵۰ دانش‌آموز
              </p>
            </div>
            <button @click="openQrModal = true" class="btn btn-sun font-black text-sm">
              <i data-lucide="qr-code" class="w-5 h-5"></i>
              <span>چاپ QR</span>
            </button>
          </div>

          <!-- Leaderboard Table -->
          <div class="card overflow-hidden">
            <div class="divide-y divide-line max-h-[500px] overflow-y-auto">
              <div 
                v-for="st in comprehensiveRankings" 
                :key="st.id" 
                class="px-5 py-3.5 flex items-center justify-between gap-3 text-sm"
              >
                <div class="flex items-center gap-3">
                  <div 
                    :class="[
                      'w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shrink-0',
                      st.rank === 1 ? 'bg-sun text-ink' : (st.rank === 2 ? 'bg-gray-200 text-ink' : (st.rank === 3 ? 'bg-amber-100 text-[#7A5600]' : 'bg-mist text-[#5A6E99]'))
                    ]"
                  >
                    {{ faNum(st.rank) }}
                  </div>
                  <div>
                    <p class="font-bold text-ink">{{ st.full_name }}</p>
                    <p class="text-xs text-[#5A6E99]">{{ st.grade }} {{ st.class_name }} - {{ st.school_name }}</p>
                  </div>
                </div>

                <div class="flex items-center gap-4">
                  <div class="text-left">
                    <p class="text-xs text-[#5A6E99]">نمره</p>
                    <p class="font-black text-ok text-base">{{ faNum(st.score) }}٪</p>
                  </div>
                  <div class="text-left">
                    <p class="text-xs text-[#5A6E99]">امتیاز کل</p>
                    <p class="font-black text-royal text-base">{{ faNum(st.total_points) }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>

    <!-- ================= MODALS ================= -->
    <!-- Student Registration Modal -->
    <div v-if="openRegModal" class="fixed inset-0 z-[60] bg-ink/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div class="w-full sm:max-w-xl bg-white rounded-t-[28px] sm:rounded-[28px] p-6 max-h-[92vh] overflow-y-auto rise space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="text-xl font-extrabold">ثبت‌نام دانش‌آموز</h3>
          <button @click="openRegModal = false" class="w-10 h-10 rounded-xl bg-mist flex items-center justify-center">
            <i data-lucide="x" class="w-5 h-5"></i>
          </button>
        </div>

        <form @submit.prevent="registerStudent" class="grid grid-cols-2 gap-3 text-sm">
          <div>
            <label class="lbl">نام</label>
            <input v-model="newStudent.first_name" class="input" required />
          </div>
          <div>
            <label class="lbl">نام خانوادگی</label>
            <input v-model="newStudent.last_name" class="input" required />
          </div>
          <div class="col-span-2">
            <label class="lbl">کد ملی</label>
            <input v-model="newStudent.national_id" class="input" maxlength="10" placeholder="۱۰ رقم" required />
          </div>
          <div class="col-span-2">
            <label class="lbl">نشانی منزل</label>
            <input v-model="newStudent.address" class="input" placeholder="تهران، خیابان..." />
          </div>
          <div class="col-span-2">
            <label class="lbl">نام مدرسه</label>
            <select v-model="newStudent.school_name" class="input">
              <option>شهید بهشتی</option>
              <option>فرزانگان</option>
              <option>امام خمینی</option>
            </select>
          </div>
          <div>
            <label class="lbl">پایه</label>
            <select v-model="newStudent.grade" class="input">
              <option>هفتم</option>
              <option>هشتم</option>
              <option>نهم</option>
            </select>
          </div>
          <div>
            <label class="lbl">کلاس</label>
            <select v-model="newStudent.class_name" class="input">
              <option>الف</option>
              <option>ب</option>
            </select>
          </div>
          <div class="col-span-2">
            <label class="lbl">موبایل والدین</label>
            <input v-model="newStudent.parent_phone" class="input" placeholder="۰۹۱۲۳۴۵۶۷۸۹" required />
          </div>

          <button type="submit" class="col-span-2 btn btn-royal py-3.5 font-black mt-2" style="min-height:54px">
            <i data-lucide="user-plus" class="w-5 h-5"></i>
            <span>ثبت دانش‌آموز</span>
          </button>
        </form>
      </div>
    </div>

    <!-- Reject Receipt Modal -->
    <div v-if="rejectingReceipt" class="fixed inset-0 z-[60] bg-ink/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div class="w-full sm:max-w-md bg-white rounded-t-[28px] sm:rounded-[28px] p-6 rise space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="text-xl font-extrabold text-late">رد رسید</h3>
          <button @click="rejectingReceipt = null" class="w-10 h-10 rounded-xl bg-mist flex items-center justify-center">
            <i data-lucide="x" class="w-5 h-5"></i>
          </button>
        </div>

        <p class="text-xs text-[#5A6E99]">
          دانش‌آموز: <b>{{ rejectingReceipt.student_name }}</b>
        </p>

        <div>
          <p class="lbl">علت رد</p>
          <div class="flex flex-wrap gap-1.5 text-xs">
            <button 
              type="button" 
              v-for="r in rejectPresetReasons" 
              :key="r"
              @click="selectedRejectReason = r"
              :class="[
                'px-3 py-1.5 rounded-xl border font-bold transition-all',
                selectedRejectReason === r ? 'bg-late text-white border-late' : 'bg-mist border-line text-[#5A6E99]'
              ]"
            >
              {{ r }}
            </button>
          </div>
        </div>

        <div>
          <label class="lbl">توضیح بیشتر (اختیاری)</label>
          <textarea v-model="rejectCustomNote" class="input !h-20 py-2 text-xs" placeholder="توضیح بیشتر..."></textarea>
        </div>

        <button @click="confirmReject" class="btn btn-bad w-full font-black">
          <i data-lucide="x-circle" class="w-5 h-5"></i>
          <span>رد رسید و اطلاع به دانش‌آموز</span>
        </button>
      </div>
    </div>

    <!-- Printable QR & Admission Cards Modal -->
    <div v-if="openQrModal" class="fixed inset-0 z-[60] bg-ink/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div class="bg-white rounded-[28px] p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-4 rise">
        <div class="no-print flex items-center justify-between">
          <h3 class="text-xl font-extrabold">کارت ورود به آزمون جامع</h3>
          <button @click="openQrModal = false" class="w-10 h-10 rounded-xl bg-mist flex items-center justify-center">
            <i data-lucide="x" class="w-5 h-5"></i>
          </button>
        </div>

        <div class="no-print flex justify-between items-center bg-mist p-3 rounded-2xl text-xs">
          <span>کارت ورود داوطلبان با بارکد و کد دوبعدی اختصاصی</span>
          <button @click="printAdmissionCards" class="btn btn-royal btn-sm font-bold">
            <i data-lucide="printer" class="w-4 h-4"></i>
            <span>چاپ</span>
          </button>
        </div>

        <!-- Printable Cards Grid -->
        <div id="print-area" class="grid sm:grid-cols-2 gap-4">
          <div 
            v-for="st in comprehensiveRankings.slice(0, 4)" 
            :key="st.id" 
            class="p-4 border-2 border-dashed border-royal/40 rounded-2xl bg-white space-y-3"
          >
            <div class="flex items-center gap-2 border-b border-line pb-2">
              <i data-lucide="graduation-cap" class="w-6 h-6 text-royal"></i>
              <div>
                <p class="font-extrabold text-sm text-ink">کانون نخبه‌پروری شهید کاظم آشتیانی</p>
                <p class="text-[10px] text-[#5A6E99]">کارت ورود به جلسه آزمون جامع</p>
              </div>
            </div>

            <div class="flex justify-between items-center">
              <div class="text-xs space-y-1">
                <p>نام: <b>{{ st.full_name }}</b></p>
                <p>کد ملی: <b dir="ltr">{{ st.national_id }}</b></p>
                <p>پایه و کلاس: <b>{{ st.grade }} {{ st.class_name }}</b></p>
                <p>شماره داوطلبی: <b>{{ faNum(st.id) }}</b></p>
              </div>

              <!-- Simulated QR Code SVG -->
              <div class="w-20 h-20 bg-mist border border-line rounded-xl p-1 flex flex-col items-center justify-center">
                <svg viewBox="0 0 100 100" class="w-full h-full text-ink" fill="currentColor">
                  <rect x="10" y="10" width="25" height="25" />
                  <rect x="65" y="10" width="25" height="25" />
                  <rect x="10" y="65" width="25" height="25" />
                  <rect x="45" y="20" width="10" height="20" />
                  <rect x="45" y="55" width="20" height="10" />
                  <rect x="75" y="75" width="15" height="15" />
                  <rect x="45" y="75" width="10" height="10" />
                </svg>
                <span class="text-[8px] font-black tracking-widest text-[#5A6E99]">QR-PASS</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Mobile Bottom Navigation Dock for Admin Panel (lg:hidden) -->
    <nav class="lg:hidden dock fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur border-t border-line pb-[env(safe-area-inset-bottom)]" aria-label="منوی مدیر">
      <div class="grid grid-cols-7 max-w-xl mx-auto">
        <button 
          v-for="item in navItems" 
          :key="item.key"
          @click="activeTab = item.key"
          :aria-current="activeTab === item.key ? 'page' : undefined"
          class="dock-item relative !py-2 !gap-0.5"
        >
          <i :data-lucide="item.icon" class="w-5 h-5"></i>
          <span class="text-[9px] font-bold truncate">{{ item.label }}</span>
          <span 
            v-if="item.badge && item.badge > 0" 
            class="absolute top-1 right-1/2 translate-x-2.5 w-4 h-4 rounded-full bg-sun text-ink text-[9px] font-black flex items-center justify-center shadow"
          >
            {{ faNum(item.badge) }}
          </span>
        </button>
      </div>
    </nav>

    <!-- Bulk Student Import Modal -->
    <div 
      v-if="openImportModal" 
      class="fixed inset-0 z-[70] bg-ink/70 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div class="card p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto space-y-4 rise bg-white">
        <div class="flex items-center justify-between border-b border-line pb-3">
          <div class="flex items-center gap-2">
            <i data-lucide="file-spreadsheet" class="w-6 h-6 text-royal"></i>
            <div>
              <h3 class="font-extrabold text-lg text-ink">ثبت گروهی دانش‌آموزان از طریق فایل اکسل</h3>
              <p class="text-xs text-[#5A6E99]">نام کاربری: شماره تماس | رمز عبور: کد ملی دانش‌آموز</p>
            </div>
          </div>
          <button @click="closeImportModal" class="text-[#5A6E99] hover:text-ink">
            <i data-lucide="x" class="w-5 h-5"></i>
          </button>
        </div>

        <!-- Download Template and Format Guide -->
        <div class="p-4 bg-royal/5 border border-royal/20 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 class="font-bold text-xs sm:text-sm text-royal">قالب آماده اکسل (Excel Template)</h4>
            <p class="text-xs text-[#5A6E99] mt-0.5">ستون‌ها: نام و نام خانوادگی | پایه | کد ملی | شماره تماس | آدرس</p>
          </div>
          <a 
            href="/api/admin/students/excel-template" 
            download="roshd_students_template.xlsx" 
            class="btn btn-royal !py-2 !px-3 text-xs font-bold shrink-0 flex items-center gap-1.5"
          >
            <i data-lucide="download" class="w-4 h-4"></i>
            <span>دانلود نمونه اکسل</span>
          </a>
        </div>

        <!-- Upload File Area -->
        <input 
          type="file" 
          ref="excelFileInput" 
          accept=".xlsx,.xls,.csv" 
          @change="onFileSelected" 
          class="hidden" 
        />

        <div 
          @click="$refs.excelFileInput.click()" 
          class="border-2 border-dashed border-royal/30 hover:border-royal bg-mist/60 hover:bg-royal/5 p-6 rounded-2xl text-center cursor-pointer transition-all space-y-2"
        >
          <div class="w-12 h-12 mx-auto rounded-full bg-royal/10 text-royal flex items-center justify-center">
            <i data-lucide="upload-cloud" class="w-6 h-6"></i>
          </div>
          <div v-if="selectedExcelFile">
            <p class="font-bold text-sm text-ink">{{ selectedExcelFile.name }}</p>
            <p class="text-xs text-[#5A6E99]">{{ (selectedExcelFile.size / 1024).toFixed(1) }} کیلوبایت - برای تعویض فایل کلیک کنید</p>
          </div>
          <div v-else>
            <p class="font-bold text-sm text-ink">برای انتخاب یا آپلود فایل اکسل کلیک کنید</p>
            <p class="text-xs text-[#5A6E99]">پشتیبانی از فرمت‌های XLSX, XLS و CSV</p>
          </div>
        </div>

        <!-- Preview Results -->
        <div v-if="importDryRunResult" class="p-4 bg-mist rounded-xl space-y-3 text-xs">
          <div class="flex items-center justify-between font-bold">
            <span class="text-ok">تعداد ردیف‌های معتبر شناسایی‌شده: {{ faNum(importDryRunResult.valid_count) }}</span>
            <span v-if="importDryRunResult.invalid_count > 0" class="text-late">ردیف‌های دارای خطا: {{ faNum(importDryRunResult.invalid_count) }}</span>
          </div>

          <div v-if="importDryRunResult.preview && importDryRunResult.preview.length > 0" class="overflow-x-auto max-h-48 border border-line rounded-lg">
            <table class="w-full text-right text-xs">
              <thead class="bg-white/80 sticky top-0 border-b border-line text-[#5A6E99]">
                <tr>
                  <th class="p-2">نام و نام خانوادگی</th>
                  <th class="p-2">پایه</th>
                  <th class="p-2">کد ملی (رمز عبور)</th>
                  <th class="p-2">شماره تماس (نام کاربری)</th>
                  <th class="p-2">آدرس</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-line">
                <tr v-for="(p, idx) in importDryRunResult.preview" :key="idx">
                  <td class="p-2 font-bold">{{ p.full_name }}</td>
                  <td class="p-2">{{ p.grade }}</td>
                  <td class="p-2 font-mono" dir="ltr">{{ p.national_id }}</td>
                  <td class="p-2 font-mono" dir="ltr">{{ p.phone || '-' }}</td>
                  <td class="p-2 truncate max-w-[140px]">{{ p.address || '-' }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div v-if="importDryRunResult.errors && importDryRunResult.errors.length > 0" class="text-late max-h-24 overflow-y-auto space-y-1 bg-red-50 p-2.5 rounded-lg border border-red-200">
            <p v-for="err in importDryRunResult.errors" :key="err.row_number">
              ردیف {{ faNum(err.row_number) }}: {{ err.errors.join('، ') }}
            </p>
          </div>
        </div>

        <!-- Success Result & Download List -->
        <div v-if="importCredentials && importCredentials.length > 0" class="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-3 text-xs">
          <div class="flex items-center gap-2 text-ok font-bold text-sm">
            <i data-lucide="check-circle" class="w-5 h-5"></i>
            <span>حساب کاربری {{ faNum(importCredentials.length) }} دانش‌آموز با موفقیت ایجاد گردید!</span>
          </div>
          <p class="text-emerald-800 leading-relaxed">
            دانش‌آموزان اکنون می‌توانند با <b>شماره تماس خود به عنوان نام کاربری</b> و <b>کد ملی به عنوان رمز عبور</b> وارد سامانه شوند.
          </p>
        </div>

        <div class="flex items-center justify-end gap-2 pt-2 border-t border-line">
          <button @click="closeImportModal" class="btn btn-soft text-xs font-bold">
            بستن
          </button>
          <button 
            v-if="importDryRunResult && importDryRunResult.valid_count > 0 && (!importCredentials || importCredentials.length === 0)" 
            @click="executeFileImport" 
            :disabled="importLoading" 
            class="btn btn-ok text-xs font-bold flex items-center gap-1.5"
          >
            <i data-lucide="user-plus" class="w-4 h-4"></i>
            <span v-if="importLoading">در حال ثبت در سامانه...</span>
            <span v-else>تأیید و ساخت حساب {{ faNum(importDryRunResult.valid_count) }} دانش‌آموز</span>
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
import { ref, onMounted, nextTick, watch } from 'vue';
import { faNum, money, refreshIcons } from '../utils';

const props = defineProps({
  user: { type: Object, required: true }
});

defineEmits(['logout']);

const activeTab = ref('dash');
const feeSubTab = ref('def');
const annSubTab = ref('new');
const toastMsg = ref('');
const openRegModal = ref(false);
const openImportModal = ref(false);
const rejectingReceipt = ref(null);
const openQrModal = ref(false);

const navItems = [
  { key: 'dash', label: 'داشبورد', icon: 'layout-dashboard' },
  { key: 'stu', label: 'دانش‌آموزان', icon: 'users' },
  { key: 'fee', label: 'حق عضویت', icon: 'wallet', badge: 3 },
  { key: 'settings', label: 'تنظیمات و پرداخت', icon: 'settings' },
  { key: 'ann', label: 'اطلاعیه', icon: 'megaphone' },
  { key: 'acc', label: 'حسابداری', icon: 'calculator' },
  { key: 'exm', label: 'آزمون جامع', icon: 'trophy' }
];

watch([activeTab, feeSubTab, annSubTab, openRegModal, openImportModal, rejectingReceipt, openQrModal], () => {
  nextTick(() => refreshIcons());
});

function toast(msg) {
  toastMsg.value = msg;
  nextTick(() => refreshIcons());
  setTimeout(() => toastMsg.value = '', 3000);
}

// ----------------- DASHBOARD STATS -----------------
const stats = ref({
  total_students: 450,
  paid_count: 270,
  pending_count: 90,
  absent_today: 2,
  absentees: []
});

async function loadStats() {
  try {
    const res = await fetch('/api/stats/dashboard');
    stats.value = await res.json();
  } catch (e) {
    console.error(e);
  } finally {
    nextTick(() => refreshIcons());
  }
}

// ----------------- STUDENTS (450) -----------------
const studentsList = ref([]);
const totalStudentsCount = ref(450);
const studentSearch = ref('');
const filterGrade = ref('');
const filterClass = ref('');
const filterSchool = ref('');
const currentPage = ref(1);

async function searchStudents() {
  try {
    const params = new URLSearchParams({
      search: studentSearch.value,
      grade: filterGrade.value,
      class_name: filterClass.value,
      school_name: filterSchool.value,
      page: currentPage.value,
      limit: 50
    });
    const res = await fetch(`/api/students?${params}`);
    const data = await res.json();
    studentsList.value = data.students || [];
    totalStudentsCount.value = data.total || 450;
  } catch (e) {
    console.error(e);
  } finally {
    nextTick(() => refreshIcons());
  }
}

const newStudent = ref({
  first_name: '',
  last_name: '',
  national_id: '',
  address: '',
  school_name: 'شهید بهشتی',
  grade: 'هفتم',
  class_name: 'الف',
  birth_date: '۱۳۸۹/۰۲/۱۵',
  parent_phone: ''
});

async function registerStudent() {
  try {
    const res = await fetch('/api/students', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newStudent.value)
    });
    const d = await res.json();
    if (!res.ok) throw new Error(d.error);
    toast('دانش‌آموز با موفقیت به جمع ۴۵۰ نفره کانون اضافه شد!');
    openRegModal.value = false;
    searchStudents();
    loadStats();
  } catch (err) {
    alert(err.message);
  }
}

async function deleteStudent(id) {
  if (!confirm('آیا از حذف این پرونده دانش‌آموزی اطمینان دارید؟')) return;
  try {
    await fetch(`/api/students/${id}`, { method: 'DELETE' });
    toast('دانش‌آموز حذف شد');
    searchStudents();
    loadStats();
  } catch (e) {
    console.error(e);
  }
}

// ----------------- FEES -----------------
const feeDefs = ref([]);
const receiptsList = ref([]);
const feeReports = ref([]);
const pendingReceiptsCount = ref(0);

async function loadFees() {
  try {
    const [defsRes, recsRes, repRes] = await Promise.all([
      fetch('/api/fees/defs'),
      fetch('/api/fees/receipts'),
      fetch('/api/fees/report')
    ]);
    feeDefs.value = await defsRes.json();
    receiptsList.value = await recsRes.json();
    feeReports.value = await repRes.json();
    pendingReceiptsCount.value = receiptsList.value.filter(r => r.status === 'pending').length;
  } catch (e) {
    console.error(e);
  } finally {
    nextTick(() => refreshIcons());
  }
}

async function saveFeeDefs() {
  try {
    for (const f of feeDefs.value) {
      await fetch('/api/fees/defs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(f)
      });
    }
    toast('تنظیمات مبالغ پایه با موفقیت ذخیره شد');
    loadFees();
  } catch (e) {
    console.error(e);
  }
}

async function approveReceipt(id) {
  try {
    await fetch(`/api/fees/receipts/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'approved' })
    });
    toast('رسید واریز تأیید شد و پنل دانش‌آموز فعال گردید.');
    loadFees();
    loadStats();
    loadAccounting();
  } catch (e) {
    console.error(e);
  }
}

const rejectPresetReasons = ['فیش ناخوانا است', 'مبلغ کمتر است', 'رسید جعلی/تکراری است'];
const selectedRejectReason = ref(rejectPresetReasons[0]);
const rejectCustomNote = ref('');

function startReject(rec) {
  rejectingReceipt.value = rec;
  selectedRejectReason.value = rejectPresetReasons[0];
  rejectCustomNote.value = '';
}

async function confirmReject() {
  if (!rejectingReceipt.value) return;
  const reason = selectedRejectReason.value + (rejectCustomNote.value ? ` - ${rejectCustomNote.value}` : '');
  try {
    await fetch(`/api/fees/receipts/${rejectingReceipt.value.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'rejected', reject_reason: reason })
    });
    toast('رسید رد شد و پیام به دانش‌آموز منتقل گردید.');
    rejectingReceipt.value = null;
    loadFees();
    loadStats();
  } catch (e) {
    console.error(e);
  }
}

// ----------------- NOTICES -----------------
const newAnn = ref({
  title: '',
  body: '',
  target_audience: 'all',
  tag: 'مهم'
});
const noticeReports = ref([]);

async function loadNoticeReports() {
  try {
    const res = await fetch('/api/notices/report');
    noticeReports.value = await res.json();
  } catch (e) {
    console.error(e);
  } finally {
    nextTick(() => refreshIcons());
  }
}

async function createNotice() {
  if (!newAnn.value.title || !newAnn.value.body) return;
  try {
    await fetch('/api/notices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newAnn.value)
    });
    toast('اطلاعیه منتشر شد!');
    newAnn.value.title = '';
    newAnn.value.body = '';
    annSubTab.value = 'rep';
    loadNoticeReports();
  } catch (e) {
    console.error(e);
  }
}

// ----------------- ACCOUNTING -----------------
const accData = ref({ total_income: 0, total_expense: 0, net_balance: 0, chart: [] });
const ledgerList = ref([]);
const newExpense = ref({ amount: null, title: '', category: 'چاپ و تکثیر' });

async function loadAccounting() {
  try {
    const [sumRes, ledRes] = await Promise.all([
      fetch('/api/accounting/summary'),
      fetch('/api/accounting/ledger')
    ]);
    accData.value = await sumRes.json();
    ledgerList.value = await ledRes.json();
  } catch (e) {
    console.error(e);
  } finally {
    nextTick(() => refreshIcons());
  }
}

async function createExpense() {
  if (!newExpense.value.amount || !newExpense.value.title) return;
  try {
    await fetch('/api/accounting/expense', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newExpense.value)
    });
    toast('سند هزینه در سیستم ثبت گردید.');
    newExpense.value.amount = null;
    newExpense.value.title = '';
    loadAccounting();
  } catch (e) {
    console.error(e);
  }
}

// ----------------- COMPREHENSIVE EXAM & QR -----------------
const comprehensiveRankings = ref([]);

async function loadComprehensiveRankings() {
  try {
    const res = await fetch('/api/exams/comprehensive/rankings');
    comprehensiveRankings.value = await res.json();
  } catch (e) {
    console.error(e);
  } finally {
    nextTick(() => refreshIcons());
  }
}

function printAdmissionCards() {
  window.print();
}

// ----------------- BULK STUDENT IMPORT & EXCEL ENGINE -----------------
const selectedExcelFile = ref(null);
const importDryRunResult = ref(null);
const importCredentials = ref(null);
const importLoading = ref(false);
const excelFileInput = ref(null);

function closeImportModal() {
  openImportModal.value = false;
  selectedExcelFile.value = null;
  importDryRunResult.value = null;
  importCredentials.value = null;
  if (excelFileInput.value) excelFileInput.value.value = '';
}

async function onFileSelected(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;
  selectedExcelFile.value = file;
  importDryRunResult.value = null;
  importCredentials.value = null;
  importLoading.value = true;
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('dry_run', 'true');
    const res = await fetch('/api/admin/students/import-file', {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'خطا در خواندن فایل اکسل');
    importDryRunResult.value = data;
    nextTick(refreshIcons);
  } catch (err) {
    alert(err.message);
  } finally {
    importLoading.value = false;
  }
}

async function executeFileImport() {
  if (!selectedExcelFile.value) return;
  importLoading.value = true;
  try {
    const formData = new FormData();
    formData.append('file', selectedExcelFile.value);
    formData.append('dry_run', 'false');
    const res = await fetch('/api/admin/students/import-file', {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'خطا در ثبت دانش‌آموزان');
    toast(data.message || 'دانش‌آموزان با موفقیت ثبت شدند.');
    importCredentials.value = data.credentials || [];
    searchStudents();
    loadStats();
    nextTick(refreshIcons);
  } catch (err) {
    alert(err.message);
  } finally {
    importLoading.value = false;
  }
}

async function resetStudentPassword(student) {
  if (!confirm(`آیا از بازنشانی رمز عبور دانش‌آموز «${student.full_name}» اطمینان دارید؟`)) return;
  try {
    const res = await fetch(`/api/admin/users/${student.id}/reset-password`, {
      method: 'POST'
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    alert(`رمز عبور موقت جدید برای ${student.full_name}:\n\n${data.temp_password}\n\nدانش‌آموز در اولین ورود ملزم به تغییر این رمز خواهد بود.`);
  } catch (err) {
    alert('خطا در بازنشانی رمز: ' + err.message);
  }
}

// ----------------- PLATFORM & PAYMENT SETTINGS -----------------
const sysSettings = ref({
  brand_name: 'کانون نخبه‌پروری شهید کاظم آشتیانی',
  platform_name: 'پلتفرم رشد',
  slogan: 'سامانه جامع مدیریت آموزشی و نخبه‌پروری',
  card_number: '۶۰۳۷-۹۹۷۰-۰۰۰۰-۰۰۰۰',
  card_holder: 'کانون نخبه‌پروری آشتیانی',
  shaba_number: 'IR000000000000000000000000',
  bank_name: 'بانک ملی ایران',
  contact_phone: '۰۲۱-۸۸۸۸۴۴۲۲',
  address: 'تهران، خیابان آزادی، پلاک ۱۲',
  tuition_rules: 'واریز شهریه حداکثر تا پایان مهلت مقرر الزامی است.',
  announcement_banner: '',
  platform_fee_amount: 150000
});
const savingSettings = ref(false);

async function loadSystemSettings() {
  try {
    const res = await fetch('/api/admin/settings');
    if (res.ok) {
      const data = await res.json();
      if (data.settings) {
        sysSettings.value = { ...sysSettings.value, ...data.settings };
      }
      if (data.fee_defs && data.fee_defs.length > 0) {
        feeDefs.value = data.fee_defs;
      }
    }
  } catch (e) {
    console.error(e);
  } finally {
    nextTick(() => refreshIcons());
  }
}

async function saveAllSettings() {
  savingSettings.value = true;
  try {
    const res = await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        settings: sysSettings.value,
        fee_defs: feeDefs.value
      })
    });
    const d = await res.json();
    if (!res.ok) throw new Error(d.error || 'خطا در ذخیره تنظیمات');
    toast('تمام تنظیمات سامانه و مشخصات پرداخت با موفقیت ذخیره شد.');
    loadFees();
  } catch (err) {
    alert(err.message);
  } finally {
    savingSettings.value = false;
  }
}

onMounted(() => {
  loadStats();
  searchStudents();
  loadFees();
  loadSystemSettings();
  loadNoticeReports();
  loadAccounting();
  loadComprehensiveRankings();
  refreshIcons();
});
</script>
