<template>
  <div class="fixed inset-0 z-50 overflow-y-auto bg-ink/75 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white print:fixed print:inset-0">
    <div 
      class="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-line overflow-hidden rise flex flex-col max-h-[94vh] print:max-h-none print:shadow-none print:border-none print:rounded-none"
    >
      <!-- ================= MODAL HEADER ================= -->
      <div class="p-5 sm:p-6 bg-gradient-to-r from-royal via-[#1E60E6] to-[#0B256B] text-white flex items-center justify-between gap-4 shrink-0 relative overflow-hidden">
        <div class="absolute -right-10 -bottom-10 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
        <div class="absolute left-1/3 -top-10 w-36 h-36 bg-sun/20 rounded-full blur-xl pointer-events-none"></div>

        <div class="relative z-10 min-w-0">
          <div class="flex flex-wrap items-center gap-2 mb-1.5 font-sans">
            <span class="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-black bg-sun text-ink shadow-sm">
              <i data-lucide="award" class="w-3.5 h-3.5"></i>
              <span>کارنامه رسمی آزمون جامع</span>
            </span>
            <span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/20 text-white backdrop-blur">
              {{ report.grade || 'پایه نهم' }}
            </span>
            <span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/20 text-white backdrop-blur">
              ۱۹۲۴ داوطلب
            </span>
          </div>

          <h2 class="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2 font-sans">
            <span>{{ report.exam_title || 'مرحله اول آزمون برپا' }}</span>
          </h2>

          <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-white/85 mt-2 font-sans">
            <span class="flex items-center gap-1 font-bold">
              <i data-lucide="user" class="w-3.5 h-3.5 text-sun"></i>
              <span>دانش‌آموز:</span>
              <b class="text-white">{{ report.student_name }}</b>
            </span>
            <span class="flex items-center gap-1 font-bold">
              <i data-lucide="credit-card" class="w-3.5 h-3.5 text-sun"></i>
              <span>کد داوطلبی:</span>
              <b dir="ltr" class="text-white font-mono">{{ report.candidate_code }}</b>
            </span>
            <span class="flex items-center gap-1 font-bold">
              <i data-lucide="school" class="w-3.5 h-3.5 text-sun"></i>
              <span>مرکز:</span>
              <span>{{ report.school_name || 'شهید کاظمی آشتیانی' }}</span>
            </span>
          </div>
        </div>

        <div class="flex items-center gap-2 z-10 shrink-0 print:hidden">
          <button 
            @click="printReport" 
            class="btn btn-soft !bg-white/20 hover:!bg-white/30 text-white !min-h-[38px] text-xs font-black backdrop-blur flex items-center gap-1.5"
            title="چاپ کارنامه یا ذخیره PDF"
          >
            <i data-lucide="printer" class="w-4 h-4"></i>
            <span class="hidden sm:inline">چاپ / دانلود</span>
          </button>
          <button 
            @click="$emit('close')" 
            class="w-9 h-9 rounded-2xl bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-all"
            title="بستن"
          >
            <i data-lucide="x" class="w-5 h-5"></i>
          </button>
        </div>
      </div>

      <!-- ================= SCROLLABLE BODY ================= -->
      <div class="p-4 sm:p-6 space-y-6 overflow-y-auto flex-1 bg-[#F8FAFC]">
        
        <!-- 1. HERO KPI SCORE CARDS -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <!-- Overall Traz -->
          <div class="card p-4 sm:p-5 relative overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-800 text-white shadow-lg">
            <div class="absolute -right-4 -bottom-4 w-20 h-20 bg-white/10 rounded-full blur-xl"></div>
            <div class="flex items-center justify-between text-xs font-bold text-white/80 mb-2">
              <span>تراز کل آزمون</span>
              <i data-lucide="gauge" class="w-4 h-4 text-sun"></i>
            </div>
            <div class="text-2xl sm:text-3xl font-black tracking-tight text-white mt-1 font-sans">
              {{ faNum(report.overall_traz) }}
            </div>
            <div class="mt-2 text-[11px] text-white/80 font-bold flex items-center gap-1">
              <span class="w-2 h-2 rounded-full" :class="report.overall_traz >= 6000 ? 'bg-ok' : (report.overall_traz >= 5000 ? 'bg-sun' : 'bg-orange-300')"></span>
              <span>{{ getTrazLevel(report.overall_traz) }}</span>
            </div>
          </div>

          <!-- Overall Rank Nationwide -->
          <div class="card p-4 sm:p-5 relative overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-lg">
            <div class="flex items-center justify-between text-xs font-bold text-slate-400 mb-2">
              <span>رتبه کل کشوری</span>
              <i data-lucide="globe" class="w-4 h-4 text-sun"></i>
            </div>
            <div class="text-2xl sm:text-3xl font-black tracking-tight text-sun mt-1 font-sans">
              {{ faNum(report.overall_rank_all) }}
            </div>
            <div class="mt-2 text-[11px] text-slate-300 font-bold font-sans">
              از بین {{ faNum(report.total_attendees || 1924) }} داوطلب نهم
            </div>
          </div>

          <!-- Center Rank -->
          <div class="card p-4 sm:p-5 relative overflow-hidden bg-gradient-to-br from-emerald-700 to-teal-900 text-white shadow-lg">
            <div class="flex items-center justify-between text-xs font-bold text-emerald-200 mb-2">
              <span>رتبه در مجموعه</span>
              <i data-lucide="medal" class="w-4 h-4 text-sun"></i>
            </div>
            <div class="text-2xl sm:text-3xl font-black tracking-tight text-white mt-1 font-sans">
              {{ faNum(report.overall_rank_center) }}
            </div>
            <div class="mt-2 text-[11px] text-emerald-200 font-bold font-sans">
              مرکز شهید کاظمی آشتیانی
            </div>
          </div>

          <!-- Percentage & Accuracy -->
          <div class="card p-4 sm:p-5 relative overflow-hidden bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg">
            <div class="flex items-center justify-between text-xs font-bold text-white/90 mb-2">
              <span>درصد کل و دقت</span>
              <i data-lucide="target" class="w-4 h-4 text-white"></i>
            </div>
            <div class="text-2xl sm:text-3xl font-black tracking-tight text-white mt-1 font-sans">
              {{ faNum(report.overall_percentage) }}٪
            </div>
            <div class="mt-2 text-[11px] text-white/90 font-bold font-sans">
              دقت پاسخ‌گویی: {{ faNum(accuracyRate) }}٪
            </div>
          </div>
        </div>

        <!-- 2. ANSWER SUMMARY BAR & PILL STATS -->
        <div class="card p-4 sm:p-5 space-y-3 bg-white border border-line shadow-sm">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 class="font-extrabold text-sm sm:text-base text-ink">توزیع پاسخ‌ها به ۱۲۰ سؤال آزمون</h3>
              <p class="text-xs text-[#5A6E99]">نسبت سؤالات درست، نادرست (نمره منفی) و بی‌پاسخ</p>
            </div>
            <div class="flex flex-wrap items-center gap-3 text-xs font-black">
              <span class="inline-flex items-center gap-1.5 text-ok bg-[#E6F7EE] px-2.5 py-1 rounded-xl">
                <span class="w-2.5 h-2.5 rounded-full bg-ok"></span>
                <span>درست: {{ faNum(report.overall_correct) }} سؤال</span>
              </span>
              <span class="inline-flex items-center gap-1.5 text-late bg-[#FDECEC] px-2.5 py-1 rounded-xl">
                <span class="w-2.5 h-2.5 rounded-full bg-late"></span>
                <span>نادرست: {{ faNum(report.overall_wrong) }} سؤال</span>
              </span>
              <span class="inline-flex items-center gap-1.5 text-[#5A6E99] bg-slate-100 px-2.5 py-1 rounded-xl">
                <span class="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
                <span>نزده: {{ faNum(report.overall_unanswered) }} سؤال</span>
              </span>
            </div>
          </div>

          <!-- Visual segmented bar -->
          <div class="h-4 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
            <div 
              class="bg-ok h-full transition-all duration-700 hover:brightness-110" 
              :style="{ width: `${(report.overall_correct / 120) * 100}%` }"
              :title="`درست: ${report.overall_correct} سوال`"
            ></div>
            <div 
              class="bg-late h-full transition-all duration-700 hover:brightness-110" 
              :style="{ width: `${(report.overall_wrong / 120) * 100}%` }"
              :title="`نادرست: ${report.overall_wrong} سوال`"
            ></div>
            <div 
              class="bg-slate-300 h-full transition-all duration-700" 
              :style="{ width: `${(report.overall_unanswered / 120) * 100}%` }"
              :title="`نزده: ${report.overall_unanswered} سوال`"
            ></div>
          </div>
        </div>

        <!-- 3. THREE CATEGORY BREAKDOWN CARDS (عمومی، اختصاصی، هوش) -->
        <div class="space-y-2">
          <h3 class="font-extrabold text-sm sm:text-base text-ink flex items-center gap-2">
            <i data-lucide="layers" class="w-4 h-4 text-royal"></i>
            <span>نتایج به تفکیک دسته‌های سه‌گانه</span>
          </h3>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div 
              v-for="cat in report.categories?.filter(c => c.name !== 'کل')" 
              :key="cat.name"
              class="card p-4 bg-white border border-line shadow-sm hover:shadow-md transition-all space-y-3"
            >
              <div class="flex items-center justify-between border-b border-line/60 pb-2.5">
                <div class="flex items-center gap-2">
                  <div 
                    class="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs"
                    :class="getCategoryBg(cat.name)"
                  >
                    <i :data-lucide="getCategoryIcon(cat.name)" class="w-4 h-4"></i>
                  </div>
                  <div>
                    <h4 class="font-black text-sm text-ink">{{ cat.label || cat.name }}</h4>
                    <p class="text-[11px] text-[#5A6E99]">{{ faNum(cat.count) }} سؤال آزمون</p>
                  </div>
                </div>
                <span class="tag text-xs font-black" :class="cat.percentage >= 50 ? 'bg-[#E6F7EE] text-ok' : (cat.percentage >= 25 ? 'bg-sun/20 text-[#7A5600]' : 'bg-[#FDECEC] text-late')">
                  {{ faNum(cat.percentage) }}٪
                </span>
              </div>

              <div class="grid grid-cols-2 gap-2 text-xs">
                <div class="bg-slate-50 p-2 rounded-xl">
                  <span class="text-[10px] text-[#5A6E99] block font-bold">تراز زیرگروه</span>
                  <span class="font-black text-ink text-sm">{{ faNum(cat.traz) }}</span>
                </div>
                <div class="bg-slate-50 p-2 rounded-xl">
                  <span class="text-[10px] text-[#5A6E99] block font-bold">رتبه کشوری</span>
                  <span class="font-black text-ink text-sm">{{ faNum(cat.rank_all) }}</span>
                </div>
              </div>

              <div class="flex items-center justify-between text-[11px] text-[#5A6E99] pt-1">
                <span class="text-ok font-bold">✓ {{ faNum(cat.correct) }} درست</span>
                <span class="text-late font-bold">✗ {{ faNum(cat.wrong) }} نادرست</span>
                <span class="text-slate-500 font-bold">○ {{ faNum(cat.unanswered) }} نزده</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 4. SUBJECT BREAKDOWN TABLE (جدول تفکیکی ۷ درس) -->
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <h3 class="font-extrabold text-sm sm:text-base text-ink flex items-center gap-2">
              <i data-lucide="book-open-check" class="w-4 h-4 text-royal"></i>
              <span>کارنامه تفکیکی دروس (۷ درس تخصصی و عمومی)</span>
            </h3>
            <span class="text-xs text-[#5A6E99] font-bold hidden sm:inline">نمره منفی ۱/۳ لحاظ گردیده است</span>
          </div>

          <div class="card overflow-hidden border border-line bg-white shadow-sm">
            <div class="overflow-x-auto">
              <table class="w-full text-right text-xs">
                <thead>
                  <tr class="bg-slate-100/80 text-[#5A6E99] font-extrabold border-b border-line text-[11px]">
                    <th class="p-3 pr-4">نام درس</th>
                    <th class="p-3 text-center">تعداد</th>
                    <th class="p-3 text-center text-ok font-black">درست</th>
                    <th class="p-3 text-center text-late font-black">نادرست</th>
                    <th class="p-3 text-center text-slate-500">نزده</th>
                    <th class="p-3">درصد عملکرد</th>
                    <th class="p-3 text-center">تراز</th>
                    <th class="p-3 text-center">رتبه مرکز</th>
                    <th class="p-3 text-center pl-4">رتبه کل</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-line/60">
                  <tr 
                    v-for="sub in report.subjects" 
                    :key="sub.name"
                    class="hover:bg-blue-50/40 transition-colors font-medium text-ink"
                  >
                    <td class="p-3 pr-4 font-black flex items-center gap-2">
                      <div 
                        class="w-7 h-7 rounded-xl flex items-center justify-center shrink-0" 
                        :style="{ backgroundColor: `${sub.color}15`, color: sub.color }"
                      >
                        <i :data-lucide="sub.icon || 'book-open'" class="w-3.5 h-3.5"></i>
                      </div>
                      <span class="text-xs">{{ sub.name }}</span>
                    </td>
                    <td class="p-3 text-center font-bold text-[#5A6E99]">{{ faNum(sub.count) }}</td>
                    <td class="p-3 text-center font-black text-ok bg-emerald-50/30">{{ faNum(sub.correct) }}</td>
                    <td class="p-3 text-center font-black text-late bg-red-50/30">{{ faNum(sub.wrong) }}</td>
                    <td class="p-3 text-center text-slate-400 font-bold">{{ faNum(sub.unanswered) }}</td>
                    <td class="p-3 min-w-[130px]">
                      <div class="flex items-center gap-2">
                        <span 
                          class="font-black text-xs min-w-[36px]"
                          :class="sub.percentage >= 60 ? 'text-ok' : (sub.percentage >= 30 ? 'text-royal' : (sub.percentage >= 0 ? 'text-amber-600' : 'text-late'))"
                        >
                          {{ faNum(sub.percentage) }}٪
                        </span>
                        <div class="w-20 h-2 bg-slate-100 rounded-full overflow-hidden shrink-0">
                          <div 
                            class="h-full rounded-full transition-all duration-500"
                            :class="sub.percentage >= 60 ? 'bg-ok' : (sub.percentage >= 30 ? 'bg-royal' : (sub.percentage >= 0 ? 'bg-amber-500' : 'bg-late'))"
                            :style="{ width: `${Math.max(0, Math.min(100, sub.percentage))}%` }"
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td class="p-3 text-center font-black text-sm" :class="sub.traz >= 6000 ? 'text-ok' : (sub.traz >= 5000 ? 'text-royal' : 'text-ink')">
                      {{ faNum(sub.traz) }}
                    </td>
                    <td class="p-3 text-center font-bold text-slate-600">{{ faNum(sub.rank_center) }}</td>
                    <td class="p-3 text-center font-bold text-slate-600 pl-4">{{ faNum(sub.rank_all) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- 5. SMART AI ADVICE & STRENGTH/WEAKNESS -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <!-- Strengths -->
          <div class="card p-4 sm:p-5 bg-gradient-to-br from-emerald-50/60 to-white border border-emerald-200 space-y-2">
            <div class="flex items-center gap-2 text-ok font-black text-sm">
              <i data-lucide="sparkles" class="w-4 h-4"></i>
              <span>نقطه قوت برتر در آزمون</span>
            </div>
            <p v-if="bestSubject" class="text-xs text-ink leading-relaxed">
              درخشش در درس <b>{{ bestSubject.name }}</b> با تراز <b>{{ faNum(bestSubject.traz) }}</b> و درصد <b>{{ faNum(bestSubject.percentage) }}٪</b>، رتبه <b>{{ faNum(bestSubject.rank_all) }}</b> کشوری را به ارمغان آورده است. این مبحث از پایه‌های موفقیت آزمون ورودی است.
            </p>
          </div>

          <!-- Weakness / Growth Area -->
          <div class="card p-4 sm:p-5 bg-gradient-to-br from-amber-50/60 to-white border border-amber-200 space-y-2">
            <div class="flex items-center gap-2 text-amber-700 font-black text-sm">
              <i data-lucide="trending-up" class="w-4 h-4"></i>
              <span>فرصت رشد و ارتقای نمره</span>
            </div>
            <p v-if="worstSubject" class="text-xs text-ink leading-relaxed">
              در درس <b>{{ worstSubject.name }}</b> به دلیل <b>{{ faNum(worstSubject.wrong) }} پاسخ نادرست</b>، نمره منفی قابل توجهی ایجاد شده است. با مدیریت پاسخ ندادن به شک‌دارها، تراز شما تا ۵۰۰ واحد افزایش می‌یابد.
            </p>
          </div>
        </div>

        <!-- 6. INTERACTIVE 120 DIGITAL BUBBLE SHEET (پاسخ‌برگ ۱۲۰ تستی تعاملی) -->
        <div class="card p-4 sm:p-5 space-y-4 bg-white border border-line shadow-sm">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-line pb-3">
            <div>
              <h3 class="font-black text-sm sm:text-base text-ink flex items-center gap-2">
                <i data-lucide="grid-3x3" class="w-4 h-4 text-royal"></i>
                <span>پاسخ‌برگ دیجیتال و تعاملی (سؤالات ۱ تا ۱۲۰)</span>
              </h3>
              <p class="text-xs text-[#5A6E99]">گزینه انتخابی، درستی/نادرستی کلید آزمون</p>
            </div>

            <!-- Filter buttons -->
            <div class="flex flex-wrap items-center gap-1.5 text-xs font-bold">
              <button 
                @click="bubbleFilter = 'all'"
                class="px-3 py-1 rounded-xl transition-all"
                :class="bubbleFilter === 'all' ? 'bg-royal text-white font-black' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'"
              >
                همه ({{ faNum(120) }})
              </button>
              <button 
                @click="bubbleFilter = 'correct'"
                class="px-3 py-1 rounded-xl transition-all"
                :class="bubbleFilter === 'correct' ? 'bg-ok text-white font-black' : 'bg-emerald-50 text-ok hover:bg-emerald-100'"
              >
                درست‌ها ({{ faNum(report.overall_correct) }})
              </button>
              <button 
                @click="bubbleFilter = 'wrong'"
                class="px-3 py-1 rounded-xl transition-all"
                :class="bubbleFilter === 'wrong' ? 'bg-late text-white font-black' : 'bg-red-50 text-late hover:bg-red-100'"
              >
                نادرست‌ها ({{ faNum(report.overall_wrong) }})
              </button>
              <button 
                @click="bubbleFilter = 'unanswered'"
                class="px-3 py-1 rounded-xl transition-all"
                :class="bubbleFilter === 'unanswered' ? 'bg-slate-700 text-white font-black' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'"
              >
                نزده‌ها ({{ faNum(report.overall_unanswered) }})
              </button>
            </div>
          </div>

          <!-- Bubble Grid -->
          <div class="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
            <div 
              v-for="ans in filteredAnswers" 
              :key="ans.q"
              class="p-2 rounded-xl border flex items-center justify-between text-xs transition-all"
              :class="getAnswerBubbleClass(ans)"
            >
              <span class="font-bold text-[11px] text-slate-500">#{{ faNum(ans.q) }}</span>
              <div class="flex items-center gap-1 font-black">
                <span v-if="ans.choice > 0" class="w-5 h-5 rounded-lg flex items-center justify-center text-xs shadow-xs" :class="getChoiceBadgeClass(ans)">
                  {{ faNum(ans.choice) }}
                </span>
                <span v-else class="text-[10px] text-slate-400 font-bold">نزده</span>
                <i v-if="ans.status === 'correct'" data-lucide="check" class="w-3.5 h-3.5 text-ok"></i>
                <i v-else-if="ans.status === 'wrong'" data-lucide="x" class="w-3.5 h-3.5 text-late"></i>
              </div>
            </div>
          </div>
        </div>

      </div>

      <!-- ================= MODAL FOOTER ================= -->
      <div class="p-4 bg-white border-t border-line flex flex-wrap items-center justify-between gap-3 shrink-0 print:hidden">
        <div class="text-xs text-[#5A6E99] font-bold flex items-center gap-2">
          <i data-lucide="shield-check" class="w-4 h-4 text-ok"></i>
          <span>کارنامه ثبت‌شده در پایگاه داده پلتفرم رشد و تأییدشده توسط کانون</span>
        </div>
        <div class="flex items-center gap-2">
          <button @click="printReport" class="btn btn-soft !min-h-[38px] text-xs font-black">
            <i data-lucide="printer" class="w-4 h-4"></i>
            <span>چاپ کارنامه</span>
          </button>
          <button @click="$emit('close')" class="btn btn-sun !min-h-[38px] text-xs font-black text-ink px-6">
            <span>بستن کارنامه</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted, watch } from 'vue';
import { faNum } from '../utils';

const props = defineProps({
  report: {
    type: Object,
    required: true
  }
});

defineEmits(['close']);

const bubbleFilter = ref('all');

onMounted(() => {
  nextTick(() => {
    if (window.lucide) window.lucide.createIcons();
  });
});

watch(bubbleFilter, () => {
  nextTick(() => {
    if (window.lucide) window.lucide.createIcons();
  });
});

const filteredAnswers = computed(() => {
  const all = props.report.answers || [];
  if (bubbleFilter.value === 'all') return all;
  if (bubbleFilter.value === 'correct') return all.filter(a => a.status === 'correct');
  if (bubbleFilter.value === 'wrong') return all.filter(a => a.status === 'wrong');
  if (bubbleFilter.value === 'unanswered') return all.filter(a => a.status === 'unanswered' || a.choice === 0);
  return all;
});

const bestSubject = computed(() => {
  const subs = props.report.subjects || [];
  if (!subs.length) return null;
  return [...subs].sort((a, b) => (b.traz || 0) - (a.traz || 0))[0];
});

const worstSubject = computed(() => {
  const subs = props.report.subjects || [];
  if (!subs.length) return null;
  return [...subs].sort((a, b) => (a.traz || 0) - (b.traz || 0))[0];
});

const accuracyRate = computed(() => {
  const correct = props.report.overall_correct || 0;
  const wrong = props.report.overall_wrong || 0;
  const answered = correct + wrong;
  if (answered === 0) return 0;
  return Math.round((correct / answered) * 100);
});

function getTrazLevel(traz) {
  if (traz >= 6500) return 'سطح عالی (جزو ۵٪ برتر کشور)';
  if (traz >= 6000) return 'بسیار خوب (شانس قبولی بالا در سمپاد)';
  if (traz >= 5000) return 'متوسط رو به بالا (مناسب برای مدارس نمونه)';
  return 'نیازمند تقویت و تمرین تست‌زنی';
}

function getCategoryIcon(name) {
  if (name === 'عمومی') return 'book-open';
  if (name === 'اختصاصی') return 'flask-conical';
  if (name === 'هوش') return 'brain';
  return 'award';
}

function getCategoryBg(name) {
  if (name === 'عمومی') return 'bg-blue-100 text-royal';
  if (name === 'اختصاصی') return 'bg-amber-100 text-amber-700';
  if (name === 'هوش') return 'bg-purple-100 text-purple-700';
  return 'bg-slate-100 text-slate-700';
}

function getAnswerBubbleClass(ans) {
  if (ans.status === 'correct') {
    return 'bg-[#E6F7EE]/70 border-emerald-300';
  }
  if (ans.status === 'wrong') {
    return 'bg-[#FDECEC]/70 border-rose-300';
  }
  return 'bg-slate-50 border-slate-200';
}

function getChoiceBadgeClass(ans) {
  if (ans.status === 'correct') {
    return 'bg-ok text-white';
  }
  if (ans.status === 'wrong') {
    return 'bg-late text-white';
  }
  return 'bg-slate-200 text-slate-700';
}

function printReport() {
  window.print();
}
</script>

<style scoped>
@media print {
  body * {
    visibility: hidden;
  }
  .card, table, tr, td, th {
    break-inside: avoid;
  }
}
</style>

