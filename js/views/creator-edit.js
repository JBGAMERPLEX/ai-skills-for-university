import { getSession } from '../services/auth.js';
import { getSupabaseClient } from '../services/supabase.js';
import { navigate } from '../utils/router.js';

let currentUser = null;
let courseId = null;

export async function render(container, params) {
  currentUser = await getSession();
  if (!currentUser || currentUser.role !== 'content_creator') {
    container.innerHTML = `<div class="text-center py-20">ไม่มีสิทธิ์เข้าถึง</div>`;
    return;
  }

  courseId = params.id;
  const supabase = await getSupabaseClient();

  const { data: courseData, error: courseErr } = await supabase.rpc('get_course_for_edit', {
    p_user_id: currentUser.id,
    p_course_id: courseId
  });
  if (courseErr || !courseData?.length) {
    container.innerHTML = '<p class="text-red-400">ไม่พบคอร์ส</p>';
    return;
  }
  const course = courseData[0];
  const { data: sections } = await supabase.rpc('get_course_sections', { p_course_id: courseId });

  renderEditor(container, course, sections || []);
}

async function resetToDraftIfRevision() {
  const supabase = await getSupabaseClient();
  const { data } = await supabase.rpc('get_course_for_edit', {
    p_user_id: currentUser.id,
    p_course_id: courseId
  });
  if (data && data.length > 0 && data[0].status === 'revision') {
    // ใช้ RPC ที่ข้าม RLS เพื่อเปลี่ยนสถานะกลับเป็น draft
    await supabase.rpc('reset_to_draft', {
      p_user_id: currentUser.id,
      p_course_id: courseId
    });
  }
}

