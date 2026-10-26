// Isometric line-drawing kit for the Printer page, vendored from the workshop-manual
// design option (Printer geometry only; the other projects' drawings are not needed).
// Coordinates are millimetre-ish model units: +x runs to the lower right,
// +y to the lower left (towards the reader), +z up. Faces with +x, +y and +z
// normals are the visible ones. Output is plain SVG markup; line weights are
// set in CSS (outline heavier than edges, hidden lines dashed, centre lines
// chain-dotted) and use non-scaling strokes so the hierarchy survives at
// every size.

const C = Math.cos(Math.PI / 6);
const S = 0.5;
const ISO = (x, y, z) => [(x - y) * C, (x + y) * S - z];
let PROJ = ISO;
export const P = (x, y, z) => PROJ(x, y, z);
export function useProjection(fn) { PROJ = fn || ISO; }
const r2 = n => (Math.round(n * 100) / 100).toString();

function hull(points) {
  const p = points.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower = [];
  for (const q of p) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], q) <= 0) lower.pop();
    lower.push(q);
  }
  const upper = [];
  for (let i = p.length - 1; i >= 0; i--) {
    const q = p[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], q) <= 0) upper.pop();
    upper.push(q);
  }
  upper.pop();
  lower.pop();
  return lower.concat(upper);
}

const FILL = { w: '#fff', s: 'url(#ls-a)', t: 'url(#ls-b)', k: '#0d0d0d', y: '#ffcf00' };

