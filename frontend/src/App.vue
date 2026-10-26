<template>
  <div class="min-h-screen bg-[#071228] text-ink selection:bg-royal selection:text-white flex flex-col items-center">
    <!-- Unseen Notices Full-Screen Modal (Step 1 requirement) -->
    <NoticeModal 
      v-if="currentUser && unseenNotices.length > 0 && showNoticeModal"
      :notices="unseenNotices"
      :userId="currentUser.id"
      @all-seen="showNoticeModal = false"
    />

    <!-- Top Presentation Control Bar (Collapsible on Mobile) -->
    <header class="no-print w-full bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-white px-3 sm:px-4 py-2 sticky top-0 z-50 shadow-xl transition-all">
      <div class="max-w-7xl mx-auto flex items-center justify-between gap-2">
        <!-- Brand & Title -->
        <div class="flex items-center gap-2 sm:gap-3">
          <div class="w-8 h-8 sm:w-9 sm:h-9 rounded-xl brand-bg flex items-center justify-center text-sun shadow-md shrink-0">
            <i data-lucide="graduation-cap" class="w-4 h-4 sm:w-5 sm:h-5"></i>
          </div>
          <div class="leading-tight">
            <div class="flex items-center gap-1.5">
              <span class="font-extrabold text-xs sm:text-sm text-white">پلتفرم رشد</span>
              <span class="inline-flex items-center px-1.5 py-0.2 rounded-full text-[9px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                آنلاین
              </span>
            </div>
            <span class="text-[10px] sm:text-xs text-slate-400 hidden sm:inline">کانون نخبه‌پروری شهید کاظم آشتیانی</span>
          </div>
        </div>

        <!-- Role Switcher & Actions -->
        <div class="flex items-center gap-1.5 sm:gap-2">
          <!-- Sound FX Toggle Button -->
          <button 
            @click="handleToggleSound"
            class="p-1 sm:p-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition-all"
            :title="soundActive ? 'صدای رابط کاربری فعال است (کلیک برای قطع)' : 'صدای رابط کاربری قطع است (کلیک برای فعال‌سازی)'"
          >
            <i :data-lucide="soundActive ? 'volume-2' : 'volume-x'" class="w-3.5 h-3.5"></i>
          </button>

          <!-- Quick Role Switcher -->
          <div class="flex items-center gap-1 bg-slate-800/90 p-1 rounded-2xl border border-slate-700/60 text-xs font-bold overflow-x-auto max-w-[200px] sm:max-w-none no-scrollbar">
            <button 
              @click="switchView('login')" 
              :class="['px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-xl transition-all flex items-center gap-1 text-[11px] sm:text-xs whitespace-nowrap', currentView === 'login' ? 'bg-royal text-white shadow-md' : 'text-slate-300 hover:text-white']"
            >
              <i data-lucide="log-in" class="w-3 h-3 sm:w-3.5 sm:h-3.5"></i>
              <span>ورود</span>
            </button>
            <button 
              @click="switchView('student')" 
              :class="['px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-xl transition-all flex items-center gap-1 text-[11px] sm:text-xs whitespace-nowrap', currentView === 'student' ? 'bg-royal text-white shadow-md' : 'text-slate-300 hover:text-white']"
            >
              <i data-lucide="backpack" class="w-3 h-3 sm:w-3.5 sm:h-3.5"></i>
              <span>دانش‌آموز</span>
            </button>
            <button 
              @click="switchView('teacher')" 
              :class="['px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-xl transition-all flex items-center gap-1 text-[11px] sm:text-xs whitespace-nowrap', currentView === 'teacher' ? 'bg-royal text-white shadow-md' : 'text-slate-300 hover:text-white']"
            >
              <i data-lucide="presentation" class="w-3 h-3 sm:w-3.5 sm:h-3.5"></i>
              <span>معلم</span>
            </button>
            <button 
              @click="switchView('admin')" 
              :class="['px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-xl transition-all flex items-center gap-1 text-[11px] sm:text-xs whitespace-nowrap', currentView === 'admin' ? 'bg-royal text-white shadow-md' : 'text-slate-300 hover:text-white']"
            >
              <i data-lucide="building-2" class="w-3 h-3 sm:w-3.5 sm:h-3.5"></i>
              <span>مدیر</span>
            </button>
            <button 
              @click="switchView('parent')" 
              :class="['px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-xl transition-all flex items-center gap-1 text-[11px] sm:text-xs whitespace-nowrap', currentView === 'parent' ? 'bg-royal text-white shadow-md' : 'text-slate-300 hover:text-white']"
            >
              <i data-lucide="users" class="w-3 h-3 sm:w-3.5 sm:h-3.5"></i>
              <span>والدین</span>
            </button>
            <button 
              @click="switchView('store')" 
              :class="['px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-xl transition-all flex items-center gap-1 text-[11px] sm:text-xs whitespace-nowrap', currentView === 'store' ? 'bg-sun text-ink shadow-md font-extrabold' : 'text-slate-300 hover:text-white']"
            >
              <i data-lucide="shopping-bag" class="w-3 h-3 sm:w-3.5 sm:h-3.5"></i>
              <span>فروشگاه</span>
            </button>
          </div>

          <!-- Desktop Device Mode Toggle (Hidden on real mobile screens) -->
          <div class="hidden lg:flex items-center gap-1 bg-slate-800/90 p-1 rounded-2xl border border-slate-700/60">
            <button 
              @click="setDeviceMode('mobile')"
              :class="[
                'px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all',
                deviceMode === 'mobile' ? 'bg-sky text-white shadow' : 'text-slate-400 hover:text-white'
              ]"
              title="قاب شبیه‌ساز گوشی برای ارائه دسکتاپ"
            >
              <i data-lucide="smartphone" class="w-3.5 h-3.5"></i>
              <span>قاب گوشی</span>
            </button>
            <button 
              @click="setDeviceMode('responsive')"
              :class="[
                'px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all',
                deviceMode === 'responsive' ? 'bg-sky text-white shadow' : 'text-slate-400 hover:text-white'
              ]"
              title="نمای تمام‌صفحه ریسپانسیو"
            >
              <i data-lucide="monitor" class="w-3.5 h-3.5"></i>
              <span>تمام‌صفحه</span>
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- Content Container -->
    <div 
      :class="[
        'w-full flex-1 flex justify-center',
        deviceMode === 'mobile' ? 'py-0 lg:py-6' : 'w-full'
      ]"
    >
      <!-- Mode 1: Mobile Phone Simulator (Only applied on large screens if explicitly requested) -->
      <div 
        v-if="deviceMode === 'mobile'"
        class="phone-simulator-shell w-full h-full lg:w-[412px] lg:h-[870px] lg:max-h-[92vh]"
      >
        <!-- Phone Top Notch (only on lg shell) -->
        <div class="phone-notch hidden lg:flex">
          <div class="cam"></div>
          <div class="speaker"></div>
        </div>

        <!-- Phone Status Bar -->
        <div class="hidden lg:flex h-9 bg-royal text-white/90 text-xs px-6 pt-1 items-center justify-between shrink-0 font-bold select-none z-30">
          <span>۱۴:۰۵</span>
          <div class="flex items-center gap-1.5">
            <i data-lucide="wifi" class="w-3.5 h-3.5"></i>
            <i data-lucide="battery-charging" class="w-4 h-4"></i>
          </div>
        </div>

        <!-- Scrollable Phone Screen -->
        <div class="flex-1 overflow-y-auto bg-mist relative">
          <!-- 1. Login View -->
          <LoginView 
            v-if="currentView === 'login'"
            @login-success="handleLoginSuccess"
          />

          <!-- 2. Student Panel -->
          <StudentPanel 
            v-else-if="currentView === 'student' && currentUser"
            :user="currentUser"
            @logout="logout"
            @update-user="updateUserData"
          />

          <!-- 3. Teacher Panel -->
          <TeacherPanel 
            v-else-if="currentView === 'teacher' && currentUser"
            :user="currentUser"
            @logout="logout"
          />

          <!-- 4. Admin Panel -->
          <AdminPanel 
            v-else-if="currentView === 'admin' && currentUser"
            :user="currentUser"
            @logout="logout"
          />

          <!-- 5. Parent Panel -->
          <ParentPanel 
            v-else-if="currentView === 'parent' && currentUser"
            :user="currentUser"
            @logout="logout"
          />

          <!-- 6. Store Catalog -->
          <StoreView 
            v-else-if="currentView === 'store'"
          />
        </div>
      </div>

      <!-- Mode 2: Responsive Fluid Fullscreen View -->
      <div 
        v-else 
        class="w-full bg-mist min-h-[calc(100vh-50px)]"
      >
        <!-- 1. Login View -->
        <LoginView 
          v-if="currentView === 'login'"
          @login-success="handleLoginSuccess"
        />

        <!-- 2. Student Panel -->
        <StudentPanel 
          v-else-if="currentView === 'student' && currentUser"
          :user="currentUser"
          @logout="logout"
          @update-user="updateUserData"
        />

        <!-- 3. Teacher Panel -->
        <TeacherPanel 
          v-else-if="currentView === 'teacher' && currentUser"
          :user="currentUser"
          @logout="logout"
        />

        <!-- 4. Admin Panel -->
        <AdminPanel 
          v-else-if="currentView === 'admin' && currentUser"
          :user="currentUser"
          @logout="logout"
        />

        <!-- 5. Parent Panel -->
        <ParentPanel 
          v-else-if="currentView === 'parent' && currentUser"
          :user="currentUser"
          @logout="logout"
        />

        <!-- 6. Store Catalog -->
        <StoreView 
          v-else-if="currentView === 'store'"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, watch } from 'vue';
