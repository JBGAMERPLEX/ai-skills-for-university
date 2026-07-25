export function render(container) {
  container.innerHTML = `
    <div class="fade-up max-w-3xl mx-auto py-10">
      <h2 class="text-3xl font-bold text-white mb-8">คำถามที่พบบ่อย</h2>
      <div class="space-y-4">
        <details class="bg-gray-900 border border-gray-800 rounded-xl p-4 group">
          <summary class="font-semibold text-white cursor-pointer list-none flex justify-between items-center">
            วิธีการสมัครสมาชิก?
            <i class="bi bi-chevron-down transition-transform group-open:rotate-180"></i>
          </summary>
          <p class="text-gray-400 mt-3">คลิกที่ปุ่ม "สมัครสมาชิก" ที่มุมขวาบนของหน้าเว็บ กรอกข้อมูลให้ครบถ้วน จากนั้นกดยืนยัน ระบบจะสร้างบัญชีให้คุณทันที</p>
        </details>
        <details class="bg-gray-900 border border-gray-800 rounded-xl p-4 group">
          <summary class="font-semibold text-white cursor-pointer list-none flex justify-between items-center">
            สามารถเปลี่ยนบทบาทผู้ใช้ได้หรือไม่?
            <i class="bi bi-chevron-down transition-transform group-open:rotate-180"></i>
          </summary>
          <p class="text-gray-400 mt-3">ไม่สามารถเปลี่ยนบทบาทได้ด้วยตัวเอง หากต้องการเปลี่ยน กรุณาติดต่อผู้ดูแลระบบผ่านหน้า "ติดต่อ"</p>
        </details>
        <details class="bg-gray-900 border border-gray-800 rounded-xl p-4 group">
          <summary class="font-semibold text-white cursor-pointer list-none flex justify-between items-center">
            คอร์สเรียนฟรีหรือไม่?
            <i class="bi bi-chevron-down transition-transform group-open:rotate-180"></i>
          </summary>
          <p class="text-gray-400 mt-3">ทุกคอร์สเรียนบนแพลตฟอร์มของเราเปิดให้เข้าเรียนฟรีทั้งหมด</p>
        </details>
        <details class="bg-gray-900 border border-gray-800 rounded-xl p-4 group">
          <summary class="font-semibold text-white cursor-pointer list-none flex justify-between items-center">
            ฉันสามารถเป็นผู้สร้างคอร์สได้อย่างไร?
            <i class="bi bi-chevron-down transition-transform group-open:rotate-180"></i>
          </summary>
          <p class="text-gray-400 mt-3">เมื่อสมัครสมาชิกคุณสามารถเลือกบทบาท "ผู้สร้างคอร์ส" ได้ทันที จากนั้นคุณจะสามารถสร้างและจัดการคอร์สของตัวเองได้</p>
        </details>
        <details class="bg-gray-900 border border-gray-800 rounded-xl p-4 group">
          <summary class="font-semibold text-white cursor-pointer list-none flex justify-between items-center">
            มีการเก็บข้อมูลส่วนตัวอะไรบ้าง?
            <i class="bi bi-chevron-down transition-transform group-open:rotate-180"></i>
          </summary>
          <p class="text-gray-400 mt-3">เราจัดเก็บเฉพาะชื่อ อีเมล และรูปโปรไฟล์ (ถ้ามี) เพื่อใช้ในการแสดงผลบนแพลตฟอร์ม อ่านเพิ่มเติมได้ที่ <a href="#/privacy" class="text-brand hover:underline">นโยบายความเป็นส่วนตัว</a></p>
        </details>
      </div>
    </div>`;
}