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


// ============================================================
// Extended Statistics — PvP & Combat (Reqs 1–5)
// ============================================================

function getCiudadanosVsCriminales()
{
    $query = <<<SQL
        SELECT
            SUM(ciudadanos_matados) AS totalCiudadanosMatados,
            SUM(criminales_matados) AS totalCriminalesMatados
        FROM user
        WHERE deleted <> 1
            AND guild_index <> 1
            AND (is_banned IS NULL OR is_banned <> 1);
SQL;

    $row = executeGetQuery($query);

    return array(
        'totalCiudadanosMatados' => intval($row['totalCiudadanosMatados'] ?? 0),
        'totalCriminalesMatados' => intval($row['totalCriminalesMatados'] ?? 0),
    );
}

function getMostDangerousClasses()
{
    $query = <<<SQL
        SELECT class_id,
            SUM(deaths) AS total_deaths,
            SUM(ciudadanos_matados + criminales_matados) AS total_kills
        FROM user
        WHERE deleted <> 1
            AND guild_index <> 1
            AND (is_banned IS NULL OR is_banned <> 1)
        GROUP BY class_id
        HAVING total_kills >= 1
        ORDER BY (SUM(deaths) / SUM(ciudadanos_matados + criminales_matados)) ASC;
SQL;

    $rows = executeGetMultipleRowsQuery($query);

    $result = array();
    foreach ($rows as $row) {
        $totalKills = intval($row['total_kills']);
        $totalDeaths = intval($row['total_deaths']);
        $ratio = ($totalKills > 0) ? round($totalDeaths / $totalKills, 4) : 0;

        $result[] = array(
            'className' => getClase($row['class_id']),
            'deathPerKillRatio' => $ratio,
        );
    }

    return $result;
}

function getPvpByLevelBracket()
{
    $brackets = array(
        array('min' => 1,  'max' => 5,  'label' => '1-5'),
        array('min' => 6,  'max' => 10, 'label' => '6-10'),
        array('min' => 11, 'max' => 15, 'label' => '11-15'),
        array('min' => 16, 'max' => 20, 'label' => '16-20'),
        array('min' => 21, 'max' => 25, 'label' => '21-25'),
        array('min' => 26, 'max' => 30, 'label' => '26-30'),
        array('min' => 31, 'max' => 35, 'label' => '31-35'),
        array('min' => 36, 'max' => 40, 'label' => '36-40'),
        array('min' => 41, 'max' => 45, 'label' => '41-45'),
        array('min' => 46, 'max' => 50, 'label' => '46-50'),
    );

    $result = array();

    foreach ($brackets as $bracket) {
        $min = $bracket['min'];
        $max = $bracket['max'];

        $query = <<<SQL
            SELECT AVG(ciudadanos_matados + criminales_matados) AS avgKills
            FROM user
            WHERE deleted <> 1
                AND guild_index <> 1
                AND (is_banned IS NULL OR is_banned <> 1)
                AND level >= {$min}
                AND level <= {$max};
SQL;

        $row = executeGetQuery($query);
        $avgKills = ($row && isset($row['avgKills']) && $row['avgKills'] !== null)
            ? round(floatval($row['avgKills']), 2)
            : 0;

        $result[] = array(
            'bracket' => $bracket['label'],
            'avgKills' => $avgKills,
        );
    }

    return $result;
}

function getReenlistadasDistribution()
{
    $query = <<<SQL
        SELECT reenlistadas, COUNT(*) AS count
        FROM user
        WHERE deleted <> 1
            AND guild_index <> 1
            AND (is_banned IS NULL OR is_banned <> 1)
        GROUP BY reenlistadas
        ORDER BY reenlistadas ASC;
SQL;

    $rows = executeGetMultipleRowsQuery($query);

    $result = array();
    foreach ($rows as $row) {
        $result[] = array(
            'reenlistadas' => intval($row['reenlistadas']),
            'count' => intval($row['count']),
        );
    }

    return $result;
}

function getDeathKillHeatmap()
{
    $query = <<<SQL
        SELECT class_id, race_id,
            AVG(deaths / NULLIF(ciudadanos_matados + criminales_matados, 0)) AS avgDeathPerKill
        FROM user
        WHERE deleted <> 1
            AND guild_index <> 1
            AND (is_banned IS NULL OR is_banned <> 1)
        GROUP BY class_id, race_id
        ORDER BY class_id, race_id;
SQL;

    $rows = executeGetMultipleRowsQuery($query);

    $result = array();
    foreach ($rows as $row) {
        $result[] = array(
            'className' => getClase($row['class_id']),
            'raceName' => getRaza($row['race_id']),
            'avgDeathPerKill' => ($row['avgDeathPerKill'] !== null)
                ? round(floatval($row['avgDeathPerKill']), 4)
                : null,
        );
    }

    return $result;
}


