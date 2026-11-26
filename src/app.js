/* =====================================================================
   GTA · EDIÇÃO PORTO ALEGRE — lógica do jogo (JavaScript puro)
   ---------------------------------------------------------------------
   Organização:
     1. Imagens e utilitários
     2. Missões (sorteio, textos, respostas e resolução)
     3. Pontuação (igual a lib/nota.js no servidor)
     4. Estado e salvamento
     5. Navegação entre telas
     6. Início e identificação · 7. Mapa · 8. Missão · 9. Conclusão
     10. Servidor (turmas e ranking) · 11. Diálogos · 12. Modo de teste
   Respostas: "Relembre a fórmula" (etapa A) monta a conta arrastando peças;
   "Resolva o problema" (etapa B) é múltipla
   escolha. Nenhuma resposta pode ser negativa, e as imagens
   não mostram números (os valores mudam a cada jornada).
   ===================================================================== */
'use strict';

/* ---------------------------------------------------------------
   1. IMAGENS E UTILITÁRIOS
   --------------------------------------------------------------- */
const IMG = {
  dani: '__IMG_gta_isa_retrato__',
  avatar: '__IMG_gta_isa_avatar__',
  avatarFala: '__IMG_gta_isa_avatar_fala__',   // mesma imagem com a boca fechada: alternando, a Isa "fala"
  card: {
    1: '__IMG_gta_card_m1_mercado__', 2: '__IMG_gta_card_m2_redencao__', 3: '__IMG_gta_card_m3_beirario__',
    4: '__IMG_gta_card_m4_gasometro__', 5: '__IMG_gta_card_m5_arena__', 6: '__IMG_gta_card_m6_aeroporto__'
  },
  scene: {
    1: '__IMG_gta_cena_m1_mercado__', 2: '__IMG_gta_cena_m2_redencao__', 3: '__IMG_gta_cena_m3_beirario__',
    4: '__IMG_gta_cena_m4_gasometro__', 5: '__IMG_gta_cena_m5_arena__', 6: '__IMG_gta_cena_m6_aeroporto__'
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
/** Nome ou apelido informado na identificação: a Isa chama o jogador por ele. */
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

/** Desenho do cilindro (tonel) com o raio e a altura sorteados. */
function cylinderSvg(r, h) {
  return `<svg viewBox="0 0 185 165" role="img" aria-label="Desenho do tonel: um cilindro com raio de ${fmt(r)} m e altura de ${fmt(h)} m">
    <path d="M20 40 V140 A55 16 0 0 0 130 140 V40" fill="rgba(34,227,255,0.18)" stroke="#FFF7EC" stroke-width="3"/>
    <path d="M20 140 A55 16 0 0 1 130 140" fill="none" stroke="#FFF7EC" stroke-width="2" stroke-dasharray="5 5" opacity="0.6"/>
    <ellipse cx="75" cy="40" rx="55" ry="16" fill="rgba(34,227,255,0.32)" stroke="#FFF7EC" stroke-width="3"/>
    <line x1="75" y1="40" x2="130" y2="40" stroke="#FFB02E" stroke-width="3"/>
    <circle cx="75" cy="40" r="3.5" fill="#FFB02E"/>
    <text x="102" y="28" text-anchor="middle" font-family="Inter, sans-serif" font-size="20" font-weight="800" fill="#FFB02E">r</text>
    <line x1="150" y1="40" x2="150" y2="140" stroke="#FF2E93" stroke-width="3"/>
    <path d="M144 48 L150 38 L156 48 M144 132 L150 142 L156 132" fill="none" stroke="#FF2E93" stroke-width="3"/>
    <text x="162" y="97" font-family="Inter, sans-serif" font-size="20" font-weight="800" fill="#FF2E93">h</text>
  </svg>`;
}

/* Desenhos das missões (SVG). k = etapa (0: Relembre a fórmula, 1: Resolva o problema).
   Mostram os dados sorteados, nunca a resposta. */
const T = (x, y, txt, color = '#FFF7EC', size = 15, anchor = 'middle', weight = 700) =>
  `<text x="${x}" y="${y}" text-anchor="${anchor}" font-family="Inter, sans-serif" font-size="${size}" font-weight="${weight}" fill="${color}">${txt}</text>`;
const svgWrap = (w, h, label, inner) => `<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="${label}">${inner}</svg>`;

/** Redenção: plano com os dois pontos; na etapa B, os catetos do triângulo. */
function planeSvg(d, k) {
  const u = 13, ox = 22, oy = 182, px = x => ox + x * u, py = y => oy - y * u;
  let grid = '';
  for (let i = 0; i <= 12; i++) {
    grid += `<line x1="${px(i)}" y1="${py(0)}" x2="${px(i)}" y2="${py(12)}" stroke="rgba(255,247,236,0.12)"/>`;
    grid += `<line x1="${px(0)}" y1="${py(i)}" x2="${px(12)}" y2="${py(i)}" stroke="rgba(255,247,236,0.12)"/>`;
  }
  const axes = `<line x1="${px(0)}" y1="${py(0)}" x2="${px(12.6)}" y2="${py(0)}" stroke="#FFF7EC" stroke-width="2"/><line x1="${px(0)}" y1="${py(0)}" x2="${px(0)}" y2="${py(12.6)}" stroke="#FFF7EC" stroke-width="2"/>`
    + T(px(12.6) + 6, py(0) + 5, 'x', '#BBA8D6', 13, 'start') + T(px(0), py(12.6) - 6, 'y', '#BBA8D6', 13);
  const [x1, y1] = d.P, [x2, y2] = d.Q;
  const legs = k === 1
    ? `<path d="M${px(x1)} ${py(y1)} L${px(x2)} ${py(y1)} L${px(x2)} ${py(y2)}" fill="none" stroke="#FFB02E" stroke-width="2.5" stroke-dasharray="6 4"/>
       <line x1="${px(x1)}" y1="${py(y1)}" x2="${px(x2)}" y2="${py(y2)}" stroke="#FF2E93" stroke-width="3"/>
       ${T((px(x1) + px(x2)) / 2, py(y1) + (y2 > y1 ? -8 : 17), d.dx, '#FFB02E', 13)}
       ${T(px(x2) + 10, (py(y1) + py(y2)) / 2 + 4, d.dy, '#FFB02E', 13, 'start')}`
    : `<line x1="${px(x1)}" y1="${py(y1)}" x2="${px(x2)}" y2="${py(y2)}" stroke="#22E3FF" stroke-width="2" stroke-dasharray="5 5"/>`;
  const dot = (x, y, c, name) => `<circle cx="${px(x)}" cy="${py(y)}" r="6" fill="${c}" stroke="#1A0833" stroke-width="2"/>`
    + T(px(x) + (x > 8 ? -9 : 9), py(y) + (y > 10 ? 18 : -9), name, c, 13, x > 8 ? 'end' : 'start');
  return svgWrap(210, 200, `Plano cartesiano com o lago dos pedalinhos em (${x1}, ${y1}) e a banca do Brique em (${x2}, ${y2})`,
    grid + axes + legs + dot(x1, y1, '#22E3FF', 'Lago') + dot(x2, y2, '#B6FF3B', 'Brique'));
}

/** Beira-Rio: fileiras crescendo (PA) ou convites se multiplicando (PG). */
function stadiumSvg(d, k) {
  if (k !== 1) {
    const rows = [d.a1, d.a1 + d.r, d.a1 + 2 * d.r], maxW = 150, unit = maxW / (d.a1 + 2 * d.r + 2);
    let out = '';
    rows.forEach((v, i) => {
      const y = 150 - i * 34, w = v * unit;
      out += `<rect x="${105 - w / 2}" y="${y}" width="${w}" height="20" rx="3" fill="#FF2E93" opacity="${0.55 + i * 0.15}"/>` + T(190, y + 15, v, '#FFF7EC', 14, 'end') + T(10, y + 15, `${i + 1}ª`, '#BBA8D6', 13, 'start');
    });
    out += T(105, 40, '⋮', '#BBA8D6', 20) + `<rect x="30" y="8" width="150" height="20" rx="3" fill="none" stroke="#FFB02E" stroke-width="2.5" stroke-dasharray="6 4"/>`
      + T(105, 23, '?', '#FFB02E', 16) + T(10, 23, `${d.n}ª`, '#FFB02E', 13, 'start');
    return svgWrap(200, 180, `Fileiras da arquibancada: a 1ª tem ${d.a1} cadeiras e cada fileira acima tem ${d.r} a mais; a ${d.n}ª é a pergunta`, out);
  }
  let out = '', y = 26;
  for (let round = 1; round < d.m; round++) {
    const count = d.g1 * d.q ** (round - 1), size = Math.min(10, 150 / count);
    let dots = '';
    for (let i = 0; i < count; i++) dots += `<circle cx="${40 + i * (125 / count) + size / 2}" cy="${y}" r="${Math.max(2.2, Math.min(size, 125 / count) / 2 - 0.8)}" fill="#22E3FF"/>`;
    out += T(10, y + 5, `${round}ª`, '#BBA8D6', 13, 'start') + dots + T(198, y + 5, count, '#FFF7EC', 14, 'end');
    y += 40;
  }
  out += T(10, y + 5, `${d.m}ª`, '#FFB02E', 13, 'start') + T(115, y + 6, `× ${d.q} … ?`, '#FFB02E', 16);
  return svgWrap(205, y + 20, `Convites por rodada: ${d.g1} na 1ª rodada e cada pessoa repassa para ${d.q}; a ${d.m}ª rodada é a pergunta`, out);
}

/** Usina do Gasômetro: a chaminé nas duas etapas (seno de 30°, depois Pitágoras com o cabo). */
function chimneySvg(d, k) {
  const tri = `<path d="M20 150 L180 150 L180 40 Z" fill="rgba(34,227,255,0.16)" stroke="#FFF7EC" stroke-width="3" stroke-linejoin="round"/>
    <rect x="176" y="34" width="10" height="116" fill="#A33A2A"/>
    <path d="M166 150 V138 H178" fill="none" stroke="#FFF7EC" stroke-width="2"/>`;
  if (k !== 1) {
    return svgWrap(300, 185, `Triângulo retângulo: a linha do chão até o topo da chaminé mede ${d.L} m e faz 30° com o chão; a altura h é a pergunta`,
      tri + `<path d="M58 150 A38 38 0 0 0 54 132" fill="none" stroke="#FFB02E" stroke-width="2.5"/>${T(70, 143, '30°', '#FFB02E', 13, 'start')}`
      + T(100, 174, 'chão', '#FFF7EC', 16) + T(192, 100, 'h = ?', '#FF2E93', 16, 'start') + T(88, 84, `${d.L} m`, '#22E3FF', 16, 'end'));
  }
  const bulbs = [0.2, 0.4, 0.6, 0.8].map(f => `<circle cx="${20 + 160 * f}" cy="${150 - 110 * f}" r="4" fill="#FFB02E"/>`).join('');
  return svgWrap(300, 185, `Triângulo retângulo: a chaminé tem ${d.h} m de altura e o ponto no chão fica a ${d.a} m do pé dela; o comprimento do cabo é a pergunta`,
    tri + bulbs + T(100, 174, `chão: ${d.a} m`, '#FFF7EC', 16) + T(192, 100, `altura: ${d.h} m`, '#FF2E93', 16, 'start') + T(88, 84, 'cabo = ?', '#22E3FF', 16, 'end'));
}

/** Arena: ocupação em % (etapa A) ou ingresso com desconto (etapa B). */
function percentSvg(d, k) {
  if (k !== 1) {
    const w = 200 * d.p / 100;
    return svgWrap(220, 90, `Barra de ocupação da Arena: ${d.p}% de ${fmtBig(d.C)} lugares`,
      `<rect x="10" y="30" width="200" height="30" rx="4" fill="rgba(255,247,236,0.1)" stroke="#FFF7EC" stroke-width="2"/>
       <rect x="10" y="30" width="${w}" height="30" rx="4" fill="#22E3FF"/>${T(10 + w / 2, 51, `${d.p}%`, '#1A0833', 15)}
       ${T(10, 20, '0', '#BBA8D6', 12, 'start')}${T(210, 20, `100% = ${fmtBig(d.C)}`, '#BBA8D6', 12, 'end')}${T(110, 82, 'público = ?', '#FFB02E', 14)}`);
  }
  return svgWrap(220, 110, `Ingresso de ${d.P} reais com desconto de ${d.dsc}%`,
    `<path d="M15 20 H205 V45 A12 12 0 0 0 205 69 V94 H15 V69 A12 12 0 0 0 15 45 Z" fill="#FFF7EC" stroke="#1A0833" stroke-width="2"/>
     <line x1="150" y1="24" x2="150" y2="90" stroke="#1A0833" stroke-dasharray="4 4"/>
     ${T(82, 55, 'INGRESSO', '#2B0B4F', 14)}${T(82, 80, `R$ ${d.P}`, '#2B0B4F', 20, 'middle', 800)}
     ${T(174, 62, `−${d.dsc}%`, '#D4145A', 14, 'middle', 800)}`);
}

/** Aeroporto: distância voada no tempo (etapa A) ou distância até a próxima parada (etapa B). */
function flightSvg(d, k) {
  const plane = (x, y) => `<path d="M${x} ${y} l16 -4 l-6 -10 h5 l10 9 l14 -3 c5 -1 5 5 0 6 l-14 3 l-10 9 h-5 l6 -10 z" fill="#FFF7EC"/>`;
  const line = (label, time) => `<line x1="20" y1="60" x2="200" y2="60" stroke="#22E3FF" stroke-width="3" stroke-dasharray="8 6"/>
    <circle cx="20" cy="60" r="6" fill="#B6FF3B"/><circle cx="200" cy="60" r="6" fill="#FF2E93"/>
    ${T(110, 90, label, '#FFF7EC', 15)}${T(110, 112, time, '#FFB02E', 15)}`;
  if (k !== 1) return svgWrap(220, 120, `O avião voa ${d.D} km em ${d.t} minutos`, line(`${d.D} km`, `${d.t} min`) + plane(150, 52));
  return svgWrap(220, 120, `Faltam ${fmtBig(d.K)} km até a próxima parada, a ${d.v} km por minuto`, line(`${fmtBig(d.K)} km`, '? min') + plane(30, 52));
}

/** Treino: painel retangular com base e altura. */
function rectSvg(d, k) {
  const W = 170, H = 110, x = 25, y = 18, w = W - 50, h = H - 40;
  const tiles = k === 1 ? Array.from({ length: d.b * d.a }, (_, i) => {
    const cw = w / d.b, ch = h / d.a, c = i % d.b, l = Math.floor(i / d.b);
    return `<rect x="${x + c * cw + 1}" y="${y + l * ch + 1}" width="${cw - 2}" height="${ch - 2}" fill="${(c + l) % 2 ? '#7B3FE4' : '#FF2E93'}" opacity=".55"/>`;
  }).join('') : '';
  return svgWrap(W + 30, H + 20, `Painel retangular de ${d.b} m de base e ${d.a} m de altura`,
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#2B0B4F" stroke="#22E3FF" stroke-width="3"/>${tiles}`
    + T(x + w / 2, y + h + 20, `base ${d.b} m`, '#FFB02E', 14) + T(x + w + 26, y + h / 2 + 5, `${d.a} m`, '#FFB02E', 14));
}

const MISSION = {
  0: {
    title: 'Treino com a Isa', area: 'Como jogar', topic: 'Área do retângulo',
    brief: '{nick}, aqui é só treino: não vale ponto. Vou te mostrar cada parte da missão.',
    hint: 'A área de um retângulo é base × altura. Aqui: 3 × 4.',
    alt: 'Orla do Guaíba ao pôr do sol, com a chaminé da Usina do Gasômetro.',
    gen() { return { b: 3, a: 4, A: 12 }; },
    stages: d => [
      { type: 'build', data: [['Base do painel', `${d.b} m`], ['Altura do painel', `${d.a} m`]],
        title: 'Relembre a fórmula para calcular a área do retângulo', question: 'Monte a conta da área do painel.',
        template: ['A = ', slot(d.b), ' · ', slot(d.a)], swap: [[0, 1]],
        chips: makeChips([d.b, d.a], [7, 12]),
        result: `A área do painel é ${d.A} m².` },
      { type: 'choice', data: [['Área do painel', `${d.A} m²`], ['Cada azulejo cobre', '1 m²']],
        question: 'Quantos azulejos de 1 m² cobrem o painel inteiro?', unit: 'azulejos', correct: d.A,
        distractors: [d.b + d.a, 2 * (d.b + d.a), 24] }
    ],
    figure: (d, k) => rectSvg(d, k),
    learn: ['A área mede o tamanho de uma superfície. No retângulo, multiplica a base pela altura: 3 m × 4 m = 12 m².', 'Se cada azulejo cobre 1 m², o número de azulejos é igual à área: 12 m² pedem 12 azulejos.'],
    solution: d => [`Área: ${d.b} · ${d.a} = ${d.A} m².`, `Azulejos: ${d.A} m² ÷ 1 m² = ${d.A} azulejos.`]
  },
  1: {
    title: 'Mercado Público', area: 'Geometria', topic: 'Áreas e volumes (cilindro)',
    brief: '{nick}, partiu Mercado Público! Uma banca vai encher um tonel cilíndrico de suco e precisa saber quanto cabe nele. Bora medir?',
    hint: 'A base do tonel é um círculo: área = π · r · r (r é o raio, a metade do diâmetro), com π = 3,14. Depois, volume = área da base × altura. Pra passar de m³ pra litros, multiplica por 1.000. Salva essa dica!',
    alt: 'Fachada amarela do Mercado Público de Porto Alegre ao pôr do sol, com uma banca de frutas e um tonel de madeira em primeiro plano.',
    gen() {
      const r = pick([0.5, 1, 1.5]), h = pick([1, 2]);
      const A = round2(3.14 * r * r);
      return { r, h, A, B: round2(A * h * 1000) };
    },
    stages: d => [
      { type: 'build', data: [['Raio da base do tonel', `${fmt(d.r)} m`], ['Altura do tonel', `${fmt(d.h)} m`], ['Use π', '3,14']],
        title: 'Relembre a fórmula para calcular a área da base do cilindro', question: 'Monte a conta da área da base do tonel.',
        template: ['A = ', slot('3,14'), ' · ', slot(fmt(d.r)), '²'],
        chips: makeChips(['3,14', fmt(d.r)], [fmt(2 * d.r), fmt(d.h), '2']),
        result: `Área da base: ${fmt(d.A)} m² (arredondada para duas casas).` },
      { type: 'choice', data: [['Área da base', `${fmt(d.A)} m²`], ['Altura do tonel', `${fmt(d.h)} m`], ['Conversão', '1 m³ = 1.000 L']],
        question: 'Quantos litros cabem no tonel?', unit: 'litros', correct: d.B,
        distractors: [round2(d.A * d.h), round2(d.A * d.h * 100), round2(3.14 * 4 * d.r * d.r * d.h * 1000)] }
    ],
    figure: d => cylinderSvg(d.r, d.h),
    learn: ["A base do tonel é um círculo, e a área do círculo é π · r²: o raio ao quadrado vezes π (≈ 3,14). Cuidado para não usar o diâmetro, que é o dobro do raio.", "O volume de um cilindro é a área da base vezes a altura (V = A · h), e o resultado sai em m³. Em 1 m³ cabem 1.000 litros, então é só multiplicar por 1.000."],
    solution: d => [
      `Área da base: 3,14 · ${fmt(d.r)}² = ${fmt(d.A)} m².`,
      `Volume: ${fmt(d.A)} · ${fmt(d.h)} = ${fmt(round2(d.A * d.h))} m³, ou seja, ${fmtBig(d.B)} litros.`
    ]
  },
  2: {
    title: 'Parque Redenção', area: 'Geometria', topic: 'Geometria analítica (ponto médio e distância)',
    brief: '{nick}, hoje o rolê é na Redenção! A galera vai se encontrar no meio do caminho entre o lago dos pedalinhos e o Brique. Bora achar esse ponto e a distância?',
    hint: 'Ponto médio: é a média, x = (x₁ + x₂) ÷ 2. Distância: desenha um triângulo retângulo entre os dois pontos. Um cateto é quanto andou no x, o outro é quanto andou no y, e a distância é a hipotenusa (Pitágoras). GG!',
    alt: 'Vista aérea do Parque Farroupilha, a Redenção, ao entardecer, com o lago dos pedalinhos, o chafariz e dois marcadores rosa.',
    gen() {
      const [dx, dy] = pick([[3, 4], [4, 3], [6, 8], [8, 6]]);
      const x1 = randInt(0, 12 - dx), y1 = randInt(0, 12 - dy);
      const flip = Math.random() < 0.5;
      const P = [x1, flip ? y1 + dy : y1], Q = [x1 + dx, flip ? y1 : y1 + dy];
      return { P, Q, dx, dy, mx: round2((P[0] + Q[0]) / 2), dist: Math.hypot(dx, dy) };
    },
    stages: d => [
      { type: 'build', data: [['Lago dos pedalinhos', `(${d.P[0]}, ${d.P[1]})`], ['Banca do Brique', `(${d.Q[0]}, ${d.Q[1]})`], ['Escala do mapa', '1 unidade = 10 m']],
        title: 'Relembre a fórmula para calcular a coordenada x do ponto médio entre o lago e o Brique', question: 'Monte a conta da coordenada x do ponto de encontro (o ponto médio).',
        template: ['x = (', slot(d.P[0]), ' + ', slot(d.Q[0]), ') ÷ ', slot('2')], swap: [[0, 1]],
        chips: makeChips([d.P[0], d.Q[0], 2], [d.P[1], d.Q[1], 4, d.P[0] + d.Q[0], 1]),
        result: `Ponto médio: x = ${fmt(d.mx)}.` },
      { type: 'choice', data: [['Lago dos pedalinhos', `(${d.P[0]}, ${d.P[1]})`], ['Banca do Brique', `(${d.Q[0]}, ${d.Q[1]})`], ['Escala do mapa', '1 unidade = 10 m']],
        question: 'Qual é a distância em linha reta entre o lago e a banca, em unidades do mapa?', unit: 'unidades', correct: d.dist,
        distractors: [d.dx + d.dy, d.dx * d.dx + d.dy * d.dy, Math.abs(d.dx - d.dy)] }
    ],
    figure: (d, k) => planeSvg(d, k),
    learn: ["O ponto médio fica exatamente no meio do caminho. Por isso a coordenada dele é a média das coordenadas dos dois pontos: soma e divide por 2.", "Entre dois pontos do plano dá para desenhar um triângulo retângulo: um cateto é quanto se anda no x e o outro é quanto se anda no y. A distância em linha reta é a hipotenusa, e sai pelo teorema de Pitágoras: d² = Δx² + Δy²."],
    solution: d => [
      `Ponto médio: x = (${d.P[0]} + ${d.Q[0]}) ÷ 2 = ${fmt(d.mx)}.`,
      `Distância: √(${d.dx}² + ${d.dy}²) = ${d.dist} unidades do mapa, ou ${d.dist * 10} m.`
    ]
  },
  3: {
    title: 'Beira-Rio', area: 'Aritmética', topic: 'Progressão aritmética (PA) e geométrica (PG)',
    brief: '{nick}, dia de show no Beira-Rio! Cada fileira da arquibancada tem mais lugares que a de baixo, e o convite do show se espalha em rodadas. Bora organizar?',
    hint: 'PA: cada fileira soma a mesma quantidade, então aₙ = a₁ + (n − 1) · r. PG: cada rodada multiplica pelo mesmo número, então dá pra ir multiplicando rodada por rodada. Na PA você soma; na PG você multiplica.',
    alt: 'Estádio de assentos vermelhos à beira do lago ao pôr do sol, com fileiras de arquibancada que se alargam para cima.',
    gen() {
      const a1 = pick([5, 6, 8]), r = pick([2, 3]), n = pick([4, 5, 6]);
      const g1 = pick([2, 3]), q = pick([2, 3]), m = pick([3, 4]);
      return { a1, r, n, an: a1 + (n - 1) * r, g1, q, m, gm: g1 * q ** (m - 1) };
    },
    stages: d => [
      { type: 'build', data: [['1ª fileira do setor', `${d.a1} cadeiras`], ['Cada fileira acima', `+${d.r} cadeiras`], ['Fileira procurada', `${d.n}ª`]],
        title: `Relembre a fórmula para calcular o termo geral da PA e descobrir quantas cadeiras tem a ${d.n}ª fileira`, question: `Monte a conta das cadeiras da ${d.n}ª fileira.`,
        template: [`a${d.n} = `, slot(d.a1), ' + (', slot(d.n), ' − 1) · ', slot(d.r)],
        chips: makeChips([d.a1, d.n, d.r], [d.a1 + d.r, 1]),
        result: `A ${d.n}ª fileira tem ${d.an} cadeiras.` },
      { type: 'choice', data: [['1ª rodada', `${d.g1} pessoas recebem o convite`], ['Cada pessoa repassa para', `${d.q} amigos`]],
        question: `Quantas pessoas recebem o convite na ${d.m}ª rodada?`, unit: 'pessoas', correct: d.gm,
        distractors: [d.g1 * d.q ** d.m, d.g1 + (d.m - 1) * d.q, d.q ** (d.m - 1), d.g1 * d.q * d.m] }
    ],
    figure: (d, k) => stadiumSvg(d, k),
    learn: ["Numa progressão aritmética (PA), cada termo é o anterior mais um valor fixo, a razão r. Da 1ª até a n-ésima fileira, a razão é somada (n − 1) vezes: aₙ = a₁ + (n − 1) · r.", "Numa progressão geométrica (PG), cada termo é o anterior vezes um valor fixo, a razão q. Por isso os números crescem tão rápido: aₙ = a₁ · qⁿ⁻¹."],
    solution: d => [
      `PA: a${d.n} = ${d.a1} + (${d.n} − 1) · ${d.r} = ${d.an} cadeiras.`,
      `PG: a${d.m} = ${d.g1} · ${d.q}^${d.m - 1} = ${d.gm} pessoas.`
    ]
  },
  4: {
    title: 'Usina do Gasômetro', area: 'Trigonometria', topic: 'Razões trigonométricas e Pitágoras',
    brief: '{nick}, cheguei na Usina do Gasômetro bem na hora do pôr do sol! Vão pendurar um cabo de luzes do topo da chaminé até o chão. Bora descobrir a altura da chaminé e o tamanho do cabo?',
    hint: 'No triângulo retângulo: seno = cateto oposto ÷ hipotenusa, então cateto oposto = hipotenusa · seno (sen 30° = 0,5). Pro cabo, é Pitágoras: a chaminé e o chão são os catetos e o cabo é a hipotenusa, cabo² = altura² + chão².',
    alt: 'Usina do Gasômetro, de tijolos vermelhos e chaminé alta, à beira do Guaíba ao pôr do sol.',
    gen() {
      const L = pick([40, 60, 80, 100]), h = L / 2;
      const [a, c] = pick({ 20: [[15, 25], [48, 52]], 30: [[40, 50], [16, 34]], 40: [[30, 50], [42, 58]], 50: [[120, 130]] }[h]);
      return { L, h, a, c };
    },
    stages: d => [
      { type: 'build', data: [['Linha do chão até o topo da chaminé', `${d.L} m (hipotenusa)`], ['Ângulo com o chão', '30°'], ['Tabela', 'sen 30° = 0,5 · cos 30° ≈ 0,87']],
        title: 'Relembre a fórmula para calcular a altura da chaminé usando o seno de 30°', question: 'Monte a conta da altura da chaminé (o cateto oposto ao ângulo de 30°).',
        template: ['h = ', slot(d.L), ' · ', slot('0,5')],
        chips: makeChips([d.L, '0,5'], ['0,87', 30, 2]),
        result: `A chaminé tem ${d.h} m de altura.` },
      { type: 'choice', data: [['Altura da chaminé', `${d.h} m`], ['Do pé da chaminé até o ponto no chão', `${d.a} m`], ['Ângulo entre a chaminé e o chão', '90°']],
        question: 'O cabo de luzes vai do topo da chaminé até esse ponto no chão. Qual é o comprimento do cabo?', unit: 'm', correct: d.c,
        distractors: [d.h + d.a, Math.abs(d.a - d.h), d.c + 10, d.h * 2] }
    ],
    figure: (d, k) => chimneySvg(d, k),
    learn: ["Num triângulo retângulo, o seno de um ângulo é o cateto oposto dividido pela hipotenusa. Então cateto oposto = hipotenusa · seno. Como sen 30° = 0,5, o lado oposto a 30° é sempre a metade da hipotenusa.", "O teorema de Pitágoras vale em todo triângulo retângulo: a soma dos quadrados dos catetos é igual ao quadrado da hipotenusa (c² = a² + b²). Aqui, a chaminé e o chão são os catetos, e o cabo é a hipotenusa."],
    solution: d => [
      `Altura: h = ${d.L} · sen 30° = ${d.L} · 0,5 = ${d.h} m.`,
      `Cabo: c² = ${d.h}² + ${d.a}² = ${d.h * d.h + d.a * d.a}, então c = ${d.c} m.`
    ]
  },
  5: {
    title: 'Arena do Grêmio', area: 'Aritmética', topic: 'Porcentagem',
    brief: '{nick}, hoje a live é na Arena! A transmissão quer saber quanta gente veio ao jogo, e eu quero descobrir quanto sai o ingresso com desconto de estudante. Bora calcular?',
    hint: 'Porcentagem é uma fração de 100: p% de um valor = valor · p ÷ 100. Pra um desconto, calcula quanto é o desconto e tira do preço cheio.',
    alt: 'Estádio de assentos azuis ao entardecer, com uma grua de TV erguendo a câmera sobre o gramado.',
    gen() {
      const C = pick([40000, 50000, 60000]), p = pick([50, 60, 75, 80, 90]);
      const P = pick([40, 60, 80, 100]), dsc = pick([10, 20, 25, 50]);
      return { C, p, pub: C * p / 100, P, dsc, final: P - P * dsc / 100 };
    },
    stages: d => [
      { type: 'build', data: [['Lugares na Arena', `${fmtBig(d.C)}`], ['Ocupação hoje', `${d.p}%`]],
        title: 'Relembre a fórmula para calcular a porcentagem do público presente no jogo', question: 'Monte a conta de quantas pessoas vieram ao jogo.',
        template: ['público = ', slot(fmtBig(d.C)), ' · ', slot(d.p), ' ÷ ', slot(100)],
        chips: makeChips([fmtBig(d.C), d.p, 100], [10, 100 - d.p, '1.000']),
        result: `Vieram ${fmtBig(d.pub)} pessoas ao jogo.` },
      { type: 'choice', data: [['Preço do ingresso', `R$ ${d.P}`], ['Desconto de estudante', `${d.dsc}%`]],
        question: 'Quanto o estudante paga no ingresso, já com o desconto?', unit: 'reais', correct: d.final,
        distractors: [d.P * d.dsc / 100, d.P - d.dsc, d.P + d.P * d.dsc / 100] }
    ],
    figure: (d, k) => percentSvg(d, k),
    learn: ["Porcentagem quer dizer \"por cem\": 75% são 75 de cada 100. Para achar p% de um total, multiplica o total por p e divide por 100.", "Num desconto, primeiro você acha quanto vale a porcentagem do preço e depois tira esse valor do preço cheio. Atalho: com 25% de desconto, você paga 75% do preço."],
    solution: d => [
      `Público: ${fmtBig(d.C)} · ${d.p} ÷ 100 = ${fmtBig(d.pub)} pessoas.`,
      `Desconto: ${d.P} · ${d.dsc} ÷ 100 = ${fmt(d.P * d.dsc / 100)} reais, então o ingresso sai por ${d.P} − ${fmt(d.P * d.dsc / 100)} = ${fmt(d.final)} reais.`
    ]
  },
  6: {
    title: 'Aeroporto Salgado Filho', area: 'Aritmética', topic: 'Razão, proporção e regra de três',
    brief: 'Muito bem, {nick}! Você chegou até o aeroporto. Para escapar, precisamos correr em direção ao avião na velocidade certa. Você consegue descobrir?',
    hint: 'Razão: quilômetros ÷ minutos dá quantos km o avião anda em 1 minuto. Regra de três: se em 1 minuto ele anda v km, pra andar a distância toda ele leva distância ÷ v minutos.',
    alt: 'Aeroporto ao pôr do sol, com terminal envidraçado, torre de controle e um avião subindo logo depois da decolagem.',
    gen() {
      const v = pick([10, 12, 15]), t = pick([2, 3, 4]), T = pick([20, 25, 30, 40]);
      return { v, t, D: v * t, T, K: v * T };
    },
    stages: d => [
      { type: 'build', data: [['Distância percorrida', `${d.D} km`], ['Tempo', `${d.t} minutos`]],
        title: 'Relembre a fórmula para calcular a razão entre distância e tempo (km por minuto)', question: `O avião está decolando e, na pista, percorre ${d.D} km em ${d.t} minutos. Monte a conta de quantos quilômetros ele percorre em 1 minuto.`,
        template: ['km por minuto = ', slot(d.D), ' ÷ ', slot(d.t)],
        chips: makeChips([d.D, d.t], [60, d.D + d.t, d.t * 2]),
        result: `O avião anda ${d.v} km por minuto.` },
      { type: 'choice', data: [['Velocidade do avião', `${d.v} km por minuto`], ['Distância até o destino', `${fmtBig(d.K)} km`]],
        question: 'Você conseguiu chegar ao avião! Em quantos minutos você chegará ao seu destino?', unit: 'min', correct: d.T,
        distractors: [d.K / d.D, d.T * 2, d.T + d.t, d.K / 10] }
    ],
    figure: (d, k) => flightSvg(d, k),
    learn: ["Razão é a comparação de duas grandezas por divisão. Quilômetros divididos por minutos dá a velocidade: quantos quilômetros o avião anda em 1 minuto.", "Regra de três: com a velocidade constante, distância e tempo são proporcionais. Se em 1 minuto o avião anda v km, para a distância toda ele leva distância ÷ v minutos."],
    solution: d => [
      `Razão: ${d.D} km ÷ ${d.t} min = ${d.v} km por minuto.`,
      `Regra de três: ${fmtBig(d.K)} km até o destino ÷ ${d.v} km por minuto = ${d.T} minutos.`
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
  3: [['Khan Academy · progressões aritméticas e geométricas', khan('progressão aritmética geométrica')], ['YouTube · termo geral da PA e da PG', yt('termo geral PA PG aula')]],
  4: [['Khan Academy · razões trigonométricas no triângulo retângulo', khan('seno cosseno tangente triângulo retângulo')], ['YouTube · teorema de Pitágoras', yt('teorema de Pitágoras aula')]],
  5: [['Khan Academy · porcentagem', khan('porcentagem desconto')], ['YouTube · porcentagem e desconto', yt('porcentagem desconto aula')]],
  6: [['Khan Academy · razão e proporção', khan('razão proporção regra de três')], ['YouTube · regra de três simples', yt('regra de três simples aula')]]
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
const LEVEL = { 0: 'Começando', 1: 'Aquecendo', 2: 'Em evolução', 3: 'Mandando bem', 4: 'Brabo das contas', 5: 'Lenda de Porto Alegre' };
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
    v: 7, started: true, jornadaId: newJourneyId(), player: null,
    data: Object.fromEntries(MISSIONS.map(n => [n, MISSION[n].gen()])),
    stage: perMission(0), stageErrors: perMission(0),
    done: perMission(false), skipped: perMission(false), errors: perMission(0), hint: perMission(false),
    options: perMission(null), tried: Object.fromEntries(MISSIONS.map(n => [n, []])), briefSeen: perMission(false),
    current: 1, activeMs: 0, completed: false, finalMs: 0, submitted: false, usedTest: false
  };
}
function loadState() {
  try {
    const data = JSON.parse(localStorage.getItem(STORE_KEY));
    return data && data.v === 7 && data.data ? data : null;
  } catch (e) { return null; }
}
function save() { try { localStorage.setItem(STORE_KEY, JSON.stringify(S)); } catch (e) { /* segue sem salvar */ } }

const finished = n => S.done[n] || S.skipped[n];
/* As missões liberam uma após a outra: cada uma abre quando a anterior termina
   (concluída ou pulada). A 6 (Aeroporto) também precisa de pelo menos 3 estrelas.
   Sem as estrelas, dá para finalizar a live com a nota normal. */
const LAST = 6;
const STARS_TO_FLY = 3;   // estrelas necessárias para liberar o Aeroporto
const othersFinished = () => MISSIONS.filter(m => m !== LAST).every(finished);
const enoughStars = () => starsFor(totalPoints()) >= STARS_TO_FLY;
const previous = n => MISSIONS[MISSIONS.indexOf(n) - 1];
const unlocked = n => MISSIONS.slice(0, MISSIONS.indexOf(n)).every(finished) && (n !== LAST || enoughStars());
/** As 5 missões terminaram, mas faltam estrelas: o jogador pode finalizar a live (o Aeroporto vale 0). */
const stuckBeforeAirport = () => othersFinished() && !enoughStars() && !finished(LAST);
const allFinished = () => MISSIONS.every(finished);

/* Tempo ativo: conta só com a aba visível, durante o jogo */
let lastTick = performance.now();
setInterval(() => {
  const now = performance.now();
  if (S && S.started && !S.completed && document.visibilityState === 'visible' && (screen === 'mapa' || (screen === 'missao' && S.current !== 0))) {
    S.activeMs += Math.min(now - lastTick, 5000);
  }
  lastTick = now;
}, 1000);
document.addEventListener('visibilitychange', () => { lastTick = performance.now(); if (S) save(); });

/* Botão de som no topo: liga e desliga a trilha e as vinhetas */
function renderSound() {
  const on = music.enabled;
  $('nav-sound').setAttribute('aria-pressed', String(on));
  $('nav-sound').setAttribute('aria-label', on ? 'Desligar o som' : 'Ligar o som');
  $('nav-sound-icon').setAttribute('href', on ? '#i-sound' : '#i-mute');
}
$('nav-sound').addEventListener('click', () => { music.setEnabled(!music.enabled); renderSound(); });
renderSound();

/* ---------------------------------------------------------------
   5. NAVEGAÇÃO
   --------------------------------------------------------------- */
let screen = 'inicio';
const SCREENS = { inicio: 's-inicio', identificacao: 's-identificacao', mapa: 's-mapa', missao: 's-missao', fim: 's-fim' };

/* Varredura diagonal ao trocar de tela; ao abrir uma missão, segura um instante com o nome do lugar */
let wipeTimer = 0;
function playWipe(card) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const el = $('wipe');
  el.classList.remove('is-on', 'has-card');
  el.style.setProperty('--hold', card ? '650ms' : '60ms');
  if (card) { $('wipe-eyebrow').textContent = card.eyebrow; $('wipe-title').textContent = card.title; el.classList.add('has-card'); }
  void el.offsetWidth;   // reinicia a animação
  el.classList.add('is-on');
  clearTimeout(wipeTimer);
  wipeTimer = setTimeout(() => el.classList.remove('is-on', 'has-card'), (card ? 650 : 60) + 140 + 560);
}

function show(name) {
  if (name !== screen) playWipe(name === 'missao' && S ? { eyebrow: MISSION[S.current].area, title: MISSION[S.current].title } : null);
  screen = name;
  Object.entries(SCREENS).forEach(([key, id]) => { $(id).hidden = key !== name; });
  const playing = S && S.started && (name === 'mapa' || name === 'missao' || name === 'fim');
  $('nav-score').hidden = !playing;
  $('nav-map').hidden = name !== 'missao';
  $('test-fab').hidden = !(TEST && name === 'missao');
  music.play(name === 'missao' ? ({ 3: 'beirario', 5: 'arena' })[S.current] || 'mapa' : name === 'mapa' || name === 'fim' ? 'mapa' : 'abertura');
  if (name !== 'mapa' && name !== 'missao') coach.stop();
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
    $('resume-info').textContent = `${S.player ? S.player.name + ' · ' : ''}${totalPoints()} pts · missão cumprida`;
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
/* Stepper da criação do personagem: 1 nome e personagem, 2 visual, 3 cenário */
let idStep = 1;
function setIdStep(n) {
  idStep = n;
  document.querySelectorAll('#s-identificacao .av-step').forEach(s => { s.hidden = Number(s.dataset.step) !== n; });
  document.querySelectorAll('#av-steps li').forEach(li => {
    const k = Number(li.dataset.step);
    li.classList.toggle('is-done', k < n);
    if (k === n) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current');
  });
  AVATAR.placeMirror(n);
  $('id-next-text').textContent = n < 3 ? 'Próximo' : 'Bora jogar';
  window.scrollTo(0, 0);
  const h = document.querySelector(`#s-identificacao .av-step[data-step="${n}"] h1`);
  if (h && n > 1) h.focus({ preventScroll: true });
}
$('id-back').addEventListener('click', () => { if (idStep > 1) setIdStep(idStep - 1); else show('inicio'); });

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
  AVATAR.load(last && last.avatar);
  setIdStep(1);
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
  if (nameMsg || classMsg) { setIdStep(1); (nameMsg ? $('id-name') : $('id-class')).focus(); return; }
  if (idStep < 3) { setIdStep(idStep + 1); return; }
  checkingName = true;
  const serverMsg = await serverNameProblem(name);
  checkingName = false;
  if (serverMsg) { setIdStep(1); setFieldMessage($('id-name'), $('id-name-msg'), serverMsg); $('id-name').focus(); return; }
  const player = { name, turma, turmaId, avatar: AVATAR.get() };
  try { localStorage.setItem(PLAYER_KEY, JSON.stringify(player)); } catch (e) { /* segue sem lembrar */ }
  S = freshState();
  S.player = player;
  if (!tutorialSeen()) S.tutorial = 'convite';
  save();
  show('mapa');
  if (S.tutorial === 'convite') inviteTraining();
});
AVATAR.setup();
$('id-name').addEventListener('input', () => setFieldMessage($('id-name'), $('id-name-msg'), ''));
$('id-class').addEventListener('change', () => setFieldMessage($('id-class'), $('id-class-msg'), ''));

/* ---------------------------------------------------------------
   7. MAPA DE MISSÕES
   --------------------------------------------------------------- */
/* Por que o card está bloqueado */
function lockText(n) {
  if (n === LAST && othersFinished()) return `Precisa de ${STARS_TO_FLY} estrelas · você tem ${starsFor(totalPoints())}`;
  return `Termine ${MISSION[previous(n)].title} para liberar${n === LAST ? ` e junte ${STARS_TO_FLY} estrelas` : ''}`;
}

function renderMapa() {
  $('map-avatar').src = IMG.avatar;
  $('map-me').hidden = !(S.player && S.player.avatar);
  if (S.player && S.player.avatar) AVATAR.paint($('map-me'), AVATAR.normalize(S.player.avatar), [16, 4, 96]);
  const next = MISSIONS.find(n => !finished(n));
  const first = !MISSIONS.some(finished);
  $('map-eyebrow').textContent = S.player ? `Partiu, ${S.player.name}` : 'Mapa da cidade';
  const tip = first
    ? `Fala, ${nick()}! Eu sou a Isa e vou te ajudar a completar as missões de hoje. Ao final, você consegue chegar ao aeroporto e fugir da cidade. Bora?`
    : stuckBeforeAirport() ? `Ih, ${nick()}, faltou estrela pra liberar o Aeroporto: você fez ${starsFor(totalPoints())} e precisava de ${STARS_TO_FLY}. Mas de boa: dá pra finalizar a live e sua nota vale do mesmo jeito.`
    : next === LAST ? `Liberou o Aeroporto Salgado Filho, ${nick()}! Última missão antes de escapar. Bora decolar?`
      : next ? `Mandou bem até aqui! Próxima parada: ${MISSION[next].title}. Faltam ${MISSIONS.filter(m => m !== LAST && !finished(m)).length} antes do Aeroporto. Tô torcendo, ${nick()}!`
      : 'Todas as missões feitas! Bora ver o resultado da live.';
  // A fala abre sozinha quando muda (início, depois de cada missão); senão, o avatar fica pulsando
  if (tip !== S.mapTip && next === LAST && !first) music.sfx('aeroporto');
  if (S.tutorial === 'convite') { mapTip.text = tip; S.mapTip = tip; save(); }
  else if (tip !== S.mapTip) { S.mapTip = tip; save(); openMapTip(); } else { mapTip.text = tip; if ($('map-tip').hidden) $('map-avatar-btn').classList.add('is-pulse'); }
  $('missions').innerHTML = MISSIONS.map(n => {
    const M = MISSION[n];
    const open = unlocked(n);
    const status = S.done[n] ? `<span class="mcard__status is-done">${icon('check', 'icon icon--sm')} Concluída · ${missionPoints(n)} pts</span>`
      : S.skipped[n] ? `<span class="mcard__status is-skip">${icon('skip', 'icon icon--sm')} Pulada · 0 pts</span>`
        : open ? `<span class="mcard__status is-open">${icon('play', 'icon icon--sm')} ${S.stage[n] || S.errors[n] ? 'Em andamento' : 'Disponível'} · até 100 pts</span>`
          : `<span class="mcard__status">${icon('lock', 'icon icon--sm')} ${lockText(n)}</span>`;
    return `<li><button type="button" class="mcard" data-mission="${n}" ${open ? '' : 'disabled'}
        aria-label="${M.title}. ${M.topic}. ${open ? (finished(n) ? 'Ver de novo' : 'Jogar') : `Bloqueada. ${lockText(n)}`}">
      <span class="mcard__img"><img src="${IMG.card[n]}" alt="">
        ${open ? '' : `<span class="mcard__lock">${icon('lock')}</span>`}</span>
      <span class="mcard__body">
        <span class="eyebrow">${M.area}</span>
        <span class="mcard__title">${M.title}</span>
        <span class="mcard__topic">${M.topic}</span>
        ${status}
      </span></button></li>`;
  }).join('');
  $('missions-dots').innerHTML = MISSIONS.map((n, i) => `<button type="button" class="carousel-dot" data-dot="${i}" aria-label="Ir para ${MISSION[n].title}"></button>`).join('');
  $('map-finish').hidden = !stuckBeforeAirport();
  requestAnimationFrame(() => carousel.center(Math.max(0, MISSIONS.indexOf(next ?? MISSIONS[0])), false));
}

/* Carrossel 3D das missões no celular: rolagem nativa com snap; cada card gira e
   encolhe conforme se afasta do centro. Tocar num card lateral só traz ele para o centro. */
const carousel = (() => {
  const mq = window.matchMedia('(max-width: 640px)');
  const track = $('missions');
  const items = () => [...track.children];
  const offset = li => (li.offsetLeft + li.offsetWidth / 2 - track.scrollLeft - track.clientWidth / 2) / li.offsetWidth;
  let frame = 0;
  function update() {
    frame = 0;
    const list = items();
    if (!mq.matches) { list.forEach(li => { li.style.transform = li.style.opacity = li.style.zIndex = ''; }); return; }
    let active = 0, best = Infinity;
    list.forEach((li, i) => {
      const d = offset(li), a = Math.min(Math.abs(d), 2);
      if (a < best) { best = a; active = i; }
      li.style.transform = `perspective(900px) translateZ(${-a * 90}px) rotateY(${Math.max(-1.5, Math.min(1.5, d)) * -32}deg)`;
      li.style.opacity = String(1 - a * 0.28);
      li.style.zIndex = String(10 - Math.round(a * 3));
    });
    document.querySelectorAll('.carousel-dot').forEach((dot, i) => { dot.classList.toggle('is-active', i === active); dot.setAttribute('aria-current', i === active ? 'true' : 'false'); });
  }
  const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
  function center(i, smooth = true) {
    const li = items()[i];
    if (!li) return;
    if (mq.matches) track.scrollTo({ left: li.offsetLeft + li.offsetWidth / 2 - track.clientWidth / 2, behavior: smooth && !window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'smooth' : 'auto' });
    update();
  }
  const isSide = li => mq.matches && Math.abs(offset(li)) > 0.3;
  track.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);
  mq.addEventListener('change', schedule);
  $('missions-dots').addEventListener('click', event => { const dot = event.target.closest('[data-dot]'); if (dot) center(Number(dot.dataset.dot)); });
  return { center, update, isSide, index: li => items().indexOf(li) };
})();

