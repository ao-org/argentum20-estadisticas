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
    1 => ['Mago', 'Wizard', 'Arcano', 'Mystic'],
    2 => ['Clerigo', 'Priest', 'Santo', 'Divine'],
    3 => ['Guerrero', 'Knight', 'Warrior', 'Fighter'],
    4 => ['Asesino', 'Shadow', 'Killer', 'Ninja'],
    5 => ['Bardo', 'Minstrel', 'Song', 'Music'],
    6 => ['Druida', 'Nature', 'Forest', 'Wild'],
    7 => ['Paladin', 'Holy', 'Light', 'Sacred'],
    8 => ['Cazador', 'Hunter', 'Ranger', 'Scout'],
    9 => ['Trabajador', 'Worker', 'Craft', 'Builder'],
    10 => ['Bandido', 'Thief', 'Rogue', 'Bandit']
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
    $classId = rand(1, 10);
    $raceId = rand(1, 6);
    $level = rand(14, 50); // Focus on higher levels as per original query
    $ciudadanosMatados = rand(0, 50);
    $criminalesMatados = rand(0, 40);
    
    // Generate character name
    $prefix = $classPrefixes[$classId][array_rand($classPrefixes[$classId])];
    $suffix = rand(100, 999);
    $charName = $prefix . $suffix;
    
    // Create account
    $username = "testuser" . $accountId;
    $email = "test$accountId@example.com";
    
    $stmt = $conn->prepare("INSERT INTO account (id, username, password, email) VALUES (?, ?, 'test_password', ?)");
    $stmt->bind_param("iss", $accountId, $username, $email);
    $stmt->execute();
    
    // Create character
    $stmt = $conn->prepare("INSERT INTO user (id, account_id, name, class_id, race_id, level, ciudadanos_matados, criminales_matados, guild_index, deleted) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 0)");
    $stmt->bind_param("iisiiiii", $userId, $accountId, $charName, $classId, $raceId, $level, $ciudadanosMatados, $criminalesMatados);
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