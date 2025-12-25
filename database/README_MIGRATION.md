# 🗄️ Migração Multi-Tenant - Documentação

## 📋 Visão Geral

Esta migração transforma o banco de dados de **single-tenant** para **multi-tenant**, permitindo que múltiplas empresas usem o mesmo sistema com dados completamente isolados.

---

## ⚠️ IMPORTANTE - LEIA ANTES DE EXECUTAR!

### **Backup Obrigatório**

Antes de executar qualquer script, faça backup completo do banco de dados:

```bash
# Via linha de comando
mysqldump -u seu_usuario -p seu_banco > backup_antes_migracao_$(date +%Y%m%d_%H%M%S).sql

# Via phpMyAdmin
1. Acesse phpMyAdmin
2. Selecione o banco de dados
3. Clique em "Exportar"
4. Escolha "Método rápido" e "SQL"
5. Clique em "Executar"
6. Salve o arquivo em local seguro
```

### **Requisitos**

- MySQL 5.7+ ou MariaDB 10.2+
- Permissões de ALTER TABLE e CREATE TABLE
- Espaço em disco suficiente (pelo menos 2x o tamanho atual do banco)
- Acesso ao phpMyAdmin ou linha de comando MySQL

---

## 📊 O que Será Criado

### **Novas Tabelas**

1. **`companies`** - Empresas (tenants)
   - Armazena dados de cada empresa cliente
   - Configurações, planos, status
   - 1 registro = 1 empresa/loja

2. **`licenses`** - Licenças do sistema
   - Seriais gerados pelo master admin
   - Controle de ativação e expiração

3. **`payments`** - Histórico de pagamentos
   - Pagamentos via Stripe, Mercado Pago ou manual
   - Vinculado a cada empresa

4. **`consignments`** - Produtos em consignação
   - Sistema de marketplace
   - Produtos de clientes para revenda

### **Modificações em Tabelas Existentes**

Todas as tabelas existentes receberão:
- Coluna `company_id INT` (padrão: 1)
- Índice `idx_company` para performance
- Índices compostos para queries otimizadas

**Tabelas afetadas:**
- `products`
- `hardware`
- `categories`
- `orders`
- `users`
- `admins`
- `carousels`
- `settings`

---

## 🚀 Como Executar a Migração

### **Opção 1: Via phpMyAdmin (Recomendado para iniciantes)**

1. **Acesse phpMyAdmin**
   - URL: `https://seu-dominio.com/phpmyadmin`
   - Ou pelo painel da Hostinger

2. **Selecione o banco de dados**
   - Clique no nome do banco na lista à esquerda

3. **Abra a aba SQL**
   - Clique em "SQL" no menu superior

4. **Copie e cole o conteúdo de `migration_multitenant.sql`**
   - Abra o arquivo `migration_multitenant.sql`
   - Copie TODO o conteúdo
   - Cole na área de texto do phpMyAdmin

5. **Execute**
   - Clique em "Executar" (botão inferior direito)
   - Aguarde a conclusão (pode levar alguns segundos)

6. **Verifique os resultados**
   - Deve mostrar mensagens de sucesso
   - Verifique se as novas tabelas foram criadas

### **Opção 2: Via Linha de Comando**

```bash
# Conectar ao MySQL
mysql -u seu_usuario -p seu_banco

# Executar o script
source /caminho/para/migration_multitenant.sql

# Ou em uma linha
mysql -u seu_usuario -p seu_banco < migration_multitenant.sql
```

---

## ✅ Verificação Pós-Migração

### **1. Verificar Novas Tabelas**

Execute no phpMyAdmin (aba SQL):

```sql
SHOW TABLES LIKE 'companies';
SHOW TABLES LIKE 'licenses';
SHOW TABLES LIKE 'payments';
SHOW TABLES LIKE 'consignments';
```

**Resultado esperado:** Todas devem existir.

### **2. Verificar Coluna company_id**

