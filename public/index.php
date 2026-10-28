<?php
// Front controller. Con Apache lo usa .htaccess; con el servidor de PHP:
//   php -S localhost:8000 -t public public/index.php

$path = rawurldecode(parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/');

// Servidor integrado de PHP: deja que sirva los archivos estáticos existentes.
if (PHP_SAPI === 'cli-server' && $path !== '/' && is_file(__DIR__ . $path) && substr($path, -4) !== '.php') {
    return false;
}

$src = dirname(__DIR__) . '/src';
require_once $src . '/config.php';
require_once $src . '/db.php';
require_once $src . '/http.php';
require_once $src . '/auth.php';
require_once $src . '/estudiantes.php';
require_once $src . '/usuarios.php';
require_once $src . '/constancia.php';
require_once $src . '/routes.php';

$metodo = $_SERVER['REQUEST_METHOD'] ?? 'GET';
// Permite PUT/DELETE vía POST + _method si el hosting los bloquea.
if ($metodo === 'POST' && isset($_SERVER['HTTP_X_HTTP_METHOD_OVERRIDE'])) {
    $metodo = strtoupper($_SERVER['HTTP_X_HTTP_METHOD_OVERRIDE']);
}

if ($path === '/api' || strncmp($path, '/api/', 5) === 0) {
    manejar_api(substr($path, 4), $metodo);
}

if ($path === '/health/php-gd') {
    header('Content-Type: application/json');
    echo json_encode([
        'php_version' => PHP_VERSION,
        'sapi' => PHP_SAPI,
        'php_ini' => php_ini_loaded_file() ?: null,
        'extension_loaded_gd' => extension_loaded('gd'),
        'imagecreatetruecolor' => function_exists('imagecreatetruecolor'),
    ]);
    exit;
}

if ($path === '/' || $path === '/app') {
    header('Location: /app/', true, 302);
    exit;
}

if (strncmp($path, '/app/', 5) === 0) {
    require dirname(__DIR__) . '/views/app.php';
    exit;
}

header('Location: /app/', true, 302);
