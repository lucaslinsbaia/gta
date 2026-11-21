const GAME = 'file://' + require('path').resolve(__dirname, '../index.html');
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(GAME + '#teste'); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(400);
  await p.click('#btn-start'); await p.waitForTimeout(300); await p.fill('#id-name', 'Ana'); await p.click('#id-form button[type=submit]'); await p.waitForTimeout(500);
  const classes = () => p.$$eval('[data-chapter]', l => l.map(x => `${x.dataset.chapter}:${x.className}`).join(' | '));
  console.log('início:', await classes());
  await p.screenshot({ path: 'u-cards1.png', clip: { x: 60, y: 320, width: 1320, height: 500 } });
  // resolve o capítulo I e volta
  await p.click('[data-chapter="1"]'); await p.waitForTimeout(400);
  await p.click('#test-fab'); await p.waitForTimeout(400); await p.click('#test-fab'); await p.waitForTimeout(1100); await p.click('#fb-action'); await p.waitForTimeout(500);
  await p.click('[data-go="capitulos"]'); await p.waitForTimeout(500);
  console.log('após I:', await classes());
  await p.screenshot({ path: 'u-cards2.png', clip: { x: 60, y: 320, width: 1320, height: 500 } });
  console.log('erros:', errs);
  await b.close();
})();
