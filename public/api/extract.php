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
$manualHtml = $input['html'] ?? '';

if (empty($apiKey)) {
    echo json_encode(['success' => false, 'error' => 'API Key é obrigatória']);
    exit();
}

if (empty($url) && empty($manualHtml)) {
    echo json_encode(['success' => false, 'error' => 'URL ou HTML são obrigatórios']);
    exit();
}

function fetchPageHtml($url) {
    $ch = curl_init();
    
    // More realistic browser headers to bypass anti-bot protection
    $headers = [
        'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Language: pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept-Encoding: gzip, deflate, br',
        'Cache-Control: max-age=0',
        'Sec-Ch-Ua: "Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
        'Sec-Ch-Ua-Mobile: ?0',
        'Sec-Ch-Ua-Platform: "Windows"',
        'Sec-Fetch-Dest: document',
        'Sec-Fetch-Mode: navigate',
        'Sec-Fetch-Site: none',
        'Sec-Fetch-User: ?1',
        'Upgrade-Insecure-Requests: 1',
        'Connection: keep-alive',
    ];
    
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_MAXREDIRS, 5);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
    curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    curl_setopt($ch, CURLOPT_TIMEOUT, 45);
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 15);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_ENCODING, '');
    curl_setopt($ch, CURLOPT_COOKIEJAR, '/tmp/cookies.txt');
    curl_setopt($ch, CURLOPT_COOKIEFILE, '/tmp/cookies.txt');
    
    $html = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    $effectiveUrl = curl_getinfo($ch, CURLINFO_EFFECTIVE_URL);
    curl_close($ch);
    
    if ($error) {
        return ['success' => false, 'error' => 'Erro de conexão: ' . $error];
    }
    
    if ($httpCode === 403) {
        return ['success' => false, 'error' => 'Site bloqueou a requisição (403). Tente copiar o HTML manualmente ou use links de produtos individuais.'];
    }
    
    if ($httpCode === 503) {
        return ['success' => false, 'error' => 'Site com proteção anti-bot ativa (503). Tente novamente em alguns segundos.'];
    }
    
    if ($httpCode !== 200) {
        return ['success' => false, 'error' => 'Erro HTTP ' . $httpCode . '. O site pode estar bloqueando acessos automatizados.'];
    }
    
    if (empty($html) || strlen($html) < 1000) {
        return ['success' => false, 'error' => 'Página retornou conteúdo vazio ou muito pequeno. O site pode usar JavaScript para carregar produtos.'];
    }
    
    // Check for common anti-bot indicators
    if (stripos($html, 'captcha') !== false || stripos($html, 'challenge') !== false) {
        return ['success' => false, 'error' => 'Site requer verificação de CAPTCHA. Tente extrair produtos individuais.'];
    }
    
    return ['success' => true, 'html' => $html, 'effectiveUrl' => $effectiveUrl];
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

// Extract product links from listing pages (for Kabum and similar)
function extractProductLinks($html, $baseUrl) {
    $links = [];
    
    // Extract href links that look like product pages
    preg_match_all('/href=["\']([^"\']*produto[^"\']*)["\']|href=["\']([^"\']*\/p\/[^"\']*)["\']|href=["\']([^"\']*product[^"\']*)["\']|href=["\']([^"\']*item[^"\']*)["\']/', $html, $matches);
    
    foreach ($matches as $matchGroup) {
        foreach ($matchGroup as $link) {
            if (!empty($link) && strpos($link, '#') !== 0) {
                // Make absolute URL
                if (strpos($link, 'http') !== 0) {
                    $parsedBase = parse_url($baseUrl);
                    $link = $parsedBase['scheme'] . '://' . $parsedBase['host'] . $link;
                }
                $links[] = $link;
            }
        }
    }
    
    return array_values(array_unique($links));
}

// Use manual HTML if provided, otherwise fetch from URL
if (!empty($manualHtml)) {
    $html = $manualHtml;
} else {
    $fetchResult = fetchPageHtml($url);
    if (!$fetchResult['success']) {
        echo json_encode($fetchResult);
        exit();
    }
    $html = $fetchResult['html'];
}

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
    // For Mercado Livre and similar sites, try to extract product links first
    $isMercadoLivre = strpos($url, 'mercadolivre.com') !== false || strpos($url, 'mercadolibre.com') !== false;
    $isKabum = strpos($url, 'kabum.com') !== false;
    
    // Try to find product links in the HTML
    $productLinks = [];
    
    if ($isMercadoLivre) {
        // Mercado Livre product links patterns
        preg_match_all('/href=["\']([^"\']*MLB[0-9]+[^"\']*)["\']/', $html, $mlbMatches);
        foreach ($mlbMatches[1] as $link) {
            if (strpos($link, '/p/') !== false || strpos($link, 'produto') !== false || preg_match('/MLB[0-9]+/', $link)) {
                if (strpos($link, 'http') !== 0) {
                    $link = 'https://www.mercadolivre.com.br' . $link;
                }
                // Clean up the link
                $link = preg_replace('/\?.*$/', '', $link);
                if (!in_array($link, $productLinks)) {
                    $productLinks[] = $link;
                }
            }
        }
        
        // Also try to find in JSON data
        preg_match_all('/"permalink"\s*:\s*"([^"]+)"/', $html, $permalinkMatches);
        foreach ($permalinkMatches[1] as $link) {
            $link = str_replace('\\/', '/', $link);
            if (!in_array($link, $productLinks)) {
                $productLinks[] = $link;
            }
        }
    }
    
    if ($isKabum) {
        // Kabum product links
        preg_match_all('/href=["\']([^"\']*\/produto\/[^"\']+)["\']/', $html, $kabumMatches);
        foreach ($kabumMatches[1] as $link) {
            if (strpos($link, 'http') !== 0) {
                $link = 'https://www.kabum.com.br' . $link;
            }
            if (!in_array($link, $productLinks)) {
                $productLinks[] = $link;
            }
        }
    }
    
    // Limit to 20 links
    $productLinks = array_slice(array_unique($productLinks), 0, 20);
    
    // For store pages, try to find products in JSON data first
    $systemPrompt = 'Você é um especialista em extrair produtos de páginas de lojas online. Analise o HTML e JSON para encontrar TODOS os produtos listados na página. Procure por cards de produtos, listas, grids. Retorne APENAS JSON válido.';
    
    $prompt = "Extraia TODOS os produtos desta página de loja.

