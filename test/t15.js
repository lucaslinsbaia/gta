const GAME = 'file://' + require('path').resolve(__dirname, '../index.html');
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  for (const vp of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    const p = await b.newPage({ viewport: vp });
    const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto(GAME + '#teste'); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(400);
    await p.click('#btn-start'); await p.waitForTimeout(300); await p.fill('#id-name', 'Ana'); await p.click('#id-form button[type=submit]'); await p.waitForTimeout(400);
    for (let n = 1; n <= 3; n++) {
      if (n === 1) { await p.click('[data-chapter="1"]'); await p.waitForTimeout(700); }
      await p.screenshot({ path: `w-main-${n}-${vp.width}.png` });
      await p.click('[data-clue="' + ['canto', 'razoes', 'disco'][n - 1] + '"]'); await p.waitForTimeout(400);
      const clue = (await p.textContent('#clue-title'));
      await p.click('#dlg-clue .btn--gold'); await p.waitForTimeout(300);
      await p.click('[data-main]'); await p.waitForTimeout(500);
      console.log(vp.width, `cap ${n}: pista "${clue}" ok | ponto principal leva a`, await p.evaluate(() => screen));
      await p.click('#test-fab'); await p.waitForSelector('#dlg-feedback[open]'); await p.waitForTimeout(400); await p.click('#fb-action'); await p.waitForTimeout(700);
    }
    console.log('  final:', await p.evaluate(() => screen), '| erros', errs);
    await p.close();
  }
  await b.close();
})();
