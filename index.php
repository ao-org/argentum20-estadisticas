<?php
include('_statistics.php');
$stats = getGeneralStats();
?>

<!DOCTYPE html>
<html lang="en" data-theme="night">

<head>
  <meta charset="utf-8">
  <title>AO20 - Estadisticas</title>
  <!-- Prevent flash of wrong theme -->
  <script>
    (function(){var t=localStorage.getItem('ao20-theme');if(t==='light')document.documentElement.setAttribute('data-theme','light');else document.documentElement.setAttribute('data-theme','night');})();
  </script>
  <link rel="icon" type="image/x-icon" href="/favicon.ico">
  <link rel="shortcut icon" href="/favicon.ico">
  <!-- DaisyUI 5 + Tailwind CSS 4 via CDN -->
  <link href="https://cdn.jsdelivr.net/npm/daisyui@5/daisyui.css" rel="stylesheet" />
  <link href="https://cdn.jsdelivr.net/npm/daisyui@5/themes.css" rel="stylesheet" />
  <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>

  <link href="./css/cucsi.css" rel="stylesheet">
  
</head>

<body>

  <!-- DaisyUI Navbar -->
  <nav class="navbar bg-base-100 shadow-lg fixed top-0 z-50">
    <div class="max-w-7xl mx-auto w-full px-4 flex items-center gap-3">
      <img src="img/logo.png" alt="AO20 Logo" />
      <span class="text-xl font-bold">Estadísticas AO</span>
      <div class="ml-auto">
        <label class="swap swap-rotate btn btn-ghost btn-circle" aria-label="Toggle theme">
          <input type="checkbox" id="themeToggle" />
          <!-- Sun icon (shown when dark, click to go light) -->
          <svg class="swap-off h-6 w-6 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M5.64,17l-.71.71a1,1,0,0,0,0,1.41,1,1,0,0,0,1.41,0l.71-.71A1,1,0,0,0,5.64,17ZM5,12a1,1,0,0,0-1-1H3a1,1,0,0,0,0,2H4A1,1,0,0,0,5,12Zm7-7a1,1,0,0,0,1-1V3a1,1,0,0,0-2,0V4A1,1,0,0,0,12,5ZM5.64,7.05a1,1,0,0,0,.7.29,1,1,0,0,0,.71-.29,1,1,0,0,0,0-1.41l-.71-.71A1,1,0,0,0,4.93,6.34Zm12,.29a1,1,0,0,0,.7-.29l.71-.71a1,1,0,1,0-1.41-1.41L17,5.64a1,1,0,0,0,0,1.41A1,1,0,0,0,17.66,7.34ZM21,11H20a1,1,0,0,0,0,2h1a1,1,0,0,0,0-2Zm-9,8a1,1,0,0,0-1,1v1a1,1,0,0,0,2,0V20A1,1,0,0,0,12,19ZM18.36,17A1,1,0,0,0,17,18.36l.71.71a1,1,0,0,0,1.41,0,1,1,0,0,0,0-1.41ZM12,6.5A5.5,5.5,0,1,0,17.5,12,5.51,5.51,0,0,0,12,6.5Zm0,9A3.5,3.5,0,1,1,15.5,12,3.5,3.5,0,0,1,12,15.5Z"/></svg>
          <!-- Moon icon (shown when light, click to go dark) -->
          <svg class="swap-on h-6 w-6 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M21.64,13a1,1,0,0,0-1.05-.14,8.05,8.05,0,0,1-3.37.73A8.15,8.15,0,0,1,9.08,5.49a8.59,8.59,0,0,1,.25-2A1,1,0,0,0,8,2.36,10.14,10.14,0,1,0,22,14.05,1,1,0,0,0,21.64,13Zm-9.5,6.69A8.14,8.14,0,0,1,7.08,5.22v.27A10.15,10.15,0,0,0,17.22,15.63a9.79,9.79,0,0,0,2.1-.22A8.11,8.11,0,0,1,12.14,19.73Z"/></svg>
        </label>
      </div>
    </div>
  </nav>

  <!-- Section Navigation (sticky below navbar) -->
  <div class="section-nav sticky top-16 z-40 bg-base-100 border-b border-base-300">
    <div class="max-w-7xl mx-auto px-4">
      <ul class="menu menu-horizontal flex-nowrap overflow-x-auto">
        <li><a href="#section-general">General</a></li>
        <li><a href="#section-personajes">Personajes</a></li>
        <li><a href="#section-combate">Combate</a></li>
        <li><a href="#section-economia">Economía</a></li>
        <li><a href="#section-rankings">Rankings</a></li>
        <li><a href="#section-comunidad">Comunidad</a></li>
        <li><a href="#section-pvp-combate">PvP y Combate</a></li>
        <li><a href="#section-economia-avanzada">Economía Avanzada</a></li>
        <li><a href="#section-social-guilds">Social y Guilds</a></li>
        <li><a href="#section-construccion-personaje">Construcción de Personaje</a></li>
        <li><a href="#section-actividad">Actividad</a></li>
        <li><a href="#section-eventos-globales">Eventos Globales</a></li>
        <li><a href="#section-otros">Otros</a></li>
      </ul>
    </div>
  </div>

  <!-- Main Content Container -->
  <main class="max-w-7xl mx-auto px-4 pt-8 pb-16">

    <!-- Hero Heading -->
    <h1 class="text-3xl font-bold mb-8">Estadísticas del Servidor</h1>

    <!-- Section: General -->
    <section id="section-general" class="mb-16">
      <h2 class="text-2xl font-semibold mb-6">General</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="stat bg-base-100 rounded-box shadow">
          <div class="stat-title">Cuentas creadas</div>
          <div class="stat-value"><?php echo !empty($stats['accounts']) ? $stats['accounts'] : '—'; ?></div>
        </div>
        <div class="stat bg-base-100 rounded-box shadow">
          <div class="stat-title">Personajes creados</div>
          <div class="stat-value"><?php echo !empty($stats['users']) ? $stats['users'] : '—'; ?></div>
        </div>
      </div>
    </section>

    <!-- Section: Personajes -->
    <section id="section-personajes" class="mb-16">
      <h2 class="text-2xl font-semibold mb-6">Personajes</h2>
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="card bg-base-100 shadow">
          <div class="card-body">
            <h3 class="card-title">Usuarios por clase</h3>
            <div class="chart-container chart-h-pie"><canvas id="chartUsuariosPorClase"></canvas></div>
          </div>
        </div>
        <div class="card bg-base-100 shadow">
          <div class="card-body">
            <h3 class="card-title">Clases por raza</h3>
            <div class="chart-container chart-h-column"><canvas id="chartClasesPorRaza"></canvas></div>
          </div>
        </div>
        <div class="card bg-base-100 shadow">
          <div class="card-body">
            <h3 class="card-title">Usuarios por nivel</h3>
            <div class="chart-container chart-h-column"><canvas id="chartUsuariosPorLevel"></canvas></div>
          </div>
        </div>
        <div class="card bg-base-100 shadow">
          <div class="card-body">
            <h3 class="card-title">Distribución de Género</h3>
            <div class="chart-container chart-h-pie"><canvas id="chartGenderDistribution"></canvas></div>
          </div>
        </div>
      </div>
    </section>

    <!-- Section: Combate -->
    <section id="section-combate" class="mb-16">
      <h2 class="text-2xl font-semibold mb-6">Combate</h2>
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="card bg-base-100 shadow">
          <div class="card-body">
            <h3 class="card-title">Usuarios matados por clase</h3>
            <div class="chart-container chart-h-bar"><canvas id="chartUsuariosMatadosPorClase"></canvas></div>
          </div>
        </div>
        <div class="card bg-base-100 shadow">
          <div class="card-body">
            <h3 class="card-title">Distribución de ELO</h3>
            <div class="chart-container chart-h-column"><canvas id="chartEloDistribution"></canvas></div>
          </div>
        </div>
        <div class="card bg-base-100 shadow">
          <div class="card-body">
            <h3 class="card-title">Ratio K/D por Clase</h3>
            <div class="chart-container chart-h-bar"><canvas id="chartKdRatio"></canvas></div>
          </div>
        </div>
      </div>
    </section>

    <!-- Section: Economía -->
    <section id="section-economia" class="mb-16">
      <h2 class="text-2xl font-semibold mb-6">Economía</h2>
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="card bg-base-100 shadow lg:col-span-2">
          <div class="card-body">
            <h3 class="card-title">Inflación de Oro</h3>
            <div class="chart-container chart-h-timeseries"><canvas id="goldInflation"></canvas></div>
          </div>
        </div>
        <div class="card bg-base-100 shadow">
          <div class="card-body">
            <h3 class="card-title">Distribución de Oro por Nivel</h3>
            <div class="chart-container chart-h-column"><canvas id="chartGoldByLevel"></canvas></div>
          </div>
        </div>
        <div class="card bg-base-100 shadow lg:col-span-2">
          <div class="card-body">
            <h3 class="card-title">Cantidad de items</h3>
            <div class="chart-container chart-h-timeseries"><canvas id="itemsQuantity"></canvas></div>
            <div id="itemsSelectedTags" class="mt-2.5 flex flex-wrap gap-1"></div>
            <div class="mt-2.5 flex items-center gap-2 relative">
              <input type="text" id="itemsSearch" class="input input-bordered w-full max-w-xs" placeholder="Cargando datos de items..." disabled />
              <button id="itemsSearchClear" class="btn btn-secondary btn-sm hidden">&#x2715; Limpiar</button>
              <span id="itemsSearchCount" class="text-base-content/60 text-sm"></span>
              <span id="itemsLimitMsg" class="text-error text-sm hidden font-medium"></span>
            </div>
            <div id="itemsResultsList" class="max-w-xs max-h-64 overflow-y-auto hidden mt-1"></div>
          </div>
        </div>
      </div>
    </section>

    <!-- Section: Rankings -->
    <section id="section-rankings" class="mb-16">
      <h2 class="text-2xl font-semibold mb-6">Rankings</h2>
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="card bg-base-100 shadow">
          <div class="card-body">
            <h3 class="card-title">Top Guilds</h3>
            <div class="chart-container chart-h-bar-tall"><canvas id="chartTopGuilds"></canvas></div>
          </div>
        </div>
        <div class="card bg-base-100 shadow">
          <div class="card-body">
            <h3 class="card-title">Leaderboard de Pesca</h3>
            <div class="chart-container chart-h-bar-tall"><canvas id="chartFishingLeaderboard"></canvas></div>
          </div>
        </div>
        <div class="card bg-base-100 shadow">
          <div class="card-body">
            <h3 class="card-title">Top Cazadores de NPCs</h3>
            <div class="chart-container chart-h-bar-tall"><canvas id="chartTopNpcHunters"></canvas></div>
          </div>
        </div>
      </div>
    </section>

    <!-- Section: Comunidad -->
    <section id="section-comunidad" class="mb-16">
      <h2 class="text-2xl font-semibold mb-6">Comunidad</h2>
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="card bg-base-100 shadow lg:col-span-2">
          <div class="card-body">
            <h3 class="card-title">Resumen de Facciones</h3>
            <div class="chart-container chart-h-column"><canvas id="chartFactionSummary"></canvas></div>
          </div>
        </div>
        <div class="card bg-base-100 shadow">
          <div class="card-body">
            <h3 class="card-title">Steam</h3>
            <iframe src="https://steamdb.info/embed/?appid=1956740" height="389" class="border-0 w-full" loading="lazy"></iframe>
          </div>
        </div>
      </div>
    </section>

    <!-- Section: PvP y Combate -->
    <section id="section-pvp-combate" class="mb-16">
      <h2 class="text-2xl font-semibold mb-6">PvP y Combate</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="card bg-base-200 shadow-xl">
          <div class="card-body">
            <h2 class="card-title text-sm">Ciudadanos vs Criminales</h2>
            <div class="chart-h-300">
              <canvas id="chartCiudadanosVsCriminales"></canvas>
            </div>
          </div>
        </div>
        <div class="card bg-base-200 shadow-xl">
          <div class="card-body">
            <h2 class="card-title text-sm">Clases Más Peligrosas</h2>
            <div class="chart-h-300">
              <canvas id="chartMostDangerousClasses"></canvas>
            </div>
          </div>
        </div>
        <div class="card bg-base-200 shadow-xl">
          <div class="card-body">
            <h2 class="card-title text-sm">PvP por Rango de Nivel</h2>
            <div class="chart-h-300">
              <canvas id="chartPvpByLevelBracket"></canvas>
            </div>
          </div>
        </div>
        <div class="card bg-base-200 shadow-xl">
          <div class="card-body">
            <h2 class="card-title text-sm">Distribución de Reenlistadas</h2>
            <div class="chart-h-300">
              <canvas id="chartReenlistadas"></canvas>
            </div>
          </div>
        </div>
        <div class="card bg-base-200 shadow-xl md:col-span-2">
          <div class="card-body">
            <h2 class="card-title text-sm">Heatmap Muertes/Kills por Clase y Raza</h2>
            <div id="chartDeathKillHeatmap" class="chart-h-heatmap overflow-x-auto"></div>
          </div>
        </div>
      </div>
    </section>

    <!-- Section: Economía Avanzada -->
    <section id="section-economia-avanzada" class="mb-16">
      <h2 class="text-2xl font-semibold mb-6">Economía Avanzada</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="card bg-base-200 shadow-xl">
          <div class="card-body">
            <h2 class="card-title text-sm">Curva de Lorenz</h2>
            <div id="giniValue" class="stat p-0 mb-2">
              <div class="stat-value text-2xl">—</div>
              <div class="stat-desc">Coeficiente de Gini</div>
            </div>
            <div class="chart-h-300">
              <canvas id="chartLorenzCurve"></canvas>
            </div>
          </div>
        </div>
        <div class="card bg-base-200 shadow-xl">
          <div class="card-body">
            <h2 class="card-title text-sm">Uso del Banco</h2>
            <div id="statBankUsage" class="stat p-0">
              <div class="stat-value text-2xl">—</div>
              <div class="stat-desc">—</div>
            </div>
          </div>
        </div>
        <div class="card bg-base-200 shadow-xl">
          <div class="card-body">
            <h2 class="card-title text-sm">Items Más Acumulados</h2>
            <div class="chart-h-300">
              <canvas id="chartMostHoardedItems"></canvas>
            </div>
          </div>
        </div>
        <div class="card bg-base-200 shadow-xl">
          <div class="card-body">
            <h2 class="card-title text-sm">Equipado vs No Equipado</h2>
            <div class="chart-h-300">
              <canvas id="chartEquippedVsUnequipped"></canvas>
            </div>
          </div>
        </div>
        <div class="card bg-base-200 shadow-xl">
          <div class="card-body">
            <h2 class="card-title text-sm">Tags Elementales</h2>
            <div class="chart-h-300">
              <canvas id="chartElementalTags"></canvas>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Section: Social y Guilds -->
    <section id="section-social-guilds" class="mb-16">
      <h2 class="text-2xl font-semibold mb-6">Social y Guilds</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="card bg-base-200 shadow-xl">
          <div class="card-body">
            <h2 class="card-title text-sm">Distribución de Tamaño de Guilds</h2>
            <div class="chart-h-300">
              <canvas id="chartGuildSizeDistribution"></canvas>
            </div>
          </div>
        </div>
        <div class="card bg-base-200 shadow-xl">
          <div class="card-body">
            <h2 class="card-title text-sm">Tasa de Rechazo de Guilds</h2>
            <div id="statGuildRejection" class="stat p-0">
              <div class="stat-value text-2xl">—</div>
              <div class="stat-desc">—</div>
            </div>
          </div>
        </div>
        <div class="card bg-base-200 shadow-xl">
          <div class="card-body">
            <h2 class="card-title text-sm">Tasa de Matrimonio</h2>
            <div id="statMarriage" class="stat p-0">
              <div class="stat-value text-2xl">—</div>
              <div class="stat-desc">—</div>
            </div>
          </div>
        </div>
        <div class="card bg-base-200 shadow-xl">
          <div class="card-body">
            <h2 class="card-title text-sm">Balance de Alineación de Guilds</h2>
            <div class="chart-h-300">
              <canvas id="chartGuildAlignmentBalance"></canvas>
            </div>
          </div>
        </div>
        <div class="card bg-base-200 shadow-xl">
          <div class="card-body">
            <h2 class="card-title text-sm">Concentración de Guilds</h2>
            <div class="chart-h-300">
              <canvas id="chartGuildConcentration"></canvas>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Section: Construcción de Personaje -->
    <section id="section-construccion-personaje" class="mb-16">
      <h2 class="text-2xl font-semibold mb-6">Construcción de Personaje</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div class="card bg-base-200 shadow-xl">
          <div class="card-body">
            <h2 class="card-title text-sm">Patrones de Skill Points</h2>
            <div class="chart-h-300">
              <canvas id="chartSkillPointPatterns"></canvas>
            </div>
          </div>
        </div>
        <div class="card bg-base-200 shadow-xl">
          <div class="card-body">
            <h2 class="card-title text-sm">Popularidad de Hechizos</h2>
            <div class="chart-h-300">
              <canvas id="chartSpellPopularity"></canvas>
            </div>
          </div>
        </div>
        <div class="card bg-base-200 shadow-xl">
          <div class="card-body">
            <h2 class="card-title text-sm">Adopción de Skins</h2>
            <div id="statSkinAdoption" class="stat p-0">
              <div class="stat-value text-2xl">—</div>
              <div class="stat-desc">—</div>
            </div>
          </div>
        </div>
        <div class="card bg-base-200 shadow-xl">
          <div class="card-body">
            <h2 class="card-title text-sm">Top 15 Skins</h2>
            <div class="chart-h-300">
              <canvas id="chartTopSkins"></canvas>
            </div>
          </div>
        </div>
        <div class="card bg-base-200 shadow-xl">
          <div class="card-body">
            <h2 class="card-title text-sm">Posesión de Mascotas</h2>
            <div id="statPetOwnership" class="stat p-0">
              <div class="stat-value text-2xl">—</div>
              <div class="stat-desc">—</div>
            </div>
          </div>
        </div>
        <div class="card bg-base-200 shadow-xl">
          <div class="card-body">
            <h2 class="card-title text-sm">Top 15 Mascotas</h2>
            <div class="chart-h-300">
              <canvas id="chartTopPets"></canvas>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Section: Actividad -->
    <section id="section-actividad" class="mb-16">
      <h2 class="text-2xl font-semibold mb-6">Actividad</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="card bg-base-200 shadow-xl">
          <div class="card-body">
            <h2 class="card-title text-sm">Cuentas Multi-Personaje</h2>
            <div class="chart-h-300">
              <canvas id="chartMultiCharacterAccounts"></canvas>
            </div>
          </div>
        </div>
        <div class="card bg-base-200 shadow-xl">
          <div class="card-body">
            <h2 class="card-title text-sm">Personajes por Mapa</h2>
            <div class="chart-h-300">
              <canvas id="chartCharactersPerMap"></canvas>
            </div>
          </div>
        </div>
        <div class="card bg-base-200 shadow-xl">
          <div class="card-body">
            <h2 class="card-title text-sm">Tasa de Personajes Muertos</h2>
            <div id="statDeadCharacter" class="stat p-0">
              <div class="stat-value text-2xl">—</div>
              <div class="stat-desc">—</div>
            </div>
          </div>
        </div>
        <div class="card bg-base-200 shadow-xl">
          <div class="card-body">
            <h2 class="card-title text-sm">Tasa de Navegación</h2>
            <div id="statSailing" class="stat p-0">
              <div class="stat-value text-2xl">—</div>
              <div class="stat-desc">—</div>
            </div>
          </div>
        </div>
        <div class="card bg-base-200 shadow-xl md:col-span-2">
          <div class="card-body">
            <h2 class="card-title text-sm">Correlación Pesca vs Combate</h2>
            <div class="chart-h-300">
              <canvas id="chartFishingCombatCorrelation"></canvas>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Section: Eventos Globales -->
    <section id="section-eventos-globales" class="mb-16">
      <h2 class="text-2xl font-semibold mb-6">Eventos Globales</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="card bg-base-200 shadow-xl">
          <div class="card-body">
            <h2 class="card-title text-sm">Participación en Quests Globales</h2>
            <div id="statQuestParticipation" class="stat p-0">
              <div class="stat-value text-2xl">—</div>
              <div class="stat-desc">—</div>
            </div>
          </div>
        </div>
        <div class="card bg-base-200 shadow-xl">
          <div class="card-body">
            <h2 class="card-title text-sm">Completado de Quests Globales</h2>
            <div class="chart-h-300">
              <canvas id="chartGlobalQuestCompletion"></canvas>
            </div>
          </div>
        </div>
        <div class="card bg-base-200 shadow-xl md:col-span-2">
          <div class="card-body">
            <h2 class="card-title text-sm">Retención de Cuentas</h2>
            <div class="chart-h-300">
              <canvas id="chartAccountRetention"></canvas>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Section: Otros -->
    <section id="section-otros" class="mb-16">
      <h2 class="text-2xl font-semibold mb-6">Otros</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="card bg-base-200 shadow-xl">
          <div class="card-body">
            <h2 class="card-title text-sm">Tasa de Patrones/Donantes</h2>
            <div id="statPatronDonor" class="stat p-0">
              <div class="stat-value text-2xl">—</div>
              <div class="stat-desc">—</div>
            </div>
          </div>
        </div>
        <div class="card bg-base-200 shadow-xl">
          <div class="card-body">
            <h2 class="card-title text-sm">Quests Completadas por Clase</h2>
            <div class="chart-h-300">
              <canvas id="chartQuestCompletionByClass"></canvas>
            </div>
          </div>
        </div>
        <div class="card bg-base-200 shadow-xl md:col-span-2">
          <div class="card-body">
            <h2 class="card-title text-sm">Muertes vs Nivel</h2>
            <div class="chart-h-300">
              <canvas id="chartDeathsVsLevel"></canvas>
            </div>
          </div>
        </div>
      </div>
    </section>

  </main>

  <!-- Chart.js -->
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.5.0/dist/chart.umd.min.js" integrity="sha384-XcdcwHqIPULERb2yDEM4R0XaQKU3YnDsrTmjACBZyfdVVqjh6xQ4/DCMd7XLcA6Y" crossorigin="anonymous" defer></script>
  <!-- Hammer.js (zoom plugin dependency) -->
  <script src="https://cdn.jsdelivr.net/npm/hammerjs@2.0.8/hammer.min.js" integrity="sha384-Cs3dgUx6+jDxxuqHvVH8Onpyj2LF1gKZurLDlhqzuJmUqVYMJ0THTWpxK5Z086Zm" crossorigin="anonymous" defer></script>
  <!-- chartjs-plugin-zoom -->
  <script src="https://cdn.jsdelivr.net/npm/chartjs-plugin-zoom@2.2.0/dist/chartjs-plugin-zoom.min.js" integrity="sha384-dwwI6ICEN/0ZQlS5owhUa/6ZzvwUPmjH45bFVCAcjgjTulbHJvlE+TGU3g1k0N3R" crossorigin="anonymous" defer></script>
  <!-- chartjs-adapter-date-fns (required for time scale) -->
  <script src="https://cdn.jsdelivr.net/npm/chartjs-adapter-date-fns@3.0.0/dist/chartjs-adapter-date-fns.bundle.min.js" crossorigin="anonymous" defer></script>
  <!-- AO20 modular scripts -->
  <script src="./js/config.js" defer></script>
  <script src="./js/data-utils.js" defer></script>
  <script src="./js/renderers.js" defer></script>
  <script src="./js/items-filter.js" defer></script>
  <script src="./js/navigation.js" defer></script>
  <script src="./js/init.js" defer></script>
  <script src="./js/theme-toggle.js" defer></script>
</body>

</html>
