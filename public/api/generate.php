<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit();
}

$input = json_decode(file_get_contents('php://input'), true);

$productName = $input['productName'] ?? '';
$productType = $input['productType'] ?? '';
$apiKey = $input['apiKey'] ?? '';

if (empty($productName) || empty($apiKey)) {
    echo json_encode(['success' => false, 'error' => 'Nome do produto e API Key são obrigatórios']);
    exit();
}

function callOpenAI($apiKey, $prompt, $systemPrompt) {
    $ch = curl_init();
    
    $data = [
        'model' => 'gpt-4o-mini',
        'messages' => [
            ['role' => 'system', 'content' => $systemPrompt],
            ['role' => 'user', 'content' => $prompt]
        ],
        'temperature' => 0.7,
        'max_tokens' => 2000
    ];
    
    curl_setopt($ch, CURLOPT_URL, 'https://api.openai.com/v1/chat/completions');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Authorization: Bearer ' . $apiKey
    ]);
    curl_setopt($ch, CURLOPT_TIMEOUT, 60);
    
    $response = curl_exec($ch);
    $error = curl_error($ch);
    curl_close($ch);
    
    if ($error) {
        return ['success' => false, 'error' => 'OpenAI Error: ' . $error];
    }
    
    $result = json_decode($response, true);
    
    if (isset($result['error'])) {
        return ['success' => false, 'error' => 'OpenAI: ' . $result['error']['message']];
    }
    
    return ['success' => true, 'content' => $result['choices'][0]['message']['content']];
}

$systemPrompt = 'Você é um especialista em produtos de tecnologia e informática. Gere informações detalhadas e atrativas para venda de produtos. Retorne APENAS JSON válido, sem markdown.';

$categoryContext = '';
if (!empty($productType)) {
    $categoryContext = "Categoria do produto: $productType. ";
}

$prompt = "Gere informações para o produto: \"$productName\"
$categoryContext

Retorne um JSON com esta estrutura:
{
  \"description\": \"Uma descrição atrativa e profissional do produto para vendas (2-3 frases)\",
  \"subtitle\": \"Um subtítulo curto e chamativo (máximo 50 caracteres)\",
  \"specs\": {
    \"Especificação 1\": \"valor\",
    \"Especificação 2\": \"valor\"
  }
}

IMPORTANTE para specs:
- Gere especificações técnicas REALISTAS baseadas no nome do produto
- Use nomes descritivos para as chaves (ex: \"Processador\", \"Memória RAM\", \"Armazenamento\", \"Tela\", \"Bateria\", \"Conexões\", \"Peso\", \"Cor\", \"Garantia\")
- Inclua entre 5 e 10 especificações relevantes
- Se for PC/Notebook, inclua: Processador, RAM, Armazenamento, Placa de Vídeo, Sistema Operacional
- Se for periférico (mouse, teclado, headset), inclua: Conexão, DPI/Switches, Iluminação, Peso, Compatibilidade
- Se for monitor, inclua: Tamanho, Resolução, Taxa de Atualização, Tempo de Resposta, Painel

Baseie as especificações no que o nome do produto sugere.";

$aiResult = callOpenAI($apiKey, $prompt, $systemPrompt);

if (!$aiResult['success']) {
    echo json_encode($aiResult);
    exit();
}

$content = preg_replace('/```json\s*/', '', $aiResult['content']);
$content = preg_replace('/```\s*/', '', $content);
$generatedData = json_decode(trim($content), true);

if (!$generatedData) {
    echo json_encode(['success' => false, 'error' => 'Não foi possível gerar informações']);
    exit();
}

echo json_encode([
    'success' => true,
    'data' => $generatedData
]);
?>
