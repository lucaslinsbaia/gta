/* =====================================================================
   O ENIGMA DE PITÁGORAS — lógica do jogo (JavaScript puro)
   ---------------------------------------------------------------------
   Organização:
     1. Imagens e utilitários
     2. Triângulos da jornada (sorteados a cada nova jornada)
     3. Conteúdo dos capítulos (pistas, mecanismos, mensagens)
     4. Estado e salvamento
     5. Relógio de tempo ativo
     6. Navegação entre telas
     7. Início · 8. Capítulos · 9. Exploração · 10. Enigma · 11. Conclusão
     12. Diálogos e atalhos · 13. Modo de teste · 14. Inicialização
   ===================================================================== */
'use strict';

/* ---------------------------------------------------------------
   1. IMAGENS E UTILITÁRIOS
   As imagens vêm do arquivo do Figma e são embutidas na montagem.
   --------------------------------------------------------------- */
const IMG = {
  inicio: '__IMG_inicio__', conclusao: '__IMG_conclusao__',
  atrio: '__IMG_atrio__', galeria: '__IMG_galeria__', santuario: '__IMG_santuario__',
  placa1: '__IMG_placa1__', placa2: '__IMG_placa2__', placa3: '__IMG_placa3__',
  cap1: '__IMG_cap1__', cap2: '__IMG_cap2__', cap3: '__IMG_cap3__'
};

const $ = id => document.getElementById(id);
const pick = list => list[Math.floor(Math.random() * list.length)];
const fmt = n => n.toLocaleString('pt-BR', { maximumFractionDigits: 2, useGrouping: false });
const icon = (name, cls = 'icon') => `<svg class="${cls}" aria-hidden="true"><use href="#i-${name}"/></svg>`;
const ROMAN = { 1: 'I', 2: 'II', 3: 'III' };
const pad2 = n => String(n).padStart(2, '0');

function shuffle(list) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Resposta digitada pelo aluno: só inteiro ou decimal com até duas casas
 * (vírgula ou ponto), como 5, 0,6 ou 0,47. Frações não são aceitas.
 * Devolve NaN fora desse formato.
 */
function parseDecimal(raw) {
  const text = String(raw).trim().replace(',', '.');
  return /^\d+(\.\d{1,2})?$/.test(text) ? Number(text) : NaN;
}

/**
 * Lê um valor interno (como as frações do mecanismo II): inteiro, decimal ou fração "3/5".
 * Devolve NaN quando o texto não é um número.
 */
function parseAnswer(raw) {
  const text = String(raw).trim().replace(/,/g, '.');
  if (/^-?\d+(\.\d+)?$/.test(text)) return Number(text);
  const frac = text.match(/^(-?\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)$/);
  if (frac && Number(frac[2]) !== 0) return Number(frac[1]) / Number(frac[2]);
  return NaN;
}

/** Tempo em mm:ss (ou h:mm:ss a partir de uma hora). */
function formatTime(ms) {
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600), m = Math.floor((total % 3600) / 60), s = total % 60;
  return h ? `${h}:${pad2(m)}:${pad2(s)}` : `${pad2(m)}:${pad2(s)}`;
}

/* ---------------------------------------------------------------
   2. TRIÂNGULOS DA JORNADA
   Ternas pitagóricas (lados inteiros) com hipotenusa até 30. Cada
   capítulo recebe um triângulo diferente, sorteado no início da jornada.
   --------------------------------------------------------------- */
const TRIPLES = [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25], [20, 21, 29]];
const ALL_TRIANGLES = TRIPLES.flatMap(([a, b, c]) => {
  const list = [];
  for (let k = 1; c * k <= 30; k++) list.push([a * k, b * k, c * k]);
  return list;
});

function newTriangles() {
  const pool = shuffle(ALL_TRIANGLES);
  const [t1, t2, t3] = [pool[0], pool[1], pool[2]];
  const flip = ([x, y, z]) => (Math.random() < 0.5 ? [x, y, z] : [y, x, z]);
  const [a1, b1, c1] = flip(t1);
  const [o2, a2, h2] = flip(t2);
  const [o3, a3, h3] = flip(t3);
  return {
    1: { a: a1, b: b1, c: c1 },
    // As seis frações do mecanismo II, embaralhadas uma vez por jornada
    2: { o: o2, a: a2, h: h2, options: shuffle([`${o2}/${h2}`, `${a2}/${h2}`, `${o2}/${a2}`, `${a2}/${o2}`, `${h2}/${o2}`, `${h2}/${a2}`]) },
    3: { o: o3, a: a3, h: h3 }
  };
}

/* ---------------------------------------------------------------
   3. CONTEÚDO DOS CAPÍTULOS
   Os textos usam as medidas da jornada. x e y são posições (%) dos
   pontos de investigação sobre a imagem; "left" põe o rótulo à esquerda.
   --------------------------------------------------------------- */
const SEALS = {
  1: { short: 'Triângulo', name: 'Selo do Triângulo', icon: 'triangle' },
  2: { short: 'Razões', name: 'Selo das Razões', icon: 'compass' },
  3: { short: 'Harmonia', name: 'Selo da Harmonia', icon: 'lyre' }
};

function chapter(n) {
  const T = S.tri[n];
  if (n === 1) return {
    title: 'O Átrio dos Triângulos', tag: 'Pátio das medidas',
    tagline: 'A medida dos catetos revela o caminho.',
    card: IMG.cap1, scene: IMG.atrio,
    sceneAlt: 'Átrio de colunas com claraboia. Ao fundo, um mural do teorema entre lamparinas; no chão, um mosaico, uma corda de agrimensor e uma tábua de cera; nos bancos, um pergaminho e um compasso.',
    panelTitle: 'A medida oculta',
    panelIntro: 'Investigue os objetos do átrio e examine o dispositivo do mural para obter o Selo do Triângulo.',
    examine: 'Examinar dispositivo',
    main: { x: 47.4, y: 41 },   // ponto principal, no mural do fundo: abre o mecanismo
    clues: [
      { id: 'canto', name: 'Pergaminho do agrimensor', x: 17.9, y: 91, 
        text: 'Um triângulo esboçado às pressas: um quadradinho marca o canto reto e um “?” marca o lado maior.',
        extra: 'Os catetos se encontram no canto reto. O lado com “?” é a hipotenusa.' },
      { id: 'medidas', name: 'Corda de nós', x: 39.7, y: 83,
        text: `Uma corda de agrimensor, esticada em triângulo. As marcas nos braços do canto reto indicam ${T.a} e ${T.b}.`,
        extra: `Os catetos do triângulo do dispositivo medem ${T.a} e ${T.b} unidades.` },
      { id: 'relacao', name: 'Retângulos', x: 50.3, y: 72.6,
        text: 'Entre os retângulos do mosaico, uma inscrição gasta: “a² + b² = c²”.',
        extra: 'A soma dos quadrados dos catetos é igual ao quadrado da hipotenusa.' },
      { id: 'tabua', name: 'Tábua de cera', x: 24, y: 74, left: true,
        text: 'Alguém começou a conta na cera: “a² = …”, “b² = …”, “a² + b² = ?”. E parou aí.',
        extra: 'Depois de somar os quadrados, ainda falta um passo: a raiz quadrada.' },
      { id: 'oposta', name: 'Compasso e régua', x: 77.5, y: 91, left: true,
        text: 'Na régua de bronze, uma frase gravada: “O maior lado olha para o canto reto.”',
        extra: 'A hipotenusa é o lado oposto ao ângulo reto e o maior lado do triângulo.' }
    ],
    mech: {
      eyebrow: 'Mecanismo 01 · O primeiro selo', title: 'A Placa dos Catetos',
      instr: 'Complete a medida da hipotenusa para liberar o mecanismo.',
      tag: 'Artefato I · Bronze / calcário', img: IMG.placa1,
      reg: 'Diário · Registro 02', diaryTitle: 'A medida oculta',
      quote: '“O maior lado guarda o primeiro selo.”',
      confirm: 'Confirmar medida',
      hint: 'Some os quadrados dos catetos. Depois, encontre a raiz quadrada do resultado.',
      errorTitle: 'A placa não se moveu',
      error: 'Ainda não. Confira os quadrados dos catetos e lembre-se de encontrar o comprimento, não seu quadrado.',
      success: { title: 'Selo do Triângulo recuperado', text: 'A Galeria das Razões está aberta.', action: 'Seguir para a Galeria das Razões' }
    }
  };
  if (n === 2) return {
    title: 'A Galeria das Razões', tag: 'Ala das proporções',
    tagline: 'Nem toda medida é direta.',
    card: IMG.cap2, scene: IMG.galeria,
    sceneAlt: 'Galeria abobadada iluminada por uma claraboia, com uma estela gravada à esquerda, um busto e um mecanismo de bronze à direita.',
    panelTitle: 'A proporção revela',
    panelIntro: 'Relacione lados e ângulos para obter o Selo das Razões.',
    examine: 'Examinar o mecanismo',
    main: { x: 70, y: 74 },
    clues: [
      { id: 'estela', name: 'Triângulo de referência', x: 12, y: 50,
        text: 'Na estela, θ marca o ângulo de referência.',
        extra: 'O marcador de 90° fica no encontro dos catetos, não em θ.' },
      { id: 'busto', name: 'Busto do mestre', x: 88, y: 50, left: true,
        text: `“O lado que encara θ mede ${T.o}.”`,
        extra: `Cateto oposto a θ: ${T.o} unidades.` },
      { id: 'portico', name: 'Pórtico ao fundo', x: 51, y: 52,
        text: `“O lado que toca θ, sem ser o maior, mede ${T.a}.”`,
        extra: `Cateto adjacente a θ: ${T.a} unidades.` },
      { id: 'luz', name: 'Raio da claraboia', x: 34, y: 12,
        text: `“A luz percorre o lado maior: ${T.h}.”`,
        extra: `Hipotenusa: ${T.h} unidades.` },
      { id: 'razoes', name: 'Inscrição das razões', x: 12, y: 72,
        text: '“Cada razão nasce de dois lados e de um mesmo olhar.”',
        extra: 'seno = oposto / hipotenusa\ncosseno = adjacente / hipotenusa\ntangente = oposto / adjacente' }
    ],
    mech: {
      eyebrow: 'Mecanismo 02 · O selo das razões', title: 'O Mecanismo das Razões',
      instr: 'Selecione uma razão e escolha a fração correspondente.',
      tag: 'Artefato II · Bronze / calcário', img: IMG.placa2,
      reg: 'Diário · Registro 03', diaryTitle: 'O ângulo é a chave',
      quote: '“Cada razão nasce de dois lados e de um mesmo olhar.”',
      confirm: 'Confirmar razões',
      hint: 'Marque o lado oposto a θ e identifique a hipotenusa. Cada razão usa um par específico de lados.',
      errorTitle: 'O mecanismo travou',
      error: 'Revise os lados em relação a θ. Oposto e adjacente dependem do ângulo escolhido.',
      success: { title: 'Selo das Razões recuperado', text: 'O Santuário de Pitágoras está aberto.', action: 'Seguir para o Santuário' }
    }
  };
  return {
    title: 'O Santuário de Pitágoras', tag: 'Câmara interior',
    tagline: 'A luz revela seno, cosseno e tangente.',
    card: IMG.cap3, scene: IMG.santuario,
    sceneAlt: 'Santuário de colunas jônicas com luz entrando pelo teto, uma porta de bronze ao fundo, uma estela à esquerda e um círculo de bronze sobre um altar.',
    panelTitle: 'O último selo',
    panelIntro: 'Decifre o Círculo de Pitágoras para obter o Selo da Harmonia e abrir a porta do santuário.',
    examine: 'Examinar o círculo',
    main: { x: 50, y: 74 },
    clues: [
      { id: 'versos', name: 'Inscrição trigonométrica', x: 11, y: 56,
        text: '“Primeiro, o teorema revela o lado oculto. Depois, o seno. Em seguida, o cosseno. A tangente encerra o ciclo.”',
        extra: 'A ordem das quatro posições do círculo.' },
      { id: 'porta', name: 'Porta dos três selos', x: 50, y: 44,
        text: 'Três encaixes circulares esperam os selos do Triângulo, das Razões e da Harmonia.',
        extra: 'A porta só se abre com os três selos reunidos.' },
      { id: 'disco', name: 'Gravura do altar', x: 38, y: 92,
        text: `“O feixe mede ${T.h}; sua base no chão, ${T.a}.”`,
        extra: `A gravura repete o triângulo do círculo: a hipotenusa mede ${T.h} e o cateto adjacente a θ mede ${T.a}. O cateto oposto foi apagado.` },
      { id: 'caco', name: 'Caco de ânfora', x: 87, y: 84, left: true,
        text: '“Para achar um cateto, subtraia os quadrados.”',
        extra: 'Com a hipotenusa e um cateto: cateto² = hipotenusa² − outro cateto².' }
    ],
    mech: {
      eyebrow: 'Mecanismo 03 · O último selo', title: 'O Círculo de Pitágoras',
      instr: 'Preencha as quatro posições na ordem revelada pela inscrição. Use números inteiros ou decimais com até duas casas.',
      tag: 'Artefato III · Bronze / calcário', img: IMG.placa3,
      reg: 'Diário · Registro 07', diaryTitle: 'A ordem das razões',
      quote: '“Primeiro, o teorema revela o lado oculto.\nDepois, o seno.\nEm seguida, o cosseno.\nA tangente encerra o ciclo.”',
      confirm: 'Girar o círculo',
      hint: 'Comece pelo teorema: o lado oculto ao quadrado é a hipotenusa² menos o cateto adjacente². Depois, monte cada razão com os lados em relação a θ e divida: escreva o resultado com até duas casas decimais (2 ÷ 3 ≈ 0,67).',
      errorTitle: 'O círculo não girou',
      error: 'Ainda não. Confira o lado oculto pelo teorema e, depois, os pares de lados de cada razão em relação a θ.',
      success: { title: 'Selo da Harmonia recuperado', text: 'Os três selos brilham juntos, e a porta do santuário se abre.', action: 'Atravessar a porta' }
    }
  };
}

