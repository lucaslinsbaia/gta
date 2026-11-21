/* =====================================================================
   GTA · MISSÕES DO GLICÉRIO — lógica do jogo (JavaScript puro)
   ---------------------------------------------------------------------
   Organização:
     1. Imagens e utilitários
     2. Missões (sorteio, textos, respostas e resolução)
     3. Pontuação (igual a lib/nota.js no servidor)
     4. Estado e salvamento
     5. Navegação entre telas
     6. Início e identificação · 7. Mapa · 8. Missão · 9. Conclusão
     10. Servidor (turmas e ranking) · 11. Diálogos · 12. Modo de teste
   Respostas: etapa A monta a conta arrastando peças; etapa B é múltipla
   escolha. Nenhuma resposta pode ser negativa, e as imagens
   não mostram números (os valores mudam a cada jornada).
   ===================================================================== */
'use strict';

/* ---------------------------------------------------------------
   1. IMAGENS E UTILITÁRIOS
   --------------------------------------------------------------- */
const IMG = {
  dani: '__IMG_gta_dani_pixel__',
  avatar: '__IMG_gta_dani_avatar__',
  card: {
    1: '__IMG_gta_card_m1_obra__', 2: '__IMG_gta_card_m2_mapa__', 3: '__IMG_gta_card_m3_torre__',
    4: '__IMG_gta_card_m4_roda__', 5: '__IMG_gta_card_m5_foodtruck__', 6: '__IMG_gta_card_m6_formatura__'
  },
  scene: {
    1: '__IMG_gta_cena_m1_obra__', 2: '__IMG_gta_cena_m2_mapa__', 3: '__IMG_gta_cena_m3_torre__',
    4: '__IMG_gta_cena_m4_roda__', 5: '__IMG_gta_cena_m5_foodtruck__', 6: '__IMG_gta_cena_m6_formatura__'
  }
};

const $ = id => document.getElementById(id);
const pick = list => list[Math.floor(Math.random() * list.length)];
const randInt = (min, max) => min + Math.floor(Math.random() * (max - min + 1));
const round2 = x => Math.round((x + Number.EPSILON) * 100) / 100;
const fmt = n => n.toLocaleString('pt-BR', { maximumFractionDigits: 2, useGrouping: false });
const fmtBig = n => n.toLocaleString('pt-BR', { maximumFractionDigits: 2 });
const icon = (name, cls = 'icon') => `<svg class="${cls}" aria-hidden="true"><use href="#i-${name}"/></svg>`;
const escapeHtml = text => String(text).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const MISSIONS = [1, 2, 3, 4, 5, 6];
/** Nome ou apelido informado na identificação: a Dani chama o jogador por ele. */
const nick = () => (S && S.player && S.player.name) || 'você';

function newJourneyId() {
  if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
  return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 12);
}

/* ---------------------------------------------------------------
   2. MISSÕES
   Cada missão tem: gen() sorteia os valores da jornada; stages(d)
   devolve as duas etapas:
     A ("build"): montar a conta arrastando valores para as lacunas;
     B ("choice"): escolher o resultado entre 4 alternativas.
   solution(d) mostra a resolução quando a missão é pulada.
   Nenhuma resposta (nem alternativa certa) é negativa.
   --------------------------------------------------------------- */
const slot = value => ({ slot: String(value) });
/** Peças da etapa A: as necessárias (com repetição) mais distratores que ainda não estão lá. */
function makeChips(required, distractors) {
  const list = required.map(String);
  distractors.map(String).forEach(v => { if (!list.includes(v)) list.push(v); });
  return list;
}

