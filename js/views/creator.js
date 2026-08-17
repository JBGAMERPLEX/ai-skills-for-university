import { getSession } from '../services/auth.js';
import { getSupabaseClient } from '../services/supabase.js';
import { navigate } from '../utils/router.js';
import { showConfirmModal } from '../utils/modal.js';

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
    <div class="fade-up">
      <div class="flex justify-between items-center mb-8">
        <h2 class="text-3xl font-bold text-white">แดชบอร์ดผู้สร้างคอร์ส</h2>
        <button id="create-btn" class="btn-brand gap-2">
          <i class="bi bi-plus-lg"></i> สร้างคอร์สใหม่
        </button>
      </div>
      <div id="course-list" class="space-y-4"></div>
    </div>`;

  document.getElementById('create-btn').addEventListener('click', () => {
    navigate('/creator/new');
  });

  await loadCourses();
}

async function loadCourses() {
  const supabase = await getSupabaseClient();
  const list = document.getElementById('course-list');

  try {
    const { data: courses, error } = await supabase.rpc('get_my_courses', { p_user_id: currentUser.id });
    if (error) throw error;

    if (!courses?.length) {
      list.innerHTML = '<p class="text-center text-gray-400 py-10">ยังไม่มีคอร์สของคุณ</p>';
      return;
    }

    list.innerHTML = courses.map(course => `
      <div class="bg-gray-900 border border-gray-800 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 class="text-white font-semibold text-lg">${escapeHTML(course.title)}</h3>
          <p class="text-gray-400 text-sm line-clamp-1">${escapeHTML(course.description || '')}</p>
          <span class="inline-block mt-1 badge badge-${course.status}">${statusText(course.status)}</span>
          ${course.reviewed_by ? `<p class="text-xs text-gray-500 mt-1">👤 ผู้ตรวจ: ${escapeHTML(course.reviewed_by)}</p>` : ''}
          ${course.review_comment ? `<p class="text-xs text-gray-500 mt-1">💬 ${escapeHTML(course.review_comment)}</p>` : ''}
        </div>
        <div class="flex gap-2">
          <!-- ปุ่มแก้ไข: แสดงทุกสถานะ -->
          <button class="edit-btn p-2 text-gray-400 hover:text-white transition" data-id="${course.id}" title="แก้ไข">
            <i class="bi bi-pencil"></i>
          </button>
          <!-- ปุ่มส่งตรวจ: แสดงเฉพาะ draft (รวมทั้งที่เพิ่งแก้ไขแล้วกลับมา draft) -->
          ${course.status === 'draft' ? `
            <button class="submit-btn p-2 text-green-400 hover:text-green-300 transition" data-id="${course.id}" title="ส่งตรวจ">
              <i class="bi bi-send"></i>
            </button>
          ` : ''}
          <!-- ปุ่มลบ: แสดงทุกสถานะ -->
          <button class="delete-btn p-2 text-red-400 hover:text-red-300 transition" data-id="${course.id}" title="ลบ">
            <i class="bi bi-trash"></i>
          </button>
        </div>
      </div>`).join('');

    // Edit buttons
    document.querySelectorAll('.edit-btn').forEach(b => {
      b.addEventListener('click', () => navigate(`/creator/edit/${b.dataset.id}`));
    });

    // Delete buttons (double-click to confirm)
    document.querySelectorAll('.delete-btn').forEach(b => {
      let clickCount = 0;
      let resetTimer;

      b.addEventListener('click', async () => {
        clickCount++;
        if (clickCount === 1) {
          b.classList.add('text-red-500');
          b.innerHTML = '<i class="bi bi-exclamation-triangle"></i>';
          resetTimer = setTimeout(() => {
            clickCount = 0;
            b.classList.remove('text-red-500');
            b.innerHTML = '<i class="bi bi-trash"></i>';
          }, 3000);
        } else if (clickCount === 2) {
          clearTimeout(resetTimer);
          const supabase = await getSupabaseClient();
          await supabase.rpc('delete_course', { p_user_id: currentUser.id, p_course_id: b.dataset.id });
          await loadCourses();
        }
      });
    });

    // Submit buttons (double-click to confirm)
    document.querySelectorAll('.submit-btn').forEach(b => {
      let clickCount = 0;
      let resetTimer;

      b.addEventListener('click', async () => {
        clickCount++;
        if (clickCount === 1) {
          b.classList.add('text-green-500');
          b.innerHTML = '<i class="bi bi-check-lg"></i> กดอีกครั้งเพื่อยืนยัน';
          resetTimer = setTimeout(() => {
            clickCount = 0;
            b.classList.remove('text-green-500');
            b.innerHTML = '<i class="bi bi-send"></i>';
          }, 3000);
        } else if (clickCount === 2) {
          clearTimeout(resetTimer);
          const supabase = await getSupabaseClient();
          await supabase.rpc('submit_for_review', { p_user_id: currentUser.id, p_course_id: b.dataset.id });
          await loadCourses();
        }
      });
    });

  } catch (err) {
    list.innerHTML = '<p class="text-red-400 text-center py-10">เกิดข้อผิดพลาดในการโหลดคอร์ส</p>';
  }
}

function escapeHTML(str) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

function statusText(s) {
  const map = {
    draft: 'ฉบับร่าง',
    pending: 'รอตรวจสอบ',
    approved: 'เผยแพร่แล้ว',
    published: 'เผยแพร่แล้ว',
    revision: 'ขอแก้ไข'
  };
  return map[s] || s;
}