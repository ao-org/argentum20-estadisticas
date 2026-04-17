<?php
include('_statistics.php');
$stats = getGeneralStats();
?>

<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="utf-8">
  <title>AO20 - Estadisticas</title>
  <link rel="icon" type="image/x-icon" href="/favicon.ico">
  <link rel="shortcut icon" href="/favicon.ico">
  <!-- Bootstrap 5 Bootswatch Darkly theme CSS -->
  <link href="https://cdn.jsdelivr.net/npm/bootswatch@5.3.8/dist/darkly/bootstrap.min.css" rel="stylesheet" integrity="sha384-t2UKecXY6tDoQIsEiNhYTaTFWmoHgQT7MV80h9huTejPYLkdgaOHv8ssDrS3Cdcw" crossorigin="anonymous">

  <link href="./css/cucsi.css" rel="stylesheet">
  
</head>

<body>

  <!-- Navigation -->
  <nav class="navbar navbar-expand-lg navbar-dark bg-dark fixed-top">
    <div class="container">
      <img src="img/logo.png" />
      <h1>Estadisticas AO</h1>
    </div>
  </nav>

  <!-- Page Content -->

  <!-- Blog Entries Column -->
  <h1 class="my-4">Estadisticas del servidor</h1>

  <div class="card mb-3">
    <div class="card-header">Estadisticas generales</div>
    <div class="card-body">
      <table class="table table-personaje">
        <tbody>
          <tr>
            <td>Cuentas creadas</td>
            <td><?php echo !empty($stats['accounts']) ? $stats['accounts'] : '—'; ?></td>
          </tr>
          <tr>
            <td>Personajes creados</td>
            <td><?php echo !empty($stats['users']) ? $stats['users'] : '—'; ?></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <div class="card mb-3">
    <div class="card-header">Usuarios por clase</div>
    <div class="card-body">
      <div class="chart-container"><canvas id="chartUsuariosPorClase"></canvas></div>
    </div>
  </div>

  <div class="card mb-3">
    <div class="card-header">Clases por raza</div>
    <div class="card-body">
      <div class="chart-container"><canvas id="chartClasesPorRaza"></canvas></div>
    </div>
  </div>

  <div class="card mb-3">
    <div class="card-header">Usuarios matados por clase</div>
    <div class="card-body">
      <div class="chart-container"><canvas id="chartUsuariosMatadosPorClase"></canvas></div>
    </div>
  </div>

  <div class="card mb-3">
    <div class="card-header">Usuarios por nivel</div>
    <div class="card-body">
      <div class="chart-container"><canvas id="chartUsuariosPorLevel"></canvas></div>
    </div>
  </div>

  <div class="card mb-3">
    <div class="card-header">Usuarios online por hora</div>
    <div class="card-body">
      <div class="chart-container"><canvas id="chartUsuariosOnlinePorHora"></canvas></div>
    </div>
  </div>

  <div class="card mb-3">
    <div class="card-header">Inflacion de Oro</div>
    <div class="card-body">
      <div class="chart-container"><canvas id="goldInflation"></canvas></div>
    </div>
  </div>

  <div class="card mb-3">
    <div class="card-header">Cantidad de items</div>
    <div class="card-body">
      <div class="chart-container"><canvas id="itemsQuantity"></canvas></div>
      <div id="itemsSelectedTags" style="margin-top: 10px; display: flex; flex-wrap: wrap; gap: 4px;"></div>
      <div style="margin-top: 10px; display: flex; align-items: center; gap: 8px; position: relative;">
        <input type="text" id="itemsSearch" class="form-control" placeholder="Cargando datos de items..." style="max-width: 350px;" disabled />
        <button id="itemsSearchClear" class="btn btn-secondary btn-sm" style="display:none;">&#x2715; Limpiar</button>
        <span id="itemsSearchCount" style="color: #aaa; font-size: 0.9em;"></span>
        <span id="itemsLimitMsg" style="color: #e74c3c; font-size: 0.85em; display: none;"></span>
      </div>
      <div id="itemsResultsList" class="list-group" style="max-width: 350px; max-height: 250px; overflow-y: auto; display: none; margin-top: 4px;"></div>
    </div>
  </div>

  <div class="card mb-3">
    <div class="card-header">Distribución de ELO</div>
    <div class="card-body">
      <div class="chart-container"><canvas id="chartEloDistribution"></canvas></div>
    </div>
  </div>

  <div class="card mb-3">
    <div class="card-header">Top Guilds</div>
    <div class="card-body">
      <div class="chart-container"><canvas id="chartTopGuilds"></canvas></div>
    </div>
  </div>

  <div class="card mb-3">
    <div class="card-header">Distribución de Oro por Nivel</div>
    <div class="card-body">
      <div class="chart-container"><canvas id="chartGoldByLevel"></canvas></div>
    </div>
  </div>

  <div class="card mb-3">
    <div class="card-header">Ratio K/D por Clase</div>
    <div class="card-body">
      <div class="chart-container"><canvas id="chartKdRatio"></canvas></div>
    </div>
  </div>

  <div class="card mb-3">
    <div class="card-header">Resumen de Facciones</div>
    <div class="card-body">
      <div class="chart-container"><canvas id="chartFactionSummary"></canvas></div>
    </div>
  </div>

  <div class="card mb-3">
    <div class="card-header">Leaderboard de Pesca</div>
    <div class="card-body">
      <div class="chart-container"><canvas id="chartFishingLeaderboard"></canvas></div>
    </div>
  </div>

  <div class="card mb-3">
    <div class="card-header">Completitud de Quests</div>
    <div class="card-body">
      <div class="chart-container"><canvas id="chartQuestCompletion"></canvas></div>
    </div>
  </div>

  <div class="card mb-3">
    <div class="card-header">Distribución de Género</div>
    <div class="card-body">
      <div class="chart-container"><canvas id="chartGenderDistribution"></canvas></div>
    </div>
  </div>

  <div class="card mb-3">
    <div class="card-header">Progreso de Eventos Globales</div>
    <div class="card-body">
      <div id="chartGlobalQuestProgress"></div>
    </div>
  </div>

  <div class="card mb-3">
    <div class="card-header">Top Cazadores de NPCs</div>
    <div class="card-body">
      <div class="chart-container"><canvas id="chartTopNpcHunters"></canvas></div>
    </div>
  </div>

  <iframe src="https://steamdb.info/embed/?appid=1956740" height="389" style="border:0;overflow:hidden;width:100%" loading="lazy"></iframe>

  <!-- Chart.js -->
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.5.0/dist/chart.umd.min.js" integrity="sha384-XcdcwHqIPULERb2yDEM4R0XaQKU3YnDsrTmjACBZyfdVVqjh6xQ4/DCMd7XLcA6Y" crossorigin="anonymous" defer></script>
  <!-- Hammer.js (zoom plugin dependency) -->
  <script src="https://cdn.jsdelivr.net/npm/hammerjs@2.0.8/hammer.min.js" integrity="sha384-Cs3dgUx6+jDxxuqHvVH8Onpyj2LF1gKZurLDlhqzuJmUqVYMJ0THTWpxK5Z086Zm" crossorigin="anonymous" defer></script>
  <!-- chartjs-plugin-zoom -->
  <script src="https://cdn.jsdelivr.net/npm/chartjs-plugin-zoom@2.2.0/dist/chartjs-plugin-zoom.min.js" integrity="sha384-dwwI6ICEN/0ZQlS5owhUa/6ZzvwUPmjH45bFVCAcjgjTulbHJvlE+TGU3g1k0N3R" crossorigin="anonymous" defer></script>
  <!-- Bootstrap 5 bundle (includes Popper) -->
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/js/bootstrap.bundle.min.js" integrity="sha384-FKyoEForCGlyvwx9Hj09JcYn3nv7wiPVlz7YYwJrWVcXK/BmnVDxM+D2scQbITxI" crossorigin="anonymous" defer></script>
  <!-- Charts module -->
  <script src="./js/charts.js" defer></script>
</body>

</html>
