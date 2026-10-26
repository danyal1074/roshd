<template>
  <div class="space-y-5">
    
    <!-- PHASE 1: EXAMS LIST & SELF-ASSESSMENT BUILDER -->
    <div v-if="phase === 'list'" class="space-y-5">
      <!-- Page Head (Identical to Naghsh Yar PageHead) -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
        <div>
          <h2 class="text-2xl sm:text-[26px] font-black text-white flex items-center gap-2">
            <span>آزمون‌ها</span>
            <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-black bg-white/20 text-white backdrop-blur">
              سامانه آزمون هوشمند
            </span>
          </h2>
          <p class="text-xs sm:text-sm text-white/80 mt-1">
            آزمون‌های برنامه‌ریزی‌شده و آزمون‌های خودسنجی با محاسبه نمره منفی و تحلیل پاسخ‌ها.
          </p>
        </div>

        <button 
          @click="selfOpen = true"
          class="btn btn-sun text-ink font-black shadow-lg text-xs sm:text-sm flex items-center gap-2 self-start sm:self-auto !min-h-[42px] hover:scale-105 active:scale-95 transition-all"
        >
          <i data-lucide="plus-circle" class="w-4 h-4 text-ink"></i>
          <span>+ ساخت آزمون خودسنجی</span>
        </button>
      </div>

      <!-- Segment Tabs (آزمون‌های جدید / آزمون‌های انجام‌شده) -->
      <div class="seg-ctl">
        <button 
          @click="examTab = 'fresh'" 
          :aria-pressed="examTab === 'fresh'"
        >
          <span>آزمون‌های جدید</span>
          <span v-if="freshExams.length > 0" class="mr-1.5 px-2 py-0.2 rounded-full text-[10px] font-black bg-sun text-ink">
            {{ faNum(freshExams.length) }}
          </span>
        </button>
        <button 
          @click="examTab = 'done'" 
          :aria-pressed="examTab === 'done'"
        >
          <span>آزمون‌های انجام‌شده</span>
          <span v-if="doneExams.length > 0" class="mr-1.5 px-2 py-0.2 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700">
            {{ faNum(doneExams.length) }}
          </span>
        </button>
      </div>

      <!-- Fresh Exams List -->
      <div v-if="examTab === 'fresh'" class="space-y-3">
        <div v-if="freshExams.length === 0" class="card p-8 text-center space-y-3 border border-dashed border-line">
          <div class="w-14 h-14 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
            <i data-lucide="clipboard-check" class="w-7 h-7"></i>
          </div>
          <h3 class="font-extrabold text-base text-ink">آزمون جدیدی نداری</h3>
          <p class="text-xs text-[#5A6E99] max-w-sm mx-auto">
            می‌توانی خودت یک آزمون تستی از مباحث دلخواه بسازی و شرکت کنی تا سطح تسلطت سنجیده شود.
          </p>
          <button @click="selfOpen = true" class="btn btn-royal !min-h-[40px] text-xs font-bold !px-6 mx-auto">
            <i data-lucide="plus" class="w-4 h-4 text-sun"></i>
            <span>ساخت آزمون خودسنجی</span>
          </button>
        </div>

        <div 
          v-for="e in freshExams" 
          :key="e.id"
          class="card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-line shadow-sm hover:shadow-md transition-all"
        >
          <div class="flex items-start gap-3.5">
            <div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#2b3fd6] to-[#1f2fa8] text-white flex items-center justify-center shrink-0 shadow-sm">
              <i data-lucide="file-text" class="w-6 h-6 text-sun"></i>
            </div>
            <div>
              <h3 class="font-black text-base text-ink">{{ e.title }}</h3>
              <p class="text-xs text-[#5A6E99] mt-0.5">پایه {{ e.grade || 'هفتم' }} • درس {{ e.subject || 'عمومی' }}</p>
              
              <div class="flex items-center gap-3 text-xs text-slate-500 font-bold mt-2 flex-wrap">
                <span class="flex items-center gap-1">
                  <i data-lucide="list-ordered" class="w-3.5 h-3.5 text-royal"></i>
                  <span>{{ faNum(e.question_count || (e.questions?.length || 5)) }} سؤال</span>
                </span>
                <span>•</span>
                <span class="flex items-center gap-1">
                  <i data-lucide="clock" class="w-3.5 h-3.5 text-royal"></i>
                  <span>{{ faNum(e.duration_minutes || 10) }} دقیقه</span>
                </span>
                <span>•</span>
                <span class="flex items-center gap-1 text-slate-600">
                  <i data-lucide="calendar" class="w-3.5 h-3.5"></i>
                  <span>مهلت: {{ e.deadline_fa || '۱۰ آبان ۱۴۰۵' }}</span>
                </span>
              </div>
            </div>
          </div>

          <button 
            @click="initExam(e)"
            class="btn bg-[#2b3fd6] hover:bg-[#1f2fa8] text-white font-extrabold text-xs sm:text-sm !min-h-[44px] !px-6 shadow-md shrink-0"
          >
            <i data-lucide="play" class="w-4 h-4 text-sun"></i>
            <span>شروع آزمون</span>
          </button>
        </div>
      </div>

      <!-- Done Exams List (Naghsh Yar Review Style) -->
      <div v-if="examTab === 'done'" class="space-y-3">
        <div 
          v-for="d in doneExams" 
          :key="d.id"
          class="card p-4 sm:p-5 flex items-center justify-between gap-3 border border-line shadow-sm"
        >
          <div class="flex items-center gap-3">
            <div 
              :class="[
                'w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 shadow-sm',
                d.percentage >= 70 ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : d.percentage >= 40 ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-red-100 text-red-800 border border-red-200'
              ]"
            >
              {{ faNum(d.percentage) }}٪
            </div>
            <div>
              <h4 class="font-extrabold text-sm sm:text-base text-ink">{{ d.title }}</h4>
              <p class="text-xs text-[#5A6E99] mt-0.5">ثبت شده در {{ d.date_fa || '۴ آبان ۱۴۰۵' }} • نمره: {{ faNum(d.score || 18) }} از ۲۰</p>
            </div>
          </div>

          <button 
            @click="openReview(d)"
            class="btn btn-soft !min-h-[38px] !px-4 text-xs font-bold shrink-0"
          >
            <span>مرور پاسخ‌ها</span>
            <i data-lucide="chevron-left" class="w-4 h-4"></i>
          </button>
        </div>
      </div>

      <!-- Self-Assessment Exam Creator Modal (ساخت آزمون خودسنجی نقش‌یار) -->
      <div v-if="selfOpen" class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm">
        <div class="card p-5 sm:p-6 max-w-lg w-full bg-white rounded-[28px] shadow-2xl rise space-y-4 border border-line">
          <div class="flex items-center justify-between border-b border-line pb-3">
            <div class="flex items-center gap-2">
              <i data-lucide="sparkles" class="w-5 h-5 text-sun"></i>
              <h3 class="font-black text-lg text-ink">ساخت آزمون خودسنجی هوشمند</h3>
            </div>
            <button @click="selfOpen = false" class="w-8 h-8 rounded-xl bg-mist flex items-center justify-center border-none cursor-pointer">
              <i data-lucide="x" class="w-4 h-4"></i>
            </button>
          </div>

          <p class="text-xs text-[#5A6E99] leading-relaxed">
            مباحث مورد نظرت را برای سنجش انتخاب کن تا آزمون با زمان‌سنج و محاسبه نمره منفی ساخته شود:
          </p>

          <!-- Question Count Selector Chips -->
          <div>
            <label class="block text-xs font-extrabold text-ink mb-1.5">تعداد سؤالات آزمون:</label>
            <div class="grid grid-cols-4 gap-2">
              <button 
                v-for="n in [5, 10, 15, 20]" 
                :key="n"
                type="button"
                @click="selfQCount = n"
                :class="[
                  'py-2 rounded-xl text-xs font-black transition-all border cursor-pointer',
                  selfQCount === n ? 'bg-[#2b3fd6] text-white border-[#2b3fd6] shadow' : 'bg-mist text-slate-600 border-line hover:border-royal'
                ]"
              >
                {{ faNum(n) }} سؤال
              </button>
            </div>
          </div>

          <!-- Topics Selector -->
          <div>
            <label class="block text-xs font-extrabold text-ink mb-1.5">مباحث آزمون خودسنجی:</label>
            <div class="grid grid-cols-2 gap-2 text-xs">
              <button 
                v-for="top in selfTopicsMaster"
                :key="top.id"
                type="button"
                @click="toggleTopic(top.id)"
                :class="[
                  'p-2.5 rounded-xl border text-right font-bold transition-all flex items-center justify-between cursor-pointer',
                  selectedTopics.includes(top.id) ? 'bg-blue-50 border-royal text-royal shadow-sm' : 'bg-white border-line text-slate-600'
                ]"
              >
                <span>{{ top.name }}</span>
                <i v-if="selectedTopics.includes(top.id)" data-lucide="check" class="w-3.5 h-3.5 text-royal"></i>
              </button>
            </div>
          </div>

          <!-- Footer Buttons -->
          <div class="flex items-center justify-end gap-2 pt-3 border-t border-line">
            <button @click="selfOpen = false" class="btn btn-ghost text-xs font-bold !min-h-[40px]">
              انصراف
            </button>
            <button 
              @click="createAndLaunchSelfExam"
              :disabled="selectedTopics.length === 0"
              class="btn bg-[#2b3fd6] text-white hover:bg-[#1f2fa8] text-xs font-black !min-h-[42px] !px-6 shadow"
            >
              <span>شروع آزمون خودسنجی</span>
              <i data-lucide="play" class="w-4 h-4 text-sun"></i>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- PHASE 2: EXAM INTRO (Naghsh Yar Intro Fact Screen) -->
    <div v-else-if="phase === 'intro'" class="max-w-xl mx-auto space-y-5 rise">
      <div class="card p-6 sm:p-7 space-y-5 border border-line shadow-md">
        <div class="text-center space-y-1">
          <span class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-blue-50 text-royal">
            آماده‌سازی آزمون
          </span>
          <h2 class="text-2xl font-black text-ink mt-2">{{ currentExam.title }}</h2>
          <p class="text-xs text-[#5A6E99]">قبل از شروع، این چند نکته را بخوانید.</p>
        </div>

        <ul class="space-y-3 bg-mist p-4 sm:p-5 rounded-2xl border border-line/60 text-xs sm:text-sm text-ink leading-relaxed">
          <li class="flex items-center gap-3">
            <i data-lucide="list-checks" class="w-5 h-5 text-royal shrink-0"></i>
            <span><b>{{ faNum(currentQuestions.length) }} سؤال</b> چهارگزینه‌ای مفهومی و طبقه‌بندی‌شده.</span>
          </li>
          <li class="flex items-center gap-3">
            <i data-lucide="clock" class="w-5 h-5 text-royal shrink-0"></i>
            <span>زمان آزمون <b>{{ faNum(currentExam.duration_minutes || 10) }} دقیقه</b> است و با شروع، زمان‌سنج روشن می‌شود.</span>
          </li>
          <li class="flex items-center gap-3">
            <i data-lucide="alert-triangle" class="w-5 h-5 text-amber-500 shrink-0"></i>
            <span>محاسبه استاندارد نمره منفی: هر <b>۳ پاسخ غلط</b> یک پاسخ درست را خنثی می‌کند.</span>
          </li>
          <li class="flex items-center gap-3">
            <i data-lucide="refresh-cw" class="w-5 h-5 text-emerald-600 shrink-0"></i>
            <span>می‌توانی آزادانه بین سؤال‌ها جابه‌جا شوی، گزینه‌ها را تغییر دهی یا پاسخ را پاک کنی.</span>
          </li>
        </ul>

        <div class="flex items-center gap-3 pt-2">
          <button @click="phase = 'list'" class="btn btn-ghost text-xs font-bold !min-h-[46px]">
            بازگشت به فهرست
          </button>
          <button 
            @click="startRunningExam" 
            class="flex-1 btn bg-[#2b3fd6] hover:bg-[#1f2fa8] text-white font-black text-base !min-h-[50px] shadow-lg"
          >
            <i data-lucide="play" class="w-5 h-5 text-sun"></i>
            <span>شروع آزمون</span>
          </button>
        </div>
      </div>
    </div>

    <!-- PHASE 3: EXAM RUNNER (Naghsh Yar Complete Exam Runner) -->
    <div v-else-if="phase === 'run'" class="fixed inset-0 z-50 bg-[#F6F4EF] flex flex-col overflow-y-auto">
      
      <!-- Naghsh Yar Exam Header Bar -->
      <header class="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-[#e4e1d8] px-4 py-3 flex items-center justify-between shadow-sm">
        <div class="flex items-center gap-3">
          <span class="text-xs sm:text-sm font-bold text-slate-600">
            سؤال <b>{{ faNum(qIndex + 1) }}</b> از {{ faNum(currentQuestions.length) }}
          </span>
          <span class="hidden sm:inline text-slate-300">•</span>
          <span class="hidden sm:inline text-xs font-extrabold text-royal">{{ currentExam.title }}</span>
        </div>

        <!-- Timer with Naghsh Yar 'low' alert under 60 seconds -->
        <div 
          :class="[
            'px-3.5 py-1.5 rounded-xl font-mono text-sm font-black flex items-center gap-1.5 shadow-sm transition-all',
            remainSeconds <= 60 ? 'bg-red-500 text-white animate-pulse' : 'bg-[#e8ebff] text-[#2b3fd6]'
          ]"
        >
          <i data-lucide="clock" class="w-4 h-4"></i>
          <span>{{ formatClock(remainSeconds) }}</span>
        </div>
      </header>

      <!-- Naghsh Yar Top Progress Line -->
      <div class="w-full h-1.5 bg-[#e4e1d8] overflow-hidden">
        <div 
          class="h-full bg-[#2b3fd6] transition-all duration-300"
          :style="{ width: `${((qIndex + 1) / (currentQuestions.length || 1)) * 100}%` }"
        ></div>
      </div>

      <!-- Main Question Body -->
      <main class="flex-1 max-w-2xl w-full mx-auto p-4 sm:p-6 flex flex-col justify-between space-y-5">
        
        <div v-if="currentQuestion" class="space-y-4">
          <!-- Question Statement Card -->
          <div class="card p-5 sm:p-6 border border-[#e4e1d8] shadow-sm bg-white rounded-2xl">
            <div class="flex items-center justify-between mb-3">
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black bg-[#e8ebff] text-[#2b3fd6]">
                سؤال شماره {{ faNum(qIndex + 1) }}
              </span>
              <span v-if="answers[currentQuestion.id] !== undefined" class="text-xs font-bold text-emerald-600 flex items-center gap-1">
                <i data-lucide="check" class="w-3.5 h-3.5"></i>
                <span>پاسخ داده شده</span>
              </span>
              <span v-else class="text-xs font-bold text-slate-400">
                پاسخ داده نشده
              </span>
            </div>

            <h3 class="text-base sm:text-lg font-black text-ink leading-relaxed">
              {{ currentQuestion.q }}
            </h3>
          </div>

          <!-- Naghsh Yar 4 Option Radio Buttons -->
          <div class="space-y-2.5">
            <button 
              v-for="(opt, optIdx) in currentQuestion.options" 
              :key="optIdx"
              @click="pickOption(currentQuestion.id, optIdx)"
              :class="[
                'w-full p-4 rounded-2xl border text-right transition-all flex items-center gap-3.5 cursor-pointer font-bold text-sm sm:text-base',
                answers[currentQuestion.id] === optIdx
                  ? 'bg-[#e8ebff] border-[#2b3fd6] text-[#2b3fd6] shadow-sm ring-2 ring-[#2b3fd6]/20'
                  : 'bg-white border-[#e4e1d8] text-ink hover:border-[#2b3fd6]/50'
              ]"
            >
              <span 
                :class="[
                  'w-8 h-8 rounded-xl font-mono text-sm font-black flex items-center justify-center shrink-0 border transition-all',
                  answers[currentQuestion.id] === optIdx 
                    ? 'bg-[#2b3fd6] text-white border-[#2b3fd6]' 
                    : 'bg-slate-100 text-slate-600 border-slate-200'
                ]"
              >
                {{ faNum(optIdx + 1) }}
              </span>
              <span class="flex-1 leading-relaxed">{{ opt }}</span>
            </button>
          </div>

          <!-- Clear Choice Button -->
          <div v-if="answers[currentQuestion.id] !== undefined" class="text-left pt-1">
            <button 
              @click="clearOption(currentQuestion.id)"
              class="text-xs font-bold text-slate-400 hover:text-red-500 transition-colors flex items-center gap-1 border-none bg-transparent cursor-pointer"
            >
              <i data-lucide="x" class="w-3.5 h-3.5"></i>
              <span>پاک کردن پاسخ این سؤال</span>
            </button>
          </div>
        </div>

        <!-- Question Fast-Jump Matrix (گرید شماره سوالات نقش‌یار) -->
        <div class="bg-white p-3.5 rounded-2xl border border-[#e4e1d8] space-y-2">
          <div class="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>ماتریس دسترسی سریع به سؤالات:</span>
            <span>{{ faNum(Object.keys(answers).length) }} از {{ faNum(currentQuestions.length) }} پاسخ داده شده</span>
          </div>
          <div class="flex gap-1.5 flex-wrap">
            <button 
              v-for="(qItem, idx) in currentQuestions" 
              :key="qItem.id || idx"
              @click="qIndex = idx"
              :class="[
                'w-9 h-9 rounded-xl font-mono text-xs font-bold flex items-center justify-center transition-all border cursor-pointer',
                idx === qIndex 
                  ? 'ring-2 ring-amber-400 bg-[#2b3fd6] text-white font-black scale-110 shadow-md'
                  : answers[qItem.id] !== undefined
                    ? 'bg-[#e8ebff] text-[#2b3fd6] border-[#2b3fd6]/40 font-bold'
                    : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
              ]"
            >
              {{ faNum(idx + 1) }}
            </button>
          </div>
        </div>

        <!-- Bottom Navigation Controls -->
        <footer class="flex items-center justify-between gap-3 pt-4 border-t border-[#e4e1d8]">
          <button 
            @click="qIndex--" 
            :disabled="qIndex === 0"
            class="btn btn-soft text-xs sm:text-sm font-bold !min-h-[44px]"
          >
            <i data-lucide="chevron-right" class="w-4 h-4"></i>
            <span>سؤال قبل</span>
          </button>

          <button 
            v-if="qIndex < currentQuestions.length - 1"
            @click="qIndex++"
            class="btn bg-[#2b3fd6] hover:bg-[#1f2fa8] text-white text-xs sm:text-sm font-bold !min-h-[44px] !px-6 shadow"
          >
            <span>سؤال بعد</span>
            <i data-lucide="chevron-left" class="w-4 h-4"></i>
          </button>

          <button 
            v-else
            @click="promptFinish"
            class="btn bg-amber-500 hover:bg-amber-600 text-ink font-black text-xs sm:text-sm !min-h-[44px] !px-6 shadow-lg"
          >
            <i data-lucide="check" class="w-5 h-5"></i>
            <span>پایان و ثبت آزمون</span>
          </button>
        </footer>
      </main>

      <!-- Confirmation Modal on Finish (Naghsh Yar Prompt) -->
      <div v-if="showConfirmFinish" class="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
        <div class="card p-6 max-w-sm w-full bg-white rounded-2xl shadow-2xl space-y-4 rise text-center">
          <div class="w-14 h-14 mx-auto rounded-full bg-amber-100 text-amber-700 flex items-center justify-center">
            <i data-lucide="alert-circle" class="w-8 h-8"></i>
          </div>
          <h3 class="font-black text-lg text-ink">آیا مایل به پایان آزمون هستید؟</h3>
          <p class="text-xs text-[#5A6E99] leading-relaxed">
            <span v-if="unansweredCount > 0" class="text-red-500 font-bold block mb-1">
              شما {{ faNum(unansweredCount) }} سؤال را پاسخ نداده‌اید.
            </span>
            بعد از پایان آزمون، پاسخ‌های شما تصحیح شده و کارنامه صادر می‌شود.
          </p>

          <div class="grid grid-cols-2 gap-2 pt-2">
            <button @click="showConfirmFinish = false" class="btn btn-ghost text-xs font-bold">
              ادامه آزمون
            </button>
            <button @click="submitExamFinal" :disabled="submitting" class="btn btn-royal text-xs font-black shadow">
              <span v-if="submitting">در حال تصحیح...</span>
              <span v-else>ثبت نهایی</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- PHASE 4: EXAM RESULT & QUESTION REVIEW (Naghsh Yar ResultView) -->
    <div v-else-if="phase === 'result'" class="space-y-5 rise">
      <!-- Result Score Hero -->
      <div class="card p-6 sm:p-7 border border-line shadow-md text-center space-y-4 bg-white rounded-2xl">
        <div class="w-16 h-16 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-sm">
          <i data-lucide="award" class="w-9 h-9"></i>
        </div>
        <div>
          <h2 class="text-2xl font-black text-ink">نتیجه آزمون: {{ currentExam.title }}</h2>
          <p class="text-xs text-[#5A6E99] mt-1">کارنامه شما با احتساب نمره منفی ثبت شد.</p>
        </div>

        <!-- 4 Stats Cards -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
          <div class="p-3.5 rounded-2xl bg-blue-50 border border-blue-100">
            <p class="text-xs text-[#5A6E99] font-bold">درصد کل</p>
            <p class="text-2xl font-black text-[#2b3fd6] mt-0.5">{{ faNum(resultData.percentage) }}٪</p>
          </div>
          <div class="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-100">
            <p class="text-xs text-emerald-700 font-bold">پاسخ‌های صحیح</p>
            <p class="text-2xl font-black text-emerald-600 mt-0.5">{{ faNum(resultData.correctCount) }}</p>
          </div>
          <div class="p-3.5 rounded-2xl bg-red-50 border border-red-100">
            <p class="text-xs text-red-700 font-bold">پاسخ‌های غلط</p>
            <p class="text-2xl font-black text-red-500 mt-0.5">{{ faNum(resultData.wrongCount) }}</p>
          </div>
          <div class="p-3.5 rounded-2xl bg-slate-100 border border-slate-200">
            <p class="text-xs text-slate-500 font-bold">بدون پاسخ</p>
            <p class="text-2xl font-black text-slate-600 mt-0.5">{{ faNum(resultData.blankCount) }}</p>
          </div>
        </div>

        <div class="p-3 rounded-xl bg-amber-50 text-amber-800 text-xs font-bold border border-amber-200 flex items-center justify-center gap-1.5">
          <i data-lucide="sparkles" class="w-4 h-4 text-sun"></i>
          <span>تبریک! +{{ faNum(resultData.pointsEarned || 20) }} امتیاز به کارنامه رشد شما اضافه شد!</span>
        </div>

        <div class="flex items-center justify-center gap-3 pt-2">
          <button @click="phase = 'list'" class="btn btn-royal !min-h-[44px] !px-8 text-xs font-black shadow">
            بازگشت به فهرست آزمون‌ها
          </button>
        </div>
      </div>

      <!-- Question-by-Question Review (تحلیل و مرور تشریحی تک‌تک سوالات) -->
      <div class="space-y-3">
        <h3 class="font-black text-lg text-ink px-1 flex items-center gap-2">
          <i data-lucide="file-search" class="w-5 h-5 text-royal"></i>
          <span>مرور و تحلیل سؤالات آزمون:</span>
        </h3>

        <div 
          v-for="(rq, idx) in currentQuestions" 
          :key="rq.id || idx"
          class="card p-4 sm:p-5 border border-line shadow-sm space-y-3 bg-white"
        >
          <div class="flex items-center justify-between">
            <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-black bg-slate-100 text-slate-700">
              سؤال {{ faNum(idx + 1) }}
            </span>
            <span 
              :class="[
                'text-xs font-bold px-2 py-0.5 rounded-full',
                answers[rq.id] === undefined 
                  ? 'bg-slate-100 text-slate-600'
                  : answers[rq.id] === rq.correct 
                    ? 'bg-emerald-100 text-emerald-800' 
                    : 'bg-red-100 text-red-800'
              ]"
            >
              {{ answers[rq.id] === undefined ? 'بدون پاسخ' : answers[rq.id] === rq.correct ? '✓ پاسخ درست' : '✗ پاسخ نادرست' }}
            </span>
          </div>

          <p class="font-extrabold text-sm sm:text-base text-ink leading-relaxed">{{ rq.q }}</p>

          <div class="space-y-2 pt-1 text-xs sm:text-sm">
            <div 
              v-for="(opt, oIdx) in rq.options" 
              :key="oIdx"
              :class="[
                'p-3 rounded-xl border flex items-center justify-between font-bold',
                rq.correct === oIdx
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900 ring-1 ring-emerald-300'
                  : answers[rq.id] === oIdx
                    ? 'bg-red-50 border-red-300 text-red-900'
                    : 'bg-slate-50/70 border-slate-200 text-slate-600'
              ]"
            >
              <div class="flex items-center gap-2">
                <span class="w-6 h-6 rounded-lg bg-white/80 border text-xs flex items-center justify-center font-mono font-black">
                  {{ faNum(oIdx + 1) }}
                </span>
                <span>{{ opt }}</span>
              </div>
              
              <span v-if="rq.correct === oIdx" class="text-xs font-black text-emerald-700">
                (پاسخ صحیح)
              </span>
              <span v-else-if="answers[rq.id] === oIdx" class="text-xs font-bold text-red-600">
                (انتخاب شما)
              </span>
            </div>
          </div>

          <!-- Explanation Solution Box -->
          <div class="p-3 rounded-xl bg-blue-50/60 border border-blue-100 text-xs text-slate-700 space-y-1">
            <p class="font-extrabold text-[#2b3fd6] flex items-center gap-1">
              <i data-lucide="help-circle" class="w-3.5 h-3.5"></i>
              <span>پاسخ تشریحی استاد:</span>
            </p>
            <p class="leading-relaxed">
              {{ rq.explanation || 'با بررسی گزینه‌ها، گزینه صحیح بر مبنای مباحث تدریس‌شده مشخص گردیده است.' }}
            </p>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';
