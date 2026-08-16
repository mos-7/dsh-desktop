#!/usr/bin/env python3
"""生成应用图标: 512x512 png + 多尺寸 ico"""
from PIL import Image, ImageDraw, ImageFont

SIZE = 512


def rounded_rect_gradient(size, c1, c2, radius):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    # 垂直渐变
    for y in range(size):
        t = y / size
        r = int(c1[0] + (c2[0] - c1[0]) * t)
        g = int(c1[1] + (c2[1] - c1[1]) * t)
        b = int(c1[2] + (c2[2] - c1[2]) * t)
        for x in range(size):
            img.putpixel((x, y), (r, g, b, 255))
    # 圆角遮罩
    mask = Image.new("L", (size, size), 0)
    d = ImageDraw.Draw(mask)
    d.rounded_rectangle([0, 0, size - 1, size - 1], radius=radius, fill=255)
    out = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    out.paste(img, (0, 0), mask)
    return out


def find_font(size):
    for p in [
        r"C:\Windows\Fonts\segoeuib.ttf",
        r"C:\Windows\Fonts\segoeui.ttf",
        r"C:\Windows\Fonts\arialbd.ttf",
        r"C:\Windows\Fonts\arial.ttf",
    ]:
        try:
            return ImageFont.truetype(p, size)
        except Exception:
            continue
    return ImageFont.load_default()


img = rounded_rect_gradient(SIZE, (36, 58, 96), (76, 141, 255), radius=110)
d = ImageDraw.Draw(img)

# 中间一个圆角聊天气泡 + 省略号, 更像"聊天"
bubble = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
bd = ImageDraw.Draw(bubble)
bd.rounded_rectangle([110, 150, 402, 360], radius=48, fill=(255, 255, 255, 255))
bd.polygon([(150, 340), (150, 420), (230, 350)], fill=(255, 255, 255, 255))
# 三个点
dot_r = 26
for cx in (190, 256, 322):
    bd.ellipse([cx - dot_r, 255 - dot_r, cx + dot_r, 255 + dot_r], fill=(76, 141, 255, 255))
img = Image.alpha_composite(img, bubble)

img.save("icon.png", "PNG")
# 多尺寸 ico
img.save("icon.ico", sizes=[(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)])
print("icon.png + icon.ico 生成完成")
