// Classe principal para gerenciar a navegação e inicialização
class AppController {
    constructor() {
        this.authInitialized = false;
        this.dataSelecionada = null; // Data selecionada para filtro
        this.waitForAuth();
    }

    async waitForAuth() {
        // Aguardar o auth controller estar disponível
        let attempts = 0;
        const maxAttempts = 30; // Reduzido de 50 para 30

        const checkAuth = async () => {
            if (window.authController && window.authController.isInitialized && attempts < maxAttempts) {
                await this.initApp();
            } else if (attempts < maxAttempts) {
                attempts++;
                setTimeout(checkAuth, 100);
            } else {
                console.warn('Auth controller não carregado completamente, iniciando sem auth');
                this.initApp(); // Inicializar mesmo sem auth para desenvolvimento
            }
        };

        checkAuth();
    }

    async initApp() {
        if (this.authInitialized) return; // Evitar dupla inicialização

        // Verificar autenticação apenas uma vez na inicialização
        if (window.authController && window.authController.supabase) {
            // Usar verificação silenciosa para não interromper o fluxo
            const isAuthenticated = await window.authController.isAuthenticatedSilent();
            if (!isAuthenticated) {
                // Fazer uma verificação final antes de redirecionar
                const finalCheck = await window.authController.isAuthenticated();
                if (!finalCheck) {
                    window.location.href = 'login.html';
                    return;
                }
            }

            // Configurar auth para ser menos agressivo após a inicialização
            window.authController.configure({
                maxAuthChecks: 1, // Reduzir verificações automáticas
                authCheckInterval: 30000 // Aumentar intervalo para 30 segundos
            });

            // Exibir informações do usuário apenas uma vez
            await this.displayUserInfo();
        }

        this.initNavigation();
        await this.initControllers();
        this.authInitialized = true;

        // Configurar atualização periódica do dashboard (a cada 30 segundos)
        this.dashboardInterval = setInterval(async () => {
            if (document.getElementById('dashboard') && !document.getElementById('dashboard').classList.contains('hidden')) {
                await this.atualizarDashboard();
            }
        }, 30000);

        console.log('App: Inicialização completa');
    }

    async displayUserInfo() {
        if (window.authController) {
            const user = await window.authController.getCurrentUser();
            const userEmailEl = document.getElementById('userEmail');
            if (user && userEmailEl) {
                userEmailEl.textContent = `Logado como: ${user.email}`;
            }
        }
    }

    async initNavigation() {
        // Mostrar dashboard por padrão
        await this.mostrarAba('dashboard');

        // Configurar data de hoje no seletor
        this.configurarSeletorData();

        // Tentar atualizar dashboard após um pequeno delay para garantir que tudo está carregado
        setTimeout(async () => {
            await this.atualizarDashboard();
        }, 1000);
    }

    configurarSeletorData() {
        const inputData = document.getElementById('dataSelecionada');
        if (inputData) {
            // Definir data de hoje como padrão
            const hoje = new Date().toISOString().split('T')[0];
            inputData.value = hoje;
            inputData.max = hoje; // Não permitir datas futuras
        }
    } async initControllers() {
        // Inicializar database controller primeiro
        if (window.authController) {
            this.databaseController = new DatabaseController(window.authController);

            // Aguardar database estar pronto
            await this.waitForDatabase();
        }        // Inicializar controladores na ordem correta, passando database
        this.produtoController = new ProdutoController(this.databaseController);
        this.clienteController = new ClienteController(this.databaseController);
        this.pagamentoController = new PagamentoController(this.databaseController);
        this.pagamentosInterface = new PagamentosInterfaceController(this.pagamentoController, this);
        this.vendaController = new VendaController(
            this.produtoController,
            this.clienteController,
            this.databaseController,
            this.pagamentoController,
            this
        );

        // Tornar disponível globalmente
        window.pagamentosInterface = this.pagamentosInterface;

        // Atualizar selects iniciais
        setTimeout(() => {
            this.produtoController.atualizarSelectProdutos();
            this.clienteController.atualizarSelectClientes();
        }, 500); // Aumentado para 500ms para dar tempo ao database

        // Forçar atualização do dashboard após todos os controladores estarem prontos
        console.log('App: Todos os controladores inicializados, atualizando dashboard...');
        setTimeout(async () => {
            await this.atualizarDashboard();
        }, 1000);
    }

