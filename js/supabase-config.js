// ============================================
// SUPABASE CONFIG - CUSTOM AUTH (แบบง่าย ไม่เข้ารหัส)
// ============================================

var SUPABASE_CONFIG = {
    url: 'https://uyqpcxnrfueajglwwarp.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV5cXBjeG5yZnVlYWpnbHd3YXJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ1NDQ0MDgsImV4cCI6MjEwMDEyMDQwOH0.04H9NNUod-BaQGivIIvcdWDKllIKWW888gp8oyZBmhg'  // 🔥 เปลี่ยนเป็น Anon Key ของคุณ
};

var supabaseClient = null;
var currentUser = null;

function initSupabase() {
    if (typeof supabase !== 'undefined' && supabase.createClient) {
        supabaseClient = supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
        window.supabaseClient = supabaseClient;
        console.log('✅ Supabase ready');
        return supabaseClient;
    }
    console.error('❌ Supabase library not loaded');
    return null;
}

// ===== สมัครสมาชิก =====
async function registerUser(realName, email, password) {
    if (!supabaseClient) initSupabase();
    if (!supabaseClient) throw new Error('Supabase not connected');

    console.log('📝 Registering:', email);

    try {
        // 🔥 ตรวจสอบว่าอีเมลซ้ำไหม
        const { data: existing, error: checkError } = await supabaseClient
            .from('users')
            .select('email')
            .eq('email', email.toLowerCase().trim())
            .maybeSingle();

        if (existing) {
            throw new Error('อีเมลนี้ลงทะเบียนไปแล้ว');
        }

        // 🔥 สร้าง UUID
        const userId = crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });

        // 🔥 บันทึกข้อมูล - ระบุชื่อคอลัมน์ให้ชัดเจน!
        const { data, error } = await supabaseClient
            .from('users')
            .insert({
                id: userId,
                email: email.toLowerCase().trim(),
                password: password,
                real_name: realName.trim(),
                created_at: new Date().toISOString()  // 👈 เพิ่ม created_at
            })
            .select()
            .single();

        if (error) {
            console.error('❌ Insert error:', error);
            throw error;
        }

        console.log('✅ Registered:', email);
        return data;

    } catch (error) {
        console.error('❌ Register error:', error);
        throw error;
    }
}

// ===== เข้าสู่ระบบ =====
async function loginUser(email, password) {
    if (!supabaseClient) initSupabase();
    if (!supabaseClient) throw new Error('Supabase not connected');

    try {
        // 🔥 ค้นหาผู้ใช้จาก email และ password
        const { data, error } = await supabaseClient
            .from('users')
            .select('*')
            .eq('email', email.toLowerCase().trim())
            .eq('password', password)  // ⚠️ เปรียบเทียบ明文
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                throw new Error('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
            }
            throw error;
        }

        if (!data) {
            throw new Error('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
        }

        currentUser = data;
        window.currentUser = currentUser;
        console.log('✅ Logged in:', email);
        return data;

    } catch (error) {
        console.error('❌ Login error:', error);
        throw error;
    }
}

// ===== ออกจากระบบ =====
async function logoutUser() {
    currentUser = null;
    window.currentUser = null;
    console.log('✅ Logged out');
}

// ===== ตรวจสอบ Session =====
async function checkSession() {
    // เก็บ session ไว้ใน localStorage
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
        try {
            currentUser = JSON.parse(savedUser);
            window.currentUser = currentUser;
            console.log('👤 Session restored:', currentUser.email);
        } catch (e) {
            localStorage.removeItem('user');
        }
    }
    return currentUser;
}

// ============================================
// EXPORT
// ============================================
window.initSupabase = initSupabase;
window.registerUser = registerUser;
window.loginUser = loginUser;
window.logoutUser = logoutUser;
window.checkSession = checkSession;
window.currentUser = currentUser;
window.supabaseClient = supabaseClient;

console.log('✅ Custom auth functions ready');

// Auto init
document.addEventListener('DOMContentLoaded', function() {
    initSupabase();
    setTimeout(checkSession, 500);
});