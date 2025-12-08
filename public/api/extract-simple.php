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
$url = $input['url'] ?? '';

if (empty($url)) {
    echo json_encode(['success' => false, 'error' => 'URL is required']);
    exit();
}

function fetchPageHtml(string $url): array {
    $ch = curl_init();
    
    $userAgents = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    ];
    
    $userAgent = $userAgents[array_rand($userAgents)];
    
    curl_setopt_array($ch, [
        CURLOPT_URL => $url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_MAXREDIRS => 10,
        CURLOPT_TIMEOUT => 30,
        CURLOPT_CONNECTTIMEOUT => 15,
        CURLOPT_SSL_VERIFYPEER => false,
        CURLOPT_SSL_VERIFYHOST => false,
        CURLOPT_ENCODING => 'gzip, deflate',
        CURLOPT_USERAGENT => $userAgent,
        CURLOPT_HTTPHEADER => [
            'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language: pt-BR,pt;q=0.9,en;q=0.8',
            'Cache-Control: no-cache',
            'Connection: keep-alive'
        ]
    ]);
    
    $html = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);
    
    if ($error) {
        return ['success' => false, 'error' => "Erro de conexão: $error"];
    }
    
    if ($httpCode >= 400) {
        return ['success' => false, 'error' => "Erro HTTP $httpCode - Site bloqueou acesso. Use Instant Data Scraper."];
    }
    
    if (empty($html) || strlen($html) < 500) {
        return ['success' => false, 'error' => "Resposta vazia. Use Instant Data Scraper."];
    }
    
    return ['success' => true, 'html' => $html];
}

function extractJsonLdProduct(string $html): ?array {
    if (preg_match_all('/<script[^>]*type=["\']application\/ld\+json["\'][^>]*>(.*?)<\/script>/si', $html, $matches)) {
        foreach ($matches[1] as $json) {
            $decoded = json_decode(trim($json), true);
            if (!$decoded) continue;
            
            // Check if it's a product directly
            if (isset($decoded['@type']) && $decoded['@type'] === 'Product') {
                return $decoded;
            }
            
            // Check if it's inside @graph
            if (isset($decoded['@graph']) && is_array($decoded['@graph'])) {
                foreach ($decoded['@graph'] as $item) {
                    if (isset($item['@type']) && $item['@type'] === 'Product') {
                        return $item;
                    }
                }
            }
            
            // Check if it's an array of items
            if (is_array($decoded) && !isset($decoded['@type'])) {
                foreach ($decoded as $item) {
                    if (isset($item['@type']) && $item['@type'] === 'Product') {
                        return $item;
                    }
                }
            }
        }
    }
    return null;
}

function extractMetaTags(string $html): array {
    $meta = [];
    
    // OG tags
    if (preg_match('/<meta[^>]*property=["\']og:title["\'][^>]*content=["\']([^"\']+)["\']/i', $html, $m)) {
        $meta['title'] = html_entity_decode($m[1], ENT_QUOTES, 'UTF-8');
    }
    if (preg_match('/<meta[^>]*property=["\']og:description["\'][^>]*content=["\']([^"\']+)["\']/i', $html, $m)) {
        $meta['description'] = html_entity_decode($m[1], ENT_QUOTES, 'UTF-8');
    }
    if (preg_match('/<meta[^>]*property=["\']og:image["\'][^>]*content=["\']([^"\']+)["\']/i', $html, $m)) {
        $meta['image'] = $m[1];
    }
    
    // Product price meta
    if (preg_match('/<meta[^>]*property=["\']product:price:amount["\'][^>]*content=["\']([^"\']+)["\']/i', $html, $m)) {
        $meta['price'] = floatval(str_replace(',', '.', $m[1]));
    }
    
    // Title tag
    if (preg_match('/<title[^>]*>([^<]+)<\/title>/i', $html, $m)) {
        $meta['page_title'] = html_entity_decode(trim($m[1]), ENT_QUOTES, 'UTF-8');
    }
    
    return $meta;
}

function extractPriceFromHtml(string $html): ?float {
    // Common price patterns in Brazilian e-commerce
    $patterns = [
        // à vista / avista / pix patterns
        '/(?:à vista|a vista|avista|pix|no pix)[^R]*R\$\s*([\d.,]+)/i',
        '/R\$\s*([\d.,]+)[^<]*(?:à vista|a vista|avista|pix)/i',
        
        // Price in data attributes
        '/data-price=["\']?([\d.,]+)["\']?/i',
        '/data-product-price=["\']?([\d.,]+)["\']?/i',
        
        // Common class patterns for price
        '/class=["\'][^"\']*(?:price|preco|valor)[^"\']*["\'][^>]*>.*?R\$\s*([\d.,]+)/si',
        
        // Generic R$ pattern (last resort)
        '/R\$\s*([\d]+[.,][\d]{2})/i'
    ];
    
    foreach ($patterns as $pattern) {
        if (preg_match($pattern, $html, $m)) {
            $price = str_replace('.', '', $m[1]); // Remove thousand separator
            $price = str_replace(',', '.', $price); // Convert decimal separator
            $value = floatval($price);
            if ($value > 0 && $value < 1000000) { // Sanity check
                return $value;
            }
        }
    }
    
    return null;
}

