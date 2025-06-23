/**
 * Módulo de Database para integração com Supabase
 * Centraliza todas as operações de banco de dados
 */

class DatabaseController {
    constructor(authController) {
        this.authController = authController;
        this.supabase = null;
        this.isReady = false;
        this.init();
    }

    async init() {
        // Aguardar auth controller estar pronto
        await this.waitForAuth();
        this.supabase = this.authController.supabase;
        this.isReady = true;
        console.log('Database: Controlador inicializado');
    }

    async waitForAuth() {
        return new Promise((resolve) => {
            const checkAuth = () => {
                if (this.authController && this.authController.supabase) {
                    resolve();
                } else {
                    setTimeout(checkAuth, 100);
                }
            };
            checkAuth();
        });
    }

    // Verificar se está pronto para operações
    ensureReady() {
        if (!this.isReady || !this.supabase) {
            throw new Error('Database não está pronto. Verifique a conexão com Supabase.');
        }
    }

    // OPERAÇÕES DE PRODUTOS
    async criarProduto(produto) {
        this.ensureReady();

        try {
            // Verificar se user_id está sendo usado
            let user = null;
            try {
                user = await this.authController.getCurrentUser();
            } catch (error) {
                console.warn('Não foi possível obter usuário, criando produto sem user_id');
            }

            // Preparar dados do produto
            const produtoData = {
                nome: produto.nome,
                quantidade: produto.quantidade,
                preco: produto.preco
            };

            // Adicionar user_id apenas se o usuário estiver disponível
            if (user) {
                produtoData.user_id = user.id;
            }

            const { data, error } = await this.supabase
                .from('produtos')
                .insert([produtoData])
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Erro ao criar produto:', error);
            throw error;
        }
    }

    async listarProdutos() {
        this.ensureReady();

        try {
            const { data, error } = await this.supabase
                .from('produtos')
                .select('*')
                .order('nome');

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Erro ao listar produtos:', error);
            throw error;
        }
    }

    async atualizarProduto(id, produto) {
        this.ensureReady();

        try {
            const { data, error } = await this.supabase
                .from('produtos')
                .update({
                    nome: produto.nome,
                    quantidade: produto.quantidade,
                    preco: produto.preco
                })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Erro ao atualizar produto:', error);
            throw error;
        }
    }

    async deletarProduto(id) {
        this.ensureReady();

        try {
            const { error } = await this.supabase
                .from('produtos')
                .delete()
                .eq('id', id);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Erro ao deletar produto:', error);
            throw error;
        }
    }

    async obterProduto(id) {
        this.ensureReady();

        try {
            const { data, error } = await this.supabase
                .from('produtos')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Erro ao obter produto:', error);
            throw error;
        }
    }    // OPERAÇÕES DE CLIENTES
    async criarCliente(cliente) {
        this.ensureReady();

        try {
            // Verificar se user_id está sendo usado
            let user = null;
            try {
                user = await this.authController.getCurrentUser();
            } catch (error) {
                console.warn('Não foi possível obter usuário, criando cliente sem user_id');
            }

            // Preparar dados do cliente
            const clienteData = {
                nome: cliente.nome,
                telefone: cliente.telefone,
                email: cliente.email || null,
                endereco: cliente.endereco || null
            };

            // Adicionar user_id apenas se o usuário estiver disponível
            if (user) {
                clienteData.user_id = user.id;
            }

            const { data, error } = await this.supabase
                .from('clientes')
                .insert([clienteData])
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Erro ao criar cliente:', error);
            throw error;
        }
    }

    async listarClientes() {
        this.ensureReady();

        try {
            const { data, error } = await this.supabase
                .from('clientes')
                .select('*')
                .order('nome');

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Erro ao listar clientes:', error);
            throw error;
        }
    }

    async atualizarCliente(id, cliente) {
        this.ensureReady();

        try {
            const { data, error } = await this.supabase
                .from('clientes')
                .update({
                    nome: cliente.nome,
                    telefone: cliente.telefone,
                    email: cliente.email,
                    endereco: cliente.endereco
                })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Erro ao atualizar cliente:', error);
            throw error;
        }
    }

    async deletarCliente(id) {
        this.ensureReady();

        try {
            const { error } = await this.supabase
                .from('clientes')
                .delete()
                .eq('id', id);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Erro ao deletar cliente:', error);
            throw error;
        }
    }

