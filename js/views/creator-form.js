import { getSession } from '../services/auth.js';
import { getSupabaseClient } from '../services/supabase.js';
import { navigate } from '../utils/router.js';

const IMGBB_API_KEY = 'b5dedfe841575caa018fb970e5cb86f7'; // ✅ ใส่ key ของคุณ

let currentUser = null;

export async function render(container) {
  currentUser = await getSession();

  if (!currentUser || currentUser.role !== 'content_creator') {
    container.innerHTML = `
      <div class="text-center py-20">
        <i class="bi bi-shield-lock text-6xl text-gray-600"></i>
        <h2 class="text-2xl font-bold mt-4 text-white">ไม่มีสิทธิ์เข้าถึง</h2>
        <p class="text-gray-400 mt-2">เฉพาะผู้สร้างคอร์สเท่านั้น</p>
      </div>`;
    return;
  }

  container.innerHTML = `
    <div class="fade-up max-w-2xl mx-auto">
      <div class="flex items-center gap-4 mb-6">
        <button id="back-btn" class="p-2 text-gray-400 hover:text-white transition" title="กลับ">
          <i class="bi bi-arrow-left text-2xl"></i>
        </button>
        <h2 class="text-3xl font-bold text-white">สร้างคอร์สใหม่</h2>
      </div>
      <div class="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <form id="course-form" class="space-y-4">
          <div>
            <label class="block text-sm text-gray-400 mb-1">ชื่อคอร์ส</label>
            <input type="text" id="course-title" class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-brand" required>
          </div>
          <div>
            <label class="block text-sm text-gray-400 mb-1">คำอธิบาย</label>
            <textarea id="course-desc" rows="4" class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-brand"></textarea>
          </div>
          <div>
            <label class="block text-sm text-gray-400 mb-1">รูปปกคอร์ส</label>
            <input type="file" id="course-thumb-upload" class="hidden" accept="image/*">
            <div class="flex gap-2 items-center">
              <input type="text" id="course-thumb" class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-brand" placeholder="https://...">
              <button type="button" id="upload-course-thumb-btn" class="btn-outline-brand text-sm py-2 px-3 whitespace-nowrap">
                <i class="bi bi-upload"></i> อัปโหลด
              </button>
            </div>
            <div id="course-thumb-preview" class="mt-2 hidden">
              <img src="" class="h-32 rounded-lg object-cover border border-gray-700" />
            </div>
            <p id="upload-status" class="text-xs text-gray-500 mt-1 hidden"></p>
          </div>
          <div class="flex justify-end gap-3 pt-2">
            <button type="button" id="cancel-btn" class="btn-outline-brand text-sm py-2 px-4">ยกเลิก</button>
            <button type="submit" class="btn-brand text-sm py-2 px-4">สร้างคอร์ส</button>
          </div>
        </form>
      </div>
    </div>`;

  // ปุ่มย้อนกลับ / ยกเลิก
  document.getElementById('back-btn').addEventListener('click', () => navigate('/creator'));
  document.getElementById('cancel-btn').addEventListener('click', () => navigate('/creator'));

  // อัปโหลดรูปปก
  document.getElementById('upload-course-thumb-btn').addEventListener('click', () => {
    document.getElementById('course-thumb-upload').click();
  });

  document.getElementById('course-thumb-upload').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

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
        document.getElementById('course-thumb').value = json.data.url;
        const preview = document.getElementById('course-thumb-preview');
        preview.classList.remove('hidden');
        preview.querySelector('img').src = json.data.url;
        statusEl.textContent = 'อัปโหลดสำเร็จ ✓';
      } else {
        statusEl.textContent = 'อัปโหลดล้มเหลว';
      }
    } catch (err) {
      console.error(err);
      statusEl.textContent = 'อัปโหลดล้มเหลว';
    }
  });

  // ส่งฟอร์มสร้างคอร์ส
  document.getElementById('course-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('course-title').value.trim();
    const desc = document.getElementById('course-desc').value.trim();
    const thumb = document.getElementById('course-thumb').value.trim();
    const supabase = await getSupabaseClient();

    try {
      const { data, error } = await supabase.rpc('create_course', {
        p_user_id: currentUser.id,
        p_title: title,
        p_description: desc || null,
        p_thumbnail_url: thumb || null
      });
      if (error) throw error;

      let newId = data;
      if (typeof data === 'object' && data !== null) {
        newId = data.id || Object.values(data)[0];
      }
      navigate(`/creator/edit/${newId}`);
    } catch (err) {
      alert('เกิดข้อผิดพลาด: ' + err.message);
    }
  });
}