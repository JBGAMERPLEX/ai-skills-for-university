// js/views/creator-edit.js
import { getSession } from '../services/auth.js';
import { getSupabaseClient } from '../services/supabase.js';
import { navigate } from '../utils/router.js';
import { convertVideoUrl } from '../utils/video-url.js';

const IMGBB_API_KEY = 'b5dedfe841575caa018fb970e5cb86f7'; // ✅ ใส่ API Key ของคุณ

let currentUser = null;
let courseId = null;
let saveCourseClickCount = 0;
let saveCourseResetTimer = null;

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
    await supabase.rpc('reset_to_draft', {
      p_user_id: currentUser.id,
      p_course_id: courseId
    });
  }
}

// ================================================================
//  RENDER EDITOR SHELL
// ================================================================
function renderEditor(container, course, sections) {
  container.innerHTML = `
    <div class="fade-up max-w-4xl mx-auto">
<div class="flex items-center gap-3 mb-6 flex-wrap">
  <button id="back-btn" class="p-2 text-gray-400 hover:text-white"><i class="bi bi-arrow-left text-2xl"></i></button>
  <h2 class="text-2xl font-bold text-white flex-1">${escapeHTML(course.title)}</h2>
  <a href="#/quiz-manager/${courseId}" class="btn-outline-brand text-sm py-2 px-4">
    <i class="bi bi-pencil-square"></i> จัดการ Quiz
  </a>
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
            <label class="text-sm text-gray-400">รูปปกคอร์ส</label>
            <input type="file" id="course-thumb-upload" class="hidden" accept="image/*">
            <div class="flex gap-2 items-center mt-1">
              <input type="text" id="course-thumb" class="w-full bg-gray-800 rounded p-2 text-white" placeholder="https://..." value="${escapeHTML(course.thumbnail_url || '')}">
              <button type="button" id="upload-course-thumb-btn" class="btn-outline-brand text-sm py-2 px-3 whitespace-nowrap">
                <i class="bi bi-upload"></i> อัปโหลด
              </button>
            </div>
            <div id="course-thumb-preview" class="mt-2 ${course.thumbnail_url ? '' : 'hidden'}">
              <img src="${escapeHTML(course.thumbnail_url || '')}" class="h-32 rounded-lg object-cover border border-gray-700" />
            </div>
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
    </div>`;

  document.getElementById('back-btn').addEventListener('click', () => navigate('/creator'));
  document.getElementById('save-course-btn').addEventListener('click', saveCourseMeta);
  renderSections(document.getElementById('sections-container'), sections);

  document.getElementById('add-section-btn').addEventListener('click', () => {
    addSectionInline();
  });

  // ---------- Upload course thumbnail ----------
  document.getElementById('upload-course-thumb-btn').addEventListener('click', () => {
    document.getElementById('course-thumb-upload').click();
  });

  document.getElementById('course-thumb-upload').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const url = await uploadImageToImgBB(file);
      document.getElementById('course-thumb').value = url;
      const preview = document.getElementById('course-thumb-preview');
      preview.classList.remove('hidden');
      preview.querySelector('img').src = url;
      showToast('อัปโหลดรูปปกสำเร็จ', 'success');
    } catch (err) {
      console.error(err);
      showToast('อัปโหลดรูปปกล้มเหลว', 'error');
    }
  });
}

// ================================================================
//  UPLOAD IMAGE TO IMGBB
// ================================================================
async function uploadImageToImgBB(file) {
  const formData = new FormData();
  formData.append('image', file);
  const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
    method: 'POST',
    body: formData
  });
  const json = await res.json();
  if (json.success) {
    return json.data.url;
  } else {
    throw new Error(json.error?.message || 'Upload failed');
  }
}

// ================================================================
//  SAVE COURSE META (Double-click confirm)
// ================================================================
function saveCourseMeta() {
  const btn = document.getElementById('save-course-btn');
  
  saveCourseClickCount++;
  
  if (saveCourseClickCount === 1) {
    btn.innerHTML = '<i class="bi bi-check-lg"></i> กดอีกครั้งเพื่อยืนยัน';
    btn.classList.add('!bg-green-600', '!border-green-600');
    
    saveCourseResetTimer = setTimeout(() => {
      saveCourseClickCount = 0;
      btn.innerHTML = 'บันทึกข้อมูลคอร์ส';
      btn.classList.remove('!bg-green-600', '!border-green-600');
    }, 3000);
  } else if (saveCourseClickCount === 2) {
    clearTimeout(saveCourseResetTimer);
    btn.innerHTML = 'บันทึกข้อมูลคอร์ส';
    btn.classList.remove('!bg-green-600', '!border-green-600');
    saveCourseClickCount = 0;
    performSaveCourseMeta();
  }
}

