import { MENU, CONFIG, BUILD } from './data.js';
import { t, apply, setLang, getLang, onLang, money, num } from './i18n.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const WA_OK = /^\d{10,15}$/.test(CONFIG.whatsapp || '');
const L = (o) => o[getLang()] || o.en;
function el(tag, cls, txt) { const n = document.createElement(tag); if (cls) n.className = cls; if (txt != null) n.textContent = txt; return n; }

apply();
$('#year').textContent = new Date().getFullYear();
$('#langBtn').onclick = () => setLang(getLang() === 'en' ? 'ar' : 'en');

/* ---------- never leave the loader stuck ---------- */
let revealed = false, lenis = null;
const revealTimer = setTimeout(() => reveal(), 6000);
const anim = !!(window.gsap && window.ScrollTrigger);
const noop = () => noopObj, noopObj = { kill: noop };
const gsap = anim ? window.gsap : { from: noop, fromTo: noop, to: noop, set: noop, registerPlugin: noop, utils: { toArray: (s) => [...document.querySelectorAll(s)] }, ticker: { add: noop, lagSmoothing: noop } };
const ScrollTrigger = anim ? window.ScrollTrigger : { create: noop, refresh: noop, update: noop };
gsap.registerPlugin(ScrollTrigger);

if (anim && !reduce && window.Lenis && matchMedia('(hover:hover) and (pointer:fine)').matches) {
  lenis = new window.Lenis({ lerp: .11, smoothWheel: true, syncTouch: false });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((tm) => lenis.raf(tm * 1000));
  gsap.ticker.lagSmoothing(0);
  lenis.stop();
}
function goTo(sel) {
  const n = $(sel); if (!n) return;
  if (lenis) lenis.scrollTo(n, { offset: sel === '#hero' || sel === '#top' ? 0 : -60, duration: 1.4 }); else n.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
}
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="#"]'); if (!a) return;
  const h = a.getAttribute('href'); if (h.length < 2) return;
  e.preventDefault(); goTo(h);
});
function reveal() {
  if (revealed) return; revealed = true;
  clearTimeout(revealTimer);
  $('#loaderBar').style.width = '100%';
  setTimeout(() => {
    $('#loader').classList.add('is-done');
    document.body.classList.remove('is-loading');
    lenis && lenis.start();
    ScrollTrigger.refresh();
    if (!reduce && anim) {
      gsap.from('#hero .hud > *', { y: 30, opacity: 0, duration: 1, stagger: .07, ease: 'expo.out' });
      gsap.from('#heroCanvas', { scale: 1.08, opacity: 0, duration: 1.6, ease: 'expo.out' });
    }
  }, 250);
}

/* ---------- header ---------- */
const hdr = $('#hdr');
const solid = () => hdr.classList.toggle('is-solid', scrollY > 60);
addEventListener('scroll', solid, { passive: true }); solid();
$$('.nav a').forEach((a) => {
  const sec = $(a.getAttribute('href'));
  sec && ScrollTrigger.create({ trigger: sec, start: 'top 50%', end: 'bottom 50%', onToggle: (s) => a.classList.toggle('is-on', s.isActive) });
});

