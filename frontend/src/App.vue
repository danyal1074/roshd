<template>
  <div class="min-h-screen bg-mist text-ink selection:bg-royal selection:text-white flex flex-col">
    <!-- Admin Dev / Role Switcher Bar -->
    <div 
      v-if="isAdminOrImpersonated" 
      class="sticky top-0 z-40 transition-all duration-300"
    >
      <!-- Collapsed floating trigger -->
      <div v-if="switcherCollapsed" class="fixed top-3 left-3 z-50">
        <button 
          @click="switcherCollapsed = false" 
          class="flex items-center gap-2 px-3 py-2 rounded-2xl bg-slate-900/90 text-white shadow-2xl border border-white/20 backdrop-blur-md text-xs font-bold hover:bg-slate-800"
          title="باز کردن نوار شبیه‌ساز نقش‌ها"
        >
          <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>شبیه‌ساز مدیر ({{ roleTitle(currentUser?.role) }})</span>
          <i data-lucide="chevron-down" class="w-3.5 h-3.5"></i>
        </button>
      </div>

      <!-- Expanded Top Dev Switcher Bar -->
      <div v-else class="bg-slate-950/95 backdrop-blur-md border-b border-white/10 shadow-2xl text-white px-3 sm:px-6 py-2.5">
        <div class="max-w-7xl mx-auto flex items-center justify-between gap-2 flex-wrap">
          <!-- Left Label & Current Identity -->
          <div class="flex items-center gap-2.5">
            <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <div>
              <div class="flex items-center gap-2">
                <span class="text-xs font-black text-amber-400">⚡ شبیه‌ساز نقش‌ها (ویژه توسعه مدیر)</span>
                <span v-if="currentUser?.is_impersonated" class="text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded-full font-bold">
                  حالت شبیه‌سازی فعال
                </span>
              </div>
              <p class="text-[11px] text-slate-300">
                کاربر فعال: <b class="text-white">{{ currentUser?.full_name }}</b> ({{ roleTitle(currentUser?.role) }})
              </p>
            </div>
          </div>

          <!-- Switcher Buttons -->
          <div class="flex items-center gap-1.5 flex-wrap">
            <button 
              @click="switchRole('admin')"
              :disabled="switcherLoading"
              class="px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all"
              :class="currentUser?.role === 'admin' && currentView === 'admin' ? 'bg-amber-400 text-slate-950 shadow-md font-black' : 'bg-white/10 hover:bg-white/20 text-slate-200'"
            >
              <span>🛡️ پنل مدیر</span>
            </button>

            <button 
              @click="switchRole('teacher')"
              :disabled="switcherLoading"
              class="px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all"
              :class="currentUser?.role === 'teacher' && currentView === 'teacher' ? 'bg-emerald-400 text-slate-950 shadow-md font-black' : 'bg-white/10 hover:bg-white/20 text-slate-200'"
            >
              <span>👩‍🏫 پنل معلم</span>
            </button>

            <button 
              @click="switchRole('student')"
              :disabled="switcherLoading"
              class="px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all"
              :class="currentUser?.role === 'student' && currentView === 'student' ? 'bg-sky-400 text-slate-950 shadow-md font-black' : 'bg-white/10 hover:bg-white/20 text-slate-200'"
            >
              <span>🎓 پنل دانش‌آموز</span>
            </button>

            <button 
              @click="switchRole('parent')"
              :disabled="switcherLoading"
              class="px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all"
              :class="currentUser?.role === 'parent' && currentView === 'parent' ? 'bg-purple-400 text-slate-950 shadow-md font-black' : 'bg-white/10 hover:bg-white/20 text-slate-200'"
            >
              <span>👨‍👩‍👧 پنل اولیا</span>
            </button>

            <button 
              @click="currentView = 'store'"
              class="px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all"
              :class="currentView === 'store' ? 'bg-pink-400 text-slate-950 shadow-md font-black' : 'bg-white/10 hover:bg-white/20 text-slate-200'"
            >
              <span>🛍️ فروشگاه</span>
            </button>

            <button 
              v-if="currentUser?.is_impersonated"
              @click="switchBackToAdmin"
              :disabled="switcherLoading"
              class="px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-black bg-rose-600 hover:bg-rose-500 text-white shadow-md flex items-center gap-1"
            >
              <span>🔙 بازگشت به مدیر</span>
            </button>

            <button 
              @click="switcherCollapsed = true" 
              class="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 ml-1"
              title="کوچک‌سازی نوار"
            >
              <i data-lucide="chevron-up" class="w-4 h-4"></i>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Unseen Notices Full-Screen Modal -->
    <NoticeModal 
      v-if="currentUser && unseenNotices.length > 0 && showNoticeModal"
      :notices="unseenNotices"
      :userId="currentUser.id"
      @all-seen="showNoticeModal = false"
    />

    <!-- Mandatory Password Change Modal -->
    <div 
      v-if="currentUser && currentUser.must_change_password === 1"
      class="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4"
    >
      <div class="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl text-right">
        <div class="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-4">
          <i data-lucide="key-round" class="w-6 h-6"></i>
        </div>
        <h3 class="text-xl font-black text-ink text-center">تغییر رمز عبور الزامی</h3>
        <p class="text-xs sm:text-sm text-slate-500 text-center mt-1 mb-6">
          جهت حفظ امنیت حساب کاربری در اولین ورود، لطفاً رمز عبور جدید تعیین نمایید (حداقل ۸ نویسه).
        </p>

        <form @submit.prevent="handleChangePassword" class="space-y-4">
          <div>
            <label class="block text-xs font-bold text-ink mb-1">رمز عبور فعلی</label>
            <input 
              v-model="changePassForm.current_password" 
              type="password" 
              required
              class="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-royal outline-none text-sm text-left" 
              dir="ltr"
            />
          </div>
          <div>
            <label class="block text-xs font-bold text-ink mb-1">رمز عبور جدید (حداقل ۸ نویسه)</label>
            <input 
              v-model="changePassForm.new_password" 
              type="password" 
              required
              minlength="8"
              class="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-royal outline-none text-sm text-left" 
              dir="ltr"
            />
          </div>
          <div>
            <label class="block text-xs font-bold text-ink mb-1">تکرار رمز عبور جدید</label>
            <input 
              v-model="changePassForm.confirm_password" 
              type="password" 
              required
              minlength="8"
              class="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-royal outline-none text-sm text-left" 
              dir="ltr"
            />
          </div>

          <div v-if="changePassError" class="p-3 rounded-xl bg-red-50 text-red-600 text-xs font-bold border border-red-200">
            {{ changePassError }}
          </div>

          <button 
            type="submit" 
            :disabled="changePassLoading"
            class="btn btn-royal w-full !py-3 text-sm font-extrabold shadow-lg"
          >
            <span v-if="changePassLoading">در حال ثبت...</span>
            <span v-else>ثبت رمز عبور جدید و ورود</span>
          </button>
        </form>
      </div>
    </div>

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
        @switch-back="switchBackToAdmin"
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
        @switch-role="switchRole"
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
import { ref, computed, onMounted, nextTick, watch, defineAsyncComponent } from 'vue';
import { refreshIcons } from './utils';
import { playTap, playSwitch, toggleSound, isSoundEnabled } from './soundEffects';
import LoginView from './components/LoginView.vue';
import NoticeModal from './components/NoticeModal.vue';

