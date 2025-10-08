<?php
/**
 * Development Database Reset Script
 * 
 * This script drops all tables and recreates them with fresh sample data.
 * Useful when you want to reset your development environment.
 */

echo "=== AO Statistics - Development Database Reset ===\n\n";

// Load development configuration
if (!file_exists(__DIR__ . '/environment.dev.php')) {
    die("Error: environment.dev.php not found. Please check the dev_database folder.\n");
}

include(__DIR__ . '/environment.dev.php');

echo "WARNING: This will delete ALL data in the '$databaseName' database!\n";
echo "Are you sure you want to continue? (y/N): ";

$handle = fopen("php://stdin", "r");
$line = fgets($handle);
fclose($handle);

if (trim($line) !== 'y' && trim($line) !== 'Y') {
    echo "Reset cancelled.\n";
    exit(0);
}

echo "\nConnecting to database...\n";

$conn = new mysqli($databaseHost, $databaseUserRead, $databasePasswordRead, $databaseName, $databasePort);

if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error . "\n");
}

echo "Connected successfully!\n\n";

// Drop all tables
echo "Dropping existing tables...\n";
$tables = ['statistics_users_online', 'user', 'account', 'character_classes', 'character_races'];
foreach ($tables as $table) {
    $conn->query("DROP TABLE IF EXISTS `$table`");
}
echo "Tables dropped.\n\n";

// Re-run setup
echo "Recreating database structure...\n";

// Execute schema
$schema = file_get_contents(__DIR__ . '/schema.sql');
$statements = array_filter(array_map('trim', explode(';', $schema)));
foreach ($statements as $statement) {
    if (!empty($statement) && !preg_match('/^--/', $statement)) {
        if ($conn->query($statement) === FALSE) {
            echo "Warning: Error executing statement: " . $conn->error . "\n";
        }
    }
}

// Execute sample data
$sampleData = file_get_contents(__DIR__ . '/sample_data.sql');
$statements = array_filter(array_map('trim', explode(';', $sampleData)));
foreach ($statements as $statement) {
    if (!empty($statement) && !preg_match('/^--/', $statement)) {
        if ($conn->query($statement) === FALSE) {
            echo "Warning: Error executing statement: " . $conn->error . "\n";
        }
    }
}

$conn->close();

echo "Database reset completed successfully!\n";

?>