/* ---------------------------------------------------------------
   4. ESTADO E SALVAMENTO
   Tudo o que a jornada precisa para ser retomada fica em S e é salvo
   no navegador. As tentativas incorretas são registradas por capítulo
   (para um ranking futuro), mas só aparecem na conclusão.
   --------------------------------------------------------------- */
const STORE_KEY = 'enigma-pitagoras-v1';
let S = null;

function newJourneyId() {
  if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
  return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 12);
}

function freshState() {
  return {
    v: 1,
    started: true,
    completed: false,
    startedAt: Date.now(),
    tri: newTriangles(),
    done: { 1: false, 2: false, 3: false },
    solvedAtMs: { 1: null, 2: null, 3: null },
    clues: { 1: [], 2: [], 3: [] },
    selected: { 1: null, 2: null, 3: null },
    answers: { 1: { c: '' }, 2: { sen: '', cos: '', tg: '' }, 3: { lado: '', sen: '', cos: '', tg: '' } },
    checked: { lado: false, sen: false, cos: false, tg: false },   // posições do círculo já conferidas e certas
    hints: { 1: false, 2: false, 3: false },
    errors: { 1: 0, 2: 0, 3: 0 },
    skipped: { 1: false, 2: false, 3: false },   // capítulos pulados valem 0 na nota
    mistakes: { 1: {}, 2: {}, 3: {} },            // tipos de engano, para o feedback final
    result: null,                                  // nota calculada na conclusão
    jornadaId: newJourneyId(),                     // identifica a jornada no ranking (envio único)
    submitted: false,                              // resultado já gravado no servidor
    usedTest: false,                               // o modo de teste foi usado nesta jornada
    activeMs: 0,
    finalMs: null,
    last: { screen: 'exploracao', ch: 1 }
  };
}

function loadState() {
  try {
    const data = JSON.parse(localStorage.getItem(STORE_KEY));
    return data && data.v === 1 && data.tri ? data : null;
  } catch (e) {
    return null;
  }
}

let saveFailed = false;
/** Salva a jornada. Em falha, não mostra "Progresso salvo": oferece nova tentativa. */
function save({ quiet = false } = {}) {
  if (!S) return;
  if (!quiet) renderSaveState('saving');
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(S));
    saveFailed = false;
    if (!quiet) setTimeout(() => renderSaveState('saved'), 350);
  } catch (e) {
    saveFailed = true;
    renderSaveState('error');
  }
}

function renderSaveState(stateName) {
  const el = $('save-state');
  if (!el) return;
  el.classList.toggle('is-error', stateName === 'error' || saveFailed);
  if (stateName === 'error' || saveFailed) {
    el.innerHTML = 'Não foi possível salvar <button type="button" id="save-retry">Tentar de novo</button>';
    $('save-retry').addEventListener('click', () => save());
  } else {
    el.textContent = stateName === 'saving' ? 'Salvando…' : 'Progresso salvo';
  }
}

const sealsCount = () => [1, 2, 3].filter(n => S.done[n]).length;
const hintsUsed = () => [1, 2, 3].filter(n => S.hints[n]).length;
const errorsTotal = () => S.errors[1] + S.errors[2] + S.errors[3];

/* ---------------------------------------------------------------
   5. RELÓGIO DE TEMPO ATIVO
   Conta só durante a jornada (capítulos, exploração e enigma). Para na
   pausa, quando a aba fica oculta e depois da conclusão. Não é contagem
   regressiva: não há derrota por tempo.
   --------------------------------------------------------------- */
const GAME_SCREENS = ['capitulos', 'exploracao', 'enigma'];
let paused = false;
let lastTick = performance.now();
let ticksSinceSave = 0;

const isCounting = () => Boolean(S && S.started && !S.completed && GAME_SCREENS.includes(screen) && !paused && !document.hidden);

function tick() {
  const now = performance.now();
  if (isCounting()) {
    S.activeMs += now - lastTick;
    if (++ticksSinceSave >= 15) { ticksSinceSave = 0; save({ quiet: true }); }
  }
  lastTick = now;
  renderTimer();
}

function renderTimer() {
  if (!S) return;
  $('timer-text').textContent = formatTime(S.completed ? S.finalMs : S.activeMs);
  $('nav-timer').classList.toggle('is-paused', !isCounting());
}

document.addEventListener('visibilitychange', () => { tick(); if (document.hidden) save({ quiet: true }); });
window.addEventListener('pagehide', () => { tick(); save({ quiet: true }); });

/* ---------------------------------------------------------------
   6. NAVEGAÇÃO ENTRE TELAS
   --------------------------------------------------------------- */
let screen = 'inicio';
let current = 1;     // capítulo aberto na exploração ou no enigma

function show(name, ch = current) {
  tick();
  screen = name;
  current = ch;
  document.querySelectorAll('.screen').forEach(el => { el.hidden = el.id !== `s-${name}`; });
  document.body.classList.toggle('is-enigma', name === 'enigma');   // no celular, o Confirmar vira rodapé fixo

  // Fundo cinematográfico só no início e na conclusão
  const bg = $('scene-bg');
  const bgImage = name === 'inicio' || name === 'identificacao' ? IMG.inicio : name === 'conclusao' ? IMG.conclusao : null;
  if (bgImage) bg.style.backgroundImage = `url("${bgImage}")`;
  bg.classList.toggle('is-on', Boolean(bgImage));

  const inGame = GAME_SCREENS.includes(name);
  $('nav-timer').hidden = !(inGame && S);
  $('nav-diary').hidden = !inGame;
  $('nav-pause').hidden = !inGame;
  $('nav-sub').textContent = {
    inicio: 'Uma odisseia de escape',
    identificacao: 'Registro da expedição',
    capitulos: 'Registro da expedição',
    conclusao: 'Expedição concluída'
  }[name] || `Capítulo ${ROMAN[ch]} · ${chapter(ch).title}`;

  if (name !== 'exploracao') setFab(null);
  renderFooter(name);
  ({ inicio: renderInicio, identificacao: renderIdentificacao, capitulos: renderCapitulos, exploracao: renderExploracao, enigma: renderEnigma, conclusao: renderConclusao })[name]();

  if (S && (name === 'exploracao' || name === 'enigma')) { S.last = { screen: name, ch }; save(); }
  renderTimer();
  updateTestFab();
  window.scrollTo({ top: 0 });
  const heading = document.querySelector(`#s-${name} h1, #s-${name} h2`);
  if (heading) { heading.setAttribute('tabindex', '-1'); heading.focus({ preventScroll: true }); }
}

