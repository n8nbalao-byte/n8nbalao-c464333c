<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit();
}

$input = json_decode(file_get_contents('php://input'), true);

$apiKey = $input['apiKey'] ?? '';
$url = $input['url'] ?? '';
$manualHtml = $input['manualHtml'] ?? '';

if (empty($apiKey)) {
    echo json_encode(['success' => false, 'error' => 'API key is required']);
    exit();
}

if (empty($url) && empty($manualHtml)) {
    echo json_encode(['success' => false, 'error' => 'URL or HTML content is required']);
    exit();
}

function fetchPageHtml(string $url): array {
    $ch = curl_init();
    
    // Headers mais robustos para simular navegador real
    $userAgents = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0'
    ];
    
    $userAgent = $userAgents[array_rand($userAgents)];
    
    curl_setopt_array($ch, [
        CURLOPT_URL => $url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_MAXREDIRS => 10,
        CURLOPT_TIMEOUT => 45,
        CURLOPT_CONNECTTIMEOUT => 20,
        CURLOPT_SSL_VERIFYPEER => false,
        CURLOPT_SSL_VERIFYHOST => false,
        CURLOPT_ENCODING => 'gzip, deflate, br',
        CURLOPT_USERAGENT => $userAgent,
        CURLOPT_HTTPHEADER => [
            'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language: pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
            'Accept-Encoding: gzip, deflate, br',
            'Cache-Control: no-cache',
            'Pragma: no-cache',
            'Sec-Ch-Ua: "Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
            'Sec-Ch-Ua-Mobile: ?0',
            'Sec-Ch-Ua-Platform: "Windows"',
            'Sec-Fetch-Dest: document',
            'Sec-Fetch-Mode: navigate',
            'Sec-Fetch-Site: none',
            'Sec-Fetch-User: ?1',
            'Upgrade-Insecure-Requests: 1',
            'Connection: keep-alive',
            'DNT: 1'
        ],
        CURLOPT_COOKIEJAR => '/tmp/extract_cookies_' . md5($url) . '.txt',
        CURLOPT_COOKIEFILE => '/tmp/extract_cookies_' . md5($url) . '.txt'
    ]);
    
    $html = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    $errno = curl_errno($ch);
    curl_close($ch);
    
    if ($errno) {
        return ['success' => false, 'error' => "Erro de conexão (código $errno): $error. Use a opção 'Colar HTML'."];
    }
    
    if ($httpCode === 403 || $httpCode === 401) {
        return ['success' => false, 'error' => "Acesso bloqueado ($httpCode). Use a opção 'Colar HTML' manualmente."];
    }
    
    if ($httpCode === 503 || $httpCode === 429) {
        return ['success' => false, 'error' => "Proteção anti-bot ativa ($httpCode). Use a opção 'Colar HTML' manualmente."];
    }
    
    if ($httpCode >= 400) {
        return ['success' => false, 'error' => "Erro HTTP $httpCode. Use a opção 'Colar HTML' manualmente."];
    }
    
    if (empty($html) || strlen($html) < 500) {
        return ['success' => false, 'error' => "Resposta vazia ou incompleta. Use a opção 'Colar HTML' manualmente."];
    }
    
    return ['success' => true, 'html' => $html];
}

function extractJsonLd(string $html): array {
    $jsonLdData = [];
    if (preg_match_all('/<script[^>]*type=["\']application\/ld\+json["\'][^>]*>(.*?)<\/script>/si', $html, $matches)) {
        foreach ($matches[1] as $json) {
            $decoded = json_decode(trim($json), true);
            if ($decoded) {
                $jsonLdData[] = $decoded;
            }
        }
    }
    return $jsonLdData;
}

function extractMetaTags(string $html): array {
    $meta = [];
    
    if (preg_match('/<meta[^>]*property=["\']og:title["\'][^>]*content=["\']([^"\']+)["\'][^>]*>/i', $html, $m)) {
        $meta['og_title'] = $m[1];
    }
    if (preg_match('/<meta[^>]*property=["\']og:description["\'][^>]*content=["\']([^"\']+)["\'][^>]*>/i', $html, $m)) {
        $meta['og_description'] = $m[1];
    }
    if (preg_match('/<meta[^>]*property=["\']og:image["\'][^>]*content=["\']([^"\']+)["\'][^>]*>/i', $html, $m)) {
        $meta['og_image'] = $m[1];
    }
    if (preg_match('/<meta[^>]*property=["\']product:price:amount["\'][^>]*content=["\']([^"\']+)["\'][^>]*>/i', $html, $m)) {
        $meta['price'] = $m[1];
    }
    if (preg_match('/<title[^>]*>([^<]+)<\/title>/i', $html, $m)) {
        $meta['title'] = trim($m[1]);
    }
    
    return $meta;
}

