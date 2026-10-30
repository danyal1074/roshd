<template>
  <div class="min-h-screen bg-mist text-ink selection:bg-royal selection:text-white flex flex-col">
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
import { ref, onMounted, nextTick, watch, defineAsyncComponent } from 'vue';
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
