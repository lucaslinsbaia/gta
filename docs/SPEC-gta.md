# SPEC: GTA (Geometria, Trigonometria e Álgebra), Missões do Glicério

**Versão:** 0.1 (rascunho) · **Data:** 21/11/2026
**Público:** ensino médio da escola Glicério, com os desafios ajustados para que um aluno do 1º ano consiga resolver (decisão de 21/11).
**Nome do jogo:** GTA, Geometria, Trigonometria e Aritmética (Edição Porto Alegre). Até 21/11 era "Álgebra".
**Base técnica:** O Enigma de Pitágoras (ver `SPEC-enigma-de-pitagoras.md`).

## 1. Estrutura

- **6 missões**, 2 por área. As missões 1 a 5 ficam **abertas desde o início**, em qualquer ordem. A 6 (Aeroporto Salgado Filho) só libera quando as outras cinco estiverem terminadas (concluídas ou puladas) **e** o jogador tiver pelo menos 3 estrelas. Sem as 3 estrelas, aparece "Finalizar a live": o Aeroporto conta como 0 (enviado ao servidor como pulado) e a nota é calculada normalmente, com mínimo 5.
- A tela inicial é a **colagem tipo pôster**: cada missão é um painel da cidade, e o painel "acende" quando a missão é concluída.
- Cada missão tem: **briefing** (a Dani explica a situação num modal, com o texto sendo digitado; abre sozinho na primeira visita e depois pelo avatar dela no canto da cena), **pistas** na cena, **desafio em 2 etapas** (A e B) e **recompensa** (pontos e estrelas).

## 2. Missões

**Formato das respostas (decidido em 21/11, sem campo de digitar):**
- **Etapa A: montar a conta (arrastar e soltar).** O aluno arrasta as peças com os valores certos até as lacunas da fórmula. Também dá para tocar na peça e depois na lacuna, o que funciona no teclado e no leitor de tela. Sempre há peças extras como distratores, por exemplo o diâmetro no lugar do raio ou a coordenada y no lugar da x. Ao conferir, as peças erradas voltam para a bandeja, e cada conferência errada conta 1 erro. Depois do acerto, o jogo mostra o resultado da conta.
- **Etapa B: múltipla escolha.** São 4 alternativas: a certa e 3 erradas tiradas de erros comuns, como esquecer de multiplicar por 1.000, somar os catetos ou trocar PG por PA. Cada alternativa errada conta 1 erro e fica desabilitada.

**Regra geral:** nenhuma resposta pode ser negativa, e as alternativas também são todas positivas. Os sorteios abaixo garantem isso.

| # | Área | Missão | Assunto | Etapa A (montar a conta) | Etapa B (múltipla escolha) |
|---|------|--------|---------|---------|---------|
| 1 | Geometria | Mercado Público (tonel de uma banca) | Área do círculo e volume do cilindro (π = 3,14, nunca alterar) | Área da base: 3,14 · r², arredondada a 2 casas (r ∈ {0,5; 1; 1,5} m) | Litros: área · altura · 1.000 (h ∈ {1, 2} m) |
| 2 | Geometria | Parque Redenção (lago e Brique) | Ponto médio e distância (Pitágoras no plano) | x do ponto médio | Distância, com catetos (3,4), (4,3), (6,8) ou (8,6) |
| 3 | Aritmética | Beira-Rio (arquibancada e convites) | PA e PG | Cadeiras na fileira n ∈ {4, 5, 6} | Pessoas na rodada m ∈ {3, 4} |
| 4 | Trigonometria | Usina do Gasômetro (chaminé e cabo de luzes) | Razões trigonométricas e Pitágoras | Altura da chaminé: L · sen 30° (L ∈ {40, 60, 80, 100} m) | Comprimento do cabo do topo da chaminé até o chão: √(h² + a²), com ternas inteiras para cada altura (20: 15 ou 48; 30: 40 ou 16; 40: 30 ou 42; 50: 120) |
| 5 | Aritmética | Arena do Grêmio (público e ingresso) | Porcentagem | Público: lugares · ocupação ÷ 100 (lugares ∈ {40.000, 50.000, 60.000}, ocupação ∈ {50, 60, 75, 80, 90}%) | Ingresso com desconto de estudante: preço − preço · desconto ÷ 100 (preço ∈ {40, 60, 80, 100}, desconto ∈ {10, 20, 25, 50}%) |
| 6 | Aritmética | Aeroporto Salgado Filho (avião em velocidade constante) | Razão, proporção e regra de três | km por minuto: distância ÷ tempo (v ∈ {10, 12, 15}, t ∈ {2, 3, 4}) | Minutos até a próxima parada: distância ÷ v ∈ {20, 25, 30, 40} |

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
- **Fontes:** Anton (títulos), Bebas Neue (rótulos e placar), Permanent Marker (nome do jogo escrito à mão, sob o logo) e Inter (texto).
- **Logo (21/11, versão final):** "GTA" em Pricedown Black, branco com contorno preto e sombra rosa, convertido em contorno (símbolo `#logo-gta` no sprite de `src/body.html`). Logo abaixo, "Geometria, Trigonometria e Álgebra" escrito à mão em Permanent Marker, amarelo e levemente inclinado.
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
- **1.7 (22/11/2026):** mapa com a Dani na linha do título. O recado dela abre num tooltip flutuante, com o texto sendo digitado; fecha no ×, no Esc ou tocando fora, e só abre sozinho quando a fala muda. Fechado, o avatar pulsa e reabre o recado.
- **1.8 (22/11/2026):** a descrição da missão também virou tooltip digitado ancorado no avatar da cena (sai o modal inicial); fechado, o avatar pulsa. Saem as tags "AO VIVO". Tocar fora de qualquer tooltip só fecha o tooltip, sem acionar o que está embaixo.
- **1.9 (22/11/2026):** no celular (até 640 px), as missões viram um carrossel com efeito 3D: rolagem lateral com snap, cards laterais girados e afastados, indicador de pontos clicável. Tocar num card lateral só o traz ao centro; o central abre a missão. O mapa abre centralizado na próxima missão pendente. Os cards e a tela da missão não mostram mais o número da missão.
- **1.6 (21/11/2026):** exportação simplificada, sem prévia e sem textos de instrução. No celular com suporte, só "Compartilhar". No computador, "Salvar imagem" e "E-mail". Os botões WhatsApp e Instagram saíram: no celular eles chegam pelo menu do aparelho.
- **1.5 (21/11/2026):** exportar o resultado na tela final. O jogo desenha num canvas um cartão 1080 × 1920 (formato de story) com o logo, a Dani, o nome, os pontos, as estrelas, o nível e as missões.
  - **Compartilhar:** usa o menu do aparelho (Web Share com arquivo) e aparece só onde há suporte, em geral no celular. Por ele chegam Instagram, WhatsApp e e-mail com a imagem.
  - **Salvar imagem:** baixa o PNG.
  - **WhatsApp e E-mail:** sem o menu do aparelho, abrem com o texto e o link.
  - **Instagram:** sem o menu do aparelho, salva a imagem e orienta a postar pelo app, porque o Instagram não recebe imagem do navegador do computador.
