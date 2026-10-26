export const faNum = (n) => String(n ?? '').replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]);

export const enNum = (s) => String(s ?? '').replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d));

export const money = (n) => faNum(Math.round(Number(n || 0)).toLocaleString('en-US')).replace(/,/g, '٬');

export function refreshIcons() {
  if (typeof window !== 'undefined' && window.lucide) {
    setTimeout(() => {
      try {
        window.lucide.createIcons();
      } catch (e) {
        // ignore
      }
    }, 20);
  }
}

export function playBeep(freq = 600, duration = 0.15) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = freq;
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + duration);
    setTimeout(() => {
      osc.stop();
      ctx.close();
    }, duration * 1000);
  } catch (e) {
    // AudioContext might be blocked until user gesture
  }
}
