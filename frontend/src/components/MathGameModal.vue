<template>
  <div class="fixed inset-0 z-[70] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 select-none">
    <div class="w-full max-w-xl bg-white rounded-[32px] shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[95vh] rise">
      
      <!-- Game Top Bar -->
      <header class="brand-bg px-5 py-3.5 text-white flex items-center justify-between shrink-0 relative overflow-hidden">
        <div class="dots absolute inset-0 opacity-30"></div>
        <div class="flex items-center gap-2.5 relative z-10">
          <div class="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur border border-white/25 flex items-center justify-center text-sun shadow-sm">
            <i data-lucide="gamepad-2" class="w-5 h-5"></i>
          </div>
          <div>
            <h2 class="font-extrabold text-sm sm:text-base leading-tight">قهرمان ریاضی ۴ دبستان</h2>
            <p class="text-[11px] text-white/75">سفر در دنیای کسرها، زاویه‌ها و ضرب سریع</p>
          </div>
        </div>

        <div class="flex items-center gap-2 relative z-10">
          <!-- Sound toggle -->
          <button 
            @click="soundEnabled = !soundEnabled" 
            class="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center text-white/90 hover:bg-white/25 transition-all border-none cursor-pointer"
            :title="soundEnabled ? 'قطع صدا' : 'وصل صدا'"
          >
            <i :data-lucide="soundEnabled ? 'volume-2' : 'volume-x'" class="w-4 h-4"></i>
          </button>
          <!-- Close button -->
          <button 
            @click="$emit('close')" 
            class="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center text-white hover:bg-white/25 transition-all border-none cursor-pointer"
            title="خروج از بازی"
          >
            <i data-lucide="x" class="w-5 h-5"></i>
          </button>
        </div>
      </header>

      <!-- Game Status Ribbon (Active during play) -->
      <div v-if="gameState === 'playing'" class="bg-slate-900 text-white px-5 py-2.5 flex items-center justify-between text-xs font-bold border-b border-slate-800">
        <!-- Score & Streak -->
        <div class="flex items-center gap-3">
          <div class="flex items-center gap-1.5 text-sun">
            <i data-lucide="sparkles" class="w-4 h-4"></i>
            <span>امتیاز: <b class="text-sm">{{ faNum(score) }}</b></span>
          </div>
          <div v-if="streak >= 2" class="px-2 py-0.5 rounded-full bg-amber-500/20 text-sun text-[11px] font-black animate-pulse flex items-center gap-1">
            <i data-lucide="flame" class="w-3.5 h-3.5 text-orange-400"></i>
            <span>کمبو x{{ faNum(streak) }}</span>
          </div>
        </div>

        <!-- Timer Bar -->
        <div class="flex items-center gap-2">
          <i data-lucide="timer" :class="['w-4 h-4', timeLeft <= 5 ? 'text-late animate-bounce' : 'text-sky']"></i>
          <span :class="['font-black text-sm', timeLeft <= 5 ? 'text-late' : 'text-white']">
            {{ faNum(timeLeft) }} ثانیه
          </span>
        </div>

        <!-- Health / Lives -->
        <div class="flex items-center gap-1">
          <i 
            v-for="i in 3" 
            :key="i"
            data-lucide="heart" 
            :class="['w-4 h-4 transition-all', i <= lives ? 'text-red-500 fill-red-500' : 'text-slate-600']"
          ></i>
        </div>
      </div>

      <!-- Main Game Viewport -->
      <div class="flex-1 overflow-y-auto p-4 sm:p-6 bg-mist flex flex-col justify-between">
        
        <!-- Screen 1: Start Screen & Topic Selection -->
        <div v-if="gameState === 'start'" class="space-y-4 my-auto text-center rise">
          <div class="w-20 h-20 mx-auto rounded-3xl brand-bg flex items-center justify-center text-sun shadow-xl shadow-royal/30">
            <i data-lucide="award" class="w-10 h-10"></i>
          </div>
          <div>
            <h3 class="text-2xl font-black text-ink">میدان چالش ریاضی پایه چهارم</h3>
            <p class="text-xs sm:text-sm text-[#5A6E99] max-w-sm mx-auto mt-1">
              موضوع دلخواهت از کتاب ریاضی ۴ دبستان رو انتخاب کن، سریع پاسخ بده و رکورد ثبت کن!
            </p>
          </div>

          <!-- Category Selection Cards -->
          <div class="grid grid-cols-2 gap-2.5 pt-2 text-right">
            <button 
              @click="selectedTopic = 'fractions'"
              :class="['p-3.5 rounded-2xl border-2 transition-all flex items-center gap-3 cursor-pointer', selectedTopic === 'fractions' ? 'border-royal bg-white shadow-md' : 'border-line bg-white/70 hover:bg-white']"
            >
              <div class="w-10 h-10 rounded-xl bg-blue-100 text-royal flex items-center justify-center shrink-0">
                <i data-lucide="pie-chart" class="w-5 h-5"></i>
              </div>
              <div>
                <p class="font-extrabold text-xs sm:text-sm text-ink">کسر و عدد مخلوط</p>
                <p class="text-[10px] text-[#5A6E99]">فصل ۲ - جمع و مقایسه</p>
              </div>
            </button>

            <button 
              @click="selectedTopic = 'mult'"
              :class="['p-3.5 rounded-2xl border-2 transition-all flex items-center gap-3 cursor-pointer', selectedTopic === 'mult' ? 'border-royal bg-white shadow-md' : 'border-line bg-white/70 hover:bg-white']"
            >
              <div class="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <i data-lucide="calculator" class="w-5 h-5"></i>
              </div>
              <div>
                <p class="font-extrabold text-xs sm:text-sm text-ink">ضرب و تقسیم سرعتی</p>
                <p class="text-[10px] text-[#5A6E99]">فصل ۳ - تکنیک‌های ذهنی</p>
              </div>
            </button>

            <button 
              @click="selectedTopic = 'angles'"
              :class="['p-3.5 rounded-2xl border-2 transition-all flex items-center gap-3 cursor-pointer', selectedTopic === 'angles' ? 'border-royal bg-white shadow-md' : 'border-line bg-white/70 hover:bg-white']"
            >
              <div class="w-10 h-10 rounded-xl bg-emerald-100 text-ok flex items-center justify-center shrink-0">
                <i data-lucide="compass" class="w-5 h-5"></i>
              </div>
              <div>
                <p class="font-extrabold text-xs sm:text-sm text-ink">زاویه و هندسه</p>
                <p class="text-[10px] text-[#5A6E99]">فصل ۴ - تند، راست، باز</p>
              </div>
            </button>

            <button 
              @click="selectedTopic = 'all'"
              :class="['p-3.5 rounded-2xl border-2 transition-all flex items-center gap-3 cursor-pointer', selectedTopic === 'all' ? 'border-royal bg-white shadow-md' : 'border-line bg-white/70 hover:bg-white']"
            >
              <div class="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                <i data-lucide="zap" class="w-5 h-5"></i>
              </div>
              <div>
                <p class="font-extrabold text-xs sm:text-sm text-ink">چالش ترکیبی نخبگان</p>
                <p class="text-[10px] text-[#5A6E99]">همه مباحث کتاب ۴</p>
              </div>
            </button>
          </div>

          <!-- Difficulty Pill Selector -->
          <div class="flex items-center justify-center gap-2 pt-2">
            <span class="text-xs text-[#5A6E99] font-bold">سطح سرعت:</span>
            <button 
              @click="difficulty = 'easy'" 
              :class="['px-3 py-1 rounded-xl text-xs font-bold transition-all border-none cursor-pointer', difficulty === 'easy' ? 'bg-ok text-white shadow' : 'bg-white text-slate-600']"
            >
              آرام (۱۵ ثانیه)
            </button>
            <button 
              @click="difficulty = 'medium'" 
              :class="['px-3 py-1 rounded-xl text-xs font-bold transition-all border-none cursor-pointer', difficulty === 'medium' ? 'bg-royal text-white shadow' : 'bg-white text-slate-600']"
            >
              عادی (۱۰ ثانیه)
            </button>
            <button 
              @click="difficulty = 'hard'" 
              :class="['px-3 py-1 rounded-xl text-xs font-bold transition-all border-none cursor-pointer', difficulty === 'hard' ? 'bg-late text-white shadow' : 'bg-white text-slate-600']"
            >
              تیزهوشان (۶ ثانیه)
            </button>
          </div>

          <button 
            @click="startGame" 
            class="btn btn-royal w-full !min-h-[52px] text-base font-black shadow-xl mt-3"
          >
            <i data-lucide="play" class="w-5 h-5"></i>
            <span>شروع بازی و مسابقه</span>
          </button>
        </div>

        <!-- Screen 2: Active Playing Screen -->
        <div v-else-if="gameState === 'playing'" class="space-y-4 my-auto rise">
          <!-- Question Card -->
          <div class="card p-5 sm:p-6 text-center space-y-3 relative overflow-hidden bg-white shadow-lg border-2 border-slate-100">
            <!-- Progress Pill -->
            <div class="flex items-center justify-between text-xs text-[#5A6E99] font-bold">
              <span class="tag bg-mist text-royal">سوال {{ faNum(questionIndex + 1) }} از ۱۰</span>
              <span class="tag bg-amber-50 text-amber-800">{{ currentQuestion.topicLabel }}</span>
            </div>

            <!-- Visual Question / Illustration (LaTeX / Geometric SVG) -->
            <div class="py-2 flex flex-col items-center justify-center min-h-[90px]">
              <p class="text-lg sm:text-xl font-black text-ink leading-relaxed">
                {{ currentQuestion.questionText }}
              </p>

              <!-- Optional Visual Element (e.g. Fraction Pizza or Angle SVG) -->
              <div v-if="currentQuestion.visualSvg" class="mt-2" v-html="currentQuestion.visualSvg"></div>
            </div>

            <!-- Feedback Overlay Animation (Correct / Wrong) -->
            <div 
              v-if="answerFeedback" 
              :class="[
                'absolute inset-0 flex items-center justify-center text-white text-xl font-black backdrop-blur-sm transition-all',
                answerFeedback === 'correct' ? 'bg-emerald-600/90' : 'bg-rose-600/90'
              ]"
            >
              <div class="flex items-center gap-2 animate-bounce">
                <i :data-lucide="answerFeedback === 'correct' ? 'check-circle-2' : 'x-circle'" class="w-8 h-8"></i>
                <span>{{ answerFeedback === 'correct' ? 'آفرین! درسته (+۱۵ امتیاز)' : 'اشتباه شد! فرصت بعد' }}</span>
              </div>
            </div>
          </div>

          <!-- Answer Options Grid (Large 4 Touch Cards) -->
          <div class="grid grid-cols-2 gap-2.5 sm:gap-3">
            <button 
              v-for="(opt, idx) in currentQuestion.options" 
              :key="idx"
              @click="submitAnswer(idx)"
              :disabled="!!answerFeedback"
              class="p-4 rounded-2xl bg-white border-2 border-line hover:border-royal hover:bg-[#EEF4FF] transition-all flex items-center justify-center text-base sm:text-lg font-black text-ink shadow-sm active:scale-95 cursor-pointer"
            >
              <span>{{ opt }}</span>
            </button>
          </div>
        </div>

        <!-- Screen 3: Game Over & Trophy Victory -->
        <div v-else-if="gameState === 'gameover'" class="space-y-4 my-auto text-center rise">
          <div class="w-20 h-20 mx-auto rounded-full flex items-center justify-center shadow-2xl relative" style="background:linear-gradient(135deg,#FFD25A,#FFC531)">
            <i data-lucide="trophy" class="w-10 h-10 text-ink"></i>
            <span class="absolute -top-1 -right-1 text-2xl">✨</span>
          </div>

          <div>
            <h3 class="text-2xl font-black text-ink">
              {{ score >= 80 ? 'شاهکار کردی قهرمان!' : (score >= 40 ? 'تلاش خیلی خوبی بود!' : 'نیاز به تمرین بیشتر داری!') }}
            </h3>
            <p class="text-xs sm:text-sm text-[#5A6E99] mt-1">
              نتیجه بازی آموزشی ریاضی چهارم دبستان:
            </p>
          </div>

          <!-- Stats Grid -->
          <div class="grid grid-cols-3 gap-2 py-2">
            <div class="card p-3 bg-white">
              <p class="text-[11px] text-[#5A6E99]">امتیاز نهایی</p>
              <p class="text-xl font-black text-royal mt-0.5">{{ faNum(score) }}</p>
            </div>
            <div class="card p-3 bg-white">
              <p class="text-[11px] text-[#5A6E99]">پاسخ‌های درست</p>
              <p class="text-xl font-black text-ok mt-0.5">{{ faNum(correctCount) }} از ۱۰</p>
            </div>
            <div class="card p-3 bg-white">
              <p class="text-[11px] text-[#5A6E99]">بیشترین کمبو</p>
              <p class="text-xl font-black text-amber-600 mt-0.5">{{ faNum(maxStreak) }}x</p>
            </div>
          </div>

          <div class="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900 font-bold flex items-center gap-2">
            <i data-lucide="sparkles" class="w-5 h-5 text-ok shrink-0"></i>
            <span>امتیاز این بازی به حساب پلتفرم رشد شما افزوده شد!</span>
          </div>

          <div class="grid grid-cols-2 gap-2.5 pt-2">
            <button @click="restartGame" class="btn btn-royal !min-h-[46px] text-xs sm:text-sm font-black">
              <i data-lucide="rotate-ccw" class="w-4 h-4"></i>
              <span>بازی مجدد</span>
            </button>
            <button @click="$emit('close')" class="btn btn-soft !min-h-[46px] text-xs sm:text-sm font-black">
              <i data-lucide="arrow-left" class="w-4 h-4"></i>
              <span>بازگشت به پنل</span>
            </button>
          </div>
        </div>

      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue';
