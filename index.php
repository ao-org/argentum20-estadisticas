<?php
include('_statistics.php');
$stats       = getGeneralStats();
$levelObj    = getUsuariosPorLevel();
$facciones   = getBalanceFacciones();
$pesca       = getPuntosPesca();
$clanes      = getDistribucionClanes();
?>
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Estadísticas — Argentum Online</title>
  <link rel="icon" type="image/x-icon" href="/favicon.ico">
  <link rel="shortcut icon" href="/favicon.ico">
  <link href="./vendor/bootstrap/css/bootstrap.min.css" rel="stylesheet">
  <link href="./vendor/bootstrap/css/bootswatch.min.css" rel="stylesheet">
  <link href="./css/cucsi.css" rel="stylesheet">
</head>
<body>

  <nav class="navbar navbar-expand-lg navbar-dark fixed-top">
    <div class="container">
      <img src="img/logo.png" alt="AO Logo" />
      <h1>Estadísticas — Argentum Online</h1>
    </div>
  </nav>

  <div class="main-wrapper">

    <h1 class="page-title">Estadísticas del Servidor</h1>
    <p class="page-subtitle">Datos en tiempo real del mundo de Argentum</p>
    <div class="rune-divider">✦ ᚱ ᚢ ᚾ ᚨ ✦</div>

    <!-- Stat Badges -->
    <div class="stat-badges">
      <div class="stat-badge">
        <div class="stat-badge-icon">📜</div>
        <div class="stat-badge-value"><?php echo number_format($stats['accounts']); ?></div>
        <div class="stat-badge-label">Cuentas creadas</div>
      </div>
      <div class="stat-badge">
        <div class="stat-badge-icon">⚔️</div>
        <div class="stat-badge-value"><?php echo number_format($stats['users']); ?></div>
        <div class="stat-badge-label">Personajes creados</div>
      </div>
    </div>

    <!-- Charts Grid 2 col -->
    <div class="charts-grid">
      <div class="card">
        <div class="card-header">Usuarios por Clase</div>
        <div class="card-body">
          <figure class="highcharts-figure"><div id="chartUsuariosPorClase"></div></figure>
        </div>
      </div>
      <div class="card">
        <div class="card-header">Kills Promedio por Clase</div>
        <div class="card-body">
          <figure class="highcharts-figure"><div id="chartUsuariosMatadosPorClase"></div></figure>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">Clases por Raza</div>
      <div class="card-body">
        <figure class="highcharts-figure"><div id="chartClasesPorRaza"></div></figure>
      </div>
    </div>

    <!-- Nivel: desde lvl 13 -->
    <div class="card">
      <div class="card-header">Distribución por Nivel (desde nivel <?php echo $levelObj['minLevel']; ?>)</div>
      <div class="card-body">
        <figure class="highcharts-figure"><div id="chartUsuariosPorLevel"></div></figure>
      </div>
    </div>

    <!-- Oro: solo Total y Banco -->
    <div class="card">
      <div class="card-header">Inflación de Oro</div>
      <div class="card-body">
        <figure class="highcharts-figure"><div id="goldInflation"></div></figure>
      </div>
    </div>

    <!-- Items: buscador + sin visibles por defecto -->
    <div class="card">
      <div class="card-header">Cantidad de Ítems en Circulación</div>
      <div class="card-body">

        <!-- Buscador de ítems -->
        <div class="item-search-bar">
          <input type="text" id="itemSearchInput" placeholder="Buscar ítem... (ej: leña, espada, poción)" autocomplete="off" />
          <div id="itemSearchResults" class="item-search-dropdown"></div>
        </div>
        <div id="itemSelectedTags" class="item-tags"></div>

        <figure class="highcharts-figure" style="margin-top:16px">
          <div id="itemsQuantity"></div>
        </figure>
      </div>
    </div>


    <!-- Balance Real vs Caos -->
    <div class="card">
      <div class="card-header">Balance de Facciones — Real vs Caos</div>
      <div class="card-body">
        <?php if ($facciones['missing_column']): ?>
          <div class="missing-col-notice">
            ⚠️ Columna <code>faction_score</code> no encontrada en la tabla <code>user</code>.
            Ejecutá la migración correspondiente para habilitar esta estadística.
          </div>
        <?php else: ?>
        <div class="faction-summary">
          <div class="faction-badge faction-real">
            <div class="faction-icon">⚜️</div>
            <div class="faction-count"><?php echo number_format($facciones['real_count']); ?></div>
            <div class="faction-label">Ciudadanos Reales</div>
            <div class="faction-avg">Score prom: <?php echo $facciones['real_avg']; ?></div>
          </div>
          <div class="faction-vs">VS</div>
          <div class="faction-badge faction-caos">
            <div class="faction-icon">💀</div>
            <div class="faction-count"><?php echo number_format($facciones['caos_count']); ?></div>
            <div class="faction-label">Criminales del Caos</div>
            <div class="faction-avg">Score prom: <?php echo $facciones['caos_avg']; ?></div>
          </div>
        </div>
        <figure class="highcharts-figure" style="height:260px; margin-top:20px">
          <div id="chartFacciones"></div>
        </figure>
        <?php endif; ?>
      </div>
    </div>

    <!-- Distribución de Clanes -->
    <div class="charts-grid">
      <div class="card">
        <div class="card-header">Personajes en Clan</div>
        <div class="card-body">
          <div class="clan-pct-badge">
            <span class="clan-pct-number"><?php echo $clanes['pct_clan']; ?>%</span>
            <span class="clan-pct-label">de los personajes pertenecen a un clan</span>
          </div>
          <figure class="highcharts-figure" style="height:300px; margin-top:16px">
            <div id="chartClanes"></div>
          </figure>
        </div>
      </div>

      <div class="card">
        <div class="card-header">Distribución de Puntos de Pesca</div>
        <div class="card-body">
          <?php if ($pesca['missing_column']): ?>
            <div class="missing-col-notice">
              ⚠️ Columna <code>puntos_pesca</code> no encontrada en la tabla <code>user</code>.
              Ejecutá la migración correspondiente para habilitar esta estadística.
            </div>
          <?php else: ?>
          <div class="pesca-summary">
            <span>🎣 <strong><?php echo number_format($pesca['pescadores']); ?></strong> pescadores activos</span>
            <span>🏆 Máximo: <strong><?php echo number_format($pesca['max_pesca']); ?></strong> pts</span>
            <span>📊 Promedio: <strong><?php echo number_format($pesca['avg_pesca'], 1); ?></strong> pts</span>
          </div>
          <figure class="highcharts-figure" style="height:300px; margin-top:16px">
            <div id="chartPesca"></div>
          </figure>
          <?php endif; ?>
        </div>
      </div>
    </div>

    <!-- Steam -->
    <div class="steam-section">
      <div class="steam-section-header">Argentum Online en Steam</div>
      <iframe src="https://steamdb.info/embed/?appid=1956740" height="389" style="border:0;overflow:hidden;width:100%" loading="lazy"></iframe>
    </div>

    <footer class="site-footer">
      Argentum Online &copy; <?php echo date('Y'); ?> &mdash; Estadísticas del servidor
    </footer>
  </div>

  <script src="./vendor/jquery/jquery.min.js"></script>
  <script src="./vendor/popper/popper.min.js"></script>
  <script src="./vendor/bootstrap/js/bootstrap.min.js"></script>
  <script src="./vendor/Highcharts-8.0.4/code/highcharts.js"></script>

  <script>
  // ── Highcharts global theme ───────────────────────────────────────────────
  Highcharts.setOptions({
    colors: ['#C9952A','#7EB8D4','#A3C27A','#C07A8A','#8AA4C8','#D4A36A','#7ABBA8','#C8C87A','#B47AC8','#7AC8B4'],
    chart: {
      backgroundColor: '#111118',
      style: { fontFamily: "'Crimson Text', Georgia, serif" },
      plotBorderWidth: 0
    },
    title:    { style: { color: '#F2C96A', fontFamily: "'Cinzel', serif", fontSize: '15px', letterSpacing: '0.05em' } },
    subtitle: { style: { color: '#7a6e58' } },
    xAxis: {
      gridLineColor: 'rgba(201,149,42,0.1)', lineColor: 'rgba(201,149,42,0.2)', tickColor: 'rgba(201,149,42,0.2)',
      labels: { style: { color: '#7a6e58' } }, title: { style: { color: '#7a6e58' } }
    },
    yAxis: {
      gridLineColor: 'rgba(201,149,42,0.1)', lineColor: 'rgba(201,149,42,0.2)', tickColor: 'rgba(201,149,42,0.2)',
      labels: { style: { color: '#7a6e58' } }, title: { style: { color: '#7a6e58' } }
    },
    legend: { itemStyle: { color: '#D4C5A0', fontFamily: "'Crimson Text', Georgia, serif" }, itemHoverStyle: { color: '#F2C96A' } },
    tooltip: { backgroundColor: '#16161F', borderColor: 'rgba(201,149,42,0.4)', style: { color: '#D4C5A0' } },
    plotOptions: { series: { borderWidth: 0 }, pie: { borderWidth: 2, borderColor: '#111118' } },
    credits: { enabled: false }
  });

  // ── Gold: solo Oro Total y Oro en Banco ──────────────────────────────────
  $.ajax({
    url: "https://api.ao20.com.ar:2083/statistics/getGoldStatistics",
    success: function(data) {
      // Parsear fechas como timestamps para eje datetime real
      var points_total = [], points_bank = [];
      data.forEach(function(a) {
        var ts = new Date(a.datetime).getTime();
        points_total.push([ts, Number(a.gold_total)]);
        points_bank.push([ts,  Number(a.gold_bank)]);
      });
      Highcharts.chart('goldInflation', {
        title: { text: 'Inflación de Oro' },
        subtitle: { text: 'Oro Total y Oro en Banco' },
        xAxis: { type: 'datetime', labels: { format: '{value:%d/%m/%y}', rotation: -45 } },
        yAxis: { title: { text: 'Oro' } },
        tooltip: { xDateFormat: '%d/%m/%Y %H:%M', shared: true },
        series: [
          { name: 'Oro Total', data: points_total, lineWidth: 2 },
          { name: 'Oro en Banco', data: points_bank, lineWidth: 2 }
        ]
      });
    },
    error: function() {
      document.getElementById('goldInflation').innerHTML = '<div class="chart-loading">Sin datos disponibles</div>';
    }
  });

  // ── Items chart con buscador ──────────────────────────────────────────────
  var itemsChart = null;
  var itemsIndex = {}; // item_id (string) -> { name, label, points[] }

  $.ajax({
    url: "https://api.ao20.com.ar:2083/statistics/getItemsStatistics",
    success: function(data) {

      // 1. Primera pasada: agrupar puntos por item_id en un mapa de timestamps
      //    tsMap[id][ts] = cantidad acumulada — resuelve duplicados de timestamp sin
      //    depender del orden de llegada de los registros.
      var tsMap    = {}; // id -> { ts: qty }
      var nameMap  = {}; // id -> nombre canónico
      var nameCount = {}; // nombre -> cuántos IDs distintos lo usan

      data.forEach(function(item) {
        // Ignorar registros sin item_id válido o sin nombre (JOIN fallido en el servidor)
        var rawId = item.item_id;
        if (rawId === null || rawId === undefined) return;
        var id  = String(rawId);
        // Parsear fecha explícitamente para evitar ambigüedad UTC/local entre browsers
        var raw = item.datetime ? item.datetime.replace(' ', 'T') : null;
        var ts  = raw ? new Date(raw).getTime() : NaN;
        if (isNaN(ts)) return; // ignorar registros con fecha inválida
        var qty = Number(item.total_quantity) || 0;

        // Guardar nombre solo si todavía no lo tenemos (o el actual es nulo)
        if (!nameMap[id] && item.NAME) {
          nameMap[id] = String(item.NAME);
        }

        // Acumular en el mapa de timestamps
        if (!tsMap[id]) tsMap[id] = {};
        tsMap[id][ts] = (tsMap[id][ts] || 0) + qty;
      });

      // 2. Contar cuántos IDs comparten el mismo nombre (para desambiguar)
      Object.keys(nameMap).forEach(function(id) {
        var n = nameMap[id];
        nameCount[n] = (nameCount[n] || 0) + 1;
      });

      // 3. Construir itemsIndex con puntos ordenados por fecha
      Object.keys(tsMap).forEach(function(id) {
        var rawName = nameMap[id] || 'Ítem #' + id; // fallback si NAME era null
        var label   = (nameCount[rawName] > 1) ? rawName + ' (#' + id + ')' : rawName;
        var points  = Object.keys(tsMap[id]).map(function(ts) {
          return { x: Number(ts), y: tsMap[id][ts] };
        });
        points.sort(function(a, b) { return a.x - b.x; });
        itemsIndex[id] = { name: rawName, label: label, points: points };
      });

      // 4. Dibujar gráfico vacío — ningún ítem visible por defecto
      itemsChart = Highcharts.chart('itemsQuantity', {
        title: { text: 'Ítems en Circulación' },
        subtitle: { text: 'Buscá y seleccioná ítems para graficarlos' },
        xAxis: { type: 'datetime', labels: { format: '{value:%d/%m/%y}', rotation: -45 } },
        yAxis: { title: { text: 'Cantidad' }, min: 0 },
        tooltip: {
          xDateFormat: '%d/%m/%Y %H:%M',
          pointFormat: '<span style="color:{series.color}">●</span> {series.name}: <b>{point.y}</b><br/>'
        },
        legend: { enabled: true, maxHeight: 120 },
        series: []
      });

      // 5. Inicializar buscador
      initItemSearch();
    },
    error: function() {
      document.getElementById('itemsQuantity').innerHTML = '<div class="chart-loading">Sin datos disponibles</div>';
      document.querySelector('.item-search-bar').style.display = 'none';
    }
  });

  // ── Lógica del buscador de ítems ─────────────────────────────────────────
  var selectedItemIds = {}; // ids actualmente graficados

  function initItemSearch() {
    var input    = document.getElementById('itemSearchInput');
    var dropdown = document.getElementById('itemSearchResults');

    // Construir lista ordenada alfabéticamente para búsqueda
    var allItems = Object.keys(itemsIndex).map(function(id) {
      return { id: id, label: itemsIndex[id].label, nameLower: itemsIndex[id].name.toLowerCase() };
    }).sort(function(a, b) { return a.label.localeCompare(b.label); });

    input.addEventListener('input', function() {
      var q = this.value.trim().toLowerCase();
      dropdown.innerHTML = '';
      if (q.length < 2) { dropdown.style.display = 'none'; return; }

      var matches = allItems.filter(function(it) { return it.nameLower.indexOf(q) !== -1; }).slice(0, 20);

      if (!matches.length) {
        dropdown.innerHTML = '<div class="item-search-empty">Sin resultados</div>';
        dropdown.style.display = 'block';
        return;
      }

      matches.forEach(function(it) {
        var div = document.createElement('div');
        div.className = 'item-search-option' + (selectedItemIds[it.id] ? ' selected' : '');
        div.textContent = it.label;
        div.dataset.id  = it.id;
        div.addEventListener('mousedown', function(e) {
          e.preventDefault(); // evitar que el blur del input cierre el dropdown antes del click
          toggleItem(it.id);
          // Re-marcar el ítem como selected en el dropdown
          div.className = 'item-search-option' + (selectedItemIds[it.id] ? ' selected' : '');
        });
        dropdown.appendChild(div);
      });
      dropdown.style.display = 'block';
    });

    input.addEventListener('blur', function() {
      setTimeout(function() { dropdown.style.display = 'none'; }, 150);
    });

    input.addEventListener('focus', function() {
      if (this.value.trim().length >= 2) input.dispatchEvent(new Event('input'));
    });
  }

  function toggleItem(id) {
    if (selectedItemIds[id]) {
      removeItem(id);
    } else {
      addItem(id);
    }
    renderTags();
  }

  function addItem(id) {
    if (!itemsIndex[id] || !itemsChart) return;
    if (selectedItemIds[id]) return;
    selectedItemIds[id] = true;

    // Agregar serie sin redibujar todavía
    itemsChart.addSeries({
      id:   'item-' + id,
      name: itemsIndex[id].label,
      // Convertir a array [x, y] — formato más robusto para eje datetime en HC8
      data: itemsIndex[id].points.map(function(p) { return [p.x, p.y]; })
    }, false, false); // redraw=false, animation=false

    // Forzar recálculo de extremos del eje X y redibujar
    itemsChart.xAxis[0].setExtremes(null, null, false);
    itemsChart.redraw(false);
  }

  function removeItem(id) {
    if (!itemsChart) return;
    delete selectedItemIds[id];
    var serie = itemsChart.get('item-' + id);
    if (serie) {
      serie.remove(false, false);
      itemsChart.xAxis[0].setExtremes(null, null, false);
      itemsChart.redraw(false);
    }
  }

  function renderTags() {
    var container = document.getElementById('itemSelectedTags');
    container.innerHTML = '';
    Object.keys(selectedItemIds).forEach(function(id) {
      if (!itemsIndex[id]) return;
      var tag = document.createElement('span');
      tag.className = 'item-tag';
      tag.innerHTML = itemsIndex[id].label + ' <button class="item-tag-remove" data-id="' + id + '">×</button>';
      tag.querySelector('button').addEventListener('click', function() {
        removeItem(this.dataset.id);
        renderTags();
      });
      container.appendChild(tag);
    });
  }

  // ── Balance de Facciones ─────────────────────────────────────────────────
  <?php if (!$facciones['missing_column']): ?>
  (function() {
    var fData = <?php echo json_encode($facciones); ?>;
    var total = fData.real_count + fData.caos_count + fData.neutral_count || 1;
    Highcharts.chart('chartFacciones', {
      chart: { type: 'bar', height: 220 },
      title: { text: null },
      xAxis: { categories: ['Personajes'], visible: false },
      yAxis: { visible: false, min: 0, max: total },
      plotOptions: {
        bar: {
          stacking: 'normal',
          dataLabels: {
            enabled: true,
            formatter: function() {
              var pct = (this.y / total * 100).toFixed(1);
              return this.series.name + ': ' + this.y + ' (' + pct + '%)';
            },
            style: { color: '#D4C5A0', textOutline: 'none', fontSize: '12px' }
          },
          borderWidth: 0
        }
      },
      legend: { enabled: true },
      tooltip: {
        formatter: function() {
          return '<b>' + this.series.name + '</b><br/>Personajes: ' + this.y +
                 '<br/>Porcentaje: ' + (this.y / total * 100).toFixed(1) + '%';
        }
      },
      series: [
        { name: 'Real',    data: [fData.real_count],    color: '#C9952A' },
        { name: 'Caos',    data: [fData.caos_count],    color: '#8B1A1A' },
        { name: 'Neutral', data: [fData.neutral_count], color: '#4a4a6a' }
      ]
    });
  })();
  <?php endif; ?>

  // ── Distribución de Clanes ────────────────────────────────────────────────
  (function() {
    var cData = <?php echo json_encode($clanes['pie']); ?>;
    Highcharts.chart('chartClanes', {
      chart: { type: 'pie', height: 300 },
      title: { text: null },
      tooltip: {
        pointFormat: '<b>{point.name}</b>: {point.y} personajes ({point.percentage:.1f}%)'
      },
      plotOptions: {
        pie: {
          allowPointSelect: true,
          cursor: 'pointer',
          dataLabels: {
            enabled: true,
            format: '<b>{point.name}</b><br/>{point.y} ({point.percentage:.1f}%)',
            style: { color: '#D4C5A0', textOutline: 'none', fontSize: '11px' }
          }
        }
      },
      series: [{ name: 'Personajes', colorByPoint: false, data: cData }]
    });
  })();

  // ── Puntos de Pesca ───────────────────────────────────────────────────────
  <?php if (!$pesca['missing_column']): ?>
  (function() {
    var pescaData = <?php echo json_encode($pesca['dist']); ?>;
    Highcharts.chart('chartPesca', {
      chart: { type: 'column', height: 300 },
      title: { text: null },
      xAxis: {
        categories: pescaData.map(function(d){ return d.name; }),
        title: { text: 'Rango de puntos' }
      },
      yAxis: { title: { text: 'Personajes' }, min: 0, allowDecimals: false },
      tooltip: {
        formatter: function() {
          return 'Rango <b>' + this.x + '</b><br/>' + this.y + ' personajes';
        }
      },
      plotOptions: {
        column: {
          colorByPoint: true,
          dataLabels: { enabled: true, style: { color: '#D4C5A0', textOutline: 'none', fontSize: '11px' } }
        }
      },
      series: [{ name: 'Personajes', data: pescaData.map(function(d){ return d.y; }) }]
    });
  })();
  <?php endif; ?>

  // ── PHP-data charts ───────────────────────────────────────────────────────
  window.onload = function() {

    // Usuarios por Clase — Pie
    Highcharts.chart('chartUsuariosPorClase', {
      chart: { type: 'pie' },
      title: { text: 'Usuarios por Clase' },
      subtitle: { text: 'Todos los personajes del servidor' },
      tooltip: { pointFormat: '{series.name}: <b>{point.y}</b> ({point.percentage:.1f}%)' },
      plotOptions: {
        pie: {
          allowPointSelect: true, cursor: 'pointer', showInLegend: true,
          dataLabels: { enabled: false }
        }
      },
      series: [{ name: 'Usuarios', colorByPoint: true, data: <?php echo json_encode(getUsuariosPorClase()); ?> }]
    });

    // Clases por Raza — Column
    Highcharts.chart('chartClasesPorRaza', {
      chart: { type: 'column' },
      title: { text: 'Clases por Raza' },
      subtitle: { text: 'Todos los personajes del servidor' },
      xAxis: {
        categories: ['Mago','Clérigo','Guerrero','Asesino','Bardo','Druida','Paladín','Cazador','Trabajador','Bandido'],
        crosshair: true
      },
      yAxis: { min: 0, title: { text: 'Número de usuarios' } },
      tooltip: {
        headerFormat: '<span style="font-size:10px">{point.key}</span><table>',
        pointFormat: '<tr><td style="color:{series.color};padding:0">{series.name}: </td><td style="padding:0"><b>{point.y} pjs</b></td></tr>',
        footerFormat: '</table>', shared: true, useHTML: true
      },
      plotOptions: { column: { pointPadding: 0.2, borderWidth: 0 } },
      series: <?php echo json_encode(getClasesPorRaza()); ?>
    });

    // Nivel: desde lvl 13, pointStart dinámico desde PHP
    var levelData     = <?php echo json_encode($levelObj['data']); ?>;
    var levelMinStart = <?php echo intval($levelObj['minLevel']); ?>;
    Highcharts.chart('chartUsuariosPorLevel', {
      chart: { type: 'areaspline' },
      title: { text: 'Usuarios por Nivel' },
      subtitle: { text: 'Personajes desde nivel ' + levelMinStart + ' en adelante' },
      xAxis: { title: { text: 'Nivel' }, allowDecimals: false },
      yAxis: { title: { text: 'Cantidad de usuarios' } },
      tooltip: {
        formatter: function() { return 'Nivel <b>' + this.x + '</b>: ' + this.y + ' personajes'; }
      },
      plotOptions: {
        areaspline: {
          pointStart: levelMinStart,
          fillColor: { linearGradient: { x1:0, y1:0, x2:0, y2:1 }, stops: [[0,'rgba(201,149,42,0.3)'],[1,'rgba(201,149,42,0.01)']] },
          marker: { enabled: false }, lineWidth: 2
        }
      },
      series: [{ name: 'Personajes', data: levelData }]
    });

    // Kills por Clase — Bar
    var killsData = <?php echo json_encode(getKillsPorClase()); ?>;
    Highcharts.chart('chartUsuariosMatadosPorClase', {
      chart: { type: 'bar' },
      title: { text: 'Kills Promedio por Clase' },
      subtitle: { text: 'Todos los personajes del servidor' },
      xAxis: { categories: killsData.map(function(x){ return x.name; }), title: { text: 'Clase' } },
      yAxis: { min: 0, title: { text: 'Promedio de kills', align: 'high' }, labels: { overflow: 'justify' } },
      tooltip: { valueSuffix: ' kills' },
      plotOptions: { bar: { dataLabels: { enabled: true, style: { color: '#D4C5A0', textOutline: 'none' } } } },
      series: [{ name: 'Kills promedio', data: killsData.map(function(x){ return x.y; }) }]
    });
  };
  </script>
</body>
</html>
