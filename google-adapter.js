/**
 * BST Operations & Grant Evidence System — Google Adapter & Multi-User Operations Layer
 * Canonical Spreadsheet ID: 11CTN2RdpNsyngd9kwaI1DNwl82Q6G98363PdJQnrGkA
 * Canonical Drive Root Folder ID: 1A9a0f_EYix06BC8a12CILxsgCdsshCFK
 */

export const SPREADSHEET_ID = '11CTN2RdpNsyngd9kwaI1DNwl82Q6G98363PdJQnrGkA';
export const DRIVE_ROOT_ID = '1A9a0f_EYix06BC8a12CILxsgCdsshCFK';

export const SHEET_MODULES = {
  tasks: { sheetName: 'TASKS', range: 'TASKS!A2:I' },
  ideas: { sheetName: 'IDEAS', range: 'IDEAS!A2:G' },
  evidence: { sheetName: 'EVIDENCE', range: 'EVIDENCE!A2:H' },
  decisions: { sheetName: 'DECISIONS', range: 'DECISIONS!A2:F' },
  meetings: { sheetName: 'MEETINGS', range: 'MEETINGS!A2:F' },
  escalations: { sheetName: 'ESCALATIONS', range: 'ESCALATIONS!A2:H' }
};

export const DRIVE_FOLDERS = {
  programs: '01_PROGRAMS',
  evidence_bank: '02_EVIDENCE_BANK',
  finance: '03_FINANCE & ACCOUNTABILITY',
  grants: '04_GRANTS & PARTNERSHIPS',
  reports: '05_REPORTS & DECISIONS'
};

export const CANONICAL_STATES = {
  VERIFIED: 'VERIFIED',
  PROPOSED: 'PROPOSED',
  PENDING_VERIFICATION: 'PENDING VERIFICATION',
  DEMO: 'DEMO',
  SUBMITTED: 'SUBMITTED',
  WATCH: 'WATCH',
  SEDANG_DIKERJAKAN: 'Sedang Dikerjakan',
  BELUM_MULAI: 'Belum Mulai',
  SUDAH_DIISI: 'Sudah Diisi',
  TERVERIFIKASI: 'Terverifikasi',
  SELESAI: 'Selesai'
};

/**
 * Calculates contributor completeness and updates task status.
 * @param {Object} task 
 * @returns {Object} completeness metrics
 */
export function calculateTaskCompleteness(task) {
  if (!task || !Array.isArray(task.contributors) || task.contributors.length === 0) {
    return {
      total: 0,
      completed: 0,
      percentage: 0,
      isComplete: false,
      status: task ? task.status : CANONICAL_STATES.BELUM_MULAI,
      waitingOn: []
    };
  }

  const completeStates = [CANONICAL_STATES.SUDAH_DIISI, CANONICAL_STATES.TERVERIFIKASI];
  const waitingOn = task.contributors
    .filter(([_, state]) => !completeStates.includes(state))
    .map(([role]) => role);

  const completed = task.contributors.filter(([_, state]) => completeStates.includes(state)).length;
  const total = task.contributors.length;
  const percentage = Math.round((completed / total) * 100);
  const isComplete = completed === total;

  let newStatus = task.status;
  if (isComplete) {
    newStatus = task.demo ? 'Siap Bukti (DEMO)' : CANONICAL_STATES.SELESAI;
  } else if (completed > 0) {
    newStatus = CANONICAL_STATES.SEDANG_DIKERJAKAN;
  } else if (task.status === CANONICAL_STATES.PROPOSED) {
    newStatus = CANONICAL_STATES.PROPOSED;
  } else {
    newStatus = CANONICAL_STATES.BELUM_MULAI;
  }

  return {
    total,
    completed,
    percentage,
    isComplete,
    status: newStatus,
    waitingOn
  };
}

/**
 * Converts an Idea to a Proposed Task preserving attribution and provenance.
 * @param {Object} idea 
 * @param {string} actor 
 * @returns {{ task: Object, updatedIdea: Object }}
 */
export function convertIdeaToProposedTask(idea, actor = 'System') {
  if (!idea) throw new Error('Idea is required');

  const updatedIdea = {
    ...idea,
    stage: 'LAYAK DICOBA',
    promoted_by: actor,
    promoted_at: new Date().toISOString()
  };

  const task = {
    id: Date.now(),
    title: idea.text,
    program: 'Program belum ditetapkan',
    owner: idea.by || actor,
    due: 'Belum dijadwalkan',
    status: CANONICAL_STATES.PROPOSED,
    contributors: [[idea.category || 'Kontributor', CANONICAL_STATES.BELUM_MULAI]],
    demo: Boolean(idea.demo),
    provenance: {
      origin_idea_id: idea.id,
      origin_author: idea.by,
      converted_by: actor,
      created_at: new Date().toISOString()
    }
  };

  return { task, updatedIdea };
}

/**
 * Creates candidate items from a meeting requiring human confirmation.
 * @param {Object} meeting 
 * @param {'task'|'decision'|'idea'|'evidence'} kind 
 * @param {Object} data 
 * @param {string} author 
 * @returns {Object} Candidate record
 */
