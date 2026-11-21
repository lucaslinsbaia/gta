# O Enigma de Pitágoras — Regras do jogo

**Status:** versão 1.1, implementada em HTML, CSS e JavaScript puro (arquivo único).
**Idioma:** português do Brasil. **Modo:** um jogador.
**Escopo:** regras, progressão, desafios, estados e critérios de aceite.

> **O que mudou desde a versão 1.0** está resumido na seção 14.

## 1. Premissa e objetivo

Em uma expedição a Crotona, na Itália, em 1924, o jogador explora um templo e resolve mecanismos matemáticos para abrir a saída. O objetivo é recuperar, em ordem, os selos do **Triângulo**, das **Razões** e da **Harmonia**. O jogo combina o teorema de Pitágoras e as razões trigonométricas no triângulo retângulo; não atribui a Pitágoras a invenção da trigonometria.

A narrativa de escapar antes do amanhecer cria atmosfera. **Não há derrota por tempo:** o relógio mede o tempo ativo de jornada e não é uma contagem regressiva. O jogo não exibe estimativa de duração.

## 2. Jornada, progressão e revisão

Início → Identificação → Capítulos → Exploração I → Enigma I → Exploração II → Enigma II → Exploração III → Enigma III → Conclusão.

| **Etapa** | **Local** | **Desafio** | **Recompensa** | **Progresso após resolver** |
|---|---|---|---|---|
| I | O Átrio dos Triângulos | A Placa dos Catetos | Selo do Triângulo | 1/3 |
| II | A Galeria das Razões | O Mecanismo das Razões | Selo das Razões | 2/3 |
| III | O Santuário de Pitágoras | O Círculo de Pitágoras | Selo da Harmonia | 3/3 |

- **Uma jornada é uma sessão de jogo** que vai do início até a conclusão das três etapas.
- **Triângulos sorteados por jornada:** cada nova jornada sorteia três triângulos retângulos de lados inteiros (ternas pitagóricas com hipotenusa até 30), um diferente para cada etapa. Os triângulos ficam fixos durante a jornada e são salvos junto com ela.
- Uma nova jornada começa com 0/3 selos, zero dicas usadas, zero tentativas incorretas e relógio zerado.
- Somente a primeira etapa começa disponível. Resolver uma etapa desbloqueia a seguinte.
- Um capítulo pode estar **bloqueado**, **disponível**, **em andamento** ou **concluído**. Apenas um fica ativo por vez.
- **Na tela de capítulos, só o capítulo ativo tem botão primário:** “Iniciar” ou “Continuar”, na cor do botão principal e com o card de borda dourada. Os demais usam ações de texto: “Revisitar” nos concluídos e “Bloqueado”, desabilitado, nos bloqueados. Com a jornada concluída, nenhum card tem botão primário.
- **Revisão:** capítulos concluídos podem ser revisitados apenas para rever o que foi feito. O mecanismo aparece resolvido e somente leitura. Revisitar não remove nem duplica selos, não altera o tempo, não consome dicas e não registra tentativas.
- **Resultado direto na exploração:** ao abrir um capítulo concluído, o painel lateral substitui o botão “Examinar” pelo resultado do capítulo. Aparecem:
  - a placa resolvida, com animação;
  - as respostas certas;
  - a conta que leva a elas;
  - o momento da jornada em que o capítulo foi resolvido e se a dica foi usada. As tentativas incorretas continuam ocultas até a conclusão.

  Abaixo do resultado, o botão **Próximo** leva ao capítulo seguinte (“Próximo: A Galeria das Razões”, “Próximo: O Santuário de Pitágoras”). No capítulo III, o botão é “Ver a conclusão”. O link “Abrir o mecanismo resolvido” continua disponível, mas é opcional.
- **Depois da conclusão**, o jogador vê o resultado e pode revisitar os capítulos ou começar uma nova jornada, com triângulos novos. Uma jornada concluída não pede confirmação para ser substituída.
- Iniciar outra jornada quando houver uma **em andamento** exige confirmação antes de substituir o salvamento.
- **Continuar expedição** retoma o último capítulo e a última tela (exploração ou enigma), a pista consultada e as respostas parciais salvas. Com a jornada concluída, o botão passa a ser **Ver resultado da expedição**.

### 2.1 Identificação

Aparece ao clicar em **Iniciar jornada**, antes dos capítulos, e também em **Nova jornada** na conclusão. Quem usa **Continuar expedição** não se identifica de novo.

- **Nome ou apelido:** obrigatório, até 40 caracteres e com pelo menos 2 letras; espaços extras são removidos.
- **Turma:** obrigatória. Caixa de seleção só com as turmas criadas na gestão (seção 10.3); não existe a opção “Sem turma”. Sem turma escolhida, aparece “Selecione sua turma para começar.”
- **Tipos de caractere:**
  - no nome: letras (com acento), números, espaço, hífen, ponto e apóstrofo;
  - na turma: os mesmos, mais º, ª, ° e barra (ex.: “9º B”, “1ª série”, “8/A”);
  - símbolos, emojis e marcação HTML são recusados.