/* Tooltip da Isa (mapa e missões): texto digitado, fecha no ×, no Esc ou tocando fora.
   Fechado, o avatar pulsa e reabre o tooltip. */
function makeTip(prefix, screenName, onClose) {
  const tip = { timer: null, text: '' };
  const el = () => $(`${prefix}-tip-text`);
  const finishTyping = () => { clearInterval(tip.timer); tip.timer = null; el().textContent = tip.text; el().classList.remove('is-typing'); $(`${prefix}-avatar`).src = IMG.avatar; };
  tip.open = text => {
    if (text != null) tip.text = text;
    $(`${prefix}-tip`).hidden = false;
    $(`${prefix}-avatar-btn`).classList.remove('is-pulse');
    $(`${prefix}-avatar-btn`).setAttribute('aria-expanded', 'true');
    $(`${prefix}-tip-full`).textContent = tip.text;
    clearInterval(tip.timer);
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { finishTyping(); return; }
    let i = 0;
    el().textContent = '';
    el().classList.add('is-typing');
    // Boca mexendo: troca o quadro do avatar a cada 6 letras (cerca de 7 vezes por segundo), fechando nas pausas
    tip.timer = setInterval(() => {
      i += 1;
      el().textContent = tip.text.slice(0, i);
      if (i % 6 === 0) $(`${prefix}-avatar`).src = /[\s.,!?]/.test(tip.text[i - 1]) || $(`${prefix}-avatar`).src === IMG.avatar ? IMG.avatarFala : IMG.avatar;
      if (i >= tip.text.length) finishTyping();
    }, 24);
  };
  tip.close = () => {
    if ($(`${prefix}-tip`).hidden) return;
    finishTyping();
    $(`${prefix}-tip`).hidden = true;
    $(`${prefix}-avatar-btn`).setAttribute('aria-expanded', 'false');
    $(`${prefix}-avatar-btn`).classList.add('is-pulse');
    if (onClose) onClose();
  };
  tip.reset = () => {   // estado inicial ao trocar de tela: fechado e sem pulsar
    clearInterval(tip.timer); tip.timer = null;
    $(`${prefix}-tip`).hidden = true;
    $(`${prefix}-avatar-btn`).classList.remove('is-pulse');
    $(`${prefix}-avatar-btn`).setAttribute('aria-expanded', 'false');
  };
  $(`${prefix}-tip-close`).addEventListener('click', tip.close);
  $(`${prefix}-avatar-btn`).addEventListener('click', () => { if ($(`${prefix}-tip`).hidden) tip.open(); else tip.close(); });
  $(`${prefix}-tip`).addEventListener('click', event => { if (tip.timer && !event.target.closest('.tip__close')) finishTyping(); });   // tocar no texto mostra tudo
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && screen === screenName) tip.close(); });
  // Tocar fora só fecha o tooltip: o toque não chega no que está embaixo (card, link, botão)
  document.addEventListener('pointerdown', event => {
    if (screen !== screenName || $(`${prefix}-tip`).hidden || event.target.closest(`#${prefix}-tip, #${prefix}-avatar-btn`)) return;
    event.preventDefault();
    event.stopPropagation();
    tip.close();
    swallowNextClick();
  }, true);
  return tip;
}
/* Engole o clique que vem logo depois do toque que fechou um tooltip */
let swallowClickUntil = 0;
function swallowNextClick() { swallowClickUntil = Date.now() + 700; }
document.addEventListener('click', event => {
  if (Date.now() < swallowClickUntil) { event.preventDefault(); event.stopPropagation(); swallowClickUntil = 0; }
}, true);
const mapTip = makeTip('map', 'mapa');
const openMapTip = () => mapTip.open(S.mapTip || '');

