<?php
// Autocarga PSR-4 de las librerías PHP incluidas en /lib (solo se usan para generar el PDF).

require_once __DIR__ . '/../lib/dompdf/lib/Cpdf.php';

spl_autoload_register(function (string $class): void {
    static $map = [
        'Dompdf\\' => '/../lib/dompdf/src/',
        'FontLib\\' => '/../lib/php-font-lib/src/FontLib/',
        'Svg\\' => '/../lib/php-svg-lib/src/Svg/',
        'Masterminds\\' => '/../lib/html5/src/',
        'Sabberworm\\CSS\\' => '/../lib/css-parser/src/',
    ];
    foreach ($map as $prefix => $dir) {
        if (strncmp($class, $prefix, strlen($prefix)) === 0) {
            $file = __DIR__ . $dir . str_replace('\\', '/', substr($class, strlen($prefix))) . '.php';
            if (is_file($file)) {
                require $file;
            }
            return;
        }
    }
});
