/* BST Operations — Multi-User Operations & Google Adapter Boundary */
const SPREADSHEET_ID = '11CTN2RdpNsyngd9kwaI1DNwl82Q6G98363PdJQnrGkA';
const DRIVE_ROOT_ID = '1A9a0f_EYix06BC8a12CILxsgCdsshCFK';

const TEAM = [
  ['Yusup Oeblet', 'Founder / Pendiri', 'MENJAGA'],
  ['Dedi', 'Alam & Ekologi', 'MERAWAT'],
  ['Asep Deni', 'Seni & Budaya', 'MENGHIDUPKAN'],
  ['Gugun Gumelar', 'Pendidikan & Pengetahuan', 'MENUMBUHKAN'],
  ['Jerry Dounal', 'Program & Experience', 'MENGHADIRKAN'],
  ['Redi', 'Usaha & Kemandirian', 'MENGHIDUPI'],
  ['Beby Irawati', 'Komunitas & Kemitraan', 'MEMPERTEMUKAN'],
  ['Mukti & Jey Altahar', 'Sekretariat & Keuangan', 'MENOPANG']
];

const initial = {
  activeUser: 'Mukti & Jey Altahar',
  tasks: [
    {
      id: 1,
      title: 'Verifikasi ketentuan resmi AUD 4.000',
      program: 'Griffith × BST Pilot',
      owner: 'Mukti & Jey Altahar',
      due: 'Minggu ini',
      status: 'Sedang Dikerjakan',
      contributors: [['Sekretariat', 'Sudah Diisi'], ['Keuangan', 'Belum Mulai']],
      demo: true,
      provenance: { created_by: 'Mukti & Jey Altahar', created_at: '2026-08-29T10:00:00Z' }
    },
    {
      id: 2,
      title: 'Catat pembelajaran kegiatan lapangan',
      program: 'Program belum ditetapkan',
      owner: 'Dedi',
      due: 'Belum dijadwalkan',
      status: 'Belum Mulai',
      contributors: [['Alam', 'Belum Mulai'], ['Cerita', 'Belum Mulai']],
      demo: true,
      provenance: { created_by: 'Dedi', created_at: '2026-08-30T09:00:00Z' }
    }
  ],
  ideas: [
    {
      id: 1,
      text: 'Format cerita peserta untuk bukti dampak',
      by: 'Beby Irawati',
      stage: 'BENIH',
      category: 'Cerita',
      demo: true,
      provenance: { created_by: 'Beby Irawati', created_at: '2026-08-30T11:00:00Z' }
    }
  ],
  evidence: [
    {
      id: 1,
      title: 'Contoh struktur bukti kegiatan',
      type: 'Dokumen',
      status: 'UNVERIFIED',
      by: 'DEMO',
      verified_by: null,
      verified_at: null,
      demo: true,
      provenance: { source: 'Initial Seed', created_at: '2026-08-29T08:00:00Z' }
    }
  ],
  decisions: [
    {
      id: 1,
      text: 'Rapatkan terms pilot resmi sebelum menetapkan ruang lingkup',
      status: 'PENDING VERIFICATION',
      by: 'Sekretariat',
      candidate: true,
      demo: true,
      provenance: { source: 'Initial Meeting', created_at: '2026-08-29T08:30:00Z' }
    }
  ],
  meetings: [
    {
      id: 1,
      title: 'Review operasi mingguan',
      when: 'Belum dijadwalkan',
      status: 'SIAP DIHUBUNGKAN',
      demo: true
    }
  ],
  escalations: [
    {
      id: 1,
      title: 'Persetujuan Kerangka Kerja Sama Griffith Pilot AUD 4.000',
      description: 'Eskalasi ketentuan formal dan batas penandatanganan institusional kepada Founder.',
      raised_by: 'Mukti & Jey Altahar',
      priority: 'TINGGI',
      status: 'ESCALATED',
      founder_action: null,
      founder_notes: null,
      demo: true,
      created_at: '2026-08-31T14:00:00Z'
    }
  ]
};

let state = JSON.parse(localStorage.getItem('bst-v1') || 'null') || initial;
if (!state.activeUser) state.activeUser = 'Mukti & Jey Altahar';
if (!state.escalations) state.escalations = initial.escalations;

let view = 'Beranda';
const save = () => {
  localStorage.setItem('bst-v1', JSON.stringify(state));
};

