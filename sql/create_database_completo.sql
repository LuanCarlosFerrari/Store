-- ===================================================
-- SCRIPT SQL COMPLETO - SISTEMA DE STORE
-- Criação de todas as tabelas do zero
-- Compatível com Supabase PostgreSQL
-- ===================================================

-- Remover tabelas existentes se necessário (usar com cuidado em produção)
-- DROP TABLE IF EXISTS historico_pagamentos CASCADE;
-- DROP TABLE IF EXISTS parcelas CASCADE;
-- DROP TABLE IF EXISTS pagamentos CASCADE;
-- DROP TABLE IF EXISTS vendas CASCADE;
-- DROP TABLE IF EXISTS produtos CASCADE;
-- DROP TABLE IF EXISTS clientes CASCADE;

-- ===================================================
-- 1. TABELA DE CLIENTES
-- ===================================================
CREATE TABLE IF NOT EXISTS clientes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    telefone VARCHAR(20) CHECK (
        telefone IS NULL OR 
        telefone ~ '^(\([0-9]{2}\)\s?[0-9]{4,5}-[0-9]{4}|[0-9]{2}\s?[0-9]{4,5}-?[0-9]{4}|\+55\s?\([0-9]{2}\)\s?[0-9]{4,5}-?[0-9]{4})$'
    ),
    endereco TEXT,
    cpf_cnpj VARCHAR(20),
    data_nascimento DATE,
    observacoes TEXT,
    ativo BOOLEAN DEFAULT true,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ===================================================
-- 2. TABELA DE PRODUTOS
-- ===================================================
CREATE TABLE IF NOT EXISTS produtos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    preco DECIMAL(10,2) NOT NULL CHECK (preco >= 0),
    quantidade INTEGER NOT NULL DEFAULT 0 CHECK (quantidade >= 0),
    categoria VARCHAR(100),
    codigo_barras VARCHAR(50),
    unidade_medida VARCHAR(20) DEFAULT 'unidade',
    peso_kg DECIMAL(8,3),
    dimensoes VARCHAR(50),
    fornecedor VARCHAR(255),
    data_validade DATE,
    estoque_minimo INTEGER DEFAULT 0,
    ativo BOOLEAN DEFAULT true,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ===================================================
-- 3. TABELA DE VENDAS
-- ===================================================
CREATE TABLE IF NOT EXISTS vendas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cliente_id UUID NOT NULL REFERENCES clientes(id),
    produto_id UUID NOT NULL REFERENCES produtos(id),
    quantidade INTEGER NOT NULL CHECK (quantidade > 0),
    valor_unitario DECIMAL(10,2) NOT NULL CHECK (valor_unitario >= 0),
    valor_total DECIMAL(10,2) NOT NULL CHECK (valor_total >= 0),
    desconto DECIMAL(10,2) DEFAULT 0 CHECK (desconto >= 0),
    data_venda DATE NOT NULL DEFAULT CURRENT_DATE,
    observacoes TEXT,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ===================================================
-- 4. TABELA DE PAGAMENTOS
-- ===================================================
CREATE TABLE IF NOT EXISTS pagamentos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    venda_id UUID NOT NULL REFERENCES vendas(id) ON DELETE CASCADE,
    valor_total DECIMAL(10,2) NOT NULL CHECK (valor_total > 0),
    valor_pago DECIMAL(10,2) DEFAULT 0 CHECK (valor_pago >= 0),
    metodo_pagamento VARCHAR(50) NOT NULL CHECK (metodo_pagamento IN ('dinheiro', 'pix', 'cartao_debito', 'cartao_credito', 'transferencia', 'boleto', 'cheque')),
    data_vencimento DATE NOT NULL,
    data_pagamento DATE,
    data_ultimo_pagamento DATE,
    numero_parcelas INTEGER DEFAULT 1 CHECK (numero_parcelas >= 1),
    status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'parcial', 'vencido', 'cancelado')),
    observacoes TEXT,
    juros_percentual DECIMAL(5,2) DEFAULT 0,
    multa_percentual DECIMAL(5,2) DEFAULT 0,
    desconto_percentual DECIMAL(5,2) DEFAULT 0,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ===================================================
