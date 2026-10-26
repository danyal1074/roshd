<template>
  <div v-if="isOpen && currentNotice" class="fixed inset-0 z-50 text-white flex flex-col overflow-y-auto notice-bg" role="dialog" aria-modal="true" aria-label="اطلاعیه جدید">
    <div class="w-full max-w-xl mx-auto flex-1 flex flex-col px-5 pt-6 pb-6">
      <!-- Segmented progress bars -->
      <div class="flex gap-2" dir="rtl">
        <div 
          v-for="(n, idx) in notices" 
          :key="n.id" 
          class="h-[5px] rounded-full bg-white/25 overflow-hidden flex-1 transition-all"
        >
          <span 
            class="block h-full bg-white rounded-full transition-all duration-300"
            :style="{ width: idx < currentIndex ? '100%' : (idx === currentIndex ? '100%' : '0%') }"
          ></span>
        </div>
      </div>

      <div class="flex items-center justify-between mt-4 text-white/85">
        <span class="inline-flex items-center gap-2 font-semibold text-lg">
          <i data-lucide="megaphone" class="w-5 h-5 text-sun"></i>
          <span>اطلاعیه جدید</span>
        </span>
        <span class="text-sm bg-white/15 rounded-full px-3 py-0.5 font-bold">
          {{ faNum(currentIndex + 1) }} از {{ faNum(notices.length) }}
        </span>
      </div>

      <!-- Notice card identical to rosh-step1.html -->
      <article class="slide-in mt-5 flex-1 bg-white text-ink rounded-[28px] p-6 sm:p-8 flex flex-col shadow-[0_30px_60px_-20px_rgba(0,0,0,.5)]">
        <div class="flex items-center justify-between">
          <div class="w-16 h-16 rounded-[20px] flex items-center justify-center text-white" style="background:linear-gradient(135deg,#1E90FF,#0A4BD6)">
            <i data-lucide="calendar-clock" class="w-8 h-8"></i>
          </div>
          <span class="text-sm font-bold rounded-full px-3 py-1 bg-sun/30 text-[#7A5600]">
            {{ currentNotice.tag || 'مهم' }}
          </span>
        </div>

        <h2 class="text-[26px] font-extrabold leading-[1.5] mt-5">
          {{ currentNotice.title }}
        </h2>

        <div class="flex flex-wrap gap-2 mt-3">
          <span class="inline-flex items-center gap-1.5 text-sm bg-mist rounded-full px-3 py-1 text-[#4A5E8A]">
            <i data-lucide="calendar" class="w-4 h-4"></i>
            <span>{{ currentNotice.date_fa }}</span>
          </span>
          <span class="inline-flex items-center gap-1.5 text-sm bg-mist rounded-full px-3 py-1 text-[#4A5E8A]">
            <i data-lucide="map-pin" class="w-4 h-4"></i>
            <span>{{ currentNotice.place || 'کانون' }}</span>
          </span>
        </div>

        <p class="text-[18px] leading-8 mt-5 text-[#2B3F6B] flex-1 whitespace-pre-line">
          {{ currentNotice.body }}
        </p>
      </article>

      <button 
        @click="markSeen"
        class="btn btn-sun w-full mt-5 text-[22px] font-black"
        style="min-height: 64px;"
      >
        <i data-lucide="check-check" class="w-6 h-6"></i>
        <span>دیدم</span>
      </button>
      <p class="text-center text-white/70 text-sm mt-3">
        بعد از دیدن همه اطلاعیه‌ها وارد پنل می‌شوی.
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue';
import { faNum, refreshIcons } from '../utils';

const props = defineProps({
  notices: { type: Array, default: () => [] },
  userId: { type: Number, required: true }
});

const emit = defineEmits(['all-seen']);

const currentIndex = ref(0);
const isOpen = ref(true);

const currentNotice = computed(() => props.notices[currentIndex.value] || null);

onMounted(() => {
  refreshIcons();
});

watch(currentIndex, () => {
  nextTick(() => refreshIcons());
});

async function markSeen() {
  if (!currentNotice.value) return;

  try {
    await fetch('/api/notices/seen', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notice_id: currentNotice.value.id, user_id: props.userId })
    });
  } catch (e) {
    console.error(e);
  }

  if (currentIndex.value < props.notices.length - 1) {
    currentIndex.value++;
  } else {
    isOpen.value = false;
    emit('all-seen');
  }
}
</script>
