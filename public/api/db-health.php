<?php
// Health-check simples do MySQL (não expõe senha)
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/_db.php';

try {
    $pdo = balao_get_pdo();
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);


    // Pequena query para validar sessão
    $stmt = $pdo->query('SELECT 1 as ok');
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'ok' => $row['ok'] ?? 1,
        'host' => $host,
        'database' => $dbname,
        'user' => $username,
        'time' => gmdate('c'),
    ]);
} catch (PDOException $e) {
    http_response_code(500);

    // Por padrão, não exponha detalhes (mais seguro)
    $payload = [
        'success' => false,
        'error' => 'Database connection failed',
        'time' => gmdate('c'),
    ];

    // Se precisar depurar: /api/db-health.php?debug=1
    if (isset($_GET['debug']) && $_GET['debug'] === '1') {
        $payload['pdo_code'] = $e->getCode();
        $payload['pdo_message'] = $e->getMessage();
    }

    echo json_encode($payload);
}