function renderFooter(name) {
  const saveState = '<span class="save-state" id="save-state">Progresso salvo</span>';
  const shortcuts = `<button type="button" data-open="diary">D · Diário</button>
    <button type="button" data-open="inventory">I · Inventário</button>
    <button type="button" data-open="pause">Esc · Pausar</button>`;
  const [left, right] = {
    inicio: ['<span class="foot__caps">Expedição a Crotona / Itália, 1924</span>', 'O conhecimento é a única saída.'],
    identificacao: ['<span class="foot__caps">Expedição a Crotona / Itália, 1924</span>', 'Um jogador · Sem limite de tentativas'],
    capitulos: [saveState, 'Triângulo · Razões · Harmonia'],
    exploracao: [`${saveState}<span class="foot__caps">· Um jogador</span>`, shortcuts],
    enigma: [saveState, `<span>Sem limite de tentativas · Erros não removem selos ou pistas.</span>${shortcuts}`],
    conclusao: ['<span class="foot__caps">Fim da expedição · O Enigma de Pitágoras</span>', 'A jornada termina. A descoberta permanece.']
  }[name];
  $('foot-left').innerHTML = left;
  $('foot-right').innerHTML = right;
  if (saveFailed) renderSaveState('error');
}

/* ---------------------------------------------------------------
   7. INÍCIO
   --------------------------------------------------------------- */
function renderInicio() {
  const has = Boolean(S && S.started);
  $('btn-continue').hidden = !has;
  if (!has) { $('resume-info').textContent = ''; return; }
  if (S.completed) {
    $('btn-continue-text').textContent = 'Ver resultado da expedição';
    $('resume-info').textContent = `Expedição concluída · ${formatTime(S.finalMs)}`;
  } else {
    const ch = S.last.ch;
    $('btn-continue-text').textContent = 'Continuar expedição';
    $('resume-info').textContent = `${S.player ? `${S.player.name} · ` : ''}Capítulo ${ROMAN[ch]} · ${chapter(ch).title} · ${formatTime(S.activeMs)}`;
  }
}

/** Começa a jornada já com o jogador identificado. */
function startNewJourney(player) {
  S = freshState();
  S.player = player;
  paused = false;
  save();
  show('capitulos', 1);
}

$('btn-start').addEventListener('click', () => {
  if (S && S.started && !S.completed) {
    $('new-text').textContent = `Você tem uma expedição em andamento: ${sealsCount()} de 3 selos e ${formatTime(S.activeMs)} de jornada. Começar de novo substitui esse progresso, e os triângulos serão redesenhados.`;
    openDialog($('dlg-new'));
  } else {
    show('identificacao');
  }
});
// O progresso só é substituído quando o jogador se identifica e começa
$('new-confirm').addEventListener('click', () => closeDialog($('dlg-new'), () => show('identificacao')));

/* ---------------------------------------------------------------
   IDENTIFICAÇÃO
   Nome (ou apelido) obrigatório e turma opcional. Ficam salvos com a
   jornada (para o ranking futuro) e são lembrados para a próxima vez.
   --------------------------------------------------------------- */
const PLAYER_KEY = 'enigma-pitagoras-jogador';

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
  setTimeout(() => $('id-name').focus(), 0);
}

$('id-form').addEventListener('submit', event => {
  event.preventDefault();
  // Espera a lista de turmas chegar antes de validar
  if (!API.loaded) { API.ready.then(() => $('id-form').requestSubmit()); return; }
  const name = $('id-name').value.trim().replace(/\s+/g, ' ');
  const select = $('id-class');
  const turmaId = select.value ? Number(select.value) : null;
  const turma = turmaId ? select.options[select.selectedIndex].text : '';
  const nameMsg = nameProblem(name);
  // Com servidor, a turma é obrigatória e só vale uma turma criada na gestão
  const classMsg = classRequired() && !turmaId
    ? (API.turmas.length ? 'Selecione sua turma para começar.' : 'Ainda não há turmas cadastradas. Peça ao professor para criar a sua turma.')
    : '';
  setFieldMessage($('id-name'), $('id-name-msg'), nameMsg);
  setFieldMessage($('id-class'), $('id-class-msg'), classMsg);
  if (nameMsg || classMsg) { (nameMsg ? $('id-name') : $('id-class')).focus(); return; }
  const player = { name, turma, turmaId };
  try { localStorage.setItem(PLAYER_KEY, JSON.stringify(player)); } catch (e) { /* segue sem lembrar */ }
  startNewJourney(player);
});
$('id-name').addEventListener('input', () => setFieldMessage($('id-name'), $('id-name-msg'), ''));
$('id-class').addEventListener('change', () => setFieldMessage($('id-class'), $('id-class-msg'), ''));
$('btn-continue').addEventListener('click', () => {
  if (S.completed) show('conclusao');
  else show(S.last.screen === 'enigma' ? 'enigma' : 'exploracao', S.last.ch);
});

/* ---------------------------------------------------------------
   8. CAPÍTULOS
   Estados: bloqueado, disponível, em andamento ou concluído.
   --------------------------------------------------------------- */
function chapterStatus(n) {
  if (S.done[n]) return 'done';
  if (n > 1 && !S.done[n - 1]) return 'locked';
  const answered = Object.values(S.answers[n]).some(v => v !== '');
  return S.clues[n].length || answered || S.hints[n] ? 'progress' : 'available';
}

function renderCapitulos() {
  const count = sealsCount();
  $('seal-count').textContent = `${count} / 3`;
  [...$('seal-bar').children].forEach((bar, i) => bar.classList.toggle('is-on', i < count));
  const who = S.player ? `Expedição de ${S.player.name}${S.player.turma ? ` · ${S.player.turma}` : ''}. ` : '';
  $('chap-lead').textContent = who + (S.completed
    ? 'Expedição concluída. Revisite os capítulos para rever o que você descobriu.'
    : 'Cada selo revela uma parte do teorema. Seu progresso está salvo.');

  $('chap-grid').innerHTML = [1, 2, 3].map(n => {
    const C = chapter(n), status = chapterStatus(n), seal = SEALS[n];
    const isCurrent = !S.completed && (status === 'available' || status === 'progress');
    const badge = {
      done: `${icon('check', 'icon icon--sm')} Concluído`,
      progress: `${icon('scan', 'icon icon--sm')} Expedição atual`,
      available: `${icon('scan', 'icon icon--sm')} Disponível`,
      locked: `${icon('lock', 'icon icon--sm')} Bloqueado`
    }[status];
    const meta = status === 'locked'
      ? `Resolva o capítulo ${ROMAN[n - 1]} para abrir`
      : `${{ done: 'Concluído', progress: 'Em andamento', available: 'Disponível' }[status]} · ${S.clues[n].length} de ${C.clues.length} pistas`;
    const action = { done: 'Revisitar', progress: 'Continuar', available: 'Iniciar', locked: 'Bloqueado' }[status];
    return `
      <article class="chap-card ${isCurrent ? 'is-current' : ''} ${status === 'locked' ? 'is-locked' : ''}">
        <div class="chap-card__media" style="background-image:url('${C.card}')">
          <span class="badge">${badge}</span>
          <span class="chap-card__num" aria-hidden="true">${ROMAN[n]}</span>
        </div>
        <div class="chap-card__body">
          <h3 class="title-md">${C.title}</h3>
          <p>${C.tagline}</p>
          <hr>
          <p class="chap-card__seal">${S.done[n] ? `${seal.name} ${S.skipped[n] ? 'liberado (capítulo pulado)' : 'recuperado'}` : `Encontre o ${seal.name}`}</p>
          <div class="chap-card__foot">
            <span>${meta}</span>
            <button type="button" class="${isCurrent ? 'btn btn--gold btn--sm' : 'link-btn'}" data-chapter="${n}" ${status === 'locked' ? 'disabled' : ''}
              aria-label="${action}: capítulo ${ROMAN[n]}, ${C.title}">${action} ${status === 'locked' ? '' : icon('arrow-right', 'icon icon--sm')}</button>
          </div>
        </div>
      </article>`;
  }).join('');
}

$('chap-grid').addEventListener('click', event => {
  const btn = event.target.closest('[data-chapter]');
  if (btn && !btn.disabled) show('exploracao', Number(btn.dataset.chapter));
});

/* ---------------------------------------------------------------
   9. EXPLORAÇÃO
   Investigar um ponto registra a pista no diário (uma vez só) e a
   mostra no painel. Não é obrigatório achar todas para tentar.
   --------------------------------------------------------------- */
let inventoryFocus = null;   // selo selecionado no inventário (em vez de uma pista)

function sealRow() {
  return [1, 2, 3].map(n => `
    <div class="seal ${S.done[n] ? 'is-on' : ''}">
      <span class="seal__box">${icon(SEALS[n].icon)}</span>
      <span>${SEALS[n].short}<span class="sr-only">${S.done[n] ? ': recuperado' : ': ainda não recuperado'}</span></span>
    </div>`).join('');
}

function renderExploracao() {
  const n = current, C = chapter(n);
  $('ex-title').textContent = C.title;
  $('ex-tag').textContent = C.tag;
  const img = $('ex-img');
  if (img.dataset.chapter !== String(n)) { img.src = C.scene; img.dataset.chapter = n; }
  img.alt = C.sceneAlt;
  $('ex-panel-title').textContent = C.panelTitle;
  $('ex-panel-intro').textContent = C.panelIntro;
  $('ex-seal-count').textContent = `${sealsCount()} / 3`;
  $('ex-seals').innerHTML = sealRow();
  // Capítulo concluído: o painel mostra o resultado direto, sem passar pelo mecanismo
  $('ex-panel-intro').textContent = S.done[n] ? `${SEALS[n].name} ${S.skipped[n] ? 'liberado: capítulo pulado.' : 'recuperado.'}` : C.panelIntro;
  // A ação principal fica no FAB: examinar o mecanismo ou, se concluído, seguir adiante
  setFab(S.done[n]
    ? (n < 3
      ? { label: `Próximo: ${chapter(n + 1).title}`, short: 'Próximo capítulo', run: () => show('exploracao', n + 1) }
      : { label: 'Ver a conclusão', short: 'Ver a conclusão', run: () => show('conclusao') })
    : { label: C.examine, short: C.examine, run: () => show('enigma', n) });
  $('ex-note').textContent = S.done[n]
    ? (S.skipped[n] ? 'Capítulo pulado · vale 0 na nota final' : `Resolvido aos ${formatTime(S.solvedAtMs[n] || 0)} de jornada · ${S.hints[n] ? 'com a dica do capítulo' : 'sem usar a dica'}`)
    : `Dicas utilizadas: ${hintsUsed()} · ${S.hints[n] ? 'a dica deste capítulo já foi usada' : '1 disponível neste capítulo'}`;
  renderHotspots();
  renderInventory();
  renderClue();
}

