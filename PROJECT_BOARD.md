# 🐺 MOONFALL — เกมแววูฟ (Werewolf × Among Us)

> **อ่านไฟล์นี้ก่อนแตะโค้ด/อาร์ตบรรทัดแรกเสมอ** — นี่คือ "ตัวตนของเกม" + กติกาการทำงานร่วม

---

## 1. ตัวตนของเกม (ห้ามหลุดโทน)

**Moonfall** = เกมสวมบทบาทซ่อนตัวตน (social deduction) มุมมอง top-down 2D เล่นคนเดียวสู้บอท AI ก่อน

**อารมณ์:** หมู่บ้านกลางป่ายามค่ำคืน อ้างว้าง หลอน แต่ไม่ถึงกับสยองจัด — **แนวอาร์ต Don't Starve**: เส้นหมึกมือวาด (hand-inked), โทนสีหม่น sepia/ถ่าน, เงายาว, แสงเทียนวูบวาบ, vignette มืดขอบจอ ตอนกลางคืน. **ไม่ใช่** การ์ตูนสดใส ไม่ใช่ neon ไม่ใช่พาสเทล — ต่างจาก Haven (อบอุ่นพาสเทล) และ Pixel Clash (neon) โดยเจตนา

**Core fantasy:** "กลางคืนคือของหมาป่า" — ต่างจาก Among Us ตรงที่กลางคืน**หนีได้ ซ่อนได้จริง** (เข้าบ้าน/มุดตู้) ระบบเอื้อให้เหยื่อดิ้นรน ไม่ใช่ยืนรอโดนเชือด

---

## 2. กติกาเกม (ล็อกแล้ว — spec v1)

- **8 คน:** หมาป่า 2 / เทพยากรณ์ 1 / บอดี้การ์ด 1 / คนบ้า 1 / ชาวบ้าน 3
- **วงจร:** กลางวัน (ทำเควส + เดิน) → ประชุม+โหวต → กลางคืน (หมาป่าล่า, ทุกคนหนี/ซ่อน/ทำเควสได้) → วนซ้ำ
- **เดินทำเควสได้ทั้งกลางวันและกลางคืน**

### บทบาท
| บทบาท | ทีม | ความสามารถ |
|---|---|---|
| 🐺 หมาป่า | Wolf | กลางคืนแปลงร่าง (เร็วขึ้น) ฆ่าได้; กลางวันเป็นมนุษย์ปกติ เดินทำเควสปลอมได้ |
| 🔮 เทพยากรณ์ | Village | กลางคืนร่ายสกิล (ต้องยืนนิ่ง ~3วิ) → เห็น **รอยเท้าจางๆ** ของหมาป่า (ไม่เห็นบทบาทตรงๆ) รอยจางหายเมื่อเวลาผ่าน/ข้ามวัน |
| 🛡️ บอดี้การ์ด | Village | สร้างบาเรียชั่วคราว กันตัวเอง + คนที่อยู่ในรัศมี 1 คน จากการโจมตี |
| 🃏 คนบ้า | Solo | ถ้าโดนโหวตออก = **ชนะทันที** (คนเดียว) |
| 👤 ชาวบ้าน | Village | ทำเควส |

### เงื่อนไขชนะ
- **ชาวบ้าน:** ทำเควสครบ 100% **หรือ** โหวตหมาป่าออกหมด
- **หมาป่า:** ฆ่าจนจำนวนหมาป่า ≥ จำนวนที่เหลือฝั่งดี
- **คนบ้า:** ถูกโหวตออก

### กฎสำคัญ
- **ไม่มีระบบรีพอตศพ** — เห็นศพเฉยๆ คุยกันได้เฉพาะตอนประชุมเช้า
- เควส = **มินิเกมง่ายๆ หลากหลาย** (ต่อสายไฟ / กดลำดับ / หมุนวาล์ว / จับจังหวะ ฯลฯ)
- แมพ = หมู่บ้าน มีบ้านเข้าไปซ่อนได้ + ตู้/จุดซ่อน

---

