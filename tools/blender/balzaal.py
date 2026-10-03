"""
Catwalk Sterren - decor 'balzaal' gebouwd in Blender (zie lib.py voor gebruik).

Hoort bij Het Grote Gala (rode loper), Prinsessenbal en Koninklijke Kroning.
Compositie: het model staat op de rode loper in een marmeren balzaal; achter haar
een grote trap met een gouden kroon erboven, kroonluchter bovenin, zuilen en
fluwelen gordijnen aan de zijkanten, boogramen met een sterrenhemel.
"""
import math, os, random, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lib import begin, hexcol, mat, box, cyl, cone, sphere, torus, star, heart, sky, light, camera, render

import bmesh, bpy

scene, OUT = begin('Balzaal')
random.seed(11)

# ------------------------------------------------------------------ materialen
WALL    = lambda: mat('wall',    '#efd9ff', 0.6, emit='#f3e2ff', strength=0.12)
PANEL   = lambda: mat('panel',   '#e9cffc', 0.6)
MARBLE  = lambda: mat('marble',  '#fff8fb', 0.25, coat=0.6, sss=0.2)
GOLD    = lambda: mat('gold',    '#ffcf55', 0.25, metal=0.6, emit='#ffc94a', strength=0.35, coat=0.4)
CARPET  = lambda: mat('carpet',  '#e8336d', 0.85)
VELVET  = lambda: mat('velvet',  '#a557e8', 0.7, sss=0.15)
VELVET2 = lambda: mat('velvet2', '#8b3fd6', 0.7)
NIGHT   = lambda: mat('night',   '#3d4fc9', 0.4, emit='#5a6be0', strength=0.9)
STARL   = lambda: mat('starl',   '#ffffff', 0.4, emit='#fff6c8', strength=4.0)
FLAME   = lambda: mat('flame',   '#ffe08a', 0.4, emit='#ffc04d', strength=6.0)
CANDLE  = lambda: mat('candle',  '#fffaf0', 0.5, sss=0.3)
CRYSTAL = lambda: mat('crystal', '#e8f6ff', 0.05, emit='#d9f0ff', strength=1.2, coat=1.0, trans=0.6)
ROSE    = lambda: mat('rose',    '#ff6fae', 0.6)
ROSE2   = lambda: mat('rose2',   '#ffb3d1', 0.6)
LEAF    = lambda: mat('leaf',    '#4fae7a', 0.6)
JEWEL_R = lambda: mat('jewelr',  '#ff4d8d', 0.1, emit='#ff4d8d', strength=1.5, coat=1.0)
JEWEL_B = lambda: mat('jewelb',  '#5aaeff', 0.1, emit='#5aaeff', strength=1.5, coat=1.0)
SPARK   = lambda: mat('spark',   '#fff3b0', 0.4, emit='#ffe9a0', strength=3.0)


def checker(name, c1, c2, scale):
    """Glanzende marmervloer met ruitjespatroon."""
    m = mat(name, c1, 0.18, coat=0.9)
    nt = m.node_tree; b = nt.nodes['Principled BSDF']
    tc = nt.nodes.new('ShaderNodeTexCoord'); ch = nt.nodes.new('ShaderNodeTexChecker')
    ch.inputs['Scale'].default_value = scale
    ch.inputs['Color1'].default_value = hexcol(c1); ch.inputs['Color2'].default_value = hexcol(c2)
    nt.links.new(tc.outputs['Object'], ch.inputs['Vector']); nt.links.new(ch.outputs['Color'], b.inputs['Base Color'])
    return m


# ------------------------------------------------------------------ vormen
def column(x, y, h=7.2, r=0.42):
    cyl((x, y, 0.25), r * 1.45, 0.5, GOLD(), 48, 0.06)            # voet
    torus((x, y, 0.55), r * 1.08, r * 0.18, GOLD())
    c = cyl((x, y, h / 2), r, h, MARBLE(), 24, 0.0)
    for i in range(12):                                          # cannelures
        a = i / 12 * math.tau
        cyl((x + math.cos(a) * r * 0.98, y + math.sin(a) * r * 0.98, h / 2), r * 0.08, h - 1.0, PANEL(), 12, 0)
    torus((x, y, h - 0.45), r * 1.08, r * 0.18, GOLD())
    cyl((x, y, h - 0.15), r * 1.5, 0.35, GOLD(), 48, 0.08)        # kapiteel
    box((x, y, h + 0.15), (r * 3.4, r * 3.4, 0.3), GOLD(), 0.06)
    return c