const MISSION = {
  1: {
    title: 'Obra na Laje', area: 'Geometria', topic: 'Áreas e volumes (cilindro)',
    brief: '{nick}, olha essa obra! A galera vai instalar uma caixa d\'água cilíndrica na laje e precisa saber quanto cabe nela antes de ligar a bomba. Bora medir?',
    hint: 'A base do cilindro é um círculo: área = π · r² (r é o raio, metade do diâmetro). Depois, volume = área da base × altura. Pra passar de m³ pra litros, multiplica por 1.000. Salva essa dica!',
    alt: 'Laje em obra ao pôr do sol, com uma caixa d\'água cilíndrica azul no centro, andaime, tijolos e baldes.',
    gen() {
      const r = pick([0.5, 0.6, 0.8, 1]), h = pick([1, 1.2, 1.5, 2]);
      const A = round2(3.14 * r * r);
      return { r, h, A, B: round2(A * h * 1000) };
    },
    stages: d => [
      { type: 'build', data: [['Raio da base', `${fmt(d.r)} m`], ['Altura da caixa', `${fmt(d.h)} m`], ['Use π', '3,14']],
        question: 'Monte a conta da área da base da caixa.',
        template: ['A = ', slot('3,14'), ' · ', slot(fmt(d.r)), '²'],
        chips: makeChips(['3,14', fmt(d.r)], [fmt(2 * d.r), fmt(d.h), '2']),
        result: `Área da base: ${fmt(d.A)} m² (arredondada).` },
      { type: 'choice', data: [['Área da base', `${fmt(d.A)} m²`], ['Altura da caixa', `${fmt(d.h)} m`], ['Conversão', '1 m³ = 1.000 L']],
        question: 'Quantos litros cabem na caixa d\'água?', unit: 'litros', correct: d.B,
        distractors: [round2(d.A * d.h), round2(d.A * d.h * 100), round2(3.14 * 4 * d.r * d.r * d.h * 1000)] }
    ],
    solution: d => [
      `Área da base: 3,14 · ${fmt(d.r)}² = ${fmt(d.A)} m².`,
      `Volume: ${fmt(d.A)} · ${fmt(d.h)} = ${fmt(round2(d.A * d.h))} m³, ou seja, ${fmtBig(d.B)} litros.`
    ]
  },
  2: {
    title: 'Rolê no Mapa', area: 'Geometria', topic: 'Geometria analítica (ponto médio e distância)',
    brief: '{nick}, hoje o rolê é de skate! A pista nova fica num ponto do mapa e a sorveteria em outro. Vamos marcar o encontro no meio do caminho e descobrir a distância.',
    hint: 'Ponto médio: faz a média das coordenadas, x = (x₁ + x₂) ÷ 2. Distância: d = √((x₂ − x₁)² + (y₂ − y₁)²). É Pitágoras disfarçado no plano. GG!',
    alt: 'Vista aérea da cidade ao entardecer, com ruas em grade e dois marcadores rosa em esquinas diferentes.',
    gen() {
      const [dx, dy] = pick([[3, 4], [4, 3], [6, 8], [8, 6], [5, 12], [12, 5], [9, 12]]);
      const x1 = randInt(0, 20 - dx), y1 = randInt(0, 20 - dy);
      const flip = Math.random() < 0.5;
      const P = [x1, flip ? y1 + dy : y1], Q = [x1 + dx, flip ? y1 : y1 + dy];
      return { P, Q, dx, dy, mx: round2((P[0] + Q[0]) / 2), dist: Math.hypot(dx, dy) };
    },
    stages: d => [
      { type: 'build', data: [['Pista de skate', `(${d.P[0]}, ${d.P[1]})`], ['Sorveteria', `(${d.Q[0]}, ${d.Q[1]})`], ['Escala', '1 unidade = 1 quarteirão']],
        question: 'Monte a conta da coordenada x do ponto médio entre a pista e a sorveteria.',
        template: ['x = (', slot(d.P[0]), ' + ', slot(d.Q[0]), ') ÷ ', slot('2')], swap: [[0, 1]],
        chips: makeChips([d.P[0], d.Q[0], 2], [d.P[1], d.Q[1], 4, d.P[0] + d.Q[0], 1]),
        result: `Ponto médio: x = ${fmt(d.mx)}.` },
      { type: 'choice', data: [['Pista de skate', `(${d.P[0]}, ${d.P[1]})`], ['Sorveteria', `(${d.Q[0]}, ${d.Q[1]})`], ['Escala', '1 unidade = 1 quarteirão']],
        question: 'Qual é a distância em linha reta entre a pista e a sorveteria?', unit: 'quarteirões', correct: d.dist,
        distractors: [d.dx + d.dy, d.dx * d.dx + d.dy * d.dy, Math.abs(d.dx - d.dy)] }
    ],
    solution: d => [
      `Ponto médio: x = (${d.P[0]} + ${d.Q[0]}) ÷ 2 = ${fmt(d.mx)}.`,
      `Distância: √(${d.dx}² + ${d.dy}²) = ${d.dist} quarteirões.`
    ]
  },
  3: {
    title: 'Torre da Orla', area: 'Trigonometria', topic: 'Lei dos senos e lei dos cossenos',
    brief: '{nick}, subi na torre de observação da praia! Daqui dá pra ver a boia e dois veleiros. Bora descobrir umas distâncias com a lei dos senos e a dos cossenos.',
    hint: 'Lei dos senos: cada lado dividido pelo seno do ângulo oposto dá sempre o mesmo valor (sen 30° = 0,5 e sen 90° = 1). Lei dos cossenos: c² = a² + b² − 2·a·b·cos θ, com cos 60° = 0,5.',
    alt: 'Torre de observação pastel numa praia ao pôr do sol, olhando para o mar turquesa com dois veleiros distantes.',
    gen() {
      const [a, b, c] = pick([[3, 8, 7], [5, 8, 7], [7, 15, 13], [8, 15, 13], [5, 21, 19]]);
      return { lado30: pick([40, 60, 70, 90]), a: a * 100, b: b * 100, c: c * 100 };
    },
    stages: d => [
      { type: 'build', data: [['Triângulo', 'torre, veleiro e boia'], ['Ângulo de 30°', `lado oposto: ${d.lado30} m`], ['Ângulo de 90°', 'lado oposto: x']],
        question: 'Monte a lei dos senos para achar x, o lado oposto ao ângulo de 90°.',
        template: ['x ÷ sen 90° = ', slot(d.lado30), ' ÷ sen ', slot('30°')],
        chips: makeChips([d.lado30, '30°'], ['60°', '90°', d.lado30 / 2]),
        result: `Como sen 30° = 0,5: x = ${d.lado30 * 2} m.` },
      { type: 'choice', data: [['Torre até o veleiro 1', `${fmtBig(d.a)} m`], ['Torre até o veleiro 2', `${fmtBig(d.b)} m`], ['Ângulo na torre', '60°']],
        question: 'Qual é a distância entre os dois veleiros?', unit: 'm', correct: d.c,
        distractors: [round2(Math.hypot(d.a, d.b)), d.a + d.b, d.b - d.a] }
    ],
    solution: d => [
      `Lei dos senos: x ÷ sen 90° = ${d.lado30} ÷ sen 30°, então x = ${d.lado30} ÷ 0,5 = ${d.lado30 * 2} m.`,
      `Lei dos cossenos: d² = ${fmtBig(d.a)}² + ${fmtBig(d.b)}² − 2 · ${fmtBig(d.a)} · ${fmtBig(d.b)} · 0,5 = ${fmtBig(d.c * d.c)}, então d = ${fmtBig(d.c)} m.`
    ]
  },
  4: {
    title: 'Roda-Gigante', area: 'Trigonometria', topic: 'Ciclo trigonométrico e função seno',
    brief: '{nick}, olha o tamanho dessa roda-gigante! A altura de uma cadeira muda com o ângulo do giro, igualzinho a uma função seno. Partiu calcular?',
    hint: 'O seno vai de −1 a 1, então a altura máxima é quando sen θ = 1. Num ângulo qualquer, olha o quadrante: sen 30° = sen 150° = 0,5, sen 90° = 1, sen 210° = sen 330° = −0,5 e sen 270° = −1.',
    alt: 'Roda-gigante iluminada com luzes neon num píer ao pôr do sol, refletida na água.',
    gen() {
      const R = pick([8, 10, 12, 15]), theta = pick([30, 90, 150, 210, 270, 330]);
      const sin = { 30: 0.5, 90: 1, 150: 0.5, 210: -0.5, 270: -1, 330: -0.5 }[theta];
      return { R, theta, sin, max: 2 * R + 1, h: round2(R + 1 + R * sin) };
    },
    stages: d => [
      { type: 'build', data: [['Raio da roda', `${d.R} m`], ['Centro da roda', `${d.R + 1} m acima do chão`], ['Altura da cadeira', `h(θ) = ${d.R + 1} + ${d.R} · sen θ`]],
        question: 'Monte a conta da altura máxima. Dica: qual é o maior valor do seno?',
        template: ['h máx = ', slot(d.R + 1), ' + ', slot(d.R), ' · ', slot('1')],
        chips: makeChips([d.R + 1, d.R, 1], ['0', '0,5', 2 * d.R]),
        result: `Altura máxima: ${d.max} m.` },
      { type: 'choice', data: [['Altura da cadeira', `h(θ) = ${d.R + 1} + ${d.R} · sen θ`], ['Ângulo do giro agora', `θ = ${d.theta}°`]],
        question: 'Qual é a altura da cadeira nesse ângulo?', unit: 'm', correct: d.h,
        distractors: [round2(d.R + 1 - d.R * d.sin), d.R + 1, d.max, round2(d.R * Math.abs(d.sin)), d.R] }
    ],
    solution: d => {
      const s = { 30: '0,5', 90: '1', 150: '0,5', 210: '−0,5', 270: '−1', 330: '−0,5' }[d.theta];
      return [
        `Altura máxima: sen θ = 1, então h = ${d.R + 1} + ${d.R} · 1 = ${d.max} m.`,
        `Em θ = ${d.theta}°: sen ${d.theta}° = ${s}, então h = ${d.R + 1} + ${d.R} · (${s}) = ${fmt(d.h)} m.`
      ];
    }
  },
  5: {
    title: 'Food Truck', area: 'Álgebra', topic: 'Função quadrática (vértice da parábola)',
    brief: '{nick}, o food truck da orla quer descobrir o preço do lanche que dá mais lucro. O lucro segue uma parábola, então a resposta tá no vértice!',
    hint: 'Numa parábola L(p) = a·p² + b·p + c, o vértice fica em p = −b ÷ (2a). Aqui a = −1, então é só dividir o coeficiente de p por 2. Depois, calcula L nesse preço.',
    alt: 'Food truck turquesa e rosa numa feira noturna à beira-mar, com varal de luzes e clientes.',
    gen() {
      const k = pick([16, 20, 24, 28]), c = randInt(10, k * k / 4 - 10);
      return { k, c, p: k / 2, L: k * k / 4 - c };
    },
    stages: d => [
      { type: 'build', data: [['Lucro por noite', `L(p) = −p² + ${d.k}p − ${d.c}`], ['p', 'preço do lanche, em reais'], ['L', 'lucro, em dezenas de reais']],
        question: 'Monte a conta do preço que dá o lucro máximo (o p do vértice).',
        template: ['p = ', slot(d.k), ' ÷ ', slot('2')],
        chips: makeChips([d.k, 2], [d.c, 4, 1]),
        result: `Preço do lucro máximo: ${d.p} reais.` },
      { type: 'choice', data: [['Lucro por noite', `L(p) = −p² + ${d.k}p − ${d.c}`], ['Preço do lucro máximo', `${d.p} reais`]],
        question: 'Qual é o lucro máximo, em dezenas de reais?', unit: 'dezenas de reais', correct: d.L,
        distractors: [d.k * d.k / 4, d.k * d.k / 4 + d.c, d.k * d.k / 2 - d.c] }
    ],
    solution: d => [
      `Vértice: p = −${d.k} ÷ (2 · (−1)) = ${d.p} reais.`,
      `Lucro máximo: L(${d.p}) = −${d.p}² + ${d.k} · ${d.p} − ${d.c} = ${d.L}.`
    ]
  },
  6: {
    title: 'Festa da Formatura', area: 'Álgebra', topic: 'Progressão aritmética (PA) e geométrica (PG)',
    brief: '{nick}, a formatura tá chegando! Cada fileira de cadeiras tem mais lugares que a anterior, e os convites se espalham em rodadas. Bora organizar essa festa?',
    hint: 'PA: aₙ = a₁ + (n − 1) · r. PG: aₙ = a₁ · qⁿ⁻¹. Na PA você soma a razão; na PG você multiplica.',
    alt: 'Salão de festa de formatura com palco, arco de balões, muitas fileiras de cadeiras e convites sobre a mesa.',
    gen() {
      const a1 = pick([8, 10, 12]), r = pick([2, 3, 4]), n = pick([6, 8, 10]);
      const g1 = pick([2, 3]), q = pick([2, 3]), m = pick([4, 5]);
      return { a1, r, n, an: a1 + (n - 1) * r, g1, q, m, gm: g1 * q ** (m - 1) };
    },
    stages: d => [
      { type: 'build', data: [['1ª fileira', `${d.a1} cadeiras`], ['Cada fileira seguinte', `+${d.r} cadeiras`], ['Fileira procurada', `${d.n}ª`]],
        question: `Monte a conta das cadeiras da ${d.n}ª fileira.`,
        template: [`a${d.n} = `, slot(d.a1), ' + (', slot(d.n), ' − 1) · ', slot(d.r)],
        chips: makeChips([d.a1, d.n, d.r], [d.a1 + d.r, 1]),
        result: `A ${d.n}ª fileira tem ${d.an} cadeiras.` },
      { type: 'choice', data: [['1ª rodada', `${d.g1} convites`], ['Cada convidado repassa para', `${d.q} pessoas`]],
        question: `Quantos convites são enviados na ${d.m}ª rodada?`, unit: 'convites', correct: d.gm,
        distractors: [d.g1 * d.q ** d.m, d.g1 + (d.m - 1) * d.q, d.q ** (d.m - 1), d.g1 * d.q * d.m] }
    ],
    solution: d => [
      `PA: a${d.n} = ${d.a1} + (${d.n} − 1) · ${d.r} = ${d.an} cadeiras.`,
      `PG: a${d.m} = ${d.g1} · ${d.q}^${d.m - 1} = ${d.gm} convites.`
    ]
  }
};

