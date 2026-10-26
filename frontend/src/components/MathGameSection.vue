<template>
  <div class="space-y-4 rise">
    <!-- Header Card -->
    <div class="card p-5 overflow-hidden relative text-white" style="background: radial-gradient(circle at 10% 20%, #1e3a8a, #0b1f4d 90%)">
      <div class="dots absolute inset-0 opacity-30"></div>
      
      <div class="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-2xl bg-amber-400 text-ink flex items-center justify-center font-black text-2xl shadow-lg shrink-0 animate-bounce">
            🚀
          </div>
          <div>
            <div class="flex items-center gap-2">
              <span class="tag bg-sun text-ink font-black text-[10px]">بازی تعاملی اختصاصی</span>
              <span class="text-xs text-white/70">ریاضی چهارم دبستان</span>
            </div>
            <h2 class="text-xl sm:text-2xl font-black mt-1">سفر فضایی کسرها و زاویه‌ها</h2>
            <p class="text-xs text-white/80 mt-0.5">سفینه فضایی رشد را با سوخت کسرها و هدایت زاویه‌ای به کهکشان نخبگان برسانید!</p>
          </div>
        </div>

        <!-- High score & Points badge -->
        <div class="flex items-center gap-2 sm:self-center">
          <div class="px-3.5 py-1.5 rounded-2xl bg-white/10 backdrop-blur border border-white/20 text-xs">
            <span class="text-white/70 block text-[10px]">بهترین رکورد شما</span>
            <span class="font-black text-sun text-sm">{{ faNum(highScore) }} امتیاز</span>
          </div>
          <button 
            @click="soundOn = !soundOn" 
            class="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center border-none text-white cursor-pointer hover:bg-white/25 transition-all"
            :title="soundOn ? 'قطع صدا' : 'وصل صدا'"
          >
            <i :data-lucide="soundOn ? 'volume-2' : 'volume-x'" class="w-5 h-5"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- Active Stage Card -->
    <div class="card p-4 sm:p-6 bg-white relative overflow-hidden min-h-[500px] flex flex-col justify-between shadow-xl">
      
      <!-- Top HUD Ribbon -->
      <div class="flex items-center justify-between p-3 rounded-2xl bg-slate-900 text-white text-xs font-bold mb-4 shadow">
        <!-- Stage & Mission -->
        <div class="flex items-center gap-2">
          <span class="px-2.5 py-1 rounded-xl bg-royal text-white text-[11px] font-black">
            مرحله {{ faNum(currentStage) }} از ۳
          </span>
          <span class="text-slate-300 hidden sm:inline">{{ stageTitles[currentStage - 1] }}</span>
        </div>

        <!-- Score & Multiplier -->
        <div class="flex items-center gap-3">
          <div class="flex items-center gap-1.5 text-sun">
            <i data-lucide="award" class="w-4 h-4"></i>
            <span>امتیاز: <b class="text-sm font-black">{{ faNum(currentScore) }}</b></span>
          </div>

          <!-- Energy/Shield Bar -->
          <div class="flex items-center gap-1">
            <span class="text-[10px] text-slate-400">انرژی:</span>
            <div class="w-16 h-3 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700">
              <div 
                class="h-full rounded-full transition-all duration-300" 
                :class="shipEnergy > 30 ? 'bg-emerald-400' : 'bg-rose-500 animate-pulse'"
                :style="{ width: shipEnergy + '%' }"
              ></div>
            </div>
          </div>
        </div>
      </div>

      <!-- ================= MISSION 1: FRACTION FUEL REFUELING ================= -->
      <div v-if="currentStage === 1" class="space-y-5 my-auto">
        <div class="text-center max-w-md mx-auto space-y-1">
          <span class="tag bg-blue-100 text-royal font-bold text-xs">ماموریت ۱: سوخت‌گیری مخزن کسرها</span>
          <h3 class="text-lg sm:text-xl font-black text-ink">
            مخزن سفینه باید دقیقاً با <span class="text-royal font-extrabold underline text-2xl px-1">{{ faNum(targetFraction.num) }}/{{ faNum(targetFraction.den) }}</span> سوخت پر شود!
          </h3>
          <p class="text-xs text-[#5A6E99]">
            روی کپسول‌های سوختی کلیک کن که مجموع کسر آن‌ها برابر کسر هدف شود.
          </p>
        </div>

        <!-- Interactive Visual Fuel Tank (SVG Glass Tank) -->
        <div class="relative w-full max-w-xs mx-auto h-32 rounded-3xl border-4 border-slate-700 bg-slate-900 p-2 overflow-hidden shadow-inner flex flex-col justify-end">
          <!-- Glass reflection lines -->
          <div class="absolute inset-y-0 left-3 w-1.5 bg-white/20 rounded-full"></div>
          
          <!-- Liquid Level Fill -->
          <div 
            class="w-full rounded-2xl transition-all duration-500 relative flex items-center justify-center text-white font-black text-xs shadow-lg"
            :style="{
              height: Math.min(100, Math.round((currentTankSum / targetFractionVal) * 100)) + '%',
              background: currentTankSum === targetFractionVal ? 'linear-gradient(180deg, #10B981, #059669)' : (currentTankSum > targetFractionVal ? 'linear-gradient(180deg, #EF4444, #B91C1C)' : 'linear-gradient(180deg, #3B82F6, #1D4ED8)')
            }"
          >
            <!-- Animated bubbles -->
            <div class="absolute top-1 left-4 w-2 h-2 rounded-full bg-white/40 animate-ping"></div>
            <div class="absolute top-2 right-6 w-1.5 h-1.5 rounded-full bg-white/40 animate-pulse"></div>
            
            <span v-if="currentTankSum > 0" class="drop-shadow">
              {{ faNum(selectedCapsulesSumStr) }}
            </span>
          </div>

          <!-- Target waterline marker -->
          <div class="absolute top-4 inset-x-2 border-b-2 border-dashed border-sun flex items-center justify-between text-[10px] text-sun px-1 font-bold">
            <span>سطح هدف: {{ faNum(targetFraction.num) }}/{{ faNum(targetFraction.den) }}</span>
            <span>۱۰۰٪</span>
          </div>
        </div>

        <!-- Clickable Fuel Capsules (Interactive Fraction Blocks) -->
        <div class="grid grid-cols-4 gap-2 sm:gap-3 max-w-md mx-auto">
          <button 
            v-for="(cap, idx) in availableCapsules" 
            :key="idx"
            @click="toggleCapsule(idx)"
            :class="[
              'p-3 rounded-2xl border-2 flex flex-col items-center justify-center transition-all cursor-pointer font-black text-base',
              cap.selected 
                ? 'bg-royal border-royal text-white scale-95 shadow-md' 
                : 'bg-white border-line text-ink hover:border-royal/50 hover:bg-mist'
            ]"
          >
            <span class="text-xl leading-none">{{ cap.num }}</span>
            <span class="w-6 h-0.5 bg-current my-1 rounded-full opacity-60"></span>
            <span class="text-sm leading-none opacity-90">{{ cap.den }}</span>
          </button>
        </div>

        <!-- Refuel Action Buttons -->
        <div class="flex items-center justify-center gap-3 pt-2">
          <button @click="resetCapsules" class="btn btn-soft btn-sm !px-4 text-xs font-bold">
            <i data-lucide="rotate-ccw" class="w-4 h-4"></i>
            <span>تخلیه مخزن</span>
          </button>
          <button 
            @click="verifyFuel" 
            :disabled="currentTankSum === 0"
            class="btn btn-royal !min-h-[46px] !px-6 text-sm font-black shadow-lg"
          >
            <i data-lucide="zap" class="w-4 h-4 text-sun"></i>
            <span>تزریق سوخت و پرتاب سفینه!</span>
          </button>
        </div>
      </div>

      <!-- ================= MISSION 2: ASTEROID ANGLE TURRET DEFENSE ================= -->
      <div v-else-if="currentStage === 2" class="space-y-4 my-auto">
        <div class="text-center max-w-md mx-auto space-y-1">
          <span class="tag bg-amber-100 text-amber-800 font-bold text-xs">ماموریت ۲: پدافند زاویه‌سنج در کمربند سیارک‌ها</span>
          <h3 class="text-lg sm:text-xl font-black text-ink">
            سیارک فضایی در زاویه <span class="text-amber-600 font-extrabold underline text-2xl px-1">{{ faNum(targetAngle) }} درجه</span> در حال نزدیک شدن است!
          </h3>
          <p class="text-xs text-[#5A6E99]">
            برجک لیزری سفینه را با چرخاندن نقاله روی زاویه دقیق تنظیم کن و سپس شلیک کن.
          </p>
        </div>

        <!-- Radar & Laser Turret Visualizer (SVG Protractor Interactive) -->
        <div class="relative w-72 h-44 mx-auto border-b-4 border-slate-700 flex items-end justify-center select-none">
          <!-- Protractor Semi-Circle Arch -->
          <svg viewBox="0 0 200 100" class="w-full h-full overflow-visible">
            <!-- Semi Circle Base -->
            <path d="M 10 100 A 90 90 0 0 1 190 100 Z" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="2" />
            
            <!-- Angle Grid Ticks (0, 30, 45, 60, 90, 120, 135, 150, 180) -->
            <line v-for="deg in [0, 30, 45, 60, 90, 120, 135, 150, 180]" :key="deg"
              :x1="100 + 85 * Math.cos((180 - deg) * Math.PI / 180)"
              :y1="100 - 85 * Math.sin((180 - deg) * Math.PI / 180)"
              :x2="100 + 75 * Math.cos((180 - deg) * Math.PI / 180)"
              :y2="100 - 75 * Math.sin((180 - deg) * Math.PI / 180)"
              stroke="#94A3B8" stroke-width="1.5"
            />

            <!-- Degree Labels -->
            <text x="175" y="96" font-size="8" fill="#64748B" font-weight="bold">۰°</text>
            <text x="96" y="16" font-size="8" fill="#64748B" font-weight="bold">۹۰°</text>
            <text x="14" y="96" font-size="8" fill="#64748B" font-weight="bold">۱۸۰°</text>

            <!-- Target Asteroid Ghost -->
            <g :transform="`translate(${100 + 72 * Math.cos((180 - targetAngle) * Math.PI / 180)}, ${100 - 72 * Math.sin((180 - targetAngle) * Math.PI / 180)})`">
              <circle r="9" fill="#EF4444" opacity="0.3" class="animate-ping" />
              <circle r="7" fill="#B91C1C" />
              <text y="3" text-anchor="middle" font-size="8" fill="#fff" font-weight="bold">☄️</text>
            </g>

            <!-- Laser Aiming Line Beam -->
            <line 
              x1="100" y1="100"
              :x2="100 + 95 * Math.cos((180 - currentTurretAngle) * Math.PI / 180)"
              :y2="100 - 95 * Math.sin((180 - currentTurretAngle) * Math.PI / 180)"
              :stroke="laserFired ? '#10B981' : '#0A4BD6'" 
              :stroke-width="laserFired ? 5 : 3"
              stroke-linecap="round"
              :class="laserFired ? 'animate-pulse' : ''"
            />

            <!-- Center Pivot Turret -->
            <circle cx="100" cy="100" r="14" fill="#0F172A" stroke="#FFC531" stroke-width="3" />
            <circle cx="100" cy="100" r="5" fill="#38BDF8" />
          </svg>
        </div>

        <!-- Angle Type Badge (حاده / قائمه / منفرجه) -->
        <div class="flex items-center justify-center gap-2 text-xs font-black">
          <span class="text-[#5A6E99]">زاویه کنونی نشانه:</span>
          <span class="text-royal text-base bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-200">
            {{ faNum(currentTurretAngle) }} درجه
          </span>
          <span class="tag bg-slate-100 text-slate-700">
            {{ currentTurretAngle < 90 ? 'زاویه تند (حاده)' : (currentTurretAngle === 90 ? 'زاویه راست (قائمه)' : 'زاویه باز (منفرجه)') }}
          </span>
        </div>

        <!-- Interactive Angle Controls -->
        <div class="max-w-md mx-auto space-y-2">
          <!-- Slider -->
          <input 
            type="range" 
            min="0" 
            max="180" 
            step="5"
            v-model.number="currentTurretAngle"
            class="w-full accent-royal h-2 bg-slate-200 rounded-lg cursor-pointer"
          />

          <!-- Quick presets buttons -->
          <div class="flex items-center justify-center gap-1.5">
            <button 
              v-for="ang in [30, 45, 60, 90, 120, 135, 150]" 
              :key="ang"
              @click="currentTurretAngle = ang"
              class="px-2 py-1 rounded-lg text-xs font-bold border border-line bg-mist hover:bg-white text-slate-700 cursor-pointer"
            >
              {{ faNum(ang) }}°
            </button>
          </div>
        </div>

        <!-- Fire Button -->
        <div class="text-center pt-2">
          <button 
            @click="fireLaser" 
            :disabled="laserFired"
            class="btn btn-royal !min-h-[48px] !px-8 text-sm font-black shadow-xl"
          >
            <i data-lucide="crosshair" class="w-5 h-5 text-sun"></i>
            <span>شلیک پرتو لیزری به سیارک!</span>
          </button>
        </div>
      </div>

      <!-- ================= MISSION 3: HYPERSPACE MULTIPLICATION & DIVISION WARP ================= -->
      <div v-else-if="currentStage === 3" class="space-y-4 my-auto">
        <div class="text-center max-w-md mx-auto space-y-1">
          <span class="tag bg-purple-100 text-purple-800 font-bold text-xs">ماموریت ۳: موتور پیشران هایپراسپیس (ضرب سریع)</span>
          <h3 class="text-lg sm:text-xl font-black text-ink">
            کد فعال‌سازی پرش کوانتومی: <span class="text-purple-700 font-extrabold text-2xl px-1" dir="ltr">{{ mathProblem.text }} = ؟</span>
          </h3>
          <p class="text-xs text-[#5A6E99]">
            پاسخ سریع ضرب یا تقسیم را با صفحه کلید سفینه وارد کن تا پرش با سرعت نور انجام شود!
          </p>
        </div>

        <!-- Hyperspace Portal Visual -->
        <div class="relative w-48 h-48 mx-auto rounded-full flex items-center justify-center shadow-2xl p-4 overflow-hidden border-4 border-purple-500/30" style="background: radial-gradient(circle, #7e22ce 0%, #3b0764 70%, #090214 100%)">
          <!-- Swirling vortex lines -->
          <div class="absolute inset-0 border-2 border-dashed border-white/20 rounded-full animate-spin" style="animation-duration: 6s"></div>
          <div class="absolute inset-3 border-2 border-dotted border-sun/30 rounded-full animate-spin" style="animation-duration: 3s; animation-direction: reverse"></div>
          
          <!-- Large Input Output Screen in Center -->
          <div class="relative z-10 text-center">
            <span class="text-[10px] text-purple-200 block">پاسخ ورودی شما:</span>
            <div class="text-3xl font-black text-sun tracking-wider min-h-[40px] flex items-center justify-center">
              {{ playerAnswer ? faNum(playerAnswer) : '___' }}
            </div>
            <span class="text-[9px] text-white/60">کوانتوم وارپ ۴</span>
          </div>
        </div>

        <!-- Numeric Numpad Controls (Big 10 Touch Buttons) -->
        <div class="max-w-xs mx-auto space-y-1.5">
          <div class="grid grid-cols-3 gap-1.5">
            <button 
              v-for="n in [1, 2, 3, 4, 5, 6, 7, 8, 9]" 
              :key="n"
              @click="appendDigit(n)"
              class="h-12 rounded-xl bg-white border border-line text-ink font-black text-lg hover:bg-mist active:scale-95 transition-all cursor-pointer shadow-sm"
            >
              {{ faNum(n) }}
            </button>
            <button 
              @click="clearDigit"
              class="h-12 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 font-black text-xs hover:bg-rose-100 active:scale-95 transition-all cursor-pointer flex items-center justify-center"
            >
              <i data-lucide="delete" class="w-5 h-5"></i>
            </button>
            <button 
              @click="appendDigit(0)"
              class="h-12 rounded-xl bg-white border border-line text-ink font-black text-lg hover:bg-mist active:scale-95 transition-all cursor-pointer shadow-sm"
            >
              {{ faNum(0) }}
            </button>
            <button 
              @click="verifyHyperspace"
              class="h-12 rounded-xl bg-ok text-white font-black text-xs hover:bg-emerald-600 active:scale-95 transition-all cursor-pointer flex items-center justify-center shadow-md"
            >
              <i data-lucide="check" class="w-5 h-5"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- ================= VICTORY SCREEN ================= -->
      <div v-else-if="currentStage === 4" class="space-y-4 my-auto text-center rise">
        <div class="w-24 h-24 mx-auto rounded-3xl bg-sun text-ink flex items-center justify-center text-4xl shadow-2xl animate-bounce">
          🏆
        </div>

        <div class="space-y-1 max-w-sm mx-auto">
          <span class="tag bg-emerald-100 text-ok font-black text-xs">پیروزی بزرگ در فضا</span>
          <h3 class="text-2xl font-black text-ink">تبریک! سفینه به کهکشان رشد رسید!</h3>
          <p class="text-xs text-[#5A6E99]">
            با حل دقیق کسرها، نشانه‌گیری زاویه‌ها و محاسبات ذهنی، ماموریت را با موفقیت کامل به پایان رساندی!
          </p>
        </div>

        <!-- Final Score Card -->
        <div class="grid grid-cols-3 gap-2.5 max-w-sm mx-auto py-2">
          <div class="p-3 rounded-2xl bg-mist border border-line">
            <span class="text-[10px] text-[#5A6E99] block">امتیاز کل</span>
            <span class="text-xl font-black text-royal">{{ faNum(currentScore) }}</span>
          </div>
          <div class="p-3 rounded-2xl bg-mist border border-line">
            <span class="text-[10px] text-[#5A6E99] block">دقت علمی</span>
            <span class="text-xl font-black text-ok">۱۰۰٪</span>
          </div>
          <div class="p-3 rounded-2xl bg-mist border border-line">
            <span class="text-[10px] text-[#5A6E99] block">مدال افتخار</span>
            <span class="text-sm font-black text-amber-600">فرمانده ریاضی</span>
          </div>
        </div>

        <div class="flex items-center justify-center gap-3 pt-3">
          <button @click="startNewGame" class="btn btn-royal !min-h-[46px] text-xs font-black">
            <i data-lucide="rotate-ccw" class="w-4 h-4"></i>
            <span>ماموریت مجدد</span>
          </button>
        </div>
      </div>

      <!-- Bottom Interactive Feedback Toast -->
      <div 
        v-if="feedbackMsg"
        class="mt-4 p-3 rounded-2xl text-xs font-bold text-center flex items-center justify-center gap-2 rise"
        :class="feedbackType === 'success' ? 'bg-emerald-50 text-ok border border-emerald-200' : 'bg-rose-50 text-late border border-rose-200'"
      >
        <i :data-lucide="feedbackType === 'success' ? 'check-circle' : 'alert-circle'" class="w-4 h-4"></i>
        <span>{{ feedbackMsg }}</span>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue';
