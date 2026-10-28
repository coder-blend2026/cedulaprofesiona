<?php
// Utilidades HTTP: respuestas JSON, lectura del cuerpo, validación y paginación.

class HttpError extends Exception
{
    public array $body;
    public int $status;

    public function __construct(int $status, string $message, array $extra = [])
    {
        parent::__construct($message);
        $this->status = $status;
        $this->body = ['message' => $message] + $extra;
    }
}

function json_response($data, int $status = 200): never
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function request_data(): array
{
    static $data = null;
    if ($data !== null) {
        return $data;
    }
    $data = [];
    $raw = file_get_contents('php://input');
    $type = $_SERVER['CONTENT_TYPE'] ?? '';
    if ($raw !== '' && stripos($type, 'application/json') !== false) {
        $decoded = json_decode($raw, true);
        if (is_array($decoded)) {
            $data = $decoded;
        }
    } elseif ($_POST) {
        $data = $_POST;
    }
    return $data;
}

function input(string $key, $default = null)
{
    $body = request_data();
    return $body[$key] ?? $_GET[$key] ?? $default;
}

function filled($v): bool
{
    return $v !== null && trim((string) $v) !== '';
}

/**
 * Validador mínimo. Reglas por campo: required, sometimes, nullable, string, email, min:N, max:N,
 * confirmed, unique:tabla,columna[,ignorarId], exists:tabla,columna
 * Lanza HttpError 422 con el mismo formato que usaba Laravel ({message, errors}).
 */
function validar(array $data, array $rules): array
{
    $errors = [];
    $clean = [];

    foreach ($rules as $field => $ruleList) {
        $rl = explode('|', $ruleList);
        $present = array_key_exists($field, $data);
        $value = $present ? $data[$field] : null;

        if (in_array('sometimes', $rl, true) && !$present) {
            continue;
        }
        $empty = $value === null || (is_string($value) && trim($value) === '');
        if ($empty) {
            if (in_array('required', $rl, true)) {
                $errors[$field][] = "El campo $field es obligatorio.";
            } elseif ($present) {
                $clean[$field] = null;
            }
            continue;
        }
        if (in_array('string', $rl, true) && !is_string($value)) {
            $errors[$field][] = "El campo $field debe ser texto.";
            continue;
        }
        $str = (string) $value;
        foreach ($rl as $rule) {
            [$name, $arg] = array_pad(explode(':', $rule, 2), 2, null);
            switch ($name) {
                case 'email':
                    if (!filter_var($str, FILTER_VALIDATE_EMAIL)) {
                        $errors[$field][] = "El campo $field debe ser un correo válido.";
                    }
                    break;
                case 'min':
                    if (mb_strlen($str) < (int) $arg) {
                        $errors[$field][] = "El campo $field debe tener al menos $arg caracteres.";
                    }
                    break;
                case 'max':
                    if (mb_strlen($str) > (int) $arg) {
                        $errors[$field][] = "El campo $field no debe superar $arg caracteres.";
                    }
                    break;
                case 'confirmed':
                    if (($data[$field . '_confirmation'] ?? null) !== $value) {
                        $errors[$field][] = "La confirmación de $field no coincide.";
                    }
                    break;
                case 'unique':
                    [$table, $col, $ignore] = array_pad(explode(',', $arg), 3, null);
                    $sql = "SELECT COUNT(*) FROM $table WHERE $col = ?" . ($ignore ? ' AND id <> ?' : '');
                    $stmt = db()->prepare($sql);
                    $stmt->execute($ignore ? [$str, $ignore] : [$str]);
                    if ((int) $stmt->fetchColumn() > 0) {
                        $errors[$field][] = "El valor de $field ya está registrado.";
                    }
                    break;
                case 'exists':
                    [$table, $col] = explode(',', $arg);
                    $stmt = db()->prepare("SELECT COUNT(*) FROM $table WHERE $col = ?");
                    $stmt->execute([$str]);
                    if ((int) $stmt->fetchColumn() === 0) {
                        $errors[$field][] = "El valor de $field no existe.";
                    }
                    break;
            }
        }
        $clean[$field] = $value;
    }

    if ($errors) {
        $first = reset($errors)[0];
        $extra = count($errors) > 1 ? ' (y ' . (count($errors) - 1) . ' error(es) más)' : '';
        throw new HttpError(422, $first . $extra, ['errors' => $errors]);
    }
    return $clean;
}

/** Respuesta paginada con la misma forma que el paginador de Laravel (data / links / meta). */
function paginar(string $from, string $where, array $params, string $order, callable $map, string $path): array
{
    $page = max(1, (int) ($_GET['page'] ?? 1));
    $per = PER_PAGE;

    $stmt = db()->prepare("SELECT COUNT(*) FROM $from $where");
    $stmt->execute($params);
    $total = (int) $stmt->fetchColumn();
    $last = max(1, (int) ceil($total / $per));

    $stmt = db()->prepare("SELECT * FROM $from $where ORDER BY $order LIMIT $per OFFSET " . (($page - 1) * $per));
    $stmt->execute($params);
    $rows = array_map($map, $stmt->fetchAll());

    $url = fn(int $p) => $path . '?page=' . $p;
    return [
        'data' => $rows,
        'links' => [
            'first' => $url(1),
            'last' => $url($last),
            'prev' => $page > 1 ? $url($page - 1) : null,
            'next' => $page < $last ? $url($page + 1) : null,
        ],
        'meta' => [
            'current_page' => $page,
            'from' => $rows ? ($page - 1) * $per + 1 : null,
            'last_page' => $last,
            'path' => $path,
            'per_page' => $per,
            'to' => $rows ? ($page - 1) * $per + count($rows) : null,
            'total' => $total,
        ],
    ];
}
