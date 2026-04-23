/**
 * js/theme-toggle.js — Dark / Light theme toggle with localStorage persistence.
 *
 * Uses DaisyUI data-theme attribute. Dark = "night", Light = "light".
 * Also updates Chart.js global defaults so new and existing charts match.
 */
(function () {
  var DARK = 'night';
  var LIGHT = 'light';
  var STORAGE_KEY = 'ao20-theme';

  var html = document.documentElement;
  var toggle = document.getElementById('themeToggle');

  // Chart.js color sets per theme
  var themes = {
    night: {
      color: '#e0e0e0',
      borderColor: 'rgba(255, 255, 255, 0.1)',
      tooltipBg: 'rgba(0, 0, 0, 0.8)',
      gridColor: 'rgba(255, 255, 255, 0.1)'
    },
    light: {
      color: '#374151',
      borderColor: 'rgba(0, 0, 0, 0.1)',
      tooltipBg: 'rgba(0, 0, 0, 0.75)',
      gridColor: 'rgba(0, 0, 0, 0.08)'
    }
  };

  function applyTheme(theme) {
    html.setAttribute('data-theme', theme);
    // Checkbox checked = light mode (swap-on shows moon)
    if (toggle) toggle.checked = theme === LIGHT;
    localStorage.setItem(STORAGE_KEY, theme);
    updateChartColors(theme);
  }

  function updateChartColors(theme) {
    if (typeof Chart === 'undefined') return;
    var t = themes[theme] || themes[DARK];

    Chart.defaults.color = t.color;
    Chart.defaults.borderColor = t.borderColor;
    Chart.defaults.plugins.tooltip.backgroundColor = t.tooltipBg;
    Chart.defaults.plugins.legend.labels.color = t.color;
    Chart.defaults.scale.grid = Chart.defaults.scale.grid || {};
    Chart.defaults.scale.grid.color = t.gridColor;

    // Update all existing chart instances
    Object.keys(Chart.instances || {}).forEach(function (id) {
      var chart = Chart.instances[id];
      if (!chart) return;

      // Update scale colors
      Object.keys(chart.options.scales || {}).forEach(function (scaleId) {
        var scale = chart.options.scales[scaleId];
        if (scale.grid) scale.grid.color = t.gridColor;
        if (scale.ticks) scale.ticks.color = t.color;
      });

      // Update legend + tooltip
      if (chart.options.plugins) {
        if (chart.options.plugins.legend && chart.options.plugins.legend.labels) {
          chart.options.plugins.legend.labels.color = t.color;
        }
        if (chart.options.plugins.tooltip) {
          chart.options.plugins.tooltip.backgroundColor = t.tooltipBg;
        }
      }

      chart.update('none'); // no animation for instant switch
    });
  }

  // Restore saved preference or default to dark
  var saved = localStorage.getItem(STORAGE_KEY);
  applyTheme(saved === LIGHT ? LIGHT : DARK);

  // Listen for toggle clicks
  if (toggle) {
    toggle.addEventListener('change', function () {
      applyTheme(toggle.checked ? LIGHT : DARK);
    });
  }
})();
