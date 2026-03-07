<?php
include('environment.php');

function executeGetQuery($query) {
    global $databaseHost, $databaseUserRead, $databasePasswordRead, $databaseName, $databasePort;
    $conn = mysqli_connect($databaseHost, $databaseUserRead, $databasePasswordRead, $databaseName, $databasePort);
    if (!$conn) return null;
    mysqli_set_charset($conn, 'utf8');
    $result = mysqli_query($conn, $query);
    $row = $result ? mysqli_fetch_assoc($result) : null;
    mysqli_close($conn);
    return $row;
}

function executeGetMultipleRowsQuery($query) {
    global $databaseHost, $databaseUserRead, $databasePasswordRead, $databaseName, $databasePort;
    $conn = mysqli_connect($databaseHost, $databaseUserRead, $databasePasswordRead, $databaseName, $databasePort);
    if (!$conn) return [];
    mysqli_set_charset($conn, 'utf8');
    $result = mysqli_query($conn, $query);
    $rows = [];
    if ($result) {
        while ($row = mysqli_fetch_assoc($result)) {
            $rows[] = $row;
        }
        mysqli_free_result($result);
    }
    mysqli_close($conn);
    return $rows;
}

function getRaza($raceId) {
    $map = [1=>'Humano', 2=>'Elfo', 3=>'Elfo Oscuro', 4=>'Gnomo', 5=>'Enano', 6=>'Orco'];
    return $map[intval($raceId)] ?? 'Otra';
}

function getClase($classId) {
    $map = [1=>'Mago', 2=>'Clérigo', 3=>'Guerrero', 4=>'Asesino', 5=>'Bardo',
            6=>'Druida', 7=>'Paladín', 8=>'Cazador', 9=>'Trabajador', 12=>'Bandido'];
    return $map[intval($classId)] ?? 'Otra';
}

function getGeneralStats() {
    $users    = executeGetQuery("SELECT COUNT(1) as count FROM user WHERE deleted = 0 AND guild_index <> 1");
    $accounts = executeGetQuery("SELECT COUNT(1) as count FROM account");
    return [
        'accounts' => $accounts['count'] ?? 0,
        'users'    => $users['count'] ?? 0,
    ];
}

function getUsuariosPorClase() {
    $rows = executeGetMultipleRowsQuery(
        "SELECT class_id, COUNT(id) as count FROM user
         WHERE deleted = false AND guild_index <> 1
         GROUP BY class_id ORDER BY class_id"
    );
    $result = [];
    foreach ($rows as $entry) {
        $result[] = ['name' => getClase($entry['class_id']), 'y' => intval($entry['count'])];
    }
    return $result;
}

function getClasesPorRaza() {
    $rows = executeGetMultipleRowsQuery(
        "SELECT race_id, class_id, COUNT(id) as count FROM user
         WHERE deleted = false AND guild_index <> 1
         GROUP BY race_id, class_id ORDER BY race_id, class_id"
    );
    $validClassIds  = [1, 2, 3, 4, 5, 6, 7, 8, 9, 12];
    $classIdToIndex = array_flip($validClassIds);
    $result = [];
    for ($i = 1; $i <= 6; $i++) {
        $result[$i] = ['name' => getRaza($i), 'data' => array_fill(0, 10, 0)];
    }
    foreach ($rows as $entry) {
        $classId = intval($entry['class_id']);
        $raceId  = intval($entry['race_id']);
        if (isset($classIdToIndex[$classId]) && isset($result[$raceId])) {
            $result[$raceId]['data'][$classIdToIndex[$classId]] = intval($entry['count']);
        }
    }
    return array_values($result);
}

/**
 * Retorna niveles desde MIN_LEVEL en adelante.
 * Devuelve ['data' => [...], 'minLevel' => 13]
 * para que el gráfico sepa dónde empieza el eje X.
 */