/** Alternativas da etapa B: a certa e três erradas distintas e positivas, em ordem embaralhada. */
function choiceOptions(stage) {
  const correct = round2(stage.correct);
  const wrong = [];
  const add = v => { v = round2(v); if (v > 0 && v !== correct && !wrong.includes(v)) wrong.push(v); };
  stage.distractors.forEach(add);
  [correct * 2, correct + 10, round2(correct * 1.5), correct + 1].forEach(add);
  return shuffle([correct, ...wrong.slice(0, 3)]);
}
function shuffle(list) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [copy[i], copy[j]] = [copy[j], copy[i]]; }
  return copy;
}


const yt = q => `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;
const khan = q => `https://pt.khanacademy.org/search?page_search_query=${encodeURIComponent(q)}`;
const STUDY = {
  1: [['Khan Academy · volume do cilindro', khan('volume do cilindro')], ['YouTube · área do círculo e volume do cilindro', yt('volume do cilindro área da base aula')]],
  2: [['Khan Academy · distância entre dois pontos', khan('distância entre dois pontos')], ['YouTube · ponto médio e distância entre pontos', yt('geometria analítica ponto médio distância entre dois pontos aula')]],
  3: [['Khan Academy · lei dos senos e dos cossenos', khan('lei dos senos lei dos cossenos')], ['YouTube · lei dos senos e dos cossenos', yt('lei dos senos e lei dos cossenos aula')]],
  4: [['Khan Academy · ciclo trigonométrico', khan('círculo trigonométrico seno')], ['YouTube · função seno e ciclo trigonométrico', yt('função seno ciclo trigonométrico aula')]],
  5: [['Khan Academy · vértice da parábola', khan('vértice da parábola função quadrática')], ['YouTube · máximo e mínimo da função quadrática', yt('vértice da parábola máximo função quadrática aula')]],
  6: [['Khan Academy · progressões aritméticas e geométricas', khan('progressão aritmética geométrica')], ['YouTube · termo geral da PA e da PG', yt('termo geral PA PG aula')]]
};

/* ---------------------------------------------------------------
   3. PONTUAÇÃO (SPEC-gta, seção 3; o servidor refaz a mesma conta)
   --------------------------------------------------------------- */
const SCORE = { base: 100, error: 10, hint: 20, floor: 50, skipAfter: 10 };

