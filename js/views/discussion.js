import { getSession } from '../services/auth.js';
import { getSupabaseClient } from '../services/supabase.js';

let currentUser = null;
let courseId = null;

export async function render(container, params) {
  currentUser = await getSession();
  if (!currentUser) {
    location.hash = '#/login';
    return;
  }

  courseId = params.id;
  const supabase = await getSupabaseClient();

  // ดึงชื่อคอร์ส
  const { data: course } = await supabase
    .from('courses')
    .select('title')
    .eq('id', courseId)
    .single();

  container.innerHTML = `
    <div class="fade-up max-w-4xl mx-auto">
      <nav class="flex items-center space-x-2 text-sm text-gray-400 mb-4">
        <a href="#/course/${courseId}" class="hover:text-white transition">กลับไปหน้าคอร์ส</a>
        <i class="bi bi-chevron-right text-xs"></i>
        <span class="text-white">ถาม-ตอบ</span>
      </nav>

      <h2 class="text-2xl md:text-3xl font-bold text-white mb-6">${escapeHTML(course?.title || 'คอร์ส')} – ถาม-ตอบ</h2>

      <!-- ฟอร์มโพสต์คำถาม -->
      <div class="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-8">
        <h3 class="text-white font-semibold mb-3">ตั้งคำถามใหม่</h3>
        <form id="discussion-form" class="space-y-3">
          <textarea id="discussion-content" rows="3" class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-brand" placeholder="ถามเกี่ยวกับเนื้อหาในคอร์สนี้..."></textarea>
          <div class="flex justify-end">
            <button type="submit" class="btn-brand text-sm py-2 px-4">โพสต์คำถาม</button>
          </div>
        </form>
      </div>

      <!-- รายการคำถาม -->
      <div id="discussion-list" class="space-y-4">
        <div class="text-center py-6"><span class="loading loading-spinner loading-lg"></span></div>
      </div>
    </div>`;

  document.getElementById('discussion-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const content = document.getElementById('discussion-content').value.trim();
    if (!content) return;

    const supabase = await getSupabaseClient();
    const { error } = await supabase.rpc('add_discussion', {
      p_course_id: courseId,
      p_user_id: currentUser.id,
      p_content: content
    });

    if (error) {
      alert('เกิดข้อผิดพลาด: ' + error.message);
      return;
    }

    document.getElementById('discussion-content').value = '';
    await loadDiscussions();
  });

  await loadDiscussions();
}

async function loadDiscussions() {
  const supabase = await getSupabaseClient();
  const list = document.getElementById('discussion-list');

  const { data: discussions, error } = await supabase.rpc('get_course_discussions', {
    p_course_id: courseId
  });

  if (error) {
    list.innerHTML = '<p class="text-red-400 text-center py-6">เกิดข้อผิดพลาด</p>';
    return;
  }

  if (!discussions?.length) {
    list.innerHTML = '<p class="text-gray-500 text-center py-6">ยังไม่มีคำถาม</p>';
    return;
  }

  list.innerHTML = discussions.map(d => `
    <div class="bg-gray-900 border border-gray-800 rounded-xl p-4">
      <div class="flex items-start gap-3">
        ${d.user_avatar ? `<img src="${escapeHTML(d.user_avatar)}" class="w-8 h-8 rounded-full object-cover mt-1" />` : '<i class="bi bi-person-circle text-2xl text-gray-400 mt-1"></i>'}
        <div class="flex-1">
          <div class="flex items-center gap-2 mb-1">
            <span class="text-white text-sm font-medium">${escapeHTML(d.user_name || 'ผู้ไม่ประสงค์ออกนาม')}</span>
            <span class="text-xs text-gray-500">${formatDate(d.created_at)}</span>
          </div>
          <p class="text-gray-300">${escapeHTML(d.content)}</p>
          <button class="view-replies-btn text-brand text-sm mt-3" data-id="${d.id}">
            <i class="bi bi-chat-dots"></i> ดูคำตอบ (${d.reply_count})
          </button>
          <div id="replies-${d.id}" class="hidden mt-3 space-y-2"></div>
        </div>
      </div>
    </div>
  `).join('');

  // ปุ่มดูคำตอบ
  list.querySelectorAll('.view-replies-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const replyContainer = document.getElementById(`replies-${btn.dataset.id}`);
      replyContainer.classList.toggle('hidden');
      if (!replyContainer.classList.contains('hidden')) {
        loadReplies(btn.dataset.id, replyContainer);
      }
    });
  });
}

async function loadReplies(discussionId, container) {
  const supabase = await getSupabaseClient();

  const { data: replies, error } = await supabase.rpc('get_discussion_replies', {
    p_discussion_id: discussionId
  });

  if (error) {
    container.innerHTML = '<p class="text-red-400 text-sm">เกิดข้อผิดพลาด</p>';
    return;
  }

  if (!replies?.length) {
    container.innerHTML = '<p class="text-gray-500 text-sm">ยังไม่มีคำตอบ</p>';
  } else {
    container.innerHTML = replies.map(r => `
      <div class="bg-gray-800 rounded-lg p-3 flex items-start gap-2">
        ${r.user_avatar ? `<img src="${escapeHTML(r.user_avatar)}" class="w-6 h-6 rounded-full object-cover mt-0.5" />` : ''}
        <div class="flex-1">
          <div class="flex items-center gap-2">
            <span class="text-white text-xs font-medium">${escapeHTML(r.user_name || 'ผู้ไม่ประสงค์ออกนาม')}</span>
          </div>
          <p class="text-gray-300 text-sm mt-1">${escapeHTML(r.content)}</p>
        </div>
        <button class="like-btn text-xs ${''}" data-id="${r.id}">
          <i class="bi bi-heart"></i> <span>${r.like_count}</span>
        </button>
      </div>
    `).join('');
  }

  // เพิ่มฟอร์มตอบ
  const replyForm = document.createElement('div');
  replyForm.className = 'mt-2';
  replyForm.innerHTML = `
    <form class="reply-form flex gap-2" data-discussion-id="${discussionId}">
      <input type="text" class="reply-input flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-brand" placeholder="ตอบคำถาม...">
      <button type="submit" class="btn-brand text-sm py-2 px-3">ตอบ</button>
    </form>`;
  container.appendChild(replyForm);

  // Submit reply
  replyForm.querySelector('.reply-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const content = replyForm.querySelector('.reply-input').value.trim();
    if (!content) return;

    const supabase = await getSupabaseClient();
    await supabase.rpc('add_reply', {
      p_discussion_id: discussionId,
      p_user_id: currentUser.id,
      p_content: content
    });

    loadReplies(discussionId, container);
  });

  // Like button
  container.querySelectorAll('.like-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const supabase = await getSupabaseClient();
      await supabase.rpc('toggle_like_reply', {
        p_reply_id: btn.dataset.id,
        p_user_id: currentUser.id
      });
      loadReplies(discussionId, container);
    });
  });
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('th-TH', {
    year: 'numeric', month: 'short', day: 'numeric'
  });
}

function escapeHTML(str) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}