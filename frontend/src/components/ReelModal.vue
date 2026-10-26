<template>
  <div class="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in" @click.self="$emit('close')">
    <div class="relative w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col lg:flex-row max-h-[92vh]">
      
      <!-- Video Player Column (9:16 vertical) -->
      <div class="lg:w-[420px] bg-black flex flex-col items-center justify-center p-3 sm:p-4 relative shrink-0">
        <!-- Close Button (Mobile) -->
        <button 
          @click="$emit('close')" 
          class="lg:hidden absolute top-4 left-4 z-20 w-9 h-9 rounded-full bg-slate-800/80 text-white flex items-center justify-center hover:bg-slate-700 transition-all"
        >
          <i data-lucide="x" class="w-5 h-5"></i>
        </button>

        <!-- Phone Shell for Video -->
        <div class="relative w-[280px] sm:w-[320px] aspect-[9/16] rounded-[36px] p-2 bg-gradient-to-b from-slate-700 via-slate-800 to-slate-900 shadow-2xl border border-slate-600/50 flex flex-col items-center">
          <!-- Dynamic Island Pill -->
          <div class="w-24 h-5 bg-black rounded-full absolute top-3.5 z-20 flex items-center justify-end px-2">
            <span class="w-2 h-2 rounded-full bg-slate-800"></span>
          </div>

          <!-- Video Element -->
          <video 
            ref="videoRef"
            src="/roshd_opendesign_reel.mp4" 
            poster="/reel_thumbnail.png"
            controls 
            playsinline 
            autoplay
            class="w-full h-full object-cover rounded-[28px] bg-black shadow-inner"
          ></video>
        </div>
      </div>

      <!-- Video Details & Actions Column -->
      <div class="flex-1 p-5 sm:p-7 flex flex-col justify-between overflow-y-auto text-white">
        <div>
          <!-- Header -->
          <div class="flex items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <div class="flex items-center gap-2">
                <span class="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow">
                  ✨ استاندارد Open Design
                </span>
                <span class="text-xs text-slate-400 font-bold">نسخه ریلز اینستاگرام (9:16)</span>
              </div>
              <h3 class="text-xl sm:text-2xl font-black text-white mt-1">
                موشن‌گرافیک رسمی پلتفرم رشد
              </h3>
            </div>
            <!-- Close Button (Desktop) -->
            <button 
              @click="$emit('close')" 
              class="hidden lg:flex w-9 h-9 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 items-center justify-center transition-all"
            >
              <i data-lucide="x" class="w-5 h-5"></i>
            </button>
          </div>

          <!-- Description -->
          <p class="text-xs sm:text-sm text-slate-300 mt-4 leading-relaxed">
            این موشن‌گرافیک با کیفیت ۱۰۸۰×۱۹۲۰ مخصوص اکسپلور و ریلز اینستاگرام، با گویندگی فارسی، موسیقی متن امبینت لوفای و افکت‌های صوتی اختصاصی برای معرفی پلتفرم کانون شهید آشتیانی ساخته شده است.
          </p>

          <!-- Highlights Checklist -->
          <div class="mt-5 space-y-2.5">
            <div class="flex items-start gap-2.5 bg-slate-800/60 p-2.5 rounded-2xl border border-slate-700/50 text-xs">
              <span class="w-5 h-5 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 font-bold mt-0.5">✓</span>
              <div>
                <strong class="text-white">تفکیک کامل شهریه از هزینه سامانه:</strong>
                <p class="text-slate-400 text-[11px]">نمایش شفاف رسیدهای پرداخت و درگاه بانکی شاپرک</p>
              </div>
            </div>

            <div class="flex items-start gap-2.5 bg-slate-800/60 p-2.5 rounded-2xl border border-slate-700/50 text-xs">
              <span class="w-5 h-5 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 font-bold mt-0.5">✓</span>
              <div>
                <strong class="text-white">گیمیفیکیشن و مأموریت فضایی ریاضی:</strong>
                <p class="text-slate-400 text-[11px]">یادگیری تعاملی با افکت‌های صوتی تشویقی</p>
              </div>
            </div>

            <div class="flex items-start gap-2.5 bg-slate-800/60 p-2.5 rounded-2xl border border-slate-700/50 text-xs">
              <span class="w-5 h-5 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 font-bold mt-0.5">✓</span>
              <div>
                <strong class="text-white">داشبورد ۴۵۰ نفره کانون:</strong>
                <p class="text-slate-400 text-[11px]">گزارش‌گیری لحظه‌ای اساتید و مدیریت کانون</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="mt-6 pt-4 border-t border-slate-800 flex flex-wrap items-center gap-3">
          <a 
            href="/roshd_opendesign_reel.mp4" 
            download="roshd_opendesign_reel.mp4"
            class="flex-1 min-h-[46px] px-4 rounded-xl font-black text-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.98]"
          >
            <i data-lucide="download" class="w-4 h-4"></i>
            <span>دانلود فایل ویدیویی MP4</span>
          </a>
          <button 
            @click="restartVideo"
            class="min-h-[46px] px-4 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center gap-1.5 border border-slate-700 transition-all"
          >
            <i data-lucide="rotate-ccw" class="w-4 h-4"></i>
            <span>پخش مجدد</span>
          </button>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const emit = defineEmits(['close']);
const videoRef = ref(null);

function restartVideo() {
  if (videoRef.value) {
    videoRef.value.currentTime = 0;
    videoRef.value.play();
  }
}

onMounted(() => {
  if (window.lucide) {
    window.lucide.createIcons();
  }
});
</script>
