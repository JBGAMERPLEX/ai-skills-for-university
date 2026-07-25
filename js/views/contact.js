export function render(container) {
  container.innerHTML = `
    <div class="fade-up max-w-xl mx-auto py-10">
      <h2 class="text-3xl font-bold text-white mb-8">ติดต่อเรา</h2>
      <div class="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4 text-gray-300">
        <p>หากคุณมีข้อสงสัย ข้อเสนอแนะ หรือต้องการความช่วยเหลือ สามารถติดต่อเราได้ทางช่องทางต่อไปนี้:</p>
        <div class="space-y-3">
          <div class="flex items-center gap-3">
            <i class="bi bi-envelope-fill text-brand text-xl"></i>
            <span>Email: support@aiskills.in.th</span>
          </div>
          <div class="flex items-center gap-3">
            <i class="bi bi-facebook text-brand text-xl"></i>
            <span>Facebook: fb.com/aiskillsforuniversity</span>
          </div>
          <div class="flex items-center gap-3">
            <i class="bi bi-discord text-brand text-xl"></i>
            <span>Discord: discord.gg/aiskills</span>
          </div>
        </div>
        <p class="text-sm text-gray-500 mt-4">เวลาทำการ: จันทร์ - ศุกร์ 09:00 - 17:00 น.</p>
      </div>
    </div>`;
}