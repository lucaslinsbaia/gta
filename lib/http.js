/* Utilidades das funções da API (Vercel Functions, Node). */
export function send(res, status, data) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(data));
}

export async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') { try { return JSON.parse(req.body); } catch { return {}; } }
  let raw = '';
  for await (const chunk of req) { raw += chunk; if (raw.length > 20000) break; }
  try { return JSON.parse(raw || '{}'); } catch { return {}; }
}

/** Envolve o handler: erros viram JSON com mensagem amigável. */
export const handle = fn => async (req, res) => {
  try {
    await fn(req, res);
  } catch (err) {
    if (!err.status || err.status >= 500) console.error(err);
    send(res, err.status || 500, { erro: err.status ? err.message : 'Erro no servidor. Tente de novo em instantes.' });
  }
};

export const fail = (status, message) => Object.assign(new Error(message), { status });

/** Chave de comparação de nomes: minúsculas, sem acentos e com espaços simples. */
export const keyOf = text => String(text).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim();
