import { loadScript } from '../utils/loader.js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config.js';

const SUPABASE_CDN = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';

let supabaseClient = null;
let loadPromise = null;

export async function getSupabaseClient() {
  if (supabaseClient) return supabaseClient;

  if (!SUPABASE_URL || SUPABASE_URL.includes('your-project-id')) {
    throw new Error('Supabase not configured. Update js/config.js');
  }

  if (!loadPromise) {
    loadPromise = (async () => {
      await loadScript(SUPABASE_CDN, 'supabase-js');
      if (typeof window.supabase === 'undefined') {
        throw new Error('Supabase library failed to load');
      }
      supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false
        }
      });
      return supabaseClient;
    })();
  }

  return loadPromise;
}