/* ---------- 01 + 02: scroll stages ---------- */
async function bootStages() {
  $('#loaderBar').style.width = '45%';
  try {
    const { createSeq } = await import('./seq2.js');
    // hero: real photo layers assemble as you scroll
    const { createBurger } = await import('./burger.js');
    const hero = await createBurger($('#heroCanvas'), { onReady: reveal });
    const labels = $('#labels');
    const LBL = [['bun', 'l.bun'], ['ketchup', 'l.ketchup'], ['pickles', 'l.pickle'], ['onion05', 'l.onion'], ['patty', 'l.cheese']];
    const lbls = LBL.map(([layer, k]) => { const n = el('div', 'lbl'); n.append(el('i'), el('b', '', t(k))); labels.appendChild(n); return { layer, k, n }; });
    onLang(() => { lbls.forEach((l) => { l.n.querySelector('b').textContent = t(l.k); }); hero.relayout(); placeLabels(lp); });
    const temp = $('#temp'), layerNo = $('#layerNo'), bar = $('#heroBar'), hint = $('#scrollHint');
    const SHOW = { patty: .2, onion05: .36, pickles: .5, ketchup: .62, bun: .78 };
    function placeLabels(p) {
      const rtl = getLang() === 'ar', phone = innerWidth <= 900;
      lbls.forEach((l, i) => {
        const a = hero.anchor(l.layer), edge = hero.anchor('patty'); if (!a || !edge) return;
        a.right = Math.max(a.right, edge.right - 10); a.left = Math.min(a.left, edge.left + 10);
        l.n.classList.toggle('lbl--rtl', rtl);
        l.n.style.top = a.y + 'px';
        l.n.style.left = rtl ? 'auto' : a.right + 8 + 'px';
        l.n.style.right = rtl ? innerWidth - a.left + 8 + 'px' : 'auto';
        l.n.style.setProperty('--w', (phone ? 16 : 70) + 'px');
        l.n.classList.toggle('is-on', p >= SHOW[l.layer] && !(phone && i % 2));
      });
    }
    let lp = 0;
    ScrollTrigger.create({
      trigger: '#hero', start: 'top top', end: 'bottom bottom',
      onUpdate: (st) => {
        const p = st.progress; lp = p;
        hero.set(p);
        requestAnimationFrame(() => placeLabels(p));
        temp.textContent = num(Math.round(180 + 80 * p));
        layerNo.textContent = num(String(Math.min(7, 1 + Math.floor(p * 7))).padStart(2, '0')) + '.';
        bar.style.transform = `scaleX(${p})`;
        hint.classList.toggle('is-off', p > .02);
      },
    });
    addEventListener('resize', () => requestAnimationFrame(() => placeLabels(lp)));
    requestAnimationFrame(() => placeLabels(0));

  } catch (err) { console.error('stages failed', err); reveal(); }
}
bootStages();

/* ---------- 05: the sear (real flip footage) ---------- */
(async () => {
  try {
    const [{ createFire }, { SEQ }] = await Promise.all([import('./seq.js'), import('./seq-meta.js')]);
    let fire = null;
    const io = new IntersectionObserver((es) => {
      if (es.some((e) => e.isIntersecting) && !fire) { fire = createFire($('#searCanvas'), { n: SEQ.fire.n, split: SEQ.fire.split, dense: SEQ.fire.dense }); io.disconnect(); }
    }, { rootMargin: '150% 0px' });
    io.observe($('#sear'));
    const tag = $('#searTag'), deg = $('#searDeg'), meter = $('#searMeter');
    ScrollTrigger.create({
      trigger: '#sear', start: 'top top', end: 'bottom bottom',
      onUpdate: (st) => {
        const p = st.progress; fire && fire.set(p);
        const k = p < (SEQ.fire.split + 1) / SEQ.fire.n ? 'sear.tag1' : 'sear.tag2';
        if (tag.dataset.i18n !== k) { tag.dataset.i18n = k; tag.textContent = t(k); }
        deg.textContent = num(Math.round(20 + 240 * Math.min(1, p * 1.4)));
        meter.style.transform = `scaleY(${Math.min(1, p * 1.4)})`;
      },
    });
  } catch (err) { console.error('sear failed', err); }
})();

/* ---------- 06: the cut (horizontal) ---------- */
const track = $('#cutTrack');
ScrollTrigger.create({
  trigger: '#cut', start: 'top top', end: 'bottom bottom',
  onUpdate: (st) => {
    const max = Math.max(0, track.scrollWidth - innerWidth);
    track.style.transform = `translateX(${(getLang() === 'ar' ? 1 : -1) * st.progress * max}px)`;
  },
});