function renderHotspots() {
  const n = current, C = chapter(n);
  $('ex-hotspots').innerHTML = C.clues.map(clue => {
    const seen = S.clues[n].includes(clue.id);
    const selected = S.selected[n] === clue.id && !inventoryFocus;
    return `<button type="button" class="hotspot ${clue.left ? 'hotspot--left' : ''} ${seen ? 'is-seen' : ''} ${selected ? 'is-selected' : ''}"
      style="left:${clue.x}%;top:${clue.y}%" data-clue="${clue.id}"
      aria-label="${clue.name}: ${seen ? 'já examinado' : 'não examinado'}">
      <span class="hotspot__dot">${seen ? icon('check') : ''}</span>
      <span class="hotspot__label">${clue.name}</span>
    </button>`;
  }).join('') + mainHotspot(n, C);
}

/** Ponto principal da cena: o mecanismo que precisa ser resolvido para continuar. */
function mainHotspot(n, C) {
  const label = S.done[n] ? 'Rever o mecanismo resolvido' : C.examine;
  return `<button type="button" class="hotspot hotspot--main ${C.main.left ? 'hotspot--left' : ''} ${S.done[n] ? 'is-done' : ''}"
    style="left:${C.main.x}%;top:${C.main.y}%" data-main
    aria-label="${label}: ${S.done[n] ? 'mecanismo já resolvido' : 'resolva para continuar'}">
    <span class="hotspot__dot">${icon(S.done[n] ? 'check' : 'search')}</span>
    <span class="hotspot__label">${label}</span>
  </button>`;
}

function renderInventory() {
  const n = current, C = chapter(n);
  const seals = [1, 2, 3].filter(k => S.done[k]).map(k => `
    <button type="button" class="inv-item ${inventoryFocus === k ? 'is-selected' : ''}" data-seal="${k}">
      ${icon(SEALS[k].icon)}<span>${SEALS[k].name}<small>${S.skipped[k] ? 'Liberado' : 'Recuperado'}</small></span></button>`);
  const records = S.clues[n].map(id => {
    const clue = C.clues.find(c => c.id === id);
    const selected = S.selected[n] === id && !inventoryFocus;
    return `<button type="button" class="inv-item ${selected ? 'is-selected' : ''}" data-clue="${id}">
      ${icon(id === 'razoes' || id === 'versos' || id === 'relacao' ? 'scroll' : 'book')}
      <span>${clue.name}<small>${selected ? 'Registro selecionado' : 'Pista encontrada'}</small></span></button>`;
  });
  const items = [...seals, ...records];
  $('inv-count').textContent = items.length ? `${items.length} ${items.length === 1 ? 'artefato' : 'artefatos'} · selecione para examinar` : '';
  $('inv-items').innerHTML = items.length ? items.join('') : '<p class="inv-empty">Nada por aqui ainda. Investigue os pontos dourados da cena.</p>';
}

/** Resultado de um capítulo concluído: a placa resolvida, as respostas e a conta. */
function resultSummary(n) {
  const T = S.tri[n];
  if (n === 1) return {
    answers: [`c = ${T.c} unidades`],
    calc: `${T.a}² + ${T.b}² = ${T.a ** 2} + ${T.b ** 2} = ${T.c ** 2}\nc = √${T.c ** 2} = ${T.c}`
  };
  if (n === 2) return {
    answers: [`sen θ = ${T.o}/${T.h}`, `cos θ = ${T.a}/${T.h}`, `tg θ = ${T.o}/${T.a}`],
    calc: `Oposto ${T.o}, adjacente ${T.a} e hipotenusa ${T.h}, em relação a θ.`
  };
  return {
    answers: [`Lado oculto = ${T.o}`, `sen θ = ${T.o}/${T.h}`, `cos θ = ${T.a}/${T.h}`, `tg θ = ${T.o}/${T.a}`],
    calc: `${T.h}² − ${T.a}² = ${T.h ** 2} − ${T.a ** 2} = ${T.o ** 2}\nlado oculto = √${T.o ** 2} = ${T.o}`
  };
}

function renderResult() {
  const n = current, R = resultSummary(n);
  $('ex-clue').innerHTML = `
    <p class="clue__meta">Resultado do capítulo ${ROMAN[n]}</p>
    <div class="result-plate"><div class="plate is-solved">${plateSvg(n, true)}</div></div>
    <ul class="result-answers">${R.answers.map(a => `<li>${a}</li>`).join('')}</ul>
    <p class="clue__extra">${R.calc}</p>
    <button type="button" class="link-btn result-open" id="ex-open-mech">Abrir o mecanismo resolvido ${icon('arrow-right', 'icon icon--sm')}</button>`;
  $('ex-open-mech').addEventListener('click', () => show('enigma', n));
}

function renderClue() {
  const n = current, C = chapter(n), box = $('ex-clue');
  if (S.done[n]) { renderResult(); return; }
  if (inventoryFocus) {
    const seal = SEALS[inventoryFocus];
    box.innerHTML = `<p class="clue__meta">Inventário · selo recuperado</p>
      <p class="clue__text">${seal.name}</p>
      <p class="clue__extra">Recuperado no capítulo ${ROMAN[inventoryFocus]} · ${chapter(inventoryFocus).title}.</p>`;
    return;
  }
  const id = S.selected[n];
  if (!id) {
    box.innerHTML = `<p class="clue--empty">Nenhuma pista selecionada. Toque nos pontos dourados da cena para investigar. ${S.clues[n].length} de ${C.clues.length} pistas encontradas.</p>`;
    return;
  }
  const index = C.clues.findIndex(c => c.id === id), clue = C.clues[index];
  box.innerHTML = `<p class="clue__meta">Pista ${pad2(index + 1)} / ${pad2(C.clues.length)} · ${clue.name}</p>
    <p class="clue__text">${clue.text}</p>
    <p class="clue__extra">${clue.extra}</p>`;
}

/** Investiga um ponto: registra a pista (sem duplicar), a seleciona e a abre num modal. */
function investigate(id) {
  const n = current;
  inventoryFocus = null;
  const isNew = !S.clues[n].includes(id);
  if (isNew) S.clues[n].push(id);
  S.selected[n] = id;
  save();
  renderHotspots();
  renderInventory();
  renderClue();
  // O ponto foi redesenhado: o foco vai para o novo botão antes de abrir o
  // modal, para voltar a ele quando o modal fechar
  document.querySelector(`#ex-hotspots [data-clue="${id}"]`).focus();
  openClueModal({ clueId: id, isNew });
}

/**
 * Abre a pista (ou o selo do inventário) direto sobre a cena, sem o jogador
 * precisar procurar o texto no painel lateral. Ao fechar, o foco volta ao
 * ponto ou item que abriu o modal.
 */
function openClueModal({ clueId, sealId, isNew = false }) {
  const n = current, C = chapter(n);
  if (sealId) {
    $('clue-meta').textContent = 'Inventário · selo recuperado';
    $('clue-title').textContent = SEALS[sealId].name;
    $('clue-text').textContent = `Recuperado no capítulo ${ROMAN[sealId]}.`;
    $('clue-extra').textContent = chapter(sealId).title;
  } else {
    const index = C.clues.findIndex(c => c.id === clueId), clue = C.clues[index];
    $('clue-meta').textContent = `Pista ${pad2(index + 1)} / ${pad2(C.clues.length)} · ${S.clues[n].length} de ${C.clues.length} encontradas`;
    $('clue-title').textContent = clue.name;
    $('clue-text').textContent = clue.text;
    $('clue-extra').textContent = clue.extra;
  }
  $('clue-new').hidden = !isNew;
  $('clue-examine').innerHTML = `${S.done[n] ? 'Rever o mecanismo' : C.examine} ${icon('arrow-right')}`;
  openDialog($('dlg-clue'));
}

$('ex-hotspots').addEventListener('click', event => {
  if (event.target.closest('[data-main]')) { show('enigma', current); return; }
  const btn = event.target.closest('[data-clue]');
  if (!btn) return;
  investigate(btn.dataset.clue);
});
$('inv-items').addEventListener('click', event => {
  const btn = event.target.closest('.inv-item');
  if (!btn) return;
  const key = btn.dataset.seal ? `[data-seal="${btn.dataset.seal}"]` : `[data-clue="${btn.dataset.clue}"]`;
  if (btn.dataset.seal) inventoryFocus = Number(btn.dataset.seal);
  else { inventoryFocus = null; S.selected[current] = btn.dataset.clue; save(); }
  renderHotspots();
  renderInventory();
  renderClue();
  document.querySelector(`#inv-items ${key}`).focus();
  if (btn.dataset.seal) openClueModal({ sealId: Number(btn.dataset.seal) });
  else openClueModal({ clueId: btn.dataset.clue });
});
$('clue-examine').addEventListener('click', () => closeDialog($('dlg-clue'), () => show('enigma', current)));
/* --- FAB: ação principal da exploração --- */
let fabAction = null;
function setFab(config) {
  const fab = $('fab-main');
  fabAction = config ? config.run : null;
  fab.hidden = !config;
  document.body.classList.toggle('has-fab', Boolean(config));
  if (!config) return;
  $('fab-label').textContent = config.label;
  $('fab-short').textContent = config.short;
  fab.setAttribute('aria-label', config.label);
}
$('fab-main').addEventListener('click', () => { if (fabAction) fabAction(); });

