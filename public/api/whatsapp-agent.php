<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS');
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
    echo json_encode(['success' => false, 'error' => 'Database connection failed: ' . $e->getMessage()]);
    exit;
}

// Create whatsapp_agent_settings table if not exists
$pdo->exec("CREATE TABLE IF NOT EXISTS whatsapp_agent_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value LONGTEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)");

// Create whatsapp_agent_stats table if not exists
$pdo->exec("CREATE TABLE IF NOT EXISTS whatsapp_agent_stats (
    id INT AUTO_INCREMENT PRIMARY KEY,
    total_messages INT DEFAULT 0,
    total_conversations INT DEFAULT 0,
    messages_today INT DEFAULT 0,
    last_message_at TIMESTAMP NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)");

// Insert default stats row if not exists
$stmt = $pdo->query("SELECT COUNT(*) FROM whatsapp_agent_stats");
if ($stmt->fetchColumn() == 0) {
    $pdo->exec("INSERT INTO whatsapp_agent_stats (total_messages, total_conversations, messages_today) VALUES (0, 0, 0)");
}

function getSetting($pdo, $key, $default = null) {
    $stmt = $pdo->prepare("SELECT setting_value FROM whatsapp_agent_settings WHERE setting_key = ?");
    $stmt->execute([$key]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    return $row ? $row['setting_value'] : $default;
}

function setSetting($pdo, $key, $value) {
    $stmt = $pdo->prepare("INSERT INTO whatsapp_agent_settings (setting_key, setting_value) VALUES (?, ?) 
                           ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)");
    $stmt->execute([$key, $value]);
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    // Get all settings and stats
    $settings = [
        'enabled' => getSetting($pdo, 'agent_enabled', 'false') === 'true',
        'n8nWebhookUrl' => getSetting($pdo, 'n8n_webhook_url', ''),
        'whatsappNumber' => getSetting($pdo, 'whatsapp_number', ''),
        'openaiModel' => getSetting($pdo, 'openai_model', 'gpt-4o'),
        'systemPrompt' => getSetting($pdo, 'system_prompt', ''),
        'welcomeMessage' => getSetting($pdo, 'welcome_message', 'Olá! Sou o Lorenzo, assistente virtual da Balão da Informática. Como posso ajudar você hoje?'),
        'transferMessage' => getSetting($pdo, 'transfer_message', 'Vou transferir você para um atendente humano. Aguarde um momento.'),
        'maxContextMessages' => (int)getSetting($pdo, 'max_context_messages', '20'),
        'responseDelay' => (int)getSetting($pdo, 'response_delay', '2'),
        'businessHoursOnly' => getSetting($pdo, 'business_hours_only', 'false') === 'true',
        'businessHoursStart' => getSetting($pdo, 'business_hours_start', '08:00'),
        'businessHoursEnd' => getSetting($pdo, 'business_hours_end', '18:00'),
        'offlineMessage' => getSetting($pdo, 'offline_message', 'Nosso horário de atendimento é de segunda a sexta, das 8h às 18h. Deixe sua mensagem que retornaremos assim que possível.')
    ];
    
    // Get stats
    $stmt = $pdo->query("SELECT * FROM whatsapp_agent_stats LIMIT 1");
    $statsRow = $stmt->fetch(PDO::FETCH_ASSOC);
    
    $stats = [
        'totalMessages' => $statsRow['total_messages'] ?? 0,
        'totalConversations' => $statsRow['total_conversations'] ?? 0,
        'messagesToday' => $statsRow['messages_today'] ?? 0,
        'lastMessageAt' => $statsRow['last_message_at'] ?? null
    ];
    
    echo json_encode(['success' => true, 'settings' => $settings, 'stats' => $stats]);
    exit;
}

if ($method === 'POST' || $method === 'PUT') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        echo json_encode(['success' => false, 'error' => 'Invalid JSON input']);
        exit;
    }
    
    // Save each setting
    if (isset($input['enabled'])) {
        setSetting($pdo, 'agent_enabled', $input['enabled'] ? 'true' : 'false');
    }
    if (isset($input['n8nWebhookUrl'])) {
        setSetting($pdo, 'n8n_webhook_url', $input['n8nWebhookUrl']);
    }
    if (isset($input['whatsappNumber'])) {
        setSetting($pdo, 'whatsapp_number', $input['whatsappNumber']);
    }
    if (isset($input['openaiModel'])) {
        setSetting($pdo, 'openai_model', $input['openaiModel']);
    }
    if (isset($input['systemPrompt'])) {
        setSetting($pdo, 'system_prompt', $input['systemPrompt']);
    }
    if (isset($input['welcomeMessage'])) {
        setSetting($pdo, 'welcome_message', $input['welcomeMessage']);
    }
    if (isset($input['transferMessage'])) {
        setSetting($pdo, 'transfer_message', $input['transferMessage']);
    }
    if (isset($input['maxContextMessages'])) {
        setSetting($pdo, 'max_context_messages', (string)$input['maxContextMessages']);
    }
    if (isset($input['responseDelay'])) {
        setSetting($pdo, 'response_delay', (string)$input['responseDelay']);
    }
    if (isset($input['businessHoursOnly'])) {
        setSetting($pdo, 'business_hours_only', $input['businessHoursOnly'] ? 'true' : 'false');
    }
    if (isset($input['businessHoursStart'])) {
        setSetting($pdo, 'business_hours_start', $input['businessHoursStart']);
    }
    if (isset($input['businessHoursEnd'])) {
        setSetting($pdo, 'business_hours_end', $input['businessHoursEnd']);
    }
    if (isset($input['offlineMessage'])) {
        setSetting($pdo, 'offline_message', $input['offlineMessage']);
    }
    
    echo json_encode(['success' => true, 'message' => 'Settings saved successfully']);
    exit;
}

echo json_encode(['success' => false, 'error' => 'Method not allowed']);
