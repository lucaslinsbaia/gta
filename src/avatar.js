/* Personagem do aluno em pixel art 128 × 128: desenhado em código, em camadas, com luz e sombra.
   Guarda só a receita (cores e estilos escolhidos), nunca uma imagem. */
const AVATAR = (() => {
/* ---------- Paletas ---------- */
const SKIN = ['#FFE3CC','#F6CBA5','#E8B08A','#D49A6A','#B97A4F','#9A5B36','#7A4126','#55301C'];
const HAIR = ['#1C1420','#3B2318','#6B3D22','#B0441F','#E0B25A','#CFC8CD','#FF5FA8','#2FD0FF'];
const FABRIC = ['#FF2E93','#22E3FF','#FFB02E','#7B3FE4','#FF5E3A','#59C96B','#F4EDE4','#2A2533'];
const EYE = ['#2B1A12','#6B3B1E','#B5782A','#3D8C4A','#3F7FD6','#6D7A86'];
const OUT = '#1A0833', WHITE = '#FFFFFF', LIP = '#8A2040', GOLD = '#FFD23F';
const shade = (hex, f) => { const n = parseInt(hex.slice(1), 16); const c = [n >> 16, n >> 8 & 255, n & 255].map(v => Math.max(0, Math.min(255, Math.round(f < 1 ? v * f : v + (255 - v) * (f - 1))))); return '#' + c.map(v => v.toString(16).padStart(2, '0')).join(''); };
const E = (x, y, cx, cy, rx, ry) => ((x + .5 - cx) / rx) ** 2 + ((y + .5 - cy) / ry) ** 2;

const HAIRS = [
  ['curto','Curto'],['raspado','Raspado'],['longo','Longo liso'],['ondulado','Ondulado'],['cacheado','Cacheado'],
  ['blackpower','Black power'],['trancas','Tranças'],['coque','Coque'],['chanel','Chanel'],['hijab','Lenço'],['careca','Careca']];
const EYES = [['amendoado','Amendoado'],['redondo','Redondo'],['ponto','Pequeno'],['feliz','Sorrindo']];
const MOUTHS = [['sorriso','Sorriso'],['sorrisao','Sorrisão'],['neutra','Neutra']];
const CLOTHES = [['jaqueta','Jaqueta'],['moletom','Moletom'],['camiseta','Camiseta'],['regata','Regata']];
const ACCS = [['oculos','Óculos'],['escuros','Óculos escuros'],['bone','Boné'],['fone','Fone'],['brinco','Brincos'],['piercing','Piercing']];
const PRESETS = [
  { bg: 4, skin: 2, hair: 'longo', hairColor: 1, eyes: 'amendoado', eyeColor: 0, mouth: 'sorrisao', clothes: 'jaqueta', clothesColor: 0, acc: ['oculos','fone'] },
  { bg: 3, skin: 6, hair: 'blackpower', hairColor: 0, eyes: 'redondo', eyeColor: 0, mouth: 'sorriso', clothes: 'moletom', clothesColor: 1, acc: [] },
  { bg: 5, skin: 4, hair: 'curto', hairColor: 1, eyes: 'ponto', eyeColor: 1, mouth: 'sorriso', clothes: 'camiseta', clothesColor: 2, acc: ['bone'] }];
/* ---------- Desenho: grade 128 × 128, com luz e sombra ----------
   As formas são pensadas numa grade de 64 unidades (u, w) e amostradas em 128 pixels. */
const R = 128, S = 2;
const B4 = [[0,8,2,10],[12,4,14,6],[3,11,1,9],[15,7,13,5]];
const hash = (x, y) => { const v = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453; return v - Math.floor(v); };
const rgb = h => [parseInt(h.slice(1,3),16), parseInt(h.slice(3,5),16), parseInt(h.slice(5,7),16)];
const sh = (c, f) => c.map(v => Math.max(0, Math.min(255, Math.round(f < 1 ? v * f : v + (255 - v) * (f - 1)))));
const mixA = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
const ramp = hex => { const c = rgb(hex); return [sh(c,.48), sh(c,.6), sh(c,.73), sh(c,.86), c, sh(c,1.13)]; };
const pick = (r, v, x, y, d = .35) => r[Math.max(0, Math.min(r.length - 1, Math.floor(v * r.length + (B4[y & 3][x & 3] / 16 - .5) * d)))];
const Ef = (u, w, cx, cy, rx, ry) => ((u - cx) / rx) ** 2 + ((w - cy) / ry) ** 2;
const LV = [-.45, -.55, .7];
const light = (nx, ny) => { nx = Math.max(-1, Math.min(1, nx)); ny = Math.max(-1, Math.min(1, ny)); const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny)); return Math.max(0, Math.min(1, .28 + .72 * Math.max(0, nx * LV[0] + ny * LV[1] + nz * LV[2]))); };
const inFace = (u, w) => { const rx = w > 30 ? 11 * (1 - .38 * ((w - 30) / 12.5) ** 2) : 11; return ((u - 32) / rx) ** 2 + ((w - 28) / 14.5) ** 2 <= 1; };
const hl = u => 19 + .055 * (u - 32) ** 2;

