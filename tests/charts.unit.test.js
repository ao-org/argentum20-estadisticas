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
  renderPieChart, renderColumnChart, renderBarChart, renderLineChart,
  toggleItemSelection, selectedItems, MAX_SELECTED,
  bucketValues, topN, guildAlignmentColor, computeKdRatio, computeProgressPercent,
  renderGuildChart, renderFactionChart, renderGlobalQuestProgress, initStaticCharts
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


// ── toggleItemSelection ─────────────────────────────────────────────────────
describe('toggleItemSelection', () => {
  beforeEach(() => {
    selectedItems.clear();
    document.body.innerHTML = `
      <span id="itemsLimitMsg" style="display: none;"></span>
      <div id="itemsResultsList" class="list-group">
        <a class="list-group-item">Leña</a>
        <a class="list-group-item">Mineral de Hierro</a>
      </div>
    `;
  });

  it('adds an item when not selected', () => {
    toggleItemSelection('Leña');
    expect(selectedItems.has('Leña')).toBe(true);
    expect(selectedItems.size).toBe(1);
  });

  it('removes an item when already selected', () => {
    selectedItems.add('Leña');
    toggleItemSelection('Leña');
    expect(selectedItems.has('Leña')).toBe(false);
    expect(selectedItems.size).toBe(0);
  });

  it('rejects selection when 20 items are already selected', () => {
    for (var i = 0; i < 20; i++) {
      selectedItems.add('Item' + i);
    }
    toggleItemSelection('NewItem');
    expect(selectedItems.has('NewItem')).toBe(false);
    expect(selectedItems.size).toBe(20);
  });

  it('shows limit message when trying to exceed 20 items', () => {
    for (var i = 0; i < 20; i++) {
      selectedItems.add('Item' + i);
    }
    toggleItemSelection('NewItem');
    var limitMsg = document.getElementById('itemsLimitMsg');
    expect(limitMsg.style.display).toBe('');
    expect(limitMsg.textContent).toContain('límite máximo');
  });

  it('adds .active class to matching list item when selecting', () => {
    toggleItemSelection('Leña');
    var items = document.querySelectorAll('#itemsResultsList .list-group-item');
    expect(items[0].classList.contains('active')).toBe(true);
    expect(items[1].classList.contains('active')).toBe(false);
  });

  it('removes .active class from matching list item when deselecting', () => {
    selectedItems.add('Leña');
    var listItem = document.querySelector('#itemsResultsList .list-group-item');
    listItem.classList.add('active');
    toggleItemSelection('Leña');
    expect(listItem.classList.contains('active')).toBe(false);
  });
});

// ── 11.1 bucketValues ───────────────────────────────────────────────────────
describe('bucketValues', () => {
  it('produces correct bucket labels', () => {
    const result = bucketValues([50, 150], 100);
    expect(result[0].bucket).toBe('0-99');
    expect(result[1].bucket).toBe('100-199');
  });

  it('counts values per bucket correctly', () => {
    const result = bucketValues([10, 20, 110, 120, 130], 100);
    expect(result).toEqual([
      { bucket: '0-99', count: 2 },
      { bucket: '100-199', count: 3 }
    ]);
  });

  it('returns empty array for empty input', () => {
    expect(bucketValues([], 100)).toEqual([]);
  });

  it('handles a single value', () => {
    const result = bucketValues([250], 100);
    expect(result).toEqual([{ bucket: '200-299', count: 1 }]);
  });

  it('handles values spanning multiple buckets', () => {
    const result = bucketValues([0, 100, 200, 300, 400], 100);
    expect(result).toHaveLength(5);
    expect(result.every(b => b.count === 1)).toBe(true);
  });
});

