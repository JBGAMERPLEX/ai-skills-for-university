export function render(container) {
  container.innerHTML = `
    <div class="fade-up max-w-3xl mx-auto py-10">
      <h2 class="text-3xl font-bold text-white mb-8">นโยบายความเป็นส่วนตัว</h2>
      <div class="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4 text-gray-300">
        <p>เรามุ่งมั่นที่จะปกป้องความเป็นส่วนตัวของผู้ใช้ทุกท่าน ข้อมูลที่เราเก็บรวบรวมประกอบด้วย:</p>
        <ul class="list-disc pl-5 space-y-2">
          <li><strong class="text-white">ข้อมูลบัญชี:</strong> ชื่อ, อีเมล, และรหัสผ่าน (ถูกเข้ารหัส)</li>
          <li><strong class="text-white">รูปโปรไฟล์:</strong> หากคุณอัปโหลด รูปจะถูกเก็บในบริการภายนอก (ImgBB) ภายใต้ข้อกำหนดของ ImgBB</li>
          <li><strong class="text-white">ข้อมูลการเรียน:</strong> ความก้าวหน้าในบทเรียนและคอร์สที่คุณกำลังเรียน</li>
          <li><strong class="text-white">ข้อมูลการสร้างเนื้อหา:</strong> คอร์สและบทเรียนที่คุณสร้างขึ้น</li>
        </ul>
        <p>เรา <strong class="text-white">ไม่</strong> แบ่งปันข้อมูลของคุณกับบุคคลที่สาม ยกเว้นเพื่อการทำงานของระบบ (เช่น การอัปโหลดรูป) และตามที่กฎหมายกำหนด</p>
        <p>คุณสามารถขอลบข้อมูลส่วนตัวได้ทุกเมื่อโดยติดต่อเราผ่านหน้า "ติดต่อ"</p>
        <p>เว็บไซต์นี้ให้บริการภายใต้โดเมน <span class="text-brand font-semibold">www.aiskills-uni.online</span> ซึ่งเป็นกรรมสิทธิ์ของทีมงาน ลาบเลิฟเวอร์</p>
        <p class="text-sm text-gray-500">อัปเดตล่าสุด: 17 สิงหาคม 2569</p>
      </div>
    </div>`;
}