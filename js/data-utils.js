/**
 * js/data-utils.js — Pure helper functions under AO20.utils.
 *
 * No DOM or Chart.js dependencies. Must be loaded after js/config.js.
 */
AO20.utils = {

  /**
   * Normalise a string for accent/case-insensitive comparison.
   * Lowercases, strips combining diacriticals, replaces ñ→n and ü→u.
   */
  normalizeStr: function (str) {
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/ñ/g, 'n')
      .replace(/ü/g, 'u');
  },

  /**
   * Downsample time-series points to one point per UTC calendar day,
   * keeping the last chronological point for each day.
   * @param {Array<{x: number, y: number}>} points
   * @returns {Array<{x: number, y: number}>}
   */
  downsampleDaily: function (points) {
    if (!points || points.length === 0) return [];

    var sorted = points.slice().sort(function (a, b) { return a.x - b.x; });

    var byDay = {};
    sorted.forEach(function (p) {
      var d = new Date(p.x);
      var key = d.getUTCFullYear() + '-' + (d.getUTCMonth() + 1) + '-' + d.getUTCDate();
      byDay[key] = p;
    });

    return Object.values(byDay).sort(function (a, b) { return a.x - b.x; });
  },

  /**
   * Filter time-series points, keeping only those on or after minDate.
   * @param {Array<{x: number, y: number}>} points
   * @param {Date} minDate
   * @returns {Array<{x: number, y: number}>}
   */
  filterBeforeDate: function (points, minDate) {
    var threshold = minDate.getTime();
    return points.filter(function (p) { return p.x >= threshold; });
  },

  /**
   * Group numeric values into fixed-width buckets.
   * @param {number[]} values
   * @param {number} width  Bucket width (e.g. 100)
   * @returns {Array<{bucket: string, count: number}>}
   */
  bucketValues: function (values, width) {
    var buckets = {};
    var starts = [];
    for (var i = 0; i < values.length; i++) {
      var start = Math.floor(values[i] / width) * width;
      if (!(start in buckets)) {
        buckets[start] = 0;
        starts.push(start);
      }
      buckets[start]++;
    }
    starts.sort(function (a, b) { return a - b; });
    var result = [];
    for (var j = 0; j < starts.length; j++) {
      var s = starts[j];
      result.push({ bucket: s + '-' + (s + width - 1), count: buckets[s] });
    }
    return result;
  },

  /**
   * Return the top N items sorted descending by a numeric key.
   * @param {Array<Object>} items
   * @param {string} scoreKey
   * @param {number} n
   * @returns {Array<Object>}
   */
  topN: function (items, scoreKey, n) {
    var copy = items.slice();
    copy.sort(function (a, b) { return b[scoreKey] - a[scoreKey]; });
    return copy.slice(0, n);
  },

  /**
   * Return a hex colour for a guild alignment value.
   * 1 = Real (green), 2 = Caos (red), anything else = Neutral (gray).
   */
  guildAlignmentColor: function (alignment) {
    if (alignment === 1) return '#00bc8c';
    if (alignment === 2) return '#e74c3c';
    return '#6c757d';
  },

  /**
   * Compute kill/death ratio. Returns kills when deaths is 0.
   */
  computeKdRatio: function (kills, deaths) {
    if (deaths > 0) return kills / deaths;
    return kills;
  },

  /**
   * Compute progress as a percentage, capped at 100.
   * Returns 0 when threshold is 0.
   */
  computeProgressPercent: function (current, threshold) {
    if (threshold === 0) return 0;
    return Math.min(100, (current / threshold) * 100);
  }
};

// ── Export for testing ─────────────────────────────────────────────────────
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AO20;
}