// ── 11.1 topN ───────────────────────────────────────────────────────────────
describe('topN', () => {
  it('sorts descending by scoreKey', () => {
    const items = [{ name: 'A', score: 10 }, { name: 'B', score: 30 }, { name: 'C', score: 20 }];
    const result = topN(items, 'score', 3);
    expect(result.map(i => i.score)).toEqual([30, 20, 10]);
  });

  it('caps output length to N', () => {
    const items = [{ s: 1 }, { s: 2 }, { s: 3 }, { s: 4 }, { s: 5 }];
    expect(topN(items, 's', 3)).toHaveLength(3);
  });

  it('handles ties (items with same score)', () => {
    const items = [{ s: 5 }, { s: 5 }, { s: 5 }];
    const result = topN(items, 's', 2);
    expect(result).toHaveLength(2);
    expect(result[0].s).toBe(5);
    expect(result[1].s).toBe(5);
  });

  it('returns all items when N is larger than input length', () => {
    const items = [{ s: 10 }, { s: 20 }];
    const result = topN(items, 's', 100);
    expect(result).toHaveLength(2);
    expect(result[0].s).toBe(20);
  });

  it('returns empty array for empty input', () => {
    expect(topN([], 's', 5)).toEqual([]);
  });
});

// ── 11.1 guildAlignmentColor ────────────────────────────────────────────────
describe('guildAlignmentColor', () => {
  it('returns green for alignment 1 (Real)', () => {
    expect(guildAlignmentColor(1)).toBe('#00bc8c');
  });

  it('returns red for alignment 2 (Caos)', () => {
    expect(guildAlignmentColor(2)).toBe('#e74c3c');
  });

  it('returns gray for alignment 0 (Neutral)', () => {
    expect(guildAlignmentColor(0)).toBe('#6c757d');
  });

  it('returns gray for alignment 3 (other)', () => {
    expect(guildAlignmentColor(3)).toBe('#6c757d');
  });

  it('returns gray for null/undefined', () => {
    expect(guildAlignmentColor(null)).toBe('#6c757d');
    expect(guildAlignmentColor(undefined)).toBe('#6c757d');
  });
});

// ── 11.1 computeKdRatio ────────────────────────────────────────────────────
describe('computeKdRatio', () => {
  it('computes normal ratio (kills=10, deaths=5 → 2)', () => {
    expect(computeKdRatio(10, 5)).toBe(2);
  });

  it('returns kills when deaths is 0', () => {
    expect(computeKdRatio(10, 0)).toBe(10);
  });

  it('returns 0 when kills is 0 and deaths > 0', () => {
    expect(computeKdRatio(0, 5)).toBe(0);
  });

  it('returns 0 when both kills and deaths are 0', () => {
    expect(computeKdRatio(0, 0)).toBe(0);
  });
});

// ── 11.1 computeProgressPercent ─────────────────────────────────────────────
describe('computeProgressPercent', () => {
  it('computes normal percentage (50/100 → 50)', () => {
    expect(computeProgressPercent(50, 100)).toBe(50);
  });

  it('caps at 100 when current exceeds threshold', () => {
    expect(computeProgressPercent(150, 100)).toBe(100);
  });

  it('returns 0 when threshold is 0', () => {
    expect(computeProgressPercent(50, 0)).toBe(0);
  });

  it('returns 0 when current is 0', () => {
    expect(computeProgressPercent(0, 100)).toBe(0);
  });

  it('returns 100 when current equals threshold', () => {
    expect(computeProgressPercent(100, 100)).toBe(100);
  });
});

