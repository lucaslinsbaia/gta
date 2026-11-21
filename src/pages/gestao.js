/* Área de gestão: turmas, partidas do dia e publicação do ranking. */
/*__FILTRO__*/
const TOKEN_KEY = 'enigma-gestao-token';
let token = null;
try { token = sessionStorage.getItem(TOKEN_KEY); } catch (e) { /* sem armazenamento */ }
let painel = { turmas: [], dias: [], publicacoes: [] };
let atual = { ranking: [], publicacoes: [] };

async function api(acao, dados = {}) {
  const res = await fetch('/api/admin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify({ acao, ...dados })
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && acao !== 'entrar') { logout(data.erro); throw new Error(data.erro); }
  if (!res.ok) throw new Error(data.erro || 'Algo deu errado. Tente de novo.');
  return data;
}

function setMsg(id, text, kind) {
  const el = $(id);
  el.textContent = text || '';
  el.classList.toggle('is-error', kind === 'error');
  el.classList.toggle('is-ok', kind === 'ok');
}

function showView(name) {
  $('v-login').hidden = name !== 'login';
  $('v-app').hidden = name !== 'app';
  $('g-logout').hidden = name !== 'app';
}

function logout(reason) {
  token = null;
  try { sessionStorage.removeItem(TOKEN_KEY); } catch (e) { /* ok */ }
  showView('login');
  setMsg('login-msg', reason || '', reason ? 'error' : null);
  $('login-pwd').value = '';
  $('login-pwd').focus();
}

$('login-form').addEventListener('submit', async event => {
  event.preventDefault();
  const senha = $('login-pwd').value;
  if (!senha) { setMsg('login-msg', 'Digite a senha.', 'error'); return; }
  setMsg('login-msg', 'Entrando…');
  try {
    const data = await api('entrar', { senha });
    token = data.token;
    try { sessionStorage.setItem(TOKEN_KEY, token); } catch (e) { /* ok */ }
    setMsg('login-msg', '');
    await start();
  } catch (e) {
    setMsg('login-msg', e.message, 'error');
    $('login-pwd').select();
  }
});
$('g-logout').addEventListener('click', () => logout());

/* --- Abas --- */
const TABS = ['partidas', 'turmas', 'publicados'];
function selectTab(name) {
  TABS.forEach(t => {
    $(`tab-${t}`).setAttribute('aria-selected', String(t === name));
    $(`p-${t}`).hidden = t !== name;
  });
  setMsg('app-msg', '');
}
TABS.forEach(t => $(`tab-${t}`).addEventListener('click', () => selectTab(t)));

async function loadPainel() {
  painel = await api('painel');
  renderTurmas();
  renderPublicados();
  renderFiltros();
}

/* --- Turmas --- */
function renderTurmas() {
  const list = painel.turmas;
  $('t-table').hidden = !list.length;
  $('t-empty').hidden = list.length > 0;
  $('t-body').innerHTML = list.map(t => `<tr>
    <td class="name" data-label="Turma">${escapeHtml(t.nome)}</td>
    <td data-label="Situação">${t.ativa ? 'Ativa · aparece no jogo' : 'Arquivada'}</td>
    <td class="num" data-label="Partidas">${t.partidas}</td>
    <td class="actions"><button type="button" class="link-btn" data-toggle="${t.id}" data-ativa="${t.ativa ? 0 : 1}">${t.ativa ? 'Arquivar' : 'Reativar'}</button>${t.partidas ? '' : `<button type="button" class="link-btn" data-del-turma="${t.id}">Excluir</button>`}</td>
  </tr>`).join('');
}

$('t-form').addEventListener('submit', async event => {
  event.preventDefault();
  const nome = $('t-nome').value.trim().replace(/\s+/g, ' ');
  const problem = !nome ? 'Digite o nome da turma.' : classProblem(nome);
  if (problem) { setMsg('t-msg', problem, 'error'); $('t-nome').focus(); return; }
  try {
    await api('criarTurma', { nome });
    $('t-nome').value = '';
    setMsg('t-msg', `Turma “${nome}” criada. Ela já aparece na tela de identificação do jogo.`, 'ok');
    await loadPainel();
  } catch (e) { setMsg('t-msg', e.message, 'error'); }
});