export class Sheet {
  constructor() {
    this.parts = [];
    this.cur = null;
  }
  part(id, opts = {}) {
    const p = { id, out: [], pts: [], d: opts.d || [0, 0, 0], key: opts.key || id };
    this.parts.push(p);
    this.cur = p;
    return p;
  }
  track(list) {
    for (const q of list) this.cur.pts.push(q);
  }
  proj(list) {
    const s = list.map(([x, y, z]) => P(x, y, z));
    this.track(s);
    return s;
  }
  str(s) {
    return s.map(q => r2(q[0]) + ',' + r2(q[1])).join(' ');
  }
  face(list, fill = 'w') {
    const s = this.proj(list);
    const cls = fill === 'k' ? 'fk' : fill === 'y' ? 'fy' : 'f';
    this.cur.out.push(`<polygon class="${cls}" fill="${FILL[fill]}" points="${this.str(s)}"/>`);
  }
  shape2d(s, cls, fill) {
    this.track(s);
    const f = fill ? ` fill="${FILL[fill]}"` : '';
    this.cur.out.push(`<polygon class="${cls}"${f} points="${this.str(s)}"/>`);
  }
  line(a, b, cls = 'e') {
    const [p, q] = [P(...a), P(...b)];
    this.track([p, q]);
    this.cur.out.push(`<line class="${cls}" x1="${r2(p[0])}" y1="${r2(p[1])}" x2="${r2(q[0])}" y2="${r2(q[1])}"/>`);
  }
  path3(list, cls, closed = false) {
    const s = this.proj(list);
    this.cur.out.push(`<path class="${cls}" d="M${this.str(s).replace(/ /g, 'L')}${closed ? 'Z' : ''}"/>`);
  }
  raw(svg) {
    this.cur.out.push(svg);
  }
  // A solid box. fills: top / front (+y) / right (+x).
  box(x0, y0, z0, dx, dy, dz, o = {}) {
    const [x1, y1, z1] = [x0 + dx, y0 + dy, z0 + dz];
    const top = o.top || 'w';
    const front = o.front || 'w';
    const right = o.right || 'w';
    if (o.hidden) {
      this.path3([[x0, y0, z0], [x1, y0, z0]], 'h');
      this.path3([[x0, y0, z0], [x0, y1, z0]], 'h');
      this.path3([[x0, y0, z0], [x0, y0, z1]], 'h');
    }
    this.face([[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]], top);
    this.face([[x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0]], front);
    this.face([[x1, y0, z1], [x1, y1, z1], [x1, y1, z0], [x1, y0, z0]], right);
    this.line([x1, y1, z1], [x1, y0, z1], o.edge || 'e');
    this.line([x1, y1, z1], [x0, y1, z1], o.edge || 'e');
    this.line([x1, y1, z1], [x1, y1, z0], o.edge || 'e');
    this.path3([[x0, y0, z1], [x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0], [x0, y1, z1]], o.outline || 'o', true);
  }
  // Ellipse points for a circle in a plane. axis: 'x' | 'z'
  circ(axis, c, r, n = 72) {
    const out = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      if (axis === 'x') out.push([c[0], c[1] + r * Math.cos(a), c[2] + r * Math.sin(a)]);
      else if (axis === 'y') out.push([c[0] + r * Math.cos(a), c[1], c[2] + r * Math.sin(a)]);
      else out.push([c[0] + r * Math.cos(a), c[1] + r * Math.sin(a), c[2]]);
    }
    return out;
  }
  ellipse(axis, c, r, cls, fill) {
    const s = this.proj(this.circ(axis, c, r));
    const f = fill ? ` fill="${FILL[fill]}"` : '';
    this.cur.out.push(`<polygon class="${cls}"${f} points="${this.str(s)}"/>`);
  }
  // Cylinder with its axis along x, visible end at x1.
  cylX(x0, x1, cy, cz, r, o = {}) {
    const a = this.proj(this.circ('x', [x0, cy, cz], r));
    const b = this.proj(this.circ('x', [x1, cy, cz], r));
    const h = hull(a.concat(b));
    this.shape2d(h, 'f', o.side || 'w');
    if (o.hidden !== false) this.shape2d(a, 'h');
    this.shape2d(b, 'f', o.end || 'w');
    for (const rr of o.rings || []) this.ellipse('x', [x1, cy, cz], rr, o.ringClass || 'e');
    if (o.core) {
      this.ellipse('x', [x1, cy, cz], o.core, 'f', 'w');
      this.ellipse('x', [x1, cy, cz], o.core * 0.66, 'fk', 'k');
    }
    this.shape2d(b, 'e');
    this.shape2d(h, 'o');
  }
  // Cylinder with its axis along z, visible end on top.
  cylZ(cx, cy, z0, z1, r, o = {}) {
    const a = this.proj(this.circ('z', [cx, cy, z0], r, 48));
    const b = this.proj(this.circ('z', [cx, cy, z1], r, 48));
    const h = hull(a.concat(b));
    this.shape2d(h, 'f', o.side || 'w');
    this.shape2d(b, o.top === 'k' ? 'fk' : 'f', o.top || 'w');
    this.shape2d(b, 'e');
    this.shape2d(h, 'o');
  }
  // LED: cylinder with a domed top.
  led(cx, cy, z0, h, r) {
    this.cylZ(cx, cy, z0, z0 + h, r);
    const pts = [];
    for (let i = 0; i <= 24; i++) {
      const a = Math.PI * (i / 24);
      pts.push([cx + r * Math.cos(a + Math.PI * 0.75), cy + r * Math.sin(a + Math.PI * 0.75), z0 + h + Math.sin(a) * r * 1.1]);
    }
    const top = this.proj(this.circ('z', [cx, cy, z0 + h], r, 48));
    const dome = this.proj(pts);
    const hh = hull(top.concat(dome));
    this.shape2d(hh, 'f', 'w');
    this.shape2d(hh, 'o');
    const hi = this.proj([[cx - r * 0.2, cy - r * 0.2, z0 + h + r * 0.75]]);
    this.raw(`<circle class="fk" cx="${r2(hi[0][0])}" cy="${r2(hi[0][1])}" r="0.35"/>`);
  }
  dots(list) {
    const s = this.proj(list);
    this.cur.out.push(`<path class="dots" d="${s.map(q => `M${r2(q[0])} ${r2(q[1])}h0`).join('')}"/>`);
  }
  tube(list, cls = 'wire') {
    const s = this.proj(list);
    const d = 'M' + this.str(s).replace(/ /g, 'L');
    this.cur.out.push(`<path class="${cls}-o" d="${d}"/><path class="${cls}-i f-stroke" d="${d}"/>`);
  }
  bounds(parts, e) {
    let [x0, y0, x1, y1] = [Infinity, Infinity, -Infinity, -Infinity];
    for (const p of parts) {
      const [dx, dy] = this.dScreen(p, e);
      for (const [x, y] of p.pts) {
        x0 = Math.min(x0, x + dx); y0 = Math.min(y0, y + dy);
        x1 = Math.max(x1, x + dx); y1 = Math.max(y1, y + dy);
      }
    }
    return [x0, y0, x1, y1];
  }
  dScreen(p, e = 1) {
    const [a, b] = P(...p.d);
    return [a * e, b * e];
  }
}

