<?php
include('environment.php');

/**
 * Returns a shared mysqli connection (lazy singleton).
 * Creates the connection on first call, caches it in a static variable.
 * Pass $reset = true to clear the cached connection (used by closeConnection).
 * Returns null on failure, logging the error server-side.
 */
function getConnection(bool $reset = false): ?mysqli {
    static $conn = null;

    if ($reset) {
        $conn = null;
        return null;
    }

    if ($conn !== null) {
        return $conn;
    }

    global $databaseHost, $databaseUserRead, $databasePasswordRead, $databaseName, $databasePort;

    $conn = @mysqli_connect($databaseHost, $databaseUserRead, $databasePasswordRead, $databaseName, $databasePort);

    if (!$conn) {
        error_log('[AO20 Stats] Connection failed: ' . mysqli_connect_error() . ' (errno: ' . mysqli_connect_errno() . ')');
        $conn = null;
        return null;
    }

    mysqli_set_charset($conn, 'utf8');

    return $conn;
}

/**
 * Closes the shared connection if open and resets the static variable.
 */
function closeConnection(): void {
    $conn = getConnection();
    if ($conn !== null) {
        mysqli_close($conn);
    }
    getConnection(true);
}

register_shutdown_function('closeConnection');

function executeGetQuery($query) {
    $conn = getConnection();
    if ($conn === null) {
        return [];
    }

    $result = mysqli_query($conn, $query);
    if (!$result) {
        error_log('[AO20 Stats] Query failed: ' . mysqli_error($conn) . ' — Query: ' . $query);
        return [];
    }

    $row = mysqli_fetch_assoc($result);
    return $row ?: [];
}


function executeGetMultipleRowsQuery($query) {
    $conn = getConnection();
    if ($conn === null) {
        return [];
    }

    $result = mysqli_query($conn, $query);
    if (!$result) {
        error_log('[AO20 Stats] Query failed: ' . mysqli_error($conn) . ' — Query: ' . $query);
        return [];
    }

    return mysqli_fetch_all($result, MYSQLI_ASSOC);
}

$RACE_NAMES = [
    1 => 'Humano',
    2 => 'Elfo',
    3 => 'Elfo Oscuro',
    4 => 'Gnomo',
    5 => 'Enano',
    6 => 'Orco',
];

$CLASS_NAMES = [
    1  => 'Mago',
    2  => 'Clérigo',
    3  => 'Guerrero',
    4  => 'Asesino',
    5  => 'Bardo',
    6  => 'Druida',
    7  => 'Paladin',
    8  => 'Cazador',
    9  => 'Trabajador',
    12 => 'Bandido',
];

function getRaza($raceId) {
    global $RACE_NAMES;
    return $RACE_NAMES[intval($raceId)] ?? 'Otra';
}

function getClase($classId) {
    global $CLASS_NAMES;
    return $CLASS_NAMES[intval($classId)] ?? 'Otra';
}

function getGeneralStats()
{
    $query = <<<SQL
        SELECT COUNT(1) as count
        FROM user
        WHERE deleted <> 1
            AND guild_index <> 1
            AND (is_banned IS NULL OR is_banned <> 1);
SQL;


    $users = executeGetQuery($query);

    $query = <<<SQL
        SELECT COUNT(1) as count
        FROM account
        WHERE (is_banned IS NULL OR is_banned <> 1);
SQL;
    $accounts = executeGetQuery($query);

    return array(
        'accounts' => $accounts['count'],
        'users' => $users['count'],
    );
}

function getUsuariosPorClase()
{
    $query = <<<SQL
        SELECT class_id, COUNT(id) as count
        FROM user
        WHERE deleted <> 1
            AND guild_index <> 1
        GROUP BY class_id
        ORDER BY class_id;
SQL;

    $usuariosPorClase = executeGetMultipleRowsQuery($query);

    $result = array();

    foreach ($usuariosPorClase as $entry) {
        $result[] = array(
            'name' => getClase($entry['class_id']),
            'y' => intval($entry['count'])
        );
    }

    return $result;
}

