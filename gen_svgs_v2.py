import os

svg_base_dir = r"d:\git\เกมแววูฟ\assets"

def write_svg(name, content):
    with open(os.path.join(svg_base_dir, name), "w", encoding="utf-8") as f:
        f.write(content.strip())

# --- Houses (3/4 Perspective) ---
houses = {
    # 1. Bedroom
    "obj-house-bedroom-wall.svg": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
  <path d="M10,110 L110,110 L110,50 L10,50 Z" fill="#3a3026" stroke="#1c1610" stroke-width="4" stroke-linejoin="round"/>
  <!-- Door -->
  <path d="M45,110 L45,70 L75,70 L75,110" fill="#1c1610" stroke="#1c1610" stroke-width="3"/>
  <!-- Window -->
  <rect x="20" y="70" width="15" height="20" fill="#7a6245" stroke="#1c1610" stroke-width="2"/>
  <line x1="20" y1="80" x2="35" y2="80" stroke="#1c1610" stroke-width="2"/>
  <!-- Wood grain -->
  <path d="M85,60 Q95,70 90,90" stroke="#261e16" stroke-width="2" fill="none"/>
</svg>""",
    "obj-roof-bedroom.svg": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
  <path d="M0,60 L60,10 L120,60 L110,60 L110,50 L10,50 L10,60 Z" fill="#2d251d" stroke="#1c1610" stroke-width="4" stroke-linejoin="round"/>
  <path d="M10,50 L60,20 L110,50" fill="#3a3026" stroke="#1c1610" stroke-width="2"/>
  <path d="M40,30 L45,45 M70,35 L65,50" stroke="#1c1610" stroke-width="2" opacity="0.6" stroke-linecap="round"/>
</svg>""",

    # 2. Kitchen
    "obj-house-kitchen-wall.svg": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
  <path d="M10,110 L110,110 L110,50 L10,50 Z" fill="#4a3e30" stroke="#1c1610" stroke-width="4" stroke-linejoin="round"/>
  <path d="M45,110 L45,70 L75,70 L75,110" fill="#1c1610" stroke="#1c1610" stroke-width="3"/>
  <!-- Firewood stacked outside -->
  <circle cx="90" cy="100" r="6" fill="#5c452e" stroke="#1c1610" stroke-width="2"/>
  <circle cx="100" cy="100" r="6" fill="#5c452e" stroke="#1c1610" stroke-width="2"/>
  <circle cx="95" cy="90" r="6" fill="#5c452e" stroke="#1c1610" stroke-width="2"/>
</svg>""",
    "obj-roof-kitchen.svg": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
  <path d="M0,60 L60,15 L120,60 L110,60 L110,50 L10,50 L10,60 Z" fill="#3a2525" stroke="#1c1610" stroke-width="4" stroke-linejoin="round"/>
  <path d="M10,50 L60,25 L110,50" fill="#4f3333" stroke="#1c1610" stroke-width="2"/>
  <!-- Chimney -->
  <path d="M80,10 L95,10 L95,40 L80,40 Z" fill="#2d2a2a" stroke="#1c1610" stroke-width="3"/>
  <circle cx="85" cy="0" r="10" fill="#1c1610" opacity="0.4" filter="blur(2px)"/>
</svg>""",

    # 3. Library
    "obj-house-library-wall.svg": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
  <path d="M10,110 L110,110 L110,50 L10,50 Z" fill="#363940" stroke="#1c1610" stroke-width="4" stroke-linejoin="round"/>
  <path d="M45,110 L45,70 L75,70 L75,110" fill="#1c1610" stroke="#1c1610" stroke-width="3"/>
  <!-- Large Window -->
  <path d="M85,60 L100,60 L100,90 L85,90 Z" fill="#a37b38" stroke="#1c1610" stroke-width="2"/>
  <line x1="85" y1="75" x2="100" y2="75" stroke="#1c1610" stroke-width="2"/>
</svg>""",
    "obj-roof-library.svg": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
  <path d="M5,60 L60,5 L115,60 L110,60 L110,50 L10,50 L10,60 Z" fill="#1d262d" stroke="#10131c" stroke-width="4" stroke-linejoin="round"/>
  <path d="M10,50 L60,15 L110,50" fill="#28333d" stroke="#10131c" stroke-width="2"/>
  <!-- Dormer Window -->
  <path d="M50,45 L60,35 L70,45 L70,55 L50,55 Z" fill="#363940" stroke="#10131c" stroke-width="2"/>
  <circle cx="60" cy="48" r="4" fill="#a37b38" stroke="#10131c" stroke-width="2"/>
</svg>""",

    # 4. Storehouse
    "obj-house-storehouse-wall.svg": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
  <path d="M5,110 L115,110 L115,50 L5,50 Z" fill="#5a4d3d" stroke="#1c1610" stroke-width="4" stroke-linejoin="round"/>
  <!-- Wide double doors -->
  <path d="M35,110 L35,65 L85,65 L85,110" fill="#1c1610" stroke="#1c1610" stroke-width="3"/>
  <line x1="60" y1="65" x2="60" y2="110" stroke="#2d251d" stroke-width="2"/>
</svg>""",
    "obj-roof-storehouse.svg": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
  <path d="M-5,60 L20,30 L100,30 L125,60 L115,60 L115,50 L5,50 L5,60 Z" fill="#4a3e30" stroke="#1c1610" stroke-width="4" stroke-linejoin="round"/>
  <path d="M5,50 L25,40 L95,40 L115,50" fill="#5a4d3d" stroke="#1c1610" stroke-width="2"/>
  <path d="M30,35 L30,55 M90,35 L90,55" stroke="#1c1610" stroke-width="2" opacity="0.4"/>
</svg>""",

    # 5. Elder
    "obj-house-elder-wall.svg": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
  <path d="M15,110 L105,110 L105,50 L15,50 Z" fill="#403c35" stroke="#1c1610" stroke-width="4" stroke-linejoin="round"/>
  <path d="M45,110 L45,70 L75,70 L75,110" fill="#1c1610" stroke="#1c1610" stroke-width="3"/>
  <!-- Crooked cracks -->
  <path d="M25,50 L20,70 L28,80 L22,100" stroke="#1c1610" stroke-width="2" fill="none"/>
</svg>""",
    "obj-roof-elder.svg": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
  <!-- Crooked sagging roof -->
  <path d="M0,60 Q30,20 60,10 Q90,30 120,60 L105,60 L105,50 L15,50 L15,60 Z" fill="#26231d" stroke="#100f0c" stroke-width="4" stroke-linejoin="round"/>
  <path d="M15,50 Q60,35 105,50" fill="#38332a" stroke="#100f0c" stroke-width="2"/>
</svg>""",

    # 6. Workshop
    "obj-house-workshop-wall.svg": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
  <path d="M10,110 L110,110 L110,50 L10,50 Z" fill="#4d4c4a" stroke="#1c1610" stroke-width="4" stroke-linejoin="round"/>
  <path d="M45,110 L45,70 L75,70 L75,110" fill="#1c1610" stroke="#1c1610" stroke-width="3"/>
  <!-- Metal patch -->
  <path d="M85,75 L100,75 L95,95 L80,95 Z" fill="#696866" stroke="#1c1610" stroke-width="2"/>
  <circle cx="85" cy="80" r="1" fill="#1c1610"/> <circle cx="95" cy="80" r="1" fill="#1c1610"/>
</svg>""",
    "obj-roof-workshop.svg": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
  <!-- Asymmetric flatish roof with metal texture -->
  <path d="M0,60 L20,20 L100,25 L120,60 L110,60 L110,50 L10,50 L10,60 Z" fill="#353b40" stroke="#101114" stroke-width="4" stroke-linejoin="round"/>
  <path d="M10,50 L25,35 L95,40 L110,50" fill="#474e54" stroke="#101114" stroke-width="2"/>
  <!-- Corrugated lines -->
  <line x1="30" y1="35" x2="20" y2="55" stroke="#101114" stroke-width="2" opacity="0.5"/>
  <line x1="50" y1="37" x2="40" y2="55" stroke="#101114" stroke-width="2" opacity="0.5"/>
  <line x1="70" y1="38" x2="60" y2="55" stroke="#101114" stroke-width="2" opacity="0.5"/>
</svg>"""
}

