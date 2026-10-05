# Implementation Plan

## KOEI - Web Dashboard Berbasis Google Apps Script

| Atribut | Nilai |
|---|---|
| ID dokumen | PLAN-KOEI-GAS-001 |
| Versi | 1.0 - Draft pelaksanaan |
| Tanggal | 5 September 2026 |
| Sumber kebutuhan | PRD-KOEI-001 versi 1.0 |
| Product owner | Manager Bidang Komunikasi UID Kaltimra |
| Platform utama | Google Apps Script Web App |
| Penyimpanan MVP | Google Sheets dan Google Drive |
| Status | Siap untuk architecture validation dan Sprint 0 |

> PLAN ini menerjemahkan PRD menjadi urutan pembangunan yang dapat dieksekusi. PLAN tidak mengubah keputusan bisnis pada PRD. Ketentuan PPID, SLA, klasifikasi informasi, struktur organisasi, retensi, dan kewenangan approval tetap harus disahkan oleh pemilik proses.

---

## 1. Hasil yang Akan Dibangun

KOEI akan dibangun sebagai aplikasi web responsif dengan dua permukaan yang dipisahkan secara keamanan:

1. **KOEI Internal** untuk Manager Bidang Komunikasi, Pengelola Informasi, Information Owner, PPID Pelaksana, approver, auditor, dan administrator.
2. **KOEI Publik** untuk pencarian informasi, pengajuan permohonan, pelacakan, penerimaan jawaban, dan survei.

Kedua aplikasi menggunakan proses bisnis yang sama, tetapi tidak berbagi endpoint UI atau fungsi server secara bebas. Pemisahan ini mencegah fungsi internal ikut terekspos melalui deployment publik.

Hasil MVP:

- intake permohonan publik dan pencatatan permohonan dari kanal manual;
- nomor tiket dan tracking aman;
- validasi, assignment, task, revision, review, dan approval;
- SLA 10 hari kalender, perpanjangan terkontrol, smart reminder H-10/H-7/H-4/H-2/H+1;
- repositori dokumen terpusat dan versioning;
- katalog informasi publik;
- dashboard operasional dan eksekutif;
- laporan dan ekspor berizin;
- survei kepuasan;
- role dan scope unit;
- audit log;
- aksesibilitas alur kritis;
- monitoring operasional dan runbook.

Fitur P2 seperti digital signature, Power BI, chatbot AI, dan PLN Mobile tidak dibangun pada MVP.

---

## 2. Penilaian Kelayakan Google Apps Script

### 2.1 Kesimpulan awal

Google Apps Script layak untuk **pilot dan MVP dengan volume rendah sampai menengah**, terutama karena terintegrasi dengan Google Workspace, Google Sheets, Google Drive, email, dan time-driven trigger. Namun kelayakan production harus dibuktikan melalui Sprint 0 dan load test.

