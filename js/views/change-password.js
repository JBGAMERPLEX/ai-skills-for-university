import { getSession, signOut } from '../services/auth.js';
import { getSupabaseClient } from '../services/supabase.js';
import { navigate } from '../utils/router.js';

export async function render(container) {
  const user = await getSession();
  if (!user) {
    navigate('/login');
    return;
  }

  container.innerHTML = `
    <div class="fade-up max-w-md mx-auto mt-10">
      <div class="bg-gray-900 border border-gray-800 rounded-xl p-6 shadow-lg">
        <h2 class="text-2xl font-bold text-center text-white mb-4">ตั้งรหัสผ่านใหม่</h2>
        <p class="text-sm text-gray-400 text-center mb-6">เพื่อความปลอดภัย กรุณาตั้งรหัสผ่านใหม่ก่อนใช้งานต่อ</p>
        <form id="change-password-form" class="space-y-4">
          <div>
            <label class="block text-sm text-gray-400 mb-1">รหัสผ่านใหม่</label>
            <input type="password" id="new-password" class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-brand" minlength="8" required>
          </div>
          <div>
            <label class="block text-sm text-gray-400 mb-1">ยืนยันรหัสผ่านใหม่</label>
            <input type="password" id="confirm-password" class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-brand" minlength="8" required>
          </div>
          <div id="change-error" class="text-red-400 text-sm hidden"></div>
          <button type="submit" class="btn-brand w-full py-3">บันทึกรหัสผ่านใหม่</button>
        </form>
      </div>
    </div>`;

  document.getElementById('change-password-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    const errorEl = document.getElementById('change-error');
    
    if (newPassword !== confirmPassword) {
      errorEl.textContent = 'รหัสผ่านไม่ตรงกัน';
      errorEl.classList.remove('hidden');
      return;
    }

    try {
      const supabase = await getSupabaseClient();
      const { error } = await supabase.rpc('update_user_password', {
        p_user_id: user.id,
        p_new_password: newPassword
      });

      if (error) throw error;

      // ออกจากระบบแล้วไปหน้า login
      await signOut();
      window.dispatchEvent(new Event('auth-change'));
      navigate('/login');
    } catch (err) {
      errorEl.textContent = err.message;
      errorEl.classList.remove('hidden');
    }
  });
}