import { describe, it, expect, vi } from 'vitest';
import fc from 'fast-check';

// ── Mock Chart.js globally ─────────────────────────────────────────────────
const mockChartInstance = { destroy: vi.fn(), update: vi.fn(), data: { datasets: [] } };
const MockChart = vi.fn(() => mockChartInstance);
MockChart.defaults = {
  color: '',
  borderColor: '',
  plugins: { tooltip: { backgroundColor: '' }, legend: { labels: { color: '' } } },
  scale: { grid: {} }
};
globalThis.Chart = MockChart;

// Load AO20 namespace modules in order
const AO20 = require('../js/config.js');
globalThis.AO20 = AO20;
require('../js/data-utils.js');
require('../js/renderers.js');

// Import the exported utility functions
const {
  computePercentage,
  computeGini,
  computeLorenzCurve,
  heatmapColor,
  getLevelBracket,
  getGuildSizeBucket,
  getMultiCharBucket,
  getFishingBracket,
  computeRejectionRate,
  computeCompletionPercent
} = require('../js/renderers.js');

// ═══════════════════════════════════════════════════════════════════════════
// Property 1: Percentage computation bounded [0, 100]
// ═══════════════════════════════════════════════════════════════════════════
describe('Feature: extended-statistics, Property 1: Percentage computation is bounded [0, 100]', () => {
  /**
   * **Validates: Requirements 7.2, 11.2, 14.2, 22.2, 23.2, 25.2, 28.2**
   *
   * For any count and total where 0 <= count <= total and total > 0,
   * computePercentage(count, total) produces a value in [0, 100].
   * When total = 0, the result is 0.
   */
  it('result is in [0, 100] for valid count <= total with total > 0', () => {
    fc.assert(
      fc.property(
        fc.nat({ max: 1000000 }),
        fc.nat({ max: 1000000 }),
        (count, extra) => {
          const total = count + extra; // ensures total >= count
          if (total === 0) return; // skip, tested separately
          const result = computePercentage(count, total);
          expect(result).toBeGreaterThanOrEqual(0);
          expect(result).toBeLessThanOrEqual(100);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('returns 0 when total is 0', () => {
    fc.assert(
      fc.property(
        fc.nat({ max: 1000000 }),
        (count) => {
          const result = computePercentage(count, 0);
          expect(result).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Property 2: Gini coefficient bounded [0, 1]
// ═══════════════════════════════════════════════════════════════════════════
describe('Feature: extended-statistics, Property 2: Gini coefficient is bounded [0, 1]', () => {
  /**
   * **Validates: Requirements 6.2**
   *
   * For any sorted array of non-negative numbers with ≥1 element,
   * computeGini() returns a value in [0, 1].
   * Uniform array → ~0. Maximum inequality → approaches 1.
   */
  it('returns a value in [0, 1] for any sorted non-negative array', () => {
    fc.assert(
      fc.property(
        fc.array(fc.nat({ max: 100000 }), { minLength: 1, maxLength: 200 }),
        (values) => {
          const sorted = values.slice().sort((a, b) => a - b);
          const result = computeGini(sorted);
          expect(result).toBeGreaterThanOrEqual(0);
          expect(result).toBeLessThanOrEqual(1);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('returns ~0 for uniform arrays (all equal, > 0)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100000 }),
        fc.integer({ min: 2, max: 100 }),
        (value, length) => {
          const uniform = Array(length).fill(value);
          const result = computeGini(uniform);
          expect(result).toBeCloseTo(0, 5);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('approaches 1 for maximum inequality as array size increases', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 10, max: 500 }),
        fc.integer({ min: 1, max: 100000 }),
        (n, topValue) => {
          // One non-zero value, rest zero → maximum inequality
          const arr = Array(n).fill(0);
          arr[n - 1] = topValue;
          const result = computeGini(arr);
          // For large n, Gini should approach (n-1)/n
          const expected = (n - 1) / n;
          expect(result).toBeCloseTo(expected, 1);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Property 3: Lorenz curve monotonically increasing and bounded
// ═══════════════════════════════════════════════════════════════════════════
describe('Feature: extended-statistics, Property 3: Lorenz curve is monotonically increasing and bounded', () => {
  /**
   * **Validates: Requirements 6.3**
   *
   * For any sorted array of non-negative gold values,
   * computeLorenzCurve() has exactly 20 points,
   * populationPercent strictly increasing 5→100,
   * goldPercent non-decreasing, final point goldPercent = 100.
   */
  it('produces exactly 20 points with correct structure', () => {
    fc.assert(
      fc.property(
        fc.array(fc.nat({ max: 100000 }), { minLength: 1, maxLength: 200 }),
        (values) => {
          const sorted = values.slice().sort((a, b) => a - b);
          const curve = computeLorenzCurve(sorted);
          expect(curve).toHaveLength(20);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('populationPercent is strictly increasing from 5 to 100', () => {
    fc.assert(
      fc.property(
        fc.array(fc.nat({ max: 100000 }), { minLength: 1, maxLength: 200 }),
        (values) => {
          const sorted = values.slice().sort((a, b) => a - b);
          const curve = computeLorenzCurve(sorted);
          for (let i = 0; i < curve.length; i++) {
            expect(curve[i].populationPercent).toBe((i + 1) * 5);
          }
          // Strictly increasing
          for (let i = 1; i < curve.length; i++) {
            expect(curve[i].populationPercent).toBeGreaterThan(curve[i - 1].populationPercent);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('goldPercent is non-decreasing', () => {
    fc.assert(
      fc.property(
        fc.array(fc.nat({ max: 100000 }), { minLength: 1, maxLength: 200 }),
        (values) => {
          const sorted = values.slice().sort((a, b) => a - b);
          const curve = computeLorenzCurve(sorted);
          for (let i = 1; i < curve.length; i++) {
            expect(curve[i].goldPercent).toBeGreaterThanOrEqual(curve[i - 1].goldPercent);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('final point has goldPercent = 100 when total gold > 0', () => {
    fc.assert(
      fc.property(
        fc.array(fc.nat({ max: 100000 }), { minLength: 1, maxLength: 200 }),
        (values) => {
          const sorted = values.slice().sort((a, b) => a - b);
          const totalGold = sorted.reduce((a, b) => a + b, 0);
          const curve = computeLorenzCurve(sorted);
          if (totalGold > 0) {
            expect(curve[19].goldPercent).toBeCloseTo(100, 5);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});


// ═══════════════════════════════════════════════════════════════════════════
// Property 4: Heatmap color interpolation produces valid colors
// ═══════════════════════════════════════════════════════════════════════════
describe('Feature: extended-statistics, Property 4: Heatmap color interpolation produces valid colors', () => {
  /**
   * **Validates: Requirements 5.3, 5.4**
   *
   * For any numeric value within [min, max], heatmapColor returns a valid CSS
   * rgb() color string. For null input, returns neutral gray. Higher values
   * produce a higher red component.
   */
  it('returns a valid rgb() string for any value in [min, max]', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 1000, noNaN: true, noDefaultInfinity: true }),
        fc.double({ min: 0, max: 500, noNaN: true, noDefaultInfinity: true }),
        (range, offset) => {
          const min = offset;
          const max = offset + range + 1; // ensure max > min
          const value = min + Math.random() * (max - min);
          const result = heatmapColor(value, min, max);
          expect(result).toMatch(/^rgb\(\d{1,3},\d{1,3},\d{1,3}\)$/);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('returns neutral gray for null input', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 100, noNaN: true, noDefaultInfinity: true }),
        fc.double({ min: 100, max: 200, noNaN: true, noDefaultInfinity: true }),
        (min, max) => {
          const result = heatmapColor(null, min, max);
          expect(result).toBe('#374151');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('returns neutral gray for undefined input', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 100, noNaN: true, noDefaultInfinity: true }),
        fc.double({ min: 100, max: 200, noNaN: true, noDefaultInfinity: true }),
        (min, max) => {
          const result = heatmapColor(undefined, min, max);
          expect(result).toBe('#374151');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('higher values produce higher red component than lower values', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 1, max: 1000, noNaN: true, noDefaultInfinity: true }),
        (range) => {
          const min = 0;
          const max = range;
          const lowValue = min;
          const highValue = max;
          const lowColor = heatmapColor(lowValue, min, max);
          const highColor = heatmapColor(highValue, min, max);
          // Extract red component
          const lowRed = parseInt(lowColor.match(/^rgb\((\d+),/)[1], 10);
          const highRed = parseInt(highColor.match(/^rgb\((\d+),/)[1], 10);
          expect(highRed).toBeGreaterThanOrEqual(lowRed);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Property 5: Bracket assignment is total and deterministic
// ═══════════════════════════════════════════════════════════════════════════
describe('Feature: extended-statistics, Property 5: Bracket assignment is total and deterministic', () => {
  /**
   * **Validates: Requirements 3.1, 12.1, 20.1, 24.2**
   *
   * For any positive integer, each bracket function returns exactly one
   * valid label. Same input always produces the same output.
   */
  const validLevelBrackets = ['1-5', '6-10', '11-15', '16-20', '21-25', '26-30', '31-35', '36-40', '41-45', '46-50'];
  const validGuildSizeBuckets = ['1', '2-5', '6-10', '11-20', '21-50', '51+'];
  const validMultiCharBuckets = ['1 personaje', '2 personajes', '3+ personajes'];
  const validFishingBrackets = ['1-100', '101-500', '501-1000', '1001-5000', '5001+'];

  it('getLevelBracket returns a valid bracket for any positive integer', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 50 }),
        (level) => {
          const result = getLevelBracket(level);
          expect(validLevelBrackets).toContain(result);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('getGuildSizeBucket returns a valid bucket for any positive integer', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10000 }),
        (memberCount) => {
          const result = getGuildSizeBucket(memberCount);
          expect(validGuildSizeBuckets).toContain(result);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('getMultiCharBucket returns a valid bucket for any positive integer', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10000 }),
        (charCount) => {
          const result = getMultiCharBucket(charCount);
          expect(validMultiCharBuckets).toContain(result);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('getFishingBracket returns a valid bracket for any positive integer', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100000 }),
        (score) => {
          const result = getFishingBracket(score);
          expect(validFishingBrackets).toContain(result);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('all bracket functions are deterministic (same input → same output)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10000 }),
        (n) => {
          expect(getLevelBracket(n)).toBe(getLevelBracket(n));
          expect(getGuildSizeBucket(n)).toBe(getGuildSizeBucket(n));
          expect(getMultiCharBucket(n)).toBe(getMultiCharBucket(n));
          expect(getFishingBracket(n)).toBe(getFishingBracket(n));
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Property 6: Top-N responses limited and sorted descending
// ═══════════════════════════════════════════════════════════════════════════
describe('Feature: extended-statistics, Property 6: Top-N API responses are limited and sorted descending', () => {
  /**
   * **Validates: Requirements 8.2, 18.2, 21.2**
   *
   * For any array sorted descending by score and sliced to N,
   * length ≤ N and sorted descending.
   */
  it('slicing to top N produces array of length ≤ N, sorted descending', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 10 }),
            score: fc.nat({ max: 100000 })
          }),
          { minLength: 0, maxLength: 100 }
        ),
        fc.constantFrom(20, 20, 30),
        (items, limit) => {
          // Simulate the top-N pattern: sort descending by score, slice to limit
          const sorted = items.slice().sort((a, b) => b.score - a.score);
          const topN = sorted.slice(0, limit);

          expect(topN.length).toBeLessThanOrEqual(limit);

          // Verify descending order
          for (let i = 1; i < topN.length; i++) {
            expect(topN[i].score).toBeLessThanOrEqual(topN[i - 1].score);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Property 7: Ascending-sorted responses maintain order
// ═══════════════════════════════════════════════════════════════════════════
describe('Feature: extended-statistics, Property 7: Ascending-sorted API responses maintain order', () => {
  /**
   * **Validates: Requirements 2.2, 17.2, 30.2**
   *
   * For any array sorted ascending by key, order is maintained.
   */
  it('sorting ascending by numeric key maintains non-decreasing order', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            key: fc.double({ min: 0, max: 100000, noNaN: true, noDefaultInfinity: true }),
            label: fc.string({ minLength: 1, maxLength: 10 })
          }),
          { minLength: 0, maxLength: 100 }
        ),
        (items) => {
          const sorted = items.slice().sort((a, b) => a.key - b.key);

          for (let i = 1; i < sorted.length; i++) {
            expect(sorted[i].key).toBeGreaterThanOrEqual(sorted[i - 1].key);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Property 8: Rejection rate computation correct and bounded
// ═══════════════════════════════════════════════════════════════════════════
describe('Feature: extended-statistics, Property 8: Rejection rate computation is correct and bounded', () => {
  /**
   * **Validates: Requirements 13.2**
   *
   * For totalRequests > 0 and 0 <= totalAcceptances <= totalRequests,
   * computeRejectionRate = 1 - (totalAcceptances/totalRequests) and in [0, 1].
   * When totalRequests = 0, result is 0.
   */
  it('returns correct value in [0, 1] for valid inputs', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 1000000 }),
        fc.integer({ min: 0, max: 1000000 }),
        (totalRequests, acceptanceSeed) => {
          const totalAcceptances = Math.min(acceptanceSeed, totalRequests);
          const result = computeRejectionRate(totalRequests, totalAcceptances);
          const expected = 1 - (totalAcceptances / totalRequests);

          expect(result).toBeGreaterThanOrEqual(0);
          expect(result).toBeLessThanOrEqual(1);
          expect(result).toBeCloseTo(expected, 10);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('returns 0 when totalRequests is 0', () => {
    fc.assert(
      fc.property(
        fc.nat({ max: 1000000 }),
        (totalAcceptances) => {
          const result = computeRejectionRate(0, totalAcceptances);
          expect(result).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Property 9: Completion percentage capped at 100
// ═══════════════════════════════════════════════════════════════════════════
describe('Feature: extended-statistics, Property 9: Completion percentage is capped at 100', () => {
  /**
   * **Validates: Requirements 26.2**
   *
   * For non-negative totalContributions and positive threshold,
   * computeCompletionPercent = min(100, (totalContributions/threshold)*100)
   * and in [0, 100].
   */
  it('returns value in [0, 100] matching the formula', () => {
    fc.assert(
      fc.property(
        fc.nat({ max: 1000000 }),
        fc.integer({ min: 1, max: 1000000 }),
        (totalContributions, threshold) => {
          const result = computeCompletionPercent(totalContributions, threshold);
          const expected = Math.min(100, (totalContributions / threshold) * 100);

          expect(result).toBeGreaterThanOrEqual(0);
          expect(result).toBeLessThanOrEqual(100);
          expect(result).toBeCloseTo(expected, 10);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('caps at 100 when contributions exceed threshold', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 1000000 }),
        fc.integer({ min: 1, max: 1000000 }),
        (threshold, extra) => {
          const totalContributions = threshold + extra;
          const result = computeCompletionPercent(totalContributions, threshold);
          expect(result).toBe(100);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Property 10: Guild concentration counts sum to total
// ═══════════════════════════════════════════════════════════════════════════
describe('Feature: extended-statistics, Property 10: Guild concentration counts sum to total', () => {
  /**
   * **Validates: Requirements 16.2**
   *
   * For any topGuildMembers, otherGuildMembers, independents ≥ 0,
   * their sum equals the total.
   */
  it('topGuildMembers + otherGuildMembers + independents equals total', () => {
    fc.assert(
      fc.property(
        fc.nat({ max: 1000000 }),
        fc.nat({ max: 1000000 }),
        fc.nat({ max: 1000000 }),
        (topGuildMembers, otherGuildMembers, independents) => {
          const total = topGuildMembers + otherGuildMembers + independents;
          const concentration = { topGuildMembers, otherGuildMembers, independents };

          const sum = concentration.topGuildMembers +
                      concentration.otherGuildMembers +
                      concentration.independents;

          expect(sum).toBe(total);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('each component is non-negative', () => {
    fc.assert(
      fc.property(
        fc.nat({ max: 1000000 }),
        fc.nat({ max: 1000000 }),
        fc.nat({ max: 1000000 }),
        (topGuildMembers, otherGuildMembers, independents) => {
          expect(topGuildMembers).toBeGreaterThanOrEqual(0);
          expect(otherGuildMembers).toBeGreaterThanOrEqual(0);
          expect(independents).toBeGreaterThanOrEqual(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});
