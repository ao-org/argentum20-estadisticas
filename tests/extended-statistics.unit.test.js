import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock Chart.js globally before requiring any module
const mockChartInstance = { destroy: vi.fn(), update: vi.fn(), data: { datasets: [] } };
const MockChart = vi.fn(() => mockChartInstance);
MockChart.defaults = {
  color: '',
  borderColor: '',
  plugins: { tooltip: { backgroundColor: '' }, legend: { labels: { color: '' } } },
  scale: { grid: {} }
};
globalThis.Chart = MockChart;

// Load AO20 namespace modules in order: config → data-utils → renderers
const AO20 = require('../js/config.js');
globalThis.AO20 = AO20;
require('../js/data-utils.js');
require('../js/renderers.js');

// Import exported utility functions
const {
  computeGini,
  heatmapColor,
  getLevelBracket,
  getGuildSizeBucket,
  getMultiCharBucket,
  getFishingBracket,
} = require('../js/renderers.js');

const renderStatCard = AO20.renderers.renderStatCard.bind(AO20.renderers);

// JS equivalent of the PHP safeCall pattern (from design doc)
function safeCall(fn) {
  try { return fn(); }
  catch (e) { return []; }
}

// ── 16.2 heatmapColor() ────────────────────────────────────────────────────
describe('heatmapColor', () => {
  it('returns green-ish rgb for min value (0 in range 0–10)', () => {
    const color = heatmapColor(0, 0, 10);
    expect(color).toMatch(/^rgb\(\d+,\d+,\d+\)$/);
    // At t=0, should be green (#2ecc71) → rgb(46,204,113)
    expect(color).toBe('rgb(46,204,113)');
  });

  it('returns yellow-ish rgb for mid value (5 in range 0–10)', () => {
    const color = heatmapColor(5, 0, 10);
    expect(color).toMatch(/^rgb\(\d+,\d+,\d+\)$/);
    // At t=0.5, should be yellow (#f39c12) → rgb(243,156,18)
    expect(color).toBe('rgb(243,156,18)');
  });

  it('returns red-ish rgb for max value (10 in range 0–10)', () => {
    const color = heatmapColor(10, 0, 10);
    expect(color).toMatch(/^rgb\(\d+,\d+,\d+\)$/);
    // At t=1, should be red (#e74c3c) → rgb(231,76,60)
    expect(color).toBe('rgb(231,76,60)');
  });

  it('returns neutral gray for null value', () => {
    expect(heatmapColor(null, 0, 10)).toBe('#374151');
  });

  it('returns neutral gray for undefined value', () => {
    expect(heatmapColor(undefined, 0, 10)).toBe('#374151');
  });

  it('handles min === max (returns green)', () => {
    const color = heatmapColor(5, 5, 5);
    // t = 0 when min === max
    expect(color).toBe('rgb(46,204,113)');
  });
});

// ── 16.3 computeGini() ─────────────────────────────────────────────────────
describe('computeGini', () => {
  it('returns 0 for empty array', () => {
    expect(computeGini([])).toBe(0);
  });

  it('returns 0 for single element', () => {
    expect(computeGini([5])).toBe(0);
  });

  it('returns 0 for uniform array (all values equal)', () => {
    expect(computeGini([10, 10, 10, 10])).toBe(0);
  });

  it('returns close to 0.75 for extreme inequality [0,0,0,100]', () => {
    const gini = computeGini([0, 0, 0, 100]);
    expect(gini).toBeCloseTo(0.75, 1);
  });

  it('returns 0 for all-zero values', () => {
    expect(computeGini([0, 0, 0, 0])).toBe(0);
  });
});

// ── 16.4 Bracket assignment boundary values ─────────────────────────────────
describe('getLevelBracket', () => {
  it('maps level 1 to "1-5"', () => {
    expect(getLevelBracket(1)).toBe('1-5');
  });

  it('maps level 5 to "1-5"', () => {
    expect(getLevelBracket(5)).toBe('1-5');
  });

  it('maps level 6 to "6-10"', () => {
    expect(getLevelBracket(6)).toBe('6-10');
  });

  it('maps level 50 to "46-50"', () => {
    expect(getLevelBracket(50)).toBe('46-50');
  });

  it('maps level 25 to "21-25"', () => {
    expect(getLevelBracket(25)).toBe('21-25');
  });

  it('maps level 26 to "26-30"', () => {
    expect(getLevelBracket(26)).toBe('26-30');
  });
});

