/**
 * ============================================================================
 * SQLCaseLab — Sistem Asesmen Praktikum Pemrograman Database
 * ITENAS Bandung - Pemrograman Database
 * 
 * Modul: app.js
 * Fitur:
 * 1. Tailwind Configuration Theme Integration
 * 2. SQLite Database Persistence (sql.js WASM + IndexedDB & LocalStorage storage)
 * 3. Role Management (Mahasiswa vs Dosen / Pengawas)
 * 4. Interactive ERD & TRD Visual Builders
 * 5. In-Browser Live SQLite 3 Engine Execution & Native Fallback
 * 6. Automated Multi-Tier Grading Engine
 * 7. Anti-Cheat Monitoring (Tab-switch & Blur Auto-Submit)
 * 8. Real-time Persistence & Export (.sqlite, .json, Text Report)
 * ============================================================================
 */

// 1. TAILWIND THEME CONFIGURATION
if (window.tailwind) {
  window.tailwind.config = {
    theme: {
      extend: {
        colors: {
          brand: {
            50: '#fff7ed',
            100: '#ffedd5',
            200: '#fed7aa',
            300: '#fdba74',
            400: '#fb923c',
            500: '#f97316',
            600: '#ea580c',
            700: '#c2410c',
            800: '#9a3412',
            900: '#7c2d12',
            950: '#431407',
          }
        }
      }
    }
  };
}

/********************************************************************
 * 0. ROLE MANAGEMENT & CONSTANTS
 ********************************************************************/
const DOSEN_PASSWORD = 'dosen2026';
let currentLoginRole = 'mahasiswa'; // 'mahasiswa' or 'dosen'
let currentUserRole = null; // set after authentication

function switchLoginRole(role) {
  currentLoginRole = role;
  const tabM = document.getElementById('roleTabMahasiswa');
  const tabD = document.getElementById('roleTabDosen');
  const fieldsM = document.getElementById('mahasiswaFields');
  const fieldsD = document.getElementById('dosenFields');
  const btnDemo = document.getElementById('btnFillDemoStudent');
  const btnText = document.getElementById('loginBtnText');

  const activeClass = 'flex-1 py-2.5 px-3 rounded-lg text-xs font-semibold transition bg-brand-600 text-white shadow-lg shadow-brand-600/20';
  const inactiveClass = 'flex-1 py-2.5 px-3 rounded-lg text-xs font-semibold transition text-stone-400 hover:text-white';

  if (tabM && tabD) {
    if (role === 'mahasiswa') {
      tabM.className = activeClass;
      tabD.className = inactiveClass;
    } else {
      tabD.className = activeClass;
      tabM.className = inactiveClass;
    }
  }
  if (fieldsM) fieldsM.classList.toggle('hidden', role !== 'mahasiswa');
  if (fieldsD) fieldsD.classList.toggle('hidden', role === 'mahasiswa');
  if (btnDemo) btnDemo.classList.toggle('hidden', role !== 'mahasiswa');
  if (btnText) btnText.textContent = role === 'mahasiswa' ? 'Mulai Kerjakan Studi Kasus' : 'Masuk sebagai Dosen / Pengawas';

  const errBox = document.getElementById('loginErrorBox');
  if (errBox) errBox.classList.add('hidden');
}

function togglePasswordVisibility() {
  const input = document.getElementById('inputDosenPassword');
  if (input) {
    input.type = input.type === 'password' ? 'text' : 'password';
  }
}

function applyRoleRestrictions() {
  const dosenOnlyElements = document.querySelectorAll('.dosen-only-feature');
  const roleBadge = document.getElementById('roleBadge');
  const proctorBadge = document.getElementById('proctorBadge');
  const completedSection = document.getElementById('completedStudentsSection');

  if (currentUserRole === 'dosen') {
    dosenOnlyElements.forEach(el => el.classList.remove('hidden'));
    if (roleBadge) {
      roleBadge.classList.remove('hidden');
      roleBadge.className = 'text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30';
      roleBadge.innerHTML = '<span class="flex items-center gap-1">🔑 Mode Dosen / Pengawas</span>';
    }
    if (completedSection) completedSection.classList.remove('hidden');
    if (proctorBadge) proctorBadge.classList.add('hidden');
  } else {
    dosenOnlyElements.forEach(el => el.classList.add('hidden'));
    if (roleBadge) {
      roleBadge.classList.remove('hidden');
      roleBadge.className = 'text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-brand-500/15 text-brand-300 border border-brand-500/30';
      roleBadge.innerHTML = '👤 Mahasiswa';
    }
    if (completedSection) completedSection.classList.add('hidden');
    if (proctorBadge) {
      proctorBadge.classList.remove('hidden');
      proctorBadge.classList.add('sm:inline-flex');
    }
  }
}

/********************************************************************
 * 1. SQLITE DATABASE PERSISTENCE LAYER (IndexedDB + LocalStorage)
 ********************************************************************/
const IDB_DB_NAME = 'SQLCaseLab_SQLiteStorage';
const IDB_STORE_NAME = 'sqlite_databases';
const IDB_KEY_BINARY = 'asesmen_database_binary';
const LOCAL_STORAGE_B64_KEY = 'sqlcaselab_sqlite_b64_backup';

function openIndexedDb() {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      resolve(null);
      return;
    }
    const request = indexedDB.open(IDB_DB_NAME, 1);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(IDB_STORE_NAME)) {
        db.createObjectStore(IDB_STORE_NAME);
      }
    };
    request.onsuccess = (e) => resolve(e.target.result);
    request.onerror = () => resolve(null);
  });
}

async function loadSqliteBinaryFromStorage() {
  try {
    const idb = await openIndexedDb();
    if (idb) {
      const tx = idb.transaction(IDB_STORE_NAME, 'readonly');
      const store = tx.objectStore(IDB_STORE_NAME);
      const req = store.get(IDB_KEY_BINARY);
      const result = await new Promise(res => {
        req.onsuccess = () => res(req.result);
        req.onerror = () => res(null);
      });
      if (result instanceof Uint8Array || result instanceof ArrayBuffer) {
        return new Uint8Array(result);
      }
    }
  } catch (e) {
    console.warn('IDB load failed, trying localStorage fallback:', e);
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
  } catch (e) {
    console.warn('IDB save failed:', e);
  }

  // Backup in localStorage if under 4MB
  try {
    if (uint8Array.length < 3500000) {
      let binaryStr = '';
      const len = uint8Array.byteLength;
      for (let i = 0; i < len; i++) {
        binaryStr += String.fromCharCode(uint8Array[i]);
      }
      const b64 = btoa(binaryStr);
      localStorage.setItem(LOCAL_STORAGE_B64_KEY, b64);
    }
  } catch (e) {}
}

/********************************************************************
 * 2. RANCANGAN ERD & TRD STUDI KASUS MULTI-KELAS (A, B, C)
 * Data soal dan skema diambil secara dinamis dari cases-config.js
 * Tanpa spoiler jawaban di starterQuery!
 ********************************************************************/
function getActiveCaseStudy() {
  const k = (appState && appState.student && appState.student.kelas) ? appState.student.kelas : 'Kelas A';
  if (typeof getClassCaseStudy === 'function') {
    return getClassCaseStudy(k);
  }
  if (typeof CASE_STUDY_CLASSES !== 'undefined') {
    return CASE_STUDY_CLASSES['Kelas A'];
  }
  return null;
}

let SCHEMA_METADATA = (typeof CASE_STUDY_CLASSES !== 'undefined' && CASE_STUDY_CLASSES['Kelas A']) ? CASE_STUDY_CLASSES['Kelas A'].schemaMetadata : [];
let CASE_STUDY_QUESTIONS = (typeof CASE_STUDY_CLASSES !== 'undefined' && CASE_STUDY_CLASSES['Kelas A']) ? CASE_STUDY_CLASSES['Kelas A'].questions : [];

function syncCaseStudyData() {
  const cs = getActiveCaseStudy();
  if (cs) {
    SCHEMA_METADATA = cs.schemaMetadata;
    CASE_STUDY_QUESTIONS = cs.questions;
    currentDatabaseName = `${cs.dbName}.sqlite`;
    jsCatalog.activeDb = `${cs.dbName}.sqlite`;
  }
}

/********************************************************************
 * 4. REAL IN-BROWSER SQL ENGINE (SQLite WASM + Persistent Storage)
 ********************************************************************/
let sqliteDb = null;
let activeEngineType = 'SQLite 3 WASM';
let currentDatabaseName = 'klinik_sehatkampus.sqlite';

let jsCatalog = {
  databases: ['information_schema', 'default_workspace'],
  activeDb: 'klinik_sehatkampus.sqlite',
  tables: {}
};

/**
 * Inisialisasi tabel sistem asesmen di SQLite:
 * - peserta_asesmen (menyimpan nama, nrp, kelas, skor, grade, status)
 * - riwayat_jawaban (menyimpan log setiap submit query)
 * - log_aktivitas (audit log login, waktu, auto-submit)
 */
function ensureSqliteAssessmentTables() {
  if (!sqliteDb) return;
  try {
    sqliteDb.run(`
      CREATE TABLE IF NOT EXISTS peserta_asesmen (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nama TEXT NOT NULL,
        nrp TEXT NOT NULL UNIQUE,
        kelas TEXT,
        score INTEGER DEFAULT 0,
        grade TEXT,
        solved_count INTEGER DEFAULT 0,
        duration TEXT,
        completed_at TEXT,
        status TEXT,
        jawaban_json TEXT
      );

      CREATE TABLE IF NOT EXISTS riwayat_jawaban (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nrp TEXT NOT NULL,
        nama TEXT NOT NULL,
        soal_id INTEGER NOT NULL,
        query TEXT,
        points INTEGER DEFAULT 0,
        solved INTEGER DEFAULT 0,
        timestamp TEXT
      );

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
    console.error('Error creating SQLite system tables:', e);
  }
}

async function initSqlEngines() {
  const badge = document.getElementById('engineBadge');
  if (typeof window.initSqlJs === 'function') {
    try {
      const SQL = await window.initSqlJs({
        locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/${file}`
      });

      // Load existing SQLite binary if available in storage
      const existingBinary = await loadSqliteBinaryFromStorage();
      if (existingBinary && existingBinary.length > 0) {
        try {
          sqliteDb = new SQL.Database(existingBinary);
          console.log('SQLite database loaded from persistent storage.');
        } catch (loadErr) {
          sqliteDb = new SQL.Database();
        }
      } else {
        sqliteDb = new SQL.Database();
      }

      ensureSqliteAssessmentTables();
      activeEngineType = 'SQLite 3 (WASM)';
      if (badge) badge.textContent = 'SQLite 3 WASM Aktif';
      return;
    } catch (err) {
      console.warn('WASM SQLite init failed, using fallback:', err);
      sqliteDb = null;
    }
  }
  activeEngineType = 'Native DDL/DML SQL Engine';
  if (badge) badge.textContent = 'Live SQL Engine Aktif';
}

/**
 * Menyimpan binary database SQLite saat ini ke browser storage (IndexedDB)
 */
async function syncAndPersistSqliteDatabase() {
  if (sqliteDb && typeof sqliteDb.export === 'function') {
    try {
      const binary = sqliteDb.export();
      await persistSqliteBinaryToStorage(binary);
      // Brief visual flash on engine badge if available
      const badge = document.getElementById('engineBadge');
      if (badge) {
        badge.classList.add('db-flash');
        setTimeout(() => badge.classList.remove('db-flash'), 1000);
      }
    } catch (e) {
      console.warn('Persist SQLite error:', e);
    }
  }
}

/**
 * Reset data tabel studi kasus tanpa menghapus tabel peserta asesmen di SQLite
 */
function resetAllDatabases() {
  currentDatabaseName = 'default_workspace';
  jsCatalog = {
    databases: ['information_schema', 'default_workspace'],
    activeDb: 'klinik_sehatkampus.sqlite',
    tables: {}
  };

  if (sqliteDb) {
    try {
      const tblRes = sqliteDb.exec("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT IN ('peserta_asesmen', 'riwayat_jawaban', 'log_aktivitas')");
      if (tblRes && tblRes[0]) {
        tblRes[0].values.forEach(r => {
          try { sqliteDb.run(`DROP TABLE IF EXISTS ${r[0]}`); } catch (e) {}
        });
      }
    } catch (e) {}
  }
  syncAndPersistSqliteDatabase();
}

let erdDesignState = { ent1Name: '', ent1Pk: '', ent1Attrs: '', entRelName: '', entRelAttrs: '', cardinality: '', ent2Name: '', ent2Pk: '', ent2Attrs: '' };
let trdDesignState = { dokterPk: '', dokterFk: '', kunjunganPk: '', kunjunganFk1: '', kunjunganFk2: '', pasienPk: '', pasienDateType: '' };

function renderLiveErdCanvas() {
  const container = document.getElementById('erdVisualCanvas');
  if (!container) return;
  const cs = getActiveCaseStudy();
  const exp = cs ? cs.erdExpected : { ent1Name: 'DOKTER', entRelName: 'KUNJUNGAN', ent2Name: 'PASIEN' };

  const e1 = erdDesignState.ent1Name || '[Entitas #1?]';
  const e1pk = erdDesignState.ent1Pk || 'pk?';
  const e1a = erdDesignState.ent1Attrs || 'atribut?';
  const erel = erdDesignState.entRelName || '[Relasi/Transaksi?]';
  const erela = erdDesignState.entRelAttrs || 'atribut?';
  const card = erdDesignState.cardinality || '? : ?';
  const e2 = erdDesignState.ent2Name || '[Entitas #2?]';
  const e2pk = erdDesignState.ent2Pk || 'pk?';
  const e2a = erdDesignState.ent2Attrs || 'atribut?';

  container.innerHTML = `
    <div class="w-full grid grid-cols-1 sm:grid-cols-3 items-center gap-3 text-center font-mono-code text-xs">
      <div class="p-3 rounded-xl bg-stone-900 border-2 ${erdDesignState.ent1Name === exp.ent1Name ? 'border-emerald-500/60' : 'border-brand-500/40'}">
        <div class="font-bold text-white text-sm">[ ${escapeHtml(e1)} ]</div>
        <div class="mt-1.5 text-[11px] text-amber-300 underline">PK: ${escapeHtml(e1pk)}</div>
        <div class="text-[10px] text-stone-400 mt-0.5">${escapeHtml(e1a)}</div>
      </div>
      <div class="flex flex-col items-center justify-center gap-1">
        <span class="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
          Kardinalitas: ${escapeHtml(card)}
        </span>
        <div class="w-full p-2.5 rounded-xl bg-amber-500/15 border-2 ${erdDesignState.entRelName === exp.entRelName ? 'border-emerald-500/60' : 'border-amber-400/50'}">
          <div class="font-bold text-amber-300">&lt; ${escapeHtml(erel)} &gt;</div>
          <div class="text-[10px] text-stone-300 mt-1">${escapeHtml(erela)}</div>
        </div>
      </div>
      <div class="p-3 rounded-xl bg-stone-900 border-2 ${erdDesignState.ent2Name === exp.ent2Name ? 'border-emerald-500/60' : 'border-brand-500/40'}">
        <div class="font-bold text-white text-sm">[ ${escapeHtml(e2)} ]</div>
        <div class="mt-1.5 text-[11px] text-amber-300 underline">PK: ${escapeHtml(e2pk)}</div>
        <div class="text-[10px] text-stone-400 mt-0.5">${escapeHtml(e2a)}</div>
      </div>
    </div>
  `;
}