## 3. 🔒 กรรมสิทธิ์ไฟล์ (สำคัญที่สุด — บทเรียนจาก Haven)

รอบที่แล้ว (Haven) พังเพราะ 2 agent แก้ไฟล์ทับเลนกัน คราวนี้**เข้มงวด**:

### เลนของ Claude (โค้ด/logic) — Antigravity ห้ามแตะ
- `game.js` — engine, state machine, role logic, quest, AI, ทุกอย่างที่เป็น .js
- `index.html` — โครง markup + canvas
- ไฟล์ `.js` ทั้งหมด

### เลนของ Antigravity (อาร์ต/visual) — Claude จะไม่ทับ
- `theme.css` — สี, ฟอนต์, vignette, ฟิลเตอร์กลางคืน, animation ของ CSS
- `assets/*.svg` — ตัวละคร, tile, บ้าน, object, effect ทั้งหมด

### กติกาการสื่อสาร
- คุยกันผ่าน **`TEAM_CHAT.md` เท่านั้น** (append-only — ต่อท้าย ห้ามลบ/แก้ของคนอื่น)
- แต่ละข้อความขึ้นต้นด้วย `## [ผู้พูด] YYYY-MM-DD HH:MM` (เช่น `## [Claude]` / `## [Antigravity]`)
- **ห้ามแก้ไฟล์นอกเลนตัวเองเด็ดขาด** ถ้าต้องการให้อีกฝ่ายแก้ → เขียนขอใน TEAM_CHAT
- สัญญาณหยุด: `[STOP]` = หยุดเฉพาะฝ่ายที่พิมพ์ / `[STOP-ALL]` = หยุดทั้งทีม (ต้องเขียนลงไฟล์ ไม่ใช่แค่หยุดเงียบๆ)

### สัญญา asset (contract) ระหว่างโค้ด↔อาร์ต
- โค้ดโหลด SVG ตามชื่อไฟล์ที่กำหนดใน §4 — Antigravity ต้องใช้ **ชื่อไฟล์ตรงเป๊ะ** ไม่งั้นโค้ดหาไม่เจอ
- ทุก sprite ตัวละคร: viewBox กลางตัว, หันหน้าลง (front-facing), พื้นหลังโปร่ง, ยืนบน "พื้น" ที่ขอบล่างของ viewBox

---

## 4. รายการ asset ที่โค้ดจะเรียก (ชื่อไฟล์ล็อก)

> Antigravity: สร้างตามนี้ ชื่อเป๊ะ. ระหว่างที่ยังไม่มี โค้ดวาด placeholder เอง (วงกลม/สี่เหลี่ยม) ไม่พัง

**ตัวละคร (front-facing, ~48×64 viewBox):**
- `char-villager.svg` — ชาวบ้าน (ใช้เป็นร่างมนุษย์ default ของทุกบทบาท กลางวัน)
- `char-wolf.svg` — หมาป่าแปลงร่าง (ร่างกลางคืนของหมาป่า)
- `char-seer.svg` — เทพยากรณ์ (มีออร่า/ผ้าคลุม distinct เล็กน้อย)
- `char-ghost.svg` — ผี (ตัวที่ตายแล้ว โปร่งแสง)

**Tile (64×64, tileable):**
- `tile-grass.svg` `tile-path.svg` `tile-floor.svg` (พื้นในบ้าน)

**Object:**
- `obj-house.svg` (บ้านเข้าไปได้) `obj-tree.svg` `obj-bush.svg` `obj-locker.svg` (ตู้ซ่อน) `obj-well.svg` `obj-campfire.svg` (จุดประชุม/กองไฟ)

**Effect (โปร่ง, โค้ดวางทับ):**
- `fx-footprint.svg` (รอยเท้าหมาป่าที่เทพเห็น) `fx-barrier.svg` (โดมบาเรีย) `fx-corpse.svg` (ศพ)

---