// ── 11.2 renderGuildChart ───────────────────────────────────────────────────
describe('renderGuildChart', () => {
  beforeEach(() => {
    MockChart.mockClear();
    document.body.innerHTML =
      '<div class="chart-container"><canvas id="guildChart"></canvas></div>';
  });

  it('creates horizontal bar chart with indexAxis y', () => {
    const data = [
      { name: 'GuildA', members: 10, level: 3, alignment: 1 },
      { name: 'GuildB', members: 5, level: 2, alignment: 2 }
    ];
    renderGuildChart('guildChart', data);
    expect(MockChart).toHaveBeenCalledTimes(1);
    const config = MockChart.mock.calls[0][1];
    expect(config.type).toBe('bar');
    expect(config.options.indexAxis).toBe('y');
  });

  it('assigns correct alignment colors (Real=#00bc8c, Caos=#e74c3c, Neutral=#6c757d)', () => {
    const data = [
      { name: 'RealGuild', members: 10, level: 5, alignment: 1 },
      { name: 'CaosGuild', members: 8, level: 4, alignment: 2 },
      { name: 'NeutralGuild', members: 6, level: 3, alignment: 0 }
    ];
    renderGuildChart('guildChart', data);
    const config = MockChart.mock.calls[0][1];
    const colors = config.data.datasets[0].backgroundColor;
    expect(colors).toEqual(['#00bc8c', '#e74c3c', '#6c757d']);
  });

  it('shows fallback message for empty data', () => {
    const result = renderGuildChart('guildChart', []);
    expect(result).toBeNull();
    const fallback = document.querySelector('.chart-error');
    expect(fallback).not.toBeNull();
    expect(fallback.textContent).toBe('No hay datos de guilds disponibles.');
  });

  it('returns null for null data', () => {
    const result = renderGuildChart('guildChart', null);
    expect(result).toBeNull();
    expect(document.querySelector('.chart-error').textContent).toBe('No hay datos de guilds disponibles.');
  });

  it('returns null for nonexistent container', () => {
    expect(renderGuildChart('nonexistent', [{ name: 'A', members: 1, level: 1, alignment: 1 }])).toBeNull();
  });

  it('tooltip callback includes guild name, level, and member count', () => {
    const data = [
      { name: 'TestGuild', members: 15, level: 7, alignment: 1 }
    ];
    renderGuildChart('guildChart', data);
    const config = MockChart.mock.calls[0][1];
    const tooltipCb = config.options.plugins.tooltip.callbacks.label;
    // Simulate a Chart.js tooltip context
    const ctx = { dataIndex: 0 };
    const label = tooltipCb(ctx);
    expect(label).toBe('TestGuild - Nivel 7, 15 miembros');
  });
});

// ── 11.3 renderFactionChart ─────────────────────────────────────────────────
describe('renderFactionChart', () => {
  beforeEach(() => {
    MockChart.mockClear();
    document.body.innerHTML =
      '<div class="chart-container"><canvas id="factionChart"></canvas></div>';
  });

  it('creates 2 series (Real, Caos) with 3 categories', () => {
    const data = {
      real: { players: 100, avgScore: 250, totalKills: 5000 },
      caos: { players: 80, avgScore: 300, totalKills: 4500 }
    };
    renderFactionChart('factionChart', data);
    expect(MockChart).toHaveBeenCalledTimes(1);
    const config = MockChart.mock.calls[0][1];
    expect(config.type).toBe('bar');
    expect(config.data.labels).toEqual(['Jugadores', 'Puntaje Promedio', 'Kills Totales']);
    expect(config.data.datasets).toHaveLength(2);
    expect(config.data.datasets[0].label).toBe('Real');
    expect(config.data.datasets[0].data).toEqual([100, 250, 5000]);
    expect(config.data.datasets[1].label).toBe('Caos');
    expect(config.data.datasets[1].data).toEqual([80, 300, 4500]);
  });

  it('uses green (#00bc8c) for Real and red (#e74c3c) for Caos', () => {
    const data = {
      real: { players: 10, avgScore: 50, totalKills: 100 },
      caos: { players: 5, avgScore: 30, totalKills: 60 }
    };
    renderFactionChart('factionChart', data);
    const config = MockChart.mock.calls[0][1];
    expect(config.data.datasets[0].backgroundColor).toBe('#00bc8c');
    expect(config.data.datasets[1].backgroundColor).toBe('#e74c3c');
  });

  it('shows fallback message for null data', () => {
    const result = renderFactionChart('factionChart', null);
    expect(result).toBeNull();
    const fallback = document.querySelector('.chart-error');
    expect(fallback).not.toBeNull();
    expect(fallback.textContent).toBe('No hay datos de facciones disponibles.');
  });

  it('shows fallback message when both real and caos are missing', () => {
    const result = renderFactionChart('factionChart', {});
    expect(result).toBeNull();
    expect(document.querySelector('.chart-error').textContent).toBe('No hay datos de facciones disponibles.');
  });

  it('handles missing caos data gracefully (defaults to zeros)', () => {
    const data = { real: { players: 50, avgScore: 200, totalKills: 3000 } };
    renderFactionChart('factionChart', data);
    const config = MockChart.mock.calls[0][1];
    expect(config.data.datasets[1].data).toEqual([0, 0, 0]);
  });

  it('returns null for nonexistent container', () => {
    expect(renderFactionChart('nonexistent', { real: { players: 1, avgScore: 1, totalKills: 1 } })).toBeNull();
  });
});

