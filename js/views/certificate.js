import { getSession } from '../services/auth.js';
import { getSupabaseClient } from '../services/supabase.js';
import { loadJsPDF, loadHtml2Canvas } from '../utils/loader.js';

let currentUser = null;
let courseId = null;

export async function render(container, params) {
  currentUser = await getSession();
  courseId = params.id;

  if (!currentUser) {
    container.innerHTML = '<p class="text-center py-20 text-gray-400">กรุณาเข้าสู่ระบบก่อน</p>';
    return;
  }

  container.innerHTML = `
    <div class="fade-up max-w-2xl mx-auto py-10 text-center">
      <div class="animate-spin h-8 w-8 border-4 border-brand border-t-transparent rounded-full mx-auto mb-4"></div>
      <p class="text-white">กำลังสร้างใบประกาศนียบัตร...</p>
    </div>`;

  try {
    await generateCertificate();
    container.innerHTML = `
      <div class="fade-up max-w-2xl mx-auto py-10 text-center">
        <i class="bi bi-check-circle text-green-400 text-6xl"></i>
        <h2 class="text-2xl font-bold text-white mt-4">ดาวน์โหลดใบประกาศเรียบร้อย</h2>
        <p class="text-gray-400 mt-2">หากไม่เริ่มดาวน์โหลด ให้คลิกปุ่มด้านล่าง</p>
        <button id="retry-download" class="btn-brand mt-4">ดาวน์โหลดอีกครั้ง</button>
      </div>`;
    document.getElementById('retry-download').addEventListener('click', generateCertificate);
  } catch (err) {
    console.error(err);
    container.innerHTML = `
      <div class="text-center py-20 text-red-400">
        <i class="bi bi-exclamation-triangle text-6xl"></i>
        <h2 class="text-xl font-bold mt-4">เกิดข้อผิดพลาด</h2>
        <p>${err.message}</p>
      </div>`;
  }
}

async function generateCertificate() {
  const supabase = await getSupabaseClient();

  const { data: course, error: courseErr } = await supabase
    .from('courses')
    .select('title')
    .eq('id', courseId)
    .single();
  if (courseErr || !course) throw new Error('ไม่พบคอร์สนี้');

  const { data: profile, error: profileErr } = await supabase
    .rpc('get_user_profile', { p_user_id: currentUser.id });
  if (profileErr || !profile.length) throw new Error('ไม่พบข้อมูลผู้ใช้');

  const fullName = profile[0].full_name || 'ผู้เรียน';
  const courseTitle = course.title;
  const completionDate = new Date().toLocaleDateString('th-TH', {
    year: 'numeric', month: 'long', day: 'numeric'
  });

  // สร้าง certificate HTML
  const certDiv = document.createElement('div');
  certDiv.innerHTML = `
    <div style="
      width:297mm; height:210mm; 
      background: radial-gradient(circle at 20% 30%, #1a1f2b, #0b0e14);
      font-family: 'Kanit', sans-serif;
      position: relative;
      overflow: hidden;
      box-sizing: border-box;
      padding: 15mm;
      color: white;
    ">
      <!-- Hexagonal Pattern Background -->
      <div style="
        position: absolute; top:0; left:0; width:100%; height:100%;
        background-image: url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2240%22 height=%2240%22%3E%3Cpath d=%22M20 0 L40 10 L40 30 L20 40 L0 30 L0 10 Z%22 fill=%22none%22 stroke=%22%23F9754A%22 stroke-opacity=%220.08%22 stroke-width=%221%22/%3E%3C/svg%3E');
        background-size: 80px 80px;
        opacity: 0.3;
        pointer-events: none;
      "></div>

      <!-- AI Chip Watermark -->
      <div style="
        position: absolute; top:50%; left:50%; transform: translate(-50%,-50%);
        font-size: 200px; color: rgba(249,117,74,0.08); pointer-events: none;
        font-family: 'bootstrap-icons'; 
      ">
        <i class="bi bi-cpu" style="font-size:200px; opacity:0.8;"></i>
      </div>

      <!-- Main Content -->
      <div style="
        position: relative; z-index: 10;
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        height: 100%; text-align: center;
      ">
        <!-- Title -->
        <h1 style="
          font-size: 52px; font-weight: 700; color: #F9754A; margin-bottom: 10mm;
          text-shadow: 0 0 20px rgba(249,117,74,0.4);
          letter-spacing: 2px;
        ">Certificate of Completion</h1>

        <!-- Subtitle -->
        <p style="font-size: 20px; color: #ccc; margin-bottom: 8mm;">This certifies that</p>

        <!-- Student Name -->
        <p style="
          font-size: 42px; font-weight: 700; color: white; margin-bottom: 8mm;
          background: linear-gradient(90deg, #F9754A, #fbbf24);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        ">${fullName}</p>

        <!-- Completion Text -->
        <p style="font-size: 20px; color: #ccc; margin-bottom: 8mm;">has successfully completed the course</p>

        <!-- Course Name -->
        <p style="
          font-size: 34px; font-weight: 700; color: #F9754A; margin-bottom: 12mm;
          text-shadow: 0 0 15px rgba(249,117,74,0.3);
        ">${courseTitle}</p>

        <!-- Date -->
        <p style="font-size: 18px; color: #aaa; margin-bottom: 20mm;">สำเร็จเมื่อ: ${completionDate}</p>

        <!-- Signature Line -->
        <div style="
          width: 60%; margin: 0 auto;
          border-top: 1px solid rgba(255,255,255,0.3);
          padding-top: 5mm;
          font-size: 16px; color: #ccc;
        ">
          AI Skills for University
        </div>

        <!-- Decorative Corner Elements -->
        <div style="position: absolute; top:20px; left:20px; font-size:40px; color: rgba(249,117,74,0.4);"><i class="bi bi-hexagon"></i></div>
        <div style="position: absolute; top:20px; right:20px; font-size:40px; color: rgba(249,117,74,0.4);"><i class="bi bi-hexagon"></i></div>
        <div style="position: absolute; bottom:20px; left:20px; font-size:40px; color: rgba(249,117,74,0.4);"><i class="bi bi-hexagon"></i></div>
        <div style="position: absolute; bottom:20px; right:20px; font-size:40px; color: rgba(249,117,74,0.4);"><i class="bi bi-hexagon"></i></div>
      </div>
    </div>
  `;
  certDiv.style.position = 'absolute';
  certDiv.style.left = '-9999px';
  certDiv.style.top = '0';
  document.body.appendChild(certDiv);

  // โหลด html2canvas และ jsPDF
  await loadHtml2Canvas();
  await loadJsPDF();

  // จับภาพ
  const canvas = await html2canvas(certDiv.firstElementChild, { scale: 2 });
  const imgData = canvas.toDataURL('image/png');

  // สร้าง PDF
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.addImage(imgData, 'PNG', 0, 0, pageWidth, pageHeight);

  // ลบ div ชั่วคราว
  document.body.removeChild(certDiv);

  // ดาวน์โหลด
  doc.save(`Certificate_${courseTitle.replace(/\s+/g, '_')}.pdf`);
}