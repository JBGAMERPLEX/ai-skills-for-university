// ===== User Account System (Supabase Auth) =====

let currentUser = null;

// ===== ตรวจสอบ session เมื่อโหลดหน้า =====
async function checkSession() {
    if (!supabase) initSupabase();
    if (!supabase) return null;

    try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        if (session) {
            currentUser = session.user;
            updateUIForLoggedIn();
        }
        return session;
    } catch (err) {
        console.warn('⚠️ Session check failed:', err.message);
        return null;
    }
}

// ===== สมัครสมาชิก =====
async function registerUser(realName, email, password) {
    if (!supabase) initSupabase();
    if (!supabase) {
        throw new Error('Supabase ยังไม่ได้ตั้งค่า Anon Key');
    }

    // 1. สมัคร Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
            data: {
                real_name: realName
            }
        }
    });

    if (authError) throw authError;

    // 2. เก็บข้อมูลเพิ่มในตาราง profiles (ไม่จำเป็นถ้าใช้ metadata)
    if (authData.user) {
        const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
                id: authData.user.id,
                real_name: realName,
                email: email,
                created_at: new Date().toISOString()
            });
        
        if (profileError) console.warn('Profile save warning:', profileError.message);
    }

    return authData;
}

// ===== เข้าสู่ระบบ =====
async function loginUser(email, password) {
    if (!supabase) initSupabase();
    if (!supabase) {
        throw new Error('Supabase ยังไม่ได้ตั้งค่า Anon Key');
    }

    const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password
    });

    if (error) throw error;

    currentUser = data.user;
    updateUIForLoggedIn();
    return data;
}

// ===== ออกจากระบบ =====
async function logoutUser() {
    if (!supabase) return;

    const { error } = await supabase.auth.signOut();
    if (error) throw error;

    currentUser = null;
    updateUIForLoggedOut();
}

// ===== อัปเดต UI เมื่อ Login =====
function updateUIForLoggedIn() {
    const loginBtns = document.querySelectorAll('.auth-btn');
    const userInfo = document.querySelectorAll('.user-info');
    
    if (currentUser) {
        const name = currentUser.user_metadata?.real_name || currentUser.email;
        
        loginBtns.forEach(btn => {
            btn.innerHTML = `
                <div class="user-badge">
                    <span class="user-avatar">${name.charAt(0).toUpperCase()}</span>
                    <span class="user-name">${name}</span>
                    <span class="logout-link" onclick="handleLogout()">ออกจากระบบ</span>
                </div>
            `;
        });
    }
}

// ===== อัปเดต UI เมื่อ Logout =====
function updateUIForLoggedOut() {
    const loginBtns = document.querySelectorAll('.auth-btn');
    loginBtns.forEach(btn => {
        btn.innerHTML = '<a href="auth.html" class="btn btn-sm">เข้าสู่ระบบ</a>';
    });
}

// ===== จัดการ Logout =====
async function handleLogout() {
    try {
        await logoutUser();
        window.location.reload();
    } catch (err) {
        alert('ออกจากระบบไม่สำเร็จ: ' + err.message);
    }
}

// ===== โหลด session อัตโนมัติ =====
document.addEventListener('DOMContentLoaded', function() {
    // โหลด Supabase library ก่อน
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
    script.onload = () => {
        initSupabase();
        checkSession();
    };
    document.head.appendChild(script);
});