function getClasesPorRaza()
{
    $query = <<<SQL
        SELECT race_id, class_id, COUNT(id) as count
        FROM user
        WHERE deleted <> 1
            AND guild_index <> 1
        GROUP BY race_id, class_id
        ORDER BY race_id, class_id;
SQL;

    $clasesPorRaza = executeGetMultipleRowsQuery($query);

    $result = array();

    // Orden fijo de clases válidas: 1..9 y 12 (excluye 10 y 11/pirata u obsoletas)
    $validClassIds = array(1, 2, 3, 4, 5, 6, 7, 8, 9, 12);
    $classIdToIndex = array();
    foreach ($validClassIds as $idx => $cid) {
        $classIdToIndex[$cid] = $idx;
    }

    for ($i = 1; $i < 7 ; $i++) {
        // diez slots en el orden de $validClassIds
        $arrayClases = array(0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
        $result[$i] = array(
            'name' => getRaza($i),
            'data' => $arrayClases
        );
    }

    foreach ($clasesPorRaza as $entry) {
        $raceId = intval($entry['race_id']);
        $classId = intval($entry['class_id']);
        if (isset($classIdToIndex[$classId])) {
            $idx = $classIdToIndex[$classId];
            if (isset($result[$raceId])) {
                $result[$raceId]['data'][$idx] = intval($entry['count']);
            } else {
                // Unknown race — aggregate into "Otra"
                if (!isset($result['otra'])) {
                    $result['otra'] = array(
                        'name' => 'Otra',
                        'data' => array(0, 0, 0, 0, 0, 0, 0, 0, 0, 0)
                    );
                }
                $result['otra']['data'][$idx] += intval($entry['count']);
            }
        }
    }

    $result = array_values($result);

    return $result;
}

function getUsuariosPorLevel()
{
    $query = <<<SQL
        SELECT level, COUNT(id) as count
        FROM user
        WHERE deleted <> 1
            AND guild_index <> 1
        GROUP BY level
        ORDER BY level ASC;
SQL;

    $usuariosPorLevel = executeGetMultipleRowsQuery($query);

    $levelToCount = array();
    $maxLevel = 1;

    foreach ($usuariosPorLevel as $entry) {
        $level = intval($entry['level']);
        $count = intval($entry['count']);
        $levelToCount[$level] = $count;
        if ($level > $maxLevel) {
            $maxLevel = $level;
        }
    }

    $result = array();
    for ($level = 1; $level <= $maxLevel; $level++) {
        $result[] = isset($levelToCount[$level]) ? $levelToCount[$level] : 0;
    }

    return $result;
}

function getKillsPorClase()
{
    $query = <<<SQL
        SELECT class_id, AVG(ciudadanos_matados + criminales_matados) as promedio_matados
        FROM user
        WHERE deleted <> 1
            AND guild_index <> 1
            AND class_id IN (1,2,3,4,5,6,7,8,9,12)
        GROUP BY class_id
        HAVING promedio_matados > 0
        ORDER BY AVG(ciudadanos_matados + criminales_matados) DESC;
SQL;

    $killsPorClase = executeGetMultipleRowsQuery($query);

    $result = array();

    foreach ($killsPorClase as $entry) {
        $result[] = array(
            'name' => getClase($entry['class_id']),
            'y' => round(floatval($entry['promedio_matados']), 1)
        );
    }

    return $result;
}

function getUsuariosOnlinePorHora()
{
    $query = <<<SQL
        SELECT HOUR(date) as hora, AVG(number) as users
        FROM statistics_users_online
        GROUP BY HOUR(date);
SQL;

    $usuariosPorHora = executeGetMultipleRowsQuery($query);

    $result = array();

    for ($i = 0; $i <= 23; $i++) {
        $result[] = 0;
    }

    foreach ($usuariosPorHora as $entry) {
        $result[$entry['hora']] = floatval($entry['users']);
    }

    return $result;
}
