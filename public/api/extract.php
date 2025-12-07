<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit();
}

$input = json_decode(file_get_contents('php://input'), true);

$url = $input['url'] ?? '';
$apiKey = $input['apiKey'] ?? '';
$extractType = $input['extractType'] ?? 'product'; // 'product' or 'store'

if (empty($url) || empty($apiKey)) {
    echo json_encode(['success' => false, 'error' => 'URL e API Key são obrigatórios']);
    exit();
}

// Function to fetch page HTML
function fetchPageHtml($url) {
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language: pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
    ]);
    
    $html = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);
    
    if ($error) {
        return ['success' => false, 'error' => 'Erro ao acessar URL: ' . $error];
    }
    
    if ($httpCode !== 200) {
        return ['success' => false, 'error' => 'HTTP Error: ' . $httpCode];
    }
    
    return ['success' => true, 'html' => $html];
}

// Function to call OpenAI API
function callOpenAI($apiKey, $prompt, $systemPrompt) {
    $ch = curl_init();
    
    $data = [
        'model' => 'gpt-4o-mini',
        'messages' => [
            ['role' => 'system', 'content' => $systemPrompt],
            ['role' => 'user', 'content' => $prompt]
        ],
        'temperature' => 0.1,
        'max_tokens' => 4000
    ];
    
    curl_setopt($ch, CURLOPT_URL, 'https://api.openai.com/v1/chat/completions');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Authorization: Bearer ' . $apiKey
    ]);
    curl_setopt($ch, CURLOPT_TIMEOUT, 120);
    
    $response = curl_exec($ch);
    $error = curl_error($ch);
    curl_close($ch);
    
    if ($error) {
        return ['success' => false, 'error' => 'OpenAI Error: ' . $error];
    }
    
    $result = json_decode($response, true);
    
    if (isset($result['error'])) {
        return ['success' => false, 'error' => 'OpenAI: ' . $result['error']['message']];
    }
    
    return ['success' => true, 'content' => $result['choices'][0]['message']['content']];
}

// Clean HTML to reduce tokens
function cleanHtml($html) {
    // Remove scripts and styles
    $html = preg_replace('/<script\b[^>]*>(.*?)<\/script>/is', '', $html);
    $html = preg_replace('/<style\b[^>]*>(.*?)<\/style>/is', '', $html);
    $html = preg_replace('/<!--.*?-->/s', '', $html);
    
    // Remove extra whitespace
    $html = preg_replace('/\s+/', ' ', $html);
    
    // Limit size to avoid token limits
    if (strlen($html) > 50000) {
        $html = substr($html, 0, 50000);
    }
    
    return trim($html);
}

// Extract images from HTML
function extractImages($html) {
    $images = [];
    preg_match_all('/<img[^>]+src=["\']([^"\']+)["\'][^>]*>/i', $html, $matches);
    
    foreach ($matches[1] as $src) {
        if (strpos($src, 'http') === 0 && !preg_match('/logo|icon|avatar|sprite|placeholder/i', $src)) {
            $images[] = $src;
        }
    }
    
    return array_unique(array_slice($images, 0, 10));
}

// Fetch the page
$fetchResult = fetchPageHtml($url);
if (!$fetchResult['success']) {
    echo json_encode($fetchResult);
    exit();
}

$html = $fetchResult['html'];
$cleanedHtml = cleanHtml($html);
$foundImages = extractImages($html);

if ($extractType === 'product') {
    // Single product extraction
    $systemPrompt = 'Você é um especialista em extrair dados de produtos de páginas HTML. Retorne APENAS um JSON válido, sem markdown ou explicações.';
    
    $prompt = "Extraia os dados do produto desta página HTML e retorne um JSON com esta estrutura exata:
{
  \"title\": \"nome do produto\",
  \"price\": 0.00,
  \"description\": \"descrição do produto\",
  \"brand\": \"marca\",
  \"model\": \"modelo\",
  \"specs\": [\"especificação 1\", \"especificação 2\"],
  \"images\": [\"url1\", \"url2\"]
}

Se não encontrar algum campo, use null. Para price, use apenas números.

HTML da página:
" . $cleanedHtml;

    $aiResult = callOpenAI($apiKey, $prompt, $systemPrompt);
    
    if (!$aiResult['success']) {
        echo json_encode($aiResult);
        exit();
    }
    
    // Parse the JSON response
    $content = $aiResult['content'];
    $content = preg_replace('/```json\s*/', '', $content);
    $content = preg_replace('/```\s*/', '', $content);
    $content = trim($content);
    
    $productData = json_decode($content, true);
    
    if (!$productData) {
        echo json_encode(['success' => false, 'error' => 'Não foi possível extrair dados do produto']);
        exit();
    }
    
    // Add found images if AI didn't find any
    if (empty($productData['images']) && !empty($foundImages)) {
        $productData['images'] = $foundImages;
    }
    
    echo json_encode([
        'success' => true,
        'type' => 'product',
        'data' => $productData,
        'sourceUrl' => $url
    ]);
    
} else {
    // Store/listing extraction - multiple products
    $systemPrompt = 'Você é um especialista em extrair dados de produtos de páginas de lojas/listings. Retorne APENAS um JSON válido, sem markdown ou explicações.';
    
    $prompt = "Extraia TODOS os produtos desta página de loja/listing e retorne um JSON array com esta estrutura:
[
  {
    \"title\": \"nome do produto\",
    \"price\": 0.00,
    \"image\": \"url da imagem\",
    \"link\": \"url do produto (se disponível)\"
  }
]

Se não encontrar algum campo, use null. Para price, use apenas números. Extraia o máximo de produtos possível.

HTML da página:
" . $cleanedHtml;

    $aiResult = callOpenAI($apiKey, $prompt, $systemPrompt);
    
    if (!$aiResult['success']) {
        echo json_encode($aiResult);
        exit();
    }
    
    // Parse the JSON response
    $content = $aiResult['content'];
    $content = preg_replace('/```json\s*/', '', $content);
    $content = preg_replace('/```\s*/', '', $content);
    $content = trim($content);
    
    $productsData = json_decode($content, true);
    
    if (!$productsData || !is_array($productsData)) {
        echo json_encode(['success' => false, 'error' => 'Não foi possível extrair produtos da página']);
        exit();
    }
    
    echo json_encode([
        'success' => true,
        'type' => 'store',
        'data' => $productsData,
        'count' => count($productsData),
        'sourceUrl' => $url
    ]);
}
?>
