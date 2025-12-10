<?php
// Suno AI Music Status Check Endpoint
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$taskId = $_GET['taskId'] ?? $_POST['taskId'] ?? '';

if (empty($taskId)) {
    echo json_encode(['success' => false, 'error' => 'TaskId é obrigatório']);
    exit;
}

$sunoApiKey = '01a3961c1f06d4b58a9a39eb54136475';

// Check task status using correct Suno API endpoint
$ch = curl_init('https://api.sunoapi.org/api/v1/generate/record-info?taskId=' . urlencode($taskId));
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => [
        'Authorization: Bearer ' . $sunoApiKey
    ],
    CURLOPT_TIMEOUT => 30
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);
curl_close($ch);

error_log("Suno Status Response: " . $response);

if ($error) {
    echo json_encode(['success' => false, 'error' => 'Erro de conexão: ' . $error]);
    exit;
}

$data = json_decode($response, true);

if (!$data || !isset($data['code'])) {
    echo json_encode(['success' => false, 'error' => 'Resposta inválida', 'raw' => $response]);
    exit;
}

if ($data['code'] !== 200) {
    echo json_encode(['success' => false, 'error' => $data['msg'] ?? 'Erro na API']);
    exit;
}

// Parse response based on Suno API structure
$taskData = $data['data'] ?? null;

if (!$taskData) {
    echo json_encode(['success' => false, 'error' => 'Dados não encontrados']);
    exit;
}

$status = $taskData['status'] ?? 'PENDING';

if ($status === 'SUCCESS' && isset($taskData['response']['sunoData'])) {
    $songs = $taskData['response']['sunoData'];
    $musicList = [];
    
    foreach ($songs as $song) {
        $musicList[] = [
            'id' => $song['id'] ?? '',
            'title' => $song['title'] ?? 'Música',
            'audioUrl' => $song['audioUrl'] ?? '',
            'streamAudioUrl' => $song['streamAudioUrl'] ?? '',
            'imageUrl' => $song['imageUrl'] ?? '',
            'duration' => $song['duration'] ?? 0,
            'prompt' => $song['prompt'] ?? '',
            'tags' => $song['tags'] ?? ''
        ];
    }
    
    echo json_encode([
        'success' => true,
        'status' => 'COMPLETED',
        'music' => $musicList
    ]);
} else if ($status === 'PENDING' || $status === 'PROCESSING' || $status === 'QUEUED') {
    echo json_encode([
        'success' => true,
        'status' => 'PROCESSING',
        'message' => 'A banda ainda está ensaiando... 🎸'
    ]);
} else if ($status === 'FAILED' || $status === 'ERROR') {
    $errorMsg = $taskData['errorMessage'] ?? 'Falha na geração da música';
    echo json_encode([
        'success' => false,
        'status' => 'FAILED',
        'error' => $errorMsg
    ]);
} else {
    echo json_encode([
        'success' => true,
        'status' => $status,
        'message' => 'Processando...',
        'data' => $taskData
    ]);
}
?>