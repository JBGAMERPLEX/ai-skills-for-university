import { getSupabaseClient } from '../services/supabase.js';

let newPassword = '';

export function render(container) {
  container.innerHTML = `
    <div class="fade-up max-w-md mx-auto mt-10">
      <div class="bg-gray-900 border border-gray-800 rounded-xl p-6 shadow-lg">
        <h2 class="text-2xl font-bold text-center text-white mb-6">ลืมรหัสผ่าน?</h2>
        <p class="text-sm text-gray-400 text-center mb-4">กรอกอีเมลที่ใช้สมัคร แล้วระบบจะแสดงรหัสผ่านใหม่ให้</p>
        <form id="forgot-form" class="space-y-4">
          <div>
            <label class="block text-sm text-gray-400 mb-1">อีเมล</label>
            <input type="email" id="forgot-email" class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-brand" required>
          </div>
          <div id="forgot-error" class="text-red-400 text-sm hidden"></div>
          <div id="forgot-success" class="text-green-400 text-sm hidden"></div>
          <button type="submit" class="btn-brand w-full py-3">รีเซ็ตรหัสผ่าน</button>
        </form>

        <!-- ส่วนแสดงเมื่อรีเซ็ตสำเร็จ -->
        <div id="reset-result" class="hidden space-y-3 mt-4">
          <div class="bg-gray-800 p-3 rounded-lg text-center">
            <p class="text-sm text-gray-400">รหัสผ่านใหม่ของคุณ</p>
            <p class="text-lg font-bold text-white mt-1" id="new-password-display"></p>
          </div>
          <button id="copy-password-btn" class="btn-outline-brand w-full py-3">
            <i class="bi bi-clipboard"></i> คัดลอกรหัสผ่าน
          </button>
          <p id="copy-hint" class="text-xs text-gray-500 text-center hidden">
            คัดลอกรหัสผ่านแล้ว กรุณากลับไปหน้าเข้าสู่ระบบเพื่อเข้าสู่ระบบด้วยรหัสผ่านใหม่
          </p>
        </div>

        <p class="text-center mt-4 text-sm text-gray-400">
          จำรหัสผ่านได้แล้ว? <a href="#/login" class="text-brand hover:underline">เข้าสู่ระบบ</a>
        </p>
      </div>
    </div>`;

  document.getElementById('forgot-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('forgot-email').value.trim();
    const errorEl = document.getElementById('forgot-error');
    const successEl = document.getElementById('forgot-success');
    const resetResult = document.getElementById('reset-result');
    const copyHint = document.getElementById('copy-hint');
    
    errorEl.classList.add('hidden');
    successEl.classList.add('hidden');
    resetResult.classList.add('hidden');
    copyHint.classList.add('hidden');

    try {
      const supabase = await getSupabaseClient();
      const { data: newPwd, error } = await supabase.rpc('reset_user_password', {
        p_email: email
      });

      if (error) throw error;

      newPassword = newPwd;
      document.getElementById('new-password-display').textContent = newPwd;
      successEl.textContent = 'รีเซ็ตรหัสผ่านสำเร็จ';
      successEl.classList.remove('hidden');
      resetResult.classList.remove('hidden');
    } catch (err) {
      errorEl.textContent = err.message;
      errorEl.classList.remove('hidden');
    }
  });

  // ปุ่ม Copy
  document.getElementById('copy-password-btn').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(newPassword);
      // แสดงข้อความแนะนำ
      document.getElementById('copy-hint').classList.remove('hidden');
      // เปลี่ยนปุ่มเป็น "คัดลอกแล้ว"
      const btn = document.getElementById('copy-password-btn');
      btn.innerHTML = '<i class="bi bi-check-lg"></i> คัดลอกแล้ว';
      btn.disabled = true;
      btn.classList.add('opacity-50', 'cursor-not-allowed');
    } catch (err) {
      console.error('Copy failed:', err);
    }
  });
}