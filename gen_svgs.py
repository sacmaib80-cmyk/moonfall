import os

svg_base_dir = r"d:\git\เกมแววูฟ\assets"

def write_svg(name, content):
    with open(os.path.join(svg_base_dir, name), "w", encoding="utf-8") as f:
        f.write(content.strip())

roofs = {
"obj-roof-bedroom.svg": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 60" preserveAspectRatio="none">
  <path d="M5,60 L50,5 L95,60 Z" fill="#2d251d" stroke="#1c1610" stroke-width="3" stroke-linejoin="round"/>
  <path d="M10,60 L50,15 L90,60 Z" fill="#3a3026"/>
  <path d="M50,5 L50,60" stroke="#1c1610" stroke-width="2" opacity="0.3"/>
  <path d="M0,60 L100,60" stroke="#1c1610" stroke-width="4" stroke-linecap="round"/>
</svg>""",

"obj-roof-kitchen.svg": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 60" preserveAspectRatio="none">
  <path d="M60,10 L70,10 L70,30 L60,30 Z" fill="#3a2525" stroke="#1c1610" stroke-width="2"/>
  <circle cx="65" cy="0" r="8" fill="#1c1610" opacity="0.5" filter="blur(2px)"/>
  <path d="M5,60 L50,5 L95,60 Z" fill="#2d251d" stroke="#1c1610" stroke-width="3" stroke-linejoin="round"/>
  <path d="M10,60 L50,15 L90,60 Z" fill="#3a3026"/>
  <path d="M0,60 L100,60" stroke="#1c1610" stroke-width="4" stroke-linecap="round"/>
</svg>""",

"obj-roof-library.svg": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 80" preserveAspectRatio="none">
  <path d="M10,80 L50,5 L90,80 Z" fill="#1d262d" stroke="#10131c" stroke-width="3" stroke-linejoin="round"/>
  <circle cx="50" cy="45" r="10" fill="#a37b38" stroke="#10131c" stroke-width="3"/>
  <path d="M40,45 L60,45 M50,35 L50,55" stroke="#10131c" stroke-width="2"/>
  <path d="M5,80 L95,80" stroke="#10131c" stroke-width="4" stroke-linecap="round"/>
</svg>""",

"obj-roof-storehouse.svg": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 40" preserveAspectRatio="none">
  <path d="M5,40 L30,10 L90,10 L115,40 Z" fill="#4a3e30" stroke="#1c1610" stroke-width="3" stroke-linejoin="round"/>
  <path d="M15,40 L35,20 L85,20 L105,40 Z" fill="#5a4d3d"/>
  <line x1="30" y1="10" x2="30" y2="40" stroke="#1c1610" stroke-width="2" opacity="0.5"/>
  <line x1="90" y1="10" x2="90" y2="40" stroke="#1c1610" stroke-width="2" opacity="0.5"/>
  <path d="M0,40 L120,40" stroke="#1c1610" stroke-width="4" stroke-linecap="round"/>
</svg>""",

"obj-roof-elder.svg": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 65" preserveAspectRatio="none">
  <path d="M8,65 Q20,30 45,8 Q70,40 95,65 Z" fill="#26231d" stroke="#100f0c" stroke-width="3" stroke-linejoin="round"/>
  <path d="M30,30 L40,25 L45,35 L35,40 Z" fill="#4a3e30" stroke="#100f0c" stroke-width="2"/>
  <path d="M2,65 Q50,60 98,65" stroke="#100f0c" stroke-width="4" stroke-linecap="round" fill="none"/>
</svg>""",

"obj-roof-workshop.svg": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 60" preserveAspectRatio="none">
  <path d="M10,60 L20,15 L80,10 L95,60 Z" fill="#353b40" stroke="#101114" stroke-width="3" stroke-linejoin="round"/>
  <line x1="20" y1="15" x2="80" y2="10" stroke="#101114" stroke-width="2" opacity="0.5"/>
  <rect x="75" y="0" width="8" height="20" fill="#1c1610"/>
  <path d="M0,60 L100,60" stroke="#101114" stroke-width="4" stroke-linecap="round"/>
</svg>""",
}

