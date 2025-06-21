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
            const user = await this.authController.getCurrentUser();
            if (!user) throw new Error('Usuário não autenticado');

            const { data, error } = await this.supabase
                .from('produtos')
                .insert([{
                    nome: produto.nome,
                    quantidade: produto.quantidade,
                    preco: produto.preco,
                    user_id: user.id
                }])
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
    }

    // OPERAÇÕES DE CLIENTES
    async criarCliente(cliente) {
        this.ensureReady();

        try {
            const user = await this.authController.getCurrentUser();
            if (!user) throw new Error('Usuário não autenticado');

            const { data, error } = await this.supabase
                .from('clientes')
                .insert([{
                    nome: cliente.nome,
                    telefone: cliente.telefone,
                    email: cliente.email || null,
                    endereco: cliente.endereco || null,
                    user_id: user.id
                }])
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
    }

    // OPERAÇÕES DE VENDAS
    async criarVenda(venda) {
        this.ensureReady();

        try {
            const user = await this.authController.getCurrentUser();
            if (!user) throw new Error('Usuário não autenticado');

            // Iniciar transação para atualizar estoque
            const { data: produto } = await this.supabase
                .from('produtos')
                .select('quantidade')
                .eq('id', venda.produto_id)
                .single();

            if (!produto || produto.quantidade < venda.quantidade) {
                throw new Error('Estoque insuficiente');
            }

            // Criar venda
            const { data: vendaData, error: vendaError } = await this.supabase
                .from('vendas')
                .insert([{
                    cliente_id: venda.cliente_id,
                    produto_id: venda.produto_id,
                    quantidade: venda.quantidade,
                    valor_unitario: venda.valor_unitario,
                    valor_total: venda.valor_total,
                    user_id: user.id
                }])
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

            return vendaData;
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
                    produtos(nome)
                `)
                .order('data_venda', { ascending: false });

            if (error) throw error;
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
                    produtos(nome)
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
            const user = await this.authController.getCurrentUser();
            if (!user) throw new Error('Usuário não autenticado');

            const { data, error } = await this.supabase
                .from('pagamentos')
                .insert([{
                    venda_id: pagamento.venda_id,
                    valor_total: pagamento.valor_total,
                    valor_pago: pagamento.valor_pago,
                    metodo_pagamento: pagamento.metodo_pagamento,
                    data_vencimento: pagamento.data_vencimento,
                    numero_parcelas: pagamento.numero_parcelas,
                    status: pagamento.status,
                    observacoes: pagamento.observacoes,
                    user_id: user.id
                }])
                .select()
                .single();

            if (error) throw error;
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
}

// Exportar para uso global
window.DatabaseController = DatabaseController;