import { refreshIcons } from './utils';
import { playTap, playSwitch, playPop, toggleSound, isSoundEnabled } from './soundEffects';
import LoginView from './components/LoginView.vue';
import NoticeModal from './components/NoticeModal.vue';
import StudentPanel from './components/StudentPanel.vue';
import TeacherPanel from './components/TeacherPanel.vue';
import AdminPanel from './components/AdminPanel.vue';
import ParentPanel from './components/ParentPanel.vue';
import StoreView from './components/StoreView.vue';

const currentView = ref('login');
const currentUser = ref(null);
const unseenNotices = ref([]);
const showNoticeModal = ref(false);
const soundActive = ref(isSoundEnabled());
const deviceMode = ref('responsive'); // 'mobile' (simulator frame) or 'responsive'

function handleToggleSound() {
  soundActive.value = toggleSound();
  if (soundActive.value) {
    playTap();
  }
}

function setDeviceMode(mode) {
  playTap();
  deviceMode.value = mode;
}

// Auto-detect screen size: on desktop default to mobile or responsive, on mobile device stay responsive
onMounted(() => {
  if (window.innerWidth >= 1024) {
    deviceMode.value = 'responsive';
  } else {
    deviceMode.value = 'responsive';
  }
  refreshIcons();
});

watch([currentView, deviceMode], () => {
  nextTick(() => refreshIcons());
});

