/**
 * ============================================================================
 * SQLCaseLab — Portal Dosen & Pengawas Asesmen Pemrograman Database
 * ITENAS Bandung
 * 
 * Modul: dosen.js (Production Ready)
 * ============================================================================
 */

// 1. CONSTANTS & CONFIGURATION
const DOSEN_PASSWORD = 'dosen2026';
const DOSEN_SESSION_KEY = 'sqlcaselab_dosen_auth_session';
const IDB_DB_NAME = 'SQLCaseLab_SQLiteStorage';
const IDB_STORE_NAME = 'sqlite_databases';
const IDB_KEY_BINARY = 'asesmen_database_binary';
const LOCAL_STORAGE_B64_KEY = 'sqlcaselab_sqlite_b64_backup';
const COMPLETED_STUDENTS_KEY = 'sqlcaselab_completed_students_v4';

// 2. BANK SOAL & KUNCI JAWABAN RESMI SISTEM
const DOSEN_CASE_QUESTIONS = [
  {
    id: 1,
    title: 'Tahap 1: Merancang ERD (Entity Relationship Diagram)',
    level: 'Langkah 1 — Perancangan ERD',
    points: 15,
    type: 'DESIGN_ERD',
    scenario: 'Klinik Kesehatan Kampus "SehatKampus": DOKTER (id_dokter, nama_dokter, spesialis), PASIEN (id_pasien, nama_pasien, tgl_lahir), dan KUNJUNGAN (id_kunjungan, tgl_kunjungan, diagnosa). Kardinalitas dokter-kunjungan dan pasien-kunjungan adalah 1:N.',
    officialSolution: `-- Kunci Solusi Konseptual ERD:
Entitas Master #1   : DOKTER (Primary Key: id_dokter, Atribut: nama_dokter, spesialis)
Entitas Transaksi   : KUNJUNGAN (Primary Key: id_kunjungan, Atribut: tgl_kunjungan, diagnosa)
Entitas Master #2   : PASIEN (Primary Key: id_pasien, Atribut: nama_pasien, tgl_lahir)
Kardinalitas Relasi : 1 : N (Satu dokter/pasien dapat memiliki banyak catatan kunjungan)`,
    criteria: 'Entitas terdefinisi DOKTER, KUNJUNGAN, PASIEN dengan PK id_dokter, id_kunjungan, id_pasien dan kardinalitas 1:N.'
  },
  {
    id: 2,
    title: 'Tahap 2: Mentransformasikan ERD Menjadi TRD',
    level: 'Langkah 2 — Transformasi Relasi TRD',
    points: 15,
    type: 'DESIGN_TRD',
    scenario: 'Menerjemahkan ERD menjadi relasi fisik TRD: tabel sisi 1 (dokter & pasien) tidak memuat FK, sedangkan tabel sisi N (kunjungan) wajib memuat Foreign Key id_dokter dan id_pasien.',
    officialSolution: `-- Kunci Solusi TRD:
1. Tabel dokter   : PK id_dokter INT | nama_dokter VARCHAR(100) | spesialis VARCHAR(50)
2. Tabel pasien   : PK id_pasien INT | nama_pasien VARCHAR(100) | tgl_lahir DATE
3. Tabel kunjungan: PK id_kunjungan INT | tgl_kunjungan DATE | diagnosa VARCHAR(150)
                    + FK id_dokter REFERENCES dokter(id_dokter)
                    + FK id_pasien REFERENCES pasien(id_pasien)`,
    criteria: 'Foreign Key id_dokter & id_pasien terpasang dengan tepat pada tabel relasi kunjungan.'
  },
  {
    id: 3,
    title: 'Tahap 3: DDL — Membuat Database & Tabel (CREATE TABLE)',
    level: 'Langkah 3 — SQLite DDL',
    points: 25,
    type: 'DDL_CREATE',
    scenario: 'Membuat file database SQLite dan 3 tabel fisik (dokter, pasien, kunjungan) lengkap dengan Primary Key dan Foreign Key constraint.',
    officialSolution: `PRAGMA foreign_keys = ON;

-- 1. Buat tabel master dokter
CREATE TABLE dokter (
  id_dokter INTEGER PRIMARY KEY,
  nama_dokter VARCHAR(100),
  spesialis VARCHAR(50)
);

-- 2. Buat tabel master pasien
CREATE TABLE pasien (
  id_pasien INTEGER PRIMARY KEY,
  nama_pasien VARCHAR(100),
  tgl_lahir DATE
);

-- 3. Buat tabel transaksi kunjungan
CREATE TABLE kunjungan (
  id_kunjungan INTEGER PRIMARY KEY,
  id_pasien INTEGER,
  id_dokter INTEGER,
  tgl_kunjungan DATE,
  diagnosa VARCHAR(150),
  FOREIGN KEY (id_pasien) REFERENCES pasien(id_pasien),
  FOREIGN KEY (id_dokter) REFERENCES dokter(id_dokter)
);`,
    criteria: 'Database SQLite aktif dan ketiga tabel (dokter, pasien, kunjungan) terbuat di sqlite_master.'
  },
  {
    id: 4,
    title: 'Tahap 4: DDL — Memodifikasi Struktur Tabel (ALTER TABLE)',
    level: 'Langkah 4 — ALTER TABLE',
    points: 15,
    type: 'DDL_ALTER',
    scenario: 'Menambahkan kolom baru no_telepon VARCHAR(20) ke tabel pasien yang sudah ada untuk kebutuhan kontak medis kontrol pasien.',
    officialSolution: `ALTER TABLE pasien
ADD COLUMN no_telepon VARCHAR(20);`,
    criteria: 'Kolom no_telepon berhasil terdaftar pada skema tabel pasien.'
  },
  {
    id: 5,
    title: 'Tahap 5: DML — Mengisi Record Data ke Tabel (INSERT INTO)',
    level: 'Langkah 5 — INSERT RECORD',
    points: 15,
    type: 'DML_INSERT',
    scenario: 'Mengisi record minimal 2 dokter, 3 pasien (id_pasien 101, 102, 103), dan minimal 1 data kunjungan pemeriksaan.',
    officialSolution: `-- 1. Record tabel dokter
INSERT INTO dokter (id_dokter, nama_dokter, spesialis) VALUES 
  (1, 'dr. Andi Wijaya', 'Umum'),
  (2, 'drg. Sari Kusuma', 'Gigi');

-- 2. Record tabel pasien (id 101, 102, 103)
INSERT INTO pasien (id_pasien, nama_pasien, tgl_lahir, no_telepon) VALUES 
  (101, 'Raka Pratama', '2004-05-12', '081234567801'),
  (102, 'Nadia Putri', '2005-08-21', '081234567802'),
  (103, 'Budi Santoso', '2004-11-03', '081234567803');

-- 3. Record tabel kunjungan
INSERT INTO kunjungan (id_kunjungan, id_pasien, id_dokter, tgl_kunjungan, diagnosa) VALUES 
  (501, 101, 1, '2026-10-15', 'Pemeriksaan Flu & Demam');`,
    criteria: 'Tabel dokter >= 2 baris, pasien >= 3 baris (termasuk id 103), kunjungan >= 1 baris.'
  },
  {
    id: 6,
    title: 'Tahap 6: DML — Menghapus Record Data (DELETE FROM)',
    level: 'Langkah 6 — DELETE RECORD',
    points: 15,
    type: 'DML_DELETE',
    scenario: 'Menghapus HANYA record pasien dengan id_pasien = 103 menggunakan klausa WHERE tanpa menghapus data pasien lainnya.',
    officialSolution: `DELETE FROM pasien
WHERE id_pasien = 103;`,
    criteria: 'Record id_pasien = 103 terhapus dari tabel pasien, data pasien lainnya tetap utuh.'
  }
];

