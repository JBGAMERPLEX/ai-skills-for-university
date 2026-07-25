const THEME_STORAGE_KEY = 'app-theme';
const TOGGLE_SELECTOR = '#theme-toggle';

function getSystemPreference() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem(THEME_STORAGE_KEY, theme);

  const toggle = document.querySelector(TOGGLE_SELECTOR);
  if (toggle) {
    toggle.checked = theme === 'dark';
  }
}

function getInitialTheme() {
  const saved = localStorage.getItem(THEME_STORAGE_KEY);
  if (saved === 'light' || saved === 'dark') return saved;
  return 'dark'; // default dark
}

export function initTheme() {
  const initialTheme = getInitialTheme();
  applyTheme(initialTheme);

  const toggle = document.querySelector(TOGGLE_SELECTOR);
  if (toggle) {
    toggle.addEventListener('change', (e) => {
      const newTheme = e.target.checked ? 'dark' : 'light';
      applyTheme(newTheme);
    });
  }

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    // เปลี่ยนตามระบบเฉพาะเมื่อผู้ใช้ยังไม่ได้ตั้งค่าเอง
    if (!localStorage.getItem(THEME_STORAGE_KEY)) {
      applyTheme(e.matches ? 'dark' : 'light');
    }
  });
}