function renderEditor(container, course, sections) {
  container.innerHTML = `
    <div class="fade-up max-w-4xl mx-auto">
      <div class="flex items-center gap-3 mb-6">
        <button id="back-btn" class="p-2 text-gray-400 hover:text-white"><i class="bi bi-arrow-left text-2xl"></i></button>
        <h2 class="text-2xl font-bold text-white">${escapeHTML(course.title)}</h2>
      </div>

      ${course.status === 'revision' && (course.review_comment || course.reviewed_by) ? `
        <div class="bg-gray-800 border-l-4 border-yellow-500 p-4 rounded-lg mb-4">
          <p class="text-sm text-yellow-400 font-medium mb-1">💬 ความคิดเห็นจากผู้จัดการ</p>
          ${course.review_comment ? `<p class="text-gray-300 text-sm">${escapeHTML(course.review_comment)}</p>` : ''}
          ${course.reviewed_by ? `<p class="text-xs text-gray-500 mt-1">👤 ตรวจสอบโดย: ${escapeHTML(course.reviewed_by)}</p>` : ''}
        </div>
      ` : ''}

      <div class="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="text-sm text-gray-400">ชื่อคอร์ส</label>
            <input id="course-title" class="w-full bg-gray-800 rounded p-2 text-white mt-1" value="${escapeHTML(course.title)}">
          </div>
          <div>
            <label class="text-sm text-gray-400">URL รูปปก</label>
            <input id="course-thumb" class="w-full bg-gray-800 rounded p-2 text-white mt-1" value="${escapeHTML(course.thumbnail_url || '')}">
          </div>
          <div class="md:col-span-2">
            <label class="text-sm text-gray-400">คำอธิบาย</label>
            <textarea id="course-desc" rows="3" class="w-full bg-gray-800 rounded p-2 text-white mt-1">${escapeHTML(course.description || '')}</textarea>
          </div>
        </div>
        <div class="flex justify-end mt-3">
          <button id="save-course-btn" class="btn-brand text-sm py-2 px-4">บันทึกข้อมูลคอร์ส</button>
        </div>
      </div>

      <div class="mb-6">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-xl font-bold text-white">บทเรียน</h3>
          <button id="add-section-btn" class="btn-outline-brand text-sm py-2 px-3"><i class="bi bi-plus-lg"></i> เพิ่มหัวข้อ</button>
        </div>
        <div id="sections-container" class="space-y-4"></div>
      </div>

      <dialog id="lesson-modal" class="modal">
        <div class="bg-gray-900 border border-gray-800 rounded-xl p-6 w-full max-w-xl mx-4 max-h-[90vh] overflow-y-auto">
          <h3 class="text-xl font-bold text-white mb-4">บทเรียน</h3>
          <form id="lesson-form" class="space-y-3">
            <input type="hidden" id="lesson-id">
            <div>
              <label class="text-sm text-gray-400">ชื่อบทเรียน</label>
              <input id="lesson-title" class="w-full bg-gray-800 rounded p-2 text-white mt-1" required>
            </div>
            <div>
              <label class="text-sm text-gray-400">ประเภทเนื้อหา (เลือกอย่างน้อยหนึ่งอย่าง)</label>
              <div class="grid grid-cols-2 gap-2 mt-1">
                <label class="flex items-center gap-2 text-gray-300"><input type="checkbox" class="content-type" value="video"> วิดีโอ</label>
                <label class="flex items-center gap-2 text-gray-300"><input type="checkbox" class="content-type" value="image"> รูปภาพ</label>
                <label class="flex items-center gap-2 text-gray-300"><input type="checkbox" class="content-type" value="text"> ข้อความ</label>
                <label class="flex items-center gap-2 text-gray-300"><input type="checkbox" class="content-type" value="resources"> แหล่งข้อมูล</label>
              </div>
            </div>
            <div id="video-fields" class="hidden">
              <label class="text-sm text-gray-400">URL วิดีโอ</label>
              <input id="lesson-video" class="w-full bg-gray-800 rounded p-2 text-white mt-1" placeholder="https://...">
            </div>
            <div id="image-fields" class="hidden">
              <label class="text-sm text-gray-400">URL รูปภาพ</label>
              <input id="lesson-image" class="w-full bg-gray-800 rounded p-2 text-white mt-1" placeholder="https://...">
            </div>
            <div id="text-fields" class="hidden">
              <label class="text-sm text-gray-400">เนื้อหา (HTML)</label>
              <textarea id="lesson-text" rows="4" class="w-full bg-gray-800 rounded p-2 text-white mt-1"></textarea>
            </div>
            <div id="resources-fields" class="hidden">
              <label class="text-sm text-gray-400">แหล่งข้อมูลเพิ่มเติม (URL หรือข้อความ)</label>
              <input id="lesson-resources" class="w-full bg-gray-800 rounded p-2 text-white mt-1">
            </div>
            <div class="flex justify-end gap-2 mt-4">
              <button type="button" id="close-lesson-modal" class="btn-outline-brand text-sm py-2 px-4">ยกเลิก</button>
              <button type="submit" class="btn-brand text-sm py-2 px-4">บันทึก</button>
            </div>
          </form>
        </div>
        <form method="dialog" class="modal-backdrop"><button>close</button></form>
      </dialog>
    </div>`;

  document.getElementById('back-btn').addEventListener('click', () => navigate('/creator'));
  document.getElementById('save-course-btn').addEventListener('click', saveCourseMeta);
  renderSections(document.getElementById('sections-container'), sections);

  document.getElementById('add-section-btn').addEventListener('click', async () => {
    const title = prompt('ชื่อหัวข้อ:');
    if (!title) return;
    const supabase = await getSupabaseClient();
    await supabase.rpc('add_section', { p_course_id: courseId, p_title: title });
    await resetToDraftIfRevision();
    await reloadSections(document.getElementById('sections-container'));
  });

  document.getElementById('close-lesson-modal').addEventListener('click', () => {
    document.getElementById('lesson-modal').close();
  });

  document.getElementById('lesson-form').addEventListener('submit', saveLesson);
  document.querySelectorAll('.content-type').forEach(cb => {
    cb.addEventListener('change', toggleContentFields);
  });
}

