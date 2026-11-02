// Scroll-scrubbed real footage. Every frame is a real photograph extracted from real video. No CG.
// Eased scrub, a narrow crossfade only while moving, settles on a real frame; sliding decode window.

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const saveData = !!(navigator.connection && navigator.connection.saveData);

/** Progressive loader: first frame, then a coarse pass, then fill in.
 *  `step` skips frames (phones); frames inside `dense` [a,b] are always loaded. */
function loader(dir, n, step, onFirst, onAny, dense) {
  const frames = new Array(n);
  const want = [];
  for (let i = 0; i < n; i++) if (i % step === 0 || (dense && i >= dense[0] && i <= dense[1]) || i === n - 1) want.push(i);
  const order = [want[0]];
  for (const s of [8, 4, 2, 1]) want.forEach((i, k) => { if (k % s === 0 && !order.includes(i)) order.push(i); });
  let active = 0, next = 0, started = false;
  const pump = () => {
    while (active < 6 && next < order.length) {
      const i = order[next++], im = new Image();
      active++;
      im.decoding = 'async';
      im.onload = () => { frames[i] = im; active--; if (i === order[0] && onFirst) onFirst(); else if (onAny) onAny(); pump(); };
      im.onerror = () => { active--; pump(); };
      im.src = `${dir}/${String(i).padStart(3, '0')}.webp`;
    }
  };
  // decode a small sliding window around the playhead (ahead in the scroll direction) instead of everything
  const decoded = new Set();
  let lastI = 0;
  const warm = (fi) => {
    const i = Math.round(fi), dir = i >= lastI ? 1 : -1; lastI = i;
    for (let k = -4; k <= 16; k++) {
      const j = i + k * dir, im = frames[j];
      if (im && !decoded.has(j) && im.decode) { decoded.add(j); im.decode().catch(() => decoded.delete(j)); }
    }
  };
  return { frames, warm, start() { if (!started) { started = true; pump(); } } };
}
function nearest(frames, i) {
  for (let d = 0; d < frames.length; d++) {
    if (frames[i - d]) return { im: frames[i - d], i: i - d };
    if (frames[i + d]) return { im: frames[i + d], i: i + d };
  }
  return null;
}

/** Canvas with a backing store capped to what the source can actually fill; only reallocates on real size changes. */
function makeCanvas(canvas, srcW) {
  const ctx = canvas.getContext('2d', { alpha: false });
  const fit = () => {
    const r = canvas.getBoundingClientRect();
    if (!r.width || !r.height) return false;
    const dpr = Math.min(devicePixelRatio || 1, 2, Math.max(1, srcW / r.width * 1.15));
    const w = Math.round(r.width * dpr), h = Math.round(r.height * dpr);
    if (w === canvas.width && h === canvas.height) return false;
    canvas.width = w; canvas.height = h;
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
    return true;
  };
  return { ctx, fit };
}

/** Shared scrub engine: target → eased current → paint. When scrolling stops it settles on a real frame,
 *  so a half-blended frame never stays on screen. */
const win = (k) => { k = clamp((k - .3) / .4); return k * k * (3 - 2 * k); };
function scrubber(n, paint, frameOf, warm) {
  let target = 0, cur = 0, raf = 0, last = 0, idle = 0;
  const tick = (t) => {
    const dt = Math.min(.05, (t - (last || t)) / 1000); last = t;
    cur += (target - cur) * (1 - Math.exp(-dt * (reduce ? 60 : 14)));
    if (Math.abs(target - cur) < .0006) cur = target;
    paint(cur * (n - 1));
    raf = cur === target ? 0 : requestAnimationFrame(tick);
  };
  const kick = () => { if (!raf) { last = 0; raf = requestAnimationFrame(tick); } };
  return {
    set(v) {
      target = clamp(v); warm && warm(target * (n - 1)); kick();
      clearTimeout(idle);
      idle = setTimeout(() => { const f = frameOf(target * (n - 1)); if (f != null) { target = f / (n - 1); kick(); } }, 120);
    },
    now() { paint(cur * (n - 1)); },
  };
}

