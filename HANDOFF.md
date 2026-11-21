# Handoff: GTA (Geometria, Trigonometria e Álgebra), novo jogo a partir do Enigma de Pitágoras

**Data:** 21/11/2026
**Status:** em andamento. O repositório `lucaslinsbaia/gta` existe e está ligado ao projeto `gta-glicerio` na Vercel, que publica a `main` automaticamente. A página provisória "Em breve" já está no ar. As decisões principais foram tomadas em 21/11 (seção 2, "Decisões do Lucas"); faltam os detalhes da seção 6.

## 1. Objetivo

Criar um novo jogo educativo de matemática, o **GTA**, para alunos do **2º e 3º ano do ensino médio** da escola **Glicério**. O jogo é organizado em **missões** e pontua conforme as missões concluídas. Tem um personagem próprio que dá as dicas, linguagem mais adolescente e visual de **ilustrações tipo pôster**, com clima urbano e neon. A base técnica é o jogo **O Enigma de Pitágoras** (escape room de trigonometria, já publicado e em uso com turmas). O endereço de produção é **https://gta-glicerio.vercel.app**.

## 2. Contexto essencial

**Quem é o usuário:** Lucas Baia (lucaslinsbaia no GitHub e na Vercel), professor e designer (UX). Ele conversa em português, dá retornos curtos com prints e gosta de ver o resultado publicado e testado.

**Stack (herdada do Enigma):**
- **Front-end:** HTML, CSS e JavaScript puro, sem framework. O jogo é **um arquivo só** (`index.html`), montado por `src/build.py` a partir de:
  - `src/head.html`, `src/body.html`, `src/style.css`;
  - `src/app.js`, onde `/*__FILTRO__*/` recebe `src/filtro.js`;
  - imagens JPEG de `img/`, embutidas em base64 nos marcadores `__IMG_<nome>__`.
- **Visual:** cores em tokens no `:root` (`src/style.css`). Fontes do Google Fonts. Ícones em SVG com `<symbol>` (sprite no fim de `src/body.html`).
- **Estado do jogo:** `localStorage`, nas chaves `enigma-pitagoras-v1` e `enigma-pitagoras-jogador`. **Trocar para chaves do GTA**, para não misturar com o Enigma no mesmo navegador.
- **Servidor (Vercel Functions, Node, ESM):**
  - rotas em `api/`: `turmas`, `resultados`, `ranking`, `admin`, `manter-ativo`;
  - código comum em `lib/`: `db.js`, `http.js`, `auth.js`, `nota.js` e `filtro.js` (este último é gerado pelo build a partir de `src/filtro.js`).
- **Banco:** Postgres pelo driver `postgres` 3.4.9, lendo a URL de `POSTGRES_URL` ou `DATABASE_URL`. As tabelas são criadas sozinhas na primeira chamada (`lib/db.js`). A URL é limpa de parâmetros extras, como o `supa=` do Supabase, que derrubava a conexão.
- **Área de gestão:**
  - `/gestao`, com senha única na variável `ADMIN_PASSWORD` da Vercel e token assinado válido por 12 horas;
  - nela o professor cria turmas, vê as partidas e publica o ranking por data;
  - o ranking público fica em `/ranking`.
- **Testes:** scripts Playwright em `test/`. O Chromium já vem instalado no ambiente em nuvem: `require('playwright')` funciona e não é preciso instalar nada. O servidor local que imita a Vercel é `test/dev-server.mjs`.