- **Lista restritiva:** nome e turma não podem conter palavrões, insultos nem termos ofensivos (em português e inglês, incluindo abreviações como “fdp” e “vsf”).
  - **Normalização:** a comparação ignora maiúsculas e acentos, troca números e símbolos que imitam letras (p0rr4 → porra; ø → o) e reduz letras repetidas (porrraaa).
  - **Palavras inteiras:** termos curtos que também aparecem dentro de nomes reais só são bloqueados como palavra inteira. Exemplos: “cu” em Cunha, “puto” em Caputo, “pau” em Pauline, “rola” em Rolando.
  - **Raízes inconfundíveis** (como “caralh”, “buceta”, “arromb”, “merda”, “fuck”) também são procuradas dentro de outras palavras e com letras separadas (c.a.r.a.l.h.o, f u c k).
  - **A lista fica no código** (`BLOCKED_WORDS` e `BLOCKED_ROOTS` em `index.html`) e pode ser ampliada pelo professor. Por rodar no navegador, ela é visível a quem inspecionar a página.
  - **Mensagem:** a orientação não repete o termo: “Esse nome não pode ser usado no jogo. Escolha outro nome ou apelido.” Na turma: “Esse texto não pode ser usado na turma. Revise e tente de novo."
- **Erros de preenchimento** aparecem abaixo do campo correspondente, sem modal:
  - campo vazio: “Digite seu nome ou apelido para começar.”;
  - menos de 2 letras: “Use pelo menos 2 letras no nome ou apelido.”
- **Substituição:** a jornada nova só é criada, e só substitui a anterior, quando o jogador confirma a identificação. Voltar ao início mantém a jornada que existia.
- **Onde os dados ficam:** são salvos com a jornada (`player: { name, turma }`). O último nome e a última turma são lembrados no navegador (chave `enigma-pitagoras-jogador`) e já vêm preenchidos na próxima vez.
- **Onde o nome aparece:** na tela de capítulos (“Expedição de Ana · 9º B.”), no resumo de **Continuar expedição** e na conclusão (“Ana · 9º B dominou o teorema”).
- **Exibição segura:** o nome é sempre exibido como texto puro.
- **Relógio:** não conta durante a identificação.
- **Figma:** esta tela não existe no arquivo e segue o visual da tela de início.

## 3. Ciclo de exploração

1. Investigar pontos destacados do cenário.
2. Ler inscrições e examinar artefatos.
3. Registrar automaticamente as pistas no diário.
4. Consultar o inventário e abrir o mecanismo do capítulo.
5. Preencher a resposta e confirmar.
6. Receber o selo e prosseguir.

- Uma pista é registrada na primeira inspeção, sem duplicatas. Reabrir uma pista não aumenta o contador.
- **A pista abre num modal sobre a cena,** sem que o jogador precise procurá-la no painel lateral. Isso vale para os pontos da cena e para os itens do inventário (pistas e selos). O modal mostra:
  - a numeração da pista e quantas já foram encontradas no capítulo;
  - o aviso “Nova pista · adicionada ao diário”, só na primeira inspeção;
  - o texto da pista e duas ações: “Continuar investigando” e “Examinar” o mecanismo.

  Ao fechar (botão, Esc ou clique fora), o foco volta ao ponto ou item que abriu o modal. O painel lateral continua mostrando a última pista consultada.
- O inventário diferencia **selos recuperados** de **registros consultáveis** (as pistas encontradas). Um selo não aparece como recuperado antes do acerto correspondente.
- O diário mantém os registros anteriores disponíveis durante os enigmas e mostra também as dicas já pedidas. Ele nunca revela a solução final.
- **Diário do enigma (pergaminho):** a seção “Anotações do explorador” reúne **somente as pistas que o jogador investigou na sala** daquele capítulo, com contagem (“2 de 4 pistas”). Esses fragmentos são o material para resolver o mecanismo; o diário não mostra fórmulas nem medidas que o jogador não encontrou.
  - **Sem pistas investigadas:** aparece um aviso e o botão **“Voltar à sala”**.
  - **Com pistas faltando:** aparece a frase **“Ainda há pistas valiosas para serem exploradas.”** e o botão **“Voltar à sala”**, com contorno, para não competir com o Confirmar.
- Não é obrigatório descobrir todas as pistas para tentar uma solução: explorar ajuda, mas não bloqueia quem já sabe resolver.
- Cada capítulo possui um mecanismo principal.
- **Rótulos dos marcadores:** na cena aparecem só os círculos. O nome de cada marcador surge com uma animação curta (aparece e desliza até o lugar) quando o mouse passa sobre o círculo, ou quando o marcador recebe o foco pelo teclado. Só o círculo reage ao mouse; o espaço onde o texto aparece não reage. Em telas de toque, o rótulo aparece no marcador tocado. Leitores de tela sempre recebem o nome e o estado (“já examinado” ou “não examinado”).
- **Ponto principal da cena:** além das pistas, cada cena tem um ponto principal sobre o mecanismo que precisa ser resolvido para continuar. Ele fica na placa do átrio (I), no mecanismo de bronze da galeria (II) e no círculo do santuário (III).
  - **Visual:** é maior, dourado e semitransparente (deixa ver o artefato por trás; fica sólido ao passar o mouse), com ícone de lupa (✓ quando concluído) e pulsando. No capítulo I, fica exatamente no centro da placa. O rótulo (“Examinar a placa”, “Examinar o mecanismo” ou “Examinar o círculo”) segue a mesma regra dos demais marcadores (veja abaixo).
  - **Ação:** abre o enigma diretamente e não conta como pista.
  - **Capítulo concluído:** mostra ✓ e “Rever o mecanismo resolvido”.
  - **Pistas que ocupavam esses lugares foram para outros pontos da cena:** o “Marcador de ângulo reto” foi para um fragmento caído; a “Inscrição das razões”, para a base da estela; e as medidas do círculo, para a “Gravura do altar”.
