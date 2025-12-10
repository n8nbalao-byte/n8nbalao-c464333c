<?php
// Suno AI Music Generation Endpoint
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$prompt = $input['prompt'] ?? '';
$style = $input['style'] ?? 'pop';
$title = $input['title'] ?? 'Minha Música';

if (empty($prompt)) {
    echo json_encode(['success' => false, 'error' => 'Prompt é obrigatório']);
    exit;
}

// Suno API key
$sunoApiKey = '01a3961c1f06d4b58a9a39eb54136475';

// Create music generation request using correct Suno API endpoint
$ch = curl_init('https://api.sunoapi.org/api/v1/generate');
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_HTTPHEADER => [
        'Content-Type: application/json',
        'Authorization: Bearer ' . $sunoApiKey
    ],
    CURLOPT_POSTFIELDS => json_encode([
        'customMode' => true,
        'instrumental' => false,
        'model' => 'V4_5',
        'prompt' => $prompt,
        'style' => $style,
        'title' => $title
    ]),
    CURLOPT_TIMEOUT => 120
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);
curl_close($ch);

error_log("Suno API Response: " . $response);
error_log("Suno API HTTP Code: " . $httpCode);

if ($error) {
    echo json_encode(['success' => false, 'error' => 'Erro de conexão: ' . $error]);
    exit;
}

$data = json_decode($response, true);

if (!$data) {
    echo json_encode(['success' => false, 'error' => 'Resposta inválida da API', 'raw' => $response]);
    exit;
}

// Check for success response
if (isset($data['code']) && $data['code'] === 200 && isset($data['data']['taskId'])) {
    echo json_encode([
        'success' => true,
        'taskId' => $data['data']['taskId'],
        'message' => 'Música sendo gerada... Aguarde!'
    ]);
} else {
    echo json_encode([
        'success' => false, 
        'error' => $data['msg'] ?? 'Erro na API Suno', 
        'details' => $data
    ]);
}
?>