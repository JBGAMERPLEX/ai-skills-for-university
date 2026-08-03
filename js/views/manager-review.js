// js/views/manager-review.js
import { getSession } from '../services/auth.js';
import { getSupabaseClient } from '../services/supabase.js';
import { navigate } from '../utils/router.js';
import { convertVideoUrl } from '../utils/video-url.js';

let currentUser = null;
let courseId = null;

export async function render(container, params) {
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

  courseId = params.id;
  const supabase = await getSupabaseClient();

  const { data: courseData, error: courseErr } = await supabase
    .rpc('get_course_by_id', { p_course_id: courseId });

  if (courseErr || !courseData || courseData.length === 0) {
    container.innerHTML = '<p class="text-center text-red-400 py-20">ไม่พบคอร์สนี้</p>';
    return;
  }
  const course = courseData[0];

  const { data: sections } = await supabase.rpc('get_course_sections', { p_course_id: courseId });

  container.innerHTML = `
    <div class="fade-up max-w-4xl mx-auto">
      <div class="flex items-center gap-4 mb-6">
        <button id="back-btn" class="p-2 text-gray-400 hover:text-white transition" title="กลับ">
          <i class="bi bi-arrow-left text-2xl"></i>
        </button>
        <h2 class="text-3xl font-bold text-white">ตรวจสอบคอร์ส</h2>
      </div>

      <div class="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
        <h3 class="text-2xl font-bold text-white mb-2">${escapeHTML(course.title)}</h3>
        <p class="text-gray-400 mb-4">${escapeHTML(course.description || '')}</p>
        ${course.thumbnail_url ? `<img src="${escapeHTML(course.thumbnail_url)}" class="max-h-64 rounded-lg object-cover mb-4" />` : ''}
        <div class="mb-4">
          <span class="badge badge-${course.status}">${statusText(course.status)}</span>
        </div>

        <h4 class="text-xl font-semibold text-white mb-3 mt-6">เนื้อหาคอร์ส</h4>
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
                      <div class="lesson-toggle flex justify-between items-center p-3 bg-gray-900 hover:bg-gray-800 transition"
                           data-lesson-id="${lesson.id}">
                        <div class="flex items-center gap-3">
                          <i class="bi bi-play-circle text-gray-500 text-xl"></i>
                          <span class="text-white">${escapeHTML(lesson.title)}</span>
                        </div>
                        <i class="bi bi-chevron-down text-gray-400 transition-transform duration-200" id="icon-${lesson.id}"></i>
                      </div>
                      <div id="content-${lesson.id}" class="lesson-content bg-gray-950 px-4">
                        <div class="py-3 space-y-3">
                          ${lesson.video_url ? `
                            <div class="aspect-video rounded-lg overflow-hidden">
                              <iframe src="${escapeHTML(convertVideoUrl(lesson.video_url))}" class="w-full h-full" frameborder="0" allowfullscreen></iframe>
                            </div>` : ''}
                          ${lesson.image_url ? `<img src="${escapeHTML(lesson.image_url)}" class="max-h-96 w-full object-cover rounded-lg" />` : ''}
                          ${lesson.rich_text ? `<div class="prose-lesson">${lesson.rich_text}</div>` : ''}
                          ${lesson.external_resources ? `
                            <div class="mt-2 pt-2 border-t border-gray-800">
                              <h4 class="font-semibold text-white mb-1">แหล่งข้อมูลเพิ่มเติม</h4>
                              <a href="${escapeHTML(lesson.external_resources)}" target="_blank" class="text-brand hover:underline break-all">${escapeHTML(lesson.external_resources)}</a>
                            </div>` : ''}
                        </div>
                      </div>
                    </div>
                  `).join('')}
                </div>
              </details>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <div class="mb-4">
          <label class="block text-sm text-gray-400 mb-1">ความคิดเห็น</label>
          <textarea id="review-comment" rows="3" class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-brand">${escapeHTML(course.review_comment || '')}</textarea>
        </div>
        <div class="flex flex-wrap gap-2 justify-end">
          <button id="btn-revise" class="btn-outline-brand text-sm py-2 px-4 border-yellow-500 text-yellow-500 hover:bg-yellow-500/10">
            <i class="bi bi-arrow-repeat"></i> ขอแก้ไข
          </button>
          <button id="btn-approve" class="btn-brand text-sm py-2 px-4">
            <i class="bi bi-check-circle"></i> อนุมัติและเผยแพร่
          </button>
        </div>
      </div>
    </div>`;

  document.getElementById('back-btn').addEventListener('click', () => navigate('/manager'));

  async function doReview(status) {
    const comment = document.getElementById('review-comment').value.trim();
    const supabase = await getSupabaseClient();
    await supabase.rpc('review_course', {
      p_course_id: courseId,
      p_status: status,
      p_comment: comment || null
    });
    navigate('/manager');
  }

  document.getElementById('btn-approve').onclick = () => doReview('published');
  document.getElementById('btn-revise').onclick = () => doReview('revision');

  document.querySelectorAll('.lesson-toggle').forEach(toggle => {
    toggle.addEventListener('click', () => {
      const lessonId = toggle.dataset.lessonId;
      const content = document.getElementById(`content-${lessonId}`);
      const icon = document.getElementById(`icon-${lessonId}`);
      content.classList.toggle('open');
      icon.classList.toggle('rotate-180');
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