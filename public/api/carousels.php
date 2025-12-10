<?php
// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 0);

// CORS Headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Database configuration for Hostinger
$host = 'localhost';
$dbname = 'u770915504_n8nbalao';
$username = 'u770915504_n8nbalao';
$password = 'Balao2025';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed']);
    exit();
}

// Create carousels table if it doesn't exist
// Images are stored as JSON array: [{ "url": "...", "link": "..." }, ...]
$pdo->exec("CREATE TABLE IF NOT EXISTS carousels (
    id INT AUTO_INCREMENT PRIMARY KEY,
    carousel_key VARCHAR(50) NOT NULL UNIQUE,
    images LONGTEXT,
    interval_ms INT DEFAULT 4000,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)");

// Add interval_ms column if it doesn't exist (for existing installations)
try {
    $pdo->exec("ALTER TABLE carousels ADD COLUMN interval_ms INT DEFAULT 4000");
} catch (PDOException $e) {
    // Column might already exist, ignore error
}

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        // Get carousel by key
        if (isset($_GET['key'])) {
            $stmt = $pdo->prepare("SELECT * FROM carousels WHERE carousel_key = ?");
            $stmt->execute([$_GET['key']]);
            $carousel = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($carousel) {
                $result = [
                    'key' => $carousel['carousel_key'],
                    'images' => json_decode($carousel['images'], true) ?? [],
                    'interval' => (int)($carousel['interval_ms'] ?? 4000)
                ];
                echo json_encode($result);
            } else {
                echo json_encode(['key' => $_GET['key'], 'images' => [], 'interval' => 4000]);
            }
        } else {
            // Get all carousels
            $stmt = $pdo->query("SELECT * FROM carousels ORDER BY carousel_key ASC");
            $carousels = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            $result = array_map(function($carousel) {
                return [
                    'key' => $carousel['carousel_key'],
                    'images' => json_decode($carousel['images'], true) ?? [],
                    'interval' => (int)($carousel['interval_ms'] ?? 4000)
                ];
            }, $carousels);
            
            echo json_encode($result);
        }
        break;

    case 'POST':
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!$data || !isset($data['key'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Carousel key is required']);
            exit();
        }

        $imagesJson = json_encode($data['images'] ?? []);
        $intervalMs = isset($data['interval']) ? (int)$data['interval'] : 4000;

        // Upsert - insert or update
        $stmt = $pdo->prepare("INSERT INTO carousels (carousel_key, images, interval_ms) VALUES (?, ?, ?) 
                               ON DUPLICATE KEY UPDATE images = ?, interval_ms = ?");
        
        $success = $stmt->execute([
            $data['key'],
            $imagesJson,
            $intervalMs,
            $imagesJson,
            $intervalMs
        ]);

        if ($success) {
            echo json_encode(['success' => true]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to save carousel']);
        }
        break;

    case 'DELETE':
        if (!isset($_GET['key'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Carousel key is required']);
            exit();
        }

        $stmt = $pdo->prepare("DELETE FROM carousels WHERE carousel_key = ?");
        $success = $stmt->execute([$_GET['key']]);

        if ($success) {
            echo json_encode(['success' => true]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to delete carousel']);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        break;
}
?>