```sql
SELECT 
  TABLE_NAME,
  COLUMN_NAME,
  COLUMN_TYPE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND COLUMN_NAME = 'company_id'
ORDER BY TABLE_NAME;
```

**Resultado esperado:** Deve listar todas as tabelas com `company_id`.

### **3. Verificar Empresa Padrão**

```sql
SELECT * FROM companies WHERE id = 1;
```

**Resultado esperado:**
- `id`: 1
- `name`: n8nbalao
- `slug`: n8nbalao
- `plan`: enterprise
- `status`: active

### **4. Verificar Dados Migrados**

```sql
-- Contar produtos
SELECT company_id, COUNT(*) as total FROM products GROUP BY company_id;

-- Contar hardware
SELECT company_id, COUNT(*) as total FROM hardware GROUP BY company_id;

-- Contar categorias
SELECT company_id, COUNT(*) as total FROM categories WHERE company_id IS NOT NULL GROUP BY company_id;
```

**Resultado esperado:** Todos os registros devem ter `company_id = 1`.

---

## 🔄 Rollback (Desfazer Migração)

Se algo der errado ou você quiser voltar ao estado anterior:

### **⚠️ ATENÇÃO: Rollback deleta dados de outras empresas!**

O rollback mantém apenas os dados da empresa padrão (company_id = 1).

### **Como fazer rollback:**

1. **Restaurar backup** (mais seguro):
   ```bash
   mysql -u seu_usuario -p seu_banco < backup_antes_migracao.sql
   ```

2. **Ou executar script de rollback**:
   - Abra `rollback_multitenant.sql` no phpMyAdmin
   - Execute (aba SQL)
   - Isso remove as novas tabelas e colunas

---

## 📊 Estrutura das Novas Tabelas

### **Tabela: companies**

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | INT | ID único da empresa |
| `name` | VARCHAR(255) | Nome da empresa |
| `slug` | VARCHAR(100) | Slug para subdomínio (único) |
| `custom_domain` | VARCHAR(255) | Domínio próprio (opcional) |
| `logo` | TEXT | URL ou base64 do logo |
| `email` | VARCHAR(255) | E-mail principal |
| `plan` | ENUM | basic, pro, enterprise |
| `status` | ENUM | active, trial, suspended, expired |
| `trial_ends_at` | DATETIME | Fim do período trial |
| `feature_monte_pc` | BOOLEAN | Ativa/desativa Monte seu PC |
| `feature_marketplace` | BOOLEAN | Ativa/desativa Marketplace |
| `settings` | JSON | Configurações (APIs, integrações) |

### **Tabela: licenses**

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | INT | ID único da licença |
| `license_key` | VARCHAR(50) | Serial único |
| `plan` | ENUM | Plano da licença |
| `email` | VARCHAR(255) | E-mail vinculado |
| `status` | ENUM | unused, active, expired, revoked |
| `company_id` | INT | Empresa que ativou |
| `generated_by` | VARCHAR(255) | Quem gerou (master admin) |

### **Tabela: payments**

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | INT | ID único do pagamento |
| `company_id` | INT | Empresa que pagou |
| `amount` | DECIMAL(10,2) | Valor pago |
| `plan` | ENUM | Plano pago |
| `gateway` | ENUM | stripe, mercadopago, manual |
| `status` | ENUM | pending, completed, failed, refunded |
| `paid_at` | DATETIME | Data de confirmação |

### **Tabela: consignments**

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | INT | ID único da consignação |
| `company_id` | INT | Empresa do marketplace |
| `user_id` | INT | Cliente que consignou |
| `product_name` | VARCHAR(255) | Nome do produto |
| `client_value` | DECIMAL(10,2) | Valor que o cliente quer |
| `commission_percent` | DECIMAL(5,2) | % de comissão |
| `final_value` | DECIMAL(10,2) | Valor final de venda |
| `status` | ENUM | pending, approved, sold, rejected |

---

