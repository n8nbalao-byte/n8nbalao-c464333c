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

// Create company table if it doesn't exist (with color fields)
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
        primaryColor VARCHAR(20) DEFAULT '#E31C23',
        secondaryColor VARCHAR(20) DEFAULT '#FFFFFF',
        accentColor VARCHAR(20) DEFAULT '#DC2626',
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
");

// Add color columns if they don't exist (migration for existing tables)
try {
    $pdo->exec("ALTER TABLE company ADD COLUMN primaryColor VARCHAR(20) DEFAULT '#E31C23'");
} catch (PDOException $e) {
    // Column already exists, ignore
}
try {
    $pdo->exec("ALTER TABLE company ADD COLUMN secondaryColor VARCHAR(20) DEFAULT '#FFFFFF'");
} catch (PDOException $e) {
    // Column already exists, ignore
}
try {
    $pdo->exec("ALTER TABLE company ADD COLUMN accentColor VARCHAR(20) DEFAULT '#DC2626'");
} catch (PDOException $e) {
    // Column already exists, ignore
}

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
                'logo' => '',
                'primaryColor' => '#E31C23',
                'secondaryColor' => '#FFFFFF',
                'accentColor' => '#DC2626'
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
                    logo = ?,
                    primaryColor = ?,
                    secondaryColor = ?,
                    accentColor = ?
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
                $data['primaryColor'] ?? '#E31C23',
                $data['secondaryColor'] ?? '#FFFFFF',
                $data['accentColor'] ?? '#DC2626',
                $existing['id']
            ]);
        } else {
            // Insert new record
            $stmt = $pdo->prepare("
                INSERT INTO company (name, address, city, phone, email, cnpj, seller, logo, primaryColor, secondaryColor, accentColor)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
                $data['primaryColor'] ?? '#E31C23',
                $data['secondaryColor'] ?? '#FFFFFF',
                $data['accentColor'] ?? '#DC2626'
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
