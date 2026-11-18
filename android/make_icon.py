# Genera el icono del juego (isla isométrica con casa y bandera pirata) en todas las densidades.
import os, sys
from PIL import Image, ImageDraw

S = 512
img = Image.new('RGBA', (S, S), (0, 0, 0, 0))
d = ImageDraw.Draw(img)
# fondo redondeado con degradado mar
bg = Image.new('RGBA', (S, S))
bd = ImageDraw.Draw(bg)
for y in range(S):
    t = y / S
    bd.line([(0, y), (S, y)], fill=(int(20 + 30 * t), int(60 + 70 * t), int(110 + 60 * t), 255))
mask = Image.new('L', (S, S), 0)
ImageDraw.Draw(mask).rounded_rectangle([0, 0, S - 1, S - 1], radius=110, fill=255)
img.paste(bg, (0, 0), mask)
d = ImageDraw.Draw(img)
# olas
for i, y in enumerate([400, 440]):
    for x in range(20, S - 20, 70):
        d.arc([x, y, x + 60, y + 30], 200, 340, fill=(200, 235, 245, 200), width=6)
# isla isométrica
cx, cy, w, h = 256, 300, 360, 180
def diamond(cx, cy, w, h):
    return [(cx, cy - h / 2), (cx + w / 2, cy), (cx, cy + h / 2), (cx - w / 2, cy)]
d.polygon([(cx - w / 2, cy), (cx, cy + h / 2), (cx, cy + h / 2 + 34), (cx - w / 2, cy + 34)], fill=(168, 130, 80))
d.polygon([(cx + w / 2, cy), (cx, cy + h / 2), (cx, cy + h / 2 + 34), (cx + w / 2, cy + 34)], fill=(130, 98, 60))
d.polygon(diamond(cx, cy, w, h), fill=(226, 205, 150))
d.polygon(diamond(cx, cy - 4, w - 50, h - 25), fill=(104, 168, 72))
# casa
hx, hy = 220, 262
d.polygon([(hx - 60, hy), (hx, hy + 30), (hx, hy - 50), (hx - 60, hy - 80)], fill=(236, 226, 204))
d.polygon([(hx + 50, hy - 25), (hx, hy + 30), (hx, hy - 50), (hx + 50, hy - 105)], fill=(200, 188, 166))
d.polygon([(hx - 70, hy - 76), (hx - 15, hy - 150), (hx + 58, hy - 110), (hx + 2, hy - 44)], fill=(190, 70, 46))
d.polygon([(hx - 15, hy - 150), (hx + 58, hy - 110), (hx + 50, hy - 100), (hx - 10, hy - 136)], fill=(150, 50, 34))
d.rectangle([hx - 38, hy - 34, hx - 22, hy - 8], fill=(90, 58, 30))
# mástil con bandera
px = 340
d.rectangle([px - 4, 120, px + 4, 300], fill=(80, 55, 30))
d.polygon([(px + 4, 125), (px + 92, 140), (px + 4, 190)], fill=(20, 20, 20))
d.ellipse([px + 22, 140, px + 44, 162], fill=(240, 240, 240))
# árbol
d.polygon([(300, 300), (330, 230), (360, 300)], fill=(47, 122, 62))
d.polygon([(306, 270), (330, 205), (354, 270)], fill=(61, 154, 76))
out = sys.argv[1]
for name, size in [('mdpi', 48), ('hdpi', 72), ('xhdpi', 96), ('xxhdpi', 144), ('xxxhdpi', 192)]:
    p = os.path.join(out, f'mipmap-{name}')
    os.makedirs(p, exist_ok=True)
    img.resize((size, size), Image.LANCZOS).save(os.path.join(p, 'ic_launcher.png'))
img.save(os.path.join(out, '..', 'icon-512.png'))
