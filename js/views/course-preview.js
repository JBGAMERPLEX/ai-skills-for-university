// js/views/course-preview.js
import { getSession } from '../services/auth.js';
import { getSupabaseClient } from '../services/supabase.js';
import { navigate } from '../utils/router.js';

let currentUser = null;
let courseId = null;

export async function render(container, params) {
  currentUser = await getSession();
  if (!currentUser) {
    navigate('/login');
    return;
  }

  courseId = params.id;
  const supabase = await getSupabaseClient();

  // ดึงข้อมูลคอร์ส
  const { data: details, error } = await supabase.rpc('get_course_details', { p_course_id: courseId });
  if (error || !details?.length) {
    container.innerHTML = '<p class="text-center text-red-400 py-20">ไม่พบคอร์สนี้</p>';
    return;
  }
  const course = details[0];

  // เช็กว่า enrolled หรือยัง
  const { data: enrolled } = await supabase.rpc('is_enrolled', {
    p_user_id: currentUser.id,
    p_course_id: courseId
  });

  // เช็กว่าเรียนจบจริงหรือยัง
  const { data: hasCompleted } = await supabase.rpc('has_completed_course', {
    p_user_id: currentUser.id,
    p_course_id: courseId
  });

  // เช็กว่ารีวิวไปแล้วหรือยัง
  const { data: myReview } = await supabase.rpc('get_user_review', {
    p_user_id: currentUser.id,
    p_course_id: courseId
  });

  const hasReviewed = myReview && myReview.length > 0;

  // ดึงรีวิวทั้งหมด
  const { data: reviews } = await supabase.rpc('get_course_reviews', { p_course_id: courseId });

  container.innerHTML = `
    <div class="fade-up max-w-5xl mx-auto">
      <nav class="flex items-center space-x-2 text-sm text-gray-400 mb-4">
        <a href="#/courses" class="hover:text-white transition">คอร์สทั้งหมด</a>
        <i class="bi bi-chevron-right text-xs"></i>
        <span class="text-white">${escapeHTML(course.title)}</span>
      </nav>

      <!-- ข้อมูลคอร์ส -->
      <div class="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6">
        <div class="flex flex-col md:flex-row gap-6">
          <img src="${escapeHTML(course.thumbnail_url || 'https://ui-avatars.com/api/?name=Course&background=f9754a&color=fff&size=400')}" 
               class="w-full md:w-80 h-48 object-cover rounded-xl border border-gray-800" />
          <div class="flex-1">
            <h1 class="text-2xl md:text-3xl font-bold text-white mb-2">${escapeHTML(course.title)}</h1>
            <p class="text-gray-400 mb-4">${escapeHTML(course.description || '')}</p>

            <div class="flex items-center gap-3 mb-4">
              ${course.instructor_avatar ? `
                <img src="${escapeHTML(course.instructor_avatar)}" class="w-10 h-10 rounded-full object-cover border border-gray-700" />` 
                : `<div class="w-10 h-10 rounded-full bg-brand flex items-center justify-center text-white font-bold">${escapeHTML((course.instructor_name || 'U').charAt(0))}</div>`}
              <span class="text-gray-300">${escapeHTML(course.instructor_name || 'ไม่ระบุผู้สอน')}</span>
            </div>

            <div class="grid grid-cols-3 gap-4 text-center">
              <div class="bg-gray-800 rounded-lg p-3">
                <p class="text-2xl font-bold text-white">${course.total_lessons}</p>
                <p class="text-xs text-gray-400">บทเรียน</p>
              </div>
              <div class="bg-gray-800 rounded-lg p-3">
                <p class="text-2xl font-bold text-white">${course.total_videos}</p>
                <p class="text-xs text-gray-400">วิดีโอ</p>
              </div>
              <div class="bg-gray-800 rounded-lg p-3">
                <p class="text-2xl font-bold text-white">${course.estimated_minutes}</p>
                <p class="text-xs text-gray-400">นาที</p>
              </div>
            </div>
          </div>
        </div>

        <!-- ปุ่มสมัครเรียน / เริ่มเรียน / ถามตอบ -->
        <div class="mt-6 flex flex-wrap gap-3 justify-end">
          <a href="#/discussion/${course.id}" class="btn-outline-brand text-sm py-2 px-4 inline-flex items-center gap-2">
            <i class="bi bi-chat-dots"></i> ถาม-ตอบ
          </a>
          ${enrolled ? `
            <a href="#/learn/${course.id}" class="btn-brand text-lg px-8 py-3 gap-2 inline-flex items-center">
              <i class="bi bi-play-circle-fill"></i> เริ่มเรียน
            </a>` : `
            <button id="enroll-btn" class="btn-brand text-lg px-8 py-3 gap-2 inline-flex items-center">
              <i class="bi bi-plus-circle"></i> สมัครเรียน
            </button>`}
        </div>
      </div>

      <!-- รีวิว -->
      <div class="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6">
        <h2 class="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <i class="bi bi-star text-yellow-400"></i> รีวิวจากผู้เรียน
        </h2>

        ${!hasCompleted ? `
          <div class="bg-gray-800 rounded-lg p-6 text-center mb-6">
            <i class="bi bi-lock text-3xl text-gray-500"></i>
            <p class="text-gray-400 mt-2">ต้องเรียนจบคอร์สก่อนจึงจะรีวิวได้</p>
          </div>
        ` : hasReviewed ? `
          <div class="bg-gray-800 rounded-lg p-6 text-center mb-6">
            <i class="bi bi-check-circle text-green-400 text-3xl"></i>
            <p class="text-white mt-2">คุณได้รีวิวคอร์สนี้แล้ว</p>
            <button id="edit-review-btn" class="btn-outline-brand text-sm mt-3">แก้ไขรีวิว</button>
          </div>
        ` : `
          <div id="review-form-container">
            <h3 class="text-white font-semibold mb-3">เขียนรีวิวของคุณ</h3>
            <form id="review-form" class="space-y-4">
              <div>
                <label class="block text-sm text-gray-400 mb-2">คะแนน</label>
                <div id="star-rating" class="flex gap-1 text-3xl">
                  ${[1,2,3,4,5].map(i => `
                    <button type="button" class="star-btn text-gray-600 hover:text-yellow-400 transition" data-star="${i}">
                      <i class="bi bi-star"></i>
                    </button>
                  `).join('')}
                </div>
                <input type="hidden" id="selected-rating" value="0">
              </div>
              <div>
                <label class="block text-sm text-gray-400 mb-2">ความคิดเห็น</label>
                <textarea id="review-comment" rows="3" class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-brand"></textarea>
              </div>
              <button type="submit" class="btn-brand w-full py-3">ส่งรีวิว</button>
            </form>
          </div>
        `}

        <!-- แบบฟอร์มแก้ไข (ซ่อนไว้) -->
        <div id="edit-review-form-container" class="hidden">
          <h3 class="text-white font-semibold mb-3">แก้ไขรีวิวของคุณ</h3>
          <form id="edit-review-form" class="space-y-4">
            <div>
              <label class="block text-sm text-gray-400 mb-2">คะแนน</label>
              <div id="edit-star-rating" class="flex gap-1 text-3xl">
                ${[1,2,3,4,5].map(i => `
                  <button type="button" class="edit-star-btn text-gray-600 hover:text-yellow-400 transition" data-star="${i}">
                    <i class="bi bi-star"></i>
                  </button>
                `).join('')}
              </div>
              <input type="hidden" id="edit-selected-rating" value="0">
            </div>
            <div>
              <label class="block text-sm text-gray-400 mb-2">ความคิดเห็น</label>
              <textarea id="edit-review-comment" rows="3" class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-brand">${escapeHTML(myReview?.[0]?.comment || '')}</textarea>
            </div>
            <button type="submit" class="btn-brand w-full py-3">บันทึกการแก้ไข</button>
          </form>
        </div>

        <!-- รายการรีวิวทั้งหมด -->
        <div class="mt-8 space-y-4">
          ${reviews?.map(review => `
            <div class="bg-gray-800 rounded-lg p-4">
              <div class="flex items-center gap-3 mb-2">
                ${review.user_avatar ? `<img src="${escapeHTML(review.user_avatar)}" class="w-8 h-8 rounded-full object-cover" />` : '<i class="bi bi-person-circle text-2xl text-gray-400"></i>'}
                <span class="text-white text-sm">${escapeHTML(review.user_name || 'ผู้ไม่ประสงค์ออกนาม')}</span>
              </div>
              <div class="flex items-center gap-2 mb-1">
                ${renderStars(review.rating)}
              </div>
              <p class="text-gray-300 text-sm">${escapeHTML(review.comment || '')}</p>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- ถาม-ตอบล่าสุด -->
      <div class="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-bold text-white flex items-center gap-2">
            <i class="bi bi-chat-dots text-blue-400"></i> ถาม-ตอบ
          </h2>
          <a href="#/discussion/${course.id}" class="text-brand text-sm hover:underline">ดูทั้งหมด</a>
        </div>
        <div class="text-center py-4">
          <p class="text-gray-500 text-sm">เข้าไปตั้งคำถามเกี่ยวกับคอร์สได้ในหน้านี้</p>
          <a href="#/discussion/${course.id}" class="btn-outline-brand text-sm py-2 px-4 inline-flex mt-3">เปิดห้องสนทนา</a>
        </div>
      </div>
    </div>`;

  // ปุ่มสมัครเรียน
  document.getElementById('enroll-btn')?.addEventListener('click', async () => {
    const supabase = await getSupabaseClient();
    try {
      await supabase.rpc('enroll_course', {
        p_user_id: currentUser.id,
        p_course_id: courseId
      });
      window.location.hash = `#/learn/${courseId}`;
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert('เกิดข้อผิดพลาด: ' + err.message);
    }
  });

  // ปุ่มแก้ไขรีวิว
  document.getElementById('edit-review-btn')?.addEventListener('click', () => {
    document.getElementById('edit-review-form-container').classList.remove('hidden');
    document.getElementById('edit-review-form-container').scrollIntoView({ behavior: 'smooth' });
  });

  // Star rating (ฟอร์มใหม่)
  document.querySelectorAll('.star-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const star = parseInt(btn.dataset.star);
      document.getElementById('selected-rating').value = star;
      document.querySelectorAll('.star-btn').forEach(b => {
        const bStar = parseInt(b.dataset.star);
        b.querySelector('i').className = bStar <= star ? 'bi bi-star-fill text-yellow-400' : 'bi bi-star text-gray-600';
      });
    });
  });

  // Star rating (ฟอร์มแก้ไข)
  document.querySelectorAll('.edit-star-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const star = parseInt(btn.dataset.star);
      document.getElementById('edit-selected-rating').value = star;
      document.querySelectorAll('.edit-star-btn').forEach(b => {
        const bStar = parseInt(b.dataset.star);
        b.querySelector('i').className = bStar <= star ? 'bi bi-star-fill text-yellow-400' : 'bi bi-star text-gray-600';
      });
    });
  });

  // Submit review ใหม่
  document.getElementById('review-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const rating = parseInt(document.getElementById('selected-rating').value);
    if (!rating) {
      alert('กรุณาให้คะแนนดาว');
      return;
    }
    const comment = document.getElementById('review-comment').value.trim();

    const supabase = await getSupabaseClient();
    const { error } = await supabase.rpc('add_review', {
      p_course_id: courseId,
      p_user_id: currentUser.id,
      p_rating: rating,
      p_comment: comment || null
    });

    if (error) {
      alert('เกิดข้อผิดพลาด: ' + error.message);
      return;
    }

    alert('ขอบคุณสำหรับรีวิว!');
    window.location.reload();
  });

  // Submit แก้ไขรีวิว
  document.getElementById('edit-review-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const rating = parseInt(document.getElementById('edit-selected-rating').value);
    if (!rating) {
      alert('กรุณาให้คะแนนดาว');
      return;
    }
    const comment = document.getElementById('edit-review-comment').value.trim();

    const supabase = await getSupabaseClient();
    const { error } = await supabase.rpc('add_review', {
      p_course_id: courseId,
      p_user_id: currentUser.id,
      p_rating: rating,
      p_comment: comment || null
    });

    if (error) {
      alert('เกิดข้อผิดพลาด: ' + error.message);
      return;
    }

    alert('แก้ไขรีวิวเรียบร้อย!');
    window.location.reload();
  });
}

function renderStars(rating) {
  const fullStars = Math.floor(rating);
  const halfStar = rating - fullStars >= 0.5;
  const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
  return `
    ${'<i class="bi bi-star-fill text-yellow-400"></i>'.repeat(fullStars)}
    ${halfStar ? '<i class="bi bi-star-half text-yellow-400"></i>' : ''}
    ${'<i class="bi bi-star text-gray-600"></i>'.repeat(emptyStars)}
  `;
}

function escapeHTML(str) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}