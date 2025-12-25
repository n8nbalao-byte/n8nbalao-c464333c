-- =====================================================
-- ROLLBACK MULTI-TENANT - n8nbalao.com
-- =====================================================
-- Data: 2024-12-24
-- Descrição: Desfaz a migração Multi-Tenant
-- ATENÇÃO: Isso removerá TODAS as empresas exceto a padrão!
-- =====================================================

-- =====================================================
-- PARTE 1: BACKUP DE SEGURANÇA
-- =====================================================
-- IMPORTANTE: Execute ANTES do rollback!
-- mysqldump -u usuario -p database_name > backup_before_rollback.sql

-- =====================================================
-- PARTE 2: REMOVER DADOS DE OUTRAS EMPRESAS
-- =====================================================

-- Deletar produtos de outras empresas (manter apenas company_id = 1)
DELETE FROM products WHERE company_id != 1;

-- Deletar hardware de outras empresas
DELETE FROM hardware WHERE company_id != 1;

-- Deletar categorias de outras empresas
DELETE FROM categories WHERE company_id != 1;

-- Deletar pedidos de outras empresas
DELETE FROM orders WHERE company_id != 1;

-- Deletar usuários de outras empresas
DELETE FROM users WHERE company_id != 1;

-- Deletar admins de outras empresas
DELETE FROM admins WHERE company_id != 1;

-- Deletar carrosséis de outras empresas
DELETE FROM carousels WHERE company_id != 1;

-- Deletar configurações de outras empresas
DELETE FROM settings WHERE company_id != 1;

-- =====================================================
-- PARTE 3: REMOVER COLUNA company_id DAS TABELAS
-- =====================================================

-- Produtos
ALTER TABLE products 
  DROP INDEX idx_company,
  DROP INDEX IF EXISTS idx_company_category,
  DROP FOREIGN KEY IF EXISTS products_ibfk_1,
  DROP COLUMN company_id;

-- Hardware
ALTER TABLE hardware 
  DROP INDEX idx_company,
  DROP INDEX IF EXISTS idx_company_category,
  DROP FOREIGN KEY IF EXISTS hardware_ibfk_1,
  DROP COLUMN company_id;

-- Categorias
ALTER TABLE categories 
  DROP INDEX idx_company,
  DROP FOREIGN KEY IF EXISTS categories_ibfk_1,
  DROP COLUMN company_id;

-- Pedidos
ALTER TABLE orders 
  DROP INDEX idx_company,
  DROP INDEX IF EXISTS idx_company_status,
  DROP FOREIGN KEY IF EXISTS orders_ibfk_1,
  DROP COLUMN company_id;

-- Usuários
ALTER TABLE users 
  DROP INDEX idx_company,
  DROP FOREIGN KEY IF EXISTS users_ibfk_1,
  DROP COLUMN company_id;

-- Admins
ALTER TABLE admins 
  DROP INDEX idx_company,
  DROP FOREIGN KEY IF EXISTS admins_ibfk_1,
  DROP COLUMN company_id;

-- Carrosséis
ALTER TABLE carousels 
  DROP INDEX idx_company,
  DROP FOREIGN KEY IF EXISTS carousels_ibfk_1,
  DROP COLUMN company_id;

-- Settings
ALTER TABLE settings 
  DROP INDEX idx_company,
  DROP FOREIGN KEY IF EXISTS settings_ibfk_1,
  DROP COLUMN company_id;

-- =====================================================
-- PARTE 4: REMOVER TABELAS MULTI-TENANT
-- =====================================================

-- Remover tabela de consignações
DROP TABLE IF EXISTS consignments;

-- Remover tabela de pagamentos
DROP TABLE IF EXISTS payments;

-- Remover tabela de licenças
DROP TABLE IF EXISTS licenses;

-- Remover tabela de empresas
DROP TABLE IF EXISTS companies;

-- =====================================================
-- PARTE 5: VERIFICAÇÃO
-- =====================================================

-- Verificar se company_id foi removido de todas as tabelas
SELECT 
  TABLE_NAME,
  COLUMN_NAME
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND COLUMN_NAME = 'company_id';

-- Se retornar vazio, rollback foi bem-sucedido!

-- Verificar tabelas restantes
SHOW TABLES;

-- =====================================================
-- FIM DO ROLLBACK
-- =====================================================

-- =====================================================
-- NOTAS IMPORTANTES:
-- =====================================================
-- 1. Este script DELETA permanentemente dados de outras empresas
-- 2. Apenas dados com company_id = 1 são mantidos
-- 3. As tabelas voltam ao estado original (sem multi-tenant)
-- 4. SEMPRE faça backup antes de executar!
-- 5. Se tiver dúvidas, NÃO execute este script
-- =====================================================
