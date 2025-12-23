<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

require_once __DIR__ . '/_db.php';

try {
    $pdo = balao_get_pdo();
} catch (Throwable $e) {
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'error' => 'Database connection failed']);
    exit;
}

// Get ElevenLabs settings from database
function getSetting($pdo, $key) {
    $stmt = $pdo->prepare("SELECT `value` FROM settings WHERE `key` = ?");
    $stmt->execute([$key]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    return $row ? $row['value'] : null;
}

$input = json_decode(file_get_contents('php://input'), true);
$text = $input['text'] ?? '';

if (empty($text)) {
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'error' => 'Text is required']);
    exit;
}

$apiKey = getSetting($pdo, 'elevenlabs_api_key');
$voiceId = getSetting($pdo, 'elevenlabs_voice_id');
$voiceEnabled = getSetting($pdo, 'elevenlabs_enabled');

if ($voiceEnabled !== 'true' || empty($apiKey) || empty($voiceId)) {
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'error' => 'Voice not configured or disabled']);
    exit;
}

// Call ElevenLabs API
$url = "https://api.elevenlabs.io/v1/text-to-speech/{$voiceId}";

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Accept: audio/mpeg',
    'Content-Type: application/json',
    "xi-api-key: {$apiKey}"
]);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
    'text' => $text,
    'model_id' => 'eleven_multilingual_v2',
    'voice_settings' => [
        'stability' => 0.5,
        'similarity_boost' => 0.75
    ]
]));

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode !== 200) {
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'error' => 'ElevenLabs API error', 'code' => $httpCode]);
    exit;
}

// Return audio as base64
$base64Audio = base64_encode($response);
header('Content-Type: application/json');
echo json_encode([
    'success' => true,
    'audio' => $base64Audio,
    'contentType' => 'audio/mpeg'
]);
