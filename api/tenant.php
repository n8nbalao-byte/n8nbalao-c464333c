<?php
// =====================================================
// TENANT API - Detecção de Empresa (Tenant)
// =====================================================
// Detecta qual empresa está acessando baseado em:
// - Domínio próprio
// - Subdomínio
// - ID ou slug

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once 'config.php';

try {
    $conn = getDBConnection();
    
    // Parâmetros de detecção
    $domain = isset($_GET['domain']) ? trim($_GET['domain']) : null;
    $slug = isset($_GET['slug']) ? trim($_GET['slug']) : null;
    $id = isset($_GET['id']) ? intval($_GET['id']) : null;
    
    $company = null;
    
    // 1. Tentar por domínio próprio
    if ($domain) {
        $stmt = $conn->prepare("
            SELECT * FROM companies 
            WHERE custom_domain = ? 
            AND status IN ('active', 'trial')
            LIMIT 1
        ");
        $stmt->bind_param("s", $domain);
        $stmt->execute();
        $result = $stmt->get_result();
        $company = $result->fetch_assoc();
        $stmt->close();
    }
    
    // 2. Tentar por slug (subdomínio)
    if (!$company && $slug) {
        $stmt = $conn->prepare("
            SELECT * FROM companies 
            WHERE slug = ? 
            AND status IN ('active', 'trial')
            LIMIT 1
        ");
        $stmt->bind_param("s", $slug);
        $stmt->execute();
        $result = $stmt->get_result();
        $company = $result->fetch_assoc();
        $stmt->close();
    }
    
    // 3. Tentar por ID
    if (!$company && $id) {
        $stmt = $conn->prepare("
            SELECT * FROM companies 
            WHERE id = ? 
            AND status IN ('active', 'trial')
            LIMIT 1
        ");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $result = $stmt->get_result();
        $company = $result->fetch_assoc();
        $stmt->close();
    }
    
    // 4. Se não encontrou, retornar erro
    if (!$company) {
        http_response_code(404);
        echo json_encode([
            'error' => 'Company not found',
            'message' => 'Empresa não encontrada ou inativa'
        ]);
        exit();
    }
    
    // Parsear settings JSON
    if ($company['settings']) {
        $company['settings'] = json_decode($company['settings'], true);
    }
    
    // Converter booleanos
    $company['feature_monte_pc'] = (bool) $company['feature_monte_pc'];
    $company['feature_marketplace'] = (bool) $company['feature_marketplace'];
    $company['feature_consignacao'] = (bool) $company['feature_consignacao'];
    
    // Retornar empresa
    echo json_encode($company);
    
    $conn->close();
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Internal server error',
        'message' => $e->getMessage()
    ]);
}
?>
