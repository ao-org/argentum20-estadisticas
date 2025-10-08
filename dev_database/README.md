# Development Database Setup

This folder contains everything needed to set up a local development database for the AO Statistics project.

## Contents

- `schema.sql` - Database schema with all required tables
- `sample_data.sql` - Sample data for development and testing
- `setup.php` - PHP script to initialize the development database
- `environment.dev.php` - Local development environment configuration

## Usage

1. Create a local MySQL database
2. Run the setup script: `php dev_database/setup.php`
3. Copy `environment.dev.php` to `environment.php`

**Note: This folder and its contents are for development purposes only and should never be used in production.**
