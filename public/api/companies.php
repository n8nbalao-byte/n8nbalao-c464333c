<?php
// =====================================================
// COMPANIES API - Gerenciamento de Empresas
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
    
    // GET - Listar empresas ou buscar por ID
    if ($method === 'GET') {
        $id = isset($_GET['id']) ? intval($_GET['id']) : null;
        
        if ($id) {
            // Buscar empresa específica
            $stmt = $conn->prepare("SELECT * FROM companies WHERE id = ?");
            $stmt->bind_param("i", $id);
            $stmt->execute();
            $result = $stmt->get_result();
            $company = $result->fetch_assoc();
            
            if ($company) {
                // Parsear JSON fields
                if ($company['settings']) {
                    $company['settings'] = json_decode($company['settings'], true);
                }
                $company['feature_monte_pc'] = (bool) $company['feature_monte_pc'];
                $company['feature_marketplace'] = (bool) $company['feature_marketplace'];
                $company['feature_consignacao'] = (bool) $company['feature_consignacao'];
                
                echo json_encode($company);
            } else {
                http_response_code(404);
                echo json_encode(['error' => 'Company not found']);
            }
            
            $stmt->close();
        } else {
            // Listar todas as empresas
            $result = $conn->query("
                SELECT 
                    id, name, slug, email, plan, status, 
                    trial_ends_at, subscription_ends_at,
                    created_at, updated_at
                FROM companies 
                ORDER BY created_at DESC
            ");
            
            $companies = [];
            while ($row = $result->fetch_assoc()) {
                $companies[] = $row;
            }
            
            echo json_encode($companies);
        }
    }
    
    // POST - Criar nova empresa
    elseif ($method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        
        // Validações
        if (empty($data['name']) || empty($data['slug']) || empty($data['email'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Name, slug and email are required']);
            exit();
        }
        
        // Verificar se slug já existe
        $stmt = $conn->prepare("SELECT id FROM companies WHERE slug = ?");
        $stmt->bind_param("s", $data['slug']);
        $stmt->execute();
        $result = $stmt->get_result();
        if ($result->num_rows > 0) {
            http_response_code(400);
            echo json_encode(['error' => 'Slug already exists']);
            $stmt->close();
            exit();
        }
        $stmt->close();
        
        // Inserir empresa
        $stmt = $conn->prepare("
            INSERT INTO companies (
                name, slug, custom_domain, email, 
                cnpj, phone, address, city, seller,
                logo, primary_color, secondary_color, accent_color,
                plan, status, 
                trial_ends_at, subscription_ends_at,
                feature_monte_pc, feature_marketplace, feature_consignacao,
                settings, created_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        
        $name = $data['name'];
        $slug = $data['slug'];
        $custom_domain = $data['custom_domain'] ?? null;
        $email = $data['email'];
        $cnpj = $data['cnpj'] ?? null;
        $phone = $data['phone'] ?? null;
        $address = $data['address'] ?? null;
        $city = $data['city'] ?? null;
        $seller = $data['seller'] ?? null;
        $logo = $data['logo'] ?? null;
        $primary_color = $data['primary_color'] ?? '#E31C23';
        $secondary_color = $data['secondary_color'] ?? '#FFFFFF';
        $accent_color = $data['accent_color'] ?? '#DC2626';
        $plan = $data['plan'] ?? 'basic';
        $status = $data['status'] ?? 'trial';
        $trial_ends_at = $data['trial_ends_at'] ?? null;
        $subscription_ends_at = $data['subscription_ends_at'] ?? null;
        $feature_monte_pc = isset($data['feature_monte_pc']) ? (int)$data['feature_monte_pc'] : 1;
        $feature_marketplace = isset($data['feature_marketplace']) ? (int)$data['feature_marketplace'] : 0;
        $feature_consignacao = isset($data['feature_consignacao']) ? (int)$data['feature_consignacao'] : 0;
        $settings = isset($data['settings']) ? json_encode($data['settings']) : null;
        $created_by = 'master-admin';
        
        $stmt->bind_param(
            "sssssssssssssssssiiiis",
            $name, $slug, $custom_domain, $email,
            $cnpj, $phone, $address, $city, $seller,
            $logo, $primary_color, $secondary_color, $accent_color,
            $plan, $status,
            $trial_ends_at, $subscription_ends_at,
            $feature_monte_pc, $feature_marketplace, $feature_consignacao,
            $settings, $created_by
        );
        
        if ($stmt->execute()) {
            $newId = $conn->insert_id;
            echo json_encode([
                'success' => true,
                'id' => $newId,
                'message' => 'Company created successfully'
            ]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to create company']);
        }
        
        $stmt->close();
    }
    
    // PUT - Atualizar empresa
    elseif ($method === 'PUT') {
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (empty($data['id'])) {
            http_response_code(400);
            echo json_encode(['error' => 'ID is required']);
            exit();
        }
        
        $id = intval($data['id']);
        
        // Construir query dinâmica
        $updates = [];
        $types = "";
        $values = [];
        
        $allowedFields = [
            'name' => 's', 'slug' => 's', 'custom_domain' => 's', 'email' => 's',
            'cnpj' => 's', 'phone' => 's', 'address' => 's', 'city' => 's', 'seller' => 's',
            'logo' => 's', 'primary_color' => 's', 'secondary_color' => 's', 'accent_color' => 's',
            'plan' => 's', 'status' => 's',
            'trial_ends_at' => 's', 'subscription_ends_at' => 's',
            'feature_monte_pc' => 'i', 'feature_marketplace' => 'i', 'feature_consignacao' => 'i'
        ];
        
        foreach ($allowedFields as $field => $type) {
            if (isset($data[$field])) {
                $updates[] = "$field = ?";
                $types .= $type;
                $values[] = $data[$field];
            }
        }
        
        if (empty($updates)) {
            http_response_code(400);
            echo json_encode(['error' => 'No fields to update']);
            exit();
        }
        
        $sql = "UPDATE companies SET " . implode(', ', $updates) . " WHERE id = ?";
        $types .= "i";
        $values[] = $id;
        
        $stmt = $conn->prepare($sql);
        $stmt->bind_param($types, ...$values);
        
        if ($stmt->execute()) {
            echo json_encode([
                'success' => true,
                'message' => 'Company updated successfully'
            ]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to update company']);
        }
        
        $stmt->close();
    }
    
    // DELETE - Deletar empresa
    elseif ($method === 'DELETE') {
        $id = isset($_GET['id']) ? intval($_GET['id']) : null;
        
        if (!$id) {
            http_response_code(400);
            echo json_encode(['error' => 'ID is required']);
            exit();
        }
        
        // Não permitir deletar empresa ID 1 (principal)
        if ($id === 1) {
            http_response_code(403);
            echo json_encode(['error' => 'Cannot delete main company']);
            exit();
        }
        
        $stmt = $conn->prepare("DELETE FROM companies WHERE id = ?");
        $stmt->bind_param("i", $id);
        
        if ($stmt->execute()) {
            echo json_encode([
                'success' => true,
                'message' => 'Company deleted successfully'
            ]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to delete company']);
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
?>
