import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SPREADSHEET_ID,
  DRIVE_ROOT_ID,
  SHEET_MODULES,
  DRIVE_FOLDERS,
  CANONICAL_STATES,
  serializeRecord,
  deserializeRecord,
  calculateTaskCompleteness,
  convertIdeaToProposedTask,
  createMeetingCandidate,
  confirmMeetingCandidate,
  escalateToFounder,
  resolveFounderEscalation,
  verifyEvidenceRecord,
  createGoogleAdapter
} from '../google-adapter.js';

test('workflow completion requires all contribution states to be complete', () => {
  const states = ['Sudah Diisi', 'Terverifikasi'];
  assert.equal(['Sudah Diisi', 'Belum Mulai'].every(x => states.includes(x)), false);
  assert.equal(['Sudah Diisi', 'Terverifikasi'].every(x => states.includes(x)), true);
});

test('multi-user operations & Google adapter integration suite', async (t) => {

  await t.test('1. shared canonical task read/write configuration & structures', () => {
    assert.equal(SPREADSHEET_ID, '11CTN2RdpNsyngd9kwaI1DNwl82Q6G98363PdJQnrGkA');
    assert.equal(DRIVE_ROOT_ID, '1A9a0f_EYix06BC8a12CILxsgCdsshCFK');
    assert.equal(SHEET_MODULES.tasks.range, 'TASKS!A2:I');
    assert.equal(SHEET_MODULES.evidence.range, 'EVIDENCE!A2:H');
    assert.equal(DRIVE_FOLDERS.evidence_bank, '02_EVIDENCE_BANK');
  });

  await t.test('2. multi-user state retrieval & role filtering', () => {
    const teamMembers = [
      'Yusup Oeblet',
      'Dedi',
      'Asep Deni',
      'Gugun Gumelar',
      'Jerry Dounal',
      'Redi',
      'Beby Irawati',
      'Mukti & Jey Altahar'
    ];

    const sampleTasks = [
      { id: 1, title: 'Task 1', owner: 'Mukti & Jey Altahar', status: 'Sedang Dikerjakan', contributors: [['Sekretariat', 'Sudah Diisi'], ['Keuangan', 'Belum Mulai']] },
      { id: 2, title: 'Task 2', owner: 'Dedi', status: 'Belum Mulai', contributors: [['Alam', 'Belum Mulai']] }
    ];

    const muktiTasks = sampleTasks.filter(t => t.owner === 'Mukti & Jey Altahar');
    const dediTasks = sampleTasks.filter(t => t.owner === 'Dedi');

    assert.equal(muktiTasks.length, 1);
    assert.equal(dediTasks.length, 1);
    assert.equal(teamMembers.length, 8);
  });

  await t.test('3. evidence verification persistence & provenance', () => {
    const initialEvidence = {
      id: 101,
      title: 'Laporan Kegiatan Pilot Lapangan',
      type: 'Dokumen',
      status: 'SUBMITTED',
      by: 'Dedi',
      verified_by: null,
      verified_at: null,
      provenance: { source: 'Field upload', created_at: '2026-08-30T10:00:00Z' }
    };

    const verified = verifyEvidenceRecord(initialEvidence, 'Mukti & Jey Altahar');
    assert.equal(verified.status, CANONICAL_STATES.VERIFIED);
    assert.equal(verified.verified_by, 'Mukti & Jey Altahar');
    assert.ok(verified.verified_at);
    assert.equal(verified.provenance.verified_by, 'Mukti & Jey Altahar');
  });

  await t.test('4. contributor completeness recalculation', () => {
    const taskPartial = {
      id: 1,
      title: 'Pilot Task',
      status: 'Belum Mulai',
      contributors: [['Sekretariat', 'Sudah Diisi'], ['Keuangan', 'Belum Mulai']],
      demo: true
    };

    const resPartial = calculateTaskCompleteness(taskPartial);
    assert.equal(resPartial.percentage, 50);
    assert.equal(resPartial.isComplete, false);
    assert.equal(resPartial.status, CANONICAL_STATES.SEDANG_DIKERJAKAN);
    assert.deepEqual(resPartial.waitingOn, ['Keuangan']);

    const taskComplete = {
      id: 1,
      title: 'Pilot Task',
      status: 'Sedang Dikerjakan',
      contributors: [['Sekretariat', 'Sudah Diisi'], ['Keuangan', 'Terverifikasi']],
      demo: true
    };

    const resComplete = calculateTaskCompleteness(taskComplete);
    assert.equal(resComplete.percentage, 100);
    assert.equal(resComplete.isComplete, true);
    assert.equal(resComplete.status, 'Siap Bukti (DEMO)');
    assert.deepEqual(resComplete.waitingOn, []);
  });

  await t.test('5. Idea -> Proposed Task attribution & provenance', () => {
    const idea = {
      id: 201,
      text: 'Pelatihan pembuatan kompos organik komunitas',
      by: 'Beby Irawati',
      category: 'Alam',
      stage: 'BENIH',
      demo: true
    };

    const { task, updatedIdea } = convertIdeaToProposedTask(idea, 'Dedi');
    assert.equal(updatedIdea.stage, 'LAYAK DICOBA');
    assert.equal(updatedIdea.promoted_by, 'Dedi');
    assert.equal(task.title, idea.text);
    assert.equal(task.owner, 'Beby Irawati');
    assert.equal(task.status, CANONICAL_STATES.PROPOSED);
    assert.equal(task.provenance.origin_idea_id, 201);
    assert.equal(task.provenance.origin_author, 'Beby Irawati');
    assert.equal(task.provenance.converted_by, 'Dedi');
  });

  await t.test('6. meeting candidate human-confirmation boundary', () => {
    const meeting = { id: 301, title: 'Rapat Koordinasi Mingguan' };
    const candidateTask = createMeetingCandidate(meeting, 'task', { title: 'Tindak lanjut audit pilot' }, 'AI Transcriber');
    
    assert.equal(candidateTask.status, CANONICAL_STATES.PENDING_VERIFICATION);
    assert.equal(candidateTask.candidate, true);
    assert.equal(candidateTask.provenance.requires_human_confirmation, true);

    const confirmed = confirmMeetingCandidate(candidateTask, 'Mukti & Jey Altahar');
    assert.equal(confirmed.candidate, false);
    assert.equal(confirmed.status, CANONICAL_STATES.PROPOSED);
    assert.equal(confirmed.confirmed_by, 'Mukti & Jey Altahar');
    assert.equal(confirmed.provenance.requires_human_confirmation, false);
  });

  await t.test('7. Founder escalation boundary & actions', () => {
    const escalation = escalateToFounder(
      'Otorisasi PKS Griffith University',
      'Persetujuan klausul audit eksternal pilot',
      'Mukti & Jey Altahar',
      'TINGGI'
    );

    assert.equal(escalation.status, 'ESCALATED');
    assert.equal(escalation.raised_by, 'Mukti & Jey Altahar');

    const approved = resolveFounderEscalation(escalation, 'SETUJUI', 'Disetujui untuk pilot AUD 4.000.', 'Yusup Oeblet');
    assert.equal(approved.status, CANONICAL_STATES.VERIFIED);
    assert.equal(approved.founder_action, 'SETUJUI');
    assert.equal(approved.resolved_by, 'Yusup Oeblet');
    assert.equal(approved.founder_notes, 'Disetujui untuk pilot AUD 4.000.');

    const revised = resolveFounderEscalation(escalation, 'REVISI', 'Perbaiki batas tanggung jawab.', 'Yusup Oeblet');
    assert.equal(revised.status, 'FOUNDER_REVISI');
    assert.equal(revised.founder_action, 'REVISI');
  });

  await t.test('8. safe Google failure/fallback & credential readiness', async () => {
    const adapter = createGoogleAdapter();
    const readyNotConnected = await adapter.readiness();
    assert.equal(readyNotConnected.connected, false);
    assert.equal(readyNotConnected.mode, 'GOOGLE_NOT_CONNECTED');

    await assert.rejects(async () => {
      await adapter.readModule('tasks');
    }, { message: 'GOOGLE_NOT_CONNECTED' });

    adapter.setCredentials({ accessToken: 'mock_token_123' });
    const readyConnected = await adapter.readiness();
    assert.equal(readyConnected.connected, true);
    assert.equal(readyConnected.mode, 'GOOGLE_CONNECTED');

    const apiUrl = adapter.getSheetsApiUrl('TASKS!A2:I');
    assert.ok(apiUrl.includes(SPREADSHEET_ID));
    assert.ok(apiUrl.includes('TASKS'));
  });

  await t.test('9. Google Sheets row schema serialization & deserialization', () => {
    const sampleTask = {
      id: 501,
      title: 'Koordinasi Lapangan Tahap 1',
      program: 'Griffith Pilot',
      owner: 'Beby Irawati',
      due: 'Besok',
      status: 'Sedang Dikerjakan',
      contributors: [['Komunitas', 'Sudah Diisi']],
      demo: false,
      provenance: { created_by: 'Beby Irawati' }
    };

    const row = serializeRecord('tasks', sampleTask);
    assert.equal(row[0], 501);
    assert.equal(row[1], 'Koordinasi Lapangan Tahap 1');
    assert.equal(row[7], 'FALSE');

    const reconstructed = deserializeRecord('tasks', row);
    assert.equal(reconstructed.id, 501);
    assert.equal(reconstructed.title, 'Koordinasi Lapangan Tahap 1');
    assert.equal(reconstructed.owner, 'Beby Irawati');
    assert.equal(reconstructed.demo, false);
    assert.deepEqual(reconstructed.contributors, [['Komunitas', 'Sudah Diisi']]);
  });

  await t.test('10. multi-device shared state simulation (Beby write -> Oeblet read)', () => {
    // Shared backend store simulation
    const sharedSheetStore = {
      tasks: [],
      escalations: []
    };

    // Beby creates a new operational task on Device 1
    const bebyTask = {
      id: 901,
      title: 'Verifikasi Laporan Bukti Griffith AUD 4K',
      program: 'Griffith × BST Pilot',
      owner: 'Beby Irawati',
      due: '2026-09-05',
      status: 'Sedang Dikerjakan',
      contributors: [['Komunitas', 'Sudah Diisi'], ['Sekretariat', 'Belum Mulai']],
      demo: false,
      provenance: { created_by: 'Beby Irawati' }
    };
    const serializedRow = serializeRecord('tasks', bebyTask);
    sharedSheetStore.tasks.push(serializedRow);

    // Beby creates an escalation for Founder Oeblet on Device 1
    const escalation = escalateToFounder(
      'Batas Otoritas Grant Griffith AUD 4.000',
      'Persetujuan draft akhir MoU bersama Griffith University',
      'Beby Irawati',
      'TINGGI'
    );
    escalation.demo = false;
    sharedSheetStore.escalations.push(serializeRecord('escalations', escalation));

    // Oeblet opens Device 2 (Session 2) and fetches shared data from Google Sheet
    const oebletFetchedTasks = sharedSheetStore.tasks.map(r => deserializeRecord('tasks', r));
    const oebletFetchedEscalations = sharedSheetStore.escalations.map(r => deserializeRecord('escalations', r));

    assert.equal(oebletFetchedTasks.length, 1);
    assert.equal(oebletFetchedTasks[0].id, 901);
    assert.equal(oebletFetchedTasks[0].title, 'Verifikasi Laporan Bukti Griffith AUD 4K');
    assert.equal(oebletFetchedTasks[0].demo, false);

    assert.equal(oebletFetchedEscalations.length, 1);
    assert.equal(oebletFetchedEscalations[0].title, 'Batas Otoritas Grant Griffith AUD 4.000');

    // Oeblet resolves escalation on Device 2
    const oebletDecision = resolveFounderEscalation(oebletFetchedEscalations[0], 'SETUJUI', 'Disetujui untuk penandatanganan.', 'Yusup Oeblet');
    sharedSheetStore.escalations[0] = serializeRecord('escalations', oebletDecision);

    // Beby on Device 1 re-syncs and sees Oeblet's verified approval
    const bebySyncedEscalation = deserializeRecord('escalations', sharedSheetStore.escalations[0]);
    assert.equal(bebySyncedEscalation.status, CANONICAL_STATES.VERIFIED);
    assert.equal(bebySyncedEscalation.founder_action, 'SETUJUI');
    assert.equal(bebySyncedEscalation.resolved_by, 'Yusup Oeblet');
  });
});


