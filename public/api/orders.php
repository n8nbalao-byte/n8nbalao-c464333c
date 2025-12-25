<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Multi-Tenant: Detect company
require_once __DIR__ . '/helpers.php';
$company_id = detectCompanyId();

$host = 'localhost';
$dbname = 'u770915504_n8nbalao';
$username = 'u770915504_n8nbalao';
$password = 'Balao2025';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    echo json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]);
    exit();
}

// Create orders table if not exists
$pdo->exec("CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(36) PRIMARY KEY,
    customerId VARCHAR(36) NOT NULL,
    items LONGTEXT NOT NULL,
    totalPrice DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    notes TEXT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)");

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        if (isset($_GET['id'])) {
            // Get single order with customer info
            $stmt = $pdo->prepare("
                SELECT o.*, c.name as customerName, c.email as customerEmail, c.phone as customerPhone 
                FROM orders o 
                LEFT JOIN customers c ON o.customerId = c.id 
                WHERE o.id = ? AND o.company_id = ?
            ");
            $stmt->execute([$_GET['id'], $company_id]);
            $order = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($order) {
                $order['items'] = json_decode($order['items'], true);
                echo json_encode($order);
            } else {
                http_response_code(404);
                echo json_encode(['error' => 'Order not found']);
            }
        } elseif (isset($_GET['customerId'])) {
            // Get orders by customer
            $stmt = $pdo->prepare("SELECT * FROM orders WHERE customerId = ? AND company_id = ? ORDER BY createdAt DESC");
            $stmt->execute([$_GET['customerId'], $company_id]);
            $orders = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            foreach ($orders as &$order) {
                $order['items'] = json_decode($order['items'], true);
            }
            
            echo json_encode($orders);
        } else {
            // Get all orders with customer info
            $stmt = $pdo->prepare("
                SELECT o.*, c.name as customerName, c.email as customerEmail, c.phone as customerPhone 
                FROM orders o 
                LEFT JOIN customers c ON o.customerId = c.id 
                WHERE o.company_id = ?
                ORDER BY o.createdAt DESC
            ");
            $stmt->execute([$company_id]);
            $orders = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            foreach ($orders as &$order) {
                $order['items'] = json_decode($order['items'], true);
            }
            
            echo json_encode($orders);
        }
        break;

    case 'POST':
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!$data || !isset($data['customerId']) || !isset($data['items']) || !isset($data['totalPrice'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Customer ID, items, and total price are required']);
            exit();
        }
        
        $id = $data['id'] ?? uniqid('ord_', true);
        
        $stmt = $pdo->prepare("INSERT INTO orders (id, customerId, items, totalPrice, status, notes, company_id) VALUES (?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            $id,
            $data['customerId'],
            json_encode($data['items']),
            $data['totalPrice'],
            $data['status'] ?? 'pending',
            $data['notes'] ?? null,
            $company_id
        ]);
        
        echo json_encode(['success' => true, 'orderId' => $id]);
        break;

    case 'PUT':
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($_GET['id'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Order ID is required']);
            exit();
        }
        
        $updates = [];
        $params = [];
        
        if (isset($data['status'])) {
            $updates[] = "status = ?";
            $params[] = $data['status'];
        }
        if (isset($data['notes'])) {
            $updates[] = "notes = ?";
            $params[] = $data['notes'];
        }
        
        if (empty($updates)) {
            http_response_code(400);
            echo json_encode(['error' => 'No fields to update']);
            exit();
        }
        
        $params[] = $_GET['id'];
        $params[] = $company_id;
        $sql = "UPDATE orders SET " . implode(", ", $updates) . " WHERE id = ? AND company_id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        
        echo json_encode(['success' => true]);
        break;

    case 'DELETE':
        if (!isset($_GET['id'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Order ID is required']);
            exit();
        }
        
        $stmt = $pdo->prepare("DELETE FROM orders WHERE id = ? AND company_id = ?");
        $stmt->execute([$_GET['id'], $company_id]);
        
        echo json_encode(['success' => true]);
        break;

    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        break;
}
?>
