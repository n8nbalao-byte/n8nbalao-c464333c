<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
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
    echo json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]);
    exit();
}

// Create customers table if not exists (with password field)
$pdo->exec("CREATE TABLE IF NOT EXISTS customers (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255),
    phone VARCHAR(50),
    cpf VARCHAR(14),
    address VARCHAR(500),
    city VARCHAR(100),
    state VARCHAR(50),
    cep VARCHAR(10),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)");

// Add password column if it doesn't exist
try {
    $pdo->exec("ALTER TABLE customers ADD COLUMN password VARCHAR(255)");
} catch (PDOException $e) {
    // Column already exists
}

$method = $_SERVER['REQUEST_METHOD'];
$data = json_decode(file_get_contents('php://input'), true);
$action = $data['action'] ?? $_GET['action'] ?? '';

switch ($action) {
    case 'register':
        // Register new customer with password
        if (!isset($data['email']) || !isset($data['password']) || !isset($data['name'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Nome, email e senha são obrigatórios']);
            exit();
        }
        
        // Check if email already exists
        $stmt = $pdo->prepare("SELECT id FROM customers WHERE email = ?");
        $stmt->execute([$data['email']]);
        if ($stmt->fetch()) {
            http_response_code(400);
            echo json_encode(['error' => 'Este email já está cadastrado']);
            exit();
        }
        
        $id = uniqid('cust_', true);
        $hashedPassword = password_hash($data['password'], PASSWORD_DEFAULT);
        
        $stmt = $pdo->prepare("INSERT INTO customers (id, name, email, password, phone, cpf, address, city, state, cep) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            $id,
            $data['name'],
            $data['email'],
            $hashedPassword,
            $data['phone'] ?? null,
            $data['cpf'] ?? null,
            $data['address'] ?? null,
            $data['city'] ?? null,
            $data['state'] ?? null,
            $data['cep'] ?? null
        ]);
        
        // Generate simple token
        $token = bin2hex(random_bytes(32));
        
        // Return customer without password
        $stmt = $pdo->prepare("SELECT id, name, email, phone, cpf, address, city, state, cep, createdAt FROM customers WHERE id = ?");
        $stmt->execute([$id]);
        $customer = $stmt->fetch(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'customer' => $customer,
            'token' => $token
        ]);
        break;

    case 'login':
        // Login with email and password
        if (!isset($data['email']) || !isset($data['password'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Email e senha são obrigatórios']);
            exit();
        }
        
        $stmt = $pdo->prepare("SELECT * FROM customers WHERE email = ?");
        $stmt->execute([$data['email']]);
        $customer = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$customer) {
            http_response_code(401);
            echo json_encode(['error' => 'Email não encontrado']);
            exit();
        }
        
        if (!$customer['password'] || !password_verify($data['password'], $customer['password'])) {
            http_response_code(401);
            echo json_encode(['error' => 'Senha incorreta']);
            exit();
        }
        
        // Generate simple token
        $token = bin2hex(random_bytes(32));
        
        // Remove password from response
        unset($customer['password']);
        
        echo json_encode([
            'success' => true,
            'customer' => $customer,
            'token' => $token
        ]);
        break;

    case 'update-profile':
        // Update customer profile
        if (!isset($data['email'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Email é obrigatório']);
            exit();
        }
        
        $updates = [];
        $params = [];
        
        $allowedFields = ['name', 'phone', 'cpf', 'address', 'city', 'state', 'cep'];
        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                $updates[] = "$field = ?";
                $params[] = $data[$field];
            }
        }
        
        if (isset($data['newPassword']) && !empty($data['newPassword'])) {
            $updates[] = "password = ?";
            $params[] = password_hash($data['newPassword'], PASSWORD_DEFAULT);
        }
        
        if (empty($updates)) {
            http_response_code(400);
            echo json_encode(['error' => 'Nenhum campo para atualizar']);
            exit();
        }
        
        $params[] = $data['email'];
        $sql = "UPDATE customers SET " . implode(", ", $updates) . " WHERE email = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        
        // Return updated customer
        $stmt = $pdo->prepare("SELECT id, name, email, phone, cpf, address, city, state, cep, createdAt FROM customers WHERE email = ?");
        $stmt->execute([$data['email']]);
        $customer = $stmt->fetch(PDO::FETCH_ASSOC);
        
        echo json_encode(['success' => true, 'customer' => $customer]);
        break;

    case 'get-orders':
        // Get orders for a customer
        if (!isset($data['customerId']) && !isset($_GET['customerId'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Customer ID é obrigatório']);
            exit();
        }
        
        $customerId = $data['customerId'] ?? $_GET['customerId'];
        
        $stmt = $pdo->prepare("SELECT * FROM orders WHERE customerId = ? ORDER BY createdAt DESC");
        $stmt->execute([$customerId]);
        $orders = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($orders as &$order) {
            $order['items'] = json_decode($order['items'], true);
        }
        
        echo json_encode($orders);
        break;

    case 'reset-password':
        // Admin reset password for customer
        if (!isset($data['customerId']) || !isset($data['newPassword'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Customer ID e nova senha são obrigatórios']);
            exit();
        }
        
        $hashedPassword = password_hash($data['newPassword'], PASSWORD_DEFAULT);
        
        $stmt = $pdo->prepare("UPDATE customers SET password = ? WHERE id = ?");
        $stmt->execute([$hashedPassword, $data['customerId']]);
        
        if ($stmt->rowCount() > 0) {
            echo json_encode(['success' => true, 'message' => 'Senha resetada com sucesso']);
        } else {
            http_response_code(404);
            echo json_encode(['error' => 'Cliente não encontrado']);
        }
        break;

    default:
        http_response_code(400);
        echo json_encode(['error' => 'Ação não especificada. Use: register, login, update-profile, get-orders, reset-password']);
        break;
}
?>
