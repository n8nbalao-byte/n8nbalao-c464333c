-- =====================================================
-- MIGRAÇÃO SEGURA - Verifica antes de criar
-- =====================================================

-- PARTE 1: CRIAR TABELAS (se não existirem)
CREATE TABLE IF NOT EXISTS companies (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  custom_domain VARCHAR(255) UNIQUE,
  logo TEXT,
  cnpj VARCHAR(20),
  phone VARCHAR(20),
  email VARCHAR(255) NOT NULL,
  address TEXT,
  city VARCHAR(100),
  seller VARCHAR(255),
  primary_color VARCHAR(7) DEFAULT '#E31C23',
  secondary_color VARCHAR(7) DEFAULT '#FFFFFF',
  accent_color VARCHAR(7) DEFAULT '#DC2626',
  plan ENUM('basic', 'pro', 'enterprise') DEFAULT 'basic',
  status ENUM('active', 'suspended', 'trial', 'expired') DEFAULT 'trial',
  trial_ends_at DATETIME,
  subscription_ends_at DATETIME,
  license_key VARCHAR(50) UNIQUE,
  license_activated_at DATETIME,
  feature_monte_pc BOOLEAN DEFAULT TRUE,
  feature_marketplace BOOLEAN DEFAULT FALSE,
  feature_consignacao BOOLEAN DEFAULT FALSE,
  settings JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by VARCHAR(255),
  INDEX idx_slug (slug),
  INDEX idx_custom_domain (custom_domain),
  INDEX idx_status (status),
  INDEX idx_plan (plan)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS licenses (
  id INT PRIMARY KEY AUTO_INCREMENT,
  license_key VARCHAR(50) UNIQUE NOT NULL,
  plan ENUM('basic', 'pro', 'enterprise') NOT NULL,
  email VARCHAR(255) NOT NULL,
  status ENUM('unused', 'active', 'expired', 'revoked') DEFAULT 'unused',
  company_id INT,
  duration_months INT DEFAULT 12,
  generated_by VARCHAR(255),
  generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  activated_at DATETIME,
  expires_at DATETIME,
  notes TEXT,
  INDEX idx_key (license_key),
  INDEX idx_email (email),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS payments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  company_id INT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'BRL',
  plan ENUM('basic', 'pro', 'enterprise') NOT NULL,
  period ENUM('monthly', 'yearly') DEFAULT 'monthly',
  gateway ENUM('stripe', 'mercadopago', 'manual') NOT NULL,
  gateway_payment_id VARCHAR(255),
  gateway_customer_id VARCHAR(255),
  status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
  paid_at DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  metadata JSON,
  INDEX idx_company (company_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS consignments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  company_id INT NOT NULL,
  user_id INT NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  description TEXT,
  media JSON,
  client_value DECIMAL(10,2) NOT NULL,
  commission_percent DECIMAL(5,2) NOT NULL,
  final_value DECIMAL(10,2) NOT NULL,
  status ENUM('pending', 'approved', 'sold', 'rejected') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  approved_at DATETIME,
  sold_at DATETIME,
  INDEX idx_company (company_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- PARTE 2: CRIAR EMPRESA PADRÃO
INSERT INTO companies (id, name, slug, email, plan, status, feature_monte_pc, feature_marketplace, feature_consignacao, created_by)
VALUES (1, 'n8nbalao', 'n8nbalao', 'n8nbalao@gmail.com', 'enterprise', 'active', TRUE, TRUE, TRUE, 'migration')
ON DUPLICATE KEY UPDATE id=id;

-- PARTE 3: VERIFICAÇÃO
SELECT 'TABELAS CRIADAS COM SUCESSO!' as status;
SELECT * FROM companies WHERE id = 1;

-- PARTE 4: MOSTRAR QUAIS TABELAS JÁ TÊM company_id
SELECT 
  TABLE_NAME as tabela,
  'JA TEM company_id' as status
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'u770915504_n8nbalao'
  AND COLUMN_NAME = 'company_id'
ORDER BY TABLE_NAME;
