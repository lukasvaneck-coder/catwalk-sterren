"""
Catwalk Sterren - decor 'ijspaleis' gebouwd in Blender (zie lib.py voor gebruik).

Compositie: een ijsplein onder het model met het poortgebouw erachter, torens en
kristallen aan de zijkanten, sneeuwbergen en een roze-blauwe lucht bovenin.
"""
import math, os, random, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lib import begin, mat, box, cyl, cone, sphere, torus, star as _star, join, sky, light, camera, render

scene, OUT = begin('Ijspaleis')
random.seed(7)

# ------------------------------------------------------------------ materialen
WALL   = lambda: mat('wall',   '#d9eeff', 0.45, emit='#cfe9ff', strength=0.15, sss=0.25)
WALL2  = lambda: mat('wall2',  '#b8dcff', 0.45, emit='#b5dcff', strength=0.12, sss=0.25)
ROOF   = lambda: mat('roof',   '#4f9ff0', 0.3, coat=0.6)
ROOF2  = lambda: mat('roof2',  '#9a7cff', 0.3, coat=0.6)
SNOW   = lambda: mat('snow',   '#eef4ff', 0.75, sss=0.3)
ICE    = lambda: mat('ice',    '#8fdcff', 0.08, emit='#7fd3ff', strength=0.6, coat=1.0, trans=0.5)
ICEP   = lambda: mat('icep',   '#d6b8ff', 0.08, emit='#c9a6ff', strength=0.55, coat=1.0, trans=0.5)
FLOOR  = lambda: mat('floor',  '#b9e4ff', 0.3, coat=0.5)
FLOOR2 = lambda: mat('floor2', '#8fcdf7', 0.3, coat=0.5)
GOLD   = lambda: mat('gold',   '#ffd35a', 0.25, emit='#ffcf4a', strength=1.5)
WINDOW = lambda: mat('window', '#ffd98a', 0.4, emit='#ffc65c', strength=1.1)
DOOR   = lambda: mat('door',   '#5a8fe0', 0.3, coat=0.8, emit='#9cc8ff', strength=0.3)
PINE   = lambda: mat('pine',   '#2f8f86', 0.7)
TRUNK  = lambda: mat('trunk',  '#8a5a3c', 0.8)
MOUNT  = lambda: mat('mount',  '#c9b2f2', 0.9, emit='#e3c8ff', strength=0.3)
POST   = lambda: mat('post',   '#7a86c9', 0.4, coat=0.5)
CARROT = lambda: mat('carrot', '#ff8c42', 0.5)
BLACK  = lambda: mat('coal',   '#2b2440', 0.5)
SCARF  = lambda: mat('scarf',  '#ff5da2', 0.6)

# ------------------------------------------------------------------ vormen
star = lambda loc, s: _star(loc, s, GOLD())

def onion(x, y, z, r, m):
    """Uivormig dakje: bol + puntje, met sneeuwrand en gouden ster."""
    sphere((x, y, z + r * 0.55), r, m, (1, 1, 1.05))
    cone((x, y, z + r * 1.75), r * 0.55, 0.0, r * 1.3, m)
    torus((x, y, z + r * 0.08), r * 0.92, r * 0.16, SNOW())
    star((x, y, z + r * 2.55), r * 0.38)

def tower(x, y, r, h, wall, roof, onion_top=False):
    cyl((x, y, h / 2), r, h, wall)
    torus((x, y, h), r * 1.02, r * 0.12, SNOW())
    # kantelen-ring
    for i in range(10):
        a = i / 10 * math.tau
        box((x + math.cos(a) * r * 0.95, y + math.sin(a) * r * 0.95, h + r * 0.22), (r * 0.32, r * 0.32, r * 0.42), wall, 0.05)
    if onion_top:
        onion(x, y, h + 0.1, r * 0.9, roof)
    else:
        cone((x, y, h + r * 1.35), r * 1.15, 0, r * 2.6, roof)
        torus((x, y, h + 0.12), r * 1.1, r * 0.18, SNOW())
        star((x, y, h + r * 2.95), r * 0.35)
    # raampjes richting camera
    for zz in (h * 0.45, h * 0.72):
        window(x, y - r * 0.98, zz, r * 0.32, r * 0.55)

def window(x, y, z, w, h):
    box((x, y, z), (w, 0.12, h), WINDOW(), 0.05)
    cyl((x, y, z + h / 2), w / 2, 0.12, WINDOW(), 32, 0).rotation_euler = (math.pi / 2, 0, 0)
    box((x, y - 0.03, z - h / 2 - 0.05), (w * 1.35, 0.2, 0.1), SNOW(), 0.04)

def crystal(x, y, z, h, r, m, tilt=(0, 0)):
    """Zeshoekig ijskristal met punt."""
    c = cyl((0, 0, h / 2), r, h, m, verts=6, bevel=0.02)
    t = cone((0, 0, h + r * 0.9), r, 0, r * 1.8, m, verts=6, bevel=0.02)
    for o in (c, t):
        for p in o.data.polygons: p.use_smooth = False
    o = join([c, t])
    o.location = (x, y, z); o.rotation_euler = (tilt[0], tilt[1], random.random() * math.tau)
    return o

