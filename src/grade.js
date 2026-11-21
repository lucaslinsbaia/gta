/* ---------------------------------------------------------------
   NOTA FINAL
   Cada capítulo tem um peso e perde pontos por tentativa incorreta,
   sem cair abaixo da metade do peso. Capítulo pulado vale 0. Usar
   dica (uma ou várias vezes, em qualquer capítulo) desconta 0,5 da
   nota, uma vez só. Terminar a jornada garante nota mínima 5.
   O tempo não entra na nota (serve só de desempate no ranking).
   --------------------------------------------------------------- */
const GRADE = {
  weight: { 1: 3, 2: 3, 3: 4 },
  errorCost: { 1: 0.5, 2: 0.5, 3: 0.25 },   // no círculo cada posição errada conta, por isso pesa menos
  hintPenalty: 0.5,
  floor: 5
};
const SKIP_AFTER = 10;   // tentativas incorretas no mesmo capítulo para liberar "Pular"

const fmt1 = n => n.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const fmt2 = n => n.toLocaleString('pt-BR', { maximumFractionDigits: 2 });

function chapterScore(n) {
  if (S.skipped[n]) return 0;
  const w = GRADE.weight[n];
  return Math.max(w / 2, w - GRADE.errorCost[n] * S.errors[n]);
}

function concept(grade) {
  if (grade >= 9) return 'Excelente';
  if (grade >= 7) return 'Muito bom';
  return 'Em desenvolvimento';
}

/** Calcula a nota da jornada (também guardada em S.result para o ranking). */
function computeGrade() {
  const chapters = [1, 2, 3].map(n => ({ n, score: chapterScore(n), max: GRADE.weight[n], errors: S.errors[n], skipped: Boolean(S.skipped[n]) }));
  const hintPenalty = hintsUsed() > 0 ? GRADE.hintPenalty : 0;
  const raw = chapters.reduce((sum, c) => sum + c.score, 0) - hintPenalty;
  const grade = Math.round(Math.max(GRADE.floor, raw) * 10) / 10;
  return { grade, concept: concept(grade), raw: Math.round(raw * 100) / 100, hintPenalty, chapters };
}

/* --- Tipos de engano: registrados para o feedback da conclusão --- */
function noteMistake(n, type) {
  S.mistakes[n][type] = (S.mistakes[n][type] || 0) + 1;
}

/** Classifica o engano de uma resposta errada (capítulo n, campo key). */
function classifyMistake(n, key) {
  const T = S.tri[n], v = parseAnswer(S.answers[n][key]);
  const same = (x, y) => Math.abs(x - y) <= 0.0101;
  if (n === 1) {
    if (v === T.c ** 2) return 'quadrado';
    if (v === T.a + T.b) return 'soma';
    if (v < 0) return 'negativo';
    if (v <= Math.max(T.a, T.b)) return 'menor';
    return 'outro';
  }
  if (key === 'lado') {
    if (v === T.o ** 2) return 'quadrado';
    if (same(v, Math.hypot(T.h, T.a))) return 'soma-quadrados';
    return 'outro-lado';
  }
  if (key === 'sen' && same(v, T.a / T.h)) return 'troca-sen-cos';
  if (key === 'cos' && same(v, T.o / T.h)) return 'troca-sen-cos';
  if (key === 'tg' && same(v, T.a / T.o)) return 'tg-invertida';
  if ((key === 'sen' || key === 'cos') && v > 1) return 'inversa';
  return 'outro';
}

const MISTAKE_TEXT = {
  quadrado: 'Você encontrou o quadrado do lado, mas faltou tirar a raiz quadrada.',
  soma: 'Você somou os catetos; o teorema soma os quadrados deles.',
  negativo: 'Um comprimento nunca é negativo.',
  menor: 'A hipotenusa é sempre o maior lado do triângulo retângulo.',
  'soma-quadrados': 'Você somou os quadrados; quando a hipotenusa é conhecida, é preciso subtrair.',
  'outro-lado': 'Revise como encontrar um cateto quando a hipotenusa já é conhecida.',
  'troca-sen-cos': 'Você trocou seno e cosseno: o seno usa o lado oposto a θ; o cosseno, o adjacente.',
  'tg-invertida': 'Você inverteu a tangente: ela é cateto oposto ÷ cateto adjacente.',
  inversa: 'Você colocou a hipotenusa no numerador; seno e cosseno são sempre menores que 1.'
};
const MISTAKE_OTHER = {
  1: 'Revise a aplicação do teorema: a² + b² = c², e depois a raiz quadrada.',
  2: 'Revise quais lados entram em cada razão, sempre em relação ao ângulo θ.',
  3: 'Revise o teorema para achar o lado oculto e, depois, a definição de cada razão.'
};

/* --- Materiais de estudo (editáveis) --- */
const yt = q => `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;
const khan = q => `https://pt.khanacademy.org/search?page_search_query=${encodeURIComponent(q)}`;
const STUDY = {
  1: {
    topic: 'Teorema de Pitágoras',
    links: [
      { label: 'Toda Matéria · Teorema de Pitágoras', url: 'https://www.todamateria.com.br/teorema-de-pitagoras/' },
      { label: 'Brasil Escola · Teorema de Pitágoras', url: 'https://brasilescola.uol.com.br/matematica/teorema-pitagoras.htm' },
      { label: 'YouTube · Matemática Rio: Teorema de Pitágoras', url: yt('Matemática Rio teorema de Pitágoras') },
      { label: 'YouTube · Gis com Giz: Teorema de Pitágoras', url: yt('Gis com Giz teorema de Pitágoras') }
    ]
  },
  2: {
    topic: 'Razões trigonométricas: seno, cosseno e tangente',
    links: [
      { label: 'Toda Matéria · Razões trigonométricas', url: 'https://www.todamateria.com.br/razoes-trigonometricas/' },
      { label: 'Khan Academy · Razões trigonométricas', url: khan('razões trigonométricas') },
      { label: 'YouTube · Equaciona (Prof. Paulo Pereira): seno, cosseno e tangente', url: yt('Equaciona Matemática seno cosseno tangente') },
      { label: 'YouTube · Professor Ferretto: razões trigonométricas', url: yt('Professor Ferretto razões trigonométricas') }
    ]
  },
  3: {
    topic: 'Pitágoras e razões trigonométricas juntos',
    links: [
      { label: 'Brasil Escola · Razões trigonométricas', url: 'https://brasilescola.uol.com.br/matematica/razoes-trigonometricas.htm' },
      { label: 'Khan Academy · Trigonometria do triângulo retângulo', url: khan('trigonometria triângulo retângulo') },
      { label: 'YouTube · Matemática Rio: razões trigonométricas', url: yt('Matemática Rio razões trigonométricas') },
      { label: 'YouTube · Professor Ferretto: trigonometria no triângulo retângulo', url: yt('Professor Ferretto trigonometria no triângulo retângulo') }
    ]
  }
};

/* --- Pular o mecanismo (liberado após 10 tentativas incorretas) --- */
function renderSkip() {
  const n = current;
  $('btn-skip').hidden = S.done[n] || S.errors[n] < SKIP_AFTER;
}

$('btn-skip').addEventListener('click', () => {
  $('skip-text').textContent = `Este capítulo vai valer 0 na nota final (ele vale até ${fmt2(GRADE.weight[current])} pontos). Antes de seguir, você verá a resolução completa.`;
  openDialog($('dlg-skip'));
});
$('skip-confirm').addEventListener('click', () => closeDialog($('dlg-skip'), () => {
  S.skipped[current] = true;
  completeChapter(current);
}));

