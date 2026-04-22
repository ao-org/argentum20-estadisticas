/**
 * js/init.js — DOMContentLoaded orchestrator.
 *
 * Must be loaded last, after: config.js, data-utils.js, renderers.js,
 * items-filter.js, navigation.js.
 */

function initApp() {
  AO20.navigation.init();
  AO20.renderers.initStaticCharts();
  AO20.renderers.renderGoldInflationChart('goldInflation');
  AO20.renderers.renderItemsChart('itemsQuantity');
}

document.addEventListener('DOMContentLoaded', initApp);

// ── Export for testing ─────────────────────────────────────────────────────
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { initApp: initApp };
}