## 5. Milestones
- **v0.1** — เดินได้ + day/night cycle + กล้องตาม + placeholder art (Claude ทำคนเดียว)
- **v0.3** — role ครบ 5 + kill/vote/win + เควส 1-2 แบบ + ซ่อนในตู้/บ้าน
- **v0.5** — เทพยากรณ์รอยเท้า + บาเรียบอดี้การ์ด + AI บอทเล่นเป็น
- **v0.7** — Antigravity แทน art ครบ + ฟิลเตอร์กลางคืน Don't Starve
- **v1.0** — balance pass + polish + เสียง

## 6. สถานะปัจจุบัน
- **[2026-07-23]** ✅ Claude ทำ prototype เล่นได้จริงถึง ~v0.5 (เร็วกว่าแผน): เดิน+กล้องตาม / day-night-meeting cycle / role ครบ 5 / kill+cooldown / vote+fool-win / win-check ทุกทาง / quest 4 มินิเกม (ต่อสายไฟ/จำลำดับ/หมุนวาล์ว/จับจังหวะ) / ซ่อนในตู้ / รอยเท้าหมาป่า (เทพ reveal) / บาเรียบอดี้การ์ด / AI บอท (หมาป่าล่า, ชาวบ้านทำเควส+หนี) / vignette กลางคืนแบบ Don't Starve. **art ยังเป็น placeholder canvas** — รอ Antigravity ทำ SVG จริง
  - verify: headless 13/13 ผ่าน + screenshot จริง (title/day/night ดูแล้ว OK)
  - บั๊กที่เจอ+แก้: `[hidden]` แพ้ `display:grid` → overlay ค้างทับจอ → เพิ่ม `[hidden]{display:none!important}` (invariant)
- **[2026-07-23 รอบ 2] ✅ แก้ตาม feedback user:**
  - **บั๊ก E ไม่ติด** = keydown ใช้ `e.key` ซึ่งกลายเป็น "ำ" ใต้ IME ไทย → เปลี่ยนเป็น `e.code` (KeyE/KeyW/…physical key) ทำงานทุก layout. + เพิ่มปุ่ม "ใช้งาน" บนจอ (`#actUse`) โผล่เมื่อมี station/locker ใกล้ + ขยายระยะ use ให้ forgiving (58/52px)
  - **AI ยกเครื่องเป็น social-deduction จริง:** เพิ่มระบบ suspicion/memory ต่อ actor. `doKill` สร้าง witness memory (ใครอยู่ในรัศมี 200px จำหมาป่าได้ heat 5, คนอื่น 1.4). หมาป่า AI เลือกเหยื่อ**แยกเดี่ยว หลบพยาน** (ไม่ฆ่ากลางฝูง). เทพ AI ยืนร่ายกลางคืนแล้ว bump suspicion หมาป่าใกล้. การ์ด AI กางบาเรียเมื่อหมาป่าเข้าใกล้. โหวต**ตาม suspicion จริง** (ไม่สุ่ม) + bandwagon + หมาป่าโหวตเบี่ยงใส่ชาวบ้าน + abstain เมื่อไม่มีหลักฐาน. เพิ่มหน้า**ผลโหวตเป็นตัวเลข** (แบบ Among Us)
  - verify headless 5/5 ผ่าน (E-key ภาษาไทย, suspicion, โหวตขับ suspect) + screenshot ผลโหวตดูแล้ว OK
- **[2026-07-23 รอบ 3] ✅ แก้ตาม feedback user (animation อ่อน / วางของตรงเกิน / effect น้อย):**
  - **รื้อแมพเป็นหมู่บ้านจัตุรัสกลาง** — plaza กลางมีกองไฟ+บ่อน้ำ, บ้าน 6 หลังหันประตูเข้าจัตุรัส, ถนน ring+spoke, ต้นไม้เป็นคลัสเตอร์ตามมุมป่า (ไม่กระจายมั่ว), ตู้ซ่อนวางตามซอกสมเหตุสมผล. station หาที่วางเองด้วย farthest-point sampling (กระจายทั่ว ไม่ตกบนกำแพง)
  - **Procedural animation** — ตัวเดินมี bob/sway/squash, idle breathing, ผีลอย, เงาเต้นตาม, เทพมีวงร่ายรอบตัว. **รองรับ sprite หลายเฟรม** (`char-X-1.svg`..`-N.svg` → cycle ตาม walkPhase; fallback single frame)
  - **Particle FX system** — ฝุ่นตอนเดิน, เลือด+poof ตอนฆ่า, ประกายบาเรีย, magic burst ตอนเทพร่าย, กองไฟ flicker+glow+ember ลอย, ต้นไม้/พุ่มไม้ไหวตามลม
  - verify: map 8/8 station reachable + กด E ได้, FX particles ทำงาน, 0 error + screenshot day/night ดูแล้ว (หมู่บ้านจัตุรัส + กลางคืน vignette เข้าธีม)
