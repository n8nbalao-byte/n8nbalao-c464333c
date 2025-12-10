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

// Check task status
$ch = curl_init('https://apibox.erweima.ai/api/v1/generate/record-info?taskId=' . urlencode($taskId));
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => [
        'Authorization: Bearer ' . $sunoApiKey
    ],
    CURLOPT_TIMEOUT => 30
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

$data = json_decode($response, true);

if ($httpCode !== 200 || !$data) {
    echo json_encode(['success' => false, 'error' => 'Erro ao verificar status']);
    exit;
}

// Parse response
if (isset($data['data'])) {
    $taskData = $data['data'];
    $status = $taskData['status'] ?? 'PENDING';
    
    if ($status === 'SUCCESS' && isset($taskData['response']['sunoData'])) {
        $songs = $taskData['response']['sunoData'];
        $musicList = [];
        
        foreach ($songs as $song) {
            $musicList[] = [
                'title' => $song['title'] ?? 'Música',
                'audioUrl' => $song['audioUrl'] ?? '',
                'imageUrl' => $song['imageUrl'] ?? '',
                'duration' => $song['duration'] ?? 0
            ];
        }
        
        echo json_encode([
            'success' => true,
            'status' => 'COMPLETED',
            'music' => $musicList
        ]);
    } else if ($status === 'PENDING' || $status === 'PROCESSING') {
        echo json_encode([
            'success' => true,
            'status' => 'PROCESSING',
            'message' => 'A banda ainda está ensaiando... 🎸'
        ]);
    } else if ($status === 'FAILED') {
        echo json_encode([
            'success' => false,
            'status' => 'FAILED',
            'error' => 'Falha na geração da música'
        ]);
    } else {
        echo json_encode([
            'success' => true,
            'status' => $status,
            'data' => $taskData
        ]);
    }
} else {
    echo json_encode(['success' => false, 'error' => 'Resposta inesperada', 'raw' => $data]);
}
?>