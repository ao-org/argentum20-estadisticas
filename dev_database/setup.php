<?php
/**
 * Development Database Setup Script
 * 
 * This script initializes the local development database with schema and sample data.
 * Run this script once to set up your local development environment.
 */

echo "=== AO Statistics - Development Database Setup ===\n\n";

// Load development configuration
if (!file_exists(__DIR__ . '/environment.dev.php')) {
    die("Error: environment.dev.php not found. Please check the dev_database folder.\n");
}

include(__DIR__ . '/environment.dev.php');

echo "Connecting to MySQL server...\n";

// Connect to MySQL server (without selecting database first)
$conn = new mysqli($databaseHost, $databaseUserRead, $databasePasswordRead, '', $databasePort);

if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error . "\n");
}

echo "Connected successfully!\n\n";

// Create database if it doesn't exist
echo "Creating database '$databaseName' if it doesn't exist...\n";
$sql = "CREATE DATABASE IF NOT EXISTS `$databaseName` DEFAULT CHARACTER SET utf8 COLLATE utf8_general_ci";
if ($conn->query($sql) === TRUE) {
    echo "Database '$databaseName' ready.\n\n";
} else {
    die("Error creating database: " . $conn->error . "\n");
}

// Select the database
$conn->select_db($databaseName);

// Clean up any existing tables first
echo "Cleaning up existing tables...\n";
$tables = ['statistics_users_online', 'user', 'account', 'character_classes', 'character_races'];
foreach ($tables as $table) {
    $conn->query("DROP TABLE IF EXISTS `$table`");
}
echo "Cleanup completed.\n\n";

// Execute schema
echo "Setting up database schema...\n";
$schema = file_get_contents(__DIR__ . '/schema.sql');
if ($schema === false) {
    die("Error: Could not read schema.sql file.\n");
}

// Execute the entire schema file using multi_query
if ($conn->multi_query($schema)) {
    do {
        // Store first result set
        if ($result = $conn->store_result()) {
            $result->free();
        }
        // Print divider between results
        if ($conn->more_results()) {
            // Continue to next result
        }
    } while ($conn->next_result());
} else {
    echo "Error executing schema: " . $conn->error . "\n";
}
echo "Schema setup completed.\n\n";

// Execute sample data
echo "Inserting sample data...\n";
$sampleData = file_get_contents(__DIR__ . '/sample_data.sql');
if ($sampleData === false) {
    die("Error: Could not read sample_data.sql file.\n");
}

// Execute the entire sample data file using multi_query
if ($conn->multi_query($sampleData)) {
    do {
        // Store first result set
        if ($result = $conn->store_result()) {
            $result->free();
        }
        // Print divider between results
        if ($conn->more_results()) {
            // Continue to next result
        }
    } while ($conn->next_result());
} else {
    echo "Error executing sample data: " . $conn->error . "\n";
}
echo "Sample data inserted successfully.\n\n";

// Verify setup
echo "Verifying setup...\n";
$result = $conn->query("SELECT COUNT(*) as count FROM account");
$row = $result->fetch_assoc();
echo "Accounts created: " . $row['count'] . "\n";

$result = $conn->query("SELECT COUNT(*) as count FROM user WHERE deleted = 0 AND guild_index <> 1");
$row = $result->fetch_assoc();
echo "Characters created: " . $row['count'] . "\n";

$result = $conn->query("SELECT COUNT(*) as count FROM statistics_users_online");
$row = $result->fetch_assoc();
echo "Online statistics records: " . $row['count'] . "\n\n";

$conn->close();

// Create environment.php in root folder
echo "Creating environment.php configuration file...\n";
$environmentContent = file_get_contents(__DIR__ . '/environment.dev.php');
if ($environmentContent === false) {
    echo "Warning: Could not read environment.dev.php file.\n";
} else {
    $rootEnvironmentPath = dirname(__DIR__) . '/environment.php';
    if (file_put_contents($rootEnvironmentPath, $environmentContent) !== false) {
        echo "Environment configuration created at: environment.php\n";
    } else {
        echo "Warning: Could not create environment.php file. Please copy manually.\n";
    }
}

echo "\n=== Setup Complete! ===\n\n";
echo "Next steps:\n";
echo "1. Start Apache from XAMPP control panel\n";
echo "2. Open the application in your browser (http://localhost/argentum20-estadisticas/)\n\n";
echo "Note: Make sure MySQL is running in XAMPP and accessible with the configured credentials.\n";
echo "If you need to adjust database credentials, edit the 'environment.php' file in the root folder.\n";

?>