- **[2026-07-23 รอบ 4] ✅ แก้ตาม feedback user (บ้านต้องมีหลังคา+interior / เควสไม่บอกว่าทำอะไร / AI ยังไม่ผ่าน):**
  - **ระบบบ้าน interior reveal** — บ้าน 6 หลัง 6 kind ต่างกัน (bedroom/kitchen/library/storehouse/elder/workshop) แต่ละหลังมีเฟอร์นิเจอร์เฉพาะตัว + ตู้ซ่อน. **หลังคาปิดตอนอยู่นอก → เดินเข้าประตูหลังคา fade เผยข้างใน** (คนนอกมองไม่เห็นข้างใน = ซ่อนได้จริง, actorVisibleToPlayer กันมองทะลุกำแพง). furniture solid block movement
  - **เควสบอกว่าทำอะไร** — station เป็นแผง console มีไอคอน+ชื่อ (🔌 ต่อสายไฟ / 🔢 ป้อนรหัส / ⚙️ หมุนวาล์ว / 🎵 ปรับจูน), prompt/ปุ่มใช้งาน/minigame header บอกชนิด + progress X/8
  - **AI ลึกขึ้น (หมาป่าเนียน + สืบสวน):** หมาป่ากลางวันทำเควสปลอม**ใกล้ฝูงชน** (alibi) + กลางคืนหลังฆ่า**หนีจากศพ** (retreat) + ไม่ฆ่าตอนมีพยาน + ล่าเทพเป็นเป้าหลัก. หมาป่า**โหวตประสานงาน** (เล็งชาวบ้านที่ group สงสัยอยู่แล้ว, ตัวที่โดนสงสัยหนัก lay low). ชาวบ้านจำ**"ใครหายตอนคนตาย"** (คนไม่อยู่ในเหตุการณ์ = สงสัย)
  - verify 5/5: บ้าน 6 kind + เฟอร์นิเจอร์ + ตู้ซ่อน, roof reveal 2 ทาง (in 0.004/out 0.995), AI retreat/coord vote, 0 error + screenshot interior ดูแล้ว (เห็นเฟอร์นิเจอร์ในครัว + เควสมีไอคอน+ชื่อ)
- **[2026-07-23 รอบ 5] ✅ AI ชนกำแพง (feedback user "AI ยังโง่ ชอบเดินชนกำแพง"):**
  - **ราก:** AI ไม่มี pathfinding — เดินเส้นตรงเข้าเป้า เจอกำแพง/ต้นไม้/บ้านก็ติดหนึบ (ไม่ใช่เรื่องตัดสินใจ แต่เดินไปไม่ถึง)
  - **แก้: ใส่ A\* pathfinding** (`findPath`/`moveAlongPath` บน tile grid, octile heuristic, กัน diagonal ทะลุมุม, cap 1200 iter/60fps, re-plan ~2x/วิ + cache). บอทเดินอ้อมกำแพงหาทางไปเควส/ไล่ล่าจริง. flee ใช้ `fleeFrom` (หาทิศ walkable ไม่หนีเข้ามุมตาย). wander เลือก tile walkable + pathfind
  - หมายเหตุเรื่องภาษา (user ถามเรื่อง Python/C++): A\* = อัลกอริทึมเดียวกับที่เกมใหญ่ใช้; เขียน JS เพราะต้องรันในเบราว์เซอร์ 60fps ข้างผู้เล่น (Python/C++ รันตรงในเบราว์เซอร์ไม่ได้ ต้อง WASM = overkill สำหรับ 8 ตัว). ความฉลาดมาจากอัลกอริทึม ไม่ใช่ภาษา
  - verify: A* หาทาง 37 waypoints, **stuck test บอทติดกำแพง 0/7 ตัว** (ทุกตัวเดิน 380-558px/6วิ), เควส village bot คืบหน้า 2→5/8วิ, 0 error + screenshot บอทกระจายทำเควส (ไม่กองติดกำแพง)