/* ---------------- hero: real flip on the grill, then cheese melting with steam ---------------- */
export function createFire(canvas, { n, split, dense, onReady }) {
  const phone = innerWidth <= 768;
  const step = 2; // dense window still loads every frame of the flip
  const { ctx, fit } = makeCanvas(canvas, phone ? 720 : 1000);
  let s;
  let rp = 0; const repaint = () => { if (!rp) rp = requestAnimationFrame(() => { rp = 0; s.now(); }); };
  const L = loader(phone ? 'assets/seq/fire-sm' : 'assets/seq/fire-lg', n, step, () => { s.now(); onReady && onReady(); }, repaint, dense);
  const cover = (im, a) => {
    const cw = canvas.width, ch = canvas.height, k = Math.max(cw / im.width, ch / im.height);
    const w = im.width * k, h = im.height * k;
    ctx.globalAlpha = a; ctx.drawImage(im, (cw - w) / 2, (ch - h) / 2, w, h); ctx.globalAlpha = 1;
  };
  const paint = (fi) => {
    const i = Math.floor(fi), k = fi - i;
    // a soft dissolve across the cut between the two real clips
    if (i >= split - 1 && i < split + 1) {
      const a = nearest(L.frames, split - 1), b = nearest(L.frames, split + 1);
      if (a && b) { cover(a.im, 1); cover(b.im, clamp((fi - (split - 1)) / 2)); return; }
    }
    const a = nearest(L.frames, i); if (!a) return;
    cover(a.im, 1);
    let j = a.i + 1; while (j < n && !L.frames[j]) j++;
    const b = L.frames[j];
    if (b && a.i <= fi && j - a.i <= 3) { const t = win((fi - a.i) / (j - a.i)); if (t > 0) cover(b, t); }
  };
  s = scrubber(n, paint, (fi) => { const r = nearest(L.frames, Math.round(fi)); return r && r.i; }, L.warm);
  fit(); L.start();
  addEventListener('resize', () => { if (fit()) s.now(); });
  return { set: s.set, redraw: s.now };
}

