<?php
// CORS headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit();
}

// Database connection to get SMTP settings
require_once __DIR__ . '/_db.php';

try {
    $pdo = balao_get_pdo();
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed']);
    exit();
}

// Get SMTP settings from database
$stmt = $pdo->query("SELECT `key`, `value` FROM settings WHERE `key` IN ('smtp_email', 'smtp_password', 'smtp_name')");
$settings = [];
while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    $settings[$row['key']] = $row['value'];
}

$smtpEmail = $settings['smtp_email'] ?? null;
$smtpPassword = $settings['smtp_password'] ?? null;
$smtpName = $settings['smtp_name'] ?? 'Sua Empresa';

if (!$smtpEmail || !$smtpPassword) {
    http_response_code(500);
    echo json_encode(['error' => 'SMTP não configurado. Configure o Gmail SMTP nas configurações.']);
    exit();
}

$input = json_decode(file_get_contents('php://input'), true);

$to = $input['to'] ?? null;
$subject = $input['subject'] ?? 'Nova Notificação';
$html = $input['html'] ?? '';
$fromName = $input['fromName'] ?? $smtpName;

if (!$to) {
    http_response_code(400);
    echo json_encode(['error' => 'Recipient email is required']);
    exit();
}

// Convert to array if single email
$recipients = is_array($to) ? $to : [$to];

// Send email via Gmail SMTP using PHPMailer approach with fsockopen
function sendGmailSMTP($smtpEmail, $smtpPassword, $fromName, $to, $subject, $htmlBody) {
    $smtpHost = 'smtp.gmail.com';
    $smtpPort = 587;
    
    // Build email headers
    $boundary = md5(time());
    $headers = "MIME-Version: 1.0\r\n";
    $headers .= "From: $fromName <$smtpEmail>\r\n";
    $headers .= "Reply-To: $smtpEmail\r\n";
    $headers .= "Content-Type: multipart/alternative; boundary=\"$boundary\"\r\n";
    
    // Build message body
    $plainText = strip_tags(str_replace(['<br>', '<br/>', '<br />', '</p>'], "\n", $htmlBody));
    
    $message = "--$boundary\r\n";
    $message .= "Content-Type: text/plain; charset=UTF-8\r\n\r\n";
    $message .= $plainText . "\r\n\r\n";
    $message .= "--$boundary\r\n";
    $message .= "Content-Type: text/html; charset=UTF-8\r\n\r\n";
    $message .= $htmlBody . "\r\n\r\n";
    $message .= "--$boundary--";
    
    // Connect to SMTP server
    $socket = @fsockopen('tls://' . $smtpHost, 465, $errno, $errstr, 30);
    if (!$socket) {
        // Try alternate port
        $socket = @fsockopen($smtpHost, $smtpPort, $errno, $errstr, 30);
        if (!$socket) {
            return ['success' => false, 'error' => "Could not connect to SMTP server: $errstr ($errno)"];
        }
        
        // Read greeting
        fgets($socket, 512);
        
        // EHLO
        fputs($socket, "EHLO localhost\r\n");
        while ($line = fgets($socket, 512)) {
            if (substr($line, 3, 1) == ' ') break;
        }
        
        // STARTTLS
        fputs($socket, "STARTTLS\r\n");
        fgets($socket, 512);
        
        // Enable TLS
        stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT);
        
        // EHLO again after TLS
        fputs($socket, "EHLO localhost\r\n");
        while ($line = fgets($socket, 512)) {
            if (substr($line, 3, 1) == ' ') break;
        }
    } else {
        // Read greeting for TLS connection
        fgets($socket, 512);
        
        // EHLO
        fputs($socket, "EHLO localhost\r\n");
        while ($line = fgets($socket, 512)) {
            if (substr($line, 3, 1) == ' ') break;
        }
    }
    
    // AUTH LOGIN
    fputs($socket, "AUTH LOGIN\r\n");
    fgets($socket, 512);
    
    fputs($socket, base64_encode($smtpEmail) . "\r\n");
    fgets($socket, 512);
    
    fputs($socket, base64_encode($smtpPassword) . "\r\n");
    $authResponse = fgets($socket, 512);
    
    if (substr($authResponse, 0, 3) != '235') {
        fclose($socket);
        return ['success' => false, 'error' => 'SMTP authentication failed. Check your email and app password.'];
    }
    
    // MAIL FROM
    fputs($socket, "MAIL FROM: <$smtpEmail>\r\n");
    fgets($socket, 512);
    
    // RCPT TO
    fputs($socket, "RCPT TO: <$to>\r\n");
    fgets($socket, 512);
    
    // DATA
    fputs($socket, "DATA\r\n");
    fgets($socket, 512);
    
    // Send headers and body
    fputs($socket, "Subject: $subject\r\n");
    fputs($socket, $headers);
    fputs($socket, "\r\n");
    fputs($socket, $message);
    fputs($socket, "\r\n.\r\n");
    
    $dataResponse = fgets($socket, 512);
    
    // QUIT
    fputs($socket, "QUIT\r\n");
    fclose($socket);
    
    if (substr($dataResponse, 0, 3) == '250') {
        return ['success' => true];
    } else {
        return ['success' => false, 'error' => 'Failed to send email: ' . $dataResponse];
    }
}

$results = [];
$successCount = 0;
$errorCount = 0;

foreach ($recipients as $recipient) {
    $result = sendGmailSMTP($smtpEmail, $smtpPassword, $fromName, $recipient, $subject, $html);
    if ($result['success']) {
        $successCount++;
        $results[] = ['email' => $recipient, 'status' => 'sent'];
    } else {
        $errorCount++;
        $results[] = ['email' => $recipient, 'status' => 'failed', 'error' => $result['error']];
    }
    
    // Small delay between emails to avoid rate limiting
    if (count($recipients) > 1) {
        usleep(500000); // 0.5 second delay
    }
}

if ($errorCount === 0) {
    echo json_encode([
        'success' => true, 
        'message' => "Email(s) enviado(s) com sucesso",
        'sent' => $successCount,
        'results' => $results
    ]);
} else if ($successCount > 0) {
    echo json_encode([
        'success' => true,
        'message' => "Alguns emails falharam",
        'sent' => $successCount,
        'failed' => $errorCount,
        'results' => $results
    ]);
} else {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Falha ao enviar emails',
        'results' => $results
    ]);
}
?>
