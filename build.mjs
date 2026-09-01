import { cpSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';

mkdirSync('dist/public', { recursive: true });
mkdirSync('dist/server', { recursive: true });
for (const file of ['index.html', 'app.js', 'styles.css']) cpSync(file, `dist/public/${file}`);
const index = JSON.stringify(readFileSync('index.html', 'utf8'));
const app = JSON.stringify(readFileSync('app.js', 'utf8'));
const styles = JSON.stringify(readFileSync('styles.css', 'utf8'));
writeFileSync('dist/server/index.js', `const index=${index};
const app=${app};
const styles=${styles};
const files = {'/': [index, 'text/html; charset=utf-8'], '/index.html': [index, 'text/html; charset=utf-8'], '/app.js': [app, 'application/javascript; charset=utf-8'], '/styles.css': [styles, 'text/css; charset=utf-8']};
export default { fetch(request) { const url = new URL(request.url); const item = files[url.pathname]; return item ? new Response(item[0], {headers:{'content-type':item[1], 'cache-control':'no-store'}}) : new Response('Not found', {status:404}); } };
`);