// ============================================================
// Extended Statistics — Economy & Items (Reqs 6–10)
// ============================================================

function getGiniLorenz()
{
    $query = <<<SQL
        SELECT (gold + bank_gold) AS total_gold
        FROM user
        WHERE deleted <> 1
            AND guild_index <> 1
            AND (is_banned IS NULL OR is_banned <> 1)
        ORDER BY (gold + bank_gold) ASC;
SQL;

    $rows = executeGetMultipleRowsQuery($query);

    if (empty($rows)) {
        return array(
            'giniCoefficient' => 0,
            'lorenzCurve' => array(),
        );
    }

    $values = array();
    foreach ($rows as $row) {
        $values[] = floatval($row['total_gold']);
    }

    $n = count($values);
    $sum = array_sum($values);

    // Compute Gini coefficient
    $gini = 0;
    if ($sum > 0 && $n > 0) {
        $weightedSum = 0;
        for ($i = 0; $i < $n; $i++) {
            $weightedSum += ($i + 1) * $values[$i];
        }
        $gini = (2 * $weightedSum) / ($n * $sum) - ($n + 1) / $n;
    }

    // Compute Lorenz curve at 20 evenly-spaced percentile points (5%, 10%, ..., 100%)
    $lorenzCurve = array();
    $cumulativeSum = array();
    $runningSum = 0;
    for ($i = 0; $i < $n; $i++) {
        $runningSum += $values[$i];
        $cumulativeSum[$i] = $runningSum;
    }

    for ($p = 1; $p <= 20; $p++) {
        $populationPercent = $p * 5;
        $index = (int) floor(($populationPercent / 100) * $n) - 1;
        if ($index < 0) {
            $index = 0;
        }
        if ($index >= $n) {
            $index = $n - 1;
        }

        $goldPercent = ($sum > 0) ? round(($cumulativeSum[$index] / $sum) * 100, 2) : 0;

        $lorenzCurve[] = array(
            'populationPercent' => $populationPercent,
            'goldPercent' => $goldPercent,
        );
    }

    return array(
        'giniCoefficient' => round($gini, 4),
        'lorenzCurve' => $lorenzCurve,
    );
}

function getBankUsageRate()
{
    // Count distinct user_ids in bank_item that have at least one item and belong to active characters
    $queryBankUsers = <<<SQL
        SELECT COUNT(DISTINCT bi.user_id) AS bankUsersCount
        FROM bank_item bi
        JOIN user u ON bi.user_id = u.id
        WHERE u.deleted <> 1
            AND u.guild_index <> 1
            AND (u.is_banned IS NULL OR u.is_banned <> 1)
            AND bi.item_id IS NOT NULL
            AND bi.amount > 0;
SQL;

    $queryTotal = <<<SQL
        SELECT COUNT(*) AS totalActiveCharacters
        FROM user
        WHERE deleted <> 1
            AND guild_index <> 1
            AND (is_banned IS NULL OR is_banned <> 1);
SQL;

    $bankRow = executeGetQuery($queryBankUsers);
    $totalRow = executeGetQuery($queryTotal);

    $bankUsersCount = intval($bankRow['bankUsersCount'] ?? 0);
    $totalActiveCharacters = intval($totalRow['totalActiveCharacters'] ?? 0);
    $bankUsagePercent = ($totalActiveCharacters > 0)
        ? round(($bankUsersCount / $totalActiveCharacters) * 100, 2)
        : 0;

    return array(
        'bankUsersCount' => $bankUsersCount,
        'totalActiveCharacters' => $totalActiveCharacters,
        'bankUsagePercent' => $bankUsagePercent,
    );
}

function getMostHoardedItems()
{
    $query = <<<SQL
        SELECT item_id AS itemId, SUM(total_amount) AS totalAmount
        FROM (
            SELECT bi.item_id, bi.amount AS total_amount
            FROM bank_item bi
            JOIN user u ON bi.user_id = u.id
            WHERE u.deleted <> 1
                AND u.guild_index <> 1
                AND (u.is_banned IS NULL OR u.is_banned <> 1)
                AND bi.item_id IS NOT NULL

            UNION ALL

            SELECT ii.item_id, ii.amount AS total_amount
            FROM inventory_item ii
            JOIN user u ON ii.user_id = u.id
            WHERE u.deleted <> 1
                AND u.guild_index <> 1
                AND (u.is_banned IS NULL OR u.is_banned <> 1)
                AND ii.item_id IS NOT NULL
        ) AS combined
        GROUP BY item_id
        ORDER BY totalAmount DESC
        LIMIT 20;
SQL;

    $rows = executeGetMultipleRowsQuery($query);

    $result = array();
    foreach ($rows as $row) {
        $result[] = array(
            'itemId' => intval($row['itemId']),
            'totalAmount' => intval($row['totalAmount']),
        );
    }

    return $result;
}

