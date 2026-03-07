<?php
/**
 * Generate Additional Sample Data — AO Estadísticas
 *
 * Cubre todas las estadísticas del dashboard:
 *   ✓ Personajes con clases, razas, niveles, kills
 *   ✓ faction_score  (Balance Real vs Caos)
 *   ✓ puntos_pesca   (Distribución de pesca)
 *   ✓ guild_index    (% en clan)
 *   ✓ Tabla object   (nombres de ítems)
 *   ✓ statistics_items (historial de ítems en circulación)
 *   ✓ gold_statistics  (historial de oro)
 *   ✓ statistics_users_online (30 días)
 *
 * Correr después de setup.php:
 *   php dev_database/generate_more_data.php
 */

echo "=== AO Estadísticas — Generador de Datos de Prueba ===\n\n";

if (!file_exists(__DIR__ . '/environment.dev.php')) {
    die("Error: environment.dev.php no encontrado en " . __DIR__ . "\n");
}
include(__DIR__ . '/environment.dev.php');

$conn = new mysqli($databaseHost, $databaseUserRead, $databasePasswordRead, $databaseName, $databasePort);
if ($conn->connect_error) die("Conexión fallida: " . $conn->connect_error . "\n");
$conn->set_charset('utf8');
echo "Conectado a '$databaseName'.\n\n";

// ── HELPERS ───────────────────────────────────────────────────────────────────
function tableExists($conn, $table) {
    $r = $conn->query("SHOW TABLES LIKE '$table'");
    return $r && $r->num_rows > 0;
}
function columnExists($conn, $table, $col) {
    $r = $conn->query("SHOW COLUMNS FROM `$table` LIKE '$col'");
    return $r && $r->num_rows > 0;
}
function getMaxId($conn, $table) {
    $r = $conn->query("SELECT COALESCE(MAX(id),0) AS m FROM `$table`");
    return $r ? (int)$r->fetch_assoc()['m'] : 0;
}

// ── CUÁNTOS PERSONAJES ────────────────────────────────────────────────────────
echo "¿Cuántos personajes adicionales generar? (default: 100): ";
$handle   = fopen("php://stdin", "r");
$numChars = (int)trim(fgets($handle));
fclose($handle);
if ($numChars <= 0) $numChars = 100;
echo "Generando $numChars personajes...\n\n";

