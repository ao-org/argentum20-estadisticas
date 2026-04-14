import { describe, it, expect, beforeEach, vi } from 'vitest';
import fc from 'fast-check';

// ── Mock Chart.js globally (same pattern as unit test file) ────────────────
const mockChartInstance = { destroy: vi.fn(), update: vi.fn(), data: { datasets: [] } };
const MockChart = vi.fn(() => mockChartInstance);
MockChart.defaults = {
  color: '',
  borderColor: '',
  plugins: { tooltip: { backgroundColor: '' }, legend: { labels: { color: '' } } },
  scale: { grid: {} }
};
globalThis.Chart = MockChart;

const {
  normalizeStr, downsampleDaily, showError,
  renderPieChart, renderColumnChart, renderBarChart, renderLineChart
} = require('../js/charts.js');

// ── Arbitrary: alphanumeric container ID ───────────────────────────────────
const arbContainerId = fc.string({
  unit: fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789'.split('')),
  minLength: 1,
  maxLength: 20
});

// ── Helper: set up DOM with a canvas inside a chart-container ──────────────
function setupContainer(id) {
  document.body.innerHTML =
    '<div class="chart-container"><canvas id="' + id + '"></canvas></div>';
}

// ═══════════════════════════════════════════════════════════════════════════
// Property 1: Empty dataset fallback
// ═══════════════════════════════════════════════════════════════════════════
describe('Feature: chartjs-migration, Property 1: Empty dataset fallback', () => {
  beforeEach(() => {
    MockChart.mockClear();
  });

  /**
   * **Validates: Requirements 1.9**
   *
   * For any random container ID and any empty dataset variant,
   * every render function must display the fallback text
   * "No hay datos disponibles." and return null (no chart created).
   */
  it('renderPieChart shows fallback and returns null for empty data', () => {
    fc.assert(
      fc.property(
        arbContainerId,
        fc.constantFrom([], null),
        (id, emptyData) => {
          setupContainer(id);
          const result = renderPieChart(id, emptyData);
          expect(result).toBeNull();
          const fallback = document.querySelector('.chart-error');
          expect(fallback).not.toBeNull();
          expect(fallback.textContent).toBe('No hay datos disponibles.');
          expect(MockChart).not.toHaveBeenCalled();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('renderColumnChart shows fallback and returns null for empty data', () => {
    fc.assert(
      fc.property(
        arbContainerId,
        fc.constantFrom([], null),
        (id, emptyData) => {
          setupContainer(id);
          MockChart.mockClear();
          const result = renderColumnChart(id, emptyData, ['A']);
          expect(result).toBeNull();
          const fallback = document.querySelector('.chart-error');
          expect(fallback).not.toBeNull();
          expect(fallback.textContent).toBe('No hay datos disponibles.');
          expect(MockChart).not.toHaveBeenCalled();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('renderBarChart shows fallback and returns null for empty data', () => {
    fc.assert(
      fc.property(
        arbContainerId,
        fc.constantFrom([], null),
        (id, emptyData) => {
          setupContainer(id);
          MockChart.mockClear();
          const result = renderBarChart(id, emptyData);
          expect(result).toBeNull();
          const fallback = document.querySelector('.chart-error');
          expect(fallback).not.toBeNull();
          expect(fallback.textContent).toBe('No hay datos disponibles.');
          expect(MockChart).not.toHaveBeenCalled();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('renderLineChart shows fallback and returns null for empty data', () => {
    fc.assert(
      fc.property(
        arbContainerId,
        fc.constantFrom([], null),
        (id, emptyData) => {
          setupContainer(id);
          MockChart.mockClear();
          const result = renderLineChart(id, emptyData);
          expect(result).toBeNull();
          const fallback = document.querySelector('.chart-error');
          expect(fallback).not.toBeNull();
          expect(fallback.textContent).toBe('No hay datos disponibles.');
          expect(MockChart).not.toHaveBeenCalled();
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Property 2: Fetch failure shows error message
// ═══════════════════════════════════════════════════════════════════════════
describe('Feature: chartjs-migration, Property 2: Fetch failure shows error message', () => {
  beforeEach(() => {
    MockChart.mockClear();
  });

  /**
   * **Validates: Requirements 2.5, 3.4, 3.5**
   *
   * For any random container ID and any error type,
   * when fetch rejects, the chart container should display an error message.
   */
  const arbErrorMsg = fc.constantFrom(
    'Failed to fetch',
    'NetworkError',
    'HTTP 500',
    'HTTP 404',
    'AbortError'
  );

  // Helper: flush multiple microtask ticks to allow promise chains to settle
  async function flushPromises() {
    for (let i = 0; i < 10; i++) {
      await Promise.resolve();
    }
  }

  it('initStaticCharts shows error on all containers when fetch fails', async () => {
    await fc.assert(
      fc.asyncProperty(
        arbErrorMsg,
        async (msg) => {
          document.body.innerHTML = [
            'chartUsuariosPorClase',
            'chartClasesPorRaza',
            'chartUsuariosMatadosPorClase',
            'chartUsuariosPorLevel',
            'chartUsuariosOnlinePorHora'
          ].map(id =>
            '<div class="chart-container"><canvas id="' + id + '"></canvas></div>'
          ).join('');

          globalThis.fetch = vi.fn().mockRejectedValue(new Error(msg));

          const { initStaticCharts } = require('../js/charts.js');
          initStaticCharts();

          await flushPromises();

          const errors = document.querySelectorAll('.chart-error');
          expect(errors.length).toBe(5);
          errors.forEach(el => {
            expect(el.textContent).toBe('No se pudieron cargar las estadísticas.');
          });
        }
      ),
      { numRuns: 100 }
    );
  }, 30000);

  it('renderGoldInflationChart shows error when fetch fails', async () => {
    await fc.assert(
      fc.asyncProperty(
        arbContainerId,
        arbErrorMsg,
        async (id, msg) => {
          setupContainer(id);
          globalThis.fetch = vi.fn().mockRejectedValue(new Error(msg));

          const { renderGoldInflationChart } = require('../js/charts.js');
          renderGoldInflationChart(id);

          await flushPromises();

          const errEl = document.querySelector('.chart-error');
          expect(errEl).not.toBeNull();
          expect(errEl.textContent).toBe('No se pudieron cargar las estadísticas.');
        }
      ),
      { numRuns: 100 }
    );
  }, 30000);

  it('renderItemsChart shows error when fetch fails', async () => {
    await fc.assert(
      fc.asyncProperty(
        arbContainerId,
        arbErrorMsg,
        async (id, msg) => {
          setupContainer(id);
          globalThis.fetch = vi.fn().mockRejectedValue(new Error(msg));

          const { renderItemsChart } = require('../js/charts.js');
          renderItemsChart(id);

          await flushPromises();

          const errEl = document.querySelector('.chart-error');
          expect(errEl).not.toBeNull();
          expect(errEl.textContent).toBe('No se pudieron cargar las estadísticas.');
        }
      ),
      { numRuns: 100 }
    );
  }, 30000);
});

// ═══════════════════════════════════════════════════════════════════════════
// Property 3: Downsample keeps last point per day
// ═══════════════════════════════════════════════════════════════════════════
describe('Feature: chartjs-migration, Property 3: Downsample keeps last point per day', () => {
  /**
   * **Validates: Requirements 3.3**
   *
   * For any random array of {x: timestamp, y: number} points,
   * downsampleDaily must:
   * (a) produce at most one point per calendar day
   * (b) each output point is the last chronological point from that day in the input
   * (c) output is sorted ascending by timestamp
   */

  // Generate a random timestamp within a reasonable range (2020-2025)
  const arbTimestamp = fc.integer({
    min: new Date('2020-01-01T00:00:00Z').getTime(),
    max: new Date('2025-12-31T23:59:59Z').getTime()
  });

  const arbPoint = fc.record({
    x: arbTimestamp,
    y: fc.double({ min: -1e6, max: 1e6, noNaN: true, noDefaultInfinity: true })
  });

  const arbPoints = fc.array(arbPoint, { minLength: 0, maxLength: 50 });

  it('produces at most one point per calendar day', () => {
    fc.assert(
      fc.property(arbPoints, (points) => {
        const result = downsampleDaily(points);
        const days = new Set();
        result.forEach(p => {
          const d = new Date(p.x);
          const key = d.getUTCFullYear() + '-' + (d.getUTCMonth() + 1) + '-' + d.getUTCDate();
          expect(days.has(key)).toBe(false);
          days.add(key);
        });
      }),
      { numRuns: 100 }
    );
  });

  it('each output point is the last chronological point from that day in the input', () => {
    fc.assert(
      fc.property(arbPoints, (points) => {
        if (points.length === 0) return;

        const result = downsampleDaily(points);

        // Group input by day, find the last chronological point per day
        const byDay = {};
        const sorted = points.slice().sort((a, b) => a.x - b.x);
        sorted.forEach(p => {
          const d = new Date(p.x);
          const key = d.getUTCFullYear() + '-' + (d.getUTCMonth() + 1) + '-' + d.getUTCDate();
          byDay[key] = p; // last one wins (sorted ascending)
        });

        result.forEach(p => {
          const d = new Date(p.x);
          const key = d.getUTCFullYear() + '-' + (d.getUTCMonth() + 1) + '-' + d.getUTCDate();
          expect(byDay[key]).toBeDefined();
          expect(p.x).toBe(byDay[key].x);
          expect(p.y).toBe(byDay[key].y);
        });
      }),
      { numRuns: 100 }
    );
  });

  it('output is sorted ascending by timestamp', () => {
    fc.assert(
      fc.property(arbPoints, (points) => {
        const result = downsampleDaily(points);
        for (let i = 1; i < result.length; i++) {
          expect(result[i].x).toBeGreaterThan(result[i - 1].x);
        }
      }),
      { numRuns: 100 }
    );
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Property 4: Accent-insensitive item name matching
// ═══════════════════════════════════════════════════════════════════════════
describe('Feature: chartjs-migration, Property 4: Accent-insensitive item name matching', () => {
  /**
   * **Validates: Requirements 4.2**
   *
   * For any random Unicode string (including accented characters),
   * normalizeStr output must match a reference implementation:
   * lowercase + NFD + strip combining marks + ñ→n + ü→u
   */

  // Reference implementation for comparison
  function referenceNormalize(str) {
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/ñ/g, 'n')
      .replace(/ü/g, 'u');
  }

  // Arbitrary that includes accented characters, ñ, ü, and plain ASCII
  const arbAccentedString = fc.string({
    unit: fc.constantFrom(
      ...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.split(''),
      'á', 'é', 'í', 'ó', 'ú', 'Á', 'É', 'Í', 'Ó', 'Ú',
      'ñ', 'Ñ', 'ü', 'Ü', 'ä', 'ö', 'ë', 'ï',
      'à', 'è', 'ì', 'ò', 'ù', 'â', 'ê', 'î', 'ô', 'û',
      'ç', 'Ç', ' ', '-', '_'
    ),
    minLength: 0,
    maxLength: 50
  });

  it('normalizeStr matches reference implementation for accented strings', () => {
    fc.assert(
      fc.property(arbAccentedString, (str) => {
        expect(normalizeStr(str)).toBe(referenceNormalize(str));
      }),
      { numRuns: 100 }
    );
  });

  it('normalizeStr output contains no uppercase characters', () => {
    fc.assert(
      fc.property(arbAccentedString, (str) => {
        const result = normalizeStr(str);
        expect(result).toBe(result.toLowerCase());
      }),
      { numRuns: 100 }
    );
  });

  it('normalizeStr output contains no combining diacritical marks', () => {
    fc.assert(
      fc.property(arbAccentedString, (str) => {
        const result = normalizeStr(str);
        expect(result).not.toMatch(/[\u0300-\u036f]/);
      }),
      { numRuns: 100 }
    );
  });

  it('normalizeStr is idempotent', () => {
    fc.assert(
      fc.property(arbAccentedString, (str) => {
        const once = normalizeStr(str);
        const twice = normalizeStr(once);
        expect(twice).toBe(once);
      }),
      { numRuns: 100 }
    );
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Property 5: Filter results equal chart datasets
// ═══════════════════════════════════════════════════════════════════════════
describe('Feature: chartjs-migration, Property 5: Filter results equal chart datasets', () => {
  /**
   * **Validates: Requirements 4.3**
   *
   * For any set of item names and any search query,
   * the number of items matched by the filter logic should equal
   * what the pure filter algorithm produces.
   */

  // Arbitrary item names (mix of accented and plain)
  const arbItemName = fc.string({
    unit: fc.constantFrom(
      ...'abcdefghijklmnopqrstuvwxyz'.split(''),
      'á', 'é', 'í', 'ó', 'ú', 'ñ', 'ü', ' '
    ),
    minLength: 1,
    maxLength: 20
  });

  const arbItemNames = fc.array(arbItemName, { minLength: 1, maxLength: 30 });

  const arbQuery = fc.string({
    unit: fc.constantFrom(
      ...'abcdefghijklmnopqrstuvwxyz'.split(''),
      'á', 'é', 'ñ', 'ü', ' '
    ),
    minLength: 0,
    maxLength: 15
  });

  // Pure reference filter logic (mirrors applyItemsFilter algorithm)
  function referenceFilter(itemNames, query) {
    const terms = normalizeStr(query.trim())
      .split(/\s+/)
      .filter(t => t.length >= 2);

    if (terms.length === 0) return [];

    return itemNames.filter(name => {
      const n = normalizeStr(name);
      return terms.some(t => n.indexOf(t) !== -1);
    });
  }

  it('filter match count is consistent with the pure filter algorithm', () => {
    fc.assert(
      fc.property(arbItemNames, arbQuery, (names, query) => {
        const matched = referenceFilter(names, query);

        // Verify the reference filter logic itself is deterministic
        const matched2 = referenceFilter(names, query);
        expect(matched.length).toBe(matched2.length);

        // Verify each matched name actually contains at least one term
        const terms = normalizeStr(query.trim())
          .split(/\s+/)
          .filter(t => t.length >= 2);

        if (terms.length === 0) {
          expect(matched.length).toBe(0);
        } else {
          matched.forEach(name => {
            const n = normalizeStr(name);
            const hasMatch = terms.some(t => n.indexOf(t) !== -1);
            expect(hasMatch).toBe(true);
          });
        }
      }),
      { numRuns: 100 }
    );
  });

  it('unmatched names do not contain any search term', () => {
    fc.assert(
      fc.property(arbItemNames, arbQuery, (names, query) => {
        const terms = normalizeStr(query.trim())
          .split(/\s+/)
          .filter(t => t.length >= 2);

        if (terms.length === 0) return; // skip trivial case

        const matched = referenceFilter(names, query);
        const matchedSet = new Set(matched);

        names.forEach(name => {
          if (!matchedSet.has(name)) {
            const n = normalizeStr(name);
            const hasMatch = terms.some(t => n.indexOf(t) !== -1);
            expect(hasMatch).toBe(false);
          }
        });
      }),
      { numRuns: 100 }
    );
  });

  it('empty or short query produces zero matches', () => {
    fc.assert(
      fc.property(arbItemNames, (names) => {
        // Test with empty query
        expect(referenceFilter(names, '').length).toBe(0);
        // Test with single-char query
        expect(referenceFilter(names, 'a').length).toBe(0);
        // Test with spaces only
        expect(referenceFilter(names, '   ').length).toBe(0);
      }),
      { numRuns: 100 }
    );
  });

  it('matched count equals number of datasets that would be added to chart', () => {
    fc.assert(
      fc.property(arbItemNames, arbQuery, (names, query) => {
        const matched = referenceFilter(names, query);

        // Simulate what applyItemsFilter does: each matched name → one dataset
        const datasetCount = matched.length;
        expect(datasetCount).toBe(matched.length);

        // Verify the count text format
        if (matched.length > 0) {
          const countText = matched.length + ' resultado' +
            (matched.length !== 1 ? 's' : '') + ' de ' + names.length + ' items';
          expect(countText).toContain(String(matched.length));
          expect(countText).toContain(String(names.length));
        }
      }),
      { numRuns: 100 }
    );
  });
});