function renderSections(container, sections) {
  container.innerHTML = sections.map(sec => `
    <div class="bg-gray-900 border border-gray-800 rounded-xl p-4">
      <div class="flex justify-between items-center mb-3">
        <div class="flex items-center gap-2">
          <span class="text-white font-medium">${escapeHTML(sec.section_title)}</span>
          <button class="edit-section-btn text-gray-400 hover:text-white" data-id="${sec.section_id}"><i class="bi bi-pencil"></i></button>
          <button class="delete-section-btn text-red-400 hover:text-red-300" data-id="${sec.section_id}"><i class="bi bi-trash"></i></button>
        </div>
        <button class="add-lesson-btn btn-outline-brand text-xs py-1 px-2" data-section-id="${sec.section_id}">
          <i class="bi bi-plus"></i> เพิ่มเนื้อหา
        </button>
      </div>
      <div class="space-y-2" id="lessons-${sec.section_id}">
        ${renderLessons(sec.lessons || [], sec.section_id)}
      </div>
    </div>
  `).join('');

  container.querySelectorAll('.edit-section-btn').forEach(b => {
    b.addEventListener('click', async () => {
      const newTitle = prompt('ชื่อหัวข้อใหม่:');
      if (newTitle) {
        const supabase = await getSupabaseClient();
        await supabase.rpc('update_section', { p_section_id: b.dataset.id, p_title: newTitle });
        await resetToDraftIfRevision();
        await reloadSections(container);
      }
    });
  });
  container.querySelectorAll('.delete-section-btn').forEach(b => {
    b.addEventListener('click', async () => {
      if (confirm('ลบหัวข้อนี้?')) {
        const supabase = await getSupabaseClient();
        await supabase.rpc('delete_section', { p_section_id: b.dataset.id });
        await resetToDraftIfRevision();
        await reloadSections(container);
      }
    });
  });
  container.querySelectorAll('.add-lesson-btn').forEach(b => {
    b.addEventListener('click', () => openLessonModal({ sectionId: b.dataset.sectionId, lessonId: null, lessonObj: null }));
  });

  // Edit/Delete lesson buttons
  container.querySelectorAll('.edit-lesson-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      openLessonModal({ sectionId: btn.dataset.sectionId, lessonId: btn.dataset.lessonId, lessonObj: null });
    });
  });
  container.querySelectorAll('.delete-lesson-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (confirm('ลบบทเรียนนี้?')) {
        const supabase = await getSupabaseClient();
        await supabase.rpc('delete_lesson', { p_lesson_id: btn.dataset.lessonId });
        await resetToDraftIfRevision();
        await reloadSections(container);
      }
    });
  });
}

function renderLessons(lessons, sectionId) {
  if (!lessons.length) return '<p class="text-gray-500 text-sm pl-4">ยังไม่มีเนื้อหา</p>';
  return lessons.map(lesson => {
    let typeIcon = '';
    if (lesson.video_url) typeIcon += '<i class="bi bi-play-circle mr-1"></i>';
    if (lesson.image_url) typeIcon += '<i class="bi bi-image mr-1"></i>';
    if (lesson.rich_text) typeIcon += '<i class="bi bi-text-paragraph mr-1"></i>';
    if (lesson.external_resources) typeIcon += '<i class="bi bi-link-45deg mr-1"></i>';
    return `
      <div class="flex justify-between items-center bg-gray-800 rounded-lg px-3 py-2">
        <div class="flex items-center gap-2 text-white text-sm">
          ${typeIcon}
          <span>${escapeHTML(lesson.title)}</span>
        </div>
        <div class="flex gap-1">
          <button class="edit-lesson-btn text-gray-400 hover:text-white" data-lesson-id="${lesson.id}" data-section-id="${sectionId}"><i class="bi bi-pencil"></i></button>
          <button class="delete-lesson-btn text-red-400 hover:text-red-300" data-lesson-id="${lesson.id}"><i class="bi bi-trash"></i></button>
        </div>
      </div>`;
  }).join('');
}

async function reloadSections(container) {
  const supabase = await getSupabaseClient();
  const { data: sections } = await supabase.rpc('get_course_sections', { p_course_id: courseId });
  renderSections(container, sections || []);
}