const nav = ['Beranda', 'Program', 'Tugas', 'Rapat', 'Kalender', 'Tim', 'Bukti', 'Kebun Ide', 'Grant & Kemitraan', 'Anggaran', 'Laporan', 'Keputusan', 'Founder Cockpit'];

const esc = s => String(s || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[c]));

function getCurrentUser() {
  return TEAM.find(t => t[0] === state.activeUser) || TEAM[7];
}

function badge(s) {
  const norm = String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return `<span class="badge ${norm}">${esc(s)}</span>`;
}

function getCompleteness(t) {
  if (window.BSTGoogleAdapter && window.BSTGoogleAdapter.calculateTaskCompleteness) {
    return window.BSTGoogleAdapter.calculateTaskCompleteness(t);
  }
  const completeStates = ['Sudah Diisi', 'Terverifikasi'];
  const completed = (t.contributors || []).filter(c => completeStates.includes(c[1])).length;
  const total = (t.contributors || []).length || 1;
  const percentage = Math.round((completed / total) * 100);
  const waitingOn = (t.contributors || []).filter(c => !completeStates.includes(c[1])).map(c => c[0]);
  return { completed, total, percentage, isComplete: completed === total, waitingOn };
}

function taskCard(t) {
  const comp = getCompleteness(t);
  const waiting = comp.waitingOn.length ? comp.waitingOn.join(', ') : 'Tidak ada';
  const isCandidate = t.candidate || t.status === 'PENDING VERIFICATION';
  
  return `
    <article class="card task">
      <div class="row">
        <div>
          <p class="eyebrow">${esc(t.program)}</p>
          <h3>${esc(t.title)}</h3>
        </div>
        <div>
          ${badge(t.demo ? 'DEMO' : t.status)}
          ${isCandidate ? badge('KANDIDAT AI / RAPAT') : ''}
        </div>
      </div>
      <p>Petugas: <b>${esc(t.owner)}</b> · ${esc(t.due)}</p>
      <p class="wait">MENUNGGU SIAPA? <strong>${esc(waiting)}</strong></p>
      <div class="progress-bar"><div class="progress-val" style="width:${comp.percentage}%"></div></div>
      <div class="chips">
        ${(t.contributors || []).map(x => `<span>${esc(x[0])}: <b>${esc(x[1])}</b></span>`).join('')}
      </div>
      <div class="actions">
        <button onclick="completeTask(${t.id})">Perbarui kontribusi</button>
        ${isCandidate ? `<button class="primary" onclick="confirmCandidate('task', ${t.id})">✓ Konfirmasi Manusia</button>` : ''}
      </div>
    </article>
  `;
}

function layout(content) {
  const u = getCurrentUser();
  const isGoogleConnected = window.BSTGoogleAdapter && window.BSTGoogleAdapter.googleAdapter.mode === 'GOOGLE_CONNECTED';
  const stateLabel = isGoogleConnected ? 'MODE GOOGLE · TERHUBUNG (CANONICAL)' : 'MODE DEMO · GOOGLE BELUM TERHUBUNG';
  const stateClass = isGoogleConnected ? 'state connected' : 'state';

  document.querySelector('#app').innerHTML = `
    <header>
      <div class="brand">
        <i>BST</i>
        <span>Operations<br><small>Merawat kerja bersama</small></span>
      </div>
      <div class="${stateClass}" onclick="openGoogleStatus()" title="Lihat Status Google Control Center">${stateLabel}</div>
    </header>
    <main>
      <aside>
        <div class="profile" onclick="switchUserModal()" title="Klik untuk ganti pengguna aktif">
          <b>${esc(u[0])}</b>
          <span>${esc(u[1])} ▾</span>
        </div>
        ${nav.map(n => `<button class="nav ${view === n ? 'active' : ''}" onclick="go('${n}')">${n}</button>`).join('')}
      </aside>
      <section class="content">${content}</section>
    </main>
    <nav class="bottom">
      ${nav.slice(0, 5).map(n => `<button class="${view === n ? 'active' : ''}" onclick="go('${n}')">${n}</button>`).join('')}
    </nav>
    <div id="modal"></div>
  `;
}