export const svgDefs = (id = '') => `<defs><pattern id="ls-a${id}" patternUnits="userSpaceOnUse" width="2.4" height="2.4" patternTransform="rotate(45)"><rect width="2.4" height="2.4" fill="#fff"/><rect width="0.36" height="2.4" fill="#0d0d0d"/></pattern><pattern id="ls-b${id}" patternUnits="userSpaceOnUse" width="2.4" height="2.4" patternTransform="rotate(-45)"><rect width="2.4" height="2.4" fill="#fff"/><rect width="0.36" height="2.4" fill="#0d0d0d"/></pattern></defs>`;

// ---------------------------------------------------------------------------
// The Printer, as photographed in images/printer and images/printer-kit:
// a black panel-mount thermal printer (bezel, shell, lid with paper window),
// its paper roll and print mechanism, an Arduino, a shield carrying the
// Ethernet jack, MicroSD slot, print button and three LEDs, and the
// three-wire printer lead.

export const PRINTER_PARTS = [
  { n: 1, name: 'Enclosure, upper half', note: 'Lid with paper window', qty: 1 },
  { n: 2, name: 'Thermal paper roll', qty: 1 },
  { n: 3, name: 'Thermal printer mechanism', note: 'Print head and platen', qty: 1 },
  { n: 4, name: 'Enclosure, lower half', note: 'Shell and front bezel', qty: 1 },
  { n: 5, name: 'Arduino', qty: 1 },
  { n: 6, name: 'Shield', note: 'Ethernet, MicroSD reader, print button, LEDs', qty: 1 },
  { n: 7, name: 'Printer lead', note: 'Three wires', qty: 1 }
];

export const PRINTER_D = {
  1: [0, 0, 100],
  2: [0, 0, 72],
  3: [0, 0, 44],
  4: [0, 0, 0],
  5: [40, 0, 0],
  6: [40, 0, 44],
  7: [0, 0, 30]
};

// Staggered scrub: each part separates in its own window of scroll progress.
// The lid always leads the roll and the mechanism; the shield rides out with
// the Arduino before lifting; the lead only rises after the Arduino has
// carried the shield's edge clear of the lead's plug. No part passes through
// another between e0 and 1.
export const PRINTER_SCHED = { 1: [0, 0.4], 2: [0.12, 0.5], 3: [0.24, 0.6], 5: [0.36, 0.7], 6: [0.48, 0.85], 7: [0.6, 1] };
export const PRINTER_VECS = {
  1: [[[0, 0, 100], 1]],
  2: [[[0, 0, 72], 2]],
  3: [[[0, 0, 44], 3]],
  4: [],
  5: [[[40, 0, 0], 5]],
  6: [[[40, 0, 0], 5], [[0, 0, 44], 6]],
  7: [[[0, 0, 30], 7]]
};

export const PRINTER_ANCHORS = {
  1: [14, 64, 39],
  2: [86, 31, 24],
  3: [22, 60, 14],
  4: [4, 70, 10],
  5: [188, 58, 6],
  6: [178, 48, 22],
  7: [117, 10, 35]
};

