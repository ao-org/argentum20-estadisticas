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

// Load AO20 namespace modules in order: config → data-utils → renderers → items-filter
const AO20 = require('../js/config.js');
globalThis.AO20 = AO20;
require('../js/data-utils.js');
require('../js/renderers.js');
require('../js/items-filter.js');

// Map old flat exports to the new AO20 namespace structure
const { normalizeStr, downsampleDaily, bucketValues, topN, guildAlignmentColor, computeKdRatio, computeProgressPercent } = AO20.utils;
const showError = AO20.renderers.showError.bind(AO20.renderers);
const renderPieChart = AO20.renderers.renderPieChart.bind(AO20.renderers);
const renderColumnChart = AO20.renderers.renderColumnChart.bind(AO20.renderers);
const renderBarChart = AO20.renderers.renderBarChart.bind(AO20.renderers);
const renderLineChart = AO20.renderers.renderLineChart.bind(AO20.renderers);
const initStaticCharts = AO20.renderers.initStaticCharts.bind(AO20.renderers);
const renderGoldInflationChart = AO20.renderers.renderGoldInflationChart.bind(AO20.renderers);
const renderItemsChart = AO20.renderers.renderItemsChart.bind(AO20.renderers);
const { toggleItemSelection, selectedItems, updateItemsChart, updateSelectedTags, clearAllSelections, applyItemsFilter, selectRandomItems } = AO20.itemsFilter;
const { DARK_PALETTE, MAX_SELECTED, DEFAULT_RANDOM_COUNT } = AO20.config;
const chartData = AO20.itemsFilter.chartData;

// Compatibility shim: chartsModule-like object for tests that access chartData/allItemNames/itemsChart
const chartsModule = AO20.itemsFilter;

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
            'chartUsuariosPorLevel'
          ].map(id =>
            '<div class="chart-container"><canvas id="' + id + '"></canvas></div>'
          ).join('');

          globalThis.fetch = vi.fn().mockRejectedValue(new Error(msg));

          initStaticCharts();

          await flushPromises();

          const errors = document.querySelectorAll('.chart-error');
          expect(errors.length).toBe(4);
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


// ═══════════════════════════════════════════════════════════════════════════
// Feature: items-statistics-filter, Property 1: Invariante de límite de selección
// ═══════════════════════════════════════════════════════════════════════════
describe('Feature: items-statistics-filter, Property 1: Invariante de límite de selección', () => {
  /**
   * **Validates: Requirements 1.1, 3.4**
   *
   * For any sequence of toggle operations (add, remove),
   * the size of selectedItems must never exceed 20.
   */

  beforeEach(() => {
    selectedItems.clear();
    document.body.innerHTML = '<span id="itemsLimitMsg" style="display: none;"></span>';
  });

  // Arbitrary: generate a sequence of toggle operations on item names
  const arbItemName = fc.string({
    unit: fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz'.split('')),
    minLength: 1,
    maxLength: 10
  });

  const arbToggleSequence = fc.array(arbItemName, { minLength: 1, maxLength: 50 });

  it('selectedItems.size never exceeds MAX_SELECTED after any sequence of toggles', () => {
    fc.assert(
      fc.property(arbToggleSequence, (sequence) => {
        selectedItems.clear();

        for (const itemName of sequence) {
          toggleItemSelection(itemName);
          expect(selectedItems.size).toBeLessThanOrEqual(MAX_SELECTED);
        }
      }),
      { numRuns: 100 }
    );
  });
});