-- 5. TABELA DE PARCELAS
-- ===================================================
CREATE TABLE IF NOT EXISTS parcelas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    pagamento_id UUID NOT NULL REFERENCES pagamentos(id) ON DELETE CASCADE,
    numero_parcela INTEGER NOT NULL CHECK (numero_parcela >= 1),
    valor_parcela DECIMAL(10,2) NOT NULL CHECK (valor_parcela > 0),
    valor_pago DECIMAL(10,2) DEFAULT 0 CHECK (valor_pago >= 0),
    data_vencimento DATE NOT NULL,
    data_pagamento DATE,
    status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'vencido')),
    juros_aplicado DECIMAL(10,2) DEFAULT 0,
    multa_aplicada DECIMAL(10,2) DEFAULT 0,
    desconto_aplicado DECIMAL(10,2) DEFAULT 0,
    observacoes TEXT,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ===================================================
-- 6. TABELA DE HISTÓRICO DE PAGAMENTOS
-- ===================================================
CREATE TABLE IF NOT EXISTS historico_pagamentos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    pagamento_id UUID NOT NULL REFERENCES pagamentos(id) ON DELETE CASCADE,
    parcela_id UUID REFERENCES parcelas(id) ON DELETE CASCADE,
    valor_pago DECIMAL(10,2) NOT NULL CHECK (valor_pago > 0),
    metodo_pagamento VARCHAR(50) NOT NULL CHECK (metodo_pagamento IN ('dinheiro', 'pix', 'cartao_debito', 'cartao_credito', 'transferencia', 'boleto', 'cheque')),
    data_pagamento DATE NOT NULL DEFAULT CURRENT_DATE,
    observacoes TEXT,
    comprovante_url TEXT,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ===================================================
-- ÍNDICES PARA MELHOR PERFORMANCE
-- ===================================================

-- Índices para clientes
CREATE INDEX IF NOT EXISTS idx_clientes_nome ON clientes(nome);
CREATE INDEX IF NOT EXISTS idx_clientes_email ON clientes(email);
CREATE INDEX IF NOT EXISTS idx_clientes_telefone ON clientes(telefone);
CREATE INDEX IF NOT EXISTS idx_clientes_user_id ON clientes(user_id);
CREATE INDEX IF NOT EXISTS idx_clientes_ativo ON clientes(ativo);

-- Índices para produtos
CREATE INDEX IF NOT EXISTS idx_produtos_nome ON produtos(nome);
CREATE INDEX IF NOT EXISTS idx_produtos_categoria ON produtos(categoria);
CREATE INDEX IF NOT EXISTS idx_produtos_codigo_barras ON produtos(codigo_barras);
CREATE INDEX IF NOT EXISTS idx_produtos_user_id ON produtos(user_id);
CREATE INDEX IF NOT EXISTS idx_produtos_ativo ON produtos(ativo);
CREATE INDEX IF NOT EXISTS idx_produtos_quantidade ON produtos(quantidade);

-- Índices para vendas
CREATE INDEX IF NOT EXISTS idx_vendas_cliente_id ON vendas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_vendas_produto_id ON vendas(produto_id);
CREATE INDEX IF NOT EXISTS idx_vendas_data_venda ON vendas(data_venda);
CREATE INDEX IF NOT EXISTS idx_vendas_user_id ON vendas(user_id);

-- Índices para pagamentos
CREATE INDEX IF NOT EXISTS idx_pagamentos_venda_id ON pagamentos(venda_id);
CREATE INDEX IF NOT EXISTS idx_pagamentos_status ON pagamentos(status);
CREATE INDEX IF NOT EXISTS idx_pagamentos_data_vencimento ON pagamentos(data_vencimento);
CREATE INDEX IF NOT EXISTS idx_pagamentos_data_pagamento ON pagamentos(data_pagamento);
CREATE INDEX IF NOT EXISTS idx_pagamentos_user_id ON pagamentos(user_id);
CREATE INDEX IF NOT EXISTS idx_pagamentos_metodo ON pagamentos(metodo_pagamento);

