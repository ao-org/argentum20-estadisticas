# re20-estadisticas

Pagina de estadisticas del server de Argentum Online

<img src="https://i.ibb.co/9ZxYSTZ/image.png"></img>

## Development Setup

This project now includes a complete local development environment setup to avoid having to test changes directly in production.

### Quick Start for Local Development

1. **Prerequisites**: Make sure you have MySQL running locally
2. **Setup**: Run `php dev_database/setup.php`
3. **Configure**: Copy `dev_database/environment.dev.php` to `environment.php`
4. **Test**: Start your web server and open the application

### Development Database

The `dev_database/` folder contains everything needed for local development:

- `schema.sql` - Database schema with all required tables
- `sample_data.sql` - Sample data for development and testing
- `setup.php` - PHP script to initialize the development database
- `environment.dev.php` - Local development environment configuration
- `reset.php` - Script to reset database with fresh data
- `generate_more_data.php` - Script to generate additional sample data

### Environment Configuration

Copy the development environment file:

```bash
cp dev_database/environment.dev.php environment.php
```

Adjust the database credentials in `environment.php` if needed:

- `$databaseHost` - Usually 'localhost'
- `$databaseUserRead` - Your MySQL username (often 'root')
- `$databasePasswordRead` - Your MySQL password
- `$databaseName` - Database name ('ao_stats_dev')

### Sample Data Overview

The sample data includes:

- **6 accounts** with various usernames
- **21 characters** across all classes and races
- **1 admin character** (excluded from statistics)
- **2 deleted characters** (for testing filters)
- **Online statistics** for the last 24+ hours

### Development Scripts

**Reset Database** - To start fresh with clean sample data:

```bash
php dev_database/reset.php
```

**Generate More Data** - To add more characters and statistics for testing:

```bash
php dev_database/generate_more_data.php
```

### Database Schema

**Main Tables:**

- `account` - User accounts
- `user` - Game characters with class, race, level, kills, etc.
- `statistics_users_online` - Hourly online user counts
- `character_classes` - Reference table for class names
- `character_races` - Reference table for race names

**Key Fields:**

- `user.guild_index = 1` - Admin characters (excluded from stats)
- `user.deleted = 1` - Deleted characters (excluded from stats)
- `user.level >= 14` - Level filter used in some statistics

### Troubleshooting

**Connection Issues:**

- Verify MySQL is running
- Check credentials in `environment.php`
- Ensure the database user has CREATE/INSERT permissions

**Permission Issues:**

- Make sure your MySQL user can create databases
- Grant necessary permissions: `GRANT ALL ON ao_stats_dev.* TO 'your_user'@'localhost';`

**Data Issues:**

- Run `reset.php` to start with fresh data
- Use `generate_more_data.php` to add more test data

**Note: The `dev_database/` folder and its contents are for development purposes only and should never be used in production.**

## Creditos

Basado en las estadisticas de Cucsi-AO (https://www.cucsi-ao.com.ar/)
