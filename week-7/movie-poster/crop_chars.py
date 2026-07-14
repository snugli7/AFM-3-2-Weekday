#!/usr/bin/env python3
"""주상욱/손나은 콜라주(640x640)를 인물별로 분할"""
from PIL import Image
src = Image.open("stills/juson_combined.jpg").convert("RGB")
# (left, top, right, bottom)
crops = {
    "jisub_extra.jpg": (0, 0, 396, 318),      # 소지섭 (상반신)
    "juwang.jpg":      (398, 8, 638, 316),     # 주상욱 (주강찬)
    "sonnaeun.jpg":    (232, 324, 636, 636),   # 손나은 (정상아)
    "woman2.jpg":      (2, 322, 228, 636),     # 여성 인물
}
for name, box in crops.items():
    src.crop(box).save(f"stills/{name}", quality=95)
    print("saved", name, box)
