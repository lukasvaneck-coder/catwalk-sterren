"""
Catwalk Sterren - losse plaatjes voor de spelletjes in de binnenspeeltuin
(zie lib.py voor gebruik).

Elk voorwerp wordt apart gebouwd (ver uit elkaar) en met een orthografische camera
onder dezelfde hoek als speeltuin-hal.py gerenderd, met doorzichtige achtergrond.
Het voorwerp staat gecentreerd in een vierkant van max(breedte, hoogte) * 1.1;
het spel tekent het plaatje zo, gecentreerd op de botsingsrechthoek.

Schrijft <uitvoermap>/<naam>.png (groot) en <naam>-klein.png. Het spel gebruikt
de kleine versies als assets/speeltuin/<naam>.png.
"""
import math, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lib import begin, mat, box, cyl, cone, sphere, torus, star, sky, light, setup_render, still

import bpy

scene, OUT = begin('Speeltuinplaatjes')

PINK   = lambda: mat('pink',   '#ff6fae', 0.35, coat=0.6)
YELLOW = lambda: mat('yellow', '#ffc531', 0.3, coat=0.7)
BLUE   = lambda: mat('blue',   '#5aaeff', 0.35, coat=0.6)
MINT   = lambda: mat('mint',   '#3ddcb0', 0.35, coat=0.6)
PURPLE = lambda: mat('purple', '#a36bff', 0.35, coat=0.6)
ORANGE = lambda: mat('orange', '#ff8c42', 0.35, coat=0.6)
WHITE  = lambda: mat('white',  '#ffffff', 0.4, coat=0.5)
GOLD   = lambda: mat('gold',   '#ffcf3a', 0.25, metal=0.4, emit='#ffc531', strength=0.8, coat=0.5)
MAT    = lambda: mat('springmat', '#5b4fc4', 0.5, coat=0.3)
LEG    = lambda: mat('leg',    '#8b93b0', 0.3, metal=0.8)
COLS = [PINK, YELLOW, MINT, BLUE, PURPLE, ORANGE]

SPRITES = []   # (naam, x, middenhoogte, breedte, hoogte, pixels)


def blok(x):
    """Zacht schuimblok met een ster erop (laag: overheen springen)."""
    box((x, 0, 0.5), (1.0, 1.0, 1.0), PINK(), 0.18)
    star((x, -0.5, 0.52), 0.28, YELLOW())
    SPRITES.append(('blok', x, 0.5, 1.0, 1.0, 512))


def toren(x):
    """Twee blokken op elkaar (hoog: dubbele sprong)."""
    box((x, 0, 0.5), (1.0, 1.0, 1.0), MINT(), 0.18)
    box((x, 0, 1.52), (0.92, 0.92, 0.98), BLUE(), 0.18)
    star((x, -0.5, 0.52), 0.26, YELLOW())
    sphere((x, -0.47, 1.52), 0.2, PINK(), (1, 0.4, 1))
    SPRITES.append(('toren', x, 1.0, 1.0, 2.0, 512))


def bal(x):
    """Strandbal met zes gekleurde banen (rolt: het spel draait het plaatje)."""
    bpy.ops.mesh.primitive_uv_sphere_add(segments=48, ring_count=24, radius=0.5, location=(x, 0, 0.5))
    o = bpy.context.object
    for m in (PINK(), YELLOW(), MINT(), BLUE(), PURPLE(), ORANGE(), WHITE()):
        o.data.materials.append(m)
    for p in o.data.polygons:
        p.use_smooth = True
        # zes banen rond de pool-as, witte kapjes op de polen
        c = p.center
        p.material_index = 6 if abs(c.z) > 0.46 else int((math.atan2(c.y, c.x) % math.tau) / math.tau * 6)
    o.rotation_euler = (math.pi / 2, 0, 0)                           # pool naar de camera: je ziet een wiel van kleuren
    SPRITES.append(('bal', x, 0.5, 1.0, 1.0, 512))


def kegel(x):
    """Pionnetje van schuim (laag en smal)."""
    box((x, 0, 0.06), (0.8, 0.8, 0.12), ORANGE(), 0.04)
    cone((x, 0, 0.5), 0.33, 0.06, 0.8, ORANGE(), 48)
    cone((x, 0, 0.5), 0.27, 0.19, 0.18, WHITE(), 48).scale = (1.12, 1.12, 1)
    SPRITES.append(('kegel', x, 0.45, 0.8, 0.9, 512))


def ster(x):
    """Gouden ster om te verzamelen."""
    star((x, 0, 0.5), 0.5, GOLD())
    SPRITES.append(('ster', x, 0.5, 1.0, 1.0, 512))


def trampoline(x):
    """Ronde trampoline met regenboogrand (voor het trampolinespel)."""
    for i in range(8):
        a = i / 8 * math.tau
        cyl((x + math.cos(a) * 2.1, math.sin(a) * 0.9, 0.35), 0.06, 0.7, LEG(), 16, 0)
    cyl((x, 0, 0.72), 2.0, 0.06, MAT(), 96, 0.02).scale = (1, 0.42, 1)
    for i in range(24):                                               # gekleurde kussentjes op de rand
        a = i / 24 * math.tau
        seg = sphere((x + math.cos(a) * 2.1, math.sin(a) * 0.9, 0.78), 0.3, COLS[i % len(COLS)](), (1.0, 0.75, 0.42))
        seg.rotation_euler = (0, 0, a)
    SPRITES.append(('trampoline', x, 0.6, 4.8, 1.3, 1024))


for i, make in enumerate([blok, toren, bal, kegel, ster, trampoline]):
    make(i * 12.0)

sky(scene, [(0.0, '#fff6fb'), (1.0, '#fff6fb')], strength=0.6)
light(scene, 'SUN', 'zon', 2.6, (1.0, 0.96, 0.9), rot=(50, 10, -20), angle=20)
light(scene, 'AREA', 'voor', 400, (1.0, 0.95, 1.0), (30, -10, 6), (60, 0, 0), size=80)

cam = bpy.data.cameras.new('cam'); cam.type = 'ORTHO'
co = bpy.data.objects.new('cam', cam); scene.collection.objects.link(co); scene.camera = co
TILT = 6
for name, x, zc, w, h, px in SPRITES:
    tilt = 22 if name == 'trampoline' else TILT                       # trampoline iets van boven: je ziet de mat
    rx = math.radians(90 - tilt)
    co.rotation_euler = (rx, 0, 0)
    d = 30
    co.location = (x, -d * math.cos(math.radians(tilt)), zc + d * math.sin(math.radians(tilt)))
    wide = name == 'trampoline'
    cam.ortho_scale = max(w, h) * 1.1
    setup_render(scene, (px, px // 2) if wide else (px, px), exposure=-0.3, samples=64, transparent=True)
    still(scene, os.path.join(OUT, name + '.png'), (px // 2, px // 4) if wide else (px // 2, px // 2), fmt='PNG')

bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT, 'speeltuin-sprites.blend'))
