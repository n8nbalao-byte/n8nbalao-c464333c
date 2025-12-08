<?php
// CORS headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit();
}

// Get OpenAI API key from config
$configFile = __DIR__ . '/config.php';
$openaiApiKey = null;

if (file_exists($configFile)) {
    include $configFile;
    $openaiApiKey = defined('OPENAI_API_KEY') ? OPENAI_API_KEY : null;
}

if (!$openaiApiKey) {
    http_response_code(500);
    echo json_encode(['error' => 'OpenAI API key not configured. Add OPENAI_API_KEY to config.php']);
    exit();
}

// Database connection for context
$host = 'localhost';
$dbname = 'u770915504_n8nbalao';
$username = 'u770915504_n8nbalao';
$password = 'Balao2025';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    // Continue without database - AI will work but without real data
    $pdo = null;
}

// Get request data
$input = json_decode(file_get_contents('php://input'), true);
$messages = $input['messages'] ?? [];
$customerId = $input['customerId'] ?? null;

// Fetch real data from database for context
$contextData = [];

if ($pdo) {
    try {
        // Get products
        $stmt = $pdo->query("SELECT id, title, subtitle, productType, totalPrice, description FROM products ORDER BY totalPrice ASC LIMIT 50");
        $products = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $contextData['products'] = $products;

        // Get hardware
        $stmt = $pdo->query("SELECT id, name, brand, model, price, category, socket, memoryType FROM hardware ORDER BY price ASC LIMIT 100");
        $hardware = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $contextData['hardware'] = $hardware;

        // Get company info
        $stmt = $pdo->query("SELECT * FROM company LIMIT 1");
        $company = $stmt->fetch(PDO::FETCH_ASSOC);
        $contextData['company'] = $company;

        // Get categories
        $stmt = $pdo->query("SELECT name, icon FROM categories");
        $categories = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $contextData['categories'] = $categories;

        // Get customer info if provided
        if ($customerId) {
            $stmt = $pdo->prepare("SELECT name, email, phone, city, state FROM customers WHERE id = ?");
            $stmt->execute([$customerId]);
            $customer = $stmt->fetch(PDO::FETCH_ASSOC);
            $contextData['customer'] = $customer;

            // Get customer orders
            $stmt = $pdo->prepare("SELECT id, total, status, createdAt FROM orders WHERE customerId = ? ORDER BY createdAt DESC LIMIT 5");
            $stmt->execute([$customerId]);
            $orders = $stmt->fetchAll(PDO::FETCH_ASSOC);
            $contextData['customerOrders'] = $orders;
        }
    } catch (PDOException $e) {
        // Continue without data
    }
}

// Build system prompt with real data
$systemPrompt = "# Você é o Lorenzo 🎈

Você é o Lorenzo, o assistente virtual inteligente da **Balão da Informática**. Você é amigável, prestativo e especialista em tecnologia, computadores e automação.

## Sua Personalidade
- Simpático e acolhedor
- Paciente com clientes de todos os níveis técnicos
- Entusiasta de tecnologia
- Profissional mas descontraído
- Sempre disposto a ajudar
- Usa emojis moderadamente para ser mais amigável

## Informações da Empresa
**Nome:** Balão da Informática
**Site:** https://www.n8nbalao.com
**WhatsApp:** " . ($contextData['company']['phone'] ?? '(19) 98147-0446') . "

## DADOS ATUAIS DO BANCO DE DADOS

### Produtos Disponíveis:
";

if (!empty($contextData['products'])) {
    foreach ($contextData['products'] as $product) {
        $systemPrompt .= "- **{$product['title']}** ({$product['productType']}) - R$ " . number_format($product['totalPrice'], 2, ',', '.') . "\n";
    }
} else {
    $systemPrompt .= "Nenhum produto cadastrado no momento.\n";
}

$systemPrompt .= "\n### Hardware Disponível por Categoria:\n";