// Code-split heavy role panels via dynamic imports for sub-second initial load
const StudentPanel = defineAsyncComponent(() => import('./components/StudentPanel.vue'));
const TeacherPanel = defineAsyncComponent(() => import('./components/TeacherPanel.vue'));
const AdminPanel = defineAsyncComponent(() => import('./components/AdminPanel.vue'));
const ParentPanel = defineAsyncComponent(() => import('./components/ParentPanel.vue'));
const StoreView = defineAsyncComponent(() => import('./components/StoreView.vue'));

const currentView = ref('login');
const currentUser = ref(null);
const unseenNotices = ref([]);
const showNoticeModal = ref(false);
const soundActive = ref(true);

const switcherCollapsed = ref(false);
const switcherLoading = ref(false);

const isAdminOrImpersonated = computed(() => {
  return (currentUser.value && (currentUser.value.role === 'admin' || currentUser.value.is_impersonated));
});

function roleTitle(role) {
  if (role === 'admin') return 'مدیر سیستم';
  if (role === 'teacher') return 'معلم';
  if (role === 'student') return 'دانش‌آموز';
  if (role === 'parent') return 'اولیا';
  return role || '';
}

async function switchRole(targetRole, userId = null) {
  if (!userId && currentUser.value?.role === targetRole && currentView.value === targetRole) return;
  switcherLoading.value = true;
  playSwitch();
  try {
    const payload = { target_role: targetRole };
    if (userId) payload.user_id = userId;
    const res = await fetch('/api/admin/switch-role', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (res.ok && data.user) {
      currentUser.value = data.user;
      currentView.value = data.user.role;
      if (data.user.role === 'student' || data.user.role === 'parent') {
        checkUnseenNotices(data.user.id, data.user.grade);
      }
    }
  } catch (err) {
    console.error('Error switching role:', err);
  } finally {
    switcherLoading.value = false;
    nextTick(() => refreshIcons());
  }
}

async function switchBackToAdmin() {
  switcherLoading.value = true;
  playSwitch();
  try {
    const res = await fetch('/api/admin/switch-back', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await res.json();
    if (res.ok && data.user) {
      currentUser.value = data.user;
      currentView.value = 'admin';
    }
  } catch (err) {
    console.error('Error switching back:', err);
  } finally {
    switcherLoading.value = false;
    nextTick(() => refreshIcons());
  }
}

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
        if (data.user.role === 'student' || data.user.role === 'parent') {
          checkUnseenNotices(data.user.id, data.user.grade);
        }
      }
    }
  } catch (e) {
    // Session not found or error, stay on login
  }
}

const changePassForm = ref({ current_password: '', new_password: '', confirm_password: '' });
const changePassError = ref('');
const changePassLoading = ref(false);

async function handleChangePassword() {
  if (changePassForm.value.new_password !== changePassForm.value.confirm_password) {
    changePassError.value = 'تکرار رمز عبور جدید با رمز وارد شده مطابقت ندارد.';
    return;
  }
  changePassLoading.value = true;
  changePassError.value = '';
  try {
    const res = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        current_password: changePassForm.value.current_password,
        new_password: changePassForm.value.new_password
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'خطا در تغییر رمز عبور');
    currentUser.value.must_change_password = 0;
    localStorage.setItem('roshd_user', JSON.stringify(currentUser.value));
    changePassForm.value = { current_password: '', new_password: '', confirm_password: '' };
    playTap();
  } catch (err) {
    changePassError.value = err.message;
  } finally {
    changePassLoading.value = false;
    nextTick(() => refreshIcons());
  }
}

watch(currentView, () => {
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
  if (user.role === 'student' || user.role === 'parent') {
    checkUnseenNotices(user.id, user.grade);
  }
  nextTick(() => refreshIcons());
}

async function logout() {
  try {
    await fetch('/api/auth/logout', { method: 'POST' });
  } catch (e) {}
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
</script>