    async waitForDatabase() {
        if (!this.databaseController) return;

        let attempts = 0;
        const maxAttempts = 20;

        while (!this.databaseController.isReady && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }

        if (!this.databaseController.isReady) {
            console.warn('Database não ficou pronto no tempo esperado');
        }
    }

    async mostrarAba(abaId) {
        // Ocultar todas as abas
        document.querySelectorAll('.aba').forEach(aba => {
            aba.classList.add('hidden');
        });

        // Mostrar a aba selecionada
        const abaAtiva = document.getElementById(abaId);
        if (abaAtiva) {
            abaAtiva.classList.remove('hidden');
        }

        // Atualizar estado dos links da sidebar
        document.querySelectorAll('aside a').forEach(link => {
            link.classList.remove('bg-gray-700');
        });

        const linkAtivo = document.getElementById(`nav-${abaId}`);
        if (linkAtivo) {
            linkAtivo.classList.add('bg-gray-700');
        }        // Atualizar selects quando mostrar a aba de vendas
        if (abaId === 'caixa' && this.vendaController) {
            this.vendaController.atualizarSelects();
        }

        // Carregar pagamentos quando mostrar a aba de pagamentos
        if (abaId === 'pagamentos' && this.pagamentosInterface) {
            this.pagamentosInterface.carregarPagamentos();
        }

        // Atualizar dashboard quando mostrá-lo
        if (abaId === 'dashboard') {
            await this.atualizarDashboard();
        }
    }

    async atualizarDashboard() {
        console.log('App: Atualizando dashboard...');

        // Mostrar indicador de carregamento
        const loadingIndicator = document.getElementById('dashboard-loading');
        if (loadingIndicator) {
            loadingIndicator.classList.remove('hidden');
        }

        if (!this.produtoController || !this.clienteController) {
            console.log('App: Controladores não disponíveis ainda, tentando novamente em 2s...');
            if (loadingIndicator) {
                loadingIndicator.classList.add('hidden');
            }
            setTimeout(() => this.atualizarDashboard(), 2000);
            return;
        }

        try {
            // Atualizar total de produtos
            const produtos = this.produtoController.obterTodos();
            const totalProdutos = produtos.reduce((total, produto) => total + produto.quantidade, 0);
            const totalProdutosEl = document.getElementById('total-produtos');
            if (totalProdutosEl) {
                totalProdutosEl.textContent = totalProdutos;
            }

            // Atualizar total de clientes
            const clientes = this.clienteController.obterTodos();
            const totalClientesEl = document.getElementById('total-clientes');
            if (totalClientesEl) {
                totalClientesEl.textContent = clientes.length;
            }

            // Carregar vendas diretamente do banco de dados
            let vendas = [];

            // Verificar se database está pronto e tentar carregar vendas
            if (this.databaseController && this.databaseController.isReady) {
                console.log('App: Carregando vendas do banco...');
                try {
                    vendas = await this.databaseController.listarVendas();
                    console.log('App: Vendas carregadas:', vendas.length);
                } catch (error) {
                    console.error('App: Erro ao carregar vendas do banco:', error);
                    // Tentar usar dados do VendaController como fallback
                    if (this.vendaController && this.vendaController.vendas) {
                        vendas = this.vendaController.vendas;
                        console.log('App: Usando vendas do VendaController como fallback');
                    }
                }
            } else {
                console.log('App: Database não disponível, usando dados do VendaController');
                // Fallback: usar dados do vendaController se disponível
                if (this.vendaController && this.vendaController.vendas) {
                    vendas = this.vendaController.vendas;
                } else {
                    // Se nem o database nem o vendaController estão prontos, tentar novamente em 2s
                    console.log('App: Nenhuma fonte de dados disponível, tentando novamente em 2s...');
                    if (loadingIndicator) {
                        loadingIndicator.classList.add('hidden');
                    }
                    setTimeout(() => this.atualizarDashboard(), 2000);
                    return;
                }
            }

            // Atualizar vendas da data selecionada
            const dataFiltro = this.dataSelecionada || new Date().toISOString().split('T')[0];
            const vendasFiltradas = vendas.filter(venda => {
                const dataVenda = new Date(venda.data_venda).toISOString().split('T')[0];
                return dataVenda === dataFiltro;
            });

            const totalVendasData = vendasFiltradas.reduce((total, venda) => total + venda.valor_total, 0);
            const vendasDiaEl = document.getElementById('vendas-dia');
            if (vendasDiaEl) {
                vendasDiaEl.textContent = this.formatarMoeda(totalVendasData);
            }

            // Atualizar display da data selecionada
            const dataDisplayEl = document.getElementById('data-selecionada-display');
            if (dataDisplayEl) {
                if (this.dataSelecionada) {
                    const dataFormatada = new Date(this.dataSelecionada + 'T00:00:00').toLocaleDateString('pt-BR');
                    dataDisplayEl.textContent = dataFormatada;
                } else {
                    dataDisplayEl.textContent = 'Hoje';
                }
            }

            // Atualizar tabela de últimas vendas (mostrar as da data selecionada ou as 5 mais recentes)
            const vendasParaTabela = this.dataSelecionada ? vendasFiltradas.slice(0, 10) : vendas.slice(0, 5);
            this.atualizarUltimasVendas(vendasParaTabela);

            console.log('App: Dashboard atualizado com sucesso');

        } catch (error) {
            console.error('App: Erro ao atualizar dashboard:', error);
            // Tentar novamente em caso de erro
            setTimeout(() => this.atualizarDashboard(), 3000);
        } finally {
            // Ocultar indicador de carregamento
            if (loadingIndicator) {
                loadingIndicator.classList.add('hidden');
            }
        }
    }