**Decisões do Lucas (21/11/2026):**
1. **Público:** 2º e 3º ano do ensino médio.
2. **Formato: missões**, no lugar dos capítulos do escape room. A pontuação é dada **de acordo com a missão concluída**: cada missão vale pontos e o total vira a nota.
3. **Tom:** linguagem mais adolescente. Gírias e humor podem, palavrão não (é um jogo escolar).
4. **Escola:** "Glicério" é o nome da escola, por isso o endereço `gta-glicerio`. Pode aparecer no jogo, por exemplo "Missões do Glicério" ou o ranking das turmas do Glicério.
5. **Personagem próprio** que dá as dicas. Precisa ser criado do zero: nome, visual e jeito de falar.
6. **Arte:** ilustrações tipo pôster. O Lucas autorizou pesquisar o material de divulgação do GTA VI (lançado recentemente) **como referência de estilo**. Os limites estão em "Cuidado com propriedade intelectual", logo abaixo.
7. **Tudo novo:** banco de dados, painel de gestão, turmas e senha próprios do GTA, sem nada compartilhado com o Enigma. O código do Enigma serve só de base.
8. **Marca:** usar a sigla **GTA** com uma identidade visual no espírito da franquia. A assinatura por extenso, "Geometria, Trigonometria e Álgebra", aparece **discreta**, sem destaque.

**Regras de jogo do Enigma** (ver `docs/SPEC-enigma-de-pitagoras.md`), que valem como ponto de partida técnico (o formato muda para missões):
- **Estrutura:** três capítulos. Cada um tem uma cena com pontos de pista e um ponto principal ("Examinar") que abre o mecanismo; resolver o mecanismo libera o capítulo seguinte.
- **Sorteio:** os triângulos são sorteados a cada jornada (ternas pitagóricas com hipotenusa até 30).
- **Nota de 0 a 10:**
  - pesos 3, 3 e 4 por capítulo;
  - desconto de 0,5, 0,5 e 0,25 por erro;
  - cada capítulo tem piso de metade do peso;
  - usar dica tira 0,5 uma vez só;
  - capítulo pulado vale 0;
  - quem conclui tem mínimo 5;
  - conceitos: Excelente (≥ 9), Muito bom (≥ 7) e Em desenvolvimento.
- **Pular:** o botão aparece depois de 10 erros no mesmo mecanismo.
- **Estudo:** abaixo de 7, ou com algum capítulo pulado, a conclusão mostra o que revisar e links de estudo.
- **Identificação:** nome ou apelido é obrigatório, com filtro de palavrões e de caracteres. A turma é **obrigatória** quando há servidor e só vale uma turma criada na gestão; não existe "Sem turma".
- **Respostas digitadas:** só **inteiro ou decimal com até duas casas** (vírgula ou ponto), sem frações, com tolerância de 0,01. O teclado do celular é `inputmode="decimal"`.
- **Exemplos nas instruções:** não podem coincidir com nenhuma resposta possível (hoje usamos 9 e 0,67).
- **Modo de teste:** acrescentar `#teste` ao endereço mostra o botão "Avançar", que resolve a etapa atual.
- **Celular:** o botão de confirmar dos mecanismos fica fixo no rodapé (telas com menos de 1000 px).

**Decisões e motivos:**
- **Um arquivo só, sem framework:** é simples de publicar, funciona até aberto direto do disco e era o que o Lucas pediu desde o início.
- **O servidor refaz a nota** a partir dos erros, pulos e dicas, em vez de confiar na nota enviada pelo navegador. É uma proteção básica contra nota inventada.
- **Banco gratuito do Supabase pausa após 7 dias sem uso.** Por isso o Enigma tem uma tarefa diária (cron) em `vercel.json` que chama `/api/manter-ativo`. No GTA o cron foi **tirado de propósito** enquanto não houver banco; recoloque quando ligar o banco.
- **Imagens sem números:** quando uma cena mostra medidas, elas não podem vir desenhadas na imagem, porque os valores mudam a cada jornada. As medidas aparecem só no texto das pistas.

**Cuidado com propriedade intelectual** (combinado em parte com o Lucas; confirmar o desenho do logo com ele):
- **Pode:** usar o material do GTA VI como **referência de estilo**. Isso inclui:
  - ilustração pintada tipo pôster, com cores saturadas e luz de pôr do sol;
  - composição em painéis com vários personagens e cenas;
  - cidade litorânea e tipografia condensada e pesada;
  - "nível de procurado" virando "nível de conhecimento".
