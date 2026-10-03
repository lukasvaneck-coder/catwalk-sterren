"""
Catwalk Sterren - achtergrond van de binnenspeeltuin (zie lib.py voor gebruik).

Een zijaanzicht van een speelhal als naadloos herhalende strook: de springbaan
scrolt deze strook achter het poppetje langs. Daarom wordt de inhoud van één
tegel (breedte L) drie keer gebouwd (op -L, 0 en +L) en rendert een orthografische
camera precies één tegel; wat over de rand steekt, komt aan de andere kant terug.

Schrijft <uitvoermap>/speeltuin-hal.png (2160 x 1080) en .jpg (1440 x 720).
Het spel gebruikt de jpg als assets/speeltuin/hal.jpg. De vloer onderin wordt in
het spel overschilderd met een eigen speelmat, dus belangrijke dingen staan hoger.
"""
import math, os, random, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lib import begin, mat, box, cyl, cone, sphere, torus, star, sky, light, setup_render, still

import bmesh, bpy
from mathutils import Vector

scene, OUT = begin('Speeltuinhal')
L = 24.0
BACK = 8.0

# ------------------------------------------------------------------ materialen
WALL   = lambda: mat('wall',   '#cdeee6', 0.8, emit='#d9f5ee', strength=0.15)
WALL2  = lambda: mat('wall2',  '#ffe6f0', 0.8, emit='#fff0f5', strength=0.1)
FLOOR  = lambda: mat('floor',  '#b9a7e8', 0.7)
SKY    = lambda: mat('skyw',   '#7cc4ff', 0.5, emit='#86c9ff', strength=0.7)
CLOUD  = lambda: mat('cloud',  '#ffffff', 0.6, emit='#ffffff', strength=0.9)
FRAME  = lambda: mat('frame',  '#ffffff', 0.5)
NET    = lambda: mat('net',    '#5b4a8a', 0.6, alpha=0.35)
YELLOW = lambda: mat('yellow', '#ffc531', 0.3, coat=0.7)
BLUE   = lambda: mat('blue',   '#5aaeff', 0.3, coat=0.7)
PINK   = lambda: mat('pink',   '#ff6fae', 0.3, coat=0.7)
MINT   = lambda: mat('mint',   '#3ddcb0', 0.3, coat=0.7)
PURPLE = lambda: mat('purple', '#a36bff', 0.3, coat=0.7)
ORANGE = lambda: mat('orange', '#ff8c42', 0.3, coat=0.7)
LAMP   = lambda: mat('lamp',   '#fff6d8', 0.4, emit='#fff1c2', strength=4.0)
STRING = lambda: mat('string', '#6b5a8f', 0.6)
COLS = [PINK, YELLOW, MINT, BLUE, PURPLE, ORANGE]


def tube(p0, p1, r, m):
    """Buis tussen twee punten (voor het klimrek)."""
    a, b = Vector(p0), Vector(p1)
    c = cyl(((a + b) / 2), r, (b - a).length, m, 24, 0)
    c.rotation_euler = (b - a).to_track_quat('Z', 'Y').to_euler()
    return c


def plank(p0, p1, width, thick, m, bevel=0.06):
    """Plank/glijbaan van p0 naar p1 (in het xz-vlak), breedte in y."""
    a, b = Vector(p0), Vector(p1)
    o = box(((a + b) / 2), ((b - a).length, width, thick), m, bevel)
    o.rotation_euler = (0, -math.atan2(b.z - a.z, b.x - a.x), 0)
    return o


def half_ring(loc, R, r, m):
    """Halve torus (boog) rechtop, met de open kant naar beneden."""
    t = torus(loc, R, r, m)
    bm = bmesh.new(); bm.from_mesh(t.data)
    bmesh.ops.bisect_plane(bm, geom=bm.verts[:] + bm.edges[:] + bm.faces[:], plane_co=(0, 0, 0), plane_no=(0, 1, 0), clear_inner=True)
    bm.to_mesh(t.data); bm.free()
    t.rotation_euler = (math.pi / 2, 0, 0)
    return t