- **Ação principal como FAB:** na exploração, a ação principal é um botão flutuante fixo no canto inferior direito, sempre ao alcance enquanto o jogador investiga a cena.
  - Capítulo em andamento: “Examinar a placa”, “Examinar o mecanismo” ou “Examinar o círculo”.
  - Capítulo concluído: “Próximo: A Galeria das Razões”, “Próximo: O Santuário de Pitágoras” ou “Ver a conclusão”.
  - O FAB aparece só na exploração, e não há botão duplicado no painel lateral.
  - No celular, ele mostra um rótulo curto e mantém o nome completo para leitores de tela.
  - Os demais botões principais, como “Iniciar jornada” e “Confirmar”, continuam no fluxo da página.
- As pistas usam as medidas sorteadas da jornada.

## 4. Regras gerais de resposta

- Não há limite de tentativas nem perda de tempo, selos ou pistas por erro.
- **Confirmar** só fica habilitado quando todos os campos exigidos estão preenchidos com valores válidos.
- **Resposta incompleta ou com formato inválido** (por exemplo, texto em vez de número) exibe orientação contextual acima do botão e não conta como tentativa incorreta.
- **Resposta incorreta:**
  - mantém as escolhas para revisão;
  - destaca os campos que precisam ser revistos, sem mostrar o valor certo;
  - abre um aviso que informa o que verificar, sem entregar a solução.
- **Tentativas incorretas** são contadas por capítulo, mas **não são exibidas antes da conclusão**. Os dados ficam salvos para um ranking futuro (seção 10). No Círculo de Pitágoras, cada conferência individual errada também conta (seção 7).
- **Limpar** remove apenas as respostas do mecanismo atual; não apaga o diário, o inventário ou os selos.
- **Pular:** depois de **10 tentativas incorretas no mesmo capítulo** (no círculo, cada posição conferida errada conta), aparece o link **“Pular este mecanismo”** no diário do enigma.
  - Uma confirmação avisa que o capítulo vai valer 0 na nota.
  - Ao confirmar, o jogo mostra a **resolução completa** (respostas e conta) e libera o capítulo seguinte.
  - O selo aparece como **“liberado”**, não “recuperado”, nos cards, no inventário, no painel e na conclusão.
  - O capítulo pulado entra no feedback de estudo da conclusão.
- **Voltar à sala** preserva a tentativa parcial.
- **Acerto** registra o selo uma única vez, salva o estado e abre um aviso de sucesso com a animação do mecanismo e do selo, oferecendo a passagem à etapa seguinte. O terceiro acerto abre a conclusão.
- Os campos numéricos aceitam vírgula ou ponto como separador decimal.

## 5. Etapa I — O Átrio dos Triângulos

**Meta pedagógica:** identificar os catetos e a hipotenusa e aplicar a² + b² = c² em um triângulo retângulo.

**Exploração:** átrio de colunas com claraboia, um dispositivo no mural do fundo (ponto principal, “Examinar dispositivo”, que abre o mecanismo) e um mosaico de retângulos no chão. A imagem não mostra números: as medidas aparecem só no texto das pistas, de acordo com o triângulo sorteado. Cinco pistas:
1. **Pergaminho do agrimensor** (banco da esquerda): esboço de triângulo com a marca do canto reto e um “?” no lado maior. Os catetos se encontram no canto reto.
2. **Corda de nós** (no chão): a corda de agrimensor esticada em triângulo; os catetos medem *a* e *b* unidades.
3. **Retângulos** (mosaico do chão): uma inscrição gasta, a² + b² = c².
4. **Tábua de cera** (base da coluna da esquerda): uma conta interrompida, “a² + b² = ?”. Falta a raiz quadrada.
5. **Compasso e régua** (banco da direita): “O maior lado olha para o canto reto.” A hipotenusa se opõe ao ângulo reto e é o maior lado.

**Enigma — A Placa dos Catetos:** o triângulo tem catetos *a* e *b* (sorteados) e hipotenusa *c* desconhecida. O jogador informa o comprimento de *c*, em unidades.

**Solução:** c = √(a² + b²). Exemplo: com catetos 3 e 4, c² = 9 + 16 = 25 e **c = 5 unidades**. A raiz positiva é usada por representar um comprimento.

**Validação:**
- Aceitar o valor numérico de *c*, incluindo as formas com ",0" e ".0" (por exemplo, 5,0 e 5.0).
- A unidade é exibida fora do campo.
- Rejeitar como incorretos: valores negativos e c² como resposta final.
- Texto não numérico não habilita Confirmar e recebe orientação de formato.

**Dica única:** “Some os quadrados dos catetos. Depois, encontre a raiz quadrada do resultado.”

