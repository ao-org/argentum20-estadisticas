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

// Execute schema
echo "Setting up database schema...\n";
$schema = file_get_contents(__DIR__ . '/schema.sql');
if ($schema === false) {
    die("Error: Could not read schema.sql file.\n");
}

// Split and execute SQL statements
$statements = array_filter(array_map('trim', explode(';', $schema)));
foreach ($statements as $statement) {
    if (!empty($statement) && !preg_match('/^--/', $statement)) {
        if ($conn->query($statement) === FALSE) {
            echo "Warning: Error executing statement: " . $conn->error . "\n";
            echo "Statement: " . substr($statement, 0, 100) . "...\n\n";
        }
    }
}
echo "Schema setup completed.\n\n";

// Execute sample data
echo "Inserting sample data...\n";
$sampleData = file_get_contents(__DIR__ . '/sample_data.sql');
if ($sampleData === false) {
    die("Error: Could not read sample_data.sql file.\n");
}

// Split and execute SQL statements
$statements = array_filter(array_map('trim', explode(';', $sampleData)));
foreach ($statements as $statement) {
    if (!empty($statement) && !preg_match('/^--/', $statement)) {
        if ($conn->query($statement) === FALSE) {
            echo "Warning: Error executing statement: " . $conn->error . "\n";
            echo "Statement: " . substr($statement, 0, 100) . "...\n\n";
        }
    }
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

echo "=== Setup Complete! ===\n\n";
echo "Next steps:\n";
echo "1. Copy 'dev_database/environment.dev.php' to 'environment.php'\n";
echo "2. Start your local web server\n";
echo "3. Open the application in your browser\n\n";
echo "Note: Make sure your MySQL server is running and accessible with the configured credentials.\n";

?>