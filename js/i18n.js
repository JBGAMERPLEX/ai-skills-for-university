// js/i18n.js
// ============================================================
// Multilingual (i18n) system with Auto-Translate Fallback
// ============================================================

(function () {
  'use strict';

  // ----- Configuration -----
  const DEFAULT_LANG   = 'th';
  const STORAGE_KEY    = 'preferred-language';
  const CACHE_KEY      = 'i18n-auto-cache';
  const SUPPORTED      = ['th', 'en', 'zh', 'jp'];
  const AUTO_TRANSLATE = true; // ← เปิด/ปิด auto-translate

  const LANG_LABELS    = {
    th: { code: 'TH', flag: '🇹🇭', name: 'ไทย' },
    en: { code: 'EN', flag: '🇺🇸', name: 'English' },
  };

  // ----- State -----
  let currentLang  = DEFAULT_LANG;
  let translations = {};
  const cache      = {};
  const autoCache  = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');

  // ----- Helpers -----

  function detectLanguage() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && SUPPORTED.includes(stored)) return stored;
    const browser = (navigator.language || '').slice(0, 2).toLowerCase();
    return SUPPORTED.includes(browser) ? browser : DEFAULT_LANG;
  }

  async function loadLangFile(lang) {
    if (cache[lang]) return cache[lang];
    try {
      const res = await fetch(`lang/${lang}.json`, { cache: 'no-cache' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      cache[lang] = data;
      return data;
    } catch (err) {
      console.error(`[i18n] Failed to load lang/${lang}.json:`, err);
      return null;
    }
  }

  function getNestedValue(obj, path) {
    return path.split('.').reduce((acc, part) => (acc && acc[part] !== undefined ? acc[part] : undefined), obj);
  }

  // ----- Auto-Translate Function -----
  async function autoTranslate(text, fromLang, toLang) {
    if (!AUTO_TRANSLATE) return null;
    
    // Check cache first
    const cacheKey = `${fromLang}_${toLang}_${text}`;
    if (autoCache[cacheKey]) {
      console.log(`[i18n] 📦 Cache hit: "${text}" → "${autoCache[cacheKey]}"`);
      return autoCache[cacheKey];
    }

    try {
      // MyMemory API (ฟรี 5000 คำ/วัน, ไม่ต้อง API key)
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${fromLang}|${toLang}`;
      const res = await fetch(url);
      const data = await res.json();
      
      if (data.responseStatus === 200 && data.responseData?.translatedText) {
        const translated = data.responseData.translatedText;
        
        // Save to cache
        autoCache[cacheKey] = translated;
        localStorage.setItem(CACHE_KEY, JSON.stringify(autoCache));
        
        console.log(`[i18n] 🤖 Auto-translated: "${text}" → "${translated}"`);
        return translated;
      }
      
      console.warn(`[i18n] ⚠️ Auto-translate failed for: "${text}"`);
      return null;
    } catch (err) {
      console.error(`[i18n] ❌ Auto-translate error:`, err);
      return null;
    }
  }

  async function translateElement(el) {
    const key = el.getAttribute('data-i18n');
    if (!key) return;

    let value = getNestedValue(translations, key);
    
    // ถ้าไม่มีใน JSON → ลอง auto-translate จาก default lang
    if (value === undefined && AUTO_TRANSLATE && currentLang !== DEFAULT_LANG) {
      // Load default lang file เพื่อเอาต้นฉบับมาแปล
      const defaultTranslations = await loadLangFile(DEFAULT_LANG);
      const originalText = getNestedValue(defaultTranslations, key);
      
      if (originalText) {
        console.warn(`[i18n] 🔄 Missing key "${key}" in ${currentLang}.json — using auto-translate`);
        
        // แปลจาก default lang → current lang
        value = await autoTranslate(originalText, DEFAULT_LANG, currentLang);
      }
    }

    if (value === undefined) {
      console.warn(`[i18n] ⚠️ Missing translation key: "${key}" for lang "${currentLang}"`);
      return;
    }

    const attr = el.getAttribute('data-i18n-attr');
    if (attr) {
      attr.split(',').forEach(a => el.setAttribute(a.trim(), value));
    } else if (el.getAttribute('data-i18n-html') !== null) {
      el.innerHTML = value;
    } else {
      el.textContent = value;
    }
  }

  async function applyTranslations(root = document) {
    const elements = root.querySelectorAll('[data-i18n]');
    for (const el of elements) {
      await translateElement(el);
    }
    document.documentElement.setAttribute('lang', currentLang);
    updateLangButtonLabel();
  }

  function updateLangButtonLabel() {
    const btn = document.getElementById('lang-dropdown-btn');
    if (!btn) return;
    const info = LANG_LABELS[currentLang];
    btn.innerHTML = `
      <span class="text-base leading-none">${info.flag}</span>
      <span class="font-semibold text-sm">${info.code}</span>
      <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
      </svg>
    `;
    document.querySelectorAll('[data-lang-option]').forEach(item => {
      const isActive = item.getAttribute('data-lang-option') === currentLang;
      item.classList.toggle('bg-indigo-50', isActive);
      item.classList.toggle('text-indigo-700', isActive);
      item.classList.toggle('font-semibold', isActive);
    });
  }

  // ----- Public API -----

  async function changeLanguage(lang) {
    if (!SUPPORTED.includes(lang)) {
      console.warn(`[i18n] Unsupported language: ${lang}`);
      return;
    }
    currentLang = lang;
    localStorage.setItem(STORAGE_KEY, lang);

    const data = await loadLangFile(lang);
    if (!data) return;
    translations = data;

    await applyTranslations();
  }

  async function init() {
    console.log('[i18n] 🚀 Starting initialization...');
    
    currentLang = detectLanguage();
    console.log('[i18n] 🌍 Detected language:', currentLang);
    
    const data = await loadLangFile(currentLang);
    if (data) {
      translations = data;
      console.log('[i18n] ✅ Loaded translations:', Object.keys(data));
    } else {
      console.error('[i18n] ❌ Failed to load translations for:', currentLang);
    }

    if (AUTO_TRANSLATE) {
      console.log('[i18n] 🤖 Auto-translate enabled (MyMemory API)');
      console.log(`[i18n] 📦 Cached translations: ${Object.keys(autoCache).length}`);
    }

    const navbarBtn = document.getElementById('lang-dropdown-btn');
    const navbarMenu = document.getElementById('lang-dropdown-menu');
    console.log('[i18n] 🔍 Navbar button found:', !!navbarBtn);
    console.log('[i18n] 🔍 Navbar menu found:', !!navbarMenu);
    
    if (!navbarBtn || !navbarMenu) {
      console.warn('[i18n] ⚠️ Navbar dropdown elements not found!');
    }

    bindDropdown();
    await applyTranslations();
    
    console.log('[i18n] ✨ Initialization complete. Current lang:', currentLang);
  }

  function bindDropdown() {
    const btn  = document.getElementById('lang-dropdown-btn');
    const menu = document.getElementById('lang-dropdown-menu');
    if (!btn || !menu) return;

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      menu.classList.toggle('hidden');
      btn.setAttribute('aria-expanded', String(!menu.classList.contains('hidden')));
    });

    document.addEventListener('click', (e) => {
      if (!btn.contains(e.target) && !menu.contains(e.target)) {
        menu.classList.add('hidden');
        btn.setAttribute('aria-expanded', 'false');
      }
    });

    menu.querySelectorAll('[data-lang-option]').forEach(item => {
      item.addEventListener('click', async () => {
        const lang = item.getAttribute('data-lang-option');
        menu.classList.add('hidden');
        await changeLanguage(lang);
      });
    });
  }

  window.I18n = {
    init,
    changeLanguage,
    applyTranslations,
    getCurrentLang: () => currentLang,
    getSupported:   () => [...SUPPORTED],
    clearAutoCache: () => {
      localStorage.removeItem(CACHE_KEY);
      console.log('[i18n] 🗑️ Auto-translate cache cleared');
    }
  };
})();