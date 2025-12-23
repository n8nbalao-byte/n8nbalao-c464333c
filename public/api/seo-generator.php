<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

// Database connection to get API key
require_once __DIR__ . '/_db.php';

try {
    $pdo = balao_get_pdo();
} catch (Throwable $e) {
    echo json_encode(['success' => false, 'error' => 'Database connection failed']);
    exit;
}

// Get OpenAI API key
$stmt = $pdo->query("SELECT value FROM settings WHERE `key` = 'openai_api_key'");
$row = $stmt->fetch(PDO::FETCH_ASSOC);
$apiKey = $row ? $row['value'] : null;

if (!$apiKey) {
    echo json_encode(['success' => false, 'error' => 'OpenAI API key not configured']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$name = $input['name'] ?? '';
$description = $input['description'] ?? '';
$url = $input['url'] ?? '';

if (!$name && !$description) {
    echo json_encode(['success' => false, 'error' => 'Name or description is required']);
    exit;
}

// Build prompt
$systemPrompt = "Você é um especialista em SEO. Gere metadados otimizados para uma landing page.
Responda APENAS em JSON válido no formato:
{
  \"title\": \"título SEO até 60 caracteres\",
  \"description\": \"meta description até 160 caracteres\",
  \"keywords\": [\"keyword1\", \"keyword2\", \"keyword3\", \"keyword4\", \"keyword5\"]
}";

$prompt = "Gere SEO para:\nNome: $name\nDescrição: $description" . ($url ? "\nURL de referência: $url" : "");

// Call OpenAI
$ch = curl_init('https://api.openai.com/v1/chat/completions');

$data = [
    'model' => 'gpt-4o-mini',
    'messages' => [
        ['role' => 'system', 'content' => $systemPrompt],
        ['role' => 'user', 'content' => $prompt]
    ],
    'max_tokens' => 500,
    'temperature' => 0.7
];

curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => json_encode($data),
    CURLOPT_HTTPHEADER => [
        'Content-Type: application/json',
        'Authorization: Bearer ' . $apiKey
    ],
    CURLOPT_TIMEOUT => 30
]);

$response = curl_exec($ch);
$curlError = curl_error($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

// Debug: log errors
if ($curlError) {
    echo json_encode(['success' => false, 'error' => 'cURL error: ' . $curlError]);
    exit;
}

if ($httpCode !== 200) {
    $errorData = json_decode($response, true);
    $openAiError = $errorData['error'] ?? null;

    $errorMessage = is_array($openAiError)
        ? ($openAiError['message'] ?? null)
        : null;

    // Fallback: show a short response snippet (useful when OpenAI returns non-JSON HTML/text)
    $snippet = $response ? mb_substr(trim($response), 0, 400) : null;

    echo json_encode([
        'success' => false,
        'error' => 'OpenAI API error: ' . ($errorMessage ?: ('HTTP ' . $httpCode)),
        'httpCode' => $httpCode,
        'openai' => [
            'type' => is_array($openAiError) ? ($openAiError['type'] ?? null) : null,
            'code' => is_array($openAiError) ? ($openAiError['code'] ?? null) : null,
            'param' => is_array($openAiError) ? ($openAiError['param'] ?? null) : null,
            'snippet' => $errorMessage ? null : $snippet,
        ],
    ]);
    exit;
}

$result = json_decode($response, true);

if (!$result || !isset($result['choices'][0]['message']['content'])) {
    echo json_encode(['success' => false, 'error' => 'Invalid OpenAI response']);
    exit;
}

$content = $result['choices'][0]['message']['content'];

// Parse JSON from response - handle various formats
$content = trim($content);
$content = preg_replace('/^```json\s*/i', '', $content);
$content = preg_replace('/^```\s*/i', '', $content);
$content = preg_replace('/\s*```$/i', '', $content);

$seo = json_decode($content, true);

if ($seo && isset($seo['title'])) {
    echo json_encode([
        'success' => true,
        'seo' => $seo
    ]);
} else {
    // Fallback with better defaults
    echo json_encode([
        'success' => true,
        'seo' => [
            'title' => substr($name ?: 'Página Otimizada', 0, 60),
            'description' => substr($description ?: $name ?: 'Página otimizada para SEO', 0, 160),
            'keywords' => array_filter(array_map('trim', explode(' ', strtolower($name ?: 'seo landing page'))))
        ],
        'fallback' => true
    ]);
}
