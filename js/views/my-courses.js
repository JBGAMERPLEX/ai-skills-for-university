import { getSession } from '../services/auth.js';
import { getSupabaseClient } from '../services/supabase.js';

let currentUser = null;

export async function render(container) {
  currentUser = await getSession();

  if (!currentUser) {
    container.innerHTML = '<div class="text-center py-20 text-gray-400">กรุณาเข้าสู่ระบบก่อน</div>';
    return;
  }

  container.innerHTML = `
    <div class="fade-up max-w-5xl mx-auto">
      <h2 class="text-3xl font-bold text-white mb-8">คอร์สของฉัน</h2>

      <!-- สถิติ Dashboard -->
      <div id="stats-container" class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
        <div class="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
          <i class="bi bi-book text-blue-400 text-2xl"></i>
          <p id="stat-enrolled" class="text-2xl font-bold text-white mt-2">-</p>
          <p class="text-xs text-gray-400 mt-1">สมัครเรียน</p>
        </div>
        <div class="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
          <i class="bi bi-arrow-repeat text-yellow-400 text-2xl"></i>
          <p id="stat-inprogress" class="text-2xl font-bold text-white mt-2">-</p>
          <p class="text-xs text-gray-400 mt-1">กำลังเรียน</p>
        </div>
        <div class="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
          <i class="bi bi-check-circle text-green-400 text-2xl"></i>
          <p id="stat-completed" class="text-2xl font-bold text-white mt-2">-</p>
          <p class="text-xs text-gray-400 mt-1">เรียนจบ</p>
        </div>
        <div class="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
          <i class="bi bi-clock text-brand text-2xl"></i>
          <p id="stat-time" class="text-2xl font-bold text-white mt-2">-</p>
          <p class="text-xs text-gray-400 mt-1">ชั่วโมงเรียน</p>
        </div>
      </div>

      <!-- กำลังเรียน -->
      <div class="mb-10">
        <h3 class="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <i class="bi bi-arrow-repeat text-green-400"></i> กำลังเรียน
        </h3>
        <div id="progress-list" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div class="col-span-full text-center py-6"><span class="loading loading-spinner loading-lg"></span></div>
        </div>
      </div>

      <!-- เรียนจบแล้ว -->
      <div class="mb-10">
        <h3 class="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <i class="bi bi-check-circle text-blue-400"></i> เรียนจบแล้ว
        </h3>
        <div id="completed-list" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div class="col-span-full text-center py-6"><span class="loading loading-spinner loading-lg"></span></div>
        </div>
      </div>

      <!-- บุ๊กมาร์ก -->
      <div>
        <h3 class="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <i class="bi bi-bookmark-heart text-red-400"></i> บุ๊กมาร์ก
        </h3>
        <div id="bookmark-list" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div class="col-span-full text-center py-6"><span class="loading loading-spinner loading-lg"></span></div>
        </div>
      </div>
    </div>`;

  await Promise.all([loadStats(), loadInProgress(), loadCompleted(), loadBookmarks()]);
}

async function loadStats() {
  const supabase = await getSupabaseClient();
  try {
    const { data, error } = await supabase.rpc('get_learner_stats', {
      p_user_id: currentUser.id
    });

    if (error) throw error;
    if (!data || data.length === 0) return;

    const stats = data[0];
    document.getElementById('stat-enrolled').textContent = stats.enrolled_courses || 0;
    document.getElementById('stat-inprogress').textContent = stats.in_progress_courses || 0;
    document.getElementById('stat-completed').textContent = stats.completed_courses || 0;
    
    const totalMinutes = stats.total_minutes || 0;
    const hours = Math.floor(totalMinutes / 60);
    document.getElementById('stat-time').textContent = hours;
  } catch (err) {
    console.error('Load stats error:', err);
  }
}

async function loadInProgress() {
  const supabase = await getSupabaseClient();
  const list = document.getElementById('progress-list');
  try {
    const { data: progressData } = await supabase.rpc('get_user_progress', { p_user_id: currentUser.id });
    const inProgress = progressData?.filter(c => c.total_lessons > 0 && c.completed_lessons < c.total_lessons) || [];

    if (!inProgress.length) {
      list.innerHTML = '<p class="text-gray-500 text-center py-6 col-span-full">ยังไม่มีคอร์สที่กำลังเรียน</p>';
      return;
    }

    const courseIds = inProgress.map(c => c.course_id);
    const { data: courses } = await supabase
      .from('courses')
      .select('id, title, thumbnail_url')
      .in('id', courseIds);

    const courseMap = (courses || []).reduce((acc, c) => { acc[c.id] = c; return acc; }, {});

    list.innerHTML = inProgress.map(progress => {
      const course = courseMap[progress.course_id];
      if (!course) return '';
      const thumb = course.thumbnail_url || 'https://ui-avatars.com/api/?name=Course&background=f9754a&color=fff&size=400';
      return `
        <div class="card-hover">
          <img src="${escapeHTML(thumb)}" alt="${escapeHTML(course.title)}" class="h-40 w-full object-cover" loading="lazy">
          <div class="p-4">
            <h4 class="text-white font-semibold text-base line-clamp-2 mb-2">${escapeHTML(course.title)}</h4>
            <progress class="progress progress-primary w-full h-1.5 mb-2" value="${progress.completed_lessons}" max="${progress.total_lessons}"></progress>
            <div class="flex justify-between items-center">
              <span class="text-xs text-gray-400">${progress.completed_lessons}/${progress.total_lessons} บทเรียน</span>
              <a href="#/learn/${course.id}" class="btn-brand text-xs py-1 px-3">เรียนต่อ</a>
            </div>
          </div>
        </div>`;
    }).join('');

  } catch (err) {
    console.error(err);
    list.innerHTML = '<p class="text-red-400 text-center py-6 col-span-full">เกิดข้อผิดพลาด</p>';
  }
}

