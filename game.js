/* ============================================================
   MOONFALL — เกมแววูฟ (Werewolf × Among Us)  •  engine
   Claude's lane. Antigravity: DO NOT edit .js — art goes in theme.css / assets/*.svg
   Vanilla JS + Canvas 2D. No build step. Open index.html.
   ============================================================ */
(() => {
'use strict';

// ---------- config ----------
const TILE = 48;
const MAP_W = 40, MAP_H = 30;            // tiles
const PLAYER_R = 13;
const SPEED_HUMAN = 2.6;                 // px per frame @60
const SPEED_WOLF  = 2.9;                 // wolf only slightly faster — you CAN outrun by sprinting
const SPRINT_MULT = 1.55;               // sprint (2.6*1.55=4.03) beats a wolf, but stamina-limited
const WOLF_SIGHT  = 260;                // wolves can't see/lock prey across the whole map at night
const STAMINA_MAX = 100;
const STAMINA_DRAIN = 34;                // per second while sprinting
const STAMINA_REGEN = 20;                // per second while not sprinting
const STAMINA_MIN_TO_RUN = 8;            // must recover past this before running again
const DAY_SECONDS = 55;
const NIGHT_SECONDS = 45;
const MEETING_SECONDS = 30;
const KILL_RANGE = 42;
const KILL_COOLDOWN = 16;                // seconds — long enough that 2 wolves can't wipe half the town in one night
const SEER_CAST_TIME = 3.0;              // seconds standing still
const BARRIER_DURATION = 8;              // seconds
const BARRIER_RADIUS = 60;
const BARRIER_COOLDOWN = 25;
const FOOT_FADE = 22;                    // seconds a footprint lingers
const QUESTS_TO_WIN = 8;                 // total quests village must finish
const QUEST_CHANNEL_SECONDS = 8;         // uninterrupted on-site time a bot needs to finish one quest
const QUESTS_PER_DAY = 2;                 // village can only complete this many quests per day —
                                          // forces the match to last multiple days so wolves get a chance

const ROLES = {
  VILLAGER: { key:'VILLAGER', label:'ชาวบ้าน',   team:'village', color:'#c9b48c' },
  WOLF:     { key:'WOLF',     label:'หมาป่า',     team:'wolf',    color:'#8a3b3b' },
  SEER:     { key:'SEER',     label:'เทพยากรณ์',  team:'village', color:'#6a7bd8' },
  GUARD:    { key:'GUARD',    label:'บอดี้การ์ด', team:'village', color:'#4fa38a' },
  FOOL:     { key:'FOOL',     label:'คนบ้า',      team:'solo',    color:'#c77dbb' },
};

// ---------- canvas ----------
const cv = document.getElementById('cv');
const ctx = cv.getContext('2d', { alpha:false });   // opaque canvas is cheaper to composite
let VW = 0, VH = 0, DPR = 1;
// Cap the render resolution. High-DPI screens (devicePixelRatio 2+) plus browser zoom make
// the backing buffer huge, and every SVG drawImage rasterizes to it each frame — that was the
// real cause of the lag (per-stage draw cost was tiny; the frame was resolution-bound).
// A top-down pixel game reads fine at ≤1.5x, and this can auto-drop further if FPS stays low.
let dprCap = 1.5;
function resize(){
  DPR = Math.min(window.devicePixelRatio || 1, dprCap);
  VW = window.innerWidth; VH = window.innerHeight;
  cv.width = Math.round(VW * DPR); cv.height = Math.round(VH * DPR);
  cv.style.width = VW+'px'; cv.style.height = VH+'px';
  ctx.setTransform(DPR,0,0,DPR,0,0);
}
window.addEventListener('resize', resize);
// adaptive: if the running average frame time stays bad, drop resolution one notch (once).
let _fpsAccum=0, _fpsFrames=0, _dprDowngraded=false;
function fpsWatch(dtMs){
  if(_dprDowngraded) return;
  _fpsAccum+=dtMs; _fpsFrames++;
  if(_fpsFrames>=90){
    const avg=_fpsAccum/_fpsFrames; _fpsAccum=0; _fpsFrames=0;
    if(avg>22 && dprCap>1){ dprCap=1; _dprDowngraded=true; resize(); }  // ~<45fps sustained → go 1x
  }
}

// ---------- asset loader (SVG, graceful fallback) ----------
const IMG = {};
const ASSET_NAMES = [
  'char-villager','char-wolf','char-seer','char-ghost',
  // walk-cycle frames (Antigravity ships char-X-1/-2; loader tries them, missing = fallback)
  'char-villager-1','char-villager-2','char-villager-3','char-villager-4',
  'char-wolf-1','char-wolf-2','char-wolf-3','char-wolf-4',
  'char-seer-1','char-seer-2','char-seer-3','char-seer-4',
  'tile-grass','tile-path','tile-floor',
  'obj-house','obj-roof','obj-tree','obj-bush','obj-locker','obj-well','obj-campfire',
  'obj-rock','obj-stump','obj-flowers','obj-grass',
  'obj-roof-bedroom','obj-roof-kitchen','obj-roof-library','obj-roof-storehouse','obj-roof-elder','obj-roof-workshop',
  // 2-layer houses (Antigravity: wall drawn static, roof faded on entry) — per kind
  'obj-house-bedroom-wall','obj-house-kitchen-wall','obj-house-library-wall','obj-house-storehouse-wall','obj-house-elder-wall','obj-house-workshop-wall',
  'obj-house-bedroom-roof','obj-house-kitchen-roof','obj-house-library-roof','obj-house-storehouse-roof','obj-house-elder-roof','obj-house-workshop-roof',
  // rear-facing variants (house faces away from the plaza; entrance is the roof portico)
  'obj-house-bedroom-back-wall','obj-house-kitchen-back-wall','obj-house-library-back-wall','obj-house-storehouse-back-wall','obj-house-elder-back-wall','obj-house-workshop-back-wall',
  'obj-house-bedroom-back-roof','obj-house-kitchen-back-roof','obj-house-library-back-roof','obj-house-storehouse-back-roof','obj-house-elder-back-roof','obj-house-workshop-back-roof',
  // furniture (interior)
  'obj-bed','obj-stove','obj-table','obj-shelf','obj-crate','obj-barrel',
  'obj-anvil','obj-chest','obj-rug','obj-candle','obj-pot','obj-wardrobe',
  'fx-footprint','fx-barrier','fx-corpse','fx-ember','fx-dust'
];
// Pre-rasterize each SVG to a bitmap ONCE. Drawing an <img>(SVG) re-rasterizes the vector
// every single frame at the device's physical resolution — at DPR 2 that was ~2x slower and
// the real cause of the lag (buffer size was a red herring). A <canvas> source blits directly.
function rasterizeToCanvas(img, name){
  // native pixel size of the SVG; fall back to a sane default for viewBox-only SVGs
  let w = img.naturalWidth || 0, h = img.naturalHeight || 0;
  if(!w || !h){ w = 256; h = 256; }                  // SVGs use viewBox 0..200; 256 keeps detail crisp
  const scale = Math.min(2, Math.max(1, window.devicePixelRatio||1)); // bake in a little extra for hi-dpi
  const c = document.createElement('canvas');
  c.width = Math.round(w*scale); c.height = Math.round(h*scale);
  const cx = c.getContext('2d');
  cx.drawImage(img, 0, 0, c.width, c.height);
  c._isBitmap = true;                                // marker (harmless)
  return c;
}
function loadAssets(){
  ASSET_NAMES.forEach(name=>{
    const img = new Image();
    img.onload = ()=>{
      try { IMG[name] = rasterizeToCanvas(img, name); }
      catch(e){ IMG[name] = img; }                   // if rasterize fails, use the SVG directly
    };
    img.onerror = ()=>{ /* stay undefined -> code draws placeholder */ };
    img.src = 'assets/'+name+'.svg';
  });
}

// ============================================================
//  MAP  — hand-built village. 0 grass, 1 path, 2 wall(tree/rock),
//  3 house-floor(indoor), 4 house-wall
// ============================================================
let map = [];
const houses = [];   // {x,y,w,h} in tiles (indoor floor rects)
const lockers = [];  // {tx,ty} hide spots
const objects = [];  // decorative {type,tx,ty}
let campfire = { tx: 20, ty: 15 }; // meeting point

// Village layout: an open central square (with well + campfire), houses facing
// inward with their doors onto ring roads, a forest edge, and hand-placed hide
// spots. Deterministic so spawns/quests stay sane.
function buildMap(){
  map = [];
  for(let y=0;y<MAP_H;y++){
    const row=[];
    for(let x=0;x<MAP_W;x++){
      // thick, irregular forest border (trees), rest grass
      let t = 0;
      if(x<1||y<1||x>=MAP_W-1||y>=MAP_H-1) t = 2;
      row.push(t);
    }
    map.push(row);
  }
  houses.length = 0; lockers.length = 0; objects.length = 0;
  let seed = 20260723;
  const rnd = ()=> (seed = (seed*1103515245+12345) & 0x7fffffff) / 0x7fffffff;

  // ---- central plaza (the meeting square) ----
  const CX=20, CY=15;                    // plaza center (tiles)
  const plaza = {x:CX-4, y:CY-3, w:9, h:7};
  for(let y=plaza.y;y<plaza.y+plaza.h;y++) for(let x=plaza.x;x<plaza.x+plaza.w;x++) map[y][x]=1; // cobbled path
  campfire = { tx:CX, ty:CY };

  // ---- ring road around plaza + four spokes out to the edges ----
  const ring = {x:CX-8, y:CY-6, w:17, h:13};
  for(let x=ring.x;x<ring.x+ring.w;x++){ if(map[ring.y]) map[ring.y][x]=map[ring.y][x]||1; if(map[ring.y+ring.h-1]) map[ring.y+ring.h-1][x]=map[ring.y+ring.h-1][x]||1; }
  for(let y=ring.y;y<ring.y+ring.h;y++){ if(map[y]){ if(map[y][ring.x]===0)map[y][ring.x]=1; if(map[y][ring.x+ring.w-1]===0)map[y][ring.x+ring.w-1]=1; } }
  // spokes (horizontal to L/R edges; verticals are carved AFTER houses so they aren't blocked)
  for(let x=1;x<ring.x;x++) map[CY][x]=1;
  for(let x=ring.x+ring.w;x<MAP_W-1;x++) map[CY][x]=1;

  // ---- houses arranged around the plaza ----
  // ALL houses face the camera (door at bottom-centre) so the door in the sprite
  // matches the real entrance. A path runs straight DOWN from every door to the ring road.
  const houseDefs = [
    {x:CX-11, y:CY-8, w:7, h:6},   // NW
    {x:CX+5,  y:CY-8, w:7, h:6},   // NE
    {x:CX-11, y:CY+3, w:7, h:6},   // SW
    {x:CX+5,  y:CY+3, w:7, h:6},   // SE
    {x:CX-4,  y:CY-13, w:8, h:5},  // N (door faces down toward plaza)
    {x:CX-4,  y:CY+8,  w:8, h:5},  // S (kept clear of the bottom edge so its path connects)
  ];
  const HOUSE_KINDS=['bedroom','kitchen','library','storehouse','elder','workshop'];
  // Alternate which houses show their BACK to the plaza, so the village doesn't have every
  // house facing the same way. Back-facing houses have no visible door — you enter under the
  // roof portico instead (still the bottom doorway tile, so pathing/collision is unchanged).
  const backSet = new Set([1,2,5]);   // NE, SW, S face away
  houseDefs.forEach((h,idx)=>{
    h.kind = HOUSE_KINDS[idx % HOUSE_KINDS.length];
    h.back = backSet.has(idx);
    h.furniture = [];
    for(let y=h.y;y<h.y+h.h;y++) for(let x=h.x;x<h.x+h.w;x++){
      if(y<0||x<0||y>=MAP_H||x>=MAP_W) continue;
      const edge=(x===h.x||x===h.x+h.w-1||y===h.y||y===h.y+h.h-1);
      map[y][x]= edge?4:3;
    }
    // Doorway location must match where the sprite actually shows the entrance:
    //  - front house: door at BOTTOM-CENTRE (faces the plaza)
    //  - back house:  entrance porch is at the TOP (faces away), so the walkable doorway is on top
    const dx=h.x+(h.w>>1);
    const dy = h.back ? h.y : (h.y+h.h-1);
    h.door = h.back ? 'up' : 'down'; h.doorTx=dx; h.doorTy=dy;
    if(map[dy]&&map[dy][dx]!==undefined) map[dy][dx]=3;                 // doorway (walkable floor)
    h._needsPath=true;                          // wired to the plaza after all houses exist
    addPartition(h);
    placeFurniture(h);   // fill interior per kind
    houses.push(h);
  });

  // ---- connect every door to the plaza with a BFS-carved road (always succeeds) ----
  // BFS over non-wall tiles from the door to the campfire; then paint the shortest route
  // as path. Grass costs 1, existing road costs 0.01 (so it re-uses roads and stays tidy).
  function carveRoad(sx,sy){
    const key=(x,y)=>y*MAP_W+x;
    const q=[[sx,sy]]; const prev=new Map(); prev.set(key(sx,sy),null);
    const seen=new Set([key(sx,sy)]);
    let goal=null;
    while(q.length){
      const [x,y]=q.shift();
      if(x===CX&&y===CY){ goal=[x,y]; break; }
      for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
        const nx=x+dx, ny=y+dy;
        if(nx<1||ny<1||nx>=MAP_W-1||ny>=MAP_H-1) continue;
        const t=map[ny][nx];
        if(t===2||t===4) continue;            // wall/forest impassable
        const k=key(nx,ny); if(seen.has(k)) continue;
        seen.add(k); prev.set(k,[x,y]); q.push([nx,ny]);
      }
    }
    if(!goal) return;
    let cur=goal;
    while(cur){ const [x,y]=cur; if(map[y][x]===0) map[y][x]=1; cur=prev.get(key(x,y)); }
  }
  // start the road one tile OUTSIDE the doorway (below a front door, above a back door)
  houses.forEach(h=>{ const oy = h.back ? h.doorTy-1 : h.doorTy+1; if(map[oy]?.[h.doorTx]!==undefined && map[oy][h.doorTx]!==4) carveRoad(h.doorTx, oy); });

  // ---- dense forest ring around the whole map edge (fills the empty borders) ----
  for(let y=1;y<MAP_H-1;y++) for(let x=1;x<MAP_W-1;x++){
    const edgeDist=Math.min(x-1, y-1, MAP_W-2-x, MAP_H-2-y);
    if(edgeDist>3) continue;                      // only the outer 3-tile band
    if(map[y][x]!==0) continue;                   // don't cover roads/houses
    const density = edgeDist===0?0.7 : edgeDist===1?0.5 : edgeDist===2?0.3 : 0.15;
    if(rnd()<density){
      if(rnd()<0.72){ map[y][x]=2; objects.push({type:'obj-tree',tx:x,ty:y}); }
      else objects.push({type:'obj-bush',tx:x,ty:y});
    }
  }
  // ---- scattered detail EVERYWHERE on open grass (stumps, rocks, flowers, tall grass) ----
  const decoTypes=['obj-rock','obj-stump','obj-flowers','obj-grass','obj-bush'];
  for(let i=0;i<80;i++){
    const tx=1+Math.floor(rnd()*(MAP_W-2)), ty=1+Math.floor(rnd()*(MAP_H-2));
    if(map[ty][tx]!==0) continue;                 // grass only
    if(Math.hypot(tx-CX,ty-CY)<3) continue;       // keep plaza tidy
    const type=decoTypes[Math.floor(rnd()*decoTypes.length)];
    // rocks block movement, the rest are flat decoration
    if(type==='obj-rock' && rnd()<0.5){ map[ty][tx]=2; }
    objects.push({type, tx, ty, flat:(type==='obj-flowers'||type==='obj-grass')});
  }
  // a few lone bushes near the plaza for cover
  [{tx:CX-3,ty:CY+1},{tx:CX+3,ty:CY-1},{tx:CX-6,ty:CY},{tx:CX+6,ty:CY}].forEach(b=>{
    if(map[b.ty]&&map[b.ty][b.tx]===0) objects.push({type:'obj-bush',tx:b.tx,ty:b.ty});
  });

  // ---- decorative well beside the campfire ----
  objects.push({type:'obj-well', tx:CX+2, ty:CY+1});

  // ---- open-air hide spots (crates/lockers) tucked in believable nooks ----
  const openLockers=[{tx:CX-7,ty:CY+5},{tx:CX+6,ty:CY-4},{tx:CX-6,ty:CY-5},{tx:CX+6,ty:CY+5},{tx:CX,ty:CY+6}];
  openLockers.forEach(l=>{ if(map[l.ty]&&(map[l.ty][l.tx]===0||map[l.ty][l.tx]===1)) lockers.push(l); });
}
// Furniture catalog per house kind. Positions are interior tile offsets (inside the
// wall ring). Some furniture is solid (blocks movement), the wardrobe is a hide spot.
const FURNITURE = {
  bedroom:   [['bed',1,1,true],['rug',2,2,false],['chest',3,1,true],['candle',1,3,false]],
  kitchen:   [['stove',1,1,true],['table',2,2,true],['barrel',3,1,true],['pot',1,2,false]],
  library:   [['shelf',1,1,true],['shelf',2,1,true],['table',2,2,true],['candle',3,2,false]],
  storehouse:[['crate',1,1,true],['crate',2,1,true],['crate',1,2,true],['barrel',3,2,true]],
  elder:     [['bed',1,1,true],['shelf',3,1,true],['rug',2,2,false],['pot',2,1,false]],
  workshop:  [['table',2,1,true],['anvil',1,1,true],['crate',3,2,true],['barrel',1,2,true]],
};
// split a house into two rooms with an internal wall + an inner doorway gap.
// Uses wall tiles (t=4, solid) so it reads as a real divider, and stores the
// partition line + gap so furniture placement avoids sealing it.
function addPartition(h){
  h.partition=null;
  if(h.w<6 && h.h<6) return;                       // too small to split
  const vertical = h.w>=h.h;                       // split along the longer axis
  if(vertical){
    const wx = h.x + Math.floor(h.w/2);            // vertical wall column
    if(wx===h.doorTx) return;                       // don't split through the entry
    const gapY = h.y + 1 + Math.floor(Math.random()*(h.h-2)); // inner doorway row
    for(let y=h.y+1;y<h.y+h.h-1;y++){ if(y===gapY) continue; if(map[y]?.[wx]===3) map[y][wx]=4; }
    h.partition={vertical:true, at:wx, gap:gapY};
  } else {
    const wy = h.y + Math.floor(h.h/2);
    if(wy===h.doorTy) return;
    const gapX = h.x + 1 + Math.floor(Math.random()*(h.w-2));
    for(let x=h.x+1;x<h.x+h.w-1;x++){ if(x===gapX) continue; if(map[wy]?.[x]===3) map[wy][x]=4; }
    h.partition={vertical:false, at:wy, gap:gapX};
  }
}
function placeFurniture(h){
  const items = FURNITURE[h.kind] || FURNITURE.bedroom;
  // Reserve a clear walking lane: the doorway tile + the tile just inside it must stay empty,
  // so you never get body-blocked the instant you step through the door.
  const reserved = new Set();
  const key=(x,y)=>x+','+y;
  reserved.add(key(h.doorTx,h.doorTy));
  // tile one step INTO the house from the door
  const inX = h.doorTx===h.x ? h.doorTx+1 : h.doorTx===h.x+h.w-1 ? h.doorTx-1 : h.doorTx;
  const inY = h.doorTy===h.y ? h.doorTy+1 : h.doorTy===h.y+h.h-1 ? h.doorTy-1 : h.doorTy;
  reserved.add(key(inX,inY));
  reserved.add(key(h.doorTx,inY)); reserved.add(key(inX,h.doorTy)); // widen the lane a bit
  // keep the inner doorway (partition gap) + tiles beside it clear
  if(h.partition){
    if(h.partition.vertical){ reserved.add(key(h.partition.at, h.partition.gap)); reserved.add(key(h.partition.at-1,h.partition.gap)); reserved.add(key(h.partition.at+1,h.partition.gap)); }
    else { reserved.add(key(h.partition.gap, h.partition.at)); reserved.add(key(h.partition.gap,h.partition.at-1)); reserved.add(key(h.partition.gap,h.partition.at+1)); }
  }

  // candidate interior floor tiles that HUG a wall (furniture belongs against walls, not mid-room)
  const spots=[];
  for(let y=h.y+1;y<h.y+h.h-1;y++) for(let x=h.x+1;x<h.x+h.w-1;x++){
    if(map[y]?.[x]!==3) continue;
    if(reserved.has(key(x,y))) continue;
    const againstWall = (x===h.x+1||x===h.x+h.w-2||y===h.y+1||y===h.y+h.h-2);
    if(!againstWall) continue;                 // keep the middle of the room walkable
    spots.push({x,y});
  }
  // place items into wall spots; drop solids that would fully seal the room
  let placed=0;
  for(const [type,,,solidFlag] of items){
    const spot = spots.shift(); if(!spot) break;
    h.furniture.push({type, tx:spot.x, ty:spot.y, solid:solidFlag});
    placed++;
  }
  // wardrobe (hide spot) on a remaining wall tile, else a corner
  const wSpot = spots.shift();
  if(wSpot){ h.wardrobe={tx:wSpot.x,ty:wSpot.y}; lockers.push({tx:wSpot.x,ty:wSpot.y, indoor:true}); }
}
// solid furniture blocks movement
function furnitureSolidAt(tx,ty){
  for(const h of houses){ for(const f of h.furniture){ if(f.solid && f.tx===tx && f.ty===ty) return true; } }
  return false;
}
// which house (if any) contains this world point
function houseAt(px,py){
  const tx=Math.floor(px/TILE), ty=Math.floor(py/TILE);
  for(const h of houses){ if(tx>=h.x && tx<h.x+h.w && ty>=h.y && ty<h.y+h.h) return h; }
  return null;
}
function tileAt(px,py){
  const tx = Math.floor(px/TILE), ty = Math.floor(py/TILE);
  if(tx<0||ty<0||tx>=MAP_W||ty>=MAP_H) return 2;
  return map[ty][tx];
}
function solid(px,py){
  const t=tileAt(px,py); if(t===2||t===4) return true;
  return furnitureSolidAt(Math.floor(px/TILE), Math.floor(py/TILE));
}

// ============================================================
//  A* PATHFINDING  — bots navigate around walls/trees/houses/furniture
//  instead of walking straight into them. Runs on the tile grid.
// ============================================================
function tileWalkable(tx,ty){
  if(tx<0||ty<0||tx>=MAP_W||ty>=MAP_H) return false;
  const t=map[ty][tx];
  if(t===2||t===4) return false;               // tree/rock or house wall
  if(furnitureSolidAt(tx,ty)) return false;     // solid furniture
  return true;                                   // grass(0)/path(1)/floor(3)
}
// octile heuristic
function astarH(ax,ay,bx,by){ const dx=Math.abs(ax-bx),dy=Math.abs(ay-by); return (dx+dy)+(Math.SQRT2-2)*Math.min(dx,dy); }
function wallAdjacent(tx,ty){
  return !tileWalkable(tx+1,ty)||!tileWalkable(tx-1,ty)||!tileWalkable(tx,ty+1)||!tileWalkable(tx,ty-1);
}
// is there a clear line between two world points? (walls/trees/house walls block sight)
function lineOfSight(x0,y0,x1,y1){
  const steps=Math.ceil(Math.hypot(x1-x0,y1-y0)/(TILE*0.5));
  for(let i=1;i<steps;i++){
    const t=i/steps, x=x0+(x1-x0)*t, y=y0+(y1-y0)*t;
    const tt=tileAt(x,y);
    if(tt===2||tt===4) return false;   // tree/rock or house wall blocks sight
  }
  return true;
}
// returns array of {tx,ty} tile centers from start->goal (excluding start), or null
function findPath(sx,sy,gx,gy){
  if(!tileWalkable(gx,gy)){
    // nudge goal to nearest walkable neighbor (e.g. quest sits on a floor edge)
    const near=[[0,0],[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]];
    let found=null;
    for(const [ox,oy] of near){ if(tileWalkable(gx+ox,gy+oy)){ found=[gx+ox,gy+oy]; break; } }
    if(!found) return null; gx=found[0]; gy=found[1];
  }
  if(sx===gx&&sy===gy) return [];
  const key=(x,y)=>y*MAP_W+x;
  const open=[{x:sx,y:sy,g:0,f:astarH(sx,sy,gx,gy),p:null}];
  const seen=new Map(); seen.set(key(sx,sy),0);
  const nbrs=[[1,0,1],[-1,0,1],[0,1,1],[0,-1,1],[1,1,1.414],[-1,1,1.414],[1,-1,1.414],[-1,-1,1.414]];
  let iter=0;
  while(open.length){
    if(++iter>1200) break;                    // safety cap (keeps 60fps with 8 bots)
    // pop lowest f
    let bi=0; for(let i=1;i<open.length;i++) if(open[i].f<open[bi].f) bi=i;
    const cur=open.splice(bi,1)[0];
    if(cur.x===gx&&cur.y===gy){
      const path=[]; let n=cur; while(n.p){ path.push({tx:n.x,ty:n.y}); n=n.p; } return path.reverse();
    }
    for(const [dx,dy,cost] of nbrs){
      const nx=cur.x+dx, ny=cur.y+dy;
      if(!tileWalkable(nx,ny)) continue;
      // prevent cutting through wall diagonals
      if(dx!==0&&dy!==0 && (!tileWalkable(cur.x+dx,cur.y)||!tileWalkable(cur.x,cur.y+dy))) continue;
      // clearance penalty: prefer tiles that aren't hugging a wall (keeps the fat body off corners)
      const wallPenalty = wallAdjacent(nx,ny) ? 0.9 : 0;
      const ng=cur.g+cost+wallPenalty, k=key(nx,ny);
      if(seen.has(k) && seen.get(k)<=ng) continue;
      seen.set(k,ng);
      open.push({x:nx,y:ny,g:ng,f:ng+astarH(nx,ny,gx,gy),p:cur});
    }
  }
  return null;
}
// Steer an actor toward a world goal, following an A* path (cached & re-planned lazily).
function moveAlongPath(a, wgx, wgy, speed){
  const gx=Math.floor(wgx/TILE), gy=Math.floor(wgy/TILE);
  const pf=a.ai.pf || (a.ai.pf={path:null,goal:null,repathT:0,idx:0});
  pf.repathT -= 1;
  const goalChanged = !pf.goal || pf.goal.x!==gx || pf.goal.y!==gy;
  if(goalChanged || pf.repathT<=0 || !pf.path){
    pf.path = findPath(Math.floor(a.x/TILE), Math.floor(a.y/TILE), gx, gy);
    pf.goal = {x:gx,y:gy}; pf.idx=0; pf.repathT = 30 + Math.floor(Math.random()*30); // re-plan ~2x/sec
  }
  // if very close to final goal, or no path, just steer straight (short hop / same tile)
  if(!pf.path || pf.path.length===0){ moveToward(a, wgx, wgy, speed); return; }
  // advance waypoint when reached
  let wp = pf.path[pf.idx];
  if(!wp){ moveToward(a, wgx, wgy, speed); return; }
  const wx=wp.tx*TILE+TILE/2, wy=wp.ty*TILE+TILE/2;
  if(Math.hypot(wx-a.x, wy-a.y) < TILE*0.55){ pf.idx++; wp=pf.path[pf.idx]; }
  if(wp){ moveToward(a, wp.tx*TILE+TILE/2, wp.ty*TILE+TILE/2, speed); }
  else moveToward(a, wgx, wgy, speed);
}

// ============================================================
//  ENTITIES
// ============================================================
function makeActor(id,name,isPlayer){
  return {
    id, name, isPlayer,
    x:0, y:0, dir:'down',
    role:null, alive:true, inLocker:false, isWolfNight:false,
    // AI
    ai:{
      target:null, state:'idle', t:0, questTargetIdx:-1, channel:0,
      // social-deduction memory
      suspicion:{},        // {otherId: score}  — how much this bot suspects each other actor
      questsDoneByMe:0,     // village bots track their own contribution
      lastSeen:{},          // {otherId: {x,y,ts}}
      castedTonight:false,  // seer
      guardedThisNight:false,
      alibi:0,              // wolves: accumulate "acting normal" credit
      retreat:0, fleeTo:null, // wolf: flee-the-scene state after a kill
      questContribSeen:{}, // {otherId: stations I personally watched them finish} — alibi tracking
      seenNearCorpse:{},   // {otherId: times seen loitering by a fresh body} — hard tell
      lastVoteTarget:null, // who I pushed last meeting (consistency)
      // personality (0..1) — set per match so bots behave differently
      diligence:0.5,        // how reliably they grind quests
      caution:0.5,          // how early they flee / how far they keep distance
      paranoia:0.5,         // how readily they accrue & act on suspicion
      boldness:0.5,         // wolves: willingness to kill with witnesses near
    },
    killCd:0, barrierCd:0, castT:0, wantCast:false,
    vx:0, vy:0, moveT:0, _speed:0, _spdSmooth:0, _moving:false, walkT:0, walkPhase:0,
  };
}
let actors = [];
let player = null;

// footprints left by wolves at night (seer-visible)
let footprints = []; // {x,y,age}
// active barriers
let barriers = [];   // {x,y,t,owner}
// corpses
let corpses = [];    // {x,y}

// ---- particle FX ----
let particles = [];  // {x,y,vx,vy,life,max,type,size,rot,vr}
function spawnFX(x,y,type,opts={}){
  const N = opts.n || ({dust:3, blood:14, spark:10, cast:16, poof:12, ring:1}[type]||6);
  for(let i=0;i<N;i++){
    const ang = opts.ang!==undefined ? opts.ang : Math.random()*Math.PI*2;
    let sp, life, size;
    switch(type){
      case 'dust':  sp=0.3+Math.random()*0.5; life=0.4+Math.random()*0.3; size=2+Math.random()*2; break;
      case 'blood': sp=1.5+Math.random()*2.5; life=0.5+Math.random()*0.5; size=2+Math.random()*3; break;
      case 'spark': sp=1+Math.random()*2;     life=0.4+Math.random()*0.4; size=1.5+Math.random()*2; break;
      case 'cast':  sp=0.6+Math.random()*1.2; life=0.8+Math.random()*0.6; size=2+Math.random()*2.5; break;
      case 'poof':  sp=0.5+Math.random()*1.5; life=0.5+Math.random()*0.4; size=3+Math.random()*3; break;
      default:      sp=1+Math.random()*1.5;   life=0.5; size=2;
    }
    particles.push({
      x, y, vx:Math.cos(ang)*sp, vy:Math.sin(ang)*sp - (type==='blood'?1:0),
      life, max:life, type, size,
      rot:Math.random()*7, vr:(Math.random()-0.5)*0.3,
    });
  }
  if(particles.length>400) particles.splice(0, particles.length-400);
}
function updateParticles(dt){
  for(let i=particles.length-1;i>=0;i--){
    const p=particles[i];
    p.life-=dt;
    if(p.life<=0){ particles.splice(i,1); continue; }
    p.x+=p.vx; p.y+=p.vy;
    p.vx*=0.92; p.vy*=0.92;
    if(p.type==='blood') p.vy+=0.15;   // gravity
    p.rot+=p.vr;
  }
}
const FX_COLOR={ dust:'190,175,150', blood:'150,20,20', spark:'255,210,120', cast:'120,150,255', poof:'200,200,210' };
// map particle types to Antigravity's SVG art when available
const FX_IMG={ dust:'fx-dust', spark:'fx-ember' };
function drawParticles(){
  particles.forEach(p=>{
    const a=Math.max(0,p.life/p.max);
    const imgName=FX_IMG[p.type];
    if(imgName && IMG[imgName]){
      const s=p.size*(1.6+a);   // svgs read small, scale up a touch
      ctx.globalAlpha=a; ctx.drawImage(IMG[imgName], p.x-s, p.y-s, s*2, s*2); ctx.globalAlpha=1;
    } else {
      const c=FX_COLOR[p.type]||'220,220,220';
      ctx.fillStyle=`rgba(${c},${a})`;
      ctx.beginPath(); ctx.arc(p.x,p.y,p.size*(0.5+a*0.5),0,7); ctx.fill();
    }
  });
}

// quest stations
let stations = [];   // {tx,ty,type,done}
let questsDone = 0;
let questsToday = 0;  // quests completed during the current day (capped at QUESTS_PER_DAY)

// ============================================================
//  GAME STATE
// ============================================================
const G = {
  phase:'title',    // title | day | meeting | night | over
  day:1,
  timer:0,
  running:false,
  over:false,
  paused:false,     // during minigame/meeting overlays
};

const keys = {};
let touchDir = null;
let sprintHeld = false;        // keyboard Shift or on-screen run button
let stamina = STAMINA_MAX;     // player stamina (0..100)
let sprinting = false;

// ---------- spawn / setup a match ----------
function setupMatch(){
  buildMap();
  actors = []; footprints=[]; barriers=[]; corpses=[]; particles=[]; questsDone=0; questsToday=0;
  stamina=STAMINA_MAX; sprinting=false; sprintHeld=false;

  // roles for 8 players
  const roleBag = ['WOLF','WOLF','SEER','GUARD','FOOL','VILLAGER','VILLAGER','VILLAGER'];
  shuffle(roleBag);

  const names = ['คุณ','บิน','นี','ก้อย','โจ','แพร','ตั้ม','หมิว'];
  const spawnSpots = spreadSpawns(8);
  for(let i=0;i<8;i++){
    const a = makeActor(i, names[i], i===0);
    a.role = ROLES[roleBag[i]];
    a.x = spawnSpots[i].x; a.y = spawnSpots[i].y;
    // roll a distinct personality so no two bots feel identical
    if(!a.isPlayer){
      a.ai.diligence = 0.2+Math.random()*0.8;
      a.ai.caution   = 0.15+Math.random()*0.85;
      a.ai.paranoia  = 0.1+Math.random()*0.9;
      a.ai.boldness  = 0.2+Math.random()*0.8;
      a.ai.trait = personalityLabel(a.ai);
    }
    actors.push(a);
  }
  player = actors[0];

  // quest stations: place INDOOR chores inside houses and OUTDOOR chores on paths/clearings,
  // so each quest reads as sensible (cooking is in a kitchen, fetching water is by a well).
  stations = [];
  const cx=campfire.tx, cy=campfire.ty;
  const farApart = (list, c, min)=> list.every(s=> Math.hypot(s.tx-c.tx, s.ty-c.ty) >= min);

  // --- outdoor candidates: path/grass tiles, reachable, off wall edges, out of the plaza ---
  const outCand=[];
  for(let y=2;y<MAP_H-2;y++) for(let x=2;x<MAP_W-2;x++){
    const t=map[y][x];
    if(t!==1 && t!==0) continue;                  // path or open grass (never inside a house)
    if(houseAt(x*TILE+TILE/2, y*TILE+TILE/2)) continue;
    if(!tileWalkable(x,y) || wallAdjacent(x,y)) continue;
    if(Math.hypot(x-cx,y-cy)<5) continue;
    if(!findPath(cx,cy,x,y)) continue;
    outCand.push({tx:x,ty:y});
  }
  // --- indoor candidates: floor tiles inside a house, reachable from the plaza (through the door) ---
  const inCand=[];
  houses.forEach(h=>{
    // one interior floor tile per house, roughly centred, standable
    for(let y=h.y+1;y<h.y+h.h-1;y++) for(let x=h.x+1;x<h.x+h.w-1;x++){
      if(map[y] && map[y][x]===3 && tileWalkable(x,y) && !wallAdjacent(x,y)){
        if(findPath(cx,cy,x,y)) inCand.push({tx:x,ty:y,house:h});
        break;
      }
    }
  });
  shuffle(outCand); shuffle(inCand);

  // split the 8 quests: aim ~half indoor / half outdoor, but never more than we have spots for.
  const wantIndoor = Math.min(inCand.length, Math.round(QUESTS_TO_WIN*0.45));
  const indoorTypes  = QUEST_KEYS.filter(k=>QUEST_META[k].place==='indoor');
  const outdoorTypes = QUEST_KEYS.filter(k=>QUEST_META[k].place==='outdoor');
  const picks=[];
  // indoor: one per distinct house, spread type
  for(const c of inCand){
    if(picks.filter(p=>p._in).length>=wantIndoor) break;
    const type=indoorTypes[picks.filter(p=>p._in).length % indoorTypes.length];
    picks.push({tx:c.tx, ty:c.ty, type, _in:true});
  }
  // outdoor: farthest-point spread among the rest
  const needOut = QUESTS_TO_WIN - picks.length;
  const outChosen=[];
  if(outCand.length){
    outChosen.push(outCand[0]);
    while(outChosen.length<needOut && outChosen.length<outCand.length){
      let best=null,bestD=-1;
      outCand.forEach(c=>{ if(outChosen.includes(c))return; let m=1e9; outChosen.concat(picks).forEach(ch=>{m=Math.min(m,Math.hypot(c.tx-ch.tx,c.ty-ch.ty));}); if(m>bestD){bestD=m;best=c;} });
      if(!best) break; outChosen.push(best);
    }
  }
  outChosen.forEach((c,i)=> picks.push({tx:c.tx, ty:c.ty, type:outdoorTypes[i%outdoorTypes.length], _in:false}));
  // fill any shortfall (tiny maps) with plaza-adjacent outdoor spots
  while(picks.length<QUESTS_TO_WIN){ picks.push({tx:cx+2+picks.length, ty:cy+2, type:outdoorTypes[picks.length%outdoorTypes.length], _in:false}); }

  picks.slice(0,QUESTS_TO_WIN).forEach(p=> stations.push({ tx:p.tx, ty:p.ty, type:p.type, indoor:p._in, done:false }));

  G.day=1; G.over=false; G.paused=false;
  startPhase('day');
  updateHUDRole();
}

function spreadSpawns(n){
  const spots=[];
  const cx=campfire.tx*TILE, cy=campfire.ty*TILE;
  for(let i=0;i<n;i++){
    const ang = (i/n)*Math.PI*2;
    spots.push({ x:cx+Math.cos(ang)*90, y:cy+Math.sin(ang)*90 });
  }
  return spots;
}
function shuffle(a){ for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } }
// a short human-readable trait from the dominant personality axis (for debugging / future UI)
function personalityLabel(ai){
  const m=[['ขยัน',ai.diligence],['ขี้ระแวง',ai.paranoia],['ขี้กลัว',ai.caution],['กล้า',ai.boldness]];
  m.sort((a,b)=>b[1]-a[1]); return m[0][0];
}