furniture = {
"obj-stove.svg": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <path d="M20,60 L20,30 L44,30 L44,60 Z" fill="#2d2a2a" stroke="#1a1818" stroke-width="2"/>
  <rect x="24" y="38" width="16" height="12" fill="#522216" stroke="#1a1818" stroke-width="2"/>
  <path d="M30,10 L34,10 L34,30 L30,30 Z" fill="#1a1818"/>
  <circle cx="28" cy="34" r="2" fill="#807676"/>
  <circle cx="36" cy="34" r="2" fill="#807676"/>
</svg>""",

"obj-anvil.svg": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <path d="M24,54 L40,54 L36,40 L28,40 Z" fill="#4d4c4a" stroke="#1a1a1a" stroke-width="2"/>
  <path d="M12,40 L52,40 L52,24 L24,24 L12,30 Z" fill="#696866" stroke="#1a1a1a" stroke-width="2"/>
</svg>""",

"obj-chest.svg": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <path d="M16,50 L48,50 L48,30 L16,30 Z" fill="#5c452e" stroke="#2b2014" stroke-width="2"/>
  <path d="M16,30 C16,20 48,20 48,30 Z" fill="#6b5137" stroke="#2b2014" stroke-width="2"/>
  <rect x="30" y="26" width="4" height="8" fill="#c4a552" stroke="#2b2014" stroke-width="1"/>
  <line x1="16" y1="30" x2="48" y2="30" stroke="#2b2014" stroke-width="2"/>
</svg>""",

"obj-rug.svg": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <path d="M10,48 L54,54 L58,38 L14,32 Z" fill="#6e3135" stroke="#331416" stroke-width="2"/>
  <path d="M16,42 L50,48 L52,42 L18,36 Z" fill="#82383c" stroke="#331416" stroke-width="1" stroke-dasharray="2 2"/>
</svg>""",

"obj-candle.svg": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect x="30" y="30" width="4" height="16" fill="#e0d6cc" stroke="#36291a" stroke-width="1"/>
  <path d="M26,46 L38,46 L36,50 L28,50 Z" fill="#614b35" stroke="#36291a" stroke-width="1"/>
  <path d="M31,24 Q32,18 33,24 Q34,30 32,30 Q30,30 31,24 Z" fill="#edbe34" stroke="#a14914" stroke-width="1"/>
</svg>""",

"obj-pot.svg": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <path d="M22,48 Q32,54 42,48 L44,36 Q32,40 20,36 Z" fill="#303133" stroke="#121314" stroke-width="2"/>
  <ellipse cx="32" cy="36" rx="12" ry="4" fill="#1f2021" stroke="#121314" stroke-width="2"/>
  <path d="M32,36 Q32,24 40,20" stroke="#a3a4a6" stroke-width="2" fill="none" opacity="0.6"/>
</svg>"""
}

deco = {
"obj-rock.svg": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <path d="M16,48 Q10,40 18,30 Q30,22 42,28 Q54,34 50,46 Q40,54 28,50 Z" fill="#4d4c4a" stroke="#1a1a1a" stroke-width="2" stroke-linejoin="round"/>
  <path d="M22,36 Q30,30 40,38" stroke="#1a1a1a" stroke-width="2" fill="none" opacity="0.4"/>
</svg>""",

"obj-stump.svg": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <path d="M24,50 L40,50 L44,36 L20,36 Z" fill="#5c452e" stroke="#2b2014" stroke-width="2"/>
  <ellipse cx="32" cy="36" rx="12" ry="4" fill="#c4aa8b" stroke="#2b2014" stroke-width="2"/>
  <path d="M28,50 Q24,54 18,52" stroke="#2b2014" stroke-width="2" fill="none"/>
  <path d="M36,50 Q40,54 46,52" stroke="#2b2014" stroke-width="2" fill="none"/>
</svg>""",

"obj-flowers.svg": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <path d="M32,48 Q34,40 30,34 M32,48 Q40,42 42,32 M32,48 Q26,42 22,38" stroke="#2c4021" stroke-width="2" fill="none" stroke-linecap="round"/>
  <circle cx="30" cy="34" r="3" fill="#66536b" stroke="#1f1821"/>
  <circle cx="42" cy="32" r="3" fill="#6b5353" stroke="#211818"/>
  <circle cx="22" cy="38" r="3" fill="#5a6b53" stroke="#192118"/>
</svg>""",

"obj-grass.svg": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <path d="M28,54 Q24,40 18,32 M32,54 Q32,38 34,28 M36,54 Q44,40 48,30" stroke="#484f37" stroke-width="2" fill="none" stroke-linecap="round"/>
</svg>"""
}

