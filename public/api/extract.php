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
    curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language: pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
        'Cache-Control: no-cache',
        'Pragma: no-cache',
    ]);
    curl_setopt($ch, CURLOPT_ENCODING, 'gzip, deflate');
    
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

// Extract JSON-LD structured data
function extractJsonLd($html) {
    $jsonLdData = [];
    preg_match_all('/<script[^>]*type=["\']application\/ld\+json["\'][^>]*>(.*?)<\/script>/is', $html, $matches);
    
    foreach ($matches[1] as $json) {
        $decoded = json_decode(trim($json), true);
        if ($decoded) {
            $jsonLdData[] = $decoded;
        }
    }
    
    return $jsonLdData;
}

// Extract meta tags
function extractMetaTags($html) {
    $meta = [];
    
    // Open Graph
    preg_match('/<meta[^>]+property=["\']og:title["\'][^>]+content=["\']([^"\']+)["\'][^>]*>/i', $html, $m);
    if (!empty($m[1])) $meta['title'] = html_entity_decode($m[1], ENT_QUOTES, 'UTF-8');
    
    preg_match('/<meta[^>]+property=["\']og:description["\'][^>]+content=["\']([^"\']+)["\'][^>]*>/i', $html, $m);
    if (!empty($m[1])) $meta['description'] = html_entity_decode($m[1], ENT_QUOTES, 'UTF-8');
    
    preg_match('/<meta[^>]+property=["\']og:image["\'][^>]+content=["\']([^"\']+)["\'][^>]*>/i', $html, $m);
    if (!empty($m[1])) $meta['image'] = $m[1];
    
    // Also try content before property
    if (empty($meta['title'])) {
        preg_match('/<meta[^>]+content=["\']([^"\']+)["\'][^>]+property=["\']og:title["\'][^>]*>/i', $html, $m);
        if (!empty($m[1])) $meta['title'] = html_entity_decode($m[1], ENT_QUOTES, 'UTF-8');
    }
    
    if (empty($meta['image'])) {
        preg_match('/<meta[^>]+content=["\']([^"\']+)["\'][^>]+property=["\']og:image["\'][^>]*>/i', $html, $m);
        if (!empty($m[1])) $meta['image'] = $m[1];
    }
    
    // Title tag fallback
    if (empty($meta['title'])) {
        preg_match('/<title[^>]*>([^<]+)<\/title>/i', $html, $m);
        if (!empty($m[1])) $meta['title'] = html_entity_decode(trim($m[1]), ENT_QUOTES, 'UTF-8');
    }
    
    // Try to find price in various formats
    preg_match('/R\$\s*([\d.,]+)/i', $html, $m);
    if (!empty($m[1])) {
        $price = str_replace('.', '', $m[1]);
        $price = str_replace(',', '.', $price);
        $meta['price'] = floatval($price);
    }
    
    // Look for price in JSON data
    preg_match('/"price"\s*:\s*"?([\d.,]+)"?/i', $html, $m);
    if (!empty($m[1]) && empty($meta['price'])) {
        $price = str_replace('.', '', $m[1]);
        $price = str_replace(',', '.', $price);
        $meta['price'] = floatval($price);
    }
    
    return $meta;
}

function extractImages($html) {
    $images = [];
    
    // Regular img tags
    preg_match_all('/<img[^>]+src=["\']([^"\']+)["\'][^>]*>/i', $html, $matches);
    foreach ($matches[1] as $src) {
        if (strpos($src, 'http') === 0 && !preg_match('/logo|icon|avatar|sprite|placeholder|pixel|tracking/i', $src)) {
            $images[] = $src;
        }
    }
    
    // Data-src (lazy loading)
    preg_match_all('/data-src=["\']([^"\']+)["\']|data-zoom=["\']([^"\']+)["\']|data-srcset=["\']([^"\']+)["\']|data-full-image=["\']([^"\']+)["\']|data-large=["\']([^"\']+)["\']/', $html, $matches);
    foreach ($matches[0] as $i => $match) {
        for ($j = 1; $j <= 5; $j++) {
            if (!empty($matches[$j][$i]) && strpos($matches[$j][$i], 'http') === 0) {
                $images[] = $matches[$j][$i];
            }
        }
    }
    
    // JSON image URLs
    preg_match_all('/"(?:image|thumbnail|picture|img|photo|src)":\s*"(https?:[^"]+)"/i', $html, $matches);
    foreach ($matches[1] as $src) {
        if (!preg_match('/logo|icon|avatar|sprite|placeholder|pixel|tracking/i', $src)) {
            $images[] = str_replace('\\/', '/', $src);
        }
    }
    
    return array_values(array_unique(array_slice($images, 0, 15)));
}