function missionPoints(n) {
  if (S.skipped[n] || !S.done[n]) return 0;
  return Math.max(SCORE.floor, SCORE.base - SCORE.error * S.errors[n] - (S.hint[n] ? SCORE.hint : 0));
}
const totalPoints = () => MISSIONS.reduce((sum, n) => sum + missionPoints(n), 0);
function starsFor(points) {
  if (points >= 540) return 5;
  if (points >= 450) return 4;
  if (points >= 360) return 3;
  if (points >= 240) return 2;
  return points > 0 ? 1 : 0;
}
const LEVEL = { 0: 'Começando', 1: 'Aquecendo', 2: 'Em evolução', 3: 'Mandando bem', 4: 'Brabo das contas', 5: 'Lenda do Glicério' };
const gradeFrom = points => Math.max(5, Math.round(points / 6) / 10);
const starsHtml = (n, cls = 'icon') => Array.from({ length: 5 }, (_, i) => icon('star', `${cls}${i < n ? ' is-on' : ''}`)).join('');

/* ---------------------------------------------------------------
   4. ESTADO E SALVAMENTO
   --------------------------------------------------------------- */
const STORE_KEY = 'gta-glicerio-v1';
const PLAYER_KEY = 'gta-glicerio-jogador';
const perMission = value => Object.fromEntries(MISSIONS.map(n => [n, value]));
let S = null;

function freshState() {
  return {
    v: 2, started: true, jornadaId: newJourneyId(), player: null,
    data: Object.fromEntries(MISSIONS.map(n => [n, MISSION[n].gen()])),
    stage: perMission(0), stageErrors: perMission(0),
    done: perMission(false), skipped: perMission(false), errors: perMission(0), hint: perMission(false),
    options: perMission(null), tried: Object.fromEntries(MISSIONS.map(n => [n, []])),
    current: 1, activeMs: 0, completed: false, finalMs: 0, submitted: false, usedTest: false
  };
}
function loadState() {
  try {
    const data = JSON.parse(localStorage.getItem(STORE_KEY));
    return data && data.v === 2 && data.data ? data : null;
  } catch (e) { return null; }
}
function save() { try { localStorage.setItem(STORE_KEY, JSON.stringify(S)); } catch (e) { /* segue sem salvar */ } }

const finished = n => S.done[n] || S.skipped[n];
const unlocked = n => n === 1 || finished(n - 1);
const allFinished = () => MISSIONS.every(finished);

/* Tempo ativo: conta só com a aba visível, durante o jogo */
let lastTick = performance.now();
setInterval(() => {
  const now = performance.now();
  if (S && S.started && !S.completed && document.visibilityState === 'visible' && (screen === 'mapa' || screen === 'missao')) {
    S.activeMs += Math.min(now - lastTick, 5000);
  }
  lastTick = now;
}, 1000);
document.addEventListener('visibilitychange', () => { lastTick = performance.now(); if (S) save(); });

/* ---------------------------------------------------------------
   5. NAVEGAÇÃO
   --------------------------------------------------------------- */
let screen = 'inicio';
const SCREENS = { inicio: 's-inicio', identificacao: 's-identificacao', mapa: 's-mapa', missao: 's-missao', fim: 's-fim' };

function show(name) {
  screen = name;
  Object.entries(SCREENS).forEach(([key, id]) => { $(id).hidden = key !== name; });
  const playing = S && S.started && (name === 'mapa' || name === 'missao' || name === 'fim');
  $('nav-score').hidden = !playing;
  $('nav-map').hidden = name !== 'missao';
  $('test-fab').hidden = !(TEST && name === 'missao');
  ({ inicio: renderInicio, identificacao: renderIdentificacao, mapa: renderMapa, missao: renderMissao, fim: renderFim })[name]();
  renderScore();
  window.scrollTo(0, 0);
  const title = document.querySelector(`#${SCREENS[name]} h1`);
  if (title) { title.setAttribute('tabindex', '-1'); title.focus({ preventScroll: true }); }
}

function renderScore() {
  if (!S) return;
  const pts = totalPoints();
  $('nav-pts').textContent = pts;
  $('nav-stars').innerHTML = starsHtml(starsFor(pts));
  $('nav-stars').setAttribute('aria-label', `Nível de conhecimento: ${starsFor(pts)} de 5 estrelas`);
}

$('brand').addEventListener('click', () => show('inicio'));
$('nav-map').addEventListener('click', () => show('mapa'));

/* ---------------------------------------------------------------
   6. INÍCIO E IDENTIFICAÇÃO
   --------------------------------------------------------------- */
function renderInicio() {
  $('cover-dani').src = IMG.dani;
  document.querySelectorAll('#cover [data-card]').forEach(img => { img.src = IMG.card[img.dataset.card]; });
  const has = Boolean(S && S.started);
  $('btn-continue').hidden = !has;
  if (!has) { $('resume-info').textContent = ''; return; }
  const count = MISSIONS.filter(finished).length;
  if (S.completed) {
    $('btn-continue-text').textContent = 'Ver meu resultado';
    $('resume-info').textContent = `${S.player ? S.player.name + ' · ' : ''}${totalPoints()} pts · live encerrada`;
  } else {
    $('btn-continue-text').textContent = 'Continuar';
    $('resume-info').textContent = `${S.player ? S.player.name + ' · ' : ''}${count} de 6 missões · ${totalPoints()} pts`;
  }
}

$('btn-start').addEventListener('click', () => {
  if (S && S.started && !S.completed) {
    $('new-text').textContent = `Você tem uma jogada em andamento: ${MISSIONS.filter(finished).length} de 6 missões e ${totalPoints()} pontos. Começar de novo apaga esse progresso e sorteia novos valores.`;
    openDialog($('dlg-new'));
  } else show('identificacao');
});
$('new-confirm').addEventListener('click', () => closeDialog($('dlg-new'), () => show('identificacao')));
$('btn-continue').addEventListener('click', () => show(S.completed ? 'fim' : 'mapa'));
$('id-back').addEventListener('click', () => show('inicio'));

function lastPlayer() {
  try { return JSON.parse(localStorage.getItem(PLAYER_KEY)) || null; } catch (e) { return null; }
}

/*__FILTRO__*/

function setFieldMessage(input, msg, text) {
  if (text) input.setAttribute('aria-invalid', 'true'); else input.removeAttribute('aria-invalid');
  msg.textContent = text;
}

function renderIdentificacao() {
  const last = lastPlayer();
  $('id-name').value = last ? last.name : '';
  renderClassField(last);
  API.ready.then(() => { if (screen === 'identificacao') renderClassField(lastPlayer()); });
  setFieldMessage($('id-name'), $('id-name-msg'), '');
  setFieldMessage($('id-class'), $('id-class-msg'), '');
  setTimeout(() => $('id-name').focus(), 0);
}

/** Com servidor, o nome passa também pela lista de palavras proibidas da gestão. */
async function serverNameProblem(name) {
  if (!API.on) return '';
  try {
    const res = await fetch('/api/nome', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nome: name }) });
    if (res.ok) return '';
    const data = await res.json().catch(() => ({}));
    return res.status === 400 ? (data.erro || 'Esse nome não pode ser usado no jogo. Escolha outro nome ou apelido.') : '';
  } catch (e) { return ''; }   // sem conexão: o servidor confere de novo ao gravar o resultado
}

