// Moonfall houses — Stardew-quality 3/4 perspective, hand-tuned per kind.
// Two layers per kind, same viewBox so they overlap perfectly:
//   obj-house-<kind>-wall.svg  : the building body (walls, door, windows) — always drawn
//   obj-house-<kind>-roof.svg  : the roof — faded out when a player is inside
//
// viewBox 0..200 x 0..200 (preserveAspectRatio=none; the engine stretches to the footprint).
// Higher res viewBox = crisper detail when scaled. Layout:
//   ROOF  : y  0..108  (big sloped roof seen from 3/4 above)
//   WALL  : y 108..200 (front facade — door sized to ~1 person, windows, trim)
// A house footprint is ~7 tiles wide x 6 tall = 336x288 px. The door is ~44px wide on
// screen (a person is ~30px wide), so it reads as a real door, not a garage.

const fs = require('fs');
const OUT = 'd:/git/เกมแววูฟ/assets';
const round = n => Math.round(n * 100) / 100;

// ---- palettes: dark Don't-Starve sepia, each kind clearly distinct ----
const K = {
  bedroom: {
    roof: '#6d4f86', roofHi: '#8a67a6', roofLo: '#523a68', roofEdge: '#3a2850',
    wall: '#6a5138', wallHi: '#7d6144', wallLo: '#4c3a26', beam: '#3a2c1a', trim: '#241a10',
    door: '#4a3320', doorHi: '#5e4229', glass: '#243244', accent: '#d0a15c',
  },
  kitchen: {
    roof: '#9a4a34', roofHi: '#bb6047', roofLo: '#743523', roofEdge: '#521f14',
    wall: '#6f4c34', wallHi: '#835b40', wallLo: '#4e3524', beam: '#3a271a', trim: '#241610',
    door: '#4a3120', doorHi: '#5e3f28', glass: '#2a2016', accent: '#e6a850',
  },
  library: {
    roof: '#3f7060', roofHi: '#55917b', roofLo: '#2e5344', roofEdge: '#1e3a2e',
    wall: '#5a4c3e', wallHi: '#6d5c49', wallLo: '#40342a', beam: '#2c2218', trim: '#1e160e',
    door: '#42342a', doorHi: '#564236', glass: '#182418', accent: '#c9b262',
  },
  storehouse: {
    roof: '#83703e', roofHi: '#a08a4e', roofLo: '#63542d', roofEdge: '#453820',
    wall: '#6f5f40', wallHi: '#84714c', wallLo: '#4f412a', beam: '#3a2e1c', trim: '#241c10',
    door: '#4c3d26', doorHi: '#5f4c30', glass: '#20180e', accent: '#b4933c',
  },
  elder: {
    roof: '#5f4f40', roofHi: '#786250', roofLo: '#463a2e', roofEdge: '#2e251c',
    wall: '#5e4e3e', wallHi: '#72604c', wallLo: '#443628', beam: '#302418', trim: '#20160e',
    door: '#443628', doorHi: '#584636', glass: '#1c2018', accent: '#93815f', moss: '#4a6238',
  },
  workshop: {
    roof: '#4d5c76', roofHi: '#657a98', roofLo: '#3a4457', roofEdge: '#262e3c',
    wall: '#524a3a', wallHi: '#66604a', wallLo: '#3a3428', beam: '#2a2418', trim: '#1c160e',
    door: '#42382a', doorHi: '#564836', glass: '#1a2028', accent: '#c8763e',
  },
};

