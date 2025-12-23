<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Load settings from database
require_once __DIR__ . '/_db.php';

try {
    $pdo = balao_get_pdo();
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Database connection failed']);
    exit;
}

// Create settings table if not exists
try {
    $pdo->exec("CREATE TABLE IF NOT EXISTS settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        `key` VARCHAR(100) UNIQUE NOT NULL,
        `value` TEXT,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )");
} catch (PDOException $e) {
    // Table might already exist, continue
}

// Get OpenAI API key from settings
$openaiApiKey = null;
try {
    $stmt = $pdo->prepare("SELECT `value` FROM settings WHERE `key` = 'openai_api_key'");
    $stmt->execute();
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    $openaiApiKey = $row ? trim($row['value']) : null;
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Failed to read settings: ' . $e->getMessage()]);
    exit;
}

if (!$openaiApiKey || $openaiApiKey === '') {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Chave OpenAI não configurada. Vá em Admin > Configurações e adicione sua chave API.']);
    exit;
}

// Get model from settings
$model = 'gpt-4o-mini';
try {
    $stmt = $pdo->prepare("SELECT `value` FROM settings WHERE `key` = 'bulk_gen_model'");
    $stmt->execute();
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if ($row && $row['value']) {
        $model = $row['value'];
    }
} catch (PDOException $e) {
    // Use default model
}

// Model costs per 1M tokens (USD)
$modelCosts = [
    'gpt-4o-mini' => ['input' => 0.15, 'output' => 0.60],
    'gpt-4o' => ['input' => 2.50, 'output' => 10.00],
    'gpt-4-turbo' => ['input' => 10.00, 'output' => 30.00],
    'gpt-3.5-turbo' => ['input' => 0.50, 'output' => 1.50],
];

$input = json_decode(file_get_contents('php://input'), true);
$products = $input['products'] ?? [];
$storeText = $input['storeText'] ?? '';

if (empty($products)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Nenhum produto fornecido']);
    exit;
}

$results = [];
$totalInputTokens = 0;
$totalOutputTokens = 0;

foreach ($products as $product) {
    $title = $product['title'] ?? '';
    
    if (empty($title)) {
        $results[] = [
            'id' => $product['id'] ?? '',
            'simpleDescription' => '',
            'fullDescription' => ''
        ];
        continue;
    }
    
    // Create prompt for AI
    $prompt = "Você é um especialista em marketing de produtos de tecnologia. 
    
Produto: $title

Gere duas descrições para este produto:

1. DESCRIÇÃO SIMPLES (1 linha curta, máximo 100 caracteres): Uma frase direta sobre o produto.

2. DESCRIÇÃO COMPLETA (2-3 linhas, máximo 300 caracteres): Uma descrição mais detalhada destacando benefícios, usos possíveis (jogos, edição, trabalho, etc).";

    if (!empty($storeText)) {
        $prompt .= " Inclua ao final: '$storeText'";
    }

    $prompt .= "

Responda EXATAMENTE neste formato JSON (sem markdown, sem código):
{\"simpleDescription\": \"texto aqui\", \"fullDescription\": \"texto aqui\"}";

    // Call OpenAI API
    $ch = curl_init('https://api.openai.com/v1/chat/completions');
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $openaiApiKey
        ],
        CURLOPT_POSTFIELDS => json_encode([
            'model' => $model,
            'messages' => [
                ['role' => 'system', 'content' => 'Você é um assistente que gera descrições de produtos. Responda sempre em JSON válido.'],
                ['role' => 'user', 'content' => $prompt]
            ],
            'max_tokens' => 500,
            'temperature' => 0.7
        ])
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);

    if ($curlError) {
        error_log("cURL error: " . $curlError);
        $results[] = [
            'id' => $product['id'] ?? '',
            'simpleDescription' => '',
            'fullDescription' => '',
            'error' => 'Connection error'
        ];
        continue;
    }

    if ($httpCode !== 200) {
        error_log("OpenAI API error ($httpCode): " . $response);
        $errorData = json_decode($response, true);
        $errorMsg = $errorData['error']['message'] ?? 'API error';
        $results[] = [
            'id' => $product['id'] ?? '',
            'simpleDescription' => '',
            'fullDescription' => '',
            'error' => $errorMsg
        ];
        continue;
    }

    $data = json_decode($response, true);
    $content = $data['choices'][0]['message']['content'] ?? '';
    
    // Track token usage
    if (isset($data['usage'])) {
        $totalInputTokens += $data['usage']['prompt_tokens'] ?? 0;
        $totalOutputTokens += $data['usage']['completion_tokens'] ?? 0;
    }
    
    // Parse JSON response
    $parsed = json_decode($content, true);
    
    if ($parsed && isset($parsed['simpleDescription']) && isset($parsed['fullDescription'])) {
        $results[] = [
            'id' => $product['id'] ?? '',
            'simpleDescription' => $parsed['simpleDescription'],
            'fullDescription' => $parsed['fullDescription']
        ];
    } else {
        // Try to extract from text if JSON parsing fails
        $results[] = [
            'id' => $product['id'] ?? '',
            'simpleDescription' => substr($title, 0, 100),
            'fullDescription' => $title . ($storeText ? ' - ' . $storeText : ''),
            'raw' => $content
        ];
    }
    
    // Small delay to avoid rate limits
    usleep(200000); // 200ms
}

// Calculate costs
$costs = $modelCosts[$model] ?? $modelCosts['gpt-4o-mini'];
$inputCostUSD = ($totalInputTokens / 1000000) * $costs['input'];
$outputCostUSD = ($totalOutputTokens / 1000000) * $costs['output'];
$totalCostUSD = $inputCostUSD + $outputCostUSD;

// Convert to BRL (approximate rate)
$usdToBrl = 5.5;
$totalCostBRL = $totalCostUSD * $usdToBrl;

// Log AI usage to database
try {
    // Create ai_usage table if not exists
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
    
    $stmt = $pdo->prepare("INSERT INTO ai_usage 
        (operation_type, model, input_tokens, output_tokens, total_tokens, cost_usd, cost_brl, items_processed)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->execute([
        'bulk_description',
        $model,
        $totalInputTokens,
        $totalOutputTokens,
        $totalInputTokens + $totalOutputTokens,
        round($totalCostUSD, 6),
        round($totalCostBRL, 4),
        count($products)
    ]);
} catch (PDOException $e) {
    // Log error but don't fail the request
    error_log("Failed to log AI usage: " . $e->getMessage());
}

echo json_encode([
    'success' => true,
    'results' => $results,
    'usage' => [
        'model' => $model,
        'inputTokens' => $totalInputTokens,
        'outputTokens' => $totalOutputTokens,
        'totalTokens' => $totalInputTokens + $totalOutputTokens,
        'costUSD' => round($totalCostUSD, 6),
        'costBRL' => round($totalCostBRL, 4)
    ]
]);