function renderLiveTrdCanvas() {
  const container = document.getElementById('trdVisualCanvas');
  if (!container) return;
  const cs = getActiveCaseStudy();
  const m1 = cs ? cs.master1Name : 'dokter';
  const m2 = cs ? cs.master2Name : 'pasien';
  const rel = cs ? cs.relName : 'kunjungan';

  const dPk = trdDesignState.dokterPk || 'PK belum dipilih';
  const dFk = trdDesignState.dokterFk === 'NONE' ? `Tanpa FK (Tabel ${m1})` : (trdDesignState.dokterFk || 'FK?');
  const kPk = trdDesignState.kunjunganPk || 'PK belum dipilih';
  const kFk1 = trdDesignState.kunjunganFk1 || 'FK #1 belum dipilih';
  const kFk2 = trdDesignState.kunjunganFk2 || 'FK #2 belum dipilih';
  const pPk = trdDesignState.pasienPk || 'PK belum dipilih';
  const pDate = trdDesignState.pasienDateType || 'Tipe?';

  container.innerHTML = `
    <div class="w-full grid grid-cols-1 sm:grid-cols-3 items-stretch gap-3 font-mono-code text-xs">
      <div class="p-3 rounded-xl bg-stone-900 border border-stone-700 flex flex-col justify-between">
        <div>
          <div class="font-bold text-brand-300 border-b border-stone-800 pb-1 mb-1.5">TABEL: ${escapeHtml(m1)} (1)</div>
          <div class="text-[11px] text-amber-300">PK: ${escapeHtml(dPk)}</div>
        </div>
        <div class="mt-2 pt-1.5 border-t border-stone-800 text-[10px] text-stone-400">${escapeHtml(dFk)}</div>
      </div>
      <div class="p-3 rounded-xl bg-brand-950/30 border-2 border-amber-500/50 flex flex-col justify-between">
        <div>
          <div class="font-bold text-amber-300 border-b border-stone-800 pb-1 mb-1.5">TABEL: ${escapeHtml(rel)} (N)</div>
          <div class="text-[11px] text-amber-300">PK: ${escapeHtml(kPk)}</div>
          <div class="text-[11px] text-amber-300">FK1: ${escapeHtml(kFk1)}</div>
          <div class="text-[11px] text-amber-300">FK2: ${escapeHtml(kFk2)}</div>
        </div>
        <div class="mt-2 pt-1.5 border-t border-stone-800 text-[10px] text-emerald-300">1 ───&lt; N dari ${escapeHtml(m1)} &amp; ${escapeHtml(m2)}</div>
      </div>
      <div class="p-3 rounded-xl bg-stone-900 border border-stone-700 flex flex-col justify-between">
        <div>
          <div class="font-bold text-brand-300 border-b border-stone-800 pb-1 mb-1.5">TABEL: ${escapeHtml(m2)} (1)</div>
          <div class="text-[11px] text-amber-300">PK: ${escapeHtml(pPk)}</div>
          <div class="text-[11px] text-stone-300">Tipe: ${escapeHtml(pDate)}</div>
        </div>
        <div class="mt-2 pt-1.5 border-t border-stone-800 text-[10px] text-stone-400">Tabel Master Sisi 1</div>
      </div>
    </div>
  `;
}

function syncVisualDesignToEditor() {
  const q = CASE_STUDY_QUESTIONS.find(item => item.id === appState.activeQuestionId);
  const editor = document.getElementById('sqlEditorTextarea');
  if (!q || !editor) return;
  const cs = getActiveCaseStudy();
  const m1 = cs ? cs.master1Name : 'dokter';
  const m2 = cs ? cs.master2Name : 'pasien';
  const rel = cs ? cs.relName : 'kunjungan';

  if (q.type === 'DESIGN_ERD') {
    editor.value = [
      '-- RINGKASAN RANCANGAN ERD MAHASISWA:',
      `-- Entitas Master 1 : ${erdDesignState.ent1Name || '?'} (PK: ${erdDesignState.ent1Pk || '?'}, Atribut: ${erdDesignState.ent1Attrs || '?'})`,
      `-- Entitas Transaksi: ${erdDesignState.entRelName || '?'} (Atribut: ${erdDesignState.entRelAttrs || '?'})`,
      `-- Kardinalitas     : ${erdDesignState.cardinality || '?'}`,
      `-- Entitas Master 2 : ${erdDesignState.ent2Name || '?'} (PK: ${erdDesignState.ent2Pk || '?'}, Atribut: ${erdDesignState.ent2Attrs || '?'})`
    ].join('\n');
    saveCurrentEditorDraft();
  } else if (q.type === 'DESIGN_TRD') {
    editor.value = [
      '-- RINGKASAN TRANSFORMASI TRD MAHASISWA:',
      `-- Tabel ${m1}    : PK(${trdDesignState.dokterPk || '?'}), FK(${trdDesignState.dokterFk || '?'})`,
      `-- Tabel ${rel} : PK(${trdDesignState.kunjunganPk || '?'}), FK1(${trdDesignState.kunjunganFk1 || '?'}), FK2(${trdDesignState.kunjunganFk2 || '?'})`,
      `-- Tabel ${m2}    : PK(${trdDesignState.pasienPk || '?'}), Kolom(${trdDesignState.pasienDateType || '?'})`
    ].join('\n');
    saveCurrentEditorDraft();
  }
}

let selectedPaletteChip = null;

function renderSlotContent(slotEl, val, label) {
  if (!slotEl) return;
  if (!val) {
    slotEl.classList.remove('filled');
    const accept = slotEl.getAttribute('data-accept') || '';
    let placeholder = 'Drop di sini';
    if (accept.includes('entity')) placeholder = 'Drop Entitas di sini';
    else if (accept.includes('pk')) placeholder = 'Drop PK di sini';
    else if (accept.includes('attr')) placeholder = 'Drop Atribut di sini';
    else if (accept.includes('cardinality')) placeholder = 'Drop Kardinalitas di sini';
    else if (accept.includes('trd-fk')) placeholder = 'Drop Aturan FK di sini';
    else if (accept.includes('trd-type')) placeholder = 'Drop Tipe Data di sini';
    slotEl.innerHTML = `<span class="placeholder-text text-stone-500 text-xs">${placeholder}</span>`;
    return;
  }
  slotEl.classList.add('filled');
  slotEl.innerHTML = `
    <div class="w-full flex items-center justify-between gap-1.5 px-2 py-1 rounded bg-stone-900 border border-amber-500/50 text-amber-300 font-mono-code text-xs">
      <span class="truncate font-semibold">${escapeHtml(label || val)}</span>
      <button type="button" class="btn-clear-slot text-stone-400 hover:text-rose-400 px-1 rounded transition text-sm leading-none font-bold" title="Keluarkan item">&times;</button>
    </div>
  `;
}

function updatePaletteUsedState(containerId, stateObj) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const valuesInUse = Object.values(stateObj).filter(Boolean);
  container.querySelectorAll('.drag-chip').forEach(chip => {
    const val = chip.getAttribute('data-val');
    if (valuesInUse.includes(val)) {
      chip.classList.add('is-placed');
    } else {
      chip.classList.remove('is-placed');
    }
  });
}

function syncErdSlotsFromState() {
  document.querySelectorAll('#erdBuilderPanel .drop-slot').forEach(slot => {
    const key = slot.getAttribute('data-slot');
    const val = erdDesignState[key];
    let label = val;
    if (val) {
      const chip = document.querySelector(`#erdPaletteContainer .drag-chip[data-val="${CSS.escape(val)}"]`);
      if (chip) label = chip.textContent.trim();
    }
    renderSlotContent(slot, val, label);
  });
  updatePaletteUsedState('erdPaletteContainer', erdDesignState);
}

function syncTrdSlotsFromState() {
  document.querySelectorAll('#trdBuilderPanel .drop-slot').forEach(slot => {
    const key = slot.getAttribute('data-slot');
    const val = trdDesignState[key];
    let label = val;
    if (val) {
      const chip = document.querySelector(`#trdPaletteContainer .drag-chip[data-val="${CSS.escape(val)}"]`);
      if (chip) label = chip.textContent.trim();
    }
    renderSlotContent(slot, val, label);
  });
  updatePaletteUsedState('trdPaletteContainer', trdDesignState);
}

function placeChipInSlot(slotEl, type, val, label, isErd) {
  const slotAccept = slotEl.getAttribute('data-accept');
  if (slotAccept !== type) {
    showToast(`Komponen tipe "${type}" tidak sesuai untuk slot ini.`, 'error');
    return false;
  }
  const slotKey = slotEl.getAttribute('data-slot');
  if (isErd) {
    Object.keys(erdDesignState).forEach(k => {
      if (k !== slotKey && erdDesignState[k] === val) erdDesignState[k] = '';
    });
    erdDesignState[slotKey] = val;
    renderLiveErdCanvas();
    syncVisualDesignToEditor();
    syncErdSlotsFromState();
  } else {
    Object.keys(trdDesignState).forEach(k => {
      if (k !== slotKey && trdDesignState[k] === val) trdDesignState[k] = '';
    });
    trdDesignState[slotKey] = val;
    renderLiveTrdCanvas();
    syncVisualDesignToEditor();
    syncTrdSlotsFromState();
  }
  saveStateToStorage();
  return true;
}

function clearSlot(slotEl, isErd) {
  const slotKey = slotEl.getAttribute('data-slot');
  if (isErd) {
    erdDesignState[slotKey] = '';
    renderLiveErdCanvas();
    syncVisualDesignToEditor();
    syncErdSlotsFromState();
  } else {
    trdDesignState[slotKey] = '';
    renderLiveTrdCanvas();
    syncVisualDesignToEditor();
    syncTrdSlotsFromState();
  }
  saveStateToStorage();
}

function ensurePrerequisiteStateForQuestion(questionId) {
  const cs = getActiveCaseStudy();
  if (!cs) return;
  const m1 = cs.master1Name;
  const m2 = cs.master2Name;
  const rel = cs.relName;
  const db = cs.dbName;

  if (questionId >= 4) {
    if (!jsCatalog.databases.includes(db)) { jsCatalog.databases.push(db); }
    currentDatabaseName = `${db}.sqlite`;
    jsCatalog.activeDb = `${db}.sqlite`;

    if (!doesTableExist(m1)) {
      if (m1 === 'dokter') runRealSqlQuery('CREATE TABLE dokter (id_dokter INT PRIMARY KEY, nama_dokter VARCHAR(100), spesialis VARCHAR(50));');
      else if (m1 === 'anggota') runRealSqlQuery('CREATE TABLE anggota (id_anggota INT PRIMARY KEY, nama_anggota VARCHAR(100), jurusan VARCHAR(50));');
      else if (m1 === 'pelanggan') runRealSqlQuery('CREATE TABLE pelanggan (id_pelanggan INT PRIMARY KEY, nama_pelanggan VARCHAR(100), alamat VARCHAR(150));');
    }
    if (!doesTableExist(m2)) {
      if (m2 === 'pasien') runRealSqlQuery('CREATE TABLE pasien (id_pasien INT PRIMARY KEY, nama_pasien VARCHAR(100), tgl_lahir DATE);');
      else if (m2 === 'buku') runRealSqlQuery('CREATE TABLE buku (id_buku INT PRIMARY KEY, judul_buku VARCHAR(150), penulis VARCHAR(100));');
      else if (m2 === 'mobil') runRealSqlQuery('CREATE TABLE mobil (id_mobil INT PRIMARY KEY, merk_mobil VARCHAR(50), no_plat VARCHAR(20));');
    }
    if (!doesTableExist(rel)) {
      if (rel === 'kunjungan') runRealSqlQuery('CREATE TABLE kunjungan (id_kunjungan INT PRIMARY KEY, id_pasien INT, id_dokter INT, tgl_kunjungan DATE, diagnosa VARCHAR(150));');
      else if (rel === 'peminjaman') runRealSqlQuery('CREATE TABLE peminjaman (id_peminjaman INT PRIMARY KEY, id_anggota INT, id_buku INT, tgl_pinjam DATE, status_pinjam VARCHAR(30));');
      else if (rel === 'rental') runRealSqlQuery('CREATE TABLE rental (id_rental INT PRIMARY KEY, id_pelanggan INT, id_mobil INT, tgl_rental DATE, biaya_harian INT);');
    }
  }
  if (questionId >= 5) {
    const targetTable = cs.alterTable;
    const colName = cs.alterColumn;
    const cols = getTableColumns(targetTable).map(c => c.name.toLowerCase());
    if (!cols.includes(colName.toLowerCase())) {
      runRealSqlQuery(`ALTER TABLE ${targetTable} ADD COLUMN ${colName} VARCHAR(20);`);
    }
  }
  if (questionId === 6) {
    const targetTable = cs.alterTable;
    const rows = getTableRows(targetTable);
    if (rows.length === 0) {
      if (cs.seedRecords && cs.seedRecords.master2) {
        cs.seedRecords.master2.forEach(sql => runRealSqlQuery(sql));
      }
    }
  }
}

function renderDynamicPalettes() {
  const cs = getActiveCaseStudy();
  if (!cs) return;

  const erdContainer = document.getElementById('erdPaletteContainer');
  if (erdContainer && cs.erdPalette) {
    let html = '';
    // Entities
    cs.erdPalette.entities.forEach(item => {
      html += `<div draggable="true" class="drag-chip px-2.5 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 border border-brand-500/50 text-brand-300 font-mono-code text-xs font-bold shadow-sm" data-type="entity" data-val="${escapeHtml(item.val)}">${escapeHtml(item.label)}</div>`;
    });
    html += '<div class="h-6 w-px bg-stone-800 my-auto hidden sm:block"></div>';
    // PKs
    cs.erdPalette.pk.forEach(item => {
      html += `<div draggable="true" class="drag-chip px-2.5 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 border border-amber-500/40 text-amber-300 font-mono-code text-xs" data-type="pk" data-val="${escapeHtml(item.val)}">${escapeHtml(item.label)}</div>`;
    });
    html += '<div class="h-6 w-px bg-stone-800 my-auto hidden sm:block"></div>';
    // Attrs
    cs.erdPalette.attrs.forEach(item => {
      html += `<div draggable="true" class="drag-chip px-2.5 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 border border-stone-700 hover:border-stone-500 text-stone-200 font-mono-code text-xs" data-type="attr" data-val="${escapeHtml(item.val)}">${escapeHtml(item.label)}</div>`;
    });
    html += '<div class="h-6 w-px bg-stone-800 my-auto hidden sm:block"></div>';
    // Cardinalities
    cs.erdPalette.cardinalities.forEach(item => {
      html += `<div draggable="true" class="drag-chip px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono-code text-xs font-bold" data-type="cardinality" data-val="${escapeHtml(item.val)}">${escapeHtml(item.label)}</div>`;
    });
    erdContainer.innerHTML = html;
  }

  const trdContainer = document.getElementById('trdPaletteContainer');
  if (trdContainer && cs.trdPalette) {
    let html = '';
    // PKs
    cs.trdPalette.pk.forEach(item => {
      html += `<div draggable="true" class="drag-chip px-2.5 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 border border-amber-500/40 text-amber-300 font-mono-code text-xs" data-type="trd-pk" data-val="${escapeHtml(item.val)}">${escapeHtml(item.label)}</div>`;
    });
    html += '<div class="h-6 w-px bg-stone-800 my-auto hidden sm:block"></div>';
    // FKs
    cs.trdPalette.fk.forEach(item => {
      html += `<div draggable="true" class="drag-chip px-2.5 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 border border-emerald-500/40 text-emerald-300 font-mono-code text-xs font-bold" data-type="trd-fk" data-val="${escapeHtml(item.val)}">${escapeHtml(item.label)}</div>`;
    });
    html += '<div class="h-6 w-px bg-stone-800 my-auto hidden sm:block"></div>';
    // Types
    cs.trdPalette.types.forEach(item => {
      html += `<div draggable="true" class="drag-chip px-2.5 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 border border-stone-700 text-amber-300 font-mono-code text-xs font-bold" data-type="trd-type" data-val="${escapeHtml(item.val)}">${escapeHtml(item.label)}</div>`;
    });
    trdContainer.innerHTML = html;
  }

  // Update TRD builder box headings
  const trdBox1 = document.querySelector('#trdBuilderPanel .grid > div:nth-child(1) .text-xs span:first-child');
  if (trdBox1) trdBox1.textContent = `Tabel #1: ${cs.master1Name}`;
  const trdBox2 = document.querySelector('#trdBuilderPanel .grid > div:nth-child(2) .text-xs span:first-child');
  if (trdBox2) trdBox2.textContent = `Tabel #2: ${cs.relName}`;
  const trdBox3 = document.querySelector('#trdBuilderPanel .grid > div:nth-child(3) .text-xs span:first-child');
  if (trdBox3) trdBox3.textContent = `Tabel #3: ${cs.master2Name}`;

  if (typeof bindDragAndDropChips === 'function') {
    bindDragAndDropChips();
  }
}