## 🔍 Queries Úteis

### **Ver todas as empresas**
```sql
SELECT 
  id,
  name,
  slug,
  plan,
  status,
  created_at
FROM companies
ORDER BY created_at DESC;
```

### **Ver estatísticas por empresa**
```sql
SELECT 
  c.name,
  c.plan,
  c.status,
  COUNT(DISTINCT p.id) as total_produtos,
  COUNT(DISTINCT h.id) as total_hardware,
  COUNT(DISTINCT o.id) as total_pedidos
FROM companies c
LEFT JOIN products p ON p.company_id = c.id
LEFT JOIN hardware h ON h.company_id = c.id
LEFT JOIN orders o ON o.company_id = c.id
GROUP BY c.id;
```

### **Ver licenças ativas**
```sql
SELECT 
  l.license_key,
  l.plan,
  l.email,
  c.name as empresa,
  l.activated_at,
  l.expires_at
FROM licenses l
LEFT JOIN companies c ON c.id = l.company_id
WHERE l.status = 'active'
ORDER BY l.activated_at DESC;
```

### **Ver pagamentos recentes**
```sql
SELECT 
  c.name as empresa,
  p.amount,
  p.plan,
  p.gateway,
  p.status,
  p.paid_at
FROM payments p
JOIN companies c ON c.id = p.company_id
ORDER BY p.created_at DESC
LIMIT 20;
```

---

## 🐛 Troubleshooting

### **Erro: "Table already exists"**

**Causa:** Tabela já foi criada anteriormente.

**Solução:** 
- Se for primeira execução, ignore (script usa `IF NOT EXISTS`)
- Se for re-execução, faça rollback primeiro

### **Erro: "Column 'company_id' already exists"**

**Causa:** Coluna já foi adicionada.

**Solução:**
- Verifique se a migração já foi executada
- Se sim, não precisa executar novamente

### **Erro: "Cannot add foreign key constraint"**

**Causa:** Dados órfãos ou inconsistências.

**Solução:**
- Comente as linhas de FOREIGN KEY no script
- Execute sem foreign keys
- Investigue dados inconsistentes depois

### **Erro: "Out of memory"**

**Causa:** Banco muito grande.

**Solução:**
- Execute em partes (copie seções do script)
- Aumente `max_allowed_packet` no MySQL
- Execute via linha de comando (não phpMyAdmin)

---

## 📞 Suporte

Se encontrar problemas:

1. **Verifique os logs do MySQL**
   - phpMyAdmin: aba "Status" → "Variáveis"
   - Linha de comando: `SHOW ENGINE INNODB STATUS;`

2. **Tire screenshot do erro**
   - Mensagem completa de erro
   - Query que falhou

3. **Não execute rollback sem backup!**
   - Sempre tenha backup antes de qualquer ação

---

## ✅ Checklist de Execução

- [ ] Backup completo do banco de dados
- [ ] Backup salvo em local seguro
- [ ] Acesso ao phpMyAdmin ou MySQL CLI
- [ ] Leu toda a documentação
- [ ] Entendeu o que será modificado
- [ ] Executou `migration_multitenant.sql`
- [ ] Verificou criação das novas tabelas
- [ ] Verificou coluna `company_id` nas tabelas
- [ ] Verificou empresa padrão (id=1)
- [ ] Testou queries de verificação
- [ ] Documentou data e hora da migração

---

## 📅 Histórico

| Data | Versão | Descrição |
|------|--------|-----------|
| 2024-12-24 | 1.0 | Migração inicial Multi-Tenant |

---

## 🎯 Próximos Passos

Após a migração bem-sucedida:

1. ✅ **Fase 2**: Criar TenantContext no frontend
2. ✅ **Fase 3**: Implementar Master Admin
3. ✅ **Fase 4**: Criar sistema de Onboarding
4. ✅ **Fase 5**: Implementar controle de planos

---

**Dúvidas?** Revise este documento antes de executar!
