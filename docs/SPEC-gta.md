# SPEC: GTA (Geometria, Trigonometria e Álgebra), Missões do Glicério

**Versão:** 0.1 (rascunho) · **Data:** 21/11/2026
**Público:** 2º e 3º ano do ensino médio da escola Glicério.
**Base técnica:** O Enigma de Pitágoras (ver `SPEC-enigma-de-pitagoras.md`).

## 1. Estrutura

- **6 missões**, 2 por área, liberadas **em sequência**: concluir (ou pular) uma missão libera a próxima. O mapa mostra as missões bloqueadas.
- A tela inicial é a **colagem tipo pôster**: cada missão é um painel da cidade, e o painel "acende" quando a missão é concluída.
- Cada missão tem: **briefing** (o personagem explica a situação), **pistas** na cena, **desafio em 2 etapas** (A e B) e **recompensa** (pontos e estrelas).

## 2. Missões

**Regra geral:** nenhuma resposta pode ser negativa. Os sorteios abaixo garantem respostas positivas. Respostas digitadas continuam sendo inteiro ou decimal com até duas casas, com tolerância de 0,01.

| # | Área | Missão | Assunto | Etapa A | Etapa B |
|---|------|--------|---------|---------|---------|
| 1 | Geometria | Obra na Laje | Áreas e volumes | Área da base da caixa d'água (m²) | Volume em litros |
| 2 | Geometria | Rolê no Mapa | Geometria analítica | Coordenada x do ponto médio entre dois pontos | Distância entre os pontos (quarteirões) |
| 3 | Trigonometria | Torre da Orla | Lei dos senos e dos cossenos | Lei dos senos: lado oposto a 90°, com o oposto a 30° dado | Lei dos cossenos: distância entre duas jangadas (ângulo de 60°) |
| 4 | Trigonometria | Roda-Gigante | Ciclo trigonométrico e função seno | Altura máxima da cadeira | Altura da cadeira num ângulo do ciclo |
| 5 | Álgebra | Food Truck | Função quadrática | Preço que dá o lucro máximo (vértice) | Lucro máximo |
| 6 | Álgebra | Festa da Formatura | PA e PG | PA: cadeiras na fileira n | PG: convites enviados na rodada n |

### Sorteio por missão (por jornada)

1. **Obra na Laje.**
   - Dados: caixa cilíndrica com raio r ∈ {0,5; 0,6; 0,8; 1,0} m e altura h ∈ {1,0; 1,2; 1,5; 2,0} m. Usar π = 3,14.
   - A = 3,14 · r², arredondada a 2 casas.
   - B = A · h · 1000 litros.
2. **Rolê no Mapa.**
   - Dados: pontos A e B com coordenadas de 0 a 20. As diferenças (Δx, Δy) vêm de ternas {(3,4), (6,8), (5,12), (8,6), (4,3)}, para a distância dar inteira.
   - A = (x₁ + x₂) / 2.
   - B = √(Δx² + Δy²).
3. **Torre da Orla.**
   - A: lado d ∈ {4, 6, 7, 9} oposto a 30°. Resposta: 2d.
   - B: distâncias a e b da torre até as jangadas e ângulo de 60° entre elas. Pares (a, b, c) de {(3,8,7), (5,8,7), (7,15,13), (8,15,13), (5,21,19)}. Resposta: c, com c² = a² + b² − ab.
4. **Roda-Gigante.**
   - Dados: raio R ∈ {8, 10, 12, 15} m e centro a R + 1 m do chão.
   - A = 2R + 1.
   - B: ângulo θ ∈ {30°, 90°, 150°, 210°, 270°, 330°}. Resposta: h = R + 1 + R · sen θ, sempre ≥ 1.
5. **Food Truck.**
   - Dados: L(p) = −p² + k·p − c, com k ∈ {16, 20, 24, 28} e c sorteado entre 10 e k²/4 − 10.
   - A = k/2.
   - B = k²/4 − c, sempre positivo.
6. **Festa da Formatura.**
   - A: 1ª fileira com a₁ ∈ {8, 10, 12} cadeiras e razão r ∈ {2, 3, 4}. Pergunta sobre a fileira n ∈ {6, 8, 10}. Resposta: a₁ + (n − 1)·r.
   - B: a₁ ∈ {2, 3} convites e razão q ∈ {2, 3}. Pergunta sobre a rodada n ∈ {4, 5}. Resposta: a₁ · qⁿ⁻¹.

**Exemplos nas instruções:** conferir contra todas as respostas possíveis do sorteio, para não coincidirem (ver HANDOFF, "Respostas visíveis").

## 3. Pontuação

- Cada missão vale **100 pontos** (total 600).
- **Erro:** −10 por resposta errada na missão.
- **Dica do personagem:** −20, cobrada uma vez por missão.
- **Piso:** 50 pontos por missão concluída.
- **Missão pulada:** 0 pontos. O botão "Pular" aparece depois de 10 erros na mesma etapa.
- **Nota para o professor:** pontos ÷ 60, de 0 a 10. Quem chega ao fim tem nota mínima 5.
- **Nível de conhecimento** (estrelas, no lugar do "nível de procurado"):
  - 5★: 540 ou mais;
  - 4★: 450 ou mais;
  - 3★: 360 ou mais;
  - 2★: 240 ou mais;
  - 1★: abaixo disso.
- **Ranking público** (`/ranking`): mostra **pontos e estrelas**. A nota de 0 a 10 aparece só na gestão.
- **Servidor:** refaz pontos, estrelas e nota a partir dos erros, dicas e pulos de cada missão (`lib/nota.js`, `api/resultados.js`). Não confia no total enviado pelo navegador.
- **Estudo:** com nota abaixo de 7 ou alguma missão pulada, a conclusão mostra o que revisar, com links por assunto.

## 4. Direção visual (rascunho)

- **Paleta:**
  - fundos: #1A0833, #2B0B4F, #1B1F6B;
  - magenta #A3167A e rosa neon #FF2E93;
  - laranja #FF5E3A e amarelo #FFB02E;
  - turquesa #22E3FF e verde ácido #B6FF3B;
  - texto em creme #FFF7EC.
- **Fontes:** Anton (títulos e logo), Bebas Neue (rótulos e placar), Inter (texto) e Bungee (opcional, selos).
- **Estilo:** pintura tipo pôster na hora dourada, colagem em painéis, orla de praia inventada (jangada, barraca, roda-gigante, quadra, obra). Contornos e sombras chapadas.
- **Limites de propriedade intelectual:** ver HANDOFF, "Cuidado com propriedade intelectual".

## 5. Registro de mudanças

- **0.1 (21/11/2026):** missões, assuntos, liberação em sequência, pontuação de 100 por missão com descontos, ranking com pontos e estrelas, regra de respostas só positivas.