// 3. APPLICATION STATE
let sqliteDb = null;
let currentDosenUser = null;
let cachedStudentsList = [];
let pendingUnlockStudent = null;
let pendingDeleteStudent = null;

// 4. STORAGE & SQLITE MANAGEMENT
function openIndexedDb() {
  return new Promise((resolve) => {
    if (!window.indexedDB) {
      resolve(null);
      return;
    }
    const req = indexedDB.open(IDB_DB_NAME, 1);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(IDB_STORE_NAME)) {
        db.createObjectStore(IDB_STORE_NAME);
      }
    };
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = () => resolve(null);
  });
}

async function loadSqliteBinaryFromStorage() {
  try {
    const idb = await openIndexedDb();
    if (idb) {
      const tx = idb.transaction(IDB_STORE_NAME, 'readonly');
      const store = tx.objectStore(IDB_STORE_NAME);
      const req = store.get(IDB_KEY_BINARY);
      const res = await new Promise(r => {
        req.onsuccess = () => r(req.result);
        req.onerror = () => r(null);
      });
      if (res instanceof Uint8Array || res instanceof ArrayBuffer) {
        return new Uint8Array(res);
      }
    }
  } catch (e) {
    console.warn('IDB load fallback:', e);
  }

  try {
    const b64 = localStorage.getItem(LOCAL_STORAGE_B64_KEY);
    if (b64) {
      const binStr = atob(b64);
      const bytes = new Uint8Array(binStr.length);
      for (let i = 0; i < binStr.length; i++) {
        bytes[i] = binStr.charCodeAt(i);
      }
      return bytes;
    }
  } catch (e) {}

  return null;
}

async function persistSqliteBinaryToStorage(uint8Array) {
  if (!uint8Array || !(uint8Array instanceof Uint8Array)) return;
  try {
    const idb = await openIndexedDb();
    if (idb) {
      const tx = idb.transaction(IDB_STORE_NAME, 'readwrite');
      const store = tx.objectStore(IDB_STORE_NAME);
      store.put(uint8Array, IDB_KEY_BINARY);
    }
  } catch (e) {}

  try {
    if (uint8Array.length < 3500000) {
      let binStr = '';
      const len = uint8Array.byteLength;
      for (let i = 0; i < len; i++) {
        binStr += String.fromCharCode(uint8Array[i]);
      }
      localStorage.setItem(LOCAL_STORAGE_B64_KEY, btoa(binStr));
    }
  } catch (e) {}
}

async function syncSqliteDb() {
  if (!sqliteDb) return;
  try {
    const binary = sqliteDb.export();
    await persistSqliteBinaryToStorage(binary);
  } catch (e) {
    console.error('Failed syncing SQLite DB:', e);
  }
}

