import { getSession } from '../services/auth.js';
import { getSupabaseClient } from '../services/supabase.js';

let currentUser = null;

export async function render(container) {
  currentUser = await getSession();

  container.innerHTML = `
    <div class="fade-up">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <h2 class="text-3xl font-bold text-white">คอร์สทั้งหมด</h2>
        <input type="search" id="search-input" placeholder="ค้นหาคอร์ส..." class="w-full sm:w-72 bg-gray-900 border border-gray-800 rounded-full px-4 py-2 text-white focus:outline-none focus:border-brand transition">
      </div>
      <div id="course-grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <div class="col-span-full flex justify-center py-10">
          <div class="animate-spin h-8 w-8 border-4 border-brand border-t-transparent rounded-full"></div>
        </div>
      </div>
    </div>`;

  await loadCourses();
  document.getElementById('search-input').addEventListener('input', debounce(() => loadCourses(), 300));
}

async function loadCourses() {
  const supabase = await getSupabaseClient();
  const grid = document.getElementById('course-grid');
  if (!grid) return;

  const search = document.getElementById('search-input')?.value.trim() || '';
  grid.innerHTML = `<div class="col-span-full flex justify-center py-10"><div class="animate-spin h-8 w-8 border-4 border-brand border-t-transparent rounded-full"></div></div>`;

  // ใช้ฟังก์ชันใหม่ที่รวม instructor_name และ student_count
  const { data: courses, error } = await supabase.rpc('get_courses_with_stats', {
    p_search: search || null
  });

  if (error) {
    grid.innerHTML = `<div class="col-span-full text-center text-red-400 py-10">เกิดข้อผิดพลาดในการโหลดคอร์ส</div>`;
    console.error(error);
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
          <div class="flex items-center gap-3 text-xs text-gray-400 mb-2">
            ${course.instructor_name ? `
              <span class="flex items-center gap-1">
                <i class="bi bi-person"></i> ${escapeHTML(course.instructor_name)}
              </span>` : ''}
            <span class="flex items-center gap-1">
              <i class="bi bi-people"></i> ${course.student_count} ผู้เรียน
            </span>
          </div>
          <p class="text-gray-400 text-sm line-clamp-2 mb-3">${escapeHTML(course.description || '')}</p>
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
          console.error(err);
          alert('เกิดข้อผิดพลาดในการจัดการบุ๊กมาร์ก');
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