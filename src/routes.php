<?php
// Tabla de rutas de la API (prefijo /api).

function manejar_api(string $ruta, string $metodo): never
{
    try {
        $ruta = trim($ruta, '/');
        $partes = $ruta === '' ? [] : explode('/', $ruta);
        $recurso = $partes[0] ?? '';
        $id = $partes[1] ?? null;
        $path = rtrim(app_origin(), '/') . '/api/' . $ruta;

        // Rutas públicas
        if ($metodo === 'POST' && $ruta === 'login') {
            login();
        }
        if ($metodo === 'POST' && $ruta === 'register') {
            registrar();
        }
        if ($metodo === 'GET' && $ruta === 'public/estudiantes') {
            json_response(listado_estudiantes($path));
        }
        if ($metodo === 'GET' && $ruta === 'public/constancia-pdf') {
            descargar_constancia();
        }

        // Rutas protegidas
        [$user, $tokenId] = requerir_auth();

        if ($metodo === 'GET' && $ruta === 'user') {
            json_response(['data' => usuario_publico($user)]);
        }
        if ($metodo === 'POST' && $ruta === 'logout') {
            logout($tokenId);
        }

        if ($recurso === 'users' && count($partes) <= 2) {
            switch (true) {
                case $metodo === 'GET' && $id === null:
                    json_response(listar_usuarios());
                case $metodo === 'POST' && $id === null:
                    json_response(crear_usuario(), 201);
                case $metodo === 'GET':
                    json_response(['data' => usuario_publico(buscar_usuario($id))]);
                case in_array($metodo, ['PUT', 'PATCH'], true) && $id !== null:
                    json_response(actualizar_usuario($id));
                case $metodo === 'DELETE' && $id !== null:
                    json_response(eliminar_usuario($id));
            }
        }

        if ($recurso === 'estudiantes' && count($partes) <= 2) {
            switch (true) {
                case $metodo === 'GET' && $id === null:
                    json_response(listado_estudiantes($path));
                case $metodo === 'POST' && $id === null:
                    json_response(['data' => crear_estudiante()], 201);
                case $metodo === 'GET':
                    json_response(['data' => estudiante_publico(buscar_estudiante($id))]);
                case in_array($metodo, ['PUT', 'PATCH'], true) && $id !== null:
                    json_response(['data' => actualizar_estudiante($id)]);
                case $metodo === 'DELETE' && $id !== null:
                    json_response(eliminar_estudiante($id));
            }
        }

        throw new HttpError(404, 'Ruta no encontrada.');
    } catch (HttpError $e) {
        json_response($e->body, $e->status);
    } catch (Throwable $e) {
        error_log('[sitio] ' . $e->getMessage() . ' en ' . $e->getFile() . ':' . $e->getLine());
        json_response(['message' => APP_DEBUG ? $e->getMessage() : 'Error interno del servidor.'], 500);
    }
}

function app_origin(): string
{
    $https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https';
    return ($https ? 'https' : 'http') . '://' . ($_SERVER['HTTP_HOST'] ?? 'localhost');
}