/* ---------------------------------------------------------------
   10. ENIGMA
   Confirmar só fica habilitado com todos os campos preenchidos.
   Resposta incompleta orienta e não conta como tentativa.
   --------------------------------------------------------------- */
let activeSlot = 'sen';      // espaço selecionado no mecanismo II
let hintOpen = false;

/* --- Placas (SVG desenhado em escala com as medidas da jornada) --- */
function plateSvg(n, solved) {
  const T = S.tri[n];
  if (n === 3) return discSvg(T, solved);
  // Catetos: vertical à esquerda e horizontal embaixo; ângulo reto no canto inferior esquerdo
  const vert = n === 1 ? T.a : T.o, horiz = n === 1 ? T.b : T.a;
  const s = Math.min(290 / horiz, 185 / vert);
  const x0 = 150, y0 = 238, w = horiz * s, h = vert * s;
  const mx = x0 + w / 2, my = y0 - h / 2;
  const hypText = n === 1 ? (solved ? `c = ${T.c}` : 'c = ?') : String(T.h);
  const chipW = Math.max(54, hypText.length * 15 + 20);
  const theta = n === 2 ? (() => {
    const ang = Math.atan2(h, w), r = 42;
    // Ângulo pequeno: a cunha fica fina demais, e o θ vai para fora, à direita do vértice
    const label = ang < 0.45
      ? `x="${x0 + w + 12}" y="${y0 + 6}"`
      : `x="${x0 + w - r - 26}" y="${y0 - 10}"`;
    return `<path class="tri-mark" d="M ${x0 + w - r} ${y0} A ${r} ${r} 0 0 1 ${x0 + w - r * Math.cos(ang)} ${y0 - r * Math.sin(ang)}"/>
      <text class="tri-label tri-label--sm" ${label}>θ</text>`;
  })() : '';
  return `<svg viewBox="0 0 520 290" role="img" aria-label="${n === 1
    ? `Triângulo retângulo com catetos ${T.a} e ${T.b}; a hipotenusa c é desconhecida`
    : `Triângulo retângulo: cateto oposto a θ mede ${T.o}, cateto adjacente mede ${T.a} e hipotenusa mede ${T.h}`}">
    <polygon class="tri" points="${x0},${y0 - h} ${x0},${y0} ${x0 + w},${y0}"/>
    <path class="tri-glow" pathLength="1" d="M ${x0} ${y0 - h} L ${x0 + w} ${y0}"/>
    <polyline class="tri-mark" points="${x0},${y0 - 16} ${x0 + 16},${y0 - 16} ${x0 + 16},${y0}"/>
    ${theta}
    <text class="tri-label" x="${x0 - 18}" y="${my + 9}" text-anchor="end">${vert}</text>
    <text class="tri-label" x="${mx}" y="${y0 + 36}" text-anchor="middle">${horiz}</text>
    <rect class="tri-chip" x="${mx + 14}" y="${my - 46}" width="${chipW}" height="38"/>
    <text class="tri-label" x="${mx + 14 + chipW / 2}" y="${my - 18}" text-anchor="middle">${hypText}</text>
  </svg>`;
}

/** Círculo III: anel com as quatro posições e o triângulo gravado no centro. */
function discSvg(T, solved) {
  const cx = 260, cy = 150, R = 118;
  const fields = [['lado', 'moon'], ['sen', 'sun'], ['cos', 'lyre'], ['tg', 'leaf']];
  const spots = [[cx, cy - R], [cx + R, cy], [cx, cy + R], [cx - R, cy]];
  const meds = fields.map(([key, ic], i) => {
    const [x, y] = spots[i], filled = S.answers[3][key] !== '', ok = solved || S.checked[key];
    return `<circle class="disc-med ${filled ? 'is-filled' : ''} ${ok ? 'is-ok' : ''}" cx="${x}" cy="${y}" r="21"/>
      <use href="#i-${ic}" x="${x - 9}" y="${y - 9}" width="18" height="18" style="stroke:var(--plate-ink);fill:none;stroke-width:1.6"/>`;
  }).join('');
  const s = Math.min(104 / T.a, 64 / T.o), w = T.a * s, h = T.o * s;
  const x0 = cx - w / 2, y0 = cy + h / 2 + 4;
  return `<svg viewBox="0 0 520 300" role="img" aria-label="Círculo de bronze com quatro posições. No centro, um triângulo retângulo com hipotenusa ${T.h}, cateto adjacente a θ igual a ${T.a} e cateto oposto apagado">
    <g class="disc-spin">
      <circle class="disc-ring" cx="${cx}" cy="${cy}" r="${R + 12}"/>
      <circle class="disc-ticks" cx="${cx}" cy="${cy}" r="${R - 12}" stroke-dasharray="2 10"/>
    </g>
    <circle class="tri-glow" pathLength="1" cx="${cx}" cy="${cy}" r="${R + 12}" transform="rotate(-90 ${cx} ${cy})"/>
    <circle class="disc-ring" cx="${cx}" cy="${cy}" r="78"/>
    <polygon class="tri" points="${x0},${y0 - h} ${x0},${y0} ${x0 + w},${y0}"/>
    <polyline class="tri-mark" points="${x0},${y0 - 9} ${x0 + 9},${y0 - 9} ${x0 + 9},${y0}"/>
    <text class="tri-label tri-label--sm" x="${x0 - 8}" y="${y0 - h / 2 + 7}" text-anchor="end">${solved ? T.o : '?'}</text>
    <text class="tri-label tri-label--sm" x="${x0 + w / 2}" y="${y0 + 22}" text-anchor="middle">${T.a}</text>
    <text class="tri-label tri-label--sm" x="${x0 + w / 2 + 10}" y="${y0 - h / 2 - 6}">${T.h}</text>
    <text class="tri-label tri-label--sm" x="${x0 + w + 6}" y="${y0 + 4}" style="font-size:14px">θ</text>
    ${meds}
  </svg>`;
}

/* --- Interface de resposta de cada mecanismo --- */
const DISC_FIELDS = [
  { key: 'lado', num: 1, icon: 'moon', name: 'Teorema', sub: 'cateto oposto (unidades)' },
  { key: 'sen', num: 2, icon: 'sun', name: 'Seno', sub: 'sen θ' },
  { key: 'cos', num: 3, icon: 'lyre', name: 'Cosseno', sub: 'cos θ' },
  { key: 'tg', num: 4, icon: 'leaf', name: 'Tangente', sub: 'tg θ' }
];

function renderMechanism(review) {
  const n = current, T = S.tri[n], A = S.answers[n];
  const dis = review ? 'disabled' : '';
  if (n === 1) {
    $('en-mech').innerHTML = `
      <p class="mech-label"><span>Medida da hipotenusa</span><span id="m-state"></span></p>
      <label class="answer-line" id="field-c">
        <span class="answer-line__var" aria-hidden="true">c =</span>
        <input id="ans-c" data-key="c" type="text" inputmode="decimal" autocomplete="off" ${dis}
          aria-label="Medida da hipotenusa c, em unidades" value="${review ? T.c : A.c}">
        <span class="answer-line__unit">unidades</span>
      </label>
      <p class="mech-help">Observe os catetos ${T.a} e ${T.b}. Insira apenas o valor da medida.</p>`;
  } else if (n === 2) {
    const values = review ? { sen: `${T.o}/${T.h}`, cos: `${T.a}/${T.h}`, tg: `${T.o}/${T.a}` } : A;
    $('en-mech').innerHTML = `
      <p class="mech-label"><span>Razões do ângulo θ</span><span id="m-state"></span></p>
      <div class="slots" role="group" aria-label="Espaços das razões: selecione um e depois escolha a fração">
        ${[['sen', 'sen θ'], ['cos', 'cos θ'], ['tg', 'tg θ']].map(([key, label]) => `
          <button type="button" class="slot" id="field-${key}" data-slot="${key}" ${dis}
            aria-pressed="${!review && activeSlot === key}" aria-label="${label}: ${values[key] ? values[key].replace('/', ' sobre ') : 'vazio'}">
            <span class="slot__name">${label}</span><span class="slot__value">${values[key] || '—'}</span>
          </button>`).join('')}
      </div>
      <p class="mech-label" style="margin-top: 16px"><span>Frações disponíveis</span><span>a mesma fração pode ir em mais de um espaço</span></p>
      <div class="fractions">
        ${T.options.map(f => `<button type="button" class="fraction" data-frac="${f}" ${dis} aria-label="Fração ${f.replace('/', ' sobre ')}">${f}</button>`).join('')}
      </div>`;
  } else {
    const dec = x => (Math.round(x * 100) / 100).toLocaleString('pt-BR', { maximumFractionDigits: 2 });
    const values = review ? { lado: String(T.o), sen: dec(T.o / T.h), cos: dec(T.a / T.h), tg: dec(T.o / T.a) } : A;
    $('en-mech').innerHTML = `
      <p class="mech-label"><span>Sequência do círculo</span><span id="m-state"></span></p>
      <div class="disc-fields">
        ${DISC_FIELDS.map(f => {
          const ok = review || S.checked[f.key];
          const msg = itemMessages[f.key];
          return `
          <div class="disc-field ${ok ? 'is-ok' : msg ? 'is-wrong' : ''}" id="field-${f.key}">
            <label class="disc-field__head" for="ans-${f.key}"><b>${f.num}</b>${icon(f.icon, 'icon icon--sm')} ${f.name}</label>
            <div class="disc-field__row">
              <input id="ans-${f.key}" data-key="${f.key}" type="text" inputmode="decimal" autocomplete="off" ${ok ? 'disabled' : ''}
                aria-describedby="msg-${f.key}" aria-label="Posição ${f.num}, ${f.name}: ${f.sub}" value="${values[f.key]}">
              ${ok ? `<span class="disc-field__ok" aria-hidden="true">${icon('check', 'icon icon--sm')}</span>`
                : `<button type="button" class="disc-check" data-check="${f.key}" aria-label="Conferir posição ${f.num}, ${f.name}">${icon('check', 'icon icon--sm')}</button>`}
            </div>
            <small class="disc-field__msg" id="msg-${f.key}" aria-live="polite">${ok ? 'Correta' : msg || f.sub}</small>
          </div>`;
        }).join('')}
      </div>
      <p class="mech-help">Confira cada posição com ✓ ou Enter. Responda só com números: inteiros (9) ou decimais com até duas casas depois da vírgula (0,67). Frações não são aceitas: divida e escreva o resultado.</p>`;
  }
}

