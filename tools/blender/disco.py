"""
Catwalk Sterren - decor 'disco' gebouwd in Blender (zie lib.py voor gebruik).

Hoort bij Discodansfeest, Dansgala en Knalcombinatie (kleurenwiel).
Compositie: het model staat op een oplichtende dansvloer; bovenin draait de
discobal met gekleurde lichtbundels, achterin een DJ-booth met speakers en
neon-ster en -hart aan de wand, ballonnen aan de zijkanten.
"""
import math, os, random, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lib import begin, hexcol, mat, box, cyl, cone, sphere, torus, star, heart, join, sky, light, aim, camera, render

import bpy
from mathutils import Vector

scene, OUT = begin('Disco')
random.seed(23)

# ------------------------------------------------------------------ materialen
WALL   = lambda: mat('wall',   '#2a1650', 0.7, emit='#3a1f6a', strength=0.15)
WALL2  = lambda: mat('wall2',  '#3b2170', 0.6)
GAP    = lambda: mat('gap',    '#1a0f33', 0.5)
METAL  = lambda: mat('metal',  '#c9cfe0', 0.25, metal=1.0)
MIRROR = lambda: mat('mirror', '#eef0ff', 0.12, metal=0.85, emit='#a99fe0', strength=0.7)
BLACK  = lambda: mat('black',  '#231a3a', 0.4, coat=0.5)
SPEAK  = lambda: mat('speak',  '#120c22', 0.6)
STRING = lambda: mat('string', '#ffffff', 0.6)
SPARK  = lambda: mat('spark',  '#ffffff', 0.4, emit='#ffffff', strength=5.0)

COLORS = ['#ff5da2', '#ffc531', '#3ddcb0', '#5aaeff', '#c47bff', '#ff8c42']
def glow(c, s=2.2):
    return mat('glow' + c, c, 0.3, emit=c, strength=s, coat=0.6)
def neon(c):
    return mat('neon' + c, c, 0.3, emit=c, strength=3.2)
def balloon_mat(c):
    return mat('ballon' + c, c, 0.18, coat=1.0, sss=0.2)
def beam(c):
    return mat('beam' + c, c, 0.5, emit=c, strength=1.5, alpha=0.07)


# ------------------------------------------------------------------ vormen
def disco_ball(x, y, z, r):
    cyl((x, y, z + 2.5), 0.03, 5.0 - r, METAL(), 12, 0)
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=4, radius=r, location=(x, y, z))
    o = bpy.context.object
    o.data.materials.append(MIRROR())                                 # vlakke facetjes = spiegeltjes
    o.rotation_euler = (0.3, 0.2, 0.4)
    # een paar fel oplichtende facetten
    for _ in range(70):
        v = Vector((random.uniform(-1, 1), random.uniform(-1, 0.2), random.uniform(-1, 1))).normalized() * r * 1.01
        sphere((x + v.x, y + v.y, z + v.z), r * 0.045, random.choice([SPARK(), glow(random.choice(COLORS), 6)]))
    light(scene, 'POINT', 'bal', 60, (1, 0.9, 1), (x, y - r - 0.8, z - 0.6), size=0.6)


def light_beam(origin, target, c, r_end=1.1):
    """Gekleurde lichtbundel (doorzichtige kegel) + echte spot erbij."""
    o, t = Vector(origin), Vector(target)
    d = (t - o).length
    b = cone(((o + t) / 2), r_end, 0.08, d, beam(c), 48)
    b.rotation_euler = (t - o).to_track_quat('-Z', 'Y').to_euler()
    b.visible_shadow = False
    cyl(origin, 0.22, 0.45, BLACK(), 24, 0.03).rotation_euler = b.rotation_euler       # lamp
    torus(origin, 0.2, 0.05, glow(c, 6))
    s = light(scene, 'SPOT', 'spot' + c, 900, hexcol(c)[:3], origin, size=0.2, spot=(30, 0.4))
    aim(s, target)


def dance_floor(nx, ny, size, y0):
    """Raster van oplichtende tegels in regenboogkleuren."""
    box((0, y0 + ny * size / 2 - size / 2, -0.06), (nx * size + 0.4, ny * size + 0.4, 0.1), GAP(), 0)
    for j in range(ny):
        for i in range(nx):
            x = (i - (nx - 1) / 2) * size; y = y0 + j * size
            c = COLORS[(i + 2 * j) % len(COLORS)]
            box((x, y, 0.0), (size * 0.92, size * 0.92, 0.06), glow(c, 0.7 if (i + j) % 2 else 1.3), 0.03)


