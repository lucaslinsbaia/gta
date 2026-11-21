/* POST /api/resultados: o jogo envia o resultado ao concluir a jornada.
   O servidor confere nome e turma, refaz a nota e grava uma vez por jornada. */
import { sql, ensureSchema } from '../lib/db.js';
import { send, handle, fail, readBody, keyOf } from '../lib/http.js';
import { nameProblem, classProblem } from '../lib/filtro.js';
import { gradeFrom } from '../lib/nota.js';

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

  const errors = { 1: int(b.erros?.[1], 999), 2: int(b.erros?.[2], 999), 3: int(b.erros?.[3], 999) };
  const skipped = { 1: Boolean(b.pulados?.[1]), 2: Boolean(b.pulados?.[2]), 3: Boolean(b.pulados?.[3]) };
  const hints = int(b.dicas, 3);
  const tempo = int(b.tempoMs, 24 * 60 * 60 * 1000);
  const teste = Boolean(b.teste);
  // Ninguém resolve os três mecanismos em menos de 20 segundos sem o modo de teste
  if (!teste && tempo < 20000) throw fail(400, 'Resultado inválido.');

  await ensureSchema();
  // A turma é obrigatória: só valem turmas criadas (e ativas) na gestão
  if (b.turmaId == null || b.turmaId === '') throw fail(400, 'Selecione uma turma.');
  const [t] = await sql`SELECT id FROM turmas WHERE id = ${int(b.turmaId, 1e9)} AND ativa`;
  if (!t) throw fail(400, 'Turma não encontrada. Escolha uma das turmas cadastradas.');
  const turmaId = t.id;

  const { grade, concept } = gradeFrom({ errors, skipped, hints });
  const totalErros = errors[1] + errors[2] + errors[3];
  const pulados = [1, 2, 3].filter(n => skipped[n]).length;
  const rows = await sql`
    INSERT INTO resultados (jornada_id, nome, nome_chave, turma_id, turma_texto, nota, conceito, tempo_ms, erros, dicas, pulados, teste)
    VALUES (${jornada}, ${nome}, ${keyOf(nome)}, ${turmaId}, ${turmaTexto || null}, ${grade}, ${concept}, ${tempo}, ${totalErros}, ${hints}, ${pulados}, ${teste})
    ON CONFLICT (jornada_id) DO NOTHING
    RETURNING id`;
  send(res, rows.length ? 201 : 200, { ok: true, nota: grade, conceito: concept, repetido: !rows.length });
});