let checkingName = false;
$('id-form').addEventListener('submit', async event => {
  event.preventDefault();
  if (checkingName) return;
  if (!API.loaded) { API.ready.then(() => $('id-form').requestSubmit()); return; }
  const name = $('id-name').value.trim().replace(/\s+/g, ' ');
  const select = $('id-class');
  const turmaId = select.value ? Number(select.value) : null;
  const turma = turmaId ? select.options[select.selectedIndex].text : '';
  const nameMsg = nameProblem(name);
  const classMsg = API.on && !turmaId
    ? (API.turmas.length ? 'Escolha sua turma pra começar.' : 'Ainda não tem turma cadastrada. Peça ao professor para criar a sua.')
    : '';
  setFieldMessage($('id-name'), $('id-name-msg'), nameMsg);
  setFieldMessage($('id-class'), $('id-class-msg'), classMsg);
  if (nameMsg || classMsg) { (nameMsg ? $('id-name') : $('id-class')).focus(); return; }
  checkingName = true;
  const serverMsg = await serverNameProblem(name);
  checkingName = false;
  if (serverMsg) { setFieldMessage($('id-name'), $('id-name-msg'), serverMsg); $('id-name').focus(); return; }
  const player = { name, turma, turmaId };
  try { localStorage.setItem(PLAYER_KEY, JSON.stringify(player)); } catch (e) { /* segue sem lembrar */ }
  S = freshState();
  S.player = player;
  save();
  show('mapa');
});
$('id-name').addEventListener('input', () => setFieldMessage($('id-name'), $('id-name-msg'), ''));
$('id-class').addEventListener('change', () => setFieldMessage($('id-class'), $('id-class-msg'), ''));

/* ---------------------------------------------------------------
   7. MAPA DE MISSÕES
   --------------------------------------------------------------- */
function renderMapa() {
  $('map-avatar').src = IMG.avatar;
  const next = MISSIONS.find(n => !finished(n));
  const first = next === 1 && !S.stage[1] && !S.errors[1];
  $('map-eyebrow').textContent = S.player ? `Partiu, ${S.player.name}` : 'Mapa da cidade';
  $('map-bubble').textContent = first
    ? `Fala, ${nick()}! Hoje a live é de missões pela cidade. Cada uma vale até 100 pontos. Começa pela Obra na Laje que eu vou junto!`
    : next ? `Mandou bem até aqui! Próxima parada: ${MISSION[next].title}. Tô torcendo, ${nick()}!`
      : 'Todas as missões feitas! Bora ver o resultado da live.';
  $('missions').innerHTML = MISSIONS.map(n => {
    const M = MISSION[n];
    const open = unlocked(n);
    const status = S.done[n] ? `<span class="mcard__status is-done">${icon('check', 'icon icon--sm')} Concluída · ${missionPoints(n)} pts</span>`
      : S.skipped[n] ? `<span class="mcard__status is-skip">${icon('skip', 'icon icon--sm')} Pulada · 0 pts</span>`
        : open ? `<span class="mcard__status is-open">${icon('play', 'icon icon--sm')} ${S.stage[n] || S.errors[n] ? 'Em andamento' : 'Disponível'} · até 100 pts</span>`
          : `<span class="mcard__status">${icon('lock', 'icon icon--sm')} Bloqueada</span>`;
    return `<li><button type="button" class="mcard" data-mission="${n}" ${open ? '' : 'disabled'}
        aria-label="Missão ${n}: ${M.title}. ${M.topic}. ${open ? (finished(n) ? 'Ver de novo' : 'Jogar') : 'Bloqueada: conclua a anterior'}">
      <span class="mcard__img"><img src="${IMG.card[n]}" alt="">
        <span class="mcard__num">Missão ${n}</span>
        ${open ? '' : `<span class="mcard__lock">${icon('lock')}</span>`}</span>
      <span class="mcard__body">
        <span class="eyebrow">${M.area}</span>
        <span class="mcard__title">${M.title}</span>
        <span class="mcard__topic">${M.topic}</span>
        ${status}
      </span></button></li>`;
  }).join('');
}
$('missions').addEventListener('click', event => {
  const btn = event.target.closest('[data-mission]');
  if (!btn || btn.disabled) return;
  S.current = Number(btn.dataset.mission);
  save();
  show('missao');
});

/* ---------------------------------------------------------------
   8. MISSÃO
   Etapa A: montar a conta (arrastar as peças para as lacunas, ou
   tocar na peça e depois na lacuna). Etapa B: múltipla escolha.
   --------------------------------------------------------------- */
const STAGE_NAMES = ['Etapa A · Monte a conta', 'Etapa B · Escolha o resultado'];
const ui = { fills: [], chipOrder: [], selected: null, key: '' };

const currentStage = () => MISSION[S.current].stages(S.data[S.current])[S.stage[S.current]];

/** Prepara a etapa atual: embaralha as peças e guarda as alternativas da etapa B. */
function prepareStage() {
  const n = S.current, stage = currentStage();
  const key = `${S.jornadaId}-${n}-${S.stage[n]}`;
  if (ui.key === key) return;
  ui.key = key;
  ui.selected = null;
  if (stage.type === 'build') {
    ui.fills = stage.template.filter(t => typeof t === 'object').map(() => null);
    ui.chipOrder = shuffle(stage.chips.map((_, i) => i));
  } else if (!S.options[n]) {
    S.options[n] = choiceOptions(stage);
    S.tried[n] = [];
    save();
  }
}

function renderMissao() {
  const n = S.current, M = MISSION[n], d = S.data[n];
  const closed = finished(n);
  $('m-scene').src = IMG.scene[n];
  $('m-scene').alt = M.alt;
  $('m-avatar').src = IMG.avatar;
  $('m-eyebrow').textContent = `Missão ${n} · ${M.area}`;
  $('m-title').textContent = M.title;
  $('m-brief').textContent = M.brief.replace(/\{nick\}/g, nick());
  const k = closed ? 1 : S.stage[n];
  $('m-steps').innerHTML = ['Etapa A', 'Etapa B'].map((name, i) => {
    const cls = closed || i < S.stage[n] ? 'is-done' : i === k ? 'is-current' : '';
    return `<li class="${cls}"${i === k && !closed ? ' aria-current="step"' : ''}>${name}</li>`;
  }).join('');
  setMsg('');
  $('m-hint-text').textContent = S.hint[n] ? 'Ver a dica da Dani de novo' : 'Pedir dica à Dani (−20 pts)';
  $('m-hint-btn').hidden = closed && !S.hint[n];
  $('m-skip').hidden = closed || S.stageErrors[n] < SCORE.skipAfter;
  $('m-confirm').hidden = closed;
  renderMissionScore();
  if (closed) {
    $('m-build').hidden = true;
    $('m-choice').hidden = true;
    $('m-step-title').textContent = 'Missão finalizada';
    $('m-question').textContent = S.done[n] ? `Missão concluída com ${missionPoints(n)} pontos. A resolução:` : 'Missão pulada. A resolução:';
    $('m-data').innerHTML = M.solution(d).map(line => `<li><span>${escapeHtml(line)}</span></li>`).join('');
    return;
  }
  prepareStage();
  const stage = currentStage();
  $('m-step-title').textContent = STAGE_NAMES[S.stage[n]];
  $('m-data').innerHTML = stage.data.map(([label, value]) => `<li><span>${label}</span><strong>${value}</strong></li>`).join('');
  $('m-question').textContent = stage.question;
  $('m-build').hidden = stage.type !== 'build';
  $('m-choice').hidden = stage.type !== 'choice';
  $('m-confirm-text').textContent = stage.type === 'build' ? 'Conferir conta' : 'Confirmar';
  if (stage.type === 'build') renderBuild(stage); else renderChoice(stage);
}

