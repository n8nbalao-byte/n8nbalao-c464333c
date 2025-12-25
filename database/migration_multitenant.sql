-- =====================================================
-- MIGRAÇÃO MULTI-TENANT - n8nbalao.com
-- =====================================================
-- Data: 2024-12-24
-- Descrição: Transforma o banco de dados em Multi-Tenant
-- IMPORTANTE: Faça backup completo antes de executar!
-- =====================================================

-- =====================================================
-- PARTE 1: CRIAR NOVAS TABELAS
-- =====================================================

-- Tabela de Empresas (Tenants)
CREATE TABLE IF NOT EXISTS companies (
  id INT PRIMARY KEY AUTO_INCREMENT,
  
  -- Identificação
  name VARCHAR(255) NOT NULL COMMENT 'Nome da empresa',
  slug VARCHAR(100) UNIQUE NOT NULL COMMENT 'Slug para subdomínio (ex: minhaloja)',
  custom_domain VARCHAR(255) UNIQUE COMMENT 'Domínio próprio (ex: minhaloja.com.br)',
  
  -- Dados da Empresa
  logo TEXT COMMENT 'URL ou base64 do logo',
  cnpj VARCHAR(20) COMMENT 'CNPJ da empresa',
  phone VARCHAR(20) COMMENT 'Telefone principal',
  email VARCHAR(255) NOT NULL COMMENT 'E-mail principal',
  address TEXT COMMENT 'Endereço completo',
  city VARCHAR(100) COMMENT 'Cidade',
  seller VARCHAR(255) COMMENT 'Nome do vendedor/responsável',
  
  -- Identidade Visual
  primary_color VARCHAR(7) DEFAULT '#E31C23' COMMENT 'Cor primária (hex)',
  secondary_color VARCHAR(7) DEFAULT '#FFFFFF' COMMENT 'Cor secundária (hex)',
  accent_color VARCHAR(7) DEFAULT '#DC2626' COMMENT 'Cor de destaque (hex)',
  
  -- Plano e Status
  plan ENUM('basic', 'pro', 'enterprise') DEFAULT 'basic' COMMENT 'Plano contratado',
  status ENUM('active', 'suspended', 'trial', 'expired') DEFAULT 'trial' COMMENT 'Status da conta',
  trial_ends_at DATETIME COMMENT 'Data de término do trial',
  subscription_ends_at DATETIME COMMENT 'Data de término da assinatura',
  
  -- Licença
  license_key VARCHAR(50) UNIQUE COMMENT 'Chave de licença ativa',
  license_activated_at DATETIME COMMENT 'Data de ativação da licença',
  
  -- Funcionalidades Ativáveis
  feature_monte_pc BOOLEAN DEFAULT TRUE COMMENT 'Funcionalidade Monte seu PC',
  feature_marketplace BOOLEAN DEFAULT FALSE COMMENT 'Funcionalidade Marketplace',
  feature_consignacao BOOLEAN DEFAULT FALSE COMMENT 'Funcionalidade Consignação',
  
  -- Configurações (JSON)
  settings JSON COMMENT 'Configurações da empresa (APIs, integrações, etc)',
  
  -- Metadados
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Data de criação',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Última atualização',
  created_by VARCHAR(255) COMMENT 'Quem criou (master-admin ou onboarding)',
  
  -- Índices para performance
  INDEX idx_slug (slug),
  INDEX idx_custom_domain (custom_domain),
  INDEX idx_status (status),
  INDEX idx_plan (plan),
  INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Empresas (Tenants) do sistema';

-- Tabela de Licenças
CREATE TABLE IF NOT EXISTS licenses (
  id INT PRIMARY KEY AUTO_INCREMENT,
  
  license_key VARCHAR(50) UNIQUE NOT NULL COMMENT 'Chave da licença (serial)',
  plan ENUM('basic', 'pro', 'enterprise') NOT NULL COMMENT 'Plano da licença',
  email VARCHAR(255) NOT NULL COMMENT 'E-mail vinculado à licença',
  
  status ENUM('unused', 'active', 'expired', 'revoked') DEFAULT 'unused' COMMENT 'Status da licença',
  company_id INT COMMENT 'Empresa que ativou a licença',
  
  duration_months INT DEFAULT 12 COMMENT 'Duração em meses',
  
  -- Metadados
  generated_by VARCHAR(255) COMMENT 'E-mail do master admin que gerou',
  generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Data de geração',
  activated_at DATETIME COMMENT 'Data de ativação',
  expires_at DATETIME COMMENT 'Data de expiração',
  notes TEXT COMMENT 'Observações sobre a licença',
  
  -- Índices
  INDEX idx_key (license_key),
  INDEX idx_email (email),
  INDEX idx_status (status),
  INDEX idx_company (company_id),
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Licenças geradas pelo sistema';

-- Tabela de Pagamentos
CREATE TABLE IF NOT EXISTS payments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  
  company_id INT NOT NULL COMMENT 'Empresa que fez o pagamento',
  amount DECIMAL(10,2) NOT NULL COMMENT 'Valor pago',
  currency VARCHAR(3) DEFAULT 'BRL' COMMENT 'Moeda (BRL, USD, etc)',
  
  plan ENUM('basic', 'pro', 'enterprise') NOT NULL COMMENT 'Plano pago',
  period ENUM('monthly', 'yearly') DEFAULT 'monthly' COMMENT 'Período de pagamento',
  
  -- Gateway de Pagamento
  gateway ENUM('stripe', 'mercadopago', 'manual') NOT NULL COMMENT 'Gateway usado',
  gateway_payment_id VARCHAR(255) COMMENT 'ID do pagamento no gateway',
  gateway_customer_id VARCHAR(255) COMMENT 'ID do cliente no gateway',
  
  -- Status
  status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending' COMMENT 'Status do pagamento',
  
  -- Datas
  paid_at DATETIME COMMENT 'Data de confirmação do pagamento',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Data de criação',
  
  -- Metadados
  metadata JSON COMMENT 'Dados adicionais do gateway',
  
  -- Índices
  INDEX idx_company (company_id),
  INDEX idx_status (status),
  INDEX idx_gateway (gateway),
  INDEX idx_gateway_payment_id (gateway_payment_id),
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Histórico de pagamentos';

-- Tabela de Consignações
CREATE TABLE IF NOT EXISTS consignments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  
  company_id INT NOT NULL COMMENT 'Empresa dona do marketplace',
  user_id INT NOT NULL COMMENT 'Cliente que consignou',
  
  -- Dados do Produto
  product_name VARCHAR(255) NOT NULL COMMENT 'Nome do produto',
  category VARCHAR(100) COMMENT 'Categoria do produto',
  description TEXT COMMENT 'Descrição detalhada',
  media JSON COMMENT 'Array de URLs de fotos/vídeos',
  
  -- Valores
  client_value DECIMAL(10,2) NOT NULL COMMENT 'Valor que o cliente quer receber',
  commission_percent DECIMAL(5,2) NOT NULL COMMENT 'Porcentagem de comissão',
  final_value DECIMAL(10,2) NOT NULL COMMENT 'Valor final de venda (calculado)',
  
  -- Status
  status ENUM('pending', 'approved', 'sold', 'rejected') DEFAULT 'pending' COMMENT 'Status da consignação',
  
  -- Datas
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Data de cadastro',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Última atualização',
  approved_at DATETIME COMMENT 'Data de aprovação',
  sold_at DATETIME COMMENT 'Data de venda',
  
  -- Índices
  INDEX idx_company (company_id),
  INDEX idx_user (user_id),
  INDEX idx_status (status),
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Produtos em consignação';

-- =====================================================
-- PARTE 2: ADICIONAR company_id NAS TABELAS EXISTENTES
-- =====================================================

-- Produtos
ALTER TABLE products 
  ADD COLUMN company_id INT NOT NULL DEFAULT 1 COMMENT 'Empresa dona do produto',
  ADD INDEX idx_company (company_id);

-- Hardware
ALTER TABLE hardware 
  ADD COLUMN company_id INT NOT NULL DEFAULT 1 COMMENT 'Empresa dona do hardware',
  ADD INDEX idx_company (company_id);

-- Categorias
ALTER TABLE categories 
  ADD COLUMN company_id INT DEFAULT 1 COMMENT 'Empresa dona da categoria (NULL = global)',
  ADD INDEX idx_company (company_id);

-- Pedidos (se existir)
ALTER TABLE IF EXISTS orders 
  ADD COLUMN company_id INT NOT NULL DEFAULT 1 COMMENT 'Empresa do pedido',
  ADD INDEX idx_company (company_id);

-- Usuários/Clientes
ALTER TABLE IF EXISTS users 
  ADD COLUMN company_id INT NOT NULL DEFAULT 1 COMMENT 'Empresa do usuário',
  ADD INDEX idx_company (company_id);

-- Admins
ALTER TABLE IF EXISTS admins 
  ADD COLUMN company_id INT DEFAULT 1 COMMENT 'Empresa do admin (NULL = master admin)',
  ADD INDEX idx_company (company_id);

-- Carrosséis
ALTER TABLE IF EXISTS carousels 
  ADD COLUMN company_id INT DEFAULT 1 COMMENT 'Empresa do carrossel',
  ADD INDEX idx_company (company_id);

-- Settings (configurações)
ALTER TABLE IF EXISTS settings 
  ADD COLUMN company_id INT DEFAULT 1 COMMENT 'Empresa da configuração',
  ADD INDEX idx_company (company_id);

-- =====================================================
-- PARTE 3: CRIAR EMPRESA PADRÃO (MIGRAÇÃO DE DADOS)
-- =====================================================

-- Inserir empresa padrão (n8nbalao - seus dados atuais)
INSERT INTO companies (
  id,
  name,
  slug,
  email,
  plan,
  status,
  feature_monte_pc,
  feature_marketplace,
  feature_consignacao,
  created_by
) VALUES (
  1,
  'n8nbalao',
  'n8nbalao',
  'n8nbalao@gmail.com',
  'enterprise',
  'active',
  TRUE,
  TRUE,
  TRUE,
  'migration'
) ON DUPLICATE KEY UPDATE id=id;

-- =====================================================
-- PARTE 4: ADICIONAR FOREIGN KEYS (OPCIONAL - CUIDADO!)
-- =====================================================
-- ATENÇÃO: Só execute se quiser integridade referencial rígida
-- Isso pode causar problemas se houver dados órfãos

-- ALTER TABLE products 
--   ADD FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;

-- ALTER TABLE hardware 
--   ADD FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;

-- ALTER TABLE orders 
--   ADD FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;

-- ALTER TABLE users 
--   ADD FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;

-- =====================================================
-- PARTE 5: VERIFICAÇÕES E VALIDAÇÕES
-- =====================================================

-- Verificar se todas as tabelas têm company_id
SELECT 
  TABLE_NAME,
  COLUMN_NAME,
  COLUMN_TYPE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND COLUMN_NAME = 'company_id'
ORDER BY TABLE_NAME;

-- Contar registros por empresa (deve mostrar tudo em company_id = 1)
SELECT 
  'products' as tabela, 
  company_id, 
  COUNT(*) as total 
FROM products 
GROUP BY company_id

UNION ALL

SELECT 
  'hardware' as tabela, 
  company_id, 
  COUNT(*) as total 
FROM hardware 
GROUP BY company_id

UNION ALL

SELECT 
  'categories' as tabela, 
  company_id, 
  COUNT(*) as total 
FROM categories 
WHERE company_id IS NOT NULL
GROUP BY company_id;

-- =====================================================
-- PARTE 6: ÍNDICES COMPOSTOS PARA PERFORMANCE
-- =====================================================

-- Produtos: busca por empresa + categoria
ALTER TABLE products 
  ADD INDEX idx_company_category (company_id, productType);

-- Hardware: busca por empresa + categoria
ALTER TABLE hardware 
  ADD INDEX idx_company_category (company_id, category);

-- Pedidos: busca por empresa + status
ALTER TABLE IF EXISTS orders 
  ADD INDEX idx_company_status (company_id, status);

-- Consignações: busca por empresa + status
ALTER TABLE consignments 
  ADD INDEX idx_company_status (company_id, status);

-- =====================================================
-- FIM DA MIGRAÇÃO
-- =====================================================

-- Verificar estrutura final
SHOW TABLES;

SELECT 
  COUNT(*) as total_empresas,
  SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as ativas,
  SUM(CASE WHEN status = 'trial' THEN 1 ELSE 0 END) as trial
FROM companies;

-- =====================================================
-- NOTAS IMPORTANTES:
-- =====================================================
-- 1. Todos os dados existentes foram atribuídos a company_id = 1
-- 2. A empresa padrão (n8nbalao) foi criada com plano Enterprise
-- 3. Todas as funcionalidades estão ativadas para a empresa padrão
-- 4. Foreign keys comentadas - descomente se quiser integridade rígida
-- 5. Índices criados para otimizar queries multi-tenant
-- =====================================================
