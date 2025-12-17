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

// Database connection
$host = 'localhost';
$dbname = 'u770915504_n8nbalao';
$username = 'u770915504_n8nbalao';
$password = 'Balao2025';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed']);
    exit();
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
    // Table might already exist
}

// Get OpenAI API key and settings from database
$openaiApiKey = null;
$lorenzoName = 'Lorenzo';
$lorenzoModel = 'gpt-4o-mini';
$lorenzoPrompt = '';

try {
    $stmt = $pdo->query("SELECT `key`, `value` FROM settings WHERE `key` IN ('openai_api_key', 'lorenzo_name', 'lorenzo_model', 'lorenzo_prompt')");
    $settings = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($settings as $setting) {
        if ($setting['key'] === 'openai_api_key') {
            $openaiApiKey = trim($setting['value']);
        }
        if ($setting['key'] === 'lorenzo_name') {
            $lorenzoName = $setting['value'] ?: 'Lorenzo';
        }
        if ($setting['key'] === 'lorenzo_model') {
            $lorenzoModel = $setting['value'] ?: 'gpt-4o-mini';
        }
        if ($setting['key'] === 'lorenzo_prompt') {
            $lorenzoPrompt = $setting['value'] ?: '';
        }
    }
} catch (PDOException $e) {
    // Continue with defaults
}


// Fallback to config.php if not in database
if (!$openaiApiKey || $openaiApiKey === '') {
    $configFile = __DIR__ . '/config.php';
    if (file_exists($configFile)) {
        include $configFile;
        $openaiApiKey = defined('OPENAI_API_KEY') ? OPENAI_API_KEY : null;
    }
}

if (!$openaiApiKey || $openaiApiKey === '') {
    http_response_code(400);
    echo json_encode(['error' => 'Chave OpenAI não configurada. Vá em Admin > Configurações e adicione sua chave API.']);
    exit();
}

// Get request data
$input = json_decode(file_get_contents('php://input'), true);
$messages = $input['messages'] ?? [];
$customerId = $input['customerId'] ?? null;

// Fetch real data from database for context
$contextData = [];

