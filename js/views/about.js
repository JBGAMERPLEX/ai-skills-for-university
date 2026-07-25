export function render(container) {
  container.innerHTML = `
    <div class="fade-up max-w-3xl mx-auto py-10">
      <h2 class="text-3xl font-bold text-white mb-8">เกี่ยวกับเรา</h2>
      <div class="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4 text-gray-300">
        <p><strong class="text-white">AI Skills for University</strong> คือแพลตฟอร์มการเรียนรู้ออนไลน์ที่มุ่งเน้นทักษะด้านปัญญาประดิษฐ์สำหรับนักศึกษาและบุคคลทั่วไป</p>
        <p>เราเชื่อว่าความรู้ด้าน AI เป็นสิ่งจำเป็นสำหรับอนาคต จึงรวบรวมคอร์สคุณภาพจากผู้เชี่ยวชาญ เพื่อให้ทุกคนสามารถเข้าถึงได้อย่างเท่าเทียม โดยไม่มีค่าใช้จ่าย</p>
        <p>ทีมงานของเราประกอบด้วยผู้เชี่ยวชาญด้านเทคโนโลยีและการศึกษา ที่ร่วมกันพัฒนาและดูแลเนื้อหาอย่างต่อเนื่อง</p>
        <div class="mt-4">
          <h3 class="text-xl font-semibold text-white mb-2">ทีมงาน ลาบเลิฟเวอร์</h3>
          <ul class="list-disc pl-5 space-y-1">
            <li>นักพัฒนาระบบ – ดูแลโครงสร้างพื้นฐานของแพลตฟอร์ม</li>
            <li>นักออกแบบประสบการณ์ผู้ใช้ – ออกแบบ UI/UX ให้ใช้งานง่าย</li>
            <li>ผู้สร้างเนื้อหา – ผลิตคอร์สและบทเรียนที่น่าสนใจ</li>
          </ul>
        </div>
      </div>
    </div>`;
}