// ============================================================
//  PHASES
// ============================================================
function startPhase(p){
  G.phase = p;
  if(p==='day'){ G.timer = DAY_SECONDS; questsToday=0; setNightWolves(false); toast('☀️ กลางวัน — ทำเควสให้ครบ'); }
  else if(p==='night'){
    G.timer = NIGHT_SECONDS; setNightWolves(true);
    // reset per-night AI intents
    actors.forEach(a=>{ if(a.ai){ a.ai.castedTonight=false; a.ai.guardedThisNight=false; a.ai.retreat=0; a.ai.fleeTo=null; } a.inLocker=false; });
    if(player) player.wantCast=false, player.castT=0;
    toast('🌙 กลางคืน — ระวังตัว! ซ่อนได้');
  }
  else if(p==='meeting'){ G.timer = MEETING_SECONDS; setNightWolves(false); openMeeting(); }
  updateHUDPhase();
  updateActionButtons();
}
function setNightWolves(on){
  actors.forEach(a=>{ if(a.role.key==='WOLF') a.isWolfNight = on && a.alive; });
}

function tickPhase(dt){
  if(G.paused) return;
  G.timer -= dt;
  if(G.timer<=0){
    if(G.phase==='day') startPhase('meeting');
    else if(G.phase==='meeting'){ /* handled by meeting resolve */ }
    else if(G.phase==='night'){ G.day++; startPhase('day'); }
  }
  const bar = document.getElementById('phaseTimerBar');
  const total = G.phase==='day'?DAY_SECONDS : G.phase==='night'?NIGHT_SECONDS : MEETING_SECONDS;
  if(bar) bar.style.width = Math.max(0,(G.timer/total)*100)+'%';
  const lbl = document.getElementById('phaseTimerLabel');
  if(lbl) lbl.textContent = Math.ceil(Math.max(0,G.timer));
}