async function initSqliteEngine() {
  const badge = document.getElementById('dosenEngineBadge');
  try {
    if (typeof initSqlJs !== 'function') {
      if (badge) badge.textContent = 'Menghubungkan SQL...';
      return;
    }
    const SQL = await initSqlJs({
      locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/${file}`
    });

    const savedBinary = await loadSqliteBinaryFromStorage();
    if (savedBinary && savedBinary.length > 0) {
      try {
        sqliteDb = new SQL.Database(savedBinary);
      } catch (e) {
        sqliteDb = new SQL.Database();
      }
    } else {
      sqliteDb = new SQL.Database();
    }

    ensureSqliteTables();
    if (badge) {
      badge.textContent = 'SQLite WASM Ready';
      badge.className = 'text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30';
    }
  } catch (err) {
    console.error('Error init SQLite in dosen portal:', err);
    if (badge) {
      badge.textContent = 'SQLite Offline';
      badge.className = 'text-[10px] font-medium px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30';
    }
  }
}

function ensureSqliteTables() {
  if (!sqliteDb) return;
  try {
    sqliteDb.run(`
      CREATE TABLE IF NOT EXISTS peserta_asesmen (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nama TEXT NOT NULL,
        nrp TEXT NOT NULL UNIQUE,
        kelas TEXT,
        score INTEGER DEFAULT 0,
        grade TEXT DEFAULT 'E',
        solved_count INTEGER DEFAULT 0,
        duration TEXT DEFAULT '00:00',
        completed_at TEXT,
        status TEXT DEFAULT 'Selesai',
        jawaban_json TEXT
      );
    `);
    sqliteDb.run(`
      CREATE TABLE IF NOT EXISTS riwayat_jawaban (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nrp TEXT,
        nama TEXT,
        soal_id INTEGER,
        query TEXT,
        points INTEGER,
        solved INTEGER,
        timestamp TEXT
      );
    `);
    sqliteDb.run(`
      CREATE TABLE IF NOT EXISTS log_aktivitas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nrp TEXT,
        role TEXT,
        aksi TEXT,
        detail TEXT,
        timestamp TEXT
      );
    `);
  } catch (e) {
    console.warn('ensureSqliteTables error:', e);
  }
}

function logDosenActivity(aksi, detail) {
  if (!sqliteDb) return;
  try {
    ensureSqliteTables();
    const nrp = currentDosenUser ? currentDosenUser.nama : 'DOSEN';
    const stmt = sqliteDb.prepare("INSERT INTO log_aktivitas (nrp, role, aksi, detail, timestamp) VALUES (?, ?, ?, ?, ?)");
    stmt.run([nrp, 'dosen', aksi, detail, new Date().toLocaleString('id-ID')]);
    stmt.free();
    syncSqliteDb();
  } catch (e) {}
}

// 5. DATA ACCESS & CLOUD SYNC
let cloudStudentsCache = [];
let activeRealtimeChannel = null;

const SUPABASE_INIT_SQL = `-- TABEL PENYIMPANAN NILAI & JAWABAN MAHASISWA (Supabase PostgreSQL)
CREATE TABLE IF NOT EXISTS peserta_asesmen (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nrp TEXT UNIQUE NOT NULL,
  nama TEXT NOT NULL,
  kelas TEXT DEFAULT 'IF-A',
  score INTEGER DEFAULT 0,
  grade TEXT DEFAULT 'E',
  solved_count INTEGER DEFAULT 0,
  duration TEXT DEFAULT '00:00',
  status TEXT DEFAULT 'Selesai',
  jawaban JSONB DEFAULT '{}'::jsonb,
  erd_design JSONB DEFAULT '{}'::jsonb,
  trd_design JSONB DEFAULT '{}'::jsonb,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AKTIFKAN ROW LEVEL SECURITY (RLS)
ALTER TABLE peserta_asesmen ENABLE ROW LEVEL SECURITY;

-- KEBIJAKAN AKSES
CREATE POLICY "Izinkan akses penuh asesmen"
ON peserta_asesmen
FOR ALL
USING (true)
WITH CHECK (true);

-- AKTIFKAN REALTIME REPLICATION (Agar dashboard dosen update live)
ALTER PUBLICATION supabase_realtime ADD TABLE peserta_asesmen;`;

function updateSupabaseStatusBadge() {
  const dot = document.getElementById('supabaseStatusDot');
  const text = document.getElementById('supabaseStatusText');
  const btn = document.getElementById('btnOpenSupabaseModal');
  if (!dot || !text || !btn) return;

  if (typeof isSupabaseConfigured === 'function' && isSupabaseConfigured()) {
    dot.className = 'w-2 h-2 rounded-full bg-emerald-400 animate-pulse';
    text.textContent = 'Cloud: Terhubung';
    btn.className = 'px-3 py-1.5 rounded-xl border text-xs font-semibold transition flex items-center gap-1.5 shadow-sm bg-emerald-950/40 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/40';
  } else {
    dot.className = 'w-2 h-2 rounded-full bg-amber-400';
    text.textContent = 'Hubungkan Cloud';
    btn.className = 'px-3 py-1.5 rounded-xl border text-xs font-semibold transition flex items-center gap-1.5 shadow-sm bg-stone-800 hover:bg-stone-700 text-stone-200 border-stone-700';
  }
}

async function refreshStudentsFromCloud(silent = false) {
  if (typeof isSupabaseConfigured !== 'function' || !isSupabaseConfigured()) {
    return;
  }
  const res = await fetchStudentsFromCloud();
  if (res.success && Array.isArray(res.data)) {
    cloudStudentsCache = res.data;
    renderStudentRecords();
    renderGradeDistribution();
    if (!silent) {
      showToast(`Data mahasiswa tersinkron dari Cloud (${cloudStudentsCache.length} peserta).`, 'info');
    }
  }
}

function initSupabaseRealtimeSubscription() {
  if (activeRealtimeChannel) return;
  if (typeof subscribeToCloudUpdates === 'function' && isSupabaseConfigured()) {
    activeRealtimeChannel = subscribeToCloudUpdates(payload => {
      refreshStudentsFromCloud(true);
      showToast('Pembaruan data mahasiswa diterima dari Cloud!', 'info');
    });
  }
}

function fetchCompletedStudents() {
  let list = [];
  if (sqliteDb) {
    try {
      const res = sqliteDb.exec("SELECT nama, nrp, kelas, score, grade, solved_count, duration, completed_at, status, jawaban_json FROM peserta_asesmen ORDER BY id DESC");
      if (res && res[0] && res[0].values) {
        list = res[0].values.map(r => {
          let parsedJawaban = {};
          try {
            parsedJawaban = JSON.parse(r[9] || '{}');
          } catch (e) {}
          return {
            nama: r[0],
            nrp: r[1],
            kelas: r[2],
            score: r[3],
            grade: r[4],
            solvedCount: r[5],
            duration: r[6],
            completedAt: r[7],
            status: r[8],
            jawaban: parsedJawaban
          };
        });
      }
    } catch (e) {
      console.warn('SQLite fetch failed:', e);
    }
  }

  if (list.length === 0) {
    try {
      const raw = localStorage.getItem(COMPLETED_STUDENTS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) list = parsed;
      }
    } catch (e) {}
  }

  // Merge dengan data Cloud jika tersedia (data Cloud diutamakan berdasarkan NRP)
  if (cloudStudentsCache && cloudStudentsCache.length > 0) {
    const map = new Map();
    list.forEach(item => map.set(item.nrp, item));
    cloudStudentsCache.forEach(item => map.set(item.nrp, item));
    return Array.from(map.values());
  }

  return list;
}

function saveCompletedStudents(list) {
  try {
    localStorage.setItem(COMPLETED_STUDENTS_KEY, JSON.stringify(list));
  } catch (e) {}

  if (sqliteDb) {
    try {
      ensureSqliteTables();
      sqliteDb.run("DELETE FROM peserta_asesmen;");
      list.forEach(item => {
        const stmt = sqliteDb.prepare(`
          INSERT INTO peserta_asesmen 
          (nama, nrp, kelas, score, grade, solved_count, duration, completed_at, status, jawaban_json) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        stmt.run([
          item.nama,
          item.nrp,
          item.kelas || '',
          item.score || 0,
          item.grade || 'E',
          item.solvedCount || 0,
          item.duration || '00:00',
          item.completedAt || new Date().toLocaleString('id-ID'),
          item.status || 'Selesai',
          JSON.stringify(item.jawaban || {})
        ]);
        stmt.free();
      });
      syncSqliteDb();
    } catch (e) {
      console.error('Error saving students to sqlite:', e);
    }
  }
}

// 6. UI HELPERS
function escapeHtml(val) {
  if (val === null || val === undefined) return '';
  return String(val)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  const typeStyles = {
    success: 'bg-emerald-950/90 border-emerald-500 text-emerald-200',
    error: 'bg-rose-950/90 border-rose-500 text-rose-200',
    warning: 'bg-amber-950/90 border-amber-500 text-amber-200',
    info: 'bg-stone-900/90 border-stone-700 text-stone-200'
  };

  toast.className = `p-3.5 rounded-xl border shadow-xl text-xs backdrop-blur pointer-events-auto transition-all duration-300 flex items-start gap-2.5 ${typeStyles[type] || typeStyles.info}`;
  toast.innerHTML = `
    <div class="flex-1 leading-relaxed">${escapeHtml(message)}</div>
    <button type="button" class="text-stone-400 hover:text-white shrink-0 ml-1 font-bold">&times;</button>
  `;

  toast.querySelector('button').addEventListener('click', () => {
    toast.remove();
  });

  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-10px)';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

function getGradeBadgeHtml(grade, score) {
  const gradeColors = {
    'A': 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    'B': 'bg-brand-500/20 text-brand-300 border-brand-500/30',
    'C': 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    'D': 'bg-orange-500/20 text-orange-300 border-orange-500/30',
    'E': 'bg-rose-500/20 text-rose-300 border-rose-500/30'
  };
  const color = gradeColors[grade] || gradeColors['E'];
  return `<span class="font-mono-code font-bold text-[11px] px-2 py-0.5 rounded border ${color}">${score} (${grade})</span>`;
}

