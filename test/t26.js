const GAME = 'file://' + require('path').resolve(__dirname, '../index.html');
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const errs = [];
  for (const vp of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    const p = await b.newPage({ viewport: vp }); p.on('pageerror', e => errs.push(e.message));
    await p.goto(GAME + ''); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(400);
    await p.click('#btn-start'); await p.waitForTimeout(300); await p.fill('#id-name', 'Ana'); await p.click('#id-form button[type=submit]'); await p.waitForTimeout(500);
    await p.screenshot({ path: `n-cards-${vp.width}.png` });
    await p.click('[data-chapter="1"]'); await p.waitForTimeout(800);
    await p.screenshot({ path: `n-cena-${vp.width}.png` });
    if (vp.width === 1440) {
      await p.hover('[data-clue="tabua"]'); await p.waitForTimeout(400); await p.screenshot({ path: 'n-hover.png', clip: { x: 0, y: 150, width: 1100, height: 600 } });
      await p.click('[data-clue="medidas"]'); await p.waitForTimeout(400); console.log('corda:', await p.textContent('#clue-text'));
      await p.screenshot({ path: 'n-modal.png' });
    }
    await p.close();
  }
  console.log('erros', errs); await b.close();
})();
