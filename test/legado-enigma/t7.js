const GAME = 'file://' + require('path').resolve(__dirname, '../index.html');
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(GAME + '#teste'); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(400);
  await p.click('#btn-start'); await p.waitForTimeout(300); await p.fill('#id-name', 'Teste'); await p.click('#id-form button[type=submit]'); await p.waitForTimeout(300);
  for (let n = 1; n <= 2; n++) {
    await p.click(`[data-chapter="${n}"]`).catch(() => {}); await p.waitForTimeout(300);
    await p.click('#test-fab'); await p.waitForTimeout(400); await p.click('#test-fab'); await p.waitForTimeout(1100);
    await p.click('#fb-action'); await p.waitForTimeout(500);
  }
  await p.click('#fab-main'); await p.waitForTimeout(500);
  const T = await p.evaluate(() => S.tri[3]);
  const msg = async k => (await p.textContent(`#msg-${k}`)).trim();
  const err = () => p.evaluate(() => S.errors[3]);
  console.log('triângulo III', T);
  await p.click('[data-check="lado"]'); console.log('vazio:', await msg('lado'), '| erros', await err());
  await p.fill('#ans-lado', String(T.o ** 2)); await p.press('#ans-lado', 'Enter'); await p.waitForTimeout(200);
  console.log('quadrado:', await msg('lado'), '| erros', await err());
  await p.fill('#ans-lado', String(T.o)); await p.press('#ans-lado', 'Enter'); await p.waitForTimeout(200);
  console.log('lado certo:', await msg('lado'), '| travado?', await p.isDisabled('#ans-lado'), '| foco em', await p.evaluate(() => document.activeElement.id));
  await p.fill('#ans-sen', (T.a / T.h).toFixed(2).replace('.', ',')); await p.click('[data-check="sen"]'); await p.waitForTimeout(200);
  console.log('sen com cosseno:', await msg('sen'));
  await p.fill('#ans-tg', (T.a / T.o).toFixed(2).replace('.', ',')); await p.click('[data-check="tg"]'); await p.waitForTimeout(200);
  console.log('tg invertida:', await msg('tg'), '| erros', await err());
  await p.screenshot({ path: 'p-disco.png', clip: { x: 80, y: 250, width: 860, height: 650 } });
  await p.fill('#ans-sen', (T.o / T.h).toFixed(2).replace('.', ',')); await p.press('#ans-sen', 'Enter'); await p.waitForTimeout(200);
  await p.fill('#ans-cos', (T.a / T.h).toFixed(2).replace('.', ',')); await p.press('#ans-cos', 'Enter'); await p.waitForTimeout(200);
  console.log('verificadas:', await p.evaluate(() => S.checked), '| disco aberto?', await p.evaluate(() => $('dlg-feedback').open));
  await p.fill('#ans-tg', (T.o / T.a).toFixed(2).replace('.', ',')); await p.press('#ans-tg', 'Enter'); await p.waitForTimeout(1300);
  console.log('quarta certa abre o selo?', await p.textContent('#fb-title'), '| erros III', await err());
  await p.click('#fb-action'); await p.waitForTimeout(800);
  console.log('tela:', await p.evaluate(() => screen), '| tentativas na conclusão:', await p.textContent('#st-errors'), '| erros JS:', errs);
  await b.close();
})();
