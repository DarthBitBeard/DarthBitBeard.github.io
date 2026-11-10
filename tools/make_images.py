"""Regenerate the site's derived images from photo.jpg.

Run from the repo root after replacing photo.jpg:
    python tools/make_images.py

Needs Pillow 11+ (pip install pillow). Writes:
    photo-400.avif, photo-800.avif, photo-400.webp, photo-800.webp
    og-image.jpg            1200x630 link preview for LinkedIn, Slack, etc.
    favicon-32.png, apple-touch-icon.png
    _includes/vcard-photo.vcf  square photo embedded in contact.vcf
"""
import base64
import io
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
NAME = "Landon Beard"
TITLE = "IT Specialist II  |  Cybersecurity"
CERTS = "CySA+  ·  Security+  ·  ISC2 CC  ·  Azure Fundamentals"
URL = "landonbeard.beardlab.us"
BLUE = (0, 113, 227)


def font(bold: bool, size: int) -> ImageFont.FreeTypeFont:
    candidates = (
        ["C:/Windows/Fonts/segoeuib.ttf", "/System/Library/Fonts/SFNS.ttf", "DejaVuSans-Bold.ttf"]
        if bold
        else ["C:/Windows/Fonts/segoeui.ttf", "/System/Library/Fonts/SFNS.ttf", "DejaVuSans.ttf"]
    )
    for path in candidates:
        try:
            return ImageFont.truetype(path, size)
        except OSError:
            continue
    return ImageFont.load_default(size)


def photo_variants(photo: Image.Image) -> None:
    for width in (400, 800):
        height = round(photo.height * width / photo.width)
        img = photo.resize((width, height), Image.LANCZOS) if width != photo.width else photo
        img.save(ROOT / f"photo-{width}.avif", quality=60)
        img.save(ROOT / f"photo-{width}.webp", quality=80, method=6)


def og_image(photo: Image.Image) -> None:
    w, h = 1200, 630
    img = Image.new("RGB", (w, h))
    draw = ImageDraw.Draw(img)
    top, bottom = (11, 35, 64), (13, 17, 23)
    for y in range(h):
        t = y / (h - 1)
        draw.line([(0, y), (w, y)], fill=tuple(round(a + (b - a) * t) for a, b in zip(top, bottom)))

    # Portrait on the right, cropped to the frame and given rounded corners.
    pw, ph = 420, 525
    scale = max(pw / photo.width, ph / photo.height)
    p = photo.resize((round(photo.width * scale), round(photo.height * scale)), Image.LANCZOS)
    left = (p.width - pw) // 2
    p = p.crop((left, 0, left + pw, ph))
    mask = Image.new("L", (pw, ph), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, pw - 1, ph - 1], radius=28, fill=255)
    px, py = w - pw - 64, (h - ph) // 2
    img.paste(p, (px, py), mask)

    x = 72
    draw.rectangle([x, 150, x + 64, 156], fill=BLUE)
    draw.text((x, 178), NAME, font=font(True, 84), fill="white")
    draw.text((x, 290), TITLE, font=font(False, 36), fill=(200, 215, 230))
    draw.text((x, 360), CERTS, font=font(False, 26), fill=(150, 170, 190))
    draw.text((x, 470), URL, font=font(True, 28), fill=(110, 180, 255))
    img.save(ROOT / "og-image.jpg", quality=86, optimize=True, progressive=True)


def vcard_photo(photo: Image.Image) -> None:
    """Square, face-centered JPEG for the "Save contact" card.

    Phones mostly ignore photo links in a vCard, so the image is embedded as
    base64, folded to 75-octet lines with CRLF as the vCard 3.0 format requires.
    """
    side = round(photo.width * 0.9)
    left = round(photo.width * 0.0625)
    square = photo.crop((left, 0, left + side, side)).resize((300, 300), Image.LANCZOS)
    buf = io.BytesIO()
    square.save(buf, "JPEG", quality=82, optimize=True, progressive=False)
    line = "PHOTO;ENCODING=b;TYPE=JPEG:" + base64.b64encode(buf.getvalue()).decode("ascii")
    folded = [line[:75]] + [" " + line[i:i + 74] for i in range(75, len(line), 74)]
    out = ROOT / "_includes" / "vcard-photo.vcf"
    out.write_bytes("\r\n".join(folded).encode("ascii"))


def icons() -> None:
    for size, name in ((32, "favicon-32.png"), (180, "apple-touch-icon.png")):
        scale = 8
        big = size * scale
        img = Image.new("RGBA", (big, big), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        radius = 0 if name.startswith("apple") else round(big * 0.22)
        draw.rounded_rectangle([0, 0, big - 1, big - 1], radius=radius, fill=BLUE)
        f = font(True, round(big * 0.5))
        box = draw.textbbox((0, 0), "LB", font=f)
        tw, th = box[2] - box[0], box[3] - box[1]
        draw.text(((big - tw) / 2 - box[0], (big - th) / 2 - box[1]), "LB", font=f, fill="white")
        img.resize((size, size), Image.LANCZOS).save(ROOT / name, optimize=True)
    # Browsers still request /favicon.ico on their own, so provide one.
    Image.open(ROOT / "favicon-32.png").save(ROOT / "favicon.ico", sizes=[(16, 16), (32, 32)])


if __name__ == "__main__":
    src = Image.open(ROOT / "photo.jpg").convert("RGB")
    photo_variants(src)
    og_image(src)
    vcard_photo(src)
    icons()
    print("done")
