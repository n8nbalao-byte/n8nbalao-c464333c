<?php
/**
 * Hardware API - Gerencia componentes de hardware
 * Upload este arquivo para: /api/hardware.php na sua Hostinger
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Database config - ajuste conforme seu config.php
$host = 'localhost';
$dbname = 'u770915504_n8nbalao';
$username = 'u770915504_admin'; // Ajuste conforme necessário
$password = ''; // Adicione sua senha

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed']);
    exit();
}

// Create hardware table if not exists
$pdo->exec("
    CREATE TABLE IF NOT EXISTS hardware (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        brand VARCHAR(100) NOT NULL,
        model VARCHAR(100) NOT NULL,
        price DECIMAL(10,2) DEFAULT 0,
        image LONGTEXT,
        specs JSON,
        category ENUM('processor', 'motherboard', 'memory', 'storage', 'gpu', 'psu', 'case') NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
");

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        $category = $_GET['category'] ?? null;
        $id = $_GET['id'] ?? null;

        if ($id) {
            // Get single hardware
            $stmt = $pdo->prepare("SELECT * FROM hardware WHERE id = ?");
            $stmt->execute([$id]);
            $hardware = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($hardware) {
                $hardware['price'] = floatval($hardware['price']);
                $hardware['specs'] = json_decode($hardware['specs'], true) ?? [];
                echo json_encode($hardware);
            } else {
                http_response_code(404);
                echo json_encode(['error' => 'Hardware not found']);
            }
        } else {
            // Get all hardware (optionally filtered by category)
            if ($category) {
                $stmt = $pdo->prepare("SELECT * FROM hardware WHERE category = ? ORDER BY createdAt DESC");
                $stmt->execute([$category]);
            } else {
                $stmt = $pdo->query("SELECT * FROM hardware ORDER BY category, createdAt DESC");
            }
            
            $hardwareList = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            foreach ($hardwareList as &$hw) {
                $hw['price'] = floatval($hw['price']);
                $hw['specs'] = json_decode($hw['specs'], true) ?? [];
            }
            
            echo json_encode($hardwareList);
        }
        break;

    case 'POST':
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!$data || !isset($data['name']) || !isset($data['category'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Name and category are required']);
            exit();
        }

        $stmt = $pdo->prepare("
            INSERT INTO hardware (id, name, brand, model, price, image, specs, category, createdAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");

        $stmt->execute([
            $data['id'] ?? uniqid(),
            $data['name'],
            $data['brand'] ?? '',
            $data['model'] ?? '',
            $data['price'] ?? 0,
            $data['image'] ?? '',
            json_encode($data['specs'] ?? []),
            $data['category'],
            $data['createdAt'] ?? date('Y-m-d H:i:s')
        ]);

        echo json_encode(['success' => true, 'id' => $data['id']]);
        break;

    case 'PUT':
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!$data || !isset($data['id'])) {
            http_response_code(400);
            echo json_encode(['error' => 'ID is required']);
            exit();
        }

        $updates = [];
        $params = [];

        $allowedFields = ['name', 'brand', 'model', 'price', 'image', 'category'];
        
        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                $updates[] = "$field = ?";
                $params[] = $data[$field];
            }
        }

        if (isset($data['specs'])) {
            $updates[] = "specs = ?";
            $params[] = json_encode($data['specs']);
        }

        if (empty($updates)) {
            http_response_code(400);
            echo json_encode(['error' => 'No fields to update']);
            exit();
        }

        $params[] = $data['id'];
        
        $sql = "UPDATE hardware SET " . implode(', ', $updates) . " WHERE id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);

        echo json_encode(['success' => true]);
        break;

    case 'DELETE':
        $id = $_GET['id'] ?? null;
        
        if (!$id) {
            http_response_code(400);
            echo json_encode(['error' => 'ID is required']);
            exit();
        }

        $stmt = $pdo->prepare("DELETE FROM hardware WHERE id = ?");
        $stmt->execute([$id]);

        echo json_encode(['success' => true]);
        break;

    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
}