**Erro:** “Ainda não. Confira os quadrados dos catetos e lembre-se de encontrar o comprimento, não seu quadrado.”

**Sucesso:** “Selo do Triângulo recuperado. A Galeria das Razões está aberta.”

## 6. Etapa II — A Galeria das Razões

**Meta pedagógica:** determinar seno, cosseno e tangente de um ângulo agudo em um triângulo retângulo.

**Pré-condição:** Selo do Triângulo recuperado.

**Cinco pistas:**
1. **Triângulo de referência:** o ângulo θ.
2. **Busto do mestre:** o cateto oposto mede *o*.
3. **Pórtico ao fundo:** o cateto adjacente mede *a*.
4. **Raio da claraboia:** a hipotenusa mede *h*.
5. **Inscrição das razões:** as três definições trigonométricas.

**Enigma — O Mecanismo das Razões:** preencher três espaços identificados como sen θ, cos θ e tg θ. O jogador seleciona primeiro o espaço e depois a fração. Ao preencher um espaço, a seleção passa automaticamente para o próximo vazio. Selecionar outra fração substitui a resposta daquele espaço. A seleção não depende de arrastar.

**Orientação geométrica obrigatória:**
- θ fica no vértice inferior direito.
- O cateto oposto a θ é vertical, o adjacente é horizontal e o marcador de 90° fica no encontro dos catetos, nunca em θ.
- O triângulo da Etapa II é sempre diferente do da Etapa I.

| **Espaço** | **Definição** | **Resposta correta** |
|---|---|---|
| sen θ | cateto oposto / hipotenusa | o/h |
| cos θ | cateto adjacente / hipotenusa | a/h |
| tg θ | cateto oposto / cateto adjacente | o/a |

**Opções:**
- São seis frações com os lados da jornada: o/h, a/h, o/a, a/o, h/o e h/a. As inversas são distratoras.
- A ordem das opções é embaralhada uma vez por jornada.
- **A mesma fração pode ser colocada em mais de um espaço.** Com ternas pitagóricas o oposto nunca é igual ao adjacente, então duas razões nunca coincidem; a regra fica pronta para triângulos em que isso aconteça.

**Validação:** compara o valor de cada fração com a razão do seu espaço, independentemente da ordem de preenchimento. O contador vai de 0/3 a 3/3 espaços preenchidos; não representa acertos. No erro, os espaços incorretos são destacados.

**Dica única:** “Marque o lado oposto a θ e identifique a hipotenusa. Cada razão usa um par específico de lados.”

**Erro:** “Revise os lados em relação a θ. Oposto e adjacente dependem do ângulo escolhido.”

**Sucesso:** “Selo das Razões recuperado. O Santuário de Pitágoras está aberto.”

## 7. Etapa III — O Santuário de Pitágoras

**Meta pedagógica:** sintetizar o teorema e as três razões. O jogador descobre um cateto que falta e, com ele, calcula seno, cosseno e tangente.

**Pré-condição:** dois selos recuperados.

**Quatro pistas:**
1. **Inscrição trigonométrica:** os versos com a ordem das posições.
2. **Porta dos três selos.**
3. **Gravura do altar:** repete o triângulo do círculo; a hipotenusa mede *h* e o cateto adjacente a θ mede *a*; o cateto oposto foi apagado.
4. **Caco de ânfora:** “Para achar um cateto, subtraia os quadrados.”

**Inscrição (nova ordem):**
> “Primeiro, o teorema revela o lado oculto.
> Depois, o seno.
> Em seguida, o cosseno.
> A tangente encerra o ciclo.”

**Enigma — O Círculo de Pitágoras:** o círculo mostra, gravado no centro, um triângulo retângulo com hipotenusa *h*, cateto adjacente *a* e o cateto oposto apagado. O jogador preenche quatro posições, na ordem da inscrição:

| **Posição** | **Símbolo** | **Resposta** | **Formato aceito** |
|---|---|---|---|
| 1 · Teorema | lua | cateto oposto o = √(h² − a²) | número inteiro |
| 2 · Seno | sol | o ÷ h | decimal com até duas casas |
| 3 · Cosseno | lira | a ÷ h | decimal com até duas casas |
| 4 · Tangente | ramo | o ÷ a | decimal com até duas casas |

Os ícones antigos são marcadores visuais. A identificação depende das legendas e dos números das posições, não de reconhecer o desenho.

**Validação por posição:**
- **Conferência:** cada posição tem um botão ✓ (ou Enter no campo) que confere só aquela resposta.
- **Posição certa:** fica travada com “Correta” e acende o medalhão correspondente no círculo.
- **Posição errada:** fica destacada e recebe uma orientação própria, sem revelar o valor:
  - lado oculto ao quadrado: “Esse é o quadrado do lado. Falta a raiz quadrada.”;
  - soma em vez de subtração: “Aqui a hipotenusa já é conhecida: subtraia os quadrados.”;
  - seno com o valor do cosseno (e vice-versa): “Esse é o cosseno. O seno usa o lado oposto a θ.”;
  - tangente invertida: “A razão está invertida: oposto ÷ adjacente.”;
  - nos demais casos, a definição da razão ou do teorema.