- **Não pode:** copiar ou redesenhar o material oficial. Isso inclui:
  - o logotipo da franquia ou o seu desenho de letras;
  - a fonte característica (Pricedown) e o selo "VI";
  - personagens, artes, mapas, capturas, trailers e músicas da Rockstar Games.
  
  Todo personagem, cena e pôster do GTA da escola é original.
- **Logo:** a sigla "GTA" com letras próprias e cores do jogo, sem calcar o logotipo da Rockstar. Isso evita problema de marca e deixa o jogo com cara própria. A assinatura "Geometria, Trigonometria e Álgebra" fica pequena, sob o logo ou no rodapé.
- **Fontes:** fontes livres do Google Fonts (Anton, Bebas Neue, Bungee, Inter).
- **Exceção autorizada pelo Lucas (21/11): a tela "wasted"** usa a Pricedown Black (Typodermic). Ele enviou a fonte gratuita, cuja licença de desktop não cobre webfont nem distribuir o arquivo. Por isso a palavra foi convertida em contorno (um SVG fixo em `src/body.html`), e o arquivo `.otf` **não** entra no repositório. O mesmo vale para o logo "G.T.A" (símbolo `#logo-gta`). O Lucas pediu duas vezes o logo oficial do GTA+ da Rockstar; isso foi recusado por ser marca de outra empresa, e ficou a sigla na Pricedown. Para mudar a palavra, gere o contorno de novo com fontTools a partir do `.otf` que o Lucas tem.

## 3. O que já foi feito

