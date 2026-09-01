import { cpSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';

mkdirSync('dist/public', { recursive: true });
mkdirSync('dist/server', { recursive: true });
for (const file of ['index.html', 'app.js', 'styles.css', 'google-adapter.js']) cpSync(file, `dist/public/${file}`);
const index = JSON.stringify(readFileSync('index.html', 'utf8'));
const app = JSON.stringify(readFileSync('app.js', 'utf8'));
const styles = JSON.stringify(readFileSync('styles.css', 'utf8'));
const googleAdapter = JSON.stringify(readFileSync('google-adapter.js', 'utf8'));

writeFileSync('dist/server/index.js', `const index=${index};
const app=${app};
const styles=${styles};
const googleAdapter=${googleAdapter};
const files = {
  '/': [index, 'text/html; charset=utf-8'],
  '/index.html': [index, 'text/html; charset=utf-8'],
  '/app.js': [app, 'application/javascript; charset=utf-8'],
  '/styles.css': [styles, 'text/css; charset=utf-8'],
  '/google-adapter.js': [googleAdapter, 'application/javascript; charset=utf-8']
};
export default {
  fetch(request) {
    const url = new URL(request.url);
    if (url.pathname === '/api/readiness') {
      const hasCreds = Boolean(process.env.GOOGLE_SERVICE_ACCOUNT_JSON || process.env.GOOGLE_ACCESS_TOKEN);
      return new Response(JSON.stringify({
        connected: hasCreds,
        mode: hasCreds ? 'GOOGLE_CONNECTED' : 'GOOGLE_NOT_CONNECTED',
        spreadsheetId: '11CTN2RdpNsyngd9kwaI1DNwl82Q6G98363PdJQnrGkA',
        driveRootId: '1A9a0f_EYix06BC8a12CILxsgCdsshCFK',
        reason: hasCreds ? 'Server-side Google credentials active.' : 'Google credentials not configured on server. Operating in Local Demo Fallback mode.'
      }), { headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
    }
    const item = files[url.pathname];
    return item ? new Response(item[0], {headers:{'content-type':item[1], 'cache-control':'no-store'}}) : new Response('Not found', {status:404});
  }
};
`);

