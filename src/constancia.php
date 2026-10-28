<?php
// Generación del PDF de la Constancia de Situación Profesional.

use Dompdf\Dompdf;
use Dompdf\Options;

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

function h($v): string
{
    return htmlspecialchars((string) $v, ENT_QUOTES, 'UTF-8');
}

/** "jueves 19 de marzo de 2026" */
function fecha_larga(?int $ts = null): string
{
    $ts ??= time();
    return DIAS[(int) date('w', $ts)] . ' ' . date('j', $ts) . ' de ' . MESES[(int) date('n', $ts) - 1] . ' de ' . date('Y', $ts);
}

/** Fechas tipo 17/02/1997 si viene como YYYY-MM-DD */
function formatear_fecha_constancia(?string $raw): string
{
    $s = trim((string) $raw);
    if ($s === '') {
        return '—';
    }
    if (preg_match('/^(\d{4})-(\d{2})-(\d{2})/', $s, $m)) {
        return "{$m[3]}/{$m[2]}/{$m[1]}";
    }
    return $s;
}

function cadena_original(array $e): string
{
    $esc = static fn($v): string => str_replace('|', '/', trim((string) $v));
    return '||CEDULA|' . $esc($e['nombre']) . '|' . $esc($e['primerApellido']) . '|' . $esc($e['segundoApellido']) . '|'
        . $esc($e['institucion']) . '|' . $esc($e['profesion']) . '|' . $esc($e['anioRegistro']) . '|' . $esc($e['cedula']) . '|'
        . $esc($e['entidad']) . '|' . $esc($e['genero']) . '||';
}

function nombre_pdf_seguro(array $e): string
{
    $raw = 'CONSTANCIA_' . $e['nombre'] . '_' . $e['primerApellido'] . '_' . $e['cedula'];
    $safe = str_replace(['\\', '/', ':', '*', '?', '"', '<', '>', '|'], ' ', $raw);
    return trim(preg_replace('/\s+/u', ' ', $safe)) . '.pdf';
}

/** Incrusta el QR en el PDF sin depender de imágenes remotas dentro de Dompdf. */
function qr_como_data_url(string $url): ?string
{
    $bin = false;
    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 8, CURLOPT_FOLLOWLOCATION => true]);
        $bin = curl_exec($ch);
        curl_close($ch);
    } elseif (ini_get('allow_url_fopen')) {
        $bin = @file_get_contents($url, false, stream_context_create(['http' => ['timeout' => 8]]));
    }
    return $bin ? 'data:image/png;base64,' . base64_encode($bin) : null;
}

function descargar_constancia(): never
{
    if (!function_exists('imagecreatetruecolor')) {
        throw new HttpError(500, 'Dompdf requiere la extensión PHP GD (imagecreatetruecolor). Activa extension=gd en el php.ini. Comprueba la ruta GET /health/php-gd.', [
            'php_ini' => php_ini_loaded_file() ?: '(ninguno)',
            'sapi' => PHP_SAPI,
        ]);
    }

    $data = validar($_GET, ['cedula' => 'required|string|max:128']);
    $stmt = db()->prepare('SELECT * FROM estudiantes WHERE cedula = ?');
    $stmt->execute([$data['cedula']]);
    $e = $stmt->fetch();
    if (!$e) {
        throw new HttpError(404, 'No se encontró la cédula.');
    }

    $bgFile = BASE_PATH . '/public/background-pdf.png';
    if (!is_file($bgFile)) {
        throw new HttpError(500, 'Fondo PDF no configurado (public/background-pdf.png).');
    }

    require_once __DIR__ . '/autoload.php';

    $bg = 'data:image/png;base64,' . base64_encode(file_get_contents($bgFile));
    $verifyUrl = FRONTEND_URL . '/app/cedulas-profesionales/busqueda?cedula=' . rawurlencode($e['cedula']);
    $qrUrl = 'https://quickchart.io/qr?text=' . rawurlencode($verifyUrl) . '&size=200&margin=2';
    $v = [
        'e' => $e,
        'bg' => $bg,
        'qrSrc' => qr_como_data_url($qrUrl) ?? $qrUrl,
        'fechaTitulacion' => formatear_fecha_constancia($e['anioRegistro'] ?? ''),
        'cadena' => cadena_original($e),
        'fechaActual' => fecha_larga(),
    ];
    $v['fechaExpedicion'] = $v['fechaTitulacion'];

    ob_start();
    (static function (array $vars): void {
        extract($vars);
        require BASE_PATH . '/views/constancia.php';
    })($v);
    $html = ob_get_clean();

    $cache = BASE_PATH . '/storage/cache';
    if (!is_dir($cache)) {
        mkdir($cache, 0775, true);
    }
    $options = new Options();
    $options->set('defaultFont', 'Helvetica');
    $options->set('isRemoteEnabled', false);
    $options->set('fontDir', $cache);
    $options->set('fontCache', $cache);
    $options->set('tempDir', $cache);
    $options->set('chroot', BASE_PATH);

    $dompdf = new Dompdf($options);
    $dompdf->loadHtml($html, 'UTF-8');
    $dompdf->setPaper('letter', 'portrait');
    $dompdf->render();

    $nombre = nombre_pdf_seguro($e);
    header('Content-Type: application/pdf');
    header('Content-Disposition: attachment; filename="' . preg_replace('/[^\x20-\x7e]/', '_', $nombre) . '"; filename*=UTF-8\'\'' . rawurlencode($nombre));
    echo $dompdf->output();
    exit;
}