def curtain(x0, x1, y, z0, z1, m, folds=7, depth=0.28):
    """Gordijn als golvend vlak (plooien) tussen x0..x1, van z0 tot z1."""
    me = bpy.data.meshes.new('curtain'); o = bpy.data.objects.new('curtain', me)
    bpy.context.collection.objects.link(o)
    bm = bmesh.new(); nx, nz = 64, 24; grid = []
    for j in range(nz + 1):
        row = []
        for i in range(nx + 1):
            t = i / nx; v = j / nz
            # onderaan wat bij elkaar getrokken richting de buitenkant (open gordijn)
            pinch = 1.0 - 0.35 * (1 - v) ** 2
            x = x0 + (x1 - x0) * t * pinch if x0 < 0 else x1 - (x1 - x0) * (1 - t) * pinch
            yy = y + math.sin(t * folds * math.tau) * depth
            row.append(bm.verts.new((x, yy, z0 + (z1 - z0) * v)))
        grid.append(row)
    for j in range(nz):
        for i in range(nx):
            bm.faces.new((grid[j][i], grid[j][i + 1], grid[j + 1][i + 1], grid[j + 1][i]))
    bm.to_mesh(me); bm.free()
    mod = o.modifiers.new('dik', 'SOLIDIFY'); mod.thickness = 0.06
    o.data.materials.append(m)
    for p in o.data.polygons:
        p.use_smooth = True
    return o


def arch_window(x, y, z, w, h):
    """Hoog boograam met sterrenhemel en gouden lijst."""
    box((x, y, z + h / 2), (w, 0.1, h), NIGHT(), 0.02)
    c = cyl((x, y, z + h), w / 2, 0.1, NIGHT(), 48, 0); c.rotation_euler = (math.pi / 2, 0, 0)
    # lijst
    for dx in (-w / 2, w / 2):
        box((x + dx, y - 0.06, z + h / 2), (0.14, 0.16, h), GOLD(), 0.03)
    torus((x, y - 0.06, z + h), w / 2, 0.07, GOLD()).rotation_euler = (math.pi / 2, 0, 0)
    box((x, y - 0.06, z + h * 0.55), (w, 0.12, 0.08), GOLD(), 0.02)   # roede
    box((x, y - 0.06, z + h / 2), (0.08, 0.12, h), GOLD(), 0.02)
    box((x, y - 0.12, z - 0.08), (w + 0.4, 0.3, 0.16), GOLD(), 0.04)  # vensterbank
    # sterretjes in de nachtlucht
    for _ in range(9):
        sx = x + random.uniform(-w / 2 + 0.15, w / 2 - 0.15); sz = z + random.uniform(h * 0.15, h * 1.15)
        if sz > z + h and abs(sx - x) > (w / 2) * math.sqrt(max(0, 1 - ((sz - z - h) / (w / 2)) ** 2)) - 0.1:
            continue
        sphere((sx, y - 0.07, sz), random.uniform(0.025, 0.05), STARL())
    star((x + w * 0.22, y - 0.08, z + h * 0.95), 0.1, STARL())


def chandelier(x, y, z):
    cyl((x, y, z + 2.2), 0.03, 4.0, GOLD(), 12, 0)                   # ketting naar het plafond
    sphere((x, y, z + 0.35), 0.28, GOLD())
    cone((x, y, z - 0.2), 0.22, 0.0, 0.6, GOLD(), 32)
    sphere((x, y, z - 0.55), 0.12, CRYSTAL())
    for ring, (rr, zz, n) in enumerate([(1.45, 0.0, 12), (0.95, 0.75, 8)]):
        torus((x, y, z + zz), rr, 0.06, GOLD())
        for i in range(n):
            a = i / n * math.tau + ring * 0.2
            px, py = x + math.cos(a) * rr, y + math.sin(a) * rr
            cyl((px, py, z + zz + 0.1), 0.09, 0.1, GOLD(), 16, 0)
            cyl((px, py, z + zz + 0.3), 0.05, 0.32, CANDLE(), 12, 0)
            sphere((px, py, z + zz + 0.52), 0.055, FLAME(), (1, 1, 1.5))
            # kristallen druppels
            for k, dz in enumerate((-0.18, -0.36)):
                sphere((px, py, z + zz + dz), 0.05 - k * 0.012, CRYSTAL(), (1, 1, 1.4))
    # slingers van kristal tussen de ringen
    for i in range(24):
        a = i / 24 * math.tau
        sphere((x + math.cos(a) * 1.2, y + math.sin(a) * 1.2, z - 0.28 - 0.08 * math.sin(i * 1.7)), 0.035, CRYSTAL())
    light(scene, 'POINT', 'kroonluchter', 900, (1.0, 0.82, 0.55), (x, y, z + 0.2), size=1.2)