import { faNum, playBeep, refreshIcons } from '../utils';

const emit = defineEmits(['add-points']);

const currentStage = ref(1); // 1 = Fraction Fuel, 2 = Angle Turret, 3 = Hyperspace Math, 4 = Victory
const currentScore = ref(0);
const highScore = ref(150);
const shipEnergy = ref(100);
const soundOn = ref(true);
const feedbackMsg = ref('');
const feedbackType = ref('success');

const stageTitles = [
  'سوخت‌گیری کسرها',
  'پدافند زاویه‌ای سیارک‌ها',
  'پرش کوانتومی ضرب و تقسیم'
];

function playSound(type) {
  if (!soundOn.value) return;
  if (type === 'good') {
    playBeep(880, 0.12);
    setTimeout(() => playBeep(1320, 0.2), 90);
  } else if (type === 'bad') {
    playBeep(240, 0.25);
  } else if (type === 'laser') {
    playBeep(1200, 0.08);
    setTimeout(() => playBeep(600, 0.15), 60);
  } else if (type === 'win') {
    playBeep(523, 0.15);
    setTimeout(() => playBeep(659, 0.15), 120);
    setTimeout(() => playBeep(784, 0.25), 240);
  }
}

function showFeedback(text, type = 'success') {
  feedbackMsg.value = text;
  feedbackType.value = type;
  nextTick(() => refreshIcons());
  setTimeout(() => feedbackMsg.value = '', 3500);
}

