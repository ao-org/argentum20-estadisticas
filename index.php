<?php
include('_statistics.php');
$stats    = getGeneralStats();
$levelObj = getUsuariosPorLevel(); // ['data'=>[...], 'minLevel'=>13]
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
  var itemsChart = null;       // referencia al chart de Highcharts
  var itemsIndex = {};         // id -> { name, points[] }  — catálogo completo

  $.ajax({
    url: "https://api.ao20.com.ar:2083/statistics/getItemsStatistics",
    success: function(data) {
      // 1. Agrupar por item_id — clave única, evita colisiones por nombre duplicado
      var nameCount = {};
      data.forEach(function(item) {
        var id = String(item.item_id);
        if (!itemsIndex[id]) {
          itemsIndex[id] = { name: item.NAME, points: [] };
          nameCount[item.NAME] = (nameCount[item.NAME] || 0) + 1;
        }
        // Acumular cantidad por timestamp (suma si hay múltiples registros del mismo ts)
        var ts  = new Date(item.datetime).getTime();
        var qty = Number(item.total_quantity);
        var pts = itemsIndex[id].points;
        var last = pts.length ? pts[pts.length - 1] : null;
        if (last && last.x === ts) {
          last.y += qty; // mismo timestamp → sumar
        } else {
          pts.push({ x: ts, y: qty });
        }
      });

      // 2. Resolver labels: si hay nombre duplicado entre IDs distintos, agregar (#id)
      Object.keys(itemsIndex).forEach(function(id) {
        var entry = itemsIndex[id];
        if (nameCount[entry.name] > 1) entry.label = entry.name + ' (#' + id + ')';
        else entry.label = entry.name;
        // Ordenar puntos por fecha
        entry.points.sort(function(a, b) { return a.x - b.x; });
      });

      // 3. Dibujar gráfico vacío (ningún ítem visible por defecto)
      itemsChart = Highcharts.chart('itemsQuantity', {
        title: { text: 'Ítems en Circulación' },
        subtitle: { text: 'Buscá y seleccioná ítems para graficarlos' },
        xAxis: { type: 'datetime', labels: { format: '{value:%d/%m/%y}', rotation: -45 } },
        yAxis: { title: { text: 'Cantidad' } },
        tooltip: {
          xDateFormat: '%d/%m/%Y %H:%M',
          pointFormat: '<span style="color:{series.color}">●</span> {series.name}: <b>{point.y}</b><br/>'
        },
        legend: { enabled: true, maxHeight: 120 },
        series: []
      });

      // 4. Inicializar buscador
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

    // Agregar serie al chart existente (sin redibujar todo)
    itemsChart.addSeries({
      id:   'item-' + id,
      name: itemsIndex[id].label,
      data: itemsIndex[id].points.slice() // copia para no mutar el original
    }, true, false); // redraw=true, animation=false
  }

  function removeItem(id) {
    if (!itemsChart) return;
    delete selectedItemIds[id];
    var serie = itemsChart.get('item-' + id);
    if (serie) serie.remove(true, false);
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
