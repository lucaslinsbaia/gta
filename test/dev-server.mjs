// Servidor local que imita a Vercel: arquivos estáticos com cleanUrls + /api/*.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css' };
http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  if (url.pathname.startsWith('/api/')) {
    req.query = Object.fromEntries(url.searchParams);
    const mod = await import(pathToFileURL(path.join(root, url.pathname + '.js')).href);
    return mod.default(req, res);
  }
  let file = path.join(root, url.pathname === '/' ? 'index.html' : url.pathname);
  if (!path.extname(file)) file += '.html';
  if (!fs.existsSync(file)) { res.statusCode = 404; return res.end('404'); }
  res.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream');
  fs.createReadStream(file).pipe(res);
}).listen(3000, () => console.log('http://localhost:3000'));
