import { createApp } from 'vue';
import App from './App.vue';

// Universal API interceptor for HttpOnly credentials and CSRF protection
const originalFetch = window.fetch;
window.fetch = function(url, options = {}) {
  const opts = { ...options };
  if (typeof url === 'string' && (url.startsWith('/api/') || url.includes('/api/'))) {
    opts.credentials = 'include';
    opts.headers = {
      'X-Requested-With': 'XMLHttpRequest',
      ...(opts.headers || {})
    };
  }
  return originalFetch(url, opts);
};

const app = createApp(App);
app.mount('#app');
