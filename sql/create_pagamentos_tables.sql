-- ===================================================
-- SCRIPT SQL PARA CRIAÇÃO DAS TABELAS DE PAGAMENTOS
-- Sistema de Store com Supabase
-- ===================================================

-- 1. Tabela de Pagamentos
-- Armazena informações principais dos pagamentos
CREATE TABLE IF NOT EXISTS pagamentos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    venda_id UUID NOT NULL REFERENCES vendas(id) ON DELETE CASCADE,
    valor_total DECIMAL(10,2) NOT NULL CHECK (valor_total > 0),
    valor_pago DECIMAL(10,2) DEFAULT 0 CHECK (valor_pago >= 0),
    metodo_pagamento VARCHAR(50) NOT NULL CHECK (metodo_pagamento IN ('dinheiro', 'pix', 'cartao_debito', 'cartao_credito', 'transferencia', 'boleto')),
    data_vencimento DATE NOT NULL,
    data_ultimo_pagamento DATE,
    numero_parcelas INTEGER DEFAULT 1 CHECK (numero_parcelas >= 1),
    status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'parcial', 'vencido', 'cancelado')),
    observacoes TEXT,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Tabela de Parcelas
-- Para pagamentos parcelados
CREATE TABLE IF NOT EXISTS parcelas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    pagamento_id UUID NOT NULL REFERENCES pagamentos(id) ON DELETE CASCADE,
    numero_parcela INTEGER NOT NULL CHECK (numero_parcela >= 1),
    valor_parcela DECIMAL(10,2) NOT NULL CHECK (valor_parcela > 0),
    valor_pago DECIMAL(10,2) DEFAULT 0 CHECK (valor_pago >= 0),
    data_vencimento DATE NOT NULL,
    data_pagamento DATE,
    status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'vencido')),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Tabela de Histórico de Pagamentos
-- Registra todas as transações de pagamento
CREATE TABLE IF NOT EXISTS historico_pagamentos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    pagamento_id UUID NOT NULL REFERENCES pagamentos(id) ON DELETE CASCADE,
    valor_pago DECIMAL(10,2) NOT NULL CHECK (valor_pago > 0),
    metodo_pagamento VARCHAR(50) NOT NULL CHECK (metodo_pagamento IN ('dinheiro', 'pix', 'cartao_debito', 'cartao_credito', 'transferencia', 'boleto')),
    data_pagamento DATE NOT NULL DEFAULT CURRENT_DATE,
    observacoes TEXT,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ===================================================
-- ÍNDICES PARA MELHOR PERFORMANCE
-- ===================================================

-- Índices para tabela pagamentos
CREATE INDEX IF NOT EXISTS idx_pagamentos_venda_id ON pagamentos(venda_id);
CREATE INDEX IF NOT EXISTS idx_pagamentos_status ON pagamentos(status);
CREATE INDEX IF NOT EXISTS idx_pagamentos_data_vencimento ON pagamentos(data_vencimento);
CREATE INDEX IF NOT EXISTS idx_pagamentos_user_id ON pagamentos(user_id);
CREATE INDEX IF NOT EXISTS idx_pagamentos_metodo ON pagamentos(metodo_pagamento);

-- Índices para tabela parcelas
CREATE INDEX IF NOT EXISTS idx_parcelas_pagamento_id ON parcelas(pagamento_id);
CREATE INDEX IF NOT EXISTS idx_parcelas_data_vencimento ON parcelas(data_vencimento);
CREATE INDEX IF NOT EXISTS idx_parcelas_status ON parcelas(status);

-- Índices para tabela historico_pagamentos
CREATE INDEX IF NOT EXISTS idx_historico_pagamento_id ON historico_pagamentos(pagamento_id);
CREATE INDEX IF NOT EXISTS idx_historico_data_pagamento ON historico_pagamentos(data_pagamento);

-- ===================================================
-- TRIGGERS PARA ATUALIZAÇÃO AUTOMÁTICA
-- ===================================================

-- Trigger para atualizar updated_at na tabela pagamentos
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_pagamentos_updated_at BEFORE UPDATE ON pagamentos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_parcelas_updated_at BEFORE UPDATE ON parcelas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===================================================
-- RLS (ROW LEVEL SECURITY) POLICIES
-- ===================================================

-- Habilitar RLS nas tabelas
ALTER TABLE pagamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE parcelas ENABLE ROW LEVEL SECURITY;
ALTER TABLE historico_pagamentos ENABLE ROW LEVEL SECURITY;

-- Políticas para tabela pagamentos
CREATE POLICY "Users can view own pagamentos" ON pagamentos
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own pagamentos" ON pagamentos
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pagamentos" ON pagamentos
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own pagamentos" ON pagamentos
    FOR DELETE USING (auth.uid() = user_id);

-- Políticas para tabela parcelas
CREATE POLICY "Users can view own parcelas" ON parcelas
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own parcelas" ON parcelas
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own parcelas" ON parcelas
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own parcelas" ON parcelas
    FOR DELETE USING (auth.uid() = user_id);

