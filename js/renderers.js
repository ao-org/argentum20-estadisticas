/**
 * js/renderers.js — Chart render functions under AO20.renderers.
 *
 * Must be loaded after js/config.js and js/data-utils.js.
 */
AO20.renderers = {

  // ── Loading / error helpers ────────────────────────────────────────────
  showLoading: function (containerId) {
    var canvas = document.getElementById(containerId);
    if (!canvas) return;
    var container = canvas.parentNode;
    var loader = document.createElement('div');
    loader.className = 'chart-loading';
    loader.textContent = 'Cargando...';
    container.insertBefore(loader, canvas);
  },

  showError: function (containerId, msg) {
    var canvas = document.getElementById(containerId);
    if (!canvas) return;
    var container = canvas.parentNode;
    var loading = container.querySelector('.chart-loading');
    if (loading) loading.remove();
    var err = document.createElement('div');
    err.className = 'chart-error';
    err.textContent = msg || 'No se pudieron cargar las estadísticas.';
    container.appendChild(err);
  },

  // ── Pie chart ──────────────────────────────────────────────────────────
  renderPieChart: function (id, data) {
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
      type: 'pie',
      data: {
        labels: data.map(function (d) { return d.name; }),
        datasets: [{
          data: data.map(function (d) { return d.y; }),
          backgroundColor: AO20.config.DARK_PALETTE.slice(0, data.length)
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
  },

  // ── Column (vertical bar) chart ────────────────────────────────────────
  renderColumnChart: function (id, seriesData, categories) {
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

    var datasets;
    if (Array.isArray(seriesData) && typeof seriesData[0] === 'number') {
      datasets = [{
        label: '',
        data: seriesData,
        backgroundColor: AO20.config.DARK_PALETTE[0]
      }];
    } else {
      datasets = seriesData.map(function (s, i) {
        return {
          label: s.name,
          data: s.data,
          backgroundColor: AO20.config.DARK_PALETTE[i % AO20.config.DARK_PALETTE.length]
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
  },

  // ── Horizontal bar chart ───────────────────────────────────────────────
  renderBarChart: function (id, data, label) {
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
          label: label || 'Usuarios Matados',
          data: data.map(function (d) { return d.y; }),
          backgroundColor: AO20.config.DARK_PALETTE[0]
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
  },

  // ── Line chart ─────────────────────────────────────────────────────────
  renderLineChart: function (id, data) {
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

    var labels = data.map(function (_, i) { return i + 1; });

    return new Chart(canvas, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Cantidad de usuarios',
          data: data,
          borderColor: AO20.config.DARK_PALETTE[0],
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
  },

  // ── Guild chart — horizontal bar with alignment colors ─────────────────
  renderGuildChart: function (id, data) {
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
          backgroundColor: data.map(function (d) { return AO20.utils.guildAlignmentColor(d.alignment); })
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
  },

  // ── Faction chart — grouped bar Real vs Caos ──────────────────────────
  renderFactionChart: function (id, data) {
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
  },

  // ── Gold inflation time-series chart ───────────────────────────────────
  renderGoldInflationChart: function (id) {
    var self = this;
    self.showLoading(id);

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

        // Convert to {x, y} points and filter by MIN_DATE
        var minDate = AO20.config.MIN_DATE;
        var allPoints = data.map(function (a) {
          return { x: new Date(a.datetime).getTime(), y: a };
        });
        var filtered = AO20.utils.filterBeforeDate(allPoints, minDate);

        if (filtered.length === 0) {
          var noData = document.createElement('div');
          noData.className = 'chart-error';
          noData.textContent = 'No hay datos disponibles.';
          container.appendChild(noData);
          return;
        }

        var filteredData = filtered.map(function (p) { return p.y; });

        var labels = filteredData.map(function (a) {
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
            data: filteredData.map(function (a) { return a[s.key]; }),
            borderColor: AO20.config.DARK_PALETTE[i % AO20.config.DARK_PALETTE.length],
            backgroundColor: 'transparent',
            fill: false,
            tension: 0.1,
            pointRadius: 0,
            borderWidth: 2.5
          };
        });

        // Crosshair plugin for gold chart
        var goldCrosshairPlugin = {
          id: 'goldCrosshair',
          afterDraw: function (chart) {
            if (chart.tooltip && chart.tooltip._active && chart.tooltip._active.length) {
              var x = chart.tooltip._active[0].element.x;
              var yAxis = chart.scales.y;
              var ctx = chart.ctx;
              ctx.save();
              ctx.beginPath();
              ctx.moveTo(x, yAxis.top);
              ctx.lineTo(x, yAxis.bottom);
              ctx.lineWidth = 1;
              ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
              ctx.stroke();
              ctx.restore();
            }
          }
        };

        new Chart(canvas, {
          type: 'line',
          data: {
            labels: labels,
            datasets: datasets
          },
          plugins: [goldCrosshairPlugin],
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
                position: 'bottom',
                labels: {
                  color: '#e0e0e0',
                  boxWidth: 12,
                  padding: 8,
                  font: { size: 11 }
                }
              },
              tooltip: {
                mode: 'index',
                intersect: false,
                backgroundColor: 'rgba(0, 0, 0, 0.85)',
                titleColor: '#fff',
                bodyColor: '#e0e0e0',
                borderColor: 'rgba(255, 255, 255, 0.2)',
                borderWidth: 1,
                padding: 10,
                callbacks: {
                  label: function (ctx) {
                    return ctx.dataset.label + ': ' + ctx.parsed.y.toLocaleString();
                  }
                }
              }
            },
            interaction: {
              mode: 'index',
              intersect: false
            },
            elements: {
              point: { radius: 0, hoverRadius: 5, hitRadius: 10 }
            }
          }
        });
      })
      .catch(function () {
        self.showError(id, 'No se pudieron cargar las estadísticas.');
      });
  },

  // ── Items quantity time-series chart (rendering only) ──────────────────
  // Note: Items filter UI logic (search, selection, tags) lives in items-filter.js
  renderItemsChart: function (id) {
    var self = this;
    self.showLoading(id);

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
        var chartData = {};
        data.forEach(function (item) {
          var name = item[nameKey];
          if (!name) return;
          if (!chartData[name]) chartData[name] = [];
          chartData[name].push({
            x: new Date(item[datetimeKey]).getTime(),
            y: Number(item[quantityKey]) || 0
          });
        });

        var allItemNames = Object.keys(chartData);

        // Apply filterBeforeDate and downsampleDaily to each item's data
        var minDate = AO20.config.MIN_DATE;
        Object.keys(chartData).forEach(function (name) {
          chartData[name] = AO20.utils.filterBeforeDate(chartData[name], minDate);
          chartData[name] = AO20.utils.downsampleDaily(chartData[name]);
        });

        // Crosshair plugin
        var crosshairPlugin = {
          id: 'itemsCrosshair',
          afterDraw: function (chart) {
            if (chart.tooltip && chart.tooltip._active && chart.tooltip._active.length) {
              var x = chart.tooltip._active[0].element.x;
              var yAxis = chart.scales.y;
              var ctx = chart.ctx;
              ctx.save();
              ctx.beginPath();
              ctx.moveTo(x, yAxis.top);
              ctx.lineTo(x, yAxis.bottom);
              ctx.lineWidth = 1;
              ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
              ctx.stroke();
              ctx.restore();
            }
          }
        };

        // Create chart with no datasets — series added via items-filter.js
        var itemsChart;
        try {
          itemsChart = new Chart(canvas, {
            type: 'line',
            data: {
              datasets: []
            },
            plugins: [crosshairPlugin],
            options: {
              responsive: true,
              maintainAspectRatio: false,
              animation: false,
              scales: {
                x: {
                  type: 'time',
                  time: {
                    tooltipFormat: 'dd/MM/yyyy',
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
                  position: 'bottom',
                  labels: {
                    color: '#e0e0e0',
                    boxWidth: 12,
                    padding: 8,
                    font: { size: 11 }
                  },
                  maxHeight: 60
                },
                tooltip: {
                  mode: 'index',
                  intersect: false,
                  backgroundColor: 'rgba(0, 0, 0, 0.85)',
                  titleColor: '#fff',
                  bodyColor: '#e0e0e0',
                  borderColor: 'rgba(255, 255, 255, 0.2)',
                  borderWidth: 1,
                  padding: 10,
                  callbacks: {
                    label: function (ctx) {
                      return ctx.dataset.label + ': ' + ctx.parsed.y.toLocaleString();
                    }
                  }
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
              interaction: {
                mode: 'index',
                intersect: false
              },
              elements: {
                line: { borderWidth: 2.5 },
                point: { radius: 0, hoverRadius: 5, hitRadius: 10 }
              }
            }
          });
        } catch (e) {
          console.error('Error creating items chart:', e);
          self.showError(id, 'No se pudieron cargar las estadísticas.');
          return;
        }

        // Expose data for items-filter.js to consume
        AO20.renderers._itemsChartData = chartData;
        AO20.renderers._allItemNames = allItemNames;
        AO20.renderers._itemsChart = itemsChart;

        // If items-filter module is loaded, let it initialize
        if (AO20.itemsFilter && typeof AO20.itemsFilter.init === 'function') {
          AO20.itemsFilter.init(chartData, allItemNames, itemsChart);
        }
      })
      .catch(function () {
        self.showError(id, 'No se pudieron cargar las estadísticas.');
      });
  },

  // ── Heatmap color helper ────────────────────────────────────────────────
  heatmapColor: function (value, min, max) {
    if (value === null || value === undefined) return '#374151'; // neutral gray
    var t = (max - min) ? (value - min) / (max - min) : 0;
    t = Math.max(0, Math.min(1, t));
    var r, g, b;
    if (t <= 0.5) {
      // Green (#2ecc71) → Yellow (#f39c12)
      var u = t / 0.5;
      r = Math.round(46 + (243 - 46) * u);
      g = Math.round(204 + (156 - 204) * u);
      b = Math.round(113 + (18 - 113) * u);
    } else {
      // Yellow (#f39c12) → Red (#e74c3c)
      var u = (t - 0.5) / 0.5;
      r = Math.round(243 + (231 - 243) * u);
      g = Math.round(156 + (76 - 156) * u);
      b = Math.round(18 + (60 - 18) * u);
    }
    return 'rgb(' + r + ',' + g + ',' + b + ')';
  },

  // ── Heatmap table renderer ─────────────────────────────────────────────
  renderHeatmapTable: function (containerId, data) {
    var container = document.getElementById(containerId);
    if (!container) return;

    var loading = container.querySelector('.chart-loading');
    if (loading) loading.remove();

    if (!data || data.length === 0) {
      var fallback = document.createElement('div');
      fallback.className = 'chart-error';
      fallback.textContent = 'No hay datos disponibles.';
      container.appendChild(fallback);
      return;
    }

    // Collect unique classes and races
    var classSet = {};
    var raceSet = {};
    var matrix = {};
    data.forEach(function (d) {
      classSet[d.className] = true;
      raceSet[d.raceName] = true;
      if (!matrix[d.className]) matrix[d.className] = {};
      matrix[d.className][d.raceName] = d.avgDeathPerKill;
    });
    var classes = Object.keys(classSet);
    var races = Object.keys(raceSet);

    // Find min/max for color scaling (excluding nulls)
    var values = [];
    data.forEach(function (d) {
      if (d.avgDeathPerKill !== null && d.avgDeathPerKill !== undefined) {
        values.push(d.avgDeathPerKill);
      }
    });
    var min = values.length > 0 ? Math.min.apply(null, values) : 0;
    var max = values.length > 0 ? Math.max.apply(null, values) : 1;

    var self = this;
    var table = document.createElement('table');
    table.className = 'heatmap-table';

    // Header row
    var thead = document.createElement('thead');
    var headerRow = document.createElement('tr');
    var emptyTh = document.createElement('th');
    headerRow.appendChild(emptyTh);
    races.forEach(function (race) {
      var th = document.createElement('th');
      th.textContent = race;
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Data rows
    var tbody = document.createElement('tbody');
    classes.forEach(function (cls) {
      var row = document.createElement('tr');
      var th = document.createElement('th');
      th.textContent = cls;
      row.appendChild(th);
      races.forEach(function (race) {
        var td = document.createElement('td');
        var val = matrix[cls] && matrix[cls][race] !== undefined ? matrix[cls][race] : null;
        if (val === null) {
          td.textContent = 'N/A';
          td.style.backgroundColor = '#374151';
        } else {
          td.textContent = val.toFixed(2);
          td.style.backgroundColor = self.heatmapColor(val, min, max);
        }
        row.appendChild(td);
      });
      tbody.appendChild(row);
    });
    table.appendChild(tbody);
    container.appendChild(table);
  },

  // ── Lorenz curve chart ─────────────────────────────────────────────────
  renderLorenzChart: function (id, data) {
    var canvas = document.getElementById(id);
    if (!canvas) return null;
    var container = canvas.parentNode;

    var loading = container.querySelector('.chart-loading');
    if (loading) loading.remove();

    if (!data || !data.lorenzCurve || data.lorenzCurve.length === 0) {
      var fallback = document.createElement('div');
      fallback.className = 'chart-error';
      fallback.textContent = 'No hay datos disponibles.';
      container.appendChild(fallback);
      return null;
    }

    // Update Gini stat badge if present
    var giniEl = document.getElementById('giniValue');
    if (giniEl) {
      var giniValEl = giniEl.querySelector('.stat-value');
      if (giniValEl) {
        giniValEl.textContent = data.giniCoefficient != null ? data.giniCoefficient.toFixed(4) : '—';
      }
    }

    var labels = data.lorenzCurve.map(function (p) { return p.populationPercent + '%'; });
    var lorenzData = data.lorenzCurve.map(function (p) { return p.goldPercent; });
    var equalityData = data.lorenzCurve.map(function (p) { return p.populationPercent; });

    return new Chart(canvas, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Curva de Lorenz',
            data: lorenzData,
            borderColor: AO20.config.DARK_PALETTE[1],
            backgroundColor: 'rgba(52, 152, 219, 0.2)',
            fill: true,
            tension: 0.1,
            pointRadius: 3
          },
          {
            label: 'Igualdad Perfecta',
            data: equalityData,
            borderColor: AO20.config.DARK_PALETTE[2],
            borderDash: [5, 5],
            backgroundColor: 'transparent',
            fill: false,
            tension: 0,
            pointRadius: 0
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            title: { display: true, text: '% Población', color: '#e0e0e0' },
            grid: { color: 'rgba(255,255,255,0.1)' },
            ticks: { color: '#e0e0e0' }
          },
          y: {
            beginAtZero: true,
            title: { display: true, text: '% Oro Acumulado', color: '#e0e0e0' },
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
  },

  // ── Retention chart (line with YYYY-MM labels) ─────────────────────────
  renderRetentionChart: function (id, data) {
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

    var labels = data.map(function (d) { return d.cohortMonth; });
    var values = data.map(function (d) { return d.retentionPercent; });

    return new Chart(canvas, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Retención %',
          data: values,
          borderColor: AO20.config.DARK_PALETTE[1],
          backgroundColor: 'rgba(52, 152, 219, 0.2)',
          fill: true,
          tension: 0.1,
          pointRadius: 3
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            title: { display: true, text: 'Cohorte (mes)', color: '#e0e0e0' },
            grid: { color: 'rgba(255,255,255,0.1)' },
            ticks: { color: '#e0e0e0' }
          },
          y: {
            beginAtZero: true,
            max: 100,
            title: { display: true, text: 'Retención %', color: '#e0e0e0' },
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
            callbacks: {
              label: function (ctx) {
                return ctx.parsed.y.toFixed(1) + '%';
              }
            }
          }
        }
      }
    });
  },

  // ── Percent bar chart (horizontal, 0–100% X-axis) ─────────────────────
  renderPercentBarChart: function (id, data) {
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
        labels: data.map(function (d) { return d.questName; }),
        datasets: [{
          label: 'Completado %',
          data: data.map(function (d) { return d.completionPercent; }),
          backgroundColor: AO20.config.DARK_PALETTE[2]
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            beginAtZero: true,
            max: 100,
            title: { display: true, text: 'Completado %', color: '#e0e0e0' },
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
                return item.totalContributions + ' / ' + item.threshold + ' (' + item.completionPercent.toFixed(1) + '%)';
              }
            }
          }
        }
      }
    });
  },

  // ── Stat card helper ───────────────────────────────────────────────────
  renderStatCard: function (containerId, value, subtitle) {
    var container = document.getElementById(containerId);
    if (!container) return;
    var valEl = container.querySelector('.stat-value');
    if (valEl) valEl.textContent = value != null ? value : '—';
    var descEl = container.querySelector('.stat-desc');
    if (descEl) descEl.textContent = subtitle != null ? subtitle : '';
  },

  // ── Static charts orchestration ────────────────────────────────────────
  initStaticCharts: function () {
    var self = this;
    var STATIC_CHART_IDS = AO20.config.STATIC_CHART_IDS;
    var CLASS_CATEGORIES = AO20.config.CLASS_CATEGORIES;

    // Show loading on all static chart containers
    STATIC_CHART_IDS.forEach(function (id) { self.showLoading(id); });

    fetch('api_charts.php')
      .then(function (response) {
        if (!response.ok) throw new Error('HTTP ' + response.status);
        return response.json();
      })
      .then(function (data) {
        self.renderPieChart('chartUsuariosPorClase', data.usuariosPorClase);
        self.renderColumnChart('chartClasesPorRaza', data.clasesPorRaza, CLASS_CATEGORIES);
        self.renderBarChart('chartUsuariosMatadosPorClase', data.killsPorClase);
        self.renderLineChart('chartUsuariosPorLevel', data.usuariosPorLevel);

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
          self.renderColumnChart('chartEloDistribution', eloData.map(function (d) { return d.count; }), eloData.map(function (d) { return d.bucket; }));
        }

        // Top Guilds
        self.renderGuildChart('chartTopGuilds', data.topGuilds);

        // Gold by Level Range — grouped column with 2 series
        var goldData = data.goldByLevelRange;
        if (goldData && goldData.length > 0) {
          var averages = goldData.map(function (d) { return d.average; });
          var medians = goldData.map(function (d) { return d.median; });
          var rangeLabels = goldData.map(function (d) { return d.range; });
          self.renderColumnChart('chartGoldByLevel', [{ name: 'Promedio', data: averages }, { name: 'Mediana', data: medians }], rangeLabels);
        } else {
          self.renderColumnChart('chartGoldByLevel', [], []);
        }

        // K/D Ratio by Class
        self.renderBarChart('chartKdRatio', data.kdRatioByClass);

        // Faction Summary
        self.renderFactionChart('chartFactionSummary', data.factionSummary);

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
          self.renderBarChart('chartFishingLeaderboard', fishData);
        }

        // Gender Distribution
        self.renderPieChart('chartGenderDistribution', data.genderDistribution);

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
          self.renderBarChart('chartTopNpcHunters', npcData);
        }

        // PvP & Combat
        try {
        var cvsc = data.ciudadanosVsCriminales;
        if (cvsc && !Array.isArray(cvsc)) {
          self.renderPieChart('chartCiudadanosVsCriminales', [
            { name: 'Ciudadanos Matados', y: cvsc.totalCiudadanosMatados },
            { name: 'Criminales Matados', y: cvsc.totalCriminalesMatados }
          ]);
        }
        self.renderBarChart('chartMostDangerousClasses',
          (data.mostDangerousClasses || []).map(function(d) { return { name: d.className, y: d.deathPerKillRatio }; }),
          'Ratio Muertes/Kills'
        );
        self.renderColumnChart('chartPvpByLevelBracket',
          (data.pvpByLevelBracket || []).map(function(d) { return d.avgKills; }),
          (data.pvpByLevelBracket || []).map(function(d) { return d.bracket; })
        );
        self.renderColumnChart('chartReenlistadas',
          (data.reenlistadasDistribution || []).map(function(d) { return d.count; }),
          (data.reenlistadasDistribution || []).map(function(d) { return String(d.reenlistadas); })
        );
        self.renderHeatmapTable('chartDeathKillHeatmap', data.deathKillHeatmap);
        } catch(e) { console.error('[AO20] PvP render error:', e); }

        // Economy & Items
        try {
        self.renderLorenzChart('chartLorenzCurve', data.giniLorenz);
        var bankRate = data.bankUsageRate;
        if (bankRate && !Array.isArray(bankRate)) {
          self.renderStatCard('statBankUsage', bankRate.bankUsagePercent.toFixed(1) + '%', bankRate.bankUsersCount + ' / ' + bankRate.totalActiveCharacters + ' personajes');
        }
        self.renderBarChart('chartMostHoardedItems',
          (data.mostHoardedItems || []).map(function(d) { return { name: 'Item #' + d.itemId, y: d.totalAmount }; }),
          'Cantidad Total'
        );
        var evu = data.equippedVsUnequipped;
        if (evu && !Array.isArray(evu)) {
          self.renderPieChart('chartEquippedVsUnequipped', [
            { name: 'Equipado', y: evu.equippedCount },
            { name: 'No Equipado', y: evu.unequippedCount }
          ]);
        }
        var etd = data.elementalTagsDistribution;
        if (etd && !Array.isArray(etd)) {
          self.renderPieChart('chartElementalTags', [
            { name: 'Con Tags Elementales', y: etd.withElementalTags },
            { name: 'Sin Tags Elementales', y: etd.withoutElementalTags }
          ]);
        }
        } catch(e) { console.error('[AO20] Economy render error:', e); }

        // Social & Guilds
        try {
        self.renderColumnChart('chartGuildSizeDistribution',
          (data.guildSizeDistribution || []).map(function(d) { return d.guildCount; }),
          (data.guildSizeDistribution || []).map(function(d) { return d.bucket; })
        );
        var grr = data.guildRejectionRate;
        if (grr && !Array.isArray(grr)) {
          self.renderStatCard('statGuildRejection', (grr.rejectionRate * 100).toFixed(1) + '%', grr.totalAcceptances + ' aceptados / ' + grr.totalRequests + ' solicitudes');
        }
        var mr = data.marriageRate;
        if (mr && !Array.isArray(mr)) {
          self.renderStatCard('statMarriage', mr.marriagePercent.toFixed(1) + '%', mr.marriedCount + ' / ' + mr.totalActiveCharacters + ' personajes');
        }
        var gab = data.guildAlignmentBalance;
        if (gab && Array.isArray(gab) && gab.length > 0) {
          self.renderPieChart('chartGuildAlignmentBalance', gab.map(function(d) { return { name: d.alignmentName, y: d.count }; }));
        }
        var gc = data.guildConcentration;
        if (gc && !Array.isArray(gc)) {
          self.renderPieChart('chartGuildConcentration', [
            { name: 'Top 10 Guilds', y: gc.topGuildMembers },
            { name: 'Otros Guilds', y: gc.otherGuildMembers },
            { name: 'Independientes', y: gc.independents }
          ]);
        }
        } catch(e) { console.error('[AO20] Social render error:', e); }

        // Character Building
        try {
        self.renderColumnChart('chartSkillPointPatterns',
          (data.skillPointPatterns || []).map(function(d) { return d.avgValue; }),
          (data.skillPointPatterns || []).map(function(d) { return 'Skill #' + d.skillNumber; })
        );
        self.renderBarChart('chartSpellPopularity',
          (data.spellPopularity || []).map(function(d) { return { name: 'Spell #' + d.spellId, y: d.characterCount }; }),
          'Personajes'
        );
        var sa = data.skinAdoption;
        if (sa && !Array.isArray(sa)) {
          self.renderStatCard('statSkinAdoption', sa.skinAdoptionPercent.toFixed(1) + '%', sa.skinUsersCount + ' / ' + sa.totalActiveCharacters + ' personajes');
          if (sa.topSkins && sa.topSkins.length > 0) {
            self.renderBarChart('chartTopSkins',
              sa.topSkins.map(function(d) { return { name: 'Skin #' + d.skinId, y: d.count }; }),
              'Cantidad'
            );
          }
        }
        var po = data.petOwnership;
        if (po && !Array.isArray(po)) {
          self.renderStatCard('statPetOwnership', po.petOwnershipPercent.toFixed(1) + '%', po.petOwnersCount + ' / ' + po.totalActiveCharacters + ' personajes');
          if (po.topPets && po.topPets.length > 0) {
            self.renderBarChart('chartTopPets',
              po.topPets.map(function(d) { return { name: 'Pet #' + d.petId, y: d.count }; }),
              'Cantidad'
            );
          }
        }
        } catch(e) { console.error('[AO20] Character render error:', e); }

        // Activity & Misc
        try {
        var mca = data.multiCharacterAccounts;
        if (mca && Array.isArray(mca) && mca.length > 0) {
          self.renderPieChart('chartMultiCharacterAccounts', mca.map(function(d) { return { name: d.bucket, y: d.accountCount }; }));
        }
        self.renderBarChart('chartCharactersPerMap',
          (data.charactersPerMap || []).map(function(d) { return { name: 'Mapa #' + d.mapId, y: d.characterCount }; }),
          'Personajes'
        );
        var dcr = data.deadCharacterRate;
        if (dcr && !Array.isArray(dcr)) {
          self.renderStatCard('statDeadCharacter', dcr.deadPercent.toFixed(1) + '%', dcr.deadCount + ' / ' + dcr.totalActiveCharacters + ' personajes');
        }
        var sr = data.sailingRate;
        if (sr && !Array.isArray(sr)) {
          self.renderStatCard('statSailing', sr.sailingPercent.toFixed(1) + '%', sr.sailingCount + ' / ' + sr.totalActiveCharacters + ' personajes');
        }
        self.renderColumnChart('chartFishingCombatCorrelation',
          (data.fishingCombatCorrelation || []).map(function(d) { return d.avgKills; }),
          (data.fishingCombatCorrelation || []).map(function(d) { return d.fishingBracket; })
        );
        } catch(e) { console.error('[AO20] Activity render error:', e); }

        // Events & Server Health
        try {
        var gqp = data.globalQuestParticipation;
        if (gqp && !Array.isArray(gqp)) {
          self.renderStatCard('statQuestParticipation', gqp.participationPercent.toFixed(1) + '%', gqp.participantCount + ' / ' + gqp.totalActiveCharacters + ' personajes');
        }
        self.renderPercentBarChart('chartGlobalQuestCompletion', data.globalQuestCompletion);
        self.renderRetentionChart('chartAccountRetention', data.accountRetention);
        var pdr = data.patronDonorRate;
        if (pdr && !Array.isArray(pdr)) {
          self.renderStatCard('statPatronDonor', pdr.patronPercent.toFixed(1) + '%', pdr.patronCount + ' patrones / ' + pdr.totalAccounts + ' cuentas');
        }
        self.renderBarChart('chartQuestCompletionByClass',
          (data.questCompletionByClass || []).map(function(d) { return { name: d.className, y: d.avgQuestsCompleted }; }),
          'Quests Promedio'
        );
        // Deaths vs Level Curve — line chart
        var dvl = data.deathsVsLevelCurve;
        if (dvl && Array.isArray(dvl) && dvl.length > 0) {
          self.renderLineChart('chartDeathsVsLevel', dvl.map(function(d) { return d.avgDeaths; }));
        }
        } catch(e) { console.error('[AO20] Events render error:', e); }
      })
      .catch(function () {
        STATIC_CHART_IDS.forEach(function (id) {
          self.showError(id, 'No se pudieron cargar las estadísticas.');
        });
      });
  }
};

