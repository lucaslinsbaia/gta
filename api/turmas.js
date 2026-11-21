/* GET /api/turmas: turmas ativas, para a tela de identificação do jogo. */
import { sql, ensureSchema } from '../lib/db.js';
import { send, handle, fail } from '../lib/http.js';

export default handle(async (req, res) => {
  if (req.method !== 'GET') throw fail(405, 'Método não permitido.');
  await ensureSchema();
  const turmas = await sql`SELECT id, nome FROM turmas WHERE ativa ORDER BY nome`;
  send(res, 200, { turmas });
});
