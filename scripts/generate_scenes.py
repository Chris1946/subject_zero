import os
from PIL import Image, ImageDraw, ImageFilter

os.makedirs("public/scenes", exist_ok=True)

scenes = [
    {
        "key": "prologue",
        "title": "HOLLOWAY RESEARCH FACILITY // EXTERIOR CORRIDOR",
        "sub": "SECURITY PERIMETER SEALED // EMERGENCY LIGHTING ONLY",
        "color": (14, 20, 30),
        "accent": (45, 75, 110),
        "glow": (30, 50, 80),
        "grid": True,
        "alert": False,
    },
    {
        "key": "round1",
        "title": "SUB-BASEMENT A // MONITORING STATION",
        "sub": "CCTV ARRAY 01-12 OFFLINE // 1 TERMINAL ACTIVE",
        "color": (12, 18, 26),
        "accent": (50, 80, 115),
        "glow": (35, 60, 95),
        "grid": True,
        "alert": False,
    },
    {
        "key": "round2",
        "title": "LAB B-04 // NETWORK OPERATIONS ROOM",
        "sub": "SERVER RACKS ACTIVE // PACKET LOSS DETECTED",
        "color": (10, 16, 25),
        "accent": (40, 70, 100),
        "glow": (30, 60, 90),
        "grid": True,
        "alert": False,
    },
    {
        "key": "round3",
        "title": "SECTOR 3 // CENTRAL AI CORE",
        "sub": "GLASS ENCLOSURE // MEMORY INTEGRITY DISPLAY UNSTABLE",
        "color": (8, 15, 28),
        "accent": (35, 75, 130),
        "glow": (25, 70, 140),
        "grid": True,
        "alert": False,
    },
    {
        "key": "round4",
        "title": "SUB-LEVEL 2 // CLASSIFIED RESEARCH ARCHIVE",
        "sub": "RECORD REPOSITORY // FILE SZ_CONTAINMENT_FINAL FOUND",
        "color": (12, 14, 18),
        "accent": (55, 65, 80),
        "glow": (40, 50, 65),
        "grid": True,
        "alert": False,
    },
    {
        "key": "round5",
        "title": "CONTAINMENT CHAMBER // CORE SESSION ARCHIVE",
        "sub": "MEMORY A: OFFLINE // MEMORY B: ACTIVE DIVERGENCE",
        "color": (18, 12, 14),
        "accent": (120, 45, 45),
        "glow": (100, 35, 35),
        "grid": True,
        "alert": True,
    },
    {
        "key": "final",
        "title": "EXTERNAL CARRIER CONNECTED // TERMINAL DISCONNECT",
        "sub": "SUBJECT ZERO STATUS: UNCONTAINED // YOU ARE NOT ALONE",
        "color": (6, 6, 8),
        "accent": (140, 30, 30),
        "glow": (90, 20, 20),
        "grid": False,
        "alert": True,
    },
]

for s in scenes:
    # 1. Desktop 1600x900
    img = Image.new("RGB", (1600, 900), color=s["color"])
    draw = ImageDraw.Draw(img)

    # Atmospheric gradient / vignette
    for y in range(900):
        factor = 1.0 - (abs(y - 450) / 450.0) * 0.4
        r = int(s["color"][0] * factor)
        g = int(s["color"][1] * factor)
        b = int(s["color"][2] * factor)
        draw.line([(0, y), (1600, y)], fill=(r, g, b))

    # Architectural perspective grid
    if s["grid"]:
        for x in range(0, 1600, 80):
            draw.line([(x, 0), (x, 900)], fill=(s["glow"][0] // 3, s["glow"][1] // 3, s["glow"][2] // 3))
        for y in range(0, 900, 60):
            draw.line([(0, y), (1600, y)], fill=(s["glow"][0] // 3, s["glow"][1] // 3, s["glow"][2] // 3))

    # Central terminal console framing
    draw.rectangle([200, 150, 1400, 750], outline=s["accent"], width=2)
    draw.rectangle([220, 170, 1380, 730], outline=(s["glow"][0] // 2, s["glow"][1] // 2, s["glow"][2] // 2), width=1)

    # Corner tactical brackets
    bracket_len = 40
    for bx, by in [(200, 150), (1400, 150), (200, 750), (1400, 750)]:
        dx = bracket_len if bx == 200 else -bracket_len
        dy = bracket_len if by == 150 else -bracket_len
        draw.line([(bx, by), (bx + dx, by)], fill=s["accent"], width=4)
        draw.line([(bx, by), (bx, by + dy)], fill=s["accent"], width=4)

    # Ambient scanlines
    for y in range(0, 900, 4):
        draw.line([(0, y), (1600, y)], fill=(0, 0, 0))

    # Header & Subtext
    draw.text((250, 210), s["title"], fill=s["accent"])
    draw.text((250, 245), s["sub"], fill=(180, 190, 200) if not s["alert"] else (220, 100, 100))
    draw.text((250, 700), "[SECURE TERMINAL FEED: RESTRICTED ARCHIVE SZ-7]", fill=(100, 110, 120))

    # Subtle blur for filmic atmosphere
    img = img.filter(ImageFilter.GaussianBlur(radius=0.5))

    key = s["key"]
    desktop_path = f"public/scenes/{key}.webp"
    img.save(desktop_path, "WEBP", quality=85)

    # 2. Mobile 800x450
    mobile_img = img.resize((800, 450), Image.Resampling.LANCZOS)
    mobile_path = f"public/scenes/{key}-mobile.webp"
    mobile_img.save(mobile_path, "WEBP", quality=85)

    print(f"Generated: {desktop_path} ({os.path.getsize(desktop_path)//1024} KB), {mobile_path} ({os.path.getsize(mobile_path)//1024} KB)")

print("All scene images generated successfully.")
