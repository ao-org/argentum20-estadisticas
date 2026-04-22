/**
 * js/config.js — AO20 namespace, shared constants, and Chart.js dark theme defaults.
 *
 * This file MUST be loaded before all other AO20 modules.
 */
var AO20 = AO20 || {};

AO20.config = {
  DARK_PALETTE: [
    '#e74c3c', // red
    '#3498db', // blue
    '#2ecc71', // emerald
    '#f39c12', // orange
    '#9b59b6', // purple
    '#1abc9c', // teal
    '#e67e22', // dark orange
    '#00bc8c', // green
    '#fd7e14', // bright orange
    '#375a7f', // navy
    '#e84393', // pink
    '#00cec9', // cyan
    '#fdcb6e', // yellow
    '#6c5ce7', // indigo
    '#d63031', // crimson
    '#74b9ff', // light blue
    '#a29bfe', // lavender
    '#55efc4', // mint
    '#fab1a0', // salmon
    '#81ecec'  // aqua
  ],

  /** Game server launch date — earliest date shown on time-series charts. */
  MIN_DATE: new Date('2024-09-29T00:00:00Z'),

  /** Maximum number of items that can be selected in the items filter. */
  MAX_SELECTED: 20,

  /** Number of random items selected on first load. */
  DEFAULT_RANDOM_COUNT: 10,

  /** Canonical class names used as column-chart categories. */
  CLASS_CATEGORIES: [
    'Mago', 'Clérigo', 'Guerrero', 'Asesino', 'Bardo',
    'Druida', 'Paladin', 'Cazador', 'Trabajador', 'Bandido'
  ],

  /** Canvas IDs for the static (api_charts.php) charts. */
  STATIC_CHART_IDS: [
    'chartUsuariosPorClase',
    'chartClasesPorRaza',
    'chartUsuariosMatadosPorClase',
    'chartUsuariosPorLevel',
    'chartEloDistribution',
    'chartTopGuilds',
    'chartGoldByLevel',
    'chartKdRatio',
    'chartFactionSummary',
    'chartFishingLeaderboard',
    'chartGenderDistribution',
    'chartTopNpcHunters'
  ]
};

// ── Chart.js dark theme defaults ───────────────────────────────────────────
if (typeof Chart !== 'undefined') {
  Chart.defaults.color = '#e0e0e0';
  Chart.defaults.borderColor = 'rgba(255, 255, 255, 0.1)';
  Chart.defaults.plugins.tooltip.backgroundColor = 'rgba(0, 0, 0, 0.8)';
  Chart.defaults.plugins.legend.labels.color = '#e0e0e0';
  Chart.defaults.scale.grid = Chart.defaults.scale.grid || {};
  Chart.defaults.scale.grid.color = 'rgba(255, 255, 255, 0.1)';
}

// ── Export for testing ─────────────────────────────────────────────────────
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AO20;
}
