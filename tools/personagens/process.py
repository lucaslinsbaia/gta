"""Prepara os personagens: recorta o fundo verde, reduz a 128 px, separa pele, cabelo e íris."""
import json, sys, colorsys
import numpy as np
from PIL import Image
from scipy import ndimage
R = 128
OVR = json.load(open('/home/claude/chars/overrides.json')) if len(sys.argv) < 2 else {}
try: OVR = json.load(open('/home/claude/chars/overrides.json'))
except Exception: OVR = {}

def hsv_arr(rgb):
    r, g, b = [rgb[..., i] / 255 for i in range(3)]
    mx, mn = np.maximum(np.maximum(r, g), b), np.minimum(np.minimum(r, g), b)
    d = mx - mn + 1e-9
    h = np.where(mx == r, ((g - b) / d) % 6, np.where(mx == g, (b - r) / d + 2, (r - g) / d + 4)) * 60
    s = np.where(mx > 0, (mx - mn) / (mx + 1e-9), 0)
    return h, s, mx

def process(name):
    o = OVR.get(name, {})
    a = np.array(Image.open(f'/home/claude/chars/raw/{name}.png').convert('RGB')).astype(int)
    g_dom = a[..., 1] - np.maximum(a[..., 0], a[..., 2])
    key = (a[..., 1] > 120) & (g_dom > 50)
    rgba = np.dstack([a, np.where(key, 0, 255)]).astype(np.uint8)
    small = np.array(Image.fromarray(rgba, 'RGBA').resize((R, R), Image.BOX)).astype(int)
    alpha = small[..., 3] > 150
    # tira o verde que sobra na borda
    rgb = small[..., :3].copy()
    gd = rgb[..., 1] - np.maximum(rgb[..., 0], rgb[..., 2])
    rgb[..., 1] = np.where(alpha & (gd > 0), np.maximum(rgb[..., 0], rgb[..., 2]), rgb[..., 1])
    q = np.array(Image.fromarray(rgb.astype(np.uint8)).quantize(colors=56, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).convert('RGB')).astype(int)
    h, s, v = hsv_arr(q.astype(float))
    Y, X = np.mgrid[0:R, 0:R]
    warm = ((h < 48) | (h > 335)) & alpha
    # pele: cor de referência tirada das bochechas
    cheek = alpha & (Y >= o.get('cy', 60)) & (Y <= o.get('cy', 60) + 12) & (np.abs(X - 64) <= 16) & warm & (v > .4)
    h0, s0, v0 = np.median(h[cheek]), np.median(s[cheek]), np.median(v[cheek])
    tol_h, tol_s = o.get('tol_h', 10), o.get('tol_s', .2)
    skinlike = warm & (np.abs(h - h0) < tol_h) & (np.abs(s - s0) < tol_s) & (v > o.get('vmin', .3))
    lab, n = ndimage.label(skinlike)
    seeds = set(lab[cheek & skinlike].ravel()) - {0}
    skin = np.isin(lab, list(seeds))
    face = ndimage.binary_fill_holes(ndimage.binary_closing(skin, iterations=3)) & alpha
    # olhos: brancos dos olhos na metade de cima do rosto
    fy = np.where(face.any(1))[0]; top, bot = fy.min(), fy.max()
    band = face & (Y > top + (bot - top) * .2) & (Y < top + (bot - top) * .5)
    # olho: pixel claro e pouco saturado (branco do olho) com um pixel bem escuro ao lado (íris/cílio)
    dark = alpha & (v < .3)
    near_dark = ndimage.binary_dilation(dark, iterations=2)
    whites = band & (s < .25) & (v > .68) & near_dark & (np.abs(X - 64) < 26)
    eyes = []
    for side in ((X < 64) & (X > 36), (X >= 64) & (X < 92)):
        m = whites & side
        if m.sum() < 1: m = band & side & dark
        yy, xx = np.where(m)
        eyes.append([float(np.median(xx)), float(np.median(yy))])
    eyes = o.get('eyes', eyes)
    # refina: centro dos pixels escuros (íris, pupila, cílios) perto da estimativa
    ref = []
    for ex, ey in eyes:
        win = alpha & (np.abs(X - ex) <= 6) & (Y >= ey - 3) & (Y <= ey + 5) & (v < .34)
        lab2, n2 = ndimage.label(win)
        if n2:
            sizes = ndimage.sum(win, lab2, range(1, n2 + 1)); big = lab2 == (1 + int(np.argmax(sizes)))
            yy, xx = np.where(big); ref.append([float(xx.mean()), float(yy.mean()) + .8])
        else: ref.append([ex, ey])
    eyes = ref
    iris = np.zeros_like(alpha)
    for ex, ey in eyes:
        box = ((X - ex) / 3.6) ** 2 + ((Y - ey) / 2.6) ** 2 <= 1
        iris |= box & alpha & (v > .14) & (v < .58) & (s > .3)
    skin &= ~iris
    # cabelo: o que for "castanho" fora da pele, do rosto (menos sobrancelhas) e da roupa
    mouth = face & (Y > top + (bot - top) * .62)
    hairlike = alpha & ~skin & ~iris & ~mouth & ((h < 50) | (h > 330)) & (s > .12) & (v < o.get('hair_vmax', .8))
    brow_zone = face & (Y < top + (bot - top) * .42)
    hair = hairlike & (~face | brow_zone) & (Y < o.get('hair_ymax', 128))
    for x0, y0, x1, y1 in o.get('not_hair', []): hair &= ~((X >= x0) & (X <= x1) & (Y >= y0) & (Y <= y1))
    # contornos escuros dentro/na borda do cabelo também viram cabelo (cachos, coque)
    hair |= alpha & (v < .2) & ndimage.binary_dilation(hair, iterations=1) & ~ndimage.binary_erosion(face, iterations=2) & ~iris
    if 'face_ellipse' in o:   # rosto definido à mão (lenço da mesma cor da pele)
        cx, cy, rx, ry = o['face_ellipse']
        inside = ((X - cx) / rx) ** 2 + ((Y - cy) / ry) ** 2 <= 1
        skin = (skin | (inside & alpha & ((h < 50) | (h > 330)) & (v > .3) & (s > .2))) & ~iris
        hair &= ~inside
    for x0, y0, x1, y1 in o.get('skin_add', []):
        r = (X >= x0) & (X <= x1) & (Y >= y0) & (Y <= y1) & alpha & ((h < 50) | (h > 330)) & (s > .2) & (v > .25) & ~iris
        skin |= r; hair &= ~r
    for x0, y0, x1, y1 in o.get('not_skin', []): skin &= ~((X >= x0) & (X <= x1) & (Y >= y0) & (Y <= y1))
    # luz de borda (laranja do pôr do sol) colada no cabelo ou na pele: recolore pela metade
    rim = alpha & ((h < 50) | (h > 330)) & (v >= .7) & (s > .45) & ~skin & ~hair & ~iris
    rim_hair = rim & ndimage.binary_dilation(hair, iterations=1) & ~face
    rim_skin = rim & ndimage.binary_dilation(skin, iterations=1) & ~rim_hair & ~mouth
    # salva
    base = np.dstack([q, np.where(alpha, 255, 0)]).astype(np.uint8)
    Image.fromarray(base, 'RGBA').save(f'/home/claude/chars/out/{name}.png', optimize=True)
    mask = np.dstack([np.where(skin, 255, np.where(rim_skin, 140, 0)), np.where(hair, 255, np.where(rim_hair, 140, 0)), iris * 255]).astype(np.uint8)
    Image.fromarray(mask, 'RGB').save(f'/home/claude/chars/out/{name}_mask.png', optimize=True)
    return {'eyes': [[round(e, 1) for e in p] for p in eyes]}, base, mask

