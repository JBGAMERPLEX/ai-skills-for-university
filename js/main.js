// ===== โหลด Component =====
async function loadComponent(id, file) {
    try {
        // ตรวจสอบว่าเราอยู่ในโฟลเดอร์ย่อยหรือไม่
        const isSubfolder = window.location.pathname.includes('/portfolio/') || 
                           window.location.pathname.includes('/reports/') || 
                           window.location.pathname.includes('/slides/') || 
                           window.location.pathname.includes('/thesis/');
        
        const path = isSubfolder ? `../components/${file}` : `components/${file}`;
        const response = await fetch(path);
        const html = await response.text();
        document.getElementById(id).innerHTML = html;
    } catch (error) {
        console.error(`Error loading ${file}:`, error);
    }
}

// ===== แสดงวันที่แบบไทย =====
function updateThaiDate() {
    const now = new Date();
    
    const days = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
    const months = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 
                    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
    
    const dayOfWeek = days[now.getDay()];
    const day = now.getDate();
    const month = months[now.getMonth()];
    const year = now.getFullYear() + 543;
    
    const thaiDate = `วัน${dayOfWeek}ที่ ${day} ${month} พ.ศ. ${year}`;
    
    const dateTimeElement = document.getElementById('footerDateTime');
    if (dateTimeElement) {
        dateTimeElement.textContent = thaiDate;
    }
}

// ===== Hamburger Menu =====
function setupHamburger() {
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.getElementById('navLinks');
    
    if (hamburger && navLinks) {
        hamburger.addEventListener('click', function() {
            navLinks.classList.toggle('open');
        });
        
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('open');
            });
        });
    }
}

// ===== เริ่มต้นเมื่อโหลดหน้า =====
document.addEventListener('DOMContentLoaded', function() {
    loadComponent('navbar', 'navbar.html');
    loadComponent('footer', 'footer.html');

    setTimeout(() => {
        setupHamburger();
        updateThaiDate();
    }, 200);

    console.log('✅ AI Skills for University loaded successfully!');
});