// ================= STAGE 1 LOGIC: FRACTION FUEL =================
const targetFraction = ref({ num: 5, den: 8 });
const targetFractionVal = computed(() => targetFraction.value.num / targetFraction.value.den);

const availableCapsules = ref([
  { num: 2, den: 8, selected: false },
  { num: 1, den: 8, selected: false },
  { num: 2, den: 8, selected: false },
  { num: 4, den: 8, selected: false },
  { num: 3, den: 8, selected: false },
  { num: 1, den: 8, selected: false },
  { num: 3, den: 8, selected: false },
  { num: 2, den: 8, selected: false }
]);

const currentTankSum = computed(() => {
  return availableCapsules.value
    .filter(c => c.selected)
    .reduce((acc, c) => acc + (c.num / c.den), 0);
});

const selectedCapsulesSumStr = computed(() => {
  const sumNum = availableCapsules.value
    .filter(c => c.selected)
    .reduce((acc, c) => acc + c.num, 0);
  return `${sumNum}/۸`;
});

function toggleCapsule(idx) {
  availableCapsules.value[idx].selected = !availableCapsules.value[idx].selected;
  playSound('good');
}

function resetCapsules() {
  availableCapsules.value.forEach(c => c.selected = false);
}

function verifyFuel() {
  const sumNum = availableCapsules.value
    .filter(c => c.selected)
    .reduce((acc, c) => acc + c.num, 0);

  if (sumNum === targetFraction.value.num) {
    playSound('good');
    currentScore.value += 50;
    showFeedback('سوخت‌گیری کسرها با موفقیت انجام شد! +۵۰ امتیاز سفینه به مرحله بعد رفت 🚀', 'success');
    setTimeout(() => {
      currentStage.value = 2;
      nextTick(() => refreshIcons());
    }, 1200);
  } else if (sumNum > targetFraction.value.num) {
    playSound('bad');
    shipEnergy.value = Math.max(10, shipEnergy.value - 15);
    showFeedback(`سوخت بیش از حد مجاز سرریز کرد (${sumNum}/۸)! کپسول‌های اضافی را بردارید.`, 'error');
  } else {
    playSound('bad');
    showFeedback(`هنوز ${targetFraction.value.num - sumNum}/۸ سوخت کسر کم داری!`, 'error');
  }
}