    async obterCliente(id) {
        this.ensureReady();

        try {
            const { data, error } = await this.supabase
                .from('clientes')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Erro ao obter cliente:', error);
            throw error;
        }
    }    // OPERAÇÕES DE VENDAS
    async criarVenda(venda) {
        this.ensureReady();

        try {
            // Verificar se user_id está sendo usado
            let user = null;
            try {
                user = await this.authController.getCurrentUser();
            } catch (error) {
                console.warn('Não foi possível obter usuário, criando venda sem user_id');
            }

            // Iniciar transação para atualizar estoque
            const { data: produto } = await this.supabase
                .from('produtos')
                .select('quantidade')
                .eq('id', venda.produto_id)
                .single();

            if (!produto || produto.quantidade < venda.quantidade) {
                throw new Error('Estoque insuficiente');
            }

            // Preparar dados da venda
            const vendaData = {
                cliente_id: venda.cliente_id,
                produto_id: venda.produto_id,
                quantidade: venda.quantidade,
                valor_unitario: venda.valor_unitario || (venda.valor_total / venda.quantidade),
                valor_total: venda.valor_total,
                observacoes: venda.observacoes || null
            };

            // Adicionar user_id apenas se o usuário estiver disponível
            if (user) {
                vendaData.user_id = user.id;
            }

            // Criar venda
            const { data: vendaResult, error: vendaError } = await this.supabase
                .from('vendas')
                .insert([vendaData])
                .select()
                .single();

            if (vendaError) throw vendaError;

            // Atualizar estoque
            const novaQuantidade = produto.quantidade - venda.quantidade;
            const { error: estoqueError } = await this.supabase
                .from('produtos')
                .update({ quantidade: novaQuantidade })
                .eq('id', venda.produto_id);

            if (estoqueError) throw estoqueError;

            return vendaResult;
        } catch (error) {
            console.error('Erro ao criar venda:', error);
            throw error;
        }
    }

    async listarVendas() {
        this.ensureReady();

        try {
            const { data, error } = await this.supabase
                .from('vendas')
                .select(`
                    *,
                    clientes(nome),
                    produtos(nome),
                    pagamentos(
                        id,
                        metodo_pagamento,
                        status,
                        valor_total,
                        valor_pago,
                        data_vencimento,
                        data_pagamento,
                        data_ultimo_pagamento,
                        numero_parcelas,
                        observacoes
                    )
                `)
                .order('data_venda', { ascending: false }); if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Erro ao listar vendas:', error);
            throw error;
        }
    }