-- Índices para parcelas
CREATE INDEX IF NOT EXISTS idx_parcelas_pagamento_id ON parcelas(pagamento_id);
CREATE INDEX IF NOT EXISTS idx_parcelas_data_vencimento ON parcelas(data_vencimento);
CREATE INDEX IF NOT EXISTS idx_parcelas_data_pagamento ON parcelas(data_pagamento);
CREATE INDEX IF NOT EXISTS idx_parcelas_status ON parcelas(status);

-- Índices para histórico de pagamentos
CREATE INDEX IF NOT EXISTS idx_historico_pagamento_id ON historico_pagamentos(pagamento_id);
CREATE INDEX IF NOT EXISTS idx_historico_parcela_id ON historico_pagamentos(parcela_id);
CREATE INDEX IF NOT EXISTS idx_historico_data_pagamento ON historico_pagamentos(data_pagamento);

-- ===================================================
-- TRIGGERS PARA ATUALIZAÇÃO AUTOMÁTICA
-- ===================================================

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Função para formatar telefone automaticamente
CREATE OR REPLACE FUNCTION format_telefone_trigger()
RETURNS TRIGGER AS $$
BEGIN
    -- Formatar telefone se não for NULL
    IF NEW.telefone IS NOT NULL AND TRIM(NEW.telefone) != '' THEN
        NEW.telefone := formatar_telefone(NEW.telefone);
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para clientes
CREATE TRIGGER format_telefone_clientes BEFORE INSERT OR UPDATE ON clientes
    FOR EACH ROW EXECUTE FUNCTION format_telefone_trigger();

CREATE TRIGGER update_clientes_updated_at BEFORE UPDATE ON clientes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Triggers para produtos
CREATE TRIGGER update_produtos_updated_at BEFORE UPDATE ON produtos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Triggers para vendas
CREATE TRIGGER update_vendas_updated_at BEFORE UPDATE ON vendas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Triggers para pagamentos
CREATE TRIGGER update_pagamentos_updated_at BEFORE UPDATE ON pagamentos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Triggers para parcelas
CREATE TRIGGER update_parcelas_updated_at BEFORE UPDATE ON parcelas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===================================================
-- RLS (ROW LEVEL SECURITY) POLICIES
-- ===================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE parcelas ENABLE ROW LEVEL SECURITY;
ALTER TABLE historico_pagamentos ENABLE ROW LEVEL SECURITY;

-- Políticas para clientes
CREATE POLICY "Users can view own clientes" ON clientes
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own clientes" ON clientes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own clientes" ON clientes
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own clientes" ON clientes
    FOR DELETE USING (auth.uid() = user_id);

-- Políticas para produtos
CREATE POLICY "Users can view own produtos" ON produtos
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own produtos" ON produtos
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own produtos" ON produtos
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own produtos" ON produtos
    FOR DELETE USING (auth.uid() = user_id);

-- Políticas para vendas
CREATE POLICY "Users can view own vendas" ON vendas
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own vendas" ON vendas
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own vendas" ON vendas
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own vendas" ON vendas
    FOR DELETE USING (auth.uid() = user_id);

-- Políticas para pagamentos
CREATE POLICY "Users can view own pagamentos" ON pagamentos
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own pagamentos" ON pagamentos
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pagamentos" ON pagamentos
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own pagamentos" ON pagamentos
    FOR DELETE USING (auth.uid() = user_id);

-- Políticas para parcelas
CREATE POLICY "Users can view own parcelas" ON parcelas
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own parcelas" ON parcelas
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own parcelas" ON parcelas
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own parcelas" ON parcelas
    FOR DELETE USING (auth.uid() = user_id);

-- Políticas para histórico de pagamentos
CREATE POLICY "Users can view own historico_pagamentos" ON historico_pagamentos
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own historico_pagamentos" ON historico_pagamentos
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ===================================================
-- VIEWS ÚTEIS PARA RELATÓRIOS E CONSULTAS
-- ===================================================