import { faNum, playBeep, refreshIcons } from '../utils';

const emit = defineEmits(['close', 'add-points']);

const gameState = ref('start'); // 'start' | 'playing' | 'gameover'
const selectedTopic = ref('all'); // 'fractions' | 'mult' | 'angles' | 'all'
const difficulty = ref('medium'); // 'easy' (15s) | 'medium' (10s) | 'hard' (6s)
const soundEnabled = ref(true);

const score = ref(0);
const lives = ref(3);
const streak = ref(0);
const maxStreak = ref(0);
const questionIndex = ref(0);
const correctCount = ref(0);
const timeLeft = ref(10);
const answerFeedback = ref(null); // 'correct' | 'wrong'

let timerInterval = null;

// Audio sound effects via Web Audio API
function playSound(type) {
  if (!soundEnabled.value) return;
  if (type === 'correct') {
    playBeep(880, 0.15);
    setTimeout(() => playBeep(1320, 0.25), 100);
  } else if (type === 'wrong') {
    playBeep(260, 0.3);
  } else if (type === 'tick') {
    playBeep(500, 0.05);
  } else if (type === 'win') {
    playBeep(523, 0.15);
    setTimeout(() => playBeep(659, 0.15), 150);
    setTimeout(() => playBeep(784, 0.25), 300);
  }
}