// ── Utility functions (exported for testing) ──────────────────────────────

function computeGini(sortedValues) {
  var n = sortedValues.length;
  if (n === 0) return 0;
  var sum = sortedValues.reduce(function (a, b) { return a + b; }, 0);
  if (sum === 0) return 0;
  var weightedSum = 0;
  for (var i = 0; i < n; i++) {
    weightedSum += (i + 1) * sortedValues[i];
  }
  return (2 * weightedSum) / (n * sum) - (n + 1) / n;
}

function computeLorenzCurve(sortedValues) {
  var n = sortedValues.length;
  if (n === 0) return [];
  var totalGold = sortedValues.reduce(function (a, b) { return a + b; }, 0);
  var points = [];
  for (var p = 1; p <= 20; p++) {
    var populationPercent = p * 5;
    var idx = Math.ceil((populationPercent / 100) * n);
    var cumulativeGold = 0;
    for (var i = 0; i < idx; i++) {
      cumulativeGold += sortedValues[i];
    }
    var goldPercent = (totalGold > 0) ? (cumulativeGold / totalGold) * 100 : 0;
    points.push({ populationPercent: populationPercent, goldPercent: goldPercent });
  }
  return points;
}

function getLevelBracket(level) {
  if (level < 1) return '1-5';
  if (level > 50) return '46-50';
  var bracketStart = Math.floor((level - 1) / 5) * 5 + 1;
  var bracketEnd = bracketStart + 4;
  return bracketStart + '-' + bracketEnd;
}

