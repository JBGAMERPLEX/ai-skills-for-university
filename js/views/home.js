import { getSession } from '../services/auth.js';

export async function render(container) {
  const user = await getSession();
  // (ยังสามารถเพิ่มฟีเจอร์อื่นภายหลังได้ แต่ตอนนี้เอาออก)

  container.innerHTML = `
    <div class="fade-up">
      <div class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900 to-gray-950 border border-gray-800">
        <div class="absolute inset-0 opacity-10 pointer-events-none">
          <div class="absolute top-1/4 left-1/4 w-96 h-96 bg-brand rounded-full blur-3xl"></div>
          <div class="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500 rounded-full blur-3xl"></div>
        </div>
        <div class="relative z-10 text-center py-16 md:py-24 px-4 max-w-3xl mx-auto">
          <h1 class="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4">
            ยกระดับทักษะ <span class="text-brand">AI</span><br class="hidden sm:block"/>เพื่อมหาวิทยาลัยแห่งอนาคต
          </h1>
          <p class="text-lg text-gray-400 mb-8 max-w-xl mx-auto">
            เรียนรู้คอร์สคุณภาพจากผู้เชี่ยวชาญ เข้าถึงได้ทุกที่ทุกเวลา พร้อมระบบติดตามความก้าวหน้า
          </p>
          <div class="flex flex-wrap gap-4 justify-center">
            <a href="#/courses" class="btn-brand text-lg px-8 py-3 gap-2 inline-flex items-center">
              <i class="bi bi-play-circle-fill"></i> เริ่มเรียนเลย
            </a>
            <a href="#/courses" class="btn-outline-brand text-lg px-8 py-3 gap-2 inline-flex items-center">
              <i class="bi bi-collection-play"></i> ดูคอร์สทั้งหมด
            </a>
          </div>
        </div>
      </div>
    </div>`;
}