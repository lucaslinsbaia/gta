"""Monta o jogo: index.html (jogo), ranking.html e gestao.html na raiz do repositório.
Rodar da raiz:  python3 src/build.py"""
import base64, pathlib
src = pathlib.Path(__file__).parent
img = src.parent / 'img'
css = (src / 'style.css').read_text()
body = (src / 'body.html').read_text()
js = (src / 'app.js').read_text()
head = (src / 'head.html').read_text()
filtro = (src / 'filtro.js').read_text()
js = js.replace('/*__FILTRO__*/', filtro)
repo = src.parent
(repo / 'lib' / 'filtro.js').write_text('/* Gerado a partir de src/filtro.js (o mesmo filtro do jogo). */\n' + filtro + '\nexport { nameProblem, classProblem, hasBlockedTerm, filterKey };\n')
for f in sorted(img.glob('*.jpg')):
    uri = 'data:image/jpeg;base64,' + base64.b64encode(f.read_bytes()).decode()
    js = js.replace(f'__IMG_{f.stem}__', uri)
assert '__IMG_' not in js, 'imagem faltando'
css = css + '\n  .sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }\n'
standalone = ('<!DOCTYPE html>\n<html lang="pt-BR">\n<head>\n<meta charset="UTF-8">\n'
              '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
              + head.replace('<meta name="claude:viewport-fit-sides" content="cover">\n', '')
              + f'<style>\n{css}</style>\n</head>\n<body>\n{body}\n<script>\n{js}</script>\n</body>\n</html>\n')
(repo / 'index.html').write_text(standalone)
print('jogo ok', len(standalone) // 1024, 'KB')

# --- Páginas do servidor (ranking público e gestão) ---------------------
pages = src / 'pages'
sprite = body[body.index('<svg width="0" height="0"'):]
sprite = sprite[:sprite.index('</svg>') + 6]
fonts = '\n'.join(l for l in head.splitlines() if 'fonts.g' in l)
page_css = css + (pages / 'pages.css').read_text()
common = (pages / 'common.js').read_text()

def make_page(name, title, description, extra_head=''):
    script = (pages / f'{name}.js').read_text().replace('/*__FILTRO__*/', filtro)
    html = ('<!DOCTYPE html>\n<html lang="pt-BR">\n<head>\n<meta charset="UTF-8">\n'
            '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
            f'<title>{title}</title>\n<meta name="description" content="{description}">\n{extra_head}{fonts}\n'
            f'<style>\n{page_css}</style>\n</head>\n<body>\n{(pages / f"{name}.body.html").read_text()}\n{sprite}\n'
            f'<script>\n{common}\n{script}</script>\n</body>\n</html>\n')
    (repo / f'{name}.html').write_text(html)

make_page('ranking', 'Ranking · GTA Edição Porto Alegre', 'Ranking publicado do GTA, Edição Porto Alegre.')
make_page('gestao', 'Gestão · GTA Edição Porto Alegre', 'Área de gestão do jogo GTA.', '<meta name="robots" content="noindex, nofollow">\n')
print('páginas ok')
