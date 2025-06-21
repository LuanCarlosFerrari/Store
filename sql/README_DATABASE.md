# Script SQL Completo - Sistema de Store

## 📋 Visão Geral

O arquivo `create_database_completo.sql` contém **TODAS** as tabelas e estruturas necessárias para o projeto de sistema de store, incluindo:

- ✅ **Tabelas Principais**: clientes, produtos, vendas
- ✅ **Sistema de Pagamentos**: pagamentos, parcelas, histórico_pagamentos
- ✅ **Índices Otimizados**: Para melhor performance
- ✅ **Triggers**: Para atualização automática de timestamps
- ✅ **Políticas RLS**: Segurança por usuário
- ✅ **Views Úteis**: Para relatórios e consultas
- ✅ **Funções Utilitárias**: Para cálculos financeiros
- ✅ **Validação de Telefone**: Formatação automática de telefones brasileiros

## 🚀 Como Executar

### 1. No Supabase (Recomendado)

1. **Acesse o Dashboard do Supabase**
   - Vá para [https://supabase.com](https://supabase.com)
   - Faça login na sua conta
   - Selecione seu projeto

2. **Abra o SQL Editor**
   - No menu lateral, clique em "SQL Editor"
   - Clique em "New query"

3. **Execute o Script**
   - Copie todo o conteúdo do arquivo `create_database_completo.sql`
   - Cole no SQL Editor
   - Clique em "Run" ou use Ctrl+Enter

4. **Verifique a Execução**
   - Verifique se não há erros no console
   - Confira se as tabelas aparecem em "Table Editor"

### 2. Via psql (PostgreSQL local)

```bash
# Se estiver usando PostgreSQL local
psql -U seu_usuario -d seu_banco -f create_database_completo.sql
```

## 📊 Estrutura das Tabelas Criadas

### Tabelas Principais
| Tabela | Descrição | Campos Principais |
|--------|-----------|------------------|
| `clientes` | Cadastro de clientes | nome, email, telefone, endereco |
| `produtos` | Cadastro de produtos | nome, preco, quantidade, categoria |
| `vendas` | Registro de vendas | cliente_id, produto_id, quantidade, valor_total |

### Sistema de Pagamentos
| Tabela | Descrição | Campos Principais |
|--------|-----------|------------------|
| `pagamentos` | Controle de pagamentos | venda_id, valor_total, metodo_pagamento, status |
| `parcelas` | Parcelas de pagamentos | pagamento_id, numero_parcela, valor_parcela, data_vencimento |
| `historico_pagamentos` | Log de transações | pagamento_id, valor_pago, data_pagamento |

## 🔍 Views Criadas

### `view_vendas_completa`
```sql
-- Vendas com dados completos de cliente e produto
SELECT * FROM view_vendas_completa;
```

### `view_pagamentos_completa`
```sql
-- Pagamentos com todas as informações relacionadas
SELECT * FROM view_pagamentos_completa;
```

### `view_resumo_financeiro`
```sql
-- Resumo financeiro completo
SELECT * FROM view_resumo_financeiro;
```

### `view_dashboard_produtos`
```sql
-- Métricas para dashboard de produtos
SELECT * FROM view_dashboard_produtos;
```

## 🛠️ Funções Utilitárias

### `calcular_multa_juros()`
```sql
-- Calcular multa e juros por atraso
SELECT * FROM calcular_multa_juros(100.00, '2025-01-01', 2.0, 1.0);
```

### `atualizar_status_vencidos()`
```sql
-- Atualizar automaticamente status de pagamentos vencidos
SELECT atualizar_status_vencidos();
```

### `formatar_telefone()` e `validar_telefone()`
```sql
-- Formatar telefone brasileiro automaticamente
SELECT formatar_telefone('11999999999'); -- Retorna: (11) 99999-9999

-- Validar formato de telefone
SELECT validar_telefone('(11) 99999-9999'); -- Retorna: true
```

## 📱 Validação de Telefone

### Formatos Aceitos
- **(11) 99999-9999** - Celular com DDD
- **(11) 8888-8888** - Fixo com DDD  
- **99999-9999** - Celular sem DDD
- **8888-8888** - Fixo sem DDD
- **11999999999** - Números sem formatação (formatados automaticamente)
- **+55 11 99999-9999** - Com código do país

### Funcionamento Automático
- ✅ **Trigger Automático**: Formata telefones na inserção/atualização
- ✅ **Validação de Constraint**: Rejeita formatos inválidos
- ✅ **Flexibilidade**: Aceita diversos formatos de entrada
- ✅ **Padrão Brasileiro**: Específico para telefones do Brasil

### Exemplo de Uso
```sql
-- Inserir cliente com telefone não formatado
INSERT INTO clientes (nome, telefone, user_id) VALUES 
('João Silva', '11999999999', auth.uid());

-- O telefone será automaticamente formatado para: (11) 99999-9999
```

## ✅ Verificações Pós-Execução

### 1. Verificar Tabelas Criadas
```sql
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE tablename IN ('clientes', 'produtos', 'vendas', 'pagamentos', 'parcelas', 'historico_pagamentos')
ORDER BY tablename;
```

### 2. Verificar RLS Ativo
```sql
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename IN ('clientes', 'produtos', 'vendas', 'pagamentos', 'parcelas', 'historico_pagamentos')
ORDER BY tablename;
```

### 3. Testar Views
```sql
-- Deve retornar estrutura vazia inicialmente
SELECT * FROM view_resumo_financeiro;
SELECT * FROM view_dashboard_produtos;
```

## 🔒 Segurança RLS

Todas as tabelas têm **Row Level Security (RLS)** habilitado:

- ✅ Usuários só veem seus próprios dados
- ✅ Políticas automáticas baseadas em `auth.uid()`
- ✅ Proteção total entre usuários diferentes

## 🎯 Compatibilidade

### Sistema JavaScript
O script é **100% compatível** com o sistema JavaScript atual:
- ✅ Todas as colunas esperadas pelo código
- ✅ Tipos de dados corretos
- ✅ Relacionamentos preservados
- ✅ Nomes de tabelas/colunas idênticos

### Migrations Futuras
- ✅ Script pode ser executado múltiplas vezes
- ✅ Usa `IF NOT EXISTS` em todas as criações
- ✅ Não quebra dados existentes

## 🚨 Avisos Importantes

### Para Bancos Existentes
Se você já tem dados no banco:
1. **Faça backup** antes de executar
2. **Teste em ambiente de desenvolvimento** primeiro
3. **Revise** as políticas RLS se tiver usuários existentes

### Para Novos Projetos
✅ Execute diretamente - está seguro!

## 📝 Dados de Exemplo (Opcional)

O script inclui exemplos comentados no final. Para usar:

1. Descomente a seção "DADOS DE EXEMPLO"
2. Substitua os UUIDs pelos reais
3. Execute novamente

## 🛠️ Troubleshooting

### Erro de Permissão
```sql
-- Verificar se está logado no Supabase
SELECT auth.uid();
```

### Erro de RLS
```sql
-- Desabilitar temporariamente (apenas para debug)
ALTER TABLE nome_tabela DISABLE ROW LEVEL SECURITY;
```

### Verificar Erros
```sql
-- Ver logs de erro no Supabase
-- Aba "Logs" > "Database"
```

## 📞 Suporte

Se encontrar problemas:
1. Verifique os logs no Supabase
2. Confirme se está no projeto correto
3. Verifique se tem permissões de administrador
4. Execute as verificações pós-execução

---

**✨ Pronto!** Seu banco de dados está completamente configurado e pronto para uso com o sistema de store!