/* Finalizar sem o Aeroporto: ele vale 0 e a nota é calculada normalmente */
$('map-finish-btn').addEventListener('click', () => {
  S.skipped[LAST] = true;
  S.noAirport = true;
  S.completed = true;
  S.finalMs = Math.round(S.activeMs);
  save();
  show('fim');
});
$('missions').addEventListener('click', event => {
  const btn = event.target.closest('[data-mission]');
  if (!btn) return;
  const li = btn.closest('li');
  if (event.detail !== 0 && carousel.isSide(li)) { carousel.center(carousel.index(li)); return; }   // card lateral: só centraliza (teclado abre direto)
  if (btn.disabled) return;
  S.current = Number(btn.dataset.mission);
  save();
  show('missao');
  missionTip.reset();
  missionTip.text = missionBrief();
  if (!finished(S.current) && !S.briefSeen[S.current]) openBrief();   // na primeira visita, a Isa apresenta a missão
  else $('m-avatar-btn').classList.add('is-pulse');
});

/* ---------------------------------------------------------------
   8. MISSÃO
   Etapa A: montar a conta (arrastar as peças para as lacunas, ou
   tocar na peça e depois na lacuna). Etapa B: múltipla escolha.
   --------------------------------------------------------------- */
const STAGE_NAMES = ['Relembre a fórmula', 'Resolva o problema'];
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
  $('m-scene').src = IMG.scene[n] || IMG.scene[4];
  $('m-scene').alt = M.alt;
  $('m-avatar').src = IMG.avatar;
  $('m-eyebrow').textContent = M.area;
  const stageKey = `${n}-${closed ? 'fim' : S.stage[n]}`;
  if (renderMissao.last && renderMissao.last !== stageKey && renderMissao.last.split('-')[0] === String(n)) {
    $('m-problem').classList.remove('is-swap'); void $('m-problem').offsetWidth; $('m-problem').classList.add('is-swap');
  }
  renderMissao.last = stageKey;
  $('m-title').textContent = M.title;
  const k = closed ? 1 : S.stage[n];
  $('m-steps').innerHTML = STAGE_NAMES.map((name, i) => {
    const cls = closed || i < S.stage[n] ? 'is-done' : i === k ? 'is-current' : '';
    return `<li class="${cls}"${i === k && !closed ? ' aria-current="step"' : ''}>${name}</li>`;
  }).join('');
  setMsg('');
  $('m-hint-text').textContent = S.hint[n] ? 'Ver a dica da Isa de novo' : n === 0 ? 'Pedir dica à Isa (no treino é de graça)' : 'Pedir dica à Isa (−20 pts)';
  $('m-hint-btn').hidden = closed && !S.hint[n];
  $('m-skip').hidden = closed || S.stageErrors[n] < SCORE.skipAfter;
  $('m-confirm').hidden = closed;
  renderMissionScore();
  $('m-figure').hidden = !M.figure;
  $('m-figure').innerHTML = M.figure ? M.figure(d, closed ? 1 : S.stage[n]) : '';
  if (closed) {
    $('m-build').hidden = true;
    $('m-expr').hidden = true;
    $('m-choice').hidden = true;
    $('m-step-title').textContent = 'Missão finalizada';
    $('m-question').textContent = S.done[n] ? `Missão concluída com ${missionPoints(n)} pontos. A resolução:` : 'Missão pulada. A resolução:';
    $('m-data').innerHTML = M.solution(d).map(line => `<li><span>${escapeHtml(line)}</span></li>`).join('');
    return;
  }
  prepareStage();
  const stage = currentStage();
  $('m-step-title').textContent = stage.title || STAGE_NAMES[S.stage[n]];   // título da seção: enunciado da fórmula; aba segue "Relembre a fórmula"
  $('m-data').innerHTML = stage.data.map(([label, value]) => `<li><span>${label}</span><strong>${value}</strong></li>`).join('');
  $('m-question').textContent = stage.question;
  $('m-build').hidden = stage.type !== 'build';
  $('m-expr').hidden = stage.type !== 'build';
  $('m-choice').hidden = stage.type !== 'choice';
  $('m-confirm-text').textContent = stage.type === 'build' ? 'Conferir conta' : 'Confirmar';
  if (stage.type === 'build') renderBuild(stage); else renderChoice(stage);
}