Apps Script dapat dipublikasikan sebagai web app melalui `doGet()`/`doPost()` dan HTML Service. Mode deployment dapat menjalankan aplikasi sebagai pemilik/deployer atau sebagai pengguna yang mengakses; pilihan ini berdampak langsung pada identitas dan izin data. Lihat [dokumentasi resmi Web Apps](https://developers.google.com/apps-script/guides/web) dan [HTML Service](https://developers.google.com/apps-script/guides/html).

### 2.2 Kondisi penggunaan yang cocok

- Pengguna internal berada dalam Google Workspace domain yang dikelola.
- Volume permohonan, user bersamaan, file, dan notifikasi masih dalam envelope hasil load test.
- Dashboard dapat menggunakan near-real-time refresh, bukan streaming real time.
- Google Sheets diterima sebagai transactional store tahap awal.
- Dokumen disimpan pada Shared Drive/private Drive dengan izin yang terkendali.
- Organisasi menerima keterbatasan audit berbasis Sheets atau menyediakan layanan audit eksternal.

### 2.3 Batas platform yang memengaruhi desain

Kuota Apps Script dapat berubah dan berbeda menurut jenis akun. Pada dokumentasi yang ditinjau, runtime per eksekusi adalah 6 menit, terdapat batas concurrent execution, trigger, Properties Service, dan pengiriman email harian. Semua angka wajib diperiksa ulang menggunakan akun production sebelum go-live. Lihat [kuota resmi Apps Script](https://developers.google.com/apps-script/guides/services/quotas).

Konsekuensi desain:

- Tidak ada proses sinkron panjang.
- Semua query dan write ke Sheets dilakukan batch.
- Pengiriman notifikasi memakai queue dan batch worker.
- Pembuatan laporan besar berjalan bertahap.
- Dashboard membaca agregat/snapshot, bukan memindai seluruh transaksi untuk setiap widget.
- Job menyimpan checkpoint agar dapat dilanjutkan pada eksekusi berikutnya.
- Sistem memonitor sisa kuota email dan kegagalan eksekusi.

Google merekomendasikan meminimalkan service call, melakukan batch read/write, menggunakan cache, dan memecah pekerjaan besar menjadi bagian kecil. Prinsip tersebut menjadi aturan implementasi KOEI. Lihat [Apps Script best practices](https://developers.google.com/apps-script/guides/support/best-practices).

### 2.4 Gerbang go/no-go platform

Sprint 0 harus menghasilkan keputusan tertulis untuk tiga hal berikut:

#### Gate A - Identitas pengguna internal

Prototype harus membuktikan bahwa email pengguna domain dapat diperoleh secara konsisten pada konfigurasi deployment yang dipilih. `Session.getActiveUser().getEmail()` dapat kosong pada konteks tertentu, terutama saat tidak ada otorisasi pengguna atau web app berjalan sebagai developer; perilakunya harus diuji pada tenant PLN, bukan diasumsikan. Lihat [Session identity behavior](https://developers.google.com/apps-script/reference/base/session).

**Go:** identitas terverifikasi, role dapat dipetakan, dan data Sheet/Drive tetap tidak dapat dibuka langsung oleh pengguna biasa.

**No-go/ubah arsitektur:** email tidak konsisten atau model permission memaksa pemberian akses langsung berlebihan ke data. Fallback adalah identity layer yang disetujui TI atau backend di Google Cloud.

#### Gate B - Portal dan lampiran publik

Prototype harus membuktikan kebijakan domain mengizinkan web app publik, anti-abuse memadai, dan mekanisme lampiran memiliki validasi serta scanning yang disetujui.

**Go:** permohonan eksternal dapat diterima aman dan file tidak masuk repository aktif sebelum lolos kontrol.

**No-go/ubah scope:** portal publik tetap dapat menerima form tanpa file; lampiran dikirim melalui kanal resmi lain, atau upload/scanning dipindahkan ke layanan terkelola.

#### Gate C - Audit dan klasifikasi

Protected Sheet bukan immutable audit store terhadap pemilik file. Pemilik risiko harus menentukan apakah protected Sheet, backup harian, dan pembatasan admin cukup untuk pilot.

**Go pilot:** kontrol tersebut diterima dengan risiko residual terdokumentasi.

**No-go production:** jika audit harus benar-benar append-only/tamper-evident, gunakan Cloud Logging, BigQuery, atau layanan audit korporat sebagai tujuan event, sementara Apps Script tetap menjadi UI/orchestrator.

---

## 3. Arsitektur Rekomendasi

### 3.1 Topologi

```text
Pemohon Publik
    |
    v
KOEI Public Web App (Apps Script project terpisah)
    |
    | submit dan tracking terbatas
    v
Public Ingress Sheet + Public Tracking Projection
    |
    | ingestion worker satu arah
    v
Core data Sheets + private Drive repository
    ^
    |
KOEI Internal Web App (Apps Script project terpisah)
    ^
    |
Pengguna Workspace + role/scope organisasi

Clock Triggers -> SLA Worker -> Notification Queue -> MailApp/Email
Clock Triggers -> KPI Snapshot Worker -> Dashboard Snapshot Sheets
Semua command -> Request Events + Audit Events
```

### 3.2 Pemisahan project

Gunakan project terpisah untuk mengurangi blast radius:

- `KOEI-Internal-DEV`, `KOEI-Internal-UAT`, `KOEI-Internal-PROD`;
- `KOEI-Public-DEV`, `KOEI-Public-UAT`, `KOEI-Public-PROD`;
- data store DEV/UAT/PROD terpisah;
- folder Drive DEV/UAT/PROD terpisah;
- tidak ada data production dalam DEV/UAT kecuali telah dimasking.

Project public hanya memiliki fungsi server yang diperlukan publik. Project internal tidak dibuat public. Source code dapat berasal dari repository yang sama, tetapi manifest, config, deployment, dan OAuth scope dipisahkan.

Project public **tidak menulis langsung ke tabel transaksi inti**. Public project hanya dapat mengakses:

- `PublicSubmissions` untuk data masuk berstatus pending ingestion;
- `PublicTrackingProjection` untuk status minimum yang aman ditampilkan;
- folder quarantine publik jika upload diizinkan.

Internal ingestion worker membaca submission baru secara idempotent, memvalidasinya, lalu membuat record kanonik di Core Sheets. Setelah status internal berubah, projection worker menerbitkan hanya field publik yang diizinkan. Desain ini diperlukan karena ScriptLock berlaku dalam boundary project script dan tidak boleh dianggap mengunci dua project berbeda yang menulis resource yang sama.

### 3.3 Komponen Google Workspace

| Komponen | Fungsi |
|---|---|
| Apps Script Web App | Server controller dan penyajian HTML5 |
| HTML Service | UI, CSS, client-side JavaScript |
| `google.script.run` | Pemanggilan asynchronous dari client ke fungsi server |
| Google Sheets | Tabel transaksi, master, queue, dan snapshot KPI |
| Google Drive/Shared Drive | Penyimpanan dokumen dan versi file |
| MailApp atau layanan email yang disetujui | Notifikasi dan eskalasi |
| Installable time-driven triggers | SLA worker, queue worker, snapshot, housekeeping |
| Properties Service | ID resource dan konfigurasi kecil per environment |
| LockService | Mencegah tabrakan write pada resource bersama |
| CacheService | Cache jangka pendek untuk master data dan snapshot |
| Apps Script dashboard/logging | Monitoring eksekusi dasar |

`google.script.run` bersifat asynchronous; setiap pemanggilan harus memiliki success handler, failure handler, loading state, timeout UX, dan correlation ID. Lihat [client-to-server API resmi](https://developers.google.com/apps-script/guides/html/reference/run).

### 3.4 Pola data access

- UI tidak pernah memanggil Spreadsheet/Drive secara langsung.
- Semua akses melalui fungsi server yang melakukan authenticate, authorize, validate, execute, audit, dan shape response.
- Public app hanya mengakses ingress dan projection store; hanya internal worker yang menulis Core Sheets.
- Semua ID memakai UUID; nomor tiket ramah manusia adalah atribut tambahan.
- Business rule tidak ditaruh pada formula Sheet yang dapat diubah manual.
- Pengguna biasa tidak diberi editor access ke spreadsheet inti.
- Batch `getValues()` dan `setValues()` digunakan; hindari loop yang memanggil Sheet per cell.
- Cache hanya digunakan sebagai akselerator. CacheService tidak menjamin data bertahan sampai expiry, sehingga miss harus selalu aman dan dapat membaca sumber utama. Lihat [CacheService](https://developers.google.com/apps-script/reference/cache/cache-service).
- ScriptLock digunakan pada critical section write untuk mencegah collision. Lihat [LockService](https://developers.google.com/apps-script/reference/lock/lock-service).

### 3.5 Konsistensi transaksi

Google Sheets tidak menyediakan transaksi lintas tabel seperti database relasional. Karena itu setiap command mutasi mengikuti pola:

1. buat `operation_id` dan correlation ID;
2. validasi pengguna dan permission;
3. validasi input dan current row version;
4. ambil ScriptLock;
5. cek idempotency key;
6. tulis `Operations` sebagai `STARTED`;
7. update record utama;
8. append RequestEvent dan AuditEvent;
9. enqueue notifikasi, bukan mengirim saat lock aktif;
10. tandai `Operations` sebagai `COMMITTED`;
11. lepaskan lock;
12. kembalikan response terbaru ke UI.

Jika write gagal sebagian, reconciliation worker mencari operation `STARTED` yang tidak selesai dan membuat alert. Aksi berisiko tidak otomatis diulang tanpa aturan idempotency.

---

## 4. Strategi Deployment dan Ownership

### 4.1 Ownership

- Gunakan akun fungsional/automation Workspace yang dikelola organisasi bila kebijakan mengizinkan.
- Simpan source dan data pada Shared Drive yang dikontrol tim.
- Tetapkan minimal dua maintainer dan prosedur rotasi.
- Trigger dibuat oleh akun automation yang sama agar identitas pengirim dan izin stabil.
- Simpan inventory deployment ID, version, owner, trigger owner, OAuth scopes, Sheet ID, dan folder ID.

Installable trigger selalu berjalan menggunakan akun pembuatnya. Karena itu trigger tidak boleh dimiliki akun personal yang dapat dinonaktifkan ketika pegawai berpindah. Lihat [installable triggers](https://developers.google.com/apps-script/guides/triggers/installable).

Versioned deployment digunakan untuk UAT dan production; head/test deployment hanya untuk development. Google menyarankan versioned deployment untuk penggunaan publik dan mencatat bahwa ownership deployment versi tidak dapat dipindahkan secara langsung. Lihat [deployment management](https://developers.google.com/apps-script/concepts/deployments).

### 4.2 Environment config

Simpan konfigurasi kecil dalam Script Properties:

- `ENVIRONMENT`;
- `DATA_SPREADSHEET_ID`;
- `PRIVATE_DRIVE_FOLDER_ID`;
- `PUBLIC_DRIVE_FOLDER_ID`;
- `AUDIT_SPREADSHEET_ID`;
- `APP_BASE_URL`;
- `TIMEZONE`;
- `SUPPORT_EMAIL`;
- feature flags.

Properties Service adalah key-value string store yang scoped ke script/user/document dan cocok untuk konfigurasi kecil. Jangan gunakan sebagai database transaksi. Lihat [Properties Service](https://developers.google.com/apps-script/guides/properties).

Secret eksternal tidak ditaruh dalam HTML, Sheet, source code, atau response. Jika ada secret yang berisiko tinggi, gunakan secret management yang disetujui TI.

### 4.3 OAuth scopes

- Tulis scopes eksplisit pada `appsscript.json` setelah discovery.
- Minta scope minimum untuk Sheets, Drive, email, dan user identity.
- Pisahkan scope public dan internal.
- Uji consent serta granular authorization pada tenant.
- Setiap penambahan service menjalani scope review sebelum release.

Apps Script menentukan izin berdasarkan service yang digunakan dan model eksekusi web app. Lihat [authorization for Google services](https://developers.google.com/apps-script/guides/services/authorization).

---

## 5. Rancangan Data Google Sheets

### 5.1 Prinsip workbook

- Gunakan satu Core spreadsheet transaksi per environment untuk pilot.
- Gunakan satu Public Exchange spreadsheet terpisah untuk `PublicSubmissions` dan `PublicTrackingProjection`.
- Gunakan satu spreadsheet audit terpisah.
- Setiap tab adalah tabel; baris pertama adalah immutable schema header.
- Semua tabel memiliki `created_at`, `created_by`, `updated_at`, `updated_by`, `row_version` bila relevan.
- Tidak ada merged cells, baris subtotal, atau formatting manual di tabel transaksi.
- Kolom internal memakai `snake_case` dan timestamp ISO 8601.
- Spreadsheet hanya dibuka langsung oleh admin terbatas.
- Sheet protection mencegah edit manual pada schema dan data.

### 5.2 Daftar tabel

| Tab | Key | Tujuan |
|---|---|---|
| Requests | request_id | Record utama permohonan |
| RequestEvents | event_id | Histori perubahan status |
| Tasks | task_id | Tugas PIC/Information Owner/approver |
| Applicants | applicant_id | Data pemohon dengan akses terbatas |
| Users | user_id/email | Pengguna internal |
| RoleAssignments | assignment_id | Role dan scope organisasi |
| OrgUnits | unit_id | Master bidang/unit dan parent |
| InformationItems | info_id | Katalog informasi/DIP |
| Documents | document_id | Metadata file dan versi |
| ClassificationDecisions | decision_id | Keputusan klasifikasi |
| Approvals | approval_id | Keputusan approval |
| SlaPolicies | policy_id + version | Aturan SLA versioned |
| SlaInstances | sla_instance_id | SLA per permohonan |
| Notifications | notification_id | Queue dan delivery log |
| Publications | publication_id | Status publikasi dan URL |
| SurveyResponses | survey_id | SKM dan komentar |
| Feedback | feedback_id | Pengaduan/saran/keberatan |
| Operations | operation_id | Idempotency dan recovery write |
| AuditEvents | audit_id | Event audit aplikasi |
| DashboardSnapshots | snapshot_id | Agregat dashboard |
| ConfigVersions | config_version_id | Histori konfigurasi bisnis |
| DataQualityIssues | issue_id | Masalah metadata/migrasi |

Tabel pada Public Exchange spreadsheet:

| Tab | Key | Tujuan |
|---|---|---|
| PublicSubmissions | submission_id | Staging permohonan publik sebelum ingestion |
| PublicTrackingProjection | tracking_projection_id | Status minimum yang boleh dilihat pemohon |
| PublicFeedbackInbox | public_feedback_id | Staging survei/feedback publik |

Record public ingress tidak dianggap permohonan kanonik sampai internal ingestion worker berhasil membuat `request_id` dan menandai submission sebagai `INGESTED`. Mapping `submission_id -> request_id` hanya dapat dilihat role internal berwenang.

### 5.3 Kolom minimum Requests

```text
request_id
ticket_number
tracking_token_hash
channel
received_at
sla_started_at
subject
description
category_id
unit_id
information_owner_id
pic_user_id
approver_user_id
classification_status
workflow_status
risk_flag
priority
current_due_at
fulfilled_at
closed_at
applicant_id
active_sla_instance_id
last_activity_at
created_at
created_by
updated_at
updated_by
row_version
```

### 5.4 Kolom minimum SlaInstances

```text
sla_instance_id
request_id
policy_id
policy_version
timezone
started_at
original_due_at
extension_requested_at
extension_approved_at
extension_due_at
pause_started_at
total_pause_minutes
effective_due_at
fulfilled_at
result
last_reminder_stage
overdue_at
row_version
```

### 5.5 Kolom minimum Notifications

```text
notification_id
dedupe_key
request_id
task_id
event_type
stage
channel
recipient
template_version
payload_json
status
scheduled_at
sent_at
attempt_count
last_error_code
last_error_summary
acknowledged_at
created_at
```

Jangan menyimpan isi sensitif lengkap dalam `payload_json`; gunakan referensi dan render ulang dari data yang diizinkan pada waktu pengiriman.

### 5.6 Partition dan arsip

- Snapshot dashboard dipartisi berdasarkan bulan.
- Audit dan RequestEvents dapat dipindahkan per tahun setelah volume melewati threshold hasil load test.
- Arsip tidak mengubah ID kanonik.
- Query lintas arsip hanya tersedia untuk role laporan/auditor.
- Proses arsip memiliki rekonsiliasi jumlah dan checksum.

---

## 6. Struktur Google Drive

```text
KOEI-PROD/
  00-Configuration/
  01-Incoming-Quarantine/
  02-Request-Documents/
    YYYY/
      request_id/
  03-Information-Repository/
    unit_id/
      info_id/
        version_id/
  04-Publication-Staging/
  05-Published/
  06-Reports/
  07-Exports-Temporary/
  08-Backup-Manifests/
```

Aturan:

- Folder menggunakan ID sistem, bukan nama pemohon.
- File private secara default.
- File masuk ke quarantine sebelum dapat digunakan.
- Metadata file berada di tab Documents; URL/Drive ID tidak menjadi bukti permission.
- Published folder hanya berisi versi yang approved.
- Public sharing hanya dilakukan jika kebijakan domain menyetujui.
- Temporary export memiliki expiry dan housekeeping job.
- Pengguna menerima download melalui fungsi yang memeriksa authorization atau melalui published URL yang telah disahkan.

Keputusan mekanisme distribusi file publik adalah Gate B. Apps Script/Content Service tidak boleh dipaksa menjadi proxy file besar jika gagal memenuhi target performa dan keamanan.

---

## 7. Struktur Source Code

Struktur lokal yang direkomendasikan:

```text
koei/
  appsscript.json
  Server_WebApp.gs
  Server_Router.gs
  Server_Config.gs
  Server_Auth.gs
  Server_Authorization.gs
  Server_Validation.gs
  Server_RequestService.gs
  Server_WorkflowService.gs
  Server_SlaService.gs
  Server_NotificationService.gs
  Server_DocumentService.gs
  Server_PublicationService.gs
  Server_DashboardService.gs
  Server_ReportService.gs
  Server_SurveyService.gs
  Server_AuditService.gs
  Server_AdminService.gs
  Server_Repositories.gs
  Server_Triggers.gs
  Server_Health.gs
  Shared_Constants.gs
  Shared_Errors.gs
  Shared_Utils.gs
  Client_Index.html
  Client_Styles.html
  Client_App.html
  Client_Router.html
  Client_Api.html
  Client_Accessibility.html
  Client_Components.html
  Client_Dashboard.html
  Client_Requests.html
  Client_RequestDetail.html
  Client_Repository.html
  Client_Admin.html
  README.md
```

### 7.1 Aturan kode

- V8 runtime dan JavaScript yang didukung Apps Script.
- Fungsi yang dapat dipanggil client diberi prefix `api_` dan whitelist eksplisit.
- Fungsi internal/worker tidak menjadi endpoint client.
- Setiap `api_` memanggil guard autentikasi dan otorisasi server-side.
- Response standar: `{ ok, data, error, meta: { correlationId, serverTime } }`.
- Error publik tidak membuka stack trace, Sheet ID, Drive ID, atau detail permission.
- Pure business functions dipisahkan dari Google service calls agar dapat diuji lokal.
- Repository layer adalah satu-satunya bagian yang membaca/menulis Sheets.
- Tidak ada `getActiveSpreadsheet()` pada production path; selalu `openById()` dari config.
- Semua tanggal dikirim sebagai string ISO, karena parameter/return `google.script.run` tidak mendukung objek `Date` secara langsung.
- Logging menggunakan structured object dan redaction.

### 7.2 Frontend

- HTML Service menyajikan shell aplikasi.
- Client menggunakan hash/history routing yang kompatibel dengan web app.
- Gunakan CSS variables untuk theme PLN/KOEI dan high contrast mode.
- Gunakan Promise wrapper di atas `google.script.run`.
- Satu bootstrap call memuat user, permission, reference data, feature flag, dan summary awal.
- Widget dashboard dimuat dalam satu/batch payload, bukan satu server call per kartu.
- Mutation mengembalikan record terbaru untuk menghindari refresh penuh.
- Loading, empty, error, retry, dan stale states tersedia.
- Table alternative tersedia untuk setiap chart.
- Library frontend eksternal memerlukan security review dan version pinning.

---

## 8. Strategi Keamanan

### 8.1 Authentication dan authorization internal

Rencana awal:

1. batasi deployment internal ke domain Workspace;
2. uji mode execute-as-deployer dan availability email pengguna;
3. map email ke tabel Users dan RoleAssignments;
4. lakukan authorization setiap server call;
5. role selalu digabung dengan organization scope dan status aktif;
6. delegasi memiliki tanggal mulai/akhir;
7. aksi high-risk memerlukan re-confirmation dan alasan.

Jika identitas tidak dapat diperoleh secara andal tanpa memberi akses langsung ke data, jangan menambal dengan email dari parameter client. Ubah identity/backend architecture.

### 8.2 Tracking publik

- Nomor tiket tidak cukup sebagai credential.
- Buat token acak berentropi tinggi, simpan hanya hash.
- Tracking memerlukan ticket number + secure token atau metode verifikasi yang disetujui.
- Token tidak tampil pada analytics/log.
- Rate limiting dan failed-attempt monitoring diterapkan sejauh platform mendukung.
- Response publik tidak mengungkap apakah data pemohon lain ada.

### 8.3 Input dan output

- Server-side allowlist validation untuk enum, panjang, format, dan required field.
- Normalize input sebelum validasi bisnis.
- Encode output ke DOM; hindari penggunaan `innerHTML` untuk data pengguna.
- Formula injection dicegah pada data yang dapat diekspor ke CSV/Sheets.
- URL redirect dan external link menggunakan allowlist.
- File name disanitasi; Drive file ID tidak diterima mentah tanpa lookup permission.
- Semua aksi publik memiliki anti-automation control yang disetujui.

### 8.4 Dokumen

- File private by default.
- Akses file diperiksa menggunakan document metadata dan role, bukan hanya possession of URL.
- Versi approved memiliki checksum dan status immutable secara aplikasi.
- Publish/unpublish membutuhkan approver berbeda bila kebijakan four-eyes berlaku.
- Lampiran publik tidak diaktifkan sebelum scanning control lulus Gate B.

### 8.5 Audit

Audit event minimum:

- login/akses ditolak;
- lihat/download dokumen sensitif;
- create/update request;
- assignment dan delegation;
- status transition;
- upload/version/classification;
- approval/reject/publish/unpublish;
- SLA change/extension/pause;
- notification send/failure;
- report/export;
- config/role/master data change.

Audit log menyimpan actor, effective user, action, object, before/after hash atau field terpilih, timestamp, result, reason, correlation ID, dan environment.

---

## 9. Implementasi Modul

### 9.1 Foundation dan master data

Tasks:

- [ ] Sahkan naming KOEI/K-OIE.
- [ ] Sahkan struktur role/RACI dan SK PPID.
- [ ] Definisikan kategori, unit, workflow, alasan reject, alasan extension, dan classification state.
- [ ] Buat schema validator untuk semua tabs.
- [ ] Buat setup function idempotent untuk membuat/protect Sheets.
- [ ] Buat config loader dan environment validation.
- [ ] Buat user/role/scope resolver.
- [ ] Buat audit dan error framework.
- [ ] Buat health check untuk Sheets, Drive, email quota, dan trigger.

Acceptance gate:

- schema dapat dibuat ulang pada environment kosong;
- config yang hilang menghentikan startup dengan pesan aman;
- role tests menolak cross-unit access;
- semua perubahan master menghasilkan version dan audit event.

### 9.2 Request intake

Tasks:

- [ ] Buat form publik dengan validasi dan accessibility labels.
- [ ] Buat intake internal untuk surat/email/meja layanan.
- [ ] Implementasi UUID, ticket number, dan tracking token hash.
- [ ] Implementasi idempotency agar double-click tidak membuat tiket ganda.
- [ ] Implementasi duplicate suggestion tanpa auto-merge.
- [ ] Implementasi confirmation receipt dan status publik minimum.
- [ ] Implementasi clarification message.
- [ ] Tentukan fallback lampiran sesuai Gate B.

Acceptance gate:

- submit ganda dengan idempotency key sama menghasilkan satu request;
- publik hanya melihat field yang diizinkan;
- intake semua kanal menghasilkan schema record yang sama;
- dashboard total sama dengan daftar request yang eligible.

### 9.3 Workflow dan task

Tasks:

- [ ] Implementasi state machine dari PRD.
- [ ] Implementasi transition guard per role/status.
- [ ] Implementasi assignment Information Owner/PIC.
- [ ] Implementasi task list dan detail.
- [ ] Implementasi revision cycle.
- [ ] Implementasi approval route versioned.
- [ ] Implementasi delegation sementara.
- [ ] Implementasi overdue sebagai flag, bukan pengganti status.
- [ ] Implementasi operation recovery.

Acceptance gate:

- seluruh transisi ilegal ditolak di server;
- setiap transisi memiliki event dan audit;
- optimistic concurrency mencegah lost update;
- owner, approver, dan manager melihat antrean yang sesuai.

### 9.4 SLA dan smart reminder

Tasks:

- [ ] Sahkan time zone `Asia/Makassar` atau zona resmi lain.
- [ ] Implementasi versioned SlaPolicy.
- [ ] Implementasi calculator untuk 10 hari kalender dan extension 7 hari.
- [ ] Implementasi pause hanya jika policy mengizinkan.
- [ ] Implementasi stage H-10, H-7, H-4, H-2, H+1.
- [ ] Tampilkan tanggal/jam absolut selain label H.
- [ ] Buat SLA worker idempotent.
- [ ] Buat Notification queue dan retry worker.
- [ ] Buat manager escalation dan daily H-4 warning.
- [ ] Buat monitoring quota/kegagalan.

Time-driven trigger dapat berjalan berkala, tetapi waktu eksekusi dapat sedikit berubah/randomized. Karena itu worker harus mencari semua event `scheduled_at <= now` yang belum terkirim, bukan mengandalkan eksekusi tepat pada satu menit. Lihat [time-driven trigger behavior](https://developers.google.com/apps-script/guides/triggers/installable#time-driven_triggers).

Acceptance gate:

- simulasi clock menghasilkan event sekali saja;
- extension mengubah effective due date tanpa mengubah original due date;
- notifikasi gagal dapat di-retry tanpa duplikasi;
- SLA dashboard dan detail kasus memberikan hasil identik.

### 9.5 Repositori dan approval dokumen

Tasks:

- [ ] Buat folder provisioning berdasarkan request/info ID.
- [ ] Buat metadata document/version.
- [ ] Hitung checksum saat upload/proses.
- [ ] Implementasi classification dan ACL check.
- [ ] Implementasi submit-review-revise-approve.
- [ ] Implementasi publication staging.
- [ ] Implementasi review date dan stale flag.
- [ ] Implementasi download audit.
- [ ] Implementasi quarantine/manual release sesuai kontrol security.

Acceptance gate:

- versi lama tidak tertimpa;
- user tanpa hak tidak melihat filename, metadata, preview, atau file;
- hanya approved version dapat dipublish;
- unpublish tercatat dan link publik berperilaku sesuai kebijakan.

### 9.6 Portal informasi publik

Tasks:

- [ ] Buat katalog dan filter.
- [ ] Buat detail informasi dan tanggal pembaruan.
- [ ] Buat metadata search MVP.
- [ ] Buat published document delivery sesuai Gate B.
- [ ] Buat topik populer/sering diminta.
- [ ] Buat feedback konten.
- [ ] Buat QR landing page dan fallback URL.
- [ ] Buat Audio Assist/TTS menggunakan browser capability yang disetujui.

Acceptance gate:

- search hanya mengembalikan published item;
- tidak ada data pemohon/catatan internal di source HTML atau response;
- pengguna keyboard/screen reader dapat mencari dan membuka informasi;
- stale content dapat dilaporkan.

### 9.7 Dashboard

Tasks:

- [ ] Sahkan formula KPI dan exclusion.
- [ ] Buat aggregation functions yang pure/testable.
- [ ] Buat DashboardSnapshots worker.
- [ ] Buat KPI cards: total, SLA, rata-rata hari, unit aktif, status.
- [ ] Buat tren 12 bulan.
- [ ] Buat jenis permohonan.
- [ ] Buat ranking unit dengan toggle metrik.
- [ ] Buat sebaran wilayah atau fallback tabel bila peta belum tersedia.
- [ ] Buat SLA risk queue dan workload.
- [ ] Buat drill-down konsisten.
- [ ] Buat freshness/stale status.
- [ ] Buat table alternative dan ekspor.

Model refresh:

- Setelah mutation, UI memperbarui komponen terkait dari response.
- Dashboard melakukan polling snapshot pada interval yang disetujui, misalnya 60-120 detik untuk internal.
- Snapshot worker berjalan terjadwal dan juga dapat ditandai dirty setelah transaksi.
- Label `LIVE` hanya tampil bila `snapshot_generated_at` berada dalam freshness threshold dan worker sehat.

Acceptance gate:

- KPI sama dengan drill-down dan ekspor;
- filter diterapkan seragam;
- chart tetap dapat dipahami tanpa warna;
- data stale tidak ditampilkan seolah real time.

### 9.8 Laporan dan SKM

Tasks:

- [ ] Buat survei setelah fulfilment.
- [ ] Implementasi satu-response policy yang disahkan.
- [ ] Buat summary SKM per dimensi.
- [ ] Buat laporan SLA, unit, kategori, backlog, reminder, repository, dan SKM.
- [ ] Buat async report queue untuk laporan besar.
- [ ] Buat temporary export dan expiry cleanup.
- [ ] Buat watermark/masking berdasarkan role.

Acceptance gate:

- report menyimpan filter, formula version, generated_at, dan generated_by;
- ekspor tidak membuka kolom di luar role;
- angka laporan cocok dengan snapshot/transaksi;
- file temporary dibersihkan sesuai kebijakan.

---

## 10. Dashboard Delivery Detail

### 10.1 Payload dashboard

Gunakan satu response agregat:

```text
meta
  generatedAt
  freshnessStatus
  filter
  formulaVersion
kpis
  totalRequests
  slaAchievement
  averageResolutionDays
  activeUnits
  statusBreakdown
charts
  monthlyTrend
  requestTypes
  topUnits
  regionDistribution
operations
  dueToday
  h4
  h2
  overdue
  unassigned
  notificationFailures
```

### 10.2 Formula governance

Setiap KPI memiliki:

- `metric_id`;
- business definition;
- formula version;
- eligible/excluded status;
- source tables;
- owner;
- effective date;
- last reconciliation date.

Tidak ada perubahan formula langsung pada UI tanpa approval. Historical report mempertahankan formula version yang digunakan saat dibuat.

### 10.3 Peta Kaltim-Kaltara

Peta tidak menjadi blocker MVP. Urutan implementasi:

1. tabel/bar chart unit sebagai baseline aksesibel;
2. SVG map internal jika asset wilayah resmi tersedia dan lisensinya jelas;
3. binding `unit_id/region_id` ke path SVG;
4. keyboard navigation dan table alternative;
5. hindari dependency peta eksternal bila tidak diperlukan.

---

## 11. Scheduler dan Queue Design

### 11.1 Trigger minimum

| Worker | Frekuensi awal | Fungsi |
|---|---|---|
| `publicIntakeWorker` | 5 menit | Validasi dan ingest submission publik ke Core Sheets |
| `publicProjectionWorker` | 5 menit atau setelah perubahan | Terbitkan status minimum ke tracking publik |
| `slaScheduler` | 15 menit | Enqueue reminder/overdue yang jatuh tempo |
| `notificationDispatcher` | 5-15 menit | Mengirim notification batch |
| `dashboardSnapshotWorker` | 15 menit atau dirty-triggered | Menghasilkan agregat |
| `operationReconciler` | 30 menit | Mendeteksi write parsial/stuck |
| `dataQualityWorker` | Harian | Metadata kosong, stale, orphan |
| `quotaHealthWorker` | Harian dan sebelum batch | Cek quota/health |
| `temporaryFileCleanup` | Harian | Hapus/arsipkan temporary export sesuai policy |
| `backupManifestWorker` | Harian | Manifest backup dan rekonsiliasi |

Frekuensi adalah nilai awal dan harus disesuaikan kuota serta volume. Jangan membuat satu trigger per permohonan karena trigger memiliki quota dan sulit dikelola.

### 11.2 Notification state

`PENDING -> PROCESSING -> SENT`

Exception:

- `PROCESSING -> RETRY` jika transient failure;
- `RETRY -> PROCESSING` sampai maksimum attempt;
- `PROCESSING/RETRY -> FAILED` jika permanent/max attempt;
- `FAILED -> PENDING` hanya melalui authorized manual retry.

Setiap notification memiliki dedupe key seperti:

`request_id:event_type:stage:recipient:effective_due_at`

### 11.3 Bounded batch

- Worker memproses jumlah record maksimal per run.
- Sebelum mendekati batas waktu, worker menyimpan cursor/checkpoint dan berhenti normal.
- Retry menggunakan exponential backoff konseptual dalam slot trigger berikutnya.
- Email tidak dikirim di dalam ScriptLock.
- Quota exhaustion menghasilkan alert dan menahan queue, bukan membuang pesan.

---

## 12. Rencana Sprint dan Timeline

Estimasi berikut adalah planning baseline untuk tim minimum 2 engineer, dukungan UX/QA paruh waktu, Product Owner aktif, dan keputusan bisnis tersedia tepat waktu. Ini bukan komitmen tanggal. Total baseline: **17 minggu** termasuk pilot awal.

### Sprint 0 - Architecture Validation (Minggu 1)

Tujuan: menutup risiko platform sebelum build besar.

Deliverables:

- [ ] prototype web app internal;
- [ ] uji email identity pada role dan perangkat berbeda;
- [ ] uji public deployment policy;
- [ ] uji file upload/quarantine opsi;
- [ ] uji Sheet batch performance dan concurrency;
- [ ] uji trigger dan email quota pada akun target;
- [ ] audit architecture decision record untuk Gate A/B/C;
- [ ] keputusan go/no-go Apps Script MVP.

Milestone M0: **Platform approved conditionally**.

### Sprint 1 - Foundation (Minggu 2-3)

- [ ] repository dan source control;
- [ ] Apps Script projects DEV/UAT;
- [ ] manifest dan explicit scopes;
- [ ] environment config;
- [ ] schema/setup scripts;
- [ ] logging, error, correlation ID;
- [ ] auth and role skeleton;
- [ ] design tokens dan application shell;
- [ ] CI/checklist deployment dasar.

Milestone M1: **Secure application shell**.

### Sprint 2 - Intake dan Tracking (Minggu 4-5)

- [ ] public form;
- [ ] internal multichannel intake;
- [ ] ticket/idempotency;
- [ ] public ingress dan internal ingestion worker;
- [ ] public tracking projection worker;
- [ ] applicant data control;
- [ ] secure tracking;
- [ ] initial receipt;
- [ ] request list/detail baseline;
- [ ] accessibility test form.

Milestone M2: **Request can be received and tracked**.

### Sprint 3 - Workflow dan Ownership (Minggu 6-7)

- [ ] validation;
- [ ] assignment;
- [ ] task tracker;
- [ ] state machine;
- [ ] revision;
- [ ] approval route;
- [ ] delegation;
- [ ] request event/audit completeness.

Milestone M3: **Internal end-to-end workflow without SLA automation**.

### Sprint 4 - Document Repository (Minggu 8-9)

- [ ] Drive folder provisioning;
- [ ] metadata/versioning;
- [ ] classification;
- [ ] quarantine process;
- [ ] verification and approval;
- [ ] publication staging;
- [ ] authorized download;
- [ ] search metadata.

Milestone M4: **Controlled document lifecycle**.

### Sprint 5 - SLA, Reminder, dan Escalation (Minggu 10-11)

- [ ] SLA policies/versioning;
- [ ] calculator;
- [ ] H-stage scheduler;
- [ ] notification queue;
- [ ] retry/deduplication;
- [ ] extension/pause;
- [ ] escalation dashboard;
- [ ] simulation clock tests.

Milestone M5: **SLA automation proven**.

### Sprint 6 - Dashboard, Reports, dan SKM (Minggu 12-13)

- [ ] snapshot aggregation;
- [ ] KPI cards;
- [ ] trends/types/top units;
- [ ] SLA risk and workload;
- [ ] filters/drill-down;
- [ ] freshness;
- [ ] reports/export;
- [ ] survey/SKM.

Milestone M6: **Management dashboard complete**.

### Sprint 7 - Hardening dan UAT (Minggu 14-15)

- [ ] authorization matrix test;
- [ ] privacy/masking review;
- [ ] security test;
- [ ] quota/load test;
- [ ] backup/restore rehearsal;
- [ ] accessibility testing;
- [ ] data reconciliation;
- [ ] UAT-01 sampai UAT-10 dari PRD;
- [ ] runbook/support documentation;
- [ ] versioned UAT deployment.

Milestone M7: **Release candidate accepted**.

### Pilot dan Go-Live Terbatas (Minggu 16-17)

- [ ] migration rehearsal dan final import;
- [ ] training Bidang Komunikasi dan unit pilot;
- [ ] pilot production deployment;
- [ ] daily monitoring;
- [ ] defect triage;
- [ ] KPI baseline capture;
- [ ] go/no-go rollout report.

Milestone M8: **Pilot operating with signed acceptance**.

---

## 13. Dependency dan Critical Path

Critical path:

```text
SK PPID + RACI + SLA decision
        -> Identity/deployment proof
        -> Data schema and authorization
        -> Intake + workflow
        -> Document classification/approval
        -> SLA/reminder
        -> Dashboard formula
        -> Security/accessibility/UAT
        -> Pilot
```

External dependencies:

- Workspace admin untuk deployment dan OAuth;
- akun fungsional/deployer;
- Shared Drive dan folder permission;
- daftar pengguna/unit;
- email sender dan policy;
- SK PPID dan SOP;
- keputusan lampiran/scanning;
- brand guideline dan asset peta;
- data migrasi;
- reviewer keamanan, legal, dan aksesibilitas.

Jika keputusan SLA, role, atau klasifikasi terlambat, tim masih dapat membangun framework, tetapi tidak boleh mengunci workflow production.

---

## 14. Rencana Pengujian

### 14.1 Unit test

Prioritas pure functions:

- SLA calculation;
- reminder stage;
- state transition;
- role/scope evaluation;
- KPI formula;
- masking/redaction;
- validation/normalization;
- ticket number dan idempotency;
- dedupe key;
- retry decision.

### 14.2 Integration test

- Apps Script ke Sheets;
- Apps Script ke Drive;
- email send dan failure;
- trigger execution;
- public/internal deployments;
- permission boundaries;
- report/export;
- cache miss/fallback;
- lock contention;
- operation recovery.

### 14.3 Security test

- unauthenticated access;
- cross-unit/cross-role access;
- insecure direct object reference;
- forged request ID/file ID;
- script function enumeration/unauthorized call;
- XSS dan formula injection;
- malicious/oversized attachment;
- tracking token brute force/rate limit;
- data leakage pada error/log/export;
- deployment misconfiguration;
- OAuth scope excess;
- replay/double submit.

### 14.4 Performance dan quota test

Test dataset minimal harus mewakili proyeksi 24 bulan ditambah growth buffer.

Skenario:

- concurrent dashboard load;
- request list dengan filter;
- request mutation bersamaan;
- snapshot full rebuild;
- notification peak batch;
- report export;
- migration import;
- Drive folder/file lookup;
- cache cold start.

Lulus jika target p95 PRD terpenuhi, tidak ada lost update, tidak terjadi quota exhaustion pada peak yang disetujui, dan worker selesai di bawah safety threshold runtime.

### 14.5 Accessibility test

- keyboard-only;
- screen reader;
- focus order;
- high contrast;
- zoom/reflow;
- form error;
- status announcement;
- chart table alternative;
- audio controls;
- document accessibility.

### 14.6 UAT

Gunakan UAT-01 sampai UAT-10 pada PRD tanpa mengurangi acceptance criteria. Bukti UAT berisi tester, role, environment, data case, langkah, hasil, screenshot bila perlu, defect reference, dan sign-off.

---

## 15. Migrasi dan Cutover

### 15.1 Persiapan

- [ ] inventaris sumber data;
- [ ] tetapkan data owner;
- [ ] mapping kolom ke schema KOEI;
- [ ] klasifikasi data dan dokumen;
- [ ] deduplikasi;
- [ ] validasi email pengguna/unit;
- [ ] cek file permission;
- [ ] tentukan histori yang dimigrasikan;
- [ ] buat data quality report.

### 15.2 Rehearsal

- Import ke UAT.
- Rekonsiliasi count per sumber/unit/status.
- Sampling isi dan checksum.
- Uji search, role, dashboard, serta laporan.
- Ukur waktu proses dan checkpoint.
- Dokumentasikan exception dan manual remediation.

### 15.3 Cutover

1. freeze input legacy sesuai waktu yang disetujui;
2. backup sumber;
3. final extract dan transform;
4. import master, users, requests, documents, lalu events;
5. rekonsiliasi;
6. role owner sign-off;
7. aktifkan versioned production deployment;
8. smoke test;
9. buka akses pilot;
10. monitoring intensif dan daily checkpoint.

### 15.4 Rollback

Rollback dipicu oleh kebocoran data, identity failure, lost write, perhitungan SLA salah material, atau availability di bawah ambang pilot. Legacy intake tetap tersedia selama pilot. Data yang masuk KOEI setelah cutover diekspor sebelum rollback agar tidak hilang.

---

## 16. Monitoring dan Operasional

### 16.1 Health dashboard

- eksekusi berhasil/gagal;
- rata-rata dan p95 runtime;
- concurrent/lock timeout;
- notification pending/retry/failed;
- email quota remaining;
- SLA worker last success;
- snapshot last success;
- operation stuck;
- data quality issues;
- temporary files;
- storage growth;
- permission/unauthorized events.

### 16.2 Alert minimum

- trigger tidak sukses dua interval berturut-turut;
- notification queue melewati threshold umur;
- H-2/H+1 gagal terkirim;
- operation `STARTED` tidak committed;
- dashboard snapshot stale;
- quota mendekati safety threshold;
- akses berulang ditolak;
- publication action gagal parsial;
- backup/reconciliation gagal.

### 16.3 Runbook

- redeploy version sebelumnya;
- recreate triggers;
- ganti trigger/deployment owner;
- pause/resume notification queue;
- manual retry aman;
- unlock/recover operation;
- quarantine file;
- unpublish darurat;
- restore Sheet/Drive;
- reconcile dashboard;
- incident communication.

---

## 17. Risiko Khusus Google Apps Script

| Risiko | Dampak | Mitigasi | Trigger migrasi |
|---|---|---|---|
| Runtime/kuota terlampaui | Worker berhenti, notifikasi terlambat | Bounded batch, checkpoint, quota monitor | Peak test gagal berulang |
| Sheet concurrency/lost update | Data salah | ScriptLock, row_version, idempotency, operation log | Lock contention mengganggu SLA |
| Sheets melambat saat data tumbuh | Dashboard lambat | Snapshot, cache, partition, batch | Target p95 gagal pada proyeksi 12 bulan |
| Identitas user kosong/tidak stabil | Authorization gagal | Sprint 0 identity prototype | Tidak ada identity pattern yang disetujui |
| Public deployment dibatasi domain | Portal publik tidak dapat digunakan | Pisah deployment dan validasi admin | Kebijakan tidak mengizinkan public web app |
| File upload tanpa scanning memadai | Risiko malware | Quarantine atau external scanner | Security menolak kontrol Apps Script |
| Audit Sheet dapat diubah owner | Bukti kurang kuat | Spreadsheet terpisah, protect, backup, external log | Audit immutable diwajibkan |
| Trigger dimiliki akun personal | Job berhenti saat akun berubah | Akun fungsional dan ownership register | Tidak tersedia akun terkelola |
| Email quota habis | Reminder gagal | Queue, quota check, digest, provider alternatif | Volume harian melewati envelope |
| Tidak ada server push | Dashboard tidak benar-benar real time | Refresh-on-action dan polling | Kebutuhan real-time < interval polling |
| Version ownership sulit dipindah | Continuity risk | Versioned deployment register dan redeploy runbook | Restrukturisasi akun/domain |
| Apps Script permission terlalu luas | Data exposure | Explicit scope dan project separation | Least privilege tidak dapat dicapai |
| Sinkronisasi ingress/projection terlambat | Status publik tertunda | Idempotent worker, cursor, retry, freshness label | Delay melampaui SLA komunikasi yang disetujui |

---

## 18. Kriteria Bertahan atau Migrasi dari Apps Script

KOEI tetap menggunakan Apps Script selama:

- UAT dan load test memenuhi target;
- queue selesai dalam batas operasional;
- dashboard p95 memenuhi PRD;
- identity dan authorization stabil;
- audit control diterima;
- file control disetujui;
- volume notifikasi berada dalam quota dengan buffer;
- maintenance tidak bergantung pada satu orang.

Pertimbangkan backend Google Cloud seperti Cloud Run/Functions, Firestore/Cloud SQL, BigQuery, Cloud Tasks, Secret Manager, atau Cloud Logging jika salah satu kondisi berikut terjadi:

- kebutuhan transaksi atomik lintas entitas meningkat;
- concurrency menimbulkan lock contention atau lost-update risk;
- runtime/kuota menghambat SLA;
- full-text search dan volume dokumen tidak memadai;
- portal publik membutuhkan anti-abuse dan upload scanning yang lebih kuat;
- audit append-only/tamper-evident diwajibkan;
- near-real-time polling tidak lagi cukup;
- integrasi API eksternal memerlukan authentication/network control yang lebih kompleks;
- data tumbuh melampaui envelope performa Sheets.

Migrasi tidak harus mengganti frontend sekaligus. Apps Script dapat tetap menjadi UI sementara backend/data dipindahkan bertahap melalui API.

---

## 19. Tim Minimum dan Tanggung Jawab

| Peran | Alokasi rekomendasi | Tanggung jawab |
|---|---:|---|
| Product Owner | 20-30% | Keputusan scope, KPI, UAT, prioritas |
| PPID Process Owner/BA | 50% pada discovery/UAT | Workflow, SLA, klasifikasi, SOP |
| Lead Apps Script Engineer | 100% | Arsitektur, server, data, security implementation |
| Frontend/UX Engineer | 50-100% | HTML Service UI, dashboard, accessibility |
| QA Engineer | 50%, naik saat hardening | Test plan, regression, UAT evidence |
| Data/Migration Owner | 25-50% | Cleansing, mapping, import, reconciliation |
| Security/Workspace Admin | Sesuai gate | OAuth, deployment, Drive, review security |
| Accessibility Reviewer | Sprint 0, 2, 6, 7 | Audit dan usability |
| Unit Champions | Pilot | UAT, training, adoption, feedback |

Jika hanya tersedia satu developer, estimasi harus ditambah dan scope pilot dipersempit. Security review dan UAT tidak boleh dirangkap sepenuhnya oleh developer yang sama.

---

## 20. Governance Delivery

### 20.1 Ritual

- Weekly Product Review: progress, keputusan, risiko, dan demo.
- Twice-weekly Engineering Sync: dependency dan defect.
- Sprint Review: acceptance oleh Product Owner.
- Sprint Retrospective: perbaikan delivery.
- Risk Review: Gate A/B/C, security, quota, dan migration.
- Pilot Daily Stand-up: hanya selama dua minggu pilot.

### 20.2 Artefak wajib

- PRD dan PLAN versioned;
- Architecture Decision Records;
- data dictionary;
- role/permission matrix;
- workflow dan SLA rulebook;
- API/function contract;
- test cases dan evidence;
- deployment/trigger inventory;
- runbook;
- migration reconciliation report;
- security/accessibility sign-off;
- release notes;
- pilot evaluation report.

### 20.3 Change control

Perubahan pada role, SLA, classification, public data, retention, atau OAuth scope wajib memiliki:

1. change request;
2. impact assessment;
3. approver bisnis/teknis;
4. test evidence;
5. config/code version;
6. rollback plan;
7. audit event.

---

## 21. Traceability PRD ke Rencana

| PRD/Epic | Implementasi utama | Sprint |
|---|---|---:|
| Identity and Access | project separation, domain identity, RBAC, scope | 0-1 |
| Request Intake | public/internal form, ticket, tracking | 2 |
| Assignment and Workflow | state machine, task, owner, approval | 3 |
| Document Repository | Drive, metadata, version, classification | 4 |
| SLA and Smart Reminder | policy, scheduler, queue, escalation | 5 |
| Public Information Portal | catalogue, search, published delivery | 2, 4, 6 |
| Operational Dashboard | snapshot, risk queue, workload | 5-6 |
| Executive Dashboard | KPI, trend, ranking, SKM | 6 |
| Reporting | report queue, export, masking | 6 |
| Audit and Observability | audit events, operation log, health | 1-7 |
| Accessibility | semantic UI, keyboard, contrast, table alternative | 1-7 |
| Migration and Rollout | import, reconcile, train, pilot | 7, pilot |

---

## 22. Exit Criteria per Milestone

### M0 - Platform approved

- Gate A/B/C memiliki keputusan.
- Tenant policy dan deployment mode terdokumentasi.
- Performance prototype memenuhi baseline.
- Tidak ada blocker security yang tidak memiliki fallback.

### M3 - Workflow alpha

- Request dapat berjalan submit sampai approval pada data dummy.
- Authorization matrix utama lulus.
- Semua mutation memiliki event/audit.
- Tidak ada direct edit Sheet pada normal workflow.

### M5 - SLA automation

- Clock simulation lulus seluruh stage.
- Duplicate notification tidak terjadi.
- Extension dan overdue terhitung benar.
- Worker health dan retry terlihat.

### M7 - Release candidate

- Semua P0 dan UAT-01 sampai UAT-10 lulus.
- Tidak ada defect critical/high.
- Security, privacy, accessibility, backup-restore disetujui.
- KPI reconcile 100% pada test sample.
- Runbook dan training tersedia.

### M8 - Pilot accepted

- Minimum dua minggu operasi stabil.
- Tidak ada data loss atau unauthorized access.
- SLA worker dan notification queue stabil.
- Feedback pengguna prioritas tinggi ditangani atau memiliki rencana.
- Product Owner dan sponsor menyetujui rollout berikutnya.

---

## 23. Keputusan yang Harus Ditutup Sebelum Sprint 1

1. Nama resmi KOEI dan hubungannya dengan K-OIE.
2. Role/RACI berdasarkan SK PPID terbaru.
3. Aturan SLA, extension, pause, dan timezone.
4. Formula lima KPI utama.
5. Workspace domain dan akun pemilik deployment.
6. Mode execute-as dan hasil identity prototype.
7. Public access policy.
8. Attachment/scanning pattern.
9. Audit control untuk pilot dan production.
10. Lokasi data, Shared Drive, retention, dan backup.
11. Daftar unit pilot dan user.
12. Volume data/transaksi/notifikasi untuk load test.
13. Data yang boleh tampil dan diekspor per role.
14. Brand asset dan peta wilayah.
15. Metode survei SKM.

---

## 24. Langkah Eksekusi Pertama

Urutan yang disarankan setelah PLAN disetujui:

1. Adakan workshop keputusan P0 selama 2-3 jam.
2. Dapatkan dukungan Workspace Admin dan Security untuk Sprint 0.
3. Siapkan akun automation, Shared Drive sandbox, dan project DEV.
4. Ambil sampel anonim 100-1.000 request/event untuk performance prototype.
5. Bangun tiga spike: identity, public deployment/upload, dan concurrent Sheet write.
6. Catat hasil dalam Architecture Decision Records.
7. Putuskan pure Apps Script atau hybrid Apps Script + Google Cloud.
8. Finalisasi backlog Sprint 1-2 dan acceptance criteria.
9. Mulai implementation hanya setelah Gate A/B/C memiliki owner dan keputusan.

---

## Lampiran A - Definition of Ready untuk Story

- [ ] Memiliki referensi FR/PRD.
- [ ] Persona dan outcome jelas.
- [ ] Input/output dan error state jelas.
- [ ] Role/scope terdefinisi.
- [ ] Data fields dan classification diketahui.
- [ ] Business rule dan exception disahkan.
- [ ] Acceptance criteria dapat diuji.
- [ ] Audit event ditentukan.
- [ ] Accessibility behavior ditentukan.
- [ ] Quota/performance impact dinilai.
- [ ] Security/privacy dependency ditutup.

## Lampiran B - Definition of Done untuk Story

- [ ] Code review selesai.
- [ ] Unit dan integration test lulus.
- [ ] Server-side authorization test lulus.
- [ ] Input validation dan error handling tersedia.
- [ ] Audit/log/correlation ID tersedia.
- [ ] Keyboard dan screen reader path diuji.
- [ ] Tidak ada data sensitif di log/HTML/error.
- [ ] Documentation dan data dictionary diperbarui.
- [ ] Deployed ke UAT sebagai versioned deployment.
- [ ] Product Owner/QA menerima hasil.

## Lampiran C - Referensi Teknis Resmi

- [Apps Script Web Apps](https://developers.google.com/apps-script/guides/web)
- [HTML Service](https://developers.google.com/apps-script/guides/html)
- [Client-side google.script.run](https://developers.google.com/apps-script/guides/html/reference/run)
- [Apps Script quotas](https://developers.google.com/apps-script/guides/services/quotas)
- [Best practices](https://developers.google.com/apps-script/guides/support/best-practices)
- [Installable triggers](https://developers.google.com/apps-script/guides/triggers/installable)
- [Deployments and versions](https://developers.google.com/apps-script/concepts/deployments)
- [Session and user identity](https://developers.google.com/apps-script/reference/base/session)
- [Authorization](https://developers.google.com/apps-script/guides/services/authorization)
- [Properties Service](https://developers.google.com/apps-script/guides/properties)
- [LockService](https://developers.google.com/apps-script/reference/lock/lock-service)
- [CacheService](https://developers.google.com/apps-script/reference/cache/cache-service)