/* --- Etapa A: montar a conta --- */
function renderBuild(stage) {
  let s = -1;
  $('m-expr').innerHTML = stage.template.map(t => {
    if (typeof t === 'string') return `<span class="tok">${escapeHtml(t)}</span>`;
    s += 1;
    const chip = ui.fills[s];
    const label = chip == null ? '' : stage.chips[chip];
    return `<button type="button" class="slot${chip == null ? '' : ' is-filled'}" data-slot="${s}"
      aria-label="Lacuna ${s + 1}: ${chip == null ? 'vazia' : label}${chip == null ? '' : ' (toque para tirar)'}">${escapeHtml(label)}</button>`;
  }).join('');
  const used = new Set(ui.fills.filter(v => v != null));
  $('m-chips').innerHTML = ui.chipOrder.map(i => `<button type="button" class="chip${ui.selected === i ? ' is-selected' : ''}" data-chip="${i}"
      aria-pressed="${ui.selected === i}" ${used.has(i) ? 'hidden' : ''}>${escapeHtml(stage.chips[i])}</button>`).join('');
}

function placeChip(chip, slotIdx) {
  const prev = ui.fills.indexOf(chip);
  if (prev >= 0) ui.fills[prev] = null;
  ui.fills[slotIdx] = chip;
  ui.selected = null;
  setMsg('');
  renderBuild(currentStage());
  const next = ui.fills.indexOf(null);
  $('live').textContent = `Peça ${currentStage().chips[chip]} colocada na lacuna ${slotIdx + 1}.`;
  const focusTo = next >= 0 ? $('m-chips').querySelector('.chip:not([hidden])') : $('m-confirm');
  if (focusTo && !dragState.active) focusTo.focus();
}

$('m-chips').addEventListener('click', event => {
  const btn = event.target.closest('[data-chip]');
  if (!btn || dragState.justDropped) return;
  const i = Number(btn.dataset.chip);
  ui.selected = ui.selected === i ? null : i;
  renderBuild(currentStage());
  if (ui.selected != null) {
    $('live').textContent = `Peça ${currentStage().chips[i]} selecionada. Agora toque numa lacuna.`;
    const empty = $('m-expr').querySelector('.slot:not(.is-filled)');
    if (empty) empty.focus();
  }
});
$('m-expr').addEventListener('click', event => {
  const btn = event.target.closest('[data-slot]');
  if (!btn) return;
  const s = Number(btn.dataset.slot);
  if (ui.selected != null) placeChip(ui.selected, s);
  else if (ui.fills[s] != null) {          // toque numa lacuna cheia devolve a peça
    ui.fills[s] = null;
    renderBuild(currentStage());
    setMsg('');
  } else {
    setMsg('Escolhe uma peça primeiro e depois toca na lacuna.', true, true);
  }
});

/* Arrastar com o dedo ou o mouse (Pointer Events) */
const dragState = { active: false, chip: null, ghost: null, startX: 0, startY: 0, justDropped: false };
$('m-chips').addEventListener('pointerdown', event => {
  const btn = event.target.closest('[data-chip]');
  if (!btn || event.button > 0) return;
  dragState.chip = Number(btn.dataset.chip);
  dragState.startX = event.clientX; dragState.startY = event.clientY;
  dragState.source = btn;
  btn.setPointerCapture(event.pointerId);
});
document.addEventListener('pointermove', event => {
  if (dragState.chip == null) return;
  if (!dragState.active) {
    if (Math.hypot(event.clientX - dragState.startX, event.clientY - dragState.startY) < 8) return;
    dragState.active = true;
    const ghost = dragState.source.cloneNode(true);
    ghost.classList.add('chip--ghost');
    ghost.removeAttribute('id');
    document.body.appendChild(ghost);
    dragState.ghost = ghost;
    dragState.source.classList.add('is-dragging');
  }
  dragState.ghost.style.left = `${event.clientX}px`;
  dragState.ghost.style.top = `${event.clientY}px`;
  const over = document.elementFromPoint(event.clientX, event.clientY);
  document.querySelectorAll('.slot.is-over').forEach(el => el.classList.remove('is-over'));
  const target = over && over.closest('[data-slot]');
  if (target) target.classList.add('is-over');
});
function endDrag(event, cancel) {
  if (dragState.chip == null) return;
  const wasActive = dragState.active;
  if (wasActive) {
    dragState.ghost.remove();
    dragState.source.classList.remove('is-dragging');
    document.querySelectorAll('.slot.is-over').forEach(el => el.classList.remove('is-over'));
    const over = !cancel && document.elementFromPoint(event.clientX, event.clientY);
    const target = over && over.closest('[data-slot]');
    const chip = dragState.chip;
    dragState.justDropped = true;
    setTimeout(() => { dragState.justDropped = false; }, 0);
    dragState.active = false;
    if (target) placeChip(chip, Number(target.dataset.slot));
  }
  dragState.chip = null;
  dragState.ghost = null;
}
document.addEventListener('pointerup', event => endDrag(event, false));
document.addEventListener('pointercancel', event => endDrag(event, true));

