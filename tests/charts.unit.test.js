import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock Chart.js globally before requiring charts.js
const mockChartInstance = { destroy: vi.fn() };
const MockChart = vi.fn(() => mockChartInstance);
MockChart.defaults = {
  color: '',
  borderColor: '',
  plugins: { tooltip: { backgroundColor: '' }, legend: { labels: { color: '' } } },
  scale: { grid: {} }
};
globalThis.Chart = MockChart;

// charts.js uses an IIFE with module.exports for testing
const {
  normalizeStr, downsampleDaily, showLoading, showError, DARK_PALETTE,
  renderPieChart, renderColumnChart, renderBarChart, renderLineChart
} = require('../js/charts.js');

// ── 3.1 Dark theme palette ─────────────────────────────────────────────────
describe('DARK_PALETTE', () => {
  it('contains exactly 10 colours', () => {
    expect(DARK_PALETTE).toHaveLength(10);
  });

  it('every entry is a valid hex colour', () => {
    DARK_PALETTE.forEach((c) => {
      expect(c).toMatch(/^#[0-9a-f]{6}$/i);
    });
  });
});

// ── 3.2 showLoading / showError ─────────────────────────────────────────────
describe('showLoading', () => {
  beforeEach(() => {
    document.body.innerHTML =
      '<div class="chart-container"><canvas id="testChart"></canvas></div>';
  });

  it('inserts a .chart-loading div before the canvas', () => {
    showLoading('testChart');
    const container = document.querySelector('.chart-container');
    const loader = container.querySelector('.chart-loading');
    expect(loader).not.toBeNull();
    expect(loader.textContent).toBe('Cargando...');
    // loader should come before the canvas
    const children = Array.from(container.children);
    expect(children.indexOf(loader)).toBeLessThan(
      children.indexOf(container.querySelector('canvas'))
    );
  });

  it('does nothing when containerId does not exist', () => {
    showLoading('nonexistent');
    expect(document.querySelector('.chart-loading')).toBeNull();
  });
});

describe('showError', () => {
  beforeEach(() => {
    document.body.innerHTML =
      '<div class="chart-container"><div class="chart-loading">Cargando...</div><canvas id="testChart"></canvas></div>';
  });

  it('removes loading div and appends error div', () => {
    showError('testChart', 'Algo salió mal');
    const container = document.querySelector('.chart-container');
    expect(container.querySelector('.chart-loading')).toBeNull();
    const err = container.querySelector('.chart-error');
    expect(err).not.toBeNull();
    expect(err.textContent).toBe('Algo salió mal');
  });

  it('uses default message when msg is omitted', () => {
    showError('testChart');
    const err = document.querySelector('.chart-error');
    expect(err.textContent).toBe('No se pudieron cargar las estadísticas.');
  });

  it('does nothing when containerId does not exist', () => {
    showError('nonexistent', 'err');
    // no error thrown, no element added outside container
  });
});

// ── 3.3 normalizeStr ────────────────────────────────────────────────────────
describe('normalizeStr', () => {
  it('lowercases input', () => {
    expect(normalizeStr('HELLO')).toBe('hello');
  });

  it('strips accents (é → e, á → a)', () => {
    expect(normalizeStr('café')).toBe('cafe');
    expect(normalizeStr('árbol')).toBe('arbol');
  });

  it('replaces ñ with n', () => {
    expect(normalizeStr('leña')).toBe('lena');
    expect(normalizeStr('Ñandú')).toBe('nandu');
  });

  it('replaces ü with u', () => {
    expect(normalizeStr('pingüino')).toBe('pinguino');
  });

  it('handles combined diacriticals', () => {
    expect(normalizeStr('naïve')).toBe('naive');
  });

  it('returns empty string for empty input', () => {
    expect(normalizeStr('')).toBe('');
  });
});

// ── 3.4 downsampleDaily ────────────────────────────────────────────────────
describe('downsampleDaily', () => {
  it('returns empty array for empty input', () => {
    expect(downsampleDaily([])).toEqual([]);
  });

  it('returns empty array for null/undefined', () => {
    expect(downsampleDaily(null)).toEqual([]);
    expect(downsampleDaily(undefined)).toEqual([]);
  });

  it('keeps single point unchanged', () => {
    var pts = [{ x: new Date('2024-01-15T10:00:00Z').getTime(), y: 5 }];
    var result = downsampleDaily(pts);
    expect(result).toHaveLength(1);
    expect(result[0].y).toBe(5);
  });

  it('keeps last chronological point per day', () => {
    var pts = [
      { x: new Date('2024-01-15T08:00:00Z').getTime(), y: 1 },
      { x: new Date('2024-01-15T12:00:00Z').getTime(), y: 2 },
      { x: new Date('2024-01-15T20:00:00Z').getTime(), y: 3 },
      { x: new Date('2024-01-16T06:00:00Z').getTime(), y: 4 },
    ];
    var result = downsampleDaily(pts);
    expect(result).toHaveLength(2);
    expect(result[0].y).toBe(3); // last of Jan 15
    expect(result[1].y).toBe(4); // only of Jan 16
  });

  it('returns results sorted ascending by timestamp', () => {
    var pts = [
      { x: new Date('2024-03-01T10:00:00Z').getTime(), y: 30 },
      { x: new Date('2024-01-01T10:00:00Z').getTime(), y: 10 },
      { x: new Date('2024-02-01T10:00:00Z').getTime(), y: 20 },
    ];
    var result = downsampleDaily(pts);
    for (var i = 1; i < result.length; i++) {
      expect(result[i].x).toBeGreaterThan(result[i - 1].x);
    }
  });

  it('handles unsorted input correctly', () => {
    var pts = [
      { x: new Date('2024-01-15T20:00:00Z').getTime(), y: 3 },
      { x: new Date('2024-01-15T08:00:00Z').getTime(), y: 1 },
      { x: new Date('2024-01-15T12:00:00Z').getTime(), y: 2 },
    ];
    var result = downsampleDaily(pts);
    expect(result).toHaveLength(1);
    expect(result[0].y).toBe(3); // last chronological point
  });
});

// ── 5.1 renderPieChart ──────────────────────────────────────────────────────
describe('renderPieChart', () => {
  beforeEach(() => {
    MockChart.mockClear();
    document.body.innerHTML =
      '<div class="chart-container"><canvas id="pieChart"></canvas></div>';
  });

  it('shows fallback text when data is empty', () => {
    const result = renderPieChart('pieChart', []);
    expect(result).toBeNull();
    const fallback = document.querySelector('.chart-error');
    expect(fallback).not.toBeNull();
    expect(fallback.textContent).toBe('No hay datos disponibles.');
  });

  it('shows fallback text when data is null', () => {
    const result = renderPieChart('pieChart', null);
    expect(result).toBeNull();
    expect(document.querySelector('.chart-error').textContent).toBe('No hay datos disponibles.');
  });

  it('creates a pie chart with correct data', () => {
    const data = [{ name: 'Mago', y: 100 }, { name: 'Guerrero', y: 200 }];
    renderPieChart('pieChart', data);
    expect(MockChart).toHaveBeenCalledTimes(1);
    const [canvas, config] = MockChart.mock.calls[0];
    expect(config.type).toBe('pie');
    expect(config.data.labels).toEqual(['Mago', 'Guerrero']);
    expect(config.data.datasets[0].data).toEqual([100, 200]);
  });

  it('removes loading indicator before rendering', () => {
    document.body.innerHTML =
      '<div class="chart-container"><div class="chart-loading">Cargando...</div><canvas id="pieChart"></canvas></div>';
    renderPieChart('pieChart', [{ name: 'Mago', y: 50 }]);
    expect(document.querySelector('.chart-loading')).toBeNull();
  });

  it('returns null for nonexistent container', () => {
    expect(renderPieChart('nonexistent', [{ name: 'A', y: 1 }])).toBeNull();
  });
});

// ── 5.2 renderColumnChart ───────────────────────────────────────────────────
describe('renderColumnChart', () => {
  beforeEach(() => {
    MockChart.mockClear();
    document.body.innerHTML =
      '<div class="chart-container"><canvas id="colChart"></canvas></div>';
  });

  it('shows fallback text when seriesData is empty', () => {
    const result = renderColumnChart('colChart', [], ['A']);
    expect(result).toBeNull();
    expect(document.querySelector('.chart-error').textContent).toBe('No hay datos disponibles.');
  });

  it('shows fallback text when seriesData is null', () => {
    const result = renderColumnChart('colChart', null, []);
    expect(result).toBeNull();
    expect(document.querySelector('.chart-error').textContent).toBe('No hay datos disponibles.');
  });

  it('creates grouped bar chart with multiple series', () => {
    const series = [
      { name: 'Humano', data: [10, 20] },
      { name: 'Elfo', data: [5, 15] }
    ];
    renderColumnChart('colChart', series, ['Mago', 'Guerrero']);
    expect(MockChart).toHaveBeenCalledTimes(1);
    const config = MockChart.mock.calls[0][1];
    expect(config.type).toBe('bar');
    expect(config.data.labels).toEqual(['Mago', 'Guerrero']);
    expect(config.data.datasets).toHaveLength(2);
    expect(config.data.datasets[0].label).toBe('Humano');
  });

  it('wraps plain number array as single series', () => {
    renderColumnChart('colChart', [1.2, 3.4, 5.6], ['00:00', '01:00', '02:00']);
    const config = MockChart.mock.calls[0][1];
    expect(config.data.datasets).toHaveLength(1);
    expect(config.data.datasets[0].data).toEqual([1.2, 3.4, 5.6]);
  });
});

// ── 5.3 renderBarChart ──────────────────────────────────────────────────────
describe('renderBarChart', () => {
  beforeEach(() => {
    MockChart.mockClear();
    document.body.innerHTML =
      '<div class="chart-container"><canvas id="barChart"></canvas></div>';
  });

  it('shows fallback text when data is empty', () => {
    const result = renderBarChart('barChart', []);
    expect(result).toBeNull();
    expect(document.querySelector('.chart-error').textContent).toBe('No hay datos disponibles.');
  });

  it('creates horizontal bar chart with indexAxis y', () => {
    const data = [{ name: 'Guerrero', y: 3.5 }, { name: 'Mago', y: 1.2 }];
    renderBarChart('barChart', data);
    expect(MockChart).toHaveBeenCalledTimes(1);
    const config = MockChart.mock.calls[0][1];
    expect(config.type).toBe('bar');
    expect(config.options.indexAxis).toBe('y');
    expect(config.data.labels).toEqual(['Guerrero', 'Mago']);
    expect(config.data.datasets[0].data).toEqual([3.5, 1.2]);
  });
});

// ── 5.4 renderLineChart ────────────────────────────────────────────────────
describe('renderLineChart', () => {
  beforeEach(() => {
    MockChart.mockClear();
    document.body.innerHTML =
      '<div class="chart-container"><canvas id="lineChart"></canvas></div>';
  });

  it('shows fallback text when data is empty', () => {
    const result = renderLineChart('lineChart', []);
    expect(result).toBeNull();
    expect(document.querySelector('.chart-error').textContent).toBe('No hay datos disponibles.');
  });

  it('shows fallback text when data is null', () => {
    const result = renderLineChart('lineChart', null);
    expect(result).toBeNull();
    expect(document.querySelector('.chart-error').textContent).toBe('No hay datos disponibles.');
  });

  it('creates line chart with x-axis starting at level 1', () => {
    const data = [0, 5, 12, 8];
    renderLineChart('lineChart', data);
    expect(MockChart).toHaveBeenCalledTimes(1);
    const config = MockChart.mock.calls[0][1];
    expect(config.type).toBe('line');
    expect(config.data.labels).toEqual([1, 2, 3, 4]);
    expect(config.data.datasets[0].data).toEqual([0, 5, 12, 8]);
  });

  it('uses DARK_PALETTE color for the line', () => {
    renderLineChart('lineChart', [1, 2, 3]);
    const config = MockChart.mock.calls[0][1];
    expect(config.data.datasets[0].borderColor).toBe(DARK_PALETTE[0]);
  });
});
