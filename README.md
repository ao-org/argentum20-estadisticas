# re20-estadisticas

Página de estadísticas del server de Argentum Online

<img src="https://i.ibb.co/9ZxYSTZ/image.png"></img>

## Configuración de Desarrollo

### Inicio Rápido para Desarrollo Local

1. **Prerequisitos**: Asegúrate de tener MySQL ejecutándose localmente
2. **Configuración**: Ejecuta `php dev_database/setup.php`
3. **Configurar**: Copia `dev_database/environment.dev.php` a `environment.php`
4. **Probar**: Inicia tu servidor web y abre la aplicación

### Base de Datos de Desarrollo

La carpeta `dev_database/` contiene todo lo necesario para desarrollo local:

- `schema.sql` - Esquema de base de datos con todas las tablas requeridas
- `sample_data.sql` - Datos de ejemplo para desarrollo y pruebas
- `setup.php` - Script PHP para inicializar la base de datos de desarrollo
- `environment.dev.php` - Configuración del entorno de desarrollo local
- `reset.php` - Script para resetear la base de datos con datos frescos
- `generate_more_data.php` - Script para generar datos de ejemplo adicionales

### Configuración del Entorno

Copia el archivo de entorno de desarrollo:

```bash
cp dev_database/environment.dev.php environment.php
```

Ajusta las credenciales de la base de datos en `environment.php` si es necesario:

- `$databaseHost` - Usualmente 'localhost'
- `$databaseUserRead` - Tu usuario de MySQL (a menudo 'root')
- `$databasePasswordRead` - Tu contraseña de MySQL
- `$databaseName` - Nombre de la base de datos ('ao_stats_dev')

### Scripts de Desarrollo

**Resetear Base de Datos** - Para empezar de nuevo con datos limpios:

```bash
php dev_database/reset.php
```

**Generar Más Datos** - Para agregar más personajes y estadísticas para pruebas:

```bash
php dev_database/generate_more_data.php
```

### Esquema de Base de Datos

**Tablas Principales:**

- `account` - Cuentas de usuario
- `user` - Personajes del juego con clase, raza, nivel, kills, etc.
- `statistics_users_online` - Conteos de usuarios online por hora
- `character_classes` - Tabla de referencia para nombres de clases
- `character_races` - Tabla de referencia para nombres de razas

**Nota: La carpeta `dev_database/` y su contenido son solo para propósitos de desarrollo y nunca deben usarse en producción.**

## Créditos

Basado en las estadísticas de Cucsi-AO (https://www.cucsi-ao.com.ar/)