import { faNum, refreshIcons, playBeep } from '../utils';

const props = defineProps({
  user: { type: Object, required: true },
  freshExams: { type: Array, default: () => [] }
});

const emit = defineEmits(['exam-finished']);

const phase = ref('list'); // 'list' | 'intro' | 'run' | 'result'
const examTab = ref('fresh'); // 'fresh' | 'done'
const selfOpen = ref(false);
const selfQCount = ref(10);
const selectedTopics = ref(['math', 'iq']);

// Master topics for self-assessment generator
const selfTopicsMaster = [
  { id: 'math', name: 'ریاضیات و هندسه تیزهوشان' },
  { id: 'iq', name: 'هوش و استعداد تحلیلی' },
  { id: 'science', name: 'علوم تجربی و شیمی' },
  { id: 'farsi', name: 'زبان و ادبیات فارسی' }
];

function toggleTopic(id) {
  if (selectedTopics.value.includes(id)) {
    selectedTopics.value = selectedTopics.value.filter(x => x !== id);
  } else {
    selectedTopics.value.push(id);
  }
}

// Done exams history
const doneExams = ref([
  {
    id: 101,
    title: 'آزمون ریاضی فصل ۳ (کسرها و اعداد صحیح)',
    score: 18,
    percentage: 85,
    date_fa: '۳ آبان ۱۴۰۵',
    correctCount: 4,
    wrongCount: 1,
    blankCount: 0
  },
  {
    id: 102,
    title: 'آزمون علوم فصل ۲ (انرژی و پیوندهای شیمیایی)',
    score: 19,
    percentage: 92,
    date_fa: '۲۷ مهر ۱۴۰۵',
    correctCount: 5,
    wrongCount: 0,
    blankCount: 0
  }
]);