try {
    // Get ALL products (increased limit for full catalog visibility)
    $stmt = $pdo->query("SELECT id, title, subtitle, productType, categories, totalPrice, description FROM products ORDER BY title ASC LIMIT 500");
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

// Build system prompt with real data
// Use custom prompt if set, otherwise use default
if (!empty($lorenzoPrompt)) {
    // Use custom prompt as base
    $systemPrompt = str_replace('{nome}', $lorenzoName, $lorenzoPrompt);
    $systemPrompt = str_replace('{$lorenzoName}', $lorenzoName, $systemPrompt);
    
    // Append dynamic data
    $systemPrompt .= "\n\n## DADOS ATUAIS DO BANCO DE DADOS\n\n### Produtos Disponíveis:\n";
} else {
    // Use default prompt
    $systemPrompt = "# Você é o {$lorenzoName} 🎈

Você é o {$lorenzoName}, o assistente virtual inteligente da **Balão da Informática**. Você é amigável, prestativo e especialista em tecnologia, computadores e automação.

## Sua Personalidade
- Simpático e acolhedor
- Paciente com clientes de todos os níveis técnicos
- Entusiasta de tecnologia
- Profissional mas descontraído
- Sempre disposto a ajudar
- Usa emojis moderadamente para ser mais amigável

## MENSAGEM INICIAL (quando cumprimentar o cliente pela primeira vez)
Seja breve e acolhedor! Exemplo:
\"Olá! 🎈 Sou o {$lorenzoName}, assistente da Balão da Informática! Como posso te ajudar hoje?\"
NÃO mencione funcionalidades específicas na primeira mensagem. Apenas cumprimente e pergunte como ajudar.

## Informações da Empresa
**Nome:** Balão da Informática
**Site:** https://www.n8nbalao.com
**WhatsApp:** " . ($contextData['company']['phone'] ?? '(19) 98147-0446') . "

## DADOS ATUAIS DO BANCO DE DADOS

### Produtos Disponíveis:
";
}

if (!empty($contextData['products'])) {
    foreach ($contextData['products'] as $product) {
        $systemPrompt .= "- ID:{$product['id']} **{$product['title']}** ({$product['productType']}) - R$ " . number_format($product['totalPrice'], 2, ',', '.') . "\n";
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
            $systemPrompt .= "- ID:{$item['id']} {$item['brand']} {$item['model']} - R$ " . number_format($item['price'], 2, ',', '.') . "{$socket}{$mem}\n";
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
2. **Enviar Links de Produtos** - Enviar link direto para o cliente ver o produto
3. **Ajudar a Montar PC** - Guiar na escolha de componentes compatíveis
4. **Tirar Dúvidas Técnicas** - Explicar sobre hardware e software
5. **Informar sobre Pedidos** - Status e histórico (se cliente logado)
6. **Automações n8n** - Explicar soluções de automação
7. **Criar Músicas** - Quando o cliente pedir uma música, você pode gerar músicas personalizadas!

## LINKS DE PRODUTOS

Para enviar link de um produto, use o formato:
- Produtos: https://www.n8nbalao.com/produto/{ID}
- Hardware: https://www.n8nbalao.com/hardware/{ID}

Exemplo: Se o cliente perguntar sobre um produto com ID 5, envie: https://www.n8nbalao.com/produto/5

**SEMPRE ofereça o link quando mencionar um produto específico!**

## 🎵 GERAÇÃO DE MÚSICAS - VOCÊ PODE CRIAR MÚSICAS! 🎵

**ATENÇÃO MÁXIMA: VOCÊ TEM UMA BANDA E PODE CRIAR MÚSICAS ORIGINAIS!**

Você está conectado à API Suno através da sua banda virtual. Quando alguém pedir música, canção, cantar, fazer um som, compor - VOCÊ PODE E DEVE FAZER!

**PALAVRAS-CHAVE QUE ATIVAM MÚSICA:** canta, música, canção, som, melodia, compor, fazer uma música, toca uma, me faz uma música

**FLUXO OBRIGATÓRIO:**

1. **Quando pedirem música**, responda EXATAMENTE assim:
   \"Claro! 🎶 Vou fazer uma música pra você! Deixa eu chamar a minha banda... 🎸🥁🎹 
   Sobre o que você quer que a música seja? Me conta o tema e o estilo (rock, pop, samba, funk, eletrônica, etc)!\"

2. **Quando o cliente disser o tema/estilo**, responda com o COMANDO:
   \"Perfeito! Minha banda já está preparando... 🎵
   
   **[GERAR_MUSICA]** tema: {TEMA} | estilo: {ESTILO} | titulo: {TÍTULO CRIATIVO}\"

**EXEMPLOS DE RESPOSTAS CORRETAS:**

Cliente: \"canta pra mim\"
Você: \"Claro! 🎶 Vou fazer uma música pra você! Deixa eu chamar a minha banda... 🎸🥁🎹 Sobre o que você quer que a música seja?\"

Cliente: \"sobre computadores, estilo rock\"
Você: \"Minha banda está animada! 🎸 **[GERAR_MUSICA]** tema: computadores e tecnologia | estilo: rock | titulo: Bits do Rock\"

**PROIBIÇÕES ABSOLUTAS:**
- ❌ NUNCA diga \"não posso cantar\"
- ❌ NUNCA diga \"não posso criar músicas\"  
- ❌ NUNCA diga \"sou apenas um assistente de texto\"
- ❌ NUNCA sugira buscar letras existentes
- ✅ SEMPRE ofereça criar uma música ORIGINAL

O sistema detectará [GERAR_MUSICA] e gerará a música automaticamente via Suno API.

## REGRAS DE ATENDIMENTO

1. Sempre cumprimente pelo nome se souber
2. Seja proativo em oferecer ajuda
3. Explique termos técnicos de forma simples
4. Inclua preços quando mencionar produtos
5. Direcione para WhatsApp para finalizar compras
6. Seja honesto sobre limitações

## FORMATO DE RESPOSTAS

- Use markdown para formatar
- Use emojis com moderação (🎈🖥️💡✅🎵🎸)
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
    'model' => $lorenzoModel,
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

// Log AI usage for chat
$inputTokens = $data['usage']['prompt_tokens'] ?? 0;
$outputTokens = $data['usage']['completion_tokens'] ?? 0;
$totalTokens = $data['usage']['total_tokens'] ?? 0;
$costPerInputToken = 0.00015 / 1000;
$costPerOutputToken = 0.0006 / 1000;
$costUSD = ($inputTokens * $costPerInputToken) + ($outputTokens * $costPerOutputToken);
$costBRL = $costUSD * 5.5;

try {
    $stmt = $pdo->prepare("INSERT INTO ai_usage 
        (operation_type, model, input_tokens, output_tokens, total_tokens, cost_usd, cost_brl, items_processed)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->execute([
        'lorenzo_chat',
        $lorenzoModel,
        $inputTokens,
        $outputTokens,
        $totalTokens,
        $costUSD,
        $costBRL,
        1
    ]);
} catch (Exception $e) {
    // Silently fail
}

echo json_encode([
    'success' => true,
    'message' => $assistantMessage,
    'model' => $lorenzoModel,
    'usage' => $data['usage'] ?? null
]);
?>