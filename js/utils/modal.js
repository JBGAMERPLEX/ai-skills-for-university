/**
 * แสดง Modal ยืนยันแบบกำหนดเอง (ใช้ <dialog>)
 * @param {string} message - ข้อความที่ต้องการถาม
 * @param {string} confirmText - ข้อความบนปุ่มยืนยัน (ค่าเริ่มต้น "ยืนยัน")
 * @param {string} confirmClass - คลาส CSS สำหรับปุ่มยืนยัน (ค่าเริ่มต้น "btn-brand")
 * @returns {Promise<boolean>} - true ถ้ากดยืนยัน, false ถ้ากดยกเลิกหรือปิด
 */
export function showConfirmModal(message, confirmText = 'ยืนยัน', confirmClass = 'btn-brand') {
  return new Promise((resolve) => {
    // สร้าง <dialog>
    const dialog = document.createElement('dialog');
    dialog.className = 'modal bg-black/50 backdrop-blur-sm rounded-xl';
    dialog.innerHTML = `
      <div class="bg-gray-900 border border-gray-800 rounded-xl p-6 w-full max-w-sm mx-4 shadow-lg text-center">
        <p class="text-white text-lg mb-6">${message}</p>
        <div class="flex gap-3 justify-center">
          <button id="modal-cancel-btn" class="btn-outline-brand text-sm py-2 px-4">ยกเลิก</button>
          <button id="modal-confirm-btn" class="${confirmClass} text-sm py-2 px-4">${confirmText}</button>
        </div>
      </div>
    `;
    document.body.appendChild(dialog);

    dialog.showModal();

    const confirmBtn = dialog.querySelector('#modal-confirm-btn');
    const cancelBtn = dialog.querySelector('#modal-cancel-btn');

    const closeModal = (result) => {
      dialog.close();
      dialog.remove();
      resolve(result);
    };

    confirmBtn.addEventListener('click', () => closeModal(true));
    cancelBtn.addEventListener('click', () => closeModal(false));
    // ปิดเมื่อคลิกที่ backdrop
    dialog.addEventListener('click', (e) => {
      if (e.target === dialog) closeModal(false);
    });
  });
}