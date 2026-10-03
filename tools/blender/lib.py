"""
Gedeelde bouwstenen voor de Blender-decors van Catwalk Sterren.

Elk decorscript (ijspaleis.py, balzaal.py, disco.py, ...) doet:
  scene, OUT = lib.begin('Naam')      -> lege scène, uitvoermap uit de commandoregel
  ... bouwen met mat/box/cyl/cone/sphere/torus/star ...
  lib.sky(...) / lib.light(...) / lib.camera(...)
  lib.render(scene, OUT, 'id')        -> <OUT>/<id>.png (960x1440), .jpg (480x720) en .blend

Draaien:
  blender -b --factory-startup --python tools/blender/<id>.py -- <uitvoermap>

Stijl: zachte, ronde 'speelgoed'-vormen (bevel + smooth), pastel materialen met een
beetje eigen gloed, Eevee met de Standard view transform (AgX maakt alles grauw).
Compositie: het podium is 480x720 en het model staat midden-onder met de voeten op
~90% van de hoogte; houd het midden rustig en zet de details aan de zijkanten.
"""
import bpy, bmesh, math, os, sys
from mathutils import Vector


def begin(name):
    out = sys.argv[sys.argv.index('--') + 1] if '--' in sys.argv else os.getcwd()
    os.makedirs(out, exist_ok=True)
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.name = name
    MATS.clear()
    return scene, out


# ------------------------------------------------------------------ materialen
def hexcol(h, a=1.0):
    h = h.lstrip('#')
    srgb = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    lin = [c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4 for c in srgb]
    return (*lin, a)


MATS = {}
def mat(name, color, rough=0.55, emit=None, strength=0.0, coat=0.0, trans=0.0, sss=0.0, metal=0.0, alpha=1.0):
    """Principled-materiaal, één keer per naam aangemaakt."""
    if name in MATS:
        return MATS[name]
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = hexcol(color)
    b.inputs['Roughness'].default_value = rough
    b.inputs['Metallic'].default_value = metal
    if coat:
        b.inputs['Coat Weight'].default_value = coat
        b.inputs['Coat Roughness'].default_value = 0.08
    if trans:
        b.inputs['Transmission Weight'].default_value = trans
        b.inputs['IOR'].default_value = 1.31
    if sss:
        b.inputs['Subsurface Weight'].default_value = sss
        b.inputs['Subsurface Radius'].default_value = (0.4, 0.7, 1.0)
    if emit:
        b.inputs['Emission Color'].default_value = hexcol(emit)
        b.inputs['Emission Strength'].default_value = strength
    if alpha < 1.0:
        b.inputs['Alpha'].default_value = alpha
        for attr, val in (('surface_render_method', 'BLENDED'), ('blend_method', 'BLEND')):
            if hasattr(m, attr):
                setattr(m, attr, val)
    MATS[name] = m
    return m


# ------------------------------------------------------------------ vormen
def finish(o, m, bevel=0.0, smooth=True, sub=0):
    o.data.materials.append(m)
    if smooth:
        for p in o.data.polygons:
            p.use_smooth = True
    if bevel:
        mod = o.modifiers.new('bevel', 'BEVEL'); mod.width = bevel; mod.segments = 4
        mod.limit_method = 'ANGLE'
    if sub:
        mod = o.modifiers.new('sub', 'SUBSURF'); mod.levels = sub; mod.render_levels = sub
    return o


def box(loc, size, m, bevel=0.12):
    bpy.ops.mesh.primitive_cube_add(location=loc)
    o = bpy.context.object; o.scale = (size[0] / 2, size[1] / 2, size[2] / 2)
    bpy.ops.object.transform_apply(scale=True)
    return finish(o, m, bevel, smooth=False)


def cyl(loc, r, d, m, verts=48, bevel=0.06):
    bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=r, depth=d, location=loc)
    return finish(bpy.context.object, m, bevel)


def cone(loc, r1, r2, d, m, verts=48, bevel=0.0):
    bpy.ops.mesh.primitive_cone_add(vertices=verts, radius1=r1, radius2=r2, depth=d, location=loc)
    return finish(bpy.context.object, m, bevel)


def sphere(loc, r, m, scale=(1, 1, 1)):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=48, ring_count=24, radius=r, location=loc)
    o = bpy.context.object; o.scale = scale
    return finish(o, m)


def torus(loc, R, r, m, scale=(1, 1, 1)):
    bpy.ops.mesh.primitive_torus_add(major_radius=R, minor_radius=r, major_segments=64, minor_segments=16, location=loc)
    o = bpy.context.object; o.scale = scale
    return finish(o, m)


def star(loc, s, m):
    """Vijfpuntige ster die naar de camera (-Y) kijkt."""
    me = bpy.data.meshes.new('star'); o = bpy.data.objects.new('star', me)
    bpy.context.collection.objects.link(o)
    bm = bmesh.new(); pts = []
    for i in range(10):
        a = math.pi / 2 + i * math.pi / 5; rr = s if i % 2 == 0 else s * 0.45
        pts.append(bm.verts.new((math.cos(a) * rr, 0, math.sin(a) * rr)))
    f = bm.faces.new(pts)
    ext = bmesh.ops.extrude_face_region(bm, geom=[f])
    for v in [g for g in ext['geom'] if isinstance(g, bmesh.types.BMVert)]:
        v.co.y += s * 0.35
    bm.to_mesh(me); bm.free()
    o.location = loc
    o.location.y -= s * 0.17
    return finish(o, m, bevel=s * 0.12, smooth=False)