/* ---------------- build: a real burger stacked layer by layer (4K source) ---------------- */
export function createBuild(canvas, { n, onReady }) {
  const phone = innerWidth <= 768;
  const wide = innerWidth * (devicePixelRatio || 1) >= 1800;
  const dir = phone ? 'assets/seq/build-port' : wide ? 'assets/seq/build-xl' : 'assets/seq/build-lg';
  const srcW = phone ? 1080 : wide ? 2000 : 1600;
  const step = phone ? (saveData ? 3 : 2) : 1;
  const { ctx, fit } = makeCanvas(canvas, srcW);
  let s, rp = 0;
  // per-frame wall colours (top band and bottom band of that same real frame), cached
  const probe = document.createElement('canvas'); probe.width = 8; probe.height = 2;
  const px = probe.getContext('2d', { willReadFrequently: true });
  const tones = new Map();
  let wall = null;
  const toneOf = (i, im) => {
    // the backdrop is one static red wall: sample it once, from the outer 10% side strips of a clean frame (median)
    if (wall) return wall;
    px.drawImage(im, 0, 0, im.width * .1, im.height * .5, 0, 0, 4, 2);
    px.drawImage(im, im.width * .9, 0, im.width * .1, im.height * .5, 4, 0, 4, 2);
    const d = px.getImageData(0, 0, 8, 2).data, ch = [[], [], []];
    for (let k = 0; k < d.length; k += 4) { ch[0].push(d[k]); ch[1].push(d[k + 1]); ch[2].push(d[k + 2]); }
    const med = (a) => a.sort((x, y) => x - y)[a.length >> 1];
    const top = [med(ch[0]), med(ch[1]), med(ch[2])];
    wall = { top, bot: top }; return wall;
  };
  const L = loader(dir, n, step, () => { s.now(); onReady && onReady(); }, () => { if (!rp) rp = requestAnimationFrame(() => { rp = 0; s.now(); }); });
  const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
  let zoom = 0;
  const place = (im) => {
    const cw = canvas.width, ch = canvas.height;
    if (!phone && cw / ch >= 1.1) {
      const k = Math.max(cw / im.width, ch / im.height);
      const c = [(cw - im.width * k) / 2, (ch - im.height * k) / 2, im.width * k, im.height * k];
      if (zoom <= 0) return c;
      // final beat: pull back so the finished burger is whole, shifted away from the text
      const k2 = Math.min(cw / im.width, ch / im.height) * .74, w2 = im.width * k2, h2 = im.height * k2;
      const t = zoom * zoom * (3 - 2 * zoom), d = [cw * .42 - w2 / 2, ch * .47 - h2 / 2, w2, h2];
      return c.map((v, i) => v + (d[i] - v) * t);
    }
    // portrait: the real frame runs edge to edge (no side seams); the burger sits ~53% down
    const w = cw, h = w * im.height / im.width;
    return [0, ch - h, w, h];
  };
  const vfade = (y0, y1, c) => { const g = ctx.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, rgba(c, 1)); g.addColorStop(1, rgba(c, 0)); return g; };
  const paint = (fi) => {
    const a = nearest(L.frames, Math.floor(fi)); if (!a) return;
    const cw = canvas.width, ch = canvas.height, [x, y, w, h] = place(a.im);
    const tone = toneOf(a.i, a.im);
    if (phone) {
      ctx.fillStyle = rgba(tone.top, 1); ctx.fillRect(0, 0, cw, Math.max(0, y) + 2);
    } else if (y > 0 || x > 0) { ctx.fillStyle = rgba(tone.top, 1); ctx.fillRect(0, 0, cw, ch); }
    ctx.drawImage(a.im, x, y, w, h);
    let j = a.i + 1; while (j < n && !L.frames[j]) j++;
    const b = L.frames[j];
    if (b && a.i <= fi && j - a.i <= 3) { const t = win((fi - a.i) / (j - a.i)); if (t > 0) { ctx.globalAlpha = t; ctx.drawImage(b, x, y, w, h); ctx.globalAlpha = 1; } }
    if (phone) {
      // fade only the plain wall at the top and the plain table at the very bottom; never across food
      // fade only the plain wall at the very top of the frame into the same wall colour
      ctx.fillStyle = vfade(y, y + h * .1, tone.top); ctx.fillRect(0, y - 1, cw, h * .1 + 1);
    } else if (zoom > 0) {
      // desktop final: melt the shot into its own wall colour with a soft elliptical falloff
      const col = tone.top, cx = x + w / 2, cy = y + h / 2, r = w / 2 * 1.12;
      ctx.save(); ctx.globalAlpha = zoom;
      ctx.save(); ctx.translate(cx, cy); ctx.scale(1, h / w);
      const g = ctx.createRadialGradient(0, 0, r * .6, 0, 0, r * 1.02);
      g.addColorStop(0, rgba(col, 0)); g.addColorStop(.6, rgba(col, .25)); g.addColorStop(1, rgba(col, 1));
      ctx.fillStyle = g; ctx.fillRect(-r * 1.1, -r * 1.1, r * 2.2, r * 2.2); ctx.restore();
      for (const [y0, y1] of [[y + h, y + h - h * .14], [y, y + h * .1]]) { ctx.fillStyle = vfade(y0, y1, col); ctx.fillRect(x, Math.min(y0, y1) - 1, w, Math.abs(y1 - y0) + 2); }
      for (const [x0, x1] of [[x, x + w * .08], [x + w, x + w - w * .08]]) { const lg = ctx.createLinearGradient(x0, 0, x1, 0); lg.addColorStop(0, rgba(col, 1)); lg.addColorStop(1, rgba(col, 0)); ctx.fillStyle = lg; ctx.fillRect(Math.min(x0, x1) - 1, y, Math.abs(x1 - x0) + 2, h); }
      ctx.fillStyle = rgba(col, 1); ctx.beginPath(); ctx.rect(0, 0, cw, ch); ctx.ellipse(cx, cy, r, r * h / w, 0, 0, Math.PI * 2, true); ctx.fill('evenodd');
      ctx.restore();
    }
  };
  s = scrubber(n, paint, (fi) => { const r = nearest(L.frames, Math.round(fi)); return r && r.i; }, L.warm);
  fit();
  // start loading only when the section is about to be reached
  const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { L.start(); io.disconnect(); } }, { rootMargin: '150% 0px' });
  io.observe(canvas);
  addEventListener('resize', () => { if (fit()) s.now(); });
  return { set: s.set, redraw: s.now, zoom(z) { if (z !== zoom) { zoom = z; s.now(); } } };
}
