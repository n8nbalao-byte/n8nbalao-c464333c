<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
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
    error_log("Database connection failed: " . $e->getMessage());
    echo json_encode(['success' => false, 'error' => 'Database connection failed']);
    exit;
}

// Create conversation_memory table if not exists
$pdo->exec("CREATE TABLE IF NOT EXISTS conversation_memory (
    id INT AUTO_INCREMENT PRIMARY KEY,
    phone_number VARCHAR(50) NOT NULL,
    role ENUM('user', 'assistant') NOT NULL,
    content LONGTEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_phone (phone_number),
    INDEX idx_created (created_at)
)");

// Get settings
function getSetting($pdo, $key, $default = null) {
    $stmt = $pdo->prepare("SELECT setting_value FROM settings WHERE setting_key = ?");
    $stmt->execute([$key]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$row) {
        $stmt = $pdo->prepare("SELECT setting_value FROM whatsapp_agent_settings WHERE setting_key = ?");
        $stmt->execute([$key]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
    }
    return $row ? $row['setting_value'] : $default;
}

// Get OpenAI API key
$openaiKey = getSetting($pdo, 'openai_api_key');
if (!$openaiKey) {
    error_log("OpenAI API key not configured");
    echo json_encode(['success' => false, 'error' => 'OpenAI API key not configured']);
    exit;
}

// Get agent settings
$agentEnabled = getSetting($pdo, 'agent_enabled', 'false') === 'true';
$systemPrompt = getSetting($pdo, 'system_prompt', '');
$welcomeMessage = getSetting($pdo, 'welcome_message', 'Olá! Sou o Lorenzo, assistente virtual da Balão da Informática. Como posso ajudar você hoje?');
$maxContextMessages = (int)getSetting($pdo, 'max_context_messages', '20');
$openaiModel = getSetting($pdo, 'openai_model', 'gpt-4o');

// ElevenLabs settings
$elevenLabsKey = getSetting($pdo, 'elevenlabs_api_key', '');
$elevenLabsVoice = getSetting($pdo, 'elevenlabs_voice_id', 'B93iDjT4HFRCZ3Ju8oaV');
$voiceEnabled = getSetting($pdo, 'elevenlabs_enabled', 'false') === 'true';

// Evolution API settings (from database or webhook)
$evolutionBaseUrl = getSetting($pdo, 'evolution_api_url', '');
$evolutionApiKey = getSetting($pdo, 'evolution_api_key', '');
$instanceName = getSetting($pdo, 'evolution_instance', 'balao');

// Default system prompt if not configured
if (empty($systemPrompt)) {
    $systemPrompt = getDefaultSystemPrompt();
}

function getDefaultSystemPrompt() {
    return '# Lorenzo - Assistente Virtual Balão da Informática

## IDENTIDADE
Assistente virtual profissional, técnico, paciente e consultivo. Comunicação clara e objetiva, SEM emojis.

**Contatos da empresa:**
- Site: https://www.n8nbalao.com
- WhatsApp: (19) 98147-0446
- Especialidades: Montagem de PCs, hardware, periféricos, automação n8n

---

## REGRA CRÍTICA
**NUNCA invente produtos, preços ou informações. SEMPRE consulte o banco de dados antes de responder.**

## BANCO DE DADOS - TABELAS E USO

### 1. **products** - Produtos Completos
**Quando usar:** PCs montados, notebooks, periféricos, smartphones, software, acessórios
**Campos principais:** id, title, description, price, categories, specs, totalPrice

### 2. **hardware** - Componentes para Montagem
**Quando usar:** Componentes individuais (CPU, GPU, RAM, SSD, placa-mãe, fonte, gabinete, cooler)

**Campos de compatibilidade:**
- `socket`: LGA1700, LGA1200, AM5, AM4
- `memoryType`: DDR3, DDR4, DDR5
- `formFactor`: ATX, Micro-ATX, Mini-ITX
- `tdp`: Consumo em watts

**Categorias:** processor, motherboard, memory, storage, gpu, psu, case, cooler

### 3. **customers** - Clientes
**Quando usar:** Cliente logado pergunta sobre dados cadastrados
**ATENÇÃO:** Nunca exponha dados sensíveis sem confirmação

### 4. **orders** - Pedidos
**Quando usar:** Status de pedidos, histórico de compras
**Status:** pending, confirmed, processing, shipped, delivered, cancelled

### 5. **company** - Dados da Empresa
**Quando usar:** Informações de contato, CNPJ, endereço

---

## COMPATIBILIDADE DE HARDWARE - CHECKLIST

**Ao montar PC, SEMPRE verificar:**

1. **Socket**: CPU e placa-mãe devem ter socket idêntico
2. **Memória**: DDR4 ou DDR5 compatível entre placa-mãe e RAM
3. **Fonte (TDP)**: `CPU_TDP + GPU_TDP + 100W + 20% margem`
4. **Form Factor**: Gabinete suporta tamanho da placa (ATX > mATX > ITX)
5. **Cooler**: TDP do cooler >= TDP do processador

---

## REGRAS OBRIGATÓRIAS

✅ **FAZER:**
- Consultar banco antes de confirmar produto/preço
- Incluir preços ao mencionar produtos (R$ X.XXX,XX)
- Verificar compatibilidade em montagens (socket, DDR, TDP)
- Explicar termos técnicos de forma simples
- Oferecer alternativas se indisponível
- Direcionar para WhatsApp/Site para finalizar

❌ **NUNCA:**
- Usar emojis
- Inventar produtos ou preços
- Afirmar compatibilidade sem verificar
- Processar pagamentos
- Expor dados sensíveis
- Prometer descontos não autorizados

**Você NÃO processa pagamentos nem confirma pedidos. Direcione para WhatsApp: (19) 98147-0446**';
}

// Get database context
function getDatabaseContext($pdo, $userMessage) {
    $context = [];
    
    // Search products
    $searchTerms = extractSearchTerms($userMessage);
    if (!empty($searchTerms)) {
        $likeConditions = [];
        $params = [];
        foreach ($searchTerms as $term) {
            $likeConditions[] = "title LIKE ?";
            $params[] = "%$term%";
        }
        
        $sql = "SELECT id, title, totalPrice, categories, subtitle FROM products WHERE " . implode(' OR ', $likeConditions) . " LIMIT 10";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $products = $stmt->fetchAll(PDO::FETCH_ASSOC);
        if (!empty($products)) {
            $context['products'] = $products;
        }
        
        // Search hardware
        $sql = "SELECT id, title, price, category, socket, memoryType, formFactor, tdp FROM hardware WHERE " . implode(' OR ', $likeConditions) . " LIMIT 10";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $hardware = $stmt->fetchAll(PDO::FETCH_ASSOC);
        if (!empty($hardware)) {
            $context['hardware'] = $hardware;
        }
    }
    
    // Get company info
    $stmt = $pdo->query("SELECT * FROM company LIMIT 1");
    $company = $stmt->fetch(PDO::FETCH_ASSOC);
    if ($company) {
        $context['company'] = $company;
    }
    
    // Get categories
    $stmt = $pdo->query("SELECT category_key, label FROM categories WHERE parent_key IS NULL LIMIT 20");
    $categories = $stmt->fetchAll(PDO::FETCH_ASSOC);
    if (!empty($categories)) {
        $context['categories'] = $categories;
    }
    
    return $context;
}

function extractSearchTerms($message) {
    // Remove common words and extract meaningful terms
    $stopWords = ['o', 'a', 'os', 'as', 'um', 'uma', 'de', 'da', 'do', 'em', 'para', 'com', 'que', 'qual', 'quais', 'tem', 'têm', 'quero', 'preciso', 'busco', 'procuro', 'me', 'voce', 'você'];
    $words = preg_split('/\s+/', strtolower($message));
    $terms = [];
    
    foreach ($words as $word) {
        $word = preg_replace('/[^a-záàâãéèêíïóôõöúçñ0-9]/u', '', $word);
        if (strlen($word) >= 3 && !in_array($word, $stopWords)) {
            $terms[] = $word;
        }
    }
    
    return array_slice($terms, 0, 5);
}

// Get conversation memory
function getConversationMemory($pdo, $phoneNumber, $limit = 20) {
    $stmt = $pdo->prepare("SELECT role, content FROM conversation_memory WHERE phone_number = ? ORDER BY created_at DESC LIMIT ?");
    $stmt->execute([$phoneNumber, $limit]);
    $messages = $stmt->fetchAll(PDO::FETCH_ASSOC);
    return array_reverse($messages);
}

// Save message to memory
function saveToMemory($pdo, $phoneNumber, $role, $content) {
    $stmt = $pdo->prepare("INSERT INTO conversation_memory (phone_number, role, content) VALUES (?, ?, ?)");
    $stmt->execute([$phoneNumber, $role, $content]);
    
    // Clean old messages (keep last 50)
    $stmt = $pdo->prepare("DELETE FROM conversation_memory WHERE phone_number = ? AND id NOT IN (SELECT id FROM (SELECT id FROM conversation_memory WHERE phone_number = ? ORDER BY created_at DESC LIMIT 50) AS t)");
    $stmt->execute([$phoneNumber, $phoneNumber]);
}

// Transcribe audio using OpenAI Whisper
function transcribeAudio($base64Audio, $openaiKey) {
    $audioData = base64_decode($base64Audio);
    $tempFile = tempnam(sys_get_temp_dir(), 'audio_') . '.ogg';
    file_put_contents($tempFile, $audioData);
    
    $curl = curl_init();
    $cfile = new CURLFile($tempFile, 'audio/ogg', 'audio.ogg');
    
    curl_setopt_array($curl, [
        CURLOPT_URL => 'https://api.openai.com/v1/audio/transcriptions',
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_HTTPHEADER => [
            'Authorization: Bearer ' . $openaiKey
        ],
        CURLOPT_POSTFIELDS => [
            'file' => $cfile,
            'model' => 'whisper-1'
        ]
    ]);
    
    $response = curl_exec($curl);
    curl_close($curl);
    unlink($tempFile);
    
    $result = json_decode($response, true);
    return $result['text'] ?? '';
}

// Analyze image using OpenAI Vision
function analyzeImage($base64Image, $caption, $openaiKey) {
    $payload = [
        'model' => 'gpt-4o-mini',
        'messages' => [
            [
                'role' => 'user',
                'content' => [
                    [
                        'type' => 'text',
                        'text' => "Descreva esta imagem enviada por um cliente. Mensagem do cliente: " . ($caption ?: 'Sem mensagem')
                    ],
                    [
                        'type' => 'image_url',
                        'image_url' => [
                            'url' => 'data:image/jpeg;base64,' . $base64Image
                        ]
                    ]
                ]
            ]
        ],
        'max_tokens' => 500
    ];
    
    $curl = curl_init();
    curl_setopt_array($curl, [
        CURLOPT_URL => 'https://api.openai.com/v1/chat/completions',
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_HTTPHEADER => [
            'Authorization: Bearer ' . $openaiKey,
            'Content-Type: application/json'
        ],
        CURLOPT_POSTFIELDS => json_encode($payload)
    ]);
    
    $response = curl_exec($curl);
    curl_close($curl);
    
    $result = json_decode($response, true);
    return $result['choices'][0]['message']['content'] ?? 'Não foi possível analisar a imagem.';
}

// Generate response with OpenAI
function generateResponse($systemPrompt, $messages, $openaiKey, $model = 'gpt-4o') {
    $payload = [
        'model' => $model,
        'messages' => array_merge(
            [['role' => 'system', 'content' => $systemPrompt]],
            $messages
        ),
        'temperature' => 0.7,
        'max_tokens' => 1000
    ];
    
    $curl = curl_init();
    curl_setopt_array($curl, [
        CURLOPT_URL => 'https://api.openai.com/v1/chat/completions',
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_HTTPHEADER => [
            'Authorization: Bearer ' . $openaiKey,
            'Content-Type: application/json'
        ],
        CURLOPT_POSTFIELDS => json_encode($payload)
    ]);
    
    $response = curl_exec($curl);
    curl_close($curl);
    
    $result = json_decode($response, true);
    return $result['choices'][0]['message']['content'] ?? 'Desculpe, não consegui processar sua mensagem.';
}

// Generate audio with ElevenLabs
function generateAudio($text, $elevenLabsKey, $voiceId) {
    $payload = [
        'text' => $text,
        'model_id' => 'eleven_multilingual_v2',
        'voice_settings' => [
            'stability' => 0.5,
            'similarity_boost' => 0.75
        ]
    ];
    
    $curl = curl_init();
    curl_setopt_array($curl, [
        CURLOPT_URL => "https://api.elevenlabs.io/v1/text-to-speech/$voiceId",
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_HTTPHEADER => [
            'xi-api-key: ' . $elevenLabsKey,
            'Content-Type: application/json'
        ],
        CURLOPT_POSTFIELDS => json_encode($payload)
    ]);
    
    $audioData = curl_exec($curl);
    $httpCode = curl_getinfo($curl, CURLINFO_HTTP_CODE);
    curl_close($curl);
    
    if ($httpCode === 200) {
        return base64_encode($audioData);
    }
    
    return null;
}

// Send message via Evolution API
function sendWhatsAppMessage($baseUrl, $apiKey, $instance, $phoneNumber, $text) {
    $payload = [
        'number' => $phoneNumber,
        'textMessage' => ['text' => $text]
    ];
    
    $curl = curl_init();
    curl_setopt_array($curl, [
        CURLOPT_URL => "$baseUrl/message/sendText/$instance",
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_HTTPHEADER => [
            'apikey: ' . $apiKey,
            'Content-Type: application/json'
        ],
        CURLOPT_POSTFIELDS => json_encode($payload)
    ]);
    
    $response = curl_exec($curl);
    curl_close($curl);
    
    return json_decode($response, true);
}

// Send audio via Evolution API
function sendWhatsAppAudio($baseUrl, $apiKey, $instance, $phoneNumber, $audioBase64) {
    $payload = [
        'number' => $phoneNumber,
        'audioMessage' => [
            'audio' => $audioBase64
        ]
    ];
    
    $curl = curl_init();
    curl_setopt_array($curl, [
        CURLOPT_URL => "$baseUrl/message/sendWhatsAppAudio/$instance",
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_HTTPHEADER => [
            'apikey: ' . $apiKey,
            'Content-Type: application/json'
        ],
        CURLOPT_POSTFIELDS => json_encode($payload)
    ]);
    
    $response = curl_exec($curl);
    curl_close($curl);
    
    return json_decode($response, true);
}

// Main webhook handler
$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    echo json_encode(['success' => false, 'error' => 'Invalid input']);
    exit;
}

