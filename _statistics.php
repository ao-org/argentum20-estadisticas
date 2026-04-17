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

function getEloDistribution()
{
    $query = <<<SQL
        SELECT FLOOR(elo / 100) AS bucket_start, COUNT(*) AS count
        FROM user
        WHERE deleted <> 1
            AND guild_index <> 1
            AND (is_banned IS NULL OR is_banned <> 1)
        GROUP BY bucket_start
        ORDER BY bucket_start ASC;
SQL;

    $rows = executeGetMultipleRowsQuery($query);

    $result = array();
    foreach ($rows as $row) {
        $start = intval($row['bucket_start']) * 100;
        $end = $start + 99;
        $result[] = array(
            'bucket' => $start . '-' . $end,
            'count'  => intval($row['count'])
        );
    }

    return $result;
}

function getGenderDistribution()
{
    $genderNames = array(
        1 => 'Masculino',
        2 => 'Femenino',
    );

    $query = <<<SQL
        SELECT genre_id, COUNT(*) AS count
        FROM user
        WHERE deleted <> 1
            AND guild_index <> 1
            AND (is_banned IS NULL OR is_banned <> 1)
        GROUP BY genre_id;
SQL;

    $rows = executeGetMultipleRowsQuery($query);

    $result = array();
    foreach ($rows as $row) {
        $genreId = intval($row['genre_id']);
        $name = isset($genderNames[$genreId]) ? $genderNames[$genreId] : 'Otro';
        $result[] = array(
            'name' => $name,
            'y'    => intval($row['count'])
        );
    }

    return $result;
}

function getKdRatioByClass()
{
    $query = <<<SQL
        SELECT class_id,
            AVG(
                CASE WHEN deaths = 0
                    THEN (ciudadanos_matados + criminales_matados)
                    ELSE (ciudadanos_matados + criminales_matados) / deaths
                END
            ) AS avg_kd
        FROM user
        WHERE deleted <> 1
            AND guild_index <> 1
            AND (is_banned IS NULL OR is_banned <> 1)
        GROUP BY class_id
        ORDER BY avg_kd DESC;
SQL;

    $rows = executeGetMultipleRowsQuery($query);

    $result = array();
    foreach ($rows as $row) {
        $result[] = array(
            'name' => getClase($row['class_id']),
            'y'    => round(floatval($row['avg_kd']), 2)
        );
    }

    return $result;
}

function getGoldByLevelRange()
{
    $ranges = array(
        array('min' => 1,  'max' => 10,  'label' => '1-10'),
        array('min' => 11, 'max' => 20,  'label' => '11-20'),
        array('min' => 21, 'max' => 30,  'label' => '21-30'),
        array('min' => 31, 'max' => 40,  'label' => '31-40'),
        array('min' => 41, 'max' => 50,  'label' => '41-50'),
    );

    $result = array();

    foreach ($ranges as $range) {
        $min = $range['min'];
        $max = $range['max'];

        // Get average
        $avgQuery = <<<SQL
            SELECT AVG(gold + bank_gold) AS avg_gold
            FROM user
            WHERE deleted <> 1
                AND guild_index <> 1
                AND (is_banned IS NULL OR is_banned <> 1)
                AND level >= {$min}
                AND level <= {$max};
SQL;

        $avgRow = executeGetMultipleRowsQuery($avgQuery);
        $average = (!empty($avgRow) && $avgRow[0]['avg_gold'] !== null)
            ? round(floatval($avgRow[0]['avg_gold']), 2)
            : 0;

        // Get all gold values for median calculation
        $allQuery = <<<SQL
            SELECT (gold + bank_gold) AS total_gold
            FROM user
            WHERE deleted <> 1
                AND guild_index <> 1
                AND (is_banned IS NULL OR is_banned <> 1)
                AND level >= {$min}
                AND level <= {$max}
            ORDER BY total_gold ASC;
SQL;

        $allRows = executeGetMultipleRowsQuery($allQuery);
        $median = 0;

        if (!empty($allRows)) {
            $values = array();
            foreach ($allRows as $r) {
                $values[] = floatval($r['total_gold']);
            }
            $count = count($values);
            $mid = intdiv($count, 2);
            if ($count % 2 === 0) {
                $median = round(($values[$mid - 1] + $values[$mid]) / 2, 2);
            } else {
                $median = round($values[$mid], 2);
            }
        }

        $result[] = array(
            'range'   => $range['label'],
            'average' => $average,
            'median'  => $median,
        );
    }

    return $result;
}

function getTopGuilds()
{
    $query = <<<SQL
        SELECT g.guild_name, g.level, g.alignment, COUNT(gm.user_id) AS member_count
        FROM guilds g
        JOIN guild_members gm ON g.id = gm.guild_id
        GROUP BY g.id
        ORDER BY member_count DESC
        LIMIT 20;
SQL;

    $rows = executeGetMultipleRowsQuery($query);

    $result = array();
    foreach ($rows as $row) {
        $result[] = array(
            'name'      => $row['guild_name'],
            'members'   => intval($row['member_count']),
            'level'     => intval($row['level']),
            'alignment' => intval($row['alignment']),
        );
    }

    return $result;
}

