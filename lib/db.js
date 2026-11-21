/* Conexão com o Postgres (Supabase, Neon ou outro).
   A Vercel coloca a URL do banco em POSTGRES_URL (ou DATABASE_URL) quando o
   banco é ligado ao projeto em Storage. As tabelas são criadas sozinhas na
   primeira chamada. */
import postgres from 'postgres';

/** Remove parâmetros extras da URL (ex.: "supa" do Supabase), que o Postgres recusaria. */
function cleanUrl(raw) {
  if (!raw) return raw;
  try {
    const u = new URL(raw);
    [...u.searchParams.keys()].forEach(k => { if (k !== 'sslmode') u.searchParams.delete(k); });
    return u.toString();
  } catch { return raw; }
}

const url = cleanUrl(process.env.POSTGRES_URL || process.env.DATABASE_URL);
const local = url && /@(localhost|127\.0\.0\.1)[:/]/.test(url);

export const sql = url
  ? postgres(url, { max: 1, prepare: false, idle_timeout: 20, onnotice: () => {}, ssl: local ? false : 'require' })
  : null;

let ready = null;
export function ensureSchema() {
  if (!sql) throw Object.assign(new Error('Banco de dados não configurado (POSTGRES_URL).'), { status: 503 });
  if (!ready) {
    ready = sql.unsafe(`
      CREATE TABLE IF NOT EXISTS turmas (
        id         serial PRIMARY KEY,
        nome       text NOT NULL,
        chave      text NOT NULL UNIQUE,
        ativa      boolean NOT NULL DEFAULT true,
        criada_em  timestamptz NOT NULL DEFAULT now()
      );
      CREATE TABLE IF NOT EXISTS resultados (
        id           bigserial PRIMARY KEY,
        jornada_id   text NOT NULL UNIQUE,
        nome         text NOT NULL,
        nome_chave   text NOT NULL,
        turma_id     integer REFERENCES turmas(id) ON DELETE SET NULL,
        turma_texto  text,
        pontos       integer NOT NULL DEFAULT 0,
        estrelas     integer NOT NULL DEFAULT 0,
        nota         numeric(3,1) NOT NULL,
        conceito     text NOT NULL,
        tempo_ms     integer NOT NULL,
        erros        integer NOT NULL,
        dicas        integer NOT NULL,
        pulados      integer NOT NULL,
        teste        boolean NOT NULL DEFAULT false,
        jogado_em    timestamptz NOT NULL DEFAULT now(),
        dia          date NOT NULL DEFAULT (now() AT TIME ZONE 'America/Sao_Paulo')::date
      );
      ALTER TABLE resultados ADD COLUMN IF NOT EXISTS pontos integer NOT NULL DEFAULT 0;
      ALTER TABLE resultados ADD COLUMN IF NOT EXISTS estrelas integer NOT NULL DEFAULT 0;
      CREATE INDEX IF NOT EXISTS resultados_dia ON resultados (dia, turma_id);
      CREATE TABLE IF NOT EXISTS palavras_proibidas (
        id         serial PRIMARY KEY,
        palavra    text NOT NULL,
        chave      text NOT NULL UNIQUE,
        dentro     boolean NOT NULL DEFAULT false,
        criada_em  timestamptz NOT NULL DEFAULT now()
      );
      CREATE TABLE IF NOT EXISTS publicacoes (
        id            serial PRIMARY KEY,
        dia           date NOT NULL,
        turma_id      integer REFERENCES turmas(id) ON DELETE CASCADE,
        turma_nome    text,
        entradas      jsonb NOT NULL,
        publicada_em  timestamptz NOT NULL DEFAULT now()
      );
      CREATE UNIQUE INDEX IF NOT EXISTS publicacoes_escopo ON publicacoes (dia, COALESCE(turma_id, 0));
    `).catch(err => { ready = null; throw err; });
  }
  return ready;
}
