import { getSession } from '../services/auth.js';
import { getSupabaseClient } from '../services/supabase.js';

let currentUser = null;
let courseId = null;

export async function render(container, params) {
  currentUser = await getSession();
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
    <div class="max-w-4xl mx-auto fade-up">
      <nav class="flex items-center space-x-2 text-sm text-gray-400 mb-4">
        <a href="#/courses" class="hover:text-white transition">คอร์สทั้งหมด</a>
        <i class="bi bi-chevron-right text-xs"></i>
        <span class="text-white">${escapeHTML(course.title)}</span>
      </nav>

      <h1 class="text-3xl font-bold text-white mb-2">${escapeHTML(course.title)}</h1>
      <p class="text-gray-400 mb-8">${escapeHTML(course.description || '')}</p>

      <div class="space-y-4">
        ${sections?.map(section => `
          <div class="border border-gray-800 rounded-xl overflow-hidden">
            <details class="group" open>
              <summary class="flex justify-between items-center cursor-pointer p-4 bg-gray-900 hover:bg-gray-800 transition">
                <span class="font-semibold text-white text-lg">${escapeHTML(section.section_title)}</span>
                <i class="bi bi-chevron-down transition-transform group-open:rotate-180 text-gray-400"></i>
              </summary>
              <div class="p-4 bg-gray-950 space-y-3">
                ${(section.lessons || []).map(lesson => `
                  <div class="border border-gray-800 rounded-lg overflow-hidden">
                    <!-- Lesson Header (คลิกเพื่อขยาย) -->
                    <div class="lesson-toggle flex justify-between items-center p-3 bg-gray-900 hover:bg-gray-800 transition"
                         data-lesson-id="${lesson.id}">
                      <div class="flex items-center gap-3">
                        <i class="bi ${completedLessons.has(lesson.id) ? 'bi-check-circle-fill text-green-400' : 'bi-play-circle text-gray-500'} text-xl"></i>
                        <span class="text-white">${escapeHTML(lesson.title)}</span>
                      </div>
                      <i class="bi bi-chevron-down text-gray-400 transition-transform duration-200" id="icon-${lesson.id}"></i>
                    </div>
                    <!-- Lesson Content (ซ่อน/แสดง) -->
                    <div id="content-${lesson.id}" class="lesson-content bg-gray-950 px-4">
                      <div class="py-3 space-y-3">
                        ${lesson.video_url ? `
                          <div class="aspect-video rounded-lg overflow-hidden">
                            <iframe src="${escapeHTML(lesson.video_url)}" class="w-full h-full" frameborder="0" allowfullscreen></iframe>
                          </div>` : ''}
                        ${lesson.image_url ? `<img src="${escapeHTML(lesson.image_url)}" class="max-h-96 w-full object-cover rounded-lg" />` : ''}
                        ${lesson.rich_text ? `<div class="prose-lesson">${lesson.rich_text}</div>` : ''}
                        ${lesson.external_resources ? `
                          <div class="mt-2 pt-2 border-t border-gray-800">
                            <h4 class="font-semibold text-white mb-1">แหล่งข้อมูลเพิ่มเติม</h4>
                            <a href="${escapeHTML(lesson.external_resources)}" target="_blank" class="text-brand hover:underline break-all">${escapeHTML(lesson.external_resources)}</a>
                          </div>` : ''}

                        <!-- ปุ่มเรียนจบแล้ว (แสดงเมื่อเปิดเนื้อหาเท่านั้น) -->
                        ${currentUser && !completedLessons.has(lesson.id) ? `
                          <div class="pt-2 border-t border-gray-800">
                            <button class="mark-complete-btn btn-outline-brand !border-green-500 !text-green-500 hover:!bg-green-500/10 text-sm py-1 px-3 inline-flex items-center gap-1"
                                    data-lesson-id="${lesson.id}">
                              <i class="bi bi-check-lg"></i> เรียนจบแล้ว
                            </button>
                          </div>
                        ` : ''}
                      </div>
                    </div>
                  </div>
                `).join('')}
              </div>
            </details>
          </div>
        `).join('')}
      </div>
    </div>`;

  // Toggle lesson content
  document.querySelectorAll('.lesson-toggle').forEach(toggle => {
    toggle.addEventListener('click', (e) => {
      if (e.target.closest('.mark-complete-btn')) return; // ป้องกันการ toggle เมื่อกดปุ่ม
      const lessonId = toggle.dataset.lessonId;
      const content = document.getElementById(`content-${lessonId}`);
      const icon = document.getElementById(`icon-${lessonId}`);
      content.classList.toggle('open');
      icon.classList.toggle('rotate-180');
    });
  });

  // Mark complete buttons
  document.querySelectorAll('.mark-complete-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const lessonId = btn.dataset.lessonId;
      const supabase = await getSupabaseClient();
      await supabase.rpc('mark_lesson_complete', { p_user_id: currentUser.id, p_lesson_id: lessonId });
      // รีเฟรชหน้าเพื่อแสดงสถานะใหม่
      await loadCourse(container);
    });
  });
}

function escapeHTML(str) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}