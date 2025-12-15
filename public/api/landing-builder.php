<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Database connection
$host = 'localhost';
$dbname = 'u770915504_n8nbalao';
$username = 'u770915504_n8nbalao';
$password = 'Balao2025';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'error' => 'Database connection failed']);
    exit;
}

// Create table if not exists
$pdo->exec("CREATE TABLE IF NOT EXISTS landing_pages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    html LONGTEXT,
    screenshot LONGTEXT,
    seo_title VARCHAR(255),
    seo_description TEXT,
    seo_keywords TEXT,
    visits INT DEFAULT 0,
    status ENUM('draft', 'published') DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)");

// Get OpenAI API key
function getOpenAIKey($pdo) {
    $stmt = $pdo->query("SELECT value FROM settings WHERE `key` = 'openai_api_key'");
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    return $row ? $row['value'] : null;
}

// Generate slug from name
function generateSlug($name) {
    $slug = strtolower(trim($name));
    $slug = preg_replace('/[^a-z0-9]+/', '-', $slug);
    $slug = trim($slug, '-');
    return $slug . '-' . substr(uniqid(), -6);
}

// Call OpenAI API
function callOpenAI($apiKey, $prompt, $systemPrompt = '') {
    $ch = curl_init('https://api.openai.com/v1/chat/completions');
    
    $messages = [];
    if ($systemPrompt) {
        $messages[] = ['role' => 'system', 'content' => $systemPrompt];
    }
    $messages[] = ['role' => 'user', 'content' => $prompt];
    
    $data = [
        'model' => 'gpt-4o-mini',
        'messages' => $messages,
        'max_tokens' => 4000,
        'temperature' => 0.7
    ];
    
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($data),
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $apiKey
        ]
    ]);
    
    $response = curl_exec($ch);
    curl_close($ch);
    
    $result = json_decode($response, true);
    return $result['choices'][0]['message']['content'] ?? null;
}

// Handle GET requests
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $action = $_GET['action'] ?? 'list';
    
    if ($action === 'list') {
        $stmt = $pdo->query("SELECT * FROM landing_pages ORDER BY created_at DESC");
        $pages = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $formattedPages = array_map(function($page) {
            return [
                'id' => $page['id'],
                'name' => $page['name'],
                'url' => '/landing/' . $page['slug'],
                'screenshot' => $page['screenshot'],
                'seo' => [
                    'title' => $page['seo_title'],
                    'description' => $page['seo_description'],
                    'keywords' => $page['seo_keywords'] ? explode(',', $page['seo_keywords']) : []
                ],
                'visits' => (int)$page['visits'],
                'status' => $page['status'],
                'createdAt' => $page['created_at']
            ];
        }, $pages);
        
        echo json_encode(['success' => true, 'pages' => $formattedPages]);
        exit;
    }
    
    if ($action === 'view') {
        $slug = $_GET['slug'] ?? '';
        $stmt = $pdo->prepare("SELECT * FROM landing_pages WHERE slug = ?");
        $stmt->execute([$slug]);
        $page = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($page) {
            // Increment visits
            $pdo->prepare("UPDATE landing_pages SET visits = visits + 1 WHERE id = ?")->execute([$page['id']]);
            
            // Return HTML directly
            header('Content-Type: text/html');
            echo $page['html'];
        } else {
            http_response_code(404);
            echo '<!DOCTYPE html><html><head><title>Página não encontrada</title></head><body><h1>404 - Página não encontrada</h1></body></html>';
        }
        exit;
    }
}

// Handle POST requests
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $action = $input['action'] ?? '';
    
    if ($action === 'generate') {
        $apiKey = getOpenAIKey($pdo);
        if (!$apiKey) {
            echo json_encode(['success' => false, 'error' => 'OpenAI API key not configured']);
            exit;
        }
        
        $name = $input['name'] ?? '';
        $description = $input['description'] ?? '';
        $companyName = $input['companyName'] ?? 'Empresa';
        $companyLogo = $input['companyLogo'] ?? '';
        $seo = $input['seo'] ?? null;
        
        $systemPrompt = "Você é um expert em criar landing pages de alta conversão. 
Crie uma landing page HTML completa e moderna com:
- Design responsivo e mobile-first
- Cores vibrantes e atraentes
- Seções: hero, benefícios, features, depoimentos, CTA, footer
- Animações CSS suaves
- Fonte Google Fonts (Inter ou Poppins)
- Botões de ação destacados
- Uso de emojis para destacar pontos
- WhatsApp button flutuante

Retorne APENAS o código HTML completo, sem explicações. O HTML deve ser auto-contido com CSS inline ou em <style>.";

        $prompt = "Crie uma landing page para: $name
Descrição: $description
Empresa: $companyName
" . ($seo ? "SEO Title: " . $seo['title'] . "\nSEO Description: " . $seo['description'] : "");
        
        $html = callOpenAI($apiKey, $prompt, $systemPrompt);
        
        if ($html) {
            // Clean up response if needed
            $html = preg_replace('/^```html\s*/', '', $html);
            $html = preg_replace('/\s*```$/', '', $html);
            
            echo json_encode([
                'success' => true, 
                'html' => $html,
                'previewUrl' => '#preview'
            ]);
        } else {
            echo json_encode(['success' => false, 'error' => 'Failed to generate landing page']);
        }
        exit;
    }
    
    if ($action === 'publish') {
        $name = $input['name'] ?? '';
        $html = $input['html'] ?? '';
        $screenshot = $input['screenshot'] ?? '';
        $seo = $input['seo'] ?? [];
        
        if (!$name || !$html) {
            echo json_encode(['success' => false, 'error' => 'Name and HTML are required']);
            exit;
        }
        
        $slug = generateSlug($name);
        
        $stmt = $pdo->prepare("INSERT INTO landing_pages (name, slug, html, screenshot, seo_title, seo_description, seo_keywords, status) VALUES (?, ?, ?, ?, ?, ?, ?, 'published')");
        $stmt->execute([
            $name,
            $slug,
            $html,
            $screenshot,
            $seo['title'] ?? $name,
            $seo['description'] ?? '',
            isset($seo['keywords']) ? implode(',', $seo['keywords']) : ''
        ]);
        
        echo json_encode([
            'success' => true,
            'id' => $pdo->lastInsertId(),
            'url' => '/landing/' . $slug
        ]);
        exit;
    }
    
    if ($action === 'delete') {
        $id = $input['id'] ?? '';
        
        $stmt = $pdo->prepare("DELETE FROM landing_pages WHERE id = ?");
        $stmt->execute([$id]);
        
        echo json_encode(['success' => true]);
        exit;
    }
}

echo json_encode(['success' => false, 'error' => 'Invalid request']);