async function performSaveCourseMeta() {
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
  
  const btn = document.getElementById('save-course-btn');
  btn.innerHTML = '<i class="bi bi-check-circle"></i> บันทึกแล้ว!';
  btn.classList.add('!bg-green-600', '!border-green-600');
  setTimeout(() => {
    btn.innerHTML = 'บันทึกข้อมูลคอร์ส';
    btn.classList.remove('!bg-green-600', '!border-green-600');
  }, 2000);
}

// ================================================================
//  INLINE ADD SECTION
// ================================================================
function addSectionInline() {
  const container = document.getElementById('sections-container');

  const newSectionDiv = document.createElement('div');
  newSectionDiv.className = 'bg-gray-900 border border-gray-800 rounded-xl p-4';
  newSectionDiv.innerHTML = `
    <div class="flex items-center gap-2">
      <input type="text" class="section-title-input w-full bg-gray-800 rounded p-2 text-white text-sm" placeholder="ชื่อหัวข้อใหม่..." autofocus>
      <button class="save-section-btn text-green-400 hover:text-green-300 p-1" title="บันทึก"><i class="bi bi-check-lg text-xl"></i></button>
      <button class="cancel-section-btn text-red-400 hover:text-red-300 p-1" title="ยกเลิก"><i class="bi bi-x-lg text-xl"></i></button>
    </div>
    <p class="text-gray-500 text-sm pl-2 mt-2">ยังไม่มีเนื้อหา</p>
  `;

  container.appendChild(newSectionDiv);

  const input = newSectionDiv.querySelector('.section-title-input');
  input.focus();

  const saveSection = async () => {
    const title = input.value.trim();
    if (!title) {
      newSectionDiv.remove();
      return;
    }
    const supabase = await getSupabaseClient();
    await supabase.rpc('add_section', { p_course_id: courseId, p_title: title });
    await resetToDraftIfRevision();
    await reloadSections(container);
  };

  newSectionDiv.querySelector('.save-section-btn').addEventListener('click', saveSection);
  newSectionDiv.querySelector('.cancel-section-btn').addEventListener('click', () => {
    newSectionDiv.remove();
  });

  input.addEventListener('keydown', async (e) => {
    if (e.key === 'Enter') await saveSection();
    if (e.key === 'Escape') newSectionDiv.remove();
  });
}

// ================================================================
//  INLINE EDIT SECTION
// ================================================================
function editSectionInline(sectionId, container) {
  const sectionDiv = document.querySelector(`[data-id="${sectionId}"]`).closest('.bg-gray-900');
  const titleSpan = sectionDiv.querySelector('span.text-white');
  const oldTitle = titleSpan.textContent;

  const input = document.createElement('input');
  input.type = 'text';
  input.value = oldTitle;
  input.className = 'w-full bg-gray-800 rounded p-1 text-white text-sm';

  titleSpan.replaceWith(input);
  input.focus();

  const editBtn = sectionDiv.querySelector('.edit-section-btn');
  const deleteBtn = sectionDiv.querySelector('.delete-section-btn');

  const saveBtn = document.createElement('button');
  saveBtn.className = 'text-green-400 hover:text-green-300 p-1';
  saveBtn.innerHTML = '<i class="bi bi-check-lg text-xl"></i>';

  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'text-red-400 hover:text-red-300 p-1';
  cancelBtn.innerHTML = '<i class="bi bi-x-lg text-xl"></i>';

  editBtn.style.display = 'none';
  deleteBtn.style.display = 'none';
  editBtn.parentNode.insertBefore(saveBtn, editBtn);
  editBtn.parentNode.insertBefore(cancelBtn, editBtn);

  const save = async () => {
    const newTitle = input.value.trim();
    if (newTitle && newTitle !== oldTitle) {
      const supabase = await getSupabaseClient();
      await supabase.rpc('update_section', { p_section_id: sectionId, p_title: newTitle });
      await resetToDraftIfRevision();
    }
    await reloadSections(container);
  };

  const cancel = () => {
    const span = document.createElement('span');
    span.className = 'text-white font-medium';
    span.textContent = oldTitle;
    input.replaceWith(span);
    saveBtn.remove();
    cancelBtn.remove();
    editBtn.style.display = '';
    deleteBtn.style.display = '';
  };

  saveBtn.addEventListener('click', save);
  cancelBtn.addEventListener('click', cancel);

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') save();
    if (e.key === 'Escape') cancel();
  });
}

