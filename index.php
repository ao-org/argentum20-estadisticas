<?php
include('_statistics.php');
$stats = getGeneralStats();
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

  <!-- Navigation -->
  <nav class="navbar navbar-expand-lg navbar-dark fixed-top">
    <div class="container">
      <img src="img/logo.png" alt="AO Logo" />
      <h1>Estadísticas — Argentum Online</h1>
    </div>
  </nav>

  <div class="main-wrapper">

    <!-- Page Header -->
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

    <!-- Charts Grid: 2 columns -->
    <div class="charts-grid">

      <div class="card">
        <div class="card-header">Usuarios por Clase</div>
        <div class="card-body">
          <figure class="highcharts-figure">
            <div id="chartUsuariosPorClase"></div>
          </figure>
        </div>
      </div>

      <div class="card">
        <div class="card-header">Usuarios Matados por Clase</div>
        <div class="card-body">
          <figure class="highcharts-figure">
            <div id="chartUsuariosMatadosPorClase"></div>
          </figure>
        </div>
      </div>

    </div>

    <!-- Full-width charts -->
    <div class="card">
      <div class="card-header">Clases por Raza</div>
      <div class="card-body">
        <figure class="highcharts-figure">
          <div id="chartClasesPorRaza"></div>
        </figure>
      </div>
    </div>

    <div class="card">
      <div class="card-header">Distribución por Nivel</div>
      <div class="card-body">
        <figure class="highcharts-figure">
          <div id="chartUsuariosPorLevel"></div>
        </figure>
      </div>
    </div>

    <div class="card">
      <div class="card-header">Inflación de Oro</div>
      <div class="card-body">
        <figure class="highcharts-figure">
          <div id="goldInflation"></div>
        </figure>
      </div>
    </div>

    <div class="card">
      <div class="card-header">Cantidad de Ítems en Circulación</div>
      <div class="card-body">
        <figure class="highcharts-figure">
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

  <!-- Scripts -->
  <script src="./vendor/jquery/jquery.min.js"></script>
  <script src="./vendor/popper/popper.min.js"></script>
  <script src="./vendor/bootstrap/js/bootstrap.min.js"></script>
  <script src="./vendor/Highcharts-8.0.4/code/highcharts.js"></script>

  <script>
  // ── Highcharts dark theme matching our CSS variables ──────────────────────
  Highcharts.setOptions({
    colors: ['#C9952A','#7EB8D4','#A3C27A','#C07A8A','#8AA4C8','#D4A36A','#7ABBA8','#C8C87A','#B47AC8','#7AC8B4'],
    chart: {
      backgroundColor: '#111118',
      style: { fontFamily: "'Crimson Text', Georgia, serif" },
      plotBorderWidth: 0,
      plotBorderColor: 'transparent'
    },
    title:    { style: { color: '#F2C96A', fontFamily: "'Cinzel', serif", fontSize: '15px', letterSpacing: '0.05em' } },
    subtitle: { style: { color: '#7a6e58' } },
    xAxis: {
      gridLineColor: 'rgba(201,149,42,0.1)',
      lineColor:     'rgba(201,149,42,0.2)',
      tickColor:     'rgba(201,149,42,0.2)',
      labels: { style: { color: '#7a6e58' } },
      title: { style: { color: '#7a6e58' } }
    },
    yAxis: {
      gridLineColor: 'rgba(201,149,42,0.1)',
      lineColor:     'rgba(201,149,42,0.2)',
      tickColor:     'rgba(201,149,42,0.2)',
      labels: { style: { color: '#7a6e58' } },
      title: { style: { color: '#7a6e58' } }
    },
    legend: {
      itemStyle: { color: '#D4C5A0', fontFamily: "'Crimson Text', Georgia, serif" },
      itemHoverStyle: { color: '#F2C96A' }
    },
    tooltip: {
      backgroundColor: '#16161F',
      borderColor: 'rgba(201,149,42,0.4)',
      style: { color: '#D4C5A0' }
    },
    plotOptions: {
      series: { borderWidth: 0 },
      pie: {
        borderWidth: 2,
        borderColor: '#111118',
        dataLabels: { style: { color: '#D4C5A0', textOutline: 'none' } }
      }
    },
    credits: { enabled: false }
  });

  // ── Gold Inflation chart ──────────────────────────────────────────────────
  $.ajax({
    url: "https://api.ao20.com.ar:2083/statistics/getGoldStatistics",
    success: function(data) {
      var datetime = data.map(function(a) {
        var date = new Date(a.datetime);
        return (date.getMonth()+1)+'/'+date.getDate()+'/'+date.getFullYear()+' '+date.getHours()+':'+date.getMinutes();
      });
      Highcharts.chart('goldInflation', {
        title: { text: 'Inflación de Oro' },
        xAxis: { categories: datetime },
        yAxis: { title: { text: 'Oro' } },
        series: [
          { name: 'Oro Total',                  data: data.map(function(a){ return a.gold_total; }) },
          { name: 'Oro Inventario',             data: data.map(function(a){ return a.gold_inventory; }) },
          { name: 'Oro en Banco',               data: data.map(function(a){ return a.gold_bank; }) },
          { name: 'Oro Inventario (ítem)',       data: data.map(function(a){ return a.gold_inventory_as_item; }) },
          { name: 'Oro Banco (ítem)',            data: data.map(function(a){ return a.gold_bank_as_item; }) }
        ]
      });
    },
    error: function() {
      document.getElementById('goldInflation').innerHTML = '<div class="chart-loading">No hay datos disponibles</div>';
    }
  });

  // ── Items chart ────────────────────────────────────────────────────────────
  $.ajax({
    url: "https://api.ao20.com.ar:2083/statistics/getItemsStatistics",
    success: function(data) {
      // Agrupar por item_id (no por NAME) para evitar colisiones con nombres duplicados
      var byId    = {};   // item_id -> { name, points[] }
      var nameCount = {}; // nombre -> cuántos IDs distintos lo usan

      data.forEach(function(item) {
        var id = item.item_id;
        if (!byId[id]) {
          byId[id] = { name: item.NAME, points: [] };
          nameCount[item.NAME] = (nameCount[item.NAME] || 0) + 1;
        }
        byId[id].points.push({ x: new Date(item.datetime).getTime(), y: Number(item.total_quantity) });
      });

      var defaultVisibleIds = [474,475,478,58,2781,192,193,194,3391,3787,386,387,388,124,126,131,132,360,366,367,398,399,402,495,496,601,1098,1099,1246,1702,1767,1825,1907,1911,1929,1941,1987,2323,2598,2801,2804,2920,2933,3769,3770,40,41,469,540,3550,551,552,553,1722,1724,1788,1797,1869,1870,1876,3801,3802,3803,3806,3984,1758,1769,3990,4933,4934,4935,4936,519,530,2916,36,37,38,39,169,889,891,892,894,3894];

      var series = [];
      for (var id in byId) {
        var entry   = byId[id];
        var numId   = Number(id);
        // Si el nombre está duplicado entre distintos IDs, agregar "(#ID)" para distinguirlos
        var label   = (nameCount[entry.name] > 1) ? entry.name + ' (#' + id + ')' : entry.name;
        // Ordenar los puntos por fecha
        entry.points.sort(function(a, b) { return a.x - b.x; });
        series.push({
          name:    label,
          data:    entry.points,
          visible: defaultVisibleIds.indexOf(numId) !== -1
        });
      }

      Highcharts.chart('itemsQuantity', {
        title: { text: 'Ítems en Circulación' },
        xAxis: { type: 'datetime', labels: { format: '{value:%d/%m/%Y}', rotation: -45 } },
        yAxis: { title: { text: 'Cantidad' } },
        tooltip: { xDateFormat: '%d/%m/%Y %H:%M', pointFormat: '<span style="color:{series.color}">\u25CF</span> {series.name}: <b>{point.y}</b><br/>' },
        series: series
      });
    },
    error: function() {
      document.getElementById('itemsQuantity').innerHTML = '<div class="chart-loading">No hay datos disponibles</div>';
    }
  });

  // ── PHP-data charts (on load) ──────────────────────────────────────────────
  window.onload = function() {

    // Usuarios por Clase — Pie
    Highcharts.chart('chartUsuariosPorClase', {
      chart: { type: 'pie', plotBackgroundColor: null, plotBorderWidth: null, plotShadow: false },
      title: { text: 'Usuarios por Clase' },
      subtitle: { text: 'Todos los personajes del servidor' },
      tooltip: { pointFormat: '{series.name}: <b>{point.y}</b><br/>{point.percentage:.1f}%' },
      plotOptions: {
        pie: {
          allowPointSelect: true,
          cursor: 'pointer',
          dataLabels: { enabled: true, format: '<b>{point.name}</b>: {point.y}', style: { color: '#D4C5A0', textOutline: 'none', fontSize: '11px' } },
          showInLegend: false
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
        footerFormat: '</table>',
        shared: true, useHTML: true
      },
      plotOptions: { column: { pointPadding: 0.2, borderWidth: 0 } },
      series: <?php echo json_encode(getClasesPorRaza()); ?>
    });

    // Usuarios por Level — Line/Area
    Highcharts.chart('chartUsuariosPorLevel', {
      chart: { type: 'areaspline' },
      title: { text: 'Usuarios por Nivel' },
      subtitle: { text: 'Cantidad de personajes por nivel' },
      xAxis: { title: { text: 'Nivel' } },
      yAxis: { title: { text: 'Cantidad de usuarios' } },
      plotOptions: {
        areaspline: {
          pointStart: 1,
          fillColor: { linearGradient: { x1:0, y1:0, x2:0, y2:1 }, stops: [[0,'rgba(201,149,42,0.3)'],[1,'rgba(201,149,42,0.01)']] },
          marker: { enabled: false },
          lineWidth: 2
        }
      },
      series: [{ name: 'Usuarios', data: <?php echo json_encode(getUsuariosPorLevel()); ?> }]
    });

    // Kills por Clase — Bar
    var killsData = <?php echo json_encode(getKillsPorClase()); ?>;
    Highcharts.chart('chartUsuariosMatadosPorClase', {
      chart: { type: 'bar' },
      title: { text: 'Promedio de Kills por Clase' },
      subtitle: { text: 'Todos los personajes del servidor' },
      xAxis: { categories: killsData.map(function(x){ return x.name; }), title: { text: 'Clase' } },
      yAxis: { min: 0, title: { text: 'Promedio de usuarios matados', align: 'high' }, labels: { overflow: 'justify' } },
      plotOptions: { bar: { dataLabels: { enabled: true, style: { color: '#D4C5A0', textOutline: 'none' } } } },
      series: [{ name: 'Kills promedio', data: killsData.map(function(x){ return x.y; }) }]
    });

  };
  </script>
</body>
</html>