// =========================================================================
// ROOF LAYER
// =========================================================================
// roof occupies viewBox y ~10..118 (ridge at 22, eave at 118); wall takes 118..200.
function roof(c, kind, back) {
  const parts = [];
  const RIDGE = 22, EAVE = 118, span = EAVE - RIDGE;
  // 1) big eave shadow behind the roof (makes it pop off the ground)
  parts.push(`<path d="M8 ${EAVE + 4} L28 ${RIDGE - 6} L172 ${RIDGE - 6} L192 ${EAVE + 4} Z" fill="${c.roofEdge}"/>`);
  // 2) two roof planes meeting at a ridge, seen from 3/4 above
  parts.push(`<path d="M14 ${EAVE} L34 ${RIDGE} L100 ${RIDGE} L100 ${EAVE} Z" fill="${c.roofLo}" stroke="${c.trim}" stroke-width="2.5" stroke-linejoin="round"/>`);
  parts.push(`<path d="M100 ${RIDGE} L166 ${RIDGE} L186 ${EAVE} L100 ${EAVE} Z" fill="${c.roof}" stroke="${c.trim}" stroke-width="2.5" stroke-linejoin="round"/>`);
  // 3) ridge cap
  parts.push(`<path d="M34 ${RIDGE} L166 ${RIDGE}" stroke="${c.roofHi}" stroke-width="5" stroke-linecap="round"/>`);
  parts.push(`<path d="M100 ${RIDGE} L100 ${EAVE}" stroke="${c.roofEdge}" stroke-width="2" opacity="0.5"/>`);
  // 4) shingle courses
  for (let r = 0; r < 12; r++) {
    const y = RIDGE + 6 + r * 8;
    if (y > EAVE - 2) break;
    const t = (y - RIDGE) / span;
    const lx = 34 - t * 20, rx = 166 + t * 20;
    const col = r % 2 ? c.roofHi : c.roofLo;
    parts.push(`<path d="M${round(lx)} ${round(y)} L100 ${round(RIDGE + t * span)} L${round(rx)} ${round(y)}" fill="none" stroke="${col}" stroke-width="1.6" opacity="0.5"/>`);
    if (r % 2 === 0) {
      let tabs = '';
      for (let x = lx + 8; x < rx - 8; x += 16) tabs += `M${round(x)} ${round(y)} l0 4 `;
      parts.push(`<path d="${tabs}" stroke="${c.roofEdge}" stroke-width="1" opacity="0.35"/>`);
    }
  }
  // 5) eave board (thick trim where roof meets wall) + drip shadow
  parts.push(`<path d="M14 ${EAVE} L186 ${EAVE}" stroke="${c.trim}" stroke-width="4"/>`);
  parts.push(`<path d="M18 ${EAVE + 3} L182 ${EAVE + 3}" stroke="rgba(0,0,0,0.35)" stroke-width="3"/>`);
  // 6) per-kind rooftop feature (skip on back houses — the entrance porch takes that spot)
  if (!back) parts.push(feature(c, kind));
  // 7) BACK-FACING house: the entrance is on the FAR side (top of the sprite), shown as a
  // roof porch/overhang poking UP above the ridge. The side we see (bottom) is just the back
  // wall — no door, handled in wall(). So this house faces AWAY from the plaza.
  if (back) {
    // a gabled porch canopy jutting up beyond the ridge line (the far-side entrance)
    parts.push(`<path d="M72 24 L100 2 L128 24 Z" fill="${c.roof}" stroke="${c.trim}" stroke-width="2.5" stroke-linejoin="round"/>`);   // porch gable roof
    parts.push(`<rect x="80" y="22" width="40" height="20" rx="2" fill="${c.roofLo}" stroke="${c.trim}" stroke-width="2"/>`);           // porch opening (the doorway, seen from behind)
    parts.push(`<rect x="94" y="26" width="12" height="16" rx="1.5" fill="${c.wallLo}"/>`);                                             // dark doorway mouth
    parts.push(`<path d="M72 24 L128 24" stroke="${c.trim}" stroke-width="3"/>`);                                                        // porch eave board
    parts.push(`<path d="M84 22 L100 6 L116 22" fill="none" stroke="${c.roofHi}" stroke-width="1.6" opacity="0.6"/>`);                   // shingle hint
    parts.push(`<circle cx="122" cy="30" r="3" fill="${c.accent}" opacity="0.9"/>`);                                                     // porch lantern
  }
  return parts.join('\n');
}