/** Quantos campos estão preenchidos e se o que foi digitado é um número válido. */
function readiness() {
  const n = current, A = S.answers[n], keys = Object.keys(A);
  const filled = keys.filter(k => A[k].trim() !== '').length;
  const invalid = n !== 2 && keys.some(k => A[k].trim() !== '' && Number.isNaN(parseDecimal(A[k])));
  return { filled, total: keys.length, invalid, ready: filled === keys.length && !invalid };
}

function renderStatus(stateText) {
  const n = current, review = S.done[n], r = readiness(), status = $('en-status');
  const mState = $('m-state');
  if (review) {
    status.textContent = '';
    if (mState) mState.textContent = n === 1 ? 'Medida correta' : 'Mecanismo resolvido';
    return;
  }
  let text, warn = false;
  if (r.invalid) { text = n === 1 ? 'Use apenas números, como 9 ou 9,0.' : 'Use só números inteiros ou decimais com até duas casas, como 9 ou 0,67.'; warn = true; }
  else if (!r.ready) {
    text = n === 1 ? 'Digite a medida de c para confirmar.'
      : n === 2 ? `Preencha os três espaços para confirmar (${r.filled}/3).`
      : `Preencha as quatro posições do círculo (${r.filled}/4).`;
  } else text = 'Pronto para confirmar.';
  status.textContent = text;
  status.classList.toggle('is-warn', warn);
  $('btn-confirm').disabled = !r.ready;
  if (mState) {
    mState.textContent = stateText || (n === 1 ? (r.ready ? 'Resposta pronta' : 'Aguardando resposta')
      : n === 2 ? `${r.filled}/3 preenchidos` : `${r.filled}/4 posições`);
  }
}

function renderHint() {
  const n = current, review = S.done[n], C = chapter(n), btn = $('btn-hint');
  const box = $('hint-box');
  if (S.hints[n]) {
    $('btn-hint-text').textContent = hintOpen ? 'Esconder dica' : 'Reler dica';
    btn.disabled = false;
  } else {
    $('btn-hint-text').textContent = review ? 'Dica não utilizada'
      : hintsUsed() === 0 ? 'Pedir dica · custa 0,5 na nota' : 'Pedir dica · sem custo extra';
    btn.disabled = review;
  }
  box.hidden = !(S.hints[n] && hintOpen);
  box.innerHTML = `<b>Dica do capítulo ${ROMAN[n]}</b>${C.mech.hint}`;
  $('en-note').textContent = `Dicas utilizadas: ${hintsUsed()} de 3 · usar dica desconta 0,5 da nota final, uma vez só · Tempo sem limite`;
  renderSkip();
}

/**
 * Diário do enigma: reúne só as pistas que o jogador investigou na sala.
 * Esses fragmentos são o material para resolver o mecanismo; o que não
 * foi investigado não aparece aqui.
 */
function renderFoundClues(review) {
  const n = current, C = chapter(n);
  const found = C.clues.filter(c => S.clues[n].includes(c.id));
  $('en-notes-title').textContent = `Anotações do explorador · ${found.length} de ${C.clues.length} pistas`;
  const reviewNote = review ? `<p class="review-note">${S.skipped[n] ? 'Capítulo pulado.' : 'Selo recuperado.'} Você está revendo este capítulo.</p>` : '';
  if (!found.length) {
    $('en-notes').innerHTML = `<div class="found-empty">
        <p>Você ainda não registrou pistas nesta sala. As anotações aparecem aqui conforme você investiga os pontos da cena.</p>
        <button type="button" class="btn btn--parchment" id="found-back">${icon('arrow-left', 'icon icon--sm')} Voltar à sala</button>
      </div>${reviewNote}`;
    $('found-back').addEventListener('click', () => show('exploracao', n));
    return;
  }
  const missing = C.clues.length - found.length;
  $('en-notes').innerHTML = `<ul class="found-list">
      ${found.map(c => `<li><b>${c.name}</b><span class="found-list__text">${c.text}</span><span class="found-list__extra">${c.extra}</span></li>`).join('')}
    </ul>
    ${missing && !review ? `<div class="found-more">
        <p>Ainda há pistas valiosas para serem exploradas.</p>
        <button type="button" class="btn btn--parchment" id="found-back">${icon('arrow-left', 'icon icon--sm')} Voltar à sala</button>
      </div>` : ''}
    ${reviewNote}`;
  const back = $('found-back');
  if (back) back.addEventListener('click', () => show('exploracao', n));
}

function renderEnigma() {
  const n = current, C = chapter(n), M = C.mech, review = S.done[n];
  hintOpen = false;
  activeSlot = firstEmptySlot() || 'sen';
  $('en-eyebrow').textContent = M.eyebrow;
  $('en-title').textContent = M.title;
  $('en-instr').textContent = review ? 'Você já recuperou este selo. Aqui você revê a solução.' : M.instr;
  $('en-tag').textContent = M.tag;
  $('en-artifact').style.backgroundImage = `url("${M.img}")`;
  $('en-plate').innerHTML = plateSvg(n, review);
  $('en-plate').classList.toggle('is-solved', false);
  $('en-reg').textContent = M.reg;
  $('en-diary-title').textContent = M.diaryTitle;
  $('en-quote').textContent = M.quote;
  renderFoundClues(review);
  $('en-seal-count').textContent = `${sealsCount()} / 3`;
  $('en-seals').innerHTML = sealRow();
  $('btn-confirm').innerHTML = `${M.confirm} ${icon('arrow-right')}`;
  $('btn-confirm').hidden = review;
  $('btn-clear').hidden = review;
  renderMechanism(review);
  renderStatus();
  renderHint();
}

const firstEmptySlot = () => ['sen', 'cos', 'tg'].find(k => S.answers[2][k] === '');

/* --- Eventos dos mecanismos --- */
$('en-mech').addEventListener('input', event => {
  const input = event.target.closest('input[data-key]');
  if (!input) return;
  S.answers[current][input.dataset.key] = input.value;
  input.closest('.answer-line, .disc-field').classList.remove('is-wrong');
  if (current === 3 && itemMessages[input.dataset.key]) {
    delete itemMessages[input.dataset.key];
    const m = $(`msg-${input.dataset.key}`);
    if (m) m.textContent = DISC_FIELDS.find(f => f.key === input.dataset.key).sub;
  }
  save();
  renderStatus();
  if (current === 3) $('en-plate').innerHTML = plateSvg(3, false);
});

$('en-mech').addEventListener('click', event => {
  const slot = event.target.closest('[data-slot]');
  const frac = event.target.closest('[data-frac]');
  if (slot && !slot.disabled) {
    activeSlot = slot.dataset.slot;
    renderMechanism(false);
    renderStatus();
    document.querySelector(`[data-slot="${activeSlot}"]`).focus();
  }
  if (frac && !frac.disabled) {
    // Selecionar outra fração substitui a resposta do espaço ativo
    S.answers[2][activeSlot] = frac.dataset.frac;
    const filledSlot = activeSlot;
    activeSlot = firstEmptySlot() || activeSlot;
    save();
    renderMechanism(false);
    renderStatus();
    document.querySelector(`#field-${filledSlot}`).classList.remove('is-wrong');
    document.querySelector(`[data-frac="${frac.dataset.frac}"]`).focus();
  }
});

$('btn-clear').addEventListener('click', () => {
  const n = current;
  // No círculo, as posições já conferidas e certas continuam travadas
  Object.keys(S.answers[n]).forEach(k => { if (!(n === 3 && S.checked[k])) S.answers[n][k] = ''; });
  if (n === 3) Object.keys(itemMessages).forEach(k => delete itemMessages[k]);
  activeSlot = 'sen';
  save();
  renderMechanism(false);
  renderStatus();
  if (n === 3) $('en-plate').innerHTML = plateSvg(3, false);
  const first = $('en-mech').querySelector('input, .slot');
  if (first) first.focus();
});

$('btn-hint').addEventListener('click', () => {
  const n = current;
  if (!S.hints[n]) {
    if (S.done[n]) return;
    S.hints[n] = true;   // a dica do capítulo é gasta só uma vez; reler é grátis
    save();
    hintOpen = true;
  } else {
    hintOpen = !hintOpen;
  }
  renderHint();
});

$('btn-back-room').addEventListener('click', () => show('exploracao', current));
$('btn-confirm').addEventListener('click', submitAnswer);
$('en-mech').addEventListener('keydown', event => {
  if (event.key !== 'Enter' || !event.target.matches('input')) return;
  // Sem isso, o mesmo Enter acionaria o botão do aviso que acabou de abrir
  event.preventDefault();
  if (current === 3) checkDiscItem(event.target.dataset.key);
  else if (!$('btn-confirm').disabled) submitAnswer();
});

/* --- Conferência por posição no Círculo de Pitágoras ---
   Cada posição pode ser conferida sozinha. Uma posição certa fica travada
   e acende o medalhão do círculo; uma errada recebe uma orientação própria,
   sem revelar o valor. Cada conferência errada conta como tentativa
   incorreta (só aparece na conclusão). Com as quatro certas, o círculo gira. */
const itemMessages = {};   // orientação atual de cada posição errada (não é salva)

function discItemCorrect(key) {
  const T = S.tri[3], v = parseDecimal(S.answers[3][key]);
  if (key === 'lado') return v === T.o;
  const right = { sen: T.o / T.h, cos: T.a / T.h, tg: T.o / T.a }[key];
  return Math.abs(v - right) <= 0.0101;   // aceita até duas casas decimais
}

