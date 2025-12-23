<?php
// AI Product Classification Endpoint with Category/Subcategory Creation
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
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

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$products = $input['products'] ?? [];
$categories = $input['categories'] ?? [];
$allowNewCategories = $input['allowNewCategories'] ?? false;
$detectCompatibility = $input['detectCompatibility'] ?? false;

if (empty($products) || empty($categories)) {
    echo json_encode(['success' => false, 'error' => 'Products and categories are required']);
    exit;
}

// Get OpenAI API key from settings
$stmt = $pdo->prepare("SELECT `value` FROM settings WHERE `key` = 'openai_api_key'");
$stmt->execute();
$apiKeyRow = $stmt->fetch(PDO::FETCH_ASSOC);
$apiKey = $apiKeyRow['value'] ?? '';

if (empty($apiKey)) {
    echo json_encode(['success' => false, 'error' => 'OpenAI API key not configured']);
    exit;
}

// Get model from settings
$stmt = $pdo->prepare("SELECT `value` FROM settings WHERE `key` = 'bulk_gen_model'");
$stmt->execute();
$modelRow = $stmt->fetch(PDO::FETCH_ASSOC);
$model = $modelRow['value'] ?? 'gpt-4o-mini';

// Build category list with subcategories
$categoryList = [];
foreach ($categories as $cat) {
    $categoryList[] = [
        'key' => $cat['key'],
        'label' => $cat['label'],
        'parentKey' => $cat['parentKey'] ?? null,
        'subcategories' => $cat['subcategories'] ?? []
    ];
}

// Build prompt
$systemPrompt = "Você é um especialista em classificação de produtos de tecnologia, informática, eletrônicos E TAMBÉM produtos de casa inteligente.

Sua tarefa é classificar produtos nas categorias disponíveis E também definir o TIPO do produto (productType).

CATEGORIAS DISPONÍVEIS:
" . json_encode($categoryList, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "

REGRAS IMPORTANTES:
1. Analise o título de cada produto cuidadosamente
2. Escolha a categoria mais adequada das EXISTENTES - priorize sempre usar categorias que já existem!
3. Se o produto for hardware (processador, placa-mãe, memória RAM, SSD, HD, placa de vídeo, fonte, cooler, gabinete), classifique como 'hardware' e escolha a subcategoria adequada
4. APENAS crie NOVAS categorias se NENHUMA categoria existente for adequada E a confiança for BAIXA
5. **JOGOS NÃO SÃO SOFTWARES!** Jogos devem ter categoria 'jogos' com subcategorias por plataforma (pc, xbox, playstation, nintendo, mobile)
6. Softwares são programas utilitários, produtividade, segurança, etc. NÃO inclua jogos nesta categoria.
7. **CASA INTELIGENTE:** Produtos como aspiradores robô, lâmpadas inteligentes, tomadas inteligentes, Alexa, Google Home devem ir para 'casa_inteligente' 
8. Para produtos de HARDWARE, detecte campos de compatibilidade quando possível
9. O TIPO DE PRODUTO (productType) define como o produto é exibido no site - use valores como: pc, kit, notebook, automacao, software, acessorio, hardware, casa_inteligente, jogos, etc.

REGRA DE CRIAÇÃO DE CATEGORIAS:
- confidence: 'high' = categoria existente encontrada, NÃO criar nova
- confidence: 'medium' = categoria existente funciona, NÃO criar nova
- confidence: 'low' = categoria existente NÃO encontrada, PODE criar nova se necessário

FORMATO DE RESPOSTA (JSON):
{
  \"classifications\": [
    {
      \"productId\": \"id_do_produto\",
      \"productTitle\": \"titulo\",
      \"currentCategory\": \"categoria_atual\",
      \"currentProductType\": \"tipo_atual\",
      \"suggestedCategory\": \"categoria_sugerida\",
      \"suggestedSubcategory\": \"subcategoria_ou_null\",
      \"suggestedProductType\": \"tipo_sugerido\",
      \"newCategory\": { \"key\": \"nova_cat\", \"label\": \"Nova Categoria\", \"parentKey\": null, \"icon\": \"Smartphone\" } ou null,
      \"newSubcategory\": { \"key\": \"nova_sub\", \"label\": \"Nova Sub\", \"parentKey\": \"parent\", \"icon\": \"Tag\" } ou null,
      \"compatibility\": { \"socket\": \"LGA1700\", \"memoryType\": \"DDR5\", \"formFactor\": \"ATX\", \"tdp\": 125 } ou null,
      \"confidence\": \"high|medium|low\",
      \"reason\": \"breve explicação\"
    }
  ]
}