// Log incoming webhook
error_log("WhatsApp Webhook received: " . json_encode($input));

// Check if agent is enabled
if (!$agentEnabled) {
    echo json_encode(['success' => true, 'message' => 'Agent disabled']);
    exit;
}

// Extract data from Evolution API webhook
$body = $input['body'] ?? $input;
$data = $body['data'] ?? $body;
$key = $data['key'] ?? [];
$messageData = $data['message'] ?? [];

// Check if message is from user (not from bot)
$fromMe = $key['fromMe'] ?? false;
if ($fromMe) {
    echo json_encode(['success' => true, 'message' => 'Ignoring own message']);
    exit;
}

// Get Evolution API settings from webhook
$evolutionBaseUrl = $body['server_url'] ?? '';
$evolutionApiKey = $body['apikey'] ?? '';

// Get user info
$remoteJid = $key['remoteJid'] ?? $key['remoteJidAlt'] ?? '';
$phoneNumber = explode('@', $remoteJid)[0];
$userName = $data['pushName'] ?? 'Cliente';
$messageType = $data['messageType'] ?? '';

// Process message based on type
$userMessage = '';

switch ($messageType) {
    case 'conversation':
    case 'extendedTextMessage':
        $userMessage = $messageData['conversation'] ?? $messageData['extendedTextMessage']['text'] ?? '';
        break;
        
    case 'audioMessage':
        $audioBase64 = $messageData['base64'] ?? '';
        if ($audioBase64) {
            $userMessage = transcribeAudio($audioBase64, $openaiKey);
            $userMessage = "[Áudio transcrito]: " . $userMessage;
        }
        break;
        
    case 'imageMessage':
        $imageBase64 = $messageData['base64'] ?? '';
        $caption = $messageData['imageMessage']['caption'] ?? '';
        if ($imageBase64) {
            $imageDescription = analyzeImage($imageBase64, $caption, $openaiKey);
            $userMessage = "[Imagem enviada]: " . $imageDescription;
            if ($caption) {
                $userMessage .= "\n[Legenda]: " . $caption;
            }
        }
        break;
        
    case 'documentMessage':
        $docName = $messageData['documentMessage']['fileName'] ?? 'documento';
        $caption = $messageData['documentMessage']['caption'] ?? '';
        $userMessage = "[Documento enviado: $docName]";
        if ($caption) {
            $userMessage .= "\n[Mensagem]: " . $caption;
        }
        break;
        
    case 'videoMessage':
        $caption = $messageData['videoMessage']['caption'] ?? '';
        $userMessage = "[Vídeo enviado]";
        if ($caption) {
            $userMessage .= "\n[Mensagem]: " . $caption;
        }
        break;
        
    default:
        $userMessage = "[Mensagem não suportada: $messageType]";
}

