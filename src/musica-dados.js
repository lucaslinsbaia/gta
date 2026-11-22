/* Trilha sonora do GTA, Edição Porto Alegre: composições originais.
   Este arquivo só tem as notas. O jogo toca com Web Audio (src/musica.js), sem baixar
   nenhum arquivo de áudio, e tools/midi.mjs gera os .mid a partir dos mesmos dados.

   Notação de cada faixa: notas separadas por espaço, a duração vem depois da barra,
   em semicolcheias (16 = um compasso 4/4). Sem barra, dura 1. "-" é pausa e "+" junta
   notas num acorde. Ex.: "A3+C4+E4/16" é um acorde de lá menor por um compasso.
   Bateria: uma linha por peça (k bumbo, s caixa, h chimbal), um caractere por
   semicolcheia, "x" toca e "." fica em silêncio. A linha se repete até o fim da faixa. */
const rep = (text, times) => Array(times).fill(text).join(' ');
const bar8 = (low, high) => `${low}/3 ${low}/3 ${low}/2 ${high}/2 ${low}/2 ${low}/2 ${low}/2`;

const SONGS = {
  // Capa e identificação: synthwave em lá menor, clima de pôr do sol
  abertura: {
    bpm: 104, loop: true,
    tracks: [
      { inst: 'pad', notes: rep('A3+C4+E4/16 F3+A3+C4/16 C4+E4+G4/16 G3+B3+D4/16', 2) },
      { inst: 'bass', notes: rep(`${rep('A2/2', 7)} A3/2 ${rep('F2/2', 7)} F3/2 ${rep('C2/2', 7)} C3/2 ${rep('G2/2', 7)} G3/2`, 2) },
      { inst: 'arp', notes: rep(`${rep('A3 C4 E4 A4 E4 C4 A3 C4', 2)} ${rep('F3 A3 C4 F4 C4 A3 F3 A3', 2)} ${rep('C4 E4 G4 C5 G4 E4 C4 E4', 2)} ${rep('G3 B3 D4 G4 D4 B3 G3 B3', 2)}`, 2) },
      { inst: 'lead', notes: '-/64 E5/4 D5/2 C5/2 D5/4 E5/4 A5/6 G5/2 F5/4 E5/4 G5/4 E5/2 C5/2 E5/4 G5/4 D5/8 B4/4 D5/4' },
    ],
    drums: { k: 'x.......x.x.....', s: '....x.......x...', h: '..x...x...x...x.' },
  },
  // Mapa: mais calmo, em ré menor, para ficar de fundo enquanto a turma escolhe
  mapa: {
    bpm: 92, loop: true,
    tracks: [
      { inst: 'pad', notes: rep('D3+F3+A3/16 Bb2+D3+F3/16 F3+A3+C4/16 C3+E3+G3/16', 2) },
      { inst: 'bass', notes: rep('D2/8 D2/8 Bb1/8 Bb1/8 F2/8 F2/8 C2/8 C2/8', 2) },
      { inst: 'arp', notes: rep(`${rep('D4/2 F4/2 A4/2 F4/2', 2)} ${rep('D4/2 F4/2 Bb4/2 F4/2', 2)} ${rep('C4/2 F4/2 A4/2 F4/2', 2)} ${rep('C4/2 E4/2 G4/2 E4/2', 2)}`, 2) },
      { inst: 'lead', notes: '-/64 A4/4 C5/4 D5/8 F5/4 D5/4 Bb4/8 C5/4 A4/4 F4/8 G4/6 A4/2 E4/8' },
    ],
    drums: { k: 'x.......x.......', s: '........x.......', h: 'x.x.x.x.x.x.x.x.' },
  },
  // Beira-Rio: tema original de estádio, marcha com metais e bumbo
  beirario: {
    bpm: 116, loop: true,
    tracks: [
      { inst: 'pad', notes: 'C4+E4+G4/16 F3+A3+C4/16 G3+B3+D4/16 C4+E4+G4/16 A3+C4+E4/16 F3+A3+C4/16 G3+B3+D4/16 C4+E4+G4/16' },
      { inst: 'bass', notes: `${rep('C2/4 G2/4', 2)} ${rep('F2/4 C3/4', 2)} ${rep('G2/4 D3/4', 2)} ${rep('C2/4 G2/4', 2)} ${rep('A2/4 E3/4', 2)} ${rep('F2/4 C3/4', 2)} ${rep('G2/4 D3/4', 2)} ${rep('C2/4 G2/4', 2)}` },
      { inst: 'brass', notes: 'G4/2 G4/2 C5/4 E5/4 G5/4 F5/4 A5/4 F5/4 C5/4 D5/2 D5/2 G5/4 F5/2 E5/2 D5/4 E5/8 C5/4 -/4 A4/2 A4/2 C5/4 E5/4 A5/4 G5/4 F5/4 E5/4 C5/4 D5/4 E5/4 F5/4 B4/4 C5/12 -/4' },
    ],
    drums: { k: 'x...x...x...x...', s: '..x...x.x.x...x.', h: '................' },
  },
  // Arena: tema original de arquibancada, em mi menor, com canto e resposta
  arena: {
    bpm: 124, loop: true,
    tracks: [
      { inst: 'pad', notes: rep('E3+G3+B3/16 C3+E3+G3/16 G3+B3+D4/16 D3+F#3+A3/16', 2) },
      { inst: 'bass', notes: rep(`${bar8('E2', 'E3')} ${bar8('C2', 'C3')} ${bar8('G2', 'G3')} ${bar8('D2', 'D3')}`, 2) },
      { inst: 'saw', notes: 'E5/2 E5/2 G5/2 E5/2 B4/4 -/4 C5/2 C5/2 E5/2 G5/2 E5/4 -/4 D5/2 D5/2 B4/2 D5/2 G5/4 F#5/4 F#5/6 E5/2 D5/8 B5/2 B5/2 A5/2 G5/2 E5/4 -/4 G5/2 G5/2 E5/2 C5/2 E5/4 -/4 D5/2 D5/2 G5/2 B5/2 A5/4 G5/4 F#5/4 A5/4 E5/8' },
    ],
    drums: { k: 'x.....x.x.....x.', s: '....x.......x...', h: 'xxxxxxxxxxxxxxxx' },
  },
  // Vinhetas: tocam uma vez por cima da música
  acerto: { bpm: 150, tracks: [{ inst: 'lead', notes: 'C5 E5 G5 C6/5' }, { inst: 'brass', notes: 'C5 E5 G5 C6/5' }] },
  erro: {
    bpm: 96,
    tracks: [{ inst: 'saw', notes: 'G4/3 F#4/3 F4/3 E4/9' }, { inst: 'bass', notes: 'E2/18' }],
    drums: { k: 'x.................', s: '.........x........' },
  },
  concluida: {
    bpm: 140,
    tracks: [{ inst: 'brass', notes: 'G4/2 C5/2 E5/2 G5/4 E5/2 G5/8' }, { inst: 'pad', notes: 'C4+E4+G4/20' }, { inst: 'bass', notes: 'C2/12 C3/8' }],
    drums: { k: 'x.......x...........', s: '..........x.........' },
  },
  aeroporto: {
    bpm: 132,
    tracks: [
      { inst: 'brass', notes: 'D5/2 F#5/2 A5/2 D6/6 C6/2 A5/2 D6/12' },
      { inst: 'pad', notes: 'D4+F#4+A4/16 G4+B4+D5/4 D4+F#4+A4/8' },
      { inst: 'bass', notes: 'D2/16 G2/4 D2/8' },
    ],
    drums: { k: 'x...x...x...x...x...x...x...', s: '....x.......x.......x.xx....' },
  },
};

/* Lê uma faixa: devolve [{ step, dur, notes: [midi] }] e o total de semicolcheias */
function parseNotes(text) {
  const out = [];
  let step = 0;
  text.trim().split(/\s+/).forEach(token => {
    const [names, dur = '1'] = token.split('/');
    const length = Number(dur);
    if (names !== '-') out.push({ step, dur: length, notes: names.split('+').map(noteToMidi) });
    step += length;
  });
  return { events: out, length: step };
}
function noteToMidi(name) {
  const m = /^([A-G])(#|b)?(-?\d)$/.exec(name);
  if (!m) throw new Error(`nota inválida: ${name}`);
  const base = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[m[1]];
  return 12 * (Number(m[3]) + 1) + base + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
}