function home() {
  const u = getCurrentUser();
  const mine = state.tasks.filter(t => t.owner === u[0] || (u[0].includes('Mukti') && (t.owner || '').includes('Mukti')));
  const waitingMine = state.tasks.filter(t => (t.contributors || []).some(c => (u[1].includes(c[0]) || (u[0].includes('Mukti') && (c[0] === 'Sekretariat' || c[0] === 'Keuangan'))) && c[1] === 'Belum Mulai'));
  const unverifiedEvidence = state.evidence.filter(x => x.status !== 'VERIFIED').length;
  const activeBlockers = (state.escalations || []).filter(e => e.status === 'ESCALATED').length;

  return `
    <div class="hero">
      <p class="eyebrow">BERANDA · PERSONAL HOME (${esc(u[0].toUpperCase())})</p>
      <h1>Kerja bersama, bukti yang bertumbuh.</h1>
      <p>Masuk sebagai <b>${esc(u[0])}</b> (${esc(u[1])}). Semua data operasional tersinkronisasi aman dengan fallback lokal.</p>
      <div class="actions">
        ${['+ Tambah Update', '+ Upload Bukti', '+ Catat Ide', '+ Minta Bantuan', '+ Tandai Hambatan', '+ Mulai Diskusi', '+ Rapat'].map(x => `<button onclick="quick('${x}')">${x}</button>`).join('')}
      </div>
    </div>
    <div class="metrics">
      ${[
        ['PEKERJAAN SAYA', mine.length],
        ['MENUNGGU KONTRIBUSI SAYA', waitingMine.length],
        ['BUKTI BELUM LENGKAP', unverifiedEvidence],
        ['ESKALASI BLOCKER', activeBlockers]
      ].map(x => `<div class="metric"><small>${x[0]}</small><strong>${x[1]}</strong></div>`).join('')}
    </div>
    <h2>Perhatian hari ini</h2>
    ${state.tasks.map(taskCard).join('')}
  `;
}

function tasks() {
  return `
    <div class="title">
      <div>
        <p class="eyebrow">KERJA KOLABORATIF</p>
        <h1>Tugas & kontribusi</h1>
      </div>
      <button class="primary" onclick="openTask()">+ Tugas baru</button>
    </div>
    <p>Sebuah aktivitas baru siap bukti hanya bila kontribusi wajib dan bukti selesai.</p>
    <div class="grid">${state.tasks.map(taskCard).join('')}</div>
  `;
}

function evidence() {
  return `
    <div class="title">
      <div>
        <p class="eyebrow">EVIDENCE BANK</p>
        <h1>Bukti kanonis</h1>
      </div>
      <button class="primary" onclick="openEvidence()">+ Catat bukti</button>
    </div>
    <div class="notice">Satu bukti dapat dipakai untuk beberapa grant. Folder Drive Root: <code>1A9a0f_EYix06BC8a12CILxsgCdsshCFK</code></div>
    ${state.evidence.map(e => `
      <article class="card">
        <div class="row">
          <div>
            <h3>${esc(e.title)}</h3>
            <p>${esc(e.type)} · Kontributor: <b>${esc(e.by)}</b></p>
            ${e.verified_by ? `<p class="role">✓ Diverifikasi oleh ${esc(e.verified_by)} (${esc(e.verified_at ? e.verified_at.slice(0, 10) : 'Tercatat')})</p>` : ''}
          </div>
          <div>
            ${badge(e.status)}
            ${badge(e.demo ? 'DEMO' : 'CANONICAL')}
            ${e.candidate ? badge('KANDIDAT AI / RAPAT') : ''}
          </div>
        </div>
        <div class="actions">
          ${e.status !== 'VERIFIED' ? `<button onclick="verifyEvidence(${e.id})">✓ Verifikasi bukti</button>` : ''}
          ${e.candidate ? `<button class="primary" onclick="confirmCandidate('evidence', ${e.id})">✓ Konfirmasi Manusia</button>` : ''}
        </div>
      </article>
    `).join('')}
  `;
}

function ideas() {
  return `
    <div class="title">
      <div>
        <p class="eyebrow">KEBUN IDE</p>
        <h1>Ide belum tentu komitmen.</h1>
      </div>
      <button class="primary" onclick="openIdea()">+ Tanam ide</button>
    </div>
    <div class="stages">BENIH → PERLU DIGALI → LAYAK DICOBA → UJI COBA → DIADOPSI → ARSIP</div>
    ${state.ideas.map(i => `
      <article class="card">
        <div class="row">
          <div>
            <h3>${esc(i.text)}</h3>
            <p>${esc(i.category)} · oleh <b>${esc(i.by)}</b></p>
            ${i.promoted_by ? `<p class="role">Dipromosikan ke Tugas oleh ${esc(i.promoted_by)}</p>` : ''}
          </div>
          <div>
            ${badge(i.stage)}
            ${badge(i.demo ? 'DEMO' : 'CANONICAL')}
          </div>
        </div>
        <div class="actions">
          <button onclick="ideaToTask(${i.id})">Jadikan tugas PROPOSED</button>
          ${i.candidate ? `<button class="primary" onclick="confirmCandidate('idea', ${i.id})">✓ Konfirmasi Manusia</button>` : ''}
        </div>
      </article>
    `).join('')}
  `;
}

