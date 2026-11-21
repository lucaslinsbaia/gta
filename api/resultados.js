/* POST /api/resultados: o jogo envia o resultado ao concluir a jornada.
   O servidor confere nome e turma, refaz a nota e grava uma vez por jornada. */
import { sql, ensureSchema } from '../lib/db.js';
import { send, handle, fail, readBody, keyOf } from '../lib/http.js';
import { nameProblem, classProblem } from '../lib/filtro.js';
import { scoreFrom, MISSIONS } from '../lib/nota.js';

const int = (v, max) => {
  const n = Number(v);
  if (!Number.isInteger(n) || n < 0 || n > max) throw fail(400, 'Resultado inválido.');
  return n;
};

export default handle(async (req, res) => {
  if (req.method !== 'POST') throw fail(405, 'Método não permitido.');
  const b = await readBody(req);

  const jornada = String(b.jornadaId || '');
  if (!/^[A-Za-z0-9-]{8,64}$/.test(jornada)) throw fail(400, 'Resultado inválido.');
  const nome = String(b.nome || '').trim().replace(/\s+/g, ' ').slice(0, 40);
  const nomeMsg = nameProblem(nome);
  if (nomeMsg) throw fail(400, nomeMsg);
  const turmaTexto = String(b.turmaTexto || '').trim().replace(/\s+/g, ' ').slice(0, 20);
  if (classProblem(turmaTexto)) throw fail(400, 'Turma inválida.');

  const errors = Object.fromEntries(MISSIONS.map(n => [n, int(b.erros?.[n], 999)]));
  const skipped = Object.fromEntries(MISSIONS.map(n => [n, Boolean(b.pulados?.[n])]));
  const hints = Object.fromEntries(MISSIONS.map(n => [n, Boolean(b.dicas?.[n])]));
  const tempo = int(b.tempoMs, 24 * 60 * 60 * 1000);
  const teste = Boolean(b.teste);
  // Ninguém resolve as seis missões em menos de 30 segundos sem o modo de teste
  if (!teste && tempo < 30000) throw fail(400, 'Resultado inválido.');

  await ensureSchema();
  // A turma é obrigatória: só valem turmas criadas (e ativas) na gestão
  if (b.turmaId == null || b.turmaId === '') throw fail(400, 'Selecione uma turma.');
  const [t] = await sql`SELECT id FROM turmas WHERE id = ${int(b.turmaId, 1e9)} AND ativa`;
  if (!t) throw fail(400, 'Turma não encontrada. Escolha uma das turmas cadastradas.');
  const turmaId = t.id;

  const { points, stars, grade, concept } = scoreFrom({ errors, skipped, hints });
  const totalErros = MISSIONS.reduce((sum, n) => sum + errors[n], 0);
  const pulados = MISSIONS.filter(n => skipped[n]).length;
  const dicas = MISSIONS.filter(n => hints[n]).length;
  const rows = await sql`
    INSERT INTO resultados (jornada_id, nome, nome_chave, turma_id, turma_texto, pontos, estrelas, nota, conceito, tempo_ms, erros, dicas, pulados, teste)
    VALUES (${jornada}, ${nome}, ${keyOf(nome)}, ${turmaId}, ${turmaTexto || null}, ${points}, ${stars}, ${grade}, ${concept}, ${tempo}, ${totalErros}, ${dicas}, ${pulados}, ${teste})
    ON CONFLICT (jornada_id) DO NOTHING
    RETURNING id`;
  send(res, rows.length ? 201 : 200, { ok: true, pontos: points, estrelas: stars, nota: grade, conceito: concept, repetido: !rows.length });
});
