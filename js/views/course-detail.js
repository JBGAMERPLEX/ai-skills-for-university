// js/views/course-detail.js
import { getSession } from '../services/auth.js';
import { getSupabaseClient } from '../services/supabase.js';
import { convertVideoUrl } from '../utils/video-url.js';
import { navigate } from '../utils/router.js';

let currentUser = null;
let courseId = null;
let allLessons = [];
let currentIndex = 0;

export async function render(container, params) {
  currentUser = await getSession();
  if (!currentUser) {
    navigate('/login');
    return;
  }

  courseId = params.id;
  container.innerHTML = `<div class="flex justify-center py-10"><div class="animate-spin h-8 w-8 border-4 border-brand border-t-transparent rounded-full"></div></div>`;
  await loadCourse(container);
}

async function loadCourse(container) {
  const supabase = await getSupabaseClient();

  const { data: course } = await supabase.from('courses').select('*').eq('id', courseId).single();
  if (!course) {
    container.innerHTML = '<div class="text-center py-20 text-red-400">ไม่พบคอร์สนี้</div>';
    return;
  }

  const { data: sections } = await supabase.rpc('get_course_sections', { p_course_id: courseId });

  allLessons = [];
  if (sections && sections.length) {
    sections.forEach(section => {
      (section.lessons || []).forEach(lesson => {
        allLessons.push({
          ...lesson,
          section_title: section.section_title
        });
      });
    });
  }

  currentIndex = 0;

  let completedLessons = new Set();
  if (currentUser) {
    const { data: prog } = await supabase
      .from('progress')
      .select('lesson_id')
      .eq('user_id', currentUser.id)
      .eq('completed', true);
    prog?.forEach(p => completedLessons.add(p.lesson_id));
  }

  container.innerHTML = `
    <div class="fade-up max-w-7xl mx-auto">
      <nav class="flex items-center space-x-2 text-sm text-gray-400 mb-4">
        <a href="#/courses" class="hover:text-white transition">คอร์สทั้งหมด</a>
        <i class="bi bi-chevron-right text-xs"></i>
        <span class="text-white">${escapeHTML(course.title)}</span>
      </nav>

      <h1 class="text-2xl md:text-3xl font-bold text-white mb-6">${escapeHTML(course.title)}</h1>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <aside class="lg:col-span-1">
          <div class="bg-gray-900 border border-gray-800 rounded-xl p-4 sticky top-20 max-h-[80vh] overflow-y-auto">
            <h2 class="text-lg font-bold text-white mb-4">เนื้อหาคอร์ส</h2>
            <div class="space-y-4">
              ${sections?.map(section => `
                <div>
                  <h3 class="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-2">${escapeHTML(section.section_title)}</h3>
                  <div class="space-y-1">
                    ${(section.lessons || []).map(lesson => {
                      const realIndex = allLessons.findIndex(l => l.id === lesson.id);
                      const isCompleted = completedLessons.has(lesson.id);
                      return `
                        <button class="lesson-nav-btn w-full text-left px-3 py-2 rounded-lg transition ${realIndex === currentIndex ? 'bg-brand/20 border-brand border' : 'hover:bg-gray-800 border border-transparent'}"
                                data-index="${realIndex}">
                          <div class="flex items-center gap-2">
                            <i class="bi ${isCompleted ? 'bi-check-circle-fill text-green-400' : 'bi-play-circle text-gray-500'} text-lg"></i>
                            <span class="text-sm ${realIndex === currentIndex ? 'text-white font-medium' : 'text-gray-300'}">${escapeHTML(lesson.title)}</span>
                          </div>
                        </button>`;
                    }).join('')}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </aside>

        <div class="lg:col-span-2">
          <div id="lesson-display" class="bg-gray-900 border border-gray-800 rounded-xl p-6 min-h-[400px]">
            ${renderLessonContent(currentIndex, completedLessons)}
          </div>
        </div>
      </div>
    </div>`;

  // ฟังก์ชันรีเฟรช active state
  function refreshActiveState() {
    document.querySelectorAll('.lesson-nav-btn').forEach(btn => {
      const idx = parseInt(btn.dataset.index);
      if (idx === currentIndex) {
        btn.classList.add('bg-brand/20', 'border-brand', 'border');
        btn.classList.remove('hover:bg-gray-800', 'border-transparent');
        const span = btn.querySelector('span');
        if (span) span.classList.add('text-white', 'font-medium');
      } else {
        btn.classList.remove('bg-brand/20', 'border-brand', 'border');
        btn.classList.add('hover:bg-gray-800', 'border-transparent');
        const span = btn.querySelector('span');
        if (span) span.classList.remove('text-white', 'font-medium');
      }
    });
  }

  // Sidebar click
  document.querySelectorAll('.lesson-nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      currentIndex = parseInt(btn.dataset.index);
      document.getElementById('lesson-display').innerHTML = renderLessonContent(currentIndex, completedLessons);
      refreshActiveState();
    });
  });

  // Global event delegation สำหรับปุ่ม prev/next/mark-complete
  document.addEventListener('click', async (e) => {
    if (e.target.closest('.prev-lesson-btn')) {
      if (currentIndex > 0) {
        currentIndex--;
        document.getElementById('lesson-display').innerHTML = renderLessonContent(currentIndex, completedLessons);
        refreshActiveState();
      }
    }
    if (e.target.closest('.next-lesson-btn')) {
      if (currentIndex < allLessons.length - 1) {
        currentIndex++;
        document.getElementById('lesson-display').innerHTML = renderLessonContent(currentIndex, completedLessons);
        refreshActiveState();
      }
    }
    if (e.target.closest('.mark-complete-btn')) {
      const lessonId = allLessons[currentIndex].id;
      const supabase = await getSupabaseClient();
      await supabase.rpc('mark_lesson_complete', { p_user_id: currentUser.id, p_lesson_id: lessonId });
      completedLessons.add(lessonId);

      const allDone = allLessons.every(l => completedLessons.has(l.id));
      if (allDone) {
        navigate(`/complete/${courseId}`);
      } else {
        document.getElementById('lesson-display').innerHTML = renderLessonContent(currentIndex, completedLessons);
        refreshActiveState();
      }
    }
  });
}

function renderLessonContent(index, completedLessons) {
  if (!allLessons.length) return '<p class="text-gray-400">ยังไม่มีบทเรียนในคอร์สนี้</p>';
  if (index < 0 || index >= allLessons.length) return '<p class="text-gray-400">ไม่มีบทเรียน</p>';

  const lesson = allLessons[index];
  const isCompleted = completedLessons.has(lesson.id);

  return `
    <div>
      <p class="text-sm text-gray-400 mb-2">${escapeHTML(lesson.section_title)}</p>
      <h2 class="text-xl md:text-2xl font-bold text-white mb-4">${escapeHTML(lesson.title)}</h2>

      <div class="space-y-4">
        ${lesson.video_url ? `
          <div class="aspect-video rounded-lg overflow-hidden">
            <iframe src="${escapeHTML(convertVideoUrl(lesson.video_url))}" class="w-full h-full" frameborder="0" allowfullscreen></iframe>
          </div>` : ''}
        ${lesson.image_url ? `<img src="${escapeHTML(lesson.image_url)}" class="max-h-96 w-full object-cover rounded-lg" />` : ''}
        ${lesson.rich_text ? `
          <div class="prose-lesson">
            ${lesson.rich_text.split('<!--SEP-->').map(txt => `<div class="mb-4">${txt}</div>`).join('')}
          </div>` : ''}
        ${lesson.external_resources ? `
          <div class="pt-3 border-t border-gray-800">
            <h4 class="font-semibold text-white mb-2">แหล่งข้อมูลเพิ่มเติม</h4>
            ${lesson.external_resources.split(',').filter(r => r.trim()).map(res => `
              <a href="${escapeHTML(res.trim())}" target="_blank" class="text-brand hover:underline break-all block mb-1">${escapeHTML(res.trim())}</a>
            `).join('')}
          </div>` : ''}
      </div>

      <div class="flex flex-wrap gap-3 mt-8 pt-4 border-t border-gray-800">
        ${index > 0 ? `<button class="prev-lesson-btn btn-outline-brand text-sm py-2 px-4"><i class="bi bi-arrow-left"></i> ก่อนหน้า</button>` : ''}
        ${index < allLessons.length - 1 ? `<button class="next-lesson-btn btn-brand text-sm py-2 px-4">ถัดไป <i class="bi bi-arrow-right"></i></button>` : ''}
        ${!isCompleted ? `<button class="mark-complete-btn btn-outline-brand !border-green-500 !text-green-500 hover:!bg-green-500/10 text-sm py-2 px-4 ml-auto"><i class="bi bi-check-lg"></i> เรียนจบแล้ว</button>` : `<span class="text-green-400 text-sm ml-auto"><i class="bi bi-check-circle-fill"></i> เรียนจบแล้ว</span>`}
      </div>
    </div>`;
}

function escapeHTML(str) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}