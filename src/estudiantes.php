<?php
// Lógica de estudiantes (consulta pública y CRUD protegido).

const CAMPOS_ESTUDIANTE = [
    'cedula', 'nombre', 'primerApellido', 'segundoApellido', 'curp', 'genero',
    'institucion', 'profesion', 'entidad', 'anioRegistro', 'seccion',
];

function estudiante_publico(array $e): array
{
    $out = ['id' => (int) $e['id']];
    foreach (CAMPOS_ESTUDIANTE as $c) {
        $out[$c] = $e[$c];
    }
    $out['created_at'] = iso($e['created_at']);
    $out['updated_at'] = iso($e['updated_at']);
    return $out;
}

function buscar_estudiante(string $id): array
{
    $stmt = db()->prepare('SELECT * FROM estudiantes WHERE id = ?');
    $stmt->execute([(int) $id]);
    $e = $stmt->fetch();
    if (!$e) {
        throw new HttpError(404, 'No query results for model [Estudiante].');
    }
    return $e;
}

/** Filtros del listado: seccion, search (varias columnas) y nombre/apellidos/curp. */
function listado_estudiantes(string $path): array
{
    $where = [];
    $params = [];

    if (filled($_GET['seccion'] ?? null)) {
        $where[] = 'seccion = ?';
        $params[] = $_GET['seccion'];
    }

    if (filled($_GET['search'] ?? null)) {
        $like = '%' . $_GET['search'] . '%';
        $cols = ['nombre', 'primerApellido', 'segundoApellido', 'cedula', 'curp', 'profesion', 'institucion', 'entidad', 'anioRegistro', 'seccion'];
        $where[] = '(' . implode(' OR ', array_map(fn($c) => "$c LIKE ?", $cols)) . ')';
        array_push($params, ...array_fill(0, count($cols), $like));
    }

    foreach (['nombre', 'primerApellido', 'segundoApellido', 'curp'] as $campo) {
        if (filled($_GET[$campo] ?? null)) {
            $where[] = "$campo LIKE ?";
            $params[] = '%' . $_GET[$campo] . '%';
        }
    }

    $sql = $where ? 'WHERE ' . implode(' AND ', $where) : '';
    return paginar('estudiantes', $sql, $params, 'id ASC', 'estudiante_publico', $path);
}

function reglas_estudiante(bool $parcial, ?string $ignorarId = null): array
{
    $req = $parcial ? 'sometimes|required|string' : 'required|string';
    return [
        'cedula' => $req . '|unique:estudiantes,cedula' . ($ignorarId ? ",$ignorarId" : ''),
        'nombre' => $req,
        'primerApellido' => $req,
        'segundoApellido' => 'nullable|string',
        'curp' => 'nullable|string|max:32',
        'genero' => $req,
        'institucion' => $req,
        'profesion' => $req,
        'entidad' => $req,
        'anioRegistro' => $req,
        'seccion' => 'nullable|string|max:255',
    ];
}

function crear_estudiante(): array
{
    $data = validar(request_data(), reglas_estudiante(false));
    $data['seccion'] = $data['seccion'] ?? '';
    $now = ahora();

    $cols = [];
    $vals = [];
    foreach (CAMPOS_ESTUDIANTE as $c) {
        $cols[] = $c;
        $vals[] = $data[$c] ?? null;
    }
    $cols[] = 'created_at';
    $cols[] = 'updated_at';
    array_push($vals, $now, $now);

    $stmt = db()->prepare('INSERT INTO estudiantes (' . implode(',', $cols) . ') VALUES (' . implode(',', array_fill(0, count($cols), '?')) . ')');
    $stmt->execute($vals);
    return estudiante_publico(buscar_estudiante((string) db()->lastInsertId()));
}

function actualizar_estudiante(string $id): array
{
    $actual = buscar_estudiante($id);
    $data = validar(request_data(), reglas_estudiante(true, (string) $actual['id']));
    if ($data) {
        $sets = [];
        $vals = [];
        foreach ($data as $campo => $valor) {
            $sets[] = "$campo = ?";
            $vals[] = $valor;
        }
        $sets[] = 'updated_at = ?';
        $vals[] = ahora();
        $vals[] = $actual['id'];
        db()->prepare('UPDATE estudiantes SET ' . implode(', ', $sets) . ' WHERE id = ?')->execute($vals);
    }
    return estudiante_publico(buscar_estudiante($id));
}

function eliminar_estudiante(string $id): array
{
    $e = buscar_estudiante($id);
    db()->prepare('DELETE FROM estudiantes WHERE id = ?')->execute([$e['id']]);
    return ['message' => 'Estudiante deleted'];
}