function hairAt(c, u, w) {   // devolve [atrás, frente]
  const capE = Ef(u, w, 32, 25, 13.2, 15.5);
  const cap = capE <= 1 && w < hl(u), sides = capE <= 1 && (u < 21 || u > 43) && w <= 29;
  switch (c.hair) {
    case 'curto': return [false, cap || sides];
    case 'raspado': return [false, Ef(u, w, 32, 26, 12, 14.6) <= 1 && w < hl(u) + 1];
    case 'longo': case 'ondulado': {
      const o = c.hair === 'ondulado' ? 1.6 * Math.sin(w / 3.2) : 0;
      const b = u >= 18 + o && u < 46 + o && w >= 14 && w < 59 - (Math.abs(u - 32 - o) > 12 ? (Math.abs(u - 32 - o) - 12) * 1.2 : 0);
      const curtain = w >= 20 && w < 59 - (Math.abs(u - 32 - o) > 12.5 ? 2 : 0) && ((u >= 18 + o && u < 23 + o) || (u >= 41 + o && u < 46 + o));
      return [b, cap || sides || curtain]; }
    case 'cacheado': {
      const e = Ef(u, w, 32, 27, 18.5, 19), wob = .09 * Math.sin(u * 1.7 + w) * Math.cos(w * 1.3);
      return [e <= 1 + wob && w <= 50, (capE <= 1.05 && w < hl(u) + 1.6 * Math.sin(u * 1.4) + 1) || ((u < 22 || u > 42) && w <= 41 && e <= 1 + wob)]; }
    case 'blackpower': return [Ef(u, w, 32, 22, 21, 18.5) <= 1 + .06 * Math.sin(u * 2.1) * Math.sin(w * 1.7) && w <= 39, cap || (sides && w <= 27)];
    case 'trancas': return [false, cap || sides || (((u >= 17 && u < 21) || (u >= 43 && u < 47)) && w >= 24 && w < 61)];
    case 'coque': return [Ef(u, w, 32, 8, 6.5, 5.5) <= 1, Ef(u, w, 32, 25.5, 12.8, 15) <= 1 && w < hl(u) - 1];
    case 'chanel': {
      const rb = w > 40 && (u < 20 || u > 44);
      return [u >= 18 && u < 46 && w >= 14 && w < 43 && !rb, (capE <= 1 && (w < 24 || w < hl(u))) || (((u >= 18 && u < 23) || (u >= 41 && u < 46)) && w >= 20 && w < 43 && !rb)]; }
    case 'hijab': {
      const outer = Ef(u, w, 32, 28, 14.5, 17.8) <= 1;
      return [Ef(u, w, 32, 32, 20, 28) <= 1 || (w >= 48 && Math.abs(u - 32) <= 24 - (64 - w) * .2), (outer && Ef(u, w, 32, 29, 11.2, 14.2) > 1 && w <= 47) || (outer && w < 20)]; }
  }
  return [false, false];
}

