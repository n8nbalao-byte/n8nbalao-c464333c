<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$host = 'localhost';
$dbname = 'u770915504_n8nbalao';
$username = 'u770915504_n8nbalao';
$password = 'Balao2025';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'error' => 'Database connection failed: ' . $e->getMessage()]);
    exit;
}

// Create settings table if not exists
$pdo->exec("CREATE TABLE IF NOT EXISTS settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    `key` VARCHAR(100) UNIQUE NOT NULL,
    `value` TEXT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)");

$method = $_SERVER['REQUEST_METHOD'];

// GET - Retrieve settings
if ($method === 'GET') {
    $key = $_GET['key'] ?? null;
    
    if ($key) {
        $stmt = $pdo->prepare("SELECT `key`, `value` FROM settings WHERE `key` = ?");
        $stmt->execute([$key]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($row) {
            echo json_encode(['success' => true, 'data' => $row]);
        } else {
            echo json_encode(['success' => true, 'data' => null]);
        }
    } else {
        $stmt = $pdo->query("SELECT `key`, `value` FROM settings");
        $settings = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(['success' => true, 'data' => $settings]);
    }
    exit;
}

// POST - Create or Update setting
if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $key = $input['key'] ?? null;
    $value = $input['value'] ?? '';
    
    if (!$key) {
        echo json_encode(['success' => false, 'error' => 'Key is required']);
        exit;
    }
    
    // Upsert
    $stmt = $pdo->prepare("INSERT INTO settings (`key`, `value`) VALUES (?, ?) 
                           ON DUPLICATE KEY UPDATE `value` = VALUES(`value`)");
    $stmt->execute([$key, $value]);
    
    echo json_encode(['success' => true]);
    exit;
}

// PUT - Update setting
if ($method === 'PUT') {
    $input = json_decode(file_get_contents('php://input'), true);
    $key = $input['key'] ?? null;
    $value = $input['value'] ?? '';
    
    if (!$key) {
        echo json_encode(['success' => false, 'error' => 'Key is required']);
        exit;
    }
    
    $stmt = $pdo->prepare("UPDATE settings SET `value` = ? WHERE `key` = ?");
    $stmt->execute([$value, $key]);
    
    echo json_encode(['success' => true]);
    exit;
}

echo json_encode(['success' => false, 'error' => 'Method not allowed']);
