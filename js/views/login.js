// js/views/login.js
import { signIn } from '../services/auth.js';
import { getSupabaseClient } from '../services/supabase.js';
import { navigate } from '../utils/router.js';

export function render(container) {
  container.innerHTML = `
    <div class="fade-up max-w-md mx-auto mt-10">
      <div class="bg-gray-900 border border-gray-800 rounded-xl p-6 shadow-lg">
        <h2 class="text-2xl font-bold text-center text-white mb-6">เข้าสู่ระบบ</h2>
        <form id="login-form" class="space-y-4">
          <div>
            <label class="block text-sm text-gray-400 mb-1">อีเมล</label>
            <input type="email" id="email" class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-brand" required autocomplete="email">
          </div>
          <div>
            <label class="block text-sm text-gray-400 mb-1">รหัสผ่าน</label>
            <input type="password" id="password" class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-brand" required autocomplete="current-password">
          </div>
          <div id="login-error" class="text-red-400 text-sm hidden"></div>
          <button type="submit" class="btn-brand w-full py-3">เข้าสู่ระบบ</button>
        </form>
        <div class="text-center mt-4 space-y-2">
          <p class="text-sm text-gray-400">
            <a href="#/forgot-password" class="text-brand hover:underline">ลืมรหัสผ่าน?</a>
          </p>
          <p class="text-sm text-gray-400">
            ยังไม่มีบัญชี? <a href="#/register" class="text-brand hover:underline">สมัครสมาชิก</a>
          </p>
        </div>
      </div>
    </div>`;

  document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const errorEl = document.getElementById('login-error');
    
    errorEl.classList.add('hidden');

    try {
      await signIn(email, password);
      
      // เช็กว่าต้องเปลี่ยนรหัสผ่านหรือไม่
      const supabase = await getSupabaseClient();
      const { data: userData } = await supabase
        .from('users')
        .select('must_change_password')
        .eq('email', email)
        .single();

      if (userData?.must_change_password) {
        navigate('/change-password');
      } else {
        window.dispatchEvent(new Event('auth-change'));
        navigate('/home');
      }
    } catch (error) {
      errorEl.textContent = error.message || 'เกิดข้อผิดพลาด';
      errorEl.classList.remove('hidden');
    }
  });
}