if (empty($userMessage)) {
    echo json_encode(['success' => true, 'message' => 'No message content']);
    exit;
}

// Get conversation memory
$conversationHistory = getConversationMemory($pdo, $phoneNumber, $maxContextMessages);

// Get database context based on user message
$dbContext = getDatabaseContext($pdo, $userMessage);
$contextString = '';
if (!empty($dbContext)) {
    $contextString = "\n\n## CONTEXTO DO BANCO DE DADOS:\n" . json_encode($dbContext, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
}

// Build messages array
$messages = [];
foreach ($conversationHistory as $msg) {
    $messages[] = [
        'role' => $msg['role'],
        'content' => $msg['content']
    ];
}

// Add current user message with context
$currentMessage = "Nome do cliente: $userName\nMensagem: $userMessage" . $contextString;
$messages[] = ['role' => 'user', 'content' => $currentMessage];

// Generate AI response
$aiResponse = generateResponse($systemPrompt, $messages, $openaiKey, $openaiModel);

// Save to memory
saveToMemory($pdo, $phoneNumber, 'user', $userMessage);
saveToMemory($pdo, $phoneNumber, 'assistant', $aiResponse);

// Update stats
$pdo->exec("UPDATE whatsapp_agent_stats SET total_messages = total_messages + 1, messages_today = messages_today + 1, last_message_at = NOW()");

// Send response
if (!empty($evolutionBaseUrl) && !empty($evolutionApiKey)) {
    // Send text message
    sendWhatsAppMessage($evolutionBaseUrl, $evolutionApiKey, $instanceName, $phoneNumber, $aiResponse);
    
    // Optionally send audio
    if ($voiceEnabled && !empty($elevenLabsKey)) {
        $audioBase64 = generateAudio($aiResponse, $elevenLabsKey, $elevenLabsVoice);
        if ($audioBase64) {
            sendWhatsAppAudio($evolutionBaseUrl, $evolutionApiKey, $instanceName, $phoneNumber, $audioBase64);
        }
    }
}

echo json_encode([
    'success' => true,
    'response' => $aiResponse,
    'phone' => $phoneNumber,
    'userName' => $userName
]);
