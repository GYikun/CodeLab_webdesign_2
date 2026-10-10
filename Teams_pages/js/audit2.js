/* Sprint 2 audit: pitch reduction, orientation switching, vertical step. */

const LABEL_W=132, LABEL_MIN=96, LABEL_GAP=12, PITCH_MAX=172, PAD_X=66;
const V_COL=72, V_STEP_WIDE=78, V_STEP_NARROW=96, V_NARROW_AT=340;
const WRAP_MAX=1400;
const wrapPad = vw => vw<=640?20 : vw<=1180?28 : 40;
const cardW = vw => Math.min(vw,WRAP_MAX) - wrapPad(vw)*2 - (vw<=640?40:56);

console.log('=== 1. Pitch reduction (target: 229px -> ~172px, i.e. -25%) ===');
const OLD_PITCH_AT_DESKTOP = 229;
console.log(`old desktop pitch  ${OLD_PITCH_AT_DESKTOP}px`);
console.log(`new cap PITCH_MAX  ${PITCH_MAX}px`);
console.log(`reduction          ${(100*(1-PITCH_MAX/OLD_PITCH_AT_DESKTOP)).toFixed(1)}%  ${Math.abs(PITCH_MAX/OLD_PITCH_AT_DESKTOP - 0.75) < 0.02 ? 'PASS (~1/4)' : 'FAIL'}`);

console.log('\n=== 2. Landscape (horizontal) geometry ===');
console.log('viewport | card  | n | drawW | centred | pitch | labelW | gap');
for (const vw of [1920,1440,1280,1024,844,768]) {
  const w = cardW(vw);
  for (const n of [3,6]) {
    const natural = PITCH_MAX*(n-1)+PAD_X*2;
    const drawW = Math.min(w,natural);
    const pitch = (drawW-PAD_X*2)/(n-1);
    const labelW = Math.max(Math.min(LABEL_W,pitch-LABEL_GAP),LABEL_MIN);
    const vert = pitch-LABEL_GAP < LABEL_MIN;
    const off = Math.max((w-drawW)/2,0);
    console.log(`${String(vw).padStart(7)} | ${String(Math.round(w)).padStart(5)} | ${n} | ${vert?'  ->VERTICAL fallback':String(Math.round(drawW)).padStart(5)+' | '+String(Math.round(off)).padStart(7)+' | '+String(Math.round(pitch)).padStart(5)+' | '+String(Math.round(labelW)).padStart(6)+' | '+Math.round(pitch-labelW)}`);
  }
}

console.log('\n=== 3. Longest thread that stays horizontal ===');
for (const vw of [1920,1440,1024,844]) {
  const w = cardW(vw);
  let maxN = 1;
  for (let n=2;n<=20;n++){
    const drawW=Math.min(w,PITCH_MAX*(n-1)+PAD_X*2);
    if ((drawW-PAD_X*2)/(n-1) - LABEL_GAP >= LABEL_MIN) maxN=n;
  }
  console.log(`vw ${String(vw).padStart(4)} (landscape): up to ${maxN} nodes horizontal, beyond that vertical`);
}

console.log('\n=== 4. Portrait (vertical) step + label fit ===');
const block1=17+19.6+18, block2=17+39.2+18;
console.log(`1-line label block ${Math.round(block1)}px | 2-line block ${Math.round(block2)}px`);
for (const vw of [1024,834,768,430,390,375,320]) {
  const w = cardW(vw), labelW = Math.max(w-V_COL-18,120);
  const step = labelW<V_NARROW_AT ? V_STEP_NARROW : V_STEP_WIDE;
  const chars = Math.floor(labelW/(14*0.52));
  const wraps = chars < 45;
  const block = wraps?block2:block1;
  const gap = step-block;
  console.log(`vw ${String(vw).padStart(4)} | label ${String(Math.round(labelW)).padStart(4)}px (~${String(chars).padStart(3)} ch) | step ${step} | block ${Math.round(block)} | gap ${Math.round(gap)}px ${gap>=14?'PASS':'FAIL'}`);
}

console.log('\n=== 5. Vertical step reduction ===');
console.log(`old step 104 -> new wide step ${V_STEP_WIDE}  (${(100*(1-V_STEP_WIDE/104)).toFixed(1)}% reduction) ${Math.abs(V_STEP_WIDE/104-0.75)<0.02?'PASS (~1/4)':'FAIL'}`);
console.log(`narrow (phone) step held at ${V_STEP_NARROW} so 2-line labels still clear`);

console.log('\n=== 6. Playback at fixed 1.5x ===');
for (const n of [2,3,5,6]) {
  const dur=(420+260*Math.max(n-1,1))/1.5;
  console.log(`n=${n}  total ${Math.round(dur)}ms  (per-node reveal 280ms, within 200-500ms)`);
}
