// Gera os .mid da trilha (audio/*.mid) a partir de src/musica-dados.js.
// Rodar da raiz:  node tools/midi.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import vm from 'node:vm';
const ctx = {};
vm.runInNewContext(readFileSync('src/musica-dados.js', 'utf8') + ';this.SONGS = SONGS; this.parseNotes = parseNotes;', ctx);
const { SONGS, parseNotes } = ctx;
// Programas General MIDI (base zero) e canal de cada timbre; bateria no canal 10
const GM = { lead: [80, 0], arp: [80, 1], saw: [81, 2], brass: [62, 3], pad: [89, 4], bass: [38, 5] };
const DRUM = { k: 36, s: 38, h: 42 };
const TPQ = 120, STEP = TPQ / 4;
const vlq = n => { const out = [n & 0x7f]; while ((n >>= 7)) out.unshift((n & 0x7f) | 0x80); return out; };
const u32 = n => [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255];
function track(events) {
  events.sort((a, b) => a.t - b.t || a.order - b.order);
  const bytes = []; let last = 0;
  events.forEach(e => { bytes.push(...vlq(e.t - last), ...e.data); last = e.t; });
  bytes.push(0, 0xff, 0x2f, 0);
  return [0x4d, 0x54, 0x72, 0x6b, ...u32(bytes.length), ...bytes];
}
mkdirSync('audio', { recursive: true });
for (const [name, song] of Object.entries(SONGS)) {
  const lengths = song.tracks.map(t => parseNotes(t.notes).length);
  const length = Math.max(...lengths);
  if (lengths.some(l => l !== length)) throw new Error(`${name}: faixas com tamanhos diferentes ${lengths}`);
  const tempo = Math.round(60e6 / song.bpm);
  const tracks = [track([{ t: 0, order: 0, data: [0xff, 0x51, 3, (tempo >> 16) & 255, (tempo >> 8) & 255, tempo & 255] }, { t: 0, order: 0, data: [0xff, 0x58, 4, 4, 2, 24, 8] }])];
  song.tracks.forEach(t => {
    const [program, ch] = GM[t.inst];
    const ev = [{ t: 0, order: 0, data: [0xc0 | ch, program] }];
    parseNotes(t.notes).events.forEach(n => n.notes.forEach(m => {
      ev.push({ t: n.step * STEP, order: 2, data: [0x90 | ch, m, 96] });
      ev.push({ t: (n.step + n.dur) * STEP - 1, order: 1, data: [0x80 | ch, m, 0] });
    }));
    tracks.push(track(ev));
  });
  if (song.drums) {
    const ev = [];
    Object.entries(song.drums).forEach(([piece, line]) => {
      for (let s = 0; s < length; s += 1) if (line[s % line.length] === 'x') {
        ev.push({ t: s * STEP, order: 2, data: [0x99, DRUM[piece], piece === 'h' ? 60 : 100] });
        ev.push({ t: s * STEP + STEP - 1, order: 1, data: [0x89, DRUM[piece], 0] });
      }
    });
    tracks.push(track(ev));
  }
  const header = [0x4d, 0x54, 0x68, 0x64, 0, 0, 0, 6, 0, 1, 0, tracks.length, 0, TPQ];
  const file = Buffer.from([...header, ...tracks.flat()]);
  writeFileSync(`audio/${name}.mid`, file);
  console.log(name.padEnd(10), `${(length / 16).toFixed(1)} compassos`, `${file.length} bytes`);
}
