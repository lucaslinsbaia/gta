# Handoff: GTA (Geometria, Trigonometria e Álgebra), novo jogo a partir do Enigma de Pitágoras

**Data:** 21/11/2026
**Status:** aguardando decisão. O repositório `lucaslinsbaia/gta` já existe e tem a base enviada. Falta o Lucas ligá-lo ao projeto da Vercel (passo 1 da seção 5) e decidir o conteúdo e a direção de arte (seção 6).

## 1. Objetivo

Criar um novo jogo educativo de matemática, o **GTA (Geometria, Trigonometria e Álgebra)**, usando como base técnica e de jogabilidade o jogo **O Enigma de Pitágoras** (escape room de trigonometria, já publicado e em uso com turmas). O GTA tem uma estética urbana inspirada no clima dos jogos de mundo aberto da série GTA (Grand Theft Auto): cores vibrantes, pôr do sol neon e comunicação mais descontraída. Não é uma recriação desse jogo: a ideia é só pegar o clima. O endereço de produção é **https://gta-glicerio.vercel.app**.

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

**Regras de jogo do Enigma** (ver `docs/SPEC-enigma-de-pitagoras.md`), que valem como ponto de partida:
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

**Cuidado com propriedade intelectual:**
- A inspiração é estética: paleta neon e pôr do sol, cidade, tom bem-humorado, "nível de procurado" virando "nível de conhecimento".
- **Não usar** logotipos, a fonte característica, personagens, mapas, capturas de tela, músicas ou qualquer material da Rockstar Games.
- O nome "GTA" aqui é um acrônimo próprio (Geometria, Trigonometria e Álgebra). Vale manter o nome por extenso visível e não imitar o logotipo original.

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
5. **Ligação com a Vercel bloqueada:** a tentativa de ligar o repositório ao projeto `gta-glicerio` pela ferramenta da Vercel falhou com "To link a GitHub repository, you need to install the GitHub integration first". O app da Vercel no GitHub do Lucas só acessa repositórios escolhidos, e o `gta` ainda não está entre eles. Isso precisa ser feito pelo Lucas no painel (passo 1 da seção 5).

## 4. Estado atual

- **Funciona:**
  - o projeto `gta-glicerio` existe na Vercel com o domínio reservado;
  - a base de código é a do Enigma, funcionando e testada.
- **Repositório:** `lucaslinsbaia/gta` existe, com a base enviada na branch `main`.
- **Ainda não existe:**
  - ligação entre o repositório e o projeto `gta-glicerio` na Vercel;
  - nenhum deploy, então o endereço ainda não abre nada;
  - nada do conteúdo do GTA: o jogo em `src/` ainda é o Enigma inteiro, com textos, imagens e capítulos de trigonometria.
- **Atenção:** rodar `python3 src/build.py` **substitui** a página provisória `index.html` pelo jogo montado. Até o GTA ter conteúdo próprio, não rode o build antes de enviar, ou o endereço vai mostrar o Enigma.
- **Sem banco:** as rotas `/api/*` respondem 503 ("Banco de dados não configurado"). Sem servidor, o jogo funciona sem ranking e esconde o campo Turma.

## 5. Próximos passos

1. **Lucas: ligar o repositório na Vercel.** No painel da Vercel, abrir o projeto **gta-glicerio** → **Settings** → **Git** → **Connect Git Repository** → GitHub. Se o `gta` não aparecer na lista, clicar em **Adjust GitHub App Permissions** (ou ir em GitHub → Settings → Applications → Vercel → Configure → Repository access) e incluir o `gta`. Depois, escolher `lucaslinsbaia/gta`.
2. **Sessão: publicar e conferir.**
   - Fazer qualquer envio para a `main` (ou pedir ao Lucas um **Redeploy**) para gerar o primeiro deploy.
   - Conferir com `list_deployments` (projeto `gta-glicerio`) e abrir https://gta-glicerio.vercel.app, que deve mostrar a página "Em breve".
   - Para clonar numa sessão nova: `add_repo` com owner `lucaslinsbaia`, repo `gta` e access `push`.
3. **Proteção de acesso:** os projetos novos da Vercel vêm com "Vercel Authentication" em `all_except_custom_domains`. O endereço de produção `gta-glicerio.vercel.app` deve abrir sem login, como no Enigma, mas os links de prévia exigem login. Se os alunos esbarrarem em login, revisar em Settings → Deployment Protection.
4. **Combinar com o Lucas o desenho do jogo** (seção 6) antes de mexer no código. Sugestão de estrutura, com três capítulos e um por assunto:
   - **Geometria:** áreas, perímetros, ângulos;
   - **Trigonometria:** reaproveitar Pitágoras e as razões;
   - **Álgebra:** equações do 1º e do 2º grau, sistemas.
   Ambientação: missões numa cidade fictícia ao pôr do sol.
5. **Reescrever o conteúdo em `src/`:**
   - `chapter(n)` e `SEALS` em `app.js`: missões, pistas, mecanismos, textos de erro e de sucesso;
   - sorteio de valores por jornada para os novos tipos de problema;
   - `GRADE`, `MISTAKE_TEXT` e `STUDY` (links de estudo dos novos assuntos);
   - chaves de `localStorage` próprias do GTA;
   - textos com tom descontraído (gírias leves, sem palavrão).
