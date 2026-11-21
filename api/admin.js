/* POST /api/admin: área de gestão (com senha).
   Corpo: { acao, ...dados }. Todas as ações, menos "entrar", pedem o token. */
import { sql, ensureSchema } from '../lib/db.js';
import { send, handle, fail, readBody, keyOf } from '../lib/http.js';
import { passwordMatches, issueToken, requireAdmin } from '../lib/auth.js';
import { classProblem } from '../lib/filtro.js';

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const toId = v => { const n = Number(v); if (!Number.isInteger(n) || n <= 0) throw fail(400, 'Identificador inválido.'); return n; };
const toDay = v => { if (!DAY.test(String(v))) throw fail(400, 'Data inválida.'); return String(v); };

/** Melhor partida de cada pessoa no dia (e na turma), já ordenada para o ranking. */
async function bestOfDay(dia, turma, incluirTeste) {
  const turmaFilter = turma === 'todas' ? sql``
    : turma === 'sem' ? sql`AND r.turma_id IS NULL`
    : sql`AND r.turma_id = ${toId(turma)}`;
  const rows = await sql`
    SELECT * FROM (
      SELECT DISTINCT ON (r.nome_chave, COALESCE(r.turma_id, 0))
        r.id, r.nome, r.turma_id, t.nome AS turma, r.turma_texto, r.nota::float AS nota, r.conceito,
        r.tempo_ms, r.erros, r.dicas, r.pulados, r.teste, r.jogado_em,
        COUNT(*) OVER (PARTITION BY r.nome_chave, COALESCE(r.turma_id, 0)) AS partidas
      FROM resultados r LEFT JOIN turmas t ON t.id = r.turma_id
      WHERE r.dia = ${dia} ${turmaFilter} ${incluirTeste ? sql`` : sql`AND NOT r.teste`}
      ORDER BY r.nome_chave, COALESCE(r.turma_id, 0), r.nota DESC, r.erros ASC, r.tempo_ms ASC, r.jogado_em ASC
    ) melhores
    ORDER BY nota DESC, erros ASC, tempo_ms ASC, jogado_em ASC`;
  return rows.map((r, i) => ({ ...r, partidas: Number(r.partidas), pos: i + 1 }));
}

const actions = {
  async painel() {
    const turmas = await sql`
      SELECT t.id, t.nome, t.ativa, COUNT(r.id)::int AS partidas
      FROM turmas t LEFT JOIN resultados r ON r.turma_id = t.id
      GROUP BY t.id ORDER BY t.ativa DESC, t.nome`;
    const dias = await sql`
      SELECT to_char(dia, 'YYYY-MM-DD') AS dia, COUNT(*)::int AS partidas, COUNT(*) FILTER (WHERE teste)::int AS testes
      FROM resultados GROUP BY dia ORDER BY dia DESC LIMIT 120`;
    const publicacoes = await sql`
      SELECT id, to_char(dia, 'YYYY-MM-DD') AS dia, turma_id, turma_nome, jsonb_array_length(entradas)::int AS total, publicada_em
      FROM publicacoes ORDER BY dia DESC, turma_nome NULLS FIRST`;
    return { turmas, dias, publicacoes };
  },

  async criarTurma(b) {
    const nome = String(b.nome || '').trim().replace(/\s+/g, ' ').slice(0, 20);
    if (!nome) throw fail(400, 'Digite o nome da turma.');
    const msg = classProblem(nome);
    if (msg) throw fail(400, msg);
    const rows = await sql`INSERT INTO turmas (nome, chave) VALUES (${nome}, ${keyOf(nome).replace(/[^\p{L}\p{N}]/gu, '')}) ON CONFLICT (chave) DO NOTHING RETURNING id, nome`;
    if (!rows.length) throw fail(409, `A turma “${nome}” já existe.`);
    return { turma: rows[0] };
  },

  async turmaAtiva(b) {
    await sql`UPDATE turmas SET ativa = ${Boolean(b.ativa)} WHERE id = ${toId(b.id)}`;
    return { ok: true };
  },

  async excluirTurma(b) {
    const id = toId(b.id);
    const [{ n }] = await sql`SELECT COUNT(*)::int AS n FROM resultados WHERE turma_id = ${id}`;
    if (n > 0) throw fail(409, 'Essa turma já tem partidas. Arquive em vez de excluir.');
    await sql`DELETE FROM turmas WHERE id = ${id}`;
    return { ok: true };
  },

  async partidas(b) {
    const dia = toDay(b.dia);
    const ranking = await bestOfDay(dia, b.turma || 'todas', Boolean(b.incluirTeste));
    const pub = await sql`
      SELECT id, turma_id, publicada_em FROM publicacoes WHERE dia = ${dia}`;
    return { ranking, publicacoes: pub };
  },

  async excluirPartida(b) {
    await sql`DELETE FROM resultados WHERE id = ${toId(b.id)}`;
    return { ok: true };
  },

  async publicar(b) {
    const dia = toDay(b.dia);
    const turmaId = b.turmaId ? toId(b.turmaId) : null;
    let turmaNome = null;
    if (turmaId) {
      const [t] = await sql`SELECT nome FROM turmas WHERE id = ${turmaId}`;
      if (!t) throw fail(404, 'Turma não encontrada.');
      turmaNome = t.nome;
    }
    const ranking = await bestOfDay(dia, turmaId || 'todas', Boolean(b.incluirTeste));
    if (!ranking.length) throw fail(400, 'Não há partidas para publicar nesse dia.');
    const entradas = ranking.map(r => ({
      pos: r.pos, nome: r.nome, turma: r.turma || null, nota: r.nota, conceito: r.conceito,
      tempoMs: r.tempo_ms, erros: r.erros, dicas: r.dicas, pulados: r.pulados
    }));
    const [pub] = await sql`
      INSERT INTO publicacoes (dia, turma_id, turma_nome, entradas)
      VALUES (${dia}, ${turmaId}, ${turmaNome}, ${sql.json(entradas)})
      ON CONFLICT (dia, COALESCE(turma_id, 0)) DO UPDATE SET entradas = EXCLUDED.entradas, turma_nome = EXCLUDED.turma_nome, publicada_em = now()
      RETURNING id, publicada_em`;
    return { publicacao: { ...pub, total: entradas.length } };
  },

  async despublicar(b) {
    await sql`DELETE FROM publicacoes WHERE id = ${toId(b.id)}`;
    return { ok: true };
  }
};

export default handle(async (req, res) => {
  if (req.method !== 'POST') throw fail(405, 'Método não permitido.');
  const b = await readBody(req);
  if (b.acao === 'entrar') {
    if (!passwordMatches(String(b.senha || ''))) {
      await new Promise(r => setTimeout(r, 800));   // freia tentativas de adivinhar a senha
      throw fail(401, 'Senha incorreta.');
    }
    send(res, 200, { token: issueToken() });
    return;
  }
  requireAdmin(req);
  const action = actions[b.acao];
  if (!action) throw fail(400, 'Ação desconhecida.');
  await ensureSchema();
  send(res, 200, await action(b));
});