// ---------------- 4TH GRADE MATH QUESTION BANK ----------------
const questionBank = [
  // کسرها و اعداد مخلوط (فصل ۲ ریاضی چهارم)
  {
    topic: 'fractions',
    topicLabel: 'کسر و مساحت',
    questionText: 'حاصل جمع کسر ۲/۵ با ۱/۵ کدام است؟',
    options: ['۳/۵', '۳/۱۰', '۲/۱۰', '۴/۵'],
    correctIndex: 0,
    visualSvg: `<svg width="120" height="32" viewBox="0 0 120 32" fill="none"><rect width="120" height="32" rx="8" fill="#E8F0FF" stroke="#0A4BD6"/><rect width="24" height="32" fill="#1E90FF"/><rect x="24" width="24" height="32" fill="#1E90FF"/><rect x="48" width="24" height="32" fill="#FFC531"/></svg>`
  },
  {
    topic: 'fractions',
    topicLabel: 'ساده کردن کسر',
    questionText: 'کدام کسر با کسر ۴/۶ مساوی (هم‌ارز) است؟',
    options: ['۲/۳', '۱/۲', '۳/۴', '۲/۵'],
    correctIndex: 0
  },
  {
    topic: 'fractions',
    topicLabel: 'عدد مخلوط',
    questionText: 'کسر بزرگ‌تر از واحد ۷/۴ برابر با کدام عدد مخلوط است؟',
    options: ['۱ و ۳/۴', '۲ و ۱/۴', '۱ و ۱/۴', '۳ و ۱/۴'],
    correctIndex: 0
  },
  {
    topic: 'fractions',
    topicLabel: 'مقایسه کسرها',
    questionText: 'کدام یک از کسرهای زیر بزرگ‌تر است؟',
    options: ['۵/۷', '۳/۷', '۲/۷', '۴/۷'],
    correctIndex: 0
  },
  {
    topic: 'fractions',
    topicLabel: 'کسر و شکل',
    questionText: 'اگر یک شکلات ۸ قسمت مساوی باشد و ۳ قسمت آن را بخوریم، چه کسری باقی مانده؟',
    options: ['۵/۸', '۳/۸', '۲/۸', '۸/۵'],
    correctIndex: 0
  },

  // ضرب و تقسیم (فصل ۳ ریاضی چهارم)
  {
    topic: 'mult',
    topicLabel: 'ضرب سریع',
    questionText: 'حاصل ضرب ذهنی ۴۰ × ۳۰ چند است؟',
    options: ['۱۲۰۰', '۱۲', '۱۲۰', '۲۴۰۰'],
    correctIndex: 0
  },
  {
    topic: 'mult',
    topicLabel: 'تقسیم با باقیمانده',
    questionText: 'باقیمانده تقسیم ۲۷ بر ۴ چند است؟',
    options: ['۳', '۱', '۲', '۰'],
    correctIndex: 0
  },
  {
    topic: 'mult',
    topicLabel: 'ضرب دو رقمی',
    questionText: 'حاصل ضرب ۲۵ × ۴ برابر است با:',
    options: ['۱۰۰', '۹۰', '۱۱۰', '۸۰'],
    correctIndex: 0
  },
  {
    topic: 'mult',
    topicLabel: 'تقسیم بر ۱۰',
    questionText: 'خارج قسمت تقسیم ۴۸۰ بر ۱۰ چیست؟',
    options: ['۴۸', '۴۸۰', '۴', '۴۸۰۰'],
    correctIndex: 0
  },
  {
    topic: 'mult',
    topicLabel: 'تکنیک ضرب',
    questionText: 'اگر قیمت ۶ دفتر ۳۰ هزار تومان باشد، قیمت ۱ دفتر چند هزار تومان است؟',
    options: ['۵', '۶', '۴', '۱۰'],
    correctIndex: 0
  },

  // زاویه و هندسه (فصل ۴ ریاضی چهارم)
  {
    topic: 'angles',
    topicLabel: 'شناخت زاویه',
    questionText: 'زاویه‌ای که اندازه آن از زاویه راست (۹۰ درجه) کمتر باشد چه نام دارد؟',
    options: ['زاویه تند (حاده)', 'زاویه باز (منفرجه)', 'زاویه نیم‌صفحه', 'زاویه تمام'],
    correctIndex: 0,
    visualSvg: `<svg width="70" height="45" viewBox="0 0 70 45" fill="none"><path d="M60 40H15L45 10" stroke="#0A4BD6" stroke-width="4" stroke-linecap="round"/><path d="M28 40A15 15 0 0 0 24 30" stroke="#FFC531" stroke-width="3"/></svg>`
  },
  {
    topic: 'angles',
    topicLabel: 'مجموع زوایای مثلث',
    questionText: 'مجموع زاویه‌های داخلی هر مثلث همیشه چند درجه است؟',
    options: ['۱۸۰ درجه', '۹۰ درجه', '۳۶۰ درجه', '۲۷۰ درجه'],
    correctIndex: 0
  },
  {
    topic: 'angles',
    topicLabel: 'زاویه راست',
    questionText: 'عقربه‌های ساعت در ساعت ۳:۰۰ دقیقاً چه زاویه‌ای تشکیل می‌دهند؟',
    options: ['زاویه راست (۹۰°)', 'زاویه تند', 'زاویه باز', 'زاویه نیم‌صفحه'],
    correctIndex: 0
  },
  {
    topic: 'angles',
    topicLabel: 'چهارضلعی‌ها',
    questionText: 'کدام شکل چهارضلعی دارای ۴ زاویه راست و ۴ ضلع مساوی است؟',
    options: ['مربع', 'مستطیل', 'لوزی', 'ذوزنقه'],
    correctIndex: 0
  },
  {
    topic: 'angles',
    topicLabel: 'اندازه‌گیری',
    questionText: 'وسیله استاندارد برای اندازه‌گیری زاویه‌ها چیست؟',
    options: ['نقاله', 'خط‌کش', 'پرگار', 'گونیا'],
    correctIndex: 0
  }
];