**Enigma de Pitágoras** (repositório `lucaslinsbaia/enigma-de-pitagoras`, no ar em https://enigma-de-pitagoras.vercel.app):
1. Jogo completo, a partir das telas do Figma do Lucas e de uma SPEC.
2. Ao longo do caminho:
   - nota com conceito e feedback de estudo;
   - tela de identificação com filtro de nomes;
   - botão de ação flutuante (FAB) nas telas de exploração;
   - pistas abertas em modal;
   - validação por posição no Círculo;
   - ícones de selo (triângulo, compasso, lira).
3. Ranking com servidor:
   - turmas criadas na gestão;
   - envio do resultado uma única vez por jornada;
   - melhor nota por pessoa e por dia;
   - publicação feita pelo professor;
   - tarefa diária para o banco não pausar.
4. Nova cena do Capítulo I, feita a partir de uma imagem do Lucas:
   - tratamento de cor no tom do jogo;
   - mural e objetos de pista desenhados por cima;
   - mecanismo no mural do fundo e pista "Retângulos" no mosaico.
5. Respostas do Círculo:
   - **descartado:** fração com botão "/" e, depois, campo com barra fixa no meio. O Lucas preferiu aceitar só inteiro ou decimal;
   - a versão da barra fixa ficou no ramo `wip/fracao-barra-fixa`, que não vale mais e pode ser apagado (a sessão anterior foi bloqueada ao tentar apagar o ramo).
6. QR code do jogo e cartaz A5 (ficaram só na sessão anterior; refazer com `segno` se precisar).

**GTA** (esta preparação):
1. **Projeto na Vercel criado:** `gta-glicerio` (id `prj_1Ne8GTeNnUH106Q3hWiSEImD45yY`, time `team_4LR2S470KBcyUJ1bWw2mIZ7k`). O domínio **gta-glicerio.vercel.app** já está reservado e verificado nesse projeto. Ainda **não está ligado a um repositório**, nem tem deploy.
2. **Repositório local montado** (ver seção 7), com:
   - a base completa do Enigma: fonte, imagens, servidor e testes;
   - o `src/build.py` adaptado para gravar na raiz do repositório;
   - testes apontando para o `index.html` local;
   - uma **página provisória "Em breve"** no estilo neon como `index.html`.
3. **Repositório no GitHub:** a sessão não consegue criar repositórios (só acessa os que já existem), então o Lucas criou `lucaslinsbaia/gta`, privado e vazio. Em seguida, a sessão o ligou com `add_repo` e enviou a base para a branch `main`.
4. **A base foi testada:** o build gerou um `index.html` idêntico ao do Enigma, e os testes de fluxo, de nota e do Círculo passaram.
5. **Ligação com a Vercel bloqueada:** a tentativa de ligar o repositório ao projeto `gta-glicerio` pela ferramenta da Vercel falhou com "To link a GitHub repository, you need to install the GitHub integration first". O app da Vercel no GitHub do Lucas só acessa repositórios escolhidos, e o `gta` ainda não está entre eles. O Lucas liberou o acesso e ligou o repositório pelo painel (Settings → Git); a partir daí, cada envio para a `main` publica.
6. **Primeiro deploy no ar:** https://gta-glicerio.vercel.app mostra a página provisória "Em breve" e abre sem login.
7. **Decisões do Lucas registradas** em 21/11 (seção 2): público, formato em missões, tom, escola, personagem, arte tipo pôster, banco e gestão novos, marca.
8. **Referências visuais** pesquisadas na divulgação do GTA VI (capa de 18/06/2026). O quadro de referências e um rascunho de pôster 4:5 estão no canvas "GTA Glicério — Referências visuais" (https://claude.ai/artifact/KNmFHxpmqN7DVK6dQve36b).
9. **Missões e pontuação definidas** em `docs/SPEC-gta.md` (v0.1), com sorteios que só dão respostas positivas.

## 4. Estado atual

- **Funciona:**
  - o projeto `gta-glicerio` existe na Vercel com o domínio reservado;
  - a base de código é a do Enigma, funcionando e testada.
- **Repositório:** `lucaslinsbaia/gta` existe, com a base enviada na branch `main`, e está ligado ao projeto `gta-glicerio` na Vercel.
- **Jogo do GTA no ar (21/11):** o `src/` foi reescrito e o `index.html` agora é o jogo:
  - capa em colagem com o logo C;
  - identificação e mapa com as 6 missões em sequência;
  - missões em duas etapas: A é montar a conta arrastando peças, B é múltipla escolha com 4 alternativas; dicas da Dani Pixel (−20), "Pular" depois de 10 erros e resolução;
  - conclusão com pontos, estrelas e links de estudo, e envio do resultado.
- **Servidor atualizado:**
  - `lib/nota.js` refaz pontos, estrelas e nota;
  - a tabela `resultados` ganhou `pontos` e `estrelas`;
  - ranking e gestão ordenam por pontos;
  - o ranking público mostra pontos e estrelas, e a gestão mostra também a nota.
- **Testado** com Postgres local: 2 partidas, publicação e páginas de ranking e gestão.
- **Imagens antigas do Enigma** continuam em `img/` sem uso. Podem ser apagadas.
- **Sem banco:** as rotas `/api/*` respondem 503 ("Banco de dados não configurado"). Sem servidor, o jogo funciona sem ranking e esconde o campo Turma.

## 5. Próximos passos

1. ~~**Lucas: ligar o repositório na Vercel.**~~ **Feito.** No painel da Vercel, abrir o projeto **gta-glicerio** → **Settings** → **Git** → **Connect Git Repository** → GitHub. Se o `gta` não aparecer na lista, clicar em **Adjust GitHub App Permissions** (ou ir em GitHub → Settings → Applications → Vercel → Configure → Repository access) e incluir o `gta`. Depois, escolher `lucaslinsbaia/gta`.
2. **Sessão: publicar e conferir.**
   - Fazer qualquer envio para a `main` (ou pedir ao Lucas um **Redeploy**) para gerar o primeiro deploy.
   - Conferir com `list_deployments` (projeto `gta-glicerio`) e abrir https://gta-glicerio.vercel.app, que deve mostrar a página "Em breve".
   - Para clonar numa sessão nova: `add_repo` com owner `lucaslinsbaia`, repo `gta` e access `push`.
3. **Proteção de acesso:** os projetos novos da Vercel vêm com "Vercel Authentication" em `all_except_custom_domains`. O endereço de produção `gta-glicerio.vercel.app` deve abrir sem login, como no Enigma, mas os links de prévia exigem login. Se os alunos esbarrarem em login, revisar em Settings → Deployment Protection.
4. **Pesquisar referências de estilo** (o Lucas autorizou). Usar WebSearch nas artes de divulgação do GTA VI e montar um quadro curto de referências: paleta, luz, composição dos pôsteres e tipografia. A pesquisa serve só de inspiração; nada oficial entra no repositório (ver "Cuidado com propriedade intelectual").
5. **Propor ao Lucas, antes de codar, numa página de rascunho (artifact) ou nas mensagens:**
   - **logo GTA** original, com a assinatura discreta;
   - **paleta e tipografia**;
   - **personagem das dicas:** 2 ou 3 opções de nome, visual e jeito de falar. sem estereótipos nem regionalismos (ver "Tom do jogo" na seção 8);
   - **mapa de missões** com os assuntos (seção 6, pergunta 1);
   - **regra de pontuação** por missão (pergunta 2).
6. **Reescrever o jogo em `src/`** a partir das decisões:
   - capítulos viram missões: tela de "mapa da cidade" ou "lista de missões", cada missão com briefing, pistas, desafio e recompensa;
   - pontuação por missão concluída, refeita também no servidor (`lib/nota.js` e `api/resultados.js`);
   - personagem das dicas no lugar do diário e das dicas do Enigma;
   - textos em linguagem adolescente, sem palavrão;
   - chaves de `localStorage` próprias (por exemplo `gta-glicerio-v1`);
   - sorteio de valores por jornada para cada tipo de problema;
   - `STUDY` com links de estudo dos novos assuntos.
7. **Nova direção visual** em `src/style.css`: paleta neon e pôr do sol, tipografia condensada e pesada, contornos e sombras chapadas, como na página provisória. Conferir o contraste (WCAG AA) dos textos sobre as cores vivas.
8. **Ilustrações tipo pôster em `img/`** (cenas das missões, cards, personagem, fundos), nos tamanhos da seção 7 e sem números desenhados. Combinar com o Lucas quem gera as imagens (ver seção 6).
9. **Banco e gestão novos (tudo separado do Enigma):**
   - criar um banco novo em Vercel → gta-glicerio → Storage;
   - criar `ADMIN_PASSWORD` própria;
   - recolocar o cron de `/api/manter-ativo` em `vercel.json`;
   - refazer o deploy;
   - adaptar `src/pages/*` (ranking e gestão) ao visual e aos textos do GTA. As tabelas nascem sozinhas no banco novo.
10. **Build e testes:**
    - `python3 src/build.py`;
    - ~~atualizar os testes~~ feito: `test/gta-fluxo.js` (os testes antigos do Enigma foram para `test/legado-enigma/`).
    Conferir no celular (390 px) e no computador (1440 px). Fazer commit e envio a cada etapa.
11. **Escrever a SPEC do GTA** em `docs/SPEC-gta.md`, com o registro de mudanças.

## 6. Perguntas em aberto

1. ~~**Assuntos das missões.**~~ **Decidido em 21/11:** 6 missões em sequência, 2 por área. Detalhes em `docs/SPEC-gta.md`.
2. ~~**Pontuação.**~~ **Decidido em 21/11:**
   - 100 pontos por missão;
   - erro −10, dica −20 (uma vez);
   - piso de 50 por missão concluída, pulada vale 0;
   - nota = pontos ÷ 60, mínimo 5 para quem conclui;
   - o ranking mostra pontos e estrelas.
   Detalhes em `docs/SPEC-gta.md`.
3. ~~**Personagem.**~~ **Decidido em 21/11:** **Dani Pixel**. Cria conteúdo de desafios e transmite cada missão como uma live, com o "chat" torcendo. Nome que serve para qualquer gênero; usa fone amarelo e jaqueta magenta e anda sempre com o celular na mão. Fala em linguagem de internet, igual no Brasil todo: "chat, olha isso", "nível desbloqueado", "GG", "salva essa dica". Nada de estereótipo nem de regionalismo: o jogo será aplicado em vários lugares, e o Glicério fica no RS.
4. ~~**Imagens.**~~ **Feito em 21/11:** a sessão gerou as ilustrações tipo pôster pela geração de imagem do Figma, no time "Baía" do Lucas (arquivo "GTA Glicério — Ilustrações", https://www.figma.com/design/nttiyzSJ2Wpn1GeQG8QYf5). São a Dani Pixel e uma cena para cada missão, todas sem texto e sem números. Ficam em `img/`:
   - `gta_cena_m*` (1510 × 806);
   - `gta_card_m*` (832 × 496);
   - `gta_dani_pixel` (800 × 1000) e `gta_dani_avatar` (480 × 480).

   A capa é montada em HTML, numa colagem com as imagens e o logo (ver o artboard "Capa" no canvas). O estilo segue as capas da franquia, mas todos os personagens e cenas são originais.
5. ~~**Números negativos.**~~ **Decidido em 21/11:** nenhuma pergunta pode ter resposta negativa. Os sorteios da SPEC garantem isso, e o teclado continua `inputmode="decimal"`.
6. ~~**Logo.**~~ **Decidido em 21/11:** direção C, "Listras pôr do sol". É a sigla em Bungee com listras amarelo, laranja, rosa e magenta e contorno creme. A assinatura "Geometria, Trigonometria e Álgebra" fica discreta abaixo.
7. **Ramo antigo do Enigma:** `wip/fracao-barra-fixa` pode ser apagado pelo Lucas no GitHub.

## 7. Artefatos relevantes

**Endereços:**
- GTA (produção): https://gta-glicerio.vercel.app (projeto Vercel `gta-glicerio`, `prj_1Ne8GTeNnUH106Q3hWiSEImD45yY`)
- Repositório do GTA: https://github.com/lucaslinsbaia/gta (privado, branch `main`)
- Enigma: https://enigma-de-pitagoras.vercel.app · `/ranking` · `/gestao` (projeto Vercel `enigma`, `prj_CI5THN1mclShRcKULIG3HT9k7R5a`)
- Time da Vercel: `team_4LR2S470KBcyUJ1bWw2mIZ7k`
- Repositório do Enigma: https://github.com/lucaslinsbaia/enigma-de-pitagoras (lá só ficam os arquivos montados; o código-fonte original estava fora do repositório, em `/home/user/enigma/src` da sessão anterior, e foi copiado para este repositório)

**Estrutura deste repositório:**
```
index.html            página provisória "Em breve" (o build substitui pelo jogo)
src/                  fonte do jogo: head.html, body.html, style.css, app.js, filtro.js, build.py
src/pages/            ranking e gestão: *.body.html, *.js, pages.css, common.js
img/                  imagens JPEG embutidas pelo build (__IMG_<nome>__ em app.js)
api/  lib/            Vercel Functions e código comum (Postgres, sessão, nota, filtro)
test/                 testes Playwright e servidor local (dev-server.mjs); package.json do test = commonjs
docs/SPEC-enigma-de-pitagoras.md   regras completas do jogo-base
vercel.json           cleanUrls e cabeçalhos (sem cron por enquanto)
```

**Tamanhos de imagem (2×):**
- cards dos capítulos: 832 × 496 (proporção 5:3);
- cenas das salas: 2016 × 1076 (aceita 1510 × 806);
- placas: 1648 × 1180;
- fundos: 2560 × 1600.

Use JPEG com qualidade de 72 a 80 e até uns 250 KB cada, porque tudo vai em base64 dentro do `index.html`.

**Comandos:**
```bash
python3 src/build.py
```
Monta `index.html`, `ranking.html` e `gestao.html`, e gera `lib/filtro.js`.

```bash
cd test && node gta-fluxo.js
```
Confere 18 mil sorteios (peças necessárias presentes, 4 alternativas distintas e positivas) e o fluxo completo das 6 missões a 1440 e 390 px: arrastar, tocar e soltar, alternativa errada, dica, pular, pontos e ausência de rolagem lateral.

```bash
service postgresql start
```
Liga o Postgres 16, que já vem instalado no ambiente. Antes do servidor local, crie o usuário e o banco `enigma`/`enigma`:

```bash
su postgres -c "psql -c \"CREATE ROLE enigma LOGIN PASSWORD 'enigma' SUPERUSER;\" -c 'CREATE DATABASE enigma OWNER enigma;'"
```

Para subir o servidor local, que imita a Vercel em http://localhost:3000:

```bash
npm install && POSTGRES_URL=postgres://enigma:enigma@localhost:5432/enigma ADMIN_PASSWORD=teste node test/dev-server.mjs
```

**Regra de commits:** autor `-c user.name="Lucas Baia" -c user.email="lucaslinsbaia@gmail.com"` e as linhas finais de coautoria e sessão que o ambiente pedir. Não escrever o nome do modelo de IA em commits, código ou documentos do repositório.

## 8. Instruções pra próxima sessão

- **Idioma e tom com o Lucas:** português do Brasil, direto e cordial. Ele valoriza ver o resultado: depois de cada mudança visual, tire capturas de tela (390 px e 1440 px) e mostre. Faça commit e envio ao fim de cada pedido; a Vercel publica sozinha a partir da branch `main`.
- **Tom do jogo:** linguagem adolescente, bem-humorada, de "missão na cidade", com gírias que se usam no país todo, como "partiu", "mandou bem", "tá voando", "bora", "GG". **Sem estereótipos nem regionalismos** (sotaque, gírias de uma região, "quebrada", "macho" etc.): o jogo será aplicado em vários lugares do Brasil, e o Glicério fica no Rio Grande do Sul. A cidade das missões é inventada e não representa nenhuma região. Sem palavrão, violência, crime glamourizado, armas ou drogas: é um jogo escolar. "Procurado" vira "nível de conhecimento", e as missões são desafios de matemática pela cidade (obra, festa, quadra, loja, viagem), não crimes.
- **Antes de construir, confirme as perguntas da seção 6**, principalmente assuntos, pontuação e personagem. Use AskUserQuestion com opções e uma recomendação, e mostre rascunhos visuais (artifact) do logo, da paleta e do personagem antes de mexer no jogo.
- **Armadilhas conhecidas:**
  - **Criar repositório e GraphQL:** a sessão não cria repositórios no GitHub nem usa a API GraphQL; só a REST, em repositórios já ligados com `add_repo`.
  - **Repositório novo na Vercel:** a ferramenta não liga um repositório novo enquanto o app da Vercel no GitHub não tiver acesso a ele; quem libera é o Lucas, no painel.
  - **Build:** `src/build.py` grava `index.html`, `ranking.html`, `gestao.html` e `lib/filtro.js`. Rode sempre antes de enviar mudanças em `src/`.
  - **Respostas visíveis:** nunca deixe a resposta visível em imagens, exemplos de instrução ou dicas. Confira os exemplos contra todas as respostas possíveis do sorteio.
  - **Sem campo de digitar:** as respostas são arrastar e soltar (etapa A) e múltipla escolha (etapa B). Não dê `transform` (como a animação de tremer) num elemento que contenha o botão fixo do rodapé, porque ele sai do lugar no celular. Por isso só a área da resposta treme.
  - **Supabase pausa após 7 dias sem uso:** se o banco for desse serviço, recoloque o cron de `/api/manter-ativo`.
  - **`position: fixed` dentro de `.screen`:** a animação de entrada das telas usa `animation-fill-mode: backwards` de propósito; com `both`, o transform residual quebraria o rodapé fixo.
  - **Elementos com `display` próprio:** o CSS tem `[hidden]{display:none!important}` global, porque elementos com `display` próprio ignoravam o atributo `hidden`.
  - **Respeitar o pedido de "pare":** se o Lucas pedir para parar, pare na hora e só salve o trabalho em andamento num ramo separado, nunca na `main`.
- **Nível de detalhe:** mudanças pequenas e testadas, com resumo curto em português no fim, listando o que mudou e o que ele precisa fazer, se houver algo.