    atualizarUltimasVendas(vendas) {
        const tbody = document.getElementById('dashboard-vendas');
        const tituloVendas = document.getElementById('titulo-vendas');
        const resumoVendas = document.getElementById('resumo-vendas');
        const totalVendasData = document.getElementById('total-vendas-data');
        const valorTotalData = document.getElementById('valor-total-data');

        if (!tbody) return;

        // Atualizar título da tabela
        if (tituloVendas) {
            if (this.dataSelecionada) {
                const dataFormatada = new Date(this.dataSelecionada + 'T00:00:00').toLocaleDateString('pt-BR');
                tituloVendas.textContent = `Vendas de ${dataFormatada}`;
            } else {
                tituloVendas.textContent = 'Últimas Vendas';
            }
        }

        // Mostrar/ocultar resumo
        if (resumoVendas) {
            if (this.dataSelecionada && vendas.length > 0) {
                resumoVendas.classList.remove('hidden');
                if (totalVendasData) {
                    totalVendasData.textContent = `${vendas.length} venda${vendas.length > 1 ? 's' : ''}`;
                }
                if (valorTotalData) {
                    const valorTotal = vendas.reduce((total, venda) => total + venda.valor_total, 0);
                    valorTotalData.textContent = this.formatarMoeda(valorTotal);
                }
            } else {
                resumoVendas.classList.add('hidden');
            }
        }

        if (vendas.length === 0) {
            const mensagem = this.dataSelecionada ?
                'Nenhuma venda registrada para esta data' :
                'Nenhuma venda registrada';
            tbody.innerHTML = `<tr><td colspan="5" class="py-4 px-2 text-center text-gray-500">${mensagem}</td></tr>`;
            return;
        }

        tbody.innerHTML = vendas.map(venda => {
            const dataFormatada = new Date(venda.data_venda).toLocaleDateString('pt-BR');
            const clienteNome = venda.clientes?.nome || 'Cliente não encontrado';
            const produtoNome = venda.produtos?.nome || 'Produto não encontrado';
            const quantidade = venda.quantidade || 1;

            return `
                <tr class="hover:bg-gray-100">
                    <td class="py-2 px-2">${dataFormatada}</td>
                    <td class="py-2 px-2">${clienteNome}</td>
                    <td class="py-2 px-2">${produtoNome}</td>
                    <td class="py-2 px-2">${quantidade}</td>
                    <td class="py-2 px-2">${this.formatarMoeda(venda.valor_total)}</td>
                </tr>
            `;
        }).join('');
    }

