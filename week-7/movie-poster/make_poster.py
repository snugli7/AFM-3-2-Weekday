#!/usr/bin/env python3
"""김부장 - 넷플릭스 스타일 영화 포스터 합성"""
from PIL import Image, ImageDraw, ImageFont, ImageFilter

BASE = "base.jpg"
OUT = "kimbujang_poster.png"
FONT = "/System/Library/Fonts/AppleSDGothicNeo.ttc"

img = Image.open(BASE).convert("RGB")
W, H = img.size  # 576 x 1024

# 1) 상단/하단 시네마틱 그라데이션 (텍스트 가독성 확보)
overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
od = ImageDraw.Draw(overlay)
# 상단 어둡게
for y in range(int(H * 0.28)):
    a = int(180 * (1 - y / (H * 0.28)))
    od.line([(0, y), (W, y)], fill=(0, 0, 0, a))
# 하단 어둡게 (더 진하게 - 크레딧 영역)
for y in range(int(H * 0.42)):
    yy = H - 1 - y
    a = int(235 * (1 - y / (H * 0.42)))
    od.line([(0, yy), (W, yy)], fill=(0, 0, 0, a))
img = Image.alpha_composite(img.convert("RGBA"), overlay).convert("RGB")
draw = ImageDraw.Draw(img)

def font(sz, idx=0):
    return ImageFont.truetype(FONT, sz, index=idx)

def center_text(y, text, f, fill, tracking=0, shadow=True):
    # 자간(tracking) 적용 중앙 정렬
    widths = [draw.textlength(ch, font=f) for ch in text]
    total = sum(widths) + tracking * (len(text) - 1)
    x = (W - total) / 2
    if shadow:
        sx = x
        for ch, w in zip(text, widths):
            draw.text((sx + 2, y + 3), ch, font=f, fill=(0, 0, 0))
            sx += w + tracking
    for ch, w in zip(text, widths):
        draw.text((x, y), ch, font=f, fill=fill)
        x += w + tracking

# 2) NETFLIX 상단 라벨
netflix_red = (229, 9, 20)
nf = font(26, idx=8)  # bold
center_text(46, "N E T F L I X", nf, netflix_red, tracking=2, shadow=True)
sub = font(15, idx=2)
center_text(84, "F I L M", sub, (210, 210, 210), tracking=6)

# 3) 카피(태그라인) - 제목 위
tag = font(22, idx=2)
center_text(H - 340, "정년까지 D-30.", tag, (225, 225, 225), tracking=1)
center_text(H - 306, "그가 사라졌다.", tag, (225, 225, 225), tracking=1)

# 4) 메인 타이틀 "김부장"
title = font(150, idx=9)  # heavy
center_text(H - 260, "김부장", title, (245, 245, 245), tracking=-4)

# 5) 부제 영문
en = font(20, idx=8)
center_text(H - 96, "K I M   B U - J A N G", en, (200, 200, 200), tracking=3)

# 6) 크레딧 블록 (하단)
cr = font(13, idx=2)
credits = "감독 이성재  ·  출연 송강호 김혜수 유아인  ·  각본 박찬영"
center_text(H - 58, credits, cr, (170, 170, 170), tracking=0, shadow=False)
info = font(12, idx=0)
center_text(H - 36, "12월 25일 전 세계 독점 공개  |  NETFLIX ORIGINAL", info, (140, 140, 140))

img.save(OUT, quality=95)
print(f"saved {OUT} ({img.size[0]}x{img.size[1]})")
