/* Mesmo cálculo de nota do jogo (SPEC, seção 10.1). O servidor refaz a
   conta a partir dos erros, pulos e dicas, em vez de confiar na nota enviada. */
const GRADE = { weight: { 1: 3, 2: 3, 3: 4 }, errorCost: { 1: 0.5, 2: 0.5, 3: 0.25 }, hintPenalty: 0.5, floor: 5 };

export function concept(grade) {
  if (grade >= 9) return 'Excelente';
  if (grade >= 7) return 'Muito bom';
  return 'Em desenvolvimento';
}

export function gradeFrom({ errors, skipped, hints }) {
  let raw = 0;
  for (const n of [1, 2, 3]) {
    if (skipped[n]) continue;
    const w = GRADE.weight[n];
    raw += Math.max(w / 2, w - GRADE.errorCost[n] * errors[n]);
  }
  if (hints > 0) raw -= GRADE.hintPenalty;
  const grade = Math.round(Math.max(GRADE.floor, raw) * 10) / 10;
  return { grade, concept: concept(grade) };
}
