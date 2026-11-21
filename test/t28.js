const GAME = 'file://' + require('path').resolve(__dirname, '../index.html');
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const errs = [];
  for (const vp of [{ width: 390, height: 844 }, { width: 1440, height: 900 }]) {
    const p = await b.newPage({ viewport: vp }); p.on('pageerror', e => errs.push(e.message));
    await p.goto(GAME + ''); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(400);
    await p.click('#btn-start'); await p.waitForTimeout(300); await p.fill('#id-name', 'Ana'); await p.click('#id-form button[type=submit]'); await p.waitForTimeout(400);
    await p.click('[data-chapter="1"]'); await p.waitForTimeout(600); await p.click('[data-main]'); await p.waitForTimeout(700);
    const pos = async () => p.evaluate(() => { const r = document.getElementById('btn-confirm').getBoundingClientRect(); return [Math.round(r.top), Math.round(r.bottom), Math.round(r.width), getComputedStyle(document.getElementById('btn-confirm')).position]; });
    console.log(vp.width, 'topo:', await pos());
    await p.screenshot({ path: `f-enigma-${vp.width}.png` });
    await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight)); await p.waitForTimeout(300);
    console.log(vp.width, 'rolado:', await pos());
    if (vp.width === 390) {
      await p.screenshot({ path: 'f-enigma-390-fim.png' });
      const T = await p.evaluate(() => S.tri[1]); await p.fill('#ans-c', String(T.c)); await p.click('#btn-confirm'); await p.waitForTimeout(800);
      console.log('confirmou:', await p.isVisible('#dlg-feedback'));
      await p.click('#fb-action'); await p.waitForTimeout(600);
      console.log('após sair do enigma, classe:', await p.evaluate(() => document.body.classList.contains('is-enigma')));
    }
    await p.close();
  }
  console.log('erros', errs); await b.close();
})();
