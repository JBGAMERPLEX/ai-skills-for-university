// js/views/home.js
import { getSession } from '../services/auth.js';
import { getSupabaseClient } from '../services/supabase.js';

export async function render(container) {
  const user = await getSession();

  container.innerHTML = `
    <div class="fade-up">
      <!-- Hero Section -->
      <div class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900 to-gray-950 border border-gray-800">
        <div class="absolute inset-0 opacity-10 pointer-events-none">
          <div class="absolute top-1/4 left-1/4 w-96 h-96 bg-brand rounded-full blur-3xl"></div>
          <div class="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500 rounded-full blur-3xl"></div>
        </div>
        <div class="relative z-10 text-center py-16 md:py-24 px-4 max-w-3xl mx-auto">
          <h1 class="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4">
            ยกระดับทักษะ <span class="text-brand">AI</span><br class="hidden sm:block">เพื่อมหาวิทยาลัยแห่งอนาคต
          </h1>
          <p class="text-lg text-gray-400 mb-8 max-w-xl mx-auto">
            เรียนรู้คอร์สคุณภาพจากผู้เชี่ยวชาญ เข้าถึงได้ทุกที่ทุกเวลา พร้อมระบบติดตามความก้าวหน้า
          </p>
          <div class="flex flex-wrap gap-4 justify-center">
            <a href="#/courses" class="btn-outline-brand text-lg px-8 py-3 gap-2 inline-flex items-center">
              <i class="bi bi-collection-play"></i> ดูคอร์สทั้งหมด
            </a>
          </div>
        </div>
      </div>

      <!-- คอร์สยอดนิยม -->
      <div class="mt-12">
        <h2 class="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          <i class="bi bi-fire text-brand"></i> คอร์สยอดนิยม
        </h2>
        <div id="popular-courses" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="col-span-full flex justify-center py-6">
            <div class="animate-spin h-8 w-8 border-4 border-brand border-t-transparent rounded-full"></div>
          </div>
        </div>
      </div>

      <!-- คอร์สมาใหม่ -->
      <div class="mt-10">
        <h2 class="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          <i class="bi bi-clock-history text-blue-400"></i> คอร์สมาใหม่
        </h2>
        <div id="new-courses" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="col-span-full flex justify-center py-6">
            <div class="animate-spin h-8 w-8 border-4 border-brand border-t-transparent rounded-full"></div>
          </div>
        </div>
      </div>
    </div>`;

  await loadPopularCourses();
  await loadNewCourses();
}

async function loadPopularCourses() {
  const supabase = await getSupabaseClient();
  const container = document.getElementById('popular-courses');
  if (!container) return;

  try {
    // ใช้ RPC get_courses_with_stats (ตอนนี้ student_count = จำนวนผู้สมัครเรียน)
    const { data, error } = await supabase.rpc('get_courses_with_stats', { p_search: null });
    if (error) throw error;

    // เรียงตามจำนวนผู้เรียน (ผู้สมัคร) จากมากไปน้อย
    const sorted = data
      ?.filter(c => c.status === 'published')
      .sort((a, b) => b.student_count - a.student_count)
      .slice(0, 4);

    if (!sorted?.length) {
      container.innerHTML = '<p class="text-gray-500 text-center col-span-full">ยังไม่มีคอร์สยอดนิยม</p>';
      return;
    }

    container.innerHTML = sorted.map(course => courseCard(course)).join('');
  } catch (err) {
    console.error(err);
    container.innerHTML = '<p class="text-red-400 text-center col-span-full">โหลดไม่สำเร็จ</p>';
  }
}

async function loadNewCourses() {
  const supabase = await getSupabaseClient();
  const container = document.getElementById('new-courses');
  if (!container) return;

  try {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(4);

    if (error) throw error;

    if (!data?.length) {
      container.innerHTML = '<p class="text-gray-500 text-center col-span-full">ยังไม่มีคอร์สใหม่</p>';
      return;
    }

    container.innerHTML = data.map(course => courseCard(course)).join('');
  } catch (err) {
    console.error(err);
    container.innerHTML = '<p class="text-red-400 text-center col-span-full">โหลดไม่สำเร็จ</p>';
  }
}

function courseCard(course) {
  const thumb = course.thumbnail_url || 'https://ui-avatars.com/api/?name=Course&background=f9754a&color=fff&size=400';
  return `
    <div class="card-hover">
      <img src="${escapeHTML(thumb)}" alt="${escapeHTML(course.title)}" class="h-40 w-full object-cover" loading="lazy">
      <div class="p-3">
        <h3 class="text-white font-semibold text-sm line-clamp-2 mb-1">${escapeHTML(course.title)}</h3>
        <p class="text-gray-400 text-xs line-clamp-2 mb-2">${escapeHTML(course.description || '')}</p>
        <a href="#/course/${course.id}" class="btn-brand text-xs py-1 px-3 block text-center">ดูคอร์ส</a>
      </div>
    </div>`;
}

function escapeHTML(str) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}