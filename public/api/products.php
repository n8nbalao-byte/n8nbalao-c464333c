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

// Multi-Tenant: Detect company
require_once __DIR__ . '/helpers.php';
$company_id = detectCompanyId();

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

// Create products table if it doesn't exist
$pdo->exec("CREATE TABLE IF NOT EXISTS products (
    id VARCHAR(36) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    subtitle TEXT,
    description LONGTEXT,
    categories LONGTEXT,
    media LONGTEXT,
    specs LONGTEXT,
    components LONGTEXT,
    totalPrice DECIMAL(10,2) DEFAULT 0,
    productType VARCHAR(50) DEFAULT 'pc',
    downloadUrl TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
)");

// Add description column if it doesn't exist
try {
    $pdo->exec("ALTER TABLE products ADD COLUMN description LONGTEXT AFTER subtitle");
} catch (PDOException $e) {
    // Column already exists, ignore
}

// Add productType column if it doesn't exist
try {
    $pdo->exec("ALTER TABLE products ADD COLUMN productType VARCHAR(50) DEFAULT 'pc' AFTER totalPrice");
} catch (PDOException $e) {
    // Column already exists, ignore
}

// Add downloadUrl column if it doesn't exist
try {
    $pdo->exec("ALTER TABLE products ADD COLUMN downloadUrl TEXT AFTER productType");
} catch (PDOException $e) {
    // Column already exists, ignore
}

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        if (isset($_GET['id'])) {
            // Get single product by ID
            $stmt = $pdo->prepare("SELECT * FROM products WHERE id = ? AND company_id = ?");
            $stmt->execute([$_GET['id'], $company_id]);
            $product = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($product) {
                $product['categories'] = json_decode($product['categories'] ?: '[]', true);
                $product['media'] = json_decode($product['media'] ?: '[]', true);
                $product['specs'] = json_decode($product['specs'] ?: '{}', true);
                $product['components'] = json_decode($product['components'] ?: '{}', true);
                $product['totalPrice'] = (float)$product['totalPrice'];
                echo json_encode($product);
            } else {
                http_response_code(404);
                echo json_encode(['error' => 'Product not found']);
            }
        } else {
            // Get all products, optionally filtered by productType
            if (isset($_GET['productType'])) {
                $stmt = $pdo->prepare("SELECT * FROM products WHERE productType = ? AND company_id = ? ORDER BY createdAt DESC");
                $stmt->execute([$_GET['productType'], $company_id]);
            } else {
                $stmt = $pdo->prepare("SELECT * FROM products WHERE company_id = ? ORDER BY createdAt DESC");
                $stmt->execute([$company_id]);
            }
            $products = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            foreach ($products as &$product) {
                $product['categories'] = json_decode($product['categories'] ?: '[]', true);
                $product['media'] = json_decode($product['media'] ?: '[]', true);
                $product['specs'] = json_decode($product['specs'] ?: '{}', true);
                $product['components'] = json_decode($product['components'] ?: '{}', true);
                $product['totalPrice'] = (float)$product['totalPrice'];
            }
            
            echo json_encode($products);
        }
        break;

    case 'POST':
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!$data || !isset($data['title'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Title is required']);
            exit();
        }

        $stmt = $pdo->prepare("INSERT INTO products (id, title, subtitle, description, categories, media, specs, components, totalPrice, productType, downloadUrl, createdAt, company_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        
        $success = $stmt->execute([
            $data['id'] ?? uniqid(),
            $data['title'],
            $data['subtitle'] ?? '',
            $data['description'] ?? '',
            json_encode($data['categories'] ?? []),
            json_encode($data['media'] ?? []),
            json_encode($data['specs'] ?? []),
            json_encode($data['components'] ?? []),
            $data['totalPrice'] ?? 0,
            $data['productType'] ?? 'pc',
            $data['downloadUrl'] ?? '',
            $data['createdAt'] ?? date('Y-m-d H:i:s'),
            $company_id
        ]);

        if ($success) {
            echo json_encode(['success' => true, 'id' => $data['id']]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to create product']);
        }
        break;

    case 'PUT':
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!$data || !isset($data['id'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Product ID is required']);
            exit();
        }

        $fields = [];
        $values = [];

        if (isset($data['title'])) {
            $fields[] = 'title = ?';
            $values[] = $data['title'];
        }
        if (isset($data['subtitle'])) {
            $fields[] = 'subtitle = ?';
            $values[] = $data['subtitle'];
        }
        if (isset($data['description'])) {
            $fields[] = 'description = ?';
            $values[] = $data['description'];
        }
        if (isset($data['categories'])) {
            $fields[] = 'categories = ?';
            $values[] = json_encode($data['categories']);
        }
        if (isset($data['media'])) {
            $fields[] = 'media = ?';
            $values[] = json_encode($data['media']);
        }
        if (isset($data['specs'])) {
            $fields[] = 'specs = ?';
            $values[] = json_encode($data['specs']);
        }
        if (isset($data['components'])) {
            $fields[] = 'components = ?';
            $values[] = json_encode($data['components']);
        }
        if (isset($data['totalPrice'])) {
            $fields[] = 'totalPrice = ?';
            $values[] = $data['totalPrice'];
        }
        if (isset($data['productType'])) {
            $fields[] = 'productType = ?';
            $values[] = $data['productType'];
        }
        if (isset($data['downloadUrl'])) {
            $fields[] = 'downloadUrl = ?';
            $values[] = $data['downloadUrl'];
        }

        if (empty($fields)) {
            http_response_code(400);
            echo json_encode(['error' => 'No fields to update']);
            exit();
        }

        $values[] = $data['id'];
        $values[] = $company_id;
        $sql = "UPDATE products SET " . implode(', ', $fields) . " WHERE id = ? AND company_id = ?";
        $stmt = $pdo->prepare($sql);
        $success = $stmt->execute($values);

        if ($success) {
            echo json_encode(['success' => true]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to update product']);
        }
        break;

    case 'DELETE':
        // Delete all products if 'all' parameter is set
        if (isset($_GET['all']) && $_GET['all'] === 'true') {
            $stmt = $pdo->prepare("DELETE FROM products WHERE company_id = ?");
            $stmt->execute([$company_id]);
            echo json_encode(['success' => true, 'message' => 'All products deleted']);
            break;
        }
        
        if (!isset($_GET['id'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Product ID is required']);
            exit();
        }

        $stmt = $pdo->prepare("DELETE FROM products WHERE id = ? AND company_id = ?");
        $success = $stmt->execute([$_GET['id'], $company_id]);

        if ($success) {
            echo json_encode(['success' => true]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to delete product']);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        break;
}
?>