$('t-body').addEventListener('click', async event => {
  const toggle = event.target.closest('[data-toggle]'), del = event.target.closest('[data-del-turma]');
  try {
    if (toggle) await api('turmaAtiva', { id: Number(toggle.dataset.toggle), ativa: toggle.dataset.ativa === '1' });
    if (del) {
      const t = painel.turmas.find(x => x.id === Number(del.dataset.delTurma));
      if (!confirm(`Excluir a turma “${t.nome}”?`)) return;
      await api('excluirTurma', { id: t.id });
    }
    if (toggle || del) await loadPainel();
  } catch (e) { setMsg('t-msg', e.message, 'error'); }
});

/* --- Partidas e publicação --- */
function renderFiltros() {
  const dia = $('m-dia').value, turma = $('m-turma').value;
  $('m-dia').innerHTML = painel.dias.length
    ? painel.dias.map(d => `<option value="${d.dia}">${fmtDay(d.dia, false)} · ${d.partidas} partida${d.partidas === 1 ? '' : 's'}</option>`).join('')
    : '<option value="">Sem partidas ainda</option>';
  if (painel.dias.some(d => d.dia === dia)) $('m-dia').value = dia;
  $('m-turma').innerHTML = '<option value="todas">Todas as turmas</option>' +
    painel.turmas.map(t => `<option value="${t.id}">${escapeHtml(t.nome)}${t.ativa ? '' : ' (arquivada)'}</option>`).join('') +
    '<option value="sem">Sem turma</option>';
  if ([...$('m-turma').options].some(o => o.value === turma)) $('m-turma').value = turma;
  loadPartidas();
}

async function loadPartidas() {
  const dia = $('m-dia').value;
  if (!dia) {
    $('m-table').hidden = true; $('m-pub').hidden = true;
    $('m-empty').hidden = false;
    $('m-empty').textContent = 'Nenhuma partida registrada ainda. Os resultados chegam aqui quando os alunos concluem a jornada.';
    return;
  }
  try {
    atual = await api('partidas', { dia, turma: $('m-turma').value, incluirTeste: $('m-teste').checked });
  } catch (e) { setMsg('app-msg', e.message, 'error'); return; }
  const rows = atual.ranking;
  $('m-table').hidden = !rows.length;
  $('m-empty').hidden = rows.length > 0;
  $('m-empty').textContent = 'Nenhuma partida nesta seleção.';
  $('m-body').innerHTML = rows.map(r => `<tr class="${r.pos <= 3 ? 'is-top' : ''}">
    <td class="pos" data-label="Posição">${r.pos}º</td>
    <td class="name" data-label="Participante">${escapeHtml(r.nome)}${r.teste ? '<span class="tag">teste</span>' : ''}</td>
    <td data-label="Turma">${escapeHtml(r.turma || (r.turma_texto ? `${r.turma_texto} (não cadastrada)` : 'Sem turma'))}</td>
    <td class="num grade-cell" data-label="Pontos">${r.pontos}</td>
    <td class="num" data-label="Nota">${fmtGrade(r.nota)}</td>
    <td class="num" data-label="Erros">${r.erros}</td>
    <td class="num" data-label="Dicas">${r.dicas}</td>
    <td class="num" data-label="Tempo">${fmtTime(r.tempo_ms)}</td>
    <td class="num" data-label="Partidas">${r.partidas}</td>
    <td class="actions"><button type="button" class="link-btn" data-del="${r.id}" data-nome="${escapeHtml(r.nome)}">Excluir partida</button></td>
  </tr>`).join('');
  renderPubBox(rows.length);
}

