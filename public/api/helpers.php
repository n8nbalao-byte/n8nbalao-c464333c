<?php
// =====================================================
// HELPERS - Funções Auxiliares para Multi-Tenancy
// =====================================================

// Configurações do Banco de Dados
if (!defined('DB_HOST')) {
    define('DB_HOST', 'localhost');
    define('DB_USER', 'u770915504_n8nbalao');
    define('DB_PASS', 'Balao2025');
    define('DB_NAME', 'u770915504_n8nbalao');
}

// =====================================================
// DETECTAR COMPANY_ID
// =====================================================
function detectCompanyId() {
    // Prioridade 1: Header HTTP (para Master Admin)
    if (isset($_SERVER['HTTP_X_COMPANY_ID'])) {
        return intval($_SERVER['HTTP_X_COMPANY_ID']);
    }
    
    // Prioridade 2: Sessão PHP (se usuário estiver logado)
    session_start();
    if (isset($_SESSION['company_id'])) {
        return intval($_SESSION['company_id']);
    }
    
    // Prioridade 3: Detectar por domínio
    $domain = $_SERVER['HTTP_HOST'] ?? '';
    
    // Remover porta se houver
    $domain = explode(':', $domain)[0];
    
    // Tentar detectar por domínio
    $companyId = detectCompanyByDomain($domain);
    if ($companyId) {
        return $companyId;
    }
    
    // Fallback: Empresa padrão (desenvolvimento)
    return 1;
}

