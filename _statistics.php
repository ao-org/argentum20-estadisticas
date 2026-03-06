<?php
include('environment.php');

/**
 * Ejecuta una consulta que retorna una sola fila.
 * Devuelve null si no hay resultados o hay error de conexión.
 */
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

/**
 * Ejecuta una consulta que retorna múltiples filas.
 * Devuelve array vacío si hay error.
 */
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
    $users = executeGetQuery("SELECT COUNT(1) as count FROM user WHERE deleted = 0 AND guild_index <> 1");
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
    $validClassIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 12];
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

function getUsuariosPorLevel() {
    $rows = executeGetMultipleRowsQuery(
        "SELECT level, COUNT(id) as count FROM user
         WHERE deleted = false AND level >= 1
         GROUP BY level ORDER BY level ASC"
    );
    $levelToCount = [];
    $maxLevel = 1;
    foreach ($rows as $entry) {
        $level = intval($entry['level']);
        $levelToCount[$level] = intval($entry['count']);
        if ($level > $maxLevel) $maxLevel = $level;
    }
    $result = [];
    for ($level = 1; $level <= $maxLevel; $level++) {
        $result[] = $levelToCount[$level] ?? 0;
    }
    return $result;
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
