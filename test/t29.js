const GAME = 'file://' + require('path').resolve(__dirname, '../index.html');
const { chromium, devices } = require('playwright');
(async () => {
  const b = await chromium.launch(); const errs = [];
  for (const ctxOpt of [{ ...devices['iPhone 13'] }, { viewport: { width: 1440, height: 900 } }]) {
    const ctx = await b.newContext(ctxOpt); const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
    await p.goto(GAME + '#teste'); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(400);
    await p.click('#btn-start'); await p.waitForTimeout(300); await p.fill('#id-name', 'Ana'); await p.click('#id-form button[type=submit]'); await p.waitForTimeout(400);
    await p.click('[data-chapter="1"]'); await p.waitForTimeout(500);
    for (let n = 1; n <= 2; n++) { await p.click('[data-main]'); await p.waitForTimeout(300); await p.click('#test-fab'); await p.waitForSelector('#dlg-feedback[open]'); await p.waitForTimeout(300); await p.click('#fb-action'); await p.waitForTimeout(500); }
    await p.click('[data-main]'); await p.waitForTimeout(600);
    const vis = await p.isVisible('[data-slash="sen"]');
    console.log(ctxOpt.viewport.width, 'botão / visível:', vis, '| campos com botão:', await p.$$eval('[data-slash]', x => x.map(y => y.dataset.slash)));
    if (vis) {
      const T = await p.evaluate(() => S.tri[3]);
      await p.tap('#ans-sen'); await p.keyboard.type(String(T.o));
      await p.tap('[data-slash="sen"]'); await p.keyboard.type(String(T.h));
      console.log('  valor:', await p.inputValue('#ans-sen'), '| esperado', `${T.o}/${T.h}`, '| foco no campo:', await p.evaluate(() => document.activeElement.id), '| salvo:', await p.evaluate(() => S.answers[3].sen));
      await p.tap('[data-slash="sen"]'); console.log('  segunda barra ignorada:', await p.inputValue('#ans-sen'));
      await p.screenshot({ path: 'h-barra-mobile.png' });
      await p.tap('[data-check="sen"]'); await p.waitForTimeout(300); console.log('  conferência:', await p.textContent('#msg-sen'));
    }
    await ctx.close();
  }
  console.log('erros', errs); await b.close();
})();
