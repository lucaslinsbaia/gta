# GTA · Geometria, Trigonometria e Álgebra

Jogo educativo de matemática com clima urbano e neon, feito a partir do jogo [O Enigma de Pitágoras](https://enigma-de-pitagoras.vercel.app).

- Produção: https://gta-glicerio.vercel.app
- Situação: em construção. Veja [HANDOFF.md](HANDOFF.md) para o contexto completo e os próximos passos.
- Regras do jogo-base: [docs/SPEC-enigma-de-pitagoras.md](docs/SPEC-enigma-de-pitagoras.md)

## Como montar

```bash
python3 src/build.py
```

Gera `index.html` (jogo), `ranking.html` e `gestao.html` na raiz. Atenção: substitui a página provisória "Em breve".

## Publicação

A Vercel publica automaticamente a cada envio para a branch `main` (projeto `gta-glicerio`).
