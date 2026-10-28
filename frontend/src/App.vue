<template>
  <div class="min-h-screen bg-mist text-ink selection:bg-royal selection:text-white flex flex-col">
    <!-- Unseen Notices Full-Screen Modal -->
    <NoticeModal 
      v-if="currentUser && unseenNotices.length > 0 && showNoticeModal"
      :notices="unseenNotices"
      :userId="currentUser.id"
      @all-seen="showNoticeModal = false"
    />

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
</script>