// ============================================================
//  MOVEMENT + INPUT
// ============================================================
function readInput(){
  let dx=0, dy=0;
  if(keys['w']||keys['arrowup']||touchDir==='up') dy-=1;
  if(keys['s']||keys['arrowdown']||touchDir==='down') dy+=1;
  if(keys['a']||keys['arrowleft']||touchDir==='left') dx-=1;
  if(keys['d']||keys['arrowright']||touchDir==='right') dx+=1;
  return {dx,dy};
}

// body half-width for collision (a bit smaller than the sprite so doorways feel roomy)
const BODY = PLAYER_R*0.72;
function bodyBlocked(cx,cy){
  // sample the actor's footprint corners + edge midpoints
  return solid(cx-BODY,cy-BODY)||solid(cx+BODY,cy-BODY)||
         solid(cx-BODY,cy+BODY)||solid(cx+BODY,cy+BODY)||
         solid(cx,cy+BODY)||solid(cx,cy-BODY)||solid(cx-BODY,cy)||solid(cx+BODY,cy);
}
function moveActor(a, dx, dy, speed){
  if(!a.alive || a.inLocker){ a._speed=0; return; }
  if(dx||dy){
    const ox=a.x, oy=a.y;
    const len = Math.hypot(dx,dy)||1;
    const nx = a.x + (dx/len)*speed;
    const ny = a.y + (dy/len)*speed;
    // axis-separated collision using full body footprint (prevents clipping/jamming walls)
    if(!bodyBlocked(nx, a.y)) a.x = clamp(nx, TILE, (MAP_W-1)*TILE);
    if(!bodyBlocked(a.x, ny)) a.y = clamp(ny, TILE, (MAP_H-1)*TILE);
    a.dir = Math.abs(dx)>Math.abs(dy) ? (dx<0?'left':'right') : (dy<0?'up':'down');
    a._speed = Math.hypot(a.x-ox, a.y-oy);   // actual moved distance (for anim)
    a.moveT += 1;
    // walking dust puffs occasionally
    if(a._speed>0.5 && a.moveT % 10 === 0){
      spawnFX(a.x + (Math.random()*8-4), a.y+PLAYER_R-2, 'dust');
    }
    // wolves at night leave footprints
    if(a.isWolfNight && a.moveT % 12 === 0){
      footprints.push({ x:a.x, y:a.y+PLAYER_R*0.5, age:0 });
      if(footprints.length>200) footprints.shift();
    }
  } else { a._speed = (a._speed||0)*0.6; if(a._speed<0.05) a._speed=0; }
}
function clamp(v,a,b){ return v<a?a:v>b?b:v; }

// ============================================================
//  PLAYER ACTIONS
// ============================================================
function nearestActor(from, maxD, filter){
  let best=null, bd=maxD;
  actors.forEach(a=>{
    if(a===from || !a.alive || a.inLocker) return;
    if(filter && !filter(a)) return;
    const d = Math.hypot(a.x-from.x, a.y-from.y);
    if(d<bd){ bd=d; best=a; }
  });
  return best;
}
function nearestStation(from,maxD){
  let best=null,bd=maxD;
  stations.forEach(s=>{
    if(s.done) return;
    const sx=s.tx*TILE+TILE/2, sy=s.ty*TILE+TILE/2;
    const d=Math.hypot(sx-from.x,sy-from.y);
    if(d<bd){ bd=d; best=s; }
  });
  return best;
}
function nearestLocker(from,maxD){
  let best=null,bd=maxD;
  lockers.forEach(l=>{
    const lx=l.tx*TILE+TILE/2, ly=l.ty*TILE+TILE/2;
    const d=Math.hypot(lx-from.x,ly-from.y);
    if(d<bd){ bd=d; best=l; }
  });
  return best;
}

const USE_RANGE_STATION = 58;
const USE_RANGE_LOCKER = 52;
function playerUse(){
  if(!player.alive) return;
  if(player.inLocker){ player.inLocker=false; toast('ออกจากตู้'); return; }
  if(G.paused) return; // an overlay is already open
  const st = nearestStation(player, USE_RANGE_STATION);
  const lk = nearestLocker(player, USE_RANGE_LOCKER);
  if(st && G.phase!=='meeting'){
    if(player.role.team==='village' && questCapReached()){ toast('วันนี้ทำเควสครบโควตาแล้ว ('+QUESTS_PER_DAY+') — รอวันพรุ่งนี้'); return; }
    openMinigame(st); return;
  }
  if(lk){ player.inLocker=true; toast('ซ่อนในตู้ (กด E เพื่อออก)'); return; }
  toast('ไม่มีอะไรให้ใช้ตรงนี้');
}

function playerKill(){
  if(player.role.key!=='WOLF' || !player.alive) return;
  if(G.phase!=='night'){ toast('ฆ่าได้เฉพาะกลางคืน'); return; }
  if(player.killCd>0){ toast('คูลดาวน์ '+Math.ceil(player.killCd)+'วิ'); return; }
  const victim = nearestActor(player, KILL_RANGE, a=>a.role.team!=='wolf');
  if(!victim){ toast('ไม่มีเป้าหมายใกล้พอ'); return; }
  if(isProtected(victim)){ toast('เป้าหมายมีบาเรียป้องกัน!'); player.killCd=4; return; }
  doKill(victim, player);
  player.killCd = KILL_COOLDOWN;
}
function doKill(victim, killer){
  victim.alive=false; victim.inLocker=false;
  corpses.push({x:victim.x,y:victim.y, ts:performance.now()});
  spawnFX(victim.x, victim.y-6, 'blood');   // blood spray
  spawnFX(victim.x, victim.y-6, 'poof',{n:6});
  // WITNESS memory: any living actor near the murder scene remembers who else was around.
  // Bots later use this to build suspicion; the true killer earns the most heat if seen.
  const WITNESS_R = 200;
  const scene=[];
  actors.forEach(w=>{
    if(!w.alive || w===victim || w.inLocker) return;
    if(Math.hypot(w.x-victim.x, w.y-victim.y) > WITNESS_R) return;
    scene.push(w);
    actors.forEach(seen=>{
      if(seen===w || !seen.alive || seen.inLocker) return;
      if(Math.hypot(seen.x-victim.x, seen.y-victim.y) > WITNESS_R) return;
      const heat = (killer && seen===killer) ? 5 : 1.4;  // killer stands out
      addSuspicion(w, seen, heat);
    });
  });
  // "who vanished?" — witnesses gently suspect anyone who WASN'T in sight during the murder
  // (classic werewolf tell: the killer slips away). Small, so it only tips borderline reads.
  scene.forEach(w=>{
    actors.forEach(o=>{
      if(o===w || o===victim || !o.alive) return;
      if(!scene.includes(o)) addSuspicion(w, o, 0.5);
    });
  });
  if(victim.isPlayer){ toast('คุณถูกฆ่า! ตอนนี้เป็นผี — ดูเกมต่อได้'); }
  checkWin();
}
function addSuspicion(observer, target, amt){
  if(!observer.ai || observer===target) return;
  observer.ai.suspicion[target.id] = (observer.ai.suspicion[target.id]||0) + amt;
}
function isProtected(a){
  return barriers.some(b=> b.t>0 && Math.hypot(b.x-a.x,b.y-a.y) < BARRIER_RADIUS);
}

function playerSeer(){
  if(player.role.key!=='SEER'||!player.alive) return;
  if(G.phase!=='night'){ toast('ร่ายได้เฉพาะกลางคืน'); return; }
  // casting handled in update loop while holding still; toggle intent
  player.wantCast = !player.wantCast;
  toast(player.wantCast?'ยืนนิ่งเพื่อร่าย...':'ยกเลิกการร่าย');
}
function playerGuard(){
  if(player.role.key!=='GUARD'||!player.alive) return;
  if(player.barrierCd>0){ toast('บาเรียคูลดาวน์ '+Math.ceil(player.barrierCd)+'วิ'); return; }
  barriers.push({ x:player.x, y:player.y, t:BARRIER_DURATION, owner:player.id });
  player.barrierCd = BARRIER_COOLDOWN;
  toast('กางบาเรีย! กันได้ '+BARRIER_DURATION+'วิ');
}

// ============================================================
//  AI  — role-aware social-deduction bots
// ============================================================
function updateAI(a, dt){
  if(!a.alive || a.isPlayer) return;
  a.ai.t -= dt;

  // ---- proximity suspicion: bots quietly note who lingers near them alone ----
  // (lightweight, runs occasionally) — someone who shadows you a lot feels sus.
  if(Math.random()<0.02){ decayAndSenseSuspicion(a); }

  if(G.phase==='night'){
    if(a.role.key==='WOLF'){ aiWolfNight(a,dt); return; }
    if(a.role.key==='SEER'){ aiSeerNight(a,dt); return; }
    if(a.role.key==='GUARD'){ aiGuardNight(a,dt); return; }
    aiVillagerNight(a,dt); return;   // villager / fool flee & hide
  }

  // ===== DAY =====
  // village + fool do real/near quests; wolves fake them to build an alibi
  aiDayQuestBehavior(a, dt);
}

// --- WOLF at night: stalk an ISOLATED victim, strike only when no witnesses,
//     then RETREAT from the body to avoid being caught near the scene. ---
function aiWolfNight(a, dt){
  // just killed? flee the scene for a few seconds (don't loiter by the corpse)
  if(a.ai.retreat>0){
    a.ai.retreat-=dt;
    if(a.ai.fleeTo) moveToward(a, a.ai.fleeTo.x, a.ai.fleeTo.y, SPEED_WOLF);
    return;
  }
  const witnessesAround=(px,py,exclude)=>{
    let n=0; actors.forEach(o=>{ if(o!==exclude && o!==a && o.alive && !o.inLocker && o.role.team!=='wolf'
      && Math.hypot(o.x-px,o.y-py)<200) n++; }); return n;
  };
  // pick prey: only ones the wolf can actually SEE (within sight + line-of-sight,
  // and not hidden inside another building). No more locking across the whole map.
  let best=null, bestScore=-1e9;
  actors.forEach(p=>{
    if(!p.alive || p.inLocker || p.role.team==='wolf') return;
    const d = Math.hypot(p.x-a.x, p.y-a.y);
    if(d>WOLF_SIGHT) return;
    if(houseAt(p.x,p.y)!==houseAt(a.x,a.y)) return;   // can't see through walls into houses
    if(!lineOfSight(a.x,a.y,p.x,p.y)) return;          // walls/trees block sight
    const w = witnessesAround(p.x,p.y,p);
    let score = -d*0.5 - w*140;
    if(p.role.key==='SEER') score += 120;
    if(score>bestScore){ bestScore=score; best=p; }
  });
  if(best){
    const d=Math.hypot(best.x-a.x,best.y-a.y);
    // close in with pathfinding when far (around walls); pounce straight when adjacent
    if(d>TILE*1.4) moveAlongPath(a, best.x, best.y, SPEED_WOLF);
    else moveToward(a, best.x, best.y, SPEED_WOLF);
    // bold wolves will risk a kill with a witness present; cautious ones wait for a clean shot
    const witnessTol = a.ai.boldness>0.6 ? 1 : 0;
    if(a.killCd<=0 && d<KILL_RANGE && witnessesAround(best.x,best.y,best)<=witnessTol){
      if(!isProtected(best)){
        const bx=best.x, by=best.y;
        doKill(best, a); a.killCd=KILL_COOLDOWN;
        // set a retreat vector away from the body
        const ang=Math.atan2(a.y-by, a.x-bx)||Math.random()*7;
        a.ai.fleeTo={ x:a.x+Math.cos(ang)*260, y:a.y+Math.sin(ang)*260 };
        a.ai.retreat=3.5;
      } else a.killCd=4;
    }
  } else wander(a, SPEED_HUMAN);
}

