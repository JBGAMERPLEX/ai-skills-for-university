// js/ui/layout.js
import { navigate } from '../utils/router.js';
import { signOut, getSession, getProfile } from '../services/auth.js';

let currentUser = null;
let currentProfile = null;

export async function initLayout(rootElement) {
  renderShell(rootElement);
  await updateAuthState();
  window.addEventListener('auth-change', updateAuthState);
}

async function updateAuthState() {
  try {
    currentUser = await getSession();
    currentProfile = currentUser ? await getProfile(currentUser.id) : null;
  } catch (e) {
    currentUser = null;
    currentProfile = null;
  }
  updateNavbarUI();
}

function renderShell(root) {
  root.innerHTML = `
    <nav id="app-navbar" class="sticky top-0 z-50 backdrop-blur-lg bg-gray-950/90 border-b border-gray-800"></nav>
    <main id="main-content" class="max-w-7xl mx-auto px-3 py-4 min-h-screen"></main>
    <footer class="border-t border-gray-800 py-4 bg-gray-950/70 text-xs">
      <div class="max-w-7xl mx-auto px-3 flex flex-col sm:flex-row justify-between items-center gap-2 text-gray-500">
        <div class="flex items-center gap-2">
          <span class="font-semibold text-white"><span class="text-brand">AI Skills</span> for University</span>
          <span class="hidden sm:inline opacity-50">|</span>
          <span>© 2026 <a href="#/team" class="text-gray-400 hover:text-white transition">ทีมงาน ลาบเลิฟเวอร์</a></span>
        </div>
        <div class="flex gap-3">
          <a href="#/about" class="hover:text-white transition">เกี่ยวกับเรา</a>
          <a href="#/faq" class="hover:text-white transition">คำถามที่พบบ่อย</a>
          <a href="#/contact" class="hover:text-white transition">ติดต่อ</a>
          <a href="#/privacy" class="hover:text-white transition">ความเป็นส่วนตัว</a>
        </div>
      </div>
    </footer>
  `;
  updateNavbarUI();
}