const currentQuestions = ref([]);
const currentQuestion = ref(questionBank[0]);

function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function startGame() {
  let pool = questionBank;
  if (selectedTopic.value !== 'all') {
    pool = questionBank.filter(q => q.topic === selectedTopic.value);
  }
  
  // Randomize 10 questions
  currentQuestions.value = shuffle(pool).slice(0, 10);
  // Also randomize options for each question
  currentQuestions.value = currentQuestions.value.map(q => {
    const correctVal = q.options[q.correctIndex];
    const shuffledOpts = shuffle(q.options);
    return {
      ...q,
      options: shuffledOpts,
      correctIndex: shuffledOpts.indexOf(correctVal)
    };
  });

  score.value = 0;
  lives.value = 3;
  streak.value = 0;
  maxStreak.value = 0;
  questionIndex.value = 0;
  correctCount.value = 0;
  gameState.value = 'playing';

  loadQuestion(0);
}

function loadQuestion(idx) {
  questionIndex.value = idx;
  currentQuestion.value = currentQuestions.value[idx];
  answerFeedback.value = null;

  // Set timer based on difficulty
  if (difficulty.value === 'easy') timeLeft.value = 15;
  else if (difficulty.value === 'medium') timeLeft.value = 10;
  else timeLeft.value = 6;

  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    timeLeft.value--;
    if (timeLeft.value <= 3 && timeLeft.value > 0) {
      playSound('tick');
    }
    if (timeLeft.value <= 0) {
      clearInterval(timerInterval);
      timeUp();
    }
  }, 1000);

  nextTick(() => refreshIcons());
}