def speaker(x, y, w, h):
    box((x, y, h / 2), (w, 0.9, h), SPEAK(), 0.08)
    for k, (zz, rr) in enumerate([(h * 0.72, w * 0.18), (h * 0.33, w * 0.32)]):
        cyl((x, y - 0.46, zz), rr * 1.15, 0.06, METAL(), 48, 0.01).rotation_euler = (math.pi / 2, 0, 0)
        c = cone((x, y - 0.45, zz), rr, rr * 0.25, 0.18, BLACK(), 48); c.rotation_euler = (-math.pi / 2, 0, 0)
        sphere((x, y - 0.5, zz), rr * 0.22, glow('#c47bff', 3))
    box((x, y - 0.47, h - 0.12), (w * 0.8, 0.04, 0.06), glow('#3ddcb0', 4), 0.01)


def dj_booth(x, y):
    box((x, y, 0.7), (3.4, 1.2, 1.4), BLACK(), 0.1)
    for k, c in enumerate(['#ff5da2', '#ffc531', '#3ddcb0', '#5aaeff']):         # lichtstrepen
        box((x, y - 0.62, 0.3 + k * 0.28), (3.2, 0.04, 0.1), glow(c, 4), 0.01)
    star((x, y - 0.66, 0.75), 0.32, neon('#ffc531'))
    for dx in (-0.9, 0.9):                                                        # draaitafels
        cyl((x + dx, y, 1.45), 0.45, 0.06, METAL(), 48, 0.01)
        cyl((x + dx, y, 1.49), 0.38, 0.03, BLACK(), 48, 0)
        cyl((x + dx, y, 1.51), 0.08, 0.03, glow('#ff5da2', 3), 24, 0)
    box((x, y, 1.47), (0.6, 0.6, 0.08), METAL(), 0.02)
    # koptelefoon op de mengtafel
    torus((x, y - 0.1, 1.62), 0.16, 0.035, glow('#c47bff', 2), (1, 0.6, 1)).rotation_euler = (math.pi / 2, 0, 0)


def balloon(x, y, z, c, s=1.0):
    sphere((x, y, z), 0.42 * s, balloon_mat(c), (1, 1, 1.18))
    cone((x, y, z - 0.52 * s), 0.07 * s, 0.0, 0.12 * s, balloon_mat(c), 16).rotation_euler = (math.pi, 0, 0)
    sphere((x - 0.13 * s, y - 0.33 * s, z + 0.16 * s), 0.07 * s, mat('glans', '#ffffff', 0.3, emit='#ffffff', strength=1.0), (1, 0.4, 1.6))
    return (x, y, z - 0.58 * s)


def balloon_bunch(x, y, base_z, s=1.0):
    knots = []
    for dx, dz, c in [(-0.45, 0.2, '#ff5da2'), (0.45, 0.35, '#ffc531'), (0.0, 0.9, '#c47bff'),
                      (-0.55, 1.15, '#3ddcb0'), (0.55, 1.25, '#5aaeff')]:
        knots.append(balloon(x + dx * s, y, base_z + dz * s, c, s))
    for kx, ky, kz in knots:                                                      # touwtjes
        o, t = Vector((kx, ky, kz)), Vector((x, y, 0.4))
        c = cyl(((o + t) / 2), 0.01, (o - t).length, STRING(), 8, 0)
        c.rotation_euler = (t - o).to_track_quat('Z', 'Y').to_euler()
    cyl((x, y, 0.2), 0.18, 0.4, glow('#ff5da2', 1), 24, 0.04)                     # gewichtje


def neon_ring(x, y, z, r, c):
    torus((x, y, z), r, 0.06, neon(c)).rotation_euler = (math.pi / 2, 0, 0)


# ------------------------------------------------------------------ zaal
BACK = 8.0
box((0, BACK + 0.3, 6), (40, 0.6, 12), WALL(), 0)
for x in (-8, 8):
    box((x, 2, 6), (0.6, 24, 12), WALL(), 0)
box((0, 2, -0.15), (40, 30, 0.2), GAP(), 0)
box((0, 2, 10), (40, 30, 0.3), WALL(), 0)
# verticale panelen op de achterwand met neonstrepen
for x in (-6, -4.5, 4.5, 6):
    box((x, BACK - 0.05, 4.5), (1.2, 0.1, 9), WALL2(), 0.05)