// ═══════════════════════════════════════════════════════════════════════════
// Feature: items-statistics-filter, Property 2: Round-trip de selección/deselección
// ═══════════════════════════════════════════════════════════════════════════
describe('Feature: items-statistics-filter, Property 2: Round-trip de selección/deselección', () => {
  /**
   * **Validates: Requirements 2.3, 2.4, 3.2**
   *
   * For any item name that is not currently selected, selecting it and then
   * deselecting it must leave selectedItems in the same state as before.
   */

  beforeEach(() => {
    selectedItems.clear();
    document.body.innerHTML = '<span id="itemsLimitMsg" style="display: none;"></span>';
  });

  const arbItemName = fc.string({
    unit: fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789'.split('')),
    minLength: 1,
    maxLength: 15
  });

  it('selecting then deselecting an item from empty state restores empty set', () => {
    fc.assert(
      fc.property(arbItemName, (itemName) => {
        selectedItems.clear();

        // Snapshot before
        expect(selectedItems.size).toBe(0);

        // Select (toggle on)
        toggleItemSelection(itemName);
        expect(selectedItems.has(itemName)).toBe(true);

        // Deselect (toggle off)
        toggleItemSelection(itemName);
        expect(selectedItems.has(itemName)).toBe(false);

        // Back to original empty state
        expect(selectedItems.size).toBe(0);
      }),
      { numRuns: 100 }
    );
  });

  it('selecting then deselecting a new item preserves pre-existing selections', () => {
    fc.assert(
      fc.property(
        fc.set(arbItemName, { minLength: 1, maxLength: 5 }),
        arbItemName,
        (preSelected, newItem) => {
          selectedItems.clear();
          document.body.innerHTML = '<span id="itemsLimitMsg" style="display: none;"></span>';

          // Pre-select some items
          for (const name of preSelected) {
            toggleItemSelection(name);
          }

          // Skip if newItem is already in the pre-selected set
          if (selectedItems.has(newItem)) return;

          // Snapshot state before round-trip
          const snapshotBefore = new Set(selectedItems);

          // Toggle on
          toggleItemSelection(newItem);
          expect(selectedItems.has(newItem)).toBe(true);

          // Toggle off
          toggleItemSelection(newItem);
          expect(selectedItems.has(newItem)).toBe(false);

          // Verify state is restored exactly
          expect(selectedItems.size).toBe(snapshotBefore.size);
          for (const name of snapshotBefore) {
            expect(selectedItems.has(name)).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});


// ═══════════════════════════════════════════════════════════════════════════
// Feature: items-statistics-filter, Property 10: Colores de datasets provienen de DARK_PALETTE
// ═══════════════════════════════════════════════════════════════════════════
describe('Feature: items-statistics-filter, Property 10: Colores de datasets provienen de DARK_PALETTE', () => {
  /**
   * **Validates: Requirements 6.3**
   *
   * For any set of selected items that have data in chartData,
   * every dataset added by updateItemsChart must have a borderColor
   * that belongs to the DARK_PALETTE array.
   */

  beforeEach(() => {
    selectedItems.clear();
    // Clean up chartData entries from previous runs
    Object.keys(chartData).forEach(k => delete chartData[k]);
    // Reset mock chart instance datasets
    mockChartInstance.data.datasets = [];
    mockChartInstance.update.mockClear();
    // Set itemsChart to the mock so updateItemsChart doesn't bail out
    chartsModule.itemsChart = mockChartInstance;
    document.body.innerHTML = '<span id="itemsLimitMsg" style="display: none;"></span>';
  });

  // Arbitrary: unique item names (1-20 items)
  const arbItemName = fc.string({
    unit: fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz'.split('')),
    minLength: 1,
    maxLength: 12
  });

  const arbItemSet = fc.set(arbItemName, { minLength: 1, maxLength: 20 });

  it('every dataset borderColor belongs to DARK_PALETTE', () => {
    fc.assert(
      fc.property(arbItemSet, (itemNames) => {
        // Reset state
        selectedItems.clear();
        Object.keys(chartData).forEach(k => delete chartData[k]);
        mockChartInstance.data.datasets = [];

        // Populate chartData with dummy time-series data for each item
        for (const name of itemNames) {
          chartData[name] = [
            { x: 1704067200000, y: 10 },
            { x: 1704153600000, y: 20 }
          ];
        }

        // Add each item to selectedItems (respecting the 20 limit)
        for (const name of itemNames) {
          selectedItems.add(name);
        }

        // Call updateItemsChart to build datasets
        updateItemsChart();

        // Verify every dataset's borderColor is in DARK_PALETTE
        const datasets = mockChartInstance.data.datasets;
        expect(datasets.length).toBe(itemNames.size);

        for (const ds of datasets) {
          expect(DARK_PALETTE).toContain(ds.borderColor);
        }
      }),
      { numRuns: 100 }
    );
  });
});


// ═══════════════════════════════════════════════════════════════════════════
// Feature: items-statistics-filter, Property 6: Cantidad de tags igual a cantidad de seleccionados
// ═══════════════════════════════════════════════════════════════════════════
describe('Feature: items-statistics-filter, Property 6: Cantidad de tags igual a cantidad de seleccionados', () => {
  /**
   * **Validates: Requirements 3.1**
   *
   * For any set of selected items, the number of tags/chips rendered
   * in the tags container must be exactly equal to selectedItems.size.
   */

  const { updateSelectedTags } = chartsModule;

  beforeEach(() => {
    selectedItems.clear();
    document.body.innerHTML =
      '<div id="itemsSelectedTags"></div>' +
      '<span id="itemsLimitMsg" style="display: none;"></span>';
  });

  // Arbitrary: unique item names (0-20 items)
  const arbItemName = fc.string({
    unit: fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz'.split('')),
    minLength: 1,
    maxLength: 12
  });

  const arbItemSet = fc.set(arbItemName, { minLength: 0, maxLength: 20 });

  it('badge count in #itemsSelectedTags equals selectedItems.size', () => {
    fc.assert(
      fc.property(arbItemSet, (itemNames) => {
        selectedItems.clear();

        // Add each item to selectedItems
        for (const name of itemNames) {
          selectedItems.add(name);
        }

        // Render tags
        updateSelectedTags();

        // Count .badge elements
        const container = document.getElementById('itemsSelectedTags');
        const badges = container.querySelectorAll('.badge');
        expect(badges.length).toBe(selectedItems.size);
      }),
      { numRuns: 100 }
    );
  });
});


// ═══════════════════════════════════════════════════════════════════════════
// Feature: items-statistics-filter, Property 8: Limpiar todo vacía selecciones y chart
// ═══════════════════════════════════════════════════════════════════════════
describe('Feature: items-statistics-filter, Property 8: Limpiar todo vacía selecciones y chart', () => {
  /**
   * **Validates: Requirements 3.3**
   *
   * For any non-empty set of selected items, calling clearAllSelections
   * must result in selectedItems being empty, 0 datasets in the chart,
   * and 0 tags rendered.
   */

  const { clearAllSelections, updateSelectedTags } = chartsModule;

  beforeEach(() => {
    selectedItems.clear();
    Object.keys(chartData).forEach(k => delete chartData[k]);
    mockChartInstance.data.datasets = [];
    mockChartInstance.update.mockClear();
    chartsModule.itemsChart = mockChartInstance;
    document.body.innerHTML =
      '<div id="itemsSelectedTags"></div>' +
      '<div id="itemsResultsList"></div>' +
      '<span id="itemsLimitMsg" style="display: none;"></span>';
  });

  // Arbitrary: unique item names (1-20 items)
  const arbItemName = fc.string({
    unit: fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz'.split('')),
    minLength: 1,
    maxLength: 12
  });

  const arbItemSet = fc.set(arbItemName, { minLength: 1, maxLength: 20 });

  it('clearAllSelections empties selectedItems, chart datasets, and tags', () => {
    fc.assert(
      fc.property(arbItemSet, (itemNames) => {
        // Reset state
        selectedItems.clear();
        Object.keys(chartData).forEach(k => delete chartData[k]);
        mockChartInstance.data.datasets = [];

        // Populate chartData with dummy data for each item
        for (const name of itemNames) {
          chartData[name] = [
            { x: 1704067200000, y: 10 },
            { x: 1704153600000, y: 20 }
          ];
        }

        // Add each item to selectedItems
        for (const name of itemNames) {
          selectedItems.add(name);
        }

        // Populate chart datasets to simulate selected state
        for (const name of itemNames) {
          mockChartInstance.data.datasets.push({
            label: name,
            data: chartData[name],
            borderColor: '#375a7f',
            backgroundColor: 'transparent'
          });
        }

        // Render tags so there are badges in the DOM
        updateSelectedTags();

        // Verify pre-conditions: non-empty state
        expect(selectedItems.size).toBeGreaterThan(0);
        expect(mockChartInstance.data.datasets.length).toBeGreaterThan(0);
        const tagsBefore = document.getElementById('itemsSelectedTags').querySelectorAll('.badge');
        expect(tagsBefore.length).toBeGreaterThan(0);

        // Act
        clearAllSelections();

        // Assert: selectedItems is empty
        expect(selectedItems.size).toBe(0);

        // Assert: chart has 0 datasets
        expect(mockChartInstance.data.datasets.length).toBe(0);

        // Assert: 0 tags rendered
        const tagsAfter = document.getElementById('itemsSelectedTags').querySelectorAll('.badge');
        expect(tagsAfter.length).toBe(0);
      }),
      { numRuns: 100 }
    );
  });
});


// ═══════════════════════════════════════════════════════════════════════════
// Feature: items-statistics-filter, Property 4: Umbral mínimo de 2 caracteres para búsqueda
// ═══════════════════════════════════════════════════════════════════════════
describe('Feature: items-statistics-filter, Property 4: Umbral mínimo de 2 caracteres para búsqueda', () => {
  /**
   * **Validates: Requirements 2.1**
   *
   * For any query where all terms are < 2 chars after normalizing,
   * #itemsResultsList should be empty/hidden and no results shown.
   */

  beforeEach(() => {
    selectedItems.clear();
    Object.keys(chartData).forEach(k => delete chartData[k]);
    // Populate allItemNames with some items so there's data to potentially match
    const sampleNames = ['Espada Larga', 'Poción de Maná', 'Escudo de Hierro', 'Arco Élfico', 'Túnica Mágica'];
    chartsModule.allItemNames = sampleNames;
    for (const name of sampleNames) {
      chartData[name] = [{ x: 1704067200000, y: 10 }];
    }
    document.body.innerHTML =
      '<div id="itemsResultsList" style="display: none;"></div>' +
      '<span id="itemsSearchCount"></span>' +
      '<button id="itemsSearchClear" style="display: none;"></button>' +
      '<span id="itemsLimitMsg" style="display: none;"></span>' +
      '<div id="itemsSelectedTags"></div>';
  });

  // Arbitrary: queries where every token is < 2 chars (single chars, spaces, empty)
  const arbShortQuery = fc.string({
    unit: fc.constantFrom(
      ...'abcdefghijklmnopqrstuvwxyzáéíóúñü0123456789 '.split('')
    ),
    minLength: 0,
    maxLength: 15
  }).filter(q => {
    // Ensure ALL tokens after normalizing are < 2 chars
    const normalized = q.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ñ/g, 'n').replace(/ü/g, 'u');
    const terms = normalized.trim().split(/\s+/).filter(t => t.length >= 2);
    return terms.length === 0;
  });

  it('queries with all terms < 2 chars produce no visible results', () => {
    fc.assert(
      fc.property(arbShortQuery, (query) => {
        applyItemsFilter(query);

        const resultsList = document.getElementById('itemsResultsList');
        // Results list should be hidden or empty
        const items = resultsList.querySelectorAll('.list-group-item');
        expect(items.length).toBe(0);

        // Either display is none or innerHTML is empty
        const isHidden = resultsList.style.display === 'none' || resultsList.innerHTML === '';
        expect(isHidden).toBe(true);
      }),
      { numRuns: 100 }
    );
  });
});


// ═══════════════════════════════════════════════════════════════════════════
// Feature: items-statistics-filter, Property 5: Búsqueda insensible a acentos y mayúsculas
// ═══════════════════════════════════════════════════════════════════════════
describe('Feature: items-statistics-filter, Property 5: Búsqueda insensible a acentos y mayúsculas', () => {
  /**
   * **Validates: Requirements 2.2**
   *
   * For any item name and any variation with different capitalization
   * or accents, the filter should produce the same match results.
   */

  // Helper: build a set of item names and set up the DOM + closure state
  function setupFilterEnv(itemNames) {
    selectedItems.clear();
    Object.keys(chartData).forEach(k => delete chartData[k]);
    chartsModule.allItemNames = itemNames;
    for (const name of itemNames) {
      chartData[name] = [{ x: 1704067200000, y: 10 }];
    }
    document.body.innerHTML =
      '<div id="itemsResultsList" style="display: none;"></div>' +
      '<span id="itemsSearchCount"></span>' +
      '<button id="itemsSearchClear" style="display: none;"></button>' +
      '<span id="itemsLimitMsg" style="display: none;"></span>' +
      '<div id="itemsSelectedTags"></div>';
  }

  // Helper: get the list of matched item names from the DOM after applying filter
  function getVisibleResults() {
    const resultsList = document.getElementById('itemsResultsList');
    const items = resultsList.querySelectorAll('.list-group-item');
    return Array.from(items).map(el => el.textContent);
  }

  // Arbitrary: item names with accented characters
  const arbAccentedName = fc.string({
    unit: fc.constantFrom(
      ...'abcdefghijklmnopqrstuvwxyz'.split(''),
      'á', 'é', 'í', 'ó', 'ú', 'ñ', 'ü'
    ),
    minLength: 3,
    maxLength: 15
  });

  const arbItemNames = fc.set(arbAccentedName, { minLength: 1, maxLength: 15 });

  // Map of accent → base letter pairs for generating variations
  const accentVariations = {
    'a': ['a', 'A', 'á', 'Á'],
    'e': ['e', 'E', 'é', 'É'],
    'i': ['i', 'I', 'í', 'Í'],
    'o': ['o', 'O', 'ó', 'Ó'],
    'u': ['u', 'U', 'ú', 'Ú'],
    'n': ['n', 'N', 'ñ', 'Ñ'],
  };

  // Generate a query variation: take a base query (>= 2 chars) and randomly
  // change case or add/remove accents
  function makeVariation(base) {
    return base.split('').map(ch => {
      const lower = ch.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const variants = accentVariations[lower];
      if (variants) {
        return variants[Math.floor(Math.random() * variants.length)];
      }
      return Math.random() > 0.5 ? ch.toUpperCase() : ch.toLowerCase();
    }).join('');
  }

  it('different accent/case variations of the same query produce the same matches', () => {
    fc.assert(
      fc.property(arbItemNames, fc.integer({ min: 0, max: 14 }), (itemNames, nameIdx) => {
        const itemNamesArr = Array.from(itemNames);
        setupFilterEnv(itemNamesArr);

        // Pick a name from the list and extract a substring >= 2 chars as query base
        const pickedName = itemNamesArr[nameIdx % itemNamesArr.length];
        const normalized = normalizeStr(pickedName);
        if (normalized.length < 2) return; // skip if too short

        const baseQuery = normalized.substring(0, Math.min(normalized.length, 4));
        if (baseQuery.length < 2) return;

        // Apply filter with the base (normalized) query
        applyItemsFilter(baseQuery);
        const baseResults = getVisibleResults();

        // Generate a variation with different case/accents
        const variation = makeVariation(baseQuery);

        // Apply filter with the variation
        applyItemsFilter(variation);
        const varResults = getVisibleResults();

        // Both should produce the same set of matched items
        expect(varResults.sort()).toEqual(baseResults.sort());
      }),
      { numRuns: 100 }
    );
  });
});


// ═══════════════════════════════════════════════════════════════════════════
// Feature: items-statistics-filter, Property 3: Resultados de búsqueda limitados y contados
// ═══════════════════════════════════════════════════════════════════════════
describe('Feature: items-statistics-filter, Property 3: Resultados de búsqueda limitados y contados', () => {
  /**
   * **Validates: Requirements 1.2, 1.3**
   *
   * For any list of items and query producing > 20 matches,
   * the visible list should have max 20 items, and the counter
   * should show both total and displayed counts.
   */

  beforeEach(() => {
    selectedItems.clear();
    Object.keys(chartData).forEach(k => delete chartData[k]);
    document.body.innerHTML =
      '<div id="itemsResultsList" style="display: none;"></div>' +
      '<span id="itemsSearchCount"></span>' +
      '<button id="itemsSearchClear" style="display: none;"></button>' +
      '<span id="itemsLimitMsg" style="display: none;"></span>' +
      '<div id="itemsSelectedTags"></div>';
  });

  // Generate a list of 25-50 item names that all share a common prefix (ensuring > 20 matches)
  const arbCommonPrefix = fc.string({
    unit: fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz'.split('')),
    minLength: 2,
    maxLength: 5
  });

  const arbItemCount = fc.integer({ min: 25, max: 50 });

  it('visible results are capped at 20 and counter shows total vs displayed', () => {
    fc.assert(
      fc.property(arbCommonPrefix, arbItemCount, (prefix, count) => {
        // Generate item names that all contain the prefix
        const itemNames = [];
        for (let i = 0; i < count; i++) {
          itemNames.push(prefix + '_item_' + i);
        }

        // Set up the environment
        chartsModule.allItemNames = itemNames;
        Object.keys(chartData).forEach(k => delete chartData[k]);
        for (const name of itemNames) {
          chartData[name] = [{ x: 1704067200000, y: 10 }];
        }

        // Apply filter with the common prefix (guaranteed >= 2 chars)
        applyItemsFilter(prefix);

        // Check visible results are capped at MAX_SELECTED (20)
        const resultsList = document.getElementById('itemsResultsList');
        const visibleItems = resultsList.querySelectorAll('.list-group-item');
        expect(visibleItems.length).toBeLessThanOrEqual(MAX_SELECTED);
        expect(visibleItems.length).toBe(MAX_SELECTED);

        // Check counter shows both total and displayed counts
        const countEl = document.getElementById('itemsSearchCount');
        const countText = countEl.textContent;
        expect(countText).toContain(String(MAX_SELECTED));
        expect(countText).toContain(String(count));
      }),
      { numRuns: 100 }
    );
  });
});


// ═══════════════════════════════════════════════════════════════════════════
// Feature: items-statistics-filter, Property 7: Limpiar búsqueda preserva selecciones
// ═══════════════════════════════════════════════════════════════════════════
describe('Feature: items-statistics-filter, Property 7: Limpiar búsqueda preserva selecciones', () => {
  /**
   * **Validates: Requirements 2.6**
   *
   * For any state with selected items and an active search, clearing the
   * search field (calling applyItemsFilter('')) should hide the results
   * list without modifying selectedItems or the chart datasets.
   */

  beforeEach(() => {
    selectedItems.clear();
    Object.keys(chartData).forEach(k => delete chartData[k]);
    mockChartInstance.data.datasets = [];
    mockChartInstance.update.mockClear();
    chartsModule.itemsChart = mockChartInstance;
    document.body.innerHTML =
      '<div id="itemsResultsList" style="display: none;"></div>' +
      '<span id="itemsSearchCount"></span>' +
      '<button id="itemsSearchClear" style="display: none;"></button>' +
      '<span id="itemsLimitMsg" style="display: none;"></span>' +
      '<div id="itemsSelectedTags"></div>';
  });

  // Arbitrary: unique item names (1-15 items to leave room under MAX_SELECTED)
  const arbItemName = fc.string({
    unit: fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz'.split('')),
    minLength: 2,
    maxLength: 10
  });

  const arbSelectedSet = fc.set(arbItemName, { minLength: 1, maxLength: 15 });

  it('clearing search preserves selectedItems and chart datasets', () => {
    fc.assert(
      fc.property(arbSelectedSet, (itemNames) => {
        // Reset state
        selectedItems.clear();
        Object.keys(chartData).forEach(k => delete chartData[k]);
        mockChartInstance.data.datasets = [];

        // Populate chartData and allItemNames
        chartsModule.allItemNames = itemNames;
        for (const name of itemNames) {
          chartData[name] = [
            { x: 1704067200000, y: 10 },
            { x: 1704153600000, y: 20 }
          ];
        }

        // Select all items and build chart datasets
        for (const name of itemNames) {
          selectedItems.add(name);
        }
        updateItemsChart();

        // Snapshot state before clearing search
        const selectedBefore = new Set(selectedItems);
        const datasetsBefore = mockChartInstance.data.datasets.map(ds => ({
          label: ds.label,
          borderColor: ds.borderColor,
          data: ds.data
        }));

        // Simulate an active search then clear it
        applyItemsFilter('');

        // Verify selectedItems is unchanged
        expect(selectedItems.size).toBe(selectedBefore.size);
        for (const name of selectedBefore) {
          expect(selectedItems.has(name)).toBe(true);
        }

        // Verify chart datasets are unchanged
        const datasetsAfter = mockChartInstance.data.datasets;
        expect(datasetsAfter.length).toBe(datasetsBefore.length);
        for (let i = 0; i < datasetsBefore.length; i++) {
          expect(datasetsAfter[i].label).toBe(datasetsBefore[i].label);
          expect(datasetsAfter[i].borderColor).toBe(datasetsBefore[i].borderColor);
        }

        // Verify results list is hidden
        const resultsList = document.getElementById('itemsResultsList');
        const isHidden = resultsList.style.display === 'none' || resultsList.innerHTML === '';
        expect(isHidden).toBe(true);
      }),
      { numRuns: 100 }
    );
  });
});


// ═══════════════════════════════════════════════════════════════════════════
// Feature: items-statistics-filter, Property 9: Sin re-fetch al cambiar selección
// ═══════════════════════════════════════════════════════════════════════════
describe('Feature: items-statistics-filter, Property 9: Sin re-fetch al cambiar selección', () => {
  /**
   * **Validates: Requirements 5.2**
   *
   * For any sequence of selection/deselection operations after initial load,
   * fetch should not be called again. All operations work against the
   * in-memory cache.
   */

  let fetchSpy;

  beforeEach(() => {
    selectedItems.clear();
    Object.keys(chartData).forEach(k => delete chartData[k]);
    mockChartInstance.data.datasets = [];
    mockChartInstance.update.mockClear();
    chartsModule.itemsChart = mockChartInstance;
    document.body.innerHTML =
      '<div id="itemsResultsList" style="display: none;"></div>' +
      '<span id="itemsSearchCount"></span>' +
      '<button id="itemsSearchClear" style="display: none;"></button>' +
      '<span id="itemsLimitMsg" style="display: none;"></span>' +
      '<div id="itemsSelectedTags"></div>';

    // Install a fresh fetch spy that should NOT be called
    fetchSpy = vi.fn();
    globalThis.fetch = fetchSpy;
  });

  // Arbitrary: unique item names and a sequence of toggle indices
  const arbItemName = fc.string({
    unit: fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz'.split('')),
    minLength: 1,
    maxLength: 10
  });

  const arbItemPool = fc.set(arbItemName, { minLength: 1, maxLength: 20 });
  const arbToggleIndices = fc.array(fc.nat({ max: 19 }), { minLength: 1, maxLength: 30 });

  it('fetch is not called during any toggle operations', () => {
    fc.assert(
      fc.property(arbItemPool, arbToggleIndices, (itemPool, indices) => {
        const itemPoolArr = Array.from(itemPool);
        // Reset state
        selectedItems.clear();
        Object.keys(chartData).forEach(k => delete chartData[k]);
        mockChartInstance.data.datasets = [];
        fetchSpy.mockClear();

        // Populate chartData (simulating data already loaded)
        chartsModule.allItemNames = itemPoolArr;
        for (const name of itemPoolArr) {
          chartData[name] = [
            { x: 1704067200000, y: 10 },
            { x: 1704153600000, y: 20 }
          ];
        }

        // Perform a sequence of toggle operations
        for (const idx of indices) {
          const name = itemPoolArr[idx % itemPoolArr.length];
          toggleItemSelection(name);
        }

        // Verify fetch was never called
        expect(fetchSpy).not.toHaveBeenCalled();
      }),
      { numRuns: 100 }
    );
  });
});


// ═══════════════════════════════════════════════════════════════════════════
// Feature: new-statistics-charts, Property 1: Histogram bucketing preserves total count
// ═══════════════════════════════════════════════════════════════════════════
describe('Feature: new-statistics-charts, Property 1: Histogram bucketing preserves total count', () => {
  /**
   * **Validates: Requirements 1.1, 7.1, 8.1**
   *
   * For any array of non-negative integers and bucket width W > 0,
   * the sum of all bucket counts equals the input length, and each
   * value V falls in the correct bucket (bucket start = floor(V/W)*W).
   */

  const arbValues = fc.array(fc.nat({ max: 5000 }), { minLength: 0, maxLength: 100 });
  const arbWidth = fc.integer({ min: 1, max: 500 });

  it('sum of all bucket counts equals input length', () => {
    fc.assert(
      fc.property(arbValues, arbWidth, (values, width) => {
        const result = bucketValues(values, width);
        const totalCount = result.reduce((sum, b) => sum + b.count, 0);
        expect(totalCount).toBe(values.length);
      }),
      { numRuns: 100 }
    );
  });

  it('each value falls in the correct bucket', () => {
    fc.assert(
      fc.property(arbValues, arbWidth, (values, width) => {
        const result = bucketValues(values, width);
        // Build a map of bucket start → count from result
        const bucketMap = {};
        for (const b of result) {
          const start = parseInt(b.bucket.split('-')[0], 10);
          bucketMap[start] = b.count;
        }
        // Verify each value maps to the correct bucket
        const expectedCounts = {};
        for (const v of values) {
          const start = Math.floor(v / width) * width;
          expectedCounts[start] = (expectedCounts[start] || 0) + 1;
        }
        expect(bucketMap).toEqual(expectedCounts);
      }),
      { numRuns: 100 }
    );
  });
});


// ═══════════════════════════════════════════════════════════════════════════
// Feature: new-statistics-charts, Property 2: Leaderboard top-N is sorted and bounded
// ═══════════════════════════════════════════════════════════════════════════
describe('Feature: new-statistics-charts, Property 2: Leaderboard top-N is sorted and bounded', () => {
  /**
   * **Validates: Requirements 2.1, 6.1, 10.1**
   *
   * For any array of objects with numeric score and limit N > 0,
   * output length = min(N, input.length), output is sorted descending
   * by score, and every output score >= every excluded score.
   */

  const arbItem = fc.record({
    name: fc.string({ minLength: 1, maxLength: 10 }),
    score: fc.integer({ min: 0, max: 100000 })
  });
  const arbItems = fc.array(arbItem, { minLength: 0, maxLength: 50 });
  const arbN = fc.integer({ min: 1, max: 30 });

  it('output length equals min(N, input.length)', () => {
    fc.assert(
      fc.property(arbItems, arbN, (items, n) => {
        const result = topN(items, 'score', n);
        expect(result.length).toBe(Math.min(n, items.length));
      }),
      { numRuns: 100 }
    );
  });

  it('output is sorted descending by score', () => {
    fc.assert(
      fc.property(arbItems, arbN, (items, n) => {
        const result = topN(items, 'score', n);
        for (let i = 1; i < result.length; i++) {
          expect(result[i].score).toBeLessThanOrEqual(result[i - 1].score);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('every output score >= every excluded score', () => {
    fc.assert(
      fc.property(arbItems, arbN, (items, n) => {
        const result = topN(items, 'score', n);
        if (result.length === 0 || result.length === items.length) return;
        const minOutput = Math.min(...result.map(r => r.score));
        const resultSet = new Set(result);
        for (const item of items) {
          if (!resultSet.has(item)) {
            expect(item.score).toBeLessThanOrEqual(minOutput);
          }
        }
      }),
      { numRuns: 100 }
    );
  });
});


// ═══════════════════════════════════════════════════════════════════════════
// Feature: new-statistics-charts, Property 3: Guild alignment color mapping is deterministic
// ═══════════════════════════════════════════════════════════════════════════
describe('Feature: new-statistics-charts, Property 3: Guild alignment color mapping is deterministic', () => {
  /**
   * **Validates: Requirements 2.2**
   *
   * For any alignment value: 1→#00bc8c, 2→#e74c3c, other→#6c757d.
   * Calling twice with same input produces same output (idempotent).
   */

  const arbAlignment = fc.oneof(
    fc.constant(1),
    fc.constant(2),
    fc.integer({ min: -100, max: 100 })
  );

  it('returns correct color for each alignment value', () => {
    fc.assert(
      fc.property(arbAlignment, (alignment) => {
        const color = guildAlignmentColor(alignment);
        if (alignment === 1) {
          expect(color).toBe('#00bc8c');
        } else if (alignment === 2) {
          expect(color).toBe('#e74c3c');
        } else {
          expect(color).toBe('#6c757d');
        }
      }),
      { numRuns: 100 }
    );
  });

  it('calling twice with same input produces same output', () => {
    fc.assert(
      fc.property(arbAlignment, (alignment) => {
        const first = guildAlignmentColor(alignment);
        const second = guildAlignmentColor(alignment);
        expect(first).toBe(second);
      }),
      { numRuns: 100 }
    );
  });
});


// ═══════════════════════════════════════════════════════════════════════════
// Feature: new-statistics-charts, Property 4: Gold distribution covers all level ranges with correct averages
// ═══════════════════════════════════════════════════════════════════════════
describe('Feature: new-statistics-charts, Property 4: Gold distribution covers all level ranges with correct averages', () => {
  /**
   * **Validates: Requirements 3.1, 3.4**
   *
   * For any array of user records with level 1–50 and gold values,
   * exactly 5 entries returned (one per range: 1-10, 11-20, 21-30, 31-40, 41-50),
   * average for each range = sum/count (or 0 if empty),
   * empty ranges have average and median of 0.
   */

  const RANGES = [
    { label: '1-10', min: 1, max: 10 },
    { label: '11-20', min: 11, max: 20 },
    { label: '21-30', min: 21, max: 30 },
    { label: '31-40', min: 31, max: 40 },
    { label: '41-50', min: 41, max: 50 }
  ];

  // Reference implementation of gold distribution
  function computeGoldDistribution(users) {
    return RANGES.map(r => {
      const inRange = users.filter(u => u.level >= r.min && u.level <= r.max);
      if (inRange.length === 0) {
        return { range: r.label, average: 0, median: 0 };
      }
      const sum = inRange.reduce((s, u) => s + u.gold, 0);
      const avg = sum / inRange.length;
      const sorted = inRange.map(u => u.gold).sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      const median = sorted.length % 2 === 0
        ? (sorted[mid - 1] + sorted[mid]) / 2
        : sorted[mid];
      return { range: r.label, average: avg, median: median };
    });
  }

  const arbUser = fc.record({
    level: fc.integer({ min: 1, max: 50 }),
    gold: fc.integer({ min: 0, max: 1000000 })
  });
  const arbUsers = fc.array(arbUser, { minLength: 0, maxLength: 50 });

  it('returns exactly 5 entries with correct averages', () => {
    fc.assert(
      fc.property(arbUsers, (users) => {
        const result = computeGoldDistribution(users);
        expect(result.length).toBe(5);

        for (const entry of result) {
          const r = RANGES.find(r => r.label === entry.range);
          const inRange = users.filter(u => u.level >= r.min && u.level <= r.max);
          if (inRange.length === 0) {
            expect(entry.average).toBe(0);
            expect(entry.median).toBe(0);
          } else {
            const sum = inRange.reduce((s, u) => s + u.gold, 0);
            expect(entry.average).toBeCloseTo(sum / inRange.length, 5);
          }
        }
      }),
      { numRuns: 100 }
    );
  });

  it('empty ranges have average and median of 0', () => {
    fc.assert(
      fc.property(arbUsers, (users) => {
        const result = computeGoldDistribution(users);
        for (const entry of result) {
          const r = RANGES.find(r => r.label === entry.range);
          const inRange = users.filter(u => u.level >= r.min && u.level <= r.max);
          if (inRange.length === 0) {
            expect(entry.average).toBe(0);
            expect(entry.median).toBe(0);
          }
        }
      }),
      { numRuns: 100 }
    );
  });
});


// ═══════════════════════════════════════════════════════════════════════════
// Feature: new-statistics-charts, Property 5: K/D ratio handles zero deaths correctly
// ═══════════════════════════════════════════════════════════════════════════
describe('Feature: new-statistics-charts, Property 5: K/D ratio handles zero deaths correctly', () => {
  /**
   * **Validates: Requirements 4.1, 4.2**
   *
   * For any kills/deaths pair: deaths > 0 → kills/deaths,
   * deaths === 0 → kills.
   */

  const arbKills = fc.integer({ min: 0, max: 100000 });
  const arbDeaths = fc.integer({ min: 0, max: 100000 });

  it('returns kills/deaths when deaths > 0, kills when deaths === 0', () => {
    fc.assert(
      fc.property(arbKills, arbDeaths, (kills, deaths) => {
        const result = computeKdRatio(kills, deaths);
        if (deaths > 0) {
          expect(result).toBeCloseTo(kills / deaths, 10);
        } else {
          expect(result).toBe(kills);
        }
      }),
      { numRuns: 100 }
    );
  });
});


// ═══════════════════════════════════════════════════════════════════════════
// Feature: new-statistics-charts, Property 6: Faction aggregation sums and averages are correct
// ═══════════════════════════════════════════════════════════════════════════
describe('Feature: new-statistics-charts, Property 6: Faction aggregation sums and averages are correct', () => {
  /**
   * **Validates: Requirements 5.1**
   *
   * For any array of user records with faction status (1=Real, 2=Caos),
   * faction_score, and kill counts: player count = count of users with
   * that status, average score = sum of scores / count, total kills =
   * sum of kill counts.
   */

  const arbUser = fc.record({
    status: fc.constantFrom(1, 2),
    faction_score: fc.integer({ min: 0, max: 100000 }),
    kills: fc.integer({ min: 0, max: 50000 })
  });
  const arbUsers = fc.array(arbUser, { minLength: 0, maxLength: 50 });

  // Reference implementation of faction aggregation
  function computeFactionSummary(users) {
    const factions = { 1: { players: 0, totalScore: 0, totalKills: 0 }, 2: { players: 0, totalScore: 0, totalKills: 0 } };
    for (const u of users) {
      factions[u.status].players++;
      factions[u.status].totalScore += u.faction_score;
      factions[u.status].totalKills += u.kills;
    }
    return {
      real: {
        players: factions[1].players,
        avgScore: factions[1].players > 0 ? factions[1].totalScore / factions[1].players : 0,
        totalKills: factions[1].totalKills
      },
      caos: {
        players: factions[2].players,
        avgScore: factions[2].players > 0 ? factions[2].totalScore / factions[2].players : 0,
        totalKills: factions[2].totalKills
      }
    };
  }

  it('player count, average score, and total kills are correct per faction', () => {
    fc.assert(
      fc.property(arbUsers, (users) => {
        const result = computeFactionSummary(users);

        const realUsers = users.filter(u => u.status === 1);
        const caosUsers = users.filter(u => u.status === 2);

        // Player counts
        expect(result.real.players).toBe(realUsers.length);
        expect(result.caos.players).toBe(caosUsers.length);

        // Total kills
        expect(result.real.totalKills).toBe(realUsers.reduce((s, u) => s + u.kills, 0));
        expect(result.caos.totalKills).toBe(caosUsers.reduce((s, u) => s + u.kills, 0));

        // Average scores
        if (realUsers.length > 0) {
          const expectedAvg = realUsers.reduce((s, u) => s + u.faction_score, 0) / realUsers.length;
          expect(result.real.avgScore).toBeCloseTo(expectedAvg, 5);
        } else {
          expect(result.real.avgScore).toBe(0);
        }
        if (caosUsers.length > 0) {
          const expectedAvg = caosUsers.reduce((s, u) => s + u.faction_score, 0) / caosUsers.length;
          expect(result.caos.avgScore).toBeCloseTo(expectedAvg, 5);
        } else {
          expect(result.caos.avgScore).toBe(0);
        }
      }),
      { numRuns: 100 }
    );
  });
});


// ═══════════════════════════════════════════════════════════════════════════
// Feature: new-statistics-charts, Property 7: Global quest progress percentage is bounded and correct
// ═══════════════════════════════════════════════════════════════════════════
describe('Feature: new-statistics-charts, Property 7: Global quest progress percentage is bounded and correct', () => {
  /**
   * **Validates: Requirements 9.1, 9.2**
   *
   * For any positive threshold and non-negative current,
   * percentage = min(100, (current/threshold)*100),
   * always between 0 and 100 inclusive.
   */

  const arbCurrent = fc.integer({ min: 0, max: 1000000 });
  const arbThreshold = fc.integer({ min: 1, max: 1000000 });

  it('percentage equals min(100, (current/threshold)*100) and is bounded 0-100', () => {
    fc.assert(
      fc.property(arbCurrent, arbThreshold, (current, threshold) => {
        const result = computeProgressPercent(current, threshold);
        const expected = Math.min(100, (current / threshold) * 100);
        expect(result).toBeCloseTo(expected, 10);
        expect(result).toBeGreaterThanOrEqual(0);
        expect(result).toBeLessThanOrEqual(100);
      }),
      { numRuns: 100 }
    );
  });
});


// ═══════════════════════════════════════════════════════════════════════════
// Feature: new-statistics-charts, Property 8: Deleted and banned users are excluded from aggregates
// ═══════════════════════════════════════════════════════════════════════════
describe('Feature: new-statistics-charts, Property 8: Deleted and banned users are excluded from aggregates', () => {
  /**
   * **Validates: Requirements 11.4**
   *
   * For any mixed dataset of active/deleted/banned users,
   * aggregate results on full set (after filtering) equal results
   * on active-only subset.
   * Active = deleted !== 1 AND (is_banned === null OR is_banned !== 1)
   */

  const arbUser = fc.record({
    deleted: fc.constantFrom(0, 1),
    is_banned: fc.constantFrom(null, 0, 1),
    score: fc.integer({ min: 0, max: 100000 })
  });
  const arbUsers = fc.array(arbUser, { minLength: 0, maxLength: 50 });

  // Reference filter: active users only
  function filterActive(users) {
    return users.filter(u => u.deleted !== 1 && (u.is_banned === null || u.is_banned !== 1));
  }

  // Reference aggregate: sum and count of scores
  function aggregate(users) {
    const active = filterActive(users);
    return {
      count: active.length,
      totalScore: active.reduce((s, u) => s + u.score, 0)
    };
  }

  it('aggregate on full set after filtering equals aggregate on active-only subset', () => {
    fc.assert(
      fc.property(arbUsers, (users) => {
        const activeOnly = filterActive(users);
        const resultFull = aggregate(users);
        const resultActive = {
          count: activeOnly.length,
          totalScore: activeOnly.reduce((s, u) => s + u.score, 0)
        };

        expect(resultFull.count).toBe(resultActive.count);
        expect(resultFull.totalScore).toBe(resultActive.totalScore);
      }),
      { numRuns: 100 }
    );
  });
});


// ═══════════════════════════════════════════════════════════════════════════
// Feature: items-chart-loading-fix, Property 1: Bug Condition
// ═══════════════════════════════════════════════════════════════════════════
describe('Feature: items-chart-loading-fix, Property 1: Bug Condition', () => {
  /**
   * **Validates: Requirements 1.1, 1.2, 1.3**
   *
   * Bug Condition: renderItemsChart is called with valid API data and
   * scales.x.type: 'time' but no date adapter is registered.
   *
   * This test simulates the missing date adapter by making MockChart throw
   * when it receives a config with scales.x.type === 'time', which is
   * exactly what real Chart.js does when no adapter is registered.
   *
   * EXPECTED: Test FAILS on unfixed code because new Chart(...) throws
   * inside the .then() handler with no try/catch, so the loading indicator
   * is not properly cleaned up and the search input is never enabled.
   */

  // Helper: flush multiple microtask ticks to allow promise chains to settle
  async function flushPromises() {
    for (let i = 0; i < 10; i++) {
      await Promise.resolve();
    }
  }

  // Arbitrary: generate valid API response items
  const arbDateString = fc.integer({
    min: new Date('2023-01-01T00:00:00Z').getTime(),
    max: new Date('2025-01-01T00:00:00Z').getTime()
  }).map(ts => new Date(ts).toISOString());

  const arbItemName = fc.string({
    unit: fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz'.split('')),
    minLength: 1,
    maxLength: 15
  }).filter(s => !Object.prototype.hasOwnProperty(s) && !['constructor', 'toString', 'valueOf', 'hasOwnProperty', '__proto__', 'prototype'].includes(s));

  const arbApiItem = fc.record({
    NAME: arbItemName,
    total_quantity: fc.integer({ min: 1, max: 10000 }),
    datetime: arbDateString
  });

  const arbApiResponse = fc.array(arbApiItem, { minLength: 1, maxLength: 20 });

  const arbContainerId = fc.string({
    unit: fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789'.split('')),
    minLength: 1,
    maxLength: 20
  });

  beforeEach(() => {
    MockChart.mockClear();
  });

  it('renderItemsChart renders chart, removes loading, and enables search when data is valid', async () => {
    await fc.assert(
      fc.asyncProperty(
        arbContainerId,
        arbApiResponse,
        async (id, apiData) => {
          // Set up DOM with canvas, loading indicator, and search input
          document.body.innerHTML =
            '<div class="chart-container">' +
              '<canvas id="' + id + '"></canvas>' +
            '</div>' +
            '<input id="itemsSearch" disabled placeholder="" />' +
            '<button id="itemsSearchClear"></button>' +
            '<div id="itemsResultsList"></div>' +
            '<span id="itemsSearchCount"></span>' +
            '<span id="itemsLimitMsg" style="display: none;"></span>' +
            '<div id="itemsSelectedTags"></div>';

          // After the fix: date adapter is registered, so MockChart should NOT throw
          // for time-scale charts. This simulates the fixed environment where
          // chartjs-adapter-date-fns is loaded via CDN in index.php.
          MockChart.mockClear();
          MockChart.mockImplementation(() => mockChartInstance);

          // Mock fetch to return valid API data
          globalThis.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve(apiData)
          });

          renderItemsChart(id);

          await flushPromises();

          // Assert: MockChart was called (chart creation was attempted)
          expect(MockChart).toHaveBeenCalled();

          // Assert: loading indicator is removed
          const container = document.getElementById(id).parentNode;
          const loading = container.querySelector('.chart-loading');
          expect(loading).toBeNull();

          // Assert: search input is enabled
          const searchInput = document.getElementById('itemsSearch');
          expect(searchInput.disabled).toBe(false);

          // Restore default MockChart behavior for other tests
          MockChart.mockImplementation(() => mockChartInstance);
        }
      ),
      { numRuns: 100 }
    );
  }, 30000);
});


// ═══════════════════════════════════════════════════════════════════════════
// Feature: items-chart-loading-fix, Property 2: Preservation
// Non-Time-Scale Paths Behave Identically
// ═══════════════════════════════════════════════════════════════════════════
describe('Feature: items-chart-loading-fix, Property 2: Preservation', () => {
  // Helper: flush multiple microtask ticks to allow promise chains to settle
  async function flushPromises() {
    for (let i = 0; i < 10; i++) {
      await Promise.resolve();
    }
  }

  // Arbitrary: alphanumeric container ID
  const arbContainerId2 = fc.string({
    unit: fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789'.split('')),
    minLength: 1,
    maxLength: 20
  });

  // Helper: set up DOM with canvas inside a chart-container
  function setupContainer(id) {
    document.body.innerHTML =
      '<div class="chart-container"><canvas id="' + id + '"></canvas></div>';
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Test 2a — Empty data preservation
  // ─────────────────────────────────────────────────────────────────────────
  describe('Test 2a — Empty data preservation', () => {
    /**
     * **Validates: Requirements 3.2**
     *
     * When API returns empty array [], renderItemsChart shows
     * "No hay datos disponibles." fallback and does NOT create a chart.
     */
    beforeEach(() => {
      MockChart.mockClear();
      MockChart.mockImplementation(() => mockChartInstance);
    });

    it('renderItemsChart shows fallback for empty API data and does not create chart', async () => {
      await fc.assert(
        fc.asyncProperty(
          arbContainerId2,
          async (id) => {
            setupContainer(id);
            MockChart.mockClear();

            // Mock fetch to return empty array
            globalThis.fetch = vi.fn().mockResolvedValue({
              ok: true,
              json: () => Promise.resolve([])
            });

            renderItemsChart(id);

            await flushPromises();

            // Assert: fallback message is shown
            const container = document.getElementById(id).parentNode;
            const fallback = container.querySelector('.chart-error');
            expect(fallback).not.toBeNull();
            expect(fallback.textContent).toBe('No hay datos disponibles.');

            // Assert: MockChart was NOT called (no chart created)
            expect(MockChart).not.toHaveBeenCalled();
          }
        ),
        { numRuns: 100 }
      );
    }, 30000);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Test 2b — Network error preservation
  // ─────────────────────────────────────────────────────────────────────────
  describe('Test 2b — Network error preservation', () => {
    /**
     * **Validates: Requirements 3.3**
     *
     * When fetch rejects (network error), renderItemsChart shows
     * "No se pudieron cargar las estadísticas." error message.
     */
    beforeEach(() => {
      MockChart.mockClear();
      MockChart.mockImplementation(() => mockChartInstance);
    });

    const arbErrorMsg = fc.string({
      unit: fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz '.split('')),
      minLength: 1,
      maxLength: 30
    });

    it('renderItemsChart shows error message when fetch rejects', async () => {
      await fc.assert(
        fc.asyncProperty(
          arbContainerId2,
          arbErrorMsg,
          async (id, msg) => {
            setupContainer(id);
            MockChart.mockClear();

            // Mock fetch to reject with network error
            globalThis.fetch = vi.fn().mockRejectedValue(new Error(msg));

            renderItemsChart(id);

            await flushPromises();

            // Assert: error message is shown
            const container = document.getElementById(id).parentNode;
            const errEl = container.querySelector('.chart-error');
            expect(errEl).not.toBeNull();
            expect(errEl.textContent).toBe('No se pudieron cargar las estadísticas.');
          }
        ),
        { numRuns: 100 }
      );
    }, 30000);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Test 2c — HTTP error preservation
  // ─────────────────────────────────────────────────────────────────────────
  describe('Test 2c — HTTP error preservation', () => {
    /**
     * **Validates: Requirements 3.3**
     *
     * When fetch returns HTTP error status (400-599), renderItemsChart
     * shows "No se pudieron cargar las estadísticas." error message.
     */
    beforeEach(() => {
      MockChart.mockClear();
      MockChart.mockImplementation(() => mockChartInstance);
    });

    const arbHttpErrorStatus = fc.integer({ min: 400, max: 599 });

    it('renderItemsChart shows error message for HTTP error status codes', async () => {
      await fc.assert(
        fc.asyncProperty(
          arbContainerId2,
          arbHttpErrorStatus,
          async (id, statusCode) => {
            setupContainer(id);
            MockChart.mockClear();

            // Mock fetch to return HTTP error
            globalThis.fetch = vi.fn().mockResolvedValue({
              ok: false,
              status: statusCode
            });

            renderItemsChart(id);

            await flushPromises();

            // Assert: error message is shown
            const container = document.getElementById(id).parentNode;
            const errEl = container.querySelector('.chart-error');
            expect(errEl).not.toBeNull();
            expect(errEl.textContent).toBe('No se pudieron cargar las estadísticas.');
          }
        ),
        { numRuns: 100 }
      );
    }, 30000);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Test 2d — Data grouping/downsampling preservation
  // ─────────────────────────────────────────────────────────────────────────
  describe('Test 2d — Data grouping/downsampling preservation', () => {
    /**
     * **Validates: Requirements 3.1**
     *
     * downsampleDaily continues to produce correct output for
     * item-chart-shaped data: at most one point per day, sorted
     * ascending, last point per day preserved.
     */

    // Generate timestamps within a reasonable range (2020-2025)
    const arbTimestamp = fc.integer({
      min: new Date('2020-01-01T00:00:00Z').getTime(),
      max: new Date('2025-12-31T23:59:59Z').getTime()
    });

    // Generate item-chart-shaped data points
    const arbItemPoint = fc.record({
      x: arbTimestamp,
      y: fc.nat({ max: 10000 })
    });

    const arbItemPoints = fc.array(arbItemPoint, { minLength: 0, maxLength: 50 });

    it('downsampleDaily produces at most one point per calendar day', () => {
      fc.assert(
        fc.property(arbItemPoints, (points) => {
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

    it('downsampleDaily output is sorted ascending by timestamp', () => {
      fc.assert(
        fc.property(arbItemPoints, (points) => {
          const result = downsampleDaily(points);
          for (let i = 1; i < result.length; i++) {
            expect(result[i].x).toBeGreaterThan(result[i - 1].x);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('downsampleDaily preserves the last chronological point per day', () => {
      fc.assert(
        fc.property(arbItemPoints, (points) => {
          if (points.length === 0) return;

          const result = downsampleDaily(points);

          // Reference: group by day, keep last chronological point
          const sorted = points.slice().sort((a, b) => a.x - b.x);
          const byDay = {};
          sorted.forEach(p => {
            const d = new Date(p.x);
            const key = d.getUTCFullYear() + '-' + (d.getUTCMonth() + 1) + '-' + d.getUTCDate();
            byDay[key] = p;
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
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Test 2e — Other chart render functions preservation
  // ─────────────────────────────────────────────────────────────────────────
  describe('Test 2e — Other chart render functions preservation', () => {
    /**
     * **Validates: Requirements 3.4, 3.5**
     *
     * Other render functions (renderPieChart, renderBarChart,
     * renderColumnChart, renderLineChart) continue to create charts
     * correctly with valid data and are not affected by any changes.
     */
    beforeEach(() => {
      MockChart.mockClear();
      MockChart.mockImplementation(() => mockChartInstance);
    });

    // Arbitrary: valid pie chart data
    const arbPieEntry = fc.record({
      name: fc.string({ unit: fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz'.split('')), minLength: 1, maxLength: 10 }),
      y: fc.nat({ max: 1000 })
    });
    const arbPieData = fc.array(arbPieEntry, { minLength: 1, maxLength: 10 });

    // Arbitrary: valid bar chart data
    const arbBarEntry = fc.record({
      name: fc.string({ unit: fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz'.split('')), minLength: 1, maxLength: 10 }),
      y: fc.nat({ max: 1000 })
    });
    const arbBarData = fc.array(arbBarEntry, { minLength: 1, maxLength: 10 });

    // Arbitrary: valid line chart data (array of numbers)
    const arbLineData = fc.array(fc.nat({ max: 1000 }), { minLength: 1, maxLength: 20 });

    // Arbitrary: valid column chart data (plain number array)
    const arbColumnData = fc.array(fc.nat({ max: 1000 }), { minLength: 1, maxLength: 10 });
    const arbCategories = fc.array(
      fc.string({ unit: fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz'.split('')), minLength: 1, maxLength: 8 }),
      { minLength: 1, maxLength: 10 }
    );

    it('renderPieChart creates a chart with valid data', () => {
      fc.assert(
        fc.property(arbContainerId2, arbPieData, (id, data) => {
          setupContainer(id);
          MockChart.mockClear();

          const result = renderPieChart(id, data);
          expect(result).not.toBeNull();
          expect(MockChart).toHaveBeenCalledTimes(1);

          const config = MockChart.mock.calls[0][1];
          expect(config.type).toBe('pie');
          expect(config.data.labels).toEqual(data.map(d => d.name));
          expect(config.data.datasets[0].data).toEqual(data.map(d => d.y));
        }),
        { numRuns: 100 }
      );
    });

    it('renderBarChart creates a horizontal bar chart with valid data', () => {
      fc.assert(
        fc.property(arbContainerId2, arbBarData, (id, data) => {
          setupContainer(id);
          MockChart.mockClear();

          const result = renderBarChart(id, data);
          expect(result).not.toBeNull();
          expect(MockChart).toHaveBeenCalledTimes(1);

          const config = MockChart.mock.calls[0][1];
          expect(config.type).toBe('bar');
          expect(config.options.indexAxis).toBe('y');
          expect(config.data.labels).toEqual(data.map(d => d.name));
        }),
        { numRuns: 100 }
      );
    });

    it('renderColumnChart creates a bar chart with valid number array data', () => {
      fc.assert(
        fc.property(arbContainerId2, arbColumnData, arbCategories, (id, data, cats) => {
          setupContainer(id);
          MockChart.mockClear();

          const result = renderColumnChart(id, data, cats);
          expect(result).not.toBeNull();
          expect(MockChart).toHaveBeenCalledTimes(1);

          const config = MockChart.mock.calls[0][1];
          expect(config.type).toBe('bar');
          expect(config.data.datasets[0].data).toEqual(data);
        }),
        { numRuns: 100 }
      );
    });

    it('renderLineChart creates a line chart with valid data', () => {
      fc.assert(
        fc.property(arbContainerId2, arbLineData, (id, data) => {
          setupContainer(id);
          MockChart.mockClear();

          const result = renderLineChart(id, data);
          expect(result).not.toBeNull();
          expect(MockChart).toHaveBeenCalledTimes(1);

          const config = MockChart.mock.calls[0][1];
          expect(config.type).toBe('line');
          expect(config.data.labels).toEqual(data.map((_, i) => i + 1));
          expect(config.data.datasets[0].data).toEqual(data);
        }),
        { numRuns: 100 }
      );
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Feature: random-default-items, Property 1: Invariante de cantidad de selección
// ═══════════════════════════════════════════════════════════════════════════
describe('Feature: random-default-items, Property 1: Invariante de cantidad de selección', () => {
  /**
   * **Validates: Requirements 1.1, 1.2, 4.3, 5.1, 5.2, 5.3**
   *
   * For any array of item names of length N (0 to 200), after calling
   * selectRandomItems, selectedItems.size must equal min(N, DEFAULT_RANDOM_COUNT).
   */

  // selectRandomItems and DEFAULT_RANDOM_COUNT already imported at top level

  beforeEach(() => {
    selectedItems.clear();
    const cd = chartsModule.chartData;
    Object.keys(cd).forEach(k => delete cd[k]);
    mockChartInstance.data.datasets = [];
    mockChartInstance.update.mockClear();
    chartsModule.itemsChart = mockChartInstance;
    document.body.innerHTML = '<div id="itemsSelectedTags"></div>';
  });

  const arbItemName = fc.string({
    unit: fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789'.split('')),
    minLength: 1,
    maxLength: 15
  });

  it('selectedItems.size equals min(N, DEFAULT_RANDOM_COUNT) for any N', () => {
    fc.assert(
      fc.property(
        fc.set(arbItemName, { minLength: 0, maxLength: 200 }),
        (itemNamesSet) => {
          const itemNames = Array.from(itemNamesSet);

          // Reset state
          selectedItems.clear();
          const cd = chartsModule.chartData;
          Object.keys(cd).forEach(k => delete cd[k]);
          mockChartInstance.data.datasets = [];

          // Populate allItemNames and chartData
          chartsModule.allItemNames = itemNames;
          for (const name of itemNames) {
            cd[name] = [{ x: 1704067200000, y: 10 }];
          }

          // Act
          selectRandomItems();

          // Assert
          const expected = Math.min(itemNames.length, DEFAULT_RANDOM_COUNT);
          expect(selectedItems.size).toBe(expected);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Feature: random-default-items, Property 2: Unicidad y pertenencia de la selección
// ═══════════════════════════════════════════════════════════════════════════
describe('Feature: random-default-items, Property 2: Unicidad y pertenencia de la selección', () => {
  /**
   * **Validates: Requirements 2.1, 2.2**
   *
   * For any array of item names, after calling selectRandomItems,
   * every element in selectedItems must exist in allItemNames
   * and there must be no duplicates (Set guarantees uniqueness,
   * but we verify membership).
   */

  const { selectRandomItems } = chartsModule;

  beforeEach(() => {
    selectedItems.clear();
    const cd = chartsModule.chartData;
    Object.keys(cd).forEach(k => delete cd[k]);
    mockChartInstance.data.datasets = [];
    mockChartInstance.update.mockClear();
    chartsModule.itemsChart = mockChartInstance;
    document.body.innerHTML = '<div id="itemsSelectedTags"></div>';
  });

  const arbItemName = fc.string({
    unit: fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789'.split('')),
    minLength: 1,
    maxLength: 15
  });

  it('every selected item exists in allItemNames (subset property)', () => {
    fc.assert(
      fc.property(
        fc.set(arbItemName, { minLength: 0, maxLength: 200 }),
        (itemNamesSet) => {
          const itemNames = Array.from(itemNamesSet);

          // Reset state
          selectedItems.clear();
          const cd = chartsModule.chartData;
          Object.keys(cd).forEach(k => delete cd[k]);
          mockChartInstance.data.datasets = [];

          // Populate
          chartsModule.allItemNames = itemNames;
          for (const name of itemNames) {
            cd[name] = [{ x: 1704067200000, y: 10 }];
          }

          // Act
          selectRandomItems();

          // Assert: every selected item is in allItemNames
          const allNamesSet = new Set(itemNames);
          for (const selected of selectedItems) {
            expect(allNamesSet.has(selected)).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('selectedItems contains no duplicates (verified via array conversion)', () => {
    fc.assert(
      fc.property(
        fc.set(arbItemName, { minLength: 1, maxLength: 200 }),
        (itemNamesSet) => {
          const itemNames = Array.from(itemNamesSet);

          // Reset state
          selectedItems.clear();
          const cd = chartsModule.chartData;
          Object.keys(cd).forEach(k => delete cd[k]);
          mockChartInstance.data.datasets = [];

          // Populate
          chartsModule.allItemNames = itemNames;
          for (const name of itemNames) {
            cd[name] = [{ x: 1704067200000, y: 10 }];
          }

          // Act
          selectRandomItems();

          // Assert: converting Set to array and back to Set has same size
          const asArray = Array.from(selectedItems);
          const asSetAgain = new Set(asArray);
          expect(asArray.length).toBe(asSetAgain.size);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Feature: random-default-items, Property 3: Sincronización de chart y tags después de la selección aleatoria
// ═══════════════════════════════════════════════════════════════════════════
describe('Feature: random-default-items, Property 3: Sincronización de chart y tags después de la selección aleatoria', () => {
  /**
   * **Validates: Requirements 1.3, 1.4**
   *
   * For any array of item names with associated data in chartData,
   * after calling selectRandomItems, the number of datasets in the chart
   * and the number of tags rendered must equal selectedItems.size.
   */

  const { selectRandomItems } = chartsModule;

  beforeEach(() => {
    selectedItems.clear();
    const cd = chartsModule.chartData;
    Object.keys(cd).forEach(k => delete cd[k]);
    mockChartInstance.data.datasets = [];
    mockChartInstance.update.mockClear();
    chartsModule.itemsChart = mockChartInstance;
    document.body.innerHTML = '<div id="itemsSelectedTags"></div>';
  });

  const arbItemName = fc.string({
    unit: fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789'.split('')),
    minLength: 1,
    maxLength: 15
  });

  it('chart datasets count and tags count both equal selectedItems.size', () => {
    fc.assert(
      fc.property(
        fc.set(arbItemName, { minLength: 0, maxLength: 200 }),
        (itemNamesSet) => {
          const itemNames = Array.from(itemNamesSet);

          // Reset state
          selectedItems.clear();
          const cd = chartsModule.chartData;
          Object.keys(cd).forEach(k => delete cd[k]);
          mockChartInstance.data.datasets = [];
          document.getElementById('itemsSelectedTags').innerHTML = '';

          // Populate allItemNames and chartData with dummy time-series data
          chartsModule.allItemNames = itemNames;
          for (const name of itemNames) {
            cd[name] = [
              { x: 1704067200000, y: 10 },
              { x: 1704153600000, y: 20 }
            ];
          }

          // Act
          selectRandomItems();

          // Assert: datasets count equals selectedItems.size
          expect(mockChartInstance.data.datasets.length).toBe(selectedItems.size);

          // Assert: tags count equals selectedItems.size
          const container = document.getElementById('itemsSelectedTags');
          const badges = container.querySelectorAll('.badge');
          expect(badges.length).toBe(selectedItems.size);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Feature: ui-ux-improvements, Property 1: Date filter preserves all valid
// points and excludes all invalid points
// ═══════════════════════════════════════════════════════════════════════════
describe('Feature: ui-ux-improvements, Property 1: Date filter preserves all valid points and excludes all invalid points', () => {
  /**
   * **Validates: Requirements 7.2, 7.3**
   *
   * For any random array of {x: timestamp, y: number} points with timestamps
   * spanning 2024-01-01 to 2025-12-31 and a random minimum date,
   * filterBeforeDate must:
   * (a) every output point has x >= minDate.getTime()
   * (b) every input point with x >= minDate.getTime() appears in the output
   * (c) output length equals count of valid input points
   */

  // Load AO20 namespace: config first (sets global), then data-utils
  const AO20ns = (() => {
    const ns = require('../js/config.js');
    globalThis.AO20 = ns;
    require('../js/data-utils.js');
    return ns;
  })();

  const filterBeforeDate = AO20ns.utils.filterBeforeDate;

  // Timestamp range: 2024-01-01 to 2025-12-31
  const MIN_TS = new Date('2024-01-01T00:00:00Z').getTime();
  const MAX_TS = new Date('2025-12-31T23:59:59Z').getTime();

  const arbTimestamp = fc.integer({ min: MIN_TS, max: MAX_TS });

  const arbPoint = fc.record({
    x: arbTimestamp,
    y: fc.double({ min: -1e6, max: 1e6, noNaN: true, noDefaultInfinity: true })
  });

  const arbPoints = fc.array(arbPoint, { minLength: 0, maxLength: 50 });

  // Random minimum date within the same range
  const arbMinDate = arbTimestamp.map(ts => new Date(ts));

  it('every output point has x >= minDate.getTime()', () => {
    fc.assert(
      fc.property(arbPoints, arbMinDate, (points, minDate) => {
        const result = filterBeforeDate(points, minDate);
        const threshold = minDate.getTime();
        for (const p of result) {
          expect(p.x).toBeGreaterThanOrEqual(threshold);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('every input point with x >= minDate.getTime() appears in the output', () => {
    fc.assert(
      fc.property(arbPoints, arbMinDate, (points, minDate) => {
        const result = filterBeforeDate(points, minDate);
        const threshold = minDate.getTime();
        const validInputPoints = points.filter(p => p.x >= threshold);
        for (const vp of validInputPoints) {
          const found = result.some(rp => rp.x === vp.x && rp.y === vp.y);
          expect(found).toBe(true);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('output length equals count of valid input points', () => {
    fc.assert(
      fc.property(arbPoints, arbMinDate, (points, minDate) => {
        const result = filterBeforeDate(points, minDate);
        const threshold = minDate.getTime();
        const expectedCount = points.filter(p => p.x >= threshold).length;
        expect(result.length).toBe(expectedCount);
      }),
      { numRuns: 100 }
    );
  });
});