def crystal_cluster(x, y, s, m):
    crystal(x, y, -0.1, 1.9 * s, 0.32 * s, m)
    crystal(x + 0.35 * s, y + 0.1, -0.1, 1.2 * s, 0.24 * s, m, (0.0, 0.42))
    crystal(x - 0.4 * s, y + 0.05, -0.1, 1.35 * s, 0.25 * s, m, (0.1, -0.45))
    crystal(x + 0.1 * s, y - 0.35 * s, -0.1, 0.8 * s, 0.2 * s, m, (-0.4, 0.15))

def pine(x, y, s):
    cyl((x, y, 0.3 * s), 0.16 * s, 0.6 * s, TRUNK(), 16)
    for i, (r, z) in enumerate([(1.0, 0.95), (0.8, 1.7), (0.58, 2.35)]):
        cone((x, y, z * s), r * s, 0.05 * s, 1.15 * s, PINE(), 32)
        # sneeuwlaagje op elke laag
        cone((x, y, z * s + 0.38 * s), r * 0.62 * s, 0.04 * s, 0.42 * s, SNOW(), 32)
    sphere((x, y, 2.98 * s), 0.12 * s, SNOW())

def lantern(x, y):
    cyl((x, y, 0.75), 0.07, 1.5, POST(), 16)
    sphere((x, y, 1.62), 0.2, WINDOW())
    cone((x, y, 1.86), 0.24, 0.0, 0.22, POST(), 24)
    sphere((x, y, 1.99), 0.06, GOLD())
    light(scene, 'POINT', 'lamp', 40, (1, 0.82, 0.55), (x, y - 0.1, 1.62), size=0.2)

def snowman(x, y, s):
    sphere((x, y, 0.45 * s), 0.55 * s, SNOW())
    sphere((x, y, 1.15 * s), 0.4 * s, SNOW())
    sphere((x, y, 1.72 * s), 0.3 * s, SNOW())
    torus((x, y, 1.47 * s), 0.27 * s, 0.08 * s, SCARF())
    c = cone((x, y - 0.42 * s, 1.72 * s), 0.06 * s, 0, 0.35 * s, CARROT(), 16); c.rotation_euler = (math.pi / 2, 0, 0)
    for dx in (-0.1, 0.1):
        sphere((x + dx * s, y - 0.27 * s, 1.82 * s), 0.035 * s, BLACK())
    for dz in (1.0, 1.18, 1.36):
        sphere((x, y - 0.4 * s, dz * s), 0.04 * s, BLACK())
    # hoedje
    cyl((x, y, 2.0 * s), 0.22 * s, 0.04 * s, BLACK(), 32)
    cyl((x, y, 2.15 * s), 0.15 * s, 0.28 * s, BLACK(), 32)

def mound(x, y, rx, ry, rz):
    sphere((x, y, 0), 1, SNOW(), (rx, ry, rz))

# ------------------------------------------------------------------ grond en plein
box((0, 10, -0.5), (80, 80, 1.0), SNOW(), 0)
# ijsplein: ring van tegels rond een gladde ijsvloer
cyl((0, -1.2, 0.02), 3.6, 0.08, FLOOR(), 96, 0.03)
torus((0, -1.2, 0.07), 3.62, 0.13, SNOW(), (1, 1, 0.6))
for i in range(28):
    a = i / 28 * math.tau
    cyl((math.cos(a) * 2.85, -1.2 + math.sin(a) * 2.85, 0.07), 0.32, 0.04, FLOOR2(), 6, 0.02)
torus((0, -1.2, 0.07), 1.6, 0.06, FLOOR2(), (1, 1, 0.4))
# pad naar de poort
box((0, 3.2, 0.02), (2.0, 4.0, 0.08), FLOOR(), 0.04)

# ------------------------------------------------------------------ het paleis
PY = 6.0
box((0, PY + 0.6, 1.9), (7.0, 2.6, 3.8), WALL(), 0.15)
# kantelen op de muur
for i in range(13):
    box((-3.3 + i * 0.55, PY - 0.65, 3.95), (0.32, 0.32, 0.4), WALL(), 0.05)
box((0, PY - 0.62, 3.8), (7.1, 0.5, 0.18), SNOW(), 0.08)
# ijspegels onder de sneeuwrand
for i in range(22):
    x = -3.3 + i * 0.315
    if abs(x) < 1.35:
        continue
    cone((x, PY - 0.72, 3.55), 0.07, 0.0, random.uniform(0.25, 0.5), ICE(), 12).rotation_euler = (math.pi, 0, 0)
