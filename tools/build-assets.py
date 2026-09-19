#!/usr/bin/env python3
"""
Bouwt de spel-assets uit de illustraties van 'styling inspo.zip' (Sterreneiland).

Gebruik:
  python tools/build-assets.py <map met avatars.png, hair-16.png, clothes.png, village.png, ...> [--preview <map>]

Schrijft:
  assets/doll.png           sprite-atlas met losse, inkleurbare lagen van het poppetje
  assets/doll-manifest.js   waar elke laag in de atlas staat + ogen/mond-posities + loopraster van het dorp
  assets/village.jpg        de dorpskaart (wereld)
  assets/bg/*.jpg           uitsneden van de illustraties als decor achter het model

Hoe het poppetje werkt: elke sprite wordt gesplitst in 'stof' (grijs, wordt in het spel
vermenigvuldigd met de kledingkleur), 'huid' (grijs, x huidskleur), 'haar' (grijs, x haarkleur),
'oog' (grijs, x oogkleur) en 'vast' (kleur blijft: ogen, mond, witte zolen).
"""
import os, sys, json, math
import numpy as np
from PIL import Image, ImageFilter, ImageDraw
from scipy import ndimage

FRAME = 400
NECK = 180        # nek in het genormaliseerde frame
FEET = 390        # voeten in het genormaliseerde frame
ATLAS_W = 2048

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'assets')

# ------------------------------------------------------------------ hulpjes
def hsv(a):
    a = a.astype(np.float32)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    mx = a.max(2); mn = a.min(2); d = mx - mn
    v = mx / 255.0
    s = np.where(mx > 0, d / np.maximum(mx, 1), 0)
    dd = np.maximum(d, 1)
    h = np.where(mx == r, ((g - b) / dd) % 6, np.where(mx == g, (b - r) / dd + 2, (r - g) / dd + 4)) * 60
    h = np.where(d > 0, h, 0)
    return h, s, v

def lum(a):
    a = a.astype(np.float32)
    return 0.299 * a[..., 0] + 0.587 * a[..., 1] + 0.114 * a[..., 2]

def pink(a):
    r, g, b = [a[..., i].astype(np.int16) for i in range(3)]
    return (r - g > 35) & (b - g > 12) & (r > b)
def blue(a):
    r, g, b = [a[..., i].astype(np.int16) for i in range(3)]
    return (b - r > 12) & (b > g)
def green(a):
    r, g, b = [a[..., i].astype(np.int16) for i in range(3)]
    return (g - r > 20) & (g - b > 10)
def hairtest(a):
    r, g, b = [a[..., i].astype(np.int16) for i in range(3)]
    mx = a.max(2).astype(np.int16); mn = a.min(2).astype(np.int16)
    h, s, v = hsv(a)
    skinny = (s > 0.28) & (v > 0.45) & (h >= 5) & (h <= 45)
    return (mx - mn < 75) & (mx < 210) & (r >= b) & ~skinny
def skintest(a):
    h, s, v = hsv(a)
    return (h >= 5) & (h <= 45) & (s >= 0.12) & (s <= 0.78) & (v >= 0.35)
def whitish(a, v0=0.75, s0=0.15):
    h, s, v = hsv(a)
    return (s < s0) & (v > v0)