function doesTableExist(tableName) {
  const t = tableName.toLowerCase();
  if (sqliteDb) {
    const res = sqliteDb.exec(`SELECT name FROM sqlite_master WHERE type='table' AND LOWER(name)='${t}'`);
    return Boolean(res && res.length > 0 && res[0].values.length > 0);
  }
  return Boolean(jsCatalog.tables[t]);
}

function getTableColumns(tableName) {
  const t = tableName.toLowerCase();
  if (sqliteDb) {
    const res = sqliteDb.exec(`PRAGMA table_info(${t})`);
    if (!res || res.length === 0) return [];
    return res[0].values.map(r => ({ cid: r[0], name: r[1], type: r[2] || 'TEXT', notnull: r[3], pk: r[5] === 1 }));
  }
  if (!jsCatalog.tables[t]) return [];
  return jsCatalog.tables[t].columns;
}

function getTableRows(tableName) {
  const t = tableName.toLowerCase();
  if (!doesTableExist(t)) return [];
  if (sqliteDb) {
    const res = sqliteDb.exec(`SELECT * FROM ${t}`);
    if (!res || res.length === 0) return [];
    return res[0].values;
  }
  const tbl = jsCatalog.tables[t];
  return tbl.rows.map(r => tbl.columns.map(c => r[c.name]));
}

function stripSqlComments(sql) {
  return sql.replace(/\/\*[\s\S]*?\*\//g, '').split('\n').map(line => line.replace(/--.*$/, '')).join('\n').trim();
}

function splitSqlStatements(sqlText) {
  const clean = stripSqlComments(sqlText);
  const stmts = [];
  let cur = '';
  let inSingle = false;
  let inDouble = false;
  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i];
    if (ch === "'" && !inDouble) inSingle = !inSingle;
    else if (ch === '"' && !inSingle) inDouble = !inDouble;
    if (ch === ';' && !inSingle && !inDouble) {
      if (cur.trim()) stmts.push(cur.trim());
      cur = '';
    } else {
      cur += ch;
    }
  }
  if (cur.trim()) stmts.push(cur.trim());
  return stmts;
}

function executeSingleStatement(stmt) {
  const s = stmt.trim();

  const pragmaFkMatch = s.match(/^PRAGMA\s+foreign_keys\s*=\s*(ON|OFF|1|0)$/i);
  if (pragmaFkMatch) {
    if (sqliteDb) { sqliteDb.run(s); }
    return { isMutation: false, message: `SQLite PRAGMA foreign_keys = ${pragmaFkMatch[1].toUpperCase()} aktif.`, columns: ['sqlite_pragma', 'status_engine', 'file_database'], rows: [[`PRAGMA foreign_keys = ${pragmaFkMatch[1].toUpperCase()}`, 'SQLite 3 Aktif', currentDatabaseName]] };
  }

  const createDbMatch = s.match(/^CREATE\s+DATABASE\s+(?:IF\s+NOT\s+EXISTS\s+)?([a-zA-Z0-9_.]+)$/i);
  if (createDbMatch) {
    const dbName = createDbMatch[1];
    if (!jsCatalog.databases.includes(dbName)) { jsCatalog.databases.push(dbName); }
    return { isMutation: true, message: `Database '${dbName}' berhasil dibuat.`, columns: ['aksi_ddl', 'nama_database', 'status'], rows: [['CREATE DATABASE', dbName, 'BERHASIL DIBUAT']] };
  }

  const useDbMatch = s.match(/^USE\s+([a-zA-Z0-9_]+)$/i);
  if (useDbMatch) {
    const dbName = useDbMatch[1];
    if (!jsCatalog.databases.includes(dbName)) { jsCatalog.databases.push(dbName); }
    currentDatabaseName = dbName;
    jsCatalog.activeDb = dbName;
    return { isMutation: true, message: `Database aktif berpindah ke '${dbName}'.`, columns: ['aksi_ddl', 'database_aktif', 'status'], rows: [['USE DATABASE', currentDatabaseName, 'AKTIF']] };
  }

  if (/^SHOW\s+DATABASES$/i.test(s)) {
    return { isMutation: false, columns: ['Database', 'Status'], rows: jsCatalog.databases.map(d => [d, d === currentDatabaseName ? 'AKTIF (Current)' : 'Tersedia']) };
  }

  if (/^SHOW\s+TABLES$/i.test(s)) {
    if (sqliteDb) {
      const res = sqliteDb.exec("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name");
      const rows = (res && res[0]) ? res[0].values.map(r => [r[0], currentDatabaseName]) : [];
      return { isMutation: false, columns: [`Tables_in_${currentDatabaseName}`, 'Database'], rows };
    }
    const tblNames = Object.keys(jsCatalog.tables);
    return { isMutation: false, columns: [`Tables_in_${currentDatabaseName}`, 'Database'], rows: tblNames.map(t => [t, currentDatabaseName]) };
  }

  const descMatch = s.match(/^(?:DESC|DESCRIBE|EXPLAIN)\s+([a-zA-Z0-9_]+)$/i);
  if (descMatch) {
    const tbl = descMatch[1].toLowerCase();
    if (!doesTableExist(tbl)) { throw new Error(`Tabel '${tbl}' belum dibuat di dalam database.`); }
    const cols = getTableColumns(tbl);
    return { isMutation: false, columns: ['Field', 'Type', 'Key'], rows: cols.map(c => [c.name, c.type, c.pk ? 'PRI' : '']) };
  }

  if (sqliteDb) {
    let normalized = s.replace(/\bAUTO_INCREMENT\b/gi, '').replace(/\bENGINE\s*=\s*\w+/gi, '');

    if (/^CREATE\s+TABLE\b/i.test(normalized)) {
      const tblMatch = normalized.match(/^CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([a-zA-Z0-9_]+)/i);
      const tblName = tblMatch ? tblMatch[1].toLowerCase() : 'tabel';
      sqliteDb.run(`DROP TABLE IF EXISTS ${tblName}`);
      sqliteDb.run(normalized);
      const cols = getTableColumns(tblName);
      syncAndPersistSqliteDatabase();
      return { isMutation: true, message: `Tabel '${tblName}' berhasil dibuat (${cols.length} kolom).`, columns: ['Tabel_Dibuat', 'Kolom', 'Tipe_Data', 'Primary_Key'], rows: cols.map(c => [tblName, c.name, c.type, c.pk ? 'PK' : '-']) };
    }

    if (/^DROP\s+TABLE\b/i.test(normalized)) {
      sqliteDb.run(normalized);
      syncAndPersistSqliteDatabase();
      return { isMutation: true, message: 'Tabel berhasil dihapus (DROP TABLE).', columns: ['aksi_ddl', 'status'], rows: [['DROP TABLE', 'BERHASIL']] };
    }

    if (/^ALTER\s+TABLE\b/i.test(normalized)) {
      const alterTblMatch = normalized.match(/^ALTER\s+TABLE\s+([a-zA-Z0-9_]+)\s+(.+)$/is);
      if (!alterTblMatch) throw new Error('Sintaks ALTER TABLE tidak valid.');
      const tblName = alterTblMatch[1].toLowerCase();
      const actionPart = alterTblMatch[2].trim();
      if (!doesTableExist(tblName)) { throw new Error(`Tabel '${tblName}' belum ada. Buat tabel terlebih dahulu.`); }
      const addMatch = actionPart.match(/^ADD\s+(?:COLUMN\s+)?([a-zA-Z0-9_]+)\s+(.+)$/i);
      if (addMatch) {
        const newCol = addMatch[1];
        const colType = addMatch[2];
        const existingCols = getTableColumns(tblName).map(c => c.name.toLowerCase());
        if (!existingCols.includes(newCol.toLowerCase())) { sqliteDb.run(`ALTER TABLE ${tblName} ADD COLUMN ${newCol} ${colType}`); }
      } else {
        sqliteDb.run(normalized);
      }
      const cols = getTableColumns(tblName);
      syncAndPersistSqliteDatabase();
      return { isMutation: true, message: `Struktur tabel '${tblName}' berhasil diperbarui (ALTER TABLE).`, columns: ['Tabel', 'Nama_Kolom', 'Tipe_Data', 'Keterangan'], rows: cols.map(c => [tblName, c.name, c.type, c.pk ? 'PRIMARY KEY' : 'Kolom Atribut']) };
    }

    if (/^(INSERT|UPDATE|DELETE)\b/i.test(normalized)) {
      sqliteDb.run(normalized);
      const affected = sqliteDb.getRowsModified();
      const targetTblMatch = normalized.match(/^(?:INSERT\s+INTO|UPDATE|DELETE\s+FROM)\s+([a-zA-Z0-9_]+)/i);
      const targetTbl = targetTblMatch ? targetTblMatch[1].toLowerCase() : null;
      syncAndPersistSqliteDatabase();
      if (targetTbl && doesTableExist(targetTbl)) {
        const preview = sqliteDb.exec(`SELECT * FROM ${targetTbl}`);
        if (preview && preview[0]) {
          return { isMutation: true, message: `Perintah DML berhasil dijalankan (${affected} record terdampak pada tabel '${targetTbl}').`, columns: preview[0].columns, rows: preview[0].values };
        }
        const colsOnly = getTableColumns(targetTbl).map(c => c.name);
        return { isMutation: true, message: `Perintah DML berhasil dijalankan (${affected} record terdampak). Tabel '${targetTbl}' kini memiliki 0 baris.`, columns: colsOnly, rows: [] };
      }
      return { isMutation: true, message: `Perintah DML berhasil dieksekusi (${affected} record terdampak).`, columns: ['status_dml', 'record_terdampak'], rows: [['BERHASIL', affected]] };
    }

    const res = sqliteDb.exec(normalized);
    if (!res || res.length === 0) { return { isMutation: false, columns: [], rows: [] }; }
    return { isMutation: false, columns: res[0].columns, rows: res[0].values };
  }

  return executeNativeJsSql(s);
}

function executeNativeJsSql(s) {
  const createMatch = s.match(/^CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([a-zA-Z0-9_]+)\s*\(([\s\S]+)\)$/i);
  if (createMatch) {
    const tblName = createMatch[1].toLowerCase();
    const body = createMatch[2].trim();
    const defs = splitSqlTopLevel(body);
    const cols = [];
    defs.forEach(d => {
      const clean = d.trim();
      if (/^(PRIMARY\s+KEY|FOREIGN\s+KEY|CONSTRAINT)\b/i.test(clean)) return;
      const tokens = clean.split(/\s+/);
      const colName = tokens[0];
      const colType = tokens[1] || 'TEXT';
      const isPk = /\bPRIMARY\s+KEY\b/i.test(clean);
      cols.push({ name: colName, type: colType.toUpperCase(), pk: isPk });
    });
    jsCatalog.tables[tblName] = { columns: cols, rows: [] };
    return { isMutation: true, message: `Tabel '${tblName}' berhasil dibuat.`, columns: ['Tabel_Dibuat', 'Kolom', 'Tipe_Data', 'Primary_Key'], rows: cols.map(c => [tblName, c.name, c.type, c.pk ? 'PK' : '-']) };
  }

  const alterMatch = s.match(/^ALTER\s+TABLE\s+([a-zA-Z0-9_]+)\s+ADD\s+(?:COLUMN\s+)?([a-zA-Z0-9_]+)\s+(.+)$/i);
  if (alterMatch) {
    const tblName = alterMatch[1].toLowerCase();
    const colName = alterMatch[2];
    const colType = alterMatch[3].trim();
    if (!jsCatalog.tables[tblName]) throw new Error(`Tabel '${tblName}' belum ditemukan.`);
    const exists = jsCatalog.tables[tblName].columns.some(c => c.name.toLowerCase() === colName.toLowerCase());
    if (!exists) {
      jsCatalog.tables[tblName].columns.push({ name: colName, type: colType.toUpperCase(), pk: false });
      jsCatalog.tables[tblName].rows.forEach(r => { r[colName] = null; });
    }
    return { isMutation: true, message: `Kolom '${colName}' berhasil ditambahkan ke tabel '${tblName}'.`, columns: ['Tabel', 'Nama_Kolom', 'Tipe_Data'], rows: jsCatalog.tables[tblName].columns.map(c => [tblName, c.name, c.type]) };
  }

  const insertMatch = s.match(/^INSERT\s+INTO\s+([a-zA-Z0-9_]+)(?:\s*\(([^)]+)\))?\s+VALUES\s*([\s\S]+)$/i);
  if (insertMatch) {
    const tblName = insertMatch[1].toLowerCase();
    const specifiedCols = insertMatch[2] ? insertMatch[2].split(',').map(c => c.trim()) : null;
    const valuesPart = insertMatch[3].trim();
    if (!jsCatalog.tables[tblName]) throw new Error(`Tabel '${tblName}' belum dibuat.`);
    const tbl = jsCatalog.tables[tblName];
    const tupleMatches = [...valuesPart.matchAll(/\(([^)]+)\)/g)];
    if (tupleMatches.length === 0) throw new Error('Sintaks VALUES pada INSERT INTO tidak valid.');
    tupleMatches.forEach(tm => {
      const rawVals = splitSqlTopLevel(tm[1]).map(parseSqlLiteral);
      const rowObj = {};
      tbl.columns.forEach((c, idx) => {
        if (specifiedCols) {
          const pos = specifiedCols.findIndex(sc => sc.toLowerCase() === c.name.toLowerCase());
          rowObj[c.name] = pos !== -1 ? rawVals[pos] : null;
        } else {
          rowObj[c.name] = idx < rawVals.length ? rawVals[idx] : null;
        }
      });
      tbl.rows.push(rowObj);
    });
    const colNames = tbl.columns.map(c => c.name);
    return { isMutation: true, message: `${tupleMatches.length} record berhasil ditambahkan ke tabel '${tblName}'.`, columns: colNames, rows: tbl.rows.map(r => colNames.map(c => r[c])) };
  }

  const deleteMatch = s.match(/^DELETE\s+FROM\s+([a-zA-Z0-9_]+)(?:\s+WHERE\s+(.+))?$/i);
  if (deleteMatch) {
    const tblName = deleteMatch[1].toLowerCase();
    const whereClause = deleteMatch[2] ? deleteMatch[2].trim() : null;
    if (!jsCatalog.tables[tblName]) throw new Error(`Tabel '${tblName}' belum ditemukan.`);
    const tbl = jsCatalog.tables[tblName];
    const beforeCount = tbl.rows.length;
    if (!whereClause) { tbl.rows = []; } else { tbl.rows = tbl.rows.filter(r => !evalSimpleWhere(r, whereClause)); }
    const deleted = beforeCount - tbl.rows.length;
    const colNames = tbl.columns.map(c => c.name);
    return { isMutation: true, message: `${deleted} record berhasil dihapus dari tabel '${tblName}'.`, columns: colNames, rows: tbl.rows.map(r => colNames.map(c => r[c])) };
  }

  const selectMatch = s.match(/^SELECT\s+\*\s+FROM\s+([a-zA-Z0-9_]+)(?:\s+WHERE\s+(.+))?$/i);
  if (selectMatch) {
    const tblName = selectMatch[1].toLowerCase();
    const whereClause = selectMatch[2] ? selectMatch[2].trim() : null;
    if (!jsCatalog.tables[tblName]) throw new Error(`Tabel '${tblName}' belum dibuat.`);
    const tbl = jsCatalog.tables[tblName];
    const colNames = tbl.columns.map(c => c.name);
    const filtered = whereClause ? tbl.rows.filter(r => evalSimpleWhere(r, whereClause)) : tbl.rows;
    return { isMutation: false, columns: colNames, rows: filtered.map(r => colNames.map(c => r[c])) };
  }

  throw new Error('Sintaks perintah SQL tidak dikenali. Gunakan CREATE DATABASE, USE, CREATE TABLE, ALTER TABLE, INSERT INTO, DELETE FROM, DESC, atau SELECT.');
}

