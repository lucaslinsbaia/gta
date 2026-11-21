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
   Regra de conteúdo: nenhuma resposta pode ser negativa, e as imagens
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

/**
 * Resposta digitada: só inteiro ou decimal com até duas casas (vírgula ou
 * ponto). Sem sinal de menos: nenhuma resposta do jogo é negativa.
 * Devolve NaN fora desse formato.
 */
function parseDecimal(raw) {
  let text = String(raw).trim().replace(/\s/g, '');
  // "1.300" ou "1.300,5": ponto como separador de milhar
  if (/^\d{1,3}(\.\d{3})+(,\d{1,2})?$/.test(text)) text = text.replace(/\./g, '');
  text = text.replace(',', '.');
  return /^\d+(\.\d{1,2})?$/.test(text) ? Number(text) : NaN;
}
const matches = (value, answers) => answers.some(a => Math.abs(value - a) <= 0.0101);

function newJourneyId() {
  if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
  return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 12);
}

/* ---------------------------------------------------------------
   2. MISSÕES
   Cada missão tem: gen() sorteia os valores da jornada; stages(d)
   devolve as etapas A e B (dados, pergunta, unidade, respostas);
   solution(d) mostra a resolução quando a missão é pulada.
   --------------------------------------------------------------- */
const MISSION = {
  1: {
    title: 'Obra na Laje', area: 'Geometria', topic: 'Áreas e volumes (cilindro)',
    brief: 'Chat, olha essa obra! A galera vai instalar uma caixa d\'água cilíndrica na laje e precisa saber quanto cabe nela antes de ligar a bomba. Bora medir?',
    hint: 'A base do cilindro é um círculo: área = π · r². Depois, volume = área da base × altura. Pra passar de m³ pra litros, multiplica por 1.000. Salva essa dica!',
    alt: 'Laje em obra ao pôr do sol, com uma caixa d\'água cilíndrica azul no centro, andaime, tijolos e baldes.',
    gen() {
      const r = pick([0.5, 0.6, 0.8, 1]), h = pick([1, 1.2, 1.5, 2]);
      const A = round2(3.14 * r * r);
      return { r, h, A, B: round2(A * h * 1000), Bexato: round2(3.14 * r * r * h * 1000) };
    },
    stages: d => [
      { data: [['Raio da base', `${fmt(d.r)} m`], ['Altura da caixa', `${fmt(d.h)} m`], ['Use π', '3,14']],
        question: 'Qual é a área da base da caixa? Arredonde para duas casas decimais.', unit: 'm²', answers: [d.A] },
      { data: [['Área da base (etapa A)', `${fmt(d.A)} m²`], ['Altura da caixa', `${fmt(d.h)} m`], ['Conversão', '1 m³ = 1.000 L']],
        question: 'Quantos litros cabem na caixa d\'água?', unit: 'litros', answers: [d.B, d.Bexato] }
    ],
    solution: d => [
      `Área da base: 3,14 · ${fmt(d.r)}² = ${fmt(d.A)} m².`,
      `Volume: ${fmt(d.A)} · ${fmt(d.h)} = ${fmt(round2(d.A * d.h))} m³, ou seja, ${fmtBig(d.B)} litros.`
    ]
  },
  2: {
    title: 'Rolê no Mapa', area: 'Geometria', topic: 'Geometria analítica (ponto médio e distância)',
    brief: 'Chat, hoje o rolê é de skate! A pista nova fica num ponto do mapa e a sorveteria em outro. Vamos marcar o encontro no meio do caminho e descobrir a distância.',
    hint: 'Ponto médio: faz a média das coordenadas, x = (x₁ + x₂) ÷ 2. Distância: d = √((x₂ − x₁)² + (y₂ − y₁)²). É Pitágoras disfarçado no plano. GG!',
    alt: 'Vista aérea da cidade ao entardecer, com ruas em grade e dois marcadores rosa em esquinas diferentes.',
    gen() {
      const [dx, dy] = pick([[3, 4], [4, 3], [6, 8], [8, 6], [5, 12], [12, 5], [9, 12]]);
      const x1 = randInt(0, 20 - dx), y1 = randInt(0, 20 - dy);
      const flip = Math.random() < 0.5;
      const P = [x1, flip ? y1 + dy : y1], Q = [x1 + dx, flip ? y1 : y1 + dy];
      return { P, Q, mx: round2((P[0] + Q[0]) / 2), dist: Math.hypot(dx, dy) };
    },
    stages: d => [
      { data: [['Pista de skate', `(${d.P[0]}, ${d.P[1]})`], ['Sorveteria', `(${d.Q[0]}, ${d.Q[1]})`], ['Escala', '1 unidade = 1 quarteirão']],
        question: 'Qual é a coordenada x do ponto médio entre a pista e a sorveteria?', unit: '', answers: [d.mx] },
      { data: [['Pista de skate', `(${d.P[0]}, ${d.P[1]})`], ['Sorveteria', `(${d.Q[0]}, ${d.Q[1]})`], ['Escala', '1 unidade = 1 quarteirão']],
        question: 'Qual é a distância em linha reta entre a pista e a sorveteria?', unit: 'quarteirões', answers: [d.dist] }
    ],
    solution: d => [
      `Ponto médio: x = (${d.P[0]} + ${d.Q[0]}) ÷ 2 = ${fmt(d.mx)}.`,
      `Distância: √(${d.Q[0] - d.P[0]}² + ${Math.abs(d.Q[1] - d.P[1])}²) = ${d.dist} quarteirões.`
    ]
  },
  3: {
    title: 'Torre da Orla', area: 'Trigonometria', topic: 'Lei dos senos e lei dos cossenos',
    brief: 'Chat, subi na torre de observação da praia! Daqui dá pra ver a boia e dois veleiros. Bora descobrir umas distâncias com a lei dos senos e a dos cossenos.',
    hint: 'Lei dos senos: cada lado dividido pelo seno do ângulo oposto dá sempre o mesmo valor (sen 30° = 0,5 e sen 90° = 1). Lei dos cossenos: c² = a² + b² − 2·a·b·cos θ, com cos 60° = 0,5.',
    alt: 'Torre de observação pastel numa praia ao pôr do sol, olhando para o mar turquesa com dois veleiros distantes.',
    gen() {
      const [a, b, c] = pick([[3, 8, 7], [5, 8, 7], [7, 15, 13], [8, 15, 13], [5, 21, 19]]);
      return { lado30: pick([40, 60, 70, 90]), a: a * 100, b: b * 100, c: c * 100 };
    },
    stages: d => [
      { data: [['Triângulo', 'torre, veleiro e boia'], ['Ângulo de 30°', `lado oposto: ${d.lado30} m`], ['Ângulo de 90°', 'lado oposto: ?']],
        question: 'Quanto mede o lado oposto ao ângulo de 90°?', unit: 'm', answers: [d.lado30 * 2] },
      { data: [['Torre até o veleiro 1', `${fmtBig(d.a)} m`], ['Torre até o veleiro 2', `${fmtBig(d.b)} m`], ['Ângulo na torre', '60°']],
        question: 'Qual é a distância entre os dois veleiros?', unit: 'm', answers: [d.c] }
    ],
    solution: d => [
      `Lei dos senos: x ÷ sen 90° = ${d.lado30} ÷ sen 30°, então x = ${d.lado30} ÷ 0,5 = ${d.lado30 * 2} m.`,
      `Lei dos cossenos: d² = ${fmtBig(d.a)}² + ${fmtBig(d.b)}² − 2 · ${fmtBig(d.a)} · ${fmtBig(d.b)} · 0,5 = ${fmtBig(d.c * d.c)}, então d = ${fmtBig(d.c)} m.`
    ]
  },
  4: {
    title: 'Roda-Gigante', area: 'Trigonometria', topic: 'Ciclo trigonométrico e função seno',
    brief: 'Chat, olha o tamanho dessa roda-gigante! A altura de uma cadeira muda com o ângulo do giro, igualzinho a uma função seno. Partiu calcular?',
    hint: 'O seno vai de −1 a 1, então a altura máxima é quando sen θ = 1. Num ângulo qualquer, olha o quadrante: sen 30° = sen 150° = 0,5, sen 90° = 1, sen 210° = sen 330° = −0,5 e sen 270° = −1.',
    alt: 'Roda-gigante iluminada com luzes neon num píer ao pôr do sol, refletida na água.',
    gen() {
      const R = pick([8, 10, 12, 15]), theta = pick([30, 90, 150, 210, 270, 330]);
      const sin = { 30: 0.5, 90: 1, 150: 0.5, 210: -0.5, 270: -1, 330: -0.5 }[theta];
      return { R, theta, max: 2 * R + 1, h: round2(R + 1 + R * sin) };
    },
    stages: d => [
      { data: [['Raio da roda', `${d.R} m`], ['Centro da roda', `${d.R + 1} m acima do chão`], ['Altura da cadeira', `h(θ) = ${d.R + 1} + ${d.R} · sen θ`]],
        question: 'Qual é a altura máxima que uma cadeira alcança?', unit: 'm', answers: [d.max] },
      { data: [['Altura da cadeira', `h(θ) = ${d.R + 1} + ${d.R} · sen θ`], ['Ângulo do giro agora', `θ = ${d.theta}°`]],
        question: 'Qual é a altura da cadeira nesse ângulo?', unit: 'm', answers: [d.h] }
    ],
    solution: d => {
      const s = { 30: '0,5', 90: '1', 150: '0,5', 210: '−0,5', 270: '−1', 330: '−0,5' }[d.theta];
      return [
        `Altura máxima: sen θ = 1, então h = ${d.R + 1} + ${d.R} = ${d.max} m.`,
        `Em θ = ${d.theta}°: sen ${d.theta}° = ${s}, então h = ${d.R + 1} + ${d.R} · (${s}) = ${fmt(d.h)} m.`
      ];
    }
  },
  5: {
    title: 'Food Truck', area: 'Álgebra', topic: 'Função quadrática (vértice da parábola)',
    brief: 'Chat, o food truck da orla quer descobrir o preço do lanche que dá mais lucro. O lucro segue uma parábola, então a resposta tá no vértice!',
    hint: 'Numa parábola L(p) = a·p² + b·p + c, o vértice fica em p = −b ÷ (2a). Aqui a = −1, então é só dividir o coeficiente de p por 2. Depois, calcula L nesse preço.',
    alt: 'Food truck turquesa e rosa numa feira noturna à beira-mar, com varal de luzes e clientes.',
    gen() {
      const k = pick([16, 20, 24, 28]), c = randInt(10, k * k / 4 - 10);
      return { k, c, p: k / 2, L: k * k / 4 - c };
    },
    stages: d => [
      { data: [['Lucro por noite', `L(p) = −p² + ${d.k}p − ${d.c}`], ['p', 'preço do lanche, em reais'], ['L', 'lucro, em dezenas de reais']],
        question: 'Qual preço do lanche dá o lucro máximo?', unit: 'reais', answers: [d.p] },
      { data: [['Lucro por noite', `L(p) = −p² + ${d.k}p − ${d.c}`], ['Preço do lucro máximo', 'o da etapa A']],
        question: 'Qual é o lucro máximo, em dezenas de reais?', unit: 'dezenas', answers: [d.L] }
    ],
    solution: d => [
      `Vértice: p = −${d.k} ÷ (2 · (−1)) = ${d.p} reais.`,
      `Lucro máximo: L(${d.p}) = −${d.p}² + ${d.k} · ${d.p} − ${d.c} = ${d.L}.`
    ]
  },
  6: {
    title: 'Festa da Formatura', area: 'Álgebra', topic: 'Progressão aritmética (PA) e geométrica (PG)',
    brief: 'Chat, a formatura tá chegando! Cada fileira de cadeiras tem mais lugares que a anterior, e os convites se espalham em rodadas. Bora organizar essa festa?',
    hint: 'PA: aₙ = a₁ + (n − 1) · r. PG: aₙ = a₁ · qⁿ⁻¹. Na PA você soma a razão; na PG você multiplica.',
    alt: 'Salão de festa de formatura com palco, arco de balões, muitas fileiras de cadeiras e convites sobre a mesa.',
    gen() {
      const a1 = pick([8, 10, 12]), r = pick([2, 3, 4]), n = pick([6, 8, 10]);
      const g1 = pick([2, 3]), q = pick([2, 3]), m = pick([4, 5]);
      return { a1, r, n, an: a1 + (n - 1) * r, g1, q, m, gm: g1 * q ** (m - 1) };
    },
    stages: d => [
      { data: [['1ª fileira', `${d.a1} cadeiras`], ['Cada fileira seguinte', `+${d.r} cadeiras`]],
        question: `Quantas cadeiras tem a ${d.n}ª fileira?`, unit: 'cadeiras', answers: [d.an] },
      { data: [['1ª rodada', `${d.g1} convites`], ['Cada convidado repassa para', `${d.q} pessoas`]],
        question: `Quantos convites são enviados na ${d.m}ª rodada?`, unit: 'convites', answers: [d.gm] }
    ],
    solution: d => [
      `PA: a${d.n} = ${d.a1} + (${d.n} − 1) · ${d.r} = ${d.an} cadeiras.`,
      `PG: a${d.m} = ${d.g1} · ${d.q}^${d.m - 1} = ${d.gm} convites.`
    ]
  }
};

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
    v: 1, started: true, jornadaId: newJourneyId(), player: null,
    data: Object.fromEntries(MISSIONS.map(n => [n, MISSION[n].gen()])),
    stage: perMission(0), stageErrors: perMission(0),
    done: perMission(false), skipped: perMission(false), errors: perMission(0), hint: perMission(false),
    current: 1, activeMs: 0, completed: false, finalMs: 0, submitted: false, usedTest: false
  };
}
function loadState() {
  try {
    const data = JSON.parse(localStorage.getItem(STORE_KEY));
    return data && data.v === 1 && data.data ? data : null;
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

$('id-form').addEventListener('submit', event => {
  event.preventDefault();
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
    ? 'Fala, chat! Hoje a live é de missões pela cidade. Cada uma vale até 100 pontos. Começa pela Obra na Laje que eu vou junto!'
    : next ? `Mandou bem até aqui! Próxima parada: ${MISSION[next].title}. O chat tá torcendo.`
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
   --------------------------------------------------------------- */
const STAGE_NAMES = ['Etapa A', 'Etapa B'];

function renderMissao() {
  const n = S.current, M = MISSION[n], d = S.data[n];
  const stages = M.stages(d);
  const k = finished(n) ? 1 : S.stage[n];
  const stage = stages[k];
  $('m-scene').src = IMG.scene[n];
  $('m-scene').alt = M.alt;
  $('m-avatar').src = IMG.avatar;
  $('m-eyebrow').textContent = `Missão ${n} · ${M.area}`;
  $('m-title').textContent = M.title;
  $('m-brief').textContent = M.brief;
  $('m-steps').innerHTML = STAGE_NAMES.map((name, i) => {
    const cls = finished(n) || i < S.stage[n] ? 'is-done' : i === k ? 'is-current' : '';
    return `<li class="${cls}"${i === k && !finished(n) ? ' aria-current="step"' : ''}>${name}</li>`;
  }).join('');
  $('m-step-title').textContent = finished(n) ? 'Missão finalizada' : `${STAGE_NAMES[k]} · ${M.topic}`;
  $('m-data').innerHTML = stage.data.map(([label, value]) => `<li><span>${label}</span><strong>${value}</strong></li>`).join('');
  $('m-question').textContent = stage.question;
  $('m-unit').textContent = stage.unit;
  $('m-input').value = '';
  $('m-input').removeAttribute('aria-invalid');
  $('m-label').textContent = 'Sua resposta';
  setMsg('');
  const closed = finished(n);
  $('m-input').disabled = closed;
  $('m-confirm').disabled = closed;
  $('m-hint-text').textContent = S.hint[n] ? 'Ver a dica da Dani de novo' : 'Pedir dica à Dani (−20 pts)';
  $('m-hint-btn').hidden = closed && !S.hint[n];
  $('m-skip').hidden = closed || S.stageErrors[n] < SCORE.skipAfter;
  renderMissionScore();
  if (closed) {
    $('m-question').textContent = S.done[n] ? `Missão concluída com ${missionPoints(n)} pontos. As respostas eram:` : 'Missão pulada. A resolução:';
    $('m-data').innerHTML = M.solution(d).map(line => `<li><span>${escapeHtml(line)}</span></li>`).join('');
  }
}

function renderMissionScore() {
  const n = S.current;
  if (finished(n)) { $('m-score').textContent = ''; return; }
  const now = Math.max(SCORE.floor, SCORE.base - SCORE.error * S.errors[n] - (S.hint[n] ? SCORE.hint : 0));
  $('m-score').textContent = `Valendo agora: ${now} pts · tentativas incorretas: ${S.errors[n]}${S.hint[n] ? ' · dica usada' : ''}`;
}

function setMsg(text, ok) {
  $('m-msg').textContent = text;
  $('m-msg').className = `msg ${ok ? 'is-ok' : 'is-error'}`;
}

$('m-form').addEventListener('submit', event => {
  event.preventDefault();
  const n = S.current;
  if (finished(n)) return;
  const stage = MISSION[n].stages(S.data[n])[S.stage[n]];
  const value = parseDecimal($('m-input').value);
  if (Number.isNaN(value)) {
    $('m-input').setAttribute('aria-invalid', 'true');
    setMsg($('m-input').value.trim() ? 'Só números: inteiro ou com vírgula, até duas casas. Sem frações.' : 'Digita sua resposta primeiro.');
    $('m-input').focus();
    return;
  }
  if (matches(value, stage.answers)) {
    if (S.stage[n] === 0) {
      S.stage[n] = 1;
      S.stageErrors[n] = 0;
      save();
      renderMissao();
      setMsg('Acertou! Etapa B liberada. O chat foi à loucura.', true);
      $('live').textContent = 'Resposta certa. Etapa B liberada.';
      $('m-input').focus();
    } else {
      completeMission(n, false);
    }
    return;
  }
  S.errors[n] += 1;
  S.stageErrors[n] += 1;
  save();
  $('m-input').setAttribute('aria-invalid', 'true');
  setMsg(S.stageErrors[n] >= SCORE.skipAfter
    ? 'Ainda não. Se travar, agora dá pra pular a missão (ela vale 0).'
    : pick(['Ainda não. Confere a conta e tenta de novo.', 'Quase! Revisa os dados e manda de novo.', 'Não foi dessa vez. Respira e confere cada passo.']));
  $('m-form').classList.remove('shake'); void $('m-form').offsetWidth; $('m-form').classList.add('shake');
  $('m-skip').hidden = S.stageErrors[n] < SCORE.skipAfter;
  renderMissionScore();
  renderScore();
  $('m-input').select();
});
$('m-input').addEventListener('input', () => { $('m-input').removeAttribute('aria-invalid'); });

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

/* Pular: liberado após 10 tentativas incorretas na mesma etapa */
$('m-skip').addEventListener('click', () => openDialog($('dlg-skip')));
$('skip-confirm').addEventListener('click', () => closeDialog($('dlg-skip'), () => completeMission(S.current, true)));

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
    : S.errors[n] === 0 && !S.hint[n] ? 'Chat, de primeira e sem dica! Pontuação cheia.' : 'Chat, missão no bolso! Bora pra próxima.';
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
  $('m-input').value = fmt(MISSION[n].stages(S.data[n])[S.stage[n]].answers[0]);
  $('m-form').requestSubmit();
});

/* ---------------------------------------------------------------
   INICIALIZAÇÃO
   --------------------------------------------------------------- */
S = loadState();
show('inicio');
