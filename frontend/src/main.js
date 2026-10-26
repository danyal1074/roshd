import { createApp } from 'vue';
import App from './App.vue';

// Universal API interceptor for credentials and JWT auth
const originalFetch = window.fetch;
window.fetch = function(url, options = {}) {
  const opts = { ...options };
  if (typeof url === 'string' && (url.startsWith('/api/') || url.includes('/api/'))) {
    opts.credentials = opts.credentials || 'include';
    const token = localStorage.getItem('roshd_token');
    if (token) {
      opts.headers = {
        'Authorization': `Bearer ${token}`,
        ...(opts.headers || {})
      };
    }
  }
  return originalFetch(url, opts);
};

const app = createApp(App);
app.mount('#app');