function getEquippedVsUnequipped()
{
    $queryEquipped = <<<SQL
        SELECT COUNT(*) AS equippedCount
        FROM inventory_item ii
        JOIN user u ON ii.user_id = u.id
        WHERE u.deleted <> 1
            AND u.guild_index <> 1
            AND (u.is_banned IS NULL OR u.is_banned <> 1)
            AND ii.item_id IS NOT NULL
            AND ii.is_equipped = 1;
SQL;

    $queryUnequipped = <<<SQL
        SELECT COUNT(*) AS unequippedCount
        FROM inventory_item ii
        JOIN user u ON ii.user_id = u.id
        WHERE u.deleted <> 1
            AND u.guild_index <> 1
            AND (u.is_banned IS NULL OR u.is_banned <> 1)
            AND ii.item_id IS NOT NULL
            AND (ii.is_equipped IS NULL OR ii.is_equipped = 0);
SQL;

    $equippedRow = executeGetQuery($queryEquipped);
    $unequippedRow = executeGetQuery($queryUnequipped);

    return array(
        'equippedCount' => intval($equippedRow['equippedCount'] ?? 0),
        'unequippedCount' => intval($unequippedRow['unequippedCount'] ?? 0),
    );
}

function getElementalTagsDistribution()
{
    $queryWith = <<<SQL
        SELECT COUNT(*) AS withElementalTags
        FROM inventory_item ii
        JOIN user u ON ii.user_id = u.id
        WHERE u.deleted <> 1
            AND u.guild_index <> 1
            AND (u.is_banned IS NULL OR u.is_banned <> 1)
            AND ii.item_id IS NOT NULL
            AND ii.elemental_tags > 0;
SQL;

    $queryWithout = <<<SQL
        SELECT COUNT(*) AS withoutElementalTags
        FROM inventory_item ii
        JOIN user u ON ii.user_id = u.id
        WHERE u.deleted <> 1
            AND u.guild_index <> 1
            AND (u.is_banned IS NULL OR u.is_banned <> 1)
            AND ii.item_id IS NOT NULL
            AND ii.elemental_tags = 0;
SQL;

    $withRow = executeGetQuery($queryWith);
    $withoutRow = executeGetQuery($queryWithout);

    return array(
        'withElementalTags' => intval($withRow['withElementalTags'] ?? 0),
        'withoutElementalTags' => intval($withoutRow['withoutElementalTags'] ?? 0),
    );
}


// ============================================================
// Extended Statistics — Social & Guilds (Reqs 11–16)
// ============================================================

function getSkinAdoption()
{
    $queryTotal = <<<SQL
        SELECT COUNT(*) AS totalActiveCharacters
        FROM user
        WHERE deleted <> 1
            AND guild_index <> 1
            AND (is_banned IS NULL OR is_banned <> 1);
SQL;

    $querySkinUsers = <<<SQL
        SELECT COUNT(DISTINCT s.user_id) AS skinUsersCount
        FROM inventory_item_skins s
        JOIN user u ON s.user_id = u.id
        WHERE u.deleted <> 1
            AND u.guild_index <> 1
            AND (u.is_banned IS NULL OR u.is_banned <> 1);
SQL;

    $queryTopSkins = <<<SQL
        SELECT s.skin_id AS skinId, COUNT(*) AS count
        FROM inventory_item_skins s
        JOIN user u ON s.user_id = u.id
        WHERE u.deleted <> 1
            AND u.guild_index <> 1
            AND (u.is_banned IS NULL OR u.is_banned <> 1)
        GROUP BY s.skin_id
        ORDER BY count DESC
        LIMIT 15;
SQL;

    $totalRow = executeGetQuery($queryTotal);
    $skinRow = executeGetQuery($querySkinUsers);
    $topSkins = executeGetMultipleRowsQuery($queryTopSkins);

    $totalActiveCharacters = intval($totalRow['totalActiveCharacters'] ?? 0);
    $skinUsersCount = intval($skinRow['skinUsersCount'] ?? 0);
    $skinAdoptionPercent = ($totalActiveCharacters > 0)
        ? round(($skinUsersCount / $totalActiveCharacters) * 100, 2)
        : 0;

    $result = array();
    foreach ($topSkins as $row) {
        $result[] = array(
            'skinId' => intval($row['skinId']),
            'count'  => intval($row['count']),
        );
    }

    return array(
        'skinAdoptionPercent'    => $skinAdoptionPercent,
        'skinUsersCount'         => $skinUsersCount,
        'totalActiveCharacters'  => $totalActiveCharacters,
        'topSkins'               => $result,
    );
}