// =====================================================
// DETECTAR EMPRESA POR DOMÍNIO
// =====================================================
function detectCompanyByDomain($domain) {
    try {
        $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
        
        if ($conn->connect_error) {
            return null;
        }
        
        $conn->set_charset('utf8mb4');
        
        // Tentar por domínio próprio
        $stmt = $conn->prepare("
            SELECT id FROM companies 
            WHERE custom_domain = ? 
            AND status IN ('active', 'trial')
            LIMIT 1
        ");
        $stmt->bind_param("s", $domain);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($row = $result->fetch_assoc()) {
            $stmt->close();
            $conn->close();
            return intval($row['id']);
        }
        $stmt->close();
        
        // Tentar por subdomínio (ex: loja1.n8nbalao.com)
        if (strpos($domain, '.') !== false) {
            $parts = explode('.', $domain);
            $slug = $parts[0]; // Primeiro segmento
            
            $stmt = $conn->prepare("
                SELECT id FROM companies 
                WHERE slug = ? 
                AND status IN ('active', 'trial')
                LIMIT 1
            ");
            $stmt->bind_param("s", $slug);
            $stmt->execute();
            $result = $stmt->get_result();
            
            if ($row = $result->fetch_assoc()) {
                $stmt->close();
                $conn->close();
                return intval($row['id']);
            }
            $stmt->close();
        }
        
        $conn->close();
        return null;
        
    } catch (Exception $e) {
        return null;
    }
}

// =====================================================
// VALIDAR ACESSO À EMPRESA
// =====================================================
function validateCompanyAccess($companyId, $userId = null) {
    try {
        $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
        
        if ($conn->connect_error) {
            return false;
        }
        
        $conn->set_charset('utf8mb4');
        
        // Verificar se empresa existe e está ativa
        $stmt = $conn->prepare("
            SELECT id FROM companies 
            WHERE id = ? 
            AND status IN ('active', 'trial')
            LIMIT 1
        ");
        $stmt->bind_param("i", $companyId);
        $stmt->execute();
        $result = $stmt->get_result();
        $exists = $result->num_rows > 0;
        $stmt->close();
        
        // Se passou userId, verificar se pertence à empresa
        if ($exists && $userId) {
            $stmt = $conn->prepare("
                SELECT id FROM users 
                WHERE id = ? 
                AND company_id = ?
                LIMIT 1
            ");
            $stmt->bind_param("ii", $userId, $companyId);
            $stmt->execute();
            $result = $stmt->get_result();
            $exists = $result->num_rows > 0;
            $stmt->close();
        }
        
        $conn->close();
        return $exists;
        
    } catch (Exception $e) {
        return false;
    }
}

// =====================================================
// GET COMPANY DATA
// =====================================================
function getCompanyData($companyId) {
    try {
        $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
        
        if ($conn->connect_error) {
            return null;
        }
        
        $conn->set_charset('utf8mb4');
        
        $stmt = $conn->prepare("SELECT * FROM companies WHERE id = ? LIMIT 1");
        $stmt->bind_param("i", $companyId);
        $stmt->execute();
        $result = $stmt->get_result();
        $company = $result->fetch_assoc();
        $stmt->close();
        $conn->close();
        
        if ($company && $company['settings']) {
            $company['settings'] = json_decode($company['settings'], true);
        }
        
        return $company;
        
    } catch (Exception $e) {
        return null;
    }
}

// =====================================================
// CHECK FEATURE ACCESS
// =====================================================
function hasFeature($companyId, $feature) {
    $company = getCompanyData($companyId);
    
    if (!$company) {
        return false;
    }
    
    // Verificar features ativáveis
    $activableFeatures = [
        'monte_pc' => 'feature_monte_pc',
        'marketplace' => 'feature_marketplace',
        'consignacao' => 'feature_consignacao',
    ];
    
    if (isset($activableFeatures[$feature])) {
        return (bool) $company[$activableFeatures[$feature]];
    }
    
    // Verificar features por plano
    $plan = $company['plan'];
    
    $planFeatures = [
        'basic' => ['monte_pc'],
        'pro' => ['monte_pc', 'bulk_import', 'marketplace', 'consignacao'],
        'enterprise' => ['monte_pc', 'bulk_import', 'marketplace', 'consignacao', 'google_builder', 'n8n'],
    ];
    
    if (!isset($planFeatures[$plan])) {
        return false;
    }
    
    return in_array($feature, $planFeatures[$plan]);
}

// =====================================================
// LOG ACTIVITY (Opcional - para auditoria)
// =====================================================
function logActivity($companyId, $action, $details = null) {
    try {
        $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
        
        if ($conn->connect_error) {
            return false;
        }
        
        $conn->set_charset('utf8mb4');
        
        // Criar tabela de logs se não existir
        $conn->query("
            CREATE TABLE IF NOT EXISTS activity_logs (
                id INT PRIMARY KEY AUTO_INCREMENT,
                company_id INT NOT NULL,
                action VARCHAR(255) NOT NULL,
                details TEXT,
                ip_address VARCHAR(45),
                user_agent TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_company (company_id),
                INDEX idx_created (created_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        ");
        
        $stmt = $conn->prepare("
            INSERT INTO activity_logs (company_id, action, details, ip_address, user_agent)
            VALUES (?, ?, ?, ?, ?)
        ");
        
        $ipAddress = $_SERVER['REMOTE_ADDR'] ?? null;
        $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? null;
        $detailsJson = $details ? json_encode($details) : null;
        
        $stmt->bind_param(
            "issss",
            $companyId,
            $action,
            $detailsJson,
            $ipAddress,
            $userAgent
        );
        
        $result = $stmt->execute();
        $stmt->close();
        $conn->close();
        
        return $result;
        
    } catch (Exception $e) {
        return false;
    }
}

// =====================================================
// RESPONSE HELPERS
// =====================================================
function jsonResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    header('Content-Type: application/json');
    echo json_encode($data);
    exit();
}

function jsonError($message, $statusCode = 400) {
    jsonResponse(['error' => $message], $statusCode);
}

function jsonSuccess($data = [], $message = 'Success') {
    jsonResponse(array_merge(['success' => true, 'message' => $message], $data));
}

// =====================================================
// CORS HEADERS
// =====================================================
function setCorsHeaders() {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, X-Company-ID, Authorization');
    
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit();
    }
}
?>
