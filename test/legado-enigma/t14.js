const GAME = 'file://' + require('path').resolve(__dirname, '../index.html');
const { chromium } = require('playwright');
const URL = GAME + '#teste';
async function start(p) {
  await p.goto(URL); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(400);
  await p.click('#btn-start'); await p.waitForTimeout(300); await p.fill('#id-name', 'Ana');
  await p.click('#id-form button[type=submit]'); await p.waitForTimeout(400);
}
const closeFb = async p => { await p.waitForSelector('#dlg-feedback[open]'); await p.waitForTimeout(300); await p.click('#fb-action'); await p.waitForTimeout(700); };
async function wrongI(p, value) { await p.fill('#ans-c', String(value)); await p.click('#btn-confirm'); await closeFb(p); }
(async () => {
  const b = await chromium.launch();
  const errs = [];
  // A) tudo certo, sem dica
  let p = await b.newPage({ viewport: { width: 1440, height: 900 } }); p.on('pageerror', e => errs.push(e.message));
  await start(p);
  for (let i = 0; i < 12 && await p.evaluate(() => screen) !== 'conclusao'; i++) {
    if (await p.evaluate(() => $('dlg-feedback').open)) await p.click('#fb-action'); else await p.click('#test-fab');
    await p.waitForTimeout(800);
  }
  console.log('A:', await p.textContent('#g-value'), await p.textContent('#g-concept'), '| estudo visível?', await p.isVisible('#g-study'));
  await p.close();

  // B) erros moderados + dica → 7,3
  p = await b.newPage({ viewport: { width: 1440, height: 900 } }); p.on('pageerror', e => errs.push(e.message));
  await start(p);
  let T = await p.evaluate(() => S.tri);
  await p.click('[data-chapter="1"]'); await p.waitForTimeout(300); await p.click('#fab-main'); await p.waitForTimeout(400);
  await wrongI(p, T[1].c ** 2); await wrongI(p, T[1].a + T[1].b);
  await p.click('#test-fab'); await closeFb(p);                      // I resolvido
  await p.click('#fab-main'); await p.waitForTimeout(400);
  await p.click('[data-slot="sen"]'); await p.click(`[data-frac="${T[2].a}/${T[2].h}"]`); await p.click(`[data-frac="${T[2].o}/${T[2].h}"]`); await p.click(`[data-frac="${T[2].o}/${T[2].a}"]`);
  await p.click('#btn-confirm'); await closeFb(p);
  await p.click('#test-fab'); await closeFb(p);                      // II resolvido
  await p.click('#fab-main'); await p.waitForTimeout(400);
  console.log('B dica antes:', await p.textContent('#btn-hint-text'));
  await p.click('#btn-hint'); await p.waitForTimeout(200);
  for (const v of [T[3].o ** 2, 1, 2]) { await p.fill('#ans-lado', String(v)); await p.press('#ans-lado', 'Enter'); await p.waitForTimeout(150); }
  await p.click('#test-fab'); await closeFb(p);
  console.log('B:', await p.textContent('#g-value'), await p.textContent('#g-concept'), '| detalhe:', (await p.innerText('#g-breakdown')).replace(/\s+/g, ' '), '| estudo?', await p.isVisible('#g-study'));
  await p.screenshot({ path: 'v-nota-b.png', fullPage: true });
  await p.close();

  // C) pula o I, muitos erros no II → 5,5 e estudo
  p = await b.newPage({ viewport: { width: 1440, height: 900 } }); p.on('pageerror', e => errs.push(e.message));
  await start(p);
  T = await p.evaluate(() => S.tri);
  await p.click('[data-chapter="1"]'); await p.waitForTimeout(300); await p.click('#fab-main'); await p.waitForTimeout(400);
  for (let i = 0; i < 10; i++) {
    if (i === 9) console.log('C pular antes do 10º erro?', await p.isVisible('#btn-skip'));
    await wrongI(p, T[1].c ** 2);
  }
  console.log('C pular após 10 erros?', await p.isVisible('#btn-skip'));
  await p.click('#btn-skip'); await p.waitForTimeout(400);
  console.log('C confirmação:', await p.textContent('#skip-text'));
  await p.click('#skip-confirm'); await p.waitForSelector('#dlg-feedback[open]'); await p.waitForTimeout(500);
  console.log('C modal:', (await p.innerText('#dlg-feedback')).replace(/\s+/g, ' ').slice(0, 200));
  await p.screenshot({ path: 'v-pulo.png' });
  await p.click('#fb-action'); await p.waitForTimeout(700);
  await p.click('#fab-main'); await p.waitForTimeout(400);
  for (let i = 0; i < 6; i++) {
    await p.click('[data-slot="sen"]'); await p.click(`[data-frac="${T[2].h}/${T[2].o}"]`); await p.click(`[data-frac="${T[2].a}/${T[2].h}"]`); await p.click(`[data-frac="${T[2].o}/${T[2].a}"]`);
    await p.click('#btn-confirm'); await closeFb(p);
  }
  await p.click('#test-fab'); await closeFb(p);
  await p.click('#fab-main'); await p.waitForTimeout(400); await p.click('#test-fab'); await closeFb(p);
  console.log('C:', await p.textContent('#g-value'), await p.textContent('#g-concept'), '| selos', await p.textContent('#st-seals'), '| detalhe:', (await p.innerText('#g-breakdown')).replace(/\s+/g, ' '));
  console.log('C estudo:', (await p.innerText('#g-study')).replace(/\s+/g, ' ').slice(0, 600));
  console.log('C resultado salvo:', JSON.stringify(await p.evaluate(() => ({ grade: S.result.grade, concept: S.result.concept, skipped: S.skipped }))));
  await p.screenshot({ path: 'v-nota-c.png', fullPage: true });
  await p.setViewportSize({ width: 390, height: 844 }); await p.waitForTimeout(300);
  console.log('largura celular:', await p.evaluate(() => document.documentElement.scrollWidth));
  await p.screenshot({ path: 'v-nota-c-390.png', fullPage: true });
  console.log('erros JS:', errs);
  await b.close();
})();