// ── 11.4 renderGlobalQuestProgress ──────────────────────────────────────────
describe('renderGlobalQuestProgress', () => {
  beforeEach(() => {
    document.body.innerHTML =
      '<div id="parentDiv"><div id="testProgress"></div></div>';
  });

  it('generates HTML progress bars with correct percentages', () => {
    const data = [
      { name: 'Quest A', current: 50, threshold: 100 },
      { name: 'Quest B', current: 75, threshold: 200 }
    ];
    renderGlobalQuestProgress('testProgress', data);
    const bars = document.querySelectorAll('.progress-bar');
    expect(bars).toHaveLength(2);
    expect(bars[0].textContent).toBe('50%');
    expect(bars[0].style.width).toBe('50%');
    expect(bars[1].textContent).toBe('38%'); // Math.round(75/200*100) = 38
    expect(bars[1].style.width).toBe('38%');
  });

  it('shows quest names as labels', () => {
    const data = [{ name: 'Dragon Hunt', current: 10, threshold: 100 }];
    renderGlobalQuestProgress('testProgress', data);
    const label = document.querySelector('.mb-1');
    expect(label.textContent).toBe('Dragon Hunt');
  });

  it('shows fallback message for empty data', () => {
    const result = renderGlobalQuestProgress('testProgress', []);
    expect(result).toBeNull();
    const fallback = document.querySelector('.chart-error');
    expect(fallback).not.toBeNull();
    expect(fallback.textContent).toBe('No hay eventos globales activos.');
  });

  it('shows fallback message for null data', () => {
    const result = renderGlobalQuestProgress('testProgress', null);
    expect(result).toBeNull();
    expect(document.querySelector('.chart-error').textContent).toBe('No hay eventos globales activos.');
  });

  it('caps percentage at 100% when current exceeds threshold', () => {
    const data = [{ name: 'Overflow Quest', current: 200, threshold: 100 }];
    renderGlobalQuestProgress('testProgress', data);
    const bar = document.querySelector('.progress-bar');
    expect(bar.textContent).toBe('100%');
    expect(bar.style.width).toBe('100%');
    expect(bar.getAttribute('aria-valuenow')).toBe('100');
  });

  it('sets correct ARIA attributes on progress bars', () => {
    const data = [{ name: 'Test', current: 30, threshold: 100 }];
    renderGlobalQuestProgress('testProgress', data);
    const bar = document.querySelector('.progress-bar');
    expect(bar.getAttribute('role')).toBe('progressbar');
    expect(bar.getAttribute('aria-valuenow')).toBe('30');
    expect(bar.getAttribute('aria-valuemin')).toBe('0');
    expect(bar.getAttribute('aria-valuemax')).toBe('100');
  });

  it('returns null for nonexistent container', () => {
    expect(renderGlobalQuestProgress('nonexistent', [{ name: 'A', current: 1, threshold: 10 }])).toBeNull();
  });
});