function getUsuariosPorLevel() {
    $minLevel = 13;
    $rows = executeGetMultipleRowsQuery(
        "SELECT level, COUNT(id) as count FROM user
         WHERE deleted = false AND level >= $minLevel
         GROUP BY level ORDER BY level ASC"
    );
    $levelToCount = [];
    $maxLevel = $minLevel;
    foreach ($rows as $entry) {
        $level = intval($entry['level']);
        $levelToCount[$level] = intval($entry['count']);
        if ($level > $maxLevel) $maxLevel = $level;
    }
    $result = [];
    for ($level = $minLevel; $level <= $maxLevel; $level++) {
        $result[] = $levelToCount[$level] ?? 0;
    }
    return ['data' => $result, 'minLevel' => $minLevel];
}

function getKillsPorClase() {
    $rows = executeGetMultipleRowsQuery(
        "SELECT class_id, AVG(ciudadanos_matados + criminales_matados) as promedio_matados
         FROM user
         WHERE deleted = FALSE AND guild_index <> 1
           AND class_id IN (1,2,3,4,5,6,7,8,9,12)
         GROUP BY class_id
         HAVING promedio_matados > 0
         ORDER BY promedio_matados DESC"
    );
    $result = [];
    foreach ($rows as $entry) {
        $result[] = ['name' => getClase($entry['class_id']), 'y' => round(floatval($entry['promedio_matados']), 1)];
    }
    return $result;
}

function getUsuariosOnlinePorHora() {
    $rows = executeGetMultipleRowsQuery(
        "SELECT HOUR(date) as hora, AVG(number) as users
         FROM statistics_users_online GROUP BY HOUR(date)"
    );
    $result = array_fill(0, 24, 0);
    foreach ($rows as $entry) {
        $result[intval($entry['hora'])] = round(floatval($entry['users']), 1);
    }
    return $result;
}

/**
 * Verifica si una columna existe en la tabla user de MySQL.
 * Permite que las funciones nuevas fallen silenciosamente
 * si la columna aún no fue migrada a producción.
 */
function columnExistsInUser($columnName) {
    global $databaseHost, $databaseUserRead, $databasePasswordRead, $databaseName, $databasePort;
    $conn = mysqli_connect($databaseHost, $databaseUserRead, $databasePasswordRead, $databaseName, $databasePort);
    if (!$conn) return false;
    $col   = mysqli_real_escape_string($conn, $columnName);
    $db    = mysqli_real_escape_string($conn, $databaseName);
    $result = mysqli_query($conn,
        "SELECT COUNT(*) AS cnt
         FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = '$db'
           AND TABLE_NAME   = 'user'
           AND COLUMN_NAME  = '$col'"
    );
    $row = $result ? mysqli_fetch_assoc($result) : null;
    mysqli_close($conn);
    return $row && intval($row['cnt']) > 0;
}

/**
 * Balance Real vs Caos.
 * Requiere columna faction_score en user.
 * Si no existe retorna valores en cero (no rompe la página).
 */
function getBalanceFacciones() {
    $empty = [
        'real_count' => 0, 'caos_count' => 0, 'neutral_count' => 0,
        'real_avg'   => 0, 'caos_avg'   => 0,
        'missing_column' => true,
    ];

    if (!columnExistsInUser('faction_score')) return $empty;

    $row = executeGetQuery(
        "SELECT
            SUM(CASE WHEN faction_score > 0 THEN 1 ELSE 0 END)  AS real_count,
            SUM(CASE WHEN faction_score < 0 THEN 1 ELSE 0 END)  AS caos_count,
            SUM(CASE WHEN faction_score = 0 THEN 1 ELSE 0 END)  AS neutral_count,
            ROUND(AVG(CASE WHEN faction_score > 0 THEN faction_score END), 1) AS real_avg,
            ROUND(AVG(CASE WHEN faction_score < 0 THEN faction_score END), 1) AS caos_avg
         FROM user
         WHERE deleted = 0 AND guild_index <> 1"
    );
    return [
        'real_count'     => intval($row['real_count']    ?? 0),
        'caos_count'     => intval($row['caos_count']    ?? 0),
        'neutral_count'  => intval($row['neutral_count'] ?? 0),
        'real_avg'       => floatval($row['real_avg']    ?? 0),
        'caos_avg'       => floatval($row['caos_avg']    ?? 0),
        'missing_column' => false,
    ];
}

