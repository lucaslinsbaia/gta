/* GET /api/manter-ativo: chamada uma vez por dia pela Vercel (vercel.json → crons).
   Faz uma consulta simples para o banco gratuito (Supabase) não ser pausado por inatividade.
   Se CRON_SECRET estiver configurada, só aceita a chamada da própria Vercel. */
import { sql, ensureSchema } from '../lib/db.js';
import { send, handle, fail } from '../lib/http.js';

export default handle(async (req, res) => {
  if (req.method !== 'GET') throw fail(405, 'Método não permitido.');
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.authorization !== `Bearer ${secret}`) throw fail(401, 'Não autorizado.');
  await ensureSchema();
  const [{ turmas }] = await sql`SELECT COUNT(*)::int AS turmas FROM turmas`;
  send(res, 200, { ok: true, turmas, em: new Date().toISOString() });
});
