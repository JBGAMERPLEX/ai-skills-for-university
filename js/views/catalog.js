// js/views/catalog.js
import { getSession } from '../services/auth.js';
import { getSupabaseClient } from '../services/supabase.js';
import { navigate } from '../utils/router.js';

let currentUser = null;
let currentSort = 'newest';
let currentSearch = '';

export async function render(container) {
  currentUser = await getSession();

  container.innerHTML = `
    <div class="fade-up">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <h2 class="text-3xl font-bold text-white">คอร์สทั้งหมด</h2>
        <div class="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <input type="search" id="search-input" placeholder="ค้นหาคอร์ส..." 
            class="w-full sm:w-64 bg-gray-900 border border-gray-800 rounded-full px-4 py-2 text-white focus:outline-none focus:border-brand transition"
            value="${currentSearch}" />
          <select id="sort-select" class="bg-gray-900 border border-gray-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-brand">
            <option value="newest">ใหม่สุด</option>
            <option value="oldest">เก่าสุด</option>
            <option value="title_asc">ชื่อ ก-ฮ / A-Z</option>
            <option value="title_desc">ชื่อ ฮ-ก / Z-A</option>
            <option value="rating_high">ดาวเยอะสุด</option>
            <option value="rating_low">ดาวน้อยสุด</option>
            <option value="students_high">ผู้เรียนเยอะสุด</option>
            <option value="students_low">ผู้เรียนน้อยสุด</option>
            <option value="duration_short">ใช้เวลาน้อยสุด</option>
            <option value="duration_long">ใช้เวลาเยอะสุด</option>
          </select>
        </div>
      </div>

      <div id="course-grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <div class="col-span-full flex justify-center py-10">
          <div class="animate-spin h-8 w-8 border-4 border-brand border-t-transparent rounded-full"></div>
        </div>
      </div>
    </div>`;

  // ตั้งค่า sort เริ่มต้น
  document.getElementById('sort-select').value = currentSort;

  // Event listeners
  document.getElementById('search-input').addEventListener('input', debounce((e) => {
    currentSearch = e.target.value.trim();
    loadCourses();
  }, 300));

  document.getElementById('sort-select').addEventListener('change', (e) => {
    currentSort = e.target.value;
    loadCourses();
  });

  await loadCourses();
}

async function loadCourses() {
  const supabase = await getSupabaseClient();
  const grid = document.getElementById('course-grid');
  if (!grid) return;

  const search = currentSearch;
  const sort = currentSort;

  grid.innerHTML = `<div class="col-span-full flex justify-center py-10"><div class="animate-spin h-8 w-8 border-4 border-brand border-t-transparent rounded-full"></div></div>`;

  // ใช้ RPC ที่รองรับ sort
  const { data: courses, error } = await supabase.rpc('get_courses_with_rating', {
    p_search: search || null,
    p_sort: sort
  });

  if (error) {
    console.error('Load courses error:', error);
    grid.innerHTML = `<div class="col-span-full text-center text-red-400 py-10">เกิดข้อผิดพลาดในการโหลดคอร์ส</div>`;
    return;
  }

  if (!courses?.length) {
    grid.innerHTML = `<div class="col-span-full text-center text-gray-400 py-10">ไม่พบคอร์สที่ค้นหา</div>`;
    return;
  }

  // Bookmark status
  let bookmarkedIds = new Set();
  if (currentUser) {
    const { data: bm } = await supabase
      .from('bookmarks')
      .select('course_id')
      .eq('user_id', currentUser.id);
    bm?.forEach(b => bookmarkedIds.add(b.course_id));
  }

  grid.innerHTML = courses.map(course => {
    const isBookmarked = bookmarkedIds.has(course.id);
    const thumb = course.thumbnail_url || 'https://ui-avatars.com/api/?name=Course&background=f9754a&color=fff&size=400';
    
    // สร้างดาว
    const rating = parseFloat(course.avg_rating || 0);
    const fullStars = Math.floor(rating);
    const halfStar = rating - fullStars >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

    const starsHTML = `
      ${'<i class="bi bi-star-fill text-yellow-400"></i>'.repeat(fullStars)}
      ${halfStar ? '<i class="bi bi-star-half text-yellow-400"></i>' : ''}
      ${'<i class="bi bi-star text-gray-600"></i>'.repeat(emptyStars)}
    `;

    return `
      <div class="card-hover">
        <div class="relative h-44">
          <img src="${escapeHTML(thumb)}" alt="${escapeHTML(course.title)}" class="w-full h-full object-cover" loading="lazy">
          ${currentUser ? `
            <button class="bookmark-btn absolute top-2 right-2 p-2 bg-black/50 rounded-full hover:bg-black/70 transition" data-course-id="${course.id}" data-bookmarked="${isBookmarked}">
              <i class="bi ${isBookmarked ? 'bi-heart-fill text-red-500' : 'bi-heart text-white'} text-lg"></i>
            </button>` : ''}
        </div>
        <div class="p-4">
          <h3 class="text-white font-semibold text-base line-clamp-2 mb-1">${escapeHTML(course.title)}</h3>
          
          <!-- ดาวและรีวิว -->
          <div class="flex items-center gap-2 mb-2">
            <div class="flex">${starsHTML}</div>
            <span class="text-xs text-gray-400">${rating.toFixed(1)} (${course.total_reviews || 0})</span>
          </div>

          <!-- สถิติ -->
          <div class="flex flex-wrap gap-2 mb-3 text-xs text-gray-400">
            <span><i class="bi bi-people"></i> ${course.student_count} ผู้เรียน</span>
            <span><i class="bi bi-list-check"></i> ${course.total_lessons} บทเรียน</span>
            <span><i class="bi bi-clock"></i> ${course.estimated_minutes} นาที</span>
          </div>

          <a href="#/course/${course.id}" class="btn-brand block text-center text-sm py-2">ดูรายละเอียด</a>
        </div>
      </div>`;
  }).join('');

  // Bookmark click handlers
  if (currentUser) {
    document.querySelectorAll('.bookmark-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const courseId = btn.dataset.courseId;
        const isBookmarked = btn.dataset.bookmarked === 'true';
        const supabase = await getSupabaseClient();
        try {
          if (isBookmarked) {
            await supabase.from('bookmarks').delete().eq('user_id', currentUser.id).eq('course_id', courseId);
            btn.dataset.bookmarked = 'false';
            btn.querySelector('i').className = 'bi bi-heart text-white text-lg';
          } else {
            await supabase.from('bookmarks').insert({ user_id: currentUser.id, course_id: courseId });
            btn.dataset.bookmarked = 'true';
            btn.querySelector('i').className = 'bi bi-heart-fill text-red-500 text-lg';
          }
        } catch (err) {
          console.error('Bookmark error:', err);
          showToast('เกิดข้อผิดพลาดในการจัดการบุ๊กมาร์ก', 'error');
        }
      });
    });
  }
}

function escapeHTML(str) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

function debounce(fn, delay = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `fixed bottom-4 right-4 z-50 px-4 py-2 rounded-lg text-sm text-white ${type === 'success' ? 'bg-green-600' : 'bg-red-600'} shadow-lg`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}