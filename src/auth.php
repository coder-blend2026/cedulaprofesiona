<?php
// Tokens Bearer guardados en personal_access_tokens (mismo formato "id|token" que Sanctum).

function usuario_publico(array $u): array
{
    return [
        'id' => (int) $u['id'],
        'name' => $u['name'],
        'email' => $u['email'],
        'created_at' => iso($u['created_at']),
        'updated_at' => iso($u['updated_at']),
    ];
}

function crear_token(int $userId): string
{
    $plain = bin2hex(random_bytes(20));
    $now = ahora();
    $stmt = db()->prepare('INSERT INTO personal_access_tokens (tokenable_type, tokenable_id, name, token, abilities, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)');
    $stmt->execute(['App\\Models\\User', $userId, 'auth_token', hash('sha256', $plain), '["*"]', $now, $now]);
    return db()->lastInsertId() . '|' . $plain;
}

function bearer_token(): ?string
{
    $h = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
    if (!$h && function_exists('getallheaders')) {
        foreach (getallheaders() as $k => $v) {
            if (strtolower($k) === 'authorization') {
                $h = $v;
            }
        }
    }
    return preg_match('/^Bearer\s+(.+)$/i', $h, $m) ? trim($m[1]) : null;
}

/** Devuelve [usuario, idToken] o corta con 401. */
function requerir_auth(): array
{
    $token = bearer_token();
    if ($token && strpos($token, '|') !== false) {
        [$id, $plain] = explode('|', $token, 2);
        $stmt = db()->prepare('SELECT * FROM personal_access_tokens WHERE id = ?');
        $stmt->execute([(int) $id]);
        $row = $stmt->fetch();
        $vigente = $row && (!$row['expires_at'] || strtotime($row['expires_at'] . ' UTC') > time());
        if ($vigente && hash_equals($row['token'], hash('sha256', $plain))) {
            $stmt = db()->prepare('SELECT * FROM users WHERE id = ?');
            $stmt->execute([$row['tokenable_id']]);
            $user = $stmt->fetch();
            if ($user) {
                db()->prepare('UPDATE personal_access_tokens SET last_used_at = ? WHERE id = ?')->execute([ahora(), $row['id']]);
                return [$user, (int) $row['id']];
            }
        }
    }
    throw new HttpError(401, 'Unauthenticated.');
}