/* --- Etapa A: montar a conta --- */
function renderBuild(stage) {
  let s = -1;
  const html = stage.template.map(t => {
    if (typeof t === 'string') return `<span class="tok">${escapeHtml(t)}</span>`;
    s += 1;
    const chip = ui.fills[s];
    const label = chip == null ? '' : stage.chips[chip];
    return `<button type="button" class="slot${chip == null ? '' : ' is-filled'}" data-slot="${s}"
      aria-label="Lacuna ${s + 1}: ${chip == null ? 'vazia' : label}${chip == null ? '' : ' (toque para tirar)'}">${escapeHtml(label)}</button>`;
  });
  // "²" e ")" logo depois de uma lacuna ficam grudados nela, para não quebrarem a linha sozinhos
  for (let i = html.length - 1; i > 0; i--) {
    const t = stage.template[i];
    if (typeof t === 'string' && /^[²)]/.test(t) && typeof stage.template[i - 1] === 'object') {
      html.splice(i - 1, 2, `<span class="glue">${html[i - 1]}${html[i]}</span>`);
    }
  }
  $('m-expr').innerHTML = html.join('');
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
    setMsg(`Fórmula certa! ${stage.result} Agora resolva o problema.`, false);
    music.sfx('acerto');
    openLearn(n, stage);
    return;
  }
  ok.forEach((good, i) => { if (!good) ui.fills[i] = null; });
  if (n === 0) coach.note('build-wrong');
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
  if (n === 0) { $('m-score').textContent = 'Treino: aqui nada vale ponto.'; return; }
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

