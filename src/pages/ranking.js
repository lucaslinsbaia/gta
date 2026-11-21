/* Ranking público: lê as publicações feitas na gestão. */
let pubs = [];
const params = new URLSearchParams(location.search);

function rowHtml(e) {
  return `<tr class="${e.pos <= 3 ? 'is-top' : ''}">
    <td class="pos" data-label="Posição">${e.pos}º</td>
    <td class="name" data-label="Participante">${escapeHtml(e.nome)}</td>
    <td data-label="Turma">${escapeHtml(e.turma || 'Sem turma')}</td>
    <td class="num grade-cell" data-label="Nota">${fmtGrade(e.nota)}</td>
    <td data-label="Conceito">${escapeHtml(e.conceito)}${e.pulados ? ` <span class="tag">${e.pulados} pulado${e.pulados > 1 ? 's' : ''}</span>` : ''}</td>
    <td class="num" data-label="Tentativas incorretas">${e.erros}</td>
    <td class="num" data-label="Dicas">${e.dicas}</td>
    <td class="num" data-label="Tempo">${fmtTime(e.tempoMs)}</td>
  </tr>`;
}

/** Opções de turma do dia: "Todas" (se houver publicação geral) e cada turma publicada ou presente nela. */
function turmaOptions(day) {
  const list = pubs.filter(p => p.dia === day);
  const geral = list.find(p => !p.turma);
  const names = new Set(list.filter(p => p.turma).map(p => p.turma.nome));
  if (geral) geral.entradas.forEach(e => names.add(e.turma || 'Sem turma'));
  const opts = [];
  if (geral) opts.push({ value: '', label: 'Todas as turmas' });
  [...names].sort((a, b) => a.localeCompare(b, 'pt-BR', { numeric: true })).forEach(n => opts.push({ value: n, label: n }));
  return opts;
}

function entriesFor(day, turma) {
  const list = pubs.filter(p => p.dia === day);
  if (!turma) { const g = list.find(p => !p.turma); return g ? { pub: g, entradas: g.entradas } : null; }
  const own = list.find(p => p.turma && p.turma.nome === turma);
  if (own) return { pub: own, entradas: own.entradas };
  const g = list.find(p => !p.turma);
  if (!g) return null;
  const entradas = g.entradas.filter(e => (e.turma || 'Sem turma') === turma).map((e, i) => ({ ...e, pos: i + 1 }));
  return { pub: g, entradas };
}

function renderTurmas() {
  const opts = turmaOptions($('f-dia').value);
  const keep = $('f-turma').value || params.get('turma') || '';
  $('f-turma').innerHTML = opts.map(o => `<option value="${escapeHtml(o.value)}">${escapeHtml(o.label)}</option>`).join('');
  $('f-turma').value = opts.some(o => o.value === keep) ? keep : opts[0].value;
}

function renderTable() {
  const day = $('f-dia').value, turma = $('f-turma').value;
  const data = entriesFor(day, turma);
  const rows = data ? data.entradas : [];
  $('r-body').innerHTML = rows.map(rowHtml).join('');
  $('r-table').hidden = !rows.length;
  $('r-empty').hidden = rows.length > 0;
  $('r-empty').textContent = 'Nenhum participante nesta seleção.';
  $('r-meta').textContent = data
    ? `${rows.length} participante${rows.length === 1 ? '' : 's'} · ${turma || 'todas as turmas'} · publicado em ${fmtStamp(data.pub.publicadaEm)}`
    : '';
  const q = new URLSearchParams({ dia: day, ...(turma ? { turma } : {}) });
  history.replaceState(null, '', `${location.pathname}?${q}`);
}

async function load() {
  try {
    const res = await fetch('/api/ranking', { headers: { Accept: 'application/json' } });
    const data = await res.json();
    if (!res.ok) throw new Error(data.erro);
    pubs = data.publicacoes || [];
  } catch (e) {
    $('r-meta').textContent = '';
    $('r-empty').hidden = false;
    $('r-empty').textContent = 'Não foi possível carregar o ranking agora. Tente de novo em instantes.';
    return;
  }
  const days = [...new Set(pubs.map(p => p.dia))];
  if (!days.length) {
    $('r-meta').textContent = '';
    $('r-empty').hidden = false;
    $('r-empty').textContent = 'Nenhum ranking foi publicado ainda. Assim que o professor publicar, ele aparece aqui.';
    return;
  }
  $('f-dia').innerHTML = days.map(d => `<option value="${d}">${fmtDay(d)}</option>`).join('');
  if (days.includes(params.get('dia'))) $('f-dia').value = params.get('dia');
  $('r-filters').hidden = false;
  renderTurmas();
  renderTable();
}

$('f-dia').addEventListener('change', () => { $('f-turma').value = ''; renderTurmas(); renderTable(); });
$('f-turma').addEventListener('change', renderTable);
load();