/**
 * Distribución de puntos de pesca.
 * Requiere columna puntos_pesca en user.
 */
function getPuntosPesca() {
    $empty = [
        'pescadores' => 0, 'max_pesca' => 0, 'avg_pesca' => 0,
        'dist' => [], 'missing_column' => true,
    ];

    if (!columnExistsInUser('puntos_pesca')) return $empty;

    $summary = executeGetQuery(
        "SELECT
            COUNT(CASE WHEN puntos_pesca > 0 THEN 1 END) AS pescadores,
            MAX(puntos_pesca)                             AS max_pesca,
            ROUND(AVG(CASE WHEN puntos_pesca > 0 THEN puntos_pesca END), 1) AS avg_pesca
         FROM user WHERE deleted = 0 AND guild_index <> 1"
    );

    $rangos = executeGetMultipleRowsQuery(
        "SELECT
            CASE
                WHEN puntos_pesca = 0     THEN '0'
                WHEN puntos_pesca < 100   THEN '1-99'
                WHEN puntos_pesca < 500   THEN '100-499'
                WHEN puntos_pesca < 1000  THEN '500-999'
                WHEN puntos_pesca < 5000  THEN '1000-4999'
                WHEN puntos_pesca < 10000 THEN '5000-9999'
                ELSE '10000+'
            END AS rango,
            COUNT(*) AS cantidad
         FROM user
         WHERE deleted = 0 AND guild_index <> 1
         GROUP BY rango
         ORDER BY MIN(puntos_pesca)"
    );

    $dist = [];
    foreach ($rangos as $r) {
        $dist[] = ['name' => $r['rango'], 'y' => intval($r['cantidad'])];
    }

    return [
        'pescadores'     => intval($summary['pescadores'] ?? 0),
        'max_pesca'      => intval($summary['max_pesca']  ?? 0),
        'avg_pesca'      => floatval($summary['avg_pesca'] ?? 0),
        'dist'           => $dist,
        'missing_column' => false,
    ];
}

/**
 * % de personajes en clan vs sin clan.
 * guild_index y guild_aspirant_index — verifica que existan.
 */
function getDistribucionClanes() {
    $empty = [
        'total' => 0, 'en_clan' => 0, 'sin_clan' => 0,
        'aspirantes' => 0, 'pct_clan' => 0,
        'pie' => [], 'missing_column' => true,
    ];

    // guild_index ya se usa en otras queries, pero guild_aspirant_index puede no existir
    $hasAspirant = columnExistsInUser('guild_aspirant_index');
    $aspirantExpr = $hasAspirant
        ? "SUM(CASE WHEN guild_aspirant_index > 0 THEN 1 ELSE 0 END)"
        : "0";

    $row = executeGetQuery(
        "SELECT
            COUNT(*)                                           AS total,
            SUM(CASE WHEN guild_index > 1 THEN 1 ELSE 0 END) AS en_clan,
            SUM(CASE WHEN guild_index = 0 THEN 1 ELSE 0 END) AS sin_clan,
            $aspirantExpr                                     AS aspirantes
         FROM user
         WHERE deleted = 0 AND guild_index <> 1"
    );

    if (!$row) return $empty;

    $total      = max(1, intval($row['total']));
    $en_clan    = intval($row['en_clan']    ?? 0);
    $sin_clan   = intval($row['sin_clan']   ?? 0);
    $aspirantes = intval($row['aspirantes'] ?? 0);

    return [
        'total'          => $total,
        'en_clan'        => $en_clan,
        'sin_clan'       => $sin_clan,
        'aspirantes'     => $aspirantes,
        'pct_clan'       => round($en_clan / $total * 100, 1),
        'missing_column' => false,
        'pie'            => [
            ['name' => 'En clan',    'y' => $en_clan,    'color' => '#C9952A'],
            ['name' => 'Sin clan',   'y' => $sin_clan,   'color' => '#4a4a6a'],
            ['name' => 'Aspirantes', 'y' => $aspirantes, 'color' => '#7EB8D4'],
        ],
    ];
}
