<?php
// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 0);

// CORS Headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Database configuration for Hostinger
$host = 'localhost';
$dbname = 'u770915504_n8nbalao';
$username = 'u770915504_n8nbalao';
$password = 'Balao2025';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed']);
    exit();
}

// Create categories table if it doesn't exist
$pdo->exec("CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_key VARCHAR(50) NOT NULL,
    label VARCHAR(100) NOT NULL,
    icon VARCHAR(50),
    category_type VARCHAR(50) DEFAULT 'product_type',
    filters TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_key_type (category_key, category_type)
)");

// Add filters column if it doesn't exist
try {
    $pdo->exec("ALTER TABLE categories ADD COLUMN filters TEXT");
} catch (PDOException $e) {
    // Column already exists, ignore
}

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        // Get all categories, optionally filtered by type
        if (isset($_GET['type'])) {
            $stmt = $pdo->prepare("SELECT * FROM categories WHERE category_type = ? ORDER BY label ASC");
            $stmt->execute([$_GET['type']]);
        } else {
            $stmt = $pdo->query("SELECT * FROM categories ORDER BY label ASC");
        }
        $categories = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Transform to expected format
        $result = array_map(function($cat) {
            $item = [
                'key' => $cat['category_key'],
                'label' => $cat['label'],
                'icon' => $cat['icon'],
                'type' => $cat['category_type']
            ];
            // Parse filters JSON if exists
            if (!empty($cat['filters'])) {
                $item['filters'] = json_decode($cat['filters'], true);
            }
            return $item;
        }, $categories);
        
        echo json_encode($result);
        break;

    case 'POST':
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!$data || !isset($data['key']) || !isset($data['label'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Key and label are required']);
            exit();
        }

        // Check if already exists with same key AND type
        $checkStmt = $pdo->prepare("SELECT id FROM categories WHERE category_key = ? AND category_type = ?");
        $checkStmt->execute([$data['key'], $data['type'] ?? 'product_type']);
        if ($checkStmt->fetch()) {
            echo json_encode(['success' => true, 'message' => 'Category already exists']);
            exit();
        }

        $filtersJson = null;
        if (isset($data['filters'])) {
            $filtersJson = json_encode($data['filters']);
        }

        $stmt = $pdo->prepare("INSERT INTO categories (category_key, label, icon, category_type, filters) VALUES (?, ?, ?, ?, ?)");
        
        $success = $stmt->execute([
            $data['key'],
            $data['label'],
            $data['icon'] ?? null,
            $data['type'] ?? 'product_type',
            $filtersJson
        ]);

        if ($success) {
            echo json_encode(['success' => true]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to create category']);
        }
        break;

    case 'DELETE':
        if (!isset($_GET['key'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Category key is required']);
            exit();
        }

        // If type is specified, delete only matching type
        if (isset($_GET['type'])) {
            $stmt = $pdo->prepare("DELETE FROM categories WHERE category_key = ? AND category_type = ?");
            $success = $stmt->execute([$_GET['key'], $_GET['type']]);
        } else {
            $stmt = $pdo->prepare("DELETE FROM categories WHERE category_key = ?");
            $success = $stmt->execute([$_GET['key']]);
        }

        if ($success) {
            echo json_encode(['success' => true]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to delete category']);
        }
        break;

    case 'PUT':
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!$data || !isset($data['key'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Category key is required']);
            exit();
        }

        $updates = [];
        $params = [];

        if (isset($data['newLabel'])) {
            $updates[] = "label = ?";
            $params[] = $data['newLabel'];
        }
        if (isset($data['newIcon'])) {
            $updates[] = "icon = ?";
            $params[] = $data['newIcon'];
        }
        if (isset($data['newKey'])) {
            $updates[] = "category_key = ?";
            $params[] = $data['newKey'];
        }
        if (isset($data['filters'])) {
            $updates[] = "filters = ?";
            $params[] = json_encode($data['filters']);
        }

        if (empty($updates)) {
            http_response_code(400);
            echo json_encode(['error' => 'No fields to update']);
            exit();
        }

        $params[] = $data['key'];
        
        // If type is specified, update only matching type
        if (isset($data['type'])) {
            $params[] = $data['type'];
            $sql = "UPDATE categories SET " . implode(", ", $updates) . " WHERE category_key = ? AND category_type = ?";
        } else {
            $sql = "UPDATE categories SET " . implode(", ", $updates) . " WHERE category_key = ?";
        }
        
        $stmt = $pdo->prepare($sql);
        $success = $stmt->execute($params);

        if ($success) {
            echo json_encode(['success' => true]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to update category']);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        break;
}
?>