- **Formato:** posição vazia ou fora do formato só recebe orientação e não conta como tentativa. Fração recebe “Frações não valem aqui: divida e escreva o decimal, como 0,67.”; mais de duas casas recebe “Use um número inteiro ou decimal com até duas casas, como 0,67.”
- **Tentativas:** cada conferência errada conta como uma tentativa incorreta, exibida só na conclusão.
- **Selo:** quando as quatro posições estão certas, o círculo gira e o selo é concedido, sem precisar de outro clique.
- **“Girar o círculo”** continua disponível para conferir tudo de uma vez: as posições certas ficam travadas e as erradas recebem orientação. Conta como uma tentativa.

**Regras de valor:**
- A posição 1 exige o valor exato.
- Só valem números inteiros ou decimais com até duas casas depois da vírgula (vírgula ou ponto); frações não são aceitas. Tolerância de 0,01, para valer tanto o valor arredondado quanto o truncado. Exemplo: 7 ÷ 24 = 0,2917 aceita 0,29. Os exemplos das instruções (9 e 0,67) não coincidem com nenhuma resposta possível do jogo.
- No erro, as posições incorretas são destacadas.
- “Limpar resposta” zera apenas as posições ainda não conferidas; as que já estão certas continuam travadas.

**Dica única:** “Comece pelo teorema: o lado oculto ao quadrado é a hipotenusa² menos o cateto adjacente². Depois, monte cada razão com os lados em relação a θ.”

**Erro:** “Ainda não. Confira o lado oculto pelo teorema e, depois, os pares de lados de cada razão em relação a θ.”

**Sucesso:** recuperar o Selo da Harmonia, atingir 3/3 e abrir a conclusão “O teorema revelou seu segredo”.

## 8. Dicas, tempo e salvamento

**Dicas**
- Há uma dica por capítulo, três no total. O comando informa a disponibilidade e o custo: “Pedir dica · custa 0,5 na nota” (antes da primeira dica da jornada), “Pedir dica · sem custo extra” (depois dela), “Reler dica” ou, em revisão sem dica usada, “Dica não utilizada”.
- Pedir dica exibe a orientação do capítulo e incrementa as dicas usadas uma única vez. Reler uma dica já solicitada não consome outra.
- **Custo:** usar dica, uma ou várias vezes, em qualquer capítulo, desconta **0,5 da nota final, uma vez só** (seção 10). O total de dicas aparece na exploração, no enigma e na conclusão.

**Relógio**
- O relógio conta somente com a jornada ativa: nas telas de capítulos, exploração e enigma.
- Para durante a pausa, quando a aba fica oculta (troca de aba ou de aplicativo), fora das telas de jogo e depois da conclusão.
- Consultar o diário e o inventário não pausa.
- O tempo final fica congelado na conclusão.

**Salvamento**
- **Quando salvar:** após cada pista registrada, resposta alterada, dica utilizada, tentativa, selo recuperado e troca de tela. O tempo ativo também é salvo a cada 15 segundos de jogo, ao pausar, ao ocultar a aba e ao sair da página.
- **Onde:** no armazenamento local do navegador (chave `enigma-pitagoras-v1`), por jogador e por dispositivo.
- **Falha:** não exibir “Progresso salvo”. O jogo mantém o estado na memória e oferece “Tentar de novo”.
- **O que é persistido:**
  - os triângulos da jornada e a ordem das frações;
  - o capítulo e a tela ativos;
  - as pistas descobertas e a pista selecionada;
  - os selos e as respostas parciais;
  - as dicas e as tentativas incorretas por capítulo;
  - o tempo ativo, o tempo de resolução de cada capítulo e a condição de conclusão.

## 9. Estados e comandos

| **Elemento** | **Estados ou comportamento** |
|---|---|
| Ponto de investigação | Não examinado (ponto claro, pulsando), examinado (ícone ✓ dourado sobre fundo escuro, sem pulsar) e selecionado; a indicação também é textual para leitores de tela (“já examinado”) |
| Resposta | Vazia, parcial, pronta, incorreta ou correta |
| Confirmar | Desabilitado quando incompleto ou inválido; sem concessão duplicada de selo; oculto em revisão |
| Dica | Disponível, já utilizada/consultável ou indisponível (revisão sem dica usada) |
| Salvamento | Salvando, salvo ou falha (com “Tentar de novo”) |
| Diário | Pistas descobertas e dicas pedidas; nenhuma solução final revelada |
| Pausa | Retomar, consultar regras ou voltar ao início; o relógio fica parado |
| Capítulo | Bloqueado, disponível, em andamento ou concluído (revisão) |

**Atalhos:**
- **D** abre o diário, **I** abre o inventário e **Esc** pausa ou fecha a camada aberta.
- Os atalhos não disparam enquanto o usuário digita em um campo.
- Todos os comandos essenciais têm alternativa visível por botão: no cabeçalho (diário e pausa) e no rodapé (D · Diário, I · Inventário, Esc · Pausar).

**Modo de teste:**
- **Ativação:** abrir a página com `#teste` no fim do endereço. Sem `#teste`, nada aparece.
- **Botão:** mostra um botão flutuante **Avançar** que resolve o passo atual com as respostas certas, pelo caminho normal (animação, selo e salvamento).
- **Segurança:** o modo de teste não é protegido. Ele serve só para revisão e demonstração.

