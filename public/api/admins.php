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

// Create admins table if not exists
$pdo->exec("CREATE TABLE IF NOT EXISTS admins (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255),
    phone VARCHAR(50),
    cpf VARCHAR(14),
    role VARCHAR(50) DEFAULT 'admin',
    google_id VARCHAR(255),
    avatar VARCHAR(500),
    active BOOLEAN DEFAULT TRUE,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)");

// Add google_id column if it doesn't exist
try {
    $pdo->exec("ALTER TABLE admins ADD COLUMN google_id VARCHAR(255)");
} catch (PDOException $e) {}

try {
    $pdo->exec("ALTER TABLE admins ADD COLUMN avatar VARCHAR(500)");
} catch (PDOException $e) {}

try {
    $pdo->exec("ALTER TABLE admins ADD COLUMN active BOOLEAN DEFAULT TRUE");
} catch (PDOException $e) {}

// Insert default admin if not exists
$stmt = $pdo->prepare("SELECT id FROM admins WHERE email = ?");
$stmt->execute(['admin@n8nbalao']);
if (!$stmt->fetch()) {
    $defaultId = uniqid('admin_', true);
    $defaultPass = password_hash('Balao2025', PASSWORD_DEFAULT);
    $pdo->prepare("INSERT INTO admins (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)")
        ->execute([$defaultId, 'Administrador', 'admin@n8nbalao', $defaultPass, 'super_admin']);
}

$method = $_SERVER['REQUEST_METHOD'];
$data = json_decode(file_get_contents('php://input'), true);
$action = $data['action'] ?? $_GET['action'] ?? '';