-- Políticas para tabela historico_pagamentos
CREATE POLICY "Users can view own historico_pagamentos" ON historico_pagamentos
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own historico_pagamentos" ON historico_pagamentos
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ===================================================
-- VIEWS ÚTEIS PARA RELATÓRIOS
-- ===================================================

-- View com informações completas de pagamentos
CREATE OR REPLACE VIEW view_pagamentos_completa AS
SELECT 
    p.id,
    p.venda_id,
    p.valor_total,
    p.valor_pago,
    p.metodo_pagamento,
    p.data_vencimento,
    p.data_ultimo_pagamento,
    p.numero_parcelas,
    p.status,
    p.observacoes,
    p.created_at,
    p.updated_at,
    v.data_venda,
    v.quantidade,
    v.valor_unitario,
    c.nome as cliente_nome,
    c.telefone as cliente_telefone,
    pr.nome as produto_nome,
    pr.preco as produto_preco,
    CASE 
        WHEN p.status = 'pago' THEN 0
        ELSE (p.valor_total - p.valor_pago)
    END as valor_restante,
    CASE 
        WHEN p.data_vencimento < CURRENT_DATE AND p.status IN ('pendente', 'parcial') THEN true
        ELSE false
    END as esta_vencido
FROM pagamentos p
INNER JOIN vendas v ON p.venda_id = v.id
INNER JOIN clientes c ON v.cliente_id = c.id
INNER JOIN produtos pr ON v.produto_id = pr.id;

-- View para resumo financeiro
CREATE OR REPLACE VIEW view_resumo_financeiro AS
SELECT 
    COUNT(*) as total_pagamentos,
    SUM(valor_total) as valor_total_geral,
    SUM(valor_pago) as valor_pago_geral,
    SUM(CASE WHEN status = 'pago' THEN valor_total ELSE 0 END) as total_pago,
    SUM(CASE WHEN status IN ('pendente', 'parcial') THEN (valor_total - valor_pago) ELSE 0 END) as total_pendente,
    SUM(CASE WHEN data_vencimento < CURRENT_DATE AND status IN ('pendente', 'parcial') THEN (valor_total - valor_pago) ELSE 0 END) as total_vencido,
    COUNT(CASE WHEN status = 'pendente' THEN 1 END) as qtd_pendentes,
    COUNT(CASE WHEN status = 'pago' THEN 1 END) as qtd_pagos,
    COUNT(CASE WHEN status = 'parcial' THEN 1 END) as qtd_parciais,
    COUNT(CASE WHEN data_vencimento < CURRENT_DATE AND status IN ('pendente', 'parcial') THEN 1 END) as qtd_vencidos
FROM pagamentos
WHERE user_id = auth.uid();

-- ===================================================
-- FUNÇÕES UTILITÁRIAS
-- ===================================================

-- Função para calcular multa por atraso
CREATE OR REPLACE FUNCTION calcular_multa_atraso(
    valor_total DECIMAL,
    data_vencimento DATE,
    percentual_multa DECIMAL DEFAULT 2.0,
    percentual_juros_dia DECIMAL DEFAULT 0.033
)
RETURNS DECIMAL AS $$
DECLARE
    dias_atraso INTEGER;
    multa DECIMAL DEFAULT 0;
BEGIN
    dias_atraso := CURRENT_DATE - data_vencimento;
    
    IF dias_atraso > 0 THEN
        multa := (valor_total * percentual_multa / 100) + 
                 (valor_total * percentual_juros_dia / 100 * dias_atraso);
    END IF;
    
    RETURN ROUND(multa, 2);
END;
$$ LANGUAGE plpgsql;

-- ===================================================
-- DADOS DE EXEMPLO (OPCIONAL)
-- ===================================================

-- Inserir métodos de pagamento padrão (se necessário)
-- INSERT INTO pagamentos (venda_id, valor_total, metodo_pagamento, data_vencimento, user_id)
-- SELECT v.id, v.valor_total, 'dinheiro', CURRENT_DATE + INTERVAL '30 days', v.user_id
-- FROM vendas v 
-- WHERE NOT EXISTS (SELECT 1 FROM pagamentos p WHERE p.venda_id = v.id);

-- ===================================================
-- COMENTÁRIOS FINAIS
-- ===================================================

-- Este script cria a estrutura completa para o sistema de pagamentos
-- incluindo:
-- 1. Tabelas principais (pagamentos, parcelas, historico_pagamentos)
-- 2. Índices para performance
-- 3. Triggers para atualização automática
-- 4. Políticas RLS para segurança
-- 5. Views para relatórios
-- 6. Funções utilitárias

-- Para executar este script no Supabase:
-- 1. Acesse o SQL Editor no dashboard do Supabase
-- 2. Cole este código
-- 3. Execute o script
-- 4. Verifique se todas as tabelas foram criadas corretamente