function build(c) {
  const px = new Array(R * R).fill(null);
  const at = (x, y) => (x < 0 || y < 0 || x >= R || y >= R) ? null : px[y * R + x];
  const set = (x, y, col) => { if (x >= 0 && y >= 0 && x < R && y < R) px[y * R + x] = col; };
  const U = x => (x + .5) / S;
  const skinH = SKIN[c.skin], sk = ramp(skinH), skin = rgb(skinH);
  const hijab = c.hair === 'hijab';
  const hr = ramp(hijab ? FABRIC[c.hairColor % FABRIC.length] : HAIR[c.hairColor]);
  const cr = ramp(FABRIC[c.clothesColor]), tee = ramp('#F4EDE4');
  const back = new Uint8Array(R * R), front = new Uint8Array(R * R);
  for (let y = 0; y < R; y++) for (let x = 0; x < R; x++) { const [b, f] = hairAt(c, U(x), U(y)); back[y * R + x] = b; front[y * R + x] = f; }
  const hairCol = (x, y) => {
    const u = U(x), w = U(y);
    let v = light((u - 32) / 20, (w - 24) / 22);
    if (hijab) { if (w > 46) v -= .1; if (hash(x, Math.floor(y / 7)) < .08) v -= .14; return pick(hr, v, x, y); }
    if (c.hair === 'cacheado' || c.hair === 'blackpower') {   // cachos: células com centro e tamanho sorteados
      const P = c.hair === 'blackpower' ? 5 : 7, gx = Math.floor(x / P), gy = Math.floor(y / P);
      let best = 9;
      for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) { const ox = (gx + i + hash(gx + i, gy + j)) * P, oy = (gy + j + hash(gy + j, gx + i + 7)) * P; best = Math.min(best, Math.hypot(x - ox, y - oy) / (P * (.5 + .3 * hash(gx + i + 3, gy + j)))); }
      v += best < .55 ? .08 - best * .08 : best > .9 ? -.11 : -.03;
    }
    else if (c.hair === 'trancas' && (u < 21 || u >= 43) && w >= 24) v += ((y + (x % 8)) % 8 < 4 ? .14 : -.14);
    else if (c.hair === 'raspado') v += hash(x, y) < .5 ? .04 : -.1;
    else { const h = hash(x, Math.floor(y / 9)); if (h < .22) v -= .15; if (w >= 15 && w <= 21 && h > .78) v += .18; if (c.hair === 'ondulado' && Math.floor(y / 6) % 2) v -= .05; }
    return pick(hr, v, x, y);
  };
  for (let i = 0; i < R * R; i++) if (back[i]) set(i % R, Math.floor(i / R), hairCol(i % R, Math.floor(i / R)));
  // tronco e roupa
  for (let y = 92; y < R; y++) for (let x = 0; x < R; x++) {
    const u = U(x), w = U(y), hw = w < 48 ? 10 + (w - 46) * 4 : Math.min(28, 18 + (w - 48) * 2.5);
    if (Math.abs(u - 32) >= hw) continue;
    const nx = (u - 32) / (hw + 1), au = Math.abs(u - 32);
    let v = light(nx * .95, -.25) - (w < 50 ? .08 : 0);
    if (Math.abs(nx) > .8 && w > 52 && hash(Math.floor(x / 3), Math.floor(y / 5)) < .3) v -= .14;
    let col = pick(cr, v, x, y, .3);
    const lap = 6 - Math.max(0, (52 - w) * .4);
    if (c.clothes === 'regata' && au > 10) col = au <= 13 ? pick(cr, v - .1, x, y) : pick(sk, v, x, y);
    if (c.clothes === 'jaqueta') { if (au < lap) col = pick(tee, v + .1, x, y); else if (au < lap + .7) col = cr[0]; else if (au > 4 && au < 5 && w > 54) col = cr[1]; }
    if (c.clothes === 'camiseta' && Ef(u, w, 32, 46, 6.5, 3.4) <= 1) col = Ef(u, w, 32, 46, 5.4, 2.5) <= 1 ? pick(sk, v - .2, x, y) : cr[1];
    set(x, y, col);
  }
  if (c.clothes === 'moletom') for (let y = 80; y < 118; y++) for (let x = 40; x < 88; x++) {
    const u = U(x), w = U(y);
    if (w <= 48 && Ef(u, w, 32, 47, 10.5, 6.5) <= 1 && Ef(u, w, 32, 47, 6.6, 3.7) > 1) set(x, y, pick(cr, .3 + (w - 41) * .03, x, y));
    if (w >= 49 && w < 57 && (Math.abs(u - 29.3) < .45 || Math.abs(u - 34.7) < .45)) set(x, y, tee[4]);
    if (w >= 57 && w < 58 && (Math.abs(u - 29.3) < .6 || Math.abs(u - 34.7) < .6)) set(x, y, tee[1]);
  }
  if (c.clothes === 'regata') for (let y = 92; y < 106; y++) for (let x = 0; x < R; x++) { const au = Math.abs(U(x) - 32); if (au >= 8 && au < 10.5) set(x, y, pick(cr, .55, x, y)); }
  // pescoço
  const openNeck = ['jaqueta', 'regata', 'moletom'].includes(c.clothes);
  for (let y = 74; y < 98; y++) for (let x = 56; x < 72; x++) {
    const u = U(x), w = U(y);
    if (w >= 46 && !(openNeck || (c.clothes === 'camiseta' && Ef(u, w, 32, 46, 5.4, 2.5) <= 1))) continue;
    if (w >= 47.5 && c.clothes === 'moletom') continue;
    set(x, y, pick(sk, (w < 43.5 ? .14 : .4) - (u - 28) * .02, x, y, .25));
  }
  // orelhas
  for (let y = 46; y < 76; y++) for (let x = 32; x < 46; x++) {
    const u = U(x), w = U(y), e = Ef(u, w, 20.6, 30, 2.2, 3.8);
    if (e > 1) continue;
    let v = .55 - (Ef(u, w, 21.2, 30, 1.1, 2.4) <= 1 ? .25 : 0);
    set(x, y, pick(sk, v, x, y)); set(R - 1 - x, y, pick(sk, v - .12, R - 1 - x, y));
  }
  // rosto com volume
  for (let y = 24; y < 90; y++) for (let x = 36; x < 92; x++) {
    const u = U(x), w = U(y);
    if (!inFace(u, w)) continue;
    let v = light((u - 32) / 11.5, (w - 27) / 16);
    if (front[(y - 1) * R + x] || front[(y - 2) * R + x] || front[(y - 3) * R + x]) v -= .15;
    if (w >= 24 && w <= 29.5 && Math.abs(Math.abs(u - 32) - 4) < 3.4) v -= .05;
    if (w >= 41) v -= .05;
    if (!inFace(u, w + .6)) v -= .22;
    let col = pick(sk, v, x, y, .22);
    for (const bx of [25.5, 38.5]) { const e = Ef(u, w, bx, 33.5, 2.6, 1.6); if (e < 1) col = mixA(col, [232, 96, 122], .2 * (1 - e)); }
    set(x, y, col);
  }
  // nariz
  for (let y = 56; y < 76; y++) for (let x = 56; x < 74; x++) {
    const u = U(x), w = U(y);
    if (u >= 33 && u < 34.2 && w >= 28.5 && w < 33.5) set(x, y, pick(sk, .45 - (u - 33) * .1, x, y, .2));
    const tip = Ef(u, w, 32, 34, 2.1, 1.3);
    if (tip <= 1) set(x, y, pick(sk, light((u - 32) / 2.4, (w - 34) / 1.6) + .05, x, y, .2));
    if (Ef(u, w, 30.6, 35, .7, .42) <= 1 || Ef(u, w, 33.4, 35, .7, .42) <= 1) set(x, y, sk[0]);
    if (w >= 35.6 && w < 36.5 && Math.abs(u - 32) < 2.4) set(x, y, sk[2]);
  }
  // olhos
  const er = ramp(EYE[c.eyeColor]), lash = [36, 22, 28], wht = [247, 242, 236], lid = sk[2];
  const eyeShape = { amendoado: [6, 2.6, 2.5], redondo: [5.6, 3.4, 2.8], ponto: [4.6, 1.9, 2.1], feliz: [5.6, 0, 0] }[c.eyes];
  for (const [ex, outer] of [[56, -1], [72, 1]]) {
    const ey = 55;
    for (let y = ey - 7; y <= ey + 6; y++) for (let x = ex - 8; x <= ex + 8; x++) {
      const dx = x + .5 - ex, dy = y + .5 - ey, [hw, hh, ir] = eyeShape;
      if (c.eyes === 'feliz') { const yc = -1.8 * (1 - (dx / hw) ** 2) + .8; if (Math.abs(dx) < hw && Math.abs(dy - yc) < .9) set(x, y, lash); continue; }
      const tilt = dx * outer * .08, top = -hh * Math.max(0, 1 - (dx / hw) ** 2) - tilt, bot = hh * .75 * Math.max(0, 1 - (dx / hw) ** 2) - tilt;
      if (Math.abs(dx) >= hw) continue;
      if (dy >= top && dy <= bot) {
        const id = Math.hypot(dx + outer * .2, dy - .1);
        let col = wht;
        if (id < ir) col = id < ir * .45 ? er[0] : pick(er, .75 - (dy + ir) / (2 * ir) * .4 + (dy > 0 ? .25 : 0), x, y, .2);
        if (Math.abs(dx + outer * .2 + .9) < .6 && Math.abs(dy + .9) < .6 && id < ir) col = [255, 255, 255];
        if (dy < top + 1 && col === wht) col = sh(wht, .86);
        set(x, y, col);
      } else if (dy < top && dy >= top - 1.3 - (dx * outer > 2 ? .8 : 0)) set(x, y, lash);
      else if (dy > bot && dy <= bot + .9) set(x, y, lid);
    }
  }
  // sobrancelhas
  const browC = hijab ? rgb('#3B2318') : c.hair === 'careca' ? sk[1] : hr[1];
  for (const [ex, outer] of [[56, -1], [72, 1]]) for (let x = ex - 8; x <= ex + 8; x++) {
    const dx = (x + .5 - ex) * outer, yb = 46.2 - 1.6 * (1 - ((dx - 2) / 8) ** 2), th = 2.5 - Math.max(0, dx + 3) * .13;   // arco com o ponto alto para fora, mais fino na ponta
    if (dx < -5 || dx > 7.5) continue;
    for (let y = Math.floor(yb - th / 2); y <= Math.ceil(yb + th / 2); y++) if (Math.abs(y + .5 - yb) < th / 2) set(x, y, browC);
  }
  // boca
  const lr = ramp('#' + mixA(skin, [192, 71, 95], .55).map(v => v.toString(16).padStart(2, '0')).join('')), teeth = [246, 241, 234];
  for (let y = 70; y < 86; y++) for (let x = 50; x < 78; x++) {
    const dx = x + .5 - 64, dy = y + .5;
    if (Math.abs(dx) > 8) continue;
    const f = (dx / 8) ** 2;
    if (c.mouth === 'sorrisao') {
      const top = 75.6 + f * -.6, bot = 80.4 - f * 3.4;
      if (dy >= top && dy < bot && Math.abs(dx) < 7.6) set(x, y, dy < top + 2 && Math.abs(dx) < 6.4 ? teeth : lr[0]);
      else if (dy >= top - 1.6 && dy < top && Math.abs(dx) < 7) set(x, y, lr[2]);
      else if (dy >= bot && dy < bot + 2.2 - f * 2 && Math.abs(dx) < 6.2) set(x, y, Math.abs(dx) < 2 && dy < bot + 1 ? lr[5] : lr[3]);
    } else {
      const lineY = c.mouth === 'sorriso' ? 77.6 - 1.7 * f : 77.4;
      if (Math.abs(dy - lineY) < .55 && Math.abs(dx) < 7.6) set(x, y, lr[0]);
      else if (dy < lineY && dy >= lineY - 1.6 + f * .8 && Math.abs(dx) < 6.4) set(x, y, Math.abs(Math.abs(dx) - 1.4) < .5 && dy < lineY - 1 ? lr[1] : lr[2]);
      else if (dy > lineY && dy < lineY + 2.6 - f * 2.4 && Math.abs(dx) < 6) set(x, y, Math.abs(dx) < 2 && dy < lineY + 1.4 ? lr[5] : lr[3]);
    }
  }
  // cabelo da frente
  for (let i = 0; i < R * R; i++) if (front[i]) set(i % R, Math.floor(i / R), hairCol(i % R, Math.floor(i / R)));
  if (['longo','ondulado','curto','trancas','chanel'].includes(c.hair)) for (let y = 26; y < 40; y++) if (front[y * R + 63]) { set(63, y, hr[0]); set(64, y, hr[1]); }
  if (c.hair === 'trancas') for (let y = 116; y < 119; y++) for (let x = 0; x < R; x++) { const u = U(x); if ((u >= 17 && u < 21) || (u >= 43 && u < 47)) set(x, y, rgb('#FFB02E')); }
  // acessórios
  const acc = new Set(c.acc), frame = [20, 12, 28];
  if (acc.has('fone')) {
    const gr = ramp('#FFC93C');
    for (let y = 0; y < 76; y++) for (let x = 20; x < 108; x++) {
      const u = U(x), w = U(y), e = Ef(u, w, 32, 25, 16.5, 17.5);
      if (e > 1 && e <= 1.15 && w <= 27) set(x, y, pick(gr, light((u - 32) / 18, (w - 20) / 18), x, y));
      for (const cx of [16.5, 47.5]) { const ce = Ef(u, w, cx, 31.5, 3.6, 6); if (ce <= 1) set(x, y, Math.abs(u - 32) < 15.8 && ce < .75 ? [42, 37, 51] : pick(gr, light((u - cx) / 4, (w - 31.5) / 6), x, y)); }
    }
  }
  if (acc.has('bone')) {
    const br = ramp('#22E3FF');
    for (let y = 6; y < 48; y++) for (let x = 30; x < 98; x++) {
      const u = U(x), w = U(y);
      if (Ef(u, w, 32, 20.5, 14, 12) <= 1 && w < 21) set(x, y, pick(br, light((u - 32) / 15, (w - 14) / 12) - (Math.abs(u - 32) < .5 ? .2 : 0), x, y));
      if (w >= 21 && w < 23.4 && u >= 16 && u < 48) set(x, y, w < 22.2 ? br[2] : br[0]);
    }
    for (const [x, y] of [[63, 17], [64, 17], [63, 18], [64, 18]]) set(x, y, rgb('#FF2E93'));
  }
  if (acc.has('oculos') || acc.has('escuros')) {
    const dark = acc.has('escuros');
    for (const [x0, x1] of [[45, 61], [67, 83]]) for (let y = 48; y <= 61; y++) for (let x = x0; x <= x1; x++) {
      const edge = y <= 49 || y === 61 || x === x0 || x === x1;
      const g = (x - x0) + (y - 48);
      if (edge) set(x, y, frame);
      else if (dark) set(x, y, (g === 5 || g === 6 || g === 8) && y < 55 ? [130, 112, 170] : y < 54 ? [46, 29, 66] : [30, 18, 48]);
      else if ((g === 5 || g === 7) && y < 55) { const p = at(x, y); if (p) set(x, y, mixA(p, [255, 255, 255], .5)); }
    }
    for (let x = 62; x <= 66; x++) set(x, 52, frame);
    for (let x = 40; x <= 44; x++) { set(x, 52, frame); set(R - 1 - x, 52, frame); }
  }
  if (acc.has('brinco')) for (const cx of [41, 86]) for (let y = 66; y < 74; y++) for (let x = cx - 3; x <= cx + 3; x++) { const d = Math.hypot(x + .5 - (cx + .5), y + .5 - 70); if (d > .9 && d < 2.2) set(x, y, d < 1.5 ? [255, 210, 63] : [201, 151, 30]); }
  if (acc.has('piercing')) { set(70, 68, [237, 237, 245]); set(71, 68, [180, 180, 196]); }
  // contorno seletivo (1 px), no tom escuro da cor vizinha
  const add = [];
  for (let y = 0; y < R; y++) for (let x = 0; x < R; x++) {
    if (px[y * R + x]) continue;
    const n = at(x + 1, y) || at(x - 1, y) || at(x, y + 1) || at(x, y - 1);
    if (n) add.push([x, y, sh(n, .36)]);
  }
  add.forEach(([x, y, col]) => set(x, y, col));
  return px;
}
const cache = new Map();
function render(c) {
  const k = JSON.stringify(c); if (cache.has(k)) return cache.get(k);
  const px = build(c), cv = document.createElement('canvas'); cv.width = cv.height = R;
  const ctx = cv.getContext('2d'), img = ctx.createImageData(R, R);
  px.forEach((p, i) => { if (p) { img.data[i * 4] = p[0]; img.data[i * 4 + 1] = p[1]; img.data[i * 4 + 2] = p[2]; img.data[i * 4 + 3] = 255; } });
  ctx.putImageData(img, 0, 0);
  if (cache.size > 200) cache.clear();
  cache.set(k, cv); return cv;
}
function paint(canvas, c, crop) {
  const [sx, sy, s] = crop || [0, 0, R], ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height); ctx.imageSmoothingEnabled = false;
  ctx.drawImage(render(c), sx, sy, s, s, 0, 0, canvas.width, canvas.height);
}