function getGuildSizeDistribution()
{
    $query = <<<SQL
        SELECT g.id, COUNT(gm.user_id) AS member_count
        FROM guilds g
        JOIN guild_members gm ON g.id = gm.guild_id
        GROUP BY g.id;
SQL;

    $rows = executeGetMultipleRowsQuery($query);

    $buckets = array(
        '1'     => 0,
        '2-5'   => 0,
        '6-10'  => 0,
        '11-20' => 0,
        '21-50' => 0,
        '51+'   => 0,
    );

    foreach ($rows as $row) {
        $count = intval($row['member_count']);
        if ($count === 1) {
            $buckets['1']++;
        } elseif ($count <= 5) {
            $buckets['2-5']++;
        } elseif ($count <= 10) {
            $buckets['6-10']++;
        } elseif ($count <= 20) {
            $buckets['11-20']++;
        } elseif ($count <= 50) {
            $buckets['21-50']++;
        } else {
            $buckets['51+']++;
        }
    }

    $result = array();
    foreach ($buckets as $bucket => $guildCount) {
        $result[] = array(
            'bucket'     => $bucket,
            'guildCount' => $guildCount,
        );
    }

    return $result;
}

function getGuildRejectionRate()
{
    $queryRequests = <<<SQL
        SELECT COUNT(*) AS totalRequests
        FROM guild_request_history;
SQL;

    $queryAcceptances = <<<SQL
        SELECT COUNT(*) AS totalAcceptances
        FROM guild_member_history;
SQL;

    $requestsRow = executeGetQuery($queryRequests);
    $acceptancesRow = executeGetQuery($queryAcceptances);

    $totalRequests = intval($requestsRow['totalRequests'] ?? 0);
    $totalAcceptances = intval($acceptancesRow['totalAcceptances'] ?? 0);
    $rejectionRate = ($totalRequests > 0)
        ? round(1 - ($totalAcceptances / $totalRequests), 4)
        : 0;

    return array(
        'totalRequests'    => $totalRequests,
        'totalAcceptances' => $totalAcceptances,
        'rejectionRate'    => $rejectionRate,
    );
}

function getMarriageRate()
{
    $queryTotal = <<<SQL
        SELECT COUNT(*) AS totalActiveCharacters
        FROM user
        WHERE deleted <> 1
            AND guild_index <> 1
            AND (is_banned IS NULL OR is_banned <> 1);
SQL;

    $queryMarried = <<<SQL
        SELECT COUNT(*) AS marriedCount
        FROM user
        WHERE deleted <> 1
            AND guild_index <> 1
            AND (is_banned IS NULL OR is_banned <> 1)
            AND spouse <> 0;
SQL;

    $totalRow = executeGetQuery($queryTotal);
    $marriedRow = executeGetQuery($queryMarried);

    $totalActiveCharacters = intval($totalRow['totalActiveCharacters'] ?? 0);
    $marriedCount = intval($marriedRow['marriedCount'] ?? 0);
    $marriagePercent = ($totalActiveCharacters > 0)
        ? round(($marriedCount / $totalActiveCharacters) * 100, 2)
        : 0;

    return array(
        'marriedCount'          => $marriedCount,
        'totalActiveCharacters' => $totalActiveCharacters,
        'marriagePercent'       => $marriagePercent,
    );
}

function getGuildAlignmentBalance()
{
    $query = <<<SQL
        SELECT alignment, COUNT(*) AS count
        FROM guilds
        GROUP BY alignment;
SQL;

    $rows = executeGetMultipleRowsQuery($query);

    $alignmentMap = array(
        1 => 'Real',
        2 => 'Caos',
    );

    // Aggregate counts: known alignments + neutral bucket
    $counts = array(
        'Real'    => 0,
        'Caos'    => 0,
        'Neutral' => 0,
    );

    foreach ($rows as $row) {
        $alignment = intval($row['alignment']);
        $count = intval($row['count']);
        if (isset($alignmentMap[$alignment])) {
            $counts[$alignmentMap[$alignment]] += $count;
        } else {
            $counts['Neutral'] += $count;
        }
    }

    $result = array();
    foreach ($counts as $name => $count) {
        $result[] = array(
            'alignmentName' => $name,
            'count'         => $count,
        );
    }

    return $result;
}