6. **Nova direção visual** em `src/style.css`:
   - paleta neon (roxo, rosa, laranja, ciano, verde ácido);
   - tipografia de títulos condensada e pesada (por exemplo Anton ou Bebas Neue, do Google Fonts);
   - contornos e sombras chapadas, como na página provisória `index.html`;
   - conferir o contraste (WCAG AA) dos textos sobre as cores vivas.
7. **Imagens novas em `img/`** (cenas, cards, placas e fundos) nos tamanhos da seção 7, sem números desenhados. Pedir ao Lucas as imagens ou a ferramenta que ele prefere para gerá-las.
8. **Rodar o build e os testes:**
   - `python3 src/build.py`;
   - testes em `test/`, que **precisam ser atualizados** porque procuram pistas e textos do Enigma (`data-clue="canto"`, títulos e afins).
   Conferir no celular (390 px) e no computador (1440 px).
9. **Banco e ranking**, se o Lucas quiser:
   - criar o banco em Vercel → gta-glicerio → Storage;
   - criar `ADMIN_PASSWORD`;
   - recolocar o cron em `vercel.json`;
   - refazer o deploy;
   - trocar "O Enigma de Pitágoras" pelos textos do GTA em `src/pages/*` (ranking e gestão).
10. **Escrever a SPEC do GTA** em `docs/` e manter um registro de mudanças, como no Enigma. Fazer commit e envio a cada etapa.

## 6. Perguntas em aberto

1. **Público e conteúdo:** que ano ou série? Quais tópicos de Geometria, Trigonometria e Álgebra entram? É um capítulo por área ou outra divisão?
2. **Formato do jogo:** manter o escape room em três capítulos com pistas e mecanismos, ou trocar para "missões" com outro ritmo (mais curtas, com tempo, com pontuação)?
3. **Tom:** até onde vai o "descontraído"? Gírias regionais (o domínio é "glicerio": é o nome da escola ou do bairro)? Personagens próprios, como um "parceiro" que dá as dicas?
4. **Arte:** quem produz as imagens (Lucas no Figma, geração por IA, ilustração)? Fotorrealista ou ilustração chapada estilo pôster?
5. **Banco:** novo banco só do GTA, ou o mesmo do Enigma com tabelas separadas? A recomendação é um banco novo, para não misturar turmas e rankings.
6. **Turmas e gestão:** a mesma senha e as mesmas turmas do Enigma, ou tudo separado?
7. **Nome e marca:** confirmar que "GTA" fica como acrônimo e que nenhum elemento visual da franquia original será usado.
8. **Ramo antigo** `wip/fracao-barra-fixa` no repositório do Enigma: apagar? (O Lucas pode apagar pelo GitHub.)

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
cd test && node t15.js
```
Fluxo completo nos três capítulos, no computador e no celular. Outros testes: `t14` (nota), `t7` (Círculo), `t13` (cards), `t28` (rodapé fixo no celular) e `t30` (decimais no celular).

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
- **Tom do jogo:** descontraído e bem-humorado, de "missão na cidade", mas sem palavrão, violência, crime glamourizado, armas ou drogas. É um jogo escolar. "Procurado" pode virar "nível de conhecimento"; "missão", "parceiro", "quebrada" e "corre" cabem com moderação.
- **Antes de construir, confirme as perguntas da seção 6**, principalmente público, tópicos e formato. Use AskUserQuestion com opções e uma recomendação.
- **Armadilhas conhecidas:**
  - **Criar repositório e GraphQL:** a sessão não cria repositórios no GitHub nem usa a API GraphQL; só a REST, em repositórios já ligados com `add_repo`.
  - **Repositório novo na Vercel:** a ferramenta não liga um repositório novo enquanto o app da Vercel no GitHub não tiver acesso a ele; quem libera é o Lucas, no painel.
  - **Build sobrescreve a página provisória:** `src/build.py` grava `index.html`; não rode antes de ter o conteúdo do GTA, ou o site mostra o Enigma.
  - **Respostas visíveis:** nunca deixe a resposta visível em imagens, exemplos de instrução ou dicas. Confira os exemplos contra todas as respostas possíveis do sorteio.
  - **Celular:** os campos usam `inputmode="decimal"`, que não tem "/" nem "−". Se o GTA precisar de números negativos (Álgebra), resolva isso de propósito, por exemplo com um botão de sinal ou um campo de seleção.
  - **Supabase pausa após 7 dias sem uso:** se o banco for desse serviço, recoloque o cron de `/api/manter-ativo`.
  - **`position: fixed` dentro de `.screen`:** a animação de entrada das telas usa `animation-fill-mode: backwards` de propósito; com `both`, o transform residual quebraria o rodapé fixo.
  - **Elementos com `display` próprio:** o CSS tem `[hidden]{display:none!important}` global, porque elementos com `display` próprio ignoravam o atributo `hidden`.
  - **Respeitar o pedido de "pare":** se o Lucas pedir para parar, pare na hora e só salve o trabalho em andamento num ramo separado, nunca na `main`.
- **Nível de detalhe:** mudanças pequenas e testadas, com resumo curto em português no fim, listando o que mudou e o que ele precisa fazer, se houver algo.