ÍCONES DISPONÍVEIS:
Smartphone, Tablet, Camera, Headphones, Monitor, Keyboard, Mouse, Printer, Speaker, Watch, Tv, Gamepad, Cpu, HardDrive, MemoryStick, Fan, Zap, Box, Package, Settings, Tool, Wrench, Globe, Cloud, Server, Database, Wifi, Bluetooth, Cable, Usb, Battery, Power, Shield, Lock, Joystick, Trophy, Star, Home, Lightbulb, Thermometer, DoorOpen, Vacuum

TIPOS DE PRODUTO VÁLIDOS:
- pc: Computadores montados completos
- kit: Kits de componentes (processador + placa-mãe + memória)
- notebook: Laptops e notebooks
- hardware: Componentes avulsos (processador, placa-mãe, memória, SSD, GPU, etc.)
- automacao: Soluções de automação e n8n
- software: Programas utilitários
- acessorio: Periféricos e acessórios
- casa_inteligente: Produtos smart home
- jogos: Games e jogos

EXEMPLOS:
- 'Intel Core i9-14900K' -> categoria: hardware, subcategoria: processadores, tipo: hardware
- 'Aspirador Robô Xiaomi' -> categoria: casa_inteligente, subcategoria: aspiradores, tipo: casa_inteligente
- 'FIFA 24 PS5' -> categoria: jogos, subcategoria: playstation, tipo: jogos
- 'Mouse Gamer Logitech' -> categoria: acessorios, tipo: acessorio
- 'Windows 11 Pro' -> categoria: software, tipo: software

Sempre use snake_case para keys (ex: 'placa_mae', 'casa_inteligente').";

// Build products list for prompt
$productsList = [];
foreach ($products as $p) {
    $productsList[] = [
        'id' => $p['id'],
        'title' => $p['title'],
        'currentCategory' => $p['categories'][0] ?? $p['productType'] ?? 'uncategorized'
    ];
}

$userPrompt = "Classifique os seguintes produtos. Crie novas categorias/subcategorias quando necessário e detecte campos de compatibilidade para hardware:\n\n" . json_encode($productsList, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

// Call OpenAI API
$ch = curl_init('https://api.openai.com/v1/chat/completions');
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_HTTPHEADER => [
        'Content-Type: application/json',
        'Authorization: Bearer ' . $apiKey
    ],
    CURLOPT_POSTFIELDS => json_encode([
        'model' => $model,
        'messages' => [
            ['role' => 'system', 'content' => $systemPrompt],
            ['role' => 'user', 'content' => $userPrompt]
        ],
        'temperature' => 0.3,
        'max_tokens' => 4000,
        'response_format' => ['type' => 'json_object']
    ])
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode !== 200) {
    echo json_encode(['success' => false, 'error' => 'OpenAI API error', 'details' => $response]);
    exit;
}

$responseData = json_decode($response, true);
$content = $responseData['choices'][0]['message']['content'] ?? '';
$usage = $responseData['usage'] ?? [];

// Parse AI response
$classifications = json_decode($content, true);

if (!$classifications || !isset($classifications['classifications'])) {
    echo json_encode(['success' => false, 'error' => 'Failed to parse AI response', 'raw' => $content]);
    exit;
}

// Calculate costs
$inputTokens = $usage['prompt_tokens'] ?? 0;
$outputTokens = $usage['completion_tokens'] ?? 0;

$modelCosts = [
    'gpt-4o-mini' => ['input' => 0.15, 'output' => 0.60],
    'gpt-4o' => ['input' => 2.50, 'output' => 10.00],
    'gpt-4-turbo' => ['input' => 10.00, 'output' => 30.00],
    'gpt-3.5-turbo' => ['input' => 0.50, 'output' => 1.50]
];

$costs = $modelCosts[$model] ?? $modelCosts['gpt-4o-mini'];
$costUsd = ($inputTokens / 1000000 * $costs['input']) + ($outputTokens / 1000000 * $costs['output']);
$costBrl = $costUsd * 5.5;

// Log AI usage
try {
    $stmt = $pdo->prepare("INSERT INTO ai_usage (operation, model, input_tokens, output_tokens, cost_usd, cost_brl, details, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())");
    $stmt->execute([
        'classify_products',
        $model,
        $inputTokens,
        $outputTokens,
        $costUsd,
        $costBrl,
        json_encode(['products_count' => count($products)])
    ]);
} catch (Exception $e) {
    // Ignore logging errors
}

echo json_encode([
    'success' => true,
    'classifications' => $classifications['classifications'],
    'usage' => [
        'model' => $model,
        'inputTokens' => $inputTokens,
        'outputTokens' => $outputTokens,
        'totalTokens' => $inputTokens + $outputTokens,
        'costUsd' => round($costUsd, 6),
        'costBrl' => round($costBrl, 4)
    ]
]);