def flag_line(x0, x1, z, sag, ox, rnd):
    n = 12
    for i in range(n + 1):
        t = i / n
        x = x0 + (x1 - x0) * t
        zz = z - sag * 4 * t * (1 - t)
        if i < n:
            t2 = (i + 1) / n
            tube((ox + x, BACK - 1.0, zz), (ox + x0 + (x1 - x0) * t2, BACK - 1.0, z - sag * 4 * t2 * (1 - t2)), 0.02, STRING())
        if 0 < i < n:
            f = cone((ox + x, BACK - 1.0, zz - 0.32), 0.3, 0.0, 0.6, COLS[(i + rnd) % len(COLS)](), 3)
            f.rotation_euler = (math.pi, 0, math.pi / 2)
            f.scale = (1, 0.15, 1)


def build(ox):
    """Eén tegel van de hal, verschoven over ox."""
    random.seed(5)                                                    # elke kopie is precies gelijk
    # muur, plint, vloer
    box((ox + L / 2, BACK + 0.25, 7), (L + 0.02, 0.5, 14), WALL(), 0)
    box((ox + L / 2, BACK - 0.02, 1.0), (L + 0.02, 0.1, 2.0), WALL2(), 0)
    for i in range(24):                                              # vrolijke strepen op de plint
        box((ox + 0.5 + i, BACK - 0.08, 1.0), (0.42, 0.06, 1.6), COLS[i % len(COLS)](), 0.03)
    box((ox + L / 2, -6, -0.1), (L + 0.02, 30, 0.2), FLOOR(), 0)
    # hoge ramen met wolkjes
    for x in (3.0, 15.0):
        box((ox + x, BACK - 0.05, 9.2), (4.2, 0.1, 2.6), SKY(), 0.15)
        box((ox + x, BACK - 0.1, 9.2), (0.12, 0.12, 2.6), FRAME(), 0.03)
        box((ox + x, BACK - 0.1, 9.2), (4.2, 0.12, 0.12), FRAME(), 0.03)
        for dx, dz, s in [(-1.1, 9.6, 0.32), (-0.8, 9.7, 0.4), (0.9, 8.7, 0.3), (1.2, 8.8, 0.38)]:
            sphere((ox + x + dx, BACK - 0.12, dz), s, CLOUD(), (1.4, 0.3, 1))
    # regenboog op de muur
    for k, m in enumerate(COLS[:5]):
        half_ring((ox + 8.0, BACK - 0.1, 3.4), 2.6 - k * 0.32, 0.16, m())
    for dx in (-2.0, 2.0):
        sphere((ox + 8.0 + dx, BACK - 0.35, 3.5), 0.55, CLOUD(), (1.3, 0.5, 0.8))
    # grote zon-ster op de muur
    star((ox + 21.0, BACK - 0.1, 8.6), 1.0, YELLOW())
    # klimmuur met gekleurde grepen
    box((ox + 12.2, BACK - 0.15, 4.2), (2.6, 0.2, 6.0), mat('klimwand', '#fff4c9', 0.6), 0.06)
    for _ in range(26):
        sphere((ox + 12.2 + random.uniform(-1.1, 1.1), BACK - 0.3, random.uniform(1.6, 7.0)),
               random.uniform(0.11, 0.17), random.choice(COLS)(), (1.2, 0.6, 1))
    # ballenbak (midden-voor)
    box((ox + 4.0, 3.0, 0.45), (6.0, 3.4, 0.9), BLUE(), 0.25)
    box((ox + 4.0, 3.0, 0.6), (5.4, 2.8, 0.9), mat('bakbinnen', '#3f7fd0', 0.6), 0.1)
    for _ in range(260):
        sphere((ox + 4.0 + random.uniform(-2.6, 2.6), 3.0 + random.uniform(-1.3, 1.3), random.uniform(0.85, 1.25)),
               0.2, random.choice(COLS)())
    # klimrek met glijbaan (rechts)
    X = 17.5
    for dx in (-2.0, 2.0):
        for dy in (3.2, 5.6):
            tube((ox + X + dx, dy, 0), (ox + X + dx, dy, 5.2), 0.14, YELLOW())
    for z, m in ((2.4, BLUE()), (4.6, PINK())):
        box((ox + X, 4.4, z), (4.4, 2.8, 0.45), m, 0.12)            # dikke zachte vloertjes
        for dy in (3.2, 5.6):
            tube((ox + X - 2.0, dy, z + 0.9), (ox + X + 2.0, dy, z + 0.9), 0.1, MINT())
    # zijpaneel met patrijspoortjes onderin, en een trapje
    box((ox + X + 0.6, 3.25, 1.1), (3.0, 0.2, 2.0), PURPLE(), 0.12)
    for dx in (-0.4, 1.0, 1.6):
        cyl((ox + X + dx, 3.12, 1.2), 0.32, 0.06, mat('poort', '#7c4fd6', 0.5), 32, 0).rotation_euler = (math.pi / 2, 0, 0)
    for k in range(4):
        box((ox + X + 2.75, 3.6, 0.3 + k * 0.55), (0.9, 0.9, 0.5), COLS[k](), 0.12)
    # dak
    roof = cone((ox + X, 4.4, 6.3), 3.4, 0.0, 2.2, ORANGE(), 4, 0.1)
    roof.rotation_euler = (0, 0, math.pi / 4)
    sphere((ox + X, 4.4, 7.5), 0.25, YELLOW())
    # glijbaan van het bovenste vloertje naar links-voor
    top, bottom = (ox + X - 2.1, 0, 4.7), (ox + X - 6.2, 0, 0.35)
    for dy, w, t, m, dz in ((2.9, 1.3, 0.2, YELLOW(), 0.0), (2.25, 0.14, 0.45, ORANGE(), 0.2), (3.55, 0.14, 0.45, ORANGE(), 0.2)):
        plank((top[0], dy, top[2] + dz), (bottom[0], dy, bottom[2] + dz), w, t, m)
    plank((bottom[0], 2.9, 0.35), (bottom[0] - 0.9, 2.9, 0.25), 1.3, 0.2, YELLOW())
    cyl((top[0] + 0.1, 2.9, 2.35), 0.12, 4.7, YELLOW(), 16, 0)        # steunpaal
    # schuimblokken en vormen tussen de dingen door
    for x, y, m, kind in [(8.2, 4.5, PINK, 'blok'), (9.4, 4.8, MINT, 'cil'), (13.8, 3.8, PURPLE, 'boog'),
                          (22.6, 4.6, ORANGE, 'blok'), (23.4, 5.4, BLUE, 'cil'), (0.8, 6.0, MINT, 'boog')]:
        if kind == 'blok':
            box((ox + x, y, 0.45), (0.9, 0.9, 0.9), m(), 0.15)
        elif kind == 'cil':
            cyl((ox + x, y, 0.4), 0.45, 0.8, m(), 32, 0.1)
        else:
            t = torus((ox + x, y, 0.0), 0.8, 0.28, m()); t.rotation_euler = (math.pi / 2, 0, 0)
    # vlaggenlijnen en lampen aan het plafond
    flag_line(0.0, 12.0, 11.5, 1.2, ox, 0)
    flag_line(12.0, 24.0, 11.5, 1.2, ox, 3)
    for x in (6.0, 18.0):
        tube((ox + x, 5.0, 12.5), (ox + x, 5.0, 11.0), 0.02, STRING())
        sphere((ox + x, 5.0, 10.8), 0.38, LAMP())
        cone((ox + x, 5.0, 11.15), 0.45, 0.1, 0.35, PURPLE(), 32)


for k in (-1, 0, 1):
    build(k * L)

# ------------------------------------------------------------------ licht en camera
sky(scene, [(0.0, '#fff6fb'), (1.0, '#fff6fb')], strength=0.6)
light(scene, 'SUN', 'zon', 2.6, (1.0, 0.96, 0.9), rot=(50, 10, -20), angle=20)
light(scene, 'AREA', 'voor', 1800, (1.0, 0.95, 1.0), (L / 2, -10, 9), (60, 0, 0), size=30)

cam = bpy.data.cameras.new('cam'); cam.type = 'ORTHO'; cam.ortho_scale = L
co = bpy.data.objects.new('cam', cam); scene.collection.objects.link(co); scene.camera = co
co.location = (L / 2, -30, 8.4)
co.rotation_euler = (math.radians(84), 0, 0)

setup_render(scene, (2160, 1080), exposure=-0.3)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT, 'speeltuin-hal.blend'))
still(scene, os.path.join(OUT, 'speeltuin-hal.png'), (1440, 720))
