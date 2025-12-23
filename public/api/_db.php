<?php

declare(strict_types=1);

/**
 * Central MySQL connection helper.
 *
 * Configure on your hosting (Hostinger) via environment variables:
 * - DB_HOST (ex: localhost)
 * - DB_NAME
 * - DB_USER
 * - DB_PASSWORD
 */

function balao_env(string $key, ?string $default = null): ?string {
    $value = getenv($key);
    if ($value === false || $value === '') return $default;
    return $value;
}

function balao_get_pdo(): PDO {
    $host = balao_env('DB_HOST', 'localhost');
    $dbname = balao_env('DB_NAME');
    $username = balao_env('DB_USER');
    $password = balao_env('DB_PASSWORD');

    if (!$dbname || !$username || $password === null || $password === '') {
        throw new RuntimeException('Missing database environment variables (DB_NAME, DB_USER, DB_PASSWORD).');
    }

    $dsn = "mysql:host={$host};dbname={$dbname};charset=utf8mb4";

    return new PDO($dsn, $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
}