- **1.4 (21/11/2026):** explicação da matéria em cada etapa (campo `learn` de cada missão). Ao acertar a fórmula, abre "Entenda a matéria" com o conceito e a conta com os números da partida. Ao concluir a missão, a recompensa explica a etapa "Resolva o problema". Ao errar, a tela "wasted" mostra o conceito, sem a resposta.
- **1.3 (21/11/2026):** a 2ª etapa da Usina continua na chaminé (cabo de luzes com Pitágoras), no lugar do veleiro.
- **1.2 (21/11/2026):** desenhos com os dados sorteados em todas as missões (cilindro, plano cartesiano, fileiras e convites, triângulo retângulo, barra de ocupação e ingresso, rota do avião), sem mostrar a resposta.
- **1.1 (21/11/2026):** as etapas aparecem para o aluno como "Relembre a fórmula" (A) e "Resolva o problema" (B).
- **1.0 (21/11/2026):** descrição da missão em modal com animação de digitação; o avatar da Dani sobre a cena reabre a descrição.
- **0.9 (21/11/2026):** "Álgebra" vira "Aritmética" no nome do jogo e nas missões: Arena com porcentagem e Aeroporto com razão, proporção e regra de três. O Beira-Rio mantém PA e PG.
- **0.8 (21/11/2026):** Aeroporto exige 3 estrelas, com opção de finalizar sem ele; marca "Edição Porto Alegre" no lugar de "Missões do Glicério".
- **0.7 (21/11/2026):** desafios no nível do 1º ano: sem lei dos senos/cossenos nem ciclo trigonométrico (entram razões trigonométricas com sen 30° e Pitágoras na Usina, e o vértice da parábola na Arena); números menores nas outras missões (π continua 3,14: o Lucas pediu para nunca alterar). Os sorteios detalhados da seção 2 ficaram valendo só como histórico; os atuais estão na tabela.
- **0.6 (21/11/2026):** missões 1 a 5 abertas desde o início e o Aeroporto liberado no fim; logo "G.T.A" em Pricedown branco com o nome escrito à mão.
- **0.5 (21/11/2026):** nova ordem (Mercado, Redenção, Beira-Rio, Gasômetro, Arena, Aeroporto); a Orla saiu e a função quadrática deu lugar à função afim no Aeroporto Salgado Filho (h₀ ∈ {300, 500} m, r ∈ {400, 500, 600} m/min, t ∈ {3, 4, 5}, tempo pedido ∈ {8, 10, 12} min).
- **0.4 (21/11/2026):** missões ambientadas em Porto Alegre, com ilustrações novas. Nos estádios, o contexto é neutro (transmissão de TV e show), sem escudos nem torcida de clube.
- **0.3 (21/11/2026):** respostas sem digitar: etapa A de arrastar e soltar para montar a conta, etapa B de múltipla escolha.
- **0.2 (21/11/2026):** jogo implementado em `src/` (6 missões, pontuação, ilustrações) e servidor com pontos e estrelas.