// 7. DASHBOARD RENDERING & ANALYTICS
function updateKpiCards(students) {
  const total = students.length;
  document.getElementById('kpiTotalPeserta').textContent = total;

  if (total === 0) {
    document.getElementById('kpiAvgScore').textContent = '0.0';
    document.getElementById('kpiMaxScore').textContent = '0';
    document.getElementById('kpiMaxGrade').textContent = '-';
    document.getElementById('kpiMaxStudent').textContent = 'Belum ada data';
    document.getElementById('kpiMinScore').textContent = '0';
    document.getElementById('kpiMinGrade').textContent = '-';
    document.getElementById('kpiMinStudent').textContent = 'Belum ada data';
    document.getElementById('kpiPassRate').textContent = '0%';
    document.getElementById('kpiPassCount').textContent = '0 Lulus';
    document.getElementById('kpiViolationCount').textContent = '0';
    return;
  }

  const scores = students.map(s => Number(s.score) || 0);
  const sum = scores.reduce((acc, curr) => acc + curr, 0);
  const avg = (sum / total).toFixed(1);
  document.getElementById('kpiAvgScore').textContent = avg;

  let maxStudent = students[0];
  let minStudent = students[0];
  let passCount = 0;
  let violationCount = 0;

  students.forEach(s => {
    const sc = Number(s.score) || 0;
    if (sc > (Number(maxStudent.score) || 0)) maxStudent = s;
    if (sc < (Number(minStudent.score) || 0)) minStudent = s;
    if (sc >= 60) passCount++;
    if (String(s.status).toLowerCase().includes('auto-submit') || String(s.status).toLowerCase().includes('tab')) {
      violationCount++;
    }
  });

  document.getElementById('kpiMaxScore').textContent = maxStudent.score;
  document.getElementById('kpiMaxGrade').textContent = `Grade ${maxStudent.grade}`;
  document.getElementById('kpiMaxStudent').textContent = maxStudent.nama;

  document.getElementById('kpiMinScore').textContent = minStudent.score;
  document.getElementById('kpiMinGrade').textContent = `Grade ${minStudent.grade}`;
  document.getElementById('kpiMinStudent').textContent = minStudent.nama;

  const passRate = Math.round((passCount / total) * 100);
  document.getElementById('kpiPassRate').textContent = `${passRate}%`;
  document.getElementById('kpiPassCount').textContent = `${passCount} dari ${total} Lulus`;

  document.getElementById('kpiViolationCount').textContent = violationCount;
}