// ================= STAGE 2 LOGIC: ASTEROID ANGLE TURRET =================
const targetAngle = ref(120); // 120 degrees obtuse angle
const currentTurretAngle = ref(45);
const laserFired = ref(false);

function fireLaser() {
  laserFired.value = true;
  playSound('laser');

  const diff = Math.abs(currentTurretAngle.value - targetAngle.value);

  setTimeout(() => {
    laserFired.value = false;
    if (diff <= 5) {
      playSound('good');
      currentScore.value += 50;
      showFeedback('شلیک مستقیم به هدف! سیارک فضایی منهدم شد (+۵۰ امتیاز) 🎯', 'success');
      setTimeout(() => {
        currentStage.value = 3;
        nextTick(() => refreshIcons());
      }, 1200);
    } else {
      playSound('bad');
      shipEnergy.value = Math.max(10, shipEnergy.value - 20);
      showFeedback(`خطا در نشانه‌گیری! سیارک در زاویه ${faNum(targetAngle.value)} درجه بود ولی شلیک در ${faNum(currentTurretAngle.value)} درجه انجام شد!`, 'error');
    }
  }, 700);
}

// ================= STAGE 3 LOGIC: HYPERSPACE MATH =================
const mathProblem = ref({ text: '۴۰ × ۵۰', answer: 2000 });
const playerAnswer = ref('');

