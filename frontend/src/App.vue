<template>
  <div class="min-h-screen bg-mist text-ink selection:bg-royal selection:text-white flex flex-col">
    <!-- Unseen Notices Full-Screen Modal -->
    <NoticeModal 
      v-if="currentUser && unseenNotices.length > 0 && showNoticeModal"
      :notices="unseenNotices"
      :userId="currentUser.id"
      @all-seen="showNoticeModal = false"
    />

    <!-- Top Demo Presentation Control Bar (Collapsible) -->
    <header 
      v-if="demoBarOpen"
      class="no-print w-full bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-white px-2.5 sm:px-4 py-2 sticky top-0 z-50 shadow-xl transition-all overflow-hidden"
    >
      <div class="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <!-- Brand & Mode Title -->
        <div class="flex items-center justify-between w-full sm:w-auto">
          <div class="flex items-center gap-2">
            <div class="w-7 h-7 sm:w-8 sm:h-8 rounded-xl brand-bg flex items-center justify-center text-sun shadow-md shrink-0">
              <i data-lucide="sparkles" class="w-3.5 h-3.5 sm:w-4 sm:h-4"></i>
            </div>
            <div class="leading-tight">
              <div class="flex items-center gap-1.5">
                <span class="font-extrabold text-xs sm:text-sm text-white">حالت مشاهده دمو</span>
                <span class="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-black bg-amber-400 text-slate-950">
                  داده‌های آزمایشی
                </span>
              </div>
            </div>
          </div>

          <!-- Controls: Sound Toggle & Minimize for mobile -->
          <div class="flex items-center gap-1.5 sm:hidden">
            <button 
              @click="handleToggleSound"
              class="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition-all text-xs cursor-pointer"
              :title="soundActive ? 'قطع صدا' : 'فعال‌سازی افکت صدا'"
            >
              <i :data-lucide="soundActive ? 'volume-2' : 'volume-x'" class="w-3.5 h-3.5"></i>
            </button>
            <button 
              @click="demoBarOpen = false" 
              class="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition-all text-xs font-bold cursor-pointer"
              title="بستن نوار"
            >
              <i data-lucide="x" class="w-3.5 h-3.5"></i>
            </button>
          </div>
        </div>

        <!-- Role Switcher Buttons -->
        <div class="w-full sm:w-auto max-w-full flex items-center gap-1 bg-slate-800/90 p-1 rounded-2xl border border-slate-700/60 text-xs font-bold overflow-x-auto no-scrollbar">
          <button 
            @click="switchDemoView('student')" 
            :class="['px-2.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 text-xs whitespace-nowrap cursor-pointer shrink-0', currentView === 'student' ? 'bg-royal text-white shadow-md' : 'text-slate-300 hover:text-white hover:bg-slate-700/50']"
          >
            <i data-lucide="backpack" class="w-3.5 h-3.5 text-sun"></i>
            <span>دانش‌آموز</span>
          </button>
          <button 
            @click="switchDemoView('parent')" 
            :class="['px-2.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 text-xs whitespace-nowrap cursor-pointer shrink-0', currentView === 'parent' ? 'bg-royal text-white shadow-md' : 'text-slate-300 hover:text-white hover:bg-slate-700/50']"
          >
            <i data-lucide="users" class="w-3.5 h-3.5 text-sun"></i>
            <span>اولیا</span>
          </button>
          <button 
            @click="switchDemoView('teacher')" 
            :class="['px-2.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 text-xs whitespace-nowrap cursor-pointer shrink-0', currentView === 'teacher' ? 'bg-royal text-white shadow-md' : 'text-slate-300 hover:text-white hover:bg-slate-700/50']"
          >
            <i data-lucide="presentation" class="w-3.5 h-3.5 text-sun"></i>
            <span>دبیر</span>
          </button>
          <button 
            @click="switchDemoView('admin')" 
            :class="['px-2.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 text-xs whitespace-nowrap cursor-pointer shrink-0', currentView === 'admin' ? 'bg-royal text-white shadow-md' : 'text-slate-300 hover:text-white hover:bg-slate-700/50']"
          >
            <i data-lucide="shield-check" class="w-3.5 h-3.5 text-sun"></i>
            <span>مدیر</span>
          </button>
          <button 
            @click="switchDemoView('store')" 
            :class="['px-2.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 text-xs whitespace-nowrap cursor-pointer shrink-0', currentView === 'store' ? 'bg-royal text-white shadow-md' : 'text-slate-300 hover:text-white hover:bg-slate-700/50']"
          >
            <i data-lucide="shopping-bag" class="w-3.5 h-3.5 text-sun"></i>
            <span>فروشگاه</span>
          </button>
          <button 
            @click="switchDemoView('login')" 
            :class="['px-2.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 text-xs whitespace-nowrap cursor-pointer shrink-0', currentView === 'login' ? 'bg-royal text-white shadow-md' : 'text-slate-300 hover:text-white hover:bg-slate-700/50']"
          >
            <i data-lucide="log-in" class="w-3.5 h-3.5 text-sun"></i>
            <span>ورود</span>
          </button>
        </div>

        <!-- Controls: Desktop Sound Toggle & Minimize -->
        <div class="hidden sm:flex items-center gap-1.5">
          <button 
            @click="handleToggleSound"
            class="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition-all text-xs cursor-pointer"
            :title="soundActive ? 'قطع صدا' : 'فعال‌سازی افکت صدا'"
          >
            <i :data-lucide="soundActive ? 'volume-2' : 'volume-x'" class="w-3.5 h-3.5"></i>
          </button>

          <button 
            @click="demoBarOpen = false" 
            class="px-2 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition-all text-xs font-bold flex items-center gap-1 shrink-0 cursor-pointer"
            title="بستن نوار بالای صفحه"
          >
            <i data-lucide="minimize-2" class="w-3.5 h-3.5"></i>
            <span>مخفی</span>
          </button>
        </div>
      </div>
    </header>

    <!-- Floating Restore Pill when demoBarOpen is false -->
    <button 
      v-if="!demoBarOpen"
      @click="demoBarOpen = true"
      class="fixed top-4 left-4 z-50 bg-slate-900/90 hover:bg-slate-900 backdrop-blur-md text-white border border-slate-700/80 px-3.5 py-2 rounded-full text-xs font-extrabold shadow-2xl flex items-center gap-2 hover:scale-105 transition-all group cursor-pointer"
      title="باز کردن نوار دمو و تغییر نقش"
    >
      <i data-lucide="sparkles" class="w-4 h-4 text-amber-400 group-hover:rotate-12 transition-transform"></i>
      <span>تغییر پنل (حالت دمو)</span>
    </button>

    <!-- Production View Router -->
    <main class="w-full flex-1">
      <!-- 1. Official Login Page -->
      <LoginView 
        v-if="!currentUser || currentView === 'login'"
        @login-success="handleLoginSuccess"
      />

      <!-- 2. Student Panel -->
      <StudentPanel 
        v-else-if="currentView === 'student' && currentUser"
        :user="currentUser"
        @logout="logout"
        @update-user="updateUserData"
        @open-store="currentView = 'store'"
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
        @back="currentView = currentUser ? currentUser.role : 'login'"
      />
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, watch } from 'vue';
import { refreshIcons } from './utils';
import { playTap, playSwitch, toggleSound, isSoundEnabled } from './soundEffects';
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
const demoBarOpen = ref(true);
const soundActive = ref(true);