function getGuildConcentration()
{
    // Get top 10 guild IDs by member count
    $queryTop10 = <<<SQL
        SELECT gm.guild_id, COUNT(gm.user_id) AS member_count
        FROM guild_members gm
        GROUP BY gm.guild_id
        ORDER BY member_count DESC
        LIMIT 10;
SQL;

    $top10Rows = executeGetMultipleRowsQuery($queryTop10);

    $top10GuildIds = array();
    foreach ($top10Rows as $row) {
        $top10GuildIds[] = intval($row['guild_id']);
    }

    // Count active characters in top 10 guilds
    $topGuildMembers = 0;
    if (!empty($top10GuildIds)) {
        $idList = implode(',', $top10GuildIds);
        $queryTopMembers = <<<SQL
            SELECT COUNT(*) AS cnt
            FROM user u
            JOIN guild_members gm ON u.id = gm.user_id
            WHERE u.deleted <> 1
                AND u.guild_index <> 1
                AND (u.is_banned IS NULL OR u.is_banned <> 1)
                AND gm.guild_id IN ($idList);
SQL;

        $topRow = executeGetQuery($queryTopMembers);
        $topGuildMembers = intval($topRow['cnt'] ?? 0);
    }

    // Count active characters in other guilds (not top 10)
    $otherGuildMembers = 0;
    if (!empty($top10GuildIds)) {
        $idList = implode(',', $top10GuildIds);
        $queryOtherMembers = <<<SQL
            SELECT COUNT(*) AS cnt
            FROM user u
            JOIN guild_members gm ON u.id = gm.user_id
            WHERE u.deleted <> 1
                AND u.guild_index <> 1
                AND (u.is_banned IS NULL OR u.is_banned <> 1)
                AND gm.guild_id NOT IN ($idList);
SQL;

        $otherRow = executeGetQuery($queryOtherMembers);
        $otherGuildMembers = intval($otherRow['cnt'] ?? 0);
    } else {
        // No guilds at all — count all guild members as "other"
        $queryAllGuildMembers = <<<SQL
            SELECT COUNT(*) AS cnt
            FROM user u
            JOIN guild_members gm ON u.id = gm.user_id
            WHERE u.deleted <> 1
                AND u.guild_index <> 1
                AND (u.is_banned IS NULL OR u.is_banned <> 1);
SQL;

        $allRow = executeGetQuery($queryAllGuildMembers);
        $otherGuildMembers = intval($allRow['cnt'] ?? 0);
    }

    // Count active characters with no guild (not in guild_members)
    $queryIndependents = <<<SQL
        SELECT COUNT(*) AS cnt
        FROM user u
        WHERE u.deleted <> 1
            AND u.guild_index <> 1
            AND (u.is_banned IS NULL OR u.is_banned <> 1)
            AND u.id NOT IN (SELECT gm.user_id FROM guild_members gm);
SQL;

    $indRow = executeGetQuery($queryIndependents);
    $independents = intval($indRow['cnt'] ?? 0);

    return array(
        'topGuildMembers'   => $topGuildMembers,
        'otherGuildMembers' => $otherGuildMembers,
        'independents'      => $independents,
    );
}


// ============================================================
// Extended Statistics — Character Building (Reqs 17–19)
// ============================================================

function getSkillPointPatterns()
{
    $query = <<<SQL
        SELECT sp.number AS skillNumber, AVG(sp.value) AS avgValue
        FROM skillpoint sp
        JOIN user u ON sp.user_id = u.id
        WHERE u.deleted <> 1
            AND u.guild_index <> 1
            AND (u.is_banned IS NULL OR u.is_banned <> 1)
        GROUP BY sp.number
        ORDER BY sp.number ASC;
SQL;

    $rows = executeGetMultipleRowsQuery($query);

    $result = array();
    foreach ($rows as $row) {
        $result[] = array(
            'skillNumber' => intval($row['skillNumber']),
            'avgValue'    => round(floatval($row['avgValue']), 2),
        );
    }

    return $result;
}

function getSpellPopularity()
{
    $query = <<<SQL
        SELECT s.spell_id AS spellId, COUNT(DISTINCT s.user_id) AS characterCount
        FROM spell s
        JOIN user u ON s.user_id = u.id
        WHERE u.deleted <> 1
            AND u.guild_index <> 1
            AND (u.is_banned IS NULL OR u.is_banned <> 1)
            AND s.spell_id IS NOT NULL
        GROUP BY s.spell_id
        ORDER BY characterCount DESC
        LIMIT 20;
SQL;

    $rows = executeGetMultipleRowsQuery($query);

    $result = array();
    foreach ($rows as $row) {
        $result[] = array(
            'spellId'        => intval($row['spellId']),
            'characterCount' => intval($row['characterCount']),
        );
    }

    return $result;
}