// Current Exam & Running State
const currentExam = ref({});
const currentQuestions = ref([]);
const qIndex = ref(0);
const answers = ref({});
const remainSeconds = ref(600);
let timerInterval = null;
const showConfirmFinish = ref(false);
const submitting = ref(false);
const resultData = ref({});

const currentQuestion = computed(() => {
  return currentQuestions.value[qIndex.value] || null;
});

const unansweredCount = computed(() => {
  return Math.max(0, currentQuestions.value.length - Object.keys(answers.value).length);
});

function formatClock(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${faNum(String(m).padStart(2, '0'))}:${faNum(String(s).padStart(2, '0'))}`;
}

function initExam(examItem) {
  playBeep(700, 0.1);
  currentExam.value = examItem;
  
  // Fetch full exam questions from API or build questions
  fetch(`/api/exams/${examItem.id}`)
    .then(r => r.json())
    .then(data => {
      currentExam.value = data;
      currentQuestions.value = data.questions || [];
      phase.value = 'intro';
      nextTick(() => refreshIcons());
    })
    .catch(() => {
      currentQuestions.value = examItem.questions || [];
      phase.value = 'intro';
      nextTick(() => refreshIcons());
    });
}

function createAndLaunchSelfExam() {
  selfOpen.value = false;
  playBeep(800, 0.15);
  
  const sampleSelfQuestions = [
    { id: 1001, q: 'اگر مساحت مربعی ۶۴ سانتی‌متر مربع باشد، محیط آن چند سانتی‌متر است؟', options: ['۲۴', '۳۲', '۱۶', '۴۸'], correct: 1, explanation: 'طول ضلع مربع ۸ است (۸ × ۸ = ۶۴). محیط مربع: ۴ × ۸ = ۳۲ سانتی‌متر.' },
    { id: 1002, q: 'کدام گزینه نمونه‌ای از تغییر شیمیایی است؟', options: ['ذوب یخ', 'تبخیر آب', 'سوختن چوب', 'خرد کردن کاغذ'], correct: 2, explanation: 'سوختن چوب تغییر شیمیایی است زیرا ساختار ماده تغییر کرده و گاز کربن دی‌اکسید و خاکستر پدید می‌آید.' },
    { id: 1003, q: 'نسبت معکوس عدد ۳/۴ به عدد ۲/۳ برابر است با:', options: ['۹/۸', '۸/۹', '۲', '۱/۲'], correct: 0, explanation: 'معکوس ۳/۴ برابر با ۴/۳ است. نسبت (۴/۳) به (۲/۳) پس از ساده‌سازی کسرها برابر با ۴/۲ یعنی ۲ نیست بلکه معکوس آن ۹/۸ می‌باشد.' },
    { id: 1004, q: 'کدام کلمه با سایر کلمات هم‌خانواده نیست؟', options: ['عالم', 'معلوم', 'تعلیم', 'علامت'], correct: 3, explanation: 'کلمات عالم، معلوم و تعلیم از ریشه (ع-ل-م) به معنی دانش هستند، ولی علامت از ریشه نشانه است.' },
    { id: 1005, q: 'در دنباله اعداد ۲، ۶، ۱۲، ۲۰، ... عدد بعدی کدام است؟', options: ['۲۸', '۳۰', '۳۲', '۳۶'], correct: 1, explanation: 'اختلاف اعداد به ترتیب ۴، ۶، ۸ است؛ پس اختلاف بعدی ۱۰ خواهد بود: ۲۰ + ۱۰ = ۳۰.' }
  ];

  currentExam.value = {
    id: `self_${Date.now()}`,
    title: `آزمون خودسنجی (${selfTopicsMaster.filter(t => selectedTopics.value.includes(t.id)).map(t => t.name.split(' ')[0]).join(' و ')})`,
    duration_minutes: Math.max(5, selfQCount.value * 1.5),
    question_count: selfQCount.value
  };

  currentQuestions.value = sampleSelfQuestions.slice(0, selfQCount.value);
  phase.value = 'intro';
  nextTick(() => refreshIcons());
}

function startRunningExam() {
  playBeep(880, 0.15);
  phase.value = 'run';
  qIndex.value = 0;
  answers.value = {};
  remainSeconds.value = (currentExam.value.duration_minutes || 10) * 60;

  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    if (remainSeconds.value > 0) {
      remainSeconds.value--;
    } else {
      clearInterval(timerInterval);
      submitExamFinal();
    }
  }, 1000);

  nextTick(() => refreshIcons());
}

function pickOption(qId, optIdx) {
  playBeep(600, 0.08);
  if (answers.value[qId] === optIdx) {
    delete answers.value[qId];
  } else {
    answers.value[qId] = optIdx;
  }
}

function clearOption(qId) {
  playBeep(400, 0.08);
  delete answers.value[qId];
}

function promptFinish() {
  showConfirmFinish.value = true;
  nextTick(() => refreshIcons());
}

async function submitExamFinal() {
  showConfirmFinish.value = false;
  submitting.value = true;
  if (timerInterval) clearInterval(timerInterval);

  try {
    // If real backend exam
    if (typeof currentExam.value.id === 'number') {
      const res = await fetch(`/api/exams/${currentExam.value.id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: props.user.id,
          answers: answers.value
        })
      });
      const data = await res.json();
      resultData.value = {
        percentage: data.percentage || 80,
        correctCount: data.score || 4,
        wrongCount: Math.max(0, currentQuestions.value.length - (data.score || 4) - unansweredCount.value),
        blankCount: unansweredCount.value,
        pointsEarned: data.points_earned || 25
      };
    } else {
      // Self-assessment local evaluation
      let correct = 0;
      let wrong = 0;
      currentQuestions.value.forEach(q => {
        if (answers.value[q.id] === q.correct) correct++;
        else if (answers.value[q.id] !== undefined) wrong++;
      });
      const netScore = Math.max(0, correct - (wrong / 3));
      const pct = Math.round((netScore / currentQuestions.value.length) * 100);

      resultData.value = {
        percentage: pct,
        correctCount: correct,
        wrongCount: wrong,
        blankCount: unansweredCount.value,
        pointsEarned: 20
      };
    }

    emit('exam-finished', resultData.value);
    phase.value = 'result';
  } catch (err) {
    console.error('Submit exam error:', err);
    phase.value = 'list';
  } finally {
    submitting.value = false;
    nextTick(() => refreshIcons());
  }
}

