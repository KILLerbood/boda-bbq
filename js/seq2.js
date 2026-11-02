// Scroll-scrubbed image sequence drawn "cover" into a full-screen canvas, with a focal point
// so narrow phone screens crop around the subject. Frames load coarse-to-fine; only a window
// around the playhead is decoded. If a sequence has no frames yet, a single poster is shown.
const DPR = () => Math.min(devicePixelRatio || 1, 2);

export function createSeq(canvas, { dir, n, ext = 'webp', poster, focal = [0.6, 0.55], phoneFocal, onReady }) {
  const ctx = canvas.getContext('2d', { alpha: false });
  const frames = new Array(Math.max(n, 1)).fill(null);
  const ok = new Uint8Array(Math.max(n, 1));
  let cw = 0, ch = 0, cur = 0, want = 0, raf = 0, ready = false;
  const phone = () => innerWidth <= 900;

  function fit() {
    const r = canvas.getBoundingClientRect(), d = DPR();
    cw = Math.round(r.width * d); ch = Math.round(r.height * d);
    if (canvas.width !== cw || canvas.height !== ch) { canvas.width = cw; canvas.height = ch; }
    paint(true);
  }
  // cover transform shared with the label layer
  function box(im) {
    const iw = im.naturalWidth || im.width, ih = im.naturalHeight || im.height;
    const s = Math.max(cw / iw, ch / ih);
    const [fx, fy] = phone() && phoneFocal ? phoneFocal : focal;
    const w = iw * s, h = ih * s;
    const x = Math.min(0, Math.max(cw - w, cw / 2 - fx * w));
    const y = Math.min(0, Math.max(ch - h, ch / 2 - fy * h));
    return { x, y, w, h, s, iw, ih };
  }
  let last = null;
  function draw(im) {
    if (!im || !cw) return;
    const b = box(im); last = b;
    ctx.fillStyle = '#060507'; ctx.fillRect(0, 0, cw, ch);
    ctx.drawImage(im, b.x, b.y, b.w, b.h);
  }
  function nearest(i) {
    for (let d = 0; d < frames.length; d++) {
      if (ok[i - d]) return frames[i - d];
      if (ok[i + d]) return frames[i + d];
    }
    return null;
  }
  function paint(force) {
    const i = Math.round(want);
    if (!force && i === cur) return;
    cur = i; draw(nearest(i));
  }
  const tick = () => { raf = 0; paint(); };

  function load(i) {
    if (frames[i]) return;
    const im = new Image(); im.decoding = 'async';
    frames[i] = im;
    im.onload = () => {
      ok[i] = 1;
      if (!ready) { ready = true; fit(); onReady && onReady(); }
      else if (Math.abs(i - want) < 3) { cur = -1; paint(); }
    };
    im.src = n ? `${dir}/${String(i).padStart(3, '0')}.${ext}` : poster;
  }
  if (!n) load(0);
  else {
    load(0);
    // coarse-to-fine so any scroll position has a near frame quickly
    const order = [];
    for (const st of [16, 8, 4, 2, 1]) for (let i = 0; i < n; i += st) if (!order.includes(i)) order.push(i);
    order.push(n - 1);
    let k = 0;
    const pump = () => { const end = Math.min(order.length, k + 6); for (; k < end; k++) load(order[k]); if (k < order.length) setTimeout(pump, 60); };
    setTimeout(pump, 200);
  }
  addEventListener('resize', fit);
  fit();
  return {
    set(p) { want = Math.max(0, Math.min(1, p)) * (Math.max(n, 1) - 1); if (!raf) raf = requestAnimationFrame(tick); },
    // map a point in source-image fractions to CSS pixels on screen
    project(fx, fy) { if (!last) return null; const d = DPR(); return [(last.x + fx * last.w) / d, (last.y + fy * last.h) / d]; },
    get box() { return last; },
    redraw: () => { cur = -1; paint(); },
  };
}