/* Descrição da missão: tooltip preso ao avatar da Isa sobre a cena. Abre sozinho na
   primeira visita a cada missão; depois de fechado, o avatar pulsa e reabre a descrição. */
const missionTip = makeTip('m', 'missao', () => { if (S && !S.briefSeen[S.current]) { S.briefSeen[S.current] = true; save(); } });
const missionBrief = () => MISSION[S.current].brief.replace(/\{nick\}/g, nick());
function openBrief() { missionTip.open(missionBrief()); }

/* Dica: −20 pontos, cobrada uma vez por missão */
$('m-hint-btn').addEventListener('click', () => {
  if (S.current === 0) { S.hint[0] = true; save(); renderMissao(); openHint(); return; }   // no treino, sem cobrança
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

/* "Entenda a matéria": depois de acertar a fórmula, explica o conceito e a conta com os números da partida */
function openLearn(n, stage) {
  $('learn-title').textContent = `Fórmula certa! ${stage.result}`;
  $('learn-text').textContent = MISSION[n].learn[0];
  $('learn-calc').textContent = MISSION[n].solution(S.data[n])[0];
  openDialog($('dlg-learn'));
  $('learn-ok').focus();
}
$('dlg-learn').addEventListener('close', () => coach.signal('learn-closed'));
$('learn-ok').addEventListener('click', () => closeDialog($('dlg-learn'), () => {
  $('live').textContent = 'Fórmula certa. Agora resolva o problema.';
  const first = document.querySelector('#m-options input:not(:disabled)');
  if (first) first.focus();
}));

/* Tela "wasted" (modal): aparece a cada erro e ao pular a missão.
   learn: explicação do conceito da etapa, sem a resposta. */
function openWasted({ sub, action, after, learn }) {
  music.sfx('erro');
  $('wasted-learn').hidden = !learn;
  $('wasted-learn-text').textContent = learn || '';
  $('wasted-sub').textContent = sub;
  $('wasted-ok').textContent = action;
  if (after) closeCallbacks.set($('dlg-wasted'), after);
  document.body.classList.add('is-wasted');
  openDialog($('dlg-wasted'));
  $('wasted-ok').focus();
}
$('dlg-wasted').addEventListener('close', () => { document.body.classList.remove('is-wasted'); coach.signal('wasted-closed'); });
$('dlg-hint').addEventListener('close', () => coach.signal('hint-closed'));
function wastedForError() {
  const n = S.current;
  openWasted({
    sub: n === 0 ? 'Treino: aqui o erro não tira ponto' : S.stageErrors[n] >= SCORE.skipAfter ? '−10 pts · se travar, já dá pra pular' : `−10 pts · tentativa incorreta ${S.stageErrors[n]}`,
    action: 'Tentar de novo',
    learn: MISSION[n].learn[S.stage[n]]
  });
}

/* Pular: liberado após 10 tentativas incorretas na mesma etapa */
$('m-skip').addEventListener('click', () => openDialog($('dlg-skip')));
$('skip-confirm').addEventListener('click', () => closeDialog($('dlg-skip'), () => {
  const n = S.current;
  openWasted({ sub: 'Missão pulada · 0 pts', action: 'Ver a resolução', after: () => completeMission(n, true) });
}));

function completeMission(n, skipped) {
  if (n === 0) { finishTraining(); return; }
  if (skipped) S.skipped[n] = true; else S.done[n] = true;
  if (!skipped) music.sfx('concluida');
  const last = allFinished();
  if (last && !S.completed) { S.completed = true; S.finalMs = Math.round(S.activeMs); }
  save();
  renderScore();
  const pts = missionPoints(n);
  $('rw-eyebrow').textContent = MISSION[n].title;
  $('rw-title').textContent = skipped ? 'Missão pulada' : pick(['Missão concluída! GG!', 'Missão concluída! Brabo!', 'Missão concluída! Nível desbloqueado!']);
  $('rw-pts').innerHTML = `<strong>+${pts}</strong> pts`;
  $('rw-text').textContent = skipped
    ? 'Sem estresse: confere a resolução e salva pra revisar depois.'
    : S.errors[n] === 0 && !S.hint[n] ? `${nick()}, de primeira e sem dica! Pontuação cheia.` : `${nick()}, missão no bolso! Bora pra próxima.`;
  // Explicação: o conceito da etapa "Resolva o problema" e a conta com os números da partida
  const lines = skipped ? MISSION[n].solution(S.data[n]) : [MISSION[n].solution(S.data[n])[1]];
  $('rw-solution').hidden = false;
  $('rw-solution').innerHTML = `<p class="eyebrow">Entenda a matéria</p><p>${escapeHtml(MISSION[n].learn[1])}</p>`
    + `<p class="solution__calc">${lines.map(escapeHtml).join('<br>')}</p>`;
  $('rw-next').textContent = last ? 'Ver meus resultados' : 'Voltar ao mapa';
  openDialog($('dlg-reward'));
}
$('rw-next').addEventListener('click', () => closeDialog($('dlg-reward'), () => { if (S.current === 0) { S.current = MISSIONS.find(m => !finished(m)) || 1; save(); } show(S.completed ? 'fim' : 'mapa'); }));


/* ---------------------------------------------------------------
   8b. TUTORIAL: tour guiado pela Isa e missão de treino
   O coach escurece a tela e destaca um elemento por vez. Passos "info"
   têm botão Próximo; passos "do" esperam o aluno agir (sinal do jogo).
   --------------------------------------------------------------- */
const TUTORIAL_KEY = 'gta-glicerio-tutorial';
const tutorialSeen = () => { try { return localStorage.getItem(TUTORIAL_KEY) === '1'; } catch (e) { return false; } };
const markTutorialSeen = () => { try { localStorage.setItem(TUTORIAL_KEY, '1'); } catch (e) { /* segue */ } };

const coach = (() => {
  let steps = [], i = -1, done = null, waitFor = null, typer = null, raf = 0, fitPending = false;
  const notes = new Set();
  const root = $('coach'), spot = $('coach-spot'), card = $('coach-card');
  const targets = step => [].concat(typeof step.target === 'function' ? step.target() : step.target || [])
    .map(t => (typeof t === 'string' ? document.querySelector(t) : t)).filter(el => el && el.getClientRects().length);
  function place() {
    raf = 0;
    if (i < 0) return;
    if (steps[i].skipIf && steps[i].skipIf() && !document.querySelector('dialog[open]')) { go(i + 1); return; }
    const dialogOpen = Boolean(document.querySelector('dialog[open]'));
    root.classList.toggle('is-under-dialog', dialogOpen);
    const els = targets(steps[i]);
    if (!els.length) { spot.hidden = true; card.dataset.side = 'bottom'; return; }
    const rs = els.map(el => el.getBoundingClientRect());
    const pad = 8, L = Math.min(...rs.map(r => r.left)) - pad, T0 = Math.min(...rs.map(r => r.top)) - pad;
    const R = Math.max(...rs.map(r => r.right)) + pad, B = Math.max(...rs.map(r => r.bottom)) + pad;
    spot.hidden = false;
    Object.assign(spot.style, { left: `${L}px`, top: `${T0}px`, width: `${R - L}px`, height: `${B - T0}px` });
    // Com espaço ao lado (computador), o balão fica ao lado do destaque; senão, em cima ou embaixo
    const cw = card.offsetWidth, ch = card.offsetHeight, gap = 24;
    const left = L - gap - cw >= 16, right = R + gap + cw <= innerWidth - 16;
    if (innerWidth > 900 && (left || right)) {
      card.dataset.side = 'beside';
      card.style.left = `${left && (L > innerWidth - R || !right) ? L - gap - cw : R + gap}px`;
      card.style.top = `${Math.max(16, Math.min(innerHeight - ch - 16, (T0 + B) / 2 - ch / 2))}px`;
    } else {
      // Celular: o balão fica em cima e a página rola para o destaque inteiro aparecer logo abaixo.
      // Se o destaque não pode descer (topo da página ou elemento fixo), o balão vai para baixo.
      card.style.left = card.style.top = '';
      const room = ch + 16 + 12;
      let top = T0, bottom = B;
      if (fitPending) {
        fitPending = false;
        const before = scrollY;
        scrollBy({ top: T0 - room, behavior: 'instant' });
        const moved = before - scrollY;   // quanto o destaque desceu na tela (só os elementos que rolam)
        if (moved) { const m = els.map(el => el.getBoundingClientRect()); top = Math.min(...m.map(r => r.top)) - pad; bottom = Math.max(...m.map(r => r.bottom)) + pad;
          Object.assign(spot.style, { left: `${Math.min(...m.map(r => r.left)) - pad}px`, top: `${top}px`, width: `${Math.max(...m.map(r => r.right)) - Math.min(...m.map(r => r.left)) + 2 * pad}px`, height: `${bottom - top}px` }); }
      }
      const overTop = Math.max(0, room - top), overBottom = Math.max(0, bottom - (innerHeight - room));
      card.dataset.side = overTop <= overBottom + 12 ? 'top' : 'bottom';   // o lado que cobre menos o destaque
    }
  }
  const schedule = () => { if (!raf && i >= 0) raf = requestAnimationFrame(place); };
  addEventListener('resize', schedule);
  addEventListener('scroll', schedule, { passive: true });
  // iPhone: a barra do Safari aparece e some sem disparar resize na janela; o botão fixo do rodapé muda de lugar
  if (window.visualViewport) { visualViewport.addEventListener('resize', schedule); visualViewport.addEventListener('scroll', schedule); }
  setInterval(() => { if (i >= 0) schedule(); }, 250);
  new MutationObserver(schedule).observe(document.body, { attributes: true, subtree: true, attributeFilter: ['open', 'hidden'] });

  function say(text) {
    clearInterval(typer);
    // O texto inteiro fica invisível por baixo: o balão já nasce no tamanho final (a rolagem do celular depende disso)
    $('coach-size').textContent = text;
    const el = $('coach-typed'), av = $('coach-avatar');
    $('coach-full').textContent = text;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { el.textContent = text; return; }
    let k = 0; el.textContent = '';
    typer = setInterval(() => {   // texto digitado, com a boca da Isa mexendo
      k += 1; el.textContent = text.slice(0, k);
      if (k % 6 === 0) av.src = av.src === IMG.avatar ? IMG.avatarFala : IMG.avatar;
      if (k >= text.length) { clearInterval(typer); el.textContent = text; av.src = IMG.avatar; }
    }, 22);
  }
  function go(k) {
    i = k;
    while (i < steps.length && steps[i].skipIf && steps[i].skipIf()) i += 1;
    if (i >= steps.length) { const cb = done; stop(); if (cb) cb(); return; }
    const step = steps[i];
    if (step.before) step.before();
    waitFor = step.until ? [].concat(step.until) : null;
    root.hidden = false;
    root.classList.toggle('is-block', !waitFor);
    $('coach-next').hidden = Boolean(waitFor);
    $('coach-next-text').textContent = step.next || 'Próximo';
    $('coach-step').textContent = step.count || '';
    $('coach-avatar').src = IMG.avatar;
    say(typeof step.text === 'function' ? step.text() : step.text);
    // Celular: espaço extra no topo da página durante o tour, para até o primeiro bloco poder descer até abaixo do balão
    document.body.style.paddingTop = innerWidth > 900 ? '' : `${card.offsetHeight + 28}px`;
    const first = targets(step)[0];
    if (first) first.scrollIntoView({ block: 'center', behavior: 'instant' });
    fitPending = true;   // no celular, o place() ajusta a rolagem depois de medir o balão
    schedule();
    if (!waitFor) setTimeout(() => $('coach-next').focus({ preventScroll: true }), 0);
  }
  function stop() {
    clearInterval(typer);
    document.body.style.paddingTop = '';
    i = -1; steps = []; waitFor = null; done = null;
    root.hidden = true; spot.hidden = true;
  }
  $('coach-next').addEventListener('click', () => { if (i >= 0 && !waitFor) go(i + 1); });
  $('coach-exit').addEventListener('click', () => exitTutorial());
  document.addEventListener('keydown', event => {
    if (i < 0 || document.querySelector('dialog[open]')) return;
    if (event.key === 'Escape') { event.preventDefault(); exitTutorial(); }
  });
  return {
    run(list, onDone) { steps = list; done = onDone; notes.clear(); go(0); },
    signal(name) { if (i >= 0 && waitFor && waitFor.includes(name)) go(i + 1); },
    note: name => notes.add(name),
    noted: name => notes.has(name),
    stop,
    get active() { return i >= 0; },
  };
})();

const isPhone = () => matchMedia('(max-width: 640px)').matches;
const MAP_TOUR = [
  { target: '#missions', count: '1 de 4', before: () => carousel.center(0, false),
    text: () => `Estas são as 6 missões, uma em cada ponto de Porto Alegre. Elas abrem uma de cada vez: terminou uma, a próxima libera.${isPhone() ? ' Arraste para o lado para ver todas.' : ''}` },
  { target: '#nav-score', count: '2 de 4', text: 'Aqui ficam seus pontos e estrelas. Cada missão vale até 100 pontos; cada erro tira 10 e a dica tira 20.' },
  { target: () => document.querySelector(`#missions [data-mission="${LAST}"]`), count: '3 de 4', before: () => carousel.center(MISSIONS.indexOf(LAST), false),
    text: 'O Aeroporto é a saída da cidade. Ele só libera com pelo menos 3 estrelas. Quem não chegar lá termina o jogo e recebe a nota do mesmo jeito.' },
  { target: '#map-tutorial-btn', count: '4 de 4', next: 'Começar o treino', before: () => carousel.center(0, false),
    text: 'Agora bora treinar uma missão rapidinho? Não vale ponto. Se quiser rever tudo depois, é só tocar aqui, em "Como jogar".' }
];
const TRAINING = [
  { target: '#m-steps', count: 'Treino 1 de 6', text: 'Toda missão tem duas etapas: primeiro você relembra a fórmula, depois resolve o problema.' },
  { target: () => (isPhone() ? '#m-problem' : ['#m-problem', '#m-build']), count: 'Treino 2 de 6',   // no celular, tudo junto não cabe na tela
    text: () => (isPhone() ? 'Aqui ficam o desenho, os dados e a conta. Este painel tem 3 m de base e 4 m de altura.' : 'Aqui ficam o desenho, os dados e as peças para montar a conta. Este painel tem 3 m de base e 4 m de altura.') },
  { target: ['#m-expr', '#m-build', '#m-confirm'], count: 'Treino 3 de 6', until: ['wasted-closed', 'learn-closed'], skipIf: () => S.stage[0] === 1,
    text: 'Monte a conta da área: arraste cada peça até uma lacuna, ou toque na peça e depois na lacuna. Pra ver o que acontece num erro, tente primeiro com o 7. Depois toque em "Conferir conta".' },
  { target: ['#m-expr', '#m-build', '#m-confirm'], count: 'Treino 4 de 6', until: 'learn-closed', skipIf: () => S.stage[0] === 1,
    text: 'Essa foi a tela "Wasted": aparece a cada erro e explica a matéria. Nas missões de verdade, cada erro tira 10 pontos. Agora monte certinho: 3 · 4.' },
  { target: '#m-hint-btn', count: 'Treino 5 de 6', until: 'hint-closed',
    text: () => `${coach.noted('build-wrong') ? 'Isso!' : 'De primeira, hein! Se errar, aparece a tela "Wasted" com uma explicação.'} Travou numa missão? Eu dou uma dica. Nas missões ela custa 20 pontos, uma vez por missão; aqui é de graça. Toque para ver.` },
  { target: ['#m-choice', '#m-confirm'], count: 'Treino 6 de 6', until: 'done',
    text: 'Etapa 2: escolha a alternativa certa e toque em "Confirmar". Ao terminar uma missão, eu explico a resposta.' }
];

/** Convite depois de criar o personagem: treinar ou pular */
function inviteTraining() {
  $('tut-avatar').src = IMG.avatar;
  $('tut-text').textContent = `Prazer, ${nick()}! Eu sou a Isa. Primeira vez por aqui? Bora fazer um treino rapidinho pra você ver como tudo funciona? Não vale ponto.`;
  openDialog($('dlg-tutorial'));
}
$('tut-go').addEventListener('click', () => closeDialog($('dlg-tutorial'), () => startTutorial()));
$('tut-skip').addEventListener('click', () => closeDialog($('dlg-tutorial'), () => exitTutorial()));
$('map-tutorial-btn').addEventListener('click', () => { mapTip.close(); startTutorial(); });

function startTutorial() {
  S.tutorial = 'andamento'; save();
  mapTip.reset();
  if (screen !== 'mapa') show('mapa');
  coach.run(MAP_TOUR, startTraining);
}
function startTraining() {
  const d = MISSION[0].gen();
  Object.assign(S.data, { 0: d });
  [['stage', 0], ['stageErrors', 0], ['done', false], ['skipped', false], ['errors', 0], ['hint', false], ['options', null], ['briefSeen', true]].forEach(([k, v]) => { S[k][0] = v; });
  S.tried[0] = [];
  S.current = 0;
  ui.key = '';
  save();
  show('missao');
  missionTip.reset();
  missionTip.text = missionBrief();
  setTimeout(() => coach.run(TRAINING, null), 900);   // depois da varredura de entrada
}
function finishTraining() {
  coach.signal('done');
  coach.stop();
  S.done[0] = true;
  music.sfx('concluida');
  S.tutorial = 'feito'; save();
  markTutorialSeen();
  $('rw-eyebrow').textContent = MISSION[0].title;
  $('rw-title').textContent = 'Treino concluído!';
  $('rw-pts').innerHTML = '';
  $('rw-text').textContent = `Agora é pra valer, ${nick()}! Comece pelo ${MISSION[MISSIONS[0]].title}. Boa sorte!`;
  $('rw-solution').hidden = false;
  $('rw-solution').innerHTML = `<p class="eyebrow">Entenda a matéria</p><p>${escapeHtml(MISSION[0].learn[1])}</p>`;
  $('rw-next').textContent = 'Ir para o mapa';
  openDialog($('dlg-reward'));
}
/** Sair do tour ou do treino a qualquer momento: volta ao mapa e mostra a fala da Isa */
function exitTutorial() {
  coach.stop();
  if (!S) return;
  S.tutorial = 'feito';
  if (S.current === 0) S.current = MISSIONS.find(m => !finished(m)) || 1;
  save();
  markTutorialSeen();
  if (screen !== 'mapa') show('mapa'); else { renderMapa(); openMapTip(); }
}

/* ---------------------------------------------------------------
   9. CONCLUSÃO
   --------------------------------------------------------------- */
function renderFim() {
  const pts = totalPoints(), stars = starsFor(pts);
  // Na tela final aparece o personagem do aluno sobre o cenário escolhido (sem personagem, a Isa)
  $('end-dani').src = IMG.dani; $('end-dani').alt = 'Isa comemorando o fim da live'; $('end-dani').classList.remove('is-square');
  if (S.player && S.player.avatar) AVATAR.compose(AVATAR.normalize(S.player.avatar), 640).then(cv => { $('end-dani').src = cv.toDataURL('image/png'); $('end-dani').classList.add('is-square'); $('end-dani').alt = `Personagem de ${S.player.name}`; });
  $('g-name').textContent = S.player ? S.player.name : 'você';
  $('g-class').textContent = S.player && S.player.turma ? `Turma ${S.player.turma}` : '';
  // Sem o Aeroporto (faltaram estrelas), o aluno não escapou: a frase muda, a nota vale igual
  $('g-tagline').textContent = S.noAirport ? 'Fim de jogo. Desta vez o aeroporto ficou de fora, mas sua nota está garantida.' : 'Missão cumprida. Você conseguiu escapar!';
  $('g-pts').textContent = pts;
  $('g-stars').innerHTML = starsHtml(stars);
  $('g-stars').setAttribute('aria-label', `${stars} de 5 estrelas`);
  $('g-level').textContent = `Nível de conhecimento: ${LEVEL[stars]}`;
  $('g-list').innerHTML = MISSIONS.map(n => `<li><span>${MISSION[n].title}</span><strong>${n === LAST && S.noAirport ? 'não liberada · 0' : S.skipped[n] ? 'pulada · 0' : missionPoints(n)} pts</strong></li>`).join('');
  const review = MISSIONS.filter(n => !(n === LAST && S.noAirport) && (S.skipped[n] || missionPoints(n) < 70));
  $('g-study').hidden = !review.length;
  $('g-study-lead').textContent = 'Essas missões merecem uma revisada:';
  $('g-study-list').innerHTML = review.map(n => `<div class="study"><h3>${MISSION[n].title} · ${MISSION[n].topic}</h3><ul>${STUDY[n]
    .map(([label, url]) => `<li><a href="${url}" target="_blank" rel="noopener">${label}</a></li>`).join('')}</ul></div>`).join('');
  syncResult();
  prepareShare();
}
$('end-again').addEventListener('click', () => show('identificacao'));

/* ---------------------------------------------------------------
   EXPORTAR O RESULTADO
   Desenha um cartão 1080 × 1920 (formato de story) num canvas, com o
   logo, a Isa, o nome, os pontos, as estrelas e as missões. Depois:
   compartilhar pelo menu do aparelho (Instagram, WhatsApp, e-mail…),
   salvar a imagem, ou abrir WhatsApp/e-mail com o texto e o link.
   --------------------------------------------------------------- */
const share = { blob: null, url: '' };
const gameUrl = () => (/^https?:$/.test(location.protocol) ? location.origin : 'https://gta-poa.vercel.app');
function shareText() {
  const pts = totalPoints(), stars = starsFor(pts);
  return `Fiz ${pts} pontos e ${stars} ${stars === 1 ? 'estrela' : 'estrelas'} no GTA, Edição Porto Alegre! Bora tentar? ${gameUrl()}`;
}
const loadImage = src => new Promise((resolve, reject) => { const img = new Image(); img.onload = () => resolve(img); img.onerror = reject; img.src = src; });

function drawStar(ctx, cx, cy, r, filled) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + i * Math.PI / 5, rad = i % 2 ? r * 0.45 : r;
    ctx.lineTo(cx + rad * Math.cos(a), cy + rad * Math.sin(a));
  }
  ctx.closePath();
  ctx.fillStyle = filled ? '#FFB02E' : 'rgba(255,247,236,0.18)';
  ctx.fill();
  ctx.lineWidth = 4; ctx.strokeStyle = '#1A0833'; ctx.stroke();
}
function fitFont(ctx, text, family, max, width) {
  let size = max;
  do { ctx.font = `${size}px ${family}`; size -= 4; } while (ctx.measureText(text).width > width && size > 24);
}