function openReview(doneItem) {
  currentExam.value = doneItem;
  resultData.value = {
    percentage: doneItem.percentage,
    correctCount: doneItem.correctCount || 4,
    wrongCount: doneItem.wrongCount || 1,
    blankCount: doneItem.blankCount || 0,
    pointsEarned: 20
  };
  currentQuestions.value = [
    { id: 1, q: 'کدام گزینه تعریف دقیق عدد اول است؟', options: ['عددی که فقط دو مقسوم‌علیه متمایز دارد (یک و خودش)', 'عددی که بر ۲ بخش‌پذیر نباشد', 'عددی که فرد باشد', 'عددی که بر هیچ عددی بخش‌پذیر نباشد'], correct: 0, explanation: 'عدد اول عددی طبیعی بزرگتر از ۱ است که فقط بر ۱ و خودش بخش‌پذیر است.' },
    { id: 2, q: 'حاصل عبارت (-۸) + (+۱۲) کدام است؟', options: ['-۴', '+۴', '-۲۰', '+۲۰'], correct: 1, explanation: 'علامت عدد بزرگتر (+) است، بنابراین ۱۲ منهای ۸ برابر +۴ است.' }
  ];
  answers.value = { 1: 0, 2: 1 };
  phase.value = 'result';
  nextTick(() => refreshIcons());
}

onMounted(() => {
  nextTick(() => refreshIcons());
});

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval);
});
</script>
