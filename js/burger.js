// The hero burger: real photo layers (cut from one photograph) composited live on a canvas.
// Scroll drives each layer down onto the one below, so the burger assembles under your finger.
const DPR = () => Math.min(devicePixelRatio || 1, 2);
const clamp = (v) => Math.max(0, Math.min(1, v));
const ease = (t) => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const win = (p, a, b) => clamp((p - a) / (b - a));

// when each layer travels (fractions of the hero scroll)
const TIMING = { patty: [.04, .26], onion: [.14, .46], pickles: [.34, .58], ketchup: [.46, .7], bun: [.58, .86], crumbs: [.02, .6] };

export async function createBurger(canvas, { dir = 'assets/burger', onReady } = {}) {
  const ctx = canvas.getContext('2d', { alpha: false });
  const meta = await (await fetch(`${dir}/meta.json`)).json();
  const phone = () => innerWidth <= 900;
  const loadImg = (src) => new Promise((res, rej) => { const i = new Image(); i.decoding = 'async'; i.onload = () => res(i); i.onerror = rej; i.src = src; });
  const base = await loadImg(`${dir}/${innerWidth <= 700 ? 'base-s' : 'base'}.webp`);
  const baseScale = meta.W / base.naturalWidth;
  const layers = await Promise.all(meta.layers.map(async (l, i) => {
    const img = await loadImg(`${dir}/${l.name}.webp`);
    const kind = l.name.startsWith('onion') ? 'onion' : l.name;
    let [a, b] = TIMING[kind] || [.1, .5];
    if (kind === 'onion') { const j = ((i * 37) % 11) / 11; a += j * .1; b = Math.min(.5, a + .2); }
    return { ...l, img, kind, a, b, shadow: kind === 'crumbs' ? null : makeShadow(img) };
  }));
  // a soft contact shadow for each layer, cast onto what it lands on
  function makeShadow(img) {
    const pad = 30, c = document.createElement('canvas');
    c.width = img.naturalWidth + pad * 2; c.height = img.naturalHeight + pad * 2;
    const x = c.getContext('2d');
    x.filter = 'blur(14px)'; x.drawImage(img, pad, pad);
    x.filter = 'none'; x.globalCompositeOperation = 'source-in'; x.fillStyle = '#000'; x.fillRect(0, 0, c.width, c.height);
    return { c, pad };
  }

  let cw = 0, ch = 0, p = 0, raf = 0, T = null;
  // fit the whole burger (start and end states) into the screen, sitting right on desktop and low-centre on phones
  function layout() {
    const r = canvas.getBoundingClientRect(), d = DPR();
    cw = Math.round(r.width * d); ch = Math.round(r.height * d);
    canvas.width = cw; canvas.height = ch;
    const [bx0, by0, bx1, by1] = meta.box, bw = bx1 - bx0, bh = by1 - by0;
    let s, cx, cy;
    if (phone()) { s = Math.min(cw * .98 / bw, ch * .58 / bh); cx = cw * .5; cy = ch * .64; }
    else { s = Math.min(cw * .5 / bw, ch * .88 / bh); cx = cw * (document.documentElement.dir === 'rtl' ? .4 : .6); cy = ch * .54; }
    T = { s, ox: cx - (bx0 + bw / 2) * s, oy: cy - (by0 + bh / 2) * s };
    draw();
  }
  const X = (x) => T.ox + x * T.s, Y = (y) => T.oy + y * T.s;

  function draw() {
    if (!T) return;
    const zoom = 1 + .05 * ease(clamp((p - .55) / .45));
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#060507'; ctx.fillRect(0, 0, cw, ch);
    ctx.save();
    // gentle push-in toward the burger as it closes
    const fx = X((meta.box[0] + meta.box[2]) / 2), fy = Y(meta.box[3] * .62);
    ctx.translate(fx, fy); ctx.scale(zoom, zoom); ctx.translate(-fx, -fy);
    const ix = X(0), iy = Y(0), iw = meta.W * T.s, ih = meta.H * T.s;
    ctx.drawImage(base, ix, iy, iw, ih);
    // blend the photo's edges into the page so its frame never shows
    const fade = (x0, y0, x1, y1) => { const g = ctx.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, 'rgba(6,5,7,1)'); g.addColorStop(1, 'rgba(6,5,7,0)'); return g; };
    const fh = ih * .14, fw = iw * .08;
    ctx.fillStyle = fade(0, iy, 0, iy + fh); ctx.fillRect(ix - 2, iy - 2, iw + 4, fh + 2);
    ctx.fillStyle = fade(0, iy + ih, 0, iy + ih - fh); ctx.fillRect(ix - 2, iy + ih - fh, iw + 4, fh + 2);
    ctx.fillStyle = fade(ix, 0, ix + fw, 0); ctx.fillRect(ix - 2, iy, fw + 2, ih);
    ctx.fillStyle = fade(ix + iw, 0, ix + iw - fw, 0); ctx.fillRect(ix + iw - fw, iy, fw + 2, ih);
    if (iy > 0) { ctx.fillStyle = '#060507'; ctx.fillRect(0, 0, cw, iy); }
    if (iy + ih < ch) { ctx.fillStyle = '#060507'; ctx.fillRect(0, iy + ih, cw, ch - iy - ih); }
    if (ix > 0) { ctx.fillStyle = '#060507'; ctx.fillRect(0, 0, ix, ch); }
    if (ix + iw < cw) { ctx.fillStyle = '#060507'; ctx.fillRect(ix + iw, 0, cw - ix - iw, ch); }
    for (const l of layers) {
      const t = win(p, l.a, l.b), e = ease(t);
      // a few px of settle after landing
      const settle = t >= 1 ? 0 : Math.sin(Math.PI * clamp((t - .82) / .18)) * -4;
      const y = l.y + l.dy * e + settle;
      if (l.kind === 'crumbs') {
        ctx.globalAlpha = 1 - e;
        ctx.drawImage(l.img, X(l.x), Y(y), l.w * T.s, l.h * T.s);
        ctx.globalAlpha = 1; continue;
      }
      if (l.shadow && e > .02) {
        // shadow grows as the layer approaches what is under it
        const sp = l.shadow.pad;
        ctx.globalAlpha = .55 * e;
        ctx.drawImage(l.shadow.c, X(l.x - sp), Y(y - sp + 14), l.shadow.c.width * T.s, l.shadow.c.height * T.s);
        ctx.globalAlpha = 1;
      }
      ctx.drawImage(l.img, X(l.x), Y(y), l.w * T.s, l.h * T.s);
    }
    ctx.restore();
  }
  addEventListener('resize', layout);
  layout();
  onReady && onReady();
  return {
    set(v) { p = clamp(v); if (!raf) raf = requestAnimationFrame(() => { raf = 0; draw(); }); },
    relayout: layout,
    // where a named layer is on screen right now (CSS px): its right edge and middle
    anchor(name) {
      const l = layers.find((x) => x.name === name); if (!l || !T) return null;
      const e = ease(win(p, l.a, l.b)), d = DPR();
      const zoom = 1 + .05 * ease(clamp((p - .55) / .45));
      const fx = X((meta.box[0] + meta.box[2]) / 2), fy = Y(meta.box[3] * .62);
      const sx = (X(l.x + l.w) - fx) * zoom + fx, sy = (Y(l.y + l.dy * e + l.h / 2) - fy) * zoom + fy;
      const lx = (X(l.x) - fx) * zoom + fx;
      return { right: sx / d, left: lx / d, y: sy / d };
    },
  };
}
