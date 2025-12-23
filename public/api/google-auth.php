<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// ============================================
// CONFIGURAÇÃO - PREENCHA COM SUAS CREDENCIAIS
// ============================================
$clientId = '502896071844-skg6o3tai5vffjf60bu22si0uovc4or0.apps.googleusercontent.com';
$clientSecret = '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';
$redirectUri = 'https://www.n8nbalao.com/api/google-auth.php';

// Database connection
require_once __DIR__ . '/_db.php';

try {
    $pdo = balao_get_pdo();
} catch (Throwable $e) {
    echo json_encode(['error' => 'Database connection failed']);
    exit();
}

// Ensure customers table has google_id column
try {
    $pdo->exec("ALTER TABLE customers ADD COLUMN google_id VARCHAR(255) UNIQUE");
} catch (PDOException $e) {
    // Column already exists, ignore
}

// Handle different actions
$action = $_GET['action'] ?? $_POST['action'] ?? null;
$loginType = $_GET['type'] ?? $_POST['type'] ?? 'customer'; // 'customer' or 'admin'

if ($action === 'get_auth_url') {
    // Generate Google OAuth URL
    $scope = urlencode('email profile');
    $state = bin2hex(random_bytes(16)) . '_' . $loginType; // Include login type in state
    
    // Store state in session or return it
    $authUrl = "https://accounts.google.com/o/oauth2/v2/auth?" .
        "client_id=" . urlencode($clientId) .
        "&redirect_uri=" . urlencode($redirectUri) .
        "&response_type=code" .
        "&scope=" . $scope .
        "&state=" . $state .
        "&access_type=offline" .
        "&prompt=consent";
    
    echo json_encode(['authUrl' => $authUrl, 'state' => $state]);
    exit();
}

