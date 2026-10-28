<template>
  <div class="bg-white min-h-screen pb-16">
    <!-- Store Header (rosh-step5-parents-store.html) -->
    <header class="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-line">
      <div class="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-11 h-11 rounded-2xl brand-bg flex items-center justify-center text-white shadow-md">
            <i data-lucide="graduation-cap" class="w-6 h-6 text-sun"></i>
          </div>
          <div>
            <p class="font-extrabold text-sm text-ink">کانون نخبه‌پروری</p>
            <p class="text-[11px] text-[#5A6E99]">شهید کاظم آشتیانی</p>
          </div>
        </div>

        <nav class="hidden sm:flex gap-1 text-xs font-bold" aria-label="دسته‌بندی">
          <button 
            @click="activeCat = 'all'" 
            :class="['px-3.5 py-2 rounded-xl transition-all cursor-pointer border-none font-bold', activeCat === 'all' ? 'bg-[#E8F0FF] text-royal' : 'text-[#5A6E99] bg-transparent']"
          >
            خانه
          </button>
          <button 
            @click="activeCat = 'course'" 
            :class="['px-3.5 py-2 rounded-xl transition-all cursor-pointer border-none font-bold', activeCat === 'course' ? 'bg-[#E8F0FF] text-royal' : 'text-[#5A6E99] bg-transparent']"
          >
            دوره‌ها
          </button>
          <button 
            @click="activeCat = 'booklet'" 
            :class="['px-3.5 py-2 rounded-xl transition-all cursor-pointer border-none font-bold', activeCat === 'booklet' ? 'bg-[#E8F0FF] text-royal' : 'text-[#5A6E99] bg-transparent']"
          >
            جزوه‌ها
          </button>
        </nav>

        <div class="flex items-center gap-2">
          <!-- Back Button -->
          <button 
            @click="$emit('back')" 
            class="h-11 px-3 sm:px-3.5 rounded-2xl bg-[#E8F0FF] text-royal flex items-center gap-1.5 font-bold text-xs hover:bg-royal hover:text-white transition-all border-none cursor-pointer"
            title="بازگشت به پنل کاربری"
          >
            <i data-lucide="arrow-right" class="w-4 h-4"></i>
            <span class="hidden sm:inline">بازگشت به پنل</span>
            <span class="sm:hidden">بازگشت</span>
          </button>

          <!-- Cart Button -->
          <button 
            @click="openCart = true" 
            class="relative w-11 h-11 rounded-2xl bg-[#E8F0FF] text-royal flex items-center justify-center cursor-pointer hover:bg-royal hover:text-white transition-all border-none"
            aria-label="سبد خرید"
          >
            <i data-lucide="shopping-cart" class="w-5 h-5"></i>
            <span 
              v-if="cart.length > 0" 
              class="absolute -top-1 -left-1 min-w-[20px] h-[20px] px-1 rounded-full bg-sun text-ink text-[10px] font-black flex items-center justify-center shadow"
            >
              {{ faNum(cart.length) }}
            </span>
          </button>
        </div>
      </div>
    </header>

    <main class="max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-8 space-y-4 sm:space-y-8">
      <!-- Store Hero Banner -->
      <div 
        class="rounded-[24px] sm:rounded-[28px] p-5 sm:p-10 text-white relative overflow-hidden" 
        style="background:linear-gradient(135deg,#0A4BD6,#0B1F4D)"
      >
        <div class="dots absolute inset-0 opacity-40"></div>
        <div class="relative max-w-lg space-y-2 sm:space-y-3">
          <span class="tag bg-sun text-ink font-bold text-[11px] sm:text-xs">تخفیف ویژه دوره‌های سمپاد</span>
          <h1 class="text-xl sm:text-4xl font-extrabold leading-snug">
            دوره‌های تخصصی و بسته‌های آزمون تیزهوشان
          </h1>
          <p class="text-xs sm:text-sm text-white/80 leading-relaxed">
            آموزش‌های ویدیویی اساتید برجسته کانون به همراه بسته‌های جزوات تمام‌رنگی طبقه‌بندی شده
          </p>
        </div>
      </div>

      <!-- Category Filter Pills (Mobile & Desktop) -->
      <div class="flex gap-2 overflow-x-auto text-xs font-bold pb-1 no-scrollbar">
        <button 
          @click="activeCat = 'all'" 
          :class="['px-4 py-2 rounded-xl transition-all border text-xs font-bold whitespace-nowrap cursor-pointer', activeCat === 'all' ? 'bg-royal border-royal text-white shadow' : 'bg-white border-line text-[#5A6E99]']"
        >
          همه محصولات
        </button>
        <button 
          @click="activeCat = 'course'" 
          :class="['px-4 py-2 rounded-xl transition-all border text-xs font-bold whitespace-nowrap cursor-pointer', activeCat === 'course' ? 'bg-royal border-royal text-white shadow' : 'bg-white border-line text-[#5A6E99]']"
        >
          دوره‌های ویدیویی
        </button>
        <button 
          @click="activeCat = 'booklet'" 
          :class="['px-4 py-2 rounded-xl transition-all border text-xs font-bold whitespace-nowrap cursor-pointer', activeCat === 'booklet' ? 'bg-royal border-royal text-white shadow' : 'bg-white border-line text-[#5A6E99]']"
        >
          جزوه‌ها و کتب کار
        </button>
      </div>

      <!-- Products Grid (2 columns on mobile, 4 columns on desktop) -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        <div 
          v-for="p in filteredProducts" 
          :key="p.id" 
          class="card overflow-hidden flex flex-col justify-between hover:shadow-lg transition-all"
        >
          <div>
            <div 
              class="h-28 sm:h-40 flex items-center justify-center text-white text-3xl sm:text-5xl relative p-3 sm:p-4"
              :style="{ background: p.bg_color }"
            >
              <i v-if="p.type === 'course'" data-lucide="video" class="w-8 h-8 sm:w-12 sm:h-12"></i>
              <i v-else data-lucide="book-open" class="w-8 h-8 sm:w-12 sm:h-12"></i>
              <span v-if="p.badge" class="absolute top-2 right-2 sm:top-3 sm:right-3 tag bg-sun text-ink font-bold text-[10px] sm:text-[11px] shadow">
                {{ p.badge }}
              </span>
            </div>

            <div class="p-3 sm:p-4 space-y-1.5 sm:space-y-2">
              <h3 class="font-extrabold text-xs sm:text-sm text-ink leading-snug line-clamp-1">{{ p.title }}</h3>
              <p class="text-[11px] sm:text-xs text-[#5A6E99] leading-relaxed line-clamp-2 hidden sm:block">{{ p.description }}</p>
              <div class="text-[10px] sm:text-[11px] font-bold text-royal bg-mist p-1.5 sm:p-2 rounded-xl truncate">
                {{ p.meta }}
              </div>
            </div>
          </div>

          <div class="p-3 sm:p-4 pt-0 space-y-2 sm:space-y-3">
            <div class="flex items-center justify-between">
              <div>
                <p class="font-black text-ink text-sm sm:text-base">{{ money(p.price) }} <span class="text-[10px] sm:text-xs font-normal text-[#5A6E99]">تومان</span></p>
                <p v-if="p.old_price" class="text-[10px] sm:text-xs text-late line-through font-semibold">{{ money(p.old_price) }}</p>
              </div>
            </div>

            <button 
              @click="addToCart(p)" 
              class="btn btn-royal w-full !min-h-[36px] sm:!min-h-[42px] !px-2 text-xs font-black shadow-sm"
            >
              <i data-lucide="plus" class="w-3.5 h-3.5 sm:w-4 sm:h-4"></i>
              <span>افزودن</span>
            </button>
          </div>
        </div>
      </div>
    </main>

    <!-- Footer (rosh-step5-parents-store.html) -->
    <footer class="mt-12 brand-bg relative text-white">
      <div class="dots absolute inset-0 opacity-40"></div>
      <div class="relative max-w-5xl mx-auto px-4 py-10 grid sm:grid-cols-3 gap-6 text-sm">
        <div>
          <p class="font-extrabold text-[18px]">کانون نخبه‌پروری شهید کاظم آشتیانی</p>
          <p class="text-white/75 mt-1 text-xs">دوره‌های آموزشی و جزوه‌های رسمی کانون</p>
        </div>
        <div class="space-y-1 text-xs text-white/85">
          <p class="flex items-center gap-2"><i data-lucide="map-pin" class="w-4 h-4 text-sun"></i> نشانی: تهران، کانون نخبگان</p>
          <p class="flex items-center gap-2"><i data-lucide="phone" class="w-4 h-4 text-sun"></i> تلفن پشتیبانی: ۰۲۱-۸۸۸۸۴۴۲۲</p>
        </div>
        <p class="text-white/60 sm:text-left text-xs">نمونه طراحی جهت ارائه، پرداخت واقعی متصل نیست.</p>
      </div>
    </footer>

    <!-- Cart Drawer / Modal -->
    <div v-if="openCart" class="fixed inset-0 z-50 bg-ink/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div class="w-full sm:max-w-md bg-white rounded-t-[28px] sm:rounded-[28px] p-6 max-h-[90vh] overflow-y-auto space-y-4 rise">
        <div class="flex items-center justify-between border-b border-line pb-3">
          <h3 class="text-lg font-extrabold flex items-center gap-2">
            <i data-lucide="shopping-cart" class="w-5 h-5 text-royal"></i>
            <span>سبد خرید شما</span>
          </h3>
          <button @click="openCart = false" class="w-9 h-9 rounded-xl bg-mist flex items-center justify-center border-none cursor-pointer">
            <i data-lucide="x" class="w-5 h-5"></i>
          </button>
        </div>

        <div v-if="cart.length === 0" class="text-center py-8 text-[#5A6E99] text-sm">
          سبد خرید شما در حال حاضر خالی است.
        </div>

        <div v-else class="space-y-3">
          <div 
            v-for="(item, idx) in cart" 
            :key="idx" 
            class="flex items-center justify-between p-3.5 rounded-2xl bg-mist text-xs"
          >
            <div>
              <p class="font-bold text-ink text-sm">{{ item.title }}</p>
              <p class="text-royal font-black mt-1">{{ money(item.price) }} تومان</p>
            </div>
            <button @click="removeFromCart(idx)" class="text-late p-1.5 rounded-lg hover:bg-red-50 border-none cursor-pointer" title="حذف">
              <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
          </div>

          <!-- Discount code input -->
          <div class="flex gap-2 pt-2">
            <input 
              v-model="discountCode" 
              class="input text-xs font-bold" 
              placeholder="کد تخفیف (مثلاً ROSHD)" 
            />
            <button @click="applyDiscount" class="btn btn-soft text-xs font-black shrink-0">
              اعمال تخفیف
            </button>
          </div>

          <!-- Total Calculation -->
          <div class="p-4 rounded-2xl bg-[#EEF4FF] space-y-1 text-xs">
            <div class="flex justify-between">
              <span>مجموع مبلغ:</span>
              <span>{{ money(cartTotal) }} تومان</span>
            </div>
            <div v-if="discountPercent > 0" class="flex justify-between text-ok font-bold">
              <span>تخفیف ({{ faNum(discountPercent) }}٪):</span>
              <span>-{{ money(cartTotal * (discountPercent / 100)) }} تومان</span>
            </div>
            <div class="flex justify-between text-base font-black text-ink pt-2 border-t border-line">
              <span>مبلغ نهایی:</span>
              <span class="text-royal">{{ money(cartFinalTotal) }} تومان</span>
            </div>
          </div>

          <button @click="checkout" class="btn btn-royal w-full font-black py-4">
            <i data-lucide="wallet" class="w-5 h-5"></i>
            <span>پرداخت و ثبت نهایی سفارش</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Success Modal -->
    <div v-if="successModal" class="fixed inset-0 z-50 bg-ink/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div class="card p-6 max-w-sm w-full text-center rise space-y-4">
        <div class="w-20 h-20 mx-auto rounded-full bg-[#E6F7EE] text-ok flex items-center justify-center">
          <i data-lucide="party-popper" class="w-10 h-10 text-ok"></i>
        </div>
        <h3 class="text-2xl font-extrabold text-ink">پرداخت نمونه انجام شد</h3>
        <p class="text-xs text-[#5A6E99]">کد پیگیری سفارش شما:</p>
        <p class="text-lg font-black text-royal" dir="ltr">{{ successModal.tracking_code }}</p>
        <p class="text-xs text-[#5A6E99]">در نسخه نهایی، اینجا به درگاه پرداخت شاپرک متصل می‌شود.</p>
        <button @click="successModal = null" class="btn btn-royal w-full">
          بازگشت به فروشگاه
        </button>
      </div>
    </div>

    <!-- Toast Notification -->
    <div 
      v-if="toastMsg" 
      class="fixed top-5 left-1/2 -translate-x-1/2 z-[80] bg-ink text-white rounded-2xl px-5 py-3 shadow-2xl font-bold flex items-center gap-2 rise"
    >
      <i data-lucide="circle-check" class="w-5 h-5 text-sun"></i>
      <span>{{ toastMsg }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue';
import { faNum, money, refreshIcons } from '../utils';

const products = ref([]);
const activeCat = ref('all');
const cart = ref([]);
const openCart = ref(false);
const discountCode = ref('ROSHD');
const discountPercent = ref(0);
const successModal = ref(null);
const toastMsg = ref('');

watch([activeCat, openCart, successModal], () => {
  nextTick(() => refreshIcons());
});

function toast(msg) {
  toastMsg.value = msg;
  nextTick(() => refreshIcons());
  setTimeout(() => toastMsg.value = '', 3000);
}

const filteredProducts = computed(() => {
  if (activeCat.value === 'all') return products.value;
  return products.value.filter(p => p.type === activeCat.value);
});

const cartTotal = computed(() => {
  return cart.value.reduce((acc, item) => acc + item.price, 0);
});

const cartFinalTotal = computed(() => {
  return cartTotal.value * (1 - (discountPercent.value / 100));
});

function addToCart(p) {
  cart.value.push(p);
  toast(`«${p.title}» به سبد خرید اضافه شد!`);
}

function removeFromCart(idx) {
  cart.value.splice(idx, 1);
}

function applyDiscount() {
  if (discountCode.value.toUpperCase().includes('ROSHD')) {
    discountPercent.value = 20;
    toast('تخفیف ۲۰٪ اعمال شد!');
  } else {
    toast('کد تخفیف معتبر نیست');
  }
}

async function checkout() {
  try {
    const res = await fetch('/api/store/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: cart.value,
        total: cartFinalTotal.value
      })
    });
    const d = await res.json();
    successModal.value = d;
    cart.value = [];
    openCart.value = false;
  } catch (e) {
    console.error(e);
  } finally {
    nextTick(() => refreshIcons());
  }
}

async function loadProducts() {
  try {
    const res = await fetch('/api/store/products');
    products.value = await res.json();
  } catch (e) {
    console.error(e);
  } finally {
    nextTick(() => refreshIcons());
  }
}

onMounted(() => {
  loadProducts();
  refreshIcons();
});
</script>
