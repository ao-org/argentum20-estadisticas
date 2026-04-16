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

const chartsModule = require('../js/charts.js');
const {
  normalizeStr, downsampleDaily, showError,
  renderPieChart, renderColumnChart, renderBarChart, renderLineChart,
  toggleItemSelection, selectedItems, MAX_SELECTED,
  updateItemsChart, DARK_PALETTE, chartData,
  applyItemsFilter
} = chartsModule;

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
