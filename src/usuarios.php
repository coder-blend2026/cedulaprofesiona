<?php
// Autenticación y CRUD de usuarios.

function hash_password(string $p): string
{
    return password_hash($p, PASSWORD_BCRYPT, ['cost' => 12]);
}

function buscar_usuario(string $id): array
{
    $stmt = db()->prepare('SELECT * FROM users WHERE id = ?');
    $stmt->execute([(int) $id]);
    $u = $stmt->fetch();
    if (!$u) {
        throw new HttpError(404, 'No query results for model [User].');
    }
    return $u;
}

function respuesta_token(array $user, int $status): never
{
    json_response([
        'access_token' => crear_token((int) $user['id']),
        'token_type' => 'Bearer',
        'user' => usuario_publico($user),
    ], $status);
}

function login(): never
{
    $data = validar(request_data(), [
        'email' => 'required|email|exists:users,email',
        'password' => 'required|string',
    ]);
    $stmt = db()->prepare('SELECT * FROM users WHERE email = ?');
    $stmt->execute([$data['email']]);
    $user = $stmt->fetch();
    if (!$user || !password_verify($data['password'], $user['password'])) {
        throw new HttpError(422, 'Las credenciales proporcionadas son incorrectas.', [
            'errors' => ['email' => ['Las credenciales proporcionadas son incorrectas.']],
        ]);
    }
    respuesta_token($user, 200);
}

function registrar(): never
{
    $data = validar(request_data(), [
        'name' => 'required|string|max:255',
        'email' => 'required|email|unique:users,email',
        'password' => 'required|string|min:6|confirmed',
    ]);
    $now = ahora();
    db()->prepare('INSERT INTO users (name, email, password, created_at, updated_at) VALUES (?, ?, ?, ?, ?)')
        ->execute([$data['name'], $data['email'], hash_password($data['password']), $now, $now]);
    respuesta_token(buscar_usuario((string) db()->lastInsertId()), 201);
}

function logout(int $tokenId): never
{
    db()->prepare('DELETE FROM personal_access_tokens WHERE id = ?')->execute([$tokenId]);
    json_response(['message' => 'Logged out']);
}

function listar_usuarios(): array
{
    return ['data' => array_map('usuario_publico', db()->query('SELECT * FROM users ORDER BY id')->fetchAll())];
}

function crear_usuario(): array
{
    $data = validar(request_data(), [
        'name' => 'required|string|max:255',
        'email' => 'required|email|unique:users,email',
        'password' => 'required|string|min:6',
    ]);
    $now = ahora();
    db()->prepare('INSERT INTO users (name, email, password, created_at, updated_at) VALUES (?, ?, ?, ?, ?)')
        ->execute([$data['name'], $data['email'], hash_password($data['password']), $now, $now]);
    return ['data' => usuario_publico(buscar_usuario((string) db()->lastInsertId()))];
}

function actualizar_usuario(string $id): array
{
    $user = buscar_usuario($id);
    $data = validar(request_data(), [
        'name' => 'sometimes|required|string|max:255',
        'email' => 'sometimes|required|email|unique:users,email,' . $user['id'],
        'password' => 'nullable|string|min:6',
    ]);
    if (empty($data['password'])) {
        unset($data['password']);
    } else {
        $data['password'] = hash_password($data['password']);
    }
    if ($data) {
        $sets = [];
        $vals = [];
        foreach ($data as $campo => $valor) {
            $sets[] = "$campo = ?";
            $vals[] = $valor;
        }
        $sets[] = 'updated_at = ?';
        $vals[] = ahora();
        $vals[] = $user['id'];
        db()->prepare('UPDATE users SET ' . implode(', ', $sets) . ' WHERE id = ?')->execute($vals);
    }
    return ['data' => usuario_publico(buscar_usuario($id))];
}

function eliminar_usuario(string $id): array
{
    $user = buscar_usuario($id);
    db()->prepare('DELETE FROM personal_access_tokens WHERE tokenable_id = ?')->execute([$user['id']]);
    db()->prepare('DELETE FROM users WHERE id = ?')->execute([$user['id']]);
    return ['message' => 'User deleted'];
}
