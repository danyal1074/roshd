<template>
  <div class="space-y-4">
    <!-- Tab Title on Blue Wave -->
    <div class="text-white px-1">
      <h2 class="text-2xl sm:text-[26px] font-black">گفتگو با مشاور تحصیلی</h2>
      <p class="text-white/80 text-xs sm:text-sm">پاسخگویی به سوالات، بررسی روند درسی و برنامه‌ریزی تخصصی کانون</p>
    </div>

    <!-- Header: Counselor Profile (Identical to Naghsh Yar Chat header) -->
    <div class="card p-4 sm:p-5 flex items-center justify-between gap-3 rise border border-line shadow-sm">
      <div class="flex items-center gap-3.5">
        <div class="relative">
          <div class="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-[#2b3fd6] to-[#1f2fa8] text-white flex items-center justify-center font-black text-xl shadow-md">
            {{ counselorName[0] }}.{{ counselorName.split(' ')[1]?.[0] || 'ک' }}
          </div>
          <!-- Online status dot -->
          <span class="absolute -bottom-1 -left-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center shadow-sm">
            <span class="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
          </span>
        </div>

        <div>
          <div class="flex items-center gap-2">
            <h3 class="font-extrabold text-base sm:text-lg text-ink">{{ counselorName }}</h3>
            <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
              <span>آنلاین</span>
            </span>
          </div>
          <p class="text-xs text-[#5A6E99] mt-0.5">مشاور ارشد تحصیلی و استعدادهای درخشان کانون</p>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <button 
          @click="loadMessages" 
          :disabled="loading" 
          class="w-10 h-10 rounded-2xl bg-mist hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-royal transition-all border border-line"
          title="به‌روزرسانی پیام‌ها"
        >
          <i data-lucide="refresh-cw" :class="['w-4 h-4', loading ? 'animate-spin' : '']"></i>
        </button>
      </div>
    </div>

    <!-- Quick Prompts Chips Bar (Copied directly from Naghsh Yar Chat.jsx) -->
    <div class="space-y-1.5">
      <div class="flex items-center justify-between text-xs font-bold text-slate-500 px-1">
        <span class="flex items-center gap-1">
          <i data-lucide="sparkles" class="w-3.5 h-3.5 text-amber-500"></i>
          <span>پرسش‌های متداول و سریع:</span>
        </span>
        <span class="text-[10px] text-slate-400">کلیک جهت ارسال آنی</span>
      </div>
      <div class="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        <button 
          v-for="(prompt, idx) in quickPrompts" 
          :key="idx"
          @click="sendQuick(prompt)"
          class="px-3.5 py-2 rounded-2xl bg-white border border-line hover:border-royal text-royal hover:bg-royal/5 text-xs font-bold whitespace-nowrap transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
        >
          <span>{{ prompt }}</span>
          <i data-lucide="arrow-up-left" class="w-3 h-3 text-slate-400"></i>
        </button>
      </div>
    </div>

    <!-- Chat Messages Feed Box -->
    <div class="card p-0 overflow-hidden flex flex-col h-[520px] border border-line shadow-md bg-[#FBFBFA]">
      
      <!-- Date Banner -->
      <div class="py-2 px-4 text-center border-b border-line/60 bg-white/70">
        <span class="inline-block px-3 py-0.5 rounded-full bg-slate-200/70 text-[11px] font-bold text-slate-600">
          گفتگوی رسمی با مشاور تحصیلی کانون
        </span>
      </div>

      <!-- Messages Scroll Area -->
      <div ref="feedRef" class="flex-1 p-4 sm:p-5 overflow-y-auto space-y-3.5">
        
        <!-- Welcome Counselor Message -->
        <div class="flex items-start gap-2.5 max-w-[85%] sm:max-w-[75%]">
          <div class="w-8 h-8 rounded-xl bg-royal text-white font-bold flex items-center justify-center text-xs shrink-0 mt-1 shadow-sm">
            م
          </div>
          <div class="p-3.5 rounded-2xl rounded-tr-sm bg-white border border-line text-ink shadow-sm space-y-1">
            <div class="flex items-center justify-between gap-3 text-[11px]">
              <span class="font-extrabold text-royal">{{ counselorName }}</span>
              <span class="text-slate-400 font-mono">۰۸:۰۰</span>
            </div>
            <p class="text-sm leading-relaxed">
              سلام {{ user.first_name }} عزیز! خوش آمدی. هر سوالی در رابطه با برنامه‌ریزی مطالعاتی، تحلیل آزمون‌ها، تکالیف و تکنیک‌های تست‌زنی داری بپرس تا با هم بررسی کنیم. 🎯
            </p>
          </div>
        </div>

        <!-- Render Conversation Messages -->
        <div 
          v-for="msg in messages" 
          :key="msg.id"
          :class="[
            'flex items-end gap-2',
            msg.sender_id === user.id ? 'justify-end' : 'justify-start'
          ]"
        >
          <!-- Received Avatar -->
          <div 
            v-if="msg.sender_id !== user.id" 
            class="w-8 h-8 rounded-xl bg-royal text-white font-bold flex items-center justify-center text-xs shrink-0 mb-1 shadow-sm"
          >
            {{ msg.sender_name?.[0] || 'م' }}
          </div>

          <!-- Message Bubble -->
          <div 
            :class="[
              'p-3.5 rounded-2xl max-w-[85%] sm:max-w-[75%] space-y-1 shadow-sm transition-all',
              msg.sender_id === user.id 
                ? 'bg-[#2b3fd6] text-white rounded-br-sm' 
                : 'bg-white border border-line text-ink rounded-bl-sm'
            ]"
          >
            <div 
              :class="[
                'flex items-center justify-between gap-3 text-[11px]',
                msg.sender_id === user.id ? 'text-white/80' : 'text-slate-400'
              ]"
            >
              <span class="font-bold">{{ msg.sender_id === user.id ? 'شما' : msg.sender_name }}</span>
              <span class="font-mono text-[10px]">{{ faNum(msg.time_fa || '۱۲:۰۰') }}</span>
            </div>
            <p class="text-sm leading-relaxed whitespace-pre-wrap">{{ msg.text }}</p>
            
            <div v-if="msg.sender_id === user.id" class="text-left text-[10px] text-white/70 flex items-center justify-end gap-1">
              <i data-lucide="check-check" class="w-3.5 h-3.5"></i>
            </div>
          </div>
        </div>

        <div ref="bottomAnchor"></div>
      </div>

      <!-- Input Footer Box -->
      <footer class="p-3 sm:p-3.5 bg-white border-t border-line flex items-center gap-2">
        <input 
          v-model="inputMsg"
          @keydown.enter.prevent="sendMsg"
          type="text" 
          placeholder="پیامت را برای مشاور بنویس و اینتر بزن..." 
          class="flex-1 input !min-h-[46px] !rounded-2xl text-sm"
          :disabled="sending"
        />

        <button 
          @click="sendMsg" 
          :disabled="!inputMsg.trim() || sending"
          class="w-12 h-12 rounded-2xl bg-[#2b3fd6] hover:bg-[#1f2fa8] text-white flex items-center justify-center transition-all border-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-md shrink-0"
          title="ارسال پیام"
        >
          <i data-lucide="send" :class="['w-5 h-5', sending ? 'animate-pulse' : '']"></i>
        </button>
      </footer>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue';