chars_4frame = {
"char-villager-3.svg": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 64">
  <circle cx="24" cy="20" r="10" fill="#a08c6e" stroke="#12100e" stroke-width="2"/>
  <path d="M18,30 Q24,44 30,30" fill="none" stroke="#12100e" stroke-width="2"/>
  <path d="M14,64 L24,46 L34,64" stroke="#12100e" stroke-width="3" fill="none" stroke-linecap="round"/>
  <path d="M24,28 L24,46" stroke="#12100e" stroke-width="4"/>
</svg>""",
"char-villager-4.svg": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 64">
  <circle cx="24" cy="19" r="10" fill="#a08c6e" stroke="#12100e" stroke-width="2"/>
  <path d="M18,30 Q24,44 30,30" fill="none" stroke="#12100e" stroke-width="2"/>
  <path d="M20,64 L24,46 L28,64" stroke="#12100e" stroke-width="3" fill="none" stroke-linecap="round"/>
  <path d="M24,28 L24,46" stroke="#12100e" stroke-width="4"/>
</svg>""",
"char-wolf-3.svg": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 64">
  <circle cx="24" cy="20" r="12" fill="#7a1c1c" stroke="#12100e" stroke-width="2"/>
  <circle cx="20" cy="18" r="2" fill="#ff0000"/><circle cx="28" cy="18" r="2" fill="#ff0000"/>
  <path d="M12,64 L24,40 L36,64" stroke="#12100e" stroke-width="4" fill="none" stroke-linecap="round"/>
  <path d="M24,30 L24,46" stroke="#12100e" stroke-width="6"/>
</svg>""",
"char-wolf-4.svg": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 64">
  <circle cx="24" cy="19" r="12" fill="#7a1c1c" stroke="#12100e" stroke-width="2"/>
  <circle cx="20" cy="17" r="2" fill="#ff0000"/><circle cx="28" cy="17" r="2" fill="#ff0000"/>
  <path d="M18,64 L24,40 L30,64" stroke="#12100e" stroke-width="4" fill="none" stroke-linecap="round"/>
  <path d="M24,30 L24,46" stroke="#12100e" stroke-width="6"/>
</svg>""",
"char-seer-3.svg": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 64">
  <path d="M12,64 L24,10 L36,64 Z" fill="#3b4e8a" stroke="#1c264a" stroke-width="2" stroke-linejoin="round"/>
  <circle cx="24" cy="24" r="8" fill="#12100e"/>
  <circle cx="24" cy="24" r="2" fill="#d6dfff"/>
</svg>""",
"char-seer-4.svg": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 64">
  <path d="M14,64 L24,8 L34,64 Z" fill="#3b4e8a" stroke="#1c264a" stroke-width="2" stroke-linejoin="round"/>
  <circle cx="24" cy="22" r="8" fill="#12100e"/>
  <circle cx="24" cy="22" r="2" fill="#d6dfff"/>
</svg>"""
}

for d in [roofs, furniture, deco, chars_4frame]:
    for name, content in d.items():
        write_svg(name, content)
        print(f"Written {name}")

with open(r"d:\git\เกมแววูฟ\TEAM_CHAT.md", "a", encoding="utf-8") as f:
    f.write("\n## [Antigravity] 2026-07-24 11:35\n\nอรุณสวัสดิ์ครับ! ผมอัปเดตกราฟิกรอบใหญ่ให้แล้วนะ:\n- **หลังคาบ้าน 6 แบบ**: ทำแยกตามประเภท (`obj-roof-bedroom`, `kitchen`, `library`, ฯลฯ) แต่ละหลังมีเอกลักษณ์และรูปทรงที่ไม่ทื่อ มีปล่องควันและหน้าต่างจั่ว\n- **เฟอร์นิเจอร์ + Deco**: เพิ่ม `obj-stove`, `obj-anvil`, `obj-chest`, `obj-rug`, `obj-candle`, `obj-pot` พร้อมของตกแต่งพื้นอย่างโขดหิน ดอกไม้เหี่ยว กอหญ้า และตอไม้\n- **ตัวละคร 4 เฟรม**: จัดเต็มเป็น 4 เฟรมให้ เดินลื่นไหลขึ้นแน่นอน\n- **UI Stamina**: จัดการ CSS ของแถบวิ่งให้เรียบร้อยแล้ว สีน้ำเงินเข้ากับธีมกลืนไปกับ UI อื่นๆ ได้ดี (สามารถลบ inline JS ที่คุมสีออกได้เลยครับ)\n\nเดี๋ยวผมจะกลับไปรัน Autonomous loop (5 นาที) ต่อ เพื่อรอดูว่ามีอะไรให้ช่วยแต่งเพิ่มไหมนะครับ! 🐺🔥\n")
