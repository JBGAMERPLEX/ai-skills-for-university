import { signUp } from '../services/auth.js';
import { navigate } from '../utils/router.js';

export function render(container) {
  container.innerHTML = `
    <div class="fade-up max-w-md mx-auto mt-10">
      <div class="bg-gray-900 border border-gray-800 rounded-xl p-6 shadow-lg">
        <h2 class="text-2xl font-bold text-center text-white mb-6">สมัครสมาชิก</h2>
        <form id="register-form" class="space-y-4">
          <div>
            <label class="block text-sm text-gray-400 mb-1">ชื่อ-นามสกุล</label>
            <input type="text" id="fullname" class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-brand transition" required>
          </div>
          <div>
            <label class="block text-sm text-gray-400 mb-1">อีเมล</label>
            <input type="email" id="email" class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-brand transition" required>
          </div>
          <div>
            <label class="block text-sm text-gray-400 mb-1">รหัสผ่าน (อย่างน้อย 8 ตัว)</label>
            <input type="password" id="password" class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-brand transition" minlength="8" required>
          </div>
          <div>
            <label class="block text-sm text-gray-400 mb-1">บทบาท</label>
            <select id="role" class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-brand transition" required>
              <option value="learner">ผู้เรียน</option>
              <option value="content_creator">ผู้สร้างคอร์ส</option>
              <option value="content_manager">ผู้จัดการเนื้อหา</option>
            </select>
          </div>
          <div id="register-error" class="text-red-400 text-sm hidden"></div>
          <button type="submit" class="btn-brand w-full text-center py-3">สมัครสมาชิก</button>
        </form>
        <p class="text-center mt-4 text-sm text-gray-400">
          มีบัญชีแล้ว? <a href="#/login" class="text-brand hover:underline">เข้าสู่ระบบ</a>
        </p>
      </div>
    </div>`;

  document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fullName = document.getElementById('fullname').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const role = document.getElementById('role').value;
    const errorEl = document.getElementById('register-error');

    try {
      await signUp(email, password, fullName, role);
      window.dispatchEvent(new Event('auth-change'));
      navigate('/login');
      alert('สมัครสมาชิกสำเร็จ! กรุณาเข้าสู่ระบบ');
    } catch (error) {
      errorEl.textContent = error.message;
      errorEl.classList.remove('hidden');
    }
  });
}