function getPetOwnership()
{
    $queryTotal = <<<SQL
        SELECT COUNT(*) AS totalActiveCharacters
        FROM user
        WHERE deleted <> 1
            AND guild_index <> 1
            AND (is_banned IS NULL OR is_banned <> 1);
SQL;

    $queryPetOwners = <<<SQL
        SELECT COUNT(DISTINCT p.user_id) AS petOwnersCount
        FROM pet p
        JOIN user u ON p.user_id = u.id
        WHERE u.deleted <> 1
            AND u.guild_index <> 1
            AND (u.is_banned IS NULL OR u.is_banned <> 1)
            AND p.pet_id IS NOT NULL;
SQL;

    $queryTopPets = <<<SQL
        SELECT p.pet_id AS petId, COUNT(*) AS count
        FROM pet p
        JOIN user u ON p.user_id = u.id
        WHERE u.deleted <> 1
            AND u.guild_index <> 1
            AND (u.is_banned IS NULL OR u.is_banned <> 1)
            AND p.pet_id IS NOT NULL
        GROUP BY p.pet_id
        ORDER BY count DESC
        LIMIT 15;
SQL;

    $totalRow = executeGetQuery($queryTotal);
    $petRow = executeGetQuery($queryPetOwners);
    $topPets = executeGetMultipleRowsQuery($queryTopPets);

    $totalActiveCharacters = intval($totalRow['totalActiveCharacters'] ?? 0);
    $petOwnersCount = intval($petRow['petOwnersCount'] ?? 0);
    $petOwnershipPercent = ($totalActiveCharacters > 0)
        ? round(($petOwnersCount / $totalActiveCharacters) * 100, 2)
        : 0;

    $result = array();
    foreach ($topPets as $row) {
        $result[] = array(
            'petId' => intval($row['petId']),
            'count' => intval($row['count']),
        );
    }

    return array(
        'petOwnershipPercent'   => $petOwnershipPercent,
        'petOwnersCount'        => $petOwnersCount,
        'totalActiveCharacters' => $totalActiveCharacters,
        'topPets'               => $result,
    );
}


// ============================================================
// Extended Statistics — Activity & Misc (Reqs 20–24)
// ============================================================

function getMultiCharacterAccounts()
{
    $query = <<<SQL
        SELECT account_id, COUNT(*) AS char_count
        FROM user
        WHERE deleted <> 1
            AND guild_index <> 1
            AND (is_banned IS NULL OR is_banned <> 1)
        GROUP BY account_id;
SQL;

    $rows = executeGetMultipleRowsQuery($query);

    $buckets = array(
        '1 personaje'   => 0,
        '2 personajes'  => 0,
        '3+ personajes' => 0,
    );

    foreach ($rows as $row) {
        $count = intval($row['char_count']);
        if ($count === 1) {
            $buckets['1 personaje']++;
        } elseif ($count === 2) {
            $buckets['2 personajes']++;
        } else {
            $buckets['3+ personajes']++;
        }
    }

    $result = array();
    foreach ($buckets as $bucket => $accountCount) {
        $result[] = array(
            'bucket'       => $bucket,
            'accountCount' => $accountCount,
        );
    }

    return $result;
}

function getCharactersPerMap()
{
    $query = <<<SQL
        SELECT pos_map AS mapId, COUNT(*) AS characterCount
        FROM user
        WHERE deleted <> 1
            AND guild_index <> 1
            AND (is_banned IS NULL OR is_banned <> 1)
        GROUP BY pos_map
        ORDER BY characterCount DESC
        LIMIT 30;
SQL;

    $rows = executeGetMultipleRowsQuery($query);

    $result = array();
    foreach ($rows as $row) {
        $result[] = array(
            'mapId'          => intval($row['mapId']),
            'characterCount' => intval($row['characterCount']),
        );
    }

    return $result;
}

function getDeadCharacterRate()
{
    $queryTotal = <<<SQL
        SELECT COUNT(*) AS totalActiveCharacters
        FROM user
        WHERE deleted <> 1
            AND guild_index <> 1
            AND (is_banned IS NULL OR is_banned <> 1);
SQL;

    $queryDead = <<<SQL
        SELECT COUNT(*) AS deadCount
        FROM user
        WHERE deleted <> 1
            AND guild_index <> 1
            AND (is_banned IS NULL OR is_banned <> 1)
            AND is_dead = 1;
SQL;

    $totalRow = executeGetQuery($queryTotal);
    $deadRow = executeGetQuery($queryDead);

    $totalActiveCharacters = intval($totalRow['totalActiveCharacters'] ?? 0);
    $deadCount = intval($deadRow['deadCount'] ?? 0);
    $deadPercent = ($totalActiveCharacters > 0)
        ? round(($deadCount / $totalActiveCharacters) * 100, 2)
        : 0;

    return array(
        'deadCount'             => $deadCount,
        'totalActiveCharacters' => $totalActiveCharacters,
        'deadPercent'           => $deadPercent,
    );
}

function getSailingRate()
{
    $queryTotal = <<<SQL
        SELECT COUNT(*) AS totalActiveCharacters
        FROM user
        WHERE deleted <> 1
            AND guild_index <> 1
            AND (is_banned IS NULL OR is_banned <> 1);
SQL;

    $querySailing = <<<SQL
        SELECT COUNT(*) AS sailingCount
        FROM user
        WHERE deleted <> 1
            AND guild_index <> 1
            AND (is_banned IS NULL OR is_banned <> 1)
            AND is_sailing = 1;
SQL;

    $totalRow = executeGetQuery($queryTotal);
    $sailingRow = executeGetQuery($querySailing);

    $totalActiveCharacters = intval($totalRow['totalActiveCharacters'] ?? 0);
    $sailingCount = intval($sailingRow['sailingCount'] ?? 0);
    $sailingPercent = ($totalActiveCharacters > 0)
        ? round(($sailingCount / $totalActiveCharacters) * 100, 2)
        : 0;

    return array(
        'sailingCount'          => $sailingCount,
        'totalActiveCharacters' => $totalActiveCharacters,
        'sailingPercent'        => $sailingPercent,
    );
}

