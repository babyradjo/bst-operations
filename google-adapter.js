/**
 * Google production adapter boundary.
 * It is intentionally inactive until server-side credentials are configured.
 * Browser UI continues to use localStorage demo mode by default.
 */
export const googleAdapter = {
  mode: 'GOOGLE_NOT_CONNECTED',
  spreadsheetId: '11CTN2RdpNsyngd9kwaI1DNwl82Q6G98363PdJQnrGkA',
  driveRootId: '1A9a0f_EYix06BC8a12CILxsgCdsshCFK',
  async readiness() {
    return { connected: false, reason: 'Google OAuth and server-side credentials are not configured.' };
  },
  async readModule() { throw new Error('GOOGLE_NOT_CONNECTED'); },
  async writeRecord() { throw new Error('GOOGLE_NOT_CONNECTED'); },
  async uploadEvidence() { throw new Error('GOOGLE_NOT_CONNECTED'); }
};