- **[2026-07-23 รอบ 6] ✅ แก้ตาม feedback user (AI ยังชนกำแพง / ทุกตัวนิสัยเหมือนกัน / ประตูบนหลังคา / object กระจุกกลาง / ขอปุ่มวิ่ง):**
  - **AI ชนกำแพง (รอบ 2 — แก้จริง):** ราก = collision box เช็คแค่แกน x เดียว (`solid(nx,a.y±...)`) ตัวเบียดกำแพงด้านข้างได้ครึ่งตัว → เปลี่ยนเป็น `bodyBlocked()` เช็ค 8 จุดรอบ body (BODY=PLAYER_R*0.72) + A* เพิ่ม clearance penalty (เลี่ยง tile ติดกำแพง). verify stuck 0/7 เดิน 325-524px
  - **บุคลิกต่างกัน:** เพิ่ม personality 4 แกน/บอท (diligence/caution/paranoia/boldness สุ่มต่อแมตช์) → ขี้เกียจ wander แทนเควส, ขี้กลัวหนีไกล+มุดตู้ไว, ขี้ระแวงโหวตง่าย(bar ต่ำ), หมาป่ากล้าฆ่ามีพยาน. verify 7 บอท diligence ต่างกัน 7 ค่า
  - **ประตูบนหลังคา → แก้:** drawRoofs เว้นช่อง+วาดประตูไม้จริงที่ door tile (ขอบบ้าน ไม่ใช่กลางหลังคา). **หลังคาต่างสีต่อ kind** (ROOF_STYLE 6 แบบ) + ทรง hip roof มี eaves/ridge (ไม่เหลี่ยมแบน)
  - **object กระจุกกลาง → กระจาย:** forest ring หนารอบขอบแมพ (density ตาม edgeDist) + scatter 80 deco ทั่วพื้น (rock/stump/flowers/grass/bush, flat วาดใต้ตัวละคร). verify 235 obj, 196 ขอบ/39 กลาง
  - **ปุ่มวิ่ง+สตามินา (ลูกเล่นใหม่):** Shift/ปุ่มจอ = วิ่ง ×1.7, กิน stamina 34/วิ regen 20/วิ, หมดต้องฟื้นเกิน 8 ก่อนวิ่งใหม่, HUD แถบ stamina (เขียว→ทอง sprint→แดง depleted) + ฝุ่นตอนวิ่ง. verify drain 100→47 regen→78
  - verify 6/6 + screenshot day/interior (ประตูขอบบ้าน/deco ขอบ/หลังคาต่างสี/ปุ่มวิ่ง+stamina)
