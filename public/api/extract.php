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
$extractType = $input['extractType'] ?? 'product';

if (empty($url) || empty($apiKey)) {
    echo json_encode(['success' => false, 'error' => 'URL e API Key são obrigatórios']);
    exit();
}

function fetchPageHtml($url) {
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    
    $html = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);
    
    if ($error) return ['success' => false, 'error' => 'Erro: ' . $error];
    if ($httpCode !== 200) return ['success' => false, 'error' => 'HTTP Error: ' . $httpCode];
    
    return ['success' => true, 'html' => $html];
}

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
    
    if ($error) return ['success' => false, 'error' => 'OpenAI Error: ' . $error];
    
    $result = json_decode($response, true);
    
    if (isset($result['error'])) {
        return ['success' => false, 'error' => 'OpenAI: ' . $result['error']['message']];
    }
    
    return ['success' => true, 'content' => $result['choices'][0]['message']['content']];
}

function cleanHtml($html) {
    $html = preg_replace('/<script\b[^>]*>(.*?)<\/script>/is', '', $html);
    $html = preg_replace('/<style\b[^>]*>(.*?)<\/style>/is', '', $html);
    $html = preg_replace('/<!--.*?-->/s', '', $html);
    $html = preg_replace('/\s+/', ' ', $html);
    
    if (strlen($html) > 50000) $html = substr($html, 0, 50000);
    
    return trim($html);
}

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

$fetchResult = fetchPageHtml($url);
if (!$fetchResult['success']) {
    echo json_encode($fetchResult);
    exit();
}

$html = $fetchResult['html'];
$cleanedHtml = cleanHtml($html);
$foundImages = extractImages($html);

if ($extractType === 'product') {
    $systemPrompt = 'Você é um especialista em extrair dados de produtos. Retorne APENAS JSON válido, sem markdown.';
    
    $prompt = "Extraia os dados do produto desta página HTML e retorne um JSON com esta estrutura:
{
  \"title\": \"nome do produto\",
  \"price\": 0.00,
  \"description\": \"descrição curta do produto\",
  \"brand\": \"marca\",
  \"model\": \"modelo\",
  \"category\": \"categoria do produto (use uma dessas: headset, mouse, teclado, monitor, notebook, pc, placa-de-video, processador, memoria, armazenamento, fonte, gabinete, placa-mae, cooler, cadeira, webcam, microfone, caixa-de-som, controle, acessorio)\",
  \"specs\": {
    \"Nome da Especificação\": \"valor\",
    \"Outra Especificação\": \"valor\"
  },
  \"images\": [\"url1\", \"url2\"]
}

IMPORTANTE para specs:
- Extraia TODAS as especificações técnicas do produto
- Use nomes descritivos para as chaves (ex: \"Duração da Bateria\", \"Conexão\", \"Driver\", \"Frequência de Resposta\", \"Peso\", \"Cor\", \"Compatibilidade\")
- O valor deve ser apenas o dado (ex: \"24 horas\", \"Bluetooth 5.0\", \"40mm\")
- NÃO use nomes genéricos como spec_1, spec_2

Se não encontrar algum campo, use null. Para price, use apenas números.

HTML da página:
" . $cleanedHtml;

    $aiResult = callOpenAI($apiKey, $prompt, $systemPrompt);
    
    if (!$aiResult['success']) {
        echo json_encode($aiResult);
        exit();
    }
    
    $content = preg_replace('/```json\s*/', '', $aiResult['content']);
    $content = preg_replace('/```\s*/', '', $content);
    $productData = json_decode(trim($content), true);
    
    if (!$productData) {
        echo json_encode(['success' => false, 'error' => 'Não foi possível extrair dados']);
        exit();
    }
    
    if (empty($productData['images']) && !empty($foundImages)) {
        $productData['images'] = $foundImages;
    }
    
    echo json_encode(['success' => true, 'type' => 'product', 'data' => $productData, 'sourceUrl' => $url]);
    
} else {
    $systemPrompt = 'Você é um especialista em extrair produtos de lojas. Retorne APENAS JSON válido.';
    
    $prompt = "Extraia TODOS os produtos desta página e retorne um JSON array:
[{
  \"title\": \"nome\", 
  \"price\": 0.00, 
  \"image\": \"url\", 
  \"link\": \"url\",
  \"category\": \"categoria (headset, mouse, teclado, monitor, notebook, acessorio, etc)\"
}]

HTML: " . $cleanedHtml;

    $aiResult = callOpenAI($apiKey, $prompt, $systemPrompt);
    
    if (!$aiResult['success']) {
        echo json_encode($aiResult);
        exit();
    }
    
    $content = preg_replace('/```json\s*/', '', $aiResult['content']);
    $content = preg_replace('/```\s*/', '', $content);
    $productsData = json_decode(trim($content), true);
    
    if (!$productsData || !is_array($productsData)) {
        echo json_encode(['success' => false, 'error' => 'Não foi possível extrair produtos']);
        exit();
    }
    
    echo json_encode(['success' => true, 'type' => 'store', 'data' => $productsData, 'count' => count($productsData), 'sourceUrl' => $url]);
}
?>