function extractImages(string $html): array {
    $images = [];
    
    if (preg_match_all('/<img[^>]*src=["\']([^"\']+)["\'][^>]*>/i', $html, $matches)) {
        foreach ($matches[1] as $src) {
            if (strpos($src, 'http') === 0 && 
                !preg_match('/(logo|icon|sprite|banner|ad|tracking|pixel|avatar)/i', $src)) {
                $images[] = $src;
            }
        }
    }
    
    if (preg_match_all('/data-src=["\']([^"\']+)["\']/', $html, $matches)) {
        foreach ($matches[1] as $src) {
            if (strpos($src, 'http') === 0) {
                $images[] = $src;
            }
        }
    }
    
    if (preg_match_all('/"(https?:\/\/[^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"/i', $html, $matches)) {
        foreach ($matches[1] as $src) {
            if (!preg_match('/(logo|icon|sprite|banner|ad|tracking)/i', $src)) {
                $images[] = $src;
            }
        }
    }
    
    return array_values(array_unique($images));
}

function cleanHtml(string $html): string {
    $html = preg_replace('/<script\b[^>]*>.*?<\/script>/si', '', $html);
    $html = preg_replace('/<style\b[^>]*>.*?<\/style>/si', '', $html);
    $html = preg_replace('/<!--.*?-->/s', '', $html);
    $html = preg_replace('/\s+/', ' ', $html);
    return trim($html);
}

function callOpenAI(string $apiKey, string $prompt, string $systemPrompt): array {
    $ch = curl_init('https://api.openai.com/v1/chat/completions');
    
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $apiKey
        ],
        CURLOPT_POSTFIELDS => json_encode([
            'model' => 'gpt-4o-mini',
            'messages' => [
                ['role' => 'system', 'content' => $systemPrompt],
                ['role' => 'user', 'content' => $prompt]
            ],
            'temperature' => 0.1,
            'max_tokens' => 2000
        ])
    ]);
    
    $response = curl_exec($ch);
    $error = curl_error($ch);
    curl_close($ch);
    
    if ($error) {
        return ['success' => false, 'error' => "OpenAI API error: $error"];
    }
    
    $data = json_decode($response, true);
    
    if (isset($data['error'])) {
        return ['success' => false, 'error' => $data['error']['message'] ?? 'OpenAI API error'];
    }
    
    $content = $data['choices'][0]['message']['content'] ?? '';
    return ['success' => true, 'content' => $content];
}

// Get HTML content
if (!empty($manualHtml)) {
    $html = $manualHtml;
} else {
    $fetchResult = fetchPageHtml($url);
    if (!$fetchResult['success']) {
        echo json_encode(['success' => false, 'error' => $fetchResult['error']]);
        exit();
    }
    $html = $fetchResult['html'];
}

// Extract structured data
$jsonLd = extractJsonLd($html);
$metaTags = extractMetaTags($html);
$images = extractImages($html);
$cleanedHtml = cleanHtml($html);

// Limit HTML size for API
$htmlForAI = substr($cleanedHtml, 0, 15000);

// Build context
$context = "=== META TAGS ===\n" . json_encode($metaTags, JSON_UNESCAPED_UNICODE) . "\n\n";
$context .= "=== JSON-LD ===\n" . json_encode($jsonLd, JSON_UNESCAPED_UNICODE) . "\n\n";
$context .= "=== IMAGES ===\n" . json_encode(array_slice($images, 0, 10), JSON_UNESCAPED_UNICODE) . "\n\n";
$context .= "=== HTML CONTENT ===\n" . $htmlForAI;

$systemPrompt = "You are a product data extractor. Extract product information from the provided HTML/JSON data. 
Return ONLY a valid JSON object with no markdown, no code blocks, just pure JSON.
If you cannot find a value, use null.";

$prompt = "Extract product information from this page data and return a JSON object with these fields:
- title: product name/title
- price: numeric price (just the number, no currency symbol)
- description: product description
- brand: brand/manufacturer
- model: model name/number
- category: product category (e.g., 'notebook', 'pc', 'acessorio', 'software', 'monitor', 'hardware')
- specs: object with specification key-value pairs
- images: array of image URLs (use the provided images list)
- link: original product URL

PAGE DATA:
$context

Original URL: $url";

$aiResult = callOpenAI($apiKey, $prompt, $systemPrompt);

if (!$aiResult['success']) {
    echo json_encode(['success' => false, 'error' => $aiResult['error']]);
    exit();
}

// Parse AI response
$content = $aiResult['content'];
$content = preg_replace('/```json\s*/', '', $content);
$content = preg_replace('/```\s*/', '', $content);
$content = trim($content);

$product = json_decode($content, true);

if (!$product) {
    echo json_encode([
        'success' => false, 
        'error' => 'Failed to parse product data',
        'raw' => $content
    ]);
    exit();
}

// Ensure images array
if (empty($product['images']) && !empty($images)) {
    $product['images'] = array_slice($images, 0, 5);
}

// Set link if not present
if (empty($product['link']) && !empty($url)) {
    $product['link'] = $url;
}

echo json_encode([
    'success' => true,
    'product' => $product
]);