# ------------------------------------------------------------------ sprites inlezen
def cell_grid(img, i):
    w, h = img.width // 4, img.height // 4
    return img.crop(((i % 4) * w, (i // 4) * h, (i % 4 + 1) * w, (i // 4 + 1) * h)).resize((FRAME, FRAME), Image.LANCZOS)

def cell_legacy(img, i):
    w = img.width / 4; centers = [0.134, 0.375, 0.614, 0.863]
    dw = round(FRAME * w / img.height)
    x0 = centers[i] * img.width - w / 2
    c = img.crop((round(x0), 0, round(x0 + w), img.height)).resize((dw, FRAME), Image.LANCZOS)
    out = Image.new('RGB', (FRAME, FRAME), (255, 255, 255)); out.paste(c, ((FRAME - dw) // 2, 0))
    return out

def remove_bg(rgb, legacy):
    """alpha-masker: achtergrond (wit of dambord) weg, zoals de originele renderer"""
    a = np.asarray(rgb).astype(np.int16)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    mx = a.max(2); mn = a.min(2)
    yy = np.arange(FRAME)[:, None] * np.ones((1, FRAME), dtype=int)
    cand = (mx - mn < 22) & (mx > (130 if legacy else 200))
    if legacy:
        cand &= ~((yy < 260) & (r - b > 7) & (r - g > 3))
    lab, n = ndimage.label(cand)
    edge = np.zeros_like(cand); edge[0, :] = edge[-1, :] = edge[:, 0] = edge[:, -1] = True
    edge_labels = np.unique(lab[edge & cand])
    bg = np.isin(lab, edge_labels) & cand & (lab > 0)
    alpha = ~bg
    if legacy:
        gray = (mx - mn < 22) & (mx > 130) & (yy >= 200) & ~((yy < 260) & (r - b > 7) & (r - g > 3))
        alpha &= ~gray
    return alpha

def restore_soles(rgb, alpha):
    """witte sneakerzolen zitten vast aan de witte achtergrond; zet ze terug tussen de roze schoenranden"""
    a = np.asarray(rgb).astype(np.int16)
    pk = pink(a)
    mx = a.max(2); mn = a.min(2)
    near_white = (a[..., 0] > 195) & (mx - mn < 25)
    alpha = alpha.copy()
    for y in range(330, FRAME):
        for left, right in ((80, 199), (200, 320)):
            band = pk[max(330, y - 4):min(FRAME, y + 5), left:right + 1]
            cols = np.where(band.any(0))[0]
            if len(cols):
                lo, hi = left + cols.min(), left + cols.max()
                seg = near_white[y, lo:hi + 1]
                alpha[y, lo:hi + 1] |= seg
    return alpha

def find_neck(rgb, alpha):
    a = np.asarray(rgb)
    col = pink(a) | blue(a) | green(a)
    for y in range(140, 260):
        if col[y, 193:207].sum() > 7:
            return y
    return 180

def find_feet_top(rgb, alpha):
    a = np.asarray(rgb)
    solid = alpha
    ys = np.where(solid.any(1))[0]
    top = int(ys.min()) if len(ys) else 0
    col = (pink(a) | blue(a)) & solid
    rows = np.where(col.any(1))[0]
    rows = rows[rows > 300]
    feet = int(rows.max()) if len(rows) else 380
    return feet, top

def normalize(rgb, alpha, neck, feet, kind):
    """schaal + verschuif zodat nek op NECK ligt (en voeten op FEET voor kleding)"""
    a = np.asarray(rgb).copy()
    a[~alpha] = 255
    rgba = np.dstack([a, (alpha * 255).astype(np.uint8)])
    img = Image.fromarray(rgba, 'RGBA')
    if kind == 'head':
        ys = np.where(alpha.any(1))[0]; top = int(ys.min())
        s = min(1.0, 170.0 / max(1, neck - top))
        ty = NECK - neck * s
    else:
        s = (FEET - NECK) / max(1, feet - neck)
        ty = NECK - neck * s
    tx = 200 - 200 * s
    out = img.transform((FRAME, FRAME), Image.AFFINE, (1 / s, 0, -tx / s, 0, 1 / s, -ty / s), resample=Image.BILINEAR)
    o = np.asarray(out)
    return o[..., :3].copy(), o[..., 3] > 40, s

# ------------------------------------------------------------------ classificatie
def eye_geometry(a, alpha, legacy, scale=1.0):
    """zoek de ogen (bruine iris bij de verwachte plek) en de mond"""
    h, s, v = hsv(a)
    H, W = v.shape
    yy, xx = np.mgrid[0:H, 0:W]
    prior_y = NECK - (57 if legacy else 75)
    eyes = []
    # de iris is bruin en komt verder nergens in het venster voor: zwaartepunt van de bruine pixels
    iris = (h >= 8) & (h <= 45) & (s > 0.45) & (v > 0.15) & (v < 0.75)
    for px in (168, 232):
        win = alpha & (np.abs(xx - px) < 34) & (np.abs(yy - prior_y) < 34)
        m = win & iris
        if m.sum() < 20:
            m = win & (v < 0.2)
        if m.sum() < 10:
            eyes.append((px, prior_y)); continue
        cy, cx = ndimage.center_of_mass(m)
        eyes.append((float(cx), float(cy)))
    # irisstraal is vast per bron (gemeten), geschaald mee met het hoofd
    r = int(round((12 if legacy else 15) * scale)) + 1
    ey = np.mean([e[1] for e in eyes])
    # mond: roodachtige pixels onder de ogen, rond het midden
    mouthzone = alpha & (yy > ey + r + 8) & (yy < NECK - 4) & (np.abs(xx - 200) < 34)
    red = mouthzone & ((h < 22) | (h > 340)) & (s > 0.42) & (v > 0.45)
    if red.sum() > 6:
        my, mx = ndimage.center_of_mass(red)
    else:
        my, mx = ey + r + 26, 200
    return eyes, r, (float(mx), float(my))

def classify_head(a, alpha, legacy, scale=1.0):
    h, s, v = hsv(a)
    H, W = v.shape
    yy, xx = np.mgrid[0:H, 0:W]
    eyes, r_iris, mouth = eye_geometry(a, alpha, legacy, scale)
    d = np.minimum(*[np.hypot(xx - ex, yy - ey) for ex, ey in eyes])
    in_iris = d <= r_iris
    in_eye = d <= r_iris + 8
    mouthbox = (np.abs(xx - mouth[0]) < 24) & (np.abs(yy - mouth[1]) < 13)
    hair = hairtest(a); skin = skintest(a); white = (s < 0.14) & (v > 0.8)
    above = alpha & (yy < NECK)
    below = alpha & (yy >= NECK) & (yy < NECK + 110)
    cls = np.zeros((H, W), dtype=np.uint8)   # 0 niets, 1 haar, 2 huid, 3 oog, 4 vast
    # boven de nek
    # iris: bruine pixels binnen de oogcirkel; pupil/wimpers/oogwit blijven vast, huid blijft huid
    irisish = (s > 0.3) & (v >= 0.17) & (v < 0.8) & (h >= 5) & (h <= 50)
    m = above & in_iris
    cls[m & irisish] = 3; cls[m & ~irisish & (v < 0.17)] = 4; cls[m & ~irisish & (v >= 0.17) & white] = 4
    cls[m & ~irisish & (v >= 0.17) & ~white & skin] = 2; cls[m & ~irisish & (v >= 0.17) & ~white & ~skin] = 4
    m = above & in_eye & ~in_iris
    cls[m & (v < 0.35)] = 4; cls[m & (v >= 0.35) & white] = 4
    cls[m & (v >= 0.35) & ~white & ~hair] = 2; cls[m & (v >= 0.35) & ~white & hair] = 1
    m = above & mouthbox & ~in_eye
    mouthline = (v < 0.5) | white
    cls[m & mouthline] = 4; cls[m & ~mouthline] = 2
    m = above & ~in_eye & ~mouthbox
    cls[m & hair] = 1; cls[m & ~hair & skin] = 2; cls[m & ~hair & ~skin] = 4
    # onder de nek: alleen haar
    cls[below & hair] = 1
    low = (cls == 1) & (yy >= NECK - 8)
    return cls, low, {'eyes': [[round(x, 1), round(y, 1)] for x, y in eyes], 'iris': r_iris, 'mouth': [round(mouth[0], 1), round(mouth[1], 1)]}

def classify_clothes(a, alpha, role, k):
    """role: top | bottom | jacket | shoes | dress ; k = variant"""
    H, W = alpha.shape
    yy, xx = np.mgrid[0:H, 0:W]
    pk, bl, gr, hair, skin, wh = pink(a), blue(a), green(a), hairtest(a), skintest(a), whitish(a)
    h, s, v = hsv(a)
    detail = ((s < 0.25) & (v > 0.5)) | (v < 0.35)              # wit/grijs of donker: blijft in kleur
    pinkish = ((h > 300) | (h < 25)) & (s > 0.2) & ~skin          # roze randjes van de bron
    waist = NECK + 65
    cls = np.zeros((H, W), dtype=np.uint8)  # 1 stof, 2 huid, 4 vast
    if role == 'top':
        zone = alpha & (yy >= NECK - 12) & (yy < waist + 3) & ~(hair & (yy < NECK + 30)) & ~(bl & (yy > waist - 12))
        cls[zone & (pk | pinkish)] = 1; cls[zone & ~pk & ~pinkish & skin] = 2; cls[zone & ~pk & ~pinkish & ~skin & detail] = 4
    elif role == 'bottom':
        legs = np.abs(xx - 200) < 52          # handen aan de zijkant horen bij de top-laag
        shoezone = yy > FEET - 45             # daar zitten de schoenen, die komen uit de schoenlaag
        zone = alpha & (yy >= waist - 6) & ~pk
        cls[zone & bl] = 1
        cls[zone & ~bl & skin & legs] = 2
        cls[zone & ~bl & ~skin & ~pinkish & ~shoezone & detail] = 4
    elif role == 'jacket':
        j = k  # 1 spijkerjasje, 2 vest, 3 lange jas
        opening = (yy >= NECK + 61) & (np.abs(xx - 200) < 28 + np.maximum(0, yy - (NECK + 65)) * (0.15 if j == 3 else 0))
        region = (yy >= NECK - 12) & (yy < NECK + (132 if j == 3 else 84)) & ~opening
        hand = skin & (np.abs(xx - 200) > 55) & (yy >= NECK + 43) & (yy < NECK + 110)
        cls[alpha & region & bl] = 1; cls[alpha & hand] = 2
    elif role == 'shoes':
        start = FEET - {0: 39, 1: 59, 2: 65, 3: 39}[k]
        zone = alpha & (yy >= start) & ~bl
        cls[zone & (pk | pinkish)] = 1; cls[zone & ~pk & ~pinkish & wh] = 4; cls[zone & ~pk & ~pinkish & ~wh & ~skin & ~hair & detail] = 4
    elif role == 'dress':
        zone = alpha & (yy >= NECK - 12) & ~(hair & (yy < NECK + 30)) & ~(pk & (yy > FEET - 45))
        cls[zone & (pk | pinkish)] = 1; cls[zone & ~pk & ~pinkish & skin] = 2; cls[zone & ~pk & ~pinkish & ~skin & ~hair & detail] = 4
    return cls

# ------------------------------------------------------------------ lagen maken
def gray_layer(a, mask, target=228, pct=95, outside=None):
    """grijze, genormaliseerde laag (RGBA) van de gemaskerde pixels"""
    L = lum(a)
    if mask.sum() == 0:
        return None
    p = np.percentile(L[mask], pct)
    g = np.clip(L * (target / max(p, 1)), 0, 255).astype(np.uint8)
    rgba = np.zeros((FRAME, FRAME, 4), dtype=np.uint8)
    rgba[..., 0] = rgba[..., 1] = rgba[..., 2] = np.where(mask, g, 200)
    rgba[..., 3] = np.where(mask, 255, 0)
    return soften(rgba, outside)

def color_layer(a, mask, outside=None):
    if mask.sum() == 0:
        return None
    rgba = np.zeros((FRAME, FRAME, 4), dtype=np.uint8)
    med = np.median(a[mask], axis=0).astype(np.uint8)
    for i in range(3):
        rgba[..., i] = np.where(mask, a[..., i], med[i])
    rgba[..., 3] = np.where(mask, 255, 0)
    return soften(rgba, outside)

def soften(rgba, outside=None):
    """randjes ontrafelen: alleen langs de buitenkant van de hele sprite (waar de witte achtergrond zat)
    gaat de buitenste pixelrand weg; de rand daarna krijgt de kleur van verder naar binnen en wordt
    half doorzichtig. Grenzen tussen lagen (haar/huid, huid/kleding) blijven precies op elkaar aansluiten."""
    al = rgba[..., 3] > 0
    if outside is None or al.sum() < 40:
        return rgba
    ring1 = al & ndimage.binary_dilation(outside, iterations=1)
    ring2 = al & ~ring1 & ndimage.binary_dilation(ring1, iterations=1)
    core = al & ~ring1 & ~ring2
    if core.sum() < 20:
        return rgba
    out = rgba.copy()
    idx = ndimage.distance_transform_edt(~core, return_distances=False, return_indices=True)
    for i in range(3):
        ch = out[..., i]
        out[..., i] = np.where(ring2, ch[idx[0], idx[1]], ch)
    out[..., 3] = np.where(ring1, 0, np.where(ring2, 175, out[..., 3]))
    return out

def bbox(rgba):
    al = rgba[..., 3] > 0
    ys = np.where(al.any(1))[0]; xs = np.where(al.any(0))[0]
    if not len(ys): return None
    return int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1

# ------------------------------------------------------------------ atlas
class Atlas:
    def __init__(self):
        self.items = []   # (name, image, ox, oy)
    def add(self, name, rgba):
        if rgba is None: return
        b = bbox(rgba)
        if not b: return
        x0, y0, x1, y1 = b
        self.items.append((name, Image.fromarray(rgba[y0:y1, x0:x1]), x0, y0))
    def pack(self):
        # simpele plankjes-packer, hoogste eerst
        items = sorted(self.items, key=lambda t: -t[1].height)
        x = y = shelf = 0
        placed = {}
        for name, im, ox, oy in items:
            w, h = im.size
            if x + w > ATLAS_W:
                x = 0; y += shelf + 1; shelf = 0
            placed[name] = (x, y, w, h, ox, oy)
            x += w + 1; shelf = max(shelf, h)
        H = y + shelf
        atlas = Image.new('RGBA', (ATLAS_W, H), (0, 0, 0, 0))
        for name, im, ox, oy in items:
            px, py, w, h, _, _ = placed[name]
            atlas.paste(im, (px, py))
        return atlas, placed

# ------------------------------------------------------------------ hoofdprogramma: poppetje
def build_doll(src, preview_dir=None):
    legacy_img = Image.open(os.path.join(src, 'avatars.png')).convert('RGB')
    hair_img = Image.open(os.path.join(src, 'hair-16.png')).convert('RGB')
    clothes_img = Image.open(os.path.join(src, 'clothes.png')).convert('RGB')
    atlas = Atlas()
    manifest = {'layers': {}, 'heads': [], 'frame': FRAME, 'neck': NECK, 'feet': FEET}
    debug = []
    store = {}
    def keep(name, im):
        store[name] = im; atlas.add(name, im)

    # 20 hoofden: 4 uit avatars.png, 16 uit hair-16.png
    heads = [(cell_legacy(legacy_img, i), True) for i in range(4)] + [(cell_grid(hair_img, i), False) for i in range(16)]
    for hi, (rgb, legacy) in enumerate(heads):
        alpha = remove_bg(rgb, legacy)
        neck = find_neck(rgb, alpha)
        a, al, s = normalize(rgb, alpha, neck, None, 'head')
        cls, low, geo = classify_head(a, al, legacy, s)
        o = ~al; hair = gray_layer(a, cls == 1, 232, outside=o); skin = gray_layer(a, cls == 2, 236, outside=o); eye = gray_layer(a, cls == 3, 210, 90, outside=o)
        keep_l = color_layer(a, cls == 4, outside=o); lowl = gray_layer(a, low, 232, outside=o) if low.any() else None
        # de lage haarlaag moet dezelfde grijswaarden hebben als de haarlaag
        if lowl is not None and hair is not None:
            lowl[..., :3] = hair[..., :3]
        for nm, im in (('hair', hair), ('skin', skin), ('eye', eye), ('keep', keep_l), ('low', lowl)):
            keep(f'H{hi}_{nm}', im)
        hb = bbox(np.dstack([a, (cls > 0) * 255]).astype(np.uint8))
        fb = bbox(np.dstack([a, ((cls == 2) | (cls == 3) | (cls == 4)) * 255]).astype(np.uint8))
        ys = np.where(al.any(1))[0]
        geo.update({'top': int(ys.min()), 'box': list(hb), 'face': list(fb), 'legacy': legacy})
        manifest['heads'].append(geo)
        debug.append(('H%d' % hi, a, cls))
        print(f'hoofd {hi}: nek {neck} schaal {s:.2f} ogen {geo["eyes"]} iris {geo["iris"]} mond {geo["mouth"]}')

    # kleding uit clothes.png
    cells = [cell_grid(clothes_img, i) for i in range(16)]
    norm = []
    for i, rgb in enumerate(cells):
        alpha = restore_soles(rgb, remove_bg(rgb, False))
        feet, top = find_feet_top(rgb, alpha)
        a, al, s = normalize(rgb, alpha, 179, feet, 'clothes')
        norm.append((a, al))
    roles = [('T', 'top', i, i) for i in range(4)] + [('B', 'bottom', i + 4, i) for i in range(8)] + \
            [('J', 'jacket', 11 + j, j) for j in (1, 2, 3)] + [('S', 'shoes', 12 + k, k) for k in range(4)]
    for prefix, role, idx, k in roles:
        a, al = norm[idx]
        cls = classify_clothes(a, al, role, k)
        o = ~al; fab = gray_layer(a, cls == 1, 228, outside=o); skin = gray_layer(a, cls == 2, 236, outside=o); keep_l = color_layer(a, cls == 4, outside=o)
        for nm, im in (('fab', fab), ('skin', skin), ('keep', keep_l)):
            keep(f'{prefix}{k}_{nm}', im)
        debug.append((f'{prefix}{k}', a, cls))
    # jurk uit avatars.png (eerste pop)
    rgb = heads[0][0]
    alpha = remove_bg(rgb, True)
    neck = find_neck(rgb, alpha); feet, top = find_feet_top(rgb, alpha)
    a, al, s = normalize(rgb, alpha, neck, feet, 'clothes')
    cls = classify_clothes(a, al, 'dress', 0)
    for nm, im in (('fab', gray_layer(a, cls == 1, 228, outside=~al)), ('skin', gray_layer(a, cls == 2, 236, outside=~al)), ('keep', color_layer(a, cls == 4, outside=~al))):
        keep(f'D_{nm}', im)
    debug.append(('D', a, cls))

    img, placed = atlas.pack()
    os.makedirs(OUT, exist_ok=True)
    img.save(os.path.join(OUT, 'doll.png'), optimize=True)
    manifest['layers'] = {k: list(v) for k, v in placed.items()}
    print('atlas', img.size, len(placed), 'lagen')
    if preview_dir:
        write_debug(debug, preview_dir)
        write_preview(store, manifest['heads'], preview_dir)
    return manifest

def tint(layer, color):
    """simuleert de 'multiply' van het spel: grijswaarde x kleur"""
    out = layer.astype(np.float32).copy()
    for i in range(3):
        out[..., i] = out[..., i] / 255.0 * color[i]
    return out.astype(np.uint8)

def over(dst, layer):
    if layer is None: return dst
    a = layer[..., 3:4].astype(np.float32) / 255.0
    dst[..., :3] = (layer[..., :3] * a + dst[..., :3] * (1 - a)).astype(np.uint8)
    dst[..., 3] = np.maximum(dst[..., 3], layer[..., 3])
    return dst

def write_preview(store, heads, d):
    """stelt een paar poppetjes samen zoals het spel dat doet, om de lagen te controleren"""
    hex2 = lambda h: tuple(int(h[i:i + 2], 16) for i in (1, 3, 5))
    skins = ['#fde7d2', '#f6d3b3', '#e5b08a', '#c98a5e', '#9c6540', '#6b4429']
    hairs = ['#f2d27a', '#b8834a', '#8a5a2b', '#23202a', '#c9562b', '#ff7bc0', '#4fa3ff', '#5fd7a8']
    eyes = ['#5b3a1e', '#2f6fbf', '#3f9a55', '#7a7f8a', '#b0782f', '#7d4fc2']
    outfits = [('D', None, None, 'S3', '#ff8fcf'), ('T0', 'B0', None, 'S0', '#e63946'), ('T1', 'B4', None, 'S3', '#3a86ff'),
               ('T2', 'B1', 'J1', 'S1', '#ffd23f'), ('T3', 'B6', 'J3', 'S2', '#3fbf63'), ('T0', 'B3', 'J2', 'S0', '#8e5bd9')]
    n = len(heads); cols = 10; rows = math.ceil(n / cols)
    sheet = Image.new('RGB', (cols * 200, rows * 200), (250, 245, 255))
    for hi in range(n):
        o = outfits[hi % len(outfits)]
        skin = hex2(skins[hi % 6]); hair = hex2(hairs[hi % 8]); eye = hex2(eyes[hi % 6]); col = hex2(o[4])
        img = np.zeros((FRAME, FRAME, 4), dtype=np.uint8)
        g = lambda k: store.get(k)
        # hoofd (boven de nek)
        for nm, c in (('skin', skin), ('eye', eye)):
            L = g(f'H{hi}_{nm}');
            if L is not None: over(img, np.dstack([tint(L[..., :3], c), L[..., 3]]))
        over(img, g(f'H{hi}_keep'))
        L = g(f'H{hi}_hair'); over(img, np.dstack([tint(L[..., :3], hair), L[..., 3]]))
        # kleding
        parts = [(o[1], col if o[1] else None), (o[3], col), (o[0], col), (o[2], hex2('#3d6db5'))]
        for key, c in parts:
            if not key: continue
            for nm, cc in (('skin', skin), ('fab', c)):
                L = g(f'{key}_{nm}')
                if L is not None: over(img, np.dstack([tint(L[..., :3], cc), L[..., 3]]))
            over(img, g(f'{key}_keep'))
        L = g(f'H{hi}_low')
        if L is not None: over(img, np.dstack([tint(L[..., :3], hair), L[..., 3]]))
        im = Image.fromarray(img).resize((200, 200), Image.LANCZOS)
        bg = Image.new('RGB', (200, 200), (250, 245, 255)); bg.paste(im, (0, 0), im)
        sheet.paste(bg, ((hi % cols) * 200, (hi // cols) * 200))
    sheet.save(os.path.join(d, 'preview.png'))
    big = Image.new('RGB', (4 * 400, 400), (250, 245, 255))
    for j, hi in enumerate((0, 5, 12, 16)):
        big.paste(sheet.crop(((hi % cols) * 200, (hi // cols) * 200, (hi % cols) * 200 + 200, (hi // cols) * 200 + 200)).resize((400, 400), Image.LANCZOS), (j * 400, 0))
    big.save(os.path.join(d, 'preview-big.png'))

def write_debug(debug, d):
    os.makedirs(d, exist_ok=True)
    cols = 8; n = len(debug); rows = math.ceil(n / cols)
    sheet = Image.new('RGB', (cols * 200, rows * 200), (60, 60, 60))
    palette = {0: (0, 0, 0), 1: (255, 200, 60), 2: (240, 120, 200), 3: (60, 160, 255), 4: (255, 255, 255)}
    for i, (name, a, cls) in enumerate(debug):
        vis = np.zeros((FRAME, FRAME, 3), dtype=np.uint8)
        for c, col in palette.items(): vis[cls == c] = col
        im = Image.fromarray(vis).resize((200, 200))
        ImageDraw.Draw(im).text((4, 4), name, fill=(255, 0, 0))
        sheet.paste(im, ((i % cols) * 200, (i // cols) * 200))
    sheet.save(os.path.join(d, 'classes.png'))


# ------------------------------------------------------------------ wereld: dorpskaart, loopraster, decors
GRID_W, GRID_H = 96, 64      # loopraster over de dorpskaart (1536x1024 / 16)
# waar je voor de deur van een huisje staat (procenten van de kaart) en vanaf welk padpunt je erheen loopt
DOORS = {
    'kleedkamer': {'x': 24.5, 'y': 26.5, 'from': [24.5, 31]},
    'winkel':     {'x': 73.5, 'y': 27.0, 'from': [73.5, 31]},
    'puzzel':     {'x': 22.0, 'y': 79.5, 'from': [22.0, 84]},
    'duel':       {'x': 74.0, 'y': 79.0, 'from': [74.0, 84]},
}

def path_mask(im):
    a = np.asarray(im)
    h, s, v = hsv(a)
    path = (h > 18) & (h < 40) & (s > 0.3) & (s < 0.7) & (v > 0.75)
    m = ndimage.binary_closing(path, iterations=6)
    m = ndimage.binary_opening(m, iterations=5)
    lab, n = ndimage.label(m)
    sizes = ndimage.sum(m, lab, range(1, n + 1))
    return np.isin(lab, [i + 1 for i, sz in enumerate(sizes) if sz > 20000])

def build_world(src, preview_dir=None):
    im = Image.open(os.path.join(src, 'village.png')).convert('RGB')
    W, H = im.size
    im.save(os.path.join(OUT, 'village.jpg'), quality=82, optimize=True, progressive=True)
    mask = path_mask(im)
    cw, ch = W / GRID_W, H / GRID_H
    grid = np.zeros((GRID_H, GRID_W), bool)
    for y in range(GRID_H):
        for x in range(GRID_W):
            grid[y, x] = mask[int(y * ch):int((y + 1) * ch), int(x * cw):int((x + 1) * cw)].mean() > 0.3
    # looppaadjes naar de deuren
    for d in DOORS.values():
        x0, y0 = d['from']; x1, y1 = d['x'], d['y']
        for t in np.linspace(0, 1, 12):
            gx = int((x0 + (x1 - x0) * t) / 100 * GRID_W); gy = int((y0 + (y1 - y0) * t) / 100 * GRID_H)
            grid[max(0, gy - 1):gy + 2, max(0, gx - 1):gx + 2] = True
    rows = [''.join('1' if c else '0' for c in row) for row in grid]
    if preview_dir:
        dbg = im.copy(); dr = ImageDraw.Draw(dbg, 'RGBA')
        for y in range(GRID_H):
            for x in range(GRID_W):
                if grid[y, x]: dr.rectangle([x * cw, y * ch, (x + 1) * cw - 1, (y + 1) * ch - 1], fill=(255, 0, 0, 90))
        for k, d in DOORS.items():
            dr.ellipse([d['x'] / 100 * W - 10, d['y'] / 100 * H - 10, d['x'] / 100 * W + 10, d['y'] / 100 * H + 10], fill=(0, 0, 255, 200))
        dbg.save(os.path.join(preview_dir, 'village-walk.png'))
    return {'w': GRID_W, 'h': GRID_H, 'rows': rows, 'doors': DOORS}

# decors: (bron, uitsnede in bronpixels x0,y0,x1,y1 met verhouding 2:3)
BG_W, BG_H = 480, 720
BACKDROPS = {
    'kamer':       ('bedroom.png',      (400, 0, 1083, 1024)),
    'feestkamer':  ('bedroom.png',      (640, 0, 1323, 1024)),
    'kerst':       ('bedroom.png',      (0, 0, 683, 1024)),
    'park':        ('village.png',      (0, 300, 480, 1020)),
    'kasteeltuin': ('village.png',      (200, 0, 680, 720)),
    'manege':      ('village.png',      (1056, 300, 1536, 1020)),
    'bos':         ('village.png',      (960, 0, 1536, 864)),
    'spookhuis':   ('village.png',      (860, 304, 1340, 1024)),
    'sportveld':   ('neighborhood.png', (528, 300, 1008, 1020)),
    'stad':        ('neighborhood.png', (0, 0, 683, 1024)),
    'regen':       ('neighborhood.png', (853, 0, 1536, 1024)),
    'strand':      ('island.png',       (560, 0, 1200, 960)),
    'zwembad':     ('island.png',       (1000, 60, 1536, 864)),
}

def build_backdrops(src, preview_dir=None):
    os.makedirs(os.path.join(OUT, 'bg'), exist_ok=True)
    cache = {}
    sheet = Image.new('RGB', (len(BACKDROPS) * 160, 240), (255, 255, 255))
    for i, (name, (file, box)) in enumerate(BACKDROPS.items()):
        if file not in cache: cache[file] = Image.open(os.path.join(src, file)).convert('RGB')
        im = cache[file]
        x0, y0, x1, y1 = box
        # verhouding netjes 2:3 maken rond het midden van de opgegeven uitsnede
        w = x1 - x0; h = y1 - y0
        if w / h > BG_W / BG_H: w = int(h * BG_W / BG_H)
        else: h = int(w * BG_H / BG_W)
        cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
        x0, y0 = int(max(0, min(im.width - w, cx - w / 2))), int(max(0, min(im.height - h, cy - h / 2)))
        crop = im.crop((x0, y0, x0 + w, y0 + h)).resize((BG_W, BG_H), Image.LANCZOS)
        crop = crop.filter(ImageFilter.GaussianBlur(0.8))
        crop.save(os.path.join(OUT, 'bg', name + '.jpg'), quality=80, optimize=True, progressive=True)
        sheet.paste(crop.resize((160, 240)), (i * 160, 0))
    if preview_dir:
        sheet.save(os.path.join(preview_dir, 'backdrops.png'))
    return list(BACKDROPS.keys())

if __name__ == '__main__':
    src = sys.argv[1]
    prev = sys.argv[sys.argv.index('--preview') + 1] if '--preview' in sys.argv else None
    m = build_doll(src, prev)
    m['world'] = build_world(src, prev)
    m['backdrops'] = build_backdrops(src, prev)
    with open(os.path.join(OUT, 'doll-manifest.js'), 'w', encoding='utf-8') as f:
        f.write('// Gegenereerd door tools/build-assets.py. Niet met de hand bewerken.\n')
        f.write('const DOLL_MANIFEST = ' + json.dumps(m, separators=(',', ':')) + ';\n')