export function drawPrinter(sh, { assembled = false } = {}) {
  const parts = {};
  const T = 3; // wall thickness

  // 4a: lower shell, the parts behind the inner parts (floor and far walls).
  parts.tubBack = sh.part('4a', { d: PRINTER_D[4], key: 4 });
  sh.path3([[0, 0, 0], [96, 0, 0]], 'h');
  sh.path3([[0, 0, 0], [0, 64, 0]], 'h');
  sh.path3([[0, 0, 0], [0, 0, 34]], 'h');
  sh.face([[T, T, T], [96 - T, T, T], [96 - T, 64 - T, T], [T, 64 - T, T]], 'w');
  sh.face([[T, T, 34], [96 - T, T, 34], [96 - T, T, T], [T, T, T]], 's');
  sh.face([[T, T, 34], [T, 64 - T, 34], [T, 64 - T, T], [T, T, T]], 't');
  sh.line([T, T, T], [96 - T, T, T]);
  sh.line([T, T, T], [T, 64 - T, T]);
  sh.line([T, T, T], [T, T, 34]);
  // rim, back and left
  sh.face([[0, 0, 34], [96, 0, 34], [96 - T, T, 34], [T, T, 34], [T, 64 - T, 34], [0, 64, 34]], 'w');
  sh.path3([[0, 64, 34], [0, 0, 34], [96, 0, 34]], 'o');
  sh.path3([[T, 64 - T, 34], [T, T, 34], [96 - T, T, 34]], 'e');

  // 2: paper roll
  parts.roll = sh.part('2', { d: PRINTER_D[2], key: 2 });
  sh.cylX(8, 86, 24, 18, 14, { core: 5, rings: [8, 10.5, 12.5], ringClass: 'hair' });
  // the paper's free end, leading forward to the mechanism
  sh.face([[10, 37.6, 22], [84, 37.6, 22], [84, 43, 24], [10, 43, 24]], 'w');
  sh.path3([[10, 37.6, 22], [10, 43, 24], [84, 43, 24], [84, 37.6, 22]], 'e');

  // 3: thermal printer mechanism
  parts.mech = sh.part('3', { d: PRINTER_D[3], key: 3 });
  sh.box(10, 44, 4, 74, 16, 20, { front: 's', right: 't', hidden: true });
  sh.box(14, 46, 24, 66, 4, 3, { front: 'w' });
  sh.cylX(12, 82, 54, 27, 4.2, { rings: [1.3] });
  sh.cylX(84, 92, 52, 12, 6, { end: 'w', rings: [4.4, 1.6] });
  sh.box(30, 60, 8, 34, 1.2, 6, { front: 'k' });

  // 1: lid with paper window
  parts.lid = sh.part('1', { d: PRINTER_D[1], key: 1 });
  {
    const [z0, z1] = [34, 44];
    const [wx0, wx1, wy0, wy1] = [18, 78, 10, 50];
    sh.path3([[0, 0, z0], [96, 0, z0]], 'h');
    sh.path3([[0, 0, z0], [0, 64, z0]], 'h');
    // window inner walls (visible through the opening)
    sh.face([[wx0, wy0, z1], [wx1, wy0, z1], [wx1, wy0, z0], [wx0, wy0, z0]], 's');
    sh.face([[wx0, wy0, z1], [wx0, wy1, z1], [wx0, wy1, z0], [wx0, wy0, z0]], 't');
    sh.line([wx0, wy0, z0], [wx0, wy0, z1]);
    // top, as a frame
    const outer = [[0, 0, z1], [96, 0, z1], [96, 64, z1], [0, 64, z1]].map(q => P(...q));
    const inner = [[wx0, wy0, z1], [wx1, wy0, z1], [wx1, wy1, z1], [wx0, wy1, z1]].map(q => P(...q));
    sh.track(outer.concat(inner));
    sh.raw(`<path class="f" fill="#fff" fill-rule="evenodd" d="M${sh.str(outer).replace(/ /g, 'L')}ZM${sh.str(inner).replace(/ /g, 'L')}Z"/>`);
    sh.face([[0, 64, z1], [96, 64, z1], [96, 64, z0], [0, 64, z0]], 's');
    sh.face([[96, 0, z1], [96, 64, z1], [96, 64, z0], [96, 0, z0]], 't');
    sh.path3([[wx0, wy1, z1], [wx0, wy0, z1], [wx1, wy0, z1], [wx1, wy1, z1]], 'o', true);
    sh.line([96, 64, z1], [96, 0, z1]);
    sh.line([96, 64, z1], [0, 64, z1]);
    sh.line([96, 64, z1], [96, 64, z0]);
    sh.path3([[0, 0, z1], [96, 0, z1], [96, 0, z0], [96, 64, z0], [0, 64, z0], [0, 64, z1]], 'o', true);
    // hinge pins on the back edge
    sh.cylX(10, 18, 2, 40, 1.6, { hidden: false });
    sh.cylX(78, 86, 2, 40, 1.6, { hidden: false });
  }

  // 4b: lower shell, right wall and the front bezel (in front of everything inside)
  parts.tubFront = sh.part('4b', { d: PRINTER_D[4], key: 4 });
  sh.face([[96, 0, 34], [96, 64, 34], [96, 64, 0], [96, 0, 0]], 't');
  sh.face([[96 - T, 0, 34], [96, 0, 34], [96, 64, 34], [96 - T, 64 - T, 34]], 'w');
  sh.path3([[96, 0, 34], [96, 0, 0], [96, 64, 0]], 'o');
  sh.line([96, 0, 34], [96, 64, 34]);
  sh.line([96 - T, T, 34], [96 - T, 64 - T, 34]);
  // connector socket for the printer lead
  sh.box(96, 10, 13, 1.5, 8, 6, { right: 'k' });
  // bezel
  sh.box(-5, 64, -4, 106, 6, 52, { front: 's', right: 't' });
  {
    const y = 70;
    const inset = [[1, y, 42], [95, y, 42], [95, y, 2], [1, y, 2]];
    sh.path3(inset, 'e', true);
    sh.face([[12, y, 26], [84, y, 26], [84, y, 23], [12, y, 23]], 'k');
    sh.face([[80, y, 14], [86, y, 14], [86, y, 8], [80, y, 8]], 'w');
    sh.path3([[80, y, 14], [86, y, 14], [86, y, 8], [80, y, 8]], 'e', true);
  }
  // the printed slip, leaving the paper slot and lying on the bench
  {
    const prof = [[70, 24.5], [77, 24], [83, 21.5], [87.5, 16], [90, 8], [91.5, 0], [94, -3.6], [99, -4], [134, -4]];
    const [xa, xb] = [22, 74];
    for (let i = 0; i < prof.length - 1; i++) {
      const [[ya, za], [yb, zb]] = [prof[i], prof[i + 1]];
      sh.face([[xa, ya, za], [xb, ya, za], [xb, yb, zb], [xa, yb, zb]], 'y');
    }
    for (const [yy, x0, x1, cls] of [[104, 27, 52, 'ln-b'], [110, 27, 60, 'ln'], [114, 27, 56, 'ln'], [118, 27, 62, 'ln'], [125, 27, 45, 'ln-b'], [130, 27, 58, 'ln']]) {
      sh.line([x0, yy, -4], [x1, yy, -4], cls);
    }
    sh.path3([[xb, 70, 24.5]].concat(prof.map(([yy, zz]) => [xb, yy, zz])), 'e');
    const left = prof.map(([yy, zz]) => [xa, yy, zz]);
    const right = prof.map(([yy, zz]) => [xb, yy, zz]).reverse();
    sh.path3(left.concat(right), 'o', true);
  }

  // 7: printer lead, three wires from the shell socket to the shield header
  parts.lead = sh.part('7', { d: PRINTER_D[7], key: 7 });
  {
    const route = (dy) => {
      const pts = [];
      const ctrl = [[98, 14 + dy, 16], [106, 14 + dy, 17], [112, 12 + dy, 30], [118, 10 + dy, 36], [128, 8 + dy, 34], [135, 7.5 + dy, 28], [136, 7.5 + dy, 21]];
      // Catmull-Rom through the control points
      for (let i = 0; i < ctrl.length - 1; i++) {
        const p0 = ctrl[Math.max(0, i - 1)], p1 = ctrl[i], p2 = ctrl[i + 1], p3 = ctrl[Math.min(ctrl.length - 1, i + 2)];
        for (let t = 0; t < 1; t += 0.125) {
          const t2 = t * t, t3 = t2 * t;
          pts.push([0, 1, 2].map(k => 0.5 * ((2 * p1[k]) + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3)));
        }
      }
      pts.push(ctrl[ctrl.length - 1]);
      return pts;
    };
    sh.box(97.5, 10.5, 12.5, 5, 7, 7, { right: 't' });
    for (const dy of [-1.6, 0, 1.6]) sh.tube(route(dy));
    sh.box(132.5, 4, 15.8, 7, 7, 6, { front: 's' });
  }

  // 5: Arduino
  parts.ard = sh.part('5', { d: PRINTER_D[5], key: 5 });
  sh.box(130, 6, 0, 68, 52, 1.6, {});
  sh.box(124, 36, 1.6, 16, 12, 11, { front: 's', right: 't' });
  sh.box(126, 12, 1.6, 14, 9, 11, { front: 's', right: 't' });
  sh.box(158, 28, 1.6, 32, 9, 3.6, { top: 'k', front: 's', right: 't' });
  for (let i = 0; i < 14; i++) {
    sh.line([160 + i * 2.2, 37, 1.6], [160 + i * 2.2, 37.8, 0.8], 'e');
  }
  sh.box(146, 24, 1.6, 5, 2.4, 3.2, { front: 's' });
  sh.cylZ(150, 44, 1.6, 8, 2.6, {});
  sh.cylZ(156, 44, 1.6, 8, 2.6, {});
  sh.box(140, 6.4, 1.6, 54, 2.8, 8.4, { top: 'k', front: 's', right: 't' });
  sh.box(146, 55, 1.6, 48, 2.8, 8.4, { top: 'k', front: 's', right: 't' });
  sh.ellipse('z', [194, 13, 1.61], 1.4, 'e');
  sh.ellipse('z', [194, 48, 1.61], 1.4, 'e');

  // 6: shield
  parts.shield = sh.part('6', { d: PRINTER_D[6], key: 6 });
  sh.box(140, 6.4, 10, 54, 2.8, 5, { hidden: true, outline: 'h', edge: 'h', top: 'w' });
  sh.box(146, 55, 10, 48, 2.8, 5, { hidden: true, outline: 'h', edge: 'h', top: 'w' });
  sh.box(130, 6, 15, 68, 52, 1.6, {});
  {
    const holes = [];
    for (let i = 0; i < 16; i++) for (let j = 0; j < 9; j++) holes.push([156 + i * 2.54, 13 + j * 2.54, 16.61]);
    sh.dots(holes);
  }
  sh.box(126, 20, 16.6, 22, 16, 13, { front: 's', right: 't' });
  sh.face([[148, 23, 25], [148, 33, 25], [148, 33, 21], [148, 23, 21]], 'k');
  sh.box(176, 46, 16.6, 13, 10, 2, { front: 's' });
  sh.box(150, 44, 16.6, 6.5, 6.5, 3.6, { front: 's', right: 't' });
  sh.cylZ(153.25, 47.25, 20.2, 22.2, 2, { top: 'k' });
  sh.led(164, 50, 16.6, 5.5, 2.5);
  sh.led(170, 50, 16.6, 5.5, 2.5);
  sh.led(176, 39, 16.6, 5.5, 2.5);
  sh.ellipse('z', [194, 13, 16.61], 1.4, 'e');
  sh.ellipse('z', [194, 48, 16.61], 1.4, 'e');

  const order = assembled
    ? [parts.tubBack, parts.roll, parts.mech, parts.lid, parts.tubFront, parts.ard, parts.shield, parts.lead]
    : [parts.tubBack, parts.roll, parts.mech, parts.lid, parts.tubFront, parts.lead, parts.ard, parts.shield];
  return order;
}

// Chain (centre) lines along each part's explosion path.
export function chainLines(order) {
  const seen = new Set();
  const out = [];
  for (const p of order) {
    if (seen.has(p.key) || !PRINTER_ANCHORS[p.key]) continue;
    seen.add(p.key);
    const vecs = PRINTER_VECS[p.key] || [];
    if (!vecs.length) continue;
    let q = PRINTER_ANCHORS[p.key].slice();
    const pts = [P(...q)];
    for (const [v] of vecs) {
      q = [q[0] + v[0], q[1] + v[1], q[2] + v[2]];
      pts.push(P(...q));
    }
    out.push(`<polyline class="c" points="${pts.map(t => r2(t[0]) + ',' + r2(t[1])).join(' ')}"/>`);
  }
  return out.join('');
}