function meetings() {
  return `
    <div class="title">
      <div>
        <p class="eyebrow">MEETING HUB</p>
        <h1>Rapat yang menghasilkan tindak lanjut.</h1>
      </div>
      <button class="primary" onclick="openMeeting()">+ Rapat</button>
    </div>
    <div class="notice">Kandidat AI / output rapat selalu memerlukan konfirmasi manusia sebelum menjadi komitmen operasional resmi.</div>
    ${state.meetings.map(m => `
      <article class="card">
        <div class="row">
          <div>
            <h3>${esc(m.title)}</h3>
            <p>${esc(m.when)}</p>
          </div>
          <div>
            ${badge(m.status)}
            ${badge(m.demo ? 'DEMO' : 'CANONICAL')}
          </div>
        </div>
        <div class="actions">
          <button onclick="meetingOutput('task')">+ Action item</button>
          <button onclick="meetingOutput('decision')">+ Keputusan</button>
          <button onclick="meetingOutput('idea')">+ Ide</button>
          <button onclick="meetingOutput('evidence')">+ Bukti</button>
        </div>
      </article>
    `).join('')}
  `;
}

function team() {
  return `
    <div class="title">
      <div>
        <p class="eyebrow">TIM BST · VERIFIED</p>
        <h1>Orang yang saling melengkapi</h1>
      </div>
    </div>
    <div class="grid">
      ${TEAM.map(t => `
        <article class="card" style="${t[0] === state.activeUser ? 'border: 2px solid var(--moss); background: #f7faf5;' : ''}">
          <div class="avatar">${t[0][0]}</div>
          <h3>${esc(t[0])}</h3>
          <p>${esc(t[1])}</p>
          ${badge('VERIFIED')}
          <p class="role">${esc(t[2])}</p>
          ${t[0] === state.activeUser ? '<p class="role"><b>★ Pengguna Aktif</b></p>' : `<button onclick="switchUser('${esc(t[0])}')">Masuk Sebagai Peran Ini</button>`}
        </article>
      `).join('')}
    </div>
    <p class="muted">Peran organisasi tidak menyiratkan otoritas hukum, penandatanganan, pengeluaran, grant, atau akademik.</p>
  `;
}

function founder() {
  const u = getCurrentUser();
  const unverified = state.evidence.filter(x => x.status !== 'VERIFIED').length;
  const readiness = Math.round((state.evidence.filter(x => x.status === 'VERIFIED').length / Math.max(state.evidence.length, 1)) * 100);
  const activeEscalations = (state.escalations || []).filter(e => e.status === 'ESCALATED');

  return `
    <p class="eyebrow">FOUNDER COCKPIT · YUSUP OEBLET</p>
    <h1>Yang perlu perhatian Anda.</h1>
    <div class="metrics">
      ${[
        ['PROGRAM AKTIF', state.tasks.length],
        ['EVIDENCE READINESS', `${readiness}%`],
        ['BUDGET HEALTH', 'PENDING'],
        ['ESKALASI AKTIF', activeEscalations.length]
      ].map(x => `<div class="metric"><small>${x[0]}</small><strong>${x[1]}</strong></div>`).join('')}
    </div>

    <div class="title">
      <h2>Daftar Eskalasi & Otorisasi Kebijakan</h2>
      <button class="primary" onclick="openEscalation()">+ Buat Eskalasi Baru</button>
    </div>
    <p class="notice">Operasi rutin berjalan otonom oleh tim. Hanya keputusan kebijakan, grant resmi, komitmen institusi, dan blocker kritis yang dieskalasikan ke Founder.</p>

    ${(state.escalations || []).map(e => `
      <article class="card" style="border-left: 4px solid var(--gold);">
        <div class="row">
          <div>
            <p class="eyebrow">${esc(e.priority || 'NORMAL')} · Diajukan oleh ${esc(e.raised_by)}</p>
            <h3>${esc(e.title)}</h3>
            <p>${esc(e.description)}</p>
            ${e.founder_action ? `<p class="role">Keputusan Founder: <b>${esc(e.founder_action)}</b> (${esc(e.resolved_by || 'Founder')}) ${e.founder_notes ? `— "${esc(e.founder_notes)}"` : ''}</p>` : ''}
          </div>
          <div>
            ${badge(e.status)}
            ${badge(e.demo ? 'DEMO' : 'CANONICAL')}
          </div>
        </div>
        ${e.status === 'ESCALATED' ? `
          <div class="actions" style="margin-top: 12px;">
            ${['LIHAT', 'SETUJUI', 'REVISI', 'TAHAN', 'BERI ARAHAN'].map(act => `
              <button class="${act === 'SETUJUI' ? 'primary' : ''}" onclick="founderAction(${e.id}, '${act}')">${act}</button>
            `).join('')}
          </div>
        ` : ''}
      </article>
    `).join('')}
  `;
}