export function createMeetingCandidate(meeting, kind, data = {}, author = 'Rapat') {
  const timestamp = new Date().toISOString();
  const baseProvenance = {
    meeting_id: meeting?.id || null,
    meeting_title: meeting?.title || 'Rapat',
    generated_by: author,
    created_at: timestamp,
    requires_human_confirmation: true
  };

  switch (kind) {
    case 'task':
      return {
        id: Date.now(),
        title: data.title || 'Action item dari rapat (kandidat)',
        program: data.program || 'Belum ditetapkan',
        owner: data.owner || 'Belum ditugaskan',
        due: data.due || 'Belum dijadwalkan',
        status: CANONICAL_STATES.PENDING_VERIFICATION,
        candidate: true,
        contributors: [['Rapat', CANONICAL_STATES.SUDAH_DIISI]],
        demo: true,
        provenance: baseProvenance
      };
    case 'decision':
      return {
        id: Date.now(),
        text: data.text || 'Keputusan kandidat dari rapat',
        status: CANONICAL_STATES.PENDING_VERIFICATION,
        by: author,
        candidate: true,
        demo: true,
        provenance: baseProvenance
      };
    case 'idea':
      return {
        id: Date.now(),
        text: data.text || 'Ide kandidat dari rapat',
        by: author,
        stage: 'BENIH',
        category: data.category || 'Ide Baru',
        candidate: true,
        demo: true,
        provenance: baseProvenance
      };
    case 'evidence':
      return {
        id: Date.now(),
        title: data.title || 'Bukti kandidat dari rapat',
        type: data.type || 'Catatan rapat',
        status: CANONICAL_STATES.SUBMITTED,
        by: author,
        candidate: true,
        demo: true,
        provenance: baseProvenance
      };
    default:
      throw new Error(`Unknown meeting candidate kind: ${kind}`);
  }
}

/**
 * Human-confirmation boundary: confirms a candidate item into active/verified operations.
 * @param {Object} candidate 
 * @param {string} confirmedBy 
 * @returns {Object} Confirmed record
 */
export function confirmMeetingCandidate(candidate, confirmedBy) {
  if (!candidate) throw new Error('Candidate item is required');
  return {
    ...candidate,
    candidate: false,
    status: candidate.status === CANONICAL_STATES.PENDING_VERIFICATION 
      ? CANONICAL_STATES.PROPOSED 
      : candidate.status,
    confirmed_by: confirmedBy,
    confirmed_at: new Date().toISOString(),
    provenance: {
      ...(candidate.provenance || {}),
      requires_human_confirmation: false,
      confirmed_by: confirmedBy,
      confirmed_at: new Date().toISOString()
    }
  };
}

/**
 * Creates an escalation for Founder Yusup Oeblet.
 * @param {string} title 
 * @param {string} description 
 * @param {string} raisedBy 
 * @param {string} priority 
 * @returns {Object} Escalation record
 */
export function escalateToFounder(title, description, raisedBy, priority = 'NORMAL') {
  return {
    id: Date.now(),
    title,
    description,
    raised_by: raisedBy,
    priority,
    status: 'ESCALATED',
    founder_action: null,
    founder_notes: null,
    created_at: new Date().toISOString(),
    demo: true
  };
}

/**
 * Applies a Founder action to an escalation.
 * Allowed actions: 'LIHAT', 'SETUJUI', 'REVISI', 'TAHAN', 'BERI ARAHAN'
 * @param {Object} escalation 
 * @param {'LIHAT'|'SETUJUI'|'REVISI'|'TAHAN'|'BERI ARAHAN'} action 
 * @param {string} notes 
 * @param {string} founderName 
 * @returns {Object} Updated escalation record
 */
export function resolveFounderEscalation(escalation, action, notes = '', founderName = 'Yusup Oeblet') {
  const validActions = ['LIHAT', 'SETUJUI', 'REVISI', 'TAHAN', 'BERI ARAHAN'];
  if (!validActions.includes(action)) {
    throw new Error(`Invalid founder action: ${action}`);
  }

  return {
    ...escalation,
    status: action === 'SETUJUI' ? CANONICAL_STATES.VERIFIED : `FOUNDER_${action}`,
    founder_action: action,
    founder_notes: notes || null,
    resolved_by: founderName,
    resolved_at: new Date().toISOString()
  };
}

/**
 * Verifies an evidence record with full audit provenance.
 * @param {Object} evidence 
 * @param {string} verifiedBy 
 * @returns {Object} Verified evidence record
 */
export function verifyEvidenceRecord(evidence, verifiedBy = 'BST Operator') {
  if (!evidence) throw new Error('Evidence record is required');
  return {
    ...evidence,
    status: CANONICAL_STATES.VERIFIED,
    verified_by: verifiedBy,
    verified_at: new Date().toISOString(),
    provenance: {
      ...(evidence.provenance || {}),
      verified_by: verifiedBy,
      verified_at: new Date().toISOString()
    }
  };
}