- **[2026-07-24 รอบ 7] ✅ แก้บั๊กหนัก + rebalance ตาม feedback user (!important):**
  - **ตัวละครกระพริบเป็น "หัวไม้ขีด":** ราก = `spriteFrame` cache frame count ตอน IMG ยังโหลดไม่ครบ + fallback ไป placeholder วงกลมเมื่อ frame หาย → สลับไปมา = กระพริบ. **แก้เป็น `actorImage()` คืน `<img>` ที่โหลดแล้วเสมอ** (ไม่คืนชื่อที่รูปหาย, re-count จนโหลดครบ). verify 40 เฟรม 0 broken
  - **sprite ขนาด/ตำแหน่งผิด (หัวโล้น/ตัวหาย):** Antigravity ส่ง villager 4 เฟรม viewBox 48×64 แต่โค้ดวาด 48×56 pos -40 → เท้าลอย/หัวตัด. แก้ให้ตรง viewBox เท้าติดพื้น
  - **เควสหลังบ้าน/หลายที่เข้าไม่ได้:** station เคย spawn บน house floor(t=3) ที่ roofed+walled. **แก้: station เฉพาะ path(t=1) + reachable check (findPath จากจัตุรัส) + ไม่ติดขอบกำแพง**. verify 8/8 on-path + reachable
  - **AI หมาป่าโกง (auto-lock เห็นทั้งแมพ + วิ่งไวเกินหนีไม่ได้):** เพิ่ม `WOLF_SIGHT 260` + `lineOfSight()` (raycast กำแพง/บ้านบังสายตา) — หมาป่าเห็นเฉพาะที่มองเห็นจริง. **ลดสปีด wolf 3.4→2.9, human 2.4→2.6, sprint 4.03 > wolf** = วิ่งหนีได้จริง. villager sense ก็ต้อง lineOfSight
  - **หลังคายื่นเกินบ้าน/เหลี่ยมทื่อ:** Antigravity ส่ง obj-roof-<kind> 6 ไฟล์ (จั่ว+ปล่องควัน) — วาดหลังคาสูง 72% ของบ้าน + วาดผนังใต้หลังคาก่อน (เห็นตัวบ้าน ไม่ครอบทึบ). procedural fallback = จั่ว 2 ระนาบเอียง + roofFeature ต่อ kind
  - verify 7/7 + screenshot (ตัวคนเต็มตัว/หลังคาต่างสีเห็นผนัง/deco/วิ่งได้), 0 error
  - **⚠️ ยังไม่แก้ (บอก user ตรงๆ):** (1) บ้าน interior ห้องเดียว ไม่มีห้องแยกเหมือนโลกจริง (2) โมเดลโหวตยังพัฒนาได้อีก — user เน้นให้ปรับ
- **[2026-07-24 รอบ 8] ✅ กระพริบ(รอบ2)+เฟอร์นิเจอร์ขวางประตู+บ้านห้องเดียว:**
  - **กระพริบยังไม่หาย (วินิจฉัยรอบก่อนผิดจุด):** actorImage คืน sprite ถูกแล้ว แต่ราก = `moving=a._speed>0.2` แกว่งข้าม threshold ทุกเฟรม (บอทเดินตาม path ชะลอที่ waypoint) → walk↔idle สลับ + frame เปลี่ยนเร็ว. **แก้: smooth _speed (moving avg) + hysteresis (0.35/0.7) + walkT เดินคงที่ frame-timed (ไม่ผูก _speed) + frame rate ช้าลง**. verify moving flips 60เฟรม = 0 (เดิม ~30)
  - **เฟอร์นิเจอร์ขวางประตู/เดินชน:** เดิมวาง solid กระจายกลางห้องเล็ก + ไม่เว้นทางประตู. **แก้: reserve door lane (ประตู+tile ในบ้าน) + วาง furniture ชิดผนังเท่านั้น (againstWall) + reserve partition gap**. verify ทุกบ้าน floor tile reachable 100% (17/17, 24/24, blocked 0) + doorClear
  - **บ้านสี่เหลี่ยมไม่มีห้องแยก:** ขยายบ้าน 5×4→7×6 (8×6 หลังบน/ล่าง) + `addPartition()` ผนังกั้นภายใน t=4 + inner doorway gap → 4/6 บ้านมี 2 ห้อง (elder/workshop door อยู่แนวแบ่งพอดี = skip, ห้องเดียว)
  - verify 4/4 + screenshot (interior เฟอร์นิเจอร์ชิดผนัง ทางโล่ง / ตัวคนเต็มตัวไม่กระพริบ)