    async obterVendasPorPeriodo(dataInicio, dataFim) {
        this.ensureReady();

        try {
            const { data, error } = await this.supabase
                .from('vendas')
                .select(`
                    *,
                    clientes(nome),
                    produtos(nome),
                    pagamentos(
                        id,
                        metodo_pagamento,
                        status,
                        valor_total,
                        valor_pago,
                        data_vencimento,
                        data_pagamento,
                        data_ultimo_pagamento,
                        numero_parcelas,
                        observacoes
                    )
                `)
                .gte('data_venda', dataInicio)
                .lte('data_venda', dataFim)
                .order('data_venda', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Erro ao obter vendas por período:', error);
            throw error;
        }
    }

    // OPERAÇÕES DE PAGAMENTOS
    async criarPagamento(pagamento) {
        this.ensureReady();

        try {
            // Verificar se user_id está sendo usado
            let user = null;
            try {
                user = await this.authController.getCurrentUser();
            } catch (error) {
                console.warn('Não foi possível obter usuário, criando pagamento sem user_id');
            }

            // Preparar dados do pagamento
            const pagamentoData = {
                venda_id: pagamento.venda_id,
                valor_total: pagamento.valor_total,
                valor_pago: pagamento.valor_pago || 0,
                metodo_pagamento: pagamento.metodo_pagamento,
                data_vencimento: pagamento.data_vencimento,
                numero_parcelas: pagamento.numero_parcelas || 1,
                status: pagamento.status || 'pendente',
                observacoes: pagamento.observacoes
            };

            // Definir data_pagamento baseado no status
            if (pagamento.status === 'pago' && pagamento.data_pagamento) {
                pagamentoData.data_pagamento = pagamento.data_pagamento;
            } else if (pagamento.status === 'pago' && !pagamento.data_pagamento) {
                // Se está pago mas não tem data_pagamento, usar data atual
                pagamentoData.data_pagamento = new Date().toISOString().split('T')[0];
            }
            // Para status pendente, parcial, vencido, etc., data_pagamento fica null

            // Adicionar user_id apenas se o usuário estiver disponível
            if (user) {
                pagamentoData.user_id = user.id;
            }

            console.log('Database: Criando pagamento com dados:', pagamentoData);

            const { data, error } = await this.supabase
                .from('pagamentos')
                .insert([pagamentoData])
                .select()
                .single();

            if (error) throw error;

            console.log('Database: Pagamento criado:', data);
            return data;
        } catch (error) {
            console.error('Erro ao criar pagamento:', error);
            throw error;
        }
    }

    async listarPagamentos(filtros = {}) {
        this.ensureReady();

        try {
            let query = this.supabase
                .from('pagamentos')
                .select(`
                    *,
                    vendas(
                        id,
                        data_venda,
                        clientes(nome),
                        produtos(nome)
                    )
                `)
                .order('data_vencimento', { ascending: true });

            // Aplicar filtros
            if (filtros.status) {
                query = query.eq('status', filtros.status);
            }
            if (filtros.metodo_pagamento) {
                query = query.eq('metodo_pagamento', filtros.metodo_pagamento);
            }
            if (filtros.data_inicio) {
                query = query.gte('data_vencimento', filtros.data_inicio);
            }
            if (filtros.data_fim) {
                query = query.lte('data_vencimento', filtros.data_fim);
            }

            const { data, error } = await query;

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Erro ao listar pagamentos:', error);
            throw error;
        }
    }

    async obterPagamento(id) {
        this.ensureReady();

        try {
            const { data, error } = await this.supabase
                .from('pagamentos')
                .select(`
                    *,
                    vendas(
                        id,
                        data_venda,
                        clientes(nome),
                        produtos(nome)
                    )
                `)
                .eq('id', id)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Erro ao obter pagamento:', error);
            throw error;
        }
    }

    async atualizarPagamento(id, dadosAtualizacao) {
        this.ensureReady();

        try {
            const { data, error } = await this.supabase
                .from('pagamentos')
                .update(dadosAtualizacao)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Erro ao atualizar pagamento:', error);
            throw error;
        }
    }

    async listarPagamentosPorPeriodo(dataInicio, dataFim) {
        this.ensureReady();

        try {
            const { data, error } = await this.supabase
                .from('pagamentos')
                .select(`
                    *,
                    vendas(
                        id,
                        data_venda,
                        clientes(nome),
                        produtos(nome)
                    )
                `)
                .gte('data_vencimento', dataInicio)
                .lte('data_vencimento', dataFim)
                .order('data_vencimento', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Erro ao obter pagamentos por período:', error);
            throw error;
        }
    }

    // OPERAÇÕES DE PARCELAS
    async criarParcelas(parcelas) {
        this.ensureReady();

        try {
            const user = await this.authController.getCurrentUser();
            if (!user) throw new Error('Usuário não autenticado');

            const parcelasComUser = parcelas.map(parcela => ({
                ...parcela,
                user_id: user.id
            }));

            const { data, error } = await this.supabase
                .from('parcelas')
                .insert(parcelasComUser)
                .select();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Erro ao criar parcelas:', error);
            throw error;
        }
    }

    async listarParcelasPorPagamento(pagamentoId) {
        this.ensureReady();

        try {
            const { data, error } = await this.supabase
                .from('parcelas')
                .select('*')
                .eq('pagamento_id', pagamentoId)
                .order('numero_parcela');

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Erro ao listar parcelas:', error);
            throw error;
        }
    }

    async atualizarParcela(id, dadosAtualizacao) {
        this.ensureReady();

        try {
            const { data, error } = await this.supabase
                .from('parcelas')
                .update(dadosAtualizacao)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Erro ao atualizar parcela:', error);
            throw error;
        }
    }

    // OPERAÇÕES DE HISTÓRICO DE PAGAMENTOS
    async criarHistoricoPagamento(historico) {
        this.ensureReady();

        try {
            const user = await this.authController.getCurrentUser();
            if (!user) throw new Error('Usuário não autenticado');

            const { data, error } = await this.supabase
                .from('historico_pagamentos')
                .insert([{
                    pagamento_id: historico.pagamento_id,
                    valor_pago: historico.valor_pago,
                    metodo_pagamento: historico.metodo_pagamento,
                    data_pagamento: historico.data_pagamento,
                    observacoes: historico.observacoes,
                    user_id: user.id
                }])
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Erro ao criar histórico de pagamento:', error);
            throw error;
        }
    }

    async listarHistoricoPagamento(pagamentoId) {
        this.ensureReady();

        try {
            const { data, error } = await this.supabase
                .from('historico_pagamentos')
                .select('*')
                .eq('pagamento_id', pagamentoId)
                .order('data_pagamento', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Erro ao listar histórico de pagamento:', error);
            throw error;
        }
    }

    // MÉTODOS UTILITÁRIOS
    async verificarConexao() {
        try {
            const { data, error } = await this.supabase
                .from('produtos')
                .select('count')
                .limit(1);

            return !error;
        } catch (error) {
            console.error('Erro na verificação de conexão:', error);
            return false;
        }
    }

    // Método para sincronizar dados offline (futuro)
    async sincronizarDados() {
        // Implementar sincronização se necessário
        console.log('Sincronização de dados não implementada ainda');
    }

    // MÉTODOS DE DEBUG E DIAGNÓSTICO
    async verificarTabelasPagamentos() {
        this.ensureReady();

        try {
            console.log('Verificando existência das tabelas de pagamentos...');

            // Testar se consegue fazer uma query na tabela pagamentos
            const { data: pagamentos, error: errorPagamentos } = await this.supabase
                .from('pagamentos')
                .select('count')
                .limit(1);

            console.log('Tabela pagamentos:', errorPagamentos ? 'ERRO - ' + errorPagamentos.message : 'OK');

            // Testar se consegue fazer uma query na tabela parcelas
            const { data: parcelas, error: errorParcelas } = await this.supabase
                .from('parcelas')
                .select('count')
                .limit(1);

            console.log('Tabela parcelas:', errorParcelas ? 'ERRO - ' + errorParcelas.message : 'OK');

            // Testar se consegue fazer uma query na tabela historico_pagamentos
            const { data: historico, error: errorHistorico } = await this.supabase
                .from('historico_pagamentos')
                .select('count')
                .limit(1);

            console.log('Tabela historico_pagamentos:', errorHistorico ? 'ERRO - ' + errorHistorico.message : 'OK');

            // Testar join entre vendas e pagamentos
            const { data: vendasComPagamentos, error: errorJoin } = await this.supabase
                .from('vendas')
                .select(`
                    id,
                    data_venda,
                    pagamentos(id, metodo_pagamento, status)
                `)
                .limit(5);

            console.log('Join vendas-pagamentos:', errorJoin ? 'ERRO - ' + errorJoin.message : 'OK');
            console.log('Amostra de vendas com pagamentos:', vendasComPagamentos);

            return {
                pagamentos: !errorPagamentos,
                parcelas: !errorParcelas,
                historico: !errorHistorico,
                join: !errorJoin,
                amostraVendas: vendasComPagamentos
            };

        } catch (error) {
            console.error('Erro ao verificar tabelas:', error);
            return {
                erro: error.message
            };
        }
    }
}

// Exportar para uso global
window.DatabaseController = DatabaseController;

// Funções globais para compatibilidade (usar controller quando disponível)
async function criarVenda(venda) {
    try {
        // Tentar usar o controller primeiro
        if (window.app && window.app.databaseController && window.app.databaseController.isReady) {
            return await window.app.databaseController.criarVenda(venda);
        }

        // Fallback: implementação direta (sem user_id)
        console.log('Criando venda (fallback):', venda);

        const vendaLimpa = {
            cliente_id: venda.cliente_id,
            produto_id: venda.produto_id,
            quantidade: venda.quantidade,
            valor_unitario: venda.valor_unitario || (venda.valor_total / venda.quantidade),
            valor_total: venda.valor_total,
            data_venda: venda.data_venda || new Date().toISOString(),
            observacoes: venda.observacoes || null
        };

        const { data, error } = await supabase
            .from('vendas')
            .insert([vendaLimpa])
            .select();

        if (error) {
            console.error('Erro na query de criação de venda:', error);
            throw error;
        }

        console.log('Venda criada com sucesso:', data);
        return data[0];
    } catch (error) {
        console.error('Erro ao criar venda:', error);
        throw error;
    }
}

async function criarProduto(produto) {
    try {
        // Tentar usar o controller primeiro
        if (window.app && window.app.databaseController && window.app.databaseController.isReady) {
            return await window.app.databaseController.criarProduto(produto);
        }

        // Fallback: implementação direta (sem user_id)
        console.log('Criando produto (fallback):', produto);

        const produtoLimpo = {
            nome: produto.nome,
            quantidade: produto.quantidade,
            preco: produto.preco
        };

        const { data, error } = await supabase
            .from('produtos')
            .insert([produtoLimpo])
            .select();

        if (error) {
            console.error('Erro na query de criação de produto:', error);
            throw error;
        }

        console.log('Produto criado com sucesso:', data);
        return data[0];
    } catch (error) {
        console.error('Erro ao criar produto:', error);
        throw error;
    }
}

async function criarCliente(cliente) {
    try {
        // Tentar usar o controller primeiro
        if (window.app && window.app.databaseController && window.app.databaseController.isReady) {
            return await window.app.databaseController.criarCliente(cliente);
        }

        // Fallback: implementação direta (sem user_id)
        console.log('Criando cliente (fallback):', cliente);

        const clienteLimpo = {
            nome: cliente.nome,
            telefone: cliente.telefone || null,
            email: cliente.email || null,
            endereco: cliente.endereco || null
        };

        const { data, error } = await supabase
            .from('clientes')
            .insert([clienteLimpo])
            .select();

        if (error) {
            console.error('Erro na query de criação de cliente:', error);
            throw error;
        }

        console.log('Cliente criado com sucesso:', data);
        return data[0];
    } catch (error) {
        console.error('Erro ao criar cliente:', error);
        throw error;
    }
}

async function criarPagamento(pagamento) {
    try {
        // Tentar usar o controller primeiro
        if (window.app && window.app.databaseController && window.app.databaseController.isReady) {
            return await window.app.databaseController.criarPagamento(pagamento);
        }

        // Fallback: implementação direta (sem user_id)
        console.log('Criando pagamento (fallback):', pagamento); const pagamentoLimpo = {
            venda_id: pagamento.venda_id,
            metodo_pagamento: pagamento.metodo_pagamento,
            status: pagamento.status || 'pendente',
            valor_total: pagamento.valor_total,
            valor_pago: pagamento.valor_pago || 0,
            data_vencimento: pagamento.data_vencimento || null,
            numero_parcelas: pagamento.numero_parcelas || 1,
            observacoes: pagamento.observacoes || null
        };

        // Definir data_pagamento apenas se status for pago
        if (pagamento.status === 'pago' && pagamento.data_pagamento) {
            pagamentoLimpo.data_pagamento = pagamento.data_pagamento;
        } else if (pagamento.status === 'pago' && !pagamento.data_pagamento) {
            // Se está pago mas não tem data_pagamento, usar data atual
            pagamentoLimpo.data_pagamento = new Date().toISOString().split('T')[0];
        }
        // Para outros status, data_pagamento fica null (não definido)

        const { data, error } = await supabase
            .from('pagamentos')
            .insert([pagamentoLimpo])
            .select();

        if (error) {
            console.error('Erro na query de criação de pagamento:', error);
            throw error;
        }

        console.log('Pagamento criado com sucesso:', data);
        return data[0];
    } catch (error) {
        console.error('Erro ao criar pagamento:', error);
        throw error;
    }
}

// Funções de listagem para compatibilidade
async function listarClientes() {
    try {
        if (window.app && window.app.databaseController && window.app.databaseController.isReady) {
            return await window.app.databaseController.listarClientes();
        }

        const { data, error } = await supabase
            .from('clientes')
            .select('*')
            .order('nome');

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Erro ao listar clientes:', error);
        throw error;
    }
}

async function listarProdutos() {
    try {
        if (window.app && window.app.databaseController && window.app.databaseController.isReady) {
            return await window.app.databaseController.listarProdutos();
        }

        const { data, error } = await supabase
            .from('produtos')
            .select('*')
            .order('nome');

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Erro ao listar produtos:', error);
        throw error;
    }
}

async function listarVendas() {
    try {
        if (window.app && window.app.databaseController && window.app.databaseController.isReady) {
            return await window.app.databaseController.listarVendas();
        }

        // Fallback: query simples sem joins complexos
        const { data, error } = await supabase
            .from('vendas')
            .select('*')
            .order('data_venda', { ascending: false });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Erro ao listar vendas:', error);
        throw error;
    }
}
