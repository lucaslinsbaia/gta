/* POST /api/nome: confere o nome ou apelido antes de o jogo começar,
   já com as palavras proibidas cadastradas na gestão. */
import { ensureSchema } from '../lib/db.js';
import { send, handle, fail, readBody } from '../lib/http.js';
import { nameProblem } from '../lib/filtro.js';
import { extraWords } from '../lib/palavras.js';

export default handle(async (req, res) => {
  if (req.method !== 'POST') throw fail(405, 'Método não permitido.');
  const b = await readBody(req);
  const nome = String(b.nome || '').trim().replace(/\s+/g, ' ').slice(0, 40);
  await ensureSchema();
  const msg = nameProblem(nome, await extraWords());
  if (msg) throw fail(400, msg);
  send(res, 200, { ok: true });
});