function extractImages(string $html, string $baseUrl): array {
    $images = [];
    
    // Large product images
    if (preg_match_all('/<img[^>]*src=["\']([^"\']+)["\'][^>]*>/i', $html, $matches)) {
        foreach ($matches[1] as $src) {
            // Skip small images, icons, logos
            if (preg_match('/(logo|icon|sprite|banner|ad|tracking|pixel|avatar|thumb|small|mini|loading)/i', $src)) {
                continue;
            }
            
            // Make URL absolute
            if (strpos($src, '//') === 0) {
                $src = 'https:' . $src;
            } elseif (strpos($src, '/') === 0) {
                $parsed = parse_url($baseUrl);
                $src = $parsed['scheme'] . '://' . $parsed['host'] . $src;
            }
            
            if (strpos($src, 'http') === 0) {
                $images[] = $src;
            }
        }
    }
    
    // Images in data-src (lazy loading)
    if (preg_match_all('/data-src=["\']([^"\']+)["\']/', $html, $matches)) {
        foreach ($matches[1] as $src) {
            if (strpos($src, '//') === 0) {
                $src = 'https:' . $src;
            }
            if (strpos($src, 'http') === 0 && !preg_match('/(logo|icon|sprite)/i', $src)) {
                $images[] = $src;
            }
        }
    }
    
    return array_values(array_unique($images));
}

// Main extraction
$fetchResult = fetchPageHtml($url);
if (!$fetchResult['success']) {
    echo json_encode($fetchResult);
    exit();
}

$html = $fetchResult['html'];

// 1. Try JSON-LD first (most reliable)
$product = null;
$jsonLdProduct = extractJsonLdProduct($html);

if ($jsonLdProduct) {
    // Extract from JSON-LD
    $name = $jsonLdProduct['name'] ?? null;
    $description = $jsonLdProduct['description'] ?? null;
    $image = null;
    
    // Get image
    if (isset($jsonLdProduct['image'])) {
        if (is_array($jsonLdProduct['image'])) {
            $image = $jsonLdProduct['image'][0] ?? null;
            if (is_array($image)) {
                $image = $image['url'] ?? $image['contentUrl'] ?? null;
            }
        } else {
            $image = $jsonLdProduct['image'];
        }
    }
    
    // Get price
    $price = null;
    if (isset($jsonLdProduct['offers'])) {
        $offers = $jsonLdProduct['offers'];
        if (isset($offers['price'])) {
            $price = floatval($offers['price']);
        } elseif (isset($offers['lowPrice'])) {
            $price = floatval($offers['lowPrice']);
        } elseif (is_array($offers) && isset($offers[0]['price'])) {
            $price = floatval($offers[0]['price']);
        }
    }
    
    if ($name) {
        $product = [
            'title' => $name,
            'description' => $description,
            'price' => $price,
            'images' => $image ? [$image] : []
        ];
    }
}

// 2. Fallback to meta tags
if (!$product) {
    $metaTags = extractMetaTags($html);
    
    $title = $metaTags['title'] ?? $metaTags['page_title'] ?? null;
    $description = $metaTags['description'] ?? null;
    $image = $metaTags['image'] ?? null;
    $price = $metaTags['price'] ?? null;
    
    if ($title) {
        $product = [
            'title' => $title,
            'description' => $description,
            'price' => $price,
            'images' => $image ? [$image] : []
        ];
    }
}

// 3. Try to find price in HTML if not found
if ($product && !$product['price']) {
    $htmlPrice = extractPriceFromHtml($html);
    if ($htmlPrice) {
        $product['price'] = $htmlPrice;
    }
}

// 4. Get more images if needed
if ($product && count($product['images']) < 3) {
    $allImages = extractImages($html, $url);
    foreach ($allImages as $img) {
        if (!in_array($img, $product['images'])) {
            $product['images'][] = $img;
        }
        if (count($product['images']) >= 5) break;
    }
}

if (!$product) {
    echo json_encode([
        'success' => false,
        'error' => 'Não foi possível extrair dados do produto. Use Instant Data Scraper.'
    ]);
    exit();
}

// Add URL
$product['url'] = $url;

echo json_encode([
    'success' => true,
    'product' => $product
]);
