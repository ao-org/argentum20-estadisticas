<?php
include('environment.php');

function executeGetQuery($query) {
    global $databaseHost, $databaseUserRead, $databasePasswordRead, $databaseName, $databasePort;
    $conn = mysqli_connect($databaseHost, $databaseUserRead, $databasePasswordRead, $databaseName, $databasePort);
    
    mysqli_set_charset($conn, 'utf8');

    // die(print_r($query));
    $result = mysqli_query($conn, $query);
    $result = mysqli_fetch_assoc($result);

    mysqli_close($conn);

    return $result;
}


function executeGetMultipleRowsQuery($query) {
    global $databaseHost, $databaseUserRead, $databasePasswordRead, $databaseName, $databasePort;
    $conn =  mysqli_connect($databaseHost, $databaseUserRead, $databasePasswordRead, $databaseName, $databasePort);
    mysqli_set_charset($conn, 'utf8');

    $result = mysqli_query($conn, $query);

    mysqli_close($conn);

    return $result;
}

function getRaza($raceId) {
    $raceId = intval($raceId);
    $raza = '';

    switch($raceId) {
        case 1:
            $raza = 'Humano';
            break;
        case 2:
            $raza = 'Elfo';
            break;
        case 3:
            $raza = 'Elfo Oscuro';
            break;
        case 4:
            $raza = 'Gnomo';
            break;
        case 5:
            $raza = 'Enano';
            break;
        case 6:
            $raza = 'Orco';
            break;
        default:
            $raza = 'Otra';
            break;
    }

    return $raza;
}

function getClase($classId) {
    $classId = intval($classId);
    $clase = '';

    switch($classId) {
        case 1:
            $clase = 'Mago';
            break;
        case 2:
            $clase = 'Clérigo';
            break;
        case 3:
            $clase = 'Guerrero';
            break;
        case 4:
            $clase = 'Asesino';
            break;
        case 5:
            $clase = 'Bardo';
            break;
        case 6:
            $clase = 'Druida';
            break;
        case 7:
            $clase = 'Paladin';
            break;
        case 8:
            $clase = 'Cazador';
            break;
        case 9:
            $clase = 'Trabajador';
            break;
        case 12:
            $clase = 'Bandido';
            break;
        default:
            $clase = 'Otra';
            break;
    }

    return $clase;
}

function getGeneralStats()
{
    $query = <<<SQL
        SELECT COUNT(1) as count
        FROM user
        WHERE deleted = 0
            AND guild_index <> 1;
SQL;


    $users = executeGetQuery($query);

    $query = <<<SQL
        SELECT COUNT(1) as count
        FROM account;
SQL;
    $accounts = executeGetQuery($query);

//     $query = <<<SQL
//         SELECT clanes_creados
//         FROM stats;
// SQL;
//     $clanes = executeGetQuery($query);

    return array(
        'accounts' => $accounts['count'],
        'users' => $users['count'],
        // 'clanes' => $clanes['clanes_creados']
    );
}

function getUsuariosPorClase()
{
    $query = <<<SQL
        SELECT class_id, COUNT(id) as count
        FROM user
        WHERE deleted = false
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
        WHERE deleted = false
            AND guild_index <> 1
        GROUP BY race_id, class_id
        ORDER BY race_id, class_id;
SQL;

    $clasesPorRaza = executeGetMultipleRowsQuery($query);

    $result = array();

    for ($i = 1; $i < 7 ; $i++) {
        $arrayClases = array(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
        $result[$i] = array(
            'name' => getRaza($i),
            'data' => $arrayClases
        );
    }

    foreach ($clasesPorRaza as $entry) {
        $result[$entry['race_id']]['data'][$entry['class_id'] - 1] = intval($entry['count']);
    }

    $result = array_values($result);

    return $result;
}

function getUsuariosPorLevel()
{
    $query = <<<SQL
        SELECT level, COUNT(id) as count
        FROM user
        WHERE deleted = false
            AND guild_index <> 1
        GROUP BY level
        ORDER BY level ASC;
SQL;

    $usuariosPorLevel = executeGetMultipleRowsQuery($query);

    $result = array();

    for ($i = 14; $i <= 54 ; $i++) {
        $result[] = 0;
    }

    foreach ($usuariosPorLevel as $entry) {
        $result[$entry['level'] - 14] = intval($entry['count']);
    }

    return $result;
}

function getKillsPorClase()
{
    $query = <<<SQL
        SELECT class_id, AVG(ciudadanos_matados + criminales_matados) as promedio_matados
        FROM user
        WHERE deleted = FALSE
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
            'y' => intval($entry['promedio_matados'])
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
