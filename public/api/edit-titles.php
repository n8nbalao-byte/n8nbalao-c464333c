<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Database connection
$host = 'localhost';
$dbname = 'u770915504_n8nbalao';
$username = 'u770915504_n8nbalao';
$password = 'Balao2025';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'error' => 'Database connection failed: ' . $e->getMessage()]);
    exit;
}

// Get OpenAI API key from settings
$stmt = $pdo->query("SELECT value FROM settings WHERE `key` = 'openai_api_key'");
$row = $stmt->fetch(PDO::FETCH_ASSOC);
$apiKey = $row ? $row['value'] : '';

if (empty($apiKey)) {
    echo json_encode(['success' => false, 'error' => 'OpenAI API key not configured']);
    exit;
}

// Get model from settings
$stmt = $pdo->query("SELECT value FROM settings WHERE `key` = 'bulk_gen_model'");
$row = $stmt->fetch(PDO::FETCH_ASSOC);
$model = $row && $row['value'] ? $row['value'] : 'gpt-4o-mini';

// Cost per 1M tokens (USD)
$modelCosts = [
    'gpt-4o-mini' => ['input' => 0.15, 'output' => 0.60],
    'gpt-4o' => ['input' => 2.50, 'output' => 10.00],
    'gpt-4-turbo' => ['input' => 10.00, 'output' => 30.00],
    'gpt-3.5-turbo' => ['input' => 0.50, 'output' => 1.50],
];

// Get request data
$input = json_decode(file_get_contents('php://input'), true);
$products = $input['products'] ?? [];

if (empty($products)) {
    echo json_encode(['success' => false, 'error' => 'No products provided']);
    exit;
}

$results = [];
$totalInputTokens = 0;
$totalOutputTokens = 0;

// Build prompt with all products
$productList = "";
foreach ($products as $index => $product) {
    $productList .= ($index + 1) . ". ID: " . $product['id'] . " | Título: " . $product['title'] . "\n";
}

$systemPrompt = "Você é um especialista em e-commerce brasileiro. Sua tarefa é simplificar e limpar títulos de produtos para ficarem mais legíveis e profissionais.

Regras:
1. Remova palavras desnecessárias como 'promoção', 'oferta', 'imperdível', 'melhor preço'
2. Remova códigos de SKU ou referências internas no início ou fim
3. Mantenha as especificações técnicas importantes (capacidade, tamanho, versão)
4. Padronize o formato: Marca + Produto + Especificações principais
5. Use capitalização correta (Title Case para marcas, lowercase para conectores)
6. Remova caracteres especiais desnecessários como |, -, / no início ou fim
7. Limite o título a no máximo 80 caracteres quando possível
8. Mantenha a essência do produto - não altere informações técnicas

Responda em formato JSON com array de objetos: [{\"id\": \"...\", \"newTitle\": \"...\"}]";

$userPrompt = "Simplifique os seguintes títulos de produtos:\n\n" . $productList . "\n\nResponda apenas com o JSON, sem explicações.";

// Call OpenAI API
$ch = curl_init('https://api.openai.com/v1/chat/completions');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Authorization: Bearer ' . $apiKey
]);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
    'model' => $model,
    'messages' => [
        ['role' => 'system', 'content' => $systemPrompt],
        ['role' => 'user', 'content' => $userPrompt]
    ],
    'temperature' => 0.3,
    'max_tokens' => 4000
]));

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode !== 200) {
    echo json_encode(['success' => false, 'error' => 'OpenAI API error: ' . $httpCode]);
    exit;
}

$responseData = json_decode($response, true);

if (!isset($responseData['choices'][0]['message']['content'])) {
    echo json_encode(['success' => false, 'error' => 'Invalid API response']);
    exit;
}

// Parse the response
$content = $responseData['choices'][0]['message']['content'];

// Extract JSON from response (handle markdown code blocks)
$content = preg_replace('/```json\s*/', '', $content);
$content = preg_replace('/```\s*/', '', $content);
$content = trim($content);

$editedTitles = json_decode($content, true);

if (!is_array($editedTitles)) {
    // Try to extract array if wrapped
    if (preg_match('/\[.*\]/s', $content, $matches)) {
        $editedTitles = json_decode($matches[0], true);
    }
}

if (is_array($editedTitles)) {
    $results = $editedTitles;
}

// Get token usage
$totalInputTokens = $responseData['usage']['prompt_tokens'] ?? 0;
$totalOutputTokens = $responseData['usage']['completion_tokens'] ?? 0;

// Calculate cost
$costs = $modelCosts[$model] ?? $modelCosts['gpt-4o-mini'];
$costUSD = ($totalInputTokens * $costs['input'] / 1000000) + ($totalOutputTokens * $costs['output'] / 1000000);
$costBRL = $costUSD * 5.0; // Approximate exchange rate

// Log usage to database
try {
    $pdo->exec("CREATE TABLE IF NOT EXISTS ai_usage (
        id INT AUTO_INCREMENT PRIMARY KEY,
        operation VARCHAR(50),
        model VARCHAR(50),
        input_tokens INT,
        output_tokens INT,
        total_tokens INT,
        cost_usd DECIMAL(10,6),
        cost_brl DECIMAL(10,6),
        items_processed INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");
    
    $stmt = $pdo->prepare("INSERT INTO ai_usage (operation, model, input_tokens, output_tokens, total_tokens, cost_usd, cost_brl, items_processed) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->execute(['edit_titles', $model, $totalInputTokens, $totalOutputTokens, $totalInputTokens + $totalOutputTokens, $costUSD, $costBRL, count($products)]);
} catch (Exception $e) {
    // Ignore logging errors
}

echo json_encode([
    'success' => true,
    'results' => $results,
    'usage' => [
        'model' => $model,
        'inputTokens' => $totalInputTokens,
        'outputTokens' => $totalOutputTokens,
        'totalTokens' => $totalInputTokens + $totalOutputTokens,
        'costUSD' => $costUSD,
        'costBRL' => $costBRL
    ]
]);
