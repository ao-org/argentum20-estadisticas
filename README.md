# re20-estadisticas

Página de estadísticas del server de Argentum Online

<img src="https://i.ibb.co/9ZxYSTZ/image.png"></img>

## Configuración de Desarrollo

### Prerequisitos

**Nota: Sugerimos usar XAMPP, pero se puede usar cualquier servidor de desarrollo local web que soporte PHP**

- **XAMPP**: Instala XAMPP en `C:/xampp/` (descarga desde https://www.apachefriends.org/)
- Ejecuta Xampp
- Asegúrate de que MySQL esté ejecutándose desde el panel de control de XAMPP

### Inicio Rápido para Desarrollo Local

1. **Configuración**: Ejecuta en la terminal `c:/xampp/php/php.exe dev_database/setup.php` (esto creará automáticamente la base de datos y el archivo `environment.php si no existe`)
2. **Probar**: Inicia Apache desde XAMPP y abre la aplicación en tu navegador (por defecto http://localhost/argentum20-estadisticas/)

### Base de Datos de Desarrollo

La carpeta `dev_database/` contiene todo lo necesario para desarrollo local:

- `schema.sql` - Esquema de base de datos con todas las tablas requeridas
- `sample_data.sql` - Datos de ejemplo para desarrollo y pruebas
- `setup.php` - Script PHP para inicializar la base de datos de desarrollo
- `environment.dev.php` - Configuración del entorno de desarrollo local
- `reset.php` - Script para resetear la base de datos con datos frescos
- `generate_more_data.php` - Script para generar datos de ejemplo adicionales

### Configuración del Entorno

El script de configuración (dev_database/setup.php) crea automáticamente el archivo `environment.php` con la configuración de desarrollo.

Si necesitas ajustar las credenciales de la base de datos en `environment.php`, podes modificar:

- `$databaseHost` - Usualmente 'localhost'
- `$databaseUserRead` - Tu usuario de MySQL (a menudo 'root')
- `$databasePasswordRead` - Tu contraseña de MySQL
- `$databaseName` - Nombre de la base de datos ('ao_stats_dev')

### Scripts de Desarrollo

**Resetear Base de Datos** - Para empezar de nuevo con datos limpios:

```cmd
c:/xampp/php/php.exe dev_database/reset.php
```

**Generar Más Datos** - Para agregar más personajes y estadísticas para pruebas:

```cmd
c:/xampp/php/php.exe dev_database/generate_more_data.php
```

**Nota: La carpeta `dev_database/` y su contenido son solo para propósitos de desarrollo y nunca deben usarse en producción.**

## Créditos

Basado en las estadísticas de Cucsi-AO (https://www.cucsi-ao.com.ar/)