function checkBuild() {
  const n = S.current, stage = currentStage();
  if (ui.fills.includes(null)) { setMsg('Preenche todas as lacunas antes de conferir.', true, true); return; }
  const expected = stage.template.filter(t => typeof t === 'object').map(t => t.slot);
  const got = ui.fills.map(i => stage.chips[i]);
  const ok = got.map((v, i) => v === expected[i]);
  (stage.swap || []).forEach(group => {   // lacunas que podem trocar de lugar (como x₁ + x₂)
    const e = group.map(i => expected[i]).sort().join('|'), g = group.map(i => got[i]).sort().join('|');
    if (e === g) group.forEach(i => { ok[i] = true; });
  });
  if (ok.every(Boolean)) {
    S.stage[n] = 1;
    S.stageErrors[n] = 0;
    save();
    renderMissao();
    setMsg(`Conta certa! ${stage.result} Agora escolhe o resultado da etapa B.`, false);
    $('live').textContent = 'Conta certa. Etapa B liberada.';
    const first = document.querySelector('#m-options input');
    if (first) first.focus();
    return;
  }
  ok.forEach((good, i) => { if (!good) ui.fills[i] = null; });
  registerError();
  renderBuild(stage);
  const wrong = ok.filter(g => !g).length;
  setMsg(S.stageErrors[n] >= SCORE.skipAfter
    ? 'Ainda não. Se travar, agora dá pra pular a missão (ela vale 0).'
    : `${wrong === 1 ? 'Uma peça tava' : `${wrong} peças tavam`} no lugar errado e ${wrong === 1 ? 'voltou' : 'voltaram'} pra bandeja. Confere os dados e tenta de novo.`, true);
  wastedForError();
}

/* --- Etapa B: múltipla escolha --- */
function renderChoice(stage) {
  const n = S.current;
  const fmtOpt = v => `${fmtBig(v)}${stage.unit ? ' ' + stage.unit : ''}`;
  $('m-options').innerHTML = S.options[n].map((v, i) => {
    const tried = S.tried[n].includes(v);
    return `<label class="option${tried ? ' is-wrong' : ''}">
      <input type="radio" name="m-opt" value="${v}" ${tried ? 'disabled' : ''}>
      <span class="option__letter" aria-hidden="true">${'ABCD'[i]}</span>
      <span class="option__text">${fmtOpt(v)}</span>
      ${tried ? `<span class="option__tag">${icon('x', 'icon icon--sm')} errada</span>` : ''}
    </label>`;
  }).join('');
}

function checkChoice() {
  const n = S.current, stage = currentStage();
  const picked = document.querySelector('#m-options input:checked');
  if (!picked) { setMsg('Escolhe uma alternativa primeiro.', true, true); return; }
  const value = Number(picked.value);
  if (value === round2(stage.correct)) { completeMission(n, false); return; }
  S.tried[n].push(value);
  registerError();
  renderChoice(stage);
  setMsg(S.stageErrors[n] >= SCORE.skipAfter
    ? 'Ainda não. Se travar, agora dá pra pular a missão (ela vale 0).'
    : pick(['Não foi essa. Confere a conta e tenta outra.', 'Quase! Revisa os dados e escolhe de novo.', `Essa não, ${nick()}. Respira e confere cada passo.`]), true);
  wastedForError();
}

function registerError() {
  const n = S.current;
  S.errors[n] += 1;
  S.stageErrors[n] += 1;
  save();
  // Só a área da resposta treme: um transform no formulário tiraria o botão fixo do rodapé do lugar
  const box = currentStage().type === 'build' ? $('m-build') : $('m-choice');
  box.classList.remove('shake'); void box.offsetWidth; box.classList.add('shake');
  box.addEventListener('animationend', () => box.classList.remove('shake'), { once: true });
  $('m-skip').hidden = S.stageErrors[n] < SCORE.skipAfter;
  renderMissionScore();
  renderScore();
}

function renderMissionScore() {
  const n = S.current;
  if (finished(n)) { $('m-score').textContent = ''; return; }
  const now = Math.max(SCORE.floor, SCORE.base - SCORE.error * S.errors[n] - (S.hint[n] ? SCORE.hint : 0));
  $('m-score').textContent = `Valendo agora: ${now} pts · tentativas incorretas: ${S.errors[n]}${S.hint[n] ? ' · dica usada' : ''}`;
}

/** Mensagem da etapa: erro (vermelho), acerto (verde) ou aviso neutro, que não conta como erro. */
function setMsg(text, error, neutral) {
  $('m-msg').textContent = text;
  $('m-msg').className = `msg ${neutral ? '' : error ? 'is-error' : 'is-ok'}`;
}

$('m-form').addEventListener('submit', event => {
  event.preventDefault();
  if (finished(S.current)) return;
  if (currentStage().type === 'build') checkBuild(); else checkChoice();
});

/* Dica: −20 pontos, cobrada uma vez por missão */
$('m-hint-btn').addEventListener('click', () => {
  if (S.hint[S.current]) openHint(); else openDialog($('dlg-hint-ask'));
});
$('hint-confirm').addEventListener('click', () => closeDialog($('dlg-hint-ask'), () => {
  S.hint[S.current] = true;
  save();
  renderMissao();
  openHint();
}));
function openHint() {
  $('hint-avatar').src = IMG.avatar;
  $('hint-text').textContent = MISSION[S.current].hint;
  openDialog($('dlg-hint'));
}

/* Tela "wasted" (modal): aparece a cada erro e ao pular a missão */
function openWasted({ sub, action, after }) {
  $('wasted-sub').textContent = sub;
  $('wasted-ok').textContent = action;
  if (after) closeCallbacks.set($('dlg-wasted'), after);
  document.body.classList.add('is-wasted');
  openDialog($('dlg-wasted'));
  $('wasted-ok').focus();
}
$('dlg-wasted').addEventListener('close', () => document.body.classList.remove('is-wasted'));
function wastedForError() {
  const n = S.current;
  openWasted({
    sub: S.stageErrors[n] >= SCORE.skipAfter ? '−10 pts · se travar, já dá pra pular' : `−10 pts · tentativa incorreta ${S.stageErrors[n]}`,
    action: 'Tentar de novo'
  });
}

/* Pular: liberado após 10 tentativas incorretas na mesma etapa */
$('m-skip').addEventListener('click', () => openDialog($('dlg-skip')));
$('skip-confirm').addEventListener('click', () => closeDialog($('dlg-skip'), () => {
  const n = S.current;
  openWasted({ sub: 'Missão pulada · 0 pts', action: 'Ver a resolução', after: () => completeMission(n, true) });
}));

function completeMission(n, skipped) {
  if (skipped) S.skipped[n] = true; else S.done[n] = true;
  const last = allFinished();
  if (last && !S.completed) { S.completed = true; S.finalMs = Math.round(S.activeMs); }
  save();
  renderScore();
  const pts = missionPoints(n);
  $('rw-eyebrow').textContent = `Missão ${n} · ${MISSION[n].title}`;
  $('rw-title').textContent = skipped ? 'Missão pulada' : pick(['Missão concluída! GG!', 'Missão concluída! Brabo!', 'Missão concluída! Nível desbloqueado!']);
  $('rw-pts').innerHTML = `<strong>+${pts}</strong> pts`;
  $('rw-text').textContent = skipped
    ? 'Sem estresse: confere a resolução e salva pra revisar depois.'
    : S.errors[n] === 0 && !S.hint[n] ? `${nick()}, de primeira e sem dica! Pontuação cheia.` : `${nick()}, missão no bolso! Bora pra próxima.`;
  $('rw-solution').hidden = !skipped;
  $('rw-solution').innerHTML = skipped ? MISSION[n].solution(S.data[n]).map(line => `<p>${escapeHtml(line)}</p>`).join('') : '';
  $('rw-next').textContent = last ? 'Ver resultado da live' : 'Voltar ao mapa';
  openDialog($('dlg-reward'));
}
$('rw-next').addEventListener('click', () => closeDialog($('dlg-reward'), () => show(S.completed ? 'fim' : 'mapa')));


