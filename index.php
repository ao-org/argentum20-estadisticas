<?php
include('_statistics.php');
$stats = getGeneralStats();
?>

<!DOCTYPE html>
<html lang="en">

<head>
  <!-- Bootstrap core CSS -->
  <link href="./vendor/bootstrap/css/bootstrap.min.css" rel="stylesheet">

  <link href="./vendor/bootstrap/css/bootswatch.min.css" rel="stylesheet">

  <!-- Favicon -->
  <link href="./css/cucsi.css" rel="stylesheet">

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
            <td><?php echo $stats['accounts']; ?></td>
          </tr>
          <tr>
            <td>Personajes creados</td>
            <td><?php echo $stats['users']; ?></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <div class="card mb-3">
    <div class="card-header">Usuarios por clase</div>
    <div class="card-body">
      <figure class="highcharts-figure">
        <div id="chartUsuariosPorClase"></div>
      </figure>
    </div>
  </div>

  <div class="card mb-3">
    <div class="card-header">Clases por raza</div>
    <div class="card-body">
      <figure class="highcharts-figure">
        <div id="chartClasesPorRaza"></div>
      </figure>
    </div>
  </div>

  <div class="card mb-3">
    <div class="card-header">Usuarios matados por clase</div>
    <div class="card-body">
      <figure class="highcharts-figure">
        <div id="chartUsuariosMatadosPorClase"></div>
      </figure>
    </div>
  </div>

  <div class="card mb-3">
    <div class="card-header">Usuarios por nivel</div>
    <div class="card-body">
      <figure class="highcharts-figure">
        <div id="chartUsuariosPorLevel"></div>
      </figure>
    </div>
  </div>

  <div class="card mb-3">
    <div class="card-header">Inflacion de Oro</div>
    <div class="card-body">
      <figure class="highcharts-figure">
        <div id="goldInflation"></div>
      </figure>
    </div>
  </div>

  <div class="card mb-3">
    <div class="card-header">Cantidad de items</div>
    <div class="card-body">
      <figure class="highcharts-figure">
        <div id="itemsQuantity"></div>
      </figure>
    </div>
  </div>

  <iframe src="https://steamdb.info/embed/?appid=1956740" height="389" style="border:0;overflow:hidden;width:100%" loading="lazy"></iframe>

  <!-- Bootstrap core JavaScript -->
  <script src="./vendor/jquery/jquery.min.js"></script>
  <script src="./vendor/popper/popper.min.js"></script>
  <script src="./vendor/bootstrap/js/bootstrap.min.js"></script>
  <script src="./vendor/Highcharts-8.0.4/code/highcharts.js"></script>
  <script src="./vendor/Highcharts-8.0.4/code/themes/dark-unica.js"></script>

  <script type="text/javascript">
    $.ajax({
      url: "https://api.ao20.com.ar:2083/statistics/getGoldStatistics",
      success: function(data) {
        var datetime = data.map(a => {
          var date = new Date(a.datetime);
          return (date.getMonth() + 1) + '/' + date.getDate() + '/' + date.getFullYear() + ' ' + date.getHours() + ':' + date.getMinutes();
        });

        var gold_total = data.map(a => a.gold_total);
        var gold_inventory = data.map(a => a.gold_inventory);
        var gold_bank = data.map(a => a.gold_bank);
        var gold_inventory_as_item = data.map(a => a.gold_inventory_as_item);
        var gold_bank_as_item = data.map(a => a.gold_bank_as_item);

        var chart = Highcharts.chart('goldInflation', {
          title: {
            text: 'Inflacion de Oro'
          },
          xAxis: {
            categories: datetime
          },
          yAxis: {
            title: {
              text: 'Oro'
            }
          },
          series: [{
            name: 'Oro Total',
            data: gold_total
          }, {
            name: 'Oro Inventario',
            data: gold_inventory
          }, {
            name: 'Oro en Banco',
            data: gold_bank
          }, {
            name: 'Oro en Inventario como Item',
            data: gold_inventory_as_item
          }, {
            name: 'Oro en Banco como Item',
            data: gold_bank_as_item
          }]
        });
      }
    });

    $.ajax({
      url: "https://api.ao20.com.ar:2083/statistics/getItemsStatistics",
      success: function(data) {
        let chartData = {};

        data.forEach((item) => {
          if (!chartData[item.NAME]) {
            chartData[item.NAME] = [];
          }

          chartData[item.NAME].push({
            x: new Date(item.datetime).getTime(),
            y: item.total_quantity
          });
        });

        let series = [];

        for (let itemName in chartData) {
          series.push({
            name: itemName,
            data: chartData[itemName]
          });
        }

        var chart = Highcharts.chart('itemsQuantity', {
          title: {
            text: 'Cantidad de items'
          },
          xAxis: {
            type: 'datetime',
            labels: {
              format: '{value:%Y-%m-%d %H:%M}',
              rotation: -45
            }
          },
          yAxis: {
            title: {
              text: 'Cantidad'
            }
          },
          series: series
        });
      }
    });

    window.onload = () => {
      Highcharts.chart('chartUsuariosPorClase', {
        chart: {
          plotBackgroundColor: null,
          plotBorderWidth: null,
          plotShadow: false,
          type: 'pie'
        },
        title: {
          text: 'Usuarios por clase'
        },
        subtitle: {
          text: 'todos los personajes del servidor'
        },
        tooltip: {
          pointFormat: '{series.name}: <b>{point.y}</b>'
        },
        accessibility: {
          point: {
            valueSuffix: '%'
          }
        },
        plotOptions: {
          pie: {
            allowPointSelect: true,
            cursor: 'pointer',
            dataLabels: {
              enabled: false
            },
            showInLegend: true
          }
        },
        series: [{
          name: 'Usuarios',
          colorByPoint: true,
          data: <?php echo json_encode(getUsuariosPorClase()); ?>
        }]
      });

      Highcharts.chart('chartClasesPorRaza', {
        chart: {
          type: 'column'
        },
        title: {
          text: 'Clases por Raza'
        },
        subtitle: {
          text: 'todos los personajes del servidor'
        },
        xAxis: {
          categories: [
            'Mago',
            'Clerigo',
            'Guerrero',
            'Asesino',
            'Ladrón',
            'Bardo',
            'Druida',
            'Paladin',
            'Cazador',
            'Trabajador',
            'Pirata',
            'Bandido'
          ],
          crosshair: true
        },
        yAxis: {
          min: 0,
          title: {
            text: 'numero de usuarios'
          }
        },
        tooltip: {
          headerFormat: '<span style="font-size:10px">{point.key}</span><table>',
          pointFormat: '<tr><td style="color:{series.color};padding:0">{series.name}: </td>' +
            '<td style="padding:0"><b>{point.y} Pjs</b></td></tr>',
          footerFormat: '</table>',
          shared: true,
          useHTML: true
        },
        plotOptions: {
          column: {
            pointPadding: 0.2,
            borderWidth: 0
          }
        },
        series: <?php echo json_encode(getClasesPorRaza()); ?>
      });

      Highcharts.chart('chartUsuariosPorLevel', {
        title: {
          text: 'Usuarios por nivel'
        },
        subtitle: {
          text: 'solo contando niveles mayores a 13'
        },
        yAxis: {
          title: {
            text: 'Cantidad de usuarios'
          }
        },
        xAxis: {
          title: {
            text: 'Nivel'
          }
        },
        legend: {
          layout: 'horizontal',
          align: 'center',
          verticalAlign: 'bottom'
        },

        plotOptions: {
          series: {
            label: {
              connectorAllowed: false
            },
            pointStart: 14
          }
        },

        series: [{
          name: 'Cantidad de usuarios',
          data: <?php echo json_encode(getUsuariosPorLevel()); ?>
        }, ],

        responsive: {
          rules: [{
            condition: {
              maxWidth: 500
            },
            chartOptions: {
              legend: {
                layout: 'horizontal',
                align: 'center',
                verticalAlign: 'bottom'
              }
            }
          }]
        }
      });

      const chartData = <?php echo json_encode(getKillsPorClase()); ?>;

      Highcharts.chart('chartUsuariosMatadosPorClase', {
        chart: {
          type: 'bar'
        },
        title: {
          text: 'Promedio de usuarios matados por clase'
        },
        subtitle: {
          text: 'todos los personajes del servidor'
        },
        xAxis: {
          categories: chartData.map(x => x.name),
          title: {
            text: 'Clase'
          }
        },
        yAxis: {
          min: 0,
          title: {
            text: 'Promedio usuarios matados',
            align: 'high'
          },
          labels: {
            overflow: 'justify'
          }
        },
        tooltip: {
          valueSuffix: ''
        },
        plotOptions: {
          bar: {
            dataLabels: {
              enabled: true
            }
          }
        },
        legend: {
          layout: 'vertical',
          align: 'right',
          verticalAlign: 'top',
          x: -40,
          y: 80,
          floating: true,
          borderWidth: 1,
          backgroundColor: Highcharts.defaultOptions.legend.backgroundColor || '#FFFFFF',
          shadow: true
        },
        credits: {
          enabled: false
        },
        series: [{
          name: 'Usuarios Matados',
          data: chartData.map(x => x.y)
        }]
      });
    };
  </script>
</body>

</html>