-- View com informações completas de vendas
CREATE OR REPLACE VIEW view_vendas_completa AS
SELECT 
    v.id,
    v.data_venda,
    v.quantidade,
    v.valor_unitario,
    v.valor_total,
    v.desconto,
    v.observacoes as venda_observacoes,
    v.created_at,
    v.updated_at,
    c.id as cliente_id,
    c.nome as cliente_nome,
    c.email as cliente_email,
    c.telefone as cliente_telefone,
    c.endereco as cliente_endereco,
    p.id as produto_id,
    p.nome as produto_nome,
    p.preco as produto_preco,
    p.categoria as produto_categoria,
    p.quantidade as produto_estoque,
    CASE 
        WHEN pg.id IS NOT NULL THEN pg.status
        ELSE 'sem_pagamento'
    END as status_pagamento,
    pg.metodo_pagamento,
    pg.valor_pago as pagamento_valor_pago,
    pg.data_vencimento as pagamento_vencimento
FROM vendas v
INNER JOIN clientes c ON v.cliente_id = c.id
INNER JOIN produtos p ON v.produto_id = p.id
LEFT JOIN pagamentos pg ON v.id = pg.venda_id;

-- View com informações completas de pagamentos
CREATE OR REPLACE VIEW view_pagamentos_completa AS
SELECT 
    p.id,
    p.venda_id,
    p.valor_total,
    p.valor_pago,
    p.metodo_pagamento,
    p.data_vencimento,
    p.data_pagamento,
    p.data_ultimo_pagamento,
    p.numero_parcelas,
    p.status,
    p.observacoes,
    p.juros_percentual,
    p.multa_percentual,
    p.desconto_percentual,
    p.created_at,
    p.updated_at,
    v.data_venda,
    v.quantidade,
    v.valor_unitario,
    c.nome as cliente_nome,
    c.telefone as cliente_telefone,
    c.email as cliente_email,
    pr.nome as produto_nome,
    pr.preco as produto_preco,
    CASE 
        WHEN p.status = 'pago' THEN 0
        ELSE (p.valor_total - p.valor_pago)
    END as valor_restante,
    CASE 
        WHEN p.data_vencimento < CURRENT_DATE AND p.status IN ('pendente', 'parcial') THEN true
        ELSE false
    END as esta_vencido,
    CASE 
        WHEN p.data_vencimento < CURRENT_DATE AND p.status IN ('pendente', 'parcial') THEN 
            CURRENT_DATE - p.data_vencimento
        ELSE 0
    END as dias_atraso
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
    COUNT(CASE WHEN data_vencimento < CURRENT_DATE AND status IN ('pendente', 'parcial') THEN 1 END) as qtd_vencidos,
    ROUND(AVG(valor_total), 2) as ticket_medio
FROM pagamentos
WHERE user_id = auth.uid();

-- View para dashboard de produtos
CREATE OR REPLACE VIEW view_dashboard_produtos AS
SELECT 
    COUNT(*) as total_produtos,
    COUNT(CASE WHEN ativo = true THEN 1 END) as produtos_ativos,
    COUNT(CASE WHEN quantidade <= estoque_minimo THEN 1 END) as produtos_estoque_baixo,
    COUNT(CASE WHEN quantidade = 0 THEN 1 END) as produtos_sem_estoque,
    SUM(quantidade * preco) as valor_total_estoque
FROM produtos
WHERE user_id = auth.uid();

-- ===================================================
-- FUNÇÕES UTILITÁRIAS
-- ===================================================

-- Função para formatar telefone brasileiro
CREATE OR REPLACE FUNCTION formatar_telefone(telefone_input TEXT)
RETURNS TEXT AS $$
DECLARE
    telefone_limpo TEXT;
    telefone_formatado TEXT;