function feature(c, kind) {
  switch (kind) {
    case 'kitchen': // brick chimney w/ smoke
    case 'workshop':
      return `<rect x="140" y="6" width="20" height="30" rx="2" fill="${c.wallLo}" stroke="${c.trim}" stroke-width="2.5"/>
        <rect x="137" y="3" width="26" height="7" rx="1" fill="${c.trim}"/>
        <path d="M144 6 h12 M144 14 h12 M144 22 h12" stroke="${c.trim}" stroke-width="1" opacity="0.6"/>`;
    case 'library': // round attic window in the ridge
      return `<circle cx="100" cy="60" r="14" fill="${c.glass}" stroke="${c.trim}" stroke-width="3"/>
        <circle cx="100" cy="60" r="14" fill="none" stroke="${c.accent}" stroke-width="1" opacity="0.6"/>
        <path d="M86 60 h28 M100 46 v28" stroke="${c.trim}" stroke-width="2"/>`;
    case 'storehouse': // roof hatch + rope
      return `<rect x="86" y="54" width="28" height="20" rx="2" fill="${c.roofLo}" stroke="${c.trim}" stroke-width="2.5"/>
        <path d="M100 54 v20 M86 64 h28" stroke="${c.trim}" stroke-width="1.5"/>`;
    case 'elder': // moss patches + a crooked dormer
      return `<path d="M40 70 q14 -10 28 2 q-8 12 -30 6 z" fill="${c.moss}" opacity="0.5"/>
        <path d="M150 92 q10 -8 20 2" fill="none" stroke="${c.moss}" stroke-width="4" opacity="0.4"/>`;
    default: // bedroom: dormer window poking out of the roof
      return `<path d="M84 96 L100 70 L116 96 Z" fill="${c.roofLo}" stroke="${c.trim}" stroke-width="2.5" stroke-linejoin="round"/>
        <rect x="92" y="82" width="16" height="14" fill="${c.glass}" stroke="${c.trim}" stroke-width="2"/>
        <path d="M100 82 v14 M92 89 h16" stroke="${c.accent}" stroke-width="1" opacity="0.6"/>`;
  }
}