for x, c in [(-5.25, '#ff5da2'), (5.25, '#5aaeff')]:
    box((x, BACK - 0.12, 4.5), (0.08, 0.08, 9), neon(c), 0.02)

dance_floor(9, 9, 1.05, -6.0)
# podiumrand rond de dansvloer
box((0, -6.0 + 9 * 1.05 - 0.3, 0.08), (9.8, 0.25, 0.16), glow('#ffc531', 3), 0.05)

# ------------------------------------------------------------------ DJ en muziek
dj_booth(0, BACK - 1.6)
speaker(-2.6, BACK - 1.4, 1.3, 2.6)
speaker(2.6, BACK - 1.4, 1.3, 2.6)
# neon aan de wand
star((-3.4, BACK - 0.2, 6.0), 0.9, neon('#ffc531'))
heart((3.4, BACK - 0.2, 5.9), 0.85, neon('#ff5da2'))
neon_ring(0, BACK - 0.2, 4.6, 1.3, '#3ddcb0')
neon_ring(0, BACK - 0.2, 4.6, 1.0, '#c47bff')
for i, c in enumerate(['#ff5da2', '#ffc531', '#3ddcb0', '#5aaeff', '#c47bff']):    # equalizer
    for k in range(1 + (i * 3 + 2) % 5):
        box((-0.8 + i * 0.4, BACK - 0.2, 3.2 + k * 0.25), (0.3, 0.06, 0.18), neon(c), 0.02)

# ------------------------------------------------------------------ disco bal en lichtbundels
disco_ball(0, 1.5, 7.2, 0.9)
truss_z = 8.6
box((0, -1.0, truss_z), (14, 0.25, 0.25), METAL(), 0.03)
light_beam((-4.5, -1.0, truss_z - 0.3), (-1.6, -1.5, 0.0), '#ff5da2', 0.8)
light_beam((4.5, -1.0, truss_z - 0.3), (1.6, -1.8, 0.0), '#5aaeff', 0.8)
light_beam((-2.2, -1.0, truss_z - 0.3), (-3.6, 3.0, 0.0), '#ffc531', 0.7)
light_beam((2.2, -1.0, truss_z - 0.3), (3.8, 2.6, 0.0), '#3ddcb0', 0.7)
# lampjesslinger onder de truss
for i in range(41):
    t = i / 40; x = -7 + 14 * t; z = truss_z - 0.2 - 1.1 * math.sin(t * math.pi * 2) ** 2
    sphere((x, -1.1, z), 0.09, glow(COLORS[i % len(COLORS)], 4))

# ------------------------------------------------------------------ feest
balloon_bunch(-3.2, -2.6, 1.6, 0.95)
balloon_bunch(3.3, -2.2, 1.8, 0.95)
balloon_bunch(-5.0, 3.0, 2.4, 1.1)
balloon_bunch(5.0, 3.2, 2.2, 1.1)
# confetti in de lucht, niet voor het gezicht van het model
for _ in range(110):
    x = random.uniform(-6, 6); y = random.uniform(-1.5, 7); z = random.uniform(1.0, 8.5)
    if abs(x) < 1.3 and y < 2:
        continue
    c = box((x, y, z), (0.16, 0.04, 0.24), glow(random.choice(COLORS), 0.6), 0.01)
    c.rotation_euler = (random.random() * 6, random.random() * 6, random.random() * 6)
for _ in range(50):
    star((random.uniform(-6.5, 6.5), random.uniform(0, 7.5), random.uniform(2, 9.5)), random.uniform(0.05, 0.1), SPARK())

# ------------------------------------------------------------------ licht en camera
sky(scene, [(0.0, '#1a0f3a'), (1.0, '#1a0f3a')], strength=0.5)
light(scene, 'AREA', 'voor', 900, (0.95, 0.85, 1.0), (0, -10, 7), (60, 0, 0), size=10)
light(scene, 'POINT', 'roze', 400, (1.0, 0.4, 0.7), (-5, 2, 3), size=1)
light(scene, 'POINT', 'blauw', 400, (0.4, 0.6, 1.0), (5, 2, 3), size=1)
camera(scene, (0, -11.5, 3.0), (0, 3.0, 3.6), lens=28)

render(scene, OUT, 'disco', exposure=-0.2)