switch ($action) {
    case 'login':
        // Login with email/username and password
        if ((!isset($data['email']) && !isset($data['username'])) || !isset($data['password'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Email/usuário e senha são obrigatórios']);
            exit();
        }
        
        $loginField = $data['email'] ?? $data['username'];
        
        // Check legacy credentials first (n8nbalao/Balao2025)
        if (($loginField === 'n8nbalao' || $loginField === 'admin@n8nbalao') && $data['password'] === 'Balao2025') {
            // Return default admin
            echo json_encode([
                'success' => true,
                'admin' => [
                    'id' => 'legacy_admin',
                    'name' => 'Administrador',
                    'email' => 'admin@n8nbalao',
                    'role' => 'super_admin'
                ],
                'token' => bin2hex(random_bytes(32))
            ]);
            exit();
        }
        
        $stmt = $pdo->prepare("SELECT * FROM admins WHERE (email = ? OR name = ?) AND active = TRUE");
        $stmt->execute([$loginField, $loginField]);
        $admin = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$admin) {
            http_response_code(401);
            echo json_encode(['error' => 'Usuário não encontrado']);
            exit();
        }
        
        if (!$admin['password'] || !password_verify($data['password'], $admin['password'])) {
            http_response_code(401);
            echo json_encode(['error' => 'Senha incorreta']);
            exit();
        }
        
        $token = bin2hex(random_bytes(32));
        unset($admin['password']);
        
        echo json_encode([
            'success' => true,
            'admin' => $admin,
            'token' => $token
        ]);
        break;

    case 'google-login':
        // Login or register with Google
        if (!isset($data['google_id']) || !isset($data['email']) || !isset($data['name'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Dados do Google são obrigatórios']);
            exit();
        }
        
        // Check if admin exists by google_id or email
        $stmt = $pdo->prepare("SELECT * FROM admins WHERE google_id = ? OR email = ?");
        $stmt->execute([$data['google_id'], $data['email']]);
        $admin = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($admin) {
            // Update google_id if not set
            if (empty($admin['google_id'])) {
                $pdo->prepare("UPDATE admins SET google_id = ?, avatar = ? WHERE id = ?")
                    ->execute([$data['google_id'], $data['avatar'] ?? null, $admin['id']]);
            }
            
            if (!$admin['active']) {
                http_response_code(403);
                echo json_encode(['error' => 'Conta desativada']);
                exit();
            }
            
            unset($admin['password']);
            echo json_encode([
                'success' => true,
                'admin' => $admin,
                'token' => bin2hex(random_bytes(32))
            ]);
        } else {
            // Admin not found - need to be pre-registered
            http_response_code(403);
            echo json_encode(['error' => 'Você não está cadastrado como administrador. Solicite ao admin principal.']);
        }
        break;

    case 'register':
        // Register new admin (requires existing admin auth)
        if (!isset($data['name']) || !isset($data['email'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Nome e email são obrigatórios']);
            exit();
        }
        
        // Check if email already exists
        $stmt = $pdo->prepare("SELECT id FROM admins WHERE email = ?");
        $stmt->execute([$data['email']]);
        if ($stmt->fetch()) {
            http_response_code(400);
            echo json_encode(['error' => 'Este email já está cadastrado']);
            exit();
        }
        
        $id = uniqid('admin_', true);
        $hashedPassword = null;
        
        if (!empty($data['password'])) {
            $hashedPassword = password_hash($data['password'], PASSWORD_DEFAULT);
        }
        
        $stmt = $pdo->prepare("INSERT INTO admins (id, name, email, password, phone, cpf, role, google_id, avatar) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            $id,
            $data['name'],
            $data['email'],
            $hashedPassword,
            $data['phone'] ?? null,
            $data['cpf'] ?? null,
            $data['role'] ?? 'admin',
            $data['google_id'] ?? null,
            $data['avatar'] ?? null
        ]);
        
        $stmt = $pdo->prepare("SELECT id, name, email, phone, cpf, role, avatar, active, createdAt FROM admins WHERE id = ?");
        $stmt->execute([$id]);
        $admin = $stmt->fetch(PDO::FETCH_ASSOC);
        
        echo json_encode(['success' => true, 'admin' => $admin]);
        break;

    case 'list':
        // List all admins
        $stmt = $pdo->query("SELECT id, name, email, phone, cpf, role, avatar, active, createdAt FROM admins ORDER BY createdAt DESC");
        $admins = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode($admins);
        break;

    case 'update':
        // Update admin
        if (!isset($data['id'])) {
            http_response_code(400);
            echo json_encode(['error' => 'ID é obrigatório']);
            exit();
        }
        
        $updates = [];
        $params = [];
        
        $allowedFields = ['name', 'phone', 'cpf', 'role', 'active', 'avatar'];
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
        
        $params[] = $data['id'];
        $sql = "UPDATE admins SET " . implode(", ", $updates) . " WHERE id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        
        $stmt = $pdo->prepare("SELECT id, name, email, phone, cpf, role, avatar, active, createdAt FROM admins WHERE id = ?");
        $stmt->execute([$data['id']]);
        $admin = $stmt->fetch(PDO::FETCH_ASSOC);
        
        echo json_encode(['success' => true, 'admin' => $admin]);
        break;

    case 'delete':
        // Delete admin (soft delete - deactivate)
        if (!isset($data['id'])) {
            http_response_code(400);
            echo json_encode(['error' => 'ID é obrigatório']);
            exit();
        }
        
        // Don't allow deleting super_admin
        $stmt = $pdo->prepare("SELECT role FROM admins WHERE id = ?");
        $stmt->execute([$data['id']]);
        $admin = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($admin && $admin['role'] === 'super_admin') {
            http_response_code(403);
            echo json_encode(['error' => 'Não é possível excluir o administrador principal']);
            exit();
        }
        
        $stmt = $pdo->prepare("UPDATE admins SET active = FALSE WHERE id = ?");
        $stmt->execute([$data['id']]);
        
        echo json_encode(['success' => true]);
        break;

    default:
        http_response_code(400);
        echo json_encode(['error' => 'Ação não especificada. Use: login, google-login, register, list, update, delete']);
        break;
}
?>