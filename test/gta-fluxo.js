/* Teste do GTA: sorteios, peças e alternativas, e fluxo completo das 6
   missões no computador (1440 px) e no celular (390 px, com toque).
   Rodar:  cd test && node gta-fluxo.js   (depois de python3 src/build.py) */
const GAME = 'file://' + require('path').resolve(__dirname, '../index.html');
const { chromium } = require('playwright');
/* Fecha o recado da Isa no mapa, se estiver aberto (ele flutua sobre os cards) */
const closeTip = async p => { if (await p.isVisible('#map-tip')) await p.click('#map-tip-close'); };
// No celular o mapa é um carrossel: centraliza o card antes de tocar nele
const openCard = async (p, n) => { await p.evaluate(n => carousel.center(MISSIONS.indexOf(n), false), n); await p.waitForTimeout(80); await p.click(`[data-mission="${n}"]`); };
const closeMTip = async p => { if (await p.isVisible('#m-tip')) await p.click('#m-tip-close'); };
const assert = (ok, msg) => { if (!ok) { console.error('FALHOU:', msg); process.exitCode = 1; } };

(async () => {
  const b = await chromium.launch();

  // 1. Sorteios: 3.000 jornadas por missão
  const p0 = await b.newPage();
  await p0.goto(GAME); await p0.waitForTimeout(400);
  const problems = await p0.evaluate(() => {
    const out = [];
    for (let i = 0; i < 3000; i++) for (const n of MISSIONS) {
      const [A, B] = MISSION[n].stages(MISSION[n].gen());
      const need = A.template.filter(t => typeof t === 'object').map(t => t.slot);
      const pool = [...A.chips];
      need.forEach(v => { const k = pool.indexOf(v); if (k < 0) out.push(`m${n} A: falta a peça ${v}`); else pool.splice(k, 1); });
      if (A.chips.length < need.length + 1) out.push(`m${n} A: sem peça extra`);
      const opts = choiceOptions(B);
      if (opts.length !== 4) out.push(`m${n} B: ${opts.length} alternativas`);
      if (new Set(opts).size !== opts.length) out.push(`m${n} B: alternativas repetidas`);
      if (!opts.includes(round2(B.correct))) out.push(`m${n} B: sem a certa`);
      if (opts.some(v => !(v > 0))) out.push(`m${n} B: alternativa não positiva`);
      if (Math.abs(round2(B.correct) - B.correct) > 1e-9) out.push(`m${n} B: certa com mais de 2 casas`);
    }
    return [...new Set(out)];
  });
  assert(!problems.length, problems.join('; '));
  console.log('sorteios ok');
  await p0.close();

  // 2. Fluxo completo
  for (const vp of [{ width: 1440, height: 900, touch: false }, { width: 390, height: 844, touch: true }]) {
    const ctx = await b.newContext({ viewport: { width: vp.width, height: vp.height }, hasTouch: vp.touch });
    const p = await ctx.newPage();
    const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto(GAME + '#teste'); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(400);
    await p.click('#btn-start'); await p.fill('#id-name', 'Ana'); await p.click('#id-form button[type=submit]'); await p.waitForTimeout(300);
    assert(!(await p.isDisabled('[data-mission="1"]')) && await p.isDisabled('[data-mission="2"]') && await p.isDisabled('[data-mission="5"]'), 'só a primeira missão começa aberta');
    assert(await p.isDisabled('[data-mission="6"]'), 'o Aeroporto começa bloqueado');
    assert(await p.isVisible('#map-tip'), 'o recado da Isa abre sozinho no mapa');
    await p.click('#map-tip-close');
    assert(await p.evaluate(() => document.getElementById('map-avatar-btn').classList.contains('is-pulse')), 'fechado o recado, o avatar pulsa');
    await p.click('#map-avatar-btn'); await p.waitForTimeout(100);
    assert(await p.isVisible('#map-tip'), 'o avatar reabre o recado');
    await p.click('[data-mission="1"]', { force: true }); await p.waitForTimeout(200);
    assert(await p.evaluate(() => screen) === 'mapa' && !(await p.isVisible('#map-tip')), 'tocar fora só fecha o recado, sem abrir a missão');

    // Missão 1: monta a conta errado (1 erro), depois certo por toque e por arrastar; erra 1 alternativa; usa dica → 100 − 20 − 20 = 60
    await closeTip(p); await openCard(p, 1); await p.waitForTimeout(200);
    assert(await p.isVisible('#m-tip'), 'a descrição abre no tooltip na primeira visita');
    await p.waitForTimeout(400);
    const typed = await p.evaluate(() => [document.getElementById('m-tip-text').textContent.length, missionTip.text.length]);
    assert(typed[0] > 0 && typed[0] < typed[1], 'o texto aparece sendo digitado');
    await p.click('#m-tip-close'); await p.waitForTimeout(150);
    assert(!(await p.isVisible('#m-tip')), 'o × fecha a descrição');
    assert(await p.evaluate(() => document.getElementById('m-avatar-btn').classList.contains('is-pulse')), 'fechada a descrição, o avatar pulsa');
    await p.click('#m-avatar-btn'); await p.waitForTimeout(150);
    assert(await p.isVisible('#m-tip'), 'o avatar reabre a descrição');
    await p.click('#m-tip-text'); await p.click('#m-tip-close'); await p.waitForTimeout(150);
    const st = await p.evaluate(() => { const s = currentStage(); return { need: s.template.filter(t => typeof t === 'object').map(t => t.slot), chips: s.chips }; });
    const chipBtn = v => p.locator(`#m-chips .chip:not([hidden])`, { hasText: new RegExp(`^${v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`) }).first();
    // errado: põe uma peça errada na lacuna 2
    const wrongChip = st.chips.find(c => !st.need.includes(c));
    await chipBtn(st.need[0]).click(); await p.click('[data-slot="0"]');
    await chipBtn(wrongChip).click(); await p.click('[data-slot="1"]');
    await p.click('#m-confirm'); await p.waitForTimeout(200);
    assert(await p.isVisible('#dlg-wasted'), 'erro abre a tela wasted');
    assert(await p.isVisible('#wasted-learn'), 'a tela wasted explica a matéria');
    await p.click('#wasted-ok'); await p.waitForTimeout(150);
    assert(!(await p.isVisible('#dlg-wasted')), 'tentar de novo fecha a tela wasted');
    assert(await p.evaluate(() => S.errors[1]) === 1, 'conta errada conta 1 erro');
    assert(await p.evaluate(() => ui.fills[0] != null && ui.fills[1] == null), 'só a peça errada volta pra bandeja');
    // certo: arrasta a peça certa até a lacuna 2
    const from = await chipBtn(st.need[1]).boundingBox(), to = await p.locator('[data-slot="1"]').boundingBox();
    await p.mouse.move(from.x + from.width / 2, from.y + from.height / 2); await p.mouse.down();
    await p.mouse.move(from.x + 30, from.y + 10, { steps: 4 });
    await p.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 8 }); await p.mouse.up();
    await p.waitForTimeout(150);
    assert(await p.evaluate(() => ui.fills[1] != null), 'arrastar coloca a peça na lacuna');
    await p.click('#m-confirm'); await p.waitForTimeout(250);
    assert(await p.evaluate(() => S.stage[1]) === 1, 'conta certa libera a etapa B');
    assert(await p.isVisible('#dlg-learn'), 'acertar a fórmula abre o Entenda a matéria');
    await p.click('#learn-ok'); await p.waitForTimeout(150);
    // etapa B: uma alternativa errada, depois a dica, depois a certa
    const wrongOpt = await p.evaluate(() => S.options[1].find(v => v !== round2(currentStage().correct)));
    await p.click(`#m-options input[value="${wrongOpt}"]`, { force: true }); await p.click('#m-confirm'); await p.waitForTimeout(150);
    await p.click('#wasted-ok'); await p.waitForTimeout(150);
    assert(await p.isDisabled(`#m-options input[value="${wrongOpt}"]`), 'alternativa errada fica desabilitada');
    await p.click('#m-hint-btn'); await p.click('#hint-confirm'); await p.waitForTimeout(150); await p.click('#dlg-hint [data-close]');
    await p.click('#test-fab'); await p.waitForTimeout(250); await p.click('#rw-next'); await p.waitForTimeout(200);

    assert(!(await p.isDisabled('[data-mission="2"]')), 'terminar a 1 libera a 2');
    // Missão 2: 10 erros na conta liberam o "Pular"
    await closeTip(p); await openCard(p, 2); await p.waitForTimeout(200); await closeMTip(p);
    for (let i = 0; i < 10; i++) {
      await p.evaluate(() => { const s = currentStage(); ui.fills = ui.fills.map((_, k) => s.chips.findIndex(c => c !== s.template.filter(t => typeof t === 'object')[k].slot)); });
      await p.click('#m-confirm'); await p.click('#wasted-ok');
    }
    assert(await p.isVisible('#m-skip'), 'pular aparece após 10 erros');
    await p.click('#m-skip'); await p.click('#skip-confirm'); await p.waitForTimeout(200);
    assert(await p.textContent('#wasted-sub') === 'Missão pulada · 0 pts', 'pular abre a tela wasted');
    await p.screenshot({ path: `/home/claude/shots/10-wasted-${vp.width}.png` });
    await p.click('#wasted-ok'); await p.waitForTimeout(200);
    assert(await p.isVisible('#rw-solution'), 'resolução aparece ao pular');
    await p.click('#rw-next'); await p.waitForTimeout(200);

    // Missões 3 a 5 no modo de teste, em sequência: cada uma libera a próxima; depois a 6
    for (const n of [3, 4, 5, 6]) {
      assert(!(await p.isDisabled(`[data-mission="${n}"]`)), `a missão ${n} libera depois da anterior`);
      if (n < 5) assert(await p.isDisabled(`[data-mission="${n + 1}"]`), `a missão ${n + 1} continua bloqueada`);
      if (n === 6) assert(!(await p.isDisabled('[data-mission="6"]')), 'o Aeroporto libera depois das outras 5');
      await closeTip(p); await openCard(p, n); await p.waitForTimeout(150); await closeMTip(p);
      await p.click('#test-fab'); await p.waitForTimeout(150); await p.click('#test-fab'); await p.waitForTimeout(200);
      await p.click('#rw-next'); await p.waitForTimeout(200);
    }
    const r = await p.evaluate(() => [screen, totalPoints(), document.documentElement.scrollWidth]);
    assert(r[0] === 'fim', 'termina na conclusão');
    assert(r[1] === 60 + 0 + 400, `pontos esperados 460, vieram ${r[1]}`);
    assert(r[2] <= vp.width, `sem rolagem lateral em ${vp.width} px`);
    assert(!errs.length, 'erros de JavaScript: ' + errs.join(' | '));
    await p.waitForTimeout(800);
    const shareInfo = await p.evaluate(async () => { const img = await loadImage(share.url); return [share.blob ? share.blob.size : 0, img.naturalWidth, img.naturalHeight]; });
    assert(shareInfo[0] > 50000 && shareInfo[1] === 1080 && shareInfo[2] === 1920, 'gera a imagem do resultado: ' + shareInfo);
    assert(await p.isVisible('#share-save') && await p.isVisible('#share-mail') && !(await p.isVisible('#share-native')), 'sem compartilhar nativo: salvar e e-mail');
    const [dl] = await Promise.all([p.waitForEvent('download'), p.click('#share-save')]);
    assert(/^gta-ana\.png$/.test(dl.suggestedFilename()), 'salvar baixa gta-ana.png, veio ' + dl.suggestedFilename());
    if (vp.width === 1440) await dl.saveAs('/home/claude/shots/30-cartao.png');
    console.log(vp.width, 'fluxo ok', r.slice(0, 2));

    // Sem 3 estrelas: o Aeroporto não libera e dá para finalizar a live com a nota normal
    await p.evaluate(() => { localStorage.clear(); });
    await p.reload(); await p.waitForTimeout(400);
    await p.click('#btn-start'); await p.fill('#id-name', 'Bia'); await p.click('#id-form button[type=submit]'); await p.waitForTimeout(200);
    await p.evaluate(() => { [1, 2, 3].forEach(n => { S.skipped[n] = true; }); [4, 5].forEach(n => { S.done[n] = true; }); save(); show('mapa'); });
    assert(await p.isDisabled('[data-mission="6"]'), 'com 2 estrelas o Aeroporto continua bloqueado');
    assert(await p.isVisible('#map-finish'), 'aparece a opção de finalizar a live');
    await closeTip(p); await p.click('#map-finish-btn'); await p.waitForTimeout(300);
    const f = await p.evaluate(() => [screen, totalPoints(), gradeFrom(totalPoints()), document.getElementById('g-list').textContent.includes('não liberada')]);
    assert(f[0] === 'fim' && f[1] === 200 && f[2] === 5 && f[3], 'finalizar sem o Aeroporto: ' + JSON.stringify(f));
    console.log(vp.width, 'sem estrelas ok', f);
    await ctx.close();
  }
  await b.close();
})();