## 10. Conclusão e métricas

A conclusão exibe:
- os três selos (o pulado aparece como “pulado”);
- a **nota final**, com conceito e detalhe por capítulo;
- o tempo total ativo, os selos recuperados, as dicas utilizadas e o total de **tentativas incorretas** (exibido pela primeira vez nessa tela);
- a conquista **Guardião do teorema**;
- o bloco **“Para continuar aprendendo”**, quando for o caso.

### 10.1 Nota final (0 a 10)

| Capítulo | Peso | Desconto por tentativa incorreta | Mínimo se resolvido |
|---|---|---|---|
| I · Placa dos Catetos | 3 | 0,5 | 1,5 |
| II · Mecanismo das Razões | 3 | 0,5 | 1,5 |
| III · Círculo de Pitágoras | 4 | 0,25 (por posição errada) | 2,0 |

- **Capítulo resolvido:** peso − desconto × tentativas incorretas, sem ficar abaixo da metade do peso.
- **Capítulo pulado:** vale **0**.
- **Dicas:** se usar qualquer dica, desconta **0,5**, uma vez só.
- **Nota final:** soma dos capítulos − desconto de dicas, com **mínimo de 5** (terminar a jornada garante nota 5, mesmo com capítulos pulados), arredondada para uma casa decimal.
- **O tempo não entra na nota.** Ele serve de critério de desempate no ranking.
- **Conceito:** 9,0 a 10 “Excelente”; 7,0 a 8,9 “Muito bom”; 5,0 a 6,9 “Em desenvolvimento”.
- **Detalhe:** a conclusão mostra a nota de cada capítulo (por exemplo, “II · 2,5 de 3”), o desconto de dicas e, quando aplicado, o mínimo de 5.
- **Exemplos:**
  - sem erros nem dicas: 10,0;
  - 2 erros no I, 1 no II, 3 no III e uma dica: 2,0 + 2,5 + 3,25 − 0,5 = 7,3;
  - capítulo I pulado, 6 erros no II e III sem erros: 0 + 1,5 + 4 = 5,5.

### 10.2 Feedback de estudo

- **Quando aparece:** se a nota for **menor que 7**, ou se algum capítulo foi **pulado**, a conclusão mostra “Para continuar aprendendo”.
- **Capítulos listados:** os que perderam pontos (com nota abaixo de 7) e os pulados.
- **Conteúdo de cada capítulo:**
  - os enganos mais frequentes que o jogador cometeu, registrados durante o jogo, sem revelar respostas. Exemplos: “Você encontrou o quadrado do lado, mas faltou tirar a raiz quadrada”, “Você trocou seno e cosseno…”, “Você inverteu a tangente…”;
  - o assunto a revisar;
  - links de estudo: artigos de Toda Matéria e Brasil Escola, buscas no Khan Academy em português e buscas no YouTube por canais de matemática (Matemática Rio, Equaciona com o Prof. Paulo Pereira, Professor Ferretto, Gis com Giz). Os links abrem em outra aba.
- **Edição:** os materiais ficam numa lista editável no código (`STUDY` em `index.html`).
- **Tipos de engano registrados** (`mistakes`): quadrado sem raiz, soma dos catetos, comprimento negativo ou menor que um cateto, soma de quadrados em vez de subtração, troca de seno e cosseno, tangente invertida, hipotenusa no numerador e “outro".

Oferece **Revisitar capítulos** (somente leitura) e **Nova jornada** (triângulos novos).

**Dados guardados para ranking futuro:**
- tempo final (`finalMs`);
- tempo ativo no momento em que cada capítulo foi resolvido (`solvedAtMs`);
- tentativas incorretas por capítulo (`errors`);
- dicas por capítulo (`hints`);
- data de início (`startedAt`);
- nome e turma do jogador (`player`);
- capítulos pulados (`skipped`) e tipos de engano (`mistakes`);
- nota, conceito e detalhe por capítulo (`result`).

O ranking em si (servidor, identificação do jogador e regras de desempate) está fora do escopo desta versão.

### 10.3 Ranking e área de gestão

Só funciona na versão publicada na Vercel, que tem servidor (`/api`). Sem servidor (arquivo local ou página no Claude) o jogo funciona igual, sem ranking.

**Turmas**
- São criadas pelo professor na gestão (`/gestao`) e aparecem como lista na tela de identificação. A escolha é obrigatória: só valem as turmas cadastradas, e não há opção “Sem turma”.
- Valem as mesmas regras de caracteres e a mesma lista restritiva do nome (seção 2.1). Nomes repetidos são recusados, ignorando maiúsculas, acentos e espaços (“102A” = “102 a”).
- Turma arquivada some do jogo, mas mantém as partidas. Só pode ser excluída a turma que ainda não tem partidas.
- Se ainda não houver turmas cadastradas, a lista fica desativada com o aviso “Ainda não há turmas cadastradas. Peça ao professor para criar a sua turma.” e o jogo não começa. Sem servidor (arquivo local ou página no Claude), não há ranking: o campo Turma fica oculto e o jogo começa só com o nome.
- O servidor também recusa resultados sem turma ou com turma inexistente ou arquivada.