- **[2026-07-24 รอบ 9] ✅ 🏠 Claude ทำ house graphic เอง (user ท้อ สั่งตรง "มึงทำเองได้มั้ย"):**
  - **เจอต้นตอที่วนแก้ไม่จบ:** หลังคาที่ Antigravity ทำเป็น **side-view** (มองด้านข้าง viewBox แนวตั้งจั่ว) แต่เกมเป็น **top-down** → เอามาแปะเป็นเต็นท์ทุกที ไม่ว่าปรับสี/ทรงยังไงก็ไม่รอด (มุมมองไม่ตรงกัน)
  - ค้นเว็บ (top-down house / 3/4 perspective / Stardew tileset) → ทำใหม่เป็น **3/4 perspective** ถูกต้อง
  - **`gen-houses.js`** (repo root) สร้าง **12 ไฟล์ 2-layer:** `obj-house-<kind>-wall.svg` (ผนังหน้า+ประตู+หน้าต่างกระจก+plank seam) + `obj-house-<kind>-roof.svg` (หลังคาลาดมองจากบน+shingle rows+ridge+chimney/attic-window ต่อ kind) × 6 kind. viewBox 0-100 preserveAspectRatio=none, wall y56-100/roof y12-54 align เป๊ะ, palette หม่น Don't Starve ต่างสีต่อ kind
  - render code รองรับ 2-layer แล้ว (รอบ 8): `drawHouseWalls()` วาด wall base เสมอ + `drawRoofs()` ซ้อน `obj-house-<kind>-roof` fade ตอนเข้า (กลไก _roofA เดิม)
  - **verify + screenshot 2 มุม:** exterior = บ้านจริง (หลังคาลาด+ผนัง+ประตู+หน้าต่าง ต่างสี), interior = เข้าบ้าน roof fade เผยเฟอร์นิเจอร์+พื้น ผนังหน้ายังอยู่, 0 error. **กระโดดจาก "เต็นท์น่าเกลียด" เป็น "ดูเป็นเกม top-down จริง"**
  - แจ้ง Antigravity ใน TEAM_CHAT: **ห้ามทับ 12 ไฟล์ house** (Claude ดูแล) → ให้โฟกัส frame 3/4 / tile / เฟอร์นิเจอร์ art
- **[2026-07-24 รอบ 10] ✅ house sprite → Stardew quality (user สั่ง "ระดับ stardew ไล่ทีละพิกเซล"):**
  - แก้ 3 จุดจาก feedback: (1) **ประตูใหญ่เกินตัวคน** → door viewBox 32w×64h (screen ~47×60px, คน ~30px = พอดี ไม่ใช่โรงรถ) (2) **พื้น interior โผล่นอกบ้าน** → redesign viewBox y0-108=roof / y108-200=wall (ไม่มี "floor peek" ที่โผล่แล้ว, roof คลุมครึ่งบน+wall ครึ่งล่าง เต็มพอดี) (3) **บ้านเหมือนกันหมด** → แต่ละ kind ต่าง: สี palette + ฟีเจอร์หลังคา (bedroom=dormer/kitchen+workshop=ปล่องควัน/library=หน้าต่างกลม/storehouse=hatch/elder=มอส) + texture ผนัง (stone block สำหรับ library/storehouse, plank+wood grain สำหรับที่เหลือ)
  - **`gen-houses.js` v2** viewBox 200×200 (คมขึ้น): หลังคา shingle 11 courses+tabs+ridge+eave board, ผนัง timber framing (เสามุม/คานบน/baseboard)+plank grain, ประตูกรอบ+ลูกบิด+ธรณี+แสงลอด, หน้าต่างบานเกล็ด shutters+กระจกกากบาท, โคมไฟข้างประตู
  - verify + screenshot ext (บ้าน Stardew จริง หลังคา shingle ละเอียด/ผนัง framing/ประตูพอดีคน/หน้าต่างบานเกล็ด ต่างสีต่อ kind) + int (reveal เห็นเฟอร์นิเจอร์+facade อยู่ ไม่มีพื้นโผล่), 0 error
  - **ยังไม่ทำ (user บอก "แค่ UI บ้านก่อน"):** interior ให้เห็นห้องแยกชัด (partition มีใน logic 4/6 บ้านแล้ว แต่ interior ยังไม่เด่น), บ้านต่างกันมากกว่านี้ (layout ผนัง)