function cleanHtml($html) {
    $html = preg_replace('/<script\b[^>]*>(.*?)<\/script>/is', '', $html);
    $html = preg_replace('/<style\b[^>]*>(.*?)<\/style>/is', '', $html);
    $html = preg_replace('/<!--.*?-->/s', '', $html);
    $html = preg_replace('/\s+/', ' ', $html);
    
    if (strlen($html) > 50000) $html = substr($html, 0, 50000);
    
    return trim($html);
}

$fetchResult = fetchPageHtml($url);
if (!$fetchResult['success']) {
    echo json_encode($fetchResult);
    exit();
}

$html = $fetchResult['html'];
$jsonLdData = extractJsonLd($html);
$metaTags = extractMetaTags($html);
$foundImages = extractImages($html);
$cleanedHtml = cleanHtml($html);

// Build pre-extracted data to help the AI
$preExtracted = [
    'jsonLd' => $jsonLdData,
    'meta' => $metaTags,
    'images' => $foundImages
];

if ($extractType === 'product') {
    $systemPrompt = 'Você é um especialista em extrair dados de produtos de páginas web. Analise todos os dados fornecidos (JSON-LD, meta tags, HTML) para extrair informações do produto. Retorne APENAS JSON válido, sem markdown.';
    
    $prompt = "Extraia os dados do produto usando as informações abaixo.

DADOS PRÉ-EXTRAÍDOS:
" . json_encode($preExtracted, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "

HTML DA PÁGINA (parcial):
" . substr($cleanedHtml, 0, 30000) . "

Retorne um JSON com esta estrutura:
{
  \"title\": \"nome do produto\",
  \"price\": 0.00,
  \"description\": \"descrição curta do produto\",
  \"brand\": \"marca\",
  \"model\": \"modelo\",
  \"category\": \"categoria (headset, mouse, teclado, monitor, notebook, pc, placa-de-video, processador, memoria, armazenamento, fonte, gabinete, placa-mae, cooler, cadeira, webcam, microfone, caixa-de-som, controle, acessorio)\",
  \"specs\": {
    \"Nome da Especificação\": \"valor\"
  },
  \"images\": [\"url1\", \"url2\"]
}

IMPORTANTE:
- Use os dados de JSON-LD e meta tags como fonte principal
- Use as imagens já extraídas se não encontrar outras
- Para specs, use nomes descritivos (ex: \"Duração da Bateria\", \"Conexão\", \"Resolução\")
- Se não encontrar algum campo, use null
- Para price, use apenas números";

    $aiResult = callOpenAI($apiKey, $prompt, $systemPrompt);
    
    if (!$aiResult['success']) {
        echo json_encode($aiResult);
        exit();
    }
    
    $content = preg_replace('/```json\s*/', '', $aiResult['content']);
    $content = preg_replace('/```\s*/', '', $content);
    $productData = json_decode(trim($content), true);
    
    if (!$productData) {
        // Fallback to meta tags if AI fails
        $productData = [
            'title' => $metaTags['title'] ?? null,
            'price' => $metaTags['price'] ?? null,
            'description' => $metaTags['description'] ?? null,
            'brand' => null,
            'model' => null,
            'category' => 'acessorio',
            'specs' => [],
            'images' => $foundImages
        ];
    }
    
    // Ensure images are populated
    if (empty($productData['images']) && !empty($foundImages)) {
        $productData['images'] = $foundImages;
    }
    
    // Use meta image if no images found
    if (empty($productData['images']) && !empty($metaTags['image'])) {
        $productData['images'] = [$metaTags['image']];
    }
    
    echo json_encode(['success' => true, 'type' => 'product', 'data' => $productData, 'sourceUrl' => $url]);
    
} else {
    $systemPrompt = 'Você é um especialista em extrair produtos de lojas. Retorne APENAS JSON válido.';
    
    $prompt = "Extraia TODOS os produtos desta página.

DADOS PRÉ-EXTRAÍDOS:
" . json_encode($preExtracted, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "

HTML (parcial):
" . substr($cleanedHtml, 0, 40000) . "

Retorne um JSON array:
[{
  \"title\": \"nome\", 
  \"price\": 0.00, 
  \"image\": \"url\", 
  \"link\": \"url\",
  \"category\": \"categoria\"
}]

Se encontrar apenas 1 produto, retorne array com 1 item.";

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
