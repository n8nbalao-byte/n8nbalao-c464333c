<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Company-ID');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once 'config.php';
require_once 'helpers.php';

$method = $_SERVER['REQUEST_METHOD'];
$company_id = detectCompanyId();

try {
    switch ($method) {
        case 'GET':
            // Listar consignments
            $status = isset($_GET['status']) ? $_GET['status'] : null;
            $user_id = isset($_GET['user_id']) ? intval($_GET['user_id']) : null;
            
            $query = "SELECT * FROM consignments WHERE company_id = ?";
            $params = [$company_id];
            $types = "i";
            
            if ($status) {
                $query .= " AND status = ?";
                $params[] = $status;
                $types .= "s";
            }
            
            if ($user_id) {
                $query .= " AND user_id = ?";
                $params[] = $user_id;
                $types .= "i";
            }
            
            $query .= " ORDER BY created_at DESC";
            
            $stmt = $conn->prepare($query);
            $stmt->bind_param($types, ...$params);
            $stmt->execute();
            $result = $stmt->get_result();
            
            $consignments = [];
            while ($row = $result->fetch_assoc()) {
                // Decodificar JSON
                $row['media'] = json_decode($row['media'], true);
                $consignments[] = $row;
            }
            
            jsonSuccess($consignments);
            break;
            
        case 'POST':
            // Criar novo consignment
            $data = json_decode(file_get_contents('php://input'), true);
            
            // Validações
            if (empty($data['product_name'])) {
                jsonError('Nome do produto é obrigatório', 400);
            }
            
            if (empty($data['client_value']) || $data['client_value'] <= 0) {
                jsonError('Valor do cliente é obrigatório', 400);
            }
            
            // Buscar porcentagem de comissão da empresa
            $stmt = $conn->prepare("SELECT commission_percent FROM companies WHERE id = ?");
            $stmt->bind_param("i", $company_id);
            $stmt->execute();
            $company = $stmt->get_result()->fetch_assoc();
            $commission_percent = $company['commission_percent'] ?? 25;
            
            // Calcular valor final
            $client_value = floatval($data['client_value']);
            $final_value = $client_value * (1 + ($commission_percent / 100));
            
            // Inserir
            $stmt = $conn->prepare("
                INSERT INTO consignments (
                    company_id, user_id, product_name, category, description,
                    media, client_value, commission_percent, final_value, status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
            ");
            
            $user_id = $_SESSION['user_id'] ?? 0; // Pegar do session
            $media_json = json_encode($data['media'] ?? []);
            
            $stmt->bind_param(
                "iissssdd",
                $company_id,
                $user_id,
                $data['product_name'],
                $data['category'],
                $data['description'],
                $media_json,
                $client_value,
                $commission_percent,
                $final_value
            );
            
            if ($stmt->execute()) {
                jsonSuccess([
                    'id' => $stmt->insert_id,
                    'message' => 'Produto enviado para análise'
                ], 201);
            } else {
                jsonError('Erro ao criar consignment', 500);
            }
            break;
            
        case 'PUT':
            // Atualizar consignment (aprovar/rejeitar)
            $data = json_decode(file_get_contents('php://input'), true);
            $id = intval($data['id'] ?? 0);
            
            if (!$id) {
                jsonError('ID é obrigatório', 400);
            }
            
            // Verificar se pertence à empresa
            $stmt = $conn->prepare("SELECT id FROM consignments WHERE id = ? AND company_id = ?");
            $stmt->bind_param("ii", $id, $company_id);
            $stmt->execute();
            if ($stmt->get_result()->num_rows === 0) {
                jsonError('Consignment não encontrado', 404);
            }
            
            // Atualizar
            $updates = [];
            $params = [];
            $types = "";
            
            if (isset($data['status'])) {
                $updates[] = "status = ?";
                $params[] = $data['status'];
                $types .= "s";
                
                if ($data['status'] === 'approved') {
                    $updates[] = "approved_at = NOW()";
                } elseif ($data['status'] === 'sold') {
                    $updates[] = "sold_at = NOW()";
                }
            }
            
            if (empty($updates)) {
                jsonError('Nenhum campo para atualizar', 400);
            }
            
            $params[] = $id;
            $types .= "i";
            
            $query = "UPDATE consignments SET " . implode(", ", $updates) . " WHERE id = ?";
            $stmt = $conn->prepare($query);
            $stmt->bind_param($types, ...$params);
            
            if ($stmt->execute()) {
                jsonSuccess(['message' => 'Consignment atualizado']);
            } else {
                jsonError('Erro ao atualizar', 500);
            }
            break;
            
        case 'DELETE':
            // Deletar consignment
            $id = intval($_GET['id'] ?? 0);
            
            if (!$id) {
                jsonError('ID é obrigatório', 400);
            }
            
            $stmt = $conn->prepare("DELETE FROM consignments WHERE id = ? AND company_id = ?");
            $stmt->bind_param("ii", $id, $company_id);
            
            if ($stmt->execute() && $stmt->affected_rows > 0) {
                jsonSuccess(['message' => 'Consignment deletado']);
            } else {
                jsonError('Consignment não encontrado', 404);
            }
            break;
            
        default:
            jsonError('Método não permitido', 405);
    }
    
} catch (Exception $e) {
    jsonError($e->getMessage(), 500);
}

$conn->close();
?>