# --- Ground Tiles (Texture & Depth) ---
tiles = {
    "tile-grass.svg": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" fill="#333b2a"/>
  <!-- Dirt patches -->
  <path d="M10,10 Q20,0 30,10 Q20,20 10,10 Z" fill="#2d251d" opacity="0.6"/>
  <path d="M40,50 Q50,40 60,50 Q50,60 40,50 Z" fill="#2d251d" opacity="0.6"/>
  <!-- Grass tufts -->
  <path d="M15,40 Q13,35 10,32 M15,40 Q17,33 20,32 M15,40 L15,30" stroke="#1d2417" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M45,20 Q43,15 40,12 M45,20 Q47,13 50,12 M45,20 L45,10" stroke="#1d2417" stroke-width="2" fill="none" stroke-linecap="round"/>
</svg>""",
    "tile-path.svg": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" fill="#2d251d"/>
  <!-- Footprint grooves / ruts -->
  <path d="M0,20 Q32,30 64,20" stroke="#1c1610" stroke-width="4" fill="none" opacity="0.5"/>
  <path d="M0,45 Q32,35 64,45" stroke="#1c1610" stroke-width="4" fill="none" opacity="0.5"/>
  <!-- Pebbles -->
  <circle cx="20" cy="10" r="2" fill="#1c1610"/>
  <circle cx="50" cy="55" r="1.5" fill="#1c1610"/>
  <circle cx="40" cy="25" r="1" fill="#1c1610"/>
  <circle cx="15" cy="35" r="2.5" fill="#1c1610"/>
</svg>""",
    "tile-floor.svg": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" fill="#3a3026"/>
  <!-- Planks -->
  <line x1="0" y1="16" x2="64" y2="16" stroke="#1c1610" stroke-width="2"/>
  <line x1="0" y1="32" x2="64" y2="32" stroke="#1c1610" stroke-width="2"/>
  <line x1="0" y1="48" x2="64" y2="48" stroke="#1c1610" stroke-width="2"/>
  <!-- Nails and staggered joints -->
  <line x1="20" y1="0" x2="20" y2="16" stroke="#1c1610" stroke-width="2"/>
  <circle cx="16" cy="4" r="1" fill="#1c1610"/> <circle cx="24" cy="4" r="1" fill="#1c1610"/>
  <line x1="50" y1="16" x2="50" y2="32" stroke="#1c1610" stroke-width="2"/>
  <circle cx="46" cy="20" r="1" fill="#1c1610"/> <circle cx="54" cy="20" r="1" fill="#1c1610"/>
  <line x1="10" y1="32" x2="10" y2="48" stroke="#1c1610" stroke-width="2"/>
  <line x1="40" y1="48" x2="40" y2="64" stroke="#1c1610" stroke-width="2"/>
  <!-- Wood grain -->
  <path d="M5,8 Q15,10 25,8" stroke="#261e16" stroke-width="1" fill="none"/>
  <path d="M15,40 Q30,42 45,40" stroke="#261e16" stroke-width="1" fill="none"/>
</svg>"""
}

# --- Characters (-3 and -4 Fixed as Full Body) ---
chars = {
    # Villager
    "char-villager-3.svg": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 64">
  <circle cx="24" cy="18" r="10" fill="#a08c6e" stroke="#12100e" stroke-width="2"/>
  <path d="M18,28 Q24,42 30,28 Z" fill="#695c47" stroke="#12100e" stroke-width="2"/>
  <path d="M14,64 L24,46 L34,64" stroke="#12100e" stroke-width="4" fill="none" stroke-linecap="round"/>
  <!-- Left arm swing forward -->
  <path d="M16,30 L10,40" stroke="#12100e" stroke-width="3" stroke-linecap="round"/>
  <path d="M32,30 L38,40" stroke="#12100e" stroke-width="3" stroke-linecap="round"/>
</svg>""",
    "char-villager-4.svg": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 64">
  <circle cx="24" cy="17" r="10" fill="#a08c6e" stroke="#12100e" stroke-width="2"/>
  <path d="M18,27 Q24,41 30,27 Z" fill="#695c47" stroke="#12100e" stroke-width="2"/>
  <path d="M20,64 L24,46 L28,64" stroke="#12100e" stroke-width="4" fill="none" stroke-linecap="round"/>
  <!-- Arms swing back -->
  <path d="M16,29 L14,42" stroke="#12100e" stroke-width="3" stroke-linecap="round"/>
  <path d="M32,29 L34,42" stroke="#12100e" stroke-width="3" stroke-linecap="round"/>
</svg>""",
    
    # Wolf
    "char-wolf-3.svg": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 64">
  <circle cx="24" cy="18" r="12" fill="#3b2b2b" stroke="#12100e" stroke-width="2"/>
  <circle cx="20" cy="16" r="2" fill="#ff0000"/><circle cx="28" cy="16" r="2" fill="#ff0000"/>
  <path d="M16,30 Q24,46 32,30 Z" fill="#7a1c1c" stroke="#12100e" stroke-width="2"/>
  <path d="M12,64 L24,46 L36,64" stroke="#12100e" stroke-width="5" fill="none" stroke-linecap="round"/>
  <path d="M14,32 L6,42 M34,32 L42,42" stroke="#12100e" stroke-width="4" stroke-linecap="round"/>
</svg>""",
    "char-wolf-4.svg": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 64">
  <circle cx="24" cy="17" r="12" fill="#3b2b2b" stroke="#12100e" stroke-width="2"/>
  <circle cx="20" cy="15" r="2" fill="#ff0000"/><circle cx="28" cy="15" r="2" fill="#ff0000"/>
  <path d="M16,29 Q24,45 32,29 Z" fill="#7a1c1c" stroke="#12100e" stroke-width="2"/>
  <path d="M18,64 L24,46 L30,64" stroke="#12100e" stroke-width="5" fill="none" stroke-linecap="round"/>
  <path d="M14,31 L10,44 M34,31 L38,44" stroke="#12100e" stroke-width="4" stroke-linecap="round"/>
</svg>""",

    # Seer
    "char-seer-3.svg": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 64">
  <path d="M12,64 L24,10 L36,64 Z" fill="#3b4e8a" stroke="#1c264a" stroke-width="2" stroke-linejoin="round"/>
  <circle cx="24" cy="22" r="8" fill="#12100e"/>
  <circle cx="24" cy="22" r="2" fill="#d6dfff"/>
  <!-- Leg peeking out -->
  <path d="M18,64 L24,55 L30,64" stroke="#12100e" stroke-width="4" fill="none" stroke-linecap="round"/>
</svg>""",
    "char-seer-4.svg": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 64">
  <path d="M14,64 L24,8 L34,64 Z" fill="#3b4e8a" stroke="#1c264a" stroke-width="2" stroke-linejoin="round"/>
  <circle cx="24" cy="20" r="8" fill="#12100e"/>
  <circle cx="24" cy="20" r="2" fill="#d6dfff"/>
  <!-- Leg peeking out alternate -->
  <path d="M20,64 L24,55 L28,64" stroke="#12100e" stroke-width="4" fill="none" stroke-linecap="round"/>
</svg>"""
}

for d in [houses, tiles, chars]:
    for name, content in d.items():
        write_svg(name, content)
        print(f"Written {name}")
