<template>
  <div class="min-h-screen pb-28">
    <!-- Header (rosh-step5-parents-store.html) -->
    <header class="brand-bg relative text-white">
      <div class="dots absolute inset-0 opacity-50"></div>
      <div class="relative max-w-3xl mx-auto px-4 pt-4 pb-24 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center shrink-0">
            <i data-lucide="graduation-cap" class="w-6 h-6 text-sun"></i>
          </div>
          <div class="leading-tight">
            <p class="font-extrabold truncate">کانون نخبه‌پروری شهید کاظم آشتیانی</p>
            <p class="text-white/70 text-xs">پلتفرم رشد، پنل والدین</p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <div class="w-11 h-11 rounded-2xl bg-sun text-ink flex items-center justify-center font-extrabold text-sm shadow">
            پ
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
      <div class="px-1 text-white">
        <p class="text-white/80 text-sm">دوشنبه ۴ آبان ۱۴۰۵</p>
        <h2 class="text-[26px] font-extrabold leading-snug">سلام، خانواده محترم رضایی</h2>
        
        <!-- Child Switcher Chips -->
        <div class="flex gap-2 mt-3">
          <button 
            @click="selectedChild = 'ali'" 
            :class="[
              'chip cursor-pointer transition-all',
              selectedChild === 'ali' ? 'on' : ''
            ]"
          >
            علی رضایی (هفتم الف)
          </button>
          <button 
            @click="selectedChild = 'sara'" 
            :class="[
              'chip cursor-pointer transition-all',
              selectedChild === 'sara' ? 'on' : ''
            ]"
          >
            سارا رضایی (نهم ب)
          </button>
        </div>
      </div>

      <!-- KPIs (rosh-step5-parents-store.html) -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div class="card p-4">
          <p class="text-xs text-[#5A6E99] font-bold">غیبت‌ها</p>
          <p class="text-2xl font-black text-ok mt-1">۰ <span class="text-xs">جلسه</span></p>
        </div>
        <div class="card p-4">
          <p class="text-xs text-[#5A6E99] font-bold">میانگین کل</p>
          <p class="text-2xl font-black text-royal mt-1">{{ faNum(parentData.report_card?.average || 19.2) }}</p>
        </div>
        <div class="card p-4">
          <p class="text-xs text-[#5A6E99] font-bold">تکمیل تکالیف</p>
          <p class="text-2xl font-black text-[#7A5600] mt-1">۸۸٪</p>
        </div>
        <div class="card p-4">
          <p class="text-xs text-[#5A6E99] font-bold">حق عضویت</p>
          <p class="text-xs font-black text-ok mt-2 bg-[#E6F7EE] py-1 px-2 rounded-lg text-center">پرداخت‌شده</p>
        </div>
      </div>

      <!-- Sticky Section Chips -->
      <nav class="sticky top-0 z-20 -mx-4 px-4 py-2 bg-mist/90 backdrop-blur flex gap-2 overflow-x-auto" aria-label="بخش‌ها">
        <a 
          v-for="s in sections" 
          :key="s.key"
          @click.prevent="activeSection = s.key"
          :class="['chip flex items-center cursor-pointer transition-all', activeSection === s.key ? 'on' : '']"
        >
          {{ s.label }}
        </a>
      </nav>

      <!-- 1. غیبت‌ها -->
      <section v-if="activeSection === 'abs'" class="card p-5 space-y-3">
        <h3 class="font-extrabold text-[18px] flex items-center gap-2">
          <i data-lucide="user-x" class="w-5 h-5 text-late"></i>
          <span>غیبت‌ها</span>
        </h3>

        <div class="space-y-2.5">
          <div class="p-3.5 rounded-2xl bg-[#E6F7EE] text-ok flex justify-between items-center text-xs font-bold">
            <span class="flex items-center gap-2">
              <i data-lucide="check-circle" class="w-4 h-4"></i>
              <span>تمام جلسات مهر و آبان با حضور فعال سپری شده است.</span>
            </span>
            <span>بدون غیبت</span>
          </div>
          <div class="p-3.5 rounded-2xl bg-mist flex justify-between items-center text-xs text-[#5A6E99]">
            <span>کلاس تقویتی ریاضی - دوشنبه ۴ آبان</span>
            <span class="tag bg-white text-ok font-bold">حاضر در کلاس</span>
          </div>
        </div>
      </section>

      <!-- 2. کارنامه دیجیتال -->
      <section v-if="activeSection === 'card'" class="card p-5 space-y-4">
        <div class="flex items-start justify-between gap-3">
          <div>
            <h3 class="font-extrabold text-[18px] flex items-center gap-2">
              <i data-lucide="file-badge" class="w-5 h-5 text-royal"></i>
              <span>کارنامه دیجیتال</span>
            </h3>
            <p class="text-xs text-[#5A6E99] mt-0.5">آزمون ماهانه آبان ۱۴۰۵</p>
          </div>
          <button @click="toast('دانلود کارنامه دیجیتال شروع شد')" class="btn btn-soft btn-sm">
            <i data-lucide="download" class="w-4 h-4"></i>
            <span>دانلود</span>
          </button>
        </div>

        <div class="space-y-3">
          <div 
            v-for="c in parentData.report_card?.courses || []" 
            :key="c.name"
            class="p-3.5 rounded-2xl bg-mist border border-line flex items-center justify-between text-sm"
          >
            <div>
              <p class="font-bold text-ink">{{ c.name }}</p>
              <p class="text-xs text-[#5A6E99]">دبیر: {{ c.teacher }}</p>
            </div>
            <span class="tag bg-white font-black text-royal text-sm shadow-sm">
              {{ faNum(c.score) }}
            </span>
          </div>
        </div>

        <div class="rounded-2xl bg-mist p-4 flex items-center justify-between">
          <div>
            <p class="text-xs text-[#5A6E99]">میانگین کل</p>
            <p class="text-[26px] font-extrabold text-royal leading-tight">
              {{ faNum(parentData.report_card?.average || 19.2) }}
            </p>
          </div>
          <div class="text-center">
            <p class="text-xs text-[#5A6E99]">رتبه در پایه</p>
            <p class="text-[20px] font-extrabold">رتبه ۴ از ۳۸</p>
          </div>
        </div>
      </section>

      <!-- 3. تکالیف -->
      <section v-if="activeSection === 'hw'" class="card p-5 space-y-4">
        <div class="flex items-center gap-4">
          <div class="w-[72px] h-[72px] rounded-full shrink-0 flex items-center justify-center" style="background:conic-gradient(#12A150 88%,#E3ECFF 0)">
            <div class="w-[56px] h-[56px] rounded-full bg-white flex items-center justify-center font-extrabold text-sm text-ok">
              ۸۸٪
            </div>
          </div>
          <div>
            <h3 class="font-extrabold text-[18px]">وضعیت تکالیف</h3>
            <p class="text-xs text-[#5A6E99]">۷ از ۸ تکلیف انجام شده است</p>
          </div>
        </div>

        <div class="space-y-2.5 text-sm">
          <div class="p-3.5 rounded-2xl bg-mist flex items-center justify-between">
            <div>
              <p class="font-bold text-ink">تمرین‌های فصل ۳ ریاضی (کسرها)</p>
              <p class="text-xs text-ok font-bold mt-0.5">ارسال‌شده و نمره کامل</p>
            </div>
            <span class="tag bg-[#E6F7EE] text-ok text-xs">نمره ۲۰</span>
          </div>

          <div class="p-3.5 rounded-2xl bg-mist flex items-center justify-between">
            <div>
              <p class="font-bold text-ink">گزارش آزمایش علوم تجربی</p>
              <p class="text-xs text-royal font-bold mt-0.5">در انتظار بررسی معلم</p>
            </div>
            <span class="tag bg-white text-royal text-xs">ارسال‌شده</span>
          </div>
        </div>
      </section>

      <!-- 4. اطلاعیه‌ها -->
      <section v-if="activeSection === 'ann'" class="card p-5 space-y-3">
        <h3 class="font-extrabold text-[18px] flex items-center gap-2">
          <i data-lucide="megaphone" class="w-5 h-5 text-royal"></i>
          <span>اطلاعیه‌ها</span>
        </h3>
        <div class="space-y-3">
          <div class="flex items-start gap-3 p-3 rounded-2xl bg-mist">
            <div class="w-11 h-11 rounded-2xl text-white flex items-center justify-center shrink-0" style="background:linear-gradient(135deg,#1E90FF,#0A4BD6)">
              <i data-lucide="calendar-clock" class="w-5 h-5"></i>
            </div>
            <div>
              <p class="font-bold text-sm">تغییر ساعت کلاس ریاضی</p>
              <p class="text-xs text-[#5A6E99]">امروز ۰۹:۰۰</p>
            </div>
          </div>
          <div class="flex items-start gap-3 p-3 rounded-2xl bg-mist">
            <div class="w-11 h-11 rounded-2xl text-ink bg-sun flex items-center justify-center shrink-0">
              <i data-lucide="trophy" class="w-5 h-5"></i>
            </div>
            <div>
              <p class="font-bold text-sm">آزمون جامع پنجشنبه ۷ آبان</p>
              <p class="text-xs text-[#5A6E99]">دیروز ۱۸:۳۰</p>
            </div>
          </div>
        </div>
      </section>

      <!-- 5. گزارش پیشرفت دوره‌ای و نظر معلم -->
      <section v-if="activeSection === 'prog'" class="card p-5 space-y-4">
        <h3 class="font-extrabold text-[18px] flex items-center gap-2">
          <i data-lucide="trending-up" class="w-5 h-5 text-ok"></i>
          <span>گزارش پیشرفت دوره‌ای</span>
        </h3>

        <!-- Chart Bars (Claude Style) -->
        <div class="flex items-end justify-around gap-4 h-40 mt-5 px-4 border-b border-line pb-3">
          <div class="flex flex-col items-center gap-1">
            <div class="w-10 bg-royal/60 rounded-t-xl h-24"></div>
            <span class="text-xs text-[#5A6E99]">شهریور (۱۷.۵)</span>
          </div>
          <div class="flex flex-col items-center gap-1">
            <div class="w-10 bg-royal/80 rounded-t-xl h-28"></div>
            <span class="text-xs text-[#5A6E99]">مهر (۱۸.۸)</span>
          </div>
          <div class="flex flex-col items-center gap-1">
            <div class="w-10 bg-ok rounded-t-xl h-36"></div>
            <span class="text-xs text-ok font-bold">آبان (۱۹.۲)</span>
          </div>
        </div>

        <div class="rounded-2xl bg-[#EEF4FF] p-4 flex gap-3">
          <i data-lucide="message-square-quote" class="w-6 h-6 text-royal shrink-0"></i>
          <div>
            <p class="font-bold text-sm text-royal">نظر معلم راهنما</p>
            <p class="text-sm text-ink leading-relaxed mt-1">
              "{{ parentData.teacher_note }}"
            </p>
          </div>
        </div>
      </section>
    </main>

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
  { key: 'card', label: 'کارنامه' },
  { key: 'abs', label: 'غیبت‌ها' },
  { key: 'hw', label: 'تکالیف' },
  { key: 'ann', label: 'اطلاعیه‌ها' },
  { key: 'prog', label: 'پیشرفت' }
];

const parentData = ref({});

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
    parentData.value = await res.json();
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
