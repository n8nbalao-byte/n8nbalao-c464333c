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

// Get Resend API key from environment or config
$resendApiKey = getenv('RESEND_API_KEY');
if (!$resendApiKey) {
    // Fallback: try to read from a config file
    $configFile = __DIR__ . '/config.php';
    if (file_exists($configFile)) {
        include $configFile;
        $resendApiKey = defined('RESEND_API_KEY') ? RESEND_API_KEY : null;
    }
}

if (!$resendApiKey) {
    http_response_code(500);
    echo json_encode(['error' => 'Resend API key not configured']);
    exit();
}

$input = json_decode(file_get_contents('php://input'), true);

$to = $input['to'] ?? null;
$subject = $input['subject'] ?? 'Nova Notificação';
$html = $input['html'] ?? '';
$from = $input['from'] ?? 'N8N Balão <noreply@n8nbalao.com.br>';

if (!$to) {
    http_response_code(400);
    echo json_encode(['error' => 'Recipient email is required']);
    exit();
}

// Send email via Resend API
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, 'https://api.resend.com/emails');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Bearer ' . $resendApiKey,
    'Content-Type: application/json'
]);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
    'from' => $from,
    'to' => is_array($to) ? $to : [$to],
    'subject' => $subject,
    'html' => $html
]));

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode >= 200 && $httpCode < 300) {
    echo json_encode(['success' => true, 'response' => json_decode($response)]);
} else {
    http_response_code($httpCode);
    echo json_encode(['error' => 'Failed to send email', 'details' => json_decode($response)]);
}
?>