if (!empty($contextData['hardware'])) {
    $hardwareByCategory = [];
    foreach ($contextData['hardware'] as $hw) {
        $cat = $hw['category'] ?? 'outros';
        if (!isset($hardwareByCategory[$cat])) {
            $hardwareByCategory[$cat] = [];
        }
        $hardwareByCategory[$cat][] = $hw;
    }
    
    foreach ($hardwareByCategory as $category => $items) {
        $systemPrompt .= "\n**{$category}:**\n";
        foreach (array_slice($items, 0, 10) as $item) {
            $socket = $item['socket'] ? " (Socket: {$item['socket']})" : "";
            $mem = $item['memoryType'] ? " ({$item['memoryType']})" : "";
            $systemPrompt .= "- {$item['brand']} {$item['model']} - R$ " . number_format($item['price'], 2, ',', '.') . "{$socket}{$mem}\n";
        }
    }
} else {
    $systemPrompt .= "Nenhum hardware cadastrado no momento.\n";
}

if (!empty($contextData['customer'])) {
    $customer = $contextData['customer'];
    $systemPrompt .= "\n### Cliente Atual:
- Nome: {$customer['name']}
- Cidade: {$customer['city']}/{$customer['state']}
";
    
    if (!empty($contextData['customerOrders'])) {
        $systemPrompt .= "\n### Pedidos do Cliente:\n";
        foreach ($contextData['customerOrders'] as $order) {
            $systemPrompt .= "- Pedido #{$order['id']} - R$ " . number_format($order['total'], 2, ',', '.') . " - Status: {$order['status']} - Data: {$order['createdAt']}\n";
        }
    }
}

$systemPrompt .= "

## SUAS CAPACIDADES

1. **Consultar Produtos** - Informar preços, especificações e disponibilidade
2. **Ajudar a Montar PC** - Guiar na escolha de componentes compatíveis
3. **Tirar Dúvidas Técnicas** - Explicar sobre hardware e software
4. **Informar sobre Pedidos** - Status e histórico (se cliente logado)
5. **Automações n8n** - Explicar soluções de automação

## REGRAS DE ATENDIMENTO

1. Sempre cumprimente pelo nome se souber
2. Seja proativo em oferecer ajuda
3. Explique termos técnicos de forma simples
4. Inclua preços quando mencionar produtos
5. Direcione para WhatsApp para finalizar compras
6. Seja honesto sobre limitações

## FORMATO DE RESPOSTAS

- Use markdown para formatar
- Use emojis com moderação (🎈🖥️💡✅)
- Seja conciso mas completo
- Inclua preços sempre

**IMPORTANTE:** Você NÃO processa pagamentos. Direcione para WhatsApp ou carrinho do site.

Lembre-se: seu objetivo é proporcionar a melhor experiência para o cliente! 🎈";

// Prepare messages for OpenAI
$apiMessages = [
    ['role' => 'system', 'content' => $systemPrompt]
];

foreach ($messages as $msg) {
    $apiMessages[] = [
        'role' => $msg['role'],
        'content' => $msg['content']
    ];
}

// Call OpenAI API
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, 'https://api.openai.com/v1/chat/completions');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Bearer ' . $openaiApiKey,
    'Content-Type: application/json'
]);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
    'model' => 'gpt-4o-mini',
    'messages' => $apiMessages,
    'max_tokens' => 1000,
    'temperature' => 0.7
]));

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);
curl_close($ch);

if ($error) {
    http_response_code(500);
    echo json_encode(['error' => 'Erro de conexão: ' . $error]);
    exit();
}

$data = json_decode($response, true);

if ($httpCode !== 200) {
    http_response_code($httpCode);
    echo json_encode(['error' => 'Erro na API: ' . ($data['error']['message'] ?? 'Erro desconhecido')]);
    exit();
}

$assistantMessage = $data['choices'][0]['message']['content'] ?? 'Desculpe, não consegui processar sua mensagem.';

echo json_encode([
    'success' => true,
    'message' => $assistantMessage,
    'usage' => $data['usage'] ?? null
]);
?>
