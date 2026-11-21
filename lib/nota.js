/* Mesma pontuação do jogo (docs/SPEC-gta.md, seção 3). O servidor refaz a
   conta a partir dos erros, dicas e pulos de cada missão, em vez de confiar
   no total enviado pelo navegador. */
export const MISSIONS = [1, 2, 3, 4, 5, 6];
const SCORE = { base: 100, error: 10, hint: 20, floor: 50 };

export function concept(grade) {
  if (grade >= 9) return 'Excelente';
  if (grade >= 7) return 'Muito bom';
  return 'Em desenvolvimento';
}

export function starsFor(points) {
  if (points >= 540) return 5;
  if (points >= 450) return 4;
  if (points >= 360) return 3;
  if (points >= 240) return 2;
  return points > 0 ? 1 : 0;
}

/** errors, skipped e hints são objetos { 1..6 }. Devolve pontos, estrelas, nota e conceito. */
export function scoreFrom({ errors, skipped, hints }) {
  let points = 0;
  for (const n of MISSIONS) {
    if (skipped[n]) continue;
    points += Math.max(SCORE.floor, SCORE.base - SCORE.error * errors[n] - (hints[n] ? SCORE.hint : 0));
  }
  const grade = Math.max(5, Math.round(points / 6) / 10);
  return { points, stars: starsFor(points), grade, concept: concept(grade) };
}
