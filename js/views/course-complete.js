// js/views/course-complete.js
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

  const { data: course } = await supabase
    .from('courses')
    .select('title')
    .eq('id', courseId)
    .single();

  if (!course) {
    container.innerHTML = '<p class="text-center text-red-400 py-20">ไม่พบคอร์สนี้</p>';
    return;
  }

  // เช็กว่ารีวิวไปแล้วหรือยัง
  const { data: myReview } = await supabase.rpc('get_user_review', {
    p_user_id: currentUser.id,
    p_course_id: courseId
  });

  const hasReviewed = myReview && myReview.length > 0;

  container.innerHTML = `
    <div class="fade-up max-w-2xl mx-auto py-10 text-center">
      <i class="bi bi-trophy text-yellow-400 text-7xl"></i>
      <h2 class="text-3xl font-bold text-white mt-6">ยินดีด้วย! คุณเรียนจบคอร์สแล้ว</h2>
      <p class="text-gray-400 mt-2">คุณได้เรียน "${escapeHTML(course.title)}" ครบทุกบทเรียนแล้ว</p>

      <div class="flex gap-3 justify-center mt-8">
        <a href="#/learn/${courseId}" class="btn-outline-brand">
          <i class="bi bi-book"></i> กลับไปทบทวน
        </a>
        <a href="#/certificate/${courseId}" class="btn-outline-brand !border-yellow-500 !text-yellow-500 hover:!bg-yellow-500/10">
          <i class="bi bi-award"></i> รับใบประกาศ
        </a>
        <a href="#/quiz/${courseId}" class="btn-outline-brand !border-blue-500 !text-blue-500 hover:!bg-blue-500/10">
          <i class="bi bi-pencil-square"></i> ทำ Quiz
        </a>
      </div>

      ${!hasReviewed ? `
        <div class="mt-10 bg-gray-900 border border-gray-800 rounded-xl p-6 text-left">
          <h3 class="text-xl font-bold text-white mb-4">ให้คะแนนและรีวิวคอร์สนี้</h3>
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
      ` : `
        <div class="mt-8 bg-gray-900 border border-gray-800 rounded-xl p-6 text-center">
          <i class="bi bi-check-circle text-green-400 text-3xl"></i>
          <p class="text-white mt-2">คุณได้รีวิวคอร์สนี้แล้ว</p>
        </div>
      `}
    </div>`;

  if (!hasReviewed) {
    // Star rating
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

    // Submit review
    document.getElementById('review-form').addEventListener('submit', async (e) => {
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
  }
}

function escapeHTML(str) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}