/* GET /api/ranking: rankings publicados pela gestão (mais recentes primeiro). */
import { sql, ensureSchema } from '../lib/db.js';
import { send, handle, fail } from '../lib/http.js';

export default handle(async (req, res) => {
  if (req.method !== 'GET') throw fail(405, 'Método não permitido.');
  await ensureSchema();
  const rows = await sql`
    SELECT id, to_char(dia, 'YYYY-MM-DD') AS dia, turma_id, turma_nome, entradas, publicada_em
    FROM publicacoes ORDER BY dia DESC, turma_nome NULLS FIRST LIMIT 300`;
  send(res, 200, {
    publicacoes: rows.map(r => ({ id: r.id, dia: r.dia, turma: r.turma_id ? { id: r.turma_id, nome: r.turma_nome } : null, publicadaEm: r.publicada_em, entradas: r.entradas }))
  });
});
