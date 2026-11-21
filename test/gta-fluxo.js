/* Teste do GTA: sorteios (respostas positivas e bem formadas) e fluxo
   completo das 6 missões no computador (1440 px) e no celular (390 px).
   Rodar:  cd test && node gta-fluxo.js   (depois de python3 src/build.py) */
const GAME = 'file://' + require('path').resolve(__dirname, '../index.html');
const { chromium } = require('playwright');
const assert = (ok, msg) => { if (!ok) { console.error('FALHOU:', msg); process.exitCode = 1; } };

(async () => {
  const b = await chromium.launch();

  // 1. Sorteios: 4.000 jornadas por missão
  const p0 = await b.newPage();
  await p0.goto(GAME); await p0.waitForTimeout(400);
  const bad = await p0.evaluate(() => {
    let count = 0;
    for (let i = 0; i < 4000; i++) for (const n of MISSIONS) {
      MISSION[n].stages(MISSION[n].gen()).forEach(s => s.answers.forEach(a => {
        if (!(a > 0) || Math.abs(round2(a) - a) > 1e-9 || !matches(parseDecimal(fmt(a)), s.answers)) count++;
      }));
    }
    return count;
  });
  assert(bad === 0, `${bad} respostas fora da regra (negativas ou com mais de duas casas)`);
  console.log('sorteios ok');
  await p0.close();

  // 2. Fluxo completo
  for (const vp of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    const p = await b.newPage({ viewport: vp });
    const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto(GAME + '#teste'); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(400);
    await p.click('#btn-start'); await p.fill('#id-name', 'Ana'); await p.click('#id-form button[type=submit]'); await p.waitForTimeout(300);
    assert(await p.evaluate(() => screen) === 'mapa', 'depois da identificação vem o mapa');
    assert(await p.isDisabled('[data-mission="2"]'), 'missão 2 começa bloqueada');
    for (let n = 1; n <= 6; n++) {
      await p.click(`[data-mission="${n}"]`); await p.waitForTimeout(150);
      if (n === 1) {   // 2 erros + dica: 100 − 20 − 20 = 60
        await p.fill('#m-input', '0,01'); await p.click('#m-confirm');
        await p.fill('#m-input', '1/2'); await p.click('#m-confirm');      // formato inválido não conta erro
        await p.fill('#m-input', '0,02'); await p.click('#m-confirm');
        await p.click('#m-hint-btn'); await p.click('#hint-confirm'); await p.waitForTimeout(150); await p.click('#dlg-hint [data-close]');
      }
      if (n === 2) {   // 10 erros liberam o "Pular"
        for (let i = 0; i < 10; i++) { await p.fill('#m-input', '0,01'); await p.click('#m-confirm'); }
        assert(await p.isVisible('#m-skip'), 'pular aparece após 10 erros');
        await p.click('#m-skip'); await p.click('#skip-confirm'); await p.waitForTimeout(200);
        assert(await p.isVisible('#rw-solution'), 'resolução aparece ao pular');
      } else {
        await p.click('#test-fab'); await p.waitForTimeout(80); await p.click('#test-fab'); await p.waitForTimeout(200);
      }
      await p.click('#rw-next'); await p.waitForTimeout(200);
    }
    const r = await p.evaluate(() => [screen, totalPoints(), S.errors[1], document.documentElement.scrollWidth]);
    assert(r[0] === 'fim', 'termina na conclusão');
    assert(r[1] === 60 + 0 + 400, `pontos esperados 460, vieram ${r[1]}`);
    assert(r[2] === 2, 'formato inválido não conta como erro');
    assert(r[3] <= vp.width, `sem rolagem lateral em ${vp.width} px`);
    assert(!errs.length, 'erros de JavaScript: ' + errs.join(' | '));
    console.log(vp.width, 'fluxo ok', r.slice(0, 2));
    await p.close();
  }
  await b.close();
})();
