<?php
// Search Product Images API - Uses Google Custom Search or free alternatives
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
$query = $input['query'] ?? '';
$productId = $input['productId'] ?? '';

if (empty($query)) {
    echo json_encode(['success' => false, 'error' => 'Query is required']);
    exit;
}

// Clean up search query for product images
$searchQuery = $query . ' product image png transparent';

// Try using DuckDuckGo Images (free, no API key needed)
function searchDuckDuckGoImages($query, $limit = 3) {
    $encodedQuery = urlencode($query);
    $url = "https://duckduckgo.com/i.js?q=" . $encodedQuery . "&o=json&p=1&s=0";
    
    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL => $url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_HTTPHEADER => [
            'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept: application/json'
        ],
        CURLOPT_TIMEOUT => 15
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode !== 200 || empty($response)) {
        return [];
    }
    
    $data = json_decode($response, true);
    $images = [];
    
    if (isset($data['results'])) {
        foreach (array_slice($data['results'], 0, $limit) as $result) {
            if (isset($result['image'])) {
                $images[] = $result['image'];
            }
        }
    }
    
    return $images;
}

// Alternative: Use Unsplash API (if key is provided)
function searchUnsplash($query, $accessKey, $limit = 3) {
    $encodedQuery = urlencode($query);
    $url = "https://api.unsplash.com/search/photos?query=" . $encodedQuery . "&per_page=" . $limit;
    
    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL => $url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            'Authorization: Client-ID ' . $accessKey,
            'Accept: application/json'
        ],
        CURLOPT_TIMEOUT => 15
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode !== 200) {
        return [];
    }
    
    $data = json_decode($response, true);
    $images = [];
    
    if (isset($data['results'])) {
        foreach ($data['results'] as $result) {
            if (isset($result['urls']['regular'])) {
                $images[] = $result['urls']['regular'];
            }
        }
    }
    
    return $images;
}

// Alternative: Use Pixabay API (free with key)
function searchPixabay($query, $apiKey, $limit = 3) {
    $encodedQuery = urlencode($query);
    $url = "https://pixabay.com/api/?key=" . $apiKey . "&q=" . $encodedQuery . "&image_type=photo&per_page=" . $limit;
    
    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL => $url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 15
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode !== 200) {
        return [];
    }
    
    $data = json_decode($response, true);
    $images = [];
    
    if (isset($data['hits'])) {
        foreach ($data['hits'] as $hit) {
            if (isset($hit['webformatURL'])) {
                $images[] = $hit['webformatURL'];
            }
        }
    }
    
    return $images;
}

// Use Pexels API (free with key) - another option
function searchPexels($query, $apiKey, $limit = 3) {
    $encodedQuery = urlencode($query);
    $url = "https://api.pexels.com/v1/search?query=" . $encodedQuery . "&per_page=" . $limit;
    
    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL => $url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            'Authorization: ' . $apiKey
        ],
        CURLOPT_TIMEOUT => 15
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode !== 200) {
        return [];
    }
    
    $data = json_decode($response, true);
    $images = [];
    
    if (isset($data['photos'])) {
        foreach ($data['photos'] as $photo) {
            if (isset($photo['src']['medium'])) {
                $images[] = $photo['src']['medium'];
            }
        }
    }
    
    return $images;
}

// Try to fetch images from available sources
$images = [];

// Method 1: DuckDuckGo (no API key needed)
$images = searchDuckDuckGoImages($searchQuery, 3);

// If no results, try with simpler query
if (empty($images)) {
    $images = searchDuckDuckGoImages($query . ' product', 3);
}

// If still no images, try fetching from a general product image
if (empty($images)) {
    // Extract key product terms for a more generic search
    $terms = explode(' ', $query);
    $shortQuery = implode(' ', array_slice($terms, 0, 3));
    $images = searchDuckDuckGoImages($shortQuery, 3);
}

if (!empty($images)) {
    echo json_encode([
        'success' => true,
        'images' => $images,
        'query' => $query,
        'productId' => $productId
    ]);
} else {
    echo json_encode([
        'success' => false,
        'error' => 'No images found',
        'query' => $query
    ]);
}
?>