**Envio do resultado**
- Ao concluir a jornada, o jogo envia o resultado uma única vez (cada jornada tem um identificador próprio; repetições são ignoradas). O quadro da nota mostra se o envio deu certo e oferece “Tentar de novo” em caso de falha.
- O servidor confere o nome com o mesmo filtro do jogo e **refaz a nota** a partir dos erros, capítulos pulados e dicas (seção 10.1), sem confiar na nota enviada.
- Jornadas com menos de 20 segundos são recusadas, exceto as do modo de teste.
- Jornadas em que o modo de teste foi usado ficam marcadas como “teste” e só entram no ranking se o professor marcar “Incluir partidas do modo de teste”.

**Ranking**
- Organizado por data (dia da partida, horário de Brasília).
- Vale a **melhor nota de cada participante** no dia e na turma (o nome é comparado sem diferenciar maiúsculas e acentos).
- Ordem: maior nota; depois menos tentativas incorretas; depois menor tempo; depois quem terminou primeiro.
- Colunas visíveis para os alunos: posição, participante, turma, nota, conceito (e capítulos pulados), tentativas incorretas, dicas e tempo.

**Publicação**
- Os alunos só veem o que o professor publica. A publicação é feita na gestão, por dia, para todas as turmas ou para uma turma.
- A publicação é uma foto do momento: partidas novas só entram ao clicar em “Atualizar publicação”. É possível despublicar.
- Na página pública (`/ranking`), o aluno escolhe a data e filtra por turma. Se só houver a publicação geral, o filtro por turma recorta a lista geral e renumera as posições.

**Gestão (`/gestao`)**
- Acesso por senha única (variável `ADMIN_PASSWORD` na Vercel). A sessão dura 12 horas e termina ao fechar a aba.
- Abas: “Partidas e publicação” (melhor partida de cada pessoa por dia e turma, excluir partida, publicar), “Turmas” (criar, arquivar, reativar, excluir) e “Rankings publicados” (ver e despublicar).
- Banco sempre ativo: uma tarefa diária da Vercel (`/api/manter-ativo`, 11h23 UTC, 8h23 em Brasília) faz uma consulta simples para o banco gratuito não ser pausado por inatividade.
- Privacidade: o jogo não coleta e-mail nem outros dados pessoais; incentive o uso de apelido. Partidas podem ser excluídas a qualquer momento.

## 11. Direção visual e acessibilidade

**Identidade visual**
- **Visual:** templos cinematográficos, verde-negro, bronze dourado, títulos epigráficos (Cinzel) e texto em Inter.
- **Telas:** diário em pergaminho claro nos mecanismos e inventário no rodapé da exploração.
- **Imagens:** são as do arquivo Figma, embutidas no arquivo do jogo.

**Acessibilidade**
- Legibilidade, contraste e foco visível. Todos os controles são utilizáveis por teclado.
- Mensagens de erro não dependem apenas de cor: há texto, destaque de borda e aviso.
- Fórmulas e diagramas têm leitura textual equivalente: os triângulos SVG têm descrição com as medidas, e as frações são anunciadas como “3 sobre 5”.
- Movimento reduzido é respeitado (`prefers-reduced-motion`).

**Responsivo:** no desktop, as telas seguem o layout de 1440 px do Figma. No celular:
- as colunas viram uma só;
- o subtítulo do cabeçalho é ocultado;
- os rótulos dos pontos de investigação aparecem só no ponto selecionado;
- o aviso de pista registrada aparece abaixo da cena.

## 12. Critérios de aceite

- [x] Uma jornada nova inicia em I, com 0/3 selos, zero dicas, zero tentativas e tempo zerado.
- [x] Cada jornada sorteia triângulos novos, diferentes entre as etapas.
- [x] As etapas II e III desbloqueiam apenas após os acertos anteriores.
- [x] Pistas, dicas e selos não se duplicam ao revisitar; a revisão é somente leitura.
- [x] I aceita *c* (inclusive com ",0" e ".0") e rejeita c² ou comprimento negativo.
- [x] II mantém θ, catetos e hipotenusa geometricamente consistentes e valida o/h, a/h e o/a nos espaços corretos. A mesma fração pode ocupar mais de um espaço.
- [x] III exige o cateto oculto e as três razões na ordem da inscrição, e aceita frações ou decimais com duas casas.
- [x] Nenhum estado inicial entrega respostas preenchidas.
- [x] Erros permitem nova tentativa sem perder progresso. As tentativas incorretas só aparecem na conclusão.
- [x] Há uma dica por etapa, e reler não aumenta o total.
- [x] Pausar, ocultar a aba e retomar preservam o tempo e as respostas parciais.
- [x] O terceiro selo abre a conclusão com as métricas da sessão.
- [x] Nenhuma estimativa de duração aparece na interface.

## 13. Telas de referência (Figma “Game”, arquivo 8a3XV8VcmxWL33TFXsjK7D)