// ── 11.5 initStaticCharts wiring — fallback messages for empty API data ─────
describe('initStaticCharts — empty API fallback', () => {
  beforeEach(() => {
    MockChart.mockClear();

    // Build DOM with all required canvas/div elements
    document.body.innerHTML = `
      <div class="chart-container"><canvas id="chartUsuariosPorClase"></canvas></div>
      <div class="chart-container"><canvas id="chartClasesPorRaza"></canvas></div>
      <div class="chart-container"><canvas id="chartUsuariosMatadosPorClase"></canvas></div>
      <div class="chart-container"><canvas id="chartUsuariosPorLevel"></canvas></div>
      <div class="chart-container"><canvas id="chartUsuariosOnlinePorHora"></canvas></div>
      <div class="chart-container"><canvas id="chartEloDistribution"></canvas></div>
      <div class="chart-container"><canvas id="chartTopGuilds"></canvas></div>
      <div class="chart-container"><canvas id="chartGoldByLevel"></canvas></div>
      <div class="chart-container"><canvas id="chartKdRatio"></canvas></div>
      <div class="chart-container"><canvas id="chartFactionSummary"></canvas></div>
      <div class="chart-container"><canvas id="chartFishingLeaderboard"></canvas></div>
      <div class="chart-container"><canvas id="chartQuestCompletion"></canvas></div>
      <div class="chart-container"><canvas id="chartGenderDistribution"></canvas></div>
      <div id="chartGlobalQuestProgress"></div>
      <div class="chart-container"><canvas id="chartTopNpcHunters"></canvas></div>
    `;

    // Mock fetch to return empty data for all datasets
    globalThis.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          usuariosPorClase: [],
          clasesPorRaza: [],
          killsPorClase: [],
          usuariosPorLevel: [],
          onlinePorHora: [],
          eloDistribution: [],
          topGuilds: [],
          goldByLevelRange: [],
          kdRatioByClass: [],
          factionSummary: null,
          fishingLeaderboard: [],
          questCompletion: [],
          genderDistribution: [],
          globalQuestProgress: [],
          topNpcHunters: []
        })
      })
    );
  });

  it('shows fallback messages for all 10 new charts when API returns empty data', async () => {
    initStaticCharts();

    // Wait for fetch promise chain to resolve
    await vi.waitFor(() => {
      const errors = document.querySelectorAll('.chart-error');
      // We expect fallback messages for all charts (existing + new)
      expect(errors.length).toBeGreaterThanOrEqual(10);
    });

    // Verify specific fallback messages for the 10 new charts
    const eloContainer = document.getElementById('chartEloDistribution').parentNode;
    expect(eloContainer.querySelector('.chart-error').textContent).toBe('No hay datos de PvP disponibles.');

    const guildContainer = document.getElementById('chartTopGuilds').parentNode;
    expect(guildContainer.querySelector('.chart-error').textContent).toBe('No hay datos de guilds disponibles.');

    const goldContainer = document.getElementById('chartGoldByLevel').parentNode;
    expect(goldContainer.querySelector('.chart-error').textContent).toBe('No hay datos disponibles.');

    const kdContainer = document.getElementById('chartKdRatio').parentNode;
    expect(kdContainer.querySelector('.chart-error').textContent).toBe('No hay datos disponibles.');

    const factionContainer = document.getElementById('chartFactionSummary').parentNode;
    expect(factionContainer.querySelector('.chart-error').textContent).toBe('No hay datos de facciones disponibles.');

    const fishContainer = document.getElementById('chartFishingLeaderboard').parentNode;
    expect(fishContainer.querySelector('.chart-error').textContent).toBe('No hay datos de pesca disponibles.');

    const questContainer = document.getElementById('chartQuestCompletion').parentNode;
    expect(questContainer.querySelector('.chart-error').textContent).toBe('No hay datos de quests disponibles.');

    const genderContainer = document.getElementById('chartGenderDistribution').parentNode;
    expect(genderContainer.querySelector('.chart-error').textContent).toBe('No hay datos disponibles.');

    const gqContainer = document.getElementById('chartGlobalQuestProgress');
    expect(gqContainer.querySelector('.chart-error').textContent).toBe('No hay eventos globales activos.');

    const npcContainer = document.getElementById('chartTopNpcHunters').parentNode;
    expect(npcContainer.querySelector('.chart-error').textContent).toBe('No hay datos de NPCs cazados disponibles.');
  });
});
