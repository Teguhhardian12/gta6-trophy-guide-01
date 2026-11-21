import { createServer } from 'node:http';
import { readFileSync, mkdirSync, existsSync, rmSync, statSync } from 'node:fs';
import { join, extname, dirname } from 'node:path';
import { spawn } from 'node:child_process';
import { tmpdir } from 'node:os';

const root = dirname(new URL(import.meta.url).pathname);
const repo = join(root, '..');
const appDir = join(repo, 'app');
const shotDir = join(repo, 'screenshots');
const CHROME = '/usr/bin/google-chrome';
const PORT = 8099;
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.css': 'text/css', '.json': 'application/json', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };

function serve() {
  return new Promise((resolve) => {
    const server = createServer((req, res) => {
      const url = new URL(req.url, `http://127.0.0.1:${PORT}`);
      let file = join(appDir, decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname));
      if (!existsSync(file)) file = join(appDir, 'index.html');
      try {
        const body = readFileSync(file);
        res.writeHead(200, { 'content-type': MIME[extname(file)] ?? 'application/octet-stream' });
        res.end(body);
      } catch {
        res.writeHead(404); res.end('not found');
      }
    });
    server.listen(PORT, '127.0.0.1', () => resolve(server));
  });
}

function chrome(args) {
  return new Promise((resolve) => {
    const p = spawn(CHROME, args, { stdio: 'ignore' });
    const timer = setTimeout(() => { p.kill('SIGKILL'); resolve(124); }, 60000);
    p.on('exit', (code) => { clearTimeout(timer); resolve(code ?? 1); });
    p.on('error', () => { clearTimeout(timer); resolve(1); });
  });
}

function jpegSize(path) {
  const b = readFileSync(path);
  if (b[0] !== 0xff || b[1] !== 0xd8) return null;
  let i = 2;
  while (i < b.length - 9) {
    if (b[i] !== 0xff) { i++; continue; }
    const m = b[i + 1];
    const len = b.readUInt16BE(i + 2);
    if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) {
      return { h: b.readUInt16BE(i + 5), w: b.readUInt16BE(i + 7) };
    }
    i += 2 + len;
  }
  return null;
}

const recipes = JSON.parse(readFileSync(join(repo, 'shots.json'), 'utf8'));
mkdirSync(shotDir, { recursive: true });
const server = await serve();
let failed = 0;
for (const r of recipes) {
  const out = join(shotDir, r.name);
  const profile = join(tmpdir(), 'shot-' + process.pid + '-' + r.name.replace(/\W/g, ''));
  rmSync(out, { force: true });
  const url = `http://127.0.0.1:${PORT}/${r.query}`;
  const code = await chrome([
    '--headless=new', '--disable-gpu', '--no-sandbox', '--hide-scrollbars',
    '--force-device-scale-factor=1', '--user-data-dir=' + profile,
    '--virtual-time-budget=5000', `--window-size=${r.w},${(r.h ?? r.w)}`,
    '--screenshot=' + out, url,
  ]);
  rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
  if (code !== 0 || !existsSync(out)) { console.error(`FAIL ${r.name}: chrome exit ${code}`); failed++; continue; }
  const size = statSync(out).size;
  const dim = jpegSize(out);
  console.log(`${r.name}: ${size} bytes, ${dim ? dim.w + 'x' + dim.h : 'not a jpeg'}`);
  if (!dim) { console.error(`FAIL ${r.name}: not a JPEG`); failed++; continue; }
  if (dim.w !== r.w) { console.error(`FAIL ${r.name}: expected width ${r.w}, got ${dim.w}`); failed++; }
  if (size > 262144) { console.error(`FAIL ${r.name}: ${size} bytes over the 262144 cap`); failed++; }
}
server.close();
if (failed) { console.error(`${failed} shot(s) failed`); process.exit(1); }
console.log('all shots ok');
