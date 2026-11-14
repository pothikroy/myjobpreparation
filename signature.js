// Draws the owner's handwritten signature on <canvas data-signature>.
// assets/signature-map.png stores, per pixel, when the pen reached it (red) and
// how much ink it holds (green), so the stroke replays in its original order.
(function () {
  'use strict';
  const MAP = 'assets/signature-map.png';
  const DRAW_MS = 3000, FEATHER = 0.035, TIP = 0.07;
  // One ink: champagne gold, shading only slightly along the stroke like foil catching light.
  const STOPS = [[236, 214, 168], [250, 240, 214], [228, 200, 146], [244, 230, 196]];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const LUT = new Uint8Array(256 * 3);
  for (let i = 0; i < 256; i++) {
    const f = i / 256 * (STOPS.length - 1), k = Math.floor(f), m = f - k, a = STOPS[k], b = STOPS[k + 1];
    for (let c = 0; c < 3; c++) LUT[i * 3 + c] = Math.round(a[c] + (b[c] - a[c]) * m);
  }
  let ink = null;
  function load() {
    return ink || (ink = new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const w = img.naturalWidth, h = img.naturalHeight;
        const c = document.createElement('canvas'); c.width = w; c.height = h;
        const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(img, 0, 0);
        const d = g.getImageData(0, 0, w, h).data, idx = [], time = [], cover = [], hue = [];
        for (let y = 0, i = 0; y < h; y++) for (let x = 0; x < w; x++, i += 4) {
          if (d[i + 1] < 6) continue;
          idx.push(i); time.push(d[i] / 255); cover.push(d[i + 1]);
          hue.push(x / w * 0.86 + y / h * 0.14);
        }
        resolve({ w, h, idx: Uint32Array.from(idx), time: Float32Array.from(time), cover: Uint8Array.from(cover), hue: Float32Array.from(hue) });
      };
      img.onerror = reject; img.src = MAP;
    }));
  }
  function attach(canvas, data) {
    canvas.width = data.w; canvas.height = data.h;
    const ctx = canvas.getContext('2d'), frame = ctx.createImageData(data.w, data.h), px = frame.data;
    const still = canvas.dataset.signature === 'static';
    let start = 0, raf = 0, visible = true;
    function paint(p, phase) {
      const { idx, time, cover, hue } = data;
      for (let n = 0; n < idx.length; n++) {
        const i = idx[n], since = p - time[n];
        if (since <= 0) { px[i + 3] = 0; continue; }
        const o = Math.min(255, (hue[n] + phase) * 256 | 0) * 3;
        const glow = since < TIP ? (1 - since / TIP) * 0.85 : 0;
        px[i] = LUT[o] + (255 - LUT[o]) * glow; px[i + 1] = LUT[o + 1] + (255 - LUT[o + 1]) * glow; px[i + 2] = LUT[o + 2] + (255 - LUT[o + 2]) * glow;
        px[i + 3] = since >= FEATHER ? cover[n] : cover[n] * since / FEATHER;
      }
      ctx.putImageData(frame, 0, 0);
    }
    function tick(now) {
      raf = 0;
      if (!visible || document.hidden) return;
      const elapsed = now - start, p = Math.min(1 + TIP, elapsed / DRAW_MS * (1 + TIP));
      if (p < 1 + TIP) { paint(p, 0); raf = requestAnimationFrame(tick); return; }
      paint(2, 0); // written once, then it rests
    }
    function play() {
      cancelAnimationFrame(raf);
      if (reduce.matches) { paint(2, 0); return; }
      start = performance.now(); raf = requestAnimationFrame(tick);
    }
    function resume() { if (!raf && visible && !document.hidden && start) raf = requestAnimationFrame(tick); }
    canvas.addEventListener('click', play);
    canvas.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); play(); } });
    document.addEventListener('visibilitychange', resume);
    if (still) { paint(2, 0); start = -1e9; canvas.addEventListener('pointerenter', play); return; }
    new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting;
      if (visible && !start) play(); else resume();
    }, { threshold: 0.4 }).observe(canvas);
  }
  function init() {
    const targets = document.querySelectorAll('canvas[data-signature]');
    if (!targets.length) return;
    // On gated pages, wait until the sign-in screen has gone so the writing is actually seen.
    const shown = window.AG_PAGE ? new Promise(done => window.addEventListener('study-ready', done, { once: true })) : Promise.resolve();
    Promise.all([load(), shown]).then(([data]) => targets.forEach(c => attach(c, data))).catch(() => targets.forEach(c => { c.hidden = true; }));
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
