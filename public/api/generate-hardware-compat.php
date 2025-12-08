<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
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
    echo json_encode(['success' => false, 'error' => 'Database connection failed']);
    exit;
}

// Get OpenAI API key from settings
$stmt = $pdo->prepare("SELECT `value` FROM settings WHERE `key` = 'openai_api_key'");
$stmt->execute();
$apiKeyRow = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$apiKeyRow || empty($apiKeyRow['value'])) {
    echo json_encode(['success' => false, 'error' => 'OpenAI API key not configured']);
    exit;
}

$openaiApiKey = $apiKeyRow['value'];

// Get model from settings (default to gpt-4o-mini)
$stmt = $pdo->prepare("SELECT `value` FROM settings WHERE `key` = 'bulk_gen_model'");
$stmt->execute();
$modelRow = $stmt->fetch(PDO::FETCH_ASSOC);
$model = $modelRow && !empty($modelRow['value']) ? $modelRow['value'] : 'gpt-4o-mini';

$input = json_decode(file_get_contents('php://input'), true);

if (!$input || !isset($input['items']) || !is_array($input['items'])) {
    echo json_encode(['success' => false, 'error' => 'Missing items array']);
    exit;
}

$items = $input['items'];

// Build prompt for batch processing
$systemPrompt = "Você é um especialista em hardware de computadores. Analise os nomes dos produtos de hardware e extraia informações de compatibilidade.

Para cada item, retorne um objeto JSON com os campos relevantes baseado na categoria:

- processor: { socket: 'LGA1700' | 'LGA1200' | 'LGA1151' | 'LGA1150' | 'LGA1155' | 'AM5' | 'AM4' | 'AM3+' }
- motherboard: { socket: mesmos valores, memoryType: 'DDR5' | 'DDR4' | 'DDR3', formFactor: 'ATX' | 'Micro-ATX' | 'Mini-ITX' | 'E-ATX' }
- memory: { memoryType: 'DDR5' | 'DDR4' | 'DDR3' }
- storage: { formFactor: 'NVMe' | 'SATA' | 'HDD' }
- gpu: {} (sem campos específicos)
- psu: { tdp: número em watts (ex: 500, 650, 750) }
- cooler: { socket: valores de socket ou 'Universal' }
- case: { formFactor: 'ATX' | 'Micro-ATX' | 'Mini-ITX' | 'Full Tower' }

Regras de detecção:
- Intel Core 12ª/13ª/14ª Gen = LGA1700
- Intel Core 10ª/11ª Gen = LGA1200
- Intel Core 6ª/7ª/8ª/9ª Gen = LGA1151
- AMD Ryzen 7000+ = AM5
- AMD Ryzen 1000-5000 = AM4
- DDR5 geralmente vai com LGA1700/AM5
- DDR4 geralmente vai com LGA1200/AM4 e anteriores
- Placas B760/Z790/H770 = LGA1700 + DDR5 ou DDR4
- Placas B550/X570 = AM4 + DDR4
- Placas B650/X670 = AM5 + DDR5

Se não conseguir determinar um campo, omita-o do resultado.

Responda APENAS com um array JSON válido, sem explicações.";

$itemsForPrompt = [];
foreach ($items as $index => $item) {
    $itemsForPrompt[] = [
        'index' => $index,
        'title' => $item['title'] ?? '',
        'category' => $item['category'] ?? ''
    ];
}

$userPrompt = "Analise estes produtos de hardware e retorne a compatibilidade:\n\n" . json_encode($itemsForPrompt, JSON_UNESCAPED_UNICODE);

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
            ['role' => 'system', 'content' => $systemPrompt],
            ['role' => 'user', 'content' => $userPrompt]
        ],
        'temperature' => 0.3,
        'max_tokens' => 4000
    ])
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode !== 200) {
    echo json_encode(['success' => false, 'error' => 'OpenAI API error: ' . $httpCode, 'response' => $response]);
    exit;
}

$responseData = json_decode($response, true);

if (!isset($responseData['choices'][0]['message']['content'])) {
    echo json_encode(['success' => false, 'error' => 'Invalid OpenAI response']);
    exit;
}

$content = $responseData['choices'][0]['message']['content'];

// Extract JSON from response (handle markdown code blocks)
$content = preg_replace('/^```json\s*/i', '', $content);
$content = preg_replace('/\s*```$/i', '', $content);
$content = trim($content);

$compatibilityData = json_decode($content, true);

if (!is_array($compatibilityData)) {
    echo json_encode(['success' => false, 'error' => 'Failed to parse AI response', 'raw' => $content]);
    exit;
}

// Calculate token usage
$inputTokens = $responseData['usage']['prompt_tokens'] ?? 0;
$outputTokens = $responseData['usage']['completion_tokens'] ?? 0;
$totalTokens = $responseData['usage']['total_tokens'] ?? 0;

// Cost calculation (approximate)
$costPerInputToken = 0.00015 / 1000; // gpt-4o-mini input
$costPerOutputToken = 0.0006 / 1000; // gpt-4o-mini output
$costUSD = ($inputTokens * $costPerInputToken) + ($outputTokens * $costPerOutputToken);
$costBRL = $costUSD * 5.5; // approximate exchange rate

echo json_encode([
    'success' => true,
    'compatibility' => $compatibilityData,
    'usage' => [
        'model' => $model,
        'inputTokens' => $inputTokens,
        'outputTokens' => $outputTokens,
        'totalTokens' => $totalTokens,
        'costUSD' => $costUSD,
        'costBRL' => $costBRL
    ]
]);
