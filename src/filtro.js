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
   - Lista extra: palavras que o professor cadastra na gestão (/gestao).
     Ficam só no servidor: o jogo confere o nome em /api/nome, e o
     servidor confere de novo ao gravar o resultado e ao criar turmas.
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
  'caraio', 'caralio', 'fudido', 'fudida', 'fuder', 'fudeu', 'cagao', 'cagona', 'bunda', 'bundao', 'bundona', 'peido', 'peidao',
  'punheta', 'punheteiro', 'siririca', 'broxa', 'tesao', 'tesudo', 'tesuda', 'piru', 'pirocudo', 'caceta', 'xavasca', 'xana',
  'chupa', 'chupar', 'mamada', 'boquete', 'putinho', 'rapariga', 'quenga', 'meretriz', 'kenga', 'biscate', 'galinha',
  'baitola', 'boiola', 'mulherzinha', 'mariquinha',
  'burro', 'burra', 'jumento', 'anta', 'besta', 'mongoloide', 'aleijado', 'aleijada', 'gordo', 'gorda', 'baleia', 'balofo', 'balofa',
  'feio', 'feia', 'nerdola', 'perdedor', 'fracassado', 'fracassada',
  'estupro', 'estuprador', 'pedofilo', 'assassino', 'terrorista', 'suicida', 'matar', 'morra', 'morre',
  'maconha', 'maconheiro', 'cocaina', 'crack', 'droga', 'drogado', 'drogada', 'baseado', 'lsd', 'ecstasy',
  'sexo', 'sexy', 'porno', 'nude', 'nudes', 'pelado', 'xxx', 'penis', 'vagina', 'kkk',
  // abreviações
  'fdp', 'vsf', 'vtnc', 'tnc', 'pqp', 'krl', 'crl', 'prr', 'pnc', 'bct', 'tmnc', 'vsfd', 'vtmnc', 'ptqp',
  // inglês
  'fuck', 'fucker', 'fucking', 'shit', 'bitch', 'dick', 'cock', 'cunt', 'pussy', 'ass', 'asshole',
  'bastard', 'slut', 'whore', 'fag', 'faggot', 'nigga', 'nigger', 'retard', 'sex', 'porn', 'dildo', 'boobs', 'tits', 'penis', 'rape'
];
const BLOCKED_ROOTS = [
  'caralh', 'buceta', 'boceta', 'xoxot', 'punhet', 'arromb', 'filhodaput', 'putaquepariu', 'vaitomarnocu',
  'merda', 'porra', 'fuck', 'shit', 'bitch', 'cunt', 'nigg', 'faggot', 'asshole',
  'punhet', 'siriric', 'boquet', 'pedofil', 'estupr', 'pornogr', 'maconh', 'cocain', 'hitler', 'nazist', 'viadinh', 'putinh'
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

/** Chave de comparação de uma palavra (a mesma usada para guardar a lista extra). */
const filterKey = word => collapseRepeats(normalizeForFilter(String(word)).replace(/[^a-z]+/g, ''));

/**
 * true se o texto tem um termo proibido (palavra inteira ou raiz, mesmo com letras separadas).
 * extra: palavras da gestão, [{ chave, dentro }]; com dentro=true valem também dentro de outras palavras.
 */
function hasBlockedTerm(text, extra = []) {
  const tokens = normalizeForFilter(text).split(/[^a-z]+/).filter(Boolean).map(collapseRepeats);
  const compact = collapseRepeats(tokens.join(''));
  if (tokens.some(t => BLOCKED_WORD_SET.has(t)) || BLOCKED_ROOT_LIST.some(root => compact.includes(root))) return true;
  // Palavra inteira: compara com cada sequência de palavras seguidas ("Zé Ruela" dentro de "Ana Zé Ruela")
  const runs = new Set();
  for (let i = 0; i < tokens.length; i++) {
    let run = '';
    for (let j = i; j < tokens.length && j < i + 4; j++) { run += tokens[j]; runs.add(collapseRepeats(run)); }
  }
  return extra.some(w => w.chave && (w.dentro ? compact.includes(w.chave) : runs.has(w.chave)));
}

const NAME_CHARS = /^[\p{L}\p{N} .'’-]+$/u;
const CLASS_CHARS = /^[\p{L}\p{N} .'’ºª°/-]+$/u;

/** Devolve a orientação para o nome, ou '' se estiver tudo certo. */
function nameProblem(name, extra = []) {
  if (!name) return 'Digite seu nome ou apelido para começar.';
  if (!NAME_CHARS.test(name)) return 'Use só letras, números, espaços, hífen, ponto ou apóstrofo no nome.';
  if ((name.match(/\p{L}/gu) || []).length < 2) return 'Use pelo menos 2 letras no nome ou apelido.';
  if (hasBlockedTerm(name, extra)) return 'Esse nome não pode ser usado no jogo. Escolha outro nome ou apelido.';
  return '';
}

/** Devolve a orientação para a turma (opcional), ou '' se estiver tudo certo. */
function classProblem(turma, extra = []) {
  if (!turma) return '';
  if (!CLASS_CHARS.test(turma)) return 'Use só letras, números, espaços e º, ª, hífen ou barra na turma.';
  if (hasBlockedTerm(turma, extra)) return 'Esse texto não pode ser usado na turma. Revise e tente de novo.';
  return '';
}
