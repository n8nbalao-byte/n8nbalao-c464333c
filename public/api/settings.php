<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/_db.php';

try {
    $pdo = balao_get_pdo();
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (Throwable $e) {
    echo json_encode(['success' => false, 'error' => 'Database connection failed']);
    exit;
}

// Check if settings table exists and has correct structure
try {
    $tableCheck = $pdo->query("SHOW TABLES LIKE 'settings'");
    $tableExists = $tableCheck->rowCount() > 0;
    
    if ($tableExists) {
        // Check if 'value' column exists
        $columns = $pdo->query("SHOW COLUMNS FROM settings LIKE 'value'");
        $hasValueColumn = $columns->rowCount() > 0;
        
        if (!$hasValueColumn) {
            // Table exists but missing 'value' column - drop and recreate
            $pdo->exec("DROP TABLE settings");
            $tableExists = false;
        }
    }
    
    if (!$tableExists) {
        // Create table with correct structure
        $pdo->exec("CREATE TABLE settings (
            id INT AUTO_INCREMENT PRIMARY KEY,
            `key` VARCHAR(100) UNIQUE NOT NULL,
            `value` TEXT,
            createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )");
    }
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'error' => 'Table setup error: ' . $e->getMessage()]);
    exit;
}

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
