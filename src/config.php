<?php
// Configuración básica. Se puede sobreescribir con variables de entorno o con un archivo .env en la raíz de "sitio".

function env_file_values(): array
{
    static $values = null;
    if ($values !== null) {
        return $values;
    }
    $values = [];
    $file = __DIR__ . '/../.env';
    if (is_file($file)) {
        foreach (file($file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
            $line = trim($line);
            if ($line === '' || $line[0] === '#' || strpos($line, '=') === false) {
                continue;
            }
            [$k, $v] = explode('=', $line, 2);
            $values[trim($k)] = trim(trim($v), "\"'");
        }
    }
    return $values;
}

function env(string $key, ?string $default = null): ?string
{
    $fromEnv = getenv($key);
    if ($fromEnv !== false && $fromEnv !== '') {
        return $fromEnv;
    }
    return env_file_values()[$key] ?? $default;
}

define('BASE_PATH', dirname(__DIR__));
define('DB_PATH', env('DB_DATABASE') ?: BASE_PATH . '/database/database.sqlite');
// Sin FRONTEND_URL en .env se usa el dominio con el que se está visitando el sitio.
$https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https';
define('FRONTEND_URL', rtrim(env('FRONTEND_URL') ?: ($https ? 'https' : 'http') . '://' . ($_SERVER['HTTP_HOST'] ?? 'localhost'), '/'));
define('APP_DEBUG', env('APP_DEBUG', 'false') === 'true');
define('PER_PAGE', 10);