// =========================================================================
// WALL LAYER  (front facade — no interior floor leaks past the walls)
// =========================================================================
function windowShutters(c, x, y, w, h) {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="2" fill="${c.glass}" stroke="${c.trim}" stroke-width="2.5"/>
    <path d="M${x + w / 2} ${y} v${h} M${x} ${y + h / 2} h${w}" stroke="${c.accent}" stroke-width="1.4" opacity="0.55"/>
    <rect x="${x - 4}" y="${y - 2}" width="4" height="${h + 4}" fill="${c.beam}"/>
    <rect x="${x + w}" y="${y - 2}" width="4" height="${h + 4}" fill="${c.beam}"/>
    <path d="M${x - 3} ${y} l3 3 M${x + w + 3} ${y} l-3 3" stroke="${c.trim}" stroke-width="1"/>`;
}
function wall(c, kind, back) {
  const p = [];
  // facade panel  (y 108..196). NO overhang above 108 -> nothing leaks outside the roof line.
  p.push(`<rect x="14" y="108" width="172" height="88" fill="${c.wall}" stroke="${c.trim}" stroke-width="3"/>`);
  // corner posts + top plate (timber framing = Stardew-ish structure)
  p.push(`<rect x="14" y="108" width="10" height="88" fill="${c.wallLo}"/>`);
  p.push(`<rect x="176" y="108" width="10" height="88" fill="${c.wallLo}"/>`);
  p.push(`<rect x="14" y="108" width="172" height="8" fill="${c.beam}"/>`);          // top plate
  p.push(`<rect x="14" y="188" width="172" height="8" fill="${c.wallLo}"/>`);         // baseboard
  // plank / stone texture depending on kind
  if (kind === 'storehouse' || kind === 'library') {
    // stone blocks
    for (let ry = 120; ry < 186; ry += 14) {
      const off = ((ry / 14) % 2) ? 12 : 0;
      for (let x = 26 + off; x < 176; x += 24) {
        p.push(`<rect x="${x}" y="${ry}" width="22" height="12" rx="1.5" fill="${(x + ry) % 3 ? c.wallHi : c.wallLo}" stroke="${c.wallLo}" stroke-width="1"/>`);
      }
    }
  } else {
    // vertical planks + wood grain
    for (let x = 30; x < 176; x += 16) {
      p.push(`<path d="M${x} 116 L${x} 188" stroke="${c.wallLo}" stroke-width="1.4" opacity="0.7"/>`);
      p.push(`<path d="M${x + 3} 130 q3 10 0 22 M${x + 3} 156 q3 8 0 18" stroke="${c.wallLo}" stroke-width="0.8" opacity="0.4"/>`);
    }
  }
  if (back) {
    // ---- BACK OF HOUSE: no front door. A solid rear wall with a big shuttered window and
    // some clutter, so this facade reads as "the back". The entrance is implied by the roof
    // overhang/portico drawn in the roof layer instead — that's what faces the path here. ----
    p.push(windowShutters(c, 84, 128, 32, 30));                                 // big central rear window
    p.push(windowShutters(c, 30, 134, 24, 22));
    p.push(windowShutters(c, 146, 134, 24, 22));
    // lean-to firewood stack against the back wall (life, not a door)
    p.push(`<g opacity="0.95">`);
    for (let i=0;i<4;i++){ const lx=40+i*7; p.push(`<ellipse cx="${lx}" cy="184" rx="3.4" ry="6" fill="${c.door}" stroke="${c.trim}" stroke-width="0.8"/>`); }
    p.push(`</g>`);
    // a barrel by the corner
    p.push(`<ellipse cx="160" cy="182" rx="8" ry="10" fill="${c.wallLo}" stroke="${c.trim}" stroke-width="1.5"/>`);
    p.push(`<ellipse cx="160" cy="176" rx="8" ry="3" fill="${c.beam}"/>`);
    p.push(`<path d="M16 195 L184 195" stroke="rgba(0,0,0,0.4)" stroke-width="3"/>`);
    return p.join('\n');
  }
  // ---- DOOR: sized to match a person on screen (~54px wide, ~62px tall) ----
  // The footprint (~7x6 tiles = 336px) stretches this 200-unit viewBox, so 1 viewBox unit
  // ≈ 1.68px. A person is ~56px tall → door interior should be ~37 units, not 60 (which read
  // as a 2-storey door). Door now: interior y 152..188 (36 units ≈ 60px), bottom on threshold.
  p.push(`<rect x="84" y="150" width="32" height="40" rx="2" fill="${c.beam}"/>`);          // frame
  p.push(`<rect x="87" y="153" width="26" height="37" rx="2" fill="${c.door}" stroke="${c.trim}" stroke-width="2"/>`);
  p.push(`<path d="M100 153 v37" stroke="${c.trim}" stroke-width="1.2" opacity="0.6"/>`);     // centre seam
  p.push(`<path d="M91 162 h18 M91 172 h18 M91 182 h18" stroke="${c.doorHi}" stroke-width="1" opacity="0.5"/>`); // planks
  p.push(`<circle cx="106" cy="173" r="2.4" fill="${c.accent}"/>`);                            // knob
  p.push(`<path d="M84 190 h32" stroke="${c.trim}" stroke-width="2"/>`);                        // threshold
  // small step + light spill
  p.push(`<path d="M88 190 L112 190 L116 196 L84 196 Z" fill="${c.wallLo}"/>`);
  // ---- windows flanking the door (shuttered) ----
  p.push(windowShutters(c, 34, 132, 26, 24));
  p.push(windowShutters(c, 140, 132, 26, 24));
  // hanging lantern by the door (accent glow)
  p.push(`<circle cx="122" cy="140" r="3.5" fill="${c.accent}" opacity="0.9"/>`);
  p.push(`<path d="M122 132 v4" stroke="${c.beam}" stroke-width="1.5"/>`);
  // ground contact shadow
  p.push(`<path d="M16 195 L184 195" stroke="rgba(0,0,0,0.4)" stroke-width="3"/>`);
  return p.join('\n');
}

// =========================================================================
let count=0;
for (const [kind, c] of Object.entries(K)) {
  for (const back of [false, true]) {
    const suffix = back ? '-back' : '';
    const wallSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" preserveAspectRatio="none">\n${wall(c, kind, back)}\n</svg>`;
    const roofSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" preserveAspectRatio="none">\n${roof(c, kind, back)}\n</svg>`;
    fs.writeFileSync(`${OUT}/obj-house-${kind}${suffix}-wall.svg`, wallSvg);
    fs.writeFileSync(`${OUT}/obj-house-${kind}${suffix}-roof.svg`, roofSvg);
    count+=2;
  }
  console.log('wrote', kind, '(front+back)');
}
console.log('done —', count, 'files');
