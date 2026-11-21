/* Gerado a partir de src/filtro.js (o mesmo filtro do jogo). */
/* --- Validação do nome e da turma ---------------------------------
   1. Tipos de caractere: letras (com acento), números, espaço, hífen,
      ponto e apóstrofo (a turma aceita também º, ª e barra).
   2. Lista restritiva: palavrões, insultos e termos ofensivos.
   A comparação é feita sobre o texto normalizado: minúsculas, sem
   acentos, números e símbolos trocados pelas letras que imitam
   (p0rr4 → porra) e letras repetidas reduzidas (porrraaa → pora).
   - BLOCKED_WORDS: bloqueadas como palavra inteira. Inclui termos curtos
     que aparecem dentro de nomes reais ("cu" em Cunha, "puto" em Caputo).
   - BLOCKED_ROOTS: raízes inconfundíveis, procuradas também dentro de
     palavras e com as letras separadas (c.a.r.a.l.h.o).
   ------------------------------------------------------------------ */
const BLOCKED_WORDS = [
  // português
  'cu', 'cuzao', 'cuzinho', 'puta', 'puto', 'putinha', 'puteiro', 'putaria', 'pau', 'piroca', 'pica', 'rola',
  'porra', 'merda', 'merdinha', 'merdinho', 'merdao', 'bosta', 'bostinha', 'foda', 'fodase', 'fodido', 'fodida', 'foder', 'caralho', 'cacete',
  'buceta', 'boceta', 'xota', 'xoxota', 'xereca', 'pinto', 'pemba', 'brioco', 'rabo',
  'otario', 'otaria', 'babaca', 'idiota', 'imbecil', 'retardado', 'retardada', 'mongol', 'debil',
  'corno', 'corna', 'chifrudo', 'viado', 'bicha', 'sapatao', 'traveco', 'vadia', 'vagabunda', 'vagabundo',
  'piranha', 'prostituta', 'safada', 'safado', 'arrombado', 'arrombada', 'desgracado', 'desgracada',
  'escroto', 'escrota', 'canalha', 'nojento', 'lixo', 'macaco', 'macaca', 'nazista', 'nazi', 'hitler',
  // abreviações
  'fdp', 'vsf', 'vtnc', 'tnc', 'pqp', 'krl', 'crl', 'prr', 'pnc', 'bct', 'tmnc',
  // inglês
  'fuck', 'fucker', 'fucking', 'shit', 'bitch', 'dick', 'cock', 'cunt', 'pussy', 'ass', 'asshole',
  'bastard', 'slut', 'whore', 'fag', 'faggot', 'nigga', 'nigger', 'retard'
];
const BLOCKED_ROOTS = [
  'caralh', 'buceta', 'boceta', 'xoxot', 'punhet', 'arromb', 'filhodaput', 'putaquepariu', 'vaitomarnocu',
  'merda', 'porra', 'fuck', 'shit', 'bitch', 'cunt', 'nigg', 'faggot', 'asshole'
];

const LEET = { 0: 'o', 1: 'i', 3: 'e', 4: 'a', 5: 's', 7: 't', 8: 'b', '@': 'a', '$': 's', '!': 'i', 'ø': 'o', 'æ': 'ae', 'ß': 'ss', 'ł': 'l', 'đ': 'd' };
const collapseRepeats = text => text.replace(/(.)\1+/g, '$1');

/** Texto comparável: minúsculas, sem acentos, com números/símbolos "leet" trocados por letras. */
function normalizeForFilter(text) {
  return text.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[0134578@$!øæßłđ]/g, ch => LEET[ch]);
}

const BLOCKED_WORD_SET = new Set(BLOCKED_WORDS.map(collapseRepeats));
const BLOCKED_ROOT_LIST = BLOCKED_ROOTS.map(collapseRepeats);

/** true se o texto tem um termo proibido (palavra inteira ou raiz, mesmo com letras separadas). */
function hasBlockedTerm(text) {
  const tokens = normalizeForFilter(text).split(/[^a-z]+/).filter(Boolean).map(collapseRepeats);
  const compact = collapseRepeats(tokens.join(''));
  return tokens.some(t => BLOCKED_WORD_SET.has(t)) || BLOCKED_ROOT_LIST.some(root => compact.includes(root));
}

const NAME_CHARS = /^[\p{L}\p{N} .'’-]+$/u;
const CLASS_CHARS = /^[\p{L}\p{N} .'’ºª°/-]+$/u;

/** Devolve a orientação para o nome, ou '' se estiver tudo certo. */
function nameProblem(name) {
  if (!name) return 'Digite seu nome ou apelido para começar.';
  if (!NAME_CHARS.test(name)) return 'Use só letras, números, espaços, hífen, ponto ou apóstrofo no nome.';
  if ((name.match(/\p{L}/gu) || []).length < 2) return 'Use pelo menos 2 letras no nome ou apelido.';
  if (hasBlockedTerm(name)) return 'Esse nome não pode ser usado no jogo. Escolha outro nome ou apelido.';
  return '';
}

/** Devolve a orientação para a turma (opcional), ou '' se estiver tudo certo. */
function classProblem(turma) {
  if (!turma) return '';
  if (!CLASS_CHARS.test(turma)) return 'Use só letras, números, espaços e º, ª, hífen ou barra na turma.';
  if (hasBlockedTerm(turma)) return 'Esse texto não pode ser usado na turma. Revise e tente de novo.';
  return '';
}

export { nameProblem, classProblem, hasBlockedTerm };