function renderStudentRecords() {
  cachedStudentsList = fetchCompletedStudents();
  updateKpiCards(cachedStudentsList);

  const tbody = document.getElementById('studentRecordsTbody');
  const emptyNotice = document.getElementById('emptyStudentNotice');
  if (!tbody) return;

  const searchTerm = (document.getElementById('searchStudentInput')?.value || '').trim().toLowerCase();
  const filterClass = document.getElementById('filterClassSelect')?.value || 'ALL';
  const filterStatus = document.getElementById('filterStatusSelect')?.value || 'ALL';

  const filtered = cachedStudentsList.filter(s => {
    const matchSearch = s.nama.toLowerCase().includes(searchTerm) || s.nrp.toLowerCase().includes(searchTerm);
    const matchClass = filterClass === 'ALL' || s.kelas === filterClass;
    let matchStatus = true;
    if (filterStatus === 'Auto-Submit') {
      matchStatus = String(s.status).toLowerCase().includes('auto-submit');
    } else if (filterStatus === 'Terkumpul Final') {
      matchStatus = !String(s.status).toLowerCase().includes('auto-submit');
    }
    return matchSearch && matchClass && matchStatus;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = '';
    emptyNotice?.classList.remove('hidden');
    return;
  }
  emptyNotice?.classList.add('hidden');

  tbody.innerHTML = filtered.map((s, idx) => {
    const isViolation = String(s.status).toLowerCase().includes('auto-submit');
    const statusBadge = isViolation
      ? `<span class="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-semibold">Auto-Submit</span>`
      : `<span class="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-semibold">Selesai</span>`;

    return `
      <tr class="hover:bg-stone-900/60 transition">
        <td class="py-2.5 px-3 text-center text-stone-500 font-mono-code">${idx + 1}</td>
        <td class="py-2.5 px-3">
          <div class="font-bold text-white text-xs">${escapeHtml(s.nama)}</div>
          <div class="font-mono-code text-[11px] text-amber-300">${escapeHtml(s.nrp)}</div>
        </td>
        <td class="py-2.5 px-3 text-stone-300 text-xs">${escapeHtml(s.kelas || '-')}</td>
        <td class="py-2.5 px-3 text-center">${getGradeBadgeHtml(s.grade, s.score)}</td>
        <td class="py-2.5 px-3 text-center font-mono-code text-stone-300 text-xs">${s.solvedCount || 0} / 6</td>
        <td class="py-2.5 px-3 text-center font-mono-code text-amber-300 text-xs">${escapeHtml(s.duration || '00:00')}</td>
        <td class="py-2.5 px-3 text-stone-400 text-[11px]">${escapeHtml(s.completedAt || '-')}</td>
        <td class="py-2.5 px-3 text-center">${statusBadge}</td>
        <td class="py-2.5 px-3 text-center">
          <div class="flex items-center justify-center gap-1.5 flex-wrap">
            <button
              type="button"
              onclick="openStudentDetail('${escapeHtml(s.nrp)}')"
              class="px-2 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 text-[11px] font-medium transition"
              title="Review lembar jawaban mahasiswa"
            >
              Jawaban
            </button>
            <button
              type="button"
              onclick="promptUnlockStudent('${escapeHtml(s.nrp)}', '${escapeHtml(s.nama)}')"
              class="px-2 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-[11px] font-medium transition"
              title="Hapus kuncian agar mahasiswa dapat remedial"
            >
              Remedial
            </button>
            <button
              type="button"
              onclick="promptDeleteStudent('${escapeHtml(s.nrp)}', '${escapeHtml(s.nama)}')"
              class="p-1 rounded-lg bg-stone-800 hover:bg-rose-500/20 text-stone-400 hover:text-rose-300 border border-stone-700 transition"
              title="Hapus data mahasiswa"
            >
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// 8. VISUAL GRADE DISTRIBUTION & CLASS ANALYTICS
function renderGradeDistribution() {
  const container = document.getElementById('gradeDistributionBars');
  const classAvgContainer = document.getElementById('classAverageList');
  const passSummary = document.getElementById('passSummaryText');
  if (!container || !classAvgContainer) return;

  const students = fetchCompletedStudents();
  const total = students.length;

  if (total === 0) {
    container.innerHTML = '<div class="text-xs text-stone-500 py-4 text-center">Belum ada data asesmen untuk dianalisis.</div>';
    classAvgContainer.innerHTML = '<div class="text-xs text-stone-500 py-4 text-center">Belum ada data kelas.</div>';
    if (passSummary) passSummary.textContent = '0% Kelulusan';
    return;
  }

  // Count grades A, B, C, D, E
  const grades = { 'A': 0, 'B': 0, 'C': 0, 'D': 0, 'E': 0 };
  let passedCount = 0;

  students.forEach(s => {
    const g = (s.grade || 'E').toUpperCase();
    if (grades[g] !== undefined) grades[g]++;
    else grades['E']++;
    if (Number(s.score) >= 60) passedCount++;
  });

  const passPct = Math.round((passedCount / total) * 100);
  if (passSummary) passSummary.textContent = `${passPct}% Kelulusan (${passedCount} dari ${total} Mahasiswa)`;

  const gradeConfigs = [
    { grade: 'A', label: 'Grade A (80 - 100)', color: 'bg-emerald-500', text: 'text-emerald-400' },
    { grade: 'B', label: 'Grade B (70 - 79)', color: 'bg-brand-500', text: 'text-brand-400' },
    { grade: 'C', label: 'Grade C (60 - 69)', color: 'bg-amber-500', text: 'text-amber-400' },
    { grade: 'D', label: 'Grade D (50 - 59)', color: 'bg-orange-500', text: 'text-orange-400' },
    { grade: 'E', label: 'Grade E (< 50)', color: 'bg-rose-500', text: 'text-rose-400' },
  ];

  container.innerHTML = gradeConfigs.map(c => {
    const count = grades[c.grade] || 0;
    const pct = total > 0 ? Math.round((count / total) * 100) : 0;
    return `
      <div>
        <div class="flex items-center justify-between text-xs mb-1">
          <span class="font-medium text-stone-300">${c.label}</span>
          <span class="font-mono-code font-bold ${c.text}">${count} (${pct}%)</span>
        </div>
        <div class="w-full h-2 rounded-full bg-stone-800 overflow-hidden">
          <div class="h-full rounded-full ${c.color} transition-all duration-500" style="width: ${pct}%"></div>
        </div>
      </div>
    `;
  }).join('');

  // Per-Class Averages
  const classStats = {};
  students.forEach(s => {
    const cls = s.kelas || 'Umum';
    if (!classStats[cls]) classStats[cls] = { total: 0, sum: 0 };
    classStats[cls].total++;
    classStats[cls].sum += Number(s.score) || 0;
  });

  classAvgContainer.innerHTML = Object.keys(classStats).map(cls => {
    const st = classStats[cls];
    const avg = (st.sum / st.total).toFixed(1);
    return `
      <div class="p-3 rounded-xl bg-stone-950 border border-stone-800 flex items-center justify-between">
        <div>
          <div class="text-xs font-bold text-white">${escapeHtml(cls)}</div>
          <div class="text-[10px] text-stone-400">${st.total} Peserta</div>
        </div>
        <div class="text-right">
          <div class="text-base font-extrabold text-amber-400 font-mono-code">${avg}</div>
          <div class="text-[10px] text-stone-500">Rata-rata</div>
        </div>
      </div>
    `;
  }).join('');
}

// 9. STUDENT DETAIL MODAL
window.openStudentDetail = function(nrp) {
  const student = cachedStudentsList.find(s => s.nrp === nrp);
  if (!student) return;

  document.getElementById('detailNama').textContent = student.nama;
  document.getElementById('detailNrp').textContent = `NRP: ${student.nrp}`;
  document.getElementById('detailKelas').textContent = student.kelas || '-';
  document.getElementById('detailDuration').textContent = `Durasi: ${student.duration || '00:00'}`;
  document.getElementById('detailScore').textContent = `${student.score}/100`;
  document.getElementById('detailGrade').textContent = `Grade ${student.grade}`;
  document.getElementById('detailSolved').textContent = `${student.solvedCount || 0} dari 6 Benar`;
  document.getElementById('detailStatus').textContent = student.status || 'Selesai';
  document.getElementById('detailTime').textContent = student.completedAt || '-';

  const listContainer = document.getElementById('detailQuestionsList');
  if (listContainer) {
    listContainer.innerHTML = DOSEN_CASE_QUESTIONS.map(q => {
      const sub = (student.jawaban && student.jawaban[q.id]) || { query: '-- Tidak ada query tersimpan', solved: false, pointsEarned: 0 };
      const isSolved = sub.solved;
      const statusBadge = isSolved
        ? `<span class="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">Benar (${sub.pointsEarned}/${q.points} Poin)</span>`
        : `<span class="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold">Belum Benar (0/${q.points} Poin)</span>`;

      return `
        <div class="p-3 rounded-xl bg-stone-950 border border-stone-800 flex flex-col gap-1.5">
          <div class="flex items-center justify-between flex-wrap gap-2">
            <span class="font-bold text-xs text-white">Soal #${q.id}: ${escapeHtml(q.title)}</span>
            ${statusBadge}
          </div>
          <pre class="p-2.5 rounded-lg bg-stone-900 border border-stone-800 font-mono-code text-xs text-emerald-300 overflow-x-auto leading-relaxed">${escapeHtml(sub.query || '-- (Kosong)')}</pre>
        </div>
      `;
    }).join('');
  }

  document.getElementById('studentDetailModal').classList.remove('hidden');
};

// 10. UNLOCK & DELETE MODALS
window.promptUnlockStudent = function(nrp, nama) {
  pendingUnlockStudent = { nrp, nama };
  document.getElementById('unlockStudentTarget').textContent = `${nama} (${nrp})`;
  document.getElementById('unlockConfirmModal').classList.remove('hidden');
};

function confirmUnlockStudent() {
  if (!pendingUnlockStudent) return;
  const { nrp, nama } = pendingUnlockStudent;

  cachedStudentsList = cachedStudentsList.filter(s => s.nrp !== nrp && s.nama !== nama);
  cloudStudentsCache = cloudStudentsCache.filter(s => s.nrp !== nrp && s.nama !== nama);
  saveCompletedStudents(cachedStudentsList);

  if (typeof unlockStudentOnCloud === 'function') {
    unlockStudentOnCloud(nrp);
  }

  if (sqliteDb) {
    try {
      const stmt = sqliteDb.prepare("DELETE FROM riwayat_jawaban WHERE nrp = ? OR nama = ?");
      stmt.run([nrp, nama]);
      stmt.free();
      syncSqliteDb();
    } catch (e) {}
  }

  logDosenActivity('BUKA_KUNCI_REMEDIAL', `Dosen mengizinkan ujian ulang untuk ${nama} (${nrp})`);
  document.getElementById('unlockConfirmModal').classList.add('hidden');
  pendingUnlockStudent = null;
  renderStudentRecords();
  renderGradeDistribution();
  showToast(`Kuncian NIM untuk ${nama} telah dibuka. Mahasiswa dapat login kembali.`, 'success');
}

window.promptDeleteStudent = function(nrp, nama) {
  pendingDeleteStudent = { nrp, nama };
  document.getElementById('deleteStudentTargetText').textContent = `Hapus data asesmen ${nama} (${nrp}) dari database?`;
  document.getElementById('deleteStudentConfirmModal').classList.remove('hidden');
};

function confirmDeleteStudent() {
  if (!pendingDeleteStudent) return;
  const { nrp, nama } = pendingDeleteStudent;

  cachedStudentsList = cachedStudentsList.filter(s => s.nrp !== nrp);
  cloudStudentsCache = cloudStudentsCache.filter(s => s.nrp !== nrp);
  saveCompletedStudents(cachedStudentsList);

  if (typeof unlockStudentOnCloud === 'function') {
    unlockStudentOnCloud(nrp);
  }

  if (sqliteDb) {
    try {
      const stmt = sqliteDb.prepare("DELETE FROM riwayat_jawaban WHERE nrp = ?");
      stmt.run([nrp]);
      stmt.free();
      syncSqliteDb();
    } catch (e) {}
  }

  logDosenActivity('HAPUS_DATA_MAHASISWA', `Dosen menghapus data mahasiswa ${nama} (${nrp})`);
  document.getElementById('deleteStudentConfirmModal').classList.add('hidden');
  pendingDeleteStudent = null;
  renderStudentRecords();
  renderGradeDistribution();
  showToast(`Data mahasiswa ${nama} berhasil dihapus.`, 'info');
}

function clearAllStudentData() {
  cachedStudentsList = [];
  saveCompletedStudents([]);

  if (sqliteDb) {
    try {
      sqliteDb.run("DELETE FROM peserta_asesmen;");
      sqliteDb.run("DELETE FROM riwayat_jawaban;");
      sqliteDb.run("DELETE FROM log_aktivitas;");
      syncSqliteDb();
    } catch (e) {}
  }

  logDosenActivity('RESET_SELURUH_DATA', 'Dosen me-reset seluruh rekaman asesmen');
  document.getElementById('clearAllConfirmModal').classList.add('hidden');
  renderStudentRecords();
  renderGradeDistribution();
  renderAuditLogs();
  showToast('Seluruh data asesmen praktikum berhasil dibersihkan.', 'success');
}

// 11. EXPORTS
function exportToCsv() {
  const list = fetchCompletedStudents();
  if (list.length === 0) {
    showToast('Tidak ada data peserta untuk diekspor.', 'warning');
    return;
  }

  const headers = ['No', 'Nama Mahasiswa', 'NIM/NRP', 'Kelas', 'Nilai', 'Grade', 'Soal Selesai', 'Durasi', 'Waktu Pengumpulan', 'Status'];
  const rows = list.map((s, i) => [
    i + 1,
    `"${(s.nama || '').replace(/"/g, '""')}"`,
    `"${(s.nrp || '').replace(/"/g, '""')}"`,
    `"${(s.kelas || '').replace(/"/g, '""')}"`,
    s.score || 0,
    s.grade || 'E',
    `${s.solvedCount || 0}/6`,
    s.duration || '00:00',
    `"${(s.completedAt || '').replace(/"/g, '""')}"`,
    `"${(s.status || '').replace(/"/g, '""')}"`
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `rekap_nilai_praktikum_basdat_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('File CSV nilai berhasil diunduh.', 'success');
}

function exportToJson() {
  const list = fetchCompletedStudents();
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(list, null, 2));
  const a = document.createElement('a');
  a.href = dataStr;
  a.download = `laporan_asesmen_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  showToast('Laporan JSON berhasil diunduh.', 'success');
}

function downloadSqliteMaster() {
  if (!sqliteDb) {
    showToast('Database SQLite belum siap.', 'error');
    return;
  }
  try {
    const binary = sqliteDb.export();
    const blob = new Blob([binary], { type: 'application/x-sqlite3' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `klinik_sehatkampus_master.sqlite`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Database SQLite (.sqlite) berhasil diunduh!', 'success');
  } catch (e) {
    showToast('Gagal mengunduh file SQLite: ' + e.message, 'error');
  }
}

// 12. TAB SWITCHING
window.switchDosenTab = function(tabName) {
  const tabs = ['rekap', 'analitik', 'kunci', 'console', 'audit'];
  tabs.forEach(t => {
    const btn = document.getElementById(`tabBtn${t.charAt(0).toUpperCase() + t.slice(1)}`);
    const panel = document.getElementById(`panel${t.charAt(0).toUpperCase() + t.slice(1)}`);
    if (t === tabName) {
      if (btn) btn.className = 'flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition bg-amber-600 text-stone-950 font-bold shadow-sm shrink-0';
      if (panel) panel.classList.remove('hidden');
    } else {
      if (btn) btn.className = 'flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition text-stone-400 hover:text-white shrink-0';
      if (panel) panel.classList.add('hidden');
    }
  });

  if (tabName === 'rekap') renderStudentRecords();
  if (tabName === 'analitik') renderGradeDistribution();
  if (tabName === 'audit') renderAuditLogs();
};

// 13. BANK SOAL & KUNCI QUERY
function renderDosenQuestions() {
  const container = document.getElementById('dosenQuestionsList');
  if (!container) return;

  container.innerHTML = DOSEN_CASE_QUESTIONS.map(q => {
    return `
      <div class="p-3.5 sm:p-4 rounded-xl bg-stone-950 border border-stone-800 flex flex-col gap-2.5">
        <div class="flex items-center justify-between flex-wrap gap-2">
          <div class="flex items-center gap-2">
            <span class="px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
              Soal #${q.id}
            </span>
            <h4 class="font-bold text-white text-xs">${escapeHtml(q.title)}</h4>
          </div>
          <span class="text-xs font-mono-code font-bold text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
            ${q.points} Poin
          </span>
        </div>

        <p class="text-xs text-stone-300 leading-relaxed">${escapeHtml(q.scenario)}</p>

        <div class="relative mt-1">
          <div class="flex items-center justify-between mb-1">
            <span class="text-[10px] font-mono-code uppercase tracking-wider text-amber-400 font-bold">
              Kunci Query Solusi:
            </span>
            <div class="flex items-center gap-1.5">
              <button
                type="button"
                onclick="copyQueryKey('${q.id}')"
                class="px-2 py-0.5 rounded bg-stone-800 hover:bg-stone-700 text-stone-300 text-[10px] border border-stone-700 transition"
              >
                Salin Kunci
              </button>
              <button
                type="button"
                onclick="loadKeyIntoConsole('${q.id}')"
                class="px-2 py-0.5 rounded bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-[10px] font-medium transition"
              >
                Muat ke Konsol &rarr;
              </button>
            </div>
          </div>
          <pre id="queryKeyText_${q.id}" class="p-3 rounded-xl bg-stone-900 border border-stone-800 font-mono-code text-xs text-amber-300 overflow-x-auto leading-relaxed">${escapeHtml(q.officialSolution)}</pre>
        </div>
      </div>
    `;
  }).join('');
}

window.copyQueryKey = function(qId) {
  const el = document.getElementById(`queryKeyText_${qId}`);
  if (!el) return;
  navigator.clipboard.writeText(el.textContent.trim()).then(() => {
    showToast(`Kunci jawaban Soal #${qId} disalin ke clipboard.`, 'success');
  });
};

window.loadKeyIntoConsole = function(qId) {
  const q = DOSEN_CASE_QUESTIONS.find(item => item.id == qId);
  if (!q) return;
  const textarea = document.getElementById('dosenSqlTextarea');
  if (textarea) textarea.value = q.officialSolution;
  switchDosenTab('console');
  showToast(`Kunci Soal #${qId} telah dimuat ke Konsol SQL.`, 'info');
};

// 14. DOSEN SQL PLAYGROUND
function executeDosenSql() {
  const textarea = document.getElementById('dosenSqlTextarea');
  const resultContainer = document.getElementById('dosenQueryResultContainer');
  const metaBadge = document.getElementById('dosenQueryMetaBadge');
  if (!textarea || !resultContainer) return;

  const sql = textarea.value.trim();
  if (!sql) {
    showToast('Tuliskan perintah SQL terlebih dahulu.', 'warning');
    return;
  }

  if (!sqliteDb) {
    resultContainer.innerHTML = '<div class="p-3 text-center text-rose-400">Database SQLite belum siap.</div>';
    return;
  }

  const startTime = performance.now();
  try {
    const results = sqliteDb.exec(sql);
    const duration = (performance.now() - startTime).toFixed(2);
    syncSqliteDb();

    if (metaBadge) {
      metaBadge.textContent = `${duration} ms`;
    }

    if (!results || results.length === 0) {
      resultContainer.innerHTML = `
        <div class="p-3 text-center text-emerald-400 text-xs">
          Query berhasil dieksekusi tanpa error.
        </div>
      `;
      logDosenActivity('EXEC_SQL', `Dosen menjalankan SQL: ${sql.slice(0, 80)}...`);
      return;
    }

    const lastRes = results[results.length - 1];
    const columns = lastRes.columns || [];
    const values = lastRes.values || [];

    let tableHtml = `
      <div class="overflow-x-auto w-full">
        <div class="text-[10px] text-stone-500 mb-1.5 font-mono-code">${values.length} baris data:</div>
        <table class="w-full text-left border-collapse text-xs">
          <thead>
            <tr class="bg-stone-800 text-stone-300 border-b border-stone-700">
              ${columns.map(c => `<th class="py-1.5 px-2.5 font-semibold font-mono-code text-[11px]">${escapeHtml(c)}</th>`).join('')}
            </tr>
          </thead>
          <tbody class="divide-y divide-stone-800/80 bg-stone-900/60 font-mono-code text-[11px]">
            ${values.map(row => `
              <tr class="hover:bg-stone-800/40">
                ${row.map(cell => `<td class="py-1.5 px-2.5 text-stone-200">${escapeHtml(cell)}</td>`).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

    resultContainer.innerHTML = tableHtml;
    logDosenActivity('EXEC_SQL', `Dosen menjalankan SELECT (${values.length} baris)`);
  } catch (err) {
    if (metaBadge) metaBadge.textContent = 'Error';
    resultContainer.innerHTML = `
      <div class="p-3 rounded-xl bg-rose-950/60 border border-rose-500/30 text-rose-300 text-xs font-mono-code">
        ${escapeHtml(err.message)}
      </div>
    `;
  }
}

// 15. AUDIT LOGS
function renderAuditLogs() {
  const tbody = document.getElementById('auditLogsTbody');
  if (!tbody) return;

  if (!sqliteDb) {
    tbody.innerHTML = '<tr><td colspan="6" class="p-3 text-center text-stone-500">Database SQLite offline</td></tr>';
    return;
  }

  try {
    ensureSqliteTables();
    const res = sqliteDb.exec("SELECT id, timestamp, nrp, role, aksi, detail FROM log_aktivitas ORDER BY id DESC LIMIT 50");
    if (!res || !res[0] || !res[0].values || res[0].values.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="p-3 text-center text-stone-500">Belum ada riwayat aktivitas yang tercatat.</td></tr>';
      return;
    }

    tbody.innerHTML = res[0].values.map(row => {
      const isAutoSubmit = String(row[4]).includes('AUTO_SUBMIT') || String(row[5]).includes('Buka Tab');
      const aksiBadge = isAutoSubmit
        ? `<span class="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold text-[10px] border border-rose-500/30">${escapeHtml(row[4])}</span>`
        : `<span class="px-2 py-0.5 rounded bg-stone-800 text-stone-300 font-medium text-[10px] border border-stone-700">${escapeHtml(row[4])}</span>`;

      return `
        <tr class="hover:bg-stone-900/60 font-mono-code text-[11px]">
          <td class="py-2 px-3 text-center text-stone-500">${row[0]}</td>
          <td class="py-2 px-3 text-stone-400 whitespace-nowrap">${escapeHtml(row[1])}</td>
          <td class="py-2 px-3 font-semibold text-white">${escapeHtml(row[2])}</td>
          <td class="py-2 px-3 text-amber-300 uppercase text-[10px]">${escapeHtml(row[3])}</td>
          <td class="py-2 px-3">${aksiBadge}</td>
          <td class="py-2 px-3 text-stone-300 break-words">${escapeHtml(row[5])}</td>
        </tr>
      `;
    }).join('');
  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="6" class="p-3 text-center text-rose-400">Gagal memuat log audit: ${escapeHtml(e.message)}</td></tr>`;
  }
}

// 16. AUTHENTICATION & SESSION
function setDosenLoggedIn(nama) {
  currentDosenUser = { nama, role: 'dosen' };
  sessionStorage.setItem(DOSEN_SESSION_KEY, JSON.stringify(currentDosenUser));

  document.getElementById('dosenLoginView').classList.add('hidden');
  document.getElementById('dosenDashboardView').classList.remove('hidden');

  const headerInfo = document.getElementById('dosenHeaderInfo');
  if (headerInfo) {
    headerInfo.classList.remove('hidden');
    headerInfo.classList.add('flex');
    document.getElementById('headerDosenName').textContent = nama;
    document.getElementById('dosenInitials').textContent = nama.charAt(0).toUpperCase();
  }

  logDosenActivity('LOGIN_DOSEN', `Dosen ${nama} berhasil login.`);
  updateSupabaseStatusBadge();
  renderStudentRecords();
  renderGradeDistribution();
  renderDosenQuestions();
  renderAuditLogs();
  refreshStudentsFromCloud(true);
  initSupabaseRealtimeSubscription();
}

function logoutDosen() {
  currentDosenUser = null;
  sessionStorage.removeItem(DOSEN_SESSION_KEY);

  document.getElementById('dosenDashboardView').classList.add('hidden');
  document.getElementById('dosenLoginView').classList.remove('hidden');

  const headerInfo = document.getElementById('dosenHeaderInfo');
  if (headerInfo) {
    headerInfo.classList.add('hidden');
    headerInfo.classList.remove('flex');
  }

  const inNama = document.getElementById('inputDosenNama');
  if (inNama) inNama.value = '';
  const inPass = document.getElementById('inputDosenPassword');
  if (inPass) inPass.value = '';

  showToast('Sesi Dosen telah ditutup.', 'info');
}

// 17. INITIALIZATION
window.addEventListener('DOMContentLoaded', async () => {
  await initSqliteEngine();

  // Check saved session
  try {
    const rawSession = sessionStorage.getItem(DOSEN_SESSION_KEY);
    if (rawSession) {
      const sess = JSON.parse(rawSession);
      if (sess && sess.nama) {
        setDosenLoggedIn(sess.nama);
      }
    }
  } catch (e) {}

  // Login form
  const loginForm = document.getElementById('dosenLoginForm');
  loginForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const nama = document.getElementById('inputDosenNama')?.value.trim();
    const pass = document.getElementById('inputDosenPassword')?.value;
    const errBox = document.getElementById('dosenLoginErrorBox');

    if (!nama || nama.length < 2) {
      errBox.textContent = 'Masukkan Nama Dosen / Pengawas dengan benar.';
      errBox.classList.remove('hidden');
      return;
    }

    if (pass !== DOSEN_PASSWORD) {
      errBox.textContent = 'Password pengawas salah. Silakan coba kembali.';
      errBox.classList.remove('hidden');
      showToast('Password Dosen salah!', 'error');
      return;
    }

    errBox.classList.add('hidden');
    setDosenLoggedIn(nama);
    showToast(`Selamat datang, ${nama}!`, 'success');
  });

  // Password toggle
  document.getElementById('btnToggleDosenPassword')?.addEventListener('click', () => {
    const input = document.getElementById('inputDosenPassword');
    if (input) {
      input.type = input.type === 'password' ? 'text' : 'password';
    }
  });

  // Logout
  document.getElementById('btnLogoutDosen')?.addEventListener('click', logoutDosen);

  // Filters
  document.getElementById('searchStudentInput')?.addEventListener('input', renderStudentRecords);
  document.getElementById('filterClassSelect')?.addEventListener('change', renderStudentRecords);
  document.getElementById('filterStatusSelect')?.addEventListener('change', renderStudentRecords);

  // Supabase Cloud Modal Controls
  document.getElementById('btnOpenSupabaseModal')?.addEventListener('click', () => {
    const cfg = getStoredSupabaseConfig();
    const inUrl = document.getElementById('inputSupabaseUrl');
    const inKey = document.getElementById('inputSupabaseAnonKey');
    if (inUrl) inUrl.value = cfg.url || '';
    if (inKey) inKey.value = cfg.anonKey || '';
    document.getElementById('supabaseConfigModal')?.classList.remove('hidden');
  });

  document.getElementById('btnCloseSupabaseModal')?.addEventListener('click', () => {
    document.getElementById('supabaseConfigModal')?.classList.add('hidden');
  });

  document.getElementById('btnCancelSupabaseModal')?.addEventListener('click', () => {
    document.getElementById('supabaseConfigModal')?.classList.add('hidden');
  });

  document.getElementById('btnCopySupabaseSql')?.addEventListener('click', () => {
    navigator.clipboard.writeText(SUPABASE_INIT_SQL).then(() => {
      showToast('Script SQL Supabase disalin ke clipboard! Buka SQL Editor di Supabase lalu paste & run.', 'success');
    });
  });

  document.getElementById('btnClearSupabaseConfig')?.addEventListener('click', () => {
    saveSupabaseConfig('', '');
    cloudStudentsCache = [];
    updateSupabaseStatusBadge();
    renderStudentRecords();
    renderGradeDistribution();
    document.getElementById('supabaseConfigModal')?.classList.add('hidden');
    showToast('Konfigurasi Supabase dihapus. Dashboard kembali ke mode SQLite lokal.', 'info');
  });

  document.getElementById('supabaseConfigForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const url = document.getElementById('inputSupabaseUrl')?.value.trim();
    const anonKey = document.getElementById('inputSupabaseAnonKey')?.value.trim();

    if (!url.startsWith('https://') || !anonKey) {
      showToast('Masukkan URL (https://) dan Anon Key yang valid.', 'error');
      return;
    }

    saveSupabaseConfig(url, anonKey);
    updateSupabaseStatusBadge();
    showToast('Menghubungkan ke Supabase...', 'info');

    const testRes = await fetchStudentsFromCloud();
    if (testRes.success) {
      cloudStudentsCache = testRes.data;
      renderStudentRecords();
      renderGradeDistribution();
      initSupabaseRealtimeSubscription();
      document.getElementById('supabaseConfigModal')?.classList.add('hidden');
      showToast(`Koneksi Supabase Sukses! Terdeteksi ${cloudStudentsCache.length} peserta di Cloud.`, 'success');
    } else {
      showToast(`Terkoneksi ke server tapi tabel belum dibuat: ${testRes.error || 'Pastikan script SQL sudah dijalankan di Supabase'}.`, 'warning');
    }
  });

  // Refresh
  document.getElementById('btnRefreshData')?.addEventListener('click', async () => {
    await initSqliteEngine();
    await refreshStudentsFromCloud(false);
    renderStudentRecords();
    renderGradeDistribution();
    showToast('Data diperbarui dari SQLite & Cloud.', 'success');
  });

  // Export buttons
  document.getElementById('btnExportCsv')?.addEventListener('click', exportToCsv);
  document.getElementById('btnExportJson')?.addEventListener('click', exportToJson);
  document.getElementById('btnDownloadSqliteMaster')?.addEventListener('click', downloadSqliteMaster);

  // Clear all
  document.getElementById('btnClearAllStudents')?.addEventListener('click', () => {
    document.getElementById('clearAllConfirmModal').classList.remove('hidden');
  });
  document.getElementById('btnCancelClearAll')?.addEventListener('click', () => {
    document.getElementById('clearAllConfirmModal').classList.add('hidden');
  });
  document.getElementById('btnConfirmClearAll')?.addEventListener('click', clearAllStudentData);

  // Unlock remedial
  document.getElementById('btnCancelUnlock')?.addEventListener('click', () => {
    document.getElementById('unlockConfirmModal').classList.add('hidden');
    pendingUnlockStudent = null;
  });
  document.getElementById('btnConfirmUnlock')?.addEventListener('click', confirmUnlockStudent);

  // Delete student
  document.getElementById('btnCancelDeleteStudent')?.addEventListener('click', () => {
    document.getElementById('deleteStudentConfirmModal').classList.add('hidden');
    pendingDeleteStudent = null;
  });
  document.getElementById('btnConfirmDeleteStudent')?.addEventListener('click', confirmDeleteStudent);

  // Detail modal
  document.getElementById('btnCloseDetailModal')?.addEventListener('click', () => {
    document.getElementById('studentDetailModal').classList.add('hidden');
  });
  document.getElementById('btnCloseDetailModalBottom')?.addEventListener('click', () => {
    document.getElementById('studentDetailModal').classList.add('hidden');
  });

  // Copy single text
  document.getElementById('btnExportSingleStudent')?.addEventListener('click', () => {
    const nama = document.getElementById('detailNama').textContent;
    const nrp = document.getElementById('detailNrp').textContent;
    const score = document.getElementById('detailScore').textContent;
    const grade = document.getElementById('detailGrade').textContent;
    const duration = document.getElementById('detailDuration').textContent;
    const textToCopy = `LEMBAR ASESMEN MAHASISWA:\nNama: ${nama}\n${nrp}\nNilai: ${score} (${grade})\n${duration}`;
    navigator.clipboard.writeText(textToCopy).then(() => {
      showToast('Lembar jawaban disalin ke clipboard.', 'success');
    });
  });

  // SQL Console
  document.getElementById('btnRunDosenQuery')?.addEventListener('click', executeDosenSql);
  document.getElementById('btnClearDosenSql')?.addEventListener('click', () => {
    const ta = document.getElementById('dosenSqlTextarea');
    if (ta) ta.value = '';
    const res = document.getElementById('dosenQueryResultContainer');
    if (res) res.innerHTML = 'Konsol SQL dibersihkan.';
  });

  document.querySelectorAll('.sql-dosen-snippet').forEach(btn => {
    btn.addEventListener('click', () => {
      const sql = btn.getAttribute('data-dosen-sql');
      const ta = document.getElementById('dosenSqlTextarea');
      if (ta && sql) {
        ta.value = sql;
        executeDosenSql();
      }
    });
  });

  document.getElementById('btnRefreshAudit')?.addEventListener('click', () => {
    renderAuditLogs();
    showToast('Audit trail diperbarui.', 'info');
  });
});
