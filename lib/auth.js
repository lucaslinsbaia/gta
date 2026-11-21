/* Sessão da área de gestão: senha única em ADMIN_PASSWORD (variável de
   ambiente na Vercel). O login devolve um token assinado que vale 12 horas. */
import { createHmac, timingSafeEqual, createHash } from 'node:crypto';
import { fail } from './http.js';

const TTL_MS = 12 * 60 * 60 * 1000;
const secret = () => {
  const pwd = process.env.ADMIN_PASSWORD;
  if (!pwd) throw fail(503, 'A senha da gestão não foi configurada (ADMIN_PASSWORD).');
  return 'enigma:' + pwd + ':' + (process.env.SESSION_SECRET || '');
};
const sign = payload => createHmac('sha256', secret()).update(payload).digest('base64url');
const digest = text => createHash('sha256').update(String(text)).digest();

export function passwordMatches(candidate) {
  const pwd = process.env.ADMIN_PASSWORD;
  if (!pwd) throw fail(503, 'A senha da gestão não foi configurada (ADMIN_PASSWORD).');
  return timingSafeEqual(digest(candidate), digest(pwd));
}

export function issueToken() {
  const payload = Buffer.from(JSON.stringify({ exp: Date.now() + TTL_MS })).toString('base64url');
  return `${payload}.${sign(payload)}`;
}

export function requireAdmin(req) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  const [payload, mac] = token.split('.');
  if (!payload || !mac) throw fail(401, 'Entre com a senha da gestão.');
  const expected = Buffer.from(sign(payload)), given = Buffer.from(mac);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) throw fail(401, 'Sessão inválida. Entre de novo.');
  let data;
  try { data = JSON.parse(Buffer.from(payload, 'base64url').toString()); } catch { throw fail(401, 'Sessão inválida. Entre de novo.'); }
  if (!data.exp || data.exp < Date.now()) throw fail(401, 'Sua sessão expirou. Entre de novo.');
}
