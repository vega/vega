import type {PatternRegistryEntry} from './types.js';

const stroke = '#000';
const strokeWidth = 1;
const background = 'transparent';
const tileSize = 10;

export const registry: Record<string, PatternRegistryEntry> = {
  'diagonal-stripe': {
    rule: { angle: -45 },
    tileSize,
    background,
    stroke,
    strokeWidth
	},
  'horizontal-stripe': {
    rule: { angle: 0, spacing: tileSize },
    tileSize: tileSize * 2,
    background,
    stroke,
    strokeWidth
	},
  'vertical-stripe': {
    rule: { angle: 90, spacing: tileSize },
    tileSize: tileSize * 2,
    background,
    stroke,
    strokeWidth
	},
  caps: {
    shape: capsPath(tileSize),
    tileSize: tileSize,
    background,
    stroke,
    strokeWidth
  },
  circles: {
    shape: circlePath(tileSize),
    tileSize: tileSize,
    background,
    fill: stroke
  },
  crosses: {
    shape: crossesPath(tileSize),
    tileSize: tileSize,
    background,
    stroke,
    strokeWidth
  },
  crosshatch: {
    rule: { angle: [-45, 45] },
    tileSize,
    background,
    stroke,
    strokeWidth
  },
  grid: {
    rule: { angle: [0, 90], spacing: tileSize / 2 },
    tileSize,
    background,
    stroke,
    strokeWidth
  },
  squares: {
    shape: squarePath(tileSize),
    tileSize: tileSize,
    background,
    stroke,
    strokeWidth,
    fill: background
  },
  nylon: {
    shape: nylonPath(tileSize * 2),
    tileSize: tileSize * 2,
    background,
    stroke,
    strokeWidth,
    fill: background
  },
  waves: {
    shape: wavesPath(tileSize),
    tileSize: tileSize,
    background,
    stroke,
    strokeWidth
  },
  woven: {
    shape: wovenPath(tileSize),
    tileSize,
    background,
    stroke,
    strokeWidth
  },
  houndstooth: {
    shape: houndstoothPath(tileSize),
    tileSize,
    background,
    stroke,
    strokeWidth,
    fill: stroke
  }
};

function capsPath(tileSize: number): string {
  const s = Number(tileSize);
  return `M ${s / 4},${s * 3 / 4}l${s / 4},${-s / 2}l${s / 4},${s / 2}`;
}

function circlePath(tileSize: number, r: number = tileSize / 6, cx: number = tileSize / 2, cy: number = tileSize / 2): string {
  const rr = Number(r);
  const xx = Number(cx);
  const yy = Number(cy);
  const dx = 2 * rr;
  return `M ${xx - rr} ${yy} a ${rr} ${rr} 0 1 0 ${dx} 0 a ${rr} ${rr} 0 1 0 -${dx} 0`;
}

function crossesPath(tileSize: number): string {
  const s = Number(tileSize);
  return `M ${s / 4},${s / 4}l${s / 2},${s / 2}M${s / 4},${s * 3 / 4}l${s / 2},${-s / 2}`;
}

function houndstoothPath(tileSize: number): string {
  const s = Number(tileSize);
  const f = (v: number): string => String(Number(v.toFixed(3)));
  const p1 = `M ${f(0)} ${f(0)} L ${f(0.4 * s)} ${f(0.4 * s)}`;
  const p2 = `M ${f(0.25 * s)} ${f(0)} L ${f(0.5 * s)} ${f(0.25 * s)} L ${f(0.5 * s)} ${f(0.5 * s)} L ${f(0.9 * s)} ${f(0.9 * s)} L ${f(0.5 * s)} ${f(0.5 * s)} L ${f(1 * s)} ${f(0.5 * s)} L ${f(1 * s)} ${f(0)}`;
  const p3 = `M ${f(0.5 * s)} ${f(1 * s)} L ${f(0.5 * s)} ${f(0.75 * s)} L ${f(0.75 * s)} ${f(1 * s)}`;
  return `${p1} ${p2} ${p3}`;
}

function nylonPath(tileSize: number): string {
  const s = Number(tileSize);
  return `M 0 ${s / 4} l ${s / 4} 0 l 0 ${-s / 4} M ${s * 3 / 4} ${s} l 0 ${-s / 4} l ${s / 4} 0 M ${s / 4} ${s / 2} l 0 ${s / 4} l ${s / 4} 0 M ${s / 2} ${s / 4} l ${s / 4} 0 l 0 ${s / 4}`;
}

function squarePath(tileSize: number): string {
  const s = Number(tileSize);
  return `M ${s / 4} ${s / 4} l ${s / 2} 0 l 0 ${s / 2} l ${-s / 2} 0 Z`;
}

function wavesPath(tileSize: number): string {
  const s = Number(tileSize);
  return `M 0 ${s / 2} c ${s / 8} ${-s / 4} , ${s * 3 / 8} ${-s / 4} , ${s / 2} 0 c ${s / 8} ${s / 4} , ${s * 3 / 8} ${s / 4} , ${s / 2} 0 M ${-s / 2} ${s / 2} c ${s / 8} ${s / 4} , ${s * 3 / 8} ${s / 4} , ${s / 2} 0 M ${s} ${s / 2} c ${s / 8} ${-s / 4} , ${s * 3 / 8} ${-s / 4} , ${s / 2} 0`;
}

function wovenPath(tileSize: number): string {
  const s = Number(tileSize);
  return `M ${s / 4},${s / 4}l${s / 2},${s / 2}M${s * 3 / 4},${s / 4}l${s / 2},${-s / 2} M${s / 4},${s * 3 / 4}l${-s / 2},${s / 2}M${s * 3 / 4},${s * 5 / 4}l${s / 2},${-s / 2} M${-s / 4},${s / 4}l${s / 2},${-s / 2}`;
}
