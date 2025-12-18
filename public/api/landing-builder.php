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
    target_url VARCHAR(500),
    redirect_url VARCHAR(500),
    seo_title VARCHAR(255),
    seo_description TEXT,
    seo_keywords TEXT,
    seo_content TEXT,
    page_type ENUM('landing', 'seo') DEFAULT 'landing',
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

// Call OpenAI API with better error handling
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
        ],
        CURLOPT_TIMEOUT => 60
    ]);
    
    $response = curl_exec($ch);
    $curlError = curl_error($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($curlError) {
        error_log("OpenAI cURL error: " . $curlError);
        return null;
    }
    
    if ($httpCode !== 200) {
        error_log("OpenAI HTTP error: " . $httpCode . " - " . $response);
        return null;
    }
    
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
    
    // Generate SEO Keywords with AI (200+ keywords)
    if ($action === 'generate-seo-keywords') {
        $apiKey = getOpenAIKey($pdo);
        if (!$apiKey) {
            echo json_encode(['success' => false, 'error' => 'OpenAI API key not configured']);
            exit;
        }
        
        $url = $input['url'] ?? '';
        $title = $input['title'] ?? '';
        $description = $input['description'] ?? '';
        
        $systemPrompt = "Você é um especialista em SEO e geração de palavras-chave. Gere palavras-chave altamente relevantes e otimizadas para mecanismos de busca.";
        
        $prompt = "Analise a URL: $url\nTítulo: $title\nDescrição: $description\n\n" .
                  "Gere uma lista de 200 palavras-chave altamente relevantes para SEO, separadas por vírgulas. " .
                  "Inclua variações longas (long-tail keywords), sinônimos e termos relacionados. " .
                  "Retorne APENAS as palavras-chave, sem explicações.";
        
        $keywords = callOpenAI($apiKey, $prompt, $systemPrompt);
        
        if ($keywords) {
            echo json_encode([
                'success' => true,
                'keywords' => $keywords
            ]);
        } else {
            echo json_encode(['success' => false, 'error' => 'Failed to generate keywords']);
        }
        exit;
    }
    
    // Generate SEO Content with AI
    if ($action === 'generate-seo-content') {
        $apiKey = getOpenAIKey($pdo);
        if (!$apiKey) {
            echo json_encode(['success' => false, 'error' => 'OpenAI API key not configured']);
            exit;
        }
        
        $url = $input['url'] ?? '';
        $title = $input['title'] ?? '';
        $description = $input['description'] ?? '';
        
        $systemPrompt = "Você é um especialista em SEO e criação de conteúdo otimizado. Crie conteúdo natural, relevante e rico em palavras-chave.";
        
        $prompt = "Crie um texto de conteúdo SEO para a página: $url\n" .
                  "Título: $title\n" .
                  "Descrição: $description\n\n" .
                  "Gere 3-4 parágrafos de conteúdo rico em palavras-chave, bem estruturado e natural. " .
                  "O texto será invisível ao usuário (divs ocultos), mas relevante para SEO. " .
                  "Inclua variações de palavras-chave, sinônimos e termos relacionados. " .
                  "Retorne APENAS o texto, sem HTML ou formatação.";
        
        $content = callOpenAI($apiKey, $prompt, $systemPrompt);
        
        if ($content) {
            echo json_encode([
                'success' => true,
                'content' => $content
            ]);
        } else {
            echo json_encode(['success' => false, 'error' => 'Failed to generate SEO content']);
        }
        exit;
    }
    
    // Publish SEO Page
    if ($action === 'publish-seo') {
        $name = $input['name'] ?? '';
        $targetUrl = $input['targetUrl'] ?? '';
        $redirectUrl = $input['redirectUrl'] ?? $targetUrl;
        $html = $input['html'] ?? '';
        $screenshot = $input['screenshotUrl'] ?? '';
        $keywords = $input['keywords'] ?? '';
        $seo = $input['seo'] ?? [];
        
        if (!$name || !$html) {
            echo json_encode(['success' => false, 'error' => 'Name and HTML are required']);
            exit;
        }
        
        $slug = generateSlug($name);
        
        $stmt = $pdo->prepare("INSERT INTO landing_pages (name, slug, html, screenshot, target_url, redirect_url, seo_title, seo_description, seo_keywords, page_type, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'seo', 'published')");
        $stmt->execute([
            $name,
            $slug,
            $html,
            $screenshot,
            $targetUrl,
            $redirectUrl,
            $seo['title'] ?? $name,
            $seo['description'] ?? '',
            $keywords
        ]);
        
        echo json_encode([
            'success' => true,
            'id' => $pdo->lastInsertId(),
            'url' => '/seo/' . $slug
        ]);
        exit;
    }
    
    // Delete SEO Page (alias)
    if ($action === 'delete-seo') {
        $id = $input['id'] ?? '';
        
        $stmt = $pdo->prepare("DELETE FROM landing_pages WHERE id = ?");
        $stmt->execute([$id]);
        
        echo json_encode(['success' => true]);
        exit;
    }
}

// Handle GET for SEO pages list
if ($_SERVER['REQUEST_METHOD'] === 'GET' && ($_GET['action'] ?? '') === 'list-seo') {
    $stmt = $pdo->query("SELECT * FROM landing_pages WHERE page_type = 'seo' ORDER BY created_at DESC");
    $pages = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $formattedPages = array_map(function($page) {
        return [
            'id' => $page['id'],
            'name' => $page['name'],
            'url' => '/seo/' . $page['slug'],
            'screenshot' => $page['screenshot'],
            'targetUrl' => $page['target_url'],
            'redirectUrl' => $page['redirect_url'],
            'seo' => [
                'title' => $page['seo_title'],
                'description' => $page['seo_description'],
                'keywords' => $page['seo_keywords']
            ],
            'visits' => (int)$page['visits'],
            'status' => $page['status'],
            'createdAt' => $page['created_at']
        ];
    }, $pages);
    
    echo json_encode(['success' => true, 'pages' => $formattedPages]);
    exit;
}

// View SEO Page
if ($_SERVER['REQUEST_METHOD'] === 'GET' && ($_GET['action'] ?? '') === 'view-seo') {
    $slug = $_GET['slug'] ?? '';
    $stmt = $pdo->prepare("SELECT * FROM landing_pages WHERE slug = ? AND page_type = 'seo'");
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

echo json_encode(['success' => false, 'error' => 'Invalid request']);
