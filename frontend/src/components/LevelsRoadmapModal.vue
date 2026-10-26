<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-md animate-fade-in" role="dialog" aria-modal="true">
    <div class="relative w-full max-w-2xl max-h-[92vh] flex flex-col bg-white rounded-[28px] shadow-2xl overflow-hidden border border-slate-100 rise">
      
      <!-- Modal Header with Rich Hero Gradient -->
      <header class="brand-bg relative text-white px-5 py-5 sm:px-7 sm:py-6 overflow-hidden shrink-0">
        <div class="dots absolute inset-0 opacity-40"></div>
        
        <!-- Background floating badge glow -->
        <div class="absolute -left-10 -bottom-10 w-44 h-44 rounded-full bg-sun/20 blur-3xl pointer-events-none"></div>

        <div class="relative flex items-start justify-between gap-3">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/20 backdrop-blur border border-white/30 flex items-center justify-center shadow-lg text-sun shrink-0">
              <i data-lucide="trophy" class="w-7 h-7"></i>
            </div>
            <div>
              <div class="flex items-center gap-2">
                <span class="tag bg-sun text-ink font-black text-[11px] sm:text-xs">سیستم جامع امتیاز و پیشرفت</span>
                <span class="text-white/70 text-xs hidden sm:inline">کانون شهید آشتیانی</span>
              </div>
              <h2 class="text-xl sm:text-2xl font-black mt-1 text-white">
                نقشه راه سطوح و عناوین افتخار 🎯
              </h2>
            </div>
          </div>

          <!-- Close Button -->
          <button 
            @click="$emit('close')" 
            class="w-10 h-10 rounded-2xl bg-white/15 hover:bg-white/30 text-white flex items-center justify-center transition-all border-none cursor-pointer shrink-0"
            aria-label="بستن"
          >
            <i data-lucide="x" class="w-5 h-5"></i>
          </button>
        </div>

        <!-- Student Current Standing Highlights Card -->
        <div class="relative mt-4 sm:mt-5 p-3.5 sm:p-4 rounded-2xl bg-white/10 backdrop-blur border border-white/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-white">
          <div class="flex items-center gap-3">
            <div class="w-11 h-11 rounded-xl bg-sun text-ink font-black flex items-center justify-center text-lg shadow">
              {{ currentLevelInfo.icon }}
            </div>
            <div>
              <p class="text-xs text-white/80">وضعیت کنونی شما:</p>
              <p class="font-extrabold text-base sm:text-lg">
                سطح {{ faNum(currentLevelInfo.level) }}: {{ currentLevelInfo.title }}
                <span class="text-xs font-normal text-sun mr-1">({{ faNum(userPoints) }} امتیاز)</span>
              </p>
            </div>
          </div>

          <!-- Progress to Next Level -->
          <div v-if="nextLevelInfo" class="w-full sm:w-56 text-left sm:text-right">
            <div class="flex items-center justify-between text-xs mb-1 font-bold">
              <span>تا سطح {{ nextLevelInfo.title }}</span>
              <span class="text-sun font-black">{{ faNum(pointsToNext) }} امتیاز مانده</span>
            </div>
            <div class="w-full h-2.5 rounded-full bg-white/20 overflow-hidden p-0.5">
              <div 
                class="h-full rounded-full bg-gradient-to-r from-sun to-amber-300 transition-all duration-1000 shadow-sm"
                :style="{ width: `${progressPercent}%` }"
              ></div>
            </div>
          </div>

          <div v-else class="text-sun font-extrabold text-sm flex items-center gap-1.5">
            <i data-lucide="crown" class="w-5 h-5"></i>
            <span>شما به بالاترین قله رشد کانون رسیده‌اید! 👑</span>
          </div>
        </div>
      </header>

      <!-- How to Earn XP Fast - Floating Banner -->
      <div class="bg-amber-50/90 border-b border-amber-200/60 px-4 py-2.5 sm:px-6 flex items-center justify-between gap-2 text-xs font-bold text-[#8A5A00] shrink-0">
        <div class="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
          <span class="flex items-center gap-1 whitespace-nowrap">
            <i data-lucide="zap" class="w-3.5 h-3.5 text-amber-500 fill-amber-500"></i>
            <span>تکالیف: تا +۵۰</span>
          </span>
          <span class="text-amber-300">•</span>
          <span class="flex items-center gap-1 whitespace-nowrap">
            <i data-lucide="file-check" class="w-3.5 h-3.5 text-blue-500"></i>
            <span>آزمون آنلاین: تا +۱۰۰</span>
          </span>
          <span class="text-amber-300">•</span>
          <span class="flex items-center gap-1 whitespace-nowrap">
            <i data-lucide="timer" class="w-3.5 h-3.5 text-emerald-500"></i>
            <span>پومودورو مطالعه: تا +۲۵</span>
          </span>
          <span class="text-amber-300">•</span>
          <span class="flex items-center gap-1 whitespace-nowrap">
            <i data-lucide="gamepad-2" class="w-3.5 h-3.5 text-purple-500"></i>
            <span>بازی ریاضی: تا +۲۰</span>
          </span>
        </div>
      </div>

      <!-- Scrollable Roadmap Content -->
      <div class="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6 space-y-3.5 bg-[#F6F9FD]">
        
        <div 
          v-for="(lvl, idx) in levelsList" 
          :key="lvl.level"
          :class="[
            'relative rounded-2xl p-4 sm:p-5 transition-all border duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4',
            lvl.status === 'current'
              ? 'bg-white border-2 border-royal shadow-xl ring-4 ring-royal/10 scale-[1.01]'
              : lvl.status === 'unlocked'
                ? 'bg-white/80 border-emerald-200 hover:bg-white shadow-sm'
                : 'bg-slate-100/70 border-slate-200 text-slate-400 opacity-75'
          ]"
        >
          <!-- Left Level Indicator & Badge -->
          <div class="flex items-start sm:items-center gap-3.5">
            <!-- Icon Avatar -->
            <div 
              :class="[
                'w-13 h-13 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center text-2xl sm:text-3xl shrink-0 shadow-sm border transition-all',
                lvl.status === 'current' 
                  ? 'bg-royal text-white border-royal shadow-lg scale-105'
                  : lvl.status === 'unlocked'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                    : 'bg-slate-200 border-slate-300 grayscale'
              ]"
            >
              {{ lvl.icon }}
            </div>

            <!-- Title & Thresholds -->
            <div>
              <div class="flex items-center gap-2 flex-wrap">
                <span class="font-black text-base sm:text-lg text-ink">
                  سطح {{ faNum(lvl.level) }}: {{ lvl.title }}
                </span>

                <!-- Status Tag -->
                <span 
                  v-if="lvl.status === 'current'" 
                  class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-royal text-white shadow-sm animate-pulse"
                >
                  <i data-lucide="flame" class="w-3 h-3 text-sun"></i>
                  <span>سطح کنونی شما</span>
                </span>
                <span 
                  v-else-if="lvl.status === 'unlocked'" 
                  class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-300"
                >
                  <i data-lucide="check-circle" class="w-3 h-3"></i>
                  <span>قفل‌گشایی شده</span>
                </span>
                <span 
                  v-else 
                  class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-500"
                >
                  <i data-lucide="lock" class="w-3 h-3"></i>
                  <span>قفل</span>
                </span>
              </div>

              <!-- Range Info -->
              <p class="text-xs text-[#5A6E99] font-bold mt-1 flex items-center gap-1.5">
                <i data-lucide="award" class="w-3.5 h-3.5 text-royal"></i>
                <span>بازه امتیاز: {{ lvl.rangeText }}</span>
              </p>

              <!-- Reward/Perk Info -->
              <p class="text-xs mt-1 text-slate-600 flex items-center gap-1">
                <i data-lucide="sparkles" class="w-3.5 h-3.5 text-amber-500 shrink-0"></i>
                <span class="font-medium">{{ lvl.perk }}</span>
              </p>
            </div>
          </div>

          <!-- Right Status Indicator / Progress -->
          <div class="sm:text-left self-end sm:self-center shrink-0">
            <div v-if="lvl.status === 'current'" class="text-royal font-black text-xs sm:text-sm flex items-center gap-1">
              <span>{{ faNum(progressPercent) }}٪ پیشرفت</span>
              <i data-lucide="chevron-left" class="w-4 h-4"></i>
            </div>
            <div v-else-if="lvl.status === 'locked'" class="text-slate-400 font-bold text-xs flex items-center gap-1">
              <i data-lucide="lock" class="w-3.5 h-3.5"></i>
              <span>{{ faNum(lvl.minPoints - userPoints) }} امتیاز تا فتح</span>
            </div>
            <div v-else class="text-emerald-600 font-bold text-xs flex items-center gap-1">
              <i data-lucide="check" class="w-4 h-4"></i>
              <span>کسب شده</span>
            </div>
          </div>
        </div>

      </div>

      <!-- Footer CTA -->
      <footer class="p-3.5 sm:p-4 bg-white border-t border-line flex items-center justify-between gap-3 shrink-0">
        <div class="text-xs text-[#5A6E99] hidden sm:block">
          💡 نکته: با هر فعالیت روزانه در سامانه امتیاز کسب می‌کنی و نشانت ارتقا پیدا می‌کنه!
        </div>
        <button 
          @click="$emit('close')" 
          class="btn btn-royal w-full sm:w-auto !min-h-[44px] !px-8 font-black text-sm shadow-md"
        >
          <span>متوجه شدم، بزن بریم برای امتیاز! 🚀</span>
        </button>
      </footer>

    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, nextTick } from 'vue';