/** Orientação para uma posição errada: aponta o engano provável, sem dar a resposta. */
function discItemHint(key) {
  const T = S.tri[3], v = parseDecimal(S.answers[3][key]);
  const near = x => Math.abs(v - x) <= 0.0101;
  if (key === 'lado') {
    if (v === T.o ** 2) return 'Esse é o quadrado do lado. Falta a raiz quadrada.';
    if (near(Math.hypot(T.h, T.a))) return 'Aqui a hipotenusa já é conhecida: subtraia os quadrados.';
    return 'Use o teorema: lado oculto² = hipotenusa² − adjacente².';
  }
  if (key === 'sen') return near(T.a / T.h) ? 'Esse é o cosseno. O seno usa o lado oposto a θ.' : 'Seno = cateto oposto ÷ hipotenusa.';
  if (key === 'cos') return near(T.o / T.h) ? 'Esse é o seno. O cosseno usa o lado adjacente a θ.' : 'Cosseno = cateto adjacente ÷ hipotenusa.';
  return near(T.a / T.o) ? 'A razão está invertida: oposto ÷ adjacente.' : 'Tangente = cateto oposto ÷ cateto adjacente.';
}

function checkDiscItem(key) {
  if (S.done[3] || S.checked[key]) return;
  const raw = S.answers[3][key].trim();
  if (raw === '' || Number.isNaN(parseDecimal(raw))) {
    // Vazio ou fora do formato: só orienta, não conta como tentativa
    itemMessages[key] = raw === '' ? 'Preencha esta posição antes de conferir.'
      : raw.includes('/') ? 'Frações não valem aqui: divida e escreva o decimal, como 0,67.'
      : 'Use um número inteiro ou decimal com até duas casas, como 0,67.';
  } else if (discItemCorrect(key)) {
    S.checked[key] = true;
    delete itemMessages[key];
  } else {
    S.errors[3] += 1;
    noteMistake(3, classifyMistake(3, key));
    itemMessages[key] = discItemHint(key);
  }
  save();
  renderSkip();
  if (DISC_FIELDS.every(f => S.checked[f.key])) { completeChapter(3); return; }
  renderMechanism(false);
  renderStatus();
  $('en-plate').innerHTML = plateSvg(3, false);
  // Certa: o foco vai para a próxima posição aberta; errada: fica nela
  const next = S.checked[key] ? DISC_FIELDS.find(f => !S.checked[f.key]) : null;
  const target = $(`ans-${next ? next.key : key}`);
  if (target) { target.focus(); if (!next) target.select(); }
}

$('en-mech').addEventListener('click', event => {
  const btn = event.target.closest('[data-check]');
  if (btn) checkDiscItem(btn.dataset.check);
});

/** Confere a resposta do mecanismo e devolve os campos errados. */
function wrongFields(n) {
  const T = S.tri[n], A = S.answers[n];
  const close = (v, exact) => Math.abs(v - exact) <= 0.0101;   // aceita até duas casas decimais
  if (n === 1) return parseAnswer(A.c) === T.c ? [] : ['c'];
  if (n === 2) {
    const right = { sen: T.o / T.h, cos: T.a / T.h, tg: T.o / T.a };
    return ['sen', 'cos', 'tg'].filter(k => Math.abs(parseAnswer(A[k]) - right[k]) > 1e-9);
  }
  return DISC_FIELDS.map(f => f.key).filter(k => !discItemCorrect(k));
}

function submitAnswer() {
  const n = current;
  if (S.done[n] || !readiness().ready) return;
  const wrong = wrongFields(n);
  const M = chapter(n).mech;
  if (wrong.length) {
    S.errors[n] += 1;   // guardado para o ranking; só aparece na conclusão
    wrong.forEach(k => noteMistake(n, classifyMistake(n, k)));
    renderSkip();
    if (n === 3) {
      DISC_FIELDS.forEach(f => { if (!wrong.includes(f.key)) { S.checked[f.key] = true; delete itemMessages[f.key]; } });
      wrong.forEach(k => { itemMessages[k] = discItemHint(k); });
      renderMechanism(false);
      $('en-plate').innerHTML = plateSvg(3, false);
    }
    save();
    wrong.forEach(k => { const f = $(`field-${k}`); if (f) f.classList.add('is-wrong'); });
    renderStatus(n === 1 ? 'Resposta incorreta' : `${wrong.length} ${wrong.length === 1 ? 'posição para revisar' : 'posições para revisar'}`);
    openFeedback({
      type: 'error', eyebrow: 'Ainda não', title: M.errorTitle, text: M.error, action: 'Revisar resposta',
      onClose: () => { const f = $(`field-${wrong[0]}`); const el = f && (f.querySelector('input') || f); if (el) el.focus(); }
    });
    return;
  }
  completeChapter(n);
}

/** Acerto: o selo é registrado uma única vez, a jornada é salva e o aviso abre. */
function completeChapter(n) {
  const M = chapter(n).mech;
  S.done[n] = true;
  S.solvedAtMs[n] = Math.round(S.activeMs);
  if (n === 3) { S.completed = true; S.finalMs = Math.round(S.activeMs); S.result = computeGrade(); }
  save();
  renderEnigma();
  const onClose = () => (n < 3 ? show('exploracao', n + 1) : show('conclusao'));
  if (S.skipped[n]) {
    // Pulou: mostra a resolução completa antes de seguir
    const R = resultSummary(n);
    openFeedback({
      type: 'skip', n, eyebrow: 'Capítulo pulado · vale 0 na nota', title: `${SEALS[n].name} liberado`,
      text: `Resolução: ${R.answers.join(' · ')}\n${R.calc}`, action: M.success.action, onClose
    });
    return;
  }
  openFeedback({
    type: 'success', n, eyebrow: `Selo ${sealsCount()} de 3`, title: M.success.title, text: M.success.text, action: M.success.action,
    onClose
  });
}

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

/* ---------------------------------------------------------------
   RANKING (servidor)
   Na versão publicada na Vercel o jogo conversa com /api: lista as
   turmas criadas na gestão e envia o resultado ao concluir. Sem servidor
   (arquivo local ou página no Claude), tudo segue funcionando sem ranking.
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
    if (!res.ok) { console.warn('Ranking indisponível:', (await res.json().catch(() => ({}))).erro || res.status); return; }
    const data = await res.json();
    API.turmas = Array.isArray(data.turmas) ? data.turmas : [];
    API.on = true;
    $('start-ranking').hidden = false;
    $('end-ranking').hidden = false;
  } catch (e) { /* sem servidor: o jogo segue sem ranking */ }
})().finally(() => { API.loaded = true; });

/** A turma é escolhida numa lista com as turmas criadas na gestão (ou "Sem turma"). */
function renderClassField(last) {
  const select = $('id-class');
  const keep = select.value;
  select.innerHTML = '<option value="" disabled>Selecione sua turma</option>' +
    API.turmas.map(t => `<option value="${t.id}">${escapeHtml(t.nome)}</option>`).join('');
  const match = API.turmas.find(t => String(t.id) === keep) ||
    (last && (API.turmas.find(t => t.id === last.turmaId) || API.turmas.find(t => t.nome === last.turma)));
  select.value = match ? String(match.id) : '';
  select.disabled = API.loaded && !API.turmas.length;
  // Sem servidor (arquivo local ou página no Claude) não há turmas nem ranking: o campo fica oculto
  select.closest('.id-field').hidden = API.loaded && !API.on;
  $('id-class-hint').textContent = !API.loaded ? 'Carregando as turmas…'
    : API.on && !API.turmas.length ? 'Ainda não há turmas cadastradas. Peça ao professor para criar a sua turma.' : '';
}

/** A turma é obrigatória sempre que o jogo está ligado ao servidor do ranking. */
const classRequired = () => API.on;

const escapeHtml = text => String(text).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));

let syncing = false;
/** Envia o resultado uma única vez (o servidor também ignora repetições). */
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
    if (!S.jornadaId) { S.jornadaId = newJourneyId(); save({ quiet: true }); }
    const res = await fetch('/api/resultados', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jornadaId: S.jornadaId, nome: S.player.name, turmaId: S.player.turmaId || null, turmaTexto: S.player.turma || '',
        erros: S.errors, pulados: S.skipped, dicas: hintsUsed(), tempoMs: Math.round(S.finalMs || 0), teste: Boolean(S.usedTest)
      })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.erro || 'Falha no envio.');
    S.submitted = true;
    save({ quiet: true });
    setState('Resultado enviado. O ranking aparece quando o professor publicar.');
  } catch (e) {
    setState('Não foi possível enviar o resultado agora. Verifique a conexão.', true);
  } finally {
    syncing = false;
  }
}
$('g-sync-retry').addEventListener('click', syncResult);

/* ---------------------------------------------------------------
   11. CONCLUSÃO
   --------------------------------------------------------------- */
function renderConclusao() {
  $('g-name').textContent = S.player ? S.player.name : 'Você';
  $('g-class').textContent = S.player && S.player.turma ? `Turma ${S.player.turma}` : '';
  $('g-class').hidden = !(S.player && S.player.turma);
  $('st-time').textContent = formatTime(S.finalMs || 0);
  $('st-hints').textContent = pad2(hintsUsed());
  $('st-errors').textContent = pad2(errorsTotal());
  $('st-seals').textContent = `${[1, 2, 3].filter(n => !S.skipped[n]).length} / 3`;
  syncResult();
  $('end-seals').innerHTML = [1, 2, 3].map(n => `<li>${icon(SEALS[n].icon)} ${SEALS[n].short} ${S.skipped[n] ? '(pulado)' : icon('check', 'icon icon--sm')}</li>`).join('');
  renderGrade();
}

