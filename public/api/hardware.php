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

// Database config
define('DB_HOST', 'localhost');
define('DB_USER', 'u770915504_n8nbalao');
define('DB_PASS', 'Balao2025');
define('DB_NAME', 'u770915504_n8nbalao');

try {
    $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4", DB_USER, DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed']);
    exit();
}

// Create hardware table if not exists (with compatibility fields)
$pdo->exec("
    CREATE TABLE IF NOT EXISTS hardware (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        brand VARCHAR(100) NOT NULL,
        model VARCHAR(100) NOT NULL,
        price DECIMAL(10,2) DEFAULT 0,
        image LONGTEXT,
        specs JSON,
        category ENUM('processor', 'motherboard', 'memory', 'storage', 'gpu', 'psu', 'case', 'watercooler') NOT NULL,
        socket VARCHAR(50) DEFAULT NULL,
        memoryType VARCHAR(20) DEFAULT NULL,
        formFactor VARCHAR(30) DEFAULT NULL,
        tdp INT DEFAULT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
");

// Add compatibility columns if they don't exist
try {
    $pdo->exec("ALTER TABLE hardware ADD COLUMN socket VARCHAR(50) DEFAULT NULL");
} catch (PDOException $e) {
    // Column already exists
}

try {
    $pdo->exec("ALTER TABLE hardware ADD COLUMN memoryType VARCHAR(20) DEFAULT NULL");
} catch (PDOException $e) {
    // Column already exists
}

try {
    $pdo->exec("ALTER TABLE hardware ADD COLUMN formFactor VARCHAR(30) DEFAULT NULL");
} catch (PDOException $e) {
    // Column already exists
}

try {
    $pdo->exec("ALTER TABLE hardware ADD COLUMN tdp INT DEFAULT NULL");
} catch (PDOException $e) {
    // Column already exists
}

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
                $hardware['tdp'] = $hardware['tdp'] ? intval($hardware['tdp']) : null;
                echo json_encode($hardware);
            } else {
                http_response_code(404);
                echo json_encode(['error' => 'Hardware not found']);
            }
        } else {
            // Get all hardware (optionally filtered by category)
            if ($category) {
                $stmt = $pdo->prepare("SELECT * FROM hardware WHERE category = ? ORDER BY price ASC");
                $stmt->execute([$category]);
            } else {
                $stmt = $pdo->query("SELECT * FROM hardware ORDER BY category, price ASC");
            }
            
            $hardwareList = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            foreach ($hardwareList as &$hw) {
                $hw['price'] = floatval($hw['price']);
                $hw['specs'] = json_decode($hw['specs'], true) ?? [];
                $hw['tdp'] = $hw['tdp'] ? intval($hw['tdp']) : null;
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
            INSERT INTO hardware (id, name, brand, model, price, image, specs, category, socket, memoryType, formFactor, tdp, createdAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
            $data['socket'] ?? null,
            $data['memoryType'] ?? null,
            $data['formFactor'] ?? null,
            $data['tdp'] ?? null,
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

        $allowedFields = ['name', 'brand', 'model', 'price', 'image', 'category', 'socket', 'memoryType', 'formFactor', 'tdp'];
        
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