// ─────────────────────────────────────────────────────────────────────────────
// PASO 1 — Columnas nuevas en user
// ─────────────────────────────────────────────────────────────────────────────
echo "[1/7] Verificando columnas en tabla user...\n";
$newCols = [
    'faction_score'        => 'INT NOT NULL DEFAULT 0',
    'puntos_pesca'         => 'INT NOT NULL DEFAULT 0',
    'guild_aspirant_index' => 'INT NOT NULL DEFAULT 0',
];
foreach ($newCols as $col => $def) {
    if (!columnExists($conn, 'user', $col)) {
        $conn->query("ALTER TABLE `user` ADD COLUMN `$col` $def");
        echo "  + Columna '$col' agregada.\n";
    } else {
        echo "  ✓ '$col' ya existe.\n";
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// PASO 2 — Tabla object (nombres de ítems)
// ─────────────────────────────────────────────────────────────────────────────
echo "\n[2/7] Cargando tabla object con ítems del juego...\n";

if (!tableExists($conn, 'object')) {
    $conn->query("CREATE TABLE `object` (
        `number` INT NOT NULL,
        `name`   VARCHAR(45) NOT NULL,
        PRIMARY KEY (`number`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8");
    echo "  + Tabla object creada.\n";
}

// Lista completa de ítems — number = item_id real del juego
$items = [
    // Recursos madereros
    [58,   'Leña'],
    [59,   'Leña de Roble'],
    [60,   'Leña Seca'],
    [2781, 'Leña Élfica'],
    // Minerales
    [192,  'Mineral de Hierro'],
    [193,  'Mineral de Plata'],
    [194,  'Mineral de Oro'],
    [3391, 'Mineral de Carbón'],
    [3787, 'Mineral de Blodium'],
    // Lingotes
    [386,  'Lingote de Hierro'],
    [387,  'Lingote de Plata'],
    [388,  'Lingote de Oro'],
    // Pociones
    [36,   'Poción de Agilidad'],
    [37,   'Poción de Maná'],
    [38,   'Poción de Vida'],
    [39,   'Poción de Fuerza'],
    [169,  'Poción de Energía'],
    [889,  'Poción de Agilidad (Alq.)'],
    [891,  'Poción de Vida (Alq.)'],
    [892,  'Poción de Fuerza (Alq.)'],
    [894,  'Poción de Maná (Alq.)'],
    [3894, 'Poción de Veneno (Alq.)'],
    // Armas — espadas
    [100,  'Espada Corta'],
    [101,  'Espada Larga'],
    [102,  'Espada Élfica'],
    [124,  'Katana'],
    [126,  'Espada de Plata'],
    [131,  'Espada Zafiro'],
    [398,  'Sable Maestro'],
    [399,  'Cimitarra'],
    [402,  'Espada Matadragones'],
    // Armas — hachas
    [103,  'Hacha de Batalla'],
    [104,  'Hacha Enana'],
    [1246, 'Hacha de Guerra dos Filos'],
    // Armas — daggers
    [107,  'Daga'],
    [366,  'Daga +3'],
    [367,  'Daga +4'],
    // Armas — arcos
    [105,  'Arco de Madera'],
    [106,  'Arco Compuesto'],
    [1869, 'Arco Maestro'],
    [1870, 'Arco de Roble'],
    [1876, 'Arco de Cazador'],
    // Armas — otros
    [108,  'Lanza'],
    [1825, 'Nudillo de Mithril'],
    [1788, 'Báculo Engarzado'],
    [1797, 'Bastón Nudoso'],
    // Flechas
    [551,  'Flecha +2'],
    [552,  'Flecha Élfica'],
    [553,  'Flecha +3'],
    [3550, 'Flecha +1'],
    [3801, 'Carcaj'],
    [3802, 'Carcaj +2'],
    [3803, 'Carcaj +3'],
    [3806, 'Carcaj +1'],
    // Armaduras — pesadas
    [120,  'Armadura de Cuero'],
    [121,  'Armadura de Hierro'],
    [122,  'Armadura Encantada'],
    [360,  'Armadura de Cazador'],
    [495,  'Armadura Escarlata'],
    [496,  'Armadura de la Luz'],
    [1099, 'Armadura de Placas'],
    [1911, 'Armadura Pesada'],
    [1929, 'Armadura de las Sombras'],
    [1987, 'Armadura de Placas Completa'],
    [2801, 'Coraza Compuesta'],
    [2804, 'Armadura Caranthir'],
    // Armaduras — ligeras / túnicas
    [519,  'Túnica Legendaria'],
    [530,  'Túnica de Druida'],
    [2916, 'Atavío Oscuro'],
    [2920, 'Cota de Minero Experto'],
    // Escudos
    [110,  'Escudo de Madera'],
    [111,  'Escudo de Hierro'],
    [112,  'Escudo Élfico'],
    [1702, 'Escudo del Valle'],
    [1722, 'Rodela Reforzada'],
    [2933, 'Escudo de Plata'],
    // Cascos
    [132,  'Casco de Hierro Completo'],
    [601,  'Casco de Plata'],
    [1758, 'Casco de Oso'],
    [1767, 'Casco del Cazador'],
    [3990, 'Sombrero de Mago Superior'],
    [4933, 'Sombrero de Hechicero'],
    [4934, 'Casco de Tigre'],
    [4935, 'Capucha de Élite'],
    // Instrumentos
    [40,   'Flauta Élfica'],
    [41,   'Laúd Élfico'],
    [469,  'Laúd Mágico'],
    [540,  'Flauta Mágica'],
    // Varios
    [161,  'Reloj de Arena'],
    [474,  'Barca'],
    [475,  'Galera'],
    [2323, 'Anillo de Disolución'],
    [3769, 'Relicario'],
    [3984, 'Cruz Mágica'],
];

$conn->query("DELETE FROM `object`");
$stmt = $conn->prepare("INSERT IGNORE INTO `object` (`number`, `name`) VALUES (?, ?)");
foreach ($items as [$num, $name]) {
    $stmt->bind_param("is", $num, $name);
    $stmt->execute();
}
echo "  ✓ " . count($items) . " ítems cargados en object.\n";

// ─────────────────────────────────────────────────────────────────────────────
// PASO 3 — Personajes
// ─────────────────────────────────────────────────────────────────────────────
echo "\n[3/7] Generando $numChars personajes...\n";

$prefijos = [
    1  => ['Archmago','Hechicero','Brujo','Merlín','Magister'],
    2  => ['Clérigo','Obispo','Sacerdote','Monje','Prior'],
    3  => ['Guerrero','Campeón','Titan','Berserker','Gladiador'],
    4  => ['Sombra','Asesino','Espectro','Viper','Phantom'],
    5  => ['Bardo','Trovador','Juglar','Cantor','Rapsoda'],
    6  => ['Druida','Guardián','Silvano','Shaman','Ermitaño'],
    7  => ['Paladín','Cruzado','Templario','Caballero','Justicia'],
    8  => ['Cazador','Rastreador','Arquero','Explorador','Franco'],
    9  => ['Minero','Leñador','Pescador','Herrero','Artesano'],
    12 => ['Bandido','Forajido','Corsario','Proscrito','Saqueador'],
];
$validClases = [1,2,3,4,5,6,7,8,9,12];

$maxAccId = getMaxId($conn, 'account');
$maxUsrId = getMaxId($conn, 'user');

// Cargar nombres existentes para evitar duplicados
$usedNames = [];
$r = $conn->query("SELECT name FROM user");
while ($row = $r->fetch_assoc()) $usedNames[$row['name']] = true;

$hasFaction = columnExists($conn, 'user', 'faction_score');
$hasPesca   = columnExists($conn, 'user', 'puntos_pesca');
$hasAspir   = columnExists($conn, 'user', 'guild_aspirant_index');

$generated = 0;
$attempts  = 0;

while ($generated < $numChars && $attempts < $numChars * 10) {
    $attempts++;
    $classId = $validClases[array_rand($validClases)];
    $raceId  = rand(1, 6);

    // Distribución de niveles: 50% bajos (1-12), 35% medios (13-45), 15% altos (46-99)
    $rndLvl = rand(1, 100);
    if      ($rndLvl <= 50) $level = rand(1, 12);
    elseif  ($rndLvl <= 85) $level = rand(13, 45);
    else                     $level = rand(46, 99);

    $ciudMatados = rand(0, 60);
    $crimMatados = rand(0, 50);

    // Nombre único
    $prefix = $prefijos[$classId][array_rand($prefijos[$classId])];
    $name   = $prefix . rand(10, 9999);
    if (isset($usedNames[$name])) continue;
    $usedNames[$name] = true;

    // faction_score: 40% Real (+1 a +500), 35% Caos (-500 a -1), 25% neutral
    $factionScore = 0;
    $rndF = rand(1, 100);
    if      ($rndF <= 40) $factionScore = rand(1,   500);
    elseif  ($rndF <= 75) $factionScore = rand(-500, -1);

    // puntos_pesca: 60% sin pesca, 28% pesca baja, 12% expertos
    $pesca = 0;
    $rndP  = rand(1, 100);
    if      ($rndP <= 72) $pesca = 0;
    elseif  ($rndP <= 92) $pesca = rand(1, 999);
    else                   $pesca = rand(1000, 15000);

    // guild: 35% en clan (idx 2–6), 5% aspirante, 60% sin clan
    $guildIdx  = 0;
    $aspirIdx  = 0;
    $rndG = rand(1, 100);
    if      ($rndG <= 35) $guildIdx = rand(2, 6);
    elseif  ($rndG <= 40) $aspirIdx = rand(2, 6);

    // Insertar cuenta
    $accId = $maxAccId + $generated + 1;
    $usrId = $maxUsrId + $generated + 1;
    $uname = 'dev_' . $accId;
    $email = "dev{$accId}@ao.dev";

    $s = $conn->prepare("INSERT INTO account (id, username, password, email) VALUES (?,?,'dev_hash',?)");
    $s->bind_param("iss", $accId, $uname, $email);
    $s->execute();

    // Insertar personaje — dinámico según columnas disponibles
    if ($hasFaction && $hasPesca && $hasAspir) {
        $s = $conn->prepare(
            "INSERT INTO user
             (id,account_id,name,class_id,race_id,level,
              ciudadanos_matados,criminales_matados,
              guild_index,guild_aspirant_index,deleted,
              faction_score,puntos_pesca)
             VALUES (?,?,?,?,?,?,?,?,?,?,0,?,?)"
        );
        $s->bind_param("iisiiiiiiiii",
            $usrId,$accId,$name,$classId,$raceId,$level,
            $ciudMatados,$crimMatados,
            $guildIdx,$aspirIdx,
            $factionScore,$pesca
        );
    } else {
        $s = $conn->prepare(
            "INSERT INTO user
             (id,account_id,name,class_id,race_id,level,
              ciudadanos_matados,criminales_matados,guild_index,deleted)
             VALUES (?,?,?,?,?,?,?,?,0,0)"
        );
        $s->bind_param("iisiiiii",
            $usrId,$accId,$name,$classId,$raceId,$level,
            $ciudMatados,$crimMatados
        );
    }
    $s->execute();
    $generated++;
    if ($generated % 20 === 0) echo "  ... $generated personajes\n";
}
echo "  ✓ $generated personajes generados.\n";

// ─────────────────────────────────────────────────────────────────────────────
// PASO 4 — Online statistics (30 días)
// ─────────────────────────────────────────────────────────────────────────────
echo "\n[4/7] Generando estadísticas online (30 días)...\n";

for ($day = 30; $day >= 0; $day--) {
    $date = date('Y-m-d', strtotime("-{$day} days"));
    for ($hour = 0; $hour < 24; $hour++) {
        $dt = sprintf("%s %02d:00:00", $date, $hour);
        if      ($hour >= 20)               $base = rand(55, 80);
        elseif  ($hour >= 17)               $base = rand(40, 60);
        elseif  ($hour >= 14)               $base = rand(25, 40);
        elseif  ($hour >= 10)               $base = rand(15, 25);
        elseif  ($hour >= 6)                $base = rand(8,  18);
        else                                $base = rand(3,  10);
        $users = max(1, $base + rand(-3, 5));
        $s = $conn->prepare("INSERT INTO statistics_users_online (date, number) VALUES (?,?)");
        $s->bind_param("si", $dt, $users);
        $s->execute();
    }
}
echo "  ✓ " . (31 * 24) . " registros de online.\n";

// ─────────────────────────────────────────────────────────────────────────────
// PASO 5 — Gold statistics (30 días, 4 snapshots/día)
// ─────────────────────────────────────────────────────────────────────────────
echo "\n[5/7] Generando historial de oro...\n";

if (!tableExists($conn, 'gold_statistics')) {
    $conn->query("CREATE TABLE `gold_statistics` (
        `id`                     INT AUTO_INCREMENT PRIMARY KEY,
        `datetime`               DATETIME NOT NULL,
        `gold_total`             BIGINT DEFAULT 0,
        `gold_inventory`         BIGINT DEFAULT 0,
        `gold_bank`              BIGINT DEFAULT 0,
        `gold_inventory_as_item` BIGINT DEFAULT 0,
        `gold_bank_as_item`      BIGINT DEFAULT 0
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8");
    echo "  + Tabla gold_statistics creada.\n";
}

$gInv  = 5000000;
$gBank = 2000000;
for ($day = 30; $day >= 0; $day--) {
    $date = date('Y-m-d', strtotime("-{$day} days"));
    foreach (['06:00:00','12:00:00','18:00:00','23:00:00'] as $time) {
        $inv      = (int)($gInv  * (1 + (lcg_value()-0.5)*0.04));
        $bank     = (int)($gBank * (1 + (lcg_value()-0.5)*0.03));
        $invItem  = (int)($inv   * 0.15);
        $bankItem = (int)($bank  * 0.10);
        $total    = $inv + $bank + $invItem + $bankItem;
        $dt       = "$date $time";
        $s = $conn->prepare(
            "INSERT INTO gold_statistics
             (datetime,gold_total,gold_inventory,gold_bank,gold_inventory_as_item,gold_bank_as_item)
             VALUES (?,?,?,?,?,?)"
        );
        $s->bind_param("siiiii", $dt, $total, $inv, $bank, $invItem, $bankItem);
        $s->execute();
        $gInv  = (int)($gInv  * 1.003);
        $gBank = (int)($gBank * 1.003);
    }
}
echo "  ✓ " . (31 * 4) . " snapshots de oro.\n";

// ─────────────────────────────────────────────────────────────────────────────
// PASO 6 — Item statistics (30 días, 2 snapshots/día)
// ─────────────────────────────────────────────────────────────────────────────
echo "\n[6/7] Generando historial de ítems en circulación...\n";

if (!tableExists($conn, 'statistics_items')) {
    $conn->query("CREATE TABLE `statistics_items` (
        `id`             INT AUTO_INCREMENT PRIMARY KEY,
        `datetime`       DATETIME NOT NULL,
        `item_id`        INT NOT NULL,
        `total_quantity` BIGINT DEFAULT 0,
        INDEX idx_item_dt (item_id, datetime)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8");
    echo "  + Tabla statistics_items creada.\n";
}

// [item_id, cantidad_base, variación_diaria, tendencia_crecimiento]
$itemStats = [
    [38,   50000,  2000,  0.012],  // Poción de Vida       — alta demanda
    [37,   45000,  1800,  0.010],  // Poción de Maná
    [36,   38000,  1500,  0.009],  // Poción de Agilidad
    [39,   30000,  1200,  0.008],  // Poción de Fuerza
    [58,   80000,  5000,  0.005],  // Leña                 — muy abundante
    [59,   30000,  2000,  0.004],  // Leña de Roble
    [60,   20000,  1500,  0.003],  // Leña Seca
    [2781, 18000,   900,  0.004],  // Leña Élfica
    [192,  60000,  3000,  0.006],  // Mineral de Hierro
    [193,  25000,  1500,  0.007],  // Mineral de Plata
    [194,   8000,   500,  0.009],  // Mineral de Oro
    [3391, 20000,  1200,  0.006],  // Mineral de Carbón
    [386,  15000,   800,  0.005],  // Lingote de Hierro
    [387,   6000,   400,  0.006],  // Lingote de Plata
    [388,   2000,   200,  0.008],  // Lingote de Oro
    [551, 120000,  8000,  0.002],  // Flecha +2
    [552,  50000,  3000,  0.003],  // Flecha Élfica
    [553,  30000,  2000,  0.003],  // Flecha +3
    [3550, 80000,  5000,  0.002],  // Flecha +1
    [101,   4000,   200,  0.003],  // Espada Larga
    [126,   3500,   150,  0.003],  // Espada de Plata
    [131,    800,    50,  0.004],  // Espada Zafiro
    [107,   6000,   300,  0.004],  // Daga
    [103,   2500,   120,  0.003],  // Hacha de Batalla
    [105,   5000,   250,  0.003],  // Arco de Madera
    [106,   3000,   150,  0.004],  // Arco Compuesto
    [120,   8000,   400,  0.003],  // Armadura de Cuero
    [121,   5000,   250,  0.002],  // Armadura de Hierro
    [111,   6000,   300,  0.002],  // Escudo de Hierro
    [112,   2500,   120,  0.003],  // Escudo Élfico
    [132,   2000,   100,  0.002],  // Casco de Hierro Completo
    [38,   50000,  2000,  0.012],  // (garantizar Leña visible)
    [474,    150,    10,  0.001],  // Barca
    [475,     80,     5,  0.001],  // Galera
    [161,   1200,    60,  0.002],  // Reloj de Arena
];

// Eliminar duplicados por item_id
$seen = [];
$itemStatsClean = [];
foreach ($itemStats as $row) {
    if (!isset($seen[$row[0]])) {
        $seen[$row[0]] = true;
        $itemStatsClean[] = $row;
    }
}

$totalInserted = 0;
foreach ($itemStatsClean as [$itemId, $qtyBase, $var, $trend]) {
    $qty = $qtyBase;
    for ($day = 30; $day >= 0; $day--) {
        $date = date('Y-m-d', strtotime("-{$day} days"));
        foreach (['09:00:00', '21:00:00'] as $time) {
            $qty = max(0, (int)($qty * (1 + $trend) + rand(-$var, $var)));
            $dt  = "$date $time";
            $s   = $conn->prepare(
                "INSERT INTO statistics_items (datetime, item_id, total_quantity) VALUES (?,?,?)"
            );
            $s->bind_param("sii", $dt, $itemId, $qty);
            $s->execute();
            $totalInserted++;
        }
    }
}
echo "  ✓ $totalInserted registros de ítems (" . count($itemStatsClean) . " ítems distintos).\n";

// ─────────────────────────────────────────────────────────────────────────────
// PASO 7 — Resumen
// ─────────────────────────────────────────────────────────────────────────────
echo "\n[7/7] Verificando...\n";

$checks = [
    "Personajes activos"  => "SELECT COUNT(*) FROM user WHERE deleted=0 AND guild_index<>1",
    "Ítems en object"     => "SELECT COUNT(*) FROM `object`",
    "Registros online"    => "SELECT COUNT(*) FROM statistics_users_online",
];
if (tableExists($conn,'gold_statistics'))  $checks["Snapshots de oro"]    = "SELECT COUNT(*) FROM gold_statistics";
if (tableExists($conn,'statistics_items')) $checks["Registros de ítems"]  = "SELECT COUNT(*) FROM statistics_items";

foreach ($checks as $label => $q) {
    $cnt = $conn->query($q)->fetch_row()[0];
    echo "  ✓ $label: $cnt\n";
}

// Distribución rápida de facciones
if ($hasFaction && columnExists($conn,'user','faction_score')) {
    $r = $conn->query(
        "SELECT
            SUM(faction_score>0) AS `real`,
            SUM(faction_score<0) AS `caos`,
            SUM(faction_score=0) AS `neutral`
         FROM user WHERE deleted=0 AND guild_index<>1"
    );
    $f = $r->fetch_assoc();
    echo "  ✓ Facciones — Real: {$f['real']}  Caos: {$f['caos']}  Neutral: {$f['neutral']}\n";
}
if ($hasPesca && columnExists($conn,'user','puntos_pesca')) {
    $r = $conn->query("SELECT COUNT(*) FROM user WHERE puntos_pesca>0 AND deleted=0");
    echo "  ✓ Pescadores activos: " . $r->fetch_row()[0] . "\n";
}

$conn->close();
echo "\n=== Completado! Abrí http://localhost/argentum20-estadisticas/ ===\n\n";
?>
