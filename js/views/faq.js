// js/views/faq.js
export function render(container) {
  container.innerHTML = `
    <div class="fade-up max-w-3xl mx-auto py-10">
      <h2 class="text-3xl font-bold text-white mb-8">คำถามที่พบบ่อย</h2>
      <div class="space-y-4">

        <details class="bg-gray-900 border border-gray-800 rounded-xl p-4 group">
          <summary class="font-semibold text-white cursor-pointer list-none flex justify-between items-center">
            1. ฉันจะสมัครสมาชิกได้อย่างไร?
            <i class="bi bi-chevron-down transition-transform group-open:rotate-180"></i>
          </summary>
          <p class="text-gray-400 mt-3">คลิกปุ่ม "สมัครสมาชิก" มุมขวาบนของหน้าเว็บ กรอกชื่อ อีเมล รหัสผ่าน และเลือกบทบาท จากนั้นกดสมัครสมาชิก ระบบจะพาคุณเข้าสู่หน้าเข้าสู่ระบบทันที</p>
        </details>

        <details class="bg-gray-900 border border-gray-800 rounded-xl p-4 group">
          <summary class="font-semibold text-white cursor-pointer list-none flex justify-between items-center">
            2. บทบาทผู้ใช้มีอะไรบ้าง?
            <i class="bi bi-chevron-down transition-transform group-open:rotate-180"></i>
          </summary>
          <p class="text-gray-400 mt-3">มี 3 บทบาทหลัก คือ <strong class="text-white">ผู้เรียน</strong> (เข้าเรียนคอร์สต่าง ๆ), <strong class="text-white">ผู้สร้างคอร์ส</strong> (สร้างและจัดการคอร์ส), และ <strong class="text-white">ผู้จัดการเนื้อหา</strong> (ตรวจสอบและอนุมัติคอร์สก่อนเผยแพร่)</p>
        </details>

        <details class="bg-gray-900 border border-gray-800 rounded-xl p-4 group">
          <summary class="font-semibold text-white cursor-pointer list-none flex justify-between items-center">
            3. ผู้เรียนสามารถทำอะไรได้บ้าง?
            <i class="bi bi-chevron-down transition-transform group-open:rotate-180"></i>
          </summary>
          <p class="text-gray-400 mt-3">ผู้เรียนสามารถเรียกดูคอร์สที่เผยแพร่แล้ว บุ๊กมาร์กคอร์สที่สนใจ เข้าเรียน ติดตามความคืบหน้า รับใบประกาศนียบัตรเมื่อเรียนจบ และจัดการโปรไฟล์ส่วนตัว</p>
        </details>

        <details class="bg-gray-900 border border-gray-800 rounded-xl p-4 group">
          <summary class="font-semibold text-white cursor-pointer list-none flex justify-between items-center">
            4. ผู้สร้างคอร์สต้องทำอย่างไรถึงจะเผยแพร่คอร์สได้?
            <i class="bi bi-chevron-down transition-transform group-open:rotate-180"></i>
          </summary>
          <p class="text-gray-400 mt-3">ผู้สร้างคอร์สสามารถสร้างคอร์สใหม่ เพิ่มหัวข้อและบทเรียน จากนั้นกด "ส่งตรวจ" เพื่อให้ผู้จัดการเนื้อหาตรวจสอบ เมื่อได้รับอนุมัติ คอร์สจะถูกเผยแพร่ให้ผู้เรียนเห็นทันที</p>
        </details>

        <details class="bg-gray-900 border border-gray-800 rounded-xl p-4 group">
          <summary class="font-semibold text-white cursor-pointer list-none flex justify-between items-center">
            5. ผู้จัดการเนื้อหามีหน้าที่อะไร?
            <i class="bi bi-chevron-down transition-transform group-open:rotate-180"></i>
          </summary>
          <p class="text-gray-400 mt-3">ผู้จัดการเนื้อหาจะตรวจสอบคอร์สที่ส่งเข้ามา โดยสามารถ "ขอแก้ไข" หรือ "อนุมัติและเผยแพร่" ได้ พร้อมทั้งให้ความคิดเห็นกลับไปยังผู้สร้างเพื่อปรับปรุงเนื้อหา</p>
        </details>

        <details class="bg-gray-900 border border-gray-800 rounded-xl p-4 group">
          <summary class="font-semibold text-white cursor-pointer list-none flex justify-between items-center">
            6. ฉันสามารถเปลี่ยนบทบาทของตัวเองได้หรือไม่?
            <i class="bi bi-chevron-down transition-transform group-open:rotate-180"></i>
          </summary>
          <p class="text-gray-400 mt-3">ไม่สามารถเปลี่ยนบทบาทด้วยตัวเองได้ เพื่อความปลอดภัย กรุณาติดต่อผู้ดูแลระบบผ่านหน้า "ติดต่อ" พร้อมแจ้งเหตุผลที่ต้องการเปลี่ยน</p>
        </details>

        <details class="bg-gray-900 border border-gray-800 rounded-xl p-4 group">
          <summary class="font-semibold text-white cursor-pointer list-none flex justify-between items-center">
            7. คอร์สทั้งหมดเรียนฟรีหรือไม่?
            <i class="bi bi-chevron-down transition-transform group-open:rotate-180"></i>
          </summary>
          <p class="text-gray-400 mt-3">ใช่ ทุกคอร์สบนแพลตฟอร์มเปิดให้เรียนฟรีทั้งหมด ไม่มีค่าใช้จ่ายแอบแฝง</p>
        </details>

        <details class="bg-gray-900 border border-gray-800 rounded-xl p-4 group">
          <summary class="font-semibold text-white cursor-pointer list-none flex justify-between items-center">
            8. ทำไมวิดีโอที่ฉันใส่ในบทเรียนถึงเล่นไม่ได้?
            <i class="bi bi-chevron-down transition-transform group-open:rotate-180"></i>
          </summary>
          <p class="text-gray-400 mt-3">วิดีโอต้องเป็น URL แบบฝังได้ (embed) เช่น <code class="text-white">youtube.com/embed/...</code> หรือ Google Drive preview โดยระบบจะแปลง URL ให้อัตโนมัติเมื่อคุณวางลิงก์จาก YouTube, Vimeo, หรือ Drive</p>
        </details>

        <details class="bg-gray-900 border border-gray-800 rounded-xl p-4 group">
          <summary class="font-semibold text-white cursor-pointer list-none flex justify-between items-center">
            9. ฉันจะอัปโหลดรูปภาพเข้าเว็บได้อย่างไร?
            <i class="bi bi-chevron-down transition-transform group-open:rotate-180"></i>
          </summary>
          <p class="text-gray-400 mt-3">ในหน้าแก้ไขคอร์สหรือโปรไฟล์ มีปุ่ม "อัปโหลด" ให้คุณเลือกรูปจากเครื่องได้โดยตรง รูปจะถูกอัปโหลดไปยัง ImgBB และเก็บ URL อัตโนมัติ</p>
        </details>

        <details class="bg-gray-900 border border-gray-800 rounded-xl p-4 group">
          <summary class="font-semibold text-white cursor-pointer list-none flex justify-between items-center">
            10. ใบประกาศนียบัตรได้เมื่อไหร่?
            <i class="bi bi-chevron-down transition-transform group-open:rotate-180"></i>
          </summary>
          <p class="text-gray-400 mt-3">เมื่อคุณเรียนจบทุกบทเรียนในคอร์ส จะมีปุ่ม "รับใบประกาศ" ปรากฏในหน้า "คอร์สของฉัน" ซึ่งคุณสามารถดาวน์โหลดเป็น PDF ได้ทันที</p>
        </details>

        <details class="bg-gray-900 border border-gray-800 rounded-xl p-4 group">
          <summary class="font-semibold text-white cursor-pointer list-none flex justify-between items-center">
            11. ฉันสามารถลบบัญชีของตัวเองได้ไหม?
            <i class="bi bi-chevron-down transition-transform group-open:rotate-180"></i>
          </summary>
          <p class="text-gray-400 mt-3">ได้ โดยติดต่อเราผ่านหน้า "ติดต่อ" เพื่อแจ้งขอลบบัญชี ระบบจะลบข้อมูลส่วนตัวของคุณทั้งหมดภายใน 30 วัน</p>
        </details>

        <details class="bg-gray-900 border border-gray-800 rounded-xl p-4 group">
          <summary class="font-semibold text-white cursor-pointer list-none flex justify-between items-center">
            12. ข้อมูลที่เก็บไว้ปลอดภัยหรือไม่?
            <i class="bi bi-chevron-down transition-transform group-open:rotate-180"></i>
          </summary>
          <p class="text-gray-400 mt-3">เราใช้บริการ Supabase ซึ่งมีการเข้ารหัสข้อมูลและจำกัดสิทธิ์การเข้าถึง ผู้ใช้แต่ละคนจะเห็นเฉพาะข้อมูลของตัวเองเท่านั้น</p>
        </details>

        <details class="bg-gray-900 border border-gray-800 rounded-xl p-4 group">
          <summary class="font-semibold text-white cursor-pointer list-none flex justify-between items-center">
            13. เว็บไซต์นี้มีค่าใช้จ่ายในการสมัครหรือไม่?
            <i class="bi bi-chevron-down transition-transform group-open:rotate-180"></i>
          </summary>
          <p class="text-gray-400 mt-3">ไม่มีค่าธรรมเนียมใด ๆ ทั้งสิ้น ทุกอย่างเปิดให้ใช้ฟรี ทั้งผู้เรียนและผู้สร้างคอร์ส</p>
        </details>

        <details class="bg-gray-900 border border-gray-800 rounded-xl p-4 group">
          <summary class="font-semibold text-white cursor-pointer list-none flex justify-between items-center">
            14. ฉันสามารถเรียนผ่านมือถือได้หรือไม่?
            <i class="bi bi-chevron-down transition-transform group-open:rotate-180"></i>
          </summary>
          <p class="text-gray-400 mt-3">ได้ เว็บไซต์รองรับการแสดงผลบนมือถือและแท็บเล็ตอย่างเต็มรูปแบบ คุณสามารถเข้าเรียนได้ทุกที่ทุกเวลา</p>
        </details>

      </div>
    </div>`;
}