function getGuildSizeBucket(memberCount) {
  if (memberCount <= 1) return '1';
  if (memberCount <= 5) return '2-5';
  if (memberCount <= 10) return '6-10';
  if (memberCount <= 20) return '11-20';
  if (memberCount <= 50) return '21-50';
  return '51+';
}

function getMultiCharBucket(charCount) {
  if (charCount <= 1) return '1 personaje';
  if (charCount === 2) return '2 personajes';
  return '3+ personajes';
}

function getFishingBracket(score) {
  if (score <= 100) return '1-100';
  if (score <= 500) return '101-500';
  if (score <= 1000) return '501-1000';
  if (score <= 5000) return '1001-5000';
  return '5001+';
}

function computeRejectionRate(totalRequests, totalAcceptances) {
  if (totalRequests <= 0) return 0;
  return 1 - (totalAcceptances / totalRequests);
}

function computeCompletionPercent(totalContributions, threshold) {
  if (threshold <= 0) return 0;
  return Math.min(100, (totalContributions / threshold) * 100);
}

function computePercentage(count, total) {
  if (total <= 0) return 0;
  return (count / total) * 100;
}

// ── Export for testing ─────────────────────────────────────────────────────
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AO20;
  module.exports.computeGini = computeGini;
  module.exports.computeLorenzCurve = computeLorenzCurve;
  module.exports.heatmapColor = AO20.renderers.heatmapColor.bind(AO20.renderers);
  module.exports.getLevelBracket = getLevelBracket;
  module.exports.getGuildSizeBucket = getGuildSizeBucket;
  module.exports.getMultiCharBucket = getMultiCharBucket;
  module.exports.getFishingBracket = getFishingBracket;
  module.exports.computeRejectionRate = computeRejectionRate;
  module.exports.computeCompletionPercent = computeCompletionPercent;
  module.exports.computePercentage = computePercentage;
}