function grants() {
  return `
    <p class="eyebrow">GRANT ENGINE</p>
    <h1>Grant & Kemitraan</h1>
    <article class="card">
      <h3>Griffith × BST — AUD 4.000 PILOT</h3>
      ${badge('PENDING VERIFICATION')}
      <p>Aktif; ketentuan formal belum diverifikasi. Ruang lingkup, tanggal, deliverable, pengeluaran, pelaporan, PIC, otoritas, serta IP/privacy belum ditetapkan di sistem.</p>
      <button onclick="openTask()">Buat tugas verifikasi</button>
    </article>
    <article class="card">
      <h3>Australia–Indonesia Institute 2026–27</h3>
      ${badge('WATCH')}
      <p>Peluang terpisah dari scope formal pilot AUD4K.</p>
    </article>
  `;
}

function generic() {
  const map = {
    Program: ['Program', 'Belum ada program terverifikasi.', 'Program baru harus diberi status PROPOSED atau PENDING VERIFICATION.'],
    Kalender: ['Kalender', 'Google Calendar belum terhubung.', 'Deadline dan rapat dapat dicatat secara lokal saat ini.'],
    Anggaran: ['Anggaran', 'Belum ada anggaran terverifikasi.', 'Jangan memasukkan angka atau kewenangan persetujuan tanpa sumber resmi.'],
    Laporan: ['Laporan', 'Laporan bertumbuh dari bukti terverifikasi.', 'Tidak ada ringkasan institusional yang dapat diterbitkan dari data demo.'],
    Keputusan: ['Keputusan', 'Catatan keputusan', 'Keputusan kandidat perlu konfirmasi manusia.']
  };
  const x = map[view] || [view, 'Modul operasional', 'Data terikat pada kontrol kanonis.'];

  return `
    <p class="eyebrow">${view.toUpperCase()}</p>
    <h1>${x[0]}</h1>
    <div class="notice">${x[2]}</div>
    ${view === 'Keputusan' ? state.decisions.map(d => `
      <article class="card">
        <div class="row">
          <div>
            <h3>${esc(d.text)}</h3>
            <p>Oleh: <b>${esc(d.by)}</b></p>
            ${d.confirmed_by ? `<p class="role">✓ Dikonfirmasi oleh ${esc(d.confirmed_by)}</p>` : ''}
          </div>
          <div>
            ${badge(d.status)}
            ${badge(d.demo ? 'DEMO' : 'CANONICAL')}
            ${d.candidate ? badge('KANDIDAT AI') : ''}
          </div>
        </div>
        ${d.candidate ? `
          <div class="actions">
            <button class="primary" onclick="confirmCandidate('decision', ${d.id})">✓ Konfirmasi Manusia</button>
          </div>
        ` : ''}
      </article>
    `).join('') : '<div class="empty">Belum ada data terverifikasi.</div>'}
  `;
}

function render() {
  let c = view === 'Beranda' ? home() :
          view === 'Tugas' ? tasks() :
          view === 'Bukti' ? evidence() :
          view === 'Kebun Ide' ? ideas() :
          view === 'Rapat' ? meetings() :
          view === 'Tim' ? team() :
          view === 'Grant & Kemitraan' ? grants() :
          view === 'Founder Cockpit' ? founder() :
          generic();
  layout(c);
}

function go(v) {
  view = v;
  render();
}

function switchUser(name) {
  state.activeUser = name;
  save();
  render();
}