function renderPubBox(count) {
  const turma = $('m-turma').value;
  const box = $('m-pub');
  if (turma === 'sem') {
    box.hidden = false;
    $('m-pub-text').textContent = 'Para publicar, escolha “Todas as turmas” ou uma turma cadastrada.';
    $('m-publish').hidden = true; $('m-unpublish').hidden = true;
    return;
  }
  const turmaId = turma === 'todas' ? null : Number(turma);
  const pub = atual.publicacoes.find(p => (p.turma_id || null) === turmaId);
  const escopo = turmaId ? `da turma ${painel.turmas.find(t => t.id === turmaId)?.nome}` : 'de todas as turmas';
  box.hidden = false;
  $('m-publish').hidden = !count;
  $('m-publish').textContent = pub ? 'Atualizar publicação' : 'Publicar ranking';
  $('m-unpublish').hidden = !pub;
  $('m-unpublish').dataset.id = pub ? pub.id : '';
  $('m-pub-text').textContent = pub
    ? `Ranking ${escopo} publicado em ${fmtStamp(pub.publicada_em)}. Partidas novas só entram quando você atualizar a publicação.`
    : count ? `O ranking ${escopo} deste dia ainda não foi publicado. Os alunos só veem depois da publicação.` : 'Sem partidas para publicar.';
}

['m-dia', 'm-turma', 'm-teste'].forEach(id => $(id).addEventListener('change', loadPartidas));

$('m-publish').addEventListener('click', async () => {
  const turma = $('m-turma').value;
  try {
    const { publicacao } = await api('publicar', { dia: $('m-dia').value, turmaId: turma === 'todas' ? null : Number(turma), incluirTeste: $('m-teste').checked });
    setMsg('app-msg', `Ranking publicado com ${publicacao.total} participante${publicacao.total === 1 ? '' : 's'}.`, 'ok');
    await loadPainel();
  } catch (e) { setMsg('app-msg', e.message, 'error'); }
});

$('m-unpublish').addEventListener('click', async () => {
  if (!confirm('Despublicar este ranking? Os alunos deixam de vê-lo.')) return;
  try {
    await api('despublicar', { id: Number($('m-unpublish').dataset.id) });
    setMsg('app-msg', 'Ranking despublicado.', 'ok');
    await loadPainel();
  } catch (e) { setMsg('app-msg', e.message, 'error'); }
});

$('m-body').addEventListener('click', async event => {
  const btn = event.target.closest('[data-del]');
  if (!btn) return;
  if (!confirm(`Excluir esta partida de ${btn.dataset.nome}? Se houver outra partida no dia, a próxima melhor pontuação assume o lugar.`)) return;
  try {
    await api('excluirPartida', { id: btn.dataset.del });
    setMsg('app-msg', 'Partida excluída. Se o ranking já estava publicado, atualize a publicação.', 'ok');
    await loadPainel();
  } catch (e) { setMsg('app-msg', e.message, 'error'); }
});

/* --- Publicados --- */
function renderPublicados() {
  const list = painel.publicacoes;
  $('u-table').hidden = !list.length;
  $('u-empty').hidden = list.length > 0;
  $('u-body').innerHTML = list.map(p => {
    const q = new URLSearchParams({ dia: p.dia, ...(p.turma_nome ? { turma: p.turma_nome } : {}) });
    return `<tr>
      <td class="name" data-label="Data">${fmtDay(p.dia, false)}</td>
      <td data-label="Turma">${escapeHtml(p.turma_nome || 'Todas as turmas')}</td>
      <td class="num" data-label="Participantes">${p.total}</td>
      <td data-label="Publicado em">${fmtStamp(p.publicada_em)}</td>
      <td class="actions"><a class="link-btn" href="/ranking?${q}" target="_blank" rel="noopener">Ver</a><button type="button" class="link-btn" data-unpub="${p.id}">Despublicar</button></td>
    </tr>`;
  }).join('');
}

$('u-body').addEventListener('click', async event => {
  const btn = event.target.closest('[data-unpub]');
  if (!btn || !confirm('Despublicar este ranking? Os alunos deixam de vê-lo.')) return;
  try {
    await api('despublicar', { id: Number(btn.dataset.unpub) });
    setMsg('app-msg', 'Ranking despublicado.', 'ok');
    await loadPainel();
  } catch (e) { setMsg('app-msg', e.message, 'error'); }
});

async function start() {
  showView('app');
  selectTab('partidas');
  try { await loadPainel(); } catch (e) { if (token) setMsg('app-msg', e.message, 'error'); }
}

if (token) start(); else logout();
