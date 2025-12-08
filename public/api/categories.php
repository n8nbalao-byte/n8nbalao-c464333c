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
    category_key VARCHAR(50) NOT NULL UNIQUE,
    label VARCHAR(100) NOT NULL,
    icon VARCHAR(50),
    category_type ENUM('product_type', 'product_category') DEFAULT 'product_type',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
)");

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
            return [
                'key' => $cat['category_key'],
                'label' => $cat['label'],
                'icon' => $cat['icon'],
                'type' => $cat['category_type']
            ];
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

        // Check if already exists
        $checkStmt = $pdo->prepare("SELECT id FROM categories WHERE category_key = ?");
        $checkStmt->execute([$data['key']]);
        if ($checkStmt->fetch()) {
            echo json_encode(['success' => true, 'message' => 'Category already exists']);
            exit();
        }

        $stmt = $pdo->prepare("INSERT INTO categories (category_key, label, icon, category_type) VALUES (?, ?, ?, ?)");
        
        $success = $stmt->execute([
            $data['key'],
            $data['label'],
            $data['icon'] ?? null,
            $data['type'] ?? 'product_type'
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

        $stmt = $pdo->prepare("DELETE FROM categories WHERE category_key = ?");
        $success = $stmt->execute([$_GET['key']]);

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

        if (empty($updates)) {
            http_response_code(400);
            echo json_encode(['error' => 'No fields to update']);
            exit();
        }

        $params[] = $data['key'];
        $sql = "UPDATE categories SET " . implode(", ", $updates) . " WHERE category_key = ?";
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