| **Tela** | **Nó** | **Observação** |
|---|---|---|
| Início | 0:904 | Sem “45–60 min”; “Sem limite de tentativas” no lugar |
| Capítulos | 0:797 | Estados por capítulo; tempos de exemplo removidos |
| Exploração I · Átrio | 0:337 | Quatro pistas |
| Enigma I · Placa dos Catetos | 0:233 | Catetos sorteados |
| Exploração II · Galeria | 0:111 | Cinco pistas |
| Enigma II · Mecanismo das Razões | 0:3 | Frações com os lados sorteados |
| Exploração III · Santuário | 0:686 | Quatro pistas |
| Enigma III · Círculo de Pitágoras (no Figma: “O Disco de Pitágoras”) | 0:530 | **Precisa ser atualizado no Figma:** as posições passaram a ser campos de resposta (seção 7) |
| Conclusão | 0:455 | Inclui “Tentativas incorretas” |

**Fora do escopo desta versão:**
- áudio, seletor de idioma (PT-BR) e configurações; os ícones do Figma não foram implementados para não deixar comandos sem função;
- ranking com servidor;
- layouts de celular no Figma; os da implementação foram definidos no código.

## 14. Registro de mudanças (1.0 → 1.1)

| **Ponto** | **Antes (1.0)** | **Agora (1.1)** |
|---|---|---|
| Valores | 3-4-5 fixo em I e II | Triângulos sorteados a cada jornada, um diferente por etapa |
| Etapa III | Ordenar quatro símbolos, sem cálculo | Calcular o cateto oculto (Pitágoras) e as três razões, na ordem da inscrição |
| Inscrição III | “Primeiro, o seno… O teorema encerra o ciclo.” | “Primeiro, o teorema revela o lado oculto… A tangente encerra o ciclo.” |
| Duração | 45–60 minutos | Sem estimativa de tempo |
| Mesma fração em dois espaços | Não definido | Permitido |
| Relógio | Pausa e saída suspendem | Também suspende com a aba oculta |
| Revisitar | Não definido | Somente leitura; jornada é uma sessão até a conclusão; depois, nova jornada |
| Mensagens de erro | — | As da spec; tentativas incorretas contadas e exibidas só na conclusão |
| Telas I e II | Planejadas | Implementadas a partir das telas do Figma |
| Teste | — | Modo de teste com `#teste` |
| Pistas | Exibidas no painel lateral | Abertas direto num modal sobre a cena (pontos e inventário) |
| Capítulo concluído | “Rever o mecanismo” levava a outra tela | O resultado aparece direto no painel da exploração, com o botão Próximo |
| Círculo (III) | Validação só do conjunto | Validação por posição, com orientação específica para cada engano |
| Identificação | — | Tela de nome (obrigatório) e turma (opcional) antes de cada nova jornada |
| Ação principal da exploração | Botão no painel lateral | FAB fixo no canto inferior direito (Examinar / Próximo) |
| Ponto principal da cena | Mecanismo aberto só por botão | Ponto destacado sobre o mecanismo abre o enigma; pistas realocadas |
| Diário do enigma | Fórmulas e medidas fixas | Só as pistas investigadas na sala, com contagem e atalho para voltar |
| Nome do mecanismo III | “Disco de Pitágoras” | “Círculo de Pitágoras” em todos os textos do jogo |
| Rótulos dos marcadores | Sempre visíveis no desktop | Aparecem com animação só ao passar o mouse ou no foco do teclado |
| Nota final | — | Nota de 0 a 10 com conceito, mínimo 5 ao concluir, desconto por erro e por uso de dica |
| Pular mecanismo | — | Liberado após 10 tentativas incorretas; capítulo vale 0 e mostra a resolução |
| Feedback de estudo | — | Abaixo de 7 ou com pulo: enganos cometidos, assunto e links de estudo |
| Dicas | Sem penalidade | Usar dica desconta 0,5 da nota, uma vez só |
| Cards de capítulo | Todas as ações como link | Ação do capítulo ativo como botão primário |
| Filtro de nomes | — | Tipos de caractere e lista restritiva de palavrões no nome e na turma |
| Botão principal | Cor `--gold` | Token próprio `--btn-primary: #AB7F3A` (hover `#BD914A`) |
| Selos | Ícones de linha (escudo, pena, sol) | Ícones de linha temáticos: triângulo retângulo (Triângulo), compasso (Razões) e lira (Harmonia) |
| Quadro da nota | Nome e turma no título da conclusão; selos acima do quadro | Participante (nome e turma) no topo do quadro, selos logo abaixo e depois a nota, tudo no mesmo bloco |
| Ranking | — | Ranking por data, melhor nota por participante, geral e por turma (seção 10.3) |
| Turmas | Texto livre | Caixa de seleção obrigatória, só com as turmas criadas na gestão (sem “Sem turma”) |
| Área de gestão | — | `/gestao` com senha: turmas, partidas, publicação e despublicação do ranking |
| Cena do Capítulo I | Átrio em ruínas, 4 pistas | Nova ilustração do átrio (mural, corda, tábua, pergaminho, compasso), sem números na imagem; 5 pistas; mecanismo no mural do fundo |
| Banco pausado | — | Tarefa diária da Vercel consulta o banco para evitar a pausa por inatividade |
| Confirmar no celular | Botão no fim do painel | Em telas com menos de 1000 px, o botão de confirmar dos mecanismos fica fixo no rodapé da tela |
| Respostas do Círculo | Fração ou decimal; botão “/” no celular | Só inteiros ou decimais com até duas casas; sem frações e sem botão “/”; instruções e mensagens atualizadas |