import { faNum, refreshIcons } from '../utils';

const props = defineProps({
  userPoints: {
    type: Number,
    default: 0
  },
  currentLevel: {
    type: Number,
    default: 1
  },
  currentLevelTitle: {
    type: String,
    default: 'نوآموز'
  }
});

defineEmits(['close']);

onMounted(() => {
  nextTick(() => refreshIcons());
});

// Official 10-tier Roshd Gamification Levels Matrix
const LEVELS_MASTER = [
  { level: 1, title: 'نوآموز', icon: '🌱', minPoints: 0, maxPoints: 150, perk: 'ورود رسمی به باشگاه نخبگان کانون و ثبت نام در سامانه' },
  { level: 2, title: 'پوینده', icon: '🧭', minPoints: 151, maxPoints: 300, perk: 'بازگشایی ماژول بازی‌های سرعتی ریاضی و ثبت اولین نشان تلاش' },
  { level: 3, title: 'پیشرو', icon: '⚡', minPoints: 301, maxPoints: 500, perk: 'دریافت تخفیف ۱۰٪ در فروشگاه جزوات و دوره‌های کانون' },
  { level: 4, title: 'دانشور', icon: '📚', minPoints: 501, maxPoints: 700, perk: 'امکان شرکت در چالش‌های هفتگی و آزمون‌های سنجش سرعت' },
  { level: 5, title: 'کاوشگر', icon: '🔭', minPoints: 701, maxPoints: 950, perk: 'نشان طلایی کاوشگر + تخفیف ۱۵٪ خرید کتاب‌های تیزهوشان' },
  { level: 6, title: 'فرزانه', icon: '🌟', minPoints: 951, maxPoints: 1250, perk: 'اولویت اول در ثبت‌نام کارگاه‌های آزمایشگاهی و نجوم کانون' },
  { level: 7, title: 'نخبه', icon: '💎', minPoints: 1251, maxPoints: 1600, perk: 'کارت تخفیف ۲۵٪ آزمون‌های جامع شبیه‌ساز سمپاد' },
  { level: 8, title: 'طلایه‌دار', icon: '🛡️', minPoints: 1601, maxPoints: 2000, perk: 'دعوت اختصاصی به اردوی علمی-تفریحی نخبگان کانون' },
  { level: 9, title: 'قهرمان', icon: '🏆', minPoints: 2001, maxPoints: 2500, perk: 'کاپ قهرمانی رشد + بن خرید تجهیزات کمک‌آموزشی' },
  { level: 10, title: 'استاد', icon: '👑', minPoints: 2501, maxPoints: 99999, perk: 'تندیس زرین نخبه ماندگار + بورسیه تحصیلی کامل کانون' }
];