function getFishingCombatCorrelation()
{
    $brackets = array(
        array('min' => 1,    'max' => 100,  'label' => '1-100'),
        array('min' => 101,  'max' => 500,  'label' => '101-500'),
        array('min' => 501,  'max' => 1000, 'label' => '501-1000'),
        array('min' => 1001, 'max' => 5000, 'label' => '1001-5000'),
        array('min' => 5001, 'max' => 999999999, 'label' => '5001+'),
    );

    $result = array();

    foreach ($brackets as $bracket) {
        $min = $bracket['min'];
        $max = $bracket['max'];

        $query = <<<SQL
            SELECT AVG(ciudadanos_matados + criminales_matados) AS avgKills
            FROM user
            WHERE deleted <> 1
                AND guild_index <> 1
                AND (is_banned IS NULL OR is_banned <> 1)
                AND puntos_pesca >= {$min}
                AND puntos_pesca <= {$max};
SQL;

        $row = executeGetQuery($query);
        $avgKills = ($row && isset($row['avgKills']) && $row['avgKills'] !== null)
            ? round(floatval($row['avgKills']), 2)
            : 0;

        $result[] = array(
            'fishingBracket' => $bracket['label'],
            'avgKills'       => $avgKills,
        );
    }

    return $result;
}


// ============================================================
// Extended Statistics — Events & Server Health (Reqs 25–30)
// ============================================================

function getGlobalQuestParticipation()
{
    $queryTotal = <<<SQL
        SELECT COUNT(*) AS totalActiveCharacters
        FROM user
        WHERE deleted <> 1
            AND guild_index <> 1
            AND (is_banned IS NULL OR is_banned <> 1);
SQL;

    $queryParticipants = <<<SQL
        SELECT COUNT(DISTINCT gquc.user_id) AS participantCount
        FROM global_quest_user_contribution gquc
        JOIN user u ON gquc.user_id = u.id
        WHERE u.deleted <> 1
            AND u.guild_index <> 1
            AND (u.is_banned IS NULL OR u.is_banned <> 1);
SQL;

    $totalRow = executeGetQuery($queryTotal);
    $participantRow = executeGetQuery($queryParticipants);

    $totalActiveCharacters = intval($totalRow['totalActiveCharacters'] ?? 0);
    $participantCount = intval($participantRow['participantCount'] ?? 0);
    $participationPercent = ($totalActiveCharacters > 0)
        ? round(($participantCount / $totalActiveCharacters) * 100, 2)
        : 0;

    return array(
        'participantCount'      => $participantCount,
        'totalActiveCharacters' => $totalActiveCharacters,
        'participationPercent'  => $participationPercent,
    );
}

function getGlobalQuestCompletion()
{
    // Retrieve all quests from global_quest_desc
    $queryQuests = <<<SQL
        SELECT id, name, threshold, event_id
        FROM global_quest_desc;
SQL;

    $quests = executeGetMultipleRowsQuery($queryQuests);

    if (empty($quests)) {
        return array();
    }

    // Sum contributions per event_id
    $queryContributions = <<<SQL
        SELECT event_id, SUM(amount) AS totalContributions
        FROM global_quest_user_contribution
        GROUP BY event_id;
SQL;

    $contributionRows = executeGetMultipleRowsQuery($queryContributions);

    // Build a lookup map: event_id => totalContributions
    $contributionMap = array();
    foreach ($contributionRows as $row) {
        $contributionMap[intval($row['event_id'])] = intval($row['totalContributions']);
    }

    $result = array();
    foreach ($quests as $quest) {
        $eventId = intval($quest['event_id']);
        $threshold = intval($quest['threshold']);
        $totalContributions = isset($contributionMap[$eventId]) ? $contributionMap[$eventId] : 0;
        $completionPercent = ($threshold > 0)
            ? min(100, round(($totalContributions / $threshold) * 100, 2))
            : 0;

        $result[] = array(
            'questName'          => $quest['name'],
            'threshold'          => $threshold,
            'totalContributions' => $totalContributions,
            'completionPercent'  => $completionPercent,
        );
    }

    return $result;
}

