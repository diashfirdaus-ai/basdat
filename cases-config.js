/**
 * ============================================================================
 * SQLCaseLab — Konfigurasi Bank Soal Per Kelas (A, B, C)
 * ITENAS Bandung - Praktikum Pemrograman Database
 * ============================================================================
 */

const CASE_STUDY_CLASSES = {
  'Kelas A': {
    code: 'A',
    className: 'Kelas A',
    caseTitle: 'Sistem Informasi Klinik SehatKampus',
    dbName: 'db_klinik_sehatkampus',
    master1Name: 'dokter',
    master2Name: 'pasien',
    relName: 'kunjungan',
    alterTable: 'pasien',
    alterColumn: 'no_telepon',
    alterType: 'VARCHAR(20)',
    insertTargetTable: 'pasien',
    deleteKeyCol: 'id_pasien',
    deleteTargetId: 103,
    sampleInsertIds: [101, 102, 103],
    schemaMetadata: [
      {
        table: 'dokter',
        entityName: 'Entitas DOKTER',
        desc: 'Menyimpan data master dokter bertugas di Klinik SehatKampus',
        columns: [
          { name: 'id_dokter', type: 'INT', pk: true, note: 'Primary Key' },
          { name: 'nama_dokter', type: 'VARCHAR(100)', note: 'Nama dokter' },
          { name: 'spesialis', type: 'VARCHAR(50)', note: 'Spesialisasi medis' }
        ]
      },
      {
        table: 'pasien',
        entityName: 'Entitas PASIEN',
        desc: 'Menyimpan data pasien klinik yang berobat (ditambah kolom no_telepon di Soal #4)',
        columns: [
          { name: 'id_pasien', type: 'INT', pk: true, note: 'Primary Key' },
          { name: 'nama_pasien', type: 'VARCHAR(100)', note: 'Nama pasien' },
          { name: 'tgl_lahir', type: 'DATE', note: 'Tanggal lahir' },
          { name: 'no_telepon', type: 'VARCHAR(20)', isAlterTarget: true, note: 'Ditambahkan via ALTER TABLE' }
        ]
      },
      {
        table: 'kunjungan',
        entityName: 'Entitas Transaksi KUNJUNGAN',
        desc: 'Relasi transaksi pemeriksaan 1:N dokter & pasien',
        columns: [
          { name: 'id_kunjungan', type: 'INT', pk: true, note: 'Primary Key' },
          { name: 'id_pasien', type: 'INT', fk: 'pasien.id_pasien', note: 'Foreign Key ke pasien' },
          { name: 'id_dokter', type: 'INT', fk: 'dokter.id_dokter', note: 'Foreign Key ke dokter' },
          { name: 'tgl_kunjungan', type: 'DATE', note: 'Tanggal periksa' },
          { name: 'diagnosa', type: 'VARCHAR(150)', note: 'Hasil diagnosa' }
        ]
      }
    ],
    erdPalette: {
      entities: [
        { val: 'DOKTER', label: '🏢 DOKTER' },
        { val: 'KUNJUNGAN', label: '📋 KUNJUNGAN' },
        { val: 'PASIEN', label: '👤 PASIEN' },
        { val: 'OBAT', label: '💊 OBAT' },
        { val: 'KASIR', label: '🛒 KASIR' }
      ],
      pk: [
        { val: 'id_dokter', label: '🔑 id_dokter' },
        { val: 'id_pasien', label: '🔑 id_pasien' },
        { val: 'id_obat', label: '🔑 id_obat' }
      ],
      attrs: [
        { val: 'nama_dokter, spesialis', label: 'nama_dokter, spesialis' },
        { val: 'nama_pasien, tgl_lahir', label: 'nama_pasien, tgl_lahir' },
        { val: 'id_kunjungan (PK), tgl_kunjungan, diagnosa', label: 'id_kunjungan (PK), tgl_kunjungan, diagnosa' },
        { val: 'harga_obat, stok', label: 'harga_obat, stok' }
      ],
      cardinalities: [
        { val: '1:N', label: '⟷ 1 : N' },
        { val: '1:1', label: '⟷ 1 : 1' },
        { val: 'M:N', label: '⟷ M : N' }
      ]
    },
    trdPalette: {
      pk: [
        { val: 'id_dokter INT PRIMARY KEY', label: '🔑 id_dokter (INT PK)' },
        { val: 'id_kunjungan INT PRIMARY KEY', label: '🔑 id_kunjungan (INT PK)' },
        { val: 'id_pasien INT PRIMARY KEY', label: '🔑 id_pasien (INT PK)' },
        { val: 'nama_dokter VARCHAR(100) PRIMARY KEY', label: 'nama_dokter (VARCHAR PK)' }
      ],
      fk: [
        { val: 'id_dokter -> dokter(id_dokter)', label: '🔗 FK: id_dokter → dokter' },
        { val: 'id_pasien -> pasien(id_pasien)', label: '🔗 FK: id_pasien → pasien' },
        { val: 'NONE', label: '⛔ Tanpa FK (Master Sisi 1)' },
        { val: 'FK_KUNJUNGAN', label: '🔗 id_kunjungan (FK)' }
      ],
      types: [
        { val: 'DATE', label: 'Tipe: DATE' },
        { val: 'INT', label: 'Tipe: INT' },
        { val: 'VARCHAR(150)', label: 'Tipe: VARCHAR(150)' }
      ]
    },
    erdExpected: {
      ent1Name: 'DOKTER', ent1Pk: 'id_dokter', ent1Attrs: 'nama_dokter, spesialis',
      entRelName: 'KUNJUNGAN', entRelAttrs: 'id_kunjungan', cardinality: '1:N',
      ent2Name: 'PASIEN', ent2Pk: 'id_pasien', ent2Attrs: 'nama_pasien, tgl_lahir'
    },
    trdExpected: {
      t1Pk: 'id_dokter INT PRIMARY KEY', t1Fk: 'NONE',
      tRelPk: 'id_kunjungan INT PRIMARY KEY',
      tRelFk1: 'id_dokter -> dokter(id_dokter)', tRelFk2: 'id_pasien -> pasien(id_pasien)',
      t2Pk: 'id_pasien INT PRIMARY KEY', t2Type: 'DATE'
    },
    questions: [
      {
        id: 1,
        title: 'Tahap 1: Merancang ERD (Entity Relationship Diagram) Klinik SehatKampus',
        level: 'Langkah 1 — Perancangan ERD',
        points: 15,
        type: 'DESIGN_ERD',
        scenario: 'Klinik Kesehatan Kampus "SehatKampus": Memiliki banyak DOKTER (id_dokter, nama_dokter, spesialis). Mahasiswa yang berobat dicatat sebagai PASIEN (id_pasien, nama_pasien, tgl_lahir). Setiap pemeriksaan dicatat dalam KUNJUNGAN (id_kunjungan, tgl_kunjungan, diagnosa). Kardinalitas dokter-kunjungan dan pasien-kunjungan adalah 1:N.',
        instruction: 'Susunlah komponen ERD pada kanvas Drag & Drop di atas: (1) Entitas Master #1 DOKTER, (2) Entitas Transaksi KUNJUNGAN (Kardinalitas 1:N), dan (3) Entitas Master #2 PASIEN beserta atributnya, lalu klik "Verifikasi & Simpan Rancangan Diagram".',
        expectedColumns: ['Entitas: DOKTER, KUNJUNGAN, PASIEN', 'Identifier: id_dokter, id_kunjungan, id_pasien', 'Kardinalitas: 1 : N'],
        hint: 'Tentukan entitas master di sisi 1 (DOKTER dan PASIEN) dan entitas transaksi di sisi N (KUNJUNGAN).',
        starterQuery: '-- Susun diagram ERD interaktif pada panel di atas.\n',
        officialSolution: `-- Kunci ERD Kelas A (Klinik):
Master 1  : DOKTER (id_dokter PK, nama_dokter, spesialis)
Transaksi : KUNJUNGAN (id_kunjungan PK, tgl_kunjungan, diagnosa) | Kardinalitas: 1 : N
Master 2  : PASIEN (id_pasien PK, nama_pasien, tgl_lahir)`
      },
      {
        id: 2,
        title: 'Tahap 2: Mentransformasikan ERD Menjadi TRD Fisik (Klinik)',
        level: 'Langkah 2 — Transformasi TRD',
        points: 15,
        type: 'DESIGN_TRD',
        scenario: 'Menerjemahkan rancangan ERD Klinik menjadi skema tabel fisik TRD dengan aturan penempatan Foreign Key yang tepat.',
        instruction: 'Tentukan Primary Key pada tabel dokter, kunjungan, dan pasien, serta tempatkan Foreign Key (id_dokter dan id_pasien) pada tabel kunjungan (sisi N) menggunakan panel kanvas di atas.',
        expectedColumns: ['dokter (PK: id_dokter, Tanpa FK)', 'kunjungan (PK: id_kunjungan, FK: id_dokter & id_pasien)', 'pasien (PK: id_pasien, tgl_lahir: DATE)'],
        hint: 'Tabel master sisi 1 tidak memuat FK. Foreign Key dari dokter dan pasien bermuara di tabel transaksi kunjungan (sisi N).',
        starterQuery: '-- Susun skema TRD interaktif pada panel di atas.\n',
        officialSolution: `-- Kunci TRD Kelas A (Klinik):
1. dokter    : PK id_dokter INT | Tanpa FK
2. kunjungan : PK id_kunjungan INT | FK id_dokter -> dokter | FK id_pasien -> pasien
3. pasien    : PK id_pasien INT | tgl_lahir DATE`
      },
      {
        id: 3,
        title: 'Tahap 3: DDL — Membuat Database & Ketiga Tabel Fisik (CREATE TABLE)',
        level: 'Langkah 3 — DDL CREATE',
        points: 25,
        type: 'DDL_CREATE_DB_AND_TABLES',
        scenario: 'Implementasikan rancangan TRD Klinik ke dalam basis data dengan membuat tabel dokter, pasien, dan kunjungan secara lengkap beserta tipe data dan constraint Primary Key / Foreign Key.',
        instruction: 'Tuliskan perintah CREATE TABLE untuk membuat ketiga tabel fisik: dokter (id_dokter, nama_dokter, spesialis), pasien (id_pasien, nama_pasien, tgl_lahir), dan kunjungan (id_kunjungan, id_pasien, id_dokter, tgl_kunjungan, diagnosa).',
        expectedColumns: ['CREATE TABLE dokter', 'CREATE TABLE pasien', 'CREATE TABLE kunjungan'],
        hint: 'Tuliskan perintah CREATE TABLE satu per satu dengan tipe data integer, varchar, dan date.',
        starterQuery: '-- Tuliskan perintah SQL CREATE TABLE untuk ketiga tabel fisik di sini:\n\n',
        officialSolution: `CREATE TABLE dokter (
  id_dokter INTEGER PRIMARY KEY,
  nama_dokter VARCHAR(100),
  spesialis VARCHAR(50)
);

CREATE TABLE pasien (
  id_pasien INTEGER PRIMARY KEY,
  nama_pasien VARCHAR(100),
  tgl_lahir DATE
);

CREATE TABLE kunjungan (
  id_kunjungan INTEGER PRIMARY KEY,
  id_pasien INTEGER,
  id_dokter INTEGER,
  tgl_kunjungan DATE,
  diagnosa VARCHAR(150),
  FOREIGN KEY (id_pasien) REFERENCES pasien(id_pasien),
  FOREIGN KEY (id_dokter) REFERENCES dokter(id_dokter)
);`
      },
      {
        id: 4,
        title: 'Tahap 4: DDL — Menambahkan Kolom Baru (ALTER TABLE)',
        level: 'Langkah 4 — DDL ALTER',
        points: 15,
        type: 'DDL_ALTER_TABLE',
        scenario: 'Pihak administrasi Klinik SehatKampus membutuhkan kontak pasien untuk follow-up jadwal kontrol.',
        instruction: 'Tuliskan perintah ALTER TABLE pada tabel pasien untuk menambahkan kolom baru bernama no_telepon bertipe data VARCHAR(20).',
        expectedColumns: ['tabel: pasien', 'kolom baru: no_telepon VARCHAR(20)'],
        hint: 'Gunakan perintah ALTER TABLE nama_tabel ADD COLUMN nama_kolom tipe_data;',
        starterQuery: '-- Tuliskan perintah SQL ALTER TABLE di sini:\n\n',
        officialSolution: `ALTER TABLE pasien
ADD COLUMN no_telepon VARCHAR(20);`
      },
      {
        id: 5,
        title: 'Tahap 5: DML — Mengisi Record Data (INSERT INTO)',
        level: 'Langkah 5 — DML INSERT',
        points: 15,
        type: 'DML_INSERT',
        scenario: 'Petugas klinik mulai mencatat data dokter, pasien yang mendaftar, dan transaksi pemeriksaan.',
        instruction: 'Masukkan data menggunakan perintah INSERT INTO:\n- Minimal 2 record pada tabel dokter\n- Minimal 3 record pada tabel pasien (wajib sertakan id_pasien = 101, 102, dan 103)\n- Minimal 1 record pada tabel kunjungan.',
        expectedColumns: ['dokter (>= 2 record)', 'pasien (>= 3 record termasuk ID 103)', 'kunjungan (>= 1 record)'],
        hint: 'Gunakan INSERT INTO nama_tabel VALUES (...); Pastikan id_pasien 103 terisi untuk soal hapus berikutnya.',
        starterQuery: '-- Tuliskan perintah SQL INSERT INTO untuk dokter, pasien, dan kunjungan di sini:\n\n',
        officialSolution: `INSERT INTO dokter VALUES (1, 'dr. Andi Wijaya', 'Umum');
INSERT INTO dokter VALUES (2, 'drg. Sari Kusuma', 'Gigi');

INSERT INTO pasien VALUES (101, 'Raka Pratama', '2004-05-12', '081234567801');
INSERT INTO pasien VALUES (102, 'Nadia Putri', '2005-08-21', '081234567802');
INSERT INTO pasien VALUES (103, 'Budi Santoso', '2004-11-03', '081234567803');

INSERT INTO kunjungan VALUES (501, 101, 1, '2026-10-15', 'Pemeriksaan Flu & Demam');`
      },
      {
        id: 6,
        title: 'Tahap 6: DML — Menghapus Record Pasien Batal Registrasi (DELETE FROM)',
        level: 'Langkah 6 — DML DELETE',
        points: 15,
        type: 'DML_DELETE',
        scenario: 'Pasien dengan id_pasien = 103 membatalkan registrasi dan meminta datanya dihapus dari sistem.',
        instruction: 'Tuliskan perintah DELETE FROM pada tabel pasien untuk menghapus HANYA record dengan id_pasien = 103 (pastikan data pasien 101 dan 102 tidak ikut terhapus).',
        expectedColumns: ['id_pasien = 103 terhapus', 'id_pasien 101 & 102 tetap ada'],
        hint: 'Gunakan klausa WHERE untuk membatasi penghapusan pada id_pasien spesifik.',
        starterQuery: '-- Tuliskan perintah SQL DELETE FROM dengan klausa WHERE di sini:\n\n',
        officialSolution: `DELETE FROM pasien
WHERE id_pasien = 103;`
      }
    ]
  },

  'Kelas B': {
    code: 'B',
    className: 'Kelas B',
    caseTitle: 'Sistem Informasi Perpustakaan SmartCampus',
    dbName: 'db_perpus_smartcampus',
    master1Name: 'anggota',
    master2Name: 'buku',
    relName: 'peminjaman',
    alterTable: 'anggota',
    alterColumn: 'no_telepon',
    alterType: 'VARCHAR(20)',
    insertTargetTable: 'anggota',
    deleteKeyCol: 'id_anggota',
    deleteTargetId: 203,
    sampleInsertIds: [201, 202, 203],
    schemaMetadata: [
      {
        table: 'anggota',
        entityName: 'Entitas ANGGOTA',
        desc: 'Menyimpan data mahasiswa/anggota perpustakaan (ditambah kolom no_telepon di Soal #4)',
        columns: [
          { name: 'id_anggota', type: 'INT', pk: true, note: 'Primary Key' },
          { name: 'nama_anggota', type: 'VARCHAR(100)', note: 'Nama anggota' },
          { name: 'jurusan', type: 'VARCHAR(50)', note: 'Program studi anggota' },
          { name: 'no_telepon', type: 'VARCHAR(20)', isAlterTarget: true, note: 'Ditambahkan via ALTER TABLE' }
        ]
      },
      {
        table: 'buku',
        entityName: 'Entitas BUKU',
        desc: 'Menyimpan katalog buku koleksi perpustakaan kampus',
        columns: [
          { name: 'id_buku', type: 'INT', pk: true, note: 'Primary Key' },
          { name: 'judul_buku', type: 'VARCHAR(120)', note: 'Judul pustaka' },
          { name: 'pengarang', type: 'VARCHAR(80)', note: 'Penulis buku' },
          { name: 'tgl_masuk', type: 'DATE', note: 'Tanggal buku terdaftar' }
        ]
      },
      {
        table: 'peminjaman',
        entityName: 'Entitas Transaksi PEMINJAMAN',
        desc: 'Relasi transaksi peminjaman 1:N anggota & buku',
        columns: [
          { name: 'id_pinjam', type: 'INT', pk: true, note: 'Primary Key' },
          { name: 'id_anggota', type: 'INT', fk: 'anggota.id_anggota', note: 'Foreign Key ke anggota' },
          { name: 'id_buku', type: 'INT', fk: 'buku.id_buku', note: 'Foreign Key ke buku' },
          { name: 'tgl_pinjam', type: 'DATE', note: 'Tanggal transaksi pinjam' },
          { name: 'status_pinjam', type: 'VARCHAR(50)', note: 'Status (Dipinjam / Kembali)' }
        ]
      }
    ],
    erdPalette: {
      entities: [
        { val: 'ANGGOTA', label: '👤 ANGGOTA' },
        { val: 'PEMINJAMAN', label: '📖 PEMINJAMAN' },
        { val: 'BUKU', label: '📚 BUKU' },
        { val: 'PETUGAS', label: '🧑‍💼 PETUGAS' },
        { val: 'RAK', label: '🗄️ RAK' }
      ],
      pk: [
        { val: 'id_anggota', label: '🔑 id_anggota' },
        { val: 'id_buku', label: '🔑 id_buku' },
        { val: 'id_petugas', label: '🔑 id_petugas' }
      ],
      attrs: [
        { val: 'nama_anggota, jurusan', label: 'nama_anggota, jurusan' },
        { val: 'judul_buku, pengarang', label: 'judul_buku, pengarang' },
        { val: 'id_pinjam (PK), tgl_pinjam, status_pinjam', label: 'id_pinjam (PK), tgl_pinjam, status_pinjam' },
        { val: 'nama_petugas, shift', label: 'nama_petugas, shift' }
      ],
      cardinalities: [
        { val: '1:N', label: '⟷ 1 : N' },
        { val: '1:1', label: '⟷ 1 : 1' },
        { val: 'M:N', label: '⟷ M : N' }
      ]
    },
    trdPalette: {
      pk: [
        { val: 'id_anggota INT PRIMARY KEY', label: '🔑 id_anggota (INT PK)' },
        { val: 'id_pinjam INT PRIMARY KEY', label: '🔑 id_pinjam (INT PK)' },
        { val: 'id_buku INT PRIMARY KEY', label: '🔑 id_buku (INT PK)' },
        { val: 'nama_anggota VARCHAR(100) PRIMARY KEY', label: 'nama_anggota (VARCHAR PK)' }
      ],
      fk: [
        { val: 'id_anggota -> anggota(id_anggota)', label: '🔗 FK: id_anggota → anggota' },
        { val: 'id_buku -> buku(id_buku)', label: '🔗 FK: id_buku → buku' },
        { val: 'NONE', label: '⛔ Tanpa FK (Master Sisi 1)' },
        { val: 'FK_PEMINJAMAN', label: '🔗 id_pinjam (FK)' }
      ],
      types: [
        { val: 'DATE', label: 'Tipe: DATE' },
        { val: 'INT', label: 'Tipe: INT' },
        { val: 'VARCHAR(150)', label: 'Tipe: VARCHAR(150)' }
      ]
    },
    erdExpected: {
      ent1Name: 'ANGGOTA', ent1Pk: 'id_anggota', ent1Attrs: 'nama_anggota, jurusan',
      entRelName: 'PEMINJAMAN', entRelAttrs: 'id_pinjam', cardinality: '1:N',
      ent2Name: 'BUKU', ent2Pk: 'id_buku', ent2Attrs: 'judul_buku, pengarang'
    },
    trdExpected: {
      t1Pk: 'id_anggota INT PRIMARY KEY', t1Fk: 'NONE',
      tRelPk: 'id_pinjam INT PRIMARY KEY',
      tRelFk1: 'id_anggota -> anggota(id_anggota)', tRelFk2: 'id_buku -> buku(id_buku)',
      t2Pk: 'id_buku INT PRIMARY KEY', t2Type: 'DATE'
    },
    questions: [
      {
        id: 1,
        title: 'Tahap 1: Merancang ERD (Entity Relationship Diagram) Perpustakaan Kampus',
        level: 'Langkah 1 — Perancangan ERD',
        points: 15,
        type: 'DESIGN_ERD',
        scenario: 'Perpustakaan "SmartCampus": Mahasiswa terdaftar sebagai ANGGOTA (id_anggota, nama_anggota, jurusan). Pustaka dicatat sebagai BUKU (id_buku, judul_buku, pengarang). Transaksi peminjaman dicatat dalam data PEMINJAMAN (id_pinjam, tgl_pinjam, status_pinjam). Satu anggota maupun satu buku dapat terlibat dalam banyak transaksi peminjaman (1:N).',
        instruction: 'Susunlah komponen ERD pada kanvas Drag & Drop di atas: (1) Entitas Master #1 ANGGOTA, (2) Entitas Transaksi PEMINJAMAN (Kardinalitas 1:N), dan (3) Entitas Master #2 BUKU beserta atributnya, lalu klik "Verifikasi & Simpan Rancangan Diagram".',
        expectedColumns: ['Entitas: ANGGOTA, PEMINJAMAN, BUKU', 'Identifier: id_anggota, id_pinjam, id_buku', 'Kardinalitas: 1 : N'],
        hint: 'Tentukan entitas master di sisi 1 (ANGGOTA dan BUKU) dan entitas transaksi penghubung di sisi N (PEMINJAMAN).',
        starterQuery: '-- Susun diagram ERD interaktif pada panel di atas.\n',
        officialSolution: `-- Kunci ERD Kelas B (Perpustakaan):
Master 1  : ANGGOTA (id_anggota PK, nama_anggota, jurusan)
Transaksi : PEMINJAMAN (id_pinjam PK, tgl_pinjam, status_pinjam) | Kardinalitas: 1 : N
Master 2  : BUKU (id_buku PK, judul_buku, pengarang)`
      },
      {
        id: 2,
        title: 'Tahap 2: Mentransformasikan ERD Menjadi TRD Fisik (Perpustakaan)',
        level: 'Langkah 2 — Transformasi TRD',
        points: 15,
        type: 'DESIGN_TRD',
        scenario: 'Menerjemahkan rancangan ERD Perpustakaan menjadi skema tabel fisik TRD dengan aturan peletakan Foreign Key.',
        instruction: 'Tentukan Primary Key pada tabel anggota, peminjaman, dan buku, serta pasang Foreign Key (id_anggota dan id_buku) pada tabel peminjaman (sisi N) menggunakan panel kanvas di atas.',
        expectedColumns: ['anggota (PK: id_anggota, Tanpa FK)', 'peminjaman (PK: id_pinjam, FK: id_anggota & id_buku)', 'buku (PK: id_buku, tgl_masuk: DATE)'],
        hint: 'Tabel master sisi 1 tidak memuat FK. Foreign Key dari anggota dan buku ditempatkan di tabel transaksi peminjaman (sisi N).',
        starterQuery: '-- Susun skema TRD interaktif pada panel di atas.\n',
        officialSolution: `-- Kunci TRD Kelas B (Perpustakaan):
1. anggota    : PK id_anggota INT | Tanpa FK
2. peminjaman : PK id_pinjam INT | FK id_anggota -> anggota | FK id_buku -> buku
3. buku       : PK id_buku INT | tgl_masuk DATE`
      },
      {
        id: 3,
        title: 'Tahap 3: DDL — Membuat Database & Ketiga Tabel Fisik (CREATE TABLE)',
        level: 'Langkah 3 — DDL CREATE',
        points: 25,
        type: 'DDL_CREATE_DB_AND_TABLES',
        scenario: 'Implementasikan rancangan TRD Perpustakaan ke dalam database dengan membuat tabel anggota, buku, dan peminjaman.',
        instruction: 'Tuliskan perintah CREATE TABLE untuk membuat 3 tabel fisik: anggota (id_anggota, nama_anggota, jurusan), buku (id_buku, judul_buku, pengarang, tgl_masuk), dan peminjaman (id_pinjam, id_anggota, id_buku, tgl_pinjam, status_pinjam).',
        expectedColumns: ['CREATE TABLE anggota', 'CREATE TABLE buku', 'CREATE TABLE peminjaman'],
        hint: 'Pastikan tipe data kolom dan definisi PRIMARY KEY serta FOREIGN KEY ditulis dengan benar.',
        starterQuery: '-- Tuliskan perintah SQL CREATE TABLE untuk ketiga tabel fisik di sini:\n\n',
        officialSolution: `CREATE TABLE anggota (
  id_anggota INTEGER PRIMARY KEY,
  nama_anggota VARCHAR(100),
  jurusan VARCHAR(50)
);

CREATE TABLE buku (
  id_buku INTEGER PRIMARY KEY,
  judul_buku VARCHAR(120),
  pengarang VARCHAR(80),
  tgl_masuk DATE
);

CREATE TABLE peminjaman (
  id_pinjam INTEGER PRIMARY KEY,
  id_anggota INTEGER,
  id_buku INTEGER,
  tgl_pinjam DATE,
  status_pinjam VARCHAR(50),
  FOREIGN KEY (id_anggota) REFERENCES anggota(id_anggota),
  FOREIGN KEY (id_buku) REFERENCES buku(id_buku)
);`
      },
      {
        id: 4,
        title: 'Tahap 4: DDL — Menambahkan Kolom Baru (ALTER TABLE)',
        level: 'Langkah 4 — DDL ALTER',
        points: 15,
        type: 'DDL_ALTER_TABLE',
        scenario: 'Petugas perpustakaan memerlukan nomor kontak anggota untuk mengirimkan notifikasi pengembalian buku.',
        instruction: 'Tuliskan perintah ALTER TABLE pada tabel anggota untuk menambahkan kolom baru bernama no_telepon bertipe data VARCHAR(20).',
        expectedColumns: ['tabel: anggota', 'kolom baru: no_telepon VARCHAR(20)'],
        hint: 'Gunakan perintah ALTER TABLE nama_tabel ADD COLUMN nama_kolom tipe_data;',
        starterQuery: '-- Tuliskan perintah SQL ALTER TABLE di sini:\n\n',
        officialSolution: `ALTER TABLE anggota
ADD COLUMN no_telepon VARCHAR(20);`
      },
      {
        id: 5,
        title: 'Tahap 5: DML — Mengisi Record Data (INSERT INTO)',
        level: 'Langkah 5 — DML INSERT',
        points: 15,
        type: 'DML_INSERT',
        scenario: 'Katalog perpustakaan dan data anggota baru mulai diinput ke dalam sistem.',
        instruction: 'Masukkan data menggunakan perintah INSERT INTO:\n- Minimal 2 record pada tabel buku\n- Minimal 3 record pada tabel anggota (wajib sertakan id_anggota = 201, 202, dan 203)\n- Minimal 1 record pada tabel peminjaman.',
        expectedColumns: ['buku (>= 2 record)', 'anggota (>= 3 record termasuk ID 203)', 'peminjaman (>= 1 record)'],
        hint: 'Gunakan INSERT INTO nama_tabel VALUES (...); Pastikan id_anggota 203 terisi untuk soal hapus berikutnya.',
        starterQuery: '-- Tuliskan perintah SQL INSERT INTO untuk buku, anggota, dan peminjaman di sini:\n\n',
        officialSolution: `INSERT INTO buku VALUES (1, 'Basis Data Relasional', 'Fathansyah', '2024-01-10');
INSERT INTO buku VALUES (2, 'Rekayasa Perangkat Lunak', 'Pressman', '2024-02-15');

INSERT INTO anggota VALUES (201, 'Farhan Maulana', 'Informatika', '081234567811');
INSERT INTO anggota VALUES (202, 'Siti Aisyah', 'Sistem Informasi', '081234567812');
INSERT INTO anggota VALUES (203, 'Dimas Anggara', 'Teknik Komputer', '081234567813');

INSERT INTO peminjaman VALUES (701, 201, 1, '2026-10-18', 'Dipinjam');`
      },
      {
        id: 6,
        title: 'Tahap 6: DML — Menghapus Record Anggota Nonaktif (DELETE FROM)',
        level: 'Langkah 6 — DML DELETE',
        points: 15,
        type: 'DML_DELETE',
        scenario: 'Anggota dengan id_anggota = 203 telah lulus kuliah dan meminta akun keanggotaannya dihapus dari sistem.',
        instruction: 'Tuliskan perintah DELETE FROM pada tabel anggota untuk menghapus HANYA record dengan id_anggota = 203 (pastikan data anggota 201 dan 202 tidak ikut terhapus).',
        expectedColumns: ['id_anggota = 203 terhapus', 'id_anggota 201 & 202 tetap ada'],
        hint: 'Gunakan klausa WHERE untuk membatasi penghapusan pada id_anggota spesifik.',
        starterQuery: '-- Tuliskan perintah SQL DELETE FROM dengan klausa WHERE di sini:\n\n',
        officialSolution: `DELETE FROM anggota
WHERE id_anggota = 203;`
      }
    ]
  },

  'Kelas C': {
    code: 'C',
    className: 'Kelas C',
    caseTitle: 'Sistem Informasi Rental Kendaraan AutoCampus',
    dbName: 'db_rental_autocampus',
    master1Name: 'pelanggan',
    master2Name: 'mobil',
    relName: 'rental',
    alterTable: 'pelanggan',
    alterColumn: 'no_telepon',
    alterType: 'VARCHAR(20)',
    insertTargetTable: 'pelanggan',
    deleteKeyCol: 'id_pelanggan',
    deleteTargetId: 303,
    sampleInsertIds: [301, 302, 303],
    schemaMetadata: [
      {
        table: 'pelanggan',
        entityName: 'Entitas PELANGGAN',
        desc: 'Menyimpan data pelanggan penyewa kendaraan (ditambah kolom no_telepon di Soal #4)',
        columns: [
          { name: 'id_pelanggan', type: 'INT', pk: true, note: 'Primary Key' },
          { name: 'nama_pelanggan', type: 'VARCHAR(100)', note: 'Nama penyewa' },
          { name: 'no_ktp', type: 'VARCHAR(30)', note: 'Nomor identitas KTP' },
          { name: 'no_telepon', type: 'VARCHAR(20)', isAlterTarget: true, note: 'Ditambahkan via ALTER TABLE' }
        ]
      },
      {
        table: 'mobil',
        entityName: 'Entitas MOBIL',
        desc: 'Menyimpan data unit armada mobil yang disewakan',
        columns: [
          { name: 'id_mobil', type: 'INT', pk: true, note: 'Primary Key' },
          { name: 'merk_mobil', type: 'VARCHAR(80)', note: 'Brand / merk mobil' },
          { name: 'tarif_per_hari', type: 'INT', note: 'Harga sewa per hari' },
          { name: 'tgl_beli', type: 'DATE', note: 'Tanggal armada dibeli' }
        ]
      },
      {
        table: 'rental',
        entityName: 'Entitas Transaksi RENTAL',
        desc: 'Relasi transaksi penyewaan 1:N pelanggan & mobil',
        columns: [
          { name: 'id_rental', type: 'INT', pk: true, note: 'Primary Key' },
          { name: 'id_pelanggan', type: 'INT', fk: 'pelanggan.id_pelanggan', note: 'Foreign Key ke pelanggan' },
          { name: 'id_mobil', type: 'INT', fk: 'mobil.id_mobil', note: 'Foreign Key ke mobil' },
          { name: 'tgl_sewa', type: 'DATE', note: 'Tanggal sewa armada' },
          { name: 'total_biaya', type: 'INT', note: 'Total biaya sewa' }
        ]
      }
    ],
    erdPalette: {
      entities: [
        { val: 'PELANGGAN', label: '👤 PELANGGAN' },
        { val: 'RENTAL', label: '🚗 RENTAL' },
        { val: 'MOBIL', label: '🚙 MOBIL' },
        { val: 'SUPIR', label: '🧑‍✈️ SUPIR' },
        { val: 'KANTOR', label: '🏢 KANTOR' }
      ],
      pk: [
        { val: 'id_pelanggan', label: '🔑 id_pelanggan' },
        { val: 'id_mobil', label: '🔑 id_mobil' },
        { val: 'id_supir', label: '🔑 id_supir' }
      ],
      attrs: [
        { val: 'nama_pelanggan, no_ktp', label: 'nama_pelanggan, no_ktp' },
        { val: 'merk_mobil, tarif_per_hari', label: 'merk_mobil, tarif_per_hari' },
        { val: 'id_rental (PK), tgl_sewa, total_biaya', label: 'id_rental (PK), tgl_sewa, total_biaya' },
        { val: 'nama_supir, no_sim', label: 'nama_supir, no_sim' }
      ],
      cardinalities: [
        { val: '1:N', label: '⟷ 1 : N' },
        { val: '1:1', label: '⟷ 1 : 1' },
        { val: 'M:N', label: '⟷ M : N' }
      ]
    },
    trdPalette: {
      pk: [
        { val: 'id_pelanggan INT PRIMARY KEY', label: '🔑 id_pelanggan (INT PK)' },
        { val: 'id_rental INT PRIMARY KEY', label: '🔑 id_rental (INT PK)' },
        { val: 'id_mobil INT PRIMARY KEY', label: '🔑 id_mobil (INT PK)' },
        { val: 'nama_pelanggan VARCHAR(100) PRIMARY KEY', label: 'nama_pelanggan (VARCHAR PK)' }
      ],
      fk: [
        { val: 'id_pelanggan -> pelanggan(id_pelanggan)', label: '🔗 FK: id_pelanggan → pelanggan' },
        { val: 'id_mobil -> mobil(id_mobil)', label: '🔗 FK: id_mobil → mobil' },
        { val: 'NONE', label: '⛔ Tanpa FK (Master Sisi 1)' },
        { val: 'FK_RENTAL', label: '🔗 id_rental (FK)' }
      ],
      types: [
        { val: 'DATE', label: 'Tipe: DATE' },
        { val: 'INT', label: 'Tipe: INT' },
        { val: 'VARCHAR(150)', label: 'Tipe: VARCHAR(150)' }
      ]
    },
    erdExpected: {
      ent1Name: 'PELANGGAN', ent1Pk: 'id_pelanggan', ent1Attrs: 'nama_pelanggan, no_ktp',
      entRelName: 'RENTAL', entRelAttrs: 'id_rental', cardinality: '1:N',
      ent2Name: 'MOBIL', ent2Pk: 'id_mobil', ent2Attrs: 'merk_mobil, tarif_per_hari'
    },
    trdExpected: {
      t1Pk: 'id_pelanggan INT PRIMARY KEY', t1Fk: 'NONE',
      tRelPk: 'id_rental INT PRIMARY KEY',
      tRelFk1: 'id_pelanggan -> pelanggan(id_pelanggan)', tRelFk2: 'id_mobil -> mobil(id_mobil)',
      t2Pk: 'id_mobil INT PRIMARY KEY', t2Type: 'DATE'
    },
    questions: [
      {
        id: 1,
        title: 'Tahap 1: Merancang ERD (Entity Relationship Diagram) Rental Kendaraan AutoCampus',
        level: 'Langkah 1 — Perancangan ERD',
        points: 15,
        type: 'DESIGN_ERD',
        scenario: 'Rental "AutoCampus": Konsumen dicatat sebagai PELANGGAN (id_pelanggan, nama_pelanggan, no_ktp). Unit sewa dicatat sebagai MOBIL (id_mobil, merk_mobil, tarif_per_hari). Transaksi sewa dicatat dalam data RENTAL (id_rental, tgl_sewa, total_biaya). Satu pelanggan maupun satu mobil dapat terlibat dalam banyak transaksi sewa (1:N).',
        instruction: 'Susunlah komponen ERD pada kanvas Drag & Drop di atas: (1) Entitas Master #1 PELANGGAN, (2) Entitas Transaksi RENTAL (Kardinalitas 1:N), dan (3) Entitas Master #2 MOBIL beserta atributnya, lalu klik "Verifikasi & Simpan Rancangan Diagram".',
        expectedColumns: ['Entitas: PELANGGAN, RENTAL, MOBIL', 'Identifier: id_pelanggan, id_rental, id_mobil', 'Kardinalitas: 1 : N'],
        hint: 'Tentukan entitas master di sisi 1 (PELANGGAN dan MOBIL) dan entitas transaksi penghubung di sisi N (RENTAL).',
        starterQuery: '-- Susun diagram ERD interaktif pada panel di atas.\n',
        officialSolution: `-- Kunci ERD Kelas C (Rental Mobil):
Master 1  : PELANGGAN (id_pelanggan PK, nama_pelanggan, no_ktp)
Transaksi : RENTAL (id_rental PK, tgl_sewa, total_biaya) | Kardinalitas: 1 : N
Master 2  : MOBIL (id_mobil PK, merk_mobil, tarif_per_hari)`
      },
      {
        id: 2,
        title: 'Tahap 2: Mentransformasikan ERD Menjadi TRD Fisik (Rental Mobil)',
        level: 'Langkah 2 — Transformasi TRD',
        points: 15,
        type: 'DESIGN_TRD',
        scenario: 'Menerjemahkan rancangan ERD Rental Mobil menjadi skema tabel fisik TRD dengan penempatan Foreign Key yang tepat.',
        instruction: 'Tentukan Primary Key pada tabel pelanggan, rental, dan mobil, serta tempatkan Foreign Key (id_pelanggan dan id_mobil) pada tabel rental (sisi N) menggunakan panel kanvas di atas.',
        expectedColumns: ['pelanggan (PK: id_pelanggan, Tanpa FK)', 'rental (PK: id_rental, FK: id_pelanggan & id_mobil)', 'mobil (PK: id_mobil, tgl_beli: DATE)'],
        hint: 'Tabel master sisi 1 tidak memuat FK. Foreign Key dari pelanggan dan mobil ditempatkan di tabel transaksi rental (sisi N).',
        starterQuery: '-- Susun skema TRD interaktif pada panel di atas.\n',
        officialSolution: `-- Kunci TRD Kelas C (Rental Mobil):
1. pelanggan : PK id_pelanggan INT | Tanpa FK
2. rental    : PK id_rental INT | FK id_pelanggan -> pelanggan | FK id_mobil -> mobil
3. mobil     : PK id_mobil INT | tgl_beli DATE`
      },
      {
        id: 3,
        title: 'Tahap 3: DDL — Membuat Database & Ketiga Tabel Fisik (CREATE TABLE)',
        level: 'Langkah 3 — DDL CREATE',
        points: 25,
        type: 'DDL_CREATE_DB_AND_TABLES',
        scenario: 'Implementasikan rancangan TRD Rental Mobil ke dalam database dengan membuat tabel pelanggan, mobil, dan rental.',
        instruction: 'Tuliskan perintah CREATE TABLE untuk membuat 3 tabel fisik: pelanggan (id_pelanggan, nama_pelanggan, no_ktp), mobil (id_mobil, merk_mobil, tarif_per_hari, tgl_beli), dan rental (id_rental, id_pelanggan, id_mobil, tgl_sewa, total_biaya).',
        expectedColumns: ['CREATE TABLE pelanggan', 'CREATE TABLE mobil', 'CREATE TABLE rental'],
        hint: 'Pastikan tipe data kolom dan definisi PRIMARY KEY serta FOREIGN KEY ditulis dengan benar.',
        starterQuery: '-- Tuliskan perintah SQL CREATE TABLE untuk ketiga tabel fisik di sini:\n\n',
        officialSolution: `CREATE TABLE pelanggan (
  id_pelanggan INTEGER PRIMARY KEY,
  nama_pelanggan VARCHAR(100),
  no_ktp VARCHAR(30)
);

CREATE TABLE mobil (
  id_mobil INTEGER PRIMARY KEY,
  merk_mobil VARCHAR(80),
  tarif_per_hari INTEGER,
  tgl_beli DATE
);

CREATE TABLE rental (
  id_rental INTEGER PRIMARY KEY,
  id_pelanggan INTEGER,
  id_mobil INTEGER,
  tgl_sewa DATE,
  total_biaya INTEGER,
  FOREIGN KEY (id_pelanggan) REFERENCES pelanggan(id_pelanggan),
  FOREIGN KEY (id_mobil) REFERENCES mobil(id_mobil)
);`
      },
      {
        id: 4,
        title: 'Tahap 4: DDL — Menambahkan Kolom Baru (ALTER TABLE)',
        level: 'Langkah 4 — DDL ALTER',
        points: 15,
        type: 'DDL_ALTER_TABLE',
        scenario: 'Pihak manajemen rental mobil mewajibkan pencatatan nomor telepon aktif penyewa untuk konfirmasi pengambilan armada.',
        instruction: 'Tuliskan perintah ALTER TABLE pada tabel pelanggan untuk menambahkan kolom baru bernama no_telepon bertipe data VARCHAR(20).',
        expectedColumns: ['tabel: pelanggan', 'kolom baru: no_telepon VARCHAR(20)'],
        hint: 'Gunakan perintah ALTER TABLE nama_tabel ADD COLUMN nama_kolom tipe_data;',
        starterQuery: '-- Tuliskan perintah SQL ALTER TABLE di sini:\n\n',
        officialSolution: `ALTER TABLE pelanggan
ADD COLUMN no_telepon VARCHAR(20);`
      },
      {
        id: 5,
        title: 'Tahap 5: DML — Mengisi Record Data (INSERT INTO)',
        level: 'Langkah 5 — DML INSERT',
        points: 15,
        type: 'DML_INSERT',
        scenario: 'Armada mobil dan pelanggan penyewa mulai didata ke dalam basis data.',
        instruction: 'Masukkan data menggunakan perintah INSERT INTO:\n- Minimal 2 record pada tabel mobil\n- Minimal 3 record pada tabel pelanggan (wajib sertakan id_pelanggan = 301, 302, dan 303)\n- Minimal 1 record pada tabel rental.',
        expectedColumns: ['mobil (>= 2 record)', 'pelanggan (>= 3 record termasuk ID 303)', 'rental (>= 1 record)'],
        hint: 'Gunakan INSERT INTO nama_tabel VALUES (...); Pastikan id_pelanggan 303 terisi untuk soal hapus berikutnya.',
        starterQuery: '-- Tuliskan perintah SQL INSERT INTO untuk mobil, pelanggan, dan rental di sini:\n\n',
        officialSolution: `INSERT INTO mobil VALUES (1, 'Toyota Avanza', 350000, '2023-05-10');
INSERT INTO mobil VALUES (2, 'Honda HR-V', 500000, '2023-08-20');

INSERT INTO pelanggan VALUES (301, 'Denny Kurniawan', '3273012304950001', '081234567821');
INSERT INTO pelanggan VALUES (302, 'Maya Anggraini', '3273015507980002', '081234567822');
INSERT INTO pelanggan VALUES (303, 'Rizky Febrian', '3273011211960003', '081234567823');

INSERT INTO rental VALUES (901, 301, 1, '2026-10-20', 700000);`
      },
      {
        id: 6,
        title: 'Tahap 6: DML — Menghapus Record Pelanggan Batal Sewa (DELETE FROM)',
        level: 'Langkah 6 — DML DELETE',
        points: 15,
        type: 'DML_DELETE',
        scenario: 'Pelanggan dengan id_pelanggan = 303 membatalkan reservasi rental dan meminta identitasnya dihapus dari tabel pelanggan.',
        instruction: 'Tuliskan perintah DELETE FROM pada tabel pelanggan untuk menghapus HANYA record dengan id_pelanggan = 303 (pastikan data pelanggan 301 dan 302 tidak ikut terhapus).',
        expectedColumns: ['id_pelanggan = 303 terhapus', 'id_pelanggan 301 & 302 tetap ada'],
        hint: 'Gunakan klausa WHERE untuk membatasi penghapusan pada id_pelanggan spesifik.',
        starterQuery: '-- Tuliskan perintah SQL DELETE FROM dengan klausa WHERE di sini:\n\n',
        officialSolution: `DELETE FROM pelanggan
WHERE id_pelanggan = 303;`
      }
    ]
  }
};

function resolveClassKey(input) {
  const str = String(input || '').toLowerCase();
  if (str.includes('kelas b') || str === 'b') return 'Kelas B';
  if (str.includes('kelas c') || str === 'c') return 'Kelas C';
  return 'Kelas A';
}

function getClassCaseStudy(classInput) {
  const key = resolveClassKey(classInput);
  return CASE_STUDY_CLASSES[key] || CASE_STUDY_CLASSES['Kelas A'];
}

if (typeof window !== 'undefined') {
  window.CASE_STUDY_CLASSES = CASE_STUDY_CLASSES;
  window.resolveClassKey = resolveClassKey;
  window.getClassCaseStudy = getClassCaseStudy;
}