// ================================================================
//  RENDER SECTIONS & LESSONS
// ================================================================
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

  // ---------- SECTION EVENTS ----------
  container.querySelectorAll('.edit-section-btn').forEach(b => {
    b.addEventListener('click', (e) => {
      e.stopPropagation();
      editSectionInline(b.dataset.id, container);
    });
  });

  container.querySelectorAll('.delete-section-btn').forEach(b => {
    let clickCount = 0;
    let resetTimer;
    
    b.addEventListener('click', async (e) => {
      e.stopPropagation();
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
        await supabase.rpc('delete_section', { p_section_id: b.dataset.id });
        await resetToDraftIfRevision();
        await reloadSections(container);
      }
    });
  });

  // ---------- LESSON EVENTS ----------
  container.querySelectorAll('.add-lesson-btn').forEach(b => {
    b.addEventListener('click', (e) => {
      e.stopPropagation();
      addLessonInline(b.dataset.sectionId);
    });
  });

  container.querySelectorAll('.edit-lesson-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      const sectionId = btn.dataset.sectionId;
      const lessonId = btn.dataset.lessonId;
      
      const existingForm = document.querySelector('.inline-edit-form');
      if (existingForm) existingForm.remove();
      
      editLessonInline(sectionId, lessonId);
    });
  });

  container.querySelectorAll('.delete-lesson-btn').forEach(btn => {
    let clickCount = 0;
    let resetTimer;
    
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      clickCount++;
      
      if (clickCount === 1) {
        btn.classList.add('text-red-500');
        btn.innerHTML = '<i class="bi bi-exclamation-triangle"></i>';
        resetTimer = setTimeout(() => {
          clickCount = 0;
          btn.classList.remove('text-red-500');
          btn.innerHTML = '<i class="bi bi-trash"></i>';
        }, 3000);
      } else if (clickCount === 2) {
        clearTimeout(resetTimer);
        const supabase = await getSupabaseClient();
        await supabase.rpc('delete_lesson', { p_lesson_id: btn.dataset.lessonId });
        await resetToDraftIfRevision();
        await reloadSections(container);
      }
    });
  });

  // ---------- EXPAND/COLLAPSE LESSON PREVIEW ----------
  container.querySelectorAll('.lesson-toggle').forEach(toggle => {
    toggle.addEventListener('click', (e) => {
      if (e.target.closest('.edit-lesson-btn') || e.target.closest('.delete-lesson-btn')) return;
      
      const lessonId = toggle.dataset.lessonId;
      const content = document.getElementById(`creator-content-${lessonId}`);
      const icon = document.getElementById(`creator-icon-${lessonId}`);
      content?.classList.toggle('open');
      icon?.classList.toggle('rotate-180');
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
      <div class="border border-gray-800 rounded-lg overflow-hidden">
        <div class="lesson-toggle flex justify-between items-center p-3 bg-gray-800 hover:bg-gray-700 transition cursor-pointer"
             data-lesson-id="${lesson.id}">
          <div class="flex items-center gap-2 text-white text-sm">
            ${typeIcon}
            <span>${escapeHTML(lesson.title)}</span>
          </div>
          <div class="flex items-center gap-2">
            <button class="edit-lesson-btn text-gray-400 hover:text-white" data-lesson-id="${lesson.id}" data-section-id="${sectionId}"><i class="bi bi-pencil"></i></button>
            <button class="delete-lesson-btn text-red-400 hover:text-red-300" data-lesson-id="${lesson.id}"><i class="bi bi-trash"></i></button>
            <i class="bi bi-chevron-down text-gray-400 transition-transform duration-200" id="creator-icon-${lesson.id}"></i>
          </div>
        </div>
        <div id="creator-content-${lesson.id}" class="lesson-content bg-gray-950 px-4">
          <div class="py-3 space-y-3 text-sm">
            ${lesson.video_url ? `
              <div class="aspect-video rounded-lg overflow-hidden">
                <iframe src="${escapeHTML(convertVideoUrl(lesson.video_url))}" class="w-full h-full" frameborder="0" allowfullscreen></iframe>
              </div>` : ''}
            ${lesson.image_url ? `<img src="${escapeHTML(lesson.image_url)}" class="max-h-96 w-full object-cover rounded-lg" />` : ''}
            ${lesson.rich_text ? 
              lesson.rich_text.split('<!--SEP-->').map(txt => 
                `<div class="prose-lesson mb-4">${txt}</div>`
              ).join('') 
            : ''}
            ${lesson.external_resources ? `
              <div class="pt-2 border-t border-gray-800">
                <h4 class="font-semibold text-white mb-1">แหล่งข้อมูลเพิ่มเติม</h4>
                ${lesson.external_resources.split(',').filter(r => r.trim()).map(res => `
                  <a href="${escapeHTML(res.trim())}" target="_blank" class="text-brand hover:underline break-all block">${escapeHTML(res.trim())}</a>
                `).join('')}
              </div>` : ''}
          </div>
        </div>
      </div>`;
  }).join('');
}

async function reloadSections(container) {
  const supabase = await getSupabaseClient();
  const { data: sections } = await supabase.rpc('get_course_sections', { p_course_id: courseId });
  renderSections(container, sections || []);
}

// ================================================================
//  INLINE ADD LESSON
// ================================================================
function addLessonInline(sectionId) {
  const container = document.getElementById('sections-container');
  const sectionDiv = container.querySelector(`.add-lesson-btn[data-section-id="${sectionId}"]`).closest('.bg-gray-900');
  const lessonsContainer = sectionDiv.querySelector(`[id^="lessons-"]`);

  const form = document.createElement('div');
  form.className = 'inline-edit-form bg-gray-800 rounded-lg p-3 mt-2 border border-gray-700';
  form.innerHTML = buildLessonFormHTML();
  lessonsContainer.appendChild(form);

  const titleInput = form.querySelector('.inline-lesson-title');
  titleInput.focus();

  attachLessonFormEvents(form, sectionId, null, () => {
    form.remove();
  });
}

// ================================================================
//  INLINE EDIT LESSON
// ================================================================
async function editLessonInline(sectionId, lessonId) {
  const container = document.getElementById('sections-container');
  const sectionDiv = container.querySelector(`.edit-lesson-btn[data-lesson-id="${lessonId}"]`).closest('.bg-gray-900');
  
  const lessonRow = sectionDiv.querySelector(`.lesson-toggle[data-lesson-id="${lessonId}"]`);
  if (!lessonRow) return;
  
  const supabase = await getSupabaseClient();
  const { data: lessonData, error: lessonErr } = await supabase.rpc('get_lesson_by_id', {
    p_lesson_id: lessonId
  });
  if (lessonErr || !lessonData?.length) return;
  const lesson = lessonData[0];
  
  lesson.rich_text = lesson.rich_text_content || '';

  lessonRow.style.display = 'none';

  const form = document.createElement('div');
  form.className = 'inline-edit-form bg-gray-800 rounded-lg p-3 mt-2 border border-gray-700';
  form.innerHTML = buildLessonFormHTML(lesson);
  lessonRow.parentNode.insertBefore(form, lessonRow.nextSibling);

  attachLessonFormEvents(form, sectionId, lessonId, () => {
    form.remove();
    lessonRow.style.display = '';
  });
}

// ================================================================
//  FORM HTML BUILDER (with upload image button)
// ================================================================
function buildLessonFormHTML(lesson = null) {
  const hasVideo = lesson?.video_url ? true : false;
  const hasImage = lesson?.image_url ? true : false;
  const hasText = lesson?.rich_text ? true : false;
  const hasResources = lesson?.external_resources ? true : false;

  const textSections = (hasText && lesson.rich_text.trim() !== '') 
    ? lesson.rich_text.split('<!--SEP-->') 
    : [''];

  const resourceItems = (hasResources && lesson.external_resources.trim() !== '') 
    ? lesson.external_resources.split(',') 
    : [''];

  return `
    <div class="space-y-3">
      <input type="text" class="inline-lesson-title w-full bg-gray-700 rounded p-2 text-white text-sm" placeholder="ชื่อบทเรียน" value="${escapeHTML(lesson?.title || '')}" autofocus autocapitalize="off" autocomplete="off" spellcheck="false">
      
      <div class="grid grid-cols-2 gap-2">
        <label class="flex items-center gap-2 text-gray-300 text-sm"><input type="checkbox" class="inline-content-type" value="video" ${hasVideo ? 'checked' : ''}> วิดีโอ</label>
        <label class="flex items-center gap-2 text-gray-300 text-sm"><input type="checkbox" class="inline-content-type" value="image" ${hasImage ? 'checked' : ''}> รูปภาพ</label>
        <label class="flex items-center gap-2 text-gray-300 text-sm"><input type="checkbox" class="inline-content-type" value="text" ${hasText ? 'checked' : ''}> ข้อความ</label>
        <label class="flex items-center gap-2 text-gray-300 text-sm"><input type="checkbox" class="inline-content-type" value="resources" ${hasResources ? 'checked' : ''}> แหล่งข้อมูล</label>
      </div>

      <!-- Video URL -->
      <div class="inline-video-fields ${!hasVideo ? 'hidden' : ''}">
        <label class="text-sm text-gray-400">URL วิดีโอ</label>
        <input type="text" class="inline-lesson-video w-full bg-gray-700 rounded p-2 text-white text-sm" placeholder="https://..." value="${escapeHTML(lesson?.video_url || '')}" autocapitalize="off" autocomplete="off" spellcheck="false">
      </div>

      <!-- Image URL + Upload -->
      <div class="inline-image-fields ${!hasImage ? 'hidden' : ''}">
        <label class="text-sm text-gray-400">รูปภาพ</label>
        <input type="file" class="inline-lesson-image-upload hidden" accept="image/*">
        <div class="flex gap-2 items-center">
          <input type="text" class="inline-lesson-image w-full bg-gray-700 rounded p-2 text-white text-sm" placeholder="https://..." value="${escapeHTML(lesson?.image_url || '')}" autocapitalize="off" autocomplete="off" spellcheck="false">
          <button type="button" class="upload-image-btn btn-outline-brand text-sm py-2 px-3 whitespace-nowrap">
            <i class="bi bi-upload"></i> อัปโหลด
          </button>
        </div>
        <div class="mt-2 ${lesson?.image_url ? '' : 'hidden'}">
          <img src="${escapeHTML(lesson?.image_url || '')}" class="max-h-32 rounded-lg object-cover border border-gray-700" />
        </div>
        <p class="upload-image-status text-xs text-gray-500 mt-1 hidden">กำลังอัปโหลด...</p>
      </div>

      <!-- Rich Text Content -->
      <div class="inline-text-fields ${!hasText ? 'hidden' : ''}">
        <label class="text-sm text-gray-400">เนื้อหา</label>
        <div class="text-contents-container space-y-3">
          ${textSections.map((text, idx) => `
            <div class="space-y-2 ${idx > 0 ? 'border-t border-gray-700 pt-3' : ''}">
              <div class="flex flex-wrap gap-1 rich-toolbar">
                <button type="button" class="toolbar-btn text-white bg-gray-600 hover:bg-gray-500 px-3 py-2 rounded text-xs" data-command="bold" style="touch-action: manipulation;"><i class="bi bi-type-bold"></i></button>
                <button type="button" class="toolbar-btn text-white bg-gray-600 hover:bg-gray-500 px-3 py-2 rounded text-xs" data-command="italic" style="touch-action: manipulation;"><i class="bi bi-type-italic"></i></button>
                <button type="button" class="toolbar-btn text-white bg-gray-600 hover:bg-gray-500 px-3 py-2 rounded text-xs" data-command="underline" style="touch-action: manipulation;"><i class="bi bi-type-underline"></i></button>
                <button type="button" class="toolbar-btn text-white bg-gray-600 hover:bg-gray-500 px-3 py-2 rounded text-xs" data-command="strikeThrough" style="touch-action: manipulation;"><i class="bi bi-type-strikethrough"></i></button>
              </div>
              <div class="inline-lesson-text w-full bg-gray-700 rounded p-2 text-white text-sm min-h-[80px] focus:outline-none" contenteditable="true">${text}</div>
            </div>
          `).join('')}
        </div>
        <button type="button" class="add-text-btn text-xs text-brand hover:underline mt-2"><i class="bi bi-plus"></i> เพิ่มข้อความ</button>
      </div>

      <!-- External Resources -->
      <div class="inline-resources-fields ${!hasResources ? 'hidden' : ''}">
        <label class="text-sm text-gray-400">แหล่งข้อมูลเพิ่มเติม</label>
        <div class="resources-container space-y-2">
          ${resourceItems.map(r => `
            <input type="text" class="inline-lesson-resources w-full bg-gray-700 rounded p-2 text-white text-sm" placeholder="URL หรือข้อความ" value="${escapeHTML(r.trim())}" autocapitalize="off" autocomplete="off" spellcheck="false">
          `).join('')}
        </div>
        <button type="button" class="add-resource-btn text-xs text-brand hover:underline mt-1"><i class="bi bi-plus"></i> เพิ่มแหล่งข้อมูล</button>
      </div>

      <div class="flex justify-end gap-2">
        <button class="cancel-inline-lesson-btn btn-outline-brand text-sm py-3 px-4" style="touch-action: manipulation;">ยกเลิก</button>
        <button class="save-inline-lesson-btn btn-brand text-sm py-3 px-4" style="touch-action: manipulation;">บันทึก</button>
      </div>
    </div>`;
}

// ================================================================
//  FORM EVENT HANDLER
// ================================================================
function attachLessonFormEvents(form, sectionId, lessonId, onCancel) {
  // Toggle content type fields
  form.querySelectorAll('.inline-content-type').forEach(cb => {
    cb.addEventListener('change', () => {
      form.querySelector('.inline-video-fields').classList.toggle('hidden', !form.querySelector('.inline-content-type[value="video"]').checked);
      form.querySelector('.inline-image-fields').classList.toggle('hidden', !form.querySelector('.inline-content-type[value="image"]').checked);
      form.querySelector('.inline-text-fields').classList.toggle('hidden', !form.querySelector('.inline-content-type[value="text"]').checked);
      form.querySelector('.inline-resources-fields').classList.toggle('hidden', !form.querySelector('.inline-content-type[value="resources"]').checked);
    });
  });

  // ADD buttons
  form.querySelector('.add-text-btn')?.addEventListener('click', () => {
    const container = form.querySelector('.text-contents-container');
    const div = document.createElement('div');
    div.className = 'space-y-2 border-t border-gray-700 pt-3';
    div.innerHTML = `
      <div class="flex flex-wrap gap-1 rich-toolbar">
        <button type="button" class="toolbar-btn text-white bg-gray-600 hover:bg-gray-500 px-3 py-2 rounded text-xs" data-command="bold" style="touch-action: manipulation;"><i class="bi bi-type-bold"></i></button>
        <button type="button" class="toolbar-btn text-white bg-gray-600 hover:bg-gray-500 px-3 py-2 rounded text-xs" data-command="italic" style="touch-action: manipulation;"><i class="bi bi-type-italic"></i></button>
        <button type="button" class="toolbar-btn text-white bg-gray-600 hover:bg-gray-500 px-3 py-2 rounded text-xs" data-command="underline" style="touch-action: manipulation;"><i class="bi bi-type-underline"></i></button>
        <button type="button" class="toolbar-btn text-white bg-gray-600 hover:bg-gray-500 px-3 py-2 rounded text-xs" data-command="strikeThrough" style="touch-action: manipulation;"><i class="bi bi-type-strikethrough"></i></button>
      </div>
      <div class="inline-lesson-text w-full bg-gray-700 rounded p-2 text-white text-sm min-h-[80px] focus:outline-none" contenteditable="true"></div>
    `;
    container.appendChild(div);
  });

  form.querySelector('.add-resource-btn')?.addEventListener('click', () => {
    const container = form.querySelector('.resources-container');
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'inline-lesson-resources w-full bg-gray-700 rounded p-2 text-white text-sm mt-2';
    input.placeholder = 'URL หรือข้อความ';
    input.autocapitalize = 'off';
    input.autocomplete = 'off';
    input.spellcheck = false;
    container.appendChild(input);
  });

  // Image upload
  form.querySelector('.upload-image-btn')?.addEventListener('click', () => {
    form.querySelector('.inline-lesson-image-upload').click();
  });

  form.querySelector('.inline-lesson-image-upload')?.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const statusEl = form.querySelector('.upload-image-status');
    statusEl.classList.remove('hidden');
    statusEl.textContent = 'กำลังอัปโหลด...';
    try {
      const url = await uploadImageToImgBB(file);
      form.querySelector('.inline-lesson-image').value = url;
      const previewImg = form.querySelector('img');
      if (previewImg) {
        previewImg.src = url;
        previewImg.parentElement.classList.remove('hidden');
      }
      statusEl.textContent = 'อัปโหลดสำเร็จ ✓';
    } catch (err) {
      console.error(err);
      statusEl.textContent = 'อัปโหลดล้มเหลว';
    }
  });

  // Rich Text Toolbar
  form.querySelectorAll('.toolbar-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const command = btn.dataset.command;
      document.execCommand(command, false, null);
      btn.closest('.space-y-2')?.querySelector('.inline-lesson-text')?.focus();
    });
    btn.addEventListener('mousedown', (e) => e.preventDefault());
    btn.addEventListener('touchstart', (e) => {
      // ป้องกัน zoom บน iOS
      e.preventDefault();
    });
  });

  // Cancel
  form.querySelector('.cancel-inline-lesson-btn').addEventListener('click', onCancel);

  // Save
  form.querySelector('.save-inline-lesson-btn').addEventListener('click', async () => {
    const title = form.querySelector('.inline-lesson-title').value.trim();
    if (!title) {
      showToast('กรุณากรอกชื่อบทเรียน', 'error');
      return;
    }

    const videoChecked = form.querySelector('.inline-content-type[value="video"]').checked;
    const imageChecked = form.querySelector('.inline-content-type[value="image"]').checked;
    const textChecked = form.querySelector('.inline-content-type[value="text"]').checked;
    const resourcesChecked = form.querySelector('.inline-content-type[value="resources"]').checked;

    const videoUrl = videoChecked ? (form.querySelector('.inline-lesson-video')?.value.trim() || null) : null;
    const imageUrl = imageChecked ? (form.querySelector('.inline-lesson-image')?.value.trim() || null) : null;
    const texts = textChecked 
      ? [...form.querySelectorAll('.inline-lesson-text')].map(el => el.innerHTML.trim()).filter(Boolean).join('<!--SEP-->') 
      : null;
    const resources = resourcesChecked 
      ? [...form.querySelectorAll('.inline-lesson-resources')].map(i => i.value.trim()).filter(Boolean).join(',') 
      : null;

    const supabase = await getSupabaseClient();
    try {
      if (lessonId) {
        await supabase.rpc('update_lesson', {
          p_lesson_id: lessonId,
          p_title: title,
          p_video_url: videoUrl ? convertVideoUrl(videoUrl) : null,
          p_image_url: imageUrl,
          p_rich_text_content: texts,
          p_external_resources: resources
        });
      } else {
        const { data: newId } = await supabase.rpc('add_lesson', {
          p_section_id: sectionId,
          p_title: title
        });
        if (newId) {
          await supabase.rpc('update_lesson', {
            p_lesson_id: newId,
            p_title: title,
            p_video_url: videoUrl ? convertVideoUrl(videoUrl) : null,
            p_image_url: imageUrl,
            p_rich_text_content: texts,
            p_external_resources: resources
          });
        }
      }
      showToast('บันทึกบทเรียนแล้ว', 'success');
      await resetToDraftIfRevision();
      await reloadSections(document.getElementById('sections-container'));
    } catch (err) {
      console.error(err);
      showToast('เกิดข้อผิดพลาด: ' + err.message, 'error');
    }
  });
}

// ================================================================
//  TOAST NOTIFICATION
// ================================================================
function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `fixed bottom-4 right-4 z-50 px-4 py-2 rounded-lg text-sm text-white ${type === 'success' ? 'bg-green-600' : 'bg-red-600'} shadow-lg`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// ================================================================
//  UTILITY
// ================================================================
function escapeHTML(str) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}