/* ---------- Cenários: as cenas das missões reduzidas a 128 px (viram pixel art ao ampliar) ---------- */
const BG_NAMES = { 1: 'Mercado Público', 2: 'Parque Redenção', 3: 'Beira-Rio', 4: 'Usina do Gasômetro', 5: 'Arena do Grêmio', 6: 'Aeroporto' };
const bgCache = {};
function bgCanvas(n) {
  if (bgCache[n]) return bgCache[n];
  bgCache[n] = new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      const side = Math.min(img.width, img.height), cv = document.createElement('canvas'); cv.width = cv.height = R;
      const ctx = cv.getContext('2d'); ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, R, R);
      resolve(cv);
    };
    img.onerror = () => resolve(null);
    img.src = IMG.scene[n];
  });
  return bgCache[n];
}
/** Personagem sobre o cenário escolhido, num quadrado de `size` px. */
async function compose(c, size = 512) {
  const out = document.createElement('canvas'); out.width = out.height = size;
  const ctx = out.getContext('2d'); ctx.imageSmoothingEnabled = false;
  const bg = await bgCanvas(c.bg || 4);
  if (bg) ctx.drawImage(bg, 0, 0, size, size); else { ctx.fillStyle = '#2B0B4F'; ctx.fillRect(0, 0, size, size); }
  const fade = ctx.createLinearGradient(0, 0, 0, size); fade.addColorStop(.55, 'rgba(26,8,51,0)'); fade.addColorStop(1, 'rgba(26,8,51,.45)');
  ctx.fillStyle = fade; ctx.fillRect(0, 0, size, size);
  ctx.drawImage(render(c), Math.round(size * .08), Math.round(size * .04), Math.round(size * .84), Math.round(size * .96));
  return out;
}
const normalize = c => {
  const base = structuredClone(PRESETS[0]);
  if (!c || typeof c !== 'object') return base;
  const ok = (v, list) => list.some(o => o[0] === v);
  return {
    bg: BG_NAMES[c.bg] ? c.bg : 4,
    skin: Number.isInteger(c.skin) && SKIN[c.skin] ? c.skin : base.skin,
    hair: ok(c.hair, HAIRS) ? c.hair : base.hair,
    hairColor: Number.isInteger(c.hairColor) && c.hairColor >= 0 && c.hairColor < 8 ? c.hairColor : base.hairColor,
    eyes: ok(c.eyes, EYES) ? c.eyes : base.eyes,
    eyeColor: Number.isInteger(c.eyeColor) && EYE[c.eyeColor] ? c.eyeColor : base.eyeColor,
    mouth: ok(c.mouth, MOUTHS) ? c.mouth : base.mouth,
    clothes: ok(c.clothes, CLOTHES) ? c.clothes : base.clothes,
    clothesColor: Number.isInteger(c.clothesColor) && FABRIC[c.clothesColor] ? c.clothesColor : base.clothesColor,
    acc: Array.isArray(c.acc) ? c.acc.filter(a => ok(a, ACCS)).slice(0, 6) : [],
  };
};

