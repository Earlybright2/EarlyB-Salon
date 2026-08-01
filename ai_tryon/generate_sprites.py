"""Generate hairstyle overlay PNG sprites for the AI Try-On module."""
import math
import os
import random
from PIL import Image, ImageDraw, ImageFilter

BASE_DIR = os.path.join(os.path.dirname(__file__), "static", "hairstyles")
os.makedirs(BASE_DIR, exist_ok=True)

STYLES = {
    "braids.png":       ("#3B2417", "box", 400, 300),
    "fade.png":         ("#1A1A1A", "fade", 400, 250),
    "afro.png":         ("#2D1B0F", "afro", 380, 340),
    "knotless.png":     ("#3B2417", "box", 400, 300),
    "hightop.png":      ("#1A1A1A", "hightop", 400, 320),
    "cornrows.png":     ("#2A1810", "cornrows", 400, 280),
    "twistout.png":     ("#3B2417", "twist", 380, 300),
    "buzzcut.png":      ("#1A1A1A", "buzz", 380, 180),
    "locs.png":         ("#2D1B0F", "locs", 400, 340),
    "bantu.png":        ("#3B2417", "bantu", 380, 280),
    "tapered.png":      ("#1A1A1A", "tapered", 400, 240),
    "washgo.png":       ("#3B2417", "curly", 380, 300),
    "fulani.png":       ("#2A1810", "fulani", 400, 300),
    "skinfade.png":     ("#1A1A1A", "skin", 400, 220),
    "ponytail.png":     ("#3B2417", "ponytail", 400, 360),
    "curlytop.png":     ("#1A1A1A", "curly", 380, 260),
    "bob.png":          ("#3B2417", "bob", 380, 280),
    "mohawk.png":       ("#1A1A1A", "mohawk", 400, 300),
}


def _hex_to_rgb(hex_color):
    hex_color = hex_color.lstrip("#")
    return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))


def draw_hairstyle(img, draw, color_hex, style, w, h):
    cx = w // 2
    color = _hex_to_rgb(color_hex)
    color_rgba = color + (255,)

    if style == "box":
        for i in range(-8, 9):
            x = cx + i * 22
            draw.line([(x, 20), (x, h - 20)], fill=color_rgba, width=12)
            for j in range(20, h - 20, 15):
                draw.ellipse([x - 8, j - 4, x + 8, j + 4], fill=color_rgba)

    elif style == "fade":
        draw.ellipse([cx - 140, 10, cx + 140, 100], fill=color_rgba)
        draw.rectangle([cx - 160, 50, cx + 160, 90], fill=color_rgba)

    elif style == "afro":
        for angle in range(0, 360, 5):
            r = 160 + int(20 * math.sin(math.radians(angle * 3)))
            x = cx + int(r * math.cos(math.radians(angle)))
            y = 150 + int(r * math.sin(math.radians(angle)) * 0.7)
            draw.ellipse([x - 25, y - 25, x + 25, y + 25], fill=color_rgba)

    elif style == "hightop":
        draw.rectangle([cx - 120, 10, cx + 120, 200], fill=color_rgba)
        draw.ellipse([cx - 120, 10, cx + 120, 80], fill=color_rgba)
        draw.rectangle([cx - 170, 180, cx + 170, 220], fill=color_rgba)

    elif style == "cornrows":
        for i in range(-6, 7):
            x = cx + i * 28
            draw.line([(x, 15), (x, h - 30)], fill=color_rgba, width=18)
            for j in range(15, h - 30, 10):
                draw.ellipse([x - 10, j - 5, x + 10, j + 5], fill=color_rgba)

    elif style == "twist":
        random.seed(42)
        for _ in range(60):
            x = cx + int(160 * (0.5 - random.random()))
            y = 50 + int(200 * (0.5 - random.random()))
            r = 20 + int(15 * random.random())
            draw.ellipse([x - r, y - r, x + r, y + r], fill=color_rgba)

    elif style == "buzz":
        draw.ellipse([cx - 150, 10, cx + 150, 130], fill=color_rgba)
        draw.rectangle([cx - 150, 60, cx + 150, 120], fill=color_rgba)

    elif style == "locs":
        for i in range(-6, 7):
            x = cx + i * 30
            draw.line([(x, 15), (x, h - 20)], fill=color_rgba, width=22)

    elif style == "bantu":
        positions = [(-80, 60), (0, 40), (80, 60), (-50, 120), (50, 120), (0, 160)]
        for px, py in positions:
            draw.ellipse([cx + px - 35, py - 35, cx + px + 35, py + 35], fill=color_rgba)
            draw.ellipse([cx + px - 20, py - 25, cx + px + 20, py + 15], fill=color_rgba)

    elif style == "tapered":
        draw.ellipse([cx - 140, 10, cx + 140, 110], fill=color_rgba)
        draw.rectangle([cx - 160, 50, cx + 160, 100], fill=color_rgba)

    elif style == "curly":
        random.seed(43)
        for _ in range(50):
            x = cx + int(140 * (0.5 - random.random()))
            y = 30 + int(180 * (0.5 - random.random()))
            r = 18 + int(12 * random.random())
            draw.ellipse([x - r, y - r, x + r, y + r], fill=color_rgba)

    elif style == "skin":
        draw.ellipse([cx - 140, 15, cx + 140, 100], fill=color_rgba)
        draw.rectangle([cx - 150, 50, cx + 150, 90], fill=color_rgba)

    elif style == "ponytail":
        draw.ellipse([cx - 130, 10, cx + 130, 100], fill=color_rgba)
        draw.line([(cx, 80), (cx + 60, h - 20)], fill=color_rgba, width=40)
        draw.ellipse([cx + 30, h - 60, cx + 90, h], fill=color_rgba)

    elif style == "fulani":
        for i in range(-7, 8):
            if i == 0:
                continue
            x = cx + i * 24
            draw.line([(x, 15), (x, h - 25)], fill=color_rgba, width=10)
        draw.line([(cx, 15), (cx, h - 20)], fill=color_rgba, width=14)

    elif style == "bob":
        draw.ellipse([cx - 150, 10, cx + 150, 200], fill=color_rgba)
        draw.rectangle([cx - 150, 100, cx + 150, 200], fill=color_rgba)

    elif style == "mohawk":
        draw.rectangle([cx - 50, 10, cx + 50, h - 30], fill=color_rgba)
        draw.ellipse([cx - 60, 10, cx + 60, 80], fill=color_rgba)


def main():
    for fname, (color, style, w, h) in STYLES.items():
        img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        draw_hairstyle(img, draw, color, style, w, h)
        img = img.filter(ImageFilter.GaussianBlur(1))
        img.save(os.path.join(BASE_DIR, fname))
        print(f"Created {fname}")
    print("All hairstyle sprites created.")


if __name__ == "__main__":
    main()
