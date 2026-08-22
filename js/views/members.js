// js/views/members.js
import { getSupabaseClient } from '../services/supabase.js';

export async function render(container) {
  container.innerHTML = `
    <div class="fade-up max-w-5xl mx-auto">
      <h2 class="text-3xl font-bold text-white mb-8">สมาชิกทั้งหมด</h2>
      <div id="members-container">
        <div class="text-center py-10">
          <div class="animate-spin h-8 w-8 border-4 border-brand border-t-transparent rounded-full mx-auto"></div>
        </div>
      </div>
    </div>`;

  await loadMembers();
}

async function loadMembers() {
  const supabase = await getSupabaseClient();
  const container = document.getElementById('members-container');

  try {
    const { data: users, error } = await supabase.rpc('get_members_with_stats');

    if (error) throw error;
    if (!users || users.length === 0) {
      container.innerHTML = `<p class="text-center text-gray-400 py-10">ยังไม่มีสมาชิกในระบบ</p>`;
      return;
    }

    // Group by role
    const grouped = {
      content_manager: [],
      content_creator: [],
      learner: []
    };

    users.forEach(user => {
      if (grouped[user.role]) {
        grouped[user.role].push(user);
      } else {
        grouped.learner.push(user);
      }
    });

    const roleSections = [
      { key: 'content_manager', title: 'ผู้จัดการเนื้อหา', icon: 'bi-shield-check', color: 'text-blue-400' },
      { key: 'content_creator', title: 'ผู้สร้างคอร์ส', icon: 'bi-pencil-square', color: 'text-green-400' },
      { key: 'learner', title: 'ผู้เรียน', icon: 'bi-mortarboard', color: 'text-yellow-400' }
    ];

    let html = '';

    roleSections.forEach(section => {
      const members = grouped[section.key];
      if (members.length === 0) return;

      html += `
        <div class="mb-8">
          <h3 class="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <i class="bi ${section.icon} ${section.color}"></i> ${section.title}
            <span class="text-sm text-gray-400 font-normal">(${members.length})</span>
          </h3>
          <!-- ✅ ใช้ grid แนวตั้ง หรือ grid แนวนอน ตามต้องการ -->
          <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            ${members.map(user => {
              const initials = user.full_name
                ? user.full_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
                : 'U';
              const avatarUrl = user.avatar_url || `https://ui-avatars.com/api/?name=${initials}&background=f9754a&color=fff&size=100`;

              // Stats based on role
              let statsText = '';
              if (user.role === 'learner') {
                statsText = `✅ ${user.completed_courses} คอร์ส`;
              } else if (user.role === 'content_creator') {
                statsText = `📖 ${user.published_courses} คอร์ส`;
              } else if (user.role === 'content_manager') {
                statsText = `✔️ ${user.reviewed_published_courses} คอร์ส`;
              }

              return `
                <div class="bg-gray-900 border border-gray-800 rounded-xl p-3 text-center hover:border-gray-700 transition">
                  <img src="${escapeHTML(avatarUrl)}" alt="${escapeHTML(user.full_name || 'User')}" 
                       class="w-14 h-14 rounded-full object-cover mx-auto mb-2 border border-gray-700" />
                  <p class="text-white text-xs font-medium line-clamp-1">${escapeHTML(user.full_name || 'ไม่ระบุชื่อ')}</p>
                  <p class="text-gray-400 text-xs mt-0.5">${roleLabel(user.role)}</p>
                  <p class="text-gray-500 text-xs mt-1">${statsText}</p>
                </div>`;
            }).join('')}
          </div>
        </div>`;
    });

    container.innerHTML = html || '<p class="text-center text-gray-400 py-10">ไม่มีสมาชิกในระบบ</p>';

  } catch (err) {
    console.error('Failed to load members:', err);
    container.innerHTML = '<p class="text-center text-red-400 py-10">เกิดข้อผิดพลาดในการโหลดสมาชิก</p>';
  }
}

function escapeHTML(str) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

function roleLabel(role) {
  const map = {
    learner: 'ผู้เรียน',
    content_creator: 'ผู้สร้างคอร์ส',
    content_manager: 'ผู้จัดการเนื้อหา'
  };
  return map[role] || role;
}