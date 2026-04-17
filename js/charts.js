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

  // ── 4.1 Pure helper functions ──────────────────────────────────────────────

  function bucketValues(values, width) {
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
  }

  function topN(items, scoreKey, n) {
    var copy = items.slice();
    copy.sort(function (a, b) { return b[scoreKey] - a[scoreKey]; });
    return copy.slice(0, n);
  }

  function guildAlignmentColor(alignment) {
    if (alignment === 1) return '#00bc8c';
    if (alignment === 2) return '#e74c3c';
    return '#6c757d';
  }

  function computeKdRatio(kills, deaths) {
    if (deaths > 0) return kills / deaths;
    return kills;
  }

  function computeProgressPercent(current, threshold) {
    if (threshold === 0) return 0;
    return Math.min(100, (current / threshold) * 100);
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

  // ── 5.5 Guild chart — horizontal bar with alignment colors ────────────────
  function renderGuildChart(id, data) {
    var canvas = document.getElementById(id);
    if (!canvas) return null;
    var container = canvas.parentNode;

    var loading = container.querySelector('.chart-loading');
    if (loading) loading.remove();

    if (!data || data.length === 0) {
      var fallback = document.createElement('div');
      fallback.className = 'chart-error';
      fallback.textContent = 'No hay datos de guilds disponibles.';
      container.appendChild(fallback);
      return null;
    }

    return new Chart(canvas, {
      type: 'bar',
      data: {
        labels: data.map(function (d) { return d.name; }),
        datasets: [{
          label: 'Miembros',
          data: data.map(function (d) { return d.members; }),
          backgroundColor: data.map(function (d) { return guildAlignmentColor(d.alignment); })
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
                var item = data[ctx.dataIndex];
                return item.name + ' - Nivel ' + item.level + ', ' + item.members + ' miembros';
              }
            }
          }
        }
      }
    });
  }

  // ── 5.6 Faction chart — grouped bar Real vs Caos ─────────────────────────
  function renderFactionChart(id, data) {
    var canvas = document.getElementById(id);
    if (!canvas) return null;
    var container = canvas.parentNode;

    var loading = container.querySelector('.chart-loading');
    if (loading) loading.remove();

    if (!data || (!data.real && !data.caos)) {
      var fallback = document.createElement('div');
      fallback.className = 'chart-error';
      fallback.textContent = 'No hay datos de facciones disponibles.';
      container.appendChild(fallback);
      return null;
    }

    var real = data.real || { players: 0, avgScore: 0, totalKills: 0 };
    var caos = data.caos || { players: 0, avgScore: 0, totalKills: 0 };

    return new Chart(canvas, {
      type: 'bar',
      data: {
        labels: ['Jugadores', 'Puntaje Promedio', 'Kills Totales'],
        datasets: [
          {
            label: 'Real',
            data: [real.players, real.avgScore, real.totalKills],
            backgroundColor: '#00bc8c'
          },
          {
            label: 'Caos',
            data: [caos.players, caos.avgScore, caos.totalKills],
            backgroundColor: '#e74c3c'
          }
        ]
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
  }

  // ── 5.7 Global quest progress — HTML progress bars ───────────────────────
  function renderGlobalQuestProgress(containerId, data) {
    var container = document.getElementById(containerId);
    if (!container) return null;

    var loading = container.querySelector('.chart-loading');
    if (loading) loading.remove();

    if (!data || data.length === 0) {
      var fallback = document.createElement('div');
      fallback.className = 'chart-error';
      fallback.textContent = 'No hay eventos globales activos.';
      container.appendChild(fallback);
      return null;
    }

    for (var i = 0; i < data.length; i++) {
      var quest = data[i];
      var pct = computeProgressPercent(quest.current, quest.threshold);
      var rounded = Math.round(pct);

      var wrapper = document.createElement('div');
      wrapper.className = 'mb-3';

      var label = document.createElement('div');
      label.className = 'mb-1';
      label.textContent = quest.name;

      var progressDiv = document.createElement('div');
      progressDiv.className = 'progress';

      var bar = document.createElement('div');
      bar.className = 'progress-bar';
      bar.style.width = rounded + '%';
      bar.setAttribute('role', 'progressbar');
      bar.setAttribute('aria-valuenow', String(rounded));
      bar.setAttribute('aria-valuemin', '0');
      bar.setAttribute('aria-valuemax', '100');
      bar.textContent = rounded + '%';

      progressDiv.appendChild(bar);
      wrapper.appendChild(label);
      wrapper.appendChild(progressDiv);
      container.appendChild(wrapper);
    }

    return null;
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
  var selectedItems = new Set();
  var MAX_SELECTED = 20;

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

  function updateItemsChart() {
    if (!itemsChart) return;

    itemsChart.data.datasets = [];

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

  function toggleItemSelection(itemName) {
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
      })
      .catch(function () {
        showError(id, 'No se pudieron cargar las estadísticas.');
      });
  }

  // ── 6.3 Items search/filter ──────────────────────────────────────────────
  function applyItemsFilter(query) {
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

    // Populate results list (max 20 visible)
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

  // ── 7.1 Static charts orchestration ────────────────────────────────────
  var STATIC_CHART_IDS = [
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
    'chartQuestCompletion',
    'chartGenderDistribution',
    'chartTopNpcHunters'
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
        renderPieChart('chartUsuariosPorClase', data.usuariosPorClase);
        renderColumnChart('chartClasesPorRaza', data.clasesPorRaza, CLASS_CATEGORIES);
        renderBarChart('chartUsuariosMatadosPorClase', data.killsPorClase);
        renderLineChart('chartUsuariosPorLevel', data.usuariosPorLevel);

        // ── New charts ──

        // ELO Distribution — check if all counts are zero
        var eloData = data.eloDistribution;
        var eloAllZero = !eloData || eloData.length === 0 || eloData.every(function (d) { return d.count === 0; });
        if (eloAllZero) {
          var eloCanvas = document.getElementById('chartEloDistribution');
          if (eloCanvas) {
            var eloContainer = eloCanvas.parentNode;
            var eloLoading = eloContainer.querySelector('.chart-loading');
            if (eloLoading) eloLoading.remove();
            var eloFallback = document.createElement('div');
            eloFallback.className = 'chart-error';
            eloFallback.textContent = 'No hay datos de PvP disponibles.';
            eloContainer.appendChild(eloFallback);
          }
        } else {
          renderColumnChart('chartEloDistribution', eloData.map(function (d) { return d.count; }), eloData.map(function (d) { return d.bucket; }));
        }

        // Top Guilds — renderGuildChart handles its own fallback
        renderGuildChart('chartTopGuilds', data.topGuilds);

        // Gold by Level Range — grouped column with 2 series
        var goldData = data.goldByLevelRange;
        if (goldData && goldData.length > 0) {
          var averages = goldData.map(function (d) { return d.average; });
          var medians = goldData.map(function (d) { return d.median; });
          var rangeLabels = goldData.map(function (d) { return d.range; });
          renderColumnChart('chartGoldByLevel', [{ name: 'Promedio', data: averages }, { name: 'Mediana', data: medians }], rangeLabels);
        } else {
          renderColumnChart('chartGoldByLevel', [], []);
        }

        // K/D Ratio by Class
        renderBarChart('chartKdRatio', data.kdRatioByClass);

        // Faction Summary — renderFactionChart handles its own fallback
        renderFactionChart('chartFactionSummary', data.factionSummary);

        // Fishing Leaderboard — check for empty/all-zero
        var fishData = data.fishingLeaderboard;
        var fishEmpty = !fishData || fishData.length === 0 || fishData.every(function (d) { return d.y === 0; });
        if (fishEmpty) {
          var fishCanvas = document.getElementById('chartFishingLeaderboard');
          if (fishCanvas) {
            var fishContainer = fishCanvas.parentNode;
            var fishLoading = fishContainer.querySelector('.chart-loading');
            if (fishLoading) fishLoading.remove();
            var fishFallback = document.createElement('div');
            fishFallback.className = 'chart-error';
            fishFallback.textContent = 'No hay datos de pesca disponibles.';
            fishContainer.appendChild(fishFallback);
          }
        } else {
          renderBarChart('chartFishingLeaderboard', fishData);
        }

        // Quest Completion — check for empty
        var questData = data.questCompletion;
        var questEmpty = !questData || questData.length === 0;
        if (questEmpty) {
          var questCanvas = document.getElementById('chartQuestCompletion');
          if (questCanvas) {
            var questContainer = questCanvas.parentNode;
            var questLoading = questContainer.querySelector('.chart-loading');
            if (questLoading) questLoading.remove();
            var questFallback = document.createElement('div');
            questFallback.className = 'chart-error';
            questFallback.textContent = 'No hay datos de quests disponibles.';
            questContainer.appendChild(questFallback);
          }
        } else {
          renderColumnChart('chartQuestCompletion', questData.map(function (d) { return d.count; }), questData.map(function (d) { return d.bucket; }));
        }

        // Gender Distribution
        renderPieChart('chartGenderDistribution', data.genderDistribution);

        // Global Quest Progress — renderGlobalQuestProgress handles its own fallback
        renderGlobalQuestProgress('chartGlobalQuestProgress', data.globalQuestProgress);

        // Top NPC Hunters — check for empty/all-zero
        var npcData = data.topNpcHunters;
        var npcEmpty = !npcData || npcData.length === 0 || npcData.every(function (d) { return d.y === 0; });
        if (npcEmpty) {
          var npcCanvas = document.getElementById('chartTopNpcHunters');
          if (npcCanvas) {
            var npcContainer = npcCanvas.parentNode;
            var npcLoading = npcContainer.querySelector('.chart-loading');
            if (npcLoading) npcLoading.remove();
            var npcFallback = document.createElement('div');
            npcFallback.className = 'chart-error';
            npcFallback.textContent = 'No hay datos de NPCs cazados disponibles.';
            npcContainer.appendChild(npcFallback);
          }
        } else {
          renderBarChart('chartTopNpcHunters', npcData);
        }
      })
      .catch(function () {
        STATIC_CHART_IDS.forEach(function (id) {
          showError(id, 'No se pudieron cargar las estadísticas.');
        });
        // chartGlobalQuestProgress is a div, not canvas — handle separately
        var gqContainer = document.getElementById('chartGlobalQuestProgress');
        if (gqContainer) {
          var gqLoading = gqContainer.querySelector('.chart-loading');
          if (gqLoading) gqLoading.remove();
          var gqErr = document.createElement('div');
          gqErr.className = 'chart-error';
          gqErr.textContent = 'No se pudieron cargar las estadísticas.';
          gqContainer.appendChild(gqErr);
        }
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
      bucketValues: bucketValues,
      topN: topN,
      guildAlignmentColor: guildAlignmentColor,
      computeKdRatio: computeKdRatio,
      computeProgressPercent: computeProgressPercent,
      showLoading: showLoading,
      showError: showError,
      DARK_PALETTE: DARK_PALETTE,
      renderPieChart: renderPieChart,
      renderColumnChart: renderColumnChart,
      renderBarChart: renderBarChart,
      renderLineChart: renderLineChart,
      renderGuildChart: renderGuildChart,
      renderFactionChart: renderFactionChart,
      renderGlobalQuestProgress: renderGlobalQuestProgress,
      renderGoldInflationChart: renderGoldInflationChart,
      renderItemsChart: renderItemsChart,
      applyItemsFilter: applyItemsFilter,
      initStaticCharts: initStaticCharts,
      toggleItemSelection: toggleItemSelection,
      updateItemsChart: updateItemsChart,
      updateSelectedTags: updateSelectedTags,
      clearAllSelections: clearAllSelections,
      get selectedItems() { return selectedItems; },
      MAX_SELECTED: MAX_SELECTED,
      chartData: chartData,
      get allItemNames() { return allItemNames; },
      set allItemNames(v) { allItemNames = v; },
      get itemsChart() { return itemsChart; },
      set itemsChart(v) { itemsChart = v; }
    };
  }
})();
