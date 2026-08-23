// js/views/quiz.js
import { getSession } from '../services/auth.js';
import { getSupabaseClient } from '../services/supabase.js';
import { navigate } from '../utils/router.js';

let currentUser = null;
let courseId = null;
let questions = [];
let currentQuestion = 0;
let answers = [];

export async function render(container, params) {
  currentUser = await getSession();
  if (!currentUser) {
    navigate('/login');
    return;
  }

  courseId = params.id;
  const supabase = await getSupabaseClient();

  // เช็กว่าเรียนจบหรือยัง
  const { data: completed } = await supabase.rpc('has_completed_course', {
    p_user_id: currentUser.id,
    p_course_id: courseId
  });

  if (!completed) {
    container.innerHTML = `
      <div class="text-center py-20">
        <i class="bi bi-lock text-6xl text-gray-600"></i>
        <h2 class="text-2xl font-bold mt-4 text-white">ต้องเรียนจบก่อนทำ Quiz</h2>
        <p class="text-gray-400 mt-2">เรียนบทเรียนทั้งหมดให้ครบก่อน แล้วค่อยกลับมาทำแบบทดสอบ</p>
        <a href="#/learn/${courseId}" class="btn-brand mt-4 inline-flex">ไปเรียนต่อ</a>
      </div>`;
    return;
  }

  // ดึงคำถาม
  const { data: quizQuestions, error } = await supabase.rpc('get_quiz_questions', {
    p_course_id: courseId
  });

  if (error || !quizQuestions?.length) {
    container.innerHTML = `
      <div class="text-center py-20">
        <i class="bi bi-file-earmark-x text-6xl text-gray-600"></i>
        <h2 class="text-2xl font-bold mt-4 text-white">ยังไม่มี Quiz ในคอร์สนี้</h2>
      </div>`;
    return;
  }

  questions = quizQuestions;
  currentQuestion = 0;
  answers = new Array(questions.length).fill(null);

  renderQuestion(container);
}

function renderQuestion(container) {
  const q = questions[currentQuestion];

  container.innerHTML = `
    <div class="fade-up max-w-2xl mx-auto">
      <!-- Progress -->
      <div class="flex items-center gap-3 mb-6">
        <span class="text-sm text-gray-400">ข้อ ${currentQuestion + 1} / ${questions.length}</span>
        <div class="flex-1 h-2 bg-gray-800 rounded-full">
          <div class="h-2 bg-brand rounded-full" style="width: ${((currentQuestion + 1) / questions.length) * 100}%"></div>
        </div>
      </div>

      <div class="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h3 class="text-xl font-bold text-white mb-6">${escapeHTML(q.question_text)}</h3>
        
        <div class="space-y-3">
          ${['A', 'B', 'C', 'D'].map(opt => `
            <button class="quiz-option w-full text-left p-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition ${answers[currentQuestion] === opt ? 'bg-brand/20 border border-brand' : 'border border-transparent'}"
                    data-option="${opt}">
              <span class="font-semibold text-brand mr-2">${opt}.</span>
              <span class="text-white">${escapeHTML(q['option_' + opt.toLowerCase()])}</span>
            </button>
          `).join('')}
        </div>
      </div>

      <div class="flex justify-between mt-6">
        <button id="prev-question-btn" class="btn-outline-brand text-sm py-2 px-4 ${currentQuestion === 0 ? 'opacity-50 cursor-not-allowed' : ''}" ${currentQuestion === 0 ? 'disabled' : ''}>
          <i class="bi bi-arrow-left"></i> ก่อนหน้า
        </button>
        ${currentQuestion < questions.length - 1 ? `
          <button id="next-question-btn" class="btn-brand text-sm py-2 px-4">ถัดไป</button>
        ` : `
          <button id="submit-quiz-btn" class="btn-brand text-sm py-2 px-4">ส่งคำตอบ</button>
        `}
      </div>
    </div>`;

  // เลือกคำตอบ
  document.querySelectorAll('.quiz-option').forEach(btn => {
    btn.addEventListener('click', () => {
      const opt = btn.dataset.option;
      answers[currentQuestion] = opt;
      document.querySelectorAll('.quiz-option').forEach(b => {
        b.classList.remove('bg-brand/20', 'border-brand');
      });
      btn.classList.add('bg-brand/20', 'border-brand');
    });
  });

  // ปุ่มก่อนหน้า
  document.getElementById('prev-question-btn')?.addEventListener('click', () => {
    if (currentQuestion > 0) {
      currentQuestion--;
      renderQuestion(container);
    }
  });

  // ปุ่มถัดไป
  document.getElementById('next-question-btn')?.addEventListener('click', () => {
    if (currentQuestion < questions.length - 1) {
      currentQuestion++;
      renderQuestion(container);
    }
  });

  // ส่งคำตอบ
  document.getElementById('submit-quiz-btn')?.addEventListener('click', () => submitQuiz(container));
}

async function submitQuiz(container) {
  // ตรวจสอบว่าตอบครบหรือยัง
  if (answers.some(a => a === null)) {
    alert('กรุณาตอบทุกข้อก่อนส่ง');
    return;
  }

  const supabase = await getSupabaseClient();
  let score = 0;
  questions.forEach((q, idx) => {
    if (answers[idx] === q.correct_answer) score++;
  });

  const passed = (score / questions.length) >= 0.6;

  await supabase.rpc('save_quiz_result', {
    p_user_id: currentUser.id,
    p_course_id: courseId,
    p_score: score,
    p_total: questions.length,
    p_passed: passed
  });

  container.innerHTML = `
    <div class="fade-up max-w-2xl mx-auto py-10 text-center">
      <i class="bi ${passed ? 'bi-trophy text-yellow-400' : 'bi-x-circle text-red-400'} text-6xl"></i>
      <h2 class="text-3xl font-bold text-white mt-4">${passed ? 'ผ่าน! 🎉' : 'ไม่ผ่าน'}</h2>
      <p class="text-gray-400 mt-2">คุณได้คะแนน ${score} จาก ${questions.length} ข้อ</p>
      <p class="text-gray-500 text-sm mt-1">${passed ? 'ยินดีด้วย! คุณผ่านการทดสอบแล้ว' : 'ลองทบทวนเนื้อหาแล้วกลับมาทำใหม่นะ'}</p>
      <div class="flex gap-3 justify-center mt-6">
        <a href="#/learn/${courseId}" class="btn-outline-brand">กลับไปเรียน</a>
        <a href="#/my-courses" class="btn-brand">คอร์สของฉัน</a>
      </div>
    </div>`;
}

function escapeHTML(str) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}