const levelsList = computed(() => {
  return LEVELS_MASTER.map(lvl => {
    let status = 'locked';
    if (props.userPoints >= lvl.minPoints && (props.userPoints <= lvl.maxPoints || lvl.level === 10)) {
      status = 'current';
    } else if (props.userPoints > lvl.maxPoints) {
      status = 'unlocked';
    }

    const rangeText = lvl.level === 10
      ? `بیشتر از ${faNum(lvl.minPoints)} امتیاز`
      : `${faNum(lvl.minPoints)} تا ${faNum(lvl.maxPoints)} امتیاز`;

    return {
      ...lvl,
      status,
      rangeText
    };
  });
});

const currentLevelInfo = computed(() => {
  return levelsList.value.find(l => l.status === 'current') || levelsList.value[0];
});

const nextLevelInfo = computed(() => {
  const curIdx = levelsList.value.findIndex(l => l.status === 'current');
  if (curIdx >= 0 && curIdx < levelsList.value.length - 1) {
    return levelsList.value[curIdx + 1];
  }
  return null;
});

const pointsToNext = computed(() => {
  if (!nextLevelInfo.value) return 0;
  return Math.max(0, nextLevelInfo.value.minPoints - props.userPoints);
});

const progressPercent = computed(() => {
  if (!nextLevelInfo.value) return 100;
  const currentMin = currentLevelInfo.value.minPoints;
  const nextMin = nextLevelInfo.value.minPoints;
  const totalSpan = nextMin - currentMin;
  const achieved = props.userPoints - currentMin;
  return Math.min(100, Math.max(5, Math.round((achieved / (totalSpan || 1)) * 100)));
});
</script>

<style scoped>
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
.animate-fade-in {
  animation: fadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
</style>