async function checkUnseenNotices(userId, grade) {
  try {
    const res = await fetch(`/api/notices?user_id=${userId}&grade=${grade || 'all'}`);
    const notices = await res.json();
    unseenNotices.value = notices.filter(n => !n.is_seen);
    if (unseenNotices.value.length > 0) {
      showNoticeModal.value = true;
    }
  } catch (e) {
    console.error(e);
  }
}

function handleLoginSuccess(user) {
  currentUser.value = user;
  currentView.value = user.role;
  checkUnseenNotices(user.id, user.grade);
  nextTick(() => refreshIcons());
}

function logout() {
  currentUser.value = null;
  currentView.value = 'login';
  nextTick(() => refreshIcons());
}

function updateUserData(updates) {
  if (currentUser.value) {
    currentUser.value = { ...currentUser.value, ...updates };
  }
}

async function switchView(view) {
  playSwitch();
  currentView.value = view;
  if (view === 'login' || view === 'store') {
    nextTick(() => refreshIcons());
    return;
  }

  // Set mock user for presentation if not logged in
  if (!currentUser.value || currentUser.value.role !== view) {
    let mockNatId = '0012345678';
    if (view === 'teacher') mockNatId = '0022334455';
    if (view === 'admin') mockNatId = '0011223344';
    if (view === 'parent') mockNatId = '09121112233';

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: mockNatId, role: view })
      });
      const data = await res.json();
      currentUser.value = data.user;
    } catch (e) {
      console.error(e);
    }
  }
  nextTick(() => refreshIcons());
}
</script>