function renderGrade() {
  const G = computeGrade();
  S.result = G;   // mantém a nota salva junto com a jornada (ranking futuro)
  save({ quiet: true });
  $('g-value').textContent = fmt1(G.grade);
  $('g-concept').textContent = G.concept;
  $('g-concept').classList.toggle('is-dev', G.grade < 7);
  const lines = G.chapters.map(c => {
    const detail = c.skipped ? 'pulado' : c.errors ? `${c.errors} ${c.errors === 1 ? 'tentativa incorreta' : 'tentativas incorretas'}` : 'sem erros';
    return `<li><span>${ROMAN[c.n]} · ${chapter(c.n).title} <small>(${detail})</small></span><b>${fmt2(c.score)} de ${c.max}</b></li>`;
  });
  if (G.hintPenalty) lines.push(`<li><span>Uso de dicas</span><b>−${fmt2(G.hintPenalty)}</b></li>`);
  if (G.raw < GRADE.floor) lines.push(`<li><span>Nota mínima por concluir a jornada</span><b>${fmt1(GRADE.floor)}</b></li>`);
  $('g-breakdown').innerHTML = lines.join('');

  // Abaixo de 7, ou com capítulo pulado: o que revisar e onde estudar
  const review = G.chapters.filter(c => c.skipped || (G.grade < 7 && c.score < c.max));
  $('g-study').hidden = review.length === 0;
  $('g-study-list').innerHTML = review.map(c => {
    const types = Object.entries(S.mistakes[c.n] || {}).sort((x, y) => y[1] - x[1]).map(([t]) => MISTAKE_TEXT[t] || MISTAKE_OTHER[c.n]);
    const notes = [...new Set(types)].slice(0, 3);
    if (c.skipped) notes.unshift('Você pulou este mecanismo. Vale refazer a conta com calma, olhando a resolução.');
    if (!notes.length) notes.push(MISTAKE_OTHER[c.n]);
    const study = STUDY[c.n];
    return `<div class="study__item">
      <h3>Capítulo ${ROMAN[c.n]} · ${chapter(c.n).title}</h3>
      <ul>${notes.map(t => `<li>${t}</li>`).join('')}</ul>
      <p>Revise: <b>${study.topic}</b></p>
      <ul class="study__links">${study.links.map(l => `<li><a href="${l.url}" target="_blank" rel="noopener noreferrer">${l.label}</a></li>`).join('')}</ul>
    </div>`;
  }).join('');
}
$('btn-review').addEventListener('click', () => show('capitulos'));
$('btn-again').addEventListener('click', () => show('identificacao'));

/* ---------------------------------------------------------------
   12. DIÁLOGOS E ATALHOS
   --------------------------------------------------------------- */
const closeCallbacks = new WeakMap();
let escClosedLayer = false;   // o Esc que fechou uma camada não abre a pausa

function openDialog(dlg) {
  if (dlg.open) return;
  dlg.classList.remove('is-closing');
  dlg.showModal();
}

function closeDialog(dlg, after) {
  if (!dlg.open || dlg.classList.contains('is-closing')) return;
  if (after) closeCallbacks.set(dlg, after);
  dlg.classList.add('is-closing');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  setTimeout(() => dlg.close(), reduce ? 0 : 180);
}

document.querySelectorAll('dialog').forEach(dlg => {
  dlg.addEventListener('cancel', event => { event.preventDefault(); escClosedLayer = true; closeDialog(dlg); });
  dlg.addEventListener('click', event => {
    if (event.target === dlg || event.target.closest('[data-close]')) closeDialog(dlg);
  });
  dlg.addEventListener('close', () => {
    dlg.classList.remove('is-closing');
    if (dlg.id === 'dlg-pause') { paused = false; lastTick = performance.now(); renderTimer(); }
    const after = closeCallbacks.get(dlg);
    closeCallbacks.delete(dlg);
    if (after) after();
  });
});

/** Modal de acerto (com a placa animada e o selo) ou de erro. */
let feedbackAfter = null;
function openFeedback({ type, n, eyebrow, title, text, action, onClose }) {
  const dlg = $('dlg-feedback');
  dlg.classList.toggle('dialog--error', type === 'error');
  $('fb-top').innerHTML = type === 'success' || type === 'skip'
    ? `<div class="fb-plate"><div class="plate" id="fb-plate">${plateSvg(n, true)}</div></div>
       ${type === 'success' ? `<div class="medal">${icon(SEALS[n].icon)}</div>` : ''}`
    : `<div class="fb-icon">${icon('x', 'icon icon--lg')}</div>`;
  $('fb-eyebrow').textContent = eyebrow;
  $('fb-title').textContent = title;
  $('fb-text').textContent = text;
  $('fb-action').innerHTML = `${action} ${type !== 'error' ? icon('arrow-right') : ''}`;
  feedbackAfter = onClose;
  closeCallbacks.set(dlg, () => { const cb = feedbackAfter; feedbackAfter = null; if (cb) cb(); });
  openDialog(dlg);
  $('fb-action').focus();
  // A placa começa no estado anterior e "se completa" já com o modal aberto
  if (type !== 'error') setTimeout(() => { const p = $('fb-plate'); if (p) p.classList.add('is-solved'); }, 380);
}
$('fb-action').addEventListener('click', () => closeDialog($('dlg-feedback')));

function renderDiary() {
  const parts = [1, 2, 3].map(n => {
    const C = chapter(n);
    const found = S.clues[n].map(id => C.clues.find(c => c.id === id));
    if (!found.length && !S.hints[n]) return '';
    return `<li><h4>Capítulo ${ROMAN[n]} · ${C.title}</h4><ul>
      ${found.map(c => `<li><b>${c.name}.</b> ${c.text} ${c.extra.replace(/\n/g, '; ')}</li>`).join('')}
      ${S.hints[n] ? `<li><b>Dica.</b> ${C.mech.hint}</li>` : ''}
    </ul></li>`;
  }).join('');
  $('diary-content').innerHTML = parts.trim()
    ? `<ul class="diary-list">${parts}</ul>`
    : '<p class="diary-empty">O diário ainda está em branco. Investigue os pontos das salas para registrar pistas.</p>';
}

function renderInventoryDialog() {
  const seals = [1, 2, 3].map(n => `<li><b>${SEALS[n].name}</b>: ${S.done[n] ? 'recuperado' : 'ainda não recuperado'}</li>`).join('');
  const records = [1, 2, 3].map(n => {
    const C = chapter(n);
    return S.clues[n].length ? `<li><b>Capítulo ${ROMAN[n]}</b>: ${S.clues[n].map(id => C.clues.find(c => c.id === id).name).join(', ')}</li>` : '';
  }).join('');
  $('inv-content').innerHTML = `<ul class="diary-list">
    <li><h4>Selos recuperados · ${sealsCount()} / 3</h4><ul>${seals}</ul></li>
    <li><h4>Registros consultáveis</h4>${records ? `<ul>${records}</ul>` : '<p class="diary-empty">Nenhum registro ainda.</p>'}</li>
  </ul>`;
}

function openLayer(name) {
  if (!S || !GAME_SCREENS.includes(screen)) return;
  if (name === 'diary') { renderDiary(); openDialog($('dlg-diary')); }
  if (name === 'inventory') { renderInventoryDialog(); openDialog($('dlg-inventory')); }
  if (name === 'pause') { tick(); paused = true; save(); renderTimer(); openDialog($('dlg-pause')); }
}

document.addEventListener('click', event => {
  const opener = event.target.closest('[data-open]');
  if (opener) openLayer(opener.dataset.open);
  const go = event.target.closest('[data-go]');
  if (go) show(go.dataset.go);
});
$('nav-diary').addEventListener('click', () => openLayer('diary'));
$('nav-pause').addEventListener('click', () => openLayer('pause'));
$('brand').addEventListener('click', () => show('inicio'));
$('pause-resume').addEventListener('click', () => closeDialog($('dlg-pause')));
$('pause-home').addEventListener('click', () => closeDialog($('dlg-pause'), () => show('inicio')));

// Atalhos: D diário, I inventário, Esc pausa. Não disparam enquanto se digita.
document.addEventListener('keydown', event => {
  if (event.ctrlKey || event.metaKey || event.altKey) return;
  if (document.querySelector('dialog[open]')) return;          // Esc fecha a camada aberta (evento "cancel")
  if (event.target.matches('input, textarea')) return;
  const key = event.key.toLowerCase();
  if (key === 'd') openLayer('diary');
  else if (key === 'i') openLayer('inventory');
});
// A pausa abre ao soltar o Esc: se abrisse ao apertar, o próprio Esc fecharia o diálogo
document.addEventListener('keyup', event => {
  if (event.key !== 'Escape' || escClosedLayer) { escClosedLayer = false; return; }
  if (document.querySelector('dialog[open]') || event.target.matches('input, textarea')) return;
  openLayer('pause');
});

/* ---------------------------------------------------------------
   13. MODO DE TESTE
   Abra a página com #teste no fim do endereço: o botão "Avançar"
   resolve o passo atual com as respostas certas, pelo caminho normal.
   --------------------------------------------------------------- */
const isTestMode = () => location.hash === '#teste';

function updateTestFab() {
  $('test-fab').hidden = !isTestMode() || screen === 'conclusao';
}

function autoAdvance() {
  if (S && S.started && !S.completed) S.usedTest = true;
  if (screen === 'inicio') {
    if (!S || S.completed) show('identificacao'); else $('btn-continue').click();
  } else if (screen === 'identificacao') {
    if (!$('id-name').value.trim()) $('id-name').value = 'Teste';
    const sel = $('id-class');
    if (!sel.value && sel.options.length > 1) sel.selectedIndex = 1;
    $('id-form').requestSubmit();
  } else if (screen === 'capitulos') {
    const next = [1, 2, 3].find(n => !S.done[n]);
    if (next) show('exploracao', next); else show('conclusao');
  } else if (screen === 'exploracao') {
    show('enigma', current);
  } else if (screen === 'enigma') {
    const n = current, T = S.tri[n];
    if (S.done[n]) { show(n < 3 ? 'exploracao' : 'conclusao', Math.min(n + 1, 3)); return; }
    if (n === 1) S.answers[1] = { c: String(T.c) };
    if (n === 2) S.answers[2] = { sen: `${T.o}/${T.h}`, cos: `${T.a}/${T.h}`, tg: `${T.o}/${T.a}` };
    if (n === 3) {
      const dec = x => (Math.round(x * 100) / 100).toFixed(2).replace('.', ',');
      S.answers[3] = { lado: String(T.o), sen: dec(T.o / T.h), cos: dec(T.a / T.h), tg: dec(T.o / T.a) };
    }
    renderMechanism(false);
    renderStatus();
    submitAnswer();
  }
}
$('test-fab').addEventListener('click', autoAdvance);
window.addEventListener('hashchange', updateTestFab);

/* ---------------------------------------------------------------
   14. INICIALIZAÇÃO
   --------------------------------------------------------------- */
S = loadState();
if (S && !S.checked) S.checked = { lado: false, sen: false, cos: false, tg: false };
if (S && !S.skipped) S.skipped = { 1: false, 2: false, 3: false };
if (S && !S.mistakes) S.mistakes = { 1: {}, 2: {}, 3: {} };
show('inicio');
setInterval(tick, 1000);