BEGIN
    -- Remover todos os caracteres não numéricos
    telefone_limpo := regexp_replace(telefone_input, '[^0-9]', '', 'g');
    
    -- Verificar se começa com código do país (55)
    IF LENGTH(telefone_limpo) = 13 AND LEFT(telefone_limpo, 2) = '55' THEN
        telefone_limpo := SUBSTRING(telefone_limpo FROM 3);
    END IF;
    
    -- Formatar baseado no tamanho
    CASE LENGTH(telefone_limpo)
        -- Celular com 9 dígitos: (11) 99999-9999
        WHEN 11 THEN
            telefone_formatado := '(' || SUBSTRING(telefone_limpo FROM 1 FOR 2) || ') ' ||
                                SUBSTRING(telefone_limpo FROM 3 FOR 5) || '-' ||
                                SUBSTRING(telefone_limpo FROM 8 FOR 4);
        
        -- Telefone fixo: (11) 9999-9999
        WHEN 10 THEN
            telefone_formatado := '(' || SUBSTRING(telefone_limpo FROM 1 FOR 2) || ') ' ||
                                SUBSTRING(telefone_limpo FROM 3 FOR 4) || '-' ||
                                SUBSTRING(telefone_limpo FROM 7 FOR 4);
        
        -- Celular sem DDD: 99999-9999
        WHEN 9 THEN
            telefone_formatado := SUBSTRING(telefone_limpo FROM 1 FOR 5) || '-' ||
                                SUBSTRING(telefone_limpo FROM 6 FOR 4);
        
        -- Telefone fixo sem DDD: 9999-9999
        WHEN 8 THEN
            telefone_formatado := SUBSTRING(telefone_limpo FROM 1 FOR 4) || '-' ||
                                SUBSTRING(telefone_limpo FROM 5 FOR 4);
        
        ELSE
            -- Retornar como está se não se encaixar nos padrões
            telefone_formatado := telefone_input;
    END CASE;
    
    RETURN telefone_formatado;
END;
$$ LANGUAGE plpgsql;