// --- SEER at night: find a quiet spot, stand still, "cast", then patrol ---
function aiSeerNight(a, dt){
  if(a.ai.castedTonight){ aiVillagerNight(a,dt); return; }
  const wolf = nearestActor(a, 150, x=>x.isWolfNight);
  if(wolf){ // too dangerous, flee first
    moveToward(a, a.x*2-wolf.x, a.y*2-wolf.y, SPEED_HUMAN); a.castT=0; return;
  }
  // stand still to channel
  a.castT += dt;
  if(a.castT>=SEER_CAST_TIME){
    a.ai.castedTonight=true; a.castT=0;
    // the seer "learns": bump suspicion toward whoever left footprints nearest (a wolf)
    let nearWolf=null,bd=280;
    actors.forEach(w=>{ if(w.isWolfNight){ const d=Math.hypot(w.x-a.x,w.y-a.y); if(d<bd){bd=d;nearWolf=w;} }});
    if(nearWolf) addSuspicion(a, nearWolf, 4);
  }
}

// --- GUARD at night: shadow a likely-innocent nearby and shield them ---
function aiGuardNight(a, dt){
  if(a.barrierCd<=0 && !a.ai.guardedThisNight){
    // protect the nearest non-wolf survivor (or self if a wolf is close)
    const wolf = nearestActor(a, 160, x=>x.isWolfNight);
    if(wolf){ barriers.push({x:a.x,y:a.y,t:BARRIER_DURATION,owner:a.id}); a.barrierCd=BARRIER_COOLDOWN; a.ai.guardedThisNight=true; }
  }
  aiVillagerNight(a,dt);
}

// Flee from a threat but pick a direction that is actually walkable (no dead-end corners).
function fleeFrom(a, threat, speed){
  const baseAng = Math.atan2(a.y-threat.y, a.x-threat.x);
  // sample the away-direction and a few spread angles; move toward the best open one
  const tries=[0, 0.5, -0.5, 1.0, -1.0, 1.6, -1.6];
  let bx=a.x+Math.cos(baseAng)*60, by=a.y+Math.sin(baseAng)*60, ok=false;
  for(const off of tries){
    const ang=baseAng+off;
    const tx=a.x+Math.cos(ang)*TILE*1.6, ty=a.y+Math.sin(ang)*TILE*1.6;
    if(!solid(tx,ty)){ bx=tx; by=ty; ok=true; break; }
  }
  moveToward(a, bx, by, speed);
  return ok;
}
// --- VILLAGER/FOOL at night: flee wolves, else roam toward a house/hide ---
function aiVillagerNight(a, dt){
  // only notice a wolf you can actually see (line of sight), scaled by caution
  const senseR = 150 + a.ai.caution*140;   // 150..290
  let wolf = nearestActor(a, senseR, x=>x.isWolfNight);
  if(wolf && !lineOfSight(a.x,a.y,wolf.x,wolf.y)) wolf=null;
  if(wolf){
    const lockR = 42 + a.ai.caution*22;
    const lk = nearestLocker(a, lockR);
    if(lk && Math.random()<0.4+a.ai.caution*0.5){ a.inLocker=true; return; }
    fleeFrom(a, wolf, SPEED_HUMAN*1.08);   // adrenaline: flee a touch faster than a stroll
    if(Math.random()<0.05) addSuspicion(a, wolf, 0.8);
  } else {
    if(a.inLocker && Math.random()<0.02) a.inLocker=false;
    if(!a.inLocker){ if(a.ai.t<=0){ pickWanderTarget(a); a.ai.t=2; } stepToTargetPath(a, SPEED_HUMAN); }
  }
}

function aiDayQuestBehavior(a, dt){
  const isWolf = a.role.team==='wolf';
  // day's quota already met? villagers socialize/observe instead of grinding (nothing left to do today).
  if(!isWolf && questCapReached()){
    if(a.ai.t<=0){ pickWanderTarget(a); a.ai.t=1.5+Math.random()*2; }
    stepToTargetPath(a, SPEED_HUMAN); return;
  }
  // lazy (low-diligence) villagers sometimes wander/socialize instead of grinding quests
  if(!isWolf && a.ai.questTargetIdx<0 && Math.random() > a.ai.diligence){
    if(a.ai.t<=0){ pickWanderTarget(a); a.ai.t=1.5+Math.random()*2; }
    stepToTargetPath(a, SPEED_HUMAN); return;
  }
  // wolves prefer to fake-quest near a crowd for an alibi; occasionally trail a lone villager
  if(isWolf && Math.random()<0.008){
    a.ai.questTargetIdx = Math.random()<0.55 ? pickStationNearCrowd(a) : pickOpenStation();
  }
  if(a.ai.questTargetIdx<0 || (stations[a.ai.questTargetIdx] && stations[a.ai.questTargetIdx].done)){
    a.ai.questTargetIdx = isWolf ? pickStationNearCrowd(a) : pickOpenStation();
    a.ai.channel = 0;   // reset channel progress when picking a new target
  }
  const st = stations[a.ai.questTargetIdx];
  if(st){
    const sx=st.tx*TILE+TILE/2, sy=st.ty*TILE+TILE/2;
    if(Math.hypot(sx-a.x,sy-a.y)<40){
      // CHANNELING: a quest takes real, uninterrupted time on-site — it isn't finished
      // just by standing near it. This is the fix for "village clears 8 quests in 2 days".
      // Wolves only pretend, so their channel never completes anything.
      a.ai.channel = (a.ai.channel||0) + dt;
      const NEED = QUEST_CHANNEL_SECONDS * (1.35 - a.ai.diligence*0.5); // diligent finish faster
      if(a.ai.channel >= NEED){
        if(a.role.team==='village' && !st.done){ completeStation(st, a); }
        a.ai.channel = 0;
        a.ai.questTargetIdx = -1;
        // dawdle a beat before the next chore (diligent = shorter breather)
        a.ai.t = isWolf ? (1.5+Math.random()*2) : (1.0 + (1-a.ai.diligence)*2.5);
      }
    } else { a.ai.channel = 0; moveAlongPath(a, sx, sy, SPEED_HUMAN); }   // walking resets channel
  } else wander(a, SPEED_HUMAN);
}
// choose an open station that has the most villagers milling nearby (alibi for wolves)
function pickStationNearCrowd(a){
  let best=-1, bestScore=-1e9;
  stations.forEach((s,i)=>{
    if(s.done) return;
    const sx=s.tx*TILE+TILE/2, sy=s.ty*TILE+TILE/2;
    let crowd=0; actors.forEach(o=>{ if(o!==a && o.alive && o.role.team!=='wolf' && Math.hypot(o.x-sx,o.y-sy)<220) crowd++; });
    const dist=Math.hypot(sx-a.x,sy-a.y);
    const score = crowd*100 - dist*0.3;
    if(score>bestScore){ bestScore=score; best=i; }
  });
  return best>=0? best : pickOpenStation();
}
function pickOpenStation(){
  const open = stations.map((s,i)=>s.done?-1:i).filter(i=>i>=0);
  return open.length? open[Math.floor(Math.random()*open.length)] : -1;
}
function moveToward(a,tx,ty,sp){
  const dx=tx-a.x, dy=ty-a.y; const d=Math.hypot(dx,dy)||1;
  moveActor(a, dx/d, dy/d, sp);
}
function pickWanderTarget(a){
  // pick a nearby WALKABLE tile so bots don't aim into walls
  for(let i=0;i<8;i++){
    const tx=Math.floor(a.x/TILE)+Math.floor(Math.random()*9-4);
    const ty=Math.floor(a.y/TILE)+Math.floor(Math.random()*9-4);
    if(tileWalkable(tx,ty)){ a.ai.target={ x:tx*TILE+TILE/2, y:ty*TILE+TILE/2 }; return; }
  }
  a.ai.target={ x:a.x, y:a.y };
}
function stepToTarget(a,sp){
  if(!a.ai.target){ pickWanderTarget(a); }
  moveToward(a, a.ai.target.x, a.ai.target.y, sp);
  if(Math.hypot(a.ai.target.x-a.x, a.ai.target.y-a.y)<20) a.ai.target=null;
}
// pathfinding wander step (for roaming around the village believably)
function stepToTargetPath(a,sp){
  if(!a.ai.target){ pickWanderTarget(a); }
  moveAlongPath(a, a.ai.target.x, a.ai.target.y, sp);
  if(Math.hypot(a.ai.target.x-a.x, a.ai.target.y-a.y)<24) a.ai.target=null;
}
function wander(a,sp){ if(a.ai.t<=0){ pickWanderTarget(a); a.ai.t=1.5; } stepToTargetPath(a,sp); }

// bots slowly forget suspicion, and gain a little toward anyone who has been
// shadowing them closely & alone (classic "why are you always near me?" read)
function decayAndSenseSuspicion(a){
  const s=a.ai.suspicion;
  for(const id in s){ s[id]*=0.985; if(s[id]<0.05) delete s[id]; }
  // who's closest to me right now, and are we relatively alone?
  let near=null,nd=90;
  actors.forEach(o=>{ if(o===a||!o.alive||o.inLocker) return; const d=Math.hypot(o.x-a.x,o.y-a.y); if(d<nd){nd=d;near=o;} });
  if(near){
    let others=0;
    actors.forEach(o=>{ if(o!==a&&o!==near&&o.alive&&!o.inLocker&&Math.hypot(o.x-a.x,o.y-a.y)<160) others++; });
    if(others===0) addSuspicion(a, near, 0.25); // lingering alone with me = mildly sus
  }
  // HARD TELL: catch someone loitering next to a FRESH corpse (a wolf who couldn't
  // retreat in time). This is observable evidence — the kind bots were missing before.
  const now=performance.now();
  corpses.forEach(c=>{
    if(now - (c.ts||0) > 6000) return;              // only fresh bodies (≤6s)
    if(Math.hypot(a.x-c.x, a.y-c.y) > 220) return;  // I must be near the scene too
    actors.forEach(o=>{
      if(o===a || !o.alive || o.inLocker || !o.role) return;
      if(Math.hypot(o.x-c.x, o.y-c.y) > 70) return; // they're basically standing on the body
      a.ai.seenNearCorpse[o.id]=(a.ai.seenNearCorpse[o.id]||0)+1;
      addSuspicion(a, o, 3.5);                       // strong, but needs repeated sightings to dominate
    });
  });
}

// ============================================================
//  QUEST MINIGAMES  (overlay)
// ============================================================
const overlay = document.getElementById('overlay');
function questCapReached(){ return questsToday >= QUESTS_PER_DAY; }
function completeStation(st, doer){
  if(st.done) return;
  st.done = true; questsDone++; questsToday++;
  // ALIBI: nearby living bots witness the doer actually finishing a quest.
  // Real village work is the strongest trust signal — it lowers how much they suspect the doer.
  if(doer){
    const sx=st.tx*TILE+TILE/2, sy=st.ty*TILE+TILE/2;
    actors.forEach(w=>{
      if(w===doer || !w.alive || w.isPlayer || w.inLocker || !w.ai) return;
      if(Math.hypot(w.x-sx, w.y-sy) > 150) return;
      w.ai.questContribSeen[doer.id] = (w.ai.questContribSeen[doer.id]||0)+1;
      // seeing real work done clears suspicion (wolves can't complete stations)
      if(w.ai.suspicion[doer.id]) w.ai.suspicion[doer.id] = Math.max(0, w.ai.suspicion[doer.id]-1.2);
    });
  }
  updateHUDQuest();
  checkWin();
}
function openMinigame(st){
  G.paused = true;
  overlay.hidden = false;
  overlay.innerHTML = '';
  const meta = QUEST_META[st.type]||QUEST_META.wire;
  const box = document.createElement('div');
  box.className = 'mgBox';
  // task banner: what this is + overall progress
  const banner=document.createElement('div');
  banner.className='mgBanner';
  banner.style.cssText='display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;padding-bottom:10px;border-bottom:1px dashed var(--line,rgba(160,140,110,.4))';
  banner.innerHTML=`<span style="font-size:15px"><span style="font-size:18px">${meta.icon}</span> เควส: <b>${meta.name}</b></span>
    <span style="opacity:.75;font-size:13px">ทำไปแล้ว ${questsDone}/${QUESTS_TO_WIN}</span>`;
  box.appendChild(banner);
  const inner=document.createElement('div');
  const builders = { wire:mgWire, sequence:mgSequence, valve:mgValve, rhythm:mgRhythm };
  const mgKey = (QUEST_META[st.type]||{}).mg || 'sequence';
  (builders[mgKey]||mgSequence)(inner, ()=>{ completeStation(st, player); closeOverlay(); }, ()=>closeOverlay());
  box.appendChild(inner);
  overlay.appendChild(box);
}
function closeOverlay(){ overlay.hidden=true; overlay.innerHTML=''; G.paused=false; }

// wire: connect matching colored dots left->right
function mgWire(box, done, cancel){
  const colors=['#d95757','#4fa38a','#6a7bd8','#d3a24c'];
  const order=[...colors]; shuffle(order);
  box.innerHTML = `<h3>ต่อสายไฟให้สีตรงกัน</h3>
    <div class="mgWire"><div class="wcol left"></div><svg class="wsvg"></svg><div class="wcol right"></div></div>
    <button class="mgCancel">ออก</button>`;
  const L=box.querySelector('.left'), R=box.querySelector('.right');
  colors.forEach((c,i)=>{ const d=document.createElement('div'); d.className='wdot'; d.style.background=c; d.dataset.c=c; d.dataset.side='L'; L.appendChild(d); });
  order.forEach((c,i)=>{ const d=document.createElement('div'); d.className='wdot'; d.style.background=c; d.dataset.c=c; d.dataset.side='R'; R.appendChild(d); });
  let sel=null, matched=0;
  box.querySelectorAll('.wdot').forEach(d=> d.onclick=()=>{
    if(!sel){ if(d.dataset.side==='L'){ sel=d; d.classList.add('sel'); } return; }
    if(d.dataset.side==='R' && d.dataset.c===sel.dataset.c && !d.classList.contains('ok') && !sel.classList.contains('ok')){
      sel.classList.add('ok'); d.classList.add('ok'); sel.classList.remove('sel'); sel=null; matched++;
      if(matched===colors.length) setTimeout(done,300);
    } else { sel.classList.remove('sel'); sel=null; }
  });
  box.querySelector('.mgCancel').onclick=cancel;
}
// sequence: repeat the flashed order
function mgSequence(box, done, cancel){
  const n=4; const seq=Array.from({length:4},()=>Math.floor(Math.random()*n));
  box.innerHTML=`<h3>จำลำดับแล้วกดตาม</h3><div class="mgSeq"></div><button class="mgCancel">ออก</button>`;
  const grid=box.querySelector('.mgSeq');
  const btns=[];
  for(let i=0;i<n;i++){ const b=document.createElement('button'); b.className='seqBtn'; b.textContent=i+1; grid.appendChild(b); btns.push(b); }
  let idx=0, canInput=false;
  function flash(i){ return new Promise(r=>{ btns[i].classList.add('lit'); setTimeout(()=>{ btns[i].classList.remove('lit'); setTimeout(r,180); },420); }); }
  (async()=>{ for(const s of seq){ await flash(s); } canInput=true; })();
  btns.forEach((b,i)=> b.onclick=()=>{
    if(!canInput) return;
    if(i===seq[idx]){ b.classList.add('good'); setTimeout(()=>b.classList.remove('good'),150); idx++; if(idx===seq.length) setTimeout(done,250); }
    else { idx=0; box.querySelector('h3').textContent='ผิด! เริ่มใหม่'; }
  });
  box.querySelector('.mgCancel').onclick=cancel;
}
// valve: rotate to target
function mgValve(box, done, cancel){
  const target=Math.floor(Math.random()*4)*90;
  let cur=0;
  box.innerHTML=`<h3>หมุนวาล์วให้ลูกศรชี้ขึ้น</h3><div class="mgValve"><div class="valve">➤</div></div>
    <div class="valveBtns"><button class="vL">↺</button><button class="vR">↻</button></div><button class="mgCancel">ออก</button>`;
  const v=box.querySelector('.valve');
  function upd(){ v.style.transform=`rotate(${cur-target}deg)`; if(((cur-target)%360+360)%360===0){ setTimeout(done,250); } }
  box.querySelector('.vL').onclick=()=>{ cur-=90; upd(); };
  box.querySelector('.vR').onclick=()=>{ cur+=90; upd(); };
  v.style.transform=`rotate(${cur-target}deg)`;
  box.querySelector('.mgCancel').onclick=cancel;
}
// rhythm: click when marker in zone
function mgRhythm(box, done, cancel){
  box.innerHTML=`<h3>กดตอนตัวชี้อยู่กลางแถบ</h3><div class="mgRhythm"><div class="rbar"><div class="rzone"></div><div class="rmark"></div></div></div>
    <button class="rhit">กด!</button><button class="mgCancel">ออก</button>`;
  const mark=box.querySelector('.rmark'); let pos=0,dir=1,hits=0,raf;
  function loop(){ pos+=dir*1.4; if(pos>100){pos=100;dir=-1;} if(pos<0){pos=0;dir=1;} mark.style.left=pos+'%'; raf=requestAnimationFrame(loop); }
  loop();
  box.querySelector('.rhit').onclick=()=>{ if(pos>38&&pos<62){ hits++; box.querySelector('h3').textContent='ดี! '+hits+'/3'; if(hits>=3){ cancelAnimationFrame(raf); setTimeout(done,200);} } else { box.querySelector('h3').textContent='พลาด!'; } };
  box.querySelector('.mgCancel').onclick=()=>{ cancelAnimationFrame(raf); cancel(); };
}