function submitAnswer(chosenIdx) {
  if (answerFeedback.value) return;
  clearInterval(timerInterval);

  if (chosenIdx === currentQuestion.value.correctIndex) {
    // Correct
    streak.value++;
    if (streak.value > maxStreak.value) maxStreak.value = streak.value;
    const bonus = streak.value >= 3 ? 20 : 15;
    score.value += bonus;
    correctCount.value++;
    answerFeedback.value = 'correct';
    playSound('correct');
  } else {
    // Wrong
    streak.value = 0;
    lives.value--;
    answerFeedback.value = 'wrong';
    playSound('wrong');
  }

  nextTick(() => refreshIcons());

  setTimeout(() => {
    if (lives.value <= 0 || questionIndex.value >= currentQuestions.value.length - 1) {
      endGame();
    } else {
      loadQuestion(questionIndex.value + 1);
    }
  }, 1200);
}

function timeUp() {
  streak.value = 0;
  lives.value--;
  answerFeedback.value = 'wrong';
  playSound('wrong');
  nextTick(() => refreshIcons());

  setTimeout(() => {
    if (lives.value <= 0 || questionIndex.value >= currentQuestions.value.length - 1) {
      endGame();
    } else {
      loadQuestion(questionIndex.value + 1);
    }
  }, 1200);
}

function endGame() {
  clearInterval(timerInterval);
  gameState.value = 'gameover';
  playSound('win');
  emit('add-points', score.value);
  nextTick(() => refreshIcons());
}

function restartGame() {
  gameState.value = 'start';
  nextTick(() => refreshIcons());
}

onMounted(() => {
  refreshIcons();
});

onUnmounted(() => {
  clearInterval(timerInterval);
});
</script>