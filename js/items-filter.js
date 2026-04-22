/**
 * js/items-filter.js — Items search/filter logic under AO20.itemsFilter.
 *
 * Manages item selection state, search filtering, tag display, and chart updates
 * for the items quantity time-series chart.
 *
 * Must be loaded after js/config.js and js/data-utils.js.
 * Receives chart data from renderers.js via the init() function.
 */
AO20.itemsFilter = (function () {
  'use strict';

  var chartData = {};
  var allItemNames = [];
  var itemsChart = null;
  var selectedItems = new Set();

  /**
   * Initialise the items filter with data from the renderer.
   * Called by AO20.renderers.renderItemsChart after data is loaded.
   * @param {Object} data  - Map of item name → [{x, y}] points
   * @param {string[]} names - All item names
   * @param {Object} chart  - The Chart.js instance
   */
  function init(data, names, chart) {
    chartData = data;
    allItemNames = names;
    itemsChart = chart;

    // Wire up search/filter event listeners
    var searchInput = document.getElementById('itemsSearch');
    var clearBtn = document.getElementById('itemsSearchClear');
    if (searchInput) {
      searchInput.disabled = false;
      searchInput.placeholder = 'Buscar items (ej: leña barca mineral)';
      searchInput.addEventListener('input', function () {
        applyItemsFilter(searchInput.value);
      });
    }
    if (clearBtn) {
      clearBtn.addEventListener('click', function () {
        if (searchInput) searchInput.value = '';
        clearAllSelections();
        var countEl = document.getElementById('itemsSearchCount');
        if (countEl) countEl.textContent = '';
      });
    }

    // Select random items on first load
    requestAnimationFrame(function () {
      try {
        selectRandomItems();
      } catch (e) {
        console.error('Error selecting random items:', e);
      }
    });
  }

  /**
   * Update the selected-items tag badges in the DOM.
   */
  function updateSelectedTags() {
    var container = document.getElementById('itemsSelectedTags');
    if (!container) return;
    container.innerHTML = '';

    selectedItems.forEach(function (name) {
      var badge = document.createElement('span');
      badge.className = 'badge bg-primary me-1 mb-1';
      badge.textContent = name;

      var btn = document.createElement('button');
      btn.className = 'btn-close btn-close-white ms-1';
      btn.setAttribute('aria-label', 'Quitar');
      btn.style.fontSize = '0.55em';
      btn.addEventListener('click', function () {
        toggleItemSelection(name);
      });

      badge.appendChild(btn);
      container.appendChild(badge);
    });
  }

  /**
   * Clear all selected items and reset the chart and UI.
   */
  function clearAllSelections() {
    selectedItems.clear();
    updateItemsChart();
    updateSelectedTags();

    var resultsList = document.getElementById('itemsResultsList');
    if (resultsList) {
      resultsList.style.display = 'none';
    }

    var limitMsg = document.getElementById('itemsLimitMsg');
    if (limitMsg) {
      limitMsg.textContent = '';
      limitMsg.style.display = 'none';
    }
  }

  /**
   * Rebuild the chart datasets from the current selectedItems set.
   */
  function updateItemsChart() {
    if (!itemsChart) return;

    itemsChart.data.datasets = [];

    var DARK_PALETTE = AO20.config.DARK_PALETTE;
    var colorIdx = 0;
    selectedItems.forEach(function (name) {
      var pts = chartData[name];
      if (pts) {
        itemsChart.data.datasets.push({
          label: name,
          data: pts,
          borderColor: DARK_PALETTE[colorIdx % DARK_PALETTE.length],
          backgroundColor: 'transparent',
          fill: false,
          tension: 0.1,
          pointRadius: 0
        });
        colorIdx++;
      }
    });

    itemsChart.update();
  }

  /**
   * Toggle an item's selection state. Enforces MAX_SELECTED limit.
   * @param {string} itemName
   */
  function toggleItemSelection(itemName) {
    var MAX_SELECTED = AO20.config.MAX_SELECTED;

    if (selectedItems.has(itemName)) {
      selectedItems.delete(itemName);
    } else if (selectedItems.size < MAX_SELECTED) {
      selectedItems.add(itemName);
    } else {
      // Show limit message
      var limitMsg = document.getElementById('itemsLimitMsg');
      if (limitMsg) {
        limitMsg.textContent = 'Se alcanzó el límite máximo de ' + MAX_SELECTED + ' items.';
        limitMsg.style.display = '';
        setTimeout(function () {
          limitMsg.style.display = 'none';
          limitMsg.textContent = '';
        }, 2000);
      }
      return;
    }

    updateItemsChart();
    updateSelectedTags();

    // Update visual state in results list if visible
    var resultsList = document.getElementById('itemsResultsList');
    if (resultsList) {
      var items = resultsList.querySelectorAll('.list-group-item');
      for (var i = 0; i < items.length; i++) {
        if (items[i].textContent === itemName) {
          if (selectedItems.has(itemName)) {
            items[i].classList.add('active');
          } else {
            items[i].classList.remove('active');
          }
          break;
        }
      }
    }
  }

  /**
   * Select a random set of items that have meaningful data (max y > 0).
   */
  function selectRandomItems() {
    if (allItemNames.length === 0) return;

    var DEFAULT_RANDOM_COUNT = AO20.config.DEFAULT_RANDOM_COUNT;

    // Filter to items that have meaningful data (max value > 0)
    var candidates = allItemNames.filter(function (name) {
      var pts = chartData[name];
      if (!pts || pts.length === 0) return false;
      var maxVal = 0;
      for (var i = 0; i < pts.length; i++) {
        if (pts[i].y > maxVal) maxVal = pts[i].y;
      }
      return maxVal > 0;
    });

    if (candidates.length === 0) return;

    var k = Math.min(candidates.length, DEFAULT_RANDOM_COUNT);
    var copy = candidates.slice();
    for (var i = copy.length - 1; i > copy.length - 1 - k; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var temp = copy[i];
      copy[i] = copy[j];
      copy[j] = temp;
    }
    for (var n = copy.length - k; n < copy.length; n++) {
      selectedItems.add(copy[n]);
    }
    updateItemsChart();
    updateSelectedTags();
  }

  /**
   * Filter allItemNames by a search query and display matching results.
   * @param {string} query - The search string (space-separated terms)
   */
  function applyItemsFilter(query) {
    var normalizeStr = AO20.utils.normalizeStr;
    var MAX_SELECTED = AO20.config.MAX_SELECTED;
    var terms = normalizeStr(query.trim()).split(/\s+/).filter(function (t) { return t.length >= 2; });

    var resultsList = document.getElementById('itemsResultsList');
    var countEl = document.getElementById('itemsSearchCount');
    var clearBtn = document.getElementById('itemsSearchClear');

    // If query has no valid terms (< 2 chars each): hide list, show guide text
    if (terms.length === 0) {
      if (resultsList) {
        resultsList.innerHTML = '';
        resultsList.style.display = 'none';
      }
      if (countEl) countEl.textContent = query.trim().length > 0 ? 'Escribí al menos 2 caracteres para buscar' : '';
      if (clearBtn) clearBtn.style.display = query.trim().length > 0 ? '' : 'none';
      return;
    }

    // Filter allItemNames using normalizeStr
    var matched = allItemNames.filter(function (name) {
      var n = normalizeStr(name);
      return terms.some(function (t) { return n.indexOf(t) !== -1; });
    });

    // Show clear button when there's a query
    if (clearBtn) clearBtn.style.display = '';

    // Update counter with appropriate format
    if (countEl) {
      if (matched.length > MAX_SELECTED) {
        countEl.textContent = 'Mostrando ' + MAX_SELECTED + ' de ' + matched.length + ' resultados';
      } else {
        countEl.textContent = matched.length + ' resultado' + (matched.length !== 1 ? 's' : '') + ' de ' + allItemNames.length + ' items';
      }
    }

    // Populate results list (max MAX_SELECTED visible)
    if (resultsList) {
      resultsList.innerHTML = '';

      if (matched.length === 0) {
        resultsList.style.display = 'none';
        return;
      }

      var visible = matched.slice(0, MAX_SELECTED);
      visible.forEach(function (name) {
        var a = document.createElement('a');
        a.className = 'list-group-item list-group-item-action';
        if (selectedItems.has(name)) {
          a.classList.add('active');
        }
        a.textContent = name;
        a.href = '#';
        a.addEventListener('click', function (e) {
          e.preventDefault();
          toggleItemSelection(name);
          // Re-apply filter to refresh visual state of the list
          applyItemsFilter(query);
        });
        resultsList.appendChild(a);
      });

      resultsList.style.display = '';
    }
  }

  // ── Public API ─────────────────────────────────────────────────────────
  return {
    init: init,
    applyItemsFilter: applyItemsFilter,
    toggleItemSelection: toggleItemSelection,
    updateItemsChart: updateItemsChart,
    updateSelectedTags: updateSelectedTags,
    clearAllSelections: clearAllSelections,
    selectRandomItems: selectRandomItems,

    // Accessors for state (used by tests and external modules)
    get chartData() { return chartData; },
    set chartData(v) { chartData = v; },
    get allItemNames() { return allItemNames; },
    set allItemNames(v) { allItemNames = v; },
    get itemsChart() { return itemsChart; },
    set itemsChart(v) { itemsChart = v; },
    get selectedItems() { return selectedItems; }
  };
})();

// ── Export for testing ─────────────────────────────────────────────────────
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AO20;
}
