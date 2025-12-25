<?php
// =====================================================
// LICENSES API - Gerenciamento de Licenças
// =====================================================

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Configurações do Banco de Dados
define('DB_HOST', 'localhost');
define('DB_USER', 'u770915504_n8nbalao');
define('DB_PASS', 'Balao2025');
define('DB_NAME', 'u770915504_n8nbalao');

try {
    $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
    
    if ($conn->connect_error) {
        throw new Exception('Database connection failed');
    }
    
    $conn->set_charset('utf8mb4');
    
    $method = $_SERVER['REQUEST_METHOD'];
    
    // GET - Listar licenças
    if ($method === 'GET') {
        $status = isset($_GET['status']) ? $_GET['status'] : null;
        
        $sql = "
            SELECT 
                l.*,
                c.name as company_name
            FROM licenses l
            LEFT JOIN companies c ON c.id = l.company_id
        ";
        
        if ($status) {
            $sql .= " WHERE l.status = ?";
        }
        
        $sql .= " ORDER BY l.generated_at DESC";
        
        if ($status) {
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("s", $status);
            $stmt->execute();
            $result = $stmt->get_result();
        } else {
            $result = $conn->query($sql);
        }
        
        $licenses = [];
        while ($row = $result->fetch_assoc()) {
            $licenses[] = $row;
        }
        
        echo json_encode($licenses);
    }
    
    // POST - Gerar nova licença
    elseif ($method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        
        // Validações
        if (empty($data['email']) || empty($data['plan'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Email and plan are required']);
            exit();
        }
        
        // Gerar chave de licença
        $licenseKey = generateLicenseKey($data['plan'], $data['email']);
        
        // Calcular data de expiração
        $durationMonths = isset($data['duration_months']) ? intval($data['duration_months']) : 12;
        $expiresAt = date('Y-m-d H:i:s', strtotime("+$durationMonths months"));
        
        // Inserir licença
        $stmt = $conn->prepare("
            INSERT INTO licenses (
                license_key, plan, email, status,
                duration_months, expires_at,
                generated_by, notes
            ) VALUES (?, ?, ?, 'unused', ?, ?, 'master-admin', ?)
        ");
        
        $email = $data['email'];
        $plan = $data['plan'];
        $notes = $data['notes'] ?? null;
        
        $stmt->bind_param(
            "sssiss",
            $licenseKey, $plan, $email,
            $durationMonths, $expiresAt, $notes
        );
        
        if ($stmt->execute()) {
            $newId = $conn->insert_id;
            
            // Buscar licença criada
            $stmt2 = $conn->prepare("SELECT * FROM licenses WHERE id = ?");
            $stmt2->bind_param("i", $newId);
            $stmt2->execute();
            $result = $stmt2->get_result();
            $license = $result->fetch_assoc();
            
            echo json_encode([
                'success' => true,
                'license' => $license
            ]);
            
            $stmt2->close();
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to generate license']);
        }
        
        $stmt->close();
    }
    
    // PUT - Atualizar licença (revogar, etc)
    elseif ($method === 'PUT') {
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (empty($data['id'])) {
            http_response_code(400);
            echo json_encode(['error' => 'ID is required']);
            exit();
        }
        
        $id = intval($data['id']);
        $status = $data['status'] ?? null;
        
        if ($status) {
            $stmt = $conn->prepare("UPDATE licenses SET status = ? WHERE id = ?");
            $stmt->bind_param("si", $status, $id);
            
            if ($stmt->execute()) {
                echo json_encode([
                    'success' => true,
                    'message' => 'License updated successfully'
                ]);
            } else {
                http_response_code(500);
                echo json_encode(['error' => 'Failed to update license']);
            }
            
            $stmt->close();
        } else {
            http_response_code(400);
            echo json_encode(['error' => 'No fields to update']);
        }
    }
    
    // DELETE - Deletar licença
    elseif ($method === 'DELETE') {
        $id = isset($_GET['id']) ? intval($_GET['id']) : null;
        
        if (!$id) {
            http_response_code(400);
            echo json_encode(['error' => 'ID is required']);
            exit();
        }
        
        $stmt = $conn->prepare("DELETE FROM licenses WHERE id = ?");
        $stmt->bind_param("i", $id);
        
        if ($stmt->execute()) {
            echo json_encode([
                'success' => true,
                'message' => 'License deleted successfully'
            ]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to delete license']);
        }
        
        $stmt->close();
    }
    
    $conn->close();
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Internal server error',
        'message' => $e->getMessage()
    ]);
}

// =====================================================
// HELPER: Gerar Chave de Licença
// =====================================================
function generateLicenseKey($plan, $email) {
    // Formato: PLAN-YYYYMM-RANDOM-CHECKSUM-EMAIL
    // Exemplo: ENT-202412-A3F9K-8H2J-N8NB
    
    $planPrefix = [
        'basic' => 'BAS',
        'pro' => 'PRO',
        'enterprise' => 'ENT'
    ];
    
    $prefix = $planPrefix[$plan] ?? 'BAS';
    $date = date('Ym');
    $random = strtoupper(substr(md5(uniqid(rand(), true)), 0, 5));
    $emailHash = strtoupper(substr(md5($email), 0, 4));
    
    // Checksum simples
    $data = $prefix . $date . $random . $emailHash;
    $checksum = strtoupper(substr(md5($data), 0, 4));
    
    return "$prefix-$date-$random-$checksum-$emailHash";
}
?>