describe('getGuildSizeBucket', () => {
  it('maps 1 member to "1"', () => {
    expect(getGuildSizeBucket(1)).toBe('1');
  });

  it('maps 2 members to "2-5"', () => {
    expect(getGuildSizeBucket(2)).toBe('2-5');
  });

  it('maps 5 members to "2-5"', () => {
    expect(getGuildSizeBucket(5)).toBe('2-5');
  });

  it('maps 6 members to "6-10"', () => {
    expect(getGuildSizeBucket(6)).toBe('6-10');
  });

  it('maps 51 members to "51+"', () => {
    expect(getGuildSizeBucket(51)).toBe('51+');
  });
});

describe('getMultiCharBucket', () => {
  it('maps 1 character to "1 personaje"', () => {
    expect(getMultiCharBucket(1)).toBe('1 personaje');
  });

  it('maps 2 characters to "2 personajes"', () => {
    expect(getMultiCharBucket(2)).toBe('2 personajes');
  });

  it('maps 3 characters to "3+ personajes"', () => {
    expect(getMultiCharBucket(3)).toBe('3+ personajes');
  });

  it('maps 10 characters to "3+ personajes"', () => {
    expect(getMultiCharBucket(10)).toBe('3+ personajes');
  });
});

describe('getFishingBracket', () => {
  it('maps score 1 to "1-100"', () => {
    expect(getFishingBracket(1)).toBe('1-100');
  });

  it('maps score 100 to "1-100"', () => {
    expect(getFishingBracket(100)).toBe('1-100');
  });

  it('maps score 101 to "101-500"', () => {
    expect(getFishingBracket(101)).toBe('101-500');
  });

  it('maps score 500 to "101-500"', () => {
    expect(getFishingBracket(500)).toBe('101-500');
  });

  it('maps score 501 to "501-1000"', () => {
    expect(getFishingBracket(501)).toBe('501-1000');
  });

  it('maps score 5001 to "5001+"', () => {
    expect(getFishingBracket(5001)).toBe('5001+');
  });
});

// ── 16.5 renderStatCard() DOM population ────────────────────────────────────
describe('renderStatCard', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="statTest">
        <div class="stat-value"></div>
        <div class="stat-desc"></div>
      </div>
    `;
  });

  it('populates stat-value and stat-desc elements', () => {
    renderStatCard('statTest', '42%', '42 / 100 personajes');
    expect(document.querySelector('.stat-value').textContent).toBe('42%');
    expect(document.querySelector('.stat-desc').textContent).toBe('42 / 100 personajes');
  });

  it('displays "—" for null value', () => {
    renderStatCard('statTest', null, 'some subtitle');
    expect(document.querySelector('.stat-value').textContent).toBe('—');
  });

  it('displays empty string for null subtitle', () => {
    renderStatCard('statTest', '10%', null);
    expect(document.querySelector('.stat-desc').textContent).toBe('');
  });

  it('does nothing for nonexistent container', () => {
    // Should not throw
    renderStatCard('nonexistent', '10%', 'test');
  });
});

// ── 16.6 safeCall() error handling ──────────────────────────────────────────
describe('safeCall', () => {
  it('returns the function result on success', () => {
    expect(safeCall(() => 42)).toBe(42);
  });

  it('returns empty array when function throws', () => {
    expect(safeCall(() => { throw new Error('fail'); })).toEqual([]);
  });

  it('returns the function result for non-throwing functions', () => {
    expect(safeCall(() => ({ key: 'value' }))).toEqual({ key: 'value' });
  });

  it('catches any error type and returns fallback', () => {
    expect(safeCall(() => { throw new TypeError('type error'); })).toEqual([]);
  });
});