function evalSimpleWhere(row, whereStr) {
  const m = whereStr.match(/^([a-zA-Z0-9_]+)\s*(=|!=|<>|>|<|>=|<=)\s*(.+)$/);
  if (!m) return false;
  const col = m[1].trim();
  const op = m[2];
  const target = parseSqlLiteral(m[3]);
  const key = Object.keys(row).find(k => k.toLowerCase() === col.toLowerCase());
  const val = key ? row[key] : undefined;
  if (op === '=') return val == target;
  if (op === '!=' || op === '<>') return val != target;
  if (op === '>') return val > target;
  if (op === '<') return val < target;
  if (op === '>=') return val >= target;
  if (op === '<=') return val <= target;
  return false;
}

function splitSqlTopLevel(str) {
  const res = [];
  let depth = 0;
  let cur = '';
  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    if (ch === '(') depth++;
    else if (ch === ')') depth = Math.max(0, depth - 1);
    if (ch === ',' && depth === 0) { res.push(cur.trim()); cur = ''; } else { cur += ch; }
  }
  if (cur.trim()) res.push(cur.trim());
  return res;
}

function parseSqlLiteral(valStr) {
  const s = valStr.trim();
  if ((s.startsWith("'") && s.endsWith("'")) || (s.startsWith('"') && s.endsWith('"'))) { return s.slice(1, -1); }
  if (!isNaN(Number(s)) && s !== '') return Number(s);
  return s;
}

function runRealSqlQuery(sqlText) {
  const statements = splitSqlStatements(sqlText);
  if (statements.length === 0) { throw new Error('Query SQL masih kosong. Tuliskan perintah SQL Anda terlebih dahulu.'); }
  const startTime = performance.now();
  let lastResult = null;
  const messages = [];
  statements.forEach(stmt => { const res = executeSingleStatement(stmt); lastResult = res; if (res.message) messages.push(res.message); });
  const elapsed = (performance.now() - startTime).toFixed(2);
  return { isMutation: lastResult ? lastResult.isMutation : false, elapsedMs: elapsed, message: messages.join(' '), columns: lastResult ? lastResult.columns : [], rows: lastResult ? lastResult.rows : [] };
}

/********************************************************************
 * 5. APPLICATION STATE & PERSISTENT SQLITE STORAGE
 ********************************************************************/
const STORAGE_KEY = 'sqlcaselab_sqlite_session_v4';
const COMPLETED_STUDENTS_KEY = 'sqlcaselab_completed_students_v4';

let appState = { student: null, activeQuestionId: 1, elapsedSeconds: 0, submissions: {} };

/**
 * Mengambil daftar peserta yang telah menyelesaikan asesmen.
 * Prioritas utama: query dari tabel SQLite `peserta_asesmen`.
 * Fallback: localStorage.
 */
