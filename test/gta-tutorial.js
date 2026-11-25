// Tutorial: convite, tour no mapa e missão de treino guiada (celular e computador)
const { chromium, devices } = require('playwright'); const path = require('path');
const assert = (c, m) => { if (!c) throw new Error('FALHOU: ' + m); };
async function run(ctxOpts, tag, shots) {
  const b = await chromium.launch(); const p = await (await b.newContext(ctxOpts)).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  const shot = async n => { if (shots) await p.screenshot({ path: `/home/claude/shots/tut-${tag}-${n}.png` }); };
  await p.goto('file://' + path.resolve('../index.html')); await p.waitForTimeout(500);
  await p.click('#btn-start'); await p.waitForTimeout(900); await p.fill('#id-name', 'Bia');
  for (let i = 0; i < 3; i++) { await p.click('#id-next'); await p.waitForTimeout(250); }
  await p.waitForSelector('#dlg-tutorial[open]'); await p.waitForTimeout(400); await shot('1-convite');
  assert(await p.isHidden('#map-tip'), 'a fala do mapa espera o convite');
  await p.click('#tut-go'); await p.waitForTimeout(700);
  for (let k = 1; k <= 4; k++) {
    assert(await p.isVisible('#coach-next'), `tour do mapa passo ${k}`);
    await p.waitForTimeout(400); if (k === 1 || k === 3) await shot(`2-tour${k}`);
    await p.click('#coach-next'); await p.waitForTimeout(350);
  }
  await p.waitForTimeout(1300);
  assert(await p.evaluate(() => screen === 'missao' && S.current === 0), 'abre a missão de treino');
  for (let k = 1; k <= 2; k++) { await p.waitForTimeout(300); if (k === 2) await shot('3-treino-dados'); await p.click('#coach-next'); await p.waitForTimeout(300); }
  // passo "do": erra de propósito com o 7
  assert(await p.isHidden('#coach-next'), 'passo de ação sem botão Próximo');
  await shot('4-montar');
  const tap = async v => { await p.click(`#m-chips .chip:not([hidden]) >> text="${v}"`); await p.click('#m-expr .slot:not(.is-filled)'); };
  await tap('3'); await tap('7'); await p.click('#m-confirm');
  await p.waitForSelector('#dlg-wasted[open]'); await p.waitForTimeout(300); await shot('5-wasted');
  assert(await p.evaluate(() => S.errors[0] === 1 && totalPoints() === 0), 'erro do treino não mexe nos pontos');
  await p.click('#wasted-ok'); await p.waitForTimeout(600);
  assert((await p.textContent('#coach-full')).includes('Wasted'), 'Isa explica o wasted');
  await tap('4'); await p.click('#m-confirm');
  await p.waitForSelector('#dlg-learn[open]'); await p.click('#learn-ok'); await p.waitForTimeout(600);
  assert((await p.textContent('#coach-full')).includes('dica'), 'passo da dica');
  await shot('6-dica');
  await p.click('#m-hint-btn'); await p.waitForSelector('#dlg-hint[open]');
  assert(await p.isHidden('#dlg-hint-ask'), 'no treino a dica não pede confirmação');
  await p.keyboard.press('Escape'); await p.waitForTimeout(600);
  assert((await p.textContent('#coach-full')).includes('Etapa 2'), 'passo da múltipla escolha');
  await shot('7-escolha');
  await p.click('#m-options label:has-text("12 azulejos")'); await p.click('#m-confirm');
  await p.waitForSelector('#dlg-reward[open]'); await p.waitForTimeout(300); await shot('8-fim');
  assert((await p.textContent('#rw-title')).includes('Treino concluído'), 'fim do treino');
  await p.click('#rw-next'); await p.waitForTimeout(900);
  const st = await p.evaluate(() => ({ screen, cur: S.current, pts: totalPoints(), done: MISSIONS.filter(finished).length, tut: S.tutorial, seen: localStorage.getItem('gta-glicerio-tutorial'), tip: !document.getElementById('map-tip').hidden }));
  assert(st.screen === 'mapa' && st.cur === 1 && st.pts === 0 && st.done === 0 && st.tut === 'feito' && st.seen === '1', 'volta ao mapa sem pontos ' + JSON.stringify(st));
  // novo jogo no mesmo aparelho: sem convite
  await p.evaluate(() => { S = null; localStorage.removeItem('gta-glicerio-v1'); show('identificacao'); }); await p.waitForTimeout(800);
  for (let i = 0; i < 3; i++) { await p.click('#id-next'); await p.waitForTimeout(250); }
  await p.waitForTimeout(600);
  assert(await p.isHidden('#dlg-tutorial'), 'não convida de novo no mesmo aparelho');
  // "Como jogar" refaz e "Sair do tutorial" volta ao mapa
  await p.click('#map-tip-close').catch(() => {}); await p.click('#map-tutorial-btn'); await p.waitForTimeout(500);
  assert(await p.isVisible('#coach-card'), 'Como jogar reabre o tour');
  await p.click('#coach-exit'); await p.waitForTimeout(400);
  assert(await p.isHidden('#coach') && await p.evaluate(() => screen === 'mapa'), 'sair do tutorial');
  assert(!errs.length, 'erros de página: ' + errs.join(' | '));
  await b.close(); console.log(tag, 'tutorial ok');
}
(async () => {
  await run({ ...devices['Pixel 7'] }, '390', true);
  await run({ viewport: { width: 1440, height: 900 } }, '1440', true);
})().catch(e => { console.error(e.message); process.exit(1); });