/* ---------- stats count-up ---------- */
$$('[data-count]').forEach((b) => {
  const to = Number(b.dataset.count), suf = b.dataset.suffix || '';
  const show = (v) => { b.textContent = num(Math.round(v)) + suf; };
  show(reduce ? to : 0);
  if (reduce) return;
  ScrollTrigger.create({ trigger: b, start: 'top 85%', once: true, onEnter: () => { const o = { v: 0 }; gsap.to(o, { v: to, duration: 1.6, ease: 'expo.out', onUpdate: () => show(o.v) }); } });
  onLang(() => show(to));
});

/* ---------- 03: menu ---------- */
const grid = $('#grid');
const variants = {};
function renderMenu() {
  grid.textContent = '';
  MENU.forEach((m, idx) => {
    const T = L(m);
    const c = el('article', 'card'); c.dataset.cat = m.cat; c.dataset.id = m.id;
    const media = el('div', 'card__media');
    const im = new Image(); im.src = m.img; im.alt = T.n; im.loading = 'lazy'; im.decoding = 'async'; im.width = 1400; im.height = 1050;
    media.append(im, el('span', 'card__no', num(String(idx + 1).padStart(2, '0'))));
    if (m.badge) media.appendChild(el('span', 'card__badge' + (m.hot ? ' card__badge--hot' : ''), t('badge.' + m.badge)));
    const body = el('div', 'card__body');
    const top = el('div', 'card__top');
    const pr = el('div', 'card__price');
    top.append(el('h3', 'card__name', T.n), pr);
    body.append(top, el('p', 'card__desc', T.d));
    let v = variants[m.id] || 'single';
    const showPrice = () => { pr.textContent = money(m.price + (v === 'meal' ? CONFIG.mealExtra : 0)); };
    showPrice();
    if (!m.side) {
      const opts = el('div', 'card__opts'); opts.setAttribute('role', 'group'); opts.setAttribute('aria-label', T.n);
      const o1 = el('button', 'opt'); o1.type = 'button'; o1.append(t('card.single'), el('small', '', t('card.single.s')));
      const o2 = el('button', 'opt'); o2.type = 'button'; o2.append(t('card.meal'), el('small', '', t('card.meal.s', { x: num(CONFIG.mealExtra) })));
      const set = (nv, bump) => {
        v = variants[m.id] = nv;
        o1.classList.toggle('is-on', v === 'single'); o2.classList.toggle('is-on', v === 'meal');
        o1.setAttribute('aria-pressed', String(v === 'single')); o2.setAttribute('aria-pressed', String(v === 'meal'));
        showPrice(); if (bump && !reduce) gsap.fromTo(pr, { scale: 1.2 }, { scale: 1, duration: .4, ease: 'back.out(3)' });
      };
      o1.onclick = () => set('single', 1); o2.onclick = () => set('meal', 1); set(v);
      opts.append(o1, o2); body.appendChild(opts);
    }
    const acts = el('div', 'card__acts');
    const add = el('button', 'btn btn--line', t('card.add')); add.type = 'button'; add.setAttribute('aria-label', `${t('card.add')}: ${T.n}`);
    const buy = el('button', 'btn btn--neon', t('card.buy')); buy.type = 'button'; buy.setAttribute('aria-label', `${t('card.buy')}: ${T.n}`);
    add.onclick = () => { if (addItem({ id: m.id, v })) { flyFrom(media); toast(t('cart.added', { x: T.n })); } };
    buy.onclick = () => { addItem({ id: m.id, v }); openDrawer('checkout', buy); };
    acts.append(add, buy); body.appendChild(acts);
    c.append(media, body);
    grid.appendChild(c);
  });
  filter(curCat, false);
}
let curCat = 'all';
function filter(cat, animate = true) {
  curCat = cat;
  const cards = $$('.card', grid);
  cards.forEach((c) => c.classList.toggle('is-hide', !(cat === 'all' || c.dataset.cat === cat)));
  if (animate && !reduce) gsap.fromTo(cards.filter((c) => !c.classList.contains('is-hide')), { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: .55, stagger: .04, ease: 'expo.out', overwrite: true });
  ScrollTrigger.refresh();
}
$$('.tab').forEach((tb) => tb.addEventListener('click', () => {
  $$('.tab').forEach((x) => { x.classList.toggle('is-on', x === tb); x.setAttribute('aria-pressed', String(x === tb)); });
  filter(tb.dataset.cat);
}));
renderMenu();
if (!reduce) ScrollTrigger.create({ trigger: '#grid', start: 'top 85%', once: true, onEnter: () => gsap.from('.card:not(.is-hide)', { y: 50, opacity: 0, duration: .9, stagger: .05, ease: 'expo.out' }) });