function getCompletedStudentsList() {
  if (sqliteDb) {
    try {
      const res = sqliteDb.exec("SELECT nama, nrp, kelas, score, grade, solved_count, duration, completed_at, status FROM peserta_asesmen ORDER BY id DESC");
      if (res && res[0] && res[0].values) {
        return res[0].values.map(r => ({
          nama: r[0],
          nrp: r[1],
          kelas: r[2],
          score: r[3],
          grade: r[4],
          solvedCount: r[5],
          duration: r[6],
          completedAt: r[7],
          status: r[8]
        }));
      }
    } catch (e) {
      console.warn('SQLite query for peserta_asesmen failed:', e);
    }
  }

  try {
    const raw = localStorage.getItem(COMPLETED_STUDENTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

/**
 * Menyimpan data peserta ke database SQLite dan localStorage
 */
function saveCompletedStudentsList(list) {
  try {
    localStorage.setItem(COMPLETED_STUDENTS_KEY, JSON.stringify(list));
  } catch (e) {}

  if (sqliteDb) {
    try {
      ensureSqliteAssessmentTables();
      list.forEach(item => {
        const stmt = sqliteDb.prepare(`
          INSERT OR REPLACE INTO peserta_asesmen 
          (nama, nrp, kelas, score, grade, solved_count, duration, completed_at, status, jawaban_json) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        stmt.run([
          item.nama,
          item.nrp,
          item.kelas || '',
          item.score || 0,
          item.grade || 'D',
          item.solvedCount || 0,
          item.duration || '00:00',
          item.completedAt || new Date().toLocaleString('id-ID'),
          item.status || 'Selesai',
          JSON.stringify(item.jawaban || {})
        ]);
        stmt.free();
      });
      syncAndPersistSqliteDatabase();
    } catch (e) {
      console.error('Save to SQLite peserta_asesmen failed:', e);
    }
  }
}

/**
 * Mencatat riwayat jawaban per soal ke tabel SQLite `riwayat_jawaban`
 */
function recordAnswerInSqlite(qId, queryText, points, solved) {
  if (!sqliteDb || !appState.student) return;
  try {
    ensureSqliteAssessmentTables();
    const stmt = sqliteDb.prepare(`
      INSERT INTO riwayat_jawaban (nrp, nama, soal_id, query, points, solved, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run([
      appState.student.nrp,
      appState.student.nama,
      qId,
      queryText,
      points,
      solved ? 1 : 0,
      new Date().toLocaleString('id-ID')
    ]);
    stmt.free();
    syncAndPersistSqliteDatabase();
  } catch (e) {
    console.warn('Failed recording answer to SQLite:', e);
  }
}

/**
 * Mencatat audit log aktivitas ke SQLite `log_aktivitas`
 */
function recordActivityLogInSqlite(aksi, detail) {
  if (!sqliteDb) return;
  try {
    ensureSqliteAssessmentTables();
    const nrp = appState.student ? appState.student.nrp : (currentUserRole || 'GUEST');
    const role = currentUserRole || currentLoginRole;
    const stmt = sqliteDb.prepare(`
      INSERT INTO log_aktivitas (nrp, role, aksi, detail, timestamp)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run([nrp, role, aksi, detail, new Date().toLocaleString('id-ID')]);
    stmt.free();
    syncAndPersistSqliteDatabase();
  } catch (e) {
    console.warn('Log activity error:', e);
  }
}

function normalizeIdentity(str) {
  return String(str || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function findExistingAttempt(nama, nrp) {
  const list = getCompletedStudentsList();
  const normNama = normalizeIdentity(nama);
  const normNrp = normalizeIdentity(nrp);
  return list.find(item => normalizeIdentity(item.nrp) === normNrp || normalizeIdentity(item.nama) === normNama);
}

function lockCurrentStudentAttempt(reasonLabel = 'Selesai') {
  if (!appState.student) return;
  const list = getCompletedStudentsList();
  const normNama = normalizeIdentity(appState.student.nama);
  const normNrp = normalizeIdentity(appState.student.nrp);
  const existingIdx = list.findIndex(item => normalizeIdentity(item.nrp) === normNrp || normalizeIdentity(item.nama) === normNama);
  const record = {
    nama: appState.student.nama,
    nrp: appState.student.nrp,
    kelas: appState.student.kelas,
    score: computeTotalScore(),
    grade: getLetterGrade(computeTotalScore()),
    solvedCount: computeSolvedCount(),
    duration: formatDuration(appState.elapsedSeconds),
    completedAt: new Date().toLocaleString('id-ID'),
    status: reasonLabel,
    jawaban: appState.submissions,
    erdDesign: erdDesignState,
    trdDesign: trdDesignState
  };

  if (existingIdx >= 0) {
    list[existingIdx] = record;
  } else {
    list.push(record);
  }
  saveCompletedStudentsList(list);
  recordActivityLogInSqlite('LOCK_EXAM', `Sesi terkunci dengan status: ${reasonLabel}, skor: ${record.score}`);
  renderCompletedParticipantsOnLogin();

  if (typeof syncStudentSubmissionToCloud === 'function') {
    syncStudentSubmissionToCloud(record).then(res => {
      if (res && res.success) {
        showToast('Hasil asesmen berhasil disinkronisasi ke Cloud Supabase!', 'success');
      }
    });
  }
}

function syncStudentProgressToCloud() {
  if (!appState.student || typeof syncStudentSubmissionToCloud !== 'function') return;
  const record = {
    nama: appState.student.nama,
    nrp: appState.student.nrp,
    kelas: appState.student.kelas,
    score: computeTotalScore(),
    grade: getLetterGrade(computeTotalScore()),
    solvedCount: computeSolvedCount(),
    duration: formatDuration(appState.elapsedSeconds),
    status: 'Sedang Mengerjakan',
    jawaban: appState.submissions,
    erdDesign: erdDesignState,
    trdDesign: trdDesignState
  };
  syncStudentSubmissionToCloud(record);
}

function renderCompletedParticipantsOnLogin() {
  const listEl = document.getElementById('completedParticipantsList');
  const badgeEl = document.getElementById('completedCountBadge');
  if (!listEl || !badgeEl) return;
  const list = getCompletedStudentsList();
  badgeEl.textContent = `${list.length} Peserta (SQLite DB)`;
  if (list.length === 0) {
    listEl.innerHTML = 'Belum ada peserta yang menyelesaikan asesmen pada database SQLite.';
    return;
  }
  listEl.innerHTML = `<div class="space-y-1.5">` + list.map(item => `
    <div class="flex items-center justify-between gap-2 p-2 rounded-lg bg-stone-900 border border-stone-800 text-[11px]">
      <div>
        <span class="font-semibold text-white">${escapeHtml(item.nama)}</span>
        <span class="font-mono-code text-brand-300 ml-1">(${escapeHtml(item.nrp)})</span>
      </div>
      <div class="flex items-center gap-2">
        <span class="font-mono-code font-bold text-emerald-400">${item.score}/100 (${escapeHtml(item.grade)})</span>
        <span class="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px]">${escapeHtml(item.status || 'Terkunci')}</span>
      </div>
    </div>
  `).join('') + `</div>`;
}

let timerIntervalId = null;
let isExamLockedByAutoSubmit = false;
let isInternalDownloadActive = false;

function initDefaultSubmissions() {
  CASE_STUDY_QUESTIONS.forEach(q => {
    if (!appState.submissions[q.id] || (appState.submissions[q.id].query && (appState.submissions[q.id].query.includes('PRAGMA foreign_keys') || appState.submissions[q.id].query.includes('dr. Andi Wijaya')))) {
      appState.submissions[q.id] = { query: q.starterQuery, solved: false, pointsEarned: 0, attempts: 0 };
    }
  });
}

function saveStateToStorage() {
  try {
    appState.erdDesignState = erdDesignState;
    appState.trdDesignState = trdDesignState;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
  } catch (e) {}
}

function loadStateFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.student && parsed.student.nama && parsed.student.nrp) {
      appState = parsed;
      syncCaseStudyData();
      if (appState.erdDesignState) {
        erdDesignState = { ...erdDesignState, ...appState.erdDesignState };
      }
      if (appState.trdDesignState) {
        trdDesignState = { ...trdDesignState, ...appState.trdDesignState };
      }
      initDefaultSubmissions();
      return true;
    }
  } catch (e) {}
  return false;
}

function clearStateStorage() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {}
}

/********************************************************************
 * 6. UI HELPERS (TOAST, TIMER, RENDER TABLES)
 ********************************************************************/
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const toast = document.createElement('div');
  const colorClasses = type === 'success'
    ? 'bg-emerald-950/95 border-emerald-500/50 text-emerald-200'
    : type === 'error'
    ? 'bg-rose-950/95 border-rose-500/50 text-rose-200'
    : 'bg-stone-900/95 border-brand-500/50 text-stone-100';

  toast.className = `pointer-events-auto px-4 py-3 rounded-xl border shadow-xl text-xs font-medium flex items-center justify-between gap-3 toast-enter ${colorClasses}`;
  toast.innerHTML = `<span>${escapeHtml(message)}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.25s';
    setTimeout(() => toast.remove(), 250);
  }, 3200);
}

function escapeHtml(val) {
  if (val === null || val === undefined) return 'NULL';
  return String(val).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function buildHtmlTable(columns, rows) {
  if (!columns || columns.length === 0) {
    return `<div class="p-4 text-center text-xs text-stone-400">Perintah SQL berhasil dieksekusi (0 baris ditampilkan).</div>`;
  }
  let html = `<table class="w-full text-left border-collapse text-xs"><thead><tr class="bg-stone-800/90 text-stone-200 border-b border-stone-700">`;
  columns.forEach(col => {
    html += `<th class="py-2 px-3 font-mono-code font-semibold whitespace-nowrap">${escapeHtml(col)}</th>`;
  });
  html += `</tr></thead><tbody class="divide-y divide-stone-800/80">`;
  if (rows.length === 0) {
    html += `<tr><td colspan="${columns.length}" class="py-4 px-3 text-center text-stone-400 italic">Tabel sudah terbuat namun belum memiliki record (0 rows). Gunakan INSERT INTO untuk mengisi record.</td></tr>`;
  } else {
    rows.forEach((r, idx) => {
      html += `<tr class="${idx % 2 === 0 ? 'bg-stone-950/40' : 'bg-stone-900/40'} hover:bg-brand-950/30 transition">`;
      r.forEach(cell => {
        html += `<td class="py-2 px-3 font-mono-code text-stone-200 whitespace-nowrap">${escapeHtml(cell)}</td>`;
      });
      html += `</tr>`;
    });
  }
  html += `</tbody></table>`;
  return html;
}

function formatDuration(sec) {
  const mins = Math.floor(sec / 60);
  const rem = sec % 60;
  return `${String(mins).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
}

function startExamTimer() {
  if (timerIntervalId) clearInterval(timerIntervalId);
  const timerEl = document.getElementById('examTimer');
  if (timerEl) timerEl.textContent = formatDuration(appState.elapsedSeconds);
  timerIntervalId = setInterval(() => {
    appState.elapsedSeconds++;
    if (timerEl) timerEl.textContent = formatDuration(appState.elapsedSeconds);
    if (appState.elapsedSeconds % 10 === 0) saveStateToStorage();
  }, 1000);
}

/********************************************************************
 * 7. RENDER WORKSPACE & ERD/TRD DIAGRAM EXPLORER
 ********************************************************************/
function computeTotalScore() {
  return Object.values(appState.submissions).reduce((acc, s) => acc + (s.pointsEarned || 0), 0);
}

function computeSolvedCount() {
  return Object.values(appState.submissions).filter(s => s.solved).length;
}

function updateHeaderStats() {
  if (!appState.student) return;
  const nameEl = document.getElementById('headerStudentName');
  const nrpEl = document.getElementById('headerStudentNrp');
  const initEl = document.getElementById('studentInitials');
  const progEl = document.getElementById('headerProgressText');
  const scoreEl = document.getElementById('headerScoreText');

  if (nameEl) nameEl.textContent = appState.student.nama;
  if (nrpEl) nrpEl.textContent = `NRP: ${appState.student.nrp}`;
  if (initEl) initEl.textContent = appState.student.nama.trim().charAt(0).toUpperCase();

  const solved = computeSolvedCount();
  const score = computeTotalScore();
  if (progEl) progEl.textContent = `${solved} / ${CASE_STUDY_QUESTIONS.length}`;
  if (scoreEl) scoreEl.textContent = `${score} / 100`;
}

function renderQuestionSidebarCards() {
  const container = document.getElementById('questionCardsContainer');
  if (!container) return;
  container.innerHTML = '';
  CASE_STUDY_QUESTIONS.forEach(q => {
    const sub = appState.submissions[q.id] || { solved: false, attempts: 0 };
    const isActive = q.id === appState.activeQuestionId;
    const statusBadge = sub.solved
      ? `<span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">Selesai (${q.points} Poin)</span>`
      : sub.attempts > 0
      ? `<span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">Dicoba (${sub.attempts}x)</span>`
      : `<span class="px-2 py-0.5 rounded-full text-[10px] font-medium bg-stone-800 text-stone-400">${q.points} Poin</span>`;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `w-full text-left p-3 rounded-xl border transition flex flex-col gap-1.5 ${isActive ? 'bg-brand-950/50 border-brand-500 shadow-md shadow-brand-500/10' : 'bg-stone-950/60 border-stone-800 hover:border-stone-700'}`;
    btn.innerHTML = `
      <div class="flex items-center justify-between gap-2">
        <span class="text-xs font-bold ${isActive ? 'text-brand-300' : 'text-stone-300'}">Soal #${q.id} — ${escapeHtml(q.level)}</span>
        ${statusBadge}
      </div>
      <div class="text-xs font-semibold text-white line-clamp-1">${escapeHtml(q.title)}</div>
    `;
    btn.addEventListener('click', () => {
      saveCurrentEditorDraft();
      appState.activeQuestionId = q.id;
      renderActiveQuestion();
      renderQuestionSidebarCards();
    });
    container.appendChild(btn);
  });
}

function renderSchemaExplorer() {
  const container = document.getElementById('schemaTablesList');
  if (!container) return;
  container.innerHTML = '';

  const cs = getActiveCaseStudy();
  const m1 = cs ? cs.master1Name : 'dokter';
  const m2 = cs ? cs.master2Name : 'pasien';
  const rel = cs ? cs.relName : 'kunjungan';
  const m1Up = m1.toUpperCase();
  const m2Up = m2.toUpperCase();

  const erdCard = document.createElement('div');
  erdCard.className = 'p-3.5 rounded-xl bg-gradient-to-br from-brand-950/60 via-stone-950 to-stone-950 border border-brand-500/30 space-y-2.5';
  erdCard.innerHTML = `
    <div class="flex items-center justify-between">
      <span class="text-[11px] font-bold uppercase tracking-wider text-brand-300">1. Diagram Konseptual (ERD)</span>
      <span class="text-[10px] px-2 py-0.5 rounded bg-brand-500/20 text-brand-300">Relasi 1:N</span>
    </div>
    <div class="grid grid-cols-3 items-center gap-1.5 text-center font-mono-code text-[11px] py-2">
      <div class="p-2 rounded-lg bg-stone-900 border border-brand-400/40 text-white font-semibold">[${m1Up}]<div class="text-[10px] text-stone-400 font-normal mt-0.5">1 (One)</div></div>
      <div class="flex flex-col items-center justify-center">
        <div class="px-2 py-1 rounded bg-amber-500/20 border border-amber-400/50 text-amber-300 text-[10px] font-bold">&lt; ${escapeHtml(cs ? cs.erdExpected.entRelName.toLowerCase() : 'transaksi')} &gt;</div>
        <span class="text-[10px] text-stone-400 mt-1">&darr; TRD: Tabel ${rel}</span>
      </div>
      <div class="p-2 rounded-lg bg-stone-900 border border-brand-400/40 text-white font-semibold">[${m2Up}]<div class="text-[10px] text-stone-400 font-normal mt-0.5">1 (One)</div></div>
    </div>
    <div class="text-[11px] text-stone-300 leading-relaxed border-t border-stone-800/80 pt-2">
      <strong>Transformasi TRD:</strong> Tabel <code class="text-amber-300">${m1}</code> dan <code class="text-amber-300">${m2}</code> berada di sisi 1, sedangkan Foreign Key turun ke tabel transaksi <code class="text-brand-300">${rel}</code> (sisi N).
    </div>
  `;
  container.appendChild(erdCard);

  const sel = document.getElementById('selectPreviewTable');
  if (sel) {
    const curVal = sel.value;
    sel.innerHTML = `
      <option value="${m1}">${m1} (TRD Master)</option>
      <option value="${m2}">${m2} (TRD Master)</option>
      <option value="${rel}">${rel} (TRD Transaksi)</option>
      <option value="peserta_asesmen" class="dosen-only-feature">peserta_asesmen (Sistem DB)</option>
      <option value="riwayat_jawaban" class="dosen-only-feature">riwayat_jawaban (Sistem DB)</option>
      <option value="log_aktivitas" class="dosen-only-feature">log_aktivitas (Sistem DB)</option>
    `;
    if ([m1, m2, rel, 'peserta_asesmen', 'riwayat_jawaban', 'log_aktivitas'].includes(curVal)) {
      sel.value = curVal;
    }
  }

  SCHEMA_METADATA.forEach(meta => {
    const existsNow = doesTableExist(meta.table);
    const liveCols = existsNow ? getTableColumns(meta.table).map(c => c.name.toLowerCase()) : [];
    const card = document.createElement('div');
    card.className = 'p-3 rounded-xl bg-stone-950 border border-stone-800';
    let colsHtml = '';
    meta.columns.forEach(c => {
      const isCreated = liveCols.includes(c.name.toLowerCase());
      const badge = c.pk ? `<span class="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">PK</span>` : c.fk ? `<span class="text-[10px] px-1.5 py-0.2 rounded bg-brand-500/15 text-brand-300 border border-brand-500/30">FK &rarr; ${c.fk}</span>` : c.isAlterTarget ? `<span class="text-[10px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">ALTER (Soal #4)</span>` : '';
      colsHtml += `<button type="button" data-insert-col="${c.name}" class="w-full flex items-center justify-between py-1 px-2 rounded hover:bg-stone-800/80 text-left transition group"><span class="font-mono-code text-xs ${isCreated ? 'text-emerald-300' : 'text-stone-200'} group-hover:text-brand-300">${isCreated ? '&#10003; ' : ''}${c.name}</span><span class="flex items-center gap-1.5">${badge}<span class="font-mono-code text-[10px] text-stone-500">${c.type}</span></span></button>`;
    });
    card.innerHTML = `
      <div class="flex items-center justify-between mb-1.5 pb-1.5 border-b border-stone-800">
        <div>
          <div class="flex items-center gap-2"><span class="font-mono-code text-xs font-bold text-brand-400">Tabel: ${meta.table}</span><span class="text-[10px] px-1.5 py-0.5 rounded ${existsNow ? 'bg-emerald-500/20 text-emerald-300' : 'bg-stone-800 text-stone-400'}">${existsNow ? 'Sudah Dibuat' : 'Belum Dibuat'}</span></div>
          <p class="text-[11px] text-stone-400 mt-0.5">${escapeHtml(meta.desc)}</p>
        </div>
        <button type="button" data-preview-table="${meta.table}" class="text-[11px] px-2 py-1 rounded bg-stone-800 hover:bg-stone-700 text-amber-300 border border-stone-700">Lihat Isi</button>
      </div>
      <div class="space-y-0.5">${colsHtml}</div>
    `;
    container.appendChild(card);
  });

  container.querySelectorAll('[data-insert-col]').forEach(btn => {
    btn.addEventListener('click', () => {
      const colText = btn.getAttribute('data-insert-col');
      insertIntoEditor(colText);
      showToast(`Nama kolom '${colText}' disisipkan ke editor SQL.`);
    });
  });
  container.querySelectorAll('[data-preview-table]').forEach(btn => {
    btn.addEventListener('click', () => {
      const tbl = btn.getAttribute('data-preview-table');
      const sel = document.getElementById('selectPreviewTable');
      if (sel) sel.value = tbl;
      switchSidebarTab('data');
      renderLiveTablePreview(tbl);
    });
  });
}

function renderLiveTablePreview(tableName) {
  const container = document.getElementById('liveTablePreviewContainer');
  if (!container) return;

  if (!doesTableExist(tableName)) {
    container.innerHTML = `<div class="p-4 text-center space-y-2"><div class="text-xs text-amber-300 font-semibold">Tabel '${escapeHtml(tableName)}' belum dibuat di database aktif (${escapeHtml(currentDatabaseName)}).</div><p class="text-[11px] text-stone-400">Silakan jalankan perintah <code class="text-amber-300">CREATE TABLE ${escapeHtml(tableName)} ...</code> pada Soal #2 / #3 terlebih dahulu.</p></div>`;
    return;
  }
  try {
    const cols = getTableColumns(tableName).map(c => c.name);
    const rows = getTableRows(tableName);
    container.innerHTML = buildHtmlTable(cols, rows);
  } catch (err) {
    container.innerHTML = `<div class="p-3 text-xs text-rose-400">${escapeHtml(err.message)}</div>`;
  }
}

function saveCurrentEditorDraft() {
  const currentQ = appState.activeQuestionId;
  const textarea = document.getElementById('sqlEditorTextarea');
  if (appState.submissions[currentQ] && textarea) {
    appState.submissions[currentQ].query = textarea.value;
    saveStateToStorage();
  }
}

function renderActiveQuestion() {
  const q = CASE_STUDY_QUESTIONS.find(item => item.id === appState.activeQuestionId) || CASE_STUDY_QUESTIONS[0];
  const sub = appState.submissions[q.id];

  document.getElementById('activeQuestionNumberBadge').textContent = `Soal #${q.id} dari ${CASE_STUDY_QUESTIONS.length}`;
  document.getElementById('activeQuestionLevelBadge').textContent = q.level;
  document.getElementById('activeQuestionPointsBadge').textContent = `${q.points} Poin`;
  document.getElementById('activeQuestionTitle').textContent = q.title;
  document.getElementById('activeQuestionScenario').textContent = q.scenario;
  document.getElementById('activeQuestionInstruction').textContent = q.instruction;

  const colsContainer = document.getElementById('activeQuestionExpectedCols');
  colsContainer.innerHTML = `<span class="text-[11px] text-stone-400 mr-1">Target Kriteria:</span>`;
  q.expectedColumns.forEach(c => {
    const span = document.createElement('span');
    span.className = 'font-mono-code text-[11px] px-2 py-0.5 rounded bg-stone-900 text-amber-300 border border-stone-700';
    span.textContent = c;
    colsContainer.appendChild(span);
  });

  const hintBox = document.getElementById('activeQuestionHintBox');
  hintBox.classList.add('hidden');
  hintBox.textContent = `Petunjuk:\n${q.hint}`;
  document.getElementById('expectedOutputPreviewBox').classList.add('hidden');
  document.getElementById('gradingFeedbackBanner').classList.add('hidden');

  const builderCard = document.getElementById('visualDesignBuilderCard');
  const erdPanel = document.getElementById('erdBuilderPanel');
  const trdPanel = document.getElementById('trdBuilderPanel');
  const phaseBadge = document.getElementById('designBuilderPhaseBadge');
  const builderTitle = document.getElementById('designBuilderTitle');

  const cs = getActiveCaseStudy();

  if (q.type === 'DESIGN_ERD') {
    builderCard.classList.remove('hidden');
    erdPanel.classList.remove('hidden');
    trdPanel.classList.add('hidden');
    phaseBadge.textContent = 'Tahap 1 — Perancangan Konseptual (ERD)';
    builderTitle.textContent = `Susun Entitas, Atribut Key, dan Kardinalitas ERD ${cs ? cs.caseTitle : ''}`;
    syncErdSlotsFromState();
    renderLiveErdCanvas();
  } else if (q.type === 'DESIGN_TRD') {
    builderCard.classList.remove('hidden');
    erdPanel.classList.add('hidden');
    trdPanel.classList.remove('hidden');
    phaseBadge.textContent = 'Tahap 2 — Transformasi Skema Fisik (TRD)';
    builderTitle.textContent = 'Petakan Primary Key (PK), Tipe Data, dan Penempatan Foreign Key (FK) pada TRD';
    syncTrdSlotsFromState();
    renderLiveTrdCanvas();
  } else {
    builderCard.classList.add('hidden');
  }

  const editor = document.getElementById('sqlEditorTextarea');
  let currentVal = (sub && sub.query !== undefined) ? sub.query : q.starterQuery;
  // If stored query contains old answers from previous versions, sanitize it to blank comment prompt
  if (currentVal && (currentVal.includes('dr. Andi Wijaya') || currentVal.includes('PRAGMA foreign_keys = ON;') || currentVal.includes('CREATE TABLE dokter (') || currentVal.includes('DELETE FROM pasien\nWHERE id_pasien = 103;'))) {
    currentVal = q.starterQuery;
    if (sub) sub.query = q.starterQuery;
  }
  editor.value = currentVal;

  const statusEl = document.getElementById('lastSavedStatus');
  if (sub && sub.solved) {
    statusEl.innerHTML = `<span class="text-emerald-400 font-semibold">&#10003; Jawaban Terverifikasi Benar (+${q.points} Poin)</span>`;
  } else if (sub && sub.attempts > 0) {
    statusEl.innerHTML = `<span class="text-amber-300">Sudah dicoba ${sub.attempts}x — Belum tepat</span>`;
  } else {
    statusEl.textContent = 'Belum diverifikasi';
  }

  document.getElementById('btnPrevQuestion').disabled = q.id === 1;
  document.getElementById('btnNextQuestion').disabled = q.id === CASE_STUDY_QUESTIONS.length;

  applyRoleRestrictions();
}

function insertIntoEditor(snippet) {
  const textarea = document.getElementById('sqlEditorTextarea');
  const start = textarea.selectionStart || textarea.value.length;
  const end = textarea.selectionEnd || textarea.value.length;
  const before = textarea.value.substring(0, start);
  const after = textarea.value.substring(end);
  textarea.value = before + snippet + after;
  textarea.focus();
  textarea.selectionStart = textarea.selectionEnd = start + snippet.length;
  saveCurrentEditorDraft();
}

/********************************************************************
 * 8. SQL EXECUTION & AUTO-GRADING ENGINE
 ********************************************************************/
function handleRunUserQuery() {
  saveCurrentEditorDraft();
  const queryText = document.getElementById('sqlEditorTextarea').value;
  const resultContainer = document.getElementById('queryResultContainer');
  const metaBadge = document.getElementById('queryMetaBadge');
  const feedbackBanner = document.getElementById('gradingFeedbackBanner');
  feedbackBanner.classList.add('hidden');
  try {
    ensurePrerequisiteStateForQuestion(appState.activeQuestionId);
    const res = runRealSqlQuery(queryText);
    metaBadge.classList.remove('hidden');
    metaBadge.textContent = `DB: ${currentDatabaseName} • ${res.rows.length} baris • ${res.elapsedMs} ms`;
    resultContainer.className = 'max-h-[360px] overflow-auto rounded-xl bg-stone-950 border border-stone-800';
    resultContainer.innerHTML = buildHtmlTable(res.columns, res.rows);
    if (res.message) { showToast(res.message, 'success'); }
    renderSchemaExplorer();
    renderLiveTablePreview(document.getElementById('selectPreviewTable').value);
  } catch (err) {
    metaBadge.classList.remove('hidden');
    metaBadge.textContent = 'SQL Error';
    resultContainer.className = 'p-4 rounded-xl bg-rose-950/30 border border-rose-500/40 text-xs font-mono-code text-rose-300';
    resultContainer.innerHTML = `<div class="font-bold text-rose-400 mb-1">Kesalahan Eksekusi SQL:</div><div>${escapeHtml(err.message)}</div>`;
  }
}

function handleVerifyAndSubmitAnswer() {
  saveCurrentEditorDraft();
  const q = CASE_STUDY_QUESTIONS.find(item => item.id === appState.activeQuestionId);
  const sub = appState.submissions[q.id];
  const userSql = document.getElementById('sqlEditorTextarea').value.trim();
  const feedbackBanner = document.getElementById('gradingFeedbackBanner');
  const resultContainer = document.getElementById('queryResultContainer');
  const metaBadge = document.getElementById('queryMetaBadge');
  sub.attempts = (sub.attempts || 0) + 1;

  if (q.type === 'DESIGN_ERD' || q.type === 'DESIGN_TRD') {
    syncVisualDesignToEditor();
    sub.query = document.getElementById('sqlEditorTextarea').value.trim();
    const check = verifyQuestionSubmission(q, sub.query);
    metaBadge.classList.remove('hidden');
    metaBadge.textContent = q.type === 'DESIGN_ERD' ? 'Validasi Model ERD' : 'Validasi Skema TRD';
    resultContainer.className = 'max-h-[360px] overflow-auto rounded-xl bg-stone-950 border border-stone-800';
    resultContainer.innerHTML = buildHtmlTable(check.previewCols || ['Komponen', 'Status'], check.previewRows || []);

    if (check.passed) {
      sub.solved = true;
      sub.pointsEarned = q.points;
      showGradingBanner(true, `${check.reason} (+${q.points} Poin)`);
      showToast(`Soal #${q.id} Terverifikasi Benar (+${q.points} Poin)!`, 'success');
    } else {
      sub.solved = false;
      sub.pointsEarned = 0;
      showGradingBanner(false, check.reason);
    }
    recordAnswerInSqlite(q.id, sub.query, sub.pointsEarned, sub.solved);
    saveStateToStorage();
    updateHeaderStats();
    renderSchemaExplorer();
    renderQuestionSidebarCards();
    renderActiveQuestion();
    feedbackBanner.classList.remove('hidden');
    return;
  }

  sub.query = userSql;
  try {
    ensurePrerequisiteStateForQuestion(q.id);
    const res = runRealSqlQuery(userSql);
    metaBadge.classList.remove('hidden');
    metaBadge.textContent = `DB: ${currentDatabaseName} • ${res.rows.length} baris • ${res.elapsedMs} ms`;
    resultContainer.className = 'max-h-[360px] overflow-auto rounded-xl bg-stone-950 border border-stone-800';
    resultContainer.innerHTML = buildHtmlTable(res.columns, res.rows);
    const check = verifyQuestionSubmission(q, userSql);
    if (check.passed) {
      sub.solved = true;
      sub.pointsEarned = q.points;
      showGradingBanner(true, `${check.reason} (+${q.points} Poin)`);
      showToast(`Soal #${q.id} Terverifikasi Benar (+${q.points} Poin)!`, 'success');
    } else {
      sub.solved = false;
      sub.pointsEarned = 0;
      showGradingBanner(false, check.reason);
    }
  } catch (err) {
    sub.solved = false;
    sub.pointsEarned = 0;
    showGradingBanner(false, `Eksekusi SQL Gagal: ${err.message}`);
  }

  recordAnswerInSqlite(q.id, userSql, sub.pointsEarned, sub.solved);
  saveStateToStorage();
  syncStudentProgressToCloud();
  updateHeaderStats();
  renderSchemaExplorer();
  renderLiveTablePreview(document.getElementById('selectPreviewTable').value);
  renderQuestionSidebarCards();
  renderActiveQuestion();
  feedbackBanner.classList.remove('hidden');
}

function verifyQuestionSubmission(q, userSql) {
  const cs = getActiveCaseStudy();
  const m1 = cs ? cs.master1Name : 'dokter';
  const m2 = cs ? cs.master2Name : 'pasien';
  const rel = cs ? cs.relName : 'kunjungan';
  const db = cs ? cs.dbName : 'klinik_sehatkampus';

  if (q.type === 'DESIGN_ERD') {
    const exp = cs ? cs.erdExpected : { ent1Name: 'DOKTER', ent1Pk: 'id_dokter', ent1Attrs: 'nama_dokter, spesialis', entRelName: 'KUNJUNGAN', entRelAttrs: 'id_kunjungan (PK), tgl_kunjungan, diagnosa', cardinality: '1:N', ent2Name: 'PASIEN', ent2Pk: 'id_pasien', ent2Attrs: 'nama_pasien, tgl_lahir' };
    const previewCols = ['Entitas_ERD', 'Identifier_PK', 'Atribut_Deskriptif', 'Kardinalitas'];
    const previewRows = [
      [erdDesignState.ent1Name||'-', erdDesignState.ent1Pk||'-', erdDesignState.ent1Attrs||'-', erdDesignState.cardinality||'-'],
      [erdDesignState.entRelName||'-', exp.entRelPk || 'id', erdDesignState.entRelAttrs||'-', erdDesignState.cardinality||'-'],
      [erdDesignState.ent2Name||'-', erdDesignState.ent2Pk||'-', erdDesignState.ent2Attrs||'-', erdDesignState.cardinality||'-']
    ];
    if (erdDesignState.ent1Name !== exp.ent1Name) return { passed: false, reason: `Entitas Master #1 belum tepat. Pilih entitas ${exp.ent1Name} sesuai narasi kasus ${cs.caseTitle}.`, previewCols, previewRows };
    if (erdDesignState.ent1Pk !== exp.ent1Pk || erdDesignState.ent1Attrs !== exp.ent1Attrs) return { passed: false, reason: `Key Atribut atau Atribut Deskriptif pada entitas ${exp.ent1Name} belum tepat (gunakan ${exp.ent1Pk} sebagai Key Atribut, serta ${exp.ent1Attrs}).`, previewCols, previewRows };
    if (erdDesignState.entRelName !== exp.entRelName || !erdDesignState.entRelAttrs.includes(exp.entRelAttrs.split(',')[0].trim())) return { passed: false, reason: `Entitas Transaksi harus bernama ${exp.entRelName} dengan atribut ${exp.entRelAttrs}.`, previewCols, previewRows };
    if (erdDesignState.cardinality !== exp.cardinality) return { passed: false, reason: `Derajat kardinalitas belum tepat. Harus ${exp.cardinality}.`, previewCols, previewRows };
    if (erdDesignState.ent2Name !== exp.ent2Name || erdDesignState.ent2Pk !== exp.ent2Pk || erdDesignState.ent2Attrs !== exp.ent2Attrs) return { passed: false, reason: `Entitas Master #2 harus ${exp.ent2Name} dengan Key Atribut ${exp.ent2Pk} dan atribut ${exp.ent2Attrs}.`, previewCols, previewRows };
    return { passed: true, reason: `Rancangan ERD sempurna! Ketiga entitas (${exp.ent1Name}, ${exp.entRelName}, ${exp.ent2Name}), Key Atribut, dan kardinalitas ${exp.cardinality} telah sesuai.`, previewCols, previewRows };
  }

  if (q.type === 'DESIGN_TRD') {
    const exp = cs ? cs.trdExpected : { t1Pk: 'id_dokter INT PRIMARY KEY', t1Fk: 'NONE', t2Pk: 'id_kunjungan INT PRIMARY KEY', t2Fk1: 'id_dokter -> dokter(id_dokter)', t2Fk2: 'id_pasien -> pasien(id_pasien)', t3Pk: 'id_pasien INT PRIMARY KEY', t3DateType: 'DATE' };
    const previewCols = ['Nama_Tabel_TRD', 'Primary_Key', 'Foreign_Key_Relasi'];
    const previewRows = [
      [m1, trdDesignState.dokterPk||'-', trdDesignState.dokterFk||'-'],
      [rel, trdDesignState.kunjunganPk||'-', `${trdDesignState.kunjunganFk1||'-'} & ${trdDesignState.kunjunganFk2||'-'}`],
      [m2, trdDesignState.pasienPk||'-', `Tanpa FK (tipe: ${trdDesignState.pasienDateType||'-'})`]
    ];
    if (trdDesignState.dokterPk !== exp.t1Pk || trdDesignState.dokterFk !== exp.t1Fk) return { passed: false, reason: `Pada TRD, tabel ${m1} memiliki PK ${exp.t1Pk} dan TIDAK menyimpan Foreign Key (${exp.t1Fk}).`, previewCols, previewRows };
    if (trdDesignState.kunjunganPk !== exp.t2Pk) return { passed: false, reason: `Primary Key untuk tabel ${rel} harus ${exp.t2Pk}.`, previewCols, previewRows };
    if (trdDesignState.kunjunganFk1 !== exp.t2Fk1 || trdDesignState.kunjunganFk2 !== exp.t2Fk2) return { passed: false, reason: `Tabel ${rel} (sisi N) wajib memiliki kedua Foreign Key: ${exp.t2Fk1} dan ${exp.t2Fk2}.`, previewCols, previewRows };
    if (trdDesignState.pasienPk !== exp.t3Pk || trdDesignState.pasienDateType !== exp.t3DateType) return { passed: false, reason: `Tabel ${m2} harus memiliki PK ${exp.t3Pk} dan kolom tipe ${exp.t3DateType}.`, previewCols, previewRows };
    return { passed: true, reason: 'Transformasi TRD berhasil! Seluruh Primary Key, tipe data, dan peletakan Foreign Key telah tepat. Sekarang lanjutkan membuat database & tabelnya di Soal #3!', previewCols, previewRows };
  }

  const cleanSql = stripSqlComments(userSql);

  if (q.type === 'DDL_CREATE_DB_AND_TABLES') {
    currentDatabaseName = `${db}.sqlite`;
    jsCatalog.activeDb = `${db}.sqlite`;
    if (!doesTableExist(m1) || !doesTableExist(m2) || !doesTableExist(rel)) return { passed: false, reason: `Pastikan ketiga tabel sesuai TRD (${m1}, ${m2}, dan ${rel}) sudah dibuat di database menggunakan CREATE TABLE.` };
    const dCols = getTableColumns(m1).map(c => c.name.toLowerCase());
    const pCols = getTableColumns(m2).map(c => c.name.toLowerCase());
    const kCols = getTableColumns(rel).map(c => c.name.toLowerCase());

    const expectedColsM1 = cs.schemaMetadata.find(s => s.table.toLowerCase() === m1.toLowerCase())?.columns.map(c => c.name.toLowerCase()) || [];
    const expectedColsM2 = cs.schemaMetadata.find(s => s.table.toLowerCase() === m2.toLowerCase())?.columns.filter(c => !c.isAlterTarget).map(c => c.name.toLowerCase()) || [];
    const expectedColsRel = cs.schemaMetadata.find(s => s.table.toLowerCase() === rel.toLowerCase())?.columns.map(c => c.name.toLowerCase()) || [];

    for (const col of expectedColsM1) { if (!dCols.includes(col)) return { passed: false, reason: `Kolom '${col}' belum ditemukan pada tabel ${m1}.` }; }
    for (const col of expectedColsM2) { if (!pCols.includes(col)) return { passed: false, reason: `Kolom '${col}' belum ditemukan pada tabel ${m2}.` }; }
    for (const col of expectedColsRel) { if (!kCols.includes(col)) return { passed: false, reason: `Kolom '${col}' belum ditemukan pada tabel ${rel}.` }; }
    return { passed: true, reason: `Database serta ketiga tabel (${m1}, ${m2}, ${rel}) berhasil dibuat secara nyata sesuai rancangan ERD & TRD Anda!` };
  }

  if (q.type === 'DDL_ALTER_TABLE') {
    const targetTable = cs.alterTable;
    const colName = cs.alterColumn;
    const regex = new RegExp(`ALTER\\s+TABLE\\s+${targetTable}\\b`, 'i');
    if (!regex.test(cleanSql)) return { passed: false, reason: `Gunakan perintah ALTER TABLE ${targetTable} ADD ... untuk memodifikasi struktur tabel ${targetTable}.` };
    const pCols = getTableColumns(targetTable).map(c => c.name.toLowerCase());
    if (!pCols.includes(colName.toLowerCase())) return { passed: false, reason: `Kolom '${colName}' belum ditemukan pada tabel ${targetTable} setelah perintah dijalankan.` };
    return { passed: true, reason: `Struktur tabel ${targetTable} berhasil diperbarui dengan penambahan kolom '${colName}' menggunakan ALTER TABLE!` };
  }

  if (q.type === 'DML_INSERT') {
    if (!/INSERT\s+INTO\b/i.test(cleanSql)) return { passed: false, reason: 'Gunakan perintah INSERT INTO untuk mengisi record ke dalam tabel.' };
    runRealSqlQuery(`DELETE FROM ${rel}; DELETE FROM ${m2}; DELETE FROM ${m1};`);
    runRealSqlQuery(cleanSql);
    const m1Rows = getTableRows(m1);
    const m2Rows = getTableRows(m2);
    const relRows = getTableRows(rel);
    const targetId = cs.deleteTargetId;

    if (m1Rows.length < 2) return { passed: false, reason: `Tabel ${m1} baru berisi ${m1Rows.length} record (minimal 2 record).` };
    if (m2Rows.length < 3) return { passed: false, reason: `Tabel ${m2} baru berisi ${m2Rows.length} record (minimal 3 record, termasuk ID ${targetId}).` };
    const hasTargetId = m2Rows.some(r => Number(r[0]) === targetId);
    if (!hasTargetId) return { passed: false, reason: `Pastikan salah satu record ${m2} yang di-insert memiliki ID ${cs.deleteKeyCol} = ${targetId} (untuk digunakan pada soal DELETE berikutnya).` };
    if (relRows.length < 1) return { passed: false, reason: `Tabel ${rel} masih kosong (minimal isi 1 record transaksi).` };
    return { passed: true, reason: `Berhasil mengisi record ke tabel ${m1}, ${m2}, dan ${rel} ke dalam database!` };
  }

  if (q.type === 'DML_DELETE') {
    const targetTable = cs.alterTable;
    const targetId = cs.deleteTargetId;
    const idKey = cs.deleteKeyCol;
    const regex = new RegExp(`DELETE\\s+FROM\\s+${targetTable}\\b`, 'i');
    if (!regex.test(cleanSql)) return { passed: false, reason: `Gunakan perintah DELETE FROM ${targetTable} WHERE ... untuk menghapus record ${targetTable}.` };
    ensurePrerequisiteStateForQuestion(5);
    runRealSqlQuery(`DELETE FROM ${targetTable};`);
    if (cs.seedRecords && cs.seedRecords.master2) {
      cs.seedRecords.master2.forEach(sql => runRealSqlQuery(sql));
    }
    runRealSqlQuery(cleanSql);
    const remainingRows = getTableRows(targetTable);
    const stillHasTarget = remainingRows.some(r => Number(r[0]) === targetId);
    const remainingCount = remainingRows.length;
    const resultContainer = document.getElementById('queryResultContainer');
    resultContainer.innerHTML = buildHtmlTable(getTableColumns(targetTable).map(c => c.name), remainingRows);
    if (stillHasTarget) return { passed: false, reason: `Record ${targetTable} dengan ${idKey} = ${targetId} masih ada di dalam tabel. Periksa kondisi WHERE ${idKey} = ${targetId}.` };
    if (remainingCount < 2) return { passed: false, reason: `Hati-hati! Record ${targetTable} lain ikut terhapus. Pastikan hanya menghapus record dengan ${idKey} = ${targetId}.` };
    return { passed: true, reason: `Tepat sekali! Record ${targetTable} ${idKey} = ${targetId} berhasil dihapus tanpa menghapus data lainnya.` };
  }

  return { passed: false, reason: 'Kriteria soal belum terpenuhi.' };
}

function showGradingBanner(isSuccess, message) {
  const banner = document.getElementById('gradingFeedbackBanner');
  banner.classList.remove('hidden');
  if (isSuccess) {
    banner.className = 'p-3.5 rounded-xl border text-xs leading-relaxed bg-emerald-950/40 border-emerald-500/40 text-emerald-200';
    banner.innerHTML = `<strong class="text-emerald-400 block mb-0.5">&#10003; Verifikasi Berhasil (Jawaban Benar)</strong>${escapeHtml(message)}`;
  } else {
    banner.className = 'p-3.5 rounded-xl border text-xs leading-relaxed bg-rose-950/40 border-rose-500/40 text-rose-200';
    banner.innerHTML = `<strong class="text-rose-400 block mb-0.5">&#10007; Belum Tepat — Perlu Perbaikan Query</strong>${escapeHtml(message)}`;
  }
}

function showExpectedReferencePreview() {
  if (currentUserRole !== 'dosen') return;
  const q = CASE_STUDY_QUESTIONS.find(item => item.id === appState.activeQuestionId);
  const box = document.getElementById('expectedOutputPreviewBox');
  const wrapper = document.getElementById('expectedOutputTableWrapper');
  wrapper.innerHTML = `<div class="p-3 rounded-lg bg-stone-900 border border-stone-800 text-xs text-stone-200 space-y-1.5"><div class="font-semibold text-emerald-400">Kondisi Database yang Diharapkan pada Soal #${q.id}:</div><p class="text-stone-300">${escapeHtml(q.referenceDesc)}</p><div class="text-[11px] font-mono-code text-amber-300 pt-1">Target: ${escapeHtml(q.expectedColumns.join(' | '))}</div></div>`;
  box.classList.remove('hidden');
}

/********************************************************************
 * 9. SUMMARY MODAL & REPORT EXPORT
 ********************************************************************/
function getLetterGrade(score) {
  if (score >= 86) return 'A';
  if (score >= 76) return 'AB';
  if (score >= 66) return 'B';
  if (score >= 56) return 'BC';
  if (score >= 45) return 'C';
  return 'D';
}

function openSummaryModal() {
  saveCurrentEditorDraft();
  if (!appState.student) return;
  const score = computeTotalScore();
  const solved = computeSolvedCount();
  const grade = getLetterGrade(score);
  document.getElementById('modalStudentName').textContent = appState.student.nama;
  document.getElementById('modalStudentNrp').textContent = `NRP: ${appState.student.nrp}`;
  document.getElementById('modalStudentClass').textContent = appState.student.kelas;
  document.getElementById('modalSolvedCount').textContent = `${solved} dari ${CASE_STUDY_QUESTIONS.length} Soal Terverifikasi`;
  document.getElementById('modalDurationText').textContent = `Durasi Pengerjaan: ${formatDuration(appState.elapsedSeconds)}`;
  document.getElementById('modalFinalScore').textContent = `${score} / 100`;
  document.getElementById('modalGradeBadge').textContent = grade;
  const tbody = document.getElementById('modalBreakdownTbody');
  tbody.innerHTML = '';
  CASE_STUDY_QUESTIONS.forEach(q => {
    const sub = appState.submissions[q.id] || { query: '', solved: false, pointsEarned: 0, attempts: 0 };
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="py-2.5 px-3 font-mono-code text-stone-400">#${q.id}</td>
      <td class="py-2.5 px-3"><div class="font-semibold text-white">${escapeHtml(q.title)}</div><pre class="mt-1 p-2 rounded bg-stone-900 border border-stone-800 font-mono-code text-[11px] text-amber-300 overflow-x-auto whitespace-pre-wrap">${escapeHtml(sub.query || '-- Belum diisi')}</pre></td>
      <td class="py-2.5 px-3 whitespace-nowrap">${sub.solved ? '<span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">Benar</span>' : `<span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-stone-800 text-stone-400">Belum Selesai (${sub.attempts}x)</span>`}</td>
      <td class="py-2.5 px-3 text-right font-mono-code font-bold ${sub.solved ? 'text-emerald-400' : 'text-stone-500'}">${sub.pointsEarned} / ${q.points}</td>
    `;
    tbody.appendChild(tr);
  });
  document.getElementById('summaryModal').classList.remove('hidden');
}

function triggerTabSwitchAutoSubmit(triggerSource) {
  if (!appState.student || isExamLockedByAutoSubmit || currentUserRole === 'dosen') return;
  isExamLockedByAutoSubmit = true;
  saveCurrentEditorDraft();
  if (timerIntervalId) clearInterval(timerIntervalId);
  const violationReason = `Auto-Submit (${triggerSource})`;
  lockCurrentStudentAttempt(violationReason);
  clearStateStorage();
  openSummaryModal();
  const banner = document.getElementById('autoSubmitViolationBanner');
  const detail = document.getElementById('autoSubmitViolationDetail');
  if (banner && detail) {
    banner.classList.remove('hidden');
    detail.textContent = `Sistem mendeteksi aktivitas "${triggerSource}" pada pukul ${new Date().toLocaleTimeString('id-ID')}. Sesuai aturan ujian, sesi pengerjaan Anda untuk NIM ${appState.student.nrp} (${appState.student.nama}) otomatis di-submit dan dikunci permanen dengan skor akhir ${computeTotalScore()}/100.`;
  }
  const btnContinue = document.getElementById('btnContinueExam');
  const btnClose = document.getElementById('btnCloseSummaryModal');
  const btnFinalize = document.getElementById('btnFinalizeAndLockExam');
  if (btnContinue) btnContinue.classList.add('hidden');
  if (btnClose) btnClose.classList.add('hidden');
  if (btnFinalize) { btnFinalize.textContent = 'Kembali ke Halaman Login (Sesi Terkunci)'; }
  showToast('PELANGGARAN TERDETEKSI: Membuka tab/jendela lain! Jawaban Anda telah di-Auto Submit & disimpan ke SQLite.', 'error');
}

function generatePlainTextReport() {
  const score = computeTotalScore();
  const solved = computeSolvedCount();
  const lines = [
    '============================================================',
    'BUKTI HASIL ASESMEN PRAKTIKUM PEMROGRAMAN DATABASE',
    'Materi: ERD, TRD, CREATE DB/TABLE, ALTER, INSERT & DELETE',
    'Studi Kasus: Sistem Informasi Klinik SehatKampus',
    'Penyimpanan Basis Data: SQLite 3 Engine',
    '============================================================',
    `Nama Mahasiswa : ${appState.student.nama}`,
    `NRP / NIM      : ${appState.student.nrp}`,
    `Kelas          : ${appState.student.kelas}`,
    `Durasi Ujian   : ${formatDuration(appState.elapsedSeconds)}`,
    `Soal Selesai   : ${solved} / ${CASE_STUDY_QUESTIONS.length}`,
    `Skor Akhir     : ${score} / 100 (Grade ${getLetterGrade(score)})`,
    '------------------------------------------------------------'
  ];
  CASE_STUDY_QUESTIONS.forEach(q => {
    const sub = appState.submissions[q.id];
    lines.push(`Soal #${q.id}: ${q.title} [${sub.solved ? 'BENAR' : 'BELUM TEPAT'} - ${sub.pointsEarned}/${q.points} Poin]`);
    lines.push(`Query Mahasiswa:\n${sub.query.trim()}`);
    lines.push('------------------------------------------------------------');
  });
  return lines.join('\n');
}

function copyTextWithFallback(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(
      () => showToast('Laporan hasil asesmen berhasil disalin ke Clipboard!', 'success'),
      () => fallbackExecCopy(text)
    );
  } else {
    fallbackExecCopy(text);
  }
}

function fallbackExecCopy(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.left = '-9999px';
  document.body.appendChild(ta);
  ta.select();
  try {
    document.execCommand('copy');
    showToast('Laporan hasil asesmen berhasil disalin ke Clipboard!', 'success');
  } catch (err) {
    showToast('Gagal menyalin otomatis, silakan unduh laporan JSON.', 'error');
  }
  document.body.removeChild(ta);
}

/********************************************************************
 * 10. VIEW TRANSITIONS & INITIALIZATION
 ********************************************************************/
function switchSidebarTab(tabName) {
  const btnQ = document.getElementById('tabBtnQuestions');
  const btnS = document.getElementById('tabBtnSchema');
  const btnD = document.getElementById('tabBtnDataPreview');
  const panelQ = document.getElementById('panelQuestionsList');
  const panelS = document.getElementById('panelSchemaExplorer');
  const panelD = document.getElementById('panelDataPreview');
  const activeClass = 'flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition bg-brand-600 text-white shadow';
  const inactiveClass = 'flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition text-stone-400 hover:text-white';
  btnQ.className = tabName === 'questions' ? activeClass : inactiveClass;
  btnS.className = tabName === 'schema' ? activeClass : inactiveClass;
  btnD.className = tabName === 'data' ? activeClass : inactiveClass;
  panelQ.classList.toggle('hidden', tabName !== 'questions');
  panelS.classList.toggle('hidden', tabName !== 'schema');
  panelD.classList.toggle('hidden', tabName !== 'data');
}

function enterWorkspaceView() {
  isExamLockedByAutoSubmit = false;
  const banner = document.getElementById('autoSubmitViolationBanner');
  const btnContinue = document.getElementById('btnContinueExam');
  const btnClose = document.getElementById('btnCloseSummaryModal');
  const btnFinalize = document.getElementById('btnFinalizeAndLockExam');
  if (banner) banner.classList.add('hidden');
  if (btnContinue) btnContinue.classList.remove('hidden');
  if (btnClose) btnClose.classList.remove('hidden');
  if (btnFinalize) btnFinalize.textContent = 'Kumpulkan Final & Selesai (Kunci NIM)';

  document.getElementById('loginView').classList.add('hidden');
  document.getElementById('examWorkspaceView').classList.remove('hidden');
  const guestActions = document.getElementById('guestHeaderActions');
  if (guestActions) guestActions.classList.add('hidden');
  const studentBar = document.getElementById('studentHeaderBar');
  studentBar.classList.remove('hidden');
  studentBar.classList.add('flex');

  updateHeaderStats();
  renderQuestionSidebarCards();
  renderSchemaExplorer();
  renderLiveTablePreview('dokter');
  renderActiveQuestion();
  startExamTimer();
  applyRoleRestrictions();
}

window.addEventListener('DOMContentLoaded', async () => {
  await initSqlEngines();
  initDefaultSubmissions();

  if (loadStateFromStorage()) {
    currentUserRole = appState.student.role || 'mahasiswa';
    enterWorkspaceView();
    showToast(`Sesi dilanjutkan untuk ${appState.student.nama} (${appState.student.nrp})`, 'info');
  }

  renderCompletedParticipantsOnLogin();

  document.getElementById('studentLoginForm').addEventListener('submit', e => {
    e.preventDefault();
    const errBox = document.getElementById('loginErrorBox');

    if (currentLoginRole === 'dosen') {
      const dosenNama = document.getElementById('inputDosenNama').value.trim();
      const dosenPassword = document.getElementById('inputDosenPassword').value;

      if (dosenNama.length < 2) {
        errBox.textContent = 'Mohon isi Nama Dosen dengan benar (minimal 2 karakter).';
        errBox.classList.remove('hidden');
        return;
      }

      if (dosenPassword !== DOSEN_PASSWORD) {
        errBox.innerHTML = '<strong>Password Salah!</strong> Password yang Anda masukkan tidak sesuai. Hubungi administrator jika lupa password.';
        errBox.classList.remove('hidden');
        showToast('Password dosen salah!', 'error');
        return;
      }

      errBox.classList.add('hidden');
      currentUserRole = 'dosen';
      resetAllDatabases();
      appState = {
        student: { nama: dosenNama, nrp: 'DOSEN', kelas: 'Pengawas Asesmen', startTime: new Date().toISOString(), role: 'dosen' },
        activeQuestionId: 1, elapsedSeconds: 0, submissions: {}
      };
      initDefaultSubmissions();
      saveStateToStorage();
      recordActivityLogInSqlite('LOGIN_DOSEN', `Dosen ${dosenNama} berhasil login`);
      enterWorkspaceView();
      showToast(`Selamat datang, ${dosenNama}! Anda login sebagai Dosen/Pengawas.`, 'success');
      return;
    }

    // MAHASISWA LOGIN
    const nama = document.getElementById('inputNama').value.trim();
    const nrp = document.getElementById('inputNrp').value.trim();
    const kelas = document.getElementById('inputKelas').value;

    if (nama.length < 3) {
      errBox.textContent = 'Mohon isi Nama Lengkap Mahasiswa dengan benar (minimal 3 karakter).';
      errBox.classList.remove('hidden');
      return;
    }
    if (nrp.length < 4) {
      errBox.textContent = 'Mohon isi NIM / NRP Mahasiswa dengan benar (minimal 4 karakter/angka).';
      errBox.classList.remove('hidden');
      return;
    }

    // Check 1x attempt restriction in SQLite database
    const prevAttempt = findExistingAttempt(nama, nrp);
    if (prevAttempt) {
      errBox.innerHTML = `<strong>Akses Ditolak (Batas 1x Pengerjaan):</strong> Mahasiswa dengan Nama <strong>${escapeHtml(prevAttempt.nama)}</strong> atau NIM/NRP <strong>${escapeHtml(prevAttempt.nrp)}</strong> tercatat di database SQLite sudah pernah mengerjakan asesmen ini dengan skor <strong>${prevAttempt.score}/100 (Grade ${escapeHtml(prevAttempt.grade)})</strong> pada ${escapeHtml(prevAttempt.completedAt)}. Silakan gunakan identitas peserta lain yang belum mengerjakan.`;
      errBox.classList.remove('hidden');
      showToast('Nama atau NIM tersebut sudah pernah mengerjakan (Hanya bisa 1x)!', 'error');
      return;
    }

    errBox.classList.add('hidden');
    currentUserRole = 'mahasiswa';
    resetAllDatabases();
    appState = {
      student: { nama, nrp, kelas, startTime: new Date().toISOString(), role: 'mahasiswa' },
      activeQuestionId: 1, elapsedSeconds: 0, submissions: {}
    };
    initDefaultSubmissions();
    saveStateToStorage();
    recordActivityLogInSqlite('LOGIN_MAHASISWA', `Mahasiswa ${nama} (${nrp}) memulai ujian`);
    enterWorkspaceView();
    showToast(`Selamat mengerjakan, ${nama} (${nrp})! Tersimpan di SQLite.`, 'success');
  });

  document.getElementById('btnFillDemoStudent')?.addEventListener('click', () => {
    const usedCount = getCompletedStudentsList().length;
    if (usedCount === 0) {
      document.getElementById('inputNama').value = 'Nadia Putri Maharani';
      document.getElementById('inputNrp').value = '5025221088';
    } else {
      document.getElementById('inputNama').value = `Mahasiswa Praktikum ${usedCount + 1}`;
      document.getElementById('inputNrp').value = `502522109${usedCount}`;
    }
    document.getElementById('loginErrorBox').classList.add('hidden');
  });

  document.getElementById('tabBtnQuestions').addEventListener('click', () => switchSidebarTab('questions'));
  document.getElementById('tabBtnSchema').addEventListener('click', () => { renderSchemaExplorer(); switchSidebarTab('schema'); });
  document.getElementById('tabBtnDataPreview').addEventListener('click', () => {
    switchSidebarTab('data');
    renderLiveTablePreview(document.getElementById('selectPreviewTable').value);
  });
  document.getElementById('selectPreviewTable').addEventListener('change', e => {
    renderLiveTablePreview(e.target.value);
  });

  document.getElementById('btnPrevQuestion').addEventListener('click', () => {
    if (appState.activeQuestionId > 1) {
      saveCurrentEditorDraft();
      appState.activeQuestionId--;
      renderActiveQuestion();
      renderQuestionSidebarCards();
    }
  });
  document.getElementById('btnNextQuestion').addEventListener('click', () => {
    if (appState.activeQuestionId < CASE_STUDY_QUESTIONS.length) {
      saveCurrentEditorDraft();
      appState.activeQuestionId++;
      renderActiveQuestion();
      renderQuestionSidebarCards();
    }
  });

  document.getElementById('btnToggleHint').addEventListener('click', () => {
    if (currentUserRole !== 'dosen') return;
    document.getElementById('activeQuestionHintBox').classList.toggle('hidden');
  });

  document.querySelectorAll('.sql-snippet-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      insertIntoEditor(btn.getAttribute('data-snippet'));
    });
  });

  document.getElementById('btnClearEditor').addEventListener('click', () => {
    document.getElementById('sqlEditorTextarea').value = '';
    saveCurrentEditorDraft();
  });
  document.getElementById('btnResetDatabase').addEventListener('click', () => {
    resetAllDatabases();
    renderSchemaExplorer();
    renderLiveTablePreview(document.getElementById('selectPreviewTable').value);
    showToast('Tabel studi kasus di database SQLite berhasil di-reset ke kondisi kosong.', 'info');
  });
  document.getElementById('btnResetDbFromSchema').addEventListener('click', () => {
    resetAllDatabases();
    renderSchemaExplorer();
    renderLiveTablePreview(document.getElementById('selectPreviewTable').value);
    showToast('Database SQLite berhasil di-reset ke kondisi awal.', 'info');
  });

  // Initialize Drag & Drop System for ERD and TRD
  const initDragAndDropSystem = () => {
    document.querySelectorAll('.drag-chip').forEach(chip => {
      chip.setAttribute('draggable', 'true');

      chip.addEventListener('dragstart', e => {
        chip.classList.add('is-dragging');
        const data = {
          type: chip.getAttribute('data-type'),
          val: chip.getAttribute('data-val'),
          label: chip.textContent.trim()
        };
        e.dataTransfer.setData('text/plain', JSON.stringify(data));
        e.dataTransfer.effectAllowed = 'copyMove';
      });

      chip.addEventListener('dragend', () => {
        chip.classList.remove('is-dragging');
        document.querySelectorAll('.drop-slot').forEach(s => s.classList.remove('drag-over'));
      });

      chip.addEventListener('click', () => {
        if (selectedPaletteChip && selectedPaletteChip.chip === chip) {
          chip.classList.remove('is-selected');
          selectedPaletteChip = null;
          return;
        }
        document.querySelectorAll('.drag-chip').forEach(c => c.classList.remove('is-selected'));
        chip.classList.add('is-selected');
        selectedPaletteChip = {
          chip,
          type: chip.getAttribute('data-type'),
          val: chip.getAttribute('data-val'),
          label: chip.textContent.trim(),
          isErd: !!chip.closest('#erdBuilderPanel')
        };
        showToast(`Item "${chip.textContent.trim()}" dipilih. Klik slot target untuk meletakkannya.`, 'info');
      });
    });

    document.querySelectorAll('.drop-slot').forEach(slot => {
      const isErd = !!slot.closest('#erdBuilderPanel');

      slot.addEventListener('dragover', e => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        slot.classList.add('drag-over');
      });

      slot.addEventListener('dragleave', () => {
        slot.classList.remove('drag-over');
      });

      slot.addEventListener('drop', e => {
        e.preventDefault();
        slot.classList.remove('drag-over');
        let data = null;
        try {
          data = JSON.parse(e.dataTransfer.getData('text/plain'));
        } catch (err) {
          return;
        }
        if (!data) return;
        placeChipInSlot(slot, data.type, data.val, data.label, isErd);
        if (selectedPaletteChip) {
          selectedPaletteChip.chip.classList.remove('is-selected');
          selectedPaletteChip = null;
        }
      });

      slot.addEventListener('click', e => {
        const clearBtn = e.target.closest('.btn-clear-slot');
        if (clearBtn) {
          e.stopPropagation();
          clearSlot(slot, isErd);
          return;
        }

        if (selectedPaletteChip) {
          if (selectedPaletteChip.isErd !== isErd) {
            showToast('Komponen tidak dapat dipindahkan antar nomor soal.', 'error');
            return;
          }
          const placed = placeChipInSlot(slot, selectedPaletteChip.type, selectedPaletteChip.val, selectedPaletteChip.label, isErd);
          if (placed) {
            selectedPaletteChip.chip.classList.remove('is-selected');
            selectedPaletteChip = null;
          }
        }
      });
    });
  };

  initDragAndDropSystem();

  document.getElementById('btnResetDesignForm').addEventListener('click', () => {
    const q = CASE_STUDY_QUESTIONS.find(item => item.id === appState.activeQuestionId);
    if (q && q.type === 'DESIGN_ERD') {
      erdDesignState = { ent1Name: '', ent1Pk: '', ent1Attrs: '', entRelName: '', entRelAttrs: '', cardinality: '', ent2Name: '', ent2Pk: '', ent2Attrs: '' };
      syncErdSlotsFromState();
      renderLiveErdCanvas();
      syncVisualDesignToEditor();
      showToast('Kanvas perancangan ERD berhasil dikosongkan.', 'info');
    } else if (q && q.type === 'DESIGN_TRD') {
      trdDesignState = { dokterPk: '', dokterFk: '', kunjunganPk: '', kunjunganFk1: '', kunjunganFk2: '', pasienPk: '', pasienDateType: '' };
      syncTrdSlotsFromState();
      renderLiveTrdCanvas();
      syncVisualDesignToEditor();
      showToast('Kanvas perancangan TRD berhasil dikosongkan.', 'info');
    }
    if (selectedPaletteChip) {
      selectedPaletteChip.chip.classList.remove('is-selected');
      selectedPaletteChip = null;
    }
    saveStateToStorage();
  });

  document.getElementById('btnVerifyVisualDesign').addEventListener('click', handleVerifyAndSubmitAnswer);
  document.getElementById('btnRunQuery').addEventListener('click', handleRunUserQuery);
  document.getElementById('btnSubmitAnswer').addEventListener('click', handleVerifyAndSubmitAnswer);

  document.getElementById('sqlEditorTextarea').addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleRunUserQuery();
    }
  });

  document.getElementById('btnCompareExpected').addEventListener('click', showExpectedReferencePreview);
  document.getElementById('btnCloseExpectedPreview').addEventListener('click', () => {
    document.getElementById('expectedOutputPreviewBox').classList.add('hidden');
  });

  document.getElementById('btnOpenSummary').addEventListener('click', openSummaryModal);
  document.getElementById('btnCloseSummaryModal').addEventListener('click', () => {
    document.getElementById('summaryModal').classList.add('hidden');
  });
  document.getElementById('btnContinueExam').addEventListener('click', () => {
    document.getElementById('summaryModal').classList.add('hidden');
  });

  document.getElementById('btnCopyReportText').addEventListener('click', () => {
    copyTextWithFallback(generatePlainTextReport());
  });

  document.getElementById('btnDownloadReportJson').addEventListener('click', () => {
    const payload = {
      aplikasi: 'SQLCaseLab - Asesmen ERD, TRD, DDL & DML (Klinik SehatKampus)',
      database_engine: 'SQLite 3 WASM',
      mahasiswa: appState.student,
      durasi_detik: appState.elapsedSeconds,
      skor_akhir: computeTotalScore(),
      grade: getLetterGrade(computeTotalScore()),
      jawaban: appState.submissions
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    isInternalDownloadActive = true;
    setTimeout(() => { isInternalDownloadActive = false; }, 1500);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Hasil_Asesmen_Database_${appState.student.nrp}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('File JSON hasil asesmen berhasil diunduh!', 'success');
  });

  document.getElementById('btnLogoutStudent').addEventListener('click', () => {
    document.getElementById('logoutConfirmModal').classList.remove('hidden');
  });
  document.getElementById('btnCancelLogout').addEventListener('click', () => {
    document.getElementById('logoutConfirmModal').classList.add('hidden');
  });

  // UNDUH FILE DATABASE SQLITE (.sqlite)
  document.getElementById('btnDownloadSqliteFile').addEventListener('click', () => {
    if (sqliteDb && typeof sqliteDb.export === 'function') {
      const binaryArray = sqliteDb.export();
      const blob = new Blob([binaryArray], { type: 'application/x-sqlite3' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `klinik_sehatkampus_${appState.student ? appState.student.nrp : 'db'}.sqlite`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('File database SQLite (.sqlite) lengkap dengan tabel dan data peserta berhasil diunduh!', 'success');
    } else {
      const sqlDump = Object.values(appState.submissions).map(s => s.query).join('\n\n');
      const blob = new Blob([sqlDump], { type: 'application/sql' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `klinik_sehatkampus_${appState.student ? appState.student.nrp : 'db'}.sqlite.sql`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('Script database SQLite berhasil diunduh!', 'success');
    }
  });

  const finalizeAndExitSession = () => {
    const finishedName = appState.student ? appState.student.nama : '';
    const finishedNrp = appState.student ? appState.student.nrp : '';
    if (currentUserRole !== 'dosen') {
      lockCurrentStudentAttempt('Terkumpul Final');
    }
    if (timerIntervalId) clearInterval(timerIntervalId);
    clearStateStorage();
    resetAllDatabases();
    appState = { student: null, activeQuestionId: 1, elapsedSeconds: 0, submissions: {} };
    currentUserRole = null;
    initDefaultSubmissions();
    document.getElementById('summaryModal').classList.add('hidden');
    document.getElementById('logoutConfirmModal').classList.add('hidden');
    document.getElementById('examWorkspaceView').classList.add('hidden');
    document.getElementById('studentHeaderBar').classList.add('hidden');
    document.getElementById('studentHeaderBar').classList.remove('flex');
    const guestActions = document.getElementById('guestHeaderActions');
    if (guestActions) guestActions.classList.remove('hidden');
    document.getElementById('loginView').classList.remove('hidden');
    const inNama = document.getElementById('inputNama');
    if (inNama) inNama.value = '';
    const inNrp = document.getElementById('inputNrp');
    if (inNrp) inNrp.value = '';
    const inDosenNama = document.getElementById('inputDosenNama');
    if (inDosenNama) inDosenNama.value = '';
    const inDosenPassword = document.getElementById('inputDosenPassword');
    if (inDosenPassword) inDosenPassword.value = '';
    const rBadge = document.getElementById('roleBadge');
    if (rBadge) rBadge.classList.add('hidden');
    switchLoginRole('mahasiswa');
    renderCompletedParticipantsOnLogin();
    if (finishedNrp !== 'DOSEN') {
      showToast(`Jawaban ${finishedName} (${finishedNrp}) telah tersimpan permanen di SQLite (1x pengerjaan).`, 'success');
    } else {
      showToast('Sesi Dosen berakhir. Terima kasih.', 'success');
    }
  };

  document.getElementById('btnFinalizeAndLockExam').addEventListener('click', finalizeAndExitSession);
  document.getElementById('btnConfirmLogout').addEventListener('click', finalizeAndExitSession);

  // ANTI-CHEAT MONITORING: Hanya untuk role Mahasiswa
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && appState.student && !isExamLockedByAutoSubmit && currentUserRole === 'mahasiswa') {
      triggerTabSwitchAutoSubmit('Buka Tab Lain');
    }
  });

  window.addEventListener('blur', () => {
    if (appState.student && !isExamLockedByAutoSubmit && !isInternalDownloadActive && currentUserRole === 'mahasiswa') {
      setTimeout(() => {
        if (!document.hasFocus() && appState.student && !isExamLockedByAutoSubmit && !isInternalDownloadActive && currentUserRole === 'mahasiswa') {
          triggerTabSwitchAutoSubmit('Pindah Jendela / Tab');
        }
      }, 150);
    }
  });
});
