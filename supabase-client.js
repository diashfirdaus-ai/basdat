/**
 * ============================================================================
 * SQLCaseLab — Supabase Cloud Realtime Integration Client
 * ITENAS Bandung - Praktikum Pemrograman Database
 * ============================================================================
 */

// Konfigurasi default (Dapat diisi langsung di sini atau via UI Pengaturan Dosen)
const DEFAULT_SUPABASE_CONFIG = {
  url: '', // Contoh: 'https://xxxxxxxxxxxxxxxxxxxx.supabase.co'
  anonKey: '' // Contoh: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
};

const SUPABASE_STORAGE_KEY = 'sqlcaselab_supabase_config_v1';

function getStoredSupabaseConfig() {
  try {
    const raw = localStorage.getItem(SUPABASE_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.url && parsed.anonKey) return parsed;
    }
  } catch (e) {}
  return DEFAULT_SUPABASE_CONFIG;
}

function saveSupabaseConfig(url, anonKey) {
  const config = {
    url: (url || '').trim(),
    anonKey: (anonKey || '').trim()
  };
  localStorage.setItem(SUPABASE_STORAGE_KEY, JSON.stringify(config));
  initSupabaseInstance();
  return config;
}

let supabaseInstance = null;

function isSupabaseConfigured() {
  const cfg = getStoredSupabaseConfig();
  return Boolean(
    cfg.url &&
    cfg.anonKey &&
    !cfg.url.includes('xxxxxxxxxxxxxxxxxxxx') &&
    cfg.url.startsWith('https://')
  );
}

function initSupabaseInstance() {
  const cfg = getStoredSupabaseConfig();
  if (isSupabaseConfigured() && window.supabase && typeof window.supabase.createClient === 'function') {
    try {
      supabaseInstance = window.supabase.createClient(cfg.url, cfg.anonKey);
      return supabaseInstance;
    } catch (err) {
      console.warn('[Supabase] Gagal inisialisasi client:', err);
      supabaseInstance = null;
    }
  } else {
    supabaseInstance = null;
  }
  return supabaseInstance;
}

function getSupabase() {
  if (!supabaseInstance) {
    initSupabaseInstance();
  }
  return supabaseInstance;
}

/**
 * Mengirim atau memperbarui hasil asesmen mahasiswa ke Supabase Cloud
 */
async function syncStudentSubmissionToCloud(record) {
  const sb = getSupabase();
  if (!sb) {
    return { success: false, reason: 'Supabase belum dikonfigurasi' };
  }

  try {
    const payload = {
      nrp: record.nrp,
      nama: record.nama,
      kelas: record.kelas || 'IF-A',
      score: Number(record.score) || 0,
      grade: record.grade || 'E',
      solved_count: Number(record.solvedCount) || 0,
      duration: record.duration || '00:00',
      status: record.status || 'Selesai',
      jawaban: record.jawaban || {},
      erd_design: record.erdDesign || {},
      trd_design: record.trdDesign || {},
      updated_at: new Date().toISOString()
    };

    const { data, error } = await sb
      .from('peserta_asesmen')
      .upsert(payload, { onConflict: 'nrp' })
      .select();

    if (error) {
      console.error('[Supabase Upsert Error]:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err) {
    console.error('[Supabase Sync Exception]:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Mengambil seluruh daftar mahasiswa dari Supabase Cloud
 */
async function fetchStudentsFromCloud() {
  const sb = getSupabase();
  if (!sb) {
    return { success: false, reason: 'Supabase belum dikonfigurasi', data: [] };
  }

  try {
    const { data, error } = await sb
      .from('peserta_asesmen')
      .select('*')
      .order('completed_at', { ascending: false });

    if (error) {
      console.error('[Supabase Fetch Error]:', error);
      return { success: false, error: error.message, data: [] };
    }

    const mapped = (data || []).map(row => ({
      id: row.id,
      nama: row.nama,
      nrp: row.nrp,
      kelas: row.kelas,
      score: row.score,
      grade: row.grade,
      solvedCount: row.solved_count,
      duration: row.duration,
      status: row.status,
      completedAt: row.completed_at ? new Date(row.completed_at).toLocaleString('id-ID') : '-',
      jawaban: row.jawaban || {},
      erdDesign: row.erd_design || {},
      trdDesign: row.trd_design || {}
    }));

    return { success: true, data: mapped };
  } catch (err) {
    console.error('[Supabase Fetch Exception]:', err);
    return { success: false, error: err.message, data: [] };
  }
}

/**
 * Membuka blokir atau memberi kesempatan remedial bagi mahasiswa di Cloud
 */
async function unlockStudentOnCloud(nrp) {
  const sb = getSupabase();
  if (!sb) return { success: false, reason: 'Supabase belum dikonfigurasi' };

  try {
    const { error } = await sb
      .from('peserta_asesmen')
      .delete()
      .eq('nrp', nrp);

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Berlangganan (Real-time Subscribe) ke perubahan tabel Supabase
 */
function subscribeToCloudUpdates(onUpdateCallback) {
  const sb = getSupabase();
  if (!sb) return null;

  try {
    const channel = sb
      .channel('peserta-asesmen-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'peserta_asesmen' }, payload => {
        if (typeof onUpdateCallback === 'function') {
          onUpdateCallback(payload);
        }
      })
      .subscribe();

    return channel;
  } catch (err) {
    console.warn('[Supabase Realtime Channel Error]:', err);
    return null;
  }
}

// Inisialisasi saat script dimuat
if (typeof window !== 'undefined') {
  window.isSupabaseConfigured = isSupabaseConfigured;
  window.getStoredSupabaseConfig = getStoredSupabaseConfig;
  window.saveSupabaseConfig = saveSupabaseConfig;
  window.syncStudentSubmissionToCloud = syncStudentSubmissionToCloud;
  window.fetchStudentsFromCloud = fetchStudentsFromCloud;
  window.unlockStudentOnCloud = unlockStudentOnCloud;
  window.subscribeToCloudUpdates = subscribeToCloudUpdates;
  window.initSupabaseInstance = initSupabaseInstance;
}
