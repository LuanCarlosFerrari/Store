# Sistema de Vendas e Pagamentos

## Visão Geral

O sistema foi restruturado para incluir um módulo completo de gerenciamento de pagamentos, permitindo vendas à vista, a prazo e parceladas, com controle detalhado do status dos pagamentos.

## Novas Funcionalidades

### 🔄 **Sistema de Pagamentos Integrado**

- **Vendas à Vista**: Pagamento imediato no ato da venda
- **Vendas a Prazo**: Pagamento com data de vencimento definida
- **Vendas Parceladas**: Divisão do pagamento em múltiplas parcelas
- **Controle de Status**: Pendente, Pago, Parcial, Vencido, Cancelado

### 💳 **Métodos de Pagamento**

- Dinheiro
- PIX
- Cartão de Débito
- Cartão de Crédito
- Transferência Bancária
- Boleto

### 📊 **Aba de Gerenciamento de Pagamentos**

- **Filtros Avançados**: Por status, método de pagamento e período
- **Resumo Financeiro**: Total a receber, recebido, em atraso e parcial
- **Lista Detalhada**: Visualização completa dos pagamentos
- **Ações Rápidas**: Registrar pagamentos parciais e ver detalhes

## Arquitetura Técnica

### 🗃️ **Estrutura de Banco de Dados**

1. **Tabela `pagamentos`**
   - Informações principais do pagamento
   - Valor total, valor pago, método de pagamento
   - Data de vencimento e status

2. **Tabela `parcelas`**
   - Para pagamentos parcelados
   - Controle individual de cada parcela

3. **Tabela `historico_pagamentos`**
   - Registro de todas as transações de pagamento
   - Auditoria completa dos recebimentos

### 🔧 **Arquivos Criados/Modificados**

#### Novos Arquivos:
- `js/pagamentos.js` - Controlador principal de pagamentos
- `js/pagamentos-interface.js` - Interface da aba de pagamentos
- `sql/create_pagamentos_tables.sql` - Script SQL para criação das tabelas

#### Arquivos Modificados:
- `js/vendas.js` - Integração com sistema de pagamentos
- `js/database.js` - Métodos para operações de pagamento
- `js/app.js` - Inicialização dos novos controladores
- `index.html` - Nova aba de pagamentos e modal de configuração

## Como Configurar

### 1. **Banco de Dados (Supabase)**

Execute o script SQL no Supabase:
```sql
-- Copie o conteúdo de sql/create_pagamentos_tables.sql
-- e execute no SQL Editor do Supabase
```

### 2. **Interface de Vendas**

Agora ao registrar uma venda, será aberto um modal para configurar:
- Tipo de venda (à vista, a prazo, parcelada)
- Método de pagamento
- Prazo de vencimento (se aplicável)
- Número de parcelas (se aplicável)
- Observações

### 3. **Gerenciamento de Pagamentos**

Nova aba "Pagamentos" no menu lateral com:
- Filtros por status e método de pagamento
- Resumo financeiro em tempo real
- Lista de todos os pagamentos
- Ações para registrar pagamentos parciais

## Fluxo de Trabalho

### 📝 **Registrar Nova Venda**

1. Acesse a aba "Caixa"
2. Selecione cliente, produto e quantidade
3. Clique em "Registrar Venda"
4. Configure o pagamento no modal:
   - **À Vista**: Pagamento imediato
   - **A Prazo**: Define data de vencimento
   - **Parcelada**: Define número de parcelas e vencimento da primeira
5. Confirme a venda

### 💰 **Gerenciar Pagamentos**

1. Acesse a aba "Pagamentos"
2. Use filtros para encontrar pagamentos específicos
3. Visualize o resumo financeiro
4. Para pagamentos pendentes/parciais:
   - Clique em "Pagar" para registrar recebimento
   - Clique em "Detalhes" para ver histórico completo

### 📈 **Relatórios e Análises**

- **Dashboard**: Visão geral das vendas e status de pagamentos
- **Resumo Financeiro**: Total a receber, recebido e em atraso
- **Verificação de Vencidos**: Botão para atualizar status automaticamente

## Funcionalidades Avançadas

### 🔍 **Verificação Automática de Vencidos**

O sistema pode verificar automaticamente pagamentos vencidos e atualizar os status.

### 📊 **Relatórios Detalhados**

- Agrupamento por método de pagamento
- Análise de inadimplência
- Projeção de recebimentos

### 💡 **Cálculo de Multas**

Função SQL disponível para calcular multas por atraso (configurável).

## Próximas Implementações

- [ ] Modal para registrar pagamentos parciais
- [ ] Modal de detalhes do pagamento com histórico
- [ ] Notificações de vencimento
- [ ] Relatórios gráficos
- [ ] Exportação de dados
- [ ] Integração com APIs de pagamento

## Segurança

- **RLS (Row Level Security)**: Cada usuário vê apenas seus dados
- **Validações**: Constraints de banco para integridade dos dados
- **Auditoria**: Histórico completo de todas as transações

## Suporte

Para dúvidas ou problemas:
1. Verifique se as tabelas foram criadas corretamente no Supabase
2. Confira se todos os scripts estão carregados na ordem correta
3. Verifique o console do navegador para erros JavaScript
4. Confirme se as políticas RLS estão aplicadas corretamente