function updateNavbarUI() {
  const navbar = document.getElementById('app-navbar');
  if (!navbar) return;

  const brandHTML = `
    <a href="#/home" class="flex items-center text-lg font-bold text-white tracking-tight">
      <span class="text-brand">AI Skills</span><span class="hidden sm:inline">&nbsp;for University</span>
    </a>`;

  let desktopMenu = '';
  let mobileMenu = '';

  if (currentUser && currentProfile) {
    const roleLabel = {
      learner: 'ผู้เรียน',
      content_creator: 'ผู้สร้างคอร์ส',
      content_manager: 'ผู้จัดการเนื้อหา'
    }[currentProfile.role] || '';

    const dashboardLinkDesktop = currentProfile.role === 'content_creator'
      ? `<a id="creator-link" href="#/creator" class="block px-2 py-1.5 text-sm text-gray-300 hover:bg-gray-800 rounded-md">แดชบอร์ด</a>`
      : (currentProfile.role === 'content_manager'
        ? `<a id="manager-link" href="#/manager" class="block px-2 py-1.5 text-sm text-gray-300 hover:bg-gray-800 rounded-md">ตรวจสอบคอร์ส</a>`
        : '');

    const dashboardLinkMobile = currentProfile.role === 'content_creator'
      ? `<a href="#/creator" class="block py-2 text-sm text-gray-400 hover:text-white">แดชบอร์ด</a>`
      : (currentProfile.role === 'content_manager'
        ? `<a href="#/manager" class="block py-2 text-sm text-gray-400 hover:text-white">ตรวจสอบคอร์ส</a>`
        : '');

    const avatarHTML = currentProfile?.avatar_url
      ? `<img src="${escapeHTML(currentProfile.avatar_url)}" alt="avatar" class="w-7 h-7 rounded-full object-cover border border-gray-600" />`
      : `<i class="bi bi-person-circle text-lg"></i>`;

    desktopMenu = `
      <div class="relative ml-2">
        <button id="user-menu-btn" class="flex items-center gap-1.5 py-1.5 px-2 rounded-full hover:bg-gray-800 transition text-sm">
          ${avatarHTML}
          <span class="hidden sm:inline font-medium">${escapeHTML(currentProfile.full_name || currentUser.email)}</span>
        </button>
        <div id="user-dropdown" class="absolute right-0 mt-1 w-52 bg-gray-900 border border-gray-800 rounded-lg shadow-lg p-1.5 z-50 hidden text-sm">
          <span class="block text-xs text-gray-500 px-2 py-1">${escapeHTML(roleLabel)}</span>
          <a href="#/my-courses" class="block px-2 py-1.5 text-gray-300 hover:bg-gray-800 rounded-md">คอร์สของฉัน</a>
          ${dashboardLinkDesktop}
          <a id="profile-link" href="#/profile" class="block px-2 py-1.5 text-gray-300 hover:bg-gray-800 rounded-md">โปรไฟล์</a>
          <button class="logout-btn w-full text-left px-2 py-1.5 text-gray-300 hover:bg-gray-800 rounded-md">ออกจากระบบ</button>
        </div>
      </div>`;

    mobileMenu = `
      <span class="block text-xs text-gray-500 px-2 pt-1">${escapeHTML(roleLabel)}</span>
      <a href="#/my-courses" class="block py-2 text-sm text-gray-400 hover:text-white">คอร์สของฉัน</a>
      ${dashboardLinkMobile}
      <a href="#/profile" class="block py-2 text-sm text-gray-400 hover:text-white">โปรไฟล์</a>
      <button class="logout-btn block w-full text-left py-2 text-sm text-gray-400 hover:text-white">ออกจากระบบ</button>`;
  } else {
    desktopMenu = `
      <div class="flex items-center gap-2">
        <button class="nav-login-btn btn-outline-brand text-xs px-3 py-1.5">เข้าสู่ระบบ</button>
        <button class="nav-register-btn btn-brand text-xs px-3 py-1.5">สมัครสมาชิก</button>
      </div>`;

    mobileMenu = `
      <button class="nav-login-btn btn-outline-brand w-full text-center py-3 text-sm mb-1">เข้าสู่ระบบ</button>
      <button class="nav-register-btn btn-brand w-full text-center py-3 text-sm">สมัครสมาชิก</button>`;
  }

  navbar.innerHTML = `
    <div class="max-w-7xl mx-auto px-3 flex items-center justify-between h-12">
      ${brandHTML}
      <!-- Desktop Menu -->
      <div class="hidden md:flex items-center gap-4 text-sm">
        <a href="#/home" class="text-gray-400 hover:text-white transition">หน้าหลัก</a>
        <a href="#/courses" class="text-gray-400 hover:text-white transition">คอร์สทั้งหมด</a>
        <a href="#/members" class="text-gray-400 hover:text-white transition">สมาชิก</a>
        ${desktopMenu}
      </div>
      <!-- Mobile Toggle -->
      <button id="mobile-toggle" class="md:hidden p-1.5 text-gray-400 hover:text-white">
        <i class="bi bi-list text-xl"></i>
      </button>
    </div>
    <!-- Mobile Menu -->
    <div id="mobile-menu" class="hidden md:hidden px-3 pb-2 space-y-1">
      <a href="#/home" class="block py-2 text-sm text-gray-400 hover:text-white">หน้าหลัก</a>
      <a href="#/courses" class="block py-2 text-sm text-gray-400 hover:text-white">คอร์สทั้งหมด</a>
      <a href="#/members" class="block py-2 text-sm text-gray-400 hover:text-white">สมาชิก</a>
      ${mobileMenu}
    </div>`;

  // Mobile toggle
  document.getElementById('mobile-toggle').addEventListener('click', () => {
    document.getElementById('mobile-menu').classList.toggle('hidden');
  });

  // ปิดเมนูมือถือเมื่อแตะลิงก์หรือปุ่ม
  document.querySelectorAll('#mobile-menu a, #mobile-menu button').forEach(el => {
    el.addEventListener('click', () => {
      document.getElementById('mobile-menu').classList.add('hidden');
    });
  });

  // User dropdown toggle
  const userMenuBtn = document.getElementById('user-menu-btn');
  const userDropdown = document.getElementById('user-dropdown');
  if (userMenuBtn && userDropdown) {
    userMenuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      userDropdown.classList.toggle('hidden');
    });
    document.addEventListener('click', () => {
      userDropdown.classList.add('hidden');
    });
  }

  // Login/Register buttons
  document.querySelectorAll('.nav-login-btn').forEach(btn => {
    btn.addEventListener('click', () => navigate('/login'));
  });
  document.querySelectorAll('.nav-register-btn').forEach(btn => {
    btn.addEventListener('click', () => navigate('/register'));
  });

  // ✅ Logout buttons (ทั้ง desktop และ mobile)
  document.querySelectorAll('.logout-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      await signOut();
      window.dispatchEvent(new Event('auth-change'));
      navigate('/home');
    });
  });

  // Event listeners อื่น ๆ สำหรับผู้ใช้ที่ล็อกอิน
  if (currentUser) {
    document.getElementById('profile-link')?.addEventListener('click', (e) => {
      e.preventDefault();
      navigate('/profile');
    });
    document.getElementById('creator-link')?.addEventListener('click', (e) => {
      e.preventDefault();
      navigate('/creator');
    });
    document.getElementById('manager-link')?.addEventListener('click', (e) => {
      e.preventDefault();
      navigate('/manager');
    });
  }
}

function escapeHTML(str) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}