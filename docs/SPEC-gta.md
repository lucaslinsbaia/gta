# SPEC: GTA (Geometria, Trigonometria e Álgebra), Missões do Glicério

**Versão:** 0.1 (rascunho) · **Data:** 21/11/2026
**Público:** 2º e 3º ano do ensino médio da escola Glicério.
**Base técnica:** O Enigma de Pitágoras (ver `SPEC-enigma-de-pitagoras.md`).

## 1. Estrutura

- **6 missões**, 2 por área, liberadas **em sequência**: concluir (ou pular) uma missão libera a próxima. O mapa mostra as missões bloqueadas.
- A tela inicial é a **colagem tipo pôster**: cada missão é um painel da cidade, e o painel "acende" quando a missão é concluída.
- Cada missão tem: **briefing** (o personagem explica a situação), **pistas** na cena, **desafio em 2 etapas** (A e B) e **recompensa** (pontos e estrelas).

## 2. Missões

**Formato das respostas (decidido em 21/11, sem campo de digitar):**
- **Etapa A: montar a conta (arrastar e soltar).** O aluno arrasta as peças com os valores certos até as lacunas da fórmula. Também dá para tocar na peça e depois na lacuna, o que funciona no teclado e no leitor de tela. Sempre há peças extras como distratores, por exemplo o diâmetro no lugar do raio ou a coordenada y no lugar da x. Ao conferir, as peças erradas voltam para a bandeja, e cada conferência errada conta 1 erro. Depois do acerto, o jogo mostra o resultado da conta.
- **Etapa B: múltipla escolha.** São 4 alternativas: a certa e 3 erradas tiradas de erros comuns, como esquecer de multiplicar por 1.000, somar os catetos ou trocar PG por PA. Cada alternativa errada conta 1 erro e fica desabilitada.

**Regra geral:** nenhuma resposta pode ser negativa, e as alternativas também são todas positivas. Os sorteios abaixo garantem isso.

| # | Área | Missão | Assunto | Etapa A (montar a conta) | Etapa B (múltipla escolha) |
|---|------|--------|---------|---------|---------|
| 1 | Geometria | Mercado Público (tonel cilíndrico de uma banca) | Áreas e volumes | Área da base | Volume em litros |
| 2 | Geometria | Parque Redenção (lago dos pedalinhos e Brique) | Geometria analítica | x do ponto médio | Distância entre os pontos |
| 3 | Álgebra | Beira-Rio (arquibancada num dia de show e convites) | PA e PG | Cadeiras na fileira n (PA) | Pessoas na rodada m (PG) |
| 4 | Trigonometria | Usina do Gasômetro (mirante, veleiros no Guaíba) | Lei dos senos e dos cossenos | Lado oposto a 90° (lei dos senos) | Distância entre os veleiros (lei dos cossenos, 60°) |
| 5 | Trigonometria | Arena do Grêmio (grua de TV) | Ciclo trigonométrico e função seno | Altura máxima da câmera | Altura da câmera num ângulo |
| 6 | Álgebra | Aeroporto Salgado Filho (avião subindo) | Função afim (taxa de variação) | Altitude depois de t minutos: h₀ + r · t | Tempo até a altitude H: (H − h₀) ÷ r |

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
- **Fontes:** Bungee (logo e selos), Anton (títulos), Bebas Neue (rótulos e placar) e Inter (texto).
- **Logo (aprovado em 21/11):** "GTA" em Bungee com listras amarelo #FFB02E, laranja #FF5E3A, rosa #FF2E93 e magenta #A3167A, com contorno creme. A assinatura "Geometria, Trigonometria e Álgebra" vai pequena abaixo.
- **Estilo:** pintura tipo pôster na hora dourada, colagem em painéis, cidade inventada, sem ser de uma região específica (orla, roda-gigante, pista de skate, quadra, obra, food truck). Contornos e sombras chapadas.
- **Personagem das dicas (aprovado em 21/11): Dani Pixel.** Cria conteúdo de desafios e transmite as missões ao vivo. As dicas vêm como falas da live ("chat, olha só...") e explicam o caminho sem dar a resposta.
- **Linguagem e personagem:** sem estereótipos nem regionalismos, porque o jogo será aplicado em vários lugares do Brasil.
- **Limites de propriedade intelectual:** ver HANDOFF, "Cuidado com propriedade intelectual".

## 5. Detalhes de implementação

- **Armazenamento local:** `localStorage`, nas chaves `gta-glicerio-v1` (jornada) e `gta-glicerio-jogador` (último nome e turma).
- **Respostas:**
  - as alternativas da etapa B são sorteadas uma vez por jornada e ficam salvas, com as erradas já tentadas;
  - na Obra na Laje, o volume certo usa a área arredondada que aparece nos dados;
  - no Rolê no Mapa, x₁ e x₂ podem trocar de lugar na conta.
- **Modo de teste:** acrescentar `#teste` ao endereço mostra o botão "Avançar (teste)", que monta a conta certa ou marca a alternativa certa. A partida fica marcada como teste.
- **Envio:** o jogo manda erros, pulos e dicas de cada missão, mais o tempo ativo. O servidor recusa partidas abaixo de 30 s fora do modo de teste.

## 6. Registro de mudanças

- **0.1 (21/11/2026):** missões, assuntos, liberação em sequência, pontuação de 100 por missão com descontos, ranking com pontos e estrelas, regra de respostas só positivas. Logo direção C; personagem Dani Pixel; linguagem sem regionalismos.
- **0.5 (21/11/2026):** nova ordem (Mercado, Redenção, Beira-Rio, Gasômetro, Arena, Aeroporto); a Orla saiu e a função quadrática deu lugar à função afim no Aeroporto Salgado Filho (h₀ ∈ {300, 500} m, r ∈ {400, 500, 600} m/min, t ∈ {3, 4, 5}, tempo pedido ∈ {8, 10, 12} min).
- **0.4 (21/11/2026):** missões ambientadas em Porto Alegre, com ilustrações novas. Nos estádios, o contexto é neutro (transmissão de TV e show), sem escudos nem torcida de clube.
- **0.3 (21/11/2026):** respostas sem digitar: etapa A de arrastar e soltar para montar a conta, etapa B de múltipla escolha.
- **0.2 (21/11/2026):** jogo implementado em `src/` (6 missões, pontuação, ilustrações) e servidor com pontos e estrelas.