/* ---------- Tela "Crie seu personagem" ---------- */
let cfg = normalize(null), tab = 'fundo', drag = null, dragged = false;
const el = id => document.getElementById(id);
const TABS = [['fundo','Fundo'],['pele','Pele'],['cabelo','Cabelo'],['olhos','Olhos'],['boca','Boca'],['roupa','Roupa'],['acessorios','Acessórios']];
const FACE = [32, 32, 64], HEAD = [16, 4, 96];
const optHTML = (g, v, label, on) => `<button type="button" class="av-opt" data-g="${g}" data-v="${v}" aria-pressed="${on}"><canvas width="128" height="128" aria-hidden="true"></canvas><span>${label}</span></button>`;
const swHTML = (g, i, col, on, name) => `<button type="button" class="av-sw" data-g="${g}" data-v="${i}" aria-pressed="${on}" aria-label="${name}" style="background:${col}"></button>`;
const CORES_CABELO = ['Preto', 'Castanho-escuro', 'Castanho', 'Ruivo', 'Loiro', 'Grisalho', 'Rosa', 'Azul'];
const CORES_TECIDO = ['Rosa', 'Ciano', 'Amarelo', 'Roxo', 'Laranja', 'Verde', 'Branco', 'Preto'];
const CORES_OLHO = ['Castanho-escuro', 'Castanho', 'Mel', 'Verde', 'Azul', 'Cinza'];
function renderTabs() { el('av-tabs').innerHTML = TABS.map(([id, n]) => `<button type="button" class="av-tab" role="tab" data-t="${id}" aria-selected="${id === tab}">${n}</button>`).join(''); }
function renderPanel() {
  let h = '';
  if (tab === 'fundo') h = `<h2>Onde você está</h2><div class="av-grid">${Object.entries(BG_NAMES).map(([n, name]) => `<button type="button" class="av-opt av-opt--bg" data-g="bg" data-v="${n}" aria-pressed="${cfg.bg === Number(n)}"><canvas width="128" height="128" data-bg="${n}" aria-hidden="true"></canvas><span>${name}</span></button>`).join('')}</div>`;
  if (tab === 'pele') h = `<h2>Tom de pele</h2><div class="av-sws">${SKIN.map((c, i) => swHTML('skin', i, c, cfg.skin === i, `Tom ${i + 1}`)).join('')}</div>`;
  if (tab === 'cabelo') h = `<h2>Estilo</h2><div class="av-grid">${HAIRS.map(([v, n]) => optHTML('hair', v, n, cfg.hair === v)).join('')}</div>
    <h2>${cfg.hair === 'hijab' ? 'Cor do lenço' : 'Cor'}</h2><div class="av-sws">${(cfg.hair === 'hijab' ? FABRIC : HAIR).map((c, i) => swHTML('hairColor', i, c, cfg.hairColor === i, (cfg.hair === 'hijab' ? CORES_TECIDO : CORES_CABELO)[i])).join('')}</div>`;
  if (tab === 'olhos') h = `<h2>Formato</h2><div class="av-grid">${EYES.map(([v, n]) => optHTML('eyes', v, n, cfg.eyes === v)).join('')}</div>
    <h2>Cor</h2><div class="av-sws">${EYE.map((c, i) => swHTML('eyeColor', i, c, cfg.eyeColor === i, CORES_OLHO[i])).join('')}</div>`;
  if (tab === 'boca') h = `<h2>Boca</h2><div class="av-grid">${MOUTHS.map(([v, n]) => optHTML('mouth', v, n, cfg.mouth === v)).join('')}</div>`;
  if (tab === 'roupa') h = `<h2>Roupa</h2><div class="av-grid">${CLOTHES.map(([v, n]) => optHTML('clothes', v, n, cfg.clothes === v)).join('')}</div>
    <h2>Cor</h2><div class="av-sws">${FABRIC.map((c, i) => swHTML('clothesColor', i, c, cfg.clothesColor === i, CORES_TECIDO[i])).join('')}</div>`;
  if (tab === 'acessorios') h = `<h2>Acessórios</h2><p>Arraste até o personagem ou toque para colocar e tirar.</p><div class="av-grid">${ACCS.map(([v, n]) => optHTML('acc', v, n, cfg.acc.includes(v))).join('')}</div>`;
  el('av-panel').innerHTML = h;
  el('av-panel').querySelectorAll('.av-opt').forEach(b => {
    const g = b.dataset.g, v = b.dataset.v, cv = b.querySelector('canvas');
    if (g === 'bg') { bgCanvas(Number(v)).then(bg => { if (bg) { const x = cv.getContext('2d'); x.imageSmoothingEnabled = false; x.drawImage(bg, 0, 0, cv.width, cv.height); } }); return; }
    const preview = g === 'acc' ? { ...cfg, acc: [v] } : { ...cfg, [g]: v, acc: g === 'clothes' ? cfg.acc : [] };
    paint(cv, preview, g === 'eyes' || g === 'mouth' ? FACE : g === 'clothes' ? null : HEAD);
  });
}
function update() {
  paint(el('av-canvas'), cfg);
  bgCanvas(cfg.bg).then(bg => { if (bg) el('av-mirror').style.backgroundImage = `url(${bg.toDataURL()})`; });
}
function toggleAcc(v) {
  const on = cfg.acc.includes(v);
  cfg.acc = cfg.acc.filter(a => a !== v && !(!on && ((v === 'oculos' && a === 'escuros') || (v === 'escuros' && a === 'oculos'))));
  if (!on) cfg.acc.push(v);
}
const any = a => a[Math.floor(Math.random() * a.length)];
function setup() {
  el('av-tabs').addEventListener('click', e => { const t = e.target.closest('[data-t]'); if (!t) return; tab = t.dataset.t; renderTabs(); renderPanel(); });
  el('av-panel').addEventListener('click', e => {
    const b = e.target.closest('[data-g]'); if (!b || dragged) return;
    const g = b.dataset.g, v = b.dataset.v;
    if (g === 'acc') toggleAcc(v);
    else {
      if (g === 'hair' && (v === 'hijab') !== (cfg.hair === 'hijab')) cfg.hairColor = 0;
      cfg[g] = /Color$|skin|bg/.test(g) ? Number(v) : v;
    }
    update(); renderPanel();
  });
  document.querySelectorAll('[data-av-preset]').forEach(b => b.addEventListener('click', () => { cfg = { ...structuredClone(PRESETS[b.dataset.avPreset]), bg: cfg.bg }; update(); renderPanel(); }));
  el('av-random').addEventListener('click', () => {
    const acc = ACCS.map(a => a[0]).filter(() => Math.random() < .22);
    cfg = normalize({ bg: cfg.bg, skin: Math.floor(Math.random() * SKIN.length), hair: any(HAIRS)[0], hairColor: Math.floor(Math.random() * 8), eyes: any(EYES)[0], eyeColor: Math.floor(Math.random() * EYE.length),
      mouth: any(MOUTHS)[0], clothes: any(CLOTHES)[0], clothesColor: Math.floor(Math.random() * FABRIC.length), acc: acc.includes('oculos') ? acc.filter(a => a !== 'escuros') : acc });
    update(); renderPanel();
  });
  // Arrastar acessórios até o personagem
  el('av-panel').addEventListener('pointerdown', e => { const b = e.target.closest('[data-g=acc]'); if (b) { drag = { v: b.dataset.v, x: e.clientX, y: e.clientY, ghost: null }; dragged = false; } });
  window.addEventListener('pointermove', e => {
    if (!drag) return;
    if (!drag.ghost && Math.hypot(e.clientX - drag.x, e.clientY - drag.y) > 8) {
      dragged = true;
      drag.ghost = document.createElement('div'); drag.ghost.className = 'av-ghost';
      const cv = document.createElement('canvas'); cv.width = cv.height = 128; paint(cv, { ...cfg, acc: [drag.v] }, HEAD);
      drag.ghost.append(cv); document.body.append(drag.ghost); el('av-mirror').classList.add('is-drag');
    }
    if (drag.ghost) {
      e.preventDefault();
      drag.ghost.style.left = e.clientX + 'px'; drag.ghost.style.top = e.clientY + 'px';
      const r = el('av-mirror').getBoundingClientRect();
      el('av-mirror').classList.toggle('is-over', e.clientX > r.left && e.clientX < r.right && e.clientY > r.top && e.clientY < r.bottom);
    }
  }, { passive: false });
  window.addEventListener('pointerup', () => {
    if (!drag) return;
    if (drag.ghost) {
      if (el('av-mirror').classList.contains('is-over') && !cfg.acc.includes(drag.v)) { toggleAcc(drag.v); update(); renderPanel(); }
      drag.ghost.remove(); el('av-mirror').classList.remove('is-over', 'is-drag');
      setTimeout(() => { dragged = false; }, 0);
    }
    drag = null;
  });
}
return {
  setup, compose, paint, normalize,
  load(c) { cfg = normalize(c); tab = 'fundo'; renderTabs(); renderPanel(); update(); },
  get: () => structuredClone(cfg),
};
})();