    // Método de debug para verificar estado do sistema
    debugStatus() {
        console.log('=== STATUS DO SISTEMA ===');
        console.log('App inicializado:', this.authInitialized);
        console.log('Database Controller:', !!this.databaseController);
        console.log('Database Ready:', this.databaseController?.isReady);
        console.log('Produto Controller:', !!this.produtoController);
        console.log('Cliente Controller:', !!this.clienteController);
        console.log('Venda Controller:', !!this.vendaController);
        console.log('Auth Controller:', !!window.authController);
        console.log('Supabase:', !!window.authController?.supabase);
        console.log('Vendas carregadas:', this.vendaController?.vendas?.length || 0);
        console.log('==========================');
    }

    // Métodos para filtro por data
    async definirDataSelecionada(data) {
        console.log('App: Definindo data selecionada:', data);
        this.dataSelecionada = data;

        // Atualizar o input de data no HTML
        const inputData = document.getElementById('dataSelecionada');
        if (inputData) {
            inputData.value = data || '';
        }

        // Atualizar dashboard com a nova data
        await this.atualizarDashboard();
    }

    async resetarFiltroData() {
        console.log('App: Resetando filtro de data');
        this.dataSelecionada = null;

        // Limpar o input de data no HTML
        const inputData = document.getElementById('dataSelecionada');
        if (inputData) {
            inputData.value = '';
        }

        // Atualizar dashboard sem filtro
        await this.atualizarDashboard();
    }

    // Método público para permitir que outros componentes solicitem atualização
    async forcarAtualizacaoDashboard() {
        console.log('App: Atualização forçada do dashboard solicitada');
        await this.atualizarDashboard();
    }

    // Métodos utilitários
    formatarMoeda(valor) {
        return `R$ ${valor.toFixed(2).replace('.', ',')}`;
    }

    formatarData(data) {
        if (data instanceof Date) {
            return data.toLocaleDateString('pt-BR');
        }
        return data;
    }

    // Relatórios simples
    gerarRelatorioEstoque() {
        const produtos = this.produtoController.obterTodos();
        const estoqueTotal = produtos.reduce((total, produto) => total + (produto.quantidade * produto.preco), 0);

        console.log('=== RELATÓRIO DE ESTOQUE ===');
        console.log(`Total de produtos: ${produtos.length}`);
        console.log(`Valor total em estoque: ${this.formatarMoeda(estoqueTotal)}`);
        produtos.forEach(produto => {
            console.log(`${produto.nome}: ${produto.quantidade} unidades - ${this.formatarMoeda(produto.preco)} cada`);
        });
    }

    gerarRelatorioVendas() {
        const totalVendas = this.vendaController.calcularTotalVendas();
        const numeroVendas = this.vendaController.vendas.length;

        console.log('=== RELATÓRIO DE VENDAS ===');
        console.log(`Total de vendas: ${numeroVendas}`);
        console.log(`Valor total vendido: ${this.formatarMoeda(totalVendas)}`);

        if (numeroVendas > 0) {
            console.log(`Ticket médio: ${this.formatarMoeda(totalVendas / numeroVendas)}`);
        }
    }
}

// Função global para compatibilidade com o HTML existente
async function mostrarAba(abaId) {
    if (window.app) {
        await window.app.mostrarAba(abaId);
    }
}

// Função global para filtrar vendas por data
async function filtrarVendasPorData() {
    const inputData = document.getElementById('dataSelecionada');
    if (window.app && inputData) {
        const dataSelecionada = inputData.value || null;
        await window.app.definirDataSelecionada(dataSelecionada);
    }
}

// Função global para resetar filtro de data
async function resetarFiltroData() {
    if (window.app) {
        await window.app.resetarFiltroData();
    }
}

// Função global para debug
function debugSystem() {
    if (window.app) {
        window.app.debugStatus();
    } else {
        console.log('Sistema ainda não inicializado');
    }
}

// Função global para forçar atualização do dashboard
async function atualizarDashboard() {
    if (window.app) {
        await window.app.atualizarDashboard();
    } else {
        console.log('Sistema ainda não inicializado');
    }
}

// Inicializar aplicação quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    window.app = new AppController();
});