def heart(loc, s, m):
    """Hartje dat naar de camera (-Y) kijkt."""
    me = bpy.data.meshes.new('heart'); o = bpy.data.objects.new('heart', me)
    bpy.context.collection.objects.link(o)
    bm = bmesh.new(); pts = []
    for i in range(48):
        t = i / 48 * math.tau
        x = 16 * math.sin(t) ** 3
        z = 13 * math.cos(t) - 5 * math.cos(2 * t) - 2 * math.cos(3 * t) - math.cos(4 * t)
        pts.append(bm.verts.new((x / 16 * s, 0, z / 16 * s)))
    f = bm.faces.new(pts)
    ext = bmesh.ops.extrude_face_region(bm, geom=[f])
    for v in [g for g in ext['geom'] if isinstance(g, bmesh.types.BMVert)]:
        v.co.y += s * 0.3
    bm.to_mesh(me); bm.free()
    o.location = loc
    o.location.y -= s * 0.15
    return finish(o, m, bevel=s * 0.1, smooth=False)


def join(objs):
    bpy.ops.object.select_all(action='DESELECT')
    for o in objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    bpy.ops.object.join()
    o = bpy.context.object
    bpy.ops.object.select_all(action='DESELECT')
    return o


# ------------------------------------------------------------------ lucht, licht, camera
def sky(scene, stops, strength=1.0):
    """Verticaal kleurverloop als wereld: stops = [(positie 0..1, '#kleur'), ...]."""
    world = bpy.data.worlds.new('sky'); scene.world = world; world.use_nodes = True
    nt = world.node_tree; nt.nodes.clear()
    tc = nt.nodes.new('ShaderNodeTexCoord'); sep = nt.nodes.new('ShaderNodeSeparateXYZ')
    ramp = nt.nodes.new('ShaderNodeValToRGB'); bg = nt.nodes.new('ShaderNodeBackground'); out = nt.nodes.new('ShaderNodeOutputWorld')
    nt.links.new(tc.outputs['Generated'], sep.inputs[0]); nt.links.new(sep.outputs['Z'], ramp.inputs['Fac'])
    nt.links.new(ramp.outputs['Color'], bg.inputs['Color']); nt.links.new(bg.outputs[0], out.inputs[0])
    els = ramp.color_ramp.elements
    els[0].position, els[0].color = stops[0][0], hexcol(stops[0][1])
    els[1].position, els[1].color = stops[-1][0], hexcol(stops[-1][1])
    for pos, col in stops[1:-1]:
        els.new(pos).color = hexcol(col)
    bg.inputs['Strength'].default_value = strength
    return world


def light(scene, kind, name, energy, color=(1, 1, 1), loc=(0, 0, 0), rot=(0, 0, 0), size=None, angle=None, spot=None):
    """kind: SUN / AREA / POINT / SPOT. rot in graden. spot = (hoek in graden, blend)."""
    l = bpy.data.lights.new(name, kind); l.energy = energy; l.color = color
    if size is not None:
        if kind == 'AREA':
            l.size = size
        else:
            l.shadow_soft_size = size
    if angle is not None:
        l.angle = math.radians(angle)
    if spot:
        l.spot_size = math.radians(spot[0]); l.spot_blend = spot[1]
    o = bpy.data.objects.new(name, l); o.location = loc
    o.rotation_euler = tuple(math.radians(a) for a in rot)
    scene.collection.objects.link(o)
    return o


def aim(o, target):
    o.rotation_euler = (Vector(target) - o.location).to_track_quat('-Z', 'Y').to_euler()


def camera(scene, loc, target, lens=30):
    cam = bpy.data.cameras.new('cam'); cam.lens = lens
    co = bpy.data.objects.new('cam', cam); scene.collection.objects.link(co); scene.camera = co
    co.location = loc
    aim(co, target)
    return co


# ------------------------------------------------------------------ renderen
def render(scene, out, name, exposure=-0.35, samples=128, bloom=0.05):
    r = scene.render
    r.engine = 'BLENDER_EEVEE'
    r.resolution_x, r.resolution_y, r.resolution_percentage = 960, 1440, 100
    r.image_settings.file_format = 'PNG'
    ee = scene.eevee
    for attr, val in [('taa_render_samples', samples), ('use_raytracing', True), ('use_shadows', True),
                      ('use_bloom', True), ('bloom_intensity', bloom), ('use_gtao', True)]:
        if hasattr(ee, attr):
            setattr(ee, attr, val)
    scene.view_settings.view_transform = 'Standard'
    scene.view_settings.exposure = exposure

    png = os.path.join(out, name + '.png')
    r.filepath = png
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(out, name + '.blend'))
    bpy.ops.render.render(write_still=True)

    # verkleinde jpg zoals het spel hem gebruikt (assets/bg/<id>.jpg)
    # (Image.save, niet save_render: die zou exposure/view transform nog een keer toepassen)
    img = bpy.data.images.load(png)
    img.scale(480, 720)
    img.file_format = 'JPEG'
    img.save(filepath=os.path.join(out, name + '.jpg'), quality=86)
    print('KLAAR', png)