-- Função para validar telefone brasileiro
CREATE OR REPLACE FUNCTION validar_telefone(telefone_input TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    telefone_limpo TEXT;
BEGIN
    -- Se for NULL ou vazio, é válido
    IF telefone_input IS NULL OR TRIM(telefone_input) = '' THEN
        RETURN TRUE;
    END IF;
    
    -- Remover todos os caracteres não numéricos
    telefone_limpo := regexp_replace(telefone_input, '[^0-9]', '', 'g');
    
    -- Verificar se começa com código do país (55)
    IF LENGTH(telefone_limpo) = 13 AND LEFT(telefone_limpo, 2) = '55' THEN
        telefone_limpo := SUBSTRING(telefone_limpo FROM 3);
    END IF;
    
    -- Validar tamanhos aceitos
    RETURN LENGTH(telefone_limpo) IN (8, 9, 10, 11);
END;
$$ LANGUAGE plpgsql;

-- Função para calcular multa e juros por atraso
CREATE OR REPLACE FUNCTION calcular_multa_juros(
    valor_principal DECIMAL,
    data_vencimento DATE,
    percentual_multa DECIMAL DEFAULT 2.0,
    percentual_juros_mensal DECIMAL DEFAULT 1.0
)
RETURNS TABLE(multa DECIMAL, juros DECIMAL, total DECIMAL) AS $$
DECLARE
    dias_atraso INTEGER;
    multa_calc DECIMAL DEFAULT 0;
    juros_calc DECIMAL DEFAULT 0;
BEGIN
    dias_atraso := CURRENT_DATE - data_vencimento;
    
    IF dias_atraso > 0 THEN
        -- Multa fixa
        multa_calc := valor_principal * percentual_multa / 100;
        
        -- Juros proporcionais aos dias de atraso
        juros_calc := valor_principal * percentual_juros_mensal / 100 * dias_atraso / 30;
    END IF;
    
    RETURN QUERY SELECT 
        ROUND(multa_calc, 2) as multa,
        ROUND(juros_calc, 2) as juros,
        ROUND(valor_principal + multa_calc + juros_calc, 2) as total;
END;
$$ LANGUAGE plpgsql;

-- Função para atualizar status de pagamentos vencidos
CREATE OR REPLACE FUNCTION atualizar_status_vencidos()
RETURNS INTEGER AS $$
DECLARE
    registros_atualizados INTEGER;
BEGIN
    UPDATE pagamentos 
    SET status = 'vencido', updated_at = timezone('utc'::text, now())
    WHERE data_vencimento < CURRENT_DATE 
    AND status IN ('pendente', 'parcial');
    
    GET DIAGNOSTICS registros_atualizados = ROW_COUNT;
    
    UPDATE parcelas 
    SET status = 'vencido', updated_at = timezone('utc'::text, now())
    WHERE data_vencimento < CURRENT_DATE 
    AND status = 'pendente';
    
    RETURN registros_atualizados;
END;
$$ LANGUAGE plpgsql;

-- ===================================================
-- DADOS DE EXEMPLO (OPCIONAL - COMENTADO)
-- ===================================================

-- Descomentar para inserir dados de exemplo
/*
-- Exemplo de cliente com telefone (será formatado automaticamente)
INSERT INTO clientes (nome, email, telefone, endereco, user_id) VALUES
('João Silva', 'joao@email.com', '11999999999', 'Rua das Flores, 123', auth.uid()),
('Maria Santos', 'maria@email.com', '(11) 8888-8888', 'Av. Principal, 456', auth.uid()),
('Pedro Costa', 'pedro@email.com', '+55 21 97777-7777', 'Rua do Centro, 789', auth.uid());

-- Exemplo de produto
INSERT INTO produtos (nome, descricao, preco, quantidade, categoria, user_id) VALUES
('Produto Exemplo', 'Descrição do produto exemplo', 29.90, 100, 'Categoria A', auth.uid());

-- Exemplo de venda (substitua os IDs pelos reais)
-- INSERT INTO vendas (cliente_id, produto_id, quantidade, valor_unitario, valor_total, user_id) VALUES
-- ('uuid-do-cliente', 'uuid-do-produto', 2, 29.90, 59.80, auth.uid());

-- Exemplo de pagamento (substitua o ID da venda pelo real)
-- INSERT INTO pagamentos (venda_id, valor_total, metodo_pagamento, data_vencimento, status, user_id) VALUES
-- ('uuid-da-venda', 59.80, 'dinheiro', CURRENT_DATE, 'pago', auth.uid());

-- Exemplos de teste para telefone:
-- SELECT formatar_telefone('11999999999'); -- Retorna: (11) 99999-9999
-- SELECT formatar_telefone('1188888888');  -- Retorna: (11) 8888-8888
-- SELECT formatar_telefone('999999999');   -- Retorna: 99999-9999
-- SELECT validar_telefone('(11) 99999-9999'); -- Retorna: true
-- SELECT validar_telefone('123');             -- Retorna: false
*/

-- ===================================================
-- VERIFICAÇÕES FINAIS
-- ===================================================

-- Verificar se todas as tabelas foram criadas
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE tablename IN ('clientes', 'produtos', 'vendas', 'pagamentos', 'parcelas', 'historico_pagamentos')
ORDER BY tablename;

-- Verificar se todas as políticas RLS estão ativas
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename IN ('clientes', 'produtos', 'vendas', 'pagamentos', 'parcelas', 'historico_pagamentos')
ORDER BY tablename;

-- ===================================================
-- COMENTÁRIOS FINAIS
-- ===================================================

-- Este script cria a estrutura completa do sistema de store incluindo:
-- 1. Tabelas principais: clientes, produtos, vendas
-- 2. Sistema de pagamentos: pagamentos, parcelas, histórico
-- 3. Índices otimizados para performance
-- 4. Triggers para atualização automática de timestamps
-- 5. Políticas RLS para segurança por usuário
-- 6. Views úteis para relatórios e consultas
-- 7. Funções utilitárias para cálculos financeiros
-- 8. Validação e formatação automática de telefones brasileiros

-- RECURSOS DE TELEFONE:
-- - Validação automática de formatos brasileiros
-- - Formatação automática na inserção/atualização
-- - Suporte a: (11) 99999-9999, 11999999999, +55 11 99999-9999
-- - Aceita telefones fixos e celulares, com ou sem DDD
-- - Trigger automático para formatar telefones

-- FORMATOS ACEITOS PARA TELEFONE:
-- - (11) 99999-9999 - Celular com DDD
-- - (11) 8888-8888  - Fixo com DDD  
-- - 99999-9999      - Celular sem DDD
-- - 8888-8888       - Fixo sem DDD
-- - 11999999999     - Números sem formatação (serão formatados automaticamente)
-- - +55 11 99999-9999 - Com código do país

-- Para executar este script no Supabase:
-- 1. Acesse o SQL Editor no dashboard do Supabase
-- 2. Cole este código completo
-- 3. Execute o script
-- 4. Verifique se todas as tabelas foram criadas corretamente
-- 5. Teste as views e funções criadas

-- IMPORTANTE: Este script pode ser executado múltiplas vezes
-- pois usa "IF NOT EXISTS" em todas as criações de tabelas
