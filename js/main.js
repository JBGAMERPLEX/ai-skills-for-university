// ===== Navbar HTML Template =====
function getNavbarHTML() {
    const isSubfolder = window.location.pathname.includes('/portfolio/') || 
                       window.location.pathname.includes('/reports/') || 
                       window.location.pathname.includes('/slides/') || 
                       window.location.pathname.includes('/thesis/');
    const p = isSubfolder ? '../' : '';

    return `
<nav class="navbar">
    <div class="logo">
        <a href="${p}index.html" class="logo-link">
            <span class="logo-text"><span class="highlight">AI</span> Skills</span>
            <span class="logo-sub">for University</span>
        </a>
    </div>
    <button class="hamburger" id="hamburger" aria-label="Toggle menu">
        <span></span>
        <span></span>
        <span></span>
    </button>
    <ul class="nav-links" id="navLinks">
        <li><a href="${p}index.html">หน้าแรก</a></li>
        <li><a href="${p}portfolio/index.html">พอร์ตโฟลิโอ</a></li>
        <li><a href="${p}reports/index.html">รายงาน</a></li>
        <li><a href="${p}slides/index.html">สไลด์</a></li>
        <li><a href="${p}thesis/index.html">ธีสิส</a></li>
        <li><a href="${p}credits.html">ทีมงาน</a></li>
    </ul>
    <div class="auth-btn">
        <a href="${p}auth.html" class="btn btn-sm">เข้าสู่ระบบ</a>
    </div>
</nav>`;
}

// ===== Footer HTML Template =====
function getFooterHTML() {
    return `
<footer class="footer">
    <div class="footer-content">
        <div class="footer-left">
            <div class="footer-logo">AI Skills for University</div>
            <p class="footer-team">พัฒนาโดยทีมงาน ลาบเลิฟเวอร์</p>
        </div>
        <div class="footer-right">
            <div class="footer-version">ข้อมูลค้นคว้าล่าสุดเมื่อ : 13/7/2569</div>
            <div class="footer-datetime" id="footerDateTime">วันจันทร์ที่ 13 กรกฎาคม พ.ศ. 2569</div>
        </div>
    </div>
    <div class="footer-bottom">
        <div class="footer-year">© 2026</div>
    </div>
</footer>`;
}

// ===== อัปเดต UI ระบบผู้ใช้งาน (Navbar Auth) =====
function updateAuthUI() {
    const authBtnContainers = document.querySelectorAll('.auth-btn');
    if (authBtnContainers.length === 0) return;

    const savedUser = localStorage.getItem('user');
    if (savedUser) {
        try {
            const user = JSON.parse(savedUser);
            if (user && (user.real_name || user.email)) {
                const name = user.real_name || user.email;
                
                authBtnContainers.forEach(container => {
                    container.innerHTML = `
                        <div class="user-badge">
                            <span class="user-avatar">${name.charAt(0).toUpperCase()}</span>
                            <span class="user-name">${name}</span>
                            <span class="logout-link" id="logoutBtn">ออกจากระบบ</span>
                        </div>
                    `;
                });

                // ติดตั้ง event listener สำหรับปุ่มออกจากระบบ
                const logoutBtns = document.querySelectorAll('#logoutBtn');
                logoutBtns.forEach(btn => {
                    btn.addEventListener('click', function(e) {
                        e.preventDefault();
                        localStorage.removeItem('user');
                        window.location.reload();
                    });
                });
            }
        } catch (e) {
            console.error('Error parsing user session:', e);
            localStorage.removeItem('user');
        }
    }
}

// ===== โหลด Component =====
async function loadComponent(id, file, getInlineHtml) {
    try {
        const isSubfolder = window.location.pathname.includes('/portfolio/') || 
                           window.location.pathname.includes('/reports/') || 
                           window.location.pathname.includes('/slides/') || 
                           window.location.pathname.includes('/thesis/');
        
        const path = isSubfolder ? `../components/${file}` : `components/${file}`;
        const response = await fetch(path);
        let html = await response.text();

        // หากเป็นเมนูนำทาง (navbar) ให้ปรับแก้ path สำหรับโฟลเดอร์ย่อย
        if (file === 'navbar.html' && isSubfolder) {
            html = html.replace(/href="(?!(http|https|#))([^"]+)"/g, 'href="../$2"');
        }

        document.getElementById(id).innerHTML = html;

        // อัปเดตสถานะการเข้าสู่ระบบใน Navbar หลังโหลด Component เสร็จสิ้น
        if (file === 'navbar.html') {
            updateAuthUI();
        }
    } catch (error) {
        console.warn(`⚠️ เฟทช์ ${file} ไม่สำเร็จ, ใช้ inline fallback`);
        document.getElementById(id).innerHTML = getInlineHtml();
        if (file === 'navbar.html') {
            updateAuthUI();
        }
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

// ===== Scroll to Top Button =====
function setupScrollToTop() {
    const btn = document.getElementById('scrollToTop');
    if (!btn) return;

    window.addEventListener('scroll', function() {
        if (window.scrollY > 300) {
            btn.classList.add('visible');
        } else {
            btn.classList.remove('visible');
        }
    });

    btn.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// ===== เริ่มต้นเมื่อโหลดหน้า =====
document.addEventListener('DOMContentLoaded', function() {
    loadComponent('navbar', 'navbar.html', getNavbarHTML);
    loadComponent('footer', 'footer.html', getFooterHTML);

    setTimeout(() => {
        setupHamburger();
        updateThaiDate();
        setupScrollToTop();
    }, 200);

    console.log('✅ AI Skills for University loaded successfully!');
});