function appendDigit(d) {
  if (playerAnswer.value.length < 5) {
    playerAnswer.value += String(d);
    playSound('good');
  }
}

function clearDigit() {
  playerAnswer.value = playerAnswer.value.slice(0, -1);
}

function verifyHyperspace() {
  if (Number(playerAnswer.value) === mathProblem.value.answer) {
    playSound('win');
    currentScore.value += 60;
    if (currentScore.value > highScore.value) highScore.value = currentScore.value;
    emit('add-points', currentScore.value);
    showFeedback('کد کوانتومی تایید شد! پرش به کهکشان رشد با موفقیت کامل انجام گرفت (+۶۰ امتیاز) ✨', 'success');
    setTimeout(() => {
      currentStage.value = 4;
      nextTick(() => refreshIcons());
    }, 1200);
  } else {
    playSound('bad');
    playerAnswer.value = '';
    shipEnergy.value = Math.max(10, shipEnergy.value - 20);
    showFeedback('کد وارپ اشتباه است! حاصل ۴۰ × ۵۰ را دوباره محاسبه کنید.', 'error');
  }
}

function startNewGame() {
  currentStage.value = 1;
  currentScore.value = 0;
  shipEnergy.value = 100;
  playerAnswer.value = '';
  currentTurretAngle.value = 45;
  resetCapsules();
  nextTick(() => refreshIcons());
}

onMounted(() => {
  refreshIcons();
});
</script>