import { signIn } from '../services/auth.js';
import { navigate } from '../utils/router.js';

export function render(container) {
  container.innerHTML = `
    <div class="fade-up max-w-md mx-auto mt-10">
      <div class="bg-gray-900 border border-gray-800 rounded-xl p-6 shadow-lg">
        <h2 class="text-2xl font-bold text-center text-white mb-6">เข้าสู่ระบบ</h2>
        <form id="login-form" class="space-y-4">
          <div>
            <label class="block text-sm text-gray-400 mb-1">อีเมล</label>
            <input type="email" id="email" class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-brand transition" required autocomplete="email">
          </div>
          <div>
            <label class="block text-sm text-gray-400 mb-1">รหัสผ่าน</label>
            <input type="password" id="password" class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-brand transition" required autocomplete="current-password">
          </div>
          <div id="login-error" class="text-red-400 text-sm hidden"></div>
          <button type="submit" class="btn-brand w-full text-center py-3">เข้าสู่ระบบ</button>
        </form>
        <p class="text-center mt-4 text-sm text-gray-400">
          ยังไม่มีบัญชี? <a href="#/register" class="text-brand hover:underline">สมัครสมาชิก</a>
        </p>
      </div>
    </div>`;

  document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorEl = document.getElementById('login-error');

    try {
      await signIn(email, password);
      window.dispatchEvent(new Event('auth-change'));
      navigate('/home');
    } catch (error) {
      errorEl.textContent = error.message;
      errorEl.classList.remove('hidden');
    }
  });
}