/* ---------------------------------------------------------------
   9. CONCLUSÃO
   --------------------------------------------------------------- */
function renderFim() {
  const pts = totalPoints(), stars = starsFor(pts);
  $('end-dani').src = IMG.dani;
  $('g-name').textContent = S.player ? S.player.name : 'você';
  $('g-class').textContent = S.player && S.player.turma ? `Turma ${S.player.turma}` : '';
  $('g-pts').textContent = pts;
  $('g-stars').innerHTML = starsHtml(stars);
  $('g-stars').setAttribute('aria-label', `${stars} de 5 estrelas`);
  $('g-level').textContent = `Nível de conhecimento: ${LEVEL[stars]}`;
  $('g-list').innerHTML = MISSIONS.map(n => `<li><span>${n}. ${MISSION[n].title}</span><strong>${S.skipped[n] ? 'pulada · 0' : missionPoints(n)} pts</strong></li>`).join('');
  const review = MISSIONS.filter(n => S.skipped[n] || missionPoints(n) < 70);
  $('g-study').hidden = !review.length;
  $('g-study-lead').textContent = 'Essas missões merecem uma revisada:';
  $('g-study-list').innerHTML = review.map(n => `<div class="study"><h3>${MISSION[n].title} · ${MISSION[n].topic}</h3><ul>${STUDY[n]
    .map(([label, url]) => `<li><a href="${url}" target="_blank" rel="noopener">${label}</a></li>`).join('')}</ul></div>`).join('');
  syncResult();
}
$('end-again').addEventListener('click', () => show('identificacao'));

/* ---------------------------------------------------------------
   10. SERVIDOR: turmas e envio do resultado
   Sem servidor (arquivo local), o jogo funciona sem ranking e esconde a turma.
   --------------------------------------------------------------- */
const API = { on: false, loaded: false, turmas: [] };
API.ready = (async () => {
  if (!/^https?:$/.test(location.protocol)) return;
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 5000);
    const res = await fetch('/api/turmas', { signal: ctrl.signal, headers: { Accept: 'application/json' } });
    clearTimeout(timer);
    if (!(res.headers.get('content-type') || '').includes('json')) return;
    if (!res.ok) return;
    const data = await res.json();
    API.turmas = Array.isArray(data.turmas) ? data.turmas : [];
    API.on = true;
    $('start-ranking').hidden = false;
    $('end-ranking').hidden = false;
  } catch (e) { /* sem servidor: o jogo segue sem ranking */ }
})().finally(() => { API.loaded = true; });

function renderClassField(last) {
  const select = $('id-class');
  const keep = select.value;
  select.innerHTML = '<option value="" disabled>Escolha sua turma</option>' +
    API.turmas.map(t => `<option value="${t.id}">${escapeHtml(t.nome)}</option>`).join('');
  const match = API.turmas.find(t => String(t.id) === keep) ||
    (last && (API.turmas.find(t => t.id === last.turmaId) || API.turmas.find(t => t.nome === last.turma)));
  select.value = match ? String(match.id) : '';
  select.disabled = API.loaded && !API.turmas.length;
  select.closest('.id-field').hidden = API.loaded && !API.on;
  $('id-class-hint').textContent = !API.loaded ? 'Carregando as turmas…'
    : API.on && !API.turmas.length ? 'Ainda não tem turma cadastrada. Peça ao professor para criar a sua.' : '';
}

let syncing = false;
async function syncResult() {
  await API.ready;
  const box = $('g-sync');
  if (!API.on || !S || !S.completed || !S.player) { box.hidden = true; return; }
  box.hidden = false;
  const setState = (text, error) => {
    $('g-sync-text').textContent = text;
    box.classList.toggle('is-error', Boolean(error));
    $('g-sync-retry').hidden = !error;
  };
  if (S.submitted) { setState('Resultado enviado. O ranking aparece quando o professor publicar.'); return; }
  if (syncing) return;
  syncing = true;
  setState('Enviando o resultado para o ranking…');
  try {
    const res = await fetch('/api/resultados', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jornadaId: S.jornadaId, nome: S.player.name, turmaId: S.player.turmaId || null, turmaTexto: S.player.turma || '',
        erros: S.errors, pulados: S.skipped, dicas: S.hint, tempoMs: Math.round(S.finalMs || 0), teste: Boolean(S.usedTest)
      })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.erro || 'Falha no envio.');
    S.submitted = true;
    save();
    setState('Resultado enviado. O ranking aparece quando o professor publicar.');
  } catch (e) {
    setState('Não deu pra enviar o resultado agora. Confere a internet e tenta de novo.', true);
  } finally {
    syncing = false;
  }
}
$('g-sync-retry').addEventListener('click', syncResult);

/* ---------------------------------------------------------------
   11. DIÁLOGOS
   --------------------------------------------------------------- */
const closeCallbacks = new Map();
function openDialog(dlg) { if (!dlg.open) dlg.showModal(); }
function closeDialog(dlg, after) {
  if (after) closeCallbacks.set(dlg, after);
  if (dlg.open) dlg.close(); else if (after) { closeCallbacks.delete(dlg); after(); }
}
document.querySelectorAll('dialog').forEach(dlg => {
  dlg.addEventListener('click', event => {
    if (event.target === dlg || event.target.closest('[data-close]')) closeDialog(dlg);
  });
  dlg.addEventListener('close', () => {
    const after = closeCallbacks.get(dlg);
    closeCallbacks.delete(dlg);
    if (after) after();
    else if (dlg.id === 'dlg-reward') show(S.completed ? 'fim' : 'mapa');
  });
});

/* ---------------------------------------------------------------
   12. MODO DE TESTE (#teste): o botão "Avançar" resolve a etapa atual
   --------------------------------------------------------------- */
const TEST = location.hash === '#teste';
$('test-fab').addEventListener('click', () => {
  const n = S.current;
  if (finished(n)) return;
  S.usedTest = true;
  const stage = currentStage();
  if (stage.type === 'build') {
    const expected = stage.template.filter(t => typeof t === 'object').map(t => t.slot);
    const free = stage.chips.map((_, i) => i);
    ui.fills = expected.map(v => free.splice(free.findIndex(i => stage.chips[i] === v), 1)[0]);
  } else {
    const input = [...document.querySelectorAll('#m-options input')].find(el => Number(el.value) === round2(stage.correct));
    input.checked = true;
  }
  $('m-form').requestSubmit();
});

/* ---------------------------------------------------------------
   INICIALIZAÇÃO
   --------------------------------------------------------------- */
S = loadState();
show('inicio');
