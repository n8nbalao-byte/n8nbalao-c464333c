<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Configurações do Banco de Dados Hostinger
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

// Create company table if it doesn't exist
$pdo->exec("
    CREATE TABLE IF NOT EXISTS company (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        address VARCHAR(500),
        city VARCHAR(255),
        phone VARCHAR(50),
        email VARCHAR(255),
        cnpj VARCHAR(30),
        seller VARCHAR(255),
        logo LONGTEXT,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
");

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        // Get company data (always returns the first/only record)
        $stmt = $pdo->query("SELECT * FROM company LIMIT 1");
        $company = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($company) {
            echo json_encode($company);
        } else {
            // Return default empty data if no company exists
            echo json_encode([
                'id' => null,
                'name' => '',
                'address' => '',
                'city' => '',
                'phone' => '',
                'email' => '',
                'cnpj' => '',
                'seller' => '',
                'logo' => ''
            ]);
        }
        break;

    case 'POST':
    case 'PUT':
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!$data) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid JSON data']);
            exit();
        }

        // Check if company record exists
        $stmt = $pdo->query("SELECT id FROM company LIMIT 1");
        $existing = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($existing) {
            // Update existing record
            $stmt = $pdo->prepare("
                UPDATE company SET 
                    name = ?,
                    address = ?,
                    city = ?,
                    phone = ?,
                    email = ?,
                    cnpj = ?,
                    seller = ?,
                    logo = ?
                WHERE id = ?
            ");
            $stmt->execute([
                $data['name'] ?? '',
                $data['address'] ?? '',
                $data['city'] ?? '',
                $data['phone'] ?? '',
                $data['email'] ?? '',
                $data['cnpj'] ?? '',
                $data['seller'] ?? '',
                $data['logo'] ?? '',
                $existing['id']
            ]);
        } else {
            // Insert new record
            $stmt = $pdo->prepare("
                INSERT INTO company (name, address, city, phone, email, cnpj, seller, logo)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $data['name'] ?? '',
                $data['address'] ?? '',
                $data['city'] ?? '',
                $data['phone'] ?? '',
                $data['email'] ?? '',
                $data['cnpj'] ?? '',
                $data['seller'] ?? '',
                $data['logo'] ?? ''
            ]);
        }

        echo json_encode(['success' => true, 'message' => 'Company data saved']);
        break;

    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        break;
}
?>
