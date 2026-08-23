import { getSession } from '../services/auth.js';
import { getSupabaseClient } from '../services/supabase.js';
import { navigate } from '../utils/router.js';

let currentUser = null;
let courseId = null;

export async function render(container, params) {
  currentUser = await getSession();
  if (!currentUser || currentUser.role !== 'content_creator') {
    container.innerHTML = '<div class="text-center py-20">ไม่มีสิทธิ์เข้าถึง</div>';
    return;
  }

  courseId = params.id;
  const supabase = await getSupabaseClient();

  container.innerHTML = `
    <div class="fade-up max-w-4xl mx-auto">
      <div class="flex items-center gap-3 mb-6">
        <button id="back-btn" class="p-2 text-gray-400 hover:text-white"><i class="bi bi-arrow-left text-2xl"></i></button>
        <h2 class="text-2xl font-bold text-white">จัดการ Quiz</h2>
      </div>

      <!-- ฟอร์มเพิ่มคำถาม -->
      <div class="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-8">
        <h3 class="text-white font-semibold mb-4">เพิ่มคำถามใหม่</h3>
        <form id="quiz-form" class="space-y-3">
          <div>
            <label class="block text-sm text-gray-400 mb-1">คำถาม</label>
            <textarea id="question-text" rows="2" class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-brand" required></textarea>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label class="block text-sm text-gray-400 mb-1">ตัวเลือก A</label>
              <input type="text" id="option-a" class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-brand" required>
            </div>
            <div>
              <label class="block text-sm text-gray-400 mb-1">ตัวเลือก B</label>
              <input type="text" id="option-b" class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-brand" required>
            </div>
            <div>
              <label class="block text-sm text-gray-400 mb-1">ตัวเลือก C</label>
              <input type="text" id="option-c" class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-brand" required>
            </div>
            <div>
              <label class="block text-sm text-gray-400 mb-1">ตัวเลือก D</label>
              <input type="text" id="option-d" class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-brand" required>
            </div>
          </div>
          <div>
            <label class="block text-sm text-gray-400 mb-1">คำตอบที่ถูก</label>
            <select id="correct-answer" class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-brand">
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
              <option value="D">D</option>
            </select>
          </div>
          <div class="flex justify-end">
            <button type="submit" class="btn-brand text-sm py-2 px-4">เพิ่มคำถาม</button>
          </div>
        </form>
      </div>

      <!-- รายการคำถาม -->
      <div id="quiz-list" class="space-y-3"></div>
    </div>`;

  document.getElementById('back-btn').addEventListener('click', () => navigate(`/creator/edit/${courseId}`));

  document.getElementById('quiz-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const supabase = await getSupabaseClient();
    const { error } = await supabase.rpc('add_quiz_question', {
      p_course_id: courseId,
      p_question_text: document.getElementById('question-text').value.trim(),
      p_option_a: document.getElementById('option-a').value.trim(),
      p_option_b: document.getElementById('option-b').value.trim(),
      p_option_c: document.getElementById('option-c').value.trim(),
      p_option_d: document.getElementById('option-d').value.trim(),
      p_correct_answer: document.getElementById('correct-answer').value
    });

    if (error) {
      alert('เกิดข้อผิดพลาด: ' + error.message);
      return;
    }

    document.getElementById('quiz-form').reset();
    await loadQuestions();
  });

  await loadQuestions();
}

async function loadQuestions() {
  const supabase = await getSupabaseClient();
  const list = document.getElementById('quiz-list');

  const { data: questions, error } = await supabase.rpc('get_quiz_questions', {
    p_course_id: courseId
  });

  if (error) {
    list.innerHTML = '<p class="text-red-400 text-center">เกิดข้อผิดพลาด</p>';
    return;
  }

  if (!questions?.length) {
    list.innerHTML = '<p class="text-gray-500 text-center">ยังไม่มีคำถาม</p>';
    return;
  }

  list.innerHTML = questions.map(q => `
    <div class="bg-gray-900 border border-gray-800 rounded-xl p-4">
      <div class="flex justify-between items-start">
        <div>
          <p class="text-white font-medium">${escapeHTML(q.question_text)}</p>
          <div class="grid grid-cols-2 gap-2 mt-2 text-sm">
            <p class="text-gray-400 ${q.correct_answer === 'A' ? 'text-green-400 font-semibold' : ''}">A: ${escapeHTML(q.option_a)}</p>
            <p class="text-gray-400 ${q.correct_answer === 'B' ? 'text-green-400 font-semibold' : ''}">B: ${escapeHTML(q.option_b)}</p>
            <p class="text-gray-400 ${q.correct_answer === 'C' ? 'text-green-400 font-semibold' : ''}">C: ${escapeHTML(q.option_c)}</p>
            <p class="text-gray-400 ${q.correct_answer === 'D' ? 'text-green-400 font-semibold' : ''}">D: ${escapeHTML(q.option_d)}</p>
          </div>
        </div>
        <button class="delete-question-btn text-red-400 hover:text-red-300 p-2" data-id="${q.id}">
          <i class="bi bi-trash"></i>
        </button>
      </div>
    </div>
  `).join('');

  // ลบคำถาม
  document.querySelectorAll('.delete-question-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (confirm('ลบคำถามนี้?')) {
        const supabase = await getSupabaseClient();
        await supabase.rpc('delete_quiz_question', { p_question_id: btn.dataset.id });
        await loadQuestions();
      }
    });
  });
}

function escapeHTML(str) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}