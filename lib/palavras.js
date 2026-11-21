/* Palavras proibidas cadastradas pelo professor na gestão. Somam-se à
   lista fixa do filtro (src/filtro.js) e nunca são enviadas ao navegador. */
import { sql } from './db.js';

export async function extraWords() {
  return sql`SELECT chave, dentro FROM palavras_proibidas`;
}