import { faNum, refreshIcons, playBeep } from '../utils';

const props = defineProps({
  user: { type: Object, required: true }
});

const counselorName = ref('استاد محمد کریمی');
const counselorId = 911; // Admin / Senior Counselor
const messages = ref([]);
const inputMsg = ref('');
const loading = ref(false);
const sending = ref(false);

const feedRef = ref(null);
const bottomAnchor = ref(null);
let pollInterval = null;

// Naghsh Yar student quick prompt chips
const quickPrompts = [
  'سلام استاد، برنامه‌ی مطالعه این هفته‌ام چطور بوده؟',
  'برای آزمون بعدی چه مبحثی رو پیشنهاد می‌کنید؟',
  'تکلیف جدیدم رو فرستادم، ممنون میشم چک کنید.',
  'استاد در مورد سوالات آزمون این هفته راهنمایی می‌فرمایید؟',
  'برای افزایش تمرکز پومودورو چه راهکاری دارید؟'
];

async function loadMessages() {
  try {
    const res = await fetch(`/api/messages?user=${counselorId}`);
    if (res.ok) {
      const data = await res.json();
      messages.value = data;
      scrollToBottom();
    }
  } catch (err) {
    console.error('Error loading chat:', err);
  } finally {
    nextTick(() => refreshIcons());
  }
}

function scrollToBottom() {
  nextTick(() => {
    if (bottomAnchor.value) {
      bottomAnchor.value.scrollIntoView({ behavior: 'smooth' });
    }
  });
}

async function sendQuick(text) {
  inputMsg.value = text;
  await sendMsg();
}

async function sendMsg() {
  const content = inputMsg.value.trim();
  if (!content || sending.value) return;

  playBeep(650, 0.1);
  sending.value = true;
  inputMsg.value = '';

  const now = new Date();
  const timeFa = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  // Optimistic UI update
  const tempId = Date.now();
  messages.value.push({
    id: tempId,
    sender_id: props.user.id,
    receiver_id: counselorId,
    sender_name: props.user.full_name,
    receiver_name: counselorName.value,
    text: content,
    time_fa: timeFa
  });
  scrollToBottom();

  try {
    const res = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        receiver_id: counselorId,
        receiver_name: counselorName.value,
        text: content
      })
    });

    if (res.ok) {
      // Reload true server state
      await loadMessages();
    }
  } catch (err) {
    console.error('Error sending message:', err);
  } finally {
    sending.value = false;
    nextTick(() => refreshIcons());
  }
}

onMounted(() => {
  loadMessages();
  // Poll every 3.5 seconds like Naghsh Yar Chat.jsx
  pollInterval = setInterval(() => {
    loadMessages();
  }, 3500);
  nextTick(() => refreshIcons());
});

onUnmounted(() => {
  if (pollInterval) clearInterval(pollInterval);
});
</script>