/* ---------- 04: build your burger ---------- */
const G = Object.fromEntries(BUILD.groups.map((g) => [g.id, g]));
const defCfg = () => ({ bun: 'brioche', patty: 2, cheese: 'american', top: ['pickles', 'onion'], sauce: ['boda'] });
let cfg = defCfg();
function cleanCfg(c) {
  const o = defCfg();
  if (!c || typeof c !== 'object') return o;
  if (G.bun.opts.some((x) => x.id === c.bun)) o.bun = c.bun;
  if (Number.isInteger(c.patty) && c.patty >= G.patty.min && c.patty <= G.patty.max) o.patty = c.patty;
  if (G.cheese.opts.some((x) => x.id === c.cheese)) o.cheese = c.cheese;
  const many = (g, arr) => [...new Set((Array.isArray(arr) ? arr : []).filter((id) => G[g].opts.some((x) => x.id === id)))].slice(0, G[g].max || 99);
  o.top = many('top', c.top); o.sauce = many('sauce', c.sauce);
  return o;
}
const cfgPrice = (c) => BUILD.base + (c.patty - 1) * G.patty.each + G.cheese.opts.find((x) => x.id === c.cheese).p + c.top.reduce((s, id) => s + G.top.opts.find((x) => x.id === id).p, 0);
const optName = (g, id) => L(G[g].opts.find((x) => x.id === id));
const cfgLabel = (c) => [L(G.bun.opts.find((x) => x.id === c.bun)), `${num(c.patty)}× ${getLang() === 'ar' ? 'سماش' : 'smash'}`, c.cheese !== 'none' ? optName('cheese', c.cheese) : '', ...c.top.map((id) => optName('top', id)), ...c.sauce.map((id) => optName('sauce', id))].filter(Boolean).join(' · ');
function renderBuilder() {
  const f = $('#yoursForm'); f.textContent = '';
  BUILD.groups.forEach((g) => {
    const fs = el('fieldset', 'grp'); fs.appendChild(el('legend', '', L(g)));
    if (g.type === 'count') {
      const row = el('div', 'counter');
      const minus = el('button', '', '−'), plus = el('button', '', '+'), val = el('b', '', num(cfg.patty));
      minus.type = plus.type = 'button';
      minus.setAttribute('aria-label', `− ${L(g)}`); plus.setAttribute('aria-label', `+ ${L(g)}`);
      const sync = () => { val.textContent = num(cfg.patty); minus.disabled = cfg.patty <= g.min; plus.disabled = cfg.patty >= g.max; renderStack(); };
      minus.onclick = () => { if (cfg.patty > g.min) { cfg.patty--; sync(); } };
      plus.onclick = () => { if (cfg.patty < g.max) { cfg.patty++; sync(); } };
      row.append(minus, val, plus, el('small', 'chip', `+${money(g.each)}`)); fs.appendChild(row); sync();
    } else {
      const chips = el('div', 'chips');
      g.opts.forEach((o) => {
        const lab = el('label', 'chip');
        const inp = document.createElement('input'); inp.type = g.type === 'one' ? 'radio' : 'checkbox'; inp.name = g.id; inp.value = o.id;
        inp.checked = g.type === 'one' ? cfg[g.id] === o.id : cfg[g.id].includes(o.id);
        const sp = el('span', '', L(o)); if (o.p) sp.appendChild(el('small', '', `+${num(o.p)}`));
        inp.onchange = () => {
          if (g.type === 'one') cfg[g.id] = o.id;
          else {
            const set = new Set(cfg[g.id]); inp.checked ? set.add(o.id) : set.delete(o.id); cfg[g.id] = [...set];
          }
          limit(g); renderStack();
        };
        lab.append(inp, sp); chips.appendChild(lab);
      });
      fs.appendChild(chips);
    }
    f.appendChild(fs); limit(g);
  });
  renderStack();
}
function limit(g) {
  if (!g.max || g.type !== 'many') return;
  const full = cfg[g.id].length >= g.max;
  $$(`#yoursForm input[name=${g.id}]`).forEach((i) => { i.disabled = full && !i.checked; });
}
function renderStack() {
  const s = $('#stack'); s.textContent = '';
  const add = (cls, txt) => s.appendChild(el('li', 'layer ' + cls, txt));
  add('layer--bun-top', L(G.bun.opts.find((x) => x.id === cfg.bun)));
  cfg.sauce.forEach((id) => add('layer--sauce', optName('sauce', id)));
  cfg.top.forEach((id) => add(['pickles', 'lettuce', 'jalapeno'].includes(id) ? 'layer--veg' : id === 'tomato' ? 'layer--red' : 'layer--extra', optName('top', id)));
  for (let i = 0; i < cfg.patty; i++) {
    if (cfg.cheese !== 'none') add('layer--cheese', optName('cheese', cfg.cheese));
    add('layer--patty', getLang() === 'ar' ? 'سماش بقري' : 'Beef smash');
  }
  add('layer--bun-bot', L(G.bun.opts.find((x) => x.id === cfg.bun)));
  $('#yoursPrice').textContent = money(cfgPrice(cfg));
  if (!reduce) gsap.fromTo(s.children, { y: -14, opacity: .4 }, { y: 0, opacity: 1, duration: .35, stagger: .015, ease: 'power3.out', overwrite: true });
}
renderBuilder();
$('#yoursAdd').onclick = (e) => { if (addItem({ id: 'custom', cfg: cleanCfg(cfg) })) { flyFrom($('#stack')); toast(t('cart.added', { x: t('yours.name') })); } };
$('#yoursBuy').onclick = (e) => { addItem({ id: 'custom', cfg: cleanCfg(cfg) }); openDrawer('checkout', e.currentTarget); };

