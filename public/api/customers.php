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

// Create customers table if not exists
$pdo->exec("CREATE TABLE IF NOT EXISTS customers (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(50),
    cpf VARCHAR(14),
    address VARCHAR(500),
    city VARCHAR(100),
    state VARCHAR(50),
    cep VARCHAR(10),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)");

// Create orders table if not exists
$pdo->exec("CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(36) PRIMARY KEY,
    customerId VARCHAR(36) NOT NULL,
    items LONGTEXT NOT NULL,
    totalPrice DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    notes TEXT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customerId) REFERENCES customers(id) ON DELETE CASCADE
)");

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        if (isset($_GET['id'])) {
            // Get single customer
            $stmt = $pdo->prepare("SELECT * FROM customers WHERE id = ? AND company_id = ?");
            $stmt->execute([$_GET['id'], $company_id]);
            $customer = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($customer) {
                echo json_encode($customer);
            } else {
                http_response_code(404);
                echo json_encode(['error' => 'Customer not found']);
            }
        } elseif (isset($_GET['email'])) {
            // Find customer by email
            $stmt = $pdo->prepare("SELECT * FROM customers WHERE email = ? AND company_id = ?");
            $stmt->execute([$_GET['email'], $company_id]);
            $customer = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($customer) {
                echo json_encode($customer);
            } else {
                http_response_code(404);
                echo json_encode(['error' => 'Customer not found']);
            }
        } else {
            // Get all customers
            $stmt = $pdo->prepare("SELECT * FROM customers WHERE company_id = ? ORDER BY createdAt DESC");
            $stmt->execute([$company_id]);
            $customers = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode($customers);
        }
        break;

    case 'POST':
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!$data || !isset($data['name']) || !isset($data['email'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Name and email are required']);
            exit();
        }
        
        // Check if customer exists
        $stmt = $pdo->prepare("SELECT * FROM customers WHERE email = ? AND company_id = ?");
        $stmt->execute([$data['email'], $company_id]);
        $existingCustomer = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($existingCustomer) {
            // Update existing customer
            $stmt = $pdo->prepare("UPDATE customers SET name = ?, phone = ?, cpf = ?, address = ?, city = ?, state = ?, cep = ? WHERE email = ? AND company_id = ?");
            $stmt->execute([
                $data['name'],
                $data['phone'] ?? null,
                $data['cpf'] ?? null,
                $data['address'] ?? null,
                $data['city'] ?? null,
                $data['state'] ?? null,
                $data['cep'] ?? null,
                $data['email'],
                $company_id
            ]);
            
            $stmt = $pdo->prepare("SELECT * FROM customers WHERE email = ? AND company_id = ?");
            $stmt->execute([$data['email'], $company_id]);
            $customer = $stmt->fetch(PDO::FETCH_ASSOC);
            
            echo json_encode(['success' => true, 'customer' => $customer, 'isNew' => false]);
        } else {
            // Create new customer
            $id = $data['id'] ?? uniqid('cust_', true);
            
            $stmt = $pdo->prepare("INSERT INTO customers (id, name, email, phone, cpf, address, city, state, cep, company_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $id,
                $data['name'],
                $data['email'],
                $data['phone'] ?? null,
                $data['cpf'] ?? null,
                $data['address'] ?? null,
                $data['city'] ?? null,
                $data['state'] ?? null,
                $data['cep'] ?? null,
                $company_id
            ]);
            
            $stmt = $pdo->prepare("SELECT * FROM customers WHERE id = ? AND company_id = ?");
            $stmt->execute([$id, $company_id]);
            $customer = $stmt->fetch(PDO::FETCH_ASSOC);
            
            echo json_encode(['success' => true, 'customer' => $customer, 'isNew' => true]);
        }
        break;

    case 'DELETE':
        if (!isset($_GET['id'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Customer ID is required']);
            exit();
        }
        
        $stmt = $pdo->prepare("DELETE FROM customers WHERE id = ? AND company_id = ?");
        $stmt->execute([$_GET['id'], $company_id]);
        
        echo json_encode(['success' => true]);
        break;

    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        break;
}
?>