DADOS PRÉ-EXTRAÍDOS:
" . json_encode($preExtracted, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "

LINKS DE PRODUTOS ENCONTRADOS:
" . json_encode($productLinks, JSON_PRETTY_PRINT) . "

HTML (parcial):
" . substr($cleanedHtml, 0, 45000) . "

Procure por:
- Dados de produtos em formato JSON dentro do HTML (procure por 'initialState', 'products', 'items')
- Cards de produtos com nome, preço e imagem
- Listas ou grids de produtos

Retorne um JSON array:
[{
  \"title\": \"nome completo do produto\", 
  \"price\": 0.00, 
  \"image\": \"url da imagem\", 
  \"link\": \"url do produto\",
  \"category\": \"categoria\"
}]

IMPORTANTE:
- Se encontrar dados JSON com produtos, extraia TODOS
- O preço deve ser número (sem R$)
- Se não encontrar produtos no HTML mas encontrar links, crie items com os links
- Para links relativos, converta para absolutos
- Se não encontrar nada, retorne array vazio []";

    $aiResult = callOpenAI($apiKey, $prompt, $systemPrompt);
    
    if (!$aiResult['success']) {
        echo json_encode($aiResult);
        exit();
    }
    
    $content = preg_replace('/```json\s*/', '', $aiResult['content']);
    $content = preg_replace('/```\s*/', '', $content);
    $productsData = json_decode(trim($content), true);
    
    // If AI didn't find products but we have product links, create basic items from links
    if ((!$productsData || count($productsData) === 0) && count($productLinks) > 0) {
        $productsData = [];
        foreach ($productLinks as $link) {
            // Extract product ID from URL for title
            preg_match('/MLB[0-9]+/', $link, $idMatch);
            $productId = $idMatch[0] ?? 'Produto';
            
            $productsData[] = [
                'title' => 'Produto ' . $productId . ' (clique + para extrair detalhes)',
                'price' => null,
                'image' => '',
                'link' => $link,
                'category' => 'acessorio',
                'needsExtraction' => true
            ];
        }
        
        echo json_encode([
            'success' => true, 
            'type' => 'store', 
            'data' => $productsData, 
            'count' => count($productsData), 
            'sourceUrl' => $url,
            'note' => 'Links de produtos encontrados. Clique em cada produto para extrair detalhes completos.'
        ]);
        exit();
    }
    
    if (!$productsData || !is_array($productsData)) {
        // Return product links if found
        if (count($productLinks) > 0) {
            echo json_encode([
                'success' => true,
                'type' => 'links',
                'data' => $productLinks,
                'count' => count($productLinks),
                'note' => 'Não foi possível extrair detalhes dos produtos, mas encontramos ' . count($productLinks) . ' links. Copie e extraia cada produto individualmente.'
            ]);
            exit();
        }
        
        echo json_encode([
            'success' => false, 
            'error' => 'Não foi possível extrair produtos. O site usa JavaScript para carregar os produtos. Use o modo "Colar HTML" - abra DevTools (F12), aba Elements, clique com botão direito no <html> e copie o outerHTML.',
            'hint' => 'Para Mercado Livre: abra a página, pressione F12, vá em Elements, clique direito no <html>, Copy > Copy outerHTML'
        ]);
        exit();
    }
    
    if (count($productsData) === 0) {
        if (count($productLinks) > 0) {
            echo json_encode([
                'success' => true,
                'type' => 'links',
                'data' => $productLinks,
                'count' => count($productLinks),
                'note' => 'Produtos não extraídos automaticamente, mas encontramos ' . count($productLinks) . ' links de produtos.'
            ]);
            exit();
        }
        
        echo json_encode([
            'success' => false, 
            'error' => 'Nenhum produto encontrado na página. O site carrega produtos via JavaScript.',
            'hint' => 'Tente usar links de produtos individuais ou o modo "Colar HTML".'
        ]);
        exit();
    }
    
    echo json_encode(['success' => true, 'type' => 'store', 'data' => $productsData, 'count' => count($productsData), 'sourceUrl' => $url]);
}
?>
