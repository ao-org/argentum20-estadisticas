FROM php:8.3-apache

RUN docker-php-ext-install mysqli

COPY . /var/www/html/

# Generate environment.php from env vars at startup
RUN echo '#!/bin/sh\n\
cat > /var/www/html/environment.php <<EOF\n\
<?php\n\
\$databaseHost = getenv("DB_HOST") ?: "localhost";\n\
\$databaseUserRead = getenv("DB_USER") ?: "root";\n\
\$databasePasswordRead = getenv("DB_PASSWORD") ?: "";\n\
\$databaseName = getenv("DB_NAME") ?: "ao20";\n\
\$databasePort = getenv("DB_PORT") ?: 3306;\n\
?>\n\
EOF\n\
apache2-foreground' > /entrypoint.sh && chmod +x /entrypoint.sh

EXPOSE 80

CMD ["/entrypoint.sh"]