/**
 * Google Adapter factory & implementation.
 */
export function createGoogleAdapter(options = {}) {
  let credentials = {
    accessToken: options.accessToken || null,
    serviceAccount: options.serviceAccount || null,
    apiKey: options.apiKey || null
  };

  let connectionMode = credentials.accessToken || credentials.serviceAccount 
    ? 'GOOGLE_CONNECTED' 
    : 'GOOGLE_NOT_CONNECTED';

  return {
    spreadsheetId: options.spreadsheetId || SPREADSHEET_ID,
    driveRootId: options.driveRootId || DRIVE_ROOT_ID,
    get mode() {
      return connectionMode;
    },

    setCredentials(newCreds) {
      credentials = { ...credentials, ...newCreds };
      connectionMode = credentials.accessToken || credentials.serviceAccount 
        ? 'GOOGLE_CONNECTED' 
        : 'GOOGLE_NOT_CONNECTED';
    },

    async readiness() {
      if (connectionMode === 'GOOGLE_CONNECTED') {
        return {
          connected: true,
          mode: 'GOOGLE_CONNECTED',
          spreadsheetId: this.spreadsheetId,
          driveRootId: this.driveRootId,
          reason: 'Google credentials active and ready for canonical operations.'
        };
      }
      return {
        connected: false,
        mode: 'GOOGLE_NOT_CONNECTED',
        spreadsheetId: this.spreadsheetId,
        driveRootId: this.driveRootId,
        reason: 'Google OAuth and server-side credentials are not configured. System is operating in Local Demo Fallback mode.'
      };
    },

    getSheetsApiUrl(range) {
      return `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/${encodeURIComponent(range)}`;
    },

    getDriveUploadUrl() {
      return `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart`;
    },

    getDriveFilesUrl(query) {
      const q = query ? `?q=${encodeURIComponent(query)}` : '';
      return `https://www.googleapis.com/drive/v3/files${q}`;
    },

    async readModule(moduleName) {
      if (connectionMode !== 'GOOGLE_CONNECTED') {
        throw new Error('GOOGLE_NOT_CONNECTED');
      }
      const mapping = SHEET_MODULES[moduleName];
      if (!mapping) throw new Error(`Unknown module: ${moduleName}`);

      const res = await fetch(this.getSheetsApiUrl(mapping.range), {
        headers: {
          'Authorization': `Bearer ${credentials.accessToken}`,
          'Accept': 'application/json'
        }
      });
      if (!res.ok) {
        throw new Error(`Google Sheets API read failed with status ${res.status}`);
      }
      const data = await res.json();
      return data.values || [];
    },

    async writeRecord(moduleName, record) {
      if (connectionMode !== 'GOOGLE_CONNECTED') {
        throw new Error('GOOGLE_NOT_CONNECTED');
      }
      const mapping = SHEET_MODULES[moduleName];
      if (!mapping) throw new Error(`Unknown module: ${moduleName}`);

      const res = await fetch(`${this.getSheetsApiUrl(mapping.range)}:append?valueInputOption=USER_ENTERED`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${credentials.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          values: [Array.isArray(record) ? record : Object.values(record)]
        })
      });
      if (!res.ok) {
        throw new Error(`Google Sheets API write failed with status ${res.status}`);
      }
      return await res.json();
    },

    async uploadEvidence(metadata, fileBuffer) {
      if (connectionMode !== 'GOOGLE_CONNECTED') {
        throw new Error('GOOGLE_NOT_CONNECTED');
      }
      const boundary = '-------314159265358979323846';
      const delimiter = `\r\n--${boundary}\r\n`;
      const closeDelimiter = `\r\n--${boundary}--`;

      const meta = {
        name: metadata.name || 'BST_Evidence_Document',
        parents: [this.driveRootId],
        description: metadata.description || 'Uploaded via BST Operations Platform'
      };

      const body = delimiter +
        'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
        JSON.stringify(meta) +
        delimiter +
        `Content-Type: ${metadata.mimeType || 'application/octet-stream'}\r\n\r\n` +
        (fileBuffer || '') +
        closeDelimiter;

      const res = await fetch(this.getDriveUploadUrl(), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${credentials.accessToken}`,
          'Content-Type': `multipart/related; boundary=${boundary}`
        },
        body
      });
      if (!res.ok) {
        throw new Error(`Google Drive API upload failed with status ${res.status}`);
      }
      return await res.json();
    }
  };
}

// Global default singleton instance
export const googleAdapter = createGoogleAdapter();

// Attach to browser global if running in browser window
if (typeof window !== 'undefined') {
  window.BSTGoogleAdapter = {
    SPREADSHEET_ID,
    DRIVE_ROOT_ID,
    SHEET_MODULES,
    DRIVE_FOLDERS,
    CANONICAL_STATES,
    calculateTaskCompleteness,
    convertIdeaToProposedTask,
    createMeetingCandidate,
    confirmMeetingCandidate,
    escalateToFounder,
    resolveFounderEscalation,
    verifyEvidenceRecord,
    createGoogleAdapter,
    googleAdapter
  };
}