meta = {}
names = [f'f{i}' for i in range(1, 9)] + [f'm{i}' for i in range(1, 9)]
sheet = Image.new('RGB', (8 * 260, 4 * 260), 'white')
for i, n in enumerate(names):
    info, base, mask = process(n)
    meta[n] = info
    b = Image.fromarray(base, 'RGBA'); bg = Image.new('RGBA', (R, R), (60, 30, 90, 255)); bg.alpha_composite(b)
    ov = np.array(bg.convert('RGB')).astype(float); m = mask.astype(float) / 255
    tint = np.zeros_like(ov); tint[..., 0] = 255 * m[..., 0]; tint[..., 1] = 255 * m[..., 1]; tint[..., 2] = 255 * m[..., 2]
    sel = m.max(2) > 0
    ov[sel] = ov[sel] * .35 + tint[sel] * .65
    col, row = i % 8, (i // 8) * 2
    sheet.paste(bg.convert('RGB').resize((256, 256), Image.NEAREST), (col * 260, row * 260))
    sheet.paste(Image.fromarray(ov.astype(np.uint8)).resize((256, 256), Image.NEAREST), (col * 260, (row + 1) * 260))
json.dump(meta, open('/home/claude/chars/out/meta.json', 'w'))
sheet.save('/home/claude/chars/sheet.png')
print(json.dumps(meta))
