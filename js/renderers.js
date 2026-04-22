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
  renderBarChart: function (id, data) {
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
      })
      .catch(function () {
        STATIC_CHART_IDS.forEach(function (id) {
          self.showError(id, 'No se pudieron cargar las estadísticas.');
        });
      });
  }
};

// ── Export for testing ─────────────────────────────────────────────────────
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AO20;
}
