<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$host = 'localhost';
$dbname = 'u770915504_n8nbalao';
$username = 'u770915504_n8nbalao';
$password = 'Balao2025';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'error' => 'Database connection failed']);
    exit;
}

// Create ai_usage table if not exists
try {
    $pdo->exec("CREATE TABLE IF NOT EXISTS ai_usage (
        id INT AUTO_INCREMENT PRIMARY KEY,
        operation_type VARCHAR(50) NOT NULL,
        model VARCHAR(50) NOT NULL,
        input_tokens INT DEFAULT 0,
        output_tokens INT DEFAULT 0,
        total_tokens INT DEFAULT 0,
        cost_usd DECIMAL(10, 6) DEFAULT 0,
        cost_brl DECIMAL(10, 4) DEFAULT 0,
        items_processed INT DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");
} catch (PDOException $e) {
    // Table might already exist
}

$method = $_SERVER['REQUEST_METHOD'];

// GET - Retrieve usage statistics
if ($method === 'GET') {
    $period = $_GET['period'] ?? 'all'; // all, today, week, month
    
    $whereClause = '';
    if ($period === 'today') {
        $whereClause = "WHERE DATE(created_at) = CURDATE()";
    } else if ($period === 'week') {
        $whereClause = "WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)";
    } else if ($period === 'month') {
        $whereClause = "WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)";
    }
    
    // Get totals
    $stmt = $pdo->query("SELECT 
        COUNT(*) as total_operations,
        COALESCE(SUM(input_tokens), 0) as total_input_tokens,
        COALESCE(SUM(output_tokens), 0) as total_output_tokens,
        COALESCE(SUM(total_tokens), 0) as total_tokens,
        COALESCE(SUM(cost_usd), 0) as total_cost_usd,
        COALESCE(SUM(cost_brl), 0) as total_cost_brl,
        COALESCE(SUM(items_processed), 0) as total_items_processed
        FROM ai_usage $whereClause");
    $totals = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Get breakdown by operation type
    $stmt = $pdo->query("SELECT 
        operation_type,
        COUNT(*) as operations,
        SUM(total_tokens) as tokens,
        SUM(cost_usd) as cost_usd,
        SUM(cost_brl) as cost_brl
        FROM ai_usage $whereClause
        GROUP BY operation_type
        ORDER BY cost_brl DESC");
    $breakdown = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Get recent operations (last 10)
    $stmt = $pdo->query("SELECT * FROM ai_usage ORDER BY created_at DESC LIMIT 10");
    $recent = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'data' => [
            'totals' => $totals,
            'breakdown' => $breakdown,
            'recent' => $recent
        ]
    ]);
    exit;
}

// POST - Log new AI usage
if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    $operationType = $input['operationType'] ?? 'unknown';
    $model = $input['model'] ?? 'gpt-4o-mini';
    $inputTokens = intval($input['inputTokens'] ?? 0);
    $outputTokens = intval($input['outputTokens'] ?? 0);
    $totalTokens = intval($input['totalTokens'] ?? ($inputTokens + $outputTokens));
    $costUsd = floatval($input['costUsd'] ?? 0);
    $costBrl = floatval($input['costBrl'] ?? 0);
    $itemsProcessed = intval($input['itemsProcessed'] ?? 1);
    
    $stmt = $pdo->prepare("INSERT INTO ai_usage 
        (operation_type, model, input_tokens, output_tokens, total_tokens, cost_usd, cost_brl, items_processed)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->execute([
        $operationType,
        $model,
        $inputTokens,
        $outputTokens,
        $totalTokens,
        $costUsd,
        $costBrl,
        $itemsProcessed
    ]);
    
    echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
    exit;
}

echo json_encode(['success' => false, 'error' => 'Method not allowed']);