// Handle OAuth callback (when Google redirects back)
if (isset($_GET['code'])) {
    $code = $_GET['code'];
    $state = $_GET['state'] ?? '';
    
    // Extract login type from state
    $isAdminLogin = strpos($state, '_admin') !== false;
    
    // Exchange code for access token
    $tokenUrl = 'https://oauth2.googleapis.com/token';
    $tokenData = [
        'code' => $code,
        'client_id' => $clientId,
        'client_secret' => $clientSecret,
        'redirect_uri' => $redirectUri,
        'grant_type' => 'authorization_code'
    ];
    
    $ch = curl_init($tokenUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($tokenData));
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/x-www-form-urlencoded']);
    
    $tokenResponse = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    $redirectPage = $isAdminLogin ? '/admin' : '/cliente';
    
    if ($httpCode !== 200) {
        header('Location: https://www.n8nbalao.com' . $redirectPage . '?error=token_exchange_failed');
        exit();
    }
    
    $tokenResult = json_decode($tokenResponse, true);
    $accessToken = $tokenResult['access_token'] ?? null;
    
    if (!$accessToken) {
        header('Location: https://www.n8nbalao.com' . $redirectPage . '?error=no_access_token');
        exit();
    }
    
    // Get user info from Google
    $userInfoUrl = 'https://www.googleapis.com/oauth2/v2/userinfo';
    $ch = curl_init($userInfoUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Authorization: Bearer ' . $accessToken]);
    
    $userInfoResponse = curl_exec($ch);
    curl_close($ch);
    
    $userInfo = json_decode($userInfoResponse, true);
    
    if (!isset($userInfo['email'])) {
        header('Location: https://www.n8nbalao.com' . $redirectPage . '?error=no_email');
        exit();
    }
    
    $googleId = $userInfo['id'];
    $email = $userInfo['email'];
    $name = $userInfo['name'] ?? $email;
    $picture = $userInfo['picture'] ?? null;
    
    if ($isAdminLogin) {
        // Admin login flow
        $stmt = $pdo->prepare("SELECT * FROM admins WHERE google_id = ? OR email = ?");
        $stmt->execute([$googleId, $email]);
        $existingAdmin = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($existingAdmin) {
            if (!$existingAdmin['active']) {
                header('Location: https://www.n8nbalao.com/admin?error=account_disabled');
                exit();
            }
            
            // Update google_id if not set
            if (!$existingAdmin['google_id']) {
                $stmt = $pdo->prepare("UPDATE admins SET google_id = ?, avatar = ? WHERE id = ?");
                $stmt->execute([$googleId, $picture, $existingAdmin['id']]);
            }
            
            $token = bin2hex(random_bytes(32));
            $adminData = base64_encode(json_encode([
                'id' => $existingAdmin['id'],
                'name' => $existingAdmin['name'],
                'email' => $existingAdmin['email'],
                'role' => $existingAdmin['role'],
                'avatar' => $picture,
                'token' => $token
            ]));
            
            header('Location: https://www.n8nbalao.com/admin?google_auth=success&data=' . urlencode($adminData));
            exit();
        } else {
            // Admin not registered
            header('Location: https://www.n8nbalao.com/admin?error=not_admin&email=' . urlencode($email));
            exit();
        }
    } else {
        // Customer login flow (existing logic)
        $stmt = $pdo->prepare("SELECT * FROM customers WHERE google_id = ? OR email = ?");
        $stmt->execute([$googleId, $email]);
        $existingCustomer = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($existingCustomer) {
            if (!$existingCustomer['google_id']) {
                $stmt = $pdo->prepare("UPDATE customers SET google_id = ? WHERE id = ?");
                $stmt->execute([$googleId, $existingCustomer['id']]);
            }
            $customerId = $existingCustomer['id'];
        } else {
            $customerId = uniqid('cust_', true);
            $stmt = $pdo->prepare("INSERT INTO customers (id, name, email, google_id) VALUES (?, ?, ?, ?)");
            $stmt->execute([$customerId, $name, $email, $googleId]);
        }
        
        $stmt = $pdo->prepare("SELECT * FROM customers WHERE id = ?");
        $stmt->execute([$customerId]);
        $customer = $stmt->fetch(PDO::FETCH_ASSOC);
        
        $token = bin2hex(random_bytes(32));
        
        $customerData = base64_encode(json_encode([
            'id' => $customer['id'],
            'name' => $customer['name'],
            'email' => $customer['email'],
            'phone' => $customer['phone'] ?? '',
            'token' => $token
        ]));
        
        header('Location: https://www.n8nbalao.com/cliente?google_auth=success&data=' . urlencode($customerData));
        exit();
    }
}

// Handle error from Google
if (isset($_GET['error'])) {
    header('Location: https://www.n8nbalao.com/cliente?error=' . urlencode($_GET['error']));
    exit();
}

// If called via POST with id_token (for frontend Google Sign-In button)
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (isset($data['credential'])) {
        // Verify Google ID token
        $idToken = $data['credential'];
        
        // Decode JWT (without verification for simplicity - in production, verify signature)
        $parts = explode('.', $idToken);
        if (count($parts) !== 3) {
            echo json_encode(['error' => 'Invalid token format']);
            exit();
        }
        
        $payload = json_decode(base64_decode(strtr($parts[1], '-_', '+/')), true);
        
        if (!$payload || !isset($payload['email'])) {
            echo json_encode(['error' => 'Invalid token payload']);
            exit();
        }
        
        // Verify token issuer and audience
        if ($payload['iss'] !== 'https://accounts.google.com' && $payload['iss'] !== 'accounts.google.com') {
            echo json_encode(['error' => 'Invalid token issuer']);
            exit();
        }
        
        if ($payload['aud'] !== $clientId) {
            echo json_encode(['error' => 'Invalid token audience']);
            exit();
        }
        
        // Check token expiration
        if ($payload['exp'] < time()) {
            echo json_encode(['error' => 'Token expired']);
            exit();
        }
        
        $googleId = $payload['sub'];
        $email = $payload['email'];
        $name = $payload['name'] ?? $email;
        
        // Check if user exists
        $stmt = $pdo->prepare("SELECT * FROM customers WHERE google_id = ? OR email = ?");
        $stmt->execute([$googleId, $email]);
        $existingCustomer = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($existingCustomer) {
            if (!$existingCustomer['google_id']) {
                $stmt = $pdo->prepare("UPDATE customers SET google_id = ? WHERE id = ?");
                $stmt->execute([$googleId, $existingCustomer['id']]);
            }
            $customerId = $existingCustomer['id'];
        } else {
            $customerId = uniqid('cust_', true);
            $stmt = $pdo->prepare("INSERT INTO customers (id, name, email, google_id) VALUES (?, ?, ?, ?)");
            $stmt->execute([$customerId, $name, $email, $googleId]);
        }
        
        $stmt = $pdo->prepare("SELECT * FROM customers WHERE id = ?");
        $stmt->execute([$customerId]);
        $customer = $stmt->fetch(PDO::FETCH_ASSOC);
        
        $token = bin2hex(random_bytes(32));
        
        echo json_encode([
            'success' => true,
            'customer' => $customer,
            'token' => $token
        ]);
        exit();
    }
}

echo json_encode(['error' => 'Invalid request']);
?>