async function loadCompleted() {
  const supabase = await getSupabaseClient();
  const list = document.getElementById('completed-list');
  try {
    const { data: progressData } = await supabase.rpc('get_user_progress', { p_user_id: currentUser.id });
    const completed = progressData?.filter(c => c.total_lessons > 0 && c.completed_lessons >= c.total_lessons) || [];

    if (!completed.length) {
      list.innerHTML = '<p class="text-gray-500 text-center py-6 col-span-full">ยังไม่มีคอร์สที่เรียนจบ</p>';
      return;
    }

    const courseIds = completed.map(c => c.course_id);
    const { data: courses } = await supabase
      .from('courses')
      .select('id, title, thumbnail_url')
      .in('id', courseIds);

    const courseMap = (courses || []).reduce((acc, c) => { acc[c.id] = c; return acc; }, {});

    list.innerHTML = completed.map(progress => {
      const course = courseMap[progress.course_id];
      if (!course) return '';
      const thumb = course.thumbnail_url || 'https://ui-avatars.com/api/?name=Course&background=f9754a&color=fff&size=400';
      return `
        <div class="card-hover">
          <img src="${escapeHTML(thumb)}" alt="${escapeHTML(course.title)}" class="h-40 w-full object-cover" loading="lazy">
          <div class="p-4">
            <h4 class="text-white font-semibold text-base line-clamp-2 mb-2">${escapeHTML(course.title)}</h4>
            <div class="flex items-center gap-2 text-green-400 text-sm mb-2">
              <i class="bi bi-check-circle-fill"></i>
              <span>เรียนจบแล้ว</span>
            </div>
            <div class="flex gap-2">
              <a href="#/learn/${course.id}" class="btn-brand text-xs py-1 px-3">ดูอีกครั้ง</a>
              <a href="#/quiz/${course.id}" class="btn-outline-brand !border-blue-500 !text-blue-500 hover:!bg-blue-500/10 text-xs py-1 px-3">ทำ Quiz</a>
              <a href="#/certificate/${course.id}" class="btn-outline-brand !border-yellow-500 !text-yellow-500 hover:!bg-yellow-500/10 text-xs py-1 px-3">ใบประกาศ</a>
            </div>
          </div>
        </div>`;
    }).join('');

  } catch (err) {
    console.error(err);
    list.innerHTML = '<p class="text-red-400 text-center py-6 col-span-full">เกิดข้อผิดพลาด</p>';
  }
}

async function loadBookmarks() {
  const supabase = await getSupabaseClient();
  const list = document.getElementById('bookmark-list');
  try {
    const { data: bookmarks } = await supabase
      .from('bookmarks')
      .select('course_id')
      .eq('user_id', currentUser.id);

    if (!bookmarks?.length) {
      list.innerHTML = '<p class="text-gray-500 text-center py-6 col-span-full">ไม่มีคอร์สที่บุ๊กมาร์กไว้</p>';
      return;
    }

    const courseIds = bookmarks.map(b => b.course_id);
    const { data: courses } = await supabase
      .from('courses')
      .select('id, title, thumbnail_url, description')
      .in('id', courseIds);

    list.innerHTML = courses.map(course => `
      <div class="card-hover">
        <img src="${escapeHTML(course.thumbnail_url || 'https://ui-avatars.com/api/?name=Course&background=f9754a&color=fff&size=400')}" alt="${escapeHTML(course.title)}" class="h-40 w-full object-cover" loading="lazy">
        <div class="p-4">
          <h4 class="text-white font-semibold text-base line-clamp-2 mb-1">${escapeHTML(course.title)}</h4>
          <p class="text-gray-400 text-xs line-clamp-2 mb-3">${escapeHTML(course.description || '')}</p>
          <a href="#/course/${course.id}" class="btn-brand text-xs py-1 px-3">ดูคอร์ส</a>
        </div>
      </div>`).join('');

  } catch (err) {
    console.error(err);
    list.innerHTML = '<p class="text-red-400 text-center py-6 col-span-full">เกิดข้อผิดพลาด</p>';
  }
}

function escapeHTML(str) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}