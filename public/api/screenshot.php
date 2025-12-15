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

$input = json_decode(file_get_contents('php://input'), true);
$url = $input['url'] ?? '';

if (!$url) {
    echo json_encode(['success' => false, 'error' => 'URL is required']);
    exit;
}

// Validate URL
if (!filter_var($url, FILTER_VALIDATE_URL)) {
    // Try adding https://
    $url = 'https://' . $url;
    if (!filter_var($url, FILTER_VALIDATE_URL)) {
        echo json_encode(['success' => false, 'error' => 'Invalid URL']);
        exit;
    }
}

// Use a free screenshot API service
$screenshotServices = [
    // Option 1: screenshotmachine (free tier)
    'https://api.screenshotmachine.com?key=free&url=' . urlencode($url) . '&dimension=1280x720&format=png',
    // Option 2: microlink
    'https://api.microlink.io/?url=' . urlencode($url) . '&screenshot=true&meta=false&embed=screenshot.url',
    // Option 3: thumbnail.ws (free tier)
    'https://api.thumbnail.ws/api/ab6fec2e9c57a0d6f378e81a15d6c5c8c6e4e5/thumbnail/get?url=' . urlencode($url) . '&width=1280'
];

// Try microlink first as it's most reliable
$microlinkUrl = 'https://api.microlink.io/?url=' . urlencode($url) . '&screenshot=true&meta=false';

$ch = curl_init($microlinkUrl);
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_FOLLOWLOCATION => true,
    CURLOPT_TIMEOUT => 30,
    CURLOPT_HTTPHEADER => [
        'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    ]
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode === 200) {
    $data = json_decode($response, true);
    
    if (isset($data['data']['screenshot']['url'])) {
        $screenshotUrl = $data['data']['screenshot']['url'];
        
        // Download the image and convert to base64
        $imageData = file_get_contents($screenshotUrl);
        if ($imageData) {
            $base64 = 'data:image/png;base64,' . base64_encode($imageData);
            echo json_encode([
                'success' => true,
                'screenshot' => $base64
            ]);
            exit;
        }
    }
}

// Fallback: Try to fetch OG image from the page
$ch = curl_init($url);
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_FOLLOWLOCATION => true,
    CURLOPT_TIMEOUT => 15,
    CURLOPT_HTTPHEADER => [
        'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    ]
]);

$html = curl_exec($ch);
curl_close($ch);

if ($html) {
    // Try to find og:image
    preg_match('/<meta[^>]+property=["\']og:image["\'][^>]+content=["\']([^"\']+)["\']/', $html, $matches);
    if (empty($matches)) {
        preg_match('/<meta[^>]+content=["\']([^"\']+)["\'][^>]+property=["\']og:image["\']/', $html, $matches);
    }
    
    if (!empty($matches[1])) {
        $ogImage = $matches[1];
        
        // Make absolute URL if relative
        if (strpos($ogImage, 'http') !== 0) {
            $parsed = parse_url($url);
            $ogImage = $parsed['scheme'] . '://' . $parsed['host'] . $ogImage;
        }
        
        $imageData = @file_get_contents($ogImage);
        if ($imageData) {
            $finfo = new finfo(FILEINFO_MIME_TYPE);
            $mimeType = $finfo->buffer($imageData);
            $base64 = 'data:' . $mimeType . ';base64,' . base64_encode($imageData);
            
            echo json_encode([
                'success' => true,
                'screenshot' => $base64,
                'source' => 'og_image'
            ]);
            exit;
        }
    }
}

echo json_encode([
    'success' => false,
    'error' => 'Não foi possível capturar screenshot. Tente novamente ou use outra URL.'
]);