/* ---------- cart (prices always recomputed from MENU / BUILD, never trusted from storage) ---------- */
const KEY = 'boda-cart-v3';
const sameCfg = (a, b) => JSON.stringify(a) === JSON.stringify(b);
function sanitize(raw) {
  const out = [];
  (Array.isArray(raw) ? raw : []).slice(0, 60).forEach((i) => {
    if (!i || typeof i !== 'object') return;
    const q = Number(i.q);
    if (!Number.isInteger(q) || q < 1) return;
    let row;
    if (i.id === 'custom') row = { id: 'custom', cfg: cleanCfg(i.cfg), q };
    else {
      const m = MENU.find((x) => x.id === i.id); if (!m) return;
      row = { id: m.id, v: !m.side && i.v === 'meal' ? 'meal' : 'single', q };
    }
    const ex = out.find((x) => x.id === row.id && (row.id === 'custom' ? sameCfg(x.cfg, row.cfg) : x.v === row.v));
    if (ex) ex.q = Math.min(CONFIG.maxQty, ex.q + row.q); else { row.q = Math.min(CONFIG.maxQty, row.q); out.push(row); }
  });
  return out;
}
const load = () => { try { return sanitize(JSON.parse(localStorage.getItem(KEY) || '[]')); } catch { return []; } };
let cart = load();
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(cart)); } catch {} };
addEventListener('storage', (e) => { if (e.key === KEY) { cart = load(); renderCart(); } });
const menuOf = (i) => MENU.find((x) => x.id === i.id);
const unit = (i) => (i.id === 'custom' ? cfgPrice(i.cfg) : menuOf(i).price + (!menuOf(i).side && i.v === 'meal' ? CONFIG.mealExtra : 0));
const nameOf = (i, lang) => (i.id === 'custom' ? (lang === 'ar' ? 'برجر على كيفك' : t('yours.name')) : (lang ? menuOf(i)[lang] : L(menuOf(i))).n);
const varOf = (i) => (i.id === 'custom' ? cfgLabel(i.cfg) : menuOf(i).side ? '' : i.v === 'meal' ? t('var.meal') : t('var.single'));
const imgOf = (i) => (i.id === 'custom' ? 'assets/menu/double.webp' : menuOf(i).img);
const subtotal = () => cart.reduce((s, i) => s + unit(i) * i.q, 0);
const count = () => cart.reduce((s, i) => s + i.q, 0);

