(function () {
  'use strict';

  // ── 3.1 Dark theme defaults ──────────────────────────────────────────────
  var DARK_PALETTE = [
    '#375a7f', // primary blue
    '#00bc8c', // success green
    '#3498db', // info blue
    '#f39c12', // warning orange
    '#e74c3c', // danger red
    '#9b59b6', // purple
    '#1abc9c', // teal
    '#e67e22', // dark orange
    '#2ecc71', // emerald
    '#fd7e14'  // bright orange
  ];

  if (typeof Chart !== 'undefined') {
    Chart.defaults.color = '#e0e0e0';
    Chart.defaults.borderColor = 'rgba(255, 255, 255, 0.1)';
    Chart.defaults.plugins.tooltip.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    Chart.defaults.plugins.legend.labels.color = '#e0e0e0';
    Chart.defaults.scale.grid = Chart.defaults.scale.grid || {};
    Chart.defaults.scale.grid.color = 'rgba(255, 255, 255, 0.1)';
  }

  // ── 3.2 Loading / error helpers ──────────────────────────────────────────
  function showLoading(containerId) {
    var canvas = document.getElementById(containerId);
    if (!canvas) return;
    var container = canvas.parentNode;
    var loader = document.createElement('div');
    loader.className = 'chart-loading';
    loader.textContent = 'Cargando...';
    container.insertBefore(loader, canvas);
  }

  function showError(containerId, msg) {
    var canvas = document.getElementById(containerId);
    if (!canvas) return;
    var container = canvas.parentNode;
    var loading = container.querySelector('.chart-loading');
    if (loading) loading.remove();
    var err = document.createElement('div');
    err.className = 'chart-error';
    err.textContent = msg || 'No se pudieron cargar las estadísticas.';
    container.appendChild(err);
  }

  // ── 3.3 String normalisation (accent / case insensitive) ─────────────────
  function normalizeStr(str) {
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // strip combining diacriticals
      .replace(/ñ/g, 'n')
      .replace(/ü/g, 'u');
  }

  // ── 3.4 Downsample to one point per calendar day ─────────────────────────
  function downsampleDaily(points) {
    if (!points || points.length === 0) return [];

    // Sort a copy by timestamp ascending so the last one we see per day is
    // the chronologically latest.
    var sorted = points.slice().sort(function (a, b) { return a.x - b.x; });

    var byDay = {};
    sorted.forEach(function (p) {
      var d = new Date(p.x);
      var key = d.getUTCFullYear() + '-' + (d.getUTCMonth() + 1) + '-' + d.getUTCDate();
      byDay[key] = p; // overwrite → keeps last chronological point
    });

    return Object.values(byDay).sort(function (a, b) { return a.x - b.x; });
  }

  // ── 5.1 Pie chart — users by class ────────────────────────────────────────
  function renderPieChart(id, data) {
    var canvas = document.getElementById(id);
    if (!canvas) return null;
    var container = canvas.parentNode;

    // Remove any loading indicator
    var loading = container.querySelector('.chart-loading');
    if (loading) loading.remove();

    if (!data || data.length === 0) {
      var fallback = document.createElement('div');
      fallback.className = 'chart-error';
      fallback.textContent = 'No hay datos disponibles.';
      container.appendChild(fallback);
      return null;
    }

    return new Chart(canvas, {
      type: 'pie',
      data: {
        labels: data.map(function (d) { return d.name; }),
        datasets: [{
          data: data.map(function (d) { return d.y; }),
          backgroundColor: DARK_PALETTE.slice(0, data.length)
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'right',
            labels: { color: '#e0e0e0' }
          },
          tooltip: {
            callbacks: {
              label: function (ctx) {
                return ctx.label + ': ' + ctx.parsed;
              }
            }
          }
        }
      }
    });
  }

  // ── 5.2 Column (vertical bar) chart — classes by race / online by hour ──
  function renderColumnChart(id, seriesData, categories) {
    var canvas = document.getElementById(id);
    if (!canvas) return null;
    var container = canvas.parentNode;

    var loading = container.querySelector('.chart-loading');
    if (loading) loading.remove();

    if (!seriesData || (Array.isArray(seriesData) && seriesData.length === 0)) {
      var fallback = document.createElement('div');
      fallback.className = 'chart-error';
      fallback.textContent = 'No hay datos disponibles.';
      container.appendChild(fallback);
      return null;
    }

    // Normalise: if seriesData is a plain number array, wrap it as a single series
    var datasets;
    if (Array.isArray(seriesData) && typeof seriesData[0] === 'number') {
      datasets = [{
        label: '',
        data: seriesData,
        backgroundColor: DARK_PALETTE[0]
      }];
    } else {
      datasets = seriesData.map(function (s, i) {
        return {
          label: s.name,
          data: s.data,
          backgroundColor: DARK_PALETTE[i % DARK_PALETTE.length]
        };
      });
    }

    return new Chart(canvas, {
      type: 'bar',
      data: {
        labels: categories || [],
        datasets: datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            grid: { color: 'rgba(255,255,255,0.1)' },
            ticks: { color: '#e0e0e0' }
          },
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(255,255,255,0.1)' },
            ticks: { color: '#e0e0e0' }
          }
        },
        plugins: {
          legend: {
            display: datasets.length > 1,
            labels: { color: '#e0e0e0' }
          },
          tooltip: {
            mode: 'index',
            intersect: false
          }
        }
      }
    });
  }

  // ── 5.3 Horizontal bar chart — kills by class ───────────────────────────
  function renderBarChart(id, data) {
    var canvas = document.getElementById(id);
    if (!canvas) return null;
    var container = canvas.parentNode;

    var loading = container.querySelector('.chart-loading');
    if (loading) loading.remove();

    if (!data || data.length === 0) {
      var fallback = document.createElement('div');
      fallback.className = 'chart-error';
      fallback.textContent = 'No hay datos disponibles.';
      container.appendChild(fallback);
      return null;
    }

    return new Chart(canvas, {
      type: 'bar',
      data: {
        labels: data.map(function (d) { return d.name; }),
        datasets: [{
          label: 'Usuarios Matados',
          data: data.map(function (d) { return d.y; }),
          backgroundColor: DARK_PALETTE[0]
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            beginAtZero: true,
            grid: { color: 'rgba(255,255,255,0.1)' },
            ticks: { color: '#e0e0e0' }
          },
          y: {
            grid: { color: 'rgba(255,255,255,0.1)' },
            ticks: { color: '#e0e0e0' }
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: function (ctx) {
                return ctx.parsed.x;
              }
            }
          }
        }
      }
    });
  }

  // ── 5.4 Line chart — users by level ─────────────────────────────────────
  function renderLineChart(id, data) {
    var canvas = document.getElementById(id);
    if (!canvas) return null;
    var container = canvas.parentNode;

    var loading = container.querySelector('.chart-loading');
    if (loading) loading.remove();

    if (!data || data.length === 0) {
      var fallback = document.createElement('div');
      fallback.className = 'chart-error';
      fallback.textContent = 'No hay datos disponibles.';
      container.appendChild(fallback);
      return null;
    }

    // Generate labels starting at level 1
    var labels = data.map(function (_, i) { return i + 1; });

    return new Chart(canvas, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Cantidad de usuarios',
          data: data,
          borderColor: DARK_PALETTE[0],
          backgroundColor: 'rgba(55, 90, 127, 0.2)',
          fill: true,
          tension: 0.1,
          pointRadius: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            title: { display: true, text: 'Nivel', color: '#e0e0e0' },
            grid: { color: 'rgba(255,255,255,0.1)' },
            ticks: { color: '#e0e0e0' }
          },
          y: {
            beginAtZero: true,
            title: { display: true, text: 'Cantidad de usuarios', color: '#e0e0e0' },
            grid: { color: 'rgba(255,255,255,0.1)' },
            ticks: { color: '#e0e0e0' }
          }
        },
        plugins: {
          legend: {
            display: true,
            labels: { color: '#e0e0e0' }
          }
        }
      }
    });
  }

  // ── 6.1 Gold inflation time-series chart ──────────────────────────────────
  function renderGoldInflationChart(id) {
    showLoading(id);

    fetch('https://api.ao20.com.ar:2083/statistics/getGoldStatistics')
      .then(function (response) {
        if (!response.ok) throw new Error('HTTP ' + response.status);
        return response.json();
      })
      .then(function (data) {
        var canvas = document.getElementById(id);
        if (!canvas) return;
        var container = canvas.parentNode;
        var loading = container.querySelector('.chart-loading');
        if (loading) loading.remove();

        if (!data || data.length === 0) {
          var fallback = document.createElement('div');
          fallback.className = 'chart-error';
          fallback.textContent = 'No hay datos disponibles.';
          container.appendChild(fallback);
          return;
        }

        var labels = data.map(function (a) {
          var d = new Date(a.datetime);
          return (d.getMonth() + 1) + '/' + d.getDate() + '/' + d.getFullYear() + ' ' + d.getHours() + ':' + d.getMinutes();
        });

        var seriesDefs = [
          { key: 'gold_total', label: 'Oro Total' },
          { key: 'gold_inventory', label: 'Oro Inventario' },
          { key: 'gold_bank', label: 'Oro en Banco' },
          { key: 'gold_inventory_as_item', label: 'Oro en Inventario como Item' },
          { key: 'gold_bank_as_item', label: 'Oro en Banco como Item' }
        ];

        var datasets = seriesDefs.map(function (s, i) {
          return {
            label: s.label,
            data: data.map(function (a) { return a[s.key]; }),
            borderColor: DARK_PALETTE[i % DARK_PALETTE.length],
            backgroundColor: 'transparent',
            fill: false,
            tension: 0.1,
            pointRadius: 0
          };
        });

        new Chart(canvas, {
          type: 'line',
          data: {
            labels: labels,
            datasets: datasets
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              x: {
                ticks: {
                  color: '#e0e0e0',
                  maxRotation: 45,
                  autoSkip: true
                },
                grid: { color: 'rgba(255,255,255,0.1)' }
              },
              y: {
                title: { display: true, text: 'Oro', color: '#e0e0e0' },
                ticks: { color: '#e0e0e0' },
                grid: { color: 'rgba(255,255,255,0.1)' }
              }
            },
            plugins: {
              legend: {
                display: true,
                labels: { color: '#e0e0e0' }
              },
              tooltip: {
                mode: 'index',
                intersect: false
              }
            }
          }
        });
      })
      .catch(function () {
        showError(id, 'No se pudieron cargar las estadísticas.');
      });
  }

  // ── 6.2 Items quantity time-series chart ─────────────────────────────────
  // Closure variables shared with applyItemsFilter (6.3)
  var chartData = {};
  var allItemNames = [];
  var itemsChart = null;
  var currentQuery = '';

  function renderItemsChart(id) {
    showLoading(id);

    fetch('https://api.ao20.com.ar:2083/statistics/getItemsStatistics')
      .then(function (response) {
        if (!response.ok) throw new Error('HTTP ' + response.status);
        return response.json();
      })
      .then(function (data) {
        var canvas = document.getElementById(id);
        if (!canvas) return;
        var container = canvas.parentNode;
        var loading = container.querySelector('.chart-loading');
        if (loading) loading.remove();

        if (!data || data.length === 0) {
          var fallback = document.createElement('div');
          fallback.className = 'chart-error';
          fallback.textContent = 'No hay datos disponibles.';
          container.appendChild(fallback);
          return;
        }

        // Handle inconsistent API key casing
        var sample = data[0] || {};
        var nameKey = 'NAME' in sample ? 'NAME' : 'name';
        var quantityKey = 'total_quantity' in sample ? 'total_quantity' : 'quantity';
        var datetimeKey = 'datetime' in sample ? 'datetime' : 'date';

        // Group data by item name
        chartData = {};
        data.forEach(function (item) {
          var name = item[nameKey];
          if (!name) return;
          if (!chartData[name]) chartData[name] = [];
          chartData[name].push({
            x: new Date(item[datetimeKey]).getTime(),
            y: Number(item[quantityKey]) || 0
          });
        });

        allItemNames = Object.keys(chartData);

        // Apply downsampleDaily to each item's data
        Object.keys(chartData).forEach(function (name) {
          chartData[name] = downsampleDaily(chartData[name]);
        });

        // Create chart with no datasets — series added via search filter
        itemsChart = new Chart(canvas, {
          type: 'line',
          data: {
            datasets: []
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: false,
            scales: {
              x: {
                type: 'time',
                time: {
                  tooltipFormat: 'dd/MM/yyyy HH:mm',
                  displayFormats: {
                    day: 'dd/MM/yy'
                  }
                },
                ticks: {
                  color: '#e0e0e0',
                  maxRotation: 45
                },
                grid: { color: 'rgba(255,255,255,0.1)' }
              },
              y: {
                title: { display: true, text: 'Cantidad', color: '#e0e0e0' },
                beginAtZero: true,
                ticks: { color: '#e0e0e0' },
                grid: { color: 'rgba(255,255,255,0.1)' }
              }
            },
            plugins: {
              legend: {
                display: true,
                labels: { color: '#e0e0e0' }
              },
              zoom: {
                zoom: {
                  wheel: { enabled: true },
                  mode: 'x'
                },
                pan: {
                  enabled: true,
                  mode: 'x'
                }
              }
            },
            elements: {
              point: { radius: 0 }
            }
          }
        });

        // Wire up search/filter event listeners
        var searchInput = document.getElementById('itemsSearch');
        var clearBtn = document.getElementById('itemsSearchClear');
        if (searchInput) {
          searchInput.addEventListener('input', function () {
            applyItemsFilter(searchInput.value);
          });
        }
        if (clearBtn) {
          clearBtn.addEventListener('click', function () {
            if (searchInput) searchInput.value = '';
            applyItemsFilter('');
          });
        }
      })
      .catch(function () {
        showError(id, 'No se pudieron cargar las estadísticas.');
      });
  }

  // ── 6.3 Items search/filter ──────────────────────────────────────────────
  function applyItemsFilter(query) {
    var terms = normalizeStr(query.trim()).split(/\s+/).filter(function (t) { return t.length >= 2; });
    var termKey = terms.join('|');
    if (termKey === currentQuery) return;
    currentQuery = termKey;

    if (!itemsChart) return;

    // Remove all existing datasets
    itemsChart.data.datasets = [];

    var countEl = document.getElementById('itemsSearchCount');
    var clearBtn = document.getElementById('itemsSearchClear');

    if (terms.length === 0) {
      itemsChart.update();
      if (countEl) countEl.textContent = 'Escribí al menos 2 caracteres para buscar';
      if (clearBtn) clearBtn.style.display = 'none';
      return;
    }

    var matched = allItemNames.filter(function (name) {
      var n = normalizeStr(name);
      return terms.some(function (t) { return n.indexOf(t) !== -1; });
    });

    var colorIdx = 0;
    matched.forEach(function (name) {
      var pts = chartData[name];
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
    });

    itemsChart.update();
    if (countEl) countEl.textContent = matched.length + ' resultado' + (matched.length !== 1 ? 's' : '') + ' de ' + allItemNames.length + ' items';
    if (clearBtn) clearBtn.style.display = '';
  }

  // ── 7.1 Static charts orchestration ────────────────────────────────────
  var STATIC_CHART_IDS = [
    'chartUsuariosPorClase',
    'chartClasesPorRaza',
    'chartUsuariosMatadosPorClase',
    'chartUsuariosPorLevel',
    'chartUsuariosOnlinePorHora'
  ];

  var CLASS_CATEGORIES = [
    'Mago', 'Clérigo', 'Guerrero', 'Asesino', 'Bardo',
    'Druida', 'Paladin', 'Cazador', 'Trabajador', 'Bandido'
  ];

  function initStaticCharts() {
    // Show loading on all static chart containers
    STATIC_CHART_IDS.forEach(function (id) { showLoading(id); });

    fetch('api_charts.php')
      .then(function (response) {
        if (!response.ok) throw new Error('HTTP ' + response.status);
        return response.json();
      })
      .then(function (data) {
        // Generate hour categories ['00:00', '01:00', ..., '23:00']
        var hourCategories = [];
        for (var h = 0; h < 24; h++) {
          hourCategories.push((h < 10 ? '0' : '') + h + ':00');
        }

        renderPieChart('chartUsuariosPorClase', data.usuariosPorClase);
        renderColumnChart('chartClasesPorRaza', data.clasesPorRaza, CLASS_CATEGORIES);
        renderBarChart('chartUsuariosMatadosPorClase', data.killsPorClase);
        renderLineChart('chartUsuariosPorLevel', data.usuariosPorLevel);
        renderColumnChart('chartUsuariosOnlinePorHora', data.onlinePorHora, hourCategories);
      })
      .catch(function () {
        STATIC_CHART_IDS.forEach(function (id) {
          showError(id, 'No se pudieron cargar las estadísticas.');
        });
      });
  }

  // ── 7.2 DOMContentLoaded — kick off all data fetches in parallel ────────
  document.addEventListener('DOMContentLoaded', function () {
    initStaticCharts();
    renderGoldInflationChart('goldInflation');
    renderItemsChart('itemsQuantity');
  });

  // ── Export for testing ───────────────────────────────────────────────────
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      normalizeStr: normalizeStr,
      downsampleDaily: downsampleDaily,
      showLoading: showLoading,
      showError: showError,
      DARK_PALETTE: DARK_PALETTE,
      renderPieChart: renderPieChart,
      renderColumnChart: renderColumnChart,
      renderBarChart: renderBarChart,
      renderLineChart: renderLineChart,
      renderGoldInflationChart: renderGoldInflationChart,
      renderItemsChart: renderItemsChart,
      applyItemsFilter: applyItemsFilter,
      initStaticCharts: initStaticCharts
    };
  }
})();