// ============================================================
//  MEETING + VOTE
// ============================================================
function openMeeting(){
  G.paused = true;
  overlay.hidden=false;
  const alive = actors.filter(a=>a.alive);
  overlay.innerHTML = `<div class="meetBox">
    <h2>🔥 ประชุมยามเช้า</h2>
    <p class="meetSub">มีใครน่าสงสัย? โหวตขับ 1 คน (หรือข้าม)</p>
    <div class="voteGrid" id="voteGrid"></div>
    <button class="voteSkip" id="voteSkip">ข้ามการโหวต</button>
  </div>`;
  const grid = overlay.querySelector('#voteGrid');
  alive.forEach(a=>{
    const b=document.createElement('button');
    b.className='voteCard'+(a.isPlayer?' me':'');
    b.innerHTML=`<span class="vName">${a.name}${a.isPlayer?' (คุณ)':''}</span>`;
    b.onclick=()=>{ if(!player.alive) return; castPlayerVote(a); };
    grid.appendChild(b);
  });
  overlay.querySelector('#voteSkip').onclick=()=>{ if(player.alive) castPlayerVote(null); };
  if(!player.alive){ // dead player observes; tally bots automatically
    setTimeout(()=>tallyAndResolve(null), 1600);
  }
}
// player picks -> collect every bot's vote too, then resolve by majority
function castPlayerVote(choice){
  tallyAndResolve(choice);
}
// each bot votes based on its own suspicion memory; wolves deflect onto a villager
// wolves agree on one scapegoat before the vote (coordinated push onto a villager),
// prioritizing: a villager the group already suspects, and deflecting away from the
// wolf who is currently under the most heat.
function wolfPackTarget(alive){
  if(wolfPackTarget._cache && wolfPackTarget._round===G.day) return wolfPackTarget._cache;
  const villagers = alive.filter(a=>a.role.team!=='wolf');
  if(!villagers.length){ return null; }
  // prefer the villager the group already suspects most (safest bandwagon)
  villagers.sort((a,b)=> groupHeat(b,alive)-groupHeat(a,alive));
  wolfPackTarget._cache = villagers[0];
  wolfPackTarget._round = G.day;
  return villagers[0];
}
function botVote(bot, alive){
  if(bot.role.team==='wolf'){
    const target = wolfPackTarget(alive);
    if(!target) return null;
    // the wolf under most heat should look calm and abstain sometimes; others push hard
    const myHeat = groupHeat(bot, alive);
    const layLow = myHeat>4 ? 0.15 : 0.25;
    if(Math.random()<layLow) return null;
    return target;
  }
  // FOOL wins by being voted out, so it actively courts suspicion: pile onto
  // whoever the group is already eyeing (looks like an over-eager accuser) to draw heat.
  if(bot.role.key==='FOOL'){
    const top = topGroupSuspect(alive, bot);
    // vote the current front-runner so the fool looks like it's "trying too hard"
    if(top && Math.random()<0.8) return top;
    // otherwise throw a vote at a random villager to seem erratic
    const others=alive.filter(o=>o!==bot);
    return others.length? others[Math.floor(Math.random()*others.length)] : null;
  }
  // village: vote whoever THIS bot suspects most, if it clears a threshold.
  // paranoid bots have a LOWER bar (vote on thin evidence); calm bots need more.
  const s=bot.ai.suspicion;
  const bar = 2.0 - (bot.ai.paranoia||0.5)*1.6;   // ~0.4 (paranoid) .. ~2.0 (calm)
  let best=null,bv=bar;
  alive.forEach(o=>{ if(o===bot) return; const v=s[o.id]||0; if(v>bv){bv=v;best=o;} });
  if(best && Math.random()<0.82+bot.ai.paranoia*0.15) return best;
  // no strong personal read -> COORDINATE: back the town's leading suspect so the
  // village stops splitting its votes (this was the core "dumb voting" bug: everyone abstained).
  const top = topGroupSuspect(alive, bot);
  if(top && Math.random()< 0.55 + bot.ai.paranoia*0.35) return top;
  // still nothing convincing — only the calmest bots abstain now, not the majority.
  if(Math.random()<0.35) return top || null;
  return null;
}
function groupHeat(target, alive){
  let sum=0; alive.forEach(o=>{ if(o!==target && o.ai) sum+=(o.ai.suspicion[target.id]||0); }); return sum;
}
function topGroupSuspect(alive, exclude){
  let best=null,bv=2; alive.forEach(t=>{ if(t===exclude) return; const h=groupHeat(t,alive); if(h>bv){bv=h;best=t;} }); return best;
}
function tallyAndResolve(playerChoice){
  const alive=actors.filter(a=>a.alive);
  const tally={}; // id -> count ; null tallied under key 'skip'
  const add=(who)=>{ const k= who?who.id:'skip'; tally[k]=(tally[k]||0)+1; };
  // player's vote (if alive)
  if(player.alive) add(playerChoice);
  // bots
  alive.forEach(b=>{ if(b.isPlayer) return; add(botVote(b, alive)); });

  // find max
  let winnerId=null, max=-1, tie=false;
  for(const k in tally){ if(tally[k]>max){ max=tally[k]; winnerId=k; tie=false; } else if(tally[k]===max) tie=true; }
  const ejected = (winnerId && winnerId!=='skip' && !tie) ? actors.find(a=>String(a.id)===String(winnerId)) : null;
  showVoteResult(tally, ejected, ()=> resolveVote(ejected));
}
function showVoteResult(tally, ejected, done){
  const alive=actors.filter(a=>a.alive);
  const rowStyle='display:flex;justify-content:space-between;padding:7px 12px;border-bottom:1px solid var(--line,rgba(160,140,110,.3));font-size:15px';
  const rows = alive.map(a=>`<div class="vrow" style="${rowStyle}"><span>${a.name}${a.isPlayer?' (คุณ)':''}</span><b>${tally[a.id]||0}</b></div>`).join('')
    + `<div class="vrow skip" style="${rowStyle};opacity:.7"><span>ข้าม</span><b>${tally['skip']||0}</b></div>`;
  overlay.hidden=false;
  overlay.innerHTML=`<div class="meetBox">
    <h2>ผลโหวต</h2>
    <div class="voteResult">${rows}</div>
    <p class="voteOutcome">${ ejected ? ('ขับ <b>'+ejected.name+'</b> ออก') : 'เสียงไม่พอ — ไม่มีใครถูกขับ' }</p>
  </div>`;
  setTimeout(done, 1900);
}
function resolveVote(choice){
  closeOverlay();
  if(choice){
    choice.alive=false;
    corpses.push({x:choice.x,y:choice.y, ts:performance.now()});
    if(choice.role.key==='FOOL'){ endGame('คนบ้าชนะ!', choice.name+' คือคนบ้า — ถูกโหวตออกแล้วชนะทันที'); return; }
    toast('ขับ '+choice.name+' ออก ('+choice.role.label+')');
  } else toast('ที่ประชุมข้ามการโหวต');
  if(checkWin()) return;
  startPhase('night');
}

// ============================================================
//  WIN CHECK
// ============================================================
function checkWin(){
  if(G.over) return true;
  const alive = actors.filter(a=>a.alive);
  const wolves = alive.filter(a=>a.role.team==='wolf');
  const villageSide = alive.filter(a=>a.role.team!=='wolf'); // includes fool while alive
  if(questsDone>=QUESTS_TO_WIN){ endGame('ชาวบ้านชนะ!','ทำเควสครบทุกจุด หมู่บ้านปลอดภัย'); return true; }
  if(wolves.length===0){ endGame('ชาวบ้านชนะ!','กำจัดหมาป่าหมดแล้ว'); return true; }
  if(wolves.length>=villageSide.length){ endGame('หมาป่าชนะ!','หมาป่ามีจำนวนเทียบเท่าฝ่ายที่เหลือ'); return true; }
  return false;
}
function endGame(title,desc){
  G.over=true; G.running=false; G.phase='over';
  const go=document.getElementById('gameover');
  document.getElementById('goTitle').textContent=title;
  document.getElementById('goDesc').textContent=desc + ` — บทบาทคุณ: ${player.role.label}`;
  go.hidden=false;
}

// ============================================================
//  UPDATE LOOP
// ============================================================
let lastT=0;
function loop(t){
  requestAnimationFrame(loop);
  const rawMs = (t-lastT) || 16;
  const dt = Math.min(0.05, (t-lastT)/1000 || 0); lastT=t;
  if(G.running && !G.over){
    update(dt);
    fpsWatch(rawMs);
  }
  render();
}
function update(dt){
  tickPhase(dt);
  if(G.paused) return;

  // player — GHOST: once dead you can drift around and watch, phasing through walls/props.
  if(!player.alive){
    const {dx,dy}=readInput();
    if(dx||dy){
      const len=Math.hypot(dx,dy)||1;
      const gs=SPEED_HUMAN*1.15;                 // ghosts glide a touch faster, no stamina
      player.x = clamp(player.x + (dx/len)*gs, PLAYER_R, MAP_W*TILE-PLAYER_R);
      player.y = clamp(player.y + (dy/len)*gs, PLAYER_R, MAP_H*TILE-PLAYER_R);   // no collision = phases through
      player.dir = Math.abs(dx)>Math.abs(dy) ? (dx<0?'left':'right') : (dy<0?'up':'down');
      player._moving=true; player.walkT+=dt;
    } else player._moving=false;
  }
  // player
  if(player.alive){
    const {dx,dy}=readInput();
    const moving=(dx||dy);
    // sprint: costs stamina, must recover past a floor before re-engaging
    const wantSprint = sprintHeld && moving && !player.inLocker && stamina>1;
    if(wantSprint && (sprinting || stamina>STAMINA_MIN_TO_RUN)){
      sprinting=true; stamina=Math.max(0, stamina-STAMINA_DRAIN*dt);
      if(stamina<=0) sprinting=false;
    } else {
      sprinting=false; stamina=Math.min(STAMINA_MAX, stamina+STAMINA_REGEN*dt);
    }
    let sp = (player.isWolfNight)?SPEED_WOLF:SPEED_HUMAN;
    if(sprinting) sp*=SPRINT_MULT;
    if(!player.inLocker) moveActor(player, dx, dy, sp);
    // extra dust when sprinting
    if(sprinting && moving && player.moveT%6===0) spawnFX(player.x+(Math.random()*8-4), player.y+PLAYER_R-2, 'dust');
    // seer casting
    if(player.role.key==='SEER' && player.wantCast && G.phase==='night'){
      if(dx===0&&dy===0){ player.castT += dt; if(player.castT>=SEER_CAST_TIME){ revealFootprints(); player.wantCast=false; player.castT=0; toast('พยากรณ์สำเร็จ! เห็นรอยเท้าหมาป่า'); } }
      else player.castT = 0;
    }
    if(player.killCd>0) player.killCd-=dt;
    if(player.barrierCd>0) player.barrierCd-=dt;
  } else {
    stamina=Math.min(STAMINA_MAX, stamina+STAMINA_REGEN*dt);
  }
  // stamina HUD
  const sbar=document.getElementById('staminaBar');
  if(sbar){ sbar.style.width=stamina+'%'; sbar.className = sprinting?'sprinting':(stamina<STAMINA_MIN_TO_RUN?'depleted':''); }
  // AI
  actors.forEach(a=>{
    if(a.killCd>0) a.killCd-=dt;
    updateAI(a,dt);
  });

  // barriers (spark occasionally along the dome)
  barriers.forEach(b=>{ b.t-=dt; if(Math.random()<0.15){ const ang=Math.random()*7; spawnFX(b.x+Math.cos(ang)*BARRIER_RADIUS, b.y+Math.sin(ang)*BARRIER_RADIUS,'spark',{n:1}); } });
  barriers = barriers.filter(b=>b.t>0);
  // footprints age
  footprints.forEach(f=> f.age+=dt);
  footprints = footprints.filter(f=>f.age<FOOT_FADE);

  updateParticles(dt);
  updateActionButtons();
  updatePrompt();
}

let seerRevealT = 0;
function revealFootprints(){
  seerRevealT = 6; // show for 6s brightly
  if(player) spawnFX(player.x, player.y-6, 'cast', {n:20}); // magic burst on the seer
}

// ============================================================
//  RENDER
// ============================================================
let cam={x:0,y:0};
function render(){
  ctx.clearRect(0,0,VW,VH);
  if(G.phase==='title'){ return; }

  // camera follows player
  cam.x = clamp(player.x - VW/2, 0, MAP_W*TILE - VW);
  cam.y = clamp(player.y - VH/2, 0, MAP_H*TILE - VH);
  if(MAP_W*TILE<VW) cam.x=(MAP_W*TILE-VW)/2;
  if(MAP_H*TILE<VH) cam.y=(MAP_H*TILE-VH)/2;

  ctx.save();
  ctx.translate(-cam.x,-cam.y);

  drawTiles();
  drawHouseWalls();     // 2-layer houses: wall base drawn always (under furniture/actors)
  drawFurniture();      // interior furniture (under actors), only when revealed
  drawObjects();
  drawFootprints();
  drawCorpses();
  drawStations();
  drawBarriers();
  // Roofs of OTHER houses draw BEFORE actors, so a character standing in front of a house
  // is drawn on top of that roof (not buried under it). This fixes the "roof layered wrong"
  // look. The roof of the house the player is INSIDE is handled after actors (it fades out).
  drawRoofs(false);
  drawActors();
  drawParticles();
  drawRoofs(true);      // only the entered house's fading roof, above the player

  ctx.restore();

  drawNightOverlay();
}

// Fade each house roof: solid when player is outside, transparent when inside it.
// helpers: is there a handcrafted wall/roof SVG for this house kind?
function houseWallImg(h){ return IMG['obj-house-'+h.kind+(h.back?'-back':'')+'-wall'] || IMG['obj-house-'+h.kind+'-wall']; }
function houseRoofImg(h){ return IMG['obj-house-'+h.kind+(h.back?'-back':'')+'-roof'] || IMG['obj-house-'+h.kind+'-roof']; }
// draw the house body (wall layer). If Antigravity shipped a wall SVG, use it; else the
// procedural warm floor band is drawn later in drawFurniture. viewBox maps to the full footprint.
// The house SVG (viewBox 0..200) is drawn to exactly fill the footprint, with only a
// small upward overhang for the roof eaves so it reads as 3/4 without spilling over
// neighbouring tiles. Bottom edge = footprint bottom.
const HOUSE_TOP_OVERHANG = 0.45 * TILE;    // small roof overhang; keeping it tight makes the
                                           // visible walls line up with the solid footprint,
                                           // so players don't hit invisible walls under the eaves
