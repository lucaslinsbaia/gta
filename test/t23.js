const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type() === 'error' && errs.push(m.text()));
  const B = 'http://localhost:3000';
  // gestão
  await p.goto(B + '/gestao'); await p.waitForTimeout(300);
  await p.fill('#login-pwd', 'errada'); await p.click('#login-form button'); await p.waitForTimeout(1200);
  console.log('login errado:', await p.textContent('#login-msg'));
  await p.fill('#login-pwd', 'segredo123'); await p.click('#login-form button'); await p.waitForTimeout(600);
  await p.click('#tab-turmas');
  for (const t of ['102A', '9º B', 'porra', '102 a']) { await p.fill('#t-nome', t); await p.click('#t-form button'); await p.waitForTimeout(400); console.log('turma', t, '→', await p.textContent('#t-msg')); }
  await p.screenshot({ path: 'g-turmas.png', fullPage: true });
  // jogo
  for (const [nome, turma] of [['Lucas', '102A'], ['Ana', ''], ['Bruno', '9º B']]) {
    const g = await ctx.newPage(); g.on('pageerror', e => errs.push(e.message));
    await g.goto(B + '/#teste'); await g.evaluate(() => localStorage.clear()); await g.reload(); await g.waitForTimeout(800);
    console.log('link ranking no início visível:', await g.isVisible('#start-ranking'));
    await g.click('#btn-start'); await g.waitForTimeout(500);
    console.log('select de turma visível:', await g.isVisible('#id-class-select'), 'input visível:', await g.isVisible('#id-class'));
    await g.fill('#id-name', nome);
    if (turma) await g.selectOption('#id-class-select', { label: turma });
    if (nome === 'Lucas') await g.screenshot({ path: 'g-ident.png' });
    await g.click('#id-form button[type=submit]'); await g.waitForTimeout(400);
    await g.click('[data-chapter="1"]'); await g.waitForTimeout(500);
    for (let n = 1; n <= 3; n++) { await g.click('[data-main]'); await g.waitForTimeout(300); await g.click('#test-fab'); await g.waitForSelector('#dlg-feedback[open]'); await g.waitForTimeout(300); await g.click('#fb-action'); await g.waitForTimeout(500); }
    await g.waitForTimeout(800);
    console.log(nome, 'tela', await g.evaluate(() => screen), '| sync:', await g.textContent('#g-sync-text'));
    if (nome === 'Lucas') { await g.reload(); await g.waitForTimeout(600); await g.click('#btn-continue'); await g.waitForTimeout(900); console.log('após recarregar:', await g.textContent('#g-sync-text')); await g.screenshot({ path: 'g-conclusao.png', fullPage: true }); }
    await g.close();
  }
  // gestão: partidas
  await p.reload(); await p.waitForTimeout(800);
  console.log('sem testes:', await p.textContent('#m-empty'), '|', await p.textContent('#m-pub-text'));
  await p.check('#m-teste'); await p.waitForTimeout(500);
  console.log('linhas:', await p.$$eval('#m-body tr', r => r.length), '|', await p.textContent('#m-pub-text'));
  await p.click('#m-publish'); await p.waitForTimeout(600);
  console.log('publicar:', await p.textContent('#app-msg'), '|', await p.textContent('#m-pub-text'));
  await p.selectOption('#m-turma', { label: '102A' }); await p.waitForTimeout(500);
  await p.click('#m-publish'); await p.waitForTimeout(600);
  await p.selectOption('#m-turma', { label: 'Todas as turmas' }); await p.waitForTimeout(500);
  await p.screenshot({ path: 'g-partidas.png', fullPage: true });
  await p.click('#tab-publicados'); await p.waitForTimeout(300);
  console.log('publicados:', await p.$$eval('#u-body tr', r => r.map(x => x.innerText.replace(/\s+/g, ' '))));
  // ranking público
  for (const vp of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    const r = await b.newPage({ viewport: vp }); r.on('pageerror', e => errs.push(e.message));
    await r.goto(B + '/ranking'); await r.waitForTimeout(800);
    console.log(vp.width, 'ranking:', await r.textContent('#r-meta'), await r.$$eval('#f-turma option', o => o.map(x => x.textContent)));
    await r.screenshot({ path: `test/g-ranking-${vp.width}.png`, fullPage: true });
    await r.selectOption('#f-turma', { label: '9º B' }); await r.waitForTimeout(300);
    console.log('  9º B:', await r.textContent('#r-meta'), await r.$$eval('#r-body tr', x => x.map(y => y.innerText.replace(/\s+/g, ' '))));
    console.log('  largura doc:', await r.evaluate(() => document.documentElement.scrollWidth));
    await r.close();
  }
  console.log('erros:', errs);
  await b.close();
})();