async function openLessonModal({ sectionId, lessonId, lessonObj }) {
  const modal = document.getElementById('lesson-modal');
  const form = document.getElementById('lesson-form');
  form.reset();
  document.getElementById('lesson-id').value = '';
  document.getElementById('lesson-title').value = '';
  document.querySelectorAll('.content-type').forEach(cb => cb.checked = false);
  document.getElementById('lesson-video').value = '';
  document.getElementById('lesson-image').value = '';
  document.getElementById('lesson-text').value = '';
  document.getElementById('lesson-resources').value = '';

  let lesson = lessonObj;
  if (!lesson && lessonId) {
    const supabase = await getSupabaseClient();
    const { data: fetchedLesson } = await supabase
      .from('lessons')
      .select('*')
      .eq('id', lessonId)
      .single();
    lesson = fetchedLesson;
  }

  if (lesson) {
    document.getElementById('lesson-id').value = lesson.id;
    document.getElementById('lesson-title').value = lesson.title || '';
    if (lesson.video_url) document.querySelector('.content-type[value="video"]').checked = true;
    if (lesson.image_url) document.querySelector('.content-type[value="image"]').checked = true;
    if (lesson.rich_text) document.querySelector('.content-type[value="text"]').checked = true;
    if (lesson.external_resources) document.querySelector('.content-type[value="resources"]').checked = true;
    document.getElementById('lesson-video').value = lesson.video_url || '';
    document.getElementById('lesson-image').value = lesson.image_url || '';
    document.getElementById('lesson-text').value = lesson.rich_text || '';
    document.getElementById('lesson-resources').value = lesson.external_resources || '';
  }

  toggleContentFields();
  modal.dataset.sectionId = sectionId;
  modal.showModal();
}

function toggleContentFields() {
  document.getElementById('video-fields').classList.toggle('hidden', !document.querySelector('.content-type[value="video"]').checked);
  document.getElementById('image-fields').classList.toggle('hidden', !document.querySelector('.content-type[value="image"]').checked);
  document.getElementById('text-fields').classList.toggle('hidden', !document.querySelector('.content-type[value="text"]').checked);
  document.getElementById('resources-fields').classList.toggle('hidden', !document.querySelector('.content-type[value="resources"]').checked);
}

async function saveLesson(e) {
  e.preventDefault();
  const lessonId = document.getElementById('lesson-id').value;
  const title = document.getElementById('lesson-title').value.trim();
  const sectionId = document.getElementById('lesson-modal').dataset.sectionId;
  if (!title) return;

  const supabase = await getSupabaseClient();
  const videoUrl = document.getElementById('lesson-video').value.trim() || null;
  const imageUrl = document.getElementById('lesson-image').value.trim() || null;
  const text = document.getElementById('lesson-text').value.trim() || null;
  const resources = document.getElementById('lesson-resources').value.trim() || null;

  try {
    if (lessonId) {
      await supabase.rpc('update_lesson', {
        p_lesson_id: lessonId,
        p_title: title,
        p_video_url: videoUrl,
        p_image_url: imageUrl,
        p_rich_text_content: text,
        p_external_resources: resources
      });
    } else {
      const { data: newId, error } = await supabase.rpc('add_lesson', {
        p_section_id: sectionId,
        p_title: title
      });
      if (error) throw error;
      await supabase.rpc('update_lesson', {
        p_lesson_id: newId,
        p_title: title,
        p_video_url: videoUrl,
        p_image_url: imageUrl,
        p_rich_text_content: text,
        p_external_resources: resources
      });
    }
    document.getElementById('lesson-modal').close();
    await resetToDraftIfRevision();
    await reloadSections(document.getElementById('sections-container'));
  } catch (err) {
    console.error('Save lesson error:', err);
    alert('เกิดข้อผิดพลาด: ' + err.message);
  }
}

async function saveCourseMeta() {
  const title = document.getElementById('course-title').value.trim();
  const desc = document.getElementById('course-desc').value.trim();
  const thumb = document.getElementById('course-thumb').value.trim();
  const supabase = await getSupabaseClient();
  await supabase.rpc('update_course', {
    p_user_id: currentUser.id,
    p_course_id: courseId,
    p_title: title,
    p_description: desc || null,
    p_thumbnail_url: thumb || null
  });
  await resetToDraftIfRevision();
  alert('บันทึกข้อมูลคอร์สแล้ว');
}

function escapeHTML(str) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}