# Sitio (solo JavaScript + PHP)

Misma funcionalidad que `backend/` (Laravel) + `cliente/` (React/TypeScript), sin frameworks ni compilación.

- **PHP puro** (`src/`, `public/index.php`, `views/`): API REST, login con token Bearer, CRUD de estudiantes/usuarios y PDF de la constancia (Dompdf incluido en `lib/`).
- **JavaScript puro** (`public/js/`): módulos ES con router propio (History API). Solo se incluye `public/js/vendor/qrcode.js` para dibujar el QR.
- Base de datos: SQLite en `database/database.sqlite` (copia de la que usaba Laravel; mismos usuarios, estudiantes y contraseñas).

## Ejecutar en local

```
cd sitio
php -S localhost:8000 -t public public/index.php
```

Abrir http://localhost:8000/app/ — usuario `admin@example.com` / `password`.

Requiere PHP 8.1+ con las extensiones `pdo_sqlite`, `gd`, `mbstring` y `dom`.

## Producción (Apache)

Subir todo `sitio/` a la carpeta del dominio: el `.htaccess` de la raíz redirige a `public/` y bloquea `src`, `lib`, `views`, `database` y `storage`. La carpeta `storage/cache` y el archivo `database/database.sqlite` deben ser escribibles por PHP.

Configuración opcional en un archivo `.env` junto a este README:

```
FRONTEND_URL=https://tu-dominio.com   # se usa en el QR del PDF
DB_DATABASE=/ruta/a/database.sqlite
APP_DEBUG=false
```

## Rutas

| Ruta | Descripción |
| --- | --- |
| `/app/...` | Sitio (búsqueda, login `/app/login`, panel `/app/panel-estudiantes`) |
| `POST /api/login`, `POST /api/register` | Autenticación |
| `GET /api/public/estudiantes` | Búsqueda pública (`search`, `nombre`, `primerApellido`, `segundoApellido`, `curp`, `page`) |
| `GET /api/public/constancia-pdf?cedula=` | PDF de la constancia |
| `/api/estudiantes`, `/api/users` | CRUD (requiere token) |
| `GET /health/php-gd` | Diagnóstico de la extensión GD |

## Nginx

```
server {
    root /ruta/a/sitio/public;
    index index.php;
    location / { try_files $uri /index.php?$query_string; }
    location ~ \.php$ {
        include fastcgi_params;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        fastcgi_param HTTP_AUTHORIZATION $http_authorization;
        fastcgi_pass unix:/run/php/php8.2-fpm.sock;
    }
}
```

## Docker

```
cd sitio
docker compose up --build
```

Abrir http://localhost:8080/app/. La base de datos (`database/`) y la caché del PDF (`storage/`) se montan como volúmenes.

## Notas

- Debe estar en la raíz del dominio o subdominio (los recursos usan rutas como `/css/...` y `/api/...`).
- Los errores internos se registran con `error_log` de PHP; con `APP_DEBUG=true` el detalle también sale en la respuesta.
