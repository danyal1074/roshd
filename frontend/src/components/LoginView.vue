<template>
  <section class="min-h-[calc(100vh-50px)] flex flex-col lg:grid lg:grid-cols-2">
    <!-- Brand Hero (Rich banner on Desktop, compact banner on Mobile) -->
    <aside class="brand-bg relative overflow-hidden text-white px-5 py-6 sm:px-8 sm:py-10 lg:py-14 lg:px-14 flex flex-col justify-between shrink-0">
      <div class="dots absolute inset-0 opacity-60"></div>
      
      <!-- Logo & Brand Header -->
      <div class="relative flex items-center gap-3">
        <div class="w-11 h-11 sm:w-14 sm:h-14 rounded-2xl bg-white/15 backdrop-blur border border-white/25 flex items-center justify-center shrink-0">
          <i data-lucide="graduation-cap" class="w-6 h-6 sm:w-7 sm:h-7 text-sun"></i>
        </div>
        <div class="leading-tight">
          <p class="font-extrabold text-base sm:text-lg">کانون نخبه‌پروری</p>
          <p class="text-white/75 text-xs sm:text-sm">شهید کاظم آشتیانی</p>
        </div>
      </div>

      <!-- Hero Message & Graphic -->
      <div class="relative my-4 sm:my-6 lg:my-8 max-w-md">
        <h1 class="text-2xl sm:text-3xl lg:text-[46px] font-extrabold leading-[1.35]">
          هر روز، یک پله بالاتر.
        </h1>
        <p class="mt-2 text-white/80 text-xs sm:text-sm lg:text-[17px] max-w-sm">
          تکالیف، آزمون‌ها و برنامه مطالعه‌ات را یک‌جا ببین و رشدت را دنبال کن.
        </p>

        <!-- Step Graphic SVG from original prompt (visible on desktop) -->
        <svg class="hidden lg:block relative mt-6 w-full max-w-md self-start" viewBox="0 0 420 250" fill="none" aria-hidden="true">
          <defs>
            <linearGradient id="gStep" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".95"/><stop offset="1" stop-color="#fff" stop-opacity=".15"/></linearGradient>
          </defs>
          <rect x="350" y="170" width="52" height="70" rx="14" fill="url(#gStep)" opacity=".5"/>
          <rect x="282" y="140" width="52" height="100" rx="14" fill="url(#gStep)" opacity=".6"/>
          <rect x="214" y="104" width="52" height="136" rx="14" fill="url(#gStep)" opacity=".72"/>
          <rect x="146" y="64" width="52" height="176" rx="14" fill="url(#gStep)" opacity=".85"/>
          <rect x="78" y="22" width="52" height="218" rx="14" fill="url(#gStep)"/>
          <path d="M376 150 C 330 110, 270 100, 240 80 S 150 40, 104 6" stroke="#FFC531" stroke-width="3" stroke-dasharray="2 9" stroke-linecap="round"/>
          <path d="M104 -14 l7 15 16 2-12 11 3 16-14-8-14 8 3-16-12-11 16-2z" transform="translate(0 12)" fill="#FFC531"/>
        </svg>
      </div>

      <div class="relative hidden sm:flex items-center gap-2 text-xs text-white/70">
        <i data-lucide="shield-check" class="w-4 h-4 text-sun"></i>
        <span>سامانه یکپارچه رشد - نسخه رسمی ۱۴۰۵</span>
      </div>
    </aside>

    <!-- Login form -->
    <main class="relative -mt-4 lg:mt-0 rounded-t-[28px] lg:rounded-none bg-mist flex-1 flex items-center justify-center px-4 py-6 sm:px-6 sm:py-8 lg:p-14">
      <div class="w-full max-w-[440px] rise">
        <div class="text-right">
          <h2 class="text-2xl sm:text-[28px] font-extrabold text-ink">ورود به پلتفرم رشد</h2>
          <p class="text-[#5A6E99] mt-1 text-xs sm:text-sm">نقشت را انتخاب کن و وارد شو.</p>
        </div>

        <!-- Role Selector (Ultra responsive 4 buttons) -->
        <div class="grid grid-cols-4 gap-1.5 sm:gap-2.5 mt-4 sm:mt-6" role="group" aria-label="نقش">
          <button 
            type="button"
            class="role !py-2 sm:!py-3" 
            :aria-pressed="selectedRole === 'student'"
            @click="selectRole('student')"
          >
            <i data-lucide="backpack" class="w-5 h-5"></i>
            <span class="text-xs sm:text-sm font-bold">دانش‌آموز</span>
          </button>
          <button 
            type="button"
            class="role !py-2 sm:!py-3" 
            :aria-pressed="selectedRole === 'teacher'"
            @click="selectRole('teacher')"
          >
            <i data-lucide="presentation" class="w-5 h-5"></i>
            <span class="text-xs sm:text-sm font-bold">معلم</span>
          </button>
          <button 
            type="button"
            class="role !py-2 sm:!py-3" 
            :aria-pressed="selectedRole === 'parent'"
            @click="selectRole('parent')"
          >
            <i data-lucide="users" class="w-5 h-5"></i>
            <span class="text-xs sm:text-sm font-bold">والدین</span>
          </button>
          <button 
            type="button"
            class="role !py-2 sm:!py-3" 
            :aria-pressed="selectedRole === 'admin'"
            @click="selectRole('admin')"
          >
            <i data-lucide="building-2" class="w-5 h-5"></i>
            <span class="text-xs sm:text-sm font-bold">مدیر</span>
          </button>
        </div>

        <!-- Login Form with Field Icons -->
        <form @submit.prevent="handleLogin" class="mt-6 space-y-3 sm:space-y-4" autocomplete="off">
          <div>
            <label class="block font-semibold mb-1 text-xs sm:text-sm text-[#0B1F4D]">
              کد ملی یا شماره موبایل
            </label>
            <div class="field">
              <i data-lucide="user-round" class="lead"></i>
              <input 
                v-model="identifier" 
                class="input" 
                inputmode="numeric" 
                placeholder="۰۹۱۲۳۴۵۶۷۸۹ یا کد ملی" 
                dir="ltr" 
                style="text-align:right" 
                required
              />
            </div>
          </div>

          <div>
            <label class="block font-semibold mb-1 text-xs sm:text-sm text-[#0B1F4D]">
              رمز عبور
            </label>
            <div class="field">
              <i data-lucide="lock-keyhole" class="lead"></i>
              <input 
                :type="showPass ? 'text' : 'password'" 
                v-model="password" 
                class="input" 
                placeholder="رمزت را بنویس" 
                style="padding-inline-end:52px" 
                required
              />
              <button 
                type="button" 
                @click="showPass = !showPass" 
                class="absolute top-1/2 -translate-y-1/2 left-3 w-10 h-10 flex items-center justify-center text-[#8AA0CC] hover:text-royal transition-all border-none bg-transparent cursor-pointer"
                aria-label="نمایش رمز"
              >
                <i :data-lucide="showPass ? 'eye-off' : 'eye'" class="w-5 h-5"></i>
              </button>
            </div>
          </div>

          <div v-if="errorMsg" class="p-3 rounded-2xl bg-red-50 text-late text-xs sm:text-sm font-semibold border border-red-200 flex items-center gap-2">
            <i data-lucide="alert-circle" class="w-4 h-4 shrink-0"></i>
            <span>{{ errorMsg }}</span>
          </div>

          <button 
            type="submit" 
            :disabled="loading" 
            class="btn btn-royal w-full text-base sm:text-[17px] font-black !min-h-[50px] shadow-lg"
          >
            <span v-if="loading">در حال برقراری ارتباط...</span>
            <span v-else class="flex items-center gap-2">
              <span>ورود به پنل</span>
              <i data-lucide="log-in" class="w-5 h-5"></i>
            </span>
          </button>
        </form>

        <p class="mt-4 text-center text-xs sm:text-sm text-[#5A6E99]">
          رمزت را فراموش کرده‌ای؟ از مدیر کانون بخواه رمز جدید بسازد.
        </p>
      </div>
    </main>
  </section>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue';
import { refreshIcons } from '../utils';
import { playTap, playSuccess } from '../soundEffects';

const emit = defineEmits(['login-success']);

const selectedRole = ref('student');
const identifier = ref('');
const password = ref('');
const showPass = ref(false);
const loading = ref(false);
const errorMsg = ref('');

onMounted(() => {
  refreshIcons();
});

function selectRole(role) {
  playTap();
  selectedRole.value = role;
  nextTick(() => refreshIcons());
}

async function handleLogin() {
  playTap();
  loading.value = true;
  errorMsg.value = '';

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: identifier.value.trim(),
        password: password.value,
        role: selectedRole.value
      })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'خطا در ورود به سامانه');
    }

    if (data.token) {
      localStorage.setItem('roshd_token', data.token);
    }
    if (data.user) {
      localStorage.setItem('roshd_user', JSON.stringify(data.user));
    }

    playSuccess();
    emit('login-success', data.user);
  } catch (err) {
    errorMsg.value = err.message;
  } finally {
    loading.value = false;
    nextTick(() => refreshIcons());
  }
}
</script>
