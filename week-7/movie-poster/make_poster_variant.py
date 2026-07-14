#!/usr/bin/env python3
"""김부장 포스터 - 스틸컷 번호를 인자로 받아 변형 생성 (개인/연습용)"""
import sys
from PIL import Image, ImageDraw, ImageFont

FONT = "/System/Library/Fonts/AppleSDGothicNeo.ttc"
W, H = 1000, 1500

# 스틸컷별 가로 크롭 오프셋(px). 인물이 잘 담기도록 조정.
CROP_SHIFT = {1: -100, 2: -40, 3: -120}

n = int(sys.argv[1]) if len(sys.argv) > 1 else 1
STILL = f"stills/kimbujang_still_{n}.jpg"
OUT = f"kimbujang_poster_{n}.png"

src = Image.open(STILL).convert("RGB")
sw, sh = src.size
scale = H / sh
nw, nh = int(sw * scale), int(sh * scale)
src = src.resize((nw, nh), Image.LANCZOS)
left = int((nw - W) / 2) + CROP_SHIFT.get(n, 0)
left = max(0, min(left, nw - W))
img = src.crop((left, 0, left + W, H))

overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
od = ImageDraw.Draw(overlay)
for y in range(int(H * 0.20)):
    a = int(200 * (1 - y / (H * 0.20)))
    od.line([(0, y), (W, y)], fill=(0, 0, 0, a))
for y in range(int(H * 0.45)):
    yy = H - 1 - y
    a = int(252 * (1 - y / (H * 0.45)))
    od.line([(0, yy), (W, yy)], fill=(6, 8, 14, a))
img = Image.alpha_composite(img.convert("RGBA"), overlay).convert("RGB")
draw = ImageDraw.Draw(img)

def font(sz, idx=0):
    return ImageFont.truetype(FONT, sz, index=idx)

def center(y, text, f, fill, tracking=0, shadow=True):
    widths = [draw.textlength(ch, font=f) for ch in text]
    total = sum(widths) + tracking * (len(text) - 1)
    x = (W - total) / 2
    if shadow:
        sx = x
        for ch, w in zip(text, widths):
            draw.text((sx + 3, y + 4), ch, font=f, fill=(0, 0, 0))
            sx += w + tracking
    for ch, w in zip(text, widths):
        draw.text((x, y), ch, font=f, fill=fill)
        x += w + tracking

red = (229, 9, 20)
center(60, "N E T F L I X", font(40, 8), red, tracking=3)
center(118, "S E R I E S", font(22, 2), (210, 210, 210), tracking=9)
center(H - 470, "CODENAME  66", font(26, 8), (200, 200, 200), tracking=4)
center(H - 405, "세상에서 가장 평범한 아빠,", font(30, 2), (235, 235, 235), tracking=1)
center(H - 360, "세상에서 가장 위험한 남자.", font(30, 8), (255, 255, 255), tracking=1)
center(H - 300, "김부장", font(210, 9), (247, 247, 247), tracking=-6)
center(H - 92, "소지섭    최대훈    윤경호    주상욱", font(24, 8), (220, 220, 220), tracking=2)
center(H - 54, "10부작 복수 액션  ·  SBS·넷플릭스 동시 공개", font(19, 2), (165, 165, 165), tracking=0, shadow=False)

img.save(OUT, quality=95)
print(f"saved {OUT} ({W}x{H})")