function addItem(row) {
  const f = cart.find((i) => i.id === row.id && (row.id === 'custom' ? sameCfg(i.cfg, row.cfg) : i.v === row.v));
  if (f) { if (f.q >= CONFIG.maxQty) { toast(t('cart.maxq', { x: num(CONFIG.maxQty) })); return false; } f.q++; }
  else cart.push({ ...row, q: 1 });
  cart = sanitize(cart); save(); renderCart(); return true;
}
function renderCart() {
  const list = $('#cartList'); list.textContent = '';
  cart.forEach((i, idx) => {
    const nm = nameOf(i);
    const row = el('div', 'ci');
    const th = new Image(); th.src = imgOf(i); th.alt = ''; th.className = 'ci__img';
    const mid = el('div', 'ci__mid');
    mid.append(el('div', 'ci__name', nm), el('div', 'ci__var', varOf(i)), el('div', 'ci__price', money(unit(i) * i.q)));
    const q = el('div', 'q');
    const minus = el('button', '', '−'), plus = el('button', '', '+'); minus.type = plus.type = 'button';
    minus.setAttribute('aria-label', t('cart.dec', { x: nm })); plus.setAttribute('aria-label', t('cart.inc', { x: nm }));
    minus.onclick = () => { i.q--; if (i.q <= 0) cart.splice(idx, 1); save(); renderCart(); };
    plus.onclick = () => { if (i.q < CONFIG.maxQty) { i.q++; save(); renderCart(); } };
    plus.disabled = i.q >= CONFIG.maxQty;
    q.append(minus, el('span', '', num(i.q)), plus);
    const rm = el('button', 'ci__rm', t('cart.rm')); rm.type = 'button'; rm.setAttribute('aria-label', t('cart.rm.aria', { x: nm }));
    rm.onclick = () => { cart.splice(idx, 1); save(); renderCart(); };
    const side = el('div', 'ci__side'); side.append(q, rm);
    row.append(th, mid, side); list.appendChild(row);
  });
  const n = count(), sub = subtotal(), tot = sub + (n ? CONFIG.delivery : 0);
  $('#cartEmpty').classList.toggle('is-on', !n);
  $('#cartSum').hidden = !n;
  $('#sumSub').textContent = $('#coSub').textContent = money(sub);
  $('#sumDel').textContent = $('#coDel').textContent = money(CONFIG.delivery);
  $('#sumTotal').textContent = $('#coTotal').textContent = money(tot);
  const co = $('#coItems'); co.textContent = '';
  cart.forEach((i) => { const li = el('li'); li.append(el('span', '', `${num(i.q)} × ${nameOf(i)}`), el('b', '', money(unit(i) * i.q))); co.appendChild(li); });
  const cc = $('#cartCount');
  if (cc.textContent !== num(n)) { cc.textContent = num(n); cc.classList.remove('bump'); void cc.offsetWidth; cc.classList.add('bump'); }
  $('#cartBtn').setAttribute('aria-label', t('cart.aria', { n: num(n) }));
  $('#mbarCount').textContent = num(n); $('#mbarTotal').textContent = money(tot);
  $('#mbar').classList.toggle('is-on', n > 0 && !drawer.classList.contains('is-open'));
}

