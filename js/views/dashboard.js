import { getSession } from '../services/auth.js';
import { getSupabaseClient } from '../services/supabase.js';
import { navigate } from '../utils/router.js';

let currentUser = null;

export async function render(container) {
  currentUser = await getSession();
  if (!currentUser) {
    navigate('/login');
    return;
  }

  container.innerHTML = `
    <div class="fade-up max-w-4xl mx-auto">
      <h2 class="text-3xl font-bold text-white mb-8">Dashboard ผู้เรียน</h2>
      <div id="stats-container" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div class="col-span-full flex justify-center py-10">
          <div class="animate-spin h-8 w-8 border-4 border-brand border-t-transparent rounded-full"></div>
        </div>
      </div>
    </div>`;

  await loadStats();
}

async function loadStats() {
  const supabase = await getSupabaseClient();
  const container = document.getElementById('stats-container');

  try {
    const { data, error } = await supabase.rpc('get_learner_stats', {
      p_user_id: currentUser.id
    });

    if (error) throw error;
    if (!data || data.length === 0) {
      container.innerHTML = '<p class="text-gray-400 text-center py-10">ไม่พบข้อมูล</p>';
      return;
    }

    const stats = data[0];
    const totalMinutes = stats.total_minutes || 0;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    const cards = [
      {
        icon: 'bi-book',
        label: 'คอร์สที่สมัครเรียน',
        value: stats.enrolled_courses || 0,
        color: 'text-blue-400'
      },
      {
        icon: 'bi-arrow-repeat',
        label: 'กำลังเรียน',
        value: stats.in_progress_courses || 0,
        color: 'text-yellow-400'
      },
      {
        icon: 'bi-check-circle',
        label: 'เรียนจบแล้ว',
        value: stats.completed_courses || 0,
        color: 'text-green-400'
      },
      {
        icon: 'bi-clock',
        label: 'เวลาเรียนทั้งหมด',
        value: `${hours} ชม. ${minutes} นาที`,
        color: 'text-brand'
      },
      {
        icon: 'bi-star',
        label: 'รีวิวที่เขียน',
        value: stats.total_reviews || 0,
        color: 'text-yellow-400'
      }
    ];

    container.innerHTML = cards.map(card => `
      <div class="bg-gray-900 border border-gray-800 rounded-xl p-5 text-center">
        <i class="bi ${card.icon} ${card.color} text-3xl"></i>
        <p class="text-3xl font-bold text-white mt-2">${card.value}</p>
        <p class="text-sm text-gray-400 mt-1">${card.label}</p>
      </div>
    `).join('');

  } catch (err) {
    console.error('Load stats error:', err);
    container.innerHTML = '<p class="text-red-400 text-center py-10">เกิดข้อผิดพลาด</p>';
  }
}