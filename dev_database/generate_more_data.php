<?php
/**
 * Generate Additional Sample Data
 * 
 * This script generates more realistic sample data for testing.
 * Useful for testing with larger datasets.
 */

echo "=== Generate Additional Sample Data ===\n\n";

// Load development configuration
if (!file_exists(__DIR__ . '/environment.dev.php')) {
    die("Error: environment.dev.php not found.\n");
}

include(__DIR__ . '/environment.dev.php');

$conn = new mysqli($databaseHost, $databaseUserRead, $databasePasswordRead, $databaseName, $databasePort);

if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error . "\n");
}

echo "How many additional characters would you like to generate? (default: 50): ";
$handle = fopen("php://stdin", "r");
$line = trim(fgets($handle));
fclose($handle);

$numChars = is_numeric($line) ? (int)$line : 50;

echo "Generating $numChars additional characters...\n";

// Character name prefixes by class
$classPrefixes = [
    1 => ['Mago'],
    2 => ['Clerigo'],
    3 => ['Guerrero'],
    4 => ['Asesino'],
    5 => ['Bardo'],
    6 => ['Druida'],
    7 => ['Paladin'],
    8 => ['Cazador'],
    9 => ['Trabajador'],
    12 => ['Bandido']
];

// Get current max account and user IDs
$result = $conn->query("SELECT MAX(id) as max_id FROM account");
$maxAccountId = $result->fetch_assoc()['max_id'] ?? 0;

$result = $conn->query("SELECT MAX(id) as max_id FROM user");
$maxUserId = $result->fetch_assoc()['max_id'] ?? 0;

// Generate accounts and characters
for ($i = 1; $i <= $numChars; $i++) {
    $accountId = $maxAccountId + $i;
    $userId = $maxUserId + $i;
    
    // Random character data
    $validClassIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 12];
    $classId = $validClassIds[array_rand($validClassIds)];
    $raceId = rand(1, 6);
    $level = rand(1, 50); // Focus on higher levels as per original query
    $ciudadanosMatados = rand(0, 50);
    $criminalesMatados = rand(0, 40);
    
    // Generate character name
    $prefix = $classPrefixes[$classId][array_rand($classPrefixes[$classId])];
    $suffix = rand(100, 999);
    $charName = $prefix . $suffix;
    
    // Create account
    $email = "test$accountId@example.com";
    $password = str_repeat('a', 64);
    $salt = str_repeat('b', 32);
    $validateCode = str_repeat('c', 32);
    $dateCreated = date('Y-m-d H:i:s');
    
    $stmt = $conn->prepare("INSERT INTO account (id, email, password, salt, date_created, validated, validate_code) VALUES (?, ?, ?, ?, ?, 1, ?)");
    $stmt->bind_param("isssss", $accountId, $email, $password, $salt, $dateCreated, $validateCode);
    $stmt->execute();
    
    // Create character
    $genreId = rand(1, 2);
    $gold = rand(0, 5000);
    $bankGold = rand(0, 10000);
    $killedNpcs = rand(0, 200);
    $deaths = rand(0, 30);
    $exp = $level * $level * 50;
    $minHp = 100 + $level * 8;
    $maxHp = $minHp + rand(0, 50);
    $fechaIngreso = date('Y-m-d H:i:s', strtotime("-" . rand(1, 365) . " days"));
    
    $stmt = $conn->prepare("INSERT INTO user (id, account_id, deleted, name, level, exp, genre_id, race_id, class_id,
      home_id, gold, bank_gold, free_skillpoints, pets_saved, spouse,
      pos_map, pos_x, pos_y, body_id, head_id, weapon_id, helmet_id, shield_id, heading,
      min_hp, min_man, min_sta, min_ham, min_sed, killed_npcs, killed_users, invent_level,
      is_naked, is_poisoned, is_incinerated, is_dead, is_sailing, is_paralyzed, is_silenced,
      is_mounted, counter_pena, deaths,
      ciudadanos_matados, criminales_matados, recibio_armadura_real, recibio_armadura_caos,
      reenlistadas, fecha_ingreso, warnings, elo, return_map,
      return_x, return_y, last_logout, is_logged, is_reset, max_hp,
      jinete_level, backpack_id, guild_index) VALUES
      (?, ?, 0, ?, ?, ?, ?, ?, ?,
       1, ?, ?, 0, 0, 0,
       1, 50, 50, 1, ?, 0, 0, 0, 1,
       ?, 100, 100, 50, 50, ?, 0, 1,
       0, 0, 0, 0, 0, 0, 0,
       0, 0, ?,
       ?, ?, 0, 0,
       0, ?, 0, 1000, 1,
       50, 50, 0, 0, 0, ?,
       0, 0, 0)");
    $headId = rand(1, 25);
    $stmt->bind_param("iisiiiiiiiiiiiiiiiiisi",
      $userId, $accountId, $charName, $level, $exp, $genreId, $raceId, $classId,
      $gold, $bankGold, $headId,
      $minHp, $killedNpcs, $deaths,
      $ciudadanosMatados, $criminalesMatados,
      $fechaIngreso, $maxHp);
    $stmt->execute();
    
    if ($i % 10 == 0) {
        echo "Generated $i characters...\n";
    }
}

// Generate additional online statistics for the past week
echo "Generating additional online statistics...\n";

for ($day = 1; $day <= 7; $day++) {
    $date = date('Y-m-d', strtotime("-$day days"));
    
    for ($hour = 0; $hour < 24; $hour++) {
        $datetime = "$date " . sprintf('%02d:00:00', $hour);
        
        // Simulate realistic online patterns (more users during evening hours)
        $baseUsers = 10;
        if ($hour >= 18 && $hour <= 23) {
            $baseUsers = 40; // Peak hours
        } elseif ($hour >= 14 && $hour <= 17) {
            $baseUsers = 25; // Afternoon
        } elseif ($hour >= 6 && $hour <= 13) {
            $baseUsers = 15; // Morning/day
        } else {
            $baseUsers = 5; // Night
        }
        
        $users = $baseUsers + rand(-5, 15);
        $users = max(1, $users); // At least 1 user
        
        $stmt = $conn->prepare("INSERT INTO statistics_users_online (date, number) VALUES (?, ?)");
        $stmt->bind_param("si", $datetime, $users);
        $stmt->execute();
    }
}

$conn->close();

echo "\nGeneration completed!\n";
echo "Added $numChars new characters and 7 days of online statistics.\n";

?>