async function buildShareImage() {
  try { await Promise.all(['96px Anton', '40px "Bebas Neue"', '40px Inter', '56px "Permanent Marker"', '700 40px Inter'].map(f => document.fonts.load(f))); } catch (e) { /* segue com as fontes do sistema */ }
  const W = 1080, H = 1920, cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d');
  // Fundo: noite roxa com faixa de pôr do sol
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#1B1F6B'); bg.addColorStop(0.35, '#2B0B4F'); bg.addColorStop(0.7, '#1A0833'); bg.addColorStop(1, '#A3167A');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#FF2E93'; ctx.fillRect(0, 0, W, 14); ctx.fillRect(0, H - 14, W, 14);
  // Logo GTA (o mesmo contorno do sprite) e o nome escrito à mão
  const sym = document.getElementById('logo-gta');
  const logoSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${sym.getAttribute('viewBox')}">${sym.innerHTML}</svg>`;
  try {
    const logo = await loadImage('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(logoSvg));
    const lw = 520, lh = lw * logo.height / logo.width || lw * 0.46;
    ctx.save(); ctx.shadowColor = '#FF2E93'; ctx.shadowOffsetX = 12; ctx.shadowOffsetY = 12;
    ctx.drawImage(logo, (W - lw) / 2, 70, lw, lh); ctx.restore();
  } catch (e) { ctx.fillStyle = '#FFF7EC'; ctx.font = '200px Anton'; ctx.textAlign = 'center'; ctx.fillText('GTA', W / 2, 260); }
  ctx.textAlign = 'center';
  ctx.save(); ctx.translate(W / 2, 360); ctx.rotate(-0.04);
  ctx.fillStyle = '#FFB02E'; ctx.font = '52px "Permanent Marker", cursive'; ctx.fillText('Edição Porto Alegre', 0, 0); ctx.restore();
  // Personagem do aluno sobre o cenário escolhido (sem personagem, a Isa)
  try {
    const mine = S.player && S.player.avatar;
    const dani = mine ? await AVATAR.compose(AVATAR.normalize(S.player.avatar), 520) : await loadImage(IMG.dani);
    const dw = mine ? 520 : 440, dh = mine ? 520 : 550, dx = (W - dw) / 2, dy = mine ? 430 : 420;
    ctx.imageSmoothingEnabled = !mine;
    ctx.fillStyle = '#FF2E93'; ctx.fillRect(dx + 18, dy + 18, dw, dh);
    ctx.drawImage(dani, dx, dy, dw, dh);
    ctx.imageSmoothingEnabled = true;
    ctx.lineWidth = 10; ctx.strokeStyle = '#FFF7EC'; ctx.strokeRect(dx, dy, dw, dh);
  } catch (e) { /* sem a foto, o cartão segue */ }
  // Nome, pontos, estrelas e nível
  const pts = totalPoints(), stars = starsFor(pts);
  const name = `GG, ${S.player ? S.player.name : 'você'}!`;
  ctx.fillStyle = '#FFF7EC'; fitFont(ctx, name.toUpperCase(), 'Anton, Impact, sans-serif', 110, W - 120);
  ctx.fillText(name.toUpperCase(), W / 2, 1100);
  ctx.fillStyle = '#FFB02E'; ctx.font = '170px Anton, Impact, sans-serif';
  const ptsText = String(pts), ptsW = ctx.measureText(ptsText).width;
  ctx.font = '64px "Bebas Neue", Impact, sans-serif'; const restW = ctx.measureText(' / 600 PTS').width;
  const x0 = (W - ptsW - restW) / 2;
  ctx.textAlign = 'left';
  ctx.font = '170px Anton, Impact, sans-serif'; ctx.fillText(ptsText, x0, 1280);
  ctx.fillStyle = '#EADDF6'; ctx.font = '64px "Bebas Neue", Impact, sans-serif'; ctx.fillText(' / 600 PTS', x0 + ptsW, 1280);
  ctx.textAlign = 'center';
  for (let i = 0; i < 5; i++) drawStar(ctx, W / 2 + (i - 2) * 96, 1355, 40, i < stars);
  ctx.fillStyle = '#22E3FF'; ctx.font = '58px "Bebas Neue", Impact, sans-serif';
  ctx.fillText(`NÍVEL: ${LEVEL[stars].toUpperCase()}`, W / 2, 1450);
  // Missões
  ctx.textAlign = 'left';
  MISSIONS.forEach((n, i) => {
    const y = 1540 + i * 52;
    const val = n === LAST && S.noAirport ? 'não liberada' : S.skipped[n] ? 'pulada' : `${missionPoints(n)} pts`;
    ctx.fillStyle = '#EADDF6'; ctx.font = '36px Inter, sans-serif'; ctx.fillText(MISSION[n].title, 140, y);
    ctx.textAlign = 'right'; ctx.fillStyle = '#FFF7EC'; ctx.font = '700 36px Inter, sans-serif'; ctx.fillText(val, W - 140, y); ctx.textAlign = 'left';
  });
  ctx.textAlign = 'center'; ctx.fillStyle = '#FFF7EC'; ctx.font = '700 34px Inter, sans-serif';
  ctx.fillText(gameUrl().replace(/^https?:\/\//, ''), W / 2, H - 50);
  return new Promise(resolve => cv.toBlob(resolve, 'image/png'));
}

/** Celular (toque) com suporte a compartilhar arquivos: só "Compartilhar". Senão: "Salvar imagem" e "E-mail". */
async function prepareShare() {
  $('share-msg').textContent = '';
  share.blob = null;
  try {
    share.blob = await buildShareImage();
    if (share.url) URL.revokeObjectURL(share.url);
    share.url = URL.createObjectURL(share.blob);
  } catch (e) { /* sem imagem: fica só o e-mail com o texto e o link */ }
  const file = share.blob && new File([share.blob], 'gta-resultado.png', { type: 'image/png' });
  const canShareFile = Boolean(file && navigator.canShare && navigator.canShare({ files: [file] }));
  const mobile = window.matchMedia('(pointer: coarse)').matches;
  const useNative = mobile && canShareFile;
  $('share-native').hidden = !useNative;
  $('share-save').hidden = useNative || !share.blob;
  $('share-mail').hidden = useNative;
}
const shareFileName = () => `gta-${(S.player ? S.player.name : 'resultado').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'resultado'}.png`;

async function nativeShare() {
  if (!share.blob) return false;
  const file = new File([share.blob], shareFileName(), { type: 'image/png' });
  if (!(navigator.canShare && navigator.canShare({ files: [file] }))) return false;
  try { await navigator.share({ files: [file], text: shareText(), title: 'Meu resultado no GTA' }); }
  catch (e) { if (e.name !== 'AbortError') $('share-msg').textContent = 'Não deu pra abrir o compartilhamento. Tente de novo.'; }
  return true;
}
function saveImage() {
  if (!share.url) return;
  const a = document.createElement('a');
  a.href = share.url; a.download = shareFileName();
  document.body.appendChild(a); a.click(); a.remove();
}
$('share-native').addEventListener('click', nativeShare);
$('share-save').addEventListener('click', saveImage);
$('share-mail').addEventListener('click', () => {
  location.href = `mailto:?subject=${encodeURIComponent('Meu resultado no GTA, Edição Porto Alegre')}&body=${encodeURIComponent(shareText())}`;
});

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
  if ($('dlg-learn').open) closeDialog($('dlg-learn'));
});

/* ---------------------------------------------------------------
   INICIALIZAÇÃO
   --------------------------------------------------------------- */
S = loadState();
show('inicio');