def crown(x, y, z, s):
    """Gouden kroon met juwelen (boven de trap)."""
    cyl((x, y, z), 1.0 * s, 0.5 * s, GOLD(), 48, 0.04)
    torus((x, y, z - 0.25 * s), 1.02 * s, 0.07 * s, GOLD())
    for i in range(5):
        a = math.pi / 2 + (i - 2) * 0.55 - math.pi
        px, py = x + math.cos(a) * s, y + math.sin(a) * s
        cone((px, py, z + 0.65 * s), 0.28 * s, 0.0, 0.85 * s, GOLD(), 24)
        sphere((px, py, z + 1.12 * s), 0.12 * s, GOLD())
    for i, m in enumerate([JEWEL_B(), JEWEL_R(), JEWEL_B()]):
        sphere((x + (i - 1) * 0.55 * s, y - 0.98 * s, z), 0.14 * s, m, (1, 0.5, 1))


def urn(x, y, s=1.0):
    """Gouden vaas met roze rozen."""
    cyl((x, y, 0.12 * s), 0.32 * s, 0.24 * s, GOLD(), 32, 0.03)
    cone((x, y, 0.5 * s), 0.12 * s, 0.45 * s, 0.55 * s, GOLD(), 32, 0.03)
    torus((x, y, 0.78 * s), 0.42 * s, 0.05 * s, GOLD())
    for i in range(14):
        a = random.random() * math.tau; rr = random.uniform(0, 0.38) * s
        sphere((x + math.cos(a) * rr, y + math.sin(a) * rr, (0.95 + random.uniform(0, 0.35)) * s),
               random.uniform(0.13, 0.18) * s, random.choice([ROSE(), ROSE(), ROSE2()]))
    for i in range(6):
        a = i / 6 * math.tau
        sphere((x + math.cos(a) * 0.42 * s, y + math.sin(a) * 0.42 * s, 0.86 * s), 0.12 * s, LEAF(), (1.6, 0.8, 0.5))


# ------------------------------------------------------------------ vloer, loper, muren
fl = box((0, 2, -0.05), (40, 40, 0.1), checker('vloer', '#fff4f8', '#f2c9e0', 1.0), 0)
fl.rotation_euler = (0, 0, math.radians(45))

BACK = 9.0
box((0, BACK + 0.3, 6), (40, 0.6, 12), WALL(), 0)                    # achterwand
box((0, 4, 11.0), (40, 20, 0.3), WALL(), 0)                         # plafond
for x in (-8.5, 8.5):
    box((x, 2, 6), (0.6, 22, 12), WALL(), 0)                         # zijwanden
# lambrisering en sierlijsten op de achterwand
box((0, BACK - 0.02, 0.6), (40, 0.12, 1.2), PANEL(), 0.03)
box((0, BACK - 0.1, 1.25), (40, 0.12, 0.1), GOLD(), 0.02)
box((0, BACK - 0.1, 9.6), (40, 0.18, 0.18), GOLD(), 0.03)

# rode loper van voor naar de trap, met gouden randjes
box((0, -1.5, 0.03), (2.4, 21, 0.04), CARPET(), 0.01)
for x in (-1.25, 1.25):
    box((x, -1.5, 0.04), (0.1, 21, 0.05), GOLD(), 0.01)

# ------------------------------------------------------------------ grote trap met kroon
STEP_H, STEP_D, N = 0.32, 0.55, 8
TOP = BACK - 0.5
for i in range(N):
    yf = BACK - 1.0 - (N - i) * STEP_D                                # voorkant van trede i
    zt = STEP_H * (i + 1)
    box((0, (yf + TOP) / 2, zt / 2), (6.2 - i * 0.18, TOP - yf, zt), MARBLE(), 0.03)
    box((0, (yf + TOP) / 2, zt + 0.02), (2.4, TOP - yf, 0.04), CARPET(), 0.01)
    box((0, yf, zt), (2.5, 0.08, 0.06), GOLD(), 0.01)                 # gouden traprand
