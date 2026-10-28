<?php

function db(): PDO
{
    static $pdo = null;
    if ($pdo === null) {
        $isNew = !is_file(DB_PATH);
        $pdo = new PDO('sqlite:' . DB_PATH);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        $pdo->exec('PRAGMA foreign_keys = ON');
        crear_esquema($pdo);
        if ($isNew) {
            sembrar_admin($pdo);
        }
    }
    return $pdo;
}

/** Crea las tablas si no existen (compatible con la base de datos que ya tenía Laravel). */
function crear_esquema(PDO $pdo): void
{
    $pdo->exec('CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name VARCHAR NOT NULL,
        email VARCHAR NOT NULL,
        email_verified_at DATETIME,
        password VARCHAR NOT NULL,
        remember_token VARCHAR,
        created_at DATETIME,
        updated_at DATETIME
    )');
    $pdo->exec('CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique ON users (email)');

    $pdo->exec('CREATE TABLE IF NOT EXISTS personal_access_tokens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tokenable_type VARCHAR NOT NULL,
        tokenable_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        token VARCHAR NOT NULL,
        abilities TEXT,
        last_used_at DATETIME,
        expires_at DATETIME,
        created_at DATETIME,
        updated_at DATETIME
    )');
    $pdo->exec('CREATE UNIQUE INDEX IF NOT EXISTS personal_access_tokens_token_unique ON personal_access_tokens (token)');

    $pdo->exec("CREATE TABLE IF NOT EXISTS estudiantes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        cedula VARCHAR NOT NULL,
        nombre VARCHAR NOT NULL,
        primerApellido VARCHAR NOT NULL,
        segundoApellido VARCHAR,
        curp VARCHAR(32),
        genero VARCHAR NOT NULL,
        institucion VARCHAR NOT NULL,
        profesion VARCHAR NOT NULL,
        entidad VARCHAR NOT NULL,
        anioRegistro VARCHAR NOT NULL,
        seccion VARCHAR NOT NULL DEFAULT '',
        created_at DATETIME,
        updated_at DATETIME
    )");
    $pdo->exec('CREATE UNIQUE INDEX IF NOT EXISTS estudiantes_cedula_unique ON estudiantes (cedula)');
}

function sembrar_admin(PDO $pdo): void
{
    $now = ahora();
    $stmt = $pdo->prepare('INSERT OR IGNORE INTO users (name, email, password, created_at, updated_at) VALUES (?, ?, ?, ?, ?)');
    $stmt->execute(['Administrador', 'admin@example.com', password_hash('password', PASSWORD_BCRYPT, ['cost' => 12]), $now, $now]);
}

function ahora(): string
{
    return gmdate('Y-m-d H:i:s');
}

/** Fecha de la BD -> ISO 8601 (igual que devolvía Laravel). */
function iso(?string $fecha): ?string
{
    if (!$fecha) {
        return null;
    }
    $t = strtotime($fecha . ' UTC');
    return $t ? gmdate('Y-m-d\TH:i:s.000000\Z', $t) : $fecha;
}
