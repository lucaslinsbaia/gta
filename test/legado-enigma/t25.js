const GAME = 'file://' + require('path').resolve(__dirname, '../index.html');
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const errs = [];
  for (const url of ['http://localhost:3000/', GAME + '']) {
    const g = await b.newPage({ viewport: { width: 1440, height: 900 } }); g.on('pageerror', e => errs.push(e.message));
    await g.goto(url); await g.evaluate(() => localStorage.clear()); await g.reload(); await g.waitForTimeout(800);
    await g.click('#btn-start'); await g.waitForTimeout(600);
    console.log(url.slice(0, 22), 'tag:', await g.evaluate(() => document.getElementById('id-class').tagName), 'opções:', await g.$$eval('#id-class option', o => o.map(x => x.textContent)), '| dica:', await g.textContent('#id-class-hint'));
    if (url.startsWith('http')) { await g.fill('#id-name', 'Lucas'); await g.selectOption('#id-class', { label: '9º B' }); await g.screenshot({ path: 'g-ident2.png' });
      await g.click('#id-form button[type=submit]'); await g.waitForTimeout(500); console.log('jogador salvo:', await g.evaluate(() => JSON.stringify(S.player)));
      await g.goto('http://localhost:3000/'); await g.waitForTimeout(800); await g.evaluate(() => show('identificacao')); await g.waitForTimeout(600);
      console.log('lembrou turma:', await g.$eval('#id-class', s => s.options[s.selectedIndex].text)); }
    await g.close();
  }
  console.log('erros', errs); await b.close();
})();