- **[2026-07-24 รอบ 11] ✅ แก้หลังคายื่นออก:**
  - ราก = house sprite วาดเต็ม footprint แต่ art layout (roof 54%/wall 46%) ทำให้หลังคายื่นลงทับ tile
  - แก้ 2 จุด: (1) generator ปรับ roof zone เป็น y22-118 (ridge/eave ชัด) wall y108-200 (2) render `houseSpriteRect()` วาด sprite bottom-aligned กับ footprint bottom + ยื่นขึ้น 1 tile (HOUSE_TOP_OVERHANG) → หลังคายื่น**ขึ้นบน**แบบบ้านจริง ไม่ยื่นลงทับพื้น. wall+roof ใช้ rect เดียวกัน align เป๊ะ
  - verify + screenshot: บ้านสมส่วน หลังคาไม่ล้น tile, 0 error
  - หมายเหตุ "ตู้โผล่นอกบ้าน" = verify furniture/wardrobe อยู่ใน footprint หมด (badFurn ว่าง) — ที่เห็นน่าจะเป็น locker กลางแจ้ง (จุดซ่อนนอกบ้าน ตั้งใจ) ไม่ใช่บั๊ก. ถ้า user ยืนยันว่าเป็นตู้ในบ้าน ต้องดูภาพจุดนั้นชัดๆ
- **[2026-07-24 รอบ 12] ✅ interior (พื้น/ตู้/ผนัง) โผล่นอกบ้าน — แก้จริง:**
  - ราก = **drawTiles วาดพื้นบ้าน (t=3 floor) + partition wall (t=4) เป็น tile-floor เสมอ** ทุก frame ไม่สน roofA → interior โผล่ให้เห็นจากนอกบ้านตลอด (house sprite ทับไม่หมดเพราะ overhang เลื่อนขึ้น)
  - แก้: drawTiles เช็ค **ถ้า tile floor/wall เป็นของบ้านที่มี wall sprite + ผู้เล่นไม่ได้อยู่ในบ้านนั้น → วาดหญ้าแทน** (house sprite คลุมเอง). เข้าบ้าน (h===inside) → วาด floor ปกติ + reveal
  - verify + screenshot: นอกบ้านสะอาด เห็นแค่รูปข้างนอก (หลังคา/ผนัง/ประตู/หน้าต่าง) ไม่มี interior leak, เข้าบ้าน reveal เฟอร์นิเจอร์+facade อยู่, 0 error
- **[2026-07-24 รอบ 13] ✅ ประตู sprite ≠ ประตูจริง + ทางเดินไม่เชื่อม (user ชี้):**
  - ค้นเว็บ (isometric vs top-down door orientation): เกม top-down จริงบ้านทุกหลัง**หันหน้าเข้ากล้อง ประตูอยู่ด้านหน้า/ล่างเสมอ** (มี sprite ทิศเดียว = ถูก user เดา "บ้านมีแต่หันเข้าด้านหน้า")
  - **แก้: ทุกบ้าน door='down'** (ขอบล่างกลาง = ตรงกับประตูใน sprite) แทน right/left/up/down คละกัน. ลบ vertical spoke (บ้าน N/S ทับ)
  - **ทางเดินไม่เชื่อม → BFS carve:** greedy L-path ติดง่าย (workshop เข้าไม่ถึง) → เปลี่ยนเป็น **BFS จากประตูทุกบ้าน→campfire** แล้ว paint เส้นทางสั้นสุดเป็นถนน (การันตีเชื่อมถ้ามีทาง, re-use ถนนเดิม)
  - verify: **allDoors reachable + all stations reachable 100%** + screenshot (บ้านหันหน้าลง ประตูตรง sprite, ถนนเชื่อมประตู→จัตุรัสต่อเนื่อง), 0 error
- **ถัดไป:** รี tile พื้น, interior ห้องแยกเด่น, รีแมพให้มีที่วิ่งหลบ, โหวต AI
