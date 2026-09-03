const sbReady = window.PSICERCA_CONFIG &&
  !window.PSICERCA_CONFIG.SUPABASE_URL.includes('TU-PROYECTO') &&
  !window.PSICERCA_CONFIG.SUPABASE_ANON_KEY.includes('TU_ANON_KEY');

const supabaseClient = sbReady
  ? window.supabase.createClient(window.PSICERCA_CONFIG.SUPABASE_URL, window.PSICERCA_CONFIG.SUPABASE_ANON_KEY)
  : null;

function requireSupabase() {
  if (!supabaseClient) {
    throw new Error('Falta configurar Supabase. Creá js/config.js a partir de js/config.example.js.');
  }
  return supabaseClient;
}

function escapeHTML(value='') {
  return String(value).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[c]));
}