function getFactionSummary()
{
    $queryReal = <<<SQL
        SELECT COUNT(*) AS players,
               AVG(faction_score) AS avg_score,
               SUM(criminales_matados) AS total_kills
        FROM user
        WHERE deleted <> 1
            AND guild_index <> 1
            AND (is_banned IS NULL OR is_banned <> 1)
            AND status = 1;
SQL;

    $queryCaos = <<<SQL
        SELECT COUNT(*) AS players,
               AVG(faction_score) AS avg_score,
               SUM(ciudadanos_matados) AS total_kills
        FROM user
        WHERE deleted <> 1
            AND guild_index <> 1
            AND (is_banned IS NULL OR is_banned <> 1)
            AND status = 2;
SQL;

    $realRow = executeGetQuery($queryReal);
    $caosRow = executeGetQuery($queryCaos);

    return array(
        'real' => array(
            'players'    => intval($realRow['players'] ?? 0),
            'avgScore'   => round(floatval($realRow['avg_score'] ?? 0), 1),
            'totalKills' => intval($realRow['total_kills'] ?? 0),
        ),
        'caos' => array(
            'players'    => intval($caosRow['players'] ?? 0),
            'avgScore'   => round(floatval($caosRow['avg_score'] ?? 0), 1),
            'totalKills' => intval($caosRow['total_kills'] ?? 0),
        ),
    );
}

function getFishingLeaderboard()
{
    $query = <<<SQL
        SELECT character_name, class_id, puntos_pesca
        FROM ranking_users
        WHERE puntos_pesca > 0
        ORDER BY puntos_pesca DESC
        LIMIT 20;
SQL;

    $rows = executeGetMultipleRowsQuery($query);

    $result = array();
    foreach ($rows as $row) {
        $result[] = array(
            'name'  => $row['character_name'],
            'class' => getClase($row['class_id']),
            'y'     => intval($row['puntos_pesca']),
        );
    }

    return $result;
}

function getTopNpcHunters()
{
    $query = <<<SQL
        SELECT character_name, class_id, killed_npcs
        FROM ranking_users
        WHERE killed_npcs > 0
        ORDER BY killed_npcs DESC
        LIMIT 20;
SQL;

    $rows = executeGetMultipleRowsQuery($query);

    $result = array();
    foreach ($rows as $row) {
        $result[] = array(
            'name'  => $row['character_name'],
            'class' => getClase($row['class_id']),
            'y'     => intval($row['killed_npcs']),
        );
    }

    return $result;
}

function getQuestCompletion()
{
    $query = <<<SQL
        SELECT
            CASE
                WHEN quest_count = 0 THEN '0'
                WHEN quest_count BETWEEN 1 AND 5 THEN '1-5'
                WHEN quest_count BETWEEN 6 AND 10 THEN '6-10'
                WHEN quest_count BETWEEN 11 AND 20 THEN '11-20'
                ELSE '21+'
            END AS bucket,
            COUNT(*) AS count
        FROM (
            SELECT u.id, COALESCE(qd.quest_count, 0) AS quest_count
            FROM user u
            LEFT JOIN (
                SELECT user_id, COUNT(*) AS quest_count
                FROM quest_done
                GROUP BY user_id
            ) qd ON u.id = qd.user_id
            WHERE u.deleted <> 1
                AND u.guild_index <> 1
                AND (u.is_banned IS NULL OR u.is_banned <> 1)
        ) AS user_quests
        GROUP BY bucket;
SQL;

    $rows = executeGetMultipleRowsQuery($query);

    // Ensure all 5 buckets are always present, even if count is 0
    $buckets = array('0' => 0, '1-5' => 0, '6-10' => 0, '11-20' => 0, '21+' => 0);

    foreach ($rows as $row) {
        $buckets[$row['bucket']] = intval($row['count']);
    }

    $result = array();
    foreach ($buckets as $bucket => $count) {
        $result[] = array(
            'bucket' => $bucket,
            'count'  => $count,
        );
    }

    return $result;
}

function getGlobalQuestProgress()
{
    $query = <<<SQL
        SELECT gqd.name, gqd.threshold,
               COALESCE(SUM(gquc.amount), 0) AS current_total
        FROM global_quest_desc gqd
        LEFT JOIN global_quest_user_contribution gquc ON gqd.event_id = gquc.event_id
        WHERE gqd.is_active = 1
        GROUP BY gqd.id;
SQL;

    $rows = executeGetMultipleRowsQuery($query);

    $result = array();
    foreach ($rows as $row) {
        $result[] = array(
            'name'      => $row['name'],
            'current'   => intval($row['current_total']),
            'threshold' => intval($row['threshold']),
        );
    }

    return $result;
}
