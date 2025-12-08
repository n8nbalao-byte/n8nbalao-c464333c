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

// Get OpenAI API key from settings
$stmt = $pdo->prepare("SELECT value FROM settings WHERE `key` = 'openai_api_key'");
$stmt->execute();
$row = $stmt->fetch(PDO::FETCH_ASSOC);
$openaiApiKey = $row ? $row['value'] : null;

if (!$openaiApiKey) {
    echo json_encode(['success' => false, 'error' => 'OpenAI API key not configured. Go to Admin > Settings to add it.']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$products = $input['products'] ?? [];
$storeText = $input['storeText'] ?? '';

if (empty($products)) {
    echo json_encode(['success' => false, 'error' => 'No products provided']);
    exit;
}

$results = [];

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
            'model' => 'gpt-4o-mini',
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
    curl_close($ch);

    if ($httpCode !== 200) {
        error_log("OpenAI API error: " . $response);
        $results[] = [
            'id' => $product['id'] ?? '',
            'simpleDescription' => '',
            'fullDescription' => '',
            'error' => 'API error'
        ];
        continue;
    }

    $data = json_decode($response, true);
    $content = $data['choices'][0]['message']['content'] ?? '';
    
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

echo json_encode([
    'success' => true,
    'results' => $results
]);
