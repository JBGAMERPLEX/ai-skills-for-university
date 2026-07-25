import { getSession } from '../services/auth.js';
import { getSupabaseClient } from '../services/supabase.js';
import { navigate } from '../utils/router.js';

let currentUser = null;
let allCourses = [];

export async function render(container) {
  currentUser = await getSession();

  if (!currentUser || currentUser.role !== 'content_manager') {
    container.innerHTML = `
      <div class="text-center py-20">
        <i class="bi bi-shield-lock text-6xl text-gray-600"></i>
        <h2 class="text-2xl font-bold mt-4 text-white">ไม่มีสิทธิ์เข้าถึง</h2>
        <p class="text-gray-400 mt-2">เฉพาะผู้จัดการเนื้อหาเท่านั้น</p>
      </div>`;
    return;
  }

  container.innerHTML = `
    <div class="fade-up">
      <h2 class="text-3xl font-bold text-white mb-6">ตรวจสอบคอร์ส</h2>
      
      <!-- Tabs -->
      <div class="flex flex-wrap gap-2 mb-6" id="tabs-container">
        <button class="tab-btn btn-outline-brand text-sm py-1.5 px-4 active" data-filter="all">ทั้งหมด</button>
        <button class="tab-btn btn-outline-brand text-sm py-1.5 px-4" data-filter="pending">รอตรวจสอบ</button>
        <button class="tab-btn btn-outline-brand text-sm py-1.5 px-4" data-filter="revision">ขอแก้ไข</button>
        <button class="tab-btn btn-outline-brand text-sm py-1.5 px-4" data-filter="published">เผยแพร่แล้ว</button>
      </div>

      <div id="review-list" class="space-y-4"></div>
    </div>`;

  await loadReviewCourses();
  setupTabs();
}

async function loadReviewCourses() {
  const supabase = await getSupabaseClient();
  const list = document.getElementById('review-list');

  try {
    const { data: courses, error } = await supabase.rpc('get_review_courses');
    if (error) throw error;

    allCourses = courses || [];
    renderFilteredCourses('all'); // แสดงทั้งหมดเป็นค่าเริ่มต้น
  } catch (err) {
    list.innerHTML = '<p class="text-red-400 text-center py-10">เกิดข้อผิดพลาดในการโหลด</p>';
  }
}

function renderFilteredCourses(filter) {
  const list = document.getElementById('review-list');
  let filtered = allCourses;

  if (filter === 'pending') {
    filtered = allCourses.filter(c => c.status === 'pending');
  } else if (filter === 'revision') {
    filtered = allCourses.filter(c => c.status === 'revision');
  } else if (filter === 'published') {
    filtered = allCourses.filter(c => c.status === 'published' || c.status === 'approved');
  }

  if (!filtered.length) {
    list.innerHTML = '<p class="text-center text-gray-400 py-10">ไม่มีคอร์สในหมวดนี้</p>';
    return;
  }

  list.innerHTML = filtered.map(course => `
    <div class="bg-gray-900 border border-gray-800 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h3 class="text-white font-semibold text-lg">${escapeHTML(course.title)}</h3>
        <p class="text-gray-400 text-sm line-clamp-1">${escapeHTML(course.description || '')}</p>
        <span class="inline-block mt-1 badge badge-${course.status}">${statusText(course.status)}</span>
        ${course.reviewed_by ? `<p class="text-xs text-gray-500 mt-1">👤 ผู้ตรวจ: ${escapeHTML(course.reviewed_by)}</p>` : ''}
        ${course.review_comment ? `<p class="text-xs text-gray-500 mt-1">💬 ${escapeHTML(course.review_comment)}</p>` : ''}
      </div>
      <button class="review-btn btn-brand text-sm py-2 px-4" data-id="${course.id}">
        <i class="bi bi-eye"></i> ตรวจสอบ
      </button>
    </div>`).join('');

  document.querySelectorAll('.review-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      navigate(`/manager/review/${btn.dataset.id}`);
    });
  });
}

function setupTabs() {
  const tabs = document.querySelectorAll('.tab-btn');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      renderFilteredCourses(tab.dataset.filter);
    });
  });
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