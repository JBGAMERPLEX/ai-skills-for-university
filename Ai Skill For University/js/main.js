// js/main.js
// ============================================================
// Modular component loader for the "AI Skills for University" site
// Dynamically injects navbar and footer HTML into page placeholders.
// ============================================================

(function () {
  'use strict';

  /**
   * Fetches an HTML partial and injects it into a target element.
   * @param {string} url       - Path to the component file (e.g., 'components/navbar.html')
   * @param {string} targetId  - ID of the placeholder element in the host page
   * @returns {Promise<void>}
   */
/**
 * Fetches an HTML partial and injects it into a target element.
 * ⭐ Fixed: re-append <style> blocks so browser processes them correctly
 * @param {string} url       - Path to the component file
 * @param {string} targetId  - ID of the placeholder element
 */
async function loadComponent(url, targetId) {
  const target = document.getElementById(targetId);
  if (!target) {
    console.warn(`[main.js] Placeholder #${targetId} not found — skipping ${url}`);
    return;
  }
  try {
    const response = await fetch(url, { cache: 'no-cache' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const html = await response.text();
    target.innerHTML = html;

    // ⭐ Fix: Force browser to process injected <style> blocks
    // Browsers often ignore <style> tags inserted via innerHTML.
    // We clone each one and replace it in-place to force re-evaluation.
    const styles = target.querySelectorAll('style');
    styles.forEach(oldStyle => {
      const newStyle = document.createElement('style');
      newStyle.textContent = oldStyle.textContent;
      // Copy over any attributes (e.g., type, media)
      Array.from(oldStyle.attributes).forEach(attr => {
        newStyle.setAttribute(attr.name, attr.value);
      });
      oldStyle.parentNode.replaceChild(newStyle, oldStyle);
    });

  } catch (err) {
    console.error(`[main.js] Failed to load ${url}:`, err);
    target.innerHTML = `<p class="text-red-500 p-4">⚠️ Could not load component: ${url}</p>`;
  }
}

  /**
   * Detects the current page filename and adds the 'active' class
   * to matching links in both desktop and mobile menus.
   */
  function setActiveLink() {
    // Extract the filename from the current URL (defaults to index.html)
    const path = window.location.pathname;
    const currentFile = path.split('/').pop() || 'index.html';

    document.querySelectorAll('[data-page]').forEach(link => {
      if (link.getAttribute('data-page') === currentFile) {
        link.classList.add('active');
      }
    });
  }

  /**
   * Initializes the mobile hamburger menu toggle.
   */
  function initMobileMenu() {
    const btn      = document.getElementById('mobile-menu-btn');
    const menu     = document.getElementById('mobile-menu');
    const iconOpen = document.getElementById('icon-open');
    const iconClose = document.getElementById('icon-close');

    if (!btn || !menu) return;

    btn.addEventListener('click', () => {
      const isHidden = menu.classList.contains('hidden');
      menu.classList.toggle('hidden', !isHidden);
      iconOpen.classList.toggle('hidden', isHidden);
      iconClose.classList.toggle('hidden', isHidden);
      btn.setAttribute('aria-expanded', String(isHidden));
    });
  }

  /**
   * Sets the current year in the footer's #current-year element.
   */
  function setYear() {
    const el = document.getElementById('current-year');
    if (el) el.textContent = new Date().getFullYear();
  }

  // ------------------------------------------------------------
  // Bootstrap: runs after the DOM is ready
  // ------------------------------------------------------------
document.addEventListener('DOMContentLoaded', async () => {
  // 1. Load shared components
  await Promise.all([
    loadComponent('components/navbar.html', 'navbar-placeholder'),
    loadComponent('components/footer.html', 'footer-placeholder'),
  ]);

  // 2. Initialize i18n
  if (window.I18n) await window.I18n.init();

  // 3. ⭐ Initialize AOS (Animate On Scroll)
  if (typeof AOS !== 'undefined') {
    AOS.init({
      duration: 800,        // ความเร็ว animation (ms)
      easing: 'ease-out-cubic', // รูปแบบการเคลื่อนที่
      once: true,           // เล่นครั้งเดียว (ไม่เล่นซ้ำเวลา scroll กลับ)
      offset: 80,           // เริ่ม animate เมื่อ element ห่างจากขอบล่าง 80px
      delay: 0,             // delay เริ่มต้น
    });
  }

  // 4. Other setup
  setActiveLink();
  initMobileMenu();
  setYear();
  
  // 5. ⭐ Initialize Scroll to Top Button
  initScrollToTop();
});

/**
 * ⭐ Scroll to Top Button Logic
 * Shows button when scrolled down > 300px, smooth scrolls to top on click.
 */
function initScrollToTop() {
  const scrollBtn = document.getElementById('scroll-to-top-btn');
  if (!scrollBtn) return;

  // Show/Hide on scroll
  window.addEventListener('scroll', () => {
    if (window.scrollY > 300) {
      scrollBtn.classList.remove('opacity-0', 'translate-y-10', 'pointer-events-none');
      scrollBtn.classList.add('opacity-100', 'translate-y-0');
    } else {
      scrollBtn.classList.add('opacity-0', 'translate-y-10', 'pointer-events-none');
      scrollBtn.classList.remove('opacity-100', 'translate-y-0');
    }
  });

  // Smooth scroll to top on click
  scrollBtn.addEventListener('click', () => {
    window.scrollTo({ 
      top: 0, 
      behavior: 'smooth' 
    });
  });
}
})();   