function houseSpriteRect(h){
  const px=h.x*TILE, w=h.w*TILE, hh=h.h*TILE;
  return { px, top: h.y*TILE - HOUSE_TOP_OVERHANG, w, fullH: hh + HOUSE_TOP_OVERHANG };
}
function drawHouseWalls(){
  houses.forEach(h=>{
    const wall=houseWallImg(h); if(!wall) return;
    const r=houseSpriteRect(h);
    ctx.drawImage(wall, r.px, r.top, r.w, r.fullH);
  });
}
function drawFurniture(){
  const inside = houseAt(player.x, player.y);
  houses.forEach(h=>{
    h._roofA = (h._roofA===undefined)?1:h._roofA;
    const target = (h===inside)?0:1;
    h._roofA += (target - h._roofA)*0.2;   // smooth fade
    if(h._roofA > 0.85) return;            // interior hidden -> skip furniture
    // if there's a wall SVG, skip the procedural floor band (wall already provides the look)
    if(houseWallImg(h)){
      ctx.save(); ctx.globalAlpha=1-h._roofA;
      h.furniture.forEach(f=> drawFurnitureItem(f));
      if(h.wardrobe){ const w=h.wardrobe; drawFurnitureItem({type:'wardrobe',tx:w.tx,ty:w.ty}); }
      ctx.restore();
      return;
    }
    ctx.save(); ctx.globalAlpha = 1 - h._roofA;
    // floor accent (a warmer inner floor so it reads as "indoors")
    ctx.fillStyle='rgba(60,48,34,0.5)';
    ctx.fillRect((h.x+1)*TILE,(h.y+1)*TILE,(h.w-2)*TILE,(h.h-2)*TILE);
    h.furniture.forEach(f=> drawFurnitureItem(f));
    if(h.wardrobe){ const w=h.wardrobe; drawFurnitureItem({type:'wardrobe',tx:w.tx,ty:w.ty}); }
    ctx.restore();
  });
}
function drawFurnitureItem(f){
  const px=f.tx*TILE, py=f.ty*TILE, name='obj-'+f.type;
  if(IMG[name]){ ctx.drawImage(IMG[name], px, py-TILE*0.4, TILE, TILE*1.3); return; }
  // procedural fallbacks so each item is legible before Antigravity ships art
  const cx=px+TILE/2, cy=py+TILE/2;
  ctx.save();
  switch(f.type){
    case 'bed':   ctx.fillStyle='#5a4a6a'; ctx.fillRect(px+4,py+6,TILE-8,TILE-12); ctx.fillStyle='#cdbfe0'; ctx.fillRect(px+6,py+8,TILE-12,10); break;
    case 'stove': ctx.fillStyle='#3a3a40'; ctx.fillRect(px+6,py+6,TILE-12,TILE-12); ctx.fillStyle='#ff7a2a'; ctx.beginPath(); ctx.arc(cx,cy+2,5,0,7); ctx.fill(); break;
    case 'table': ctx.fillStyle='#6b4f34'; ctx.fillRect(px+4,py+10,TILE-8,TILE-18); ctx.fillStyle='#4a3423'; ctx.fillRect(px+6,py+TILE-10,4,8); ctx.fillRect(px+TILE-10,py+TILE-10,4,8); break;
    case 'shelf': ctx.fillStyle='#4a3826'; ctx.fillRect(px+5,py+3,TILE-10,TILE-8); ctx.fillStyle='#8a6a3a'; for(let i=0;i<3;i++)ctx.fillRect(px+7,py+6+i*8,TILE-14,3); break;
    case 'crate': ctx.fillStyle='#7a5a34'; ctx.fillRect(px+6,py+6,TILE-12,TILE-12); ctx.strokeStyle='#4a3420'; ctx.strokeRect(px+6,py+6,TILE-12,TILE-12); ctx.beginPath(); ctx.moveTo(px+6,py+6); ctx.lineTo(px+TILE-6,py+TILE-6); ctx.moveTo(px+TILE-6,py+6); ctx.lineTo(px+6,py+TILE-6); ctx.stroke(); break;
    case 'barrel':ctx.fillStyle='#6b4a2a'; ctx.beginPath(); ctx.ellipse(cx,cy,TILE*0.28,TILE*0.36,0,0,7); ctx.fill(); ctx.strokeStyle='#3a2814'; ctx.beginPath(); ctx.ellipse(cx,cy,TILE*0.28,TILE*0.12,0,0,7); ctx.stroke(); break;
    case 'anvil': ctx.fillStyle='#33343a'; ctx.fillRect(px+8,py+TILE-16,TILE-16,8); ctx.fillRect(px+6,py+TILE-22,TILE-12,7); break;
    case 'chest': ctx.fillStyle='#6b4a2a'; ctx.fillRect(px+6,py+10,TILE-12,TILE-16); ctx.fillStyle='#c9a24c'; ctx.fillRect(cx-2,py+14,4,5); break;
    case 'rug':   ctx.fillStyle='rgba(140,60,60,0.6)'; ctx.fillRect(px+4,py+6,TILE-8,TILE-12); break;
    case 'candle':ctx.fillStyle='#e8d8a0'; ctx.fillRect(cx-2,cy-2,4,8); ctx.fillStyle='#ffcf6b'; ctx.beginPath(); ctx.arc(cx,cy-4,3,0,7); ctx.fill(); break;
    case 'pot':   ctx.fillStyle='#5a4a3a'; ctx.beginPath(); ctx.arc(cx,cy,TILE*0.22,0,7); ctx.fill(); break;
    case 'wardrobe': ctx.fillStyle='#5a3f28'; ctx.fillRect(px+6,py-2,TILE-12,TILE+2); ctx.strokeStyle='#2f2011'; ctx.strokeRect(px+6,py-2,TILE-12,TILE+2); ctx.fillStyle='#2f2011'; ctx.fillRect(cx-1,py+4,2,TILE-10); break;
    default: ctx.fillStyle='#5a4a3a'; ctx.fillRect(px+8,py+8,TILE-16,TILE-16);
  }
  ctx.restore();
}
// per-kind roof palette so houses read as distinct (until Antigravity ships obj-roof-<kind>)
const ROOF_STYLE = {
  bedroom:   {base:'#5a3a6a', shade:'#4a2f57', ridge:'#7a54a0'},
  kitchen:   {base:'#7a3d26', shade:'#63301c', ridge:'#a85f38'},
  library:   {base:'#3a5a4a', shade:'#2e4a3c', ridge:'#4f8a6f'},
  storehouse:{base:'#6a5a34', shade:'#544825', ridge:'#8f7a44'},
  elder:     {base:'#5a4636', shade:'#48372a', ridge:'#7a6048'},
  workshop:  {base:'#455066', shade:'#374052', ridge:'#5f74a0'},
};
function drawRoofs(fadingPass){
  houses.forEach(h=>{
    const a = (h._roofA===undefined)?1:h._roofA;
    if(a<=0.02) return;
    // fadingPass=false → only fully-opaque roofs (houses nobody is inside), drawn under actors.
    // fadingPass=true  → only the entered house's partially-faded roof, drawn over actors.
    const isFading = a < 0.98;
    if(fadingPass !== isFading) return;
    const px=h.x*TILE, py=h.y*TILE, w=h.w*TILE, hh=h.h*TILE;
    const st = ROOF_STYLE[h.kind]||ROOF_STYLE.kitchen;
    ctx.save(); ctx.globalAlpha=a;
    // BEST: 2-layer house roof aligned to the wall (same footprint). Walls are drawn
    // separately in drawHouseWalls(), so here we only stack the matching roof.
    const roof2=houseRoofImg(h);
    if(roof2){
      const r=houseSpriteRect(h);          // same rect as the wall so they align exactly
      ctx.drawImage(roof2, r.px, r.top, r.w, r.fullH);
      ctx.restore(); return;
    }
    const roofName='obj-roof-'+h.kind;
    if(IMG[roofName]||IMG['obj-roof']){
      // draw walls first (so the house has a body under the gable), then the roof on top ~66%
      ctx.fillStyle=st.shade; ctx.fillRect(px, py+hh*0.5, w, hh*0.5);              // wall band
      ctx.fillStyle='rgba(0,0,0,.25)'; ctx.fillRect(px, py+hh-4, w, 4);            // ground shadow
      const rh=hh*0.72;                                                            // roof height (leaves wall showing)
      ctx.drawImage(IMG[roofName]||IMG['obj-roof'], px-TILE*0.15, py-TILE*0.2, w+TILE*0.3, rh);
    } else {
      // GABLED roof drawn as two shaded planes meeting at a horizontal ridge.
      // Overhang is tiny so it never spills past the house footprint.
      const over=TILE*0.12;
      const L=px-over, R=px+w+over, T=py-TILE*0.28, B=py+hh, ridgeY=py+hh*0.5;
      // back plane (upper, lit)
      ctx.fillStyle=st.base;
      ctx.beginPath(); ctx.moveTo(L,ridgeY); ctx.lineTo(R,ridgeY); ctx.lineTo(px+w,T); ctx.lineTo(px,T); ctx.closePath(); ctx.fill();
      // front plane (lower, shaded) — gives the slope its 3D read
      ctx.fillStyle=st.shade;
      ctx.beginPath(); ctx.moveTo(L,ridgeY); ctx.lineTo(R,ridgeY); ctx.lineTo(px+w,B); ctx.lineTo(px,B); ctx.closePath(); ctx.fill();
      // shingle lines on the front plane
      ctx.strokeStyle='rgba(0,0,0,.18)'; ctx.lineWidth=1;
      for(let i=1;i<4;i++){ const yy=ridgeY+(B-ridgeY)*i/4; ctx.beginPath(); ctx.moveTo(L+2,yy); ctx.lineTo(R-2,yy); ctx.stroke(); }
      // ridge beam + highlight
      ctx.strokeStyle=st.ridge; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(L,ridgeY); ctx.lineTo(R,ridgeY); ctx.stroke();
      ctx.fillStyle='rgba(255,225,185,.12)'; ctx.fillRect(L, ridgeY-2, R-L, 2);
      // eaves shadow on the ground line
      ctx.fillStyle='rgba(0,0,0,.30)'; ctx.fillRect(L, B-3, R-L, 5);
      // per-kind rooftop feature (chimney / attic window) so silhouettes differ
      roofFeature(h, st, px, py, w, hh);
      ctx.lineWidth=1;
    }
    // DOORWAY: draw a clear door at the base of the wall so the entrance never
    // looks like it sits on top of the roof.
    const dpx=h.doorTx*TILE, dpy=h.doorTy*TILE;
    ctx.globalAlpha=a;
    ctx.fillStyle='rgba(12,8,5,.6)'; ctx.fillRect(dpx+TILE*0.14, dpy+TILE*0.02, TILE*0.72, TILE*0.96);
    ctx.fillStyle='#3a2414'; roundRectPath(dpx+TILE*0.24, dpy+TILE*0.12, TILE*0.52, TILE*0.82, 3); ctx.fill();
    ctx.strokeStyle='#22150b'; ctx.lineWidth=2; ctx.stroke(); ctx.lineWidth=1;
    ctx.fillStyle='#c9a24c'; ctx.beginPath(); ctx.arc(dpx+TILE*0.66, dpy+TILE*0.55, 1.8, 0, 7); ctx.fill();
    ctx.restore();
  });
}
// distinct rooftop props per house kind (chimney, attic window, vent…)
function roofFeature(h, st, px, py, w, hh){
  const cx=px+w*0.5, topY=py-TILE*0.18;
  switch(h.kind){
    case 'kitchen': case 'workshop': { // chimney with smoke
      const chx=px+w*0.72, chy=py+hh*0.1;
      ctx.fillStyle='#3a2c22'; ctx.fillRect(chx, chy-TILE*0.5, TILE*0.28, TILE*0.5);
      ctx.fillStyle='#2a2018'; ctx.fillRect(chx-2, chy-TILE*0.5, TILE*0.28+4, 4);
      break; }
    case 'library': { // tall attic window in the gable
      ctx.fillStyle='#26221a'; roundRectPath(cx-6, topY+4, 12, 16, 3); ctx.fill();
      ctx.strokeStyle=st.ridge; ctx.lineWidth=1.5; ctx.stroke(); break; }
    case 'elder': { // weathered patch / moss
      ctx.fillStyle='rgba(80,110,60,.35)'; ctx.beginPath(); ctx.arc(px+w*0.3,py+hh*0.7,TILE*0.3,0,7); ctx.fill(); break; }
    case 'storehouse': { // roof hatch
      ctx.fillStyle='#2a2018'; ctx.fillRect(cx-8, py+hh*0.6, 16, 12); break; }
    default: { // bedroom: little dormer
      ctx.fillStyle=st.base; ctx.beginPath(); ctx.moveTo(cx-8,py+hh*0.55); ctx.lineTo(cx+8,py+hh*0.55); ctx.lineTo(cx,py+hh*0.4); ctx.closePath(); ctx.fill();
      ctx.fillStyle='#26221a'; ctx.fillRect(cx-4,py+hh*0.52,8,6); }
  }
}
function roundRectPath(x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

// jittered but STABLE per-tile offset (so a path tile's wobble doesn't flicker each frame)
function tileJitter(x,y,amp){
  const s=Math.sin(x*12.9898 + y*78.233)*43758.5453; const f=s-Math.floor(s);
  const s2=Math.sin(x*39.346 + y*11.135)*24634.633; const f2=s2-Math.floor(s2);
  return { jx:(f-0.5)*amp, jy:(f2-0.5)*amp };
}
function drawTiles(){
  const inside = houseAt(player.x, player.y);
  const x0=Math.max(0,Math.floor(cam.x/TILE)), x1=Math.min(MAP_W,Math.ceil((cam.x+VW)/TILE));
  const y0=Math.max(0,Math.floor(cam.y/TILE)), y1=Math.min(MAP_H,Math.ceil((cam.y+VH)/TILE));
  // PASS 1: ground base — draw grass everywhere (paths get grass under them, then an
  // organic dirt overlay on top in pass 2). Floors/walls handled as before.
  for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){
    const t=map[y][x];
    const px=x*TILE, py=y*TILE;
    if(t===3 || t===4){
      const h=houseAt(px,py);
      if(h && houseWallImg(h) && h!==inside){
        if(IMG['tile-grass']) ctx.drawImage(IMG['tile-grass'],px,py,TILE,TILE);
        else { ctx.fillStyle='#38402c'; ctx.fillRect(px,py,TILE,TILE); }
        continue;
      }
    }
    // path tiles get GRASS as their base here; the dirt is painted organically in pass 2
    let name = (t===3||t===4)?'tile-floor' : 'tile-grass';
    if(t===1) name='tile-grass';
    if(IMG[name]) ctx.drawImage(IMG[name],px,py,TILE,TILE);
    else {
      ctx.fillStyle = (t===3||t===4)?'#3a3730' : (t===2?'#243021':'#38402c');
      ctx.fillRect(px,py,TILE,TILE);
      if(t===0){ ctx.fillStyle='rgba(0,0,0,.05)'; if((x+y)%2) ctx.fillRect(px,py,TILE,TILE); }
    }
    if(t===2 && !IMG['obj-tree']){ ctx.fillStyle='#1b2416'; ctx.beginPath(); ctx.arc(px+TILE/2,py+TILE/2,TILE*0.42,0,7); ctx.fill(); }
    if(t===4 && !IMG['obj-house']){ ctx.fillStyle='#4b3d2f'; ctx.fillRect(px,py,TILE,TILE); }
  }
  // PASS 2: ORGANIC PATH — instead of hard square tiles, paint each path tile as an
  // overlapping blob whose centre is jittered and whose radius covers the gaps to its
  // path neighbours. The union of blobs reads as a soft, winding dirt trail, not a grid.
  ctx.save();
  ctx.fillStyle = IMG['tile-path'] ? null : '#5a4d3a';
  const pathCol='#5a4d3a', pathEdge='rgba(70,58,40,0.55)';
  for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){
    if(map[y][x]!==1) continue;
    const {jx,jy}=tileJitter(x,y,TILE*0.28);
    const cxp=x*TILE+TILE/2+jx, cyp=y*TILE+TILE/2+jy;
    // radius a bit over half a tile so adjacent blobs merge into a continuous ribbon
    const r=TILE*0.72;
    // soft dirt fill
    ctx.fillStyle=pathCol;
    ctx.beginPath(); ctx.ellipse(cxp,cyp, r, r*0.9, 0, 0, 7); ctx.fill();
  }
  // subtle darker speckle for texture (stable jitter → no shimmer)
  ctx.fillStyle='rgba(40,32,20,0.25)';
  for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){
    if(map[y][x]!==1) continue;
    const {jx,jy}=tileJitter(x*3+1,y*3+7, TILE*0.6);
    ctx.beginPath(); ctx.arc(x*TILE+TILE/2+jx, y*TILE+TILE/2+jy, 2.5, 0, 7); ctx.fill();
  }
  ctx.restore();
}
// procedural fallbacks for scenery when Antigravity hasn't shipped that SVG yet
function drawProcObject(o, px, py, now){
  const cx=px+TILE/2, cy=py+TILE/2;
  switch(o.type){
    case 'obj-bush': { const sway=Math.sin(now*1.4+o.tx)*2; ctx.fillStyle='#2c3a20'; ctx.beginPath(); ctx.arc(cx+sway,cy,TILE*0.3,0,7); ctx.fill(); ctx.fillStyle='#35471f'; ctx.beginPath(); ctx.arc(cx+sway-4,cy-3,TILE*0.18,0,7); ctx.fill(); break; }
    case 'obj-tree': { const sway=Math.sin(now*1.0+o.tx)*3; ctx.fillStyle='#2a1c10'; ctx.fillRect(cx-3,cy,6,TILE*0.4); ctx.fillStyle='#20301a'; ctx.beginPath(); ctx.arc(cx+sway,cy-6,TILE*0.44,0,7); ctx.fill(); ctx.fillStyle='#2b422a'; ctx.beginPath(); ctx.arc(cx+sway-6,cy-10,TILE*0.26,0,7); ctx.fill(); break; }
    case 'obj-well': { ctx.fillStyle='#4a4038'; ctx.beginPath(); ctx.arc(cx,cy,TILE*0.34,0,7); ctx.fill(); ctx.fillStyle='#1a2838'; ctx.beginPath(); ctx.arc(cx,cy,TILE*0.2,0,7); ctx.fill(); ctx.strokeStyle='#3a2c1c'; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(cx,cy,TILE*0.34,0,7); ctx.stroke(); ctx.lineWidth=1; break; }
    case 'obj-rock': { ctx.fillStyle='#4b4a4e'; ctx.beginPath(); ctx.ellipse(cx,cy+4,TILE*0.32,TILE*0.24,0,0,7); ctx.fill(); ctx.fillStyle='#5c5b60'; ctx.beginPath(); ctx.ellipse(cx-3,cy,TILE*0.2,TILE*0.15,0,0,7); ctx.fill(); break; }
    case 'obj-stump': { ctx.fillStyle='#4a3420'; ctx.beginPath(); ctx.ellipse(cx,cy,TILE*0.2,TILE*0.14,0,0,7); ctx.fill(); ctx.fillStyle='#6a4a2c'; ctx.beginPath(); ctx.ellipse(cx,cy-2,TILE*0.16,TILE*0.1,0,0,7); ctx.fill(); ctx.strokeStyle='#3a2814'; ctx.beginPath(); ctx.ellipse(cx,cy-2,TILE*0.09,TILE*0.055,0,0,7); ctx.stroke(); break; }
    case 'obj-flowers': { const cols=['#c96b8a','#d3a24c','#7d9bd8']; for(let i=0;i<3;i++){ const fx=cx+(i-1)*7, fy=cy+((i%2)?3:-3); ctx.fillStyle='#3a5a2a'; ctx.fillRect(fx-1,fy,2,5); ctx.fillStyle=cols[i%3]; ctx.beginPath(); ctx.arc(fx,fy,2.4,0,7); ctx.fill(); } break; }
    case 'obj-grass': { ctx.strokeStyle='#3f5a2c'; ctx.lineWidth=1.5; const sway=Math.sin(now*2+o.tx)*1.5; for(let i=0;i<4;i++){ const gx=cx+(i-1.5)*4; ctx.beginPath(); ctx.moveTo(gx,cy+6); ctx.quadraticCurveTo(gx+sway,cy,gx+sway*1.5,cy-6); ctx.stroke(); } ctx.lineWidth=1; break; }
  }
}
// visible-tile bounds for the current camera (+1 tile margin for sprites that overhang).
// Objects/props outside this never touch the canvas — this is the fix for the render-bound lag.
function camTileBounds(margin){
  margin = margin||2;
  return {
    x0: Math.floor(cam.x/TILE)-margin, x1: Math.ceil((cam.x+VW)/TILE)+margin,
    y0: Math.floor(cam.y/TILE)-margin, y1: Math.ceil((cam.y+VH)/TILE)+margin,
  };
}
function inView(tx,ty,b){ return tx>=b.x0 && tx<=b.x1 && ty>=b.y0 && ty<=b.y1; }
function drawObjects(){
  const now=performance.now()/1000;
  const b=camTileBounds(2);
  // flat ground decoration first (under everything), then upright props — culled to view
  objects.forEach(o=>{ if(o.flat && inView(o.tx,o.ty,b)){ const px=o.tx*TILE, py=o.ty*TILE; if(IMG[o.type]) ctx.drawImage(IMG[o.type],px,py,TILE,TILE); else drawProcObject(o,px,py,now); } });
  objects.forEach(o=>{
    if(o.flat) return;
    if(!inView(o.tx,o.ty,b)) return;   // cull off-screen props (was drawing all 222 every frame)
    const px=o.tx*TILE, py=o.ty*TILE;
    // gentle wind sway for foliage — rotate a touch around the base
    const foliage = (o.type==='obj-tree'||o.type==='obj-bush');
    if(IMG[o.type]){
      if(foliage){
        const sway=Math.sin(now*1.1 + o.tx*0.7 + o.ty*0.3)*0.03;
        ctx.save();
        ctx.translate(px+TILE/2, py+TILE*0.9);   // pivot near trunk base
        ctx.rotate(sway);
        ctx.drawImage(IMG[o.type], -TILE*0.75, -TILE*1.5, TILE*1.5, TILE*1.5);
        ctx.restore();
      } else {
        ctx.drawImage(IMG[o.type], px-TILE*0.25, py-TILE*0.6, TILE*1.5, TILE*1.5);
      }
    }
    else { drawProcObject(o, px, py, now); }
  });
  // lockers (culled)
  lockers.forEach(l=>{
    if(!inView(l.tx,l.ty,b)) return;
    const px=l.tx*TILE, py=l.ty*TILE;
    if(IMG['obj-locker']) ctx.drawImage(IMG['obj-locker'],px,py-TILE*0.3,TILE,TILE*1.3);
    else { ctx.fillStyle='#6b4f34'; ctx.fillRect(px+8,py-4,TILE-16,TILE); ctx.strokeStyle='#3a2c1c'; ctx.strokeRect(px+8,py-4,TILE-16,TILE); ctx.fillStyle='#3a2c1c'; ctx.fillRect(px+TILE/2-1,py+6,2,TILE-16); }
  });
  // campfire (meeting point) — flicker + rising embers
  const cx=campfire.tx*TILE, cy=campfire.ty*TILE;
  const flick=0.9+Math.sin(now*11)*0.06+Math.sin(now*7)*0.04;
  // warm glow pool
  const gg=ctx.createRadialGradient(cx+TILE/2,cy+TILE/2,4, cx+TILE/2,cy+TILE/2,TILE*1.4);
  gg.addColorStop(0,`rgba(255,150,60,${0.28*flick})`); gg.addColorStop(1,'rgba(255,150,60,0)');
  ctx.fillStyle=gg; ctx.beginPath(); ctx.arc(cx+TILE/2,cy+TILE/2,TILE*1.4,0,7); ctx.fill();
  if(IMG['obj-campfire']){
    ctx.save(); ctx.translate(cx+TILE/2,cy+TILE/2); ctx.scale(1, flick); ctx.translate(-(cx+TILE/2),-(cy+TILE/2));
    ctx.drawImage(IMG['obj-campfire'],cx-TILE*0.3,cy-TILE*0.3,TILE*1.6,TILE*1.6); ctx.restore();
  } else {
    ctx.fillStyle='#7a3b1a'; ctx.fillRect(cx+6,cy+TILE-10,TILE-12,8);
    ctx.fillStyle=`rgba(255,${140+Math.floor(flick*40)},60,1)`;
    ctx.beginPath(); ctx.moveTo(cx+TILE/2,cy+4-flick*4); ctx.lineTo(cx+TILE/2-10,cy+TILE-6); ctx.lineTo(cx+TILE/2+10,cy+TILE-6); ctx.fill();
  }
  // spawn embers occasionally (only when running to avoid title spam)
  if(G.running && Math.random()<0.25) spawnFX(cx+TILE/2+(Math.random()*10-5), cy+TILE*0.5, 'spark', {n:1});
}
function drawFootprints(){
  const seerSees = player.role.key==='SEER' && (seerRevealT>0);
  if(seerRevealT>0) seerRevealT -= 1/60;
  footprints.forEach(f=>{
    const life = 1 - f.age/FOOT_FADE;
    const a = (seerSees? 0.7 : 0.0) * life;   // only seer sees them (after casting)
    if(a<=0.01) return;
    ctx.fillStyle=`rgba(120,60,160,${a})`;
    ctx.beginPath(); ctx.ellipse(f.x,f.y,5,8,0,0,7); ctx.fill();
  });
}
function drawCorpses(){
  corpses.forEach(c=>{
    if(IMG['fx-corpse']) ctx.drawImage(IMG['fx-corpse'],c.x-18,c.y-14,36,32);
    else { ctx.fillStyle='#5a1f1f'; ctx.beginPath(); ctx.ellipse(c.x,c.y+6,16,8,0,0,7); ctx.fill(); ctx.fillStyle='#7a2a2a'; ctx.beginPath(); ctx.arc(c.x-6,c.y,7,0,7); ctx.fill(); }
  });
}
// Village-themed chores that fit a forest hamlet. Each has: where it belongs (indoor/outdoor),
// a matching prop drawn at the station, and which minigame it plays.
const QUEST_META = {
  chop:   { name:'ตัดฟืน',     icon:'🪓', color:'#c77a3e', place:'outdoor', prop:'log',     mg:'rhythm' },
  water:  { name:'ตักน้ำ',     icon:'🪣', color:'#4f8fb0', place:'outdoor', prop:'wellpot', mg:'valve'  },
  hay:    { name:'มัดฟาง',     icon:'🌾', color:'#c9a24c', place:'outdoor', prop:'haybale', mg:'sequence' },
  cook:   { name:'ทำอาหาร',    icon:'🍲', color:'#d97a4c', place:'indoor',  prop:'stovepot',mg:'wire'   },
  hearth: { name:'เติมฟืนเตา', icon:'🔥', color:'#d9a24c', place:'indoor',  prop:'hearth',  mg:'rhythm' },
  mend:   { name:'ซ่อมเครื่องมือ', icon:'🔨', color:'#8a9bb0', place:'indoor', prop:'workbench',mg:'valve' },
};
const QUEST_KEYS = Object.keys(QUEST_META);
// Draw the physical prop that makes a station read as a real chore (a woodpile for chopping,
// a well for water, a haybale, a stove, etc.). Procedural so it works before any art ships.
function drawQuestProp(prop, cx, cy){
  ctx.save();
  switch(prop){
    case 'log': // stacked logs + axe
      ctx.fillStyle='#6b4a2a'; for(let i=0;i<3;i++){ ctx.beginPath(); ctx.ellipse(cx-8+i*8, cy+8, 5,9,0,0,7); ctx.fill(); ctx.fillStyle='#8a6438'; ctx.beginPath(); ctx.ellipse(cx-8+i*8, cy+3, 5,4,0,0,7); ctx.fill(); ctx.fillStyle='#6b4a2a'; }
      ctx.strokeStyle='#cfcfd6'; ctx.lineWidth=2.5; ctx.beginPath(); ctx.moveTo(cx+10,cy-10); ctx.lineTo(cx+14,cy+2); ctx.stroke(); // axe handle
      ctx.fillStyle='#b8b8c0'; ctx.beginPath(); ctx.moveTo(cx+8,cy-12); ctx.lineTo(cx+16,cy-9); ctx.lineTo(cx+13,cy-4); ctx.fill(); ctx.lineWidth=1; break;
    case 'wellpot': // stone well with a bucket
      ctx.fillStyle='#5a5350'; ctx.beginPath(); ctx.ellipse(cx,cy+6,15,9,0,0,7); ctx.fill(); ctx.fillStyle='#1a2838'; ctx.beginPath(); ctx.ellipse(cx,cy+6,9,5,0,0,7); ctx.fill();
      ctx.strokeStyle='#3a2c1c'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(cx-12,cy+4); ctx.lineTo(cx-12,cy-12); ctx.moveTo(cx+12,cy+4); ctx.lineTo(cx+12,cy-12); ctx.moveTo(cx-14,cy-12); ctx.lineTo(cx+14,cy-12); ctx.stroke(); // roof posts
      ctx.fillStyle='#6b4a2a'; ctx.fillRect(cx-4,cy-6,8,7); ctx.lineWidth=1; break;
    case 'haybale': // round hay bale
      ctx.fillStyle='#c9a24c'; ctx.beginPath(); ctx.ellipse(cx,cy+2,14,11,0,0,7); ctx.fill(); ctx.strokeStyle='#a5822f'; ctx.lineWidth=1.5;
      for(let i=-1;i<=1;i++){ ctx.beginPath(); ctx.ellipse(cx+i*6,cy+2,3,11,0,0,7); ctx.stroke(); } ctx.lineWidth=1; break;
    case 'stovepot': // stove with a bubbling pot
      ctx.fillStyle='#3a3a40'; ctx.fillRect(cx-11,cy-4,22,16); ctx.fillStyle='#ff7a2a'; ctx.beginPath(); ctx.arc(cx,cy+6,4,0,7); ctx.fill();
      ctx.fillStyle='#5a4a3a'; ctx.beginPath(); ctx.arc(cx,cy-6,7,0,Math.PI,true); ctx.fill(); ctx.fillRect(cx-7,cy-6,14,3);
      ctx.strokeStyle='rgba(220,220,230,.5)'; ctx.beginPath(); ctx.moveTo(cx-2,cy-12); ctx.quadraticCurveTo(cx-5,cy-16,cx-2,cy-20); ctx.stroke(); break; // steam
    case 'hearth': // fireplace
      ctx.fillStyle='#4a3f38'; ctx.fillRect(cx-13,cy-10,26,22); ctx.fillStyle='#20140c'; ctx.fillRect(cx-8,cy-4,16,16);
      ctx.fillStyle='#ff8a3a'; ctx.beginPath(); ctx.moveTo(cx,cy+10); ctx.quadraticCurveTo(cx-6,cy+2,cx,cy-4); ctx.quadraticCurveTo(cx+6,cy+2,cx,cy+10); ctx.fill();
      ctx.fillStyle='#ffd06b'; ctx.beginPath(); ctx.moveTo(cx,cy+9); ctx.quadraticCurveTo(cx-3,cy+4,cx,cy+1); ctx.quadraticCurveTo(cx+3,cy+4,cx,cy+9); ctx.fill(); break;
    case 'workbench': // workbench with tools
      ctx.fillStyle='#6b4f34'; ctx.fillRect(cx-14,cy-2,28,7); ctx.fillStyle='#4a3423'; ctx.fillRect(cx-12,cy+5,4,9); ctx.fillRect(cx+8,cy+5,4,9);
      ctx.strokeStyle='#8a8a90'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(cx-6,cy-2); ctx.lineTo(cx-2,cy-10); ctx.stroke(); ctx.fillStyle='#8a8a90'; ctx.fillRect(cx-4,cy-13,5,4); ctx.lineWidth=1; break; // hammer
  }
  ctx.restore();
}
function drawStations(){
  const now=performance.now()/1000;
  stations.forEach(s=>{
    // hide indoor-of-another-house stations behind roofs; but stations are on paths/floors,
    // draw normally (roofs render after and will cover interior ones anyway)
    const meta = QUEST_META[s.type]||QUEST_META.wire;
    const cx=s.tx*TILE+TILE/2, cy=s.ty*TILE+TILE/2;
    if(s.done){
      // completed: draw the prop dimmed, with a small green tick (no more glow)
      ctx.save(); ctx.globalAlpha=0.6; if(meta.prop) drawQuestProp(meta.prop, cx, cy); ctx.restore();
      ctx.fillStyle='rgba(70,150,100,.92)'; ctx.beginPath(); ctx.arc(cx, cy-20, 9, 0, 7); ctx.fill();
      ctx.strokeStyle='#eafff0'; ctx.lineWidth=2.4; ctx.beginPath(); ctx.moveTo(cx-4,cy-20); ctx.lineTo(cx-1,cy-17); ctx.lineTo(cx+5,cy-24); ctx.stroke(); ctx.lineWidth=1;
      return;
    }
    // UNFINISHED → Among-Us style: the real object glows with a coloured outline halo that
    // pulses, so it reads as an interactable task (no ugly box + emoji).
    const bob=Math.sin(now*2 + s.tx)*1.5;
    const pulse=0.5+Math.sin(now*3+s.ty)*0.5;
    ctx.save(); ctx.translate(0,bob);
    // soft outer glow pool on the ground
    const g=ctx.createRadialGradient(cx,cy,2, cx,cy,26);
    g.addColorStop(0, hexA(meta.color, 0.35+pulse*0.25)); g.addColorStop(1, hexA(meta.color,0));
    ctx.fillStyle=g; ctx.beginPath(); ctx.arc(cx,cy,26,0,7); ctx.fill();
    // the prop itself, with a glowing coloured rim (shadowBlur = the Among-Us highlight)
    ctx.shadowColor=meta.color; ctx.shadowBlur=10+pulse*8;
    if(meta.prop) drawQuestProp(meta.prop, cx, cy);
    ctx.shadowBlur=0;
    // interact hint dot bobbing above
    ctx.fillStyle=hexA(meta.color, 0.8+pulse*0.2);
    ctx.beginPath(); ctx.arc(cx, cy-24-pulse*2, 3, 0, 7); ctx.fill();
    // name tag above
    ctx.font='11px "Special Elite", system-ui'; ctx.textAlign='center'; ctx.textBaseline='alphabetic';
    const tw=ctx.measureText(meta.name).width;
    ctx.fillStyle='rgba(18,15,10,.8)'; roundRect(cx-tw/2-6, cy-42, tw+12, 15, 4); ctx.fill();
    ctx.fillStyle='#f0e6d2'; ctx.fillText(meta.name, cx, cy-31);
    ctx.restore();
  });
}
// hex "#rrggbb" + alpha 0..1 → rgba() string
function hexA(hex, a){
  const h=hex.replace('#',''); const n=parseInt(h,16);
  return `rgba(${(n>>16)&255},${(n>>8)&255},${n&255},${a})`;
}
function roundRect(x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
function drawBarriers(){
  barriers.forEach(b=>{
    const alpha = Math.min(1,b.t/BARRIER_DURATION)*0.5+0.15;
    if(IMG['fx-barrier']){ ctx.globalAlpha=alpha; ctx.drawImage(IMG['fx-barrier'],b.x-BARRIER_RADIUS,b.y-BARRIER_RADIUS,BARRIER_RADIUS*2,BARRIER_RADIUS*2); ctx.globalAlpha=1; }
    else { ctx.strokeStyle=`rgba(90,200,220,${alpha})`; ctx.fillStyle=`rgba(90,200,220,${alpha*0.25})`; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(b.x,b.y,BARRIER_RADIUS,0,7); ctx.fill(); ctx.stroke(); ctx.lineWidth=1; }
  });
}
// Pick a sprite name, preferring a numbered walk-frame set if Antigravity shipped one.
// e.g. char-wolf-1..N.svg -> cycle by walk phase; falls back to single char-wolf.svg.
// Return the actual loaded Image for an actor, cycling walk frames if present.
// NEVER returns a name whose image is missing — that was causing the sprite to
// flicker to the circle placeholder ("หัวไม้ขีด") between real frames.
// Max walk frames to actually use. Antigravity's -3/-4 frames are a different (stick-figure)
// style than -1/-2, which made the sprite flicker between "full character" and "stick".
// Cap at 2 until all frames match. Bump this once frames 3/4 are redrawn to match 1/2.
const WALK_FRAMES = 2;
function actorImage(baseName, a, walking){
  let cnt = actorImage._count?.[baseName];
  if(cnt===undefined || cnt.pending){
    let n=0; for(let i=1;i<=8;i++){ if(IMG[baseName+'-'+i]) n=i; else break; }
    (actorImage._count ||= {})[baseName] = { n, pending: n===0 && !IMG[baseName] };
    cnt = actorImage._count[baseName];
  }
  const n=Math.min(cnt.n, WALK_FRAMES);   // only cycle matched frames
  if(n>=2 && walking){
    const frame = 1 + (Math.floor(a.walkPhase*n*0.5)%n);
    const img = IMG[baseName+'-'+frame];
    if(img) return img;
  }
  if(cnt.n>=1 && IMG[baseName+'-1']) return IMG[baseName+'-1'];
  return IMG[baseName] || null;
}
function drawActors(){
  const now=performance.now()/1000;
  const list=[...actors].filter(a=>a.alive && !a.inLocker).sort((a,b)=>a.y-b.y);
  list.forEach(a=>{
    if(!actorVisibleToPlayer(a)) return;
    let base='char-villager';
    if(a.isWolfNight) base='char-wolf';
    else if(a===player && a.role.key==='SEER') base='char-seer';

    // ---- procedural motion ----
    // smooth the speed so tiny path jitters don't flip walk<->idle every frame (flicker fix)
    a._spdSmooth = (a._spdSmooth||0)*0.82 + (a._speed||0)*0.18;
    // hysteresis: only flip the moving flag past clear thresholds
    if(a._moving){ if(a._spdSmooth<0.35) a._moving=false; }
    else         { if(a._spdSmooth>0.7)  a._moving=true;  }
    const moving = a._moving;
    // advance walk animation at a STEADY rate while moving (frame-timed, not speed-scaled)
    if(moving) a.walkT = (a.walkT||0) + 0.11;   // ~fixed cadence
    a.walkPhase = a.walkT||0;
    a.animPhase = (a.animPhase||0) + 0.02;
    const bob   = moving ? Math.abs(Math.sin(a.walkPhase*Math.PI))*4 : Math.sin(now*1.6 + a.id)*1.2;
    const sway  = moving ? Math.sin(a.walkPhase*Math.PI)*0.10 : 0;
    const squashY = 1 + (moving? Math.sin(a.walkPhase*Math.PI*2)*0.04 : Math.sin(now*1.6+a.id)*0.015);
    const faceLeft = a.dir==='left';

    // shadow (shrinks a touch on the up-beat of the bob)
    const shw = PLAYER_R*0.9 * (1 - bob*0.02);
    ctx.fillStyle='rgba(0,0,0,.28)';
    ctx.beginPath(); ctx.ellipse(a.x,a.y+PLAYER_R,shw,PLAYER_R*0.38,0,0,7); ctx.fill();

    ctx.save();
    ctx.translate(a.x, a.y-bob);
    ctx.rotate(sway);
    const img = actorImage(base, a, moving);
    if(img){
      ctx.save();
      if(faceLeft) ctx.scale(-1,1);
      ctx.scale(1, squashY);
      // sprite viewBox is 48x64 with feet at the bottom edge; draw so feet sit at a.y
      const DW=42, DH=56;                 // on-screen size
      ctx.drawImage(img, -DW/2, -DH+PLAYER_R*0.5, DW, DH);
      ctx.restore();
    } else {
      drawPlaceholderActor2(a, squashY);
    }
    ctx.restore();

    // name tag
    ctx.font='11px "Special Elite", system-ui'; ctx.textAlign='center';
    ctx.fillStyle = a===player?'#ffe9a8':'rgba(240,230,210,.85)';
    ctx.fillText(a.name+(a===player?' (คุณ)':''), a.x, a.y-46-bob*0.3);
    // player role ring
    if(a===player){ ctx.strokeStyle=a.role.color; ctx.lineWidth=2.5; ctx.beginPath(); ctx.arc(a.x,a.y,PLAYER_R+5,0,7); ctx.stroke(); ctx.lineWidth=1; }
    // seer casting ring
    if(a===player && a.role.key==='SEER' && a.wantCast && a.castT>0){
      const p=Math.min(1,a.castT/SEER_CAST_TIME);
      ctx.strokeStyle='rgba(120,150,255,.9)'; ctx.lineWidth=3;
      ctx.beginPath(); ctx.arc(a.x,a.y-6, PLAYER_R+14, -Math.PI/2, -Math.PI/2 + p*Math.PI*2); ctx.stroke(); ctx.lineWidth=1;
    }
  });
  // dead player as ghost (floating)
  if(!player.alive){
    const fl=Math.sin(now*2)*4;
    ctx.globalAlpha=0.55;
    if(IMG['char-ghost']) ctx.drawImage(IMG['char-ghost'],player.x-24,player.y-40-fl,48,56);
    else { ctx.fillStyle='rgba(200,220,255,.7)'; ctx.beginPath(); ctx.arc(player.x,player.y-fl,PLAYER_R,0,7); ctx.fill(); }
    ctx.globalAlpha=1;
  }
}
function drawPlaceholderActor2(a, squashY){
  const isWolf=a.isWolfNight;
  ctx.save(); ctx.scale(1, squashY||1);
  ctx.fillStyle = isWolf?'#6a2b2b':a.role.color;
  ctx.beginPath(); ctx.arc(0,-6,PLAYER_R,0,7); ctx.fill();
  ctx.fillStyle='rgba(0,0,0,.2)'; ctx.beginPath(); ctx.arc(0,-6,PLAYER_R,0.2,Math.PI-0.2); ctx.fill();
  ctx.fillStyle= isWolf?'#ffd93b':'#fff';
  ctx.beginPath(); ctx.arc(-4,-8,2,0,7); ctx.arc(4,-8,2,0,7); ctx.fill();
  ctx.restore();
}
function drawPlaceholderActor(a){
  const isWolf=a.isWolfNight;
  ctx.fillStyle = isWolf?'#6a2b2b':a.role.color;
  // body
  ctx.beginPath(); ctx.arc(a.x,a.y-6,PLAYER_R,0,7); ctx.fill();
  ctx.fillStyle='rgba(0,0,0,.2)'; ctx.beginPath(); ctx.arc(a.x,a.y-6,PLAYER_R,0.2,Math.PI-0.2); ctx.fill();
  // eyes
  ctx.fillStyle= isWolf?'#ffd93b':'#fff';
  const ex=a.dir==='left'?-3:a.dir==='right'?3:0;
  ctx.beginPath(); ctx.arc(a.x-4+ex,a.y-8,2,0,7); ctx.arc(a.x+4+ex,a.y-8,2,0,7); ctx.fill();
}
// visibility: at night you only see actors within a light radius (unless it's you)
function actorVisibleToPlayer(a){
  if(a===player) return true;
  // hidden by walls/roof: if the actor is inside a house you're not in, you can't see them
  const ha = houseAt(a.x,a.y), hp = houseAt(player.x,player.y);
  if(ha && ha!==hp) return false;         // they're indoors elsewhere
  if(hp && ha!==hp) return false;          // you're indoors, they're outside your house
  if(G.phase!=='night') return true;
  const d=Math.hypot(a.x-player.x,a.y-player.y);
  return d < 190;
}
function drawNightOverlay(){
  if(G.phase!=='night') {
    if(G.phase==='meeting'){ ctx.fillStyle='rgba(30,20,50,.25)'; ctx.fillRect(0,0,VW,VH); }
    return;
  }
  // dark vignette with a light circle around player (Don't Starve-ish darkness)
  const px = player.x - cam.x, py = player.y - cam.y;
  const g = ctx.createRadialGradient(px,py,60, px,py,230);
  g.addColorStop(0,'rgba(8,6,20,0)');
  g.addColorStop(0.7,'rgba(8,6,20,.55)');
  g.addColorStop(1,'rgba(4,3,14,.93)');
  ctx.fillStyle=g; ctx.fillRect(0,0,VW,VH);
  // slight blue moonlight tint
  ctx.fillStyle='rgba(30,40,90,.12)'; ctx.fillRect(0,0,VW,VH);
}

// ============================================================
//  HUD
// ============================================================
function updateHUDPhase(){
  const icon=G.phase==='day'?'☀️':G.phase==='night'?'🌙':'🔥';
  const txt=G.phase==='day'?'กลางวัน':G.phase==='night'?'กลางคืน':'ประชุม';
  document.getElementById('phaseIcon').textContent=icon;
  document.getElementById('phaseText').textContent=txt;
  document.getElementById('dayNum').textContent='วันที่ '+G.day;
  document.getElementById('game').className = 'phase-'+G.phase;
}
function updateHUDRole(){
  document.getElementById('roleName').textContent=player.role.label;
  document.getElementById('roleName').style.color=player.role.color;
  updateHUDQuest();
}
function updateHUDQuest(){
  document.getElementById('questDone').textContent=questsDone;
  document.getElementById('questTotal').textContent=QUESTS_TO_WIN;
}
function updateActionButtons(){
  const k=document.getElementById('actKill'), s=document.getElementById('actSeer'),
        g=document.getElementById('actGuard'), u=document.getElementById('actUse');
  k.hidden = !(player.role.key==='WOLF' && G.phase==='night' && player.alive);
  s.hidden = !(player.role.key==='SEER' && G.phase==='night' && player.alive);
  g.hidden = !(player.role.key==='GUARD' && player.alive);
  // on-screen USE button: show whenever there's something to use (or to exit locker)
  let useText = null;
  if(player.alive){
    if(player.inLocker) useText='ออกจากตู้';
    else if(!G.paused){
      const st=nearestStation(player,USE_RANGE_STATION), lk=nearestLocker(player,USE_RANGE_LOCKER);
      if(st && G.phase!=='meeting'){ const m=QUEST_META[st.type]||QUEST_META.wire; useText=m.name; }
      else if(lk) useText='ซ่อนในตู้';
    }
  }
  if(useText){ u.textContent=useText; u.hidden=false; } else u.hidden=true;
}
function updatePrompt(){
  const p=document.getElementById('prompt');
  if(!player.alive){ p.hidden=true; return; }
  if(player.inLocker){ showPrompt('E','ออกจากตู้'); return; }
  if(G.paused){ p.hidden=true; return; }
  const st=nearestStation(player,USE_RANGE_STATION), lk=nearestLocker(player,USE_RANGE_LOCKER);
  if(st && G.phase!=='meeting'){ const m=QUEST_META[st.type]||QUEST_META.wire; showPrompt('E', m.icon+' '+m.name); return; }
  if(lk){ showPrompt('E','ซ่อนในตู้'); return; }
  p.hidden=true;
}
function showPrompt(key,text){
  const p=document.getElementById('prompt');
  document.getElementById('promptKey').textContent=key;
  document.getElementById('promptText').textContent=text;
  p.hidden=false;
}

// ---------- toast ----------
let toastEl=null;
function toast(msg){
  if(!toastEl){ toastEl=document.createElement('div'); toastEl.id='toast'; document.getElementById('game').appendChild(toastEl); }
  toastEl.textContent=msg; toastEl.classList.add('show');
  clearTimeout(toastEl._t); toastEl._t=setTimeout(()=>toastEl.classList.remove('show'),2200);
}

// ============================================================
//  INPUT WIRING
// ============================================================
// Use e.code (physical key) so Thai/other keyboard layouts still work —
// e.key becomes "ำ" for the E key under a Thai IME, which broke interaction.
function moveKeyFromCode(code){
  switch(code){
    case 'KeyW': case 'ArrowUp': return 'w';
    case 'KeyS': case 'ArrowDown': return 's';
    case 'KeyA': case 'ArrowLeft': return 'a';
    case 'KeyD': case 'ArrowRight': return 'd';
  }
  return null;
}
window.addEventListener('keydown',e=>{
  const mk = moveKeyFromCode(e.code);
  if(mk) keys[mk]=true;
  if(e.code==='ShiftLeft'||e.code==='ShiftRight') sprintHeld=true;
  if(!G.running) return;
  if(e.code==='KeyE'){ e.preventDefault(); playerUse(); }
  if(e.code==='Space'){ e.preventDefault(); doPrimaryAction(); }
});
window.addEventListener('keyup',e=>{
  const mk=moveKeyFromCode(e.code); if(mk) keys[mk]=false;
  if(e.code==='ShiftLeft'||e.code==='ShiftRight') sprintHeld=false;
});
function doPrimaryAction(){
  if(!player || !player.alive) return;
  if(player.role.key==='WOLF') playerKill();
  else if(player.role.key==='SEER') playerSeer();
  else if(player.role.key==='GUARD') playerGuard();
}

// dpad
document.querySelectorAll('#dpad button').forEach(b=>{
  const dir=b.dataset.dir;
  const set=(v)=>{ touchDir = v?dir:null; };
  b.addEventListener('touchstart',e=>{e.preventDefault();set(true);},{passive:false});
  b.addEventListener('touchend',e=>{e.preventDefault();set(false);},{passive:false});
  b.addEventListener('mousedown',()=>set(true));
  b.addEventListener('mouseup',()=>set(false));
  b.addEventListener('mouseleave',()=>{ if(touchDir===dir) set(false); });
});
// action buttons
document.getElementById('actKill').onclick=playerKill;
document.getElementById('actSeer').onclick=playerSeer;
document.getElementById('actGuard').onclick=playerGuard;
document.getElementById('actUse').onclick=playerUse;
// run button (hold to sprint)
(()=>{ const rb=document.getElementById('actRun'); if(!rb) return;
  const on=()=>{ sprintHeld=true; }; const off=()=>{ sprintHeld=false; };
  rb.addEventListener('touchstart',e=>{e.preventDefault();on();},{passive:false});
  rb.addEventListener('touchend',e=>{e.preventDefault();off();},{passive:false});
  rb.addEventListener('mousedown',on); rb.addEventListener('mouseup',off); rb.addEventListener('mouseleave',off);
})();

// start / restart
document.getElementById('startBtn').onclick=()=>{
  document.getElementById('title').hidden=true;
  setupMatch(); G.running=true;
  toast('บทบาทคุณ: '+player.role.label);
};
document.getElementById('goRestart').onclick=()=>{
  document.getElementById('gameover').hidden=true;
  setupMatch(); G.running=true;
  toast('บทบาทคุณ: '+player.role.label);
};

// ---------- boot ----------
resize();
loadAssets();
requestAnimationFrame(loop);

// expose for debugging / headless verify
window._moon = { G, get actors(){return actors;}, get player(){return player;}, get footprints(){return footprints;}, get barriers(){return barriers;}, get stations(){return stations;}, get particles(){return particles;}, get map(){return map;}, get questsDone(){return questsDone;}, get cam(){return cam;}, get houses(){return houses;}, bodyBlocked, solid, setupMatch, startPhase, tickPhase, update, doKill, checkWin, resolveVote, revealFootprints, tallyAndResolve, botVote, wolfPackTarget };
window.__houses = ()=>houses;
window.__objects = ()=>objects;
window.__findPath = findPath;
window.__actorImage = actorImage;
window.__WOLF_SIGHT = WOLF_SIGHT;

})();
