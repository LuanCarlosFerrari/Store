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