function handleToggleSound() {
  soundActive.value = toggleSound();
  if (soundActive.value) {
    playTap();
  }
}

// Initialize session on mount
onMounted(async () => {
  soundActive.value = isSoundEnabled();
  await initAuth();
  refreshIcons();
});

async function initAuth() {
  try {
    const res = await fetch('/api/auth/me');
    if (res.ok) {
      const data = await res.json();
      if (data && data.user) {
        currentUser.value = data.user;
        currentView.value = data.user.role;
        checkUnseenNotices(data.user.id, data.user.grade);
      }
    }
  } catch (e) {
    // Session not found or error, stay on login
  }
}

watch([currentView, demoBarOpen], () => {
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

async function logout() {
  try {
    await fetch('/api/auth/logout', { method: 'POST' });
  } catch (e) {}
  localStorage.removeItem('roshd_token');
  localStorage.removeItem('roshd_user');
  currentUser.value = null;
  currentView.value = 'login';
  nextTick(() => refreshIcons());
}

function updateUserData(updates) {
  if (currentUser.value) {
    currentUser.value = { ...currentUser.value, ...updates };
  }
}

// Switch panel in Demo Mode with realistic sample accounts
async function switchDemoView(view) {
  playSwitch();
  if (view === 'login') {
    currentUser.value = null;
    currentView.value = 'login';
    nextTick(() => refreshIcons());
    return;
  }
  if (view === 'store') {
    currentView.value = 'store';
    nextTick(() => refreshIcons());
    return;
  }

  // Pre-configured mock identifiers for each role
  let mockNatId = '0012345678'; // student (Ali Rezaei)
  if (view === 'parent') mockNatId = '09121112233'; // parent (Mehdi Rezaei)
  if (view === 'teacher') mockNatId = '0022334455'; // teacher (Fatemeh Ahmadi)
  if (view === 'admin') mockNatId = '0011223344'; // admin (Mohammad Karimi)

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: mockNatId, password: '123456', role: view })
    });
    const data = await res.json();
    if (res.ok && data.user) {
      if (data.token) localStorage.setItem('roshd_token', data.token);
      if (data.user) localStorage.setItem('roshd_user', JSON.stringify(data.user));
      currentUser.value = data.user;
      currentView.value = data.user.role;
      showNoticeModal.value = false; // keep view clean in demo testing mode
    }
  } catch (e) {
    console.error('Demo view switch error:', e);
  } finally {
    nextTick(() => refreshIcons());
  }
}
</script>