# middenstuk met grote poort
box((0, PY - 0.2, 2.6), (2.6, 1.6, 5.2), WALL2(), 0.15)
box((0, PY - 1.0, 1.15), (1.5, 0.3, 2.3), DOOR(), 0.1)
cyl((0, PY - 1.0, 2.3), 0.75, 0.3, DOOR(), 48, 0.05).rotation_euler = (math.pi / 2, 0, 0)
torus((0, PY - 1.06, 2.3), 0.86, 0.1, GOLD(), (1, 1, 1)).rotation_euler = (math.pi / 2, 0, 0)
box((0, PY - 1.1, 1.2), (0.08, 0.1, 2.2), GOLD(), 0.02)
window(0, PY - 1.02, 4.2, 0.45, 0.6)
onion(0, PY - 0.2, 5.2, 1.35, ROOF2())
# hoge middentoren erachter
tower(0, PY + 1.6, 1.0, 7.4, WALL(), ROOF())
# zijtorens
tower(-3.9, PY - 0.2, 0.95, 5.2, WALL2(), ROOF())
tower(3.9, PY - 0.2, 0.95, 5.2, WALL2(), ROOF())
tower(-6.4, PY + 1.6, 0.75, 4.0, WALL(), ROOF2(), onion_top=True)
tower(6.4, PY + 1.6, 0.75, 4.0, WALL(), ROOF2(), onion_top=True)
# muurtjes naar de buitentorens
box((-5.2, PY + 0.8, 1.2), (2.4, 0.8, 2.4), WALL(), 0.12)
box((5.2, PY + 0.8, 1.2), (2.4, 0.8, 2.4), WALL(), 0.12)
for x in (-1.9, -2.6, 1.9, 2.6):
    window(x, PY - 0.72, 2.4, 0.35, 0.6)

# ------------------------------------------------------------------ omgeving
# bergen achter het paleis
for x, h, r in [(-14, 9, 7), (-6, 11, 7.5), (3, 12, 8), (12, 10, 7), (20, 8, 6), (-22, 8, 6)]:
    cone((x, 30, h / 2 - 0.5), r, 0.0, h, MOUNT(), 9, 0.4)
    cone((x, 30 - r * 0.2, h - 1.6), r * 0.35, 0.0, 2.6, SNOW(), 7, 0.2)
# dennen aan de zijkanten
for x, y, s in [(-6.8, 1.5, 1.25), (-8.5, 4.0, 1.5), (-5.2, 3.8, 0.9), (6.9, 1.8, 1.2), (8.6, 4.2, 1.55),
                (5.4, 3.6, 0.85), (-10.5, 7.5, 1.6), (10.8, 7.8, 1.6), (-4.3, -0.4, 1.05)]:
    pine(x, y, s)
# kristallen: groot in de hoeken vooraan, kleiner bij de poort
crystal_cluster(-2.55, -6.3, 1.25, ICE())
crystal_cluster(2.7, -6.0, 1.15, ICEP())
crystal_cluster(-3.6, -3.0, 0.75, ICEP())
crystal_cluster(-2.6, 4.2, 0.6, ICE())
crystal_cluster(2.7, 4.3, 0.6, ICEP())
# lantaarns langs het plein
for x, y in [(-3.3, 1.3), (3.3, 1.3), (-1.4, 4.4), (1.4, 4.4)]:
    lantern(x, y)
snowman(3.1, -2.6, 0.8)
# sneeuwheuveltjes
for x, y, rx, ry, rz in [(-3.2, -6.0, 1.6, 1.2, 0.45), (3.3, -5.8, 1.6, 1.2, 0.45), (-8, 1, 3, 2, 0.8),
                          (8.2, 1.2, 3, 2, 0.8), (-4.8, -2.4, 1.6, 1.4, 0.4), (4.6, -1.8, 1.6, 1.4, 0.4)]:
    mound(x, y, rx, ry, rz)

# vallende sneeuw (kleine bolletjes) - niet vlak voor het midden
snowflake = mat('flake', '#ffffff', 0.5, emit='#ffffff', strength=1.2)
for i in range(170):
    x = random.uniform(-9, 9); y = random.uniform(-2, 14); z = random.uniform(0.6, 11)
    sphere((x, y, z), random.uniform(0.025, 0.055), snowflake)

# ------------------------------------------------------------------ lucht, licht, camera
sky(scene, [(0.0, '#ffc4e1'), (0.14, '#d9c2ff'), (0.45, '#5f9ff2')])
light(scene, 'SUN', 'sun', 3.2, (1.0, 0.94, 0.86), rot=(52, -18, -35), angle=12)
light(scene, 'AREA', 'fill', 650, (0.8, 0.88, 1.0), (0, -16, 9), (65, 0, 0), size=14)
light(scene, 'POINT', 'poortgloed', 250, (0.6, 0.8, 1.0), (0, PY - 2.2, 2.0), size=1)
camera(scene, (0, -12.5, 3.4), (0, 3.0, 3.1), lens=30)

render(scene, OUT, 'ijspaleis', exposure=-0.35)