/* ---------- drawer: a real modal ---------- */
const drawer = $('#drawer'), panel = $('.drawer__panel');
const outside = () => [$('main'), $('header'), $('footer'), $('#mbar')];
let opener = null, step = 'cart';
function focusFirst(scope) { const f = scope.querySelector('input,button:not([disabled]),[href],textarea'); f && f.focus({ preventScroll: true }); }
function showStep(s) {
  step = s;
  ['Cart', 'Checkout', 'Done'].forEach((k) => $('#step' + k).classList.toggle('is-on', k.toLowerCase() === s));
  const tk = s === 'checkout' ? 'co.title' : s === 'done' ? 'done.title' : 'cart.title';
  const h = $('#drawerTitle'); h.dataset.i18n = tk; h.textContent = t(tk);
  if (drawer.classList.contains('is-open')) setTimeout(() => { const nf = s === 'checkout' && $('#stepCheckout [name=name]'); nf ? nf.focus({ preventScroll: true }) : focusFirst($('#step' + s[0].toUpperCase() + s.slice(1))); }, 50);
}
function openDrawer(s = 'cart', from) {
  if (s === 'checkout' && !count()) s = 'cart';
  opener = from || document.activeElement;
  drawer.classList.add('is-open'); drawer.setAttribute('aria-hidden', 'false');
  outside().forEach((n) => n && (n.inert = true));
  showStep(s);
  lenis && lenis.stop(); $('#mbar').classList.remove('is-on');
  setTimeout(() => { const nf = $('#stepCheckout [name=name]'); s === 'checkout' && nf ? nf.focus({ preventScroll: true }) : focusFirst(panel); }, 350);
}
function closeDrawer() {
  drawer.classList.remove('is-open'); drawer.setAttribute('aria-hidden', 'true');
  outside().forEach((n) => n && (n.inert = false));
  lenis && lenis.start();
  if (step === 'done') showStep('cart');
  renderCart();
  if (opener && document.contains(opener)) opener.focus({ preventScroll: true });
}
$('#cartBtn').onclick = (e) => openDrawer('cart', e.currentTarget);
$('#mbar').onclick = (e) => openDrawer('cart', e.currentTarget);
drawer.addEventListener('click', (e) => { const c = e.target.closest('[data-close]'); if (!c) return; closeDrawer(); if (c.dataset.go) setTimeout(() => goTo(c.dataset.go), 300); });
addEventListener('keydown', (e) => {
  if (!drawer.classList.contains('is-open')) return;
  if (e.key === 'Escape') { closeDrawer(); return; }
  if (e.key === 'Tab') {
    const f = $$('button:not([disabled]),[href],input,textarea,select', panel).filter((n) => n.offsetParent !== null);
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
});
$('#toCheckout').onclick = () => showStep('checkout');
$('#backToCart').onclick = () => showStep('cart');

/* ---------- checkout → WhatsApp ---------- */
const clean = (s, n) => String(s || '').replace(/[\u0000-\u001f\u007f\u2028\u2029]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, n);
const digits = (s) => String(s || '').replace(/[٠-٩]/g, (c) => '٠١٢٣٤٥٦٧٨٩'.indexOf(c)).replace(/[۰-۹]/g, (c) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(c)).replace(/[\s\-().]/g, '');
if (!WA_OK) $('#coClosed').hidden = false;

$('#stepCheckout').addEventListener('submit', (e) => {
  e.preventDefault();
  if (!count()) { showStep('cart'); return; }
  const f = e.currentTarget, d = Object.fromEntries(new FormData(f));
  const err = $('#coErr'); err.textContent = '';
  $$('input,textarea', f).forEach((i) => { i.classList.remove('bad'); i.removeAttribute('aria-invalid'); });
  const name = clean(d.name, 60), address = clean(d.address, 200), notes = clean(d.notes, 150);
  const phone = digits(d.phone).replace(/^(\+?966|00966)/, '0');
  const bad = [];
  if (name.length < 2) bad.push('name');
  if (!/^05\d{8}$/.test(phone)) bad.push('phone');
  if (address.length < 8) bad.push('address');
  if (bad.length) {
    bad.forEach((n) => { f.elements[n].classList.add('bad'); f.elements[n].setAttribute('aria-invalid', 'true'); });
    err.textContent = bad.includes('phone') ? t('co.err.phone') : t('co.err.fill');
    f.elements[bad[0]].focus(); return;
  }
  if (!WA_OK) { err.textContent = t('co.closed'); return; }
  const id = 'BD-' + Date.now().toString(36).toUpperCase().slice(-6);
  // the restaurant reads orders in Arabic, whatever language the customer used
  const pay = d.pay === 'card' ? 'شبكة عند الاستلام' : 'كاش عند الاستلام';
  const lines = cart.map((i) => {
    const extra = i.id === 'custom' ? ` (${[optName('bun', i.cfg.bun) && G.bun.opts.find((x) => x.id === i.cfg.bun).ar, `${i.cfg.patty} سماش`, i.cfg.cheese !== 'none' ? G.cheese.opts.find((x) => x.id === i.cfg.cheese).ar : 'بدون جبن', ...i.cfg.top.map((x) => G.top.opts.find((o) => o.id === x).ar), ...i.cfg.sauce.map((x) => G.sauce.opts.find((o) => o.id === x).ar)].join('، ')})`
      : menuOf(i).side ? '' : i.v === 'meal' ? ' (وجبة: + بطاطس وبيبسي)' : ' (ساندويتش)';
    return `• ${i.q} × ${nameOf(i, 'ar')}${extra} = ${unit(i) * i.q} ر.س`;
  });
  const msg = [`طلب جديد من موقع بودة باربكيو (${id})`, '', ...lines, '', `المجموع: ${subtotal()} ر.س`, `التوصيل: ${CONFIG.delivery} ر.س`, `الإجمالي: ${subtotal() + CONFIG.delivery} ر.س`, '',
    '—— بيانات العميل ——', `الاسم: ${name}`, `الجوال: ${phone}`, `العنوان: ${address}`, notes ? `ملاحظات: ${notes}` : '', `الدفع: ${pay}`].filter((x) => x !== '').join('\n');
  const url = `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(msg)}`;
  const link = $('#doneSend'); link.href = url;
  $('#doneNum').textContent = id;
  window.open(url, '_blank', 'noopener,noreferrer');
  const sent = () => { if (document.visibilityState === 'hidden') { cart = []; save(); f.reset(); renderCart(); document.removeEventListener('visibilitychange', sent); } };
  document.addEventListener('visibilitychange', sent);
  link.onclick = () => { cart = []; save(); f.reset(); renderCart(); };
  showStep('done');
});

/* ---------- toast + fly ---------- */
let tt;
function toast(s) { const n = $('#toast'); n.textContent = s; n.classList.add('is-on'); clearTimeout(tt); tt = setTimeout(() => n.classList.remove('is-on'), 1800); }
function flyFrom(src) {
  if (reduce || !anim || !src) return;
  const from = src.getBoundingClientRect();
  const target = (innerWidth <= 900 && $('#mbar').classList.contains('is-on') ? $('#mbar') : $('#cartBtn')).getBoundingClientRect();
  const dot = el('i', 'fly'); const s = 26;
  Object.assign(dot.style, { width: s + 'px', height: s + 'px', background: 'var(--neon)', left: from.left + from.width / 2 - s / 2 + 'px', top: from.top + from.height / 2 - s / 2 + 'px' });
  document.body.appendChild(dot);
  gsap.to(dot, { left: target.left + target.width / 2 - s / 2, top: target.top + target.height / 2 - s / 2, scale: .5, duration: .7, ease: 'power3.in', onComplete: () => dot.remove() });
}

/* ---------- language switch re-renders the dynamic parts ---------- */
onLang(() => {
  renderMenu(); renderBuilder(); renderCart(); showStep(step);
  const tk = $('#searTag'); tk.textContent = t(tk.dataset.i18n);
  document.title = getLang() === 'ar' ? 'بودة باربكيو | ينسحق وقت طلبك' : 'BODA BBQ | Smashed to order';
  ScrollTrigger.refresh();
});
if (getLang() === 'ar') document.title = 'بودة باربكيو | ينسحق وقت طلبك';
renderCart();