function switchUserModal() {
  document.querySelector('#modal').innerHTML = `
    <div class="overlay">
      <div class="modal">
        <button type="button" class="close" onclick="document.querySelector('#modal').innerHTML=''">×</button>
        <h2>Pilih Kolaborator Aktif</h2>
        <p class="muted">Beralih sudut pandang operasional multi-pengguna BST:</p>
        <div style="display: grid; gap: 8px; margin-top: 14px;">
          ${TEAM.map(t => `
            <button style="text-align: left; padding: 12px; display: flex; justify-content: space-between; align-items: center; ${t[0] === state.activeUser ? 'border: 2px solid var(--moss); background: #f0f5ee;' : ''}" onclick="switchUser('${esc(t[0])}'); document.querySelector('#modal').innerHTML=''">
              <div>
                <b>${esc(t[0])}</b><br>
                <small>${esc(t[1])}</small>
              </div>
              <span>${esc(t[2])}</span>
            </button>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

function openGoogleStatus() {
  const isGoogleConnected = window.BSTGoogleAdapter && window.BSTGoogleAdapter.googleAdapter.mode === 'GOOGLE_CONNECTED';
  document.querySelector('#modal').innerHTML = `
    <div class="overlay">
      <div class="modal">
        <button type="button" class="close" onclick="document.querySelector('#modal').innerHTML=''">×</button>
        <h2>Status Integrasi Google</h2>
        <div class="notice" style="margin-top: 12px;">
          <b>Control Center Spreadsheet:</b><br>
          <code>${SPREADSHEET_ID}</code><br><br>
          <b>Drive Root Folder:</b><br>
          <code>${DRIVE_ROOT_ID}</code>
        </div>
        <p><b>Status Saat Ini:</b> ${isGoogleConnected ? '<span style="color: #245030; font-weight: bold;">TERHUBUNG (CANONICAL)</span>' : '<span style="color: #7a5813; font-weight: bold;">LOCAL DEMO FALLBACK (AMAN)</span>'}</p>
        <p class="muted">Kredensial Google disimpan di luar repositori (server environment variables). Jika belum terkonfigurasi, sistem beroperasi dalam Local Demo Fallback mode secara transparan tanpa kehilangan data.</p>
        <button class="primary" style="width: 100%; margin-top: 10px;" onclick="document.querySelector('#modal').innerHTML=''">Tutup</button>
      </div>
    </div>
  `;
}

function completeTask(id) {
  let t = state.tasks.find(x => x.id === id);
  if (!t) return;

  t.contributors = (t.contributors || []).map(x => [
    x[0],
    x[1] === 'Belum Mulai' ? 'Sudah Diisi' : x[1] === 'Sudah Diisi' ? 'Terverifikasi' : 'Terverifikasi'
  ]);

  if (window.BSTGoogleAdapter && window.BSTGoogleAdapter.calculateTaskCompleteness) {
    const res = window.BSTGoogleAdapter.calculateTaskCompleteness(t);
    t.status = res.status;
  } else {
    const allDone = t.contributors.every(c => c[1] === 'Terverifikasi' || c[1] === 'Sudah Diisi');
    t.status = allDone ? 'Sedang Dikerjakan' : 'Belum Mulai';
  }

  save();
  render();
}

function verifyEvidence(id) {
  let e = state.evidence.find(x => x.id === id);
  if (!e) return;

  const u = getCurrentUser();
  if (window.BSTGoogleAdapter && window.BSTGoogleAdapter.verifyEvidenceRecord) {
    const updated = window.BSTGoogleAdapter.verifyEvidenceRecord(e, u[0]);
    Object.assign(e, updated);
  } else {
    e.status = 'VERIFIED';
    e.verified_by = u[0];
    e.verified_at = new Date().toISOString();
  }

  save();
  render();
}

function ideaToTask(id) {
  let i = state.ideas.find(x => x.id === id);
  if (!i) return;

  const u = getCurrentUser();
  if (window.BSTGoogleAdapter && window.BSTGoogleAdapter.convertIdeaToProposedTask) {
    const { task, updatedIdea } = window.BSTGoogleAdapter.convertIdeaToProposedTask(i, u[0]);
    Object.assign(i, updatedIdea);
    state.tasks.push(task);
  } else {
    state.tasks.push({
      id: Date.now(),
      title: i.text,
      program: 'Program belum ditetapkan',
      owner: i.by,
      due: 'Belum dijadwalkan',
      status: 'PROPOSED',
      contributors: [[i.category || 'Kontributor', 'Belum Mulai']],
      demo: true,
      provenance: { origin_idea_id: i.id, converted_by: u[0], created_at: new Date().toISOString() }
    });
    i.stage = 'LAYAK DICOBA';
  }

  save();
  view = 'Tugas';
  render();
}

function confirmCandidate(kind, id) {
  const u = getCurrentUser();
  if (kind === 'task') {
    let t = state.tasks.find(x => x.id === id);
    if (t) {
      if (window.BSTGoogleAdapter && window.BSTGoogleAdapter.confirmMeetingCandidate) {
        Object.assign(t, window.BSTGoogleAdapter.confirmMeetingCandidate(t, u[0]));
      } else {
        t.candidate = false;
        t.status = 'PROPOSED';
        t.confirmed_by = u[0];
      }
    }
  } else if (kind === 'decision') {
    let d = state.decisions.find(x => x.id === id);
    if (d) {
      if (window.BSTGoogleAdapter && window.BSTGoogleAdapter.confirmMeetingCandidate) {
        Object.assign(d, window.BSTGoogleAdapter.confirmMeetingCandidate(d, u[0]));
      } else {
        d.candidate = false;
        d.status = 'VERIFIED';
        d.confirmed_by = u[0];
      }
    }
  } else if (kind === 'idea') {
    let i = state.ideas.find(x => x.id === id);
    if (i) {
      if (window.BSTGoogleAdapter && window.BSTGoogleAdapter.confirmMeetingCandidate) {
        Object.assign(i, window.BSTGoogleAdapter.confirmMeetingCandidate(i, u[0]));
      } else {
        i.candidate = false;
        i.confirmed_by = u[0];
      }
    }
  } else if (kind === 'evidence') {
    let e = state.evidence.find(x => x.id === id);
    if (e) {
      if (window.BSTGoogleAdapter && window.BSTGoogleAdapter.confirmMeetingCandidate) {
        Object.assign(e, window.BSTGoogleAdapter.confirmMeetingCandidate(e, u[0]));
      } else {
        e.candidate = false;
        e.status = 'VERIFIED';
        e.confirmed_by = u[0];
      }
    }
  }
  save();
  render();
}

function founderAction(escalationId, action) {
  let e = (state.escalations || []).find(x => x.id === escalationId);
  if (!e) return;

  const notes = prompt(`Catatan Founder untuk tindakan "${action}":`, '') || '';
  if (window.BSTGoogleAdapter && window.BSTGoogleAdapter.resolveFounderEscalation) {
    const updated = window.BSTGoogleAdapter.resolveFounderEscalation(e, action, notes, 'Yusup Oeblet');
    Object.assign(e, updated);
  } else {
    e.status = action === 'SETUJUI' ? 'VERIFIED' : `FOUNDER_${action}`;
    e.founder_action = action;
    e.founder_notes = notes;
    e.resolved_by = 'Yusup Oeblet';
    e.resolved_at = new Date().toISOString();
  }

  save();
  render();
}

function modal(title, fields, cb) {
  document.querySelector('#modal').innerHTML = `
    <div class="overlay">
      <form class="modal" onsubmit="event.preventDefault(); (${cb.toString()})(this);">
        <button type="button" class="close" onclick="document.querySelector('#modal').innerHTML=''">×</button>
        <h2>${title}</h2>
        ${fields.map(x => `<label>${x}<input required name="${x}" placeholder="${x}"></label>`).join('')}
        <button class="primary">Simpan</button>
      </form>
    </div>
  `;
}

function openTask() {
  const u = getCurrentUser();
  modal('Tugas baru', ['Judul', 'Petugas'], f => {
    state.tasks.push({
      id: Date.now(),
      title: f.Judul.value,
      program: 'Program belum ditetapkan',
      owner: f.Petugas.value || u[0],
      due: 'Belum dijadwalkan',
      status: 'PROPOSED',
      contributors: [['Kontributor', 'Belum Mulai']],
      demo: true,
      provenance: { created_by: u[0], created_at: new Date().toISOString() }
    });
    save();
    document.querySelector('#modal').innerHTML = '';
    render();
  });
}

function openEvidence() {
  const u = getCurrentUser();
  modal('Catat bukti', ['Judul', 'Jenis bukti'], f => {
    state.evidence.push({
      id: Date.now(),
      title: f.Judul.value,
      type: f['Jenis bukti'].value,
      status: 'SUBMITTED',
      by: u[0],
      demo: true,
      provenance: { created_by: u[0], created_at: new Date().toISOString() }
    });
    save();
    document.querySelector('#modal').innerHTML = '';
    render();
  });
}

function openIdea() {
  const u = getCurrentUser();
  modal('Tanam ide', ['Ide', 'Kategori'], f => {
    state.ideas.push({
      id: Date.now(),
      text: f.Ide.value,
      category: f.Kategori.value,
      by: u[0],
      stage: 'BENIH',
      demo: true,
      provenance: { created_by: u[0], created_at: new Date().toISOString() }
    });
    save();
    document.querySelector('#modal').innerHTML = '';
    render();
  });
}

function openMeeting() {
  modal('Rapat baru', ['Judul rapat', 'Waktu'], f => {
    state.meetings.push({
      id: Date.now(),
      title: f['Judul rapat'].value,
      when: f.Waktu.value,
      status: 'SIAP DIHUBUNGKAN',
      demo: true
    });
    save();
    document.querySelector('#modal').innerHTML = '';
    render();
  });
}

function openEscalation() {
  const u = getCurrentUser();
  modal('Eskalasi ke Founder', ['Judul eskalasi', 'Deskripsi masalah / otorisasi'], f => {
    if (window.BSTGoogleAdapter && window.BSTGoogleAdapter.escalateToFounder) {
      const escRecord = window.BSTGoogleAdapter.escalateToFounder(
        f['Judul eskalasi'].value,
        f['Deskripsi masalah / otorisasi'].value,
        u[0],
        'TINGGI'
      );
      state.escalations = state.escalations || [];
      state.escalations.push(escRecord);
    } else {
      state.escalations = state.escalations || [];
      state.escalations.push({
        id: Date.now(),
        title: f['Judul eskalasi'].value,
        description: f['Deskripsi masalah / otorisasi'].value,
        raised_by: u[0],
        priority: 'TINGGI',
        status: 'ESCALATED',
        founder_action: null,
        founder_notes: null,
        demo: true,
        created_at: new Date().toISOString()
      });
    }
    save();
    document.querySelector('#modal').innerHTML = '';
    view = 'Founder Cockpit';
    render();
  });
}

function meetingOutput(kind) {
  const u = getCurrentUser();
  const meeting = state.meetings[0] || { id: 1, title: 'Rapat Operasi' };

  if (window.BSTGoogleAdapter && window.BSTGoogleAdapter.createMeetingCandidate) {
    const candidate = window.BSTGoogleAdapter.createMeetingCandidate(meeting, kind, {}, u[0]);
    if (kind === 'task') state.tasks.push(candidate);
    if (kind === 'decision') state.decisions.push(candidate);
    if (kind === 'idea') state.ideas.push(candidate);
    if (kind === 'evidence') state.evidence.push(candidate);
  } else {
    if (kind === 'task') state.tasks.push({
      id: Date.now(),
      title: 'Action item dari rapat (kandidat)',
      program: 'Belum ditetapkan',
      owner: 'Belum ditugaskan',
      due: 'Belum dijadwalkan',
      status: 'PENDING VERIFICATION',
      candidate: true,
      contributors: [['Rapat', 'Sudah Diisi']],
      demo: true
    });
    if (kind === 'decision') state.decisions.push({
      id: Date.now(),
      text: 'Keputusan kandidat dari rapat',
      status: 'PENDING VERIFICATION',
      by: 'Rapat',
      candidate: true,
      demo: true
    });
    if (kind === 'idea') state.ideas.push({
      id: Date.now(),
      text: 'Ide kandidat dari rapat',
      by: 'Rapat',
      stage: 'BENIH',
      category: 'Ide Baru',
      candidate: true,
      demo: true
    });
    if (kind === 'evidence') state.evidence.push({
      id: Date.now(),
      title: 'Bukti kandidat dari rapat',
      type: 'Catatan rapat',
      status: 'SUBMITTED',
      by: 'Rapat',
      candidate: true,
      demo: true
    });
  }

  save();
  render();
}

function quick(x) {
  if (x.includes('Bukti')) openEvidence();
  else if (x.includes('Ide')) openIdea();
  else if (x.includes('Rapat')) openMeeting();
  else if (x.includes('Hambatan')) openEscalation();
  else openTask();
}

render();

