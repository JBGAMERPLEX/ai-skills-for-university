import { getSupabaseClient } from './supabase.js';

export async function signUp(email, password, fullName, role) {
  const supabase = await getSupabaseClient();
  const { data, error } = await supabase.rpc('register_user', {
    p_email: email,
    p_password: password,
    p_full_name: fullName,
    p_role: role
  });
  if (error) throw error;
  return data;
}

export async function signIn(email, password) {
  const supabase = await getSupabaseClient();
  const { data, error } = await supabase.rpc('login_user', {
    p_email: email,
    p_password: password
  });
  if (error) throw error;
  if (!data || data.length === 0) throw new Error('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
  const user = data[0];
  const { password_hash, ...safeUser } = user;
  localStorage.setItem('currentUser', JSON.stringify(safeUser));
  return safeUser;
}

export async function signOut() {
  localStorage.removeItem('currentUser');
}

export async function getSession() {
  const user = localStorage.getItem('currentUser');
  return user ? JSON.parse(user) : null;
}

export async function getCurrentUser() {
  return getSession();
}

export async function getProfile(userId) {
  const supabase = await getSupabaseClient();
  const { data, error } = await supabase.rpc('get_user_profile', { p_user_id: userId });
  if (error) throw error;
  if (!data || data.length === 0) throw new Error('User not found');
  return data[0];
}

export async function updateProfile(userId, updates) {
  const supabase = await getSupabaseClient();
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', userId)
    .select('id, email, full_name, role, avatar_url, created_at, updated_at')   // <-- includes avatar_url
    .single();
  if (error) throw error;

  const current = await getSession();
  if (current && current.id === userId) {
    localStorage.setItem('currentUser', JSON.stringify({ ...current, ...data }));
  }
  return data;
}

export function onAuthStateChange(callback) {
  window.addEventListener('storage', (e) => {
    if (e.key === 'currentUser') {
      callback(e.newValue ? 'SIGNED_IN' : 'SIGNED_OUT', e.newValue ? JSON.parse(e.newValue) : null);
    }
  });
  return { unsubscribe: () => {} };
}