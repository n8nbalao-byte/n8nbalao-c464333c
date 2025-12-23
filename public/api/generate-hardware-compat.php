<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Database connection
require_once __DIR__ . '/_db.php';

try {
    $pdo = balao_get_pdo();
} catch (Throwable $e) {
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

- processor: { socket: 'LGA1700' | 'LGA1200' | 'LGA1151' | 'LGA1150' | 'LGA1155' | 'LGA775' | 'AM5' | 'AM4' | 'AM3+' | 'AM3' | 'AM2+' | 'AM2' }
- motherboard: { socket: mesmos valores, memoryType: 'DDR5' | 'DDR4' | 'DDR3' | 'DDR2' | 'Optane', formFactor: 'ATX' | 'Micro-ATX' | 'Mini-ITX' | 'E-ATX' }
- memory: { memoryType: 'DDR5' | 'DDR4' | 'DDR3' | 'DDR2' | 'Optane' }
- storage: { formFactor: 'NVMe' | 'SATA' | 'HDD' | 'Optane' }
- gpu: { tdp: número estimado em watts baseado no modelo (ex: RTX 4090 = 450, RTX 4080 = 320, RTX 4070 = 200, RTX 3080 = 320, RX 7900 = 355) }
- psu: { tdp: número em watts extraído do nome (ex: 500, 650, 750, 850, 1000) }
- cooler: { socket: 'Universal' | 'LGA1700' | 'AM5' | 'AM4' etc, formFactor: 'Air Cooler' | '120mm' | '140mm' | '240mm' | '280mm' | '360mm' | '420mm' }
- case: { formFactor: 'Mini-ITX' | 'Micro-ATX' | 'ATX' | 'Full Tower' | 'E-ATX' }

Regras de detecção para MEMÓRIA:
- DDR5: procurar 'DDR5' no nome, frequências 4800MHz+, geralmente para LGA1700/AM5
- DDR4: procurar 'DDR4' no nome, frequências 2133-4800MHz, para LGA1200/AM4
- DDR3: procurar 'DDR3' no nome, frequências 800-2133MHz, para sistemas mais antigos
- DDR2: procurar 'DDR2' no nome, frequências 400-1066MHz, sistemas legado
- Optane: memória Intel Optane, módulos de cache/aceleração

Regras de detecção para PROCESSADORES:
- Intel Core 12ª/13ª/14ª Gen = LGA1700
- Intel Core 10ª/11ª Gen = LGA1200
- Intel Core 6ª/7ª/8ª/9ª Gen = LGA1151
- Intel Core 4ª/5ª Gen = LGA1150
- Intel Core 2ª/3ª Gen = LGA1155
- Intel Core 2 Duo/Quad, Pentium E = LGA775
- AMD Ryzen 7000+ = AM5
- AMD Ryzen 1000-5000 = AM4
- AMD FX = AM3+
- AMD Phenom II = AM3
- AMD Athlon 64 X2 = AM2

Regras de detecção para PLACAS-MÃE:
- Placas B760/Z790/H770 = LGA1700 + DDR5 ou DDR4
- Placas B550/X570 = AM4 + DDR4
- Placas B650/X670 = AM5 + DDR5
- Placas H61/B75/H77/Z77 = LGA1155 + DDR3
- Placas H81/B85/H97/Z97 = LGA1150 + DDR3
- Placas com suporte a Optane mencionado = pode usar memória Optane

Regras gerais:
- Gabinete Mid Tower = ATX geralmente
- Gabinete Full Tower = pode ser E-ATX
- Gabinete Compact/SFF = Mini-ITX ou Micro-ATX
- Water Cooler 240mm/280mm/360mm = pegar tamanho do nome
- Air Cooler sem menção de radiador = Air Cooler
- GPU TDP estimado: RTX 4090=450W, RTX 4080=320W, RTX 4070 Ti=285W, RTX 4070=200W, RTX 4060 Ti=165W, RTX 4060=115W
- GPU TDP estimado: RTX 3090=350W, RTX 3080=320W, RTX 3070=220W, RTX 3060=170W
- GPU TDP estimado: RX 7900 XTX=355W, RX 7900 XT=315W, RX 7800 XT=263W, RX 7600=165W

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

$userPrompt = "Analise estes produtos de hardware e retorne a compatibilidade em um array JSON. IMPORTANTE: Cada objeto do array DEVE incluir o campo 'index' correspondente ao índice do produto original.\n\nProdutos:\n" . json_encode($itemsForPrompt, JSON_UNESCAPED_UNICODE) . "\n\nRetorne APENAS o array JSON com os campos de compatibilidade para cada item, incluindo sempre o campo 'index'.";

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

// Log AI usage
try {
    $stmt = $pdo->prepare("INSERT INTO ai_usage 
        (operation_type, model, input_tokens, output_tokens, total_tokens, cost_usd, cost_brl, items_processed)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->execute([
        'hardware_compatibility',
        $model,
        $inputTokens,
        $outputTokens,
        $totalTokens,
        $costUSD,
        $costBRL,
        count($compatibilityData)
    ]);
} catch (Exception $e) {
    // Silently fail - don't break the main functionality
}

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
