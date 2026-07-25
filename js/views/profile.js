import { getSession, getCurrentUser, getProfile, updateProfile, signOut } from '../services/auth.js';
import { navigate } from '../utils/router.js';

// ⚠️ Replace with your own ImgBB API key
const IMGBB_API_KEY = 'b5dedfe841575caa018fb970e5cb86f7';

export async function render(container) {
  const session = await getSession();
  if (!session) {
    container.innerHTML = '<div class="text-center py-20 text-gray-400">กรุณาเข้าสู่ระบบก่อน</div>';
    return;
  }

  const user = await getCurrentUser();
  const profile = await getProfile(user.id);

  // Generate avatar placeholder from name initials
  const initials = profile.full_name
    ? profile.full_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : 'U';
  const avatarPlaceholder = `https://ui-avatars.com/api/?name=${initials}&background=f9754a&color=fff&size=150`;

  container.innerHTML = `
    <div class="fade-up max-w-lg mx-auto mt-10">
      <div class="bg-gray-900 border border-gray-800 rounded-xl p-6 shadow-lg">
        <h2 class="text-2xl font-bold text-center text-white mb-6">โปรไฟล์ของฉัน</h2>
        <form id="profile-form" class="space-y-4">
          <!-- Avatar -->
          <div class="flex flex-col items-center mb-4">
            <div class="relative w-24 h-24 rounded-full overflow-hidden border-2 border-gray-700 mb-2">
              <img id="avatar-preview" src="${escapeHTML(profile.avatar_url || avatarPlaceholder)}" 
                   class="w-full h-full object-cover" alt="Avatar" />
            </div>
            <label for="avatar-input" class="text-sm text-brand cursor-pointer hover:underline">
              <i class="bi bi-camera"></i> เปลี่ยนรูปโปรไฟล์
            </label>
            <input type="file" id="avatar-input" class="hidden" accept="image/*" />
            <p id="upload-status" class="text-xs text-gray-500 mt-1 hidden"></p>
          </div>

          <div>
            <label class="block text-sm text-gray-400 mb-1">ชื่อ-นามสกุล</label>
            <input type="text" id="fullname" class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-brand transition" value="${escapeHTML(profile.full_name || '')}" required>
          </div>
          <div>
            <label class="block text-sm text-gray-400 mb-1">อีเมล</label>
            <input type="email" class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-gray-500 cursor-not-allowed" value="${escapeHTML(user.email)}" disabled>
          </div>
          <div>
            <label class="block text-sm text-gray-400 mb-1">บทบาท</label>
            <input type="text" class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-gray-500 cursor-not-allowed" value="${roleLabel(profile.role)}" disabled>
          </div>
          <div id="profile-error" class="text-red-400 text-sm hidden"></div>
          <div id="profile-success" class="text-green-400 text-sm hidden"></div>
          <div class="flex gap-3">
            <button type="submit" id="save-btn" class="btn-brand flex-1 py-3">
              <span id="save-text">บันทึก</span>
              <span id="save-spinner" class="hidden"><i class="bi bi-arrow-repeat animate-spin"></i></span>
            </button>
            <button type="button" id="profile-logout-btn" class="btn-outline-brand flex-1 py-3">ออกจากระบบ</button>
          </div>
        </form>
      </div>
    </div>`;

  let newAvatarUrl = profile.avatar_url || '';

  // Avatar upload handler
  document.getElementById('avatar-input').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Show preview instantly
    const reader = new FileReader();
    reader.onload = (ev) => {
      document.getElementById('avatar-preview').src = ev.target.result;
    };
    reader.readAsDataURL(file);

    const statusEl = document.getElementById('upload-status');
    statusEl.classList.remove('hidden');
    statusEl.textContent = 'กำลังอัปโหลด...';

    try {
      const formData = new FormData();
      formData.append('image', file);

      const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
        method: 'POST',
        body: formData
      });

      const json = await res.json();
      if (json.success) {
        newAvatarUrl = json.data.url;
        document.getElementById('avatar-preview').src = newAvatarUrl;
        statusEl.textContent = 'อัปโหลดสำเร็จ ✓';
      } else {
        statusEl.textContent = 'อัปโหลดล้มเหลว';
      }
    } catch (err) {
      statusEl.textContent = 'อัปโหลดล้มเหลว';
      console.error(err);
    }
  });

  // Form submission
  document.getElementById('profile-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fullName = document.getElementById('fullname').value.trim();
    const errorEl = document.getElementById('profile-error');
    const successEl = document.getElementById('profile-success');
    const saveBtn = document.getElementById('save-btn');
    const saveText = document.getElementById('save-text');
    const saveSpinner = document.getElementById('save-spinner');

    // Disable button & show spinner
    saveBtn.disabled = true;
    saveText.classList.add('hidden');
    saveSpinner.classList.remove('hidden');
    errorEl.classList.add('hidden');
    successEl.classList.add('hidden');

    try {
      await updateProfile(user.id, {
        full_name: fullName,
        avatar_url: newAvatarUrl || null
      });
      successEl.textContent = 'อัปเดตโปรไฟล์สำเร็จ';
      successEl.classList.remove('hidden');
      // Update Navbar and refresh page
      window.dispatchEvent(new Event('auth-change'));
      setTimeout(() => {
        saveBtn.disabled = false;
        saveText.classList.remove('hidden');
        saveSpinner.classList.add('hidden');
        navigate('/profile'); // reload page
      }, 800);
    } catch (err) {
      errorEl.textContent = err.message;
      errorEl.classList.remove('hidden');
      saveBtn.disabled = false;
      saveText.classList.remove('hidden');
      saveSpinner.classList.add('hidden');
    }
  });

  // Logout
  document.getElementById('profile-logout-btn').addEventListener('click', async () => {
    await signOut();
    window.dispatchEvent(new Event('auth-change'));
    navigate('/home');
  });
}

function escapeHTML(str) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

function roleLabel(r) {
  return {
    learner: 'ผู้เรียน',
    content_creator: 'ผู้สร้างคอร์ส',
    content_manager: 'ผู้จัดการเนื้อหา'
  }[r] || r;
}