# overloop
box((0, BACK - 0.5, STEP_H * N / 2), (7.5, 1.2, STEP_H * N), MARBLE(), 0.04)
# leuningen langs de trap
for side in (-1, 1):
    x = side * 3.0
    y0, y1 = BACK - 1.0 - N * STEP_D, BACK - 0.8
    z0, z1 = 1.0, STEP_H * N + 1.0
    n = 9
    for k in range(n):
        t = k / (n - 1)
        yy = y0 + (y1 - y0) * t; zz = z0 + (z1 - z0) * t
        cyl((x, yy, zz - 0.5), 0.05, 1.0, GOLD(), 12, 0)
        sphere((x, yy, zz - 0.95), 0.07, GOLD())
    rail = cyl((x, (y0 + y1) / 2, (z0 + z1) / 2), 0.07, math.hypot(y1 - y0, z1 - z0), GOLD(), 16, 0)
    rail.rotation_euler = (-math.atan2(z1 - z0, y1 - y0) + math.pi / 2, 0, 0)
    cyl((x, y0, 0.6), 0.16, 1.2, GOLD(), 24, 0.03)                   # paal onderaan
    sphere((x, y0, 1.32), 0.2, GOLD())
crown(0, BACK - 0.35, 6.4, 1.15)
# hartjesboog rond de kroon
for i in range(11):
    a = math.pi * (0.12 + 0.76 * i / 10)
    heart((math.cos(a) * 2.6, BACK - 0.2, 5.6 + math.sin(a) * 2.2), 0.22, JEWEL_R() if i % 2 else GOLD())

# ------------------------------------------------------------------ ramen, zuilen, gordijnen
for x in (-5.6, -3.8, 3.8, 5.6):
    arch_window(x, BACK - 0.02, 2.2, 1.3, 4.2)
for x, y in [(-4.6, -1.6), (4.6, -1.6), (-4.6, 3.6), (4.6, 3.6)]:
    column(x, y)
# fluwelen gordijnen vooraan (theaterkader) + strook bovenaan
curtain(-5.0, -1.8, -6.3, -0.1, 8.5, VELVET(), folds=6, depth=0.2)
curtain(1.8, 5.0, -6.3, -0.1, 8.5, VELVET(), folds=6, depth=0.2)
curtain(-6, 6, -6.1, 6.15, 7.6, VELVET2(), folds=14, depth=0.1)
for i in range(49):                                                   # gouden franje
    sphere((-6 + i * 0.25, -6.3, 6.12), 0.05, GOLD(), (1, 1, 1.5))

# ------------------------------------------------------------------ versiering
chandelier(0, 1.2, 8.1)
for x in (-2.6, 2.6):
    urn(x, 4.2, 1.15)
urn(-2.3, -2.6, 1.0)
urn(2.3, -2.6, 1.0)
# gouden glinsteringen in de lucht (niet midden voor het model)
for _ in range(60):
    x = random.choice([-1, 1]) * random.uniform(1.3, 6); y = random.uniform(-3, 8); z = random.uniform(1.5, 9)
    star((x, y, z), random.uniform(0.04, 0.09), SPARK())

# ------------------------------------------------------------------ licht en camera
sky(scene, [(0.0, '#3a2a6a'), (1.0, '#3a2a6a')], strength=0.4)
light(scene, 'AREA', 'voor', 1300, (1.0, 0.9, 0.95), (0, -10, 8), (55, 0, 0), size=10)
light(scene, 'AREA', 'trap', 500, (1.0, 0.85, 0.7), (0, 4, 10.5), (0, 0, 0), size=6)
light(scene, 'POINT', 'raamL', 150, (0.6, 0.65, 1.0), (-4.7, BACK - 1.5, 4.5), size=1.5)
light(scene, 'POINT', 'raamR', 150, (0.6, 0.65, 1.0), (4.7, BACK - 1.5, 4.5), size=1.5)
light(scene, 'SPOT', 'loperspot', 1200, (1.0, 0.88, 0.8), (0, -6, 9.5), (40, 0, 0), size=0.6, spot=(38, 0.6))
camera(scene, (0, -11.5, 3.0), (0, 3.0, 3.6), lens=28)

render(scene, OUT, 'balzaal', exposure=-0.3)