function getAccountRetention()
{
    $query = <<<SQL
        SELECT
            DATE_FORMAT(date_created, '%Y-%m') AS cohortMonth,
            COUNT(*) AS totalAccounts,
            SUM(CASE WHEN last_access >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) AS retainedAccounts
        FROM account
        WHERE (is_banned IS NULL OR is_banned <> 1)
        GROUP BY cohortMonth
        ORDER BY cohortMonth ASC;
SQL;

    $rows = executeGetMultipleRowsQuery($query);

    $result = array();
    foreach ($rows as $row) {
        $total = intval($row['totalAccounts']);
        $retained = intval($row['retainedAccounts']);
        $retentionPercent = ($total > 0)
            ? round(($retained / $total) * 100, 2)
            : 0;

        $result[] = array(
            'cohortMonth'     => $row['cohortMonth'],
            'retentionPercent' => $retentionPercent,
        );
    }

    return $result;
}

function getPatronDonorRate()
{
    $PATRON_TIERS = array(
        array('tierId' => 6057393, 'tierName' => 'Aventurero'),
        array('tierId' => 6057394, 'tierName' => 'Héroe'),
        array('tierId' => 6057395, 'tierName' => 'Leyenda'),
    );

    $patronTierIds = array();
    foreach ($PATRON_TIERS as $tier) {
        $patronTierIds[] = $tier['tierId'];
    }
    $tierIdList = implode(',', $patronTierIds);

    $queryTotal = <<<SQL
        SELECT COUNT(*) AS totalAccounts
        FROM account
        WHERE (is_banned IS NULL OR is_banned <> 1);
SQL;

    $queryDonors = <<<SQL
        SELECT COUNT(*) AS donorCount
        FROM account
        WHERE (is_banned IS NULL OR is_banned <> 1)
            AND is_donor = 1;
SQL;

    $queryPatrons = <<<SQL
        SELECT COUNT(*) AS patronCount
        FROM account
        WHERE (is_banned IS NULL OR is_banned <> 1)
            AND is_active_patron IN ($tierIdList);
SQL;

    $totalRow = executeGetQuery($queryTotal);
    $donorRow = executeGetQuery($queryDonors);
    $patronRow = executeGetQuery($queryPatrons);

    $totalAccounts = intval($totalRow['totalAccounts'] ?? 0);
    $donorCount = intval($donorRow['donorCount'] ?? 0);
    $patronCount = intval($patronRow['patronCount'] ?? 0);

    $donorPercent = ($totalAccounts > 0)
        ? round(($donorCount / $totalAccounts) * 100, 2)
        : 0;
    $patronPercent = ($totalAccounts > 0)
        ? round(($patronCount / $totalAccounts) * 100, 2)
        : 0;

    // Break down patron counts by tier
    $patronTiers = array();
    foreach ($PATRON_TIERS as $tier) {
        $tierId = $tier['tierId'];
        $queryTier = <<<SQL
            SELECT COUNT(*) AS count
            FROM account
            WHERE (is_banned IS NULL OR is_banned <> 1)
                AND is_active_patron = $tierId;
SQL;

        $tierRow = executeGetQuery($queryTier);
        $patronTiers[] = array(
            'tierName' => $tier['tierName'],
            'tierId'   => $tierId,
            'count'    => intval($tierRow['count'] ?? 0),
        );
    }

    return array(
        'donorCount'    => $donorCount,
        'patronCount'   => $patronCount,
        'totalAccounts' => $totalAccounts,
        'donorPercent'  => $donorPercent,
        'patronPercent' => $patronPercent,
        'patronTiers'   => $patronTiers,
    );
}

function getQuestCompletionByClass()
{
    $query = <<<SQL
        SELECT u.class_id,
            COUNT(qd.id) / COUNT(DISTINCT u.id) AS avgQuestsCompleted
        FROM user u
        LEFT JOIN quest_done qd ON u.id = qd.user_id
        WHERE u.deleted <> 1
            AND u.guild_index <> 1
            AND (u.is_banned IS NULL OR u.is_banned <> 1)
        GROUP BY u.class_id
        ORDER BY avgQuestsCompleted DESC;
SQL;

    $rows = executeGetMultipleRowsQuery($query);

    $result = array();
    foreach ($rows as $row) {
        $result[] = array(
            'className'          => getClase($row['class_id']),
            'avgQuestsCompleted' => round(floatval($row['avgQuestsCompleted']), 2),
        );
    }

    return $result;
}

function getDeathsVsLevelCurve()
{
    $query = <<<SQL
        SELECT level, AVG(deaths) AS avgDeaths
        FROM user
        WHERE deleted <> 1
            AND guild_index <> 1
            AND (is_banned IS NULL OR is_banned <> 1)
        GROUP BY level
        ORDER BY level ASC;
SQL;

    $rows = executeGetMultipleRowsQuery($query);

    $result = array();
    foreach ($rows as $row) {
        $result[] = array(
            'level'    => intval($row['level']),
            'avgDeaths' => round(floatval($row['avgDeaths']), 2),
        );
    }

    return $result;
}
